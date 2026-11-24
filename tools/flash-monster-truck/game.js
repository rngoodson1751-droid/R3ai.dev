// Flash's Monster Truck Smash: a world of River's Galactic Playground.
// Source for static/games/rivers-galactic-playground/flash/index.html (built by build.mjs in this folder).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const V3 = THREE.Vector3, TAU = Math.PI * 2;
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const TOUCH = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
const SAVE_KEY = 'river-galactic-playground-star-squad-v1';
const HUB = '/games/rivers-galactic-playground/';
const LAPS = 3;
const GOALS = [30, 5, 3]; // cars, dino robots, cheese mountains

// ---------------------------------------------------------------- noise
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v);
}
function fbm(x, y, o = 4) { let a = 0, f = 1, w = .5; for (let i = 0; i < o; i++) { a += vnoise(x * f, y * f) * w; f *= 2.03; w *= .5; } return a; }

// ---------------------------------------------------------------- renderer
const canvas = $('c');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { $('nogl').style.display = 'grid'; throw e; }
let quality = TOUCH ? 1.5 : 2;
renderer.setPixelRatio(Math.min(devicePixelRatio, quality));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, .3, 4000);
const SKY_FOG = new THREE.Color(0xd8789a);
scene.fog = new THREE.FogExp2(SKY_FOG, 0.0015);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
// keep stray very bright or broken pixels from smearing through the glow
composer.addPass(new ShaderPass({
  uniforms: { tDiffuse: { value: null } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c)) || any(isinf(c))) c = vec4(0.,0.,0.,1.); gl_FragColor = vec4(clamp(c.rgb, 0., 40.), clamp(c.a,0.,1.)); }',
}));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .7, .55, 1.0);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------- textures
function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
const softTex = canvasTex(64, 64, (g, w) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.7)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, w);
});
const puffTex = canvasTex(128, 128, (g) => {
  for (let i = 0; i < 9; i++) {
    const x = 64 + rand(-26, 26), y = 64 + rand(-26, 26), rr = rand(18, 34);
    const r = g.createRadialGradient(x, y, 0, x, y, rr);
    r.addColorStop(0, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
  }
});

// ---------------------------------------------------------------- sky
const SUN_DIR = new V3(-.55, .16, -.82).normalize();
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { sun: { value: SUN_DIR }, t: { value: 0 } },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }`,
  fragmentShader: `varying vec3 vD; uniform vec3 sun; uniform float t;
    float h(vec3 p){ p = fract(p*443.897); p += dot(p, p.yzx+19.19); return fract((p.x+p.y)*p.z); }
    void main(){
      vec3 d = normalize(vD); float y = d.y;
      vec3 hor = vec3(1.0,.52,.30), mid = vec3(.80,.22,.52), zen = vec3(.07,.04,.22);
      vec3 c = mix(hor, mid, smoothstep(-.02,.22,y));
      c = mix(c, zen, smoothstep(.18,.75,y));
      c = mix(c, vec3(.35,.12,.25), smoothstep(0.,-.25,y));
      float sd = max(dot(d, sun), 0.);
      c += vec3(1.,.55,.25) * pow(sd, 6.) * .5 + vec3(1.,.8,.5) * pow(sd, 60.) * 1.6 + vec3(4.,3.2,2.2) * smoothstep(.9975,.9985,sd);
      vec3 sp = floor(d*380.);
      float s = step(.9965, h(sp)) * smoothstep(.12,.5,y) * (.6+.4*sin(t*2.+h(sp+1.)*40.));
      c += vec3(1.,.95,1.) * s * 1.4;
      float band = sin(d.x*6.+d.z*3.+t*.08)*.5+.5;
      c += vec3(.15,.9,.7) * smoothstep(.35,.6,y) * smoothstep(.75,.35,y) * band * .08;
      gl_FragColor = vec4(c,1.);
    }`,
});
const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 24), skyMat);
skyMesh.renderOrder = -10;
scene.add(skyMesh);

// environment map for reflections from the same sky
{
  const pm = new THREE.PMREMGenerator(renderer);
  const es = new THREE.Scene();
  const m = skyMat.clone(); m.uniforms.sun.value = SUN_DIR;
  es.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), m));
  const gnd = new THREE.Mesh(new THREE.CircleGeometry(90, 32), new THREE.MeshBasicMaterial({ color: 0x5a2a30 }));
  gnd.rotation.x = -Math.PI / 2; gnd.position.y = -6; es.add(gnd);
  for (let i = 0; i < 6; i++) { // light panels so chrome sparkles
    const p = new THREE.Mesh(new THREE.PlaneGeometry(20, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 4.6, 4), side: THREE.DoubleSide }));
    const a = i / 6 * TAU; p.position.set(Math.cos(a) * 60, 40, Math.sin(a) * 60); p.lookAt(0, 0, 0); es.add(p);
  }
  scene.environment = pm.fromScene(es, .02).texture;
  scene.environmentIntensity = .9;
}

// ringed planet and moons
{
  const pt = canvasTex(512, 256, (g, w, h) => {
    const cols = ['#5fe0d0', '#3a9bd8', '#7b5cd6', '#c06ad8', '#4fd0c0', '#2a6fb8', '#9a7be8'];
    for (let y = 0; y < h; y += 2) { g.fillStyle = cols[Math.floor((Math.sin(y * .09) * 3 + Math.sin(y * .023) * 4 + 7)) % cols.length]; g.fillRect(0, y, w, 2); }
    g.globalAlpha = .25; for (let i = 0; i < 40; i++) { g.fillStyle = '#fff'; g.fillRect(0, rand(0, h), w, 1); }
  });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(240, 64, 32), new THREE.MeshStandardMaterial({ map: pt, roughness: .8, fog: false, emissive: 0x112244, emissiveIntensity: .3 }));
  planet.position.set(900, 760, -1900); planet.rotation.z = .35; scene.add(planet);
  const rt = canvasTex(512, 8, (g, w) => {
    for (let x = 0; x < w; x++) { const a = (Math.sin(x * .21) * .5 + .5) * (Math.sin(x * .053) * .3 + .7) * (x > 40 && x < 500 ? 1 : 0); g.fillStyle = `rgba(255,${200 + Math.sin(x * .1) * 40 | 0},${210 + Math.sin(x * .07) * 40 | 0},${a.toFixed(3)})`; g.fillRect(x, 0, 1, 8); }
  });
  const ringGeo = new THREE.RingGeometry(300, 520, 128, 1);
  const uv = ringGeo.attributes.uv, pos = ringGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) { const r = Math.hypot(pos.getX(i), pos.getY(i)); uv.setXY(i, (r - 300) / 220, .5); }
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ map: rt, transparent: true, side: THREE.DoubleSide, fog: false, depthWrite: false, color: new THREE.Color(1.3, 1.1, 1.2) }));
  ring.position.copy(planet.position); ring.rotation.set(-1.25, .2, .35); scene.add(ring);
  const moonMat = new THREE.MeshStandardMaterial({ color: 0xffe0f0, roughness: 1, fog: false, emissive: 0x442233 });
  const m1 = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), moonMat); m1.position.set(-1100, 900, -1500); scene.add(m1);
  const m2 = new THREE.Mesh(new THREE.SphereGeometry(28, 24, 12), moonMat); m2.position.set(-700, 1150, -1700); scene.add(m2);
}

// ---------------------------------------------------------------- lights
const hemi = new THREE.HemisphereLight(0xffb8e0, 0x7a3a2a, 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd2a8, 3.3);
sun.castShadow = true;
sun.shadow.mapSize.set(TOUCH ? 1024 : 2048, TOUCH ? 1024 : 2048);
const SC = 62; Object.assign(sun.shadow.camera, { left: -SC, right: SC, top: SC, bottom: -SC, near: 1, far: 400 });
sun.shadow.bias = -.0004; sun.shadow.normalBias = .04;
scene.add(sun, sun.target);
const boomLight = new THREE.PointLight(0xff8a30, 0, 60, 1.6); scene.add(boomLight);

// ---------------------------------------------------------------- track
const CP = [[0, 0, 0], [0, 1, -120], [30, 7, -220], [110, 11, -262], [205, 4, -232], [252, 0, -150], [242, 8, -62], [292, 14, 22], [302, 6, 122], [236, 0, 192], [132, 5, 168], [62, 11, 232], [-40, 6, 262], [-132, 0, 205], [-152, 4, 102], [-92, 0, 44]];
const curve = new THREE.CatmullRomCurve3(CP.map(p => new V3(p[0], p[1], p[2])), true, 'centripetal');
const TL = curve.getLength();
const N = 2000, STEP = TL / N;
const TP = curve.getSpacedPoints(N); // TP[N] == TP[0]
const TT = [], TS = [];
for (let i = 0; i < N; i++) {
  const a = TP[(i - 1 + N) % N], b = TP[(i + 1) % N];
  const t = new V3().subVectors(b, a); t.y = 0; t.normalize();
  TT.push(t); TS.push(new V3(-t.z, 0, t.x));
}
const W = 26, HW = W / 2, LIM = HW - 2.5;
const _f = { p: new V3(), t: new V3(), s: new V3(), yaw: 0 };
function frame(s, out = _f) {
  let u = (((s % TL) + TL) % TL) / STEP; const i = Math.floor(u) % N, j = (i + 1) % N, f = u - Math.floor(u);
  out.p.lerpVectors(TP[i], TP[j], f);
  out.t.lerpVectors(TT[i], TT[j], f).normalize();
  out.s.set(-out.t.z, 0, out.t.x);
  out.yaw = Math.atan2(out.t.x, out.t.z);
  return out;
}
function wrapS(s) { return ((s % TL) + TL) % TL; }
const RAMPS = [{ s: 330, up: 22, h: 6.2 }, { s: 760, up: 24, h: 7 }, { s: 1180, up: 22, h: 6.2 }, { s: 1530, up: 26, h: 8 }].filter(r => r.s + 60 < TL);
function rampH(s) {
  s = wrapS(s);
  for (const r of RAMPS) { const d = s - r.s; if (d >= 0 && d < r.up) return r.h * d / r.up; }
  return 0;
}
function groundAt(s) { return frame(s, _g).p.y + rampH(s); }
const _g = { p: new V3(), t: new V3(), s: new V3(), yaw: 0 };
function worldAt(s, x, out = new V3()) { const f = frame(s, _g); return out.copy(f.p).addScaledVector(f.s, x); }

// ---------------------------------------------------------------- shared materials
const MAT = {
  chrome: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: .12 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x23262e, metalness: .8, roughness: .45 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x141416, roughness: .88, metalness: 0 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x0b1220, metalness: .2, roughness: .05, clearcoat: 1, clearcoatRoughness: .02 }),
  crackGlass: new THREE.MeshStandardMaterial({ color: 0x9fb8cc, metalness: .3, roughness: .6 }),
  head: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2d0, emissiveIntensity: 6 }),
  tail: new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff1010, emissiveIntensity: 4 }),
  amber: new THREE.MeshStandardMaterial({ color: 0xffb000, emissive: 0xffa000, emissiveIntensity: 5 }),
};
const paintCache = {};
function paint(hex, metal = .55) {
  const k = hex + ':' + metal;
  return paintCache[k] || (paintCache[k] = new THREE.MeshPhysicalMaterial({ color: hex, metalness: metal, roughness: .32, clearcoat: 1, clearcoatRoughness: .05 }));
}
function shadow(o, cast = true, recv = true) { o.traverse(m => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = recv; } }); return o; }

// ---------------------------------------------------------------- ground
{
  const SIZE = 2600, SEG = TOUCH ? 200 : 260, CX = 75, CZ = 0;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  const samp = []; for (let i = 0; i < N; i += 4) samp.push(TP[i]);
  const cA = new THREE.Color(0xc4553a), cB = new THREE.Color(0xe89a5a), cC = new THREE.Color(0x7a2f3a), tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + CX, z = pos.getZ(i) + CZ; pos.setX(i, x); pos.setZ(i, z);
    let best = 1e9, by = 0;
    for (const p of samp) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) { best = d; by = p.y; } }
    const d = Math.sqrt(best);
    const dune = fbm(x * .006, z * .006) * 26 + fbm(x * .03, z * .03, 2) * 4 - 9;
    const far = smooth(d, 22, 70);
    const y = lerp(by - .45, by + dune, far) + smooth(d, 400, 1100) * 40;
    pos.setY(i, y);
    const n = fbm(x * .02 + 5, z * .02, 3);
    tmp.copy(cA).lerp(cB, n).lerp(cC, clamp((dune + 4) / -14, 0, 1) * far);
    if (d < 20) tmp.lerp(new THREE.Color(0x8a4a38), 1 - smooth(d, 14, 20));
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const grain = canvasTex(256, 256, (g, w, h) => {
    const id = g.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const v = 200 + Math.random() * 55; id.data[i * 4] = v; id.data[i * 4 + 1] = v; id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    g.putImageData(id, 0, 0);
  }, { repeat: true });
  grain.repeat.set(300, 300);
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, map: grain }));
  ground.receiveShadow = true; scene.add(ground);
}
function smooth(x, a, b) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

// road
{
  const roadTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#6b3b2c'; g.fillRect(0, 0, w, h);
    const id = g.getImageData(0, 0, w, h);
    for (let i = 0; i < w * h; i++) { const n = (Math.random() - .5) * 34; id.data[i * 4] += n; id.data[i * 4 + 1] += n * .8; id.data[i * 4 + 2] += n * .6; }
    g.putImageData(id, 0, 0);
    for (let k = 0; k < 4; k++) { // tyre tracks
      const x0 = [.2, .34, .62, .78][k] * w;
      for (let y = 0; y < h; y += 10) { g.fillStyle = 'rgba(40,18,14,.35)'; g.fillRect(x0 + Math.sin(y * .02 + k) * 6, y, 26, 6); }
    }
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${pick(['230,160,110', '60,30,20', '255,200,150'])},.4)`; g.beginPath(); g.arc(rand(0, w), rand(0, h), rand(1, 4), 0, TAU); g.fill(); }
    g.fillStyle = '#fff'; g.fillRect(0, 0, 14, h); g.fillRect(w - 14, 0, 14, h);
    g.fillStyle = '#ffcc22'; g.fillRect(16, 0, 6, h); g.fillRect(w - 22, 0, 6, h);
  }, { repeat: true });
  const cols = 8, pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const p = TP[i % N], sd = TS[i % N];
    for (let c = 0; c <= cols; c++) {
      const x = -HW + W * c / cols;
      pos.push(p.x + sd.x * x, p.y + .04, p.z + sd.z * x);
      uv.push(c / cols, i * STEP / 22);
    }
  }
  for (let i = 0; i < N; i++) for (let c = 0; c < cols; c++) {
    const a = i * (cols + 1) + c, b = a + cols + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const road = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: roadTex, roughness: .9, metalness: 0 }));
  road.receiveShadow = true; scene.add(road);
}

