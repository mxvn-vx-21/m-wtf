import "server-only";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/builder/service";
import { getCurrentUser, type AppUser } from "@/lib/session";
import { isSameOrigin, rateLimit } from "@/lib/rate-limit";

const MAX_BODY = 400_000; // bytes of JSON

export const fail = (status: number, error: string, extra?: Record<string, unknown>) => NextResponse.json({ ok: false, error, ...extra }, { status });

/** Shared guard for authenticated JSON endpoints: origin check (state-changing), session, rate limit, body parse. */
export async function guard(req: Request, opts: { write: boolean; limit: [name: string, max: number, windowSec: number]; body?: boolean }):
  Promise<{ user: AppUser; body: unknown } | { res: NextResponse }> {
  if (opts.write && !isSameOrigin(req)) return { res: fail(403, "Bad origin.") };
  const user = await getCurrentUser();
  if (!user) return { res: fail(401, "You need to log in to access this page.") };
  const rl = await rateLimit(`${opts.limit[0]}:${user.id}`, opts.limit[1], opts.limit[2]);
  if (!rl.ok) return { res: fail(429, `Too many requests. Try again in ${rl.retryAfter}s.`) };
  let body: unknown = null;
  if (opts.body) {
    const text = await req.text();
    if (text.length > MAX_BODY) return { res: fail(413, "Request is too large.") };
    try { body = JSON.parse(text); } catch { return { res: fail(400, "Invalid request.") }; }
  }
  return { user, body };
}

/** Map thrown errors to safe JSON. Raw errors are logged server-side and never sent to the client. */
export function toResponse(e: unknown) {
  if (e instanceof ApiError) return fail(e.status, e.message, { code: e.code, details: e.details });
  console.error("[api]", e);
  return fail(500, "Something went wrong. Please try again.");
}
