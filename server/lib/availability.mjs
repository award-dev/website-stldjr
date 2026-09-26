// Turns business hours, booking rules and existing calendar events into
// bookable arrival windows. Pure — no I/O — so it's fully unit-tested.

import { addDays, formatWindow, minutesOf, weekdayOf, zonedParts, zonedToUtc } from "../../shared/time.js";

export function durationFor(rules, { service, load }) {
  const d = rules.durationMinutes;
  if (service === "demolition" && d.demolition) return d.demolition;
  return d[load] || d.full || 120;
}

/**
 * The calendar block a booking occupies: crew plans to arrive at the start of
 * the window; the window itself is slack for traffic and the previous job.
 */
export function blockFor(rules, windowStartMs, durationMin) {
  return { start: windowStartMs, end: windowStartMs + durationMin * 60_000 };
}

/** Normalise Google Calendar events into busy intervals. */
export function busyFromEvents(events, tz) {
  const busy = [];
  for (const ev of events) {
    if (ev.status === "cancelled" || ev.transparency === "transparent") continue;
    if (ev.extendedProperties?.private?.bookingStatus === "cancelled") continue;
    if (ev.start?.dateTime && ev.end?.dateTime) {
      busy.push({ start: Date.parse(ev.start.dateTime), end: Date.parse(ev.end.dateTime), id: ev.id });
    } else if (ev.start?.date && ev.end?.date) {
      // Opaque all-day events ("Out of town") block the whole local day(s).
      busy.push({ start: zonedToUtc(ev.start.date, "00:00", tz).getTime(), end: zonedToUtc(ev.end.date, "00:00", tz).getTime(), id: ev.id });
    }
  }
  return busy;
}

function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

export function slotIsFree(rules, busy, windowStartMs, durationMin, ignoreId) {
  const block = blockFor(rules, windowStartMs, durationMin);
  const buf = (rules.bufferMinutes || 0) * 60_000;
  const padded = { start: block.start - buf, end: block.end + buf };
  const clashes = busy.filter((b) => b.id !== ignoreId && overlaps(padded, b)).length;
  return clashes < (rules.crews || 1);
}

/**
 * @returns {{ date: string, weekday: string, open: boolean, slots: {id,start,end,label,available}[] }[]}
 */
export function computeAvailability({ now, rules, hours, tz, busy, service, load, ignoreId }) {
  const nowMs = now instanceof Date ? now.getTime() : now;
  const today = zonedParts(new Date(nowMs), tz).date;
  const earliest = nowMs + (rules.minNoticeHours || 0) * 3_600_000;
  const duration = durationFor(rules, { service, load });
  const days = [];

  for (let i = 0; i < rules.horizonDays; i++) {
    const date = addDays(today, i);
    const weekday = weekdayOf(date);
    const open = hours[weekday];
    const day = { date, weekday, open: Boolean(open), slots: [] };
    if (open && (rules.sameDay || date !== today)) {
      const [openAt, closeAt] = open.map(minutesOf);
      for (const w of rules.windows) {
        if (minutesOf(w.start) < openAt || minutesOf(w.end) > closeAt) continue;
        const start = zonedToUtc(date, w.start, tz).getTime();
        const end = zonedToUtc(date, w.end, tz).getTime();
        // The job must also finish before close.
        const finish = start + duration * 60_000;
        const closeMs = zonedToUtc(date, open[1], tz).getTime();
        const reason = start < earliest ? "notice" : finish > closeMs ? "closing" : !slotIsFree(rules, busy, start, duration, ignoreId) ? "booked" : null;
        day.slots.push({ id: w.id, start: new Date(start).toISOString(), end: new Date(end).toISOString(), label: formatWindow(w.start, w.end), available: !reason, ...(reason ? { reason } : {}) });
      }
    }
    days.push(day);
  }
  return days;
}

export function nextAvailable(days) {
  for (const d of days) {
    const s = d.slots.find((x) => x.available);
    if (s) return { date: d.date, slot: s };
  }
  return null;
}

/** Find the window a client asked for, re-validated against rules. */
export function resolveWindow({ rules, hours, tz, date, windowId }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return null;
  const w = rules.windows.find((x) => x.id === windowId);
  const open = hours[weekdayOf(date)];
  if (!w || !open) return null;
  if (minutesOf(w.start) < minutesOf(open[0]) || minutesOf(w.end) > minutesOf(open[1])) return null;
  return {
    window: w,
    start: zonedToUtc(date, w.start, tz),
    end: zonedToUtc(date, w.end, tz),
    closeAt: zonedToUtc(date, open[1], tz),
    label: formatWindow(w.start, w.end),
  };
}
