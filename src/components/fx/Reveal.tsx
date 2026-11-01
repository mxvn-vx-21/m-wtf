"use client";
import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Scroll-reveal. Content is fully visible in the server HTML (no flash, works without JS); on mount only the
 * elements that start BELOW the fold are hidden and then animated in as they scroll into view.
 */
export function Reveal({ children, delay = 0, className = "", as: Tag = "div", tilt, style }: { children: ReactNode; delay?: number; className?: string; as?: ElementType; tilt?: boolean | "strong"; style?: CSSProperties }) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"ssr" | "hidden" | "shown">("ssr");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already on screen → leave it alone
    setState("hidden");
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { setState("shown"); io.disconnect(); } }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${className}`} data-state={state === "ssr" ? undefined : state} data-tilt={tilt ? (tilt === "strong" ? "strong" : "") : undefined} style={{ ...style, ["--d" as string]: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
