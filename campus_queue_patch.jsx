/* campus_queue_patch.jsx */
(function () {
  function ColaEspera({ go }) {
    const [queue, setQueue] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    async function load() {
      setLoading(true);
      try { const d = await window.CampusEntry.read(); setQueue(d.queue || []); }
      catch (e) { toast('No se pudo cargar cola: ' + e.message, 'warn'); }
      finally { setLoading(false); }
    }
    React.useEffect(() => { load(); }, []);
    async function resolveItem(item, ok) {
      try {
        await window.CampusEntry.resolve(item.id, ok);
        setQueue(q => q.filter(x => x.id !== item.id));
        toast(ok ? 'Registro aprobado: ' + item.name : 'Registro rechazado: ' + item.name, ok ? 'ok' : 'warn');
      } catch (e) { toast('No se pudo resolver: ' + e.message, 'warn'); }
    }
    return <div className="content-inner"><PageHead eyebrow="Control de Accesos" title="Cola de Espera" desc={loading ? 'Sincronizando…' : queue.length + ' pendientes de validación'}><button className="btn" onClick={load}><Icon name="refresh" size={15} className="btn-ico" />Sincronizar</button><button className="btn" onClick={() => go('scanner-qr')}><Icon name="qr" size={15} className="btn-ico" />Scanner</button></PageHead>{queue.length === 0 ? <div className="card pad" style={{ display:'grid', placeItems:'center', padding:60, textAlign:'center' }}><div style={{ width:56, height:56, borderRadius:999, background:'var(--green-soft)', color:'var(--green)', display:'grid', placeItems:'center' }}><Icon name="check" size={28} stroke={2.6}/></div><div style={{fontWeight:600,fontSize:17,marginTop:14}}>Cola despejada</div><div className="faint mt-4">No hay validaciones pendientes.</div></div> : <div className="grid" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))' }}>{queue.map((q,i)=>{ const t=window.TONE[q.tone||'amber']; return <div className="card pad" key={q.id||i}><div className="row between center"><div className="row center gap-12"><div style={{position:'relative'}}><Avatar name={q.name} size={44}/><span style={{position:'absolute',top:-3,left:-3,width:22,height:22,borderRadius:999,background:'var(--accent)',color:'var(--on-accent)',display:'grid',placeItems:'center',fontSize:11,fontWeight:700,border:'2px solid var(--surface)'}}>{i+1}</span></div><div><div style={{fontWeight:600}}>{q.name}</div><div className="faint" style={{fontSize:12.5}}>{q.role} · {q.grade}</div></div></div><span className="row center gap-6 faint" style={{fontSize:11.5}}><Icon name="clock" size={13}/>{q.wait}</span></div><div className="mt-12" style={{padding:'10px 12px',background:t.bg,color:t.c,borderRadius:'var(--r-sm)',fontSize:12.5,fontWeight:600,display:'flex',alignItems:'center',gap:8}}><Icon name="alert" size={15}/>{q.motivo || q.reason}</div><div className="row gap-8 mt-12"><button className="btn primary grow" style={{justifyContent:'center'}} onClick={()=>resolveItem(q,true)}><Icon name="check" size={15} className="btn-ico"/>Autorizar</button><button className="btn grow" style={{justifyContent:'center'}} onClick={()=>resolveItem(q,false)}><Icon name="x" size={15} className="btn-ico"/>Rechazar</button></div></div>;})}</div>}</div>;
  }
  window.ColaEspera = ColaEspera;
})();
