/* api/_lib/facturama.js — utilidades compartidas para las funciones serverless.
   Las carpetas/archivos con prefijo "_" no son rutas en Vercel. */

const BASE = {
  sandbox: 'https://apisandbox.facturama.mx',
  prod: 'https://api.facturama.mx',
};

function baseUrl(env) { return BASE[env === 'prod' ? 'prod' : 'sandbox']; }

function authHeader() {
  const u = process.env.FACTURAMA_USER;
  const p = process.env.FACTURAMA_PASSWORD;
  if (!u || !p) return null;
  return 'Basic ' + Buffer.from(u + ':' + p).toString('base64');
}

async function fmFetch(env, path, { method = 'GET', body } = {}) {
  const auth = authHeader();
  if (!auth) {
    const e = new Error('FACTURAMA_USER / FACTURAMA_PASSWORD no están configurados en el entorno');
    e.status = 500; throw e;
  }
  const res = await fetch(baseUrl(env) + path, {
    method,
    headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error((data && (data.Message || data.message || data.error)) || ('Facturama respondió ' + res.status));
    err.status = res.status; err.data = data; throw err;
  }
  return data;
}

function readJson(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', (c) => { b += c; });
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = { baseUrl, authHeader, fmFetch, readJson, cors };
