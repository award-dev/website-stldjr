# STL Demolition & Junk Removal — website

Marketing site and booking product for **STL Demolition & Junk Removal**
(stlouishjr.com), St. Louis, MO.

- **Static, fast pages** built with [Astro](https://astro.build) — no client
  framework; each interactive piece is a small TypeScript module.
- **Load-based pricing configurator** (1/4 → full 17 yd³ truck, drawn to scale).
- **Guided booking** into Haul-off Ops (the CRM) — or the site's own Google Calendar engine — with photo upload,
  inline validation, saved progress, reschedule/cancel links and honest error
  states. **Quote requests** go to the CRM and Netlify Forms.
- **Everything business-critical is config**, not code: `config/*.json`.
- **No invented content.** Missing facts show as purple "OWNER" notes until
  supplied — see [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md).

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
| Photos (before/after, work) | `config/media.json` + `public/photos/` |
| Homepage hero video | `config/media.json → heroVideo` + `public/videos/` (see below) |

Commit a change and Netlify rebuilds. Secrets and optional overrides are
environment variables — see [`.env.example`](.env.example).

## Hero video

The homepage hero can play a muted, looping background video behind the copy
and the load configurator. The intended footage is a 15–20s seamless loop of
two crew members loading the Isuzu dump truck. Put these files in
`public/videos/` and rebuild. Paths are set in `config/media.json →
heroVideo`. Each file is used only if it exists; with none, the hero keeps its
plain background.

| File | What | Target |
| --- | --- | --- |
| `hero-1080.webm` / `hero-1080.mp4` | Tablet + desktop (≥768px), 16:9 | 1920×1080, ~3–5 MB |
| `hero-mobile.webm` / `hero-mobile.mp4` | Phones (<768px), portrait 9:16 crop | 720×1280, ~1–2 MB |
| `hero-poster.jpg` | First frame of the 16:9 encode | 1920×1080, <150 KB |
| `hero-poster-mobile.jpg` | First frame of the 9:16 encode | 720×1280, <80 KB |

No audio track. On desktop, the left ~40% of the frame sits under the headline
behind a dark scrim, and the right side is mostly behind the configurator
card, so frame the action center-right. The mobile crop shows behind the
headline only.

```sh
ffmpeg -i master.mov -an -vf "scale=1920:-2,fps=30" -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 public/videos/hero-1080.webm
ffmpeg -i master.mov -an -vf "scale=1920:-2,fps=30" -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart public/videos/hero-1080.mp4
ffmpeg -i master.mov -an -vf "crop=ih*9/16:ih,scale=720:1280,fps=30" -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 public/videos/hero-mobile.webm
ffmpeg -i master.mov -an -vf "crop=ih*9/16:ih,scale=720:1280,fps=30" -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart public/videos/hero-mobile.mp4
ffmpeg -i public/videos/hero-1080.mp4 -frames:v 1 -q:v 5 public/videos/hero-poster.jpg
ffmpeg -i public/videos/hero-mobile.mp4 -frames:v 1 -q:v 5 public/videos/hero-poster-mobile.jpg
```

The poster `<img>` is the first paint (and LCP). Video sources are attached
after `load` and picked by viewport, WebM first, then MP4. Visitors with
reduced motion, Save-Data or 2G get only the poster and never download the
video. The video pauses off-screen, and a pause button appears once it plays
(WCAG 2.2.2).

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
src/pages/           routes: /, /junk-removal, /cleanouts, /demolition,
                     /construction-debris-removal, /pricing, /service-area,
                     /about, /faq, /book, /quote, /booking, legal, 404
src/components/      design-system components
src/scripts/         client modules: booking flow, analytics, load visual
src/styles/global.css  tokens, type, buttons, forms, motion
tests/               node:test suites
scripts/local-server.mjs  local preview with functions
```

## Design system

- **Palette:** asphalt `#121311`, paper `#F3F1EC`, concrete greys, and one
  signal green `#3FCB5C` from the truck logo (`#137A32` for green text on light).
- **Type:** Geist (self-hosted, variable) for everything, Geist Mono for
  measurements and labels.
- **Motif:** measurement — the truck box drawn to scale in isometric, quarter
  ticks, cubic-yard labels.
- **Motion:** 140–420 ms, ease-out curves, used only to show state changes
  (load fill, segmented thumb, step transitions, press feedback). All of it
  respects `prefers-reduced-motion`.

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
