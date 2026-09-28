// Bookings live in Haul-off Ops (the CRM) when config/booking.json → crm.apiBase
// is set. The browser books there directly; this sends the site's own emails
// afterwards (from bookings@stlouishjr.com, plus the company copy), because
// the CRM has no mail set up.
//
// Nothing the caller says is trusted: the booking is read back from the CRM
// with its manage-link token, and the email says what the CRM says. A kind
// only sends when the booking's state matches it, and the same state never
// sends twice, so replaying a request can't be used to spam a customer.

import { formatPhone } from "./validate.mjs";
import { buildIcs } from "../../shared/ics.js";

export const KINDS = ["confirmed", "rescheduled", "cancelled"];

export function crmManageUrl(origin, id, t) {
  return `${origin}/booking/?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`;
}

export function createCrmNotify({ apiBase, store, notifier, business, origin, fetchImpl = fetch }) {
  const base = String(apiBase || "").replace(/\/+$/, "");

  async function readBooking(id, t) {
    const res = await fetchImpl(`${base}/booking?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`, { headers: { accept: "application/json" } });
    if (res.status === 404) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status !== "ok" || !data.booking) throw Object.assign(new Error("crm_unavailable"), { status: 502, code: "crm_unavailable" });
    return data.booking;
  }

  function summaryFor(b, manageUrl) {
    const when = `${b.dateLabel}, ${b.windowLabel}`;
    const job = [b.loadLabel, b.serviceLabel].filter(Boolean).join(" · ");
    const rows = [
      ["When", `${when} (arrival window)`],
      ["Job", job],
      ["Price", b.priceLabel],
      ["Address", `${b.address}, ${b.city} ${b.zip}`],
      ["Name", b.customer.name],
      ["Phone", formatPhone(String(b.customer.phone || "").replace(/\D/g, "").slice(-10))],
      ["Booking", b.id],
    ];
    return {
      rows,
      headline: `${job.replace(" · ", " ").toLowerCase()}, ${when}`,
      smsLine: `${b.customer.name}, ${job}, ${when}, ${b.address}, ${b.city}.`,
      customerEmail: b.customer.email,
      manageUrl,
      ics: b.windowStart
        ? buildIcs({
            uid: `${b.id}@stlouishjr.com`,
            start: b.windowStart,
            end: b.windowEnd,
            title: `${business.shortName}: ${job.toLowerCase()} (arrival window)`,
            description: `Arrival window ${b.windowLabel}. Booking ${b.id}. Manage: ${manageUrl} · ${business.phoneDisplay}`,
            location: `${b.address}, ${b.city}, MO ${b.zip}`,
            url: manageUrl,
            status: b.status === "cancelled" ? "CANCELLED" : "CONFIRMED",
          })
        : "",
    };
  }

  return {
    async notify({ kind, id, t }) {
      if (!KINDS.includes(kind) || !/^[A-Z0-9-]{4,40}$/.test(String(id || "")) || !t || String(t).length > 200) {
        throw Object.assign(new Error("Bad request"), { status: 400, code: "bad_request" });
      }
      const b = await readBooking(String(id), String(t));
      if (!b) throw Object.assign(new Error("Booking not found"), { status: 404, code: "not_found" });
      const want = kind === "cancelled" ? "cancelled" : "confirmed";
      if (b.status !== want) return { sent: false, reason: "state_mismatch" };

      // One email per state: confirmed once, each new time once, cancelled once.
      const sig = kind === "cancelled" ? "cancelled" : `${b.date}|${b.windowId}`;
      const key = `sent/${b.id}`;
      const prev = (await store.getJSON(key)) || { sigs: [] };
      if (prev.sigs.includes(sig)) return { sent: false, reason: "already_sent" };
      // Reschedule mail only follows a first confirmation; a first read is "confirmed".
      const effective = kind === "rescheduled" && !prev.sigs.length ? "confirmed" : kind;

      const result = await notifier.booking(effective, summaryFor(b, crmManageUrl(origin, b.id, t)));
      if (result.customerEmail.sent || result.companyEmail.sent) {
        await store.setJSON(key, { sigs: [...prev.sigs, sig].slice(-20), at: new Date().toISOString() });
      }
      return { sent: true, kind: effective, customerEmail: result.customerEmail.sent, companyEmail: result.companyEmail.sent };
    },
  };
}
