/* api/facturama/csd.js — Carga de CSD del emisor a Facturama. */
const { cors, fmFetch, readJson, apiPath, normalizeError } = require('../_lib/facturama');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const b = await readJson(req);
    const env = b.env || process.env.FACTURAMA_ENV || 'sandbox';
    if (!b.rfc || !b.certificateBase64 || !b.privateKeyBase64 || !b.password) return res.status(400).json({ error: 'Faltan datos del CSD.' });
    const body = { Rfc: b.rfc, Certificate: b.certificateBase64, PrivateKey: b.privateKeyBase64, PrivateKeyPassword: b.password };
    const first = apiPath('FACTURAMA_CSD_PATH', '/api-lite/csds');
    const paths = Array.from(new Set([first, '/api-lite/csds', '/api-lite/3/csds']));
    const errors = [];
    for (const endpoint of paths) {
      try {
        const out = await fmFetch(env, endpoint, { method: 'POST', body });
        return res.status(200).json({ ok: true, endpoint, csd: out });
      } catch (e) {
        errors.push({ endpoint, status: e.status || 0, message: e.message, detail: e.data || null });
        if (![401, 404, 405].includes(e.status)) throw e;
      }
    }
    const authError = errors.find(x => x.status === 401);
    if (authError) return res.status(401).json({ error: 'Facturama respondió 401 al subir el CSD. El usuario/API configurado no tiene autorización para cargar CSD en este entorno o no corresponde a la cuenta correcta.', attempts: errors });
    return res.status(502).json({ error: 'No se encontró una ruta válida para subir CSD en Facturama.', attempts: errors });
  } catch (e) { normalizeError(res, e); }
};
