// api/facturama/_client.js
// Helper compartido para funciones Facturama en Vercel.

const SANDBOX_BASE = 'https://apisandbox.facturama.mx';
const PROD_BASE = 'https://api.facturama.mx';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch (e) { reject(new Error('JSON inválido.')); }
    });
    req.on('error', reject);
  });
}

function envBase(env) {
  const isProd = env === 'prod' || env === 'production';
  const custom = isProd ? process.env.FACTURAMA_PROD_BASE_URL : process.env.FACTURAMA_SANDBOX_BASE_URL;
  return (custom || (isProd ? PROD_BASE : SANDBOX_BASE)).replace(/\/$/, '');
}

function credentials() {
  const user = process.env.FACTURAMA_USER || process.env.FACTURAMA_USERNAME || '';
  const pass = process.env.FACTURAMA_PASSWORD || process.env.FACTURAMA_KEY || '';
  return { user, pass, configured: !!(user && pass) };
}

function authHeader() {
  const { user, pass } = credentials();
  return 'Basic ' + Buffer.from(user + ':' + pass).toString('base64');
}

function path(name, fallback) {
  return process.env[name] || fallback;
}

async function facturamaFetch(env, apiPath, options = {}) {
  const base = envBase(env);
  const url = base + apiPath;
  const headers = {
    Authorization: authHeader(),
    Accept: 'application/json',
    ...(options.headers || {}),
  };
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const response = await fetch(url, { ...options, headers });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; }
  catch (_) { data = { raw: text }; }
  if (!response.ok) {
    const msg = data && (data.Message || data.message || data.error || data.raw) || ('Facturama HTTP ' + response.status);
    const err = new Error(msg);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

function mapCfdiPayload(input) {
  const subtotal = Number(input.concepto && input.concepto.unitPrice || 0);
  const ivaRate = Number(input.iva || 0);
  const taxAmount = Math.round(subtotal * ivaRate * 100) / 100;
  const hasIva = ivaRate > 0;
  const isEdu = input.receptor && input.receptor.usoCFDI === 'D10';
  const item = {
    ProductCode: isEdu ? '86121500' : '84111506',
    IdentificationNumber: String(input.folio || Date.now()),
    Description: (input.concepto && input.concepto.description) || 'Pago de servicios educativos',
    Unit: 'Servicio',
    UnitCode: 'E48',
    UnitPrice: subtotal,
    Quantity: 1,
    Subtotal: subtotal,
    TaxObject: hasIva ? '02' : '01',
    Total: subtotal + (hasIva ? taxAmount : 0),
  };
  if (hasIva) {
    item.Taxes = [{
      Total: taxAmount,
      Name: 'IVA',
      Base: subtotal,
      Rate: ivaRate,
      IsRetention: false,
    }];
  }
  if (isEdu && input.alumno) {
    item.Complement = {
      EducationalInstitution: {
        StudentsName: input.alumno.name,
        CURP: input.alumno.curp,
        EducationLevel: input.alumno.nivelEdu,
        AutRVOE: input.alumno.cct,
        PaymentRfc: input.alumno.rfcPago || (input.receptor && input.receptor.rfc),
      }
    };
  }
  return {
    Serie: input.serie || 'A',
    Folio: input.folio || undefined,
    CfdiType: 'I',
    ExpeditionPlace: input.emisor && input.emisor.cp,
    PaymentForm: input.formaPago || '03',
    PaymentMethod: input.metodoPago || 'PUE',
    Currency: 'MXN',
    Exportation: '01',
    Receiver: {
      Rfc: input.receptor && input.receptor.rfc,
      Name: input.receptor && input.receptor.name,
      CfdiUse: input.receptor && input.receptor.usoCFDI || 'G03',
      FiscalRegime: input.receptor && input.receptor.regimen,
      TaxZipCode: input.receptor && input.receptor.cp,
    },
    Items: [item],
  };
}

function normalizeCfdiResponse(data) {
  return {
    ok: true,
    facturamaId: data.Id || data.id || data.facturamaId || '',
    uuid: data.Complement && data.Complement.TaxStamp && data.Complement.TaxStamp.Uuid || data.Uuid || data.uuid || '',
    fechaTimbrado: data.Complement && data.Complement.TaxStamp && data.Complement.TaxStamp.Date || data.Date || data.FechaTimbrado || '',
    noCertSAT: data.Complement && data.Complement.TaxStamp && data.Complement.TaxStamp.SatCertNumber || data.SatCertNumber || '',
    noCertEmisor: data.CertNumber || data.NoCertificado || '',
    selloCFDI: data.Complement && data.Complement.TaxStamp && data.Complement.TaxStamp.CfdiSign || data.CfdiSign || '',
    selloSAT: data.Complement && data.Complement.TaxStamp && data.Complement.TaxStamp.SatSign || data.SatSign || '',
    rfcPac: data.Complement && data.Complement.TaxStamp && data.Complement.TaxStamp.RfcProvCertif || 'FLI081010EK2',
    raw: data,
  };
}

module.exports = { json, readBody, credentials, envBase, facturamaFetch, path, mapCfdiPayload, normalizeCfdiResponse };
