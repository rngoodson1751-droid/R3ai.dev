// Chapter Five: Car Nought. River goes back alone for Admiral and meets somebody who will not say what he is.
import { kit, CAST, trainStage, sit, talk, look } from './common.js';
const { THREE, M, G, mesh, C, sprite, glowMat, damp, lerp, clamp } = kit;

export default async function chapter5(g) {
  const { say, narr, choose, wait, audio } = g;
  const st = g.stage;
  const [N, B] = trainStage(g, { cars: [{ len: 18, style: 'old', doors: [false, true] }, { len: 12, booths: false, doors: [true, true] }], speed: 12, hemi: .26, trees: 120 });
  st.sway = .006;
  // the baggage car: crates, trunks and parcels
  const r = kit.rng(5);
  for (let i = 0; i < 9; i++) { const w = .7 + r() * .7, h = .5 + r() * .7; const c = i % 3 === 0 ? kit.gift(w, h, .7, [0x2a8f8a, 0x3566c0, 0x7a5ab8][i % 3 | 0]) : kit.crate(w, h, .8); c.position.set(B.x0 + 1.2 + i * 1.15, i % 4 === 3 ? .9 : 0, -1.4 + r() * .3); c.rotation.y = (r() - .5) * .3; st.add(c); }
  // Car Nought: dust sheets, stopped clocks, a line of old waymarks, a music box
  for (const bi of [1]) { const b = N.booths[bi]; const s = mesh(G.rbox(2.9, 1.25, 1.75, .3), M(0xb8c0d4, { rough: 1 }), b.x, .66, -1.2, st.scene); s.rotation.y = (r() - .5) * .06; mesh(G.sph(.5, 10, 8), M(0xb8c0d4, { rough: 1 }), b.x - .8, 1.2, -1.2, st.scene).scale.set(1, .5, 1.4); }
  const clocks = [];
  for (let i = 0; i < 6; i++) { const c = new THREE.Group(); c.position.set(N.x0 + 2 + i * 2.8, 2.68, -1.98); st.add(c); mesh(G.cyl(.3, .3, .06, 20), M(0xdfe6f2), 0, 0, 0, c).rotation.x = Math.PI / 2; mesh(G.torus(.3, .04, 20), M(0x7d8aa8, { metal: .6, rough: .4 }), 0, 0, .03, c); for (const [l, a] of [[.2, i * 1.1], [.14, i * 2.3 + 1]]) { const h = mesh(G.box(.03, l, .02), M(0x1a2238), 0, l / 2, .05, new THREE.Group()); h.parent.rotation.z = a; c.add(h.parent); if (l > .15) clocks.push(h.parent); } }
  const marks = [];
  for (let i = 0; i < 16; i++) { const m = kit.makeWaymark(i % 4 === 0 ? C.aurora : C.ice); m.position.set(N.x0 + 1.4 + i * 1.02, 2.12 + Math.sin(i * 1.7) * .08, -1.55); m.scale.setScalar(.8); st.add(m); marks.push(m); mesh(G.cyl(.004, .004, .34, 4), M(0xdfe6f2), m.position.x, 2.3, -1.55, st.scene); }
  st.tick((dt, t) => { marks.forEach((m, i) => { m.rotation.y = Math.sin(t * .8 + i) * .6; }); clocks[2].rotation.z += dt * .7; });
  const mb = N.booths[2].table, box = new THREE.Group(); box.position.set(mb.x, mb.y + .02, mb.z + .15); st.add(box);
  mesh(G.rbox(.34, .16, .24, .03), M(0x5a3a52, { rough: .5 }), 0, .08, 0, box); const lid = new THREE.Group(); lid.position.set(0, .16, -.12); box.add(lid); mesh(G.rbox(.34, .04, .24, .02), M(0x6e4866, { rough: .5 }), 0, .02, .12, lid);
  const cyl = mesh(G.cyl(.05, .05, .24, 10), M(C.brass, { metal: .8, rough: .25 }), 0, .17, 0, box); cyl.rotation.z = Math.PI / 2; let boxOn = 0;
  st.tick(dt => { lid.rotation.x = damp(lid.rotation.x, boxOn > 0 ? -1.1 : 0, 6, dt); if (boxOn > 0) { boxOn -= dt; cyl.rotation.x += dt * 3; } });
  for (let i = 0; i < 3; i++) { const t = kit.crate(.9 + i * .1, .5, .6, 0x6a7088); t.position.set(N.x0 + 1.0 + (i % 2) * .2, i * .5, -.9); st.add(t); }
  const admiral = kit.makeWalrus(); admiral.position.set(N.x0 + 2.4, 0, .7); admiral.rotation.y = 1.2; st.add(admiral); sprite(C.amber, 1.2, 0, .2, 0, admiral, .25);
  // the door between the two cars, which will shut and frost over
  const door = new THREE.Group(); door.position.set(N.x1, 0, .9); door.visible = false; st.add(door);
  mesh(G.box(.1, 2.3, 1.5), M(0x4a5a78, { rough: .5 }), 0, 1.15, 0, door); mesh(G.box(.12, 2.3, 1.5), new THREE.MeshStandardMaterial({ map: kit.T.frostGlass(), color: 0xdff4ff, transparent: true, opacity: .9, emissive: 0x4ab8e8, emissiveIntensity: .3 }), .02, 1.15, 0, door);
  // a hatch in the floor
  const hx = N.x0 + 10.4; const hatch = mesh(G.box(1.1, .04, 1.0), M(0x3a4558, { metal: .4, rough: .6 }), hx, .02, .95, st.scene); mesh(G.torus(.1, .02, 10), M(C.brass, { metal: .7 }), hx + .3, .05, .95, st.scene).rotation.x = Math.PI / 2;

  const river = g.spawnRiver(B.x1 - 2.2, .9, -Math.PI / 2);
  const bo = st.actor(CAST.bo(), B.x1 - 1.0, 0, .9, -Math.PI / 2);
  const vesper = st.actor(CAST.vesper()); sit(vesper, N.booths[0].seats[1]); vesper.g.visible = false;
  // the long ribbon of luggage tags he is mending
  const ribbon = new THREE.Group(); vesper.rig.add(ribbon); for (let i = 0; i < 9; i++) mesh(G.box(.16, .01, .1), M([0xd8c9a0, 0xb9a57a, 0xc8b68e][i % 3], { rough: 1 }), .1 + i * .13, 1.02 - i * i * .012, .5 + Math.sin(i) * .05, ribbon).rotation.y = i * .3;
  const wren = st.actor(CAST.wren()); sit(wren, N.booths[3].seats[0]); wren.g.visible = false;
  g.keepsake('k11', N.x0 + 13.2, 1.0, 1.2);
  const k12 = g.keepsake('k12', N.booths[0].seats[1].x - .4, 1.0, .5, { hidden: true });
  st.cam.maxX = B.x1 - 4.2;

  let phase = 0, gotAdmiral = false, done = false;
  talk(g, bo, async () => { await say('Bo', phase < 1 ? 'He is in there. I can hear him being brave.' : 'Did you find him?'); }, { on: () => phase < 2 });
  look(g, N.x0 + 9, 3.2, -1.55, 'Look at the old waymarks', async () => {
    await narr('Old waymarks, dozens of them, hung up like a line of washing. Every one has a different frost picture grown across it.');
    await narr('A dog. A lighthouse. Two hands, holding. One has no picture at all, only the first thin feather.');
  }, { wz: .5, r: 1.5 });
  look(g, N.x0 + 7.6, 3.3, -2.0, 'Look at the clocks', async () => { await narr('Six station clocks, all stopped at different times. No, five stopped. The third one is going, very slowly, the wrong way.'); await say('River', 'I do not like that one.'); }, { wz: .5, r: 1.3 });
  look(g, mb.x, 1.6, mb.z, 'Wind the music box', async () => { audio.sfx('box'); boxOn = 3; await narr('A thin little tune, with one note that does not belong. It stops exactly where it wants to.'); }, { wz: .5, r: 1.2 });
  look(g, N.x0 + 2.4, 1.1, .7, 'Pick up Admiral', async g => {
    gotAdmiral = true; st.scene.remove(admiral); river.hand(0).add(admiral); admiral.position.set(0, -.05, .12); admiral.rotation.set(0, 0, 0); audio.sfx('pick');
    await say('River', 'There you are, Admiral. You slid a long way.');
    await meetVesper();
  }, { wz: .9, r: 1.2, once: true });
  look(g, N.x1 - .3, 2.6, .9, 'Try the door', async () => {
    if (phase < 3) { await narr('Shut. It was open a moment ago.'); return; }
    await narr('Frozen shut. Frost has grown right across the handle in the shape of a fern.');
    await say('Wren', 'There is a hatch in the floor. I drew it before we came in.', { emote: 'point' });
    hatchItem.on = true; g.goal('Open the hatch in the floor');
  }, { wz: .9, r: 1.2, on: () => phase >= 1 });
  const hatchItem = look(g, hx, 1.0, .95, 'Open the hatch', async g => {
    audio.sfx('clank'); hatch.rotation.z = 1.1; hatch.position.y = .4; hatch.position.x = hx - .5;
    await narr('Under the hatch, a ladder went down into warm green light and the sound of something enormous breathing.');
    await say('River', 'That is the wrong way. That is down.');
    await say('Wren', 'It is the only way that is not frozen.');
    await say('River', '...After you, Admiral.');
    done = true;
  }, { wz: .95, r: 1.2, on: false });
  st.trigger({ x0: N.x1 - 3.4, x1: N.x1 - 2.4, fn: async g => {
    phase = 1; door.visible = true; audio.sfx('lever'); bo.g.visible = false;
    await narr('Behind River, the door swung shut with a soft click. The blue lamps did not so much light the carriage as remember it.');
    g.goal('Find Admiral');
  } });

  async function meetVesper() {
    phase = 2; g.goal(null);
    st.lampDim = .2; audio.sfx('fork'); await wait(.5); vesper.g.visible = true; st.lampDim = 1;
    await say('Vesper', 'He has come a long way, for a walrus.', { keep: true });
    river.do('jump', .6);
    await say('River', 'Who are you? Are you a passenger?');
    await say('Vesper', 'I have a seat. I am no longer certain that makes me a passenger.', { keep: true });
    await say('Vesper', 'Vesper. I mend the tags. Everyone who ever rode this carriage left one, and tags fray.', { keep: true });
    const a = await choose('River', 'River holds Admiral a little tighter.', [['Do you work for the train?', 'work'], ['Are you a ghost?', 'ghost'], ['Am I dreaming this?', 'dream']]);
    g.flag('vesperAsk', a);
    if (a === 'work') await say('Vesper', 'I have done work on it. That is not quite the same thing. And I have never been paid, unless it was in advance.', { keep: true });
    else if (a === 'ghost') { await say('Vesper', 'What a direct boy. I have asked myself.', { keep: true }); await say('Vesper', 'I am cold, but so is everybody in this carriage. I am old, but so is the carriage. It is not proof either way, is it?', { keep: true }); }
    else await say('Vesper', 'Whose dream? If it is yours, you have given me very tired knees, and I should like a word with you about that.', { keep: true });
    await say('Vesper', 'You are the one with the questions. I heard you through the floor. "Is this real." You ask it like a boy checking his pockets.', { keep: true });
    await say('Vesper', 'So here is one back. That walrus. Is he real?', { keep: true });
    const b = await choose('River', 'Admiral looks up with his two black button eyes.', [['He is a toy. Toys are not alive.', 'toy'], ['He is real to Bo.', 'bo'], ["I don't know.", 'dunno']]);
    g.flag('vesperWalrus', b);
    if (b === 'toy') { await say('Vesper', 'Correct. Stuffing and stitches. And yet you walked the whole length of a dark train for him. Why so much trouble, for stuffing?', { keep: true }); await say('River', 'Because Bo is scared without him.'); await say('Vesper', 'Ah. So something real is riding on something that is not. Interesting, where that leaves us.', { keep: true }); }
    else if (b === 'bo') { await say('Vesper', 'And is "real to Bo" a smaller thing than "real"? You crossed a dark train on the strength of it.', { keep: true }); }
    else { await say('Vesper', 'Good. "I do not know" is the door most people nail shut. Leave yours on the latch.', { keep: true }); }
    await say('Vesper', 'You can weigh a walrus. You cannot weigh a promise. You made one of those at the door back there.', { keep: true });
    await say('Vesper', 'Which of the two has carried you further tonight?', { keep: true });
    await say('River', '...The promise.');
    await say('Vesper', 'Then go carefully, before you decide that only the things you can weigh are there.', { keep: true });
    const c = await choose('River', 'The old man goes on stitching, as if he had only remarked on the weather.', [['I think I believe you.', 'trust'], ['I think you are just saying clever things.', 'doubt']]);
    g.flag('trustVesper', c === 'trust');
    if (c === 'trust') await say('Vesper', 'Do not believe me. I am a stranger in a dark carriage. Believe what you did tonight. You were there for that.', { keep: true });
    else await say('Vesper', 'I am. That does not make them wrong. Keep that too: who says a thing, and whether it is so, are two different questions.', { keep: true });
    // the blink
    st.lampDim = 0; audio.sfx('box'); boxOn = 3; await wait(.7); vesper.g.visible = false; wren.g.visible = true; st.lampDim = 1;
    await narr('The blue lamps went out, all of them at once, for exactly as long as a blink.');
    await say('River', 'Hello? ...Mister Vesper?');
    await narr('On the seat where he had been sitting there was not even a dent. Only a single luggage tag, with a stamp on it.');
    g.reveal(k12);
    await g.walk(river, wren.pos.x - .2, .6, 2.6);
    await say('River', 'Wren! How long have you been there?', { emote: 'jump' });
    await say('Wren', 'Since the door. You did not notice. I notice things. I do not get noticed. It evens out.');
    await say('River', 'Did you see him? The man in the hat?');
    await narr('Wren turns her notebook around. She has drawn the empty seat, twice.');
    await say('Wren', 'I did not draw anybody in it. But look. In the second one there is a dent.');
    phase = 3; g.goal('Take Admiral back to Bo');
  }

  await g.open();
  await say('Bo', 'He slid. When the train went sideways. He slid right under that door and all the way to the back.', { emote: 'shiver' });
  await say('Bo', 'It is dark in there. I do not go in dark carriages. Admiral does, but only by accident.');
  const v = await choose('River', 'Past the baggage car there is one more carriage. Nobody has turned its lamps up in a long time.', [["I'll go. Wait here.", 'solo'], ['Come with me. We will go together.', 'together']]);
  g.flag('invitedBo', v === 'together');
  if (v === 'together') { await say('Bo', 'I... I will guard the door. Somebody has to guard the door.'); await say('River', 'That is true. It is an important door.'); }
  else await say('Bo', 'You promise you will bring him back?');
  await say('River', 'I promise.', { emote: 'nod' });
  g.goal('Go back through the baggage car'); g.control(true);
  await g.until(() => done);
  await g.fade(1, .9);
}
