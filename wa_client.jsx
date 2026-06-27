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
  function addScript(src, marker) {
    if (document.querySelector('script[' + marker + ']')) return;
    const s = document.createElement('script');
    s.src = src;
    s.setAttribute(marker, '1');
    document.head.appendChild(s);
  }
  function loadGwsLogin() {
    addScript('gws_login_patch.jsx?v=4', 'data-piaget-gws-login-direct');
    addScript('sso_placeholder.js?v=1', 'data-piaget-sso-placeholder');
  }
  window.PiagetWA = { sendText, loadPatch, loadGwsLogin };
  setTimeout(loadPatch, 1200);
  setTimeout(loadGwsLogin, 300);
})();
