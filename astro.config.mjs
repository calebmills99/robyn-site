// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import fs from "node:fs";
import { unified } from "@astrojs/markdown-remark";
import { remarkRescueIndentedImages } from "./scripts/remark-rescue-indented-images.mjs";
import { parityStudioPlugin } from "./scripts/parity-studio-plugin.mjs";

const redirects = JSON.parse(fs.readFileSync(new URL("./redirects.json", import.meta.url), "utf8"));

// https://astro.build/config
export default defineConfig({
  site: "https://golden-wings-robyn.com",
  integrations: [
    sitemap({
      filter(page) {
        const pathname = new URL(page).pathname.replace(/\/+$/, "") || "/";
        return (
          !Object.hasOwn(redirects, pathname) &&
          !/^\/(?:[45]\d{2}|cf-[45]\d{2}|error(?:s)?|not-found)(?:\.html)?(?:\/|$)/i.test(pathname) &&
          !page.includes(
            "golden-wings-takes-flight-celebrating-wins-at-clown-international-and-independent-shorts-awards",
          ) &&
          !page.includes("/__parity") &&
          !page.includes("/parity-studio")
        );
      },
      serialize(item) {
        const url = new URL(item.url);
        url.pathname = url.pathname.replace(/\/+$/, "") || "/";
        return { ...item, url: url.href };
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
