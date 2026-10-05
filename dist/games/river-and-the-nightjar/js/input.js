// Keyboard, game controller and touch, folded into one set of answers the game can ask for.
const keys = new Set(), tapped = new Set();   // tapped: keys pressed since the last frame, so a quick tap is never missed
const touch = { mx: 0, my: 0, act: false, jump: false, duck: false };
const queued = new Set();
const NAMES = ['act', 'jump', 'duck', 'pause', 'journal', 'back', 'up', 'down', 'left', 'right'];
const prev = {};

export const input = {
  mx: 0, my: 0,         // movement, -1 to 1 (my is up/away from the camera)
  h: {}, p: {},         // held, and pressed this frame
  device: 'key',        // 'key', 'pad' or 'touch': which hints to show
  any: false,
  press(name) { queued.add(name); },
  clear() { for (const n of NAMES) { this.p[n] = false; } queued.clear(); },
  poll() {
    let mx = 0, my = 0;
    const k = c => keys.has(c) || tapped.has(c);
    const raw = {
      left: k('ArrowLeft') || k('KeyA'), right: k('ArrowRight') || k('KeyD'), up: k('ArrowUp') || k('KeyW'), down: k('ArrowDown') || k('KeyS'),
      act: k('KeyE') || k('Enter') || k('Space') || k('NumpadEnter'), jump: k('Space') || k('ArrowUp') || k('KeyW'), duck: k('ArrowDown') || k('KeyS') || k('ShiftLeft') || k('ControlLeft'),
      pause: k('Escape') || k('KeyP'), journal: k('KeyJ') || k('Tab'), back: k('Escape') || k('Backspace'),
    };
    if (raw.left) mx -= 1; if (raw.right) mx += 1; if (raw.up) my += 1; if (raw.down) my -= 1;
    let pads = [];
    try { pads = (navigator.getGamepads ? [...navigator.getGamepads()] : []).filter(Boolean); } catch (e) { /* no controller */ }
    for (const g of pads) {
      const b = i => !!(g.buttons[i] && g.buttons[i].pressed);
      const ax = Math.abs(g.axes[0] || 0) > .22 ? g.axes[0] : 0, ay = Math.abs(g.axes[1] || 0) > .22 ? g.axes[1] : 0;
      if (ax || ay) { mx += ax; my -= ay; this.device = 'pad'; }
      const dl = b(14), dr = b(15), du = b(12), dd = b(13);
      if (dl) mx -= 1; if (dr) mx += 1; if (du) my += 1; if (dd) my -= 1;
      raw.left = raw.left || dl || ax < -.55; raw.right = raw.right || dr || ax > .55; raw.up = raw.up || du || ay < -.55; raw.down = raw.down || dd || ay > .55;
      raw.act = raw.act || b(0) || b(2); raw.jump = raw.jump || b(0); raw.duck = raw.duck || b(1) || dd || ay > .6;
      raw.pause = raw.pause || b(9); raw.journal = raw.journal || b(3); raw.back = raw.back || b(1);
      if (g.buttons.some(x => x.pressed)) this.device = 'pad';
    }
    if (touch.mx || touch.my) { mx += touch.mx; my += touch.my; }
    raw.act = raw.act || touch.act || tapped.has('tAct'); raw.jump = raw.jump || touch.jump || tapped.has('tJump'); raw.duck = raw.duck || touch.duck || touch.my < -.6;
    raw.left = raw.left || touch.mx < -.55; raw.right = raw.right || touch.mx > .55; raw.up = raw.up || touch.my > .55; raw.down = raw.down || touch.my < -.55;
    const len = Math.hypot(mx, my); if (len > 1) { mx /= len; my /= len; }
    this.mx = mx; this.my = my; this.any = false;
    for (const n of NAMES) {
      const q = queued.has(n);
      this.p[n] = (raw[n] && !prev[n]) || q; this.h[n] = !!raw[n]; prev[n] = !!raw[n];
      if (this.p[n]) this.any = true;
    }
    queued.clear(); tapped.clear();
  },
};

addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
  if (!e.repeat) tapped.add(e.code); keys.add(e.code); input.device = 'key';
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

// Touch: a thumb stick on the left, buttons on the right.
export function bindTouch(root) {
  const stick = root.querySelector('#stick'), nub = root.querySelector('#nub');
  let id = null, cx = 0, cy = 0;
  const end = () => { id = null; touch.mx = touch.my = 0; nub.style.transform = ''; };
  stick.addEventListener('pointerdown', e => { id = e.pointerId; const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; stick.setPointerCapture(id); move(e); input.device = 'touch'; });
  const move = e => {
    if (e.pointerId !== id) return;
    let dx = (e.clientX - cx) / 46, dy = (e.clientY - cy) / 46; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    touch.mx = Math.abs(dx) > .15 ? dx : 0; touch.my = Math.abs(dy) > .15 ? -dy : 0; nub.style.transform = `translate(${dx * 34}px,${dy * 34}px)`;
  };
  stick.addEventListener('pointermove', move); stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
  for (const [sel, name] of [['#tAct', 'act'], ['#tJump', 'jump'], ['#tDuck', 'duck']]) {
    const b = root.querySelector(sel);
    b.addEventListener('pointerdown', e => { e.preventDefault(); touch[name] = true; tapped.add(sel.slice(1)); input.device = 'touch'; b.classList.add('down'); });
    const up = () => { touch[name] = false; b.classList.remove('down'); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
  }
  addEventListener('touchstart', () => { input.device = 'touch'; document.documentElement.classList.add('touch'); }, { passive: true });
}
