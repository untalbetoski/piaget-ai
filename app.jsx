/* app.jsx — Shell PIAGET AI: navegación jerárquica + topbar + routing + tema + tweaks */

const ACCENTS = [
  { name: 'Azul', h: 262 }, { name: 'Índigo', h: 278 }, { name: 'Cian', h: 222 },
  { name: 'Violeta', h: 300 }, { name: 'Esmeralda', h: 158 }, { name: 'Ámbar', h: 70 },
];
const FONTS = {
  Moderno: { ui: "'Hanken Grotesk'", display: "'Space Grotesk'" },
  Editorial: { ui: "'Hanken Grotesk'", display: "'Newsreader'" },
  Técnico: { ui: "'Space Grotesk'", display: "'Space Grotesk'" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentHue": 262,
  "fonts": "Moderno",
  "density": "regular",
  "radius": 16,
  "elevated": false
}/*EDITMODE-END*/;

/* ¿en qué sección/padre vive una hoja? para auto-expandir y breadcrumb */
function findTrail(routeId) {
  for (const sec of window.NAV) {
    for (const it of sec.items) {
      if (it.id === routeId) return { section: sec.section, parent: null };
      if (it.children) {
        const ch = it.children.find(c => c.id === routeId);
        if (ch) return { section: sec.section, parent: it.id };
      }
    }
  }
  return { section: null, parent: null };
}

function AccentSwatches({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '2px 0' }}>
      {ACCENTS.map(a => (
        <button key={a.h} onClick={() => onChange(a.h)} title={a.name}
          style={{
            width: 30, height: 30, borderRadius: 9, cursor: 'pointer',
            background: `oklch(0.55 0.185 ${a.h})`,
            border: value === a.h ? '2px solid var(--text)' : '2px solid transparent',
            outline: value === a.h ? '2px solid var(--surface)' : 'none',
            boxShadow: value === a.h ? '0 0 0 1px var(--border-strong)' : 'none',
          }} />
      ))}
    </div>
  );
}

/* Campana de notificaciones (alertas inteligentes) */
function NotifBell({ go }) {
  const [open, setOpen] = React.useState(false);
  const [seen, setSeen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    setTimeout(() => window.addEventListener('click', h), 0);
    return () => window.removeEventListener('click', h);
  }, [open]);
  const alerts = DB.alerts || [];
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => { setOpen(o => !o); setSeen(true); }} aria-label="Notificaciones">
        <Icon name="bell" size={19} />
        {!seen && alerts.length > 0 && <span className="dot" />}
      </button>
      {open && (
        <div className="menu" style={{ right: 0, top: 44, width: 330, padding: 0, overflow: 'hidden' }}>
          <div className="row between center" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>Notificaciones</span>
            <Badge tone="red" dot>{alerts.length} activas</Badge>
          </div>
          {alerts.map((a, i) => {
            const t = window.TONE[a.tone];
            return (
              <button key={i} style={{ padding: '11px 16px', borderRadius: 0, borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}
                onClick={() => { setOpen(false); a.go && go(a.go); }}>
                <div className="insight-ico" style={{ background: t.bg, color: t.c, width: 30, height: 30, flexShrink: 0 }}><Icon name={a.icon} size={15} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</div>
                  <div className="faint" style={{ fontSize: 12, lineHeight: 1.35 }}>{a.text}</div>
                  <div className="faint" style={{ fontSize: 10.5, marginTop: 3 }}>{a.time}</div>
                </div>
                <Icon name="chevR" size={14} className="faint" style={{ flexShrink: 0, marginTop: 8 }} />
              </button>
            );
          })}
          <button style={{ justifyContent: 'center', padding: '10px 16px', borderRadius: 0, color: 'var(--accent)', fontWeight: 600, borderTop: '1px solid var(--border)' }}
            onClick={() => { setOpen(false); go('home'); }}>Ver todas en Home</button>
        </div>
      )}
    </div>
  );
}

