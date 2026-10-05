// Checks the route matcher against a simulated service day.   node tools/transit-test.mjs
// Each scenario replays tracker reports (bus number and position only) and compares the route the
// matcher assigns with the route the simulated bus is really running.
import { readFileSync } from 'node:fs';
import { prepare, localTime, tripsOn } from '../worker/transit/geo.js';
import { simReports } from '../worker/transit/sim.js';
import { update, mergeReports } from '../worker/transit/fleet.js';

const net = prepare(JSON.parse(readFileSync(new URL('../worker/transit/network.json', import.meta.url))));
const truth = Object.fromEntries(net.routes.map((r, i) => [String(901 + i), r.id]));
const DAY = Date.UTC(2026, 9, 5, 5, 0, 0); // Monday 5 October 2026, midnight in Lake Charles (UTC-5)
const at = (h, m = 0) => DAY + (h * 60 + m) * 60e3;
let failed = 0;

function run(name, { from, to, opt = {}, mutate, expect }) {
  const states = {}; let wrong = 0, shown = 0, ghost = 0, identified = {}, unknownSecs = 0, samples = 0;
  for (let t = from; t <= to; t += 10e3) {
    let reports = simReports(net, t, opt);
    if (mutate) reports = mutate(reports, t);
    const { vehicles } = update(net, states, reports, t);
    for (const v of vehicles) {
      samples++;
      const real = (opt.truth ?? truth)[v.id];
      if (!real) { ghost++; continue; }
      if (v.route == null) unknownSecs += 10;
      else if (v.route !== real) wrong++;
      else { shown++; identified[v.id] ??= t; }
    }
  }
  const lt = localTime(from, net.feed.timezone), first = tripsOn(net, net.routes[0], lt)[0]?.[0];
  const idAfter = Object.entries(identified).map(([id, t]) => `${id}:${Math.max(0, Math.round((localTime(t, net.feed.timezone).sec - Math.max(first, lt.sec)) / 60 * 10) / 10)}m`).join(' ');
  const ok = expect({ wrong, ghost, identified, shown, unknownSecs });
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}\n      wrong-route samples ${wrong}, filtered-unit leaks ${ghost}, matched samples ${shown}, bus-minutes shown as "identifying" ${(unknownSecs / 60).toFixed(1)}\n      minutes after departure (or after start of watching) until matched: ${idAfter || 'none'}`);
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
run('Three-minute detour 220 m off the route', {
  from: at(5, 20), to: at(11, 0),
  mutate: (reports, t) => reports.map(r => (r.id === '903' && t >= at(9, 10) && t < at(9, 13) ? { ...r, lat: r.lat + 0.002 } : r)),
  expect: r => r.wrong === 0 && all5(r),
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
// Saturday: nothing in the timetable, so nothing should be shown.
run('Saturday, no service', { from: at(8, 0) + 5 * 86400e3, to: at(9, 0) + 5 * 86400e3, expect: r => r.shown === 0 && r.wrong === 0 && r.ghost === 0 });

console.log(failed ? `\n${failed} scenario(s) failed` : '\nAll scenarios passed');
process.exit(failed ? 1 : 0);
