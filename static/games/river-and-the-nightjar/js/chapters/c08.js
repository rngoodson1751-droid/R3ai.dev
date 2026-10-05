// Chapter Eight: The Runaway Gift Convoy. Six children and a walrus in a parcel cart, under the city.
import { kit, CAST } from './common.js';
const { THREE, M, G, mesh, C, sprite, glowMat, damp, lerp, clamp, rng, TAU } = kit;

const LANE = 2.5, lz = l => (l - 1) * LANE;
function symbol(kind, size = 256) {   // hanging fork signs: a star for the plaza, a boat, a snowflake
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  x.fillStyle = kind === 'star' ? '#fff3d0' : '#dfe8f6'; x.beginPath(); x.roundRect(8, 8, size - 16, size - 16, 30); x.fill(); x.lineWidth = 12; x.strokeStyle = kind === 'star' ? '#c9783f' : '#4a5a86'; x.stroke();
  x.translate(size / 2, size / 2); x.fillStyle = x.strokeStyle = kind === 'star' ? '#e09a1c' : kind === 'boat' ? '#2a6f9a' : '#5a7ad0'; x.lineWidth = 14; x.lineCap = 'round';
  if (kind === 'star') { x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 36 : 84; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); }
  else if (kind === 'boat') { x.beginPath(); x.moveTo(-70, 20); x.lineTo(70, 20); x.lineTo(46, 62); x.lineTo(-46, 62); x.closePath(); x.fill(); x.beginPath(); x.moveTo(0, 12); x.lineTo(0, -74); x.lineTo(56, 0); x.closePath(); x.fill(); }
  else { for (let i = 0; i < 3; i++) { x.rotate(Math.PI / 3); x.beginPath(); x.moveTo(-78, 0); x.lineTo(78, 0); x.stroke(); for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 50, 0); x.lineTo(s * 70, 22); x.moveTo(s * 50, 0); x.lineTo(s * 70, -22); x.stroke(); } } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export default async function chapter8(g) {
  const { say, narr, wait, audio } = g;
  const st = g.stage, L = 640, r = rng(81);
  st.mood({ fog: 0x0b1d2a, density: .014, hemi: [0x8fc0d8, 0x182430, .72], bg: 0x060d14, env: .5 });
  // ---------- the tunnels ----------
  const beltT = kit.T.label('››››', { bg: '#232d38', fg: '#3a4a58', w: 256, h: 128, font: 'bold 110px Arial', border: '#1a222b' }); beltT.wrapS = beltT.wrapT = THREE.RepeatWrapping; beltT.repeat.set(L / 5, 1);
  for (let l = 0; l < 3; l++) mesh(G.box(L + 120, .2, LANE - .25), new THREE.MeshStandardMaterial({ map: beltT, roughness: .8 }), L / 2, -.1, lz(l), st.scene);
  st.tick(dt => { beltT.offset.x -= dt * .5; });
  mesh(G.box(L + 120, .3, 24), M(0x0c141b, { rough: 1 }), L / 2, -.3, 0, st.scene);
  for (const s of [-1, 1]) { mesh(G.box(L + 120, 9, .5), M(0x12303a, { rough: .9 }), L / 2, 4.5, s * 9.4, st.scene); mesh(G.cyl(.18, .18, L + 120, 8), M(C.copper, { metal: .7, rough: .35 }), L / 2, 6.6, s * 9, st.scene).rotation.z = Math.PI / 2; mesh(G.box(L + 120, .25, 3.6), M(0x2a3a44, { metal: .3, rough: .7 }), L / 2, 1.3, s * 7.4, st.scene); mesh(G.box(L + 120, .25, 3.6), M(0x2a3a44, { metal: .3, rough: .7 }), L / 2, 3.6, s * 7.4, st.scene); }
  mesh(G.box(L + 120, .4, 19), M(0x0a1218, { rough: 1 }), L / 2, 9, 0, st.scene);
  // arches with lanterns, and shelf after shelf of parcels
  const nA = Math.floor((L + 100) / 14), o = new THREE.Object3D(), posts = new THREE.InstancedMesh(G.box(.7, 9, .7), M(0x1c4a52, { metal: .3, rough: .6 }), nA * 2), lint = new THREE.InstancedMesh(G.box(.7, .7, 13), M(C.copper, { metal: .6, rough: .35 }), nA), lampPts = [];
  for (let i = 0; i < nA; i++) { const x = -30 + i * 14; for (const s of [-1, 1]) { o.position.set(x, 4.5, s * 5.9); o.updateMatrix(); posts.setMatrixAt(i * 2 + (s > 0 ? 1 : 0), o.matrix); lampPts.push(x, 7.4, s * 4.2); } o.position.set(x, 8.4, 0); o.updateMatrix(); lint.setMatrixAt(i, o.matrix); }
  st.add(posts, lint);
  const lp = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(lampPts, 3)), new THREE.PointsMaterial({ color: 0xffc27a, size: 2.4, map: kit.T.glow(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); lp.frustumCulled = false; st.add(lp);
  const nG = 520, gifts = new THREE.InstancedMesh(G.box(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: .6 }), nG), cols = [0x2a8f8a, 0x3566c0, 0xd98a2c, 0x7a5ab8, 0x4f9f5f, 0xc9783f, 0xf6ecd8], col = new THREE.Color();
  for (let i = 0; i < nG; i++) { const s = .5 + r() * .7; o.position.set(-20 + r() * (L + 80), [1.42, 3.72, .0][i % 3] + s / 2 + (i % 3 === 2 ? 0 : 0), (i % 2 ? 1 : -1) * (6.2 + r() * 2.4)); o.scale.set(s * (1 + r()), s, s * (1 + r() * .6)); o.rotation.set(0, r() * 3, 0); o.updateMatrix(); gifts.setMatrixAt(i, o.matrix); gifts.setColorAt(i, col.setHex(cols[i % cols.length])); }
  o.scale.set(1, 1, 1); o.rotation.set(0, 0, 0); st.add(gifts);
  // big gears turning in the walls
  const wheels = []; for (let i = 0; i < 14; i++) { const gg = kit.gear(1.6 + r() * 1.6, 12, .3, [C.brass, C.copper, 0x7f9098][i % 3]); gg.position.set(20 + i * 46 + r() * 10, 5 + r() * 2, (i % 2 ? 1 : -1) * 9.0); st.add(gg); wheels.push(gg); }
  st.tick(dt => wheels.forEach((w, i) => w.rotation.z += dt * (i % 2 ? .8 : -.6)));

  // ---------- what is on the belts ----------
  const obs = [], pick = [], forks = [], gates = [];
  const crate = (x, l) => { const c = (r() < .5 ? kit.crate(2, 1.7, 1.9) : kit.gift(1.9, 1.7, 1.9, cols[(x | 0) % 6])); c.position.set(x, 0, lz(l)); c.rotation.y = (r() - .5) * .3; st.add(c); obs.push({ type: 'crate', x, lane: l, g: c }); };
  const bar = x => { const b = new THREE.Group(); b.position.set(x, 0, 0); st.add(b); for (const s of [-1, 1]) mesh(G.box(.4, 3, .4), M(C.iron, { metal: .5 }), 0, 1.5, s * 4.1, b); const beam = mesh(G.box(.5, .5, 8.2), M(0xf0b030, { emissive: 0xf09010, ei: 1.2, rough: .5 }), 0, 2.05, 0, b); for (let i = 0; i < 8; i++) mesh(G.box(.52, .52, .4), M(0x1a1a1a), 0, 2.05, -3.5 + i * 1, b); obs.push({ type: 'bar', x, g: b }); };
  const bump = x => { const b = mesh(G.cyl(.55, .55, 8, 14), M(0x3aa0d0, { emissive: 0x1a70b0, ei: 1.1, metal: .4, rough: .3 }), x, .05, 0, st.scene); b.rotation.x = Math.PI / 2; obs.push({ type: 'bump', x, g: b }); };
  const ribbon = (x, l) => { const b = new THREE.Group(); b.position.set(x, 1.3, lz(l)); st.add(b); for (const s of [-1, 1]) { const t = mesh(G.torus(.25, .07, 12), glowMat(0xffd24a, 1.6), s * .22, 0, 0, b); t.rotation.y = Math.PI / 2; t.scale.set(1, 1, .6); } mesh(G.sph(.1, 8, 6), glowMat(0xffd24a, 2), 0, 0, 0, b); pick.push({ x, lane: l, g: b, kind: 'ribbon' }); };
  const fork = (x, good) => { const kinds = ['boat', 'flake', 'boat']; kinds[good] = 'star'; if (good === 0) kinds[2] = 'flake'; const signs = kinds.map((k, l) => { const s = mesh(G.plane(2, 2), new THREE.MeshBasicMaterial({ map: symbol(k), fog: false }), x, 4.9, lz(l), st.scene); s.rotation.y = -Math.PI / 2; mesh(G.cyl(.03, .03, 2.6, 5), M(C.brass), x, 7.1, lz(l), st.scene); if (k === 'star') sprite(C.amber, 7, x - .2, 4.9, lz(l), st.scene, .45); return s; }); for (const z of [-LANE / 2, LANE / 2]) mesh(G.box(9, 2.2, .3), M(0x1c4a52, { metal: .3 }), x + 5, 1.1, z, st.scene); forks.push({ x, good, kinds, done: false }); };
  const gate = (x, lit) => { const gg = new THREE.Group(); gg.position.set(x, 0, 0); st.add(gg); const stamps = []; for (let l = 0; l < 3; l++) { if (!lit.includes(l)) continue; const pan = mesh(G.plane(9, LANE - .3), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: .55, depthWrite: false }), -2, .03, lz(l), gg); pan.rotation.x = -Math.PI / 2; const cone = mesh(G.cone(1.5, 7.5, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: .13, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), -2, 3.9, lz(l), gg); mesh(G.sph(.4, 12, 8), glowMat(0xfff0b0, 2.6), -2, 7.7, lz(l), gg); const sp = new THREE.Group(); sp.position.set(0, 6, lz(l)); gg.add(sp); mesh(G.cyl(.25, .25, 3, 8), M(C.iron, { metal: .6 }), 0, 1.5, 0, sp); mesh(G.rbox(1.5, .5, 1.5, .1), M(0xb02a1a, { rough: .5 }), 0, -.1, 0, sp); stamps.push({ l, sp, t: 0 }); } mesh(G.box(.6, .6, 12.4), M(C.iron, { metal: .5 }), 0, 8.0, 0, gg); gates.push({ x, lit, stamps, done: false }); };
  // section 1: the Sorting Hall
  for (let x = 46; x < 150; x += 19) { const free = r() * 3 | 0; for (let l = 0; l < 3; l++) if (l !== free && r() < .8) crate(x, l); ribbon(x, free); ribbon(x + 6, free); }
  fork(168, 2);
  // section 2: the Wrapping Works
  let n = 0; for (let x = 200; x < 322; x += 19) { const k = n++ % 3; if (k === 0) bar(x); else if (k === 1) bump(x); else { const free = r() * 3 | 0; for (let l = 0; l < 3; l++) if (l !== free) crate(x, l); ribbon(x, free); } ribbon(x + 9, r() * 3 | 0); }
  fork(344, 0);
  // section 3: the Lamp Tunnels
  n = 0; for (let x = 376; x < 510; x += 25) { const k = n++ % 2; if (k === 0) { const dark = r() * 3 | 0; gate(x, [0, 1, 2].filter(l => l !== dark)); ribbon(x - 3, dark); ribbon(x + 3, dark); } else { if (r() < .5) bump(x); else bar(x); ribbon(x + 8, r() * 3 | 0); } }
  fork(530, 1);
  for (let x = 546; x < 600; x += 6) ribbon(x, 1);
  const kp = [['k17', 262, 1], ['k18', 452, 1]].filter(([id]) => !g.has(id)).map(([id, x, l]) => { const k = kit.makeKeepsake(id === 'k17' ? 'snowflake' : 'page'); k.scale.setScalar(2.6); k.position.set(x, 1.6, lz(l)); st.add(k); for (const ob of obs) if (ob.type === 'crate' && Math.abs(ob.x - x) < 7 && ob.lane === l) { ob.g.visible = false; ob.gone = true; } return { id, x, lane: l, g: k, kind: 'keep' }; });
  pick.push(...kp);
  // the lift at the very end
  const lift = mesh(G.cyl(4.2, 4.2, .4, 20), M(C.copper, { metal: .7, rough: .3 }), L - 14, .1, 0, st.scene); sprite(C.amber, 30, L - 14, 6, 0, st.scene, .35);

  // ---------- the cart and its crew ----------
  const cart = new THREE.Group(); st.add(cart);
  const body = kit.crate(3.4, .8, 2.3, 0xb88a5c); body.position.y = .35; cart.add(body);
  for (const [x, z] of [[-1.2, 1.2], [1.2, 1.2], [-1.2, -1.2], [1.2, -1.2]]) { const w = mesh(G.cyl(.34, .34, .2, 14), M(0x1b2230, { metal: .5 }), x, .34, z, cart); w.rotation.x = Math.PI / 2; mesh(G.torus(.34, .04, 14), M(C.brass, { metal: .8 }), x, .34, z + Math.sign(z) * .1, cart); }
  const lampC = mesh(G.sph(.18, 10, 8), glowMat(C.amber, 2.6), 1.9, 1.0, 0, cart); sprite(C.amber, 2.5, 1.9, 1.0, 0, cart, .5);
  const cl = new THREE.PointLight(0xffc98a, 38, 30, 1.5); cl.position.set(3, 3.5, 0); cart.add(cl);
  const crew = {}; const seat = { bo: [.75, .72], river: [.75, 0], tavi: [.75, -.72], wren: [-.6, .72], mari: [-.6, 0], dex: [-.6, -.72] };
  const river = g.spawnRiver(0, 0); for (const nme in seat) { const a = nme === 'river' ? river : st.actor(CAST[nme]()); cart.add(a.g); a.pose = 'ride'; a.place(seat[nme][0], .86, seat[nme][1], Math.PI / 2); a.noFloor = true; crew[nme] = a; }
  const admiral = kit.makeWalrus(); admiral.position.set(1.75, 1.18, 0); admiral.rotation.y = Math.PI / 2; cart.add(admiral);
  const wp = new THREE.Vector3();
  const yell = (nme, text, secs = 1.8) => { const a = crew[nme]; a.talking = 1.2; g.ui.bubble(() => wp.set(cart.position.x + a.pos.x, cart.position.y + 2.3, cart.position.z + a.pos.z), text, secs); };
  const sparks = new kit.Puffs({ count: 140, color: 0xffd24a, size: .5, opacity: .95 }); st.add(sparks.points);

  let cx = 0, cz = 0, lane = 1, vy = 0, hy = 0, speed = 12.5, slow = 0, running = false, ribbons = 0, hits = 0, done = false, warned = {}, detouring = false, wob = 0;
  const lines = { crate: [['mari', 'Left! No, the other left!'], ['dex', 'That one was real.'], ['bo', 'Admiral says ow!'], ['tavi', 'Parcel! Big parcel!']], bar: [['wren', 'Duck.'], ['dex', 'My HAIR.'], ['mari', 'Heads DOWN!']], bump: [['tavi', 'Whee! Again!'], ['bo', 'My tummy!'], ['dex', 'Warn me next time!']] };
  const stampWords = ['FRAGILE', 'THIS WAY UP', 'DO NOT SHAKE', 'HANDLE WITH CARE', 'PERISHABLE'];
  st.cam.mode = 'custom'; st.cam.fov = 54; st.cam.rate = 6;
  st.cam.fn = (p, l) => { p.set(cx - 9.5, 5.4, cz * .55); l.set(cx + 10, 1.4, cz * .75); };
  st.tick((dt, t) => {
    sparks.update(dt); for (const p of pick) { p.g.rotation.y += dt * 3; if (p.kind === 'keep') p.g.userData.spin.rotation.y += dt * 2; }
    for (const gt of gates) for (const s of gt.stamps) { s.t = Math.max(0, s.t - dt * 2.4); s.sp.position.y = 6 - Math.sin(Math.min(1, s.t) * Math.PI) * 3.6; }
    cart.position.set(cx, hy, cz); cart.rotation.z = Math.sin(t * 22) * wob * .08; cart.rotation.x = (lz(lane) - cz) * -.06; wob = Math.max(0, wob - dt * 2);
    const duck = g.input.h.duck && hy < .05; for (const k in crew) crew[k].pose = duck ? 'crouch' : 'ride';
    if (!running || g.ui.busy) return;
    if (g.input.p.left) { if (lane > 0) { lane--; audio.sfx('next'); } } if (g.input.p.right) { if (lane < 2) { lane++; audio.sfx('next'); } }
    cz = damp(cz, lz(lane), 13, dt);
    if (g.input.p.jump && hy <= 0.001 && !duck) { vy = 7.4; audio.sfx('jump'); }
    vy -= 19 * dt; hy = Math.max(0, hy + vy * dt); if (hy === 0) vy = Math.max(0, vy);
    slow -= dt; speed = damp(speed, slow > 0 ? 6.5 : 12.5 + Math.min(3, cx / 240), 2.4, dt); cx += speed * dt;
    const bonk = (type, ob) => { hits++; slow = .9; wob = 1; audio.sfx('bump'); g.shake(.3); const ln = lines[type][hits % lines[type].length]; yell(ln[0], ln[1]); sparks.burst(16, cx + 1.5, 1, cz, 4, .5); };
    for (const ob of obs) {
      if (ob.done || ob.gone) continue; const dx = ob.x - cx;
      if (dx < 16 && dx > 0 && !ob.warn) { ob.warn = true; if ((warned[ob.type] = (warned[ob.type] || 0) + 1) <= 3) g.big({ crate: 'Dodge!', bar: 'Duck!', bump: 'Jump!' }[ob.type], .9); }
      if (ob.type === 'crate') { if (Math.abs(dx) < 1.9 && Math.abs(lz(ob.lane) - cz) < 1.3) { ob.done = true; bonk('crate', ob); ob.g.rotation.z = .5; ob.g.position.y = .4; ob.g.position.z += (ob.lane === 0 ? -1 : ob.lane === 2 ? 1 : (r() < .5 ? -1 : 1)) * 4.4; } }
      else if (Math.abs(dx - .6) < .7) { ob.done = true; if (ob.type === 'bar' ? !duck : hy < .45) bonk(ob.type, ob); else audio.sfx('good'); }
      if (dx < -4) ob.done = true;
    }
    for (const p of pick) if (!p.got && Math.abs(p.x - cx - .8) < 1.3 && Math.abs(lz(p.lane) - cz) < 1.2) { p.got = true; st.scene.remove(p.g); if (p.kind === 'keep') g.collect(p.id); else { ribbons++; audio.sfx('catch', { note: ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6'][ribbons % 7] }); sparks.burst(8, p.x, 1.3, lz(p.lane), 3, .4); g.meter(`Gold ribbons: ${ribbons}`, cx / L); } }
    for (const gt of gates) if (!gt.done && cx > gt.x - .5) { gt.done = true; if (gt.lit.includes(lane)) { const s = gt.stamps.find(s => s.l === lane); if (s) s.t = 1; hits++; wob = 1; audio.sfx('stamp'); g.shake(.25); const who = ['dex', 'tavi', 'mari', 'bo', 'wren'][hits % 5]; yell(who, stampWords[hits % stampWords.length] + '?!', 2.2); slow = .5; } else { audio.sfx('good'); if (!warned.gateOk) { warned.gateOk = true; yell('wren', 'The dark is safe.'); } } }
    for (const gt of gates) { const dx = gt.x - cx; if (dx < 26 && dx > 0 && !gt.warn) { gt.warn = true; if ((warned.gate = (warned.gate || 0) + 1) <= 2) g.big('Stay out of the light!', 1.4); } }
    for (const f of forks) { const dx = f.x - cx; if (dx < 44 && dx > 0 && !f.warn) { f.warn = true; g.big('Follow the star!', 1.6); yell('mari', 'The star! Take the star!', 2.4); } if (!f.done && cx > f.x) { if (lane === f.good) { f.done = true; audio.sfx('star'); yell('tavi', 'To the plaza!', 1.6); } else if (!detouring) { detouring = true; running = false; detour(f); } } }
    g.meter(`Gold ribbons: ${ribbons}`, cx / L);
    if (cx > L - 20) { done = true; running = false; }
  });
  async function detour(f) {
    const kind = f.kinds[lane]; g.ui.fade(1, .35); await g.wait(.5);
    await narr(kind === 'boat' ? 'The cart went all the way round the Faraway Dock, past a very surprised fishing boat, and came back smelling of herring.' : 'The cart went all the way through the Cold Store, where they keep the spare snow, and came back out with icicles on it.');
    cx = f.x - 62; f.warn = false; for (const ob of obs) if (ob.x > cx && !ob.gone) { if (ob.type !== 'crate') { ob.done = false; ob.warn = false; } } for (const gt of gates) if (gt.x > cx) { gt.done = false; gt.warn = false; }
    yell(kind === 'boat' ? 'dex' : 'bo', kind === 'boat' ? 'I smell like a fish.' : 'Admiral has an icicle!', 2.4);
    g.ui.fade(0, .5); await g.wait(.3); detouring = false; running = true;
  }
  st.dbg = { state: () => ({ cx, lane, hits, ribbons }), obs, forks, gates, pick, set: o => { if (o.cx !== undefined) { cx = o.cx; for (const f of forks) if (f.x < cx) f.done = true; } if (o.lane !== undefined) lane = o.lane; }, crew };

  await g.open();
  await narr('It was not a quick look. It was a slide, and a bump, and a long dark whoosh, and then six children and one walrus were rattling along under the city in a parcel cart.');
  await say('Mari', 'Nobody panic. I am counting. Six. And a walrus. Good. NOW you may panic.', { keep: true });
  await say('Tavi', 'We just have to get back up to the plaza. Follow the signs with the star!', { keep: true });
  g.ui.action(true); g.goal('Steer left and right. Jump, duck, and follow the star!'); g.meter('Gold ribbons: 0', 0);
  g.toast('Left and right to change belts.', 'Jump the blue rollers. Duck the yellow bars.', 6);
  running = true; audio.loop('train', true, .7);
  await g.until(() => done);
  g.meter(null); g.goal(null); g.ui.action(false); g.bars(true);
  // onto the lift, and up
  let k = 0; const tk = st.tick(dt => { k = Math.min(1, k + dt / 2.2); cx = lerp(cx, L - 14, .06); cz = damp(cz, 0, 4, dt); if (k >= 1) { hy += dt * 4; lift.position.y = hy + .1; } });
  await g.until(() => k >= 1); audio.sfx('lever'); audio.sfx('clank');
  st.cam.fn = (p, l) => { p.set(L - 26, 3 + hy * .3, 7); l.set(L - 14, 2 + hy, 0); };
  await say('Dex', hits > 6 ? 'I have been stamped, bumped and sorted. I am officially a parcel.' : 'That was... fine. That was actually fine. Do not tell anyone I said that.', { keep: true });
  await narr(`The cart rolled onto a round brass plate, and the plate began to rise. They had caught ${ribbons} gold ribbons on the way, which nobody had asked them to do.`);
  await say('Bo', 'Where does it come out?', { keep: true });
  await say('Wren', 'I drew it. You will not like it.', { keep: true });
  st.untick(tk);
  await g.fade(1, .9);
}
