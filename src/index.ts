import { config } from "./config";
import { getCollections, getDefaultLocationId, getProducts, moveProducts } from "./shopify";
import { Collection, Product } from "./types";
import { sleep } from "./utils";

const getFirstAvailableProductPosition = (products: Product[]) => {
  const firstAvailableProductIndex = products.reverse().findIndex(product => product.totalInventory > 0);
  if (firstAvailableProductIndex === -1) return null;
  return products.length - firstAvailableProductIndex;
}

const getProductsToMove = (products: Product[], firstAvailableProductPosition: number) => {
  const productsToMove: Product[] = []
  for (const [index, product] of products.reverse().entries()) {
    const productPosition = index + 1
    if (product.totalInventory === 0 && productPosition < firstAvailableProductPosition) {
      productsToMove.push(product)
    }
  }
  return productsToMove;
}

const reOrderCollection = async (collection: Collection, locationId) => {
  console.info(`📦 Reordering collection: ${collection.handle}`)

  if (collection.sortOrder !== 'MANUAL') {
    console.info(`    ❌ Collection is not set to manual order: ${collection.sortOrder}`)
    return;
  }

  const products = await getProducts(collection.id, locationId);

  const firstAvailableProductPosition = getFirstAvailableProductPosition(products)
  if (!firstAvailableProductPosition) return;
  console.info(`    First available product position: ${firstAvailableProductPosition}`)

  const productsToMove = getProductsToMove(products, firstAvailableProductPosition);

  if (productsToMove.length === 0) {
    console.info('    ☑️ No products to move');
    return;
  }
  await moveProducts(collection.id, productsToMove.map(product => product.id), firstAvailableProductPosition - 1);
  console.info(`    ✅ Moved ${productsToMove.length} products`);
}

const start = async () => {
  const locationId = config.locationId ?? await getDefaultLocationId();

  const collections = await getCollections();
  console.info(`Retrieved ${collections.length} collections`)

  const productCollections = collections.filter(collection => collection.productsCount > 0);
  console.info(`Found ${productCollections.length} product collections`)

  for (const collection of productCollections) {
    await reOrderCollection(collection, locationId)
    await sleep(500)
  }
}

start();
