// Chapter One: The Impossible Train. Meet the other travelers and poke about the carriages.
import { kit, CAST, trainStage, sit, talk, look } from './common.js';
const { THREE, M, G, mesh, C, sprite, glowMat } = kit;

// Seats the five friends where they sit for most of the ride. Other chapters reuse it.
export function seatFriends(g, cars, where = {}) {
  const st = g.stage, f = {};
  const put = (name, car, booth, side) => { const a = CAST[name](); st.actor(a); sit(a, cars[car].booths[booth].seats[side]); f[name] = a; return a; };
  put('tavi', ...(where.tavi || [0, 1, 0])); put('bo', ...(where.bo || [0, 3, 1])); put('wren', ...(where.wren || [1, 1, 0])); put('dex', ...(where.dex || [1, 3, 1]));
  f.mari = st.actor(CAST.mari(), ...(where.mariAt || [cars[1].x0 + 3.2, 0, -.2, .3]));
  // Admiral the walrus rides on Bo's table
  const b = cars[(where.bo || [0, 3, 1])[0]].booths[(where.bo || [0, 3, 1])[1]];
  f.admiral = kit.makeWalrus(); f.admiral.position.set(b.table.x + .1, b.table.y, b.table.z + .25); f.admiral.rotation.y = -.5; st.add(f.admiral);
  return f;
}

