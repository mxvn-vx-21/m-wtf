"use client";
import { useEffect } from "react";

const WORDS = ["POW!", "ZAP!", "BAM!", "WHAM!", "KAPOW!", "ZOOM!"];
const INTERACTIVE = "a, button, [role='button'], [role='tab'], [role='radio'], [role='switch'], summary, select, label[for], input[type='range'], input[type='color'], input[type='file'], [data-cursor='hover']";
const TEXTUAL = "input:not([type]), input[type='text'], input[type='email'], input[type='password'], input[type='url'], textarea, [contenteditable='true']";
const NO_FX = "input, textarea, select, [data-nofx]";
const TILT = "[data-tilt], .pv[data-tilt='true'] .pv-card, .pv[data-tilt='true'] .pv-link";

/**
 * One global effects layer (mounted once in the root layout). Everything is event-delegated:
 *   • cursor: a dot + trailing ring (desktop/fine pointers only), reacts to links/text, themed inside profiles
 *   • click reaction: spark burst / shockwave / comic "POW!" (also on touch taps), themed + per-profile switchable
 *   • 3D tilt with glare on [data-tilt] elements
 * All of it is disabled for prefers-reduced-motion.
 */
export function FxLayer() {
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const html = document.documentElement;
    if (reduce) return;

    const layer = document.createElement("div");
    layer.className = "fx-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    let ring: HTMLDivElement | null = null;
    let dot: HTMLDivElement | null = null;
    if (fine) {
      ring = document.createElement("div"); ring.className = "fx-ring";
      dot = document.createElement("div"); dot.className = "fx-dot";
      document.body.append(ring, dot);
    }

    const pos = { x: -100, y: -100, rx: -100, ry: -100 };
    let raf = 0;
    let curPv: HTMLElement | null = null;
    let tiltEl: HTMLElement | null = null;
    let tiltFrame = 0;

    const accentOf = (pv: HTMLElement | null) => (pv ? getComputedStyle(pv).getPropertyValue("--p-accent").trim() || "#ffd400" : "");
    const setColor = (pv: HTMLElement | null) => {
      if (pv === curPv) return;
      curPv = pv;
      if (pv) html.style.setProperty("--fx", accentOf(pv)); else html.style.removeProperty("--fx");
    };

    const loop = () => {
      raf = 0;
      if (!ring) return;
      pos.rx += (pos.x - pos.rx) * 0.22;
      pos.ry += (pos.y - pos.ry) * 0.22;
      ring.style.transform = `translate3d(${pos.rx}px, ${pos.ry}px, 0)`;
      if (Math.abs(pos.x - pos.rx) > 0.3 || Math.abs(pos.y - pos.ry) > 0.3) raf = requestAnimationFrame(loop);
    };

    const burst = (x: number, y: number, color: string, mode: "burst" | "pow" | "wave", touch: boolean) => {
      if (layer.childElementCount > 70) return;
      const add = (el: HTMLElement) => { layer.appendChild(el); el.addEventListener("animationend", () => el.remove(), { once: true }); setTimeout(() => el.remove(), 1200); };
      const wave = document.createElement("i");
      wave.className = "fx-wave"; wave.style.left = `${x}px`; wave.style.top = `${y}px`; wave.style.setProperty("--c", color);
      add(wave);
      if (mode === "wave") return;
      const n = mode === "pow" ? 14 : touch ? 7 : 10;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
        const d = 34 + Math.random() * (mode === "pow" ? 90 : 56);
        const s = document.createElement("i");
        s.className = "fx-spark";
        s.style.left = `${x}px`; s.style.top = `${y}px`;
        s.style.setProperty("--dx", `${Math.cos(a) * d}px`); s.style.setProperty("--dy", `${Math.sin(a) * d}px`);
        s.style.setProperty("--sz", `${5 + Math.random() * 7}px`); s.style.setProperty("--rot", `${(Math.random() - 0.5) * 360}deg`);
        s.style.setProperty("--c", i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? color : "#e11d2e");
        add(s);
      }
      if (mode === "pow") {
        const p = document.createElement("span");
        p.className = "fx-pow"; p.textContent = WORDS[Math.floor(Math.random() * WORDS.length)];
        p.style.left = `${x}px`; p.style.top = `${y}px`; p.style.setProperty("--r", `${-12 + Math.random() * 24}deg`);
        add(p);
      }
    };

    const onMove = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || !t.closest) return;
      pos.x = e.clientX; pos.y = e.clientY;
      const pv = t.closest<HTMLElement>(".pv");
      setColor(pv);

      if (ring && dot && e.pointerType === "mouse") {
        const wantsRing = !pv || pv.dataset.cursor === "ring";
        html.classList.toggle("fx-on", wantsRing);
        dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        const kind = t.closest(TEXTUAL) ? "text" : t.closest(INTERACTIVE) ? "link" : "idle";
        if (ring.dataset.kind !== kind) ring.dataset.kind = kind;
        if (!raf) raf = requestAnimationFrame(loop);
      }

      // 3D tilt (mouse only)
      if (e.pointerType === "mouse") {
        const el = t.closest<HTMLElement>(TILT);
        if (el !== tiltEl) { if (tiltEl) resetTilt(tiltEl); tiltEl = el; if (el) el.classList.add("tilt-glare"); }
        if (el && !tiltFrame) {
          tiltFrame = requestAnimationFrame(() => {
            tiltFrame = 0;
            const r = el.getBoundingClientRect();
            const px = (pos.x - r.left) / r.width, py = (pos.y - r.top) / r.height;
            const max = el.dataset.tilt === "strong" ? 10 : 6;
            el.style.setProperty("--ry", `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
            el.style.setProperty("--rx", `${(-(py - 0.5) * 2 * max).toFixed(2)}deg`);
            el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
            el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
          });
        }
      }
    };
    const resetTilt = (el: HTMLElement) => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); };

    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || !t.closest) return;
      if (ring && e.pointerType === "mouse") ring.dataset.press = "1";
      if (t.closest(NO_FX)) return;
      const pv = t.closest<HTMLElement>(".pv");
      let mode: "burst" | "pow" | "wave" | "none" = "burst";
      if (pv) { const m = pv.dataset.clickfx; mode = m === "pow" || m === "burst" || m === "wave" ? m : "none"; }
      else if (t.closest("[data-fx='pow']")) mode = "pow";
      if (mode === "none") return;
      burst(e.clientX, e.clientY, pv ? accentOf(pv) : "#ffd400", mode, e.pointerType !== "mouse");
    };
    const onUp = () => { if (ring) ring.dataset.press = "0"; };
    const onLeave = () => html.classList.remove("fx-on");
    const onOut = (e: PointerEvent) => { if (tiltEl && !tiltEl.contains(e.relatedTarget as Node | null)) { resetTilt(tiltEl); tiltEl = null; } };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerout", onOut);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf); cancelAnimationFrame(tiltFrame);
      layer.remove(); ring?.remove(); dot?.remove();
      html.classList.remove("fx-on"); html.style.removeProperty("--fx");
    };
  }, []);
  return null;
}
