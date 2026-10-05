// Pieces more than one chapter needs: the inside of the moving train, houses, and a few script shortcuts.
import * as kit from '../kit.js';
const { THREE, M, G, mesh, C, CAST, sprite, glowMat, T } = kit;

// The inside of the Nightjar, rolling along. Returns the list of carriages with their booths.
export function trainStage(g, { cars = [{}], speed = 17, land = 'forest', gap = 2.4, snow = true, sky = {}, trees = 150, hemi = .42 } = {}) {
  const st = g.stage;
  st.mood({ fog: 0x16295a, density: .0075, hemi: [0x86a4e6, 0x1a1c2c, hemi], sun: [0x9fc0ff, .85, [-8, 14, -10]] });
  st.sky = st.add(kit.makeSky(sky));
  st.scenery = new kit.Scenery({ speed, kind: land, trees }); st.add(st.scenery.g); st.tick(dt => st.scenery.update(dt));
  st.rails = st.add(kit.makeLightRails(500, -1.38, 0, 1.62));
  if (snow) { st.snow = new kit.Snow({ count: 650, box: [70, 15, 18], wind: [-speed * .75, 0], fall: 1.3, size: .13 }); st.snow.offset.set(0, -4.5, -22); st.add(st.snow.points); }
  let x = 0; const out = [];
  cars.forEach((o, i) => {
    const len = o.len || 16, c = kit.makeCarInterior(Object.assign({ seed: i + 3 }, o));
    c.g.position.x = x + len / 2; st.add(c.g); c.x0 = x; c.x1 = x + len; c.cx = x + len / 2;
    c.booths.forEach(b => { b.x += c.cx; b.seats.forEach(s => s.x += c.cx); b.table.x += c.cx; });
    out.push(c);
    if (i < cars.length - 1) { // the little bridge between carriages
      mesh(G.box(gap, .2, 1.7), M(0x2a3340, { metal: .4, rough: .6 }), x + len + gap / 2, -.1, .9, st.scene);
      mesh(G.box(gap, 3.2, .1), M(0x10161f, { rough: 1 }), x + len + gap / 2, 1.5, -.1, st.scene);
      mesh(G.box(gap, .12, 2.2), M(0x10161f, { rough: 1 }), x + len + gap / 2, 3.1, .9, st.scene);
      mesh(G.box(gap * .9, .5, 3.4), M(0x10161f), x + len + gap / 2, -.6, 0, st.scene);
    }
    x += len + gap;
  });
  const first = out[0], last = out[out.length - 1];
  st.area(first.x0 + .35, last.x1 - .35, .15, 1.75);
  st.cam.minX = first.x0 + 4.2; st.cam.maxX = last.x1 - 4.2;
  st.sway = .0035;
  // Only the four lanterns nearest the camera cast real light. The rest just glow.
  const lamps = out.flatMap(c => c.lamps.map(L => ({ x: c.cx + L.position.x, y: L.position.y - .2, z: L.position.z, L })));
  const pool = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight(C.amber, 0, 10, 1.8); st.add(l); return l; });
  st.lampDim = 1;
  st.tick(() => {
    const cx = g.game.camPos.x; lamps.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
    pool.forEach((l, i) => { const m = lamps[i]; if (!m) { l.intensity = 0; return; } l.position.set(m.x, m.y, m.z); l.color.setHex(m.L.userData.color); l.intensity = m.L.userData.power * st.lampDim * (m.L.userData.flicker ?? 1) * kit.clamp(1.6 - Math.abs(m.x - cx) / 9, 0, 1); });
  });
  st.tick(dt => { for (const c of out) for (const w of c.wheels) w.rotation.z -= dt * st.scenery.speed / .42; });
  g.audio.loop('train', true, .8);
  return out;
}

// Many lamps, few real lights: the nearest few to the camera do the lighting.
export function lightPool(g, sources, n = 4, dist = 10) {
  const st = g.stage, pool = Array.from({ length: n }, () => { const l = new THREE.PointLight(0xffffff, 0, dist, 1.8); st.add(l); return l; });
  st.tick(() => {
    const c = g.game.camLook; sources.sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z));
    pool.forEach((l, i) => { const s = sources[i]; if (!s) { l.intensity = 0; return; } l.position.set(s.x, s.y, s.z); l.color.setHex(s.color); l.intensity = s.power * (st.lampDim ?? 1); });
  });
  return pool;
}

// Sit an actor on a booth seat.
export function sit(a, seat) { a.pose = 'sit'; a.place(seat.x, .59 - .12 * a.scale, seat.z, seat.yaw); return a; }
export function stand(a) { a.pose = 'stand'; a.pos.y = 0; return a; }

