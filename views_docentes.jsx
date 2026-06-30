/* views_docentes.jsx — Módulo Docentes con datos reales únicamente */

const DOC_NIVELES = ['Preescolar', 'Primaria', 'Secundaria'];
const DOC_MATERIAS = ['Español', 'Matemáticas', 'Ciencias Naturales', 'Historia', 'Geografía', 'Formación Cívica y Ética', 'Inglés', 'Educación Física', 'Artes', 'Tecnología', 'Química', 'Física', 'Biología', 'Educación Socioemocional'];
const DOC_GRADOS = ['Licenciatura', 'Maestría', 'Doctorado', 'Normalista', 'Técnico'];

function docIsSeedClass(c) { return /^cls-\d+$/i.test(String((c && c._id) || '')); }
function docRealClasses() { return ((window.DB && Array.isArray(DB.clases)) ? DB.clases : []).filter(c => c && !docIsSeedClass(c) && String(c.g || '').trim()); }
function docAllGroups() { return docRealClasses().map(c => ({ nivel: c.nivel || 'Primaria', g: c.g, salon: c.salon || '', titular: c.titular || '', _id: c._id })); }
function docGroupsByNivel(nivel) { return docAllGroups().filter(x => x.nivel === nivel).map(x => x.g).filter((g, i, a) => a.indexOf(g) === i); }
function docNivelOfGroup(g) { const found = docAllGroups().find(x => x.g === g); return found ? found.nivel : 'Primaria'; }
function docMateriasDe(nivel) { const ev = window.EV_MATERIAS; return (ev && ev[nivel]) ? ev[nivel] : DOC_MATERIAS; }
function docPhotoFile(file, cb) { if (!file) return; const r = new FileReader(); r.onload = () => cb(String(r.result)); r.readAsDataURL(file); }
function docPassFor(d) { return d && d.pass ? d.pass : ''; }
function docQR(text) { try { if (!window.qrcode) return ''; const qr = window.qrcode(0, 'M'); qr.addData(text); qr.make(); return qr.createDataURL(4, 0); } catch (e) { return ''; } }
function docEmpty() {
  return { name: '', curp: '', rfc: '', birth: '', sex: 'Femenino', empleado: '', ingreso: new Date().toISOString().slice(0, 10), email: '', phone: '', niveles: [], materias: [], asignaciones: [], grupoTitular: '', gradoEstudios: 'Licenciatura', especialidad: '', emergencia: '', emergenciaTel: '', status: 'activo', photo: '', pass: '' };
}
function docBuildRoster() {
  return ((window.DB && Array.isArray(DB.docentes)) ? DB.docentes : []).map(d => ({ ...d, manual: true, status: d.status || 'activo', niveles: d.niveles || [], materias: d.materias || [], grupos: d.grupos || [], asignaciones: d.asignaciones || [] }));
}
function docHorario(t) {
  const grupos = t.grupos || [];
  const materias = (t.materias && t.materias.length) ? t.materias : ['Clase'];
  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
  const bloques = ['07:30', '08:30', '09:30', '10:30', '11:30', '12:30'];
  const cells = bloques.map((b, bi) => dias.map((d, di) => {
    if (!grupos.length || (bi + di) % 3 !== 0) return null;
    return { grupo: grupos[(bi + di) % grupos.length], materia: materias[(bi + di) % materias.length] };
  }));
  return { dias, bloques, cells, carga: cells.flat().filter(Boolean).length };
}
function docApplyTitularToClasses(doc) {
  const group = String(doc.grupoTitular || '').trim();
  if (!group || !window.Store || !Array.isArray(DB.clases)) return;
  const fullName = ((doc.titulo || '').trim() ? doc.titulo.trim() + ' ' : '') + String(doc.name || '').trim();
  const c = DB.clases.find(x => !docIsSeedClass(x) && x.g === group);
  if (c && c._id) Store.update('clases', c._id, { titular: fullName.trim() });
}

