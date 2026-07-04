/* student_enrollment_ui_fix.jsx — alta estudiantes: matrícula numérica, documentos oficiales, abono inscripción y credencial final */

const EST_OFFICIAL_DOCS = [
  { key: 'actaNacimientoEstudiante', label: 'Acta de Nacimiento del Estudiante' },
  { key: 'curpEstudiante', label: 'CURP del Estudiante' },
  { key: 'certificadoMedico', label: 'Certificado Médico' },
  { key: 'ineTutor', label: 'INE del Tutor' },
  { key: 'curpTutor', label: 'CURP del Tutor' },
  { key: 'reporteEvaluacionAnteriorEstudiante', label: 'Reporte de Evaluación Anterior del Estudiante' },
];
function estDefaultMatricula() {
  const n = 1001 + (typeof estStudents === 'function' ? estStudents().length : ((window.DB && DB.students) || []).length);
  return String(n).padStart(6, '0');
}
function estNormalizeMatricula(v) { return String(v || '').replace(/\D/g, '').slice(0, 12); }
function estOfficialDocumentsEmpty(existing) {
  const source = existing || {};
  const out = {};
  EST_OFFICIAL_DOCS.forEach(d => out[d.key] = source[d.key] || null);
  if (source.actaNacimientoTutor && !out.reporteEvaluacionAnteriorEstudiante) out.reporteEvaluacionAnteriorEstudiante = source.actaNacimientoTutor;
  return out;
}
function estReadOfficialPdf(file, cb) {
  if (!file) return;
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  if (!isPdf) return toast('Solo se permiten documentos PDF', 'warn');
  const r = new FileReader();
  r.onload = () => cb({ name: file.name, type: 'application/pdf', size: file.size || 0, dataUrl: String(r.result), uploadedAt: new Date().toISOString() });
  r.readAsDataURL(file);
}
function estOpenOfficialDoc(doc) {
  if (!doc || !doc.dataUrl) return toast('Documento no disponible', 'warn');
  const w = window.open('', '_blank');
  if (!w) return toast('Permite ventanas emergentes para ver el PDF', 'warn');
  w.document.open();
  w.document.write('<iframe src="' + doc.dataUrl + '" style="border:0;width:100%;height:100vh"></iframe>');
  w.document.close();
}
function estStudentCredentialPayload(stu) {
  return { type: 'student', id: stu._id || '', matricula: stu.matricula || '', name: stu.name || '', email: stu.email || '', role: 'Estudiante', nivel: stu.nivel || '', grade: stu.grade || stu.group || '', curp: stu.curp || '', status: 'Activo', institution: 'PIAGET', v: 6 };
}
function estCredentialQR(payload) {
  try {
    if (!window.qrcode) return '';
    const q = window.qrcode(0, 'M');
    q.addData(JSON.stringify(payload));
    q.make();
    return q.createSvgTag(5, 2);
  } catch (_) { return ''; }
}
function estInitials(name) {
  return String(name || 'E').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
}
function estEnsureCredentialPrintStyles() {
  if (document.getElementById('piaget-final-student-credential-print')) return;
  const style = document.createElement('style');
  style.id = 'piaget-final-student-credential-print';
  style.textContent = `
    @media print {
      html, body { overflow: visible !important; background: #fff !important; height: auto !important; }
      body * { visibility: hidden !important; }
      .student-cred-print, .student-cred-print * { visibility: visible !important; }
      .student-cred-print {
        position: fixed !important;
        left: 50% !important;
        top: 18px !important;
        transform: translateX(-50%) !important;
        width: 330px !important;
        max-width: 330px !important;
        min-width: 330px !important;
        box-shadow: none !important;
        background: #fff !important;
        color: #111827 !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .student-cred-print svg { max-width: 100% !important; height: auto !important; }
      .student-cred-print img { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .student-cred-side { display: none !important; }
    }
  `;
  document.head.appendChild(style);
}
function StudentCredentialCard({ student }) {
  React.useEffect(() => { estEnsureCredentialPrintStyles(); }, []);
  const payload = estStudentCredentialPayload(student || {});
  const svg = React.useMemo(() => estCredentialQR(payload), [student && student._id, student && student.email, student && student.matricula, student && student.grade, student && student.nivel]);
  const t = window.TONE && window.TONE.violet ? window.TONE.violet : (window.TONE && window.TONE.blue ? window.TONE.blue : { c: 'var(--accent)', bg: 'var(--accent-soft)' });
  const photo = student && student.photo;
  return <div className="card student-cred-print" style={{ width: 330, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
    <div style={{ padding: 18, background: 'linear-gradient(135deg, var(--surface), var(--surface-2))', borderBottom: '1px solid var(--border)' }}>
      <div className="row between center">
        <div>
          <div className="eyebrow">Credencial de acceso</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>PIAGET</div>
        </div>
        <Badge tone="green" dot>Activa</Badge>
      </div>
    </div>
    <div style={{ padding: 20 }}>
      <div className="row center gap-12" style={{ marginBottom: 16 }}>
        <div style={{ width: 58, height: 58, borderRadius: 18, display: 'grid', placeItems: 'center', color: t.c, background: t.bg, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, overflow: 'hidden', flexShrink: 0 }}>
          {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : estInitials(student && student.name || student && student.email)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>{student && student.name || 'Estudiante'}</div>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 3, overflowWrap: 'anywhere' }}>{student && student.email || '—'}</div>
          <div style={{ marginTop: 7 }}><Badge tone="violet">Estudiante</Badge></div>
        </div>
      </div>
      <div style={{ display: 'grid', placeItems: 'center', background: '#fff', borderRadius: 18, padding: 14, border: '1px solid var(--border)' }}>
        {svg ? <div style={{ width: 210, height: 210, display: 'grid', placeItems: 'center' }} dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="faint" style={{ height: 210, display: 'grid', placeItems: 'center' }}>QR no disponible</div>}
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
        <div className="kv"><span className="k">Matrícula</span><span className="v font-mono" style={{ fontSize: 10.5 }}>{student && student.matricula || '—'}</span></div>
        <div className="kv"><span className="k">Tipo</span><span className="v">Estudiante</span></div>
        <div className="kv"><span className="k">Nivel</span><span className="v">{student && student.nivel || '—'}</span></div>
        <div className="kv"><span className="k">Grupo</span><span className="v">{student && (student.grade || student.group) || '—'}</span></div>
      </div>
      <div className="faint" style={{ fontSize: 11.5, marginTop: 12, textAlign: 'center' }}>Este QR registra entrada en Control de Accesos.</div>
    </div>
  </div>;
}
function StudentCredentialModal({ student, onClose }) {
  const payload = estStudentCredentialPayload(student || {});
  const copyPayload = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(payload)); toast('Contenido QR copiado', 'ok'); }
    catch (_) { toast('No se pudo copiar', 'warn'); }
  };
  return <Modal open width={760} onClose={onClose} title="Credencial de acceso"
    footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn" onClick={copyPayload}><Icon name="copy" size={15} className="btn-ico" />Copiar QR</button><button className="btn primary" onClick={() => { estEnsureCredentialPrintStyles(); window.print(); }}><Icon name="download" size={15} className="btn-ico" />Imprimir</button></>}>
    <div className="row" style={{ gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <StudentCredentialCard student={student || {}} />
      <div className="card pad student-cred-side" style={{ flex: 1, minWidth: 260 }}>
        <div className="card-title" style={{ marginBottom: 10 }}><Icon name="shield" size={17} className="ico" />Uso de la credencial</div>
        {[
          ['Mostrar QR', 'El estudiante presenta esta credencial en el acceso.'],
          ['Escanear', 'El módulo Scanner QR lee el código con cámara.'],
          ['Registrar', 'La entrada queda guardada y aparece en Control de Accesos.'],
        ].map((p, i) => <div className="row" key={i} style={{ gap: 12, padding: '11px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}><div className="kpi-ico" style={{ width: 28, height: 28, margin: 0, background: 'var(--accent-soft)', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{i + 1}</div><div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{p[0]}</div><div className="faint" style={{ fontSize: 12.5 }}>{p[1]}</div></div></div>)}
        <div className="ai-panel" style={{ marginTop: 14 }}><div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}><div className="insight-ico" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon name="alert" size={16} /></div><div className="insight-body"><div className="insight-title">Impresión</div><div className="insight-text">Al imprimir, solo se manda la tarjeta vertical de 330px para evitar cortes o deformaciones.</div></div></div></div>
      </div>
    </div>
  </Modal>;
}
function estPrintCredential(student) {
  let rootEl = document.getElementById('piaget-student-credential-root');
  if (!rootEl) {
    rootEl = document.createElement('div');
    rootEl.id = 'piaget-student-credential-root';
    document.body.appendChild(rootEl);
  }
  if (!window.__piagetStudentCredentialRoot) window.__piagetStudentCredentialRoot = ReactDOM.createRoot(rootEl);
  const close = () => window.__piagetStudentCredentialRoot.render(null);
  window.__piagetStudentCredentialRoot.render(<StudentCredentialModal student={student || {}} onClose={close} />);
}

function EstudianteModal({ entry, onClose }) {
  const [form, setForm] = React.useState(() => {
    const base = entry ? { ...estEmptyStudent(), ...entry } : estEmptyStudent();
    const fiscal = { ...estFiscalEmpty(base), ...(base.fiscal || {}) };
    fiscal.complementoIE = { ...estFiscalEmpty(base).complementoIE, ...(fiscal.complementoIE || {}), nombreAlumno: base.name || '', curpAlumno: base.curp || '', nivelEducativo: base.nivel || '' };
    return { ...base, matricula: estNormalizeMatricula(base.matricula || estDefaultMatricula()), email: base.email || estGeneratedEmail(base.name, entry && entry._id), fiscal, factura: !!(base.factura || fiscal.factura), hasBeca: !!base.hasBeca || Number(base.beca) > 0, beca: Number(base.beca) || 0, officialDocuments: estOfficialDocumentsEmpty(base.officialDocuments || base.documents), initialPayments: { inscripcionPagada: false, inscripcion: 0, channel: 'Transferencia', detalle: '' }, accessKey: (base.access && base.access.key) || '' };
  });
  const photoRef = React.useRef(null);
  const groups = estGroupsByNivel(form.nivel);
  const fiscal = form.fiscal || estFiscalEmpty(form);
  const ie = fiscal.complementoIE || {};
  const ip = form.initialPayments || { inscripcionPagada: false, inscripcion: 0, channel: 'Transferencia', detalle: '' };
  const docs = estOfficialDocumentsEmpty(form.officialDocuments);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setFiscal = (k, v) => setForm(f => ({ ...f, fiscal: { ...(f.fiscal || estFiscalEmpty(f)), [k]: v } }));
  const setIE = (k, v) => setForm(f => ({ ...f, fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), [k]: v } } }));
  const setPay = (k, v) => setForm(f => ({ ...f, initialPayments: { ...(f.initialPayments || {}), [k]: v } }));
  const setDoc = (key, doc) => setForm(f => ({ ...f, officialDocuments: { ...estOfficialDocumentsEmpty(f.officialDocuments), [key]: doc } }));
  function updateName(v) { setForm(f => ({ ...f, name: v, email: estGeneratedEmail(v, entry && entry._id), fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), nombreAlumno: v } } })); }
  function updateCurp(v) { const curp = String(v || '').toUpperCase(); setForm(f => ({ ...f, curp, fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), curpAlumno: curp } } })); }
  function updateNivel(v) { const g = estGroupsByNivel(v)[0] || ''; setForm(f => ({ ...f, nivel: v, grade: g, plan: '10', fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), nivelEducativo: v } }, initialPayments: { ...(f.initialPayments || {}), inscripcion: f.initialPayments && f.initialPayments.inscripcionPagada ? estInscripcionAmount(v) : (f.initialPayments ? f.initialPayments.inscripcion : 0) } })); }
  function save() {
    if (!estClean(form.name)) return toast('Escribe el nombre completo', 'warn');
    if (!estClean(form.matricula)) return toast('Captura la matrícula', 'warn');
    if (!/^\d+$/.test(String(form.matricula || ''))) return toast('La matrícula solo debe contener números', 'warn');
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
    const cleanDocs = estOfficialDocumentsEmpty(form.officialDocuments);
    const payload = { ...form, matricula: estNormalizeMatricula(form.matricula), name: estClean(form.name), email, curp: String(form.curp || '').toUpperCase(), tutor: estClean(form.tutor), phone: estClean(form.phone), plan: form.plan || '10', hasBeca: !!form.hasBeca, beca: form.hasBeca ? Math.max(0, Math.min(100, Number(form.beca) || 0)) : 0, factura: !!form.factura, fiscal: fiscalOut, officialDocuments: cleanDocs, access: { username: email, key, role: 'Estudiante', status: 'Activo' }, manual: true, real: true };
    delete payload.documents;
    delete payload.initialPayments;
    delete payload.accessKey;
    delete payload.avg;
    let saved;
    if (entry && entry._id) { Store.update('students', entry._id, payload); saved = { _id: entry._id, ...payload }; }
    else { saved = Store.add('students', payload); }
    const acc = estUpsertStudentAccount(saved, key);
    let pays = 0;
    if (ip.inscripcionPagada && Number(ip.inscripcion) > 0) { estAddCobroReal(saved._id, saved, 'Abono a inscripción · ' + saved.name + ' (' + saved.grade + ')', ip.inscripcion, ip.channel, ip.detalle); pays++; }
    try { if (Store.saveState) Store.saveState(); } catch (_) {}
    toast('Estudiante guardado · matrícula ' + saved.matricula + ' · usuario ' + acc.email + ' · clave generada' + (pays ? ' · abono a inscripción registrado' : ''), 'ok');
    onClose();
  }
  return <Modal open width={900} title={entry ? 'Editar estudiante' : 'Alta de nuevo estudiante'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn" onClick={() => estPrintCredential({ ...form })}><Icon name="print" size={15} className="btn-ico" />Vista credencial</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar alta</button></>}>
    <div className="col" style={{ gap: 16 }}>
      <div className="row center gap-12"><div onClick={() => photoRef.current && photoRef.current.click()} style={{ width: 78, height: 78, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{form.photo ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={30} className="faint" />}</div><div><button className="btn sm" onClick={() => photoRef.current && photoRef.current.click()}><Icon name="plus" size={12} className="btn-ico" />Subir foto</button><div className="faint" style={{ fontSize: 12, marginTop: 6 }}>Se usará en expediente y credencial.</div></div><input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => estPhotoFile(e.target.files[0], url => set('photo', url))} /></div>
      <div className="eyebrow">Datos del estudiante</div>
      <Field label="Matrícula"><TextInput value={form.matricula || ''} onChange={e => set('matricula', estNormalizeMatricula(e.target.value))} placeholder="Matrícula" inputMode="numeric" /></Field>
      <Field label="Nombre completo"><TextInput value={form.name || ''} onChange={e => updateName(e.target.value)} placeholder="Primer nombre Segundo nombre Apellido paterno Apellido materno" autoFocus /></Field>
      <Field label="Correo institucional"><TextInput value={form.email || ''} readOnly placeholder="Se genera automáticamente" /></Field>
      <div className="field-row"><Field label="Nivel"><SelectInput value={form.nivel} onChange={e => updateNivel(e.target.value)} options={EST_NIVELES} /></Field><Field label="Grupo"><SelectInput value={form.grade || ''} onChange={e => set('grade', e.target.value)} options={groups.length ? groups : [{ value: '', label: 'Crea grupos reales primero' }]} /></Field></div>
      <div className="field-row"><Field label="Fecha de nacimiento"><input className="inp" type="date" value={form.birth || ''} onChange={e => set('birth', e.target.value)} /></Field><Field label="CURP"><TextInput value={form.curp || ''} onChange={e => updateCurp(e.target.value)} /></Field></div>
      <div className="field-row"><Field label="Nombre del tutor"><TextInput value={form.tutor || ''} onChange={e => set('tutor', e.target.value)} /></Field><Field label="Teléfono"><TextInput value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></Field></div>
      <div className="eyebrow">Documentos oficiales en PDF</div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
        {EST_OFFICIAL_DOCS.map(d => { const doc = docs[d.key]; return <div key={d.key} className="card pad" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}><div style={{ fontWeight: 700, fontSize: 13.5 }}>{d.label}</div><div className="faint" style={{ fontSize: 12, marginTop: 4, minHeight: 18 }}>{doc ? doc.name : 'PDF pendiente'}</div><div className="row gap-8" style={{ marginTop: 10, flexWrap: 'wrap' }}><label className="btn sm" style={{ cursor: 'pointer' }}><Icon name="upload" size={12} className="btn-ico" />Subir PDF<input type="file" accept="application/pdf,.pdf" style={{ display: 'none' }} onChange={e => estReadOfficialPdf(e.target.files[0], file => setDoc(d.key, file))} /></label>{doc && <button className="btn sm" onClick={() => estOpenOfficialDoc(doc)}><Icon name="eye" size={12} className="btn-ico" />Ver</button>}{doc && <button className="btn sm" onClick={() => setDoc(d.key, null)}><Icon name="trash" size={12} className="btn-ico" />Quitar</button>}</div></div>; })}
      </div>
      <div className="eyebrow">Plan de pagos</div>
      <Field label="Plan de pagos según nivel"><SelectInput style={{ minHeight: 42, width: '100%' }} value={form.plan || '10'} onChange={e => set('plan', e.target.value)} options={estPlanOptions(form.nivel)} /></Field>
      <div className="field-row"><Field label="¿Tiene beca?"><SelectInput value={form.hasBeca ? 'si' : 'no'} onChange={e => setForm(f => ({ ...f, hasBeca: e.target.value === 'si', beca: e.target.value === 'si' ? f.beca : 0 }))} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field><Field label="% beca colegiaturas"><NumberInput min="0" max="100" value={form.hasBeca ? (form.beca || 0) : 0} disabled={!form.hasBeca} onChange={e => set('beca', e.target.value)} /></Field></div>
      <div className="field-row"><Field label="¿Abona inscripción?"><SelectInput value={ip.inscripcionPagada ? 'si' : 'no'} onChange={e => { const yes = e.target.value === 'si'; setForm(f => ({ ...f, initialPayments: { ...(f.initialPayments || {}), inscripcionPagada: yes, inscripcion: yes ? (Number(f.initialPayments && f.initialPayments.inscripcion) || estInscripcionAmount(f.nivel)) : 0 } })); }} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field><Field label="Monto abonado a inscripción"><NumberInput min="0" value={ip.inscripcion || 0} disabled={!ip.inscripcionPagada} onChange={e => setPay('inscripcion', e.target.value)} /></Field></div>
      <div className="field-row"><Field label="Forma de pago"><SelectInput style={{ minHeight: 42 }} value={ip.channel || 'Transferencia'} onChange={e => setPay('channel', e.target.value)} options={['Transferencia', 'Tarjeta', 'Efectivo', 'Domiciliación']} /></Field><Field label="Detalle"><TextInput value={ip.detalle || ''} onChange={e => setPay('detalle', e.target.value)} placeholder="Folio, SPEI, caja, observaciones" /></Field></div>
      <div className="faint" style={{ fontSize: 12 }}>No se registra ningún pago si el abono a inscripción queda en cero.</div>
      <div className="eyebrow">Facturación</div>
      <Field label="¿Factura el estudiante?"><SelectInput value={form.factura ? 'si' : 'no'} onChange={e => set('factura', e.target.value === 'si')} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field>
      {form.factura && <div className="col" style={{ gap: 12 }}><div className="field-row"><Field label="Razón social"><TextInput value={fiscal.razonSocial || ''} onChange={e => setFiscal('razonSocial', e.target.value.toUpperCase())} /></Field><Field label="RFC"><TextInput value={fiscal.rfc || ''} onChange={e => setFiscal('rfc', e.target.value.toUpperCase())} /></Field></div><div className="field-row"><Field label="Régimen fiscal"><SelectInput value={fiscal.regimenFiscal || ''} onChange={e => setFiscal('regimenFiscal', e.target.value)} options={EST_REGIMENES} /></Field><Field label="Uso CFDI"><SelectInput value={fiscal.usoCfdi || 'D10'} onChange={e => setFiscal('usoCfdi', e.target.value)} options={EST_USOS_CFDI} /></Field></div><div className="field-row"><Field label="Código postal"><TextInput value={fiscal.cpFiscal || ''} onChange={e => setFiscal('cpFiscal', e.target.value)} /></Field><Field label="Correo de facturación"><TextInput value={fiscal.emailFacturacion || ''} onChange={e => setFiscal('emailFacturacion', e.target.value.toLowerCase())} /></Field></div><Field label="Domicilio fiscal"><TextInput value={fiscal.domicilioFiscal || ''} onChange={e => setFiscal('domicilioFiscal', e.target.value)} /></Field><div className="eyebrow">Complemento de Instituciones Educativas</div><div className="field-row"><Field label="Nombre alumno"><TextInput value={ie.nombreAlumno || form.name || ''} onChange={e => setIE('nombreAlumno', e.target.value)} /></Field><Field label="CURP alumno"><TextInput value={ie.curpAlumno || form.curp || ''} onChange={e => setIE('curpAlumno', e.target.value.toUpperCase())} /></Field></div><div className="field-row"><Field label="Nivel educativo"><SelectInput value={ie.nivelEducativo || form.nivel} onChange={e => setIE('nivelEducativo', e.target.value)} options={EST_NIVELES} /></Field><Field label="Autorización / RVOE"><TextInput value={ie.autRVOE || ''} onChange={e => setIE('autRVOE', e.target.value)} /></Field></div><Field label="RFC de quien realiza el pago"><TextInput value={ie.rfcPago || ''} onChange={e => setIE('rfcPago', e.target.value.toUpperCase())} /></Field></div>}
      <div className="eyebrow">Credenciales de acceso</div>
      <div className="field-row"><Field label="Usuario generado"><TextInput value={form.email || ''} readOnly /></Field><Field label="Clave inicial"><TextInput value="Se generará automáticamente al guardar" readOnly /></Field></div>
    </div>
  </Modal>;
}
Object.assign(window, { EstudianteModal, estPrintCredential, estNormalizeMatricula, estOfficialDocumentsEmpty, StudentCredentialCard, StudentCredentialModal });
