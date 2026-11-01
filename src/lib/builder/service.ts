import "server-only";
import { and, eq, gte, notInArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getOwnProfile, type AppUser } from "@/lib/session";
import { usesObjectBucket } from "@/lib/storage";
import { getBlockDef } from "@/profile/blocks/registry";
import {
  buildSnapshot, draftSchema, identitySchema, mediaUrl, referencedMedia, snapshotsEqual, snapshotToView,
  type DocBlock, type Identity, type Snapshot, type ViewModel,
} from "@/profile/doc";
import { mediaOwner } from "@/profile/text";
import { canUse, cloneTheme, presetById, resolveTheme, type ThemeConfig } from "@/profile/theme";
import { defaultBlock } from "@/profile/doc";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: Record<string, string>) {
    super(message);
  }
}

type BlockRow = typeof schema.profileBlock.$inferSelect;
type ProfileRow = typeof schema.profile.$inferSelect;

const toDocBlocks = (rows: BlockRow[]): DocBlock[] => rows.map((r) => ({ id: r.id, type: r.type, visible: r.visible, settings: r.data }));
const identityOf = (p: ProfileRow): Identity => ({ displayName: p.displayName, bio: p.bio, status: p.status });

async function loadBlocks(profileId: string) {
  return getDb().select().from(schema.profileBlock).where(eq(schema.profileBlock.profileId, profileId)).orderBy(schema.profileBlock.position);
}

/** Legacy / brand-new profiles with no saved blocks start with a Profile Header. */
function withDefaultHeader(blocks: DocBlock[], revision: number): DocBlock[] {
  if (blocks.length > 0 || revision > 0) return blocks;
  const h = defaultBlock("header");
  return h ? [h] : [];
}

/* ── Draft ─────────────────────────────────────────────────────────────────── */
export interface DraftState {
  revision: number;
  identity: Identity;
  avatarUrl: string | null;
  bannerUrl: string | null;
  theme: ThemeConfig;
  blocks: DocBlock[];
  published: boolean;
  publishedMatches: boolean;
  publishedAt: string | null;
  onboarded: boolean;
}

function matchesPublished(p: ProfileRow, draft: Snapshot) {
  if (p.visibility !== "PUBLISHED") return false;
  if (!p.published) return true; // legacy V0: public page derives from the draft itself
  return snapshotsEqual(draft, p.published);
}

export async function loadDraft(user: AppUser): Promise<DraftState> {
  const p = await getOwnProfile(user);
  const blocks = withDefaultHeader(toDocBlocks(await loadBlocks(p.id)), p.revision);
  const theme = resolveTheme(p.theme, p.themeId);
  const draftSnap = buildSnapshot({ identity: identityOf(p), avatarKey: p.avatarKey, bannerKey: p.bannerKey, theme, blocks });
  return {
    revision: p.revision,
    identity: identityOf(p),
    avatarUrl: mediaUrl(p.avatarKey),
    bannerUrl: mediaUrl(p.bannerKey),
    theme,
    blocks,
    published: p.visibility === "PUBLISHED",
    publishedMatches: matchesPublished(p, draftSnap),
    publishedAt: p.publishedAt?.toISOString() ?? null,
    onboarded: p.onboardedAt !== null,
  };
}

