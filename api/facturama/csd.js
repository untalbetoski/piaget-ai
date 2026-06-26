/* api/facturama/csd.js — Carga del Certificado de Sello Digital (CSD) del emisor.
   Modalidad API Multiemisor: POST /api-lite/csds
   Body esperado (desde el front):
     { env, rfc, certificateBase64, privateKeyBase64, password } */
const { cors, fmFetch, readJson } = require('../_lib/facturama');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const b = await readJson(req);
    const env = b.env || process.env.FACTURAMA_ENV || 'sandbox';
    const { rfc, certificateBase64, privateKeyBase64, password } = b;
    if (!rfc || !certificateBase64 || !privateKeyBase64 || !password) {
      return res.status(400).json({ error: 'Faltan rfc, certificado (.cer), llave (.key) o contraseña' });
    }
    const out = await fmFetch(env, '/api-lite/csds', {
      method: 'POST',
      body: { Rfc: rfc, Certificate: certificateBase64, PrivateKey: privateKeyBase64, PrivateKeyPassword: password },
    });
    res.status(200).json({ ok: true, csd: out });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, detail: e.data || null });
  }
};
