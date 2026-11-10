# STL Demolition & Junk Removal — website

Marketing site and booking product for **STL Demolition & Junk Removal**
(stlouishjr.com), St. Louis, MO.

- **Dark, media-first design** built with [Astro](https://astro.build) + Tailwind 4, with small
  React islands for the intro loader, photo gallery/lightbox and (when there is footage) video reels.
  Rebuilt with the business-site-builder skill's design system.
- **Load-based pricing configurator** (1/4 → full 17 yd³ truck, drawn to scale).
- **Guided booking** into Haul-off Ops (the CRM), or the site's own Google Calendar engine, with photo upload,
  inline validation, saved progress, reschedule/cancel links and honest error
  states. **Quote requests** go to the CRM and Netlify Forms.
- **Everything business-critical is config**, not code: `config/*.json`.
- **No invented content, no stock photos.** Sections with no real media hide themselves.

## Quick start

```bash
npm install
npm run build                     # → dist/
MOCK_CALENDAR=1 npm run preview   # http://localhost:4321 with a simulated calendar
npm test                          # server logic tests
npm run check                     # type check
```

## Editing content (no code)

| What | File |
| --- | --- |
| Name, phone, email, hours, links, trust facts, analytics | `config/business.json` |
| Load prices, sizes, examples, pricing conditions | `config/pricing.json` |
| Booking rules (windows, durations, notice, crews) | `config/booking.json` |
| Services, "what needs to go" options, service pages | `config/services.json` |
| Service area regions and towns | `config/service-areas.json` |
| FAQ | `config/faqs.json` |
| Reviews | `config/reviews.json` |
| Job photos (alt text, categories) | `src/data/projects.ts` + `src/assets/jobs/<category>/` |
| Page copy, intro wording, photo picks | `src/data/content.ts` |
| Service page SEO fields and cover photos | `src/data/services.ts` (copy itself is in `config/services.json`) |
| Videos (reels, hero stories) | `src/data/videos.ts` + `public/videos/` |
| Brand color | `src/styles/global.css` between `brand:start` / `brand:end` |

Commit a change and Netlify rebuilds. Secrets and optional overrides are
environment variables — see [`.env.example`](.env.example).

## Photos and videos

Only the company's own photos and footage. Photos go in `src/assets/jobs/<category>/` and get an entry
in `src/data/projects.ts` (Astro serves them as responsive WebP, never upscaled). Every video section
(hero stories, walkthrough reels, feature video) is hidden until `src/data/videos.ts` lists a video.
Portrait phone walkthroughs (1080×1920) work best; each needs a poster in `src/assets/video-posters/`
and a short muted preview loop in `public/videos/previews/`.

## Share card

The link-preview image is `src/assets/brand/og-card.png`, a capture of the finished intro screen.
Absolute URLs (canonical, og:image, sitemap, schema) use `config/business.json → siteUrl`; set the
`SITE_URL` env var to build for another host (e.g. a Netlify preview domain before the DNS move).

## Deploying (Netlify)

Connect the repo in Netlify; `netlify.toml` sets the build (`npm run build`,
publish `dist`, functions in `netlify/functions`). Then follow
[`docs/BOOKING.md`](docs/BOOKING.md) to connect Google Calendar.

## Structure

```
config/              business data (single source of truth)
shared/              time zone, pricing and .ics helpers used by site + server
server/lib/          booking logic, calendar, storage, notifications, validation
netlify/functions/   HTTP endpoints (/api/*)
src/data/            site facts (from config), page copy, services, photos, videos
src/pages/           routes: /, /services/, /services/<slug>/, /pricing/, /projects/,
                     /service-areas/, /service-areas/<city>/, /service-areas/south-county/,
                     /about/, /contact/, /faq/, /book/, /quote/, /booking/, legal, 404
site-data/           local-SEO data: locations.json (verified city facts + sources),
                     link-map.json (generated: npm run seo:links)
.claude/             local-seo skill + seo-auditor agent (see CLAUDE.md)
src/components/      layout + design-system components; react/ holds the islands
src/scripts/         client modules: booking flow, analytics, load visual
src/styles/          global.css (tokens, type, buttons), media.css, intro.css,
                     legacy.css (forms, choices, booking widgets on the dark theme)
tests/               node:test suites
scripts/local-server.mjs  local preview with functions
```

## Design system

- **Palette:** near-black `#0b0a09`, warm cards `#191613` / `#221e1a`, text `#f4efe8`, and one
  signal green `#3FCB5C` from the truck logo (dark text on green buttons, 9:1 contrast).
- **Type:** Bricolage Grotesque (display) and Geist (body), self-hosted via @fontsource; Geist Mono
  for measurements.
- **Intro:** a 5-second once-per-visit loader ("Point at the mess."), skippable, off on the booking pages.
- **Motion:** scroll reveals, hover lifts, a services marquee. All of it respects `prefers-reduced-motion`.

## Local SEO

City pages follow the local-seo kit (`CLAUDE.md`, `.claude/skills/local-seo/`). A city gets its own page
only when `site-data/locations.json` has enough verified local facts, each with its official source;
the rest are listed on `/service-areas/`. After changing pages or data:

```sh
npm run seo:links   # regenerate site-data/link-map.json
npm run build
npm run seo:audit   # node scripts/audit-seo.mjs dist — must PASS
```

## Analytics events

Sent to `window.dataLayer`, plus Plausible or GA4 if configured. Personal
data is stripped before sending.

`cta_click` · `phone_click` · `pricing_select` · `service_select` ·
`load_select` · `booking_start` · `booking_step_view` · `booking_step_complete` ·
`booking_validation_error` · `photo_upload` · `calendar_date_select` ·
`calendar_slot_select` · `booking_submit` · `booking_complete` · `booking_error` ·
`booking_abandon` · `booking_switch_to_quote` · `booking_reschedule` ·
`booking_cancel` · `quote_start` … `quote_complete` · `quote_abandon` ·
`zip_check` · `before_after_drag` · `add_to_calendar`

Conversion rate = `booking_complete` (or `quote_complete`) ÷ sessions, in
your analytics tool.
