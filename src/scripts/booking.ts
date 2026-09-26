// Booking / quote flow controller. No framework: the markup is server-
// rendered in BookingFlow.astro; this wires steps, validation, uploads,
// availability, submission and the confirmation screen.

import { track } from "./analytics";
import { toast } from "./toast";
import { initLoadViz } from "./loadviz";
import { formatLongDate } from "../../shared/time.js";
import { googleCalendarLink } from "../../shared/ics.js";

type Load = { id: string; label: string; short: string; yards: string; fraction: number; price: string; priceNote: string };
type Cfg = {
  mode: "book" | "quote";
  steps: string[];
  labels: Record<string, string>;
  loads: Load[];
  services: { id: string; label: string; hint: string }[];
  propertyTypes: { id: string; label: string }[];
  zipPrefixes: string[];
  maxPhotos: number;
  phone: string;
  tel: string;
};
type Photo = { id: string; url: string };
type State = { [k: string]: any; photos?: Photo[]; acceptedTerms?: boolean | string };
type Slot = { id: string; start: string; end: string; label: string; available: boolean };
type Day = { date: string; weekday: string; open: boolean; slots: Slot[] };

const FIELD_STEP: Record<string, string> = {
  service: "service", load: "load", address: "location", city: "location", zip: "location", propertyType: "location",
  description: "details", slot: "when", name: "contact", phone: "contact", email: "contact", acceptedTerms: "review",
};

