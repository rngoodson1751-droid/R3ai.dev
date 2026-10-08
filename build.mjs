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
// Topics a post can carry in its header (topics: Sailing, Games). The blog page filters by these.
const TOPICS = ['Using AI', 'Office work', 'Transit tools', 'Games', 'Sailing', 'Family', 'This site'];
const topicSlug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-');
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
      const code = [], kind = line.slice(3).trim();
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      i++;
      // ```prompt makes a "Try this yourself" box with a Copy button
      if (kind === 'prompt') out.push(`<aside class="try"><h2>Try this yourself</h2><p class="hint">A prompt like the one I used. Paste it into any AI chat and fill in the brackets.</p><pre class="prompt">${esc(code.join('\n'))}</pre><button class="btn glass sm" type="button" data-copy>Copy the prompt</button></aside>`);
      else out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
      continue;
    }
    // {{name}} on its own line drops in a small interactive tool from src/demos/name.js
    const w = line.trim().match(/^\{\{([a-z-]+)\}\}$/);
    if (w) { out.push(`<div class="widget" id="w-${w[1]}"><p class="note">This calculator needs JavaScript turned on.</p></div>`); i++; continue; }
    // {{embed /fire-plan/ A title}} on its own line shows a page from static/ in a frame, with a link to open it by itself
    const e = line.trim().match(/^\{\{embed (\/[\w/-]+\/) (.+)\}\}$/);
    if (e) { out.push(`<figure class="embed"><div class="frame"><iframe src="${e[1]}" title="${esc(e[2])}" loading="lazy" allowfullscreen></iframe></div><figcaption><a class="btn glass sm" href="${e[1]}">Open it full screen</a></figcaption></figure>`); i++; continue; }
    // {{video /path/film.mp4 /path/poster.jpg A caption}} on its own line shows a video file from static/
    const v = line.trim().match(/^\{\{video (\/[\w/.-]+\.mp4) (\/[\w/.-]+\.jpg) (.+)\}\}$/);
    if (v) { out.push(`<figure class="video"><video controls playsinline preload="none" poster="${v[2]}" width="1280" height="720"><source src="${v[1]}" type="video/mp4"><a href="${v[1]}">Download the video</a></video><figcaption>${inline(v[3])}</figcaption></figure>`); i++; continue; }
    // {{photo /path/picture.jpg A caption}} on its own line shows a wide picture with a caption under it
    const ph = line.trim().match(/^\{\{photo (\/[\w/.-]+\.(?:jpg|png|webp)) (.+)\}\}$/);
    if (ph) { out.push(`<figure class="photo"><a href="${ph[1]}"><img src="${ph[1]}" alt="${esc(ph[2])}" loading="lazy"></a><figcaption>${inline(ph[2])}</figcaption></figure>`); i++; continue; }
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
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|>|\{\{|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i])) para.push(lines[i++]);
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
    const topics = (meta.topics || '').split(',').map(t => t.trim()).filter(Boolean);
    for (const t of topics) if (!TOPICS.includes(t)) throw new Error(`${f}: unknown topic "${t}". Use one of: ${TOPICS.join(', ')}`);
    // plain text of the post, for search and for the Ask page
    const text = m[2].replace(/```[\s\S]*?```/g, ' ').replace(/\{\{[^}]+\}\}/g, ' ').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*`>_]/g, '').replace(/\s+/g, ' ').trim();
    return { ...meta, topics, slug, url: `/blog/${slug}/`, html: markdown(m[2]), text };
  }).filter(p => p.draft !== 'true').sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (Number(a.order) || 50) - (Number(b.order) || 50) || a.title.localeCompare(b.title)));
}
const posts = loadPosts();
// a project marked "unlisted": true is kept on file but left off every page
const projects = JSON.parse(readFileSync('content/projects.json', 'utf8')).filter(p => !p.unlisted);

// ---------- templates ----------
const NAV = [['/work/', 'At work', 'work'], ['/home/', 'At home', 'home'], ['/blog/', 'Blog', 'blog'], ['/request/', 'Request', 'request'], ['/about/', 'About', 'about']];
// Link previews: static/og/<name>.jpg if tools/og.mjs has made one, else the default card.
const ogImage = name => `${SITE.url}/og/${name && existsSync(`static/og/${name}.jpg`) ? name : 'default'}.jpg`;
function layout({ title, description, path, section = '', nav = '', body, og = '', type = 'website', scripts = [] }) {
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
<meta property="og:type" content="${type}">
<meta property="og:url" content="${SITE.url}${path}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:image" content="${ogImage(og)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#e9f4f5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#06161f" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icons/icon-180.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="alternate" type="application/rss+xml" title="${SITE.name}" href="/feed.xml">
<script>try{var t=localStorage.getItem('r3-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap">
<link rel="stylesheet" href="/styles.css">
<script src="/site.js" defer></script>${scripts.map(src => `\n<script src="${src}" defer></script>`).join('')}
<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/games/*"}}]},"eagerness":"moderate"}]}</script>
</head>
<body${section ? ` data-section="${section}"` : ''}>
<canvas id="silk" aria-hidden="true"></canvas>
<header class="glass bar">
  <a class="mark" href="/" aria-label="R Cubed, home page">R<sup>3</sup></a>
  <nav class="links" aria-label="Main">${links}</nav>
  <button class="theme" id="theme" type="button" aria-label="Switch between light and dark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg></button>
</header>
<nav class="glass tabs" aria-label="Main, bottom bar">${links}</nav>
<main class="wrap">
${body}
</main>
<footer class="wrap foot">
  <nav aria-label="Footer"><a href="/start/">Start here</a><a href="/blog/">Blog</a><a href="/games/">Games</a><a href="/demos/">Demos</a><a href="/ask/">Ask the site</a><a href="/request/">Request a post</a><a href="/feed.xml">RSS feed</a><a href="/about/">About</a></nav>
  <p>&copy; ${new Date().getUTCFullYear()} ${SITE.author}. This is a personal site. It is not an official site of my employer, and the opinions here are my own.</p>
</footer>
</body>
</html>
`;
}
const chip = s => `<span class="chip">${SECTIONS[s].label}</span>`;
function postList(list, showChip = true) {
  if (!list.length) return '<div class="sheet"><p class="empty">No posts here yet.</p></div>';
  return '<ul class="sheet list reveal">' + list.map(p => `<li data-topics="${p.topics.map(topicSlug).join(' ')}"><a href="${p.url}">
  <time datetime="${p.date}">${longDate(p.date)}${showChip ? chip(p.section) : ''}</time>
  <div><h3 style="view-transition-name:post-${p.slug}">${esc(p.title)}</h3><p>${esc(p.summary)}</p></div>
</a></li>`).join('\n') + '</ul>';
}
function projectCards(section, { list = projects.filter(p => p.section === section), pictures = false } = {}) {
  if (!list.length) return '';
  return `<div class="cards${pictures ? ' wide' : ''}">` + list.map(p => `<article class="sheet card reveal">
  ${pictures && p.image ? `<a class="shot" href="${p.links[0].href}" tabindex="-1" aria-hidden="true"><img src="${p.image}" alt="" width="1280" height="720" loading="lazy"></a>` : ''}
  <div class="chips"><span class="chip">${esc(p.kind)}</span>${p.status ? `<span class="chip live">${esc(p.status)}</span>` : ''}</div>
  <h3>${esc(p.title)}</h3>
  <p>${esc(p.summary)}</p>
  <div class="end">${(p.links || []).length ? p.links.map((l, i) => `<a${i === 0 ? ` class="btn${/^\/(games|demos)\//.test(l.href) ? '' : ' glass'}"` : ''} href="${l.href}">${esc(l.label)}</a>`).join('') : '<span class="chip">Write-up coming</span>'}</div>
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
cpSync('src/demos', join(OUT, 'demos'), { recursive: true });

const featured = projects.find(p => p.section === 'home' && (p.links || []).length);
write('index.html', layout({
  title: '', path: '/', og: 'default',
  description: 'Robert Goodson builds software with AI: tools for public transit at work, and games and projects for his family at home.',
  body: `<section class="hero">
  <div>
    <h1>R Cubed is Robert, Rachelle and River.</h1>
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
    <div class="end">${featured.links.map((l, i) => `<a class="btn${i ? ' glass' : ''}" href="${l.href}">${esc(l.label)}</a>`).join('')}<a href="/games/">All games</a></div>
  </article>` : ''}
  <section class="${featured ? 'span-4' : 'span-6'}" style="display:grid" aria-label="Latest posts">
    ${postList(posts.slice(0, 4))}
  </section>
  <article class="sheet tile span-2 reveal">
    <h2>New to AI?</h2>
    <p>Five short posts to read first, picked for people who aren't sure what AI would do for them.</p>
    <div class="end"><a class="btn" href="/start/">Start here</a></div>
  </article>
  <article class="sheet tile span-2 reveal">
    <h2>Ask the site</h2>
    <p>Type a question and a small AI answers it from my posts, with links to the ones it used.</p>
    <div class="end"><a class="btn glass" href="/ask/">Ask a question</a></div>
  </article>
  <article class="sheet tile span-2 reveal">
    <h2>Want more?</h2>
    <p>Pick anything on the site, from the work side or the home side, and ask me to write about it.</p>
    <div class="end"><a class="btn glass" href="/request/">Request a post</a></div>
  </article>
</div>`,
}));

