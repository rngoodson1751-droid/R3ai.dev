// The live service behind the lobby display: GET <page address>/live
// Answers with the buses in service right now (each matched to a route), any rider alerts and
// notices, and the weather. Bus positions come from the Zonar vehicle tracker when its login is
// set as Worker secrets (ZONAR_CUSTOMER, ZONAR_USERNAME, ZONAR_PASSWORD); until then, from the
// simulator in sim.js, and the page says so.
import raw from './network.json';
import { prepare, localTime, tripsOn } from './geo.js';
import { update } from './fleet.js';
import { simReports, SIM } from './sim.js';

export const networkForPage = JSON.stringify(raw).replace(/</g, '\\u003c'); // what the page draws from, taken before prepare() adds its working data
const net = prepare(raw);
const TERMINAL = [net.routes[0].shape[0][0], net.routes[0].shape[0][1]];
const ZONAR_EVERY = 20e3;   // never ask Zonar more often than this
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' } });
const zonarOn = env => !!(env.ZONAR_CUSTOMER && env.ZONAR_USERNAME && env.ZONAR_PASSWORD);
const memo = {}; // small per-Worker memory: {key: {t, v}}
async function cached(key, ms, make) {
  const now = Date.now(), hit = memo[key];
  if (hit && now - hit.t < ms) return hit.v;
  const v = await make();
  memo[key] = { t: now, v };
  return v;
}

export async function live(request, env, url, ctx) {
  const demoAt = Number(url.searchParams.get('at')) || 0;
  if (zonarOn(env) && url.searchParams.has('debug')) return json(await zonarDebug(env));
  const useZonar = zonarOn(env) && !demoAt; // the demo setting (?demo=10:20) always runs on simulated buses, and the page labels it so
  const now = demoAt > 0 ? demoAt : Date.now();
  const lt = localTime(now, net.feed.timezone);
  let fleet;
  try { fleet = useZonar ? await zonarFleet(env, now) : simFleet(now); }
  catch (e) { console.error('fleet failed', e?.message || e); fleet = { vehicles: [], counts: {}, error: 'no-data' }; }
  const [notes, wx] = await Promise.all([alerts(env), weather(ctx)]);
  return json({
    now, source: useZonar ? 'zonar' : 'sim', error: fleet.error || null,
    service: net.routes.some(r => tripsOn(net, r, lt).length > 0),
    vehicles: fleet.vehicles, counts: fleet.counts,
    alerts: demoAt && !useZonar ? [...notes, ...SAMPLES] : notes, weather: wx,
  });
}
// Shown only in demo mode (?demo=10:20), so the alert banner and notice panel can be seen before any real ones exist.
const SAMPLES = [
  { id: 's1', kind: 'alert', sample: true, routes: ['3'], title: 'Sample alert: Route 3 detour on Mill Street', body: 'Mill Street is closed between Bank Street and Enterprise Boulevard. Buses are using Broad Street. Stops on the closed blocks are not served.', title_es: 'Alerta de muestra: desvío de la Ruta 3 en Mill Street', body_es: 'Mill Street está cerrada entre Bank Street y Enterprise Boulevard. Los autobuses usan Broad Street. No hay servicio en las paradas de las cuadras cerradas.' },
  { id: 's2', kind: 'notice', sample: true, routes: [], title: 'Sample notice: No bus service on Thanksgiving', body: 'Buses do not run Thursday, November 26 or Friday, November 27. Regular service resumes Monday.', title_es: 'Aviso de muestra: sin servicio el Día de Acción de Gracias', body_es: 'No hay autobuses el jueves 26 ni el viernes 27 de noviembre. El servicio regular vuelve el lunes.' },
];

// ---------- simulator ----------
let simMem = null;
function simFleet(now) {
  if (!simMem || now < simMem.t || now - simMem.t > 10 * 60e3) simMem = { t: now - 100 * 60e3, states: {} }; // replay the last 100 minutes so buses arrive already matched
  let out = null;
  for (let t = Math.ceil((simMem.t + 1) / SIM.interval) * SIM.interval; t < now; t += SIM.interval) update(net, simMem.states, simReports(net, t), t);
  out = update(net, simMem.states, simReports(net, now), now);
  simMem.t = now;
  return out;
}

