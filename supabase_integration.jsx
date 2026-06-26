/* supabase_integration.jsx — Diagnóstico y acciones de integración Supabase */
(function () {
  const SKEY = 'piaget_session';
  function cfg() { return window.PIAGET_CONFIG || {}; }
  function session() { try { return JSON.parse(localStorage.getItem(SKEY) || 'null') || null; } catch (_) { return null; } }
  async function loadClient() {
    const c = cfg();
    if (!c.supabaseUrl || !c.supabaseKey) throw new Error('Faltan supabaseUrl o supabaseKey en config.js');
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
    window.PIAGET_SB = window.supabase.createClient(c.supabaseUrl, c.supabaseKey);
    return window.PIAGET_SB;
  }
  async function diagnose() {
    const c = cfg();
    const s = session();
    const out = {
      ok: false,
      url: c.supabaseUrl || '',
      hasKey: !!c.supabaseKey,
      realtime: !!c.realtime,
      storeMode: window.Store && Store.mode || 'no-store',
      authMode: window.PiagetAuth && PiagetAuth.mode || 'no-auth',
      hasSessionToken: !!(s && s.session_token),
      user: s && (s.email || s.username || s.name) || '',
      role: s && s.role || '',
      counts: {},
      errors: [],
    };
    try {
      const sb = await loadClient();
      if (s && s.session_token) {
        for (const table of ['announcements', 'activity', 'students', 'cobros', 'platform_settings']) {
          if (table === 'platform_settings') {
            const { data, error } = await sb.rpc('piaget_settings_get', { p_token: s.session_token });
            if (error) out.errors.push('settings: ' + error.message);
            else out.counts.settings = data && typeof data === 'object' ? Object.keys(data).length : 0;
          } else {
            const { data, error } = await sb.rpc('piaget_read', { p_token: s.session_token, p_table: table });
            if (error) out.errors.push(table + ': ' + error.message);
            else out.counts[table] = Array.isArray(data) ? data.length : 0;
          }
        }
      } else {
        out.errors.push('Sin session_token. Cierra sesión y vuelve a iniciar sesión.');
      }
      out.ok = out.errors.length === 0;
    } catch (e) {
      out.errors.push(e.message || String(e));
    }
    return out;
  }
  async function refreshAll() {
    if (!window.Store) throw new Error('Store no está disponible');
    window.dispatchEvent(new Event('piaget-session'));
    return diagnose();
  }

  function DiagnosticsModal({ onClose }) {
    const [loading, setLoading] = React.useState(true);
    const [result, setResult] = React.useState(null);
    const run = async () => {
      setLoading(true);
      const r = await diagnose();
      setResult(r);
      setLoading(false);
      toast(r.ok ? 'Supabase conectado correctamente ✓' : 'Supabase requiere atención', r.ok ? 'ok' : 'warn');
    };
    React.useEffect(() => { run(); }, []);
    const r = result || {};
    const c = r.counts || {};
    return (
      <Modal open width={620} onClose={onClose} title="Diagnóstico Supabase"
        footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn" onClick={run} disabled={loading}><Icon name="refresh" size={15} className="btn-ico" />Revisar otra vez</button><button className="btn primary" onClick={async () => { setLoading(true); setResult(await refreshAll()); setLoading(false); }}><Icon name="check" size={15} className="btn-ico" />Forzar sincronización</button></>}>
        {loading ? <div className="faint" style={{ padding: 24 }}>Revisando conexión segura con Supabase…</div> : (
          <div className="col gap-14">
            <div className="ai-panel" style={{ margin: 0 }}>
              <div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}>
                <div className="insight-ico" style={{ background: r.ok ? 'var(--green-soft)' : 'var(--amber-soft)', color: r.ok ? 'var(--green)' : 'var(--amber)' }}><Icon name={r.ok ? 'checkCircle' : 'alert'} size={16} /></div>
                <div className="insight-body">
                  <div className="insight-title">{r.ok ? 'Conexión activa' : 'Revisión necesaria'}</div>
                  <div className="insight-text">Store: <b>{r.storeMode}</b> · Auth: <b>{r.authMode}</b> · Sesión: <b>{r.hasSessionToken ? 'con token' : 'sin token'}</b></div>
                </div>
                <Badge tone={r.ok ? 'green' : 'amber'} dot>{r.ok ? 'OK' : 'Atención'}</Badge>
              </div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="card pad col gap-8"><div className="card-title">Proyecto</div><div className="faint font-mono" style={{ fontSize: 12 }}>{r.url || 'Sin URL'}</div><div className="kv"><span className="k">Publishable key</span><span className="v">{r.hasKey ? 'Configurada' : 'Falta'}</span></div><div className="kv"><span className="k">Realtime</span><span className="v">{r.realtime ? 'Activo' : 'Inactivo'}</span></div></div>
              <div className="card pad col gap-8"><div className="card-title">Sesión</div><div className="kv"><span className="k">Usuario</span><span className="v">{r.user || '—'}</span></div><div className="kv"><span className="k">Rol</span><span className="v">{r.role || '—'}</span></div><div className="kv"><span className="k">Modo</span><span className="v">{r.storeMode}</span></div></div>
            </div>
            <div className="card pad col gap-8"><div className="card-title">Lectura por RPC</div>{Object.keys(c).map(k => <div className="kv" key={k}><span className="k">{k}</span><span className="v">{c[k]}</span></div>)}{!Object.keys(c).length && <div className="faint">Sin conteos disponibles.</div>}</div>
            {r.errors && r.errors.length > 0 && <div className="card pad col gap-8" style={{ borderColor: 'color-mix(in oklch, var(--amber), var(--border) 60%)' }}><div className="card-title">Pendientes</div>{r.errors.map((e, i) => <div key={i} className="faint" style={{ fontSize: 12.5 }}>• {e}</div>)}</div>}
          </div>
        )}
      </Modal>
    );
  }

  function installConfigWrapper() {
    if (window.__PIAGET_SUPABASE_CFG_WRAP) return;
    if (!window.CfgIntegrations || !window.React) return setTimeout(installConfigWrapper, 400);
    window.__PIAGET_SUPABASE_CFG_WRAP = true;
    const Base = window.CfgIntegrations;
    window.CfgIntegrations = function CfgIntegrationsWithSupabase(props) {
      const [open, setOpen] = React.useState(false);
      return (
        <React.Fragment>
          <Base {...props} />
          <div className="card pad" style={{ marginTop: 16 }}>
            <div className="row between center">
              <div>
                <div className="card-title"><Icon name="layers" className="ico" size={17} />Diagnóstico avanzado Supabase</div>
                <div className="faint" style={{ fontSize: 12.5 }}>Verifica session_token, modo seguro, RPC, configuración central y conteos sincronizados.</div>
              </div>
              <button type="button" className="btn primary" onClick={() => setOpen(true)}><Icon name="refresh" size={15} className="btn-ico" />Probar conexión</button>
            </div>
          </div>
          {open && <DiagnosticsModal onClose={() => setOpen(false)} />}
        </React.Fragment>
      );
    };
  }

  window.PiagetSupabase = { diagnose, refreshAll, loadClient, installConfigWrapper };
  setTimeout(installConfigWrapper, 1200);
})();
