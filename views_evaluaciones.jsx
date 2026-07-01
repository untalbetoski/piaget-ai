/* views_evaluaciones.jsx — Gestión › Evaluaciones con datos reales únicamente */

function EvTypeChip({ e, size }) {
  const ty = evType(e); const t = window.TONE[ty.tone] || window.TONE.blue;
  return <span className="row center gap-6" style={{ background: t.bg, color: t.c, borderRadius: 999, padding: size === 'sm' ? '3px 9px 3px 7px' : '4px 11px 4px 8px', fontSize: size === 'sm' ? 11.5 : 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}><Icon name={ty.icon} size={size === 'sm' ? 12 : 13} />{ty.label}</span>;
}
function EvStatusBadge({ s }) { const [tone, label] = EV_STATUS[s] || ['gray', s || 'Programada']; return <Badge tone={tone} dot>{label}</Badge>; }
function evScoreColor(num) { if (num == null) return 'var(--text-faint)'; if (num < 7) return 'var(--red)'; if (num >= 9) return 'var(--green)'; return 'var(--text)'; }
function evRealEvaluaciones() { return ((DB && Array.isArray(DB.evaluaciones)) ? DB.evaluaciones : []).filter(e => e && e._id && evClaseOf(e)); }
function evFirstGroup(nivel) { const g = evGruposDe(nivel)[0]; return g || ''; }
function evFirstNivel() { const c = evClases()[0]; return c ? c.nivel : 'Primaria'; }
function evSubjects(nivel) { return EV_MATERIAS[nivel] || EV_MATERIAS.Primaria; }
function evNewForm() { const nivel = evFirstNivel(); return { name: '', nivel, group: evFirstGroup(nivel), subject: evSubjects(nivel)[0], type: 'examen', date: '', status: 'programada' }; }

function EvalList({ onOpen, go }) {
  useStore();
  const [nivelFilter, setNivelFilter] = React.useState('Todos');
  const [modal, setModal] = React.useState(false);
  const [form, setForm] = React.useState(evNewForm);
  const scores = evLoadScores();
  const realClasses = evClases();
  const evals = evRealEvaluaciones();
  const NIVS = ['Todos', 'Preescolar', 'Primaria', 'Secundaria'];
  const rows = evals.filter(e => nivelFilter === 'Todos' || evNivel(e.group) === nivelFilter);
  const statOf = (e) => { const nivel = evNivel(e.group); return evStats(e, evRoster(evClaseOf(e)), scores, nivel === 'Preescolar', evMinG(nivel)); };
  const statsAll = rows.map(e => ({ e, st: statOf(e) }));
  const porCalificar = rows.filter(e => e.status === 'calificar').length;
  const gradedAvgs = statsAll.filter(x => x.st.avg != null && evNivel(x.e.group) !== 'Preescolar');
  const promGeneral = gradedAvgs.length ? gradedAvgs.reduce((a, x) => a + x.st.avg, 0) / gradedAvgs.length : null;
  const totalStudents = rows.reduce((a, e) => a + evRoster(evClaseOf(e)).length, 0);
  const totalGraded = statsAll.reduce((a, x) => a + x.st.graded, 0);
  const statusOrder = ['programada', 'abierta', 'calificar', 'cerrada'];
  const statusColors = { programada: 'var(--accent)', abierta: 'var(--amber)', calificar: 'var(--violet)', cerrada: 'var(--green)' };
  const donutSegs = statusOrder.map(s => ({ label: EV_STATUS[s][1], value: rows.filter(e => e.status === s).length, color: statusColors[s] })).filter(s => s.value > 0);
  const bySubject = {};
  statsAll.forEach(({ e, st }) => { if (st.avg != null && evNivel(e.group) !== 'Preescolar') (bySubject[e.subject] = bySubject[e.subject] || []).push(st.avg); });
  const subjLabels = Object.keys(bySubject).slice(0, 6);
  const subjData = subjLabels.map(s => Math.round(bySubject[s].reduce((a, b) => a + b, 0) / bySubject[s].length * 10) / 10);
  function pickNivel(nivel) { setForm(f => ({ ...f, nivel, group: evFirstGroup(nivel), subject: evSubjects(nivel)[0] })); }
  function openModal() { setForm(evNewForm()); setModal(true); }
  function save() {
    if (!realClasses.length) { toast('Crea primero grupos reales en Clases', 'warn'); return; }
    if (!form.name.trim()) { toast('Escribe el nombre de la evaluación', 'warn'); return; }
    if (!form.group || !evClaseOf({ group: form.group })) { toast('Selecciona un grupo real', 'warn'); return; }
    const clase = evClaseOf({ group: form.group });
    const total = evRoster(clase).length;
    const it = Store.add('evaluaciones', { name: form.name.trim(), group: form.group, subject: form.subject, type: form.type, date: form.date || 'Sin fecha', status: form.status, submitted: 0, total, createdManual: true });
    if (Store.saveState) Store.saveState();
    try { Store.log('Docente', 'creó la evaluación "' + form.name.trim() + '" · ' + form.group, 'clipboard'); } catch (_) {}
    toast('Evaluación creada ✓', 'ok');
    setModal(false);
    if (it && it._id) onOpen(it._id);
  }
  const kpis = [
    { label: 'Evaluaciones reales', value: String(rows.length), icon: 'clipboard', tone: 'blue' },
    { label: 'Por calificar', value: String(porCalificar), icon: 'edit', tone: 'violet' },
    { label: 'Promedio', value: promGeneral != null ? promGeneral.toFixed(1) : '—', icon: 'award', tone: 'green' },
    { label: 'Capturas', value: totalStudents ? Math.round(totalGraded / totalStudents * 100) + '%' : '—', icon: 'checkCircle', tone: 'cyan' },
  ];
  return <div className="content-inner">
    <PageHead eyebrow="Gestión" title="Evaluaciones" desc={rows.length + ' evaluaciones reales · ' + realClasses.length + ' grupos reales'}>
      <button className="btn" onClick={() => go && go('clases')}><Icon name="layers" size={15} className="btn-ico" />Clases</button>
      <button className="btn primary" onClick={openModal}><Icon name="plus" size={15} className="btn-ico" />Nueva evaluación</button>
    </PageHead>
    <div className="seg" style={{ marginBottom: 14 }}>{NIVS.map(n => <button key={n} className={nivelFilter === n ? 'active' : ''} onClick={() => setNivelFilter(n)}>{n}<span className="faint" style={{ marginLeft: 6, fontSize: 11 }}>{evals.filter(e => n === 'Todos' || evNivel(e.group) === n).length}</span></button>)}</div>
    <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>{kpis.map((k, i) => { const t = window.TONE[k.tone] || window.TONE.blue; return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>; })}</div>
    <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1.4fr', alignItems: 'stretch' }}>
      <div className="card pad"><CardHead icon="pie" title="Por estatus" sub="Solo evaluaciones creadas en grupos reales" />{donutSegs.length ? <div className="row center" style={{ gap: 18, marginTop: 8 }}><Donut segments={donutSegs} size={132} thickness={17} center={<div style={{ textAlign: 'center' }}><div className="font-display" style={{ fontSize: 24, fontWeight: 600 }}>{rows.length}</div><div className="faint" style={{ fontSize: 10.5 }}>reales</div></div>} /><div className="col gap-8" style={{ flex: 1 }}>{donutSegs.map(s => <div key={s.label} className="row center gap-8"><span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} /><span className="grow" style={{ fontSize: 12.5 }}>{s.label}</span><span className="tnum font-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{s.value}</span></div>)}</div></div> : <div className="faint" style={{ fontSize: 13, padding: '20px 0' }}>Sin evaluaciones reales para mostrar.</div>}</div>
      <div className="card pad"><CardHead icon="bars" title="Promedio por materia" sub="Solo calificaciones capturadas" />{subjLabels.length ? <div style={{ marginTop: 6 }}><BarChart data={subjData} labels={subjLabels.map(s => s.length > 9 ? s.slice(0, 8) + '…' : s)} height={196} max={10} colors={['var(--accent)']} /></div> : <div className="faint" style={{ fontSize: 13, padding: '20px 0' }}>Aún no hay evaluaciones calificadas.</div>}</div>
    </div>
    <div className="card mt-16"><CardHead icon="clipboard" title="Evaluaciones" sub="Clic en una fila para abrir el detalle" /><div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Evaluación</th><th>Tipo</th><th>Nivel</th><th>Grupo</th><th>Materia / campo</th><th>Captura</th><th className="num">Prom.</th><th>Estatus</th><th></th></tr></thead><tbody>{statsAll.map(({ e, st }) => { const nv = evNivel(e.group); const qual = nv === 'Preescolar'; const cfg = window.nivelCfg ? nivelCfg(nv) : { tone: 'blue' }; return <tr key={e._id} style={{ cursor: 'pointer' }} onClick={() => onOpen(e._id)}><td style={{ fontWeight: 600 }}>{e.name}<div className="faint" style={{ fontSize: 11.5, fontWeight: 400, marginTop: 1 }}>{e.date}</div></td><td><EvTypeChip e={e} size="sm" /></td><td><Badge tone={cfg.tone}>{nv}</Badge></td><td><span className="font-mono" style={{ fontSize: 13 }}>{e.group}</span></td><td className="muted">{e.subject}</td><td><div className="row center gap-8"><div style={{ width: 50 }}><Bar value={st.pct} height={5} color="var(--accent)" /></div><span className="tnum faint font-mono" style={{ fontSize: 12 }}>{st.graded}/{st.total}</span></div></td><td className="num">{qual ? <span className="tnum font-mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{st.esperadoPct != null ? st.esperadoPct + '%' : '—'}</span> : <span className="tnum font-mono" style={{ fontSize: 13, fontWeight: 700, color: st.avg != null ? evScoreColor(st.avg) : 'var(--text-faint)' }}>{st.avg != null ? st.avg.toFixed(1) : '—'}</span>}</td><td><EvStatusBadge s={e.status} /></td><td onClick={ev => ev.stopPropagation()}><RowMenu items={[{ icon: 'eye', label: 'Abrir', onClick: () => onOpen(e._id) }, { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => { Store.remove('evaluaciones', e._id); if (Store.saveState) Store.saveState(); toast('Evaluación eliminada', 'warn'); } }]} /></td></tr>; })}{!statsAll.length && <tr><td colSpan="9" className="faint" style={{ textAlign: 'center', padding: 30 }}>{realClasses.length ? 'Sin evaluaciones reales registradas.' : 'Primero crea grupos reales en Clases.'}</td></tr>}</tbody></table></div></div>
    <Modal open={modal} onClose={() => setModal(false)} title="Nueva evaluación" footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Crear y abrir</button></>}>
      {!realClasses.length ? <div className="card pad" style={{ boxShadow: 'none', textAlign: 'center' }}><Icon name="layers" size={24} className="faint" /><div style={{ fontWeight: 700, marginTop: 10 }}>No hay grupos reales</div><div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>Crea grupos en Clases antes de generar evaluaciones.</div></div> : <><Field label="Nombre"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={form.nivel === 'Preescolar' ? 'Observación de campo · Lenguajes' : 'Examen parcial de Matemáticas'} autoFocus /></Field><div className="field-row"><Field label="Tipo"><SelectInput value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={Object.values(EV_TYPES).map(t => ({ value: t.id, label: t.label }))} /></Field><Field label="Nivel"><SelectInput value={form.nivel} onChange={e => pickNivel(e.target.value)} options={['Preescolar', 'Primaria', 'Secundaria']} /></Field></div><div className="field-row"><Field label="Grupo"><SelectInput value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} options={evGruposDe(form.nivel)} /></Field><Field label={form.nivel === 'Preescolar' ? 'Campo formativo' : 'Materia'}><SelectInput value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} options={evSubjects(form.nivel)} /></Field></div><div className="field-row"><Field label="Fecha / vencimiento"><TextInput value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="p.ej. mañana 09:00" /></Field><Field label="Estatus"><SelectInput value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={[{ value: 'programada', label: 'Programada' }, { value: 'abierta', label: 'Abierta' }, { value: 'calificar', label: 'Por calificar' }]} /></Field></div></>}
    </Modal>
  </div>;
}

function EvalDetail({ e, onBack }) {
  useStore();
  const nivel = evNivel(e.group); const qual = nivel === 'Preescolar'; const minG = evMinG(nivel);
  const clase = evClaseOf(e); const roster = evRoster(clase);
  const [scores, setScores] = React.useState(evLoadScores);
  const [tab, setTab] = React.useState('calificar');
  const st = evStats(e, roster, scores, qual, minG);
  const scoreOf = name => { const k = evCellKey(e._id, name); return k in scores ? scores[k] : null; };
  function commitScores(next) { setScores(next); evSaveScores(next); }
  function setScore(name, raw) { const k = evCellKey(e._id, name); let v; if (qual) v = raw === '' ? null : raw; else { v = raw === '' ? null : Number(raw); if (v != null) { if (isNaN(v)) return; v = Math.max(minG, Math.min(10, Math.round(v * 10) / 10)); } } commitScores({ ...scores, [k]: v }); }
  function persistEval(extra) { const graded = roster.filter(n => { const v = scoreOf(n); return v != null && v !== ''; }).length; Store.update('evaluaciones', e._id, { submitted: graded, total: roster.length, avg: st.avg != null ? Math.round(st.avg * 10) / 10 : null, ...(extra || {}) }); if (Store.saveState) Store.saveState(); }
  function guardar() { persistEval(); toast('Evaluación guardada · ' + st.pct + '% ✓', 'ok'); }
  function cerrar() { persistEval({ status: 'cerrada' }); toast('Evaluación cerrada ✓', 'ok'); }
  const ty = evType(e); const tcol = window.TONE[ty.tone] || window.TONE.blue; const cfg = window.nivelCfg ? nivelCfg(nivel) : { tone: 'blue' };
  const rowsData = roster.map(name => ({ name, score: scoreOf(name) }));
  return <div className="content-inner"><button className="btn sm" onClick={onBack} style={{ marginBottom: 14 }}><Icon name="chevR" size={14} className="btn-ico" style={{ transform: 'rotate(180deg)' }} />Volver a evaluaciones</button><div className="row between center wrap gap-12" style={{ marginBottom: 6 }}><div className="row center gap-12"><div className="kpi-ico" style={{ background: tcol.bg, color: tcol.c, marginBottom: 0, width: 46, height: 46 }}><Icon name={ty.icon} size={22} /></div><div><h1 className="page-title" style={{ marginBottom: 4 }}>{e.name}</h1><div className="row center gap-8 wrap"><EvTypeChip e={e} size="sm" /><Badge tone={cfg.tone}>{nivel}</Badge><span className="faint" style={{ fontSize: 12.5 }}>{e.group} · {e.subject}</span><EvStatusBadge s={e.status} /></div></div></div><div className="row gap-8"><button className="btn" onClick={guardar}><Icon name="check" size={15} className="btn-ico" />Guardar</button>{e.status !== 'cerrada' && <button className="btn primary" onClick={cerrar}><Icon name="checkCircle" size={15} className="btn-ico" />Cerrar evaluación</button>}</div></div><div className="seg" style={{ margin: '14px 0 18px' }}>{[['calificar', 'Calificar'], ['resultados', 'Resultados']].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</div>{!clase ? <div className="card pad" style={{ textAlign: 'center', padding: 34 }}>Esta evaluación pertenece a un grupo que ya no existe.</div> : !roster.length ? <div className="card pad" style={{ textAlign: 'center', padding: 34 }}><Icon name="cap" size={26} className="faint" /><h3 style={{ margin: '12px 0 6px' }}>Este grupo no tiene alumnos reales</h3><p className="faint" style={{ margin: 0, fontSize: 13 }}>Agrega alumnos reales en Académico para capturar esta evaluación.</p></div> : tab === 'calificar' ? <div className="card"><CardHead icon="edit" title="Captura de evaluación" sub={st.graded + ' de ' + st.total + ' alumnos calificados'} /><div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Alumno</th><th className="num">Resultado</th><th className="num">Estatus</th></tr></thead><tbody>{rowsData.map(r => { const empty = r.score == null || r.score === ''; return <tr key={r.name}><td><div className="person"><Avatar name={r.name} size={28} /><div className="pname" style={{ fontSize: 13 }}>{r.name}</div></div></td>{qual ? <><td className="num"><select value={empty ? '' : r.score} onChange={ev => setScore(r.name, ev.target.value)} className="inp tnum" style={{ width: 68, height: 30, padding: '0 4px', textAlign: 'center', fontSize: 12.5, fontWeight: 700 }}><option value="">·</option>{EV_QUAL.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}</select></td><td className="num"><span className="faint" style={{ fontSize: 11.5 }}>{empty ? 'Pendiente' : (evQual(r.score) || {}).label}</span></td></> : <><td className="num"><input type="number" min={minG} max={10} step={0.5} value={empty ? '' : r.score} placeholder="·" onChange={ev => setScore(r.name, ev.target.value)} className="inp tnum" style={{ width: 58, height: 30, padding: '0 6px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: !empty && Number(r.score) < 7 ? 'var(--red)' : 'var(--text)' }} /></td><td className="num">{empty ? <span className="faint" style={{ fontSize: 11.5 }}>Pendiente</span> : <Badge tone={Number(r.score) >= minG ? 'green' : 'red'} dot>{Number(r.score) >= minG ? 'Aprobado' : 'No acred.'}</Badge>}</td></>}</tr>; })}</tbody></table></div><div className="row between center" style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}><span className="faint" style={{ fontSize: 12.5 }}>{st.graded} de {st.total} calificados</span><button className="btn primary" onClick={guardar}><Icon name="check" size={15} className="btn-ico" />Guardar resultados</button></div></div> : <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}><div className="card kpi"><div className="kpi-label">Captura</div><div className="kpi-value tnum">{st.pct}%</div></div><div className="card kpi"><div className="kpi-label">{qual ? 'Nivel esperado +' : 'Promedio'}</div><div className="kpi-value tnum">{qual ? (st.esperadoPct != null ? st.esperadoPct + '%' : '—') : (st.avg != null ? st.avg.toFixed(1) : '—')}</div></div><div className="card kpi"><div className="kpi-label">Atención</div><div className="kpi-value tnum">{st.low.length}</div></div></div>}</div>;
}

function Evaluaciones({ go, openCopilot }) {
  useStore();
  const [selId, setSelId] = React.useState(null);
  const evals = evRealEvaluaciones();
  const sel = selId ? evals.find(e => e._id === selId) : null;
  React.useEffect(() => { const el = document.querySelector('.content'); if (el) el.scrollTop = 0; }, [selId]);
  if (sel) return <EvalDetail e={sel} onBack={() => setSelId(null)} openCopilot={openCopilot} />;
  return <EvalList onOpen={setSelId} go={go} />;
}

Object.assign(window, { Evaluaciones });
