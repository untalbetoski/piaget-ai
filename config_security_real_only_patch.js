/* config_security_real_only_patch.js — override real de Configuración > Seguridad */
(function () {
  function h() { return React.createElement.apply(React, arguments); }
  function txt(v) { return String(v == null ? '' : v); }
  function settings() { window.DB = window.DB || {}; DB.settings = DB.settings || {}; DB.settings.security = DB.settings.security || {}; return DB.settings; }
  function cleanFlags() {
    try {
      var s = settings().security;
      delete s.sso;
      delete s.googleWorkspace;
      delete s.microsoftEntra;
      delete s.microsoft;
      delete s.google;
    } catch (_) {}
  }
  function sec(cfg) {
    var b = (cfg && cfg.security) || {};
    return {
      twoFA: !!b.twoFA,
      twoFAMethod: b.twoFAMethod || 'App autenticadora',
      loginAlerts: !!b.loginAlerts,
      deviceTrust: !!b.deviceTrust,
      passwordMinLen: Number(b.passwordMinLen || 8),
      passwordSymbols: b.passwordSymbols !== false,
      passwordRotateDays: Number(b.passwordRotateDays || 0),
      sessionTimeout: Number(b.sessionTimeout || 60),
      ipAllowlist: !!b.ipAllowlist
    };
  }
  function Toggle(props) { return h('button', { className: 'sw' + (props.on ? ' on' : ''), onClick: props.onClick, type: 'button' }, h('span', { className: 'knob' })); }
  function Row(props) { return h('div', { className: 'srow' }, h('div', { className: 'sr-body' }, h('div', { className: 'sr-title' }, props.title), props.desc ? h('div', { className: 'sr-desc' }, props.desc) : null), h('div', { className: 'sr-ctrl' }, props.children)); }
  function Select(props) { return h('select', { className: 'inp', value: props.value, onChange: props.onChange }, props.options.map(function (o) { return typeof o === 'object' ? h('option', { key: o.value, value: o.value }, o.label) : h('option', { key: o, value: o }, o); })); }
  function BadgeLite(props) { return h('span', { className: 'badge ' + (props.tone || 'gray') }, props.children); }
  function sessionNow() {
    var br = 'Navegador', os = 'Equipo actual';
    try {
      var ua = navigator.userAgent || '';
      if (/Edg\//.test(ua)) br = 'Edge'; else if (/Chrome\//.test(ua)) br = 'Chrome'; else if (/Safari\//.test(ua)) br = 'Safari'; else if (/Firefox\//.test(ua)) br = 'Firefox';
      if (/Windows/i.test(ua)) os = 'Windows'; else if (/Mac OS/i.test(ua)) os = 'macOS'; else if (/Android/i.test(ua)) os = 'Android'; else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
    } catch (_) {}
    return [{ device: os + ' · ' + br, loc: 'Sesión actual', ip: '—', last: 'Ahora', current: true }];
  }
  function auditReal() {
    try { return Array.isArray(settings().auditReal) ? settings().auditReal.filter(function (a) { return a && (a.who || a.action || a.time); }).slice(0, 40) : []; } catch (_) { return []; }
  }
  function saveSec(key, value, current, setG) {
    try {
      var next = Object.assign({}, current, {});
      next[key] = value;
      DB.settings.security = Object.assign({}, DB.settings.security || {}, next);
      cleanFlags();
      if (typeof setG === 'function') setG('security', key, value);
      if (window.Store && Store.saveState) Store.saveState();
    } catch (_) {}
  }
  function CfgSecurity(props) {
    var cfg = (props && props.cfg) || {};
    var setG = props && props.setG;
    var s = sec(cfg);
    if (typeof useStore === 'function') useStore();
    var state = React.useState(sessionNow);
    var sessions = state[0], setSessions = state[1];
    var audit = auditReal();
    var closeAll = function () { setSessions(sessions.filter(function (x) { return x.current; })); if (window.toast) toast('No hay otras sesiones reales para cerrar', 'info'); };
    return h('div', { className: 'cfg-section' },
      h('div', { className: 'cfg-section-head' }, h('h2', null, 'Seguridad'), h('p', null, 'Políticas de acceso, sesión actual y auditoría real. Sin datos demo.')),
      h('div', { className: 'grid', style: { gridTemplateColumns: '1fr 1fr' } },
        h('div', { className: 'card' },
          h('div', { className: 'card-head' }, h('div', { className: 'card-title' }, 'Autenticación local')),
          h(Row, { title: 'Verificación en dos pasos (2FA)', desc: 'Exigir segundo factor al iniciar sesión con cuenta local.' }, h(Toggle, { on: s.twoFA, onClick: function () { saveSec('twoFA', !s.twoFA, s, setG); } })),
          s.twoFA ? h('div', { className: 'srow', style: { paddingTop: 4 } }, h('div', { className: 'sr-body' }, h('div', { className: 'sr-title' }, 'Método 2FA')), h('div', { className: 'sr-ctrl', style: { width: 200 } }, h(Select, { value: s.twoFAMethod, onChange: function (ev) { saveSec('twoFAMethod', ev.target.value, s, setG); }, options: ['App autenticadora', 'SMS', 'Correo electrónico'] }))) : null,
          h(Row, { title: 'Alertas de inicio de sesión', desc: 'Avisar accesos desde equipos nuevos cuando exista evento real.' }, h(Toggle, { on: s.loginAlerts, onClick: function () { saveSec('loginAlerts', !s.loginAlerts, s, setG); } })),
          h(Row, { title: 'Equipos de confianza', desc: 'No pedir 2FA temporalmente en equipos marcados.' }, h(Toggle, { on: s.deviceTrust, onClick: function () { saveSec('deviceTrust', !s.deviceTrust, s, setG); } })),
          h('div', { className: 'srow', style: { borderBottom: 'none' } }, h('div', { className: 'sr-body' }, h('div', { className: 'sr-title' }, 'SSO externo eliminado'), h('div', { className: 'sr-desc' }, 'El acceso queda por cuentas locales reales de la plataforma.')), h(BadgeLite, { tone: 'gray' }, 'No disponible'))
        ),
        h('div', { className: 'card' },
          h('div', { className: 'card-head' }, h('div', { className: 'card-title' }, 'Políticas de acceso')),
          h('div', { className: 'srow' }, h('div', { className: 'sr-body' }, h('div', { className: 'sr-title' }, 'Longitud mínima de contraseña'), h('div', { className: 'sr-desc' }, s.passwordMinLen + ' caracteres')), h('div', { className: 'sr-ctrl' }, h('input', { type: 'range', min: 6, max: 16, value: s.passwordMinLen, onChange: function (ev) { saveSec('passwordMinLen', Number(ev.target.value), s, setG); }, style: { width: 150, accentColor: 'var(--accent)' } }))),
          h(Row, { title: 'Exigir símbolos y números', desc: 'Mayúsculas, dígitos y caracteres especiales.' }, h(Toggle, { on: s.passwordSymbols, onClick: function () { saveSec('passwordSymbols', !s.passwordSymbols, s, setG); } })),
          h('div', { className: 'srow' }, h('div', { className: 'sr-body' }, h('div', { className: 'sr-title' }, 'Caducidad de contraseña')), h('div', { className: 'sr-ctrl', style: { width: 150 } }, h(Select, { value: s.passwordRotateDays, onChange: function (ev) { saveSec('passwordRotateDays', Number(ev.target.value), s, setG); }, options: [{ value: 0, label: 'Nunca' }, { value: 60, label: '60 días' }, { value: 90, label: '90 días' }, { value: 180, label: '180 días' }] }))),
          h('div', { className: 'srow' }, h('div', { className: 'sr-body' }, h('div', { className: 'sr-title' }, 'Cierre por inactividad')), h('div', { className: 'sr-ctrl', style: { width: 150 } }, h(Select, { value: s.sessionTimeout, onChange: function (ev) { saveSec('sessionTimeout', Number(ev.target.value), s, setG); }, options: [{ value: 15, label: '15 min' }, { value: 30, label: '30 min' }, { value: 60, label: '1 hora' }, { value: 240, label: '4 horas' }] }))),
          h(Row, { title: 'Lista blanca de IP', desc: 'Restringir el acceso a rangos conocidos cuando exista backend real.' }, h(Toggle, { on: s.ipAllowlist, onClick: function () { saveSec('ipAllowlist', !s.ipAllowlist, s, setG); } }))
        )
      ),
      h('div', { className: 'card' }, h('div', { className: 'card-head' }, h('div', { className: 'card-title' }, 'Sesiones activas'), h('button', { className: 'btn sm', onClick: closeAll }, 'Cerrar las demás')), h('div', null, sessions.map(function (se, i) { return h('div', { className: 'lrow', key: i }, h('div', { className: 'grow' }, h('div', { className: 'row center gap-8' }, h('span', { style: { fontWeight: 600, fontSize: 13.5 } }, se.device), se.current ? h(BadgeLite, { tone: 'green' }, 'Este equipo') : null), h('div', { className: 'faint', style: { fontSize: 12.5 } }, se.loc + ' · ' + se.ip + ' · ' + se.last))); }))),
      h('div', { className: 'card' }, h('div', { className: 'card-head' }, h('div', { className: 'card-title' }, 'Registro de auditoría')), h('div', null, audit.length ? audit.map(function (a, i) { return h('div', { className: 'lrow', key: a._id || i }, h('div', { className: 'grow', style: { fontSize: 13.5 } }, h('b', null, a.who || 'Sistema'), ' ', h('span', { className: 'muted' }, a.action || 'registró actividad')), h('span', { className: 'faint', style: { fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' } }, a.time || '—')); }) : h('div', { className: 'faint', style: { fontSize: 13, padding: '16px 20px' } }, 'Sin auditoría real registrada todavía.')))
    );
  }
  cleanFlags();
  window.CfgSecurity = CfgSecurity;
  setTimeout(function () {
    try {
      if (localStorage.getItem('piaget_cfg_sec') !== 'seguridad') return;
      var btns = Array.prototype.slice.call(document.querySelectorAll('.cfg-navitem'));
      var secBtn = btns.find(function (b) { return /Seguridad/i.test(b.textContent || ''); });
      var other = btns.find(function (b) { return !/Seguridad/i.test(b.textContent || ''); });
      if (secBtn && other) { other.click(); setTimeout(function () { secBtn.click(); }, 50); }
    } catch (_) {}
  }, 500);
})();
