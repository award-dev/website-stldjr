import raw from '../../site-data/subservices.json';

export interface SubService {
  parent: string;
  slug: string;
  /** locations.json job.subservice value, or "" when no recorded job uses this tag. */
  jobSubservice: string;
  name: string;
  serviceType: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  cover: string;
  faqIds: string[];
}

export const subservices = raw as SubService[];

export const subPath = (s: Pick<SubService, 'parent' | 'slug'>) => `/services/${s.parent}/${s.slug}/`;

export const subBySlug = (parent: string, slug: string) =>
  subservices.find((s) => s.parent === parent && s.slug === slug);
