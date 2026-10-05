// Prologue: The Hum in the Dark. River's bedroom, the sleeping house, and the train on the street.
import { kit, CAST, roomShell, house, streetLamp, snowyTree, snowman, look, talk } from './common.js';
const { THREE, M, G, mesh, C, sprite, glowMat, damp, lerp, clamp } = kit;

export function titleScene(g, st) {
  st.mood({ fog: 0x14285a, density: .0055, hemi: [0x86a4e6, 0x1a1c2c, .62], sun: [0xaec8ff, 1.2, [10, 16, 12]] });
  st.sky = st.add(kit.makeSky({ aurora: 1.5 })); st.sky.rotation.y = 1.25;   // swing the northern lights round so they hang over the title
  const sc = new kit.Scenery({ speed: 21, groundY: 0, bothSides: true, near: -9, posts: true }); st.add(sc.g);
  st.add(kit.makeLightRails(700, .05, 0, 1.62));
  const train = st.add(kit.makeTrain({ cars: 5 })), eng = train.userData.engine;
  st.snow = new kit.Snow({ count: 900, box: [70, 22, 44], wind: [-15, 0], fall: 1.4, size: .14 }); st.add(st.snow.points);
  const puffs = new kit.Puffs({ count: 160, color: 0xcfefff, size: 1.5, opacity: .45 }); st.add(puffs.points); puffs.drag = .2;
  let pt = 0;
  st.tick((dt, t) => {
    sc.update(dt); for (const w of eng.userData.wheels) w.rotation.z -= dt * 21 / .74;
    train.position.y = Math.sin(t * 9) * .012; eng.userData.kiln.emissiveIntensity = 1.4 + Math.sin(t * 3) * .5;
    pt -= dt; if (pt < 0) { pt = .05; puffs.emit(2.4, 6.3, 0, -9, 2.4, 0, 2.6, 1.4); puffs.emit(.2, 6.0, 0, -9, 2.0, 0, 2.2, 1.2); }
    puffs.update(dt);
  });
  st.cam.mode = 'custom'; st.cam.fov = 38;
  st.cam.fn = (p, l) => { const t = g.t; p.set(28 + Math.sin(t * .08) * 1.5, 2.3 + Math.sin(t * .11) * .4, 7.5 + Math.cos(t * .07) * .8); l.set(-30, 5.5, 11); };
}