// tyre walls
{
  const tg = new THREE.TorusGeometry(.95, .42, 10, 20); tg.rotateX(Math.PI / 2);
  const per = 3, spacing = 2.6, count = Math.floor(TL / spacing) * 2 * per;
  const im = new THREE.InstancedMesh(tg, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .7 }), count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(); let k = 0;
  const palette = [0x161616, 0x161616, 0xffcc00, 0x161616, 0x2f86ff, 0x161616, 0xff3b30];
  for (let s = 0, n = 0; s < TL - 1; s += spacing, n++) {
    const f = frame(s);
    for (const side of [-1, 1]) {
      for (let h = 0; h < per; h++) {
        const p = f.p.clone().addScaledVector(f.s, side * (HW + 1.1)); p.y += .42 + h * .78;
        q.setFromAxisAngle(new V3(0, 1, 0), n * .7 + h);
        m.compose(p, q, new V3(1, 1, 1));
        im.setMatrixAt(k, m); im.setColorAt(k, c.setHex(palette[(n + (side > 0 ? 3 : 0)) % palette.length]));
        k++;
      }
    }
  }
  im.count = k; im.castShadow = true; im.receiveShadow = true; scene.add(im);
}

// ramps
const rampTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#ffd21e'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#16161c';
  for (let i = -2; i < 6; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w / 2, i * 64 - 50); g.lineTo(w, i * 64); g.lineTo(w, i * 64 + 26); g.lineTo(w / 2, i * 64 - 24); g.lineTo(0, i * 64 + 26); g.fill(); }
}, { repeat: true });
for (const r of RAMPS) {
  const slices = 10, pos = [], uv = [], idx = [];
  const pushV = (s, x, y, u, v) => { const f = frame(s); pos.push(f.p.x + f.s.x * x, f.p.y + y, f.p.z + f.s.z * x); uv.push(u, v); };
  for (let i = 0; i <= slices; i++) { const d = r.up * i / slices, y = r.h * i / slices + .06; pushV(r.s + d, -HW, y, 0, d / 6); pushV(r.s + d, HW, y, 2, d / 6); }
  for (let i = 0; i < slices; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const base = pos.length / 3; // back face
  pushV(r.s + r.up, -HW, r.h + .06, 0, 0); pushV(r.s + r.up, HW, r.h + .06, 2, 0); pushV(r.s + r.up, -HW, 0, 0, 1); pushV(r.s + r.up, HW, 0, 2, 1);
  idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  for (const side of [-1, 1]) { // side faces
    const b2 = pos.length / 3;
    for (let i = 0; i <= slices; i++) { const d = r.up * i / slices; pushV(r.s + d, side * HW, r.h * i / slices + .06, d / 6, 0); pushV(r.s + d, side * HW, 0, d / 6, .3); }
    for (let i = 0; i < slices; i++) { const a = b2 + i * 2; side > 0 ? idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) : idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: rampTex, roughness: .45, metalness: .3, side: THREE.DoubleSide }));
  shadow(mesh); scene.add(mesh);
  // arrow lights on the lip
  const f = frame(r.s + r.up);
  for (let x = -HW + 1.5; x <= HW - 1.5; x += 2.5) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.28, 10, 8), MAT.amber);
    b.position.copy(f.p).addScaledVector(f.s, x); b.position.y += r.h + .3; scene.add(b);
  }
}

