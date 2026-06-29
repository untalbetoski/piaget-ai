/* credential_piaget_text_patch.jsx — Ajuste de textos de credencial PIAGET */
(function(){
  const BRAND='PIAGET';
  const RX_COLEGIO=/^COLEGIO\s+(JEAN\s+)?PIAGET$/i;
  const RX_PIAGET=/^(JEAN\s+)?PIAGET$/i;
  function fixTextValue(value){
    const raw=String(value||'');
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
          if(parent && parent.closest && (parent.closest('.jp-card')||parent.closest('.p')||parent.closest('.c'))) parent.remove();
          else t.nodeValue='';
          return;
        }
        if(parent && parent.closest && (parent.closest('.jp-card')||parent.closest('.p')||parent.closest('.c')||parent.closest('.th')||parent.closest('.t'))){
          const next=fixTextValue(t.nodeValue);
          if(next!==t.nodeValue) t.nodeValue=next;
        }
      });
      base.querySelectorAll && base.querySelectorAll('.jp-card img,.ph img').forEach(img=>{img.style.objectPosition='center center';});
    }catch(e){}
  }
  function patchFrame(frame){
    try{
      const doc=frame.contentDocument||frame.contentWindow&&frame.contentWindow.document;
      if(doc) fixRoot(doc);
      frame.addEventListener('load',()=>setTimeout(()=>fixRoot(frame.contentDocument||frame.contentWindow.document),30),{once:false});
    }catch(e){}
  }
  function installDomPatch(){
    fixRoot(document);
    const mo=new MutationObserver(records=>{
      fixRoot(document);
      records.forEach(r=>Array.from(r.addedNodes||[]).forEach(node=>{
        if(node && node.tagName==='IFRAME') patchFrame(node);
        if(node && node.querySelectorAll) node.querySelectorAll('iframe').forEach(patchFrame);
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
        Object.defineProperty(window,'jspdf',{configurable:true,get(){return current;},set(v){current=v; setTimeout(patchJsPdf,0);}});
      }
    }catch(e){}
    patchJsPdf();
    let tries=0;
    const timer=setInterval(()=>{patchJsPdf(); if(++tries>120) clearInterval(timer);},250);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installDomPatch); else installDomPatch();
  installJsPdfWatcher();
})();
