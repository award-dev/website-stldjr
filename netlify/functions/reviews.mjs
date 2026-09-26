// GET /api/reviews — live Google reviews via the Places API (New).
// Needs GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID; otherwise reports unconfigured.
import { env } from "../../server/lib/config.mjs";
import { json } from "../../server/lib/http.mjs";

export default async () => {
  const key = env("GOOGLE_PLACES_API_KEY");
  const place = env("GOOGLE_PLACE_ID");
  if (!key || !place) return json({ status: "unavailable", code: "reviews_unconfigured", reviews: [] }, 503);
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(place)}`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri" },
    });
    if (!res.ok) return json({ status: "error", code: `places_${res.status}`, reviews: [] }, 502);
    const p = await res.json();
    const reviews = (p.reviews || []).map((r) => ({
      name: r.authorAttribution?.displayName || "Google user",
      rating: r.rating,
      text: r.originalText?.text || r.text?.text || "",
      date: r.publishTime || null,
      relative: r.relativePublishTimeDescription || null,
      url: r.authorAttribution?.uri || null,
    }));
    return json({ status: "ok", rating: p.rating ?? null, count: p.userRatingCount ?? null, url: p.googleMapsUri || null, reviews }, 200, {
      "cache-control": "public, max-age=3600",
    });
  } catch {
    return json({ status: "error", code: "places_network", reviews: [] }, 502);
  }
};

export const config = { path: "/api/reviews" };
