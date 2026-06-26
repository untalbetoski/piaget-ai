/* api/facturama/cfdi.js — Crear y timbrar CFDI 4.0 con complemento IEDU.
   Usa Facturama desde backend con Basic Auth; no expone credenciales al navegador. */
const { cors, fmFetch, readJson, apiPath, normalizeError } = require('../_lib/facturama');

const PRODUCT_CODE_EDU = process.env.FACTURAMA_PRODUCT_CODE_EDU || '86121500';
const PRODUCT_CODE_GEN = process.env.FACTURAMA_PRODUCT_CODE_GEN || '84111506';

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const p = await readJson(req);
    const env = p.env || process.env.FACTURAMA_ENV || 'sandbox';
    if (!p.emisor || !p.receptor || !p.concepto) return res.status(400).json({ error: 'Payload incompleto: emisor, receptor y concepto son obligatorios.' });

    const subtotal = Number(p.concepto.unitPrice);
    if (!subtotal || subtotal <= 0) return res.status(400).json({ error: 'Subtotal inválido.' });

    const ivaRate = Number(p.iva || 0);
    const ivaTotal = Math.round(subtotal * ivaRate * 100) / 100;
    const total = Math.round((subtotal + ivaTotal) * 100) / 100;
    const edu = p.receptor.usoCFDI === 'D10';

    const item = {
      ProductCode: edu ? PRODUCT_CODE_EDU : PRODUCT_CODE_GEN,
      IdentificationNumber: String(p.folio || Date.now()),
      Description: p.concepto.description || 'Pago de servicios educativos',
      Unit: 'Servicio',
      UnitCode: 'E48',
      Quantity: 1,
      UnitPrice: subtotal,
      Subtotal: subtotal,
      TaxObject: ivaRate ? '02' : '01',
      Total: total,
    };
    if (ivaRate) {
      item.Taxes = [{ Base: subtotal, IsRetention: false, Name: 'IVA', Rate: ivaRate, Total: ivaTotal }];
    }
    if (edu && p.alumno) {
      item.Complement = {
        EducationalInstitution: {
          StudentsName: p.alumno.name,
          CURP: p.alumno.curp,
          EducationLevel: p.alumno.nivelEdu,
          AutRVOE: p.alumno.cct,
          PaymentRfc: p.alumno.rfcPago || p.receptor.rfc,
        },
      };
    }

    const cfdi = {
      CfdiType: 'I',
      Currency: 'MXN',
      Exportation: '01',
      Serie: p.serie || 'A',
      Folio: String(p.folio || ''),
      ExpeditionPlace: p.emisor.cp,
      PaymentForm: p.formaPago || '03',
      PaymentMethod: p.metodoPago || 'PUE',
      Issuer: { Rfc: p.emisor.rfc, Name: p.emisor.name, FiscalRegime: p.emisor.regimen },
      Receiver: {
        Rfc: p.receptor.rfc,
        Name: p.receptor.name,
        CfdiUse: p.receptor.usoCFDI || 'G03',
        FiscalRegime: p.receptor.regimen,
        TaxZipCode: p.receptor.cp,
      },
      Items: [item],
    };

    const endpoint = apiPath('FACTURAMA_CFDI_PATH', '/api-lite/3/cfdis');
    const out = await fmFetch(env, endpoint, { method: 'POST', body: cfdi });
    const ts = (out.Complement && out.Complement.TaxStamp) || {};
    res.status(200).json({
      ok: true,
      facturamaId: out.Id || out.id || '',
      uuid: ts.Uuid || out.Uuid || out.uuid || '',
      fechaTimbrado: ts.Date || out.Date || '',
      noCertSAT: ts.SatCertNumber || out.SatCertNumber || '',
      noCertEmisor: out.CertificateNumber || out.CertNumber || '',
      selloCFDI: ts.CfdiSign || out.CfdiSign || '',
      selloSAT: ts.SatSign || out.SatSign || '',
      rfcPac: ts.RfcProvCertif || 'FLI081010EK2',
      total: out.Total || total,
      raw: out,
    });
  } catch (e) { normalizeError(res, e); }
};
