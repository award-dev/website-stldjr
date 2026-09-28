// POST /api/crm-notify {kind, id, t} — after the browser books, moves or
// cancels in the CRM, send the site's confirmation emails. See server/lib/crm.mjs.
import booking from "../../config/booking.json" with { type: "json" };
import { getBusiness, siteUrl } from "../../server/lib/config.mjs";
import { createCrmNotify } from "../../server/lib/crm.mjs";
import { createNotifier } from "../../server/lib/notify.mjs";
import { openStore } from "../../server/lib/store.mjs";
import { json, fail, readJson, sameOrigin } from "../../server/lib/http.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ status: "error", code: "method" }, 405, { allow: "POST" });
  if (!sameOrigin(req)) return json({ status: "error", code: "origin" }, 403);
  const apiBase = booking.crm?.apiBase;
  if (!apiBase) return json({ status: "unavailable", code: "crm_off" }, 404);
  try {
    const body = await readJson(req, 2000);
    const business = getBusiness();
    const svc = createCrmNotify({
      apiBase,
      store: await openStore("crm-notify"),
      notifier: createNotifier({ business }),
      business,
      origin: siteUrl(req),
    });
    return json({ status: "ok", ...(await svc.notify({ kind: String(body.kind || ""), id: String(body.id || ""), t: String(body.t || "") })) });
  } catch (err) {
    return fail(err);
  }
};

export const config = {
  path: "/api/crm-notify",
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
