/**
 * Emblem outlines as plain data (no three.js import) so the SSR fallback SVG and the 3D extrusion share ONE source.
 * Coordinates are centred around (0,0), y up, roughly within ±10.
 */
export type EmblemModel = "logo" | "bolt" | "star" | "shield" | "orb";
export const EMBLEM_MODELS: EmblemModel[] = ["logo", "bolt", "star", "shield", "orb"];

export const LOGO_POLY: [number, number][] = [
  [-6, -5], [-3.6, -5], [-3.6, 1.2], [-1, -2.8], [1, -2.8], [3.6, 1.2], [3.6, -5], [6, -5],
  [6, 5], [3.9, 5], [0, -0.8], [-3.9, 5], [-6, 5],
];

export const BOLT_POLY: [number, number][] = [
  [1.2, 10], [-4.8, -0.4], [-1, -0.4], [-2.6, -10], [4.8, 2], [0.8, 2], [4, 10],
];

export function starPoly(R = 7, r = 3, n = 5): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / n;
    const rad = i % 2 === 0 ? R : r;
    pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
  }
  return pts;
}

/** Shield outline as drawing commands: M x y | L x y | C x1 y1 x2 y2 x y */
export const SHIELD_CMDS: (string | number)[][] = [
  ["M", 0, 9], ["L", 6.6, 7], ["L", 6.6, 0.4], ["C", 6.6, -4.6, 3.4, -7.6, 0, -9.8],
  ["C", -3.4, -7.6, -6.6, -4.6, -6.6, 0.4], ["L", -6.6, 7],
];
export const SHIELD_HOLE = starPoly(3.6, 1.55);

/** SVG path for the fallback (and the loading state) — same silhouette, y flipped for SVG. */
export function fallbackPath(model: EmblemModel): string {
  const poly = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${(-y).toFixed(2)}`).join("") + "Z";
  switch (model) {
    case "logo": return poly(LOGO_POLY);
    case "bolt": return poly(BOLT_POLY);
    case "star": return poly(starPoly());
    case "shield": {
      const body = SHIELD_CMDS.map((c) => {
        const [k, ...n] = c as [string, ...number[]];
        const f = (v: number[]) => v.map((q, i) => (i % 2 === 1 ? -q : q).toFixed(2)).join(" ");
        return `${k}${f(n)}`;
      }).join("") + "Z";
      return body + poly(SHIELD_HOLE);
    }
    case "orb": return "M0 -8 L7 -3.5 L7 3.5 L0 8 L-7 3.5 L-7 -3.5Z M0 -8 L0 8 M-7 -3.5 L7 3.5 M7 -3.5 L-7 3.5";
  }
}
