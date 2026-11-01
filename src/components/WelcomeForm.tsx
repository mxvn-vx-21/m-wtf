"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PRESETS } from "@/profile/theme";
import { Alert, Button, Field, Input } from "./ui";
import { ThemeSwatch } from "./editor/ThemeSwatch";

export function WelcomeForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [presetId, setPresetId] = useState("hero");
  const [busy, setBusy] = useState<"go" | "skip" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();

  async function send(body: object, kind: "go" | "skip") {
    setBusy(kind);
    setError(null);
    setFieldError(undefined);
    try {
      const res = await fetch("/api/profile/onboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = (await res.json()) as { ok: boolean; error?: string; details?: Record<string, string> };
      if (!j.ok) {
        setFieldError(j.details?.displayName);
        setError(j.details?.displayName ? null : (j.error ?? "Something went wrong."));
        setBusy(null);
        return;
      }
      router.replace("/dashboard/editor");
    } catch {
      setError("Network problem. Check your connection and try again.");
      setBusy(null);
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void send({ displayName: name, presetId }, "go"); }} className="space-y-6">
      {error && <Alert kind="error">{error}</Alert>}
      <Field label="Display name" id="displayName" error={fieldError}>
        <Input id="displayName" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required autoFocus />
      </Field>
      <fieldset>
        <legend className="hud mb-2 text-[.66rem] text-zinc-400">Starting look</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PRESETS.map((p) => (
            <label key={p.id} data-tilt="" className={`cursor-pointer rounded-2xl border-2 p-2 transition-colors ${presetId === p.id ? "border-spark bg-spark/8 shadow-[0_0_28px_-8px_rgba(255,212,0,.5)]" : "border-line hover:border-zinc-500"}`}>
              <input type="radio" name="preset" value={p.id} checked={presetId === p.id} onChange={() => setPresetId(p.id)} className="sr-only" />
              <ThemeSwatch theme={p.theme} />
              <span className="font-display mt-2 block text-xl leading-none">{p.name}</span>
              <span className="mt-1 block text-sm text-mute">{p.tagline}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={busy === "go"} disabled={busy !== null}>{busy === "go" ? "Setting up…" : "Open the builder"}</Button>
        <button type="button" disabled={busy !== null} onClick={() => void send({ skip: true }, "skip")} className="text-sm text-mute underline hover:text-white disabled:opacity-50">Skip for now</button>
      </div>
    </form>
  );
}
