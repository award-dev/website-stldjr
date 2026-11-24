import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import servicesCfg from '../config/services.json';

/**
 * Blog posts. This is a fixed contract: posts are committed by an automated publisher through the GitHub API.
 *
 *   File:    src/content/blog/<slug>.md   (slug = lowercase-hyphenated; it becomes /blog/<slug>/)
 *   Images:  src/assets/blog/<slug>/*.jpg|png|webp   (the company's own photos, or topic illustrations with
 *            illustration: true; never stock, and an illustration is never shown as our job)
 *   Body:    plain Markdown (## and ### headings, paragraphs, lists). The page supplies the H1 from `title`.
 *
 *   ---
 *   title: "…"                                   required
 *   description: "…"                             required, the meta description (aim 140–155 characters)
 *   date: 2026-11-16                             required, YYYY-MM-DD
 *   cover: ../../assets/blog/<slug>/cover.jpg    required, relative path to the image
 *   coverAlt: "…"                                required, describes what is in the photo
 *   photos:                                      optional, shown as a small gallery after the article
 *     - src: ../../assets/blog/<slug>/2.jpg
 *       alt: "…"
 *   service: junk-removal                        optional, links the post to that service page
 *   illustration: true                           optional, the images are topic illustrations (AI), not job photos;
 *                                                the page says so under the article
 *   draft: true                                  optional, true = the post is not built
 *   ---
 *
 * `service` takes a service from config/services.json: the slug in its `path` (junk-removal, cleanouts,
 * demolition, construction-debris-removal) or its group `id` (e.g. construction-debris).
 */
const serviceKeys = [
  ...new Set(servicesCfg.groups.flatMap((g) => [g.id, g.path.split('/').filter(Boolean).pop() as string])),
] as [string, ...string[]];

const isoDate = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'), z.date()])
  .transform((d) => (typeof d === 'string' ? new Date(`${d}T00:00:00Z`) : d))
  .refine((d) => !Number.isNaN(d.getTime()), 'date must be a real calendar date');

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      date: isoDate,
      cover: image(),
      coverAlt: z.string().trim().min(1),
      photos: z.array(z.object({ src: image(), alt: z.string().trim().min(1) })).optional(),
      service: z.enum(serviceKeys).optional(),
      illustration: z.boolean().optional(),
      draft: z.boolean().optional(),
    }),
});

export const collections = { blog };
