// Chapter Two: The Waymark. Bo's waymark blows out through the roof, and River goes after it.
import { kit, CAST, trainStage, talk } from './common.js';
import { seatFriends } from './c01.js';
const { THREE, M, G, mesh, C, sprite, glowMat, damp, lerp, clamp } = kit;

function gather(g) {
  const st = g.stage;
  const cars = trainStage(g, { cars: [{ doors: [false, true] }, { doors: [true, false] }] });
  const B = cars[1], x1 = B.x1;
  const river = g.spawnRiver(x1 - 9.6, .9, Math.PI / 2);
  const f = {};
  const spots = { tavi: [x1 - 8.2, 1.45], wren: [x1 - 7.2, .45], mari: [x1 - 6.2, 1.4], bo: [x1 - 5.2, .6], dex: [x1 - 10.8, 1.3] };
  for (const n in spots) f[n] = st.actor(CAST[n](), spots[n][0], 0, spots[n][1], n === 'dex' ? Math.PI / 2 : Math.PI / 2 * .7);
  const ibby = f.ibby = st.actor(CAST.ibby(), x1 - 3.2, 0, .9, -Math.PI / 2);
  // the roof hatch and its ladder
  const hx = x1 - 4.2, hatch = new THREE.Group(); hatch.position.set(hx, 3.0, .9); st.add(hatch);
  const lid = mesh(G.box(1.1, .08, 1.1), M(C.tealDark, { rough: .5 }), .55, 0, 0, new THREE.Group()); hatch.add(lid.parent); lid.parent.position.x = -.55; mesh(G.torus(.12, .025, 12), M(C.brass, { metal: .7 }), .55, -.07, 0, lid.parent).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) mesh(G.cyl(.03, .03, 3.0, 6), M(C.brass, { metal: .7, rough: .3 }), hx + s * .28, 1.5, -.12, st.scene);
  for (let i = 0; i < 8; i++) mesh(G.cyl(.022, .022, .56, 6), M(C.brass, { metal: .7, rough: .3 }), hx, .35 + i * .36, -.12, st.scene).rotation.z = Math.PI / 2;
  st.cam.minX = B.x0 + 4.2;
  return { st, cars, B, f, ibby, river, hx, lid: lid.parent };
}