// ---------------------------------------------------------------- scenery
const flags = [];
const crowd = [];
{
  // start / finish arch
  const f = frame(0);
  const arch = new THREE.Group();
  const pillarMat = paint(0x1c1c28, .7);
  for (const side of [-1, 1]) {
    const p = new THREE.Mesh(new RoundedBoxGeometry(2.2, 16, 2.2, 3, .3), pillarMat); p.position.set(side * (HW + 2.5), 8, 0); arch.add(p);
    for (let y = 2; y < 16; y += 2) { const b = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), y % 4 ? MAT.amber : MAT.head); b.position.set(side * (HW + 2.5) - side * 1.15, y, 0); arch.add(b); }
  }
  const sign = canvasTex(1024, 192, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a1050'); gr.addColorStop(1, '#3a1680'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) for (let y = 0; y < 32; y += 16) { g.fillStyle = ((x / 32 + y / 16) % 2) ? '#fff' : '#111'; g.fillRect(x, y, 32, 16); g.fillRect(x, h - 32 + y, 32, 16); }
    g.font = 'italic 900 92px Arial Black, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 14; g.strokeStyle = '#0a0630'; g.strokeText("⚡ FLASH'S MONSTER SMASH ⚡", w / 2, h / 2 + 4);
    const tg = g.createLinearGradient(0, 50, 0, 140); tg.addColorStop(0, '#fff7b0'); tg.addColorStop(.5, '#ffd21e'); tg.addColorStop(1, '#ff8a1e');
    g.fillStyle = tg; g.fillText("⚡ FLASH'S MONSTER SMASH ⚡", w / 2, h / 2 + 4);
  });
  const beam = new THREE.Mesh(new RoundedBoxGeometry(W + 8, 4.4, 1.6, 3, .3), [pillarMat, pillarMat, pillarMat, pillarMat,
    new THREE.MeshStandardMaterial({ map: sign, emissive: 0xffffff, emissiveMap: sign, emissiveIntensity: 1.4 }), new THREE.MeshStandardMaterial({ map: sign, emissive: 0xffffff, emissiveMap: sign, emissiveIntensity: 1.4 })]);
  beam.position.y = 15; arch.add(beam);
  arch.position.copy(f.p); arch.rotation.y = f.yaw; shadow(arch); scene.add(arch);
  // checkered line
  const chk = canvasTex(256, 32, (g, w, h) => { for (let x = 0; x < w; x += 16) for (let y = 0; y < h; y += 16) { g.fillStyle = ((x + y) / 16) % 2 ? '#fff' : '#111'; g.fillRect(x, y, 16, 16); } });
  const line = new THREE.Mesh(new THREE.PlaneGeometry(W, 3.2), new THREE.MeshStandardMaterial({ map: chk, roughness: .6 }));
  line.rotation.x = -Math.PI / 2; line.rotation.z = f.yaw + Math.PI; line.position.copy(f.p); line.position.y += .07; line.receiveShadow = true; scene.add(line);

  // grandstands with a cheering crowd
  const standMat = new THREE.MeshStandardMaterial({ color: 0x3a3f58, metalness: .5, roughness: .5 });
  const seatColors = [0xff3b30, 0xffcc00, 0x2f86ff, 0x35d992, 0xff8fd0, 0xffffff, 0xa97bff, 0xff9a3c];
  const person = mergeGeometries([new THREE.CapsuleGeometry(.32, .55, 4, 8).translate(0, .6, 0), new THREE.SphereGeometry(.26, 10, 8).translate(0, 1.25, 0)]);
  const crowdCount = 900;
  const im = new THREE.InstancedMesh(person, new THREE.MeshStandardMaterial({ roughness: .6 }), crowdCount);
  let k = 0; const standGeos = [];
  for (const side of [-1, 1]) for (let s = 10; s < 100; s += 3) {
    const fr = frame(s);
    for (let row = 0; row < 7; row++) {
      const off = side * (HW + 7 + row * 2.2), hgt = row * 1.3;
      const st = new THREE.Object3D();
      st.position.copy(fr.p).addScaledVector(fr.s, off); st.position.y += (hgt + 1) / 2 - .3; st.rotation.y = fr.yaw; st.updateMatrix();
      standGeos.push(new THREE.BoxGeometry(2.2, hgt + 1, 3.05).applyMatrix4(st.matrix));
      for (let j = 0; j < 2 && k < crowdCount; j++) {
        if (Math.random() < .12) continue;
        const p = st.position.clone().addScaledVector(fr.t, j * 1.4 - .7); p.y = fr.p.y + hgt + .7;
        crowd.push({ p, ph: rand(0, TAU), sp: rand(5, 9), i: k });
        im.setColorAt(k, new THREE.Color(pick(seatColors)));
        k++;
      }
    }
  }
  im.count = k; im.castShadow = true; scene.add(im); crowd.mesh = im;
  const stands = new THREE.Mesh(mergeGeometries(standGeos), standMat); stands.receiveShadow = true; stands.castShadow = true; scene.add(stands);
}
{
  // flood light towers with soft light beams
  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { c: { value: new THREE.Color(1, .85, .6) } },
    vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = uv.y; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying float vY; varying vec3 vN; varying vec3 vV; uniform vec3 c; void main(){ float e = pow(abs(dot(vN,vV)), 1.5); gl_FragColor = vec4(c, .16 * pow(vY,1.6) * e); }`,
  });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4dc, emissiveIntensity: 9 });
  for (let i = 0; i < 12; i++) {
    let s = TL * (i + .5) / 12; if (s < 115) s += 110; const f = frame(s), side = i % 2 ? 1 : -1;
    const base = f.p.clone().addScaledVector(f.s, side * (HW + 9));
    const g = new THREE.Group(); g.position.copy(base); g.position.y -= .5;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.45, .75, 30, 10), MAT.darkMetal); pole.position.y = 15; g.add(pole);
    const head = new THREE.Group(); head.position.y = 30; g.add(head);
    head.add(new THREE.Mesh(new THREE.BoxGeometry(7, 3.4, 1), MAT.darkMetal));
    for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) { const l = new THREE.Mesh(new THREE.CircleGeometry(.62, 16), lampMat); l.position.set((a - 1) * 2.2, (b - .5) * 1.5, .52); head.add(l); }
    const target = f.p.clone(); const top = base.clone(); top.y += 29.5;
    const len = top.distanceTo(target);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(11, len, 32, 1, true), beamMat);
    cone.position.copy(top).lerp(target, .5); cone.lookAt(top); cone.rotateX(Math.PI / 2);
    scene.add(cone);
    shadow(g, true, false); scene.add(g);
    g.updateMatrixWorld(true); head.lookAt(target);
  }
}
{
  // rocks and glowing crystals
  const rockGeo = new THREE.DodecahedronGeometry(1, 1);
  { const p = rockGeo.attributes.position; for (let i = 0; i < p.count; i++) { const v = new V3().fromBufferAttribute(p, i); v.multiplyScalar(1 + (fbm(v.x * 2 + 9, v.z * 2 + v.y) - .5) * .5); p.setXYZ(i, v.x, v.y, v.z); } rockGeo.computeVertexNormals(); }
  const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: 0x9a4a40, roughness: .92, flatShading: true }), 420);
  const crystal = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), 240);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); let rk = 0, ck = 0;
  const samp = []; for (let i = 0; i < N; i += 8) samp.push(TP[i]);
  const minD = (x, z) => { let b = 1e9; for (const p of samp) b = Math.min(b, (p.x - x) ** 2 + (p.z - z) ** 2); return Math.sqrt(b); };
  let tries = 0;
  while ((rk < 420 || ck < 240) && tries++ < 6000) {
    const x = 75 + rand(-650, 650), z = rand(-650, 650), d = minD(x, z), sc = rand(1.5, 9) * (d > 120 ? 2 : 1);
    if (d < HW + 6 + sc) continue;
    const y = nearY(x, z);
    if (rk < 420 && Math.random() < .7) {
      e.set(rand(0, 3), rand(0, 3), rand(0, 3)); q.setFromEuler(e);
      m.compose(new V3(x, y + sc * .25, z), q, new V3(sc * rand(.7, 1.4), sc * rand(.5, 1.1), sc * rand(.7, 1.4)));
      rocks.setMatrixAt(rk++, m);
    } else if (ck < 240 && d < 160) {
      const cc = pick([[3, .5, 4.5], [.4, 3, 4], [4, 1, 2.6], [1.2, 4, 2]]);
      for (let j = 0; j < 4 && ck < 240; j++) {
        e.set(rand(-.4, .4), rand(0, 3), rand(-.4, .4)); q.setFromEuler(e);
        const cs = rand(.6, 1.6);
        m.compose(new V3(x + rand(-1.5, 1.5), y + cs * 1.2, z + rand(-1.5, 1.5)), q, new V3(cs * .7, cs * 2.8, cs * .7));
        crystal.setMatrixAt(ck, m); crystal.setColorAt(ck, new THREE.Color(...cc)); ck++;
      }
    }
  }
  rocks.count = rk; crystal.count = ck; rocks.castShadow = rocks.receiveShadow = true;
  scene.add(rocks, crystal);
  function nearY(x, z) { let b = 1e9, y = 0; for (const p of samp) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < b) { b = d; y = p.y; } } return y - 1; }

  // rock arches over the track
  for (const s of [530, 1340]) {
    if (s > TL) continue;
    const f = frame(s);
    const g = new THREE.TorusGeometry(19, 3.8, 12, 40, Math.PI);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = new V3().fromBufferAttribute(p, i); const n = fbm(v.x * .2 + 3, v.y * .2 + v.z * .2, 3); v.multiplyScalar(1 + (n - .5) * .16); p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals();
    const a = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xb05a48, roughness: .95, flatShading: true }));
    a.position.copy(f.p); a.position.y -= 2; a.rotation.y = f.yaw; shadow(a); scene.add(a);
  }

  // distant mesas and a volcano
  const mesaMat = new THREE.MeshStandardMaterial({ color: 0x6a2a3a, roughness: 1, flatShading: true });
  for (let i = 0; i < 46; i++) {
    const a = rand(0, TAU), r = rand(720, 1150), h = rand(60, 220), rb = rand(60, 160);
    const ms = new THREE.Mesh(new THREE.CylinderGeometry(rb * rand(.45, .8), rb, h, 7, 1), mesaMat);
    ms.position.set(75 + Math.cos(a) * r, h / 2 - 10, Math.sin(a) * r); ms.rotation.y = rand(0, 3); scene.add(ms);
  }
  const vol = new THREE.Mesh(new THREE.CylinderGeometry(40, 260, 300, 16, 1, true), mesaMat); vol.position.set(-520, 140, -760); scene.add(vol);
  const lava = new THREE.Mesh(new THREE.CircleGeometry(40, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 1.6, .3) })); lava.rotation.x = -Math.PI / 2; lava.position.set(-520, 289, -760); scene.add(lava);
  scene.userData.volcano = new V3(-520, 295, -760);
}

// waving flags around the track
{
  const cols = [0xff3b30, 0xffcc00, 0x2f86ff, 0x35d992, 0xff8fd0, 0xa97bff];
  for (let i = 0; i < 26; i++) {
    const s = TL * i / 26 + 40, f = frame(s), side = i % 2 ? 1 : -1;
    const base = f.p.clone().addScaledVector(f.s, side * (HW + 3.5));
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, 9, 8), MAT.chrome); pole.position.copy(base); pole.position.y += 4.5; scene.add(pole);
    const g = new THREE.PlaneGeometry(4, 2.4, 10, 4);
    g.translate(2, 0, 0);
    const fl = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide, roughness: .6 }));
    fl.position.copy(base); fl.position.y += 7.6; fl.rotation.y = f.yaw + Math.PI / 2 * side; fl.castShadow = true; scene.add(fl);
    flags.push({ g, base: Float32Array.from(g.attributes.position.array), ph: rand(0, TAU) });
  }
}

// ---------------------------------------------------------------- particles
class Particles {
  constructor(n, additive, tex) {
    this.n = n; this.i = 0;
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 4); this.size = new Float32Array(n);
    this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.max = new Float32Array(n);
    this.s0 = new Float32Array(n); this.grow = new Float32Array(n); this.a0 = new Float32Array(n); this.drag = new Float32Array(n); this.grav = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('pc', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { map: { value: tex }, scale: { value: 600 } },
      vertexShader: `attribute float size; attribute vec4 pc; varying vec4 vC; uniform float scale;
        void main(){ vC = pc; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = size*scale/max(.5,-mv.z); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform sampler2D map; varying vec4 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); float a = vC.a*t.a; if(a<.004) discard; gl_FragColor = vec4(vC.rgb*t.rgb, a); }`,
    });
    this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = additive ? 3 : 2;
    scene.add(this.pts);
  }
  emit(x, y, z, vx, vy, vz, life, size, r, g, b, a = 1, o = {}) {
    const i = this.i; this.i = (i + 1) % this.n;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.col[i * 4] = r; this.col[i * 4 + 1] = g; this.col[i * 4 + 2] = b; this.col[i * 4 + 3] = 0;
    this.a0[i] = a; this.life[i] = this.max[i] = life; this.s0[i] = size; this.size[i] = size;
    this.grow[i] = o.grow || 0; this.drag[i] = o.drag ?? 1; this.grav[i] = o.g ?? 0;
  }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) { if (this.col[i * 4 + 3] !== 0) this.col[i * 4 + 3] = 0; continue; }
      this.life[i] -= dt;
      const k = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= k; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * k - this.grav[i] * dt; this.vel[i * 3 + 2] *= k;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const t = 1 - this.life[i] / this.max[i];
      this.size[i] = this.s0[i] * (1 + this.grow[i] * t);
      this.col[i * 4 + 3] = this.a0[i] * Math.min(1, t * 8) * (1 - t) * (this.life[i] > 0 ? 1 : 0);
    }
    const a = this.pts.geometry.attributes; a.position.needsUpdate = a.pc.needsUpdate = a.size.needsUpdate = true;
  }
}
const FX = new Particles(TOUCH ? 1800 : 3000, true, softTex);   // sparks, fire, glow
const SMOKE = new Particles(TOUCH ? 1100 : 1800, false, puffTex); // dust, smoke, stink
function setParticleScale() { const s = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)); FX.mat.uniforms.scale.value = SMOKE.mat.uniforms.scale.value = s; }

function sparks(p, n, col = [4, 2.6, .8], sp = 14) {
  for (let i = 0; i < n; i++) FX.emit(p.x, p.y, p.z, rand(-sp, sp), rand(2, sp * 1.2), rand(-sp, sp), rand(.35, .8), rand(.12, .3), col[0], col[1], col[2], 1, { g: 26, drag: 1.5 });
}
function fireball(p, n = 30, scale = 1) {
  for (let i = 0; i < n; i++) FX.emit(p.x + rand(-1, 1), p.y + rand(0, 2), p.z + rand(-1, 1), rand(-8, 8) * scale, rand(2, 12) * scale, rand(-8, 8) * scale, rand(.4, .9), rand(1.4, 3) * scale, 1.6, rand(.45, .8), .12, .7, { grow: 1.5, drag: 3, g: -4 });
  for (let i = 0; i < n * .7; i++) SMOKE.emit(p.x + rand(-1, 1), p.y + rand(1, 3), p.z + rand(-1, 1), rand(-5, 5), rand(3, 9), rand(-5, 5), rand(1.2, 2.4), rand(2.5, 4.5) * scale, .18, .14, .18, .7, { grow: 2.2, drag: 1.6, g: -2 });
}
function dust(p, n = 6, s = 1) {
  for (let i = 0; i < n; i++) SMOKE.emit(p.x + rand(-1, 1), p.y + .3, p.z + rand(-1, 1), rand(-3, 3), rand(.5, 3), rand(-3, 3), rand(.6, 1.4), rand(1.2, 2.4) * s, .78, .45, .34, .5, { grow: 2.4, drag: 2 });
}

// ---------------------------------------------------------------- popup words
const popups = [];
function popWord(text, p, color = '#ffd21e', big = 1) {
  const tex = canvasTex(512, 160, (g, w, h) => {
    g.font = 'italic 900 104px Arial Black, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 18; g.strokeStyle = '#1a0a40'; g.strokeText(text, w / 2, h / 2);
    g.lineWidth = 6; g.strokeStyle = '#fff'; g.strokeText(text, w / 2, h / 2);
    g.fillStyle = color; g.fillText(text, w / 2, h / 2);
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, fog: false, color: new THREE.Color(.8, .8, .8) }));
  sp.renderOrder = 10; sp.position.copy(p); sp.position.y += 5; scene.add(sp);
  if (innerHeight > innerWidth) big *= .62;
  popups.push({ sp, t: 0, big, vy: 4 });
}
function updatePopups(dt) {
  for (let i = popups.length - 1; i >= 0; i--) {
    const o = popups[i]; o.t += dt; o.sp.position.y += o.vy * dt;
    const k = o.t < .2 ? o.t / .2 * 1.25 : o.t < .35 ? lerp(1.25, 1, (o.t - .2) / .15) : 1;
    o.sp.scale.set(6.4 * k * o.big, 2 * k * o.big, 1);
    o.sp.material.opacity = o.t > 1.1 ? Math.max(0, 1 - (o.t - 1.1) / .4) : 1;
    if (o.t > 1.5) { scene.remove(o.sp); o.sp.material.map.dispose(); o.sp.material.dispose(); popups.splice(i, 1); }
  }
}

// ---------------------------------------------------------------- debris
const debris = [];
function toDebris(mesh, vel, base) {
  mesh.updateWorldMatrix(true, false);
  scene.attach(mesh);
  debris.push({ m: mesh, v: vel, a: new V3(rand(-8, 8), rand(-8, 8), rand(-8, 8)), life: rand(4, 6), floor: base, r: .4 });
}
function updateDebris(dt) {
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i]; d.life -= dt;
    d.v.y -= 30 * dt; d.m.position.addScaledVector(d.v, dt);
    d.m.rotation.x += d.a.x * dt; d.m.rotation.y += d.a.y * dt; d.m.rotation.z += d.a.z * dt;
    if (d.m.position.y < d.floor + d.r) { d.m.position.y = d.floor + d.r; if (d.v.y < 0) d.v.y *= -.35; d.v.x *= .7; d.v.z *= .7; d.a.multiplyScalar(.7); }
    if (d.life < .6) d.m.scale.multiplyScalar(Math.max(0, 1 - dt * 4));
    if (d.life <= 0) { scene.remove(d.m); debris.splice(i, 1); }
  }
}

// ---------------------------------------------------------------- the trucks
function boltShape(s = 1) {
  const sh = new THREE.Shape();
  const P = [[0, 1], [.55, 1], [.25, .25], [.62, .25], [-.15, -1], [.05, -.12], [-.35, -.12]];
  sh.moveTo(P[0][0] * s, P[0][1] * s); for (const p of P.slice(1)) sh.lineTo(p[0] * s, p[1] * s); sh.closePath();
  return sh;
}
const PROFILE = [[-3.2, 0], [3.3, 0], [3.5, .55], [3.32, 1.02], [1.3, 1.22], [.55, 2.28], [-.78, 2.32], [-.98, 1.26], [-3.2, 1.2], [-3.32, .62]];
function profileShape(mirror) {
  const sh = new THREE.Shape(); const P = PROFILE.map(([x, y]) => [mirror ? -x : x, y]);
  sh.moveTo(P[0][0], P[0][1]); for (const p of P.slice(1)) sh.lineTo(p[0], p[1]); sh.closePath();
  if (mirror) return new THREE.Shape(sh.getPoints().reverse());
  return sh;
}
function decalTexture(name, frontRight, look) {
  return canvasTex(1024, 360, (g, w, h) => {
    const X = sx => (sx + 3.4) / 6.9 * w, Y = sy => h - sy / 2.4 * h;
    g.save();
    if (!frontRight) { g.translate(w, 0); g.scale(-1, 1); }
    // flames from the front
    for (let i = 0; i < 7; i++) {
      const y0 = Y(.25 + i * .12), x0 = X(3.45);
      const len = w * rand(.28, .44);
      const gr = g.createLinearGradient(x0, 0, x0 - len, 0); gr.addColorStop(0, look.flame[0]); gr.addColorStop(.5, look.flame[1]); gr.addColorStop(1, 'rgba(255,60,0,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x0, y0 - 18); g.quadraticCurveTo(x0 - len * .5, y0 - 40, x0 - len, y0 + rand(-20, 10)); g.quadraticCurveTo(x0 - len * .45, y0 + 10, x0, y0 + 18); g.fill();
    }
    // lightning bolt down the side
    g.beginPath();
    const B = [[2.9, 1.0], [.9, .95], [1.25, .62], [-1.6, .66], [-1.15, .36], [-3.1, .3], [-.6, .12], [-1.0, .44], [1.6, .4], [1.25, .72], [2.9, .78]];
    g.moveTo(X(B[0][0]), Y(B[0][1])); for (const p of B.slice(1)) g.lineTo(X(p[0]), Y(p[1])); g.closePath();
    const bg = g.createLinearGradient(0, Y(1.1), 0, Y(.1)); bg.addColorStop(0, look.bolt[0]); bg.addColorStop(1, look.bolt[1]);
    g.fillStyle = bg; g.shadowColor = look.bolt[0]; g.shadowBlur = 24; g.fill(); g.shadowBlur = 0;
    g.lineWidth = 7; g.strokeStyle = '#120830'; g.stroke();
    // window
    g.beginPath(); const Wn = [[1.12, 1.33], [.52, 2.14], [-.62, 2.19], [-.8, 1.34]];
    g.moveTo(X(Wn[0][0]), Y(Wn[0][1])); for (const p of Wn.slice(1)) g.lineTo(X(p[0]), Y(p[1])); g.closePath();
    const wg = g.createLinearGradient(0, Y(2.2), 0, Y(1.3)); wg.addColorStop(0, '#2a4a72'); wg.addColorStop(.5, '#0a1428'); wg.addColorStop(1, '#03060c');
    g.fillStyle = wg; g.fill(); g.lineWidth = 9; g.strokeStyle = '#0a0a10'; g.stroke();
    g.save(); g.clip(); g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(X(.9), Y(2.2)); g.lineTo(X(.55), Y(2.2)); g.lineTo(X(-.1), Y(1.3)); g.lineTo(X(.25), Y(1.3)); g.fill(); g.restore();
    // door seam
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3; g.strokeRect(X(-.7), Y(1.3), X(1.1) - X(-.7), Y(.15) - Y(1.3));
    g.restore();
    // name, always readable
    const cx = frontRight ? X(-1.6) : w - X(-1.6);
    g.font = 'italic 900 118px Arial Black, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 22; g.strokeStyle = '#120830'; g.strokeText(name, cx, Y(.8));
    g.lineWidth = 8; g.strokeStyle = '#ffffff'; g.strokeText(name, cx, Y(.8));
    const tg = g.createLinearGradient(0, Y(1.15), 0, Y(.45)); tg.addColorStop(0, look.text[0]); tg.addColorStop(1, look.text[1]);
    g.fillStyle = tg; g.fillText(name, cx, Y(.8));
  });
}
function tireGeometry(R, Wd) {
  const r0 = R * .6, pts = [], cr = .32;
  pts.push(new THREE.Vector2(r0, -Wd / 2 * .92));
  for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + i / 8 * Math.PI / 2; pts.push(new THREE.Vector2(R - cr + Math.cos(a) * cr, -Wd / 2 + cr + Math.sin(a) * cr)); }
  for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; pts.push(new THREE.Vector2(R - cr + Math.cos(a) * cr, Wd / 2 - cr + Math.sin(a) * cr)); }
  pts.push(new THREE.Vector2(r0, Wd / 2 * .92));
  const parts = [new THREE.LatheGeometry(pts, 44).toNonIndexed()];
  const lugN = 22;
  for (let i = 0; i < lugN; i++) for (const side of [-1, 1]) {
    const b = new THREE.BoxGeometry(.3, Wd * .46, .55);
    b.rotateX(side * .55); b.translate(0, side * Wd * .23, 0); b.translate(R - .04, 0, 0);
    b.rotateY((i + (side > 0 ? .5 : 0)) / lugN * TAU);
    parts.push(b.toNonIndexed());
  }
  const g = mergeGeometries(parts);
  g.rotateZ(Math.PI / 2);
  return g;
}
const TIRE = tireGeometry(1.7, 1.55);
function makeWheel(look) {
  const spin = new THREE.Group();
  const tire = new THREE.Mesh(TIRE, MAT.rubber); spin.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.25, 28), MAT.chrome); rim.rotation.z = Math.PI / 2; spin.add(rim);
  const hubMat = paint(look.rim, .7);
  for (const side of [-1, 1]) {
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(.82, .95, .08, 28), MAT.darkMetal); dish.rotation.z = Math.PI / 2; dish.position.x = side * .64; spin.add(dish);
    for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.6, .22), hubMat); sp.position.x = side * .68; sp.rotation.x = i / 6 * Math.PI; spin.add(sp); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.3, .34, .2, 16), MAT.chrome); hub.rotation.z = Math.PI / 2; hub.position.x = side * .72; spin.add(hub);
  }
  return spin;
}
const springGeo = (() => {
  const pts = []; for (let i = 0; i <= 120; i++) { const t = i / 120, a = t * TAU * 7; pts.push(new V3(Math.cos(a) * .22, Math.sin(a) * .22, .15 + t * .7)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, .045, 6, false);
})();
const shockGeo = new THREE.CylinderGeometry(.1, .1, 1, 10).rotateX(Math.PI / 2).translate(0, 0, .5);

const LOOKS = {
  flash: { paint: 0xe0141e, rim: 0xffd21e, bolt: ['#fff27a', '#ffb000'], flame: ['#fff6b0', '#ff7a00'], text: ['#fff7b0', '#ffcc00'], light: 0xffe040 },
  thunder: { paint: 0x1d5ee8, rim: 0xc0d8ff, bolt: ['#e8f6ff', '#6fd3ff'], flame: ['#ffffff', '#3fa8ff'], text: ['#ffffff', '#9fe4ff'], light: 0x6ff3ff },
  rumble: { paint: 0x23b04a, rim: 0xb070ff, bolt: ['#f4d8ff', '#b070ff'], flame: ['#f8ffb0', '#a0ff40'], text: ['#ffffff', '#d6ff7a'], light: 0xb070ff },
};
function makeTruck(name, look) {
  const root = new THREE.Group(), tilt = new THREE.Group(), body = new THREE.Group();
  root.add(tilt); tilt.add(body);
  const BODY_Y = 2.75, WB = 2.25, TW = 2.35, WHY = 1.7;
  const paintMat = paint(look.paint, .55);
  const geo = new THREE.ExtrudeGeometry(profileShape(false), { depth: 2.9, bevelEnabled: true, bevelThickness: .14, bevelSize: .12, bevelSegments: 4, curveSegments: 6 });
  geo.rotateY(-Math.PI / 2); geo.translate(1.45, 0, 0);
  const shell = new THREE.Mesh(geo, paintMat); shell.position.y = BODY_Y; body.add(shell);
  for (const fr of [true, false]) { // decals, one per side
    const g = new THREE.ShapeGeometry(profileShape(!fr), 6);
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) { const sx = p.getX(i); uv.setXY(i, fr ? (sx + 3.4) / 6.9 : (sx + 3.5) / 6.9, p.getY(i) / 2.4); }
    g.rotateY(fr ? -Math.PI / 2 : Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ map: decalTexture(name, fr, look), transparent: true, metalness: .3, roughness: .25, clearcoat: 1, clearcoatRoughness: .04, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.set(fr ? -1.612 : 1.612, BODY_Y, 0); body.add(m);
  }
  // windscreen and back glass
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(2.75, 1.2), MAT.glass);
  ws.position.set(0, BODY_Y + 1.75 + .75 * .14, .925 + 1.06 * .14); ws.lookAt(ws.position.clone().add(new V3(0, .75, 1.06))); body.add(ws);
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(2.5, .85), MAT.glass);
  rw.position.set(0, BODY_Y + 1.85 + .2 * .14, -.88 - 1.06 * .14); rw.lookAt(rw.position.clone().add(new V3(0, .2, -1.06))); body.add(rw);
  // chassis
  const chassis = new THREE.Mesh(new RoundedBoxGeometry(1.8, .5, 6.4, 2, .1), MAT.darkMetal); chassis.position.y = BODY_Y - .25; body.add(chassis);
  for (const z of [-WB, WB]) { const ax = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, TW * 2 - .6, 12), MAT.darkMetal); ax.rotation.z = Math.PI / 2; ax.position.set(0, WHY, z); tilt.add(ax); const diff = new THREE.Mesh(new THREE.SphereGeometry(.5, 16, 12), MAT.chrome); diff.position.set(0, WHY, z); diff.scale.set(1, .8, 1); tilt.add(diff); }
  // push bar and lights
  const bar = new THREE.Mesh(new THREE.TorusGeometry(1.3, .12, 8, 24, Math.PI), MAT.chrome); bar.position.set(0, BODY_Y + .3, 3.62); bar.rotation.z = 0; body.add(bar);
  const bar2 = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 3, 10), MAT.chrome); bar2.rotation.z = Math.PI / 2; bar2.position.set(0, BODY_Y + .3, 3.62); body.add(bar2);
  for (const x of [-1.05, 1.05]) {
    const hl = new THREE.Mesh(new THREE.CircleGeometry(.26, 18), MAT.head); hl.position.set(x, BODY_Y + .72, 3.52); body.add(hl);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.28, .06, 6, 18), MAT.chrome); ring.position.copy(hl.position); body.add(ring);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(.6, .26, .05), MAT.tail); tl.position.set(x * 1.1, BODY_Y + .8, -3.35); body.add(tl);
  }
  // light bar
  const lb = new THREE.Mesh(new RoundedBoxGeometry(2.6, .32, .42, 2, .08), MAT.darkMetal); lb.position.set(0, BODY_Y + 2.5, .1); body.add(lb);
  const ledMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: look.light, emissiveIntensity: 7 });
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.CircleGeometry(.12, 12), ledMat); l.position.set(-1.05 + i * .42, BODY_Y + 2.5, .32); body.add(l); }
  // exhaust stacks
  const flames = [];
  for (const x of [-1.05, 1.05]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.17, .2, 2.6, 14), MAT.chrome); st.position.set(x, BODY_Y + 2.25, -1.25); body.add(st);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(.22, .17, .3, 14, 1, true), MAT.darkMetal); tip.position.set(x, BODY_Y + 3.6, -1.25); body.add(tip);
    flames.push(new V3(x, BODY_Y + 3.75, -1.25));
  }
  // roll cage over the bed
  const cageMat = paint(look.rim, .7);
  for (const x of [-1.25, 1.25]) { const c = new THREE.Mesh(new THREE.TorusGeometry(.9, .09, 8, 16, Math.PI), cageMat); c.rotation.y = Math.PI / 2; c.position.set(x, BODY_Y + 1.25, -2.1); body.add(c); }
  // wheels, shocks, springs
  const wheels = [];
  for (const z of [WB, -WB]) for (const x of [TW, -TW]) {
    const mount = new THREE.Group(); mount.position.set(x, WHY, z); tilt.add(mount);
    const spin = makeWheel(look); mount.add(spin);
    const shock = new THREE.Group(); shock.position.set(x * .45, BODY_Y - .1, z + (z > 0 ? -.45 : .45)); tilt.add(shock);
    shock.add(new THREE.Mesh(shockGeo, MAT.chrome));
    const spr = new THREE.Mesh(springGeo, paint(look.rim, .6)); shock.add(spr);
    wheels.push({ mount, spin, shock, z, x, off: 0, vel: 0 });
  }
  shadow(root);
  return { root, tilt, body, wheels, flames, BODY_Y, WB, WHY };
}

// ---------------------------------------------------------------- smashables
const PAINTS = [0x35d992, 0xff8fd0, 0x2f86ff, 0xffcc00, 0xa97bff, 0xff9a3c, 0x6ff3ff, 0xffffff, 0xff4f6a];
const carBodyGeo = new RoundedBoxGeometry(2.0, .78, 4.4, 3, .26);
const carCabGeo = new RoundedBoxGeometry(1.8, .74, 2.3, 3, .3);
const carRoofGeo = new RoundedBoxGeometry(1.86, .14, 2.0, 2, .06);
const carWheelGeo = new THREE.CylinderGeometry(.44, .44, .34, 18).rotateZ(Math.PI / 2);
const hubGeo = new THREE.CylinderGeometry(.24, .24, .36, 12).rotateZ(Math.PI / 2);
function makeCar() {
  const g = new THREE.Group(), pm = paint(pick(PAINTS), .4);
  const van = Math.random() < .25;
  const bodyM = new THREE.Mesh(carBodyGeo, pm); bodyM.position.y = .78; g.add(bodyM);
  const cab = new THREE.Mesh(carCabGeo, MAT.glass); cab.position.set(0, 1.5, van ? -.6 : -.2); if (van) cab.scale.set(1, 1.3, 1.45); g.add(cab);
  const roof = new THREE.Mesh(carRoofGeo, pm); roof.position.set(0, van ? 1.98 : 1.88, cab.position.z); if (van) roof.scale.z = 1.5; g.add(roof);
  const wheels = [];
  for (const x of [-.95, .95]) for (const z of [-1.4, 1.4]) { const w = new THREE.Mesh(carWheelGeo, MAT.rubber); w.position.set(x, .44, z); g.add(w); const h = new THREE.Mesh(hubGeo, MAT.chrome); w.add(h); wheels.push(w); }
  for (const x of [-.65, .65]) { const h = new THREE.Mesh(new THREE.BoxGeometry(.4, .18, .05), MAT.head); h.position.set(x, .9, 2.21); g.add(h); const t = new THREE.Mesh(new THREE.BoxGeometry(.4, .18, .05), MAT.tail); t.position.set(x, .95, -2.21); g.add(t); }
  shadow(g);
  return { g, bodyM, cab, roof, wheels };
}
const dinoMetal = new THREE.MeshStandardMaterial({ color: 0xa8b4cc, metalness: .9, roughness: .28 });
const dinoGlowC = new THREE.MeshStandardMaterial({ color: 0x6ff3ff, emissive: 0x3fe0ff, emissiveIntensity: 4 });
const dinoDark = new THREE.MeshStandardMaterial({ color: 0x2a2f3c, metalness: .7, roughness: .4 });
const dinoGlowR = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff1a1a, emissiveIntensity: 8 });
const dinoPlate = new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff5a00, emissiveIntensity: 1.6, metalness: .4, roughness: .4 });
const toothMat = new THREE.MeshStandardMaterial({ color: 0xf4f4ff, metalness: .6, roughness: .2 });
function makeDino() {
  const g = new THREE.Group(), parts = [];
  const add = (parent, mesh, x, y, z) => { mesh.position.set(x, y, z); parent.add(mesh); parts.push(mesh); return mesh; };
  const hips = new THREE.Group(); hips.position.y = 4.2; g.add(hips);
  const torso = add(hips, new THREE.Mesh(new THREE.SphereGeometry(1.5, 28, 18), dinoMetal), 0, 0, 0); torso.scale.set(.88, .86, 1.6);
  add(hips, new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.2, 2.2, 2, .25), dinoDark), 0, -.7, .4);
  for (let i = 0; i < 6; i++) { const c = add(hips, new THREE.Mesh(new THREE.ConeGeometry(.42 - i * .03, 1.2, 4), dinoPlate), 0, 1.45 - i * .08, 1.4 - i * .75); c.rotation.x = -.2; c.scale.z = .35; }
  for (let i = 0; i < 4; i++) { const zz = -1.4 + i * .95, rr = 1.5 * Math.sqrt(Math.max(.05, 1 - (zz / 2.4) ** 2)); add(hips, new THREE.Mesh(new THREE.TorusGeometry(rr * .9, .06, 6, 30), i % 2 ? dinoGlowC : dinoDark), 0, 0, zz).scale.set(.98, .96, 1); }
  const neck = new THREE.Group(); neck.position.set(0, .9, 1.9); hips.add(neck);
  const nk = add(neck, new THREE.Mesh(new THREE.CylinderGeometry(.62, .8, 1.6, 14), dinoMetal), 0, .5, .25); nk.rotation.x = .7;
  const head = new THREE.Group(); head.position.set(0, 1.3, .9); head.scale.setScalar(1.3); neck.add(head);
  add(head, new THREE.Mesh(new RoundedBoxGeometry(1.45, 1.15, 2.3, 3, .3), dinoMetal), 0, .2, .7);
  for (const x of [-.56, .56]) { add(head, new THREE.Mesh(new THREE.SphereGeometry(.26, 14, 10), dinoGlowR), x, .5, 1.42); add(head, new THREE.Mesh(new THREE.BoxGeometry(.55, .1, .3), dinoDark), x, .8, 1.25).rotation.z = x > 0 ? -.3 : .3; }
  const jaw = new THREE.Group(); jaw.position.set(0, -.25, -.1); head.add(jaw);
  add(jaw, new THREE.Mesh(new RoundedBoxGeometry(1.3, .4, 2.1, 2, .15), dinoDark), 0, -.15, .85);
  for (let i = 0; i < 6; i++) for (const x of [-.5, .5]) { const t = add(head, new THREE.Mesh(new THREE.ConeGeometry(.1, .32, 6), toothMat), x * (1 - i * .04), -.42, 1.7 - i * .3); t.rotation.x = Math.PI; }
  const legs = [];
  for (const x of [-.95, .95]) {
    const leg = new THREE.Group(); leg.position.set(x, -.3, -.3); hips.add(leg);
    add(leg, new THREE.Mesh(new RoundedBoxGeometry(.85, 1.9, 1.25, 2, .3), dinoMetal), 0, -.8, 0);
    add(leg, new THREE.Mesh(new THREE.SphereGeometry(.42, 14, 10), dinoDark), 0, -1.8, 0);
    add(leg, new THREE.Mesh(new THREE.CylinderGeometry(.32, .38, 1.4, 12), dinoMetal), 0, -2.5, -.2);
    add(leg, new THREE.Mesh(new RoundedBoxGeometry(.9, .35, 1.4, 2, .1), dinoDark), 0, -3.3, .3);
    for (const cx of [-.28, 0, .28]) add(leg, new THREE.Mesh(new THREE.ConeGeometry(.1, .35, 6), toothMat), cx, -3.32, 1.05).rotation.x = Math.PI / 2;
    legs.push(leg);
  }
  for (const x of [-.8, .8]) { const a = add(hips, new THREE.Mesh(new THREE.CapsuleGeometry(.17, .8, 4, 8), dinoMetal), x, -.2, 2.1); a.rotation.x = 1.1; add(hips, new THREE.Mesh(new THREE.ConeGeometry(.1, .3, 6), toothMat), x, -.5, 2.6).rotation.x = 2.2; }
  const tail = new THREE.Group(); tail.position.set(0, .1, -2.2); hips.add(tail);
  let par = tail; const segs = [];
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Group(); seg.position.z = i === 0 ? 0 : -.9; par.add(seg);
    const rr = .72 - i * .1; add(seg, new THREE.Mesh(new THREE.CapsuleGeometry(rr, .55, 4, 14), dinoMetal), 0, 0, -.45).rotation.x = Math.PI / 2; add(seg, new THREE.Mesh(new THREE.TorusGeometry(rr * .95, .05, 6, 20), dinoGlowC), 0, 0, -.02); if (i < 5) add(seg, new THREE.Mesh(new THREE.ConeGeometry(.22 - i * .03, .7, 4), dinoPlate), 0, rr + .15, -.45).scale.z = .35;
    segs.push(seg); par = seg;
  }
  g.scale.setScalar(1.15);
  shadow(g);
  return { g, parts, hips, legs, head, jaw, segs, neck };
}
const cheeseMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: .5, clearcoat: .35, clearcoatRoughness: .3, sheen: .4, sheenColor: new THREE.Color(0xfff2a0) });
const holeTex = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 34, 2, 32, 32, 31); r.addColorStop(0, '#7a4800'); r.addColorStop(.55, '#c98a10'); r.addColorStop(.85, '#e8ae22'); r.addColorStop(1, 'rgba(255,200,50,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const holeMat = new THREE.MeshStandardMaterial({ map: holeTex, transparent: true, roughness: .7, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
const pizzaTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#e8a040'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#d43a1a'; g.beginPath(); g.arc(w / 2, 0, h * .9, 0, Math.PI); g.fill();
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,${210 + rand(0, 40) | 0},${80 + rand(0, 60) | 0},.85)`; g.beginPath(); g.ellipse(rand(20, w - 20), rand(10, h * .8), rand(10, 26), rand(8, 18), rand(0, 3), 0, TAU); g.fill(); }
  for (let i = 0; i < 7; i++) { const x = rand(60, w - 60), y = rand(30, h * .7); g.fillStyle = '#a3141a'; g.beginPath(); g.arc(x, y, 17, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,120,120,.45)'; g.beginPath(); g.arc(x - 5, y - 5, 6, 0, TAU); g.fill(); g.fillStyle = 'rgba(60,0,0,.3)'; for (let j = 0; j < 4; j++) g.fillRect(x + rand(-10, 8), y + rand(-10, 8), 2, 2); }
  for (let i = 0; i < 6; i++) { g.fillStyle = '#2f8a2a'; g.beginPath(); g.ellipse(rand(40, w - 40), rand(30, h * .7), 7, 4, rand(0, 3), 0, TAU); g.fill(); }
  const cr = g.createLinearGradient(0, h * .86, 0, h); cr.addColorStop(0, '#c87a2a'); cr.addColorStop(1, '#f0b860'); g.fillStyle = cr; g.fillRect(0, h * .86, w, h * .14);
});
const pizzaGeo = (() => {
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(-1.25, 2.7); sh.quadraticCurveTo(0, 3.15, 1.25, 2.7); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: .2, bevelEnabled: true, bevelThickness: .08, bevelSize: .08, bevelSegments: 2 });
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + 1.3) / 2.6, uv.getY(i) / 3.1);
  return g;
})();
const pizzaMats = [new THREE.MeshStandardMaterial({ map: pizzaTex, roughness: .55 }), new THREE.MeshStandardMaterial({ color: 0xd08a3a, roughness: .7 })];
const stinkLineGeo = (() => { const p = []; for (let i = 0; i <= 30; i++) { const t = i / 30; p.push(new V3(Math.sin(t * 10) * .4, t * 4, Math.cos(t * 7) * .2)); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), 60, .09, 6); })();
const stinkMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, 2.2, .3), transparent: true, opacity: .7, depthWrite: false });
function makeCheese() {
  const g = new THREE.Group(), R = 6.5, H = 8.5;
  const geo = new THREE.IcosahedronGeometry(1, 5);
  const p = geo.attributes.position, col = new Float32Array(p.count * 3);
  const c1 = new THREE.Color(0xffd23a), c2 = new THREE.Color(0xffa812), c = new THREE.Color();
  const seed = rand(0, 99);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y0 = p.getY(i), y = Math.max(y0, 0), z = p.getZ(i);
    const n = fbm(x * 1.8 + seed, z * 1.8 + y * 1.6, 3);
    const a = Math.atan2(z, x);
    const k = (1 - .35 * y) * (1 + (n - .5) * .45) * (1 + Math.sin(a * 3 + seed) * .08);
    p.setXYZ(i, x * R * k, y0 < 0 ? y0 * 1.5 : y * H * (.85 + n * .35) * (1 - .1 * Math.cos(a * 2 + seed)), z * R * k);
    c.copy(c1).lerp(c2, clamp(n * 1.3 - .3, 0, 1)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const mound = new THREE.Mesh(geo, cheeseMat); g.add(mound);
  // holes and pizza on the surface
  const n = geo.attributes.normal, tmpN = new V3(), tmpP = new V3();
  const slices = [], holes = [];
  for (let i = 0; i < 46; i++) {
    const vi = (Math.random() * p.count) | 0; tmpP.fromBufferAttribute(p, vi); tmpN.fromBufferAttribute(n, vi);
    if (tmpP.y < .8) continue;
    const hl = new THREE.Mesh(new THREE.CircleGeometry(rand(.35, .9), 20), holeMat);
    hl.position.copy(tmpP).addScaledVector(tmpN, .03); hl.lookAt(hl.position.clone().add(tmpN)); g.add(hl); holes.push(hl);
  }
  for (let i = 0; i < 40 && slices.length < 10; i++) {
    const vi = (Math.random() * p.count) | 0; tmpP.fromBufferAttribute(p, vi); tmpN.fromBufferAttribute(n, vi);
    if (tmpN.y < .35 || tmpP.y < 2) continue;
    const s = new THREE.Mesh(pizzaGeo, pizzaMats); s.scale.setScalar(rand(.9, 1.25));
    s.quaternion.setFromUnitVectors(new V3(0, 0, 1), tmpN); s.rotateZ(rand(0, TAU));
    s.position.copy(tmpP).addScaledVector(tmpN, .05); g.add(s); slices.push(s);
  }
  // stink
  const lines = [];
  for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(stinkLineGeo, stinkMat.clone()); const a = i / 4 * TAU; l.position.set(Math.cos(a) * 2.5, H * .9, Math.sin(a) * 2.5); g.add(l); lines.push({ l, ph: i * .8 }); }
  const flies = [];
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 })); g.add(f); flies.push({ f, ph: rand(0, TAU), r: rand(2, 4), h: H + rand(0, 2) }); }
  shadow(mound); slices.forEach(s => { s.castShadow = true; });
  return { g, mound, slices, holes, lines, flies, R, H };
}

