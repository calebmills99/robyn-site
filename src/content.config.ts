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
  tags: z.array(z.string()).optional().default([]),
});

const pages = defineCollection({
  loader: glob({ base: "./src/content/pages", pattern: "**/*.md" }),
  schema: pageSchema,
});

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: blogSchema,
});

// Hand-written bios. Outside pages/ and blog/, so ingest-content.mjs never clears them.
const people = defineCollection({
  loader: glob({ base: "./src/content/people", pattern: "**/*.md" }),
  schema: ({ image }) =>
    z
      .object({
        name: z.string(),
        role: z.string(),
        order: z.number().int(),
        lede: z.string(),
        description: z.string(),
        years: z.string().optional(),
        portrait: image().optional(),
        portraitAlt: z.string().optional(),
      })
      .refine((data) => !data.portrait || Boolean(data.portraitAlt), {
        message: "portraitAlt is required when portrait is set (alt text for the bio photo)",
        path: ["portraitAlt"],
      }),
});

export const collections = { pages, blog, people };