export async function saveDraft(user: AppUser, raw: unknown): Promise<{ revision: number; publishedMatches: boolean }> {
  const parsed = draftSchema.safeParse(raw);
  if (!parsed.success) {
    const details: Record<string, string> = {};
    for (const i of parsed.error.issues) details[i.path.join(".") || "_"] ??= i.message;
    throw new ApiError(422, "validation", "Some fields are invalid.", details);
  }
  const doc = parsed.data;

  // Premium gating foundation (nothing is gated in V1; flip `requiresPlan` on a block/preset to enforce).
  for (const b of doc.blocks) {
    const def = getBlockDef(b.type)!;
    if (!canUse(user.plan, def.requiresPlan)) throw new ApiError(403, "plan", `${def.label} requires the ${def.requiresPlan} plan.`);
  }
  const preset = presetById(doc.theme.presetId);
  if (preset && !canUse(user.plan, preset.requiresPlan)) throw new ApiError(403, "plan", `The ${preset.name} theme requires the ${preset.requiresPlan} plan.`);

  // Users may only reference THEIR OWN uploaded assets (checked from the server-side session id).
  for (const src of [doc.theme.background.src, ...doc.blocks.filter((b) => b.type === "image").map((b) => b.settings.src)]) {
    if (typeof src !== "string" || !src) continue;
    const owner = mediaOwner(src);
    if (owner && owner !== user.id) throw new ApiError(403, "forbidden_asset", "You can only use your own uploads.");
  }

  const db = getDb();
  const out = await db.transaction(async (tx) => {
    const [p] = await tx
      .update(schema.profile)
      .set({
        displayName: doc.identity.displayName,
        bio: doc.identity.bio,
        status: doc.identity.status,
        theme: doc.theme as unknown as Record<string, unknown>,
        revision: sql`${schema.profile.revision} + 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.profile.userId, user.id), eq(schema.profile.revision, doc.baseRevision)))
      .returning();
    if (!p) throw new ApiError(409, "conflict", "This profile was changed somewhere else. Reload to continue.");

    const ids = doc.blocks.map((b) => b.id);
    if (ids.length === 0) await tx.delete(schema.profileBlock).where(eq(schema.profileBlock.profileId, p.id));
    else await tx.delete(schema.profileBlock).where(and(eq(schema.profileBlock.profileId, p.id), notInArray(schema.profileBlock.id, ids)));

    if (doc.blocks.length) {
      const rows = await tx
        .insert(schema.profileBlock)
        .values(doc.blocks.map((b, i) => ({ id: b.id, profileId: p.id, type: b.type, position: i, data: b.settings, visible: b.visible })))
        .onConflictDoUpdate({
          target: schema.profileBlock.id,
          set: { type: sql`excluded.type`, position: sql`excluded.position`, data: sql`excluded.data`, visible: sql`excluded.visible`, updatedAt: new Date() },
          // A block id that belongs to ANOTHER profile is never touched → count mismatch → whole save rolls back.
          setWhere: eq(schema.profileBlock.profileId, p.id),
        })
        .returning({ id: schema.profileBlock.id });
      if (rows.length !== doc.blocks.length) throw new ApiError(403, "forbidden_block", "Invalid block.");
    }
    return p;
  });

  const draftSnap = buildSnapshot({ identity: doc.identity, avatarKey: out.avatarKey, bannerKey: out.bannerKey, theme: doc.theme, blocks: doc.blocks });
  void gcMedia(user.id).catch(() => {});
  return { revision: out.revision, publishedMatches: matchesPublished(out, draftSnap) };
}

/* ── Publish / unpublish ────────────────────────────────────────────────────── */
export async function publishProfile(user: AppUser): Promise<{ publishedAt: string }> {
  if (!user.username) throw new ApiError(409, "no_username", "Choose a username before publishing.");
  const p = await getOwnProfile(user);
  const blocks = withDefaultHeader(toDocBlocks(await loadBlocks(p.id)), p.revision);
  const theme = resolveTheme(p.theme, p.themeId);

  // Publish ONLY what is saved in the draft, and re-validate all of it.
  const check = draftSchema.safeParse({ baseRevision: p.revision, identity: identityOf(p), theme, blocks });
  if (!check.success) {
    const details: Record<string, string> = {};
    for (const i of check.error.issues) details[i.path.join(".") || "_"] ??= i.message;
    throw new ApiError(422, "validation", "Fix the errors in your draft before publishing.", details);
  }
  const snapshot = buildSnapshot({ identity: check.data.identity, avatarKey: p.avatarKey, bannerKey: p.bannerKey, theme: check.data.theme, blocks: check.data.blocks });
  const now = new Date();
  await getDb()
    .update(schema.profile)
    .set({ published: snapshot as unknown as Record<string, unknown>, visibility: "PUBLISHED", publishedAt: now, updatedAt: now })
    .where(eq(schema.profile.userId, user.id));
  void gcMedia(user.id).catch(() => {});
  return { publishedAt: now.toISOString() };
}

export async function unpublishProfile(user: AppUser) {
  await getDb().update(schema.profile).set({ visibility: "PRIVATE", updatedAt: new Date() }).where(eq(schema.profile.userId, user.id));
}

/* ── Onboarding ─────────────────────────────────────────────────────────────── */
export async function completeOnboarding(user: AppUser, input: { skip?: boolean; displayName?: string; presetId?: string }) {
  const p = await getOwnProfile(user);
  if (input.skip) {
    await getDb().update(schema.profile).set({ onboardedAt: new Date() }).where(eq(schema.profile.userId, user.id));
    return;
  }
  const name = identitySchema.shape.displayName.safeParse(input.displayName ?? p.displayName);
  if (!name.success) throw new ApiError(422, "validation", "Fix the highlighted fields.", { displayName: name.error.issues[0].message });
  const preset = presetById(input.presetId ?? "default");
  if (!preset) throw new ApiError(422, "validation", "Fix the highlighted fields.", { presetId: "Unknown theme." });
  if (!canUse(user.plan, preset.requiresPlan)) throw new ApiError(403, "plan", "That theme requires a higher plan.");

  const existing = await loadBlocks(p.id);
  await getDb().transaction(async (tx) => {
    await tx
      .update(schema.profile)
      .set({ displayName: name.data, theme: cloneTheme(preset.theme) as unknown as Record<string, unknown>, revision: sql`${schema.profile.revision} + 1`, onboardedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.profile.userId, user.id));
    if (existing.length === 0) {
      const h = defaultBlock("header")!;
      await tx.insert(schema.profileBlock).values({ id: h.id, profileId: p.id, type: "header", position: 0, data: h.settings, visible: true });
    }
  });
}

/* ── Public / preview views ─────────────────────────────────────────────────── */
function draftToView(username: string, p: ProfileRow, blocks: DocBlock[]): ViewModel {
  return {
    identity: { username, displayName: p.displayName, bio: p.bio, status: p.status, avatarUrl: mediaUrl(p.avatarKey), bannerUrl: mediaUrl(p.bannerKey) },
    theme: resolveTheme(p.theme, p.themeId),
    blocks: blocks.map((b) => ({ ...b })),
  };
}

export type PublicLookup =
  | { found: false }
  | { found: true; userId: string; profileId: string; vm: ViewModel; isDraftPreview: boolean; ownerEmpty: boolean };

/** What should /<username> show for this viewer? Visibility is enforced HERE, server-side. */
export async function loadPublicView(username: string, viewerId: string | null): Promise<PublicLookup> {
  const db = getDb();
  const [row] = await db
    .select({ userId: schema.user.id, username: schema.user.username, p: schema.profile })
    .from(schema.user)
    .innerJoin(schema.profile, eq(schema.profile.userId, schema.user.id))
    .where(eq(schema.user.username, username))
    .limit(1);
  if (!row || !row.username) return { found: false };
  const isOwner = viewerId === row.userId;

  if (row.p.visibility === "PUBLISHED" && row.p.published) {
    const vm = snapshotToView(row.username, row.p.published as unknown as Snapshot);
    vm.theme = resolveTheme(vm.theme, null); // defensive: never render an invalid theme
    return { found: true, userId: row.userId, profileId: row.p.id, vm, isDraftPreview: false, ownerEmpty: isOwner && vm.blocks.length === 0 };
  }
  if (row.p.visibility === "PUBLISHED" || isOwner) {
    // legacy V0 published profile (no snapshot) OR the owner previewing their private profile → draft
    const blocks = withDefaultHeader(toDocBlocks(await loadBlocks(row.p.id)), row.p.revision).filter((b) => b.visible);
    const vm = draftToView(row.username, row.p, blocks);
    return { found: true, userId: row.userId, profileId: row.p.id, vm, isDraftPreview: row.p.visibility !== "PUBLISHED", ownerEmpty: isOwner && blocks.length === 0 };
  }
  return { found: false }; // private → indistinguishable from "doesn't exist"
}

export async function loadOwnDraftView(user: AppUser & { username: string }): Promise<ViewModel> {
  const p = await getOwnProfile(user);
  const blocks = withDefaultHeader(toDocBlocks(await loadBlocks(p.id)), p.revision).filter((b) => b.visible);
  return draftToView(user.username, p, blocks);
}

/* ── Dashboard stats ────────────────────────────────────────────────────────── */
export async function getViewStats(profileId: string) {
  const db = getDb();
  const since = new Date(Date.now() - 7 * 864e5);
  const [all] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.profileView).where(eq(schema.profileView.profileId, profileId));
  const [week] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.profileView).where(and(eq(schema.profileView.profileId, profileId), gte(schema.profileView.viewedAt, since)));
  return { total: all.n, last7: week.n };
}

export async function contentBlockCount(profileId: string) {
  const rows = await loadBlocks(profileId);
  return rows.filter((r) => r.type !== "header" && r.type !== "spacer").length;
}

/* ── Orphaned upload cleanup (Postgres storage mode only) ───────────────────── */
export async function gcMedia(userId: string) {
  if (usesObjectBucket()) return; // R2 mode: keep everything (can't enumerate here)
  const db = getDb();
  const [p] = await db.select().from(schema.profile).where(eq(schema.profile.userId, userId)).limit(1);
  if (!p) return;
  const blocks = await loadBlocks(p.id);
  const keep = referencedMedia(resolveTheme(p.theme, p.themeId), blocks.map((b) => ({ type: b.type, settings: b.data })), [p.avatarKey, p.bannerKey]);
  if (p.published) {
    const s = p.published as unknown as Snapshot;
    for (const k of referencedMedia(s.theme, s.blocks, [s.identity?.avatarKey ?? null, s.identity?.bannerKey ?? null])) keep.add(k);
  }
  // Only files older than 1 hour: a freshly uploaded image may not be saved into a block yet.
  const keepArr = [...keep];
  await db.execute(sql`
    DELETE FROM media WHERE user_id = ${userId} AND created_at < now() - interval '1 hour'
    ${keepArr.length ? sql`AND key NOT IN (${sql.join(keepArr.map((k) => sql`${k}`), sql`, `)})` : sql``}
  `);
}
