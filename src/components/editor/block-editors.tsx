"use client";
import { memo, useMemo } from "react";
import { BLOCKS, getBlockDef, validateSettings } from "@/profile/blocks/registry";
import { LINK_ICONS } from "@/profile/blocks/link";
import type { DocBlock } from "@/profile/doc";
import { identitySchema } from "@/profile/doc";
import { Icon, GENERIC_ICONS } from "@/profile/icons";
import { SOCIALS, socialById } from "@/profile/socials";
import { MEDIA_PATH_RE } from "@/profile/text";
import { AssetUploader } from "./AssetUploader";
import { RangeField, Segmented, SelectField, TextField, Toggle } from "./controls";
import { useEditor, useEditorApi } from "./store";

type S = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Props = { s: S; set: (patch: S) => void; err: Record<string, string> };

function HeaderForm({ s, set, err }: Props) {
  const identity = useEditor((x) => x.identity);
  const avatarUrl = useEditor((x) => x.avatarUrl);
  const bannerUrl = useEditor((x) => x.bannerUrl);
  const api = useEditorApi();
  const ie = useMemo(() => {
    const r = identitySchema.safeParse(identity);
    const o: Record<string, string> = {};
    if (!r.success) for (const i of r.error.issues) o[String(i.path[0])] ??= i.message;
    return o;
  }, [identity]);
  const st = api.getState();
  return (
    <div className="space-y-4">
      <TextField label="Display name" value={identity.displayName} onChange={(v) => st.setIdentity({ displayName: v })} error={ie.displayName} max={50} />
      <TextField label="Status" value={identity.status} onChange={(v) => st.setIdentity({ status: v })} error={ie.status} max={80} placeholder="Saving the multiverse…" />
      <TextField label="Bio" value={identity.bio} onChange={(v) => st.setIdentity({ bio: v })} error={ie.bio} max={280} multiline rows={4} />
      <AssetUploader kind="avatar" label="Avatar" round value={avatarUrl} onChange={(u) => api.getState().setAvatarUrl(u)} canRemove />
      <AssetUploader kind="banner" label="Banner" value={bannerUrl} onChange={(u) => api.getState().setBannerUrl(u)} canRemove />
      <div className="space-y-3 border-t border-line pt-4">
        <Toggle label="Show avatar" checked={s.showAvatar} onChange={(v) => set({ showAvatar: v })} />
        <Toggle label="Show banner" checked={s.showBanner} onChange={(v) => set({ showBanner: v })} />
        <Toggle label="Show username" checked={s.showUsername} onChange={(v) => set({ showUsername: v })} />
        <Toggle label="Show bio" checked={s.showBio} onChange={(v) => set({ showBio: v })} />
        <Toggle label="Show status" checked={s.showStatus} onChange={(v) => set({ showStatus: v })} />
        <Segmented label="Alignment" value={s.align} onChange={(v) => set({ align: v })} options={[{ value: "center", label: "Center" }, { value: "left", label: "Left" }]} />
      </div>
      <p className="text-xs text-mute">{err._ ?? ""}</p>
    </div>
  );
}

function TextForm({ s, set, err }: Props) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={s.title} onChange={(v) => set({ title: v })} error={err.title} max={80} />
      <TextField label="Body" value={s.body} onChange={(v) => set({ body: v })} error={err.body} max={2000} multiline rows={6} hint="Plain text. Line breaks are kept." />
      <Segmented label="Alignment" value={s.align} onChange={(v) => set({ align: v })} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} />
    </div>
  );
}

const ICON_OPTIONS = [
  { value: "none", label: "No icon" },
  ...GENERIC_ICONS.map((i) => ({ value: i as string, label: i[0].toUpperCase() + i.slice(1) })),
  ...SOCIALS.filter((p) => p.id !== "website").map((p) => ({ value: p.id, label: p.label })),
].filter((o) => (LINK_ICONS as readonly string[]).includes(o.value));

function LinkForm({ s, set, err }: Props) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={s.title} onChange={(v) => set({ title: v })} error={err.title} max={60} placeholder="MY DISCORD" />
      <TextField label="URL" value={s.url} onChange={(v) => set({ url: v })} error={err.url} type="url" inputMode="url" placeholder="https://" />
      <div className="flex items-end gap-3">
        <div className="flex-1"><SelectField label="Icon" value={s.icon} onChange={(v) => set({ icon: v })} options={ICON_OPTIONS} error={err.icon} /></div>
        <div className="mb-1 grid size-10 place-items-center rounded-lg border border-line text-spark">{s.icon !== "none" ? <Icon name={s.icon} size={20} /> : <span className="text-zinc-600">—</span>}</div>
      </div>
      <TextField label="Description (optional)" value={s.description} onChange={(v) => set({ description: v })} error={err.description} max={120} />
    </div>
  );
}

