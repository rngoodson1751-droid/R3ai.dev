// Builds r3ai.dev into ./dist. No dependencies: run with `node build.mjs`.
// Posts live in content/posts/*.md, projects in content/projects.json,
// and anything in static/ is copied across unchanged (games, images).
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const SITE = { url: 'https://r3ai.dev', name: 'R3 AI', author: 'Robert Goodson' };
const SECTIONS = {
  work: { label: 'At work', path: '/work/' },
  home: { label: 'At home', path: '/home/' },
};
const OUT = 'dist';

// ---------- helpers ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const longDate = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
function write(path, html) {
  const file = join(OUT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

// ---------- tiny Markdown ----------
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
function markdown(src) {
  const lines = src.replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('```')) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      i++;
      out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) { const n = h[1].length + 1; out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }
    if (/^---+$/.test(line.trim())) { out.push('<hr>'); i++; continue; }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line), items = [];
      while (i < lines.length && (ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lines[i])) {
        items.push('<li>' + inline(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, '')) + '</li>');
        i++;
      }
      out.push((ordered ? '<ol>' : '<ul>') + items.join('') + (ordered ? '</ol>' : '</ul>'));
      continue;
    }
    if (line.startsWith('>')) {
      const q = [];
      while (i < lines.length && lines[i].startsWith('>')) q.push(lines[i++].replace(/^>\s?/, ''));
      out.push('<blockquote><p>' + inline(q.join(' ')) + '</p></blockquote>');
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|>|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i])) para.push(lines[i++]);
    out.push('<p>' + inline(para.join(' ')) + '</p>');
  }
  return out.join('\n');
}

// ---------- content ----------
function loadPosts() {
  const dir = 'content/posts';
  return readdirSync(dir).filter(f => f.endsWith('.md')).map(f => {
    const raw = readFileSync(join(dir, f), 'utf8');
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) throw new Error(`${f}: missing front matter`);
    const meta = {};
    for (const l of m[1].split('\n')) { const k = l.indexOf(':'); if (k > 0) meta[l.slice(0, k).trim()] = l.slice(k + 1).trim(); }
    for (const need of ['title', 'date', 'section', 'summary']) if (!meta[need]) throw new Error(`${f}: front matter needs "${need}"`);
    if (!SECTIONS[meta.section]) throw new Error(`${f}: section must be "work" or "home"`);
    const slug = f.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    return { ...meta, slug, url: `/blog/${slug}/`, html: markdown(m[2]) };
  }).filter(p => p.draft !== 'true').sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (Number(a.order) || 50) - (Number(b.order) || 50) || a.title.localeCompare(b.title)));
}
const posts = loadPosts();
const projects = JSON.parse(readFileSync('content/projects.json', 'utf8'));

