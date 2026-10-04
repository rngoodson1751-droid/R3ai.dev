// A made-up bus system shared by the live map demo and the stop sign demo.
// Nothing here is real: the town, the stops and the timetable are invented, and positions come from a clock.
(function () {
  var HUB = [500, 330];
  // Each route is a loop that leaves the transit center at :45 and is back 55 minutes later.
  var ROUTES = [
    { id: '1', name: 'Route 1 North', color: '#1272d6', pts: [HUB, [500, 215], [390, 130], [560, 75], [690, 150], [610, 240], HUB],
      stops: ['Transit Center', 'Oak and 3rd', 'Northgate', 'Mill Pond', 'Pine and 9th', 'Library'] },
    { id: '2', name: 'Route 2 South', color: '#0d9d74', pts: [HUB, [530, 430], [650, 520], [505, 590], [365, 540], [420, 440], HUB],
      stops: ['Transit Center', 'Market Square', 'Southside Park', 'Ferry Landing', 'Cannery Row', 'Clinic'] },
    { id: '3', name: 'Route 3 East', color: '#7fb82e', pts: [HUB, [640, 335], [785, 265], [905, 335], [825, 435], [685, 405], HUB],
      stops: ['Transit Center', 'Depot Street', 'College', 'Eastfield', 'Fairgrounds', 'Canal Bridge'] },
    { id: '4', name: 'Route 4 West', color: '#3aa8e0', pts: [HUB, [385, 310], [255, 240], [120, 300], [170, 410], [320, 400], HUB],
      stops: ['Transit Center', 'City Hall', 'Westwood', 'Harbor View', 'Boat Ramp', 'High School'] },
    { id: '5', name: 'Route 5 Crosstown', color: '#2f5fa8', buses: 2, pts: [HUB, [455, 250], [300, 185], [180, 115], [300, 185], [455, 250], HUB, [600, 300], [745, 470], [900, 540], [745, 470], [600, 300], HUB],
      stops: ['Transit Center', 'Museum', 'Garden Street', 'Hilltop', null, null, null, 'Post Office', 'Stadium', 'Airport Road', null, null] }
  ];
  var LOOP = 55 * 60, CYCLE = 60 * 60, START = 5 * 3600 + 45 * 60, END = 17 * 3600 + 45 * 60;

  var stops = [], buses = [];
  ROUTES.forEach(function (r) {
    var d = 0; r.dist = [0];
    for (var i = 1; i < r.pts.length; i++) { d += Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]); r.dist.push(d); }
    r.length = d;
    r.stops.forEach(function (name, i) {
      if (!name) return;
      var key = name === 'Transit Center' ? 'hub' : r.id + '-' + i, s = stops.filter(function (x) { return x.id === key; })[0];
      if (!s) { s = { id: key, name: name, x: r.pts[i][0], y: r.pts[i][1], calls: [] }; stops.push(s); }
      s.calls.push({ route: r, at: r.dist[i] / r.length * LOOP }); // seconds after leaving the hub
    });
    for (var b = 0; b < (r.buses || 1); b++) buses.push({ id: 'bus-' + r.id + (b ? 'b' : ''), route: r, offset: b * CYCLE / (r.buses || 1) });
  });
  function along(r, d) {
    for (var i = 1; i < r.dist.length; i++) if (d <= r.dist[i] || i === r.dist.length - 1) {
      var a = r.pts[i - 1], b = r.pts[i], f = (d - r.dist[i - 1]) / ((r.dist[i] - r.dist[i - 1]) || 1);
      return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, bearing: (Math.atan2(b[0] - a[0], a[1] - b[1]) * 180 / Math.PI + 360) % 360, leg: i };
    }
  }
  // where a bus is at time t (seconds since midnight)
  function position(bus, t) {
    var phase = (((t - START - bus.offset) % CYCLE) + CYCLE) % CYCLE, moving = phase < LOOP;
    var p = along(bus.route, moving ? phase / LOOP * bus.route.length : 0);
    var trip = t - phase, hh = Math.floor(trip / 3600), mm = Math.floor(trip % 3600 / 60);
    p.moving = moving; p.speed = moving ? bus.route.length / LOOP : 0;
    p.trip = 'R' + bus.route.id + '-' + (hh < 10 ? '0' : '') + hh + (mm < 10 ? '0' : '') + mm;
    return p;
  }
  // next arrivals at a stop: [{ route, seconds }], soonest first
  function arrivals(stop, t, count) {
    var out = [];
    stop.calls.forEach(function (c) {
      buses.filter(function (b) { return b.route === c.route; }).forEach(function (b) {
        var phase = (((t - START - b.offset) % CYCLE) + CYCLE) % CYCLE, wait = c.at - phase;
        if (stop.id === 'hub') wait = CYCLE - phase; // at the transit center the sign counts down to the next departure
        if (wait < 0) wait += CYCLE;
        out.push({ route: c.route, seconds: wait }, { route: c.route, seconds: wait + CYCLE }, { route: c.route, seconds: wait + 2 * CYCLE });
      });
    });
    return out.sort(function (a, b) { return a.seconds - b.seconds; }).slice(0, count || 3);
  }
  function clockText(t) {
    var h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60);
    return ((h + 11) % 12 + 1) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' a.m.' : ' p.m.');
  }
  // A clock that runs faster than real time so there is something to watch. Service runs 5:45 a.m. to 5:45 p.m.
  function clock(onTick) {
    var c = { t: 7 * 3600, speed: 30 }, last = performance.now();
    (function frame(now) {
      var dt = Math.min(250, now - last) / 1000; last = now;
      if (!document.hidden) { c.t += dt * c.speed; if (c.t > END) c.t = START + (c.t - END); onTick(c.t); }
      requestAnimationFrame(frame);
    })(last);
    return c;
  }
  window.R3Sim = { routes: ROUTES, stops: stops, buses: buses, hub: HUB, position: position, arrivals: arrivals, clockText: clockText, clock: clock,
    speeds: [[1, 'Real time'], [30, '30 times faster'], [120, '120 times faster']] };
})();
