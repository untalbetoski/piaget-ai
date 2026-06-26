/* views_clases.jsx — Vista Clases + drawer de alumnos + modal de edición */

/* ---------- Modal: editar datos de la clase ---------- */
function ClaseEditModal({ clase, onClose }) {
  const open = !!clase;
  const [form, setForm] = React.useState({ titular: '', salon: '', alumnos: 0 });
  React.useEffect(() => {
    if (clase) setForm({ titular: clase.titular, salon: clase.salon, alumnos: clase.alumnos });
  }, [clase]);
  if (!open) return null;
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const save = () => {
    Store.update('clases', clase._id, { titular: form.titular.trim(), salon: form.salon.trim(), alumnos: Math.max(1, parseInt(form.alumnos, 10) || clase.alumnos) });
    Store.log(DB.user.name, 'actualizó los datos del grupo ' + clase.g, 'edit');
    toast('Datos del grupo ' + clase.g + ' actualizados', 'ok');
    onClose();
  };
  const docentes = [...new Set([form.titular, ...DB.staff.filter(s => s.role.startsWith('Docente')).map(s => 'Mtra. ' + s.name), 'Mtra. Paola Rivas', 'Mtro. Jorge Patiño'])];
  return (
    <Modal open={open} title={'Editar grupo ' + clase.g} onClose={onClose} width={460}
      footer={<>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar cambios</button>
      </>}>
      <Field label="Docente titular">
        <TextInput value={form.titular} onChange={set('titular')} list="docentes-dl" />
        <datalist id="docentes-dl">{docentes.map(d => <option key={d} value={d} />)}</datalist>
      </Field>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Salón"><TextInput value={form.salon} onChange={set('salon')} /></Field>
        <Field label="Alumnos inscritos"><NumberInput value={form.alumnos} min={1} max={40} onChange={set('alumnos')} /></Field>
      </div>
      <div className="row center gap-8 faint" style={{ fontSize: 12.5 }}>
        <Icon name="alert" size={14} />Los cambios se reflejan en listas, horarios y reportes del grupo.
      </div>
    </Modal>
  );
}

/* ---------- Drawer: detalle de la clase y alumnos ---------- */
function ClaseDrawer({ claseId, onClose, onEdit }) {
  const c = (DB.clases || []).find(x => x._id === claseId);
  const open = !!c;
  const [q, setQ] = React.useState('');
  React.useEffect(() => { if (open) setQ(''); }, [claseId]);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  let body = null;
  if (c) {
    const cfg = nivelCfg(c.nivel);
    const t = window.TONE[cfg.tone];
    const roster = alumnosDeClase(c).filter(a => a.name.toLowerCase().includes(q.toLowerCase()));
    body = (
      <>
        <div className="row center between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="row center gap-12">
            <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={cfg.icon} size={19} /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15.5, fontFamily: 'var(--font-display)' }}>Grupo {c.g}</div>
              <div className="faint" style={{ fontSize: 12 }}>{c.nivel} · Salón {c.salon}</div>
            </div>
          </div>
          <div className="row center gap-6">
            <button className="btn sm" onClick={() => onEdit(c)}><Icon name="edit" size={14} className="btn-ico" />Editar</button>
            <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="row center gap-10" style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <Avatar name={c.titular.replace(/^(Mtra?\.|Mtro\.)\s*/, '')} size={36} />
            <div className="grow">
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.titular}</div>
              <div className="faint" style={{ fontSize: 12 }}>Docente titular</div>
            </div>
            <Badge tone={cfg.tone}>{c.nivel}</Badge>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[['Alumnos', String(c.alumnos)], [c.avg != null ? 'Promedio' : 'Nivel', c.avg != null ? c.avg.toFixed(1) : c.nivel], ['Asistencia', c.asistencia + '%']].map(([l, v]) => (
              <div key={l} className="card pad" style={{ padding: '12px 14px' }}>
                <div className="kpi-label" style={{ marginBottom: 2 }}>{l}</div>
                <div className="tnum" style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-display)' }}>{v}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="row between center" style={{ marginBottom: 10 }}>
              <div className="card-title"><Icon name="users" className="ico" size={16} />Alumnos del grupo</div>
              <span className="faint tnum" style={{ fontSize: 12 }}>{roster.length} de {c.alumnos}</span>
            </div>
            <input className="inp" style={{ height: 36, marginBottom: 10, width: '100%' }} placeholder="Buscar alumno…" value={q} onChange={e => setQ(e.target.value)} />
            <div>
              {roster.map((a, i) => (
                <div key={a.name + i} className="row center gap-10" style={{ padding: '8px 0', borderBottom: i < roster.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <Avatar name={a.name} size={30} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>Asistencia {a.asis}%</div>
                  </div>
                  {a.avg != null && <span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: a.avg < 7.5 ? 'var(--amber)' : 'var(--text)' }}>{a.avg.toFixed(1)}</span>}
                </div>
              ))}
              {roster.length === 0 && <div className="faint" style={{ fontSize: 13, padding: '14px 0', textAlign: 'center' }}>Sin coincidencias para “{q}”.</div>}
            </div>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className={'drawer-scrim' + (open ? ' open' : '')} onClick={onClose} />
      <aside className={'drawer' + (open ? ' open' : '')} style={{ width: 440 }} aria-hidden={!open}>{body}</aside>
    </>
  );
}

