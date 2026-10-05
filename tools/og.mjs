// Makes the link preview pictures (the image that shows when a page is texted or posted) in static/og/.
// One per page and per post, drawn with the site's own styles, water and cube.
//
//   node build.mjs && node tools/og.mjs && node build.mjs
//
// Needs Playwright, which is not otherwise part of this project: `npm install --no-save playwright`.
// Pass slugs to redo only some: `node tools/og.mjs sunfish-speed start`. A page with no picture uses default.jpg.
import { createServer } from 'node:http';
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const cards = [
  { name: 'default', title: 'R Cubed is Robert, Rachelle and River.', label: 'Software, sailing and family projects, built with AI' },
  { name: 'work', title: 'At work', label: 'Transit software and notes from a City Transit division' },
  { name: 'home', title: 'At home', label: 'Games, sailing, go-karts and family projects' },
  { name: 'blog', title: 'Blog', label: 'Every post from both sides of the site' },
  { name: 'start', title: 'Start here', label: 'Five posts to read first if you are new to AI' },
  { name: 'games', title: 'Games', label: 'Play them in your browser' },
  { name: 'request', title: 'Request a post', label: 'Ask me to write about anything on the site' },
  { name: 'demo-dispatch-board', title: 'Dispatch board', label: 'Try the demo' },
  { name: 'demo-procurement-wizard', title: 'Procurement wizard', label: 'Try the demo' },
  { name: 'demo-bus-map', title: 'Live bus map', label: 'Try the demo' },
  { name: 'demo-stop-sign', title: 'Bus stop sign', label: 'Try the demo' },
  { name: 'demos', title: 'Demos', label: 'Transit tools you can try in your browser' },
  { name: 'ask', title: 'Ask the site', label: 'A small AI that answers from the posts' },
];
for (const f of readdirSync('content/posts').filter(f => f.endsWith('.md'))) {
  const head = readFileSync(join('content/posts', f), 'utf8').split('\n---')[0];
  const get = k => (head.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1] || '';
  if (get('draft') === 'true') continue;
  cards.push({ name: f.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''), title: get('title'), label: get('section') === 'home' ? 'At home' : 'At work' });
}
const only = process.argv.slice(2);
const todo = only.length ? cards.filter(c => only.includes(c.name)) : cards;

// serve ./dist so the pictures use the real stylesheet, fonts and water
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  let path = join('dist', decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(path) && !extname(path)) path = join(path, 'index.html');
  if (!existsSync(path)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'], executablePath: process.env.OG_CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: 'light' });
await page.goto(base + '/');
const cube = await page.evaluate(() => document.querySelector('.scene').outerHTML);
await page.goto(base + '/404.html');
await page.addStyleTag({ content: `
  .bar, .tabs, main, .foot { display: none !important; }
  .og { position: fixed; inset: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 30px; padding: 64px 40px 64px 76px; }
  .og-text { display: grid; gap: 30px; align-content: center; }
  .og-mark { font: 600 46px/1 var(--display); letter-spacing: -.02em; }
  .og-mark sup { font-size: .58em; color: var(--green); }
  .og-mark span { font: 500 24px/1 var(--body); color: var(--soft); margin-left: 14px; letter-spacing: 0; }
  .og h1 { font-size: var(--size); line-height: 1.04; letter-spacing: -.03em; text-wrap: balance; }
  .og-label { justify-self: start; font: 500 24px/1 var(--body); padding: 13px 24px; border-radius: 999px; background: var(--tide); color: var(--on-tide); }
  .og .scene { --s: 250px; padding: 60px 50px; cursor: default; }
` });
await page.evaluate(() => document.fonts.ready);
mkdirSync('static/og', { recursive: true });
for (const c of todo) {
  await page.evaluate(({ c, cube }) => {
    document.querySelector('.og')?.remove();
    const el = document.createElement('div');
    el.className = 'og';
    el.innerHTML = `<div class="og-text"><div class="og-mark">R<sup>3</sup><span>r3ai.dev</span></div><h1></h1><div class="og-label"></div></div>${cube}`;
    el.querySelector('h1').textContent = c.title;
    el.querySelector('h1').style.setProperty('--size', (c.title.length > 60 ? 54 : c.title.length > 38 ? 64 : c.title.length > 20 ? 76 : 104) + 'px');
    el.querySelector('.og-label').textContent = c.label;
    document.body.appendChild(el);
  }, { c, cube });
  await page.waitForTimeout(120);
  await page.screenshot({ path: `static/og/${c.name}.jpg`, type: 'jpeg', quality: 86 });
}
await browser.close();
server.close();
console.log(`Made ${todo.length} link preview pictures in static/og/`);
