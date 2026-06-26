/* views_facturas_data.jsx — Capa fiscal de Facturación (CFDI 4.0 · complemento IEDU)
   ----------------------------------------------------------------------------------
   · Cada FACTURA se emite a un RECEPTOR fiscal (el tutor) ligado a un ALUMNO real
     del padrón, identificado por su CURP y el CCT del nivel educativo.
   · CURP, RFC y datos fiscales son DETERMINÍSTICOS a partir del nombre del alumno,
     así que un mismo alumno siempre resuelve al mismo receptor/CURP/CCT.
   · CCT por nivel: claves reales del colegio.
*/

/* ---------- CCT real por nivel ---------- */
const FACT_CCT = {
  Preescolar: '15PJN0762T',
  Primaria: '15PPR2671F',
  Secundaria: '15PES0735F',
};
function factCCT(nivel) { return FACT_CCT[nivel] || FACT_CCT.Primaria; }

/* ---------- catálogos fiscales (CFDI 4.0) ---------- */
const FACT_REGIMENES = {
  '605': '605 · Sueldos y salarios',
  '612': '612 · Personas físicas con actividad empresarial',
  '626': '626 · RESICO',
  '616': '616 · Sin obligaciones fiscales',
};
const FACT_NIVEL_EDU = { Preescolar: 'Preescolar', Primaria: 'Primaria', Secundaria: 'Secundaria' };

/* ---------- helpers determinísticos ---------- */
function factHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 999983; return h; }
const FACT_EDO = ['AS', 'BC', 'BS', 'CC', 'CL', 'CM', 'CS', 'CH', 'DF', 'DG', 'GT', 'GR', 'HG', 'JC', 'MC', 'MN', 'MS', 'NT', 'NL', 'OC', 'PL', 'QO', 'QR', 'SP', 'SL', 'SR', 'TC', 'TS', 'TL', 'VZ', 'YN', 'ZS'];
const FACT_TUTORES_M = ['María', 'Patricia', 'Gabriela', 'Adriana', 'Verónica', 'Mónica', 'Alejandra', 'Claudia', 'Norma', 'Rosa', 'Diana', 'Karla'];
const FACT_TUTORES_H = ['Roberto', 'Jorge', 'Luis', 'Carlos', 'Miguel', 'Fernando', 'Raúl', 'Sergio', 'Andrés', 'Héctor', 'Javier', 'Arturo'];
const FACT_CP = ['52960', '52780', '53100', '54050', '52910', '53150', '52950', '54040', '53000', '52740'];
const FACT_REG_KEYS = ['605', '605', '605', '612', '626', '605', '616'];

function factVowelsOut(s) { return (s || '').slice(1).replace(/[AEIOUÁÉÍÓÚ]/gi, ''); }
function factFirstConsonant(s) { const c = factVowelsOut(s); return (c[0] || 'X').toUpperCase(); }
function factAscii(s) { return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z ]/g, ''); }

/* CURP del ALUMNO (18 caracteres, verosímil) */
function factCURP(name) {
  const h = factHash(name + 'curp');
  const parts = factAscii(name).split(/\s+/).filter(Boolean);
  const nom = parts[0] || 'X';
  const ape = parts[parts.length - 1] || 'XX';
  const ape2 = parts.length > 2 ? parts[parts.length - 2] : 'X';
  const ini = (ape[0] || 'X') + (factVowelsOut(ape).match(/[AEIOU]/i) ? 'X' : (ape.slice(1).match(/[AEIOU]/i)?.[0] || 'X')) + (ape2[0] || 'X') + (nom[0] || 'X');
  const yy = String(10 + (h % 9)).padStart(2, '0');   // alumno: ~2010-2018
  const mm = String(1 + (h % 12)).padStart(2, '0');
  const dd = String(1 + (h % 28)).padStart(2, '0');
  const sexo = (h % 2) ? 'H' : 'M';
  const edo = FACT_EDO[h % FACT_EDO.length];
  const cons = factFirstConsonant(ape) + factFirstConsonant(ape2) + factFirstConsonant(nom);
  const homo = String(h % 10) + String.fromCharCode(65 + (h % 26));
  return (ini + yy + mm + dd + sexo + edo + cons + homo).slice(0, 18);
}

/* RFC del RECEPTOR (persona física, 13 caracteres) */
function factRFC(tutorName) {
  const h = factHash(tutorName + 'rfc');
  const parts = factAscii(tutorName).split(/\s+/).filter(Boolean);
  const nom = parts[0] || 'X';
  const ape = parts[parts.length - 1] || 'XX';
  const ape2 = parts.length > 2 ? parts[parts.length - 2] : '';
  const ini = (ape.slice(0, 2).padEnd(2, 'X')) + (ape2[0] || 'X') + (nom[0] || 'X');
  const yy = String(70 + (h % 30)).padStart(2, '0');  // adulto
  const mm = String(1 + (h % 12)).padStart(2, '0');
  const dd = String(1 + (h % 28)).padStart(2, '0');
  const A = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const homo = A[h % 36] + A[(h * 7) % 36] + A[(h * 13) % 36];
  return (ini + yy + mm + dd + homo).slice(0, 13);
}

function factSlug(name) { return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, ''); }

/* RECEPTOR fiscal fijo del alumno (su tutor) */
function factReceptorOf(name) {
  const h = factHash(name + 'tutor');
  const ape = name.trim().split(/\s+/).slice(-1)[0];
  const first = (h % 2) ? FACT_TUTORES_H[h % FACT_TUTORES_H.length] : FACT_TUTORES_M[h % FACT_TUTORES_M.length];
  const second = FACT_TUTORES_H[(h * 3) % FACT_TUTORES_H.length].split(' ')[0];
  const nombre = first + ' ' + ape;
  return {
    nombre,
    rfc: factRFC(nombre),
    cp: FACT_CP[h % FACT_CP.length],
    regimen: FACT_REG_KEYS[h % FACT_REG_KEYS.length],
    usoCFDI: 'D10',
    correo: factSlug(first) + '.' + factSlug(ape) + '@correo.com',
  };
}

/* Resuelve el complemento fiscal de un alumno del padrón */
function factResolveStudent(stu) {
  return {
    sid: stu.sid, name: stu.name, group: stu.group, nivel: stu.nivel,
    curp: factCURP(stu.name),
    cct: factCCT(stu.nivel),
    nivelEdu: FACT_NIVEL_EDU[stu.nivel] || stu.nivel,
    receptor: factReceptorOf(stu.name),
  };
}

/* Padrón fiscal completo (desde el roster real de Cobros/Clases) */
let _factStudentsCache = null;
function factStudents() {
  if (_factStudentsCache) return _factStudentsCache;
  const roster = (window.ctaStudents ? window.ctaStudents() : []);
  _factStudentsCache = roster.map(factResolveStudent);
  return _factStudentsCache;
}
function factFindStudent(name) { return factStudents().find(s => s.name === name) || null; }
function factFindBySid(sid) { return factStudents().find(s => s.sid === sid) || null; }
function factMatchStudent(name, group, nivel) {
  const all = factStudents();
  return all.find(s => s.name === name && s.group === group && s.nivel === nivel)
    || all.find(s => s.name === name && s.group === group)
    || all.find(s => s.name === name) || null;
}

