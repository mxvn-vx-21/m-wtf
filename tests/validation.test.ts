import { describe, expect, it } from "vitest";
import { validateSettings, BLOCKS } from "@/profile/blocks/registry";
import { buildSnapshot, computeCompletion, draftSchema, snapshotsEqual, stableStringify } from "@/profile/doc";
import { httpUrl, imageSrc, mediaOwner, secureMediaUrl } from "@/profile/text";
import { BG_PRESET_KEYS, PRESETS, resolveTheme, themeSchema, themeToCss, canUse } from "@/profile/theme";
import { validateUsername } from "@/lib/username";

const uuid = () => crypto.randomUUID();
const header = () => ({ id: uuid(), type: "header", visible: true, settings: BLOCKS[0].defaults() as Record<string, unknown> });

describe("URL safety", () => {
  it("accepts https/http links only", () => {
    expect(httpUrl.safeParse("https://example.com/a?b=1").success).toBe(true);
    for (const bad of ["javascript:alert(1)", "data:text/html,<script>", "file:///etc/passwd", "//evil.com", "ftp://x.com", "https://exa mple.com", 'https://x.com/"onmouseover="x', ""]) {
      expect(httpUrl.safeParse(bad).success, bad).toBe(false);
    }
  });
  it("media URLs must be https and not private/loopback", () => {
    expect(secureMediaUrl.safeParse("https://cdn.example.com/a.mp3").success).toBe(true);
    for (const bad of ["http://example.com/a.mp3", "https://localhost/a", "https://127.0.0.1/a", "https://192.168.1.5/a", "https://10.0.0.2/a", "https://169.254.169.254/latest"]) {
      expect(secureMediaUrl.safeParse(bad).success, bad).toBe(false);
    }
  });
  it("image src: own uploads or https; blocks CSS/HTML injection", () => {
    const id = "abcdefgh1234";
    expect(imageSrc.safeParse(`/api/media/images/${id}/${uuid()}.webp`).success).toBe(true);
    expect(mediaOwner(`/api/media/images/${id}/${uuid()}.webp`)).toBe(id);
    expect(imageSrc.safeParse("https://placehold.co/10x10.png").success).toBe(true);
    for (const bad of ['https://x.com/a"),url(https://evil', "https://x.com/a)", "/api/media/../../etc/passwd", "/api/media/images/x/y.svg", "javascript:1", "http://x.com/a.png"]) {
      expect(imageSrc.safeParse(bad).success, bad).toBe(false);
    }
  });
});

describe("block validation (server rules)", () => {
  it("every block's defaults are valid", () => {
    for (const b of BLOCKS) expect(validateSettings(b.type, b.defaults()).ok, b.type).toBe(true);
  });
  it("link: title + url required", () => {
    const r = validateSettings("link", { title: "  ", url: "nope", icon: "link", description: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.errors.title).toBe("Title is required."); expect(r.errors.url).toMatch(/valid URL/); }
  });
  it("link: unknown icon rejected", () => expect(validateSettings("link", { title: "a", url: "https://a.co", icon: "<script>", description: "" }).ok).toBe(false));
  it("text: needs a title or body; strips control/bidi chars", () => {
    expect(validateSettings("text", { title: "", body: "", align: "left" }).ok).toBe(false);
    const ok = validateSettings("text", { title: "Hi\u202E", body: "x\u0000y", align: "left" });
    expect(ok.ok && (ok.data as { title: string; body: string })).toMatchObject({ title: "Hi", body: "xy" });
  });
  it("socials: platform must exist, URL valid, max 14", () => {
    expect(validateSettings("socials", { title: "", style: "icons", items: [{ id: "abcd1234", platform: "myspace9", url: "https://a.co" }] }).ok).toBe(false);
    const many = Array.from({ length: 15 }, (_, i) => ({ id: `id-${i}-xxxx`, platform: "github", url: "https://github.com" }));
    expect(validateSettings("socials", { title: "", style: "icons", items: many }).ok).toBe(false);
  });
  it("music: https only", () => {
    expect(validateSettings("music", { url: "http://a.com/x.mp3", title: "t", artist: "", autoplay: false, loop: false }).ok).toBe(false);
    expect(validateSettings("music", { url: "https://a.com/x.mp3", title: "t", artist: "", autoplay: true, loop: true }).ok).toBe(true);
  });
  it("spacer: height range", () => {
    expect(validateSettings("spacer", { height: 4 }).ok).toBe(false);
    expect(validateSettings("spacer", { height: 241 }).ok).toBe(false);
    expect(validateSettings("spacer", { height: 40 }).ok).toBe(true);
  });
  it("unknown block type rejected", () => expect(validateSettings("script", {}).ok).toBe(false));
});

