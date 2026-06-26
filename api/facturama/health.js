/* api/facturama/health.js — Diagnóstico de backend Facturama */
const { cors, configured, baseUrl, fmFetch, apiPath } = require('../_lib/facturama');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Método no permitido' });

  const env = (req.query && req.query.env) || process.env.FACTURAMA_ENV || 'sandbox';
  const isConfigured = configured();
  const info = {
    ok: true,
    configured: isConfigured,
    env,
    baseUrl: baseUrl(env),
    envDefault: process.env.FACTURAMA_ENV || 'sandbox',
    mode: env === 'prod' ? 'Producción' : 'Sandbox',
  };

  if (!isConfigured) {
    return res.status(200).json({ ...info, reachable: false, ready: false, message: 'Faltan variables de conexión de Facturama en Vercel.' });
  }

  try {
    const healthPath = apiPath('FACTURAMA_HEALTH_PATH', '/api-lite/3/cfdis?type=issued');
    await fmFetch(env, healthPath, { method: 'GET' });
    return res.status(200).json({ ...info, reachable: true, ready: true });
  } catch (e) {
    const authOk = e.status !== 401;
    const methodOnly = e.status === 405;
    return res.status(200).json({
      ...info,
      reachable: authOk,
      ready: authOk,
      authOk,
      diagnostic: methodOnly ? 'La ruta de prueba respondió 405, pero la autenticación no fue rechazada.' : 'Revisar respuesta del PAC.',
      error: e.status === 401 ? 'Credenciales rechazadas por Facturama para el entorno seleccionado.' : e.message,
      status: e.status || 0,
      detail: e.data || null
    });
  }
};
