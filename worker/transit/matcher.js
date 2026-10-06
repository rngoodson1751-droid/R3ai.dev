// Works out which route a bus is on from the stops it passes.
//
// The vehicle trackers report a bus number and a position, never a route. A bus is given a route only once
// it has been seen to pass three of that route's own stops, in order, travelling the right way along the
// route's line. Until then it has no route at all. "Own" stops are the ones no other route serves; the
// routes share almost nothing but the terminal, so three of them in a row settle it.
//
// Following a route's line is not enough by itself: every bus drives in from the facility along Broad Street,
// which two routes also use, and a guess made from that drive is wrong for most of the fleet. So the drive
// from the facility counts for nothing, the count starts again every time a bus is at the terminal, and a bus
// that is first seen part of the way round a route must also be near that route's timetable.
//
// Once a bus has its route it keeps it through layovers and detours. It changes route only by leaving the
// terminal and passing three stops of a different one.
import { project, metres, angleGap, tripFor, tripsOn } from './geo.js';

export const TUNE = {
  OFF_M: 45,          // how far from a route's line still counts as on it
  MOVE_M: 60,         // positions are added to the trail this far apart, so a tracker that reports every few
                      // seconds and one that reports every minute are judged over similar distances
  TRAIL: 16,          // recent positions kept per bus (for checking; the stop counts do not depend on it)
  TRAIL_AGE: 25 * 60e3,
  STOPS: 3,           // own stops passed in order before a route is given
  LEAD: 2,            // and this many more than any other route the bus could still be on
  PAST_M: 25,         // a stop counts as passed once the bus is this far beyond it
  TERMINAL_M: 150,    // within this distance of the terminal a bus is "at the terminal"
  NEAR: 20 * 60,      // a bus first seen part of the way round must be within this many seconds of the timetable
  GAP: 5 * 60e3,      // a bus not seen moving for this long starts its stop count again
  DEADHEAD: 20 * 60e3, // how long a bus that has left the facility is taken to be driving to the terminal
  DUE: 30 * 60,       // a bus at the terminal is on duty when a trip leaves within this many seconds
  DETOUR: 20 * 60e3,  // a bus off its route this long without rejoining it loses the route
  PARKED: 25 * 60e3,  // standing this long (longer than a layover) clears the bus for a fresh start, unless it is
                      // waiting at the terminal for a later trip
};

export const fresh = () => ({ trail: [], route: null, d: null, off: 0, by: null, f: {}, fit: {}, seen: 0, moved: 0 });

// Each route's own stops as [metres along, stop id], and the terminal every route starts from.
function own(net) {
  if (net.own) return net.own;
  const served = {};
  for (const r of net.routes) for (const id of new Set(r.patterns.flatMap(p => p.map(s => s[0])))) (served[id] ??= []).push(r.id);
  net.own = {};
  for (const r of net.routes) {
    const seen = new Map();
    for (const p of r.patterns) for (const [id, d] of p) if (served[id].length === 1 && !seen.has(id)) seen.set(id, d);
    net.own[r.id] = [...seen].map(([id, d]) => [d, id]).sort((a, b) => a[0] - b[0]);
  }
  const a = net.routes[0].shape[0];
  net.terminal = { lat: a[0], lon: a[1] };
  return net.own;
}
export const atTerminal = (net, p) => { own(net); return metres(net, p, net.terminal) <= TUNE.TERMINAL_M; };

