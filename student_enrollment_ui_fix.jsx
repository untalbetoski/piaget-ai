/* student_enrollment_ui_fix.jsx — ajuste seguro del alta de estudiantes: sin recursión */

function estStudentCredentialPayload(stu) {
  return {
    type: 'student', id: stu._id || '', matricula: stu.matricula || '', name: stu.name || '', email: stu.email || '',
    nivel: stu.nivel || '', grade: stu.grade || stu.group || '', curp: stu.curp || '', institution: 'PIAGET', v: 2
  };
}
function estCredentialQRHtml(payload) {
  try { if (!window.qrcode) return ''; const q = window.qrcode(0, 'M'); q.addData(JSON.stringify(payload)); q.make(); return q.createSvgTag(5, 2); }
  catch (_) { return ''; }
}
function estPrintCredential(student) {
  const stu = student || {};
  const payload = estStudentCredentialPayload(stu);
  const qr = estCredentialQRHtml(payload);
  const initials = String(stu.name || 'E').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
  const photo = stu.photo ? '<img src="' + stu.photo + '" alt="" />' : '<span>' + initials + '</span>';
  const safe = v => String(v || '—').replace(/[<>&"]/g, s => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[s]));
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Credencial ${safe(stu.name)}</title>
  <style>
    @page{size:auto;margin:12mm}*{box-sizing:border-box}body{margin:0;background:#f3f4f6;font-family:Arial,sans-serif;display:grid;place-items:start center;min-height:100vh;padding:24px;color:#111827}.wrap{display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap}.card{width:330px;overflow:hidden;border:1px solid #e5e7eb;border-radius:18px;background:#fff;box-shadow:0 18px 40px rgba(15,23,42,.15)}.head{padding:18px;background:linear-gradient(135deg,#fff,#f5f7fb);border-bottom:1px solid #e5e7eb}.between{display:flex;justify-content:space-between;align-items:center;gap:10px}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#64748b;font-weight:800}.brand{font-size:24px;font-weight:900;letter-spacing:-.03em;color:#111827}.badge{font-size:11px;background:#dcfce7;color:#15803d;border-radius:999px;padding:5px 8px;font-weight:800}.body{padding:20px}.person{display:flex;align-items:center;gap:12px;margin-bottom:16px}.photo{width:62px;height:62px;border-radius:18px;overflow:hidden;background:#dbeafe;color:#1d4ed8;display:grid;place-items:center;font-weight:900;font-size:20px;flex-shrink:0}.photo img{width:100%;height:100%;object-fit:cover}.name{font-size:16px;line-height:1.1;font-weight:800;color:#111827}.mail{font-size:12.5px;margin-top:3px;color:#64748b;overflow-wrap:anywhere}.level{display:inline-block;margin-top:7px;background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:4px 8px;font-size:11px;font-weight:800}.qr{display:grid;place-items:center;background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:14px}.qrbox{width:210px;height:210px;display:grid;place-items:center}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.kv{border:1px solid #e5e7eb;border-radius:12px;padding:8px;background:#fafafa}.k{display:block;color:#64748b;font-size:10px;text-transform:uppercase;font-weight:800}.v{display:block;font-size:12px;font-weight:700;margin-top:3px;overflow-wrap:anywhere}.note{font-size:11.5px;color:#64748b;margin-top:12px;text-align:center}.side{width:300px;background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:18px;box-shadow:0 18px 40px rgba(15,23,42,.1)}.title{font-weight:800;margin-bottom:10px}.step{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #e5e7eb}.num{width:28px;height:28px;border-radius:10px;background:#dbeafe;color:#1d4ed8;display:grid;place-items:center;font-weight:900;flex-shrink:0}.st{font-size:13.5px;font-weight:800}.sd{font-size:12.5px;color:#64748b;margin-top:2px}.actions{margin-top:16px;display:flex;gap:8px}.btn{border:1px solid #d1d5db;background:#fff;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer}.btn.primary{background:#111827;color:#fff;border-color:#111827}@media print{body{background:#fff;padding:0;display:block}.side,.actions{display:none}.card{box-shadow:none;break-inside:avoid;page-break-inside:avoid;width:330px}.wrap{display:block}.card *{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><div class="wrap"><div class="card"><div class="head"><div class="between"><div><div class="eyebrow">Credencial de estudiante</div><div class="brand">PIAGET</div></div><div class="badge">Activa</div></div></div><div class="body"><div class="person"><div class="photo">${photo}</div><div><div class="name">${safe(stu.name || 'Estudiante')}</div><div class="mail">${safe(stu.email)}</div><div class="level">${safe(stu.nivel || 'Estudiante')}</div></div></div><div class="qr"><div class="qrbox">${qr || '<div style="color:#64748b;font-size:13px">QR no disponible</div>'}</div></div><div class="grid"><div class="kv"><span class="k">Matrícula</span><span class="v">${safe(stu.matricula)}</span></div><div class="kv"><span class="k">Grupo</span><span class="v">${safe(stu.grade || stu.group)}</span></div><div class="kv"><span class="k">Nivel</span><span class="v">${safe(stu.nivel)}</span></div><div class="kv"><span class="k">Tipo</span><span class="v">Estudiante</span></div></div><div class="note">Este QR registra entrada en Control de Accesos.</div></div></div><div class="side"><div class="title">Uso de la credencial</div><div class="step"><div class="num">1</div><div><div class="st">Mostrar QR</div><div class="sd">El estudiante presenta esta credencial en el acceso.</div></div></div><div class="step"><div class="num">2</div><div><div class="st">Escanear</div><div class="sd">El módulo Scanner QR lee el código con cámara.</div></div></div><div class="step" style="border-bottom:none"><div class="num">3</div><div><div class="st">Registrar</div><div class="sd">La entrada se refleja en Control de Accesos.</div></div></div><div class="actions"><button class="btn" onclick="navigator.clipboard&&navigator.clipboard.writeText('${safe(JSON.stringify(payload))}')">Copiar QR</button><button class="btn primary" onclick="window.print()">Imprimir</button></div></div></div></body></html>`;
  const w = window.open('', '_blank');
  if (!w) { toast('Permite ventanas emergentes para imprimir la credencial', 'warn'); return; }
  w.document.open(); w.document.write(html); w.document.close();
}

function EstudianteModal({ entry, onClose }) {
  const [form, setForm] = React.useState(() => {
    const base = entry ? { ...estEmptyStudent(), ...entry } : estEmptyStudent();
    const fiscal = { ...estFiscalEmpty(base), ...(base.fiscal || {}) };
    fiscal.complementoIE = { ...estFiscalEmpty(base).complementoIE, ...(fiscal.complementoIE || {}), nombreAlumno: base.name || '', curpAlumno: base.curp || '', nivelEducativo: base.nivel || '' };
    return { ...base, email: base.email || estGeneratedEmail(base.name, entry && entry._id), fiscal, factura: !!(base.factura || fiscal.factura), hasBeca: !!base.hasBeca || Number(base.beca) > 0, beca: Number(base.beca) || 0, initialPayments: { inscripcionPagada: false, inscripcion: 0, channel: 'Transferencia', detalle: '' }, accessKey: (base.access && base.access.key) || '' };
  });
  const photoRef = React.useRef(null);
  const groups = estGroupsByNivel(form.nivel);
  const fiscal = form.fiscal || estFiscalEmpty(form);
  const ie = fiscal.complementoIE || {};
  const ip = form.initialPayments || { inscripcionPagada: false, inscripcion: 0, channel: 'Transferencia', detalle: '' };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setFiscal = (k, v) => setForm(f => ({ ...f, fiscal: { ...(f.fiscal || estFiscalEmpty(f)), [k]: v } }));
  const setIE = (k, v) => setForm(f => ({ ...f, fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), [k]: v } } }));
  const setPay = (k, v) => setForm(f => ({ ...f, initialPayments: { ...(f.initialPayments || {}), [k]: v } }));
  function updateName(v) { setForm(f => ({ ...f, name: v, email: estGeneratedEmail(v, entry && entry._id), fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), nombreAlumno: v } } })); }
  function updateCurp(v) { const curp = String(v || '').toUpperCase(); setForm(f => ({ ...f, curp, fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), curpAlumno: curp } } })); }
  function updateNivel(v) { const g = estGroupsByNivel(v)[0] || ''; setForm(f => ({ ...f, nivel: v, grade: g, plan: '10', fiscal: { ...(f.fiscal || estFiscalEmpty(f)), complementoIE: { ...((f.fiscal && f.fiscal.complementoIE) || {}), nivelEducativo: v } }, initialPayments: { ...(f.initialPayments || {}), inscripcion: f.initialPayments && f.initialPayments.inscripcionPagada ? estInscripcionAmount(v) : (f.initialPayments ? f.initialPayments.inscripcion : 0) } })); }
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
    try { if (Store.saveState) Store.saveState(); } catch (_) {}
    toast('Estudiante guardado · usuario ' + acc.email + ' · clave generada' + (pays ? ' · pago real de inscripción' : ''), 'ok');
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
      <div className="field-row"><Field label="Forma de pago"><SelectInput style={{ minHeight: 42 }} value={ip.channel || 'Transferencia'} onChange={e => setPay('channel', e.target.value)} options={['Transferencia', 'Tarjeta', 'Efectivo', 'Domiciliación']} /></Field><Field label="Detalle"><TextInput value={ip.detalle || ''} onChange={e => setPay('detalle', e.target.value)} placeholder="Folio, SPEI, caja, observaciones" /></Field></div>
      <div className="faint" style={{ fontSize: 12 }}>No se registra ningún pago si la inscripción queda en cero.</div>
      <div className="eyebrow">Facturación</div>
      <Field label="¿Factura el estudiante?"><SelectInput value={form.factura ? 'si' : 'no'} onChange={e => set('factura', e.target.value === 'si')} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field>
      {form.factura && <div className="col" style={{ gap: 12 }}><div className="field-row"><Field label="Razón social"><TextInput value={fiscal.razonSocial || ''} onChange={e => setFiscal('razonSocial', e.target.value.toUpperCase())} /></Field><Field label="RFC"><TextInput value={fiscal.rfc || ''} onChange={e => setFiscal('rfc', e.target.value.toUpperCase())} /></Field></div><div className="field-row"><Field label="Régimen fiscal"><SelectInput value={fiscal.regimenFiscal || ''} onChange={e => setFiscal('regimenFiscal', e.target.value)} options={EST_REGIMENES} /></Field><Field label="Uso CFDI"><SelectInput value={fiscal.usoCfdi || 'D10'} onChange={e => setFiscal('usoCfdi', e.target.value)} options={EST_USOS_CFDI} /></Field></div><div className="field-row"><Field label="Código postal"><TextInput value={fiscal.cpFiscal || ''} onChange={e => setFiscal('cpFiscal', e.target.value)} /></Field><Field label="Correo de facturación"><TextInput value={fiscal.emailFacturacion || ''} onChange={e => setFiscal('emailFacturacion', e.target.value.toLowerCase())} /></Field></div><Field label="Domicilio fiscal"><TextInput value={fiscal.domicilioFiscal || ''} onChange={e => setFiscal('domicilioFiscal', e.target.value)} /></Field><div className="eyebrow">Complemento de Instituciones Educativas</div><div className="field-row"><Field label="Nombre alumno"><TextInput value={ie.nombreAlumno || form.name || ''} onChange={e => setIE('nombreAlumno', e.target.value)} /></Field><Field label="CURP alumno"><TextInput value={ie.curpAlumno || form.curp || ''} onChange={e => setIE('curpAlumno', e.target.value.toUpperCase())} /></Field></div><div className="field-row"><Field label="Nivel educativo"><SelectInput value={ie.nivelEducativo || form.nivel} onChange={e => setIE('nivelEducativo', e.target.value)} options={EST_NIVELES} /></Field><Field label="Autorización / RVOE"><TextInput value={ie.autRVOE || ''} onChange={e => setIE('autRVOE', e.target.value)} /></Field></div><Field label="RFC de quien realiza el pago"><TextInput value={ie.rfcPago || ''} onChange={e => setIE('rfcPago', e.target.value.toUpperCase())} /></Field></div>}
      <div className="eyebrow">Credenciales de acceso</div>
      <div className="field-row"><Field label="Usuario generado"><TextInput value={form.email || ''} readOnly /></Field><Field label="Clave inicial"><TextInput value="Se generará automáticamente al guardar" readOnly /></Field></div>
    </div>
  </Modal>;
}
Object.assign(window, { EstudianteModal, estPrintCredential });