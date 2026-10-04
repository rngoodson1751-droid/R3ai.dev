// Demo of the driver dispatch board. Everything here is invented: the people, the routes and the rotation.
(function () {
  var root = document.getElementById('dispatch');
  if (!root) return;
  var DRIVERS = ['Alma Finch', 'Ben Heron', 'Cora Wren', 'Dev Lark', 'Eli Crane', 'Faye Swift', 'Gus Martin', 'Hana Dove', 'Ike Robin'];
  var SUPERVISORS = ['Jo Hawk', 'Kit Starling'];
  var ROUTES = ['Route 1 North', 'Route 2 South', 'Route 3 East', 'Route 4 West', 'Route 5 Crosstown'];
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  var state = { week: 0, day: 0, out: {}, custom: null };

  // The rotation: each week five drivers hold a route and four are relief.
  // Two relief drivers are on the extra board each day and the other two are off.
  function plan() {
    var holders = [], board = [], off = [];
    DRIVERS.forEach(function (name, i) {
      var pos = (i + state.week) % DRIVERS.length;
      if (pos < ROUTES.length) holders[pos] = name;
      else if ((pos - ROUTES.length + state.day) % 2 === 0) board.push(name); else off.push(name);
    });
    return { holders: holders, board: board, off: off };
  }
  // Who covers: the extra board first, then supervisors, then nobody.
  function cover(p) {
    var used = {}, free = function (n) { return !state.out[n] && !used[n]; };
    return p.holders.map(function (holder) {
      if (!state.out[holder]) return { who: holder, how: 'scheduled' };
      var sub = p.board.filter(free)[0];
      if (sub) { used[sub] = 1; return { who: sub, how: 'board', forWho: holder }; }
      sub = SUPERVISORS.filter(free)[0];
      if (sub) { used[sub] = 1; return { who: sub, how: 'supervisor', forWho: holder }; }
      return { who: '', how: 'none', forWho: holder };
    });
  }
  var HOW = { scheduled: 'As scheduled', board: 'Extra board', supervisor: 'Supervisor', none: 'NO COVERAGE' };

  function person(name, role, canCall) {
    var out = !!state.out[name];
    return '<li class="' + (out ? 'is-out' : '') + '"><div><strong>' + name + '</strong><span>' + (out ? 'Called in' : role) + '</span></div>' +
      (canCall && !state.custom ? '<button class="btn glass sm" type="button" data-out="' + name + '" aria-pressed="' + out + '">' + (out ? 'Back in' : 'Called in') + '</button>' : '') + '</li>';
  }
  function render() {
    var keep = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-key');
    var p = plan(), rows = cover(p), html = '';
    html += '<div class="demo-controls"><label class="field"><span>Rotation week</span><select class="input" data-key="week" id="dp-week">' +
      [0, 1, 2, 3, 4, 5, 6, 7].map(function (w) { return '<option value="' + w + '"' + (w === state.week ? ' selected' : '') + '>Week ' + (w + 1) + ' of 8</option>'; }).join('') + '</select></label>' +
      '<fieldset class="field pick"><legend>Day</legend>' + DAYS.map(function (d, i) {
        return '<label><input type="radio" name="dp-day" data-key="day' + i + '" value="' + i + '"' + (i === state.day ? ' checked' : '') + '>' + d + '</label>';
      }).join('') + '</fieldset>' +
      '<div class="acts"><button class="btn glass sm" type="button" data-key="custom" data-act="custom" aria-pressed="' + !!state.custom + '">Custom day</button>' +
      '<button class="btn glass sm" type="button" data-key="reset" data-act="reset">Reset day</button>' +
      '<button class="btn glass sm" type="button" data-key="print" data-act="print">Print</button></div></div>';

    var problems = [];
    if (state.custom) {
      var seen = {};
      state.custom.forEach(function (n) { if (n) seen[n] = (seen[n] || 0) + 1; });
      Object.keys(seen).forEach(function (n) { if (seen[n] > 1) problems.push(n + ' is on ' + seen[n] + ' routes.'); });
      state.custom.forEach(function (n, i) { if (!n) problems.push(ROUTES[i] + ' has nobody assigned.'); });
    } else rows.forEach(function (r, i) { if (r.how === 'none') problems.push(ROUTES[i] + ' has no coverage.'); });
    html += '<p class="demo-status' + (problems.length ? ' bad' : '') + '" role="status">' +
      (problems.length ? problems.join(' ') : 'All five routes are covered.') + '</p>';

    html += '<div class="demo-cols"><section><h2>' + DAYS[state.day] + ', week ' + (state.week + 1) + (state.custom ? ' (custom)' : '') + '</h2><ul class="routes">';
    ROUTES.forEach(function (route, i) {
      if (state.custom) {
        var dup = state.custom[i] && state.custom.filter(function (n) { return n === state.custom[i]; }).length > 1;
        html += '<li class="' + (!state.custom[i] || dup ? 'is-open' : '') + '"><div><strong>' + route + '</strong><span>5:45 a.m. to 5:45 p.m.</span></div>' +
          '<select class="input" data-route="' + i + '" data-key="route' + i + '" aria-label="Driver for ' + route + '"><option value="">Nobody</option>' +
          DRIVERS.concat(SUPERVISORS).map(function (n) { return '<option' + (n === state.custom[i] ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></li>';
      } else {
        var r = rows[i];
        html += '<li class="' + (r.how === 'none' ? 'is-open' : '') + '"><div><strong>' + route + '</strong><span>' +
          (r.forWho ? 'Covering for ' + r.forWho : '5:45 a.m. to 5:45 p.m.') + '</span></div>' +
          '<div class="assign"><b>' + (r.who || 'Nobody') + '</b><span class="chip ' + r.how + '">' + HOW[r.how] + '</span></div></li>';
      }
    });
    html += '</ul></section><section><h2>Who is on today</h2><ul class="people">';
    p.holders.forEach(function (n, i) { html += person(n, ROUTES[i], true); });
    p.board.forEach(function (n, i) { html += person(n, 'Extra board, ' + (i ? 'second' : 'first') + ' up', true); });
    SUPERVISORS.forEach(function (n) { html += person(n, 'Supervisor, last resort', true); });
    p.off.forEach(function (n) { html += person(n, 'Off today', false); });
    html += '</ul></section></div>';
    root.innerHTML = html;
    if (keep) { var el = root.querySelector('[data-key="' + keep + '"]'); if (el) el.focus(); }
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.out) { state.out[b.dataset.out] = !state.out[b.dataset.out]; render(); var again = root.querySelector('[data-out="' + b.dataset.out + '"]'); if (again) again.focus(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'reset') { state.out = {}; state.custom = null; }
    if (b.dataset.act === 'custom') state.custom = state.custom ? null : cover(plan()).map(function (r) { return r.who; });
    render();
  });
  root.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'dp-week') { state.week = +t.value; state.out = {}; state.custom = null; }
    else if (t.name === 'dp-day') { state.day = +t.value; state.out = {}; state.custom = null; }
    else if (t.dataset.route) state.custom[+t.dataset.route] = t.value;
    render();
  });
  render();
})();