const sectionCopy = {
  work: {
    intro: 'I manage a City Transit division, and I build custom software for it when nothing off the shelf fits. Each project here has a write-up covering the problem, the tool and what I learned.',
    projectsEmpty: 'Project write-ups are on the way.',
    projectsTitle: 'Projects',
    projectsNote: 'Four of these run right here with made-up data. See the <a href="/demos/">demos page</a>.',
    description: 'Transit software and notes from a City Transit division.',
  },
  home: {
    intro: 'What I do away from work: games for River, sailboat racing, a go-kart that thinks it is a Formula 1 car and whatever we think up next.',
    projectsEmpty: 'Nothing here yet.',
    projectsTitle: 'Games and projects',
    projectsNote: 'Every game you can play in the browser is on the <a href="/games/">games page</a>.',
    description: 'Games, sailing, go-karts and family projects built with AI.',
  },
};
for (const [key, s] of Object.entries(SECTIONS)) {
  const c = sectionCopy[key], cards = projectCards(key);
  write(`${key}/index.html`, layout({
    title: s.label, path: s.path, section: key, nav: key, og: key, description: c.description,
    body: `<section class="head"><h1 style="view-transition-name:title-${key}">${s.label}</h1><p>${c.intro}</p></section>
<h2 class="h2">${c.projectsTitle}</h2>
${cards || `<div class="sheet"><p class="empty">${c.projectsEmpty}</p></div>`}
${cards && c.projectsNote ? `<p class="note">${c.projectsNote}</p>` : ''}
<h2 class="h2" id="posts">Posts</h2>
${postList(inSection(posts, key), false)}
${key === 'work' ? '<p class="note">Everything in this section is my own account of my work. None of it is an official statement from my employer.</p>' : ''}`,
  }));
}

