/* settings_store.jsx — cliente de configuración centralizada en Supabase */
(function () {
  const LKEY = 'piaget_settings';
  const SKEY = 'piaget_session';
  const cfg = window.PIAGET_CONFIG || {};

  function token() {
    try { return (JSON.parse(localStorage.getItem(SKEY) || 'null') || {}).session_token || ''; }
    catch (_) { return ''; }
  }

  async function client() {
    if (!cfg.supabaseUrl || !cfg.supabaseKey) return null;
    if (window.PIAGET_SB) return window.PIAGET_SB;
    if (!window.supabase) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    window.PIAGET_SB = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    return window.PIAGET_SB;
  }

  async function load() {
    const t = token();
    if (!t) {
      try { return JSON.parse(localStorage.getItem(LKEY) || 'null') || {}; }
      catch (_) { return {}; }
    }
    const sb = await client();
    if (!sb) return {};
    const { data, error } = await sb.rpc('piaget_settings_get', { p_token: t });
    if (error) {
      console.warn('[PIAGET] settings_get', error.message);
      try { return JSON.parse(localStorage.getItem(LKEY) || 'null') || {}; }
      catch (_) { return {}; }
    }
    if (data && typeof data === 'object') {
      try { localStorage.setItem(LKEY, JSON.stringify(data)); } catch (_) {}
      return data;
    }
    return {};
  }

  async function save(value) {
    const safe = value || {};
    try { localStorage.setItem(LKEY, JSON.stringify(safe)); } catch (_) {}
    const t = token();
    if (!t) return { ok: false, local: true, error: 'Sin sesión de servidor' };
    const sb = await client();
    if (!sb) return { ok: false, local: true, error: 'Sin cliente Supabase' };
    const { data, error } = await sb.rpc('piaget_settings_save', { p_token: t, p_value: safe });
    if (error) return { ok: false, local: true, error: error.message };
    try { localStorage.setItem(LKEY, JSON.stringify(data || safe)); } catch (_) {}
    return { ok: true, value: data || safe };
  }

  function inject(src, attr) {
    if (document.querySelector('script[' + attr + ']')) return;
    const s = document.createElement('script');
    s.type = 'text/babel';
    s.src = src;
    s.setAttribute(attr, '1');
    document.body.appendChild(s);
  }
  function loadSupabaseDiagnostics() { inject('supabase_integration.jsx?v=1', 'data-piaget-supabase-integration'); }
  function loadWorkspacePatches() {
    inject('security_workspace_patch.jsx?v=1', 'data-piaget-workspace-security');
    inject('gws_login_patch.jsx?v=1', 'data-piaget-workspace-login');
  }

  window.PiagetSettings = { load, save, client, loadSupabaseDiagnostics, loadWorkspacePatches };
  setTimeout(loadSupabaseDiagnostics, 1000);
  setTimeout(loadWorkspacePatches, 1200);
})();
