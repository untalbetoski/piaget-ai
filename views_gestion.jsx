/* views_gestion.jsx — Gestión: Docs · Boletines · Evaluaciones · Asistencia · Diario · Tareas */

/* ============ DOCS: reemplazada por views_docs.jsx (legacy, sin exportar) ============ */
function Docs_legacy({ go }) {
  const store = useStore();
  const [modal, setModal] = React.useState(false);
  const [folder, setFolder] = React.useState('Todas');
  const [form, setForm] = React.useState({ name: '', kind: 'PDF', folder: 'Institucional' });
  const folders = ['Todas', 'Institucional', 'Académico', 'Familias'];
  const shown = folder === 'Todas' ? DB.docs : DB.docs.filter(d => d.folder === folder);
  const kindTone = { PDF: 'red', DOC: 'blue', XLS: 'green' };
  function save() {
    if (!form.name.trim()) { toast('Escribe el nombre del documento', 'warn'); return; }
    Store.add('docs', { ...form, size: (Math.random() * 2 + 0.1).toFixed(1) + ' MB', owner: 'Dirección', date: 'hoy' });
    Store.log('Dirección', 'subió el documento "' + form.name + '"', 'doc');
    toast('Documento subido ✓'); setForm({ name: '', kind: 'PDF', folder: 'Institucional' }); setModal(false);
  }
  return (
    <div className="content-inner">
      <PageHead eyebrow="Gestión" title="Docs" desc={DB.docs.length + ' documentos · plantillas y archivos compartidos'}>
        <button className="btn primary" onClick={() => setModal(true)}><Icon name="plus" size={15} className="btn-ico" />Subir documento</button>
      </PageHead>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[{ label: 'Documentos', value: String(DB.docs.length), icon: 'doc', tone: 'blue' }, { label: 'Carpetas', value: '3', icon: 'layers', tone: 'violet' }, { label: 'Compartidos', value: '92', icon: 'link', tone: 'cyan' }].map((k, i) => {
          const t = window.TONE[k.tone];
          return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>;
        })}
      </div>
      <div className="card mt-16">
        <CardHead icon="doc" title="Biblioteca de documentos" sub="Archivos del colegio"
          right={<div className="seg">{folders.map(f => <button key={f} className={folder === f ? 'active' : ''} onClick={() => setFolder(f)}>{f}</button>)}</div>} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Documento</th><th>Carpeta</th><th>Responsable</th><th>Tamaño</th><th>Modificado</th><th></th></tr></thead>
            <tbody>
              {shown.map((d) => {
                const t = window.TONE[kindTone[d.kind] || 'blue'];
                return (
                  <tr key={d._id}>
                    <td><div className="person"><div className="insight-ico" style={{ background: t.bg, color: t.c, width: 32, height: 32, borderRadius: 8 }}><Icon name="doc" size={15} /></div><div><div className="pname">{d.name}</div><div className="pmeta">{d.kind}</div></div></div></td>
                    <td><Badge tone="gray">{d.folder}</Badge></td>
                    <td className="muted">{d.owner}</td>
                    <td className="muted font-mono" style={{ fontSize: 12.5 }}>{d.size}</td>
                    <td className="muted" style={{ fontSize: 12.5 }}>{d.date}</td>
                    <td><RowMenu items={[{ icon: 'download', label: 'Descargar', onClick: () => toast('Descargando ' + d.name) }, { icon: 'link', label: 'Compartir', onClick: () => toast('Enlace copiado', 'info') }, { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => { Store.remove('docs', d._id); toast('Documento eliminado', 'warn'); } }]} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Subir documento"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Subir</button></>}>
        <div className="ph" style={{ height: 90, marginBottom: 4 }}>Arrastra un archivo aquí</div>
        <Field label="Nombre del documento"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="p.ej. Reglamento 2026" autoFocus /></Field>
        <div className="field-row">
          <Field label="Tipo"><SelectInput value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })} options={['PDF', 'DOC', 'XLS']} /></Field>
          <Field label="Carpeta"><SelectInput value={form.folder} onChange={e => setForm({ ...form, folder: e.target.value })} options={['Institucional', 'Académico', 'Familias']} /></Field>
        </div>
      </Modal>
    </div>
  );
}

