// Google Calendar via a service account — plain fetch + node:crypto, no SDK.
//
// Setup (see docs/BOOKING.md):
//   1. Create a Google Cloud service account and enable the Calendar API.
//   2. Share the company calendar with the service account's email
//      ("Make changes to events").
//   3. Set GOOGLE_CALENDAR_ID and either GOOGLE_CALENDAR_CREDENTIALS (the key
//      JSON, raw or base64) or GOOGLE_SERVICE_ACCOUNT_EMAIL +
//      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.

import { createSign } from "node:crypto";
import { env } from "./config.mjs";

const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/calendar/v3";

export class CalendarError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = "CalendarError";
    this.status = status;
    this.code = code || "calendar_error";
  }
}

export function readCredentials() {
  const raw = env("GOOGLE_CALENDAR_CREDENTIALS");
  if (raw) {
    const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const json = JSON.parse(text);
    return { clientEmail: json.client_email, privateKey: json.private_key };
  }
  const clientEmail = env("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = env("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) return null;
  return { clientEmail, privateKey };
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");

export function signJwt({ clientEmail, privateKey }, nowSec = Math.floor(Date.now() / 1000)) {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: nowSec, exp: nowSec + 3600 }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  return `${header}.${claims}.${b64url(signer.sign(privateKey))}`;
}

export function createCalendarClient({ calendarId, credentials, fetchImpl = fetch } = {}) {
  calendarId ??= env("GOOGLE_CALENDAR_ID");
  credentials ??= readCredentials();
  if (!calendarId || !credentials) {
    throw new CalendarError("Google Calendar is not configured", { code: "calendar_unconfigured", status: 503 });
  }

  let token = null;
  let tokenExp = 0;

  async function accessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (token && tokenExp - 60 > now) return token;
    const res = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: signJwt(credentials, now),
      }),
    });
    if (!res.ok) throw new CalendarError(`Token exchange failed (${res.status})`, { status: 502, code: "calendar_auth" });
    const json = await res.json();
    token = json.access_token;
    tokenExp = now + (json.expires_in || 3600);
    return token;
  }

  async function call(method, path, { query, body } = {}) {
    const url = new URL(`${API}/calendars/${encodeURIComponent(calendarId)}${path}`);
    if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined) url.searchParams.set(k, String(v));
    const res = await fetchImpl(url, {
      method,
      headers: { authorization: `Bearer ${await accessToken()}`, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return null;
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new CalendarError(json?.error?.message || `Calendar API ${res.status}`, { status: res.status === 404 ? 404 : 502 });
    }
    return json;
  }

  return {
    kind: "google",
    async listEvents(timeMin, timeMax) {
      const items = [];
      let pageToken;
      do {
        const page = await call("GET", "/events", {
          query: {
            timeMin: new Date(timeMin).toISOString(),
            timeMax: new Date(timeMax).toISOString(),
            singleEvents: true,
            orderBy: "startTime",
            maxResults: 250,
            pageToken,
          },
        });
        items.push(...(page.items || []));
        pageToken = page.nextPageToken;
      } while (pageToken);
      return items;
    },
    getEvent: (id) => call("GET", `/events/${encodeURIComponent(id)}`),
    insertEvent: (event) => call("POST", "/events", { body: event }),
    patchEvent: (id, patch) => call("PATCH", `/events/${encodeURIComponent(id)}`, { body: patch }),
    deleteEvent: (id) => call("DELETE", `/events/${encodeURIComponent(id)}`),
  };
}

/**
 * In-memory calendar for local development only (MOCK_CALENDAR=1, never in
 * production). Responses are labelled mode:"demo" so the UI says so.
 */
export function createMockCalendar(seed = []) {
  const events = new Map(seed.map((e) => [e.id, e]));
  let n = 0;
  return {
    kind: "mock",
    async listEvents(timeMin, timeMax) {
      const a = new Date(timeMin).getTime();
      const b = new Date(timeMax).getTime();
      return [...events.values()].filter((e) => {
        const s = Date.parse(e.start.dateTime || e.start.date);
        const f = Date.parse(e.end.dateTime || e.end.date);
        return s < b && f > a;
      });
    },
    async getEvent(id) {
      const e = events.get(id);
      if (!e) throw new CalendarError("Not found", { status: 404 });
      return structuredClone(e);
    },
    async insertEvent(event) {
      const id = `mock${Date.now().toString(36)}${n++}`;
      const e = { ...structuredClone(event), id, status: "confirmed", created: new Date().toISOString() };
      events.set(id, e);
      return structuredClone(e);
    },
    async patchEvent(id, patch) {
      const e = events.get(id);
      if (!e) throw new CalendarError("Not found", { status: 404 });
      const next = { ...e, ...structuredClone(patch) };
      if (patch.extendedProperties) next.extendedProperties = { private: { ...e.extendedProperties?.private, ...patch.extendedProperties.private } };
      events.set(id, next);
      return structuredClone(next);
    },
    async deleteEvent(id) {
      events.delete(id);
      return null;
    },
  };
}
