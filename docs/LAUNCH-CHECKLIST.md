# Launch checklist (owner)

Purple **OWNER** notes on the site mark what's still missing. When the list
below is done, set `showOwnerNotes` to `false` in `config/business.json`.

## Done (entered from the owner's answers)

- [x] Prices: $175 / $340 / $515 / $655, shown as "From $X"
- [x] Pricing conditions: heavy material ~$75 per quarter load, Freon $25/item,
      no tires, batteries, liquid paint or hazardous materials
- [x] Hours: Mon–Fri 8am–5pm, closed weekends
- [x] Service area confirmed as listed
- [x] Policies: not home required (price confirmed by phone), same-day bookable online with 2 hours notice when
      the schedule allows, free estimates, permits handled, 24-hour notice preferred
- [x] Arrival windows 9–11, 11–1, 1–3, 3–5; jobs can run past 5pm
- [x] Licensed & insured ($3M), founded 2023, 1,000+ jobs, founder Aaron Ward
- [x] Google Business Profile + Facebook links; About story
- [x] Company notification email: award@stlouishjr.com

## Still to do

- [ ] **Netlify project** + point the Squarespace domain's nameservers at Netlify DNS.
- [ ] **Google Calendar** (award@stlouishjr.com) — see `docs/BOOKING.md`. If
      stlouishjr.com is Google Workspace, the admin must allow sharing
      calendars with external users so the service account can be added.
- [ ] **Netlify env vars:** `GOOGLE_CALENDAR_ID`, `GOOGLE_CALENDAR_CREDENTIALS`,
      `BOOKING_SIGNING_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`.
- [ ] **Resend** — verify stlouishjr.com (add its DNS records in Netlify DNS
      after the nameserver move). `EMAIL_FROM` e.g. `bookings@stlouishjr.com`.
- [ ] **Quote notifications** — Netlify → Forms → `quote` → email to award@stlouishjr.com.
- [ ] **Google Analytics** — Measurement ID (`G-…`) into
      `config/business.json → analytics.ga4MeasurementId`.
- [ ] **Photos** — before/after pairs + truck/crew/work photos (`config/media.json`).
- [ ] **Hero video** — loop + posters into `public/videos/` (README → Hero video).
- [ ] **Review text** — paste real Google reviews into `config/reviews.json`, or
      enable live reviews with `GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_ID`.
- [ ] **Instagram / Nextdoor** links, if any.
- [ ] **Legal review** of `/privacy` and `/terms`.