// ---------------------------------------------------------------- level objects
const objects = [];
function placeCarRow(s, lanes = [-8, 0, 8], n = 5) {
  for (const x of lanes) for (let i = 0; i < n; i++) {
    const ss = s + i * 2.45;
    const c = makeCar(); const f = frame(ss);
    c.g.position.copy(f.p).addScaledVector(f.s, x); c.g.position.y = f.p.y + rampH(ss) + .04;
    c.g.rotation.y = f.yaw + Math.PI / 2 + (Math.random() < .5 ? Math.PI : 0) + rand(-.06, .06);
    scene.add(c.g);
    objects.push({ type: 'car', s: ss, x, o: c, r: 2.2, pos: c.g.position, done: false, crush: 0 });
  }
}
function placeDino(s, x0) {
  const d = makeDino(); const f = frame(s);
  d.g.position.copy(f.p).addScaledVector(f.s, x0);
  scene.add(d.g);
  objects.push({ type: 'dino', s, x: x0, x0, o: d, r: 3.2, pos: d.g.position, done: false, ph: rand(0, TAU), dir: 1, roar: 0 });
}
function placeCheese(s, x) {
  const c = makeCheese(); const f = frame(s);
  c.g.position.copy(f.p).addScaledVector(f.s, x); c.g.position.y -= .6; c.g.rotation.y = rand(0, TAU);
  scene.add(c.g);
  objects.push({ type: 'cheese', s, x, o: c, r: c.R + 1.8, pos: c.g.position, done: false });
}
const bolts = [], pads = [];
const boltGeo = new THREE.ExtrudeGeometry(boltShape(1.1), { depth: .3, bevelEnabled: true, bevelThickness: .08, bevelSize: .08, bevelSegments: 2 }).center();
const boltMat = new THREE.MeshStandardMaterial({ color: 0xffe040, emissive: 0xffc800, emissiveIntensity: 3.5, metalness: .6, roughness: .2 });
function placeBolts(s, x, n = 5) {
  for (let i = 0; i < n; i++) {
    const ss = s + i * 6, f = frame(ss), m = new THREE.Mesh(boltGeo, boltMat);
    m.position.copy(f.p).addScaledVector(f.s, x); m.position.y += rampH(ss) + 2.4; scene.add(m);
    bolts.push({ s: ss, x, m, y: m.position.y, got: false });
  }
}
const padTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = 'rgba(0,30,60,.0)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#fff'; g.lineWidth = 16; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(16, 60 + k * 64); g.lineTo(64, 18 + k * 64); g.lineTo(112, 60 + k * 64); g.stroke(); }
}, { repeat: true });
padTex.repeat.set(1, 2);
function placePad(s, x) {
  const f = frame(s);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(8, 10), new THREE.MeshBasicMaterial({ map: padTex, color: new THREE.Color(.6, 3, 4), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = f.yaw + Math.PI; m.position.copy(f.p).addScaledVector(f.s, x); m.position.y += .09;
  const base = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 10.6), new THREE.MeshStandardMaterial({ color: 0x0a2a4a, roughness: .4, metalness: .5 }));
  base.rotation.copy(m.rotation); base.position.copy(m.position); base.position.y -= .02; base.receiveShadow = true;
  scene.add(base, m); pads.push({ s, x, m });
}
function buildLevel() {
  // classic jumps: land on the cars
  for (const r of RAMPS) placeCarRow(r.s + r.up + 46);
  placeCarRow(120, [-6, 6]); placeCarRow(985, [-8, 0, 8], 4); placeCarRow(1420, [-5, 5], 4);
  placeDino(230, -6); placeDino(640, 5); placeDino(900, -4); placeDino(1080, 6); placeDino(1300, -5);
  placeCheese(470, 2); placeCheese(1130, -3); placeCheese(1470, 1);
  placeBolts(165, -7); placeBolts(560, 7); placeBolts(860, 0); placeBolts(1030, -6); placeBolts(1370, 6);
  placePad(270, 6); placePad(700, -6); placePad(1110, 0); placePad(1398, -5);
}
buildLevel();
objects.sort((a, b) => a.s - b.s);

