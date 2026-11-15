// Build-time access to config. Pages and components import from here, never
// from config/ directly, so derived values stay consistent.

import business from "../../config/business.json";
import pricingRaw from "../../config/pricing.json";
import booking from "../../config/booking.json";
import services from "../../config/services.json";
import areas from "../../config/service-areas.json";
import faqsFile from "../../config/faqs.json";
import reviews from "../../config/reviews.json";
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

export { business, pricing, booking, services, areas, reviews };

export const showOwnerNotes = business.showOwnerNotes;
export const telHref = `tel:${business.phone}`;
export const mailHref = `mailto:${business.email}`;
export const maxYards = pricing.maxCubicYards;

export const loads = pricing.loads.map((l) => ({ ...l, priceLine: priceLine(pricing, l), yards: formatYards(l.cubicYards) }));
const minRaw = process.env.PRICE_MINIMUM_PICKUP;
const minCfg = (pricingRaw as any).minimum as { id: string; label: string; short: string; price: number; summary: string; fits: string[] } | undefined;
export const minimum = minCfg
  ? (() => {
      const m = { ...minCfg, price: minRaw && Number(minRaw) > 0 ? Math.round(Number(minRaw)) : minCfg.price, minimum: true, fraction: 0.06, cubicYards: null };
      return { ...m, priceLine: priceLine(pricing, m) };
    })()
  : null;
export const anyPrice = loads.some((l) => l.priceLine.amount);

export function fillTokens(s: string) {
  return s.replaceAll("{phone}", business.phoneDisplay).replaceAll("{maxYards}", String(maxYards));
}

export const faqs = faqsFile.items.map((f) => ({ ...f, a: fillTokens(f.a) }));
export const faqById = (id: string) => faqs.find((f) => f.id === id);

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

/** FAQs in the { q, a } shape the Faq component takes; all of them, or the given ids in order. */
export function faqItems(ids?: string[]) {
  const list = ids ? ids.map((id) => faqById(id)).filter((f): f is (typeof faqs)[number] => !!f) : faqs;
  return list.map((f) => ({ q: f.q, a: f.a }));
}

/** FAQPage JSON-LD for Q&A that is visible on the page (text must match what's shown). */
export function faqSchema(items: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}
