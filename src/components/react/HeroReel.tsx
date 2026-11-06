import { useEffect, useRef, useState } from 'react';
import type { ReelVideo } from '../../lib/media';
import Player from './Player';
import { useMotionOk } from './useInView';

/** Stories-style hero: short muted loops play one after another, tap to watch the full walkthrough. */
export default function HeroReel({ videos }: { videos: ReelVideo[] }) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const motionOk = useMotionOk();
  const refs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      if (i === active && motionOk && open === null) {
        el.currentTime = 0;
        el.play().catch(() => {});
      } else el.pause();
    });
    setProgress(0);
  }, [active, motionOk, open]);

  const next = () => setActive((a) => (a + 1) % videos.length);
  const v = videos[active];

  return (
    <div className="hero-reel">
      <div className="hero-reel__bars" aria-hidden="true">
        {videos.map((x, i) => (
          <span key={x.slug} className="hero-reel__bar">
            <span style={{ transform: `scaleX(${i < active ? 1 : i === active ? progress : 0})` }} />
          </span>
        ))}
      </div>

      <button type="button" className="hero-reel__frame" onClick={() => setOpen(active)} aria-label={`Play video: ${v.title}`}>
        {videos.map((x, i) => (
          <span key={x.slug} className={`hero-reel__layer ${i === active ? 'is-on' : ''}`} aria-hidden={i !== active}>
            <img src={x.poster} srcSet={x.posterSrcset} sizes="(min-width: 1024px) 440px, 92vw" alt="" width={360} height={640} loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : undefined} decoding="async" />
            {x.preview && (
              <video
                ref={(el) => { refs.current[i] = el; }}
                muted
                playsInline
                preload={i === 0 ? 'auto' : 'none'}
                tabIndex={-1}
                onTimeUpdate={(e) => i === active && setProgress(Math.min(1, e.currentTarget.currentTime / (e.currentTarget.duration || 4)))}
                onEnded={next}
              >
                <source src={x.preview} type="video/mp4" />
              </video>
            )}
          </span>
        ))}
        <span className="hero-reel__shade" aria-hidden="true" />
        <span className="hero-reel__caption">
          <span className="hero-reel__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg></span>
          <span>
            <span className="hero-reel__title">{v.title}</span>
            <span className="hero-reel__hint">Watch the full walkthrough</span>
          </span>
        </span>
      </button>

      <div className="hero-reel__thumbs" role="group" aria-label="Choose a walkthrough">
        {videos.map((x, i) => (
          <button key={x.slug} type="button" className={`hero-reel__thumb ${i === active ? 'is-on' : ''}`} onClick={() => setActive(i)} aria-label={`Show ${x.title}`} aria-pressed={i === active}>
            <img src={x.poster} alt="" width={360} height={640} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>

      <Player videos={videos} index={open} onChange={setOpen} />
    </div>
  );
}
