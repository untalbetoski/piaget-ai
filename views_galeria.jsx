/* views_galeria.jsx — Galería de Comunicación */
(function () {
  const WRITERS = ['dirección','direccion','coordinación','coordinacion','docentes','docente'];
  const token = () => ((window.PiagetAuth && window.PiagetAuth.getSession && window.PiagetAuth.getSession()) || {}).session_token || '';
  const role = () => String(((window.PiagetAuth && window.PiagetAuth.getSession && window.PiagetAuth.getSession()) || {}).role || '').toLowerCase();
  const canWrite = () => WRITERS.includes(role());
  async function sb() {
    if (window.PiagetSettings && window.PiagetSettings.client) return window.PiagetSettings.client();
    if (window.PIAGET_SB) return window.PIAGET_SB;
    throw new Error('Cliente Supabase no disponible');
  }
  async function rpc(fn, args) {
    const c = await sb();
    const { data, error } = await c.rpc(fn, args || {});
    if (error) throw new Error(error.message || 'Error de galería');
    return data;
  }
  function StatCard({ label, value, icon, tone }) {
    const t = (window.TONE && window.TONE[tone]) || { bg:'var(--surface-2)', c:'var(--accent)' };
    return <div className="card pad"><div className="row center gap-12"><div className="kpi-ico" style={{ background:t.bg, color:t.c, marginBottom:0 }}><Icon name={icon} size={19}/></div><div><div className="faint" style={{ fontSize:12 }}>{label}</div><div className="font-display" style={{ fontSize:26, fontWeight:800, lineHeight:1 }}>{value}</div></div></div></div>;
  }
  function imageFile(file) {
    return new Promise((ok, bad) => {
      const rd = new FileReader();
      rd.onerror = () => bad(new Error('No se pudo leer la foto'));
      rd.onload = () => {
        const raw = rd.result, img = new Image();
        img.onload = () => {
          const max = 1000, sc = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.round(img.width * sc), h = Math.round(img.height * sc);
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          try { ok(c.toDataURL('image/jpeg', .78)); } catch (_) { ok(raw); }
        };
        img.onerror = () => bad(new Error('La foto no es válida'));
        img.src = raw;
      };
      rd.readAsDataURL(file);
    });
  }
  function AlbumModal({ album, onClose, onSave }) {
    const [f, setF] = React.useState(album || { title:'', description:'', audience:'Toda la comunidad', level:'Todos', status:'publicado' });
    const u = (k,v) => setF(x => ({ ...x, [k]:v }));
    return <Modal open width={540} onClose={onClose} title={album && album.id ? 'Editar galería' : 'Nueva galería'}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={() => onSave(f)}>Guardar</button></>}>
      <Field label="Título"><TextInput value={f.title||''} onChange={e=>u('title',e.target.value)} autoFocus /></Field>
      <Field label="Descripción"><TextArea rows={3} value={f.description||''} onChange={e=>u('description',e.target.value)} /></Field>
      <div className="field-row">
        <Field label="Audiencia"><SelectInput value={f.audience||'Toda la comunidad'} onChange={e=>u('audience',e.target.value)} options={['Toda la comunidad','Familias','Estudiantes','Docentes']} /></Field>
        <Field label="Nivel"><SelectInput value={f.level||'Todos'} onChange={e=>u('level',e.target.value)} options={['Todos','Preescolar','Primaria','Secundaria','Preparatoria']} /></Field>
      </div>
    </Modal>;
  }
  function GaleriaComunicacion() {
    const [albums,setAlbums] = React.useState([]), [loading,setLoading] = React.useState(true), [edit,setEdit] = React.useState(null), [view,setView] = React.useState(null), [busy,setBusy] = React.useState(false);
    const writer = canWrite();
    async function load() {
      setLoading(true);
      try { const d = await rpc('piaget_gallery_read', { p_token: token() }); setAlbums(Array.isArray(d) ? d : []); }
      catch(e) { toast('No se pudo cargar galería: ' + (e.message||e), 'warn'); }
      finally { setLoading(false); }
    }
    React.useEffect(() => { load(); }, []);
    async function saveAlbum(a) {
      if (!String(a.title||'').trim()) return toast('Escribe un título', 'warn');
      setBusy(true);
      try { await rpc('piaget_gallery_save_album', { p_token: token(), p_album: a }); toast('Galería guardada ✓'); setEdit(null); await load(); }
      catch(e) { toast(e.message||'No se pudo guardar', 'warn'); }
      finally { setBusy(false); }
    }
    async function delAlbum(a) {
      if (!confirm('¿Eliminar esta galería y sus fotos?')) return;
      try { await rpc('piaget_gallery_delete_album', { p_token: token(), p_album_id: a.id }); toast('Galería eliminada', 'warn'); await load(); }
      catch(e) { toast(e.message||'No se pudo eliminar', 'warn'); }
    }
    async function upload(a, ev) {
      const files = Array.from(ev.target.files||[]); ev.target.value=''; if (!files.length) return;
      setBusy(true);
      try {
        let n = 0;
        for (const file of files) {
          if (!/^image\//.test(file.type)) continue;
          const img = await imageFile(file);
          await rpc('piaget_gallery_add_photo', { p_token: token(), p_album_id: a.id, p_photo: { image: img, caption: '', sortOrder: (a.photos||[]).length + n } });
          n++;
        }
        toast(n + ' foto(s) subida(s) ✓'); await load();
      } catch(e) { toast(e.message||'No se pudieron subir fotos', 'warn'); }
      finally { setBusy(false); }
    }
    async function delPhoto(p) {
      if (!confirm('¿Eliminar esta foto?')) return;
      try { await rpc('piaget_gallery_delete_photo', { p_token: token(), p_photo_id: p.id }); toast('Foto eliminada', 'warn'); await load(); }
      catch(e) { toast(e.message||'No se pudo eliminar', 'warn'); }
    }
    const total = albums.reduce((s,a)=>s+((a.photos||[]).length),0);
    return <div className="content-inner">
      <PageHead eyebrow="Comunicación" title="Galería" desc="Álbumes fotográficos para familias y estudiantes.">
        <button className="btn" onClick={load}><Icon name="refresh" size={15} className="btn-ico"/>Actualizar</button>
        {writer && <button className="btn primary" onClick={()=>setEdit({})}><Icon name="plus" size={15} className="btn-ico"/>Nueva galería</button>}
      </PageHead>
      <div className="grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        <StatCard label="Galerías" value={albums.length} icon="image" tone="violet" />
        <StatCard label="Fotos" value={total} icon="image" tone="blue" />
        <StatCard label="Permiso" value={writer?'Editor':'Lectura'} icon="shield" tone={writer?'green':'gray'} />
      </div>
      {!writer && <div className="card pad mt-16 faint">Familias y estudiantes solo pueden ver galerías. Crear, editar y eliminar es para Dirección, Coordinación y Docentes.</div>}
      <div className="grid mt-16" style={{gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))',alignItems:'start'}}>
        {loading && <div className="card pad faint">Cargando…</div>}
        {!loading && !albums.length && <div className="card pad faint">Aún no hay galerías.</div>}
        {albums.map(a => {
          const ps = a.photos || [], cover = ps[0], inp = 'gal-'+a.id;
          return <div className="card" key={a.id} style={{overflow:'hidden'}}>
            <div style={{aspectRatio:'16/9',background:'var(--surface-2)',display:'grid',placeItems:'center',overflow:'hidden',borderBottom:'1px solid var(--border)'}}>
              {cover ? <img src={cover.image} onClick={()=>setView({a,p:cover})} style={{width:'100%',height:'100%',objectFit:'cover',cursor:'zoom-in'}}/> : <Icon name="image" size={30} className="faint"/>}
            </div>
            <div className="pad col gap-12">
              <div className="row between" style={{alignItems:'flex-start',gap:10}}>
                <div><div className="row gap-6 wrap"><Badge tone="blue">{a.level||'Todos'}</Badge><Badge tone="green" dot>Publicado</Badge></div><div style={{fontWeight:800,fontSize:17,marginTop:6}}>{a.title}</div>{a.description&&<div className="faint" style={{fontSize:13,marginTop:4}}>{a.description}</div>}<div className="faint font-mono" style={{fontSize:11.5,marginTop:6}}>{ps.length} foto(s) · {a.audience}</div></div>
                {writer && <RowMenu items={[{icon:'edit',label:'Editar',onClick:()=>setEdit(a)},{icon:'trash',label:'Eliminar',danger:true,onClick:()=>delAlbum(a)}]} />}
              </div>
              <div className="grid" style={{gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{ps.slice(0,8).map(p=><div key={p.id} style={{aspectRatio:'1',borderRadius:10,overflow:'hidden',background:'var(--surface-2)',position:'relative'}}><img src={p.image} onClick={()=>setView({a,p})} style={{width:'100%',height:'100%',objectFit:'cover',cursor:'zoom-in'}}/>{writer&&<button className="icon-btn" title="Eliminar" onClick={()=>delPhoto(p)} style={{position:'absolute',top:4,right:4,width:24,height:24,background:'rgba(255,255,255,.88)'}}><Icon name="trash" size={12}/></button>}</div>)}</div>
              {writer && <div><input id={inp} type="file" accept="image/*" multiple style={{display:'none'}} onChange={e=>upload(a,e)}/><button className="btn sm" disabled={busy} onClick={()=>document.getElementById(inp).click()}><Icon name="upload" size={13} className="btn-ico"/>Subir fotos</button></div>}
            </div>
          </div>;
        })}
      </div>
      {edit && <AlbumModal album={edit.id?edit:null} onClose={()=>setEdit(null)} onSave={saveAlbum}/>} 
      {view && <Modal open width={860} onClose={()=>setView(null)} title={view.a.title} footer={<button className="btn primary" onClick={()=>setView(null)}>Cerrar</button>}><img src={view.p.image} style={{width:'100%',maxHeight:'70vh',objectFit:'contain',borderRadius:'var(--r)',background:'var(--surface-2)'}}/>{view.p.caption&&<p className="faint">{view.p.caption}</p>}</Modal>}
    </div>;
  }
  window.GaleriaComunicacion = GaleriaComunicacion;
})();
