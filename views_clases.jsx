/* views_clases.jsx — Vista Clases + alta robusta sin dependencias externas */

function claseUid() { return crypto.randomUUID ? crypto.randomUUID() : 'cls-real-' + Date.now() + '-' + Math.random().toString(36).slice(2); }
function claseIsSeed(c) { return /^cls-\d+$/i.test(String((c && c._id) || '')); }
function claseCleanText(v) { return String(v || '').trim().replace(/\s+/g, ' '); }
function claseNormalizeGroup(g) { return claseCleanText(g).toLowerCase(); }
function claseCleanList(list) { return (Array.isArray(list) ? list : []).filter(c => c && !claseIsSeed(c) && claseCleanText(c.g)); }
function clasesSource() { return claseCleanList((window.DB && Array.isArray(DB.clases)) ? DB.clases : []); }
function claseRoster(c) { try { return (window.alumnosDeClase ? alumnosDeClase(c) : []).filter(Boolean); } catch (e) { return []; } }
function claseCount(c) { return claseRoster(c).length; }
function claseSaveState() { try { if (window.Store && Store.saveState) Store.saveState(); } catch (e) {} try { window.dispatchEvent(new Event('piaget-classes-changed')); } catch (e) {} }
function claseAddDirect(item) {
  window.DB = window.DB || {};
  if (!Array.isArray(DB.clases)) DB.clases = [];
  const row = { _id: claseUid(), ...item, alumnos: 0, asistencia: 0, avg: null, createdManual: true, createdAt: new Date().toISOString() };
  DB.clases = [row, ...claseCleanList(DB.clases)];
  claseSaveState();
  return row;
}
function claseUpdateDirect(id, patch) {
  if (!Array.isArray(DB.clases)) DB.clases = [];
  DB.clases = DB.clases.map(c => c._id === id ? { ...c, ...patch } : c);
  claseSaveState();
}
function claseRemoveDirect(id) {
  if (!Array.isArray(DB.clases)) DB.clases = [];
  DB.clases = DB.clases.filter(c => c._id !== id);
  claseSaveState();
}

function ClaseEditModal({ clase, onClose }) {
  const [form, setForm] = React.useState({ titular: clase ? clase.titular || '' : '', salon: clase ? clase.salon || '' : '' });
  React.useEffect(() => { if (clase) setForm({ titular: clase.titular || '', salon: clase.salon || '' }); }, [clase]);
  if (!clase) return null;
  const save = () => {
    claseUpdateDirect(clase._id, { titular: claseCleanText(form.titular), salon: claseCleanText(form.salon) || '—' });
    toast('Datos del grupo ' + clase.g + ' actualizados', 'ok');
    onClose();
  };
  return <Modal open title={'Editar grupo ' + clase.g} onClose={onClose} width={460} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar cambios</button></>}>
    <Field label="Docente titular (opcional)"><TextInput value={form.titular} onChange={e => setForm({ ...form, titular: e.target.value })} placeholder="Sin asignar por ahora" /></Field>
    <Field label="Salón"><TextInput value={form.salon} onChange={e => setForm({ ...form, salon: e.target.value })} placeholder="A-101" /></Field>
    <div className="row center gap-8 faint" style={{ fontSize: 12.5 }}><Icon name="alert" size={14} />Los alumnos del grupo se calculan únicamente desde estudiantes reales.</div>
  </Modal>;
}

function ClaseNuevaModal({ open, onClose }) {
  const [form, setForm] = React.useState({ nivel: 'Primaria', g: '', titular: '', salon: '' });
  React.useEffect(() => { if (open) setForm({ nivel: 'Primaria', g: '', titular: '', salon: '' }); }, [open]);
  if (!open) return null;
  function save() {
    const grupo = claseCleanText(form.g);
    const titular = claseCleanText(form.titular);
    if (!grupo) { toast('Escribe el nombre del grupo', 'warn'); return; }
    const exists = clasesSource().some(c => String(c.nivel || '') === form.nivel && claseNormalizeGroup(c.g) === claseNormalizeGroup(grupo));
    if (exists) { toast('Ya existe un grupo real con ese nombre en ' + form.nivel, 'warn'); return; }
    const item = { nivel: form.nivel, g: grupo, titular, salon: claseCleanText(form.salon) || '—' };
    let created = null;
    try { created = window.Store && Store.add ? Store.add('clases', { ...item, alumnos: 0, asistencia: 0, avg: null, createdManual: true }) : null; } catch (e) { created = null; }
    if (!created) created = claseAddDirect(item);
    claseSaveState();
    try { if (window.Store && Store.log) Store.log(DB.user && DB.user.name ? DB.user.name : 'Sistema', 'creó el grupo ' + grupo + ' (' + form.nivel + ')', 'plus'); } catch (e) {}
    toast('Grupo ' + grupo + ' creado ✓', 'ok');
    onClose();
  }
  return <Modal open title="Nueva clase" onClose={onClose} width={520} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Crear grupo</button></>}>
    <div className="field-row"><Field label="Nivel"><SelectInput value={form.nivel} onChange={e => setForm({ ...form, nivel: e.target.value })} options={['Preescolar', 'Primaria', 'Secundaria']} /></Field><Field label="Grupo"><TextInput value={form.g} onChange={e => setForm({ ...form, g: e.target.value })} placeholder="p. ej. 3° A" autoFocus /></Field></div>
    <Field label="Docente titular (opcional)"><TextInput value={form.titular} onChange={e => setForm({ ...form, titular: e.target.value })} placeholder="Sin asignar por ahora" /></Field>
    <Field label="Salón"><TextInput value={form.salon} onChange={e => setForm({ ...form, salon: e.target.value })} placeholder="A-101" /></Field>
    <div className="row center gap-8 faint" style={{ fontSize: 12.5 }}><Icon name="alert" size={14} />Crear un grupo no genera alumnos. Los estudiantes se agregan desde Académico.</div>
  </Modal>;
}

