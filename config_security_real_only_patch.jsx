/* config_security_real_only_patch.jsx — Configuración > Seguridad sin SSO Google/Microsoft ni datos demo */
(function () {
  function secCfg(cfg) {
    const base = (cfg && cfg.security) || {};
    return {
      twoFA: !!base.twoFA,
      twoFAMethod: base.twoFAMethod || 'App autenticadora',
      loginAlerts: !!base.loginAlerts,
      deviceTrust: !!base.deviceTrust,
      passwordMinLen: Number(base.passwordMinLen || 8),
      passwordSymbols: base.passwordSymbols !== false,
      passwordRotateDays: Number(base.passwordRotateDays || 0),
      sessionTimeout: Number(base.sessionTimeout || 60),
      ipAllowlist: !!base.ipAllowlist,
    };
  }
  function secCurrentSession() {
    let br = 'Navegador';
    let os = 'Equipo actual';
    try {
      const ua = navigator.userAgent || '';
      if (/Edg\//.test(ua)) br = 'Edge'; else if (/Chrome\//.test(ua)) br = 'Chrome'; else if (/Safari\//.test(ua)) br = 'Safari'; else if (/Firefox\//.test(ua)) br = 'Firefox';
      if (/Windows/i.test(ua)) os = 'Windows'; else if (/Mac OS/i.test(ua)) os = 'macOS'; else if (/Android/i.test(ua)) os = 'Android'; else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
    } catch (_) {}
    return [{ device: os + ' · ' + br, loc: 'Sesión actual', ip: '—', last: 'Ahora', current: true }];
  }
  function secAuditReal() {
    try {
      const src = DB && DB.settings && Array.isArray(DB.settings.auditReal) ? DB.settings.auditReal : [];
      return src.filter(a => a && (a.who || a.action || a.time)).slice(0, 40);
    } catch (_) { return []; }
  }
  const SEC_ICON_TONE_REAL = { wallet: 'green', book: 'blue', edit: 'blue', clipboard: 'violet', checkCircle: 'green', spark: 'violet', megaphone: 'amber', user: 'cyan', shield: 'red', alert: 'red', lock: 'violet' };

  function CfgSecurity({ cfg, setG }) {
    const s = secCfg(cfg || {});
    if (typeof useStore === 'function') useStore();
    const [sessions, setSessions] = React.useState(secCurrentSession);
    const audit = secAuditReal();
    const closeAll = () => { setSessions(ss => ss.filter(x => x.current)); toast('No hay otras sesiones reales para cerrar', 'info'); };
    const saveSec = (k, v) => {
      const cleaned = { ...s, [k]: v, sso: false, googleWorkspace: false, microsoftEntra: false, microsoft: false, google: false };
      setG('security', k, v);
      try {
        DB.settings = DB.settings || {};
        DB.settings.security = { ...(DB.settings.security || {}), ...cleaned };
        delete DB.settings.security.sso;
        delete DB.settings.security.googleWorkspace;
        delete DB.settings.security.microsoftEntra;
        delete DB.settings.security.microsoft;
        delete DB.settings.security.google;
        if (window.Store && Store.saveState) Store.saveState();
      } catch (_) {}
    };

    return <div className="cfg-section">
      <SecHead title="Seguridad" desc="Políticas de acceso, sesiones reales y auditoría sin datos demo." />

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="card-head"><div className="card-title"><Icon name="shield" className="ico" size={17} />Autenticación local</div></div>
          <SRow title="Verificación en dos pasos (2FA)" desc="Exigir segundo factor al iniciar sesión con cuenta local de la plataforma."><Sw on={s.twoFA} onClick={() => saveSec('twoFA', !s.twoFA)} /></SRow>
          {s.twoFA && <div className="srow" style={{ paddingTop: 4 }}><div className="sr-body"><div className="sr-title">Método 2FA</div></div><div className="sr-ctrl" style={{ width: 200 }}><SelectInput value={s.twoFAMethod} onChange={e => saveSec('twoFAMethod', e.target.value)} options={['App autenticadora', 'SMS', 'Correo electrónico']} /></div></div>}
          <SRow title="Alertas de inicio de sesión" desc="Avisar de accesos desde equipos nuevos cuando exista evento real de sesión."><Sw on={s.loginAlerts} onClick={() => saveSec('loginAlerts', !s.loginAlerts)} /></SRow>
          <SRow title="Equipos de confianza" desc="No pedir 2FA temporalmente en equipos marcados por el usuario."><Sw on={s.deviceTrust} onClick={() => saveSec('deviceTrust', !s.deviceTrust)} /></SRow>
          <div className="srow" style={{ borderBottom: 'none' }}><div className="sr-body"><div className="sr-title">SSO externo eliminado</div><div className="sr-desc">Se eliminó autenticación con Google Workspace y Microsoft. El acceso queda por cuentas locales reales.</div></div><Badge tone="gray">No disponible</Badge></div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title"><Icon name="lock" className="ico" size={17} />Políticas de acceso</div></div>
          <div className="srow"><div className="sr-body"><div className="sr-title">Longitud mínima de contraseña</div><div className="sr-desc">{s.passwordMinLen} caracteres</div></div><div className="sr-ctrl"><input type="range" min="6" max="16" value={s.passwordMinLen} onChange={e => saveSec('passwordMinLen', +e.target.value)} style={{ width: 150, accentColor: 'var(--accent)' }} /></div></div>
          <SRow title="Exigir símbolos y números" desc="Mayúsculas, dígitos y caracteres especiales."><Sw on={s.passwordSymbols} onClick={() => saveSec('passwordSymbols', !s.passwordSymbols)} /></SRow>
          <div className="srow"><div className="sr-body"><div className="sr-title">Caducidad de contraseña</div></div><div className="sr-ctrl" style={{ width: 150 }}><SelectInput value={s.passwordRotateDays} onChange={e => saveSec('passwordRotateDays', +e.target.value)} options={[{ value: 0, label: 'Nunca' }, { value: 60, label: '60 días' }, { value: 90, label: '90 días' }, { value: 180, label: '180 días' }]} /></div></div>
          <div className="srow"><div className="sr-body"><div className="sr-title">Cierre por inactividad</div></div><div className="sr-ctrl" style={{ width: 150 }}><SelectInput value={s.sessionTimeout} onChange={e => saveSec('sessionTimeout', +e.target.value)} options={[{ value: 15, label: '15 min' }, { value: 30, label: '30 min' }, { value: 60, label: '1 hora' }, { value: 240, label: '4 horas' }]} /></div></div>
          <SRow title="Lista blanca de IP" desc="Restringir el acceso a rangos de red conocidos cuando se configure backend real."><Sw on={s.ipAllowlist} onClick={() => saveSec('ipAllowlist', !s.ipAllowlist)} /></SRow>
        </div>
      </div>

      <div className="card">
        <CardHead icon="globe" title="Sesiones activas" sub={sessions.length + ' sesión real detectada'} right={<button className="btn sm" onClick={closeAll}><Icon name="logout" size={13} className="btn-ico" />Cerrar las demás</button>} />
        <div>{sessions.map((se, i) => <div className="lrow" key={i}><div className="kpi-ico" style={{ width: 34, height: 34, marginBottom: 0, background: 'var(--surface-3)', color: 'var(--text-muted)' }}><Icon name="globe" size={16} /></div><div className="grow"><div className="row center gap-8"><span style={{ fontWeight: 600, fontSize: 13.5 }}>{se.device}</span>{se.current && <Badge tone="green" dot>Este equipo</Badge>}</div><div className="faint" style={{ fontSize: 12.5 }}>{se.loc} · {se.ip} · {se.last}</div></div></div>)}</div>
      </div>

      <div className="card">
        <CardHead icon="history" title="Registro de auditoría" sub="Solo eventos reales guardados" right={<button className="btn sm" onClick={() => toast('No hay exportación de auditoría configurada todavía', 'info')}><Icon name="download" size={13} className="btn-ico" />Exportar</button>} />
        <div>{audit.map((a, i) => { const tone = SEC_ICON_TONE_REAL[a.icon] || 'blue'; return <div className="lrow" key={a._id || i}><div className="kpi-ico" style={{ width: 30, height: 30, marginBottom: 0, background: `var(--${tone}-soft)`, color: `var(--${tone})` }}><Icon name={a.icon || 'user'} size={14} /></div><div className="grow" style={{ fontSize: 13.5 }}><b style={{ fontWeight: 600 }}>{a.who || 'Sistema'}</b> <span className="muted">{a.action || 'registró actividad'}</span></div><span className="faint" style={{ fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{a.time || '—'}</span></div>; })}{audit.length === 0 && <div className="faint" style={{ fontSize: 13, padding: '16px 20px' }}>Sin auditoría real registrada todavía.</div>}</div>
      </div>
    </div>;
  }

  try {
    if (window.DB && DB.settings && DB.settings.security) {
      delete DB.settings.security.sso;
      delete DB.settings.security.googleWorkspace;
      delete DB.settings.security.microsoftEntra;
      delete DB.settings.security.microsoft;
      delete DB.settings.security.google;
    }
  } catch (_) {}

  window.CfgSecurity = CfgSecurity;
})();
