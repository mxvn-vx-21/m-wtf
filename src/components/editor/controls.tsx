"use client";
import { useEffect, useId, useState, type ReactNode } from "react";

const input = "field !min-h-10 !px-3 !py-2 !text-[.95rem]";

export function FieldRow({ label, error, hint, id, children, right }: { label: string; error?: string; hint?: string; id: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="hud text-[.62rem] text-zinc-400">{label}</label>
        {right}
      </div>
      {children}
      {error ? <p id={`${id}-err`} role="alert" className="text-xs font-semibold text-red-400">{error}</p> : hint ? <p id={`${id}-hint`} className="text-xs text-mute">{hint}</p> : null}
    </div>
  );
}

export function TextField({ label, value, onChange, error, hint, max, placeholder, type = "text", multiline, rows = 4, inputMode }: {
  label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; max?: number; placeholder?: string; type?: string; multiline?: boolean; rows?: number; inputMode?: "text" | "url" | "numeric";
}) {
  const id = useId();
  const common = { id, value, placeholder, "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-err` : hint ? `${id}-hint` : undefined, className: input } as const;
  return (
    <FieldRow label={label} id={id} error={error} hint={hint} right={max ? <span className={`text-[11px] tabular-nums ${value.length > max ? "text-red-400" : "text-zinc-500"}`}>{value.length}/{max}</span> : undefined}>
      {multiline
        ? <textarea {...common} rows={rows} onChange={(e) => onChange(e.target.value)} />
        : <input {...common} type={type} inputMode={inputMode} autoComplete="off" spellCheck={type === "url" ? false : undefined} onChange={(e) => onChange(e.target.value)} />}
    </FieldRow>
  );
}

export function SelectField<T extends string>({ label, value, onChange, options, error }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; error?: string }) {
  const id = useId();
  return (
    <FieldRow label={label} id={id} error={error}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className={input} aria-invalid={Boolean(error)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FieldRow>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-zinc-200">{label}</label>
        {hint && <p className="text-xs text-mute">{hint}</p>}
      </div>
      <button id={id} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition ${checked ? "border-spark bg-spark" : "border-line bg-ink"}`}>
        <span className={`absolute top-0.5 rounded-full transition-all ${checked ? "left-[22px] bg-black" : "left-0.5 bg-zinc-400"}`} style={{ width: 18, height: 18 }} />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <div className="space-y-1.5" role="radiogroup" aria-labelledby={id}>
      <span id={id} className="hud text-[.62rem] text-zinc-400">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
            className={`rounded-lg border px-3 py-1.5 hud text-[.62rem] transition ${value === o.value ? "border-spark bg-spark/15 text-spark" : "border-line text-zinc-300 hover:border-zinc-500"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RangeField({ label, value, min, max, step = 1, onChange, format, error }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string; error?: string }) {
  const id = useId();
  return (
    <FieldRow label={label} id={id} error={error} right={<span className="text-xs tabular-nums text-zinc-400">{format ? format(value) : value}</span>}>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-7 w-full accent-[#ffd400]" />
    </FieldRow>
  );
}

/** Native colour picker + hex text box. Invalid hex is held locally until it becomes valid. */
export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const valid = /^#[0-9a-fA-F]{6}$/.test(text);
  return (
    <FieldRow label={label} id={id} error={valid ? undefined : "Use a hex colour like #ff2d2d."}>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`${label} colour picker`} value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="size-10 shrink-0 cursor-pointer rounded-lg border border-line bg-ink p-1" />
        <input id={id} value={text} onChange={(e) => { setText(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value.toLowerCase()); }} className={`${input} font-mono`} maxLength={7} spellCheck={false} aria-invalid={!valid} />
      </div>
    </FieldRow>
  );
}

export function Section({ title, icon, children, defaultOpen = true }: { title: string; icon?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 hud text-[.66rem] text-zinc-200 hover:bg-white/5">
        {icon}{title}<span className="ml-auto text-zinc-500 transition group-open:rotate-180" aria-hidden>▾</span>
      </summary>
      <div className="space-y-4 px-4 pb-5 pt-1">{children}</div>
    </details>
  );
}
