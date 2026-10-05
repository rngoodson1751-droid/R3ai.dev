// River and the Nightjar: the engine room. It runs the frame loop, the camera, River's walking,
// the things he can look at, and the little scripting helpers the chapters are written with.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { input, bindTouch } from './input.js';
import { audio } from './audio.js';
import { ui } from './ui.js';
import { CHAPTER_LIST, KEEPSAKES, KEEPSAKE } from './story.js';
import * as kit from './kit.js';
import { CHAPTERS, titleScene } from './chapters/index.js';

const { clamp, lerp, damp, smooth } = kit;
class Abort extends Error { }
const SAVE_KEY = 'nightjar-save-v1';
const blank = () => ({ v: 1, reached: 0, last: 0, keepsakes: {}, flags: {}, settings: { voice: true, music: true, fancy: true }, done: false });
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.v === 1) { const b = blank(); return Object.assign(b, s, { settings: Object.assign(b.settings, s.settings) }); } } catch (e) { /* start fresh */ } return blank(); }

// A stage is one place: its scene, who is in it, where River may walk and what he can use.
export class Stage {
  constructor(game) {
    this.game = game; this.scene = new THREE.Scene(); this.ticks = []; this.actors = []; this.cast = {}; this.items = []; this.triggers = []; this.areas = []; this.blockers = []; this.keeps = []; this.movers = [];
    this.cam = { mode: 'side', y: 2.45, z: 9.4, ox: 0, ly: 1.5, lz: 0, minX: -1e9, maxX: 1e9, minZ: -1e9, maxZ: 1e9, fov: 34, h: 6, d: 9, rate: 4.5, pos: new THREE.Vector3(), look: new THREE.Vector3(), roll: 0 };
    this.control = false; this.speed = 3.1; this.snow = null; this.sky = null; this.shake = 0; this.sway = 0;
  }
  add(o) { this.scene.add(o); return o; }
  tick(f) { this.ticks.push(f); return f; }
  untick(f) { const i = this.ticks.indexOf(f); if (i >= 0) this.ticks.splice(i, 1); }
  actor(a, x = 0, y = 0, z = 0, yaw) { a.place(x, y, z, yaw); this.scene.add(a.g); this.actors.push(a); if (a.name) this.cast[a.name] = a; return a; }
  area(x0, x1, z0, z1, y = 0) { this.areas.push({ x0, x1, z0, z1, y }); return this; }
  block(x, z, r) { this.blockers.push({ x, z, r }); return this; }
  item(o) { const it = Object.assign({ r: 1.25, y: 1.6, z: 0, on: true }, o); this.items.push(it); return it; }
  trigger(o) { const t = Object.assign({ once: true, z0: -99, z1: 99 }, o); this.triggers.push(t); return t; }
  // Lights and air in one call.
  mood({ fog = 0x13254a, density = .012, hemi = [0x8fb0ff, 0x1a2238, .55], sun = null, bg = null, env = .55 } = {}) {
    this.scene.fog = new THREE.FogExp2(fog, density); this.scene.background = new THREE.Color(bg ?? fog);
    this.scene.environment = this.game.env; this.scene.environmentIntensity = env;
    this.hemi = new THREE.HemisphereLight(hemi[0], hemi[1], hemi[2]); this.scene.add(this.hemi);
    if (sun) { this.sun = new THREE.DirectionalLight(sun[0], sun[1]); this.sun.position.set(...(sun[2] || [-6, 10, 6])); this.scene.add(this.sun); }
    return this;
  }
  inside(x, z) { for (const a of this.areas) if (x >= a.x0 && x <= a.x1 && z >= a.z0 && z <= a.z1) return a; return null; }
}