// A "Talk to ..." spot beside an actor.
export function talk(g, a, fn, o = {}) {
  return g.stage.item(Object.assign({ x: a.pos.x, z: o.z ?? Math.max(.4, a.pos.z + .9), y: a.pos.y + a.height + .45, pz: a.pos.z, label: 'Talk to ' + a.name, use: fn }, o));
}
// A "Look at ..." spot.
export function look(g, x, y, z, label, fn, o = {}) { return g.stage.item(Object.assign({ x, y, z: o.wz ?? .6, pz: z, label, use: fn }, o)); }

// A snowy house for the street scenes.
export function house({ w = 9, h = 5.2, d = 7, color = 0x4a5f86, roof = 0x2a3350, lit = [1, 0, 1, 1], door = true, seed = 1 } = {}) {
  const g = new THREE.Group(), r = kit.rng(seed);
  mesh(G.box(w, h, d), M(color, { rough: .95 }), 0, h / 2, 0, g);
  const rf = mesh(G.cyl(.01, d * .78, 2.6, 4), M(roof, { rough: 1 }), 0, h + 1.3, 0, g); rf.rotation.y = Math.PI / 4; rf.scale.set(w / (d * 1.1), 1, 1);
  const sn = mesh(G.cyl(.01, d * .8, 2.2, 4), M(0xe6f1fb, { rough: 1 }), 0, h + 1.62, 0, g); sn.rotation.y = Math.PI / 4; sn.scale.set(w / (d * 1.1), 1, 1.02);
  mesh(G.box(.9, 1.8, .9), M(0x6a4a3c), w * .28, h + 1.7, 0, g); mesh(G.box(1.0, .2, 1.0), M(0xe6f1fb), w * .28, h + 2.65, 0, g);
  let i = 0;
  for (const y of [1.5, 3.7]) for (const x of [-w * .28, w * .28]) {
    const on = lit[i++ % lit.length]; if (y < 2 && door && x > 0) continue;
    mesh(G.box(1.5, 1.5, .1), M(0xf6ecd8), x, y, d / 2 + .02, g);
    mesh(G.plane(1.3, 1.3), on ? new THREE.MeshStandardMaterial({ color: 0x331a06, emissive: r() > .3 ? C.amber : 0x9fe6c8, emissiveIntensity: 1.3 }) : M(0x16223f, { rough: .2 }), x, y, d / 2 + .08, g);
    mesh(G.box(.06, 1.3, .04), M(0xf6ecd8), x, y, d / 2 + .1, g); mesh(G.box(1.3, .06, .04), M(0xf6ecd8), x, y, d / 2 + .1, g);
    mesh(G.box(1.7, .12, .3), M(0xe6f1fb), x, y - .8, d / 2 + .12, g);
  }
  if (door) { mesh(G.box(1.2, 2.2, .1), M(0x8a3a2a, { rough: .6 }), w * .28, 1.1, d / 2 + .04, g); mesh(G.sph(.06, 8, 6), M(C.brass, { metal: .7 }), w * .28 + .4, 1.1, d / 2 + .12, g); mesh(G.box(2.2, .25, 1.4), M(0xdfeaf8), w * .28, .12, d / 2 + .7, g); const l = mesh(G.sph(.14, 10, 8), glowMat(C.amber, 2.4), w * .28 - .9, 2.3, d / 2 + .2, g); sprite(C.amber, 1.6, w * .28 - .9, 2.3, d / 2 + .3, g, .5); }
  return g;
}
export function streetLamp() {
  const g = new THREE.Group(); mesh(G.cyl(.07, .1, 4.6, 8), M(C.iron), 0, 2.3, 0, g); mesh(G.box(.9, .08, .08), M(C.iron), .4, 4.5, 0, g);
  mesh(G.sph(.22, 12, 8), glowMat(0xffe2b0, 2.2), .8, 4.35, 0, g); sprite(0xffd9a0, 3.4, .8, 4.35, 0, g, .5);
  const cap = mesh(G.sph(.26, 10, 6), M(0xe6f1fb), .8, 4.55, 0, g); cap.scale.y = .4;
  return g;
}
export function snowyTree(s = 1) {
  const g = new THREE.Group(); mesh(G.cyl(.16, .2, 1.2, 6), M(0x3a2a22), 0, .6, 0, g);
  for (const [r, h, y] of [[1.5, 2.2, 2], [1.15, 1.9, 3.1], [.8, 1.6, 4.1]]) { mesh(G.cone(r, h, 7), M(0x1d4a45, { rough: 1, flat: true }), 0, y, 0, g); mesh(G.cone(r * .62, h * .62, 7), M(0xe6f1fb, { rough: 1, flat: true }), 0, y + h * .2, 0, g); }
  g.scale.setScalar(s); return g;
}
export function snowman() {
  const g = new THREE.Group(), w = M(0xf2f7fd, { rough: 1 });
  mesh(G.sph(.5, 14, 10), w, 0, .42, 0, g); mesh(G.sph(.36, 14, 10), w, 0, 1.08, 0, g); mesh(G.sph(.26, 14, 10), w, 0, 1.58, 0, g);
  mesh(G.cone(.05, .28, 6), M(0xff8a3c), 0, 1.58, .3, g).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) { mesh(G.sph(.035, 6, 5), M(0x111111), s * .09, 1.66, .23, g); const a = mesh(G.cyl(.02, .02, .7, 5), M(0x3a2a22), s * .55, 1.15, 0, g); a.rotation.z = s * -1.1; }
  mesh(G.torus(.25, .05, 12), M(0x2a8f8a), 0, 1.36, 0, g).rotation.x = Math.PI / 2;
  mesh(G.cyl(.2, .2, .26, 10), M(0x1f3d6b), 0, 1.9, 0, g); mesh(G.cyl(.3, .3, .03, 12), M(0x1f3d6b), 0, 1.78, 0, g);
  return g;
}

