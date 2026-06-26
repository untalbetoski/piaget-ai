/* api/_lib/facturama.js — utilidades compartidas para funciones serverless Facturama.
   Las credenciales viven únicamente en Vercel Environment Variables. */

const BASE = {
  sandbox: process.env.FACTURAMA_SANDBOX_BASE_URL || 'https://apisandbox.facturama.mx',
  prod: process.env.FACTURAMA_PROD_BASE_URL || 'https://api.facturama.mx',
};

function baseUrl(env) { return (BASE[env === 'prod' ? 'prod' : 'sandbox'] || BASE.sandbox).replace(/\/$/, ''); }

function authHeader() {
  const u = process.env.FACTURAMA_USER || process.env.FACTURAMA_USERNAME;
  const p = process.env.FACTURAMA_PASSWORD || process.env.FACTURAMA_KEY;
  if (!u || !p) return null;
  return 'Basic ' + Buffer.from(u + ':' + p).toString('base64');
}

function configured() { return !!authHeader(); }
function apiPath(envName, fallback) { return process.env[envName] || fallback; }

async function fmFetch(env, path, { method = 'GET', body, headers = {} } = {}) {
  const auth = authHeader();
  if (!auth) {
    const e = new Error('FACTURAMA_USER y FACTURAMA_PASSWORD/FACTURAMA_KEY no están configurados en Vercel');
    e.status = 500; throw e;
  }
  const res = await fetch(baseUrl(env) + path, {
    method,
    headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw: text }; }
  if (!res.ok) {
    const msg = (data && (data.Message || data.message || data.error || data.raw)) || ('Facturama respondió ' + res.status);
    const err = new Error(String(msg));
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

function normalizeError(res, e) {
  res.status(e.status || 500).json({ error: e.message || 'Error Facturama', detail: e.data || null });
}

module.exports = { baseUrl, authHeader, configured, apiPath, fmFetch, readJson, cors, normalizeError };
