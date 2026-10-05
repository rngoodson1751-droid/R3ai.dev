// River and the Nightjar: the building kit.
// Everything you see is made here from simple shapes and painted textures. There are no image files.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const C = {
  night: 0x0a1430, deep: 0x13254a, dusk: 0x24407a, amber: 0xffb655, glow: 0xffd08a, cream: 0xf6ecd8,
  teal: 0x2a8f8a, tealDark: 0x17494f, tealDeep: 0x0f3238, copper: 0xc9783f, brass: 0xd9a441,
  frost: 0xcfe9f5, snow: 0xeaf3fb, ice: 0x9fe6ff, aurora: 0x6dffc0, violet: 0x8f7bff,
  wood: 0x7a5236, woodDark: 0x432b1e, iron: 0x2a3340, rock: 0x2a3550,
};

// ---------- small maths ----------
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => t * t * (3 - 2 * t);
export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function angleDamp(a, b, rate, dt) {
  let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
  return a + d * (1 - Math.exp(-rate * dt));
}

// ---------- painted textures ----------
function paint(w, h, draw, { repeat, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  return t;
}
const hex = n => '#' + n.toString(16).padStart(6, '0');
const cache = {};
const once = (k, f) => cache[k] || (cache[k] = f());

export const T = {
  glow: () => once('glow', () => paint(128, 128, (x, w, h) => {
    const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(.6, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  })),
  blob: () => once('blob', () => paint(64, 64, (x, w, h) => {
    const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(.6, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  })),
  wood: (base = '#7a5236', dark = '#4d3122') => once('wood' + base, () => paint(256, 256, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let i = 0; i < 4; i++) {
      const y = i * 64;
      x.fillStyle = `rgba(${r() * 30 | 0},${r() * 16 | 0},0,${.08 + r() * .14})`; x.fillRect(0, y, w, 64);
      for (let k = 0; k < 26; k++) { x.strokeStyle = `rgba(40,20,8,${.05 + r() * .12})`; x.lineWidth = .6 + r(); x.beginPath(); const yy = y + r() * 64; x.moveTo(0, yy); x.bezierCurveTo(80, yy + r() * 6 - 3, 170, yy + r() * 6 - 3, w, yy); x.stroke(); }
      x.fillStyle = dark; x.fillRect(0, y, w, 2.5);
      const sx = r() * w; x.fillRect(sx, y, 2.5, 64);
    }
  })),
  wallpaper: () => once('wallpaper', () => paint(128, 128, (x, w, h) => {
    x.fillStyle = '#1d5a60'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(214,170,96,.38)'; x.lineWidth = 1.6;
    for (let i = -1; i < 3; i++) for (let j = -1; j < 3; j++) {
      const cx = i * 64 + (j % 2 ? 32 : 0), cy = j * 48;
      x.beginPath(); x.moveTo(cx, cy - 20); x.quadraticCurveTo(cx + 15, cy, cx, cy + 20); x.quadraticCurveTo(cx - 15, cy, cx, cy - 20); x.stroke();
      x.fillStyle = 'rgba(232,196,128,.5)'; x.beginPath(); x.arc(cx, cy, 2.6, 0, TAU); x.fill();
    }
  })),
  carpet: () => once('carpet', () => paint(128, 128, (x, w, h) => {
    x.fillStyle = '#123f52'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#b8703c'; x.fillRect(0, 0, w, 9); x.fillRect(0, h - 9, w, 9);
    x.fillStyle = '#e6c27e'; x.fillRect(0, 11, w, 2.5); x.fillRect(0, h - 13.5, w, 2.5);
    x.strokeStyle = 'rgba(110,200,190,.35)'; x.lineWidth = 2;
    for (let i = 0; i < 2; i++) { const cx = 32 + i * 64; x.beginPath(); x.moveTo(cx, 34); x.lineTo(cx + 22, 64); x.lineTo(cx, 94); x.lineTo(cx - 22, 64); x.closePath(); x.stroke(); }
  })),
  snow: () => once('snow', () => paint(256, 256, (x, w, h) => {
    x.fillStyle = '#c9dcf2'; x.fillRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 520; i++) { const a = r(); x.fillStyle = a > .5 ? `rgba(255,255,255,${.07 + r() * .12})` : `rgba(96,128,182,${.05 + r() * .1})`; x.beginPath(); x.ellipse(r() * w, r() * h, 6 + r() * 26, 3 + r() * 9, 0, 0, TAU); x.fill(); }
    for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${.4 + r() * .5})`; x.fillRect(r() * w, r() * h, 1.2, 1.2); }
  })),
  ice: () => once('ice', () => paint(256, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#7fb6dc'); g.addColorStop(.5, '#a9d8ee'); g.addColorStop(1, '#6fa4d2');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const r = rng(11);
    for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(255,255,255,${.1 + r() * .3})`; x.lineWidth = .5 + r() * 1.2; x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += r() * 60 - 30; py += r() * 60 - 30; x.lineTo(px, py); } x.stroke(); }
    for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(255,255,255,${.05 + r() * .1})`; x.beginPath(); x.ellipse(r() * w, r() * h, 10 + r() * 30, 4 + r() * 10, r() * 3, 0, TAU); x.fill(); }
  })),
  frostGlass: () => once('frostGlass', () => paint(128, 128, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = 'rgba(120,170,230,.10)'; x.fillRect(0, 0, w, h);
    const r = rng(5);
    for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h]]) for (let i = 0; i < 46; i++) {
      const a = r() * TAU, d = r() * 46; x.strokeStyle = `rgba(235,246,255,${.5 - d / 110})`; x.lineWidth = 1;
      x.beginPath(); x.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); x.lineTo(cx + Math.cos(a) * (d + 9), cy + Math.sin(a) * (d + 9)); x.stroke();
    }
    x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 5; x.beginPath(); x.moveTo(26, 96); x.lineTo(58, 30); x.stroke();
  })),
  cobble: () => once('cobble', () => paint(256, 256, (x, w, h) => {
    x.fillStyle = '#566690'; x.fillRect(0, 0, w, h);
    const r = rng(9);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 9; i++) {
      const ox = (j % 2) * 16, v = 118 + r() * 34 | 0;
      x.fillStyle = `rgb(${v - 14},${v + 2},${v + 40})`; x.beginPath(); x.roundRect(i * 32 + ox - 15, j * 32 + 1.5, 29, 29, 9); x.fill();
      x.fillStyle = 'rgba(255,255,255,.13)'; x.beginPath(); x.ellipse(i * 32 + ox - 2, j * 32 + 9, 9, 4, 0, 0, TAU); x.fill();
    }
    for (let i = 0; i < 14; i++) { x.fillStyle = `rgba(236,244,255,${.25 + r() * .3})`; x.beginPath(); x.ellipse(r() * w, r() * h, 10 + r() * 26, 6 + r() * 12, r() * 3, 0, TAU); x.fill(); }
  })),
  windows: (lit = .6, seed = 2, cols = 6, rows = 10) => once('win' + lit + seed + cols + rows, () => paint(128, 256, (x, w, h) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
    const r = rng(seed), cw = w / cols, ch = h / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (r() < lit) {
      const warm = r(); x.fillStyle = warm > .25 ? `rgba(255,${170 + r() * 50 | 0},${80 + r() * 50 | 0},${.7 + r() * .3})` : `rgba(140,255,220,${.6 + r() * .3})`;
      x.beginPath(); x.roundRect(i * cw + cw * .24, j * ch + ch * .2, cw * .52, ch * .56, [cw * .26, cw * .26, 2, 2]); x.fill();
    }
  })),
  carSide: () => once('carSide', () => paint(512, 128, (x, w, h) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { const g = x.createLinearGradient(0, 26, 0, 96); g.addColorStop(0, '#ffd89a'); g.addColorStop(1, '#ff9c3c'); x.fillStyle = g; x.beginPath(); x.roundRect(20 + i * 82, 26, 60, 66, [26, 26, 6, 6]); x.fill(); x.fillStyle = 'rgba(60,24,6,.55)'; x.fillRect(48 + i * 82, 26, 4, 66); }
  })),
  rock: () => once('rock', () => paint(256, 256, (x, w, h) => {
    x.fillStyle = '#2b3654'; x.fillRect(0, 0, w, h);
    const r = rng(21);
    for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${r() > .5 ? '160,180,230' : '8,12,30'},${.05 + r() * .1})`; x.beginPath(); x.moveTo(r() * w, r() * h); for (let k = 0; k < 3; k++) x.lineTo(r() * w, r() * h); x.fill(); }
  })),
  stars: () => once('starsCoat', () => paint(256, 256, (x, w, h) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
    const r = rng(33), pts = [];
    for (let i = 0; i < 46; i++) { const p = [r() * w, r() * h]; pts.push(p); x.fillStyle = `rgba(190,235,255,${.6 + r() * .4})`; x.beginPath(); x.arc(p[0], p[1], .8 + r() * 2, 0, TAU); x.fill(); }
    x.strokeStyle = 'rgba(150,220,255,.45)'; x.lineWidth = 1;
    for (let i = 0; i < 18; i++) { const a = pts[r() * pts.length | 0], b = pts[r() * pts.length | 0]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 70) { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); } }
  })),
  label: (text, { bg = '#f6ecd8', fg = '#1b2b4d', w = 256, h = 96, font = 'bold 44px Georgia, serif', border = '#c9783f' } = {}) => paint(w, h, (x) => {
    x.fillStyle = bg; x.beginPath(); x.roundRect(3, 3, w - 6, h - 6, 14); x.fill();
    x.strokeStyle = border; x.lineWidth = 6; x.stroke();
    x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
    const lines = String(text).split('\n'); lines.forEach((l, i) => x.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * parseInt(font.match(/(\d+)px/)[1]) * 1.05));
  }),
};

