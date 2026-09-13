// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import { remarkRescueIndentedImages } from "./scripts/remark-rescue-indented-images.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://golden-wings-robyn.com",
  integrations: [
    sitemap({
      serialize(item) {
        item.lastmod = new Date();
        return item;
      },
    }),
  ],
  markdown: {
    // Astro 7 defaults to Sätteri (no remark). Use unified so the rescue plugin
    // still catches any scrape indent that survives ingest.
    processor: unified({
      remarkPlugins: [remarkRescueIndentedImages],
    }),
  },
});
