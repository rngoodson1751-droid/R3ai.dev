// Geometry and timetable helpers shared by the route matcher, the simulator and the live service.
// Distances are metres along a route's line; times are seconds after local midnight.
const K = Math.PI / 180;

// Adds flat x/y coordinates and line segments to each route. Call once on network.json.
export function prepare(net) {
  if (net.byId) return net;
  const lat0 = net.routes[0].shape[0][0];
  net.kx = 111320 * Math.cos(lat0 * K); net.ky = 110950; net.byId = {};
  for (const r of net.routes) {
    r.segs = [];
    for (let i = 1; i < r.shape.length; i++) {
      const a = r.shape[i - 1], b = r.shape[i];
      const ax = a[1] * net.kx, ay = a[0] * net.ky, bx = b[1] * net.kx, by = b[0] * net.ky;
      if (b[2] - a[2] <= 0) continue;
      r.segs.push({ i, ax, ay, bx, by, d0: a[2], len: b[2] - a[2], brg: (Math.atan2(bx - ax, by - ay) / K + 360) % 360 });
    }
    net.byId[r.id] = r;
  }
  return net;
}

export function metres(net, a, b) { return Math.hypot((a.lon - b.lon) * net.kx, (a.lat - b.lat) * net.ky); }
export const angleGap = (a, b) => { const g = Math.abs(a - b) % 360; return g > 180 ? 360 - g : g; };

// Every place on a route's line within maxOff metres of a point. A street the route uses twice
// (out and back) gives two answers, which the matcher sorts out from the direction of travel.
export function project(net, r, lat, lon, maxOff) {
  const px = lon * net.kx, py = lat * net.ky, out = [];
  let best = null, lastSeg = -9;
  for (let n = 0; n < r.segs.length; n++) {
    const s = r.segs[n], dx = s.bx - s.ax, dy = s.by - s.ay, L2 = dx * dx + dy * dy;
    const f = L2 ? Math.max(0, Math.min(1, ((px - s.ax) * dx + (py - s.ay) * dy) / L2)) : 0;
    const off = Math.hypot(px - s.ax - f * dx, py - s.ay - f * dy);
    if (off > maxOff) continue;
    if (n !== lastSeg + 1 && best) { out.push(best); best = null; }
    if (!best || off < best.off) best = { d: s.d0 + f * s.len, off, brg: s.brg };
    lastSeg = n;
  }
  if (best) out.push(best);
  return out;
}

// Where a bus that has left its route will most likely come back to it: the nearest place on the line within
// `ahead` metres past the last place it was on it (or anywhere on the line when that is not known).
export function rejoin(net, r, lat, lon, fromD, ahead = 6000) {
  const px = lon * net.kx, py = lat * net.ky;
  let best = null;
  for (const s of r.segs) {
    const dx = s.bx - s.ax, dy = s.by - s.ay, L2 = dx * dx + dy * dy;
    const f = L2 ? Math.max(0, Math.min(1, ((px - s.ax) * dx + (py - s.ay) * dy) / L2)) : 0;
    const d = s.d0 + f * s.len, off = Math.hypot(px - s.ax - f * dx, py - s.ay - f * dy);
    if (fromD != null && ((d - fromD) % r.length + r.length) % r.length > ahead) continue;
    if (!best || off < best.off) best = { d, off };
  }
  return best;
}

// The point d metres along a route: [lat, lon, compass bearing].
export function pointAt(r, d) {
  d = Math.max(0, Math.min(r.shape.at(-1)[2], d));
  let lo = 0, hi = r.shape.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (r.shape[mid][2] <= d) lo = mid; else hi = mid; }
  const a = r.shape[lo], b = r.shape[hi], f = b[2] > a[2] ? (d - a[2]) / (b[2] - a[2]) : 0;
  const brg = (Math.atan2((b[1] - a[1]) * Math.cos(a[0] * K), b[0] - a[0]) / K + 360) % 360;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, brg];
}

// A stop pattern is [[stop id, metres along, seconds after the trip starts], ...].
export function offsetAt(pattern, d) { // when the timetable has the bus d metres along
  if (d <= pattern[0][1]) return pattern[0][2];
  for (let i = 1; i < pattern.length; i++) {
    const a = pattern[i - 1], b = pattern[i];
    if (d <= b[1]) return b[1] > a[1] ? a[2] + (b[2] - a[2]) * (d - a[1]) / (b[1] - a[1]) : b[2];
  }
  return pattern.at(-1)[2];
}
export function distAt(pattern, off) { // how far along the timetable has the bus after off seconds
  if (off <= 0) return pattern[0][1];
  for (let i = 1; i < pattern.length; i++) {
    const a = pattern[i - 1], b = pattern[i];
    if (off <= b[2]) return b[2] > a[2] ? a[1] + (b[1] - a[1]) * (off - a[2]) / (b[2] - a[2]) : b[1];
  }
  return pattern.at(-1)[1];
}

// The service day and clock time in the agency's own time zone.
const fmt = {};
export function localTime(ms, tz) {
  fmt[tz] ??= new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(fmt[tz].formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return { day: p.year + p.month + p.day, dow: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday), sec: +p.hour * 3600 + +p.minute * 60 + +p.second };
}
export function runsOn(net, serviceId, lt) {
  const s = net.services[serviceId];
  if (!s) return false;
  if (s.added.includes(lt.day)) return true;
  if (s.removed.includes(lt.day)) return false;
  return !!s.days[lt.dow] && lt.day >= s.start && lt.day <= s.end;
}
// Today's trips on a route: [[start second, pattern], ...] in time order.
export function tripsOn(net, r, lt) {
  return r.trips.filter(t => runsOn(net, t[2], lt)).map(t => [t[0], r.patterns[t[1]]]);
}

// Which trip a bus d metres along its route is running, and how late it is (seconds, negative = early).
export function tripFor(net, r, d, lt) {
  const trips = tripsOn(net, r, lt);
  if (!trips.length) return null;
  const atTerminal = d < 80 || d > r.length - 80;
  if (atTerminal) { // waiting to leave, or just arrived: it belongs to the next departure
    const next = trips.find(t => t[0] >= lt.sec - 600);
    if (!next) return { start: null, delay: null, state: 'done' };
    return { start: next[0], delay: Math.max(0, lt.sec - next[0]), state: 'layover' };
  }
  let best = null;
  for (const [start, pattern] of trips) {
    const delay = lt.sec - (start + offsetAt(pattern, d));
    if (!best || Math.abs(delay) < Math.abs(best.delay)) best = { start, delay, state: 'on' };
  }
  return Math.abs(best.delay) > 2400 ? { start: null, delay: null, state: 'on' } : best;
}
