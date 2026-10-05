// Stand-in buses for when no vehicle tracker login is set. One made-up bus runs each route on
// today's timetable, drifting a little late or early, and reports the way a real tracker does:
// a bus number, a position with some GPS error, a heading and a speed, every 30 seconds, with no
// route. Three more units are there to be filtered out: one switched off, one that stopped
// reporting, and a spare idling at the terminal. Bus numbers 901 to 908 are not real buses.
import { pointAt, distAt, tripsOn, localTime } from './geo.js';

export const SIM = { interval: 30e3, noise: 8, drift: [0, 200, -70, 400, 30] }; // drift = seconds late by the end of a trip
const rand = (a, b) => { let x = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b | 0, 0xc2b2ae35); x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d); x ^= x >>> 12; return ((x >>> 0) / 4294967296) * 2 - 1; };

function along(net, r, idx, ms, opt) { // metres along the route at a moment, or null when the bus is not out
  const lt = localTime(ms, net.feed.timezone), trips = tripsOn(net, r, lt);
  if (!trips.length || lt.sec < trips[0][0] - 900) return null;
  const drift = (opt.drift ?? SIM.drift)[idx % 5];
  let d = 0, done = true;
  for (const [start, pattern] of trips) {
    const dur = pattern.at(-1)[2], takes = dur + drift, e = lt.sec - start;
    if (e < 0) { done = false; break; }
    if (e <= takes) return distAt(pattern, e * dur / takes);
    d = pattern.at(-1)[1];
  }
  return done && lt.sec > trips.at(-1)[0] + trips.at(-1)[1].at(-1)[2] + 900 ? null : d >= r.length - 1 ? 0 : d;
}

// What the tracker would report at this moment: [{id, t, lat, lon, h, s, power}]
export function simReports(net, nowMs, opt = {}) {
  const every = opt.interval ?? SIM.interval, noise = opt.noise ?? SIM.noise, out = [];
  net.routes.forEach((r, idx) => {
    const t = Math.floor((nowMs - idx * 4000) / every) * every + idx * 4000;
    const id = String(901 + idx), d = along(net, r, idx, t, opt);
    if (d == null) { const p = pointAt(r, 0); out.push({ id, t, lat: p[0], lon: p[1], h: null, s: 0, power: false }); return; }
    const before = along(net, r, idx, t - 10e3, opt) ?? d, p = pointAt(r, d), moving = Math.abs(d - before) > 1;
    const n = moving ? noise : 2;
    out.push({ id, t, lat: p[0] + rand(idx, t / 1000) * n / net.ky, lon: p[1] + rand(idx + 50, t / 1000) * n / net.kx, h: moving ? p[2] : null, s: Math.max(0, d - before) / 10, power: true });
  });
  const home = pointAt(net.routes[0], 0);
  out.push({ id: '906', t: nowMs - 6 * 3600e3, lat: home[0] + 0.0004, lon: home[1] + 0.0003, h: null, s: 0, power: false });           // switched off
  out.push({ id: '907', t: nowMs - 45 * 60e3, lat: home[0] + 0.012, lon: home[1] + 0.004, h: 90, s: 9, power: true });                 // stopped reporting
  out.push({ id: '908', t: Math.floor(nowMs / every) * every, lat: home[0] - 0.0003 + rand(8, nowMs / every) * 2 / net.ky, lon: home[1] + 0.0005, h: null, s: 0, power: true }); // spare, idling
  return out;
}