// ---------- materials and shapes ----------
const mats = {};
export function M(color, o = {}) {
  const key = !o.map && !o.emissiveMap && !o.alphaMap ? JSON.stringify([color, o]) : null;
  if (key && mats[key]) return mats[key];
  const m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? .82, metalness: o.metal ?? 0, flatShading: !!o.flat });
  if (o.emissive !== undefined) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.ei ?? 1; }
  if (o.map) m.map = o.map;
  if (o.emissiveMap) m.emissiveMap = o.emissiveMap;
  if (o.opacity !== undefined) { m.transparent = true; m.opacity = o.opacity; m.depthWrite = o.depthWrite ?? false; }
  if (o.side) m.side = o.side;
  if (o.fog === false) m.fog = false;
  if (key) mats[key] = m;
  return m;
}
export const glowMat = (color, intensity = 1.6) => M(color, { emissive: color, ei: intensity, rough: .4 });
export const G = {
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  rbox: (w, h, d, r = .05) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)),
  cyl: (rt, rb, h, s = 20) => new THREE.CylinderGeometry(rt, rb, h, s),
  sph: (r, ws = 20, hs = 14) => new THREE.SphereGeometry(r, ws, hs),
  cap: (r, l) => new THREE.CapsuleGeometry(r, l, 5, 12),
  cone: (r, h, s = 16) => new THREE.ConeGeometry(r, h, s),
  torus: (r, t, s = 24) => new THREE.TorusGeometry(r, t, 8, s),
  plane: (w, h) => new THREE.PlaneGeometry(w, h),
};
export function mesh(geo, material, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
export function sprite(color, size, x = 0, y = 0, z = 0, parent, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  s.scale.setScalar(size); s.position.set(x, y, z); if (parent) parent.add(s); return s;
}
export function sign(text, w = 1.6, h = .6, opts) {
  const m = new THREE.Mesh(G.plane(w, h), new THREE.MeshBasicMaterial({ map: T.label(text, opts), transparent: true }));
  return m;
}
export function blobShadow(size = .8, parent) {
  const m = new THREE.Mesh(G.plane(1, 1), new THREE.MeshBasicMaterial({ map: T.blob(), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = .015; m.scale.setScalar(size); m.renderOrder = 1; if (parent) parent.add(m); return m;
}

// ---------- people ----------
// One little rig does every character. Yaw 0 faces the camera (+z). `h` is the standing height.
export class Actor {
  constructor(o = {}) {
    const d = this.o = Object.assign({ h: 1.15, coat: 0x2b4c8c, skin: 0xe8b48f, hair: 0x3a2618, pants: 0x27304a, boots: 0x3a2a22, mitts: null, hat: 'hair', hatColor: 0x2f8f5a, scarf: null, adult: false, long: false, round: false, name: '' }, o);
    this.name = d.name;
    this.g = new THREE.Group(); this.rig = new THREE.Group(); this.g.add(this.rig);
    this.pos = this.g.position; this.yaw = 0; this.targetYaw = 0; this.speed = 0; this.phase = Math.random() * 6; this.t = Math.random() * 9;
    this.pose = 'stand'; this.emote = null; this.emoteT = 0; this.talking = 0; this.blinkT = 2 + Math.random() * 3; this.hop = 0;
    const k = this.k = d.adult ? { head: .175, torsoH: .66, torsoR: .21, leg: .7, arm: .56, sh: .27, limb: .07 }
      : d.round ? { head: .2, torsoH: .5, torsoR: .3, leg: .16, arm: .3, sh: .3, limb: .065 }
        : { head: .215, torsoH: .42, torsoR: .19, leg: .3, arm: .3, sh: .215, limb: .058 };
    const skin = M(d.skin, { rough: .7 }), coat = M(d.coat, { rough: .9 }), pants = M(d.pants), boots = M(d.boots, { rough: .6 });
    const mitt = M(d.mitts ?? d.hatColor, { rough: .95 });
    const hipY = k.leg + .1, neckY = hipY + k.torsoH;
    this.hipY = hipY;
    // legs
    this.legs = [-1, 1].map(s => {
      const p = new THREE.Group(); p.position.set(s * k.torsoR * .48, hipY, 0);
      mesh(G.cap(k.limb * 1.15, k.leg - .08), pants, 0, -k.leg / 2, 0, p);
      mesh(G.rbox(.14, .11, .23, .045), boots, 0, -k.leg - .035, .035, p);
      this.rig.add(p); return p;
    });
    // body
    this.body = new THREE.Group(); this.body.position.y = hipY; this.rig.add(this.body);
    if (d.round) {
      const b = mesh(G.sph(k.torsoR, 20, 16), coat, 0, k.torsoH * .5, 0, this.body); b.scale.set(1, .98, .92);
      mesh(G.torus(k.torsoR * .96, .025, 28), M(d.trim ?? C.copper, { rough: .6 }), 0, k.torsoH * .42, 0, this.body).rotation.x = Math.PI / 2;
    } else {
      mesh(G.cyl(k.torsoR * .8, k.torsoR * 1.16, k.torsoH, 18), coat, 0, k.torsoH / 2 - .02, 0, this.body);
      const sh = mesh(G.sph(k.torsoR * .86, 18, 12), coat, 0, k.torsoH - .06, 0, this.body); sh.scale.set(1.08, .62, .95);
      if (d.long) mesh(G.cyl(k.torsoR * 1.14, k.torsoR * (d.long === true ? 1.5 : d.long), k.leg * .78, 18, 1), coat, 0, -k.leg * .36, 0, this.body);
      if (d.trim !== undefined) { for (let i = 0; i < 3; i++) mesh(G.sph(.024, 8, 6), M(d.trim, { metal: .6, rough: .35 }), 0, k.torsoH * (.25 + i * .22), k.torsoR * (1.07 - i * .1), this.body); }
      if (d.pattern) { const p = mesh(G.cyl(k.torsoR * .82, k.torsoR * (d.long ? 1.52 : 1.18), k.torsoH + (d.long ? k.leg * .7 : 0), 24, 1, true), new THREE.MeshBasicMaterial({ map: d.pattern, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), 0, (k.torsoH - (d.long ? k.leg * .7 : 0)) / 2 - .02, 0, this.body); p.scale.setScalar(1.015); this.pattern = p; }
    }
    // arms
    this.arms = [-1, 1].map(s => {
      const p = new THREE.Group(); p.position.set(s * k.sh, neckY - .09, 0); p.rotation.z = s * .14;
      mesh(G.cap(k.limb, k.arm - .06), coat, 0, -k.arm / 2, 0, p);
      mesh(G.sph(k.limb * 1.35, 10, 8), mitt, 0, -k.arm - .02, 0, p);
      const hand = new THREE.Group(); hand.position.y = -k.arm - .04; p.add(hand); p.userData.hand = hand;
      this.rig.add(p); return p;
    });
    // head
    const H = this.head = new THREE.Group(); H.position.set(0, neckY + k.head * .82, 0); this.rig.add(H);
    const r = k.head;
    mesh(G.sph(r, 24, 18), skin, 0, 0, 0, H);
    const eyeM = M(0x1a1410, { rough: .25 });
    this.eyes = [-1, 1].map(s => { const e = mesh(G.sph(r * .13, 10, 8), eyeM, s * r * .36, r * .1, r * .9, H); mesh(G.sph(r * .04, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }), s * r * .36 + r * .04, r * .15, r * 1.01, H); return e; });
    mesh(G.sph(r * .09, 8, 6), M(new THREE.Color(d.skin).multiplyScalar(.86).getHex(), { rough: .7 }), 0, -r * .06, r * .99, H);
    for (const s of [-1, 1]) { const c = mesh(G.sph(r * .17, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff7d6e, transparent: true, opacity: .32, depthWrite: false }), s * r * .56, -r * .2, r * .78, H); c.scale.set(1, .7, .4); }
    this.mouth = mesh(G.sph(r * .1, 10, 6), M(0x5a2a22, { rough: .6 }), 0, -r * .36, r * .9, H); this.mouth.scale.set(1.5, .35, .4);
    if (d.adult) for (const s of [-1, 1]) { const b = mesh(G.box(r * .26, r * .045, r * .05), M(d.hair), s * r * .36, r * .34, r * .9, H); b.rotation.z = -s * .12; }
    this.buildHat(H, r, d);
    if (d.scarf !== null && d.scarf !== undefined) {
      const sm = M(d.scarf, { rough: .95 });
      const t = mesh(G.torus(k.torsoR * .66, .058, 18), sm, 0, neckY - .01, 0, this.rig); t.rotation.x = Math.PI / 2; t.scale.set(1, 1, 1.1);
      const tail = mesh(G.rbox(.1, .3, .05, .02), sm, k.torsoR * .5, neckY - .19, k.torsoR * .8, this.rig); tail.rotation.z = -.15;
      if (d.scarf2) mesh(G.rbox(.105, .07, .055, .02), M(d.scarf2), k.torsoR * .5 + .015, neckY - .27, k.torsoR * .8, this.rig).rotation.z = -.15;
    }
    const natural = neckY + k.head * 1.82;
    this.scale = d.h / natural; this.rig.scale.setScalar(this.scale);
    this.shadow = blobShadow(d.h * (d.round ? .9 : .72), this.g);
    this.height = d.h;
  }
  buildHat(H, r, d) {
    const hc = M(d.hatColor, { rough: .95 }), hair = M(d.hair, { rough: .95 });
    const cap = (rad, mat, tilt = -.3, len = 1.72) => { const m = mesh(new THREE.SphereGeometry(rad, 22, 12, 0, TAU, 0, len), mat, 0, 0, 0, H); m.rotation.x = tilt; return m; };
    const hairCap = () => { cap(r * 1.045, hair, -.42, 1.78); };
    switch (d.hat) {
      case 'beanie': {
        cap(r * 1.03, hair, -.5, 1.9);
        cap(r * 1.1, hc, -.2, 1.42);
        const cuff = mesh(G.torus(r * 1.06, r * .14, 22), M(d.hat2 ?? d.hatColor, { rough: .95 }), 0, r * .26, -r * .05, H); cuff.rotation.x = Math.PI / 2 - .2;
        mesh(G.sph(r * .26, 10, 8), M(d.pom ?? 0xf6ecd8, { rough: 1 }), 0, r * 1.13, -r * .24, H);
        break;
      }
      case 'flaps': {
        cap(r * 1.1, hc, -.16, 1.5);
        for (const s of [-1, 1]) { const f = mesh(G.rbox(r * .3, r * .95, r * .78, .04), hc, s * r * 1.02, -r * .3, -r * .04, H); f.rotation.z = s * .1; mesh(G.sph(r * .13, 8, 6), M(0xf6ecd8, { rough: 1 }), s * r * 1.06, -r * .86, 0, H); }
        const brim = mesh(G.rbox(r * 1.3, r * .2, r * .26, .03), M(0xf6ecd8, { rough: 1 }), 0, r * .66, r * .86, H); brim.rotation.x = -.45;
        break;
      }
      case 'hood': {
        const m = mesh(new THREE.SphereGeometry(r * 1.2, 22, 16, Math.PI / 2 + .95, TAU - 1.9), M(d.hatColor, { rough: .95, side: THREE.DoubleSide }), 0, r * .04, -r * .06, H);
        m.scale.set(1, 1.04, 1.06);
        const fr = mesh(G.sph(r * .5, 12, 8), hair, 0, r * .72, r * .5, H); fr.scale.set(1.45, .42, .8);
        break;
      }
      case 'curls': {
        const rr = rng(d.h * 1000 | 0);
        for (let i = 0; i < 20; i++) { const a = rr() * TAU, e = .25 + rr() * 1.3; const y = Math.cos(e), xz = Math.sin(e); if (Math.sin(a) * xz > .55 && y < .55) continue; mesh(G.sph(r * (.3 + rr() * .12), 8, 6), hair, Math.cos(a) * xz * r * .98, y * r * .98 + r * .08, Math.sin(a) * xz * r * .98 - r * .1, H); }
        if (d.hatColor) { const band = mesh(G.torus(r * .98, r * .07, 20), hc, 0, r * .46, -r * .05, H); band.rotation.x = Math.PI / 2 - .3; }
        break;
      }
      case 'goggles': {
        hairCap();
        for (const s of [-1, 1]) { const t = mesh(G.torus(r * .2, r * .055, 14), M(C.brass, { metal: .7, rough: .3 }), s * r * .3, r * .62, r * .82, H); t.rotation.x = -.5; mesh(G.cyl(r * .17, r * .17, .02, 12), M(0x9fe6ff, { emissive: 0x3aa0c0, ei: .5, rough: .2 }), s * r * .3, r * .62, r * .83, H).rotation.x = Math.PI / 2 - .5; }
        const band = mesh(G.torus(r * 1.05, r * .045, 22), M(0x3a2a22), 0, r * .52, 0, H); band.rotation.x = Math.PI / 2 - .12;
        break;
      }
      case 'wayfinder': {
        cap(r * 1.04, hair, -.95, 1.75);
        mesh(G.cyl(r * .98, r * 1.06, r * .7, 20), hc, 0, r * .78, -r * .06, H).rotation.x = -.1;
        mesh(G.cyl(r * 1.0, r * 1.0, r * .08, 20), M(d.hat2 ?? C.copper, { metal: .5, rough: .4 }), 0, r * .5, -r * .02, H).rotation.x = -.1;
        const brim = mesh(G.cyl(r * .8, r * .8, r * .06, 16, 1, false, 0, Math.PI), hc, 0, r * .46, r * .55, H); brim.rotation.set(-.1, -Math.PI / 2, 0);
        mesh(G.sph(r * .2, 12, 8), glowMat(C.glow, 2.2), 0, r * .86, r * .92, H);
        mesh(G.torus(r * .22, r * .05, 14), M(C.brass, { metal: .7, rough: .3 }), 0, r * .86, r * .9, H);
        this.lamp = sprite(C.amber, .5, 0, r * .86, r * 1.0, H, .7);
        // long braid of hair down the back
        for (let i = 0; i < 5; i++) mesh(G.sph(r * (.24 - i * .02), 8, 6), hair, 0, -r * (.3 + i * .32), -r * (1.0 + i * .03), H);
        break;
      }
      case 'wide': {
        hairCap();
        mesh(G.cyl(r * .86, r * 1.0, r * .9, 18), hc, 0, r * .95, 0, H);
        mesh(G.cyl(r * 2.0, r * 2.0, r * .07, 28), hc, 0, r * .52, 0, H);
        mesh(G.cyl(r * 1.01, r * 1.01, r * .14, 18), M(d.hat2 ?? 0xb9a57a), 0, r * .62, 0, H);
        break;
      }
      case 'pointcap': { // soft folded felt cap worn in Kindlewick
        cap(r * 1.08, hc, -.12, 1.5);
        const tip = mesh(G.sph(r * .5, 12, 8), hc, r * .5, r * 1.02, -r * .2, H); tip.scale.set(1.5, .7, .9); tip.rotation.z = -.5;
        const cuff = mesh(G.torus(r * 1.06, r * .12, 20), M(d.hat2 ?? 0xf6ecd8, { rough: 1 }), 0, r * .34, -r * .02, H); cuff.rotation.x = Math.PI / 2 - .12;
        break;
      }
      case 'crown': { // Maren's ring of little lanterns
        cap(r * 1.045, hair, -.7, 1.75);
        const ring = mesh(G.torus(r * 1.0, r * .06, 24), M(C.brass, { metal: .8, rough: .25 }), 0, r * .62, -r * .05, H); ring.rotation.x = Math.PI / 2 - .14;
        this.crownLights = [];
        for (let i = 0; i < 7; i++) { const a = -Math.PI * .08 + i / 6 * Math.PI * 1.16 - Math.PI * .08; const m = mesh(G.sph(r * .13, 8, 6), new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: C.amber, emissiveIntensity: 2 }), Math.cos(a) * r * 1.0, r * .8 + Math.sin(a) * .02, Math.sin(a) * r * 1.0 - r * .05, H); this.crownLights.push(m); }
        for (let i = 0; i < 9; i++) mesh(G.sph(r * (.36 - i * .022), 8, 6), hair, r * .1 * Math.sin(i), -r * (.2 + i * .42), -r * (.95 + i * .02), H);
        break;
      }
      case 'long': { // shoulder-length hair
        hairCap();
        const back = mesh(G.sph(r * 1.0, 14, 10), hair, 0, -r * .45, -r * .42, H); back.scale.set(1.02, 1.25, .7);
        for (const s of [-1, 1]) { const l = mesh(G.sph(r * .4, 10, 8), hair, s * r * .86, -r * .5, -r * .05, H); l.scale.set(.6, 1.7, .9); }
        break;
      }
      case 'bald': break;
      default: hairCap();
    }
    if (d.glasses) for (const s of [-1, 1]) { const t = mesh(G.torus(r * .2, r * .03, 14), M(0x20242c, { metal: .4, rough: .4 }), s * r * .36, r * .1, r * .97, H); }
  }
  face(yaw) { this.targetYaw = yaw; return this; }
  lookAt(x, z) { this.targetYaw = Math.atan2(x - this.pos.x, z - this.pos.z); return this; }
  snapYaw(y) { this.yaw = this.targetYaw = y; this.g.rotation.y = y; return this; }
  place(x, y, z, yaw) { this.pos.set(x, y, z); if (yaw !== undefined) this.snapYaw(yaw); return this; }
  do(emote, secs = 1.6) { this.emote = emote; this.emoteT = secs; return this; }
  hand(i = 1) { return this.arms[i].userData.hand; }
  update(dt) {
    this.t += dt;
    this.yaw = angleDamp(this.yaw, this.targetYaw, 10, dt); this.g.rotation.y = this.yaw;
    const k = this.k, sit = this.pose === 'sit';
    const amt = clamp(this.speed / 2.2, 0, 1);
    this.phase += dt * (5 + this.speed * 2.4) * (amt > .02 ? 1 : 0) / Math.sqrt(this.scale);
    const sw = Math.sin(this.phase) * amt;
    let lx = [sw * .85, -sw * .85], ax = [-sw * .8, sw * .8], az = [-.14, .14], y = Math.abs(Math.cos(this.phase)) * .035 * amt;
    let headX = Math.sin(this.t * .7) * .03, headZ = 0;
    if (sit) { lx = [-1.5, -1.5]; ax = [-.75, -.75]; y = -k.leg + .02; }
    if (this.pose === 'sleep') { lx = [-.2, .1]; ax = [-.3, .2]; }
    if (this.pose === 'hold') { ax = [-1.15, -1.15]; az = [.12, -.12]; }
    if (this.pose === 'crouch') { lx = [-1.1, -1.1]; y = -k.leg * .55; ax = [-.9, -.9]; headX = .25; }
    if (this.pose === 'ride') { lx = [-1.35, -1.35]; ax = [-1.0, -1.0]; az = [-.5, .5]; y = -k.leg + .02; }
    if (this.emoteT > 0) {
      this.emoteT -= dt; const e = this.emote, tt = this.t;
      if (e === 'cheer') { az = [-2.5 + Math.sin(tt * 14) * .15, 2.5 - Math.sin(tt * 14) * .15]; y += Math.abs(Math.sin(tt * 9)) * .12; }
      else if (e === 'wave') { az[1] = 2.4 + Math.sin(tt * 11) * .35; ax[1] = 0; }
      else if (e === 'shiver') { this.rig.position.x = Math.sin(tt * 50) * .012; headX = .15; ax = [-.9, -.9]; az = [.5, -.5]; }
      else if (e === 'nod') { headX = Math.sin(tt * 9) * .22; }
      else if (e === 'shake') { headZ = 0; this.head.rotation.y = Math.sin(tt * 11) * .4; }
      else if (e === 'point') { ax[1] = -1.5; az[1] = .1; }
      else if (e === 'think') { ax[1] = -2.2; az[1] = -.5; headX = -.12; }
      else if (e === 'jump') { y += Math.abs(Math.sin(tt * 8)) * .2; }
      else if (e === 'give') { ax = [-1.3, -1.3]; az = [.2, -.2]; }
      else if (e === 'shrug') { az = [-.7, .7]; ax = [-.3, -.3]; }
      if (this.emoteT <= 0) { this.rig.position.x = 0; this.head.rotation.y = 0; }
    }
    y += this.hop;
    const r = 14 * dt > 1 ? 1 : 14 * dt;
    for (let i = 0; i < 2; i++) {
      this.legs[i].rotation.x = lerp(this.legs[i].rotation.x, lx[i], r);
      this.arms[i].rotation.x = lerp(this.arms[i].rotation.x, ax[i], r);
      this.arms[i].rotation.z = lerp(this.arms[i].rotation.z, az[i], r);
    }
    this.rig.position.y = lerp(this.rig.position.y, y * this.scale, sit ? 1 : .5);
    this.body.scale.y = 1 + Math.sin(this.t * 2.1) * .012;
    this.head.rotation.x = lerp(this.head.rotation.x, headX + (this.talking > 0 ? Math.sin(this.t * 13) * .05 : 0), r);
    this.head.rotation.z = headZ;
    // blink and talk
    this.blinkT -= dt; const blink = this.blinkT < .12 || this.pose === 'sleep';
    if (this.blinkT < 0) this.blinkT = 2 + Math.random() * 4;
    for (const e of this.eyes) e.scale.y = blink ? .12 : 1;
    if (this.talking > 0) { this.talking -= dt; this.mouth.scale.set(1.2 + Math.sin(this.t * 17) * .3, .5 + Math.abs(Math.sin(this.t * 13)) * .9, .4); }
    else this.mouth.scale.set(this.smile ? 2 : 1.5, .35, .4);
    this.shadow.material.opacity = clamp(1 - this.hop * .6, .25, 1);
    if (this.crownLights) this.crownLights.forEach((m, i) => m.material.emissiveIntensity = 1.6 + Math.sin(this.t * 3 + i) * .6);
  }
}

// The cast. Colours are picked so each friend reads at a glance.
export const CAST = {
  river: () => new Actor({ name: 'River', h: 1.12, coat: 0x1f4f9e, skin: 0xf0c3a0, hair: 0x7a5230, pants: 0x2f7a86, boots: 0x4a3526, hat: 'beanie', hatColor: 0x2f9d6a, hat2: 0x1f6f4c, pom: 0xf6ecd8, scarf: 0x57c7a8, scarf2: 0xf6ecd8, mitts: 0x2f9d6a }),
  tavi: () => new Actor({ name: 'Tavi', h: 1.16, coat: 0xe07a2c, skin: 0xb9794f, hair: 0x1c1410, pants: 0x3a3f52, hat: 'goggles', hatColor: 0xe07a2c, scarf: 0xf2d34b, mitts: 0x5a4632, trim: C.brass }),
  wren: () => new Actor({ name: 'Wren', h: 1.1, coat: 0x6a4fb0, skin: 0xf2d2b8, hair: 0x151722, pants: 0x2a2440, hat: 'hood', hatColor: 0x6a4fb0, scarf: 0xc9b6ff, mitts: 0xc9b6ff }),
  mari: () => new Actor({ name: 'Mari', h: 1.22, coat: 0xf0c330, skin: 0x8a5a3c, hair: 0x1a120e, pants: 0x1f3d6b, hat: 'curls', hatColor: 0x2a8f8a, scarf: 0x2a8f8a, mitts: 0x2a8f8a, trim: 0x1f3d6b }),
  bo: () => new Actor({ name: 'Bo', h: .9, coat: 0x7fc4e8, skin: 0xf5cfa6, hair: 0xc98a3c, pants: 0x4a5a86, hat: 'flaps', hatColor: 0x3566c0, scarf: 0xf6ecd8, mitts: 0xf6ecd8 }),
  dex: () => new Actor({ name: 'Dex', h: 1.42, coat: 0x6c7684, skin: 0xd9a47c, hair: 0x4a2c1a, pants: 0x23262e, hat: 'hair', hatColor: 0x3f7a4f, scarf: 0x3f7a4f, mitts: 0x23262e, glasses: false }),
  ibby: () => new Actor({ name: 'Ibby', adult: true, h: 1.92, coat: 0x4c6b3c, skin: 0xa86f4c, hair: 0xd8d8e4, pants: 0x2a3340, boots: 0x2a1e18, hat: 'wayfinder', hatColor: 0x1f4a4f, hat2: C.copper, scarf: 0x2a8f8a, scarf2: 0xf6ecd8, mitts: 0xc9783f, long: true, trim: C.copper }),
  pym: () => new Actor({ name: 'Pym', adult: true, h: 1.62, coat: 0x8a4a2a, skin: 0xf0c8a8, hair: 0xb04a2a, pants: 0x30343c, hat: 'goggles', hatColor: 0x8a4a2a, scarf: 0xf2d34b, mitts: 0x3a2a22, trim: C.brass }),
  vesper: () => new Actor({ name: 'Vesper', adult: true, h: 2.02, coat: 0x8c8068, skin: 0xcfc6c0, hair: 0x9aa0b0, pants: 0x3a3c4a, boots: 0x22222a, hat: 'wide', hatColor: 0x3d3a4a, hat2: 0xb9a57a, scarf: 0x54507a, mitts: 0x54507a, long: 1.7 }),
  maren: () => new Actor({ name: 'Maren', adult: true, h: 2.7, coat: 0x14265c, skin: 0x9a6a4c, hair: 0xe6ecf5, pants: 0x14265c, boots: 0x1a1e30, hat: 'crown', hatColor: 0x14265c, scarf: 0x57c7a8, mitts: 0xe6ecf5, long: 1.9, pattern: T.stars(), trim: 0xe6ecf5 }),
  mom: () => new Actor({ name: 'Mom', adult: true, h: 1.72, coat: 0x4f9f8f, skin: 0xf0c3a0, hair: 0x6a4428, pants: 0x4a5a86, boots: 0xd8c8b4, hat: 'long', mitts: 0xf0c3a0 }),
  dad: () => new Actor({ name: 'Dad', adult: true, h: 1.86, coat: 0x34507a, skin: 0xf0c3a0, hair: 0x5a3c26, pants: 0x3a3f52, boots: 0x5a4632, hat: 'hair', mitts: 0xf0c3a0 }),
  folk: (i = 0) => { const coats = [0x2a8f8a, 0xd98a2c, 0x3566c0, 0x7a5ab8, 0x4f9f5f, 0xc9783f], skins = [0xf0c3a0, 0xb9794f, 0x8a5a3c, 0xf5cfa6, 0xd9a47c]; const a = new Actor({ name: 'Kindlefolk', round: true, h: 1.25 + (i % 3) * .14, coat: coats[i % coats.length], skin: skins[i % skins.length], hair: [0xe6ecf5, 0x3a2618, 0xb04a2a][i % 3], pants: 0x2a3340, hat: 'pointcap', hatColor: coats[(i + 2) % coats.length], scarf: coats[(i + 4) % coats.length], mitts: 0xf6ecd8 }); addLanternPole(a); return a; },
};
// Every Kindlefolk carries a lantern on a hooked pole over one shoulder.
export function addLanternPole(a) {
  const p = new THREE.Group(); p.position.set(-a.k.sh - .04, a.hipY + a.k.torsoH * .3, -.06); a.rig.add(p);
  mesh(G.cyl(.018, .018, 1.25, 6), M(C.woodDark), 0, .5, 0, p);
  const hook = mesh(new THREE.TorusGeometry(.11, .016, 6, 12, Math.PI), M(C.brass, { metal: .6, rough: .4 }), .11, 1.12, 0, p);
  const lm = new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: C.amber, emissiveIntensity: 2.2 });
  a.lantern = mesh(G.sph(.085, 10, 8), lm, .22, 1.0, 0, p);
  mesh(G.cyl(.05, .07, .04, 8), M(C.brass, { metal: .6, rough: .4 }), .22, 1.09, 0, p);
  sprite(C.amber, .7, .22, 1.0, 0, p, .55);
  return a;
}

