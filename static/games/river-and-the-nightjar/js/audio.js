// All the sound is made here as the game runs. The score is original: bells, strings, piano,
// soft brass and a small choir, written note by note below. There are no audio files.
const MUSIC = .4;   // how loud the score sits under the story
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
// Note names to MIDI numbers, e.g. n('F#5').
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const n = s => { const m = /^([A-G])([#b]?)(-?\d)$/.exec(s); return SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12; };
const chord = (...names) => names.map(n);

// ----- the score -----
// Each mood has a tempo, a loop of bars (one chord each) and a few parts. Melodies are [beat, note, beats] in a phrase.
const THEME_A = [[0, 'F#5', 1], [1, 'A4', 1], [2, 'D5', 2], [4, 'E5', 1], [5, 'B4', 1], [6, 'C#5', 2], [8, 'D5', 1], [9, 'F#5', 1], [10, 'A5', 2], [12, 'G5', 1], [13, 'E5', 1], [14, 'F#5', 2]];
const THEME_B = [[0, 'F#5', 1], [1, 'A4', 1], [2, 'D5', 2], [4, 'E5', 1], [5, 'B4', 1], [6, 'G5', 2], [8, 'F#5', 1], [9, 'E5', 1], [10, 'D5', 1], [11, 'C#5', 1], [12, 'D5', 4]];
const shift = (ph, by) => ph.map(([b, nn, d]) => [b + by, nn, d]);
const THEME = [...THEME_A, ...shift(THEME_B, 16)];
const THEME_CHORDS = [chord('D3', 'A3', 'D4', 'F#4'), chord('A2', 'E3', 'A3', 'C#4'), chord('B2', 'F#3', 'B3', 'D4'), chord('G2', 'D3', 'G3', 'B3'), chord('D3', 'A3', 'D4', 'F#4'), chord('E3', 'G3', 'B3', 'E4'), chord('A2', 'E3', 'G3', 'C#4'), chord('D3', 'A3', 'D4', 'F#4')];

const MOODS = {
  title: { bpm: 84, bars: THEME_CHORDS, pad: .5, arp: { inst: 'bell', pat: [0, 2, 1, 3, 2, 1, 3, 2], vel: .22, oct: 12 }, mel: { inst: 'piano', notes: THEME, vel: .5, every: 2 }, bass: .3 },
  mystery: {
    bpm: 62, bars: [chord('D3', 'A3', 'D4', 'F4'), chord('Bb2', 'F3', 'Bb3', 'D4'), chord('G2', 'D3', 'G3', 'Bb3'), chord('A2', 'E3', 'A3', 'C#4')], pad: .55,
    arp: { inst: 'piano', pat: [0, -1, 2, -1, 3, -1, 1, -1], vel: .3, oct: 12 }, mel: { inst: 'bell', notes: [[2, 'A5', 2], [6, 'F5', 2], [9, 'D5', 1], [10, 'E5', 3], [14, 'A4', 2]], vel: .3, every: 2 }, bass: .3,
  },
  wonder: { bpm: 96, bars: THEME_CHORDS, pad: .5, arp: { inst: 'bell', pat: [0, 1, 2, 3, 2, 1, 2, 3], vel: .2, oct: 12 }, mel: { inst: 'piano', notes: THEME, vel: .5, every: 1 }, bass: .34, perc: 'train' },
  play: {
    bpm: 128, bars: [chord('G2', 'D3', 'G3', 'B3'), chord('C3', 'G3', 'C4', 'E4'), chord('G2', 'D3', 'G3', 'B3'), chord('D3', 'A3', 'D4', 'F#4'), chord('E3', 'G3', 'B3', 'E4'), chord('C3', 'G3', 'C4', 'E4'), chord('A2', 'E3', 'A3', 'C4'), chord('D3', 'A3', 'C4', 'F#4')], pad: .22,
    arp: { inst: 'pizz', pat: [0, 2, 1, 2, 3, 2, 1, 2], vel: .42, oct: 12 },
    mel: { inst: 'bell', notes: [[0, 'B5', .5], [.5, 'D6', .5], [1, 'G5', 1], [2.5, 'A5', .5], [3, 'B5', 1], [4, 'C6', .5], [4.5, 'E6', .5], [5, 'G5', 1], [6.5, 'E5', .5], [7, 'G5', 1], [8, 'B5', .5], [8.5, 'G5', .5], [9, 'D6', 1], [10, 'B5', .5], [10.5, 'A5', .5], [11, 'G5', 1], [12, 'A5', 1], [13, 'F#5', .5], [13.5, 'A5', .5], [14, 'D6', 2]], vel: .34, every: 1 }, bass: .4, perc: 'bounce',
  },
  danger: {
    bpm: 148, bars: [chord('B2', 'F#3', 'B3', 'D4'), chord('B2', 'F#3', 'B3', 'D4'), chord('G2', 'D3', 'G3', 'B3'), chord('A2', 'E3', 'A3', 'C#4'), chord('B2', 'F#3', 'B3', 'D4'), chord('E3', 'G3', 'B3', 'E4'), chord('F#2', 'C#3', 'F#3', 'A#3'), chord('F#2', 'C#3', 'E3', 'A#3')], pad: .4,
    arp: { inst: 'strings', pat: [0, 0, 1, 0, 2, 0, 1, 0], vel: .3, oct: 0, short: true },
    mel: { inst: 'brass', notes: [[0, 'B4', 1.5], [2, 'D5', 1], [3, 'F#5', 1], [8, 'G4', 1.5], [10, 'B4', 1], [11, 'D5', 1], [12, 'C#5', 3], [16, 'B4', 1.5], [18, 'D5', 1], [19, 'F#5', 1], [20, 'G5', 3], [24, 'F#5', 2], [26, 'E5', 1], [27, 'C#5', 1], [28, 'A#4', 3]], vel: .26, every: 1 }, bass: .46, perc: 'drive',
  },
  eerie: {
    bpm: 56, bars: [chord('A2', 'E3', 'A3', 'C4'), chord('F2', 'C3', 'A3', 'B3'), chord('D3', 'A3', 'D4', 'F4'), chord('E3', 'B3', 'D4', 'G#4')], pad: .4, choir: .16,
    arp: { inst: 'box', pat: [3, -1, 2, -1, 1, 2, -1, -1], vel: .3, oct: 24 }, mel: { inst: 'box', notes: [[0, 'E6', 1], [1, 'C6', 1], [2, 'B5', 2], [5, 'A5', 1], [6, 'D#6', 2], [8, 'F6', 1], [9, 'D6', 1], [10, 'A5', 2], [13, 'G#5', 1], [14, 'B5', 2]], vel: .26, every: 1 }, bass: .2,
  },
  city: {
    bpm: 104, bars: [chord('Bb2', 'F3', 'Bb3', 'D4'), chord('C3', 'G3', 'C4', 'E4'), chord('D3', 'A3', 'D4', 'F4'), chord('C3', 'G3', 'C4', 'E4'), chord('Bb2', 'F3', 'Bb3', 'D4'), chord('F2', 'C3', 'F3', 'A3'), chord('G2', 'D3', 'G3', 'Bb3'), chord('C3', 'G3', 'C4', 'E4')], pad: .4, choir: .1,
    arp: { inst: 'bell', pat: [0, 2, 3, 2, 1, 2, 3, 1], vel: .2, oct: 12 },
    mel: { inst: 'brass', notes: [[0, 'F5', 1.5], [1.5, 'D5', .5], [2, 'Bb4', 2], [4, 'G5', 1.5], [5.5, 'E5', .5], [6, 'C5', 2], [8, 'A5', 1], [9, 'F5', 1], [10, 'D5', 1], [11, 'F5', 1], [12, 'G5', 3], [16, 'F5', 1.5], [17.5, 'D5', .5], [18, 'Bb4', 2], [20, 'C5', 1], [21, 'F5', 1], [22, 'A5', 2], [24, 'Bb5', 1], [25, 'G5', 1], [26, 'D5', 2], [28, 'E5', 1], [29, 'G5', 1], [30, 'C6', 2]], vel: .2, every: 1 }, bass: .36, perc: 'march',
  },
  gathering: { bpm: 70, bars: THEME_CHORDS, pad: .62, choir: .26, arp: { inst: 'bell', pat: [0, 2, 1, 3, 2, 3, 1, 2], vel: .2, oct: 12 }, mel: { inst: 'bell', notes: THEME, vel: .5, every: 1, dbl: 'brass' }, bass: .4, perc: 'timp' },
  home: { bpm: 68, bars: THEME_CHORDS, pad: .34, arp: { inst: 'piano', pat: [0, -1, 2, -1, 1, -1, 3, -1], vel: .22, oct: 0 }, mel: { inst: 'piano', notes: THEME, vel: .55, every: 1 }, bass: .2 },
};

class Sound {
  constructor() { this.ctx = null; this.mood = null; this.enabled = { music: true, sfx: true }; this.loops = {}; this.duck = 1; }
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = .85;
    const comp = this.comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; this.master.connect(comp); comp.connect(c.destination);
    this.musicG = c.createGain(); this.musicG.gain.value = this.enabled.music ? MUSIC : 0; this.musicG.connect(this.master);
    this.sfxG = c.createGain(); this.sfxG.gain.value = .8; this.sfxG.connect(this.master);
    // a soft hall
    const len = c.sampleRate * 2.6, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    this.verb = c.createConvolver(); this.verb.buffer = ir; const vg = c.createGain(); vg.gain.value = .42; this.verb.connect(vg); vg.connect(this.master);
    this.musicG.connect(this.verb);
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0); let last = 0;
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
    const bb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), bd = bb.getChannelData(0);
    for (let i = 0; i < bd.length; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; bd[i] = last * 3.5; }
    this.brown = bb;
    this.timer = setInterval(() => this.schedule(), 80);
  }
  resume() { this.init(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => { }); }
  setEnabled(kind, on) { this.enabled[kind] = on; if (this.ctx) { if (kind === 'music') this.musicG.gain.setTargetAtTime(on ? MUSIC * this.duck : 0, this.ctx.currentTime, .2); else this.sfxG.gain.setTargetAtTime(on ? .8 : 0, this.ctx.currentTime, .1); } }
  setDuck(k) { this.duck = k; if (this.ctx && this.enabled.music) this.musicG.gain.setTargetAtTime(MUSIC * k, this.ctx.currentTime, .3); }

  // ----- instruments -----
  env(g, t, a, peak, d, sustain = 0, hold = 0) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); if (sustain) { g.gain.setTargetAtTime(peak * sustain, t + a, d / 3); g.gain.setTargetAtTime(0.0001, t + a + hold, .25); } else g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  osc(type, f, t, stop, dest, detune = 0) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; o.connect(dest); o.start(t); o.stop(stop); return o; }
  note(inst, midi, t, dur, vel, out = this.musicG) {
    const c = this.ctx, f = mtof(midi), g = c.createGain(); g.connect(out);
    if (inst === 'bell' || inst === 'box') {
      const box = inst === 'box'; this.env(g, t, .004, vel, box ? 1.1 : 2.2);
      this.osc('sine', f, t, t + 2.6, g);
      const g2 = c.createGain(); g2.gain.value = box ? .22 : .32; g2.connect(g); this.osc('sine', f * (box ? 3.01 : 2.76), t, t + 1.2, g2);
      const g3 = c.createGain(); g3.gain.value = .12; g3.connect(g); this.env(g3, t, .002, .14, .4); this.osc('sine', f * 5.4, t, t + .5, g3);
    } else if (inst === 'piano') {
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(6000, f * 6), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + 1.2); lp.connect(g);
      this.env(g, t, .006, vel, Math.max(1.4, dur * .9));
      this.osc('triangle', f, t, t + 2.4, lp, -4); this.osc('triangle', f, t, t + 2.4, lp, 5);
      const g2 = c.createGain(); g2.gain.value = .25; g2.connect(lp); this.osc('sine', f * 2, t, t + 1.5, g2);
    } else if (inst === 'pizz') {
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(5000, f * 5); lp.connect(g);
      this.env(g, t, .004, vel, .26); this.osc('triangle', f, t, t + .4, lp); this.osc('sawtooth', f, t, t + .4, lp, 6);
    } else if (inst === 'strings') {
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = .4; lp.connect(g);
      const short = dur < .5; this.env(g, t, short ? .02 : .35, vel * .5, short ? .22 : .4, short ? 0 : .9, dur);
      const end = t + dur + 1.2; this.osc('sawtooth', f, t, end, lp, -7); this.osc('sawtooth', f, t, end, lp, 7); this.osc('sawtooth', f / 2, t, end, lp, 0);
    } else if (inst === 'brass') {
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.2; lp.frequency.setValueAtTime(380, t); lp.frequency.linearRampToValueAtTime(2100, t + .09); lp.frequency.setTargetAtTime(1100, t + .12, .3); lp.connect(g);
      this.env(g, t, .05, vel * .6, .3, .8, dur * .9); const end = t + dur + .8;
      this.osc('sawtooth', f, t, end, lp, -3); this.osc('sawtooth', f, t, end, lp, 4);
    } else if (inst === 'choir') {
      const mix = c.createGain(); mix.gain.value = 1; mix.connect(g);
      for (const [ff, q, gg] of [[520, 6, 1], [1050, 8, .6], [2600, 9, .22]]) { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = q; const bg = c.createGain(); bg.gain.value = gg; bp.connect(bg); bg.connect(mix); mix['in' + ff] = bp; }
      this.env(g, t, .7, vel, .5, .9, dur); const end = t + dur + 1.4;
      for (const d of [-9, 0, 8]) { const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d; const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 4.6 + d * .03; lg.gain.value = 5; lfo.connect(lg); lg.connect(o.detune); lfo.start(t); lfo.stop(end); o.connect(mix.in520); o.connect(mix.in1050); o.connect(mix.in2600); o.start(t); o.stop(end); }
    } else if (inst === 'bass') {
      this.env(g, t, .02, vel, .5, .6, dur); this.osc('sine', f, t, t + dur + .6, g); const g2 = c.createGain(); g2.gain.value = .3; g2.connect(g); this.osc('triangle', f * 2, t, t + dur + .6, g2);
    }
  }
  hit(kind, t, vel = .5, out = this.musicG) {
    const c = this.ctx, g = c.createGain(); g.connect(out);
    if (kind === 'thump' || kind === 'timp') {
      const o = c.createOscillator(); o.type = 'sine'; const f0 = kind === 'timp' ? 110 : 150; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(kind === 'timp' ? 73 : 45, t + .16); o.connect(g);
      this.env(g, t, .004, vel, kind === 'timp' ? .9 : .22); o.start(t); o.stop(t + 1);
    } else {
      const s = c.createBufferSource(); s.buffer = this.noise; const f = c.createBiquadFilter();
      f.type = kind === 'shake' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'shake' ? 6000 : kind === 'brush' ? 2400 : 1200; f.Q.value = .8; s.connect(f); f.connect(g);
      this.env(g, t, .003, vel, kind === 'shake' ? .07 : .16); s.start(t, Math.random()); s.stop(t + .3);
    }
  }

  // ----- the sequencer -----
  setMood(name) {
    if (this.mood === name) return; this.mood = name; if (!this.ctx) return;
    this.bar = 0; this.nextBar = this.ctx.currentTime + .25;
    this.musicG.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicG.gain.setTargetAtTime(this.enabled.music ? MUSIC * this.duck : 0, this.ctx.currentTime + .2, .4);
  }
  schedule() {
    const c = this.ctx; if (!c || !this.mood || c.state !== 'running') return;
    const m = MOODS[this.mood]; if (!m) return;
    if (!(this.bar >= 0)) this.bar = 0;
    if (this.nextBar === undefined || this.nextBar < c.currentTime - .5) { this.nextBar = c.currentTime + .1; }
    const spb = 60 / m.bpm;
    while (this.nextBar < c.currentTime + .45) { this.playBar(m, this.bar, this.nextBar, spb); this.bar++; this.nextBar += spb * 4; }
  }
  playBar(m, bar, t, spb) {
    const ch = m.bars[bar % m.bars.length], loop = Math.floor(bar / m.bars.length);
    if (m.pad) for (let i = 1; i < ch.length; i++) this.note('strings', ch[i], t, spb * 4, m.pad * .3);
    if (m.choir) for (let i = 2; i < ch.length; i++) this.note('choir', ch[i] + 12, t, spb * 4, m.choir * .5);
    if (m.bass) { this.note('bass', ch[0], t, spb * 2, m.bass); if (m.bpm > 90) this.note('bass', ch[1], t + spb * 2, spb * 1.5, m.bass * .7); }
    if (m.arp) m.arp.pat.forEach((ix, i) => { if (ix < 0) return; this.note(m.arp.inst, ch[ix % ch.length] + m.arp.oct, t + i * spb / 2, m.arp.short ? .2 : spb, m.arp.vel * (i % 2 ? .75 : 1)); });
    if (m.mel && loop % m.mel.every === 0) {
      const b0 = (bar % m.bars.length) * 4;
      for (const [b, nn, d] of m.mel.notes) if (b >= b0 && b < b0 + 4) { this.note(m.mel.inst, n(nn), t + (b - b0) * spb, d * spb, m.mel.vel); if (m.mel.dbl && loop > 0) this.note(m.mel.dbl, n(nn) - 12, t + (b - b0) * spb, d * spb, m.mel.vel * .3); }
    }
    const p = m.perc;
    if (p === 'train') for (let i = 0; i < 8; i++) this.hit('shake', t + i * spb / 2, i % 2 ? .05 : .1);
    else if (p === 'bounce') for (let i = 0; i < 8; i++) { if (i % 4 === 0) this.hit('thump', t + i * spb / 2, .5); if (i % 4 === 2) this.hit('brush', t + i * spb / 2, .16); this.hit('shake', t + i * spb / 2, .07); }
    else if (p === 'drive') for (let i = 0; i < 8; i++) { if (i % 2 === 0) this.hit('thump', t + i * spb / 2, i % 4 === 0 ? .7 : .4); if (i % 4 === 2) this.hit('brush', t + i * spb / 2, .22); if (i === 7) this.hit('brush', t + i * spb / 2, .14); }
    else if (p === 'march') for (let i = 0; i < 4; i++) { this.hit(i % 2 ? 'brush' : 'thump', t + i * spb, i % 2 ? .1 : .3); }
    else if (p === 'timp') { this.hit('timp', t, .5); if (bar % 4 === 3) { this.hit('timp', t + spb * 3, .35); this.hit('timp', t + spb * 3.5, .45); } }
  }

  // ----- loops: the train, the wind -----
  loop(name, on, vol = 1) {
    const c = this.ctx; if (!c) return;
    let L = this.loops[name];
    if (!L) {
      const s = c.createBufferSource(); s.loop = true; const g = c.createGain(); g.gain.value = 0; const f = c.createBiquadFilter();
      if (name === 'train') { s.buffer = this.brown; f.type = 'lowpass'; f.frequency.value = 260; }
      else if (name === 'wind') { s.buffer = this.noise; f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = .7; const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = .13; lg.gain.value = 260; l.connect(lg); lg.connect(f.frequency); l.start(); }
      else if (name === 'steam') { s.buffer = this.noise; f.type = 'highpass'; f.frequency.value = 3200; }
      else { s.buffer = this.brown; f.type = 'lowpass'; f.frequency.value = 120; }
      s.connect(f); f.connect(g); g.connect(this.sfxG); s.start(); L = this.loops[name] = { g, base: name === 'train' ? .5 : name === 'wind' ? .16 : name === 'steam' ? .05 : .7 };
      if (name === 'train') { L.clack = setInterval(() => { if (L.on && c.state === 'running' && this.enabled.sfx) { const t = c.currentTime + .02; this.hit('thump', t, .2 * L.vol, this.sfxG); this.hit('thump', t + .13, .14 * L.vol, this.sfxG); } }, 640); }
    }
    L.on = on; L.vol = vol; L.g.gain.setTargetAtTime(on ? L.base * vol : 0, c.currentTime, .4);
  }
  stopLoops() { for (const k in this.loops) this.loop(k, false); }

  // ----- one-shot sounds -----
  sfx(name, o = {}) {
    const c = this.ctx; if (!c || c.state !== 'running' || !this.enabled.sfx) return;
    const t = c.currentTime + .01, out = this.sfxG;
    const tone = (inst, notes, gap = .09, vel = .4) => notes.forEach((x, i) => this.note(inst, typeof x === 'string' ? n(x) : x, t + i * gap, .4, vel, out));
    switch (name) {
      case 'blip': tone('pizz', ['A5'], 0, .3); break;
      case 'next': tone('pizz', ['E5'], 0, .22); break;
      case 'pick': tone('bell', ['D6', 'F#6', 'A6'], .08, .3); break;
      case 'keepsake': tone('bell', ['A5', 'D6', 'F#6', 'A6', 'D7'], .09, .34); break;
      case 'good': tone('bell', ['G5', 'B5', 'D6'], .07, .3); break;
      case 'star': tone('bell', ['D5', 'A5', 'D6', 'F#6', 'A6', 'D7'], .12, .4); this.verb && this.note('choir', n('D5'), t, 2, .3, out); break;
      case 'oops': tone('pizz', ['E4', 'C4'], .12, .4); break;
      case 'bump': this.hit('thump', t, .7, out); this.hit('brush', t, .3, out); break;
      case 'catch': tone('pizz', [o.note || 'D5'], 0, .5); break;
      case 'chime': tone('bell', ['A4', 'E5', 'A5'], .22, .4); break;
      case 'horn': for (const x of ['D3', 'A3', 'F#4']) this.note('brass', n(x), t, 1.6, .5, out); this.note('choir', n('D4'), t, 1.8, .3, out); break;
      case 'step': this.hit('brush', t, .05, out); break;
      case 'jump': { const g = c.createGain(); g.connect(out); const os = c.createOscillator(); os.type = 'sine'; os.frequency.setValueAtTime(300, t); os.frequency.exponentialRampToValueAtTime(620, t + .14); os.connect(g); this.env(g, t, .01, .16, .16); os.start(t); os.stop(t + .25); break; }
      case 'whoosh': case 'steam': case 'gust': { const s = c.createBufferSource(); s.buffer = this.noise; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = name === 'steam' ? .5 : 1.4; f.frequency.setValueAtTime(name === 'steam' ? 5200 : 500, t); f.frequency.exponentialRampToValueAtTime(name === 'steam' ? 2600 : 2400, t + .35); const g = c.createGain(); s.connect(f); f.connect(g); g.connect(out); this.env(g, t, .06, name === 'steam' ? .3 : .4, name === 'steam' ? .7 : .5); s.start(t, Math.random()); s.stop(t + 1); break; }
      case 'crack': { for (let i = 0; i < 4; i++) { const s = c.createBufferSource(); s.buffer = this.noise; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 2600; f.Q.value = 5; const g = c.createGain(); s.connect(f); f.connect(g); g.connect(out); const tt = t + i * .07 * Math.random(); this.env(g, tt, .002, .5, .12); s.start(tt, Math.random()); s.stop(tt + .2); } this.hit('thump', t, .5, out); break; }
      case 'clank': { for (const f of [820, 1240, 1930]) { const g = c.createGain(); g.connect(out); this.env(g, t, .002, .16, .3); this.osc('square', f, t, t + .35, g); } this.hit('thump', t, .4, out); break; }
      case 'rumble': { const s = c.createBufferSource(); s.buffer = this.brown; const g = c.createGain(); s.connect(g); g.connect(out); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(1.1, t + (o.rise || 1.5)); g.gain.linearRampToValueAtTime(.0001, t + (o.len || 4)); s.start(t); s.stop(t + (o.len || 4) + .1); break; }
      case 'woof': { for (const [d, f] of [[0, 300], [.2, 260]]) { const g = c.createGain(); g.connect(out); const os = c.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(f, t + d); os.frequency.exponentialRampToValueAtTime(f * .5, t + d + .12); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; os.connect(lp); lp.connect(g); this.env(g, t + d, .01, .35, .13); os.start(t + d); os.stop(t + d + .2); } break; }
      case 'fork': this.note('bell', n('A5'), t, 2, .45, out); this.note('bell', n('A6'), t, 2, .12, out); break;
      case 'cheer': tone('bell', ['D5', 'F#5', 'A5', 'D6'], .06, .3); for (let i = 0; i < 10; i++) this.hit('shake', t + i * .05, .16, out); break;
      case 'stamp': this.hit('thump', t, .8, out); tone('pizz', ['C4'], 0, .4); break;
      case 'lever': this.hit('brush', t, .3, out); this.hit('thump', t + .06, .5, out); break;
      case 'box': tone('box', ['E6', 'C6', 'B5', 'D#6'], .28, .3); break;
    }
  }
}
export const audio = new Sound();
