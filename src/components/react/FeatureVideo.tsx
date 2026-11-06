import { useEffect, useRef, useState } from 'react';
import type { ReelVideo } from '../../lib/media';
import Player from './Player';
import { useInView, useMotionOk } from './useInView';

/** A single landscape video: poster, a muted preview loop while on screen, and the full player on click. */
export default function FeatureVideo({ video, duration }: { video: ReelVideo; duration?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef<HTMLButtonElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, 0.5);
  const motionOk = useMotionOk();
  const playing = !!video.preview && motionOk && inView && open === null;

  useEffect(() => {
    const el = vid.current;
    if (!el) return;
    if (playing) el.play().catch(() => {});
    else el.pause();
  }, [playing]);

  return (
    <>
      <button ref={ref} type="button" className="fv" onClick={() => setOpen(0)} aria-label={`Play video: ${video.title}${duration ? ` (${duration})` : ''}`}>
        <img src={video.poster} srcSet={video.posterSrcset} sizes="(min-width: 1024px) 760px, 100vw" alt="" width={1920} height={1080} loading="lazy" decoding="async" />
        {video.preview && (
          <video ref={vid} className={playing ? 'is-on' : ''} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1}>
            <source src={video.preview} type="video/mp4" />
          </video>
        )}
        <span className="fv__shade" aria-hidden="true" />
        <span className="fv__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg></span>
        <span className="fv__meta" aria-hidden="true">
          <span className="fv__title">{video.title}</span>
          {duration && <span className="fv__dur">{duration}</span>}
        </span>
      </button>
      <Player videos={[video]} index={open} onChange={setOpen} />
    </>
  );
}
