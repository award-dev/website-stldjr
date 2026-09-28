import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePhoton, preferExact, rankLocal, parseGooglePredictions, parseGoogleComponents, ST_LOUIS, stateCode } from "../shared/address.js";

const house = { geometry: { coordinates: [-90.32, 38.79] }, properties: { osm_id: 1, housenumber: "1115", street: "Sharon Drive", city: "Florissant", state: "Missouri", postcode: "63031", countrycode: "US", type: "house" } };
const farHouse = { geometry: { coordinates: [-86.2, 39.77] }, properties: { osm_id: 2, housenumber: "1115", street: "Sharon Avenue", city: "Indianapolis", state: "Indiana", postcode: "46222", countrycode: "US", type: "house" } };
const street = { geometry: { coordinates: [-90.4, 38.6] }, properties: { osm_id: 3, name: "Sharon Lane", city: "Ballwin", state: "Missouri", postcode: "63011", countrycode: "US", type: "street" } };

test("parsePhoton builds street, city, state and ZIP", () => {
  const [s] = parsePhoton([house], "1115 shar", ST_LOUIS);
  assert.equal(s.addressLine1, "1115 Sharon Drive");
  assert.equal(s.city, "Florissant");
  assert.equal(s.state, "MO");
  assert.equal(s.postalCode, "63031");
  assert.equal(s.secondary, "Florissant, MO 63031");
  assert.ok(s.distanceKm < 30);
});

test("typed house number is carried onto a street match and marked guessed", () => {
  const [s] = parsePhoton([street], "42 sharon", ST_LOUIS);
  assert.equal(s.addressLine1, "42 Sharon Lane");
  assert.equal(s.guessed, true);
});

test("non-US and street-less results are dropped", () => {
  assert.equal(parsePhoton([{ properties: { ...house.properties, countrycode: "CA" } }]).length, 0);
  assert.equal(parsePhoton([{ properties: { name: "Florissant", type: "city", countrycode: "US" } }]).length, 0);
});

test("local exact matches win: guesses dropped, St. Louis first", () => {
  const all = parsePhoton([farHouse, house, street], "1115 sharon", ST_LOUIS);
  const ranked = rankLocal(preferExact(all));
  assert.equal(ranked[0].city, "Florissant");
  assert.ok(!ranked.some((s) => s.guessed));
});

test("far-away results are hidden when local ones exist", async () => {
  const { localOnly } = await import("../shared/address.js");
  const all = parsePhoton([farHouse, house], "1115 sharon", ST_LOUIS);
  assert.deepEqual(localOnly(all).map((s) => s.city), ["Florissant"]);
  const onlyFar = parsePhoton([farHouse], "1115 sharon", ST_LOUIS);
  assert.equal(localOnly(onlyFar).length, 1, "falls back to everything when nothing is local");
});

test("Google predictions and place details parse", () => {
  const [p] = parseGooglePredictions([{ placePrediction: { placeId: "abc123456789", structuredFormat: { mainText: { text: "1115 Sharon Dr" }, secondaryText: { text: "Florissant, MO, USA" } } } }]);
  assert.equal(p.secondary, "Florissant, MO");
  const parts = parseGoogleComponents([
    { longText: "1115", types: ["street_number"] },
    { longText: "Sharon Drive", shortText: "Sharon Dr", types: ["route"] },
    { longText: "Florissant", types: ["locality"] },
    { shortText: "MO", types: ["administrative_area_level_1"] },
    { longText: "63031", types: ["postal_code"] },
  ]);
  assert.deepEqual(parts, { addressLine1: "1115 Sharon Dr", city: "Florissant", state: "MO", postalCode: "63031" });
  assert.equal(stateCode("missouri"), "MO");
});
