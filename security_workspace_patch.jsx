/* security_workspace_patch.jsx */
(function () {
  function CfgSecurity({ cfg, setG }) {
    const s = cfg.security || {};
    const [gws, setGws] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    async function check() {
      setBusy(true);
      try { const r = await fetch('/api/gws'); setGws(await r.json()); }
      catch (e) { setGws({ ok:false, configured:false, error:e.message }); }
      finally { setBusy(false); }
    }
    React.useEffect(() => { check(); }, []);
    const ua = navigator.userAgent || '';
    const device = (/Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /Android/.test(ua) ? 'Android' : 'Equipo') + ' · ' + (/Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Navegador');
    return <div className="cfg-section">
      <SecHead title="Seguridad" desc="Autenticación, Google Workspace, sesiones y auditoría." />
      <div className="card" style={{ marginBottom:16 }}>
        <CardHead icon="shield" title="Google Workspace" sub="Ingreso institucional para jeanpiaget.mx" right={<button className="btn sm" onClick={check}><Icon name="refresh" size={13} className="btn-ico" />{busy ? 'Revisando…' : 'Probar'}</button>} />
        <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', padding:16, gap:10 }}>
          <div className="kv"><span className="k">Estado</span><span className="v">{gws && gws.configured ? 'Configurado' : 'Pendiente'}</span></div>
          <div className="kv"><span className="k">Dominio</span><span className="v">{(gws && gws.domain) || 'jeanpiaget.mx'}</span></div>
          <div className="kv"><span className="k">Client ID</span><span className="v">{gws && gws.clientId ? 'Cargado' : 'Falta'}</span></div>
          <div className="kv"><span className="k">Autocrear</span><span className="v">{gws && gws.autoProvision ? 'Sí' : 'No'}</span></div>
        </div>
        <div className="faint" style={{ fontSize:12.5, lineHeight:1.55, padding:'0 16px 16px' }}>El acceso solo acepta cuentas Google Workspace cuyo dominio hospedado sea <b>jeanpiaget.mx</b>. Si no está configurado, agrega las variables de Workspace y vuelve a desplegar.</div>
      </div>
      <div className="grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
        <div className="card"><div className="card-head"><div className="card-title"><Icon name="shield" className="ico" size={17} />Autenticación</div></div><SRow title="Inicio con Google Workspace" desc="Mostrar el botón institucional en la pantalla de acceso."><Sw on={s.sso} onClick={() => setG('security','sso',!s.sso)} /></SRow><SRow title="Verificación en dos pasos (2FA)" desc="Exigir segundo factor al iniciar sesión."><Sw on={s.twoFA} onClick={() => setG('security','twoFA',!s.twoFA)} /></SRow><SRow title="Alertas de inicio de sesión" desc="Avisar de accesos desde equipos nuevos."><Sw on={s.loginAlerts} onClick={() => setG('security','loginAlerts',!s.loginAlerts)} /></SRow><SRow title="Equipos de confianza" desc="No pedir 2FA por 30 días en equipos marcados."><Sw on={s.deviceTrust} onClick={() => setG('security','deviceTrust',!s.deviceTrust)} /></SRow></div>
        <div className="card"><div className="card-head"><div className="card-title"><Icon name="lock" className="ico" size={17} />Políticas de acceso</div></div><div className="srow"><div className="sr-body"><div className="sr-title">Longitud mínima de contraseña</div><div className="sr-desc">{s.passwordMinLen || 8} caracteres</div></div><div className="sr-ctrl"><input type="range" min="6" max="16" value={s.passwordMinLen || 8} onChange={e => setG('security','passwordMinLen',+e.target.value)} style={{ width:150, accentColor:'var(--accent)' }} /></div></div><SRow title="Exigir símbolos y números" desc="Mayúsculas, dígitos y caracteres especiales."><Sw on={s.passwordSymbols} onClick={() => setG('security','passwordSymbols',!s.passwordSymbols)} /></SRow><div className="srow"><div className="sr-body"><div className="sr-title">Cierre por inactividad</div></div><div className="sr-ctrl" style={{ width:150 }}><SelectInput value={s.sessionTimeout || 60} onChange={e => setG('security','sessionTimeout',+e.target.value)} options={[{value:15,label:'15 min'},{value:30,label:'30 min'},{value:60,label:'1 hora'},{value:240,label:'4 horas'}]} /></div></div></div>
      </div>
      <div className="card mt-16"><CardHead icon="globe" title="Sesiones activas" sub="1 dispositivo" /><div className="lrow"><div className="kpi-ico" style={{ width:34,height:34,marginBottom:0,background:'var(--surface-3)',color:'var(--text-muted)' }}><Icon name="globe" size={16}/></div><div className="grow"><div className="row center gap-8"><span style={{fontWeight:600,fontSize:13.5}}>{device}</span><Badge tone="green" dot>Este equipo</Badge></div><div className="faint" style={{fontSize:12.5}}>Sesión actual · — · Ahora</div></div></div></div>
    </div>;
  }
  window.CfgSecurity = CfgSecurity;
})();
