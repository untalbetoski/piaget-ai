/* supabase_integration.jsx — Diagnóstico y acciones de integración Supabase */
(function () {
  const SKEY = 'piaget_session';
  function cfg() { return window.PIAGET_CONFIG || {}; }
  function session() { try { return JSON.parse(localStorage.getItem(SKEY) || 'null') || null; } catch (_) { return null; } }
  async function loadClient() {
    const c = cfg();
    if (!c.supabaseUrl || !c.supabaseKey) throw new Error('Faltan supabaseUrl o supabaseKey en config.js');
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
    window.PIAGET_SB = window.supabase.createClient(c.supabaseUrl, c.supabaseKey);
    return window.PIAGET_SB;
  }
  async function diagnose() {
    const c = cfg();
    const s = session();
    const out = {
      ok: false,
      url: c.supabaseUrl || '',
      hasKey: !!c.supabaseKey,
      realtime: !!c.realtime,
      storeMode: window.Store && Store.mode || 'no-store',
      authMode: window.PiagetAuth && PiagetAuth.mode || 'no-auth',
      hasSessionToken: !!(s && s.session_token),
      user: s && (s.email || s.username || s.name) || '',
      role: s && s.role || '',
      counts: {},
      errors: [],
    };
    try {
      const sb = await loadClient();
      if (s && s.session_token) {
        for (const table of ['announcements', 'activity', 'students', 'cobros']) {
          const { data, error } = await sb.rpc('piaget_read', { p_token: s.session_token, p_table: table });
          if (error) out.errors.push(table + ': ' + error.message);
          else out.counts[table] = Array.isArray(data) ? data.length : 0;
        }
      } else {
        out.errors.push('Sin session_token. Cierra sesión y vuelve a iniciar sesión.');
      }
      out.ok = out.errors.length === 0;
    } catch (e) {
      out.errors.push(e.message || String(e));
    }
    return out;
  }
  async function refreshAll() {
    if (!window.Store) throw new Error('Store no está disponible');
    window.dispatchEvent(new Event('piaget-session'));
    return diagnose();
  }
  window.PiagetSupabase = { diagnose, refreshAll, loadClient };
})();
