import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const pageSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(""),
  path: z.string().optional(),
  sourceUrl: z.string().optional(),
  canonical: z.string().optional(),
  scrapedAt: z.string().optional(),
  reason: z.string().optional(),
});

const blogSchema = pageSchema.extend({
  slug: z.string().optional(),
});

const pages = defineCollection({
  loader: glob({ base: "./src/content/pages", pattern: "**/*.md" }),
  schema: pageSchema,
});

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: blogSchema,
});

export const collections = { pages, blog };
