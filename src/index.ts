import { config } from "./config";
import { getCollections, getDefaultLocationId, getProducts, moveProducts } from "./shopify";
import { CollectionConfig, PinnedProductConfig, SortCollection, SortConfig, loadSortConfig } from "./sort-config";
import { Collection, Product } from "./types";
import { sleep } from "./utils";

const UnsortableSortConfigs = [SortCollection.BestSelling]

const compareProducts = (collectionConfig: CollectionConfig) => (a: Product, b: Product) => {
  if (collectionConfig.sort === SortCollection.Stock) {
    return b.totalInventory - a.totalInventory;
  }

  if (collectionConfig.moveUnavailableToEnd) {
    if (a.totalInventory === 0 && b.totalInventory > 0) return 1;
    if (b.totalInventory === 0 && a.totalInventory > 0) return -1;
  }

  if (collectionConfig.sort === SortCollection.PublishDate) {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  }

  return 0;
}

const reOrderCollectionWithPinned = (pinnedProductsConfigs: PinnedProductConfig[], products: Product[]) => {
  const pinnedProducts = products.filter(product => pinnedProductsConfigs.some(pinnedProduct => pinnedProduct.handle === product.handle));

  const updatedProducts = products.filter(product => !pinnedProductsConfigs.some(pinnedProduct => pinnedProduct.handle === product.handle));
  for (const pinnedProductConfig of pinnedProductsConfigs) {
    const product = pinnedProducts.find(product => product.handle === pinnedProductConfig.handle);
    if (product) {
      updatedProducts.splice(pinnedProductConfig.position - 1, 0, product);
    }
  }

  return updatedProducts;
}

const reOrderCollection = async (collection: Collection, locationId, collectionConfig: CollectionConfig) => {
  console.info(`📦 Reordering collection: ${collection.handle}`)

  if (collection.sortOrder !== 'MANUAL') {
    console.info(`    ❌ Collection is not set to manual order: ${collection.sortOrder}`)
    return;
  }

  const products = await getProducts(collection.id, locationId);
  const sortedProducts =
    typeof collectionConfig.sort !== 'boolean' && UnsortableSortConfigs.includes(collectionConfig.sort)
      ? await getProducts(collection.id, locationId, collectionConfig.sort).then(p => p.sort(compareProducts(collectionConfig)))
      : [...products].sort(compareProducts(collectionConfig))

  const sortedProductsWithPinned = collectionConfig.pinnedProducts.length > 0 ? reOrderCollectionWithPinned(collectionConfig.pinnedProducts, sortedProducts) : sortedProducts;
  const isSameOrder = sortedProductsWithPinned.every((product, index) => product.id === products[index].id);

  if (isSameOrder) {
    console.info('    ☑️ No products to move');
    return;
  }
  await moveProducts(collection.id, sortedProductsWithPinned.map(product => product.id), products.length - 1);

  console.info(`    ✅ Move products done`);
}

const start = async () => {
  console.info('🚀 Starting shopify-autosort-collection')
  const sortConfig = await loadSortConfig();
  const locationId = config.locationId ?? await getDefaultLocationId();

  const collections = await getCollections();
  console.info(`Retrieved ${collections.length} collections`)

  const productCollections = collections.filter(collection => collection.productsCount > 0);
  console.info(`Found ${productCollections.length} product collections`)

  for (const collection of productCollections) {
    const collectionSortConfig = sortConfig.collections[collection.handle] ?? sortConfig.collections.default;
    await reOrderCollection(collection, locationId, collectionSortConfig)
    await sleep(500)
  }
}

start();
