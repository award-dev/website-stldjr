# STL Demolition and Junk Removal — Website

A complete, production-ready marketing website for STL Demolition and Junk
Removal (domain: stlouishjr.com), built as a dependency-light static
HTML/CSS/JS site. 34 pages, fully responsive, SEO-structured, and wired for
lead capture.

## What's in this delivery

There are two zip files:

1. **`stldjr-site-DEPLOY.zip`** — the finished, ready-to-upload website.
   Everything inside `dist/` is the live site. Upload the *contents* of this
   folder to the document root of any static host (see Deployment below).
2. **`stldjr-site-SOURCE.zip`** — the full source project (templates, CSS,
   JS, content data, and the `build.py` generator). Use this if you or a
   developer want to edit copy, add pages, or change the design later.

## IMPORTANT — 3 things to do before this goes live

1. **Connect the quote form to Formspree** (5 minutes, free tier available):
   - Go to https://formspree.io and create a free account with
     stlouishjr@gmail.com.
   - Create a new form; Formspree gives you a form ID (looks like `abc123wx`).
   - In `data/content.py`, set `SITE["formspree_id"]` to that ID, then run
     `python3 build.py` again. (Or, if you only have the DEPLOY zip, do a
     find-and-replace of `YOUR_FORM_ID` with your real ID across every
     `.html` file in `dist/` — it appears once per page, inside the form's
     `action="https://formspree.io/f/YOUR_FORM_ID"` attribute.)
   - Until this is done, the form will show a friendly message asking the
     visitor to call instead — it will not silently fail.
2. **Replace every `[PLACEHOLDER]`** — see the full list below. Search the
   `dist/` folder for the literal text `PLACEHOLDER` to find every instance.
3. **Confirm the assumptions** listed below with the client — several
   business details were not specified in the brief and were filled in with
   clearly-marked placeholders or reasonable defaults.

## Assumptions made (please confirm)

- **Business display name**: The site uses "STL Demolition and Junk Removal"
  everywhere (titles, schema, footer), matching the logo file provided,
  even though the brief text and domain reference "STL Hauling & Junk
  Removal" / stlouishjr.com. This was confirmed with the client during
  build — flagging here again since it touches every page.
- **No public street address.** The business is treated as a service-area
  company (crews travel to the customer), so no address is displayed and
  the schema markup uses `areaServed` instead of a street address. If there
  is a real, public office address, add it in `data/content.py` (`SITE`
  dict) and to the `MovingCompany` schema in
  `templates/partials/schema_localbusiness.html`.
- **Response SLA**: copy says "Get a call back within 1 business hour" per
  the brief's suggested placeholder — confirm the real number and update
  `SITE["sla"]` in `data/content.py`.
- **Pricing**: no real numbers are used anywhere. Every service page uses
  pricing *philosophy* language only (volume-based, transparent, quote
  before work begins). If the client wants to publish real starting prices
  or a price range, that's a copy change in `data/content.py`.
- **Service area list**: 20 St. Louis County-area suburbs were chosen as a
  representative, realistic list (Ballwin, Chesterfield, Clayton, Kirkwood,
  Manchester, Ellisville, Wildwood, Webster Groves, Maplewood, Richmond
  Heights, Brentwood, Sunset Hills, Fenton, Valley Park, Oakville, Affton,
  Crestwood, University City, Florissant, Maryland Heights). Confirm the
  final list — adding a city is one line in the `SUBURBS` list in
  `data/content.py`, then re-run `build.py`; a full page is generated
  automatically for each one.
- **No real reviews were supplied.** Testimonial cards are placeholder
  structure only (marked "Placeholder review" on-page) — no invented names
  or quotes. Replace with real Google/Yelp reviews once available; the
  `AggregateRating`/`Review` schema was intentionally left out until real
  reviews exist (adding fake review schema is a Google-penalizable practice).
- **No real photography was supplied**, except the logo. Every photo slot on
  the site is a styled placeholder graphic clearly labeled "PLACEHOLDER
  PHOTO," with descriptive alt text already written for what the real photo
  should show once it's dropped in (see "Adding real photos" below).
- **Logo**: the provided logo PNG had a small AI-generation watermark sparkle
  in one corner — this was cropped out during processing. The processed
  files are in `static/images/logo-*.png` (a version with the black backing
  intact for light backgrounds, and a transparent-background version for
  dark backgrounds like the footer).
- **Social links, hours founding year**: Facebook/Instagram/Google Business
  Profile URLs and "years in business" are placeholders in the footer/about
  page — add real URLs in `data/content.py`.

