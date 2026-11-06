// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import business from "./config/business.json" with { type: "json" };

// Absolute URLs (canonical, link previews, sitemap, schema) use the live origin.
// SITE_URL overrides config/business.json -> siteUrl (e.g. for a Netlify preview host).
const site = (process.env.SITE_URL || business.siteUrl).replace(/\/$/, "");

export default defineConfig({
  site,
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "auto" },
  compressHTML: true,
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
  integrations: [
    sitemap({ filter: (page) => !/\/(404|booking)\/?$/.test(new URL(page).pathname) }),
    react(),
  ],
});