export function bedroom(g, { morning = false } = {}) {
  const st = g.game.newStage();
  if (morning) { st.mood({ fog: 0xf0c8b0, density: .004, hemi: [0xffe8d0, 0x4a4a66, .95], bg: 0xf0c8b0 }); st.sky = st.add(kit.makeSky({ aurora: 0, stars: false, moon: false, top: 0x6f9be0, mid: 0xbfd4f6, low: 0xffd2b0 })); }
  else { st.mood({ fog: 0x101d40, density: .006, hemi: [0x6f8fd8, 0x161a2c, .5] }); st.sky = st.add(kit.makeSky({ aurora: .5 })); }
  // the house, cut open
  st.add(roomShell({ x0: -7, x1: 1, wall: 0x2d4f80, win: [-3.9, -1.9, 1.0, 2.4], ends: [true, 'door'] }));
  st.add(roomShell({ x0: 1, x1: 10.5, wall: 0x4d6c5a, floor: '#7a5a3e', ends: [false, false] }));
  mesh(G.box(17.8, 1.7, 4.3), M(0x161d33, { rough: 1 }), 1.75, 4.0, 0, st.scene);     // attic
  mesh(G.box(17.8, 1.4, 4.3), M(0x161d33, { rough: 1 }), 1.75, -1.0, 0, st.scene);    // the dark downstairs
  mesh(G.box(.3, 6.4, 4.3), M(0x2a3350, { rough: 1 }), -7.15, 1.6, 0, st.scene);
  mesh(G.box(18.6, .3, 5), M(0xe6f1fb, { rough: 1 }), 1.75, 4.95, 0, st.scene);        // snow on the roof
  // bed
  const bed = new THREE.Group(); bed.position.set(-5.4, 0, -1.25); st.add(bed);
  mesh(G.box(2.5, .4, 1.5), M(C.wood), 0, .25, 0, bed); mesh(G.rbox(2.4, .28, 1.4, .1), M(0xf2ead8, { rough: 1 }), 0, .56, 0, bed);
  const blanket = mesh(G.rbox(1.7, .2, 1.46, .09), M(0x2a5fae, { rough: 1 }), .38, .68, 0, bed); mesh(G.box(1.72, .07, .3), M(0x3fa87a, { rough: 1 }), .38, .78, .3, bed);
  mesh(G.rbox(.6, .2, .95, .09), M(0xffffff, { rough: 1 }), -.85, .76, 0, bed); mesh(G.box(.16, 1.3, 1.5), M(C.woodDark), -1.25, .65, 0, bed);
  // rug, shelf, desk, nightlight
  const rug = mesh(G.cyl(1.25, 1.25, .03, 28), M(0x2a8f8a, { rough: 1 }), -3, .015, .6, st.scene); mesh(G.cyl(.9, .9, .035, 28), M(0xf6ecd8, { rough: 1 }), -3, .016, .6, st.scene); mesh(G.cyl(.5, .5, .04, 28), M(0x2a5fae, { rough: 1 }), -3, .017, .6, st.scene);
  const shelf = new THREE.Group(); shelf.position.set(-.55, 0, -1.72); st.add(shelf);
  mesh(G.box(1.5, 1.9, .06), M(C.woodDark), 0, .95, -.22, shelf); for (const sx of [-1, 1]) mesh(G.box(.07, 1.9, .5), M(C.wood), sx * .74, .95, 0, shelf); for (const y of [.04, .5, 1.05, 1.6, 1.9]) mesh(G.box(1.5, .06, .5), M(C.wood), 0, y, 0, shelf);
  const bookC = [0xc9783f, 0x2a8f8a, 0xf0c330, 0x6a4fb0, 0x3566c0, 0xd9742a]; for (let i = 0; i < 7; i++) mesh(G.box(.12, .34 + (i % 3) * .05, .3), M(bookC[i % 6]), -.5 + i * .14, .7 + (i % 3) * .025, .06, shelf);
  // a toy rocket, because of course
  const rocket = new THREE.Group(); rocket.position.set(.3, 1.08, .06); shelf.add(rocket);
  mesh(G.cyl(.09, .1, .34, 12), M(0xf2f2f2, { metal: .4, rough: .3 }), 0, .2, 0, rocket); mesh(G.cone(.09, .16, 12), M(0xd9442a), 0, .45, 0, rocket); for (let i = 0; i < 3; i++) { const f = mesh(G.box(.02, .12, .1), M(0xd9442a), Math.cos(i * 2.1) * .1, .08, Math.sin(i * 2.1) * .1, rocket); f.rotation.y = -i * 2.1; }
  const turtle = mesh(G.sph(.13, 10, 8), M(0x4f9f5f, { rough: 1 }), -.3, 1.72, .1, shelf); turtle.scale.set(1.2, .7, 1); mesh(G.sph(.06, 8, 6), M(0x6fbf6f, { rough: 1 }), -.14, 1.74, .16, shelf);
  mesh(G.box(1.3, .08, .7), M(C.wood), -6.2, .8, 1.3, st.scene).visible = false;
  const nl = mesh(G.sph(.13, 12, 8), morning ? M(0xf6ecd8) : glowMat(C.amber, 2), -6.75, .5, .4, st.scene); const nlL = new THREE.PointLight(C.amber, morning ? 0 : 5, 7, 1.8); nlL.position.set(-6.5, .7, .5); st.add(nlL);
  const moonL = new THREE.PointLight(morning ? 0xffd9a8 : 0x9fc0ff, morning ? 16 : 7, 11, 1.5); moonL.position.set(-2.9, 1.6, .2); st.add(moonL);
  // a chair with River's coat over the back
  const chair = new THREE.Group(); chair.position.set(-1.9, 0, -.9); st.add(chair); mesh(G.box(.6, .06, .55), M(C.wood), 0, .55, 0, chair); mesh(G.box(.6, .7, .06), M(C.wood), 0, .92, -.26, chair); for (const [x, z] of [[-.26, -.24], [.26, -.24], [-.26, .24], [.26, .24]]) mesh(G.cyl(.03, .03, .55, 6), M(C.woodDark), x, .27, z, chair);
  const coat = mesh(G.rbox(.66, .62, .16, .07), M(0x1f4f9e, { rough: .95 }), 0, 1.0, -.24, chair); coat.rotation.x = -.08; chair.visible = morning;
  for (const s of [-1, 1]) mesh(G.box(.42, 1.75, .08), M(0x2a8f8a, { rough: 1 }), -2.9 + s * 1.28, 1.78, -1.92, st.scene);
  // paper stars on the wall
  for (let i = 0; i < 7; i++) { const s = mesh(G.cyl(.07, .07, .01, 5), glowMat(0xd8ffc8, .8), -6.6 + i * .5 + Math.sin(i * 7) * .2, 2.3 + Math.sin(i * 3) * .35, -2.0, st.scene); s.rotation.x = Math.PI / 2; }
  // hall: Justice's bed, the grown-ups' door, a photo, the stairs
  const dogBed = mesh(G.cyl(.75, .8, .16, 24), M(0x2a8f8a, { rough: 1 }), 3.3, .08, -1.0, st.scene); mesh(G.cyl(.55, .55, .18, 24), M(0xf6ecd8, { rough: 1 }), 3.3, .09, -1.0, st.scene);
  const dog = new kit.Dog(); dog.pos.set(3.3, .14, -1.0); dog.yaw = dog.targetYaw = .9; st.add(dog.g); st.actors.push(dog);
  mesh(G.box(1.15, 2.25, .08), M(0xf6ecd8, { rough: .7 }), 6.2, 1.12, -2.0, st.scene); mesh(G.sph(.06, 8, 6), M(C.brass, { metal: .7 }), 6.62, 1.1, -1.93, st.scene);
  mesh(G.box(.8, .62, .05), M(C.woodDark), 4.6, 1.9, -2.0, st.scene); mesh(G.plane(.66, .48), M(0x86b8e8, { emissive: 0x2a4a7a, ei: .5 }), 4.6, 1.9, -1.96, st.scene);
  for (let i = 0; i < 4; i++) mesh(G.sph(.05 + (i === 3 ? .01 : 0), 6, 5), M([0x4f9f8f, 0x34507a, 0x1f4f9e, 0xffffff][i]), 4.4 + i * .13, 1.82, -1.94, st.scene);
  const hallL = new THREE.PointLight(0xffc98a, morning ? 10 : 4, 9, 1.8); hallL.position.set(5.5, 1.9, 1.6); st.add(hallL);
  for (let i = 0; i < 6; i++) mesh(G.box(.5, .3, 1.6), M(C.wood), 9.2 + i * .45, -.15 - i * .3, .9, st.scene);
  mesh(G.cyl(.05, .05, 1.1, 8), M(C.woodDark), 8.9, .55, 1.75, st.scene); const rail = mesh(G.box(2.6, .08, .08), M(C.woodDark), 10.1, .75, 1.75, st.scene); rail.rotation.z = -.58;
  // outside, far below: the street
  const GY = -3.4, out = new THREE.Group(); st.add(out);
  const gt = kit.T.snow().clone(); gt.needsUpdate = true; gt.repeat.set(14, 10);
  const ground = mesh(G.plane(300, 200), new THREE.MeshStandardMaterial({ map: gt, roughness: 1 }), 0, GY, -60, out); ground.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 5; i++) { const h = house({ color: [0x4a5f86, 0x5a4f7a, 0x3f6a6a, 0x6a5560, 0x4a5f86][i], seed: i + 2, lit: [i % 2, 1, 0, i % 3 === 0] }); h.position.set(-34 + i * 16, GY, -30); out.add(h); }
  for (let i = 0; i < 6; i++) { const l = streetLamp(); l.position.set(-40 + i * 16, GY, -20.5); out.add(l); }
  for (let i = 0; i < 9; i++) { const t = snowyTree(1 + (i % 3) * .3); t.position.set(-44 + i * 11 + (i % 2) * 3, GY, -24 - (i % 3) * 14); out.add(t); }
  const sun = new THREE.DirectionalLight(morning ? 0xffe2c0 : 0x9fc0ff, morning ? 1.6 : .7); sun.position.set(-6, 12, morning ? -8 : 4); st.add(sun);
  if (!morning) { st.snow = new kit.Snow({ count: 700, box: [60, 20, 26], wind: [-.6, 0], fall: 1.5, size: .13 }); st.snow.offset.set(0, -8, -24); st.add(st.snow.points); }
  // the Nightjar, waiting off to the left until it is time
  const train = kit.makeTrain({ cars: 4 }); train.position.set(-260, GY, -13); out.add(train); train.visible = !morning;
  const rails = kit.makeLightRails(400, GY + .05, -13, 1.62); rails.position.x = -460; out.add(rails); rails.visible = !morning;
  const sm = snowman(); sm.position.set(-6, GY, -19); sm.rotation.y = morning ? 0 : Math.PI; out.add(sm);
  const glowL = new THREE.PointLight(C.amber, 0, 30, 1.5); glowL.position.set(-2.9, 1.2, -4); st.add(glowL);

  st.area(-6.2, .9, -.55, 1.7); st.area(-3.9, .9, -1.35, 1.7); st.area(.9, 1.2, .2, 1.6); st.area(1.1, 8.9, -1.35, 1.7);
  st.block(3.3, -1.0, 1.0);
  st.cam.minX = -2.6; st.cam.maxX = 5.2;
  return { st, dog, train, rails, glowL, nlL, moonL, blanket, GY, coat, chair, sm };
}

