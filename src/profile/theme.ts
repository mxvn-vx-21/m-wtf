import type { CSSProperties } from "react";
import { z } from "zod";
import { imageSrc } from "./text";

/**
 * THEME = pure data. The public renderer, the editor preview and the dashboard all consume the same
 * ThemeConfig → CSS variables. Nothing in components hardcodes a colour or font.
 *
 *   ThemeConfig ──themeToCss()──▶ { style (CSS vars), fx, bgImage } ──▶ <ProfileView>
 *
 * PREMIUM GATING: presets/fonts/backgrounds may carry `requiresPlan`. Nothing is gated in V1;
 * the server already checks `canUse()` so V2 only has to flip a flag.
 */

export type Plan = "FREE" | "PREMIUM";
export const planRank: Record<Plan, number> = { FREE: 0, PREMIUM: 1 };
export const canUse = (plan: Plan, requires?: Plan) => planRank[plan] >= planRank[requires ?? "FREE"];

/* ── Curated fonts (system stacks → zero network cost, no layout shift) ─────────── */
export const FONTS = {
  system: { label: "Clean", stack: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` },
  display: { label: "Display", stack: `"Arial Black", "Helvetica Neue", Impact, ui-sans-serif, system-ui, sans-serif` },
  condensed: { label: "Condensed", stack: `Impact, "Haettenschweiler", "Arial Narrow Bold", "Roboto Condensed", sans-serif-condensed, sans-serif` },
  serif: { label: "Serif", stack: `Georgia, "Times New Roman", "Iowan Old Style", "Palatino Linotype", serif` },
  mono: { label: "Mono", stack: `ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` },
  rounded: { label: "Rounded", stack: `ui-rounded, "Trebuchet MS", "Segoe UI", system-ui, sans-serif` },
  // brand fonts (self-hosted via next/font in src/app/fonts.ts → CSS variables)
  rdr2: { label: "RDR2 (stencil)", stack: `var(--font-rdr2), Impact, "Arial Narrow", sans-serif` },
  orbitron: { label: "Orbitron (HUD)", stack: `var(--font-orbitron), ui-monospace, Consolas, monospace` },
  dihjau: { label: "Dihjau (text)", stack: `var(--font-dihjau), Georgia, "Times New Roman", serif` },
} as const;
export type FontKey = keyof typeof FONTS;
export const FONT_KEYS = Object.keys(FONTS) as [FontKey, ...FontKey[]];

/* ── Background presets (pure CSS, no images to download) ───────────────────────── */
export const BG_PRESETS = {
  nebula: { label: "Nebula", css: "radial-gradient(900px 500px at 15% 0%, rgba(168,85,247,.38), transparent 60%), radial-gradient(800px 500px at 90% 25%, rgba(236,72,153,.28), transparent 60%), radial-gradient(700px 600px at 50% 100%, rgba(59,130,246,.2), transparent 60%), #07040f" },
  aurora: { label: "Aurora", css: "radial-gradient(1000px 500px at 20% -10%, rgba(34,197,94,.3), transparent 60%), radial-gradient(900px 500px at 85% 10%, rgba(56,189,248,.28), transparent 60%), linear-gradient(180deg, #04101a, #050a14)" },
  city: { label: "City", css: "linear-gradient(180deg, rgba(255,120,60,.2), transparent 35%), linear-gradient(180deg, #0a0a12, #12121c 60%, #05050a)" },
  grid: { label: "HUD Grid", css: "linear-gradient(rgba(34,211,238,.07) 1px, transparent 1px) 0 0/32px 32px, linear-gradient(90deg, rgba(34,211,238,.07) 1px, transparent 1px) 0 0/32px 32px, radial-gradient(800px 500px at 50% -10%, rgba(34,211,238,.18), transparent 60%), #04090d" },
  crimson: { label: "Crimson", css: "radial-gradient(900px 500px at 50% -15%, rgba(220,38,38,.35), transparent 60%), #0a0204" },
  noir: { label: "Noir", css: "radial-gradient(1000px 600px at 50% 0%, rgba(255,255,255,.07), transparent 60%), linear-gradient(180deg, #0b0b0b, #050505)" },
} as const;
export type BgPresetKey = keyof typeof BG_PRESETS;
export const BG_PRESET_KEYS = Object.keys(BG_PRESETS) as [BgPresetKey, ...BgPresetKey[]];

/* ── Schema ───────────────────────────────────────────────────────────────────── */
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #ff2d2d.");
const PRESET_IDS = ["default", "hero", "vigilante", "tech", "cosmic", "villain"] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export const themeSchema = z.object({
  presetId: z.enum(PRESET_IDS),
  background: z.object({
    type: z.enum(["solid", "gradient", "image", "preset"]),
    color: hex,
    from: hex,
    to: hex,
    angle: z.number().int().min(0).max(360),
    preset: z.enum(BG_PRESET_KEYS),
    src: z.union([z.literal(""), imageSrc]),
    overlay: z.number().min(0).max(0.9),
  }),
  colors: z.object({ accent: hex, text: hex, muted: hex, surface: hex, border: hex }),
  card: z.object({
    radius: z.number().int().min(0).max(40),
    borderWidth: z.number().int().min(0).max(3),
    blur: z.number().int().min(0).max(32),
    opacity: z.number().min(0.05).max(1),
  }),
  typography: z.object({ heading: z.enum(FONT_KEYS), body: z.enum(FONT_KEYS) }),
  effects: z.object({
    glow: z.number().min(0).max(1),
    particles: z.enum(["none", "stars", "embers", "snow"]),
    animation: z.enum(["none", "fade", "float"]),
    // V1.1 "feel" effects. Defaults keep every existing profile exactly as it was.
    cursor: z.enum(["default", "ring"]).default("default"),
    clickFx: z.enum(["none", "burst", "pow", "wave"]).default("none"),
    tilt: z.boolean().default(false),
    emblem: z.enum(["none", "logo", "bolt", "star", "shield", "orb"]).default("none"),
  }),
});
export type ThemeConfig = z.infer<typeof themeSchema>;

/* ── Hero identity presets ───────────────────────────────────────────────────── */
type Preset = { id: PresetId; name: string; tagline: string; requiresPlan?: Plan; theme: ThemeConfig };

const base = {
  background: { type: "preset", color: "#0a0a0f", from: "#0a0a0f", to: "#1b1b28", angle: 160, preset: "noir", src: "", overlay: 0.45 },
  card: { radius: 16, borderWidth: 1, blur: 12, opacity: 0.55 },
} as const;

export const PRESETS: Preset[] = [
  {
    id: "default", name: "Default", tagline: "Clean & neutral",
    theme: {
      presetId: "default",
      background: { ...base.background, type: "gradient", from: "#0c0c12", to: "#171722", angle: 180 },
      colors: { accent: "#d4d4d8", text: "#f4f4f5", muted: "#a1a1aa", surface: "#16161f", border: "#ffffff" },
      card: { radius: 16, borderWidth: 1, blur: 10, opacity: 0.6 },
      typography: { heading: "rdr2", body: "dihjau" },
      effects: { glow: 0.1, particles: "none", animation: "fade", cursor: "default", clickFx: "burst", tilt: true, emblem: "none" },
    },
  },
  {
    id: "hero", name: "Hero", tagline: "Bright, powerful, clean",
    theme: {
      presetId: "hero",
      background: { ...base.background, type: "gradient", from: "#0a1a45", to: "#12306f", angle: 165 },
      colors: { accent: "#ffd400", text: "#ffffff", muted: "#b8c7f0", surface: "#ffffff", border: "#ffffff" },
      card: { radius: 18, borderWidth: 1, blur: 14, opacity: 0.1 },
      typography: { heading: "rdr2", body: "dihjau" },
      effects: { glow: 0.55, particles: "none", animation: "fade", cursor: "ring", clickFx: "pow", tilt: true, emblem: "shield" },
    },
  },
  {
    id: "vigilante", name: "Vigilante", tagline: "Dark, gritty, high contrast",
    theme: {
      presetId: "vigilante",
      background: { ...base.background, type: "preset", preset: "noir" },
      colors: { accent: "#ff3b30", text: "#ffffff", muted: "#9a9a9a", surface: "#000000", border: "#ffffff" },
      card: { radius: 4, borderWidth: 2, blur: 0, opacity: 0.8 },
      typography: { heading: "rdr2", body: "dihjau" },
      effects: { glow: 0.25, particles: "embers", animation: "fade", cursor: "default", clickFx: "burst", tilt: true, emblem: "none" },
    },
  },
  {
    id: "tech", name: "Tech", tagline: "HUD-style futuristic",
    theme: {
      presetId: "tech",
      background: { ...base.background, type: "preset", preset: "grid" },
      colors: { accent: "#22d3ee", text: "#d8f6ff", muted: "#7fb2c4", surface: "#06202b", border: "#22d3ee" },
      card: { radius: 6, borderWidth: 1, blur: 10, opacity: 0.6 },
      typography: { heading: "orbitron", body: "mono" },
      effects: { glow: 0.6, particles: "none", animation: "fade", cursor: "ring", clickFx: "wave", tilt: true, emblem: "bolt" },
    },
  },
  {
    id: "cosmic", name: "Cosmic", tagline: "Stars, nebula, wonder",
    theme: {
      presetId: "cosmic",
      background: { ...base.background, type: "preset", preset: "nebula" },
      colors: { accent: "#c084fc", text: "#f7f0ff", muted: "#b9a6d8", surface: "#1a0f35", border: "#c084fc" },
      card: { radius: 22, borderWidth: 1, blur: 18, opacity: 0.5 },
      typography: { heading: "orbitron", body: "dihjau" },
      effects: { glow: 0.6, particles: "stars", animation: "float", cursor: "ring", clickFx: "burst", tilt: true, emblem: "orb" },
    },
  },
  {
    id: "villain", name: "Villain", tagline: "Dark, dramatic, dangerous",
    theme: {
      presetId: "villain",
      background: { ...base.background, type: "gradient", from: "#0c0016", to: "#000000", angle: 180 },
      colors: { accent: "#39ff88", text: "#f1ffe9", muted: "#8fb69b", surface: "#120022", border: "#39ff88" },
      card: { radius: 10, borderWidth: 1, blur: 8, opacity: 0.75 },
      typography: { heading: "rdr2", body: "dihjau" },
      effects: { glow: 0.7, particles: "embers", animation: "fade", cursor: "default", clickFx: "burst", tilt: false, emblem: "none" },
    },
  },
];

export const presetById = (id: string) => PRESETS.find((p) => p.id === id);
export const DEFAULT_THEME: ThemeConfig = PRESETS[0].theme;
export const cloneTheme = (t: ThemeConfig): ThemeConfig => JSON.parse(JSON.stringify(t));

/** V0 stored a string id in profile.theme_id; map it to a V1 preset so old profiles keep a sane look. */
const LEGACY: Record<string, PresetId> = { "default-dark": "default", midnight: "tech", cosmic: "cosmic" };

/** Resolve whatever is stored (V1 JSON, V0 id, junk) into a valid ThemeConfig. Never throws. */
export function resolveTheme(stored: unknown, legacyId?: string | null): ThemeConfig {
  if (stored && typeof stored === "object") {
    const p = themeSchema.safeParse(stored);
    if (p.success) return p.data;
  }
  return cloneTheme(presetById(LEGACY[legacyId ?? ""] ?? "default")!.theme);
}

/* ── ThemeConfig → CSS ────────────────────────────────────────────────────────── */
function rgba(hexColor: string, a: number) {
  const n = parseInt(hexColor.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.round(a * 1000) / 1000})`;
}

export function themeToCss(t: ThemeConfig): { style: CSSProperties; bgImage: boolean; fx: ThemeConfig["effects"]["particles"]; animation: ThemeConfig["effects"]["animation"] } {
  const b = t.background;
  let bg: string;
  let bgImage = false;
  if (b.type === "solid") bg = b.color;
  else if (b.type === "gradient") bg = `linear-gradient(${b.angle}deg, ${b.from}, ${b.to})`;
  else if (b.type === "preset") bg = BG_PRESETS[b.preset].css;
  else if (b.src) {
    bgImage = true;
    // src is validated by imageSrc (no quotes/parens/whitespace) so it is safe inside url("…").
    bg = `linear-gradient(rgba(0,0,0,${b.overlay}), rgba(0,0,0,${b.overlay})), url("${b.src}")`;
  } else bg = b.color;

  const c = t.colors;
  const style = {
    "--p-bg": bg,
    "--p-accent": c.accent,
    "--p-accent-soft": rgba(c.accent, 0.16),
    "--p-text": c.text,
    "--p-muted": c.muted,
    "--p-surface": rgba(c.surface, t.card.opacity),
    "--p-surface-strong": rgba(c.surface, Math.min(1, t.card.opacity + 0.25)),
    "--p-border": rgba(c.border, 0.28),
    "--p-bw": `${t.card.borderWidth}px`,
    "--p-radius": `${t.card.radius}px`,
    "--p-blur": `${t.card.blur}px`,
    "--p-font-h": FONTS[t.typography.heading].stack,
    "--p-font-b": FONTS[t.typography.body].stack,
    "--p-glow": t.effects.glow > 0 ? `0 0 ${Math.round(18 + t.effects.glow * 46)}px ${rgba(c.accent, 0.12 + t.effects.glow * 0.38)}` : "none",
    "--p-glow-text": t.effects.glow > 0 ? `0 0 ${Math.round(8 + t.effects.glow * 22)}px ${rgba(c.accent, 0.25 + t.effects.glow * 0.5)}` : "none",
  } as CSSProperties;
  return { style, bgImage, fx: t.effects.particles, animation: t.effects.animation };
}
