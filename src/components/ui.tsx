import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { fallbackPath } from "@/three/shapes";

type Variant = "primary" | "ghost" | "danger";

export function Button({ variant = "primary", className = "", loading, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button {...p} disabled={p.disabled || loading} aria-busy={loading || undefined} className={`btn btn-${variant} ${className}`}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

/** Link styled as a button. `pow` adds the comic POW! click reaction. */
export function LinkButton({ href, variant = "primary", className = "", pow, ...p }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant; pow?: boolean }) {
  return <Link href={href} {...p} data-fx={pow ? "pow" : undefined} className={`btn btn-${variant} ${className}`} />;
}

export function Spinner() {
  return <span aria-hidden className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

export function Field({ label, id, hint, error, children }: { label: string; id: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="hud block text-[.66rem] text-zinc-400">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-sm text-mute">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="text-sm font-semibold text-red-400">{error}</p>}
    </div>
  );
}

export const describedBy = (id: string, hasHint: boolean, hasError: boolean) => (hasError ? `${id}-err` : hasHint ? `${id}-hint` : undefined);

export function Input(p: InputHTMLAttributes<HTMLInputElement>) { return <input {...p} className={`field ${p.className ?? ""}`} />; }
export function Textarea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...p} className={`field ${p.className ?? ""}`} />; }
export function Select(p: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...p} className={`field ${p.className ?? ""}`} />; }

export function Alert({ kind, children }: { kind: "error" | "success" | "info"; children: ReactNode }) {
  const c = { error: "border-red-500/50 bg-red-500/10 text-red-200", success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-200", info: "border-spark/40 bg-spark/10 text-yellow-100" }[kind];
  return <div role={kind === "error" ? "alert" : "status"} className={`rounded-xl border px-3.5 py-2.5 text-[.95rem] ${c}`}>{children}</div>;
}

export function Card({ title, children, className = "", tilt }: { title?: string; children: ReactNode; className?: string; tilt?: boolean }) {
  return (
    <section className={`glass hud-corners p-5 sm:p-6 ${className}`} data-tilt={tilt ? "" : undefined}>
      {title && <h2 className="hud mb-4 flex items-center gap-2 text-spark"><span className="size-1.5 rotate-45 bg-hero" aria-hidden />{title}</h2>}
      {children}
    </section>
  );
}

/** The M mark as inline SVG (same outline as the 3D emblem). */
export function LogoMark({ size = 26, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size * 0.86} viewBox="-7 -6 14 12" className={className} aria-hidden focusable="false">
      <defs><linearGradient id="lm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff4757" /><stop offset="1" stopColor="#c8101f" /></linearGradient></defs>
      <path d={fallbackPath("logo")} fill="url(#lm)" stroke="#ffd400" strokeWidth="0.35" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className = "", size = "md", markOnlyOnPhone }: { className?: string; size?: "sm" | "md" | "lg"; markOnlyOnPhone?: boolean }) {
  const t = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" }[size];
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 text-white no-underline ${className}`} aria-label="MARVEL.WTF home">
      <LogoMark size={size === "lg" ? 38 : 28} className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
      <span className={`font-display ${t} leading-none tracking-[.08em] ${markOnlyOnPhone ? "hidden sm:inline" : ""}`}>MARVEL<span className="text-hero">.</span>WTF</span>
    </Link>
  );
}
