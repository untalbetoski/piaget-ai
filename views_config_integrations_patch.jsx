/* views_config_integrations_patch.jsx — Integraciones reales y carga de Seguridad limpia */
(function () {
  function loadSecurityClean() {
    if (document.querySelector('script[src*="config_security_real_only_patch.jsx"]')) return;
    var s = document.createElement('script');
    s.type = 'text/babel';
    s.src = 'config_security_real_only_patch.jsx?v=20260701-real-security-no-sso';
    s.async = false;
    document.head.appendChild(s);
  }
  loadSecurityClean();

  function cleanList() {
    try {
      const src = (DB.settings && Array.isArray(DB.settings.integrationsDetailed)) ? DB.settings.integrationsDetailed : (Array.isArray(DB.integrations) ? DB.integrations : []);
      return src.map(it => ({
        key: it.key || it.name || Math.random().toString(36).slice(2),
        name: it.name || 'Integración',
        desc: it.desc || it.description || 'Servicio configurado por la institución.',
        icon: it.icon || 'layers',
        tone: it.tone || 'gray',
        connected: !!it.connected,
        account: it.connected ? (it.account || 'Configurado') : '',
        lastSync: it.connected ? (it.lastSync || '—') : '—',
      }));
    } catch (_) { return []; }
  }
  function CfgIntegrations() {
    const [items, setItems] = React.useState(cleanList);
    const active = items.filter(i => i.connected).length;
    function toggle(it) {
      const next = items.map(x => x.key === it.key ? { ...x, connected: !x.connected, lastSync: !x.connected ? 'Ahora' : '—' } : x);
      setItems(next);
      try {
        DB.settings = DB.settings || {};
        DB.settings.integrationsDetailed = next.map(x => ({ ...x }));
        DB.integrations = next.map(x => ({ ...x }));
        if (window.Store && Store.saveState) Store.saveState();
      } catch (_) {}
      toast(it.name + (!it.connected ? ' conectado' : ' desconectado'), !it.connected ? 'ok' : 'warn');
    }
    return <div className="cfg-section">
      <SecHead title="Integraciones" desc={active + ' servicios configurados por la institución. Sin estados demo.'} />
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {items.map(it => <div className="intg" key={it.key}>
          <div className="row between center">
            <div className="row center gap-12" style={{ minWidth: 0 }}>
              <div className="intg-ico" style={{ background: it.connected ? 'var(--green-soft)' : 'var(--surface-3)', color: it.connected ? 'var(--green)' : 'var(--text-faint)' }}><Icon name={it.icon} size={20} /></div>
              <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{it.name}</div><div className="faint" style={{ fontSize: 12 }}>{it.desc}</div></div>
            </div>
            {it.connected ? <Badge tone="green" dot>Conectado</Badge> : <Badge tone="gray">Inactivo</Badge>}
          </div>
          <div className="row between center" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div className="faint" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.connected ? ((it.account || 'Configurado') + ' · ' + (it.lastSync || '—')) : 'Sin configurar'}</div>
            <button className={'btn sm' + (it.connected ? '' : ' primary')} onClick={() => toggle(it)}>{it.connected ? 'Desconectar' : 'Conectar'}</button>
          </div>
        </div>)}
        {!items.length && <div className="card pad faint" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>Sin integraciones configuradas.</div>}
      </div>
    </div>;
  }
  window.CfgIntegrations = CfgIntegrations;
})();
