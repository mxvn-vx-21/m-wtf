import { z } from "zod";
import type { BlockDef } from "./types";

const schema = z.object({
  showAvatar: z.boolean(),
  showUsername: z.boolean(),
  showBio: z.boolean(),
  showStatus: z.boolean(),
  showBanner: z.boolean(),
  align: z.enum(["center", "left"]),
});
export type HeaderSettings = z.infer<typeof schema>;

export const headerBlock: BlockDef<HeaderSettings> = {
  type: "header",
  label: "Profile Header",
  description: "Avatar, name, @username, bio and status.",
  icon: "user",
  maxPerProfile: 1,
  schema,
  defaults: () => ({ showAvatar: true, showUsername: true, showBio: true, showStatus: true, showBanner: true, align: "center" }),
  Render: ({ settings: s, ctx }) => {
    const { identity: i } = ctx;
    const initial = (i.displayName || i.username).trim().charAt(0).toUpperCase() || "?";
    return (
      <header className={`pv-header${s.align === "left" ? " pv-left" : ""}`}>
        {s.showBanner && (
          <div className={i.bannerUrl ? "pv-banner pv-skel" : "pv-banner pv-banner-empty"} aria-hidden>{i.bannerUrl && <img src={i.bannerUrl} alt="" width={1500} height={500} decoding="async" />}</div>
        )}
        <div className={`pv-ident${s.showBanner ? " pv-ident-up" : ""}`}>
          {s.showAvatar && (
            <div className={i.avatarUrl ? "pv-avatar pv-skel" : "pv-avatar"}>
              {i.avatarUrl ? <img src={i.avatarUrl} alt={`${i.displayName}'s avatar`} width={132} height={132} decoding="async" /> : <span aria-hidden>{initial}</span>}
            </div>
          )}
          <h1 className="pv-name">{i.displayName}</h1>
          {s.showUsername && <p className="pv-handle">@{i.username}</p>}
          {s.showStatus && i.status && <p className="pv-status"><span className="pv-dot" aria-hidden />{i.status}</p>}
          {s.showBio && i.bio && <p className="pv-bio">{i.bio}</p>}
        </div>
      </header>
    );
  },
};
