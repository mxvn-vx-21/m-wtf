import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { isSameOrigin, rateLimit } from "@/lib/rate-limit";
import { MEDIA_LIMITS, validateImage, type MediaKind } from "@/lib/media";
import { mediaUrl, putObject } from "@/lib/storage";

export const dynamic = "force-dynamic";

const MAX_ASSETS_PER_USER = 80;
const err = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });
const KINDS = ["avatar", "banner", "image"];

async function authorize(req: Request, kindParam: string) {
  if (!isSameOrigin(req)) return { res: err("Bad origin.", 403) } as const;
  if (!KINDS.includes(kindParam)) return { res: err("Not found.", 404) } as const;
  const user = await getCurrentUser();
  if (!user) return { res: err("You need to log in to access this page.", 401) } as const;
  const rl = await rateLimit(`upload:${user.id}`, 30, 600);
  if (!rl.ok) return { res: err("Too many uploads. Try again later.", 429) } as const;
  return { user, kind: kindParam as MediaKind } as const;
}

/**
 * POST /api/upload/avatar|banner|image   (multipart "file")
 *  • avatar/banner: stored AND set as the profile's DRAFT avatar/banner (public page changes only on Publish)
 *  • image: stored only; the builder puts the returned URL into a block/background (then validated on save)
 * Replaced files are NOT deleted immediately because the published snapshot may still reference them;
 * orphans are cleaned up after publish/save (see gcMedia).
 */
export async function POST(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  try {
    const a = await authorize(req, (await ctx.params).kind);
    if ("res" in a) return a.res;
    const { user, kind } = a;

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return err("No file received.", 400);
    if (file.size > MEDIA_LIMITS[kind].maxBytes) return err(`Image is too large (max ${MEDIA_LIMITS[kind].maxBytes / 1024 / 1024} MB).`, 413);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const v = validateImage(file, bytes, kind);
    if (!v.ok) return err(v.error, 400);

    const db = getDb();
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.media).where(eq(schema.media.userId, user.id));
    if (n >= MAX_ASSETS_PER_USER) return err("You've reached the upload limit. Delete unused images or contact support.", 409);

    const key = `${MEDIA_LIMITS[kind].prefix}/${user.id}/${crypto.randomUUID()}.${v.ext}`;
    await putObject(key, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, v.contentType, user.id);

    if (kind !== "image") {
      const col = kind === "avatar" ? "avatarKey" : "bannerKey";
      const res = await db.update(schema.profile).set({ [col]: key, updatedAt: new Date() }).where(eq(schema.profile.userId, user.id)).returning({ id: schema.profile.id });
      if (res.length === 0) return err("Profile not found.", 404);
    }
    return NextResponse.json({ ok: true, url: mediaUrl(key), key });
  } catch (e) {
    console.error("[upload]", e);
    return err("Upload failed. Please try again.", 500);
  }
}

/** DELETE /api/upload/avatar|banner → clears the DRAFT avatar/banner (file is garbage-collected later). */
export async function DELETE(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  try {
    const a = await authorize(req, (await ctx.params).kind);
    if ("res" in a) return a.res;
    const { user, kind } = a;
    if (kind === "image") return err("Not supported.", 400);
    const col = kind === "avatar" ? "avatarKey" : "bannerKey";
    await getDb().update(schema.profile).set({ [col]: null, updatedAt: new Date() }).where(eq(schema.profile.userId, user.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[upload:delete]", e);
    return err("Couldn't remove the image.", 500);
  }
}
