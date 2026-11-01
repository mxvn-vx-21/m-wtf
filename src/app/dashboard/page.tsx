import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DashboardActions } from "@/components/DashboardActions";
import { Card } from "@/components/ui";
import { contentBlockCount, getViewStats, loadDraft } from "@/lib/builder/service";
import { getOwnProfile, requireOnboardedUser } from "@/lib/session";
import { profileUrl } from "@/lib/urls";
import { computeCompletion } from "@/profile/doc";

export const metadata = { title: "Dashboard — MARVEL.WTF", robots: { index: false } };

export default async function Dashboard() {
  const user = await requireOnboardedUser("/dashboard");
  const profile = await getOwnProfile(user);
  if (!profile.onboardedAt) redirect("/welcome");

  const [draft, stats, content] = await Promise.all([loadDraft(user), getViewStats(profile.id), contentBlockCount(profile.id)]);
  const completion = computeCompletion({
    hasAvatar: Boolean(profile.avatarKey),
    displayName: draft.identity.displayName,
    username: user.username,
    bio: draft.identity.bio,
    contentBlocks: content,
    customizedTheme: true,
    published: draft.published,
  });
  const url = profileUrl(user.username);
  const status = !draft.published ? { label: "Draft", cls: "bg-zinc-500/20 text-zinc-300" } : draft.publishedMatches ? { label: "Published", cls: "bg-emerald-500/15 text-emerald-300" } : { label: "Unpublished changes", cls: "bg-spark/15 text-yellow-200" };

  return (
    <>
      <AppHeader username={user.username} />
      <div className="ambient" aria-hidden />
      <main id="main" className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Card>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-hero bg-ink font-display text-4xl text-hero shadow-[0_0_30px_-4px_rgba(225,29,46,.6)] sm:size-24">
              {draft.avatarUrl ? <img src={draft.avatarUrl} alt="" className="size-full object-cover" /> : <span aria-hidden>{(draft.identity.displayName || user.username).charAt(0).toUpperCase()}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="hud text-mute">Your profile</p>
              <h1 className="truncate text-4xl sm:text-5xl">{draft.identity.displayName}</h1>
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold text-spark">@{user.username}</span>
                <span className={`hud rounded-full px-2.5 py-1 text-[.6rem] ${status.cls}`}>{status.label}</span>
              </p>
              <p className="mt-1 break-all text-xs text-mute">{url.replace(/^https?:\/\//, "")}</p>
            </div>
          </div>
          <div className="mt-5"><DashboardActions url={url} username={user.username} published={draft.published} /></div>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card title="Profile views" tilt>
            <p className="font-display text-6xl leading-none text-white">{stats.total}</p>
            <p className="mt-1 text-sm text-mute">{stats.last7} in the last 7 days</p>
          </Card>
          <Card title="Profile completion" className="md:col-span-2">
            <div className="flex items-center gap-4">
              <p className="font-display text-6xl leading-none text-white">{completion.percent}%</p>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
                <div className="h-full rounded-full bg-gradient-to-r from-hero to-spark transition-all duration-1000" style={{ width: `${completion.percent}%` }} />
              </div>
            </div>
            <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
              {completion.items.map((i) => (
                <li key={i.key} className={i.done ? "text-emerald-300" : "text-zinc-300"}>
                  <span aria-hidden>{i.done ? "✓" : "○"}</span> <span className="sr-only">{i.done ? "Done: " : "To do: "}</span>{i.label}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card title="Quick actions">
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/editor" className="btn btn-ghost">Open the builder</Link>
            <Link href="/dashboard/preview" className="btn btn-ghost">Preview draft</Link>
            <Link href="/settings" className="btn btn-ghost">Account settings</Link>
            <Link href="/logout" className="btn btn-ghost">Log out</Link>
          </div>
        </Card>
      </main>
    </>
  );
}
