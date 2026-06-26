/* stripe_client.jsx — Cliente frontend para Stripe Checkout */
(function () {
  async function createCheckout(payload) {
    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'No se pudo crear el link de pago.');
    return data;
  }

  async function openCheckout(payload) {
    const data = await createCheckout(payload);
    if (!data.url) throw new Error('Stripe no devolvió URL de Checkout.');
    window.location.href = data.url;
    return data;
  }

  function statusFromUrl() {
    const qs = new URLSearchParams(window.location.search || '');
    const state = qs.get('stripe');
    const sessionId = qs.get('session_id');
    if (state === 'success') {
      setTimeout(() => toast('Pago iniciado/completado en Stripe. La conciliación se confirma por webhook.', 'ok'), 600);
      try { window.history.replaceState({}, '', window.location.pathname + window.location.hash); } catch (_) {}
      return { state, sessionId };
    }
    if (state === 'cancel') {
      setTimeout(() => toast('Pago cancelado por el usuario.', 'warn'), 600);
      try { window.history.replaceState({}, '', window.location.pathname + window.location.hash); } catch (_) {}
      return { state };
    }
    return null;
  }

  function loadCobrosPatch() {
    if (document.querySelector('script[data-piaget-stripe-cobros]')) return;
    const s = document.createElement('script');
    s.type = 'text/babel';
    s.src = 'stripe_cobros_patch.jsx?v=1';
    s.setAttribute('data-piaget-stripe-cobros', '1');
    document.body.appendChild(s);
  }

  window.PiagetStripe = { createCheckout, openCheckout, statusFromUrl, loadCobrosPatch };
  setTimeout(statusFromUrl, 800);
  setTimeout(loadCobrosPatch, 1500);
})();
