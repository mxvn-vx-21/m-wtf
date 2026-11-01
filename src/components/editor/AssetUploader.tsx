"use client";
import { useRef, useState } from "react";
import { shrinkImage } from "@/lib/shrink";
import { Icon } from "@/profile/icons";

type Kind = "avatar" | "banner" | "image";

/** Uploads through /api/upload/<kind> (type, size and magic-byte validated server-side). */
export function AssetUploader({ kind, value, onChange, label, round, canRemove }: { kind: Kind; value: string | null; onChange: (url: string | null) => void; label: string; round?: boolean; canRemove?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"up" | "rm" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload(file: File) {
    setBusy("up");
    setMsg(null);
    try {
      const body = new FormData();
      body.set("file", await shrinkImage(file, kind));
      const res = await fetch(`/api/upload/${kind}`, { method: "POST", body });
      const j = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!j.ok || !j.url) setMsg({ ok: false, text: j.error ?? "Upload failed." });
      else { onChange(j.url); setMsg({ ok: true, text: "Uploaded." }); }
    } catch {
      setMsg({ ok: false, text: "Upload failed. Check your connection and try again." });
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setBusy("rm");
    setMsg(null);
    try {
      const res = await fetch(`/api/upload/${kind}`, { method: "DELETE" });
      const j = (await res.json()) as { ok: boolean; error?: string };
      if (!j.ok) setMsg({ ok: false, text: j.error ?? "Couldn't remove it." });
      else onChange(null);
    } catch { setMsg({ ok: false, text: "Network problem." }); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-2">
      <span className="hud text-[.62rem] text-zinc-400">{label}</span>
      <div className="flex items-center gap-3">
        <div className={`grid shrink-0 place-items-center overflow-hidden border border-line bg-ink text-zinc-500 ${round ? "size-16 rounded-full" : "h-16 w-28 rounded-lg"}`}>
          {value ? <img src={value} alt="" className="size-full object-cover" /> : <Icon name="image" size={22} />}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label={`Upload ${label}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
          <button type="button" disabled={busy !== null} onClick={() => input.current?.click()} className="rounded-lg border border-line px-3 py-1.5 hud text-[.62rem] hover:border-zinc-500 disabled:opacity-60">
            {busy === "up" ? "Uploading…" : value ? "Replace" : "Upload"}
          </button>
          {canRemove && value && (
            <button type="button" disabled={busy !== null} onClick={remove} className="rounded-lg border border-red-500/50 px-3 py-1.5 hud text-[.62rem] text-red-300 hover:bg-red-500/10 disabled:opacity-60">
              {busy === "rm" ? "Removing…" : "Remove"}
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-mute">PNG, JPEG or WebP · resized automatically</p>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-xs font-semibold ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>}
    </div>
  );
}