/* Enriquecer una factura guardada con su complemento fiscal vigente */
function factResolveFactura(f) {
  const r = factReceptorOf(f.alumno || '');
  return {
    ...f,
    curp: f.curp || factCURP(f.alumno || ''),
    cct: f.cct || factCCT(f.nivel),
    nivelEdu: FACT_NIVEL_EDU[f.nivel] || f.nivel,
    receptor: f.receptor || r.nombre,
    rfc: f.rfc || r.rfc,
    cp: f.cp || r.cp,
    regimen: f.regimen || r.regimen,
    correo: f.correo || r.correo,
  };
}

Object.assign(window, {
  FACT_CCT, factCCT, FACT_REGIMENES, FACT_NIVEL_EDU,
  factCURP, factRFC, factReceptorOf, factResolveStudent, factStudents, factFindStudent, factFindBySid, factMatchStudent, factResolveFactura,
});

/* ---------- Auto-borrador de factura desde un cobro conciliado ---------- */
const FACT_COBRO_FORMA = { Transferencia: '03', Tarjeta: '04', Efectivo: '01', Domiciliación: '03' };
function factBorradorDeCobro(cobro) {
  if (!cobro || !cobro.sid) return null;                                   // requiere alumno ligado (CURP/CCT)
  const facturas = (window.DB && window.DB.facturas) || [];
  if (facturas.some(f => f.cobroId === cobro._id)) return null;            // ya facturado
  const stu = factFindBySid(cobro.sid);
  if (!stu) return null;
  const r = stu.receptor;
  const concept = (cobro.concept || '').toLowerCase();
  const edu = /(colegiatura|inscrip|reinscrip|anual|cuota)/.test(concept);
  const usoCFDI = edu ? 'D10' : 'G03';
  const ivaRate = edu ? 0 : 0.16;
  const subtotal = ivaRate ? Math.round(cobro.amount / (1 + ivaRate)) : cobro.amount;
  const folio = String(facturas.reduce((m, f) => Math.max(m, Number(f.folio) || 0), 1040) + 1);
  window.Store.add('facturas', {
    serie: 'A', folio, uuid: '', cobroId: cobro._id, recibo: cobro.recibo,
    alumno: stu.name, nivel: stu.nivel, group: stu.group, curp: stu.curp, cct: stu.cct,
    receptor: r.nombre, rfc: r.rfc, cp: r.cp, regimen: r.regimen, correo: r.correo,
    usoCFDI, concept: cobro.concept || 'Pago de servicios educativos', subtotal, ivaRate,
    formaPago: FACT_COBRO_FORMA[cobro.channel] || '03', metodoPago: 'PUE',
    date: cobro.date || new Date().toISOString().slice(0, 10), status: 'borrador',
  });
  if (window.Store.log) window.Store.log('Tesorería', 'generó el borrador A-' + folio + ' desde el recibo ' + cobro.recibo + ' · ' + stu.name, 'receipt');
  return folio;
}
window.factBorradorDeCobro = factBorradorDeCobro;

/* ============================================================
   Conexión PAC (Facturama) · configuración fiscal — SOLO DEMO
   Nunca se persisten secretos: ni API key, ni contraseña de la
   llave, ni los bytes del .cer/.key. Solo banderas y metadatos.
   ============================================================ */
/* Emisor real del colegio (CFDI 4.0) */
const FACT_EMISOR = {
  razon: 'CORPORATIVO JEAN PIAGET',
  rfc: 'CJP950815CH6',
  regimen: '626',
  regimenLabel: '626 · Régimen Simplificado de Confianza',
  cp: '54930',
  domicilio: 'Jazmines 20, Col. Granjas San Pablo, Tultitlán, Estado de México',
};
const FACT_PAC_RFC = 'FLI081010EK2'; // RFC del PAC (Facturama)

const PAC_KEY = 'piaget_pac_v2';
const PAC_DEFAULT = {
  connected: false,
  env: 'sandbox',                 // 'sandbox' | 'prod'
  user: '',
  hasKey: false,                  // true si se capturó una API key en la sesión (no se guarda)
  csd: { loaded: false, cerName: '', keyName: '', serie: '', vigencia: '' },
  emisor: { rfc: FACT_EMISOR.rfc, razon: FACT_EMISOR.razon, regimen: FACT_EMISOR.regimen, cp: FACT_EMISOR.cp },
};
let PAC_STATE = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(PAC_KEY) || 'null');
    return s ? { ...PAC_DEFAULT, ...s, csd: { ...PAC_DEFAULT.csd, ...(s.csd || {}) }, emisor: { ...PAC_DEFAULT.emisor, ...(s.emisor || {}) }, hasKey: false } : { ...PAC_DEFAULT };
  } catch (e) { return { ...PAC_DEFAULT }; }
})();
function pacGet() { return PAC_STATE; }
function pacReady() { return !!(PAC_STATE.connected && PAC_STATE.csd && PAC_STATE.csd.loaded); }
function pacEnvLabel() { return PAC_STATE.env === 'prod' ? 'Producción' : 'Pruebas'; }
function pacSave(patch) {
  PAC_STATE = { ...PAC_STATE, ...patch };
  try {
    const slim = { ...PAC_STATE, hasKey: undefined };   // no persistir bandera de sesión
    localStorage.setItem(PAC_KEY, JSON.stringify(slim));
  } catch (e) { }
  window.dispatchEvent(new CustomEvent('pac-change'));
}
/* metadatos verosímiles del CSD a partir del nombre de archivo (sin leer el contenido) */
function pacCsdMeta(cerName) {
  let h = 0; for (let i = 0; i < (cerName || 'csd').length; i++) h = (h * 31 + cerName.charCodeAt(i)) % 1e9;
  const serie = '00001000000' + String(400000000 + (h % 99999999)).padStart(9, '0');
  const y = 2025 + (h % 2);
  const vigencia = '14/03/' + y + ' – 14/03/' + (y + 4);
  return { serie: serie.slice(0, 20), vigencia };
}
function usePac() {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const onChange = () => force(n => n + 1);
    window.addEventListener('pac-change', onChange);
    return () => window.removeEventListener('pac-change', onChange);
  }, []);
  return pacGet();
}

