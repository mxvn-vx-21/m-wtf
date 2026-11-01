// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorShell } from "@/components/editor/EditorShell";
import type { EditorInit } from "@/components/editor/store";
import { defaultBlock } from "@/profile/doc";
import { PRESETS } from "@/profile/theme";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("next/link", () => ({ default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a> }));

const init = (): EditorInit => ({
  username: "sufi", plan: "FREE", profileUrl: "https://marvel.wtf/sufi", revision: 3,
  identity: { displayName: "Sufiyan", bio: "Builder", status: "Shipping" }, avatarUrl: null, bannerUrl: null,
  theme: PRESETS[0].theme, blocks: [defaultBlock("header")!], published: false, publishedMatches: false,
});

let calls: { url: string; method: string; body?: any }[]; // eslint-disable-line @typescript-eslint/no-explicit-any
beforeEach(() => {
  calls = [];
  let rev = 3;
  vi.stubGlobal("fetch", vi.fn(async (url: string, o: RequestInit = {}) => {
    const body = o.body ? JSON.parse(String(o.body)) : undefined;
    calls.push({ url, method: o.method ?? "GET", body });
    if (url === "/api/profile/draft") { rev += 1; return new Response(JSON.stringify({ ok: true, revision: rev, publishedMatches: false }), { status: 200 }); }
    if (url === "/api/profile/publish") return new Response(JSON.stringify({ ok: true }), { status: 200 });
    return new Response(JSON.stringify({ ok: false }), { status: 404 });
  }));
  window.matchMedia = window.matchMedia || ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }) as MediaQueryList);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const preview = () => screen.getByRole("region", { name: /live preview/i });

