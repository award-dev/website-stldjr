// GET /api/status — which integrations are connected (booleans only, no secrets).
import { integrationStatus } from "../../server/lib/config.mjs";
import { calendarMode } from "../../server/lib/runtime.mjs";
import { json } from "../../server/lib/http.mjs";

export default async () => json({ status: "ok", calendar: calendarMode(), integrations: integrationStatus() });

export const config = { path: "/api/status" };
