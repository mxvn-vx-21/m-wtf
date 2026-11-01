import Link from "next/link";
import { memo, type ReactNode } from "react";
import { Emblem3D } from "@/components/three/Emblem3D";
import { getBlockDef } from "./blocks/registry";
import type { BlockCtx, IdentityView } from "./blocks/types";
import type { ViewBlock, ViewModel } from "./doc";
import { themeToCss } from "./theme";

export type ViewMode = "public" | "preview" | "editor";

/**
 * THE renderer. One component for: public pages, owner draft preview, and the builder's live preview.
 * Pure function of the ViewModel → deterministic, cacheable, safe (no HTML injection anywhere).
 *
 *   ViewModel ─ theme ─▶ CSS variables
 *             └ blocks ─▶ registry.Render(settings)   (invalid/unknown blocks are skipped, never crash)
 */
const BlockView = memo(function BlockView({ block, identity, mode, selected }: { block: ViewBlock; identity: IdentityView; mode: ViewMode; selected: boolean }) {
  const def = getBlockDef(block.type);
  if (!def) return null;
  const parsed = def.schema.safeParse(block.settings);
  const editing = mode === "editor";
  if (!parsed.success) {
    // Public: skip silently. Editor: show a clear placeholder so the user can fix it.
    return editing ? (
      <div className="pv-block" data-block-id={block.id} data-selected={selected} data-label={def.label}>
        <div className="pv-img-fail" role="alert">This {def.label.toLowerCase()} block has invalid settings.</div>
      </div>
    ) : null;
  }
  const ctx: BlockCtx = { identity, editing };
  const node: ReactNode = <def.Render settings={parsed.data} ctx={ctx} />;
  if (node === null) return null;
  return editing ? (
    <div className="pv-block" data-block-id={block.id} data-selected={selected} data-hidden={!block.visible} data-label={`${def.label}${block.visible ? "" : " · hidden"}`}>
      {node}
    </div>
  ) : (
    <div className="pv-block">{node}</div>
  );
});

export function ProfileView({ vm, mode = "public", selectedId = null, ownerEmpty = false }: { vm: ViewModel; mode?: ViewMode; selectedId?: string | null; ownerEmpty?: boolean }) {
  const { style, bgImage, fx, animation } = themeToCss(vm.theme);
  const blocks = mode === "editor" ? vm.blocks : vm.blocks.filter((b) => b.visible);
  const empty = blocks.length === 0;

  return (
    <div className="pv" style={style} data-img={bgImage} data-anim={animation} data-editor={mode === "editor"} data-cursor={vm.theme.effects.cursor} data-clickfx={vm.theme.effects.clickFx} data-tilt={String(vm.theme.effects.tilt)}>
      {fx !== "none" && <div className={`pv-fx pv-fx-${fx}`} aria-hidden />}
      <main className="pv-shell">
        {vm.theme.effects.emblem !== "none" && (
          <div className="pv-emblem"><Emblem3D model={vm.theme.effects.emblem} accent={vm.theme.colors.accent} look="obsidian" label="Decorative 3D emblem. Drag to spin." /></div>
        )}
        {empty && ownerEmpty ? (
          <section className="pv-card pv-empty">
            <h1 className="pv-name">Your hero hasn&apos;t been built yet.</h1>
            <p className="pv-bio">Add a header, a few links and pick an identity — it takes about two minutes.</p>
            <Link href="/dashboard/editor" className="pv-btn">Open Builder</Link>
          </section>
        ) : empty && mode !== "editor" ? (
          // Public profile with no blocks: a tasteful minimal identity instead of a broken page.
          <MinimalHeader identity={vm.identity} />
        ) : empty ? (
          <section className="pv-card pv-empty"><p className="pv-bio">Add your first block from the Blocks panel.</p></section>
        ) : (
          blocks.map((b) => <BlockView key={b.id} block={b} identity={vm.identity} mode={mode} selected={b.id === selectedId} />)
        )}
        <footer className="pv-footer">
          <Link href="/" className="pv-brand">MARVEL.WTF</Link>
          <span>Build your identity</span>
        </footer>
      </main>
    </div>
  );
}

function MinimalHeader({ identity: i }: { identity: IdentityView }) {
  return (
    <header className="pv-header">
      <div className="pv-ident" style={{ paddingTop: 72 }}>
        <div className={i.avatarUrl ? "pv-avatar pv-skel" : "pv-avatar"}>{i.avatarUrl ? <img src={i.avatarUrl} alt={`${i.displayName}'s avatar`} width={132} height={132} /> : <span aria-hidden>{(i.displayName || i.username).charAt(0).toUpperCase()}</span>}</div>
        <h1 className="pv-name">{i.displayName}</h1>
        <p className="pv-handle">@{i.username}</p>
      </div>
    </header>
  );
}
