/**
 * Service sub-pages (/services/<parent>/<slug>/): one page per item, cleanout type or demolition job, under
 * the junk removal, cleanouts and demolition service pages. Copy lives in site-data/subservices.json; prices and
 * business facts are filled in from config at build time (see SubServiceBody.astro). No photos yet: each page
 * carries a TODO comment for the job photo it still needs.
 */
import raw from '../../site-data/subservices.json';

export interface SubService {
  parent: string;
  slug: string;
  /** Name of the matching item in config/services.json, so the parent page can link to this page. */
  scopeItem: string;
  /** Other scope item names that should link here (e.g. junk removal's "Shed removal"). */
  aliases?: string[];
  name: string;
  /** One line for the list on the parent service page. */
  short: string;
  serviceType: string;
  /** Booking load to suggest ("quarter", "half", ...); defaults to the parent service's. */
  load?: string;
  /** Job services in site-data/locations.json to match jobMatch against; defaults to [parent]. */
  jobServices?: string[];
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  /** Regex (case-insensitive) over job summaries in site-data/locations.json; "" = no recorded job yet. */
  jobMatch: string;
  faqIds: string[];
  related: string[];
  sections: { id: string; h2: string; body: string[] }[];
  /** Linked from the homepage (priority services the owner tracks in Keyword rankings); see scripts/link-map.mjs rule 1. */
  featured?: boolean;
}

export const subservices = raw as SubService[];
export const subPath = (s: Pick<SubService, 'parent' | 'slug'>) => `/services/${s.parent}/${s.slug}/`;
/** Sub-page for a scope item name ("Kitchen demolition", "Hot tub removal", ...), if one exists. */
export const subForItem = (name: string) => {
  const n = name.toLowerCase();
  return subservices.find((s) => s.scopeItem.toLowerCase() === n || (s.aliases ?? []).some((a) => a.toLowerCase() === n));
};
/** Sub-pages linked from the homepage, in file order. */
export const featuredSubs = () => subservices.filter((s) => s.featured);
/** Every sub-page under a service page, in file order. */
export const subsOf = (parent: string) => subservices.filter((s) => s.parent === parent);
