/* facturama_api.js — Cliente del front hacia el backend de timbrado (/api/facturama/*).
   En MODO DEMO (sin backend desplegado o sin credenciales) health() falla y la UI
   cae al timbrado simulado. Con el backend desplegado en Vercel + variables de
   entorno FACTURAMA_USER/PASSWORD, el timbrado tiene valor fiscal real. */
(function () {
  const cfg = window.PIAGET_CONFIG || {};
  const base = String(cfg.facturacionApiBase || '').replace(/\/+$/, '');
  function u(p) { return base + p; }

  async function jfetch(p, opts) {
    const r = await fetch(u(p), opts);
    const t = await r.text();
    let d; try { d = t ? JSON.parse(t) : {}; } catch (e) { d = { raw: t }; }
    if (!r.ok) throw Object.assign(new Error((d && d.error) || ('HTTP ' + r.status)), { data: d, status: r.status });
    return d;
  }
  const POST = (p, body) => jfetch(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });

  let _ready = null; // null = sin probar, true/false = resultado de health

  const API = {
    base,
    configured: !!cfg.facturacionApiBase || cfg.facturacionApiBase === '',
    isReady() { return _ready === true; },
    async health() {
      try {
        const d = await jfetch('/api/facturama/health', {});
        _ready = !!(d && d.ok && d.configured);
        return { ...d, reachable: true, ready: _ready };
      } catch (e) {
        _ready = false;
        return { ok: false, reachable: false, ready: false };
      }
    },
    uploadCSD(body) { return POST('/api/facturama/csd', body); },
    timbrar(body) { return POST('/api/facturama/cfdi', body); },
    cancel(body) { return POST('/api/facturama/cancel', body); },
    file(id, format, env) { return jfetch('/api/facturama/file?id=' + encodeURIComponent(id) + '&format=' + (format || 'pdf') + '&env=' + (env || 'sandbox'), {}); },
  };
  window.FacturamaAPI = API;
})();
