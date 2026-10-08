// Procedural, illustrative city map (not real geography). Deterministic so builds are stable.

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface CityMap {
  w: number;
  h: number;
  minor: string[];
  arterial: string[];
  river: string;
  riverBank: string;
  parks: { cx: number; cy: number; rx: number; ry: number; rot: number }[];
}

/** Streets on a jittered grid, warped so the city reads organic rather than ruled. */
export function cityMap(w: number, h: number, seed = 7, cell = 46): CityMap {
  const r = rng(seed);
  const cols = Math.ceil(w / cell) + 2;
  const rows = Math.ceil(h / cell) + 2;
  const warp = (x: number, y: number): [number, number] => [
    x + Math.sin(y / 140 + 1.3) * 22 + Math.cos(x / 210) * 10,
    y + Math.cos(x / 160 + 0.4) * 18 + Math.sin(y / 260) * 8,
  ];
  const pts: [number, number][][] = [];
  for (let j = 0; j < rows; j++) {
    pts[j] = [];
    for (let i = 0; i < cols; i++) {
      const x = (i - 1) * cell + (r() - 0.5) * cell * 0.5;
      const y = (j - 1) * cell + (r() - 0.5) * cell * 0.5;
      pts[j][i] = warp(x, y);
    }
  }
  const f = (n: number) => n.toFixed(1);
  const minor: string[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p = pts[j][i];
      if (i + 1 < cols && r() > 0.16) {
        const q = pts[j][i + 1];
        minor.push(`M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}`);
      }
      if (j + 1 < rows && r() > 0.16) {
        const q = pts[j + 1][i];
        minor.push(`M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}`);
      }
    }
  }
  const arterial = [
    `M-20 ${h * 0.18} C ${w * 0.25} ${h * 0.32}, ${w * 0.5} ${h * 0.42}, ${w + 20} ${h * 0.62}`,
    `M${w * 0.18} -20 C ${w * 0.32} ${h * 0.3}, ${w * 0.4} ${h * 0.7}, ${w * 0.3} ${h + 20}`,
    `M${w * 0.82} -20 C ${w * 0.7} ${h * 0.3}, ${w * 0.62} ${h * 0.55}, ${w * 0.78} ${h + 20}`,
    `M-20 ${h * 0.78} C ${w * 0.3} ${h * 0.7}, ${w * 0.6} ${h * 0.86}, ${w + 20} ${h * 0.8}`,
    `M${w * 0.05} ${h + 20} C ${w * 0.35} ${h * 0.6}, ${w * 0.65} ${h * 0.35}, ${w + 20} ${h * 0.08}`,
  ];
  const river = `M-30 ${h * 0.46} C ${w * 0.18} ${h * 0.4}, ${w * 0.3} ${h * 0.6}, ${w * 0.48} ${h * 0.55} S ${w * 0.78} ${h * 0.3}, ${w + 30} ${h * 0.36}`;
  const parks = Array.from({ length: 7 }, () => ({
    cx: r() * w, cy: r() * h, rx: 26 + r() * 40, ry: 18 + r() * 26, rot: r() * 180,
  }));
  return { w, h, minor, arterial, river, riverBank: river, parks };
}

export interface StaffDot { x: number; y: number; d: number; delay: number }

/** Staff positions scattered around a centre, with their distance for the offer sweep. */
export function staffDots(cx: number, cy: number, count: number, maxR: number, seed = 11): StaffDot[] {
  const r = rng(seed);
  const out: StaffDot[] = [];
  let guard = 0;
  while (out.length < count && guard++ < 2000) {
    const a = r() * Math.PI * 2;
    const d = 60 + Math.sqrt(r()) * (maxR - 60);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d * 0.82;
    if (out.some((o) => Math.hypot(o.x - x, o.y - y) < 46)) continue;
    out.push({ x, y, d, delay: d / maxR });
  }
  return out.sort((a, b) => a.d - b.d);
}
