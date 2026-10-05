// Epilogue: The Journey Home. Friends on the last ride, a quiet morning, and a star in a coat pocket.
import { kit, CAST, trainStage, talk, look } from './common.js';
import { seatFriends } from './c01.js';
import { bedroom } from './c00.js';
const { THREE, M, G, mesh, C, sprite, glowMat, damp, lerp, clamp } = kit;

export default async function epilogue(g) {
  const { say, narr, choose, wait, audio } = g;
  let st = g.stage;
  const cars = trainStage(g, { cars: [{ doors: [false, true] }, { doors: [true, false] }], speed: 14, sky: { aurora: .6, top: 0x0b1638, mid: 0x2a3f7a, low: 0x9a7fa8 } });
  st.scene.fog.color.setHex(0x2a3566);
  const A = cars[0], B = cars[1], F = g.flags;
  let river = g.spawnRiver(B.x1 - 3, .9, -Math.PI / 2);
  const f = seatFriends(g, cars);
  f.bo.hand(0).add(f.admiral); f.admiral.position.set(0, -.05, .12); f.admiral.rotation.set(0, 0, 0);
  const star = kit.makeKindlingStar(); river.hand(1).add(star); star.position.set(0, .02, .12);
  let near = 0; st.tick(dt => { let d = 9; for (const n of ['tavi', 'bo', 'wren', 'dex', 'mari']) d = Math.min(d, Math.hypot(f[n].pos.x - river.pos.x, 0)); near = damp(near, d < 2.2 ? .7 : .1, 3, dt); star.userData.setGlow(near); });
  g.keepsake('k21', A.x0 + 1.4, 1.0, .9);
  const said = {}, count = () => Object.keys(said).length, hear = n => { if (!said[n]) { said[n] = true; audio.sfx('good'); g.goal(count() < 5 ? `Talk to your friends on the way home (${count()} of 5)` : 'Go and see Ibby at the front'); } };
  talk(g, f.tavi, async () => {
    await say('Tavi', 'I worked out what the train runs on. Light. And gears. And a third thing.', { emote: 'think' });
    await say('River', 'What is the third thing?');
    await say('Tavi', '"I do not know yet." I have never had that for an answer before. I think I like it.');
    hear('tavi');
  });
  talk(g, f.bo, async () => {
    if (F.comfortBo) await say('Bo', 'You sat with me. Right at the start, before any of it happened. I remember that part best.');
    await say('Bo', 'Next year I am going in the dark carriage myself. Admiral is going to hold MY hand.', { emote: 'nod' });
    await say('Bo', F.sharedWith === 'bo' || F.sharedWith === 'all' ? 'And I held a star. Nobody at home is going to believe me. That is all right. I was there.' : 'And he is not sliding anywhere. I have got him.');
    hear('bo');
  });
  talk(g, f.mari, async () => {
    await say('Mari', 'I stopped counting. For a whole minute, when the lantern lit. I do not even know how many seconds it was.', { emote: 'think' });
    await say('Mari', 'I think that might have been the point.');
    await say('Mari', 'Six going home, though. I did count that. Six.');
    hear('mari');
  }, { z: 1.0 });
  talk(g, f.wren, async () => {
    await narr('Wren turns her notebook to the very last page. All six of them, and a walrus, in a parcel cart, mouths wide open.');
    await say('Wren', 'I drew this one late. After it happened. It is better that way round.');
    if (F.sharedWith === 'wren') await say('Wren', 'You can have the first page. The two hands. It was always yours.');
    hear('wren');
  });
  talk(g, f.dex, async () => {
    await say('Dex', 'I had a list. Screens. Fans. Actors. I crossed them off one at a time.', { emote: 'shrug' });
    await say('Dex', 'There is one left. "Really big projector." I am not crossing it off. But I am not sure about it any more either. Is that allowed?');
    await say('River', F.trustVesper ? 'Somebody told me it is a door you leave on the latch.' : 'I think it is the best kind of not sure.');
    await say('Dex', '...Okay. I can live with a latch.');
    hear('dex');
  });
  look(g, B.cx - 3.4, 2.3, -2.0, 'Look out the window', async () => { await narr('The trees were going the other way now. Behind the mountains, one thin line of the sky had started to turn the colour of a peach.'); }, { wz: .5, r: 1.3 });

  await g.open();
  await narr('The Nightjar ran south with the dark still on her side, and nobody in the carriage wanted to be the first to fall asleep.');
  g.goal('Talk to your friends on the way home (0 of 5)'); g.control(true);
  await g.until(() => count() >= 5 && !g.ui.busy && !g.game.locked);
  const ibby = st.actor(CAST.ibby(), B.x1 - .8, 0, .9, -Math.PI / 2); await g.walk(ibby, B.x1 - 2.4, .9, 2);
  let home = false;
  talk(g, ibby, async () => {
    await say('Ibby', 'Hold up your waymark, River. Let us see what it drew.');
    await narr('The frost had finished. On the little glass disc there was a star, very small, with two hands round it.');
    await say('River', 'What does it mean?');
    await say('Ibby', 'It is yours. I only hand them out. Mine was a lighthouse. I never did work it all the way out, and I have had forty years.', { emote: 'shrug' });
    audio.sfx('fork'); st.scenery.speed = 6;
    await say('Ibby', 'And here is your street. She has stopped right where she found you.');
    home = true;
  }, { z: .9, r: 1.6 });
  await g.until(() => home);
  g.control(false);
  await say('Bo', 'Bye, River! Admiral says bye! Admiral says come next year!', { keep: true, emote: 'wave' });
  await say('Mari', 'Five. That is the right number now. Go on. I have got them.', { keep: true });
  await say('Dex', 'See you, roof boy.', { keep: true, emote: 'wave' });
  await g.fade(1, 1.2);
  await narr('River did not remember climbing the stairs. He only remembered the cold of the banister, and a hum getting further and further away.');

  // ---------- morning ----------
  g.audio.stopLoops(); g.audio.setMood('home'); g.goal(null);
  const Bd = bedroom(g, { morning: true }); st = Bd.st;
  river = g.spawnRiver(-4.7, -.45, .5); river.pose = 'sit'; river.pos.y = .56;
  Bd.dog.pose = 'sit'; Bd.dog.wag = 1; Bd.dog.pos.set(2.4, 0, .4); Bd.dog.targetYaw = -1.2;
  g.keepsake('k22', 3.6, 1.0, 1.2);
  const star2 = kit.makeKindlingStar(); let have = false, shown = false, looked = false, done = false, gk = 0, gT = 0;
  st.tick(dt => { gk = damp(gk, gT, 2.2, dt); star2.userData.setGlow(gk); star2.rotation.y += dt * gk * 2; });
  look(g, -2.9, 2.2, -1.9, 'Look out the window', async g => {
    g.bars(true); river.g.visible = false;
    await g.shot({ pos: [-2.9, 2.1, -2.5], look: [1, -1.6, -14], dur: 1.6, fov: 56 });
    await narr('The street. Only the street. No rails. Not a track, not a groove, not one mark in the new snow.');
    await narr('Only the snowman, who had been looking down the road last night, and was now facing the house.');
    river.g.visible = true; g.camBack(); g.bars(false); looked = true;
    await say('River', 'A dream, then. A really long one. ...Probably.');
    g.goal('Check your coat');
  }, { wz: -.9, r: 1.5 });
  look(g, -1.9, 2.0, -1.1, 'Check your coat pocket', async g => {
    have = true; audio.sfx('pick'); river.hand(1).add(star2); star2.position.set(0, .02, .12); river.pose = 'hold';
    await narr('Something small and cold and heavy, with points on it.');
    await say('River', 'It is real. It is right here. It is cold and it is heavy and it is REAL.', { emote: 'jump' });
    await say('River', '...But it is not lit.');
    await say('River', 'It does not work alone.');
    g.goal('Find somebody to share it with');
  }, { wz: -.3, r: 1.3, on: () => looked && !have });
  look(g, 2.4, 1.5, .4, 'Show Justice', async g => {
    if (!have) { audio.sfx('woof'); await narr('Justice thumps her tail. She has been waiting by the door all night, and she is not going to say why.'); return; }
    shown = true; gT = .6; audio.sfx('star'); audio.sfx('woof'); Bd.dog.wag = 2;
    await narr('River held it out. Justice put her nose on it, very gently, the way she does with things that matter.');
    await narr('And the little brass star lit up like a window.');
    // Mom and Dad
    const mom = st.actor(CAST.mom(), 6.6, 0, -1.2, 0), dad = st.actor(CAST.dad(), 5.7, 0, -1.3, 0);
    g.walk(mom, 4.7, .5, 1.6, -1.3).catch(() => { }); await g.walk(dad, 4.1, -.5, 1.6, -1.1);
    await say('Dad', 'Morning, buddy. You are up early.', { emote: 'wave' });
    await say('Mom', 'What have you got there? Is that a little lantern?');
    const v = await choose('River', 'Mom, Dad and Justice are all looking at the star.', [['"It is a star. Want to hold it with me?"', 'hold'], ['"I will tell you at breakfast. It is a long story."', 'later']]);
    g.flag('ending', v); gT = 1; audio.sfx('star');
    if (v === 'hold') { await narr('Four hands and one nose. The star had never been so bright.'); await say('Dad', 'How does it do that?'); await say('River', 'Good question. Keep it.'); }
    else { await say('Dad', 'A long story? Then I will make the big pancakes.'); await narr('They all went down to breakfast together, and the star, between them, shone the whole way down the stairs.'); }
    await narr('River never did find out how the Nightjar found his street, or who the old man in the hat was, or where the star goes when it is dark.');
    g.control(false); g.goal(null); g.bars(true);
    g.shot({ pos: [3.4, 2.3, 8.2], look: [3.5, 1.2, 0], dur: 9, fov: 30 }).catch(() => { });
    await narr('He kept the questions. He kept the star, too. It lit every single time.');
    done = true;
  }, { wz: .9, r: 1.6, on: () => !shown });
  await g.fade(0, 1.4);
  await narr('Morning. The ordinary kind.');
  river.pose = 'stand'; river.pos.y = 0; river.pos.z = .2; river.face(0);
  await say('River', '...Was that...?', { emote: 'think' });
  g.goal('Look out the window'); g.control(true);
  await g.until(() => done);
  await wait(1.5);
}
