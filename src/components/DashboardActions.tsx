"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, LinkButton } from "./ui";
import { CopyLinkButton, QrButton } from "./ShareTools";

export function DashboardActions({ url, username, published }: { url: string; username: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/publish", { method: published ? "DELETE" : "POST" });
      const j = (await res.json()) as { ok: boolean; error?: string };
      if (!j.ok) setError(j.error ?? "Couldn't update visibility.");
      else router.refresh();
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      {error && <Alert kind="error">{error}</Alert>}
      <div className="flex flex-wrap gap-2">
        <LinkButton href="/dashboard/editor" pow>Edit profile</LinkButton>
        <LinkButton href={published ? `/${username}` : "/dashboard/preview"} target="_blank" variant="ghost">{published ? "View profile" : "Preview draft"}</LinkButton>
        <CopyLinkButton url={url} />
        <QrButton url={url} />
        <Button type="button" variant={published ? "ghost" : "primary"} loading={busy} onClick={toggle}>
          {busy ? "Updating…" : published ? "Unpublish" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
