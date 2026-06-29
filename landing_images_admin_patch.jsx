/* PIAGET credential text patch — se ejecuta después de config_admin_roles_patch.jsx */
(function(){
  const BRAND='PIAGET';
  const CYCLE='Ciclo 2026–2027';
  const SCHOOL_CYCLE='Ciclo escolar 2026–2027';
  const VALIDITY='Ciclo escolar 2026–2027 · vence 31 ago 2027';
  const RX_COLEGIO=/^COLEGIO\s+(JEAN\s+)?PIAGET$/i;
  const RX_PIAGET=/^(JEAN\s+)?PIAGET$/i;
  function fixCycleText(raw){
    return String(raw||'')
      .replace(/Ciclo escolar\s+2025[–-]2026\s+·\s+vence\s+31\s+ago\s+2026/gi,VALIDITY)
      .replace(/Ciclo escolar\s+2025[–-]2026/gi,SCHOOL_CYCLE)
      .replace(/Ciclo\s+2025[–-]2026/gi,CYCLE)
      .replace(/31\s+ago\s+2026/gi,'31 ago 2027');
  }
  function fixTextValue(value){
    let raw=fixCycleText(value);
    const t=raw.trim();
    if(!t) return raw;
    if(t==='EDUCACIÓN INTEGRAL') return '';
    if(RX_COLEGIO.test(t)) return raw.replace(/COLEGIO\s+(JEAN\s+)?PIAGET/i,BRAND);
    if(RX_PIAGET.test(t)) return raw.replace(/(JEAN\s+)?PIAGET/i,BRAND).toUpperCase();
    return raw;
  }
  function fixRoot(root){
    try{
      const doc=root.nodeType===9?root:(root.ownerDocument||document);
      const base=doc.body||root;
      if(!base) return;
      const walker=doc.createTreeWalker(base,NodeFilter.SHOW_TEXT);
      const nodes=[]; let n;
      while((n=walker.nextNode())) nodes.push(n);
      nodes.forEach(t=>{
        const parent=t.parentElement;
        const trim=String(t.nodeValue||'').trim();
        if(trim==='EDUCACIÓN INTEGRAL'){
          if(parent&&parent.closest&&(parent.closest('.jp-card')||parent.closest('.p')||parent.closest('.c'))) parent.remove();
          else t.nodeValue='';
          return;
        }
        if(parent&&parent.closest&&(parent.closest('.jp-card')||parent.closest('.p')||parent.closest('.c')||parent.closest('.th')||parent.closest('.t'))){
          const next=fixTextValue(t.nodeValue);
          if(next!==t.nodeValue) t.nodeValue=next;
        }
      });
      base.querySelectorAll&&base.querySelectorAll('.jp-card img,.ph img').forEach(img=>{img.style.objectPosition='center center';});
    }catch(e){}
  }
  function patchFrame(frame){
    try{
      const doc=frame.contentDocument||(frame.contentWindow&&frame.contentWindow.document);
      if(doc) fixRoot(doc);
      frame.addEventListener('load',()=>setTimeout(()=>fixRoot(frame.contentDocument||frame.contentWindow.document),30),{once:false});
    }catch(e){}
  }
  function installDomPatch(){
    fixRoot(document);
    const mo=new MutationObserver(records=>{
      fixRoot(document);
      records.forEach(r=>Array.from(r.addedNodes||[]).forEach(node=>{
        if(node&&node.tagName==='IFRAME') patchFrame(node);
        if(node&&node.querySelectorAll) node.querySelectorAll('iframe').forEach(patchFrame);
      }));
    });
    mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    document.querySelectorAll('iframe').forEach(patchFrame);
  }
  function patchPdfApi(api){
    if(!api||!api.text||api.__piagetTextPatched) return;
    const orig=api.text;
    api.text=function(txt){
      if(typeof txt==='string'){
        const fixed=fixTextValue(txt);
        if(fixed==='') return this;
        txt=fixed;
      }else if(Array.isArray(txt)){
        txt=txt.map(x=>typeof x==='string'?fixTextValue(x):x).filter(x=>x!=='');
      }
      arguments[0]=txt;
      return orig.apply(this,arguments);
    };
    api.__piagetTextPatched=true;
  }
  function patchJsPdf(){
    try{
      const ctor=window.jspdf&&window.jspdf.jsPDF;
      if(!ctor) return;
      patchPdfApi(ctor.API);
      patchPdfApi(ctor.prototype);
    }catch(e){}
  }
  function installJsPdfWatcher(){
    try{
      if(!window.jspdf){
        let current;
        Object.defineProperty(window,'jspdf',{configurable:true,get(){return current;},set(v){current=v;setTimeout(patchJsPdf,0);}});
      }
    }catch(e){}
    patchJsPdf();
    let tries=0;
    const timer=setInterval(()=>{patchJsPdf();if(++tries>120)clearInterval(timer);},250);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installDomPatch); else installDomPatch();
  installJsPdfWatcher();
})();

