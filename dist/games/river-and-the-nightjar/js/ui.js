// The paper layer: dialogue cards, choices, prompts, menus, the keepsake book and the reading voice.
import { input } from './input.js';
import { audio } from './audio.js';
import { VOICES, KEEPSAKES, CHAPTER_LIST } from './story.js';
import { KEEPSAKE_KINDS } from './kit.js';

const $ = id => document.getElementById(id);
const root = document.documentElement;
let voice = null;
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
    voice = vs.find(v => /Samantha|Google UK English Female|Jenny|Aria|Libby|Sonia|Karen|Moira/i.test(v.name)) || vs.find(v => v.default) || vs[0] || null;
  } catch (e) { voice = null; }
}
try { if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.addEventListener('voiceschanged', pickVoice); } } catch (e) { /* no voice on this device */ }

export const ui = {
  busy: false, menu: null, auto: false, autoPick: null, settings: { voice: true, music: true, fancy: true },
  on: {}, line: null, picks: null, bubbles: [], project: null, navUsed: false, fi: 0, toastT: 0, bigT: 0, since: 0,

  // ----- talking -----
  speak(who, text) {
    if (!this.settings.voice || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[*_]/g, '')); const v = VOICES[who] || { pitch: 1, rate: .95 };
      if (voice) u.voice = voice; u.pitch = v.pitch; u.rate = v.rate; u.volume = 1;
      u.onstart = () => audio.setDuck(.5); u.onend = u.onerror = () => audio.setDuck(1);
      speechSynthesis.speak(u);
    } catch (e) { /* carry on without the voice */ }
  },
  hush() { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* fine */ } audio.setDuck(1); },
  show(who, text, picks) {
    const d = $('dialog'); d.classList.add('on'); d.classList.toggle('narr', !who);
    $('who').textContent = who || ''; $('who').style.background = (VOICES[who] || {}).color || '#2a8f8a';
    $('picks').innerHTML = ''; $('more').hidden = !!picks;
    this.busy = true; this.since = 0; this.hideT = 0; root.classList.add('talking');
    this.line = { text, n: 0, done: false }; $('said').textContent = '';
    if (text) this.speak(who, text); else { this.line.done = true; }
    this.setKeys();
  },
  say(who, text) {
    return new Promise(res => { this.show(who, text, null); this.line.res = res; if (this.auto) { this.line.auto = true; } });
  },
  choose(who, text, options) {
    return new Promise(res => {
      this.show(who, text, true);
      const box = $('picks'); this.picks = { options, res, i: 0, els: [] };
      options.forEach((o, i) => {
        const b = document.createElement('button'); b.className = 'pick'; b.type = 'button'; b.textContent = o.label;
        b.addEventListener('click', () => this.pick(i)); box.appendChild(b); this.picks.els.push(b);
      });
      box.style.visibility = 'hidden';
      if (this.auto) this.line.auto = true;
    });
  },
  pick(i) {
    const p = this.picks; if (!p || !this.line.done || this.since < .25) return;
    this.picks = null; audio.sfx('blip'); this.hush(); this.endLine(); p.res(p.options[i].value ?? i);
  },
  endLine() { this.line = null; this.hideT = .12; },
  closeDialog() { $('dialog').classList.remove('on'); this.busy = false; root.classList.remove('talking'); },
  // Called when a chapter is abandoned: let every waiting promise go so the old script can stop.
  flush() {
    const l = this.line, p = this.picks; this.line = null; this.picks = null; this.hush(); this.closeDialog();
    if (p) p.res(p.options[0].value ?? 0); else if (l && l.res) l.res();
    this.goal(null); this.meter(null); this.prompt(null); this.bars(false);
    for (const b of this.bubbles) b.el.remove(); this.bubbles = [];
    $('toast').classList.remove('on'); $('big').classList.remove('on');
  },

  // ----- little HUD pieces -----
  setKeys() {
    const dev = input.device, k = dev === 'pad' ? 'A' : dev === 'touch' ? 'Tap' : 'E';
    for (const id of ['promptKey', 'moreKey']) { const e = $(id); e.textContent = k; e.classList.toggle('pad', dev === 'pad'); }
  },
  prompt(text, x, y) {
    const p = $('prompt');
    if (!text) { p.classList.remove('on'); return; }
    if (this._pt !== text) { $('promptText').textContent = text; this._pt = text; this.setKeys(); }
    p.style.left = x + 'px'; p.style.top = (y - 10) + 'px'; p.classList.add('on');
  },
  goal(text) { const g = $('goal'); if (!text) { g.hidden = true; this._goal = null; return; } if (this._goal === text) return; this._goal = text; g.hidden = false; g.textContent = text; g.classList.remove('pop'); void g.offsetWidth; g.classList.add('pop'); },
  chap(text) { $('chap').textContent = text || ''; },
  hud(on) { $('hud').classList.toggle('off', !on); },
  bars(on) { $('app').classList.toggle('bars-on', !!on); },
  action(on) { root.classList.toggle('action', !!on); },
  meter(label, v, o = {}) {
    const m = $('meter'); if (label === null || label === undefined) { m.hidden = true; return; }
    m.hidden = false; $('meterLabel').textContent = label; m.querySelector('.fill').style.width = (Math.max(0, Math.min(1, v)) * 100) + '%';
    const z = m.querySelector('.zone'), pin = m.querySelector('.pin');
    if (o.zone) { z.style.display = 'block'; z.style.left = o.zone[0] * 100 + '%'; z.style.width = (o.zone[1] - o.zone[0]) * 100 + '%'; } else z.style.display = 'none';
    if (o.pin !== undefined) { pin.style.display = 'block'; pin.style.left = `calc(${o.pin * 100}% - 2px)`; m.querySelector('.fill').style.width = '0%'; } else pin.style.display = 'none';
  },
  toast(text, small = '', secs = 3) { const t = $('toast'); t.innerHTML = ''; t.append(text); if (small) { const s = document.createElement('small'); s.textContent = small; t.append(s); } t.classList.add('on'); this.toastT = secs; },
  big(text, secs = 1.4) { const b = $('big'); b.textContent = text; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); this.bigT = secs; },
  bubble(getPos, text, secs = 2.6) {
    const el = document.createElement('div'); el.className = 'bubble'; el.textContent = text; $('bubbles').appendChild(el);
    for (const b of this.bubbles) if (b.getPos === getPos) b.t = 0;
    this.bubbles.push({ el, getPos, t: secs });
  },
  keepCount(n) { $('keepCount').textContent = n + '/' + KEEPSAKES.length; },
  fade(v, secs = .7) { const f = $('fade'); f.style.transitionDuration = secs + 's'; f.style.opacity = v; },
  card(n, title) { $('cardN').textContent = n; $('cardT').textContent = title; $('cardScreen').classList.add('on'); },
  cardOff() { $('cardScreen').classList.remove('on'); },
  loaded() { $('loading').remove(); },

  // ----- menus -----
  screen(id, on) { $(id).classList.toggle('on', on); this.fi = 0; this.navUsed = false; this.paintFocus(); },
  open(id) {
    if (this.menu) $(this.menu).classList.remove('on');
    this.menu = id; $(id).classList.add('on'); this.fi = 0; this.paintFocus(); this.hush();
    if (id === 'journal') this.renderJournal(); if (id === 'chapters') this.renderChapters(); if (id === 'pause') this.renderPause();
  },
  close() { if (!this.menu) return; $(this.menu).classList.remove('on'); const was = this.menu; this.menu = null; this.fi = 0; this.paintFocus(); if (this.on.closed) this.on.closed(was); },
  container() { if (this.menu) return $(this.menu); for (const id of ['title', 'end']) if ($(id).classList.contains('on')) return $(id); return null; },
  buttons() { const c = this.container(); return c ? [...c.querySelectorAll('button')].filter(b => !b.hidden && b.offsetParent !== null) : []; },
  paintFocus() { document.querySelectorAll('.focus').forEach(e => e.classList.remove('focus')); if (!this.navUsed) return; const b = this.buttons(); if (b.length) { this.fi = (this.fi + b.length) % b.length; b[this.fi].classList.add('focus'); b[this.fi].scrollIntoView({ block: 'nearest' }); if (this.menu === 'journal' && b[this.fi].dataset.k) this.showKeep(b[this.fi].dataset.k); } },
  renderChapters() {
    const g = $('chapGrid'); g.innerHTML = '';
    CHAPTER_LIST.forEach((c, i) => {
      const b = document.createElement('button'); b.className = 'chapBtn'; b.type = 'button';
      const found = KEEPSAKES.filter(k => k.ch === i && this.save.keepsakes[k.id]).length;
      b.innerHTML = `<small></small><b></b><span></span>`; b.children[0].textContent = c.n; b.children[1].textContent = c.title; b.children[2].textContent = `Keepsakes ${found} of 2` + (this.save.reached > i || this.save.done ? ' · finished' : '');
      b.addEventListener('click', () => { this.close(); this.on.chapter(i); }); g.appendChild(b);
    });
  },
  renderJournal() {
    const g = $('keepGrid'); g.innerHTML = ''; const have = this.save.keepsakes, n = KEEPSAKES.filter(k => have[k.id]).length;
    $('keepLead').textContent = n === KEEPSAKES.length ? 'You found every one. The whole history of the railway is yours.' : `You have found ${n} of ${KEEPSAKES.length}. Two hide in every chapter.`;
    $('keepText').innerHTML = '<b>Pick a keepsake</b>Each one tells a little of the history of the railway.';
    for (const k of KEEPSAKES) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'keep' + (have[k.id] ? '' : ' none'); b.dataset.k = k.id;
      b.innerHTML = '<small></small><b></b>'; b.children[0].textContent = have[k.id] ? KEEPSAKE_KINDS[k.kind] : CHAPTER_LIST[k.ch].n; b.children[1].textContent = have[k.id] ? k.title : 'Not found yet';
      b.addEventListener('click', () => { this.showKeep(k.id); if (have[k.id]) this.speak(null, k.text); }); g.appendChild(b);
    }
  },
  showKeep(id) { const k = KEEPSAKES.find(x => x.id === id), t = $('keepText'); t.innerHTML = '<b></b>'; if (this.save.keepsakes[id]) { t.firstChild.textContent = k.title; t.append(k.text); } else { t.firstChild.textContent = 'Not found yet'; t.append(`Look around in ${CHAPTER_LIST[k.ch].n}: ${CHAPTER_LIST[k.ch].title}.`); } },
  renderPause() {
    const s = this.settings;
    $('bVoice').textContent = 'Read aloud: ' + (s.voice ? 'on' : 'off'); $('bMusic').textContent = 'Music: ' + (s.music ? 'on' : 'off'); $('bFancy').textContent = 'Glow and sparkle: ' + (s.fancy ? 'on' : 'off');
    $('pauseLead').textContent = this.pauseLead || '';
  },

  init(save) {
    this.save = save; this.settings = save.settings;
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => this.close()));
    const tog = (id, key) => $(id).addEventListener('click', () => { this.settings[key] = !this.settings[key]; this.renderPause(); if (this.on.setting) this.on.setting(key); if (key === 'voice' && !this.settings.voice) this.hush(); });
    tog('bVoice', 'voice'); tog('bMusic', 'music'); tog('bFancy', 'fancy');
    $('bStart').addEventListener('click', () => this.on.start());
    $('bContinue').addEventListener('click', () => this.on.cont());
    for (const id of ['bChapters', 'bPauseChapters', 'bEndChapters']) $(id).addEventListener('click', () => this.open('chapters'));
    for (const id of ['bHelp', 'bPauseHelp']) $(id).addEventListener('click', () => this.open('help'));
    for (const id of ['bJournal', 'bEndJournal']) $(id).addEventListener('click', () => this.open('journal'));
    $('bMenu').addEventListener('click', () => this.open('pause'));
    $('bQuit').addEventListener('click', () => { this.close(); this.on.quit(); });
    $('bEndTitle').addEventListener('click', () => this.on.quit());
    $('card').addEventListener('click', e => { if (!e.target.closest('.pick')) input.press('act'); });
    $('cardScreen').addEventListener('click', () => input.press('act'));
    document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) this.close(); }));
  },

  update(dt) {
    const p = input.p;
    this.since += dt;
    // menus first: they sit on top of everything
    const c = this.container();
    if (c) {
      const b = this.buttons(); let moved = 0;
      if (p.down || p.right) moved = 1; if (p.up || p.left) moved = -1;
      if (this.menu && (this.menu === 'chapters' || this.menu === 'journal') && b.length > 4) { const cols = Math.max(1, Math.round($(this.menu === 'chapters' ? 'chapGrid' : 'keepGrid').clientWidth / (b[0].offsetWidth + 9))); if (p.down) moved = cols; if (p.up) moved = -cols; }
      if (moved) { if (!this.navUsed) { this.navUsed = true; } else this.fi = Math.max(0, Math.min(b.length - 1, this.fi + moved)); this.paintFocus(); audio.sfx('next'); }
      else if (p.act && b.length && !this.busy && this.since > .3) { this.navUsed = true; audio.sfx('blip'); this.since = 0; b[Math.min(this.fi, b.length - 1)].click(); }
      else if ((p.back || p.pause) && this.menu) this.close();
      if (this.menu) return;
    }
    // the dialogue card
    const l = this.line;
    if (l) {
      if (!l.done) {
        l.n += dt * 46; if (p.act && this.since > .15 || l.auto) l.n = l.text.length;
        const n = Math.min(l.text.length, Math.floor(l.n)); if (n !== l.shown) { l.shown = n; $('said').textContent = l.text.slice(0, n); }
        if (n >= l.text.length) { l.done = true; this.since = 0; if (this.picks) { $('picks').style.visibility = ''; this.picks.i = 0; if (input.device !== 'touch') this.picks.els[0].classList.add('focus'); } }
      } else if (this.picks) {
        const pk = this.picks; let mv = 0; if (p.down) mv = 1; if (p.up) mv = -1;
        if (mv) { pk.i = (pk.i + mv + pk.els.length) % pk.els.length; pk.els.forEach((e, i) => e.classList.toggle('focus', i === pk.i)); audio.sfx('next'); }
        else if (l.auto) { const want = this.autoPick ? this.autoPick(pk.options) : 0; this.since = 1; this.pick(want); }
        else if (p.act) this.pick(pk.i);
      } else if ((p.act && this.since > .12) || (l.auto && this.since >= (this.autoDelay || 0))) { const r = l.res; audio.sfx('next'); this.hush(); this.endLine(); r(); }
    } else if (this.busy) { this.hideT -= dt; if (this.hideT <= 0) this.closeDialog(); }
    // timers
    if (this.toastT > 0) { this.toastT -= dt; if (this.toastT <= 0) $('toast').classList.remove('on'); }
    if (this.bigT > 0) { this.bigT -= dt; if (this.bigT <= 0) $('big').classList.remove('on'); }
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i]; b.t -= dt;
      if (b.t <= 0) { b.el.remove(); this.bubbles.splice(i, 1); continue; }
      const s = this.project && this.project(b.getPos()); if (s && s.ok) { b.el.style.left = s.x + 'px'; b.el.style.top = (s.y - 8) + 'px'; b.el.style.display = ''; } else b.el.style.display = 'none';
    }
  },
};