describe("draft document", () => {
  const base = () => ({ baseRevision: 0, identity: { displayName: "Sufi", bio: "", status: "" }, theme: PRESETS[1].theme, blocks: [header()] });
  it("accepts a valid document", () => expect(draftSchema.safeParse(base()).success).toBe(true));
  it("rejects two headers, duplicate ids, unknown types, non-uuid ids, >40 blocks", () => {
    const h = header();
    expect(draftSchema.safeParse({ ...base(), blocks: [h, header()] }).success).toBe(false);
    expect(draftSchema.safeParse({ ...base(), blocks: [h, { ...h }] }).success).toBe(false);
    expect(draftSchema.safeParse({ ...base(), blocks: [{ id: uuid(), type: "iframe", visible: true, settings: {} }] }).success).toBe(false);
    expect(draftSchema.safeParse({ ...base(), blocks: [{ ...h, id: "1; DROP TABLE" }] }).success).toBe(false);
    const spacers = Array.from({ length: 41 }, () => ({ id: uuid(), type: "spacer", visible: true, settings: { height: 10 } }));
    expect(draftSchema.safeParse({ ...base(), blocks: spacers }).success).toBe(false);
  });
  it("rejects blank display name and over-long bio", () => {
    expect(draftSchema.safeParse({ ...base(), identity: { displayName: "   ", bio: "", status: "" } }).success).toBe(false);
    expect(draftSchema.safeParse({ ...base(), identity: { displayName: "x", bio: "a".repeat(281), status: "" } }).success).toBe(false);
  });
});

describe("themes", () => {
  it("all presets are valid and use known background presets", () => {
    for (const p of PRESETS) { expect(themeSchema.safeParse(p.theme).success, p.id).toBe(true); }
    expect(PRESETS.map((p) => p.id)).toEqual(["default", "hero", "vigilante", "tech", "cosmic", "villain"]);
    expect(BG_PRESET_KEYS.length).toBeGreaterThan(3);
  });
  it("rejects bad colours / out-of-range numbers / unknown fonts", () => {
    const t = JSON.parse(JSON.stringify(PRESETS[0].theme));
    expect(themeSchema.safeParse({ ...t, colors: { ...t.colors, accent: "red; background:url(x)" } }).success).toBe(false);
    expect(themeSchema.safeParse({ ...t, card: { ...t.card, radius: 999 } }).success).toBe(false);
    expect(themeSchema.safeParse({ ...t, typography: { heading: "Comic Sans", body: "system" } }).success).toBe(false);
    expect(themeSchema.safeParse({ ...t, background: { ...t.background, src: 'https://x.com/a"),url(//evil' } }).success).toBe(false);
  });
  it("resolveTheme never throws and falls back (legacy V0 ids + junk)", () => {
    expect(resolveTheme(null, "midnight").presetId).toBe("tech");
    expect(resolveTheme({ nonsense: 1 }, "default-dark").presetId).toBe("default");
    expect(resolveTheme("garbage", "???").presetId).toBe("default");
  });
  it("themeToCss emits CSS variables only from validated config", () => {
    const t = { ...PRESETS[0].theme, background: { ...PRESETS[0].theme.background, type: "image" as const, src: "https://placehold.co/a.png", overlay: 0.4 } };
    const { style, bgImage } = themeToCss(t);
    expect(bgImage).toBe(true);
    expect(String((style as Record<string, string>)["--p-bg"])).toContain('url("https://placehold.co/a.png")');
  });
  it("plan gating helper (premium-ready)", () => {
    expect(canUse("FREE", undefined)).toBe(true);
    expect(canUse("FREE", "PREMIUM")).toBe(false);
    expect(canUse("PREMIUM", "PREMIUM")).toBe(true);
  });
});

describe("snapshots & completion", () => {
  const theme = PRESETS[1].theme;
  const id = { displayName: "A", bio: "b", status: "s" };
  it("snapshot excludes hidden blocks and is order-stable", () => {
    const a = { id: uuid(), type: "spacer", visible: true, settings: { height: 8 } };
    const b = { id: uuid(), type: "spacer", visible: false, settings: { height: 9 } };
    const s = buildSnapshot({ identity: id, avatarKey: null, bannerKey: null, theme, blocks: [a, b] });
    expect(s.blocks).toHaveLength(1);
    expect(snapshotsEqual({ x: 1, y: [2, { b: 1, a: 2 }] }, { y: [2, { a: 2, b: 1 }], x: 1 })).toBe(true);
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(snapshotsEqual(s, buildSnapshot({ identity: { ...id, bio: "changed" }, avatarKey: null, bannerKey: null, theme, blocks: [a, b] }))).toBe(false);
  });
  it("completion percent", () => {
    expect(computeCompletion({ hasAvatar: false, displayName: "sufi", username: "sufi", bio: "", contentBlocks: 0, customizedTheme: false, published: false }).percent).toBe(0);
    expect(computeCompletion({ hasAvatar: true, displayName: "Sufi", username: "sufi", bio: "hi", contentBlocks: 2, customizedTheme: true, published: true }).percent).toBe(100);
  });
});

describe("usernames (V0 rules still hold)", () => {
  it("reserved + case-insensitive", () => {
    expect(validateUsername("Admin").ok).toBe(false);
    expect(validateUsername("editor").ok).toBe(false); // new V1 route
    expect(validateUsername("Sufi_X")).toMatchObject({ ok: true, username: "sufi_x" });
  });
});
