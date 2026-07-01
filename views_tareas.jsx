/* views_tareas.jsx — Gestión › Tareas con datos reales únicamente */

function tareaClean(v) { return String(v || '').trim().replace(/\s+/g, ' '); }
function tareaDB() { window.DB = window.DB || {}; DB.settings = DB.settings || {}; return DB; }
function tareaTone(tone) { const tones = window.TONE || {}; return tones[tone] || tones.blue || { c: 'var(--accent)', bg: 'var(--accent-soft)' }; }
function tareaIsSeedClass(c) { return /^cls-\d+$/i.test(String((c && c._id) || '')); }
function tareaDeletedClassIds() { try { return new Set((tareaDB().settings && DB.settings.deletedClassIds) || []); } catch (_) { return new Set(); } }
function tareaClasses() {
  const db = tareaDB();
  const deleted = tareaDeletedClassIds();
  return (Array.isArray(db.clases) ? db.clases : [])
    .filter(c => c && !tareaIsSeedClass(c) && !deleted.has(c._id) && tareaClean(c.g))
    .map(c => ({ ...c, nivel: c.nivel || 'Primaria', g: tareaClean(c.g), salon: c.salon || '—' }));
}
function tareaClassOf(g) { return tareaClasses().find(c => c.g === g || c._id === g) || null; }
function tareaRoster(c) {
  if (!c) return [];
  const db = tareaDB();
  const group = tareaClean(c.g || c.group || c.grade);
  const nivel = tareaClean(c.nivel);
  const list = (Array.isArray(db.students) ? db.students : []).filter(s => {
    const sg = tareaClean(s.grade || s.group || s.grupo);
    const sn = tareaClean(s.nivel || s.level);
    return sg === group && (!nivel || !sn || sn === nivel) && tareaClean(s.name || s.nombre);
  }).map(s => tareaClean(s.name || s.nombre));
  return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
}
function tareaToday() { return new Date().toISOString().slice(0, 10); }
function tareaDateLabel(iso) { try { return new Date((iso || tareaToday()) + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (_) { return iso || '—'; } }
function tareaSettings() { const db = tareaDB(); if (!Array.isArray(db.settings.tareasReal)) db.settings.tareasReal = []; return db.settings.tareasReal; }
function tareaEntries() { return tareaSettings().filter(e => e && e._id && e.group && tareaClassOf(e.group)); }
function tareaSave(entries) { const db = tareaDB(); db.settings.tareasReal = Array.isArray(entries) ? entries : []; try { if (window.Store && Store.saveState) Store.saveState(); } catch (_) {} try { window.dispatchEvent(new Event('piaget-tareas')); } catch (_) {} }
function tareaUid() { return crypto.randomUUID ? crypto.randomUUID() : 'tarea-' + Date.now() + '-' + Math.random().toString(36).slice(2); }
function tareaMaterias(nivel) { const ev = window.EV_MATERIAS || {}; return ev[nivel] || ['Español', 'Matemáticas', 'Ciencias', 'Historia', 'Inglés', 'Educación Física', 'Artes']; }
function tareaBlank() { const db = tareaDB(); const c = tareaClasses()[0]; const nivel = c ? c.nivel : 'Primaria'; return { _id: '', title: '', date: tareaToday(), due: tareaToday(), group: c ? c.g : '', nivel, subject: tareaMaterias(nivel)[0], instrucciones: '', docente: (db.user && db.user.name) || 'Docente', status: 'activa', entregas: {} }; }
function tareaEntregaStats(t) { const c = tareaClassOf(t.group); const roster = tareaRoster(c); const entregas = t.entregas || {}; const entregadas = roster.filter(n => entregas[n] === 'entregada').length; const revisadas = roster.filter(n => entregas[n] === 'revisada').length; const totalOk = entregadas + revisadas; return { total: roster.length, entregadas: totalOk, revisadas, pendientes: Math.max(0, roster.length - totalOk), pct: roster.length ? Math.round(totalOk / roster.length * 100) : 0 }; }
function tareaStatusTone(s) { return s === 'cerrada' ? 'green' : s === 'borrador' ? 'gray' : 'blue'; }

function TareaModal({ entry, onClose }) {
  const [form, setForm] = React.useState(() => entry ? { ...entry, entregas: entry.entregas || {} } : tareaBlank());
  const classes = tareaClasses();
  const groupClass = tareaClassOf(form.group) || classes[0] || null;
  const materias = tareaMaterias(groupClass ? groupClass.nivel : form.nivel || 'Primaria');
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setGroup(g) { const c = tareaClassOf(g); const n = c ? c.nivel : form.nivel || 'Primaria'; setForm(f => ({ ...f, group: g, nivel: n, subject: tareaMaterias(n)[0] || f.subject })); }
  function save() {
    if (!classes.length) { toast('Crea primero grupos reales en Clases', 'warn'); return; }
    if (!form.group || !tareaClassOf(form.group)) { toast('Selecciona un grupo real', 'warn'); return; }
    if (!tareaClean(form.title)) { toast('Escribe el título de la tarea', 'warn'); return; }
    const payload = { ...form, _id: form._id || tareaUid(), title: tareaClean(form.title), instrucciones: tareaClean(form.instrucciones), date: form.date || tareaToday(), due: form.due || tareaToday(), subject: form.subject || materias[0] || 'General', status: form.status || 'activa', entregas: form.entregas || {}, updatedAt: new Date().toISOString(), createdAt: form.createdAt || new Date().toISOString(), real: true };
    const existing = tareaEntries();
    tareaSave(existing.some(e => e._id === payload._id) ? existing.map(e => e._id === payload._id ? payload : e) : [payload, ...existing]);
    try { if (window.Store && Store.log) Store.log(payload.docente || 'Docente', 'asignó tarea en ' + payload.group + ' · ' + payload.subject, 'clipboard'); } catch (_) {}
    toast('Tarea guardada ✓', 'ok');
    onClose();
  }
  return <Modal open width={640} title={entry ? 'Editar tarea' : 'Nueva tarea'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar tarea</button></>}>
    {!classes.length ? <div className="card pad" style={{ boxShadow: 'none', textAlign: 'center' }}><Icon name="layers" size={24} className="faint" /><div style={{ fontWeight: 700, marginTop: 10 }}>No hay grupos reales</div><div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>Crea grupos en Clases antes de asignar tareas.</div></div> : <div className="col" style={{ gap: 12 }}>
      <Field label="Título"><TextInput value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="p. ej. Problemario de fracciones" autoFocus /></Field>
      <div className="field-row"><Field label="Grupo"><SelectInput value={form.group} onChange={e => setGroup(e.target.value)} options={classes.map(c => ({ value: c.g, label: c.g + ' · ' + c.nivel }))} /></Field><Field label="Materia"><SelectInput value={form.subject || materias[0] || ''} onChange={e => set('subject', e.target.value)} options={materias} /></Field></div>
      <div className="field-row"><Field label="Fecha de asignación"><input className="inp" type="date" value={form.date || tareaToday()} onChange={e => set('date', e.target.value)} /></Field><Field label="Fecha límite"><input className="inp" type="date" value={form.due || tareaToday()} onChange={e => set('due', e.target.value)} /></Field></div>
      <Field label="Estatus"><SelectInput value={form.status || 'activa'} onChange={e => set('status', e.target.value)} options={[{ value: 'activa', label: 'Activa' }, { value: 'borrador', label: 'Borrador' }, { value: 'cerrada', label: 'Cerrada' }]} /></Field>
      <Field label="Instrucciones"><textarea className="inp" value={form.instrucciones || ''} onChange={e => set('instrucciones', e.target.value)} rows={5} placeholder="Instrucciones reales de la tarea." style={{ height: 'auto', resize: 'vertical', paddingTop: 10 }} /></Field>
    </div>}
  </Modal>;
}

function TareaDetalle({ tarea, onBack, onEdit }) {
  if (typeof useStore === 'function') useStore();
  const [, force] = React.useReducer(x => x + 1, 0);
  const clase = tareaClassOf(tarea.group);
  const roster = tareaRoster(clase);
  const entregas = tarea.entregas || {};
  const st = tareaEntregaStats(tarea);
  function setEntrega(name, status) {
    const nextT = { ...tarea, entregas: { ...(tarea.entregas || {}), [name]: status }, updatedAt: new Date().toISOString() };
    tareaSave(tareaEntries().map(e => e._id === tarea._id ? nextT : e));
    force();
  }
  return <div className="content-inner"><button className="btn sm" onClick={onBack} style={{ marginBottom: 14 }}><Icon name="chevR" size={14} className="btn-ico" style={{ transform: 'rotate(180deg)' }} />Volver a tareas</button><PageHead eyebrow="Gestión" title={tarea.title} desc={(tarea.group || '—') + ' · ' + (tarea.subject || '—') + ' · vence ' + tareaDateLabel(tarea.due)}><button className="btn" onClick={onEdit}><Icon name="edit" size={15} className="btn-ico" />Editar</button></PageHead>
    <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>{[{ label: 'Alumnos reales', value: String(st.total), tone: 'blue' }, { label: 'Entregadas', value: String(st.entregadas), tone: 'green' }, { label: 'Pendientes', value: String(st.pendientes), tone: st.pendientes ? 'amber' : 'gray' }, { label: 'Avance', value: st.total ? st.pct + '%' : '—', tone: 'cyan' }].map((k, i) => { const t = tareaTone(k.tone); return <div className="card kpi" key={i}><div className="kpi-label">{k.label}</div><div className="kpi-value tnum" style={{ color: t.c }}>{k.value}</div></div>; })}</div>
    <div className="grid mt-16" style={{ gridTemplateColumns: '1.2fr 1fr', alignItems: 'start' }}><div className="card"><CardHead icon="users" title="Entregas" sub="Registro manual por alumno real" /><div>{roster.map(name => { const v = entregas[name] || 'pendiente'; return <div key={name} className="lrow"><Avatar name={name} size={30} /><div className="grow"><div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div></div><select className="inp" value={v} onChange={e => setEntrega(name, e.target.value)} style={{ height: 32, width: 140, padding: '0 8px', fontSize: 12.5 }}><option value="pendiente">Pendiente</option><option value="entregada">Entregada</option><option value="revisada">Revisada</option></select></div>; })}{!roster.length && <div className="faint" style={{ textAlign: 'center', padding: 28 }}>Este grupo no tiene alumnos reales.</div>}</div></div><div className="card pad"><CardHead icon="doc" title="Instrucciones" sub="Contenido capturado" /><p style={{ fontSize: 13, lineHeight: 1.6, margin: '8px 0 0' }}>{tarea.instrucciones || 'Sin instrucciones capturadas.'}</p></div></div>
  </div>;
}

function TareasInner({ go }) {
  if (typeof useStore === 'function') useStore();
  const [, force] = React.useReducer(x => x + 1, 0);
  const [nivel, setNivel] = React.useState('Todos');
  const [group, setGroup] = React.useState('Todos');
  const [modal, setModal] = React.useState(null);
  const [selId, setSelId] = React.useState(null);
  React.useEffect(() => { const h = () => force(); window.addEventListener('piaget-tareas', h); return () => window.removeEventListener('piaget-tareas', h); }, []);
  const classes = tareaClasses();
  const entries = tareaEntries().sort((a, b) => String(a.due || '').localeCompare(String(b.due || '')) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  const selected = selId ? entries.find(e => e._id === selId) : null;
  if (selected) return <TareaDetalle tarea={selected} onBack={() => setSelId(null)} onEdit={() => setModal(selected)} />;
  const filtered = entries.filter(e => (nivel === 'Todos' || (tareaClassOf(e.group) && tareaClassOf(e.group).nivel === nivel)) && (group === 'Todos' || e.group === group));
  const groups = Array.from(new Set(classes.filter(c => nivel === 'Todos' || c.nivel === nivel).map(c => c.g)));
  const active = entries.filter(e => e.status !== 'cerrada').length;
  const totalStats = entries.reduce((a, e) => { const s = tareaEntregaStats(e); a.total += s.total; a.done += s.entregadas; return a; }, { total: 0, done: 0 });
  function remove(e) { tareaSave(entries.filter(x => x._id !== e._id)); toast('Tarea eliminada', 'warn'); }
  const kpis = [
    { label: 'Tareas reales', value: String(entries.length), icon: 'clipboard', tone: 'blue' },
    { label: 'Activas', value: String(active), icon: 'clock', tone: 'amber' },
    { label: 'Entregas', value: totalStats.total ? Math.round(totalStats.done / totalStats.total * 100) + '%' : '—', icon: 'checkCircle', tone: 'green' },
    { label: 'Grupos reales', value: String(classes.length), icon: 'cap', tone: 'violet' },
  ];
  return <div className="content-inner"><PageHead eyebrow="Gestión" title="Tareas" desc={entries.length + ' tareas reales · sin registros demo'}><button className="btn" onClick={() => go && go('clases')}><Icon name="layers" size={15} className="btn-ico" />Clases</button><button className="btn primary" onClick={() => setModal({})}><Icon name="plus" size={15} className="btn-ico" />Asignar tarea</button></PageHead>
    <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>{kpis.map((k, i) => { const t = tareaTone(k.tone); return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>; })}</div>
    <div className="row between center wrap gap-12 mt-16" style={{ marginBottom: 12 }}><div className="seg">{['Todos', 'Preescolar', 'Primaria', 'Secundaria'].map(n => <button key={n} className={nivel === n ? 'active' : ''} onClick={() => { setNivel(n); setGroup('Todos'); }}>{n}<span className="faint" style={{ marginLeft: 6, fontSize: 11 }}>{n === 'Todos' ? classes.length : classes.filter(c => c.nivel === n).length}</span></button>)}</div><select className="inp" value={group} onChange={e => setGroup(e.target.value)} style={{ height: 34, width: 190, padding: '0 10px', fontSize: 12.5 }}><option value="Todos">Todos los grupos</option>{groups.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
    <div className="card"><CardHead icon="clipboard" title="Tareas" sub="Solo tareas capturadas por usuarios" /><div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Tarea</th><th>Grupo</th><th>Materia</th><th>Vence</th><th>Entregas</th><th>Estatus</th><th></th></tr></thead><tbody>{filtered.map(e => { const c = tareaClassOf(e.group); const cfg = window.nivelCfg && c ? nivelCfg(c.nivel) : { tone: 'blue' }; const st = tareaEntregaStats(e); return <tr key={e._id} style={{ cursor: 'pointer' }} onClick={() => setSelId(e._id)}><td><div style={{ fontWeight: 700, fontSize: 13.5 }}>{e.title}</div><div className="faint" style={{ fontSize: 11.5 }}>{e.instrucciones ? e.instrucciones.slice(0, 70) : 'Sin instrucciones'}</div></td><td><Badge tone={cfg.tone}>{e.group}</Badge></td><td className="muted" style={{ fontSize: 12.5 }}>{e.subject || '—'}</td><td className="font-mono" style={{ fontSize: 12.5 }}>{tareaDateLabel(e.due)}</td><td><div className="row center gap-8"><div style={{ width: 60 }}><Bar value={st.pct} height={6} color="var(--accent)" /></div><span className="faint font-mono" style={{ fontSize: 11.5 }}>{st.entregadas}/{st.total}</span></div></td><td><Badge tone={tareaStatusTone(e.status)} dot>{e.status || 'activa'}</Badge></td><td onClick={ev => ev.stopPropagation()}><RowMenu items={[{ icon: 'eye', label: 'Abrir', onClick: () => setSelId(e._id) }, { icon: 'edit', label: 'Editar', onClick: () => setModal(e) }, { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => remove(e) }]} /></td></tr>; })}{!filtered.length && <tr><td colSpan="7" className="faint" style={{ textAlign: 'center', padding: 30 }}>{classes.length ? 'Sin tareas reales para este filtro.' : 'Crea grupos reales en Clases antes de asignar tareas.'}</td></tr>}</tbody></table></div></div>
    {modal && <TareaModal entry={modal._id ? modal : null} onClose={() => { setModal(null); force(); }} />}
  </div>;
}

function Tareas(props) {
  try { return <TareasInner {...props} />; }
  catch (e) {
    console.warn('[PIAGET] Error en Tareas', e);
    return <div className="content-inner"><PageHead eyebrow="Gestión" title="Tareas" desc="Módulo recuperado en modo seguro." /><div className="card pad faint" style={{ textAlign: 'center', padding: 34 }}>No se pudieron renderizar las tareas. Recarga la página y revisa que existan grupos reales en Clases.</div></div>;
  }
}

Object.assign(window, { Tareas, TareasInner, tareaClasses, tareaEntries });
