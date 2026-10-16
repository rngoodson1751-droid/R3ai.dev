// Who may open the call center page. Cloudflare Access sits in front of /work/call-center/ and signs people in with a
// one-time code sent to their email. Access then hands this Worker a signed token (the Cf-Access-Jwt-Assertion header)
// naming the person. This file checks that token for itself, so the page stays shut even if the Access application
// is ever switched off or set up wrong:
//   - the token must be signed by this account's Access team (its public keys at <team>/cdn-cgi/access/certs),
//   - it must be meant for the call center application (its "AUD tag"),
//   - it must not have expired,
//   - and the email in it must end in @cityoflc.us (or be listed in CALL_CENTER_EMAILS).
// Settings, in the Cloudflare dashboard (Worker r3ai-dev, Settings, Variables and Secrets):
//   CALL_CENTER_ACCESS_TEAM  the team domain, such as "r3ai.cloudflareaccess.com"
//   CALL_CENTER_ACCESS_AUD   the Application Audience (AUD) Tag from the Access application's Overview
//   CALL_CENTER_EMAILS       optional: extra addresses allowed in, separated by commas (for testing from another address)
// Until the first two are set the page answers that sign-in is not set up yet: it never opens without a check.

export const ALLOWED_DOMAIN = 'cityoflc.us';

let certs = null, certsAt = 0, certsTeam = '';
async function keysFor(team) {
  if (certs && certsTeam === team && Date.now() - certsAt < 3600e3) return certs;
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error('Access keys answered ' + res.status);
  const body = await res.json();
  certs = body.keys || []; certsAt = Date.now(); certsTeam = team;
  return certs;
}

const b64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
const part = s => JSON.parse(new TextDecoder().decode(b64(s)));
const cookie = (request, name) => (request.headers.get('cookie') || '').split(/;\s*/).map(c => c.split('=')).find(([k]) => k === name)?.slice(1).join('=') || '';

// Returns { ok: true, email } or { ok: false, status, why }.
export async function staffCheck(request, env) {
  const team = String(env.CALL_CENTER_ACCESS_TEAM || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
  const aud = String(env.CALL_CENTER_ACCESS_AUD || '').trim();
  if (!team || !aud) return { ok: false, status: 503, why: 'setup' };
  const token = request.headers.get('cf-access-jwt-assertion') || cookie(request, 'CF_Authorization');
  if (!token) return { ok: false, status: 403, why: 'signin' };
  try {
    const [h, p, s] = token.split('.');
    const head = part(h), body = part(p);
    if (head.alg !== 'RS256') throw new Error('unexpected algorithm');
    let jwk = (await keysFor(team)).find(k => k.kid === head.kid);
    if (!jwk) { certs = null; jwk = (await keysFor(team)).find(k => k.kid === head.kid); } // Access rotates its keys now and then
    if (!jwk) throw new Error('unknown key');
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const good = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64(s), new TextEncoder().encode(h + '.' + p));
    if (!good) throw new Error('bad signature');
    const now = Date.now() / 1000;
    if (!(body.exp > now) || (body.nbf && body.nbf > now + 60)) throw new Error('expired');
    if (body.iss !== `https://${team}`) throw new Error('wrong issuer');
    if (!(Array.isArray(body.aud) ? body.aud : [body.aud]).includes(aud)) throw new Error('wrong application');
    const email = String(body.email || '').toLowerCase().trim();
    const extra = String(env.CALL_CENTER_EMAILS || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
    if (!email || !(email.endsWith('@' + ALLOWED_DOMAIN) || extra.includes(email))) return { ok: false, status: 403, why: 'domain', email };
    return { ok: true, email };
  } catch (e) {
    console.error('call center sign-in refused', e?.message || e);
    return { ok: false, status: 403, why: 'signin' };
  }
}

// What someone sees when they cannot come in. Plain, and it never shows any transit data.
export function refusal(check) {
  const msg = {
    setup: ['Sign-in is not set up yet', 'This page opens only for City staff after Cloudflare Access is switched on for it.'],
    signin: ['Please sign in', 'Your sign-in has run out or could not be read. Reload the page to get a new code by email.'],
    domain: ['City email required', `This page is for City of Lake Charles staff. Sign in with your @${ALLOWED_DOMAIN} email address.`],
  }[check.why] || ['Not available', ''];
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>LC Transit Call Center</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#eef3f8;color:#0a1726;font:17px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:16px;box-sizing:border-box}
main{max-width:30rem;background:#fff;border:1px solid rgba(10,23,38,.14);border-radius:20px;padding:24px 26px;box-shadow:0 10px 30px rgba(10,23,38,.12)}h1{font-size:1.35rem;margin:0 0 .4rem}p{margin:.3rem 0}a{color:#0a56c2;font-weight:700}</style></head>
<body><main><h1>${msg[0]}</h1><p>${msg[1]}</p>${check.why === 'domain' ? '<p><a href="/cdn-cgi/access/logout">Sign out and use another address</a></p>' : ''}</main></body></html>`;
  return new Response(html, { status: check.status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } });
}
