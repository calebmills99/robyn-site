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
      filter(page) {
        return !page.includes(
          "golden-wings-takes-flight-celebrating-wins-at-clown-international-and-independent-shorts-awards",
        );
      },
    }),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkRescueIndentedImages],
    }),
  },
});
