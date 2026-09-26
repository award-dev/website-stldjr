// GET /api/availability?service=junk&load=half[&summary=1]
import { bookingService, calendarMode } from "../../server/lib/runtime.mjs";
import { getBookingRules, getBusiness } from "../../server/lib/config.mjs";
import { nextAvailable } from "../../server/lib/availability.mjs";
import { json, fail } from "../../server/lib/http.mjs";

export default async (req) => {
  const url = new URL(req.url);
  const service = url.searchParams.get("service") || "junk";
  const load = url.searchParams.get("load") || "half";
  const rules = getBookingRules();
  if (!rules.enabled) return json({ status: "unavailable", code: "booking_disabled", message: "Online booking is paused. Call us to schedule." });
  try {
    const svc = await bookingService(req);
    const days = await svc.availability({ service, load });
    const body = { status: "ok", mode: calendarMode(), timezone: getBusiness().timezone, next: nextAvailable(days) };
    if (url.searchParams.get("summary") !== "1") body.days = days;
    // Short edge cache for the homepage "next available" badge only.
    return json(body, 200, url.searchParams.get("summary") === "1" ? { "cache-control": "public, max-age=60" } : {});
  } catch (err) {
    // "Not connected" is a normal state for this endpoint, not a server fault:
    // answer 200 so the page can show its fallback without console noise.
    const res = fail(err);
    if (res.status === 503) return json({ ...(await res.json()), status: "unavailable" }, 200);
    return res;
  }
};

export const config = { path: "/api/availability" };
