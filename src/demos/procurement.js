// Demo of the procurement wizard. Nothing typed here is saved or sent anywhere.
// The limits below come from the write-up; other agencies will have their own.
(function () {
  var root = document.getElementById('wizard');
  if (!root) return;
  var MICRO = 15000, SMALL = 60000;
  var BASIS = [
    'Compared with a recent price paid for the same item',
    'Compared with a current catalog, price list or online listing',
    'Compared with the price of similar items',
    'Personal knowledge of the item and the market'
  ];
  var DBE = ['Not known', 'Yes', 'No'];
  var fresh = function () {
    return { step: 0, what: '', amount: '', vendor: '', dbe: DBE[0], basis: '', notes: '',
      quotes: [{ v: '', a: '', d: DBE[0] }, { v: '', a: '', d: DBE[0] }, { v: '', a: '', d: DBE[0] }], pick: -1, why: '', sam: '', samDate: '', by: '', error: '' };
  };
  var s = fresh();
  var esc = function (v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var money = function (v) { return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var whole = function (v) { return '$' + Number(v).toLocaleString('en-US'); };
  var niceDate = function (iso) { var d = new Date(iso + 'T12:00:00'); return isNaN(d) ? iso : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); };
  var amount = function (v) { var n = parseFloat(String(v).replace(/[$,\s]/g, '')); return isFinite(n) && n > 0 ? n : 0; };
  var tier = function () { var a = amount(s.amount); return !a ? '' : a <= MICRO ? 'micro' : a <= SMALL ? 'small' : 'over'; };
  var done = function () { return s.quotes.filter(function (q) { return q.v.trim() && amount(q.a); }); };
  var lowest = function () { var best = -1; s.quotes.forEach(function (q, i) { if (q.v.trim() && amount(q.a) && (best < 0 || amount(q.a) < amount(s.quotes[best].a))) best = i; }); return best; };
  var today = function () { return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); };

  function field(label, key, opts) {
    opts = opts || {};
    return '<label class="field"><span>' + label + (opts.hint ? ' <small>' + opts.hint + '</small>' : '') + '</span>' +
      (opts.area ? '<textarea class="input" data-f="' + key + '" rows="3">' + esc(s[key]) + '</textarea>'
        : '<input class="input" data-f="' + key + '" value="' + esc(s[key]) + '"' + (opts.type ? ' type="' + opts.type + '"' : '') + (opts.mode ? ' inputmode="' + opts.mode + '"' : '') + (opts.ph ? ' placeholder="' + opts.ph + '"' : '') + '>') + '</label>';
  }
  function radios(legend, key, list) {
    return '<fieldset class="field pick stack"><legend>' + legend + '</legend>' + list.map(function (o) {
      return '<label><input type="radio" name="wz-' + key + '" data-f="' + key + '" value="' + esc(o) + '"' + (s[key] === o ? ' checked' : '') + '>' + o + '</label>';
    }).join('') + '</fieldset>';
  }
  function tierNote() {
    var t = tier();
    if (!t) return '';
    if (t === 'micro') return '<p class="demo-status">Up to ' + whole(MICRO) + ' is a <strong>micro-purchase</strong>. You need Form B-1, which records why the price is fair and reasonable. No quotes are required.</p>';
    if (t === 'small') return '<p class="demo-status">Over ' + whole(MICRO) + ' and up to ' + whole(SMALL) + ' is a <strong>small purchase</strong>. You need Form B-2 and three quotes.</p>';
    return '<p class="demo-status bad">Over ' + whole(SMALL) + ' needs a formal procurement. That uses other forms, which this tool does not cover.</p>';
  }
  function pickHtml() {
    var low = lowest(), h = '';
    if (done().length < 2) return h;
    h += '<fieldset class="field pick stack"><legend>Which one are you buying from?</legend>' + s.quotes.map(function (q, i) {
      if (!q.v.trim() || !amount(q.a)) return '';
      return '<label><input type="radio" name="wz-pick" data-pick="' + i + '"' + ((s.pick < 0 ? low : s.pick) === i ? ' checked' : '') + '>' + esc(q.v) + ', ' + money(amount(q.a)) + (i === low ? ' (lowest)' : '') + '</label>';
    }).join('') + '</fieldset>';
    if (s.pick >= 0 && s.pick !== low) h += field('Why not the lowest quote?', 'why', { area: true });
    return h;
  }
  var STEPS = ['The purchase', 'The price', 'Vendor check', 'Your form'];

  function view() {
    var t = tier(), h = '<ol class="steps">' + STEPS.map(function (n, i) { return '<li class="' + (i === s.step ? 'on' : i < s.step ? 'did' : '') + '"' + (i === s.step ? ' aria-current="step"' : '') + '><span>' + (i + 1) + '</span>' + n + '</li>'; }).join('') + '</ol>';
    if (s.step === 0) {
      h += '<h2 tabindex="-1">What are you buying?</h2>' + field('Describe the purchase', 'what', { ph: 'Example: 12 replacement bus seat cushions' }) +
        field('Total cost, including shipping', 'amount', { mode: 'decimal', ph: 'Example: 4,250' }) + '<div id="wz-tier">' + tierNote() + '</div>';
    } else if (s.step === 1 && t === 'micro') {
      h += '<h2 tabindex="-1">Who are you buying from, and is the price fair?</h2>' + field('Vendor', 'vendor') + radios('Is the vendor a certified DBE?', 'dbe', DBE) +
        radios('How do you know the price is fair and reasonable?', 'basis', BASIS) + field('What did you compare it with?', 'notes', { area: true, hint: 'optional' });
    } else if (s.step === 1) {
      var low = lowest();
      h += '<h2 tabindex="-1">Who gave you quotes?</h2><p class="hint">A small purchase needs three. List everyone you asked.</p><div class="quotes">' + s.quotes.map(function (q, i) {
        return '<div class="quote"><label class="field"><span>Vendor ' + (i + 1) + '</span><input class="input" data-q="' + i + '" data-k="v" value="' + esc(q.v) + '"></label>' +
          '<label class="field"><span>Quote</span><input class="input" inputmode="decimal" data-q="' + i + '" data-k="a" value="' + esc(q.a) + '"></label>' +
          '<label class="field"><span>DBE?</span><select class="input" data-q="' + i + '" data-k="d">' + DBE.map(function (d) { return '<option' + (d === q.d ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select></label></div>';
      }).join('') + '</div><p><button class="btn glass sm" type="button" data-act="add">Add another quote</button></p>';
      h += '<div id="wz-pick">' + pickHtml() + '</div>';
    } else if (s.step === 2) {
      h += '<h2 tabindex="-1">Have you checked the vendor on SAM.gov?</h2><p class="hint">SAM.gov lists vendors that are barred from federal work. The check is required at every dollar amount, even the smallest.</p>' +
        radios('SAM.gov check', 'sam', ['Yes, no active exclusions', 'Not yet']) +
        (s.sam === 'Not yet' ? '<p class="demo-status bad">Stop here and run the check before you buy. Come back when it is done.</p>' : '') +
        (s.sam && s.sam !== 'Not yet' ? field('Date you checked', 'samDate', { type: 'date' }) : '') + field('Prepared by', 'by', { ph: 'Your name' });
    } else h += form();
    if (s.error) h += '<p class="demo-status bad" role="alert">' + s.error + '</p>';
    h += '<div class="acts demo-controls">' + (s.step > 0 ? '<button class="btn glass" type="button" data-act="back">Back</button>' : '') +
      (s.step < 3 ? '<button class="btn" type="button" data-act="next">' + (s.step === 2 ? 'Make the form' : 'Next') + '</button>'
        : '<button class="btn" type="button" data-act="print">Print</button><button class="btn glass" type="button" data-act="over">Start over</button>') + '</div>';
    root.innerHTML = h;
  }
  function row(k, v) { return '<tr><th scope="row">' + k + '</th><td>' + v + '</td></tr>'; }
  function form() {
    var micro = tier() === 'micro', low = lowest(), pick = s.pick < 0 ? low : s.pick, h;
    h = '<div class="paper"><p class="sample">Sample form for demonstration</p><h2 tabindex="-1">Form B-' + (micro ? '1: Micro-purchase price determination' : '2: Small purchase record') + '</h2><table>' +
      row('Purchase', esc(s.what)) + row(micro ? 'Total cost' : 'Estimated cost', money(amount(s.amount)));
    if (micro) {
      h += row('Vendor', esc(s.vendor)) + row('Certified DBE', s.dbe) + row('Price is fair and reasonable because', s.basis + (s.notes.trim() ? '<br>' + esc(s.notes) : ''));
    } else {
      h += '</table><h3>Quotes received</h3><table class="grid"><tr><th scope="col">Vendor</th><th scope="col">Quote</th><th scope="col">DBE</th><th scope="col">Selected</th></tr>' +
        s.quotes.map(function (q, i) { return q.v.trim() && amount(q.a) ? '<tr><td>' + esc(q.v) + '</td><td>' + money(amount(q.a)) + (i === low ? ' (lowest)' : '') + '</td><td>' + q.d + '</td><td>' + (i === pick ? 'Yes' : '') + '</td></tr>' : ''; }).join('') +
        '</table><table>' + row('Selected vendor', esc(s.quotes[pick].v) + ', ' + money(amount(s.quotes[pick].a))) + (pick !== low ? row('Reason the lowest quote was not selected', esc(s.why)) : row('Basis for selection', 'Lowest quote received'));
    }
    return h + row('SAM.gov check', 'No active exclusions found' + (s.samDate ? ', checked ' + esc(niceDate(s.samDate)) : '')) + row('Prepared by', esc(s.by)) + row('Date', today()) +
      '</table><p class="sign">Signature <span></span></p></div>';
  }
  function check() {
    var t = tier();
    if (s.pick >= 0 && !(s.quotes[s.pick].v.trim() && amount(s.quotes[s.pick].a))) s.pick = -1;
    if (s.step === 0) return !s.what.trim() ? 'Describe what you are buying.' : !t ? 'Enter the total cost as a number.' : t === 'over' ? 'This purchase is over the small purchase limit, so the wizard stops here.' : '';
    if (s.step === 1 && t === 'micro') return !s.vendor.trim() ? 'Enter the vendor.' : !s.basis ? 'Choose how you know the price is fair.' : '';
    if (s.step === 1) {
      var n = done().length, low = lowest();
      if (n < 3) return 'A small purchase needs three quotes. You have ' + (n === 0 ? 'none' : n === 1 ? 'one' : 'two') + '.';
      if (s.pick >= 0 && s.pick !== low && !s.why.trim()) return 'Explain why you are not buying from the lowest quote.';
      return '';
    }
    if (s.step === 2) return !s.sam ? 'Answer the SAM.gov question.' : s.sam === 'Not yet' ? 'The vendor check has to be done before the form can be made.' : !s.by.trim() ? 'Enter your name.' : '';
    return '';
  }
  function go() { view(); var h = root.querySelector('h2'); if (h) h.focus(); }
  root.addEventListener('input', function (e) {
    var t = e.target, alert = root.querySelector('[role=alert]');
    if (alert) { alert.remove(); s.error = ''; }
    if (t.dataset.q) { s.quotes[+t.dataset.q][t.dataset.k] = t.value; document.getElementById('wz-pick').innerHTML = pickHtml(); return; }
    if (!t.dataset.f || t.type === 'radio') return;
    s[t.dataset.f] = t.value;
    if (t.dataset.f === 'amount') document.getElementById('wz-tier').innerHTML = tierNote();
  });
  root.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.pick) { s.pick = +t.dataset.pick; document.getElementById('wz-pick').innerHTML = pickHtml(); var p = root.querySelector('[data-pick="' + s.pick + '"]'); if (p) p.focus(); return; }
    if (t.type === 'radio' && t.dataset.f) { s[t.dataset.f] = t.value; if (t.dataset.f === 'sam') { s.error = ''; view(); var r = root.querySelector('[name="wz-sam"]:checked'); if (r) r.focus(); } return; }
  });
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b) return;
    var act = b.dataset.act;
    if (act === 'print') { window.print(); return; }
    if (act === 'add') { s.quotes.push({ v: '', a: '', d: DBE[0] }); view(); var all = root.querySelectorAll('[data-k="v"]'); all[all.length - 1].focus(); return; }
    if (act === 'over') s = fresh();
    else if (act === 'back') { s.step--; s.error = ''; }
    else { s.error = check(); if (!s.error) s.step++; }
    go();
  });
  view();
})();
