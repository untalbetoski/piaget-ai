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
function estAvgOf(s) { const v = s.avg; return v === '' || v == null ? null : Number(v); }
function estRiskOf(s) {
  const avg = estAvgOf(s);
  const att = estAttendanceFor(s);
  if ((avg != null && avg < 7) || (att != null && att < 80) || String(s.risk || '').toLowerCase() === 'high') return 'high';
  if ((avg != null && avg < 8) || (att != null && att < 90) || String(s.risk || '').toLowerCase() === 'mid') return 'mid';
  return 'low';
}
function estRiskBadge(r) { if (r === 'high') return <Badge tone="red" dot>Riesgo alto</Badge>; if (r === 'mid') return <Badge tone="amber" dot>Medio</Badge>; return <Badge tone="green" dot>Estable</Badge>; }
function estGroupsByNivel(nivel) { return estClasses().filter(c => !nivel || nivel === 'Todos' || c.nivel === nivel).map(c => c.g); }
function estDefaultGroup(nivel) { return estGroupsByNivel(nivel)[0] || ''; }
function estEmptyStudent() {
  const nivel = estClasses()[0] ? estClasses()[0].nivel : 'Primaria';
  return { name: '', curp: '', birth: '', sex: 'Femenino', nivel, grade: estDefaultGroup(nivel), ingreso: new Date().toISOString().slice(0, 10), tutor: '', parentesco: 'Madre', phone: '', email: '', emergencia: '', emergenciaTel: '', sangre: 'No especificado', alergias: '', plan: '10', beca: 0, pay: 'al día', avg: '', photo: '' };
}
function estPhotoFile(file, cb) { if (!file) return; const r = new FileReader(); r.onload = () => cb(String(r.result)); r.readAsDataURL(file); }

