"use client";
import { memo, useMemo } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BLOCKS, getBlockDef } from "@/profile/blocks/registry";
import type { DocBlock } from "@/profile/doc";
import { Icon } from "@/profile/icons";
import { canUse } from "@/profile/theme";
import { blockSummary } from "./block-editors";
import { useEditor, useEditorApi, validateDoc } from "./store";

const IconBtn = ({ label, onClick, children, disabled, danger }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean; danger?: boolean }) => (
  <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
    className={`grid size-9 place-items-center rounded-lg border text-xs transition disabled:opacity-35 ${danger ? "border-red-500/40 text-red-300 hover:bg-red-500/10" : "border-line text-zinc-300 hover:border-zinc-500"}`}>
    {children}
  </button>
);

const Row = memo(function Row({ block, index, count, selected, invalid }: { block: DocBlock; index: number; count: number; selected: boolean; invalid: boolean }) {
  const api = useEditorApi();
  const def = getBlockDef(block.type);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const st = api.getState();
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`rounded-xl border bg-panel ${selected ? "border-spark" : "border-line"} ${isDragging ? "z-10 opacity-80 shadow-xl" : ""}`}>
      <div className="flex items-center gap-1 p-1.5">
        <button ref={setActivatorNodeRef} {...attributes} {...listeners} type="button" aria-label={`Drag to reorder ${def?.label ?? "block"}. Or use the arrow buttons.`} style={{ touchAction: "none" }} className="grid size-9 shrink-0 cursor-grab place-items-center rounded-lg text-zinc-500 hover:text-zinc-200 active:cursor-grabbing">
          <Icon name="grip" size={18} />
        </button>
        <button type="button" onClick={() => st.select(block.id)} aria-current={selected} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-left hover:bg-white/5">
          <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${selected ? "bg-spark/15 text-spark" : "bg-ink text-zinc-300"}`}><Icon name={def?.icon ?? "link"} size={16} /></span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-bold">{def?.label ?? block.type}{invalid && <span className="text-red-400" title="Needs attention"><Icon name="alert" size={14} /></span>}{!block.visible && <span className="rounded bg-zinc-700 px-1.5 text-[10px] uppercase tracking-wide text-zinc-300">Hidden</span>}</span>
            <span className="block truncate text-xs text-mute">{blockSummary(block)}</span>
          </span>
        </button>
        <IconBtn label={block.visible ? "Hide block" : "Show block"} onClick={() => st.setVisible(block.id, !block.visible)}><Icon name={block.visible ? "eye" : "eyeOff"} size={16} /></IconBtn>
      </div>
      {selected && (
        <div className="flex flex-wrap gap-1.5 border-t border-line p-1.5">
          <IconBtn label="Move up" onClick={() => st.moveBlock(block.id, -1)} disabled={index === 0}><Icon name="up" size={16} /></IconBtn>
          <IconBtn label="Move down" onClick={() => st.moveBlock(block.id, 1)} disabled={index === count - 1}><Icon name="down" size={16} /></IconBtn>
          <IconBtn label="Duplicate block" onClick={() => st.duplicateBlock(block.id)} disabled={Boolean(def?.maxPerProfile)}><Icon name="copy" size={16} /></IconBtn>
          <IconBtn label="Delete block" onClick={() => st.removeBlock(block.id)} danger><Icon name="trash" size={16} /></IconBtn>
        </div>
      )}
    </li>
  );
});

export function BlocksPanel() {
  const api = useEditorApi();
  const blocks = useEditor((s) => s.blocks);
  const identity = useEditor((s) => s.identity);
  const selectedId = useEditor((s) => s.selectedId);
  const plan = useEditor((s) => s.plan);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const invalid = useMemo(() => validateDoc({ identity, blocks }).blockErrors, [identity, blocks]);
  const ids = useMemo(() => blocks.map((b) => b.id), [blocks]);

  const onDragEnd = (e: DragEndEvent) => { if (e.over && e.active.id !== e.over.id) api.getState().reorder(String(e.active.id), String(e.over.id)); };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-3">
        <h2 className="mb-2 hud text-[.62rem] text-zinc-400">Add block</h2>
        <div className="grid grid-cols-2 gap-2">
          {BLOCKS.map((d) => {
            const count = blocks.filter((b) => b.type === d.type).length;
            const maxed = Boolean(d.maxPerProfile && count >= d.maxPerProfile);
            const locked = !canUse(plan, d.requiresPlan);
            return (
              <button key={d.type} type="button" disabled={maxed || locked} onClick={() => api.getState().addBlock(d.type)} title={d.description}
                className="flex min-h-11 items-center gap-2 rounded-lg border border-line px-2.5 py-2 text-left text-xs font-bold hover:border-spark hover:text-spark disabled:cursor-not-allowed disabled:opacity-40">
                <Icon name={locked ? "lock" : maxed ? "check" : "plus"} size={14} />
                <span className="truncate">{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <h2 className="mb-2 hud text-[.62rem] text-zinc-400">Layout · {blocks.length}</h2>
        {blocks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-mute">No blocks yet. Add a Profile Header to start.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2" aria-label="Profile blocks">
                {blocks.map((b, i) => <Row key={b.id} block={b} index={i} count={blocks.length} selected={b.id === selectedId} invalid={Boolean(invalid[b.id])} />)}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
