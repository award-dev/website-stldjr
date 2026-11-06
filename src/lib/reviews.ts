// Google reviews, fetched once at build time from the Places API (New) so they are in the HTML.
// Needs GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID (set in Netlify). Without them, or if Google is
// unreachable, this returns null and the Reviews component loads them in the browser via /api/reviews.
export interface GoogleReview { name: string; rating: number; text: string; relative: string | null; date: string | null; url: string | null }
export interface GoogleReviews { rating: number | null; count: number | null; url: string | null; reviews: GoogleReview[] }

let cached: Promise<GoogleReviews | null> | undefined;

export function googleReviews(): Promise<GoogleReviews | null> {
  cached ??= load();
  return cached;
}

async function load(): Promise<GoogleReviews | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const place = process.env.GOOGLE_PLACE_ID;
  if (!key || !place) return null;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(place)}`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) { console.warn(`[reviews] Places API ${res.status}; falling back to the browser.`); return null; }
    const p = await res.json();
    const reviews = (p.reviews ?? [])
      .map((r: any) => ({
        name: r.authorAttribution?.displayName || 'Google user',
        rating: r.rating,
        text: r.originalText?.text || r.text?.text || '',
        relative: r.relativePublishTimeDescription || null,
        date: r.publishTime || null,
        url: r.authorAttribution?.uri || null,
      }))
      .filter((r: GoogleReview) => r.text && r.rating);
    return { rating: p.rating ?? null, count: p.userRatingCount ?? null, url: p.googleMapsUri ?? null, reviews };
  } catch (e) {
    console.warn('[reviews] Places API unreachable; falling back to the browser.', (e as Error).message);
    return null;
  }
}
