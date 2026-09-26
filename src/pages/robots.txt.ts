import type { APIRoute } from "astro";
import { business } from "../lib/site";

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /booking/\nDisallow: /api/\n\nSitemap: ${new URL("/sitemap.xml", business.siteUrl)}\n`, { headers: { "content-type": "text/plain" } });