function resetObjects() {
  for (const o of objects) {
    if (!o.done) continue;
    o.done = false;
    if (o.type === 'car') {
      const c = o.o; c.bodyM.scale.set(1, 1, 1); c.bodyM.position.y = .78; c.cab.material = MAT.glass;
      c.cab.scale.y = c.cab.userData.sy0; c.cab.position.y = 1.5; c.roof.position.y = c.roof.userData.y0;
      c.wheels.forEach(w => { w.rotation.z = 0; w.position.x = Math.sign(w.position.x) * .95; });
      c.g.rotation.z = 0; o.crush = 0;
    } else if (o.type === 'dino') {
      scene.remove(o.o.g); const d = makeDino(); o.o = d; d.g.position.copy(o.pos); o.pos = d.g.position; scene.add(d.g);
    } else if (o.type === 'cheese') {
      scene.remove(o.o.g); const c = makeCheese(); o.o = c; c.g.position.copy(o.pos); o.pos = c.g.position; scene.add(c.g);
    }
  }
  for (const b of bolts) { b.got = false; b.m.visible = true; }
}
for (const o of objects) if (o.type === 'car') { o.o.cab.userData.sy0 = o.o.cab.scale.y; o.o.roof.userData.y0 = o.o.roof.position.y; }

// ---------------------------------------------------------------- racers
function makeRacer(name, look, s, x, player) {
  const m = makeTruck(name, look); scene.add(m.root);
  return { name, look, m, s, x, xv: 0, y: groundAt(s), vy: 0, speed: 0, grounded: true, player, boost: 0, meter: player ? .35 : 0, air: 0, lane: x, pitch: 0, roll: 0, bounce: 0, bv: 0, spin: 0, done: false, place: 0, weave: rand(0, TAU), heading: 0, finishT: 0, padT: 0 };
}
const racers = [
  makeRacer('FLASH', LOOKS.flash, 0, 0, true),
  makeRacer('THUNDER', LOOKS.thunder, 22, -7, false),
  makeRacer('RUMBLE', LOOKS.rumble, 22, 7, false),
];
const me = racers[0];