// Bo's stuffed walrus, Admiral.
export function makeWalrus() {
  const g = new THREE.Group(), m = M(0x8c6e5c, { rough: 1 });
  const b = mesh(G.sph(.13, 12, 10), m, 0, .12, 0, g); b.scale.set(1, .9, 1.35);
  mesh(G.sph(.1, 12, 10), m, 0, .2, .13, g);
  const muz = mesh(G.sph(.065, 10, 8), M(0xc9a88c, { rough: 1 }), 0, .17, .21, g); muz.scale.set(1.3, .8, .8);
  for (const s of [-1, 1]) { mesh(G.cone(.014, .08, 6), M(0xf6ecd8), s * .035, .11, .22, g).rotation.x = Math.PI; mesh(G.sph(.014, 6, 5), M(0x111111), s * .045, .23, .2, g); const f = mesh(G.sph(.05, 8, 6), m, s * .13, .06, .08, g); f.scale.set(1.2, .4, 1); }
  const hat = mesh(G.cyl(.05, .06, .04, 10), M(0x1f3d6b), 0, .3, .11, g); mesh(G.cyl(.075, .075, .01, 10), M(0x1f3d6b), 0, .285, .13, g);
  return g;
}

// Justice Ruth Bader Ginsburg, the family's white Labrador, in her lace collar.
export class Dog {
  constructor() {
    const g = this.g = new THREE.Group(); this.rig = new THREE.Group(); g.add(this.rig); this.pos = g.position;
    const w = M(0xf7f3ea, { rough: .95 }), dark = M(0x1a1410, { rough: .4 });
    this.bodyM = mesh(G.cap(.2, .5), w, 0, .46, 0, this.rig); this.bodyM.rotation.x = Math.PI / 2;
    this.headG = new THREE.Group(); this.headG.position.set(0, .68, .44); this.rig.add(this.headG);
    mesh(G.sph(.17, 16, 12), w, 0, 0, 0, this.headG);
    const sn = mesh(G.rbox(.15, .12, .2, .05), w, 0, -.05, .16, this.headG);
    mesh(G.sph(.04, 8, 6), dark, 0, -.01, .27, this.headG);
    this.eyes = [-1, 1].map(s => mesh(G.sph(.026, 8, 6), dark, s * .075, .05, .14, this.headG));
    for (const s of [-1, 1]) { const e = mesh(G.sph(.09, 10, 8), M(0xece4d4, { rough: .95 }), s * .16, -.02, -.02, this.headG); e.scale.set(.45, 1.25, .9); e.rotation.z = s * .25; }
    const collar = mesh(G.torus(.15, .03, 16), M(0xffffff, { rough: 1 }), 0, .57, .36, this.rig); collar.rotation.x = Math.PI / 2 - .5;
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; mesh(G.sph(.035, 6, 5), M(0xffffff, { rough: 1 }), Math.cos(a) * .17, .55 + Math.sin(a) * .09 * -.5, .37 + Math.sin(a) * .14, this.rig); }
    this.legs = [[-.12, .28], [.12, .28], [-.12, -.26], [.12, -.26]].map(([x, z]) => { const p = new THREE.Group(); p.position.set(x, .36, z); mesh(G.cap(.058, .26), w, 0, -.16, 0, p); this.rig.add(p); return p; });
    this.tail = new THREE.Group(); this.tail.position.set(0, .56, -.42); mesh(G.cap(.04, .3), w, 0, .12, -.1, this.tail).rotation.x = -.7; this.rig.add(this.tail);
    this.shadow = blobShadow(1.1, g); this.pose = 'sleep'; this.t = 0; this.speed = 0; this.yaw = 0; this.targetYaw = 0; this.wag = 0;
  }
  update(dt) {
    this.t += dt; this.yaw = angleDamp(this.yaw, this.targetYaw, 8, dt); this.g.rotation.y = this.yaw;
    const sleep = this.pose === 'sleep', sit = this.pose === 'sit';
    this.rig.position.y = damp(this.rig.position.y, sleep ? -.22 : 0, 6, dt);
    this.rig.rotation.x = damp(this.rig.rotation.x, sit ? -.5 : 0, 6, dt);
    this.headG.position.y = damp(this.headG.position.y, sleep ? .42 : sit ? .78 : .68, 6, dt);
    this.headG.rotation.x = sleep ? .25 : Math.sin(this.t * 1.3) * .05;
    this.headG.rotation.z = sleep ? .2 : Math.sin(this.t * .8) * .08;
    for (const e of this.eyes) e.scale.y = sleep ? .12 : 1;
    const sw = Math.sin(this.t * 10) * clamp(this.speed, 0, 1) * .6;
    this.legs.forEach((l, i) => { l.rotation.x = sleep ? (i < 2 ? -1.3 : 1.3) : sit && i > 1 ? 1.1 : (i % 3 === 0 ? sw : -sw); });
    this.tail.rotation.y = Math.sin(this.t * (sleep ? 1.5 : 12)) * (sleep ? .1 : .3 + this.wag * .6);
    this.bodyM.scale.x = 1 + Math.sin(this.t * (sleep ? 1.4 : 3)) * .025;
  }
}

