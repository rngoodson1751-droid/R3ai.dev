// The only server code on r3ai.dev. It takes post requests from the form at /request/
// and saves them to the r3ai-requests database. Every other address is a plain file from ./dist.
const SIDES = ['work', 'home', 'either'];
const PER_PERSON_PER_HOUR = 5;
const EVERYONE_PER_DAY = 200;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/requests') {
      if (request.method !== 'POST') return json({ error: 'Use the form at /request/ to send a request.' }, 405, { Allow: 'POST' });
      return submit(request, env, url);
    }
    return env.ASSETS.fetch(request);
  },
};

async function submit(request, env, url) {
  const isJson = (request.headers.get('content-type') || '').includes('application/json');
  const done = () => isJson ? json({ ok: true }) : Response.redirect(new URL('/request/thanks/', url), 303);
  const fail = (message, status = 400) => isJson ? json({ error: message }, status)
    : new Response(`${message}\n\nGo back and try again.`, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });

  // Only the site's own form may post here.
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return fail('This form only works from r3ai.dev.', 403);

  let data;
  try {
    if (Number(request.headers.get('content-length') || 0) > 20000) return fail('That request is too long.', 413);
    data = isJson ? await request.json() : Object.fromEntries(await request.formData());
  } catch { return fail('That request could not be read.'); }
  const text = (v, max) => String(v ?? '').replace(/\r/g, '').trim().slice(0, max);

  if (text(data.website, 10)) return done(); // a hidden box people never see; only bots fill it in
  const message = text(data.message, 2000);
  const side = SIDES.includes(data.side) ? data.side : 'either';
  const about = text(data.about, 160) || null;
  const name = text(data.name, 80) || null;
  const email = text(data.email, 120) || null;
  if (message.length < 10) return fail('Tell me a little more about what you want to read.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('That email address does not look right.');

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${day}:${ip}`));
  const ipHash = [...new Uint8Array(bytes)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');

  try {
    const recent = await env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM requests WHERE ip_hash = ?1 AND created_at > datetime('now', '-1 hour')) AS mine,
              (SELECT COUNT(*) FROM requests WHERE created_at > datetime('now', '-1 day')) AS everyone`).bind(ipHash).first();
    if (recent.mine >= PER_PERSON_PER_HOUR || recent.everyone >= EVERYONE_PER_DAY) return fail('That is a lot of requests. Please try again later.', 429);
    await env.DB.prepare('INSERT INTO requests (side, about, message, name, email, ip_hash) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
      .bind(side, about, message, name, email, ipHash).run();
  } catch (e) {
    console.error('request not saved', e);
    return fail('Something went wrong saving your request. Please try again in a minute.', 500);
  }
  return done();
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
}
