import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { buildGeometry } from "@/three/emblem";
import { EMBLEM_MODELS, fallbackPath } from "@/three/shapes";
import { PRESETS, resolveTheme, themeSchema } from "@/profile/theme";

describe("3D emblem geometry", () => {
  for (const m of EMBLEM_MODELS) {
    it(`${m}: builds a normalised, non-degenerate mesh`, () => {
      const g = buildGeometry(m);
      g.computeBoundingBox();
      const size = new THREE.Vector3();
      g.boundingBox!.getSize(size);
      expect(g.attributes.position.count).toBeGreaterThan(20);
      expect(Math.max(size.x, size.y)).toBeGreaterThan(3.2);
      expect(Math.max(size.x, size.y)).toBeLessThan(3.6);
      expect(Number.isFinite(size.z) && size.z > 0.2).toBe(true);
      for (const v of g.attributes.position.array) expect(Number.isFinite(v)).toBe(true);
      g.dispose();
    });
    it(`${m}: SVG fallback path exists`, () => expect(fallbackPath(m).length).toBeGreaterThan(10));
  }
});

describe("theme back-compat (new V1.1 effect fields)", () => {
  it("a theme stored BEFORE the new effects existed still parses, with safe defaults", () => {
    const old = JSON.parse(JSON.stringify(PRESETS[0].theme));
    delete old.effects.cursor; delete old.effects.clickFx; delete old.effects.tilt; delete old.effects.emblem;
    const r = themeSchema.safeParse(old);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.effects).toMatchObject({ cursor: "default", clickFx: "none", tilt: false, emblem: "none" });
    expect(resolveTheme(old, null).effects.emblem).toBe("none");
  });
  it("rejects unknown emblem/cursor/click values", () => {
    const t = JSON.parse(JSON.stringify(PRESETS[1].theme));
    for (const [k, v] of [["emblem", "dragon"], ["clickFx", "explode"], ["cursor", "custom-url"]]) {
      expect(themeSchema.safeParse({ ...t, effects: { ...t.effects, [k]: v } }).success, k).toBe(false);
    }
  });
  it("presets use the brand fonts", () => {
    const fonts = new Set(PRESETS.flatMap((p) => [p.theme.typography.heading, p.theme.typography.body]));
    for (const f of ["rdr2", "orbitron", "dihjau"]) expect(fonts.has(f as never)).toBe(true);
  });
});