// ---------- templates ----------
const NAV = [['/work/', 'At work', 'work'], ['/home/', 'At home', 'home'], ['/blog/', 'Blog', 'blog'], ['/request/', 'Request', 'request'], ['/about/', 'About', 'about']];
function layout({ title, description, path, section = '', nav = '', body }) {
  const full = title ? `${title} · ${SITE.name}` : `${SITE.name} · Robert, Rachelle and River`;
  const links = NAV.map(([href, label, key]) => `<a href="${href}"${nav === key ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE.url}${path}">
<meta property="og:title" content="${esc(title || SITE.name)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE.url}${path}">
<meta name="theme-color" content="#e9f4f5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#06161f" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${SITE.name}" href="/feed.xml">
<script>try{var t=localStorage.getItem('r3-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap">
<link rel="stylesheet" href="/styles.css">
<script src="/site.js" defer></script>
<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/games/*"}}]},"eagerness":"moderate"}]}</script>
</head>
<body${section ? ` data-section="${section}"` : ''}>
<canvas id="silk" aria-hidden="true"></canvas>
<header class="glass bar">
  <a class="mark" href="/" aria-label="R cubed, home page">R<sup>3</sup></a>
  <nav class="links" aria-label="Main">${links}</nav>
  <button class="theme" id="theme" type="button" aria-label="Switch between light and dark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg></button>
</header>
<nav class="glass tabs" aria-label="Main, bottom bar">${links}</nav>
<main class="wrap">
${body}
</main>
<footer class="wrap foot">
  <nav aria-label="Footer"><a href="/blog/">Blog</a><a href="/request/">Request a post</a><a href="/feed.xml">RSS feed</a><a href="/about/">About</a></nav>
  <p>&copy; ${new Date().getUTCFullYear()} ${SITE.author}. This is a personal site. It is not an official site of my employer, and the opinions here are my own.</p>
</footer>
</body>
</html>
`;
}
const chip = s => `<span class="chip">${SECTIONS[s].label}</span>`;
function postList(list, showChip = true) {
  if (!list.length) return '<div class="sheet"><p class="empty">No posts here yet.</p></div>';
  return '<ul class="sheet list reveal">' + list.map(p => `<li><a href="${p.url}">
  <time datetime="${p.date}">${longDate(p.date)}${showChip ? chip(p.section) : ''}</time>
  <div><h3 style="view-transition-name:post-${p.slug}">${esc(p.title)}</h3><p>${esc(p.summary)}</p></div>
</a></li>`).join('\n') + '</ul>';
}
function projectCards(section) {
  const list = projects.filter(p => p.section === section);
  if (!list.length) return '';
  return '<div class="cards">' + list.map(p => `<article class="sheet card reveal">
  <div class="chips"><span class="chip">${esc(p.kind)}</span>${p.status ? `<span class="chip live">${esc(p.status)}</span>` : ''}</div>
  <h3>${esc(p.title)}</h3>
  <p>${esc(p.summary)}</p>
  <div class="end">${(p.links || []).length ? p.links.map((l, i) => `<a${i === 0 ? ` class="btn${l.href.startsWith('/games/') ? '' : ' glass'}"` : ''} href="${l.href}">${esc(l.label)}</a>`).join('') : '<span class="chip">Write-up coming</span>'}</div>
</article>`).join('\n') + '</div>';
}
// The cube: 26 small cubes, each with six sides. Outside sides carry a coloured tile (data-k),
// and the middle tile of each face carries an R. src/site.js picks these up and makes them turn.
const SIDES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]; // right, left, bottom, top, front, back
const CENTRES = { 4: 'Robert', 0: 'Rachelle', 3: 'River' };
function cubeHtml() {
  let out = '';
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
    const p = [x, y, z];
    if (!x && !y && !z) continue;
    const centre = p.filter(Boolean).length === 1;
    const sides = SIDES.map((n, k) => {
      const outside = n.some((v, a) => v && p[a] === v);
      const label = outside && centre ? (CENTRES[k] ? `<b>R</b><span>${CENTRES[k]}</span>` : '<b>R<sup>3</sup></b>') : '';
      return `<i class="fc n${k}"${outside ? ` data-k="${k}"` : ''}>${label}</i>`;
    }).join('');
    out += `<div class="qb" data-p="${p}" style="transform:translate3d(calc(var(--c)*${x}),calc(var(--c)*${y}),calc(var(--c)*${z}))">${sides}</div>`;
  }
  return out;
}
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const inSection = (list, s) => list.filter(x => x.section === s);

// ---------- pages ----------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
if (existsSync('static')) cpSync('static', OUT, { recursive: true });
writeFileSync(join(OUT, 'styles.css'), readFileSync('src/styles.css'));
writeFileSync(join(OUT, 'site.js'), readFileSync('src/site.js'));

const featured = projects.find(p => p.section === 'home' && (p.links || []).length);
write('index.html', layout({
  title: '', path: '/',
  description: 'Robert Goodson builds software with AI: tools for public transit at work, and games and projects for his family at home.',
  body: `<section class="hero">
  <div>
    <h1>R cubed is Robert, Rachelle and River.</h1>
    <p>I'm Robert. I build software with AI: tools for public transit at work, and games, boats and go-karts for my family at home. This site keeps both in one place.</p>
    <div class="acts"><a class="btn" href="/work/">See the work side</a><a class="btn glass" href="/home/">See the home side</a></div>
  </div>
  <div class="stage">
    <div class="scene"><div class="cube" id="cube" role="group" aria-label="A puzzle cube with an R for Robert, Rachelle and River. Drag a tile to turn a row.">${cubeHtml()}</div></div>
    <div class="cube-ui">
      <button class="btn glass sm" type="button" data-cube="scramble">Scramble</button>
      <button class="btn glass sm" type="button" data-cube="reset">Reset</button>
      <p class="cube-say" role="status">Drag a tile to turn a row. Drag beside the cube to spin it.</p>
    </div>
  </div>
</section>
<div class="bento">
  <a class="sheet tile reveal" href="/work/">
    <h2 style="view-transition-name:title-work">At work</h2>
    <p>Transit software, process fixes and notes from a City Transit division.</p>
    <div class="end chips"><span class="chip">${count(inSection(projects, 'work').length, 'project', 'projects')}</span><span class="chip">${count(inSection(posts, 'work').length, 'post', 'posts')}</span></div>
  </a>
  <a class="sheet tile reveal" href="/home/">
    <h2 style="view-transition-name:title-home">At home</h2>
    <p>Games, sailing, a go-kart with wings and things made for River.</p>
    <div class="end chips"><span class="chip">${count(inSection(projects, 'home').length, 'project', 'projects')}</span><span class="chip">${count(inSection(posts, 'home').length, 'post', 'posts')}</span></div>
  </a>
  ${featured ? `<article class="sheet tile span-2 reveal">
    <div class="chips"><span class="chip live">Play now</span></div>
    <h2>${esc(featured.title)}</h2>
    <p>${esc(featured.summary)}</p>
    <div class="end">${featured.links.map((l, i) => `<a class="btn${i ? ' glass' : ''}" href="${l.href}">${esc(l.label)}</a>`).join('')}</div>
  </article>` : ''}
  <section class="${featured ? 'span-4' : 'span-6'}" style="display:grid" aria-label="Latest posts">
    ${postList(posts.slice(0, 4))}
  </section>
  <article class="sheet tile span-6 ask reveal">
    <div><h2>Want to read about something?</h2>
    <p>Pick anything on the site, from the work side or the home side, and ask me to write about it.</p></div>
    <div class="end"><a class="btn" href="/request/">Request a post</a></div>
  </article>
</div>`,
}));