/* landing_images_admin_patch.jsx — control administrativo de imágenes del landing */
(function () {
  const PrevCfgBranding = window.CfgBranding;
  const DEFAULTS = {
    hero: '',
    heroLabel: 'Campus Piaget',
    filosofia: '',
    filosofiaLabel: 'Vida académica'
  };

  function resizeImage(file, maxSide = 1600) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
      reader.onload = () => {
        const raw = reader.result;
        if (file.type === 'image/svg+xml') return resolve(raw);
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          let out = raw;
          try { out = c.toDataURL('image/jpeg', 0.84); } catch (_) { out = raw; }
          resolve(out);
        };
        img.onerror = () => resolve(raw);
        img.src = raw;
      };
      reader.readAsDataURL(file);
    });
  }

  function LandingImageField({ title, desc, value, label, onChange, onLabel }) {
    const ref = React.useRef(null);
    async function pick(e) {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      if (!/^image\//.test(file.type)) return toast('Selecciona una imagen válida', 'warn');
      if (file.size > 8 * 1024 * 1024) return toast('La imagen supera 8 MB; usa una más ligera', 'warn');
      try {
        const data = await resizeImage(file);
        onChange(data);
        toast(title + ' actualizada ✓');
      } catch (err) {
        toast(err.message || 'No se pudo procesar la imagen', 'warn');
      }
    }
    return (
      <div className="card pad" style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:18, alignItems:'center' }}>
        <div onClick={() => ref.current && ref.current.click()} title="Subir imagen" style={{ cursor:'pointer', aspectRatio:'4 / 3', border:'1px solid var(--border)', borderRadius:'var(--r)', background:value ? '#fff' : 'var(--surface-2)', overflow:'hidden', display:'grid', placeItems:'center', boxShadow:'var(--shadow-xs)' }}>
          <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={pick} style={{ display:'none' }} />
          {value ? <img src={value} alt={title} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div className="col center gap-6 faint"><Icon name="image" size={24}/><span style={{ fontSize:12 }}>Subir imagen</span></div>}
        </div>
        <div className="col gap-12">
          <div>
            <div className="card-title" style={{ marginBottom:4 }}><Icon name="image" className="ico" size={17}/>{title}</div>
            <div className="faint" style={{ fontSize:12.5 }}>{desc}</div>
          </div>
          <Field label="URL o imagen cargada">
            <TextInput value={value || ''} onChange={e => onChange(e.target.value)} placeholder="https://... o sube una imagen" />
          </Field>
          <Field label="Etiqueta visible sobre la imagen">
            <TextInput value={label || ''} onChange={e => onLabel(e.target.value)} placeholder="Ej. Campus Piaget" />
          </Field>
          <div className="row gap-8 wrap">
            <button type="button" className="btn sm" onClick={() => ref.current && ref.current.click()}><Icon name="upload" size={13} className="btn-ico"/>Subir</button>
            <button type="button" className="btn sm" onClick={() => { onChange(''); toast(title + ' eliminada', 'warn'); }}><Icon name="trash" size={13} className="btn-ico"/>Quitar</button>
            {value && <a className="btn sm" href={value} target="_blank" rel="noopener"><Icon name="eye" size={13} className="btn-ico"/>Ver</a>}
          </div>
        </div>
      </div>
    );
  }

  function LandingImagesAdmin({ cfg, set }) {
    const imgs = { ...DEFAULTS, ...(cfg.landingImages || {}) };
    const upd = (k, v) => set('landingImages', { ...imgs, [k]: v });
    return (
      <div className="card" style={{ marginTop:16 }}>
        <CardHead icon="image" title="Imágenes del landing page" sub="Controla las fotos visibles en https://www.soypiaget.app/" />
        <div className="col gap-14" style={{ padding:16 }}>
          <div className="ai-panel" style={{ margin:0 }}>
            <div className="insight" style={{ borderTop:'none', alignItems:'flex-start' }}>
              <div className="insight-ico" style={{ background:'var(--accent-soft)', color:'var(--accent)' }}><Icon name="globe" size={16}/></div>
              <div className="insight-body">
                <div className="insight-title">Publicación en el landing</div>
                <div className="insight-text">Sube una imagen o pega una URL. Después presiona <b>Guardar cambios</b>. El landing público leerá estos valores desde Supabase.</div>
              </div>
            </div>
          </div>
          <LandingImageField title="Imagen principal" desc="Aparece en el hero superior, junto al título EVOLUCIÓN." value={imgs.hero} label={imgs.heroLabel} onChange={v => upd('hero', v)} onLabel={v => upd('heroLabel', v)} />
          <LandingImageField title="Imagen de filosofía" desc="Aparece en la sección Nuestra filosofía." value={imgs.filosofia} label={imgs.filosofiaLabel} onChange={v => upd('filosofia', v)} onLabel={v => upd('filosofiaLabel', v)} />
        </div>
      </div>
    );
  }

  window.CfgBranding = function CfgBrandingWithLanding(props) {
    return (
      <React.Fragment>
        {PrevCfgBranding ? <PrevCfgBranding {...props} /> : null}
        <LandingImagesAdmin {...props} />
      </React.Fragment>
    );
  };
})();
