// r3ai.dev: small progressive enhancements. The site works without any of this.
(function () {
  var root = document.documentElement;
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

  // ---------- the cube: turns slowly, and you can spin it ----------
  (function cube() {
    var scene = document.querySelector('.scene'), el = scene && scene.querySelector('.cube');
    if (!el) return;
    var rx = -20, ry = -32, vx = 0, vy = still ? 0 : -.12, drag = null, idle = still ? 0 : -.12;
    function frame() {
      if (!drag) { ry += vy; rx += vx; vy += (idle - vy) * .02; vx *= .94; rx += (-20 - rx) * .02; }
      el.style.setProperty('--rx', rx.toFixed(2) + 'deg'); el.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      requestAnimationFrame(frame);
    }
    scene.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; scene.setPointerCapture(e.pointerId); });
    scene.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
      ry += dx * .5; rx = Math.max(-70, Math.min(70, rx - dy * .5)); vy = dx * .5; vx = -dy * .5;
    });
    var end = function () { drag = null; };
    scene.addEventListener('pointerup', end); scene.addEventListener('pointercancel', end);
    requestAnimationFrame(frame);
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
