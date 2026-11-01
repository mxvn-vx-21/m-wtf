import { EditorShell } from "@/components/editor/EditorShell";
import { loadDraft } from "@/lib/builder/service";
import { requireOnboardedUser } from "@/lib/session";
import { profileUrl } from "@/lib/urls";

export const metadata = { title: "Builder — MARVEL.WTF", robots: { index: false, follow: false } };

export default async function EditorPage() {
  const user = await requireOnboardedUser("/dashboard/editor");
  const d = await loadDraft(user);
  return (
    <EditorShell
      init={{
        username: user.username,
        plan: user.plan,
        profileUrl: profileUrl(user.username),
        revision: d.revision,
        identity: d.identity,
        avatarUrl: d.avatarUrl,
        bannerUrl: d.bannerUrl,
        theme: d.theme,
        blocks: d.blocks,
        published: d.published,
        publishedMatches: d.publishedMatches,
      }}
    />
  );
}
