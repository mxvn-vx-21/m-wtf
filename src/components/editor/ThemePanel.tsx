"use client";
import { BG_PRESETS, BG_PRESET_KEYS, FONTS, FONT_KEYS, PRESETS } from "@/profile/theme";
import { Icon } from "@/profile/icons";
import { AssetUploader } from "./AssetUploader";
import { ColorField, RangeField, Section, Segmented, SelectField, TextField, Toggle } from "./controls";
import { ThemeSwatch } from "./ThemeSwatch";
import { useEditor, useEditorApi } from "./store";

export function ThemePanel() {
  const api = useEditorApi();
  const theme = useEditor((s) => s.theme);
  const p = api.getState();
  const bg = theme.background;
  const fontOpts = FONT_KEYS.map((k) => ({ value: k, label: FONTS[k].label }));
  const pct = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <div>
      <Section title="Identity theme" icon={<Icon name="bolt" size={14} />}>
        <div className="grid grid-cols-2 gap-2.5">
          {PRESETS.map((pr) => (
            <button key={pr.id} type="button" aria-pressed={theme.presetId === pr.id} onClick={() => api.getState().applyPreset(pr.id)}
              className={`rounded-xl border-2 p-1.5 text-left transition ${theme.presetId === pr.id ? "border-spark bg-spark/5" : "border-line hover:border-zinc-500"}`}>
              <ThemeSwatch theme={pr.theme} />
              <span className="mt-1.5 block px-0.5 hud text-[.64rem]">{pr.name}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-mute">Picking a preset replaces your colours, fonts and effects. Customize it afterwards.</p>
      </Section>

      <Section title="Background" icon={<Icon name="layers" size={14} />}>
        <Segmented label="Type" value={bg.type} onChange={(v) => p.patchTheme("background", { type: v })} options={[{ value: "solid", label: "Solid" }, { value: "gradient", label: "Gradient" }, { value: "image", label: "Image" }, { value: "preset", label: "Preset" }]} />
        {bg.type === "solid" && <ColorField label="Colour" value={bg.color} onChange={(v) => p.patchTheme("background", { color: v })} />}
        {bg.type === "gradient" && (
          <>
            <ColorField label="From" value={bg.from} onChange={(v) => p.patchTheme("background", { from: v })} />
            <ColorField label="To" value={bg.to} onChange={(v) => p.patchTheme("background", { to: v })} />
            <RangeField label="Angle" value={bg.angle} min={0} max={360} step={5} onChange={(v) => p.patchTheme("background", { angle: v })} format={(v) => `${v}°`} />
          </>
        )}
        {bg.type === "preset" && (
          <div className="grid grid-cols-3 gap-2">
            {BG_PRESET_KEYS.map((k) => (
              <button key={k} type="button" aria-pressed={bg.preset === k} onClick={() => p.patchTheme("background", { preset: k })} className={`overflow-hidden rounded-lg border-2 text-[10px] font-bold uppercase tracking-wide ${bg.preset === k ? "border-spark" : "border-line hover:border-zinc-500"}`}>
                <span className="block h-12" style={{ background: BG_PRESETS[k].css }} />
                <span className="block py-1">{BG_PRESETS[k].label}</span>
              </button>
            ))}
          </div>
        )}
        {bg.type === "image" && (
          <>
            <AssetUploader kind="image" label="Background image" value={bg.src || null} onChange={(u) => u && p.patchTheme("background", { src: u })} />
            <TextField label="Or image URL" value={/^\/api\/media\//.test(bg.src) ? "" : bg.src} onChange={(v) => p.patchTheme("background", { src: v })} type="url" inputMode="url" placeholder="https://…" hint="Secure https:// link." />
            <RangeField label="Darken" value={bg.overlay} min={0} max={0.9} step={0.05} onChange={(v) => p.patchTheme("background", { overlay: v })} format={pct} />
            {!bg.src && <p className="text-xs text-mute">Add an image — until then the solid colour is used.</p>}
          </>
        )}
      </Section>

      <Section title="Colours" icon={<Icon name="palette" size={14} />}>
        <ColorField label="Accent" value={theme.colors.accent} onChange={(v) => p.patchTheme("colors", { accent: v })} />
        <ColorField label="Text" value={theme.colors.text} onChange={(v) => p.patchTheme("colors", { text: v })} />
        <ColorField label="Muted text" value={theme.colors.muted} onChange={(v) => p.patchTheme("colors", { muted: v })} />
        <ColorField label="Card colour" value={theme.colors.surface} onChange={(v) => p.patchTheme("colors", { surface: v })} />
        <ColorField label="Border colour" value={theme.colors.border} onChange={(v) => p.patchTheme("colors", { border: v })} />
      </Section>

      <Section title="Typography" icon={<Icon name="text" size={14} />} defaultOpen={false}>
        <SelectField label="Headings" value={theme.typography.heading} onChange={(v) => p.patchTheme("typography", { heading: v })} options={fontOpts} />
        <SelectField label="Body" value={theme.typography.body} onChange={(v) => p.patchTheme("typography", { body: v })} options={fontOpts} />
      </Section>

      <Section title="Cards" icon={<Icon name="sliders" size={14} />} defaultOpen={false}>
        <RangeField label="Corner radius" value={theme.card.radius} min={0} max={40} onChange={(v) => p.patchTheme("card", { radius: v })} format={(v) => `${v}px`} />
        <RangeField label="Border" value={theme.card.borderWidth} min={0} max={3} onChange={(v) => p.patchTheme("card", { borderWidth: v })} format={(v) => `${v}px`} />
        <RangeField label="Blur" value={theme.card.blur} min={0} max={32} onChange={(v) => p.patchTheme("card", { blur: v })} format={(v) => `${v}px`} />
        <RangeField label="Transparency" value={theme.card.opacity} min={0.05} max={1} step={0.05} onChange={(v) => p.patchTheme("card", { opacity: v })} format={(v) => `${Math.round(v * 100)}% solid`} />
      </Section>

      <Section title="Effects" icon={<Icon name="star" size={14} />} defaultOpen={false}>
        <RangeField label="Glow" value={theme.effects.glow} min={0} max={1} step={0.05} onChange={(v) => p.patchTheme("effects", { glow: v })} format={pct} />
        <SelectField label="Particles" value={theme.effects.particles} onChange={(v) => p.patchTheme("effects", { particles: v })} options={[{ value: "none", label: "None" }, { value: "stars", label: "Stars" }, { value: "embers", label: "Embers" }, { value: "snow", label: "Snow" }]} />
        <SelectField label="Animation" value={theme.effects.animation} onChange={(v) => p.patchTheme("effects", { animation: v })} options={[{ value: "none", label: "None" }, { value: "fade", label: "Fade in" }, { value: "float", label: "Fade + float" }]} />
        <SelectField label="3D emblem" value={theme.effects.emblem} onChange={(v) => p.patchTheme("effects", { emblem: v })} options={[{ value: "none", label: "None" }, { value: "shield", label: "Shield" }, { value: "logo", label: "M logo" }, { value: "bolt", label: "Lightning bolt" }, { value: "star", label: "Star" }, { value: "orb", label: "Crystal orb" }]} />
        <SelectField label="Click reaction" value={theme.effects.clickFx} onChange={(v) => p.patchTheme("effects", { clickFx: v })} options={[{ value: "none", label: "None" }, { value: "burst", label: "Spark burst" }, { value: "pow", label: "Comic POW!" }, { value: "wave", label: "Shockwave" }]} />
        <SelectField label="Cursor" value={theme.effects.cursor} onChange={(v) => p.patchTheme("effects", { cursor: v })} options={[{ value: "default", label: "Normal" }, { value: "ring", label: "Glow ring (desktop)" }]} />
        <Toggle label="3D card tilt" checked={theme.effects.tilt} onChange={(v) => p.patchTheme("effects", { tilt: v })} hint="Cards lean toward the pointer on hover." />
        <p className="text-xs text-mute">Effects respect each visitor&apos;s &ldquo;reduce motion&rdquo; setting. Particles/emblems are lightest on mobile.</p>
      </Section>
    </div>
  );
}
