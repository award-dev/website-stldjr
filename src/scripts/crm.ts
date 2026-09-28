// Where the booking API lives. <html data-booking-api> is set from
// config/booking.json → crm.apiBase; without it the site's own /api is used.
// The CRM answers the same routes in the same shapes (see server/lib/crm.mjs).

const crmBase = () => document.documentElement.dataset.bookingApi || "";

export const usingCrm = () => Boolean(crmBase());

/** "/availability?summary=1" → the CRM's or the site's own endpoint. */
export const bookingApi = (path: string) => (crmBase() || "/api") + path;

/** The CRM's manage link points at its own page; customers keep ours. */
export function localManageUrl(url: string) {
  try {
    const u = new URL(url, location.origin);
    const id = u.searchParams.get("id");
    const t = u.searchParams.get("t");
    return id && t ? `${location.origin}/booking/?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}` : url;
  } catch {
    return url;
  }
}

/** Ask the site to send its emails for a booking the CRM just changed. */
export async function notifyBooking(kind: "confirmed" | "rescheduled" | "cancelled", id: string, t: string, timeoutMs = 8000) {
  if (!usingCrm()) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch("/api/crm-notify", { method: "POST", keepalive: true, signal: ctrl.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, id, t }) });
    return await res.json().catch(() => null);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