// ---------- sky, snow and the land rushing past ----------
export function makeSky({ top = 0x050a1e, mid = 0x0f2350, low = 0x27457e, stars = true, moon = true, aurora = 1, moonPos = [-130, 150, -260] } = {}) {
  const g = new THREE.Group(); g.userData.tick = [];
  const dome = new THREE.Mesh(new THREE.SphereGeometry(480, 32, 20), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, low: { value: new THREE.Color(low) } },
    vertexShader: 'varying vec3 p; void main(){ p=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top,mid,low; varying vec3 p; void main(){ float h=clamp(p.y,-.2,1.); vec3 c=mix(low,mid,smoothstep(-.05,.28,h)); c=mix(c,top,smoothstep(.25,.85,h)); gl_FragColor=vec4(c,1.); }',
  }));
  dome.renderOrder = -10; g.add(dome); g.userData.dome = dome;
  if (stars) {
    const n = 1400, pos = new Float32Array(n * 3), r = rng(4);
    for (let i = 0; i < n; i++) { const a = r() * TAU, e = Math.acos(r() * .98); pos[i * 3] = Math.cos(a) * Math.sin(e) * 440; pos[i * 3 + 1] = Math.cos(e) * 440 + 6; pos[i * 3 + 2] = Math.sin(a) * Math.sin(e) * 440; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdfeaff, size: 1.9, sizeAttenuation: false, transparent: true, opacity: .9, depthWrite: false, fog: false, map: T.glow(), blending: THREE.AdditiveBlending }));
    pts.renderOrder = -9; g.add(pts); g.userData.stars = pts;
  }
  if (moon) {
    const m = mesh(G.sph(15, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf7f1dc, fog: false }), ...moonPos, g);
    m.renderOrder = -8; sprite(0xbcd4ff, 150, ...moonPos, g, .5).renderOrder = -8; g.userData.moon = m;
  }
  if (aurora) {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { t: { value: 0 }, k: { value: aurora }, c1: { value: new THREE.Color(0x4dffb0) }, c2: { value: new THREE.Color(0x4aa8ff) }, c3: { value: new THREE.Color(0xa07bff) } },
      vertexShader: 'varying vec2 u; uniform float t; void main(){ u=uv; vec3 p=position; p.z+=sin(p.x*.02+t*.25)*16.+sin(p.x*.05-t*.18)*7.; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }',
      fragmentShader: `varying vec2 u; uniform float t,k; uniform vec3 c1,c2,c3;
        float h(float n){return fract(sin(n)*43758.5453);} float n1(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h(i),h(i+1.),f);}
        void main(){ float s=n1(u.x*46.+t*.35)*.6+n1(u.x*130.-t*.5)*.4; float band=n1(u.x*7.+t*.07);
          float v=pow(1.-u.y,1.6)*smoothstep(0.,.14,u.y); float a=v*(.25+.75*s)*smoothstep(.2,.75,band)*smoothstep(0.,.06,u.x)*smoothstep(1.,.94,u.x);
          vec3 c=mix(c1,c2,u.y*1.3); c=mix(c,c3,smoothstep(.55,1.,u.y)); gl_FragColor=vec4(c*a*k*1.25,a*k); }`,
    });
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.PlaneGeometry(760, 150 + i * 30, 80, 1);
      const rib = new THREE.Mesh(geo, mat); rib.position.set(-40 + i * 60, 150 + i * 26, -300 - i * 40); rib.rotation.set(-.2, (i - 1) * .22, 0); rib.renderOrder = -7; g.add(rib);
    }
    g.userData.aurora = mat; g.userData.tick.push((dt, t) => { mat.uniforms.t.value = t; });
  }
  g.userData.update = (dt, t) => g.userData.tick.forEach(f => f(dt, t));
  return g;
}

