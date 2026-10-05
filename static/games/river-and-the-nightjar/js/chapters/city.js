// Kindlewick: the lantern city inside a sleeping volcano. Used by chapters seven, eight and nine.
import * as kit from '../kit.js';
const { THREE, M, G, mesh, C, sprite, glowMat, T, rng, TAU, damp } = kit;

// A lamp post the Kindlewick way: a tall hook with a lantern hanging from it.
export function hookLamp(color = C.amber, h = 3.6) {
  const g = new THREE.Group(), br = M(C.brass, { metal: .75, rough: .3 });
  mesh(G.cyl(.06, .1, h, 8), br, 0, h / 2, 0, g); mesh(G.cyl(.16, .2, .2, 10), M(C.iron), 0, .1, 0, g);
  const hook = mesh(new THREE.TorusGeometry(.45, .04, 6, 14, Math.PI), br, .45, h, 0, g);
  mesh(G.cyl(.012, .012, .3, 5), br, .9, h - .15, 0, g);
  mesh(G.sph(.2, 12, 8), new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: color, emissiveIntensity: 2.4 }), .9, h - .45, 0, g);
  mesh(G.cyl(.08, .16, .1, 10), br, .9, h - .26, 0, g); sprite(color, 2.4, .9, h - .45, 0, g, .5);
  const cap = mesh(G.sph(.12, 8, 6), M(0xe6f1fb), 0, h + .02, 0, g); cap.scale.y = .5;
  return g;
}
// A brass tree with lantern fruit.
export function lanternTree(seed = 1, s = 1) {
  const g = new THREE.Group(), r = rng(seed), br = M(C.copper, { metal: .7, rough: .35 });
  mesh(G.cyl(.12, .2, 2.2, 8), br, 0, 1.1, 0, g);
  const cols = [C.amber, C.aurora, 0x8fd0ff, C.amber];
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * TAU + r(), y = 1.5 + r() * 1.6, len = .7 + r() * .7; const b = mesh(G.cyl(.03, .05, len, 6), br, Math.cos(a) * len * .4, y, Math.sin(a) * len * .4, g); b.rotation.set(Math.sin(a) * 1.0, 0, -Math.cos(a) * 1.0);
    const c = cols[i % 4], x = Math.cos(a) * len * .85, z = Math.sin(a) * len * .85; mesh(G.sph(.13, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: c, emissiveIntensity: 2.2 }), x, y + .12, z, g); sprite(c, 1.1, x, y + .12, z, g, .45);
  }
  const cap = mesh(G.sph(.5, 10, 8), M(0xe6f1fb, { rough: 1 }), 0, .05, 0, g); cap.scale.y = .25; g.scale.setScalar(s); return g;
}
export function stall(color = 0x2a8f8a, seed = 1) {
  const g = new THREE.Group(), r = rng(seed);
  mesh(G.box(2.6, .9, 1.2), M(C.wood, { rough: .8 }), 0, .45, 0, g); for (const s of [-1, 1]) mesh(G.cyl(.05, .05, 2.6, 6), M(C.woodDark), s * 1.25, 1.3, .55, g);
  for (let i = 0; i < 6; i++) mesh(G.box(.44, .08, 1.7), M(i % 2 ? 0xf6ecd8 : color, { rough: .9 }), -1.1 + i * .44, 2.6 - Math.abs(i - 2.5) * .02, .1, g).rotation.x = .25;
  for (let i = 0; i < 5; i++) { const p = kit.gift(.3 + r() * .2, .25 + r() * .2, .3, [0x2a8f8a, 0x3566c0, 0xd98a2c, 0x7a5ab8][i % 4]); p.position.set(-1 + i * .5, .9, r() * .3 - .1); p.rotation.y = r(); g.add(p); }
  mesh(G.sph(.12, 10, 8), glowMat(C.amber, 2.2), 0, 2.2, .7, g); sprite(C.amber, 1.6, 0, 2.2, .7, g, .5);
  return g;
}

