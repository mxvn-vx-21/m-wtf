import Link from "next/link";
import { ProfileView } from "@/profile/ProfileView";
import { loadOwnDraftView } from "@/lib/builder/service";
import { requireOnboardedUser } from "@/lib/session";

export const metadata = { title: "Draft preview — MARVEL.WTF", robots: { index: false, follow: false } };

/** Owner-only: shows the saved DRAFT exactly as a visitor would see it once published. */
export default async function DraftPreview() {
  const user = await requireOnboardedUser("/dashboard/preview");
  const vm = await loadOwnDraftView(user);
  return (
    <div className="pv-host">
      <div role="status" className="fixed inset-x-0 top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-spark px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-black">
        <span>Draft preview — not public until you publish</span>
        <Link href="/dashboard/editor" className="underline">Back to builder</Link>
      </div>
      <ProfileView vm={vm} mode="preview" ownerEmpty={vm.blocks.length === 0} />
    </div>
  );
}