## Adding real photos

Every placeholder photo block is a `<div class="ph-photo">` with pre-written
descriptive alt text baked into its `aria-label`. To swap in a real photo:

1. Add the image file to `static/images/` (in the source project) — use a
   compressed JPEG or WebP, ideally under 200KB, at roughly the size it will
   display (e.g. 900px wide for a card photo).
2. In the relevant template (or in `data/content.py` for gallery items),
   replace the `ph_photo(...)` macro call with a real `<img>` tag, for
   example:
   `<img src="/images/hero-crew-loading-truck.jpg" alt="STL Demolition and Junk Removal crew loading a couch into a hauling truck in a St. Louis driveway" loading="lazy" width="900" height="675">`
   — reuse the descriptive alt text that's already in the placeholder; it
   was written to match the SEO/accessibility guidance in the brief.
3. Re-run `python3 build.py`.

## Deployment

The `dist/` folder is a plain static site — it works on literally any static
host. A few common options:

- **Netlify / Vercel**: drag-and-drop the `dist/` folder in their dashboard,
  or connect the source repo and set the build command to
  `python3 build.py` with publish directory `dist`.
- **Traditional cPanel/shared hosting (common for small business sites)**:
  upload the *contents* of `dist/` (not the folder itself) to
  `public_html/` via FTP/File Manager.
- **GitHub Pages**: push `dist/`'s contents to the repo (or a `gh-pages`
  branch).

Because every page is a real `.html` file at a real folder path (e.g.
`/services/dumpster-rental/index.html`), the site works with no server-side
code, no Node process, and no database — just static file hosting.

## Making content edits later

1. Install Python 3 and the one dependency: `pip install jinja2`.
2. Edit `data/content.py` — this is the single source of truth for all
   copy: services, suburbs, FAQs, testimonials, hours, phone number, etc.
   To edit page *layout*, edit the relevant file under `templates/`.
3. Run `python3 build.py`. This regenerates the entire `dist/` folder from
   scratch (34 pages) in under a second.
4. Re-deploy the new `dist/` folder to your host.

Adding a new suburb page, for example, is a single line added to the
`SUBURBS` list in `data/content.py` — the build script generates a complete,
SEO-structured page for it automatically.

## What's built in

- **34 pages**: Home, Services hub + 4 service detail pages, Service Area
  hub + 20 suburb pages, dedicated Quote page, Gallery/Testimonials, About,
  Contact, Thank You (form confirmation), Privacy Policy & Terms
  placeholders, and a custom 404.
- **SEO**: unique `<title>`/meta description per page, one `<h1>` per page,
  semantic HTML5 (`header`/`nav`/`main`/`section`/`footer`), canonical URLs,
  Open Graph + Twitter Card tags, `MovingCompany`/`HomeAndConstructionBusiness`
  LocalBusiness schema, `FAQPage` schema, `BreadcrumbList` schema on every
  interior page, clean descriptive URL slugs, `sitemap.xml`, `robots.txt`.
- **Conversion**: sticky header with click-to-call + "Get Free Quote" on
  every page, a mobile-only sticky bottom call/quote bar, a quote form on
  Home/Services/Quote/Contact/every suburb page, FAQ accordion, and a
  secondary CTA band before the footer on every major page.
- **Accessibility**: skip-to-content link, labelled form fields, sufficient
  color contrast, keyboard-operable nav/accordion/gallery filters, alt text
  on every image slot, `prefers-reduced-motion` respected.
- **Performance/robustness**: no build framework or heavy JS libraries;
  Google Fonts loaded with `preconnect`; the scroll fade-in effect is a
  progressive enhancement — if JavaScript is slow, blocked, or errors out,
  all content is visible immediately (this was tested and fixed during
  build — see `main.css`'s `.js [data-animate]` gating).
- **Verified**: every internal link across all 34 pages resolves (0 broken
  links), every image has descriptive alt text, every page has exactly one
  `<h1>`, all JSON-LD structured data is valid, and the FAQ accordion,
  mobile nav, gallery filters, and form validation were functionally tested
  in a real browser (desktop + mobile viewports).

## Tech stack

Static HTML/CSS/JS output, generated by a small Python + Jinja2 build script
(no Node, no framework, no runtime dependency for hosting). Fonts: Barlow
Condensed (headlines) + Inter (body) via Google Fonts. Colors: deep green
(brand/trust, echoing the logo), charcoal (dark neutral, matches the logo's
background), white/light gray, with one reserved orange accent used only for
calls-to-action.
