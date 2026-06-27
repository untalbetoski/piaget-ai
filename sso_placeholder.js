(function(){
  var done=false;
  function mount(){
    if(done)return;
    var forms=[].slice.call(document.querySelectorAll('form'));
    var form=forms.find(function(f){return f.querySelector('input[type="password"]')||f.textContent.indexOf('Entrar')>=0;});
    if(!form)return;
    var btn=[].slice.call(form.querySelectorAll('button')).find(function(b){return String(b.textContent||'').indexOf('Entrar')>=0;})||form.querySelector('button[type="submit"]');
    var box=document.createElement('div');
    box.setAttribute('data-sso-visible','1');
    box.style.marginTop='14px';
    box.innerHTML='<div style="display:flex;align-items:center;gap:10px;margin:14px 0 12px"><div style="height:1px;background:var(--border);flex:1"></div><span style="font-size:11px;color:var(--text-faint);font-family:var(--font-mono);letter-spacing:.06em">INGRESO INSTITUCIONAL</span><div style="height:1px;background:var(--border);flex:1"></div></div><button type="button" class="btn" style="width:100%;justify-content:center" disabled>Ingreso institucional en configuración</button><div style="font-size:11.5px;color:var(--text-faint);text-align:center;margin-top:8px">Dominio permitido: <b>jeanpiaget.mx</b></div>';
    if(btn&&btn.parentNode)btn.parentNode.insertBefore(box,btn.nextSibling);else form.appendChild(box);
    done=true;
  }
  new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
  setTimeout(mount,300);setTimeout(mount,900);setTimeout(mount,1800);
})();
