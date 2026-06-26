/* api/facturama/file.js — Descargar PDF o XML de un CFDI ya timbrado.
   GET /api/facturama/file?id=<facturamaId>&format=pdf|xml&env=sandbox|prod
   Facturama responde { ContentEncoding:'base64', ContentType, Content }. */
const { cors, fmFetch } = require('../_lib/facturama');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const id = req.query.id;
    const format = (req.query.format || 'pdf').toLowerCase();
    const env = req.query.env || process.env.FACTURAMA_ENV || 'sandbox';
    if (!id) return res.status(400).json({ error: 'Falta el parámetro id' });
    if (format !== 'pdf' && format !== 'xml') return res.status(400).json({ error: 'format debe ser pdf o xml' });
    const out = await fmFetch(env, '/api-lite/cfdi/' + format + '/issued/' + encodeURIComponent(id), { method: 'GET' });
    res.status(200).json(out);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, detail: e.data || null });
  }
};