// Feed one position report {t, lat, lon, h, s} (ms, degrees, compass degrees or null, m/s or null).
// ctx: forced = the route dispatch has set for this bus today; held = routes another bus is running right now;
// lt = the local service day and time, for the timetable check.
export function step(net, st, ping, ctx = {}) {
  st ??= fresh();
  st.f ??= {}; // state saved by an earlier version of this file has no stop counts: it simply starts counting
  if (ping.t <= st.seen) return st;
  Object.assign(st, { seen: ping.t, lat: ping.lat, lon: ping.lon, h: ping.h ?? null, s: ping.s ?? null });
  const last = st.trail.at(-1), p = { t: ping.t, lat: ping.lat, lon: ping.lon, h: ping.h ?? null, s: ping.s ?? null };
  const moved = !last || metres(net, last, ping) >= TUNE.MOVE_M;
  if (moved) { st.trail.push(p); st.moved = ping.t; }
  const home = atTerminal(net, ping);
  if (ping.t - st.moved > TUNE.PARKED) {
    // Standing longer than a layover. A bus waiting at the terminal for a later trip today (the drivers' lunch
    // break) keeps its route; any other parked bus starts afresh.
    const keep = st.route && st.by !== 'override' && home && tripsLeft(net, st.route, ctx.lt);
    Object.assign(st, { trail: [], f: {}, fit: {}, off: 0 });
    if (!keep) { Object.assign(st, { route: null, d: null, by: null }); return st; }
  }
  st.trail = st.trail.filter(q => ping.t - q.t <= TUNE.TRAIL_AGE).slice(-TUNE.TRAIL);
  // A bus that had a route, went to the facility and is back at the terminal with trips still to run takes
  // the same route up again, unless another bus is on it. If it leaves on a different route it is moved to that one.
  if (st.was && home) {
    if (!st.route && st.was.day === ctx.lt?.day && !ctx.held?.has(st.was.route) && tripsLeft(net, st.was.route, ctx.lt)) { st.route = st.was.route; st.by = 'kept'; st.onAt = ping.t; st.d = null; }
    delete st.was;
  }
  if (st.dead && (home || ping.t - st.dead > TUNE.DEADHEAD)) delete st.dead; // it has reached the terminal: its service starts here
  if (moved) for (const r of net.routes) advance(net, r, st.f[r.id] ??= { H: null, run: 0, off: 0, t: 0 }, p);
  if (home) for (const r of net.routes) { // every stop count starts at the terminal
    const f = st.f[r.id] ??= { H: null, run: 0, off: 0, t: 0 };
    if (!f.H) { const C = project(net, r, ping.lat, ping.lon, TUNE.TERMINAL_M).filter(c => c.d < 2 * TUNE.TERMINAL_M); if (C.length) { f.H = C.map(begin); f.run = 1; f.off = 0; f.t = ping.t; } }
    for (const h of f.H || []) { h.d0 = h.d; h.go = 0; h.term = 1; }
  }
  if (moved || home || ctx.forced || st.by === 'override') decide(net, st, ctx);
  // Between duties. A bus at the terminal with no trip due (lunch, or the end of the day) is resting, and stays so
  // while it drives to the facility and back, even where that drive runs along its own route. It is back on duty
  // when it is at the terminal with a trip due, or once it has passed three of its stops again.
  if (!st.route || st.by === 'override') delete st.rest;
  else if (home && ctx.lt) { if (tripsOn(net, net.byId[st.route], ctx.lt).some(t => t[0] >= ctx.lt.sec - 600 && t[0] <= ctx.lt.sec + TUNE.DUE)) delete st.rest; else st.rest = 1; }
  else if (st.rest && st.off === 0 && (st.fit[st.route]?.[2] ?? 0) >= TUNE.STOPS) delete st.rest;
  return st;
}

// Moves one route's follower on by one position. H holds the places on the route's line the bus could be,
// each with where its unbroken run along the line began (d0), how far it has come since (go), and whether
// the run began at the terminal.
function advance(net, r, f, p) {
  // After a long silence (the trackers go quiet while a bus stands) the run carries on only if the bus is about
  // where it was. Otherwise it travelled unseen, and stops it was not seen to pass are not counted.
  const stale = !!f.H && p.t - f.t > TUNE.GAP;
  let C = project(net, r, p.lat, p.lon, TUNE.OFF_M);
  if (p.h != null && p.s != null && p.s >= 3) C = C.filter(c => angleGap(c.brg, p.h) <= 100);
  const L = r.length, next = [];
  if (f.H && C.length) {
    const reach = stale ? 400 : Math.max(500, 30 * (p.t - f.t) / 1000 + 300); // farthest a bus could have got since the last fit
    for (const c of C) {
      let from = null, gain = 0;
      for (const h of f.H) {
        const fwd = ((c.d - h.d) % L + L) % L, g = fwd <= reach ? fwd : fwd >= L - 60 ? fwd - L : null; // a little backwards is GPS error
        if (g != null && (!from || g < gain)) { from = h; gain = g; }
      }
      if (from) next.push({ d: c.d, off: c.off, d0: from.d0, go: from.go + gain, term: from.term });
    }
  }
  if (next.length) { f.H = next; f.run++; f.off = 0; f.t = p.t; }
  else if ((!f.H || stale) && C.length) { f.H = C.map(begin); f.run = 1; f.off = 0; f.t = p.t; }
  else { f.off++; if (f.off >= 2 || stale) { f.H = C.length ? C.map(begin) : null; f.run = C.length ? 1 : 0; if (C.length) { f.off = 0; f.t = p.t; } } }
}
const begin = c => ({ d: c.d, off: c.off, d0: c.d, go: 0, term: 0 });

