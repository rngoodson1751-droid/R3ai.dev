// Live bus map demo. Draws the made-up town from sim.js and moves the buses along their routes.
(function () {
  var root = document.getElementById('busmap'), S = window.R3Sim;
  if (!root || !S) return;
  var NS = 'http://www.w3.org/2000/svg', FEED_EVERY = 15; // like the real map, positions refresh every 15 seconds of bus time
  var esc = function (v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var path = function (pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' '); };

  var svg = '<svg class="map" viewBox="0 0 1000 640" role="img" aria-label="Map of a made-up town with five bus routes">' +
    '<path class="water" d="M-10 470 C120 430 190 520 300 560 C380 590 420 660 420 660 L-10 660 Z"/>' +
    '<path class="water" d="M700 -10 C760 40 880 30 1010 90 L1010 -10 Z"/>' +
    '<g class="streets">' + [90, 190, 290, 390, 490, 590].map(function (y) { return '<path d="M0 ' + y + ' H1000"/>'; }).join('') +
    [100, 220, 340, 460, 580, 700, 820, 940].map(function (x) { return '<path d="M' + x + ' 0 V640"/>'; }).join('') + '</g>' +
    S.routes.map(function (r) { return '<path class="route" d="' + path(r.pts) + '" style="stroke:' + r.color + '"/>'; }).join('') +
    S.stops.map(function (s) {
      return '<g class="stop" tabindex="0" role="button" data-stop="' + s.id + '" aria-label="Stop: ' + esc(s.name) + '"><circle cx="' + s.x + '" cy="' + s.y + '" r="' + (s.id === 'hub' ? 13 : 8) + '"/>' +
        '<text x="' + s.x + '" y="' + (s.y + (s.id === 'hub' ? 34 : 25)) + '">' + esc(s.name) + '</text></g>';
    }).join('') +
    S.buses.map(function (b) {
      return '<g class="bus" tabindex="0" role="button" data-bus="' + b.id + '" aria-label="Bus on ' + b.route.name + '"><g class="spin"><path d="M0 -24 L8 -12 L-8 -12 Z" style="fill:' + b.route.color + '"/></g>' +
        '<circle r="14" style="fill:' + b.route.color + '"/><text y="5">' + b.route.id + '</text></g>';
    }).join('') + '</svg>';

  root.innerHTML = '<div class="demo-controls"><p class="map-clock" id="bm-clock"></p>' +
    '<label class="field"><span>Speed</span><select class="input" id="bm-speed">' + S.speeds.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === 30 ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="demo-cols map-cols"><div class="map-wrap">' + svg + '</div><section id="bm-side" aria-live="off"></section></div>';
  var clockEl = document.getElementById('bm-clock'), side = document.getElementById('bm-side');
  var marks = {}; [].forEach.call(root.querySelectorAll('.bus'), function (g) { marks[g.dataset.bus] = g; });
  var picked = { bus: S.buses[0].id, stop: null }, feed = {}, lastFeed = -1e9, lastMinute = -1;

  function entity(b, p, t) {
    return { id: b.id, vehicle: { trip: { trip_id: p.trip, route_id: b.route.id }, position: { latitude: +(30.2 - p.y / 9000).toFixed(5), longitude: +(-93.3 + p.x / 9000).toFixed(5), bearing: Math.round(p.bearing), speed: +(p.speed * 25).toFixed(1) },
      current_status: p.moving ? 'IN_TRANSIT_TO' : 'STOPPED_AT', timestamp: Math.floor(Date.now() / 86400000) * 86400 + Math.floor(t), vehicle: { id: b.id, label: b.route.name } } };
  }
  function panel(t) {
    var h = '';
    if (picked.stop) {
      var s = S.stops.filter(function (x) { return x.id === picked.stop; })[0];
      h += '<h2>' + esc(s.name) + '</h2><ul class="routes">' + S.arrivals(s, t, 4).map(function (a) {
        var m = Math.ceil(a.seconds / 60);
        return '<li><div><strong>' + a.route.name + '</strong><span>' + (s.id === 'hub' ? 'Departs' : 'Arrives') + ' ' + S.clockText(t + a.seconds) + '</span></div><div class="assign"><b>' + (m <= 1 ? 'Due' : m + ' min') + '</b></div></li>';
      }).join('') + '</ul><p><a class="btn glass sm" href="/demos/stop-sign/?stop=' + s.id + '">See this stop\'s sign</a></p>';
    } else {
      var b = S.buses.filter(function (x) { return x.id === picked.bus; })[0];
      h += '<h2>' + b.route.name + '</h2><p class="hint">This is what the real-time feed says about this bus right now. Trip-planning apps read the same fields, in a compact binary form.</p>' +
        '<pre class="feed">' + esc(JSON.stringify(feed[b.id] || {}, null, 1)) + '</pre>';
    }
    side.innerHTML = h + '<p class="hint">Pick any bus or stop on the map.</p>';
  }
  function tick(t) {
    clockEl.textContent = S.clockText(t);
    if (Math.abs(t - lastFeed) >= FEED_EVERY) {
      lastFeed = t;
      S.buses.forEach(function (b) {
        var p = S.position(b, t), g = marks[b.id];
        feed[b.id] = entity(b, p, t);
        g.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
        g.querySelector('.spin').style.transform = 'rotate(' + p.bearing.toFixed(0) + 'deg)';
        g.classList.toggle('parked', !p.moving);
      });
      if (!picked.stop) panel(t);
    }
    var minute = Math.floor(t / 60);
    if (picked.stop && minute !== lastMinute) panel(t);
    lastMinute = minute;
  }
  var clock = S.clock(tick);
  function choose(el) {
    var g = el.closest && el.closest('[data-bus], [data-stop]');
    if (!g) return;
    picked = g.dataset.bus ? { bus: g.dataset.bus, stop: null } : { bus: picked.bus, stop: g.dataset.stop };
    [].forEach.call(root.querySelectorAll('.is-picked'), function (x) { x.classList.remove('is-picked'); });
    g.classList.add('is-picked');
    panel(clock.t);
  }
  root.addEventListener('click', function (e) { choose(e.target); });
  root.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { if (e.target.closest('[data-bus], [data-stop]')) { e.preventDefault(); choose(e.target); } } });
  document.getElementById('bm-speed').addEventListener('change', function (e) {
    clock.speed = +e.target.value;
    // glide between feed refreshes; at real time the bus jumps every 15 seconds, the way the real map does
    root.style.setProperty('--glide', Math.min(1, FEED_EVERY / clock.speed) + 's');
  });
  root.style.setProperty('--glide', '.5s');
  marks[picked.bus].classList.add('is-picked');
  tick(clock.t);
})();
