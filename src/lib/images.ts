import type { ImageMetadata } from 'astro';
import { projects, type Project } from '../data/projects';
import { categoryLabels } from '../data/site';

export { categoryLabels };

const files = import.meta.glob<ImageMetadata>('/src/assets/jobs/**/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });

export function jobImage(path: string): ImageMetadata {
  const img = files[`/src/assets/jobs/${path}`];
  if (!img) throw new Error(`Missing job image: ${path}`);
  return img;
}

export function projectFor(path: string): Project {
  const p = projects.find((x) => x.file === path);
  if (!p) throw new Error(`No project entry for ${path}`);
  return p;
}

/** Before/after pairs (two projects sharing a `pair` key). */
export function pairs() {
  const byPair = new Map<string, { before?: Project; after?: Project }>();
  for (const p of projects) {
    if (!p.pair) continue;
    const entry = byPair.get(p.pair) ?? {};
    if (p.role === 'before') entry.before = p;
    if (p.role === 'after') entry.after = p;
    byPair.set(p.pair, entry);
  }
  return [...byPair.entries()]
    .filter(([, v]) => v.before && v.after)
    .map(([key, v]) => ({ key, before: v.before!, after: v.after! }));
}

/** Finished-work photos (no in-progress or "before" shots) for a category. */
export function finished(category?: string) {
  return projects.filter(
    (p) => p.role !== 'before' && !/progress|framing|demo/.test(p.file) && (!category || p.category === category),
  );
}

/** Quality used for every resized job photo (sources are often already-compressed social media JPEGs). */
export const PHOTO_QUALITY = 86;

/**
 * Responsive widths for a photo: the requested sizes that the source can actually supply,
 * plus the source's own width when a larger size was asked for (never upscale).
 */
export function fitWidths(img: ImageMetadata, targets: number[]): number[] {
  const ok = targets.filter((w) => w < img.width);
  if (targets.some((w) => w >= img.width)) ok.push(img.width);
  return [...new Set(ok)].sort((a, b) => a - b);
}
