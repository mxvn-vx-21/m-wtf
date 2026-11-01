import { NextResponse } from "next/server";
import { guard, toResponse } from "@/lib/api";
import { loadDraft, saveDraft } from "@/lib/builder/service";

export const dynamic = "force-dynamic";

/** GET /api/profile/draft → the caller's own draft (owner is always the session user). */
export async function GET(req: Request) {
  try {
    const g = await guard(req, { write: false, limit: ["draft-read", 120, 60] });
    if ("res" in g) return g.res;
    return NextResponse.json({ ok: true, draft: await loadDraft(g.user) });
  } catch (e) { return toResponse(e); }
}

/** PUT /api/profile/draft → validate + save identity, theme and ALL blocks atomically (create/update/delete/reorder). */
export async function PUT(req: Request) {
  try {
    const g = await guard(req, { write: true, limit: ["draft-save", 120, 60], body: true });
    if ("res" in g) return g.res;
    const r = await saveDraft(g.user, g.body);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) { return toResponse(e); }
}
