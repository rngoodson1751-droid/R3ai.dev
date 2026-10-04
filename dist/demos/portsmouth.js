// Portsmouth yardstick calculator, used inside the scoring post.
// Corrected time = elapsed time x 100 / the boat's Portsmouth number. Lowest corrected time wins.
(function () {
  var root = document.getElementById('w-portsmouth');
  if (!root) return;
  var rows = [{ boat: 'Flying Scot', pn: '90', time: '45:00' }, { boat: 'Sunfish', pn: '100', time: '49:00' }];
  var esc = function (v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  function seconds(text) { // accepts 49, 49:30 or 1:02:15
    var parts = String(text).trim().split(':').map(Number);
    if (!parts.length || parts.length > 3 || parts.some(function (n) { return !isFinite(n) || n < 0; }) || !String(text).trim()) return 0;
    return parts.length === 1 ? parts[0] * 60 : parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  function clock(s) {
    s = Math.round(s);
    var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x;
  }
  function results() {
    var done = rows.map(function (r) { var t = seconds(r.time), pn = parseFloat(r.pn); return t && pn > 0 ? { boat: r.boat.trim() || 'Boat', elapsed: t, corrected: t * 100 / pn } : null; })
      .filter(Boolean).sort(function (a, b) { return a.corrected - b.corrected; });
    if (done.length < 2) return '<p class="hint">Enter at least two boats to see the standings.</p>';
    return '<div class="scroll"><table><thead><tr><th scope="col">Place</th><th scope="col">Boat</th><th scope="col">Elapsed</th><th scope="col">Corrected</th><th scope="col">Behind</th></tr></thead><tbody>' +
      done.map(function (r, i) {
        var tie = i && Math.round(r.corrected) === Math.round(done[i - 1].corrected);
        return '<tr><td>' + (tie ? 'Tie' : i + 1) + '</td><td>' + esc(r.boat) + '</td><td>' + clock(r.elapsed) + '</td><td><strong>' + clock(r.corrected) + '</strong></td><td>' + (i ? clock(r.corrected - done[0].corrected) : 'Winner') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function draw() {
    root.innerHTML = '<div class="quotes">' + rows.map(function (r, i) {
      return '<div class="quote boat"><label class="field"><span>Boat</span><input class="input" data-i="' + i + '" data-k="boat" value="' + esc(r.boat) + '"></label>' +
        '<label class="field"><span>Portsmouth number</span><input class="input" inputmode="decimal" data-i="' + i + '" data-k="pn" value="' + esc(r.pn) + '"></label>' +
        '<label class="field"><span>Elapsed time</span><input class="input" data-i="' + i + '" data-k="time" value="' + esc(r.time) + '" placeholder="49:30"></label>' +
        '<button class="btn glass sm" type="button" data-del="' + i + '" aria-label="Remove ' + esc(r.boat || 'boat') + '"' + (rows.length <= 2 ? ' disabled' : '') + '>Remove</button></div>';
    }).join('') + '</div><p><button class="btn glass sm" type="button" data-add>Add a boat</button></p>' +
      '<p class="hint">Enter time as minutes and seconds, like 49:30, or hours too, like 1:02:15.</p><div id="pn-out" aria-live="polite">' + results() + '</div>';
  }
  root.addEventListener('input', function (e) {
    var t = e.target;
    if (!t.dataset.k) return;
    rows[+t.dataset.i][t.dataset.k] = t.value;
    document.getElementById('pn-out').innerHTML = results();
  });
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.del != null) rows.splice(+b.dataset.del, 1);
    else if ('add' in b.dataset) rows.push({ boat: '', pn: '', time: '' });
    else return;
    draw();
    if ('add' in b.dataset) { var all = root.querySelectorAll('[data-k="boat"]'); all[all.length - 1].focus(); }
  });
  root.classList.add('sheet');
  draw();
})();
