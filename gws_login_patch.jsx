/* gws_login_patch.jsx — botón Google Workspace en pantalla de acceso */
(function () {
  let mounted = false;
  let config = null;
  async function status() {
    if (config) return config;
    try { const r = await fetch('/api/gws'); config = await r.json(); return config; }
    catch (_) { config = { configured:false, domain:'jeanpiaget.mx' }; return config; }
  }
  function loadGoogle() {
    if (window.google && window.google.accounts && window.google.accounts.id) return Promise.resolve();
    return new Promise((ok, bad) => {
      const old = document.querySelector('script[data-gws-gsi]');
      if (old) { old.addEventListener('load', ok); return; }
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true; s.defer = true; s.setAttribute('data-gws-gsi','1');
      s.onload = ok; s.onerror = bad; document.head.appendChild(s);
    });
  }
  async function sendGoogle(credential) {
    const r = await fetch('/api/gws', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ credential }) });
    const d = await r.json().catch(()=>({}));
    if (!r.ok || !d.ok) throw new Error(d.error || 'No se pudo ingresar con Google Workspace.');
    if (window.PiagetAuth && window.PiagetAuth.setSession) window.PiagetAuth.setSession(d.account);
    try { sessionStorage.removeItem('piaget_login'); } catch (_) {}
    location.reload();
  }
  async function mount() {
    if (mounted) return;
    const form = document.querySelector('form');
    if (!form || !form.textContent.includes('Iniciar sesión')) return;
    mounted = true;
    const cfg = await status();
    const mainBtn = Array.from(form.querySelectorAll('button')).find(b => String(b.textContent||'').includes('Entrar a la plataforma'));
    const box = document.createElement('div');
    box.setAttribute('data-gws-login','1');
    box.style.marginTop = '14px';
    box.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin:14px 0 12px"><div style="height:1px;background:var(--border);flex:1"></div><span style="font-size:11px;color:var(--text-faint);font-family:var(--font-mono);letter-spacing:.06em">GOOGLE WORKSPACE</span><div style="height:1px;background:var(--border);flex:1"></div></div><div id="gws_btn" style="display:grid;place-items:center;min-height:44px"></div><div style="font-size:11.5px;color:var(--text-faint);text-align:center;margin-top:8px">Dominio permitido: <b>'+ (cfg.domain || 'jeanpiaget.mx') +'</b></div>';
    if (mainBtn && mainBtn.parentElement) mainBtn.parentElement.insertBefore(box, mainBtn.nextSibling); else form.appendChild(box);
    if (!cfg.configured) {
      const holder = box.querySelector('#gws_btn');
      holder.innerHTML = '<button type="button" class="btn" style="width:100%;justify-content:center" disabled>Google Workspace sin configurar</button>';
      return;
    }
    try {
      await loadGoogle();
      window.google.accounts.id.initialize({ client_id: cfg.clientId, hosted_domain: cfg.domain || 'jeanpiaget.mx', callback: async (resp) => { try { await sendGoogle(resp.credential); } catch(e) { alert(e.message || e); } } });
      window.google.accounts.id.renderButton(box.querySelector('#gws_btn'), { theme:'outline', size:'large', type:'standard', text:'signin_with', shape:'rectangular', width:360 });
    } catch (e) {
      box.querySelector('#gws_btn').innerHTML = '<button type="button" class="btn" style="width:100%;justify-content:center" disabled>No se pudo cargar Google</button>';
    }
  }
  const obs = new MutationObserver(() => mount());
  obs.observe(document.documentElement, { childList:true, subtree:true });
  setTimeout(mount, 500);
})();
