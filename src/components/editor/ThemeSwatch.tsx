import { themeToCss, type ThemeConfig } from "@/profile/theme";

/** Tiny static preview of a theme (used for preset pickers). */
export function ThemeSwatch({ theme }: { theme: ThemeConfig }) {
  const { style } = themeToCss(theme);
  return (
    <div className="pv" style={{ ...style, aspectRatio: "16 / 10", minHeight: 0, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,.1)" }} aria-hidden>
      <div style={{ display: "grid", placeItems: "center", gap: 4, height: "100%", alignContent: "center", position: "relative", zIndex: 1 }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid var(--p-accent)", boxShadow: "var(--p-glow)", background: "var(--p-surface-strong)" }} />
        <div style={{ width: "56%", height: 7, borderRadius: 4, background: "var(--p-text)", opacity: 0.85 }} />
        <div style={{ width: "70%", height: 9, borderRadius: "var(--p-radius)", background: "var(--p-surface-strong)", border: "1px solid var(--p-border)" }} />
      </div>
    </div>
  );
}