const topicCount = t => posts.filter(p => p.topics.includes(t)).length;
write('blog/index.html', layout({
  title: 'Blog', path: '/blog/', nav: 'blog', og: 'blog', description: 'Every post from both sides of the site, with filters by topic.',
  body: `<section class="head"><h1>Blog</h1><p>Every post from both sides of the site. New here? <a href="/start/">Start with these five</a>. Only want one side? See <a href="/work/#posts">At work</a> or <a href="/home/#posts">At home</a>.</p></section>
<form class="search" id="search" role="search" action="/blog/"><label class="sr" for="q">Search the posts</label><input class="input" id="q" name="q" type="search" placeholder="Search all ${posts.length} posts" autocomplete="off"><p class="note"><a href="/ask/">Or ask the site a question</a></p></form>
<div class="filters" id="filters" role="group" aria-label="Filter posts by topic">
  <button class="chip" type="button" data-topic="" aria-pressed="true">All <span>${posts.length}</span></button>
  ${TOPICS.filter(topicCount).map(t => `<button class="chip" type="button" data-topic="${topicSlug(t)}" aria-pressed="false">${t} <span>${topicCount(t)}</span></button>`).join('\n  ')}
</div>
${postList(posts)}
<p class="note" id="filter-empty" hidden>No posts match. Try fewer words, or <a href="/request/">request a post</a> about it.</p>`,
}));

