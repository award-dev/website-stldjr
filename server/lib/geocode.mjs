// Optional address verification with the Google Geocoding API
// (GOOGLE_MAPS_API_KEY). Returns true (verified), false (no match) or null
// (couldn't check — never blocks a booking on our own outage).

import { env } from "./config.mjs";

export function createGeocoder(fetchImpl = fetch) {
  const key = env("GOOGLE_MAPS_API_KEY");
  if (!key) return null;
  return async function geocode(address) {
    try {
      const u = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      u.searchParams.set("address", address);
      u.searchParams.set("components", "country:US|administrative_area:MO");
      u.searchParams.set("key", key);
      const res = await fetchImpl(u);
      if (!res.ok) return null;
      const json = await res.json();
      if (json.status === "ZERO_RESULTS") return false;
      if (json.status !== "OK") return null;
      const top = json.results[0];
      const precise = top.types?.some((t) => ["street_address", "premise", "subpremise"].includes(t));
      return precise ? true : false;
    } catch {
      return null;
    }
  };
}
