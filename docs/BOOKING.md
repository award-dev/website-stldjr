# Booking system

Online booking is real: it reads the company Google Calendar, only offers
open arrival windows, writes a confirmed event, and lets the customer
reschedule or cancel from a signed link. **Nothing is faked.** Until the
credentials below are set, the booking page says "We can't load appointment
times right now" and offers the phone number and a quote request instead.

## Architecture

```
Browser (Astro static pages + small TS modules)
  │  /book  /quote  /booking?id&t
  ▼
Netlify Functions  (netlify/functions/*.mjs — thin HTTP wrappers)
  │  GET  /api/availability         open windows for a service + load
  │  POST /api/bookings             create booking
  │  GET  /api/booking?id&t         view (signed link)
  │  GET  /api/booking/availability windows for rescheduling
  │  POST /api/booking/cancel | /reschedule
  │  POST /api/uploads              one photo → storage
  │  GET  /api/photos/:id?t=        private photo link
  │  GET  /api/reviews              live Google reviews (optional)
  │  GET  /api/status               which integrations are connected
  ▼
Booking logic      server/lib/bookings.mjs     ← the only place bookings are decided
  ├─ Availability  server/lib/availability.mjs (pure; hours, windows, notice, crews, buffers, DST)
  ├─ Calendar      server/lib/google-calendar.mjs (service account, plain fetch)
  ├─ Database      server/lib/store.mjs        (Netlify Blobs: booking + customer records, photos)
  ├─ Notifications server/lib/notify.mjs       (Resend email, Twilio SMS)
  └─ Validation    server/lib/validate.mjs
```

Quote requests (`/quote`) are posted to **Netlify Forms** (form name
`quote`) — no credentials needed. Turn on email notifications for it in
Netlify → Forms → quote → Form notifications.

The quote flow asks for contact details at step 3. When the visitor continues
past that step, a short **`quote-started`** form (service, load, name, phone,
email) is posted right away, so you can follow up with people who don't finish.
Turn on notifications for `quote-started` too. A finished request also arrives
as `quote`, so one customer can show up in both.

## Setting up Google Calendar (≈15 minutes)

1. Go to <https://console.cloud.google.com/>, create a project (e.g. "STL website").
2. **APIs & Services → Library →** enable **Google Calendar API**.
3. **APIs & Services → Credentials → Create credentials → Service account.**
   Name it `website-booking`. No roles needed.
4. Open the service account → **Keys → Add key → JSON**. A file downloads.
5. In Google Calendar (the account that owns the company calendar):
   Settings → the calendar → **Share with specific people** → add the service
   account's email (`…@….iam.gserviceaccount.com`) with
   **"Make changes to events"**.
6. Same settings page → **Integrate calendar → Calendar ID**. Copy it.
7. In Netlify → Site configuration → Environment variables, set:
   - `GOOGLE_CALENDAR_ID` = the Calendar ID
   - `GOOGLE_CALENDAR_CREDENTIALS` = the entire JSON file contents (or base64 of it)
   - `BOOKING_SIGNING_SECRET` = output of `openssl rand -base64 32`
8. Redeploy. Visit `/api/status` — `"calendar": "live"` means it's connected.

### How the calendar is used

- **Busy time:** every event on that calendar blocks time unless it's marked
  *Free* (transparent). All-day events block the day only if marked *Busy*.
  Block a day off by adding an all-day event set to Busy.
- **Booking events** look like `1/2 Load · Junk removal — Pat Smith`, with the
  address as the location and full details (phone, email, access notes,
  private photo links, manage link) in the description. Structured data is
  in the event's private extended properties (`bookingId`, `bookingStatus`,
  `source=website`, …).
- **Event length** = on-site time for the load (`config/booking.json →
  durationMinutes`), starting at the beginning of the arrival window. A
  `bufferMinutes` gap is kept around jobs for travel.
- **Double booking** is prevented twice: the slot is re-checked against the
  live calendar before writing, and after writing the event the calendar is
  read again — if two customers grabbed the same window at the same moment,
  the later one is rolled back and shown the next open times.
- **Cancel** keeps the event (for your records) but renames it `CANCELLED — …`,
  sets it to Free and greys it out, so the slot reopens.
- **Reschedule** moves the same event.
- If you edit or delete a booking event by hand in Google Calendar, the time
  frees up or blocks accordingly — availability always reads the live calendar.

## Rules you can change (config/booking.json)

| Key | Meaning |
| --- | --- |
| `windows` | Arrival windows offered each day (clipped to business hours) |
| `durationMinutes` | On-site time per load; `demolition` overrides for demo jobs |
| `minNoticeHours` | Earliest bookable time from now |
| `sameDay` | Allow bookings for today |
| `horizonDays` | How far ahead customers can book |
| `crews` | How many jobs can overlap |
| `bufferMinutes` | Gap kept before/after each job |
| `maxPhotos` | Photo limit per booking |
| `cancellationPolicy` | Shown at review and in the terms (text) |
| `enabled` | `false` pauses online booking (the page offers the phone number) |

Business hours are in `config/business.json`.

## Notifications

| Channel | Needs | Sends |
| --- | --- | --- |
| Customer email | `RESEND_API_KEY`, `EMAIL_FROM` | Confirmation (with .ics), reschedule, cancel |
| Company email | same | Every booking, reschedule, cancel |
| Company SMS | `TWILIO_*`, `COMPANY_NOTIFY_SMS` | One-line alert per booking change |

Each channel reports whether it actually sent. The confirmation screen only
says "we emailed you" when it did; otherwise it tells the customer to save
their manage link.

## Data

Stored in Netlify Blobs (store `bookings`):

- `booking/<id>` — full record: status, history, job details, customer,
  photo ids, calendar event id, plus `adminNotes` and `revenue` fields ready
  for an admin view.
- `customer/<email>` — name, phone, list of booking ids.

Photos are in store `photos`, served only through signed links.

## Local development

```bash
npm install
npm run build
MOCK_CALENDAR=1 npm run preview   # simulated calendar, clearly labelled "Demo mode"
npm test                          # availability, bookings, calendar client, time zone tests
```

With real credentials in your environment, `npm run preview` talks to the
real calendar. Local storage goes to `.data/`.

## Moving off Netlify

Functions use the standard `Request → Response` signature. To run elsewhere,
route `/api/*` to the same handlers and replace `server/lib/store.mjs`'s
Blobs adapter with any key-value store or database (the interface is four
methods).
