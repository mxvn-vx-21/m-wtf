"use client";
import { useMemo } from "react";
import { ProfileView } from "@/profile/ProfileView";
import type { ViewModel } from "@/profile/doc";
import { useEditor, useEditorApi } from "./store";

/** Live preview = the REAL public renderer fed with the editor's in-memory document. */
export function PreviewPane() {
  const api = useEditorApi();
  const username = useEditor((s) => s.username);
  const identity = useEditor((s) => s.identity);
  const avatarUrl = useEditor((s) => s.avatarUrl);
  const bannerUrl = useEditor((s) => s.bannerUrl);
  const theme = useEditor((s) => s.theme);
  const blocks = useEditor((s) => s.blocks);
  const selectedId = useEditor((s) => s.selectedId);
  const device = useEditor((s) => s.device);

  const vm: ViewModel = useMemo(
    () => ({ identity: { username, displayName: identity.displayName || username, bio: identity.bio, status: identity.status, avatarUrl, bannerUrl }, theme, blocks }),
    [username, identity, avatarUrl, bannerUrl, theme, blocks],
  );

  const onClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("a")) e.preventDefault(); // links never navigate inside the editor
    const el = t.closest<HTMLElement>("[data-block-id]");
    if (el?.dataset.blockId) {
      const s = api.getState();
      s.select(el.dataset.blockId);
      if (window.matchMedia("(max-width: 1023px)").matches) s.setMobileTab("panel");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col items-center bg-[#050507] p-0 lg:p-4">
      <div
        onClick={onClick}
        className={`min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden bg-black lg:border lg:border-line ${device === "phone" ? "lg:max-w-[400px] lg:rounded-[28px]" : "lg:rounded-xl"}`}
        style={{ ["--pv-min-h" as string]: "100%" }}
        role="region"
        aria-label="Live preview of your profile"
      >
        <ProfileView vm={vm} mode="editor" selectedId={selectedId} />
      </div>
    </div>
  );
}