function SocialsForm({ s, set, err }: Props) {
  const items: { id: string; platform: string; url: string }[] = s.items;
  const upd = (i: number, patch: S) => set({ items: items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const add = () => {
    const used = new Set(items.map((i) => i.platform));
    const p = SOCIALS.find((x) => !used.has(x.id)) ?? SOCIALS[0];
    set({ items: [...items, { id: crypto.randomUUID().slice(0, 12), platform: p.id, url: p.placeholder }] });
  };
  return (
    <div className="space-y-4">
      <TextField label="Title (optional)" value={s.title} onChange={(v) => set({ title: v })} error={err.title} max={40} />
      <Segmented label="Style" value={s.style} onChange={(v) => set({ style: v })} options={[{ value: "icons", label: "Icons" }, { value: "list", label: "List" }]} />
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={it.id} className="space-y-2 rounded-lg border border-line p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <SelectField label="Platform" value={it.platform} onChange={(v) => upd(i, { platform: v, url: socialById(v)?.placeholder ?? it.url })} options={SOCIALS.map((p) => ({ value: p.id, label: p.label }))} error={err[`items.${i}.platform`]} />
              </div>
              <button type="button" onClick={() => set({ items: items.filter((_, k) => k !== i) })} aria-label={`Remove ${socialById(it.platform)?.label ?? "link"}`} className="mb-0.5 grid size-10 place-items-center rounded-lg border border-red-500/50 text-red-300 hover:bg-red-500/10"><Icon name="trash" size={16} /></button>
            </div>
            <TextField label="URL" value={it.url} onChange={(v) => upd(i, { url: v })} error={err[`items.${i}.url`]} type="url" inputMode="url" placeholder={socialById(it.platform)?.placeholder} />
          </li>
        ))}
      </ul>
      {err.items && <p role="alert" className="text-xs font-semibold text-red-400">{err.items}</p>}
      <button type="button" onClick={add} disabled={items.length >= 14} className="w-full rounded-lg border border-dashed border-zinc-600 px-3 py-2.5 hud text-[.62rem] text-zinc-200 hover:border-spark hover:text-spark disabled:opacity-50">+ Add social link</button>
    </div>
  );
}

function ImageForm({ s, set, err }: Props) {
  const isUpload = MEDIA_PATH_RE.test(s.src);
  return (
    <div className="space-y-4">
      <AssetUploader kind="image" label="Image" value={s.src || null} onChange={(u) => u && set({ src: u })} />
      <TextField label="Or image URL" value={isUpload ? "" : s.src} onChange={(v) => set({ src: v })} error={err.src} type="url" inputMode="url" placeholder="https://…" hint="Must be a secure https:// link." />
      <TextField label="Alt text" value={s.alt} onChange={(v) => set({ alt: v })} error={err.alt} max={140} hint="Describe the image for screen readers." />
      <Segmented label="Corners" value={s.radius} onChange={(v) => set({ radius: v })} options={[{ value: "none", label: "Square" }, { value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }, { value: "full", label: "Round" }]} />
      <Segmented label="Shape" value={s.aspect} onChange={(v) => set({ aspect: v })} options={[{ value: "auto", label: "Original" }, { value: "square", label: "Square" }, { value: "wide", label: "Wide" }]} />
      <TextField label="Link (optional)" value={s.link} onChange={(v) => set({ link: v })} error={err.link} type="url" inputMode="url" placeholder="https://" />
      <TextField label="Caption (optional)" value={s.caption} onChange={(v) => set({ caption: v })} error={err.caption} max={120} />
    </div>
  );
}

function MusicForm({ s, set, err }: Props) {
  return (
    <div className="space-y-4">
      <TextField label="Audio URL" value={s.url} onChange={(v) => set({ url: v })} error={err.url} type="url" inputMode="url" placeholder="https://…/track.mp3" hint="A direct https:// link to an audio file (mp3, ogg, wav, m4a)." />
      <TextField label="Track title" value={s.title} onChange={(v) => set({ title: v })} error={err.title} max={80} />
      <TextField label="Artist (optional)" value={s.artist} onChange={(v) => set({ artist: v })} error={err.artist} max={80} />
      <Toggle label="Autoplay" checked={s.autoplay} onChange={(v) => set({ autoplay: v })} hint="Browsers block sound until a visitor interacts with the page, so playback starts on their first tap or click. Never plays while you edit." />
      <Toggle label="Loop" checked={s.loop} onChange={(v) => set({ loop: v })} />
    </div>
  );
}

function SpacerForm({ s, set, err }: Props) {
  return <RangeField label="Height" value={s.height} min={8} max={240} step={4} onChange={(v) => set({ height: v })} format={(v) => `${v}px`} error={err.height} />;
}

const FORMS: Record<string, (p: Props) => React.ReactElement> = { header: HeaderForm, text: TextForm, link: LinkForm, socials: SocialsForm, image: ImageForm, music: MusicForm, spacer: SpacerForm };

/** Settings form for ONE block. Re-renders only when that block changes. */
export const BlockForm = memo(function BlockForm({ block }: { block: DocBlock }) {
  const api = useEditorApi();
  const def = getBlockDef(block.type);
  const errors = useMemo(() => { const v = validateSettings(block.type, block.settings); return v.ok ? {} : v.errors; }, [block.type, block.settings]);
  const Form = FORMS[block.type];
  if (!def || !Form) return <p className="p-4 text-sm text-red-300">Unknown block type.</p>;
  return <Form s={block.settings} set={(patch) => api.getState().updateBlock(block.id, patch)} err={errors} />;
});

export function blockSummary(b: DocBlock): string {
  const s = b.settings as S;
  switch (b.type) {
    case "header": return "Identity";
    case "text": return s.title || String(s.body ?? "").slice(0, 28) || "Text";
    case "link": return s.title || "Link";
    case "socials": return `${(s.items ?? []).length} link${(s.items ?? []).length === 1 ? "" : "s"}`;
    case "image": return s.alt || s.caption || "Image";
    case "music": return s.title || "Track";
    case "spacer": return `${s.height ?? 0}px`;
    default: return "";
  }
}

export { BLOCKS };
