import { getCollection, type CollectionEntry } from 'astro:content';
import servicesCfg from '../../config/services.json';
import { nav, services, type Service } from '../data/site';

export type Post = CollectionEntry<'blog'>;

/** Published posts (drafts left out), newest first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => data.draft !== true);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id));
}

export const postHref = (p: Post) => `/blog/${p.id}/`;

/** YYYY-MM-DD, for <time datetime> and schema.org dates. */
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** "November 16, 2026". Dates are calendar days stored at UTC midnight, so format in UTC. */
export const longDate = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** The service page a post's `service` field points at (a path slug or a group id from config/services.json). */
export function postService(key: string | undefined): Service | undefined {
  if (!key) return undefined;
  const group = servicesCfg.groups.find((g) => g.id === key || g.path.split('/').filter(Boolean).pop() === key);
  const slug = group?.path.split('/').filter(Boolean).pop();
  return services.find((s) => s.slug === slug);
}

/** Site navigation, with Blog added only once at least one post is published (never link an empty blog). */
export async function siteNav() {
  if ((await getPosts()).length === 0) return nav;
  const i = nav.findIndex((n) => n.href === '/about/');
  const blog = { href: '/blog/', label: 'Blog' };
  return i < 0 ? [...nav, blog] : [...nav.slice(0, i), blog, ...nav.slice(i)];
}
