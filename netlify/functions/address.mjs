// Address suggestions for the booking form's street field.
//   GET /api/address?q=1115 shar&session=<id>   → { suggestions, provider }
//   GET /api/address?place=<googlePlaceId>&session=<id> → { address }
//
// Provider: Google Places when GOOGLE_MAPS_API_KEY is set (best house-number
// coverage), otherwise Photon — a free OpenStreetMap geocoder, no key. Either
// failing returns an empty list; the field keeps working as a plain input.
// Ported from the General Contracting CRM's /api/address route.

import { env } from "../../server/lib/config.mjs";
import { json } from "../../server/lib/http.mjs";
import { ST_LOUIS, localOnly, parseGoogleComponents, parseGooglePredictions, parsePhoton, preferExact, rankLocal, splitHouseNumber } from "../../shared/address.js";

const TIMEOUT_MS = 2500;
const US_BBOX = "-179.9,18.0,-66.0,71.5";
const USER_AGENT = "STL Demolition & Junk Removal website (stlouishjr.com)";

export default async (req) => {
  const key = env("GOOGLE_MAPS_API_KEY");
  const provider = key ? "google" : "osm";
  const params = new URL(req.url).searchParams;
  const session = params.get("session")?.slice(0, 64) || undefined;
  try {
    const place = params.get("place");
    if (place) return json({ address: key ? await googleDetails(key, place, session) : null });

    const q = (params.get("q") ?? "").trim().slice(0, 120);
    if (q.length < 4) return json({ suggestions: [], provider });
    const suggestions = key ? await googleAutocomplete(key, q, session) : await photon(q);
    return json({ suggestions: suggestions.slice(0, 6), provider });
  } catch (err) {
    console.error("[address] lookup failed", err?.message);
    return json({ suggestions: [], provider });
  }
};

/**
 * Photon, twice when a house number was typed: as typed, and the street alone
 * near St. Louis (OSM is thin on US house numbers). Local results rank first.
 */
async function photon(q) {
  const split = splitHouseNumber(q);
  const [full, streets] = await Promise.all([photonFetch(q, false), split ? photonFetch(split[1], true) : Promise.resolve([])]);
  return localOnly(rankLocal(preferExact([...parsePhoton(full, q, ST_LOUIS), ...parsePhoton(streets, q, ST_LOUIS)])));
}

async function photonFetch(q, streetsOnly) {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", streetsOnly ? "5" : "8");
  url.searchParams.set("lang", "en");
  url.searchParams.set("bbox", US_BBOX);
  if (streetsOnly) url.searchParams.set("layer", "street");
  url.searchParams.set("lat", String(ST_LOUIS.lat));
  url.searchParams.set("lon", String(ST_LOUIS.lon));
  url.searchParams.set("zoom", "12");
  url.searchParams.set("location_bias_scale", "0.1");
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => null);
  if (!res?.ok) return [];
  const body = await res.json().catch(() => ({}));
  return body.features ?? [];
}

async function googleAutocomplete(key, q, session) {
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Goog-Api-Key": key },
    body: JSON.stringify({
      input: q,
      includedRegionCodes: ["us"],
      includedPrimaryTypes: ["street_address", "premise", "subpremise", "route"],
      locationBias: { circle: { center: { latitude: ST_LOUIS.lat, longitude: ST_LOUIS.lon }, radius: 50_000 } },
      sessionToken: session,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const body = await res.json();
  return parseGooglePredictions(body.suggestions ?? []);
}

async function googleDetails(key, placeId, session) {
  if (!/^[\w-]{10,300}$/.test(placeId)) return null;
  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  if (session) url.searchParams.set("sessionToken", session);
  const res = await fetch(url, { headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "addressComponents" }, signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => null);
  if (!res?.ok) return null;
  const body = await res.json();
  return parseGoogleComponents(body.addressComponents ?? []);
}

export const config = {
  path: "/api/address",
  rateLimit: { windowLimit: 90, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