/* ---------- Modal: nueva clase (titular desde el módulo Docentes) ---------- */
function ClaseNuevaModal({ open, onClose }) {
  const [form, setForm] = React.useState({ nivel: 'Primaria', g: '', titular: '', salon: '', alumnos: 25 });
  React.useEffect(() => { if (open) setForm({ nivel: 'Primaria', g: '', titular: '', salon: '', alumnos: 25 }); }, [open]);
  if (!open) return null;
  const docentes = (window.docBuildRoster ? window.docBuildRoster() : []);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  function save() {
    if (!form.g.trim()) { toast('Escribe el nombre del grupo', 'warn'); return; }
    if (!form.titular.trim()) { toast('Selecciona al docente titular', 'warn'); return; }
    Store.add('clases', { nivel: form.nivel, g: form.g.trim(), titular: form.titular.trim(), salon: form.salon.trim() || '—', alumnos: Math.max(1, parseInt(form.alumnos, 10) || 25), asistencia: 95, avg: form.nivel === 'Preescolar' ? null : 8.2 });
    Store.log(DB.user.name, 'creó el grupo ' + form.g.trim() + ' (' + form.nivel + ') con titular ' + form.titular.trim(), 'plus');
    toast('Grupo ' + form.g.trim() + ' creado · ligado a ' + form.titular.trim() + ' ✓');
    onClose();
  }
  return (
    <Modal open title="Nueva clase" onClose={onClose} width={520}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Crear grupo</button></>}>
      <div className="field-row">
        <Field label="Nivel"><SelectInput value={form.nivel} onChange={set('nivel')} options={['Preescolar', 'Primaria', 'Secundaria']} /></Field>
        <Field label="Grupo"><TextInput value={form.g} onChange={set('g')} placeholder="p. ej. 3° A" autoFocus /></Field>
      </div>
      <Field label="Docente titular">
        <SelectInput value={form.titular} onChange={e => { const v = e.target.value; const dd = docentes.find(x => ((x.titulo ? x.titulo + ' ' : '') + x.name) === v); setForm(f => ({ ...f, titular: v, nivel: (dd && dd.niveles && dd.niveles[0]) || f.nivel })); }}
          options={[{ value: '', label: 'Selecciona docente…' }, ...docentes.map(dd => { const full = (dd.titulo ? dd.titulo + ' ' : '') + dd.name; return { value: full, label: full + ' · ' + (dd.niveles || []).join('/') }; })]} />
      </Field>
      <div className="faint" style={{ fontSize: 11.5, marginTop: -4, marginBottom: 4 }}>La lista proviene del módulo <b>Docentes</b>; el grupo se añade a la carga académica del titular.</div>
      <div className="field-row">
        <Field label="Salón"><TextInput value={form.salon} onChange={set('salon')} placeholder="A-101" /></Field>
        <Field label="Alumnos"><NumberInput value={form.alumnos} min={1} max={40} onChange={set('alumnos')} /></Field>
      </div>
    </Modal>
  );
}

