"use client";
import { createContext, useContext } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import { getBlockDef, validateSettings } from "@/profile/blocks/registry";
import { defaultBlock, draftSchema, identitySchema, type DocBlock, type Identity } from "@/profile/doc";
import { cloneTheme, presetById, type ThemeConfig } from "@/profile/theme";
import type { Plan } from "@/profile/theme";

export type SaveState = "saved" | "dirty" | "saving" | "error" | "invalid" | "conflict";
export type Panel = "block" | "theme";
export type MobileTab = "preview" | "blocks" | "panel";

export interface EditorInit {
  username: string;
  plan: Plan;
  profileUrl: string;
  revision: number;
  identity: Identity;
  avatarUrl: string | null;
  bannerUrl: string | null;
  theme: ThemeConfig;
  blocks: DocBlock[];
  published: boolean;
  publishedMatches: boolean;
}

export interface EditorState extends EditorInit {
  version: number;
  savedVersion: number;
  selectedId: string | null;
  saveState: SaveState;
  message: string | null;
  saving: boolean;
  publishing: boolean;
  panel: Panel;
  mobileTab: MobileTab;
  device: "phone" | "desktop";
  undo: { block: DocBlock; index: number } | null;
  toast: string | null;

  select: (id: string | null) => void;
  setPanel: (p: Panel) => void;
  setMobileTab: (t: MobileTab) => void;
  setDevice: (d: "phone" | "desktop") => void;
  setIdentity: (patch: Partial<Identity>) => void;
  setAvatarUrl: (u: string | null) => void;
  setBannerUrl: (u: string | null) => void;
  addBlock: (type: string) => void;
  updateBlock: (id: string, patch: Record<string, unknown>) => void;
  setVisible: (id: string, v: boolean) => void;
  removeBlock: (id: string) => void;
  undoRemove: () => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (id: string, dir: -1 | 1) => void;
  reorder: (activeId: string, overId: string) => void;
  patchTheme: <K extends Exclude<keyof ThemeConfig, "presetId">>(section: K, patch: Partial<ThemeConfig[K]>) => void;
  applyPreset: (id: string) => void;
  save: () => Promise<boolean>;
  publish: () => Promise<boolean>;
  unpublish: () => Promise<boolean>;
  dismissToast: () => void;
}

export const isDirty = (s: Pick<EditorState, "version" | "savedVersion" | "saving">) => s.version !== s.savedVersion || s.saving;

/** All validation errors in the current document (client-side mirror of the server's rules). */
export function validateDoc(s: Pick<EditorState, "identity" | "blocks">) {
  const identity = identitySchema.safeParse(s.identity);
  const identityErrors: Record<string, string> = {};
  if (!identity.success) for (const i of identity.error.issues) identityErrors[String(i.path[0] ?? "_")] ??= i.message;
  const blockErrors: Record<string, Record<string, string>> = {};
  for (const b of s.blocks) {
    const v = validateSettings(b.type, b.settings);
    if (!v.ok) blockErrors[b.id] = v.errors;
  }
  const count = Object.keys(identityErrors).length + Object.keys(blockErrors).length;
  const firstBlock = s.blocks.find((b) => blockErrors[b.id])?.id ?? null;
  return { identityErrors, blockErrors, count, firstBlock };
}

async function callJson(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  let j: { ok?: boolean; error?: string; code?: string; details?: Record<string, string>; [k: string]: unknown } = {};
  try { j = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, ok: res.ok && j.ok === true, j };
}

