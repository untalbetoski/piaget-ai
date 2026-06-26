/* api/facturama/cfdi.js — Crear y timbrar un CFDI 4.0 con complemento IEDU.
   Modalidad API Multiemisor: POST /api-lite/3/cfdis (el CSD del Issuer.Rfc debe estar cargado).
   El front envía un payload neutro y aquí lo mapeamos al contrato de Facturama. */
const { cors, fmFetch, readJson } = require('../_lib/facturama');

const PRODUCT_CODE_EDU = '86121800';  // Servicios de instrucción educativa / colegiaturas
const PRODUCT_CODE_GEN = '90111800';  // Servicios generales (transporte, materiales, etc.)

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const p = await readJson(req);
    const env = p.env || process.env.FACTURAMA_ENV || 'sandbox';

    // ---- validaciones mínimas ----
    if (!p.emisor || !p.receptor || !p.concepto) return res.status(400).json({ error: 'Payload incompleto (emisor / receptor / concepto)' });
    const subtotal = Number(p.concepto.unitPrice);
    if (!subtotal) return res.status(400).json({ error: 'Subtotal inválido' });
    const ivaRate = Number(p.iva || 0);
    const ivaTotal = Math.round(subtotal * ivaRate * 100) / 100;
    const total = Math.round((subtotal + ivaTotal) * 100) / 100;
    const edu = p.receptor.usoCFDI === 'D10';

    // ---- concepto (Item) ----
    const item = {
      ProductCode: edu ? PRODUCT_CODE_EDU : PRODUCT_CODE_GEN,
      IdentificationNumber: String(p.folio || ''),
      Description: p.concepto.description,
      Unit: 'Unidad de servicio',
      UnitCode: 'E48',
      Quantity: '1',
      UnitPrice: subtotal.toFixed(2),
      Subtotal: subtotal.toFixed(2),
      TaxObject: ivaRate ? '02' : '01',
      Total: total.toFixed(2),
    };
    if (ivaRate) {
      item.Taxes = [{ Base: subtotal.toFixed(2), IsRetention: 'false', Name: 'IVA', Rate: ivaRate.toFixed(2), Total: ivaTotal.toFixed(2) }];
    }
    // Complemento IEDU sólo en colegiatura (D10)
    if (edu && p.alumno) {
      item.Complement = {
        EducationalInstitution: {
          StudentsName: p.alumno.name,
          Curp: p.alumno.curp,
          EducationLevel: p.alumno.nivelEdu,   // Preescolar | Primaria | Secundaria...
          AutRvoe: p.alumno.cct,               // CCT / RVOE de la institución
          ...(p.alumno.rfcPago ? { PaymentRfc: p.alumno.rfcPago } : {}),
        },
      };
    }

    // ---- comprobante ----
    const cfdi = {
      CfdiType: 'I',
      Currency: 'MXN',
      Exportation: '01',
      Serie: p.serie || 'A',
      Folio: String(p.folio || ''),
      ExpeditionPlace: p.emisor.cp,
      PaymentForm: p.formaPago,
      PaymentMethod: p.metodoPago,
      Issuer: { Rfc: p.emisor.rfc, Name: p.emisor.name, FiscalRegime: p.emisor.regimen },
      Receiver: {
        Rfc: p.receptor.rfc, Name: p.receptor.name, CfdiUse: p.receptor.usoCFDI,
        FiscalRegime: p.receptor.regimen, TaxZipCode: p.receptor.cp,
      },
      Items: [item],
    };

    const out = await fmFetch(env, '/api-lite/3/cfdis', { method: 'POST', body: cfdi });

    // ---- normalizar respuesta (Timbre Fiscal Digital) ----
    const ts = (out.Complement && out.Complement.TaxStamp) || {};
    res.status(200).json({
      ok: true,
      facturamaId: out.Id,
      uuid: ts.Uuid || out.Uuid,
      fechaTimbrado: ts.Date,
      noCertSAT: ts.SatCertNumber,
      noCertEmisor: out.CertificateNumber,
      selloCFDI: ts.CfdiSign,
      selloSAT: ts.SatSign,
      rfcPac: ts.RfcProvCertif,
      total: out.Total,
    });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, detail: e.data || null });
  }
};
