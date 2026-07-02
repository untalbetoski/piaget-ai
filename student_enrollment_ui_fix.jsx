/* student_enrollment_ui_fix.jsx — ajuste directo del alta de estudiantes */

function EstudianteModal({ entry, onClose }) {
  const [form, setForm] = React.useState(() => {
    const base = entry ? { ...estEmptyStudent(), ...entry } : estEmptyStudent();
    const fiscal = { ...estFiscalEmpty(base), ...(base.fiscal || {}) };
    fiscal.complementoIE = { ...estFiscalEmpty(base).complementoIE, ...(fiscal.complementoIE || {}), nombreAlumno: base.name || '', curpAlumno: base.curp || '', nivelEducativo: base.nivel || '' };
    return {
      ...base,
      email: base.email || estGeneratedEmail(base.name, entry && entry._id),
      fiscal,
      factura: !!(base.factura || fiscal.factura),
      hasBeca: !!base.hasBeca || Number(base.beca) > 0,
      beca: Number(base.beca) || 0,
      initialPayments: { inscripcionPagada: false, inscripcion: 0, cuotaAnual: 0, channel: 'Transferencia', detalle: '' },
      accessKey: (base.access && base.access.key) || ''
    };
  });
  const photoRef = React.useRef(null);
  const groups = estGroupsByNivel(form.nivel);
  const fiscal = form.fiscal || estFiscalEmpty(form);
  const ie = fiscal.complementoIE || {};
  const ip = form.initialPayments || { inscripcionPagada: false, inscripcion: 0, cuotaAnual: 0, channel: 'Transferencia', detalle: '' };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setFiscal = (k, v) => setForm(f => ({ ...f, fiscal: { ...(f.fiscal || estFiscalEmpty(f)), [k]: v } }));
  const setIE = (k, v) => setForm(f => ({ ...f, fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), [k]: v } } }));
  const setPay = (k, v) => setForm(f => ({ ...f, initialPayments: { ...(f.initialPayments || {}), [k]: v } }));
  function updateName(v) {
    setForm(f => ({ ...f, name: v, email: estGeneratedEmail(v, entry && entry._id), fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), nombreAlumno: v } } }));
  }
  function updateCurp(v) {
    const curp = String(v || '').toUpperCase();
    setForm(f => ({ ...f, curp, fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), curpAlumno: curp } } }));
  }
  function updateNivel(v) {
    const g = estGroupsByNivel(v)[0] || '';
    setForm(f => ({ ...f, nivel: v, grade: g, plan: '10', fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), nivelEducativo: v } }, initialPayments: { ...(f.initialPayments || {}), inscripcion: f.initialPayments && f.initialPayments.inscripcionPagada ? estInscripcionAmount(v) : (f.initialPayments ? f.initialPayments.inscripcion : 0) } }));
  }
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
    const initial = { ...(form.initialPayments || {}) };
    delete payload.initialPayments; delete payload.accessKey; delete payload.avg;
    let saved;
    if (entry && entry._id) { Store.update('students', entry._id, payload); saved = { _id: entry._id, ...payload }; }
    else { saved = Store.add('students', { ...payload, matricula: 'EST-2026-' + String(1001 + estStudents().length).padStart(4, '0') }); }
    const acc = estUpsertStudentAccount(saved, key);
    let pays = 0;
    if (initial.inscripcionPagada && Number(initial.inscripcion) > 0) { estAddCobroReal(saved._id, saved, 'Inscripción · ' + saved.name + ' (' + saved.grade + ')', initial.inscripcion, initial.channel, initial.detalle); pays++; }
    if (Number(initial.cuotaAnual) > 0) { estAddCobroReal(saved._id, saved, 'Abono a cuenta cuota única anual · ' + saved.name + ' (' + saved.grade + ')', initial.cuotaAnual, initial.channel || 'Abono a cuenta', initial.detalle); pays++; }
    try { if (Store.saveState) Store.saveState(); } catch (_) {}
    toast('Estudiante guardado · usuario ' + acc.email + ' · clave generada' + (pays ? ' · pagos reales: ' + pays : ''), 'ok');
    onClose();
  }
  return <Modal open width={900} title={entry ? 'Editar estudiante' : 'Alta de nuevo estudiante'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn" onClick={() => estPrintCredential({ ...form, matricula: entry && entry.matricula })}><Icon name="print" size={15} className="btn-ico" />Vista credencial</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar alta</button></>}>
    <div className="col" style={{ gap: 16 }}>
      <div className="row center gap-12"><div onClick={() => photoRef.current && photoRef.current.click()} style={{ width: 78, height: 78, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{form.photo ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={30} className="faint" />}</div><div><button className="btn sm" onClick={() => photoRef.current && photoRef.current.click()}><Icon name="plus" size={12} className="btn-ico" />Subir foto</button><div className="faint" style={{ fontSize: 12, marginTop: 6 }}>Se usará en expediente y credencial.</div></div><input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => estPhotoFile(e.target.files[0], url => set('photo', url))} /></div>
      <div className="eyebrow">Datos del estudiante</div>
      <Field label="Nombre completo"><TextInput value={form.name || ''} onChange={e => updateName(e.target.value)} placeholder="Primer nombre Segundo nombre Apellido paterno Apellido materno" autoFocus /></Field>
      <Field label="Correo institucional"><TextInput value={form.email || ''} readOnly placeholder="Se genera automáticamente" /></Field>
      <div className="field-row"><Field label="Nivel"><SelectInput value={form.nivel} onChange={e => updateNivel(e.target.value)} options={EST_NIVELES} /></Field><Field label="Grupo"><SelectInput value={form.grade || ''} onChange={e => set('grade', e.target.value)} options={groups.length ? groups : [{ value: '', label: 'Crea grupos reales primero' }]} /></Field></div>
      <div className="field-row"><Field label="Fecha de nacimiento"><input className="inp" type="date" value={form.birth || ''} onChange={e => set('birth', e.target.value)} /></Field><Field label="CURP"><TextInput value={form.curp || ''} onChange={e => updateCurp(e.target.value)} /></Field></div>
      <div className="field-row"><Field label="Nombre del tutor"><TextInput value={form.tutor || ''} onChange={e => set('tutor', e.target.value)} /></Field><Field label="Teléfono"><TextInput value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></Field></div>
      <div className="eyebrow">Plan de pagos</div>
      <Field label="Plan de pagos según nivel"><SelectInput style={{ minHeight: 42, width: '100%' }} value={form.plan || '10'} onChange={e => set('plan', e.target.value)} options={estPlanOptions(form.nivel)} /></Field>
      <div className="field-row"><Field label="¿Tiene beca?"><SelectInput value={form.hasBeca ? 'si' : 'no'} onChange={e => setForm(f => ({ ...f, hasBeca: e.target.value === 'si', beca: e.target.value === 'si' ? f.beca : 0 }))} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field><Field label="% beca colegiaturas"><NumberInput min="0" max="100" value={form.hasBeca ? (form.beca || 0) : 0} disabled={!form.hasBeca} onChange={e => set('beca', e.target.value)} /></Field></div>
      <div className="field-row"><Field label="¿Paga inscripción?"><SelectInput value={ip.inscripcionPagada ? 'si' : 'no'} onChange={e => { const yes = e.target.value === 'si'; setForm(f => ({ ...f, initialPayments: { ...(f.initialPayments || {}), inscripcionPagada: yes, inscripcion: yes ? (Number(f.initialPayments && f.initialPayments.inscripcion) || estInscripcionAmount(f.nivel)) : 0 } })); }} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field><Field label="Monto pagado inscripción"><NumberInput min="0" value={ip.inscripcion || 0} disabled={!ip.inscripcionPagada} onChange={e => setPay('inscripcion', e.target.value)} /></Field></div>
      <Field label="Abono a cuenta cuota única anual"><NumberInput min="0" value={ip.cuotaAnual || 0} onChange={e => setPay('cuotaAnual', e.target.value)} /></Field>
      <div className="field-row"><Field label="Forma de pago"><SelectInput style={{ minHeight: 42 }} value={ip.channel || 'Transferencia'} onChange={e => setPay('channel', e.target.value)} options={['Transferencia', 'Tarjeta', 'Efectivo', 'Domiciliación', 'Abono a cuenta']} /></Field><Field label="Detalle"><TextInput value={ip.detalle || ''} onChange={e => setPay('detalle', e.target.value)} placeholder="Folio, SPEI, caja, observaciones" /></Field></div>
      <div className="faint" style={{ fontSize: 12 }}>No se registra ningún pago si los montos quedan en cero.</div>
      <div className="eyebrow">Facturación</div>
      <Field label="¿Factura el estudiante?"><SelectInput value={form.factura ? 'si' : 'no'} onChange={e => set('factura', e.target.value === 'si')} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field>
      {form.factura && <div className="col" style={{ gap: 12 }}><div className="field-row"><Field label="Razón social"><TextInput value={fiscal.razonSocial || ''} onChange={e => setFiscal('razonSocial', e.target.value.toUpperCase())} /></Field><Field label="RFC"><TextInput value={fiscal.rfc || ''} onChange={e => setFiscal('rfc', e.target.value.toUpperCase())} /></Field></div><div className="field-row"><Field label="Régimen fiscal"><SelectInput value={fiscal.regimenFiscal || ''} onChange={e => setFiscal('regimenFiscal', e.target.value)} options={EST_REGIMENES} /></Field><Field label="Uso CFDI"><SelectInput value={fiscal.usoCfdi || 'D10'} onChange={e => setFiscal('usoCfdi', e.target.value)} options={EST_USOS_CFDI} /></Field></div><div className="field-row"><Field label="Código postal"><TextInput value={fiscal.cpFiscal || ''} onChange={e => setFiscal('cpFiscal', e.target.value)} /></Field><Field label="Correo de facturación"><TextInput value={fiscal.emailFacturacion || ''} onChange={e => setFiscal('emailFacturacion', e.target.value.toLowerCase())} /></Field></div><Field label="Domicilio fiscal"><TextInput value={fiscal.domicilioFiscal || ''} onChange={e => setFiscal('domicilioFiscal', e.target.value)} /></Field><div className="eyebrow">Complemento de Instituciones Educativas</div><div className="field-row"><Field label="Nombre alumno"><TextInput value={ie.nombreAlumno || form.name || ''} onChange={e => setIE('nombreAlumno', e.target.value)} /></Field><Field label="CURP alumno"><TextInput value={ie.curpAlumno || form.curp || ''} onChange={e => setIE('curpAlumno', e.target.value.toUpperCase())} /></Field></div><div className="field-row"><Field label="Nivel educativo"><SelectInput value={ie.nivelEducativo || form.nivel} onChange={e => setIE('nivelEducativo', e.target.value)} options={EST_NIVELES} /></Field><Field label="Autorización / RVOE"><TextInput value={ie.autRVOE || ''} onChange={e => setIE('autRVOE', e.target.value)} /></Field></div><Field label="RFC de quien realiza el pago"><TextInput value={ie.rfcPago || ''} onChange={e => setIE('rfcPago', e.target.value.toUpperCase())} /></Field></div>}
      <div className="eyebrow">Credenciales de acceso</div>
      <div className="field-row"><Field label="Usuario generado"><TextInput value={form.email || ''} readOnly /></Field><Field label="Clave inicial generada"><TextInput value={form.accessKey || 'Se generará automáticamente al guardar'} readOnly /></Field></div>
    </div>
  </Modal>;
}
Object.assign(window, { EstudianteModal });
