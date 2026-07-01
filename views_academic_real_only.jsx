/* views_academic_real_only.jsx — Estudiantes / Académico con datos reales únicamente */

function estClean(v) { return String(v || '').trim().replace(/\s+/g, ' '); }
function estDB() { window.DB = window.DB || {}; DB.settings = DB.settings || {}; return DB; }
function estTone(tone) { const tones = window.TONE || {}; return tones[tone] || tones.blue || { c: 'var(--accent)', bg: 'var(--accent-soft)' }; }
function estIsSeedClass(c) { return /^cls-\d+$/i.test(String((c && c._id) || '')); }
function estDeletedClassIds() { try { return new Set((estDB().settings && DB.settings.deletedClassIds) || []); } catch (_) { return new Set(); } }
function estClasses() {
  const db = estDB();
  const deleted = estDeletedClassIds();
  return (Array.isArray(db.clases) ? db.clases : [])
    .filter(c => c && !estIsSeedClass(c) && !deleted.has(c._id) && estClean(c.g))
    .map(c => ({ ...c, nivel: c.nivel || 'Primaria', g: estClean(c.g), salon: c.salon || '—' }));
}
function estNivelOfStudent(s) { return s.nivel || (/sec/i.test(s.grade || s.group || s.grupo || '') ? 'Secundaria' : /^\s*k/i.test(s.grade || s.group || s.grupo || '') ? 'Preescolar' : 'Primaria'); }
function estClassOfStudent(s) { const g = estClean(s.grade || s.group || s.grupo); return estClasses().find(c => c.g === g) || null; }
function estStudents() {
  const db = estDB();
  return (Array.isArray(db.students) ? db.students : [])
    .filter(s => s && s._id && estClean(s.name || s.nombre))
    .map(s => {
      const name = estClean(s.name || s.nombre);
      const grade = estClean(s.grade || s.group || s.grupo);
      const cls = estClassOfStudent({ ...s, name, grade });
      return { ...s, name, grade, nivel: s.nivel || (cls ? cls.nivel : estNivelOfStudent({ ...s, grade })), real: true };
    });
}
function estAttendanceMap() { try { const a = DB.settings && DB.settings.asistenciasReal && DB.settings.asistenciasReal.asis_edits; return a && typeof a === 'object' ? a : {}; } catch (_) { return {}; } }
function estAttendanceFor(s) {
  const edits = estAttendanceMap();
  const prefix = '|' + s.grade + '|' + s.name;
  let reg = 0, ok = 0;
  Object.keys(edits).forEach(k => {
    if (!k.endsWith(prefix)) return;
    const v = edits[k];
    if (!v || v === 'sin_registro') return;
    reg++;
    if (v === 'presente' || v === 'retardo') ok++;
  });
  return reg ? Math.round(ok / reg * 100) : null;
}
function estRiskOf(s) {
  const att = estAttendanceFor(s);
  if ((att != null && att < 80) || String(s.risk || '').toLowerCase() === 'high') return 'high';
  if ((att != null && att < 90) || String(s.risk || '').toLowerCase() === 'mid') return 'mid';
  return 'low';
}
function estRiskBadge(r) { if (r === 'high') return <Badge tone="red" dot>Riesgo alto</Badge>; if (r === 'mid') return <Badge tone="amber" dot>Medio</Badge>; return <Badge tone="green" dot>Estable</Badge>; }
function estGroupsByNivel(nivel) { return estClasses().filter(c => !nivel || nivel === 'Todos' || c.nivel === nivel).map(c => c.g); }
function estDefaultGroup(nivel) { return estGroupsByNivel(nivel)[0] || ''; }
function estEmailDomain() { return 'jeanpiaget.mx'; }
function estSlug(v) { return estClean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n').replace(/[^a-z0-9]/g, ''); }
function estGeneratedEmail(name, existingId) {
  const p = estClean(name).split(' ').filter(Boolean);
  if (p.length < 2) return '';
  const first = estSlug(p[0]);
  const apellido1 = estSlug(p.length >= 3 ? p[p.length - 2] : p[1]);
  const apellido2 = p.length >= 3 ? estSlug(p[p.length - 1]).slice(0, 1) : '';
  let base = first + apellido1 + apellido2;
  const domain = estEmailDomain();
  const used = new Set(estStudents().filter(s => s._id !== existingId).map(s => String(s.email || '').toLowerCase()).filter(Boolean));
  let email = base + '@' + domain;
  let n = 2;
  while (used.has(email)) { email = base + n + '@' + domain; n++; }
  return email;
}
function estPlanOptions() { return [{ value: '10', label: 'Plan 10 · 10 mensualidades' }, { value: '12', label: 'Plan 12 · 12 colegiaturas' }, { value: 'anual', label: 'Pago anual' }]; }
function estFiscalEmpty() { return { factura: false, razonSocial: '', rfc: '', regimenFiscal: '', usoCfdi: 'D10', cpFiscal: '', domicilioFiscal: '', emailFacturacion: '' }; }
function estEmptyStudent() {
  const nivel = estClasses()[0] ? estClasses()[0].nivel : 'Primaria';
  return {
    name: '', curp: '', birth: '', sex: 'Femenino', nivel, grade: estDefaultGroup(nivel), ingreso: new Date().toISOString().slice(0, 10),
    tutor: '', parentesco: 'Madre', phone: '', email: '', emergencia: '', emergenciaTel: '', sangre: 'No especificado', alergias: '', photo: '',
    plan: '10', hasBeca: false, beca: 0, pay: 'al día', factura: false, fiscal: estFiscalEmpty()
  };
}
function estPhotoFile(file, cb) { if (!file) return; const r = new FileReader(); r.onload = () => cb(String(r.result)); r.readAsDataURL(file); }

function EstudianteModal({ entry, onClose }) {
  const [form, setForm] = React.useState(() => {
    const base = entry ? { ...estEmptyStudent(), ...entry } : estEmptyStudent();
    const fiscal = { ...estFiscalEmpty(), ...(entry && entry.fiscal ? entry.fiscal : {}), factura: !!(entry && (entry.factura || (entry.fiscal && entry.fiscal.factura))) };
    const merged = { ...base, hasBeca: !!(base.hasBeca || Number(base.beca) > 0), beca: Number(base.beca) || 0, fiscal, factura: fiscal.factura };
    if (!merged.email && merged.name) merged.email = estGeneratedEmail(merged.name, entry && entry._id);
    return merged;
  });
  const classes = estClasses();
  const grupos = estGroupsByNivel(form.nivel);
  const photoRef = React.useRef(null);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setFiscal(k, v) { setForm(f => ({ ...f, fiscal: { ...(f.fiscal || estFiscalEmpty()), [k]: v }, factura: k === 'factura' ? !!v : f.factura })); }
  function setName(v) { setForm(f => ({ ...f, name: v, email: estGeneratedEmail(v, entry && entry._id) })); }
  function pickNivel(nv) { const g = estDefaultGroup(nv); setForm(f => ({ ...f, nivel: nv, grade: g })); }
  function save() {
    if (!classes.length) { toast('Crea primero grupos reales en Clases', 'warn'); return; }
    if (!estClean(form.name)) { toast('Escribe el nombre del estudiante', 'warn'); return; }
    if (!form.grade || !classes.some(c => c.g === form.grade)) { toast('Selecciona un grupo real', 'warn'); return; }
    const fiscal = { ...estFiscalEmpty(), ...(form.fiscal || {}), factura: !!form.factura || !!(form.fiscal && form.fiscal.factura) };
    if (fiscal.factura && (!estClean(fiscal.razonSocial) || !estClean(fiscal.rfc))) { toast('Completa razón social y RFC para facturación', 'warn'); return; }
    const generatedEmail = estGeneratedEmail(form.name, entry && entry._id);
    const payload = {
      ...form,
      name: estClean(form.name), tutor: estClean(form.tutor), phone: estClean(form.phone), email: generatedEmail,
      plan: form.plan || '10', hasBeca: !!form.hasBeca, beca: form.hasBeca ? Math.max(0, Math.min(100, Number(form.beca) || 0)) : 0,
      factura: fiscal.factura, fiscal,
      nivel: form.nivel, grade: form.grade, manual: true, real: true
    };
    delete payload.avg;
    if (entry && entry._id) {
      Store.update('students', entry._id, payload);
      toast('Estudiante actualizado ✓', 'ok');
    } else {
      const seq = 1000 + estStudents().length + 1;
      Store.add('students', { ...payload, matricula: 'EST-2026-' + seq });
      toast('Estudiante registrado ✓', 'ok');
    }
    try { if (Store.saveState) Store.saveState(); } catch (_) {}
    onClose();
  }
  return <Modal open width={760} title={entry ? 'Editar estudiante' : 'Nuevo estudiante'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar</button></>}>
    {!classes.length ? <div className="card pad" style={{ boxShadow: 'none', textAlign: 'center' }}><Icon name="layers" size={24} className="faint" /><div style={{ fontWeight: 700, marginTop: 10 }}>No hay grupos reales</div><div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>Crea grupos en Clases antes de registrar estudiantes.</div></div> : <div className="col" style={{ gap: 14 }}>
      <div className="row center gap-12"><div onClick={() => photoRef.current && photoRef.current.click()} style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{form.photo ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={26} className="faint" />}</div><button className="btn sm" onClick={() => photoRef.current && photoRef.current.click()}><Icon name="plus" size={12} className="btn-ico" />{form.photo ? 'Cambiar foto' : 'Subir foto'}</button><input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => estPhotoFile(e.target.files[0], url => set('photo', url))} /></div>
      <div className="eyebrow">Datos del estudiante</div>
      <Field label="Nombre completo"><TextInput value={form.name || ''} onChange={e => setName(e.target.value)} autoFocus placeholder="Nombre(s) Apellido paterno Apellido materno" /></Field>
      <Field label="Correo institucional generado"><TextInput value={form.email || ''} readOnly placeholder="Se genera con primer nombre + primer apellido + inicial del segundo apellido" /></Field>
      <div className="field-row"><Field label="Nivel"><SelectInput value={form.nivel} onChange={e => pickNivel(e.target.value)} options={['Preescolar', 'Primaria', 'Secundaria']} /></Field><Field label="Grupo real"><SelectInput value={form.grade || ''} onChange={e => set('grade', e.target.value)} options={grupos.length ? grupos : ['']} /></Field></div>
      <div className="field-row"><Field label="CURP"><TextInput value={form.curp || ''} onChange={e => set('curp', e.target.value.toUpperCase())} /></Field><Field label="Fecha de nacimiento"><input className="inp" type="date" value={form.birth || ''} onChange={e => set('birth', e.target.value)} /></Field></div>
      <div className="field-row"><Field label="Tutor"><TextInput value={form.tutor || ''} onChange={e => set('tutor', e.target.value)} /></Field><Field label="Teléfono"><TextInput value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></Field></div>

      <div className="eyebrow">Plan de pagos y beca</div>
      <div className="field-row"><Field label="Tipo de plan de pagos"><SelectInput value={form.plan || '10'} onChange={e => set('plan', e.target.value)} options={estPlanOptions()} /></Field><Field label="Estatus de colegiatura"><SelectInput value={form.pay || 'al día'} onChange={e => set('pay', e.target.value)} options={['al día', 'atrasado']} /></Field></div>
      <div className="field-row"><Field label="¿Tiene beca?"><SelectInput value={form.hasBeca ? 'si' : 'no'} onChange={e => setForm(f => ({ ...f, hasBeca: e.target.value === 'si', beca: e.target.value === 'si' ? f.beca : 0 }))} options={[{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }]} /></Field><Field label="Porcentaje de beca asignado"><NumberInput min="0" max="100" step="1" value={form.hasBeca ? (form.beca || 0) : 0} disabled={!form.hasBeca} onChange={e => set('beca', e.target.value)} /></Field></div>

      <div className="eyebrow">Facturación</div>
      <Field label="¿Requiere factura?"><SelectInput value={form.factura ? 'si' : 'no'} onChange={e => { const yes = e.target.value === 'si'; setForm(f => ({ ...f, factura: yes, fiscal: { ...(f.fiscal || estFiscalEmpty()), factura: yes } })); }} options={[{ value: 'no', label: 'No factura' }, { value: 'si', label: 'Sí factura' }]} /></Field>
      {form.factura && <div className="col" style={{ gap: 12 }}>
        <div className="field-row"><Field label="Razón social"><TextInput value={(form.fiscal && form.fiscal.razonSocial) || ''} onChange={e => setFiscal('razonSocial', e.target.value.toUpperCase())} /></Field><Field label="RFC"><TextInput value={(form.fiscal && form.fiscal.rfc) || ''} onChange={e => setFiscal('rfc', e.target.value.toUpperCase())} /></Field></div>
        <div className="field-row"><Field label="Régimen fiscal"><SelectInput value={(form.fiscal && form.fiscal.regimenFiscal) || ''} onChange={e => setFiscal('regimenFiscal', e.target.value)} options={['', '601 General de Ley Personas Morales', '603 Personas Morales con Fines no Lucrativos', '605 Sueldos y Salarios', '606 Arrendamiento', '612 Actividades Empresariales', '616 Sin obligaciones fiscales', '626 RESICO']} /></Field><Field label="Uso CFDI"><SelectInput value={(form.fiscal && form.fiscal.usoCfdi) || 'D10'} onChange={e => setFiscal('usoCfdi', e.target.value)} options={['D10 Pagos por servicios educativos', 'G03 Gastos en general', 'S01 Sin efectos fiscales']} /></Field></div>
        <div className="field-row"><Field label="Código postal fiscal"><TextInput value={(form.fiscal && form.fiscal.cpFiscal) || ''} onChange={e => setFiscal('cpFiscal', e.target.value)} /></Field><Field label="Correo para facturación"><TextInput value={(form.fiscal && form.fiscal.emailFacturacion) || ''} onChange={e => setFiscal('emailFacturacion', e.target.value.toLowerCase())} /></Field></div>
        <Field label="Domicilio fiscal"><TextInput value={(form.fiscal && form.fiscal.domicilioFiscal) || ''} onChange={e => setFiscal('domicilioFiscal', e.target.value)} /></Field>
      </div>}
    </div>}
  </Modal>;
}

