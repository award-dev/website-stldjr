import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { business, services, areas, faqs, hoursSummary, loads, minimum, pricing } from '../lib/site';

/**
 * /llms.txt: a plain-text summary of the business for AI search tools
 * (llmstxt.org). Built from the same config files as the site, so it never
 * drifts from what the pages say.
 */
export const GET: APIRoute = async ({ site }) => {
  const origin = (site?.href ?? business.siteUrl).replace(/\/$/, '');
  const a = business.address;
  const street = a.public && a.street ? `${a.street}, ` : '';
  const zip = a.public && a.postalCode ? ` ${a.postalCode}` : '';
  const t = business.trust;
  const groups = (services as { groups: { name: string; path: string; intro: string; howPriced?: string }[] }).groups;
  const regions = (areas as { regions: { name: string; places: string[] }[] }).regions;
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort((x, y) => y.data.date.valueOf() - x.data.date.valueOf());
  const facts = [
    t.licensed && t.insured ? `Licensed and insured${t.insuranceDetails ? ` (${t.insuranceDetails})` : ''}` : null,
    t.completedJobs && t.foundedYear ? `${t.completedJobs} jobs since ${t.foundedYear}` : null,
    t.recycling,
    'Family-first and Christian-owned (listed on LocateFaith)',
  ].filter(Boolean);

  const lines = [
    `# ${business.name}`,
    '',
    `> ${business.name} is a junk removal and demolition company based in ${a.city}, ${a.region}, serving St. Louis City, St. Louis County and St. Charles County. Junk removal is priced by the load (from a ${minimum ? `$${minimum.price} minimum pickup` : 'minimum pickup'} up to a full ${pricing.maxCubicYards}-cubic-yard truck), the price is confirmed before anything is loaded, and customers can book online with real arrival windows.`,
    '',
    '## Contact',
    `- Phone: ${business.phoneDisplay}`,
    `- Email: ${business.email}`,
    `- Address: ${street}${a.city}, ${a.region}${zip}`,
    `- Hours: ${hoursSummary().map((h) => `${h.days} ${h.hours}`).join('; ')}`,
    `- Book online: ${origin}/book/`,
    business.links.googleBusinessProfile ? `- Google Business Profile: ${business.links.googleBusinessProfile}` : null,
    '',
    '## About',
    ...facts.map((f) => `- ${f}`),
    '',
    '## Services',
    ...groups.map((g) => `- [${g.name}](${origin}${g.path}): ${g.intro}${g.howPriced ? ` Pricing: ${g.howPriced}` : ''}`),
    '',
    '## Pricing (junk removal, by the load)',
    ...(minimum ? [`- ${minimum.label}: $${minimum.price}. ${minimum.summary}`] : []),
    ...loads.map((l) => `- ${l.label} (about ${l.yards} cubic yards): ${l.price ? `from $${l.price}` : 'priced on site'}. ${l.summary}`),
    ...pricing.conditions.map((c: string) => `- ${c}`),
    `- Full price list: ${origin}/pricing/`,
    '',
    '## Service area',
    ...regions.map((r) => `- ${r.name}: ${r.places.join(', ')}`),
    `- All areas and ZIP codes: ${origin}/service-areas/`,
    '',
    '## Frequently asked questions',
    ...faqs.flatMap((f) => [`### ${f.q}`, f.a, '']),
    '## Key pages',
    `- [Home](${origin}/): what we do, prices and how booking works`,
    `- [Book online](${origin}/book/): pick a load size, see the price and choose an arrival window`,
    `- [Pricing](${origin}/pricing/): load sizes, what fits in each, everything that changes the price`,
    `- [Service areas](${origin}/service-areas/): cities and neighborhoods we serve`,
    `- [FAQ](${origin}/faq/): answers about pricing, booking and what we take`,
    `- [About](${origin}/about/): who we are`,
    `- [Contact](${origin}/contact/)`,
    ...(posts.length ? [`- [Blog](${origin}/blog/): job write-ups and tips`, ...posts.slice(0, 10).map((p) => `  - [${p.data.title}](${origin}/blog/${p.id}/): ${p.data.description}`)] : []),
    '',
  ].filter((x) => x !== null);

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
