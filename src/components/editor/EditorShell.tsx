"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getBlockDef } from "@/profile/blocks/registry";
import { Icon } from "@/profile/icons";
import { BlockForm } from "./block-editors";
import { BlocksPanel } from "./BlocksPanel";
import { PreviewPane } from "./PreviewPane";
import { ThemePanel } from "./ThemePanel";
import { TopBar } from "./TopBar";
import { EditorContext, createEditorStore, isDirty, useEditor, useEditorApi, type EditorInit } from "./store";

const AUTOSAVE_MS = 1800;

export function EditorShell({ init }: { init: EditorInit }) {
  const storeRef = useRef<ReturnType<typeof createEditorStore> | null>(null);
  if (!storeRef.current) storeRef.current = createEditorStore(init);
  return (
    <EditorContext.Provider value={storeRef.current}>
      <Editor />
    </EditorContext.Provider>
  );
}

function Editor() {
  const api = useEditorApi();
  const router = useRouter();
  const version = useEditor((s) => s.version);
  const saveState = useEditor((s) => s.saveState);
  const mobileTab = useEditor((s) => s.mobileTab);
  const panel = useEditor((s) => s.panel);
  const [leaving, setLeaving] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);

  // Lightweight autosave. The visible Save button is always available; autosave is a convenience.
  useEffect(() => {
    const s = api.getState();
    if (s.version === s.savedVersion || s.saving || s.saveState === "conflict") return;
    const t = setTimeout(() => void api.getState().save(), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [version, saveState, api]);

  // Warn before closing/reloading the tab with unsaved changes.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (isDirty(api.getState())) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [api]);

  // Ctrl/Cmd+S saves.
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void api.getState().save(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [api]);

  async function saveAndLeave() {
    setLeaveBusy(true);
    const ok = await api.getState().save();
    setLeaveBusy(false);
    if (ok) router.push("/dashboard");
    else setLeaving(false);
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-ink text-zinc-100">
      <TopBar onBack={() => setLeaving(true)} />
      <ConflictBanner />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
        <aside className={`${mobileTab === "blocks" ? "block" : "hidden"} min-h-0 overflow-hidden border-line lg:block lg:border-r`} aria-label="Blocks">
          <BlocksPanel />
        </aside>
        <section className={`${mobileTab === "preview" ? "block" : "hidden"} min-h-0 lg:block`} aria-label="Preview">
          <PreviewPane />
        </section>
        <aside className={`${mobileTab === "panel" ? "flex" : "hidden"} min-h-0 flex-col border-line lg:flex lg:border-l`} aria-label="Settings">
          <div className="flex shrink-0 border-b border-line" role="tablist" aria-label="Settings sections">
            {(["block", "theme"] as const).map((p) => (
              <button key={p} role="tab" aria-selected={panel === p} type="button" onClick={() => api.getState().setPanel(p)} className={`flex-1 px-3 py-3 hud text-[.66rem] ${panel === p ? "border-b-2 border-spark text-spark" : "text-zinc-400 hover:text-white"}`}>
                {p === "block" ? "Block" : "Appearance"}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pb-24 lg:pb-6">{panel === "block" ? <BlockPanel /> : <ThemePanel />}</div>
        </aside>
      </div>

      <MobileNav />
      <Toast />
      {leaving && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4" role="alertdialog" aria-modal="true" aria-labelledby="leave-title">
          <div className="glass hud-corners w-full max-w-sm p-5">
            <h2 id="leave-title" className="text-2xl">Unsaved changes</h2>
            <p className="mt-2 text-sm text-zinc-300">You have changes that haven&apos;t been saved yet.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" disabled={leaveBusy} onClick={saveAndLeave} className="rounded-lg bg-hero px-4 py-2.5 hud text-[.64rem] text-white shadow-[3px_3px_0_#ffd400] disabled:opacity-60" autoFocus>{leaveBusy ? "Saving…" : "Save & leave"}</button>
              <button type="button" disabled={leaveBusy} onClick={() => { router.push("/dashboard"); }} className="rounded-lg border border-red-500/50 px-4 py-2.5 hud text-[.64rem] text-red-300 hover:bg-red-500/10">Discard</button>
              <button type="button" disabled={leaveBusy} onClick={() => setLeaving(false)} className="rounded-lg border border-line px-4 py-2.5 hud text-[.64rem] hover:border-zinc-500">Keep editing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BlockPanel() {
  const block = useEditor((s) => s.blocks.find((b) => b.id === s.selectedId) ?? null);
  const hasBlocks = useEditor((s) => s.blocks.length > 0);
  if (!block) {
    return (
      <div className="p-6 text-center text-sm text-mute">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full border border-line text-zinc-400"><Icon name="layers" size={22} /></div>
        {hasBlocks ? "Select a block in the preview or the Blocks list to edit it." : "Add your first block from the Blocks panel."}
      </div>
    );
  }
  const def = getBlockDef(block.type);
  return (
    <div>
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-spark/15 text-spark"><Icon name={def?.icon ?? "link"} size={16} /></span>
        <div>
          <h2 className="text-xl">{def?.label}</h2>
          <p className="text-xs text-mute">{def?.description}</p>
        </div>
      </div>
      <div className="p-4"><BlockForm key={block.id} block={block} /></div>
    </div>
  );
}

function MobileNav() {
  const api = useEditorApi();
  const tab = useEditor((s) => s.mobileTab);
  const panel = useEditor((s) => s.panel);
  const items = [
    { k: "preview", label: "Preview", icon: "eye", on: () => api.getState().setMobileTab("preview") },
    { k: "blocks", label: "Blocks", icon: "layers", on: () => api.getState().setMobileTab("blocks") },
    { k: "block", label: "Edit", icon: "sliders", on: () => { api.getState().setPanel("block"); api.getState().setMobileTab("panel"); } },
    { k: "theme", label: "Theme", icon: "palette", on: () => { api.getState().setPanel("theme"); api.getState().setMobileTab("panel"); } },
  ];
  const active = tab === "panel" ? panel : tab;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Editor sections">
      {items.map((i) => (
        <button key={i.k} type="button" onClick={i.on} aria-current={active === i.k ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 hud text-[.55rem] ${active === i.k ? "text-spark" : "text-zinc-400"}`}>
          <Icon name={i.icon} size={20} />{i.label}
        </button>
      ))}
    </nav>
  );
}

function Toast() {
  const api = useEditorApi();
  const toast = useEditor((s) => s.toast);
  const undo = useEditor((s) => s.undo);
  const version = useEditor((s) => s.version);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => api.getState().dismissToast(), 4500);
    return () => clearTimeout(t);
  }, [toast, api]);
  // The undo offer lasts a few seconds after a delete.
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => api.setState({ undo: null }), 7000);
    return () => clearTimeout(t);
  }, [undo, version, api]);

  if (!toast && !undo) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex justify-center px-3 lg:bottom-6" role="status" aria-live="polite">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3 text-sm shadow-2xl">
        <span>{undo ? "Block deleted." : toast}</span>
        {undo && <button type="button" onClick={() => api.getState().undoRemove()} className="font-extrabold uppercase tracking-wide text-spark hover:underline">Undo</button>}
        {!undo && <button type="button" onClick={() => api.getState().dismissToast()} aria-label="Dismiss" className="text-zinc-400 hover:text-white"><Icon name="x" size={14} /></button>}
      </div>
    </div>
  );
}

function ConflictBanner() {
  const state = useEditor((s) => s.saveState);
  const message = useEditor((s) => s.message);
  if (state !== "conflict" && state !== "error") return null;
  return (
    <div role="alert" className="flex flex-wrap items-center justify-center gap-3 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-200">
      <span>{message}</span>
      {state === "conflict" && <button type="button" onClick={() => window.location.reload()} className="rounded border border-red-400/60 px-2 py-1 font-extrabold uppercase tracking-wide hover:bg-red-500/20">Reload</button>}
    </div>
  );
}
