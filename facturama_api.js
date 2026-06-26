/* facturama_api.js — Cliente del front hacia /api/facturama/*. */
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

  let _ready = null;
  let _lastHealth = null;

  const API = {
    base,
    configured: !!cfg.facturacionApiBase || cfg.facturacionApiBase === '',
    isReady() { return _ready === true; },
    lastHealth() { return _lastHealth; },
    async health(env) {
      try {
        const q = env ? ('?env=' + encodeURIComponent(env)) : '';
        const d = await jfetch('/api/facturama/health' + q, {});
        _ready = !!(d && d.ok && d.configured && d.ready !== false && d.authOk !== false);
        _lastHealth = { ...d, reachable: d.reachable !== false, ready: _ready };
        return _lastHealth;
      } catch (e) {
        _ready = false;
        _lastHealth = { ok: false, reachable: false, ready: false, error: e.message, detail: e.data || null };
        return _lastHealth;
      }
    },
    uploadCSD(body) { return POST('/api/facturama/csd', body); },
    timbrar(body) { return POST('/api/facturama/cfdi', body); },
    cancel(body) { return POST('/api/facturama/cancel', body); },
    file(id, format, env) { return jfetch('/api/facturama/file?id=' + encodeURIComponent(id) + '&format=' + (format || 'pdf') + '&env=' + (env || 'sandbox'), {}); },
  };
  window.FacturamaAPI = API;
})();
