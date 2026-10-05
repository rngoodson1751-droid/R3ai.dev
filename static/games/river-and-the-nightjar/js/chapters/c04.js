// Chapter Four: Thimble Pass. The governor freezes, the Nightjar runs away downhill, and the lake is waiting.
import { kit, CAST, trainStage, talk, look } from './common.js';
const { THREE, M, G, mesh, C, sprite, glowMat, damp, lerp, clamp } = kit;

export default async function chapter4(g) {
  const { say, narr, choose, wait, audio } = g;
  let st = g.stage;
  const [K] = trainStage(g, { cars: [{ len: 14, booths: false, doors: [true, false] }], land: 'mountain', speed: 27, trees: 110 });
  const x0 = K.x0, x1 = K.x1, cx = K.cx;
  st.shakeHold = true; st.shake = .025; st.sway = .008; st.tick(() => { st.shake = Math.max(st.shake, st.rumble ?? .025); });
  // the kiln mouth at the front, glowing with stored northern light
  const kiln = mesh(G.cyl(.7, .7, .1, 24), new THREE.MeshStandardMaterial({ color: 0x0a2a22, emissive: C.aurora, emissiveIntensity: 2 }), x1 - .12, 1.2, -.9, st.scene); kiln.rotation.z = Math.PI / 2;
  mesh(G.torus(.72, .08, 24), M(C.copper, { metal: .7, rough: .3 }), x1 - .16, 1.2, -.9, st.scene).rotation.y = Math.PI / 2;
  const kl = new THREE.PointLight(C.aurora, 9, 8, 1.8); kl.position.set(x1 - 1, 1.3, -.4); st.add(kl);
  // pipes and dials along the back wall
  for (let i = 0; i < 4; i++) mesh(G.cyl(.06, .06, 13, 8), M(i % 2 ? C.copper : C.brass, { metal: .7, rough: .3 }), cx, .25 + i * .2, -1.95, st.scene).rotation.z = Math.PI / 2;
  const dials = [];
  for (let i = 0; i < 5; i++) { const d = new THREE.Group(); d.position.set(x0 + 2.2 + i * 2.5, 2.68, -1.98); st.add(d); mesh(G.cyl(.3, .3, .06, 20), M(0xf6ecd8), 0, 0, 0, d).rotation.x = Math.PI / 2; mesh(G.torus(.3, .04, 20), M(C.brass, { metal: .7, rough: .3 }), 0, 0, .03, d); const n = mesh(G.box(.05, .26, .02), M(0xb02a1a), 0, .1, .05, new THREE.Group()); d.add(n.parent); dials.push(n.parent); }
  st.tick((dt, t) => dials.forEach((d, i) => { d.rotation.z = -1.2 * (st.panic ?? 1) + Math.sin(t * (7 + i) + i) * .25 * (st.panic ?? 1); }));
  // the frost governor, iced solid
  const gx = cx - 2.2, gov = new THREE.Group(); gov.position.set(gx, 0, -1.0); st.add(gov);
  mesh(G.cyl(.3, .4, .9, 12), M(C.iron, { metal: .5, rough: .5 }), 0, .45, 0, gov); mesh(G.cyl(.05, .05, 1.2, 8), M(C.brass, { metal: .8, rough: .25 }), 0, 1.4, 0, gov);
  const arms = new THREE.Group(); arms.position.y = 1.7; gov.add(arms);
  for (const s of [-1, 1]) { const a = mesh(G.cyl(.03, .03, .6, 6), M(C.brass, { metal: .8, rough: .25 }), s * .26, -.12, 0, arms); a.rotation.z = s * 1.0; mesh(G.sph(.14, 14, 10), M(C.brass, { metal: .85, rough: .2 }), s * .52, -.28, 0, arms); }
  const iceM = new THREE.MeshStandardMaterial({ color: 0xcfefff, emissive: 0x4ab8e8, emissiveIntensity: .45, roughness: .08, metalness: .1, transparent: true, opacity: .82, flatShading: true });
  const ice = mesh(new THREE.IcosahedronGeometry(.85, 1), iceM, 0, 1.5, 0, gov); ice.scale.set(1, 1.15, .9);
  for (let i = 0; i < 6; i++) mesh(G.cone(.07, .4, 5), iceM, Math.cos(i) * .5, .95, Math.sin(i) * .4, ice).rotation.x = Math.PI;
  let govFree = false; st.tick(dt => { if (govFree) arms.rotation.y += dt * 9; });
  // the long brake
  const bx = cx + 2.6, brake = kit.lever(0xd9442a); brake.scale.setScalar(2.1); brake.position.set(bx, 0, -.7); st.add(brake); st.tick(dt => brake.userData.update(dt));
  // speaking tube
  const tx = x0 + 1.8; mesh(G.cyl(.05, .05, 1.6, 8), M(C.brass, { metal: .8, rough: .25 }), tx, 1.0, -1.9, st.scene); const horn = mesh(G.cone(.22, .4, 14, 1, true), M(C.brass, { metal: .8, rough: .25, side: THREE.DoubleSide }), tx, 1.85, -1.72, st.scene); horn.rotation.x = -Math.PI / 2;
  // Pym's desk of levers
  const dx = x1 - 2.4; mesh(G.rbox(1.6, 1.0, .8, .08), M(C.tealDark, { metal: .3, rough: .5 }), dx, .5, -1.5, st.scene);
  for (let i = 0; i < 4; i++) { const l = kit.lever([C.copper, 0x2a8f8a, 0xf0c330, 0xd9442a][i]); l.scale.setScalar(.7); l.position.set(dx - .55 + i * .37, 1.0, -1.5); l.userData.set(i % 2 === 0, true); st.add(l); }
  const pym = st.actor(CAST.pym(), dx - .2, 0, -.6, .3);
  const ibby = st.actor(CAST.ibby(), x0 + 2.6, 0, .4, Math.PI / 2 * .8);
  const river = g.spawnRiver(x0 + 1.4, 1.0, Math.PI / 2);
  g.keepsake('k10', x1 - .9, 1.0, 1.2);
  const sparks = new kit.Puffs({ count: 120, color: 0xffc27a, size: .28, opacity: .95 }); sparks.gravity = -9; st.add(sparks.points);
  const chips = new kit.Puffs({ count: 90, color: 0xdff4ff, size: .35, opacity: .9 }); chips.gravity = -9; st.add(chips.points);
  st.tick(dt => { sparks.update(dt); chips.update(dt); });
  st.area(x0 + .35, x1 - .6, -.35, 1.75);
  st.block(gx, -1.0, .75); st.block(bx, -.7, .55);

  let step = 0, hits = 0;
  st.item({ x: gx, z: -.1, y: 2.75, pz: -1.0, r: 1.3, label: () => 'Chip the ice', on: () => step === 1, use: async g => {
    hits++; audio.sfx('crack'); g.shake(.05); river.do('point', .25); chips.burst(10, gx, 1.6, -.6, 2.6, .7);
    ice.scale.setScalar(1 - hits / 12 * .75); g.meter('Ice on the governor', 1 - hits / 9);
    if (hits >= 9) { step = 1.5; ice.visible = false; govFree = true; g.meter(null); audio.sfx('good'); chips.burst(30, gx, 1.5, -.6, 4, 1); }
  } });
  const brakeItem = st.item({ x: bx, z: .1, y: 2.5, pz: -.7, r: 1.3, label: 'Help Pym with the brake', on: () => step === 2, use: async g => {
    let got = 0, miss = 0, pin = 0, dir = 1, zone = [.4, .62];
    g.toast('Press when the white pin is in the green.', '', 4);
    const tk = st.tick(dt => { pin += dir * dt * (.85 + got * .12); if (pin > 1) { pin = 1; dir = -1; } if (pin < 0) { pin = 0; dir = 1; } g.meter(`Pull together! ${got} of 3`, 0, { zone, pin }); });
    while (got < 3) {
      await g.until(() => g.input.p.act || (g.ui.auto && pin > zone[0] + .04 && pin < zone[1] - .04));
      if (pin >= zone[0] && pin <= zone[1]) { got++; brake.userData.set(got % 2 === 1); audio.sfx('lever'); audio.sfx('clank'); g.shake(.14); sparks.burst(26, bx, .4, .2, 4, .7); st.scenery.speed -= 3; pym.do('cheer', .6); const c = .25 + Math.random() * .5; zone = [c - .11 - miss * .02, c + .11 + miss * .02]; }
      else { miss++; audio.sfx('oops'); g.bark('Pym', ['Not yet!', 'Wait for it!', 'On the green!'][miss % 3], 1.2); zone = [zone[0] - .03, zone[1] + .03]; }
      await g.wait(.25);
    }
    st.untick(tk); g.meter(null); step = 2.5;
  } });
  st.item({ x: tx, z: -.5, y: 2.5, pz: -1.8, r: 1.3, label: 'Shout down the speaking tube', on: () => step === 3, use: async g => {
    const v = await choose('River', 'The tube runs the whole length of the train. Everyone will hear.', [['"Hold on tight, everybody!"', 'tight'], ['"Sit down and grab your walrus!"', 'walrus'], ['"Um. Hello? It is River."', 'um']]);
    g.flag('tube', v); audio.sfx('gust');
    if (v === 'walrus') { await narr('From the tube, very small and far away: "ADMIRAL IS GRABBED."'); await narr('And then Mari: "Six seated. I counted."'); }
    else if (v === 'um') { await narr('From the tube: "Hello, River! It is Tavi! Are we crashing? Scientifically?"'); await say('River', 'Not yet! Hold on to something!', { keep: true }); await narr('"Holding!" said five voices.'); }
    else { await narr('From the tube, very small and far away: "Holding!" And Mari: "Six seated. I counted."'); }
    step = 3.5;
  } });

  await g.open();
  await narr('The driving cab was hot and loud and full of dials, and every dial was pointing at the wrong end.');
  await say('Pym', "Wayfinder! The frost governor is iced solid! She cannot feel how fast she is going, so she is going as fast as she likes!", { emote: 'jump' });
  await say('Ibby', 'Pym, this is River. He is good with his hands and he does not fall off roofs.');
  await say('Pym', 'Then get that ice off the governor, River! I cannot let go of this desk!', { emote: 'point' });
  step = 1; g.goal('Chip the ice off the frost governor'); g.control(true);
  await g.until(() => step === 1.5);
  await g.busy(async () => { await say('Pym', 'She can feel again! Now the brake. It takes two. Pull when I say!', { emote: 'cheer' }); });
  step = 2; g.goal('Help Pym pull the long brake');
  g.walk(pym, bx + .9, -.3, 3).catch(() => { });
  await g.until(() => step === 2.5);
  st.rumble = .014; st.panic = .5;
  await g.busy(async () => { await say('Pym', 'Biting! She is biting! Somebody tell the passengers to hold on!'); });
  step = 3; g.goal('Shout down the speaking tube');
  await g.until(() => step === 3.5);
  // the fork
  await g.busy(async () => {
    g.walk(pym, dx - .2, -.6, 3).catch(() => { });
    await say('Pym', 'Fork ahead! Left is the Whistling Tunnel. Right is the Spindle Bridges. I cannot do both and steer!', { emote: 'point' });
    const v = await choose('Pym', 'Pick one, River! Quick as you like!', [['Left! The Whistling Tunnel', 'tunnel'], ['Right! The Spindle Bridges', 'bridges']]);
    g.flag('route', v); audio.sfx('lever'); g.bars(true);
    if (v === 'tunnel') {
      const fog = st.scene.fog.color.clone(); st.lampDim = .25; st.scene.fog.color.setHex(0x02040a); st.scene.fog.density = .16; st.sky.visible = false; audio.sfx('horn'); audio.loop('wind', true, 1.4);
      await narr('The Nightjar dived into the Whistling Tunnel, and the dark played her like a flute.');
      await narr('Somewhere in the black, something whistled back.');
      st.scene.fog.color.copy(fog); st.scene.fog.density = .0075; st.sky.visible = true; st.lampDim = 1; audio.loop('wind', false);
    } else {
      let k = 0; const tk = st.tick(dt => { k = Math.min(1, k + dt * .5); st.scenery.g.position.y = -46 * kit.smooth(k); st.rails.position.y = 0; });
      audio.loop('wind', true, 1.2);
      await narr('The Spindle Bridges were as thin as pencil lines, and a very long way up. The Nightjar did not look down.');
      await narr('River looked down. Then he decided not to do that again.');
      st.untick(tk); k = 0; const tk2 = st.tick(dt => { k = Math.min(1, k + dt * .7); st.scenery.g.position.y = -46 * (1 - kit.smooth(k)); }); await g.until(() => k >= 1); st.untick(tk2); audio.loop('wind', false);
    }
    g.bars(false);
    await say('Pym', 'The brake is holding. But we are still too quick for the bottom of the pass. And at the bottom is Mirrormere.');
    await say('Ibby', 'The lake.');
    await say('Pym', 'Frozen. Mostly.', { emote: 'shrug' });
    await say('Pym', 'River, take the rail lamp. Wherever you point it, she lays her rails. Keep us off the dark water!', { emote: 'give' });
  });
  await g.fade(1, .6);
  await lake(g);
}