for (const p of posts) {
  write(`blog/${p.slug}/index.html`, layout({
    title: p.title, path: p.url, section: p.section, nav: 'blog', og: p.slug, type: 'article', description: p.summary, scripts: p.widget ? [`/demos/${p.widget}.js`] : [],
    body: `<article class="sheet strong post">
<header><p class="when"><time datetime="${p.date}">${longDate(p.date)}</time>${chip(p.section)}${p.topics.map(t => `<a class="chip" href="/blog/#${topicSlug(t)}">${t}</a>`).join('')}</p><h1 style="view-transition-name:post-${p.slug}">${esc(p.title)}</h1></header>
<div class="prose">
${p.html}
</div>
<p class="acts"><a class="btn glass" href="${SECTIONS[p.section].path}">More from ${SECTIONS[p.section].label.toLowerCase()}</a><a class="btn glass" href="/request/?about=${p.slug}">Request a follow-up</a></p>
</article>`,
  }));
}

write('about/index.html', layout({
  title: 'About', path: '/about/', nav: 'about', description: 'Who is behind r3ai.dev and what the name means.',
  body: `<section class="head"><h1>Three R's</h1><p>R Cubed is my family: Robert, Rachelle and River. I'm Robert, and I write everything here.</p></section>
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
<p>The site counts how many times each page is opened so I can see what people read. It uses no cookies and keeps nothing about you, and it skips the count if your browser asks not to be tracked.</p>
</div></div>`,
}));

// ---------- start here ----------
const START = [
  ['when-ai-is-wrong-and-when-it-says-no', 'Read this one first', 'Know the limits before anything else. This is the post I would hand to a skeptic.'],
  ['everyday-email', 'The smallest place to begin', 'You already write email. This is the lowest-risk way to try AI on something real.'],
  ['small-life-questions', 'It works at home too', 'Nothing here needs a job title. Three ordinary questions and how they went.'],
  ['checklists-flyers-and-forms', 'The work that used to wait', 'The dull, useful documents every office needs and never gets around to.'],
  ['custom-software-without-being-a-developer', 'Where it can lead', 'Once the small things work, you start asking for tools. This is how that went for me.'],
];
const bySlug = slug => { const p = posts.find(x => x.slug === slug); if (!p) throw new Error(`Start here: no post "${slug}"`); return p; };
write('start/index.html', layout({
  title: 'Start here', path: '/start/', og: 'start', description: 'Five short posts to read first if you are not sure what AI would do for you.',
  body: `<section class="head"><h1>Start here</h1><p>Not sure what AI would actually do for you? Read these five, in order. Each one is a real example from my own work or home, and each one says where the AI fell short.</p></section>
<ol class="sheet path reveal">
${START.map(([slug, label, why], i) => { const p = bySlug(slug); return `<li><a href="${p.url}">
  <span class="step">${i + 1}</span>
  <div><p class="why">${label}</p><h3>${esc(p.title)}</h3><p>${why}</p></div>
</a></li>`; }).join('\n')}
</ol>
<h2 class="h2">Then follow what you care about</h2>
<div class="cards wide">
  <article class="sheet card reveal"><h3>You run an office</h3><p>Email, forms, regulations, grants and hard meetings.</p><div class="end"><a class="btn glass" href="/blog/#office-work">Office work posts</a></div></article>
  <article class="sheet card reveal"><h3>You'd rather try than read</h3><p>Four of my work tools run right here with made-up data, and every post in the series ends with a prompt you can copy.</p><div class="end"><a class="btn glass" href="/demos/">Try the demos</a><a href="/ask/">Ask the site</a></div></article>
  <article class="sheet card reveal"><h3>You have kids</h3><p>Games and comics I built for River, and how.</p><div class="end"><a class="btn glass" href="/games/">Play the games</a><a href="/blog/#family">Family posts</a></div></article>
  <article class="sheet card reveal"><h3>You want all of it</h3><p>The full list: 27 ways I actually use AI, with a post on each.</p><div class="end"><a class="btn glass" href="/blog/ways-i-use-ai/">See the list</a></div></article>
</div>`,
}));

