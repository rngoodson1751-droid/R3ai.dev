// Checks the route matcher against a simulated service day.   node tools/transit-test.mjs
// Each scenario replays tracker reports (bus number and position only) and compares the route the
// matcher assigns with the route the simulated bus is really running.
import { readFileSync } from 'node:fs';
import { prepare, localTime, tripsOn } from '../worker/transit/geo.js';
import { pointAt, distAt, tripsOn as tripsFor } from '../worker/transit/geo.js';
import { simReports } from '../worker/transit/sim.js';
import { update, mergeReports } from '../worker/transit/fleet.js';

const net = prepare(JSON.parse(readFileSync(new URL('../worker/transit/network.json', import.meta.url))));
const truth = Object.fromEntries(net.routes.map((r, i) => [String(901 + i), r.id]));
const DAY = Date.UTC(2026, 9, 5, 5, 0, 0); // Monday 5 October 2026, midnight in Lake Charles (UTC-5)
const at = (h, m = 0) => DAY + (h * 60 + m) * 60e3;
let failed = 0;

function run(name, { from, to, opt = {}, mutate, expect }) {
  const states = {}; let wrong = 0, shown = 0, ghost = 0, identified = {}, unknownSecs = 0, samples = 0, detour = 0, detourBlind = 0, greyLate = 0, back = {};
  for (let t = from; t <= to; t += 10e3) {
    let reports = simReports(net, t, opt);
    if (mutate) reports = mutate(reports, t);
    const { vehicles } = update(net, states, reports, t);
    for (const v of vehicles) {
      samples++;
      const real = (opt.truth ?? truth)[v.id];
      if (!real) { ghost++; continue; }
      if (v.route == null) { unknownSecs += 10; if (opt.greyFrom && t >= opt.greyFrom) greyLate++; }
      else if (v.route !== real) wrong++;
      else { shown++; identified[v.id] ??= t; if (opt.greyFrom && t >= opt.greyFrom) back[v.id] ??= t; if (v.state === 'detour') { detour++; if (v.d == null || v.trip == null || v.delay == null) detourBlind++; } }
    }
  }
  const lt = localTime(from, net.feed.timezone), first = tripsOn(net, net.routes[0], lt)[0]?.[0];
  const idAfter = Object.entries(identified).map(([id, t]) => `${id}:${Math.max(0, Math.round((localTime(t, net.feed.timezone).sec - Math.max(first, lt.sec)) / 60 * 10) / 10)}m`).join(' ');
  const ok = expect({ wrong, ghost, identified, shown, unknownSecs, detour, detourBlind, greyLate, back });
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}\n      wrong-route samples ${wrong}, filtered-unit leaks ${ghost}, matched samples ${shown}, bus-minutes shown as "identifying" ${(unknownSecs / 60).toFixed(1)}, detour samples ${detour}${opt.greyFrom ? `, grey after lunch ${greyLate}` : ''}\n      minutes after departure (or after start of watching) until matched: ${idAfter || 'none'}`);
}

const all5 = r => Object.keys(r.identified).length === 5;
run('Full service day, reports every 30 s, 8 m GPS error', { from: at(5, 20), to: at(17, 50), expect: r => r.wrong === 0 && r.ghost === 0 && all5(r) });
run('Reports every 60 s, 15 m GPS error', { from: at(5, 20), to: at(12, 0), opt: { interval: 60e3, noise: 15 }, expect: r => r.wrong === 0 && r.ghost === 0 && all5(r) });
run('Reports every 120 s, 20 m GPS error', { from: at(5, 20), to: at(12, 0), opt: { interval: 120e3, noise: 20 }, expect: r => r.wrong === 0 && r.ghost === 0 && all5(r) });
run('Display switched on mid-route at 10:07', { from: at(10, 7), to: at(11, 30), expect: r => r.wrong === 0 && all5(r) });
run('Every bus running 9 minutes late', { from: at(5, 20), to: at(10, 0), opt: { drift: [540, 540, 540, 540, 540] }, expect: r => r.wrong === 0 && all5(r) });
// Bus 902 breaks down at 10:20; bus 950 takes over its route from the terminal at the 10:45 departure.
run('Bus swap: 950 replaces 902 on Route 2 at 10:45', {
  from: at(5, 20), to: at(12, 30), opt: { truth: { ...truth, 950: truth['902'] } },
  mutate: (reports, t) => reports.map(r => r.id !== '902' ? r : t < at(10, 20) ? r : t < at(10, 40) ? { ...r, power: false } : { ...r, id: '950' }),
  expect: r => r.wrong === 0 && r.identified['950'] != null,
});
// A stray position 300 m off the line now and then must not change an assignment.
run('One wild GPS position every 10 minutes', {
  from: at(5, 20), to: at(11, 0),
  mutate: reports => reports.map(r => (r.power && Math.floor(r.t / 30e3) % 20 === 7 && r.s > 1 ? { ...r, lat: r.lat + 0.003 } : r)),
  expect: r => r.wrong === 0 && all5(r),
});
// Bus 903 leaves its route for three minutes (a detour around a closed street) and comes back.
// It must stay on Route 3, be flagged as detouring, and still carry a next stop and a time.
run('Three-minute detour 220 m off the route', {
  from: at(5, 20), to: at(11, 0),
  mutate: (reports, t) => reports.map(r => (r.id === '903' && t >= at(9, 10) && t < at(9, 13) ? { ...r, lat: r.lat + 0.002 } : r)),
  expect: r => r.wrong === 0 && all5(r) && r.detour >= 8 && r.detour <= 18 && r.detourBlind === 0 && r.unknownSecs < 2100, // the alert waits a minute, to be sure
});
// Two trackers. The first one's unit on bus 903 died days ago (as Zonar's did on Bus 42); the second still hears it,
// and its unit on bus 905 is the dead one. Every bus should still be matched, each from whichever tracker is alive.
run('Two trackers, one dead unit on each', {
  from: at(5, 20), to: at(11, 0),
  mutate: (reports, t) => mergeReports([
    reports.map(r => ({ ...r, src: 'zonar', t: r.id === '903' ? t - 9 * 86400e3 : Math.floor(r.t / 60e3) * 60e3 })), // stamped to the minute, like Zonar
    reports.map(r => ({ ...r, src: 'geotab', t: r.id === '905' ? t - 3 * 86400e3 : r.t })),
  ]),
  expect: r => r.wrong === 0 && r.ghost === 0 && all5(r),
});
// Zonar goes quiet while a bus stands still: no new report until it moves again. Buses waiting out their
// layover at the terminal must stay on the map, so nearly every sample should still show all five.
const lastSaid = {};
run('Tracker silent while a bus stands at the terminal', {
  from: at(5, 20), to: at(11, 0),
  mutate: reports => reports.map(r => { const was = lastSaid[r.id]; if (was && r.power && was.power && r.lat === was.lat && r.lon === was.lon) return was; if (was && r.power && was.power && !(r.s > 0.5) && !(was.s > 0.5)) return was; lastSaid[r.id] = r; return r; }),
  expect: r => r.wrong === 0 && all5(r) && r.shown >= 9200,
});
// A long detour that runs along another route's street: bus 901 (Route 1) is moved onto Route 4's line for
// twelve minutes. It must be shown as Route 1 on a detour the whole time, never as a second Route 4 bus.
run('Twelve-minute detour along another route', {
  from: at(5, 20), to: at(11, 0),
  mutate: (reports, t) => reports.map(r => {
    if (r.id !== '901' || t < at(9, 5) || t >= at(9, 17)) return r;
    const r4 = net.byId['4'], p = pointAt(r4, 6000 + (t - at(9, 5)) / 1000 * 7);
    return { ...r, lat: p[0], lon: p[1], h: p[2], s: 7 };
  }),
  expect: r => r.wrong === 0 && all5(r) && r.detour >= 40 && r.detourBlind === 0,
});
// Saturday: nothing in the timetable, so nothing should be shown.
run('Saturday, no service', { from: at(8, 0) + 5 * 86400e3, to: at(9, 0) + 5 * 86400e3, expect: r => r.shown === 0 && r.wrong === 0 && r.ghost === 0 });


// ---- The lunch break. No trip leaves at 12:45, so every bus stands from about 12:30 until 1:45. Each must come
// back on the route it had, at once, without waiting to pass three stops again.
const lunch = { greyFrom: at(13, 40) }, backAtOnce = r => r.wrong === 0 && r.greyLate === 0 && Object.keys(r.back).length === 5 && Object.values(r.back).every(t => t <= at(13, 46));
run('Lunch break: buses wait at the terminal, switched on', { from: at(5, 20), to: at(15, 0), opt: lunch, expect: backAtOnce });
run('Lunch break: buses wait at the terminal, switched off', {
  from: at(5, 20), to: at(15, 0), opt: lunch,
  mutate: (reports, t) => reports.map(r => (truth[r.id] && t >= at(12, 35) && t < at(13, 38) ? { ...r, power: false } : r)),
  expect: backAtOnce,
});
// The tracker says nothing while a bus stands (Zonar): every bus must stay on the page through the break,
// and be on its route again the moment it is heard leaving.
{
  const said = {};
  run('Lunch break: tracker silent while the buses wait', {
    from: at(5, 20), to: at(15, 0), opt: { greyFrom: at(13, 15) },
    mutate: reports => reports.map(r => { const was = said[r.id]; if (was && r.power && was.power && !(r.s > 0.5) && !(was.s > 0.5)) return was; said[r.id] = r; return r; }),
    expect: r => r.wrong === 0 && r.greyLate === 0 && Object.keys(r.back).length === 5 && Object.values(r.back).every(t => t <= at(13, 16)),
  });
}
// The drivers take the buses somewhere else for lunch, off every route, park for 50 minutes and come back.
run('Lunch break: buses are driven off for lunch and return', {
  from: at(5, 20), to: at(15, 0), opt: lunch,
  mutate: (reports, t) => reports.map((r, i) => {
    if (!truth[r.id] || t < at(12, 34) || t >= at(13, 36)) return r;
    const k = Math.min(1, (t - at(12, 34)) / 240e3, (at(13, 36) - t) / 240e3), home = pointAt(net.routes[0], 0); // four minutes each way
    return { ...r, lat: home[0] + k * 0.0052, lon: home[1] - k * (0.0085 + i * 0.0004), h: null, s: k < 1 ? 6 : 0, power: true };
  }),
  expect: r => backAtOnce(r) && r.detour === 0,
});
// They drive back to the facility for lunch along Broad Street (bus 44's real path, reversed) and return the same way.
{
  const fx = JSON.parse(readFileSync(new URL('./fixtures/pullout-2026-10-06.json', import.meta.url)));
  const path = fx.buses['44'].filter(p => p[0] <= 570), last = path.at(-1)[0];
  const drive = (r, sec, rev) => { const q = rev ? last - sec : sec, p = path.findLast(p => p[0] <= q) ?? path[0]; return { ...r, lat: p[1], lon: p[2], h: p[3] == null ? null : (p[3] + (rev ? 180 : 0)) % 360, s: p[4], power: true }; };
  run('Lunch break: buses go back to the facility and return', {
    from: at(5, 20), to: at(15, 0), opt: lunch,
    mutate: (reports, t) => reports.map((r, i) => {
      if (!truth[r.id] || t < at(12, 33) || t >= at(13, 43)) return r;
      const out = (t - at(12, 33) - i * 30e3) / 1000, home = (t - at(13, 28) - i * 30e3) / 1000;
      if (out < 0) return r;
      if (out <= last) return drive(r, out, true);
      if (home < 0) return { ...r, lat: 30.2301, lon: -93.1543, h: null, s: 0, power: true }; // parked in the lot
      return drive(r, Math.min(home, last), false);
    }),
    expect: r => backAtOnce(r) && r.detour === 0,
  });
}

// ---- The morning pull-out. Before this was fixed, buses were given routes from their drive in from the
// facility along Broad Street (which two routes also use), and then shown as detouring when they left the
// terminal on their real routes.

// 1. The real thing: every position the trackers reported from 5:39 to 6:06 on Tuesday 6 October 2026.
// Bus 44 drove in, waited and left on Route 3. Bus 40 drove in and stayed parked at the terminal.
// Buses 42, 43, 46 and 47 were out on Routes 4, 2, 5 and 1.
{
  const fx = JSON.parse(readFileSync(new URL('./fixtures/pullout-2026-10-06.json', import.meta.url)));
  const real = { 42: '4', 43: '2', 46: '5', 47: '1', 44: '3' }, states = {}, got = {}, bad = [];
  const end = fx.t0 + Math.max(...Object.values(fx.buses).map(b => b.at(-1)[0])) * 1000;
  for (let t = fx.t0; t <= end; t += 10e3) {
    const reports = Object.entries(fx.buses).map(([id, pts]) => { const p = pts.findLast(p => fx.t0 + p[0] * 1000 <= t); return p && { id, t: fx.t0 + p[0] * 1000, lat: p[1], lon: p[2], h: p[3], s: p[4], power: true }; }).filter(Boolean);
    const { vehicles } = update(net, states, reports, t), clock = new Date(t - 5 * 3600e3).toISOString().slice(11, 19);
    const routes = vehicles.filter(v => v.route).map(v => v.route);
    if (new Set(routes).size !== routes.length) bad.push(`${clock} two buses on one route`);
    for (const v of vehicles) {
      if (v.state === 'detour') bad.push(`${clock} bus ${v.id} flagged as detouring`);
      if (v.route && v.route !== real[v.id]) bad.push(`${clock} bus ${v.id} shown on Route ${v.route}`);
      if (v.route) got[v.id] ??= clock;
    }
  }
  const ok = !bad.length && ['42', '43', '44', '46', '47'].every(id => got[id]) && !got['40'];
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  Real pull-out of 6 October 2026, replayed\n      given a route at: ${Object.entries(got).map(([id, c]) => `bus ${id} ${c}`).join(', ') || 'none'}${bad.length ? '\n      ' + [...new Set(bad.map(b => b.slice(9)))].join('; ') + ` (${bad.length} samples, first ${bad[0].slice(0, 8)})` : ''}`);
}

