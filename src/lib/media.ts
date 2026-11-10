import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { videos, type Video } from '../data/videos';
import { jobImage, fitWidths, PHOTO_QUALITY } from './images';
import type { Project } from '../data/projects';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** 1080p H.264 copy of an AV1 walkthrough (for Safari and other browsers without AV1), if one was made. */
const hdCopy = (slug: string) => existsSync(join(process.cwd(), 'public', 'videos', `${slug}.hd.mp4`)) ? `/videos/${slug}.hd.mp4` : undefined;

const posters = import.meta.glob<ImageMetadata>('/src/assets/video-posters/*.jpg', { eager: true, import: 'default' });

/** Muted preview loop made by scripts/media.mjs (public/videos/previews/<slug>.mp4). Delete a file to opt a video out. */
const previewFor = (slug: string) => existsSync(join(process.cwd(), 'public', 'videos', 'previews', `${slug}.mp4`)) ? `/videos/previews/${slug}.mp4` : undefined;

export interface ReelVideo {
  slug: string;
  title: string;
  blurb: string;
  orientation: 'portrait' | 'landscape';
  poster: string;
  posterLarge: string;
  posterSrcset: string;
  preview?: string;
  sources: { src: string; type: string }[];
  date: string;
  duration?: string;
}

export function posterMeta(slug: string): ImageMetadata {
  const p = posters[`/src/assets/video-posters/${slug}.jpg`];
  if (!p) throw new Error(`Missing poster for ${slug}`);
  return p;
}

export async function reelVideo(v: Video): Promise<ReelVideo> {
  const meta = posterMeta(v.slug);
  const landscape = v.vertical === false;
  const [w1, w2, w3] = landscape ? [960, 1440, 1920] : [540, 810, 1080];
  const [small, mid, large] = await Promise.all([
    getImage({ src: meta, width: w1, format: 'webp', quality: 86 }),
    getImage({ src: meta, width: w2, format: 'webp', quality: 86 }),
    getImage({ src: meta, width: w3, format: 'webp', quality: 86 }),
  ]);
  // Source order: the original (only where the browser supports its codec), then the 1080p H.264 copy
  // (plays everywhere, including Safari, which often lacks AV1/VP9), then an original low-res H.264 fallback.
  const hd = hdCopy(v.slug);
  const CODECS: Record<string, string> = { av1: 'av01.0.08M.08', vp9: 'vp09.00.40.08', hevc: 'hvc1.1.6.L120.90' };
  const sources = v.codec !== 'h264'
    ? [
        { src: v.src, type: `video/mp4; codecs="${CODECS[v.codec]}"` },
        ...(hd ? [{ src: hd, type: 'video/mp4; codecs="avc1.640032"' }] : []),
        ...(v.fallback ? [{ src: v.fallback, type: 'video/mp4' }] : []),
      ]
    : [{ src: v.src, type: 'video/mp4' }];
  return {
    slug: v.slug,
    title: v.title,
    blurb: v.blurb,
    poster: small.src,
    posterLarge: large.src,
    orientation: landscape ? 'landscape' : 'portrait',
    posterSrcset: `${small.src} ${w1}w, ${mid.src} ${w2}w, ${large.src} ${w3}w`,
    preview: previewFor(v.slug),
    sources,
    date: v.date,
    duration: v.duration,
  };
}

export async function reelVideos(slugs?: string[]): Promise<ReelVideo[]> {
  const list = slugs ? slugs.map((s) => videos.find((v) => v.slug === s)!).filter(Boolean) : videos;
  return Promise.all(list.map(reelVideo));
}

/** VideoObject JSON-LD for a page that embeds these walkthroughs. */
export async function videoSchema(list: ReelVideo[], site: string) {
  return Promise.all(list.map(async (v) => {
    const big = await getImage({ src: posterMeta(v.slug), width: v.orientation === 'landscape' ? 1280 : 1080, format: 'jpg', quality: 85 });
    // Point search engines at the 1080p H.264 file when there is one (widest support at full quality).
    const playable = (v.sources.find((s) => s.type.includes('avc1')) ?? v.sources[v.sources.length - 1]).src;
    return {
      '@type': 'VideoObject',
      name: v.title,
      description: v.blurb,
      thumbnailUrl: new URL(big.src, site).href,
      contentUrl: new URL(playable, site).href,
      uploadDate: v.date,
      ...(v.duration ? { duration: v.duration } : {}),
    };
  }));
}

export interface GalleryPhoto {
  id: string;
  category: Project['category'];
  alt: string;
  thumb: string;
  srcset: string;
  full: string;
  w: number;
  h: number;
  before?: boolean;
}

export async function galleryPhotos(items: Project[]): Promise<GalleryPhoto[]> {
  return Promise.all(items.map(async (p) => {
    const meta = jobImage(p.file);
    const widths = fitWidths(meta, [400, 640, 960, 1280]);
    const imgs = await Promise.all(widths.map((w) => getImage({ src: meta, width: w, format: 'webp', quality: PHOTO_QUALITY })));
    const full = await getImage({ src: meta, width: meta.width, format: 'webp', quality: 90 });
    return {
      id: p.file,
      category: p.category,
      alt: p.alt,
      thumb: imgs[0].src,
      srcset: imgs.map((im, i) => `${im.src} ${widths[i]}w`).join(', '),
      full: full.src,
      w: meta.width,
      h: meta.height,
      before: p.role === 'before',
    };
  }));
}

export async function pairImages(before: Project, after: Project) {
  const one = async (p: Project) => {
    const meta = jobImage(p.file);
    const widths = fitWidths(meta, [720, 1080, 1440]);
    const imgs = await Promise.all(widths.map((w) => getImage({ src: meta, width: w, format: 'webp', quality: PHOTO_QUALITY })));
    return { src: imgs[0].src, srcset: imgs.map((im, i) => `${im.src} ${widths[i]}w`).join(', '), alt: p.alt, width: meta.width, height: meta.height };
  };
  return { before: await one(before), after: await one(after) };
}
