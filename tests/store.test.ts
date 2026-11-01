import { describe, expect, it } from "vitest";
import { createEditorStore, isDirty, validateDoc, type EditorInit } from "@/components/editor/store";
import { defaultBlock } from "@/profile/doc";
import { PRESETS } from "@/profile/theme";

const init = (): EditorInit => ({
  username: "sufi", plan: "FREE", profileUrl: "https://marvel.wtf/sufi", revision: 0,
  identity: { displayName: "Sufi", bio: "", status: "" }, avatarUrl: null, bannerUrl: null,
  theme: PRESETS[0].theme, blocks: [defaultBlock("header")!], published: false, publishedMatches: false,
});
const mk = () => createEditorStore(init());

describe("editor store", () => {
  it("starts clean and selects the first block", () => {
    const s = mk().getState();
    expect(isDirty(s)).toBe(false);
    expect(s.saveState).toBe("saved");
    expect(s.selectedId).toBe(s.blocks[0].id);
  });
  it("add → marks dirty, selects new block, inserts after selection", () => {
    const st = mk();
    st.getState().addBlock("text");
    const s = st.getState();
    expect(s.blocks.map((b) => b.type)).toEqual(["header", "text"]);
    expect(s.selectedId).toBe(s.blocks[1].id);
    expect(isDirty(s)).toBe(true);
    expect(s.saveState).toBe("dirty");
  });
  it("only one header allowed; limit toast shown", () => {
    const st = mk();
    st.getState().addBlock("header");
    expect(st.getState().blocks.filter((b) => b.type === "header")).toHaveLength(1);
    expect(st.getState().toast).toMatch(/Only 1/);
  });
  it("update merges settings immutably (other blocks keep identity)", () => {
    const st = mk();
    st.getState().addBlock("link");
    const before = st.getState().blocks;
    st.getState().updateBlock(before[1].id, { title: "Discord" });
    const after = st.getState().blocks;
    expect(after[1].settings.title).toBe("Discord");
    expect(after[0]).toBe(before[0]); // header object untouched → memoized preview row skips re-render
    expect(after[1]).not.toBe(before[1]);
  });
  it("duplicate → copy has new id & deep-copied settings; header cannot be duplicated", () => {
    const st = mk();
    st.getState().addBlock("link");
    const link = st.getState().blocks[1];
    st.getState().duplicateBlock(link.id);
    const [, a, b] = st.getState().blocks;
    expect(b.id).not.toBe(a.id);
    expect(b.settings).toEqual(a.settings);
    expect(b.settings).not.toBe(a.settings);
    st.getState().duplicateBlock(st.getState().blocks[0].id);
    expect(st.getState().blocks.filter((x) => x.type === "header")).toHaveLength(1);
  });
  it("delete + undo restores block at its position", () => {
    const st = mk();
    st.getState().addBlock("text"); st.getState().addBlock("link");
    const mid = st.getState().blocks[1];
    st.getState().removeBlock(mid.id);
    expect(st.getState().blocks).toHaveLength(2);
    expect(st.getState().undo?.block.id).toBe(mid.id);
    st.getState().undoRemove();
    expect(st.getState().blocks[1].id).toBe(mid.id);
    expect(st.getState().undo).toBeNull();
  });
  it("move up/down and reorder", () => {
    const st = mk();
    st.getState().addBlock("text"); st.getState().addBlock("link"); st.getState().addBlock("spacer");
    const ids = () => st.getState().blocks.map((b) => b.type);
    expect(ids()).toEqual(["header", "text", "link", "spacer"]);
    st.getState().moveBlock(st.getState().blocks[3].id, -1);
    expect(ids()).toEqual(["header", "text", "spacer", "link"]);
    st.getState().moveBlock(st.getState().blocks[0].id, -1); // already first → no-op
    expect(ids()[0]).toBe("header");
    st.getState().reorder(st.getState().blocks[1].id, st.getState().blocks[3].id);
    expect(ids()).toEqual(["header", "spacer", "link", "text"]);
  });
  it("hide toggles visibility", () => {
    const st = mk();
    st.getState().setVisible(st.getState().blocks[0].id, false);
    expect(st.getState().blocks[0].visible).toBe(false);
  });
  it("theme: preset replaces theme; patch changes one section only", () => {
    const st = mk();
    st.getState().applyPreset("vigilante");
    expect(st.getState().theme.presetId).toBe("vigilante");
    const before = st.getState().theme;
    st.getState().patchTheme("colors", { accent: "#123456" });
    expect(st.getState().theme.colors.accent).toBe("#123456");
    expect(st.getState().theme.card).toBe(before.card);
  });
  it("validateDoc flags invalid blocks; defaults are valid", () => {
    const st = mk();
    st.getState().addBlock("link");
    expect(validateDoc(st.getState()).count).toBe(0);
    st.getState().updateBlock(st.getState().blocks[1].id, { title: "", url: "bad" });
    const v = validateDoc(st.getState());
    expect(v.count).toBe(1);
    expect(v.firstBlock).toBe(st.getState().blocks[1].id);
    st.getState().setIdentity({ displayName: "" });
    expect(validateDoc(st.getState()).identityErrors.displayName).toBeTruthy();
  });
  it("save refuses to send an invalid document (no network call)", async () => {
    const st = mk();
    st.getState().setIdentity({ displayName: "" });
    const ok = await st.getState().save();
    expect(ok).toBe(false);
    expect(st.getState().saveState).toBe("invalid");
  });
});
