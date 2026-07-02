/* views_academic_real_only.jsx — Estudiantes V2 integrado: alta, pagos, facturación, acceso y credencial */

const EST_NIVELES = ['Preescolar', 'Primaria', 'Secundaria'];
const EST_REGIMENES = [
  { value: '', label: 'Selecciona régimen fiscal…' },
  { value: '601', label: '601 · General de Ley Personas Morales' },
  { value: '603', label: '603 · Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 · Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { value: '606', label: '606 · Arrendamiento' },
  { value: '607', label: '607 · Régimen de Enajenación o Adquisición de Bienes' },
  { value: '608', label: '608 · Demás ingresos' },
  { value: '610', label: '610 · Residentes en el Extranjero sin Establecimiento Permanente' },
  { value: '611', label: '611 · Ingresos por Dividendos' },
  { value: '612', label: '612 · Actividades Empresariales y Profesionales' },
  { value: '614', label: '614 · Ingresos por intereses' },
  { value: '615', label: '615 · Obtención de premios' },
  { value: '616', label: '616 · Sin obligaciones fiscales' },
  { value: '620', label: '620 · Sociedades Cooperativas de Producción' },
  { value: '621', label: '621 · Incorporación Fiscal' },
  { value: '622', label: '622 · Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { value: '623', label: '623 · Opcional para Grupos de Sociedades' },
  { value: '624', label: '624 · Coordinados' },
  { value: '625', label: '625 · Plataformas Tecnológicas' },
  { value: '626', label: '626 · Régimen Simplificado de Confianza' },
];
const EST_USOS_CFDI = [
  { value: 'S01', label: 'S01 · Sin efectos fiscales' },
  { value: 'D10', label: 'D10 · Pagos por servicios educativos' },
  { value: 'G03', label: 'G03 · Gastos en general' },
  { value: 'G01', label: 'G01 · Adquisición de mercancías' },
  { value: 'G02', label: 'G02 · Devoluciones, descuentos o bonificaciones' },
  { value: 'D01', label: 'D01 · Honorarios médicos, dentales y hospitalarios' },
  { value: 'D02', label: 'D02 · Gastos médicos por incapacidad o discapacidad' },
  { value: 'D03', label: 'D03 · Gastos funerales' },
  { value: 'D04', label: 'D04 · Donativos' },
  { value: 'D05', label: 'D05 · Intereses reales por créditos hipotecarios' },
  { value: 'D06', label: 'D06 · Aportaciones voluntarias al SAR' },
  { value: 'D07', label: 'D07 · Primas por seguros de gastos médicos' },
  { value: 'D08', label: 'D08 · Transportación escolar obligatoria' },
  { value: 'D09', label: 'D09 · Cuentas para el ahorro' },
  { value: 'I01', label: 'I01 · Construcciones' },
  { value: 'I02', label: 'I02 · Mobiliario y equipo de oficina' },
  { value: 'I03', label: 'I03 · Equipo de transporte' },
  { value: 'I04', label: 'I04 · Equipo de cómputo' },
  { value: 'I08', label: 'I08 · Otra maquinaria y equipo' },
];
function estClean(v) { return String(v || '').trim().replace(/\s+/g, ' '); }
function estDB() { window.DB = window.DB || {}; DB.settings = DB.settings || {}; DB.students = Array.isArray(DB.students) ? DB.students : []; DB.cobros = Array.isArray(DB.cobros) ? DB.cobros : []; return DB; }
function estTone(tone) { const t = window.TONE || {}; return t[tone] || t.blue || { c: 'var(--accent)', bg: 'var(--accent-soft)' }; }
function estIsSeedClass(c) { return /^cls-\d+$/i.test(String((c && c._id) || '')); }
function estClasses() { const db = estDB(); const del = new Set((db.settings && db.settings.deletedClassIds) || []); return (Array.isArray(db.clases) ? db.clases : []).filter(c => c && !estIsSeedClass(c) && !del.has(c._id) && estClean(c.g)).map(c => ({ ...c, nivel: c.nivel || 'Primaria', g: estClean(c.g) })); }
function estGroupsByNivel(nivel) { return estClasses().filter(c => !nivel || nivel === 'Todos' || c.nivel === nivel).map(c => c.g); }
function estInferNivel(grade) { const g = String(grade || ''); return /sec/i.test(g) ? 'Secundaria' : /^\s*k/i.test(g) ? 'Preescolar' : 'Primaria'; }
function estStudents() { const db = estDB(); return db.students.filter(s => s && s._id && estClean(s.name || s.nombre)).map(s => { const name = estClean(s.name || s.nombre); const grade = estClean(s.grade || s.group || s.grupo); const cls = estClasses().find(c => c.g === grade); return { ...s, name, grade, nivel: s.nivel || (cls ? cls.nivel : estInferNivel(grade)), real: true }; }); }
function estSlug(v) { return estClean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n').replace(/[^a-z0-9]/g, ''); }
function estNameParts(name) { const p = estClean(name).split(' ').filter(Boolean); return { first: p[0] || '', second: p.length > 3 ? p[1] : '', paternal: p.length >= 3 ? p[p.length - 2] : (p[1] || ''), maternal: p.length >= 3 ? p[p.length - 1] : '' }; }
function estGeneratedEmail(name, existingId) { const n = estNameParts(name); if (!n.first || !n.paternal) return ''; const base = estSlug(n.first) + (n.second ? estSlug(n.second).slice(0, 1) : '') + estSlug(n.paternal) + (n.maternal ? estSlug(n.maternal).slice(0, 1) : ''); const used = new Set(estStudents().filter(s => s._id !== existingId).map(s => String(s.email || '').toLowerCase()).filter(Boolean)); let email = base + '@jeanpiaget.mx', i = 2; while (used.has(email)) { email = base + i + '@jeanpiaget.mx'; i++; } return email; }
function estInitialKey(name, curp) { const a = estSlug(estNameParts(name).first).slice(0, 4) || 'jpgt'; const b = (estSlug(curp).slice(-4) || '2026').toUpperCase(); return a.charAt(0).toUpperCase() + a.slice(1) + b + String(Math.floor(100 + Math.random() * 900)); }
function estFiscalEmpty(stu = {}) { return { factura: false, razonSocial: '', rfc: '', regimenFiscal: '', usoCfdi: 'D10', cpFiscal: '', emailFacturacion: '', domicilioFiscal: '', complementoIE: { nombreAlumno: stu.name || '', curpAlumno: stu.curp || '', nivelEducativo: stu.nivel || '', autRVOE: '', rfcPago: '' } }; }
function estInitialPaymentsEmpty() { return { inscripcionPagada: false, inscripcion: 0, colegiatura: 0, cuotaAnual: 0, channel: 'Transferencia', detalle: '' }; }
function estPlanOptions(nivel) { try { const t = window.cobNivel && cobNivel(nivel); if (t && window.cobPlanTotalColeg) return [{ value: '10', label: 'Plan 10 · ' + fmtMoney(cobPlanTotalColeg(t, '10')) + ' colegiaturas' }, { value: '12', label: 'Plan 12 · ' + fmtMoney(cobPlanTotalColeg(t, '12')) + ' colegiaturas' }, { value: 'anual', label: 'Pago anual · ' + fmtMoney(cobPlanTotalColeg(t, 'anual')) }]; } catch (_) {} return [{ value: '10', label: 'Plan 10' }, { value: '12', label: 'Plan 12' }, { value: 'anual', label: 'Pago anual' }]; }
function estInscripcionAmount(nivel) { try { return window.cobNivel ? Number(cobNivel(nivel).inscripcion || 0) : 0; } catch (_) { return 0; } }
function estNextRecibo() { const max = estDB().cobros.reduce((m, c) => Math.max(m, Number(String(c.recibo || '').replace(/\D/g, '')) || 0), 4900); return 'REC-0' + (max + 1); }
function estAddCobroReal(sid, stu, concept, amount, channel, detalle) { const n = Number(amount) || 0; if (!n) return null; return Store.add('cobros', { recibo: estNextRecibo(), sid, student: stu.name, group: stu.grade, nivel: stu.nivel, family: 'Familia ' + String(stu.name || '').split(' ').slice(-1)[0], concept, amount: n, channel: channel || 'Transferencia', ref: detalle || '', folio: '', date: new Date().toISOString().slice(0, 10), time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), status: 'pagado', real: true }); }
function estRegisterInitialPayments(sid, stu, p) { let n = 0; if (p.inscripcionPagada && Number(p.inscripcion) > 0) { estAddCobroReal(sid, stu, 'Inscripción · ' + stu.name + ' (' + stu.grade + ')', p.inscripcion, p.channel, p.detalle); n++; } if (Number(p.colegiatura) > 0) { estAddCobroReal(sid, stu, 'Abono a cuenta colegiatura · ' + stu.name + ' (' + stu.grade + ')', p.colegiatura, 'Abono a cuenta', p.detalle); n++; } if (Number(p.cuotaAnual) > 0) { estAddCobroReal(sid, stu, 'Abono a cuenta cuota única anual · ' + stu.name + ' (' + stu.grade + ')', p.cuotaAnual, 'Abono a cuenta', p.detalle); n++; } return n; }
function estStudentAccounts() { const db = estDB(); db.settings.studentAccounts = Array.isArray(db.settings.studentAccounts) ? db.settings.studentAccounts : []; return db.settings.studentAccounts; }
function estUpsertStudentAccount(stu, key) { const list = estStudentAccounts(); const old = list.find(a => a.studentId === stu._id || a.email === stu.email); const acc = { id: old ? old.id : 'stuacc-' + Date.now(), studentId: stu._id, name: stu.name, email: stu.email, username: stu.email, key, role: 'Estudiante', kind: 'student', vista: 'home', status: 'Activo', createdAt: old ? old.createdAt : new Date().toISOString(), updatedAt: new Date().toISOString() }; estDB().settings.studentAccounts = old ? list.map(a => (a.id === old.id || a.studentId === stu._id) ? acc : a) : [acc, ...list]; return acc; }
function estInstallStudentAuth() { window.AUTH_RESOLVERS = window.AUTH_RESOLVERS || []; if (!window.AUTH_RESOLVERS.some(r => r && r.__estStudent)) { const r = function (id, secret) { const acc = estStudentAccounts().find(a => String(a.status || 'Activo') === 'Activo' && [a.email, a.username, a.studentId].map(x => String(x || '').toLowerCase()).includes(String(id || '').toLowerCase())); if (!acc) return null; if (String(acc.key || '') !== String(secret || '')) return { ok: false, error: 'Usuario o contraseña incorrectos.' }; return { name: acc.name, role: 'Estudiante', email: acc.email, kind: 'student', vista: 'home', students: [acc.studentId], studentId: acc.studentId }; }; r.__estStudent = true; window.AUTH_RESOLVERS.push(r); } if (window.PiagetAuth && !window.PiagetAuth.__estStudentFallback) { const original = window.PiagetAuth.authenticate; window.PiagetAuth.authenticate = async function (id, secret) { const ans = original ? await original(id, secret) : { ok: false }; if (ans && ans.ok) return ans; for (const fn of (window.AUTH_RESOLVERS || [])) { const local = fn(String(id || '').toLowerCase(), String(secret || '')); if (local && local.ok === false) return local; if (local) return { ok: true, account: local }; } return ans; }; window.PiagetAuth.__estStudentFallback = true; } }
function estPhotoFile(file, cb) { if (!file) return; const r = new FileReader(); r.onload = () => cb(String(r.result)); r.readAsDataURL(file); }
function estPrintCredential(stu) { if (window.jpPrintCredential) return jpPrintCredential(stu); const w = window.open('', '_blank'); if (!w) { toast('Permite ventanas emergentes para imprimir la credencial', 'warn'); return; } const photo = stu.photo ? '<img src="' + stu.photo + '">' : ''; const html = '<!doctype html><html><head><meta charset="utf-8"><title>Credencial</title><style>@page{size:86mm 54mm;margin:0}body{margin:0;background:#0b1a57;font-family:Arial;display:grid;place-items:center;min-height:100vh}.id{width:86mm;height:54mm;background:#fff;border-radius:6mm;overflow:hidden}.top{background:#0b1a57;color:#fff;padding:4mm 5mm;font-weight:900}.body{display:flex;gap:4mm;padding:5mm}.photo{width:23mm;height:28mm;background:#e8ecff;border-radius:4mm;overflow:hidden}.photo img{width:100%;height:100%;object-fit:cover}.name{font-weight:900;color:#0b1a57;font-size:4mm;text-transform:uppercase}.row{font-size:2.7mm;margin-top:1.5mm;color:#26345e}</style></head><body><div class="id"><div class="top">PIAGET · CREDENCIAL ESTUDIANTE</div><div class="body"><div class="photo">' + photo + '</div><div><div class="name">' + estClean(stu.name) + '</div><div class="row">Matrícula: ' + (stu.matricula || '—') + '</div><div class="row">Nivel: ' + (stu.nivel || '—') + '</div><div class="row">Grupo: ' + (stu.grade || stu.group || '—') + '</div><div class="row">CURP: ' + (stu.curp || '—') + '</div><div class="row">Correo: ' + (stu.email || '—') + '</div></div></div></div></body></html>'; w.document.open(); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 250); }
function estEmptyStudent() { const nivel = EST_NIVELES[0]; return { photo: '', name: '', email: '', nivel, grade: estGroupsByNivel(nivel)[0] || '', birth: '', curp: '', tutor: '', phone: '', plan: '10', hasBeca: false, beca: 0, initialPayments: estInitialPaymentsEmpty(), factura: false, fiscal: estFiscalEmpty({ nivel }), accessKey: '' }; }

function EstudianteModal({ entry, onClose }) {
  const [form, setForm] = React.useState(() => { const base = entry ? { ...estEmptyStudent(), ...entry } : estEmptyStudent(); const fiscal = { ...estFiscalEmpty(base), ...(base.fiscal || {}) }; fiscal.complementoIE = { ...estFiscalEmpty(base).complementoIE, ...(fiscal.complementoIE || {}), nombreAlumno: base.name || '', curpAlumno: base.curp || '', nivelEducativo: base.nivel || '' }; return { ...base, email: base.email || estGeneratedEmail(base.name, entry && entry._id), fiscal, factura: !!(base.factura || fiscal.factura), hasBeca: !!base.hasBeca || Number(base.beca) > 0, beca: Number(base.beca) || 0, initialPayments: estInitialPaymentsEmpty(), accessKey: (base.access && base.access.key) || '' }; });
  const photoRef = React.useRef(null);
  const groups = estGroupsByNivel(form.nivel);
  const fiscal = form.fiscal || estFiscalEmpty(form);
  const ie = fiscal.complementoIE || {};
  const ip = form.initialPayments || estInitialPaymentsEmpty();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setFiscal = (k, v) => setForm(f => ({ ...f, fiscal: { ...(f.fiscal || estFiscalEmpty(f)), [k]: v } }));
  const setIE = (k, v) => setForm(f => ({ ...f, fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), [k]: v } } }));
  const setPay = (k, v) => setForm(f => ({ ...f, initialPayments: { ...(f.initialPayments || estInitialPaymentsEmpty()), [k]: v } }));
  function updateName(v) { setForm(f => ({ ...f, name: v, email: estGeneratedEmail(v, entry && entry._id), fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), nombreAlumno: v } } })); }
  function updateCurp(v) { const curp = String(v || '').toUpperCase(); setForm(f => ({ ...f, curp, fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), curpAlumno: curp } } })); }
  function updateNivel(v) { const g = estGroupsByNivel(v)[0] || ''; setForm(f => ({ ...f, nivel: v, grade: g, plan: '10', fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), nivelEducativo: v } }, initialPayments: { ...(f.initialPayments || estInitialPaymentsEmpty()), inscripcion: f.initialPayments && f.initialPayments.inscripcionPagada ? estInscripcionAmount(v) : (f.initialPayments ? f.initialPayments.inscripcion : 0) } })); }
  function save() {
    if (!estClean(form.name)) return toast('Escribe el nombre completo', 'warn');
    if (!form.nivel) return toast('Selecciona el nivel', 'warn');
    if (!form.grade) return toast('Selecciona el grupo', 'warn');
    if (!form.birth) return toast('Selecciona la fecha de nacimiento', 'warn');
    if (!estClean(form.curp)) return toast('Captura la CURP', 'warn');
    if (!estClean(form.tutor)) return toast('Captura el nombre del tutor', 'warn');
    if (!estClean(form.phone)) return toast('Captura el teléfono', 'warn');
    const fiscalOut = { ...estFiscalEmpty(form), ...(form.fiscal || {}), factura: !!form.factura };
    fiscalOut.complementoIE = { ...estFiscalEmpty(form).complementoIE, ...(fiscalOut.complementoIE || {}), nombreAlumno: form.name, curpAlumno: form.curp, nivelEducativo: form.nivel };
    if (form.factura && (!estClean(fiscalOut.razonSocial) || !estClean(fiscalOut.rfc) || !estClean(fiscalOut.regimenFiscal) || !estClean(fiscalOut.usoCfdi) || !estClean(fiscalOut.cpFiscal))) return toast('Completa los datos fiscales obligatorios', 'warn');
    const email = estGeneratedEmail(form.name, entry && entry._id);
    const key = form.accessKey || estInitialKey(form.name, form.curp);
    const payload = { ...form, name: estClean(form.name), email, curp: String(form.curp || '').toUpperCase(), tutor: estClean(form.tutor), phone: estClean(form.phone), plan: form.plan || '10', hasBeca: !!form.hasBeca, beca: form.hasBeca ? Math.max(0, Math.min(100, Number(form.beca) || 0)) : 0, factura: !!form.factura, fiscal: fiscalOut, access: { username: email, key, role: 'Estudiante', status: 'Activo' }, manual: true, real: true };
    const initial = { ...(form.initialPayments || estInitialPaymentsEmpty()) };
    delete payload.initialPayments; delete payload.accessKey; delete payload.avg;
    let saved;
    if (entry && entry._id) { Store.update('students', entry._id, payload); saved = { _id: entry._id, ...payload }; }
    else { saved = Store.add('students', { ...payload, matricula: 'EST-2026-' + String(1001 + estStudents().length).padStart(4, '0') }); }
    const acc = estUpsertStudentAccount(saved, key);
    const pays = estRegisterInitialPayments(saved._id, saved, initial);
    try { if (Store.saveState) Store.saveState(); } catch (_) {}
    toast('Estudiante guardado · usuario ' + acc.email + (pays ? ' · pagos reales: ' + pays : ''), 'ok');
    onClose();
  }
  return <Modal open width={880} title={entry ? 'Editar estudiante' : 'Alta de nuevo estudiante'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn" onClick={() => estPrintCredential({ ...form, matricula: entry && entry.matricula })}><Icon name="print" size={15} className="btn-ico" />Vista credencial</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar alta</button></>}>
    <div className="col" style={{ gap: 16 }}>
      <div className="row center gap-12"><div onClick={() => photoRef.current && photoRef.current.click()} style={{ width: 78, height: 78, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{form.photo ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={30} className="faint" />}</div><div><button className="btn sm" onClick={() => photoRef.current && photoRef.current.click()}><Icon name="plus" size={12} className="btn-ico" />Subir foto</button><div className="faint" style={{ fontSize: 12, marginTop: 6 }}>Se usará en expediente y credencial.</div></div><input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => estPhotoFile(e.target.files[0], url => set('photo', url))} /></div>
      <div className="eyebrow">Datos del estudiante</div>
      <Field label="Nombre completo"><TextInput value={form.name || ''} onChange={e => updateName(e.target.value)} placeholder="Primer nombre Segundo nombre Apellido paterno Apellido materno" autoFocus /></Field>
      <Field label="Correo institucional"><TextInput value={form.email || ''} readOnly placeholder="Primer nombre + inicial segundo nombre + primer apellido + inicial segundo apellido" /></Field>
      <div className="field-row"><Field label="Nivel"><SelectInput value={form.nivel} onChange={e => updateNivel(e.target.value)} options={EST_NIVELES} /></Field><Field label="Grupo"><SelectInput value={form.grade || ''} onChange={e => set('grade', e.target.value)} options={groups.length ? groups : [{ value: '', label: 'Crea grupos reales primero' }]} /></Field></div>
      <div className="field-row"><Field label="Fecha de nacimiento"><input className="inp" type="date" value={form.birth || ''} onChange={e => set('birth', e.target.value)} /></Field><Field label="CURP"><TextInput value={form.curp || ''} onChange={e => updateCurp(e.target.value)} /></Field></div>
      <div className="field-row"><Field label="Nombre del tutor"><TextInput value={form.tutor || ''} onChange={e => set('tutor', e.target.value)} /></Field><Field label="Teléfono"><TextInput value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></Field></div>
      <div className="eyebrow">Plan de pagos</div>
      <div className="field-row"><Field label="Plan de pagos según nivel"><SelectInput value={form.plan || '10'} onChange={e => set('plan', e.target.value)} options={estPlanOptions(form.nivel)} /></Field><Field label="¿Tiene beca?"><SelectInput value={form.hasBeca ? 'si' : 'no'} onChange={e => setForm(f => ({ ...f, hasBeca: e.target.value === 'si', beca: e.target.value === 'si' ? f.beca : 0 }))} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field><Field label="% beca colegiaturas"><NumberInput min="0" max="100" value={form.hasBeca ? (form.beca || 0) : 0} disabled={!form.hasBeca} onChange={e => set('beca', e.target.value)} /></Field></div>
      <div className="field-row"><Field label="¿Paga inscripción?"><SelectInput value={ip.inscripcionPagada ? 'si' : 'no'} onChange={e => { const yes = e.target.value === 'si'; setForm(f => ({ ...f, initialPayments: { ...(f.initialPayments || estInitialPaymentsEmpty()), inscripcionPagada: yes, inscripcion: yes ? (Number(f.initialPayments && f.initialPayments.inscripcion) || estInscripcionAmount(f.nivel)) : 0 } })); }} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field><Field label="Monto pagado inscripción"><NumberInput min="0" value={ip.inscripcion || 0} disabled={!ip.inscripcionPagada} onChange={e => setPay('inscripcion', e.target.value)} /></Field></div>
      <div className="field-row"><Field label="Abono a cuenta colegiatura"><NumberInput min="0" value={ip.colegiatura || 0} onChange={e => setPay('colegiatura', e.target.value)} /></Field><Field label="Abono a cuenta cuota única anual"><NumberInput min="0" value={ip.cuotaAnual || 0} onChange={e => setPay('cuotaAnual', e.target.value)} /></Field></div>
      <div className="field-row"><Field label="Forma de pago"><SelectInput value={ip.channel || 'Transferencia'} onChange={e => setPay('channel', e.target.value)} options={['Transferencia', 'Tarjeta', 'Efectivo', 'Domiciliación', 'Abono a cuenta']} /></Field><Field label="Detalle"><TextInput value={ip.detalle || ''} onChange={e => setPay('detalle', e.target.value)} placeholder="Folio, SPEI, caja, observaciones" /></Field></div>
      <div className="faint" style={{ fontSize: 12 }}>No se registra ningún pago si los montos quedan en cero.</div>
      <div className="eyebrow">Facturación</div>
      <Field label="¿Factura el estudiante?"><SelectInput value={form.factura ? 'si' : 'no'} onChange={e => set('factura', e.target.value === 'si')} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field>
      {form.factura && <div className="col" style={{ gap: 12 }}><div className="field-row"><Field label="Razón social"><TextInput value={fiscal.razonSocial || ''} onChange={e => setFiscal('razonSocial', e.target.value.toUpperCase())} /></Field><Field label="RFC"><TextInput value={fiscal.rfc || ''} onChange={e => setFiscal('rfc', e.target.value.toUpperCase())} /></Field></div><div className="field-row"><Field label="Régimen fiscal"><SelectInput value={fiscal.regimenFiscal || ''} onChange={e => setFiscal('regimenFiscal', e.target.value)} options={EST_REGIMENES} /></Field><Field label="Uso CFDI"><SelectInput value={fiscal.usoCfdi || 'D10'} onChange={e => setFiscal('usoCfdi', e.target.value)} options={EST_USOS_CFDI} /></Field></div><div className="field-row"><Field label="Código postal"><TextInput value={fiscal.cpFiscal || ''} onChange={e => setFiscal('cpFiscal', e.target.value)} /></Field><Field label="Correo de facturación"><TextInput value={fiscal.emailFacturacion || ''} onChange={e => setFiscal('emailFacturacion', e.target.value.toLowerCase())} /></Field></div><Field label="Domicilio fiscal"><TextInput value={fiscal.domicilioFiscal || ''} onChange={e => setFiscal('domicilioFiscal', e.target.value)} /></Field><div className="eyebrow">Complemento de Instituciones Educativas</div><div className="field-row"><Field label="Nombre alumno"><TextInput value={ie.nombreAlumno || form.name || ''} onChange={e => setIE('nombreAlumno', e.target.value)} /></Field><Field label="CURP alumno"><TextInput value={ie.curpAlumno || form.curp || ''} onChange={e => setIE('curpAlumno', e.target.value.toUpperCase())} /></Field></div><div className="field-row"><Field label="Nivel educativo"><SelectInput value={ie.nivelEducativo || form.nivel} onChange={e => setIE('nivelEducativo', e.target.value)} options={EST_NIVELES} /></Field><Field label="Autorización / RVOE"><TextInput value={ie.autRVOE || ''} onChange={e => setIE('autRVOE', e.target.value)} /></Field></div><Field label="RFC de quien realiza el pago"><TextInput value={ie.rfcPago || ''} onChange={e => setIE('rfcPago', e.target.value.toUpperCase())} /></Field></div>}
      <div className="eyebrow">Credenciales de acceso</div>
      <div className="field-row"><Field label="Usuario"><TextInput value={form.email || ''} readOnly /></Field><Field label="Clave inicial"><TextInput value={form.accessKey || ''} onChange={e => set('accessKey', e.target.value)} placeholder="Se genera al guardar si se deja vacío" /></Field></div>
    </div>
  </Modal>;
}

function AcademicoRealOnly({ go }) {
  estInstallStudentAuth();
  if (typeof useStore === 'function') useStore();
  const [, force] = React.useReducer(x => x + 1, 0);
  const [nivel, setNivel] = React.useState('Todos');
  const [grupo, setGrupo] = React.useState('Todos');
  const [search, setSearch] = React.useState('');
  const [modal, setModal] = React.useState(null);
  const students = estStudents();
  const classes = estClasses();
  const filtered = students.filter(s => (nivel === 'Todos' || s.nivel === nivel) && (grupo === 'Todos' || s.grade === grupo) && (!search.trim() || s.name.toLowerCase().includes(search.trim().toLowerCase())));
  const grupos = ['Todos', ...Array.from(new Set(students.filter(s => nivel === 'Todos' || s.nivel === nivel).map(s => s.grade).filter(Boolean)))];
  const kpis = [{ label: 'Estudiantes', value: String(students.length), icon: 'cap', tone: 'blue' }, { label: 'Grupos reales', value: String(classes.length), icon: 'layers', tone: 'cyan' }, { label: 'Con acceso', value: String(estStudentAccounts().length), icon: 'lock', tone: 'green' }, { label: 'Facturan', value: String(students.filter(s => s.factura || (s.fiscal && s.fiscal.factura)).length), icon: 'receipt', tone: 'violet' }, { label: 'Becados', value: String(students.filter(s => Number(s.beca) > 0 || s.hasBeca).length), icon: 'award', tone: 'amber' }];
  function remove(s) { Store.remove('students', s._id); try { if (Store.saveState) Store.saveState(); } catch (_) {} toast('Estudiante eliminado', 'warn'); force(); }
  return <div className="content-inner"><PageHead eyebrow="Administración" title="Estudiantes" desc="Alta integral con expediente, pagos, facturación, acceso y credencial."><button className="btn" onClick={() => go && go('clases')}><Icon name="layers" size={15} className="btn-ico" />Clases</button><button className="btn primary" onClick={() => setModal({})}><Icon name="plus" size={15} className="btn-ico" />Nuevo estudiante</button></PageHead>
    <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>{kpis.map((k, i) => { const t = estTone(k.tone); return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>; })}</div>
    <div className="row between center wrap gap-12 mt-16" style={{ marginBottom: 12 }}><div className="seg">{['Todos', ...EST_NIVELES].map(n => <button key={n} className={nivel === n ? 'active' : ''} onClick={() => { setNivel(n); setGrupo('Todos'); }}>{n}</button>)}</div><select className="inp" value={grupo} onChange={e => setGrupo(e.target.value)} style={{ height: 34, width: 190 }}>{grupos.map(g => <option key={g} value={g}>{g === 'Todos' ? 'Todos los grupos' : g}</option>)}</select><input className="inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar estudiante" style={{ height: 34, width: 220 }} /></div>
    <div className="card"><CardHead icon="users" title="Lista de estudiantes" sub="Registros reales" /><div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Alumno</th><th>Nivel / grupo</th><th>Plan</th><th>Beca</th><th>Factura</th><th>Acceso</th><th></th></tr></thead><tbody>{filtered.map(s => { const acc = estStudentAccounts().find(a => a.studentId === s._id || a.email === s.email); return <tr key={s._id}><td><div className="person">{s.photo ? <img src={s.photo} alt="" style={{ width: 32, height: 32, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }} /> : <Avatar name={s.name} size={32} />}<div><div className="pname">{s.name}</div><div className="pmeta">{s.email || 'Sin correo'}</div></div></div></td><td><div className="row center gap-8"><Badge tone={window.nivelCfg ? nivelCfg(s.nivel).tone : 'blue'}>{s.nivel}</Badge><span className="font-mono" style={{ fontSize: 12.5 }}>{s.grade || '—'}</span></div></td><td><Badge tone="blue">{window.cobPlanLabel ? cobPlanLabel(s.plan || '10') : (s.plan || '10')}</Badge></td><td>{Number(s.beca) > 0 ? <Badge tone="green">{s.beca}%</Badge> : <Badge tone="gray">Sin beca</Badge>}</td><td>{s.factura || (s.fiscal && s.fiscal.factura) ? <Badge tone="violet">Factura</Badge> : <Badge tone="gray">No</Badge>}</td><td>{acc ? <Badge tone="green">Activo</Badge> : <Badge tone="gray">Pendiente</Badge>}</td><td><RowMenu items={[{ icon: 'edit', label: 'Editar', onClick: () => setModal(s) }, { icon: 'print', label: 'Imprimir credencial', onClick: () => estPrintCredential(s) }, { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => remove(s) }]} /></td></tr>; })}{!filtered.length && <tr><td colSpan="7" className="faint" style={{ textAlign: 'center', padding: 32 }}>{classes.length ? 'Sin estudiantes reales para este filtro.' : 'Crea grupos reales en Clases y después registra estudiantes.'}</td></tr>}</tbody></table></div></div>
    {modal && <EstudianteModal entry={modal._id ? modal : null} onClose={() => { setModal(null); force(); }} />}
  </div>;
}
function Academico(props) { try { return <AcademicoRealOnly {...props} />; } catch (e) { console.warn('[PIAGET] Error en Estudiantes V2', e); return <div className="content-inner"><PageHead eyebrow="Administración" title="Estudiantes" desc="Módulo en modo seguro." /><div className="card pad faint" style={{ textAlign: 'center', padding: 34 }}>No se pudo renderizar Estudiantes. Recarga la página y verifica que existan grupos reales en Clases.</div></div>; } }
estInstallStudentAuth();
Object.assign(window, { Academico, AcademicoRealOnly, estStudents, estClasses, estGeneratedEmail, estPrintCredential, estStudentAccounts });
