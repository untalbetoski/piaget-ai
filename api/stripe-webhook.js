// api/stripe-webhook.js
// Webhook básico para recibir eventos de Stripe.
// Nota: sin librería stripe, esta versión registra eventos y valida presencia de firma.
// Para verificación criptográfica completa agrega STRIPE_WEBHOOK_SECRET y usa Stripe SDK en backend.

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const signature = req.headers['stripe-signature'];
  if (process.env.STRIPE_WEBHOOK_SECRET && !signature) return json(res, 400, { error: 'Falta stripe-signature.' });

  let raw = '';
  let event = null;
  try {
    raw = await readRawBody(req);
    event = JSON.parse(raw || '{}');
  } catch (_) {
    return json(res, 400, { error: 'Payload inválido.' });
  }

  const type = event.type || 'unknown';
  const object = event.data && event.data.object ? event.data.object : {};

  // Eventos principales para conciliación posterior.
  if (type === 'checkout.session.completed') {
    console.log('[PIAGET][Stripe] Pago completado', {
      session: object.id,
      amount_total: object.amount_total,
      currency: object.currency,
      payment_status: object.payment_status,
      metadata: object.metadata,
    });
  } else if (type === 'checkout.session.expired' || type === 'checkout.session.async_payment_failed') {
    console.log('[PIAGET][Stripe] Sesión no pagada', { type, session: object.id, metadata: object.metadata });
  } else {
    console.log('[PIAGET][Stripe] Evento recibido', { type, id: event.id });
  }

  return json(res, 200, { received: true, type });
};
