import { readFile } from 'fs/promises';
import { z } from 'zod';

const DEFAULT_SORT_CONFIG = {
  collections: {
    default: {
      moveUnavailableToEnd: true,
      sort: false
    }
  }
}

export enum SortCollection {
  PublishDate = 'publish_date',
  Stock = 'stock',
  BestSelling = 'best_selling',
}

const CollectionConfigSchema = z.object({
  moveUnavailableToEnd: z.boolean(),
  sort: z.union([z.boolean(), z.nativeEnum(SortCollection)]).default(false),
});
export type CollectionConfig = z.infer<typeof CollectionConfigSchema>;

const SortConfigSchema = z.object({
  collections: z.record(CollectionConfigSchema).and(z.object({
    default: CollectionConfigSchema
  })),
});
export type SortConfig = z.infer<typeof SortConfigSchema>;


export const loadSortConfig = async (): Promise<SortConfig> => {
  const configFile = process.argv[2];
  if (!configFile) {
    return DEFAULT_SORT_CONFIG;
  }
  try {
    const buffer = await readFile(configFile);
    const unsafeConfig = JSON.parse(buffer.toString());
    const config = SortConfigSchema.parse(unsafeConfig);
    return config
  } catch (e) {
    console.error('Error loading config file', e);
    process.exit(1);
  }
}
