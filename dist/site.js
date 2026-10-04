// r3ai.dev: small progressive enhancements. The site works without any of this.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isDark = function () {
    return root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // ---------- light and dark ----------
  var themeListeners = [];
  var btn = document.getElementById('theme');
  if (btn) btn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    var apply = function () {
      root.dataset.theme = next;
      try { localStorage.setItem('r3-theme', next); } catch (e) {}
      themeListeners.forEach(function (f) { f(); });
    };
    if (document.startViewTransition && !still) document.startViewTransition(apply); else apply();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { themeListeners.forEach(function (f) { f(); }); });

  // ---------- pointer highlight on glass ----------
  document.addEventListener('pointermove', function (e) {
    var g = e.target.closest && e.target.closest('.glass');
    if (!g) return;
    var b = g.getBoundingClientRect();
    g.style.setProperty('--mx', (e.clientX - b.left) + 'px');
    g.style.setProperty('--my', (e.clientY - b.top) + 'px');
  }, { passive: true });

  // ---------- water: a slow blue and green shader behind the page ----------
  (function silk() {
    var c = document.getElementById('silk');
    if (!c) return;
    var gl = c.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) { c.remove(); return; }
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision mediump float;uniform vec2 r;uniform float t;uniform vec2 m;uniform vec3 a;uniform vec3 b;uniform vec3 k;uniform vec3 g;',
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}',
      'float f(vec2 p){float v=0.,s=.5;for(int i=0;i<4;i++){v+=s*n(p);p=p*2.03+vec2(3.1,1.7);s*=.5;}return v;}',
      'void main(){vec2 u=gl_FragCoord.xy/r;vec2 p=vec2(u.x*r.x/r.y,u.y)*1.15+(m-.5)*.22;',
      'vec2 q=vec2(f(p+t*.022),f(p+vec2(5.2,1.3)-t*.018));',
      'vec2 w=vec2(f(p+2.6*q+vec2(1.7,9.2)+t*.014),f(p+2.6*q+vec2(8.3,2.8)-t*.012));',
      'float s=f(p+3.*w);float fold=smoothstep(.32,.78,s);',
      'vec3 col=mix(a,b,fold);col=mix(col,k,smoothstep(.45,.95,length(w))*.34);col=mix(col,g,smoothstep(.42,.78,q.y)*.3);',
      'col+=(.5-abs(fract(s*5.)-.5))*.012;',
      'gl_FragColor=vec4(col,1.);}'
    ].join('\n');
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { c.remove(); return; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['r', 't', 'm', 'a', 'b', 'k', 'g'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    var mouse = [.5, .5], aim = [.5, .5];
    function colors() {
      if (isDark()) { gl.uniform3f(U.a, .022, .078, .108); gl.uniform3f(U.b, .036, .145, .175); gl.uniform3f(U.k, .07, .34, .66); gl.uniform3f(U.g, .05, .5, .4); }
      else { gl.uniform3f(U.a, .93, .972, .978); gl.uniform3f(U.b, .8, .915, .94); gl.uniform3f(U.k, .36, .66, .94); gl.uniform3f(U.g, .42, .84, .7); }
    }
    function size() {
      var s = Math.min(window.devicePixelRatio || 1, 2) * .5;
      c.width = Math.max(2, Math.round(innerWidth * s)); c.height = Math.max(2, Math.round(innerHeight * s));
      gl.viewport(0, 0, c.width, c.height); gl.uniform2f(U.r, c.width, c.height);
    }
    var t0 = performance.now(), seed = Math.random() * 40, running = true;
    function draw(now) {
      mouse[0] += (aim[0] - mouse[0]) * .04; mouse[1] += (aim[1] - mouse[1]) * .04;
      gl.uniform1f(U.t, seed + (now - t0) / 1000); gl.uniform2f(U.m, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (running && !still) requestAnimationFrame(draw);
    }
    colors(); size(); themeListeners.push(function () { colors(); if (still || !running) draw(performance.now()); });
    addEventListener('resize', function () { size(); if (still) draw(performance.now()); });
    addEventListener('pointermove', function (e) { aim[0] = e.clientX / innerWidth; aim[1] = 1 - e.clientY / innerHeight; }, { passive: true });
    document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running && !still) requestAnimationFrame(draw); });
    requestAnimationFrame(draw);
  })();

  // ---------- the cube: a 3 by 3 puzzle. Drag a tile to turn a row, drag beside it to spin the whole thing ----------
  (function cube() {
    var scene = document.querySelector('.scene'), el = scene && scene.querySelector('.cube');
    if (!el) return;
    var say = document.querySelector('.cube-say'), HINT = say ? say.textContent : '';
    var Q = Math.PI / 2, RAD = Math.PI / 180;
    var AXES = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    var SIDES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    // 3 by 3 matrices, row by row. x runs right, y runs down, z runs toward you.
    function mul(a, b) {
      var o = [];
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]);
      return o;
    }
    function app(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; }
    function rot(k, a) {
      var c = Math.cos(a), s = Math.sin(a);
      return k === 0 ? [1, 0, 0, 0, c, -s, 0, s, c] : k === 1 ? [c, 0, s, 0, 1, 0, -s, 0, c] : [c, -s, 0, s, c, 0, 0, 0, 1];
    }
    var round = function (m) { return m.map(Math.round); };
    var num = function (n) { return +n.toFixed(5); };

    var cubies = [].map.call(el.querySelectorAll('.qb'), function (node) {
      var home = node.dataset.p.split(',').map(Number);
      var tiles = [].map.call(node.querySelectorAll('.fc[data-k]'), function (t) { return +t.dataset.k; });
      return { el: node, home: home, p: home.slice(), o: [1, 0, 0, 0, 1, 0, 0, 0, 1], tiles: tiles };
    });
    function place(q, m) {
      var p = m ? app(m, q.p) : q.p, o = m ? mul(m, q.o) : q.o;
      q.el.style.transform = 'translate3d(calc(var(--c)*' + num(p[0]) + '),calc(var(--c)*' + num(p[1]) + '),calc(var(--c)*' + num(p[2]) + ')) matrix3d(' +
        [o[0], o[3], o[6], 0, o[1], o[4], o[7], 0, o[2], o[5], o[8], 0, 0, 0, 0, 1].map(num).join(',') + ')';
    }
    var layerOf = function (k, layer) { return cubies.filter(function (q) { return q.p[k] === layer; }); };
    function commit(list, k, quarters) {
      var m = round(rot(k, quarters * Q));
      list.forEach(function (q) { q.p = round(app(m, q.p)); q.o = round(mul(m, q.o)); place(q); });
    }
    function isSolved() {
      var seen = {};
      return cubies.every(function (q) {
        return q.tiles.every(function (t) {
          var key = round(app(q.o, SIDES[t])).join();
          if (seen[key] == null) seen[key] = t;
          return seen[key] === t;
        });
      });
    }

    // ---- turning ----
    var busy = false, queue = [], history = [], scrambled = false, turns = 0;
    function tell(text) { if (say) say.textContent = text; }
    function glide(list, k, from, to, ms, then) {
      if (still || ms < 1) { then(); return; }
      var t0 = performance.now();
      (function step(now) {
        var t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 3), m = rot(k, from + (to - from) * e);
        if (t < 1) { list.forEach(function (q) { place(q, m); }); requestAnimationFrame(step); } else then();
      })(t0);
    }
    function next() {
      if (busy) return;
      var mv = queue.shift();
      if (!mv) return;
      busy = true;
      var list = layerOf(mv.k, mv.layer);
      glide(list, mv.k, 0, mv.q * Q, mv.ms, function () {
        commit(list, mv.k, mv.q);
        busy = false;
        if (mv.then) mv.then();
        next();
      });
    }
    function played(k, layer, q) {
      q = ((q % 4) + 4) % 4;
      if (!q) return;
      history.push({ k: k, layer: layer, q: q });
      turns++;
      if (isSolved()) {
        tell(scrambled ? 'Solved in ' + turns + (turns === 1 ? ' turn.' : ' turns.') + ' Nicely done.' : HINT);
        scrambled = false; history = []; turns = 0;
      } else tell(turns + (turns === 1 ? ' turn' : ' turns'));
    }
    function scramble() {
      if (busy || queue.length) return;
      var last = -1;
      for (var i = 0; i < 22; i++) {
        var k; do { k = Math.floor(Math.random() * 3); } while (k === last);
        last = k;
        var mv = { k: k, layer: Math.random() < .5 ? -1 : 1, q: Math.random() < .5 ? -1 : 1, ms: 85 };
        history.push({ k: mv.k, layer: mv.layer, q: mv.q });
        queue.push(mv);
      }
      queue[queue.length - 1].then = function () { scrambled = true; turns = 0; tell('Scrambled. Your turn.'); };
      tell('Scrambling');
      next();
    }
    function reset() {
      if (busy || queue.length || !history.length) return;
      var ms = Math.max(22, Math.min(90, 1400 / history.length));
      history.slice().reverse().forEach(function (h) { queue.push({ k: h.k, layer: h.layer, q: h.q === 3 ? 1 : -h.q, ms: ms }); });
      queue[queue.length - 1].then = function () { tell(HINT); };
      history = []; scrambled = false; turns = 0;
      next();
    }
    document.querySelectorAll('[data-cube]').forEach(function (b) {
      b.addEventListener('click', function () { touched = performance.now(); (b.dataset.cube === 'scramble' ? scramble : reset)(); });
    });

    // ---- spinning the whole cube, and dragging tiles ----
    var rx = -20, ry = -32, vx = 0, vy = still ? 0 : -.12, drag = null, hover = false, touched = -1e5, last = performance.now();
    function frame(now) {
      var dt = Math.min(50, now - last) / 16.67; last = now;
      if (!drag) {
        var idle = !still && !hover && !busy && document.activeElement !== el && now - touched > 5000;
        vy += ((idle ? -.12 : 0) - vy) * (idle ? .02 : .08) * dt; vx *= Math.pow(.92, dt);
        ry += vy * dt; rx = Math.max(-80, Math.min(80, rx + vx * dt));
        if (idle) rx += (-20 - rx) * .02 * dt;
      }
      el.style.setProperty('--rx', rx.toFixed(2) + 'deg'); el.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      requestAnimationFrame(frame);
    }
    scene.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    scene.addEventListener('pointerleave', function () { hover = false; });
    scene.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      var tile = e.target.closest('.fc[data-k]'), grab = null;
      if (tile && !busy && !queue.length) {
        var q = cubies.filter(function (c) { return c.el === tile.parentNode; })[0];
        grab = { q: q, n: round(app(q.o, SIDES[+tile.dataset.k])) };
      }
      drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, grab: grab, onCube: !!tile, turn: null };
      vx = vy = 0; touched = performance.now();
      scene.setPointerCapture(e.pointerId);
    });
    scene.addEventListener('pointermove', function (e) {
      if (!drag) return;
      touched = performance.now();
      var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (!drag.onCube) { // spin
        var mx = e.clientX - drag.x, my = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
        ry += mx * .5; rx = Math.max(-80, Math.min(80, rx - my * .5)); vy = mx * .5; vx = -my * .5;
        return;
      }
      if (!drag.grab) return;
      var t = drag.turn;
      if (!t) {
        if (Math.hypot(dx, dy) < 7) return;
        // which of the two directions along this tile's face is the pointer following?
        var view = mul(rot(0, rx * RAD), rot(1, ry * RAD)), n = drag.grab.n, best = null;
        for (var i = 0; i < 3; i++) {
          if (n[i]) continue;
          var pr = app(view, AXES[i]), len = Math.hypot(pr[0], pr[1]);
          if (len < .2) continue;
          var score = Math.abs(dx * pr[0] + dy * pr[1]) / len;
          if (!best || score > best.score) best = { score: score, i: i, ux: pr[0] / len, uy: pr[1] / len, len: len };
        }
        if (!best) return;
        var a = AXES[best.i], cr = [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]];
        var k = cr[0] ? 0 : cr[1] ? 1 : 2, layer = drag.grab.q.p[k];
        t = drag.turn = { k: k, layer: layer, list: layerOf(k, layer), ux: best.ux, uy: best.uy, gain: cr[k] / (best.len * (el.offsetWidth / 3) * 1.25), a: 0 };
        busy = true;
      }
      t.a = Math.max(-Math.PI, Math.min(Math.PI, (dx * t.ux + dy * t.uy) * t.gain));
      var m = rot(t.k, t.a);
      t.list.forEach(function (c) { place(c, m); });
    });
    function end() {
      if (!drag) return;
      var t = drag.turn; drag = null;
      if (!t) return;
      var q = Math.round(t.a / Q);
      if (!q && Math.abs(t.a) > .3) q = t.a > 0 ? 1 : -1;
      glide(t.list, t.k, t.a, q * Q, 170, function () {
        commit(t.list, t.k, q);
        busy = false;
        played(t.k, t.layer, q);
        next();
      });
    }
    scene.addEventListener('pointerup', end); scene.addEventListener('pointercancel', end);

    // ---- keyboard: arrows spin the cube; U D L R F B turn a face clockwise, with Shift the other way ----
    var FACES = { r: [0, 1], l: [0, -1], d: [1, 1], u: [1, -1], f: [2, 1], b: [2, -1] };
    el.tabIndex = 0;
    el.setAttribute('aria-label', el.getAttribute('aria-label') + ' With the keyboard: arrow keys spin the cube, and U, D, L, R, F and B turn a face. Hold Shift to turn it the other way.');
    el.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var key = e.key.toLowerCase(), f = FACES[key];
      touched = performance.now();
      if (key === 'arrowleft') ry -= 15; else if (key === 'arrowright') ry += 15;
      else if (key === 'arrowup') rx = Math.min(80, rx + 15); else if (key === 'arrowdown') rx = Math.max(-80, rx - 15);
      else if (f && queue.length < 4) {
        var mv = { k: f[0], layer: f[1], q: f[1] * (e.shiftKey ? -1 : 1), ms: 170 };
        mv.then = function () { played(mv.k, mv.layer, mv.q); };
        queue.push(mv); next();
      } else return;
      e.preventDefault();
    });
    requestAnimationFrame(frame);
  })();

  // ---------- request a post: send the form without leaving the page ----------
  (function request() {
    var form = document.getElementById('request');
    if (!form) return;
    var msg = document.getElementById('rq-msg'), btn = form.querySelector('[type=submit]'), about = form.elements.about;
    // arriving from "Request a follow-up" on a post picks that post for you
    var slug = new URLSearchParams(location.search).get('about');
    if (slug) [].forEach.call(about.options, function (o) {
      if (o.dataset.slug !== slug) return;
      o.selected = true;
      form.elements.side.value = o.dataset.side;
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var body = {};
      new FormData(form).forEach(function (v, k) { body[k] = v; });
      btn.disabled = true; msg.className = 'form-msg'; msg.textContent = 'Sending';
      fetch(form.action, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || ''); }); })
        .then(function () {
          var done = document.createElement('div');
          done.className = 'sheet strong form form-done'; done.setAttribute('role', 'status'); done.tabIndex = -1;
          done.innerHTML = '<h2>Got it</h2><p>Your request is on my list. Thanks for asking.</p><p><a class="btn glass" href="/request/">Send another</a></p>';
          form.replaceWith(done); done.focus();
        })
        .catch(function (err) {
          btn.disabled = false; msg.className = 'form-msg bad';
          msg.textContent = err.message && !/fetch|JSON|token/i.test(err.message) ? err.message : 'That did not send. Check your connection and try again.';
        });
    });
  })();

  // ---------- true refraction on the floating bars (Chromium only; others keep the frosted look) ----------
  (function lens() {
    if (!navigator.userAgentData || !window.ResizeObserver) return;
    if (matchMedia('(prefers-reduced-transparency: reduce)').matches) return;
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    document.body.appendChild(svg);
    var id = 0;
    function attach(el) {
      var fid = 'lens' + (++id), filter = document.createElementNS(NS, 'filter');
      filter.setAttribute('id', fid); filter.setAttribute('color-interpolation-filters', 'sRGB');
      filter.setAttribute('x', '0'); filter.setAttribute('y', '0'); filter.setAttribute('width', '100%'); filter.setAttribute('height', '100%');
      var img = document.createElementNS(NS, 'feImage'); img.setAttribute('result', 'map'); img.setAttribute('preserveAspectRatio', 'none');
      var disp = document.createElementNS(NS, 'feDisplacementMap');
      disp.setAttribute('in', 'SourceGraphic'); disp.setAttribute('in2', 'map'); disp.setAttribute('xChannelSelector', 'R'); disp.setAttribute('yChannelSelector', 'G');
      filter.appendChild(img); filter.appendChild(disp); svg.appendChild(filter);
      function build() {
        var w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
        if (w < 8 || h < 8) return;
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        var g = cv.getContext('2d'), d = g.createImageData(w, h), px = d.data;
        var r = Math.min(w, h) / 2, bezel = Math.min(r, 20), hx = w / 2 - r, hy = h / 2 - r;
        for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
          var dx = x + .5 - w / 2, dy = y + .5 - h / 2, qx = Math.abs(dx) - hx, qy = Math.abs(dy) - hy;
          var ox = Math.max(qx, 0), oy = Math.max(qy, 0), ol = Math.hypot(ox, oy);
          var inside = -(ol + Math.min(Math.max(qx, qy), 0) - r);
          var nx = 0, ny = 0;
          if (ol > 0) { nx = ox / ol * Math.sign(dx); ny = oy / ol * Math.sign(dy); }
          else if (qx > qy) nx = Math.sign(dx); else ny = Math.sign(dy);
          var k = inside < bezel ? Math.pow(1 - Math.max(inside, 0) / bezel, 2.2) : 0;
          var i = (y * w + x) * 4;
          px[i] = 128 - nx * k * 127; px[i + 1] = 128 - ny * k * 127; px[i + 2] = 128; px[i + 3] = 255;
        }
        g.putImageData(d, 0, 0);
        img.setAttribute('href', cv.toDataURL()); img.setAttribute('x', '0'); img.setAttribute('y', '0'); img.setAttribute('width', w); img.setAttribute('height', h);
        disp.setAttribute('scale', String(Math.round(bezel * 2.6)));
        el.style.backdropFilter = 'url(#' + fid + ') blur(9px) saturate(170%)';
      }
      new ResizeObserver(build).observe(el);
    }
    document.querySelectorAll('.bar, .tabs').forEach(attach);
  })();
})();
