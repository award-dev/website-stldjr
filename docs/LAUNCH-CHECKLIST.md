# Launch checklist (owner)

Everything below is marked on the site with a purple **OWNER** note while
`showOwnerNotes` is `true` in `config/business.json`. Work through the list,
then set `showOwnerNotes` to `false`.

Nothing on the site was invented: no prices, reviews, statistics, licenses,
years in business or policies. Where the business hasn't supplied something,
the site either leaves it out or shows a clearly-marked placeholder.

## Must do

- [ ] **Prices** — `config/pricing.json → loads[].price` (whole dollars), or
      `PRICE_*` environment variables. Choose `priceMode`: `"from"` or `"flat"`.
      Until set, every load shows "Priced on-site".
- [ ] **Pricing conditions** — review `config/pricing.json → conditions`.
- [ ] **Business hours** — `config/business.json → hours`, then set `"confirmed": true`
      (this also adds hours to Google's structured data).
- [ ] **Service area** — `config/service-areas.json`. Remove anywhere you
      don't go; set `"confirmed": true`.
- [ ] **FAQ policies** — answers marked `"confirmed": false` in
      `config/faqs.json` describe policy (what you can't take, do people need
      to be home, same-day, demolition scope, heavy materials). Edit, then set
      `"confirmed": true`.
- [ ] **Demolition & debris scope** — confirm the lists in `config/services.json`
      (permits, concrete/brick/dirt/shingles).
- [ ] **Connect booking** — see `docs/BOOKING.md` (Google Calendar +
      `BOOKING_SIGNING_SECRET`). Check `/api/status`.
- [ ] **Quote notifications** — Netlify → Forms → `quote` → add an email notification.
- [ ] **Legal pages** — have `/privacy`, `/terms` reviewed; add a cancellation
      policy (`config/booking.json → cancellationPolicy`).

## Should do

- [ ] **Photos** — real job, crew and truck photos in `public/photos/`, wired
      in `config/media.json` (6 before/after pairs, 6 work photos). The
      before/after slider shows labelled illustrations until then.
- [ ] **Reviews** — paste real Google reviews into `config/reviews.json`
      word for word, or switch to live reviews (`source: "google-places"` +
      `GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_ID`).
- [ ] **Links** — Google Business Profile, review link, Facebook, Instagram in
      `config/business.json → links`.
- [ ] **Trust facts** — only if verifiable: founding year, insurance,
      licensing, completed jobs (`config/business.json → trust`).
- [ ] **Email confirmations** — Resend account + verified domain
      (`RESEND_API_KEY`, `EMAIL_FROM`).
- [ ] **Analytics** — `config/business.json → analytics` (`plausible` or `ga4`).
- [ ] **About page story** — replace the owner note in `src/pages/about.astro`.

## Carried over from the old site — confirm

- The previous site offered **dumpster rental** and claimed **"licensed &
  insured"** and **"eco-friendly disposal"**. None of that is on the new site
  because it couldn't be verified. Add it back only if true.
- Old URLs (`/services/...`, `/service-area/<suburb>/`, `/gallery/`,
  `/contact/`, etc.) 301-redirect to their new equivalents (`netlify.toml`).
