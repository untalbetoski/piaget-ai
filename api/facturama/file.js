/* api/facturama/file.js — Descargar PDF o XML de CFDI timbrado. */
const { cors, fmFetch, apiPath, normalizeError } = require('../_lib/facturama');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const id = req.query.id;
    const format = String(req.query.format || 'pdf').toLowerCase();
    const env = req.query.env || process.env.FACTURAMA_ENV || 'sandbox';
    if (!id) return res.status(400).json({ error: 'Falta el parámetro id.' });
    if (!['pdf', 'xml'].includes(format)) return res.status(400).json({ error: 'format debe ser pdf o xml.' });
    const tpl = apiPath('FACTURAMA_FILE_PATH', '/api-lite/cfdi/{format}/issued/{id}');
    const endpoint = tpl.replace('{format}', encodeURIComponent(format)).replace('{id}', encodeURIComponent(id));
    const out = await fmFetch(env, endpoint, { method: 'GET' });
    res.status(200).json(out);
  } catch (e) { normalizeError(res, e); }
};
