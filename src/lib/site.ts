// Build-time access to config. Pages and components import from here, never
// from config/ directly, so derived values stay consistent.

import business from "../../config/business.json";
import pricingRaw from "../../config/pricing.json";
import booking from "../../config/booking.json";
import services from "../../config/services.json";
import areas from "../../config/service-areas.json";
import faqsFile from "../../config/faqs.json";
import reviews from "../../config/reviews.json";
import media from "../../config/media.json";
import { priceLine, formatYards } from "../../shared/pricing.js";

// Build-time env overrides mirror server/lib/config.mjs so the site and the
// booking server always show the same price.
const PRICE_ENV: Record<string, string> = {
  quarter: "PRICE_QUARTER_LOAD",
  half: "PRICE_HALF_LOAD",
  "three-quarter": "PRICE_THREE_QUARTER_LOAD",
  full: "PRICE_FULL_LOAD",
};
const pricing = {
  ...pricingRaw,
  loads: pricingRaw.loads.map((l) => {
    const raw = process.env[PRICE_ENV[l.id]];
    const n = raw ? Number(raw) : (l.price as number | null);
    return { ...l, price: typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n) : null };
  }),
};

export type Load = (typeof pricing.loads)[number];

export { business, pricing, booking, services, areas, reviews, media };

export const showOwnerNotes = business.showOwnerNotes;
export const telHref = `tel:${business.phone}`;
export const mailHref = `mailto:${business.email}`;
export const maxYards = pricing.maxCubicYards;

export const loads = pricing.loads.map((l) => ({ ...l, priceLine: priceLine(pricing, l), yards: formatYards(l.cubicYards) }));
export const anyPrice = loads.some((l) => l.priceLine.amount);

export function fillTokens(s: string) {
  return s.replaceAll("{phone}", business.phoneDisplay).replaceAll("{maxYards}", String(maxYards));
}

export const faqs = faqsFile.items.map((f) => ({ ...f, a: fillTokens(f.a) }));
export const faqById = (id: string) => faqs.find((f) => f.id === id);

export const nav = [
  { href: "/junk-removal/", label: "Services", children: services.groups.map((g) => ({ href: g.path + "/", label: g.navLabel })) },
  { href: "/pricing/", label: "Pricing" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/service-area/", label: "Service area" },
  { href: "/about/", label: "About" },
  { href: "/faq/", label: "FAQ" },
];

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_NAMES: Record<string, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
const SCHEMA_DAYS: Record<string, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

function clock(t: string) {
  let [h, m] = t.split(":").map(Number);
  const s = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, "0")}${s}` : `${h}${s}`;
}

/** Collapses consecutive days with identical hours: "Mon–Fri 8am–6pm". */
export function hoursSummary() {
  const h = business.hours as unknown as Record<string, [string, string] | null>;
  const rows: { days: string; hours: string }[] = [];
  let i = 0;
  while (i < DAYS.length) {
    const cur = JSON.stringify(h[DAYS[i]]);
    let j = i;
    while (j + 1 < DAYS.length && JSON.stringify(h[DAYS[j + 1]]) === cur) j++;
    const v = h[DAYS[i]] as [string, string] | null;
    const label = i === j ? DAY_NAMES[DAYS[i]].slice(0, 3) : `${DAY_NAMES[DAYS[i]].slice(0, 3)}–${DAY_NAMES[DAYS[j]].slice(0, 3)}`;
    rows.push({ days: label, hours: v ? `${clock(v[0])}–${clock(v[1])}` : "Closed" });
    i = j + 1;
  }
  return rows;
}

export function openingHoursSchema() {
  const h = business.hours as unknown as Record<string, [string, string] | null>;
  return DAYS.filter((d) => Array.isArray(h[d])).map((d) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: SCHEMA_DAYS[d],
    opens: h[d]![0],
    closes: h[d]![1],
  }));
}

export const allPlaces = areas.regions.flatMap((r) => r.places);

export function abs(path: string) {
  return new URL(path, business.siteUrl).toString();
}
