/* views_diario.jsx — Gestión › Diario blindado, con datos reales únicamente */

function diarioClean(v) { return String(v || '').trim().replace(/\s+/g, ' '); }
function diarioTone(tone) { const tones = window.TONE || {}; return tones[tone] || tones.blue || { c: 'var(--accent)', bg: 'var(--accent-soft)' }; }
function diarioDB() { window.DB = window.DB || {}; DB.settings = DB.settings || {}; return DB; }
function diarioIsSeedClass(c) { return /^cls-\d+$/i.test(String((c && c._id) || '')); }
function diarioDeletedClassIds() { try { return new Set((diarioDB().settings && DB.settings.deletedClassIds) || []); } catch (_) { return new Set(); } }
function diarioClasses() {
  const db = diarioDB();
  const deleted = diarioDeletedClassIds();
  return (Array.isArray(db.clases) ? db.clases : [])
    .filter(c => c && !diarioIsSeedClass(c) && !deleted.has(c._id) && diarioClean(c.g))
    .map(c => ({ ...c, nivel: c.nivel || 'Primaria', g: diarioClean(c.g), salon: c.salon || '—' }));
}
function diarioClassOf(g) { return diarioClasses().find(c => c.g === g || c._id === g) || null; }
function diarioRoster(c) {
  if (!c) return [];
  const db = diarioDB();
  const group = diarioClean(c.g || c.group || c.grade);
  const nivel = diarioClean(c.nivel);
  const list = (Array.isArray(db.students) ? db.students : []).filter(s => {
    const sg = diarioClean(s.grade || s.group || s.grupo);
    const sn = diarioClean(s.nivel || s.level);
    return sg === group && (!nivel || !sn || sn === nivel) && diarioClean(s.name || s.nombre);
  }).map(s => diarioClean(s.name || s.nombre));
  return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
}
function diarioToday() { return new Date().toISOString().slice(0, 10); }
function diarioDateLabel(iso) { try { return new Date((iso || diarioToday()) + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); } catch (_) { return iso || '—'; } }
function diarioSettings() { const db = diarioDB(); if (!Array.isArray(db.settings.diarioReal)) db.settings.diarioReal = []; return db.settings.diarioReal; }
function diarioEntries() { return diarioSettings().filter(e => e && e._id && e.group && diarioClassOf(e.group)); }
function diarioSave(entries) { const db = diarioDB(); db.settings.diarioReal = Array.isArray(entries) ? entries : []; try { if (window.Store && Store.saveState) Store.saveState(); } catch (_) {} try { window.dispatchEvent(new Event('piaget-diario')); } catch (_) {} }
function diarioUid() { return crypto.randomUUID ? crypto.randomUUID() : 'diario-' + Date.now() + '-' + Math.random().toString(36).slice(2); }
function diarioMaterias(nivel) { const ev = window.EV_MATERIAS || {}; return ev[nivel] || ['Español', 'Matemáticas', 'Ciencias', 'Historia', 'Inglés', 'Educación Física', 'Artes']; }
function diarioBlank() { const db = diarioDB(); const c = diarioClasses()[0]; const nivel = c ? c.nivel : 'Primaria'; return { _id: '', date: diarioToday(), group: c ? c.g : '', nivel, subject: diarioMaterias(nivel)[0], title: '', avance: '', observaciones: '', acuerdos: '', docente: (db.user && db.user.name) || 'Docente' }; }