// ---------------------------------------------------------------- audio
const AU = {
  ctx: null, master: null, music: true, sfxBus: null, musicBus: null, eng: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = .9;
    const comp = c.createDynamicsCompressor(); this.master.connect(comp); comp.connect(c.destination);
    this.sfxBus = c.createGain(); this.sfxBus.connect(this.master);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.music ? .32 : 0; this.musicBus.connect(this.master);
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = nb;
    // engine
    const o1 = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 400; f.Q.value = 3; g.gain.value = 0;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.sfxBus); o1.start(); o2.start();
    const ns = c.createBufferSource(); ns.buffer = nb; ns.loop = true; const nf = c.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 220; const ng = c.createGain(); ng.gain.value = 0;
    ns.connect(nf); nf.connect(ng); ng.connect(this.sfxBus); ns.start();
    this.eng = { o1, o2, f, g, ng };
    this.startMusic();
  },
  engine(speed, boost, on) {
    if (!this.eng) return; const t = this.ctx.currentTime, e = this.eng;
    const k = speed / 50;
    e.o1.frequency.setTargetAtTime(38 + k * 70 + boost * 30, t, .05); e.o2.frequency.setTargetAtTime(19 + k * 35 + boost * 15, t, .05);
    e.f.frequency.setTargetAtTime(260 + k * 900 + boost * 900, t, .05);
    e.g.gain.setTargetAtTime(on ? .05 + k * .05 : 0, t, .1); e.ng.gain.setTargetAtTime(on ? .05 + k * .08 : 0, t, .1);
  },
  noise(dur, f0, f1, vol, type = 'bandpass', q = 1, delay = 0) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxBus); s.start(t, rand(0, 1)); s.stop(t + dur + .05);
  },
  tone(f0, f1, dur, vol, type = 'sine', delay = 0, bus) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(bus || this.sfxBus); o.start(t); o.stop(t + dur + .05);
  },
  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'crunch': this.noise(.35, 2400, 300, .5, 'bandpass', .8); this.tone(110, 40, .3, .5, 'sine'); for (let i = 0; i < 5; i++) this.tone(rand(2500, 4800), rand(2000, 4000), .12, .06, 'triangle', .05 + i * .04); break;
      case 'boom': this.noise(1.1, 1200, 60, .7, 'lowpass', .7); this.tone(140, 28, .8, .6, 'sine'); this.tone(880, 220, .12, .08, 'square', .15); this.tone(660, 160, .12, .08, 'square', .28); this.tone(440, 110, .2, .08, 'square', .41); break;
      case 'squish': this.noise(.5, 300, 1400, .5, 'bandpass', 2); this.raspberry(); break;
      case 'bolt': this.tone(1320, 1320, .12, .12, 'triangle'); this.tone(1980, 1980, .16, .1, 'triangle', .06); break;
      case 'boost': this.noise(.9, 600, 5000, .35, 'bandpass', 1.2); this.tone(120, 600, .7, .14, 'sawtooth'); break;
      case 'pad': this.noise(.5, 900, 4000, .25, 'bandpass', 1.5); this.tone(440, 880, .35, .1, 'square'); break;
      case 'land': this.tone(90, 36, .3, .55, 'sine'); this.noise(.25, 500, 120, .3, 'lowpass'); break;
      case 'jump': this.tone(220, 520, .22, .12, 'square'); break;
      case 'scrape': this.noise(.2, 3000, 1500, .12, 'bandpass', 3); break;
      case 'beep': this.tone(660, 660, .22, .22, 'square'); break;
      case 'go': this.tone(990, 990, .6, .25, 'square'); this.tone(1320, 1320, .6, .12, 'square'); break;
      case 'star': [0, 4, 7, 12, 16].forEach((n, i) => this.tone(660 * 2 ** (n / 12), 660 * 2 ** (n / 12), .4, .14, 'triangle', i * .08)); break;
      case 'roar': this.tone(190, 70, .9, .22, 'sawtooth'); this.noise(.9, 700, 200, .2, 'bandpass', 2); break;
      case 'horn': this.tone(392, 392, .5, .18, 'sawtooth'); this.tone(494, 494, .5, .14, 'sawtooth'); break;
      case 'cheer': this.noise(2, 2500, 1200, .2, 'bandpass', .6); break;
    }
  },
  raspberry() {
    const c = this.ctx, t = c.currentTime + .08; const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(70, t + .7);
    lfo.frequency.value = 28; lg.gain.value = .25; lfo.connect(lg); lg.connect(g.gain);
    g.gain.setValueAtTime(.25, t); g.gain.linearRampToValueAtTime(0, t + .75);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    o.connect(f); f.connect(g); g.connect(this.sfxBus); o.start(t); lfo.start(t); o.stop(t + .8); lfo.stop(t + .8);
  },
  startMusic() {
    const c = this.ctx, bpm = 138, step = 60 / bpm / 4; let next = c.currentTime + .1, i = 0;
    const bass = [0, 0, 12, 0, 3, 0, 15, 0, 5, 5, 17, 5, 7, 7, 10, 12];
    const lead = [12, -1, 15, -1, 17, -1, 15, 19, -1, 17, 15, -1, 12, -1, 10, -1];
    const root = 41;
    const nf = n => 440 * 2 ** ((n - 69) / 12);
    setInterval(() => {
      if (!this.ctx) return;
      while (next < c.currentTime + .15) {
        const s = i % 16, bar = (i / 16 | 0) % 4, tr = [0, 0, 5, 7][bar];
        if (s % 2 === 0) this.tone(nf(root + bass[s] + tr), nf(root + bass[s] + tr), step * 1.8, .5, 'sawtooth', next - c.currentTime, this.musicBus);
        if (s % 4 === 0) { this.tone(150, 40, .18, .9, 'sine', next - c.currentTime, this.musicBus); }
        if (s % 8 === 4) this.noiseOn(this.musicBus, next, .15, 1800, .5);
        if (s % 2 === 1) this.noiseOn(this.musicBus, next, .04, 8000, .18);
        if ((i / 64 | 0) % 2 === 1 && lead[s] >= 0) this.tone(nf(root + 24 + lead[s] + tr), nf(root + 24 + lead[s] + tr), step * 1.6, .16, 'square', next - c.currentTime, this.musicBus);
        next += step; i++;
      }
    }, 30);
  },
  noiseOn(bus, t, dur, f, vol) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf; const fl = c.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = f;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(bus); s.start(t, rand(0, 1)); s.stop(t + dur + .02);
  },
  setMusic(on) { this.music = on; if (this.musicBus) this.musicBus.gain.value = on ? .32 : 0; },
};

// ---------------------------------------------------------------- input
const keys = {};
addEventListener('keydown', e => { keys[e.code] = true; AU.init(); if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); onPress(e.code); });
addEventListener('keyup', e => { keys[e.code] = false; });
const touchBtn = { left: 0, right: 0, jump: 0, boost: 0 };
document.querySelectorAll('[data-t]').forEach(b => {
  const k = b.dataset.t;
  const on = e => { e.preventDefault(); AU.init(); touchBtn[k] = 1; b.classList.add('on'); if (k === 'jump') pressed.jump = true; if (k === 'boost') pressed.boost = true; };
  const off = e => { e.preventDefault(); touchBtn[k] = 0; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
});
const pressed = { jump: false, boost: false };
let padPrev = {};
function readPad() {
  const out = { steer: 0, gas: 0, brake: 0, jump: false, boost: false, start: false, a: false, b: false };
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const p of pads) {
    if (!p || !p.connected) continue;
    const ax = p.axes[0] || 0; if (Math.abs(ax) > .15) out.steer += ax;
    const bt = i => p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > .5);
    if (bt(14)) out.steer -= 1; if (bt(15)) out.steer += 1;
    out.brake = Math.max(out.brake, p.buttons[6] ? p.buttons[6].value : 0);
    const now = { a: bt(0), b: bt(1), x: bt(2), y: bt(3), st: bt(9), rb: bt(5) };
    const prev = padPrev[p.index] || {};
    if (now.a && !prev.a) { out.jump = true; out.a = true; }
    if ((now.x && !prev.x) || (now.rb && !prev.rb) || (now.b && !prev.b)) out.boost = true;
    if (now.b && !prev.b) out.b = true;
    if (now.st && !prev.st) out.start = true;
    if (now.a || now.x) AU.init();
    padPrev[p.index] = now;
  }
  return out;
}
function onPress(code) {
  if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp' || code === 'KeyJ') pressed.jump = true;
  if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyB' || code === 'KeyK') pressed.boost = true;
  if (code === 'Escape' || code === 'KeyP') togglePause();
  if ((code === 'Enter' || code === 'Space') && state === 'title') startRace();
  if ((code === 'Enter') && state === 'results') startRace();
}

// ---------------------------------------------------------------- save
function loadStars() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return (s && s.stars && Array.isArray(s.stars.monster)) ? s.stars.monster.slice(0, 3) : [false, false, false]; } catch { return [false, false, false]; }
}
function saveStar(i) {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') || {};
    s.stars = s.stars || {}; if (!Array.isArray(s.stars.monster)) s.stars.monster = [false, false, false];
    s.stars.monster[i] = true; localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch { }
}
let stars = loadStars();
function playerName() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return s && s.name ? s.name : 'River'; } catch { return 'River'; } }

// ---------------------------------------------------------------- game state
let state = 'title', countdown = 0, raceT = 0, shake = 0, camMode = 0, paused = false;
const counts = [0, 0, 0];
const MISSIONS = ['Smash 30 cars', 'Smash 5 Dino Robots', 'Crush 3 stinky cheese mountains'];
function updateHud() {
  const L = Math.min(LAPS, Math.floor(Math.max(0, me.s) / TL) + 1);
  $('lap').textContent = `LAP ${L}/${LAPS}`;
  const order = [...racers].sort((a, b) => (b.done ? 1e9 - b.place : b.s) - (a.done ? 1e9 - a.place : a.s));
  const place = me.done ? me.place : order.indexOf(me) + 1;
  $('place').textContent = ['1st', '2nd', '3rd'][place - 1];
  $('place').dataset.p = place;
  for (let i = 0; i < 3; i++) {
    $('c' + i).textContent = `${Math.min(counts[i], GOALS[i])}/${GOALS[i]}`;
    $('m' + i).classList.toggle('got', stars[i]);
  }
  $('meter').style.setProperty('--v', me.meter.toFixed(3));
  $('meterBox').classList.toggle('ready', me.meter >= 1);
  $('speed').textContent = Math.round(me.speed * 2.2);
}
function bigText(t, sub = '', dur = 1.4) {
  const el = $('big'); el.innerHTML = `<b>${t}</b>${sub ? `<small>${sub}</small>` : ''}`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(bigText.t); bigText.t = setTimeout(() => el.classList.remove('show'), dur * 1000);
}
function count(i) {
  counts[i]++;
  if (counts[i] >= GOALS[i] && !stars[i]) {
    stars[i] = true; saveStar(i); AU.sfx('star');
    bigText('★ STAR! ★', MISSIONS[i] + '!', 2.4);
    for (let k = 0; k < 40; k++) { const p = me.m.root.position; FX.emit(p.x, p.y + 4, p.z, rand(-14, 14), rand(6, 18), rand(-14, 14), rand(.8, 1.6), rand(.3, .6), 4, 3.4, .6, 1, { g: 14, drag: 1.2 }); }
  }
}
function startRace() {
  if (state === 'countdown' || state === 'race') return;
  AU.init();
  resetObjects();
  racers.forEach((r, i) => { r.s = i === 0 ? 0 : 12; r.x = [0, -7, 7][i]; r.speed = 0; r.y = groundAt(r.s); r.vy = 0; r.grounded = true; r.done = false; r.place = 0; r.boost = 0; r.xv = 0; r.finishT = 0; });
  me.meter = .35; counts[0] = counts[1] = counts[2] = 0; lastLap = 0;
  $('title').classList.remove('show'); $('results').classList.remove('show'); $('hud').classList.add('show');
  state = 'countdown'; countdown = 3.99; raceT = 0; lastBeep = 4;
  document.body.classList.add('playing');
}
let lastBeep = 4, lastLap = 0;
function finish() {
  state = 'results';
  AU.sfx('cheer'); AU.sfx('horn');
  const place = me.place;
  const msg = ['YOU WON!', 'SECOND PLACE!', 'THIRD PLACE!'][place - 1];
  const nm = playerName();
  $('resultsBox').innerHTML = `<h2>${msg}</h2><p class="sub">${['Champion driving', 'Awesome driving', 'Wild driving'][place - 1]}, ${esc(nm)}! Flash is the smashiest truck on the planet.</p>
    <ul>${MISSIONS.map((m, i) => `<li class="${stars[i] ? 'got' : ''}"><span>${stars[i] ? '★' : '☆'}</span>${m} <em>${Math.min(counts[i], 999)} smashed</em></li>`).join('')}</ul>
    <div class="btns"><button class="btn go" id="again">Race again</button><a class="btn" href="${HUB}">Back to the Playground</a></div>
    <p class="tip">${TOUCH ? 'Tap a button' : 'Press A or Enter to race again'}</p>`;
  $('again').onclick = () => startRace();
  setTimeout(() => $('results').classList.add('show'), 1400);
  for (let i = 0; i < 6; i++) setTimeout(() => firework(), 300 + i * 450);
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
function firework() {
  const p = me.m.root.position, a = rand(0, TAU), c = [[4, .8, .8], [.8, 3, 4], [4, 3.4, .6], [3, .8, 4], [.8, 4, 1.4]][(Math.random() * 5) | 0];
  const x = p.x + Math.cos(a) * 30, y = p.y + rand(25, 40), z = p.z + Math.sin(a) * 30;
  for (let i = 0; i < 70; i++) { const v = new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(12, 18)); FX.emit(x, y, z, v.x, v.y, v.z, rand(1, 1.6), rand(.4, .7), c[0], c[1], c[2], 1, { g: 8, drag: 1.1 }); }
  AU.noise(.6, 1500, 200, .35, 'lowpass');
}
function togglePause(force) {
  if (state !== 'race' && state !== 'countdown') return;
  paused = force ?? !paused; $('pause').classList.toggle('show', paused);
}
$('tPause').onclick = () => { AU.init(); togglePause(); };
$('resume').onclick = () => togglePause(false);
$('restart').onclick = () => { togglePause(false); state = 'title'; startRace(); };
$('musicBtn').onclick = () => { AU.setMusic(!AU.music); $('musicBtn').textContent = 'Music: ' + (AU.music ? 'On' : 'Off'); };
$('startBtn').onclick = () => startRace();
$('camBtn').onclick = () => { camMode = (camMode + 1) % 2; };
$('title').addEventListener('pointerdown', e => { if (e.target.closest('a,button')) return; AU.init(); });

