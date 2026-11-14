import type { Faq } from './site';
import servicesCfg from '../../config/services.json';
import faqsFile from '../../config/faqs.json';
import pricing from '../../config/pricing.json';
import business from '../../config/business.json';

/**
 * One entry per service page (/services/<slug>/). Copy, scope and FAQs come from config/services.json and
 * config/faqs.json (owner-approved); this file adds the page-level SEO fields and photo picks.
 */
export interface Service {
  slug: string;
  /** Photo category in projects.ts that feeds this page's gallery. */
  category: string;
  title: string;
  label: string;
  noun: string;
  h1: string;
  metaTitle: string; // the short brand name is appended
  /** Search-style H2 for the pricing block. Falls back to headline. */
  priceHeading: string;
  metaDescription: string;
  short: string;
  intro: string;
  headline: string;
  howPriced: string;
  notes: { title: string; text: string }[];
  scope: { title: string; body: string }[];
  /** Cover photo path relative to src/assets/jobs */
  cover: string;
  pair?: string;
  videos: string[];
  faqs: Faq[];
  bookingService: string;
  suggestedLoad: string;
}

const fill = (s: string) => s.replaceAll('{phone}', business.phoneDisplay).replaceAll('{maxYards}', String(pricing.maxCubicYards));
const faq = (id: string): Faq | undefined => {
  const f = faqsFile.items.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown FAQ id ${id}`);
  // Unconfirmed answers stay in the file for the owner and never render or reach schema.
  if (f.confirmed === false) return undefined;
  return { q: f.q, a: fill(f.a) };
};

/** Page fields the config doesn't carry. Keyed by config/services.json group id. */
const extra: Record<string, Pick<Service, 'slug' | 'category' | 'label' | 'noun' | 'h1' | 'metaTitle' | 'priceHeading' | 'short' | 'cover'> & { pair?: string }> = {
  'junk-removal': {
    slug: 'junk-removal', category: 'junk-removal', label: 'Junk removal', noun: 'Junk removal',
    h1: 'Junk removal and hauling in St. Louis, MO', metaTitle: 'Junk Removal & Hauling in St. Louis, MO',
    priceHeading: 'How much does junk removal cost in St. Louis?',
    short: 'Furniture, appliances, hot tubs and household or business junk.', cover: 'junk-removal/couch-carry.webp',
  },
  cleanouts: {
    slug: 'cleanouts', category: 'cleanouts', label: 'Cleanouts', noun: 'Cleanout',
    h1: 'Garage, basement & estate cleanouts in St. Louis', metaTitle: 'Garage & Estate Cleanouts in St. Louis, MO',
    priceHeading: 'How much does a cleanout cost?',
    short: 'Garages, basements, estates and move-outs in one appointment.', cover: 'cleanouts/sweep.webp', pair: 'maryland-heights-garage',
  },
  demolition: {
    slug: 'demolition', category: 'demolition', label: 'Demolition', noun: 'Demolition',
    h1: 'Demolition contractor in St. Louis, MO', metaTitle: 'Demolition Contractor in St. Louis, MO',
    priceHeading: 'How much does demolition cost in St. Louis?',
    short: 'Interiors, kitchens, baths, garages, houses, decks and sheds, torn out and hauled.', cover: 'demolition/kitchen-gut.webp', pair: 'webster-groves-bathroom',
  },
  'construction-debris': {
    slug: 'construction-debris-removal', category: 'construction-debris', label: 'Construction debris', noun: 'Debris removal',
    h1: 'Construction debris removal in St. Louis', metaTitle: 'Construction Debris Removal in St. Louis',
    priceHeading: 'How much does construction debris removal cost?',
    short: 'Drywall, lumber, flooring and remodel waste, off your site.', cover: 'construction-debris/loaded-bed.webp',
  },
};

export const services: Service[] = servicesCfg.groups.map((g) => {
  const x = extra[g.id];
  if (!x) throw new Error(`No page fields for service group ${g.id}`);
  return {
    ...x,
    title: g.name,
    metaDescription: g.metaDescription,
    intro: g.intro,
    headline: g.headline,
    howPriced: g.howPriced,
    notes: g.notes,
    scope: g.items.map((i) => ({ title: i.name, body: i.text })),
    videos: [],
    faqs: g.faqIds.map(faq).filter((f): f is Faq => !!f),
    bookingService: g.bookingService,
    suggestedLoad: g.suggestedLoad,
  };
});