function yard(g) {
  const st = g.game.newStage();
  st.mood({ fog: 0x14285a, density: .0065, hemi: [0x86a4e6, 0x1a1c2c, .6], sun: [0xaec8ff, 1.0, [8, 14, 12]] });
  st.sky = st.add(kit.makeSky({ aurora: .8 }));
  const gt = kit.T.snow().clone(); gt.needsUpdate = true; gt.repeat.set(16, 10);
  const ground = mesh(G.plane(320, 220), new THREE.MeshStandardMaterial({ map: gt, roughness: 1 }), 0, 0, -40, st.scene); ground.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 6; i++) { const h = house({ color: [0x4a5f86, 0x5a4f7a, 0x3f6a6a, 0x6a5560, 0x4a5f86, 0x55607a][i], seed: i + 9, lit: [1, i % 2, 0, 1] }); h.position.set(-42 + i * 17, 0, -19); st.add(h); }
  for (let i = 0; i < 5; i++) { const l = streetLamp(); l.position.set(-34 + i * 17, 0, -9); st.add(l); }
  for (let i = 0; i < 12; i++) { const t = snowyTree(1 + (i % 3) * .35); t.position.set(-60 + i * 11, 0, -13 - (i % 4) * 9); st.add(t); }
  const sm = snowman(); sm.position.set(-7.5, 0, 3.2); sm.rotation.y = .4; st.add(sm); st.block(-7.5, 3.2, .8);
  const mb = new THREE.Group(); mb.position.set(-11.5, 0, 3.6); st.add(mb); mesh(G.cyl(.05, .05, 1.1, 6), M(C.woodDark), 0, .55, 0, mb); mesh(G.rbox(.5, .32, .3, .1), M(0x2a8f8a, { rough: .5 }), 0, 1.2, 0, mb); mesh(G.box(.5, .06, .32), M(0xe6f1fb), 0, 1.39, 0, mb);
  const train = kit.makeTrain({ cars: 4 }); train.position.set(12, 0, -2.4); st.add(train);
  const rails = st.add(kit.makeLightRails(500, .05, -2.4, 1.62));
  // an open, glowing doorway on the first carriage
  const door = new THREE.Group(); door.position.set(1.6, 0, -.42); st.add(door);
  mesh(G.plane(1.3, 2.5), new THREE.MeshStandardMaterial({ color: 0x331a06, emissive: C.amber, emissiveIntensity: 1.5 }), 0, 2.35, 0, door);
  mesh(G.box(1.5, .12, .12), M(C.copper, { metal: .6, rough: .35 }), 0, 3.66, .02, door);
  for (let i = 0; i < 3; i++) mesh(G.box(1.4, .12, .4), M(C.copper, { metal: .5, rough: .4 }), 0, .32 + i * .34, .5 - i * .2, door);
  const dl = new THREE.PointLight(C.amber, 26, 14, 1.6); dl.position.set(0, 2.2, 1.6); door.add(dl);
  st.snow = new kit.Snow({ count: 900, box: [60, 20, 40], wind: [-.7, 0], fall: 1.5, size: .14 }); st.add(st.snow.points);
  const puffs = new kit.Puffs({ count: 120, color: 0xcfefff, size: 1.4, opacity: .4 }); st.add(puffs.points); puffs.drag = .5;
  let pt = 0; st.puffing = true;
  st.tick((dt, t) => { pt -= dt; if (pt < 0 && st.puffing) { pt = .12; puffs.emit(train.position.x + 2.4, 6.3, -2.4, -.4, 1.6, 0, 3, .8); } puffs.update(dt); train.userData.engine.userData.kiln.emissiveIntensity = 1.3 + Math.sin(t * 2.4) * .5; });
  st.area(-15, 19, .7, 4.8);
  Object.assign(st.cam, { y: 3.5, z: 17.5, ly: 2.7, minX: -8, maxX: 12, fov: 35, talk: .58 });
  return { st, train, rails, door, puffs };
}

