import { test } from "node:test";
import assert from "node:assert/strict";

const { createCrmNotify, crmManageUrl } = await import("../server/lib/crm.mjs");
const { memoryStore } = await import("../server/lib/store.mjs");
const business = (await import("../config/business.json", { with: { type: "json" } })).default;

const BASE = "https://crm.example/api/book/acme";

function crmBooking(over = {}) {
  return {
    id: "BK-ABC123", status: "confirmed", service: "junk", serviceLabel: "Junk removal", load: "half", loadLabel: "1/2 Load",
    date: "2026-10-06", dateLabel: "Tuesday, October 6", windowId: "am1", windowLabel: "9–11am",
    windowStart: "2026-10-06T14:00:00.000Z", windowEnd: "2026-10-06T16:00:00.000Z",
    address: "1115 Sharon Dr", city: "Florissant", zip: "63031", priceLabel: "From $340",
    customer: { name: "Pat Doe", phone: "3145550100", email: "pat@example.com" },
    ...over,
  };
}

function setup(booking = crmBooking()) {
  const calls = [];
  const sent = [];
  let current = booking;
  const fetchImpl = async (url) => {
    calls.push(String(url));
    const u = new URL(url);
    if (u.searchParams.get("t") !== "good-token" || !current) return new Response(JSON.stringify({ status: "error", code: "not_found" }), { status: 404 });
    return new Response(JSON.stringify({ status: "ok", booking: current }), { status: 200 });
  };
  const notifier = {
    async booking(kind, summary) {
      sent.push({ kind, summary });
      return { customerEmail: { sent: true }, companyEmail: { sent: true }, companySms: { sent: false } };
    },
  };
  const store = memoryStore();
  const svc = createCrmNotify({ apiBase: BASE, store, notifier, business, origin: "https://stlouishjr.com", fetchImpl });
  return { svc, calls, sent, setBooking: (b) => (current = b) };
}

test("confirmed: reads the booking back from the CRM and emails what the CRM says", async () => {
  const { svc, calls, sent } = setup();
  const r = await svc.notify({ kind: "confirmed", id: "BK-ABC123", t: "good-token" });
  assert.equal(r.sent, true);
  assert.equal(calls[0], `${BASE}/booking?id=BK-ABC123&t=good-token`);
  assert.equal(sent.length, 1);
  const s = sent[0].summary;
  assert.equal(s.customerEmail, "pat@example.com");
  assert.equal(s.manageUrl, crmManageUrl("https://stlouishjr.com", "BK-ABC123", "good-token"));
  assert.match(s.ics, /BEGIN:VEVENT/);
  assert.ok(s.rows.some(([k, v]) => k === "Address" && v.includes("1115 Sharon Dr")));
});

test("the same confirmation never sends twice", async () => {
  const { svc, sent } = setup();
  await svc.notify({ kind: "confirmed", id: "BK-ABC123", t: "good-token" });
  const again = await svc.notify({ kind: "confirmed", id: "BK-ABC123", t: "good-token" });
  assert.deepEqual(again, { sent: false, reason: "already_sent" });
  assert.equal(sent.length, 1);
});

test("a wrong token is not found and sends nothing", async () => {
  const { svc, sent } = setup();
  await assert.rejects(svc.notify({ kind: "confirmed", id: "BK-ABC123", t: "guess" }), (e) => e.status === 404);
  assert.equal(sent.length, 0);
});

test("kind must match the CRM's state", async () => {
  const { svc, sent } = setup();
  const r = await svc.notify({ kind: "cancelled", id: "BK-ABC123", t: "good-token" });
  assert.deepEqual(r, { sent: false, reason: "state_mismatch" });
  assert.equal(sent.length, 0);
});

test("reschedule sends once per new time, cancel once", async () => {
  const { svc, sent, setBooking } = setup();
  await svc.notify({ kind: "confirmed", id: "BK-ABC123", t: "good-token" });
  setBooking(crmBooking({ date: "2026-10-07", windowId: "pm1", dateLabel: "Wednesday, October 7", windowLabel: "1–3pm" }));
  assert.equal((await svc.notify({ kind: "rescheduled", id: "BK-ABC123", t: "good-token" })).kind, "rescheduled");
  assert.equal((await svc.notify({ kind: "rescheduled", id: "BK-ABC123", t: "good-token" })).reason, "already_sent");
  setBooking(crmBooking({ status: "cancelled" }));
  assert.equal((await svc.notify({ kind: "cancelled", id: "BK-ABC123", t: "good-token" })).kind, "cancelled");
  assert.equal((await svc.notify({ kind: "cancelled", id: "BK-ABC123", t: "good-token" })).reason, "already_sent");
  assert.deepEqual(sent.map((x) => x.kind), ["confirmed", "rescheduled", "cancelled"]);
});

test("a first message about a moved booking is a confirmation", async () => {
  const { svc, sent } = setup();
  const r = await svc.notify({ kind: "rescheduled", id: "BK-ABC123", t: "good-token" });
  assert.equal(r.kind, "confirmed");
  assert.equal(sent[0].kind, "confirmed");
});

test("rejects unknown kinds and malformed ids before calling the CRM", async () => {
  const { svc, calls } = setup();
  await assert.rejects(svc.notify({ kind: "spam", id: "BK-ABC123", t: "good-token" }), (e) => e.status === 400);
  await assert.rejects(svc.notify({ kind: "confirmed", id: "../x", t: "good-token" }), (e) => e.status === 400);
  assert.equal(calls.length, 0);
});