// ---------- on the roof ----------
function roof(g) {
  const st = g.game.newStage(), RY = 4.61, SP = 17.4;
  st.mood({ fog: 0x16295a, density: .0065, hemi: [0x86a4e6, 0x1a1c2c, .62], sun: [0xaec8ff, 1.15, [6, 14, 12]] });
  st.sky = st.add(kit.makeSky({ aurora: 1.6 }));
  const sc = new kit.Scenery({ speed: 22, groundY: 0, kind: 'mountain', near: -9, trees: 130 }); st.add(sc.g); st.tick(dt => sc.update(dt));
  st.add(kit.makeLightRails(600, .05, 0, 1.62));
  st.snow = new kit.Snow({ count: 900, box: [60, 20, 30], wind: [-17, 0], fall: 1.2, size: .14 }); st.snow.offset.set(0, -4, -8); st.add(st.snow.points);
  const cars = [];
  for (let i = -1; i < 5; i++) { const c = kit.makeCarExterior({}); c.position.set(i * SP, .85, 0); st.add(c); if (i >= 0) cars.push({ cx: i * SP, x0: i * SP - 7.6, x1: i * SP + 7.6 }); }
  const eng = kit.makeEngine(); eng.position.set(4 * SP + 17.8, .85, 0); st.add(eng);
  // roof furniture
  const vents = [], ice = [], vanes = [];
  const vent = x => { const v = new THREE.Group(); v.position.set(x, RY, 0); st.add(v); mesh(G.rbox(.9, .5, .9, .08), M(0x26303f, { metal: .4, rough: .5 }), 0, .25, 0, v); mesh(G.box(.94, .08, .94), M(0xe6f1fb, { rough: 1 }), 0, .53, 0, v); for (const s of [-1, 1]) mesh(G.box(.7, .06, .02), M(C.copper, { metal: .6 }), 0, .28, s * .46, v); vents.push({ x0: x - .5, x1: x + .5, h: .56 }); };
  const icy = (x0, x1) => { const m = mesh(G.box(x1 - x0, .03, 1.2), new THREE.MeshStandardMaterial({ color: 0xbfefff, emissive: 0x3aa0d0, emissiveIntensity: .5, roughness: .05, metalness: .3 }), (x0 + x1) / 2, RY + .02, 0, st.scene); ice.push({ x0, x1 }); };
  const vane = x => {
    const v = new THREE.Group(); v.position.set(x, RY, -.3); st.add(v);
    mesh(G.cyl(.05, .07, 2.3, 8), M(C.brass, { metal: .7, rough: .3 }), 0, 1.15, 0, v);
    const top = new THREE.Group(); top.position.y = 2.35; v.add(top);
    for (let i = 0; i < 4; i++) { const b = mesh(G.sph(.42, 12, 8), M(C.copper, { metal: .7, rough: .3, side: THREE.DoubleSide }), Math.cos(i * Math.PI / 2) * .6, 0, Math.sin(i * Math.PI / 2) * .6, top); b.scale.set(1, 1, .16); b.rotation.y = -i * Math.PI / 2 + .5; }
    mesh(G.sph(.12, 10, 8), glowMat(C.amber, 2), 0, 0, 0, top); sprite(C.amber, 1.4, 0, 0, 0, top, .5);
    const cord = mesh(G.cyl(.015, .015, 1.1, 5), M(0xf6ecd8), .25, 1.5, .3, v); mesh(G.sph(.08, 8, 6), M(0xd9442a), .25, .95, .3, v);
    const o = { x, top, spin: 1.2, used: false }; vanes.push(o); return o;
  };
  vent(cars[0].cx + 3);
  icy(cars[1].x0 + 2, cars[1].x0 + 8); const v1 = vane(cars[1].x1 - 2.2);
  vent(cars[2].cx - 1);
  icy(cars[3].x0 + 1.5, cars[3].x0 + 6.5); vent(cars[3].cx + 2.2); const v2 = vane(cars[3].x1 - 2.2);
  vent(cars[4].cx - 2); const v3 = vane(cars[4].x1 - 2.4);
  st.tick(dt => { for (const v of vanes) { v.top.rotation.y += dt * v.spin; v.spin = damp(v.spin, 1.2, 1, dt); } });
  // the open hatch River climbed out of
  const hx = cars[0].x0 + 2.2; mesh(G.box(1.1, .1, 1.1), M(0x10161f), hx, RY + .03, 0, st.scene); const lid = mesh(G.box(1.1, .08, 1.1), M(C.tealDark, { rough: .5 }), hx - .6, RY + .5, 0, st.scene); lid.rotation.z = 1.2;
  const hl = new THREE.PointLight(C.amber, 14, 9, 1.8); hl.position.set(hx, RY + .6, 0); st.add(hl); sprite(C.amber, 2.6, hx, RY + .3, 0, st.scene, .5);
  Object.assign(st.cam, { y: RY + 2.5, z: 13, ly: RY + 1.25, ox: 2.2, minX: cars[0].x0 + 4, maxX: cars[4].x1 + 2, fov: 36, talk: .8 });
  return { st, RY, cars, vents, ice, vanes: [v1, v2, v3], hx, eng, sc };
}

