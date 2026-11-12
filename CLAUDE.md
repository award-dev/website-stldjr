# STL Demolition & Junk Removal — Site Build Rules

Read this whole file before doing any work on this repo.

## 1. Facts come from the data files, never from memory
Every business fact on the site is pulled from these files. They are the single source of truth.
(The local-seo kit calls this folder `site-data/`; in this repo business facts already live in `config/`.)

| File | Holds |
|---|---|
| `config/business.json` | Name, phone (NAP), email, city, hours, Google Business Profile + Facebook + LocateFaith links, insurance, licensing, founding year, founder, analytics |
| `config/services.json` | Every service group (one page each), scope items, how it's priced, notes, FAQ ids, booking mapping |
| `config/pricing.json` | Load sizes, prices and everything that can change the price |
| `config/faqs.json` | Owner-approved FAQ answers |
| `config/service-areas.json` | Regions and places served (the hub list) and ZIP prefixes for the booking check |
| `site-data/locations.json` | Per-city proof for the local-seo kit: tier, verified local facts with sources, official links, ZIPs, neighborhoods, jobs, nearby cities |
| Google reviews | Fetched from the Places API at build time (`src/lib/reviews.ts`, needs `GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_ID` in Netlify). `config/reviews.json` is the manual fallback |
| `site-data/proof/` | Job photos and short job write-ups referenced by locations.json |
| `src/data/*.ts` | Page copy and photo picks. Reads the facts above; never restate a fact here that a config file holds |

**Hard rules**
- Never invent reviews, ratings, stats, years in business, licenses, prices, addresses, job stories, or URLs.
- If a page needs a fact that isn't in the data files, insert `<!-- TODO(seo): need X -->` and list it in your end-of-task report. Do not guess.
- NAP must render character-for-character identical to `config/business.json` everywhere (header, footer, contact page, schema). It must match the Google Business Profile.
- Only the company's own photos and video. No stock or AI images.
  - One exception, approved by the owner: the homepage hero clip (`src/assets/hero/`) is subtle AI motion made from the company's own crew photo (`crew/team.webp`). It may add only gentle camera and natural movement, never new people, objects, text or scenery; faces, the truck and its markings must stay unchanged.
- City pages need verified local proof (see the city gate in `.claude/skills/local-seo/SKILL.md`). Every local fact in `site-data/locations.json` carries the source URL it came from; re-check sources before reusing them, because city rules change.

## 2. How to build or edit any page
1. Use the `local-seo` skill (`.claude/skills/local-seo/`) for every page, content, metadata, schema, or linking task.
2. Build: `npm run build` (output in `dist/`). Then run `node scripts/audit-seo.mjs dist` and fix every ERROR.
3. Also run the site checks from the business-site-builder skill if available (`check.mjs`, `intro-test.mjs`), `npx astro check` and `npm test`.
4. Then run the `seo-auditor` agent (`.claude/agents/seo-auditor.md`) for a judgment review and fix what it flags.
5. End with a short report: pages changed, TODOs, audit results.
6. Deploying: the Netlify project is not linked to GitHub, so merging does not publish. Deploy only when the owner asks.

## 3. Brand voice
- Tone: direct, local, plain-spoken, friendly. Faith and family matter to the owner (Aaron Ward); keep it genuine, never preachy.
- Reading level: plain English, short paragraphs (2–4 sentences).
- Talk like the owner talking to a homeowner, not like an agency.
- Differentiators to work in naturally (all in config): priced by the load (1/4 to a full 17-yard truck, $125 minimum pickup), price confirmed before anything is loaded, online booking with real arrival windows, hauling and demolition from one crew, licensed and insured ($3 million policy), 1,000+ jobs since 2023, family-run and Christian-owned.

**Banned words/phrases:** elevate, seamless, unlock, delve, in today's fast-paced world, look no further, one-stop shop, top-notch, hassle-free, "we pride ourselves", nestled.

## 4. Tech map
- Framework: Astro 7 + Tailwind 4, with small React islands (`client:visible`) for the gallery; the intro is plain Astro + a small script.
- Pages live in: `src/pages` (city pages: `src/pages/service-areas/[slug].astro`, hub: `src/pages/service-areas/index.astro`).
- Build output (what the audit script reads): `dist`
- Shared components: `src/layouts/Base.astro` builds title/meta/canonical/Open Graph and the JSON-LD `@graph` (business node with one `@id`, WebSite, BreadcrumbList, plus per-page nodes passed as `schema`). Use `Base` props and `PageHero` breadcrumbs; don't hand-roll meta tags per page.
- Production domain: `https://stlouishjr.com` (canonical URLs use this, with trailing slashes: yes).
- Sitemap: `@astrojs/sitemap` writes `sitemap-index.xml`; the build also writes `sitemap.xml` (same URLs, for the audit and crawlers). robots.txt points at both.
- Hosting: Netlify (`netlify.toml` holds headers and redirects; functions in `netlify/functions`).