/* ---------- Timbre Fiscal Digital (TFD) simulado, con forma realista ---------- */
function factUUID() {
  const h = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1).toUpperCase();
  return h() + h().slice(0, 4) + '-' + h().slice(0, 4) + '-' + h().slice(0, 4) + '-' + h().slice(0, 4) + '-' + h() + h() + h().slice(0, 4);
}
function factDigits(n) { let s = ''; for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10); return s; }
function factB64(n) { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; let s = ''; for (let i = 0; i < n; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
function factBuildTimbre() {
  const fecha = new Date().toISOString().slice(0, 19);
  const uuid = factUUID();
  const noCertSAT = '00001000000' + factDigits(9);
  const selloCFDI = factB64(170) + '==';
  const selloSAT = factB64(170) + '==';
  const cadena = '||1.1|' + uuid + '|' + fecha + '|' + FACT_PAC_RFC + '|' + selloCFDI.slice(0, 36) + '…|' + noCertSAT + '||';
  return { uuid, fechaTimbrado: fecha, tfdVersion: '1.1', noCertSAT, noCertEmisor: '00001000000' + factDigits(9), selloCFDI, selloSAT, rfcPac: FACT_PAC_RFC, cadena };
}

/* Payload neutro que el front envía al backend /api/facturama/cfdi.
   El backend lo mapea al contrato exacto de Facturama (Issuer/Receiver/Items + IEDU). */
function factBuildPayload(f, env) {
  return {
    env: env || (pacGet().env || 'sandbox'),
    serie: f.serie, folio: f.folio,
    emisor: { rfc: FACT_EMISOR.rfc, name: FACT_EMISOR.razon, regimen: FACT_EMISOR.regimen, cp: FACT_EMISOR.cp },
    receptor: { rfc: f.rfc, name: f.receptor, regimen: f.regimen, cp: f.cp, usoCFDI: f.usoCFDI },
    alumno: { name: f.alumno, curp: f.curp, nivelEdu: f.nivelEdu, cct: f.cct, rfcPago: f.rfc },
    concepto: { description: f.concept, unitPrice: f.subtotal },
    iva: f.ivaRate, formaPago: f.formaPago, metodoPago: f.metodoPago,
  };
}

Object.assign(window, { FACT_EMISOR, FACT_PAC_RFC, factBuildTimbre, factBuildPayload, pacGet, pacReady, pacEnvLabel, pacSave, pacCsdMeta, usePac });

/* views_facturas.jsx — Módulo Facturas (CFDI 4.0 · complemento IEDU)
   Receptor (tutor) fijo por ALUMNO; alumno ligado por CURP y CCT del nivel. */

const USO_CFDI = {
  D10: 'D10 · Pagos por servicios educativos',
  G03: 'G03 · Gastos en general',
  S01: 'S01 · Sin efectos fiscales',
};
const FORMA_PAGO = {
  '01': '01 · Efectivo',
  '03': '03 · Transferencia electrónica',
  '04': '04 · Tarjeta de crédito',
  '28': '28 · Tarjeta de débito',
};
const METODO_PAGO = { PUE: 'PUE · Pago en una exhibición', PPD: 'PPD · Pago en parcialidades' };
const FACT_STATUS = {
  timbrada: ['green', 'Timbrada'],
  borrador: ['amber', 'Borrador'],
  cancelada: ['red', 'Cancelada'],
};

const factIva = (f) => Math.round(f.subtotal * (f.ivaRate || 0));
const factTotal = (f) => f.subtotal + factIva(f);
const factFolio = (f) => f.serie + '-' + f.folio;
function genUUID() {
  const hex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1).toUpperCase();
  return hex() + hex().slice(0, 4) + '-' + hex().slice(0, 4) + '-' + hex().slice(0, 4) + '-' + hex().slice(0, 4) + '-' + hex() + hex() + hex().slice(0, 4);
}
function factDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function factStatusBadge(s) {
  const [tone, label] = FACT_STATUS[s] || FACT_STATUS.borrador;
  return <Badge tone={tone} dot>{label}</Badge>;
}

/* ============ Modal: Emitir / editar factura ============ */
function EmitirFactura({ editFact, onClose, pacReady, onTimbrar, onConfig }) {
  const editing = !!editFact;
  const [nivel, setNivel] = React.useState(editFact ? editFact.nivel : 'Primaria');
  const [group, setGroup] = React.useState(editFact ? editFact.group : '');
  const [sid, setSid] = React.useState(editFact ? (window.factMatchStudent(editFact.alumno, editFact.group, editFact.nivel) || {}).sid || '' : '');
  const [usoCFDI, setUsoCFDI] = React.useState(editFact ? editFact.usoCFDI : 'D10');
  const [concept, setConcept] = React.useState(editFact ? editFact.concept : '');
  const [subtotal, setSubtotal] = React.useState(editFact ? String(editFact.subtotal) : '');
  const [ivaRate, setIvaRate] = React.useState(editFact ? editFact.ivaRate : 0);
  const [formaPago, setFormaPago] = React.useState(editFact ? editFact.formaPago : '03');
  const [metodoPago, setMetodoPago] = React.useState(editFact ? editFact.metodoPago : 'PUE');

  const niveles = window.cobNiveles ? cobNiveles() : ['Preescolar', 'Primaria', 'Secundaria'];
  const groupsOfNivel = React.useMemo(() => Array.from(new Set(window.factStudents().filter(s => s.nivel === nivel).map(s => s.group))), [nivel]);
  const studentsOfGroup = React.useMemo(() => window.factStudents().filter(s => s.group === group), [group]);
  const stu = React.useMemo(() => window.factFindBySid(sid), [sid]);

  function pickNivel(n) { setNivel(n); setGroup(''); setSid(''); }
  function pickGroup(g) { setGroup(g); setSid(''); }

  // Guarda como BORRADOR (o actualiza) y devuelve el registro; el timbrado real lo hace el flujo PAC.
  function saveBorrador() {
    if (!stu) { toast('Selecciona al alumno receptor', 'warn'); return null; }
    if (!concept.trim()) { toast('Escribe el concepto', 'warn'); return null; }
    if (!Number(subtotal)) { toast('Captura un subtotal válido', 'warn'); return null; }
    const r = stu.receptor;
    const base = {
      alumno: stu.name, nivel: stu.nivel, group: stu.group,
      curp: stu.curp, cct: stu.cct,
      receptor: r.nombre, rfc: r.rfc, cp: r.cp, regimen: r.regimen, correo: r.correo,
      usoCFDI, concept, subtotal: Number(subtotal), ivaRate: Number(ivaRate), formaPago, metodoPago, status: 'borrador',
    };
    if (editing) {
      Store.update('facturas', editFact._id, base);
      return { ...editFact, ...base, status: editFact.status === 'timbrada' ? 'timbrada' : 'borrador' };
    }
    const folio = String((DB.facturas || []).reduce((m, f) => Math.max(m, Number(f.folio) || 0), 1040) + 1);
    return Store.add('facturas', { ...base, serie: 'A', folio, uuid: '', date: new Date().toISOString().slice(0, 10) });
  }
  function onGuardar() { const r = saveBorrador(); if (r) { toast('Borrador guardado ✓'); onClose(); } }
  function onTimbrarClick() {
    if (!pacReady) { toast('Conecta Facturama y carga tu CSD para timbrar', 'warn'); onConfig(); return; }
    const r = saveBorrador(); if (!r) return;
    onClose(); onTimbrar(r);
  }

  const totalPrev = (Number(subtotal) || 0) + Math.round((Number(subtotal) || 0) * Number(ivaRate));
  const r = stu && stu.receptor;

  return (
    <Modal open width={660} onClose={onClose} title={editing ? 'Editar factura · ' + factFolio(editFact) : 'Emitir factura (CFDI 4.0)'}
      footer={<>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn" onClick={onGuardar}><Icon name="doc" size={15} className="btn-ico" />Guardar borrador</button>
        <button className="btn primary" onClick={onTimbrarClick}><Icon name={pacReady ? 'check' : 'lock'} size={15} className="btn-ico" />{pacReady ? 'Sellar y timbrar' : 'Timbrar factura'}</button>
      </>}>

      {/* Paso 1 — Alumno (receptor del servicio educativo) */}
      <div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>1 · Alumno</div>
      <div className="field-row">
        <Field label="Nivel"><SelectInput value={nivel} onChange={e => pickNivel(e.target.value)} options={niveles} /></Field>
        <Field label="Grupo"><SelectInput value={group} onChange={e => pickGroup(e.target.value)} options={[{ value: '', label: 'Selecciona…' }, ...groupsOfNivel.map(g => ({ value: g, label: g }))]} /></Field>
      </div>
      <Field label="Alumno"><SelectInput value={sid} onChange={e => setSid(e.target.value)} options={[{ value: '', label: group ? 'Selecciona alumno…' : 'Elige un grupo primero' }, ...studentsOfGroup.map(s => ({ value: s.sid, label: s.name }))]} /></Field>

      {/* Datos fiscales autollenados */}
      {stu && (
        <div className="card pad" style={{ margin: '4px 0 14px', background: 'var(--surface-2)' }}>
          <div className="row between center" style={{ marginBottom: 10 }}>
            <span className="row center gap-8" style={{ fontWeight: 600, fontSize: 13.5 }}><Icon name="cap" size={15} className="faint" />Complemento educativo (IEDU)</span>
            <Badge tone={window.nivelCfg ? nivelCfg(stu.nivel).tone : 'blue'}>{stu.nivelEdu}</Badge>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
            {[['Alumno', stu.name], ['CURP', stu.curp], ['CCT del nivel', stu.cct], ['Grupo', stu.group]].map(([k, v], i) => (
              <div key={i}><div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div><div className="font-mono" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 1 }}>{v}</div></div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0 10px' }} />
          <div className="row between center" style={{ marginBottom: 10 }}>
            <span className="row center gap-8" style={{ fontWeight: 600, fontSize: 13.5 }}><Icon name="receipt" size={15} className="faint" />Receptor fiscal</span>
            <span className="faint" style={{ fontSize: 11 }}>fijo del alumno · autollenado</span>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
            {[['Razón social', r.nombre], ['RFC', r.rfc], ['Régimen fiscal', (window.FACT_REGIMENES[r.regimen] || r.regimen)], ['C.P. (domicilio fiscal)', r.cp], ['Correo de envío', r.correo]].map(([k, v], i) => (
              <div key={i}><div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div><div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 1, wordBreak: 'break-word' }}>{v}</div></div>
            ))}
          </div>
        </div>
      )}

      {/* Paso 2 — Comprobante */}
      <div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', margin: '4px 0 8px' }}>2 · Comprobante</div>
      <Field label="Concepto"><TextInput value={concept} onChange={e => setConcept(e.target.value)} placeholder="Colegiatura agosto 2025" /></Field>
      <div className="field-row">
        <Field label="Uso de CFDI"><SelectInput value={usoCFDI} onChange={e => setUsoCFDI(e.target.value)} options={Object.entries(USO_CFDI).map(([value, label]) => ({ value, label }))} /></Field>
        <Field label="Subtotal (MXN)"><NumberInput value={subtotal} onChange={e => setSubtotal(e.target.value)} placeholder="0.00" min="0" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="IVA"><SelectInput value={ivaRate} onChange={e => setIvaRate(e.target.value)} options={[{ value: 0, label: 'Exento' }, { value: 0.16, label: 'IVA 16%' }]} /></Field>
        <Field label="Forma de pago"><SelectInput value={formaPago} onChange={e => setFormaPago(e.target.value)} options={Object.entries(FORMA_PAGO).map(([value, label]) => ({ value, label }))} /></Field>
        <Field label="Método"><SelectInput value={metodoPago} onChange={e => setMetodoPago(e.target.value)} options={Object.entries(METODO_PAGO).map(([value, label]) => ({ value, label }))} /></Field>
      </div>
      <div className="row between center" style={{ marginTop: 6, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
        <span className="muted" style={{ fontSize: 13 }}>Total a facturar</span>
        <span className="font-display tnum" style={{ fontSize: 22, fontWeight: 700 }}>{fmtMoney(totalPrev)}</span>
      </div>
    </Modal>
  );
}

/* ============ Modal: detalle de la factura ============ */
function FacturaDetalle({ fact, onClose }) {
  if (!fact) return null;
  const f = window.factResolveFactura(fact);
  return (
    <Modal open width={580} onClose={onClose} title={'Factura ' + factFolio(f)}
      footer={f.status === 'timbrada'
        ? <><button className="btn" onClick={onClose}>Cerrar</button><button className="btn" onClick={() => toast('XML descargado ✓')}><Icon name="doc" size={15} className="btn-ico" />XML</button><button className="btn primary" onClick={() => toast('PDF descargado ✓')}><Icon name="download" size={15} className="btn-ico" />Descargar PDF</button></>
        : <button className="btn" onClick={onClose}>Cerrar</button>}>
      <div className="col gap-16">
        <div className="row between center">
          <div>
            <div className="eyebrow">{window.FACT_EMISOR.razon}</div>
            <div className="faint font-mono" style={{ fontSize: 12 }}>RFC emisor · {window.FACT_EMISOR.rfc}</div>
            <div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>{window.FACT_EMISOR.regimenLabel} · C.P. {window.FACT_EMISOR.cp}</div>
            <div className="faint" style={{ fontSize: 11, marginTop: 1 }}>{window.FACT_EMISOR.domicilio}</div>
          </div>
          {factStatusBadge(f.status)}
        </div>
        {f.uuid && <div style={{ padding: '12px 14px', background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)' }}>
          <div className="row between center" style={{ marginBottom: 8 }}>
            <span className="row center gap-8" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}><Icon name="shield" size={13} />Timbre Fiscal Digital (TFD {f.tfdVersion || '1.1'})</span>
            <span className="faint" style={{ fontSize: 11 }}>PAC · {f.rfcPac || window.FACT_PAC_RFC}</span>
          </div>
          <div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Folio fiscal (UUID)</div>
          <div className="font-mono" style={{ fontSize: 12.5, fontWeight: 600, wordBreak: 'break-all' }}>{f.uuid}</div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            {[['Fecha de timbrado', (f.fechaTimbrado || '').replace('T', ' ') || '—'], ['No. certificado SAT', f.noCertSAT || '—'], ['No. certificado emisor', f.noCertEmisor || '—'], ['RFC proveedor cert.', f.rfcPac || window.FACT_PAC_RFC]].map(([k, v], i) => (
              <div key={i}><div className="faint" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div><div className="font-mono" style={{ fontSize: 11.5, fontWeight: 600, marginTop: 1, wordBreak: 'break-all' }}>{v}</div></div>
            ))}
          </div>
          {f.selloCFDI && <div style={{ marginTop: 10 }}>
            <div className="faint" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>Sello digital del CFDI</div>
            <div className="font-mono" style={{ fontSize: 10, lineHeight: 1.35, color: 'var(--text-muted)', wordBreak: 'break-all', maxHeight: 46, overflow: 'hidden' }}>{f.selloCFDI}</div>
          </div>}
          {f.selloSAT && <div style={{ marginTop: 8 }}>
            <div className="faint" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>Sello del SAT</div>
            <div className="font-mono" style={{ fontSize: 10, lineHeight: 1.35, color: 'var(--text-muted)', wordBreak: 'break-all', maxHeight: 46, overflow: 'hidden' }}>{f.selloSAT}</div>
          </div>}
        </div>}

        {/* Receptor */}
        <div>
          <div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Receptor</div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Razón social', f.receptor], ['RFC receptor', f.rfc],
              ['Régimen fiscal', (window.FACT_REGIMENES[f.regimen] || f.regimen)], ['C.P. domicilio fiscal', f.cp],
              ['Uso de CFDI', USO_CFDI[f.usoCFDI]], ['Correo', f.correo],
            ].map(([k, v], i) => (
              <div key={i}><div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div><div style={{ fontSize: 13, fontWeight: 500, marginTop: 1, wordBreak: 'break-word' }}>{v}</div></div>
            ))}
          </div>
        </div>

        {/* Complemento IEDU */}
        <div style={{ padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
          <div className="row between center" style={{ marginBottom: 10 }}>
            <span className="row center gap-8" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)' }}><Icon name="cap" size={14} />Complemento educativo (IEDU)</span>
            <Badge tone={window.nivelCfg ? nivelCfg(f.nivel).tone : 'blue'}>{f.nivelEdu}</Badge>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['Alumno', f.alumno], ['CURP', f.curp], ['Nivel educativo', f.nivelEdu], ['CCT (autorización)', f.cct]].map(([k, v], i) => (
              <div key={i}><div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div><div className="font-mono" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 1 }}>{v}</div></div>
            ))}
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['Fecha de emisión', factDate(f.date)], ['Forma de pago', FORMA_PAGO[f.formaPago]], ['Método de pago', METODO_PAGO[f.metodoPago]]].map(([k, v], i) => (
            <div key={i}><div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div><div style={{ fontSize: 13, fontWeight: 500, marginTop: 1 }}>{v}</div></div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>{f.concept}</div>
          <div className="col gap-8">
            <div className="row between center"><span className="muted" style={{ fontSize: 13 }}>Subtotal</span><span className="tnum" style={{ fontSize: 13.5 }}>{fmtMoney(f.subtotal)}</span></div>
            <div className="row between center"><span className="muted" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>IVA {f.ivaRate ? '16%' : '· exento'}</span><span className="tnum" style={{ fontSize: 13.5 }}>{fmtMoney(factIva(f))}</span></div>
            <div className="row between center" style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}><span style={{ fontWeight: 600 }}>Total</span><span className="font-display tnum" style={{ fontSize: 20, fontWeight: 700 }}>{fmtMoney(factTotal(f))}</span></div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ============ Modal: Configuración fiscal (PAC + CSD) — solo demo ============ */
function FileSlot({ label, accept, value, onPick, icon }) {
  const ref = React.useRef(null);
  return (
    <div>
      <div className="faint" style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <button type="button" className="row center gap-8" onClick={() => ref.current && ref.current.click()}
        style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 12px', borderRadius: 'var(--r-sm)', border: '1px dashed var(--border-strong, var(--border))', background: value ? 'var(--green-soft)' : 'var(--surface-2)', cursor: 'pointer', color: 'var(--text)' }}>
        <Icon name={value ? 'checkCircle' : icon} size={16} className={value ? '' : 'faint'} style={value ? { color: 'var(--green)' } : null} />
        <span className="font-mono" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || ('Seleccionar ' + accept)}</span>
      </button>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={e => { const fl = e.target.files[0]; onPick((fl && fl.name) || '', fl || null); }} />
    </div>
  );
}

