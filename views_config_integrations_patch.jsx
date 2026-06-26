/* views_config_integrations_patch.jsx
   Configuración → Integraciones funcional y diagnóstico Supabase directo. */
(function () {
  const SKEY = 'piaget_session';

  function baseIntegrations() {
    return [
      { key: 'supabase', name: 'Supabase', desc: 'Base de datos, auth, storage y realtime', icon: 'layers', tone: 'green', connected: true, locked: true, account: 'veqlmltuyouqprpoxvkt.supabase.co', lastSync: 'En vivo', status: 'connected', mode: 'Producción', endpoint: 'https://veqlmltuyouqprpoxvkt.supabase.co', notes: 'Conexión principal de PIAGET AI.' },
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
    ['apiKey', 'secret', 'privateKey', 'password', 'token', 'accessToken', 'refreshToken', 'serviceRoleKey'].forEach(k => delete x[k]);
    return x;
  }

  function publish(next) {
    const clean = next.map(cleanIntegration);
    DB.integrations = clean.map(i => ({ ...i }));
    DB.settings.integrationsDetailed = clean.map(i => ({ ...i }));
    window.dispatchEvent(new Event('piaget-settings'));
    return clean;
  }

  function session() { try { return JSON.parse(localStorage.getItem(SKEY) || 'null') || null; } catch (_) { return null; } }

  async function loadSupabaseClient() {
    const cfg = window.PIAGET_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseKey) throw new Error('Faltan supabaseUrl o supabaseKey en config.js');
    if (window.PIAGET_SB) return window.PIAGET_SB;
    if (!window.supabase) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    window.PIAGET_SB = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    return window.PIAGET_SB;
  }

  async function diagnoseSupabase() {
    const cfg = window.PIAGET_CONFIG || {};
    const s = session();
    const out = {
      ok: false,
      url: cfg.supabaseUrl || '',
      hasKey: !!cfg.supabaseKey,
      realtime: !!cfg.realtime,
      storeMode: window.Store ? Store.mode : 'no-store',
      authMode: window.PiagetAuth ? PiagetAuth.mode : 'no-auth',
      hasSessionToken: !!(s && s.session_token),
      user: s ? (s.email || s.username || s.name || '') : '',
      role: s ? (s.role || '') : '',
      counts: {},
      errors: [],
    };
    try {
      const sb = await loadSupabaseClient();
      if (!s || !s.session_token) {
        out.errors.push('Sin session_token. Cierra sesión y vuelve a iniciar sesión.');
      } else {
        for (const table of ['announcements', 'activity', 'students', 'cobros']) {
          const { data, error } = await sb.rpc('piaget_read', { p_token: s.session_token, p_table: table });
          if (error) out.errors.push(table + ': ' + error.message);
          else out.counts[table] = Array.isArray(data) ? data.length : 0;
        }
        const st = await sb.rpc('piaget_settings_get', { p_token: s.session_token });
        if (st.error) out.errors.push('settings: ' + st.error.message);
        else out.counts.settings = st.data && typeof st.data === 'object' ? Object.keys(st.data).length : 0;
      }
      out.ok = out.errors.length === 0;
    } catch (e) {
      out.errors.push(e.message || String(e));
    }
    return out;
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
      onSave({ ...form, account: String(form.account || '').trim(), endpoint: String(form.endpoint || '').trim(), webhook: String(form.webhook || '').trim(), sender: String(form.sender || '').trim(), notes: String(form.notes || '').trim(), connected: true, status: 'connected', lastSync: 'Ahora', lastSyncAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    };
    return (
      <Modal open width={620} onClose={onClose} title={'Configurar ' + item.name}
        footer={<><button type="button" className="btn" onClick={onClose}>Cancelar</button>{item.connected && !item.locked && <button type="button" className="btn" style={{ color: 'var(--red)' }} onClick={() => onDisconnect(item)}><Icon name="logout" size={15} className="btn-ico" />Desconectar</button>}<button type="button" className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar integración</button></>}>
        <div className="col gap-16">
          <div className="ai-panel" style={{ margin: 0 }}><div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}><div className="insight-ico" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon name="shield" size={16} /></div><div className="insight-body"><div className="insight-title">No pegues secretos aquí</div><div className="insight-text">Este formulario guarda metadatos. API keys, tokens y contraseñas deben vivir en backend o variables de entorno.</div></div></div></div>
          <div className="field-row"><Field label="Estado"><SelectInput value={form.connected ? 'Conectado' : 'Inactivo'} onChange={e => upd('connected', e.target.value === 'Conectado')} options={['Conectado', 'Inactivo']} /></Field><Field label="Modo"><SelectInput value={form.mode} onChange={e => upd('mode', e.target.value)} options={['Producción', 'Pruebas', 'Sandbox']} /></Field></div>
          <Field label="Cuenta / identificador"><TextInput value={form.account} onChange={e => upd('account', e.target.value)} placeholder="Ej. cuenta@dominio.mx, tenant, proyecto" /></Field>
          <Field label="Endpoint público / URL de servicio"><TextInput value={form.endpoint} onChange={e => upd('endpoint', e.target.value)} placeholder="https://..." /></Field>
          <div className="field-row"><Field label="Webhook / callback público"><TextInput value={form.webhook} onChange={e => upd('webhook', e.target.value)} placeholder="https://soypiaget.app/api/..." /></Field><Field label="Remitente / origen"><TextInput value={form.sender} onChange={e => upd('sender', e.target.value)} placeholder="no-reply@..., calendario" /></Field></div>
          <Field label="Módulos habilitados"><SelectInput value={form.enabledModules} onChange={e => upd('enabledModules', e.target.value)} options={['Todos', 'Cobros', 'Facturación', 'Comunicación', 'Académico', 'Reportes']} /></Field>
          <Field label="Notas internas"><textarea className="input" rows="3" value={form.notes} onChange={e => upd('notes', e.target.value)} placeholder="Uso, alcance, responsable o pendiente técnico" /></Field>
        </div>
      </Modal>
    );
  }

  function SupabaseDiagnosticsModal({ onClose }) {
    const [loading, setLoading] = React.useState(true);
    const [result, setResult] = React.useState(null);
    const run = async () => { setLoading(true); const r = await diagnoseSupabase(); setResult(r); setLoading(false); toast(r.ok ? 'Supabase conectado correctamente ✓' : 'Supabase requiere atención', r.ok ? 'ok' : 'warn'); };
    const force = async () => { if (window.Store) window.dispatchEvent(new Event('piaget-session')); await run(); };
    React.useEffect(() => { run(); }, []);
    const r = result || {}; const c = r.counts || {};
    return (
      <Modal open width={650} onClose={onClose} title="Diagnóstico avanzado Supabase"
        footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn" onClick={run} disabled={loading}><Icon name="refresh" size={15} className="btn-ico" />Probar otra vez</button><button className="btn primary" onClick={force} disabled={loading}><Icon name="check" size={15} className="btn-ico" />Forzar sincronización</button></>}>
        {loading ? <div className="faint" style={{ padding: 24 }}>Revisando conexión segura con Supabase…</div> : <div className="col gap-14">
          <div className="ai-panel" style={{ margin: 0 }}><div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}><div className="insight-ico" style={{ background: r.ok ? 'var(--green-soft)' : 'var(--amber-soft)', color: r.ok ? 'var(--green)' : 'var(--amber)' }}><Icon name={r.ok ? 'checkCircle' : 'alert'} size={16} /></div><div className="insight-body"><div className="insight-title">{r.ok ? 'Conexión activa' : 'Revisión necesaria'}</div><div className="insight-text">Store: <b>{r.storeMode}</b> · Auth: <b>{r.authMode}</b> · Sesión: <b>{r.hasSessionToken ? 'con token' : 'sin token'}</b></div></div><Badge tone={r.ok ? 'green' : 'amber'} dot>{r.ok ? 'OK' : 'Atención'}</Badge></div></div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}><div className="card pad col gap-8"><div className="card-title">Proyecto</div><div className="faint font-mono" style={{ fontSize: 12 }}>{r.url || 'Sin URL'}</div><div className="kv"><span className="k">Publishable key</span><span className="v">{r.hasKey ? 'Configurada' : 'Falta'}</span></div><div className="kv"><span className="k">Realtime</span><span className="v">{r.realtime ? 'Activo' : 'Inactivo'}</span></div></div><div className="card pad col gap-8"><div className="card-title">Sesión</div><div className="kv"><span className="k">Usuario</span><span className="v">{r.user || '—'}</span></div><div className="kv"><span className="k">Rol</span><span className="v">{r.role || '—'}</span></div><div className="kv"><span className="k">Modo</span><span className="v">{r.storeMode}</span></div></div></div>
          <div className="card pad col gap-8"><div className="card-title">Lectura por RPC</div>{Object.keys(c).map(k => <div className="kv" key={k}><span className="k">{k}</span><span className="v">{c[k]}</span></div>)}{!Object.keys(c).length && <div className="faint">Sin conteos disponibles.</div>}</div>
          {r.errors && r.errors.length > 0 && <div className="card pad col gap-8" style={{ borderColor: 'color-mix(in oklch, var(--amber), var(--border) 60%)' }}><div className="card-title">Pendientes</div>{r.errors.map((e, i) => <div key={i} className="faint" style={{ fontSize: 12.5 }}>• {e}</div>)}</div>}
        </div>}
      </Modal>
    );
  }

  function CfgIntegrations({ cfg, set }) {
    const [editing, setEditing] = React.useState(null);
    const [diagOpen, setDiagOpen] = React.useState(false);
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
    const updateOne = async (key, patch) => { setBusyKey(key); const next = integrations.map(i => i.key === key ? cleanIntegration({ ...i, ...patch, updatedAt: new Date().toISOString() }) : i); await persist(next); setBusyKey(''); };
    const connect = it => setEditing({ ...it, connected: true });
    const configure = it => setEditing(it);
    const disconnect = async it => { if (it.locked) { toast(it.name + ' es integración base y no se puede desconectar', 'warn'); return; } await updateOne(it.key, { connected: false, status: 'inactive', account: '', lastSync: '—', lastSyncAt: null }); setEditing(null); toast(it.name + ' desconectado', 'warn'); };
    const sync = async it => { if (!it.connected) { toast('Configura y conecta primero ' + it.name, 'warn'); return; } if (it.key === 'supabase') { setDiagOpen(true); return; } await updateOne(it.key, { lastSync: 'Ahora', lastSyncAt: new Date().toISOString(), status: 'connected' }); toast('Sincronización registrada para ' + it.name, 'ok'); };
    const saveModal = async form => { await updateOne(form.key, form); setEditing(null); toast(form.name + ' configurado ✓', 'ok'); };

    return (
      <div className="cfg-section">
        <SecHead title="Integraciones" desc={connectedCount + ' de ' + integrations.length + ' servicios conectados. Configura servicios externos y guarda el estado en Supabase.'} />
        <div className="ai-panel"><div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}><div className="insight-ico" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}><Icon name="shield" size={16} /></div><div className="insight-body"><div className="insight-title">Integraciones configurables</div><div className="insight-text">Usa <b>Configurar</b>, <b>Conectar</b> o <b>Sync</b>. En Supabase, el botón Sync abre el diagnóstico real de conexión.</div></div><Badge tone="green" dot>platform_settings</Badge></div></div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>{integrations.map(it => { const on = !!it.connected; const bg = `var(--${it.tone === 'blue' ? 'accent' : it.tone}-soft)`; const fg = `var(--${it.tone === 'blue' ? 'accent' : it.tone})`; const busy = busyKey === it.key; return <div className="intg" key={it.key}><div className="row between center"><div className="row center gap-12" style={{ minWidth: 0 }}><div className="intg-ico" style={{ background: on ? bg : 'var(--surface-3)', color: on ? fg : 'var(--text-faint)' }}><Icon name={it.icon} size={20} /></div><div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{it.name}</div><div className="faint" style={{ fontSize: 12 }}>{it.desc}</div></div></div>{on ? <Badge tone="green" dot>{busy ? 'Guardando' : 'Conectado'}</Badge> : <Badge tone="gray">Inactivo</Badge>}</div><div className="kv" style={{ marginTop: 12 }}><span className="k">Cuenta</span><span className="v">{on ? (it.account || 'Pendiente') : 'Sin configurar'}</span></div><div className="kv"><span className="k">Modo</span><span className="v">{it.mode || '—'}</span></div><div className="kv"><span className="k">Última sync</span><span className="v">{it.lastSync || '—'}</span></div><div className="row between center" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}><div className="faint" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>{it.status || (on ? 'connected' : 'inactive')}</div><div className="row gap-8" style={{ flexShrink: 0 }}><button type="button" className="btn sm" onClick={() => configure(it)} disabled={busy}><Icon name="settings" size={13} className="btn-ico" />Configurar</button><button type="button" className="btn sm" onClick={() => sync(it)} disabled={!on || busy} style={!on ? { opacity: 0.45 } : {}}><Icon name="refresh" size={13} className="btn-ico" />Sync</button>{on ? <button type="button" className="btn sm" onClick={() => disconnect(it)} disabled={busy || it.locked}>{it.locked ? 'Base' : 'Desconectar'}</button> : <button type="button" className="btn sm primary" onClick={() => connect(it)} disabled={busy}>Conectar</button>}</div></div></div>; })}</div>
        <div className="card pad" style={{ marginTop: 16 }}><div className="row between center"><div><div className="card-title"><Icon name="layers" className="ico" size={17} />Diagnóstico avanzado Supabase</div><div className="faint" style={{ fontSize: 12.5 }}>Verifica session_token, modo seguro, RPC, configuración central y conteos sincronizados.</div></div><button type="button" className="btn primary" onClick={() => setDiagOpen(true)}><Icon name="refresh" size={15} className="btn-ico" />Probar conexión</button></div></div>
        {editing && <IntegrationModal item={editing} onClose={() => setEditing(null)} onSave={saveModal} onDisconnect={disconnect} />}
        {diagOpen && <SupabaseDiagnosticsModal onClose={() => setDiagOpen(false)} />}
      </div>
    );
  }

  window.CfgIntegrations = CfgIntegrations;
})();
