import { z } from "zod";



export const CollectionSchema = z.object({
  id: z.string(),
  productsCount: z.number(),
  title: z.string(),
  handle: z.string(),
  sortOrder: z.string(),
});
export type Collection = z.infer<typeof CollectionSchema>;


export const ProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  handle: z.string(),
  publishedAt: z.coerce.date(),
  totalInventory: z.number(),
  variants: z.object({
    nodes: z.array(z.object({
      inventoryItem: z.object({
        inventoryLevel: z.object({
          quantities: z.array(z.object({
            name: z.string(),
            quantity: z.number(),
          })),
        }),
      }),
    })),
  }),
});
export type Product = z.infer<typeof ProductSchema>;
