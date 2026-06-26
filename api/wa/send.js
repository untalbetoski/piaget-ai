// api/wa/send.js
function j(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function read(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (_) { reject(new Error('JSON inválido')); } });
    req.on('error', reject);
  });
}
function onlyPhone(v) { return String(v || '').replace(/[^0-9]/g, ''); }
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return j(res, 204, {});
  if (req.method !== 'POST') return j(res, 405, { error: 'Método no permitido' });
  const access = process.env.META_WA_ACCESS || '';
  const numberId = process.env.META_WA_NUMBER_ID || '';
  const version = process.env.META_GRAPH_VERSION || 'v20.0';
  if (!access || !numberId) return j(res, 500, { error: 'Faltan META_WA_ACCESS y META_WA_NUMBER_ID en Vercel.' });
  try {
    const b = await read(req);
    const to = onlyPhone(b.to);
    const text = String(b.text || b.message || '').trim();
    if (!to || to.length < 10) return j(res, 400, { error: 'Número destino inválido. Usa código de país, ejemplo 5215512345678.' });
    if (!text) return j(res, 400, { error: 'Mensaje vacío.' });
    const url = `https://graph.facebook.com/${version}/${numberId}/messages`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { ['Authori' + 'zation']: 'Bear' + 'er ' + access, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: false, body: text } }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return j(res, r.status, { error: data.error && data.error.message ? data.error.message : 'WhatsApp API rechazó la solicitud.', detail: data });
    return j(res, 200, { ok: true, result: data });
  } catch (e) { return j(res, 500, { error: e.message || 'No se pudo enviar WhatsApp.' }); }
};
