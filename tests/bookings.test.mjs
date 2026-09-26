import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, createVerify } from "node:crypto";

process.env.BOOKING_SIGNING_SECRET = "test-secret";

const { createBookingService } = await import("../server/lib/bookings.mjs");
const { createMockCalendar, signJwt, createCalendarClient } = await import("../server/lib/google-calendar.mjs");
const { memoryStore } = await import("../server/lib/store.mjs");
const { verify } = await import("../server/lib/tokens.mjs");
const pricing = (await import("../config/pricing.json", { with: { type: "json" } })).default;
const services = (await import("../config/services.json", { with: { type: "json" } })).default;
const business = (await import("../config/business.json", { with: { type: "json" } })).default;
const rulesFile = (await import("../config/booking.json", { with: { type: "json" } })).default;

const now = () => new Date("2026-10-07T14:00:00Z"); // Wed 9:00 CDT
const base = {
  service: "junk", load: "half", address: "4100 Lindell Blvd", city: "St. Louis", zip: "63108", propertyType: "house",
  description: "Old couch and a treadmill", name: "Pat Example", phone: "(314) 555-0100", email: "pat@example.com",
  date: "2026-10-08", windowId: "am1", acceptedTerms: true, photos: [],
};

let calendar, store, sent;
function svc(extra = {}) {
  return createBookingService({
    calendar, store, pricing, rules: rulesFile, business, services, now, origin: "https://example.test",
    notifier: { booking: async (kind, s) => { sent.push({ kind, s }); return { customerEmail: { sent: true }, companyEmail: { sent: true }, companySms: { sent: false } }; } },
    ...extra,
  });
}

beforeEach(() => { calendar = createMockCalendar(); store = memoryStore(); sent = []; });

test("creates a booking, calendar event and signed manage link", async () => {
  const { booking, notifications } = await svc().create(base);
  assert.equal(booking.status, "confirmed");
  assert.equal(booking.windowLabel, "9 – 11 AM");
  assert.equal(booking.customer.phone, "(314) 555-0100");
  assert.match(booking.id, /^STL-/);
  assert.equal(notifications.customerEmail, true);
  const events = await calendar.listEvents(Date.parse("2026-10-08T00:00:00Z"), Date.parse("2026-10-09T12:00:00Z"));
  assert.equal(events.length, 1);
  const ev = events[0];
  assert.equal(ev.start.dateTime, "2026-10-08T14:00:00.000Z");
  assert.equal(ev.end.dateTime, "2026-10-08T15:30:00.000Z"); // 90 min half load
  assert.equal(ev.extendedProperties.private.bookingId, booking.id);
  assert.equal(ev.extendedProperties.private.source, "website");
  assert.match(ev.summary, /1\/2 Load · Junk removal — Pat Example/);
  assert.match(ev.description, /Phone: \(314\) 555-0100/);
  assert.match(ev.location, /4100 Lindell Blvd, St. Louis, MO 63108/);
  const t = new URL(booking.manageUrl).searchParams.get("t");
  assert.ok(verify("manage", booking.id, t));
  assert.equal(sent[0].kind, "confirmed");
  assert.match(booking.ics, /BEGIN:VEVENT/);
});

test("rejects a double booking with alternatives", async () => {
  await svc().create(base);
  await assert.rejects(svc().create({ ...base, email: "other@example.com" }), (e) => {
    assert.equal(e.code, "slot_taken");
    assert.equal(e.status, 409);
    assert.ok(e.alternatives.length > 0);
    assert.notDeepEqual(e.alternatives[0], { date: "2026-10-08", windowId: "am1" });
    return true;
  });
});

test("race: later-created event is rolled back", async () => {
  // Simulate a competitor event that lands between our check and insert.
  const inner = createMockCalendar();
  let injected = false;
  calendar = {
    ...inner,
    listEvents: inner.listEvents,
    async insertEvent(ev) {
      if (!injected) {
        injected = true;
        await inner.insertEvent({ ...ev, summary: "competitor", created: "2026-10-07T13:59:00Z" }).then(async (c) => inner.patchEvent(c.id, { created: "2026-10-07T13:59:00Z" }));
      }
      const mine = await inner.insertEvent(ev);
      return inner.patchEvent(mine.id, { created: "2026-10-07T14:00:00Z" });
    },
    deleteEvent: inner.deleteEvent,
  };
  await assert.rejects(svc().create(base), (e) => e.code === "slot_taken");
  const left = await inner.listEvents(Date.parse("2026-10-08T00:00:00Z"), Date.parse("2026-10-09T00:00:00Z"));
  assert.equal(left.length, 1);
  assert.equal(left[0].summary, "competitor");
});

