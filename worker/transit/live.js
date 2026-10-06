// The live service behind the lobby display: GET <page address>/live
// Answers with the buses in service right now (each matched to a route), any rider alerts and
// notices, and the weather. Bus positions come from the City's two vehicle trackers, whichever
// have their login set as Worker secrets: Zonar (ZONAR_CUSTOMER, ZONAR_USERNAME, ZONAR_PASSWORD)
// and Geotab (GEOTAB_DATABASE, GEOTAB_USERNAME, GEOTAB_PASSWORD, and GEOTAB_SERVER if it is not
// my.geotab.com). With both set, each bus uses whichever tracker heard from it last, so one dead
// unit does not take a bus off the map. With neither, the simulator in sim.js, and the page says so.
import raw from './network.json';
import { prepare, localTime, tripsOn, metres } from './geo.js';
import { update, mergeReports, heard, LIVE } from './fleet.js';
import { simReports, SIM } from './sim.js';

export const networkForPage = JSON.stringify(raw).replace(/</g, '\\u003c'); // what the page draws from, taken before prepare() adds its working data
const net = prepare(raw);
const TERMINAL = [net.routes[0].shape[0][0], net.routes[0].shape[0][1]];
const ZONAR_EVERY = 20e3;   // never ask Zonar more often than this
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' } });
const zonarOn = env => !!(env.ZONAR_CUSTOMER && env.ZONAR_USERNAME && env.ZONAR_PASSWORD);
const geotabOn = env => !!(env.GEOTAB_DATABASE && env.GEOTAB_USERNAME && env.GEOTAB_PASSWORD);
const trackersOn = env => zonarOn(env) || geotabOn(env);
const sourceName = env => [zonarOn(env) && 'zonar', geotabOn(env) && 'geotab'].filter(Boolean).join('+');
const UA = 'Mozilla/5.0 (compatible; LCTransitTracker/1.0; +https://r3ai.dev)';
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
  if (trackersOn(env) && url.searchParams.has('debug')) return json(await trackerDebug(env));
  const useZonar = trackersOn(env) && !demoAt; // the demo setting (?demo=10:20) always runs on simulated buses, and the page labels it so
  const now = demoAt > 0 ? demoAt : Date.now();
  const lt = localTime(now, net.feed.timezone);
  let fleet;
  try { fleet = useZonar ? await liveFleet(env, now) : simFleet(now); }
  catch (e) { console.error('fleet failed', e?.message || e); fleet = { vehicles: [], counts: {}, error: 'no-data' }; }
  const [notes, wx] = await Promise.all([alerts(env), weather(ctx)]);
  return json({
    now, source: useZonar ? sourceName(env) : 'sim', error: fleet.error || null, trackers: fleet.trackers || null,
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
  const res = await fetch('https://omi.zonarsystems.net/interface.php?' + q, { headers: { 'user-agent': UA, accept: 'application/xml, text/xml, */*' }, signal: AbortSignal.timeout(12000) });
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
      id: String(o.fleet ?? o.assetnumber ?? o.name ?? o.id ?? '').trim().split('-').pop(), src: 'zonar', t: when(String(o.time ?? o.timestamp ?? ''), now), lat, lon,
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

// ---------- Geotab ----------
// MyGeotab's API: sign in once for a session, then ask for every device's current status.
let geoSession = null, geoRefusedAt = 0;
async function geoCall(host, method, params) {
  const res = await fetch(`https://${host}/apiv1`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': UA }, body: JSON.stringify({ method, params }), signal: AbortSignal.timeout(12000) });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.error) {
    const name = body?.error?.errors?.[0]?.name || body?.error?.name || String(body?.error?.message || res.status).slice(0, 80);
    throw Object.assign(new Error('Geotab: ' + name), { expired: /InvalidUser|SessionExpired/i.test(name) }); // never the request itself: it carries the login
  }
  return body.result;
}
function geoSignIn(env) { // one sign-in shared by every request that needs it
  // a refused sign-in is not retried for five minutes, so a wrong password cannot lock the account
  if (Date.now() - geoRefusedAt < 5 * 60e3) return Promise.reject(new Error('Geotab: sign-in was refused; waiting before trying again'));
  const first = String(env.GEOTAB_SERVER || 'my.geotab.com').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return geoCall(first, 'Authenticate', { database: env.GEOTAB_DATABASE, userName: env.GEOTAB_USERNAME, password: env.GEOTAB_PASSWORD })
    .then(r => ({ host: r.path && r.path !== 'ThisServer' ? r.path : first, credentials: r.credentials }))
    .catch(e => { if (e.expired) geoRefusedAt = Date.now(); geoSession = null; throw e; });
}
async function geoGet(env, typeName, extra = {}) {
  for (let attempt = 0; ; attempt++) {
    const session = await (geoSession ??= geoSignIn(env));
    try { return await geoCall(session.host, 'Get', { typeName, credentials: session.credentials, ...extra }); }
    catch (e) { if (e.expired && attempt === 0) { geoSession = null; continue; } throw e; }
  }
}
// Which bus a Geotab device is. A name carrying the fleet number ("0609-47") always counts. Any other
// name is trusted only when the tracker's Geotab user can see a small set of vehicles, meaning it has
// been limited to Transit: on a City-wide account, "Unit 47" could be anybody's truck. GEOTAB_BUSES,
// an optional variable such as {"47":"Gillig 47","42":"TR-042"}, names them outright.
export function busForDevice(name, scoped, known, named = {}) {
  const n = String(name || '').trim();
  for (const bus in named) if (String(named[bus]).trim().toLowerCase() === n.toLowerCase()) return bus;
  // Geotab writes the fleet number "609-047" where Zonar writes "0609-47": both are Bus 47. When Zonar's list of
  // buses is known, a Geotab vehicle outside it (a paratransit van, a support truck) is not a fixed-route bus.
  const fleet = n.match(/(?:^|\D)0?609[\s_-]?(\d{2,3})(?!\d)/);
  if (fleet) { const bus = String(+fleet[1]); return known.size && !known.has(bus) ? null : bus; }
  if (!scoped) return null;
  const nums = (n.match(/\d+/g) || []).filter(x => x.length <= 3).map(x => String(+x));
  if (known.size) return nums.find(x => known.has(x)) || null;
  return nums.length ? nums[nums.length - 1] : null;
}
async function geotabRead(env, now, known) {
  const [devices, infos] = await Promise.all([
    cached('geoDevices', 6 * 3600e3, () => geoGet(env, 'Device', { propertySelector: { fields: ['id', 'name'], isIncluded: true } }).catch(e => { if (e.expired) throw e; return geoGet(env, 'Device'); })),
    geoGet(env, 'DeviceStatusInfo'),
  ]);
  let named = {};
  try { named = env.GEOTAB_BUSES ? JSON.parse(env.GEOTAB_BUSES) : {}; } catch { named = {}; }
  const scoped = devices.length <= 30, busOf = {}, unmatched = [], nameOf = {};
  for (const d of devices) { const bus = busForDevice(d.name, scoped, known, named); if (bus) { busOf[d.id] = bus; nameOf[bus] = d.name; } else unmatched.push(d.name); }
  const reports = [];
  for (const i of infos) {
    const bus = busOf[i.device?.id], t = Date.parse(i.dateTime);
    if (!bus || !Number.isFinite(t) || (!i.latitude && !i.longitude)) continue;
    reports.push({ id: bus, src: 'geotab', name: nameOf[bus], t, lat: i.latitude, lon: i.longitude, h: i.bearing >= 0 ? i.bearing : null, s: Number.isFinite(i.speed) ? i.speed * 0.27778 : null, power: i.isDeviceCommunicating !== false });
  }
  return { reports, seen: devices.length, matched: Object.keys(busOf).length, unmatched: scoped ? unmatched.slice(0, 30) : null };
}

// ---------- the two trackers together ----------
async function readTrackers(env, now, saved = {}) {
  const lists = [], trackers = {};
  let geo = null;
  if (zonarOn(env)) {
    if (saved.zonar && now - saved.zonar.t < ZONAR_EVERY) { lists.push(saved.zonar.reports); trackers.zonar = 'ok'; }
    else try { saved.zonar = { t: now, reports: parseZonar(await zonarText(env), now) }; lists.push(saved.zonar.reports); trackers.zonar = 'ok'; }
    catch (e) { console.error('Zonar not read', e?.message || e); trackers.zonar = String(e?.message || e).slice(0, 120); if (saved.zonar && now - saved.zonar.t < 120e3) lists.push(saved.zonar.reports); }
  }
  if (geotabOn(env)) {
    try { geo = await geotabRead(env, now, new Set((saved.zonar?.reports || []).map(r => r.id))); lists.push(geo.reports); trackers.geotab = 'ok'; }
    catch (e) { console.error('Geotab not read', e?.message || e); trackers.geotab = String(e?.message || e).slice(0, 120); }
  }
  return { lists, trackers, geo };
}
const RULES = 2; // raise this when the route matcher's rules change, so every bus is worked out afresh
async function liveFleet(env, now) {
  const every = geotabOn(env) ? 10e3 : ZONAR_EVERY; // Geotab reports more often than Zonar and allows far more requests
  return cached('fleet', every / 2, async () => {
    const row = await env.DB.prepare('SELECT v FROM transit_state WHERE k = ?1').bind('buses').first();
    const saved = row ? JSON.parse(row.v) : { states: {}, fetched: 0, out: null };
    if (saved.rules !== RULES) { saved.states = {}; saved.out = null; saved.rules = RULES; } // routes worked out under older rules are not carried over
    if (saved.out && now - saved.fetched < every) return saved.out; // another copy of the Worker asked a moment ago
    const { lists, trackers } = await readTrackers(env, now, saved);
    if (!lists.length) return { vehicles: [], counts: {}, error: 'tracker-unavailable', trackers };
    const day = localTime(now, net.feed.timezone).day;
    const forced = Object.fromEntries(((await env.DB.prepare('SELECT bus, route FROM transit_overrides WHERE day = ?1').bind(day).all().catch(() => ({ results: [] }))).results || []).map(o => [String(o.bus).split('-').pop(), o.route]));
    const out = { ...update(net, saved.states, mergeReports(lists), now, forced), trackers };
    await env.DB.prepare('INSERT INTO transit_state (k, v, t) VALUES (?1, ?2, ?3) ON CONFLICT (k) DO UPDATE SET v = ?2, t = ?3')
      .bind('buses', JSON.stringify({ rules: RULES, states: saved.states, fetched: now, out, zonar: saved.zonar }), now).run();
    return out;
  });
}
// <page address>/live?debug=1: every bus, what each tracker last said about it, and why it is or is not on the map.
// The first place to look when a bus is missing. Nothing here carries a login.
async function trackerDebug(env) {
  const now = Date.now(), { lists, trackers, geo } = await readTrackers(env, now);
  const yard = { lat: LIVE.YARD[0], lon: LIVE.YARD[1] }, by = {};
  for (const r of lists.flat()) (by[r.id] ??= {})[r.src] = r;
  const mins = r => Math.round((now - r.t) / 60000), say = r => (r ? `${r.power ? 'on' : 'off'}, ${mins(r)} min ago` : 'no unit found');
  const units = mergeReports(lists).map(r => {
    const far = Math.round(metres(net, r, yard));
    return {
      bus: r.id, ...(zonarOn(env) ? { zonar: say(by[r.id].zonar) } : {}), ...(geotabOn(env) ? { geotab: say(by[r.id].geotab), geotabName: by[r.id].geotab?.name ?? null } : {}), using: r.src, lastReportMinutesAgo: mins(r),
      lat: r.lat, lon: r.lon, mph: r.s == null ? null : Math.round(r.s * 2.237), metresFromFacility: far,
      status: r.power === false ? 'power off' : !heard(r, now) ? `no report for ${mins(r)} min` : far <= LIVE.YARD_M ? 'at the transit facility' : now - r.t > LIVE.STALE ? 'in service, standing still' : 'in service',
    };
  }).sort((x, y) => x.lastReportMinutesAgo - y.lastReportMinutesAgo);
  return { ok: lists.length > 0, trackers, units, ...(geo ? { geotab: { vehiclesThisLoginCanSee: geo.seen, matchedToBuses: geo.matched, notMatched: geo.unmatched ?? 'not listed: this login sees more than 30 vehicles, so only names carrying the fleet number are trusted. Limit the login to the Transit group, or set GEOTAB_BUSES.' } } : {}) };
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
