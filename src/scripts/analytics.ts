// Analytics event bus. Events go to window.dataLayer always, and to Plausible
// or GA4 only if configured (config/business.json → analytics). No personal
// data: keys that look like PII are dropped before anything leaves the page.

type Props = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    plausible?: (event: string, opts?: { props?: Props }) => void;
    gtag?: (...args: unknown[]) => void;
    stlTrack?: typeof track;
  }
}

const PII = /(e-?mail|phone|name|address|street|zip|note|description)/i;

export function track(event: string, props: Props = {}) {
  const clean: Props = {};
  for (const [k, v] of Object.entries(props)) if (!PII.test(k) && v !== undefined) clean[k] = v;
  (window.dataLayer ||= []).push({ event, ...clean });
  try {
    window.plausible?.(event, { props: clean });
    window.gtag?.("event", event, clean);
  } catch {
    /* never let analytics break the page */
  }
  if (import.meta.env.DEV) console.debug("[track]", event, clean);
}

export function initAutoTracking() {
  window.stlTrack = track;
  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track], a[href^='tel:']");
      if (!el) return;
      const name = el.dataset.track || "phone_click";
      track(name, { cta: el.dataset.trackCta, location: el.dataset.trackLocation || location.pathname });
    },
    { capture: true },
  );
}