// 2. The same drive in, made by all five simulated buses: each follows bus 44's real path from the facility,
// stands at the terminal and leaves on its own route at 5:45. No bus may have a route before it has left the
// terminal, and none may ever be flagged as detouring.
{
  const fx = JSON.parse(readFileSync(new URL('./fixtures/pullout-2026-10-06.json', import.meta.url)));
  const path = fx.buses['44'].filter(p => p[0] <= 570), last = path.at(-1)[0]; // its drive in, ending parked at the terminal
  let early = 0;
  run('Five buses drive in from the facility, then leave on their routes', {
    from: at(5, 20), to: at(8, 0),
    mutate: (reports, t) => reports.map((r, i) => {
      if (!truth[r.id] || t >= at(5, 45)) return r;
      const arrive = at(5, 36) + i * 90e3, sec = (t - arrive) / 1000 + last; // one bus every minute and a half
      if (sec < 0) return { ...r, power: false, lat: 30.2301, lon: -93.1543 };
      const p = path.findLast(p => p[0] <= sec) ?? path[0];
      return { ...r, t: Math.min(t, arrive + (p[0] - last) * 1000), lat: p[1], lon: p[2], h: p[3], s: p[4], power: true };
    }),
    expect: r => r.wrong === 0 && all5(r) && r.detour === 0 && Object.values(r.identified).every(t => t > at(5, 45)),
  });
}

console.log(failed ? `\n${failed} scenario(s) failed` : '\nAll scenarios passed');
process.exit(failed ? 1 : 0);
