/* views_clases.jsx — Vista Clases + drawer de alumnos + modal de edición */

function claseIsSeed(c) { return /^cls-\d+$/i.test(String((c && c._id) || '')); }
function claseCleanList(list) { return (Array.isArray(list) ? list : []).filter(c => c && !claseIsSeed(c)); }
function claseRoster(c) {
  try { return (window.alumnosDeClase ? alumnosDeClase(c) : []).filter(Boolean); }
  catch (e) { return []; }
}
function claseCount(c) { return claseRoster(c).length; }
function clasesSource() {
  const base = claseCleanList((window.DB && Array.isArray(DB.clases)) ? DB.clases : []);
  try { return claseCleanList(window.docClases ? window.docClases(base) : base); }
  catch (e) { return base; }
}
function claseNormalizeGroup(g) { return String(g || '').trim().replace(/\s+/g, ' ').toLowerCase(); }

/* ---------- Modal: editar datos de la clase ---------- */
function ClaseEditModal({ clase, onClose }) {
  const open = !!clase;
  const [form, setForm] = React.useState({ titular: '', salon: '' });
  React.useEffect(() => {
    if (clase) setForm({ titular: clase.titular || '', salon: clase.salon || '' });
  }, [clase]);
  if (!open) return null;
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const save = () => {
    const n = claseCount(clase);
    Store.update('clases', clase._id, { titular: form.titular.trim(), salon: form.salon.trim(), alumnos: n, asistencia: n ? (clase.asistencia || 100) : 0, avg: n ? clase.avg : null });
    if (Store.saveState) Store.saveState();
    Store.log(DB.user.name, 'actualizó los datos del grupo ' + clase.g, 'edit');
    toast('Datos del grupo ' + clase.g + ' actualizados', 'ok');
    onClose();
  };
  const staffDocentes = (DB.staff || []).filter(s => String(s.role || '').startsWith('Docente')).map(s => 'Mtra. ' + s.name);
  const rosterDocentes = (() => { try { return (window.docBuildRoster ? window.docBuildRoster() : []).map(d => (d.titulo ? d.titulo + ' ' : '') + d.name); } catch (e) { return []; } })();
  const docentes = [...new Set([form.titular, ...staffDocentes, ...rosterDocentes, 'Mtra. Paola Rivas', 'Mtro. Jorge Patiño'].filter(Boolean))];
  return (
    <Modal open={open} title={'Editar grupo ' + clase.g} onClose={onClose} width={460}
      footer={<>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar cambios</button>
      </>}>
      <Field label="Docente titular (opcional)">
        <TextInput value={form.titular} onChange={set('titular')} list="docentes-dl" placeholder="Sin asignar por ahora" />
        <datalist id="docentes-dl">{docentes.map(d => <option key={d} value={d} />)}</datalist>
      </Field>
      <Field label="Salón"><TextInput value={form.salon} onChange={set('salon')} /></Field>
      <div className="row center gap-8 faint" style={{ fontSize: 12.5 }}>
        <Icon name="alert" size={14} />Los alumnos del grupo se calculan únicamente desde estudiantes dados de alta en Académico.
      </div>
    </Modal>
  );
}

