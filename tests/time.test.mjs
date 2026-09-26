import { test } from "node:test";
import assert from "node:assert/strict";
import { zonedToUtc, zonedParts, formatWindow, addDays, weekdayOf } from "../shared/time.js";

const TZ = "America/Chicago";

test("zonedToUtc handles CDT and CST", () => {
  assert.equal(zonedToUtc("2026-07-01", "08:00", TZ).toISOString(), "2026-07-01T13:00:00.000Z");
  assert.equal(zonedToUtc("2026-12-01", "08:00", TZ).toISOString(), "2026-12-01T14:00:00.000Z");
});

test("zonedToUtc across DST change days", () => {
  // 2026-11-01 DST ends at 2:00; 08:00 is CST.
  assert.equal(zonedToUtc("2026-11-01", "08:00", TZ).toISOString(), "2026-11-01T14:00:00.000Z");
  // 2026-03-08 DST starts; 08:00 is CDT.
  assert.equal(zonedToUtc("2026-03-08", "08:00", TZ).toISOString(), "2026-03-08T13:00:00.000Z");
});

test("zonedParts round-trips", () => {
  const p = zonedParts(new Date("2026-10-08T15:30:00Z"), TZ);
  assert.equal(p.date, "2026-10-08");
  assert.equal(p.hour, 10);
  assert.equal(p.weekday, "thu");
});

test("formatWindow", () => {
  assert.equal(formatWindow("08:00", "10:00"), "8 – 10 AM");
  assert.equal(formatWindow("10:00", "12:00"), "10 AM – 12 PM");
  assert.equal(formatWindow("12:00", "14:00"), "12 – 2 PM");
});

test("addDays / weekdayOf", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(weekdayOf("2026-10-08"), "thu");
});
