// Chapter Seven: Kindlewick. The hidden city, and a plaza full of things to look at.
import { kit, CAST, lightPool, talk, look } from './common.js';
import { makeCity, hookLamp, lanternTree, stall } from './city.js';
const { THREE, M, G, mesh, C, sprite, glowMat, damp, lerp, clamp, TAU } = kit;

// The plaza south of the Long Lantern, dressed for walking about. Chapter nine uses it too.
export function plaza(g, { folk = 6 } = {}) {
  const st = g.game.newStage();
  st.mood({ fog: 0x1b2c62, density: .0042, hemi: [0xa8bfff, 0x4a3a50, .78], sun: [0xbcd0ff, .55, [-8, 20, 14]], env: .6 });
  st.sky = st.add(kit.makeSky({ aurora: 1.5, top: 0x060b24, mid: 0x13285c, low: 0x3a4f8c }));
  const city = st.add(makeCity({})); st.tick((dt, t) => city.userData.update(dt, t));
  st.snow = new kit.Snow({ count: 700, box: [60, 24, 50], wind: [-.4, .2], fall: 1.1, size: .16 }); st.add(st.snow.points);
  const src = [];
  const lamp = (x, z, c = C.amber) => { const l = hookLamp(c); l.position.set(x, 0, z); l.rotation.y = x > 0 ? Math.PI : 0; st.add(l); src.push({ x: x + (x > 0 ? -.9 : .9), y: 3, z, color: c, power: 20 }); st.block(x, z, .45); };
  for (const x of [-27, -16, -5.5, 5.5, 16, 27]) { lamp(x, 12.2, x % 2 ? C.amber : C.amber); lamp(x * .98, 30.5); }
  for (const [x, z, s] of [[-29.5, 19, 1.3], [29.5, 20, 1.4], [-29.5, 31.5, 1.1], [29.5, 32, 1.2]]) { const t = lanternTree(x * 3 + z | 0, s); t.position.set(x, 0, z); st.add(t); st.block(x, z, .7); src.push({ x, y: 2.6, z, color: C.aurora, power: 9 }); }
  [[-28.6, 25.2, 0x2a8f8a, Math.PI / 2], [28.6, 26, 0xd98a2c, -Math.PI / 2], [-28.6, 14.6, 0x3566c0, Math.PI / 2]].forEach(([x, z, c, ry], i) => { const s = stall(c, i + 2); s.position.set(x, 0, z); s.rotation.y = ry; st.add(s); st.block(x, z, 1.7); src.push({ x, y: 2.4, z: z + 1, color: C.amber, power: 12 }); });
  lightPool(g, src, 4, 13);
  // Kindlefolk going about their evening
  const walkers = [];
  for (let i = 0; i < folk; i++) { const a = CAST.folk(i), z = [14.5, 21, 27.5, 17.5, 24.5, 29][i % 6], x0 = -24 + (i * 7) % 20, x1 = 6 + (i * 5) % 20; st.actor(a, i % 2 ? x1 : x0, 0, z, 0); walkers.push({ a, x0, x1, z, dir: i % 2 ? -1 : 1, wait: i * .7, sp: 1.1 + (i % 3) * .25 }); }
  st.tick(dt => { for (const w of walkers) { if (w.stop || g.ui.busy && g.game.focus === w.a) { w.a.speed = 0; continue; } if (w.wait > 0) { w.wait -= dt; w.a.speed = 0; continue; } w.a.pos.x += w.dir * w.sp * dt; w.a.speed = w.sp; w.a.targetYaw = w.dir * Math.PI / 2; if (w.a.pos.x > w.x1) { w.dir = -1; w.wait = 1 + Math.random() * 2; } if (w.a.pos.x < w.x0) { w.dir = 1; w.wait = 1 + Math.random() * 2; } } });
  st.area(-30.5, 30.5, 10.6, 32.6);
  Object.assign(st.cam, { mode: 'follow', h: 4.3, d: 11.8, fov: 38, minX: -24, maxX: 24, minZ: 12, maxZ: 31, rate: 3.5, talk: .72 });
  st.speed = 3.5;
  return { st, city, walkers, src };
}