function DiarioModal({ entry, onClose }) {
  const [form, setForm] = React.useState(() => entry ? { ...entry } : diarioBlank());
  const classes = diarioClasses();
  const groupClass = diarioClassOf(form.group) || classes[0] || null;
  const materias = diarioMaterias(groupClass ? groupClass.nivel : form.nivel || 'Primaria');
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setGroup(g) { const c = diarioClassOf(g); const n = c ? c.nivel : form.nivel || 'Primaria'; setForm(f => ({ ...f, group: g, nivel: n, subject: diarioMaterias(n)[0] || f.subject })); }
  function save() {
    if (!classes.length) { toast('Crea primero grupos reales en Clases', 'warn'); return; }
    if (!form.group || !diarioClassOf(form.group)) { toast('Selecciona un grupo real', 'warn'); return; }
    if (!diarioClean(form.title) && !diarioClean(form.avance) && !diarioClean(form.observaciones)) { toast('Escribe al menos un avance u observación', 'warn'); return; }
    const payload = { ...form, _id: form._id || diarioUid(), date: form.date || diarioToday(), title: diarioClean(form.title) || 'Entrada de diario', avance: diarioClean(form.avance), observaciones: diarioClean(form.observaciones), acuerdos: diarioClean(form.acuerdos), updatedAt: new Date().toISOString(), createdAt: form.createdAt || new Date().toISOString(), real: true };
    const existing = diarioEntries();
    diarioSave(existing.some(e => e._id === payload._id) ? existing.map(e => e._id === payload._id ? payload : e) : [payload, ...existing]);
    try { if (window.Store && Store.log) Store.log(payload.docente || 'Docente', 'registró diario de ' + payload.group + ' · ' + payload.subject, 'edit'); } catch (_) {}
    toast('Entrada de diario guardada ✓', 'ok');
    onClose();
  }
  return <Modal open width={640} title={entry ? 'Editar entrada de diario' : 'Nueva entrada de diario'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar entrada</button></>}>
    {!classes.length ? <div className="card pad" style={{ boxShadow: 'none', textAlign: 'center' }}><Icon name="layers" size={24} className="faint" /><div style={{ fontWeight: 700, marginTop: 10 }}>No hay grupos reales</div><div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>Crea grupos en Clases antes de registrar el diario.</div></div> : <div className="col" style={{ gap: 12 }}>
      <div className="field-row"><Field label="Fecha"><input className="inp" type="date" value={form.date || diarioToday()} onChange={e => set('date', e.target.value)} /></Field><Field label="Grupo"><SelectInput value={form.group} onChange={e => setGroup(e.target.value)} options={classes.map(c => ({ value: c.g, label: c.g + ' · ' + c.nivel }))} /></Field></div>
      <Field label="Materia / campo"><SelectInput value={form.subject || materias[0] || ''} onChange={e => set('subject', e.target.value)} options={materias} /></Field>
      <Field label="Título"><TextInput value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="p. ej. Avance de la sesión" /></Field>
      <Field label="Avance de clase"><textarea className="inp" value={form.avance || ''} onChange={e => set('avance', e.target.value)} rows={4} placeholder="Describe lo trabajado en clase con datos reales de la sesión." style={{ height: 'auto', resize: 'vertical', paddingTop: 10 }} /></Field>
      <Field label="Observaciones"><textarea className="inp" value={form.observaciones || ''} onChange={e => set('observaciones', e.target.value)} rows={4} placeholder="Observaciones del grupo, sin generar alumnos ni incidencias inventadas." style={{ height: 'auto', resize: 'vertical', paddingTop: 10 }} /></Field>
      <Field label="Acuerdos / seguimiento"><textarea className="inp" value={form.acuerdos || ''} onChange={e => set('acuerdos', e.target.value)} rows={3} placeholder="Acciones reales de seguimiento." style={{ height: 'auto', resize: 'vertical', paddingTop: 10 }} /></Field>
    </div>}
  </Modal>;
}