const sectionCopy = {
  work: {
    intro: 'I manage a City Transit division, and I build custom software for it when nothing off the shelf fits. Each project here has a write-up covering the problem, the tool and what I learned.',
    projectsEmpty: 'Project write-ups are on the way.',
    projectsTitle: 'Projects',
    description: 'Transit software and notes from a City Transit division.',
  },
  home: {
    intro: 'What I do away from work: games for River, sailboat racing, a go-kart that thinks it is a Formula 1 car and whatever we think up next.',
    projectsEmpty: 'Nothing here yet.',
    projectsTitle: 'Games and projects',
    description: 'Games, sailing, go-karts and family projects built with AI.',
  },
};
for (const [key, s] of Object.entries(SECTIONS)) {
  const c = sectionCopy[key], cards = projectCards(key);
  write(`${key}/index.html`, layout({
    title: s.label, path: s.path, section: key, nav: key, description: c.description,
    body: `<section class="head"><h1 style="view-transition-name:title-${key}">${s.label}</h1><p>${c.intro}</p></section>
<h2 class="h2">${c.projectsTitle}</h2>
${cards || `<div class="sheet"><p class="empty">${c.projectsEmpty}</p></div>`}
${cards && c.projectsNote ? `<p class="note">${c.projectsNote}</p>` : ''}
<h2 class="h2" id="posts">Posts</h2>
${postList(inSection(posts, key), false)}
${key === 'work' ? '<p class="note">Everything in this section is my own account of my work. None of it is an official statement from my employer.</p>' : ''}`,
  }));
}

write('blog/index.html', layout({
  title: 'Blog', path: '/blog/', nav: 'blog', description: 'Every post from both sides of the site, newest first.',
  body: `<section class="head"><h1>Blog</h1><p>Every post from both sides of the site, newest first. Only want one side? See <a href="/work/#posts">At work</a> or <a href="/home/#posts">At home</a>.</p></section>
${postList(posts)}`,
}));

for (const p of posts) {
  write(`blog/${p.slug}/index.html`, layout({
    title: p.title, path: p.url, section: p.section, nav: 'blog', description: p.summary,
    body: `<article class="sheet strong post">
<header><p class="when"><time datetime="${p.date}">${longDate(p.date)}</time>${chip(p.section)}</p><h1 style="view-transition-name:post-${p.slug}">${esc(p.title)}</h1></header>
<div class="prose">
${p.html}
</div>
<p class="acts"><a class="btn glass" href="${SECTIONS[p.section].path}">More from ${SECTIONS[p.section].label.toLowerCase()}</a><a class="btn glass" href="/request/?about=${p.slug}">Request a follow-up</a></p>
</article>`,
  }));
}

write('about/index.html', layout({
  title: 'About', path: '/about/', nav: 'about', description: 'Who is behind r3ai.dev and what the name means.',
  body: `<section class="head"><h1>Three R's</h1><p>R cubed is my family: Robert, Rachelle and River. I'm Robert, and I write everything here.</p></section>
<div class="sheet strong post"><div class="prose">
<h2>What this site is</h2>
<p>I'm a self-taught web developer who manages a City Transit division. At work I build the tools the job needs. At home I build things for my family, like a rocket game for River and a kart racing game with sloths in it.</p>
<p>I'm also a sailor. I race a Sunfish, sail a Flying Scot, serve as the commodore of our local yacht club and teach its free learn-to-sail week every June. Blue and green are my colors, which is why the site looks like water.</p>
<p>Most of what you'll find here was built with AI doing a large share of the typing. I write about what worked, what didn't and what I'd do differently.</p>
<h2>How it's split</h2>
<ul>
<li><a href="/work/">At work</a> covers transit software and what I learn from running a City Transit division.</li>
<li><a href="/home/">At home</a> covers games, sailing, the go-kart and family projects.</li>
<li>The <a href="/blog/">blog</a> holds posts from both.</li>
</ul>
<h2>How it's built</h2>
<p>The site is plain HTML produced by a small build script, with posts written as text files. It is hosted on Cloudflare and the source lives on <a href="https://github.com/rngoodson1751-droid/R3ai.dev">GitHub</a>.</p>
<h2>The fine print</h2>
<p>This is a personal site. It is not an official site of my employer, and the opinions here are my own.</p>
</div></div>`,
}));