export default async function chapter7(g) {
  const { say, narr, choose, wait, audio } = g;
  const { st, city, walkers } = plaza(g);
  // ---- the four sights along the north side of the plaza ----
  // 1. the Clockwork Workshop
  const ws = new THREE.Group(); ws.position.set(-23, 0, 6.2); st.add(ws);
  mesh(G.box(11, 7, 6), M(0x3d4d7c, { rough: .9 }), 0, 3.5, 0, ws); const rf = mesh(G.cyl(.01, 5.6, 3, 4), M(0x1f6f6a, { rough: .7 }), 0, 8.5, 0, ws); rf.rotation.y = Math.PI / 4; rf.scale.set(1.45, 1, .8); const sn = mesh(G.cyl(.01, 3.6, 1.8, 4), M(0xe6f1fb, { rough: 1 }), 0, 9.2, 0, ws); sn.rotation.y = Math.PI / 4; sn.scale.set(1.45, 1, .8);
  mesh(G.box(5, 2.6, .2), M(C.woodDark), 0, 2.2, 3.0, ws); mesh(G.plane(4.6, 2.2), new THREE.MeshStandardMaterial({ color: 0x3a2008, emissive: C.amber, emissiveIntensity: 1.1 }), 0, 2.2, 3.12, ws);
  const wsGears = [[-3.6, 5.6, 1.0, 12, C.brass], [-2.1, 5.0, .6, 9, C.copper], [3.2, 5.5, 1.2, 14, 0x9fb0b8], [1.5, 5.9, .55, 8, C.brass]].map(([x, y, r, t, c], i) => { const gg = kit.gear(r, t, .16, c); gg.position.set(x, y, 3.15); ws.add(gg); return { g: gg, s: (i % 2 ? 1 : -1) / r }; });
  const bird = new THREE.Group(); bird.position.set(-.3, 2.0, 3.3); ws.add(bird); mesh(G.sph(.28, 12, 10), M(C.teal, { metal: .5, rough: .3 }), 0, 0, 0, bird).scale.set(1.3, 1, 1); mesh(G.sph(.17, 10, 8), M(C.teal, { metal: .5, rough: .3 }), .34, .2, 0, bird); mesh(G.cone(.06, .2, 6), M(C.brass, { metal: .8 }), .55, .18, 0, bird).rotation.z = -Math.PI / 2; const wing = mesh(G.sph(.22, 8, 6), M(C.copper, { metal: .7, rough: .3 }), -.05, .1, .2, bird); wing.scale.set(1.2, .2, .7);
  mesh(G.box(3.4, .12, .5), M(C.wood), 0, 1.6, 3.3, ws); const sign1 = kit.sign('CLOCKWORKS', 3.2, .7, { w: 420, h: 96, font: 'bold 52px Georgia, serif' }); sign1.position.set(0, 4.0, 3.14); ws.add(sign1);
  st.tick((dt, t) => { for (const w of wsGears) w.g.rotation.z += dt * w.s; wing.rotation.x = Math.sin(t * 9) * .5; bird.position.y = 2.0 + Math.abs(Math.sin(t * 2.2)) * .08; });
  // 2. the bandstand
  const bs = new THREE.Group(); bs.position.set(-12, 0, 7.6); st.add(bs);
  mesh(G.cyl(3.4, 3.6, .7, 10), M(0x8b9bc4, { rough: .9 }), 0, .35, 0, bs); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; mesh(G.cyl(.08, .08, 3, 6), M(C.brass, { metal: .7, rough: .3 }), Math.cos(a) * 3.1, 2.2, Math.sin(a) * 3.1, bs); }
  mesh(G.cone(3.9, 1.8, 10), M(0xb8683a, { rough: .6 }), 0, 4.6, 0, bs); mesh(G.cone(2.2, 1.1, 10), M(0xe6f1fb, { rough: 1 }), 0, 5.1, 0, bs);
  const band = [0, 1, 2].map(i => { const a = CAST.folk(i + 7); st.actor(a, -12 + (i - 1) * 1.5, .7, 7.4 + (i === 1 ? -.5 : .3), 0); a.noFloor = true; const inst = new THREE.Group(); a.hand(1).add(inst); if (i === 0) { mesh(G.cone(.16, .5, 12, 1, true), M(C.brass, { metal: .8, rough: .25, side: THREE.DoubleSide }), 0, .1, .2, inst).rotation.x = Math.PI / 2; } else if (i === 1) { mesh(G.cyl(.3, .3, .26, 14), M(0xf6ecd8), -.3, 0, .35, inst); } else { for (let k = 0; k < 3; k++) mesh(G.sph(.07, 8, 6), M(C.brass, { metal: .8 }), k * .12 - .12, -.05, .15, inst); } a.pose = 'hold'; return a; });
  const bell = new THREE.Group(); bell.position.set(-8.2, 0, 10.9); st.add(bell); for (const s of [-1, 1]) mesh(G.cyl(.07, .09, 2.6, 8), M(C.woodDark), s * .7, 1.3, 0, bell); mesh(G.box(1.7, .14, .14), M(C.woodDark), 0, 2.6, 0, bell);
  const bellB = new THREE.Group(); bellB.position.y = 2.5; bell.add(bellB); mesh(G.cyl(.18, .46, .7, 14), M(C.brass, { metal: .85, rough: .2 }), 0, -.45, 0, bellB); mesh(G.sph(.1, 8, 6), M(C.iron), 0, -.86, 0, bellB); let ring = 0; st.tick((dt, t) => { ring = Math.max(0, ring - dt); bellB.rotation.z = Math.sin(t * 13) * ring * .5; for (const b of band) b.hop = Math.abs(Math.sin(t * 4.2 + b.pos.x)) * .06; }); st.block(-8.2, 10.9, .9);
  // 3. the Burrow: the way down to the delivery tunnels
  const bu = new THREE.Group(); bu.position.set(12.5, 0, 7.2); st.add(bu);
  const mound = mesh(G.sph(4.2, 16, 10), M(0xdfeaf8, { rough: 1 }), 0, 0, 0, bu); mound.scale.set(1.2, .8, 1);
  mesh(G.cyl(1.7, 1.7, .3, 20), M(C.copper, { metal: .7, rough: .3 }), 0, 1.6, 3.1, bu).rotation.x = Math.PI / 2; mesh(G.cyl(1.45, 1.45, .32, 20), M(0x0a1220), 0, 1.6, 3.12, bu).rotation.x = Math.PI / 2;
  sprite(C.aurora, 3.4, 0, 1.6, 3.3, bu, .35); const sign3 = kit.sign('THE BURROW', 2.6, .6, { w: 420, h: 96, font: 'bold 52px Georgia, serif' }); sign3.position.set(0, 3.7, 3.2); sign3.rotation.x = -.2; bu.add(sign3);
  mesh(G.box(1.1, .16, 6), M(0x34444e, { metal: .5, rough: .5 }), 0, .5, 5.4, bu); for (const s of [-1, 1]) mesh(G.box(.08, .5, 6), M(C.iron), s * .5, .25, 5.4, bu);
  const parcels = [0, 1, 2, 3].map(i => { const p = kit.gift(.5, .4, .5, [0x2a8f8a, 0x3566c0, 0xd98a2c, 0x7a5ab8][i]); bu.add(p); return { p, k: i / 4 }; });
  st.tick(dt => { for (const o of parcels) { o.k = (o.k + dt * .16) % 1; o.p.position.set(0, .6, 8.2 - o.k * 5.6); o.p.visible = o.k < .96; } });
  st.block(12.5, 9.4, 2.3);
  // 4. the Lantern Lift
  const lf = new THREE.Group(); lf.position.set(24, 0, 7.5); st.add(lf);
  mesh(G.cyl(.35, .5, 42, 10), M(C.brass, { metal: .75, rough: .3 }), 0, 21, -1.2, lf); mesh(G.cyl(3, 3, .4, 14), M(0x8b9bc4, { rough: .9 }), 0, 40, 0, lf); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; mesh(G.cyl(.04, .04, 1.1, 5), M(C.brass, { metal: .7 }), Math.cos(a) * 2.8, 40.7, Math.sin(a) * 2.8, lf); }
  const cage = new THREE.Group(); cage.position.set(0, 0, .6); lf.add(cage); mesh(G.cyl(1.2, 1.2, .16, 12), M(C.copper, { metal: .7, rough: .3 }), 0, .1, 0, cage); mesh(G.cyl(1.25, 1.25, .16, 12), M(C.copper, { metal: .7, rough: .3 }), 0, 2.7, 0, cage); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .4; if (Math.sin(a) > .6) continue; mesh(G.cyl(.03, .03, 2.6, 5), M(C.brass, { metal: .7 }), Math.cos(a) * 1.15, 1.4, Math.sin(a) * 1.15, cage); } mesh(G.sph(.2, 10, 8), glowMat(C.amber, 2.4), 0, 2.4, 0, cage); sprite(C.amber, 2.4, 0, 2.4, 0, cage, .5);
  st.block(24, 8.4, 1.6);

  // ---- friends and townsfolk ----
  const river = g.spawnRiver(0, 29.5, Math.PI);
  const ibby = st.actor(CAST.ibby(), 1.6, 0, 30.8, Math.PI * .9);
  const f = { dex: st.actor(CAST.dex(), -20.2, 0, 11.4, Math.PI * .9), bo: st.actor(CAST.bo(), -9.8, 0, 12.2, Math.PI * .8), wren: st.actor(CAST.wren(), 2.2, 0, 11.4, Math.PI), tavi: st.actor(CAST.tavi(), 14.6, 0, 12.6, Math.PI * .9), mari: st.actor(CAST.mari(), 21.6, 0, 11.4, Math.PI * 1.1) };
  const admiral = kit.makeWalrus(); f.bo.hand(0).add(admiral); admiral.position.set(0, -.05, .12);
  st.tick((dt, t) => { f.bo.hop = Math.abs(Math.sin(t * 4.2)) * .08; });
  g.keepsake('k15', -26.4, 1.0, 22);
  const seen = {}, count = () => Object.keys(seen).length;
  const see = k => { if (!seen[k]) { seen[k] = true; audio.sfx('good'); g.goal(count() < 4 ? `See the sights of Kindlewick (${count()} of 4)` : 'Go and see what Tavi has found'); } };
  const fz = a => ({ z: a.pos.z + 1.1, r: 1.5 });

  look(g, -23, 4.6, 9.3, 'Look in the workshop window', async g => {
    g.bars(true); await g.shot({ pos: [-23, 2.6, 15.5], look: [-23, 2.6, 9], dur: 1.8, fov: 30 });
    await narr('Inside, a clockwork bird was getting its very last feather. It tried its wings, once, and looked pleased with itself.');
    await narr('A card in the window said: ALL YEAR WE MAKE. TONIGHT WE SEND.');
    g.camBack(); g.bars(false); see('works');
  }, { wz: 11.4, r: 2.2 });
  talk(g, f.dex, async () => { await say('Dex', count() ? 'Those gears are real. I checked the teeth. Nobody builds a fake gear that big.' : 'Okay. I admit this is a lot of extras.', { emote: 'shrug' }); if (seen.works) await say('Dex', 'I am not saying anything else yet.'); }, fz(f.dex));
  look(g, -8.2, 3.6, 10.9, "Ring the visitors' bell", async g => {
    const v = await choose('River', "A brass bell hangs by the bandstand. A little sign says: VISITORS, PLEASE RING.", [['Ring it softly', 'soft'], ['Ring it LOUD', 'loud']]);
    ring = v === 'loud' ? 2.4 : 1; audio.sfx(v === 'loud' ? 'horn' : 'chime'); audio.sfx('fork'); g.flag('bell', v);
    for (const b of band) b.do('cheer', 1.6); await wait(.5); audio.sfx('star');
    if (v === 'loud') { for (const w of walkers) w.a.do('cheer', 2); await narr('The whole plaza turned round. Then the whole plaza cheered, and the band played River a fanfare all of his own.'); }
    else await narr('One clear note. The band tipped their caps and wove it into the tune without missing a beat.');
    see('band');
  }, { wz: 12.2, r: 1.8 });
  talk(g, f.bo, async () => { await say('Bo', 'Admiral is dancing. I am only holding him while he does it.', { emote: 'cheer' }); }, fz(f.bo));
  look(g, 12.5, 4.6, 10.3, 'Peek into the Burrow', async g => {
    g.bars(true); await g.shot({ pos: [12.5, 2.2, 17.5], look: [12.5, 1.5, 10], dur: 1.8, fov: 30 });
    await narr('A round copper door, standing open. A moving belt carried parcels down into it, one after another, into warm green light.');
    await narr('From far below came a rumble, and a clatter, and something that sounded very much like a slide.');
    g.camBack(); g.bars(false); see('burrow');
  }, { wz: 12.6, r: 2.2, on: () => count() < 4 });
  talk(g, f.tavi, async () => { await say('Tavi', 'The parcels go DOWN and then they go EVERYWHERE. There are tunnels under the whole city! I counted nine belts!', { emote: 'jump' }); }, Object.assign(fz(f.tavi), { on: () => count() < 4 }));
  look(g, 24, 4.2, 8.1, 'Ride the Lantern Lift', async g => {
    g.bars(true); river.g.visible = false; audio.sfx('lever');
    let k = 0; const tk = st.tick(dt => { k = Math.min(1, k + dt / 7); cage.position.y = kit.smooth(k) * 38; });
    st.cam.mode = 'cine'; st.cam.prev = 'follow'; const p0 = new THREE.Vector3(26, 3, 14), p1 = new THREE.Vector3(34, 46, 34);
    const ct = st.tick(() => { const e = kit.smooth(k); st.cam.pos.lerpVectors(p0, p1, e); st.cam.look.set(lerp(24, -10, e), lerp(3, 20, e), lerp(8, -30, e)); st.cam.fovNow = 50; });
    await narr('The lift went up past the lamps, past the tramlines, past the tops of the towers.');
    await g.until(() => k >= 1);
    await narr('From up here the city was a bowl of lights. Mari was trying to count them. She had got as far as four thousand.');
    g.collect('k16'); await wait(1.5);
    st.untick(tk); st.untick(ct); cage.position.y = 0; river.g.visible = true; g.camBack(); g.bars(false); see('lift');
  }, { wz: 11.2, r: 2.2 });
  talk(g, f.mari, async () => { await say('Mari', seen.lift ? 'Four thousand lanterns. And every single one has somebody whose job it is to light it.' : 'I am going to count the lanterns. Do not talk to me, I will lose my place. One. Two. Three.', { emote: 'think' }); }, fz(f.mari));
  talk(g, f.wren, async () => { await narr('Wren is drawing the great dark lantern in the middle of the plaza. In her picture it is lit.'); await say('Wren', 'Not yet. But I noticed it early.'); }, fz(f.wren));
  talk(g, ibby, async () => { await say('Ibby', 'Go and look at everything. That is what it is for. We gather at the Long Lantern when the bells ring.'); }, { z: 29.8, r: 1.5, on: () => count() < 4 });
  const lines = [['Welcome, travelers! First time in Kindlewick? I can tell. You keep looking up.'], ['All year we make. Tonight we do not make. Tonight we send.'], ['The ground is warm here, you will notice. Old volcano. She is asleep. We try not to sing too loud.'], ['You came on the Nightjar? Then somebody up the line thinks well of you.'], ['Mind the tram. It is very polite, but it does not stop.'], ['Have you seen the Kindler yet? No? You will know. She is hard to miss.']];
  walkers.forEach((w, i) => { const it = st.item({ x: 0, z: 0, y: 2.2, r: 1.4, label: 'Say hello', use: async g => { w.stop = true; w.a.lookAt(river.pos.x, river.pos.z); await say('Kindlefolk', lines[i % lines.length][0], { emote: 'wave' }); w.stop = false; } }); st.tick(() => { it.x = w.a.pos.x; it.z = w.a.pos.z + .6; it.pz = w.a.pos.z; }); st.cast.Kindlefolk = w.a; it.who = w.a; });
  // make "Kindlefolk" lines come from whoever River is talking to
  st.tick(() => { if (st.near && st.near.who) st.cast.Kindlefolk = st.near.who; });

  // ---------- arriving ----------
  const train = kit.makeTrain({ cars: 4 }); st.add(train); let ta = .95; const trainTick = st.tick(dt => { ta -= dt * .012; train.position.set(Math.cos(ta) * 150, 30.9, Math.sin(ta) * 150); train.rotation.y = -ta + Math.PI / 2 + Math.PI; });
  st.cam.mode = 'cine'; st.cam.prev = 'follow'; st.cam.pos.set(40, 150, 262); st.cam.look.set(0, 10, 0); st.cam.fovNow = 46; g.bars(true);
  st.scene.fog.density = .0011; st.cam.pos.set(40, 150, 262);
  await g.open(1.6);
  g.shot({ pos: [20, 118, 215], look: [0, 16, 0], dur: 9, fov: 46 }).catch(() => { });
  await narr('The Nightjar came over the rim of an old, sleeping volcano. And there in the bowl of it, where there should have been nothing but snow:');
  await g.shot({ pos: [135, 96, 120], look: [0, 16, 0], dur: 0, fov: 48 }); g.shot({ pos: [96, 84, 150], look: [0, 16, 0], dur: 9, fov: 48 }).catch(() => { });
  await narr('A city. Four thousand lanterns, and every one of them lit.');
  await g.shot({ pos: [26, 5, 52], look: [0, 17, 0], dur: 0, fov: 50 }); g.shot({ pos: [10, 4, 44], look: [0, 16, 0], dur: 8, fov: 50 }).catch(() => { });
  await narr('Towers and tramways, workshops with gears as big as houses. And at the heart of it all, one enormous lantern that was dark.');
  st.untick(trainTick); train.visible = false;
  await g.fade(1, .6); st.scene.fog.density = .0042; g.camBack(); g.bars(false); g.game.snapCam(); await g.fade(0, .8);
  await say('Ibby', 'Kindlewick. It is not on any map, because nobody who finds it wants to spoil the surprise.', { emote: 'wave' });
  await say('Ibby', 'You have a little while before the Gathering. Go and look at everything. Stay on the plaza.');
  await say('Mari', 'Everybody stay where I can... oh, never mind. Just come back when the bells ring.', { emote: 'shrug' });
  g.goal('See the sights of Kindlewick (0 of 4)'); g.control(true);
  await g.until(() => count() >= 4 && !g.ui.busy && !g.game.locked);

  // ---------- Tavi's very good idea ----------
  audio.sfx('chime'); f.tavi.do('jump', 3); g.bark('Tavi', 'Everybody! Come and LOOK at this!', 4);
  let go = false;
  st.item({ x: 13.4, z: 12.8, y: 2.6, pz: 12, r: 2.4, label: 'See what Tavi has found', use: async () => { go = true; } });
  await g.until(() => go);
  g.control(false); g.goal(null);
  f.mari.place(10.2, 0, 13.2, .8); f.bo.place(11.6, 0, 14.2, .5); f.wren.place(15.8, 0, 14.0, -.6); f.dex.place(17.0, 0, 12.8, -.9); f.tavi.place(14.2, 0, 12.2, 0);
  const cart = kit.crate(1.6, .7, 1.2, 0xb88a5c); cart.position.set(12.5, .55, 13.9); st.add(cart);
  await g.walk(river, 13.2, 14.6, 3);
  await say('Tavi', 'The parcels ride these little carts all the way under the city. And this one is empty.', { emote: 'point' });
  await say('Tavi', 'An empty cart is basically a seat.');
  await say('Mari', 'Absolutely not.', { emote: 'shake' });
  const v = await choose('River', 'The empty cart ticks quietly on its rails, as if it were thinking about leaving.', [['Just a quick look', 'look'], ['Mari is right. Let us not.', 'no']]);
  g.flag('cartIdea', v);
  if (v === 'no') await say('Tavi', 'I only put Admiral on it. For scale! To see how big it is!');
  else await say('Tavi', 'Exactly! A look! I put Admiral on it already, for scale.');
  f.bo.hand(0).remove(admiral); cart.add(admiral); admiral.position.set(0, .7, 0);
  await say('Bo', 'You put ADMIRAL on it?', { emote: 'jump' });
  audio.sfx('lever'); audio.sfx('clank');
  let k = 0; const tk = st.tick(dt => { k += dt; cart.position.z -= dt * (1 + k * 3); });
  await narr('The cart gave a click, and then a lurch, and then it began, quite gently, to roll toward the open door.');
  g.bark('Bo', 'ADMIRAL!', 2); g.bark('River', 'Grab it!', 2);
  for (const n of ['bo', 'tavi', 'wren', 'dex', 'mari']) g.walk(f[n], 12.5, 10.6, 5).catch(() => { });
  g.walk(river, 12.5, 11, 5).catch(() => { });
  await wait(1.2);
  await say('Mari', 'I am counting this as NOT MY IDEA!', { keep: true });
  await g.fade(1, .6);
}
