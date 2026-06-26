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
    const endpoint = apiPath('FACTURAMA_CSD_PATH', '/api-lite/csds');
    const out = await fmFetch(env, endpoint, {
      method: 'POST',
      body: { Rfc: b.rfc, Certificate: b.certificateBase64, PrivateKey: b.privateKeyBase64, PrivateKeyPassword: b.password },
    });
    res.status(200).json({ ok: true, csd: out });
  } catch (e) { normalizeError(res, e); }
};