describe("builder UI (jsdom)", () => {
  it("renders the 3 areas: blocks, live preview, settings; header selected by default", () => {
    render(<EditorShell init={init()} />);
    expect(screen.getByRole("complementary", { name: "Blocks" })).toBeTruthy();
    expect(within(preview()).getByRole("heading", { level: 1 }).textContent).toBe("Sufiyan");
    expect(screen.getByLabelText("Display name")).toBeTruthy(); // header editor open
    expect(screen.getByText("Saved")).toBeTruthy();
  });

  it("LIVE PREVIEW: typing the display name updates the preview instantly and flags unsaved", async () => {
    const u = userEvent.setup();
    render(<EditorShell init={init()} />);
    const input = screen.getByLabelText("Display name");
    await u.clear(input); await u.type(input, "Sufi Prime");
    expect(within(preview()).getByRole("heading", { level: 1 }).textContent).toBe("Sufi Prime");
    expect(screen.getByText("Unsaved changes")).toBeTruthy();
  });

  it("add Link block → appears in list + preview; editing title updates preview; selected block is highlighted", async () => {
    const u = userEvent.setup();
    render(<EditorShell init={init()} />);
    await u.click(screen.getByRole("button", { name: /^Link$/ }));
    const list = screen.getByRole("list", { name: "Profile blocks" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(preview()).getByText("My website")).toBeTruthy();
    const sel = preview().querySelector('[data-selected="true"]') as HTMLElement;
    expect(sel.dataset.label).toBe("Link");
    const title = screen.getByLabelText("Title");
    await u.clear(title); await u.type(title, "MY DISCORD");
    expect(within(preview()).getByText("MY DISCORD")).toBeTruthy();
  });

  it("clicking a block IN THE PREVIEW selects it (and links never navigate)", async () => {
    const u = userEvent.setup();
    render(<EditorShell init={init()} />);
    await u.click(screen.getByRole("button", { name: /^Link$/ }));
    await u.click(screen.getByRole("button", { name: /^Text$/ }));
    expect((preview().querySelector('[data-selected="true"]') as HTMLElement).dataset.label).toBe("Text");
    const linkEl = within(preview()).getByText("My website").closest("a")!;
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
    linkEl.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    await waitFor(() => expect((preview().querySelector('[data-selected="true"]') as HTMLElement).dataset.label).toBe("Link"));
  });

  it("VALIDATION: empty title/invalid URL show messages and block saving (no request sent)", async () => {
    const u = userEvent.setup();
    render(<EditorShell init={init()} />);
    await u.click(screen.getByRole("button", { name: /^Link$/ }));
    await u.clear(screen.getByLabelText("Title"));
    const url = screen.getByLabelText("URL"); await u.clear(url); await u.type(url, "javascript:alert(1)");
    expect(screen.getByText("Title is required.")).toBeTruthy();
    expect(screen.getAllByText(/Enter a valid URL/).length).toBeGreaterThan(0);
    await u.click(screen.getByRole("button", { name: "Save" }));
    expect(calls.filter((c) => c.method === "PUT")).toHaveLength(0);
    expect(screen.getAllByText(/Fix 1 issue|Fix errors to save/).length).toBeGreaterThan(0);
  });

  it("SAVE: sends the whole document with baseRevision, then shows Saved", async () => {
    const u = userEvent.setup();
    render(<EditorShell init={init()} />);
    await u.click(screen.getByRole("button", { name: /^Text$/ }));
    await u.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    const put = calls.find((c) => c.method === "PUT")!;
    expect(put.body.baseRevision).toBe(3);
    expect(put.body.blocks.map((b: { type: string }) => b.type)).toEqual(["header", "text"]);
    expect(put.body.identity.displayName).toBe("Sufiyan");
    await waitFor(() => expect(screen.getByText("Saved")).toBeTruthy());
  });

  it("AUTOSAVE fires after a pause (debounced), once", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const u = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<EditorShell init={init()} />);
    await u.click(screen.getByRole("button", { name: /^Spacer$/ }));
    expect(calls.filter((c) => c.method === "PUT")).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(2200);
    await waitFor(() => expect(calls.filter((c) => c.method === "PUT")).toHaveLength(1));
  });

  it("DELETE shows Undo; UNDO restores the block", async () => {
    const u = userEvent.setup();
    render(<EditorShell init={init()} />);
    await u.click(screen.getByRole("button", { name: /^Link$/ }));
    await u.click(screen.getByRole("button", { name: "Delete block" }));
    const list = screen.getByRole("list", { name: "Profile blocks" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    await u.click(screen.getByRole("button", { name: "Undo" }));
    expect(within(screen.getByRole("list", { name: "Profile blocks" })).getAllByRole("listitem")).toHaveLength(2);
  });

  it("DUPLICATE + MOVE UP/DOWN + HIDE work (and header can't be duplicated)", async () => {
    const u = userEvent.setup();
    render(<EditorShell init={init()} />);
    await u.click(screen.getByRole("button", { name: /^Link$/ }));
    await u.click(screen.getByRole("button", { name: "Duplicate block" }));
    let items = within(screen.getByRole("list", { name: "Profile blocks" })).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    await u.click(screen.getByRole("button", { name: "Move up" }));
    items = within(screen.getByRole("list", { name: "Profile blocks" })).getAllByRole("listitem");
    expect(items[1].textContent).toContain("Link");
    await u.click(within(items[1]).getByRole("button", { name: "Hide block" }));
    expect(within(screen.getByRole("list", { name: "Profile blocks" })).getAllByText("Hidden")).toHaveLength(1);
    // header row: select it → Duplicate is disabled
    await u.click(within(items[0]).getByRole("button", { name: /^Profile Header/ }));
    expect((screen.getByRole("button", { name: "Duplicate block" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("Only one header: the Profile Header add button is disabled", () => {
    render(<EditorShell init={init()} />);
    expect((screen.getByRole("button", { name: /Profile Header/, description: /Avatar, name/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("THEME: picking Vigilante restyles the preview immediately; accent colour customizes it", async () => {
    const u = userEvent.setup();
    render(<EditorShell init={init()} />);
    await u.click(screen.getByRole("tab", { name: "Appearance" }));
    await u.click(screen.getByRole("button", { name: /Vigilante/ }));
    const root = preview().querySelector(".pv") as HTMLElement;
    expect(root.style.getPropertyValue("--p-accent")).toBe("#ff3b30");
    const accent = screen.getByLabelText("Accent");
    fireEvent.change(accent, { target: { value: "#00ff88" } });
    expect(root.style.getPropertyValue("--p-accent")).toBe("#00ff88");
  });

  it("PUBLISH saves first, then publishes; button becomes Published", async () => {
    const u = userEvent.setup();
    render(<EditorShell init={init()} />);
    await u.click(screen.getByRole("button", { name: /^Text$/ }));
    await u.click(screen.getByRole("button", { name: "Publish" }));
    await waitFor(() => expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(["PUT /api/profile/draft", "POST /api/profile/publish"]));
    await waitFor(() => expect(screen.getByRole("button", { name: "Published" })).toBeTruthy());
    expect((screen.getByRole("button", { name: "Published" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("UNSAVED CHANGES: leaving the tab is blocked; Back opens Save / Discard / Keep editing", async () => {
    const u = userEvent.setup();
    render(<EditorShell init={init()} />);
    const clean = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    await u.click(screen.getByRole("button", { name: /^Text$/ }));
    const dirty = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
    await u.click(screen.getByRole("link", { name: /back to dashboard/i }));
    const dlg = screen.getByRole("alertdialog");
    expect(within(dlg).getByRole("button", { name: "Save & leave" })).toBeTruthy();
    expect(within(dlg).getByRole("button", { name: "Discard" })).toBeTruthy();
    await u.click(within(dlg).getByRole("button", { name: "Keep editing" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("CONFLICT (409) surfaces a Reload banner and stops autosave", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => new Response(JSON.stringify({ ok: false, error: "changed elsewhere", code: "conflict" }), { status: 409 }));
    const u = userEvent.setup();
    render(<EditorShell init={init()} />);
    await u.click(screen.getByRole("button", { name: /^Text$/ }));
    await u.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy());
    expect(screen.getByText("Reload needed")).toBeTruthy();
  });

  it("MOBILE nav: Preview / Blocks / Edit / Theme tabs exist and switch panels", async () => {
    const u = userEvent.setup();
    render(<EditorShell init={init()} />);
    const nav = screen.getByRole("navigation", { name: "Editor sections" });
    for (const n of ["Preview", "Blocks", "Edit", "Theme"]) expect(within(nav).getByRole("button", { name: n })).toBeTruthy();
    await u.click(within(nav).getByRole("button", { name: "Theme" }));
    expect(within(nav).getByRole("button", { name: "Theme" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: /Cosmic/ })).toBeTruthy();
  });

  it("Socials: add platform links, remove one; Music: autoplay never starts while editing", async () => {
    const u = userEvent.setup();
    render(<EditorShell init={init()} />);
    await u.click(screen.getByRole("button", { name: /Social Links/ }));
    await u.click(screen.getByRole("button", { name: /Add social link/ }));
    await u.click(screen.getByRole("button", { name: /Add social link/ }));
    expect(preview().querySelectorAll("a.pv-social")).toHaveLength(2);
    await u.click(screen.getAllByRole("button", { name: /^Remove / })[0]);
    expect(preview().querySelectorAll("a.pv-social")).toHaveLength(1);
    const play = vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    await u.click(screen.getByRole("button", { name: /^Music$/ }));
    await u.click(screen.getByRole("switch", { name: "Autoplay" }));
    expect(play).not.toHaveBeenCalled();
  });
});
