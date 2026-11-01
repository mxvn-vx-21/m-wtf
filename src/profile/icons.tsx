import { BRAND_PATHS } from "./brand-paths";

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

/** Generic stroke icons (24x24). Brand icons come from BRAND_PATHS (filled). */
const STROKE: Record<string, string[]> = {
  link: ["M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5", "M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"],
  globe: [circle(12, 12, 10), "M2 12h20", "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"],
  mail: ["M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "m22 7-10 6L2 7"],
  star: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"],
  bolt: ["M13 2L3 14h9l-1 8 10-12h-9l1-8z"],
  play: ["M5 3l14 9-14 9V3z"],
  pause: ["M6 4h4v16H6z", "M14 4h4v16h-4z"],
  music: ["M9 18V5l12-2v13", circle(6, 18, 3), circle(18, 16, 3)],
  code: ["M16 18l6-6-6-6", "M8 6l-6 6 6 6"],
  gift: ["M3 8h18v4H3z", "M12 8v13", "M19 12v9H5v-9", "M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"],
  heart: ["M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"],
  cart: [circle(9, 21, 1), circle(20, 21, 1), "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"],
  arrow: ["M7 17L17 7", "M7 7h10v10"],
  image: ["M3 3h18v18H3z", circle(8.5, 8.5, 1.5), "M21 15l-5-5L5 21"],
  text: ["M4 7V4h16v3", "M9 20h6", "M12 4v16"],
  spacer: ["M12 3v18", "M8 7l4-4 4 4", "M8 17l4 4 4-4"],
  user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", circle(12, 7, 4)],
  share: [circle(18, 5, 3), circle(6, 12, 3), circle(18, 19, 3), "M8.59 13.51l6.83 3.98", "M15.41 6.51l-6.82 3.98"],
  grip: [circle(9, 6, 1), circle(15, 6, 1), circle(9, 12, 1), circle(15, 12, 1), circle(9, 18, 1), circle(15, 18, 1)],
  up: ["M18 15l-6-6-6 6"],
  down: ["M6 9l6 6 6-6"],
  copy: ["M9 9h11v11H9z", "M5 15H4V4h11v1"],
  trash: ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6", "M10 11v6", "M14 11v6"],
  eye: ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z", circle(12, 12, 3)],
  eyeOff: ["M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94", "M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19", "M1 1l22 22"],
  plus: ["M12 5v14", "M5 12h14"],
  check: ["M20 6L9 17l-5-5"],
  x: ["M18 6L6 18", "M6 6l12 12"],
  lock: ["M5 11h14v10H5z", "M8 11V7a4 4 0 0 1 8 0v4"],
  qr: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M14 14h3v3h-3z", "M20 14v7", "M14 20h3"],
  palette: [circle(12, 12, 10), circle(7.5, 10.5, 1), circle(12, 7.5, 1), circle(16.5, 10.5, 1)],
  layers: ["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
  sliders: ["M4 21v-7", "M4 10V3", "M12 21v-9", "M12 8V3", "M20 21v-5", "M20 12V3", "M1 14h6", "M9 8h6", "M17 16h6"],
  alert: ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"],
  rocket: ["M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z", "M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"],
};

export const GENERIC_ICONS = ["link", "globe", "mail", "star", "bolt", "play", "music", "code", "gift", "heart", "cart"] as const;
export const BRAND_ICON_IDS = Object.keys(BRAND_PATHS);

export function Icon({ name, size = 18, className, title }: { name: string; size?: number; className?: string; title?: string }) {
  const brand = BRAND_PATHS[name];
  if (brand) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
        <path d={brand} />
      </svg>
    );
  }
  const d = STROKE[name] ?? STROKE.link;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
      {d.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
