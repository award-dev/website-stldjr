// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import business from "./config/business.json" with { type: "json" };
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Absolute URLs (canonical, link previews, sitemap, schema) use the live origin.
// SITE_URL overrides config/business.json -> siteUrl (e.g. for a Netlify preview host).
const site = (process.env.SITE_URL || business.siteUrl).replace(/\/$/, "");
const lastmod = new Date().toISOString().slice(0, 10);

// @astrojs/sitemap writes sitemap-index.xml + sitemap-0.xml. Also publish the URL set as /sitemap.xml, the
// conventional path crawlers and the local-seo audit (scripts/audit-seo.mjs) look for.
const plainSitemap = {
  name: "plain-sitemap",
  hooks: {
    "astro:build:done": ({ dir }) => {
      const src = fileURLToPath(new URL("sitemap-0.xml", dir));
      if (existsSync(src)) writeFileSync(fileURLToPath(new URL("sitemap.xml", dir)), readFileSync(src));
    },
  },
};

export default defineConfig({
  site,
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "auto" },
  compressHTML: true,
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
  integrations: [
    sitemap({
      filter: (page) => !/\/(404|booking)\/?$/.test(new URL(page).pathname),
      serialize: (item) => ({ ...item, lastmod }),
    }),
    plainSitemap,
    react(),
  ],
});
