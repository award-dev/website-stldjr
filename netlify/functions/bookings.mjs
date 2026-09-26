// POST /api/bookings — create a booking.
import { bookingService, calendarMode } from "../../server/lib/runtime.mjs";
import { json, fail, readJson, sameOrigin } from "../../server/lib/http.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ status: "error", code: "method" }, 405, { allow: "POST" });
  if (!sameOrigin(req)) return json({ status: "error", code: "origin" }, 403);
  try {
    const payload = await readJson(req);
    const svc = await bookingService(req);
    const result = await svc.create(payload);
    return json({ status: "ok", mode: calendarMode(), ...result }, 201);
  } catch (err) {
    return fail(err);
  }
};

export const config = {
  path: "/api/bookings",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
