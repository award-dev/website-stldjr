// Timezone helpers shared by the booking server and the browser.
// No libraries: Intl does the heavy lifting, including DST.

const partsCache = new Map();

function formatter(tz) {
  let f = partsCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    });
    partsCache.set(tz, f);
  }
  return f;
}

/** Wall-clock parts of an instant in a timezone. */
export function zonedParts(date, tz) {
  const out = {};
  for (const p of formatter(tz).formatToParts(date)) out[p.type] = p.value;
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour),
    minute: Number(out.minute),
    second: Number(out.second),
    weekday: out.weekday.slice(0, 3).toLowerCase(),
    date: `${out.year}-${out.month}-${out.day}`,
  };
}

/** Offset (ms) of tz from UTC at the given instant. */
function offsetAt(ms, tz) {
  const p = zonedParts(new Date(ms), tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** Convert a local date ("YYYY-MM-DD") + time ("HH:MM") in tz to a Date. */
export function zonedToUtc(date, time, tz) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let ms = guess - offsetAt(guess, tz);
  // Re-check once: the offset can differ on the far side of a DST change.
  const second = guess - offsetAt(ms, tz);
  if (second !== ms) ms = second;
  return new Date(ms);
}

/** Add whole days to a "YYYY-MM-DD" string. */
export function addDays(date, n) {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function weekdayOf(date) {
  const [y, m, d] = date.split("-").map(Number);
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function minutesOf(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** "08:00" → "8 AM", "14:30" → "2:30 PM" */
export function formatClock(time) {
  let [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, "0")} ${suffix}` : `${h} ${suffix}`;
}

/** "08:00","10:00" → "8 – 10 AM"; "10:00","12:00" → "10 AM – 12 PM" */
export function formatWindow(start, end) {
  const a = formatClock(start);
  const b = formatClock(end);
  const sa = a.slice(-2);
  const sb = b.slice(-2);
  return sa === sb ? `${a.slice(0, -3)} – ${b}` : `${a} – ${b}`;
}

/** "2026-10-08" → "Thursday, October 8" */
export function formatLongDate(date) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
