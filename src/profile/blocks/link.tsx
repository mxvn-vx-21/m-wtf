import { z } from "zod";
import { Icon, GENERIC_ICONS, BRAND_ICON_IDS } from "../icons";
import { httpUrl, line } from "../text";
import type { BlockDef } from "./types";

export const LINK_ICONS = ["none", ...GENERIC_ICONS, ...BRAND_ICON_IDS] as const;

const schema = z.object({
  title: line(60).pipe(z.string().min(1, "Title is required.")),
  url: httpUrl,
  icon: z.string().refine((v) => (LINK_ICONS as readonly string[]).includes(v), "Pick an icon from the list."),
  description: line(120),
});
export type LinkSettings = z.infer<typeof schema>;

export const linkBlock: BlockDef<LinkSettings> = {
  type: "link",
  label: "Link",
  description: "A big clickable button or card.",
  icon: "link",
  schema,
  defaults: () => ({ title: "My website", url: "https://example.com", icon: "link", description: "" }),
  Render: ({ settings: s }) => (
    <a className="pv-link" href={s.url} target="_blank" rel="noopener noreferrer nofollow ugc">
      {s.icon !== "none" && <span className="pv-link-icon"><Icon name={s.icon} size={20} /></span>}
      <span className="pv-link-text">
        <span className="pv-link-title">{s.title}</span>
        {s.description && <span className="pv-link-desc">{s.description}</span>}
      </span>
      <span className="pv-link-arrow" aria-hidden><Icon name="arrow" size={16} /></span>
    </a>
  ),
};
