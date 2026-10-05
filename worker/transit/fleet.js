// Turns raw tracker reports into the buses the display shows: in-service buses only, each with its
// route, its place along the route and how late it is.
import { step, settle, TUNE } from './matcher.js';
import { pointAt, tripFor, localTime, metres } from './geo.js';

export const LIVE = {
  STALE: 300e3,              // a bus not heard from for this long is treated as offline
  IDLE_HIDE: 5 * 60e3,       // an unmatched bus standing this long is not in service
  YARD: [30.2300, -93.1543], // the transit facility, where buses park: anything within YARD_M of it is not in service
  YARD_M: 300,
  PLAUSIBLE: 10 * 60,        // a newly matched bus must be this close to the timetable (seconds), or
  PROVEN: 12,                // have followed the route this many positions in a row, before it is shown on the route
};

// reports: [{id, t, lat, lon, h, s, power}]. states: {bus id: matcher state}, changed in place.
export function update(net, states, reports, nowMs, overrides = {}) {
  const yard = { lat: LIVE.YARD[0], lon: LIVE.YARD[1] };
  const online = [];
  for (let r of reports) {
    if (r.power === false || !Number.isFinite(r.lat) || !Number.isFinite(r.lon) || nowMs - r.t > LIVE.STALE || nowMs - r.t < -120e3) continue;
    if (metres(net, r, yard) <= LIVE.YARD_M) { delete states[r.id]; continue; } // parked or warming up at the facility
    const st = states[r.id];
    // The tracker stamps times to the minute, so two positions can carry the same time. A changed position is news.
    if (st && r.t <= st.seen && metres(net, r, st) >= TUNE.MOVE_M) r = { ...r, t: Math.max(st.seen + 1000, nowMs) };
    states[r.id] = step(net, st, r, overrides[r.id]);
    online.push(r);
  }
  settle(net, states, online.map(r => r.id));
  const lt = localTime(nowMs, net.feed.timezone), vehicles = [];
  for (const { id } of online) {
    const st = states[id];
    if (!st.route) { // not matched yet: show it only while it is actually going somewhere
      if (nowMs - st.moved <= LIVE.IDLE_HIDE && st.trail.length >= 2) vehicles.push({ id, route: null, lat: st.lat, lon: st.lon, h: st.h, s: st.s, age: Math.round((nowMs - st.seen) / 1000), state: 'identifying' });
      continue;
    }
    const r = net.byId[st.route], on = st.off < 2 && st.d != null;
    const trip = on ? tripFor(net, r, st.d, lt) : null;
    if (trip?.state === 'done' && nowMs - st.moved > LIVE.IDLE_HIDE) continue; // finished for the day and parked
    // A bus driving to or from the facility can follow a route's line for a few blocks. It only counts as
    // running the route once it is near that route's timetable or has followed it for a good distance.
    if (st.proven !== st.route && on && ((trip?.delay != null && Math.abs(trip.delay) <= LIVE.PLAUSIBLE) || st.by !== 'path' || (st.fit[st.route]?.[0] ?? 0) >= LIVE.PROVEN)) st.proven = st.route;
    if (st.proven !== st.route) { vehicles.push({ id, route: null, lat: st.lat, lon: st.lon, h: st.h, s: st.s, age: Math.round((nowMs - st.seen) / 1000), state: 'identifying' }); continue; }
    const snap = on ? pointAt(r, st.d) : null;
    vehicles.push({
      id, route: st.route, lat: snap ? snap[0] : st.lat, lon: snap ? snap[1] : st.lon, h: st.h ?? (snap ? snap[2] : null), s: st.s,
      age: Math.round((nowMs - st.seen) / 1000), d: on ? Math.round(st.d) : null, trip: trip?.start ?? null, delay: trip?.delay == null ? null : Math.round(trip.delay),
      state: !on ? 'off-route' : trip?.state === 'layover' ? 'layover' : trip?.state === 'done' ? 'done' : 'on', by: st.by,
    });
  }
  for (const v of vehicles) { v.lat = +v.lat.toFixed(6); v.lon = +v.lon.toFixed(6); v.h = v.h == null ? null : Math.round(v.h); v.s = v.s == null ? null : +v.s.toFixed(1); }
  // forget buses not heard from in a long while, so the saved state stays small
  for (const id in states) if (nowMs - states[id].seen > 3 * 3600e3) delete states[id];
  return { vehicles, counts: { reporting: reports.length, online: online.length, shown: vehicles.length } };
}
