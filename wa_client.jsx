/* wa_client.jsx — Cliente frontend para canal WA */
(function () {
  async function sendText(payload) {
    const res = await fetch('/api/wa/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'No se pudo enviar el mensaje.');
    return data;
  }
  function loadPatch() {
    if (document.querySelector('script[data-piaget-wa-patch]')) return;
    const s = document.createElement('script');
    s.type = 'text/babel';
    s.src = 'wa_patch.jsx?v=1';
    s.setAttribute('data-piaget-wa-patch', '1');
    document.body.appendChild(s);
  }
  function loadGwsLogin() {
    if (document.querySelector('script[data-piaget-gws-login-direct]')) return;
    const s = document.createElement('script');
    s.src = 'gws_login_patch.jsx?v=4';
    s.setAttribute('data-piaget-gws-login-direct', '1');
    document.head.appendChild(s);
  }
  window.PiagetWA = { sendText, loadPatch, loadGwsLogin };
  setTimeout(loadPatch, 1200);
  setTimeout(loadGwsLogin, 300);
})();
