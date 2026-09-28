// Manage an existing booking with its signed link.
//   GET  /api/booking?id=&t=                → details
//   GET  /api/booking/availability?id=&t=   → open windows for rescheduling
//   POST /api/booking/cancel      {id,t}
//   POST /api/booking/reschedule  {id,t,date,windowId}
import { bookingService, calendarMode } from "../../server/lib/runtime.mjs";
import { json, fail, readJson, sameOrigin } from "../../server/lib/http.mjs";

export default async (req, context) => {
  const url = new URL(req.url);
  const action = context?.params?.action || url.pathname.split("/").filter(Boolean)[2] || "";
  try {
    const svc = await bookingService(req);
    if (req.method === "GET") {
      const id = url.searchParams.get("id") || "";
      const t = url.searchParams.get("t") || "";
      if (action === "availability") {
        const { days } = await svc.availabilityFor(id, t);
        return json({ status: "ok", mode: calendarMode(), days });
      }
      return json({ status: "ok", mode: calendarMode(), ...(await svc.get(id, t)) });
    }
    if (req.method !== "POST") return json({ status: "error", code: "method" }, 405);
    if (!sameOrigin(req)) return json({ status: "error", code: "origin" }, 403);
    const body = await readJson(req, 4000);
    const id = String(body.id || "");
    const t = String(body.t || "");
    if (action === "cancel") return json({ status: "ok", ...(await svc.cancel(id, t)) });
    if (action === "reschedule") return json({ status: "ok", ...(await svc.reschedule(id, t, { date: String(body.date || ""), windowId: String(body.windowId || "") })) });
    return json({ status: "error", code: "not_found" }, 404);
  } catch (err) {
    return fail(err);
  }
};

export const config = {
  path: ["/api/booking", "/api/booking/:action"],
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
