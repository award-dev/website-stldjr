import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GalleryPhoto } from '../../lib/media';

interface Props {
  photos: GalleryPhoto[];
  labels?: Record<string, string>;
  filters?: boolean;
  initial?: string;
}

/** Masonry photo wall with room filters and a keyboard-friendly lightbox. */
export default function Gallery({ photos, labels = {}, filters = false, initial = 'all' }: Props) {
  const [cat, setCat] = useState(initial);
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!filters) return;
    const q = new URLSearchParams(location.search).get('room');
    if (q && photos.some((p) => p.category === q)) setCat(q);
  }, [filters, photos]);

  const cats = useMemo(() => [...new Set(photos.map((p) => p.category))], [photos]);
  const shown = useMemo(() => (cat === 'all' ? photos : photos.filter((p) => p.category === cat)), [cat, photos]);

  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + shown.length) % shown.length)), [shown.length]);

  useEffect(() => {
    if (open === null) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
      opener.current?.focus();
    };
  }, [open, step]);

  const p = open !== null ? shown[open] : null;

  return (
    <div className="gal">
      {filters && (
        <div className="gal__filters" role="group" aria-label="Filter photos by room">
          {['all', ...cats].map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
              {c === 'all' ? 'All rooms' : labels[c] ?? c}
              <span className="chip__n">{c === 'all' ? photos.length : photos.filter((x) => x.category === c).length}</span>
            </button>
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite">{shown.length} photos shown</p>
      <ul className="gal__wall">
        {shown.map((ph, i) => (
          <li key={ph.id}>
            <button
              type="button"
              className="gal__item"
              onClick={(e) => { opener.current = e.currentTarget; setOpen(i); }}
              aria-label={`Enlarge photo: ${ph.alt}`}
            >
              <img src={ph.thumb} srcSet={ph.srcset} sizes="(min-width: 1100px) 330px, (min-width: 640px) 33vw, 50vw" alt={ph.alt} width={ph.w} height={ph.h} loading="lazy" decoding="async" />
              {ph.before && <span className="gal__badge">Before</span>}
            </button>
          </li>
        ))}
      </ul>

      {p && createPortal(
        <div className="lb" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
          <img className="lb__img" src={p.full} alt={p.alt} />
          <div className="lb__bar">
            <p className="lb__alt">{p.alt}</p>
            <div className="lb__ctrl">
              <span className="lb__count">{open! + 1} / {shown.length}</span>
              <button type="button" className="round-btn" onClick={() => step(-1)} aria-label="Previous photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
              <button type="button" className="round-btn" onClick={() => step(1)} aria-label="Next photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button>
            </div>
          </div>
          <button ref={closeRef} type="button" className="mp__close" onClick={() => setOpen(null)} aria-label="Close photo viewer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}
