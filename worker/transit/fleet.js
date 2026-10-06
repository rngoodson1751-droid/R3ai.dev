// Turns raw tracker reports into the buses the display shows: in-service buses only, each with its
// route, its place along the route and how late it is.
import { step, fresh, atTerminal, TUNE } from './matcher.js';
import { pointAt, tripFor, localTime, metres, rejoin } from './geo.js';

export const LIVE = {
  STALE: 300e3,              // a moving bus not heard from for this long is treated as offline
  DWELL: 30 * 60e3,          // a bus that last reported standing still, power on, is taken to be standing there this long:
                             // the trackers go quiet while a bus waits at the terminal, and it should not vanish on its layover
  IDLE_HIDE: 5 * 60e3,       // an unmatched bus standing this long is not in service
  YARD: [30.2305, -93.1545], // the middle of the lot at the transit facility, where buses park. Anything within YARD_M of it is
  YARD_M: 180,               // not in service. Kept clear of Broad Street, 300 m south, which Route 3 runs along.
  YARD_NEAR: 600,            // a bus first seen this close to the facility is taken to be driving in from it
  AWAY: 3,                   // a bus with a route is on a detour once it has been off the line for this many positions
  AWAY_MS: 60e3,             // and this long, so a wide turn or a stray GPS position raises no alert
};

// One list from several trackers: for each bus, the report heard most recently wins (a later list wins a tie).
export function mergeReports(lists) {
  const best = {};
  for (const list of lists) for (const r of list) if (!best[r.id] || r.t >= best[r.id].t) best[r.id] = r;
  return Object.values(best);
}

// Is this report recent enough to act on?
export function heard(r, nowMs) {
  const age = nowMs - r.t;
  return r.power !== false && Number.isFinite(r.lat) && Number.isFinite(r.lon) && age > -120e3 && (age <= LIVE.STALE || (age <= LIVE.DWELL && !(r.s > 1)));
}

// reports: [{id, t, lat, lon, h, s, power, src}]. states: {bus id: matcher state}, changed in place.
export function update(net, states, reports, nowMs, overrides = {}) {
  const yard = { lat: LIVE.YARD[0], lon: LIVE.YARD[1] }, lt = localTime(nowMs, net.feed.timezone);
  const online = [], live = reports.filter(r => heard(r, nowMs)), ids = new Set(live.map(r => r.id));
  for (let r of live) {
    const out = metres(net, r, yard);
    if (out <= LIVE.YARD_M) { // parked or warming up at the facility. The route it had today is remembered, for when it comes back from lunch.
      const o = states[r.id], was = o?.route && o.by !== 'override' ? { route: o.route, day: lt.day } : o?.was;
      states[r.id] = { yard: r.t, seen: r.t, ...(was?.day === lt.day ? { was } : {}) };
      continue;
    }
    let st = states[r.id];
    // A bus coming out of the facility is driving to the terminal. Nothing it passes on the way says what route it will run.
    if (!st || st.yard) st = st?.yard || out <= LIVE.YARD_NEAR ? { ...fresh(), dead: r.t, ...(st?.was ? { was: st.was } : {}) } : undefined;
    // The tracker stamps times to the minute, so two positions can carry the same time. A changed position is news.
    if (st && r.t <= st.seen && metres(net, r, st) >= TUNE.MOVE_M) r = { ...r, t: Math.max(st.seen + 1000, nowMs) };
    // One bus per route: a route another bus is on right now is not open to this one. A bus that has stood
    // longer than a layover does not hold its route against one that is out running it.
    const held = new Set(Object.entries(states).filter(([id, o]) => id !== r.id && ids.has(id) && o.route && o.off < 2 && nowMs - o.moved <= TUNE.PARKED).map(([, o]) => o.route));
    const had = st?.route;
    st = states[r.id] = step(net, st, r, { forced: overrides[r.id], held, lt });
    if (r.src) st.src = r.src;
    // It has just been given a route. A bus that had the route before and is no longer on it gives it up.
    if (st.route && st.route !== had) for (const [id, o] of Object.entries(states)) if (id !== r.id && o.route === st.route && o.by !== 'override') { o.route = null; o.by = null; o.d = null; }
    online.push(r);
  }
  const vehicles = [];
  const grey = (id, st) => { if (nowMs - st.moved <= LIVE.IDLE_HIDE && st.trail.length >= 2) vehicles.push({ id, route: null, lat: st.lat, lon: st.lon, h: st.h, s: st.s, age: Math.round((nowMs - st.seen) / 1000), state: 'identifying' }); };
  for (const { id } of online) {
    const st = states[id];
    if (!st.route) { grey(id, st); continue; } // no route yet: show it only while it is actually going somewhere
    const r = net.byId[st.route];
    if (st.rest && !atTerminal(net, st)) { grey(id, st); continue; } // off to lunch or back to the facility: not running its route
    // Off its route. A stray position or a wide turn is not a detour: it has to stay off the line for a while.
    const away = st.off >= LIVE.AWAY && st.seen - (st.onAt ?? st.seen) >= LIVE.AWAY_MS;
    const on = !away && st.d != null;
    const told = st.by === 'override'; // dispatch said so: the bus is shown on that route wherever it is
    if (!on && st.d == null && !told) { grey(id, st); continue; }
    // A bus that left its line at the terminal is not detouring: it is driving back to the facility, or going out on
    // a different route, which it will be given once it has passed that route's stops.
    if (away && !told && (st.onD == null || st.onD < 2 * TUNE.TERMINAL_M || st.onD > r.length - 2 * TUNE.TERMINAL_M)) { grey(id, st); continue; }
    // Nor is one that left the line when no trip could have had it there: after its last trip of the morning or the
    // day it may follow its own route for a few blocks on the way back to the facility.
    if (away && !told && tripFor(net, r, st.d, lt)?.delay == null) { grey(id, st); continue; }
    // On a detour round a closed street: work out where it will come back to the line, so the display can keep
    // showing the next stop it will actually reach and roughly when.
    const back = on ? null : rejoin(net, r, st.lat, st.lon, st.d);
    const trip = on ? tripFor(net, r, st.d, lt) : back ? tripFor(net, r, back.d, lt) : null;
    if (back && trip?.delay != null && trip.state === 'on') trip.delay += back.off / 7; // plus the drive back to the line
    if (trip?.state === 'done' && nowMs - st.moved > LIVE.IDLE_HIDE) continue; // finished for the day and parked
    const snap = on && st.off === 0 ? pointAt(r, st.d) : null;
    vehicles.push({
      id, route: st.route, lat: snap ? snap[0] : st.lat, lon: snap ? snap[1] : st.lon, h: st.h ?? (snap ? snap[2] : null), s: st.s,
      age: Math.round((nowMs - st.seen) / 1000), d: on ? Math.round(st.d) : back ? Math.round(back.d) : null, trip: trip?.start ?? null, delay: trip?.delay == null ? null : Math.round(trip.delay),
      state: !on ? 'detour' : trip?.state === 'layover' ? 'layover' : trip?.state === 'done' ? 'done' : 'on', by: st.by, src: st.src,
    });
  }
  for (const v of vehicles) { v.lat = +v.lat.toFixed(6); v.lon = +v.lon.toFixed(6); v.h = v.h == null ? null : Math.round(v.h); v.s = v.s == null ? null : +v.s.toFixed(1); }
  // forget buses not heard from in a long while, so the saved state stays small
  for (const id in states) if (nowMs - states[id].seen > 3 * 3600e3) delete states[id];
  return { vehicles, counts: { reporting: reports.length, online: online.length, shown: vehicles.length } };
}
