// Address suggestions for the booking form. Ported from the General
// Contracting CRM (src/lib/address.ts): pure parsing of Photon
// (OpenStreetMap) and Google Places responses, so it's tested without a
// network. The on-file matching from the CRM isn't needed here.

/** Downtown St. Louis — results are biased toward it and ranked by distance from it. */
export const ST_LOUIS = { lat: 38.627, lon: -90.1994 };

/** Great-circle distance, in kilometres. */
export function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** "928 jefferson" → ["928", "jefferson"] */
export function splitHouseNumber(query) {
  const match = String(query).trim().match(/^(\d+[a-z]?)\s+(.{2,})$/i);
  return match ? [match[1], match[2]] : null;
}

/**
 * Drops street-match guesses when the geocoder already knows the exact house
 * nearby. Type "1115 Sharon" and 1115 Sharon Dr, Florissant is the answer; a
 * guessed "1115 Sharon Dr" on every other Sharon Drive is only noise.
 */
export function preferExact(suggestions, radiusKm = 80) {
  const exactNearby = suggestions.some((s) => !s.guessed && s.distanceKm !== undefined && s.distanceKm <= radiusKm);
  return exactNearby ? suggestions.filter((s) => !s.guessed) : [...suggestions];
}

/** Only nearby results when there are any — a St. Louis crew isn't driving to Indianapolis. */
export function localOnly(suggestions, radiusKm = 120) {
  const local = suggestions.filter((s) => s.distanceKm !== undefined && s.distanceKm <= radiusKm);
  return local.length ? local : [...suggestions];
}

/** Results inside the service area first, each group in the geocoder's order. */
export function rankLocal(suggestions, radiusKm = 80) {
  const local = (s) => s.distanceKm !== undefined && s.distanceKm <= radiusKm;
  return [...suggestions.filter(local), ...suggestions.filter((s) => !local(s))];
}

const STATES = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO", connecticut: "CT",
  delaware: "DE", "district of columbia": "DC", florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL",
  indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT",
  nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA",
  "rhode island": "RI", "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
  "puerto rico": "PR",
};

/** "Missouri" → "MO", "mo" → "MO". */
export function stateCode(value) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^[a-z]{2}$/i.test(trimmed)) return trimmed.toUpperCase();
  return STATES[trimmed.toLowerCase()] ?? trimmed;
}

/** "Florissant, MO 63031" */
export function localityLine(parts) {
  const region = [parts.state, parts.postalCode].filter(Boolean).join(" ");
  return [parts.city, region].filter(Boolean).join(", ");
}

/** Same address despite case, punctuation or "Avenue" vs "Ave". */
export function addressKey(parts) {
  const street = String(parts.addressLine1 || "")
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bstreet\b/g, "st")
    .replace(/\broad\b/g, "rd")
    .replace(/\bdrive\b/g, "dr")
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/\blane\b/g, "ln")
    .replace(/\bcourt\b/g, "ct")
    .replace(/\bplace\b/g, "pl")
    .replace(/\s+/g, " ")
    .trim();
  const where = parts.postalCode?.slice(0, 5) || parts.city?.toLowerCase().trim() || "";
  return `${street}|${where}`;
}

/**
 * Photon GeoJSON → suggestions. US only, street-level only. OpenStreetMap
 * knows most streets but not every house number, so when the match is the
 * street itself the typed number is carried onto it (marked `guessed`).
 */
export function parsePhoton(features, query = "", near = null) {
  const typedNumber = splitHouseNumber(query)?.[0];
  const seen = new Set();
  return (features || []).flatMap((feature, index) => {
    const p = feature.properties || {};
    if (p.countrycode && p.countrycode.toUpperCase() !== "US") return [];
    const street = p.street ?? (p.type === "street" ? p.name : undefined);
    if (!street) return [];
    const number = p.housenumber ?? (p.type === "street" ? typedNumber : undefined);
    const addressLine1 = [number, street].filter(Boolean).join(" ");
    const parts = {
      city: p.city ?? p.town ?? p.village ?? p.district,
      state: stateCode(p.state),
      postalCode: p.postcode?.split(/[;,]/)[0]?.trim(),
    };
    const key = addressKey({ addressLine1, ...parts });
    if (seen.has(key)) return [];
    seen.add(key);
    const at = feature.geometry?.coordinates;
    return [{
      id: `osm-${p.osm_id ?? index}-${number ?? ""}`,
      distanceKm: near && at ? distanceKm(near, { lon: at[0], lat: at[1] }) : undefined,
      guessed: !p.housenumber && number !== undefined ? true : undefined,
      label: addressLine1,
      secondary: localityLine(parts),
      source: "osm",
      addressLine1,
      ...parts,
    }];
  });
}

/** Google Places (New) autocomplete predictions → suggestions (parts need a second call). */
export function parseGooglePredictions(suggestions) {
  return (suggestions || []).flatMap((s) => {
    const p = s.placePrediction;
    if (!p) return [];
    const main = p.structuredFormat?.mainText?.text ?? p.text?.text ?? "";
    if (!main) return [];
    return [{
      id: `google-${p.placeId}`,
      placeId: p.placeId,
      label: main,
      secondary: (p.structuredFormat?.secondaryText?.text ?? "").replace(/,\s*USA$/, ""),
      source: "google",
      addressLine1: main,
    }];
  });
}

/** A Google place's address components → street, city, state, ZIP. */
export function parseGoogleComponents(components) {
  const find = (type) => (components || []).find((c) => c.types.includes(type));
  const number = find("street_number")?.longText;
  const route = find("route")?.shortText ?? find("route")?.longText;
  const addressLine1 = [number, route].filter(Boolean).join(" ");
  if (!addressLine1) return null;
  return {
    addressLine1,
    city: (find("locality") ?? find("sublocality") ?? find("postal_town") ?? find("neighborhood"))?.longText,
    state: find("administrative_area_level_1")?.shortText,
    postalCode: find("postal_code")?.longText,
  };
}