function AsigEditor({ value, onChange }) {
  const rows = value || [];
  const realGroups = docAllGroups();
  const setRow = (i, patch) => onChange(rows.map((r, j) => j === i ? { ...r, ...patch } : r));
  const addRow = () => {
    const first = realGroups[0];
    onChange([...rows, { nivel: first ? first.nivel : 'Primaria', grupo: first ? first.g : '', materia: docMateriasDe(first ? first.nivel : 'Primaria')[0] || '' }]);
  };
  const delRow = (i) => onChange(rows.filter((_, j) => j !== i));
  return (
    <div className="col" style={{ gap: 8 }}>
      {rows.map((r, i) => {
        const grupos = docGroupsByNivel(r.nivel);
        const materias = docMateriasDe(r.nivel);
        return (
          <div key={i} className="row center gap-8" style={{ alignItems: 'center' }}>
            <select className="inp" style={{ height: 36, flex: '0 0 116px', padding: '0 8px' }} value={r.nivel} onChange={e => { const nv = e.target.value; const gs = docGroupsByNivel(nv); setRow(i, { nivel: nv, grupo: gs[0] || '', materia: docMateriasDe(nv)[0] || '' }); }}>
              {DOC_NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select className="inp" style={{ height: 36, flex: '0 0 130px', padding: '0 8px' }} value={r.grupo} onChange={e => setRow(i, { grupo: e.target.value })}>
              <option value="">Sin grupo</option>{grupos.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className="inp" style={{ height: 36, flex: 1, minWidth: 0, padding: '0 8px' }} value={r.materia} onChange={e => setRow(i, { materia: e.target.value })}>
              {materias.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button type="button" className="icon-btn" style={{ width: 34, height: 34, flexShrink: 0 }} title="Quitar" onClick={() => delRow(i)}><Icon name="trash" size={15} /></button>
          </div>
        );
      })}
      {!rows.length && <div className="faint" style={{ fontSize: 12.5, padding: '6px 2px' }}>{realGroups.length ? 'Sin asignaciones. Puedes agregarlas ahora o después.' : 'No hay grupos reales creados. Puedes registrar al docente y asignarlo después desde Clases.'}</div>}
      <button type="button" className="btn sm" style={{ alignSelf: 'flex-start' }} disabled={!realGroups.length} onClick={addRow}><Icon name="plus" size={13} className="btn-ico" />Agregar asignación</button>
    </div>
  );
}

function DocenteCredCard({ d }) {
  const ciclo = (DB.settings && DB.settings.cycle) || '2026–2027';
  const escuela = (DB.settings && DB.settings.schoolName) || 'PIAGET';
  const qr = docQR('PIAGET-DOC|' + (d.empleado || 'S/N') + '|' + (d.email || '') + '|' + d.name);
  return (
    <div className="cred-print" style={{ width: 320, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ background: 'var(--violet)', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>P</div><div><div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1 }}>{escuela}</div><div style={{ fontSize: 10.5, opacity: .85, marginTop: 2 }}>Personal docente · Ciclo {ciclo}</div></div></div>
      <div style={{ padding: '18px 16px', display: 'flex', gap: 14 }}><div style={{ width: 92, height: 112, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>{d.photo ? <img src={d.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={38} className="faint" />}</div><div style={{ minWidth: 0, flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{(d.titulo ? d.titulo + ' ' : '') + d.name}</div><div style={{ fontSize: 10.5, color: 'var(--violet)', fontWeight: 700, marginTop: 2 }}>DOCENTE · {(d.niveles || []).join(' / ') || 'Sin asignación'}</div><div style={{ marginTop: 9, display: 'grid', gap: 6 }}>{[['No. empleado', d.empleado || '—'], ['Correo', d.email || '—'], ['Materias', (d.materias || []).join(', ') || '—']].map(([k, v], i) => <div key={i}><div className="faint" style={{ fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div><div className="font-mono" style={{ fontSize: 10.5, fontWeight: 600, wordBreak: 'break-word' }}>{v}</div></div>)}</div></div></div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>{qr ? <img src={qr} alt="QR" style={{ width: 58, height: 58 }} /> : <div style={{ width: 58, height: 58, background: '#eee', borderRadius: 4 }} />}<div style={{ flex: 1 }}><div style={{ fontSize: 9.5, color: '#111', fontWeight: 800, letterSpacing: '.03em' }}>VÁLIDA · CICLO {ciclo}</div><div style={{ fontSize: 9, color: '#555', marginTop: 1 }}>Identificación de personal docente</div><div className="font-mono" style={{ fontSize: 9, color: '#555', marginTop: 3 }}>{d.empleado || '—'}</div></div></div>
    </div>
  );
}
function DocenteCredencial({ d, onClose }) { return <Modal open width={420} onClose={onClose} title="Credencial de docente" footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={() => window.print()}><Icon name="download" size={15} className="btn-ico" />Imprimir</button></>}><div style={{ margin: '0 auto', width: 320 }}><DocenteCredCard d={d} /></div></Modal>; }
function DocenteExpediente({ d, onClose }) {
  const F = ({ k, v }) => <div><div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div><div style={{ fontSize: 13, fontWeight: 500, marginTop: 1, wordBreak: 'break-word' }}>{v || '—'}</div></div>;
  const hr = docHorario(d);
  return <Modal open width={620} onClose={onClose} title={(d.titulo ? d.titulo + ' ' : '') + d.name} footer={<button className="btn" onClick={onClose}>Cerrar</button>}>
    <div className="row center gap-8" style={{ flexWrap: 'wrap', marginBottom: 16 }}>{(d.niveles || []).map(n => <Badge key={n} tone={window.nivelCfg ? nivelCfg(n).tone : 'blue'}>{n}</Badge>)}<Badge tone={d.status === 'activo' ? 'green' : 'gray'} dot>{d.status === 'activo' ? 'Activo' : 'Inactivo'}</Badge></div>
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}><F k="CURP" v={d.curp} /><F k="RFC" v={d.rfc} /><F k="Correo" v={d.email} /><F k="Teléfono" v={d.phone} /><F k="Nivel(es)" v={(d.niveles || []).join(' · ')} /><F k="Grupo titular" v={d.grupoTitular} /><div style={{ gridColumn: '1 / -1' }}><F k="Materias que imparte" v={(d.materias || []).join(' · ')} /></div></div>
    <div className="eyebrow" style={{ marginBottom: 8 }}>Carga académica</div><div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>{hr.carga} sesiones/semana · {(d.grupos || []).length} grupos</div>
  </Modal>;
}
function DocentesLote({ onClose }) {
  const lista = docBuildRoster();
  return <Modal open width={760} onClose={onClose} title="Credenciales de docentes en lote" footer={<><span className="grow faint" style={{ fontSize: 12.5 }}>{lista.length} credenciales</span><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" disabled={!lista.length} onClick={() => window.print()}><Icon name="download" size={15} className="btn-ico" />Imprimir {lista.length}</button></>}><div className="cred-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 320px)', gap: 16, justifyContent: 'center', maxHeight: 480, overflowY: 'auto', padding: 4 }}>{lista.length ? lista.map((t, i) => <DocenteCredCard key={t._id || i} d={t} />) : <div className="faint" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>Sin docentes reales registrados.</div>}</div></Modal>;
}

function Docentes({ go }) {
  const store = useStore();
  const [modal, setModal] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [cred, setCred] = React.useState(null);
  const [lote, setLote] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [fNivel, setFNivel] = React.useState('Todos');
  const [form, setForm] = React.useState(docEmpty);
  const photoRef = React.useRef(null);
  const roster = React.useMemo(() => docBuildRoster(), [store, (DB.docentes || []).length]);
  const filtered = roster.filter(t => (fNivel === 'Todos' || (t.niveles || []).includes(fNivel)) && (!search.trim() || (t.name + ' ' + (t.materias || []).join(' ')).toLowerCase().includes(search.trim().toLowerCase()))).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  const total = roster.length;
  const multinivel = roster.filter(t => (t.niveles || []).length > 1).length;
  const materiasCount = new Set(roster.flatMap(t => t.materias || [])).size;
  function onPhoto(e) { docPhotoFile(e.target.files[0], (url) => setForm(f => ({ ...f, photo: url }))); }
  function openNew() { setEditId(null); setForm({ ...docEmpty(), empleado: 'DOC-' + String(3000 + (DB.docentes || []).length + 1) }); setModal(true); }
  function openEdit(t) { setEditId(t._id); setForm({ ...docEmpty(), ...t }); setModal(true); }
  function save() {
    if (!form.name.trim()) { toast('Escribe el nombre del docente', 'warn'); return; }
    const asig = (form.asignaciones || []).filter(a => a.nivel && a.grupo && a.materia);
    const derived = { asignaciones: asig, niveles: Array.from(new Set(asig.map(a => a.nivel).concat(form.grupoTitular ? [docNivelOfGroup(form.grupoTitular)] : []))).filter(Boolean), materias: Array.from(new Set(asig.map(a => a.materia))).filter(Boolean), grupos: Array.from(new Set([...asig.map(a => a.grupo), ...(form.grupoTitular ? [form.grupoTitular] : [])])).filter(Boolean) };
    const payload = { ...form, ...derived, name: form.name.trim(), email: String(form.email || '').trim().toLowerCase(), status: form.status || 'activo', manual: true };
    if (editId) { Store.update('docentes', editId, payload); }
    else { Store.add('docentes', payload); Store.log('Control Escolar', 'dio de alta al docente ' + payload.name, 'cap'); }
    docApplyTitularToClasses(payload);
    if (Store.saveState) Store.saveState();
    toast((editId ? 'Cambios guardados' : 'Docente registrado') + ' ✓', 'ok');
    setEditId(null); setForm(docEmpty()); setModal(false);
  }
  const MINI = [{ label: 'Docentes reales', value: fmtNum(total), icon: 'users', tone: 'blue' }, { label: 'Multinivel', value: fmtNum(multinivel), icon: 'layers', tone: 'violet' }, { label: 'Materias impartidas', value: fmtNum(materiasCount), icon: 'book', tone: 'green' }, { label: 'Activos', value: fmtNum(roster.filter(t => t.status === 'activo').length), icon: 'checkCircle', tone: 'amber' }];
  return (
    <div className="content-inner">
      <div className="page-head"><div><div className="eyebrow" style={{ marginBottom: 7 }}>Administración</div><h1 className="page-title">Docentes</h1><p className="page-desc">{fmtNum(total)} docentes reales · {fmtNum(materiasCount)} materias · {fmtNum(multinivel)} multinivel</p></div><div className="page-actions"><button className="btn" onClick={() => go && go('clases')}><Icon name="cap" size={15} className="btn-ico" />Clases</button><button className="btn" onClick={() => setLote(true)}><Icon name="user" size={15} className="btn-ico" />Credenciales</button><button className="btn primary" onClick={openNew}><Icon name="plus" size={15} className="btn-ico" />Nuevo docente</button></div></div>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>{MINI.map((k, i) => { const t = window.TONE[k.tone]; return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>; })}</div>
      <div className="card mt-16"><CardHead icon="users" title="Plantilla docente" sub={fmtNum(filtered.length) + ' de ' + fmtNum(total) + ' docentes reales'} right={<div className="row gap-8 center" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}><div className="inp" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 10px', width: 'auto' }}><Icon name="search" size={14} className="faint" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar docente o materia…" style={{ border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: 12.5, width: 160 }} /></div><select className="inp" value={fNivel} onChange={e => setFNivel(e.target.value)} style={{ height: 32, padding: '0 24px 0 10px', fontSize: 12.5, width: 'auto' }}>{['Todos', ...DOC_NIVELES].map(n => <option key={n} value={n}>{n === 'Todos' ? 'Todos los niveles' : n}</option>)}</select></div>} />
        <div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Docente</th><th>Nivel(es)</th><th>Materias</th><th>Grupos</th><th>Contacto</th><th>Estatus</th><th></th></tr></thead><tbody>{filtered.map((t) => <tr key={t._id}><td><div className="person">{t.photo ? <img src={t.photo} alt="" style={{ width: 32, height: 32, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }} /> : <Avatar name={t.name} size={32} />}<div><div className="pname">{(t.titulo ? t.titulo + ' ' : '') + t.name}</div><div className="pmeta">{t.empleado || 'Sin número'}</div></div></div></td><td><div className="row gap-6" style={{ flexWrap: 'wrap' }}>{(t.niveles || []).map(n => <Badge key={n} tone={window.nivelCfg ? nivelCfg(n).tone : 'blue'}>{n}</Badge>)}</div></td><td className="muted" style={{ maxWidth: 190, fontSize: 12.5 }}>{(t.materias || []).join(', ') || '—'}</td><td className="muted font-mono" style={{ fontSize: 12 }}>{(t.grupos || []).slice(0, 3).join(', ') || '—'}{(t.grupos || []).length > 3 ? '…' : ''}</td><td className="faint" style={{ fontSize: 11.5 }}>{t.email || '—'}</td><td><Badge tone={t.status === 'activo' ? 'green' : 'gray'} dot>{t.status === 'activo' ? 'Activo' : 'Inactivo'}</Badge></td><td><RowMenu items={[{ icon: 'eye', label: 'Ver expediente', onClick: () => setDetail(t) }, { icon: 'edit', label: 'Editar datos', onClick: () => openEdit(t) }, { icon: 'user', label: 'Generar credencial', onClick: () => setCred(t) }, { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => { Store.remove('docentes', t._id); if (Store.saveState) Store.saveState(); toast('Docente eliminado', 'warn'); } }]} /></td></tr>)}{!filtered.length && <tr><td colSpan="7" className="faint" style={{ textAlign: 'center', padding: 28 }}>Sin docentes reales registrados.</td></tr>}</tbody></table></div>
      </div>
      <Modal open={modal} width={660} onClose={() => setModal(false)} title={editId ? 'Editar docente' : 'Nuevo docente'} footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{editId ? 'Guardar cambios' : 'Registrar docente'}</button></>}>
        <div className="row center gap-12" style={{ marginBottom: 14 }}><div onClick={() => photoRef.current && photoRef.current.click()} style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{form.photo ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={26} className="faint" />}</div><div><div style={{ fontWeight: 600, fontSize: 13 }}>Fotografía</div><div className="faint" style={{ fontSize: 12 }}>Para la credencial docente</div><button className="btn sm" style={{ marginTop: 6 }} onClick={() => photoRef.current && photoRef.current.click()}><Icon name="plus" size={12} className="btn-ico" />{form.photo ? 'Cambiar foto' : 'Subir foto'}</button></div><input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhoto} /></div>
        <Field label="Nombre completo"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre del docente" autoFocus /></Field>
        <div className="field-row"><Field label="Correo institucional"><TextInput value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="docente@soypiaget.app" /></Field><Field label="Teléfono"><TextInput value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="55 0000 0000" /></Field></div>
        <div className="field-row"><Field label="CURP"><TextInput value={form.curp} onChange={e => setForm({ ...form, curp: e.target.value.toUpperCase() })} placeholder="18 caracteres" /></Field><Field label="RFC"><TextInput value={form.rfc} onChange={e => setForm({ ...form, rfc: e.target.value.toUpperCase() })} placeholder="13 caracteres" /></Field></div>
        <div className="eyebrow" style={{ margin: '14px 0 8px' }}>Asignación académica</div><Field label="Materias que imparte"><AsigEditor value={form.asignaciones} onChange={v => setForm({ ...form, asignaciones: v })} /></Field>
        <div className="field-row" style={{ marginTop: 12 }}><Field label="Grupo titular (opcional)"><SelectInput value={form.grupoTitular} onChange={e => setForm({ ...form, grupoTitular: e.target.value })} options={[{ value: '', label: '— Sin grupo titular —' }, ...docAllGroups().map(x => ({ value: x.g, label: x.g + ' · ' + x.nivel }))]} /></Field><Field label="Grado de estudios"><SelectInput value={form.gradoEstudios} onChange={e => setForm({ ...form, gradoEstudios: e.target.value })} options={DOC_GRADOS} /></Field></div>
        <Field label="Especialidad"><TextInput value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })} placeholder="Área o especialidad" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}><Field label="No. de empleado"><TextInput value={form.empleado} onChange={e => setForm({ ...form, empleado: e.target.value })} /></Field><Field label="Fecha de ingreso"><input className="inp" type="date" value={form.ingreso} onChange={e => setForm({ ...form, ingreso: e.target.value })} /></Field><Field label="Estatus"><SelectInput value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={[{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }]} /></Field></div>
      </Modal>
      {detail && <DocenteExpediente d={detail} onClose={() => setDetail(null)} />}{cred && <DocenteCredencial d={cred} onClose={() => setCred(null)} />}{lote && <DocentesLote onClose={() => setLote(false)} />}
    </div>
  );
}

window.Docentes = Docentes;
Object.assign(window, { docBuildRoster, DOC_NIVELES, docAllGroups });
(window.AUTH_RESOLVERS = window.AUTH_RESOLVERS || []).push((id, pass) => {
  const d = docBuildRoster().find(x => x.email && x.email.toLowerCase() === id);
  if (!d) return null;
  if (d.status && d.status !== 'activo') return { ok: false, error: 'El acceso de este docente está inactivo.' };
  if ((d.pass || '') === pass && pass) return { name: d.name, role: 'Docentes', email: d.email, kind: 'Docente', vista: 'clases' };
  return { ok: false, error: 'Contraseña incorrecta.' };
});
