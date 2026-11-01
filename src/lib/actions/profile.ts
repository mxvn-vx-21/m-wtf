"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { TAKEN_MESSAGE, validateUsername } from "@/lib/username";
import { deleteObject } from "@/lib/storage";

export type ActionState = { ok?: boolean; message?: string; errors?: Record<string, string> };

/** For accounts that have no username yet (social-login signups). Username is immutable once set. */
export async function claimUsername(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/onboarding");
  if (user.username) redirect("/dashboard");
  const rl = await rateLimit(`claim:${user.id}`, 10, 60);
  if (!rl.ok) return { message: `Slow down — try again in ${rl.retryAfter}s.` };

  const raw = String(formData.get("username") ?? "");
  const v = validateUsername(raw);
  if (!v.ok) return { errors: { username: v.message } };

  try {
    const res = await getDb()
      .update(schema.user)
      .set({ username: v.username, displayUsername: raw.trim(), updatedAt: new Date() })
      .where(and(eq(schema.user.id, user.id), isNull(schema.user.username)))
      .returning({ id: schema.user.id });
    if (res.length === 0) redirect("/dashboard");
  } catch (e) {
    if (isUniqueViolation(e)) return { errors: { username: TAKEN_MESSAGE } };
    if (isRedirect(e)) throw e;
    console.error("[claimUsername]", e);
    return { message: "Couldn't save that username. Please try again." };
  }
  redirect("/dashboard");
}

export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?reason=unauthorized&next=/settings");
  const expected = user.username ?? "DELETE";
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== expected.toLowerCase())
    return { errors: { confirm: `Type "${expected}" to confirm.` } };

  try {
    const db = getDb();
    const [p] = await db.select().from(schema.profile).where(eq(schema.profile.userId, user.id)).limit(1);
    await getAuth().api.signOut({ headers: await headers() }).catch(() => null);
    await db.delete(schema.user).where(eq(schema.user.id, user.id)); // cascades: profile, blocks, views, sessions, accounts
    await Promise.all([deleteObject(p?.avatarKey), deleteObject(p?.bannerKey)]);
  } catch (e) {
    console.error("[deleteAccount]", e);
    return { message: "Couldn't delete your account. Please try again." };
  }
  redirect("/?deleted=1");
}

function isUniqueViolation(e: unknown): boolean {
  const any = e as { code?: string; cause?: { code?: string } };
  return any?.code === "23505" || any?.cause?.code === "23505";
}
function isRedirect(e: unknown): boolean {
  return typeof (e as { digest?: string })?.digest === "string" && (e as { digest: string }).digest.startsWith("NEXT_REDIRECT");
}