function fileToB64(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(file); }); }

function ConfigFiscal({ apiInfo, onClose }) {
  const pac = usePac();
  const backendReady = !!(apiInfo && apiInfo.ready);
  const [env, setEnv] = React.useState(pac.env);
  const [user, setUser] = React.useState(pac.user);
  const [apiKey, setApiKey] = React.useState('');
  const [emisor, setEmisor] = React.useState({ ...pac.emisor });
  const [cerName, setCerName] = React.useState(pac.csd.cerName);
  const [keyName, setKeyName] = React.useState(pac.csd.keyName);
  const [cerFile, setCerFile] = React.useState(null);
  const [keyFile, setKeyFile] = React.useState(null);
  const [keyPass, setKeyPass] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  function conectar() {
    if (!user.trim() || !apiKey.trim()) { toast('Captura usuario y API key de Facturama', 'warn'); return; }
    window.pacSave({ connected: true, env, user, hasKey: true });
    toast('Conectado a Facturama · ' + (env === 'prod' ? 'Producción' : 'Pruebas') + ' ✓');
  }
  function desconectar() { window.pacSave({ connected: false, hasKey: false }); setApiKey(''); toast('Desconectado de Facturama', 'warn'); }
  async function cargarCsd() {
    if (!cerName || !keyName) { toast('Selecciona el archivo .cer y el .key', 'warn'); return; }
    if (!keyPass.trim()) { toast('Captura la contraseña de la llave privada', 'warn'); return; }
    if (backendReady && cerFile && keyFile) {
      // Carga REAL: el CSD se sube al backend → Facturama (modalidad Multiemisor)
      setBusy(true);
      try {
        const [certificateBase64, privateKeyBase64] = await Promise.all([fileToB64(cerFile), fileToB64(keyFile)]);
        await window.FacturamaAPI.uploadCSD({ env, rfc: emisor.rfc, certificateBase64, privateKeyBase64, password: keyPass });
        const meta = window.pacCsdMeta(cerName);
        window.pacSave({ csd: { loaded: true, cerName, keyName, serie: meta.serie, vigencia: meta.vigencia }, emisor });
        setKeyPass(''); setCerFile(null); setKeyFile(null);
        toast('CSD cargado en Facturama ✓');
      } catch (e) {
        toast('No se pudo cargar el CSD: ' + ((e && e.message) || 'error'), 'warn');
      } finally { setBusy(false); }
      return;
    }
    // Modo demo: solo metadatos (no se sube ningún archivo)
    const meta = window.pacCsdMeta(cerName);
    window.pacSave({ csd: { loaded: true, cerName, keyName, serie: meta.serie, vigencia: meta.vigencia }, emisor });
    setKeyPass('');
    toast('CSD validado y cargado ✓');
  }
  function quitarCsd() { window.pacSave({ csd: { loaded: false, cerName: '', keyName: '', serie: '', vigencia: '' } }); setCerName(''); setKeyName(''); setCerFile(null); setKeyFile(null); toast('CSD removido', 'warn'); }

  return (
    <Modal open width={640} onClose={onClose} title="Configuración fiscal"
      footer={<button className="btn primary" onClick={onClose}>Listo</button>}>
      <div className="insight" style={{ borderTop: 'none', padding: '0 0 14px', alignItems: 'flex-start', gap: 10 }}>
        <Icon name={backendReady ? 'shield' : 'alert'} size={16} style={{ marginTop: 2, color: backendReady ? 'var(--green)' : 'var(--amber)' }} />
        <div className="faint" style={{ fontSize: 12, lineHeight: 1.5 }}>
          {backendReady
            ? <span><b style={{ color: 'var(--text)' }}>Backend de timbrado conectado.</b> Los comprobantes se sellan con tu CSD y se timbran en Facturama con <b>valor fiscal</b>. La API key vive en el servidor (variables de entorno), nunca en el navegador.</span>
            : <span><b style={{ color: 'var(--text)' }}>Modo demostración.</b> No hay backend de timbrado disponible, así que el timbrado se <b>simula</b> (sin valor fiscal). Despliega las funciones <code>/api/facturama/*</code> y configura <code>FACTURAMA_USER/PASSWORD</code> para activar el timbrado real.</span>}
        </div>
      </div>

      {/* Conexión PAC */}
      <div className="card" style={{ marginBottom: 14 }}>
        <CardHead icon="link" title="Conexión con el PAC" sub="Facturama · API REST"
          right={pac.connected ? <Badge tone="green" dot>Conectado</Badge> : <Badge tone="amber" dot>Sin conexión</Badge>} />
        <div className="card pad col gap-12" style={{ borderTop: 'none' }}>
          <Field label="Entorno">
            <div className="seg">{[['sandbox', 'Pruebas (sandbox)'], ['prod', 'Producción']].map(([v, l]) => <button key={v} className={env === v ? 'active' : ''} onClick={() => setEnv(v)}>{l}</button>)}</div>
          </Field>
          <div className="field-row">
            <Field label="Usuario API"><TextInput value={user} onChange={e => setUser(e.target.value)} placeholder="usuario@facturama" /></Field>
            <Field label="API key"><input className="inp" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="••••••••••••" autoComplete="off" /></Field>
          </div>
          <div className="row gap-8">
            {pac.connected
              ? <><span className="grow faint" style={{ fontSize: 12.5 }}>Conectado como <b>{pac.user}</b> · {pac.env === 'prod' ? 'Producción' : 'Pruebas'}</span><button className="btn" onClick={desconectar}><Icon name="logout" size={14} className="btn-ico" />Desconectar</button></>
              : <><span className="grow" /><button className="btn primary" onClick={conectar}><Icon name="link" size={15} className="btn-ico" />Conectar</button></>}
          </div>
        </div>
      </div>

      {/* CSD */}
      <div className="card">
        <CardHead icon="lock" title="Certificado de Sello Digital (CSD)" sub="Emisor · sella cada comprobante"
          right={pac.csd.loaded ? <Badge tone="green" dot>Cargado</Badge> : <Badge tone="amber" dot>Pendiente</Badge>} />
        <div className="card pad col gap-12" style={{ borderTop: 'none' }}>
          {pac.csd.loaded ? (
            <div className="col gap-8">
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['Certificado', pac.csd.cerName], ['Llave privada', pac.csd.keyName], ['No. de serie', pac.csd.serie], ['Vigencia', pac.csd.vigencia]].map(([k, v], i) => (
                  <div key={i}><div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div><div className="font-mono" style={{ fontSize: 12, fontWeight: 600, marginTop: 1, wordBreak: 'break-all' }}>{v}</div></div>
                ))}
              </div>
              <div className="row"><span className="grow" /><button className="btn" onClick={quitarCsd}><Icon name="trash" size={14} className="btn-ico" />Quitar CSD</button></div>
            </div>
          ) : (
            <React.Fragment>
              <div className="field-row">
                <FileSlot label="Certificado (.cer)" accept=".cer" icon="doc" value={cerName} onPick={(n, fl) => { setCerName(n); setCerFile(fl); }} />
                <FileSlot label="Llave privada (.key)" accept=".key" icon="lock" value={keyName} onPick={(n, fl) => { setKeyName(n); setKeyFile(fl); }} />
              </div>
              <Field label="Contraseña de la llave privada"><input className="inp" type="password" value={keyPass} onChange={e => setKeyPass(e.target.value)} placeholder="••••••••" autoComplete="off" /></Field>
              <div className="field-row">
                <Field label="RFC emisor"><TextInput value={emisor.rfc} onChange={e => setEmisor({ ...emisor, rfc: e.target.value.toUpperCase() })} /></Field>
                <Field label="Razón social"><TextInput value={emisor.razon} onChange={e => setEmisor({ ...emisor, razon: e.target.value })} /></Field>
              </div>
              <div className="field-row">
                <Field label="Régimen fiscal"><SelectInput value={emisor.regimen} onChange={e => setEmisor({ ...emisor, regimen: e.target.value })} options={[{ value: '626', label: '626 · Régimen Simplificado de Confianza' }, { value: '601', label: '601 · General de ley personas morales' }, { value: '603', label: '603 · Personas morales sin fines de lucro' }]} /></Field>
                <Field label="Lugar de expedición (C.P.)"><TextInput value={emisor.cp} onChange={e => setEmisor({ ...emisor, cp: e.target.value })} /></Field>
              </div>
              <div className="row"><span className="grow" /><button className="btn primary" onClick={cargarCsd} disabled={busy}>{busy ? <span className="fact-spin" style={{ width: 14, height: 14, borderRadius: 999, border: '2px solid currentColor', borderTopColor: 'transparent', display: 'inline-block', marginRight: 6 }} /> : <Icon name="check" size={15} className="btn-ico" />}{backendReady ? 'Subir y validar CSD' : 'Validar y cargar CSD'}</button></div>
            </React.Fragment>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ============ Modal: Timbrado en proceso (sellado → PAC → SAT) ============ */
function TimbradoModal({ items, onDone, onClose }) {
  const list = items || [];
  const multi = list.length > 1;
  const env = window.pacEnvLabel();
  const STEPS = [
    ['Generando XML del comprobante…', 'doc'],
    ['Sellando con tu CSD…', 'lock'],
    ['Enviando al PAC (Facturama · ' + env + ')…', 'link'],
    ['Validando ante el SAT…', 'shield'],
  ];
  const real = !!(window.FacturamaAPI && window.FacturamaAPI.isReady());
  const [step, setStep] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const uuidsRef = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    async function run() {
      try {
        setStep(0); await wait(550); if (cancelled) return;
        setStep(1); await wait(700); if (cancelled) return;
        setStep(2); // Enviando al PAC
        let tfds;
        if (real) {
          const results = [];
          for (const f of list) {
            const r = await window.FacturamaAPI.timbrar(window.factBuildPayload(f, window.pacGet().env));
            results.push({ uuid: r.uuid, fechaTimbrado: r.fechaTimbrado, tfdVersion: '1.1', noCertSAT: r.noCertSAT, noCertEmisor: r.noCertEmisor, selloCFDI: r.selloCFDI, selloSAT: r.selloSAT, rfcPac: r.rfcPac, facturamaId: r.facturamaId });
          }
          tfds = results;
        } else {
          await wait(750);
          tfds = list.map(() => window.factBuildTimbre());
        }
        if (cancelled) return;
        setStep(3); await wait(650); if (cancelled) return;
        uuidsRef.current = tfds;
        setDone(true);
        onDone(tfds);
      } catch (e) {
        if (!cancelled) setErr((e && e.message) || 'No se pudo timbrar');
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <Modal open width={460} onClose={done || err ? onClose : undefined} title={multi ? 'Timbrando ' + list.length + ' comprobantes' : 'Timbrando ' + factFolio(list[0])}
      footer={(done || err) ? <button className="btn primary" onClick={onClose}>Cerrar</button> : null}>
      {err ? (
        <div className="col center gap-8" style={{ padding: '8px 0', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 999, background: 'var(--red-soft)', color: 'var(--red)', display: 'grid', placeItems: 'center' }}><Icon name="alert" size={26} /></div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>No se pudo timbrar</div>
          <div className="faint" style={{ fontSize: 12.5, maxWidth: 320 }}>{err}</div>
          <div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>El comprobante sigue como borrador; corrige y vuelve a intentar.</div>
        </div>
      ) : !done ? (
        <div className="col gap-10" style={{ padding: '4px 0' }}>
          {STEPS.map(([label, icon], i) => {
            const state = i < step ? 'ok' : i === step ? 'run' : 'idle';
            return (
              <div key={i} className="row center gap-10" style={{ opacity: state === 'idle' ? 0.4 : 1 }}>
                <div style={{ width: 30, height: 30, borderRadius: 999, display: 'grid', placeItems: 'center', flexShrink: 0, background: state === 'ok' ? 'var(--green-soft)' : 'var(--accent-soft)', color: state === 'ok' ? 'var(--green)' : 'var(--accent)' }}>
                  {state === 'ok' ? <Icon name="check" size={15} stroke={2.6} /> : state === 'run' ? <span className="fact-spin" style={{ width: 15, height: 15, borderRadius: 999, border: '2px solid var(--accent)', borderTopColor: 'transparent', display: 'block' }} /> : <Icon name={icon} size={14} />}
                </div>
                <span style={{ fontSize: 13.5, fontWeight: state === 'run' ? 600 : 500 }}>{label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="col center gap-8" style={{ padding: '8px 0', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 999, background: 'var(--green-soft)', color: 'var(--green)', display: 'grid', placeItems: 'center' }}><Icon name="check" size={26} stroke={2.6} /></div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{multi ? list.length + ' comprobantes timbrados' : 'Comprobante timbrado'}</div>
          <div className="faint" style={{ fontSize: 12.5 }}>CFDI con complemento IEDU · {real ? 'timbrado por Facturama (' + env + ') · valor fiscal' : 'simulación (' + env + ') · sin valor fiscal'}</div>
          {!multi && uuidsRef.current && (
            <div style={{ marginTop: 6, padding: '10px 12px', background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)', width: '100%', textAlign: 'left' }}>
              <div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Folio fiscal (UUID)</div>
              <div className="font-mono" style={{ fontSize: 12.5, fontWeight: 600, wordBreak: 'break-all' }}>{uuidsRef.current[0].uuid}</div>
              <div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 8 }}>Fecha de timbrado</div>
              <div className="font-mono" style={{ fontSize: 12 }}>{uuidsRef.current[0].fechaTimbrado.replace('T', ' ')}</div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Facturas({ go }) {
  const store = useStore();
  const pac = usePac();
  const pacOk = window.pacReady();
  const [filter, setFilter] = React.useState('Todas');
  const [q, setQ] = React.useState('');
  const [emit, setEmit] = React.useState(null); // {editFact} | {} cuando se emite nueva
  const [detail, setDetail] = React.useState(null);
  const [config, setConfig] = React.useState(false);
  const [timbrando, setTimbrando] = React.useState(null); // array de facturas en proceso
  const [apiInfo, setApiInfo] = React.useState(null);
  React.useEffect(() => { if (window.FacturamaAPI) window.FacturamaAPI.health().then(setApiInfo); }, []);

  const list = (DB.facturas || []).map(f => window.factResolveFactura(f));
  const timbradas = list.filter(f => f.status === 'timbrada');
  const montoFacturado = timbradas.reduce((a, f) => a + factTotal(f), 0);
  const ivaTrasladado = timbradas.reduce((a, f) => a + factIva(f), 0);
  const borradores = list.filter(f => f.status === 'borrador');

  const statusOf = { Todas: null, Timbradas: 'timbrada', Borradores: 'borrador', Canceladas: 'cancelada' };
  const shown = list.filter(f => {
    const byStatus = filter === 'Todas' || f.status === statusOf[filter];
    const text = (factFolio(f) + ' ' + f.alumno + ' ' + f.receptor + ' ' + f.rfc + ' ' + f.curp + ' ' + f.cct + ' ' + f.concept).toLowerCase();
    return byStatus && (!q.trim() || text.includes(q.toLowerCase()));
  }).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || Number(b.folio) - Number(a.folio));

  function timbrar(f) {
    if (!pacOk) { toast('Conecta Facturama y carga tu CSD para timbrar', 'warn'); setConfig(true); return; }
    setTimbrando([f]);
  }
  function timbrarLote() {
    if (!borradores.length) { toast('No hay borradores por timbrar', 'info'); return; }
    if (!pacOk) { toast('Conecta Facturama y carga tu CSD para timbrar en lote', 'warn'); setConfig(true); return; }
    setTimbrando(borradores);
  }
  function onTimbrado(tfds) {
    (timbrando || []).forEach((f, i) => Store.update('facturas', f._id, { status: 'timbrada', ...tfds[i] }));
    const n = (timbrando || []).length;
    Store.log('Tesorería', n > 1 ? ('timbró ' + n + ' comprobantes con Facturama (' + window.pacEnvLabel() + ')') : ('timbró ' + factFolio(timbrando[0]) + ' · ' + timbrando[0].receptor), 'receipt');
  }
  async function cancelar(f) {
    if (window.FacturamaAPI && window.FacturamaAPI.isReady() && f.facturamaId) {
      try { await window.FacturamaAPI.cancel({ id: f.facturamaId, env: window.pacGet().env, motive: '02' }); }
      catch (e) { toast('No se pudo cancelar: ' + ((e && e.message) || 'error'), 'warn'); return; }
    }
    Store.update('facturas', f._id, { status: 'cancelada' }); Store.log('Tesorería', 'canceló la factura ' + factFolio(f), 'receipt'); toast('Factura ' + factFolio(f) + ' cancelada', 'warn');
  }
  async function descargar(f, fmt) {
    if (window.FacturamaAPI && window.FacturamaAPI.isReady() && f.facturamaId) {
      try {
        const r = await window.FacturamaAPI.file(f.facturamaId, fmt, window.pacGet().env);
        const a = document.createElement('a');
        a.href = 'data:' + (r.ContentType || (fmt === 'pdf' ? 'application/pdf' : 'application/xml')) + ';base64,' + r.Content;
        a.download = factFolio(f) + '.' + fmt; a.click();
        toast(fmt.toUpperCase() + ' de ' + factFolio(f) + ' descargado ✓');
      } catch (e) { toast('No se pudo descargar el ' + fmt.toUpperCase() + ': ' + ((e && e.message) || 'error'), 'warn'); }
    } else { toast(fmt.toUpperCase() + ' de ' + factFolio(f) + ' descargado ✓'); }
  }
  function eliminar(f) { Store.remove('facturas', f._id); toast('Borrador eliminado', 'warn'); }

  function rowActions(f) {
    if (f.status === 'borrador') return [
      { icon: 'check', label: 'Timbrar factura', onClick: () => timbrar(f) },
      { icon: 'edit', label: 'Editar', onClick: () => setEmit({ editFact: f }) },
      { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => eliminar(f) },
    ];
    if (f.status === 'timbrada') return [
      { icon: 'eye', label: 'Ver detalle', onClick: () => setDetail(f) },
      { icon: 'download', label: 'Descargar PDF', onClick: () => descargar(f, 'pdf') },
      { icon: 'doc', label: 'Descargar XML', onClick: () => descargar(f, 'xml') },
      { icon: 'mail', label: 'Enviar por correo', onClick: () => toast('Factura enviada a ' + f.correo + ' ✓') },
      { icon: 'x', label: 'Cancelar factura', danger: true, onClick: () => cancelar(f) },
    ];
    return [
      { icon: 'eye', label: 'Ver detalle', onClick: () => setDetail(f) },
      { icon: 'doc', label: 'Descargar acuse', onClick: () => toast('Acuse de cancelación descargado ✓') },
    ];
  }

  const kpis = [
    { label: 'Facturas timbradas', value: String(timbradas.length), icon: 'receipt', tone: 'green' },
    { label: 'Monto facturado', value: fmtMoney(montoFacturado), icon: 'wallet', tone: 'blue' },
    { label: 'IVA trasladado', value: fmtMoney(ivaTrasladado), icon: 'bars', tone: 'violet' },
    { label: 'Por timbrar', value: String(borradores.length), icon: 'clock', tone: 'amber' },
  ];

  return (
    <div className="content-inner">
      <PageHead eyebrow="Tesorería" title="Facturas" desc={'CFDI 4.0 · ' + timbradas.length + ' timbradas · ' + fmtMoney(montoFacturado) + ' facturado'}>
        <button className="btn" onClick={() => setConfig(true)} title="Conexión con el PAC y certificado">
          <span style={{ width: 8, height: 8, borderRadius: 999, background: pacOk ? 'var(--green)' : 'var(--amber)', flexShrink: 0 }} />
          {pacOk ? 'Facturama · ' + window.pacEnvLabel() : 'PAC sin conectar'}
        </button>
        <button className="btn"><Icon name="download" size={15} className="btn-ico" />Descargar reporte</button>
        <button className="btn primary" onClick={() => setEmit({})}><Icon name="plus" size={15} className="btn-ico" />Emitir factura</button>
      </PageHead>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {kpis.map((k, i) => {
          const t = window.TONE[k.tone];
          return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum" style={{ fontSize: 26 }}>{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="card mt-16">
        <CardHead icon="receipt" title="Comprobantes emitidos" sub={shown.length + (shown.length === 1 ? ' factura' : ' facturas')}
          right={<div className="row center gap-8">
            <div style={{ position: 'relative' }}>
              <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
              <input className="inp" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar folio, alumno, RFC o CURP…" style={{ height: 34, padding: '0 10px 0 30px', fontSize: 12.5, width: 260 }} />
            </div>
            <div className="seg">{['Todas', 'Timbradas', 'Borradores', 'Canceladas'].map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div>
          </div>} />
        {shown.length === 0 ? (
          <div className="col center gap-8 faint" style={{ padding: 48, textAlign: 'center' }}>
            <div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 44, height: 44 }}><Icon name="receipt" size={20} /></div>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>Sin comprobantes</div>
            <div style={{ fontSize: 13 }}>Ningún comprobante coincide con el filtro.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Folio</th><th>Folio fiscal (UUID)</th><th>Receptor / RFC</th><th>Alumno · CURP</th><th>Nivel · CCT</th><th>Concepto</th><th className="num">Total</th><th>Estatus</th><th>Acciones</th></tr></thead>
              <tbody>
                {shown.map((f) => (
                  <tr key={f._id}>
                    <td><button className="font-mono" style={{ fontSize: 12.5, fontWeight: 600, border: 'none', background: 'transparent', color: 'var(--accent-strong)', cursor: 'pointer', padding: 0 }} onClick={() => setDetail(f)}>{factFolio(f)}</button></td>
                    <td>{f.uuid
                      ? <span className="font-mono faint" style={{ fontSize: 11.5 }} title={f.uuid}>{f.uuid.slice(0, 13)}…</span>
                      : <span className="faint" style={{ fontSize: 12 }}>— sin timbrar</span>}</td>
                    <td><div><div style={{ fontWeight: 600, fontSize: 13 }}>{f.receptor}</div><div className="faint font-mono" style={{ fontSize: 11 }}>{f.rfc}</div></div></td>
                    <td><div className="person"><Avatar name={f.alumno} size={28} /><div><div className="pname" style={{ fontSize: 12.5 }}>{f.alumno}</div><div className="faint font-mono" style={{ fontSize: 10.5 }}>{f.curp}</div></div></div></td>
                    <td><div className="row center gap-8"><Badge tone={window.nivelCfg ? nivelCfg(f.nivel).tone : 'blue'}>{f.nivelEdu}</Badge><span className="faint font-mono" style={{ fontSize: 11 }}>{f.cct}</span></div></td>
                    <td className="muted" style={{ maxWidth: 170 }}>{f.concept}</td>
                    <td className="num" style={{ fontWeight: 600 }}>{fmtMoney(factTotal(f))}{f.ivaRate ? <div className="faint" style={{ fontSize: 10.5, fontWeight: 400 }}>IVA {fmtMoney(factIva(f))}</div> : <div className="faint" style={{ fontSize: 10.5, fontWeight: 400 }}>Exento</div>}</td>
                    <td>{factStatusBadge(f.status)}</td>
                    <td><RowMenu items={rowActions(f)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="ai-panel mt-16">
        <div className="insight" style={{ borderTop: 'none', alignItems: 'center' }}>
          <div className="ai-orb" style={{ width: 34, height: 34 }}><Icon name="spark" size={18} fill="currentColor" /></div>
          <div className="insight-body">
            <div className="insight-title">Facturación asistida</div>
            <div className="insight-text">Copilot detecta <b>{borradores.length} borradores</b> listos para timbrar y empata cada pago conciliado con el receptor y CURP del alumno. Puede timbrar en lote y enviar el CFDI con complemento IEDU a cada familia.</div>
          </div>
          <button className="btn primary nowrap" onClick={timbrarLote}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Timbrar en lote</button>
        </div>
      </div>

      {emit && <EmitirFactura editFact={emit.editFact} onClose={() => setEmit(null)} pacReady={pacOk} onTimbrar={(rec) => setTimbrando([rec])} onConfig={() => setConfig(true)} />}
      <FacturaDetalle fact={detail} onClose={() => setDetail(null)} />
      {config && <ConfigFiscal apiInfo={apiInfo} onClose={() => setConfig(false)} />}
      {timbrando && <TimbradoModal items={timbrando} onDone={onTimbrado} onClose={() => setTimbrando(null)} />}
    </div>
  );
}

window.Facturas = Facturas;
