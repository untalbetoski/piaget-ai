/* campus_entry_ui_patch.jsx */
(function () {
  function okBadge(s) { return s === 'ok' ? <Badge tone="green">OK</Badge> : <Badge tone="amber">Revisar</Badge>; }
  function movBadge(d) { return d === 'out' ? <Badge tone="gray" dot>Salida</Badge> : <Badge tone="green" dot>Entrada</Badge>; }

  function ScannerQR({ go }) {
    const [rows, setRows] = React.useState([]);
    const [busy, setBusy] = React.useState(false);
    const [name, setName] = React.useState('');
    async function load() {
      try { const d = await window.CampusEntry.read(); setRows((d.events || []).slice(0, 8)); }
      catch (e) { toast('No se pudo sincronizar: ' + e.message, 'warn'); }
    }
    React.useEffect(() => { load(); }, []);
    async function save() {
      const n = name.trim() || 'Registro de prueba';
      setBusy(true);
      try {
        const rec = await window.CampusEntry.add({ name: n, role: 'Visitante', grade: 'Manual', gate: 'Acceso Principal', dir: 'in', method: 'QR', status: 'ok', source: 'scanner' });
        setRows(r => [rec, ...r].slice(0, 8)); setName(''); toast('Entrada registrada: ' + rec.name, 'ok');
      } catch (e) { toast('No se pudo registrar: ' + e.message, 'warn'); }
      finally { setBusy(false); }
    }
    return <div className="content-inner"><PageHead eyebrow="Control de Accesos" title="Scanner QR" desc="Registro conectado a Supabase."><button className="btn" onClick={() => go('historial-accesos')}><Icon name="clock" size={15} className="btn-ico" />Historial</button></PageHead><div className="grid" style={{ gridTemplateColumns:'1fr 1fr', alignItems:'start' }}><div className="card pad col center gap-16" style={{ padding:32 }}><div style={{ width:260, height:260, borderRadius:20, background:'var(--surface-2)', border:'1px solid var(--border)', display:'grid', placeItems:'center' }}><Icon name="qr" size={92} className="faint" /></div><TextInput value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre o folio" onKeyDown={e=>e.key==='Enter'&&save()} /><button className="btn primary" disabled={busy} onClick={save}><Icon name="scan" size={15} className="btn-ico" />{busy?'Registrando…':'Registrar entrada'}</button></div><div className="card"><CardHead icon="clock" title="Registros recientes" sub="Bitácora real" right={<button className="btn sm" onClick={load}>Sincronizar</button>} /><div>{rows.map((r,i)=><div className="lrow" key={r.id||i}><Avatar name={r.name} size={32}/><div className="grow"><div style={{fontWeight:600,fontSize:13.5}}>{r.name}</div><div className="faint" style={{fontSize:12}}>{r.role} · {r.grade||'—'}</div></div><span className="font-mono faint" style={{fontSize:11.5}}>{r.time}</span>{okBadge(r.status)}</div>)}{!rows.length&&<div className="lrow faint" style={{justifyContent:'center',padding:28}}>Sin registros</div>}</div></div></div></div>;
  }

  function HistorialAccesos({ go }) {
    const [rows, setRows] = React.useState([]); const [filter, setFilter] = React.useState('Todos');
    async function load(){ try{ const d=await window.CampusEntry.read(); setRows(d.events||[]); }catch(e){ toast('No se pudo cargar: '+e.message,'warn'); } }
    React.useEffect(()=>{load();},[]);
    const shown = filter==='Todos'?rows:rows.filter(r=>filter==='Entradas'?r.dir==='in':r.dir==='out');
    return <div className="content-inner"><PageHead eyebrow="Control de Accesos" title="Historial de Accesos" desc="Bitácora sincronizada con Supabase."><button className="btn" onClick={load}><Icon name="refresh" size={15} className="btn-ico"/>Sincronizar</button></PageHead><div className="card"><CardHead icon="clock" title="Registros" sub={shown.length+' movimientos'} right={<div className="seg">{['Todos','Entradas','Salidas'].map(f=><button key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f}</button>)}</div>} /><div style={{overflowX:'auto'}}><table className="tbl"><thead><tr><th>Persona</th><th>Rol</th><th>Puerta</th><th>Método</th><th>Fecha</th><th>Hora</th><th>Movimiento</th><th>Resultado</th></tr></thead><tbody>{shown.map((a,i)=><tr key={a.id||i}><td><div className="person"><Avatar name={a.name} size={30}/><div className="pname">{a.name}</div></div></td><td className="muted">{a.role}</td><td>{a.gate}</td><td><span className="font-mono faint" style={{fontSize:12.5}}>{a.method}</span></td><td className="font-mono" style={{fontSize:12}}>{a.date}</td><td className="font-mono" style={{fontSize:12.5}}>{a.time}</td><td>{movBadge(a.dir)}</td><td>{okBadge(a.status)}</td></tr>)}{!shown.length&&<tr><td colSpan="8" className="faint" style={{textAlign:'center',padding:28}}>Sin registros.</td></tr>}</tbody></table></div></div></div>;
  }

  window.ScannerQR = ScannerQR;
  window.HistorialAccesos = HistorialAccesos;
})();
