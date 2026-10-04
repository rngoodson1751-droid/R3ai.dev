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
  }).filter(p => p.draft !== 'true').sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)));
}
const posts = loadPosts();
const projects = JSON.parse(readFileSync('content/projects.json', 'utf8'));

// ---------- templates ----------
function layout({ title, description, path, section = '', nav = '', body }) {
  const full = title ? `${title} · ${SITE.name}` : `${SITE.name} · Robert, Rachelle and River`;
  const link = (href, label, key) => `<a href="${href}"${nav === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE.url}${path}">
<meta property="og:title" content="${esc(title || SITE.name)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE.url}${path}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${SITE.name}" href="/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/styles.css">
</head>
<body${section ? ` data-section="${section}"` : ''}>
<header class="site-head"><div class="wrap">
  <a class="mark" href="/" aria-label="R cubed, home page">R<sup>3</sup><span>r3ai.dev</span></a>
  <nav class="nav" aria-label="Main">
    ${link('/work/', 'At work', 'work')}
    ${link('/home/', 'At home', 'home')}
    ${link('/blog/', 'Blog', 'blog')}
    ${link('/about/', 'About', 'about')}
  </nav>
</div></header>
<main>
${body}
</main>
<footer class="site-foot"><div class="wrap">
  <nav aria-label="Footer"><a href="/blog/">Blog</a><a href="/feed.xml">RSS feed</a><a href="/about/">About</a></nav>
  <p>&copy; ${new Date().getUTCFullYear()} ${SITE.author}. This is a personal site. It is not an official site of my employer, and the opinions here are my own.</p>
</div></footer>
</body>
</html>
`;
}
const chip = s => `<span class="chip ${s}">${SECTIONS[s].label}</span>`;
function postList(list, showChip = true) {
  if (!list.length) return '<p class="empty">No posts here yet.</p>';
  return '<ul class="list">' + list.map(p => `<li>
  <div><time datetime="${p.date}">${longDate(p.date)}</time>${showChip ? `<br>${chip(p.section)}` : ''}</div>
  <div><h3><a href="${p.url}">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p></div>
</li>`).join('\n') + '</ul>';
}
function projectCards(section) {
  const list = projects.filter(p => p.section === section);
  if (!list.length) return '';
  return '<div class="cards">' + list.map(p => `<article class="card">
  <p class="eyebrow">${esc(p.kind)}</p>
  <h3>${esc(p.title)}</h3>
  <p>${esc(p.summary)}</p>
  <div class="links">${p.links.map((l, i) => `<a${i === 0 ? ' class="btn"' : ''} href="${l.href}">${esc(l.label)}</a>`).join('')}</div>
</article>`).join('\n') + '</div>';
}

// ---------- pages ----------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
if (existsSync('static')) cpSync('static', OUT, { recursive: true });
writeFileSync(join(OUT, 'styles.css'), readFileSync('src/styles.css'));

write('index.html', layout({
  title: '', path: '/',
  description: 'Robert Goodson builds software with AI: tools for public transit at work, and games and projects for his family at home.',
  body: `<div class="wrap">
<section class="hero">
  <p class="eyebrow">R cubed</p>
  <h1 class="equation" aria-label="Robert times Rachelle times River equals R cubed"><span class="r1">Robert</span><i>&times;</i><span>Rachelle</span><i>&times;</i><span class="r3">River</span><i>=</i><span>R<sup>3</sup></span></h1>
  <p>I'm Robert. I build software with AI: tools for public transit at work, and games and projects for my family at home. This site keeps both in one place.</p>
</section>
<section class="doors" aria-label="Sections">
  <a class="door work" href="/work/"><p class="eyebrow">Weekdays</p><h2>At work</h2><p>Transit software, process fixes and notes from running a city bus system.</p><span class="go">Go to work &rarr;</span></a>
  <a class="door home" href="/home/"><p class="eyebrow">Evenings and weekends</p><h2>At home</h2><p>Games, experiments and things made for River and the family. Start with the kart racer.</p><span class="go">Go home &rarr;</span></a>
</section>
<section class="block"><h2>Latest posts</h2>${postList(posts.slice(0, 5))}<p><a href="/blog/">All posts</a></p></section>
</div>`,
}));

