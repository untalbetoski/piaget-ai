/* views_config_integrations_patch.jsx
   Corrige el módulo Configuración → Integraciones.
   Antes conectaba/desconectaba solo en estado local; ahora vive dentro de
   DB.settings.integrationsDetailed y se guarda con el botón Guardar cambios. */
(function () {
  const baseIntegrations = () => (DB.integrations || []).map(x => ({ ...x }));

  function normalizeIntegrations(list) {
    const current = Array.isArray(list) ? list : [];
    const byKey = Object.fromEntries(current.map(i => [i.key, i]));
    return baseIntegrations().map(it => ({ ...it, ...(byKey[it.key] || {}) }));
  }

  try {
    const saved = JSON.parse(localStorage.getItem('piaget_settings') || 'null');
    const savedList = saved && saved.integrationsDetailed;
    DB.settings.integrationsDetailed = normalizeIntegrations(savedList || DB.settings.integrationsDetailed || DB.integrations);
    DB.integrations = DB.settings.integrationsDetailed.map(i => ({ ...i }));
  } catch (_) {
    DB.settings.integrationsDetailed = normalizeIntegrations(DB.settings.integrationsDetailed || DB.integrations);
  }

  function CfgIntegrations({ cfg, set }) {
    const integrations = normalizeIntegrations(cfg.integrationsDetailed || DB.settings.integrationsDetailed || DB.integrations);
    const connectedCount = integrations.filter(i => i.connected).length;

    const saveList = next => {
      DB.integrations = next.map(i => ({ ...i }));
      set('integrationsDetailed', next.map(i => ({ ...i })));
    };

    const updateOne = (key, patch) => {
      const next = integrations.map(i => i.key === key ? { ...i, ...patch } : i);
      saveList(next);
    };

    const toggle = it => {
      const now = !it.connected;
      updateOne(it.key, {
        connected: now,
        account: now ? (it.account && it.account !== '—' ? it.account : 'Pendiente de configurar') : '—',
        lastSync: now ? 'Pendiente de sincronizar' : '—'
      });
      toast(it.name + (now ? ' conectado ✓' : ' desconectado'), now ? 'ok' : 'warn');
    };

    const sync = it => {
      if (!it.connected) { toast('Conecta primero ' + it.name, 'warn'); return; }
      updateOne(it.key, { lastSync: 'Ahora' });
      toast('Sincronización registrada para ' + it.name, 'ok');
    };

    const editAccount = it => {
      const current = it.account && it.account !== '—' ? it.account : '';
      const value = window.prompt('Cuenta / identificador para ' + it.name, current);
      if (value == null) return;
      updateOne(it.key, { account: value.trim() || '—', lastSync: it.connected ? 'Ahora' : '—' });
      toast('Ajustes de ' + it.name + ' actualizados ✓');
    };

    return (
      <div className="cfg-section">
        <SecHead title="Integraciones" desc={connectedCount + ' de ' + integrations.length + ' servicios conectados. Sincroniza Piaget con tus herramientas.'} />

        <div className="ai-panel">
          <div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}>
            <div className="insight-ico" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon name="shield" size={16} /></div>
            <div className="insight-body">
              <div className="insight-title">Estado de configuración persistente</div>
              <div className="insight-text">Los cambios quedan dentro de Configuración y se guardan al presionar <b>Guardar cambios</b>. Las credenciales privadas deben configurarse en backend o variables de entorno, no en el navegador.</div>
            </div>
            <Badge tone="blue" dot>Listo para guardar</Badge>
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
                    <button className="btn sm" onClick={() => editAccount(it)}><Icon name="settings" size={13} className="btn-ico" />Ajustes</button>
                    {on && <button className="btn sm" onClick={() => sync(it)}><Icon name="refresh" size={13} className="btn-ico" />Sync</button>}
                    <button className={'btn sm' + (on ? '' : ' primary')} onClick={() => toggle(it)}>{on ? 'Desconectar' : 'Conectar'}</button>
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