function AcademicoRealOnly({ go }) {
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
  const attVals = students.map(estAttendanceFor).filter(v => v != null);
  const att = attVals.length ? (attVals.reduce((a, b) => a + b, 0) / attVals.length).toFixed(1) + '%' : '—';
  const risk = students.filter(s => estRiskOf(s) !== 'low').length;
  const becados = students.filter(s => Number(s.beca) > 0 || s.hasBeca).length;
  const facturan = students.filter(s => s.factura || (s.fiscal && s.fiscal.factura)).length;
  const kpis = [
    { label: 'Estudiantes reales', value: String(students.length), icon: 'cap', tone: 'blue' },
    { label: 'Grupos reales', value: String(classes.length), icon: 'layers', tone: 'cyan' },
    { label: 'Becados', value: String(becados), icon: 'award', tone: 'green' },
    { label: 'Facturan', value: String(facturan), icon: 'receipt', tone: 'violet' },
    { label: 'Riesgo real', value: String(risk), icon: 'alert', tone: risk ? 'amber' : 'gray' },
  ];
  function remove(s) { Store.remove('students', s._id); try { if (Store.saveState) Store.saveState(); } catch (_) {} toast('Estudiante eliminado', 'warn'); force(); }
  return <div className="content-inner"><PageHead eyebrow="Administración" title="Estudiantes" desc={students.length + ' estudiantes reales · sin alumnos generados'}><button className="btn" onClick={() => go && go('clases')}><Icon name="layers" size={15} className="btn-ico" />Clases</button><button className="btn primary" onClick={() => setModal({})}><Icon name="plus" size={15} className="btn-ico" />Nuevo estudiante</button></PageHead>
    <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>{kpis.map((k, i) => { const t = estTone(k.tone); return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>; })}</div>
    <div className="row between center wrap gap-12 mt-16" style={{ marginBottom: 12 }}><div className="seg">{['Todos', 'Preescolar', 'Primaria', 'Secundaria'].map(n => <button key={n} className={nivel === n ? 'active' : ''} onClick={() => { setNivel(n); setGrupo('Todos'); }}>{n}<span className="faint" style={{ marginLeft: 6, fontSize: 11 }}>{n === 'Todos' ? students.length : students.filter(s => s.nivel === n).length}</span></button>)}</div><select className="inp" value={grupo} onChange={e => setGrupo(e.target.value)} style={{ height: 34, width: 190, padding: '0 10px', fontSize: 12.5 }}>{grupos.map(g => <option key={g} value={g}>{g === 'Todos' ? 'Todos los grupos' : g}</option>)}</select><input className="inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar estudiante" style={{ height: 34, width: 220 }} /></div>
    <div className="card"><CardHead icon="users" title="Lista de estudiantes" sub="Solo registros dados de alta" /><div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Alumno</th><th>Nivel / grupo</th><th>Plan</th><th>Beca</th><th>Factura</th><th>Asistencia</th><th>Estatus</th><th></th></tr></thead><tbody>{filtered.map(s => { const attS = estAttendanceFor(s); const r = estRiskOf(s); const fiscal = s.fiscal || {}; return <tr key={s._id}><td><div className="person">{s.photo ? <img src={s.photo} alt="" style={{ width: 32, height: 32, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }} /> : <Avatar name={s.name} size={32} />}<div><div className="pname">{s.name}</div><div className="pmeta">{s.email || 'Sin correo generado'}</div></div></div></td><td><div className="row center gap-8"><Badge tone={window.nivelCfg ? nivelCfg(s.nivel).tone : 'blue'}>{s.nivel}</Badge><span className="font-mono" style={{ fontSize: 12.5 }}>{s.grade || '—'}</span></div></td><td><Badge tone="blue">{window.cobPlanLabel ? cobPlanLabel(s.plan || '10') : (s.plan || '10')}</Badge></td><td>{Number(s.beca) > 0 ? <Badge tone="green">{Number(s.beca)}%</Badge> : <Badge tone="gray">Sin beca</Badge>}</td><td>{s.factura || fiscal.factura ? <Badge tone="violet">Factura</Badge> : <Badge tone="gray">No</Badge>}</td><td><span className="tnum faint font-mono" style={{ fontSize: 12 }}>{attS == null ? '—' : attS + '%'}</span></td><td>{s.pay === 'atrasado' ? <Badge tone="red">Atrasado</Badge> : estRiskBadge(r)}</td><td><RowMenu items={[{ icon: 'edit', label: 'Editar', onClick: () => setModal(s) }, { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => remove(s) }]} /></td></tr>; })}{!filtered.length && <tr><td colSpan="8" className="faint" style={{ textAlign: 'center', padding: 32 }}>{classes.length ? 'Sin estudiantes reales para este filtro.' : 'Crea grupos reales en Clases y después registra estudiantes.'}</td></tr>}</tbody></table></div></div>
    {modal && <EstudianteModal entry={modal._id ? modal : null} onClose={() => { setModal(null); force(); }} />}
  </div>;
}

function Academico(props) {
  try { return <AcademicoRealOnly {...props} />; }
  catch (e) {
    console.warn('[PIAGET] Error en Estudiantes real-only', e);
    return <div className="content-inner"><PageHead eyebrow="Administración" title="Estudiantes" desc="Módulo recuperado en modo seguro." /><div className="card pad faint" style={{ textAlign: 'center', padding: 34 }}>No se pudo renderizar Estudiantes. Recarga la página y verifica que existan grupos reales en Clases.</div></div>;
  }
}

Object.assign(window, { Academico, AcademicoRealOnly, estStudents, estClasses, estGeneratedEmail });
