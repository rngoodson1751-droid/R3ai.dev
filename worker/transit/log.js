// Stop passage log: when each bus passed each stop, kept for the digital twin's run-time calibration
// and for on-time reports. Written by liveFleet (fleet.js output, every refresh) into transit_passages.
//
// A passage is recorded when a bus on a route, matched to a trip, moves from before a stop to past it
// between two refreshes. The time is interpolated by distance between the two positions' report times,
// so a bus reported every 30 s is placed within a few seconds. Nothing is recorded for a bus that is
// grey, on a detour, at layover or jumped more than JUMP_M (a gap in reports: the stops in between are
// not invented). Only route, trip, stop and time are kept: no position trail, nothing about riders.
import { localTime, tripsOn } from './geo.js';

export const LOG = { JUMP_M: 3000 };

// prev, next: fleet outputs ({vehicles}) from two refreshes; prevAt, nowAt: when each was made (ms).
export function passages(net, prev, next, prevAt, nowAt) {
  if (!prev?.vehicles || !next?.vehicles || !(nowAt > prevAt)) return [];
  const before = Object.fromEntries(prev.vehicles.map(v => [v.id, v]));
  const lt = localTime(nowAt, net.feed.timezone), out = [];
  for (const v of next.vehicles) {
    const p = before[v.id];
    if (!p || v.state !== 'on' || p.state !== 'on' || v.route !== p.route || v.trip == null || v.trip !== p.trip) continue;
    if (v.d == null || p.d == null || !(v.d > p.d) || v.d - p.d > LOG.JUMP_M) continue;
    const r = net.byId[v.route];
    const trip = tripsOn(net, r, lt).find(t => t[0] === v.trip);
    if (!r || !trip) continue;
    const t1 = prevAt - (p.age ?? 0) * 1000, t2 = nowAt - (v.age ?? 0) * 1000;
    if (!(t2 > t1)) continue;
    trip[1].forEach(([stop, dist, offset], seq) => {
      if (seq === 0 || !(dist > p.d && dist <= v.d)) return;
      const at = Math.round(t1 + (t2 - t1) * (dist - p.d) / (v.d - p.d));
      const sched = v.trip + offset, sec = localTime(at, net.feed.timezone).sec;
      out.push({ day: lt.day, bus: String(v.id), route: v.route, trip: v.trip, seq, stop, dist: Math.round(dist), sched, at, delay: Math.round(sec - sched), src: v.src || null });
    });
  }
  return out;
}

export async function save(env, rows) {
  if (!rows.length) return;
  const sql = 'INSERT OR IGNORE INTO transit_passages (day, bus, route, trip, seq, stop, dist_m, sched_s, at_ms, delay_s, src) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)';
  await env.DB.batch(rows.map(p => env.DB.prepare(sql).bind(p.day, p.bus, p.route, p.trip, p.seq, p.stop, p.dist, p.sched, p.at, p.delay, p.src)));
}
