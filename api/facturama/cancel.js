/* api/facturama/cancel.js — Cancelar un CFDI timbrado en Facturama. */
const { cors, fmFetch, readJson, apiPath, normalizeError } = require('../_lib/facturama');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const b = await readJson(req);
    const env = b.env || process.env.FACTURAMA_ENV || 'sandbox';
    if (!b.id) return res.status(400).json({ error: 'Falta el id del CFDI.' });
    const motive = b.motive || '02';
    const base = apiPath('FACTURAMA_CANCEL_PATH', '/api-lite/cfdi/{id}');
    const endpoint = base.replace('{id}', encodeURIComponent(b.id));
    const qs = '?type=issued&motive=' + encodeURIComponent(motive) + (b.uuidReplacement ? '&uuidReplacement=' + encodeURIComponent(b.uuidReplacement) : '');
    const out = await fmFetch(env, endpoint + qs, { method: 'DELETE' });
    res.status(200).json({ ok: true, result: out });
  } catch (e) { normalizeError(res, e); }
};
