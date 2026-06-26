// api/stripe-webhook.js
// Recibe webhooks de Stripe y valida firma HMAC con STRIPE_WEBHOOK_SECRET.

const crypto = require('crypto');

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

function parseStripeSignature(header) {
  return String(header || '').split(',').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const key = part.slice(0, idx);
      const value = part.slice(idx + 1);
      if (!acc[key]) acc[key] = [];
      acc[key].push(value);
    }
    return acc;
  }, {});
}

function safeEqualHex(a, b) {
  if (!a || !b) return false;
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function verifyStripeSignature(raw, signatureHeader, secret) {
  if (!secret) return { ok: true, skipped: true };
  const parsed = parseStripeSignature(signatureHeader);
  const timestamp = parsed.t && parsed.t[0];
  const signatures = parsed.v1 || [];
  if (!timestamp || signatures.length === 0) return { ok: false, reason: 'Firma incompleta.' };

  const tolerance = 5 * 60;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > tolerance) return { ok: false, reason: 'Timestamp fuera de tolerancia.' };

  const signedPayload = `${timestamp}.${raw}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  const ok = signatures.some(sig => safeEqualHex(expected, sig));
  return ok ? { ok: true } : { ok: false, reason: 'Firma inválida.' };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const signature = req.headers['stripe-signature'];
  let raw = '';
  let event = null;

  try {
    raw = await readRawBody(req);
    const verified = verifyStripeSignature(raw, signature, process.env.STRIPE_WEBHOOK_SECRET);
    if (!verified.ok) return json(res, 400, { error: verified.reason || 'Webhook no verificado.' });
    event = JSON.parse(raw || '{}');
  } catch (error) {
    return json(res, 400, { error: error.message || 'Payload inválido.' });
  }

  const type = event.type || 'unknown';
  const object = event.data && event.data.object ? event.data.object : {};

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
