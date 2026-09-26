// Animates the load block inside a LoadViz SVG. Geometry mirrors src/lib/iso.ts.

const COS = Math.cos(Math.PI / 6);

export function initLoadViz(svg: SVGSVGElement) {
  const d = svg.dataset;
  const L = Number(d.l), W = Number(d.w), H = Number(d.h) * 0.92, U = Number(d.u), OX = Number(d.ox), OY = Number(d.oy);
  const faces = {
    top: svg.querySelector<SVGPolygonElement>('[data-face="top"]')!,
    end: svg.querySelector<SVGPolygonElement>('[data-face="end"]')!,
    side: svg.querySelector<SVGPolygonElement>('[data-face="side"]')!,
  };
  const p = (x: number, y: number, z: number) => `${(OX + (x - y) * COS * U).toFixed(1)},${(OY + (x + y) * 0.5 * U - z * U).toFixed(1)}`;

  function draw(f: number) {
    const x1 = Math.max(0.001, L * f);
    faces.top.setAttribute("points", [p(0, 0, H), p(x1, 0, H), p(x1, W, H), p(0, W, H)].join(" "));
    faces.end.setAttribute("points", [p(x1, 0, 0), p(x1, W, 0), p(x1, W, H), p(x1, 0, H)].join(" "));
    faces.side.setAttribute("points", [p(0, W, 0), p(x1, W, 0), p(x1, W, H), p(0, W, H)].join(" "));
    svg.setAttribute("aria-label", `Truck box, ${Math.round(f * 100)}% full`);
  }

  // Current fraction parsed from the server-rendered side face.
  const firstX = faces.side.getAttribute("points")!.split(" ")[1].split(",").map(Number);
  let current = ((firstX[0] - OX) / (COS * U) + W) / L;
  let raf = 0;

  // Ease-out (quint-ish) — fast start, soft landing; reads as physical.
  const ease = (t: number) => 1 - Math.pow(1 - t, 4);

  return {
    set(target: number) {
      cancelAnimationFrame(raf);
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        current = target;
        return draw(target);
      }
      const from = current;
      const dur = 420;
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        current = from + (target - from) * ease(t);
        draw(current);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    },
  };
}