// A plain room box seen as a cutaway (far wall, floor, ceiling, optional end walls).
export function roomShell({ x0, x1, wall = 0x2c4f7c, floor = '#8a6a4a', depth = 2.1, h = 3.05, win = null, ends = [true, true], trim = 0xf6ecd8 } = {}) {
  const g = new THREE.Group(), len = x1 - x0, cx = (x0 + x1) / 2, wm = M(wall, { rough: .95 });
  const ft = T.wood(floor, '#4d3a28').clone(); ft.needsUpdate = true; ft.repeat.set(len / 3, 1.4);
  mesh(G.box(len, .3, depth * 2), new THREE.MeshStandardMaterial({ map: ft, roughness: .7 }), cx, -.15, 0, g);
  mesh(G.box(len, .14, depth * 2), M(0xe9e2d2, { rough: 1 }), cx, h + .07, 0, g);
  if (win) { // far wall in four pieces around the window
    const [wx0, wx1, wy0, wy1] = win;
    mesh(G.box(wx0 - x0, h, .14), wm, (x0 + wx0) / 2, h / 2, -depth, g); mesh(G.box(x1 - wx1, h, .14), wm, (x1 + wx1) / 2, h / 2, -depth, g);
    mesh(G.box(wx1 - wx0, wy0, .14), wm, (wx0 + wx1) / 2, wy0 / 2, -depth, g); mesh(G.box(wx1 - wx0, h - wy1, .14), wm, (wx0 + wx1) / 2, (h + wy1) / 2, -depth, g);
    const tm = M(trim, { rough: .8 }), ww = wx1 - wx0, wh = wy1 - wy0, wcx = (wx0 + wx1) / 2, wcy = (wy0 + wy1) / 2;
    for (const [w, hh, x, y] of [[ww + .24, .12, wcx, wy0 - .04], [ww + .24, .12, wcx, wy1 + .04], [.12, wh, wx0 - .04, wcy], [.12, wh, wx1 + .04, wcy], [.07, wh, wcx, wcy], [ww, .07, wcx, wcy]]) mesh(G.box(w, hh, .2), tm, x, y, -depth + .02, g);
    mesh(G.box(ww + .5, .08, .4), tm, wcx, wy0 - .1, -depth + .18, g);
    const gt = T.frostGlass().clone(); gt.needsUpdate = true; gt.repeat.set(2, 2);
    mesh(G.plane(ww, wh), new THREE.MeshStandardMaterial({ color: 0x9fc4ff, map: gt, transparent: true, opacity: .5, roughness: .1, depthWrite: false }), wcx, wcy, -depth + .01, g);
  } else mesh(G.box(len, h, .14), wm, cx, h / 2, -depth, g);
  mesh(G.box(len, .16, .06), M(trim, { rough: .8 }), cx, .08, -depth + .1, g);
  ends.forEach((e, i) => { if (!e) return; const x = i ? x1 : x0; if (e === 'door') { mesh(G.box(.14, h, depth + .15), wm, x, h / 2, (-depth + .15) / 2, g); mesh(G.box(.14, h, depth - 1.65), wm, x, h / 2, (1.65 + depth) / 2, g); mesh(G.box(.14, h - 2.3, 1.5), wm, x, 2.3 + (h - 2.3) / 2, .9, g); mesh(G.box(.2, .1, 1.62), M(trim), x, 2.3, .9, g); } else mesh(G.box(.14, h, depth * 2), wm, x, h / 2, 0, g); });
  mesh(G.box(len, .12, .12), M(0x3a2a22), cx, -.06, depth, g);
  return g;
}

export { kit, CAST };
