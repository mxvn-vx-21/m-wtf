import { z } from "zod";
import { getBlockDef, validateSettings } from "./blocks/registry";
import type { IdentityView } from "./blocks/types";
import { line, mediaOwner, para } from "./text";
import { themeSchema, type ThemeConfig } from "./theme";

/**
 * DRAFT → PUBLISH model
 *   profile + profile_block rows  = the DRAFT (what the builder edits, saved with optimistic revisioning)
 *   profile.published (jsonb)     = SNAPSHOT of what visitors see (written only by "Publish")
 * Editing never changes the public page until you publish.
 */

export const MAX_BLOCKS = 40;
export const MAX_BLOCKS_MSG = "Up to 40 blocks per profile.";

export const identitySchema = z.object({
  displayName: line(50).pipe(z.string().min(1, "Display name is required.")),
  bio: para(280, "Bio can be at most 280 characters."),
  status: line(80, "Status can be at most 80 characters."),
});
export type Identity = z.infer<typeof identitySchema>;

const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid block id.");

export const draftSchema = z
  .object({
    baseRevision: z.number().int().min(0),
    identity: identitySchema,
    theme: themeSchema,
    blocks: z
      .array(z.object({ id: uuid, type: z.string().min(1).max(40), visible: z.boolean(), settings: z.record(z.string(), z.unknown()) }))
      .max(MAX_BLOCKS, MAX_BLOCKS_MSG),
  })
  .superRefine((doc, ctx) => {
    const seen = new Set<string>();
    const counts: Record<string, number> = {};
    doc.blocks.forEach((b, i) => {
      if (seen.has(b.id)) ctx.addIssue({ code: "custom", message: "Duplicate block id.", path: ["blocks", i, "id"] });
      seen.add(b.id);
      const def = getBlockDef(b.type);
      if (!def) return ctx.addIssue({ code: "custom", message: `Unknown block type "${b.type}".`, path: ["blocks", i, "type"] });
      counts[b.type] = (counts[b.type] ?? 0) + 1;
      if (def.maxPerProfile && counts[b.type] > def.maxPerProfile)
        ctx.addIssue({ code: "custom", message: `Only ${def.maxPerProfile} ${def.label} block allowed.`, path: ["blocks", i, "type"] });
      const v = validateSettings(b.type, b.settings);
      if (!v.ok) for (const [k, msg] of Object.entries(v.errors)) ctx.addIssue({ code: "custom", message: msg, path: ["blocks", i, "settings", ...k.split(".")] });
    });
  });
export type DraftInput = z.infer<typeof draftSchema>;

export interface DocBlock { id: string; type: string; visible: boolean; settings: Record<string, unknown> }

/* ── Snapshot (what is stored in profile.published and rendered publicly) ────────── */
export interface Snapshot {
  v: 1;
  identity: Identity & { avatarKey: string | null; bannerKey: string | null };
  theme: ThemeConfig;
  blocks: { id: string; type: string; settings: Record<string, unknown> }[]; // visible blocks only, in order
}

export function buildSnapshot(input: {
  identity: Identity;
  avatarKey: string | null;
  bannerKey: string | null;
  theme: ThemeConfig;
  blocks: DocBlock[];
}): Snapshot {
  return {
    v: 1,
    identity: { ...input.identity, avatarKey: input.avatarKey, bannerKey: input.bannerKey },
    theme: input.theme,
    blocks: input.blocks.filter((b) => b.visible).map((b) => ({ id: b.id, type: b.type, settings: b.settings })),
  };
}

export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as object).sort().map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  return JSON.stringify(v) ?? "null";
}
export const snapshotsEqual = (a: unknown, b: unknown) => stableStringify(a) === stableStringify(b);

/* ── ViewModel: everything <ProfileView> needs, free of account data (no email/role/plan) ─ */
export interface ViewBlock { id: string; type: string; visible: boolean; settings: Record<string, unknown> }
export interface ViewModel {
  identity: IdentityView;
  theme: ThemeConfig;
  blocks: ViewBlock[];
}

export const mediaUrl = (key: string | null | undefined) => (key ? `/api/media/${key}` : null);

export function snapshotToView(username: string, s: Snapshot): ViewModel {
  return {
    identity: {
      username,
      displayName: s.identity.displayName,
      bio: s.identity.bio,
      status: s.identity.status,
      avatarUrl: mediaUrl(s.identity.avatarKey),
      bannerUrl: mediaUrl(s.identity.bannerKey),
    },
    theme: s.theme,
    blocks: s.blocks.map((b) => ({ ...b, visible: true })),
  };
}

/** Every media path referenced by a snapshot/draft (used for ownership checks and orphan cleanup). */
export function referencedMedia(theme: ThemeConfig, blocks: { type: string; settings: Record<string, unknown> }[], extraKeys: (string | null)[] = []): Set<string> {
  const out = new Set<string>();
  const add = (src: unknown) => { if (typeof src === "string" && mediaOwner(src)) out.add(src.replace(/^\/api\/media\//, "")); };
  add(theme.background.src);
  for (const b of blocks) if (b.type === "image") add(b.settings.src);
  for (const k of extraKeys) if (k) out.add(k);
  return out;
}

/* ── Profile completion (dashboard nudge) ───────────────────────────────────── */
export interface Completion { percent: number; items: { key: string; label: string; done: boolean }[] }

export function computeCompletion(p: { hasAvatar: boolean; displayName: string; username: string; bio: string; contentBlocks: number; customizedTheme: boolean; published: boolean }): Completion {
  const items = [
    { key: "avatar", label: "Add an avatar", done: p.hasAvatar },
    { key: "name", label: "Set a display name", done: p.displayName.trim().length > 0 && p.customizedTheme },
    { key: "bio", label: "Write a bio", done: p.bio.trim().length > 0 },
    { key: "blocks", label: "Add at least one block", done: p.contentBlocks > 0 },
    { key: "theme", label: "Choose your identity theme", done: p.customizedTheme },
    { key: "publish", label: "Publish your profile", done: p.published },
  ];
  return { percent: Math.round((items.filter((i) => i.done).length / items.length) * 100), items };
}

export function defaultBlock(type: string): DocBlock | null {
  const def = getBlockDef(type);
  if (!def) return null;
  return { id: crypto.randomUUID(), type, visible: true, settings: def.defaults() as Record<string, unknown> };
}
