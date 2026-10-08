// Turns a GTFS feed (the unzipped folder) into worker/transit/network.json, the one file the
// lobby display and its live service read routes, stops, shapes and the timetable from.
//   node tools/gtfs.mjs path/to/unzipped-gtfs
// Nothing to install. Distances come out in metres, times in seconds after local midnight.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir || !existsSync(join(dir, 'stop_times.txt'))) { console.error('Usage: node tools/gtfs.mjs <folder with the GTFS .txt files>'); process.exit(1); }

function csv(name) {
  const path = join(dir, name);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false; } else cell += c; }
    else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift().map(h => h.trim());
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}
const secs = t => { const [h, m, s] = t.split(':').map(Number); return h * 3600 + m * 60 + (s || 0); };
const MILE = 1609.344;
const metres = (a, b) => { const k = Math.PI / 180, x = (b[1] - a[1]) * k * Math.cos((a[0] + b[0]) / 2 * k), y = (b[0] - a[0]) * k; return Math.hypot(x, y) * 6371000; };

const [agency] = csv('agency.txt'), [feed] = csv('feed_info.txt');
const trips = csv('trips.txt'), stopTimes = csv('stop_times.txt'), shapeRows = csv('shapes.txt');

// shapes: [lat, lon, metres along]. The feed's own distances are kept as a proportion, rescaled to the true length.
const shapes = {};
for (const r of shapeRows) (shapes[r.shape_id] ??= []).push(r);
for (const id in shapes) {
  const pts = shapes[id].sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence).map(r => [+r.shape_pt_lat, +r.shape_pt_lon, r.shape_dist_traveled === '' ? null : +r.shape_dist_traveled]);
  let d = 0; const real = pts.map((p, i) => (d += i ? metres(pts[i - 1], p) : 0));
  shapes[id] = { pts: pts.map((p, i) => [p[0], p[1], Math.round(real[i] * 10) / 10]), feedEnd: pts.at(-1)[2], length: d };
}

const timesByTrip = {};
for (const r of stopTimes) (timesByTrip[r.trip_id] ??= []).push(r);

const services = {};
for (const c of csv('calendar.txt')) services[c.service_id] = { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(d => +c[d]), start: c.start_date, end: c.end_date, added: [], removed: [] };
for (const c of csv('calendar_dates.txt')) (services[c.service_id] ??= { days: [0, 0, 0, 0, 0, 0, 0], start: '0', end: '0', added: [], removed: [] })[c.exception_type === '1' ? 'added' : 'removed'].push(c.date);

const usedStops = new Set(), routes = [];
for (const r of csv('routes.txt')) {
  const mine = trips.filter(t => t.route_id === r.route_id && timesByTrip[t.trip_id]);
  if (!mine.length) continue; // a route with no timetable (paratransit) has nothing to track
  const shapeIds = [...new Set(mine.map(t => t.shape_id))];
  if (shapeIds.length !== 1) throw new Error(`Route ${r.route_id} uses ${shapeIds.length} shapes; this tool expects one loop per route.`);
  const shape = shapes[shapeIds[0]];
  const patterns = [], keys = [], outTrips = [];
  for (const t of mine) {
    const rows = timesByTrip[t.trip_id].sort((a, b) => a.stop_sequence - b.stop_sequence);
    const start = secs(rows[0].departure_time || rows[0].arrival_time);
    // each stop: [stop id, metres along the shape, seconds after the trip starts]
    const stops = rows.map(s => [s.stop_id, Math.round((shape.feedEnd ? +s.shape_dist_traveled / shape.feedEnd * shape.length : +s.shape_dist_traveled * MILE) * 10) / 10, secs(s.arrival_time || s.departure_time) - start]);
    const key = JSON.stringify(stops);
    let p = keys.indexOf(key);
    if (p < 0) { p = keys.push(key) - 1; patterns.push(stops); stops.forEach(s => usedStops.add(s[0])); }
    outTrips.push([start, p, t.service_id]);
  }
  outTrips.sort((a, b) => a[0] - b[0]);
  const flag = (field, yes) => mine.every(t => t[field] === yes);
  const ends = metres(shape.pts[0], shape.pts.at(-1));
  routes.push({
    // "Route 5 Nelson Road" in the feed reads "Route 5 - Nelson Road" here, like the other routes, until the feed itself is corrected
    id: r.route_id, name: (r.route_long_name || r.route_short_name).replace(/^(Route \d+)\s+(?!-)/, '$1 - '),
    short: (r.route_long_name || r.route_short_name).replace(/^Route[\s-]*\d+\s*-?\s*/i, '').trim() || r.route_short_name,
    color: '#' + (r.route_color || '888888').toLowerCase(), text: '#' + (r.route_text_color || 'ffffff').toLowerCase(),
    wheelchair: flag('wheelchair_accessible', '1'), bikes: flag('bikes_allowed', '1'),
    length: Math.round(shape.length), loop: ends < 150, shape: shape.pts, patterns, trips: outTrips,
  });
}

const stops = {};
for (const s of csv('stops.txt')) if (usedStops.has(s.stop_id)) stops[s.stop_id] = [s.stop_name, +s.stop_lat, +s.stop_lon];

// sanity: every stop should sit close to its route at the distance the feed gives
let worst = 0;
for (const r of routes) for (const [id, d] of r.patterns[0]) {
  const i = Math.max(1, r.shape.findIndex(p => p[2] >= d)), a = r.shape[i - 1], b = r.shape[i] ?? a, f = b[2] > a[2] ? (d - a[2]) / (b[2] - a[2]) : 0;
  worst = Math.max(worst, metres([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], stops[id].slice(1)));
}

const out = {
  feed: { agency: agency?.agency_name || '', phone: agency?.agency_phone || '', timezone: agency?.agency_timezone || 'America/Chicago', version: feed?.feed_version || '', start: feed?.feed_start_date || '', end: feed?.feed_end_date || '' },
  services, routes, stops,
};
writeFileSync('worker/transit/network.json', JSON.stringify(out));
console.log(`Wrote worker/transit/network.json: ${routes.length} routes, ${Object.keys(stops).length} stops, ${routes.reduce((n, r) => n + r.trips.length, 0)} trips, feed version ${out.feed.version} (${out.feed.start} to ${out.feed.end}).`);
console.log(`Farthest a stop sits from its place on the route line: ${Math.round(worst)} m.`);
for (const r of routes) console.log(`  ${r.name}: ${(r.length / MILE).toFixed(1)} mi, ${r.patterns[0].length} stops, ${r.trips.length} trips, ${r.loop ? 'loop' : 'ends away from its start'}, wheelchair ${r.wheelchair}, bikes ${r.bikes}`);