// ---------- Zonar ----------
// Zonar's Ground Traffic Control interface, "showposition / current": the latest position of every asset.
async function zonarText(env) {
  const q = new URLSearchParams({ customer: env.ZONAR_CUSTOMER, username: env.ZONAR_USERNAME, password: env.ZONAR_PASSWORD, action: 'showposition', operation: 'current', format: 'xml', version: '2', logvers: '3' });
  // Zonar refuses a request that does not say what is asking (error 113), and a Worker sends no User-Agent of its own.
  const res = await fetch('https://omi.zonarsystems.net/interface.php?' + q, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; LCTransitTracker/1.0; +https://r3ai.dev)', accept: 'application/xml, text/xml, */*' }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error('Zonar answered ' + res.status); // never log the address: it carries the login
  return res.text();
}
const COMPASS = { N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5, S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5 };
const ZONES = { UTC: 0, GMT: 0, EDT: -4, EST: -5, CDT: -5, CST: -6, MDT: -6, MST: -7, PDT: -7, PST: -8 };
function when(v, now) { // Zonar writes "2026-10-05 00:40 CDT". Seconds since 1970 and other date forms are read too.
  if (v == null || v === '') return NaN;
  if (/^\d{9,13}$/.test(v)) return v.length > 11 ? +v : +v * 1000;
  const named = String(v).trim().match(/^(\d{4})-(\d\d)-(\d\d)[ T](\d\d):(\d\d)(?::(\d\d))?\s*([A-Z]{3,4})$/);
  if (named && named[7] in ZONES) return Date.UTC(+named[1], +named[2] - 1, +named[3], +named[4] - ZONES[named[7]], +named[5], +(named[6] || 0));
  const s = String(v).trim().replace(' ', 'T'), zoned = /[zZ]|[+-]\d\d:?\d\d$/.test(s);
  if (zoned) return Date.parse(s);
  // a bare date and time may be UTC or local, so take the reading closest to now
  const utc = Date.parse(s + 'Z'), lt = localTime(utc, net.feed.timezone), shift = Math.round((Date.UTC(+lt.day.slice(0, 4), +lt.day.slice(4, 6) - 1, +lt.day.slice(6), 0, 0, lt.sec) - utc) / 60e3) * 60e3;
  const local = utc - shift;
  return Math.abs(now - local) < Math.abs(now - utc) ? local : utc;
}
export function parseZonar(text, now = Date.now()) {
  const out = [], err = text.match(/<error[^>]*>([\s\S]*?)<\/error>/i);
  if (err) throw new Error('Zonar: ' + err[1].replace(/<[^>]+>/g, ' ').trim().slice(0, 120));
  const add = (o, unit) => {
    const lat = parseFloat(o.lat ?? o.latitude), lon = parseFloat(o.long ?? o.lon ?? o.lng ?? o.longitude);
    const speed = parseFloat(o.speed), kmh = !/mi|mph/i.test(unit || o.speedunit || '');
    const hd = String(o.heading ?? '').trim().toUpperCase();
    const power = String(o.power ?? o.ignition ?? '').trim().toLowerCase();
    out.push({
      id: String(o.fleet ?? o.assetnumber ?? o.name ?? o.id ?? '').trim(), t: when(String(o.time ?? o.timestamp ?? ''), now), lat, lon,
      h: hd in COMPASS ? COMPASS[hd] : Number.isFinite(parseFloat(hd)) ? parseFloat(hd) : null,
      s: Number.isFinite(speed) ? speed * (kmh ? 0.27778 : 0.44704) : null,
      power: power ? !/^(off|0|false|no)$/.test(power) : true,
    });
  };
  if (/^\s*[[{]/.test(text)) { // JSON: find the list of objects that carry a latitude
    const walk = v => { if (Array.isArray(v)) { if (v.some(x => x && typeof x === 'object' && ('lat' in x || 'latitude' in x))) v.forEach(x => x && add(x)); else v.forEach(walk); } else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
    walk(JSON.parse(text));
  } else {
    for (const m of text.matchAll(/<asset\b([^>]*)>([\s\S]*?)<\/asset>/gi)) {
      const o = {};
      for (const a of m[1].matchAll(/([\w-]+)\s*=\s*"([^"]*)"/g)) o[a[1].toLowerCase()] = a[2];
      let unit = '';
      for (const c of m[2].matchAll(/<([\w-]+)\b([^>]*)>([^<]*)<\/\1>/g)) { o[c[1].toLowerCase()] = c[3].trim(); if (c[1].toLowerCase() === 'speed') unit = (c[2].match(/unit\s*=\s*"([^"]*)"/i) || [])[1] || ''; }
      add(o, unit);
    }
  }
  return out.filter(r => r.id && Number.isFinite(r.lat) && Number.isFinite(r.lon) && Number.isFinite(r.t));
}
async function zonarFleet(env, now) {
  return cached('zonar', 8e3, async () => {
    const row = await env.DB.prepare('SELECT v FROM transit_state WHERE k = ?1').bind('buses').first();
    const saved = row ? JSON.parse(row.v) : { states: {}, fetched: 0, out: null };
    if (saved.out && now - saved.fetched < ZONAR_EVERY) return saved.out; // another copy of the Worker asked Zonar a moment ago
    let reports;
    try { reports = parseZonar(await zonarText(env), now); }
    catch (e) { console.error('Zonar not read', e?.message || e); return { vehicles: [], counts: {}, error: 'tracker-unavailable' }; }
    const day = localTime(now, net.feed.timezone).day;
    const forced = Object.fromEntries(((await env.DB.prepare('SELECT bus, route FROM transit_overrides WHERE day = ?1').bind(day).all().catch(() => ({ results: [] }))).results || []).map(o => [o.bus, o.route]));
    const out = update(net, saved.states, reports, now, forced);
    await env.DB.prepare('INSERT INTO transit_state (k, v, t) VALUES (?1, ?2, ?3) ON CONFLICT (k) DO UPDATE SET v = ?2, t = ?3')
      .bind('buses', JSON.stringify({ states: saved.states, fetched: now, out }), now).run();
    return out;
  });
}
// <page address>/live?debug=1 while Zonar is connected: what came back, with no login in it, for tuning the reader above.
async function zonarDebug(env) {
  try {
    const text = await zonarText(env), now = Date.now(), reports = parseZonar(text, now);
    return { ok: true, bytes: text.length, tags: [...new Set([...text.matchAll(/<([\w-]+)/g)].map(m => m[1]))].slice(0, 40), firstAsset: (text.match(/<asset\b[\s\S]*?<\/asset>/i) || [text.slice(0, 600)])[0].slice(0, 900), parsed: reports.length, sample: reports.slice(0, 3).map(r => ({ ...r, ageSeconds: Math.round((now - r.t) / 1000) })) };
  } catch (e) { return { ok: false, error: String(e?.message || e).slice(0, 200) }; }
}

// ---------- alerts and notices ----------
// Rows in transit_alerts. kind 'alert' shows in the banner across the top; 'notice' goes in the lobby panel and the ticker.
function alerts(env) {
  return cached('alerts', 30e3, async () => {
    try {
      const { results } = await env.DB.prepare(
        `SELECT id, kind, title, body, title_es, body_es, routes FROM transit_alerts
         WHERE (starts_at IS NULL OR starts_at <= datetime('now')) AND (ends_at IS NULL OR ends_at > datetime('now'))
         ORDER BY kind, id DESC LIMIT 12`).all();
      return results.map(a => ({ ...a, routes: (a.routes || '').split(',').map(s => s.trim()).filter(Boolean) }));
    } catch (e) { console.error('alerts not read', e?.message || e); return []; }
  });
}

// ---------- weather ----------
// National Weather Service forecast for the terminal, plus any severe or extreme warning in force there.
const NWS = { headers: { 'user-agent': 'r3ai.dev transit lobby display', accept: 'application/geo+json' } };
async function nws(url, ctx, ttl) {
  const key = new Request(url), cache = globalThis.caches?.default;
  const hit = cache && await cache.match(key).catch(() => null);
  if (hit) return hit.json();
  const res = await fetch(url, { ...NWS, signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error('weather ' + res.status);
  const body = await res.text();
  if (cache) { const put = cache.put(key, new Response(body, { headers: { 'content-type': 'application/json', 'cache-control': `max-age=${ttl}` } })).catch(() => {}); ctx?.waitUntil ? ctx.waitUntil(put) : await put; }
  return JSON.parse(body);
}
function weather(ctx) {
  return cached('weather', 10 * 60e3, async () => {
    try {
      const point = (await nws(`https://api.weather.gov/points/${TERMINAL[0].toFixed(4)},${TERMINAL[1].toFixed(4)}`, ctx, 86400)).properties;
      const [hourly, daily, warn] = await Promise.all([
        nws(point.forecastHourly, ctx, 900), nws(point.forecast, ctx, 1800),
        nws(`https://api.weather.gov/alerts/active?point=${TERMINAL[0].toFixed(4)},${TERMINAL[1].toFixed(4)}`, ctx, 300).catch(() => ({ features: [] })),
      ]);
      return parseWeather(hourly, daily, warn);
    } catch (e) { console.error('weather not read', e?.message || e); return null; }
  });
}
export function parseWeather(hourly, daily, warn) {
  const h = hourly.properties.periods[0], d = daily.properties.periods.slice(0, 2);
  return {
    temp: h.temperature, unit: h.temperatureUnit, text: h.shortForecast, rain: h.probabilityOfPrecipitation?.value ?? null, wind: `${h.windDirection || ''} ${h.windSpeed || ''}`.trim(), day: h.isDaytime,
    next: d.map(p => ({ name: p.name, temp: p.temperature, text: p.shortForecast, day: p.isDaytime })),
    warnings: (warn.features || []).map(f => f.properties).filter(p => ['Severe', 'Extreme'].includes(p.severity)).slice(0, 3).map(p => ({ event: p.event, headline: p.headline || p.event })),
  };
}
