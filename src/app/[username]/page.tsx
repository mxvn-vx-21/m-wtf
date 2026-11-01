import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { ProfileView } from "@/profile/ProfileView";
import { getDb, schema } from "@/lib/db";
import { loadPublicView } from "@/lib/builder/service";
import { getCurrentUser } from "@/lib/session";
import { normalizeUsername, validateUsername } from "@/lib/username";
import { profileUrl } from "@/lib/urls";

type Props = { params: Promise<{ username: string }> };

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|monitor|curl|wget/i;
const lookup = cache(loadPublicView); // metadata + page share one DB round-trip

function canonical(raw: string): string | null {
  const name = normalizeUsername(decodeURIComponent(raw));
  return validateUsername(name).ok ? name : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = canonical((await params).username);
  const res = name ? await lookup(name, null) : null;
  // Private/missing profiles: generic title, never indexed, nothing leaked.
  if (!res || !res.found || res.isDraftPreview) return { title: "Profile not found — MARVEL.WTF", robots: { index: false, follow: false } };
  const i = res.vm.identity;
  const title = `${i.displayName} — MARVEL.WTF`;
  const description = i.bio ? i.bio.slice(0, 160) : `${i.displayName} (@${i.username}) on MARVEL.WTF. Build your identity.`;
  const url = profileUrl(i.username);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { title, description, url, type: "profile", siteName: "MARVEL.WTF", images: i.avatarUrl ? [{ url: i.avatarUrl, width: 128, height: 128 }] : undefined },
    twitter: { card: "summary", title, description, images: i.avatarUrl ? [i.avatarUrl] : undefined },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const raw = decodeURIComponent((await params).username);
  const name = canonical(raw);
  if (!name) notFound();
  // Canonical lowercase URL (/Sufi → /sufi)
  if (raw !== name && /^[A-Za-z0-9_]+$/.test(raw)) redirect(`/${name}`);

  const viewer = await getCurrentUser();
  const res = await lookup(name, viewer?.id ?? null);
  if (!res.found) notFound();
  const isOwner = viewer?.id === res.userId;

  if (!res.isDraftPreview && !isOwner) {
    const h = await headers();
    if (!BOT.test(h.get("user-agent") ?? "")) {
      const db = getDb();
      let referrerHost: string | null = null;
      try { referrerHost = h.get("referer") ? new URL(h.get("referer")!).host : null; } catch { /* ignore */ }
      const country = (h.get("cf-ipcountry") ?? "").slice(0, 2).toUpperCase() || null;
      after(async () => {
        try { await db.insert(schema.profileView).values({ profileId: res.profileId, referrerHost, country }); }
        catch (e) { console.error("[profile_view]", e); }
      });
    }
  }

  return (
    <div className="pv-host">
      {res.isDraftPreview && (
        <div role="status" className="fixed inset-x-0 top-0 z-50 bg-spark px-3 py-2 text-center text-xs font-extrabold uppercase tracking-wider text-black">
          Private preview — only you can see this. <Link href="/dashboard" className="underline">Dashboard</Link>
        </div>
      )}
      <ProfileView vm={res.vm} mode="public" ownerEmpty={res.ownerEmpty} />
      {isOwner && !res.isDraftPreview && (
        <Link href="/dashboard/editor" className="fixed bottom-4 right-4 z-50 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg backdrop-blur hover:bg-black/90">
          Edit profile
        </Link>
      )}
    </div>
  );
}
