import localFont from "next/font/local";

/**
 * Brand fonts (self-hosted, subset WOFF2 — see src/fonts/LICENSES.md).
 *   RDR2 (Chinese Rocks) → headings        Orbitron → HUD labels, numbers
 *   Dihjau              → body text
 * Swap a face by replacing one file/line here; everything references the CSS variables.
 */
export const rdr2 = localFont({ src: "../fonts/rdr2-latin.woff2", variable: "--font-rdr2", display: "swap", fallback: ["Impact", "Arial Narrow", "sans-serif"], adjustFontFallback: false });
export const orbitron = localFont({ src: "../fonts/orbitron-latin.woff2", variable: "--font-orbitron", display: "swap", fallback: ["ui-monospace", "Consolas", "monospace"], adjustFontFallback: false });
export const dihjau = localFont({ src: "../fonts/dihjau-latin.woff2", variable: "--font-dihjau", display: "swap", fallback: ["Georgia", "Times New Roman", "serif"], adjustFontFallback: false });

export const fontVars = `${rdr2.variable} ${orbitron.variable} ${dihjau.variable}`;