/* ============ BOLETINES: reemplazada por views_boletines.jsx (legacy, sin exportar) ============ */
function Boletines_legacy({ go }) {
  const store = useStore();
  const [periods, setPeriods] = React.useState(DB.boletines);
  function publish(i) {
    setPeriods(p => p.map((x, j) => j === i ? { ...x, status: 'publicado', issued: 1284 } : x));
    Store.log('Académico', 'publicó boletas de ' + periods[i].period, 'bookOpen');
    toast('Boletas publicadas a 1,284 familias ✓');
  }
  const st = { publicado: ['green', 'Publicado'], captura: ['amber', 'En captura'], pendiente: ['gray', 'Pendiente'] };
  return (
    <div className="content-inner">
      <PageHead eyebrow="Gestión" title="Boletines" desc="Boletas de calificaciones por periodo del ciclo.">
        <button className="btn primary" onClick={() => toast('Generando boletas con IA…', 'info')}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Generar boletas</button>
      </PageHead>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {periods.map((p, i) => {
          const [tone, label] = st[p.status];
          const t = window.TONE[tone] || window.TONE.gray;
          return (
            <div className="card pad" key={i} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="row between center">
                <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name="bookOpen" size={20} /></div>
                <Badge tone={tone} dot>{label}</Badge>
              </div>
              <div><div style={{ fontWeight: 600, fontSize: 16 }}>{p.period}</div><div className="faint" style={{ fontSize: 12.5 }}>{p.date}</div></div>
              <div className="row between center" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div><div className="faint" style={{ fontSize: 11 }}>Emitidas</div><div className="tnum" style={{ fontWeight: 600 }}>{fmtNum(p.issued)}</div></div>
                <div><div className="faint" style={{ fontSize: 11 }}>Promedio</div><div className="tnum" style={{ fontWeight: 600 }}>{p.avg || '—'}</div></div>
              </div>
              {p.status !== 'publicado'
                ? <button className="btn primary sm" style={{ justifyContent: 'center' }} onClick={() => publish(i)}><Icon name="send" size={13} className="btn-ico" />Publicar boletas</button>
                : <button className="btn sm" style={{ justifyContent: 'center' }} onClick={() => toast('Descargando boletas…')}><Icon name="download" size={13} className="btn-ico" />Descargar</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ EVALUACIONES → movido a views_evaluaciones.jsx + views_evaluaciones_data.jsx ============ */

/* ============ ASISTENCIA → movido a views_asistencia.jsx + views_asistencia_data.jsx ============ */

/* ============ DIARIO ============ */
const DIARIO_MOOD = {
  great: ['green', 'star', 'Excelente'],
  good: ['blue', 'check', 'Buena'],
  regular: ['amber', 'clock', 'Regular'],
  bad: ['red', 'alert', 'Requiere atención'],
};
/* Grupos y materias tomados del padrón real (mismo origen que Clases, Asistencia y Calificaciones):
   cubre TODOS los niveles y grados, no una lista fija de primaria. */
const DIARIO_NIVEL_ORDER = ['Preescolar', 'Primaria', 'Secundaria'];
function diarioClases() { return window.docClases((window.DB && DB.clases && DB.clases.length) ? DB.clases : (window.CLASES_SEED || [])); }
function diarioNivelOf(group) {
  const c = diarioClases().find(x => x.g === group);
  if (c) return c.nivel;
  if (/^K\d/.test(group || '')) return 'Preescolar';
  if (/sec/i.test(group || '')) return 'Secundaria';
  return 'Primaria';
}
function diarioGroupsByNivel() {
  const m = {};
  diarioClases().forEach(c => { (m[c.nivel] = m[c.nivel] || []).push(c.g); });
  return DIARIO_NIVEL_ORDER.filter(n => m[n]).map(n => ({ nivel: n, groups: m[n] }));
}
function diarioFirstGroup() { const cs = diarioClases(); return cs.length ? cs[0].g : '1° A'; }
const DIARIO_SUBJECTS_BY_NIVEL = {
  Preescolar: ['Lenguajes', 'Saberes y pensamiento científico', 'Ética, naturaleza y sociedades', 'De lo humano y lo comunitario'],
  Primaria: ['Matemáticas', 'Español', 'Ciencias', 'Inglés', 'Historia', 'Formación Cívica', 'Artes', 'Ed. Física'],
  Secundaria: ['Matemáticas', 'Español', 'Ciencias', 'Inglés', 'Historia', 'Geografía', 'Formación Cívica', 'Artes', 'Ed. Física', 'Tecnología'],
};
function diarioSubjectsOf(nivel) { return DIARIO_SUBJECTS_BY_NIVEL[nivel] || DIARIO_SUBJECTS_BY_NIVEL.Primaria; }
const DIARIO_SUBJECTS_ALL = DIARIO_NIVEL_ORDER.reduce((a, n) => { DIARIO_SUBJECTS_BY_NIVEL[n].forEach(s => a.includes(s) || a.push(s)); return a; }, []);

function diarioDateLabel(iso) {
  if (!iso) return 'Sin fecha';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(iso + 'T00:00:00');
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  const lbl = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  return lbl.charAt(0).toUpperCase() + lbl.slice(1);
}
const diarioEmpty = () => { const g = diarioFirstGroup(); return { group: g, subject: diarioSubjectsOf(diarioNivelOf(g))[0], note: '', mood: 'good', date: new Date().toISOString().slice(0, 10) }; };

function Diario({ go }) {
  const store = useStore();
  const [modal, setModal] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [form, setForm] = React.useState(diarioEmpty);
  const [fGroup, setFGroup] = React.useState('Todos');
  const [fSubject, setFSubject] = React.useState('Todas');
  const [fMood, setFMood] = React.useState('Todas');

  function openNew() { setEditId(null); setForm(diarioEmpty()); setModal(true); }
  function openEdit(d) { setEditId(d._id); setForm({ group: d.group, subject: d.subject, note: d.note, mood: d.mood, date: d.date || new Date().toISOString().slice(0, 10) }); setModal(true); }
  function save() {
    if (!form.note.trim()) { toast('Escribe una observación', 'warn'); return; }
    if (editId) {
      Store.update('diario', editId, { ...form });
      toast('Entrada actualizada ✓');
    } else {
      Store.add('diario', { ...form, author: DB.user.name, time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) });
      Store.log('Docente', 'registró una entrada de diario · ' + form.group, 'edit');
      toast('Entrada registrada ✓');
    }
    setEditId(null); setForm(diarioEmpty()); setModal(false);
  }
  function del(d) { Store.remove('diario', d._id); toast('Entrada eliminada', 'warn'); }

  // filtrar
  const filtered = DB.diario.filter(d =>
    window.docAllowsGroup(d.group) &&
    (fGroup === 'Todos' || d.group === fGroup) &&
    (fSubject === 'Todas' || d.subject === fSubject) &&
    (fMood === 'Todas' || d.mood === fMood));
  // agrupar por fecha (orden desc por ISO)
  const byDate = {};
  filtered.forEach(d => { const k = d.date || ''; (byDate[k] = byDate[k] || []).push(d); });
  const dateKeys = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
  const filtersActive = fGroup !== 'Todos' || fSubject !== 'Todas' || fMood !== 'Todas';

  function setGroup(g) { const subs = diarioSubjectsOf(diarioNivelOf(g)); setForm(f => ({ ...f, group: g, subject: subs.includes(f.subject) ? f.subject : subs[0] })); }

  const FilterSel = ({ value, onChange, opts, groups }) => (
    <select className="inp" value={value} onChange={onChange} style={{ height: 34, padding: '0 28px 0 10px', fontSize: 12.5, minWidth: 0, width: 'auto' }}>
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      {groups && groups.map(g => <optgroup key={g.nivel} label={g.nivel}>{g.groups.map(x => <option key={x} value={x}>{x}</option>)}</optgroup>)}
    </select>
  );

  return (
    <div className="content-inner">
      <PageHead eyebrow="Gestión" title="Diario" desc="Bitácora de clase: observaciones y notas del docente.">
        <button className="btn primary" onClick={openNew}><Icon name="plus" size={15} className="btn-ico" />Nueva entrada</button>
      </PageHead>

      <div className="card pad" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <span className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginRight: 2 }}>Filtrar</span>
        <FilterSel value={fGroup} onChange={e => setFGroup(e.target.value)} opts={[{ value: 'Todos', label: 'Todos los grupos' }]} groups={diarioGroupsByNivel()} />
        <FilterSel value={fSubject} onChange={e => setFSubject(e.target.value)} opts={[{ value: 'Todas', label: 'Todas las materias' }, ...DIARIO_SUBJECTS_ALL.map(s => ({ value: s, label: s }))]} />
        <FilterSel value={fMood} onChange={e => setFMood(e.target.value)} opts={[{ value: 'Todas', label: 'Toda valoración' }, ...Object.entries(DIARIO_MOOD).map(([v, m]) => ({ value: v, label: m[2] }))]} />
        <span className="grow" />
        <span className="faint tnum" style={{ fontSize: 12.5 }}>{filtered.length} {filtered.length === 1 ? 'entrada' : 'entradas'}</span>
        {filtersActive && <button className="btn sm" onClick={() => { setFGroup('Todos'); setFSubject('Todas'); setFMood('Todas'); }}><Icon name="x" size={13} className="btn-ico" />Limpiar</button>}
      </div>

      {dateKeys.length === 0 && (
        <div className="card pad col center gap-8" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 44, height: 44 }}><Icon name="edit" size={20} /></div>
          <div style={{ fontWeight: 600 }}>Sin entradas</div>
          <div className="faint" style={{ fontSize: 13 }}>{filtersActive ? 'Ningún registro coincide con los filtros.' : 'Aún no hay entradas en la bitácora.'}</div>
        </div>
      )}

      {dateKeys.map(dk => {
        const rows = byDate[dk].slice().sort((a, b) => (b.time || '').localeCompare(a.time || ''));
        return (
          <div className="card mt-16" key={dk}>
            <CardHead icon="calendar" title={diarioDateLabel(dk)} sub={rows.length + (rows.length === 1 ? ' entrada' : ' entradas')} />
            <div>
              {rows.map((d) => {
                const [tone, icon, label] = DIARIO_MOOD[d.mood] || DIARIO_MOOD.good;
                const t = window.TONE[tone];
                return (
                  <div className="lrow" key={d._id} style={{ alignItems: 'flex-start', padding: '15px 20px' }}>
                    <div className="insight-ico" style={{ background: t.bg, color: t.c, width: 34, height: 34, marginTop: 2 }} title={label}><Icon name={icon} size={16} /></div>
                    <div className="grow">
                      <div className="row center gap-8" style={{ flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{d.group} · {d.subject}</span>
                        <Badge tone="gray"><span style={{ whiteSpace: 'nowrap' }}>{d.author}</span></Badge>
                      </div>
                      <div className="muted" style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>{d.note}</div>
                    </div>
                    <span className="faint font-mono nowrap" style={{ fontSize: 11.5, marginTop: 3 }}>{d.time}</span>
                    <RowMenu items={[
                      { icon: 'edit', label: 'Editar', onClick: () => openEdit(d) },
                      { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => del(d) },
                    ]} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Modal open={modal} onClose={() => { setModal(false); setEditId(null); }} title={editId ? 'Editar entrada' : 'Nueva entrada de diario'}
        footer={<><button className="btn" onClick={() => { setModal(false); setEditId(null); }}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{editId ? 'Guardar cambios' : 'Guardar'}</button></>}>
        <div className="field-row">
          <Field label="Grupo">
            <select className="inp" value={form.group} onChange={e => setGroup(e.target.value)}>
              {diarioGroupsByNivel().map(grp => <optgroup key={grp.nivel} label={grp.nivel}>{grp.groups.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>)}
            </select>
          </Field>
          <Field label="Materia"><SelectInput value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} options={diarioSubjectsOf(diarioNivelOf(form.group))} /></Field>
        </div>
        <Field label="Fecha"><TextInput type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Observación"><TextArea rows={4} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="¿Cómo fue la clase de hoy?" /></Field>
        <Field label="Valoración"><SelectInput value={form.mood} onChange={e => setForm({ ...form, mood: e.target.value })} options={[{ value: 'great', label: '🌟 Excelente' }, { value: 'good', label: '👍 Buena' }, { value: 'regular', label: '😐 Regular' }, { value: 'bad', label: '⚠️ Requiere atención' }]} /></Field>
      </Modal>
    </div>
  );
}

/* ============ TAREAS ============ */
function tareaTotalOf(group) { const c = diarioClases().find(x => x.g === group); return c ? c.alumnos : 26; }
function tareaDefaultDue(off = 3) { const d = new Date(); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10); }
const tareaEmpty = () => { const g = diarioFirstGroup(); return { title: '', group: g, subject: diarioSubjectsOf(diarioNivelOf(g))[0], due: tareaDefaultDue(), total: tareaTotalOf(g), desc: '', steps: [] }; };
function tareaClaseOf(group) { return diarioClases().find(c => c.g === group) || null; }
function tareaHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991; return h; }
/* roster con estado de entrega derivado de forma determinística a partir del conteo */
function tareaRoster(t) {
  const c = tareaClaseOf(t.group);
  let base = c ? alumnosDeClase(c) : [];
  if (base.length > t.total) base = base.slice(0, t.total);
  while (base.length < t.total) base.push({ name: 'Alumno ' + (base.length + 1) });
  const ranked = base.map(s => ({ s, k: tareaHash(t._id + s.name) })).sort((a, b) => a.k - b.k);
  const done = new Set(ranked.slice(0, Math.min(t.submitted, base.length)).map(o => o.s.name));
  return base.map(s => ({ name: s.name, entregado: done.has(s.name) })).sort((a, b) => a.name.localeCompare(b.name));
}

/* ---------- IA: generar tarea a partir de un tema ---------- */
async function tareaClaudeJSON(prompt) {
  if (!(window.claude && window.claude.complete)) return null;
  try {
    const out = await window.claude.complete(prompt);
    const o = out.indexOf('{'), e = out.lastIndexOf('}');
    if (o < 0 || e <= o) return null;
    return JSON.parse(out.slice(o, e + 1));
  } catch (err) { return null; }
}
function tareaAIFallback(tema, nivel, subject) {
  const t = tema.trim(); const cap = t.charAt(0).toUpperCase() + t.slice(1);
  const pre = nivel === 'Preescolar';
  return {
    title: cap, subject,
    desc: pre
      ? 'Actividad para explorar "' + t + '" mediante juego, observación y expresión, con acompañamiento de la familia en casa.'
      : 'Trabajo sobre "' + t + '" para reforzar lo visto en clase. El alumno desarrolla el tema y entrega su producto en la fecha indicada.',
    steps: pre
      ? ['Conversar sobre el tema en familia', 'Dibujar o crear algo relacionado', 'Compartir en clase lo realizado']
      : ['Investigar y reunir información del tema', 'Desarrollar el trabajo de forma ordenada y clara', 'Revisar ortografía y presentación', 'Entregar en la fecha indicada'],
    dueDays: 3,
  };
}
async function tareaGenerateAI(tema, group) {
  const nivel = diarioNivelOf(group); const subjects = diarioSubjectsOf(nivel);
  const p = 'Eres docente en ' + DB.school.name + ' (educación básica en México, Nueva Escuela Mexicana). ' +
    'Diseña una tarea para el grupo ' + group + ' (' + nivel + ') a partir del tema: "' + tema + '". ' +
    'Elige la materia más adecuada SOLO de esta lista: ' + subjects.join(', ') + '. ' +
    'Incluye un título claro (máx 8 palabras), una descripción de 30-50 palabras, de 3 a 5 instrucciones breves para el alumno y un plazo sugerido en días (1 a 10). ' +
    'Todo apropiado al nivel y en español. Responde ÚNICAMENTE JSON: {"titulo":"...","materia":"...","descripcion":"...","instrucciones":["...","..."],"dias":3}';
  const r = await tareaClaudeJSON(p);
  if (r && r.titulo) {
    return {
      title: String(r.titulo),
      subject: subjects.includes(r.materia) ? r.materia : subjects[0],
      desc: String(r.descripcion || ''),
      steps: Array.isArray(r.instrucciones) ? r.instrucciones.map(String).filter(Boolean).slice(0, 5) : [],
      dueDays: Math.min(10, Math.max(1, Number(r.dias) || 3)),
      ia: true,
    };
  }
  return { ...tareaAIFallback(tema, nivel, subjects[0]), ia: false };
}

/* ---------- Detalle de la tarea ---------- */
function TareaDetalle({ t, onClose }) {
  const du = tareaDue(t.due);
  const pct = t.total ? Math.round(t.submitted / t.total * 100) : 0;
  const nivel = diarioNivelOf(t.group);
  const roster = React.useMemo(() => tareaRoster(t), [t._id, t.submitted, t.group, t.total]);
  const pend = roster.filter(r => !r.entregado).length;
  return (
    <Modal open onClose={onClose} title={t.title} width={560}
      footer={<>
        <button className="btn" onClick={onClose}>Cerrar</button>
        <button className="btn" disabled={!pend} onClick={() => toast('Recordatorio enviado a ' + pend + ' alumno' + (pend === 1 ? '' : 's'))}><Icon name="megaphone" size={15} className="btn-ico" />Recordar a pendientes</button>
        <button className="btn primary" disabled={t.submitted >= t.total} onClick={() => Store.update('tareas', t._id, { submitted: Math.min(t.total, t.submitted + 1) })}><Icon name="check" size={15} className="btn-ico" />Registrar entrega</button>
      </>}>
      <div className="row gap-8" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
        <Badge tone="gray"><Icon name="cap" size={12} />{t.group} · {nivel}</Badge>
        <Badge tone="gray"><Icon name="clipboard" size={12} />{t.subject}</Badge>
        <Badge tone={du.tone}><Icon name="clock" size={12} />{du.label}</Badge>
      </div>
      {t.desc && <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 14 }}>{t.desc}</p>}
      {Array.isArray(t.steps) && t.steps.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Instrucciones</div>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {t.steps.map((s, i) => <li key={i} style={{ fontSize: 13.5, lineHeight: 1.5 }}>{s}</li>)}
          </ol>
        </div>
      )}
      <div className="card pad" style={{ marginBottom: 14 }}>
        <div className="row between center" style={{ marginBottom: 8, fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>Entregas</span>
          <span className="tnum faint">{t.submitted}/{t.total} · {pct}%</span>
        </div>
        <Bar value={pct} color={pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--accent)' : 'var(--amber)'} height={8} />
      </div>
      <div className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Alumnos del grupo · {pend} pendiente{pend === 1 ? '' : 's'}</div>
      <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
        {roster.map((r, i) => (
          <div key={i} className="row between center" style={{ padding: '9px 12px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: 13.5 }}>{r.name}</span>
            {r.entregado ? <Badge tone="green"><Icon name="check" size={11} />Entregó</Badge> : <Badge tone="amber" dot>Pendiente</Badge>}
          </div>
        ))}
      </div>
    </Modal>
  );
}
/* etiqueta inteligente de vencimiento — acepta fecha ISO o texto heredado */
function tareaDue(due) {
  if (!due) return { label: 'Sin fecha', tone: 'gray', overdue: false, sort: Infinity };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return { label: due, tone: due === 'mañana' ? 'amber' : 'gray', overdue: false, sort: Infinity - 1 };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(due + 'T00:00:00');
  const diff = Math.round((d - today) / 86400000);
  const sort = diff;
  if (diff < 0) return { label: 'Venció hace ' + (-diff) + (diff === -1 ? ' día' : ' días'), tone: 'red', overdue: true, sort };
  if (diff === 0) return { label: 'Vence hoy', tone: 'red', overdue: false, sort };
  if (diff === 1) return { label: 'Vence mañana', tone: 'amber', overdue: false, sort };
  if (diff <= 7) return { label: 'En ' + diff + ' días', tone: 'gray', overdue: false, sort };
  return { label: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }), tone: 'gray', overdue: false, sort };
}

function Tareas({ go }) {
  const store = useStore();
  const [modal, setModal] = React.useState(false);
  const [form, setForm] = React.useState(tareaEmpty);
  const [fGroup, setFGroup] = React.useState('Todos');
  const [detailId, setDetailId] = React.useState(null);
  const [tema, setTema] = React.useState('');
  const [gen, setGen] = React.useState(false);
  const [ia, setIa] = React.useState(false);

  function openNew() { setForm(tareaEmpty()); setTema(''); setIa(false); setGen(false); setModal(true); }
  async function generar() {
    if (gen || !tema.trim()) return; setGen(true);
    const [r] = await Promise.all([tareaGenerateAI(tema, form.group), new Promise(res => setTimeout(res, 1000))]);
    setForm(f => ({ ...f, title: r.title, subject: r.subject, desc: r.desc, steps: r.steps, due: tareaDefaultDue(r.dueDays) }));
    setIa(r.ia); setGen(false);
    toast(r.ia ? 'Tarea generada con IA ✓' : 'Propuesta generada ✓');
  }
  function setGroup(g) {
    const subs = diarioSubjectsOf(diarioNivelOf(g));
    setForm(f => ({ ...f, group: g, subject: subs.includes(f.subject) ? f.subject : subs[0], total: tareaTotalOf(g) }));
  }
  function save() {
    if (!form.title.trim()) { toast('Escribe el título de la tarea', 'warn'); return; }
    const steps = (form.steps || []).map(s => s.trim()).filter(Boolean);
    Store.add('tareas', { ...form, total: Number(form.total), submitted: 0, steps });
    Store.log('Docente', 'asignó "' + form.title + '" a ' + form.group, 'clipboard');
    toast('Tarea asignada ✓'); setForm(tareaEmpty()); setTema(''); setIa(false); setModal(false);
  }

  const all = DB.tareas.filter(t => window.docAllowsGroup(t.group));
  const detail = detailId ? all.find(t => t._id === detailId) : null;
  const list = all
    .filter(t => fGroup === 'Todos' || t.group === fGroup)
    .slice()
    .sort((a, b) => tareaDue(a.due).sort - tareaDue(b.due).sort);
  const overdue = all.filter(t => tareaDue(t.due).overdue).length;

  const FilterSel = ({ value, onChange, opts, groups }) => (
    <select className="inp" value={value} onChange={onChange} style={{ height: 34, padding: '0 28px 0 10px', fontSize: 12.5, minWidth: 0, width: 'auto' }}>
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      {groups && groups.map(g => <optgroup key={g.nivel} label={g.nivel}>{g.groups.map(x => <option key={x} value={x}>{x}</option>)}</optgroup>)}
    </select>
  );

  return (
    <div className="content-inner">
      <PageHead eyebrow="Gestión" title="Tareas" desc={all.length + ' tareas activas · seguimiento de entregas'}>
        <button className="btn primary" onClick={openNew}><Icon name="plus" size={15} className="btn-ico" />Asignar tarea</button>
      </PageHead>

      <div className="card pad" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <span className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginRight: 2 }}>Filtrar</span>
        <FilterSel value={fGroup} onChange={e => setFGroup(e.target.value)} opts={[{ value: 'Todos', label: 'Todos los grupos' }]} groups={diarioGroupsByNivel()} />
        <span className="grow" />
        {overdue > 0 && <Badge tone="red"><Icon name="alert" size={11} />{overdue} {overdue === 1 ? 'vencida' : 'vencidas'}</Badge>}
        <span className="faint tnum" style={{ fontSize: 12.5 }}>{list.length} {list.length === 1 ? 'tarea' : 'tareas'}</span>
        {fGroup !== 'Todos' && <button className="btn sm" onClick={() => setFGroup('Todos')}><Icon name="x" size={13} className="btn-ico" />Limpiar</button>}
      </div>

      {list.length === 0 && (
        <div className="card pad col center gap-8" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 44, height: 44 }}><Icon name="clipboard" size={20} /></div>
          <div style={{ fontWeight: 600 }}>Sin tareas</div>
          <div className="faint" style={{ fontSize: 13 }}>{fGroup !== 'Todos' ? 'Ninguna tarea para ' + fGroup + '.' : 'Aún no has asignado tareas.'}</div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {list.map((t) => {
          const pct = t.total ? Math.round(t.submitted / t.total * 100) : 0;
          const du = tareaDue(t.due);
          return (
            <div className="card pad" key={t._id} style={{ display: 'flex', flexDirection: 'column', gap: 12, borderColor: du.overdue ? 'color-mix(in oklch, var(--red) 35%, var(--border))' : undefined }}>
              <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
                <div><div style={{ fontWeight: 600, fontSize: 15 }}>{t.title}</div><div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>{t.group} · {t.subject}</div></div>
                <Badge tone={du.tone}><Icon name="clock" size={11} /><span style={{ whiteSpace: 'nowrap' }}>{du.label}</span></Badge>
              </div>
              <div>
                <div className="row between center" style={{ marginBottom: 6, fontSize: 12 }}><span className="faint">Entregas</span><span className="tnum" style={{ fontWeight: 600 }}>{t.submitted}/{t.total} · {pct}%</span></div>
                <Bar value={pct} color={pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--accent)' : 'var(--amber)'} height={8} />
              </div>
              <div className="row gap-8" style={{ paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <button className="btn sm grow" style={{ justifyContent: 'center' }} onClick={() => setDetailId(t._id)}><Icon name="eye" size={13} className="btn-ico" />Ver detalle</button>
                <button className="btn sm" disabled={t.submitted >= t.total} onClick={() => { Store.update('tareas', t._id, { submitted: Math.min(t.total, t.submitted + 1) }); }}><Icon name="check" size={13} className="btn-ico" />+1</button>
                <RowMenu items={[{ icon: 'megaphone', label: 'Recordar a pendientes', onClick: () => toast('Recordatorio enviado a ' + (t.total - t.submitted) + ' alumnos') }, { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => { Store.remove('tareas', t._id); toast('Tarea eliminada', 'warn'); } }]} />
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Asignar tarea"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Asignar</button></>}>
        <div style={{ background: 'var(--accent-soft)', border: '1px solid color-mix(in oklch, var(--accent) 25%, var(--border))', borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <div className="row center gap-8" style={{ marginBottom: 8 }}>
            <Icon name="spark" size={15} style={{ color: 'var(--accent)' }} fill="currentColor" />
            <span style={{ fontWeight: 600, fontSize: 13 }}>Crear con IA</span>
            {ia && <Badge tone="violet" dot>Generada con IA</Badge>}
          </div>
          <div className="row gap-8">
            <TextInput value={tema} onChange={e => setTema(e.target.value)} placeholder="Escribe un tema, p. ej. “el ciclo del agua”" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); generar(); } }} />
            <button className="btn primary" disabled={gen || !tema.trim()} onClick={generar} style={{ whiteSpace: 'nowrap' }}><Icon name={gen ? 'clock' : 'spark'} size={15} className="btn-ico" fill="currentColor" />{gen ? 'Generando…' : 'Generar'}</button>
          </div>
          <div className="faint" style={{ fontSize: 11.5, marginTop: 7, lineHeight: 1.5 }}>La IA propone título, materia, descripción, instrucciones y fecha según el grupo. Puedes editar todo antes de asignar.</div>
        </div>
        <Field label="Título"><TextInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="p.ej. Ensayo de lectura" /></Field>
        <div className="field-row">
          <Field label="Grupo">
            <select className="inp" value={form.group} onChange={e => setGroup(e.target.value)}>
              {diarioGroupsByNivel().map(grp => <optgroup key={grp.nivel} label={grp.nivel}>{grp.groups.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>)}
            </select>
          </Field>
          <Field label="Materia"><SelectInput value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} options={diarioSubjectsOf(diarioNivelOf(form.group))} /></Field>
        </div>
        <Field label="Descripción"><TextArea rows={2} value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="¿En qué consiste la tarea?" /></Field>
        <Field label="Instrucciones (una por línea)"><TextArea rows={3} value={(form.steps || []).join('\n')} onChange={e => setForm({ ...form, steps: e.target.value.split('\n') })} placeholder={'Investigar el tema\nDesarrollar el trabajo\nEntregar en la fecha indicada'} /></Field>
        <div className="field-row">
          <Field label="Vence"><TextInput type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(form.due) ? form.due : tareaDefaultDue()} onChange={e => setForm({ ...form, due: e.target.value })} /></Field>
          <Field label="Alumnos en el grupo"><NumberInput value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} /></Field>
        </div>
      </Modal>

      {detail && <TareaDetalle t={detail} onClose={() => setDetailId(null)} />}
    </div>
  );
}

Object.assign(window, { Diario, Tareas });
