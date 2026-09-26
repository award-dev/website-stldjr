import type { APIRoute } from "astro";
import { services, business } from "../lib/site";

const paths = ["/", ...services.groups.map((g) => g.path + "/"), "/pricing/", "/service-area/", "/about/", "/faq/", "/book/", "/quote/", "/privacy/", "/terms/", "/accessibility/"];

export const GET: APIRoute = () => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = paths.map((p) => `  <url><loc>${new URL(p, business.siteUrl)}</loc><lastmod>${today}</lastmod></url>`).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, { headers: { "content-type": "application/xml" } });
};