// ---------- games ----------
const games = projects.filter(p => (p.links || []).some(l => l.href.startsWith('/games/')));
// every file a game needs, so the games page can save it for offline play
function walk(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]); }
const gameFiles = {};
for (const g of games) {
  const slug = g.links[0].href.split('/')[2], dir = `static/games/${slug}`;
  const local = walk(dir).map(f => '/' + f.replace(/^static\//, '').replace(/index\.html$/, ''));
  const html = readFileSync(`${dir}/index.html`, 'utf8');
  const outside = [...html.matchAll(/(?:src|href)="(https:\/\/[^"]+\.(?:js|css)[^"]*|https:\/\/fonts\.googleapis\.com\/[^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
  gameFiles[slug] = { files: [...new Set([...local, ...outside])], bytes: walk(dir).reduce((n, f) => n + readFileSync(f).length, 0) };
}
const gameSize = slug => { const mb = gameFiles[slug].bytes / 1e6; return mb < 1 ? 'under 1 MB' : `${Math.round(mb)} MB`; };
write('games/offline.json', JSON.stringify(Object.fromEntries(Object.entries(gameFiles).map(([k, v]) => [k, v.files]))));
write('games/index.html', layout({
  title: 'Games', path: '/games/', og: 'games', description: 'Browser games Robert built with AI: a kart racer, a rocket game and a midnight train adventure for River, and a bus simulator on real streets.',
  body: `<section class="head"><h1>Games</h1><p>Everything here runs in your browser, with nothing to install. They are best on a computer with a keyboard or a controller.</p></section>
${projectCards('', { list: games, pictures: true })}
<section class="sheet offline" id="offline" hidden>
  <div><h2>Play without a connection</h2>
  <p>Save a game to this device and it will run with no internet, which is handy in the car. Saving the site to your home screen makes it open like an app.</p>
  <p class="hint" id="ios-hint" hidden>On an iPhone or iPad, tap Share, then Add to Home Screen.</p></div>
  <div class="end">${games.map(g => { const slug = g.links[0].href.split('/')[2]; return `<button class="btn glass sm" type="button" data-save="${slug}">Save ${esc(g.title)} (${gameSize(slug)})</button>`; }).join('')}<button class="btn sm" type="button" id="install" hidden>Install the site</button></div>
  <p class="hint" id="save-msg" role="status"></p>
</section>
<p class="note">Not online yet: the <a href="/blog/sailing-simulator/">sailing simulator you steer with your hands</a>.</p>`,
}));

// ---------- try-it demos ----------
const demoNote = 'Everything in this demo is made up, and nothing you type is saved or sent anywhere.';
write('demos/dispatch-board/index.html', layout({
  title: 'Dispatch board demo', path: '/demos/dispatch-board/', section: 'work', nav: 'work', og: 'demo-dispatch-board', scripts: ['/demos/dispatch.js'],
  description: 'Try the driver dispatch board: mark a driver as called in and watch the board work out coverage.',
  body: `<section class="head"><h1>Dispatch board</h1><p>Someone calls in at 5 a.m. and five routes still have to leave on time. Tap <strong>Called in</strong> next to a driver and the board works out who covers. <a href="/blog/driver-dispatch-board/">Read the write-up</a>.</p></section>
<div class="sheet strong demo" id="dispatch"><p class="empty">This demo needs JavaScript turned on.</p></div>
<p class="note">${demoNote} The drivers, routes and rotation are invented for this page.</p>`,
}));
write('demos/procurement-wizard/index.html', layout({
  title: 'Procurement wizard demo', path: '/demos/procurement-wizard/', section: 'work', nav: 'work', og: 'demo-procurement-wizard', scripts: ['/demos/procurement.js'],
  description: 'Try the procurement wizard: answer plain questions about a purchase and get a completed sample form.',
  body: `<section class="head"><h1>Procurement wizard</h1><p>Answer a few plain questions about a purchase and get the right form, filled in, with the checks that are easy to forget. <a href="/blog/procurement-wizard/">Read the write-up</a>.</p></section>
<div class="sheet strong demo" id="wizard"><p class="empty">This demo needs JavaScript turned on.</p></div>
<p class="note">${demoNote} The dollar limits are the ones from my write-up and yours will differ. The form it prints is a simplified sample, so treat this as a demonstration and not as procurement advice.</p>`,
}));

write('demos/bus-map/index.html', layout({
  title: 'Live bus map demo', path: '/demos/bus-map/', section: 'work', nav: 'work', og: 'demo-bus-map', scripts: ['/demos/sim.js', '/demos/busmap.js'],
  description: 'Watch made-up buses move along made-up routes, and see the real-time feed behind each one.',
  body: `<section class="head"><h1>Live bus map</h1><p>Six buses on five routes in a town that does not exist. Pick a bus to see what the real-time feed says about it, or pick a stop to see when the next bus comes. <a href="/blog/live-bus-positions/">Read the write-up</a>.</p></section>
<div class="sheet strong demo" id="busmap"><p class="empty">This demo needs JavaScript turned on.</p></div>
<p class="note">${demoNote} The town, routes, stops and timetable are invented, and the bus positions come from a clock, not from GPS.</p>`,
}));
write('demos/stop-sign/index.html', layout({
  title: 'Bus stop sign demo', path: '/demos/stop-sign/', section: 'work', nav: 'work', og: 'demo-stop-sign', scripts: ['/demos/sim.js', '/demos/stopsign.js'],
  description: 'An on-screen version of the e-paper countdown sign for bus stops.',
  body: `<section class="head"><h1>Bus stop sign</h1><p>This is what the e-paper countdown sign would show at a stop. It reads the same made-up buses as the <a href="/demos/bus-map/">live map demo</a>. <a href="/blog/bus-stop-display/">Read the write-up</a>.</p></section>
<div class="sheet strong demo" id="stopsign"><p class="empty">This demo needs JavaScript turned on.</p></div>
<p class="note">${demoNote} The real sign is still a prototype. This page shows the idea, not the finished hardware.</p>`,
}));
const DEMOS = [
  ['dispatch-board', 'Scheduling', 'Dispatch board', 'Mark a driver as called in and the board works out who covers each route.'],
  ['procurement-wizard', 'Procurement', 'Procurement wizard', 'Answer plain questions about a purchase and get a completed sample form.'],
  ['bus-map', 'Open data', 'Live bus map', 'Watch buses move on a map and see the real-time feed behind each one.'],
  ['stop-sign', 'Hardware', 'Bus stop sign', 'An on-screen version of the e-paper countdown sign for bus stops.'],
];
write('demos/index.html', layout({
  title: 'Demos', path: '/demos/', section: 'work', nav: 'work', og: 'demos', description: 'Working demos of the transit tools Robert built, running in your browser with made-up data.',
  body: `<section class="head"><h1>Demos</h1><p>Four of the tools I built for work, running here with made-up data. Click around. You can't break anything.</p></section>
<div class="cards wide">
${DEMOS.map(([slug, kind, title, text]) => `<article class="sheet card reveal"><div class="chips"><span class="chip">${kind}</span></div><h3>${title}</h3><p>${text}</p><div class="end"><a class="btn" href="/demos/${slug}/">Try it</a></div></article>`).join('\n')}
</div>
<p class="note">${demoNote} There is also a <a href="/blog/portsmouth-scoring/">sailboat race scoring calculator</a> inside the scoring post.</p>`,
}));

// ---------- ask the site ----------
write('ask/index.html', layout({
  title: 'Ask the site', path: '/ask/', og: 'ask', description: 'Ask a question and a small AI answers it from the posts on r3ai.dev.',
  body: `<section class="head"><h1>Ask the site</h1><p>Type a question and a small AI will answer it using only the posts on this site, then show you which posts it used.</p></section>
<form class="sheet strong form" id="ask">
  <div class="field">
    <label for="ask-q">Your question</label>
    <textarea class="input" id="ask-q" name="q" required minlength="5" maxlength="300" rows="3" placeholder="Example: How do you check whether the AI got a regulation right?"></textarea>
  </div>
  <div class="chips" id="ask-ideas">
    <button class="chip" type="button">What do you use AI for at work?</button>
    <button class="chip" type="button">When has the AI been wrong?</button>
    <button class="chip" type="button">How did you build games for River?</button>
    <button class="chip" type="button">How does Portsmouth scoring work?</button>
  </div>
  <div class="acts"><button class="btn" type="submit">Ask</button><p class="form-msg" id="ask-msg" role="status"></p></div>
  <div class="answer" id="ask-out" aria-live="polite" hidden></div>
</form>
<p class="note">This is a bot, not me. It reads my posts and can still get things wrong, so open the posts it lists before you rely on an answer. It can't answer questions about bus service, and nothing it says is a statement from my employer.</p>
<p class="note">Questions are saved, without your name, so I can see what people want to know. Please don't type anything personal. It answers a limited number of questions each day.</p>
<noscript><p class="note">This page needs JavaScript turned on.</p></noscript>`,
}));

write('offline/index.html', layout({
  title: 'You are offline', path: '/offline/', description: 'This page is not saved on your device.',
  body: `<section class="head"><h1>No connection</h1><p>This page isn't saved on your device. Pages you have already opened still work, and so do any games you saved on the <a href="/games/">games page</a>.</p></section>`,
}));

const option = (value, label) => `<option value="${esc(value)}">${esc(label)}</option>`;
const aboutOptions = Object.entries(SECTIONS).map(([key, sec]) =>
  `<optgroup label="${sec.label} projects">${inSection(projects, key).map(p => option(p.title, p.title)).join('')}</optgroup>`).join('')
  + `<optgroup label="Posts">${posts.map(p => `<option value="${esc(p.title)}" data-slug="${p.slug}" data-side="${p.section}">${esc(p.title)}</option>`).join('')}</optgroup>`;
write('request/index.html', layout({
  title: 'Request a post', path: '/request/', nav: 'request', og: 'request', description: 'Ask Robert to write about anything on r3ai.dev, from the work side or the home side.',
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
<p class="note">Requests come to me first. If I take one on, I may list the topic below in my own words. I never publish what you wrote, your name or your email.</p>
<section id="asked" hidden>
  <h2 class="h2">What readers have asked for</h2>
  <ul class="sheet list asked" id="asked-list"></ul>
</section>
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
write('search.json', JSON.stringify(posts.map(p => ({ t: p.title, u: p.url, s: p.summary, c: p.section, x: p.text }))));
write('manifest.webmanifest', JSON.stringify({
  name: 'R3 AI: Robert, Rachelle and River', short_name: 'R Cubed', description: 'Software, games and family projects built with AI.',
  start_url: '/', scope: '/', display: 'standalone', background_color: '#e9f4f5', theme_color: '#0b6cc4',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [{ name: 'Games', url: '/games/' }, { name: 'Blog', url: '/blog/' }],
}, null, 1));
writeFileSync(join(OUT, 'sw.js'), readFileSync('src/sw.js'));
const paths = ['/', '/start/', '/work/', '/home/', '/blog/', '/games/', '/demos/', ...DEMOS.map(d => `/demos/${d[0]}/`), '/ask/', '/request/', '/about/', ...posts.map(p => p.url), ...projects.flatMap(p => (p.links || []).map(l => l.href)).filter(h => h.startsWith('/games/'))];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(paths)].map(p => `<url><loc>${SITE.url}${p}</loc></url>`).join('\n')}
</urlset>
`);
// the pages the visit counter will accept
write('paths.json', JSON.stringify([...new Set(paths)]));
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);

console.log(`Built ${posts.length} posts and ${projects.length} projects into ${OUT}/`);
