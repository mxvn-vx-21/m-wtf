import { NextResponse } from "next/server";
import { z } from "zod";
import { guard, toResponse } from "@/lib/api";
import { completeOnboarding } from "@/lib/builder/service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ skip: z.boolean().optional(), displayName: z.string().max(200).optional(), presetId: z.string().max(40).optional() });

/** POST → finish the short post-signup onboarding (display name + identity preset) or skip it. */
export async function POST(req: Request) {
  try {
    const g = await guard(req, { write: true, limit: ["onboard", 20, 60], body: true });
    if ("res" in g) return g.res;
    const b = bodySchema.safeParse(g.body);
    if (!b.success) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
    await completeOnboarding(g.user, b.data);
    return NextResponse.json({ ok: true });
  } catch (e) { return toResponse(e); }
}
