/* auth.jsx — autenticación con backend real (Supabase) y fallback local de demo.
   • MODO BACKEND  (config.js con supabaseUrl + supabaseKey): valida con la función
     RPC `fn_login`, que compara contra contraseñas cifradas (bcrypt) sin exponer el hash.
   • MODO LOCAL    (sin config): valida contra las cuentas del navegador
     (DB.settings.users, familyAccounts, docentes, accesos de alumnos).
   La sesión se guarda en localStorage ('piaget_session'). */

(function () {
  const SKEY = 'piaget_session';
  const norm = s => String(s || '').trim().toLowerCase();
  const cfg = window.PIAGET_CONFIG || {};
  const useBackend = !!(cfg.supabaseUrl && cfg.supabaseKey);

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

  function getSession() { try { return JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) { return null; } }
  function setSession(acc) { try { localStorage.setItem(SKEY, JSON.stringify(acc)); } catch (e) { } window.dispatchEvent(new Event('piaget-session')); }
  function clearSession() { try { localStorage.removeItem(SKEY); } catch (e) { } window.dispatchEvent(new Event('piaget-session')); }

  /* ---- Cliente Supabase (reutiliza el de store.js si ya existe) ---- */
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

  /* ---- Validación local (demo) ---- */
  function liveSettings() {
    if (window.PIAGET_LIVE) return window.PIAGET_LIVE;
    try { const sv = JSON.parse(localStorage.getItem('piaget_settings') || 'null'); if (sv) return sv; } catch (e) { }
    return (window.DB && DB.settings) || {};
  }
  function authLocal(nid, pw) {
    // Fusiona el padrón por defecto (da contraseña y garantiza la cuenta) con las
    // ediciones guardadas en Configuración (sobreescriben nombre/rol/estado por correo).
    const liveUsers = (liveSettings().users) || [];
    const admins = (window.DB && DB.adminUsers) || [];
    const byEmail = {};
    admins.forEach(a => { byEmail[norm(a.email)] = { ...a }; });
    liveUsers.forEach(u => { const k = norm(u.email); byEmail[k] = { ...(byEmail[k] || {}), ...u, pass: u.pass || (byEmail[k] && byEmail[k].pass) || '' }; });
    const su = Object.values(byEmail);
    for (const u of su) {
      if (norm(u.email) === nid) {
        if (/suspendido/i.test(u.status || '')) return { ok: false, error: 'Esta cuenta está suspendida.' };
        const expected = u.pass || (admins.find(a => norm(a.email) === nid) || {}).pass || '';
        if (expected === pw && pw) {
          const esDoc = /docente/i.test(u.role || '');
          return { ok: true, account: { name: u.name, role: u.role, email: u.email, kind: esDoc ? 'Docente' : 'Staff', vista: esDoc ? 'home' : vistaForRole(u.role) } };
        }
        return { ok: false, error: 'Contraseña incorrecta.' };
      }
    }
    for (const r of (window.AUTH_RESOLVERS || [])) {
      try { const a = r(nid, pw); if (a && a.ok === false) return a; if (a) return { ok: true, account: a }; } catch (e) { }
    }
    return { ok: false, error: 'No encontramos una cuenta con esas credenciales.' };
  }

  /* ---- Validación contra backend (Supabase RPC fn_login) ---- */
  async function authBackend(nid, pw) {
    try {
      const sb = await getClient();
      const { data, error } = await sb.rpc('fn_login', { p_id: nid, p_pass: pw });
      if (error) return { ok: false, error: 'No se pudo validar con el servidor (' + error.message + ').' };
      const r = Array.isArray(data) ? data[0] : data;
      if (!r) return { ok: false, error: 'Usuario o contraseña incorrectos.' };
      return { ok: true, account: { name: r.name, role: r.role, email: r.email || r.username, kind: r.kind, vista: r.vista || vistaForRole(r.role), students: r.students || [] } };
    } catch (e) {
      return { ok: false, error: 'Error de conexión con el backend.' };
    }
  }

  async function authenticate(id, pass) {
    const nid = norm(id); const pw = String(pass == null ? '' : pass);
    if (!nid) return { ok: false, error: 'Escribe tu usuario o correo.' };
    if (!pw) return { ok: false, error: 'Escribe tu contraseña.' };
    return useBackend ? authBackend(nid, pw) : authLocal(nid, pw);
  }

  window.PiagetAuth = { getSession, setSession, clearSession, authenticate, vistaForRole, mode: useBackend ? 'backend' : 'local' };
})();
