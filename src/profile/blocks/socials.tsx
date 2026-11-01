import { z } from "zod";
import { Icon } from "../icons";
import { SOCIAL_IDS, socialById, socialIconName } from "../socials";
import { httpUrl, line } from "../text";
import type { BlockDef } from "./types";

const schema = z.object({
  title: line(40),
  style: z.enum(["icons", "list"]),
  items: z
    .array(
      z.object({
        id: z.string().min(4).max(40),
        platform: z.string().refine((p) => SOCIAL_IDS.includes(p), "Pick a platform."),
        url: httpUrl,
      }),
    )
    .max(14, "Up to 14 social links."),
});
export type SocialsSettings = z.infer<typeof schema>;

export const socialsBlock: BlockDef<SocialsSettings> = {
  type: "socials",
  label: "Social Links",
  description: "Discord, Instagram, YouTube, GitHub and more.",
  icon: "share",
  schema,
  defaults: () => ({ title: "", style: "icons", items: [] }),
  Render: ({ settings: s }) => {
    if (s.items.length === 0) return null;
    return (
      <section className="pv-card">
        {s.title && <h2 className="pv-card-title">{s.title}</h2>}
        <ul className={s.style === "icons" ? "pv-socials" : "pv-sociallist"}>
          {s.items.map((it) => {
            const p = socialById(it.platform);
            return (
              <li key={it.id}>
                <a href={it.url} target="_blank" rel="noopener noreferrer nofollow ugc" className={s.style === "icons" ? "pv-social" : "pv-social pv-social-row"} aria-label={p?.label ?? it.platform}>
                  <Icon name={socialIconName(it.platform)} size={s.style === "icons" ? 22 : 18} />
                  {s.style === "list" && <span>{p?.label ?? it.platform}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    );
  },
};
