/* views_config_integrations_patch.jsx
   Configuración → Integraciones funcional.
   - Modal real de configuración por servicio.
   - Conectar/desconectar/sincronizar actualizan el estado.
   - Se guarda en cfg.integrationsDetailed y se intenta persistir en Supabase.
   - No guarda secretos privados en el navegador. */
(function () {
  function nowLabel() {
    return new Date().toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function baseIntegrations() {
    return [
      { key: 'supabase', name: 'Supabase', desc: 'Base de datos, auth y storage', icon: 'layers', tone: 'green', connected: true, locked: true, account: 'veqlmltuyouqprpoxvkt.supabase.co', lastSync: 'En vivo', status: 'connected', mode: 'Producción', endpoint: 'https://veqlmltuyouqprpoxvkt.supabase.co', notes: 'Conexión principal de PIAGET AI.' },
      { key: 'pagos', name: 'Stripe', desc: 'Cobros con tarjeta en línea', icon: 'card', tone: 'violet', connected: false, account: '', lastSync: '—', status: 'inactive', mode: 'Pruebas', endpoint: '', notes: '' },
      { key: 'facturacion', name: 'Facturama (CFDI)', desc: 'Timbrado automático ante el SAT', icon: 'receipt', tone: 'cyan', connected: true, account: 'API Multiemisor', lastSync: 'hace 1 h', status: 'connected', mode: 'Producción', endpoint: '', notes: 'Los secretos del PAC deben vivir en backend.' },
      { key: 'mensajeria', name: 'WhatsApp Business', desc: 'Avisos y recordatorios a familias', icon: 'message', tone: 'green', connected: false, account: '', lastSync: '—', status: 'inactive', mode: 'Pruebas', endpoint: '', notes: '' },
      { key: 'correo', name: 'Resend (correo)', desc: 'Correos transaccionales y boletines', icon: 'mail', tone: 'amber', connected: true, account: 'no-reply@jeanpiaget.mx', lastSync: 'hace 12 min', status: 'connected', mode: 'Producción', endpoint: '', notes: '' },
      { key: 'gclass', name: 'Google Classroom', desc: 'Sincroniza grupos y tareas', icon: 'cap', tone: 'red', connected: false, account: '', lastSync: '—', status: 'inactive', mode: 'Pruebas', endpoint: '', notes: '' },
      { key: 'calendar', name: 'Google Calendar', desc: 'Eventos y calendario escolar', icon: 'calendar', tone: 'blue', connected: true, account: 'direccion@jeanpiaget.mx', lastSync: 'hace 30 min', status: 'connected', mode: 'Producción', endpoint: '', notes: '' },
      { key: 'analytics', name: 'Metabase BI', desc: 'Tableros y analítica avanzada', icon: 'chart', tone: 'violet', connected: false, account: '', lastSync: '—', status: 'inactive', mode: 'Pruebas', endpoint: '', notes: '' },
    ];
  }

  function normalizeIntegrations(list) {
    const base = baseIntegrations();
    const current = Array.isArray(list) ? list : [];
    const byKey = Object.fromEntries(current.map(i => [i.key, i]));
    return base.map(it => ({ ...it, ...(byKey[it.key] || {}) }));
  }

  function cleanIntegration(it) {
    const x = { ...(it || {}) };
    delete x.apiKey;
    delete x.secret;
    delete x.privateKey;
    delete x.password;
    delete x.token;
    delete x.accessToken;
    delete x.refreshToken;
    return x;
  }

  function publish(next) {
    const clean = next.map(cleanIntegration);
    DB.integrations = clean.map(i => ({ ...i }));
    DB.settings.integrationsDetailed = clean.map(i => ({ ...i }));
    window.dispatchEvent(new Event('piaget-settings'));
    return clean;
  }

  try {
    const saved = JSON.parse(localStorage.getItem('piaget_settings') || 'null');
    publish(normalizeIntegrations((saved && saved.integrationsDetailed) || DB.settings.integrationsDetailed || DB.integrations));
  } catch (_) {
    publish(normalizeIntegrations(DB.settings.integrationsDetailed || DB.integrations));
  }

  function IntegrationModal({ item, onClose, onSave, onDisconnect }) {
    const [form, setForm] = React.useState(() => ({
      ...item,
      account: item.account && item.account !== '—' ? item.account : '',
      endpoint: item.endpoint || '',
      mode: item.mode || 'Producción',
      notes: item.notes || '',
      webhook: item.webhook || '',
      sender: item.sender || '',
      enabledModules: item.enabledModules || 'Todos',
    }));
    const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const save = () => {
      if (!String(form.account || '').trim() && form.key !== 'supabase') { toast('Escribe la cuenta o identificador de la integración', 'warn'); return; }
      onSave({
        ...form,
        account: String(form.account || '').trim(),
        endpoint: String(form.endpoint || '').trim(),
        webhook: String(form.webhook || '').trim(),
        sender: String(form.sender || '').trim(),
        notes: String(form.notes || '').trim(),
        connected: true,
        status: 'connected',
        lastSync: 'Ahora',
        lastSyncAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    };

    return (
      <Modal open width={620} onClose={onClose} title={'Configurar ' + item.name}
        footer={<>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          {item.connected && !item.locked && <button type="button" className="btn" style={{ color: 'var(--red)' }} onClick={() => onDisconnect(item)}><Icon name="logout" size={15} className="btn-ico" />Desconectar</button>}
          <button type="button" className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar integración</button>
        </>}>
        <div className="col gap-16">
          <div className="ai-panel" style={{ margin: 0 }}>
            <div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}>
              <div className="insight-ico" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon name="shield" size={16} /></div>
              <div className="insight-body">
                <div className="insight-title">No pegues secretos aquí</div>
                <div className="insight-text">Este formulario guarda metadatos: cuenta, endpoint, modo y notas. API keys, tokens y contraseñas deben vivir en variables de entorno o backend.</div>
              </div>
            </div>
          </div>

          <div className="field-row">
            <Field label="Estado"><SelectInput value={form.connected ? 'Conectado' : 'Inactivo'} onChange={e => upd('connected', e.target.value === 'Conectado')} options={['Conectado', 'Inactivo']} /></Field>
            <Field label="Modo"><SelectInput value={form.mode} onChange={e => upd('mode', e.target.value)} options={['Producción', 'Pruebas', 'Sandbox']} /></Field>
          </div>
          <Field label="Cuenta / identificador"><TextInput value={form.account} onChange={e => upd('account', e.target.value)} placeholder="Ej. cuenta@dominio.mx, acct_..., tenant, proyecto" /></Field>
          <Field label="Endpoint público / URL de servicio"><TextInput value={form.endpoint} onChange={e => upd('endpoint', e.target.value)} placeholder="https://..." /></Field>
          <div className="field-row">
            <Field label="Webhook / callback público"><TextInput value={form.webhook} onChange={e => upd('webhook', e.target.value)} placeholder="https://soypiaget.app/api/..." /></Field>
            <Field label="Remitente / origen"><TextInput value={form.sender} onChange={e => upd('sender', e.target.value)} placeholder="no-reply@..., WhatsApp ID, calendario" /></Field>
          </div>
          <Field label="Módulos habilitados"><SelectInput value={form.enabledModules} onChange={e => upd('enabledModules', e.target.value)} options={['Todos', 'Cobros', 'Facturación', 'Comunicación', 'Académico', 'Reportes']} /></Field>
          <Field label="Notas internas"><textarea className="input" rows="3" value={form.notes} onChange={e => upd('notes', e.target.value)} placeholder="Uso, alcance, responsable o pendiente técnico" /></Field>
        </div>
      </Modal>
    );
  }

  function CfgIntegrations({ cfg, set }) {
    const [editing, setEditing] = React.useState(null);
    const [busyKey, setBusyKey] = React.useState('');
    const integrations = normalizeIntegrations(cfg.integrationsDetailed || DB.settings.integrationsDetailed || DB.integrations);
    const connectedCount = integrations.filter(i => i.connected).length;

    const persist = async next => {
      const clean = publish(next);
      const nextCfg = { ...cfg, integrationsDetailed: clean };
      if (typeof set === 'function') set('integrationsDetailed', clean);
      try { localStorage.setItem('piaget_settings', JSON.stringify(nextCfg)); } catch (_) {}
      if (window.PiagetSettings) {
        const res = await window.PiagetSettings.save(nextCfg);
        if (res && res.ok) toast('Integraciones guardadas en Supabase ✓', 'ok');
        else toast('Cambio aplicado. Presiona Guardar cambios para sincronizar si hace falta.', 'info');
      }
      return clean;
    };

    const updateOne = async (key, patch) => {
      setBusyKey(key);
      const next = integrations.map(i => i.key === key ? cleanIntegration({ ...i, ...patch, updatedAt: new Date().toISOString() }) : i);
      await persist(next);
      setBusyKey('');
    };

    const connect = it => setEditing({ ...it, connected: true });
    const configure = it => setEditing(it);
    const disconnect = async it => {
      if (it.locked) { toast(it.name + ' es integración base y no se puede desconectar', 'warn'); return; }
      await updateOne(it.key, { connected: false, status: 'inactive', account: '', lastSync: '—', lastSyncAt: null });
      setEditing(null);
      toast(it.name + ' desconectado', 'warn');
    };
    const sync = async it => {
      if (!it.connected) { toast('Configura y conecta primero ' + it.name, 'warn'); return; }
      await updateOne(it.key, { lastSync: 'Ahora', lastSyncAt: new Date().toISOString(), status: 'connected' });
      toast('Sincronización registrada para ' + it.name, 'ok');
    };
    const saveModal = async form => {
      await updateOne(form.key, form);
      setEditing(null);
      toast(form.name + ' configurado ✓', 'ok');
    };

    return (
      <div className="cfg-section">
        <SecHead title="Integraciones" desc={connectedCount + ' de ' + integrations.length + ' servicios conectados. Configura servicios externos y guarda el estado en Supabase.'} />

        <div className="ai-panel">
          <div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}>
            <div className="insight-ico" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}><Icon name="shield" size={16} /></div>
            <div className="insight-body">
              <div className="insight-title">Integraciones configurables</div>
              <div className="insight-text">Usa <b>Configurar</b> para abrir el formulario, <b>Conectar</b> para activar una integración y <b>Sync</b> para registrar una sincronización. Los cambios se guardan en Configuración central.</div>
            </div>
            <Badge tone="green" dot>platform_settings</Badge>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {integrations.map(it => {
            const on = !!it.connected;
            const bg = `var(--${it.tone === 'blue' ? 'accent' : it.tone}-soft)`;
            const fg = `var(--${it.tone === 'blue' ? 'accent' : it.tone})`;
            const busy = busyKey === it.key;
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
                  {on ? <Badge tone="green" dot>{busy ? 'Guardando' : 'Conectado'}</Badge> : <Badge tone="gray">Inactivo</Badge>}
                </div>

                <div className="kv" style={{ marginTop: 12 }}><span className="k">Cuenta</span><span className="v">{on ? (it.account || 'Pendiente') : 'Sin configurar'}</span></div>
                <div className="kv"><span className="k">Modo</span><span className="v">{it.mode || '—'}</span></div>
                <div className="kv"><span className="k">Última sync</span><span className="v">{it.lastSync || '—'}</span></div>

                <div className="row between center" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                  <div className="faint" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>{it.status || (on ? 'connected' : 'inactive')}</div>
                  <div className="row gap-8" style={{ flexShrink: 0 }}>
                    <button type="button" className="btn sm" onClick={() => configure(it)} disabled={busy}><Icon name="settings" size={13} className="btn-ico" />Configurar</button>
                    <button type="button" className="btn sm" onClick={() => sync(it)} disabled={!on || busy} style={!on ? { opacity: 0.45 } : {}}><Icon name="refresh" size={13} className="btn-ico" />Sync</button>
                    {on ? <button type="button" className="btn sm" onClick={() => disconnect(it)} disabled={busy || it.locked}>{it.locked ? 'Base' : 'Desconectar'}</button>
                      : <button type="button" className="btn sm primary" onClick={() => connect(it)} disabled={busy}>Conectar</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {editing && <IntegrationModal item={editing} onClose={() => setEditing(null)} onSave={saveModal} onDisconnect={disconnect} />}
      </div>
    );
  }

  window.CfgIntegrations = CfgIntegrations;
})();