function drawTitleMissions() {
  $('missions').innerHTML = MISSIONS.map((m, i) => `<li class="${stars[i] ? 'got' : ''}"><span>${stars[i] ? '★' : '☆'}</span>${m}</li>`).join('');
}
drawTitleMissions();

// ---------------------------------------------------------------- smashing
const tmpV = new V3();
function smash(o, r) {
  o.done = true;
  const p = o.pos, isMe = r.player;
  if (o.type === 'car') {
    o.crush = .001;
    o.o.cab.material = MAT.crackGlass;
    for (let i = 0; i < 26; i++) FX.emit(p.x + rand(-1, 1), p.y + 1.6, p.z + rand(-1, 1), rand(-8, 8), rand(3, 12), rand(-8, 8), rand(.5, 1), rand(.12, .25), 1.4, 2.4, 3.2, 1, { g: 26, drag: .8 });
    sparks(tmpV.copy(p).setY(p.y + 1), 18);
    dust(p, 8, 1.3);
    if (isMe) { AU.sfx('crunch'); popWord(pick(['CRUNCH!', 'SMASH!', 'CRASH!', 'KA-RUNCH!', 'FLATTENED!']), p, pick(['#ffd21e', '#ff8a1e', '#6ff3ff'])); count(0); r.meter = Math.min(1, r.meter + .05); shake = Math.max(shake, .35); }
    if (r.grounded && r.bounce > -.05) { r.bv += 1.6; }
  } else if (o.type === 'dino') {
    const d = o.o, base = groundAt(o.s) - .2;
    const away = new V3().subVectors(p, r.m.root.position).setY(0).normalize();
    for (const part of [...d.parts]) toDebris(part, new V3(away.x * rand(6, 16) + rand(-6, 6), rand(8, 20), away.z * rand(6, 16) + rand(-6, 6)), base);
    scene.remove(d.g);
    fireball(tmpV.copy(p).setY(p.y + 4), 26, 1); sparks(tmpV, 50, [3, 1.8, .5], 20);
    boomLight.position.copy(p).setY(p.y + 5); boomLight.intensity = 140;
    if (isMe) { AU.sfx('boom'); popWord(pick(['KA-BOOM!', 'ROBO-SMASH!', 'BOLTS AWAY!', 'DINO-MITE!']), p, '#ff6a3a', 1.2); count(1); r.meter = Math.min(1, r.meter + .2); shake = .8; }
  } else if (o.type === 'cheese') {
    const c = o.o, base = groundAt(o.s) - .2;
    c.g.updateWorldMatrix(true, true);
    for (const s of [...c.slices]) toDebris(s, new V3(rand(-12, 12), rand(12, 24), rand(-12, 12)), base);
    for (let i = 0; i < (TOUCH ? 16 : 26); i++) {
      const ch = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(.35, .85), 0), cheeseChunkMat);
      ch.position.set(p.x + rand(-4, 4), p.y + rand(1, 6), p.z + rand(-4, 4)); scene.add(ch); ch.castShadow = true;
      debris.push({ m: ch, v: new V3(rand(-14, 14), rand(10, 26), rand(-14, 14)), a: new V3(rand(-6, 6), rand(-6, 6), rand(-6, 6)), life: rand(4, 6), floor: base, r: .5 });
    }
    scene.remove(c.g);
    for (let i = 0; i < 50; i++) SMOKE.emit(p.x + rand(-5, 5), p.y + rand(1, 7), p.z + rand(-5, 5), rand(-6, 6), rand(2, 8), rand(-6, 6), rand(1.8, 3.2), rand(3, 6), .45, 1, .25, .55, { grow: 1.8, drag: 1.4, g: -1.5 });
    for (let i = 0; i < 30; i++) FX.emit(p.x + rand(-3, 3), p.y + rand(1, 5), p.z + rand(-3, 3), rand(-10, 10), rand(4, 16), rand(-10, 10), rand(.6, 1.2), rand(.4, .8), 3, 2.4, .3, .8, { g: 20, drag: 1 });
    if (isMe) {
      AU.sfx('squish'); popWord(pick(['PEE-YEW!', 'STINKY!', 'CHEESE-SPLOSION!', 'P.U.!']), p, '#a6ff4a', 1.25); count(2); r.meter = Math.min(1, r.meter + .25); shake = .6;
      splat();
    }
  }
}
const cheeseChunkMat = new THREE.MeshPhysicalMaterial({ color: 0xffc21e, roughness: .5, clearcoat: .3, flatShading: true });
function splat() {
  const el = $('splat'); el.innerHTML = '';
  for (let i = 0; i < 9; i++) { const b = document.createElement('i'); b.style.cssText = `left:${rand(0, 90)}%;top:${rand(0, 80)}%;width:${rand(60, 180)}px;height:${rand(50, 150)}px;transform:rotate(${rand(0, 360)}deg)`; el.appendChild(b); }
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

// ---------------------------------------------------------------- simulation
const G = 34, BASE_SPEED = 44, BOOST_SPEED = 66;
function updateRacer(r, dt, input) {
  const racing = state === 'race' && !r.done;
  let target = 0;
  if (racing) {
    if (r.player) {
      target = input.brake ? BASE_SPEED * .35 : BASE_SPEED;
      if (input.boost && r.meter >= .999 && r.boost <= 0) { r.boost = 2.6; r.meter = 0; AU.sfx('boost'); bigText('⚡ LIGHTNING BOOST! ⚡', '', 1.2); }
      if (input.jump && r.grounded) { r.vy = 13; r.grounded = false; AU.sfx('jump'); }
    } else {
      const gap = me.s - r.s; // rubber band: stay close and fun
      target = BASE_SPEED * (gap > 25 ? 1.12 : gap < -25 ? .82 : gap < -8 ? .92 : 1.0);
      if (r.s > TL * LAPS - 450 && gap > -60) target = Math.min(target, BASE_SPEED * .8); // let the driver win at the end
      if (me.done) target = BASE_SPEED * .95;
    }
  } else if (r.done) target = 18;
  if (r.boost > 0) { r.boost -= dt; target = BOOST_SPEED; }
  if (r.padT > 0) { r.padT -= dt; target = Math.max(target, BOOST_SPEED * .95); }
  const acc = (r.boost > 0 || r.padT > 0) ? 70 : target > r.speed ? (r.grounded ? 20 : 6) : 26;
  r.speed = damp(r.speed, target, acc / 20, dt);
  // steering
  let steer = 0;
  if (racing && r.player) steer = clamp(input.steer, -1, 1);
  else if (racing || r.done) { r.weave += dt * .5; const want = r.lane + Math.sin(r.weave) * 5; steer = clamp((want - r.x) * .4, -1, 1); }
  const steerRate = (r.grounded ? 22 : 12) * clamp(r.speed / 20, .35, 1);
  r.xv = damp(r.xv, steer * steerRate, 8, dt);
  r.x += r.xv * dt;
  if (Math.abs(r.x) > LIM) {
    r.x = Math.sign(r.x) * LIM; r.xv *= -.3;
    if (r.player && r.speed > 10 && Math.random() < .5) { const p = r.m.root.position; sparks(tmpV.set(p.x, p.y + 1.5, p.z).addScaledVector(frame(r.s).s, Math.sign(r.x) * 3), 3); if (Math.random() < .2) AU.sfx('scrape'); }
  }
  const prevS = r.s;
  r.s += r.speed * dt;
  // vertical
  const gNow = groundAt(r.s), gBack = groundAt(r.s - .8), slope = (gNow - gBack) / .8;
  if (r.grounded) {
    const want = slope * r.speed;
    if (gNow < r.y - .35 || (want - r.vy) / dt < -G * 1.15) r.grounded = false;
    else { r.vy = want; r.y = gNow; }
  }
  if (!r.grounded) {
    r.vy -= G * dt; r.y += r.vy * dt; r.air += dt;
    if (r.y <= gNow) {
      const impact = -r.vy;
      r.y = gNow; r.grounded = true;
      if (impact > 6) {
        r.bv -= impact * .07;
        r.m.wheels.forEach(w => { w.vel -= impact * .12; });
        if (r.player) {
          AU.sfx('land'); shake = Math.max(shake, Math.min(.9, impact * .03));
          if (r.air > 1.05) popWord(pick(['BIG AIR!', 'MEGA AIR!', 'SKY HIGH!']), r.m.root.position, '#6ff3ff', 1.1);
        }
        const p = r.m.root.position; dust(p, 18, 1.6);
      }
      r.vy = slope * r.speed; r.air = 0;
    }
  } else r.air = 0;
  // laps
  if (r.player && racing) {
    const lap = Math.floor(r.s / TL);
    if (lap > lastLap && lap < LAPS) { lastLap = lap; resetObjects(); bigText(lap === LAPS - 1 ? 'FINAL LAP!' : `LAP ${lap + 1}`, '', 1.4); AU.sfx('horn'); }
  }
  if (racing && r.s >= TL * LAPS) {
    r.done = true; r.place = racers.filter(x => x.done).length;
    if (r.player) { bigText(['1st PLACE!', '2nd PLACE!', '3rd PLACE!'][r.place - 1], 'Flash crossed the finish line!', 2.2); finish(); }
  }
  // pads and bolts
  const ws = wrapS(r.s);
  for (const p of pads) { const d = ws - p.s; if (d > -5 && d < 5 && Math.abs(r.x - p.x) < 5 && r.y - groundAt(r.s) < 1.5 && r.padT <= 0) { r.padT = 1.3; if (r.player) { AU.sfx('pad'); } } }
  if (r.player) for (const b of bolts) { if (b.got) continue; const d = ws - b.s; if (d > -2.5 && d < 2.5 && Math.abs(r.x - b.x) < 3.2 && Math.abs(r.y + 2.5 - b.y) < 4) { b.got = true; b.m.visible = false; r.meter = Math.min(1, r.meter + .1); AU.sfx('bolt'); sparks(b.m.position, 14, [4, 3.6, .8], 8); if (r.meter >= 1) bigText('BOOST READY!', TOUCH ? 'Tap ⚡ BOOST' : 'Press X or Shift', 1.4); } }
  // smash things
  const f = frame(r.s), P = tmpPos.copy(f.p).addScaledVector(f.s, r.x);
  for (const o of objects) {
    if (o.done) continue;
    let d = wrapS(o.s) - ws; if (d > TL / 2) d -= TL; if (d < -TL / 2) d += TL;
    if (Math.abs(d) > 12) continue;
    const height = r.y - groundAt(o.s);
    if (o.type === 'car') { if (Math.abs(d) < 3.3 && Math.abs(o.x - r.x) < 3.9 && height < 2.2) smash(o, r); continue; }
    const dx = o.pos.x - P.x, dz = o.pos.z - P.z;
    const top = o.type === 'dino' ? 7 : 9;
    if (dx * dx + dz * dz < (o.r + 2.4) ** 2 && height < top) smash(o, r);
  }
  // other trucks: gentle shove
  for (const q of racers) { if (q === r) continue; const ds = q.s - r.s, dx = q.x - r.x; if (Math.abs(ds) < 6.5 && Math.abs(dx) < 4.6) { const push = (4.6 - Math.abs(dx)) * Math.sign(dx || 1); r.x -= push * .5 * dt * 8; } }
  void prevS;
  // pose the model
  const m = r.m;
  m.root.position.set(P.x, r.y, P.z);
  const fwd = tmpFwd.copy(f.t).multiplyScalar(Math.max(4, r.speed)).addScaledVector(f.s, r.xv);
  const heading = Math.atan2(fwd.x, fwd.z);
  r.heading = heading;
  m.root.rotation.y = heading;
  const gF = groundAt(r.s + m.WB), gR = groundAt(r.s - m.WB);
  const wantPitch = r.grounded ? -Math.atan2(gF - gR, m.WB * 2) : clamp(-r.vy * .018, -.45, .5) + (r.player && !r.grounded ? 0 : 0);
  r.pitch = damp(r.pitch, wantPitch, r.grounded ? 12 : 3, dt);
  r.roll = damp(r.roll, -r.xv * .016, 6, dt);
  // body bounce spring
  r.bv += (-r.bounce * 120 - r.bv * 9) * dt; r.bounce += r.bv * dt;
  m.tilt.rotation.set(r.pitch, 0, r.roll);
  m.body.position.y = r.bounce + Math.sin(raceT * 30 + r.weave) * .02 * (r.speed / 40);
  m.body.rotation.z = r.roll * .6;
  // wheels: suspension and spin
  r.spin += r.speed / 1.7 * dt;
  for (const w of m.wheels) {
    const gw = groundAt(r.s + (w.z > 0 ? m.WB : -m.WB));
    const target = r.grounded ? clamp(gw - r.y + Math.sin(r.spin * .7 + w.x + w.z) * .04, -.6, .9) : -.55;
    w.vel += ((target - w.off) * 160 - w.vel * 14) * dt; w.off += w.vel * dt; w.off = clamp(w.off, -.8, 1);
    w.mount.position.y = m.WHY + w.off;
    w.mount.rotation.y = w.z > 0 ? clamp(r.xv * .03, -.35, .35) : 0;
    w.spin.rotation.x = r.spin;
    // shock points from frame to wheel hub
    const hub = tmpHub.set(w.x * .92, m.WHY + w.off, w.z);
    w.shock.scale.z = w.shock.position.distanceTo(hub);
    w.shock.lookAt(m.tilt.localToWorld(hub));
  }
  // effects
  const p = m.root.position;
  if (r.grounded && r.speed > 12 && Math.random() < (TOUCH ? .5 : .9)) {
    const side = f.s, back = f.t;
    for (const sx of [-2.4, 2.4]) SMOKE.emit(p.x + side.x * sx - back.x * 2.6, p.y + .4, p.z + side.z * sx - back.z * 2.6, -back.x * 4 + rand(-2, 2), rand(1, 3), -back.z * 4 + rand(-2, 2), rand(.6, 1.1), rand(1, 1.8), .82, .5, .36, .32, { grow: 2.4, drag: 2.2 });
  }
  const boosting = r.boost > 0 || r.padT > 0;
  m.root.updateMatrixWorld();
  for (const fl of m.flames) {
    const wp = tmpHub.copy(fl); m.body.localToWorld(wp);
    if (boosting) {
      for (let k = 0; k < 3; k++) FX.emit(wp.x, wp.y, wp.z, rand(-1, 1) - f.t.x * 6, rand(5, 10), rand(-1, 1) - f.t.z * 6, rand(.15, .3), rand(.6, 1.1), r.look === LOOKS.flash ? 1.2 : 1.4, r.look === LOOKS.flash ? 2.4 : 1.4, 4, 1, { grow: -.5, drag: 2 });
    } else if (Math.random() < .35) SMOKE.emit(wp.x, wp.y, wp.z, rand(-.5, .5), rand(2, 4), rand(-.5, .5), rand(.5, 1), rand(.5, .9), .2, .2, .22, .4, { grow: 2, drag: 1 });
  }
  if (r.boost > 0) { // lightning crackle around the truck
    for (let k = 0; k < 3; k++) { const a = rand(0, TAU); FX.emit(p.x + Math.cos(a) * 3, p.y + rand(1, 5), p.z + Math.sin(a) * 3, -f.t.x * 30, rand(-2, 2), -f.t.z * 30, rand(.1, .25), rand(.2, .45), 1.6, 2.8, 4.5, 1, { drag: 3 }); }
  }
}
const tmpPos = new V3(), tmpFwd = new V3(), tmpHub = new V3();

function animateObjects(dt, t) {
  for (const o of objects) {
    if (o.type === 'car' && o.done && o.crush < 1) {
      o.crush = Math.min(1, o.crush + dt * 7); const k = 1 - (1 - o.crush) ** 3, c = o.o;
      c.bodyM.scale.y = lerp(1, .42, k); c.bodyM.position.y = lerp(.78, .36, k);
      c.cab.scale.y = lerp(c.cab.userData.sy0, .18, k); c.cab.position.y = lerp(1.5, .72, k); c.roof.position.y = lerp(c.roof.userData.y0, .84, k);
      c.wheels.forEach(w => { w.rotation.z = Math.sign(w.position.x) * .7 * k; w.position.x = Math.sign(w.position.x) * lerp(.95, 1.15, k); });
      c.g.rotation.z = Math.sin(o.s) * .06 * k;
    }
    if (o.done) continue;
    const dCam = o.pos.distanceToSquared(camera.position);
    if (dCam > 260 * 260) continue;
    if (o.type === 'dino') {
      const d = o.o; o.ph += dt * 2.2;
      let rel = wrapS(o.s) - wrapS(me.s); if (rel < -TL / 2) rel += TL;
      const charge = state === 'race' && rel > 0 && rel < 75;
      const want = charge ? clamp(me.x, -9, 9) : clamp(o.x0 + Math.sin(o.ph * .45) * 6, -9, 9);
      const nx = damp(o.x, want, charge ? 1.6 : 1, dt);
      const vx = nx - o.x; o.x = nx; if (charge) o.ph += dt * 1.5;
      const f = frame(o.s, _g); const yaw = f.yaw + (vx > 0 ? Math.PI / 2 : -Math.PI / 2);
      d.g.position.copy(f.p).addScaledVector(f.s, o.x);
      { const cur = d.g.rotation.y, df = Math.atan2(Math.sin(yaw - cur), Math.cos(yaw - cur)); d.g.rotation.y = cur + df * (1 - Math.exp(-5 * dt)); }
      d.legs[0].rotation.x = Math.sin(o.ph * 3) * .5; d.legs[1].rotation.x = -Math.sin(o.ph * 3) * .5;
      d.hips.position.y = 4.2 + Math.abs(Math.cos(o.ph * 3)) * .25;
      d.jaw.rotation.x = .15 + Math.max(0, Math.sin(o.ph * 1.3)) * .45;
      d.head.rotation.x = Math.sin(o.ph * 1.3) * -.12;
      d.segs.forEach((s, i) => { s.rotation.y = Math.sin(o.ph * 2 - i * .6) * .16; });
      const near = Math.abs(wrapS(o.s) - wrapS(me.s));
      if (near < 70 && near > 40 && t - o.roar > 6 && state === 'race') { o.roar = t; AU.sfx('roar'); }
    } else if (o.type === 'cheese') {
      const c = o.o;
      c.lines.forEach(l => { const k = ((t * .5 + l.ph) % 1); l.l.position.y = c.H * .8 + k * 4; l.l.material.opacity = Math.sin(k * Math.PI) * .7; l.l.rotation.y = t + l.ph; });
      c.flies.forEach(f => { f.f.position.set(Math.cos(t * 4 + f.ph) * f.r, f.h + Math.sin(t * 9 + f.ph) * .5, Math.sin(t * 5 + f.ph) * f.r); });
      if (Math.random() < .15) SMOKE.emit(o.pos.x + rand(-3, 3), o.pos.y + c.H * rand(.6, 1), o.pos.z + rand(-3, 3), rand(-.5, .5), rand(1, 2), rand(-.5, .5), rand(2, 3), rand(2, 3.5), .5, 1, .3, .3, { grow: 1, drag: .5 });
    }
  }
  for (const b of bolts) if (!b.got) { b.m.rotation.y = t * 3 + b.s; b.m.position.y = b.y + Math.sin(t * 3 + b.s) * .3; }
  padTex.offset.y = -t * 1.6;
}

// ---------------------------------------------------------------- camera
const camPos = new V3(0, 10, 20), camLook = new V3();
let camFov = 62;
function updateCamera(dt, t) {
  const p = me.m.root.position, f = frame(me.s), portrait = innerHeight > innerWidth;
  if (state === 'title') {
    const a = t * .25;
    const tgt = new V3(p.x + Math.sin(a) * 13, p.y + 3.2 + Math.sin(t * .4) * 1, p.z + Math.cos(a) * 13);
    camPos.lerp(tgt, 1 - Math.exp(-3 * dt)); camLook.set(p.x, p.y + 2.6, p.z);
    camFov = damp(camFov, portrait ? 74 : 50, 3, dt);
  } else if (state === 'countdown') {
    const k = 1 - clamp(countdown / 4, 0, 1);
    const ang = me.heading + Math.PI * (1 - k);
    const tgt = new V3(p.x + Math.sin(ang) * lerp(14, 16, k), p.y + lerp(4, 7, k), p.z + Math.cos(ang) * lerp(14, 16, k));
    camPos.lerp(tgt, 1 - Math.exp(-4 * dt)); camLook.set(p.x, p.y + 2.5, p.z);
    camFov = damp(camFov, portrait ? 80 : 62, 3, dt);
  } else {
    const back = portrait ? 22 : (camMode ? 11 : 15.5), up = portrait ? 10 : (camMode ? 4.6 : 6.6);
    const dir = tmpFwd.set(Math.sin(me.heading), 0, Math.cos(me.heading)).lerp(f.t, .5).normalize();
    const tgt = new V3(p.x - dir.x * back, Math.max(p.y, groundAt(me.s - 10)) + up + (me.grounded ? 0 : Math.min(4, me.air * 2)), p.z - dir.z * back);
    camPos.lerp(tgt, 1 - Math.exp(-(me.done ? 2 : 7) * dt));
    camLook.lerp(tmpHub.set(p.x + dir.x * 8, p.y + 2.8, p.z + dir.z * 8), 1 - Math.exp(-12 * dt));
    const boosting = me.boost > 0 || me.padT > 0;
    camFov = damp(camFov, (portrait ? 78 : 62) + me.speed * .12 + (boosting ? 14 : 0), 4, dt);
  }
  camera.position.copy(camPos);
  if (window.__cam) { camera.position.set(...window.__cam[0]); camLook.set(...window.__cam[1]); }
  if (shake > 0) { shake = Math.max(0, shake - dt * 1.6); const s = shake * shake * 1.4; camera.position.x += rand(-s, s); camera.position.y += rand(-s, s); camera.position.z += rand(-s, s); }
  camera.lookAt(camLook);
  skyMesh.position.copy(camera.position);
  if (Math.abs(camera.fov - camFov) > .01) { camera.fov = camFov; camera.updateProjectionMatrix(); setParticleScale(); }
  // shadows follow the action
  sun.position.copy(p).addScaledVector(SUN_DIR, 160).add(new V3(0, 90, 0));
  sun.target.position.copy(p);
}

// ---------------------------------------------------------------- loop
let last = performance.now(), T = 0, fpsAcc = 0, fpsN = 0, lowT = 0;
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  composer.setSize(innerWidth, innerHeight);
  bloom.resolution.set(innerWidth / 2, innerHeight / 2);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); setParticleScale();
}
addEventListener('resize', resize); resize();
document.addEventListener('visibilitychange', () => { if (document.hidden) togglePause(true); });

