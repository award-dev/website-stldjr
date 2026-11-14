#!/usr/bin/env node
// Generates site-data/link-map.json from the data files (local-seo kit, references/linking.md).
// The pages implement this map; the seo-auditor agent compares built pages against it.
//   node scripts/link-map.mjs
import { readFileSync, writeFileSync } from "node:fs";

const read = (f) => JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), "utf8"));
const groups = read("config/services.json").groups;
const locations = read("site-data/locations.json");
const subservices = read("site-data/subservices.json");

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
// 5. Sub-service pages: parent ↔ child, child ↔ siblings, child ↔ cities with a job of that sub-service.
const subPath = (s) => `/services/${s.parent}/${s.slug}/`;
for (const s of subservices) {
  const path = subPath(s);
  const parent = `/services/${s.parent}/`;
  const siblings = subservices.filter((o) => o.parent === s.parent && o.slug !== s.slug).map(subPath);
  const withJobs = s.jobSubservice
    ? cities.filter((l) => (l.jobs || []).some((j) => j.subservice === s.jobSubservice))
    : [];
  add(parent, path);
  add("/", path);
  add("/services/", path);
  add(path, parent, ...siblings, "/services/construction-debris-removal/", "/pricing/", "/quote/", "/service-areas/", ...withJobs.map(cityPath));
  for (const l of withJobs) add(cityPath(l), path);
}
add("/services/", ...groups.map(servicePath), "/pricing/", hub);
add("/pricing/", ...groups.map(servicePath), ...subservices.map(subPath));
// St. Charles County cities that already have pages. Mention-tier towns get no URL.
const stCharlesPages = locations.filter((l) => l.county === "St. Charles County" && l.tier === "page").map(cityPath);
for (const g of groups) add(servicePath(g), ...stCharlesPages);
for (const s of subservices) add(subPath(s), ...stCharlesPages);
add("/services/", ...stCharlesPages);
add(hub, ...stCharlesPages);
// 6. Every page links to Contact and booking (header/footer), plus click-to-call.
for (const k of Object.keys(map)) add(k, ...always);

writeFileSync(new URL("../site-data/link-map.json", import.meta.url), JSON.stringify(map, null, 2) + "\n");
console.log(`link-map.json: ${Object.keys(map).length} pages, ${cities.length} city pages, ${groupPages.length} combined area pages`);
