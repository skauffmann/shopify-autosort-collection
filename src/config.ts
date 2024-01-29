import { z } from 'zod';
import 'dotenv/config';

const DEFAULT_GRAPHQL_VERSION = '2024-01';

const ConfigSchema = z.object({
  accessToken: z.string(),
  shopName: z.string(),
  locationId: z.string().optional(),
  graphql: z.object({
    version: z.string().default(DEFAULT_GRAPHQL_VERSION),
    endpoint: z.string()
  }),
});

type Config = z.infer<typeof ConfigSchema>;

const processEnv = {
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  shopName: process.env.SHOPIFY_SHOP_NAME,
  locationId: process.env.SHOPIFY_LOCATION_ID,
  graphql: {
    version: process.env.SHOPIFY_GRAPHQL_VERSION,
    endpoint: `https://${process.env.SHOPIFY_SHOP_NAME}/admin/api/${process.env.SHOPIFY_GRAPHQL_VERSION ?? DEFAULT_GRAPHQL_VERSION}/graphql.json`,
  }
};

const parsed = ConfigSchema.safeParse(processEnv);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const config = parsed.data;