// The whole city, seen from the plaza or from the air.
export function makeCity({ seed = 7, longLantern = true } = {}) {
  const g = new THREE.Group(), r = rng(seed), tick = [];
  // caldera wall and its snowy rim
  const rt = T.rock().clone(); rt.needsUpdate = true; rt.repeat.set(24, 3);
  const wall = mesh(new THREE.CylinderGeometry(300, 250, 150, 48, 1, true), new THREE.MeshStandardMaterial({ map: rt, side: THREE.BackSide, roughness: 1, color: 0x8ea0d0 }), 0, 60, 0, g);
  const rim = mesh(new THREE.TorusGeometry(302, 14, 8, 48), M(0xdfeaf8, { rough: 1, flat: true }), 0, 136, 0, g); rim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + r() * .2, h = 40 + r() * 70; const p = mesh(G.cone(40 + r() * 30, h, 5), M(0xdfeaf8, { rough: 1, flat: true }), Math.cos(a) * 320, 130 + h / 2, Math.sin(a) * 320, g); p.rotation.y = r() * 3; }
  // lit caves in the cliff
  const cave = new THREE.InstancedMesh(G.plane(1, 1), new THREE.MeshBasicMaterial({ color: 0xffc27a, fog: false }), 160), o = new THREE.Object3D();
  for (let i = 0; i < 160; i++) { const a = r() * TAU, y = 6 + r() * 70, rad = 258 + (y / 150) * 44; o.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad); o.lookAt(0, y, 0); o.scale.set(1.6 + r() * 2, 2.2 + r() * 2, 1); o.updateMatrix(); cave.setMatrixAt(i, o.matrix); }
  g.add(cave);
  // ground: warm stone in the middle, snow further out
  const ct = T.cobble().clone(); ct.needsUpdate = true; ct.repeat.set(20, 20);
  const plaza = mesh(new THREE.CircleGeometry(64, 48), new THREE.MeshStandardMaterial({ map: ct, roughness: .85, color: 0xd8e2f4 }), 0, 0, 0, g); plaza.rotation.x = -Math.PI / 2;
  const st2 = T.snow().clone(); st2.needsUpdate = true; st2.repeat.set(30, 30);
  const snow = mesh(new THREE.RingGeometry(63, 300, 48), new THREE.MeshStandardMaterial({ map: st2, roughness: 1 }), 0, -.02, 0, g); snow.rotation.x = -Math.PI / 2;
  // towers in rings, in three height classes so the windows keep their shape
  const roofCols = [0x1f6f6a, 0xb8683a, 0x2a4f9a, 0x6a4fb0], glowPts = [];
  const towers = [];
  for (let k = 0; k < 3; k++) {
    const n = [34, 30, 20][k], wt = T.windows(.55 + k * .08, k + 3, 5, [5, 9, 14][k]).clone(); wt.needsUpdate = true; wt.repeat.set(2, 1);
    const im = new THREE.InstancedMesh(G.cyl(.82, 1, 1, 8), new THREE.MeshStandardMaterial({ color: [0x3a4a78, 0x34446e, 0x2c3a62][k], emissive: 0xffffff, emissiveMap: wt, emissiveIntensity: 1.25, roughness: .85 }), n);
    const roofs = new THREE.InstancedMesh(G.cone(1, 1, 8), new THREE.MeshStandardMaterial({ roughness: .7 }), n), caps = new THREE.InstancedMesh(G.cone(1, 1, 8), M(0xe6f1fb, { rough: 1 }), n);
    for (let i = 0; i < n; i++) {
      let a, rad, x, z, tries = 0; do { a = r() * TAU; rad = [70, 95, 130][k] + r() * [70, 80, 90][k]; x = Math.cos(a) * rad; z = Math.sin(a) * rad; tries++; } while (tries < 20 && towers.some(t => Math.hypot(t.x - x, t.z - z) < t.w + 9));
      const h = [14, 28, 50][k] + r() * [12, 20, 34][k], w = 4 + r() * 3 + k * 1.2; towers.push({ x, z, h, w, k });
      o.rotation.set(0, r() * 3, 0); o.position.set(x, h / 2, z); o.scale.set(w, h, w); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      const rh = w * (1.4 + r()); o.position.set(x, h + rh / 2, z); o.scale.set(w * 1.02, rh, w * 1.02); o.updateMatrix(); roofs.setMatrixAt(i, o.matrix); roofs.setColorAt(i, new THREE.Color(roofCols[(i + k) % 4]));
      o.position.set(x, h + rh * .78, z); o.scale.set(w * .5, rh * .5, w * .5); o.updateMatrix(); caps.setMatrixAt(i, o.matrix);
      glowPts.push(x, h + rh + 1.2, z);
    }
    g.add(im, roofs, caps);
  }
  // a lantern on every spire, and strings of lanterns swung between the towers
  const strings = [];
  for (let i = 0; i < 46; i++) { const a = towers[r() * towers.length | 0], b = towers[r() * towers.length | 0], d = Math.hypot(a.x - b.x, a.z - b.z); if (a === b || d > 95 || d < 16) continue; const ya = a.h * (.6 + r() * .4), yb = b.h * (.6 + r() * .4), n = Math.max(6, d / 4 | 0); for (let j = 1; j < n; j++) { const t = j / n; strings.push(a.x + (b.x - a.x) * t, ya + (yb - ya) * t - Math.sin(t * Math.PI) * d * .16, a.z + (b.z - a.z) * t); } }
  const mkPts = (arr, color, size) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); const p = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: T.glow(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); p.frustumCulled = false; g.add(p); return p; };
  mkPts(glowPts, 0xffc27a, 9); const sp = mkPts(strings, 0xffd9a0, 3.2);
  tick.push((dt, t) => { sp.material.opacity = .8 + Math.sin(t * 2.3) * .15; });
  // two elevated railways circling the city, with little lit trams
  const trams = [];
  for (const [rad, y, n] of [[84, 15, 3], [150, 30, 4]]) {
    const ring = mesh(new THREE.TorusGeometry(rad, .5, 6, 96), M(0x4a5a86, { metal: .4, rough: .5 }), 0, y, 0, g); ring.rotation.x = Math.PI / 2;
    const glow = mesh(new THREE.TorusGeometry(rad, .14, 5, 96), new THREE.MeshBasicMaterial({ color: 0x9fe6ff, fog: false }), 0, y + .55, 0, g); glow.rotation.x = Math.PI / 2;
    const cnt = Math.round(rad * TAU / 16), pil = new THREE.InstancedMesh(G.box(1.2, 1, 1.2), M(0x3a4a78, { rough: .9 }), cnt);
    for (let i = 0; i < cnt; i++) { const a = i / cnt * TAU; o.rotation.set(0, -a, 0); o.position.set(Math.cos(a) * rad, y / 2, Math.sin(a) * rad); o.scale.set(1, y, 1); o.updateMatrix(); pil.setMatrixAt(i, o.matrix); }
    g.add(pil);
    for (let i = 0; i < n; i++) { const t = new THREE.Group(); mesh(G.rbox(6, 2, 2, .5), M(C.tealDark, { rough: .5 }), 0, 1.6, 0, t); mesh(G.box(5, .8, 2.06), new THREE.MeshBasicMaterial({ color: 0xffc27a, fog: false }), 0, 1.9, 0, t); sprite(C.amber, 7, 0, 2, 0, t, .4); g.add(t); trams.push({ t, rad, y, a: i / n * TAU, s: (rad > 100 ? -.035 : .05) }); }
  }
  tick.push(dt => { for (const m of trams) { m.a += m.s * dt; m.t.position.set(Math.cos(m.a) * m.rad, m.y + .5, Math.sin(m.a) * m.rad); m.t.rotation.y = -m.a + Math.PI / 2; } });
  // gift warehouses: long barrel roofs with rows of windows
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + .4, rad = 78 + (i % 2) * 22, w = new THREE.Group(); const wt = T.carSide().clone(); wt.needsUpdate = true; wt.repeat.set(3, 1); mesh(G.box(30, 7, 12), M(0x34446e, { rough: .9 }), 0, 3.5, 0, w); const rf = mesh(G.cyl(6, 6, 30, 16, 1, false, 0, Math.PI), M(0xdbe8f6, { rough: 1 }), 0, 7, 0, w); rf.rotation.z = Math.PI / 2; rf.scale.set(.6, 1, 1); for (const s of [-1, 1]) { const p = mesh(G.plane(28, 3), new THREE.MeshStandardMaterial({ color: 0x0a0d14, emissive: 0xffffff, emissiveMap: wt, emissiveIntensity: 1.2 }), 0, 3.6, s * 6.02, w); if (s < 0) p.rotation.y = Math.PI; } w.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad); w.rotation.y = -a + Math.PI / 2; g.add(w); }
  // the Long Lantern in the middle of everything
  let lantern = null;
  if (longLantern) {
    const L = lantern = new THREE.Group(); g.add(L);
    for (let i = 0; i < 4; i++) mesh(G.cyl(7 - i * 1.3, 7.4 - i * 1.3, .5, 10), M(0x8b9bc4, { rough: .9 }), 0, .25 + i * .5, 0, L);
    mesh(G.cyl(.9, 1.4, 16, 10), M(C.brass, { metal: .75, rough: .3 }), 0, 10, 0, L); for (let i = 0; i < 4; i++) mesh(G.torus(1.25 - i * .08, .12, 20), M(C.copper, { metal: .7, rough: .3 }), 0, 4 + i * 4, 0, L).rotation.x = Math.PI / 2;
    const glass = new THREE.MeshStandardMaterial({ color: 0x9fc4ff, emissive: C.amber, emissiveIntensity: 0, transparent: true, opacity: .55, roughness: .1, side: THREE.DoubleSide });
    const head = mesh(G.cyl(3.4, 2.4, 6.5, 8), glass, 0, 21.5, 0, L);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8; const b = mesh(G.cyl(.1, .1, 6.7, 6), M(C.brass, { metal: .75, rough: .3 }), Math.cos(a) * 2.95, 21.5, Math.sin(a) * 2.95, L); b.rotation.set(Math.sin(a) * .15, 0, -Math.cos(a) * .15); }
    mesh(G.cone(4.4, 3.4, 8), M(0x1f6f6a, { rough: .6 }), 0, 26.4, 0, L); mesh(G.cone(2.6, 2.0, 8), M(0xe6f1fb, { rough: 1 }), 0, 27.3, 0, L); mesh(G.cyl(3.7, 3.7, .4, 8), M(C.brass, { metal: .75, rough: .3 }), 0, 18.1, 0, L);
    const flame = mesh(G.sph(1.5, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1c9, transparent: true, opacity: 0, fog: false }), 0, 21.4, 0, L);
    const halo = sprite(C.amber, 10, 0, 21.4, 0, L, 0), light = new THREE.PointLight(C.amber, 0, 120, 1.3); light.position.set(0, 21, 0); L.add(light);
    L.scale.setScalar(1.3);
    L.userData.set = k => { glass.emissiveIntensity = 2.2 * k; flame.material.opacity = k; flame.scale.setScalar(.4 + k * .8); halo.material.opacity = .8 * k; halo.scale.setScalar(10 + k * 34); light.intensity = 700 * k; };
  }
  g.userData.update = (dt, t) => tick.forEach(f => f(dt, t)); g.userData.lantern = lantern; g.userData.towers = towers;
  return g;
}