// ---------- Lake Mirrormere ----------
async function lake(g) {
  const { say, narr, audio } = g;
  const st = g.game.newStage(), L = 640, SPEED = 15;
  st.mood({ fog: 0x1a3162, density: .0048, hemi: [0x9ab8f2, 0x23304f, .75], sun: [0xcfe0ff, 1.25, [-10, 18, -6]] });
  st.sky = st.add(kit.makeSky({ aurora: 1.1, moonPos: [300, 120, -90] }));
  const it = kit.T.ice().clone(); it.needsUpdate = true; it.repeat.set(60, 9);
  const lakeM = mesh(G.plane(L + 500, 120), new THREE.MeshStandardMaterial({ map: it, roughness: .16, metalness: .35, color: 0xcfe6ff }), L / 2, 0, 0, st.scene); lakeM.rotation.x = -Math.PI / 2;
  // far shores, pines and the mountains all round
  const r = kit.rng(44), pine = M(0x1d4a45, { rough: 1, flat: true }), snowM = M(0xdfeaf8, { rough: 1, flat: true });
  for (const s of [-1, 1]) { mesh(G.box(L + 500, 3, 80), M(0xc4d6f0, { rough: 1 }), L / 2, .2, s * 100, st.scene); }
  const N = 150, pi = new THREE.InstancedMesh(G.cone(1, 1, 6), pine, N), si = new THREE.InstancedMesh(G.cone(1, 1, 6), snowM, N), o = new THREE.Object3D();
  for (let i = 0; i < N; i++) { const s = 3 + r() * 5, x = -100 + r() * (L + 320), z = (i % 2 ? 1 : -1) * (62 + r() * 30); o.position.set(x, 1.7 + s * 1.2, z); o.scale.set(s, s * 2.6, s); o.updateMatrix(); pi.setMatrixAt(i, o.matrix); o.position.y += s * .9; o.scale.set(s * .55, s * 1.3, s * .55); o.updateMatrix(); si.setMatrixAt(i, o.matrix); }
  st.add(pi, si);
  for (let i = 0; i < 16; i++) { const h = 60 + r() * 80, rad = 50 + r() * 60, p = new THREE.Group(); mesh(G.cone(rad, h, 6), M(0x33487a, { rough: 1, flat: true }), 0, h / 2, 0, p); mesh(G.cone(rad * .42, h * .42, 6), snowM, 0, h * .795, 0, p); p.position.set(-120 + i * 60, -4, (i % 2 ? 1 : -1) * (190 + r() * 60)); st.add(p); }
  // the far bank, where the ice ends
  const bank = mesh(G.sph(1, 20, 10), M(0xdfeaf8, { rough: 1 }), L + 70, -6, 0, st.scene); bank.scale.set(70, 12, 160);
  for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(L + 6, 0, s * 9); st.add(p); mesh(G.cyl(.4, .6, 9, 8), M(C.iron), 0, 4.5, 0, p); mesh(G.sph(1.1, 14, 10), glowMat(C.amber, 2.6), 0, 9.6, 0, p); sprite(C.amber, 12, 0, 9.6, 0, p, .6); }
  st.snow = new kit.Snow({ count: 800, box: [90, 26, 70], wind: [-9, 2], fall: 1.6, size: .2 }); st.snow.offset.set(20, -6, 0); st.add(st.snow.points);
  // the train: engine first, carriages following the path she has taken
  const eng = kit.makeEngine(); st.add(eng); const cars = [0, 1, 2].map(() => st.add(kit.makeCarExterior({})));
  const hist = [];
  const zAt = x => { if (!hist.length || x <= hist[0].x) return hist.length ? hist[0].z : 0; for (let i = hist.length - 1; i > 0; i--) if (hist[i - 1].x <= x) { const a = hist[i - 1], b = hist[i], k = (x - a.x) / Math.max(.0001, b.x - a.x); return lerp(a.z, b.z, clamp(k, 0, 1)); } return hist[0].z; };
  // rails: little glowing sleepers laid along that path
  const RN = 150, railI = new THREE.InstancedMesh(G.box(1.15, .1, .12), new THREE.MeshStandardMaterial({ color: 0xbfefff, emissive: 0x5fd8ff, emissiveIntensity: 2.4 }), RN * 2); railI.frustumCulled = false; st.add(railI);
  const beam = mesh(G.plane(26, 5), new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending }), 0, .06, 0, st.scene); beam.rotation.x = -Math.PI / 2;
  // dark water
  const holes = [], mkHole = (x, z, rad) => {
    const h = new THREE.Group(); h.position.set(x, .03, z); st.add(h);
    mesh(new THREE.CircleGeometry(rad, 9), M(0x08203f, { rough: .08, metal: .5, emissive: 0x06224a, ei: .6 }), 0, 0, 0, h).rotation.x = -Math.PI / 2;
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + r(); const s = mesh(G.cone(rad * .32, .12, 3), M(0xf2f8ff, { rough: .3, flat: true }), Math.cos(a) * rad * 1.02, .05, Math.sin(a) * rad * 1.02, h); s.rotation.y = -a; s.scale.z = .5; const c = mesh(G.box(rad * (1 + r()), .02, .07), M(0x1a3a66, { rough: .3 }), Math.cos(a) * rad * 1.8, .0, Math.sin(a) * rad * 1.8, h); c.rotation.y = -a + (r() - .5) * .5; }
    holes.push({ x, z, r: rad, g: h, hit: false });
  };
  let lastZ = 0;
  for (let x = 70; x < L - 40; x += 27 + r() * 10) {
    const hard = x / L, safe = clamp(lastZ + (r() - .5) * 14, -9, 9); lastZ = safe;
    const n = hard > .6 ? 2 : 1;
    for (let k = 0; k < n; k++) { let z = (r() - .5) * 28; if (Math.abs(z - safe) < 6.5) z = safe + (z > safe ? 1 : -1) * (6.5 + r() * 3); if (Math.abs(z) < 15.5) mkHole(x + k * 6, z, 2.5 + r() * 1.3 + hard); }
  }
  // beacons mark two safe gates, and the journal page waits in the first
  const gates = [210, 420].map(x => { const z = clamp(zSafe(x), -7, 7); for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(x, 0, z + s * 6); st.add(p); mesh(G.cyl(.16, .3, 4, 8), M(C.iron), 0, 2, 0, p); mesh(G.sph(.5, 12, 8), glowMat(C.aurora, 2.6), 0, 4.3, 0, p); sprite(C.aurora, 6, 0, 4.3, 0, p, .55); } return { x, z, passed: false }; });
  function zSafe(x) { let z = 0, best = -1; for (let c = -9; c <= 9; c += 3) { const d = Math.min(...holes.filter(h => Math.abs(h.x - x) < 16).map(h => Math.abs(h.z - c) - h.r), 99); if (d > best) { best = d; z = c; } } return z; }
  const page = g.has('k09') ? null : kit.makeKeepsake('page'); if (page) { page.scale.setScalar(4); page.position.set(gates[0].x, 2.6, gates[0].z); st.add(page); }
  const splash = new kit.Puffs({ count: 160, color: 0xcfefff, size: 1.3, opacity: .8 }); splash.gravity = -12; st.add(splash.points);
  const breath = new kit.Puffs({ count: 100, color: 0xcfefff, size: 1.6, opacity: .4 }); st.add(breath.points);

  let ex = 0, ez = 0, vz = 0, speed = SPEED, ice = 3, check = 0, restarts = 0, done = false, hop = 0, slowT = 0, running = false, bt = 0;
  const place = () => {
    eng.position.set(ex, .85 + hop, ez); eng.rotation.y = -Math.atan2(vz, speed) * .8;
    cars.forEach((c, i) => { const x = ex - 17.8 - i * 17.4, z = zAt(x), z2 = zAt(x + 4); c.position.set(x, .85, z); c.rotation.y = -Math.atan2(z2 - z, 4); });
    const o2 = new THREE.Object3D(); let n = 0;
    for (let i = 0; i < RN; i++) { const x = Math.floor(ex) + 10 - i, z = x > ex ? ez + (x - ex) * vz / speed : zAt(x), z2 = x + 1 > ex ? ez + (x + 1 - ex) * vz / speed : zAt(x + 1); const yaw = -Math.atan2(z2 - z, 1); for (const s of [-1, 1]) { o2.position.set(x, .06, z + s * 1.62); o2.rotation.set(0, yaw, 0); o2.scale.setScalar(i > RN - 30 ? (RN - i) / 30 : 1); o2.updateMatrix(); railI.setMatrixAt(n++, o2.matrix); } }
    railI.instanceMatrix.needsUpdate = true;
    beam.position.set(ex + 22, .07, ez + vz / speed * 22); beam.rotation.z = -Math.atan2(vz, speed);
  };
  const reset = x => { ex = x; ez = clamp(zSafe(x + 20), -8, 8); vz = 0; speed = SPEED; ice = 3; hist.length = 0; for (let i = 80; i >= 0; i--) hist.push({ x: ex - i, z: ez }); for (const h of holes) h.hit = false; place(); };
  reset(0);
  st.cam.mode = 'custom'; st.cam.fov = 46; st.cam.rate = 5;
  st.cam.fn = (p, l) => { p.set(ex - 23, 17, ez * .6); l.set(ex + 15, 0, ez * .9); };
  st.tick((dt, t) => {
    splash.update(dt); breath.update(dt); if (page) { page.userData.spin.rotation.y += dt * 2; page.position.y = 2.6 + Math.sin(t * 2) * .3; }
    for (const w of eng.userData.wheels) w.rotation.z -= dt * speed / .74;
    bt -= dt; if (bt < 0) { bt = .06; breath.emit(ex + 2.4, 6.3, ez, -speed * .7, 2, 0, 2, 1.2); }
    if (!running || g.ui.busy) { place(); return; }
    slowT -= dt; speed = damp(speed, slowT > 0 ? 7 : SPEED, 2.5, dt); hop = damp(hop, 0, 6, dt);
    vz = damp(vz, g.input.mx * 11, 4.5, dt); ez = clamp(ez + vz * dt, -16.5, 16.5); if (Math.abs(ez) >= 16.5) vz = 0;
    ex += speed * dt; hist.push({ x: ex, z: ez }); if (hist.length > 900) hist.splice(0, 300);
    for (const h of holes) if (!h.hit && Math.hypot(h.x - ex - 4, h.z - ez) < h.r * (.9 - restarts * .08)) {
      h.hit = true; ice--; slowT = 1.1; hop = .7; audio.sfx('crack'); g.shake(.5); splash.burst(60, h.x, .4, h.z, 9, 1.2); g.meter('Ice holding', ice / 3);
      g.big(ice > 0 ? ['Crack!', 'Splash!'][ice % 2] : 'Whoa!', 1);
    }
    for (const gt of gates) if (!gt.passed && ex > gt.x) { gt.passed = true; check = gt.x - 12; if (Math.abs(ez - gt.z) < 6) { audio.sfx('chime'); g.big('Through the beacons!', 1.2); } }
    if (page && Math.hypot(page.position.x - ex - 2, page.position.z - ez) < 5) { st.scene.remove(page); g.collect('k09'); page.position.x = -9999; }
    if (ice <= 0 && !st.restarting) { st.restarting = true; running = false; restart(); }
    if (ex > L - 8) { done = true; running = false; }
    place();
  });
  async function restart() {
    restarts++; g.ui.fade(1, .35); await g.wait(.5); reset(check); g.meter('Ice holding', 1);
    g.ui.fade(0, .5); await g.wait(.3);
    g.bark({ pos: eng.position, height: 5, talking: 0 }, ['Snow anchor! Let us try that bit again.', 'She has backed up. Have another go!', 'Easy does it. Wide turns!'][restarts % 3], 2.6);
    st.restarting = false; running = true;
  }
  st.dbg = { holes, win: () => { ex = L - 10; hist.push({ x: ex, z: ez }); }, state: () => ({ ex, ez, ice, restarts }) };
  g.spawnRiver(-999, 0).g.visible = false;
  g.goal('Steer the rail lamp left and right. Stay off the dark water!'); g.meter('Ice holding', 1);
  g.audio.loop('train', true, 1); g.audio.loop('wind', true, .8);
  await g.fade(0, .8);
  await narr('Mirrormere. A whole lake, frozen clear as a window, and the Nightjar came sliding out onto it with her brakes screaming.');
  g.toast('Steer left and right.', 'The light in front of the engine shows where the rails will go.', 5);
  running = true;
  await g.until(() => done);
  g.meter(null); g.goal(null); g.bars(true); audio.sfx('horn');
  let k = 0; const fx = ex; st.cam.mode = 'cine';
  const tk = st.tick(dt => { k = Math.min(1, k + dt / 5); ex = fx + (1 - Math.pow(1 - k, 2)) * 34; vz = damp(vz, 0, 3, dt); hist.push({ x: ex, z: ez }); place(); });
  st.cam.pos.copy(g.game.camPos); st.cam.look.copy(g.game.camLook);
  await g.shot({ pos: [L + 30, 5, ez + 24], look: [L + 4, 3, ez], dur: 3.2, fov: 42 });
  await narr('With one last groan from the ice, the Nightjar hauled herself up onto the snowy bank, and the lake went quiet behind her.');
  await g.until(() => k >= 1); st.untick(tk);
  await say('Pym', 'And THAT is why we carry a rail lamp!');
  await say('Ibby', 'Well steered, River. I have seen grown Wayfinders do worse.');
  await narr("On River's waymark, a second feather of frost curled out beside the first.");
  await narr('Then, from somewhere back along the train, came a very small wail.');
  await say('Bo', 'ADMIRAL!');
  await g.fade(1, .8);
}