export class Snow {
  constructor({ count = 900, box = [44, 22, 30], wind = [-1, 0], fall = 1.6, size = .11, color = 0xffffff } = {}) {
    this.box = box; this.wind = wind; this.fall = fall; this.count = count;
    const pos = this.p = new Float32Array(count * 3); this.seed = new Float32Array(count);
    for (let i = 0; i < count; i++) { pos[i * 3] = (Math.random() - .5) * box[0]; pos[i * 3 + 1] = Math.random() * box[1]; pos[i * 3 + 2] = (Math.random() - .5) * box[2]; this.seed[i] = Math.random() * 10; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: T.glow(), transparent: true, opacity: .9, depthWrite: false, fog: false }));
    this.points.frustumCulled = false; this.t = 0; this.offset = new THREE.Vector3(0, -box[1] * .35, -box[2] * .25);
  }
  update(dt, center) {
    this.t += dt; const p = this.p, [bx, by, bz] = this.box, [wx, wz] = this.wind;
    for (let i = 0; i < this.count; i++) {
      const s = this.seed[i], j = i * 3;
      p[j] += (wx + Math.sin(this.t * .9 + s) * .35) * dt; p[j + 1] -= this.fall * (.7 + (s % 1) * .6) * dt; p[j + 2] += (wz + Math.cos(this.t * .7 + s) * .3) * dt;
      if (p[j + 1] < 0) p[j + 1] += by;
      if (p[j] < -bx / 2) p[j] += bx; else if (p[j] > bx / 2) p[j] -= bx;
      if (p[j + 2] < -bz / 2) p[j + 2] += bz; else if (p[j + 2] > bz / 2) p[j + 2] -= bz;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    if (center) this.points.position.copy(center).add(this.offset);
  }
}

// The land outside the windows. It scrolls past so the train can stay put.
export class Scenery {
  constructor({ speed = 16, groundY = -1.55, kind = 'forest', trees = 150, seed = 8, near = -7, far = -150, span = 300, bothSides = false, posts = true } = {}) {
    this.g = new THREE.Group(); this.speed = speed; this.span = span; this.items = [];
    const r = rng(seed);
    this.groundTex = T.snow().clone(); this.groundTex.needsUpdate = true; this.groundTex.repeat.set(span / 14, 30);
    const gm = kind === 'lake' ? new THREE.MeshStandardMaterial({ map: (() => { const t = T.ice().clone(); t.needsUpdate = true; t.repeat.set(span / 22, 20); this.groundTex = t; return t; })(), roughness: .25, metalness: .2, color: 0xdff2ff })
      : new THREE.MeshStandardMaterial({ map: this.groundTex, roughness: 1, color: 0xffffff });
    const ground = mesh(new THREE.PlaneGeometry(span, 420), gm, 0, groundY, -40, this.g); ground.rotation.x = -Math.PI / 2;
    this.groundPerUnit = this.groundTex.repeat.x / span;
    // trees: a trunk, three snowy tiers
    if (trees) {
      const pine = M(0x1d4a45, { rough: 1, flat: true }), cap = M(0xe6f1fb, { rough: 1, flat: true }), trunk = M(0x3a2a22);
      const tiers = [[1.5, 2.2, 1.2], [1.15, 1.9, 2.3], [.8, 1.6, 3.3]];
      const mk = (geo, mat) => { const im = new THREE.InstancedMesh(geo, mat, trees * 3); im.frustumCulled = false; this.g.add(im); return im; };
      this.pineI = mk(G.cone(1, 1, 7), pine); this.capI = mk(G.cone(1, 1, 7), cap);
      this.trunkI = new THREE.InstancedMesh(G.cyl(.16, .2, 1.4, 6), trunk, trees); this.trunkI.frustumCulled = false; this.g.add(this.trunkI);
      this.trees = [];
      for (let i = 0; i < trees; i++) {
        const side = bothSides && r() < .35 ? 1 : -1;
        const z = side < 0 ? near - Math.pow(r(), 1.6) * (near - far) : 24 + r() * 40;
        this.trees.push({ x: (r() - .5) * span, z, s: .8 + r() * 1.5, tiers });
      }
      this.dummy = new THREE.Object3D(); this.groundY = groundY;
    }
    // rolling hills, then the mountains
    const hillM = M(0xb9cfee, { rough: 1 });
    this.hills = [];
    for (let i = 0; i < 9; i++) { const s = 30 + r() * 46; const h = mesh(G.sph(1, 14, 8), hillM, (i / 9 - .5) * span * 1.5, groundY - s * .12, far - 20 - r() * 70, this.g); h.scale.set(s * 2.2, s * (.35 + r() * .3), s); this.hills.push(h); }
    this.peaks = [];
    if (kind !== 'none') {
      const rock = M(0x33487a, { rough: 1, flat: true }), cap2 = M(0xdfeaf8, { rough: 1, flat: true });
      const n = kind === 'mountain' ? 22 : 13;
      for (let i = 0; i < n; i++) {
        const hgt = (kind === 'mountain' ? 70 : 46) + r() * 90, rad = 46 + r() * 70, p = new THREE.Group();
        mesh(G.cone(rad, hgt, 6), rock, 0, hgt / 2, 0, p).rotation.y = r() * 3;
        mesh(G.cone(rad * .42, hgt * .42, 6), cap2, 0, hgt * .795, 0, p).rotation.y = r() * 3;
        p.position.set((i / n - .5) * 900 + r() * 40, groundY - 8, -330 - r() * 110); this.g.add(p); this.peaks.push(p);
      }
    }
    // way-posts beside the track: a little amber lamp every so often gives the sense of speed
    this.posts = [];
    if (posts) for (let i = 0; i < 5; i++) {
      const p = new THREE.Group();
      mesh(G.cyl(.06, .08, 3.4, 6), M(C.iron), 0, 1.7, 0, p);
      mesh(G.sph(.2, 10, 8), glowMat(C.amber, 2.4), 0, 3.5, 0, p); sprite(C.amber, 2.2, 0, 3.5, 0, p, .6);
      p.position.set((i / 5 - .5) * span, groundY, near + 1.8); this.g.add(p); this.posts.push(p);
    }
    this.update(0);
  }
  update(dt) {
    const d = this.speed * dt, half = this.span / 2;
    this.groundTex.offset.x += d * this.groundPerUnit;
    if (this.trees) {
      const o = this.dummy; let n = 0;
      this.trees.forEach((t, i) => {
        t.x -= d; if (t.x < -half) t.x += this.span; else if (t.x > half) t.x -= this.span;
        o.rotation.set(0, i, 0);
        o.position.set(t.x, this.groundY + .7 * t.s, t.z); o.scale.setScalar(t.s); o.updateMatrix(); this.trunkI.setMatrixAt(i, o.matrix);
        for (const [rad, h, y] of t.tiers) {
          o.position.set(t.x, this.groundY + y * t.s + .5, t.z); o.scale.set(rad * t.s, h * t.s, rad * t.s); o.updateMatrix(); this.pineI.setMatrixAt(n, o.matrix);
          o.position.y += h * t.s * .2; o.scale.set(rad * t.s * .62, h * t.s * .62, rad * t.s * .62); o.updateMatrix(); this.capI.setMatrixAt(n, o.matrix); n++;
        }
      });
      this.pineI.instanceMatrix.needsUpdate = this.capI.instanceMatrix.needsUpdate = this.trunkI.instanceMatrix.needsUpdate = true;
    }
    for (const h of this.hills) { h.position.x -= d * .22; if (h.position.x < -half * 1.5) h.position.x += this.span * 1.5; }
    for (const p of this.peaks) { p.position.x -= d * .05; if (p.position.x < -450) p.position.x += 900; }
    for (const p of this.posts) { p.position.x -= d; if (p.position.x < -half) p.position.x += this.span; }
  }
}

