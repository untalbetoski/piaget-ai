/* views_config_integrations_patch.jsx
   Configuración → Integraciones con acciones reales.
   Los cambios actualizan cfg.integrationsDetailed, DB.integrations y quedan
   listos para guardarse en Supabase con el botón Guardar cambios. */
(function () {
  function baseIntegrations() {
    return [
      { key: 'supabase', name: 'Supabase', desc: 'Base de datos, auth y storage', icon: 'layers', tone: 'green', connected: true, account: 'veqlmltuyouqprpoxvkt.supabase.co', lastSync: 'En vivo' },
      { key: 'pagos', name: 'Stripe', desc: 'Cobros con tarjeta en línea', icon: 'card', tone: 'violet', connected: false, account: '—', lastSync: '—' },
      { key: 'facturacion', name: 'Facturama (CFDI)', desc: 'Timbrado automático ante el SAT', icon: 'receipt', tone: 'cyan', connected: true, account: 'API Multiemisor', lastSync: 'hace 1 h' },
      { key: 'mensajeria', name: 'WhatsApp Business', desc: 'Avisos y recordatorios a familias', icon: 'message', tone: 'green', connected: false, account: '—', lastSync: '—' },
      { key: 'correo', name: 'Resend (correo)', desc: 'Correos transaccionales y boletines', icon: 'mail', tone: 'amber', connected: true, account: 'no-reply@jeanpiaget.mx', lastSync: 'hace 12 min' },
      { key: 'gclass', name: 'Google Classroom', desc: 'Sincroniza grupos y tareas', icon: 'cap', tone: 'red', connected: false, account: '—', lastSync: '—' },
      { key: 'calendar', name: 'Google Calendar', desc: 'Eventos y calendario escolar', icon: 'calendar', tone: 'blue', connected: true, account: 'direccion@jeanpiaget.mx', lastSync: 'hace 30 min' },
      { key: 'analytics', name: 'Metabase BI', desc: 'Tableros y analítica avanzada', icon: 'chart', tone: 'violet', connected: false, account: '—', lastSync: '—' },
    ];
  }

  function normalizeIntegrations(list) {
    const base = baseIntegrations();
    const current = Array.isArray(list) ? list : [];
    const byKey = Object.fromEntries(current.map(i => [i.key, i]));
    return base.map(it => ({ ...it, ...(byKey[it.key] || {}) }));
  }

  function publish(next) {
    DB.integrations = next.map(i => ({ ...i }));
    DB.settings.integrationsDetailed = next.map(i => ({ ...i }));
    window.dispatchEvent(new Event('piaget-settings'));
  }

  try {
    const saved = JSON.parse(localStorage.getItem('piaget_settings') || 'null');
    const list = (saved && saved.integrationsDetailed) || DB.settings.integrationsDetailed || DB.integrations;
    publish(normalizeIntegrations(list));
  } catch (_) {
    publish(normalizeIntegrations(DB.settings.integrationsDetailed || DB.integrations));
  }

  function CfgIntegrations({ cfg, set }) {
    const integrations = normalizeIntegrations(cfg.integrationsDetailed || DB.settings.integrationsDetailed || DB.integrations);
    const connectedCount = integrations.filter(i => i.connected).length;

    const saveList = next => {
      const clean = next.map(i => ({ ...i }));
      publish(clean);
      if (typeof set === 'function') set('integrationsDetailed', clean);
      else toast('No se encontró el guardador de configuración', 'warn');
    };

    const updateOne = (key, patch) => {
      const next = integrations.map(i => i.key === key ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i);
      saveList(next);
    };

    const toggle = it => {
      const now = !it.connected;
      updateOne(it.key, {
        connected: now,
        account: now ? (it.account && it.account !== '—' ? it.account : 'Pendiente de configurar') : '—',
        lastSync: now ? 'Pendiente de sincronizar' : '—',
        status: now ? 'connected' : 'inactive'
      });
      toast(it.name + (now ? ' conectado ✓' : ' desconectado'), now ? 'ok' : 'warn');
    };

    const sync = it => {
      if (!it.connected) { toast('Conecta primero ' + it.name, 'warn'); return; }
      updateOne(it.key, { lastSync: 'Ahora', lastSyncAt: new Date().toISOString(), status: 'connected' });
      toast('Sincronización registrada para ' + it.name, 'ok');
    };

    const editAccount = it => {
      const current = it.account && it.account !== '—' ? it.account : '';
      const value = window.prompt('Cuenta / identificador para ' + it.name, current);
      if (value == null) return;
      const account = value.trim() || '—';
      updateOne(it.key, { account, connected: account !== '—' ? it.connected : false, lastSync: account !== '—' && it.connected ? 'Ahora' : it.lastSync });
      toast('Ajustes de ' + it.name + ' actualizados ✓');
    };

    return (
      <div className="cfg-section">
        <SecHead title="Integraciones" desc={connectedCount + ' de ' + integrations.length + ' servicios conectados. Sincroniza Piaget con tus herramientas.'} />

        <div className="ai-panel">
          <div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}>
            <div className="insight-ico" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}><Icon name="shield" size={16} /></div>
            <div className="insight-body">
              <div className="insight-title">Configuración centralizada</div>
              <div className="insight-text">Conectar, desconectar, sincronizar o editar una integración marca cambios pendientes. Presiona <b>Guardar cambios</b> para persistirlos en Supabase.</div>
            </div>
            <Badge tone="green" dot>Supabase listo</Badge>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {integrations.map(it => {
            const on = !!it.connected;
            const bg = `var(--${it.tone === 'blue' ? 'accent' : it.tone}-soft)`;
            const fg = `var(--${it.tone === 'blue' ? 'accent' : it.tone})`;
            return (
              <div className="intg" key={it.key}>
                <div className="row between center">
                  <div className="row center gap-12" style={{ minWidth: 0 }}>
                    <div className="intg-ico" style={{ background: on ? bg : 'var(--surface-3)', color: on ? fg : 'var(--text-faint)' }}><Icon name={it.icon} size={20} /></div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{it.name}</div>
                      <div className="faint" style={{ fontSize: 12 }}>{it.desc}</div>
                    </div>
                  </div>
                  {on ? <Badge tone="green" dot>Conectado</Badge> : <Badge tone="gray">Inactivo</Badge>}
                </div>
                <div className="row between center" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div className="faint" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {on ? ((it.account || 'Pendiente') + ' · ' + (it.lastSync || 'Sin sincronizar')) : 'Sin configurar'}
                  </div>
                  <div className="row gap-8" style={{ flexShrink: 0 }}>
                    <button type="button" className="btn sm" onClick={() => editAccount(it)}><Icon name="settings" size={13} className="btn-ico" />Ajustes</button>
                    <button type="button" className="btn sm" onClick={() => sync(it)} disabled={!on} style={!on ? { opacity: 0.45 } : {}}><Icon name="refresh" size={13} className="btn-ico" />Sync</button>
                    <button type="button" className={'btn sm' + (on ? '' : ' primary')} onClick={() => toggle(it)}>{on ? 'Desconectar' : 'Conectar'}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  window.CfgIntegrations = CfgIntegrations;
})();