export default async function chapter2(g) {
  const { say, narr, choose, wait, audio } = g;
  let S = gather(g), st = S.st, f = S.f, ibby = S.ibby, river = S.river;
  // six waymarks waiting in Ibby's satchel
  await g.open();
  await say('Ibby', 'A waymark is not a ticket. A ticket says where you are allowed to go.', { emote: 'give' });
  await say('Ibby', 'A waymark remembers where you have been.');
  audio.sfx('fork');
  const marks = {};
  for (const n of ['tavi', 'wren', 'mari', 'bo', 'dex', 'river']) {
    const a = n === 'river' ? river : f[n], m = kit.makeWaymark(); m.position.set(ibby.pos.x - .4, 1.5, .9); st.add(m); marks[n] = m;
    let k = 0; const from = m.position.clone(), to = new THREE.Vector3(a.pos.x + .25, a.height * .62, a.pos.z + .25);
    const tk = st.tick(dt => { k = Math.min(1, k + dt * 2.2); m.position.lerpVectors(from, to, kit.smooth(k)); m.position.y += Math.sin(k * Math.PI) * .9; m.rotation.y += dt * 9; });
    await g.until(() => k >= 1); st.untick(tk); audio.sfx('catch', { note: ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6'][Object.keys(marks).length - 1] }); a.do('cheer', .7);
  }
  await narr('Each one was a disc of frosted glass, cold as a window, and it rang when Ibby tapped it.');
  await say('Ibby', 'Whenever you do something on this journey that matters, a little frost will grow on the glass.');
  await say('Ibby', 'By the end it will have drawn you a picture. I never know what of.');
  await say('Dex', 'Mine is just glass.', { emote: 'shrug' });
  await say('Ibby', 'So far.');
  // the Sky Road passes overhead
  st.sky.userData.aurora.uniforms.k.value = 2.6; audio.sfx('rumble', { rise: 1, len: 4 }); g.shake(.05); st.lampDim = .35;
  await narr('The lanterns dipped. Green light poured in through every window.');
  await say('Ibby', 'Ah. We are passing under the Sky Road. Hold on to your...');
  audio.sfx('clank'); audio.sfx('gust'); S.lid.rotation.z = 1.9; g.shake(.12); audio.loop('wind', true, 1);
  const bm = marks.bo; let k = 0; const from = bm.position.clone(), to = new THREE.Vector3(S.hx, 4.4, .9);
  const tk = st.tick(dt => { k = Math.min(1, k + dt * 1.1); bm.position.lerpVectors(from, to, k * k); bm.position.x += Math.sin(k * 14) * .35 * (1 - k); bm.rotation.z += dt * 12; });
  f.bo.do('jump', 2); g.bark('Bo', 'My waymark!', 3);
  await g.until(() => k >= 1); st.untick(tk); bm.visible = false; st.lampDim = 1;
  await say('Bo', 'It went out the roof! Mine went out the ROOF!', { emote: 'shiver' });
  await say('Mari', 'Nobody move. I am counting waymarks. Five. That is one short.');
  const v = await choose('River', 'The hatch bangs in the wind. Up there, something small and bright is tumbling along the roof.', [["I'll get it!", 'go'], ['Ibby, can we stop the train?', 'stop']]);
  g.flag('roofVolunteer', v === 'go');
  if (v === 'stop') { await say('Ibby', 'The Nightjar does not stop between stops. She would never forgive me.'); await say('Ibby', 'But the roof walk is safe enough, for somebody on a line. Is there somebody?'); await say('River', '...Me. I will go.', { emote: 'nod' }); }
  else await say('Ibby', 'Not without a line, you will not. Hold still.');
  await narr('Ibby clipped a glowing cord to the back of River\'s coat. It hummed like the rails.');
  await say('Mari', 'I will hold the ladder. Tavi, the lamp. Dex, be useful.', { emote: 'point' });
  await say('Dex', 'I am being useful. I am supervising.');
  await g.walk(river, S.hx, .9, 2.6);
  await g.fade(1, .6);

  // ---------- the roof ----------
  const R = roof(g); st = R.st; const RY = R.RY;
  river = g.spawnRiver(R.hx + .8, 0, Math.PI / 2, RY); river.noFloor = true;
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffd08a })); line.frustumCulled = false; st.add(line);
  const mark = kit.makeWaymark(); mark.scale.setScalar(2.2); st.add(mark);
  const anchor = i => new THREE.Vector3(R.vanes[i].x + 5.2, RY + 2.3, 2.6);
  let mAt = anchor(0), mMove = null; mark.position.copy(mAt);
  const k5 = g.keepsake('k05', R.cars[2].cx - 1, RY + 2.0, 0, { r: 1.0 });
  const puffs = new kit.Puffs({ count: 140, color: 0xdff4ff, size: .7, opacity: .7 }); st.add(puffs.points);
  let vx = 0, vy = 0, grounded = true, stun = 0, safeX = river.pos.x, stage = 0, caught = false, arches = [], archT = 3, falls = 0, facing = 1;
  const groundAt = x => { for (const v of R.vents) if (x > v.x0 && x < v.x1) return RY + v.h; if (x < R.cars[0].x0 - 6) return RY; for (const c of R.cars) if (x >= c.x0 && x <= c.x1) return RY; return -99; };
  // icicle arches the train rushes under
  const mkArch = x => { const a = new THREE.Group(); a.position.set(x, 0, 0); st.add(a); for (const s of [-1, 1]) mesh(G.cyl(.14, .18, RY + 2.4, 8), M(C.iron, { metal: .4, rough: .6 }), 0, (RY + 2.4) / 2, s * 3.3, a); const bar = mesh(G.box(.3, .3, 6.8), M(0x3a4660, { emissive: C.amber, ei: .9 }), 0, RY + 1.18, 0, a); for (let i = 0; i < 9; i++) mesh(G.cone(.09, .34 + (i % 3) * .1, 6), M(0xdff4ff, { emissive: 0x5fd8ff, ei: .8, rough: .1 }), 0, RY + .9 - (i % 3) * .05, -3 + i * .75, a).rotation.x = Math.PI; sprite(C.amber, 3, 0, RY + 1.2, 3.4, a, .6); arches.push({ g: a, x, warned: false, hit: false }); };
  st.walkFn = (dt, ivx) => {
    const p = river.pos, duck = g.input.h.duck && grounded;
    if (stun > 0) { stun -= dt; ivx = -5.5; }
    const onIce = grounded && R.ice.some(z => p.x > z.x0 && p.x < z.x1);
    vx = damp(vx, ivx * 1.4 * (duck ? .4 : 1), onIce ? 1.5 : 14, dt);
    let nx = p.x + vx * dt; nx = Math.max(R.cars[0].x0 + .6, Math.min(R.cars[4].x1 - .4, nx));
    const gh = groundAt(nx); if (gh > p.y + .2) { nx = p.x; vx = 0; }
    p.x = nx;
    if (grounded && g.input.p.jump && !duck && stun <= 0 && !st.near) { vy = 6.6; grounded = false; audio.sfx('jump'); }
    vy -= 17 * dt; p.y += vy * dt;
    const h = groundAt(p.x); if (p.y <= h && vy <= 0 && h > -50 && p.y > h - .6) { p.y = h; vy = 0; if (!grounded) puffs.burst(5, p.x, p.y + .1, .3, 1, .4); grounded = true; if (h === RY) safeX = p.x; } else if (p.y > h + .02) grounded = false;
    if (p.y < RY - 2.2) { // the line twangs and pulls him back
      falls++; audio.sfx('oops'); const c = R.cars.filter(c => c.x0 <= safeX + .5).pop() || R.cars[0]; p.x = Math.max(c.x0 + 1, Math.min(c.x1 - 1.6, safeX - 1.2)); p.y = RY + 1.6; vy = 0; vx = 0; g.shake(.08); g.bark(river, ['Boing!', 'Whoa!', 'Thank you, line!'][falls % 3], 1.6);
    }
    river.pose = duck ? 'crouch' : 'stand'; river.speed = grounded ? Math.abs(vx) : 0; if (Math.abs(vx) > .3) facing = vx > 0 ? 1 : -1; river.targetYaw = facing * Math.PI / 2 * .85;
    if (!grounded) { river.arms[0].rotation.z = -2; river.arms[1].rotation.z = 2; }
  };
  st.tick((dt, t) => {
    const p = river.pos;
    line.geometry.attributes.position.setXYZ(0, R.hx, RY + .2, 0); line.geometry.attributes.position.setXYZ(1, p.x - .1, p.y + .55, p.z); line.geometry.attributes.position.needsUpdate = true;
    // the waymark flutters like a glass moth
    if (mMove) { mMove.k = Math.min(1, mMove.k + dt / mMove.d); const e = kit.smooth(mMove.k); mark.position.lerpVectors(mMove.a, mMove.b, e); mark.position.y += Math.sin(e * Math.PI) * 2.4; if (mMove.k >= 1) { mAt = mMove.b; mMove = null; } }
    else if (!caught) mark.position.set(mAt.x + Math.sin(t * 2.1) * .5, mAt.y + Math.sin(t * 3.3) * .4, mAt.z + Math.cos(t * 1.7) * .5);
    mark.rotation.y += dt * 7; mark.rotation.x = Math.sin(t * 5) * .6;
    if (Math.random() < dt * 14 && !caught) puffs.emit(mark.position.x, mark.position.y, mark.position.z, -3, 0, 0, .7, .6);
    puffs.update(dt);
    // arches only come once River is past the second carriage
    if (p.x > R.cars[2].x0 - 3 && !caught && !g.ui.busy && !g.game.locked) { archT -= dt; if (archT <= 0) { archT = 4.2 + Math.random() * 1.4 - Math.min(1, falls * .0); mkArch(p.x + 30); } }
    for (const a of arches) {
      a.x -= 9.5 * dt; a.g.position.x = a.x;
      if (!a.warned && a.x - p.x < 11) { a.warned = true; g.big('Duck!', 1.1); audio.sfx('chime'); }
      if (!a.hit && Math.abs(a.x - p.x) < .45) { a.hit = true; if (river.pose !== 'crouch') { stun = .45; audio.sfx('bump'); g.shake(.12); puffs.burst(14, p.x, p.y + 1.1, 0, 2.5, .6); g.bark(river, ['Oof!', 'Ow. Icicles.', 'Duck, River, duck!'][Math.floor(Math.random() * 3)], 1.6); } else audio.sfx('good'); }
    }
    arches = arches.filter(a => { if (a.x < p.x - 40) { st.scene.remove(a.g); return false; } return true; });
  });
  // the wind-wheels: pull the cord and the gust blows the waymark onward
  R.vanes.forEach((v, i) => st.item({
    x: v.x, z: 0, y: RY + 3.1, pz: -.3, r: 1.5, label: 'Pull the wind-wheel cord', on: () => stage === i && grounded && !mMove,
    use: async g => {
      audio.sfx('lever'); v.spin = 26; await g.wait(.35); audio.sfx('gust'); for (let k = 0; k < 40; k++) puffs.emit(v.x, RY + 2.3, 0, 7 + Math.random() * 4, (Math.random() - .3) * 3, (Math.random()) * 3, 1.1, .5);
      stage++;
      if (i < 2) { mMove = { a: mark.position.clone(), b: anchor(i + 1), k: 0, d: 2.2 }; await g.wait(.5); g.bark(river, i ? 'Not that far!' : 'Come back here!', 2); }
      else {
        mMove = { a: mark.position.clone(), b: new THREE.Vector3(river.pos.x + .3, RY + 1.0, .2), k: 0, d: 1.5 }; await g.until(() => !mMove); caught = true; audio.sfx('star'); river.do('cheer', 2); puffs.burst(30, river.pos.x, RY + 1.2, 0, 3, 1);
        mark.scale.setScalar(1); river.hand(1).add(mark); mark.position.set(0, 0, .1);
        await g.wait(1.2); await say('River', 'Got you!', { keep: true });
      }
    },
  }));

  st.dbg = { R, arches: () => arches, state: () => ({ stage, caught, falls, grounded }) };
  g.ui.action(true); g.goal('Run along the roof to the wind-wheel'); g.control(true);
  await g.fade(0, .8);
  await g.busy(async () => {
    await narr('Up here the whole sky was moving. The Sky Road rippled green from one end of the world to the other.');
    await narr("And there, just out of reach, went Bo's waymark, fluttering like a moth made of glass.");
    g.toast('Jump over gaps and vents. Duck under the icicles.', 'The cord on your coat will always pull you back.', 6);
  });
  await g.until(() => stage >= 1); g.goal('Chase the waymark to the next wind-wheel');
  await g.until(() => stage >= 2); g.goal('One more wind-wheel, at the very front');
  await g.until(() => caught && !g.game.locked && !g.ui.busy);
  g.goal(null); g.ui.action(false); g.control(false);
  river.targetYaw = Math.PI * .8; await g.shot({ pos: [river.pos.x - 4.5, RY + .9, 5.5], look: [river.pos.x + 4, RY + 3.4, -8], dur: 3, fov: 52 });
  await narr('For one moment River stood on top of a train with no tracks, under a river of light, and did not need anything explained.');
  await g.fade(1, .8);

  // ---------- back inside ----------
  g.game.newStage(); S = gather(g); st = S.st; f = S.f; river = S.river; S.lid.rotation.z = 0; river.place(S.hx - 1.2, 0, .9, Math.PI / 2);
  f.bo.place(S.hx + .1, 0, .9, -Math.PI / 2); g.audio.loop('wind', false);
  const m2 = kit.makeWaymark(); river.hand(1).add(m2); river.pose = 'hold';
  await g.fade(0, .8);
  await say('River', 'Here. It tried to get away twice.', { emote: 'give' });
  river.hand(1).remove(m2); f.bo.hand(1).add(m2); river.pose = 'stand'; f.bo.do('cheer', 2); audio.sfx('pick');
  await say('Bo', 'You went OUTSIDE. On the ROOF. For my waymark.');
  await say('Bo', 'Admiral says you are the bravest person he has met. He has met eleven people.');
  await say('Mari', 'Next time, tell me first, so I can keep counting you while you are gone.', { emote: 'point' });
  await say('Tavi', 'Was it windy? How windy? Did the wheels spin? I need numbers!', { emote: 'jump' });
  await say('Dex', 'Fine. The wind was real. That is one thing.', { emote: 'shrug' });
  await narr('On River\'s own waymark, where the glass had been clear, a first thin feather of frost had grown.');
  await say('Ibby', 'There. Your first. And this is for anyone who has walked the roof. I am not supposed to have any left.');
  g.collect('k06');
  await g.wait(2.2);
  await g.fade(1, .8);
}
