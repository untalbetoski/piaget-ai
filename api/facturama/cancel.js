/* api/facturama/cancel.js — Cancelar un CFDI timbrado.
   POST { id, env, motive ('01'|'02'|'03'|'04'), uuidReplacement? } */
const { cors, fmFetch, readJson } = require('../_lib/facturama');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const b = await readJson(req);
    const env = b.env || process.env.FACTURAMA_ENV || 'sandbox';
    if (!b.id) return res.status(400).json({ error: 'Falta el id del CFDI' });
    const motive = b.motive || '02';
    const qs = '?type=issued&motive=' + motive + (b.uuidReplacement ? '&uuidReplacement=' + encodeURIComponent(b.uuidReplacement) : '');
    const out = await fmFetch(env, '/api-lite/cfdi/' + encodeURIComponent(b.id) + qs, { method: 'DELETE' });
    res.status(200).json({ ok: true, result: out });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, detail: e.data || null });
  }
};
