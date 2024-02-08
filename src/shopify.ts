import { GraphQLClient, gql } from 'graphql-request';
import fetch from 'cross-fetch';
import { z } from 'zod';
import { config } from './config';
import { Collection, CollectionSchema, Product, ProductSchema } from './types';
import { sleep } from './utils';

const client = new GraphQLClient(config.graphql.endpoint, {
  fetch,
  headers: {
    'Content-Type': 'application/graphql',
    'X-Shopify-Access-Token': config.accessToken,
  },
});

const GET_COLLECTIONS = gql`
  query GET_COLLECTIONS($after: String) {
    collections(after: $after, first: 10) {
      nodes {
        id
        productsCount
        title
        handle
        sortOrder
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const PageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  endCursor: z.string().optional(),
});

const GetCollectionsSchema = z.object({
  collections: z.object({
    nodes: z.array(CollectionSchema),
    pageInfo: PageInfoSchema,
  }),
});

export const getCollections = async (endCursor?: string) => {
  const allCollections: Collection[] = []
  const result = await client.request(GET_COLLECTIONS, { after: endCursor });
  const { collections } = GetCollectionsSchema.parse(result);

  allCollections.push(...collections.nodes);

  if (collections.pageInfo.hasNextPage) {
    const nextProducts = await getCollections(collections.pageInfo.endCursor);
    await sleep(500)
    allCollections.push(...nextProducts);
  }

  return allCollections;
}


const GetProductsSchema = z.object({
  collection: z.object({
    products: z.object({
      nodes: z.array(ProductSchema),
      pageInfo: PageInfoSchema,
    }),
  }),
});


const GET_PRODUCTS = gql`
  query GET_PRODUCTS($collectionId: ID!, $sortKey: ProductCollectionSortKeys,$after: String, $first: Int, $locationId: ID!) {
    collection(id: $collectionId) {
      products(sortKey: $sortKey, first: $first, after: $after) {
        nodes {
          id
          title
          handle
          publishedAt
          totalInventory
          variants(first: 250) {
            nodes {
              inventoryItem {
                inventoryLevel(locationId: $locationId) {
                  quantities(names: ["available"]) {
                    name
                    quantity
                  }
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export const getProducts = async (collectionId: string, locationId: string, sortKey: string = 'MANUAL', endCursor?: string): Promise<Product[]> => {
  const allProducts: Product[] = []
  const result = await client.request(GET_PRODUCTS, { collectionId, sortKey: sortKey.toUpperCase(), first: 250, after: endCursor, locationId });
  const { collection } = GetProductsSchema.parse(result);

  allProducts.push(...collection.products.nodes);

  if (collection.products.pageInfo.hasNextPage) {
    const nextProducts = await getProducts(collectionId, locationId, sortKey, collection.products.pageInfo.endCursor);
    allProducts.push(...nextProducts);
  }

  return allProducts.map(product => ({
    ...product,
    totalInventory: product.variants.nodes.reduce((sum, variant) => sum + variant.inventoryItem.inventoryLevel.quantities[0].quantity, 0),
  }));
}

const MOVE_PRODUCTS = gql`
    mutation MOVE_PRODUCTS($collectionId: ID!, $moves: [MoveInput!]!) {
      collectionReorderProducts(id: $collectionId, moves: $moves) {
        userErrors {
          field
          message
        }
        job {
          id
        }
      }
    }
  `;

const MoveProductsSchema = z.object({
  collectionReorderProducts: z.object({
    userErrors: z.array(z.object({
      field: z.string(),
      message: z.string(),
    })),
  })
});
export const moveProducts = async (collectionId: string, productIds: string[], index: number) => {
  const batchSize = 250;

  let startIndex = 0;
  while (startIndex < productIds.length) {
    const batchIds = productIds.slice(startIndex, startIndex + batchSize);
    const moves = batchIds.map(productId => ({ id: productId, newPosition: (index + startIndex).toString() }));

    const result = await client.request(MOVE_PRODUCTS, { collectionId, moves });
    const { collectionReorderProducts } = MoveProductsSchema.parse(result);

    if (collectionReorderProducts.userErrors.length > 0) {
      console.error('❌ Error moving products:', collectionReorderProducts.userErrors);
      throw new Error('Error moving products');
    }
    startIndex += batchSize;
  }
}


const GET_DEFAULT_LOCATION = gql`
  query GET_DEFAULT_LOCATION {
    shop {
      fulfillmentServices {
        location {
          id
        }
      }
    }
  }
`;

const GetLocationsSchema = z.object({
  shop: z.object({
    fulfillmentServices: z.array(z.object({
      location: z.object({
        id: z.string(),
      }),
    })),
  }),
});

export const getDefaultLocationId = async () => {
  const result = await client.request(GET_DEFAULT_LOCATION);
  const { shop } = GetLocationsSchema.parse(result);
  return shop.fulfillmentServices[0].location.id;
}