/* ---------- Vista principal ---------- */
function Clases({ go }) {
  useStore();
  const [nivel, setNivel] = React.useState('todos');
  const [detailId, setDetailId] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState(null);

  function confirmDelete() {
    const c = deleting;
    Store.remove('clases', c._id);
    Store.log(DB.user.name, 'eliminó el grupo ' + c.g + ' (' + c.nivel + ')', 'trash');
    toast('Grupo ' + c.g + ' eliminado', 'warn');
    setDeleting(null);
    if (detailId === c._id) setDetailId(null);
  }

  const all = window.docClases(DB.clases || []);
  const totalAlumnos = all.reduce((a, c) => a + c.alumnos, 0);
  const niveles = NIVELES_CFG
    .map(cfg => ({ ...cfg, grupos: all.filter(c => c.nivel === cfg.id) }))
    .filter(l => l.grupos.length && (nivel === 'todos' || l.id === nivel));

  return (
    <div className="content-inner">
      <PageHead eyebrow="Principal" title="Clases" desc={'3 niveles · ' + all.length + ' grupos · ' + totalAlumnos.toLocaleString('es-MX') + ' alumnos · ciclo ' + (window.PIAGET_CYCLE ? PIAGET_CYCLE() : '2025–2026')}>
        <button className="btn primary" onClick={() => setCreating(true)}><Icon name="plus" size={15} className="btn-ico" />Nueva clase</button>
      </PageHead>

      <div className="seg" style={{ marginBottom: 20 }}>
        <button className={nivel === 'todos' ? 'active' : ''} onClick={() => setNivel('todos')}>Todos los niveles</button>
        {NIVELES_CFG.map(l => (
          <button key={l.id} className={nivel === l.id ? 'active' : ''} onClick={() => setNivel(l.id)}>
            {l.id} <span style={{ opacity: 0.55, fontWeight: 500 }}>{all.filter(c => c.nivel === l.id).length}</span>
          </button>
        ))}
      </div>

      <div className="col" style={{ gap: 26 }}>
        {niveles.map((l) => {
          const t = window.TONE[l.tone];
          const alumnos = l.grupos.reduce((a, g) => a + g.alumnos, 0);
          const conAvg = l.grupos.filter(g => g.avg != null);
          const avgNivel = conAvg.length ? (conAvg.reduce((a, g) => a + g.avg, 0) / conAvg.length).toFixed(1) : null;
          const asisNivel = Math.round(l.grupos.reduce((a, g) => a + g.asistencia, 0) / l.grupos.length);
          return (
            <section key={l.id}>
              <div className="row center gap-10" style={{ marginBottom: 12 }}>
                <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0, width: 32, height: 32 }}><Icon name={l.icon} size={17} /></div>
                <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)' }}>{l.id}</span>
                <span className="faint" style={{ fontSize: 12.5 }}>
                  {l.grupos.length} grupos · {alumnos} alumnos · {avgNivel ? 'promedio ' + avgNivel : 'asistencia ' + asisNivel + '%'}
                </span>
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
                {l.grupos.map((c) => (
                  <div className="card pad clickable" key={c._id} onClick={() => setDetailId(c._id)} style={{ display: 'flex', flexDirection: 'column', gap: 11, cursor: 'pointer' }}>
                    <div className="row between center">
                      <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={l.icon} size={18} /></div>
                      <div className="row center gap-6" onClick={(e) => e.stopPropagation()}>
                        <span className="faint font-mono" style={{ fontSize: 11 }}>{c.alumnos} alumnos</span>
                        <RowMenu items={[
                          { icon: 'edit', label: 'Editar datos', onClick: () => setEditing(c) },
                          { icon: 'trash', label: 'Eliminar clase', danger: true, onClick: () => setDeleting(c) },
                        ]} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15.5, fontFamily: 'var(--font-display)' }}>Grupo {c.g}</div>
                      <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{c.titular} · Salón {c.salon}</div>
                    </div>
                    <div className="row between center" style={{ paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                      <span className="faint" style={{ fontSize: 12 }}>{c.avg != null ? 'Promedio' : 'Asistencia'}</span>
                      <span className="tnum" style={{ fontWeight: 600 }}>{c.avg != null ? c.avg.toFixed(1) : c.asistencia + '%'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <ClaseDrawer claseId={detailId} onClose={() => setDetailId(null)} onEdit={(c) => setEditing(c)} />
      <ClaseEditModal clase={editing} onClose={() => setEditing(null)} />
      <ClaseNuevaModal open={creating} onClose={() => setCreating(false)} />
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Eliminar clase"
        footer={<><button className="btn" onClick={() => setDeleting(null)}>Cancelar</button><button className="btn primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={confirmDelete}><Icon name="trash" size={15} className="btn-ico" />Eliminar</button></>}>
        {deleting && <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>Se eliminará el <b>Grupo {deleting.g}</b> ({deleting.nivel}) con titular {deleting.titular}. Esta acción no afecta el historial de calificaciones ni asistencia ya capturado.</p>}
      </Modal>
    </div>
  );
}

Object.assign(window, { Clases, ClaseDrawer, ClaseEditModal });
