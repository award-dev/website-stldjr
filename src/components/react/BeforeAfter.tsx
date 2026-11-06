import { useRef, useState } from 'react';

interface Img { src: string; srcset: string; alt: string }

/** Drag (or arrow-key) comparison slider. The range input carries keyboard and screen-reader access. */
export default function BeforeAfter({ before, after, title }: { before: Img; after: Img; title: string }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const fromEvent = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <figure className="ba">
      <div
        ref={box}
        className="ba__box"
        style={{ ['--pos' as string]: `${pos}%` }}
        onPointerDown={(e) => { dragging.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); fromEvent(e.clientX); }}
        onPointerMove={(e) => dragging.current && fromEvent(e.clientX)}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
      >
        <img className="ba__img" src={after.src} srcSet={after.srcset} sizes="(min-width: 1024px) 640px, 100vw" alt={`After: ${after.alt}`} loading="lazy" decoding="async" draggable={false} />
        <img className="ba__img ba__img--before" src={before.src} srcSet={before.srcset} sizes="(min-width: 1024px) 640px, 100vw" alt={`Before: ${before.alt}`} loading="lazy" decoding="async" draggable={false} />
        <span className="ba__label ba__label--before" aria-hidden="true">Before</span>
        <span className="ba__label ba__label--after" aria-hidden="true">After</span>
        <span className="ba__handle" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M9 6l-5 6 5 6M15 6l5 6-5 6" /></svg>
        </span>
        <input
          className="ba__range"
          type="range"
          min={0}
          max={100}
          value={Math.round(pos)}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Compare before and after: ${title}`}
        />
      </div>
      <figcaption className="ba__title">{title}</figcaption>
    </figure>
  );
}
