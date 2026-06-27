(function(){
  var done=false;
  function cfg(){
    var fallback=new Promise(function(ok){setTimeout(function(){ok({configured:false,domain:'jeanpiaget.mx'});},1400);});
    var req=fetch('/api/gws').then(function(r){return r.json();}).catch(function(){return {configured:false,domain:'jeanpiaget.mx'};});
    return Promise.race([req,fallback]);
  }
  function loadLib(){
    if(window.google&&window.google.accounts&&window.google.accounts.id)return Promise.resolve();
    return new Promise(function(ok,bad){
      var old=document.querySelector('script[data-google-id-lib]');
      if(old){old.addEventListener('load',ok);return;}
      var s=document.createElement('script');
      s.src='https://accounts.google.com/gsi/client';
      s.async=true;s.defer=true;s.setAttribute('data-google-id-lib','1');
      s.onload=ok;s.onerror=bad;document.head.appendChild(s);
    });
  }
  function send(idToken){
    return fetch('/api/gws',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:idToken})})
      .then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw new Error(d.error||'No se pudo ingresar.');return d;});})
      .then(function(d){if(window.PiagetAuth&&window.PiagetAuth.setSession)window.PiagetAuth.setSession(d.account);location.reload();});
  }
  function paint(holder,data){
    data=data||{configured:false,domain:'jeanpiaget.mx'};
    var domain=data.domain||'jeanpiaget.mx';
    var label=holder.parentNode.querySelector('[data-sso-domain]');
    if(label)label.innerHTML='Dominio permitido: <b>'+domain+'</b>';
    if(!data.configured){holder.innerHTML='<button type="button" class="btn" style="width:100%;justify-content:center" disabled>Google Workspace sin configurar</button>';return;}
    loadLib().then(function(){
      holder.innerHTML='';
      window.google.accounts.id.initialize({client_id:data.clientId,hosted_domain:domain,callback:function(r){send(r.credential).catch(function(e){alert(e.message||e);});}});
      window.google.accounts.id.renderButton(holder,{theme:'outline',size:'large',type:'standard',text:'signin_with',shape:'rectangular',width:360});
    }).catch(function(){holder.innerHTML='<button type="button" class="btn" style="width:100%;justify-content:center" disabled>No se pudo cargar Google</button>';});
  }
  function mount(){
    if(done)return;
    var forms=[].slice.call(document.querySelectorAll('form'));
    var form=forms.find(function(f){return f.querySelector('input[type="password"]')||f.textContent.indexOf('Entrar')>=0;});
    if(!form)return;
    var btn=[].slice.call(form.querySelectorAll('button')).find(function(b){return String(b.textContent||'').indexOf('Entrar')>=0;})||form.querySelector('button[type="submit"]');
    var box=document.createElement('div');
    box.setAttribute('data-sso-visible','1');
    box.style.marginTop='14px';
    box.innerHTML='<div style="display:flex;align-items:center;gap:10px;margin:14px 0 12px"><div style="height:1px;background:var(--border);flex:1"></div><span style="font-size:11px;color:var(--text-faint);font-family:var(--font-mono);letter-spacing:.06em">GOOGLE WORKSPACE</span><div style="height:1px;background:var(--border);flex:1"></div></div><div data-sso-holder style="display:grid;place-items:center;min-height:44px"><button type="button" class="btn" style="width:100%;justify-content:center" disabled>Cargando Google Workspace…</button></div><div data-sso-domain style="font-size:11.5px;color:var(--text-faint);text-align:center;margin-top:8px">Dominio permitido: <b>jeanpiaget.mx</b></div>';
    if(btn&&btn.parentNode)btn.parentNode.insertBefore(box,btn.nextSibling);else form.appendChild(box);
    done=true;
    cfg().then(function(d){paint(box.querySelector('[data-sso-holder]'),d);});
  }
  new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
  setTimeout(mount,300);setTimeout(mount,900);setTimeout(mount,1800);
})();