export default async function chapter1(g) {
  const { say, narr, choose, audio } = g;
  const st = g.stage;
  const cars = trainStage(g, { cars: [{ doors: [false, true] }, { doors: [true, false] }] });
  const A = cars[0], B = cars[1];
  const river = g.spawnRiver(A.x0 + 1.4, .9, Math.PI / 2);
  const f = seatFriends(g, cars);
  // Tavi's snow-compass on the table
  const tb = A.booths[1].table, comp = new THREE.Group(); comp.position.set(tb.x - .1, tb.y + .03, tb.z + .2); st.add(comp);
  mesh(G.cyl(.13, .13, .05, 16), M(C.brass, { metal: .8, rough: .3 }), 0, 0, 0, comp); const needle = mesh(G.box(.2, .02, .03), glowMat(C.ice, 1.5), 0, .04, 0, comp);
  st.tick((dt, t) => { needle.rotation.y = t * 5 + Math.sin(t * 2.3) * 2; });
  // Wren's notebook
  const wb = B.booths[1].table; const note = mesh(G.box(.34, .03, .26), M(0x3a2f5a, { rough: .9 }), wb.x - .15, wb.y + .02, wb.z + .2, st.scene); note.rotation.y = .3; mesh(G.box(.3, .01, .22), M(0xf6ecd8), wb.x - .15, wb.y + .04, wb.z + .2, st.scene).rotation.y = .3;
  // route board above the windows of the second carriage
  const board = kit.sign('· · · · · · ·  ✦\nNORTH', 2.0, .62, { font: 'bold 34px Georgia, serif', w: 400, h: 124 }); board.position.set(B.cx + 5.1, 2.72, -2.02); st.add(board);
  g.keepsake('k04', A.x1 + 1.2, 1.0, .9);
  const badge = g.keepsake('k03', A.booths[2].x - .9, .55, .35, { hidden: true });

  const met = {}; const count = () => Object.keys(met).length;
  const meet = n => { if (!met[n]) { met[n] = true; audio.sfx('good'); g.goal(count() < 5 ? `Meet the other travelers (${count()} of 5)` : 'Go and find Ibby at the front of the carriage'); } };

  talk(g, f.tavi, async () => {
    if (!met.tavi) {
      await say('Tavi', "HI! I'm Tavi! Did you SEE the rails? They are not metal! I licked one.", { emote: 'wave' });
      await say('Tavi', 'Do not lick one.');
      await say('River', "I'm River. What is that thing?");
      await say('Tavi', 'A snow-compass. I built it. It points at the nearest snowman.');
      await say('River', 'It is pointing everywhere.');
      await say('Tavi', "That's how I know it works!", { emote: 'cheer' });
      meet('tavi');
    } else await say('Tavi', 'If I had a longer screwdriver I could find out what the train runs on. Probably. Maybe.');
  });
  talk(g, f.bo, async () => {
    if (!met.bo) {
      await say('Bo', "I'm Bo. This is Admiral. He is a walrus.", { emote: 'shiver' });
      await say('Bo', 'Admiral is not scared. He just wants to know when we get there. And if it is far. And if it is dark.');
      const v = await choose('River', 'Bo is holding the edge of the table very tightly.', [['Sit with Bo for a minute', 'sit'], ['Tell him it will be fine', 'fine']]);
      g.flag('comfortBo', v === 'sit');
      if (v === 'sit') { await say('River', "I'm a little scared too. Mostly I am curious. They feel almost the same from the inside."); await say('Bo', 'Admiral says you can sit here any time you want.', { emote: 'nod' }); f.bo.smile = true; }
      else { await say('River', "It'll be fine. Trains know where they are going."); await say('Bo', 'Okay. I will tell Admiral.'); }
      meet('bo');
    } else await say('Bo', g.flags.comfortBo ? 'Admiral saved you a seat.' : 'Are we there yet? Admiral is asking.');
  });
  talk(g, f.mari, async () => {
    if (!met.mari) {
      await say('Mari', 'Marisol. Everybody says Mari.', { emote: 'nod' });
      await say('Mari', 'I have counted. Six kids, one Wayfinder, and zero grown-ups in charge. So I am in charge.');
      await say('River', "I'm River.");
      await say('Mari', 'Good. Stay where I can count you, River.', { emote: 'point' });
      meet('mari');
    } else await say('Mari', 'Still six. I checked twice.');
  }, { z: 1.0 });
  talk(g, f.wren, async () => {
    if (!met.wren) {
      await narr('The girl in the purple hood does not say anything. She turns her notebook around.');
      await narr('It is a drawing of a boy in a green hat, looking out of a bedroom window.');
      await say('River', "That's me. How did you draw that? You only just met me.");
      await say('Wren', 'I draw what I notice. Sometimes I notice early.');
      await say('Wren', "I'm Wren.");
      meet('wren');
    } else await say('Wren', 'I am drawing the train. It keeps changing when I look away.');
  });
  talk(g, f.dex, async () => {
    if (!met.dex) {
      await say('Dex', "Let me save you some time. It's a trick.", { emote: 'shrug' });
      await say('Dex', 'Screens in the windows. A big fan for the wind. My cousin did an escape room exactly like this.');
      const v = await choose('River', 'Dex folds his arms and waits.', [['Maybe you are right', 'maybe'], ['The cold felt real to me', 'cold']]);
      g.flag('dexMaybe', v === 'maybe');
      if (v === 'maybe') { await say('Dex', 'Finally. Somebody sensible.'); await say('River', "I didn't say you are right. I said maybe."); }
      else { await say('Dex', 'Feelings are not proof.'); await say('River', 'No. But they are a clue.'); }
      await say('Dex', "I'm Dex. Wake me up when the actors come out.");
      meet('dex');
    } else await say('Dex', 'Very good screens, though. I will give them that.');
  });

  look(g, A.cx - 1.7 - 1.7, 2.3, -2.0, 'Look out the window', async g => {
    g.bars(true); river.g.visible = false;
    await g.shot({ pos: [A.cx - 3.4, 1.75, -1.6], look: [A.cx + 30, -1.4, -30], dur: 1.6, fov: 56 });
    await narr('Pine trees rush past like a crowd, all waving at once.');
    await g.shot({ pos: [A.cx - 3.4, 1.9, -2.5], look: [A.cx + 14, -1.6, -1.4], dur: 2.2, fov: 56 });
    await narr('Below the window, the rails of light pour out of the dark ahead and melt away behind.');
    river.g.visible = true; g.camBack(); g.bars(false);
    await say('River', 'No tracks before us and no tracks after us. So how would anybody ever know we were here?');
  }, { wz: .5, r: 1.3 });
  look(g, A.booths[2].x, 1.6, -1.2, 'Look under the seat', async g => {
    await narr('An empty booth. Somebody sat here once and left something behind.');
    g.reveal(badge);
  }, { wz: .5, r: 1.2, once: true });
  look(g, B.cx + 5.1, 3.25, -2.0, 'Look at the route board', async () => {
    await narr('A route board. There are no station names on it. Just a dotted line going up, and at the very top, one small star.');
    await say('River', 'A clue. We are going to a star. Or to somewhere underneath one.');
    g.flag('sawBoard', true);
  }, { wz: .5, r: 1.4 });
  look(g, A.x0 + .2, 2.6, .9, 'Try the back door', async () => { await narr('Locked. Through the little round window there is another carriage, and another after that, all dark.'); await say('River', 'How long IS this train?'); }, { wz: .9, r: 1.1 });

  await g.open();
  await narr('Inside, the Nightjar was warm, and smelled of oranges and hot brass.');
  g.goal('Meet the other travelers (0 of 5)'); g.control(true);
  await g.until(() => count() >= 5 && !g.ui.busy && !g.game.locked);

  // Ibby comes through from the front
  const ibby = st.actor(CAST.ibby(), B.x1 - .8, 0, .9, -Math.PI / 2);
  audio.sfx('fork'); g.bark(ibby, 'Travelers!', 3);
  await g.walk(ibby, B.x1 - 2.6, .9, 2);
  let done = false;
  talk(g, ibby, async g => {
    await say('Ibby', 'Has everybody met everybody? Good. A journey goes better when you know who you are on it with.', { emote: 'nod' });
    await say('Ibby', 'Now gather round, all of you. It is time for your waymarks.');
    done = true;
  }, { z: .9, r: 1.6 });
  await g.until(() => done);
  await g.fade(1, .8);
}
