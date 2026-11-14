#!/usr/bin/env node
// Rewrites the service-area redirect block in netlify.toml from site-data/locations.json.
// Page-tier slugs go to their city page. Group-tier slugs (South County) go to the combined page.
// The hub rule and the /service-area/* catch-all stay last.
import { readFileSync, writeFileSync } from "node:fs";

const locations = JSON.parse(readFileSync(new URL("../site-data/locations.json", import.meta.url), "utf8"));
const begin = "# BEGIN generated service-area redirects (node scripts/gen-redirects.mjs)";
const end = "# END generated service-area redirects";

const rules = [];
const add = (from, to) => {
  rules.push(`[[redirects]]\n  from = "${from}"\n  to = "${to}"\n  status = 301`);
};

for (const l of locations.filter((l) => l.tier === "page")) {
  add(`/service-area/${l.slug}`, `/service-areas/${l.slug}/`);
  add(`/service-area/${l.slug}/`, `/service-areas/${l.slug}/`);
}
for (const l of locations.filter((l) => l.tier === "group" && l.group)) {
  add(`/service-area/${l.slug}`, `/service-areas/${l.group}/`);
  add(`/service-area/${l.slug}/`, `/service-areas/${l.group}/`);
}
add("/service-area/south-county", "/service-areas/south-county/");
add("/service-area/south-county/", "/service-areas/south-county/");
add("/service-area/", "/service-areas/");
add("/service-area/*", "/service-areas/");

const block = `${begin}\n${rules.join("\n")}\n${end}\n`;
const tomlPath = new URL("../netlify.toml", import.meta.url);
let toml = readFileSync(tomlPath, "utf8");
if (toml.includes(begin)) {
  toml = toml.replace(new RegExp(`${begin}[\\s\\S]*?${end}\\n`), block);
} else {
  const legacy = /# The service-area hub moved to \/service-areas\/ \(city pages live under it\)\n\[\[redirects\]\]\n  from = "\/service-area\/"\n  to = "\/service-areas\/"\n  status = 301\n\[\[redirects\]\]\n  from = "\/service-area\/\*"\n  to = "\/service-areas\/"\n  status = 301\n/;
  if (!legacy.test(toml)) {
    console.error("Could not find the legacy /service-area/ redirect block in netlify.toml");
    process.exit(1);
  }
  toml = toml.replace(legacy, block);
}
writeFileSync(tomlPath, toml);
console.log(`netlify.toml: ${rules.length} service-area redirect rules`);
