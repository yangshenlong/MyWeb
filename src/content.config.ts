import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    author: z.string().optional(),
    layout: z.string().optional(),
    pinned: z.boolean().default(false),
    pinnedOrder: z.number().optional(),
  }),
});

export const collections = { blog };
