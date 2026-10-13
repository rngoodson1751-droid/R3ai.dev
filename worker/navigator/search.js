// City Navigator's search for businesses and places that are not in its own list: GET <page address>/api?q=pharmacy
// Asks Photon (OpenStreetMap data, photon.komoot.io), or Nominatim if Photon does not answer, for places in and around
// Lake Charles. Answers are kept for a day, so the same search from many phones costs one request. No key is needed.
const BOX = [-93.36, 30.11, -93.10, 30.32];                     // west, south, east, north: Lake Charles and its edges
const UA = 'LCTransitCityNavigator/1.0 (+https://r3ai.dev)';    // both services ask callers to say who they are
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, max-age=300', 'x-robots-tag': 'noindex', ...extra } });
const clean = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const inBox = (lat, lon) => lon >= BOX[0] && lon <= BOX[2] && lat >= BOX[1] && lat <= BOX[3];

export async function placeSearch(request, env, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'Not found.' }, 404);
  const q = clean(url.searchParams.get('q')).slice(0, 80);
  if (q.length < 2) return json({ results: [] });
  const cache = caches.default, key = new Request('https://cache.r3ai.dev/navigator-search?q=' + encodeURIComponent(q.toLowerCase()));
  const hit = await cache.match(key);
  if (hit) return json(await hit.json());
  let results = null, source = 'photon';
  try { results = await photon(q); } catch (e) { console.error('photon', e?.message || e); }
  if (!results) { source = 'nominatim'; try { results = await nominatim(q); } catch (e) { console.error('nominatim', e?.message || e); } }
  if (!results) return json({ results: [], error: 'Search is not answering right now.' }, 502);
  const body = { results, source };
  await cache.put(key, new Response(JSON.stringify(body), { headers: { 'cache-control': 'public, max-age=86400' } }));
  return json(body);
}

async function photon(q) {
  const u = new URL('https://photon.komoot.io/api/');
  u.search = new URLSearchParams({ q, lat: '30.215', lon: '-93.215', limit: '20', lang: 'en', bbox: BOX.join(',') });
  const res = await fetch(u, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error('Photon answered ' + res.status);
  const data = await res.json(), seen = new Set(), out = [];
  for (const f of data.features || []) {
    const p = f.properties || {}, [lon, lat] = f.geometry?.coordinates || [];
    if (!Number.isFinite(lat) || !inBox(lat, lon)) continue;
    const name = clean(p.name) || clean([p.housenumber, p.street].filter(Boolean).join(' '));
    if (!name) continue;
    const addr = clean([[p.housenumber, p.street].filter(Boolean).join(' '), p.city || p.district].filter(Boolean).join(', '));
    const k = name.toLowerCase() + '|' + lat.toFixed(3) + lon.toFixed(3);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ name, addr: addr === name ? clean(p.city) : addr, kind: kindOf(p.osm_value || p.type), lat: +lat.toFixed(6), lon: +lon.toFixed(6) });
  }
  return out.slice(0, 15);
}

async function nominatim(q) {
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.search = new URLSearchParams({ q, format: 'jsonv2', limit: '15', bounded: '1', viewbox: [BOX[0], BOX[3], BOX[2], BOX[1]].join(','), addressdetails: '1' });
  const res = await fetch(u, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error('Nominatim answered ' + res.status);
  return (await res.json()).map(r => {
    const a = r.address || {}, lat = +r.lat, lon = +r.lon;
    const name = clean(r.name) || clean([a.house_number, a.road].filter(Boolean).join(' ')) || clean(String(r.display_name).split(',')[0]);
    return { name, addr: clean([[a.house_number, a.road].filter(Boolean).join(' '), a.city || a.town || a.village].filter(Boolean).join(', ')), kind: kindOf(r.type), lat: +lat.toFixed(6), lon: +lon.toFixed(6) };
  }).filter(r => r.name && inBox(r.lat, r.lon));
}

// a few words a rider would recognise, from OpenStreetMap's own tags
const KINDS = { restaurant: 'Restaurant', fast_food: 'Fast food', cafe: 'Cafe', pharmacy: 'Pharmacy', chemist: 'Pharmacy', supermarket: 'Grocery', convenience: 'Convenience store',
  variety_store: 'Store', department_store: 'Store', clothes: 'Clothing', laundry: 'Laundromat', bank: 'Bank', atm: 'ATM', hospital: 'Hospital', clinic: 'Clinic', doctors: 'Doctor',
  dentist: 'Dentist', school: 'School', college: 'College', university: 'University', library: 'Library', place_of_worship: 'Church', park: 'Park', fuel: 'Gas station',
  hotel: 'Hotel', motel: 'Motel', post_office: 'Post office', police: 'Police', fire_station: 'Fire station', townhall: 'Government', courthouse: 'Courthouse', house: 'Address', residential: 'Street' };
const kindOf = v => KINDS[v] || '';
