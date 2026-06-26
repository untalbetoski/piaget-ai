// api/stripe-checkout.js
// Crea una sesión de Stripe Checkout sin exponer STRIPE_SECRET_KEY al navegador.

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function getOrigin(req) {
  const configured = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  if (configured) return configured.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function appendForm(params, key, value) {
  if (value === undefined || value === null || value === '') return;
  params.append(key, String(value));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!process.env.STRIPE_SECRET_KEY) return json(res, 500, { error: 'Falta STRIPE_SECRET_KEY en variables de entorno de Vercel.' });

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch (_) {
    return json(res, 400, { error: 'JSON inválido.' });
  }

  const amount = Number(body.amount || body.total || 0);
  const currency = String(body.currency || 'mxn').toLowerCase();
  const concept = String(body.concept || body.description || 'Pago Colegio Piaget').slice(0, 120);
  const family = String(body.family || body.customerName || '').slice(0, 120);
  const invoiceId = String(body.invoiceId || body.folio || body.reference || '').slice(0, 120);
  const email = String(body.email || body.customerEmail || '').trim();

  if (!Number.isFinite(amount) || amount <= 0) return json(res, 400, { error: 'Monto inválido.' });
  if (amount > 1000000) return json(res, 400, { error: 'Monto demasiado alto para una sola sesión.' });

  const origin = getOrigin(req);
  const unitAmount = Math.round(amount * 100);
  const params = new URLSearchParams();
  appendForm(params, 'mode', 'payment');
  appendForm(params, 'success_url', `${origin}/plataforma.html?stripe=success&session_id={CHECKOUT_SESSION_ID}`);
  appendForm(params, 'cancel_url', `${origin}/plataforma.html?stripe=cancel`);
  appendForm(params, 'client_reference_id', invoiceId || family || 'piaget-payment');
  appendForm(params, 'customer_email', email);
  appendForm(params, 'locale', 'es-419');
  appendForm(params, 'payment_method_types[0]', 'card');
  appendForm(params, 'line_items[0][quantity]', '1');
  appendForm(params, 'line_items[0][price_data][currency]', currency);
  appendForm(params, 'line_items[0][price_data][unit_amount]', String(unitAmount));
  appendForm(params, 'line_items[0][price_data][product_data][name]', concept);
  appendForm(params, 'line_items[0][price_data][product_data][description]', family ? `${family}${invoiceId ? ' · ' + invoiceId : ''}` : invoiceId);
  appendForm(params, 'metadata[source]', 'piaget-ai');
  appendForm(params, 'metadata[family]', family);
  appendForm(params, 'metadata[invoiceId]', invoiceId);
  appendForm(params, 'metadata[concept]', concept);

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const data = await stripeRes.json();
    if (!stripeRes.ok) return json(res, stripeRes.status, { error: data.error && data.error.message ? data.error.message : 'Stripe rechazó la solicitud.' });
    return json(res, 200, { id: data.id, url: data.url, payment_status: data.payment_status, status: data.status });
  } catch (error) {
    return json(res, 500, { error: error.message || 'No se pudo crear la sesión de Stripe.' });
  }
};
