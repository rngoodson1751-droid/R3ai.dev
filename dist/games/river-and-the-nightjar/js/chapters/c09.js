// Chapter Nine: The Great Winter Gathering. The Kindler, the Kindling Star, and the Long Lantern.
import { kit, CAST, talk, look } from './common.js';
import { plaza } from './c07.js';
import { makeCrowd } from './city.js';
const { THREE, M, G, mesh, C, sprite, glowMat, damp, lerp, clamp, rng, TAU } = kit;

export default async function chapter9(g) {
  const { say, narr, choose, wait, audio } = g;
  const { st, city } = plaza(g, { folk: 0 });
  const lantern = city.userData.lantern;
  // the whole town, gathered, leaving one aisle up the middle
  const r = rng(90), spots = [];
  for (let ring = 0; ring < 9; ring++) { const rad = 13.5 + ring * 2.3, n = Math.floor(rad * 2.1); for (let i = 0; i < n; i++) { const a = i / n * TAU + ring * .37, x = Math.cos(a) * rad + (r() - .5) * .8, z = Math.sin(a) * rad + (r() - .5) * .8; if (Math.abs(x) < 3.9 && z > 0) continue; if (Math.hypot(x, z - 17) < 5.2) continue; if (z > 33.5 || Math.abs(x) > 31) continue; spots.push([x, z]); } }
  const crowd = st.add(makeCrowd(spots)); st.tick((dt, t) => crowd.userData.update(dt, t));
  // the brass plate the cart came up on
  mesh(G.cyl(3.6, 3.6, .12, 24), M(0x8a5a3a, { metal: .2, rough: .8 }), 0, .06, 17, st.scene);
  const cart = kit.crate(3.4, .8, 2.3, 0xb88a5c); cart.position.set(0, .35, 17); cart.rotation.y = Math.PI / 2; st.add(cart);
  const river = g.spawnRiver(0, 14.8, Math.PI);
  const f = { bo: st.actor(CAST.bo(), -1.4, 0, 15.2, Math.PI), tavi: st.actor(CAST.tavi(), 1.5, 0, 15.3, Math.PI), mari: st.actor(CAST.mari(), -2.3, 0, 16.6, Math.PI), wren: st.actor(CAST.wren(), 2.4, 0, 16.5, Math.PI), dex: st.actor(CAST.dex(), 0, 0, 19.4, Math.PI) };
  const admiral = kit.makeWalrus(); f.bo.hand(0).add(admiral); admiral.position.set(0, -.05, .12);
  const maren = st.actor(CAST.maren(), 0, 2.6, 5.6, 0); maren.noFloor = true; maren.g.visible = false;
  // her lamplighter's pole
  const pole = new THREE.Group(); maren.hand(1).add(pole); mesh(G.cyl(.03, .03, 3.2, 6), M(C.brass, { metal: .8, rough: .3 }), 0, 1.0, 0, pole); mesh(G.sph(.1, 10, 8), glowMat(C.amber, 2.6), 0, 2.65, 0, pole); sprite(C.amber, 1.2, 0, 2.65, 0, pole, .6);
  const ibby = st.actor(CAST.ibby(), 9, 0, 25, -Math.PI / 2); ibby.g.visible = false;
  const star = kit.makeKindlingStar(); star.visible = false; st.add(star);
  const sparks = new kit.Puffs({ count: 420, color: 0xffd08a, size: 1.6, opacity: .95 }); sparks.drag = .05; st.add(sparks.points);
  st.tick(dt => sparks.update(dt));
  g.keepsake('k19', 2.4, 1.0, 21.2);
  const k20 = g.keepsake('k20', -1.8, 1.0, 12.6, { hidden: true });
  // where River may walk: the aisle, the clearing, and the steps
  st.areas.length = 0; st.blockers.length = 0;
  st.area(-2.6, 2.6, 8.05, 9.62, .65); st.area(-2.6, 2.6, 6.5, 8.05, 1.3); st.area(-3.4, 3.4, 9.62, 23, 0); st.area(-4.6, 4.6, 13.2, 21, 0);
  st.block(0, 17, 2.4);
  Object.assign(st.cam, { minX: -2, maxX: 2, minZ: 9, maxZ: 22, h: 4.4, d: 11.5 });

  st.cam.mode = 'cine'; st.cam.prev = 'follow'; st.cam.pos.set(0, 9, 34); st.cam.look.set(0, 3, 14); st.cam.fovNow = 44; g.bars(true);
  await g.open(1.4);
  audio.sfx('clank');
  await narr('The brass plate came up through the floor of the plaza like a cake being served. It came up in the exact middle of the Great Winter Gathering.');
  g.shot({ pos: [0, 4, 26], look: [0, 1.8, 16], dur: 4, fov: 40 }).catch(() => { });
  await narr('Four thousand Kindlefolk turned round. Four thousand lanterns turned with them. Nobody said a word.');
  await say('Dex', 'Hi.', { emote: 'wave', keep: true });
  audio.sfx('cheer'); crowd.userData.raise = .5;
  await narr('And then the whole plaza laughed, all at once, like a kettle coming to the boil.');
  crowd.userData.raise = 0; audio.sfx('chime'); await wait(.6); audio.sfx('chime');
  // the Kindler comes down the steps
  maren.g.visible = true; await g.shot({ pos: [5, 3.2, 18], look: [0, 3.4, 7], dur: 2.2, fov: 40 });
  const stepY = st.tick(() => { const a = st.inside(maren.pos.x, maren.pos.z); maren.pos.y = damp(maren.pos.y, a ? a.y : 2.6 - clamp((maren.pos.z - 5.6) / 1.0, 0, 1) * 1.3, 8, .016); });
  g.walk(maren, 0, 11.4, 1.5, 0).catch(() => { });
  await narr('Down the steps of the great dark lantern came a woman taller than a doorway. Her silver braid reached her boots. Her coat was the colour of midnight, and on it the constellations were slowly moving.');
  await g.until(() => maren.pos.z >= 11.3); st.untick(stepY); maren.pos.y = 0;
  await g.shot({ pos: [4.6, 2.6, 19.5], look: [0, 2.0, 12.5], dur: 1.6, fov: 38 });
  await say('Maren', 'Well. The Burrow has sent me a great many things over the years. It has never before sent me children.', { keep: true });
  await say('Maren', 'I am Maren Longnight. I keep the lantern. They call me the Kindler, which is a very grand name for somebody who strikes one match a year.', { keep: true });
  ibby.g.visible = true; g.walk(ibby, 3.0, 14.2, 4.5, -Math.PI / 2).catch(() => { });
  await say('Ibby', 'They are mine! That is, they are the Nightjar\'s. I only looked away for one moment.', { keep: true, emote: 'jump' });
  await say('Maren', 'Ibby Tamsin. You wandered off for one moment yourself, forty winters ago, off this very train. That turned out well enough.', { keep: true });
  await say('Maren', 'Travelers. You have come on the right night, so you had better hear why.', { keep: true });
  await say('Maren', 'Long ago, on the longest night there ever was, a woman in this valley had one candle left, and a stranger at her door.', { keep: true });
  await say('Maren', 'She gave him the candle. And the candle did not burn down. It is burning still. Tonight we let its light out.', { keep: true });
  await say('Maren', 'The first of that light always goes to a traveler. Not the bravest one, nor the cleverest. I look for the one who went back.', { keep: true });
  await say('Maren', 'So. Which of you went back?', { keep: true });
  await say('Bo', 'River did. He went back for my waymark. And for Admiral. In the dark.', { keep: true, emote: 'point' });
  await say('Mari', 'He went on the roof. He steered us off the lake. I was counting. He went back every time.', { keep: true });
  await say('Dex', '...He went back.', { keep: true });
  await say('Maren', 'River. Come here to me.', { keep: true });
  cart.visible = false; st.blockers.length = 0;
  g.camBack(); g.bars(false); g.goal('Walk up to Maren'); g.control(true);
  await g.until(() => river.pos.z < 13.3 && !g.ui.busy);
  g.control(false); g.goal(null); g.bars(true);
  await g.walk(river, 0, 12.9, 2); river.face(Math.PI);
  await g.shot({ pos: [3.4, 1.9, 15.6], look: [0, 1.5, 12.2], dur: 1.6, fov: 34 });
  star.visible = true; maren.do('give', 3); river.hand(1).add(star); star.position.set(0, .02, .12); river.pose = 'hold'; audio.sfx('pick');
  await say('Maren', 'This is a kindling star. It is the smallest lantern we make.', { keep: true });
  await say('River', 'It is not lit.', { keep: true });
  await say('Maren', 'No. It does not work alone. Nothing we make here does. It only lights when it is shared.', { keep: true });
  const who = await choose('River', 'The little brass star sits cold and dark in River\'s mittens. Who will he share it with?', [['Bo', 'bo'], ['Wren', 'wren'], ['Mari', 'mari'], ['Tavi', 'tavi'], ['Dex', 'dex'], ['Everybody at once', 'all']]);
  g.flag('sharedWith', who);
  const pals = who === 'all' ? ['bo', 'wren', 'mari', 'tavi', 'dex'] : [who];
  await Promise.all(pals.map((n, i) => g.walk(f[n], [-.9, .9, -1.5, 1.5, 0][i], 13.5 + (i > 1 ? .8 : 0) + (i === 4 ? 1.3 : 0), 3)));
  pals.forEach(n => { f[n].lookAt(river.pos.x, river.pos.z); f[n].pose = 'hold'; });
  river.face(Math.PI * .25 * (pals.length > 1 ? 0 : 1) + (pals.length > 1 ? 0 : 0));
  await wait(.5);
  let gl = 0; const glow = st.tick(dt => { gl = Math.min(1, gl + dt * .7); star.userData.setGlow(kit.smooth(gl)); star.rotation.y += dt * 2; });
  audio.sfx('star'); g.audio.setMood('gathering');
  if (who === 'bo') { await narr('Bo put both mittens round it. Admiral helped.'); await say('Bo', 'It is warm! Admiral, it is WARM!', { keep: true }); }
  else if (who === 'wren') { await narr('Wren put one hand under his. She did not say anything for a while.'); await say('Wren', 'I drew this. Two hands, and a light. On the very first page. I did not know whose they were.', { keep: true }); }
  else if (who === 'mari') { await narr('Mari took the other side of it, carefully, the way you take one end of something heavy.'); await say('Mari', 'One star. Two people. I counted. It is exactly the right number.', { keep: true }); }
  else if (who === 'tavi') { await narr('Tavi grabbed it with both hands and turned the two of them nearly upside down looking for the switch.'); await say('Tavi', 'How does it KNOW? There is no switch! There is no switch anywhere!', { keep: true }); }
  else if (who === 'dex') { await say('Dex', 'It will not work. It is brass. Brass does not just...', { keep: true }); await narr('It lit.'); await say('Dex', '...Huh.', { keep: true }); }
  else { await narr('Ten mittens and one flipper. There was hardly room.'); await say('Tavi', 'It is working! We are ALL working it!', { keep: true }); }
  await say('Maren', 'There. Now you know how it is done. Would you light my lantern for me? My knees are not what they were.', { keep: true });
  g.walk(maren, 3.2, 11.2, 1.6, -Math.PI / 2).catch(() => { });
  pals.forEach(n => { f[n].pose = 'stand'; });
  g.camBack(); g.bars(false); g.goal('Climb the steps and light the Long Lantern'); g.control(true);
  // friends follow in a chain, up the steps
  const chain = st.tick(dt => { let lead = river; for (const n of pals) { const a = f[n], dx = lead.pos.x - a.pos.x, dz = (lead.pos.z + 1.0) - a.pos.z, d = Math.hypot(dx, dz); if (d > .35) { const s = Math.min(3.2, d * 3) * dt; a.pos.x += dx / d * s; a.pos.z += dz / d * s; a.speed = 2.2; a.targetYaw = Math.atan2(dx, dz); } else { a.speed = 0; a.targetYaw = Math.PI; } const ar = st.inside(a.pos.x, a.pos.z); a.pos.y = damp(a.pos.y, ar ? ar.y : 0, 12, dt); lead = a; } });
  let lit = false;
  st.item({ x: 0, z: 7.1, y: 4.4, pz: 5.6, r: 1.5, label: 'Hold up the star', use: async g => {
    g.toast('Hold the button down.', '', 3); river.do('cheer', 99);
    let k = 0; const tk = st.tick(dt => { k = clamp(k + (g.input.h.act || g.ui.auto ? dt / 2.6 : -dt * .4), 0, 1); g.meter('Lighting the Long Lantern', k); if (Math.random() < k * dt * 40 + dt * 4) sparks.emit(river.pos.x, river.pos.y + 1.4, river.pos.z, (Math.random() - .5) * 1.5, 6 + k * 8, -1.2, 1.6, .8); });
    await g.until(() => k >= 1); st.untick(tk); g.meter(null); river.emoteT = 0; lit = true;
  } });
  await g.until(() => lit);
  g.control(false); g.goal(null); g.bars(true); st.untick(chain);
  // the lantern catches
  audio.sfx('horn'); audio.sfx('star');
  let L = 0; const up = st.tick((dt, t) => { L = Math.min(1, L + dt / 3.5); lantern.userData.set(kit.smooth(L)); crowd.userData.raise = kit.smooth(L); st.sky.userData.aurora.uniforms.k.value = 1.5 + L * 2.2; for (let i = 0; i < 3; i++) if (Math.random() < L) { const a = Math.random() * TAU; sparks.emit(Math.cos(a) * 2, 36 + Math.random() * 2, Math.sin(a) * 2, Math.cos(a) * 5 + (Math.random() - .5) * 8, 14 + Math.random() * 16, Math.sin(a) * 5 - 6, 5, 3); } });
  await g.shot({ pos: [0, 5, 30], look: [0, 16, 0], dur: 3.2, fov: 50 });
  await narr('The Long Lantern caught. Four thousand little lanterns went up to meet it.');
  g.shot({ pos: [26, 20, 64], look: [0, 30, 0], dur: 10, fov: 54 }).catch(() => { });
  await narr('And out of the top of it, like sparks from a great fire, the gifts began to leave. Up the Sky Road they went, thousands of them, to come down somewhere far away as softly as snow.');
  await say('River', 'So THAT is how they do not break.', { keep: true });
  await g.shot({ pos: [4.4, 3.4, 12.5], look: [1.2, 2.6, 8.5], dur: 0, fov: 40 });
  maren.place(2.6, 0, 10.6, -.6); river.face(.9); river.pose = 'stand';
  await say('Maren', 'Now you know one thing. There will be plenty left over that you do not. Keep it that way, River. It is a great deal more fun.', { keep: true });
  await say('Dex', g.flags.sharedWith === 'dex' ? 'I am not saying I believe all of it. I am saying I held it, and it lit.' : 'I still think there could be a projector. A really, really big one. ...Probably not, though.', { keep: true });
  g.reveal(k20);
  await say('Ibby', 'Time, travelers. The Nightjar has to have every one of you home before morning notices.', { keep: true });
  g.camBack(); g.bars(false); g.goal('Walk back down to Ibby when you are ready'); g.control(true);
  ibby.place(2.9, 0, 20.4, -Math.PI / 2);
  let done = false; talk(g, ibby, async () => { await say('Ibby', 'Ready? Bring your star. It travels well, as long as it has company.'); done = true; }, { z: 20.4, r: 1.7 });
  talk(g, maren, async () => { await say('Maren', 'Go on with you. And River: the one you shared it with tonight. Remember who it was. That is the part that keeps.'); }, { z: 11.6, r: 1.6 });
  await g.until(() => done);
  await g.fade(1, 1);
}
