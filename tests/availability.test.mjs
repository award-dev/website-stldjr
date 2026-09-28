import { test } from "node:test";
import assert from "node:assert/strict";
import { computeAvailability, busyFromEvents, nextAvailable, slotIsFree } from "../server/lib/availability.mjs";

const TZ = "America/Chicago";
const hours = { mon: ["08:00", "18:00"], tue: ["08:00", "18:00"], wed: ["08:00", "18:00"], thu: ["08:00", "18:00"], fri: ["08:00", "18:00"], sat: ["08:00", "16:00"], sun: null };
const rules = {
  horizonDays: 7, minNoticeHours: 12, sameDay: false, crews: 1, bufferMinutes: 30, jobsMustFinishByClose: true,
  windows: [ { id: "am1", start: "08:00", end: "10:00" }, { id: "am2", start: "10:00", end: "12:00" }, { id: "pm1", start: "12:00", end: "14:00" }, { id: "pm2", start: "14:00", end: "16:00" } ],
  durationMinutes: { quarter: 60, half: 90, "three-quarter": 120, full: 150, demolition: 240 },
};
// Wednesday 2026-10-07 09:00 CDT
const now = new Date("2026-10-07T14:00:00Z");

test("no same-day slots and sunday is closed", () => {
  const days = computeAvailability({ now, rules, hours, tz: TZ, busy: [], service: "junk", load: "half" });
  assert.equal(days[0].date, "2026-10-07");
  assert.equal(days[0].slots.length, 0);
  const sun = days.find((d) => d.weekday === "sun");
  assert.equal(sun.open, false);
  assert.equal(sun.slots.length, 0);
});

test("minimum notice removes early windows tomorrow", () => {
  const late = new Date("2026-10-07T23:30:00Z"); // 18:30 CDT; +12h = 06:30 next day
  const days = computeAvailability({ now: late, rules: { ...rules, minNoticeHours: 14 }, hours, tz: TZ, busy: [], service: "junk", load: "half" });
  const thu = days.find((d) => d.date === "2026-10-08");
  assert.deepEqual(thu.slots.map((s) => s.available), [false, true, true, true]);
});

test("existing event blocks overlapping windows including buffer", () => {
  const busy = busyFromEvents([{ id: "x", start: { dateTime: "2026-10-08T08:00:00-05:00" }, end: { dateTime: "2026-10-08T09:30:00-05:00" } }], TZ);
  const days = computeAvailability({ now, rules, hours, tz: TZ, busy, service: "junk", load: "half" });
  const thu = days.find((d) => d.date === "2026-10-08");
  // am1 clashes; am2 starts 10:00, block 9:30 with buffer → touches 9:30 end exactly (no overlap)
  assert.deepEqual(thu.slots.map((s) => s.available), [false, true, true, true]);
});

test("transparent and cancelled events do not block", () => {
  const busy = busyFromEvents([
    { id: "a", transparency: "transparent", start: { dateTime: "2026-10-08T08:00:00-05:00" }, end: { dateTime: "2026-10-08T17:00:00-05:00" } },
    { id: "b", status: "cancelled", start: { dateTime: "2026-10-08T08:00:00-05:00" }, end: { dateTime: "2026-10-08T17:00:00-05:00" } },
  ], TZ);
  assert.equal(busy.length, 0);
});

test("opaque all-day events block the day", () => {
  const busy = busyFromEvents([{ id: "v", start: { date: "2026-10-08" }, end: { date: "2026-10-09" } }], TZ);
  const days = computeAvailability({ now, rules, hours, tz: TZ, busy, service: "junk", load: "quarter" });
  assert.ok(days.find((d) => d.date === "2026-10-08").slots.every((s) => !s.available));
  assert.ok(days.find((d) => d.date === "2026-10-09").slots.some((s) => s.available));
});

test("long jobs must finish before close (saturday)", () => {
  const days = computeAvailability({ now, rules, hours, tz: TZ, busy: [], service: "demolition", load: "full" });
  const sat = days.find((d) => d.weekday === "sat");
  // Sat closes 16:00; demolition 240 min → only 08:00, 10:00, 12:00 starts fit
  assert.deepEqual(sat.slots.map((s) => s.available), [true, true, true, false]);
});

test("crew capacity allows parallel jobs", () => {
  const busy = [{ id: "x", start: Date.parse("2026-10-08T13:00:00Z"), end: Date.parse("2026-10-08T15:00:00Z") }];
  const start = Date.parse("2026-10-08T13:00:00Z");
  assert.equal(slotIsFree(rules, busy, start, 60), false);
  assert.equal(slotIsFree({ ...rules, crews: 2 }, busy, start, 60), true);
  assert.equal(slotIsFree(rules, busy, start, 60, "x"), true, "ignores own event when rescheduling");
});

test("jobs may run past close when the rule is off", () => {
  const days = computeAvailability({ now, rules: { ...rules, jobsMustFinishByClose: false }, hours, tz: TZ, busy: [], service: "demolition", load: "full" });
  const sat = days.find((d) => d.weekday === "sat");
  assert.deepEqual(sat.slots.map((s) => s.available), [true, true, true, true]);
});

test("nextAvailable finds the first open window", () => {
  const days = computeAvailability({ now, rules, hours, tz: TZ, busy: [], service: "junk", load: "half" });
  const n = nextAvailable(days);
  assert.equal(n.date, "2026-10-08");
  assert.equal(n.slot.id, "am1");
  assert.equal(n.slot.start, "2026-10-08T13:00:00.000Z");
});
