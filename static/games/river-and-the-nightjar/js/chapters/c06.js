// Chapter Six: The Lost Way. River and Wren find their way forward through the works under the train.
import { kit, CAST, trainStage, lightPool, talk, look } from './common.js';
const { THREE, M, G, mesh, C, sprite, glowMat, damp, lerp, clamp } = kit;

function kilnCat() {
  const g = new THREE.Group(), fur = M(0xd98a3c, { rough: 1 }), dark = M(0x8a4a22, { rough: 1 });
  const body = mesh(G.sph(.7, 16, 12), fur, 0, .5, 0, g); body.scale.set(1.5, .75, 1);
  const head = new THREE.Group(); head.position.set(.95, .5, .25); g.add(head); mesh(G.sph(.42, 14, 10), fur, 0, 0, 0, head);
  const ears = [-1, 1].map(s => { const e = mesh(G.cone(.16, .3, 4), dark, -.05, .38, s * .22, head); return e; });
  const eyes = [-1, 1].map(s => mesh(G.sph(.06, 8, 6), glowMat(C.aurora, 2), .34, .06, s * .15, head)); eyes.forEach(e => e.scale.y = .1);
  mesh(G.sph(.05, 6, 5), M(0xe07a7a), .41, -.05, 0, head);
  const tail = new THREE.Group(); tail.position.set(-.9, .3, .2); g.add(tail); for (let i = 0; i < 6; i++) mesh(G.sph(.17 - i * .012, 8, 6), i % 2 ? dark : fur, -i * .2, 0, Math.sin(i * .6) * .25 + i * .1, tail);
  for (let i = 0; i < 3; i++) mesh(G.box(.5, .02, .12), dark, -.3 + i * .4, .98, 0, g);
  g.userData = { head, ears, eyes, tail, body }; return g;
}

function underworks(g) {
  const st = g.game.newStage(), LEN = 50;
  st.mood({ fog: 0x081a20, density: .022, hemi: [0x6fb0b0, 0x0a1014, .34], bg: 0x05090c, env: .35 });
  mesh(G.box(LEN, .24, 4.2), M(0x1c2830, { metal: .5, rough: .55 }), LEN / 2, -.12, 0, st.scene);
  mesh(G.box(LEN, .03, 1.5), M(0x34444e, { metal: .5, rough: .5 }), LEN / 2, .015, .95, st.scene);
  for (let x = .5; x < LEN; x += 1) mesh(G.box(.06, .035, 1.5), M(0x202c34, { metal: .5 }), x, .02, .95, st.scene);
  mesh(G.box(LEN, 3.3, .14), M(0x15343a, { metal: .3, rough: .6 }), LEN / 2, 1.65, -2.1, st.scene);
  mesh(G.box(LEN, .16, 4.3), M(0x0e181c, { rough: .9 }), LEN / 2, 3.3, 0, st.scene);
  mesh(G.box(LEN, .5, 4.0), M(0x070b0e), LEN / 2, -.5, 0, st.scene);
  for (const [y, c, r] of [[.35, C.copper, .07], [.62, C.brass, .05], [2.72, C.copper, .09], [2.98, 0x3a4a56, .12]]) mesh(G.cyl(r, r, LEN, 8), M(c, { metal: .7, rough: .35 }), LEN / 2, y, -1.9, st.scene).rotation.z = Math.PI / 2;
  for (let x = 2; x < LEN; x += 4) mesh(G.box(.16, 3.3, .2), M(0x0f262b, { metal: .4, rough: .5 }), x, 1.65, -2.0, st.scene);
  mesh(G.box(.2, 3.3, 4.2), M(0x15343a, { metal: .3, rough: .6 }), 0, 1.65, 0, st.scene); mesh(G.box(.2, 3.3, 4.2), M(0x15343a, { metal: .3, rough: .6 }), LEN, 1.65, 0, st.scene);
  // tanks of stored northern light, and caged work lamps
  const src = [];
  for (let x = 3; x < LEN; x += 7.5) { if (x > 22 && x < 33) continue; const t = new THREE.Group(); t.position.set(x, 0, -1.5); st.add(t); mesh(G.cyl(.42, .42, 1.7, 16), new THREE.MeshStandardMaterial({ color: 0x0a3a2e, emissive: C.aurora, emissiveIntensity: .8, transparent: true, opacity: .85 }), 0, 1.5, 0, t); for (const y of [.6, 2.4]) mesh(G.cyl(.47, .47, .12, 16), M(C.brass, { metal: .8, rough: .3 }), 0, y, 0, t); mesh(G.cyl(.3, .4, .55, 12), M(C.iron), 0, .28, 0, t); sprite(C.aurora, 2.6, 0, 1.5, .3, t, .35); src.push({ x, y: 1.6, z: -.6, color: C.aurora, power: 5 }); }
  for (let x = 6.5; x < LEN; x += 7.5) { kit.lantern(st.scene, x, 3.05, .4, { light: 0, size: .13 }); src.push({ x, y: 2.6, z: .5, color: C.amber, power: 9 }); }
  lightPool(g, src, 4, 9);
  // ladder down from Car Nought
  for (const s of [-1, 1]) mesh(G.cyl(.03, .03, 3.3, 6), M(C.brass, { metal: .7, rough: .3 }), 1.0 + s * .28, 1.65, -.2, st.scene); for (let i = 0; i < 9; i++) mesh(G.cyl(.022, .022, .56, 6), M(C.brass, { metal: .7, rough: .3 }), 1.0, .3 + i * .36, -.2, st.scene).rotation.z = Math.PI / 2;
  st.cam.minX = 4.2; st.cam.maxX = LEN - 4.2; st.sway = .004; st.shake = 0;
  g.audio.loop('train', true, 1); g.audio.loop('steam', true, .6);
  return { st, LEN };
}

