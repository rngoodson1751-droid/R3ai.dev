// Chapter Three: The Rolling Kettle. Catch the cloudbuns, hop the serving carts, feed everybody.
import { kit, CAST, trainStage, talk, look } from './common.js';
const { THREE, M, G, mesh, C, sprite, glowMat, damp, lerp, clamp } = kit;

function bun() {
  const g = new THREE.Group(); const b = mesh(G.sph(.17, 12, 10), M(0xfff6e6, { rough: 1 }), 0, 0, 0, g); b.scale.y = .78;
  for (let i = 0; i < 4; i++) { const p = mesh(G.sph(.1, 8, 6), M(0xfffaf0, { rough: 1 }), Math.cos(i * 1.6) * .1, .06, Math.sin(i * 1.6) * .1, g); }
  mesh(G.torus(.07, .022, 12), M(0xe2a23c, { rough: .5 }), 0, .13, 0, g).rotation.x = Math.PI / 2;
  return g;
}
function cart() {
  const g = new THREE.Group();
  const shell = mesh(new THREE.SphereGeometry(.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(C.copper, { metal: .7, rough: .3 }), 0, .2, 0, g); shell.scale.set(1.25, .9, 1);
  mesh(G.cyl(.5, .5, .08, 16), M(C.brass, { metal: .7, rough: .3 }), 0, .2, 0, g).scale.set(1.25, 1, 1);
  const head = mesh(G.sph(.16, 12, 8), M(C.brass, { metal: .7, rough: .3 }), .62, .3, 0, g);
  for (const s of [-1, 1]) { mesh(G.sph(.04, 8, 6), glowMat(C.amber, 2.5), .72, .36, s * .09, g); mesh(G.cyl(.1, .1, .08, 10), M(0x1b2230), s > 0 ? .3 : -.3, .1, .36, g).rotation.x = Math.PI / 2; mesh(G.cyl(.1, .1, .08, 10), M(0x1b2230), s > 0 ? .3 : -.3, .1, -.36, g).rotation.x = Math.PI / 2; }
  const key = new THREE.Group(); key.position.set(-.6, .42, 0); g.add(key); mesh(G.cyl(.02, .02, .2, 6), M(C.brass, { metal: .8 }), .05, 0, 0, key).rotation.z = Math.PI / 2; mesh(G.torus(.09, .025, 10), M(C.brass, { metal: .8 }), -.1, 0, 0, key).rotation.y = Math.PI / 2;
  mesh(G.cyl(.3, .3, .03, 14), M(0xf6ecd8), 0, .62, 0, g); const cup = mesh(G.cyl(.08, .06, .14, 10), M(0x2a8f8a), .05, .7, .05, g);
  g.userData.key = key; return g;
}

export default async function chapter3(g) {
  const { say, narr, choose, wait, audio } = g;
  const st = g.stage;
  const [K] = trainStage(g, { cars: [{ len: 22, booths: false, doors: [true, true] }] });
  const x0 = K.x0, x1 = K.x1, cx = K.cx;
  // the counter, the Kettle and the shelf of cloudbuns
  mesh(G.box(13, 1.0, .8), M(C.woodDark, { rough: .6 }), cx - 2.6, .5, -1.62, st.scene); mesh(G.box(13.2, .07, .95), M(C.copper, { metal: .6, rough: .3 }), cx - 2.6, 1.03, -1.58, st.scene);
  const kx = cx + 7.2, ket = new THREE.Group(); ket.position.set(kx, 0, -1.2); st.add(ket);
  mesh(G.rbox(1.7, .7, 1.4, .1), M(C.iron, { metal: .5, rough: .5 }), 0, .35, 0, ket); const fire = mesh(G.box(1.1, .22, .05), glowMat(0xff7a2a, 2.6), 0, .32, .72, ket);
  const body = mesh(G.sph(.92, 24, 18), M(C.copper, { metal: .8, rough: .22 }), 0, 1.5, 0, ket); body.scale.y = .9;
  mesh(G.cyl(.42, .5, .14, 20), M(C.brass, { metal: .8, rough: .25 }), 0, 2.3, 0, ket); mesh(G.sph(.12, 10, 8), M(0x2a8f8a), 0, 2.46, 0, ket);
  const spout = mesh(G.cyl(.09, .16, 1.1, 10), M(C.copper, { metal: .8, rough: .22 }), -.95, 1.85, 0, ket); spout.rotation.z = .9;
  const handle = mesh(new THREE.TorusGeometry(.6, .06, 8, 20, Math.PI), M(C.brass, { metal: .8, rough: .25 }), .2, 2.2, 0, ket);
  const kl = new THREE.PointLight(0xff8a3a, 7, 6, 1.8); kl.position.set(kx, .5, -.2); st.add(kl);
  const steam = new kit.Puffs({ count: 90, color: 0xffffff, size: .6, opacity: .35, additive: false }); st.add(steam.points); steam.drag = .8;
  mesh(G.box(13, .06, .5), M(C.wood), cx - 2.6, 2.28, -1.82, st.scene);
  for (let i = 0; i < 16; i++) { const b = bun(); b.position.set(cx - 8.6 + i * .8, 2.42, -1.8); st.add(b); }
  for (let i = 0; i < 7; i++) { const c = mesh(G.cyl(.09, .07, .16, 10), M([0x2a8f8a, 0xf6ecd8, 0xd98a2c][i % 3]), cx - 8 + i * 1.7, 1.15, -1.5, st.scene); c.userData.x = c.position.x; (st.cups = st.cups || []).push(c); }
  // friends on tall stools, backs to the counter
  const names = ['tavi', 'bo', 'mari', 'wren', 'dex'], f = {};
  names.forEach((n, i) => {
    const x = cx - 7.6 + i * 2.5; mesh(G.cyl(.06, .08, .7, 8), M(C.brass, { metal: .7 }), x, .35, -.85, st.scene); mesh(G.cyl(.3, .3, .1, 14), M(0x9c3f3a, { rough: .9 }), x, .74, -.85, st.scene);
    const a = f[n] = st.actor(CAST[n](), x, .79 - .12 * 1, -.8, 0); a.pose = 'sit'; a.pos.y = .79 - .12 * a.scale; a.eaten = 0;
  });
  const ibby = st.actor(CAST.ibby(), x1 - 1.6, 0, .5, -Math.PI / 2 * .6);
  const river = g.spawnRiver(x0 + 2.5, .95, Math.PI / 2);
  const tray = new THREE.Group(); mesh(G.cyl(.34, .3, .04, 16), M(C.brass, { metal: .8, rough: .25 }), 0, 0, 0, tray); tray.position.set(0, .66, .36); tray.visible = false; river.rig.add(tray);
  g.keepsake('k07', x0 + 1.1, 1.0, .95);
  const badge = g.keepsake('k08', kx - 1.6, 1.0, .7, { hidden: true });

  await g.open();
  await say('Ibby', 'Roof-walkers and ladder-holders get hungry. Welcome to the Kettle Car.', { emote: 'wave' });
  await narr('The Kettle Car had no cook. It had the Kettle, which whistled the orders, and a fleet of wind-up serving carts, which mostly obeyed.');
  audio.sfx('steam'); for (let i = 0; i < 20; i++) steam.emit(kx - 1.4, 2.3, -1.2, -1.5, 1.4, 0, 1.4, .5);
  await say('Tavi', 'Cloudbuns! They are four parts cloud and one part bun. I asked.', { emote: 'cheer' });
  st.cam.roll = .05; g.shake(.06); audio.sfx('rumble', { rise: .4, len: 2 });
  await narr('Then the Nightjar leaned into a long bend, and the cloudbuns began to slide off their shelf.');
  await say('Ibby', 'River! The tray! Do not let them touch the floor. The carts sulk for days if they have to sweep.', { emote: 'point' });
  st.cam.roll = 0; tray.visible = true; river.pose = 'hold';

  // ---------- the serving game ----------
  const NEED = 12; let caught = 0, misses = 0, fallT = 1.9, spawnT = 1.2, cartT = 5, turnAt = [4, 8], vy = 0, grounded = true, stun = 0, vx = 0, facing = 1, playing = true;
  const buns = [], carts = [], fly = [];
  const ring = () => { const r = mesh(G.torus(.36, .03, 20), new THREE.MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: .8 }), 0, .03, .95, st.scene); r.rotation.x = Math.PI / 2; return r; };
  const drop = x => { const b = bun(); b.scale.setScalar(1.25); st.add(b); buns.push({ g: b, x, k: 0, ring: ring() }); buns[buns.length - 1].ring.position.x = x; };
  const serve = () => { caught++; const n = names[(caught - 1) % 5], a = f[n], b = bun(); st.add(b); const from = new THREE.Vector3(river.pos.x, 1.2, .95), to = new THREE.Vector3(a.pos.x, a.pos.y + a.height * .8, a.pos.z + .2); fly.push({ g: b, from, to, k: 0, a }); g.meter('Cloudbuns served', caught / NEED); };
  st.walkFn = (dt, ivx) => {
    const p = river.pos; if (stun > 0) { stun -= dt; ivx = 0; }
    vx = damp(vx, ivx * 1.45, 12, dt); p.x = clamp(p.x + vx * dt, x0 + .8, x1 - 2.6); p.z = damp(p.z, .95, 8, dt);
    if (grounded && g.input.p.jump && stun <= 0) { vy = 6.2; grounded = false; audio.sfx('jump'); }
    vy -= 17 * dt; p.y += vy * dt; if (p.y <= 0) { p.y = 0; vy = 0; grounded = true; }
    river.speed = grounded ? Math.abs(vx) : 0; if (Math.abs(vx) > .3) facing = vx > 0 ? 1 : -1; river.targetYaw = stun > 0 ? river.targetYaw + dt * 14 : facing * .9;
  };
  const tick = st.tick((dt, t) => {
    steam.update(dt); if (Math.random() < dt * 5) steam.emit(kx - 1.4, 2.3, -1.2, -.6, .9, 0, 1.6, .3);
    for (const c of carts) c.g.userData.key.rotation.x += dt * 9;
    for (const c of st.cups) c.position.x = damp(c.position.x, c.userData.x + st.cam.roll * 18, 3, dt);
    for (let i = fly.length - 1; i >= 0; i--) { const o = fly[i]; o.k = Math.min(1, o.k + dt * 2.4); o.g.position.lerpVectors(o.from, o.to, o.k); o.g.position.y += Math.sin(o.k * Math.PI) * 1.2; o.g.rotation.x += dt * 9; if (o.k >= 1) { st.scene.remove(o.g); fly.splice(i, 1); o.a.do('cheer', .9); o.a.eaten++; audio.sfx('catch', { note: ['G5', 'A5', 'B5', 'D6', 'E6'][caught % 5] }); } }
    if (!playing || g.ui.busy || g.game.locked) return;
    const p = river.pos;
    // falling cloudbuns, on the beat
    spawnT -= dt; if (spawnT <= 0 && caught + buns.length < NEED + 1) { spawnT = Math.max(.85, 1.5 - caught * .03); drop(clamp(p.x + (Math.random() - .5) * 8.5, x0 + 1.4, x1 - 3.2)); }
    for (let i = buns.length - 1; i >= 0; i--) {
      const b = buns[i]; b.k += dt / fallT; const e = Math.min(1, b.k);
      b.g.position.set(b.x, lerp(2.5, .95, e * e) + Math.sin(e * Math.PI) * .5, lerp(-1.7, .95, Math.min(1, e * 1.5))); b.g.rotation.z += dt * 4; b.ring.scale.setScalar(1.6 - e * .6); b.ring.material.opacity = .25 + e * .6;
      if (e >= .8 && Math.abs(b.x - p.x) < .78 && p.y < .9) { st.scene.remove(b.g, b.ring); buns.splice(i, 1); misses = 0; serve(); continue; }
      if (b.k >= 1.06) { st.scene.remove(b.g, b.ring); buns.splice(i, 1); misses++; audio.sfx('oops'); steam.burst(8, b.x, .2, .95, 1.2, .5); if (misses >= 2) { fallT = Math.min(2.8, fallT + .25); misses = 0; } }
    }
    // the wind-up carts race through
    cartT -= dt; if (cartT <= 0) { cartT = 5.5 + Math.random() * 3; const dir = Math.random() < .5 ? 1 : -1, c = cart(); c.position.set(dir > 0 ? x0 - 1 : x1 + 1, 0, .95); c.rotation.y = dir > 0 ? 0 : Math.PI; st.add(c); carts.push({ g: c, dir, hit: false }); audio.sfx('chime'); g.big(dir > 0 ? 'Cart! Jump!' : 'Jump! Cart!', 1); }
    for (let i = carts.length - 1; i >= 0; i--) {
      const c = carts[i]; c.g.position.x += c.dir * 5.2 * dt;
      if (!c.hit && Math.abs(c.g.position.x - p.x) < .6 && p.y < .55) { c.hit = true; stun = .7; audio.sfx('bump'); g.shake(.1); g.bark(river, ['Whoa!', 'Sorry, cart!', 'Beep yourself!'][i % 3], 1.5); g.bark({ pos: c.g.position, height: .7, talking: 0 }, 'Beep!', 1.2); }
      if (c.g.position.x < x0 - 3 || c.g.position.x > x1 + 3) { st.scene.remove(c.g); carts.splice(i, 1); }
    }
    // two sharp bends: everything leans and three buns go at once
    if (turnAt.length && caught >= turnAt[0]) { turnAt.shift(); const s = turnAt.length ? 1 : -1; g.big('Hold on!', 1.3); audio.sfx('rumble', { rise: .3, len: 2.5 }); g.shake(.07); st.cam.rollT = s * .07; st.rollUntil = t + 3; for (let k = 0; k < 3; k++) drop(clamp(p.x + s * (1.5 + k * 1.7), x0 + 1.4, x1 - 3.2)); for (const n of names) g.bark(n, ['Whee!', 'Admiral!', 'Lean!', '...', 'Seriously?'][names.indexOf(n)], 1.4); }
    if (st.rollUntil && t > st.rollUntil) { st.cam.rollT = 0; st.rollUntil = 0; }
    st.cam.roll = damp(st.cam.roll, st.cam.rollT || 0, 2.5, dt);
  });
  st.dbg = { buns, carts, win: () => { while (caught < NEED) serve(); } };
  g.ui.action(true); g.goal('Catch the falling cloudbuns on your tray'); g.meter('Cloudbuns served', 0); g.control(true);
  g.toast('Stand under the falling cloudbuns.', 'Jump over the serving carts.', 5);
  await g.until(() => caught >= NEED && fly.length === 0);
  playing = false; for (const b of buns) st.scene.remove(b.g, b.ring); buns.length = 0; st.cam.rollT = 0;
  g.meter(null); g.ui.action(false); audio.sfx('cheer'); for (const n of names) f[n].do('cheer', 2);
  st.walkFn = null; river.pos.y = 0;
  // cups of pear cider all round
  names.forEach((n, i) => { const c = mesh(G.cyl(.08, .06, .14, 10), M(0x2a8f8a), 0, 0, 0, f[n].hand(1)); });
  await g.busy(async () => {
    await narr('Twelve cloudbuns, six travelers, and not one crumb on the floor. The Kettle whistled, and the carts brought round cups of hot pear cider.');
    await say('Mari', 'Twelve buns. Six of us. Two each. I counted them in the air.', { emote: 'nod' });
  });
  g.goal('Enjoy the Kettle Car, then tell Ibby you are ready');
  talk(g, f.tavi, async () => { await say('Tavi', 'I put one in my pocket for science. It floated out again.'); }, { z: .5 });
  talk(g, f.bo, async () => { await say('Bo', 'Admiral had three. He says thank you. He says it with his eyes.'); }, { z: .5 });
  talk(g, f.mari, async () => { await say('Mari', 'You are quick with a tray. I am writing that down. In my head.'); }, { z: .5 });
  talk(g, f.wren, async () => { await narr('Wren holds up her notebook. It is a drawing of River under a tower of cloudbuns as tall as the ceiling.'); await say('Wren', 'It was not that tall. But it felt that tall.'); }, { z: .5 });
  talk(g, f.dex, async () => { await say('Dex', 'Okay. The buns are real. You cannot fake a bun.', { emote: 'shrug' }); await say('Dex', 'That does not prove anything about the rest of it.'); }, { z: .5 });
  look(g, kx, 3.0, -1.2, 'Look at the Kettle', async g => { await narr('The Kettle is as tall as a grown-up and as round as a moon. Something is tucked under the edge of its stove.'); g.reveal(badge); }, { wz: .5, r: 1.6, once: true });
  let done = false;
  talk(g, ibby, async g => {
    const v = await choose('River', 'There is one last cloudbun on the tray.', [['Give it to Bo', 'bo'], ['Give it to Dex', 'dex'], ['Leave it for the littlest cart', 'cart'], ['Eat it', 'river']]);
    g.flag('lastBun', v); tray.visible = false; river.pose = 'stand';
    if (v === 'bo') { f.bo.do('cheer', 1.5); await say('Bo', 'For me? Admiral, look. We have a friend with buns.'); }
    else if (v === 'dex') { await say('Dex', "...Thanks. I was not going to ask.", { emote: 'nod' }); }
    else if (v === 'cart') { await narr('River set it on the floor. A cart no bigger than a shoe box crept out, took it very gently, and whirred away.'); }
    else { await say('River', 'Mmf. Four parts cloud.', { emote: 'nod' }); }
    await say('Ibby', 'Good. Now, everyone finish your cider, because...');
    audio.sfx('clank'); g.shake(.2); st.lampDim = .3; audio.sfx('rumble', { rise: .2, len: 5 });
    await g.wait(.9); st.lampDim = 1;
    await narr('The whole carriage lurched. Every cup on the counter slid the same way at once.');
    await say('Ibby', 'That is not one of her usual noises.', { keep: true });
    await say('Ibby', 'River. You are steady on your feet. Come with me to the front. The rest of you, sit tight.');
    done = true;
  }, { z: .9, r: 1.5 });
  await g.until(() => done);
  await g.fade(1, .8);
}
