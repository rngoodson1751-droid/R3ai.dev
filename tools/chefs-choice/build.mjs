// Builds static/chefs-choice/index.html from the four recipe files beside this script.
// Run: node tools/chefs-choice/build.mjs  (then node build.mjs at the repo root)
// Every recipe is written into the page as a menu entry, so the page works without JavaScript;
// the script at the bottom adds the random pick, filters, deep links and printing.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const parts = await Promise.all([1, 2, 3, 4].map(n => import(`./meals-${n}.mjs`)));
const meals = parts.flatMap(p => p.default);
if (meals.length !== 100) throw new Error(`expected 100 meals, found ${meals.length}`);
if (/[—–]/.test(JSON.stringify(meals))) throw new Error('no em or en dashes in site copy');

const KINDS = ['Poultry', 'Beef', 'Pork', 'Lamb', 'Seafood', 'Vegetarian'];
const LABEL = { Poultry: 'Poultry', Beef: 'Beef', Pork: 'Pork', Lamb: 'Lamb', Seafood: 'From the water', Vegetarian: 'From the garden' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FR = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾' };
const frac = s => esc(s).replace(/(\d+) (1\/2|1\/3|2\/3|1\/4|3\/4)\b/g, (_, w, f) => w + FR[f]).replace(/\b(1\/2|1\/3|2\/3|1\/4|3\/4)\b/g, f => FR[f]);
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const time = t => t < 60 ? `${t} min` : `${Math.floor(t / 60)} hr${t % 60 ? ` ${t % 60} min` : ''}`;

const recipe = m => `
<p class="dek">${frac(m.d)}</p>
<p class="facts"><span>${esc(m.c)}</span><span>Serves ${m.s}</span><span>${time(m.t)}</span></p>
<div class="cols">
<section class="ing"><h4>You will need</h4><ul>${m.i.map(x => `<li>${frac(x)}</li>`).join('')}</ul></section>
<section class="how"><h4>Method</h4><ol>${m.m.map(x => `<li>${frac(x)}</li>`).join('')}</ol></section>
</div>`;

const menu = KINDS.map(k => {
  const list = meals.filter(m => m.k === k).sort((a, b) => a.n.localeCompare(b.n));
  return `<section class="course" id="course-${slug(k)}">
<h3>${LABEL[k]} <small>${list.length}</small></h3>
${list.map(m => `<details class="dish" id="${slug(m.n)}" data-k="${m.k}" data-t="${m.t}">
<summary><span class="dn">${esc(m.n)}</span><span class="dots" aria-hidden="true"></span><span class="dm"><span class="dc">${esc(m.c)}, </span>${time(m.t)}</span></summary>
<div class="rx">${recipe(m)}</div>
</details>`).join('\n')}
</section>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Chef's Choice · R Cubed</title>
<meta name="description" content="One hundred dinners with full recipes. Press the button and the house picks tonight's dish.">
<link rel="canonical" href="https://r3ai.dev/chefs-choice/">
<meta property="og:title" content="Chef's Choice">
<meta property="og:description" content="One hundred dinners with full recipes. Press the button and the house picks tonight's dish.">
<meta property="og:image" content="https://r3ai.dev/og/default.jpg">
<meta name="theme-color" content="#0f2e28">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..600&family=Jost:wght@400;500;600&display=swap" rel="stylesheet">
<style>
/* Chef's Choice. One page, no libraries. Its own supper-club look, not the site's glass style. */
:root {
  --room: #0f2e28; --room-2: #164a45; --mist: #b9d3c8;
  --paper: #eef4ef; --ink: #1c2b3a; --ink-soft: #4b5d6a;
  --brass: #c4a35a; --brass-ink: #7d6328;
  --display: 'Bodoni Moda', 'Didot', 'Bodoni 72', Georgia, serif;
  --body: 'Jost', 'Futura', 'Avenir Next', system-ui, sans-serif;
  color-scheme: dark;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
body {
  margin: 0; min-height: 100vh; color: var(--mist); font: 400 1.0625rem/1.6 var(--body);
  background: radial-gradient(120% 80% at 50% -10%, var(--room-2), var(--room) 60%) fixed, var(--room);
}
a { color: inherit; }
:focus-visible { outline: 2px solid var(--brass); outline-offset: 3px; border-radius: 4px; }
.wrap { width: min(100% - 32px, 60rem); margin-inline: auto; }

.top { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; font-size: .95rem; }
.top a { text-decoration: none; opacity: .8; }
.top a:hover { opacity: 1; }
.top .home b { font-family: var(--display); font-weight: 500; font-size: 1.2rem; }

.masthead { text-align: center; padding: 2.5rem 0 1.75rem; }
.masthead h1 { margin: 0; font: italic 500 clamp(3.2rem, 11vw, 6.5rem)/.95 var(--display); color: var(--paper); letter-spacing: -.02em; font-variation-settings: 'opsz' 96; }
.masthead .orn { display: block; width: 7.5rem; height: 14px; margin: 1.1rem auto; color: var(--brass); }
.masthead p { margin: 0 auto; max-width: 30rem; font-size: 1.08rem; color: var(--mist); text-wrap: balance; }

.controls { display: none; text-align: center; margin: 1.25rem 0 1.75rem; }
.js .controls { display: block; }
.chips { display: flex; flex-wrap: wrap; justify-content: center; gap: .45rem; border: 0; padding: 0; margin: 0 0 .85rem; }
.chips legend { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.chips label { position: relative; }
.chips input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.chips span { display: inline-block; padding: .38rem .95rem; border-radius: 999px; border: 1px solid rgb(185 211 200 / .35); font-size: .95rem; transition: background .2s, color .2s, border-color .2s; }
.chips input:checked + span { background: var(--paper); color: var(--ink); border-color: var(--paper); }
.chips input:focus-visible + span { outline: 2px solid var(--brass); outline-offset: 2px; }
.quick { display: inline-flex; gap: .5rem; align-items: center; font-size: .95rem; cursor: pointer; margin-bottom: 1.4rem; }
.quick input { accent-color: var(--brass); width: 1.05rem; height: 1.05rem; }
.choose {
  font: 500 1.15rem/1 var(--body); letter-spacing: .01em; color: var(--room);
  background: linear-gradient(180deg, #d8bc76, var(--brass)); border: 0; border-radius: 999px;
  padding: 1.05rem 2.1rem; min-height: 3.3rem; cursor: pointer;
  box-shadow: 0 0 0 1px rgb(255 255 255 / .18) inset, 0 14px 30px -14px rgb(0 0 0 / .7);
  transition: transform .15s;
}
.choose:hover { transform: translateY(-1px); }
.choose:active { transform: translateY(1px); }
.pool { display: block; margin-top: .7rem; font-size: .88rem; opacity: .75; }

/* The menu card */
.card {
  position: relative; display: none; margin: 0 auto 3.5rem; max-width: 52rem;
  background: var(--paper); color: var(--ink); border-radius: 6px;
  padding: clamp(1.6rem, 5vw, 3.4rem) clamp(1.25rem, 5vw, 3.6rem) clamp(1.6rem, 4vw, 2.6rem);
  box-shadow: 0 40px 80px -40px rgb(0 0 0 / .8), 0 2px 0 rgb(255 255 255 / .5) inset;
}
.card.on { display: block; }
.card { scroll-margin-top: 16px; }
.card::before, .card::after { content: ''; position: absolute; pointer-events: none; border: 1px solid var(--brass); border-radius: 3px; }
.card::before { inset: 10px; }
.card::after { inset: 14px; border-width: .5px; opacity: .7; }
.card .kind { margin: 0; text-align: center; font: italic 400 1.05rem/1.3 var(--display); color: var(--brass-ink); }
.card h2 {
  margin: .35rem 0 0; text-align: center; font: 500 clamp(2.2rem, 7.5vw, 4rem)/1.02 var(--display);
  letter-spacing: -.015em; text-wrap: balance; min-height: 2.1em; display: grid; place-items: center;
  font-variation-settings: 'opsz' 96;
}
.card.riffle h2 { color: var(--ink-soft); filter: blur(.4px); }
.card .rx { transition: opacity .35s; }
.card.riffle .rx { opacity: 0; }
.dek { margin: .6rem auto 0; max-width: 34rem; text-align: center; font: italic 400 1.2rem/1.45 var(--display); color: var(--ink); text-wrap: balance; }
.facts { display: flex; flex-wrap: wrap; justify-content: center; gap: .3rem .75rem; margin: 1rem 0 0; font-size: .95rem; color: var(--ink-soft); }
.facts span + span::before { content: ''; display: inline-block; width: 4px; height: 4px; margin: 0 .75rem 0 0; vertical-align: .22em; background: var(--brass); transform: rotate(45deg); }
.cols { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 2.4rem; margin-top: 2rem; padding-top: 1.8rem; border-top: 1px solid rgb(196 163 90 / .55); }
h4 { margin: 0 0 .7rem; font: italic 500 1.35rem/1.2 var(--display); }
.ing ul { list-style: none; margin: 0; padding: 0; }
.ing li { padding: .42rem 0; border-bottom: 1px dotted rgb(28 43 58 / .22); line-height: 1.4; }
.how ol { margin: 0; padding: 0; list-style: none; counter-reset: s; }
.how li { counter-increment: s; position: relative; padding-left: 2.4rem; margin-bottom: 1rem; line-height: 1.55; max-width: 34rem; }
.how li::before { content: counter(s); position: absolute; left: 0; top: -.1rem; font: italic 500 1.5rem/1 var(--display); color: var(--brass-ink); }
.card-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: .55rem; margin-top: 1.6rem; padding-top: 1.4rem; border-top: 1px solid rgb(196 163 90 / .55); }
.card-actions button { font: 500 .98rem/1 var(--body); color: var(--ink); background: transparent; border: 1px solid rgb(28 43 58 / .3); border-radius: 999px; padding: .7rem 1.15rem; min-height: 2.75rem; cursor: pointer; }
.card-actions button:hover { border-color: var(--ink); }
.card-actions .again { background: var(--ink); color: var(--paper); border-color: var(--ink); }

/* The full menu */
.full { padding: 1rem 0 4rem; }
.full > h2 { margin: 0 0 .3rem; text-align: center; font: italic 500 clamp(2rem, 6vw, 3rem)/1.1 var(--display); color: var(--paper); }
.full > p { margin: 0 auto 2.2rem; text-align: center; max-width: 30rem; opacity: .8; }
.toc { display: flex; flex-wrap: wrap; justify-content: center; gap: .35rem 1.2rem; margin: 0 0 2.5rem; font-size: .95rem; }
.toc a { text-decoration: none; border-bottom: 1px solid rgb(196 163 90 / .5); }
.course { max-width: 44rem; margin: 0 auto 2.8rem; }
.course h3 { margin: 0 0 .6rem; padding-bottom: .5rem; border-bottom: 1px solid rgb(196 163 90 / .55); font: italic 500 1.75rem/1.2 var(--display); color: var(--paper); display: flex; justify-content: space-between; align-items: baseline; }
.course h3 small { font: 400 .9rem var(--body); color: var(--brass); }
.dish summary { display: flex; align-items: baseline; gap: .5rem; padding: .6rem 0; cursor: pointer; list-style: none; }
.dish summary::-webkit-details-marker { display: none; }
.dn { font: 500 1.12rem/1.3 var(--display); color: var(--paper); }
.dots { flex: 1; min-width: 1rem; border-bottom: 1px dotted rgb(185 211 200 / .4); transform: translateY(-.3em); }
.dm { font-size: .9rem; opacity: .75; white-space: nowrap; }
.dish summary:hover .dn { color: #fff; text-decoration: underline; text-decoration-color: var(--brass); text-underline-offset: 4px; }
.dish[open] summary .dn { color: var(--brass); }
.dish .rx { background: var(--paper); color: var(--ink); border-radius: 6px; padding: 1.4rem clamp(1rem, 4vw, 2rem); margin: .3rem 0 1.2rem; }
.dish .rx .dek { text-align: left; margin-left: 0; }
.dish .rx .facts { justify-content: flex-start; }
.dish .rx .cols { margin-top: 1.2rem; padding-top: 1.2rem; }
.foot { text-align: center; padding: 0 0 3rem; font-size: .9rem; opacity: .7; }

@media (max-width: 700px) {
  .cols { grid-template-columns: 1fr; gap: 1.6rem; }
  .dc { display: none; }
  .card::before { inset: 7px; } .card::after { inset: 10px; }
}

@media print {
  @page { margin: .6in; }
  body { background: #fff; color: #000; }
  .top, .masthead, .controls, .full, .foot, .card-actions { display: none !important; }
  .card { display: block !important; box-shadow: none; padding: .3in; max-width: none; }
  .card.riffle .rx { opacity: 1; }
}
</style>
</head>
<body>
<script>document.documentElement.className = 'js'; document.body.className = 'js';</script>
<div class="wrap">
<nav class="top" aria-label="Site"><a class="home" href="/home/"><b>R Cubed</b> at home</a><a href="#menu">Full menu</a></nav>

<header class="masthead">
<h1>Chef's Choice</h1>
<svg class="orn" viewBox="0 0 120 14" aria-hidden="true"><path d="M0 7h46M74 7h46" stroke="currentColor" stroke-width="1"/><path d="M60 1l6 6-6 6-6-6z" fill="none" stroke="currentColor"/><circle cx="60" cy="7" r="1.6" fill="currentColor"/></svg>
<p>One hundred dinners from our kitchen, each with its recipe. Can't decide? Let the house choose.</p>
</header>

<div class="controls">
<fieldset class="chips"><legend>What are you in the mood for?</legend>
<label><input type="radio" name="k" value="" checked><span>Anything</span></label>
${KINDS.map(k => `<label><input type="radio" name="k" value="${k}"><span>${k}</span></label>`).join('\n')}
</fieldset>
<label class="quick"><input type="checkbox" id="quick"> On the table in 45 minutes or less</label><br>
<button class="choose" id="choose" type="button">Choose tonight's dinner</button>
<span class="pool" id="pool" aria-live="polite"></span>
</div>

<article class="card" id="card" aria-live="polite" aria-busy="false">
<p class="kind" id="kind"></p>
<h2 id="name"></h2>
<div class="rx" id="rx"></div>
<div class="card-actions">
<button class="again" type="button" id="again">Choose again</button>
<button type="button" id="print">Print recipe</button>
<button type="button" id="share">Copy link</button>
</div>
</article>
</div>

<main class="full wrap" id="menu">
<h2>The full menu</h2>
<p>Every dish in the house. Open any one to read its recipe.</p>
<nav class="toc" aria-label="Courses">${KINDS.map(k => `<a href="#course-${slug(k)}">${LABEL[k]}</a>`).join('')}</nav>
${menu}
</main>
<p class="foot wrap">Built for our family table on <a href="/">r3ai.dev</a>. Season everything to taste.</p>

<script>
(() => {
  const $ = id => document.getElementById(id);
  const dishes = [...document.querySelectorAll('.dish')];
  const names = dishes.map(d => d.querySelector('.dn').textContent);
  const card = $('card'), still = matchMedia('(prefers-reduced-motion: reduce)');
  const label = ${JSON.stringify(LABEL)};
  let bag = [], key = '', current = null, timer = 0;

  const pool = () => {
    const k = document.querySelector('input[name=k]:checked').value, q = $('quick').checked;
    return dishes.filter(d => (!k || d.dataset.k === k) && (!q || +d.dataset.t <= 45));
  };
  const updatePool = () => {
    const n = pool().length;
    $('pool').textContent = n ? n + (n === 1 ? ' dish' : ' dishes') + ' to choose from' : 'Nothing on the menu matches. Try another choice.';
    $('choose').disabled = !n;
  };
  // A shuffled bag, so every dish in the pool comes up once before any repeats.
  const draw = () => {
    const list = pool(), k = list.map(d => d.id).join();
    if (k !== key || !bag.length) {
      key = k; bag = list.slice();
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      if (bag.length > 1 && current && bag[bag.length - 1] === current) bag.unshift(bag.pop());
    }
    return bag.pop();
  };
  const show = (d, scroll) => {
    current = d;
    $('kind').textContent = label[d.dataset.k];
    $('name').textContent = d.querySelector('.dn').textContent;
    $('rx').innerHTML = d.querySelector('.rx').innerHTML;
    card.classList.add('on'); card.classList.remove('riffle'); card.setAttribute('aria-busy', 'false');
    history.replaceState(null, '', '#' + d.id);
    document.title = d.querySelector('.dn').textContent + " · Chef's Choice";
    if (scroll) card.scrollIntoView({ behavior: still.matches ? 'auto' : 'smooth', block: 'start' });
  };
  const choose = () => {
    const d = draw(); if (!d) return;
    clearTimeout(timer);
    const first = !card.classList.contains('on');
    card.classList.add('on');
    if (first) card.scrollIntoView({ behavior: still.matches ? 'auto' : 'smooth', block: 'start' });
    if (still.matches) return show(d);
    // The riffle: names flick past, slowing down, then settle on the pick.
    card.classList.add('riffle'); card.setAttribute('aria-busy', 'true');
    $('kind').textContent = label[d.dataset.k]; $('rx').innerHTML = d.querySelector('.rx').innerHTML;
    let step = 0; const steps = 14;
    const tick = () => {
      if (step++ < steps) {
        $('name').textContent = names[Math.floor(Math.random() * names.length)];
        timer = setTimeout(tick, 30 + step * step * 0.9);
      } else show(d);
    };
    tick();
  };

  $('choose').addEventListener('click', choose);
  $('again').addEventListener('click', choose);
  $('print').addEventListener('click', () => print());
  $('share').addEventListener('click', async e => {
    const url = location.href, b = e.currentTarget;
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ title: $('name').textContent, url });
      else { await navigator.clipboard.writeText(url); b.textContent = 'Link copied'; setTimeout(() => b.textContent = 'Copy link', 1800); }
    } catch (_) {}
  });
  document.querySelectorAll('.controls input').forEach(i => i.addEventListener('change', updatePool));
  // A link to a dish (#coq-au-vin) opens it on the card.
  const fromHash = () => { const d = location.hash && document.getElementById(location.hash.slice(1)); if (d && d.classList.contains('dish')) show(d, true); };
  window.addEventListener('hashchange', fromHash);
  updatePool(); fromHash();
})();
</script>
</body>
</html>
`;

const out = join(here, '..', '..', 'static', 'chefs-choice');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
console.log(`wrote static/chefs-choice/index.html with ${meals.length} dishes`);
