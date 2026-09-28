// Isometric projection helpers for the load visual and placeholder scenes.
// Units are feet, so the truck box is drawn to scale: 12 × 6.5 × 6 ft ≈ 17 yd³.

export const COS = Math.cos(Math.PI / 6);
export const SIN = 0.5;

export type P3 = [number, number, number];

export function project([x, y, z]: P3, u = 14, ox = 0, oy = 0): [number, number] {
  return [ox + (x - y) * COS * u, oy + (x + y) * SIN * u - z * u];
}

export function pts(list: P3[], u?: number, ox?: number, oy?: number) {
  return list.map((p) => project(p, u, ox, oy).map((n) => n.toFixed(1)).join(",")).join(" ");
}

/** The three visible faces of a box (top, +x end, +y side) as polygon point strings. */
export function boxFaces(x0: number, y0: number, z0: number, dx: number, dy: number, dz: number, u?: number, ox?: number, oy?: number) {
  const x1 = x0 + dx, y1 = y0 + dy, z1 = z0 + dz;
  return {
    top: pts([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], u, ox, oy),
    end: pts([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], u, ox, oy),
    side: pts([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], u, ox, oy),
  };
}

/** Deterministic PRNG so placeholder scenes render identically every build. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
