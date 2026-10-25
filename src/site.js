// r3ai.dev: small progressive enhancements. The site works without any of this.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isDark = function () {
    return root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // ---------- liquid glass lens: Chromium can bend light through an SVG backdrop filter; Safari and Firefox keep the plain clear glass ----------
  try {
    var ua = navigator.userAgentData;
    if (ua && ua.brands && ua.brands.some(function (b) { return /Chromium/.test(b.brand); }) && !matchMedia('(prefers-reduced-transparency: reduce)').matches) root.classList.add('lens');
  } catch (e) {}

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
    var g = e.target.closest && e.target.closest('.glass, a.sheet, .card');
    if (!g) return;
    var b = g.getBoundingClientRect();
    g.style.setProperty('--mx', (e.clientX - b.left) + 'px');
    g.style.setProperty('--my', (e.clientY - b.top) + 'px');
  }, { passive: true });

  // ---------- the sky: the whole site is lit by the real sky over the lake, right now ----------
  // The sun's position over the lake sets the wallpaper's colours, a soft sun glow, stars at night in dark mode,
  // and the --sky, --sky2 and --sun colours the stylesheet uses for small accents. ?sky=18:40 previews a time of day.
  var SKY = (function () {
    var LAT = 30.22, LON = -93.22, TZ = 'America/Chicago', R = Math.PI / 180;
    var over = null, listeners = [];
    try {
      var q = new URLSearchParams(location.search).get('sky');
      var mm = q && q.match(/^(\d{1,2}):(\d{2})$/);
      if (mm) over = Math.min(1439, +mm[1] * 60 + +mm[2]);
    } catch (e) {}
    var clock = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hourCycle: 'h23' });
    function lakeMinutes(d) {
      var p = {}; clock.formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      return (+p.hour % 24) * 60 + +p.minute;
    }
    function when() {
      var now = new Date();
      return over == null ? now : new Date(now.getTime() + (over - lakeMinutes(now)) * 60000);
    }
    // a compact solar position (good to a fraction of a degree, which is plenty for colour)
    function sun(date) {
      var d = date.getTime() / 86400000 - 10957.5;
      var g = (357.529 + .98560028 * d) * R, q = 280.459 + .98564736 * d;
      var L = (q + 1.915 * Math.sin(g) + .02 * Math.sin(2 * g)) * R, ob = (23.439 - .00000036 * d) * R;
      var ra = Math.atan2(Math.cos(ob) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(ob) * Math.sin(L));
      var gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
      var H = (gmst * 15 + LON) * R - ra, la = LAT * R;
      var alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H));
      var az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(H));
      return { alt: alt / R, az: (az / R + 360) % 360, rising: Math.sin(H) < 0 };
    }
    // palettes by the sun's height in degrees: deep night, twilight, the sun on the horizon, golden hour, full day
    var STOPS = [-18, -6, 0, 8, 22];
    var LIGHT = [
      [[.93, .935, .96], [.8, .815, .89], [.66, .7, .86], [.85, .83, .95]],
      [[.94, .92, .97], [.82, .8, .92], [.66, .62, .92], [.96, .76, .86]],
      [[.995, .93, .9], [.96, .81, .8], [1, .6, .47], [.82, .72, .96]],
      [[.995, .96, .91], [.97, .87, .75], [1, .73, .47], [.98, .8, .78]],
      [[.97, .975, .985], [.87, .9, .95], [.72, .83, .98], [.99, .94, .86]]
    ];
    var DARK = [
      [[.018, .022, .04], [.055, .065, .11], [.13, .17, .33], [.2, .16, .32]],
      [[.035, .035, .085], [.1, .085, .21], [.3, .22, .55], [.46, .18, .38]],
      [[.07, .035, .055], [.2, .075, .11], [.72, .29, .2], [.32, .14, .44]],
      [[.07, .05, .035], [.19, .11, .065], [.64, .37, .12], [.42, .16, .18]],
      [[.04, .05, .07], [.09, .12, .17], [.17, .31, .54], [.38, .34, .28]]
    ];
    function mix(a, b, f) { return a.map(function (v, i) { return v + (b[i] - v) * f; }); }
    function palette(alt, dark) {
      var P = dark ? DARK : LIGHT, i = 0;
      if (alt <= STOPS[0]) return P[0];
      if (alt >= STOPS[4]) return P[4];
      while (alt > STOPS[i + 1]) i++;
      var f = (alt - STOPS[i]) / (STOPS[i + 1] - STOPS[i]); f = f * f * (3 - 2 * f);
      return P[i].map(function (c, j) { return mix(c, P[i + 1][j], f); });
    }
    function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
    function step(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
    function words(s, mins) {
      var a = s.alt;
      if (a < -12) return 'Night';
      if (a < -4) return s.rising ? 'First light' : 'Dusk';
      if (a < 3) return s.rising ? 'Sunrise' : 'Sunset';
      if (a < 12) return s.rising ? 'Early light' : 'Golden hour';
      return mins < 660 ? 'Morning' : mins < 840 ? 'Midday' : 'Afternoon';
    }
    var state = {};
    function update() {
      var d = when(), s = sun(d), dark = isDark(), mins = lakeMinutes(d);
      var pal = palette(s.alt, dark);
      var low = 1 - step(10, 40, s.alt);
      state = {
        alt: s.alt, rising: s.rising, minutes: mins, dark: dark, pal: pal,
        // where the sun sits on screen: east on the left, west on the right, higher as it climbs
        sun: [clamp((s.az - 90) / 180, -.15, 1.15) * .84 + .08, .16 + clamp(s.alt, -12, 70) / 70 * .95],
        glow: step(-9, 1, s.alt) * (.45 + .55 * low) * (dark ? .8 : 1),
        sunc: mix([.8, .85, 1], mix([1, .95, .86], [1, .56, .3], low), step(-10, -2, s.alt)),
        stars: dark ? step(-3, -12, s.alt) : 0,
        words: words(s, mins),
        time: clock.format(d).replace(/^(\d+):(\d\d)$/, function (_, h, m) { h = +h; return ((h + 11) % 12 + 1) + ':' + m + (h < 12 ? ' am' : ' pm'); })
      };
      var css = function (c) { return 'rgb(' + c.map(function (v) { return Math.round(clamp(v, 0, 1) * 255); }).join(' ') + ')'; };
      root.style.setProperty('--sky', css(pal[2]));
      root.style.setProperty('--sky2', css(pal[3]));
      root.style.setProperty('--sun', css(state.sunc));
      document.querySelectorAll('[data-sky-text]').forEach(function (el) { el.textContent = state.words.toLowerCase() + ' on the lake, ' + state.time; });
      document.querySelectorAll('[data-sky-words]').forEach(function (el) { el.textContent = state.words + ' on the lake'; });
      document.querySelectorAll('[data-sky-time]').forEach(function (el) { el.textContent = state.time; });
      document.querySelectorAll('[data-sky]').forEach(function (el) { el.hidden = false; });
      listeners.forEach(function (f) { f(state); });
    }
    themeListeners.push(update);
    setInterval(function () { if (over == null) update(); }, 60000);
    var t0 = performance.now(), seed = Math.random() * 40;
    return {
      get: function () { return state; },
      on: function (f) { listeners.push(f); },
      update: update,
      set: function (m) { over = m; update(); },
      live: function () { return over == null; },
      minutes: function () { return lakeMinutes(when()); },
      t: function (now) { return seed + (now - t0) / 1000; },
      m: [.5, .5], vp: [innerWidth, innerHeight], ok: false
    };
  })();
  SKY.update();

  // the shader that draws the sky. The drops on the home page draw the same sky, bent through glass, so it is shared.
  var SKY_GLSL = [
    'uniform float t;uniform vec2 m;uniform vec3 a;uniform vec3 b;uniform vec3 k;uniform vec3 g;uniform vec2 sun;uniform vec3 sunc;uniform float glow;uniform float stars;uniform float asp;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}',
    'float fb(vec2 p){float v=0.,s=.5;for(int i=0;i<4;i++){v+=s*n(p);p=p*2.03+vec2(3.1,1.7);s*=.5;}return v;}',
    'vec3 sky(vec2 u){vec2 p=vec2(u.x*asp,u.y)*1.15+(m-.5)*.22;',
    ' vec2 q=vec2(fb(p+t*.022),fb(p+vec2(5.2,1.3)-t*.018));',
    ' vec2 w=vec2(fb(p+2.6*q+vec2(1.7,9.2)+t*.014),fb(p+2.6*q+vec2(8.3,2.8)-t*.012));',
    ' float s=fb(p+3.*w);float fold=smoothstep(.32,.78,s);',
    ' vec3 col=mix(a,b,fold);col=mix(col,k,smoothstep(.45,.95,length(w))*.36);col=mix(col,g,smoothstep(.42,.78,q.y)*.32);',
    ' col=mix(col,b,smoothstep(.15,1.,u.y)*.18);',
    ' vec2 d=(u-sun)*vec2(asp,1.);float r2=dot(d,d);',
    ' col=mix(col,sunc,clamp(exp(-r2*2.6)*glow*.62,0.,1.));col+=sunc*exp(-r2*38.)*glow*.22;',
    ' if(stars>0.){vec2 sp=vec2(u.x*asp,u.y)*95.;vec2 ce=floor(sp);float hs=h(ce);vec2 f=fract(sp)-.5-(vec2(h(ce+3.1),h(ce+7.7))-.5)*.6;',
    '  col+=step(.986,hs)*smoothstep(.07,0.,length(f))*(.55+.45*sin(t*1.3+hs*60.))*stars*(.25+.75*u.y)*vec3(.95,.95,1.);}',
    ' col+=(.5-abs(fract(s*5.)-.5))*.012;return col;}'
  ].join('\n');
  function skyUniforms(gl, U, st) {
    var p = st.pal;
    gl.uniform3fv(U.a, p[0]); gl.uniform3fv(U.b, p[1]); gl.uniform3fv(U.k, p[2]); gl.uniform3fv(U.g, p[3]);
    gl.uniform2fv(U.sun, st.sun); gl.uniform3fv(U.sunc, st.sunc); gl.uniform1f(U.glow, st.glow); gl.uniform1f(U.stars, st.stars);
  }
  function program(gl, fs, names) {
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; names.concat(['t', 'm', 'a', 'b', 'k', 'g', 'sun', 'sunc', 'glow', 'stars', 'asp']).forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    return U;
  }

  // ---------- the wallpaper behind every page ----------
  (function silk() {
    var c = document.getElementById('silk');
    if (!c) return;
    var gl = c.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) { c.remove(); return; }
    var U = program(gl, 'precision mediump float;uniform vec2 r;\n' + SKY_GLSL + '\nvoid main(){gl_FragColor=vec4(sky(gl_FragCoord.xy/r),1.);}', ['r']);
    if (!U) { c.remove(); return; }
    SKY.ok = true;
    var aim = [.5, .5], running = true;
    function size() {
      var s = Math.min(window.devicePixelRatio || 1, 2) * .5, w = c.clientWidth || innerWidth, h = c.clientHeight || innerHeight;
      SKY.vp = [w, h];
      c.width = Math.max(2, Math.round(w * s)); c.height = Math.max(2, Math.round(h * s));
      gl.viewport(0, 0, c.width, c.height); gl.uniform2f(U.r, c.width, c.height); gl.uniform1f(U.asp, w / h);
    }
    function draw(now) {
      var m = SKY.m;
      m[0] += (aim[0] - m[0]) * .04; m[1] += (aim[1] - m[1]) * .04;
      gl.uniform1f(U.t, SKY.t(now)); gl.uniform2fv(U.m, m);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (running && !still) requestAnimationFrame(draw);
    }
    skyUniforms(gl, U, SKY.get()); size();
    SKY.on(function (st) { skyUniforms(gl, U, st); if (still || !running) draw(performance.now()); });
    addEventListener('resize', function () { size(); if (still) draw(performance.now()); });
    addEventListener('pointermove', function (e) { aim[0] = e.clientX / innerWidth; aim[1] = 1 - e.clientY / innerHeight; }, { passive: true });
    document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running && !still) requestAnimationFrame(draw); });
    requestAnimationFrame(draw);
  })();

  // ---------- the sky pill: says what the light is doing, and lets you scrub through the day ----------
  (function skyPill() {
    var pill = document.querySelector('.sky-now'), panel = document.getElementById('sky-panel');
    if (!pill || !panel) return;
    var range = panel.querySelector('input'), out = panel.querySelector('output'), back = panel.querySelector('[data-sky-live]');
    function show() { range.value = SKY.minutes(); out.textContent = SKY.get().time; back.hidden = SKY.live(); }
    pill.addEventListener('click', function () {
      var open = panel.hidden;
      panel.hidden = !open; pill.setAttribute('aria-expanded', String(open));
      if (open) { show(); range.focus(); }
    });
    range.addEventListener('input', function () { SKY.set(+range.value); out.textContent = SKY.get().time; back.hidden = false; });
    back.addEventListener('click', function () { SKY.set(null); show(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; pill.setAttribute('aria-expanded', 'false'); pill.focus(); } });
  })();

  // ---------- the drops: Robert, Rachelle and River as three drops of liquid glass on the home page ----------
  (function drops() {
    var c = document.getElementById('drops'), pool = document.querySelector('.pool');
    if (!c || !pool || !SKY.ok) return;
    var gl = c.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'default' });
    if (!gl) return;
    var fs = [
      'precision highp float;',
      SKY_GLSL,
      'uniform float sc;uniform vec2 off;uniform vec2 vp;uniform vec2 C[3];uniform vec2 V[3];uniform float RR[3];uniform float R0;uniform vec2 L;uniform float dk;',
      'float smin(float a,float b,float kk){float hh=clamp(.5+.5*(b-a)/kk,0.,1.);return mix(b,a,hh)-kk*hh*(1.-hh);}',
      'float field(vec2 p){float d=1e5;for(int i=0;i<3;i++){vec2 q=p-C[i];float sp=length(V[i]);',
      ' if(sp>1.){vec2 dir=V[i]/sp;float st=1.+min(sp*.0007,.32);float al=dot(q,dir);q=(q-al*dir)*st+al*dir/st;}',
      ' d=smin(d,length(q)-RR[i],R0*.42);}return d;}',
      'vec3 at(vec2 p){return sky((p+off)/vp);}',
      'void main(){vec2 p=gl_FragCoord.xy/sc;float d=field(p);',
      ' if(d>R0*1.6){gl_FragColor=vec4(0.);return;}',
      // outside the glass: a soft shadow below, and light focused by the drop on the side away from the sun
      ' float ds=field(p+vec2(-L.x*6.,16.));float sh=(1.-smoothstep(-R0*.35,R0*.3,ds))*mix(.1,.32,dk);',
      ' float dc=field(p+L*R0*.62);float ca=smoothstep(R0*.15,-R0*.55,dc)*(1.-smoothstep(-R0*.55,-R0*.95,dc))*mix(.11,.12,dk);',
      ' sh+=smoothstep(2.5,0.,d)*(1.-dk)*.1;',
      ' vec4 outer=vec4(mix(vec3(.72,.78,1.),sunc,clamp(glow*1.6,0.,1.))*ca,sh);',
      ' float al=smoothstep(.9,-.9,d);',
      ' if(al<=0.){gl_FragColor=outer;return;}',
      // inside: bend the sky like a thick lens. Strong at the rim, a gentle magnification in the middle, colours split slightly at the edge.
      ' float e=1.;vec2 nn=normalize(vec2(field(p+vec2(e,0.))-field(p-vec2(e,0.)),field(p+vec2(0.,e))-field(p-vec2(0.,e)))+1e-6);',
      ' float depth=clamp(-d/(R0*.6),0.,1.);float bend=pow(1.-depth,2.4);',
      ' vec2 o=nn*(bend*R0*.85-depth*R0*.24);',
      ' vec3 col=vec3(at(p+o).r,at(p+o*1.1).g,at(p+o*1.22).b);',
      ' vec3 refl=at(p-nn*R0*1.4);col=mix(col,refl*mix(1.02,1.15,dk)+mix(.0,.05,dk),pow(1.-depth,5.)*mix(.22,.35,dk));',
      ' col=mix(col,vec3(1.),mix(.03,.03,dk)+mix(.05,.1,dk)*bend);',
      ' float lit=max(dot(nn,L),0.),back=max(dot(nn,-L),0.);',
      ' col+=vec3(1.)*pow(lit,2.5)*pow(1.-depth,4.)*mix(.95,.7,dk);',
      ' col+=sunc*pow(back,2.)*pow(1.-depth,7.)*.45;',
      ' col*=1.-pow(1.-depth,3.)*max(dot(nn,vec2(0.,-1.)),0.)*mix(.12,.3,dk);',
      ' col+=smoothstep(1.6,0.,abs(d))*mix(.45,.3,dk);',
      ' gl_FragColor=vec4(col*al,al)+outer*(1.-al);}'
    ].join('\n');
    var U = program(gl, fs, ['sc', 'off', 'vp', 'C', 'V', 'RR', 'R0', 'L', 'dk']);
    if (!U) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    root.classList.add('drops-on');

    var names = Array.prototype.slice.call(document.querySelectorAll('.drop-name'));
    var D = [0, 1, 2].map(function (i) { return { x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0, r: 60, ph: i * 2.1 }; });
    var W = 0, H = 0, sc = 1, R0 = 60, placed = false, grab = null, visible = true, moving = true, last = 0;
    function layout() {
      var cr = c.getBoundingClientRect(), pr = pool.getBoundingClientRect();
      W = cr.width; H = cr.height;
      sc = Math.min(window.devicePixelRatio || 1, 2) * (W > 900 ? .8 : 1);
      c.width = Math.max(2, Math.round(W * sc)); c.height = Math.max(2, Math.round(H * sc));
      gl.viewport(0, 0, c.width, c.height);
      var cx = pr.left - cr.left + pr.width / 2, cy = pr.top - cr.top + pr.height / 2;
      var r = Math.max(44, Math.min(118, Math.min(pr.width, pr.height) * .22));
      var spots = [[-1.32, -.38, 1], [1.24, -.62, .9], [.06, 1.22, .74]];
      D.forEach(function (d, i) {
        d.r = r * spots[i][2]; d.hx = cx + spots[i][0] * r; d.hy = cy + spots[i][1] * r;
        if (!placed) { d.x = d.hx; d.y = d.hy - 30 - i * 14; }
      });
      R0 = r * .88; placed = true; moving = true;
    }
    function frame(now) {
      var dt = Math.min(.033, last ? (now - last) / 1000 : .016); last = now;
      var tt = now / 1000, energy = 0;
      D.forEach(function (d, i) {
        var tx = d.hx, ty = d.hy, k = 55, damp = 6.5;
        if (!still) { tx += Math.sin(tt * .32 + d.ph) * d.r * .14; ty += Math.cos(tt * .27 + d.ph * 1.7) * d.r * .12; }
        if (grab && grab.i === i) { tx = grab.x; ty = grab.y; k = 420; damp = 26; }
        d.vx += (tx - d.x) * k * dt; d.vy += (ty - d.y) * k * dt;
        var f = Math.exp(-damp * dt); d.vx *= f; d.vy *= f;
        d.x += d.vx * dt; d.y += d.vy * dt;
        energy += Math.abs(d.vx) + Math.abs(d.vy) + Math.abs(tx - d.x) + Math.abs(ty - d.y);
        if (names[i]) names[i].style.transform = 'translate(' + d.x.toFixed(1) + 'px,' + d.y.toFixed(1) + 'px) translate(-50%,-50%)';
      });
      moving = energy > .5 || !!grab;
      var cr = c.getBoundingClientRect(), st = SKY.get();
      gl.uniform1f(U.t, SKY.t(now)); gl.uniform2fv(U.m, SKY.m);
      gl.uniform1f(U.sc, sc); gl.uniform2f(U.vp, SKY.vp[0], SKY.vp[1]); gl.uniform1f(U.asp, SKY.vp[0] / SKY.vp[1]);
      gl.uniform2f(U.off, cr.left, SKY.vp[1] - cr.bottom);
      gl.uniform2fv(U.C, [D[0].x, H - D[0].y, D[1].x, H - D[1].y, D[2].x, H - D[2].y]);
      gl.uniform2fv(U.V, [D[0].vx, -D[0].vy, D[1].vx, -D[1].vy, D[2].vx, -D[2].vy]);
      gl.uniform1fv(U.RR, [D[0].r, D[1].r, D[2].r]); gl.uniform1f(U.R0, R0);
      // light comes from wherever the sun is on screen
      var lx = st.sun[0] * SKY.vp[0] - (cr.left + W / 2), ly = st.sun[1] * SKY.vp[1] - (SKY.vp[1] - cr.bottom + H / 2);
      var ll = Math.hypot(lx, ly) || 1; gl.uniform2f(U.L, lx / ll, ly / ll);
      gl.uniform1f(U.dk, st.dark ? 1 : 0);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (visible && !document.hidden && (!still || moving)) requestAnimationFrame(frame); else last = 0;
    }
    function kick() { if (!last) requestAnimationFrame(frame); }
    function apply(st) { skyUniforms(gl, U, st); kick(); }
    function local(e) { var r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function hit(x, y) {
      var best = -1, bd = 1e9;
      D.forEach(function (d, i) { var dd = Math.hypot(x - d.x, y - d.y); if (dd < d.r * 1.12 && dd < bd) { bd = dd; best = i; } });
      return best;
    }
    // the drops sit under the words, so listen on the whole hero and only take the pointer when it lands on a drop
    var hero = c.parentElement;
    hero.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a, button, input')) return;
      var p = local(e), i = hit(p[0], p[1]);
      if (i < 0) return;
      grab = { i: i, x: p[0], y: p[1], sx: p[0], sy: p[1], id: e.pointerId, moved: false };
      try { hero.setPointerCapture(e.pointerId); } catch (er) {}
      hero.classList.add('grabbing'); kick();
    });
    hero.addEventListener('touchstart', function (e) {
      if (e.target.closest('a, button, input')) return;
      var t = e.touches[0], r = c.getBoundingClientRect();
      if (hit(t.clientX - r.left, t.clientY - r.top) >= 0) e.preventDefault();
    }, { passive: false });
    hero.addEventListener('pointermove', function (e) {
      var p = local(e);
      if (grab && e.pointerId === grab.id) {
        grab.x = p[0]; grab.y = p[1];
        if (Math.hypot(p[0] - grab.sx, p[1] - grab.sy) > 6) grab.moved = true;
        return;
      }
      if (e.pointerType === 'mouse') hero.classList.toggle('over-drop', hit(p[0], p[1]) >= 0);
    });
    function drop(e) {
      if (!grab || e.pointerId !== grab.id) return;
      // a tap without a drag makes the drop jump
      if (!grab.moved) { var d = D[grab.i]; d.vy -= 900; d.vx += (Math.random() - .5) * 500; }
      grab = null; hero.classList.remove('grabbing'); kick();
    }
    hero.addEventListener('pointerup', drop);
    hero.addEventListener('pointercancel', drop);
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }).observe(c);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    addEventListener('resize', function () { layout(); kick(); });
    SKY.on(apply);
    layout(); apply(SKY.get());
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

  // ---------- blog: search the posts and filter by topic. The address keeps the topic, so /blog/#sailing can be shared ----------
  (function blog() {
    var bar = document.getElementById('filters'), form = document.getElementById('search');
    if (!bar) return;
    var list = document.querySelector('.list'), items = [].slice.call(list.querySelectorAll('li[data-topics]')), none = document.getElementById('filter-empty');
    var box = form && form.elements.q, topic = '', index = null, loading = null;
    items.forEach(function (li, i) { li._order = i; li._url = li.querySelector('a').getAttribute('href'); });
    function words(text) { return text.toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w.length > 1; }); }
    function score(post, terms) { // every word has to appear; titles count most
      var total = 0, t = post.t.toLowerCase(), s = post.s.toLowerCase(), x = post.x.toLowerCase();
      for (var i = 0; i < terms.length; i++) {
        var hit = (t.indexOf(terms[i]) >= 0 ? 6 : 0) + (s.indexOf(terms[i]) >= 0 ? 3 : 0) + (x.indexOf(terms[i]) >= 0 ? 1 : 0);
        if (!hit) return 0;
        total += hit;
      }
      return total;
    }
    function apply() {
      var terms = box ? words(box.value) : [], shown = 0;
      if (terms.length && !index) { load(); return; }
      items.forEach(function (li) {
        var on = !topic || (' ' + li.dataset.topics + ' ').indexOf(' ' + topic + ' ') >= 0;
        li._score = terms.length ? score(index[li._url] || { t: '', s: '', x: '' }, terms) : 1;
        li.hidden = !(on && li._score); if (!li.hidden) shown++;
      });
      items.slice().sort(function (a, b) { return terms.length ? b._score - a._score || a._order - b._order : a._order - b._order; })
        .forEach(function (li) { list.appendChild(li); });
      [].forEach.call(bar.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.topic === topic)); });
      if (none) none.hidden = shown > 0;
    }
    function load() {
      loading = loading || fetch('/search.json').then(function (r) { return r.json(); }).then(function (posts) {
        index = {}; posts.forEach(function (p) { index[p.u] = p; }); apply();
      }).catch(function () { loading = null; });
    }
    function setTopic(t) { topic = bar.querySelector('[data-topic="' + t.replace(/[^a-z0-9-]/g, '') + '"]') ? t : ''; apply(); }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-topic]');
      if (!b) return;
      history.replaceState(null, '', b.dataset.topic ? '#' + b.dataset.topic : location.pathname + location.search);
      setTopic(b.dataset.topic);
    });
    addEventListener('hashchange', function () { setTopic(location.hash.slice(1)); });
    if (box) {
      box.value = new URLSearchParams(location.search).get('q') || '';
      box.addEventListener('focus', load, { once: true });
      box.addEventListener('input', apply);
      form.addEventListener('submit', function (e) { e.preventDefault(); apply(); });
    }
    setTopic(location.hash.slice(1));
  })();

  // ---------- copy buttons on the "Try this yourself" prompts ----------
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]');
    if (!b) return;
    var text = b.parentNode.querySelector('.prompt').textContent, label = 'Copy the prompt';
    var done = function (ok) { b.textContent = ok ? 'Copied' : 'Select the text and copy it'; setTimeout(function () { b.textContent = label; }, 2200); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); }); else done(false);
  });

  // ---------- ask the site ----------
  (function ask() {
    var form = document.getElementById('ask');
    if (!form) return;
    var box = form.elements.q, msg = document.getElementById('ask-msg'), out = document.getElementById('ask-out'), btn = form.querySelector('[type=submit]');
    document.getElementById('ask-ideas').addEventListener('click', function (e) {
      if (e.target.tagName !== 'BUTTON') return;
      box.value = e.target.textContent; form.requestSubmit ? form.requestSubmit() : btn.click();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = box.value.trim();
      if (q.length < 5) { box.focus(); return; }
      btn.disabled = true; msg.className = 'form-msg'; msg.textContent = 'Reading the posts';
      fetch('/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: q }) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || ''); return d; }); })
        .then(function (d) {
          out.textContent = '';
          String(d.answer).split(/\n{2,}/).forEach(function (para) { var p = document.createElement('p'); p.textContent = para.trim(); if (p.textContent) out.appendChild(p); });
          if (d.sources && d.sources.length) {
            var h = document.createElement('h2'), ul = document.createElement('ul');
            h.textContent = 'Posts it used';
            d.sources.forEach(function (s) { var li = document.createElement('li'), a = document.createElement('a'); a.href = s.url; a.textContent = s.title; li.appendChild(a); ul.appendChild(li); });
            out.appendChild(h); out.appendChild(ul);
          }
          out.hidden = false; msg.textContent = '';
        })
        .catch(function (err) {
          msg.className = 'form-msg bad';
          msg.textContent = err.message && !/fetch|JSON|token/i.test(err.message) ? err.message : 'That did not go through. Try again in a minute.';
        })
        .then(function () { btn.disabled = false; });
    });
  })();

  // ---------- games page: save a game for offline play, and install the site ----------
  (function offline() {
    var box = document.getElementById('offline');
    if (!box || !('caches' in window) || !('serviceWorker' in navigator)) return;
    var msg = document.getElementById('save-msg'), install = document.getElementById('install'), files = null, prompt = null;
    box.hidden = false;
    var saved = function (slug) { try { return localStorage.getItem('r3-saved-' + slug) === '1'; } catch (e) { return false; } };
    [].forEach.call(box.querySelectorAll('[data-save]'), function (b) {
      b._label = b.textContent;
      if (saved(b.dataset.save)) { b.textContent = b._label.replace(/^Save/, 'Saved:').replace(/ \(.*\)$/, ''); b.setAttribute('aria-pressed', 'true'); }
      b.addEventListener('click', function () {
        b.disabled = true;
        (files ? Promise.resolve(files) : fetch('/games/offline.json').then(function (r) { return r.json(); })).then(function (all) {
          files = all;
          var list = all[b.dataset.save] || [], done = 0;
          return caches.open('r3-saved').then(function (cache) {
            // a few at a time, so a phone on a slow connection is not asked for 100 files at once
            var queue = list.slice(), workers = [0, 1, 2, 3].map(function next() {
              var url = queue.shift();
              if (!url) return Promise.resolve();
              var outside = /^https:/.test(url);
              return fetch(url, outside ? { mode: 'no-cors' } : {}).then(function (res) {
                if (!outside && !res.ok) throw new Error(url);
                return cache.put(url, res);
              }).then(function () { msg.textContent = 'Saving ' + (++done) + ' of ' + list.length; return next(); });
            });
            return Promise.all(workers);
          });
        }).then(function () {
          try { localStorage.setItem('r3-saved-' + b.dataset.save, '1'); } catch (e) {}
          b.textContent = b._label.replace(/^Save/, 'Saved:').replace(/ \(.*\)$/, ''); b.setAttribute('aria-pressed', 'true');
          msg.textContent = 'Saved. It will now open without a connection on this device.';
        }).catch(function () { msg.textContent = 'That did not finish saving. Check your connection and try again.'; })
          .then(function () { b.disabled = false; });
      });
    });
    addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); prompt = e; install.hidden = false; });
    install.addEventListener('click', function () { if (prompt) { prompt.prompt(); prompt = null; install.hidden = true; } });
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !navigator.standalone) document.getElementById('ios-hint').hidden = false;
  })();

  // ---------- the service worker: makes the site installable and keeps visited pages for offline ----------
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('/sw.js').catch(function () {});

  // ---------- count the visit: the page address and nothing else. No cookies, and skipped if the browser asks not to be tracked ----------
  (function count() {
    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl || !navigator.sendBeacon) return;
    var send = function (path) { try { navigator.sendBeacon('/api/hit', JSON.stringify({ p: path })); } catch (e) {} };
    var page = function () { send(location.pathname); };
    if (document.prerendering) document.addEventListener('prerenderingchange', page, { once: true }); else page();
    // the games are stand-alone pages, so count them when someone presses Play
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="/games/"]');
      if (a && a.getAttribute('href') !== '/games/') send(a.getAttribute('href'));
    });
  })();

  // ---------- request page: the list of topics readers have asked for ----------
  (function asked() {
    var box = document.getElementById('asked'), list = document.getElementById('asked-list');
    if (!box) return;
    var LABEL = { asked: 'On the list', writing: 'Being written', posted: 'Posted' }, SIDE = { work: 'At work', home: 'At home' };
    fetch('/api/requests').then(function (r) { return r.json(); }).then(function (d) {
      if (!d.requests || !d.requests.length) return;
      d.requests.forEach(function (q) {
        var li = document.createElement('li'), row = document.createElement(q.status === 'posted' && /^\/blog\//.test(q.url || '') ? 'a' : 'div');
        if (row.tagName === 'A') row.href = q.url;
        var chips = document.createElement('div'), state = document.createElement('span'), h = document.createElement('h3');
        chips.className = 'chips'; state.className = 'chip' + (q.status === 'posted' ? ' live' : ''); state.textContent = LABEL[q.status] || '';
        chips.appendChild(state);
        if (SIDE[q.side]) { var side = document.createElement('span'); side.className = 'chip'; side.textContent = SIDE[q.side]; chips.appendChild(side); }
        h.textContent = q.title;
        row.appendChild(chips); row.appendChild(h); li.appendChild(row); list.appendChild(li);
      });
      box.hidden = false;
    }).catch(function () {});
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
