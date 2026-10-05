// Works out which route a bus is on from where it has been.
//
// The vehicle tracker reports a bus number and a position, never a route. Every route leaves the
// terminal on its own streets within about a mile, so a short trail of positions fits one route's
// line and no other. For each bus this keeps a trail of recent positions and, for each route, counts
// how many of them in a row follow that route's line in the right direction. When one route is
// clearly ahead of the rest the bus is assigned to it, and it keeps that route through layovers and
// shared streets until its trail plainly follows a different one.
import { project, metres, angleGap } from './geo.js';

export const TUNE = {
  OFF_M: 45,          // how far from a route's line still counts as on it
  MOVE_M: 25,         // positions closer together than this are the bus standing still
  TRAIL: 14,          // positions kept per bus
  TRAIL_AGE: 25 * 60e3,
  NEED: 3,            // positions in a row on a route before it can be assigned
  LEAD: 3,            // and it must be this many ahead of every other route
  DROP: 6,            // positions in a row off its route before a bus loses the assignment
  PARKED: 25 * 60e3,  // standing this long (longer than a layover) clears the bus for a fresh start
};

export const fresh = () => ({ trail: [], route: null, d: null, off: 0, by: null, fit: {}, seen: 0, moved: 0 });

// Feed one position report {t, lat, lon, h, s} (ms, degrees, compass degrees or null, m/s or null).
export function step(net, st, ping, forced) {
  st ??= fresh();
  if (ping.t <= st.seen) return st;
  Object.assign(st, { seen: ping.t, lat: ping.lat, lon: ping.lon, h: ping.h ?? null, s: ping.s ?? null });
  const last = st.trail.at(-1);
  if (!last || metres(net, last, ping) >= TUNE.MOVE_M) { st.trail.push({ t: ping.t, lat: ping.lat, lon: ping.lon, h: ping.h ?? null, s: ping.s ?? null }); st.moved = ping.t; }
  if (ping.t - st.moved > TUNE.PARKED) { st.trail = []; st.route = null; st.d = null; st.by = null; st.fit = {}; return st; }
  st.trail = st.trail.filter(p => ping.t - p.t <= TUNE.TRAIL_AGE).slice(-TUNE.TRAIL);
  if (st.moved === ping.t || forced) evaluate(net, st, forced);
  return st;
}

function follow(net, r, trail) {
  let H = null, run = 0, off = 0, prevT = 0;
  for (const p of trail) {
    let C = project(net, r, p.lat, p.lon, TUNE.OFF_M);
    if (p.h != null && p.s != null && p.s >= 3) C = C.filter(c => angleGap(c.brg, p.h) <= 100);
    let next = [];
    if (H && C.length) {
      const reach = Math.max(500, 30 * (p.t - prevT) / 1000 + 300); // farthest a bus could have got since the last fit
      next = C.filter(c => H.some(h => { const fwd = ((c.d - h.d) % r.length + r.length) % r.length; return fwd <= reach || fwd >= r.length - 60; }));
    }
    if (next.length) { H = next; run++; off = 0; prevT = p.t; }
    else if (!H && C.length) { H = C; run = 1; off = 0; prevT = p.t; }
    else { off++; if (off >= 2) { H = C.length ? C : null; run = C.length ? 1 : 0; if (C.length) { off = 0; prevT = p.t; } } }
  }
  return { run, off, H };
}

function evaluate(net, st, forced) {
  const res = {};
  for (const r of net.routes) res[r.id] = follow(net, r, st.trail);
  st.fit = Object.fromEntries(Object.entries(res).map(([id, v]) => [id, [v.run, v.off]]));
  if (forced && res[forced]) { st.route = forced; st.by = 'override'; }
  else {
    if (st.by === 'override') { st.route = null; st.by = null; }
    // a rival route stays in the count until the bus has missed it twice running, so one stray position decides nothing
    const ranked = Object.entries(res).filter(([, v]) => v.off <= 1).sort((a, b) => b[1].run - a[1].run);
    const top = ranked[0], second = ranked[1]?.[1].run ?? 0;
    const clear = top && top[1].off === 0 && top[1].run >= TUNE.NEED && top[1].run - second >= TUNE.LEAD ? top[0] : null;
    const mine = st.route && res[st.route];
    if (!st.route) { if (clear) { st.route = clear; st.by = 'path'; } }
    else if (mine.off >= 2 && clear && clear !== st.route) { st.route = clear; st.by = 'path'; } // its trail now follows another route
    else if (trailingMisses(net, st) >= TUNE.DROP) { st.route = null; st.by = null; }
  }
  place(net, st, st.route && res[st.route]);
}
function trailingMisses(net, st) { // positions in a row, newest first, that are off the assigned route's line
  const r = net.byId[st.route]; let n = 0;
  for (let i = st.trail.length - 1; i >= 0; i--) { if (project(net, r, st.trail[i].lat, st.trail[i].lon, TUNE.OFF_M).length) break; n++; }
  return n;
}
function place(net, st, v) { // where along its route the bus is
  if (!v) { st.d = null; st.off = 0; return; }
  st.off = v.off;
  if (v.off !== 0 || !v.H?.length) return;
  const L = net.byId[st.route].length, ahead = c => ((c.d - st.d) % L + L) % L;
  st.d = (st.d == null ? v.H.reduce((a, b) => (a.off <= b.off ? a : b)) : v.H.reduce((a, b) => (ahead(a) <= ahead(b) ? a : b))).d;
}

// One bus per route: when every other candidate route already has a bus on it, the bus that is
// left must be on the route that is left. Call after stepping all buses. active = ids in service now.
export function settle(net, states, active) {
  const taken = new Set(active.map(id => states[id]).filter(s => s?.route && s.off < 2).map(s => s.route));
  for (const id of active) {
    const st = states[id];
    if (!st || st.route) continue;
    const open = Object.entries(st.fit).filter(([r, [run, off]]) => off === 0 && run >= TUNE.NEED && !taken.has(r));
    const any = Object.entries(st.fit).filter(([, [run, off]]) => off === 0 && run >= TUNE.NEED);
    if (open.length === 1 && any.length > 1) { st.route = open[0][0]; st.by = 'elimination'; taken.add(st.route); place(net, st, follow(net, net.byId[st.route], st.trail)); }
  }
  return states;
}