// The rails of frozen light the Nightjar lays for itself.
export function makeLightRails(len = 300, y = -1.38, z = 0, gauge = 1.5) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0xbfefff, emissive: 0x5fd8ff, emissiveIntensity: 2.2, roughness: .3 });
  for (const s of [-1, 1]) mesh(G.box(len, .07, .09), m, 0, y, z + s * gauge, g);
  const glow = mesh(G.plane(len, gauge * 2 + 2.4), new THREE.MeshBasicMaterial({ color: 0x4fc8ff, transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending }), 0, y - .04, z, g); glow.rotation.x = -Math.PI / 2;
  g.userData.mat = m; return g;
}

// ---------- the train ----------
const HW = 2.1, CEIL = 3.05;
export function lantern(parent, x, y, z, { color = C.amber, light = 13, dist = 9, size = .17 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  mesh(G.cyl(.012, .012, .34, 5), M(C.brass, { metal: .7, rough: .3 }), 0, .2, 0, g);
  mesh(G.cyl(.05, .13, .08, 10), M(C.brass, { metal: .7, rough: .3 }), 0, .04, 0, g);
  const globe = mesh(G.sph(size, 14, 10), new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: color, emissiveIntensity: 2.4 }), 0, -.13, 0, g);
  sprite(color, size * 9, 0, -.13, 0, g, .5);
  let pl = null;
  if (light) { pl = new THREE.PointLight(color, light, dist, 1.8); pl.position.y = -.2; g.add(pl); }
  g.userData.globe = globe; g.userData.light = pl; return g;
}

// A carriage shown as a cutaway: the near wall is open, like a dolls' house.
export function makeCarInterior({ len = 16, style = 'lamp', seed = 1, booths = true, doors = [true, true], windowsLit = true } = {}) {
  const g = new THREE.Group(), r = rng(seed), half = len / 2, old = style === 'old';
  const woodT = T.wood().clone(); woodT.needsUpdate = true; woodT.repeat.set(len / 3, 1.4);
  const floorM = new THREE.MeshStandardMaterial({ map: woodT, roughness: .7, color: old ? 0x8a8f9c : 0xffffff });
  mesh(G.box(len, .22, HW * 2), floorM, 0, -.11, 0, g);
  if (!old && style !== 'cab') { const ct = T.carpet().clone(); ct.needsUpdate = true; ct.repeat.set(len / 2, 1); const c = mesh(G.plane(len - .2, 1.5), new THREE.MeshStandardMaterial({ map: ct, roughness: 1 }), 0, .006, .9, g); c.rotation.x = -Math.PI / 2; }
  // underframe, skirt and wheels seen from the open side
  mesh(G.box(len - .3, .5, HW * 2 - .3), M(0x121821), 0, -.47, 0, g);
  mesh(G.box(len, .4, .1), M(old ? 0x3d4a5a : C.tealDark, { rough: .5 }), 0, -.36, HW, g);
  mesh(G.box(len, .06, .12), M(C.copper, { metal: .6, rough: .35 }), 0, -.14, HW, g);
  mesh(G.box(len, .1, .12), M(C.copper, { metal: .6, rough: .35 }), 0, CEIL + .05, HW, g);
  const wheels = [];
  for (const wx of [-half + 1.6, -half + 3.2, half - 3.2, half - 1.6]) { const w = new THREE.Group(); w.position.set(wx, -.95, HW - .25); mesh(G.cyl(.42, .42, .16, 20), M(0x1b2230, { metal: .5, rough: .4 }), 0, 0, 0, w).rotation.x = Math.PI / 2; for (let i = 0; i < 3; i++) { const sp = mesh(G.box(.74, .07, .18), M(C.copper, { metal: .6, rough: .4 }), 0, 0, 0, w); sp.rotation.z = i * Math.PI / 3; } mesh(G.torus(.42, .035, 20), M(0x9fe6ff, { emissive: 0x5fd8ff, ei: 1.2 }), 0, 0, .085, w); g.add(w); wheels.push(w); }
  // far wall: wainscot, window band, wallpaper
  const wallM = new THREE.MeshStandardMaterial({ map: T.wood('#6a4530', '#3a2418'), roughness: .75, color: old ? 0x8088a0 : 0xffffff });
  mesh(G.box(len, 1.05, .12), wallM, 0, .525, -HW, g);
  const wp = T.wallpaper().clone(); wp.needsUpdate = true; wp.repeat.set(len / 1.2, .7);
  mesh(G.box(len, .75, .12), new THREE.MeshStandardMaterial({ map: wp, roughness: .95, color: old ? 0x7f8aa8 : 0xffffff }), 0, CEIL - .375, -HW, g);
  mesh(G.box(len, .07, .16), M(C.copper, { metal: .55, rough: .4 }), 0, 1.06, -HW, g);
  mesh(G.box(len, .07, .16), M(C.copper, { metal: .55, rough: .4 }), 0, 2.3, -HW, g);
  const nWin = Math.floor((len - 1) / 2.6), pane = (len - .5) / nWin;
  for (let i = 0; i <= nWin; i++) mesh(G.box(i === 0 || i === nWin ? .5 : .36, 1.26, .14), wallM, -half + .25 + i * pane, 1.68, -HW, g);
  const gt = T.frostGlass().clone(); gt.needsUpdate = true; gt.repeat.set(nWin, 1);
  mesh(G.plane(len, 1.24), new THREE.MeshStandardMaterial({ color: 0x9fc4ff, map: gt, transparent: true, opacity: .6, roughness: .15, metalness: .2, depthWrite: false }), 0, 1.68, -HW + .02, g);
  // ceiling with ribs and hanging lanterns
  mesh(G.box(len, .12, HW * 2), M(old ? 0x545c70 : 0xd9c9a8, { rough: .9 }), 0, CEIL + .06, 0, g);
  for (let x = -half + 1; x < half; x += 2) mesh(G.box(.1, .1, HW * 2), M(old ? 0x3a4150 : C.woodDark), x, CEIL - .04, 0, g);
  const lamps = [];
  if (style !== 'none') for (let x = -half + 2.6; x < half - 1; x += old ? 6.5 : 3.6) {
    const L = lantern(g, x, CEIL - .22, .2, { light: 0, color: old ? 0x9fd0ff : C.amber });
    L.userData.power = old ? 4 : 15; L.userData.color = old ? 0x9fd0ff : C.amber; lamps.push(L);
  }
  // luggage rail above the windows
  mesh(G.cyl(.025, .025, len - .6, 6), M(C.brass, { metal: .7, rough: .3 }), 0, 2.48, -HW + .5, g).rotation.z = Math.PI / 2;
  for (let x = -half + .8; x < half; x += 1.6) mesh(G.cyl(.018, .018, .46, 5), M(C.brass, { metal: .7, rough: .3 }), x, 2.42, -HW + .28, g).rotation.x = Math.PI / 2.4;
  const cases = [0x8a4a2a, 0x2a5a8a, 0x6a4fb0, 0xc9a23f, 0x3f7a4f];
  for (let x = -half + 1.4; x < half - 1; x += 1.9 + r() * 2.2) { const w = .5 + r() * .45, h = .26 + r() * .2; const c = mesh(G.rbox(w, h, .36, .05), M(old ? 0x5a6274 : cases[r() * cases.length | 0], { rough: .8 }), x, 2.52 + h / 2, -HW + .36, g); c.rotation.y = (r() - .5) * .2; mesh(G.box(w * .3, .04, .04), M(C.brass, { metal: .6 }), x, 2.52 + h + .01, -HW + .36, g); }
  // end walls with an open doorway on the aisle
  const endM = new THREE.MeshStandardMaterial({ map: T.wood('#5d3d2a', '#33201a'), roughness: .8, color: old ? 0x8088a0 : 0xffffff });
  [-1, 1].forEach((s, i) => {
    const x = s * half;
    mesh(G.box(.14, CEIL, HW + .15), endM, x, CEIL / 2, (-HW + .15) / 2, g);
    mesh(G.box(.14, CEIL, HW - 1.65), endM, x, CEIL / 2, (1.65 + HW) / 2, g);
    mesh(G.box(.14, CEIL - 2.3, 1.5), endM, x, 2.3 + (CEIL - 2.3) / 2, .9, g);
    mesh(G.box(.18, .08, 1.62), M(C.copper, { metal: .55, rough: .4 }), x, 2.3, .9, g);
    if (!doors[i]) { mesh(G.box(.1, 2.3, 1.5), M(old ? 0x4a5568 : C.tealDark, { rough: .6 }), x, 1.15, .9, g); mesh(G.sph(.06, 8, 6), M(C.brass, { metal: .7, rough: .3 }), x - s * .08, 1.1, 1.4, g); const pw = mesh(G.cyl(.26, .26, .12, 16), M(0x7fb4ff, { emissive: 0x24407a, ei: .6, rough: .2 }), x, 1.7, .9, g); pw.rotation.z = Math.PI / 2; }
  });
  // booths: two benches facing each other with a little table, under a window
  const boothList = [];
  if (booths) {
    const seatM = M(old ? 0x4c5670 : 0x9c3f3a, { rough: .95 }), seatM2 = M(old ? 0x3f4860 : 0x7d2f30, { rough: .95 });
    const n = Math.floor((len - 2) / 3.4), start = -((n - 1) * 3.4) / 2;
    for (let i = 0; i < n; i++) {
      const cx = start + i * 3.4, b = { x: cx, seats: [] };
      for (const s of [-1, 1]) {
        const bx = cx + s * 1.05;
        mesh(G.rbox(.62, .16, 1.55, .06), seatM, bx, .5, -1.22, g);
        mesh(G.rbox(.16, .86, 1.5, .06), seatM2, bx + s * .3, .9, -1.25, g);
        mesh(G.box(.6, .42, 1.5), M(C.woodDark), bx, .21, -1.22, g);
        mesh(G.sph(.05, 8, 6), M(C.brass, { metal: .7, rough: .3 }), bx + s * .3, 1.36, -.5, g);
        b.seats.push({ x: bx - s * .06, z: -.68, yaw: -s * .78 });
      }
      mesh(G.rbox(.72, .06, 1.0, .03), M(C.wood, { rough: .5 }), cx, .78, -1.45, g);
      mesh(G.cyl(.05, .07, .76, 8), M(C.brass, { metal: .6, rough: .4 }), cx, .39, -1.45, g);
      b.table = { x: cx, y: .81, z: -1.3 };
      boothList.push(b);
    }
  }
  return { g, len, lamps, wheels, booths: boothList, half };
}