// How many of the route's own stops the bus has passed, in order, on its present run along the line.
function passed(net, r, f) {
  if (!f.H?.length) return 0;
  const stops = own(net)[r.id], L = r.length;
  return Math.min(...f.H.map(h => stops.filter(([d]) => { const rel = ((d - h.d0) % L + L) % L; return rel > TUNE.PAST_M && rel + TUNE.PAST_M <= Math.min(h.go, L - 1); }).length));
}

function decide(net, st, { forced, held, lt } = {}) {
  const res = {};
  for (const r of net.routes) { const f = st.f[r.id] ?? { H: null, run: 0, off: 9 }; res[r.id] = { f, r, stops: passed(net, r, f), term: !!f.H?.length && f.H.every(h => h.term) }; }
  st.fit = Object.fromEntries(Object.entries(res).map(([id, v]) => [id, [v.f.run, v.f.off, v.stops, v.term ? 1 : 0]]));
  if (forced && res[forced]) { st.route = forced; st.by = 'override'; st.onAt ??= st.seen; }
  else {
    if (st.by === 'override') { st.route = null; st.by = null; }
    // a rival route stays in the count until the bus has missed it twice running, so one stray position decides nothing
    const alive = Object.entries(res).filter(([, v]) => v.f.off <= 1).sort((a, b) => b[1].stops - a[1].stops);
    const top = alive[0], second = alive[1]?.[1].stops ?? 0;
    let won = top && top[1].f.off === 0 && top[1].stops >= TUNE.STOPS && top[1].stops - second >= TUNE.LEAD && !st.dead && !held?.has(top[0]) ? top[0] : null;
    if (won && !running(net, res[won], lt, st.route ? false : true)) won = null;
    const mine = st.route && res[st.route];
    if (!st.route) { if (won) { st.route = won; st.by = 'stops'; st.onAt = st.seen; st.took = st.seen; } }
    else if (mine.f.off === 0) st.onAt = st.seen;
    // a bus that has its route leaves it for another only from the terminal: a detour can pass another route's stops
    else if (mine.f.off >= 2 && won && won !== st.route && res[won].term) { st.route = won; st.by = 'stops'; st.onAt = st.seen; st.took = st.seen; st.d = null; }
    else if (st.seen - (st.onAt ?? st.seen) > TUNE.DETOUR) { st.route = null; st.by = null; st.d = null; }
    if (st.route && st.onAt == null) st.onAt = st.seen;
  }
  place(net, st, st.route && res[st.route].f);
}

// Is this route in service now, with the bus where a bus could be? A run that began at the terminal only needs the
// route to be running today. One picked up part of the way round (the display was switched on mid-trip) must
// also be near the timetable, which a bus driving in from the facility before the first trip never is.
function running(net, v, lt, midway) {
  if (!lt) return true;
  const trips = tripsOn(net, v.r, lt);
  if (!trips.length || lt.sec < trips[0][0] - 300 || lt.sec > trips.at(-1)[0] + trips.at(-1)[1].at(-1)[2] + 1800) return false;
  if (v.term || !midway) return true;
  const at = v.f.H.reduce((a, b) => (a.off <= b.off ? a : b)), trip = tripFor(net, v.r, at.d, lt);
  return trip?.delay != null && Math.abs(trip.delay) <= TUNE.NEAR;
}

// Has this route a trip still to leave the terminal today?
function tripsLeft(net, id, lt) { return !!lt && !!net.byId[id] && tripsOn(net, net.byId[id], lt).some(t => t[0] >= lt.sec - 600); }

function place(net, st, f) { // where along its route the bus is
  if (!f) { st.d = null; st.off = 0; return; }
  st.off = f.off;
  if (f.off !== 0 || !f.H?.length) return;
  const L = net.byId[st.route].length, ahead = c => ((c.d - st.d) % L + L) % L;
  st.d = (st.d == null ? f.H.reduce((a, b) => (a.off <= b.off ? a : b)) : f.H.reduce((a, b) => (ahead(a) <= ahead(b) ? a : b))).d;
  st.onD = st.d;
}
