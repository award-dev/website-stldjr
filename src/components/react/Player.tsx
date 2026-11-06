import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReelVideo } from '../../lib/media';

interface Props {
  videos: ReelVideo[];
  index: number | null;
  onChange: (i: number | null) => void;
}

/** Full-screen player for the 1080p walkthroughs, with sound. AV1 first, H.264 fallback. */
export default function Player({ videos, index, onChange }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<Element | null>(null);
  const open = index !== null;
  const v = open ? videos[index!] : null;

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChange(null);
      if (e.key === 'ArrowRight') onChange(((index ?? 0) + 1) % videos.length);
      if (e.key === 'ArrowLeft') onChange(((index ?? 0) - 1 + videos.length) % videos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prevOverflow;
      (lastFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [open, index, videos.length, onChange]);

  if (!v) return null;
  const step = (d: number) => onChange(((index ?? 0) + d + videos.length) % videos.length);

  // Rendered into <body> so it sits above the fixed header (the page's <main> is its own layer during transitions).
  return createPortal(
    <div className={`mp${v.orientation === 'landscape' ? ' mp--landscape' : ''}`} role="dialog" aria-modal="true" aria-label={`Video: ${v.title}`} onClick={(e) => e.target === e.currentTarget && onChange(null)}>
      <div className="mp__stage">
        <video key={v.slug} className="mp__video" controls autoPlay playsInline poster={v.posterLarge} preload="auto">
          {v.sources.map((s) => <source key={s.src} src={s.src} type={s.type} />)}
        </video>
        <div className="mp__info">
          {videos.length > 1 && <p className="mp__count">{(index ?? 0) + 1} / {videos.length}</p>}
          <h2 className="mp__title">{v.title}</h2>
          <p className="mp__blurb">{v.blurb}</p>
          {videos.length > 1 && <div className="mp__nav">
            <button type="button" className="mp__btn" onClick={() => step(-1)} aria-label="Previous video">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button type="button" className="mp__btn" onClick={() => step(1)} aria-label="Next video">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>}
        </div>
      </div>
      <button ref={closeRef} type="button" className="mp__close" onClick={() => onChange(null)} aria-label="Close video">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>,
    document.body,
  );
}