function DiarioInner({ go }) {
  if (typeof useStore === 'function') useStore();
  const [, force] = React.useReducer(x => x + 1, 0);
  const [nivel, setNivel] = React.useState('Todos');
  const [group, setGroup] = React.useState('Todos');
  const [modal, setModal] = React.useState(null);
  React.useEffect(() => { const h = () => force(); window.addEventListener('piaget-diario', h); return () => window.removeEventListener('piaget-diario', h); }, []);
  const classes = diarioClasses();
  const entries = diarioEntries().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  const filtered = entries.filter(e => (nivel === 'Todos' || (diarioClassOf(e.group) && diarioClassOf(e.group).nivel === nivel)) && (group === 'Todos' || e.group === group));
  const groups = Array.from(new Set(classes.filter(c => nivel === 'Todos' || c.nivel === nivel).map(c => c.g)));
  function remove(e) { diarioSave(entries.filter(x => x._id !== e._id)); toast('Entrada eliminada', 'warn'); }
  const kpis = [
    { label: 'Entradas reales', value: String(entries.length), icon: 'edit', tone: 'blue' },
    { label: 'Grupos con diario', value: String(new Set(entries.map(e => e.group)).size), icon: 'layers', tone: 'cyan' },
    { label: 'Entradas hoy', value: String(entries.filter(e => e.date === diarioToday()).length), icon: 'calendar', tone: 'green' },
    { label: 'Grupos reales', value: String(classes.length), icon: 'cap', tone: 'violet' },
  ];
  return <div className="content-inner"><PageHead eyebrow="Gestión" title="Diario" desc={entries.length + ' entradas reales · sin registros demo'}><button className="btn" onClick={() => go && go('clases')}><Icon name="layers" size={15} className="btn-ico" />Clases</button><button className="btn primary" onClick={() => setModal({})}><Icon name="plus" size={15} className="btn-ico" />Nueva entrada</button></PageHead>
    <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>{kpis.map((k, i) => { const t = diarioTone(k.tone); return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>; })}</div>
    <div className="row between center wrap gap-12 mt-16" style={{ marginBottom: 12 }}><div className="seg">{['Todos', 'Preescolar', 'Primaria', 'Secundaria'].map(n => <button key={n} className={nivel === n ? 'active' : ''} onClick={() => { setNivel(n); setGroup('Todos'); }}>{n}<span className="faint" style={{ marginLeft: 6, fontSize: 11 }}>{n === 'Todos' ? classes.length : classes.filter(c => c.nivel === n).length}</span></button>)}</div><select className="inp" value={group} onChange={e => setGroup(e.target.value)} style={{ height: 34, width: 190, padding: '0 10px', fontSize: 12.5 }}><option value="Todos">Todos los grupos</option>{groups.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
    <div className="card"><CardHead icon="edit" title="Entradas de diario" sub="Solo registros capturados por usuarios" /><div>{filtered.map((e, i) => { const c = diarioClassOf(e.group); const roster = diarioRoster(c); const cfg = window.nivelCfg && c ? nivelCfg(c.nivel) : { tone: 'blue' }; return <div key={e._id} className="lrow" style={{ alignItems: 'flex-start', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}><div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 34, height: 34 }}><Icon name="edit" size={16} /></div><div className="grow" style={{ minWidth: 0 }}><div className="row center gap-8 wrap"><div style={{ fontWeight: 700, fontSize: 14 }}>{e.title || 'Entrada de diario'}</div><Badge tone={cfg.tone}>{e.group}</Badge><span className="faint" style={{ fontSize: 11.5 }}>{c ? c.nivel : 'Grupo no encontrado'} · {e.subject || '—'} · {roster.length} alumnos reales</span></div><div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>{diarioDateLabel(e.date)} · {e.docente || 'Docente'}</div>{e.avance && <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5 }}>{e.avance}</p>}{e.observaciones && <p className="faint" style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.45 }}><b>Observaciones:</b> {e.observaciones}</p>}{e.acuerdos && <p className="faint" style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.45 }}><b>Seguimiento:</b> {e.acuerdos}</p>}</div><RowMenu items={[{ icon: 'edit', label: 'Editar', onClick: () => setModal(e) }, { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => remove(e) }]} /></div>; })}{!filtered.length && <div className="faint" style={{ textAlign: 'center', padding: 34 }}>{classes.length ? 'Sin entradas reales de diario para este filtro.' : 'Crea grupos reales en Clases antes de registrar el diario.'}</div>}</div></div>
    {modal && <DiarioModal entry={modal._id ? modal : null} onClose={() => { setModal(null); force(); }} />}
  </div>;
}

function Diario(props) {
  try { return <DiarioInner {...props} />; }
  catch (e) {
    console.warn('[PIAGET] Error en Diario', e);
    return <div className="content-inner"><PageHead eyebrow="Gestión" title="Diario" desc="Módulo recuperado en modo seguro." /><div className="card pad faint" style={{ textAlign: 'center', padding: 34 }}>No se pudieron renderizar las entradas. Recarga la página y revisa que existan grupos reales en Clases.</div></div>;
  }
}

Object.assign(window, { Diario, DiarioInner, diarioClasses, diarioEntries });
