/* student_enrollment_form_patch.jsx — Alta de estudiante V2 */

const JP_REGIMENES = [
  { value: '', label: 'Selecciona régimen fiscal…' },
  { value: '601', label: '601 · General de Ley Personas Morales' },
  { value: '603', label: '603 · Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 · Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { value: '606', label: '606 · Arrendamiento' },
  { value: '607', label: '607 · Enajenación o Adquisición de Bienes' },
  { value: '608', label: '608 · Demás ingresos' },
  { value: '610', label: '610 · Residentes en el Extranjero sin Establecimiento Permanente' },
  { value: '611', label: '611 · Dividendos' },
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
const JP_USOS = [
  { value: 'S01', label: 'S01 · Sin efectos fiscales' },
  { value: 'D10', label: 'D10 · Pagos por servicios educativos' },
  { value: 'G03', label: 'G03 · Gastos en general' },
  { value: 'G01', label: 'G01 · Adquisición de mercancías' },
  { value: 'G02', label: 'G02 · Devoluciones, descuentos o bonificaciones' },
  { value: 'D01', label: 'D01 · Honorarios médicos y hospitalarios' },
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
const JP_NIVELES_ALTA = ['Preescolar', 'Primaria', 'Secundaria'];
function jpEclean(v) { return String(v || '').trim().replace(/\s+/g, ' '); }
function jpEgroups(nivel) { return (typeof estClasses === 'function' ? estClasses() : ((DB && DB.clases) || [])).filter(c => !nivel || c.nivel === nivel).map(c => c.g).filter(Boolean); }
function jpEfmt(v) { return window.fmtMoney ? fmtMoney(v || 0) : '$' + Number(v || 0).toLocaleString('es-MX'); }
function jpEplans(nivel) {
  try {
    const t = window.cobNivel ? cobNivel(nivel) : null;
    if (t && window.cobPlanTotalColeg) return [
      { value: '10', label: 'Plan 10 · ' + jpEfmt(cobPlanTotalColeg(t, '10')) + ' colegiaturas' },
      { value: '12', label: 'Plan 12 · ' + jpEfmt(cobPlanTotalColeg(t, '12')) + ' colegiaturas' },
      { value: 'anual', label: 'Pago anual · ' + jpEfmt(cobPlanTotalColeg(t, 'anual')) },
    ];
  } catch (_) {}
  return [{ value: '10', label: 'Plan 10' }, { value: '12', label: 'Plan 12' }, { value: 'anual', label: 'Pago anual' }];
}
function jpEinscripcion(nivel) { try { return window.cobNivel ? Number(cobNivel(nivel).inscripcion || 0) : 0; } catch (_) { return 0; } }
function jpEfiscal(stu) { return { factura: false, razonSocial: '', rfc: '', regimenFiscal: '', usoCfdi: 'D10', cpFiscal: '', emailFacturacion: '', domicilioFiscal: '', complementoIE: { nombreAlumno: stu && stu.name || '', curpAlumno: stu && stu.curp || '', nivelEducativo: stu && stu.nivel || '', autRVOE: '', rfcPago: '' } }; }
function jpEpay() { return { inscripcionPagada: false, inscripcion: 0, colegiatura: 0, cuotaAnual: 0, channel: 'Transferencia', detalle: '' }; }
function jpEnextRecibo() { const max = ((DB && DB.cobros) || []).reduce((m, c) => Math.max(m, Number(String(c.recibo || '').replace(/\D/g, '')) || 0), 4900); return 'REC-0' + (max + 1); }
function jpEaddCobro(sid, stu, concept, amount, channel, detalle) {
  const n = Number(amount) || 0;
  if (!n) return null;
  return Store.add('cobros', { recibo: jpEnextRecibo(), sid, student: stu.name, group: stu.grade, nivel: stu.nivel, family: 'Familia ' + String(stu.name).split(' ').slice(-1)[0], concept, amount: n, channel: channel || 'Transferencia', ref: detalle || '', folio: '', date: new Date().toISOString().slice(0, 10), time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), status: 'pagado', real: true });
}
function jpEregisterPayments(sid, stu, p) {
  let n = 0;
  if (p.inscripcionPagada && Number(p.inscripcion) > 0) { jpEaddCobro(sid, stu, 'Inscripción · ' + stu.name + ' (' + stu.grade + ')', p.inscripcion, p.channel, p.detalle); n++; }
  if (Number(p.colegiatura) > 0) { jpEaddCobro(sid, stu, 'Abono a cuenta colegiatura · ' + stu.name + ' (' + stu.grade + ')', p.colegiatura, 'Abono a cuenta', p.detalle); n++; }
  if (Number(p.cuotaAnual) > 0) { jpEaddCobro(sid, stu, 'Abono a cuenta cuota única anual · ' + stu.name + ' (' + stu.grade + ')', p.cuotaAnual, 'Abono a cuenta', p.detalle); n++; }
  return n;
}
function jpEempty() {
  const nivel = JP_NIVELES_ALTA[0];
  return { photo: '', name: '', email: '', nivel, grade: jpEgroups(nivel)[0] || '', birth: '', curp: '', tutor: '', phone: '', plan: '10', hasBeca: false, beca: 0, initialPayments: jpEpay(), factura: false, fiscal: jpEfiscal({ nivel }), accessKey: '' };
}
function StudentEnrollmentV2Modal({ entry, onClose }) {
  const [form, setForm] = React.useState(() => {
    const base = entry ? { ...jpEempty(), ...entry } : jpEempty();
    const fiscal = { ...jpEfiscal(base), ...(base.fiscal || {}) };
    fiscal.complementoIE = { ...jpEfiscal(base).complementoIE, ...(fiscal.complementoIE || {}), nombreAlumno: base.name || '', curpAlumno: base.curp || '', nivelEducativo: base.nivel || '' };
    return { ...base, email: base.email || (window.jpStudentEmail ? jpStudentEmail(base.name, entry && entry._id) : ''), fiscal, factura: !!(base.factura || fiscal.factura), hasBeca: !!base.hasBeca || Number(base.beca) > 0, beca: Number(base.beca) || 0, initialPayments: jpEpay(), accessKey: (base.access && base.access.key) || '' };
  });
  const photoRef = React.useRef(null);
  const groups = jpEgroups(form.nivel);
  const fiscal = form.fiscal || jpEfiscal(form);
  const ie = fiscal.complementoIE || {};
  const ip = form.initialPayments || jpEpay();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setFiscal = (k, v) => setForm(f => ({ ...f, fiscal: { ...(f.fiscal || jpEfiscal(f)), [k]: v } }));
  const setIE = (k, v) => setForm(f => ({ ...f, fiscal: { ...(f.fiscal || jpEfiscal(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), [k]: v } } }));
  const setPay = (k, v) => setForm(f => ({ ...f, initialPayments: { ...(f.initialPayments || jpEpay()), [k]: v } }));
  function photo(file) { if (!file) return; const r = new FileReader(); r.onload = () => set('photo', String(r.result)); r.readAsDataURL(file); }
  function updateName(v) { setForm(f => ({ ...f, name: v, email: window.jpStudentEmail ? jpStudentEmail(v, entry && entry._id) : '', fiscal: { ...(f.fiscal || jpEfiscal(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), nombreAlumno: v } } })); }
  function updateCurp(v) { const curp = String(v || '').toUpperCase(); setForm(f => ({ ...f, curp, fiscal: { ...(f.fiscal || jpEfiscal(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), curpAlumno: curp } } })); }
  function updateNivel(v) { const g = jpEgroups(v)[0] || ''; setForm(f => ({ ...f, nivel: v, grade: g, plan: '10', fiscal: { ...(f.fiscal || jpEfiscal(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), nivelEducativo: v } }, initialPayments: { ...(f.initialPayments || jpEpay()), inscripcion: f.initialPayments && f.initialPayments.inscripcionPagada ? jpEinscripcion(v) : (f.initialPayments ? f.initialPayments.inscripcion : 0) } })); }
  function save() {
    if (!jpEclean(form.name)) { toast('Escribe el nombre completo', 'warn'); return; }
    if (!form.nivel) { toast('Selecciona el nivel', 'warn'); return; }
    if (!form.grade) { toast('Selecciona el grupo', 'warn'); return; }
    if (!form.birth) { toast('Selecciona la fecha de nacimiento', 'warn'); return; }
    if (!jpEclean(form.curp)) { toast('Captura la CURP', 'warn'); return; }
    if (!jpEclean(form.tutor)) { toast('Captura el nombre del tutor', 'warn'); return; }
    if (!jpEclean(form.phone)) { toast('Captura el teléfono', 'warn'); return; }
    const fiscalOut = { ...jpEfiscal(form), ...(form.fiscal || {}), factura: !!form.factura };
    fiscalOut.complementoIE = { ...jpEfiscal(form).complementoIE, ...(fiscalOut.complementoIE || {}), nombreAlumno: form.name, curpAlumno: form.curp, nivelEducativo: form.nivel };
    if (form.factura && (!jpEclean(fiscalOut.razonSocial) || !jpEclean(fiscalOut.rfc) || !jpEclean(fiscalOut.regimenFiscal) || !jpEclean(fiscalOut.usoCfdi) || !jpEclean(fiscalOut.cpFiscal))) { toast('Completa los datos fiscales obligatorios', 'warn'); return; }
    const email = window.jpStudentEmail ? jpStudentEmail(form.name, entry && entry._id) : form.email;
    const key = form.accessKey || (window.jpStudentKey ? jpStudentKey(form.name, form.curp) : 'Piaget2026');
    const payload = { ...form, name: jpEclean(form.name), email, curp: String(form.curp || '').toUpperCase(), tutor: jpEclean(form.tutor), phone: jpEclean(form.phone), plan: form.plan || '10', hasBeca: !!form.hasBeca, beca: form.hasBeca ? Math.max(0, Math.min(100, Number(form.beca) || 0)) : 0, factura: !!form.factura, fiscal: fiscalOut, access: { username: email, key, role: 'Estudiante', status: 'Activo' }, manual: true, real: true };
    const initial = { ...(form.initialPayments || jpEpay()) };
    delete payload.initialPayments; delete payload.accessKey; delete payload.avg;
    let saved;
    if (entry && entry._id) { Store.update('students', entry._id, payload); saved = { _id: entry._id, ...payload }; }
    else { saved = Store.add('students', { ...payload, matricula: 'EST-2026-' + String(1001 + ((DB.students || []).length)).padStart(4, '0') }); }
    if (window.jpUpsertStudentAccount) jpUpsertStudentAccount({ ...saved, accessKey: key });
    const pays = jpEregisterPayments(saved._id, saved, initial);
    try { if (Store.saveState) Store.saveState(); } catch (_) {}
    toast('Estudiante guardado · usuario ' + email + (pays ? ' · pagos reales: ' + pays : ''), 'ok');
    onClose();
  }
  return <Modal open width={880} title={entry ? 'Editar estudiante' : 'Alta de nuevo estudiante'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn" onClick={() => window.jpPrintCredential && jpPrintCredential({ ...form, matricula: entry && entry.matricula })}><Icon name="print" size={15} className="btn-ico" />Vista credencial</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar alta</button></>}>
    <div className="col" style={{ gap: 16 }}>
      <div className="row center gap-12"><div onClick={() => photoRef.current && photoRef.current.click()} style={{ width: 78, height: 78, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{form.photo ? <img src={form.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={30} className="faint" />}</div><div><button className="btn sm" onClick={() => photoRef.current && photoRef.current.click()}><Icon name="plus" size={12} className="btn-ico" />Subir foto</button><div className="faint" style={{ fontSize: 12, marginTop: 6 }}>Se usará en expediente y credencial.</div></div><input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => photo(e.target.files[0])} /></div>
      <div className="eyebrow">Datos del estudiante</div><Field label="Nombre completo"><TextInput value={form.name || ''} onChange={e => updateName(e.target.value)} placeholder="Primer nombre Segundo nombre Apellido paterno Apellido materno" autoFocus /></Field><Field label="Correo institucional"><TextInput value={form.email || ''} readOnly /></Field><div className="field-row"><Field label="Nivel"><SelectInput value={form.nivel} onChange={e => updateNivel(e.target.value)} options={JP_NIVELES_ALTA} /></Field><Field label="Grupo"><SelectInput value={form.grade || ''} onChange={e => set('grade', e.target.value)} options={groups.length ? groups : [{ value: '', label: 'Crea grupos reales primero' }]} /></Field></div><div className="field-row"><Field label="Fecha de nacimiento"><input className="inp" type="date" value={form.birth || ''} onChange={e => set('birth', e.target.value)} /></Field><Field label="CURP"><TextInput value={form.curp || ''} onChange={e => updateCurp(e.target.value)} /></Field></div><div className="field-row"><Field label="Nombre del tutor"><TextInput value={form.tutor || ''} onChange={e => set('tutor', e.target.value)} /></Field><Field label="Teléfono"><TextInput value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></Field></div>
      <div className="eyebrow">Plan de pagos</div><div className="field-row"><Field label="Plan de pagos según nivel"><SelectInput value={form.plan || '10'} onChange={e => set('plan', e.target.value)} options={jpEplans(form.nivel)} /></Field><Field label="¿Tiene beca?"><SelectInput value={form.hasBeca ? 'si' : 'no'} onChange={e => setForm(f => ({ ...f, hasBeca: e.target.value === 'si', beca: e.target.value === 'si' ? f.beca : 0 }))} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field><Field label="% beca colegiaturas"><NumberInput min="0" max="100" value={form.hasBeca ? (form.beca || 0) : 0} disabled={!form.hasBeca} onChange={e => set('beca', e.target.value)} /></Field></div><div className="field-row"><Field label="¿Paga inscripción?"><SelectInput value={ip.inscripcionPagada ? 'si' : 'no'} onChange={e => { const yes = e.target.value === 'si'; setForm(f => ({ ...f, initialPayments: { ...(f.initialPayments || jpEpay()), inscripcionPagada: yes, inscripcion: yes ? (Number(f.initialPayments && f.initialPayments.inscripcion) || jpEinscripcion(f.nivel)) : 0 } })); }} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field><Field label="Monto pagado inscripción"><NumberInput min="0" value={ip.inscripcion || 0} disabled={!ip.inscripcionPagada} onChange={e => setPay('inscripcion', e.target.value)} /></Field></div><div className="field-row"><Field label="Abono a cuenta colegiatura"><NumberInput min="0" value={ip.colegiatura || 0} onChange={e => setPay('colegiatura', e.target.value)} /></Field><Field label="Abono a cuenta cuota única anual"><NumberInput min="0" value={ip.cuotaAnual || 0} onChange={e => setPay('cuotaAnual', e.target.value)} /></Field></div><div className="field-row"><Field label="Forma de pago"><SelectInput value={ip.channel || 'Transferencia'} onChange={e => setPay('channel', e.target.value)} options={['Transferencia', 'Tarjeta', 'Efectivo', 'Domiciliación', 'Abono a cuenta']} /></Field><Field label="Detalle"><TextInput value={ip.detalle || ''} onChange={e => setPay('detalle', e.target.value)} placeholder="Folio, SPEI, caja, observaciones" /></Field></div>
      <div className="eyebrow">Facturación</div><Field label="¿Factura el estudiante?"><SelectInput value={form.factura ? 'si' : 'no'} onChange={e => set('factura', e.target.value === 'si')} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field>{form.factura && <div className="col" style={{ gap: 12 }}><div className="field-row"><Field label="Razón social"><TextInput value={fiscal.razonSocial || ''} onChange={e => setFiscal('razonSocial', e.target.value.toUpperCase())} /></Field><Field label="RFC"><TextInput value={fiscal.rfc || ''} onChange={e => setFiscal('rfc', e.target.value.toUpperCase())} /></Field></div><div className="field-row"><Field label="Régimen fiscal"><SelectInput value={fiscal.regimenFiscal || ''} onChange={e => setFiscal('regimenFiscal', e.target.value)} options={JP_REGIMENES} /></Field><Field label="Uso CFDI"><SelectInput value={fiscal.usoCfdi || 'D10'} onChange={e => setFiscal('usoCfdi', e.target.value)} options={JP_USOS} /></Field></div><div className="field-row"><Field label="Código postal"><TextInput value={fiscal.cpFiscal || ''} onChange={e => setFiscal('cpFiscal', e.target.value)} /></Field><Field label="Correo de facturación"><TextInput value={fiscal.emailFacturacion || ''} onChange={e => setFiscal('emailFacturacion', e.target.value.toLowerCase())} /></Field></div><Field label="Domicilio fiscal"><TextInput value={fiscal.domicilioFiscal || ''} onChange={e => setFiscal('domicilioFiscal', e.target.value)} /></Field><div className="eyebrow">Complemento de Instituciones Educativas</div><div className="field-row"><Field label="Nombre alumno"><TextInput value={ie.nombreAlumno || form.name || ''} onChange={e => setIE('nombreAlumno', e.target.value)} /></Field><Field label="CURP alumno"><TextInput value={ie.curpAlumno || form.curp || ''} onChange={e => setIE('curpAlumno', e.target.value.toUpperCase())} /></Field></div><div className="field-row"><Field label="Nivel educativo"><SelectInput value={ie.nivelEducativo || form.nivel} onChange={e => setIE('nivelEducativo', e.target.value)} options={JP_NIVELES_ALTA} /></Field><Field label="Autorización / RVOE"><TextInput value={ie.autRVOE || ''} onChange={e => setIE('autRVOE', e.target.value)} /></Field></div><Field label="RFC de quien realiza el pago"><TextInput value={ie.rfcPago || ''} onChange={e => setIE('rfcPago', e.target.value.toUpperCase())} /></div>}
      <div className="eyebrow">Credenciales de acceso</div><div className="field-row"><Field label="Usuario"><TextInput value={form.email || ''} readOnly /></Field><Field label="Clave inicial"><TextInput value={form.accessKey || ''} onChange={e => set('accessKey', e.target.value)} placeholder="Se genera al guardar si se deja vacío" /></Field></div>
    </div>
  </Modal>;
}
function AcademicoRealOnlyV2({ go }) {
  if (typeof useStore === 'function') useStore();
  const [, force] = React.useReducer(x => x + 1, 0);
  const [nivel, setNivel] = React.useState('Todos');
  const [grupo, setGrupo] = React.useState('Todos');
  const [search, setSearch] = React.useState('');
  const [modal, setModal] = React.useState(null);
  const students = typeof estStudents === 'function' ? estStudents() : ((DB && DB.students) || []);
  const classes = typeof estClasses === 'function' ? estClasses() : ((DB && DB.clases) || []);
  const filtered = students.filter(s => (nivel === 'Todos' || s.nivel === nivel) && (grupo === 'Todos' || (s.grade || s.group) === grupo) && (!search.trim() || String(s.name || '').toLowerCase().includes(search.trim().toLowerCase())));
  const grupos = ['Todos', ...Array.from(new Set(students.filter(s => nivel === 'Todos' || s.nivel === nivel).map(s => s.grade || s.group).filter(Boolean)))];
  const kpis = [{ label: 'Estudiantes', value: String(students.length), icon: 'cap', tone: 'blue' }, { label: 'Grupos reales', value: String(classes.length), icon: 'layers', tone: 'cyan' }, { label: 'Con acceso', value: String(window.jpStudentAccounts ? jpStudentAccounts().length : 0), icon: 'lock', tone: 'green' }, { label: 'Facturan', value: String(students.filter(s => s.factura || (s.fiscal && s.fiscal.factura)).length), icon: 'receipt', tone: 'violet' }, { label: 'Becados', value: String(students.filter(s => Number(s.beca) > 0 || s.hasBeca).length), icon: 'award', tone: 'amber' }];
  function remove(s) { Store.remove('students', s._id); try { if (Store.saveState) Store.saveState(); } catch (_) {} toast('Estudiante eliminado', 'warn'); force(); }
  return <div className="content-inner"><PageHead eyebrow="Administración" title="Estudiantes" desc="Alta integral con expediente, pagos, facturación, acceso y credencial."><button className="btn" onClick={() => go && go('clases')}><Icon name="layers" size={15} className="btn-ico" />Clases</button><button className="btn primary" onClick={() => setModal({})}><Icon name="plus" size={15} className="btn-ico" />Nuevo estudiante</button></PageHead><div className="kpi-row" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>{kpis.map((k, i) => { const t = (window.TONE && window.TONE[k.tone]) || window.TONE.blue; return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>; })}</div><div className="row between center wrap gap-12 mt-16" style={{ marginBottom: 12 }}><div className="seg">{['Todos', ...JP_NIVELES_ALTA].map(n => <button key={n} className={nivel === n ? 'active' : ''} onClick={() => { setNivel(n); setGrupo('Todos'); }}>{n}</button>)}</div><select className="inp" value={grupo} onChange={e => setGrupo(e.target.value)} style={{ height: 34, width: 190 }}>{grupos.map(g => <option key={g} value={g}>{g === 'Todos' ? 'Todos los grupos' : g}</option>)}</select><input className="inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar estudiante" style={{ height: 34, width: 220 }} /></div><div className="card"><CardHead icon="users" title="Lista de estudiantes" sub="Registros reales" /><div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Alumno</th><th>Nivel / grupo</th><th>Plan</th><th>Beca</th><th>Factura</th><th>Acceso</th><th></th></tr></thead><tbody>{filtered.map(s => { const acc = window.jpStudentAccounts ? jpStudentAccounts().find(a => a.studentId === s._id || a.email === s.email) : null; return <tr key={s._id}><td><div className="person">{s.photo ? <img src={s.photo} alt="" style={{ width: 32, height: 32, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }} /> : <Avatar name={s.name} size={32} />}<div><div className="pname">{s.name}</div><div className="pmeta">{s.email}</div></div></div></td><td><div className="row center gap-8"><Badge tone={window.nivelCfg ? nivelCfg(s.nivel).tone : 'blue'}>{s.nivel}</Badge><span className="font-mono" style={{ fontSize: 12.5 }}>{s.grade || s.group || '—'}</span></div></td><td><Badge tone="blue">{window.cobPlanLabel ? cobPlanLabel(s.plan || '10') : (s.plan || '10')}</Badge></td><td>{Number(s.beca) > 0 ? <Badge tone="green">{s.beca}%</Badge> : <Badge tone="gray">Sin beca</Badge>}</td><td>{s.factura || (s.fiscal && s.fiscal.factura) ? <Badge tone="violet">Factura</Badge> : <Badge tone="gray">No</Badge>}</td><td>{acc ? <Badge tone="green">Activo</Badge> : <Badge tone="gray">Pendiente</Badge>}</td><td><RowMenu items={[{ icon: 'edit', label: 'Editar', onClick: () => setModal(s) }, { icon: 'print', label: 'Imprimir credencial', onClick: () => window.jpPrintCredential && jpPrintCredential(s) }, { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => remove(s) }]} /></td></tr>; })}{!filtered.length && <tr><td colSpan="7" className="faint" style={{ textAlign: 'center', padding: 32 }}>Sin estudiantes reales para este filtro.</td></tr>}</tbody></table></div></div>{modal && <StudentEnrollmentV2Modal entry={modal._id ? modal : null} onClose={() => { setModal(null); force(); }} />}</div>;
}
window.AcademicoRealOnly = AcademicoRealOnlyV2;
window.Academico = AcademicoRealOnlyV2;
window.StudentEnrollmentV2Modal = StudentEnrollmentV2Modal;
