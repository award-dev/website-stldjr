/**
 * Walkthrough videos in public/videos/. None yet: every video section hides itself while these are empty.
 * To add one, follow the business-site-builder media steps (probe, poster, preview, hd) and register it here.
 */
export interface Video {
  slug: string;
  title: string;
  blurb: string;
  src: string;
  codec: 'h264' | 'av1' | 'vp9' | 'hevc';
  fallback?: string;
  date: string; // YYYY-MM-DD (VideoObject uploadDate)
  vertical?: boolean;
  duration?: string;
}

export const videos: Video[] = [];
export const featureVideos: Video[] = [];