export function createEditorStore(init: EditorInit): StoreApi<EditorState> {
  return createStore<EditorState>((set, get) => {
    const touch = (patch: Partial<EditorState>) => set((s) => ({ ...patch, version: s.version + 1, saveState: s.saveState === "conflict" ? "conflict" : "dirty", message: null }));

    return {
      ...init,
      version: 0,
      savedVersion: 0,
      selectedId: init.blocks[0]?.id ?? null,
      saveState: "saved",
      message: null,
      saving: false,
      publishing: false,
      panel: "block",
      mobileTab: "preview",
      device: "phone",
      undo: null,
      toast: null,

      select: (id) => set({ selectedId: id, ...(id ? { panel: "block" as Panel } : {}) }),
      setPanel: (panel) => set({ panel }),
      setMobileTab: (mobileTab) => set({ mobileTab }),
      setDevice: (device) => set({ device }),
      dismissToast: () => set({ toast: null }),

      setIdentity: (patch) => touch({ identity: { ...get().identity, ...patch } }),
      // Avatar/banner uploads are saved by the upload endpoint itself (draft only); they just refresh the preview.
      setAvatarUrl: (avatarUrl) => set((s) => ({ avatarUrl, publishedMatches: s.published ? false : s.publishedMatches })),
      setBannerUrl: (bannerUrl) => set((s) => ({ bannerUrl, publishedMatches: s.published ? false : s.publishedMatches })),

      addBlock: (type) => {
        const s = get();
        const def = getBlockDef(type);
        if (!def) return;
        if (def.maxPerProfile && s.blocks.filter((b) => b.type === type).length >= def.maxPerProfile) {
          return set({ toast: `Only ${def.maxPerProfile} ${def.label} block allowed.` });
        }
        if (s.blocks.length >= 40) return set({ toast: "Up to 40 blocks per profile." });
        const block = defaultBlock(type);
        if (!block) return;
        const at = type === "header" ? 0 : (() => { const i = s.blocks.findIndex((b) => b.id === s.selectedId); return i === -1 ? s.blocks.length : i + 1; })();
        const blocks = [...s.blocks.slice(0, at), block, ...s.blocks.slice(at)];
        touch({ blocks, selectedId: block.id, panel: "block", mobileTab: "panel" });
      },

      updateBlock: (id, patch) =>
        touch({ blocks: get().blocks.map((b) => (b.id === id ? { ...b, settings: { ...b.settings, ...patch } } : b)) }),

      setVisible: (id, visible) => touch({ blocks: get().blocks.map((b) => (b.id === id ? { ...b, visible } : b)) }),

      removeBlock: (id) => {
        const s = get();
        const index = s.blocks.findIndex((b) => b.id === id);
        if (index === -1) return;
        const next = s.blocks.filter((b) => b.id !== id);
        // Undo instead of a confirm dialog: deleting is instant and reversible.
        touch({ blocks: next, undo: { block: s.blocks[index], index }, selectedId: s.selectedId === id ? (next[Math.min(index, next.length - 1)]?.id ?? null) : s.selectedId });
      },

      undoRemove: () => {
        const s = get();
        if (!s.undo) return;
        const blocks = [...s.blocks];
        blocks.splice(Math.min(s.undo.index, blocks.length), 0, s.undo.block);
        touch({ blocks, selectedId: s.undo.block.id, undo: null });
      },

      duplicateBlock: (id) => {
        const s = get();
        const i = s.blocks.findIndex((b) => b.id === id);
        const src = s.blocks[i];
        if (!src) return;
        const def = getBlockDef(src.type);
        if (def?.maxPerProfile && s.blocks.filter((b) => b.type === src.type).length >= def.maxPerProfile) return set({ toast: `Only ${def.maxPerProfile} ${def.label} block allowed.` });
        if (s.blocks.length >= 40) return set({ toast: "Up to 40 blocks per profile." });
        const copy: DocBlock = { ...src, id: crypto.randomUUID(), settings: JSON.parse(JSON.stringify(src.settings)) };
        const blocks = [...s.blocks.slice(0, i + 1), copy, ...s.blocks.slice(i + 1)];
        touch({ blocks, selectedId: copy.id });
      },

      moveBlock: (id, dir) => {
        const s = get();
        const i = s.blocks.findIndex((b) => b.id === id);
        const j = i + dir;
        if (i === -1 || j < 0 || j >= s.blocks.length) return;
        touch({ blocks: arrayMove(s.blocks, i, j) });
      },

      reorder: (activeId, overId) => {
        const s = get();
        const from = s.blocks.findIndex((b) => b.id === activeId);
        const to = s.blocks.findIndex((b) => b.id === overId);
        if (from === -1 || to === -1 || from === to) return;
        touch({ blocks: arrayMove(s.blocks, from, to) });
      },

      patchTheme: (section, patch) => touch({ theme: { ...get().theme, [section]: { ...get().theme[section], ...patch } } }),
      applyPreset: (id) => {
        const p = presetById(id);
        if (p) touch({ theme: cloneTheme(p.theme) });
      },

      save: async () => {
        const s = get();
        if (s.saveState === "conflict") return false;
        if (s.saving) return false;
        const v = validateDoc(s);
        if (v.count > 0) {
          set({ saveState: "invalid", message: `Fix ${v.count} issue${v.count > 1 ? "s" : ""} to save.`, ...(v.firstBlock ? { selectedId: v.firstBlock, panel: "block" as Panel } : {}) });
          return false;
        }
        const sent = s.version;
        set({ saving: true, saveState: "saving", message: null });
        try {
          const body = { baseRevision: s.revision, identity: s.identity, theme: s.theme, blocks: s.blocks };
          const parsed = draftSchema.safeParse(body);
          if (!parsed.success) { set({ saving: false, saveState: "invalid", message: parsed.error.issues[0]?.message ?? "Invalid profile." }); return false; }
          const r = await callJson("/api/profile/draft", "PUT", body);
          if (r.ok) {
            set((cur) => ({
              saving: false,
              revision: r.j.revision as number,
              publishedMatches: Boolean(r.j.publishedMatches),
              savedVersion: sent,
              saveState: cur.version === sent ? "saved" : "dirty",
              message: null,
            }));
            return true;
          }
          if (r.status === 409) set({ saving: false, saveState: "conflict", message: "This profile was changed in another tab or device. Reload to continue." });
          else if (r.status === 401) set({ saving: false, saveState: "error", message: "You've been logged out. Log in again, then reload." });
          else set({ saving: false, saveState: r.status === 422 ? "invalid" : "error", message: r.j.error ?? "Couldn't save. Please try again." });
          return false;
        } catch {
          set({ saving: false, saveState: "error", message: "Network problem. Your changes are still here — we'll retry." });
          return false;
        }
      },

      publish: async () => {
        if (get().publishing) return false;
        set({ publishing: true });
        try {
          if (isDirty(get())) {
            const ok = await get().save();
            if (!ok) { set({ publishing: false, toast: get().message ?? "Save failed — nothing was published." }); return false; }
          }
          const r = await callJson("/api/profile/publish", "POST");
          if (!r.ok) { set({ publishing: false, toast: r.j.error ?? "Publish failed. Please try again." }); return false; }
          set({ publishing: false, published: true, publishedMatches: true, toast: "Published! Your profile is live." });
          return true;
        } catch {
          set({ publishing: false, toast: "Network problem. Publish failed." });
          return false;
        }
      },

      unpublish: async () => {
        set({ publishing: true });
        try {
          const r = await callJson("/api/profile/publish", "DELETE");
          if (!r.ok) { set({ publishing: false, toast: r.j.error ?? "Couldn't unpublish." }); return false; }
          set({ publishing: false, published: false, publishedMatches: false, toast: "Profile is now private." });
          return true;
        } catch {
          set({ publishing: false, toast: "Network problem. Couldn't unpublish." });
          return false;
        }
      },
    };
  });
}

export const EditorContext = createContext<StoreApi<EditorState> | null>(null);

export function useEditor<T>(selector: (s: EditorState) => T): T {
  const store = useContext(EditorContext);
  if (!store) throw new Error("EditorContext missing");
  return useStore(store, selector);
}
export function useEditorApi(): StoreApi<EditorState> {
  const store = useContext(EditorContext);
  if (!store) throw new Error("EditorContext missing");
  return store;
}
