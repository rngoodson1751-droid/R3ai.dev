// Bus stop sign demo: an on-screen version of the e-paper countdown sign, fed by the made-up buses in sim.js.
(function () {
  var root = document.getElementById('stopsign'), S = window.R3Sim;
  if (!root || !S) return;
  var wanted = new URLSearchParams(location.search).get('stop');
  var stop = S.stops.filter(function (s) { return s.id === wanted; })[0] || S.stops.filter(function (s) { return s.id !== 'hub'; })[0];
  root.innerHTML = '<div class="demo-controls"><label class="field"><span>Stop</span><select class="input" id="ss-stop">' + S.stops.map(function (s) {
    return '<option value="' + s.id + '"' + (s === stop ? ' selected' : '') + '>' + s.name + '</option>';
  }).join('') + '</select></label><label class="field"><span>Speed</span><select class="input" id="ss-speed">' + S.speeds.map(function (s) {
    return '<option value="' + s[0] + '"' + (s[0] === 30 ? ' selected' : '') + '>' + s[1] + '</option>';
  }).join('') + '</select></label></div>' +
    '<div class="sign-case"><div class="epaper" id="ss-screen" role="img"></div></div>' +
    '<p class="hint">E-paper only uses power when the picture changes, so the sign redraws once a minute and sleeps in between. The blink is the screen redrawing.</p>';
  var screen = document.getElementById('ss-screen'), shown = '';
  function draw(t) {
    var rows = S.arrivals(stop, t, 3).map(function (a) {
      var m = Math.ceil(a.seconds / 60);
      return '<div class="ep-row"><b>' + a.route.id + '</b><span>' + a.route.name.replace(/^Route \d+ /, '') + '</span><strong>' + (m <= 1 ? 'DUE' : m + ' min') + '</strong></div>';
    }).join('');
    var html = '<div class="ep-head"><span>' + stop.name + '</span><span>' + S.clockText(t) + '</span></div>' + rows +
      '<div class="ep-foot"><span>' + (stop.id === 'hub' ? 'Next departures' : 'Next buses') + '</span><span>Battery 86%</span></div>';
    if (html === shown) return;
    shown = html;
    screen.innerHTML = html;
    screen.setAttribute('aria-label', stop.name + ' sign. ' + screen.textContent);
    screen.classList.remove('redraw'); void screen.offsetWidth; screen.classList.add('redraw');
  }
  var clock = S.clock(function (t) { draw(Math.floor(t / 60) * 60); });
  document.getElementById('ss-stop').addEventListener('change', function (e) {
    stop = S.stops.filter(function (s) { return s.id === e.target.value; })[0];
    history.replaceState(null, '', '?stop=' + stop.id);
    draw(Math.floor(clock.t / 60) * 60);
  });
  document.getElementById('ss-speed').addEventListener('change', function (e) { clock.speed = +e.target.value; });
  draw(Math.floor(clock.t / 60) * 60);
})();