function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(.05, (now - last) / 1000); last = now;
  if (simHold) { composer.render(); return; }
  // adaptive quality
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 2) { const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; if (fps < 40 && quality > 1) { quality = Math.max(1, quality - .25); renderer.setPixelRatio(Math.min(devicePixelRatio, quality)); resize(); lowT++; } if (lowT > 3 && bloom.enabled && fps < 30) bloom.enabled = false; }
  const pad = readPad();
  if (pad.start) { if (state === 'title' || state === 'results') startRace(); else togglePause(); }
  if (pad.a && (state === 'title' || (state === 'results' && $('results').classList.contains('show')))) { startRace(); pad.jump = false; }
  if (pad.b && paused) togglePause(false);
  if (paused) { composer.render(); return; }
  tick(dt, pad);
  composer.render();
}
let simHold = false;
function tick(dt, pad) {
  T += dt; raceT += dt;
  const steerKeys = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0) + touchBtn.right - touchBtn.left;
  const input = {
    steer: clamp(steerKeys + (pad.steer || 0), -1, 1),
    brake: keys.ArrowDown || keys.KeyS || pad.brake > .4,
    jump: pressed.jump || pad.jump, boost: pressed.boost || pad.boost,
  };
  pressed.jump = pressed.boost = false;
  if (state === 'countdown') {
    countdown -= dt;
    const n = Math.ceil(countdown);
    if (n < lastBeep && n >= 1) { lastBeep = n; AU.sfx('beep'); bigText(String(n), '', .8); }
    if (countdown <= 0) { state = 'race'; AU.sfx('go'); bigText('GO!', 'Smash everything!', 1.1); }
  }
  for (const r of racers) updateRacer(r, dt, input);
  AU.engine(me.speed, me.boost > 0 || me.padT > 0 ? 1 : 0, state !== 'title');
  if (state === 'results' && Math.random() < dt * 1.2) firework();
  animateObjects(dt, T);
  updateDebris(dt);
  updatePopups(dt);
  FX.update(dt); SMOKE.update(dt);
  boomLight.intensity *= Math.exp(-dt * 6);
  skyMat.uniforms.t.value = T;
  // flags
  for (const fl of flags) {
    const a = fl.g.attributes.position;
    for (let i = 0; i < a.count; i++) { const x = fl.base[i * 3]; a.setZ(i, Math.sin(x * 1.3 - T * 6 + fl.ph) * x * .12); }
    a.needsUpdate = true;
  }
  // cheering crowd
  if (crowd.mesh && crowd.length && camera.position.distanceTo(crowd[0].p) < 400) {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new V3(1, 1, 1), pp = new V3();
    const excited = state === 'results' || (state === 'race' && Math.abs(wrapS(me.s) - 50) < 80);
    for (const c of crowd) { pp.copy(c.p); pp.y += Math.max(0, Math.sin(T * c.sp + c.ph)) * (excited ? .7 : .2); m.compose(pp, q, s); crowd.mesh.setMatrixAt(c.i, m); }
    crowd.mesh.instanceMatrix.needsUpdate = true;
  }
  if (Math.random() < .5) { const v = scene.userData.volcano; SMOKE.emit(v.x + rand(-20, 20), v.y, v.z + rand(-20, 20), rand(-2, 2), rand(14, 20), rand(-2, 2), 9, rand(40, 70), .3, .18, .25, .45, { grow: 1.5, drag: .2 }); }
  updateCamera(dt, T);
  if (state !== 'title') updateHud();
}
requestAnimationFrame(loop);
if (/debug/.test(location.search)) window.__flash = {
  hold(v) { simHold = v; },
  sim(sec, steer = 0) { const pad = { steer, brake: 0, jump: false, boost: false }; for (let t = 0; t < sec; t += 1 / 30) tick(1 / 30, pad); composer.render(); },
  go(s, x = 0) { racers.forEach((r, i) => { r.s = s + i * 9; if (i) r.x = i === 1 ? -7 : 7; r.y = groundAt(r.s); }); me.x = x; },
  look(s, x, y, back, side, up) { const f = frame(s), c = f.p.clone().addScaledVector(f.s, x); c.y += y; const e = c.clone().addScaledVector(f.t, -back).addScaledVector(f.s, side); e.y += up; window.__cam = [[e.x, e.y, e.z], [c.x, c.y, c.z]]; },
  get me() { return me; }, get state() { return state; }, counts, TL, scene, bloom, objects,
};
document.body.classList.toggle('touch', TOUCH);
$('loading').remove();