// A carriage seen from outside, for the roof and for the wide shots.
export function makeCarExterior({ len = 16, lit = true, snowRoof = true } = {}) {
  const g = new THREE.Group();
  mesh(G.rbox(len, 2.9, 3.9, .3), M(C.tealDark, { rough: .45, metal: .2 }), 0, 1.5, 0, g);
  const st = T.carSide().clone(); st.needsUpdate = true; st.repeat.set(len / 8, 1);
  for (const s of [-1, 1]) {
    const w = mesh(G.plane(len - .8, 1.3), new THREE.MeshStandardMaterial({ color: 0x0a0d14, emissive: lit ? 0xffffff : 0x000000, emissiveMap: st, emissiveIntensity: lit ? 1.25 : 0, roughness: .3 }), 0, 1.9, s * 1.96, g); if (s < 0) w.rotation.y = Math.PI;
    mesh(G.box(len - .1, .1, .06), M(C.copper, { metal: .6, rough: .35 }), 0, 1.12, s * 1.97, g);
    mesh(G.box(len - .1, .06, .06), M(C.copper, { metal: .6, rough: .35 }), 0, 2.68, s * 1.97, g);
    mesh(G.box(len - .6, .7, .1), M(C.tealDeep, { rough: .5 }), 0, -.1, s * 1.9, g);
  }
  const roof = mesh(G.cyl(2.0, 2.0, len - .1, 22, 1, false, 0, Math.PI), M(snowRoof ? 0xdbe8f6 : 0x26303f, { rough: 1 }), 0, 2.86, 0, g); roof.rotation.z = Math.PI / 2; roof.scale.set(.42, 1, .985);
  mesh(G.box(len - .8, .08, 1.15), M(0x4a3626, { rough: .9 }), 0, 3.72, 0, g);
  for (const s of [-1, 1]) mesh(G.box(len - .8, .05, .05), M(C.copper, { metal: .6, rough: .4 }), 0, 3.78, s * .58, g);
  for (const wx of [-len / 2 + 2, -len / 2 + 3.6, len / 2 - 3.6, len / 2 - 2]) for (const s of [-1, 1]) { const w = mesh(G.cyl(.46, .46, .2, 18), M(0x1b2230, { metal: .5, rough: .4 }), wx, -.5, s * 1.55, g); w.rotation.x = Math.PI / 2; mesh(G.torus(.46, .04, 18), M(0x9fe6ff, { emissive: 0x5fd8ff, ei: 1.4 }), wx, -.5, s * 1.66, g); }
  mesh(G.box(1.2, 2.2, 2.6), M(0x10161f), len / 2 + .5, 1.4, 0, g); // bellows to the next car
  g.userData.roofY = 3.76;
  return g;
}

// The Nightjar herself. Nose to the +x.
export function makeEngine() {
  const g = new THREE.Group(), body = M(C.teal, { rough: .35, metal: .35 }), dark = M(C.tealDeep, { rough: .45, metal: .3 }), cop = M(C.copper, { metal: .7, rough: .3 });
  const b = mesh(G.cyl(1.75, 1.75, 11, 26), body, 0, 2.15, 0, g); b.rotation.z = Math.PI / 2; b.scale.set(1, 1, .98);
  const nose = mesh(G.sph(1.75, 26, 18), body, 5.5, 2.15, 0, g); nose.scale.set(2.3, 1, .98);
  // the Lantern Eye
  const eye = mesh(G.sph(1.02, 24, 18), new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: C.amber, emissiveIntensity: 2.6, roughness: .2 }), 8.75, 2.35, 0, g); eye.scale.set(.75, 1, 1);
  const ring = mesh(G.torus(1.08, .12, 32), cop, 8.55, 2.35, 0, g); ring.rotation.y = Math.PI / 2;
  const lid = mesh(new THREE.SphereGeometry(1.2, 22, 10, 0, TAU, 0, 1.0), cop, 8.4, 2.5, 0, g); lid.rotation.z = -.6; lid.scale.set(.8, 1, 1.02);
  sprite(C.amber, 6.5, 9.4, 2.35, 0, g, .5);
  const beam = mesh(new THREE.ConeGeometry(5.5, 34, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: .07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }), 26, 1.6, 0, g); beam.rotation.z = Math.PI / 2 + .03;
  const pl = new THREE.PointLight(C.amber, 46, 26, 1.7); pl.position.set(10.5, 2.6, 0); g.add(pl);
  // beak-plough that parts the snow
  const beak = mesh(G.cone(1.5, 3.4, 4), cop, 8.3, .55, 0, g); beak.rotation.set(0, Math.PI / 4, -Math.PI / 2); beak.scale.set(.55, 1, 1.25);
  // swept wing fairings, three feathers a side
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const f = mesh(G.sph(1, 16, 8), cop, 2.6 - i * 2.5, 2.9 - i * .28, s * 1.72, g); f.scale.set(2.5 - i * .25, .5 - i * .05, .09); f.rotation.set(0, s * -.06, -.16);
  }
  // frost stacks: two swept fins that breathe glitter
  for (let i = 0; i < 2; i++) { const f = mesh(G.cone(.55 - i * .1, 2.0 - i * .4, 5), dark, 2.2 - i * 2.2, 4.3 - i * .2, 0, g); f.rotation.z = .5; f.scale.z = .55; mesh(G.torus(.3, .06, 12), cop, 1.75 - i * 2.2, 5.05 - i * .35, 0, g).rotation.set(Math.PI / 2, .5, 0); }
  // kiln housing and cab at the back
  mesh(G.rbox(3.6, 3.3, 3.7, .35), dark, -6.4, 2.25, 0, g);
  const wt = T.carSide().clone(); wt.needsUpdate = true; wt.repeat.set(.34, 1);
  for (const s of [-1, 1]) { const w = mesh(G.plane(2.6, 1.1), new THREE.MeshStandardMaterial({ color: 0x0a0d14, emissive: 0xffffff, emissiveMap: wt, emissiveIntensity: 1.2 }), -6.4, 2.9, s * 1.87, g); if (s < 0) w.rotation.y = Math.PI; }
  const kilnM = new THREE.MeshStandardMaterial({ color: 0x0a2a22, emissive: C.aurora, emissiveIntensity: 1.6 });
  for (const s of [-1, 1]) for (let i = 0; i < 7; i++) mesh(G.box(.5, .12, .06), kilnM, -3.4 + i * .95, 1.05, s * 1.72, g).rotation.z = .3;
  g.userData.kiln = kilnM;
  // skirts, stripe and wheels
  for (const s of [-1, 1]) { mesh(G.box(14.5, 1.0, .12), dark, -.6, .35, s * 1.72, g); mesh(G.box(14.5, .09, .14), cop, -.6, .86, s * 1.73, g); }
  g.userData.wheels = [];
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(5.2 - i * 2.2, -.12, s * 1.62); g.add(w); g.userData.wheels.push(w);
    mesh(G.cyl(.74, .74, .2, 22), M(0x1b2230, { metal: .5, rough: .4 }), 0, 0, 0, w).rotation.x = Math.PI / 2;
    for (let k = 0; k < 3; k++) mesh(G.box(1.34, .09, .22), cop, 0, 0, 0, w).rotation.z = k * Math.PI / 3;
    mesh(G.torus(.74, .05, 22), M(0x9fe6ff, { emissive: 0x5fd8ff, ei: 1.5 }), 0, 0, s * .11, w);
  }
  mesh(G.box(13, .5, 2.9), M(0x10161f), -.6, .1, 0, g);
  mesh(G.box(1.2, 2.2, 2.6), M(0x10161f), -8.7, 1.5, 0, g);
  g.userData.eye = eye; g.userData.beam = beam; g.userData.light = pl; g.userData.stack = new THREE.Vector3(2.6, 5.4, 0);
  return g;
}

// A whole Nightjar: engine plus carriages, for wide shots. Origin at the engine; the train runs back along -x.
export function makeTrain({ cars = 4 } = {}) {
  const g = new THREE.Group(); const e = makeEngine(); e.position.y = .85; g.add(e); g.userData.engine = e; g.userData.cars = [];
  for (let i = 0; i < cars; i++) { const c = makeCarExterior({}); c.position.set(-9.2 - 8.6 - i * 17.2, .85, 0); g.add(c); g.userData.cars.push(c); }
  g.userData.length = 9 + cars * 17.2;
  return g;
}

