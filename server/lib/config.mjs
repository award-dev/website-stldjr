// Server-side configuration: the same JSON the site is built from, plus
// environment overrides. Secrets only ever come from the environment.

import business from "../../config/business.json" with { type: "json" };
import pricingFile from "../../config/pricing.json" with { type: "json" };
import bookingFile from "../../config/booking.json" with { type: "json" };
import services from "../../config/services.json" with { type: "json" };
import areas from "../../config/service-areas.json" with { type: "json" };

const env = (k) => {
  const v = process.env[k];
  return v === undefined || v === "" ? undefined : v;
};

const PRICE_ENV = {
  quarter: "PRICE_QUARTER_LOAD",
  half: "PRICE_HALF_LOAD",
  "three-quarter": "PRICE_THREE_QUARTER_LOAD",
  full: "PRICE_FULL_LOAD",
};

export function getPricing() {
  const loads = pricingFile.loads.map((l) => {
    const raw = env(PRICE_ENV[l.id]);
    const n = raw === undefined ? l.price : Number(raw);
    return { ...l, price: Number.isFinite(n) && n > 0 ? Math.round(n) : null };
  });
  const minRaw = env("PRICE_MINIMUM_PICKUP");
  const minimum = pricingFile.minimum && { ...pricingFile.minimum, price: minRaw && Number(minRaw) > 0 ? Math.round(Number(minRaw)) : pricingFile.minimum.price };
  return { ...pricingFile, loads, minimum };
}

export function getBookingRules() {
  const rules = structuredClone(bookingFile);
  const dur = env("BOOKING_DURATION");
  if (dur) {
    // BOOKING_DURATION overrides every load duration with one value (minutes).
    const n = Number(dur);
    if (Number.isFinite(n) && n > 0) for (const k of Object.keys(rules.durationMinutes)) if (!k.startsWith("$")) rules.durationMinutes[k] = n;
  }
  if (env("BOOKING_CREWS")) rules.crews = Math.max(1, Number(env("BOOKING_CREWS")) || 1);
  return rules;
}

export function getBusiness() {
  const b = structuredClone(business);
  if (env("BUSINESS_NAME")) b.name = env("BUSINESS_NAME");
  if (env("PHONE")) b.phone = env("PHONE");
  if (env("EMAIL")) b.email = env("EMAIL");
  if (env("BUSINESS_HOURS")) {
    try {
      Object.assign(b.hours, JSON.parse(env("BUSINESS_HOURS")));
    } catch {
      console.warn("BUSINESS_HOURS is not valid JSON; using config/business.json");
    }
  }
  return b;
}

export const MAX_LOAD_CUBIC_YARDS = Number(env("MAX_LOAD_CUBIC_YARDS")) || pricingFile.maxCubicYards || 17;

export { services, areas };

/** Public origin for links in emails/calendar events. Prefers the request's own origin. */
export function siteUrl(req) {
  if (env("SITE_URL")) return env("SITE_URL").replace(/\/$/, "");
  if (req) return new URL(req.url).origin;
  return business.siteUrl.replace(/\/$/, "");
}

/** Which integrations have credentials. Never returns the secrets themselves. */
export function integrationStatus() {
  return {
    calendar: Boolean(env("GOOGLE_CALENDAR_ID") && (env("GOOGLE_CALENDAR_CREDENTIALS") || (env("GOOGLE_SERVICE_ACCOUNT_EMAIL") && env("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")))),
    calendarMock: env("MOCK_CALENDAR") === "1" && env("CONTEXT") !== "production",
    signing: Boolean(env("BOOKING_SIGNING_SECRET")),
    email: Boolean(env("RESEND_API_KEY") && env("EMAIL_FROM")),
    sms: Boolean(env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_FROM")),
    addressVerification: Boolean(env("GOOGLE_MAPS_API_KEY")),
    reviews: Boolean(env("GOOGLE_PLACES_API_KEY") && env("GOOGLE_PLACE_ID")),
  };
}

export { env };