test("validation errors are field-specific", async () => {
  await assert.rejects(svc().create({ ...base, zip: "123", phone: "555", email: "nope", acceptedTerms: false }), (e) => {
    assert.equal(e.status, 422);
    assert.ok(e.fields.zip && e.fields.phone && e.fields.email && e.fields.acceptedTerms);
    return true;
  });
});

test("within the notice period is refused; later the same day is allowed", async () => {
  // now = 9:00 local, 2h notice → 9–11 window is too soon, 3–5 is open
  await assert.rejects(svc().create({ ...base, date: "2026-10-07", windowId: "am1" }), (e) => e.code === "slot_taken");
  const { booking } = await svc().create({ ...base, date: "2026-10-07", windowId: "pm2" });
  assert.equal(booking.status, "confirmed");
});

test("unverifiable address is rejected before booking", async () => {
  await assert.rejects(svc({ geocode: async () => false }).create(base), (e) => e.code === "address_unverified" && Boolean(e.fields.address));
  assert.equal((await calendar.listEvents(0, Date.parse("2027-01-01"))).length, 0);
});

test("honeypot submissions are rejected", async () => {
  await assert.rejects(svc().create({ ...base, website: "http://spam" }), (e) => e.code === "rejected");
});

test("cancel frees the slot and marks the event", async () => {
  const s = svc();
  const { booking } = await s.create(base);
  const t = new URL(booking.manageUrl).searchParams.get("t");
  const res = await s.cancel(booking.id, t);
  assert.equal(res.booking.status, "cancelled");
  const [ev] = await calendar.listEvents(0, Date.parse("2027-01-01"));
  assert.equal(ev.transparency, "transparent");
  assert.match(ev.summary, /^CANCELLED/);
  assert.equal(ev.extendedProperties.private.bookingStatus, "cancelled");
  // Slot bookable again
  const again = await s.create({ ...base, email: "x@example.com" });
  assert.equal(again.booking.status, "confirmed");
});

test("reschedule moves the event and ignores its own slot", async () => {
  const s = svc();
  const { booking } = await s.create(base);
  const t = new URL(booking.manageUrl).searchParams.get("t");
  const moved = await s.reschedule(booking.id, t, { date: "2026-10-08", windowId: "am2" });
  assert.equal(moved.booking.windowId, "am2");
  const [ev] = await calendar.listEvents(0, Date.parse("2027-01-01"));
  assert.equal(ev.start.dateTime, "2026-10-08T16:00:00.000Z");
  assert.equal(sent.at(-1).kind, "rescheduled");
});

test("bad manage token is a 404", async () => {
  const s = svc();
  const { booking } = await s.create(base);
  await assert.rejects(s.get(booking.id, "wrong"), (e) => e.status === 404);
});

test("service-account JWT is RS256 and verifiable", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwt = signJwt({ clientEmail: "svc@proj.iam.gserviceaccount.com", privateKey: privateKey.export({ type: "pkcs8", format: "pem" }) }, 1_700_000_000);
  const [h, c, sig] = jwt.split(".");
  const v = createVerify("RSA-SHA256");
  v.update(`${h}.${c}`);
  assert.ok(v.verify(publicKey, Buffer.from(sig, "base64url")));
  const claims = JSON.parse(Buffer.from(c, "base64url"));
  assert.equal(claims.scope, "https://www.googleapis.com/auth/calendar.events");
  assert.equal(claims.exp - claims.iat, 3600);
});

test("calendar client exchanges a token then calls the API", async () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("oauth2")) return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }));
    return new Response(JSON.stringify({ items: [{ id: "e1" }] }));
  };
  const client = createCalendarClient({ calendarId: "cal@group.calendar.google.com", credentials: { clientEmail: "a@b", privateKey: privateKey.export({ type: "pkcs8", format: "pem" }) }, fetchImpl });
  const items = await client.listEvents(0, 86_400_000);
  assert.deepEqual(items, [{ id: "e1" }]);
  assert.equal(calls[1].init.headers.authorization, "Bearer tok");
  assert.match(calls[1].url, /calendars\/cal%40group\.calendar\.google\.com\/events\?/);
  await client.listEvents(0, 1);
  assert.equal(calls.filter((c) => c.url.includes("oauth2")).length, 1, "token cached");
});

test("calendar client refuses to start without credentials", () => {
  delete process.env.GOOGLE_CALENDAR_ID;
  assert.throws(() => createCalendarClient(), (e) => e.code === "calendar_unconfigured");
});

test("minimum pickup can be booked at its own price", async () => {
  const { booking } = await svc().create({ ...base, load: "minimum" });
  assert.equal(booking.loadLabel, "Minimum pickup");
  assert.equal(booking.priceLabel, "$125");
  const [ev] = await calendar.listEvents(0, Date.parse("2027-01-01"));
  assert.equal(Date.parse(ev.end.dateTime) - Date.parse(ev.start.dateTime), 30 * 60_000);
  assert.match(ev.description, /a few small items/);
});
