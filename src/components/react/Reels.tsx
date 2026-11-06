import { useEffect, useRef, useState } from 'react';
import type { ReelVideo } from '../../lib/media';
import Player from './Player';
import { useInView, useMotionOk } from './useInView';

function ReelCard({ v, onOpen, priority = false }: { v: ReelVideo; onOpen: () => void; priority?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, 0.55);
  const motionOk = useMotionOk();
  const [hover, setHover] = useState(false);
  const playing = !!v.preview && motionOk && (inView || hover);

  useEffect(() => {
    const el = vid.current;
    if (!el) return;
    if (playing) el.play().catch(() => {});
    else el.pause();
  }, [playing]);

  return (
    <button
      ref={ref}
      type="button"
      className="reel"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`Play video: ${v.title}`}
    >
      <span className="reel__media">
        <img src={v.poster} srcSet={v.posterSrcset} sizes="(min-width: 1100px) 320px, (min-width: 768px) 32vw, 62vw" alt="" width={360} height={640} loading={priority ? 'eager' : 'lazy'} decoding="async" />
        {v.preview && (
          <video ref={vid} className={playing ? 'is-on' : ''} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1}>
            <source src={v.preview} type="video/mp4" />
          </video>
        )}
        <span className="reel__shade" aria-hidden="true" />
        <span className="reel__play" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg>
        </span>
      </span>
      <span className="reel__text">
        <span className="reel__title">{v.title}</span>
        <span className="reel__blurb">{v.blurb}</span>
      </span>
    </button>
  );
}

/** Vertical walkthrough videos as a horizontal rail (home) or a grid (projects, services). */
export default function Reels({ videos, layout = 'rail' }: { videos: ReelVideo[]; layout?: 'rail' | 'grid' }) {
  const [open, setOpen] = useState<number | null>(null);
  const track = useRef<HTMLUListElement>(null);
  const scrollBy = (d: number) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector('li');
    el.scrollBy({ left: d * ((card?.clientWidth ?? 300) + 16) * 2, behavior: 'smooth' });
  };

  return (
    <div className={`reels reels--${layout}`}>
      {layout === 'rail' && (
        <div className="reels__ctrl">
          <button type="button" className="round-btn" onClick={() => scrollBy(-1)} aria-label="Scroll videos left">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className="round-btn" onClick={() => scrollBy(1)} aria-label="Scroll videos right">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
      <ul ref={track} className="reels__track">
        {videos.map((v, i) => (
          <li key={v.slug}><ReelCard v={v} onOpen={() => setOpen(i)} /></li>
        ))}
      </ul>
      <Player videos={videos} index={open} onChange={setOpen} />
    </div>
  );
}
