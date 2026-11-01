import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { BOLT_POLY, LOGO_POLY, SHIELD_CMDS, SHIELD_HOLE, starPoly, type EmblemModel } from "./shapes";

export interface EmblemOptions {
  model: EmblemModel;
  accent: string;
  interactive?: boolean;
  /** "auto" picks by device: coarse pointers / few cores get the lighter metal look. */
  quality?: "auto" | "high" | "low";
  /** glass = refractive crystal · chrome = polished metal · obsidian = dark glass with a glowing core */
  look?: "glass" | "chrome" | "obsidian";
}
export interface EmblemHandle {
  dispose(): void;
  setAccent(hex: string): void;
  pulse(): void;
}

/* ── Geometry (pure three, no WebGL needed → unit-testable in Node) ───────────────────────── */
function shapeOf(pts: [number, number][]) {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}

export function buildGeometry(model: EmblemModel): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry;
  if (model === "orb") {
    geo = new THREE.IcosahedronGeometry(5, 1);
  } else {
    let shape: THREE.Shape;
    if (model === "logo") shape = shapeOf(LOGO_POLY);
    else if (model === "bolt") shape = shapeOf(BOLT_POLY);
    else if (model === "star") shape = shapeOf(starPoly());
    else {
      shape = new THREE.Shape();
      for (const c of SHIELD_CMDS) {
        const [k, ...n] = c as [string, ...number[]];
        if (k === "M") shape.moveTo(n[0], n[1]);
        else if (k === "L") shape.lineTo(n[0], n[1]);
        else shape.bezierCurveTo(n[0], n[1], n[2], n[3], n[4], n[5]);
      }
      shape.closePath();
      const hole = new THREE.Path();
      SHIELD_HOLE.forEach(([x, y], i) => (i ? hole.lineTo(x, y + 0.6) : hole.moveTo(x, y + 0.6)));
      hole.closePath();
      shape.holes.push(hole);
    }
    geo = new THREE.ExtrudeGeometry(shape, { depth: 2.4, bevelEnabled: true, bevelThickness: 0.7, bevelSize: 0.55, bevelSegments: 5, curveSegments: 24 });
  }
  geo.center();
  geo.computeBoundingBox();
  const size = new THREE.Vector3();
  geo.boundingBox!.getSize(size);
  const k = 3.4 / Math.max(size.x, size.y); // normalise to ~3.4 world units
  geo.scale(k, k, k);
  geo.computeVertexNormals();
  return geo;
}

