/* qr_live_patch.jsx */
(function () {
  function parseQR(raw) {
    const text = String(raw || '').trim();
    if (!text) return null;
    try {
      const j = JSON.parse(text);
      return { name: j.name || j.nombre || j.student || j.alumno || text, role: j.role || j.rol || 'Estudiante', grade: j.grade || j.grado || j.grupo || '—', raw: text };
    } catch (_) {}
    const p = text.split('|').map(x => x.trim()).filter(Boolean);
    if (p.length > 1) return { name: p[0], grade: p[1], role: p[2] || 'Estudiante', raw: text };
    return { name: text, role: 'Visitante', grade: 'QR', raw: text };
  }
  function loadLib() {
    if (window.jsQR) return Promise.resolve();
    return new Promise((ok, bad) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      s.onload = ok; s.onerror = bad; document.head.appendChild(s);
    });
  }
  function ScannerQR({ go }) {
    const video = React.useRef(null), canvas = React.useRef(null), stream = React.useRef(null), raf = React.useRef(0), last = React.useRef('');
    const [rows, setRows] = React.useState([]), [on, setOn] = React.useState(false), [busy, setBusy] = React.useState(false), [err, setErr] = React.useState(''), [manual, setManual] = React.useState('');
    async function load(){ try{ const d=await CampusEntry.read(); setRows((d.events||[]).slice(0,8)); }catch(e){ toast('No se pudo sincronizar: '+e.message,'warn'); } }
    React.useEffect(()=>{ load(); return stop; },[]);
    async function save(person, method){ if(!person||!person.name)return; setBusy(true); try{ const rec=await CampusEntry.add({name:person.name,role:person.role||'Estudiante',grade:person.grade||'—',gate:'Acceso Principal',dir:'in',method:method||'QR',status:'ok',source:'scanner',meta:{raw:person.raw||''}}); setRows(r=>[rec,...r].slice(0,8)); toast('Entrada registrada: '+rec.name,'ok'); }catch(e){toast('No se pudo registrar: '+e.message,'warn')} finally{setBusy(false)} }
    function readFrame(){ const v=video.current,c=canvas.current; if(!v||!c||v.readyState<2||!window.jsQR)return''; c.width=v.videoWidth||640; c.height=v.videoHeight||480; const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(v,0,0,c.width,c.height); const img=x.getImageData(0,0,c.width,c.height); const code=window.jsQR(img.data,img.width,img.height); return code&&code.data||''; }
    function loop(){ const raw=readFrame(); if(raw&&raw!==last.current){ last.current=raw; save(parseQR(raw),'QR'); setTimeout(()=>last.current='',2500); } raf.current=requestAnimationFrame(loop); }
    async function start(){ setErr(''); try{ await loadLib(); const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false}); stream.current=s; video.current.srcObject=s; video.current.setAttribute('playsinline','true'); await video.current.play(); setOn(true); raf.current=requestAnimationFrame(loop); toast('Lector QR activo','ok'); }catch(e){ const m=e&&e.name==='NotAllowedError'?'Permiso denegado. Autoriza el uso de la cámara.':(e.message||'No se pudo abrir el lector.'); setErr(m); toast(m,'warn'); } }
    function stop(){ if(raf.current)cancelAnimationFrame(raf.current); raf.current=0; if(stream.current)stream.current.getTracks().forEach(t=>t.stop()); stream.current=null; if(video.current)video.current.srcObject=null; setOn(false); }
    function manualSave(){ const n=manual.trim(); if(!n)return toast('Escribe nombre o folio','warn'); setManual(''); save({name:n,role:'Visitante',grade:'Manual',raw:n},'Manual'); }
    return <div className="content-inner"><PageHead eyebrow="Control de Accesos" title="Scanner QR" desc="Lector con video real y registro en Supabase."><button className="btn" onClick={()=>go('historial-accesos')}><Icon name="clock" size={15} className="btn-ico"/>Historial</button></PageHead><div className="grid" style={{gridTemplateColumns:'1fr 1fr',alignItems:'start'}}><div className="card pad col center gap-16" style={{padding:32}}><div style={{position:'relative',width:'100%',maxWidth:360,aspectRatio:'1/1',borderRadius:20,background:'var(--surface-2)',border:'1px solid var(--border)',overflow:'hidden',display:'grid',placeItems:'center'}}><video ref={video} muted playsInline style={{width:'100%',height:'100%',objectFit:'cover',display:on?'block':'none'}}/>{!on&&<div className="col center gap-10"><Icon name="qr" size={92} className="faint"/><div className="faint" style={{fontSize:12.5}}>Lector apagado</div></div>}{on&&<div style={{position:'absolute',inset:42,border:'3px solid var(--accent)',borderRadius:18,boxShadow:'0 0 0 999px rgba(0,0,0,.18)'}}/>}<canvas ref={canvas} style={{display:'none'}}/></div>{err&&<div className="faint" style={{fontSize:12,color:'var(--amber)'}}>{err}</div>}<div className="row gap-8 center">{!on?<button className="btn primary" disabled={busy} onClick={start}><Icon name="scan" size={15} className="btn-ico"/>Abrir lector</button>:<button className="btn" onClick={stop}><Icon name="x" size={15} className="btn-ico"/>Cerrar lector</button>}<button className="btn" onClick={load}>Sincronizar</button></div><div className="row gap-8" style={{width:'100%'}}><TextInput value={manual} onChange={e=>setManual(e.target.value)} placeholder="Registro manual" onKeyDown={e=>e.key==='Enter'&&manualSave()}/><button className="btn" disabled={busy} onClick={manualSave}>Registrar</button></div></div><div className="card"><CardHead icon="clock" title="Registros recientes" sub="Bitácora real" right={<button className="btn sm" onClick={load}>Sincronizar</button>}/><div>{rows.map((r,i)=><div className="lrow" key={r.id||i}><Avatar name={r.name} size={32}/><div className="grow"><div style={{fontWeight:600,fontSize:13.5}}>{r.name}</div><div className="faint" style={{fontSize:12}}>{r.role} · {r.grade||'—'}</div></div><span className="font-mono faint" style={{fontSize:11.5}}>{r.time}</span><Badge tone="green">OK</Badge></div>)}{!rows.length&&<div className="lrow faint" style={{justifyContent:'center',padding:28}}>Sin registros</div>}</div></div></div></div>;
  }
  window.ScannerQR = ScannerQR;
})();
