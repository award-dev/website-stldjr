// Wires the booking service to real integrations for a request.

import { getBookingRules, getBusiness, getPricing, integrationStatus, services, siteUrl, env } from "./config.mjs";
import { createCalendarClient, createMockCalendar } from "./google-calendar.mjs";
import { openStore } from "./store.mjs";
import { createNotifier } from "./notify.mjs";
import { createGeocoder } from "./geocode.mjs";
import { createBookingService } from "./bookings.mjs";

let mock;

export function calendarMode() {
  const s = integrationStatus();
  if (s.calendar) return "live";
  if (s.calendarMock) return "demo";
  return "unconfigured";
}

export function getCalendar() {
  const mode = calendarMode();
  if (mode === "demo") return (mock ??= createMockCalendar());
  return createCalendarClient(); // throws calendar_unconfigured when missing
}

export async function bookingService(req) {
  const business = getBusiness();
  return createBookingService({
    calendar: getCalendar(),
    store: await openStore("bookings"),
    notifier: calendarMode() === "demo" ? null : createNotifier({ business }),
    geocode: createGeocoder(),
    pricing: getPricing(),
    rules: getBookingRules(),
    business,
    services,
    origin: siteUrl(req),
    now: env("BOOKING_NOW") && env("CONTEXT") !== "production" ? () => new Date(env("BOOKING_NOW")) : undefined,
  });
}