function EstudianteModal({ entry, onClose }) {
  const [form, setForm] = React.useState(() => entry ? { ...estEmptyStudent(), ...entry } : estEmptyStudent());
  const classes = estClasses();
  const grupos = estGroupsByNivel(form.nivel);
  const photoRef = React.useRef(null);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function pickNivel(nv) { const g = estDefaultGroup(nv); setForm(f => ({ ...f, nivel: nv, grade: g })); }
  function save() {
    if (!classes.length) { toast('Crea primero grupos reales en Clases', 'warn'); return; }
    if (!estClean(form.name)) { toast('Escribe el nombre del estudiante', 'warn'); return; }
    if (!form.grade || !classes.some(c => c.g === form.grade)) { toast('Selecciona un grupo real', 'warn'); return; }
    const payload = { ...form, name: estClean(form.name), tutor: estClean(form.tutor), phone: estClean(form.phone), email: estClean(form.email), beca: Number(form.beca) || 0, avg: form.avg === '' || form.avg == null ? null : Number(form.avg), nivel: form.nivel, grade: form.grade, manual: true, real: true };
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
  return <Modal open width={640} title={entry ? 'Editar estudiante' : 'Nuevo estudiante'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar</button></>}>
    {!classes.length ? <div className="card pad" style={{ boxShadow: 'none', textAlign: 'center' }}><Icon name="layers" size={24} className="faint" /><div style={{ fontWeight: 700, marginTop: 10 }}>No hay grupos reales</div><div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>Crea grupos en Clases antes de registrar estudiantes.</div></div> : <div className="col" style={{ gap: 12 }}>
      <div className="row center gap-12"><div onClick={() => photoRef.current && photoRef.current.click()} style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{form.photo ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={26} className="faint" />}</div><button className="btn sm" onClick={() => photoRef.current && photoRef.current.click()}><Icon name="plus" size={12} className="btn-ico" />{form.photo ? 'Cambiar foto' : 'Subir foto'}</button><input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => estPhotoFile(e.target.files[0], url => set('photo', url))} /></div>
      <Field label="Nombre completo"><TextInput value={form.name || ''} onChange={e => set('name', e.target.value)} autoFocus /></Field>
      <div className="field-row"><Field label="Nivel"><SelectInput value={form.nivel} onChange={e => pickNivel(e.target.value)} options={['Preescolar', 'Primaria', 'Secundaria']} /></Field><Field label="Grupo real"><SelectInput value={form.grade || ''} onChange={e => set('grade', e.target.value)} options={grupos.length ? grupos : ['']} /></Field></div>
      <div className="field-row"><Field label="CURP"><TextInput value={form.curp || ''} onChange={e => set('curp', e.target.value.toUpperCase())} /></Field><Field label="Fecha de nacimiento"><input className="inp" type="date" value={form.birth || ''} onChange={e => set('birth', e.target.value)} /></Field></div>
      <div className="field-row"><Field label="Tutor"><TextInput value={form.tutor || ''} onChange={e => set('tutor', e.target.value)} /></Field><Field label="Teléfono"><TextInput value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></Field></div>
      <Field label="Correo"><TextInput value={form.email || ''} onChange={e => set('email', e.target.value)} /></Field>
      <div className="field-row"><Field label="Promedio real capturado"><NumberInput min="0" max="10" step="0.1" value={form.avg == null ? '' : form.avg} onChange={e => set('avg', e.target.value)} /></Field><Field label="Colegiatura"><SelectInput value={form.pay || 'al día'} onChange={e => set('pay', e.target.value)} options={['al día', 'atrasado']} /></Field></div>
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
  const withAvg = students.map(estAvgOf).filter(v => v != null && !isNaN(v));
  const avg = withAvg.length ? (withAvg.reduce((a, b) => a + b, 0) / withAvg.length).toFixed(1) : '—';
  const attVals = students.map(estAttendanceFor).filter(v => v != null);
  const att = attVals.length ? (attVals.reduce((a, b) => a + b, 0) / attVals.length).toFixed(1) + '%' : '—';
  const risk = students.filter(s => estRiskOf(s) !== 'low').length;
  const kpis = [
    { label: 'Estudiantes reales', value: String(students.length), icon: 'cap', tone: 'blue' },
    { label: 'Grupos reales', value: String(classes.length), icon: 'layers', tone: 'cyan' },
    { label: 'Promedio real', value: avg, icon: 'award', tone: 'green' },
    { label: 'Asistencia registrada', value: att, icon: 'checkCircle', tone: 'violet' },
    { label: 'Riesgo real', value: String(risk), icon: 'alert', tone: risk ? 'amber' : 'gray' },
  ];
  function remove(s) { Store.remove('students', s._id); try { if (Store.saveState) Store.saveState(); } catch (_) {} toast('Estudiante eliminado', 'warn'); force(); }
  return <div className="content-inner"><PageHead eyebrow="Administración" title="Estudiantes" desc={students.length + ' estudiantes reales · sin alumnos generados'}><button className="btn" onClick={() => go && go('clases')}><Icon name="layers" size={15} className="btn-ico" />Clases</button><button className="btn primary" onClick={() => setModal({})}><Icon name="plus" size={15} className="btn-ico" />Nuevo estudiante</button></PageHead>
    <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>{kpis.map((k, i) => { const t = estTone(k.tone); return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>; })}</div>
    <div className="row between center wrap gap-12 mt-16" style={{ marginBottom: 12 }}><div className="seg">{['Todos', 'Preescolar', 'Primaria', 'Secundaria'].map(n => <button key={n} className={nivel === n ? 'active' : ''} onClick={() => { setNivel(n); setGrupo('Todos'); }}>{n}<span className="faint" style={{ marginLeft: 6, fontSize: 11 }}>{n === 'Todos' ? students.length : students.filter(s => s.nivel === n).length}</span></button>)}</div><select className="inp" value={grupo} onChange={e => setGrupo(e.target.value)} style={{ height: 34, width: 190, padding: '0 10px', fontSize: 12.5 }}>{grupos.map(g => <option key={g} value={g}>{g === 'Todos' ? 'Todos los grupos' : g}</option>)}</select><input className="inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar estudiante" style={{ height: 34, width: 220 }} /></div>
    <div className="card"><CardHead icon="users" title="Lista de estudiantes" sub="Solo registros dados de alta" /><div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Alumno</th><th>Nivel / grupo</th><th>Promedio</th><th>Asistencia</th><th>Riesgo</th><th>Colegiatura</th><th></th></tr></thead><tbody>{filtered.map(s => { const avgS = estAvgOf(s); const attS = estAttendanceFor(s); const r = estRiskOf(s); return <tr key={s._id}><td><div className="person">{s.photo ? <img src={s.photo} alt="" style={{ width: 32, height: 32, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }} /> : <Avatar name={s.name} size={32} />}<div><div className="pname">{s.name}</div><div className="pmeta">Tutor: {s.tutor || '—'}</div></div></div></td><td><div className="row center gap-8"><Badge tone={window.nivelCfg ? nivelCfg(s.nivel).tone : 'blue'}>{s.nivel}</Badge><span className="font-mono" style={{ fontSize: 12.5 }}>{s.grade || '—'}</span></div></td><td><span className="tnum" style={{ fontWeight: 600, color: avgS == null ? 'var(--text-faint)' : avgS < 7 ? 'var(--red)' : avgS >= 9 ? 'var(--green)' : 'var(--text)' }}>{avgS == null ? '—' : avgS}</span></td><td><span className="tnum faint font-mono" style={{ fontSize: 12 }}>{attS == null ? '—' : attS + '%'}</span></td><td>{estRiskBadge(r)}</td><td>{s.pay === 'atrasado' ? <Badge tone="red">Atrasado</Badge> : <Badge tone="green">Al día</Badge>}</td><td><RowMenu items={[{ icon: 'edit', label: 'Editar', onClick: () => setModal(s) }, { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => remove(s) }]} /></td></tr>; })}{!filtered.length && <tr><td colSpan="7" className="faint" style={{ textAlign: 'center', padding: 32 }}>{classes.length ? 'Sin estudiantes reales para este filtro.' : 'Crea grupos reales en Clases y después registra estudiantes.'}</td></tr>}</tbody></table></div></div>
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

Object.assign(window, { Academico, AcademicoRealOnly, estStudents, estClasses });