// A crowd of Kindlefolk, drawn cheaply: body, head, cap, and a lantern held up on a pole.
export function makeCrowd(spots) {
  const g = new THREE.Group(), n = spots.length, o = new THREE.Object3D(), r = rng(31), col = new THREE.Color();
  const body = new THREE.InstancedMesh(G.sph(.36, 10, 8), new THREE.MeshStandardMaterial({ roughness: .9 }), n), head = new THREE.InstancedMesh(G.sph(.2, 10, 8), new THREE.MeshStandardMaterial({ roughness: .7 }), n), cap = new THREE.InstancedMesh(G.cone(.22, .32, 8), new THREE.MeshStandardMaterial({ roughness: .9 }), n), pole = new THREE.InstancedMesh(G.cyl(.015, .015, 1.4, 4), M(C.woodDark), n);
  const coats = [0x2a8f8a, 0xd98a2c, 0x3566c0, 0x7a5ab8, 0x4f9f5f, 0xc9783f, 0x1f6f9a], skins = [0xf0c3a0, 0xb9794f, 0x8a5a3c, 0xf5cfa6, 0xd9a47c], pts = new Float32Array(n * 3), base = new Float32Array(n);
  spots.forEach(([x, z], i) => {
    const s = .85 + r() * .4;
    o.position.set(x, .5 * s, z); o.scale.set(s, s * 1.25, s * .9); o.rotation.set(0, 0, 0); o.updateMatrix(); body.setMatrixAt(i, o.matrix); body.setColorAt(i, col.setHex(coats[i % coats.length]));
    o.position.set(x, 1.08 * s, z); o.scale.setScalar(s); o.updateMatrix(); head.setMatrixAt(i, o.matrix); head.setColorAt(i, col.setHex(skins[i % skins.length]));
    o.position.set(x, 1.34 * s, z); o.updateMatrix(); cap.setMatrixAt(i, o.matrix); cap.setColorAt(i, col.setHex(coats[(i + 3) % coats.length]));
    o.position.set(x + .3 * s, 1.2 * s, z); o.updateMatrix(); pole.setMatrixAt(i, o.matrix);
    pts[i * 3] = x + .3 * s; pts[i * 3 + 1] = base[i] = 1.95 * s; pts[i * 3 + 2] = z;
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const lights = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffc27a, size: .9, map: T.glow(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); lights.frustumCulled = false;
  g.add(body, head, cap, pole, lights);
  g.userData.raise = 0;
  g.userData.update = (dt, t) => { const k = g.userData.raise; for (let i = 0; i < n; i++) pts[i * 3 + 1] = base[i] + Math.sin(t * 1.6 + i * .7) * .04 + k * (.5 + Math.sin(t * 2 + i) * .08); geo.attributes.position.needsUpdate = true; lights.material.size = .9 + k * .5; };
  return g;
}
