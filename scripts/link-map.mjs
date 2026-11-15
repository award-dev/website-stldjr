#!/usr/bin/env node
// Generates site-data/link-map.json from the data files (local-seo kit, references/linking.md).
// The pages implement this map; the seo-auditor agent compares built pages against it.
//   node scripts/link-map.mjs
import { readFileSync, writeFileSync } from "node:fs";

const read = (f) => JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), "utf8"));
const groups = read("config/services.json").groups;
const locations = read("site-data/locations.json");

const servicePath = (g) => `${g.path.replace(/\/?$/, "/")}`; // config paths are /services/<slug>/
const cities = locations.filter((l) => l.tier === "page");
// Areas that share one combined page (tier "group"), e.g. unincorporated South County.
const groupPages = [...new Set(locations.filter((l) => l.tier === "group").map((l) => `/service-areas/${l.group}/`))];
const cityPath = (l) => `/service-areas/${l.slug}/`;
const hub = "/service-areas/";
const always = ["/contact/", "/book/"];

const map = {};
const add = (from, ...to) => { map[from] = [...new Set([...(map[from] || []), ...to.filter((t) => t !== from)])]; };

// 1. Home -> every service page, the hub, and city pages.
add("/", ...groups.map(servicePath), hub, ...cities.map(cityPath), ...groupPages);
// 2. Service -> other services + cities where a job of that service exists + hub.
for (const g of groups) {
  const slug = servicePath(g).split("/")[2];
  const withJobs = cities.filter((l) => (l.jobs || []).some((j) => j.service === slug));
  add(servicePath(g), ...groups.filter((o) => o !== g).map(servicePath), ...withJobs.map(cityPath), hub);
}
// 3. City -> every service + nearby cities that have pages + hub.
for (const l of cities) {
  const near = (l.nearby || []).map((s) => cities.find((c) => c.slug === s)).filter(Boolean).slice(0, 4);
  add(cityPath(l), ...groups.map(servicePath), ...near.map(cityPath), hub, "/pricing/");
}
// 4. Hub -> every city page.
add(hub, ...cities.map(cityPath), ...groupPages);
for (const gp of groupPages) add(gp, ...groups.map(servicePath), hub, "/pricing/");
// 6. Every page links to Contact and booking (header/footer), plus click-to-call.
for (const k of Object.keys(map)) add(k, ...always);

writeFileSync(new URL("../site-data/link-map.json", import.meta.url), JSON.stringify(map, null, 2) + "\n");
console.log(`link-map.json: ${Object.keys(map).length} pages, ${cities.length} city pages, ${groupPages.length} combined area pages`);
