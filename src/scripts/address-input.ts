// Street-address field with a suggestion dropdown (ARIA combobox). Ported
// from the General Contracting CRM's AddressInput. Picking a suggestion fills
// street, city and ZIP. It's still a plain text field — anything the
// geocoder doesn't know is typed in by hand as before.

type Suggestion = {
  id: string;
  label: string;
  secondary: string;
  source: "osm" | "google";
  placeId?: string;
  addressLine1: string;
  city?: string;
  state?: string;
  postalCode?: string;
};
type Parts = { addressLine1: string; city?: string; state?: string; postalCode?: string };

const DEBOUNCE_MS = 220;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function initAddressInput(input: HTMLInputElement, fields: { city?: HTMLInputElement | null; zip?: HTMLInputElement | null }) {
  const wrap = input.closest<HTMLElement>("[data-addr]")!;
  const list = wrap.querySelector<HTMLUListElement>("[data-addr-list]")!;
  const credit = wrap.querySelector<HTMLElement>("[data-addr-credit]")!;
  const panel = wrap.querySelector<HTMLElement>("[data-addr-panel]")!;
  let suggestions: Suggestion[] = [];
  let active = -1;
  let timer: number | undefined;
  let ctrl: AbortController | null = null;
  let session: string | null = null;

  const setOpen = (open: boolean) => {
    const show = open && suggestions.length > 0;
    panel.hidden = !show;
    input.setAttribute("aria-expanded", String(show));
    if (!show) input.removeAttribute("aria-activedescendant");
  };

  const render = (provider: string) => {
    list.innerHTML = suggestions
      .map((s, i) => `<li role="option" id="${list.id}-${i}" class="addr-opt" aria-selected="${i === active}" data-i="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></svg><span><span class="addr-main">${esc(s.label)}</span>${s.secondary ? `<span class="addr-sub">${esc(s.secondary)}</span>` : ""}</span></li>`)
      .join("");
    // Attribution is a condition of using either provider.
    credit.textContent = provider === "google" ? "Powered by Google" : "© OpenStreetMap contributors";
  };

  const highlight = (i: number) => {
    active = i;
    list.querySelectorAll<HTMLElement>(".addr-opt").forEach((el, j) => el.setAttribute("aria-selected", String(j === i)));
    if (i >= 0) {
      input.setAttribute("aria-activedescendant", `${list.id}-${i}`);
      list.children[i]?.scrollIntoView({ block: "nearest" });
    }
  };

  const fill = (el: HTMLInputElement | null | undefined, value: string | undefined) => {
    if (!el || !value) return;
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const apply = (p: Parts) => {
    fill(input, p.addressLine1);
    fill(fields.city, p.city);
    fill(fields.zip, p.postalCode?.slice(0, 5));
    window.stlTrack?.("address_suggestion_pick");
  };

  async function choose(s: Suggestion) {
    clearTimeout(timer);
    ctrl?.abort();
    suggestions = [];
    setOpen(false);
    if (s.placeId) {
      fill(input, s.label);
      try {
        const res = await fetch(`/api/address?place=${encodeURIComponent(s.placeId)}&session=${session ?? ""}`);
        const body = await res.json();
        if (body.address) apply(body.address);
      } catch {
        /* the street is already in the field; the rest can be typed */
      }
    } else {
      apply(s);
    }
    session = null;
  }

  input.addEventListener("input", (e) => {
    if (!(e as InputEvent).isTrusted) return; // our own fill, not typing
    clearTimeout(timer);
    ctrl?.abort();
    const q = input.value.trim();
    if (q.length < 4) {
      suggestions = [];
      setOpen(false);
      return;
    }
    timer = window.setTimeout(async () => {
      session ??= crypto.randomUUID?.() ?? String(Date.now());
      ctrl = new AbortController();
      input.setAttribute("aria-busy", "true");
      try {
        const res = await fetch(`/api/address?q=${encodeURIComponent(q)}&session=${session}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const body = await res.json();
        suggestions = body.suggestions ?? [];
        active = -1;
        render(body.provider);
        setOpen(document.activeElement === input);
      } catch {
        /* aborted by the next keystroke, or offline — still a plain input */
      } finally {
        input.removeAttribute("aria-busy");
      }
    }, DEBOUNCE_MS);
  });

  input.addEventListener("keydown", (e) => {
    if (panel.hidden) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlight((active + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlight(active <= 0 ? suggestions.length - 1 : active - 1);
    } else if (e.key === "Enter" && active >= 0) {
      // Only swallow Enter when a row is highlighted; otherwise it continues the form.
      e.preventDefault();
      e.stopPropagation();
      choose(suggestions[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  });
  input.addEventListener("focus", () => setOpen(suggestions.length > 0));
  input.addEventListener("blur", () => setTimeout(() => setOpen(false), 150));

  list.addEventListener("mousedown", (e) => e.preventDefault()); // keep focus in the field
  list.addEventListener("mousemove", (e) => {
    const li = (e.target as Element).closest<HTMLElement>(".addr-opt");
    if (li && Number(li.dataset.i) !== active) highlight(Number(li.dataset.i));
  });
  list.addEventListener("click", (e) => {
    const li = (e.target as Element).closest<HTMLElement>(".addr-opt");
    if (li) choose(suggestions[Number(li.dataset.i)]);
  });
}
