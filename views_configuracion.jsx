/* views_configuracion.jsx — Shell del módulo Configuración.
   Navegación lateral de secciones + estado compartido (persistido en localStorage).
   Las secciones viven en views_config_sections.jsx (window.Cfg*). */

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
      { id: 'integraciones', label: 'Integraciones', icon: 'layers', C: 'CfgIntegrations', cnt: () => DB.integrations.filter(i => i.connected).length },
      { id: 'fiscal', label: 'Facturación fiscal', icon: 'receipt', C: 'CfgFiscal' },
      { id: 'notificaciones', label: 'Notificaciones', icon: 'bell', C: 'CfgNotifications' },
      { id: 'respaldos', label: 'Respaldos y datos', icon: 'download', C: 'CfgBackups' },
    ],
  },
];

function cfgDeepMerge(base, over) {
  if (!over || typeof over !== 'object') return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(base)) {
    if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) out[k] = cfgDeepMerge(base[k], over[k]);
    else if (k in over) out[k] = over[k];
  }
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

  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent-h', cfg.branding.accentHue);
  }, [cfg.branding.accentHue]);
  React.useEffect(() => { try { localStorage.setItem('piaget_cfg_sec', sec); } catch (e) { } }, [sec]);
  /* Publica la configuración en vivo para que el sidebar (logo, marca, usuario) reaccione */
  React.useEffect(() => { window.PIAGET_LIVE = cfg; window.dispatchEvent(new Event('piaget-settings')); }, [cfg]);

  const set = (k, v) => { setCfg(c => ({ ...c, [k]: v })); setDirty(true); };
  const setG = (group, k, v) => { setCfg(c => ({ ...c, [group]: { ...c[group], [k]: v } })); setDirty(true); };

  const save = () => {
    try { localStorage.setItem('piaget_settings', JSON.stringify(cfg)); }
    catch (e) { toast('Cambios aplicados, pero no se pudieron guardar (almacenamiento lleno)', 'warn'); DB.settings = cfg; setDirty(false); return; }
    DB.settings = cfg;
    setDirty(false);
    toast('Configuración guardada ✓');
  };

  const allItems = CFG_GROUPS.flatMap(g => g.items);
  const active = allItems.find(i => i.id === sec) || allItems[0];
  const View = window[active.C];

  return (
    <div className="content-inner">
      <PageHead eyebrow="Administración" title="Configuración" desc="Ajusta tu institución, accesos, integraciones y datos.">
        <button className="btn primary" onClick={save} disabled={!dirty} style={dirty ? {} : { opacity: 0.55 }}>
          <Icon name="check" size={15} className="btn-ico" />{dirty ? 'Guardar cambios' : 'Todo guardado'}
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
