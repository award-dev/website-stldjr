---
name: local-seo
description: Builds and edits local-business website pages to a strict SEO standard — site architecture, service pages, city/location pages, homepage, metadata, JSON-LD schema, internal linking, outbound citations, sitemap and robots. Use this skill for ANY page, copy, heading, meta tag, schema, link, or content task on a client site, even small edits like "rewrite the hero" or "add a page for X", and whenever the user mentions SEO, rankings, Google, keywords, location pages, service areas, or schema.
---

# Local SEO Page System

Every page is built from data in `/site-data`, follows a blueprint, carries schema, and is wired into a planned link graph. Read the steps in order.

## Step 1 — Load the data (always)
Read the data files mapped in `CLAUDE.md` §1. In this repo that is `config/business.json`, `config/services.json`, `config/pricing.json`, `config/faqs.json`, `site-data/locations.json`, and reviews (Google Places at build time, else `config/reviews.json`). Everything factual on the page comes from these. Missing fact → `<!-- TODO(seo): need X -->` + list it in the final report. Never fabricate.

## Step 2 — Check the architecture before creating pages
Allowed page types and URLs:

| Page | URL | Created when |
|---|---|---|
| Home | `/` | always |
| Service | `/services/{service}/` | one per group in config/services.json |
| Service Areas hub | `/service-areas/` | always; lists EVERY location (page + mention tiers) |
| City page | `/service-areas/{city}/` | only if `tier: "page"` AND passes the city gate below |
| Service × City | `/services/{service}/{city}/` | only if that city has 3+ jobs of that service AND distinct content; rare |
| About, Contact, Reviews, Gallery | `/about/` etc. | always |

**City gate — refuse to create a city page unless it has at least 3 of these from locations.json:**
2+ completed jobs with summaries, 1+ review from that city, 2+ local facts, 1+ city-specific FAQ, 1+ job photo, 1+ verified official link.
If it fails, keep the city as a `mention` on the hub and report what proof is missing. A thin city page hurts the whole site (Google doorway / scaled-content policies).

## Step 3 — Build the page from its blueprint
Read `references/page-blueprints.md` for the section order of the page type. Rules for all pages:

**Head**
- `<title>`: `{Primary keyword} in {City}, {ST} | {Brand}` style, 50–60 chars, unique site-wide
- Meta description: 140–155 chars, includes keyword + a concrete differentiator + call to action, unique
- `<link rel="canonical">` to the absolute production URL; Open Graph title/description/image
- `<html lang="en">`, viewport meta

**Body**
- Exactly one H1, containing the primary keyword + location. H2/H3 in order, no skipped levels.
- **Answer-first intro:** the first 2 sentences say what you do, where, and the key differentiator in plain words. (This is what Google snippets and AI answers quote.)
- H2s phrased the way people search ("How much does junk removal cost in Kirkwood?"), each answered directly in the first sentence under it.
- Use exact numbers and names from data (prices, years, job counts, neighborhoods). Specific beats adjectives.
- Primary keyword in: title, H1, first 100 words, one H2, image alt, URL. Then write naturally; no stuffing.
- Images: descriptive filename, real alt text describing the photo, `width`/`height` set, `loading="lazy"` except the hero, modern format (WebP/AVIF).
- One clear CTA above the fold (click-to-call `tel:` link using phone_e164) and one at the bottom.
- Visible NAP in the footer, identical to business.json.

## Step 4 — Schema (JSON-LD)
Copy patterns from `references/schema.md`. Every page: `LocalBusiness` subtype (site-wide, same `@id`) + `BreadcrumbList` + `WebPage`. Service pages add `Service`. Pages with FAQs add `FAQPage`. Schema must only describe content visible on the page. No self-written AggregateRating on the business's own LocalBusiness.

## Step 5 — Links (internal + outbound)
Read `references/linking.md` and follow it exactly. Short version:
- Generate the link map from data, never by hand: services ↔ related services, service ↔ cities where it was performed, city ↔ `nearby` cities that have pages, everything ↔ hub.
- Descriptive anchor text ("basement cleanouts in Kirkwood"), never "click here".
- Outbound links only to URLs present in site-data (`official_links`, `gbp_url`) or to sources you have verified load. Never invent or guess a URL.
- Every page reachable within 3 clicks of home; no orphan pages.

## Step 6 — Site files
Regenerate `sitemap.xml` (indexable pages only, absolute URLs, `lastmod`) and `robots.txt` (with `Sitemap:` line) whenever pages are added or removed.

## Step 7 — Verify
1. Build the site (`npm run build`), then run `node scripts/audit-seo.mjs dist` and fix every ERROR.
2. Run the `seo-auditor` agent and fix what it flags.
3. Report: pages changed, link map changes, TODOs, audit output summary.
