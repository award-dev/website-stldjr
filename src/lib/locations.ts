// City / area data for the local-seo pages (site-data/locations.json). Facts there are verified against
// official sources and each carries its source URL; pages render them as-is and never add their own.
import data from '../../site-data/locations.json';

export interface Fact { fact: string; source: string }
export interface Location {
  slug: string;
  name: string;
  region: string;
  county: string;
  kind: 'city' | 'unincorporated';
  /** page: its own URL. group: a section of a combined page (see `group`). mention: listed on the hub only. */
  tier: 'page' | 'group' | 'mention';
  group?: string;
  why_a_page: string;
  verified: string;
  official_site?: { label: string; url: string };
  local_facts: { trash: Fact[]; permits: Fact[]; other: Fact[] };
  neighborhoods: string[];
  zips: string[];
  coords?: { lat: number; lng: number };
  jobs: { date: string; service: string; summary: string; photo?: string }[];
  review_ids: string[];
  unique_faqs: { q: string; a: string }[];
  official_links: { label: string; url: string }[];
  nearby: string[];
}

export const locations = (data as unknown as Location[]);
export const cityPages = locations.filter((l) => l.tier === 'page');
export const bySlug = (slug: string) => locations.find((l) => l.slug === slug);
export const groupMembers = (group: string) => locations.filter((l) => l.tier === 'group' && l.group === group);
export const cityHref = (l: Location) => (l.tier === 'group' && l.group ? `/service-areas/${l.group}/#${l.slug}` : `/service-areas/${l.slug}/`);

/** The page URL for a place name from config/service-areas.json, if that place has a page. */
export function placeHref(name: string) {
  const l = locations.find((c) => c.tier !== 'mention' && c.name.toLowerCase() === name.toLowerCase());
  return l ? cityHref(l) : null;
}

/** Nearby cities that have pages, in the order given in the data (nearest first). */
export const nearbyPages = (l: Location) => l.nearby.map(bySlug).filter((n): n is Location => !!n && n.tier === 'page');

/** Combined area pages (one per `group`), e.g. unincorporated South County. */
export const groups = [{ slug: 'south-county', name: 'South St. Louis County' }].filter((g) => groupMembers(g.slug).length > 0);