function ClaseDrawer({ claseId, onClose, onEdit }) {
  const c = clasesSource().find(x => x._id === claseId);
  if (!c) return <><div className="drawer-scrim" /><aside className="drawer" aria-hidden="true" /></>;
  const roster = claseRoster(c);
  return <><div className="drawer-scrim open" onClick={onClose} /><aside className="drawer open" style={{ width: 440 }}><div className="row center between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}><div><div style={{ fontWeight: 700, fontSize: 16 }}>Grupo {c.g}</div><div className="faint" style={{ fontSize: 12 }}>{c.nivel} · Salón {c.salon || '—'}</div></div><button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button></div><div style={{ padding: 20 }}><div className="card pad"><div className="kpi-label">Docente titular</div><div style={{ fontWeight: 600 }}>{c.titular || 'Sin docente titular asignado'}</div></div><div className="card pad mt-16"><div className="kpi-label">Alumnos reales</div><div className="kpi-value tnum">{roster.length}</div></div><button className="btn mt-16" onClick={() => onEdit(c)}><Icon name="edit" size={14} className="btn-ico" />Editar grupo</button></div></aside></>;
}

function Clases() {
  useStore();
  const [, force] = React.useState(0);
  const [nivel, setNivel] = React.useState('todos');
  const [creating, setCreating] = React.useState(false);
  const [detailId, setDetailId] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [deleting, setDeleting] = React.useState(null);
  React.useEffect(() => { const h = () => force(x => x + 1); window.addEventListener('piaget-classes-changed', h); return () => window.removeEventListener('piaget-classes-changed', h); }, []);
  const all = clasesSource();
  const niveles = ['Preescolar', 'Primaria', 'Secundaria'];
  const shown = nivel === 'todos' ? all : all.filter(c => c.nivel === nivel);
  const totalAlumnos = all.reduce((a, c) => a + claseCount(c), 0);
  return <div className="content-inner"><PageHead eyebrow="Principal" title="Clases" desc={all.length + ' grupos reales · ' + totalAlumnos + ' alumnos reales'}><button className="btn primary" onClick={() => setCreating(true)}><Icon name="plus" size={15} className="btn-ico" />Nueva clase</button></PageHead>
    <div className="seg" style={{ marginBottom: 20 }}><button className={nivel === 'todos' ? 'active' : ''} onClick={() => setNivel('todos')}>Todos</button>{niveles.map(n => <button key={n} className={nivel === n ? 'active' : ''} onClick={() => setNivel(n)}>{n} <span style={{ opacity: .55 }}>{all.filter(c => c.nivel === n).length}</span></button>)}</div>
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>{shown.map(c => { const n = claseCount(c); return <div className="card pad clickable" key={c._id} onClick={() => setDetailId(c._id)} style={{ display: 'flex', flexDirection: 'column', gap: 11, cursor: 'pointer' }}><div className="row between center"><div className="kpi-ico" style={{ marginBottom: 0 }}><Icon name="cap" size={18} /></div><div onClick={e => e.stopPropagation()}><RowMenu items={[{ icon: 'edit', label: 'Editar datos', onClick: () => setEditing(c) }, { icon: 'trash', label: 'Eliminar clase', danger: true, onClick: () => setDeleting(c) }]} /></div></div><div><div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)' }}>Grupo {c.g}</div><div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{c.nivel} · {c.titular || 'Sin docente titular'} · Salón {c.salon || '—'}</div></div><div className="row between center" style={{ paddingTop: 10, borderTop: '1px solid var(--border)' }}><span className="faint" style={{ fontSize: 12 }}>Alumnos reales</span><span className="tnum" style={{ fontWeight: 600 }}>{n}</span></div></div>; })}{!shown.length && <div className="card pad faint" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 28 }}>Sin grupos reales. Crea el primer grupo con “Nueva clase”.</div>}</div>
    <ClaseDrawer claseId={detailId} onClose={() => setDetailId(null)} onEdit={c => setEditing(c)} />
    <ClaseNuevaModal open={creating} onClose={() => { setCreating(false); force(x => x + 1); }} />
    <ClaseEditModal clase={editing} onClose={() => { setEditing(null); force(x => x + 1); }} />
    {deleting && <Modal open title="Eliminar clase" onClose={() => setDeleting(null)} width={440} footer={<><button className="btn" onClick={() => setDeleting(null)}>Cancelar</button><button className="btn primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => { claseRemoveDirect(deleting._id); toast('Grupo eliminado', 'warn'); setDeleting(null); force(x => x + 1); }}><Icon name="trash" size={15} className="btn-ico" />Eliminar</button></>}><p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>Se eliminará el <b>Grupo {deleting.g}</b>. Esta acción no afecta alumnos reales.</p></Modal>}
  </div>;
}

Object.assign(window, { Clases, ClaseDrawer, ClaseEditModal, ClaseNuevaModal, clasesSource, claseCount, claseCleanList, claseAddDirect });
