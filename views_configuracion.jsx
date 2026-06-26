/* views_configuracion.jsx — Shell del módulo Configuración.
   Navegación lateral de secciones + estado compartido.
   Persiste en platform_settings vía Supabase RPC y conserva fallback local. */

const CFG_GROUPS = [
  {
    label: 'Institución', items: [
      { id: 'general', label: 'General', icon: 'building', C: 'CfgGeneral' },
      { id: 'marca', label: 'Marca y apariencia', icon: 'image', C: 'CfgBranding' },
      { id: 'ciclo', label: 'Ciclo escolar', icon: 'calendar', C: 'CfgCycle' },
    ],
  },
  {
    label: 'Acceso', items: [
      { id: 'usuarios', label: 'Usuarios y roles', icon: 'users', C: 'CfgUsers', cnt: () => DB.adminUsers.length },
      { id: 'seguridad', label: 'Seguridad', icon: 'shield', C: 'CfgSecurity' },
    ],
  },
  {
    label: 'Sistema', items: [
      { id: 'integraciones', label: 'Integraciones', icon: 'layers', C: 'CfgIntegrations', cnt: () => (DB.integrations || []).filter(i => i.connected).length },
      { id: 'fiscal', label: 'Facturación fiscal', icon: 'receipt', C: 'CfgFiscal' },
      { id: 'notificaciones', label: 'Notificaciones', icon: 'bell', C: 'CfgNotifications' },
      { id: 'respaldos', label: 'Respaldos y datos', icon: 'download', C: 'CfgBackups' },
    ],
  },
];

function cfgDeepMerge(base, over) {
  if (!over || typeof over !== 'object') return base;
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  const out = { ...base };
  Object.keys(over).forEach(k => {
    if (out[k] && typeof out[k] === 'object' && !Array.isArray(out[k]) && over[k] && typeof over[k] === 'object' && !Array.isArray(over[k])) out[k] = cfgDeepMerge(out[k], over[k]);
    else out[k] = over[k];
  });
  return out;
}

function Configuracion() {
  const [cfg, setCfg] = React.useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('piaget_settings') || 'null');
      return saved ? cfgDeepMerge(DB.settings, saved) : DB.settings;
    } catch (e) { return DB.settings; }
  });
  const [sec, setSec] = React.useState(() => localStorage.getItem('piaget_cfg_sec') || 'general');
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    async function loadServerSettings() {
      if (!window.PiagetSettings) return;
      setLoading(true);
      try {
        const server = await window.PiagetSettings.load();
        if (!alive || !server || !Object.keys(server).length) return;
        const merged = cfgDeepMerge(DB.settings, server);
        DB.settings = merged;
        if (merged.integrationsDetailed) DB.integrations = merged.integrationsDetailed.map(i => ({ ...i }));
        setCfg(merged);
        setDirty(false);
      } catch (e) {
        console.warn('[PIAGET] No se pudo cargar configuración central', e);
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadServerSettings();
    return () => { alive = false; };
  }, []);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent-h', cfg.branding.accentHue);
  }, [cfg.branding.accentHue]);
  React.useEffect(() => { try { localStorage.setItem('piaget_cfg_sec', sec); } catch (e) { } }, [sec]);
  React.useEffect(() => { window.PIAGET_LIVE = cfg; window.dispatchEvent(new Event('piaget-settings')); }, [cfg]);

  const set = (k, v) => { setCfg(c => ({ ...c, [k]: v })); setDirty(true); };
  const setG = (group, k, v) => { setCfg(c => ({ ...c, [group]: { ...c[group], [k]: v } })); setDirty(true); };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      DB.settings = cfg;
      if (cfg.integrationsDetailed) DB.integrations = cfg.integrationsDetailed.map(i => ({ ...i }));
      try { localStorage.setItem('piaget_settings', JSON.stringify(cfg)); } catch (e) { }
      const res = window.PiagetSettings ? await window.PiagetSettings.save(cfg) : { ok: false, local: true };
      setDirty(false);
      if (res && res.ok) toast('Configuración guardada en Supabase ✓');
      else toast('Configuración guardada localmente; inicia sesión de Dirección para sincronizar', 'warn');
    } catch (e) {
      toast('No se pudo guardar la configuración: ' + (e.message || e), 'warn');
    } finally {
      setSaving(false);
    }
  };

  const allItems = CFG_GROUPS.flatMap(g => g.items);
  const active = allItems.find(i => i.id === sec) || allItems[0];
  const View = window[active.C];

  return (
    <div className="content-inner">
      <PageHead eyebrow="Administración" title="Configuración" desc={loading ? 'Cargando configuración centralizada…' : 'Ajusta tu institución, accesos, integraciones y datos.'}>
        <button className="btn primary" onClick={save} disabled={!dirty || saving} style={(dirty && !saving) ? {} : { opacity: 0.55 }}>
          <Icon name="check" size={15} className="btn-ico" />{saving ? 'Guardando…' : (dirty ? 'Guardar cambios' : 'Todo guardado')}
        </button>
      </PageHead>

      <div className="cfg-layout">
        <nav className="cfg-nav">
          {CFG_GROUPS.map(g => (
            <div key={g.label}>
              <div className="cfg-nav-group">{g.label}</div>
              {g.items.map(it => (
                <button key={it.id} className={'cfg-navitem' + (sec === it.id ? ' active' : '')} onClick={() => setSec(it.id)} type="button">
                  <Icon name={it.icon} className="ci" size={17} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
                  {it.cnt && <span className="cnt">{it.cnt()}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div key={sec} className="rise">
          {View ? <View cfg={cfg} set={set} setG={setG} /> : null}
        </div>
      </div>
    </div>
  );
}

window.Configuracion = Configuracion;
