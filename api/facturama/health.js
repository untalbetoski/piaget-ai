/* api/facturama/health.js — ¿está configurado el backend de timbrado? */
const { cors, authHeader } = require('../_lib/facturama');

module.exports = (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.status(200).json({
    ok: true,
    configured: !!authHeader(),                 // true si hay credenciales de Facturama
    envDefault: process.env.FACTURAMA_ENV || 'sandbox',
  });
};
