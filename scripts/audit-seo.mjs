#!/usr/bin/env node
// Zero-dependency SEO audit for built static HTML.
// Usage: node scripts/audit-seo.mjs [buildDir=dist]
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || "dist");
if (!fs.existsSync(root)) { console.error(`Build dir not found: ${root}`); process.exit(2); }

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".html") ? [path.join(d, e.name)] : []);
const files = walk(root);

const toRoute = (f) => {
  let r = "/" + path.relative(root, f).split(path.sep).join("/");
  r = r.replace(/index\.html$/, "").replace(/\.html$/, "/");
  return r;
};
const norm = (href) => {
  const p = href.split("#")[0].split("?")[0];
  if (!p) return null;
  let r = p.endsWith("/") || /\.[a-z0-9]+$/i.test(p) ? p : p + "/";
  return r.replace(/index\.html$/, "");
};
const strip = (s) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<(header|nav|footer)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim().toLowerCase();
// Match the closing quote to the opening one, so an apostrophe inside "O'Fallon" doesn't end the value.
const attr = (tag, name) => { const m = tag.match(new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i")); return m ? (m[1] ?? m[2]) : undefined; };
// Measure lengths on decoded text: "&amp;" in the HTML is one "&" in search results.
const decode = (t) => t && t.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const issues = [];
const add = (sev, page, msg) => issues.push({ sev, page, msg });
const pages = {};
const titles = {}, descs = {};
const BANNED = ["elevate", "seamless", "unlock", "delve", "look no further", "one-stop shop", "top-notch", "fast-paced world", "nestled", "we pride ourselves"];

for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  const route = toRoute(f);
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) continue;
  const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim());
  const descTag = html.match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0];
  const desc = decode(descTag && attr(descTag, "content"));
  const canon = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)?.[0];

  if (!title) add("ERROR", route, "Missing <title>");
  else {
    if (title.length < 30 || title.length > 60) add("WARN", route, `Title length ${title.length} (aim 50–60)`);
    (titles[title] ||= []).push(route);
  }
  if (!desc) add("ERROR", route, "Missing meta description");
  else {
    if (desc.length < 120 || desc.length > 160) add("WARN", route, `Meta description length ${desc.length} (aim 140–155)`);
    (descs[desc] ||= []).push(route);
  }
  if (!canon) add("ERROR", route, "Missing canonical");
  else if (!/^https:\/\//.test(attr(canon, "href") || "")) add("ERROR", route, "Canonical must be an absolute https URL");
  if (!/<html[^>]+lang=/i.test(html)) add("WARN", route, "Missing <html lang>");
  if (!/property=["']og:title["']/i.test(html)) add("WARN", route, "Missing og:title");

  const heads = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map((m) => +m[1]);
  const h1s = heads.filter((h) => h === 1).length;
  if (h1s !== 1) add("ERROR", route, `Found ${h1s} H1s (need exactly 1)`);
  for (let i = 1; i < heads.length; i++)
    if (heads[i] > heads[i - 1] + 1) { add("WARN", route, `Heading skips H${heads[i - 1]} → H${heads[i]}`); break; }

  for (const img of html.match(/<img\b[^>]*>/gi) || []) {
    const src = attr(img, "src") || "?";
    // A bare `alt` attribute (what HTML minifiers emit for alt="") is a valid empty alt.
    const alt = attr(img, "alt") ?? (/\salt(?=[\s>\/])/i.test(img) ? "" : undefined);
    if (alt === undefined) add("ERROR", route, `Image missing alt: ${src}`);
    else if (!alt.trim() && !/role=["']presentation/i.test(img)) add("WARN", route, `Empty alt (ok only if decorative): ${src}`);
    if (!/\bwidth=/i.test(img) || !/\bheight=/i.test(img)) add("WARN", route, `Image missing width/height (CLS): ${src}`);
  }

  const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  if (!ld.length) add("ERROR", route, "No JSON-LD schema");
  const types = [];
  for (const m of ld) {
    try {
      const j = JSON.parse(m[1]);
      const nodes = [j, ...(j["@graph"] || [])].flat();
      for (const n of nodes) types.push(...[].concat(n?.["@type"] || []));
      if (/"AggregateRating"/.test(m[1]) && /Business|Contractor|Plumber|Electrician/.test(m[1]))
        add("WARN", route, "AggregateRating on own business schema (self-serving; Google ignores it)");
    } catch (e) { add("ERROR", route, `Invalid JSON-LD: ${e.message}`); }
  }
  if (ld.length && !types.includes("BreadcrumbList") && route !== "/") add("WARN", route, "No BreadcrumbList schema");
  if (/<(details|summary)|class=["'][^"']*faq/i.test(html) && !types.includes("FAQPage")) add("WARN", route, "FAQ on page but no FAQPage schema");

  const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  const internal = [];
  for (const [, a, inner] of links) {
    const href = attr(a, "href") || "";
    const text = inner.replace(/<[^>]+>/g, "").trim().toLowerCase();
    if (/^(click here|here|read more|learn more|more)$/.test(text)) add("WARN", route, `Generic anchor text "${text}" → ${href}`);
    if (href.startsWith("/") && !href.startsWith("//")) { const n = norm(href); if (n) internal.push(n); }
  }
  const text = strip(html);
  const words = text.split(" ").filter(Boolean);
  if (words.length < 300) add("WARN", route, `Thin body content: ${words.length} words`);
  for (const b of BANNED) if (text.includes(b)) add("WARN", route, `Banned phrase: "${b}"`);
  pages[route] = { internal, words };
}

for (const [t, r] of Object.entries(titles)) if (r.length > 1) add("ERROR", r.join(", "), `Duplicate title: "${t}"`);
for (const [d, r] of Object.entries(descs)) if (r.length > 1) add("ERROR", r.join(", "), "Duplicate meta description");

const routes = new Set(Object.keys(pages));
const inbound = Object.fromEntries([...routes].map((r) => [r, 0]));
for (const [r, p] of Object.entries(pages))
  for (const l of new Set(p.internal)) {
    if (/\.[a-z0-9]+$/i.test(l) && !l.endsWith(".html")) continue; // assets
    if (!routes.has(l)) add("ERROR", r, `Broken internal link → ${l}`);
    else if (l !== r) inbound[l]++;
  }
for (const [r, n] of Object.entries(inbound)) if (n === 0 && r !== "/") add("ERROR", r, "Orphan page (no internal links point here)");

// Doorway check: 5-word shingle overlap between location pages
const shingles = (w) => { const s = new Set(); for (let i = 0; i + 5 <= w.length; i++) s.add(w.slice(i, i + 5).join(" ")); return s; };
const loc = Object.keys(pages).filter((r) => /\/service-areas\/[^/]+\/$|\/services\/[^/]+\/[^/]+\/$/.test(r));
const sh = Object.fromEntries(loc.map((r) => [r, shingles(pages[r].words)]));
for (let i = 0; i < loc.length; i++) for (let j = i + 1; j < loc.length; j++) {
  const a = sh[loc[i]], b = sh[loc[j]];
  if (!a.size || !b.size) continue;
  let inter = 0; for (const x of a) if (b.has(x)) inter++;
  const sim = inter / Math.min(a.size, b.size);
  if (sim > 0.5) add("ERROR", `${loc[i]} vs ${loc[j]}`, `${Math.round(sim * 100)}% shared text — doorway-page risk`);
  else if (sim > 0.3) add("WARN", `${loc[i]} vs ${loc[j]}`, `${Math.round(sim * 100)}% shared text (aim < 30%)`);
}

const sitemap = path.join(root, "sitemap.xml");
if (!fs.existsSync(sitemap)) add("ERROR", "/sitemap.xml", "Missing sitemap.xml");
else {
  const xml = fs.readFileSync(sitemap, "utf8");
  for (const r of routes) if (!xml.includes(r === "/" ? "/</loc>" : r)) add("WARN", r, "Page not in sitemap.xml");
}
const robots = path.join(root, "robots.txt");
if (!fs.existsSync(robots)) add("ERROR", "/robots.txt", "Missing robots.txt");
else if (!/sitemap:/i.test(fs.readFileSync(robots, "utf8"))) add("WARN", "/robots.txt", "robots.txt has no Sitemap: line");

const errs = issues.filter((i) => i.sev === "ERROR"), warns = issues.filter((i) => i.sev === "WARN");
for (const i of [...errs, ...warns]) console.log(`${i.sev.padEnd(5)} ${i.page}  ${i.msg}`);
console.log(`\n${files.length} pages · ${errs.length} errors · ${warns.length} warnings · ${errs.length ? "FAIL" : "PASS"}`);
process.exit(errs.length ? 1 : 0);
