import { useEffect, useRef, useState } from 'react';

/**
 * Five-second intro, shown once per visit (sessionStorage).
 *
 * The timeline (logo, headline, blueprint drawing, progress bar, curtain lift) is CSS-driven from the
 * first paint, so it plays on time even before React hydrates. React layers on the live percentage and
 * stage label (synced to the bar's own animation clock), Skip / Escape, the once-per-visit memory
 * and cleanup. Scrolling is locked in CSS only while the intro is unseen, so any exit path unlocks it. CSS keeps it hidden when JavaScript is off or the intro was already seen.
 */
const BUILD = 4.25; // seconds until 100%; the curtain lift takes the rest of the 5 s
const KEY = 'intro-seen';

const DEFAULT_STAGES: [number, string][] = [
  [0, 'Laying the foundation'],
  [0.24, 'Framing the walls'],
  [0.48, 'Setting the tile'],
  [0.72, 'Hanging the doors and trim'],
  [0.97, 'Final walkthrough'],
];

// Blueprint drawing: each line draws inside its own slice of the build time.
const PLAN: { d: string; from: number; to: number; accent?: boolean; dim?: boolean }[] = [
  { d: 'M12 196 H388', from: 0, to: 0.14 },
  { d: 'M64 196 V104', from: 0.08, to: 0.24 },
  { d: 'M336 196 V104', from: 0.1, to: 0.26 },
  { d: 'M40 116 L200 22 L360 116', from: 0.22, to: 0.46, accent: true },
  { d: 'M74 110 L200 36 L326 110', from: 0.3, to: 0.5 },
  { d: 'M272 62 V36 H298 V78', from: 0.44, to: 0.56 },
  { d: 'M180 196 V140 H220 V196', from: 0.5, to: 0.64, accent: true },
  { d: 'M96 128 H144 V168 H96 Z M120 128 V168 M96 148 H144', from: 0.6, to: 0.76 },
  { d: 'M256 128 H304 V168 H256 Z M280 128 V168 M256 148 H304', from: 0.66, to: 0.82 },
  { d: 'M64 212 H336 M64 206 V218 M336 206 V218', from: 0.78, to: 0.94, dim: true },
  { d: 'M352 104 V196 M346 104 H358 M346 196 H358', from: 0.82, to: 0.98, dim: true },
];

const DEFAULT_WORDS = ['Building', 'your', 'next', 'project'];
const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** Read the bar's live scaleX so the percentage always matches what is drawn. */
const barScale = (el: HTMLElement | null) => {
  if (!el) return 0;
  const m = getComputedStyle(el).transform.match(/^matrix\(([^,]+)/);
  return m ? clamp(Number(m[1])) : 0;
};

export default function Intro({ logo, words = DEFAULT_WORDS, stages = DEFAULT_STAGES, drawing = 'house' }: { logo: string; words?: string[]; stages?: [number, string][]; drawing?: 'house' | 'none' }) {
  const [active, setActive] = useState(true);
  const [skipped, setSkipped] = useState(false);
  const [p, setP] = useState(0);
  const [fill, setFill] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === '1'; } catch { /* storage blocked: treat as unseen */ }
    const html = document.documentElement;
    if (seen) { setActive(false); return; }

    const done = () => {
      try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
      html.classList.add('intro-seen'); // also releases the CSS scroll lock
      setActive(false);
    };

    const el = root.current;
    // Skip may have been pressed before hydration (an inline handler adds .is-skipped), so honor either lift.
    if (el?.classList.contains('is-skipped')) setSkipped(true);
    const lifted = el?.getAnimations().some((a) => ['intro-lift', 'intro-lift-now'].includes((a as CSSAnimation).animationName) && a.playState === 'finished');
    if (lifted) { done(); return; }

    const onEnd = (e: AnimationEvent) => {
      if (e.target === el && (e.animationName === 'intro-lift' || e.animationName === 'intro-lift-now')) done();
    };
    el?.addEventListener('animationend', onEnd);

    // Percentage and stage follow the bar's own CSS animation clock, so they line up even if React loaded late.
    // With reduced motion the bar animation is collapsed to ~0 ms, so fall back to the document clock.
    const barAnim = bar.current?.getAnimations()[0];
    const barRuns = Number(barAnim?.effect?.getComputedTiming().duration ?? 0) > 1000;
    let raf = 0;
    const tick = () => {
      const ms = barRuns && typeof barAnim?.currentTime === 'number' ? barAnim.currentTime : Number(document.timeline.currentTime ?? 0);
      const t = clamp(ms / 1000 / BUILD);
      setP(t);
      setFill(barRuns ? barScale(bar.current) : t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSkipped(true); };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      el?.removeEventListener('animationend', onEnd);
    };
  }, []);

  if (!active) return null;

  const shown = skipped ? 1 : fill;
  const stage = [...stages].reverse().find(([at]) => p >= at)?.[1] ?? stages[0][1];

  return (
    <div ref={root} className={`intro${skipped ? ' is-skipped' : ''}`} role="status" aria-live="polite" aria-label="Loading" data-nosnippet="">
      <div className="intro__grid" aria-hidden="true" />
      <div className="intro__glow" aria-hidden="true" />

      {drawing === 'house' && <svg className="intro__plan" viewBox="0 0 400 230" aria-hidden="true">
        {PLAN.map((l, i) => (
          <path
            key={i}
            d={l.d}
            pathLength={1}
            className={l.accent ? 'is-accent' : l.dim ? 'is-dim' : undefined}
            style={{ animationDelay: `${(l.from * BUILD).toFixed(2)}s`, animationDuration: `${((l.to - l.from) * BUILD).toFixed(2)}s` }}
          />
        ))}
      </svg>}

      <div className="intro__center">
        <img className="intro__logo" src={logo} alt="" width={180} height={196} decoding="async" />
        <p className="intro__title">
          {words.map((w, i) => (
            <span key={w} className="intro__word">
              <span className={i === words.length - 1 ? 'is-accent' : undefined} style={{ animationDelay: `${0.25 + i * 0.12}s` }}>{w}</span>
            </span>
          ))}
        </p>
        <div className="intro__bar" aria-hidden="true"><span ref={bar} /></div>
        <div className="intro__meta">
          <span key={stage} className="intro__stage">{stage}</span>
          <span className="intro__pct">{Math.round(shown * 100)}%</span>
        </div>
      </div>

      <button type="button" className="intro__skip" onClick={() => setSkipped(true)}>
        Skip intro
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
    </div>
  );
}