const TEXT_FIELDS = ["address", "city", "zip", "description", "items", "demolitionDetails", "access", "special", "name", "phone", "email"];
const RADIO_FIELDS = ["service", "load", "propertyType", "stairs", "carry"];
const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const digits = (s: string) => (s || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
const fmtPhone = (s: string) => {
  const d = digits(s);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : s;
};
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initBooking(root: HTMLElement) {
  const cfg: Cfg = JSON.parse(root.dataset.config!);
  const isBook = cfg.mode === "book";
  const KEY = `stl-${cfg.mode}-v1`;
  const form = root.querySelector<HTMLFormElement>("[data-form]")!;
  const $ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = root) => el.querySelector<T>(sel);
  const $$ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = root) => [...el.querySelectorAll<T>(sel)];
  const stepEls = new Map<string, HTMLElement>(cfg.steps.map((s) => [s, $<HTMLElement>(`[data-step="${s}"]`)!]));
  const nextBtn = $<HTMLButtonElement>("[data-next]")!;
  const nextLabel = $("[data-next-label]")!;
  const spinner = $("[data-spinner]")!;
  const backBtn = $<HTMLButtonElement>("[data-back]")!;

  let idx = 0;
  let started = false;
  let done = false;
  let busy = false;
  const state: State = load();
  const pending = new Map<string, Promise<void>>();

  // ---------- persistence ----------
  function load(): State {
    let s: State = { stairs: "none", carry: "close", photos: [] };
    try {
      const raw = localStorage.getItem(KEY) || (cfg.mode === "quote" ? localStorage.getItem("stl-book-v1") : null);
      if (raw) s = { ...s, ...JSON.parse(raw) };
    } catch {}
    const q = new URLSearchParams(location.search);
    for (const k of ["service", "load", "zip", "date"]) {
      const v = q.get(k);
      if (v) s[k] = v.slice(0, 40);
    }
    if (s.load && !cfg.loads.some((l) => l.id === s.load) && !(s.load === "unsure" && !isBook)) delete s.load;
    if (s.service && !cfg.services.some((x) => x.id === s.service)) delete s.service;
    delete s.acceptedTerms;
    return s;
  }
  let saveT: number | undefined;
  function save() {
    clearTimeout(saveT);
    saveT = window.setTimeout(() => {
      try {
        const { acceptedTerms, ...rest } = state;
        localStorage.setItem(KEY, JSON.stringify(rest));
      } catch {}
    }, 200);
  }
  function clearSaved() {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem("stl-book-v1");
    } catch {}
  }

  // ---------- form <-> state ----------
  function hydrate() {
    for (const f of TEXT_FIELDS) {
      const el = form.elements.namedItem(f) as HTMLInputElement | null;
      if (el && state[f]) el.value = state[f];
    }
    for (const f of RADIO_FIELDS) {
      const el = form.querySelector<HTMLInputElement>(`input[name="${f}"][value="${CSS.escape(state[f] || "")}"]`);
      if (el) el.checked = true;
    }
    $$<HTMLElement>("[data-seg]").forEach(syncSeg);
    syncConditional();
    syncLoadViz(false);
    zipHint();
  }

  form.addEventListener("input", (e) => {
    const t = e.target as HTMLInputElement;
    if (!t.name || t.name === "website") return;
    if (t.type === "checkbox") state[t.name] = t.checked as any;
    else state[t.name] = t.value;
    if (!started) {
      started = true;
      track(isBook ? "booking_start" : "quote_start", { step: cfg.steps[idx] });
    }
    if (t.closest("[data-invalid]")) validateField(t.name);
    save();
  });
  form.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.type === "radio") {
      state[t.name] = t.value;
      const seg = t.closest<HTMLElement>("[data-seg]");
      if (seg) syncSeg(seg);
      if (t.name === "service") {
        syncConditional();
        track("service_select", { service: t.value, flow: cfg.mode });
        availability = null;
      }
      if (t.name === "load") {
        syncLoadViz(true);
        track("load_select", { load: t.value, flow: cfg.mode });
        availability = null;
      }
      clearError(t.name);
      updateSummary();
      save();
    }
    if (t.name === "zip") zipHint();
  });
  form.addEventListener("focusout", (e) => {
    const t = e.target as HTMLInputElement;
    if (!t.name || !TEXT_FIELDS.includes(t.name)) return;
    if (t.name === "phone" && t.value) {
      t.value = fmtPhone(t.value);
      state.phone = t.value;
    }
    if (t.value.trim()) validateField(t.name);
    updateSummary();
  });

  function syncSeg(seg: HTMLElement) {
    const inputs = $$<HTMLInputElement>("input", seg);
    const i = Math.max(0, inputs.findIndex((x) => x.checked));
    seg.style.setProperty("--seg-index", String(i));
  }
  function syncConditional() {
    $$<HTMLElement>("[data-show-if]").forEach((el) => {
      const [k, v] = el.dataset.showIf!.split("=");
      el.hidden = state[k] !== v;
    });
  }
  const vizEl = $<SVGSVGElement>('[data-step="load"] [data-loadviz]');
  const viz = vizEl ? initLoadViz(vizEl) : null;
  function syncLoadViz(animate: boolean) {
    const l = cfg.loads.find((x) => x.id === state.load);
    if (!viz) return;
    const f = l ? l.fraction : 0.02;
    if (animate) viz.set(f);
    else viz.set(f);
  }

  function zipHint() {
    const el = $("[data-zip-hint]");
    if (!el) return;
    const z = (state.zip || "").trim();
    el.textContent = /^\d{5}$/.test(z) && !cfg.zipPrefixes.some((p) => z.startsWith(p))
      ? `That ZIP is outside our usual area. You can still continue — we'll confirm we can get there.`
      : "";
  }

  // ---------- validation ----------
  const rules: Record<string, () => string | null> = {
    service: () => (state.service ? null : "Choose what you need done."),
    load: () => (state.load ? null : "Choose a load size."),
    address: () => (/\d/.test(state.address || "") && (state.address || "").trim().length >= 5 ? null : "Enter the street address, including the house number."),
    city: () => ((state.city || "").trim().length >= 2 ? null : "Enter the city."),
    zip: () => (/^\d{5}$/.test((state.zip || "").trim()) ? null : "Enter a 5-digit ZIP code."),
    propertyType: () => (state.propertyType ? null : "Choose a property type."),
    description: () => ((state.description || "").trim().length >= 3 ? null : "Tell us a little about what's going."),
    name: () => ((state.name || "").trim().length >= 2 ? null : "Enter your name."),
    phone: () => (digits(state.phone || "").length === 10 ? null : "Enter a 10-digit phone number."),
    email: () => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((state.email || "").trim()) ? null : "Enter an email address so we can confirm."),
    slot: () => (state.date && state.windowId ? null : "Choose a day and arrival window."),
    acceptedTerms: () => (!isBook || state.acceptedTerms === true || (state.acceptedTerms as any) === "true" ? null : "Please confirm you've read how pricing works."),
  };
  const STEP_FIELDS: Record<string, string[]> = {
    service: ["service"],
    load: ["load"],
    location: ["address", "city", "zip", "propertyType"],
    details: ["description"],
    photos: [],
    when: ["slot"],
    contact: ["name", "phone", "email"],
    review: ["acceptedTerms"],
  };

  function setError(field: string, msg: string | null) {
    const out = $(`[data-error="${field}"]`);
    if (out) out.textContent = msg || "";
    const input = form.elements.namedItem(field) as HTMLElement | RadioNodeList | null;
    const wrap = out?.closest(".field") || (input instanceof HTMLElement ? input.closest(".field") : null);
    if (wrap) wrap.toggleAttribute("data-invalid", Boolean(msg));
    if (input instanceof HTMLElement) {
      if (msg) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
    const group = $(`[data-field="${field}"]`);
    if (group) {
      if (msg) group.setAttribute("aria-invalid", "true");
      else group.removeAttribute("aria-invalid");
    }
  }
  const clearError = (f: string) => setError(f, null);
  function validateField(f: string) {
    const r = rules[f];
    if (!r) return true;
    const msg = r();
    setError(f, msg);
    return !msg;
  }
  function validateStep(step: string, focus = true) {
    const fields = STEP_FIELDS[step] || [];
    const bad = fields.filter((f) => !validateField(f));
    if (bad.length && focus) {
      const first = bad[0];
      const el = (form.querySelector(`[name="${first}"]:not([type=hidden])`) as HTMLElement) || $(`[data-field="${first}"] input`) || $(`[data-error="${first}"]`);
      el?.focus?.({ preventScroll: false });
      if (first === "slot") $("[data-days]")?.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
      track(isBook ? "booking_validation_error" : "quote_validation_error", { step, field: first });
    }
    return bad.length === 0;
  }

  // ---------- navigation ----------
  function show(i: number, dir: 1 | -1 = 1, push = true) {
    const name = cfg.steps[i];
    stepEls.forEach((el, s) => {
      const on = s === name;
      el.hidden = !on;
      el.classList.remove("is-entering", "back");
      if (on && !reduced()) {
        void el.offsetWidth;
        el.classList.add("is-entering");
        if (dir < 0) el.classList.add("back");
      }
    });
    idx = i;
    $("[data-actions]")!.hidden = false;
    root.style.setProperty("--p", String((i + 1) / cfg.steps.length));
    $("[data-progress-bar]")!.style.setProperty("--p", String((i + 1) / cfg.steps.length));
    $("[data-step-count]")!.textContent = `Step ${i + 1} of ${cfg.steps.length} · ${cfg.labels[name]}`;
    backBtn.hidden = i === 0;
    nextLabel.textContent = name === "review" ? (isBook ? "Confirm booking" : "Send quote request") : name === "photos" && !(state.photos || []).length ? "Continue without photos" : "Continue";
    $("[data-announce]")!.textContent = `Step ${i + 1} of ${cfg.steps.length}: ${cfg.labels[name]}`;
    if (push) history.pushState({ bkStep: i }, "", `?step=${name}`);
    const heading = stepEls.get(name)!.querySelector<HTMLElement>(".bk-title");
    heading?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
    if (name === "when") ensureAvailability();
    if (name === "review") renderReview();
    track(isBook ? "booking_step_view" : "quote_step_view", { step: name, index: i + 1 });
  }

  async function next() {
    if (busy) return;
    const name = cfg.steps[idx];
    if (!validateStep(name)) return;
    if (name === "review") return submit();
    track(isBook ? "booking_step_complete" : "quote_step_complete", { step: name });
    show(Math.min(idx + 1, cfg.steps.length - 1), 1);
  }
  function back() {
    if (idx > 0) history.back();
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    next();
  });
  backBtn.addEventListener("click", back);
  window.addEventListener("popstate", (e) => {
    if (done) return;
    const i = typeof e.state?.bkStep === "number" ? e.state.bkStep : 0;
    show(Math.max(0, Math.min(i, cfg.steps.length - 1)), i < idx ? -1 : 1, false);
  });

  // Tapping a tile on steps 1–2 advances automatically (pointer only, so
  // arrow-key users can browse options without being moved along).
  $$<HTMLElement>("[data-autoadvance]").forEach((label) => {
    label.addEventListener("click", (e) => {
      if ((e as MouseEvent).detail === 0) return;
      setTimeout(() => {
        const input = label.querySelector("input")!;
        if (input.checked && cfg.steps[idx] === input.closest<HTMLElement>("[data-step]")!.dataset.step) next();
      }, 280);
    });
  });

  // ---------- summary ----------
  function updateSummary() {
    const svc = cfg.services.find((s) => s.id === state.service);
    const ld = cfg.loads.find((l) => l.id === state.load);
    const set = (k: string, v: string) => {
      const el = $(`[data-sum="${k}"]`);
      if (el) el.textContent = v || "—";
    };
    set("service", svc?.label || "");
    set("load", ld ? `${ld.label} · ${ld.yards} yd³` : state.load === "unsure" ? "Not sure yet" : "");
    set("price", ld ? ld.price : state.load === "unsure" ? "From your photos" : "");
    set("location", [state.address, state.city].filter(Boolean).join(", "));
    set("when", state.date && state.windowLabel ? `${formatLongDate(state.date).replace(/^(\w{3})\w*/, "$1")} · ${state.windowLabel}` : "");
  }

  // ---------- photos ----------
  const thumbs = $("[data-thumbs]")!;
  const fileInput = $<HTMLInputElement>("[data-file-input]")!;
  const camInput = $<HTMLInputElement>("[data-camera-input]")!;
  const drop = $("[data-drop]")!;
  const countEl = $("[data-photo-count]")!;

  function photoCount() {
    return thumbs.querySelectorAll(".thumb").length;
  }
  function updatePhotoCount() {
    const n = (state.photos || []).length;
    countEl.textContent = n ? `${n} photo${n === 1 ? "" : "s"} added · up to ${cfg.maxPhotos}` : `Up to ${cfg.maxPhotos} photos.`;
    if (cfg.steps[idx] === "photos") nextLabel.textContent = n || pending.size ? "Continue" : "Continue without photos";
  }

  async function compress(file: File): Promise<Blob> {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
      const max = 1800;
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
      bmp.close?.();
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
      if (blob) return blob;
    } catch {
      /* e.g. HEIC in a browser that can't decode it — upload the original */
    }
    return file;
  }

  function addThumb(photo: Photo | null, file?: File) {
    const li = document.createElement("li");
    li.className = "thumb";
    li.dataset.state = photo ? "done" : "uploading";
    const src = photo ? photo.url : URL.createObjectURL(file!);
    li.innerHTML = `<img src="${esc(src)}" alt="Photo ${photoCount() + 1}" /><span class="thumb-status"><span class="spinner" style="width:12px;height:12px;border-width:1.5px"></span>Uploading</span><button type="button" class="thumb-remove" aria-label="Remove photo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></button>`;
    thumbs.appendChild(li);
    return li;
  }

  function wireRemove(li: HTMLElement, getId: () => string | null, ctrl?: AbortController) {
    li.querySelector(".thumb-remove")!.addEventListener("click", () => {
      ctrl?.abort();
      const id = getId();
      if (id) state.photos = (state.photos || []).filter((p) => p.id !== id);
      li.remove();
      save();
      updatePhotoCount();
      $<HTMLElement>(".up-error")?.remove();
    });
  }

  function uploadError(li: HTMLElement, file: File, msg?: string) {
    li.dataset.state = "error";
    const status = li.querySelector(".thumb-status")!;
    status.innerHTML = `<button type="button" class="thumb-retry">Retry</button>`;
    status.querySelector("button")!.addEventListener("click", () => {
      li.remove();
      startUpload(file);
    });
    let note = $<HTMLElement>(".up-error");
    if (!note) {
      note = document.createElement("p");
      note.className = "up-error";
      note.setAttribute("role", "alert");
      thumbs.after(note);
    }
    note.textContent = msg || "That photo didn't upload. Try again or continue without it.";
  }

  function startUpload(file: File) {
    const li = addThumb(null, file);
    const ctrl = new AbortController();
    let id: string | null = null;
    wireRemove(li, () => id, ctrl);
    const key = Math.random().toString(36).slice(2);
    const job = (async () => {
      try {
        const blob = await compress(file);
        if (blob.size > 5 * 1024 * 1024) throw Object.assign(new Error("too big"), { friendly: "That photo is too large. Try a smaller one, or continue without it." });
        const res = await fetch("/api/uploads", { method: "POST", body: blob, headers: { "content-type": blob.type || file.type || "image/jpeg" }, signal: ctrl.signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.status !== "ok") throw Object.assign(new Error("upload"), { friendly: res.status === 415 ? data.message : undefined });
        id = data.id;
        state.photos = [...(state.photos || []), { id: data.id, url: data.url }];
        li.dataset.state = "done";
        save();
        track("photo_upload", { result: "ok", flow: cfg.mode });
      } catch (err: any) {
        if (ctrl.signal.aborted) return;
        uploadError(li, file, err?.friendly);
        track("photo_upload", { result: "error", flow: cfg.mode });
      } finally {
        pending.delete(key);
        updatePhotoCount();
      }
    })();
    pending.set(key, job);
    updatePhotoCount();
  }

  function takeFiles(list: FileList | null) {
    if (!list) return;
    const files = [...list].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    const room = cfg.maxPhotos - photoCount();
    if (files.length > room) toast(room > 0 ? `Only ${room} more photo${room === 1 ? "" : "s"} fit — we added the first ${room}.` : `That's the ${cfg.maxPhotos}-photo limit.`);
    files.slice(0, Math.max(0, room)).forEach(startUpload);
  }
  fileInput.addEventListener("change", () => {
    takeFiles(fileInput.files);
    fileInput.value = "";
  });
  camInput.addEventListener("change", () => {
    takeFiles(camInput.files);
    camInput.value = "";
  });
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.setAttribute("data-over", ""); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, () => drop.removeAttribute("data-over")));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    takeFiles((e as DragEvent).dataTransfer?.files || null);
  });
  (state.photos || []).forEach((p) => {
    const li = addThumb(p);
    wireRemove(li, () => p.id);
  });

  // ---------- availability ----------
  let availability: { days: Day[]; mode: string } | null = null;
  let availabilityKey = "";
  const whenEls = {
    loading: $("[data-when-loading]"),
    error: $("[data-when-error]"),
    ready: $("[data-when-ready]"),
    days: $("[data-days]"),
    slotsWrap: $("[data-slots-wrap]"),
    slots: $("[data-slots]"),
    slotsLabel: $("[data-slots-label]"),
    empty: $("[data-days-empty]"),
    demo: $("[data-demo-banner]"),
  };
  function whenState(s: "loading" | "error" | "ready") {
    if (!whenEls.loading) return;
    whenEls.loading.hidden = s !== "loading";
    whenEls.error!.hidden = s !== "error";
    whenEls.ready!.hidden = s !== "ready";
    $("[data-actions]")!.hidden = s === "error";
  }
  async function ensureAvailability(force = false) {
    if (!isBook) return;
    const key = `${state.service}|${state.load}`;
    if (!force && availability && availabilityKey === key) return renderDays();
    whenState("loading");
    try {
      const res = await fetch(`/api/availability?service=${encodeURIComponent(state.service || "junk")}&load=${encodeURIComponent(state.load || "half")}`, { headers: { accept: "application/json" } });
      const data = await res.json();
      if (data.status !== "ok") throw new Error(data.code || "unavailable");
      availability = { days: data.days, mode: data.mode };
      availabilityKey = key;
      whenEls.demo!.hidden = data.mode !== "demo";
      whenState("ready");
      renderDays();
    } catch (e: any) {
      whenState("error");
      track("booking_error", { code: `availability_${e?.message || "network"}` });
    }
  }
  $("[data-retry-when]")?.addEventListener("click", () => ensureAvailability(true));
  $("[data-switch-quote]")?.addEventListener("click", () => {
    try {
      const { acceptedTerms, date, windowId, windowLabel, ...rest } = state;
      localStorage.setItem("stl-quote-v1", JSON.stringify(rest));
    } catch {}
    track("booking_switch_to_quote", { step: cfg.steps[idx] });
    location.href = "/quote/?step=contact";
  });

  function dayParts(date: string) {
    const [y, m, d] = date.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12));
    return {
      wd: dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      num: String(d),
      mo: dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    };
  }

  function renderDays() {
    if (!availability) return;
    const days = availability.days.filter((d) => d.open && d.slots.length);
    const anyOpen = days.some((d) => d.slots.some((s) => s.available));
    whenEls.empty!.hidden = anyOpen;
    whenEls.days!.innerHTML = days
      .map((d) => {
        const p = dayParts(d.date);
        const open = d.slots.some((s) => s.available);
        return `<button type="button" role="radio" class="day" data-date="${d.date}" aria-checked="${state.date === d.date}" ${open ? "" : "disabled"} aria-label="${esc(formatLongDate(d.date))}${open ? "" : ", fully booked"}" tabindex="-1"><span class="d-wd">${p.wd}</span><span class="d-num">${p.num}</span><span class="d-mo">${open ? p.mo : "Full"}</span></button>`;
      })
      .join("");
    // Keep a restored selection only if it's still open.
    const chosen = days.find((d) => d.date === state.date);
    const slotOk = chosen?.slots.find((s) => s.id === state.windowId && s.available);
    if (state.date && !chosen?.slots.some((s) => s.available)) {
      delete state.date;
      delete state.windowId;
      delete state.windowLabel;
    } else if (state.windowId && !slotOk) {
      delete state.windowId;
      delete state.windowLabel;
    }
    rovingDays();
    if (state.date) renderSlots(state.date, false);
    else whenEls.slotsWrap!.hidden = true;
    updateSummary();
  }

  function rovingDays() {
    const btns = $$<HTMLButtonElement>(".day:not(:disabled)", whenEls.days!);
    const current = btns.find((b) => b.dataset.date === state.date) || btns[0];
    if (current) current.tabIndex = 0;
  }

  whenEls.days?.addEventListener("click", (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>(".day");
    if (!b || b.disabled) return;
    selectDay(b.dataset.date!);
  });
  whenEls.days?.addEventListener("keydown", (e) => {
    const btns = $$<HTMLButtonElement>(".day:not(:disabled)", whenEls.days!);
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    let n = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = Math.min(btns.length - 1, i + 1);
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = Math.max(0, i - 1);
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = btns.length - 1;
    if (n >= 0) {
      e.preventDefault();
      btns.forEach((b) => (b.tabIndex = -1));
      btns[n].tabIndex = 0;
      btns[n].focus();
      selectDay(btns[n].dataset.date!);
    }
  });

  function selectDay(date: string) {
    if (state.date !== date) {
      delete state.windowId;
      delete state.windowLabel;
    }
    state.date = date;
    $$<HTMLButtonElement>(".day", whenEls.days!).forEach((b) => {
      const on = b.dataset.date === date;
      b.setAttribute("aria-checked", String(on));
      if (!b.disabled) b.tabIndex = on ? 0 : -1;
    });
    track("calendar_date_select", { days_out: Math.round((Date.parse(date) - Date.now()) / 86_400_000) });
    renderSlots(date, true);
    save();
    updateSummary();
  }

  function renderSlots(date: string, scroll: boolean) {
    const day = availability?.days.find((d) => d.date === date);
    if (!day) return;
    whenEls.slotsLabel!.textContent = `${formatLongDate(date)} — arrival windows`;
    whenEls.slots!.innerHTML = day.slots
      .map((s) => `<button type="button" role="radio" class="slot" data-window="${s.id}" data-label="${esc(s.label)}" aria-checked="${state.windowId === s.id}" ${s.available ? "" : "disabled"}><span class="s-time">${esc(s.label)}</span><span class="s-sub">${s.available ? "Arrival window" : ({ notice: "Too soon", closing: "Too long a job", booked: "Booked" } as Record<string, string>)[(s as any).reason] || "Unavailable"}</span></button>`)
      .join("");
    whenEls.slotsWrap!.hidden = false;
    if (scroll && matchMedia("(max-width: 859px)").matches) whenEls.slotsWrap!.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
  }
  whenEls.slots?.addEventListener("click", (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>(".slot");
    if (!b || b.disabled) return;
    state.windowId = b.dataset.window!;
    state.windowLabel = b.dataset.label!;
    $$<HTMLButtonElement>(".slot", whenEls.slots!).forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    clearError("slot");
    track("calendar_slot_select", { window: state.windowId });
    save();
    updateSummary();
  });

  // ---------- review ----------
  function renderReview() {
    const svc = cfg.services.find((s) => s.id === state.service);
    const ld = cfg.loads.find((l) => l.id === state.load);
    const prop = cfg.propertyTypes.find((p) => p.id === state.propertyType);
    const stairs = ({ none: "no stairs", some: "a flight of stairs", many: "several flights" } as Record<string, string>)[state.stairs || "none"];
    const carry = ({ close: "close to the truck", medium: "~50 ft carry", far: "100 ft+ carry" } as Record<string, string>)[state.carry || "close"];
    const n = (state.photos || []).length;
    const rows: [string, string, string, string?][] = [
      ["Service", svc?.label || "—", "service"],
      ["Load", ld ? `${ld.label} · ${ld.yards} yd³` : "Not sure — size it from photos", "load"],
      ["Where", `${state.address || ""}, ${state.city || ""} ${state.zip || ""}${prop ? ` · ${prop.label}` : ""}`, "location"],
      ["Details", `${(state.description || "").slice(0, 140)}${(state.description || "").length > 140 ? "…" : ""} · ${stairs}, ${carry}`, "details"],
      ["Photos", n ? `${n} photo${n === 1 ? "" : "s"}` : "None", "photos"],
    ];
    if (isBook) rows.push(["When", state.date ? `${formatLongDate(state.date)}, ${state.windowLabel} (arrival window)` : "—", "when"]);
    rows.push(["Contact", `${state.name || ""} · ${fmtPhone(state.phone || "")} · ${state.email || ""}`, "contact"]);
    const price = ld ? `<div class="rv-row rv-price"><dt>${isBook ? "Price" : "Estimate"}</dt><dd>${esc(ld.price)}<span class="rv-note">${ld.price.startsWith("Priced") ? "Confirmed with you before we load" : `${esc(ld.priceNote)} · confirmed on-site`}</span></dd><span></span></div>` : "";
    $("[data-review]")!.innerHTML =
      rows.map(([k, v, step]) => `<div class="rv-row"><dt>${k}</dt><dd>${esc(v)}</dd><button type="button" class="rv-edit" data-goto="${step}" aria-label="Edit ${k.toLowerCase()}">Edit</button></div>`).join("") + price;
  }
  root.addEventListener("click", (e) => {
    const g = (e.target as Element).closest<HTMLElement>("[data-goto]");
    if (!g) return;
    const i = cfg.steps.indexOf(g.dataset.goto!);
    if (i >= 0) show(i, -1);
  });

  // ---------- submit ----------
  function setBusy(on: boolean, label?: string) {
    busy = on;
    nextBtn.disabled = on;
    spinner.hidden = !on;
    if (label) nextLabel.textContent = label;
  }
  function submitError(html: string) {
    const el = $("[data-submit-error]")!;
    el.innerHTML = html;
    el.hidden = false;
    el.setAttribute("role", "alert");
    el.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
  }

  async function waitForUploads() {
    if (!pending.size) return;
    setBusy(true, "Finishing photo uploads…");
    await Promise.allSettled([...pending.values()]);
  }

  async function submit() {
    $("[data-submit-error]")!.hidden = true;
    for (const s of cfg.steps) {
      if (!validateStep(s, false)) {
        show(cfg.steps.indexOf(s), -1);
        setTimeout(() => validateStep(s), 50);
        return;
      }
    }
    await waitForUploads();
    const honeypot = (form.elements.namedItem("website") as HTMLInputElement).value;
    track(isBook ? "booking_submit" : "quote_submit", { service: state.service, load: state.load });
    if (isBook) return submitBooking(honeypot);
    return submitQuote(honeypot);
  }

  async function submitBooking(honeypot: string) {
    setBusy(true, "Booking…");
    const payload = {
      service: state.service, load: state.load, address: state.address, city: state.city, zip: state.zip,
      propertyType: state.propertyType, description: state.description, items: state.items, demolitionDetails: state.demolitionDetails,
      access: state.access, stairs: state.stairs, carry: state.carry, special: state.special,
      name: state.name, phone: state.phone, email: state.email, date: state.date, windowId: state.windowId,
      photos: (state.photos || []).map((p) => p.id), acceptedTerms: rules.acceptedTerms() === null, website: honeypot,
    };
    let res: Response;
    let data: any = {};
    try {
      res = await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
      data = await res.json().catch(() => ({}));
    } catch {
      setBusy(false, "Confirm booking");
      track("booking_error", { code: "network" });
      return submitError(`<b>We couldn't reach our booking system.</b> Check your connection and try again — or call <a class="link" href="${cfg.tel}">${cfg.phone}</a>.`);
    }
    setBusy(false, "Confirm booking");

    if (res.status === 201 && data.status === "ok") {
      done = true;
      clearSaved();
      track("booking_complete", { service: state.service, load: state.load, mode: data.mode });
      return renderBooked(data);
    }
    track("booking_error", { code: data.code || `http_${res.status}` });
    if (data.code === "slot_taken") {
      availability = null;
      const alts: any[] = data.alternatives || [];
      submitError(
        `<b>That time was just booked.</b> ${alts.length ? "Here are the next available options:" : `Pick another time, or call <a class="link" href="${cfg.tel}">${cfg.phone}</a>.`}` +
          (alts.length ? `<div class="alts">${alts.map((a) => `<button type="button" class="slot" data-alt-date="${a.date}" data-alt-window="${a.windowId}" data-alt-label="${esc(a.label)}"><span class="s-time">${esc(a.dateLabel)}</span><span class="s-sub">${esc(a.label)} arrival</span></button>`).join("")}</div>` : `<div class="alts"><button type="button" class="btn btn--ghost btn--sm" data-goto="when">Choose another time</button></div>`),
      );
      return;
    }
    if (res.status === 422 && data.fields) {
      const first = Object.keys(data.fields)[0];
      const step = FIELD_STEP[first] || "review";
      show(cfg.steps.indexOf(step), -1);
      setTimeout(() => Object.entries(data.fields).forEach(([f, m]) => setError(f, String(m))), 60);
      toast(data.message || "Some details need fixing.", { tone: "error" });
      return;
    }
    if (res.status === 503 || data.status === "unavailable") {
      return submitError(`<b>Online booking isn't available right now.</b> Call <a class="link" href="${cfg.tel}">${cfg.phone}</a> and we'll get you scheduled, or <button type="button" class="link" data-switch-quote-2>send this as a quote request</button>.`);
    }
    if (res.status === 429) return submitError(`<b>Too many tries in a short time.</b> Wait a minute and try again, or call <a class="link" href="${cfg.tel}">${cfg.phone}</a>.`);
    submitError(`<b>Something went wrong on our end.</b> Your booking was not made. Try again, or call <a class="link" href="${cfg.tel}">${cfg.phone}</a>.`);
  }

  root.addEventListener("click", (e) => {
    const alt = (e.target as Element).closest<HTMLElement>("[data-alt-date]");
    if (alt) {
      state.date = alt.dataset.altDate!;
      state.windowId = alt.dataset.altWindow!;
      state.windowLabel = alt.dataset.altLabel!;
      save();
      updateSummary();
      renderReview();
      $("[data-submit-error]")!.hidden = true;
      toast(`Switched to ${formatLongDate(state.date)}, ${state.windowLabel}. Confirm when ready.`);
      nextBtn.focus();
    }
    if ((e.target as Element).closest("[data-switch-quote-2]")) {
      const btn = $<HTMLButtonElement>("[data-switch-quote]");
      if (btn) btn.click();
      else location.href = "/quote/";
    }
  });

  async function submitQuote(honeypot: string) {
    setBusy(true, "Sending…");
    const svc = cfg.services.find((s) => s.id === state.service);
    const ld = cfg.loads.find((l) => l.id === state.load);
    const body = new URLSearchParams({
      "form-name": "quote",
      "bot-field": honeypot,
      service: svc?.label || "",
      load: ld ? `${ld.label} (${ld.yards} yd³)` : "Not sure",
      address: state.address || "", city: state.city || "", zip: state.zip || "",
      propertyType: cfg.propertyTypes.find((p) => p.id === state.propertyType)?.label || "",
      description: state.description || "", items: state.items || "", demolitionDetails: state.demolitionDetails || "",
      stairs: state.stairs || "", carry: state.carry || "", access: state.access || "", special: state.special || "",
      name: state.name || "", phone: fmtPhone(state.phone || ""), email: state.email || "",
      photos: (state.photos || []).map((p) => new URL(p.url, location.origin).toString()).join("\n"),
    });
    try {
      const res = await fetch("/", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
      if (!res.ok) throw new Error(String(res.status));
      done = true;
      clearSaved();
      track("quote_complete", { service: state.service, load: state.load });
      renderQuoted();
    } catch (e: any) {
      setBusy(false, "Send quote request");
      track("quote_error", { code: e?.message || "network" });
      submitError(`<b>We couldn't send that.</b> Try again, or call <a class="link" href="${cfg.tel}">${cfg.phone}</a> — your details are saved on this device.`);
    }
  }

  // ---------- results ----------
  function finish(title: string, html: string, demo = false) {
    $<HTMLElement>(".bk-layout")!.hidden = true;
    $<HTMLElement>(".bk-top")!.hidden = true;
    const d = $("[data-done]")!;
    $("[data-done-title]")!.textContent = title;
    $("[data-done-body]")!.innerHTML = html;
    $("[data-done-demo]")!.hidden = !demo;
    d.hidden = false;
    history.replaceState({ bkDone: true }, "", location.pathname);
    window.scrollTo({ top: 0 });
    d.focus();
  }

  function renderBooked(data: any) {
    const b = data.booking;
    const n = data.notifications || {};
    const ics = new Blob([b.ics], { type: "text/calendar" });
    const icsUrl = URL.createObjectURL(ics);
    const gcal = googleCalendarLink({ start: b.windowStart, end: b.windowEnd, title: `STL Demolition & Junk Removal — ${b.loadLabel} ${b.serviceLabel.toLowerCase()}`, description: `Arrival window ${b.windowLabel}. Booking ${b.id}. Manage: ${b.manageUrl}`, location: `${b.address}, ${b.city}, MO ${b.zip}` });
    const emailLine = n.customerEmail
      ? `<p>We sent a confirmation to <b>${esc(b.customer.email)}</b>.</p>`
      : `<p><b>Save this link</b> — it's how you reschedule or cancel. Email confirmations aren't switched on yet.</p><div class="copy-row"><input class="input" readonly value="${esc(b.manageUrl)}" aria-label="Your booking link" /><button type="button" class="btn btn--sm" data-copy>Copy</button></div>`;
    finish(
      "You're on the schedule.",
      `<div class="done-card">
        <p class="done-when">${esc(b.dateLabel)}</p>
        <p class="done-window">${esc(b.windowLabel)} <span class="small muted">arrival window</span></p>
        <p class="done-job">${esc(b.loadLabel)} · ${esc(b.serviceLabel)} · ${esc(b.id)}</p>
        <dl class="done-list">
          <div><dt>Address</dt><dd>${esc(b.address)}, ${esc(b.city)} ${esc(b.zip)}</dd></div>
          <div><dt>Price</dt><dd>${esc(b.priceLabel)} <span class="muted small">· ${b.priceLabel.startsWith("Priced") ? "confirmed with you before we load" : `${esc(b.priceNote)}, confirmed on-site`}</span></dd></div>
          <div><dt>Name</dt><dd>${esc(b.customer.name)}</dd></div>
          <div><dt>Phone</dt><dd>${esc(b.customer.phone)}</dd></div>
          <div><dt>Email</dt><dd>${esc(b.customer.email)}</dd></div>
        </dl>
      </div>
      ${emailLine}
      <div class="done-actions">
        <a class="btn btn--green wide" href="${icsUrl}" download="stl-booking-${esc(b.id)}.ics" data-track="add_to_calendar" data-track-cta="ics">Add to calendar</a>
        <a class="btn btn--ghost" href="${esc(gcal)}" target="_blank" rel="noopener" data-track="add_to_calendar" data-track-cta="google">Google Calendar</a>
        <a class="btn btn--ghost" href="${cfg.tel}" data-track="phone_click" data-track-location="confirmation">Call us</a>
        <a class="btn btn--ghost" href="${esc(b.manageUrl)}">Reschedule</a>
        <a class="btn btn--ghost" href="${esc(b.manageUrl)}#cancel">Cancel</a>
      </div>
      <h2 class="h4">What happens next</h2>
      <ol class="next-steps">
        <li><span>The crew arrives during your window. You don't need to be home — just make sure we can get to everything.</span></li>
        <li><span>We look at everything and confirm the price with you — in person or by phone — before we load.</span></li>
        <li><span>We load, haul, and sweep up. Plans change? Use the reschedule or cancel link above.</span></li>
      </ol>`,
      data.mode === "demo",
    );
    $("[data-copy]")?.addEventListener("click", async (e) => {
      const input = $<HTMLInputElement>(".copy-row input")!;
      try {
        await navigator.clipboard.writeText(input.value);
        (e.target as HTMLElement).textContent = "Copied";
      } catch {
        input.select();
      }
    });
  }

  function renderQuoted() {
    finish(
      "Got it. We'll be in touch.",
      `<p class="lede">We'll look over your details${(state.photos || []).length ? " and photos" : ""} and get back to you with a price at <b>${esc(fmtPhone(state.phone || ""))}</b> or <b>${esc(state.email || "")}</b>.</p>
       <div class="done-actions">
         <a class="btn btn--green" href="/book/">Book a time instead</a>
         <a class="btn btn--ghost" href="${cfg.tel}" data-track="phone_click" data-track-location="quote-confirmation">Call ${cfg.phone}</a>
       </div>`,
    );
  }

  // ---------- abandonment ----------
  addEventListener("pagehide", () => {
    if (started && !done) track(isBook ? "booking_abandon" : "quote_abandon", { step: cfg.steps[idx] });
  });

  // ---------- boot ----------
  hydrate();
  updateSummary();
  updatePhotoCount();
  const q = new URLSearchParams(location.search);
  const want = q.get("step");
  // Only allow deep-linking forward to steps whose earlier steps are valid.
  let startAt = 0;
  if (want && cfg.steps.includes(want)) {
    for (let i = 0; i < cfg.steps.indexOf(want); i++) {
      if (!(STEP_FIELDS[cfg.steps[i]] || []).every((f) => !rules[f] || rules[f]() === null)) break;
      startAt = i + 1;
    }
  } else if (state.service && (q.get("service") || q.get("load"))) {
    startAt = state.load ? Math.min(2, cfg.steps.length - 1) : 1;
  }
  history.replaceState({ bkStep: startAt }, "", location.pathname + (startAt ? `?step=${cfg.steps[startAt]}` : ""));
  show(startAt, 1, false);
  // Don't steal focus on first paint.
  (document.activeElement as HTMLElement)?.blur?.();
}
