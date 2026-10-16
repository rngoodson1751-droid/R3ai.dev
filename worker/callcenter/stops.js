// What is at each bus stop: sign pole, bench, shelter, wheelchair access and so on. Shown on the call center map and
// Stop tab. The timetable (GTFS) only gives a stop's name and place, so these are recorded by Transit staff, kept in
// the table transit_stop_features of r3ai-requests (layout in worker/schema.sql).
//   GET  <page>/stops   every stop's details, and whether the signed-in person may edit them
//   POST <page>/stops   {stop, pole, bench, ...: 1 | 0 | null, notes}: save one stop (editors only)
// Editors are the addresses listed in the Worker variable CALL_CENTER_EDITORS (comma separated). Everyone else can read.
import raw from '../transit/network.json';

export const FEATURES = ['pole', 'bench', 'shelter', 'accessible', 'lighting', 'trash', 'bikerack'];
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' } });
const editors = env => String(env.CALL_CENTER_EDITORS || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);

export async function stopFeatures(request, env, url, email) {
  const canEdit = editors(env).includes(String(email || '').toLowerCase());
  if (request.method === 'GET' || request.method === 'HEAD') {
    try {
      const { results } = await env.DB.prepare(`SELECT stop, ${FEATURES.join(', ')}, notes, updated_by, updated_at FROM transit_stop_features`).all();
      const stops = {};
      for (const r of results) { const { stop, ...rest } = r; stops[stop] = rest; }
      return json({ stops, canEdit });
    } catch (e) { console.error('stop features not read', e?.message || e); return json({ stops: {}, canEdit, error: 'not-ready' }); }
  }
  if (request.method !== 'POST') return json({ error: 'Not found.' }, 404);
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return json({ error: 'Not allowed.' }, 403);
  if (!canEdit) return json({ error: 'Only Transit staff listed as editors can change stop details.' }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'That could not be read.' }, 400); }
  const stop = String(body.stop || '');
  if (!raw.stops[stop]) return json({ error: 'No such stop.' }, 400);
  const val = v => v === 1 || v === true || v === '1' ? 1 : v === 0 || v === false || v === '0' ? 0 : null;
  const vals = FEATURES.map(f => val(body[f]));
  const notes = String(body.notes ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, 240) || null;
  try {
    await env.DB.prepare(`INSERT INTO transit_stop_features (stop, ${FEATURES.join(', ')}, notes, updated_by, updated_at)
      VALUES (?1, ${FEATURES.map((_, i) => '?' + (i + 2)).join(', ')}, ?${FEATURES.length + 2}, ?${FEATURES.length + 3}, datetime('now'))
      ON CONFLICT (stop) DO UPDATE SET ${FEATURES.map(f => `${f} = excluded.${f}`).join(', ')}, notes = excluded.notes, updated_by = excluded.updated_by, updated_at = excluded.updated_at`)
      .bind(stop, ...vals, notes, String(email).toLowerCase()).run();
  } catch (e) { console.error('stop features not saved', e?.message || e); return json({ error: 'Could not save. Try again in a minute.' }, 500); }
  return json({ ok: true });
}