/* Scaffold wrapper que inyecta meta por ruta */
function ScaffoldRoute({ routeId, go, openCopilot }) {
  const meta = window.SCAFFOLDS[routeId];
  if (!meta) return <div className="content-inner"><PageHead eyebrow="PIAGET AI" title="Módulo" desc="En construcción." /></div>;
  return <ModuleScaffold meta={meta} go={go} openCopilot={openCopilot} />;
}
window.ScaffoldRoute = ScaffoldRoute;

function readPiagetSettings() {
  let s = window.PIAGET_LIVE;
  if (!s) {
    s = DB.settings || {};
    try {
      const sv = JSON.parse(localStorage.getItem('piaget_settings') || 'null');
      if (sv) s = { ...s, ...sv, branding: { ...(s.branding || {}), ...(sv.branding || {}) } };
    } catch (e) { }
  }
  return s;
}

// Usuario activo: la sesión iniciada manda; si no, se deriva de la configuración.
function piagetActiveUser() {
  const fmt = (name, role) => {
    const initials = ((name || 'U').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('') || 'U').toUpperCase();
    const parts = (name || '').split(' ').filter(Boolean);
    const firstName = parts.length >= 3 ? parts.slice(0, 2).join(' ') : (parts[0] || name);
    return { name, role, initials, firstName };
  };
  const sess = window.PiagetAuth && window.PiagetAuth.getSession && window.PiagetAuth.getSession();
  if (sess && sess.name) {
    // Refleja en vivo las ediciones de Configuración para la cuenta en sesión:
    // primero por correo; si no empata (p. ej. cambiaron el correo), por rol (solo staff).
    let name = sess.name, role = sess.role || '';
    try {
      const s = readPiagetSettings();
      const list = (s && s.users) || [];
      let u = list.find(x => x.email && sess.email && String(x.email).toLowerCase() === String(sess.email).toLowerCase());
      if (!u && sess.kind === 'Staff' && sess.role) u = list.find(x => (x.role || '') === sess.role);
      if (u) { name = u.name || name; role = u.role || role; }
    } catch (e) { }
    return fmt(name, role);
  }
  const s = readPiagetSettings();
  const cfgUsers = (s && s.users) || [];
  const u = cfgUsers.find(x => x.email === DB.user.email) || cfgUsers[0] || DB.user;
  return fmt(u.name || DB.user.name, u.role || DB.user.role);
}
window.piagetActiveUser = piagetActiveUser;

