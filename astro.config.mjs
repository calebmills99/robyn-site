// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import { remarkRescueIndentedImages } from "./scripts/remark-rescue-indented-images.mjs";
import { parityStudioPlugin } from "./scripts/parity-studio-plugin.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://golden-wings-robyn.com",
  integrations: [
    sitemap({
      filter(page) {
        return (
          !page.includes(
            "golden-wings-takes-flight-celebrating-wins-at-clown-international-and-independent-shorts-awards",
          ) &&
          !page.includes("/__parity") &&
          !page.includes("/parity-studio")
        );
      },
    }),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkRescueIndentedImages],
    }),
  },
  vite: {
    // Parity Studio middleware registers only when PARITY_STUDIO=1 (see npm run parity).
    // It is never active during `astro build`, so the editor does not ship in dist.
    plugins: [parityStudioPlugin()],
  },
});
