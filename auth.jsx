(function () {
  const SKEY = 'piaget_session';
  const cfg = window.PIAGET_CONFIG || {};
  const useBackend = !!(cfg.supabaseUrl && cfg.supabaseKey);
  const norm = s => String(s || '').trim().toLowerCase();

  function vistaForRole(role) {
    const r = String(role || '');
    if (/Direcci/i.test(r)) return 'home';
    if (/Finanzas|Tesorer/i.test(r)) return 'cobros';
    if (/Coordinaci/i.test(r)) return 'home';
    if (/Admisiones/i.test(r)) return 'pipeline';
    if (/Recepci/i.test(r)) return 'dashboard-accesos';
    if (/Docente/i.test(r)) return 'clases';
    if (/Familia/i.test(r)) return 'boletines';
    if (/Estudiante|Alumno/i.test(r)) return 'home';
    return 'home';
  }

  function getSession() { try { return JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (_) { return null; } }
  function setSession(acc) { try { localStorage.setItem(SKEY, JSON.stringify(acc)); } catch (_) {} window.dispatchEvent(new Event('piaget-session')); }
  function clearSession() { try { localStorage.removeItem(SKEY); } catch (_) {} window.dispatchEvent(new Event('piaget-session')); }

  let _sb = null;
  async function getClient() {
    if (window.PIAGET_SB) return window.PIAGET_SB;
    if (_sb) return _sb;
    if (!window.supabase) {
      await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    }
    _sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    window.PIAGET_SB = _sb;
    return _sb;
  }

  function authLocal(id, secret) {
    for (const r of (window.AUTH_RESOLVERS || [])) {
      try { const a = r(norm(id), String(secret || '')); if (a && a.ok === false) return a; if (a) return { ok: true, account: a }; } catch (_) {}
    }
    return { ok: false, error: 'Activa la conexión a Supabase para iniciar sesión.' };
  }

  async function authBackend(id, secret) {
    try {
      const sb = await getClient();
      const { data, error } = await sb.rpc('fn_login', { p_id: norm(id), p_pass: String(secret || '') });
      if (error) return { ok: false, error: 'No se pudo validar con el servidor (' + error.message + ').' };
      const r = Array.isArray(data) ? data[0] : data;
      if (!r) return { ok: false, error: 'Usuario o contraseña incorrectos.' };
      return { ok: true, account: { name: r.name, role: r.role, email: r.email || r.username, kind: r.kind, vista: r.vista || vistaForRole(r.role), students: r.students || [], session_token: r.session_token } };
    } catch (_) {
      return { ok: false, error: 'Error de conexión con el backend.' };
    }
  }

  async function authenticate(id, secret) {
    const nid = norm(id);
    const sec = String(secret == null ? '' : secret);
    if (!nid) return { ok: false, error: 'Escribe tu usuario o correo.' };
    if (!sec) return { ok: false, error: 'Escribe tu contraseña.' };
    return useBackend ? authBackend(nid, sec) : authLocal(nid, sec);
  }

  function loadPublicPatch() {
    if (document.querySelector('script[data-piaget-index-sso]')) return;
    const s = document.createElement('script');
    s.src = 'sso_index_patch.js?v=1';
    s.setAttribute('data-piaget-index-sso', '1');
    document.head.appendChild(s);
  }

  window.PiagetAuth = { getSession, setSession, clearSession, authenticate, vistaForRole, mode: useBackend ? 'backend' : 'local', loadPublicPatch };
  setTimeout(loadPublicPatch, 150);
})();