export default async function chapter6(g) {
  const { say, narr, choose, wait, audio } = g;
  let { st, LEN } = underworks(g);
  let river = g.spawnRiver(1.6, .9, Math.PI / 2);
  const admiral = kit.makeWalrus(); river.hand(0).add(admiral); admiral.position.set(0, -.05, .12);
  const wren = st.actor(CAST.wren(), .9, 0, 1.3, Math.PI / 2);
  st.area(.6, 20.6, .15, 1.75); st.area(6.45, 7.55, -1.3, .2);
  const steam = new kit.Puffs({ count: 220, color: 0xeaf6ff, size: .7, opacity: .5, additive: false }); steam.drag = 1.2; st.add(steam.points);
  const sparks = new kit.Puffs({ count: 120, color: 0xbfefff, size: .3, opacity: .95 }); st.add(sparks.points);

  // ----- 1: steam vents -----
  const vents = [4, 7, 10].map((x, i) => { mesh(G.cyl(.16, .22, .3, 10), M(C.copper, { metal: .7, rough: .3 }), x, 1.0, -1.9, st.scene).rotation.x = Math.PI / 2; mesh(G.torus(.2, .04, 12), M(C.brass, { metal: .7 }), x, 1.0, -1.74, st.scene); return { x, t: i * 1.3, on: false, warn: false }; });
  g.keepsake('k13', 7, 1.0, -1.0, { r: .8 });
  let hotT = 0, lastX = river.pos.x;
  st.tick(dt => {
    steam.update(dt); sparks.update(dt); hotT -= dt;
    for (const v of vents) {
      v.t = (v.t + dt) % 4.2; v.warn = v.t > 1.9 && v.t < 2.5; v.on = v.t >= 2.5 && v.t < 3.9;
      if (v.warn && Math.random() < dt * 12) steam.emit(v.x, 1.0, -1.6, 0, .2, .6, .4, .2);
      if (v.on) for (let i = 0; i < 2; i++) steam.emit(v.x, 1.0, -1.6, 0, .3, 4.4, .9, .5);
      if (v.t >= 2.5 && v.t - dt < 2.5 && Math.abs(v.x - river.pos.x) < 9) audio.sfx('steam');
      if (v.on && hotT <= 0 && Math.abs(river.pos.x - v.x) < .62 && st.control && !g.ui.busy && !g.game.locked) { hotT = .8; const side = lastX <= v.x ? -1 : 1; river.pos.x = v.x + side * 1.4; river.pos.z = Math.max(.3, river.pos.z); river.do('jump', .5); audio.sfx('oops'); g.bark(river, ['Hot! Hot!', 'Yeowch!', 'Wait for it...'][Math.floor(Math.random() * 3)], 1.4); }
    }
    if (Math.abs(river.pos.x - lastX) > .01 && !vents.some(v => Math.abs(river.pos.x - v.x) < .62)) lastX = river.pos.x;
  });

  // ----- 2: three levers and a gate -----
  const want = [1, 0, 1], lev = [14, 16.5, 19].map((x, i) => {
    const l = kit.lever([0xd9442a, 0xf0c330, 0x2a8f8a][i]); l.scale.setScalar(1.5); l.position.set(x, 0, -.5); st.add(l); st.block(x, -.5, .5);
    const lamp = mesh(G.sph(.14, 12, 8), new THREE.MeshStandardMaterial({ color: 0x33291a, emissive: C.amber, emissiveIntensity: 0 }), x, 2.2, -1.95, st.scene);
    const o = { l, lamp, on: 0 }; st.tick(dt => l.userData.update(dt));
    st.item({ x, z: .25, y: 1.9, pz: -.5, r: 1.1, label: 'Pull the lever', on: () => !gateOpen, use: async () => { o.on = o.on ? 0 : 1; l.userData.set(!!o.on); lamp.material.emissiveIntensity = o.on ? 2.4 : 0; audio.sfx('lever'); check(); } });
    return o;
  });
  const plate = new THREE.Group(); plate.position.set(20.2, 2.55, -1.95); st.add(plate); mesh(G.rbox(1.5, .5, .06, .05), M(0xf6ecd8), 0, 0, 0, plate);
  want.forEach((w, i) => mesh(G.cyl(.14, .14, .04, 14), new THREE.MeshStandardMaterial({ color: w ? 0xffd08a : 0x2a3340, emissive: w ? C.amber : 0, emissiveIntensity: w ? 1.6 : 0 }), -.45 + i * .45, 0, .04, plate).rotation.x = Math.PI / 2);
  const gate = new THREE.Group(); gate.position.set(20.9, 0, .95); st.add(gate); for (let i = 0; i < 6; i++) mesh(G.cyl(.05, .05, 3.2, 8), M(C.brass, { metal: .8, rough: .3 }), 0, 1.6, -.7 + i * .28, gate); mesh(G.box(.14, .14, 1.7), M(C.iron), 0, 2.4, 0, gate); mesh(G.box(.14, .14, 1.7), M(C.iron), 0, .5, 0, gate);
  let gateOpen = false, gateY = 0; st.tick(dt => { gateY = damp(gateY, gateOpen ? 3.0 : 0, 3, dt); gate.position.y = gateY; });
  const check = () => { if (!gateOpen && lev.every((o, i) => o.on === want[i])) { gateOpen = true; audio.sfx('clank'); audio.sfx('good'); g.shake(.08); st.area(20.5, 33.2, .15, 1.75); g.bark(wren, 'That is it.', 2); g.goal('Find a way to wake the machinery'); } };

  // ----- 3: the gear wall -----
  const axles = [{ x: 25, y: 1.5, r: .42, name: 'small' }, { x: 27.3, y: 1.85, r: 1.0, name: 'big' }, { x: 29.9, y: 1.45, r: .68, name: 'middle' }];
  mesh(G.box(8.4, 2.9, .1), M(0x0f262b, { metal: .4, rough: .5 }), 27.4, 1.55, -1.98, st.scene);
  for (const a of axles) { mesh(G.cyl(a.r * 1.12, a.r * 1.12, .02, 28), M(0x071318, { rough: 1 }), a.x, a.y, -1.9, st.scene).rotation.x = Math.PI / 2; mesh(G.cyl(.08, .08, .5, 10), M(C.iron, { metal: .7, rough: .3 }), a.x, a.y, -1.7, st.scene).rotation.x = Math.PI / 2; }
  const loose = { small: kit.gear(.42, 8, .12, 0xc9783f), middle: kit.gear(.68, 10, .12, 0xd9a441), big: kit.gear(1.0, 14, .12, 0x9fb0b8) };
  loose.small.position.set(22.6, .46, -1.2); loose.middle.position.set(23.5, .72, -1.5); loose.big.position.set(31.6, 1.05, -1.6); for (const k in loose) { loose[k].rotation.set(-.25, k === 'big' ? -.3 : .3, 0); st.add(loose[k]); }
  const fixedGears = [mesh(G.box(.01, .01, .01), M(0), 0, 0, 0, st.scene)]; const spin = [];
  for (const [x, y, r, t] of [[24.0, 2.55, .5, 8], [31.3, 2.5, .55, 9], [28.65, .75, .45, 8]]) { const gg = kit.gear(r, t, .12, 0x6f8088); gg.position.set(x, y, -1.82); st.add(gg); spin.push({ g: gg, s: (spin.length % 2 ? 1 : -1) / r }); }
  let gearsDone = false, fitted = 0; st.tick(dt => { if (gearsDone) for (const s of spin) s.g.rotation.z += dt * s.s * 1.4; });
  const k14 = g.keepsake('k14', 31.6, 1.0, .9, { hidden: true });
  st.item({ x: 27.4, z: .3, y: 3.2, pz: -1.9, r: 2.6, label: 'Fit the loose gears', on: () => gateOpen && !gearsDone, use: async g => {
    const hint = { small: 'no bigger than a saucer', big: 'as wide as a cart wheel', middle: 'about the size of a dinner plate' };
    while (fitted < 3) {
      const a = axles[fitted];
      const v = await choose('River', `Axle ${['one', 'two', 'three'][fitted]} has a round shadow behind it, ${hint[a.name]}. Which gear goes here?`, [['The small copper gear', 'small'], ['The middle brass gear', 'middle'], ['The big silver gear', 'big']].filter(o => loose[o[1]].parent === st.scene && !loose[o[1]].userData.fit));
      if (v === a.name) { const gg = loose[v]; gg.userData.fit = true; gg.position.set(a.x, a.y, -1.78); gg.rotation.set(0, 0, 0); spin.push({ g: gg, s: (fitted % 2 ? -1 : 1) / a.r }); fitted++; audio.sfx('clank'); g.shake(.06); sparks.burst(14, a.x, a.y, -1.4, 2, .5); }
      else { audio.sfx('oops'); await narr(v === 'big' ? 'Far too big. It would not even go on.' : 'It slid on, rattled round once, and fell off again. Clang.'); await say('Wren', 'Match the gear to its shadow.', { keep: true }); }
    }
    gearsDone = true; audio.sfx('rumble', { rise: .5, len: 3 }); audio.sfx('good'); st.hemi.intensity = .55;
    await narr('The last gear bit. One by one the others began to turn, and somewhere above, the Nightjar\'s heartbeat steadied.');
    g.reveal(k14); st.area(33.1, 45.6, .15, 1.75); g.goal('Tiptoe past whatever is purring');
  } });

  // ----- a little stealth: Ember the kiln cat is asleep across the walkway -----
  const cat = kilnCat(); cat.position.set(35.6, 0, -.55); cat.scale.setScalar(1.25); st.add(cat);
  let noise = 0, catAwake = 0, catPassed = false, catTold = false, wakes = 0;
  st.tick((dt, t) => {
    const u = cat.userData; u.body.scale.y = .75 + Math.sin(t * 1.6) * .03; u.tail.rotation.y = Math.sin(t * (catAwake > 0 ? 6 : .9)) * .25; u.eyes.forEach(e => e.scale.y = damp(e.scale.y, catAwake > 0 ? 1 : .1, 8, dt)); u.head.position.y = damp(u.head.position.y, catAwake > 0 ? .9 : .5, 5, dt);
    const tip = g.input.h.duck; st.speed = tip ? 1.3 : 3.1;
    river.pose = tip && river.speed > .1 && st.control ? 'crouch' : river.pose === 'crouch' ? 'stand' : river.pose;
    if (!gearsDone || catPassed || !st.control || g.ui.busy || g.game.locked) { if (catPassed || !gearsDone) g.meter(null); return; }
    const x = river.pos.x; if (catAwake > 0) { catAwake -= dt; return; }
    if (x > 33.4 && x < 38.2) {
      if (!catTold) { catTold = true; g.toast('Shh. Hold Duck to tiptoe.', 'Keyboard: Shift. Controller: B.', 6); g.ui.action(true); }
      noise = clamp(noise + (river.speed > 1.6 ? dt * 1.1 : -dt * .5), 0, 1); g.meter('Shh...', noise);
      u.ears.forEach((e, i) => e.rotation.x = Math.sin(t * 20 + i) * noise * .4);
      if (noise >= 1) { noise = 0; catAwake = 2.6; wakes++; audio.sfx('woof'); g.shake(.08); river.pos.x = 33.0; g.bark({ pos: cat.position, height: 1.8, talking: 0 }, 'Mrrrrrow?', 2.2); g.bark(river, wakes > 2 ? 'She has put her paws over her ears.' : 'Sorry! Sorry. Go back to sleep.', 2.6); if (wakes > 2) { catPassed = true; g.ui.action(false); g.meter(null); g.goal('Mend the rail spool'); } }
    } else { noise = 0; g.meter(null); if (x >= 38.2) { catPassed = true; g.ui.action(false); g.goal('Mend the rail spool'); audio.sfx('good'); } }
  });

  // ----- 4: the rail spool takes two -----
  const sx = 41, spool = new THREE.Group(); spool.position.set(sx, 1.35, -1.1); st.add(spool);
  const drum = mesh(G.cyl(.85, .85, 1.5, 24), new THREE.MeshStandardMaterial({ color: 0xbfefff, emissive: 0x5fd8ff, emissiveIntensity: .25, roughness: .3 }), 0, 0, 0, spool); drum.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) mesh(G.cyl(1.05, 1.05, .08, 24), M(C.brass, { metal: .8, rough: .3 }), 0, 0, s * .78, spool).rotation.x = Math.PI / 2;
  mesh(G.box(.3, 1.4, 1.9), M(C.iron, { metal: .5 }), sx, .5, -1.1, st.scene);
  const tl = kit.lever(0x2a8f8a); tl.scale.setScalar(1.8); tl.position.set(38.4, 0, -.5); st.add(tl); st.tick(dt => tl.userData.update(dt)); st.block(38.4, -.5, .5);
  const crank = new THREE.Group(); crank.position.set(43.6, 1.15, -.55); st.add(crank); mesh(G.torus(.42, .05, 20), M(C.copper, { metal: .7, rough: .3 }), 0, 0, 0, crank); for (let i = 0; i < 3; i++) mesh(G.box(.84, .05, .05), M(C.copper, { metal: .7 }), 0, 0, 0, crank).rotation.z = i * Math.PI / 3; mesh(G.cyl(.05, .05, .25, 8), M(0xf6ecd8), .42, 0, .14, crank).rotation.x = Math.PI / 2;
  mesh(G.cyl(.08, .1, 1.15, 8), M(C.iron), 43.6, .57, -.7, st.scene); st.block(43.6, -.6, .45);
  let holding = false, wound = 0, spoolDone = false;
  st.tick(dt => { spool.rotation.z -= dt * (spoolDone ? 5 : wound * 3); drum.material.emissiveIntensity = .25 + (spoolDone ? 2.2 : wound * 1.4); });
  st.item({ x: 43.6, z: .3, y: 2.2, pz: -.55, r: 1.2, label: 'Turn the crank', on: () => catPassed && !spoolDone, use: async g => {
    if (!holding) { audio.sfx('oops'); await narr('The crank spins free. The belt just slips. Somebody has to hold the tension lever at the same time.'); return; }
    g.toast('Hold the button down to wind.', '', 3);
    const tk = st.tick(dt => { wound = clamp(wound + (g.input.h.act || g.ui.auto ? dt / 3.4 : -dt * .35), 0, 1); crank.rotation.z -= dt * wound * 9; g.meter('Winding the spool', wound); if (Math.random() < wound * dt * 30) sparks.emit(sx, 1.4, -.2, (Math.random() - .5) * 3, 2, 1.5, .6, 1); });
    await g.until(() => wound >= 1); st.untick(tk); g.meter(null); spoolDone = true; audio.sfx('star'); g.shake(.08); st.hemi.intensity = .75; wren.pose = 'stand'; wren.busy = false; wren.do('cheer', 1.6);
    await narr('The spool caught, and sang. Up above, new rails of light went pouring out ahead of the engine.');
    await say('Wren', 'There is a door. I did not draw that one. It is new.', { emote: 'point' });
    g.goal('Go through the door');
  } });
  const exit = mesh(G.box(.12, 2.3, 1.5), M(0x24505a, { metal: .3, rough: .5 }), LEN - .12, 1.15, .9, st.scene); mesh(G.cyl(.22, .22, .14, 14), M(0x9fe6ff, { emissive: 0x5fd8ff, ei: 1.2 }), LEN - .2, 1.7, .9, st.scene).rotation.z = Math.PI / 2;
  let out = false;
  st.item({ x: 45.2, z: .9, y: 2.6, pz: .9, r: 1.2, label: 'Go through the door', on: () => spoolDone, use: async () => { out = true; } });

  // Wren keeps close, and helps when asked
  const wItem = st.item({ x: 0, z: 0, y: 1.7, r: 1.2, label: 'Talk to Wren', use: async g => {
    if (catPassed && !spoolDone && !holding) {
      await say('River', 'Wren, can you hold that lever down while I turn the crank?');
      await say('Wren', 'Yes.', { emote: 'nod' });
      wren.busy = true; await g.walk(wren, 38.4, .25, 2.6, Math.PI); wren.pose = 'hold'; tl.userData.set(true); audio.sfx('lever'); holding = true;
      g.bark(wren, 'Holding.', 2);
    } else if (!gateOpen) { await narr('Wren holds up her notebook. Three little circles: one coloured in, one empty, one coloured in.'); await say('Wren', 'Up. Down. Up. It is on the plate by the gate, too.'); }
    else if (!gearsDone) await say('Wren', 'Every axle has a shadow. The shadow is the size of the gear that is missing.');
    else if (!catPassed) await say('Wren', 'That is the kiln cat. She keeps the mice out of the light. Do not run.');
    else await say('Wren', spoolDone ? 'I can hear the others. They are close.' : 'I am holding it.');
  } });
  st.tick(dt => {
    wItem.x = wren.pos.x; wItem.z = wren.pos.z + .5; wItem.pz = wren.pos.z; wItem.on = !wren.busy || holding;
    if (wren.busy) return;
    const ahead = st.inside(river.pos.x - 1.3, .5) ? river.pos.x - 1.3 : wren.pos.x, tx = Math.min(ahead, catPassed ? 99 : (gearsDone ? 33 : 99)), dx = tx - wren.pos.x, dz = (river.pos.z > .9 ? .45 : 1.45) - wren.pos.z, d = Math.hypot(dx, dz);
    if (d > .5) { const s = Math.min(2.9, d * 2.4) * dt; wren.pos.x += dx / d * s; wren.pos.z += dz / d * s; wren.speed = 2.4; wren.targetYaw = Math.atan2(dx, dz); } else { wren.speed = 0; wren.lookAt(river.pos.x, river.pos.z); }
  });
  st.dbg = { skip: n => { if (n >= 1) { lev.forEach((o, i) => { o.on = want[i]; }); check(); } if (n >= 2) { gearsDone = true; st.area(33.1, 45.6, .15, 1.75); } if (n >= 3) catPassed = true; if (n >= 4) { spoolDone = true; } } };

  await g.open();
  await narr('Under Car Nought it was warm, and green, and it hummed. This was where the Nightjar kept her insides.');
  await say('Wren', 'The others are that way. Forward. I can hear Mari counting.');
  g.goal('Get past the steam vents'); g.control(true);
  g.toast('Watch the vents puff, then go.', '', 4);
  await g.until(() => river.pos.x > 11.6); g.goal('Open the gate. Ask Wren if you get stuck');
  await g.until(() => out);
  await g.fade(1, .7);

  // ---------- over the tender ----------
  st = g.game.newStage();
  st.mood({ fog: 0x16295a, density: .006, hemi: [0x86a4e6, 0x1a1c2c, .6], sun: [0xaec8ff, 1.1, [6, 14, 12]] });
  st.sky = st.add(kit.makeSky({ aurora: 1.8 }));
  const sc = new kit.Scenery({ speed: 20, groundY: 0, kind: 'mountain', near: -9, trees: 120 }); st.add(sc.g); st.tick(dt => sc.update(dt));
  st.add(kit.makeLightRails(600, .05, 0, 1.62));
  st.snow = new kit.Snow({ count: 800, box: [60, 20, 30], wind: [-16, 0], fall: 1.2, size: .14 }); st.snow.offset.set(0, -4, -8); st.add(st.snow.points);
  const back = kit.makeCarExterior({}); back.position.set(-17, .85, 0); st.add(back); const eng = kit.makeEngine(); eng.position.set(18.2, .85, 0); st.add(eng);
  // the tender: an open hopper of glowing star-coal
  const tender = new THREE.Group(); tender.position.set(0, .85, 0); st.add(tender);
  mesh(G.rbox(15, 2.5, 3.9, .3), M(C.tealDeep, { rough: .45, metal: .25 }), 0, 1.25, 0, tender); for (const s of [-1, 1]) mesh(G.box(15, .1, .08), M(C.copper, { metal: .6, rough: .35 }), 0, 2.5, s * 1.96, tender);
  const rr = kit.rng(12); for (let i = 0; i < 70; i++) { const c = mesh(new THREE.IcosahedronGeometry(.35 + rr() * .35, 0), new THREE.MeshStandardMaterial({ color: 0x0a3a2e, emissive: [C.aurora, 0x4aa8ff, 0x8f7bff][i % 3], emissiveIntensity: 1 + rr() * 1.4, flatShading: true }), -6.6 + rr() * 13.2, 2.55 + rr() * .5, -1.2 + rr() * 2.0, tender); c.rotation.set(rr() * 3, rr() * 3, 0); }
  mesh(G.box(15, .08, .7), M(0x4a3626, { rough: .9 }), 0, 2.62, 1.55, tender);
  const gl = new THREE.PointLight(C.aurora, 30, 16, 1.6); gl.position.set(0, 5, .5); st.add(gl);
  for (const w of [-5.5, -3.8, 3.8, 5.5]) mesh(G.cyl(.46, .46, .2, 18), M(0x1b2230, { metal: .5 }), w, -.5, 1.55, tender).rotation.x = Math.PI / 2;
  river = g.spawnRiver(-6.5, 1.55, Math.PI / 2, 3.5); river.noFloor = true; river.hand(0).add(admiral);
  const wren2 = st.actor(CAST.wren(), -7.6, 3.5, 1.55, Math.PI / 2); wren2.noFloor = true;
  st.cam.mode = 'cine'; st.cam.pos.set(-3, 5.2, 15); st.cam.look.set(1, 4, 0); st.cam.fovNow = 44; g.bars(true); audio.loop('steam', false); audio.loop('wind', true, 1);
  g.walk(river, 6.5, 1.55, 1.7).catch(() => { }); g.walk(wren2, 5.4, 1.55, 1.7).catch(() => { });
  await g.fade(0, .8);
  g.shot({ pos: [6, 4.6, 12], look: [3, 4.2, 0], dur: 7, fov: 40 }).catch(() => { });
  await narr('The door opened onto the night. Between them and the others lay the tender, heaped with star-coal, every lump of it glowing like a piece of the sky.');
  await narr('They crossed it on a plank no wider than a bookshelf. Neither of them said one word until the other side.');
  await g.fade(1, .7);

  // ---------- together again ----------
  st = g.game.newStage();
  const [A] = trainStage(g, { cars: [{ doors: [true, true] }], sky: { aurora: 1.6 } });
  river = g.spawnRiver(A.x0 + 1.6, .9, Math.PI / 2); river.hand(0).add(admiral);
  const wren3 = st.actor(CAST.wren(), A.x0 + .8, 0, 1.3, Math.PI / 2);
  const bo = st.actor(CAST.bo(), A.x0 + 6.2, 0, .9, -Math.PI / 2), mari = st.actor(CAST.mari(), A.x0 + 7.6, 0, 1.4, -Math.PI / 2), tavi = st.actor(CAST.tavi(), A.x0 + 8.6, 0, .5, -Math.PI / 2), dex = st.actor(CAST.dex(), A.x0 + 10, 0, 1.2, -Math.PI / 2);
  const ibby = st.actor(CAST.ibby(), A.x1 - 1.2, 0, .9, -Math.PI / 2);
  st.cam.minX = A.x0 + 5; g.bars(false); audio.loop('wind', false);
  await g.fade(0, .8);
  bo.do('jump', 1.5); await g.walk(bo, A.x0 + 2.8, .9, 3.6);
  await say('Bo', 'ADMIRAL! You found him! You went in the dark and you found him!', { emote: 'cheer' });
  river.hand(0).remove(admiral); bo.hand(0).add(admiral); audio.sfx('pick'); bo.smile = true;
  await say('River', 'He was very brave. He only slid by accident.', { emote: 'give' });
  await say('Bo', 'Admiral says you keep promises. He is going to tell the other walruses.');
  await say('Mari', 'Eleven minutes. You two were gone for eleven minutes. I counted every one of them twice.', { emote: 'point' });
  await say('Tavi', 'You were UNDER the train? What does she run on? Is it gears? Please say it is gears.', { emote: 'jump' });
  await say('Wren', 'Light. And gears.');
  await say('Dex', 'So where were you, really?');
  await say('River', 'In the oldest carriage. There was a man in there. I think.');
  await say('Dex', 'You think?', { emote: 'shrug' });
  await say('River', g.flags.trustVesper ? 'I am keeping the question. He said that was allowed.' : 'I have not decided yet. I am allowed to not decide yet.');
  await narr("On River's waymark the frost had grown again. Three feathers now, leaning together, nearly a shape.");
  await g.walk(ibby, A.x0 + 12.5, .9, 2.4);
  await say('Ibby', 'All six of you, and one walrus. Good. Now. Everybody to the windows.', { emote: 'point' });
  st.sky.userData.aurora.uniforms.k.value = 3; st.lampDim = .4;
  await narr('Far ahead, where the mountains closed in a ring, the whole sky was lit from underneath, warm and gold, as if somebody had left a door open in the snow.');
  await say('Ibby', 'Kindlewick.');
  await g.fade(1, 1);
}
