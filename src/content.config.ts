import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
const journal = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/journal" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum([
      "Research Notes",
      "Conferences & Travel",
      "Mathematics",
      "Life & Other Things",
    ]),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    sample: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});
export const collections = { journal };