const game = {
  kit, THREE, audio, ui, input, stage: null, river: null, mode: 'boot', chapter: -1, t: 0, locked: 0, waits: [], untils: [], tok: { dead: true },
  camPos: new THREE.Vector3(0, 3, 10), camLook: new THREE.Vector3(), _tp: new THREE.Vector3(), _tl: new THREE.Vector3(), _v: new THREE.Vector3(),
  debug: { fast: 1 }, stepT: 0, slow: 0, frames: 0, calm: 1,

  boot() {
    this.save = loadSave(); ui.init(this.save); audio.enabled.music = this.save.settings.music;
    try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) this.calm = .25; } catch (e) { /* older browsers */ }   // gentler shakes for people who ask for less motion
    const canvas = document.getElementById('gl');
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(34, 1, .1, 1200);
    this.composer = new EffectComposer(r);
    this.renderPass = new RenderPass(new THREE.Scene(), this.camera); this.composer.addPass(this.renderPass);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .5, .75, .86); this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    // a small painted sky for metal to reflect, so brass and copper do not go black
    const pm = new THREE.PMREMGenerator(r), es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, vertexShader: 'varying vec3 p; void main(){ p=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: 'varying vec3 p; void main(){ vec3 c=mix(vec3(.10,.13,.22),vec3(.30,.42,.72),smoothstep(-.3,.25,p.y)); c=mix(c,vec3(.05,.09,.24),smoothstep(.2,.9,p.y)); c+=vec3(1.6,1.0,.5)*smoothstep(.93,1.,dot(p,normalize(vec3(.7,.25,.6)))); c+=vec3(.5,.9,.8)*smoothstep(.9,1.,dot(p,normalize(vec3(-.6,.6,-.4)))); gl_FragColor=vec4(c,1.); }' })));
    this.env = pm.fromScene(es, .03).texture; pm.dispose();
    this.resize(); addEventListener('resize', () => this.resize());
    bindTouch(document);
    ui.project = v => this.project(v);
    ui.on = {
      start: () => { audio.resume(); this.save.flags = {}; this.startChapter(0); },
      cont: () => { audio.resume(); this.startChapter(Math.min(this.save.last, CHAPTERS.length - 1)); },
      chapter: i => { audio.resume(); this.startChapter(i); },
      quit: () => this.toTitle(),
      setting: k => { this.persist(); if (k === 'music') audio.setEnabled('music', this.save.settings.music); if (k === 'fancy') this.resize(); },
      closed: () => { },
    };
    const wake = () => audio.resume(); addEventListener('pointerdown', wake); addEventListener('keydown', wake);
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.mode === 'chapter' && !ui.menu) ui.open('pause'); });
    ui.keepCount(Object.keys(this.save.keepsakes).length);
    const q = new URLSearchParams(location.search);
    if (q.has('auto')) { ui.auto = true; this.debug.keep = true; }
    ui.loaded();
    if (q.has('c')) this.startChapter(clamp(parseInt(q.get('c')) || 0, 0, CHAPTERS.length - 1)); else this.toTitle();
    this.last = performance.now(); requestAnimationFrame(t => this.frame(t));
  },
  persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch (e) { /* private window: play on without saving */ } },
  resize() {
    const w = innerWidth, h = innerHeight, fancy = this.save.settings.fancy;
    const pr = Math.min(devicePixelRatio || 1, fancy ? 1.75 : 1.25) * (this.slow > 1 ? .75 : 1);
    this.renderer.setPixelRatio(pr); this.renderer.setSize(w, h, false); this.composer.setPixelRatio(pr); this.composer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.bloom.enabled = fancy && this.slow < 2;
  },
  project(v) {
    const p = this._v.copy(v).project(this.camera);
    return { x: (p.x * .5 + .5) * innerWidth, y: (-p.y * .5 + .5) * innerHeight, ok: p.z < 1 && p.z > -1 };
  },

  // ----- moving between places -----
  abort() {
    this.tok.dead = true; const w = this.waits, u = this.untils; this.waits = []; this.untils = [];
    for (const x of w) x.r(); for (const x of u) x.r();
    ui.flush(); this.locked = 0; audio.stopLoops(); ui.action(false);
  },
  clearStage() {
    if (!this.stage) return;
    this.stage.scene.traverse(o => { if (o.geometry && !o.isInstancedMesh) o.geometry.dispose(); });
    this.renderer.renderLists.dispose(); this.stage = null; this.river = null; this.focus = null;
  },
  newStage() { this.clearStage(); this.stage = new Stage(this); return this.stage; },
  toTitle() {
    this.abort(); this.tok = { dead: false }; this.mode = 'title'; this.chapter = -1;
    ui.fade(1, .4);
    setTimeout(() => {
      if (this.mode !== 'title') return;
      ui.cardOff(); ui.screen('end', false); ui.hud(false);
      const st = this.newStage(); this.g = this.ctx(this.tok); titleScene(this.g, st);
      this.snapCam(); ui.screen('title', true); document.getElementById('bContinue').hidden = !(this.save.reached > 0 || this.save.last > 0);
      audio.setMood('title'); ui.fade(0, 1.2);
    }, 450);
  },
  startChapter(i) {
    this.abort(); const tok = this.tok = { dead: false }; this.mode = 'chapter'; this.chapter = i;
    this.save.last = i; this.persist();
    ui.fade(1, .45); ui.close();
    setTimeout(async () => {
      if (tok.dead) return;
      ui.screen('title', false); ui.screen('end', false); ui.hud(false);
      const info = CHAPTER_LIST[i]; ui.card(info.n, info.title); ui.chap(`${info.n}: ${info.title}`); this.cardT = this.t; this.cardUp = true;
      audio.setMood(info.mood);
      this.newStage();
      this.g = this.ctx(tok);
      try { await CHAPTERS[i](this.g); if (!tok.dead) this.finishChapter(i); }
      catch (e) { if (!(e instanceof Abort)) { console.error(e); this.lastError = e; } }
    }, 520);
  },
  finishChapter(i) {
    this.save.reached = Math.max(this.save.reached, i + 1);
    if (i + 1 < CHAPTERS.length) { this.persist(); this.startChapter(i + 1); return; }
    this.save.done = true; this.save.last = 0; this.persist(); this.mode = 'end';
    const n = Object.keys(this.save.keepsakes).length;
    document.getElementById('endStats').textContent = n === KEEPSAKES.length ? 'You found every keepsake on the line. The whole history of the railway is yours.' : `You found ${n} of ${KEEPSAKES.length} keepsakes. The rest are still out there, two in every chapter.`;
    ui.hud(false); ui.screen('end', true);
  },

  // ----- what a chapter script can do -----
  ctx(tok) {
    const G = this, chk = () => { if (tok.dead) throw new Abort(); };
    const g = {
      game: G, kit, THREE, audio, ui, input, tok, C: kit.C,
      get stage() { return G.stage; }, get river() { return G.river; }, get flags() { return G.save.flags; }, get t() { return G.t; },
      alive: () => !tok.dead, chk,
      flag(k, v) { G.save.flags[k] = v; G.persist(); },
      async wait(s) { chk(); await new Promise(r => G.waits.push({ t: s, r })); chk(); },
      async until(fn) { chk(); await new Promise(r => G.untils.push({ fn, r })); chk(); },
      // Bring up the lights: wait out the chapter card, then fade in.
      async open(secs = 1.1) {
        G.snapCam(); chk();
        if (G.cardUp) { await g.until(() => G.t - G.cardT > (ui.auto ? .2 : 2.4) || (G.t - G.cardT > .6 && input.p.act)); G.cardUp = false; ui.cardOff(); }
        ui.hud(true); ui.fade(0, secs); G.snapCam(); await g.wait(secs * .6);
      },
      async fade(v, secs = .6) { ui.fade(v, secs); await g.wait(secs + .05); },
      spawnRiver(x, z, yaw = 0, y = 0) { const r = G.river = kit.CAST.river(); G.stage.actor(r, x, y, z, yaw); return r; },
      async say(who, text, o = {}) {
        chk(); const a = G.stage && G.stage.cast[who], r = G.river;
        if (a) { a.talking = 99; if (o.emote) a.do(o.emote, o.secs || 1.8); if (a !== r && r && a.pose === 'stand' && !o.keep) a.lookAt(r.pos.x, r.pos.z); }
        if (a && r && a !== r && !o.keep && G.stage.control) r.lookAt(a.pos.x, a.pos.z);
        if (a && a !== r) G.focus = a;
        await ui.say(who, text); if (a) a.talking = 0; chk();
      },
      async narr(text) { chk(); await ui.say(null, text); chk(); },
      async choose(who, text, options) { chk(); const a = G.stage && G.stage.cast[who]; if (a) a.talking = 2.5; const v = await ui.choose(who, text, options.map(o => Array.isArray(o) ? { label: o[0], value: o[1] } : o)); chk(); return v; },
      bark(who, text, secs) { const a = typeof who === 'string' ? G.stage.cast[who] : who; if (!a) return; a.talking = 1.2; const v = new THREE.Vector3(); ui.bubble(() => v.set(a.pos.x, a.pos.y + a.height + .25, a.pos.z), text, secs); },
      goal: t => ui.goal(t), toast: (a, b, c) => ui.toast(a, b, c), big: (t, s) => ui.big(t, s), bars: on => ui.bars(on), meter: (l, v, o) => ui.meter(l, v, o),
      control(on) { G.stage.control = on; },
      shake(k) { G.stage.shake = Math.max(G.stage.shake, k); },
      // Move the camera like a film camera. dur 0 is a cut.
      async shot({ pos, look, dur = 2, fov, hold = 0 }) {
        chk(); const c = G.stage.cam; if (c.mode !== 'cine') { c.prev = c.mode; c.mode = 'cine'; }
        const p0 = G.camPos.clone(), l0 = G.camLook.clone(), p1 = new THREE.Vector3(...pos), l1 = new THREE.Vector3(...look), f0 = G.camera.fov, f1 = fov ?? f0;
        if (c.cancelShot) c.cancelShot();   // a new shot always takes over from the one before
        if (dur <= 0) { c.pos.copy(p1); c.look.copy(l1); c.fovNow = f1; G.snapCam(); }
        else {
          let k = 0, cut = false; const stg = G.stage, tick = stg.tick(dt => { k = Math.min(1, k + dt / dur); const e = smooth(k); c.pos.lerpVectors(p0, p1, e); c.look.lerpVectors(l0, l1, e); c.fovNow = lerp(f0, f1, e); });
          c.cancelShot = () => { cut = true; stg.untick(tick); c.cancelShot = null; };
          await g.until(() => k >= 1 || cut); stg.untick(tick); if (c.cancelShot && !cut) c.cancelShot = null; if (cut) return;
        }
        if (hold) await g.wait(hold);
      },
      camBack() { const c = G.stage.cam; if (c.cancelShot) c.cancelShot(); if (c.mode === 'cine') { c.mode = c.prev || 'side'; c.fovNow = null; } },
      // Walk an actor somewhere. Resolves when they arrive.
      async walk(a, x, z, speed = 2.3, faceAfter) {
        chk(); const m = { a, x, z, speed, done: false }; G.stage.movers = G.stage.movers.filter(o => o.a !== a); G.stage.movers.push(m);
        await g.until(() => m.done); if (faceAfter !== undefined) a.face(faceAfter);
      },
      collect(id) { return G.collect(id); },
      has: id => !!G.save.keepsakes[id],
      keepsake(id, x, y, z, o = {}) {
        if (G.save.keepsakes[id]) return null;
        const k = kit.makeKeepsake(KEEPSAKE[id].kind); k.position.set(x, y, z); k.visible = !o.hidden; G.stage.add(k);
        const rec = { id, g: k, x, y, z, live: !o.hidden, r: o.r || .95 }; G.stage.keeps.push(rec); return rec;
      },
      reveal(rec) { if (rec && !rec.live) { rec.live = true; rec.g.visible = true; audio.sfx('good'); } },
      // Lock the controls while something scripted happens.
      async busy(fn) { G.locked++; try { await fn(); } finally { G.locked = Math.max(0, G.locked - 1); } },
    };
    return g;
  },
  collect(id) {
    if (this.save.keepsakes[id]) return false;
    this.save.keepsakes[id] = true; this.persist(); const k = KEEPSAKE[id];
    audio.sfx('keepsake'); ui.toast('Keepsake: ' + k.title, k.text, 6.5); ui.keepCount(Object.keys(this.save.keepsakes).length);
    return true;
  },
  snapCam() { if (this.stage) this.updateCamera(0, true); },

  // ----- the frame -----
  frame(now) {
    requestAnimationFrame(t => this.frame(t));
    const raw = (now - this.last) / 1000; this.last = now; const dt = Math.min(.05, Math.max(.001, raw));
    input.poll(); const menuWas = !!ui.menu; ui.update(dt);
    if (!menuWas && !ui.menu && this.mode === 'chapter') { if (input.p.pause) { ui.pauseLead = CHAPTER_LIST[this.chapter].n + ': ' + CHAPTER_LIST[this.chapter].title; ui.open('pause'); } else if (input.p.journal && !ui.busy) ui.open('journal'); }
    const paused = !!ui.menu && this.mode === 'chapter';
    if (!paused && !this.debug.hold) for (let i = 0; i < this.debug.fast; i++) { this.step(dt); if (i < this.debug.fast - 1) { input.clear(); ui.update(dt); } }
    if (this.stage && !this.debug.noRender) {
      this.renderPass.scene = this.stage.scene;
      if (this.bloom.enabled) this.composer.render(); else this.renderer.render(this.stage.scene, this.camera);
    }
    // if the device is struggling, quietly turn the glow down
    this.frames++; if (this.frames > 60 && !this.debug.keep && !paused) { this.stepT = lerp(this.stepT || raw, raw, .05); if (this.frames % 90 === 0 && this.stepT > .034 && this.slow < 2) { this.slow++; this.resize(); } }
  },
  step(dt) {
    this.t += dt;
    for (let i = this.waits.length - 1; i >= 0; i--) { const w = this.waits[i]; w.t -= dt; if (w.t <= 0) { this.waits.splice(i, 1); w.r(); } }
    for (let i = this.untils.length - 1; i >= 0; i--) { const u = this.untils[i]; let ok = false; try { ok = u.fn(); } catch (e) { ok = true; console.error(e); } if (ok) { this.untils.splice(i, 1); u.r(); } }
    const st = this.stage; if (!st) return;
    const r = this.river, free = st.control && !ui.busy && !this.locked && r;
    if (free) this.walk(dt, st, r); else if (r && !r.scripted) r.speed = 0;
    // scripted walkers
    for (const m of st.movers) {
      const a = m.a, dx = m.x - a.pos.x, dz = m.z - a.pos.z, d = Math.hypot(dx, dz), stepLen = m.speed * dt;
      if (d <= stepLen + .02) { a.pos.x = m.x; a.pos.z = m.z; a.speed = 0; m.done = true; if (a === r) r.scripted = false; }
      else { a.pos.x += dx / d * stepLen; a.pos.z += dz / d * stepLen; a.speed = m.speed; a.targetYaw = Math.atan2(dx, dz); if (a === r) r.scripted = true; const ar = st.inside(a.pos.x, a.pos.z); if (ar && a.pos.y !== undefined && !a.noFloor) a.pos.y = damp(a.pos.y, ar.y, 12, dt); }
    }
    st.movers = st.movers.filter(m => !m.done);
    for (const a of st.actors) a.update(dt);
    for (const f of st.ticks.slice()) f(dt, this.t);
    // keepsakes turn slowly and jump into River's pocket when he is near
    for (let i = st.keeps.length - 1; i >= 0; i--) {
      const k = st.keeps[i]; k.g.userData.spin.rotation.y += dt * 1.8; k.g.position.y = k.y + Math.sin(this.t * 2.2 + i) * .07;
      if (k.live && r && (free || k.any) && Math.hypot(r.pos.x - k.g.position.x, r.pos.z - k.g.position.z) < k.r && Math.abs(r.pos.y + .8 - k.y) < 2.2) { st.keeps.splice(i, 1); st.scene.remove(k.g); this.collect(k.id); }
    }
    if (free) for (const tr of st.triggers) { if (tr.done) continue; if (r.pos.x >= tr.x0 && r.pos.x <= tr.x1 && r.pos.z >= tr.z0 && r.pos.z <= tr.z1) { if (tr.once) tr.done = true; this.runItem(tr.fn); break; } }
    if (st.sky) { st.sky.position.copy(this.camPos); st.sky.userData.update(dt, this.t); }
    if (st.snow) st.snow.update(dt, this.camPos);
    this.updateCamera(dt, false);
    this.updatePrompt(st, r, free);
  },
  walk(dt, st, r) {
    let vx = input.mx * st.speed, vz = -input.my * st.speed;
    if (st.walkFn) { st.walkFn(dt, vx, vz); return; }
    const sp = Math.hypot(vx, vz);
    if (sp > .2) {
      let nx = r.pos.x + vx * dt, nz = r.pos.z + vz * dt;
      for (const b of st.blockers) { const dx = nx - b.x, dz = nz - b.z, d = Math.hypot(dx, dz); if (d < b.r && d > .001) { nx = b.x + dx / d * b.r; nz = b.z + dz / d * b.r; } }
      if (st.inside(nx, r.pos.z)) r.pos.x = nx;
      if (st.inside(r.pos.x, nz)) r.pos.z = nz;
      r.targetYaw = Math.atan2(vx, vz); r.speed = sp;
      this.stepSnd = (this.stepSnd || 0) - dt; if (this.stepSnd <= 0) { this.stepSnd = .34; audio.sfx('step'); }
    } else r.speed = 0;
    const a = st.inside(r.pos.x, r.pos.z); if (a) r.pos.y = damp(r.pos.y, a.y, 14, dt);
  },
  runItem(fn) {
    const tok = this.tok; this.locked++;
    Promise.resolve().then(() => fn(this.g)).catch(e => { if (!(e instanceof Abort)) { console.error(e); this.lastError = e; } }).finally(() => { if (this.tok === tok) this.locked = Math.max(0, this.locked - 1); });
  },
  updatePrompt(st, r, free) {
    let best = null, bd = 1e9;
    if (free) for (const it of st.items) {
      if (!(typeof it.on === 'function' ? it.on() : it.on)) continue;
      const d = Math.hypot(r.pos.x - it.x, r.pos.z - it.z); if (d < it.r && d < bd) { bd = d; best = it; }
    }
    if (best) {
      const s = this.project(this._v.set(best.x, best.y, best.pz ?? best.z)); ui.prompt(typeof best.label === 'function' ? best.label() : best.label, s.x, s.y);
      if (input.p.act) { if (best.once) best.on = false; audio.sfx('blip'); this.runItem(g => best.use(g)); ui.prompt(null); }
    } else ui.prompt(null);
    st.near = best;
  },
  updateCamera(dt, snap) {
    const st = this.stage, c = st.cam, r = this.river, tp = this._tp, tl = this._tl;
    const px = r ? r.pos.x : 0, py = r ? r.pos.y : 0, pz = r ? r.pos.z : 0;
    if (c.mode === 'side') { const x = clamp(px + c.ox, c.minX, c.maxX); tp.set(x, c.y + (c.followY ? py : 0), c.z); tl.set(x + (c.lx || 0), c.ly + (c.followY ? py : 0), c.lz); }
    else if (c.mode === 'follow') { const x = clamp(px, c.minX, c.maxX), z = clamp(pz, c.minZ, c.maxZ); tp.set(x + (c.ox || 0), py + c.h, z + c.d); tl.set(x, py + 1.1, z); }
    else if (c.mode === 'cine') { tp.copy(c.pos); tl.copy(c.look); }
    else if (c.fn) c.fn(tp, tl, dt);
    if (this.debug.cam) { tp.set(...this.debug.cam.pos); tl.set(...this.debug.cam.look); snap = true; }
    // lean in a little while people are talking
    const talking = ui.busy && (c.mode === 'side' || c.mode === 'follow') && r;
    c._z = snap ? 1 : damp(c._z ?? 1, talking ? (c.talk ?? .8) : 1, 2.6, dt);
    if (c._z < .995 && r) {
      const w = Math.min(1, (1 - c._z) / (1 - (c.talk ?? .8) + .001)), f = this.focus && this.focus.pos, mx = f ? (px + f.x) / 2 : px, my = py + (f ? Math.max(r.height, this.focus.height) * .62 : .9);
      const dx = (clamp(mx, c.minX - 3, c.maxX + 3) - tl.x) * w, vh = 2 * Math.abs(tp.z - tl.z) * Math.tan((c.fov * c._z) * Math.PI / 360);
      tp.x += dx; tl.x += dx; tl.y = lerp(tl.y, my - vh * .17, w); tp.y = lerp(tp.y, my + .5, w * .5);
    }
    const k = snap || c.mode === 'cine' ? 1 : 1 - Math.exp(-c.rate * dt);
    this.camPos.lerp(tp, k); this.camLook.lerp(tl, k);
    const cam = this.camera; cam.position.copy(this.camPos);
    if (st.shake > 0) { const s = st.shake * this.calm; cam.position.x += (Math.random() - .5) * s; cam.position.y += (Math.random() - .5) * s; st.shake = Math.max(0, st.shake - dt * (st.shakeHold ? 0 : 1.6) * Math.max(.3, s)); }
    cam.lookAt(this.camLook);
    cam.rotation.z += c.roll * this.calm + (st.sway ? (Math.sin(this.t * 1.7) * st.sway + Math.sin(this.t * 4.3) * st.sway * .3) * this.calm : 0);
    const fov = (c.fovNow ?? c.fov) * (c.mode === 'cine' ? 1 : c._z ?? 1), wide = cam.aspect < 1 ? 1 + (1 - cam.aspect) * .9 : 1;
    const f = snap ? fov * wide : damp(cam.fov, fov * wide, 5, dt); if (Math.abs(f - cam.fov) > .01) { cam.fov = f; cam.updateProjectionMatrix(); }
  },
};

window.__nj = game;
try { game.boot(); }
catch (e) {
  console.error(e);
  const l = document.getElementById('loading'); if (l) l.textContent = 'This game needs 3D graphics (WebGL), and this browser would not start them. Try Chrome, Edge, Safari or Firefox on a newer device.';
}
