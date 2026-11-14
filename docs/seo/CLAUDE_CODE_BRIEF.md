# Claude Code build brief: STL Demolition & Junk Removal, junk removal and demolition SEO

**Repo:** `award-dev/website-stldjr` · **Live:** https://stlouishjr.com · **Stack:** Astro 7 + Tailwind 4, Netlify (merges to `main` deploy)
**Prepared:** Sat Nov 14, 2026 (CT) by the SEO strategist (Grok Bot), for Aaron Ward
**Goal:** rank on page one in St. Louis for **junk removal** and **demolition** searches (interior, kitchen and bathroom demolition first), without fabricating anything.

---

## 0. Ground rules (read before touching code)

1. **Read `CLAUDE.md` and `.claude/skills/local-seo/` (SKILL.md and all three references) first.** This brief works inside them. If anything here conflicts with CLAUDE.md's hard rules, CLAUDE.md wins. Stop and list the conflict in your report.
2. **Branch + PR, do NOT merge.** Make a branch named `seo/junk-demo-phase-a`. Commit each phase separately with clear messages. Open a PR to `main` titled **"SEO: junk removal + demolition pages (phase A)"**. **Do not merge, and do not deploy.** Merge timing belongs to the strategist and Aaron. (CLAUDE.md §2.6 says Netlify isn't linked to GitHub. Aaron says it now is, so a merge would publish. Update that line in CLAUDE.md as part of this PR: "Netlify is connected to GitHub: merging to main publishes. Do not merge without the owner's go-ahead.")
3. **Facts only from data files** (`config/*.json`, `site-data/locations.json`, photos in `src/assets/jobs/`). Never invent prices, years, licenses, certifications, job counts, reviews, response times, square footage costs, or durations. If a page needs a fact that isn't there, add `<!-- TODO(seo): need X -->` and list it in the report. §9 lists the open questions for Aaron.
4. **No new unconfirmed claims on the live site.** Right now `confirmed` on FAQs isn't enforced. Fix that (Phase A0.6) so FAQs with `"confirmed": false` never render or appear in schema. Then you can add drafted FAQs safely.
5. **Voice:** CLAUDE.md §3, with plain, short paragraphs. Banned words apply. Note that competitors lean on "seamless", "top-notch", "hassle-free" and "we pride ourselves". We don't.
6. **No search volume claims anywhere.** Priorities below come from intent and commercial value plus real Search Console positions, not volumes.

### Verified facts you can use (all from config; quote exactly)
- Name: STL Demolition & Junk Removal · Phone (314) 379-7955 / +13143797955 · award@stlouishjr.com · Florissant, MO (no street address: service-area business) · Mon–Fri 7am–5pm, Sat–Sun closed
- Founded 2023 · "1,000+" completed jobs · licensed and insured, $3 million policy (`licenseDetails` is null, so never name a license type or number)
- Pricing: $125 minimum pickup. 1/4 load $175 (4.25 yd³), 1/2 $340, 3/4 $515, full $655 (17 yd³, box 16'×7'×4'). Heavy material (concrete, brick, dirt, shingles) adds about $75 per quarter load. Freon items $25 each. Price confirmed before loading. Demolition labor quoted per job, separate from hauling.
- Won't take: tires, batteries, liquid paint, hazardous materials (chemicals, solvents, fuel, **asbestos**, medical waste)
- Demolition scope (services.json): full interior guts, selective deconstruction, interior demolition, kitchen, bathroom, deck, shed demolition, hot tub removal. Notes: "Permits handled", "Tell us what stays", "Utilities first"
- Area: St. Louis City, St. Louis County, St. Charles County (service-areas.json regions/places)
- Disposal: "Loads go to a landfill facility that sorts and separates materials."

### Real job proof already in the repo (use it, it's our edge)
| Service | Jobs (locations.json) | Photos |
|---|---|---|
| Bathroom demolition | Webster Groves (2026-10-29, to studs/subfloor), Manchester (to studs, plumbing exposed), Ladue (curved walk-in shower to framing, 2026-10-14), St. Charles (yellow tile, tub stayed) | webster-groves-bathroom-before/gutted, webster-groves-shower-before/gutted, manchester-bathroom-gutted, manchester-bathroom-vanity-wall, ladue-curved-shower-demo, st-charles-bathroom-before/gutted |
| Kitchen demolition | Brentwood (countertops + backsplash to studs, cabinets protected) | brentwood-kitchen-countertop-backsplash-demo, st-louis-kitchen-demo, kitchen-gut.webp |
| Interior demolition / wall removal | Ferguson (walls taken out to open room) + all bath/kitchen jobs above | ferguson-room-demo |
| Construction debris | Ballwin (garage remodel debris), Hazelwood (gutters/siding/trim), Affton (tile with wire mesh + mortar) | 3 photos |
| Furniture removal | Florissant (solid wood sleigh bed, 2026-09-30), Ballwin (oak display cabinets + armoire, 2026-09-25), Chesterfield (dresser/desk/bed frame curbside) | 4 photos |
| Appliances | Maryland Heights (washer/dryer in garage cleanout), Affton (old washer) | in cleanout/debris photos |
| Carpet removal | O'Fallon (carpet and pad, whole floor) | 2 photos |
| Shed / deck / hot tub | **none recorded** | **none**. See gate in Phase C |

---

## 1. Diagnosis (what the strategist found on Nov 14, 2026)

**Search Console (Elward Ops, last 28 days):** "junk removal st louis" pos 14.7 (landing `/`), "st louis junk removal" 14.2, "junk removal" 9.6 (`/`), "construction debris removal" 10.3 (`/`), "construction debris removal st louis" 19.4, **landing on legacy `/service-area/`**. Demolition queries barely register.

**Live site audit:** `audit-seo.mjs`: 47 pages, 0 errors, 14 warnings. City pages pass the <30% shared-text check and the city gate (they are **not** doorway pages, so keep them). The real problems:
1. **Service pages are thin compared with competitors:** ~470–520 words each. The pages ranking for demolition terms run 1,900–3,300 words with process, permits, debris, cost-factor and FAQ sections (see §2).
2. **No dedicated sub-service pages.** St. Louis Demolition Company ranks with separate kitchen, bathroom, basement, garage, shed, deck, patio and concrete pages. Junk Crusaders and JUNKWISELY have hot tub, furniture, mattress, appliance and shed pages. We have one page per trade, so Google has no page that exactly matches "bathroom demolition st louis".
3. **Google sends "construction debris" and "junk removal" queries to `/`, not to the service pages.** The service pages need to be clearly stronger and better linked for their terms.
4. **Legacy `/service-area/*` redirects all go to the hub**, including old city URLs, so their equity is lost and the debris query lands on a page with no debris content.
5. **Home H1 includes the tagline** ("Junk removal & demolition in St. Louis, MO Point at the mess. We'll handle the rest.").
6. `/services/construction-debris-removal/` meta description is 164 chars. `/services/` (262 words) and `/service-areas/` (275 words) are thin hubs.
7. Service-node schema `description` uses the meta description (with "Get a quote.") instead of the service summary.
8. No demolition-permit content. AES ranks for interior/house demolition with permit and asbestos explainers. Our `locations.json` already holds **38 sourced permit facts**, unused for this.
9. Reviews: `config/reviews.json` source is `google-places` with no manual items. Make sure `GOOGLE_PLACES_API_KEY`/`GOOGLE_PLACE_ID` are set in Netlify, or reviews won't show (TODO for Aaron, §9).

---

## 2. Competitor teardown (pages fetched Nov 14, 2026)

The rank order comes from a web search index, not a Google rank tracker. Treat "ranks" as "shows on page one in our search checks". Word counts are body text excluding header, footer and nav.

### Interior and residential demolition
| Competitor | Ranking page(s) | Title / H1 | Depth | Schema | What they have that we don't |
|---|---|---|---|---|---|
| **St. Louis Demolition Company** (stlouisdemolitioncompany.com) | `/services/selective-demolition/` plus child pages: kitchen, bathroom, basement, garage; structural: shed, deck, patio, carport, pool; concrete; residential; commercial | "Kitchen Demolition in St. Louis \| …" / H1 "Kitchen Demolition in St. Louis" | ~1,950 words per child page | `Product` only (wrong type) | 1 page per sub-service; FAQs on cost, permits, duration, debris, partial demo, hidden issues, damage prevention, prep; areas list. **Weak:** no job proof, repeated boilerplate, generic copy, misspelled city names in area list, wrong schema type |
| **Advanced Environmental Services** (aes-stl.com) | `/interior-demolition`, `/house-demolition`, `/commercial-interior-demolition`, guides and blog on City/County permits and asbestos | "Interior Demolition in St. Louis, MO \| …" / "Interior Demolition Services in St. Louis, Missouri" | 3,300 words (interior), 2,257 (house) | Service, FAQPage, GeneralContractor, BreadcrumbList | Answer-first permit and asbestos facts with official sources (City Permit Section, MO DNR). 12+ FAQs. Strong E-E-A-T on rules. **Weak:** an abatement company, not a homeowner demo + haul crew; no pricing |
| **Earths LLC** | `/interior-demolition` + ~20 city pages (mostly environmental) | "Interior Demolition Services St. Louis \| MO" / "Interior Demolition With Hazmat Screening…" | 791 | BreadcrumbList | Hazmat-screening angle, 5-step process, "who we work with" |
| **Alliance Certified Restoration** | `/services/interior-demo/` | "St. Louis's Premiere Selective Interior Demolition Contractor" | 487 | Organization | "What is selective interior demolition" definitions. Thin |
| **Iron Gate Demolition** | `/selective-demolition-saint-louis/`, `/deck-demolition/`, `/patio-demolition-saint-louis/` | "Selective Demolition Services in Saint Louis" | 540–690 | Organization | Separate deck/patio pages. Thin, no proof |
| **Royal Demo** | home + 21 Metro East IL city pages | "Trusted Demolition Contractor Serving St. Louis, MO" | 893 | HomeAndConstructionBusiness | "Kitchen & Bathroom Demolition" section, FAQ |
| **Hillsdale Demolition** | home, `/selective-demolition` | "Demolition Company \| St. Louis, MO" | 375 | none | Gutting, asbestos abatement, whole-structure demo |
| **Skip's Junk Hauling** | `/demolition/` | "Demolition Service St Louis, MO" | 686 | Service | "Since 1984", "permit-to-seed" process, excavation |
| **JUNKWISELY** | `/services/demolition/` + shed, light, mobile-home demo + city×service pages (Clayton, St. Charles, St. Peters) | "Demolition Services in St. Louis, MO" | 760–785 | Article (wrong) | Shed demo page, city×service pages (thin) |
| Bellon Wrecking, Arch Demolition | residential/commercial wrecking | — | 290–430 | Organization | Whole-structure and commercial wrecking. **Different market. Don't chase.** |

### Junk removal
| Competitor | Ranking page(s) | Title / H1 | Depth | Schema | What they have that we don't |
|---|---|---|---|---|---|
| **Skip's Junk Hauling** | home, `/what-we-haul/`, `/pricing/`, `/areas-served/`, `/skips-vs-chains/` | "Junk Removal Service \| Junk Hauling \| Skip's St. Louis" / "St. Louis' Original Junk Removal Service" | 1,415 | HomeAndConstructionBusiness, Person | Long "what we haul" list (pianos, hot tubs, concrete, carpet), "local vs national chains" page, longevity claim |
| **Junk King St. Louis South** (franchise) | `/locations/st-louis-south` | "Junk Removal in St. Louis South \| Junk King…" | 2,328 | LocalBusiness, FAQPage | Dumpster rental + bag pickup, truck-size comparison, long town list in the meta |
| **Junk Crusaders** | home, `/junk-removal-st-louis/`, 20+ `/what-we-take/*` item pages (hot tub, mattress, furniture, fridge, appliance, construction debris, fence, yard waste, office…), 7 city pages, `/st-louis-landfills/` blog | "Junk Removal St. Louis \| Junk Crusaders…" / "The go-to junk removal and dumpster rental services in St. Louis" | 430 home; 600–750 sub-pages | LocalBusiness (one broken JSON-LD block) | **Breadth of item pages.** Each is thin and templated, so they're beatable with real depth and proof |
| **MrJunk** | `/locations/missouri/junk-removal-st-louis-mo` | "Best Junk Removal In St. Louis MO \| MrJunk® Local Since 2005" | very long (~5k+) | — | Neighborhood name-drops, hoarding/estate/student cleanouts, "since 2005". Lots of filler |
| **1-800-GOT-JUNK? St. Louis** | `/us_en/locations/junk-removal-st-louis/us02018` | "Local St. Louis Junk Removal Service \| 1-800-GOT-JUNK?" | 1,471 | LocalBusiness, BreadcrumbList | Brand plus domain authority, single-item or volume pricing, in-person estimate |
| **College HUNKS St. Louis** | `/st-louis/` | "College HUNKS Moving & Junk Removal™ in St Louis, MO" / "Moving & Junk Removal in St Louis, MO" | 1,981 | Product | **"Junk Removal Pricing in St Louis" section with example price ranges and cost factors.** FAQs: cost, items, what happens to items, how soon |
| **LoadUp** | `/st-louis/construction-debris-removal/`, `/st-louis/concrete-removal/` | "Construction Debris Removal St. Louis, MO \| Pickup & Disposal" | 1,044 | LocalBusiness, Service, FAQPage | Upfront online pricing for debris/concrete, St. Louis neighborhoods, FAQs |
| **STL Junk Removal** (stljunkremoval.com) | home | "Junk Removal St. Louis MO \| Cleanouts, Hauling, Light Demo" | 635 | LocalBusiness, FAQPage | **Same positioning as us** (load-based pricing table, light demo, St. Louis City/County/St. Charles). Competing directly |
| Bobby's, Har-E-Up, Show Me Junk Removal | debris / appliance pages | — | 300–470 | weak or none | Thin. Beatable |

### Gap analysis: where we beat them
1. **Sub-service pages with real job proof.** No competitor shows dated, located jobs with before and after photos on its kitchen or bathroom demo page. We have four bathroom tear-outs in four suburbs. → Build `/services/demolition/bathroom-demolition/`, `/kitchen-demolition/`, `/interior-demolition/` (Phase B).
2. **Demo plus haul in one job, with a published hauling price.** The demolition specialists (SLDC, Royal, Iron Gate, AES) publish no prices. Junk haulers do light demo at best. Our angle is "one crew tears it out and hauls it, hauling priced by the load ($175–$655), labor quoted from photos." Put this in every demolition H1 intro.
3. **Permit content built from our 38 sourced permit facts.** AES wins with permit explainers. We can publish a better, multi-city one from `locations.json` (Phase C3) and add a short permit block per demo sub-page.
4. **Pricing transparency vs franchises.** College HUNKS shows ranges, and GOT-JUNK needs an on-site estimate. We show exact load prices and book online with arrival windows. Lead the junk pages with an answer-first "How much does junk removal cost in St. Louis?"
5. **Item pages Junk Crusaders has and we don't** (hot tub, furniture, appliance, mattress, shed): build them only when we have proof (Phase C gate), and make them deeper than their ~600 templated words.
6. **Schema:** most competitors use `Product`/`Article`/`Organization` or broken JSON-LD. Our clean HomeAndConstructionBusiness + Service + FAQPage graph is an edge. Extend it to every new page.
7. **Don't chase:** whole-house/commercial wrecking, excavation, asbestos/mold abatement, dumpster rental (unless Aaron says otherwise, §9).

---

## 3. Keyword clusters and page map (one primary target per URL, no cannibalization)

Priority is set by commercial intent and current position (no volumes). **P1** = buyer-intent and already near page one; **P2** = high intent, new page; **P3** = support/long tail.

| Pri | Cluster (primary → secondary) | Owner URL | Status |
|---|---|---|---|
| P1 | **junk removal st louis**, st louis junk removal, junk removal st louis mo, junk removal and demolition st louis | `/` | strengthen (Google already picks `/`, pos ~14) |
| P1 | **junk removal services st louis**, junk hauling st louis, junk pickup, haul away, household/commercial junk removal | `/services/junk-removal/` | strengthen (item hub) |
| P1 | **demolition contractor st louis**, demolition services st louis, residential demolition, light demolition, demo and haul away | `/services/demolition/` | strengthen (demo hub) |
| P1 | **construction debris removal st louis**, construction debris removal, construction cleanup, remodel debris removal, drywall removal, dumpster alternative | `/services/construction-debris-removal/` | strengthen + fix legacy redirect |
| P1 | junk removal cost st louis, junk removal prices | `/pricing/` | minor (title already targets it) |
| P2 | **interior demolition st louis**, selective demolition st louis, gut demolition, wall removal, demo to the studs, soft strip | `/services/demolition/interior-demolition/` | **NEW** |
| P2 | **bathroom demolition st louis**, bathroom demo, shower tear out, tub removal, tile removal | `/services/demolition/bathroom-demolition/` | **NEW** |
| P2 | **kitchen demolition st louis**, kitchen demo, cabinet removal, countertop removal, backsplash removal | `/services/demolition/kitchen-demolition/` | **NEW** |
| P2 | estate cleanout st louis, garage cleanout, basement cleanout, move-out cleanout | `/services/cleanouts/` | light refresh |
| P3 | hot tub removal st louis, spa removal | `/services/junk-removal/hot-tub-removal/` | NEW if gate passes (Phase C) |
| P3 | shed demolition / shed removal st louis | `/services/demolition/shed-demolition/` | NEW if gate passes |
| P3 | deck removal / deck demolition st louis | `/services/demolition/deck-removal/` | NEW if gate passes |
| P3 | furniture removal st louis, couch removal, mattress removal | `/services/junk-removal/furniture-removal/` | NEW (proof exists: 3 jobs) |
| P3 | appliance removal st louis, refrigerator removal, washer dryer removal | `/services/junk-removal/appliance-removal/` | NEW (proof: 2 jobs). Ask for more |
| P3 | concrete removal st louis, patio removal | — | **hold**: config says we haul concrete, not that we break out slabs (§9 Q3) |
| P3 | garage demolition st louis | — | **hold**: not in services.json (§9 Q2) |
| P3 | demolition permit st louis / {city} | `/guides/demolition-permits-st-louis/` | NEW (Phase C3) |
| Local | junk removal {city}, demolition {city} | `/service-areas/{city}/` | keep; improve top 8 (Phase C4) |

**Cannibalization rules (enforce in copy and anchors):**
- `/` owns "junk removal st louis". It's the only page whose title starts "Junk Removal & Demolition in St. Louis". `/services/junk-removal/` is titled "Junk Removal & Hauling…" and focuses on *what we take and how it's priced*. Home links to it with anchors like "everything we haul" or "junk hauling services", **not** the exact "junk removal st louis".
- `/services/demolition/` owns the generic demolition terms. Sub-pages own the specific rooms. The hub summarizes each room in 2–3 sentences and links down. It doesn't repeat sub-page content.
- City pages target "{service} in {City}". They never use "St. Louis" as the primary location in title or H1.
- Kitchen/bath content on `/services/construction-debris-removal/` stays about hauling remodel *waste*, not tearing out. It links to the demo pages for the tear-out.

---

## 4. Build phases (in ranking-impact order)

### Phase A0: technical fixes (do first, small, high leverage)
1. **Home H1.** In `src/pages/index.astro` (hero), make the H1 only "Junk removal & demolition in St. Louis, MO". Move "Point at the mess. We'll handle the rest." into a `<p>` (keep the visual style with the same classes).
2. **Legacy redirects** in `netlify.toml`: replace the `/service-area/*` → `/service-areas/` catch-all with **explicit 301s for every page-tier slug** (`/service-area/{slug}/` and `/service-area/{slug}` → `/service-areas/{slug}/`, generated from locations.json, plus the south-county group slugs → `/service-areas/south-county/`). Keep `/service-area/` → `/service-areas/` and a final catch-all `/service-area/*` → `/service-areas/` **after** the explicit rules. Add a short script `scripts/gen-redirects.mjs` or a comment-delimited generated block so it stays in sync. (The legacy `/service-area/` is what Google currently shows for "construction debris removal st louis". After launch, the strategist will request reindexing of `/services/construction-debris-removal/`.)
3. **Meta lengths:** fix `/services/construction-debris-removal/` (Phase A spec below). Also bring `/quote/` (116), `/privacy/`, `/terms/`, `/accessibility/` into 140–155 where sensible. Add FAQPage schema to `/book/` and `/quote/` if their FAQs are visible (audit WARN).
4. **Service schema description:** in the Service node, use the service `summary` (or `intro`) from services.json instead of `metaDescription`.
5. **CLAUDE.md §2.6:** update the deploy line (see §0.2).
6. **Enforce FAQ confirmation:** in `src/data/services.ts` `faq()` (and any other FAQ loaders: home, `/faq/`, city pages), skip items with `confirmed === false` so they never render or reach FAQPage schema. Keep the build green. Add a test or audit check that fails if an unconfirmed FAQ id appears in `dist/`.
7. **Sub-service route support (needed for Phase B):** add `src/pages/services/[service]/[sub].astro` (or `src/pages/services/demolition/[sub].astro` + `src/pages/services/junk-removal/[sub].astro`). Make it data-driven from a new `src/data/subservices.ts`, which reads facts from config and adds page copy. Update `scripts/link-map.mjs` so the generated `site-data/link-map.json` includes parent ↔ child, child ↔ sibling, and child ↔ cities with a job of that sub-service. Update the local-seo SKILL.md architecture table with a new row: **Sub-service | `/services/{service}/{sub}/` | only if it passes the sub-service gate (below)**.
   - **Sub-service gate:** ≥1 completed job of that sub-service in locations.json **and** ≥2 company photos of that work **and** ≥3 page-specific FAQs that are confirmed. Without it, it stays a section on the parent page. Interior, bathroom and kitchen pass on jobs and photos today. Their FAQs come from §5 drafts after Aaron confirms them (until then the pages ship with the existing confirmed FAQs only, see each spec).
   - Add a `subservice` field to jobs in locations.json (e.g. `"subservice": "bathroom-demolition"`) for the existing jobs: Webster Groves, Manchester (bath), Ladue, St. Charles → bathroom-demolition; Brentwood → kitchen-demolition; Ferguson → interior-demolition; Florissant, Ballwin (cabinets/armoire), Chesterfield → furniture-removal; Maryland Heights (washer/dryer), Affton (washer) → appliance-removal. Base each tag only on the job's own summary text.

### Phase A: strengthen the five money pages
Specs in §5 (Home, Junk Removal, Demolition hub, Construction Debris, Cleanouts). Each service page grows from ~500 to **~1,100–1,500 words of real content**: answer-first intro, scope, pricing H2, process, recent jobs with photos linking to city pages, permits/prep (demo), what we don't take, related services, FAQ.

### Phase B: new demolition sub-pages (biggest new-ranking opportunity)
`/services/demolition/interior-demolition/`, `/services/demolition/bathroom-demolition/`, `/services/demolition/kitchen-demolition/`. Specs in §5. Target ~1,200–1,600 words each, every claim from data, real photos (before/after component where pairs exist).

### Phase C: support pages (build only what passes the gate)
1. `/services/junk-removal/furniture-removal/` and `/services/junk-removal/appliance-removal/` (proof exists; appliance has 2 jobs but they're inside other jobs, so check the gate honestly).
2. Hot tub, shed, deck: **don't build yet** unless Aaron adds jobs and photos to `locations.json` / `src/assets/jobs/` (§9 Q5). Meanwhile, give each its own H2 section with an `id` anchor on the parent page (`/services/demolition/#shed-demolition`, `#deck-removal`, `#hot-tub-removal`) with 80–150 words from services.json and pricing.json ("A small shed, taken down" fits a 3/4 load at $515; "A deck, demolished and hauled" fits a full load at $655. These are typical examples from pricing.json, and you must say they're not promises, per `examplesNote`).
3. `/guides/demolition-permits-st-louis/`: "Do you need a permit for demolition in St. Louis?" Build it from `locations.json` `local_facts.permits` (38 sourced facts). One H2 per jurisdiction (cities with pages, plus unincorporated St. Louis County via the South County group). Each fact gets its source link (allowed outbound per linking.md). An intro explains that rules differ by municipality and that permit requirements apply to the property's jurisdiction. Add "We handle the permit when your job needs one" (from services.json "Permits handled") **only if Aaron confirms §9 Q1**. Otherwise phrase it as "Tell us your address and we'll check what your city requires." Before reusing any source, re-open it (CLAUDE.md §1). Any City of St. Louis or Missouri DNR asbestos rule must come from a source you open (stlouis-mo.gov / dnr.mo.gov) and be added to a new `site-data/rules.json` with the source URL. No source, no sentence. Schema: WebPage + BreadcrumbList + FAQPage (if Q&A is visible). Title: "Demolition Permits in St. Louis by City | STL Demolition" (check length 50–60).
4. **City pages (top 8):** Florissant (home base), Chesterfield, O'Fallon, St. Charles, Ballwin, Webster Groves, Manchester, Ladue. These have the most proof or are among the larger municipalities we serve (don't print population numbers). For each:
   - Add a "Demolition in {City}" or "Junk removal in {City}" sub-section only where that city has a job of that service, linking to the matching sub-service page with descriptive anchors ("bathroom demolition in Webster Groves").
   - Use the job's photo(s) and summary verbatim-ish. Show the date only if recorded.
   - Keep titles consistent: `Junk Removal & Demolition in {City}, MO` where it fits in 60 chars with the brand. Chesterfield currently drops "& Demolition"; it fits at 59, so fix it.
   - Keep shared text <30% (audit enforces).
   - Kirkwood and St. Peters are `mention` tier only because their city sites blocked automated fetches. Try fetching from Aaron's Mac. If you can verify ≥2 local facts plus 1 official link each (with sources), promote them through the gate. Otherwise leave them and report.
5. **Hubs:** `/services/` gets ~400 words: a "which service do you need" decision guide linking to every service and sub-service, with a mini price table from pricing.json. `/service-areas/` gets ~400 words: an intro by region from service-areas.json blurbs, which region each city page sits in, and a link to the permits guide.

### Phase D: verify, then open the PR (don't merge)
See §7 acceptance criteria.

---

## 5. Page specs (exact copy targets)

Brand suffix " | STL Demolition" is appended by Base. The **title (full)** lengths below include it. Meta descriptions must be 140–155 chars (the audit warns otherwise; recount after edits). Copy outlines are guidance. Write the actual paragraphs in the owner's voice using only data facts. Every page: one H1, answer-first first two sentences, `tel:` CTA above the fold and at the bottom, breadcrumbs, ≥2 contextual body links, FAQPage only for visible confirmed FAQs, the business node with the same `@id`, a Service node (`provider` → business `@id`, `areaServed` = St. Louis City / St. Louis County / St. Charles County as `AdministrativeArea`/`City` like the existing service pages), **no AggregateRating/Review markup**.

### 5.1 Home `/`  (primary: junk removal st louis)
- **Title (full, 59):** `Junk Removal & Demolition in St. Louis, MO | STL Demolition` (keep)
- **Meta (keep current, 150):** "St. Louis junk removal, demolition and cleanouts, priced by the load. See what a 1/4, 1/2, 3/4 or full 17-yard truck costs and book online in minutes."
- **H1:** `Junk removal & demolition in St. Louis, MO` (tagline moved out, A0.1)
- **Intro (first 2 sentences):** what (junk removal + demolition + cleanouts), where (St. Louis City, St. Louis County, St. Charles County, based in Florissant), differentiator (priced by the load from $175, $125 minimum, price confirmed before loading).
- **Add/adjust H2s:**
  - "How much does junk removal cost in St. Louis?" First sentence answers it with load prices from pricing.json. The existing LoadConfigurator stays. Link to `/pricing/` ("full price breakdown").
  - "Demolition in St. Louis: kitchens, bathrooms and interiors" (2–3 sentences + links to the 3 new sub-pages and the demo hub; one before/after pair, Webster Groves).
  - "Recent jobs around St. Louis": latest 3–4 dated jobs from locations.json (Webster Groves 2026-10-29, Ladue 2026-10-14, Florissant 2026-09-30, Ballwin 2026-09-25), each linking to its city page.
  - Keep "Where we work": St. Louis City neighborhoods from service-areas.json as plain text (no city page for St. Louis City; home is the St. Louis page).
- **FAQ:** existing `home: true` FAQs (all confirmed).
- **Links out:** each service page and each new sub-page (descriptive anchors), `/service-areas/`, top 8 city pages, `/guides/demolition-permits-st-louis/` once built.

### 5.2 `/services/junk-removal/`  (primary: junk removal services / junk hauling st louis)
- **metaTitle → full (56):** `Junk Removal & Hauling in St. Louis, MO | STL Demolition`
- **Meta (153):** "Junk removal and hauling in St. Louis, priced by the load from $175 ($125 minimum). Furniture, appliances, hot tubs and more. See prices and book online."
- **H1:** `Junk removal and hauling in St. Louis, MO`
- **Outline:**
  1. Intro: we carry it out from anywhere (basement, attic, backyard), load, haul, and you pay for truck space. Licensed and insured ($3 million policy).
  2. H2 "What we haul": grouped list from services.json items + FAQs (furniture, appliances, mattresses, exercise equipment, office clutter, hot tubs, sheds, carpet). Each group links to its sub-page or section when one exists.
  3. H2 "How much does junk removal cost in St. Louis?": answer with $125 min / $175–$655 loads, Freon $25, heavy +~$75/quarter, access labor. Mini table. Link `/pricing/`.
  4. H2 "What we can't take": tires, batteries, liquid paint, hazardous (from FAQ).
  5. H2 "How it works": book online (pick load, address, photos, arrival window), we confirm price before loading, you don't need to be home (FAQ `home`), same-day when the schedule allows (FAQ `same-day`).
  6. H2 "Recent junk removal jobs": Florissant, Ballwin, Chesterfield, Wildwood, Creve Coeur, Jennings, O'Fallon, Cottleville, with photos, each linked to its city page (if a page exists).
  7. H2 "Where does it all go?": FAQ `recycling` text.
  8. Related services + FAQ (existing confirmed: pricing, furniture, appliances, inside, not-accepted, + load-size, same-day).

### 5.3 `/services/demolition/`  (primary: demolition contractor st louis)
- **metaTitle → full (55):** `Demolition Contractor in St. Louis, MO | STL Demolition`
- **Meta (155):** "Demolition contractor in St. Louis for kitchens, bathrooms, interiors, decks and sheds. We tear it out and haul it off in one job. Send photos for a quote."
- **H1:** `Demolition contractor in St. Louis, MO`
- **Outline:**
  1. Intro: we do both halves, the tear-out and the haul-off, from one shed to a full interior gut. Labor quoted per job from photos; hauling priced by the load.
  2. H2 "Interior, kitchen and bathroom demolition": three cards linking to the sub-pages, each with one real job photo.
  3. H2 "Outdoor demolition: sheds, decks and hot tubs": id-anchored sections (Phase C2) until those pages pass the gate.
  4. H2 "How much does demolition cost in St. Louis?": answer: labor is quoted per job because it depends on what's coming down and how; debris hauling follows the load prices ($175–$655), and heavy material adds ~$75 per quarter load. **No per-square-foot numbers.**
  5. H2 "Before we start: permits, utilities and what stays": the three services.json notes ("Permits handled" wording depends on §9 Q1), plus a link to the permits guide. Add one line that we can't take asbestos (from FAQ `not-accepted`), so suspect materials have to be tested and handled first (`<!-- TODO(seo): confirm with Aaron how asbestos testing is arranged on demo jobs -->`).
  6. H2 "Recent demolition jobs": Webster Groves, Ladue, Manchester, St. Charles, Brentwood, Ferguson, with photos linking to city pages.
  7. H2 "Demolition we don't do": `<!-- TODO(seo): confirm with Aaron. Whole-house/commercial structure demolition? Garage demolition? Concrete breakout? -->` Leave it out of the render until answered.
  8. FAQ (existing confirmed: demolition, estimates, pricing, construction-debris).

### 5.4 `/services/construction-debris-removal/`  (primary: construction debris removal st louis)
- **metaTitle → full (57):** `Construction Debris Removal in St. Louis | STL Demolition` (keep)
- **Meta (153, replaces the 164-char one):** "Construction debris removal in St. Louis: drywall, lumber, flooring, remodel waste loaded and hauled, no dumpster. From $175 a quarter load. Book online."
- **H1:** `Construction debris removal in St. Louis`
- **Outline:**
  1. Intro: for homeowners mid-remodel and contractors between phases. We load the pile and take it, so there's no dumpster permit on the street and no waiting for a swap (services.json summary).
  2. H2 "What construction debris we take": items list + heavy materials (concrete, brick, dirt, shingles).
  3. H2 "How much does construction debris removal cost?": $175/quarter … $655 full; heavy +~$75 per quarter load; location/equipment can add more.
  4. H2 "Debris pickup vs. a dumpster": factual comparison using only our facts (we load it, priced by the load, price confirmed first, no dumpster sitting in the driveway). **Don't quote dumpster prices.**
  5. H2 "For contractors: recurring job-site pickups": "Call us to set up regular pickups across multiple sites."
  6. H2 "Recent debris jobs": Ballwin, Hazelwood, Affton (photos + city links).
  7. Links: "need it torn out first? see interior demolition", kitchen/bath demo pages.
  8. FAQ (existing confirmed).

### 5.5 `/services/cleanouts/`  (primary: estate / garage / basement cleanout st louis)
- **metaTitle → full (59):** `Garage & Estate Cleanouts in St. Louis, MO | STL Demolition`
- **Meta (keep, 153).** H1 keep. Add H2 "How much does a cleanout cost?" (load pricing; a second load is priced the same way), H2 "Estate cleanouts" (the "lighter touch" note), the jobs (Maryland Heights garage before/after, Manchester storage unit), FAQ (existing).

### 5.6 NEW `/services/demolition/interior-demolition/`  (primary: interior demolition st louis, selective demolition st louis)
- **Title (full, 53):** `Interior Demolition in St. Louis, MO | STL Demolition`
- **Meta (150):** "Interior demolition in St. Louis: walls, drywall, flooring and fixtures out to the studs, and the debris hauled the same job. Send photos for a quote."
- **H1:** `Interior demolition in St. Louis, MO`
- **Breadcrumb:** Home › Services › Demolition › Interior demolition
- **Outline (~1,200–1,500 words):**
  1. Answer-first intro: we take out walls, drywall, flooring, ceilings and fixtures, from one room to a full gut down to the studs and subfloor, and the debris leaves on our truck the same job. Serving St. Louis City, County and St. Charles County.
  2. H2 "Full gut or selective demolition?": definitions from services.json ("Full interior guts: down to the studs and subfloor, ready for your contractor" / "Selective deconstruction: careful removal of just what's going, around what's staying").
  3. H2 "What we take out": walls, drywall, flooring, ceilings, fixtures, cabinets, tile, carpet and pad.
  4. H2 "Before demo day": utilities shut off and capped (services.json note), mark what stays, permits (§9 Q1 wording), asbestos line (as in 5.3), link to the permits guide.
  5. H2 "How much does interior demolition cost in St. Louis?": labor quoted per job from photos, hauling by the load (prices), heavy material surcharge. **No invented ranges or durations.**
  6. H2 "Interior demolition jobs we've done": Ferguson (walls opened up), Manchester bath, Webster Groves bath, Ladue shower, St. Charles bath, Brentwood kitchen tops. Photos + city links.
  7. H2 "Kitchens and bathrooms": short blurbs linking to the two sub-pages.
  8. H2 "Who we work with": homeowners mid-remodel, contractors (recurring pickups note), landlords/rentals (services.json "Property cleanouts" covers rentals; keep it factual).
  9. FAQ: confirmed `demolition`, `estimates`, `construction-debris` + drafted (confirmed:false until Aaron approves, §5.9).
  10. CTA: quote with photos (`/quote/`) + call.
- **Schema:** Service `{name:"Interior Demolition", serviceType:"Interior demolition", provider, areaServed, isRelatedTo/parent: /services/demolition/#service}` + BreadcrumbList + FAQPage (visible confirmed only).

### 5.7 NEW `/services/demolition/bathroom-demolition/`  (primary: bathroom demolition st louis)
- **Title (full, 53):** `Bathroom Demolition in St. Louis, MO | STL Demolition`
- **Meta (152):** "Bathroom demolition in St. Louis: vanities, tile, showers and drywall torn out to the studs and subfloor, debris hauled the same job. Get a photo quote."
- **H1:** `Bathroom demolition in St. Louis, MO`
- **Outline (~1,200 words):** intro (tubs, showers, vanities, toilets, tile and subfloor out; debris hauled). H2 "What comes out in a bathroom tear-out" (services.json item text). H2 "Keeping what stays": the St. Charles job kept the tub in place, Brentwood-style protection (cite real jobs only). H2 "Bathroom demolition jobs around St. Louis" with four before/after jobs (Webster Groves, Manchester, Ladue, St. Charles) + city links; use the `BeforeAfter` component for the pairs. H2 "How much does bathroom demolition cost?": labor quoted from photos; hauling example: pricing.json lists "A small bathroom tear-out" under the 1/2 load ($340), as a typical example, not a promise. H2 "Before we start" (utilities, permits, asbestos line). Related: kitchen + interior demo, construction debris. FAQ (confirmed + drafts).
- **Schema:** Service "Bathroom Demolition" + BreadcrumbList + FAQPage.

### 5.8 NEW `/services/demolition/kitchen-demolition/`  (primary: kitchen demolition st louis)
- **Title (full, 52):** `Kitchen Demolition in St. Louis, MO | STL Demolition`
- **Meta (154):** "Kitchen demolition in St. Louis: cabinets, countertops, backsplash and flooring torn out and hauled, ready for your remodel. Send photos for a free quote."
- **H1:** `Kitchen demolition in St. Louis, MO`
- **Outline (~1,100 words):** intro (services.json kitchen item). H2 "Full kitchen tear-out or just the tops?" (Brentwood: countertops + backsplash only, cabinets/appliances/floors protected). H2 "What we remove" (cabinets, counters, backsplash, flooring, appliances; Freon appliances $25 each). H2 "How much does kitchen demolition cost?" (labor from photos; pricing.json "Kitchen cabinets, counters and drywall" listed under the 3/4 load, $515, typical not promised). H2 "Kitchen demo photos" (brentwood, st-louis-kitchen-demo, kitchen-gut; `<!-- TODO(seo): Aaron, where and when were st-louis-kitchen-demo.jpg and kitchen-gut.webp taken? -->` Use neutral captions until then). H2 "Before we start". Related + FAQ.
- **Schema:** Service "Kitchen Demolition" + BreadcrumbList + FAQPage.

### 5.9 Drafted FAQs (add to `config/faqs.json` with `"confirmed": false`; they won't render until Aaron flips them)
Every answer restates config facts only. Aaron must approve.
- `demo-cost`: "How much does demolition cost?" → "Demolition labor is quoted per job, because it depends on what's coming down and how. Send photos with a quote request and we'll give you a real number. Hauling the debris is priced by the load, from $175 for a quarter to $655 for a full 17-yard truck."
- `demo-what-stays`: "Can you remove just part of a room?" → "Yes. Selective deconstruction is careful removal of just what's going, around what's staying. Mark what's structural, what's being reused and what's off-limits, and we plan around it."
- `demo-utilities`: "Do I need to shut off utilities before demolition?" → "Yes. Water, gas and electric to the area need to be shut off and capped before demo. Ask us if you're not sure."
- `demo-permit`: "Do I need a permit for demolition?" → **wording depends on §9 Q1**. Draft: "It depends on your city and the job. If your job needs a permit, we pull it, so you don't have to deal with the city." (This matches the services.json note; keep it unconfirmed until Q1 is answered.)
- `demo-asbestos`: "Can you remove asbestos?" → "No. We can't take asbestos or other hazardous materials. If a material is suspect, it has to be tested and handled by a qualified contractor before we start." (TODO: Aaron to confirm the second sentence.)
- `demo-debris`: "What happens to the debris?" → "It leaves with us in the same job. Loads go to a landfill facility that sorts and separates materials."
- `bath-keep-tub`: "Can you leave the tub in place?" → "Yes, when that's the plan. Tell us what stays when you book and we work around it." (Backed by the St. Charles job, where the tub stayed.)

---

## 6. Internal linking changes (regenerate `site-data/link-map.json`, don't hand-write it)
- Home → 4 service pages + 3 demo sub-pages + hub + top 8 cities + permits guide.
- Demo hub ↔ each demo sub-page. Sub-pages ↔ each other. Sub-page → construction debris page ("haul away remodel waste").
- Sub-page → each city with a job of that sub-service (from the new `subservice` tag). City page → that sub-page.
- Junk hub ↔ furniture/appliance pages (if built). Pricing ↔ all service pages.
- Anchors: descriptive and varied. Use "junk removal st louis" as an exact anchor at most once site-wide (nav excluded). No "learn more"/"click here".
- Every new page is in the sitemap, ≤3 clicks from home, and has ≥1 contextual inbound link.

## 7. Acceptance criteria (all must pass before opening the PR)
1. `npm ci && npm run build` succeeds. `npx astro check` and `npm test` pass.
2. `node scripts/audit-seo.mjs dist`: **0 errors**. No new warnings on changed or new pages (titles 50–60, metas 140–155, one H1, FAQPage when FAQs show, city shared text <30%).
3. `seo-auditor` agent: **PASS**. No FABRICATED flags. Fix everything it raises.
4. No broken internal links. Run a link check over `dist/` (e.g. `npx linkinator dist --recurse --skip "^(?!/)"` or a small script). Zero 404s, and no internal links pointing at redirecting URLs.
5. `dist/sitemap.xml` and `sitemap-index.xml` include every new URL with trailing slashes. `/booking/` and 404 are still excluded.
6. Every JSON-LD block parses (`JSON.parse`), uses one business `@id` site-wide, has no AggregateRating/Review on the business, and FAQPage text matches the visible text exactly. Validate one new sub-page and the home page at validator.schema.org (paste the HTML) and put the result in the PR.
7. Lighthouse SEO score on `/`, `/services/demolition/`, and one new sub-page is ≥ the current score (run `npx lighthouse` against `npx astro preview`, report before/after). Performance shouldn't regress more than 5 points.
8. `netlify.toml` redirects: list each `/service-area/{slug}/` → `/service-areas/{slug}/` rule in the PR description.
9. No unconfirmed FAQ text appears in `dist/` (the test from A0.6).
10. No new owner-note placeholders are visible on production pages. TODOs live in HTML comments only.

## 8. PR description must include
- Pages changed and created (with URLs), the link-map diff summary, and audit, auditor, Lighthouse and schema results.
- Every `TODO(seo)` added, and the drafted FAQ ids waiting on Aaron.
- Anything from this brief you skipped and why.
- **Do not merge.** Tag the PR "needs-owner-review".

## 9. Questions only Aaron can answer (leave TODOs, don't guess)
1. **Permits:** services.json says "If your job needs a permit, we pull it." The City of St. Louis says demolition permits must be pulled by a City-certified demolition contractor (per a competitor page, still to be verified with the City). Is STL Demolition City-certified, or do you pull permits only in the County and other cities? What license(s) should "licensed" refer to (`licenseDetails` is null)?
2. **Scope limits:** do you do whole garage demolition, whole-house or commercial structure demolition, or only interior/light demo?
3. **Concrete:** do you break out patios, driveways and slabs, or only haul concrete that's already broken? (This decides whether we build a concrete removal page.)
4. **Asbestos:** on demo jobs, who arranges asbestos testing? Can the drafted `demo-asbestos` answer go live?
5. **Proof for new pages:** send photos plus city/date for any shed demo, deck removal, hot tub removal, mattress or appliance jobs. Two or more each unlocks those pages. Also say where and when `st-louis-kitchen-demo.jpg` and `kitchen-gut.webp` were taken.
6. **Approve the drafted FAQs** in §5.9 (or edit them).
7. **Reviews:** are `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID` set in Netlify? If not, paste 3–6 Google reviews word for word into `config/reviews.json` (manual source) with the reviewer's first name and town if shown.
8. **Commercial demo / dumpster rental:** do you want to compete for "commercial interior demolition" or "dumpster rental"? Both are out of scope by default.
