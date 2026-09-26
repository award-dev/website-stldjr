import { defineConfig } from "astro/config";
import business from "./config/business.json" with { type: "json" };

export default defineConfig({
  site: business.siteUrl,
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "auto" },
  compressHTML: true,
  prefetch: { prefetchAll: false, defaultStrategy: "hover" },
  devToolbar: { enabled: false },
});
