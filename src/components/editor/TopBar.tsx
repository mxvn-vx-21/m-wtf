"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/profile/icons";
import { CopyLinkButton, QrButton } from "../ShareTools";
import { isDirty, useEditor, useEditorApi, type SaveState } from "./store";

const STATE: Record<SaveState, { text: string; cls: string }> = {
  saved: { text: "Saved", cls: "text-emerald-300" },
  dirty: { text: "Unsaved changes", cls: "text-yellow-200" },
  saving: { text: "Saving…", cls: "text-zinc-300" },
  error: { text: "Not saved", cls: "text-red-300" },
  invalid: { text: "Fix errors to save", cls: "text-red-300" },
  conflict: { text: "Reload needed", cls: "text-red-300" },
};

export function TopBar({ onBack }: { onBack: () => void }) {
  const api = useEditorApi();
  const saveState = useEditor((s) => s.saveState);
  const message = useEditor((s) => s.message);
  const published = useEditor((s) => s.published);
  const matches = useEditor((s) => s.publishedMatches);
  const publishing = useEditor((s) => s.publishing);
  const saving = useEditor((s) => s.saving);
  const dirty = useEditor((s) => s.version !== s.savedVersion);
  const device = useEditor((s) => s.device);
  const url = useEditor((s) => s.profileUrl);
  const [menu, setMenu] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const st = STATE[saveState];

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) return void (e.key === "Escape" && setMenu(false));
      if (wrap.current && !wrap.current.contains(e.target as Node)) setMenu(false);
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("mousedown", close); window.removeEventListener("keydown", close); };
  }, [menu]);

  async function preview() {
    // Open the tab synchronously (avoids popup blockers), then point it at the saved draft.
    const w = window.open("about:blank", "_blank");
    if (isDirty(api.getState())) await api.getState().save();
    const ok = api.getState().saveState === "saved";
    if (w) { if (ok) w.location.href = "/dashboard/preview"; else w.close(); }
  }

  const publishLabel = !published ? "Publish" : matches ? "Published" : "Publish changes";
  const publishDisabled = publishing || saving || (published && matches);

  return (
    <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-line bg-ink px-2 sm:gap-3 sm:px-4">
      <Link href="/dashboard" onClick={(e) => { if (isDirty(api.getState())) { e.preventDefault(); onBack(); } }} className="flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1 text-sm font-bold text-zinc-300 hover:text-white" aria-label="Back to dashboard">
        <span aria-hidden>←</span>
        <span className="hidden font-display text-sm tracking-[.16em] sm:inline">MARVEL<span className="text-hero">.</span>WTF</span>
      </Link>

      <div className="min-w-0 flex-1 text-center" aria-live="polite">
        <span className={`truncate hud text-[.62rem]r ${st.cls}`}>{saveState === "saved" && published && !matches ? "Saved · not published" : st.text}</span>
        {message && <span className="hidden truncate text-xs text-mute md:inline"> — {message}</span>}
      </div>

      <div className="hidden items-center gap-1 rounded-lg border border-line p-0.5 lg:flex" role="group" aria-label="Preview device">
        {(["phone", "desktop"] as const).map((d) => (
          <button key={d} type="button" aria-pressed={device === d} onClick={() => api.getState().setDevice(d)} className={`rounded-md px-2.5 py-1 hud text-[.6rem] ${device === d ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}>{d === "phone" ? "Phone" : "Desktop"}</button>
        ))}
      </div>

      <div className="relative" ref={wrap}>
        <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="true" aria-label="Share" className="btn btn-ghost !min-h-10 !px-0 size-10"><Icon name="share" size={17} /></button>
        {menu && (
          <div className="absolute right-0 top-12 z-50 w-60 space-y-2 rounded-xl border border-line bg-panel p-3 shadow-2xl">
            <p className="break-all text-xs text-mute">{url.replace(/^https?:\/\//, "")}</p>
            {!published && <p className="text-xs text-yellow-200">Not published yet — the link will 404 until you publish.</p>}
            <CopyLinkButton url={url} className="w-full" />
            <QrButton url={url} className="w-full" />
            {published && (
              <button type="button" disabled={publishing} onClick={async () => { await api.getState().unpublish(); setMenu(false); }} className="w-full rounded-lg border border-red-500/50 px-3 py-2 hud text-[.62rem] text-red-300 hover:bg-red-500/10 disabled:opacity-60">Unpublish</button>
            )}
          </div>
        )}
      </div>

      <button type="button" onClick={preview} aria-label="Preview as a visitor" className="btn btn-ghost !min-h-10 !px-0 size-10 sm:!w-auto sm:!px-3">
        <Icon name="eye" size={17} /><span className="hidden hud text-[.64rem] sm:inline">Preview</span>
      </button>
      <button type="button" onClick={() => void api.getState().save()} disabled={saving || (!dirty && saveState === "saved")} className="btn btn-ghost !min-h-10 !px-3 !text-[.64rem]">
        {saving ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={() => void api.getState().publish()} disabled={publishDisabled} aria-busy={publishing}
        className="btn btn-primary !min-h-10 !px-3 !text-[.64rem] sm:!px-4">
        {publishing ? "Publishing…" : publishLabel}
      </button>
    </header>
  );
}
