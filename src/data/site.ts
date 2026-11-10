/**
 * Business facts. Everything is read from config/business.json and config/service-areas.json so the
 * marketing pages, the booking flow and the server all show the same numbers. Never invent facts here.
 */
import business from '../../config/business.json';

const t = business.trust;
const links = business.links;

export const site = {
  name: business.name,
  /** Appended to page titles (the full name makes titles too long for search results). */
  shortName: business.shortName,
  /** The logo artwork already carries the name, so the header shows the logo only. */
  wordmark: '',
  // Live origin from astro.config.mjs (config/business.json siteUrl, or SITE_URL), no trailing slash.
  url: String(import.meta.env.SITE ?? business.siteUrl).replace(/\/$/, ''),
  owner: business.founder ?? '',
  phone: business.phoneDisplay,
  phoneHref: `tel:${business.phone}`,
  phoneE164: business.phone,
  email: business.email,
  city: business.address.city,
  region: business.address.region,
  serviceArea: [
    { name: 'St. Louis', type: 'City', wiki: 'https://en.wikipedia.org/wiki/St._Louis' },
    { name: 'St. Louis County', type: 'AdministrativeArea', wiki: 'https://en.wikipedia.org/wiki/St._Louis_County,_Missouri' },
    { name: 'St. Charles County', type: 'AdministrativeArea', wiki: 'https://en.wikipedia.org/wiki/St._Charles_County,_Missouri' },
  ] as { name: string; type: 'City' | 'AdministrativeArea'; wiki?: string }[],
  sameAs: [links.googleBusinessProfile, links.instagram, links.nextdoor].filter(Boolean) as string[],
  facebook: links.facebook ?? '',
  /** Confirmed by the owner (config/business.json trust). */
  credentials: t.licensed && t.insured ? 'Licensed & insured' : t.insured ? 'Insured' : '',
  rating: '',
  schemaType: 'HomeAndConstructionBusiness',
  excludedTerms: [] as string[],
};

export const primaryAction = { label: 'Book a pickup', href: '/book/' };
export const secondaryAction = { label: 'Get a free quote', href: '/quote/' };

export const nav = [
  { href: '/services/', label: 'Services' },
  { href: '/pricing/', label: 'Pricing' },
  { href: '/projects/', label: 'Our work' },
  { href: '/service-areas/', label: 'Service areas' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];

/** Photo categories in src/data/projects.ts and the gallery filters. */
export const categoryLabels: Record<string, string> = {
  'junk-removal': 'Junk removal',
  cleanouts: 'Cleanouts',
  'construction-debris': 'Construction debris',
  demolition: 'Demolition',
  crew: 'Truck & crew',
};

/** Before/after pair titles, keyed by the `pair` value in projects.ts. */
export const pairTitles: Record<string, string> = {
  'webster-groves-bathroom': 'Bathroom tear-out in Webster Groves',
  'webster-groves-shower': 'Walk-in shower demo in Webster Groves',
  'maryland-heights-garage': 'Garage cleanout in Maryland Heights',
};

export interface Faq { q: string; a: string }
export { services, type Service } from './services';