const sectionCopy = {
  work: {
    intro: 'I manage a city transit division, and I build custom software for it when nothing off the shelf fits. This section collects those tools and what I learn building them.',
    projectsEmpty: 'Project write-ups are on the way. Each one will cover the problem, the tool and what changed.',
    projectsTitle: 'Projects',
    description: 'Transit software and notes from running a city bus system.',
  },
  home: {
    intro: 'What I build away from work, mostly for River and the family: games, experiments and whatever we think up next.',
    projectsEmpty: 'Nothing here yet.',
    projectsTitle: 'Games and projects',
    description: 'Games, experiments and family projects built with AI.',
  },
};
for (const [key, s] of Object.entries(SECTIONS)) {
  const c = sectionCopy[key], cards = projectCards(key);
  write(`${key}/index.html`, layout({
    title: s.label, path: s.path, section: key, nav: key, description: c.description,
    body: `<div class="band"><div class="wrap"><p class="eyebrow">Section</p><h1>${s.label}</h1><p>${c.intro}</p></div></div>
<div class="wrap">
<section class="block"><h2>${c.projectsTitle}</h2>${cards || `<p class="empty">${c.projectsEmpty}</p>`}</section>
<section class="block" id="posts"><h2>Posts</h2>${postList(posts.filter(p => p.section === key), false)}</section>
${key === 'work' ? '<p class="note">Everything in this section is my own account of my work. None of it is an official statement from my employer.</p>' : ''}
</div>`,
  }));
}

write('blog/index.html', layout({
  title: 'Blog', path: '/blog/', nav: 'blog', description: 'Every post from both sides of the site, newest first.',
  body: `<div class="band"><div class="wrap"><p class="eyebrow">${posts.length} ${posts.length === 1 ? 'post' : 'posts'}</p><h1>Blog</h1><p>Every post from both sides of the site, newest first. Only want one side? See <a href="/work/#posts">At work</a> or <a href="/home/#posts">At home</a>.</p></div></div>
<div class="wrap"><section class="block">${postList(posts)}</section></div>`,
}));

for (const p of posts) {
  write(`blog/${p.slug}/index.html`, layout({
    title: p.title, path: p.url, section: p.section, nav: 'blog', description: p.summary,
    body: `<div class="wrap"><article class="post">
<header><p class="meta"><time datetime="${p.date}">${longDate(p.date)}</time> &nbsp; ${chip(p.section)}</p><h1>${esc(p.title)}</h1></header>
<div class="prose">
${p.html}
</div>
<p class="back"><a href="${SECTIONS[p.section].path}">&larr; More from ${SECTIONS[p.section].label.toLowerCase()}</a></p>
</article></div>`,
  }));
}

write('about/index.html', layout({
  title: 'About', path: '/about/', nav: 'about', description: 'Who is behind r3ai.dev and what the name means.',
  body: `<div class="band"><div class="wrap"><p class="eyebrow">About</p><h1>Three R's</h1><p>R cubed is my family: Robert, Rachelle and River. I'm Robert, and I write everything here.</p></div></div>
<div class="wrap"><div class="post"><div class="prose">
<h2>What this site is</h2>
<p>I'm a self-taught web developer who manages a city transit division. At work I build the tools the job needs. At home I build things for my family, like a kart racing game with sloths in it.</p>
<p>Most of what you'll find here was built with AI doing a large share of the typing. I write about what worked, what didn't and what I'd do differently.</p>
<h2>How it's split</h2>
<ul>
<li><a href="/work/">At work</a> covers transit software and what I learn from running a bus system.</li>
<li><a href="/home/">At home</a> covers games, experiments and family projects.</li>
<li>The <a href="/blog/">blog</a> holds posts from both.</li>
</ul>
<h2>How it's built</h2>
<p>The site is plain HTML produced by a small build script, with posts written as text files. It is hosted on Cloudflare and the source lives on <a href="https://github.com/rngoodson1751-droid/R3ai.dev">GitHub</a>.</p>
<h2>The fine print</h2>
<p>This is a personal site. It is not an official site of my employer, and the opinions here are my own.</p>
</div></div></div>`,
}));

write('404.html', layout({
  title: 'Page not found', path: '/404.html', description: 'That page does not exist.',
  body: `<div class="band"><div class="wrap"><p class="eyebrow">Error 404</p><h1>Wrong stop</h1><p>There's no page at this address. Try the <a href="/">home page</a> or the <a href="/blog/">blog</a>.</p></div></div>`,
}));

// ---------- feed, sitemap, robots ----------
write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${SITE.name}</title><link>${SITE.url}/</link><description>Posts from r3ai.dev</description>
${posts.map(p => `<item><title>${esc(p.title)}</title><link>${SITE.url}${p.url}</link><guid>${SITE.url}${p.url}</guid><pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate><category>${SECTIONS[p.section].label}</category><description>${esc(p.summary)}</description></item>`).join('\n')}
</channel></rss>
`);
const paths = ['/', '/work/', '/home/', '/blog/', '/about/', ...posts.map(p => p.url), ...projects.flatMap(p => p.links.map(l => l.href)).filter(h => h.startsWith('/games/'))];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(paths)].map(p => `<url><loc>${SITE.url}${p}</loc></url>`).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);

console.log(`Built ${posts.length} posts and ${projects.length} projects into ${OUT}/`);