// Glittering frost-breath from the stacks, sparks, steam: one soft particle puff system.
export class Puffs {
  constructor({ count = 120, color = 0xdff4ff, size = 1.2, additive = true, opacity = .5 } = {}) {
    this.n = count; this.p = new Float32Array(count * 3); this.v = new Float32Array(count * 3); this.life = new Float32Array(count); this.max = new Float32Array(count).fill(1);
    for (let i = 0; i < count; i++) this.p[i * 3 + 1] = -999;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.p, 3));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: T.glow(), transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false }));
    this.points.frustumCulled = false; this.i = 0; this.gravity = 0; this.drag = .4;
  }
  emit(x, y, z, vx = 0, vy = 1, vz = 0, life = 1.6, spread = .5) {
    const i = this.i = (this.i + 1) % this.n, j = i * 3;
    this.p[j] = x; this.p[j + 1] = y; this.p[j + 2] = z;
    this.v[j] = vx + (Math.random() - .5) * spread; this.v[j + 1] = vy + (Math.random() - .5) * spread; this.v[j + 2] = vz + (Math.random() - .5) * spread;
    this.life[i] = this.max[i] = life;
  }
  burst(n, x, y, z, speed = 2, life = 1) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, e = Math.random() * Math.PI; this.emit(x, y, z, Math.cos(a) * Math.sin(e) * speed, Math.cos(e) * speed, Math.sin(a) * Math.sin(e) * speed, life * (.6 + Math.random() * .6), 0); } }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue; const j = i * 3;
      this.life[i] -= dt; if (this.life[i] <= 0) { this.p[j + 1] = -999; continue; }
      this.v[j + 1] += this.gravity * dt; const d = 1 - this.drag * dt;
      this.v[j] *= d; this.v[j + 1] *= d; this.v[j + 2] *= d;
      this.p[j] += this.v[j] * dt; this.p[j + 1] += this.v[j + 1] * dt; this.p[j + 2] += this.v[j + 2] * dt;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

// ---------- keepsakes ----------
export function makeKeepsake(kind) {
  const g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
  if (kind === 'badge') { mesh(G.cyl(.16, .16, .03, 8), M(C.brass, { metal: .8, rough: .25, emissive: 0x6a4a10, ei: .6 }), 0, 0, 0, spin).rotation.x = Math.PI / 2; mesh(G.cone(.07, .02, 5), M(C.tealDark, { emissive: C.teal, ei: .5 }), 0, 0, .02, spin).rotation.x = Math.PI / 2; }
  else if (kind === 'postcard') { mesh(G.box(.36, .25, .012), M(0xf6ecd8, { emissive: 0x6a6048, ei: .5 }), 0, 0, 0, spin); mesh(G.box(.34, .1, .014), M(0x3566c0, { emissive: 0x24407a, ei: .7 }), 0, .06, 0, spin); mesh(G.box(.06, .07, .016), M(C.copper, { emissive: 0x6a3a10, ei: .6 }), .12, -.05, 0, spin); }
  else if (kind === 'snowflake') { const m = M(0xdff4ff, { metal: .6, rough: .2, emissive: 0x5fd8ff, ei: 1.1 }); for (let i = 0; i < 3; i++) { const a = mesh(G.box(.4, .035, .035), m, 0, 0, 0, spin); a.rotation.z = i * Math.PI / 3; for (const s of [-1, 1]) { const t = mesh(G.box(.11, .028, .028), m, Math.cos(i * Math.PI / 3) * .13 * s, Math.sin(i * Math.PI / 3) * .13 * s, 0, spin); t.rotation.z = i * Math.PI / 3 + .9; } } mesh(G.cyl(.05, .05, .05, 6), M(C.brass, { metal: .8, rough: .3 }), 0, 0, 0, spin).rotation.x = Math.PI / 2; }
  else if (kind === 'stamp') { mesh(G.box(.26, .3, .012), M(0xf6ecd8, { emissive: 0x6a6048, ei: .5 }), 0, 0, 0, spin); mesh(G.box(.2, .24, .014), M(C.teal, { emissive: C.teal, ei: .6 }), 0, 0, 0, spin); mesh(G.cyl(.05, .05, .016, 5), M(C.amber, { emissive: C.amber, ei: 1 }), 0, 0, 0, spin).rotation.x = Math.PI / 2; }
  else { const p = mesh(G.box(.26, .34, .01), M(0xf2e6c8, { emissive: 0x6a6048, ei: .55 }), 0, 0, 0, spin); for (let i = 0; i < 5; i++) mesh(G.box(.18, .012, .012), M(0x4a3a2a), 0, .1 - i * .05, .006, spin); p.rotation.z = .08; }
  sprite(kind === 'snowflake' ? C.ice : C.amber, 1.1, 0, 0, 0, g, .55);
  g.userData.spin = spin; return g;
}
export const KEEPSAKE_KINDS = { badge: 'Railway badge', postcard: 'Winter postcard', snowflake: 'Clockwork snowflake', stamp: 'Travel stamp', page: 'Journal page' };

// The waymark: a frosted glass disc with a frost-fern that grows as the journey goes on.
export function makeWaymark(color = C.ice) {
  const g = new THREE.Group();
  mesh(G.cyl(.09, .09, .014, 20), new THREE.MeshStandardMaterial({ color: 0xdff4ff, emissive: color, emissiveIntensity: 1.4, roughness: .1, transparent: true, opacity: .9 }), 0, 0, 0, g).rotation.x = Math.PI / 2;
  mesh(G.torus(.09, .012, 20), M(C.brass, { metal: .8, rough: .25 }), 0, 0, 0, g);
  sprite(color, .6, 0, 0, 0, g, .6);
  return g;
}

// The Kindling Star: a small brass lantern-star that only lights when it is shared.
export function makeKindlingStar() {
  const g = new THREE.Group();
  const core = new THREE.MeshStandardMaterial({ color: 0x6b5a3a, emissive: C.amber, emissiveIntensity: 0, roughness: .3, metalness: .5 });
  mesh(new THREE.OctahedronGeometry(.085, 0), core, 0, 0, 0, g);
  const brass = M(C.brass, { metal: .85, rough: .2 });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; const s = mesh(G.cone(.026, .12, 5), brass, Math.cos(a) * .12, Math.sin(a) * .12, 0, g); s.rotation.z = a - Math.PI / 2; }
  mesh(G.torus(.1, .012, 20), brass, 0, 0, 0, g); mesh(G.torus(.1, .012, 20), brass, 0, 0, 0, g).rotation.y = Math.PI / 2;
  mesh(G.torus(.03, .008, 10), brass, 0, .2, 0, g);
  const halo = sprite(C.amber, 1.6, 0, 0, 0, g, 0);
  const light = new THREE.PointLight(C.amber, 0, 7, 1.8); g.add(light);
  g.userData.setGlow = k => { core.emissiveIntensity = 2.6 * k; halo.material.opacity = .5 * k; halo.scale.setScalar(.9 + k * .7); light.intensity = 7 * k; };
  g.userData.glow = 0;
  return g;
}

// ---------- furniture and bits ----------
export function crate(w = 1, h = 1, d = 1, color = 0x9a6a3c) {
  const g = new THREE.Group(); mesh(G.box(w, h, d), new THREE.MeshStandardMaterial({ map: T.wood('#9a6a3c', '#5a3a22'), color, roughness: .85 }), 0, h / 2, 0, g);
  for (const s of [-1, 1]) { mesh(G.box(w + .04, .08, d + .04), M(0x5a3a22), 0, h / 2 + s * (h / 2 - .06), 0, g); }
  return g;
}
export function gift(w = .6, h = .5, d = .6, color = 0x2a8f8a, ribbon = 0xf6ecd8) {
  const g = new THREE.Group(); mesh(G.rbox(w, h, d, .04), M(color, { rough: .6 }), 0, h / 2, 0, g);
  mesh(G.box(w + .02, h + .02, d * .16), M(ribbon, { rough: .5 }), 0, h / 2, 0, g); mesh(G.box(w * .16, h + .02, d + .02), M(ribbon, { rough: .5 }), 0, h / 2, 0, g);
  for (const s of [-1, 1]) { const b = mesh(G.torus(w * .13, .03, 10), M(ribbon, { rough: .5 }), s * w * .13, h + .06, 0, g); b.rotation.y = Math.PI / 2; b.rotation.x = s * .5; }
  return g;
}
export function gear(r = 1, teeth = 10, thick = .16, color = C.brass) {
  const g = new THREE.Group(), m = M(color, { metal: .75, rough: .32 });
  mesh(G.cyl(r, r, thick, 28), m, 0, 0, 0, g).rotation.x = Math.PI / 2;
  for (let i = 0; i < teeth; i++) { const a = i / teeth * TAU; const t = mesh(G.box(r * .26, r * .22, thick), m, Math.cos(a) * r * 1.06, Math.sin(a) * r * 1.06, 0, g); t.rotation.z = a; }
  mesh(G.cyl(r * .22, r * .22, thick * 1.6, 12), M(C.iron, { metal: .6, rough: .4 }), 0, 0, 0, g).rotation.x = Math.PI / 2;
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; mesh(G.cyl(r * .13, r * .13, thick * 1.05, 10), M(0x1a2030, { metal: .4 }), Math.cos(a) * r * .58, Math.sin(a) * r * .58, 0, g).rotation.x = Math.PI / 2; }
  return g;
}
export function lever(color = C.copper) {
  const g = new THREE.Group(); mesh(G.rbox(.4, .26, .3, .05), M(C.iron, { metal: .5, rough: .5 }), 0, .13, 0, g);
  const arm = new THREE.Group(); arm.position.y = .2; g.add(arm);
  mesh(G.cyl(.035, .035, .8, 8), M(0xb9c2cf, { metal: .8, rough: .25 }), 0, .4, 0, arm);
  mesh(G.sph(.1, 12, 10), M(color, { rough: .4, emissive: color, ei: .25 }), 0, .82, 0, arm);
  g.userData.arm = arm; g.userData.set = (on, snap) => { g.userData.on = on; g.userData.target = on ? .7 : -.7; if (snap) arm.rotation.z = g.userData.target; };
  g.userData.set(false, true);
  g.userData.update = dt => { arm.rotation.z = damp(arm.rotation.z, g.userData.target, 12, dt); };
  return g;
}

export { THREE };