export default async function prologue(g) {
  const { say, narr, choose, wait, audio } = g;
  // ---------- the bedroom ----------
  let B = bedroom(g), st = B.st;
  const river = g.spawnRiver(-4.7, -.45, .5); river.pose = 'sit'; river.pos.y = .56;
  g.keepsake('k01', -2.3, 1.45, -1.75, { hidden: true, r: 1.1 });
  let hum = false, seen = false, t0 = g.t;
  look(g, -2.9, 2.2, -1.9, 'Look out the window', async g => {
    if (!hum) { await say('River', 'Snow. Just snow, and the street lamp. Nothing ever happens on our street.'); return; }
    if (seen) { await say('River', 'It is still there. It is really, really still there.'); return; }
    seen = true; await arrival();
  }, { wz: -.9, r: 1.5 });
  look(g, -5.4, 1.5, -1.25, 'Look at the bed', async () => { await say('River', hum ? 'I am definitely not going back to bed now.' : "I can't sleep. Not tonight."); }, { wz: -.4, r: 1.2 });
  look(g, -.55, 2.3, -1.7, 'Look at the shelf', async () => { await say('River', 'My rocket. My comics. My turtle.'); await say('River', 'Rockets are real. I checked. I am not so sure about some other things.'); }, { wz: -.9, r: 1.3 });
  look(g, 3.3, 1.3, -1.0, 'Pet Justice', async g => {
    B.dog.pose = 'sit'; B.dog.wag = 1; audio.sfx('woof'); g.flag('petJustice', true);
    await narr('Justice lifts her head. Thump, thump, thump goes her tail on the floor.');
    await say('River', hum ? "Stay, Justice. I'll be right back. I think." : 'Good girl, Justice. Go back to sleep.');
    B.dog.pose = 'sleep'; B.dog.wag = 0;
  }, { wz: .1, r: 1.5 });
  look(g, 6.2, 2.5, -2.0, 'Listen at the door', async () => { await narr('Mom and Dad are fast asleep. Dad is snoring like a very slow train.'); if (hum) await say('River', 'How can they sleep through this?'); }, { wz: -.9, r: 1.3 });
  look(g, 4.6, 2.4, -2.0, 'Look at the photo', async () => { await narr('Mom, Dad, River and Justice at the lake last summer. Justice is the only one looking at the camera.'); }, { wz: -.9, r: 1.0 });
  const stairs = look(g, 8.6, 1.7, .9, 'Go downstairs and outside', async g => {
    if (!seen) { await say('River', hum ? 'I should look out my window first. That is where the sound is coming from.' : "It's the middle of the night. I should stay up here."); return; }
    await g.fade(1, .6); await outside();
  }, { wz: .9, r: 1.2 });

  await g.open();
  await narr('It is the longest night of the year. Everyone in the house is asleep.');
  await narr('Everyone except River.');
  river.pose = 'stand'; river.pos.y = 0; river.pos.z = .2; river.face(0);
  await say('River', 'They say that tonight, gifts come down from the north on a road made of light.', { emote: 'think' });
  await say('River', 'But how would a gift fall out of the sky and not break? Nobody can tell me that.');
  g.goal('Have a look around the house'); g.control(true);
  { const d = g.input.device; g.toast(d === 'pad' ? 'Walk with the left stick.' : d === 'touch' ? 'Walk with the thumb stick.' : 'Walk with the arrow keys.', d === 'pad' ? 'Press A to look at things and to talk.' : d === 'touch' ? 'Tap Go to look at things and to talk.' : 'Press E to look at things and to talk.', 7); }

  // the hum arrives after a little while
  await g.until(() => g.t - t0 > 26 || Math.abs(river.pos.x + 4.7) > 3.2 && !g.ui.busy && !g.game.locked && g.t - t0 > 12);
  await g.until(() => !g.ui.busy && !g.game.locked);
  hum = true; audio.sfx('rumble', { rise: 3, len: 7 }); audio.loop('hum', true, .5);
  st.shakeHold = true; let sh = 0; const shTick = st.tick(dt => { sh = Math.min(.035, sh + dt * .012); st.shake = sh; B.nlL.intensity = 5 + Math.sin(g.t * 31) * 2; });
  await g.busy(async () => {
    await narr('Mmmmmmm. A hum, far away. Like a giant running one finger around the rim of a glass.');
    await narr('It grows. The window buzzes. The rocket on the shelf begins to rattle.');
    await say('River', 'What IS that?', { emote: 'jump' });
  });
  g.goal('Look out the window');
  await g.until(() => seen);

  async function arrival() {
    g.bars(true); g.goal(null);
    await g.shot({ pos: [-2.9, 1.75, .9], look: [-2.9, 1.5, -13], dur: 1.4, fov: 30 });
    // rails of light race down the street, and the train follows
    let k = 0; audio.sfx('rumble', { rise: 2, len: 6 });
    const tick = st.tick(dt => {
      k = Math.min(1, k + dt / 5.2); const e = 1 - Math.pow(1 - k, 3);
      B.rails.position.x = lerp(-460, 20, Math.min(1, k * 1.9)); B.train.position.x = lerp(-260, 9, e);
      for (const w of B.train.userData.engine.userData.wheels) w.rotation.z -= dt * (1 - e) * 60;
      B.glowL.intensity = e * 26; st.shake = (1 - e) * .08 + .01;
    });
    await wait(1.2);
    river.g.visible = false; await g.shot({ pos: [-2.9, 2.1, -2.5], look: [-9, -1.6, -13], dur: 0, fov: 58 }); await g.shot({ pos: [-2.9, 2.1, -2.5], look: [3.5, -1.4, -13], dur: 3.4, fov: 58 });
    await g.until(() => k >= 1); st.untick(tick); st.untick(shTick); st.shakeHold = false; st.shake = 0; B.nlL.intensity = 5; audio.loop('hum', false); audio.sfx('horn');
    await wait(.8);
    await narr('Where there was only a snowy street, there is now a train.');
    await narr('An enormous midnight train, breathing frost, standing on rails made of light.');
    await say('River', 'There are no train tracks on our street.', { keep: true });
    await say('River', '...There are now.', { keep: true });
    g.reveal(st.keeps.find(k => k.id === 'k01'));
    river.g.visible = true; g.camBack(); g.bars(false);
    const v = await choose('River', 'What should I do?', [['Go and see the train!', 'go'], ['Look around the house first', 'look'], ['Hide under the blanket', 'hide']]);
    g.flag('firstMove', v);
    if (v === 'hide') {
      await g.walk(river, -4.6, -.5, 3.4); river.g.visible = false; B.blanket.scale.set(1.05, 2.2, 1); B.blanket.position.y = .86;
      await narr('River dives under the blanket and counts to ten.');
      await narr('...eight, nine, ten.');
      river.g.visible = true; B.blanket.scale.set(1, 1, 1); B.blanket.position.y = .68;
      await say('River', 'It is still humming. Trains you imagine do not hum.');
    } else if (v === 'look') await say('River', "It's not going anywhere. I think. I'll just look around first.");
    else await say('River', 'Slippers. Coat. Hat. Go!', { emote: 'jump' });
    g.goal('Go downstairs and outside when you are ready');
  }

  // ---------- the street ----------
  async function outside() {
    const Y = yard(g); st = Y.st;
    const river = g.spawnRiver(-10.5, 3.2, 1.2);
    const ibby = st.actor(CAST.ibby(), .2, 0, 1.5, -.5);
    const lampG = new THREE.Group(); ibby.hand(1).add(lampG); kit.lantern(lampG, 0, -.15, 0, { light: 10, dist: 8, size: .12 });
    g.keepsake('k02', -11.5, .9, 2.5);
    let met = false, asked = 0, nope = 0;
    const talkIbby = talk(g, ibby, async g => {
      if (!met) {
        met = true;
        await say('Ibby', 'There you are. I had a feeling about this window.', { emote: 'wave' });
        await say('Ibby', 'I am Ibby, Wayfinder of the Nightjar. She is the train. I only point.');
        await say('River', 'A train cannot just park on a street.');
        await say('Ibby', 'She agrees with you. She finds it very embarrassing. Shall we go before the neighbors look?');
        g.goal('Ask Ibby anything, then climb aboard');
      }
      for (; ;) {
        const v = await choose('Ibby', 'Ask me anything. I like questions.', [['Where does it go?', 'where'], ['Is this real?', 'real'], ['Why did it stop for me?', 'why'], ["That's all for now.", 'bye']]);
        if (v === 'where') { await say('Ibby', 'North. Past the place where the maps give up and say "more snow".'); await say('Ibby', 'There is a city up there that keeps one special night a year. Tonight is the night.'); }
        else if (v === 'real') { g.flag('askedReal', true); await say('Ibby', 'Good question. Keep it. Never trade a good question for a quick answer.'); await say('Ibby', 'But put your hand on her side. Cold? Humming? Then something is here.'); }
        else if (v === 'why') { await say('Ibby', 'The Nightjar stops for the ones who are still wondering.'); await say('Ibby', 'You were at your window, wondering. That is as good as a ticket.'); }
        else break;
        asked++;
      }
    }, { z: 2.3, r: 1.6 });
    look(g, 7.2, 1.2, -1.2, 'Look at the rails', async () => { await narr('The rails are not iron. They are light, frozen solid. Snowflakes land on them and ring like tiny bells.'); await say('River', 'They were not here this afternoon. I would have noticed.'); }, { wz: 1.0, r: 1.8 });
    look(g, 17.5, 3.6, -1.2, 'Look at the great lamp', async () => { await narr('At the very front, where an engine should have a face, the Nightjar has one great round lantern. It is warm, even from here.'); await say('River', 'It is looking at me. Lamps do not look at people.'); }, { wz: 1.0, r: 2.2 });
    look(g, -4, 2.6, -1.2, 'Touch the carriage', async () => { await narr('Cold. And under the cold, a hum, like a cat the size of a house.'); if (g.flags.askedReal) await say('River', 'Cold and humming. So something is here.'); }, { wz: 1.0, r: 2 });
    look(g, -7.5, 2.2, 3.2, 'Look at the snowman', async () => { await say('River', 'Dad and I built him on Saturday. He has seen the whole thing. He is not saying anything.'); }, { wz: 3.9, r: 1.3 });
    look(g, 1.6, 3.2, -.4, 'Climb aboard', async g => {
      if (!met) { await talkIbby.use(g); return; }
      const v = await choose('River', 'The steps are right there. The doorway is warm and yellow.', [['Climb aboard', 'yes'], ['Not yet', 'no']]);
      if (v === 'no') { nope++; await say('Ibby', nope > 1 ? 'Still deciding? Good. Decide properly.' : 'No hurry. The Nightjar waits exactly as long as a person needs.'); return; }
      await board();
    }, { wz: 1.0, r: 1.5 });
    g.goal('Go and look at the train'); g.control(true); g.audio.loop('wind', true, .6);
    await g.fade(0, .9);
    await g.busy(async () => { await narr('The snow squeaks under River\'s boots. The whole street is asleep, and in the middle of it stands the train.'); });

    async function board() {
      g.goal(null); g.bars(true);
      await say('River', "I'm coming. But I am going to keep asking questions.", { emote: 'nod' });
      await say('Ibby', "I would be worried if you didn't. All aboard!", { emote: 'point' });
      audio.sfx('fork');
      await g.walk(river, 1.6, .9, 2.6); await g.walk(river, 1.6, .75, 2); river.g.visible = false;
      g.walk(ibby, 1.6, .9, 2.6).then(() => { ibby.g.visible = false; }).catch(() => { });
      await g.shot({ pos: [26, 4.2, 15], look: [10, 3, -2.4], dur: 2.6, fov: 40 });
      audio.sfx('horn'); Y.door.visible = false; audio.loop('train', true, .5);
      let v = 0; const tick = st.tick(dt => { v = Math.min(26, v + dt * 5); Y.train.position.x += v * dt; for (const w of Y.train.userData.engine.userData.wheels) w.rotation.z -= dt * v / .74; });
      await wait(2.6);
      await narr('The Nightjar leaned into the dark, and the rails of light ran out ahead of her.');
      await g.fade(1, 1.2); st.untick(tick);
      await narr('And just like that, the street was only a street again.');
      done = true;
    }
  }
  let done = false;
  await g.until(() => done);
}