/* ── Scene ──────────────────────────────────────────────────────────────────────────────── */
export function createEmblem(container: HTMLElement, opts: EmblemOptions): EmblemHandle | null {
  const coarse = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let high = opts.quality === "high" || (opts.quality !== "low" && !coarse && (navigator.hardwareConcurrency ?? 4) >= 4);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null; // no WebGL → caller shows the SVG fallback
  }
  const canvas = renderer.domElement;
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y;outline:none";
  canvas.setAttribute("aria-hidden", "true");
  container.appendChild(canvas);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  const accent = new THREE.Color(opts.accent);
  const root = new THREE.Group();
  scene.add(root);

  /* body */
  const geo = buildGeometry(opts.model);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.06, transmission: 1, thickness: 1.8, ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.05, attenuationColor: accent.clone(), attenuationDistance: 2.2, envMapIntensity: 1.6, specularIntensity: 1 });
  const look = opts.look ?? "glass";
  const metal = look === "chrome"
    ? new THREE.MeshPhysicalMaterial({ color: 0xd9dde8, metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.5 })
    : new THREE.MeshPhysicalMaterial({ color: 0x0b0b10, metalness: 0.9, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.7 });
  // obsidian: dark mirror-glass body + a bright accent core that you see through the bevels
  const obsidian = new THREE.MeshPhysicalMaterial({ color: 0x06060a, metalness: 0.25, roughness: 0.07, transmission: 0.55, thickness: 2.2, ior: 1.6, clearcoat: 1, clearcoatRoughness: 0.03, attenuationColor: accent.clone(), attenuationDistance: 0.9, envMapIntensity: 2.1 });
  const useGlass = look === "glass" || look === "obsidian";
  const body = new THREE.Mesh(geo, high && useGlass ? (look === "glass" ? glass : obsidian) : metal);
  root.add(body);

  /* accent core + HUD edges */
  const coreBase = look === "obsidian" ? 0.85 : 0.3;
  const coreMat = new THREE.MeshBasicMaterial({ color: accent.clone(), transparent: true, opacity: coreBase });
  const core = new THREE.Mesh(geo, coreMat);
  core.scale.setScalar(look === "obsidian" ? 0.62 : 0.72);
  root.add(core);
  const edgeMat = new THREE.LineBasicMaterial({ color: accent.clone(), transparent: true, opacity: 0.85 });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), edgeMat);
  edges.scale.setScalar(1.002);
  root.add(edges);

  /* lights */
  const key = new THREE.PointLight(0xffffff, 55, 30, 1.6);
  key.position.set(4, 5, 8);
  const rim = new THREE.PointLight(accent.clone(), 70, 30, 1.4);
  rim.position.set(-6, -2, -3);
  scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.15));

  /* orbiting shards */
  const shardCount = high ? 34 : 14;
  const shardGeo = new THREE.OctahedronGeometry(0.16, 0);
  const shardMat = new THREE.MeshStandardMaterial({ color: 0x1b1b24, metalness: 0.9, roughness: 0.3, emissive: accent.clone(), emissiveIntensity: 0.35 });
  const shards = new THREE.InstancedMesh(shardGeo, shardMat, shardCount);
  const seeds = Array.from({ length: shardCount }, () => ({ r: 3 + Math.random() * 2.6, a: Math.random() * Math.PI * 2, y: (Math.random() - 0.5) * 4, s: 0.5 + Math.random() * 1.3, sp: (Math.random() * 0.5 + 0.15) * (Math.random() < 0.5 ? -1 : 1) }));
  scene.add(shards);
  const dummy = new THREE.Object3D();

  /* dust */
  const dustN = high ? 160 : 70;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) { dustPos[i * 3] = (Math.random() - 0.5) * 14; dustPos[i * 3 + 1] = (Math.random() - 0.5) * 9; dustPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1; }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: accent.clone(), size: 0.05, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* shockwave ring (click reaction) */
  const ringMat = new THREE.MeshBasicMaterial({ color: accent.clone(), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.07, 96), ringMat);
  ring.position.z = -0.4;
  scene.add(ring);

  /* ── state & interaction ── */
  const st = { px: 0, py: 0, rx: 0, ry: 0, userY: 0, vel: 0, dragging: false, lastX: 0, downX: 0, downY: 0, downT: 0, moved: 0, pulse: 0, ring: 0, t: 0 };
  const interactive = opts.interactive !== false;

  const onWinMove = (e: PointerEvent) => {
    const r = container.getBoundingClientRect();
    st.px = Math.max(-1.4, Math.min(1.4, ((e.clientX - r.left) / r.width - 0.5) * 2));
    st.py = Math.max(-1.4, Math.min(1.4, ((e.clientY - r.top) / r.height - 0.5) * 2));
    if (st.dragging) {
      const dx = e.clientX - st.lastX;
      st.lastX = e.clientX;
      st.userY += dx * 0.012;
      st.vel = dx * 0.012 * 60;
      st.moved += Math.abs(dx);
    }
  };
  const pulse = () => { st.pulse = 1; st.ring = 1; st.vel += 9 * (Math.random() < 0.5 ? 1 : -1); };
  const onDown = (e: PointerEvent) => {
    st.dragging = true; st.lastX = e.clientX; st.downX = e.clientX; st.downY = e.clientY; st.downT = performance.now(); st.moved = 0; st.vel = 0;
    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = "grabbing";
  };
  const onUp = () => {
    if (!st.dragging) return;
    st.dragging = false;
    canvas.style.cursor = "";
    if (st.moved < 6 && performance.now() - st.downT < 350) pulse(); // a tap/click, not a drag
  };
  if (interactive) {
    window.addEventListener("pointermove", onWinMove, { passive: true });
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    canvas.style.cursor = "grab";
  }

  /* ── sizing ── */
  const resize = () => {
    const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = camera.aspect < 1 ? 11 / Math.max(0.62, camera.aspect) * 0.92 : 11;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  /* ── loop ── */
  let raf = 0, running = false, visible = true, last = performance.now(), slow = 0, frames = 0, disposed = false;
  const angDiff = (a: number) => { const t = Math.PI * 2; return ((a % t) + t * 1.5) % t - t / 2; };

  const frame = (now: number) => {
    raf = 0;
    if (!running || disposed) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    st.t += dt;

    // adaptive quality: if the GPU struggles, drop transmission + DPR once
    if (high && ++frames > 60 && frames < 150) { slow += dt; if (frames === 149 && slow / 89 > 0.034) { high = false; body.material = metal; renderer.setPixelRatio(1); resize(); } }

    // pointer parallax + idle sway (reduced motion: static pose)
    const idleY = reduce ? 0 : Math.sin(st.t * 0.45) * 0.38;
    const idleX = reduce ? 0 : Math.sin(st.t * 0.33) * 0.07;
    const k = 1 - Math.exp(-6 * dt);
    st.rx += ((-st.py * 0.28 + idleX) - st.rx) * k;
    st.ry += ((st.px * 0.5 + idleY) - st.ry) * k;

    if (!st.dragging) {
      st.userY += st.vel * dt;
      st.vel *= Math.exp(-2.6 * dt);
      if (Math.abs(st.vel) < 0.6) st.userY -= angDiff(st.userY) * (1 - Math.exp(-2.2 * dt)); // glide back to facing front
    }

    st.pulse = Math.max(0, st.pulse - dt * 1.7);
    st.ring = Math.max(0, st.ring - dt * 1.25);
    const sc = 1 + Math.sin((1 - st.pulse) * Math.PI) * 0.0 + st.pulse * 0.2 * Math.sin(st.pulse * Math.PI);
    const floatY = reduce ? 0 : Math.sin(st.t * 0.9) * 0.12;
    root.rotation.set(st.rx, st.ry + st.userY, 0);
    root.position.y = floatY;
    root.scale.setScalar(sc);
    coreMat.opacity = Math.min(1, coreBase + st.pulse * 0.5);
    edgeMat.opacity = 0.8 + st.pulse * 0.2;
    rim.intensity = 70 + st.pulse * 160;

    ring.scale.setScalar(1 + (1 - st.ring) * 5.5);
    ringMat.opacity = st.ring * 0.9;

    for (let i = 0; i < shardCount; i++) {
      const s = seeds[i];
      const a = s.a + (reduce ? 0 : st.t * s.sp);
      dummy.position.set(Math.cos(a) * s.r, s.y + Math.sin(st.t * s.s) * (reduce ? 0 : 0.25), Math.sin(a) * s.r * 0.55 - 0.5);
      dummy.rotation.set(st.t * s.s, st.t * s.sp * 2, 0);
      dummy.scale.setScalar(0.6 + s.s * 0.5);
      dummy.updateMatrix();
      shards.setMatrixAt(i, dummy.matrix);
    }
    shards.instanceMatrix.needsUpdate = true;
    dust.rotation.y = reduce ? 0 : st.t * 0.02;

    renderer.render(scene, camera);
    if (!reduce) raf = requestAnimationFrame(frame);
  };

  const start = () => { if (running || disposed) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };
  const sync = () => (visible && !document.hidden ? start() : stop());
  const io = new IntersectionObserver((e) => { visible = e[0]?.isIntersecting ?? true; sync(); }, { threshold: 0.01 });
  io.observe(container);
  const onVis = () => sync();
  document.addEventListener("visibilitychange", onVis);
  const onLost = (e: Event) => { e.preventDefault(); stop(); };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", sync);
  start();
  // reduced motion renders on demand: re-render for pointer parallax / pulse
  if (reduce) { const poke = () => { if (!raf && running) raf = requestAnimationFrame(frame); }; window.addEventListener("pointermove", poke, { passive: true }); window.addEventListener("pointerup", poke); }

  const dispose = () => {
    if (disposed) return;
    disposed = true; stop();
    io.disconnect(); ro.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("pointermove", onWinMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    canvas.removeEventListener("pointerdown", onDown);
    [geo, shardGeo, dustGeo, ring.geometry, edges.geometry].forEach((g) => g.dispose());
    [glass, obsidian, metal, coreMat, edgeMat, shardMat, dustMat, ringMat].forEach((m) => m.dispose());
    shards.dispose(); envTex.dispose(); pmrem.dispose(); renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };

  return {
    dispose,
    pulse,
    setAccent(hex: string) {
      accent.set(hex);
      [coreMat.color, edgeMat.color, dustMat.color, ringMat.color, rim.color, glass.attenuationColor, obsidian.attenuationColor, shardMat.emissive].forEach((c) => c.copy(accent));
      if (reduce && !raf) raf = requestAnimationFrame(frame);
    },
  };
}
