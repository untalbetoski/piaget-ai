/* sso_index_patch.js — botón institucional en index.html */
(function(){
  var cfgCache=null;
  function apiStatus(){
    if(cfgCache) return Promise.resolve(cfgCache);
    return fetch('/api/gws').then(function(r){return r.json();}).then(function(d){cfgCache=d||{};return cfgCache;}).catch(function(){return {configured:false,domain:'jeanpiaget.mx'};});
  }
  function loadProvider(){
    if(window.google&&window.google.accounts&&window.google.accounts.id) return Promise.resolve();
    return new Promise(function(ok,bad){
      var old=document.querySelector('script[data-gsi-lib]');
      if(old){old.addEventListener('load',ok);return;}
      var s=document.createElement('script');
      s.src='https://accounts.google.com/gsi/client';
      s.async=true;s.defer=true;s.setAttribute('data-gsi-lib','1');
      s.onload=ok;s.onerror=bad;document.head.appendChild(s);
    });
  }
  function postCredential(credential){
    return fetch('/api/gws',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:credential})})
      .then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw new Error(d.error||'No se pudo ingresar.');return d;});})
      .then(function(d){ if(window.PiagetAuth&&window.PiagetAuth.setSession) window.PiagetAuth.setSession(d.account); window.location.href='plataforma.html'; });
  }
  function makeBox(domain){
    var box=document.createElement('div');
    box.className='sso-box';
    box.setAttribute('data-index-sso','1');
    box.style.margin='16px 0 0';
    box.innerHTML='<div style="display:flex;align-items:center;gap:10px;margin:4px 0 12px"><span style="height:1px;background:var(--border);flex:1"></span><span style="font-size:11px;color:var(--text-faint);font-family:var(--font-mono);letter-spacing:.08em">GOOGLE WORKSPACE</span><span style="height:1px;background:var(--border);flex:1"></span></div><div class="gsi-holder" style="display:grid;place-items:center;min-height:44px"></div><div style="font-size:11.5px;color:var(--text-faint);text-align:center;margin-top:8px">Dominio permitido: <b>'+domain+'</b></div>';
    return box;
  }
  function mountOne(form,cfg){
    if(!form||form.querySelector('[data-index-sso]')) return;
    var btn=form.querySelector('button[type="submit"]');
    var box=makeBox(cfg.domain||'jeanpiaget.mx');
    if(btn&&btn.parentNode) btn.parentNode.insertBefore(box,btn.nextSibling); else form.appendChild(box);
    var holder=box.querySelector('.gsi-holder');
    if(!cfg.configured){ holder.innerHTML='<button type="button" class="btn full" style="justify-content:center" disabled>Google Workspace sin configurar</button>'; return; }
    loadProvider().then(function(){
      window.google.accounts.id.initialize({client_id:cfg.clientId,hosted_domain:cfg.domain||'jeanpiaget.mx',callback:function(resp){postCredential(resp.credential).catch(function(e){alert(e.message||e);});}});
      window.google.accounts.id.renderButton(holder,{theme:'outline',size:'large',type:'standard',text:'signin_with',shape:'rectangular',width:320});
    }).catch(function(){holder.innerHTML='<button type="button" class="btn full" style="justify-content:center" disabled>No se pudo cargar Google</button>';});
  }
  function mount(){
    apiStatus().then(function(cfg){
      document.querySelectorAll('form').forEach(function(form){
        if(form.textContent.indexOf('Entrar')>=0 || form.querySelector('input[type="email"]')) mountOne(form,cfg);
      });
    });
  }
  document.addEventListener('DOMContentLoaded',mount);
  setTimeout(mount,500);
  setTimeout(mount,1500);
})();
