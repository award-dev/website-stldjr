// Booking logic: the only place that decides whether a booking happens.
// Everything it touches (calendar, store, notifier, geocoder, clock) is
// injected, so tests run it end-to-end against fakes.

import { busyFromEvents, computeAvailability, durationFor, nextAvailable, resolveWindow, slotIsFree } from "./availability.mjs";
import { validateBooking, formatPhone } from "./validate.mjs";
import { newId, sign, verify } from "./tokens.mjs";
import { getLoad, priceLine, formatYards } from "../../shared/pricing.js";
import { formatLongDate } from "../../shared/time.js";
import { buildIcs } from "../../shared/ics.js";

export class BookingError extends Error {
  constructor(code, status, message, extra = {}) {
    super(message);
    this.code = code;
    this.status = status;
    Object.assign(this, extra);
  }
}

const DAY = 86_400_000;

export function createBookingService(deps) {
  const { calendar, store, notifier, geocode, pricing, rules, business, services, now = () => new Date(), origin } = deps;
  const tz = business.timezone;
  const serviceIds = services.bookingServices.map((s) => s.id);
  const loadIds = pricing.loads.map((l) => l.id);
  const serviceLabel = (id) => services.bookingServices.find((s) => s.id === id)?.label || id;

  async function busyAround(startMs, endMs) {
    const events = await calendar.listEvents(startMs, endMs);
    return { events, busy: busyFromEvents(events, tz) };
  }

  async function availability({ service, load, ignoreId }) {
    const t = now().getTime();
    const events = await calendar.listEvents(t, t + (rules.horizonDays + 1) * DAY);
    return computeAvailability({ now: t, rules, hours: business.hours, tz, busy: busyFromEvents(events, tz), service, load, ignoreId });
  }

  async function alternatives(input, ignoreId) {
    const days = await availability({ service: input.service, load: input.load, ignoreId });
    const out = [];
    for (const d of days) for (const s of d.slots) if (s.available && out.length < 3) out.push({ date: d.date, windowId: s.id, label: s.label, dateLabel: formatLongDate(d.date) });
    return out;
  }

  /** Validates the requested window against rules + the live calendar. */
  async function checkSlot(input, { ignoreId } = {}) {
    const w = resolveWindow({ rules, hours: business.hours, tz, date: input.date, windowId: input.windowId });
    if (!w) throw new BookingError("slot_invalid", 422, "That arrival window isn't offered on that day.", { fields: { slot: "Choose one of the available arrival windows." } });
    const duration = durationFor(rules, input);
    const start = w.start.getTime();
    const t = now().getTime();
    const todayLocal = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(t);
    const tooSoon = start < t + (rules.minNoticeHours || 0) * 3_600_000 || (!rules.sameDay && input.date === todayLocal);
    const tooLate = start > t + rules.horizonDays * DAY;
    if (tooSoon || tooLate || (rules.jobsMustFinishByClose && start + duration * 60_000 > w.closeAt.getTime())) {
      throw new BookingError("slot_taken", 409, "That time is no longer available.", { alternatives: await alternatives(input, ignoreId) });
    }
    const { busy } = await busyAround(start - DAY, start + DAY);
    if (!slotIsFree(rules, busy, start, duration, ignoreId)) {
      throw new BookingError("slot_taken", 409, "That time was just booked.", { alternatives: await alternatives(input, ignoreId) });
    }
    return { w, duration, start, end: start + duration * 60_000 };
  }

  function photoUrl(id) {
    return `${origin}/api/photos/${id}?t=${sign("photo", id)}`;
  }

  function manageUrl(id) {
    return `${origin}/booking/?id=${encodeURIComponent(id)}&t=${sign("manage", id)}`;
  }

  function describe(rec) {
    const lines = [
      `Booking ${rec.id} — ${rec.status.toUpperCase()}`,
      `Source: website`,
      "",
      `Customer: ${rec.customer.name}`,
      `Phone: ${formatPhone(rec.customer.phone)}`,
      `Email: ${rec.customer.email}`,
      "",
      `Service: ${rec.serviceLabel}`,
      `Load: ${rec.loadLabel} (~${formatYards(rec.cubicYards)} yd³)`,
      `Price: ${rec.priceLabel}`,
      `Arrival window: ${formatLongDate(rec.date)}, ${rec.windowLabel}`,
      "",
      `Address: ${rec.address}, ${rec.city} ${rec.zip}`,
      `Property: ${rec.propertyType}`,
      `Stairs: ${rec.stairs} · Carry distance: ${rec.carry}`,
      "",
      `What's going: ${rec.description}`,
      rec.items ? `Items: ${rec.items}` : null,
      rec.demolitionDetails ? `Demolition: ${rec.demolitionDetails}` : null,
      rec.access ? `Access: ${rec.access}` : null,
      rec.special ? `Special circumstances: ${rec.special}` : null,
      rec.photos.length ? `\nPhotos (${rec.photos.length}):\n${rec.photos.map(photoUrl).join("\n")}` : "Photos: none",
      "",
      `Manage: ${manageUrl(rec.id)}`,
    ];
    return lines.filter((l) => l !== null).join("\n");
  }

  function eventBody(rec) {
    const cancelled = rec.status === "cancelled";
    return {
      summary: `${cancelled ? "CANCELLED — " : ""}${rec.loadLabel} · ${rec.serviceLabel} — ${rec.customer.name}`,
      description: describe(rec),
      location: `${rec.address}, ${rec.city}, MO ${rec.zip}`,
      start: { dateTime: new Date(rec.eventStart).toISOString(), timeZone: tz },
      end: { dateTime: new Date(rec.eventEnd).toISOString(), timeZone: tz },
      transparency: cancelled ? "transparent" : "opaque",
      colorId: cancelled ? "8" : String(rules.eventColorId || "10"),
      extendedProperties: {
        private: {
          bookingId: rec.id,
          bookingStatus: rec.status,
          source: "website",
          service: rec.service,
          load: rec.load,
          customerName: rec.customer.name,
          customerPhone: rec.customer.phone,
          customerEmail: rec.customer.email,
          photoCount: String(rec.photos.length),
        },
      },
    };
  }

  function summaryFor(rec) {
    const when = `${formatLongDate(rec.date)}, ${rec.windowLabel}`;
    const rows = [
      ["When", `${when} (arrival window)`],
      ["Job", `${rec.loadLabel} · ${rec.serviceLabel}`],
      ["Price", rec.priceLabel],
      ["Address", `${rec.address}, ${rec.city} ${rec.zip}`],
      ["Name", rec.customer.name],
      ["Phone", formatPhone(rec.customer.phone)],
      ["Booking", rec.id],
    ];
    return {
      rows,
      headline: `${rec.loadLabel} ${rec.serviceLabel.toLowerCase()}, ${when}`,
      smsLine: `${rec.customer.name}, ${rec.loadLabel} ${rec.serviceLabel}, ${when}, ${rec.address}, ${rec.city}. ${formatPhone(rec.customer.phone)}`,
      customerEmail: rec.customer.email,
      manageUrl: manageUrl(rec.id),
      ics: icsFor(rec),
    };
  }

  function icsFor(rec) {
    return buildIcs({
      uid: `${rec.id}@stlouishjr.com`,
      start: rec.windowStart,
      end: rec.windowEnd,
      title: `${business.shortName}: ${rec.loadLabel} ${rec.serviceLabel.toLowerCase()} (arrival window)`,
      description: `Arrival window ${rec.windowLabel}. Booking ${rec.id}. Manage: ${manageUrl(rec.id)} · ${business.phoneDisplay}`,
      location: `${rec.address}, ${rec.city}, MO ${rec.zip}`,
      url: manageUrl(rec.id),
      status: rec.status === "cancelled" ? "CANCELLED" : "CONFIRMED",
    });
  }

  function publicView(rec) {
    return {
      id: rec.id,
      status: rec.status,
      service: rec.service,
      serviceLabel: rec.serviceLabel,
      load: rec.load,
      loadLabel: rec.loadLabel,
      cubicYards: rec.cubicYards,
      priceLabel: rec.priceLabel,
      priceNote: rec.priceNote,
      date: rec.date,
      dateLabel: formatLongDate(rec.date),
      windowId: rec.windowId,
      windowLabel: rec.windowLabel,
      windowStart: rec.windowStart,
      windowEnd: rec.windowEnd,
      address: rec.address,
      city: rec.city,
      zip: rec.zip,
      customer: { name: rec.customer.name, phone: formatPhone(rec.customer.phone), email: rec.customer.email },
      photoCount: rec.photos.length,
      manageUrl: manageUrl(rec.id),
      ics: icsFor(rec),
    };
  }

  async function load(id, token) {
    if (!verify("manage", id, token)) throw new BookingError("not_found", 404, "We couldn't find that booking. Check the link, or call us.");
    const rec = await store.getJSON(`booking/${id}`);
    if (!rec) throw new BookingError("not_found", 404, "We couldn't find that booking. Check the link, or call us.");
    return rec;
  }

  return {
    availability,

    async create(payload) {
      if (payload?.website) throw new BookingError("rejected", 400, "Something went wrong."); // honeypot
      const { ok, errors, value } = validateBooking(payload, { serviceIds, loadIds, maxPhotos: rules.maxPhotos });
      if (!ok) throw new BookingError("invalid", 422, "Some details need fixing.", { fields: errors });

      if (geocode) {
        const verdict = await geocode(`${value.address}, ${value.city}, MO ${value.zip}`);
        if (verdict === false) throw new BookingError("address_unverified", 422, "We couldn't verify that address.", { fields: { address: "We couldn't verify that address. Check the spelling and try again." } });
      }

      const slot = await checkSlot(value);
      const loadCfg = getLoad(pricing, value.load);
      const price = priceLine(pricing, loadCfg);
      const at = now().toISOString();
      const rec = {
        id: newId("STL-"),
        status: "pending",
        source: "website",
        createdAt: at,
        updatedAt: at,
        service: value.service,
        serviceLabel: serviceLabel(value.service),
        load: value.load,
        loadLabel: loadCfg.label,
        cubicYards: loadCfg.cubicYards,
        price: loadCfg.price,
        priceLabel: price.label,
        priceNote: price.note,
        date: value.date,
        windowId: value.windowId,
        windowLabel: slot.w.label,
        windowStart: slot.w.start.toISOString(),
        windowEnd: slot.w.end.toISOString(),
        eventStart: new Date(slot.start).toISOString(),
        eventEnd: new Date(slot.end).toISOString(),
        address: value.address,
        city: value.city,
        zip: value.zip,
        propertyType: value.propertyType,
        description: value.description,
        items: value.items,
        demolitionDetails: value.demolitionDetails,
        access: value.access,
        stairs: value.stairs,
        carry: value.carry,
        special: value.special,
        customer: { name: value.name, phone: value.phone, email: value.email },
        photos: value.photos,
        calendarEventId: null,
        adminNotes: "",
        revenue: null,
        history: [{ at, action: "requested" }],
      };

      // Record first, so a calendar event never exists without its booking.
      await store.setJSON(`booking/${rec.id}`, rec);
      rec.status = "confirmed";
      const ev = await calendar.insertEvent(eventBody(rec));
      rec.calendarEventId = ev.id;

      // Race check: if two people grabbed the same window at once, the
      // earlier-created event keeps it and the later one is rolled back.
      const { events } = await busyAround(slot.start - DAY, slot.start + DAY);
      const buf = (rules.bufferMinutes || 0) * 60_000;
      const mine = Date.parse(ev.created || at);
      const earlierClashes = events.filter((e) => {
        if (e.id === ev.id || e.status === "cancelled" || e.transparency === "transparent") return false;
        const s = Date.parse(e.start?.dateTime || e.start?.date);
        const f = Date.parse(e.end?.dateTime || e.end?.date);
        const clash = s < slot.end + buf && slot.start - buf < f;
        const created = Date.parse(e.created || 0);
        return clash && (created < mine || (created === mine && e.id < ev.id));
      }).length;
      if (earlierClashes >= (rules.crews || 1)) {
        await calendar.deleteEvent(ev.id).catch(() => {});
        rec.status = "failed";
        rec.history.push({ at: now().toISOString(), action: "rolled_back_slot_taken" });
        await store.setJSON(`booking/${rec.id}`, rec);
        throw new BookingError("slot_taken", 409, "That time was just booked.", { alternatives: await alternatives(value) });
      }

      rec.history.push({ at: now().toISOString(), action: "confirmed" });
      await store.setJSON(`booking/${rec.id}`, rec);
      await store.setJSON(`customer/${rec.customer.email}`, {
        email: rec.customer.email,
        name: rec.customer.name,
        phone: rec.customer.phone,
        bookings: [...((await store.getJSON(`customer/${rec.customer.email}`))?.bookings || []), rec.id],
      });

      const notifications = notifier ? await notifier.booking("confirmed", summaryFor(rec)) : null;
      return { booking: publicView(rec), notifications: notificationSummary(notifications) };
    },

    async get(id, token) {
      return { booking: publicView(await load(id, token)) };
    },

    async cancel(id, token) {
      const rec = await load(id, token);
      if (rec.status === "cancelled") return { booking: publicView(rec), notifications: null };
      if (rec.status !== "confirmed") throw new BookingError("not_active", 409, "This booking can't be changed online. Call us.");
      rec.status = "cancelled";
      rec.updatedAt = now().toISOString();
      rec.history.push({ at: rec.updatedAt, action: "cancelled_by_customer" });
      if (rec.calendarEventId) await calendar.patchEvent(rec.calendarEventId, eventBody(rec));
      await store.setJSON(`booking/${rec.id}`, rec);
      const notifications = notifier ? await notifier.booking("cancelled", summaryFor(rec)) : null;
      return { booking: publicView(rec), notifications: notificationSummary(notifications) };
    },

    async reschedule(id, token, { date, windowId }) {
      const rec = await load(id, token);
      if (rec.status !== "confirmed") throw new BookingError("not_active", 409, "This booking can't be changed online. Call us.");
      const slot = await checkSlot({ service: rec.service, load: rec.load, date, windowId }, { ignoreId: rec.calendarEventId });
      rec.date = date;
      rec.windowId = windowId;
      rec.windowLabel = slot.w.label;
      rec.windowStart = slot.w.start.toISOString();
      rec.windowEnd = slot.w.end.toISOString();
      rec.eventStart = new Date(slot.start).toISOString();
      rec.eventEnd = new Date(slot.end).toISOString();
      rec.updatedAt = now().toISOString();
      rec.history.push({ at: rec.updatedAt, action: "rescheduled_by_customer" });
      await calendar.patchEvent(rec.calendarEventId, eventBody(rec));
      await store.setJSON(`booking/${rec.id}`, rec);
      const notifications = notifier ? await notifier.booking("rescheduled", summaryFor(rec)) : null;
      return { booking: publicView(rec), notifications: notificationSummary(notifications) };
    },

    availabilityFor: async (id, token) => {
      const rec = await load(id, token);
      return { booking: rec, days: await availability({ service: rec.service, load: rec.load, ignoreId: rec.calendarEventId }) };
    },

    nextAvailable: async (q) => nextAvailable(await availability(q)),
  };
}

function notificationSummary(n) {
  if (!n) return { customerEmail: false, company: false };
  return { customerEmail: n.customerEmail.sent, company: n.companyEmail.sent || n.companySms.sent };
}
