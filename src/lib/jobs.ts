// Jobs recorded in site-data/locations.json. Pages render these records; they don't invent jobs.
import { locations, cityHref, type Location } from './locations';

export interface JobRecord {
  date: string;
  service: string;
  subservice?: string;
  summary: string;
  photos: string[];
  pairs: string[];
  city: string;
  citySlug: string;
  tier: Location['tier'];
  /** City page, or the combined area page for group-tier places. Omitted for mention-only cities. */
  href?: string;
}

export function allJobs(): JobRecord[] {
  return locations.flatMap((l) =>
    (l.jobs || []).map((j) => ({
      date: j.date || '',
      service: j.service,
      subservice: j.subservice,
      summary: j.summary,
      photos: j.photos ?? [],
      pairs: j.pairs ?? [],
      city: l.name,
      citySlug: l.slug,
      tier: l.tier,
      href: l.tier === 'mention' ? undefined : cityHref(l),
    })),
  );
}

export function sortJobs(jobs: JobRecord[]) {
  return [...jobs].sort((a, b) => (b.date || '0000').localeCompare(a.date || '0000'));
}

export function jobsForService(service: string) {
  return sortJobs(allJobs().filter((j) => j.service === service));
}

export function jobsForSubservice(subservice: string) {
  return sortJobs(allJobs().filter((j) => j.subservice === subservice));
}

export function jobWhen(date: string) {
  if (!date) return '';
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