/* ===== Pantalla de acceso (gate de la plataforma) ===== */
function LoginScreen({ onLogin, brandName }) {
  const [id, setId] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [hint, setHint] = React.useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    let res;
    try { res = await window.PiagetAuth.authenticate(id, pass); }
    catch (_) { res = { ok: false, error: 'Error inesperado al validar.' }; }
    setBusy(false);
    if (res && res.ok) { onLogin(res.account); }
    else setErr((res && res.error) || 'Credenciales incorrectas.');
  };
  const wrap = { minHeight: '100%', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' };
  const card = { width: 420, maxWidth: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', padding: '32px 30px' };
  const demos = [
    ['Dirección', 'direccion@jeanpiaget.mx', 'Direccion2026'],
    ['Docente', 'docente@jeanpiaget.mx', 'Docente2026'],
    ['Familia', 'familia.hernandez@jeanpiaget.mx', 'Hernandez2026'],
  ];
  return (
    <div style={wrap}>
      <form style={card} onSubmit={submit}>
        <div className="row center gap-12" style={{ marginBottom: 22 }}>
          <div className="brand-mark" style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--accent)', color: 'var(--on-accent)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700 }}>P</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, lineHeight: 1 }}>{brandName || 'Piaget'} <span style={{ color: 'var(--accent)' }}>AI</span></div>
            <div className="eyebrow" style={{ marginTop: 3 }}>Plataforma Educativa</div>
          </div>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 4px' }}>Iniciar sesión</h1>
        <p className="muted" style={{ fontSize: 13.5, margin: '0 0 20px' }}>Ingresa con tu cuenta institucional.</p>

        {err && <div className="row center gap-8" style={{ background: 'var(--red-soft)', color: 'var(--red)', borderRadius: 'var(--r-sm)', padding: '9px 12px', fontSize: 13, fontWeight: 600, marginBottom: 14 }}><Icon name="alert" size={15} />{err}</div>}

        <div className="field"><label>Correo o usuario</label>
          <input className="inp" type="text" autoFocus value={id} onChange={e => setId(e.target.value)} placeholder="nombre@jeanpiaget.mx" />
        </div>
        <div className="field" style={{ marginTop: 12 }}><label>Contraseña</label>
          <div style={{ position: 'relative' }}>
            <input className="inp" type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" style={{ width: '100%', paddingRight: 60 }} />
            <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em' }}>{show ? 'OCULTAR' : 'VER'}</button>
          </div>
        </div>

        <button className="btn primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', height: 44, marginTop: 20, opacity: busy ? 0.7 : 1 }}>{busy ? 'Entrando…' : 'Entrar a la plataforma'}</button>

        <button type="button" onClick={() => setHint(h => !h)} className="row center gap-6" style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 12, margin: '16px auto 0', fontFamily: 'var(--font-mono)' }}>
          {window.PiagetAuth && window.PiagetAuth.mode === 'backend'
            ? <><span className="live-dot" style={{ background: 'var(--green)' }} /> Conectado a backend seguro</>
            : <><Icon name="lock" size={12} /> Credenciales de ejemplo <Icon name="chevR" size={12} className={'nav-chev' + (hint ? ' open' : '')} /></>}
        </button>
        {hint && (!window.PiagetAuth || window.PiagetAuth.mode !== 'backend') && <div style={{ marginTop: 10, border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
          {demos.map((d, i) => (
            <button type="button" key={i} onClick={() => { setId(d[1]); setPass(d[2]); setErr(''); }}
              className="row center between" style={{ width: '100%', textAlign: 'left', border: 'none', borderTop: i ? '1px solid var(--border)' : 'none', background: 'transparent', padding: '9px 12px', gap: 10, cursor: 'pointer' }}>
              <span><span className="badge gray" style={{ fontSize: 10.5 }}>{d[0]}</span></span>
              <span className="faint font-mono" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d[1]} · {d[2]}</span>
            </button>
          ))}
        </div>}
      </form>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const store = useStore();
  // Sesión vigente (síncrona); el intento entregado por el landing se valida en un efecto (async)
  const boot = React.useMemo(() => (window.PiagetAuth && window.PiagetAuth.getSession()) || null, []);
  const [session, setSessionState] = React.useState(boot);
  React.useEffect(() => {
    let raw = null; try { raw = sessionStorage.getItem('piaget_login'); } catch (e) { }
    if (raw) {
      try { sessionStorage.removeItem('piaget_login'); } catch (e) { }
      try {
        const { id, pass } = JSON.parse(raw);
        window.PiagetAuth.authenticate(id, pass).then(res => {
          if (res && res.ok) { window.PiagetAuth.setSession(res.account); setRoute(res.account.vista || 'home'); }
        });
      } catch (e) { }
    }
    const h = () => setSessionState(window.PiagetAuth.getSession());
    window.addEventListener('piaget-session', h);
    return () => window.removeEventListener('piaget-session', h);
  }, []);
  const initialRoute = (() => {
    try {
      const v = new URLSearchParams(window.location.search).get('vista');
      if (v && window.ROUTES && window.ROUTES[v]) return v;
    } catch (e) { }
    return (boot && boot.vista) || 'home';
  })();
  const [route, setRoute] = React.useState(initialRoute);
  const [navTick, setNavTick] = React.useState(0);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  React.useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const [theme, setTheme] = React.useState(() => { try { return localStorage.getItem('piaget_theme') || 'light'; } catch (e) { return 'light'; } });
  const [appSettings, setAppSettings] = React.useState(readPiagetSettings);
  React.useEffect(() => {
    const h = () => setAppSettings(readPiagetSettings());
    window.addEventListener('piaget-settings', h);
    return () => window.removeEventListener('piaget-settings', h);
  }, []);
  const initialTrail = findTrail('home');
  const [openGroups, setOpenGroups] = React.useState(() => {
    const s = {}; window.NAV.forEach(sec => sec.items.forEach(it => { if (it.children) s[it.id] = false; }));
    return s;
  });

  React.useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-theme', theme);
    try { localStorage.setItem('piaget_theme', theme); } catch (e) { }
  }, [theme]);

  React.useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--accent-h', t.accentHue);
    const f = FONTS[t.fonts] || FONTS.Moderno;
    r.style.setProperty('--font-ui', f.ui + ', system-ui, sans-serif');
    r.style.setProperty('--font-display', f.display + ', system-ui, serif');
    r.style.setProperty('--r', t.radius + 'px');
    r.style.setProperty('--r-sm', (t.radius * 0.62).toFixed(1) + 'px');
    r.style.setProperty('--r-lg', (t.radius * 1.35).toFixed(1) + 'px');
    r.style.setProperty('--shadow-xs', t.elevated
      ? '0 6px 18px -8px rgba(18,28,56,0.14), 0 1px 3px rgba(18,28,56,0.05)'
      : (theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(18,28,56,0.05)'));
  }, [t, theme]);

  const isStudent = !!(session && session.kind === 'Estudiante');
  const isFamily = !!(session && session.kind === 'Familia');
  const isDocente = !!(session && session.kind === 'Docente');
  const navData = isStudent ? (window.STUDENT_NAV || window.NAV) : isFamily ? (window.FAMILY_NAV || window.NAV) : isDocente ? (window.DOCENTE_NAV || window.NAV) : window.NAV;
  const allowedRoutes = isStudent ? window.STUDENT_ALLOWED : isFamily ? window.FAMILY_ALLOWED : isDocente ? window.DOCENTE_ALLOWED : null;
  React.useEffect(() => {
    if (allowedRoutes && allowedRoutes.indexOf(route) === -1) setRoute('home');
  }, [isStudent, isFamily, isDocente, route]);
  const [, _childTick] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => { const h = () => _childTick(); window.addEventListener('piaget-child', h); return () => window.removeEventListener('piaget-child', h); }, []);

  const trail = findTrail(route);
  const routeDef = window.ROUTES[route];
  let crumb = routeDef ? routeDef.crumb : (window.SCAFFOLDS[route] ? [window.SCAFFOLDS[route].section, window.SCAFFOLDS[route].title] : ['PIAGET AI', route]);
  if (isStudent && route === 'home') crumb = ['Mi espacio', 'Inicio'];
  if (isStudent && route === 'historial-accesos') crumb = ['Mi acceso', 'Historial de accesos'];
  if (isFamily && route === 'home') crumb = ['Mis hijos', 'Inicio'];
  if (isDocente && route === 'home') crumb = ['Principal', 'Home'];

  const go = (r) => {
    setRoute(r);
    setNavTick(n => n + 1);
    const tr = findTrail(r);
    if (tr.parent) setOpenGroups(g => ({ ...g, [tr.parent]: true }));
    const el = document.querySelector('.content'); if (el) el.scrollTop = 0;
  };

  // resolver componente
  let routeCompName = routeDef ? routeDef.c : null;
  if (isStudent) {
    if (route === 'home') routeCompName = 'StudentHome';
    else if (route === 'historial-accesos') routeCompName = 'StudentHistorial';
    else if (route === 'ai-missions') routeCompName = 'StudentMisiones';
    else if (route === 'clases') routeCompName = 'StudentClases';
    else if (route === 'atlas') routeCompName = 'StudentAtlas';
    else if (route === 'engage') routeCompName = 'StudentEngage';
    else if (route === 'mensajeria-app') routeCompName = 'StudentMensajeria';
    else if (route === 'comunicados') routeCompName = 'StudentComunicados';
    else if (route === 'experiencias') routeCompName = 'StudentExperiencias';
  } else if (isFamily) {
    if (route === 'home') routeCompName = 'FamilyHome';
    else if (route === 'historial-accesos') routeCompName = 'StudentHistorial';
    else if (route === 'ai-missions') routeCompName = 'StudentMisiones';
    else if (route === 'clases') routeCompName = 'StudentClases';
    else if (route === 'atlas') routeCompName = 'StudentAtlas';
    else if (route === 'engage') routeCompName = 'StudentEngage';
    else if (route === 'mensajeria-app') routeCompName = 'StudentMensajeria';
    else if (route === 'comunicados') routeCompName = 'StudentComunicados';
    else if (route === 'experiencias') routeCompName = 'StudentExperiencias';
  } else if (isDocente) {
    if (route === 'home') routeCompName = 'DocenteHome';
    else if (route === 'comunicados') routeCompName = 'DocenteComunicados';
  }
  let View = routeCompName ? window[routeCompName] : null;
  const isScaffold = !View;

  const badgeFor = (id) => {
    if (id === 'cola-espera') return String(DB.accessQueue.length);
    if (id === 'pendientes') { const n = window.ctaAdeudos ? window.ctaAdeudos().length : 0; return n ? String(n) : null; }
    return null;
  };

  const branding = (appSettings && appSettings.branding) || {};
  const sidebarLogo = (theme === 'dark' ? (branding.logoDark || branding.logoLight) : (branding.logoLight || branding.logoDark)) || '';
  const brandName = (branding.logoText && branding.logoText.trim()) || 'Piaget';
  const _au = piagetActiveUser(); // appSettings en deps fuerza recálculo al cambiar
  const auName = _au.name;
  const auRole = _au.role;
  const auInit = _au.initials;

  // Gate de autenticación: sin sesión válida se muestra la pantalla de acceso
  if (!session) {
    return <LoginScreen brandName={brandName} onLogin={(acc) => { window.PiagetAuth.setSession(acc); setRoute(acc.vista || 'home'); }} />;
  }

  return (
    <div className={'app density-' + t.density}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" style={sidebarLogo ? { background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'none', overflow: 'hidden' } : undefined}>
            {sidebarLogo
              ? <img src={sidebarLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" />
                </svg>}
          </div>
          <div>
            <div className="brand-name">{brandName}<span className="ai"> AI</span></div>
            <div className="brand-sub">Plataforma educativa</div>
          </div>
        </div>

        <nav className="nav">
          {navData.map(sec => (
            <div key={sec.section}>
              <div className="nav-group-label">{sec.section}</div>
              {sec.items.map(it => {
                if (!it.children) {
                  const b = badgeFor(it.id);
                  return (
                    <button key={it.id} className={'nav-item' + (route === it.id ? ' active' : '')} onClick={() => go(it.id)}>
                      <Icon name={it.icon} className="nav-ico" size={18} fill={it.id === 'engage' ? 'currentColor' : 'none'} />
                      {it.label}
                      {b && <span className={'nav-badge' + (route === it.id ? '' : ' muted')}>{b}</span>}
                    </button>
                  );
                }
                const isOpen = openGroups[it.id];
                const hasActiveChild = it.children.some(c => c.id === route);
                return (
                  <div key={it.id}>
                    <button className={'nav-item parent' + (hasActiveChild && !isOpen ? ' active' : '')} onClick={() => setOpenGroups(g => ({ ...g, [it.id]: !g[it.id] }))}>
                      <Icon name={it.icon} className="nav-ico" size={18} />
                      {it.label}
                      <Icon name="chevR" className={'nav-chev' + (isOpen ? ' open' : '')} size={15} />
                    </button>
                    {isOpen && (
                      <div className="nav-sub">
                        {it.children.map(c => {
                          const b = badgeFor(c.id);
                          return (
                            <button key={c.id} className={'nav-subitem' + (route === c.id ? ' active' : '')} onClick={() => go(c.id)}>
                              <span className="sub-dot" />{c.label}
                              {b && <span className="nav-badge muted" style={{ marginLeft: 'auto' }}>{b}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <div className="avatar" style={{ background: 'linear-gradient(135deg, oklch(0.6 0.15 262), oklch(0.52 0.17 287))' }}>{auInit}</div>
            <div className="grow" style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{auName}</div>
              <div className="faint" style={{ fontSize: 11.5 }}>{auRole}</div>
            </div>
          </div>
          <button className="foot-btn" onClick={() => setTheme(th => th === 'dark' ? 'light' : 'dark')}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="nav-ico" size={18} />
            {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            <span className="theme-switch"><span className="knob" /></span>
          </button>
          <button className="foot-btn danger" onClick={() => { window.PiagetAuth.clearSession(); toast('Sesión cerrada', 'info'); }}>
            <Icon name="logout" className="nav-ico" size={18} />Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <header className="topbar">
          <div className="crumbs">
            <span className="root">{crumb[0]}</span>
            <span className="sep"><Icon name="chevR" size={14} /></span>
            <span className="cur">{crumb[1]}</span>
          </div>
          {!isStudent && !isFamily && !isDocente && <div className="search" onClick={() => setCmdOpen(true)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCmdOpen(true); } }}>
            <Icon name="search" size={16} />
            <span>Buscar alumnos, familias, pagos…</span>
            <kbd>⌘K</kbd>
          </div>}
          <div className="topbar-right">
            <span className="conn" title={Store.mode === 'supabase' ? 'Conectado a Supabase' : 'Modo local (localStorage)'}>
              <span className="live-dot" style={{ background: Store.mode === 'supabase' ? 'var(--green)' : 'var(--amber)' }} />
              {Store.mode === 'supabase' ? 'Supabase' : 'Local'}
            </span>
            <button className="ai-trigger" onClick={() => setAiOpen(true)}>
              <Icon name="spark" size={16} className="spark" fill="currentColor" />Copilot
            </button>
            <NotifBell go={go} />
          </div>
        </header>

        <main className="content">
          {isFamily && window.ChildSwitcher && ['clases', 'ai-missions', 'atlas', 'engage', 'mensajeria-app', 'mi-credencial', 'historial-accesos'].indexOf(route) !== -1 &&
            React.createElement(window.ChildSwitcher, { key: 'cs' })}
          <div key={route + ':' + navTick} className="rise">
            {isScaffold
              ? <ScaffoldRoute routeId={route} go={go} openCopilot={() => setAiOpen(true)} />
              : <View go={go} route={route} openCopilot={() => setAiOpen(true)} />}
          </div>
        </main>
      </div>

      <Copilot open={aiOpen} onClose={() => setAiOpen(false)} />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} go={go} />
      <Toaster />

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Tema" />
        <TweakRadio label="Apariencia" value={theme === 'dark' ? 'Oscuro' : 'Claro'} options={['Claro', 'Oscuro']} onChange={v => setTheme(v === 'Oscuro' ? 'dark' : 'light')} />
        <TweakSection label="Color de acento" />
        <AccentSwatches value={t.accentHue} onChange={v => setTweak('accentHue', v)} />
        <TweakSection label="Tipografía" />
        <TweakRadio label="Estilo" value={t.fonts} options={['Moderno', 'Editorial', 'Técnico']} onChange={v => setTweak('fonts', v)} />
        <TweakSection label="Diseño" />
        <TweakRadio label="Densidad" value={t.density} options={['compact', 'regular', 'comfy']} onChange={v => setTweak('density', v)} />
        <TweakSlider label="Redondez" value={t.radius} min={6} max={22} step={1} unit="px" onChange={v => setTweak('radius', v)} />
        <TweakToggle label="Tarjetas elevadas" value={t.elevated} onChange={v => setTweak('elevated', v)} />
        <TweakSection label="Datos" />
        <TweakButton label="Reiniciar demo" onClick={() => { Store.reset(); toast('Datos restablecidos', 'info'); }} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