/* ---------- Drawer: detalle de la clase y alumnos ---------- */
function ClaseDrawer({ claseId, onClose, onEdit }) {
  const c = claseCleanList(DB.clases || []).find(x => x._id === claseId);
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
    const rosterAll = claseRoster(c);
    const roster = rosterAll.filter(a => String(a.name || '').toLowerCase().includes(q.toLowerCase()));
    const titular = String(c.titular || '').trim();
    const titularLabel = titular || 'Sin docente titular asignado';
    const avgReal = rosterAll.filter(a => a.avg != null);
    const avgLabel = avgReal.length ? (avgReal.reduce((a, s) => a + Number(s.avg || 0), 0) / avgReal.length).toFixed(1) : '—';
    const asisLabel = rosterAll.length ? Math.round(rosterAll.reduce((a, s) => a + Number(s.asis || 0), 0) / rosterAll.length) + '%' : '—';
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
            <Avatar name={titularLabel.replace(/^(Mtra?\.|Mtro\.)\s*/, '')} size={36} />
            <div className="grow">
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{titularLabel}</div>
              <div className="faint" style={{ fontSize: 12 }}>Docente titular</div>
            </div>
            <Badge tone={titular ? cfg.tone : 'gray'}>{titular ? c.nivel : 'Pendiente'}</Badge>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[['Alumnos reales', String(rosterAll.length)], ['Promedio', avgLabel], ['Asistencia', asisLabel]].map(([l, v]) => (
              <div key={l} className="card pad" style={{ padding: '12px 14px' }}>
                <div className="kpi-label" style={{ marginBottom: 2 }}>{l}</div>
                <div className="tnum" style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-display)' }}>{v}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="row between center" style={{ marginBottom: 10 }}>
              <div className="card-title"><Icon name="users" className="ico" size={16} />Alumnos del grupo</div>
              <span className="faint tnum" style={{ fontSize: 12 }}>{roster.length} de {rosterAll.length}</span>
            </div>
            <input className="inp" style={{ height: 36, marginBottom: 10, width: '100%' }} placeholder="Buscar alumno…" value={q} onChange={e => setQ(e.target.value)} />
            <div>
              {roster.map((a, i) => (
                <div key={(a.sid || a.name) + i} className="row center gap-10" style={{ padding: '8px 0', borderBottom: i < roster.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <Avatar name={a.name} size={30} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>Asistencia {a.asis}%</div>
                  </div>
                  {a.avg != null && <span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: a.avg < 7.5 ? 'var(--amber)' : 'var(--text)' }}>{Number(a.avg).toFixed(1)}</span>}
                </div>
              ))}
              {roster.length === 0 && <div className="faint" style={{ fontSize: 13, padding: '14px 0', textAlign: 'center' }}>Sin alumnos reales en este grupo.</div>}
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

/* ---------- Modal: nueva clase (titular opcional; puede asignarse desde Docentes) ---------- */
function ClaseNuevaModal({ open, onClose }) {
  const [form, setForm] = React.useState({ nivel: 'Primaria', g: '', titular: '', salon: '' });
  React.useEffect(() => { if (open) setForm({ nivel: 'Primaria', g: '', titular: '', salon: '' }); }, [open]);
  if (!open) return null;
  const docentes = (() => { try { return (window.docBuildRoster ? window.docBuildRoster() : []); } catch (e) { return []; } })();
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  function save() {
    const grupo = form.g.trim().replace(/\s+/g, ' ');
    const titular = form.titular.trim();
    if (!grupo) { toast('Escribe el nombre del grupo', 'warn'); return; }
    const exists = clasesSource().some(c => String(c.nivel || '') === form.nivel && claseNormalizeGroup(c.g) === claseNormalizeGroup(grupo));
    if (exists) { toast('Ya existe un grupo real con ese nombre en ' + form.nivel, 'warn'); return; }
    const item = { nivel: form.nivel, g: grupo, titular, salon: form.salon.trim() || '—', alumnos: 0, asistencia: 0, avg: null, createdManual: true };
    const created = Store.add('clases', item);
    if (!created && Array.isArray(DB.clases)) DB.clases = [{ _id: (crypto.randomUUID ? crypto.randomUUID() : 'cls-manual-' + Date.now()), ...item }, ...DB.clases];
    if (Store.saveState) Store.saveState();
    Store.log(DB.user.name, 'creó el grupo ' + grupo + ' (' + form.nivel + ')' + (titular ? ' con titular ' + titular : ' sin docente titular asignado'), 'plus');
    toast('Grupo ' + grupo + ' creado · sin alumnos hasta dar de alta estudiantes ✓');
    onClose();
  }
  return (
    <Modal open title="Nueva clase" onClose={onClose} width={520}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Crear grupo</button></>}>
      <div className="field-row">
        <Field label="Nivel"><SelectInput value={form.nivel} onChange={set('nivel')} options={['Preescolar', 'Primaria', 'Secundaria']} /></Field>
        <Field label="Grupo"><TextInput value={form.g} onChange={set('g')} placeholder="p. ej. 3° A" autoFocus /></Field>
      </div>
      <Field label="Docente titular (opcional)">
        <SelectInput value={form.titular} onChange={e => { const v = e.target.value; const dd = docentes.find(x => ((x.titulo ? x.titulo + ' ' : '') + x.name) === v); setForm(f => ({ ...f, titular: v, nivel: (dd && dd.niveles && dd.niveles[0]) || f.nivel })); }}
          options={[{ value: '', label: 'Sin asignar por ahora' }, ...docentes.map(dd => { const full = (dd.titulo ? dd.titulo + ' ' : '') + dd.name; return { value: full, label: full + ' · ' + (dd.niveles || []).join('/') }; })]} />
      </Field>
      <div className="faint" style={{ fontSize: 11.5, marginTop: -4, marginBottom: 4 }}>Opcional. Puedes crear el grupo ahora y asignar el docente titular después desde el alta o edición de docentes.</div>
      <Field label="Salón"><TextInput value={form.salon} onChange={set('salon')} placeholder="A-101" /></Field>
      <div className="row center gap-8 faint" style={{ fontSize: 12.5 }}><Icon name="alert" size={14} />Crear un grupo no genera alumnos. Los estudiantes se agregan desde Académico.</div>
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
    if (Store.saveState) Store.saveState();
    Store.log(DB.user.name, 'eliminó el grupo ' + c.g + ' (' + c.nivel + ')', 'trash');
    toast('Grupo ' + c.g + ' eliminado', 'warn');
    setDeleting(null);
    if (detailId === c._id) setDetailId(null);
  }

  const all = clasesSource();
  const totalAlumnos = all.reduce((a, c) => a + claseCount(c), 0);
  const niveles = NIVELES_CFG
    .map(cfg => ({ ...cfg, grupos: all.filter(c => c.nivel === cfg.id) }))
    .filter(l => l.grupos.length && (nivel === 'todos' || l.id === nivel));

  return (
    <div className="content-inner">
      <PageHead eyebrow="Principal" title="Clases" desc={'3 niveles · ' + all.length + ' grupos · ' + totalAlumnos.toLocaleString('es-MX') + ' alumnos reales · ciclo ' + (window.PIAGET_CYCLE ? PIAGET_CYCLE() : '2025–2026')}>
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
          const alumnos = l.grupos.reduce((a, g) => a + claseCount(g), 0);
          return (
            <section key={l.id}>
              <div className="row center gap-10" style={{ marginBottom: 12 }}>
                <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0, width: 32, height: 32 }}><Icon name={l.icon} size={17} /></div>
                <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)' }}>{l.id}</span>
                <span className="faint" style={{ fontSize: 12.5 }}>{l.grupos.length} grupos · {alumnos} alumnos reales</span>
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
                {l.grupos.map((c) => {
                  const titular = String(c.titular || '').trim();
                  const n = claseCount(c);
                  return (
                    <div className="card pad clickable" key={c._id} onClick={() => setDetailId(c._id)} style={{ display: 'flex', flexDirection: 'column', gap: 11, cursor: 'pointer' }}>
                      <div className="row between center">
                        <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={l.icon} size={18} /></div>
                        <div className="row center gap-6" onClick={(e) => e.stopPropagation()}>
                          <span className="faint font-mono" style={{ fontSize: 11 }}>{n} alumnos</span>
                          <RowMenu items={[
                            { icon: 'edit', label: 'Editar datos', onClick: () => setEditing(c) },
                            { icon: 'trash', label: 'Eliminar clase', danger: true, onClick: () => setDeleting(c) },
                          ]} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15.5, fontFamily: 'var(--font-display)' }}>Grupo {c.g}</div>
                        <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{titular || 'Sin docente titular'} · Salón {c.salon}</div>
                      </div>
                      <div className="row between center" style={{ paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                        <span className="faint" style={{ fontSize: 12 }}>Alumnos reales</span>
                        <span className="tnum" style={{ fontWeight: 600 }}>{n}</span>
                      </div>
                    </div>
                  );
                })}
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
        {deleting && <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>Se eliminará el <b>Grupo {deleting.g}</b> ({deleting.nivel}){deleting.titular ? ' con titular ' + deleting.titular : ' sin docente titular asignado'}. Esta acción no afecta el historial de calificaciones ni asistencia ya capturado.</p>}
      </Modal>
    </div>
  );
}

Object.assign(window, { Clases, ClaseDrawer, ClaseEditModal, ClaseNuevaModal, claseRoster, claseCount, clasesSource, claseCleanList, claseIsSeed });
