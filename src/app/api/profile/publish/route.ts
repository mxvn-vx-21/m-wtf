import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { guard, toResponse } from "@/lib/api";
import { publishProfile, unpublishProfile } from "@/lib/builder/service";

export const dynamic = "force-dynamic";

/** POST → publish the SAVED draft as the public version. */
export async function POST(req: Request) {
  try {
    const g = await guard(req, { write: true, limit: ["publish", 30, 60] });
    if ("res" in g) return g.res;
    const r = await publishProfile(g.user);
    if (g.user.username) revalidatePath(`/${g.user.username}`);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) { return toResponse(e); }
}

/** DELETE → unpublish (profile becomes private; the snapshot is kept for re-publishing). */
export async function DELETE(req: Request) {
  try {
    const g = await guard(req, { write: true, limit: ["publish", 30, 60] });
    if ("res" in g) return g.res;
    await unpublishProfile(g.user);
    if (g.user.username) revalidatePath(`/${g.user.username}`);
    return NextResponse.json({ ok: true });
  } catch (e) { return toResponse(e); }
}
