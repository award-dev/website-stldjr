// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import business from "./config/business.json" with { type: "json" };
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// Absolute URLs (canonical, link previews, sitemap, schema) use the live origin.
// SITE_URL overrides config/business.json -> siteUrl (e.g. for a Netlify preview host).
const site = (process.env.SITE_URL || business.siteUrl).replace(/\/$/, "");
const lastmod = new Date().toISOString().slice(0, 10);

// The sitemap lists indexable pages only. Besides the fixed exclusions, any page built with a robots noindex
// meta (e.g. /blog/ while no post is published) is left out. The sitemap filter runs in astro:build:done, after
// the HTML is written, so it reads the built page to decide.
let outDir = fileURLToPath(new URL("./dist/", import.meta.url));
const isNoindex = (page) => {
  const file = join(outDir, decodeURIComponent(new URL(page).pathname), "index.html");
  return existsSync(file) && /<meta[^>]+name=["']?robots["']?[^>]+noindex/i.test(readFileSync(file, "utf8"));
};

// @astrojs/sitemap writes sitemap-index.xml + sitemap-0.xml. Also publish the URL set as /sitemap.xml, the
// conventional path crawlers and the local-seo audit (scripts/audit-seo.mjs) look for.
const plainSitemap = {
  name: "plain-sitemap",
  hooks: {
    "astro:config:done": ({ config }) => { outDir = fileURLToPath(config.outDir); },
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
      filter: (page) => !/\/(404|booking)\/?$/.test(new URL(page).pathname) && !isNoindex(page),
      serialize: (item) => ({ ...item, lastmod }),
    }),
    plainSitemap,
    react(),
  ],
});