const option = (value, label) => `<option value="${esc(value)}">${esc(label)}</option>`;
const aboutOptions = Object.entries(SECTIONS).map(([key, sec]) =>
  `<optgroup label="${sec.label} projects">${inSection(projects, key).map(p => option(p.title, p.title)).join('')}</optgroup>`).join('')
  + `<optgroup label="Posts">${posts.map(p => `<option value="${esc(p.title)}" data-slug="${p.slug}" data-side="${p.section}">${esc(p.title)}</option>`).join('')}</optgroup>`;
write('request/index.html', layout({
  title: 'Request a post', path: '/request/', nav: 'request', description: 'Ask Robert to write about anything on r3ai.dev, from the work side or the home side.',
  body: `<section class="head"><h1>Request a post</h1><p>Saw something here you want to know more about? Tell me and I'll add it to the list. Anything on the site is fair game, from the work side or the home side.</p></section>
<form class="sheet strong form" id="request" method="post" action="/api/requests">
  <div class="field">
    <label for="rq-message">What should I write about?</label>
    <small id="rq-message-hint">A question, a project you want more detail on, or something you'd like me to try.</small>
    <textarea class="input" id="rq-message" name="message" required minlength="10" maxlength="2000" aria-describedby="rq-message-hint"></textarea>
  </div>
  <fieldset class="field pick">
    <legend>Which side is it?</legend>
    <label><input type="radio" name="side" value="work">At work</label>
    <label><input type="radio" name="side" value="home">At home</label>
    <label><input type="radio" name="side" value="either" checked>Not sure</label>
  </fieldset>
  <div class="field">
    <label for="rq-about">Is it about something already on the site?</label>
    <select class="input" id="rq-about" name="about"><option value="">No, it's something new</option>${aboutOptions}</select>
  </div>
  <div class="two">
    <div class="field"><label for="rq-name">Your name <span class="opt">optional</span></label><input class="input" id="rq-name" name="name" maxlength="80" autocomplete="name"></div>
    <div class="field"><label for="rq-email">Email <span class="opt">optional</span></label><input class="input" id="rq-email" name="email" type="email" maxlength="120" autocomplete="email" aria-describedby="rq-email-hint"></div>
  </div>
  <small id="rq-email-hint">Leave an email only if you want to hear back when the post is up.</small>
  <p class="hp" aria-hidden="true"><label>Leave this box empty <input name="website" tabindex="-1" autocomplete="off"></label></p>
  <div class="acts"><button class="btn" type="submit">Send request</button><p class="form-msg" id="rq-msg" role="status"></p></div>
</form>
<p class="note">Requests come to me and are not published. I don't share your name or email with anyone.</p>
<p class="note">This form is for blog post ideas only. It is not a way to reach my employer. For a question or complaint about bus service, contact your transit agency directly.</p>`,
}));
write('request/thanks/index.html', layout({
  title: 'Request sent', path: '/request/thanks/', nav: 'request', description: 'Your post request was sent.',
  body: `<section class="head"><h1>Got it</h1><p>Your request is on my list. Thanks for asking. Head back to the <a href="/blog/">blog</a> or <a href="/request/">send another</a>.</p></section>`,
}));

write('404.html', layout({
  title: 'Page not found', path: '/404.html', description: 'That page does not exist.',
  body: `<section class="head"><h1>Wrong stop</h1><p>There's no page at this address. Try the <a href="/">home page</a> or the <a href="/blog/">blog</a>.</p></section>`,
}));

// ---------- feed, sitemap, robots ----------
write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${SITE.name}</title><link>${SITE.url}/</link><description>Posts from r3ai.dev</description>
${posts.map(p => `<item><title>${esc(p.title)}</title><link>${SITE.url}${p.url}</link><guid>${SITE.url}${p.url}</guid><pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate><category>${SECTIONS[p.section].label}</category><description>${esc(p.summary)}</description></item>`).join('\n')}
</channel></rss>
`);
const paths = ['/', '/work/', '/home/', '/blog/', '/request/', '/about/', ...posts.map(p => p.url), ...projects.flatMap(p => (p.links || []).map(l => l.href)).filter(h => h.startsWith('/games/'))];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(paths)].map(p => `<url><loc>${SITE.url}${p}</loc></url>`).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);

console.log(`Built ${posts.length} posts and ${projects.length} projects into ${OUT}/`);
