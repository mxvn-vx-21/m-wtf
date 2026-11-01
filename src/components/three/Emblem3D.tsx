"use client";
import { useEffect, useRef, useState } from "react";
import { fallbackPath, type EmblemModel } from "@/three/shapes";
import type { EmblemHandle } from "@/three/emblem";

/** Static silhouette shown while three.js loads, when WebGL is unavailable, and for SSR (no layout shift). */
export function EmblemFallback({ model, accent }: { model: EmblemModel; accent: string }) {
  return (
    <svg viewBox="-9 -11 18 22" className="emblem-fallback" aria-hidden focusable="false" style={{ ["--ec" as string]: accent }}>
      <path d={fallbackPath(model)} fill="none" stroke="var(--ec)" strokeWidth="0.35" strokeLinejoin="round" fillRule="evenodd" />
      <path d={fallbackPath(model)} fill="var(--ec)" opacity="0.12" fillRule="evenodd" />
    </svg>
  );
}

/**
 * Interactive 3D emblem. three.js (~150 KB gz) is loaded lazily, only when the element nears the viewport,
 * and is fully disposed on unmount. Drag to spin · click for a shockwave.
 */
export function Emblem3D({ model = "logo", accent = "#e11d2e", interactive = true, className = "", label = "Interactive 3D emblem", look = "glass" }: { model?: EmblemModel; accent?: string; interactive?: boolean; className?: string; label?: string; look?: "glass" | "chrome" | "obsidian" }) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<EmblemHandle | null>(null);
  const accentRef = useRef(accent);
  const [ready, setReady] = useState(false);
  accentRef.current = accent;

  useEffect(() => {
    const el = host.current;
    if (!el || typeof IntersectionObserver === "undefined") return; // SSR / jsdom: keep the SVG fallback
    let alive = true;
    let started = false;
    setReady(false);
    const boot = async () => {
      started = true;
      try {
        const mod = await import("@/three/emblem");
        if (!alive) return;
        const h = mod.createEmblem(el, { model, accent: accentRef.current, interactive, look });
        if (!h) return; // stay on the SVG fallback
        handle.current = h;
        setReady(true);
      } catch { /* fallback stays */ }
    };
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && !started) { io.disconnect(); void boot(); } }, { rootMargin: "240px" });
    io.observe(el);
    return () => { alive = false; io.disconnect(); handle.current?.dispose(); handle.current = null; };
  }, [model, interactive, look]);

  useEffect(() => { handle.current?.setAccent(accent); }, [accent]);

  return (
    <div ref={host} className={`emblem ${className}`} role="img" aria-label={label} data-ready={ready}>
      <div className="emblem-fallback-wrap" style={{ opacity: ready ? 0 : 1 }}><EmblemFallback model={model} accent={accent} /></div>
    </div>
  );
}
