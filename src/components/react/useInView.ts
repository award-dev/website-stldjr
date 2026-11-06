import { useEffect, useState, type RefObject } from 'react';

export function useInView(ref: RefObject<Element | null>, threshold = 0.6) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return inView;
}

/** Autoplaying muted previews only when the visitor allows motion and is not saving data. */
export function useMotionOk() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const update = () => setOk(!mq.matches && !saveData);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return ok;
}
