/* views_evaluaciones.jsx — Gestión › Evaluaciones
   Lista con gráficas + drill-down de página completa (Resumen · Calificar · Rúbrica · Resultados). */

/* ---------- chip de tipo ---------- */
function EvTypeChip({ e, size }) {
  const ty = evType(e); const t = window.TONE[ty.tone] || window.TONE.blue;
  return (
    <span className="row center gap-6" style={{ background: t.bg, color: t.c, borderRadius: 999, padding: size === 'sm' ? '3px 9px 3px 7px' : '4px 11px 4px 8px', fontSize: size === 'sm' ? 11.5 : 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <Icon name={ty.icon} size={size === 'sm' ? 12 : 13} />{ty.label}
    </span>
  );
}
function EvStatusBadge({ s }) {
  const [tone, label] = EV_STATUS[s] || ['gray', s];
  return <Badge tone={tone} dot>{label}</Badge>;
}
function evShortGroup(e) { const nv = evNivel(e.group); return nv === 'Secundaria' ? e.group.replace(' Sec', '') : e.group; }
function evScoreColor(num, minG) { if (num == null) return 'var(--text-faint)'; if (num < 7) return 'var(--red)'; if (num >= 9) return 'var(--green)'; return 'var(--text)'; }

/* ====================================================================
   LISTA (overview)
   ==================================================================== */
function EvalList({ onOpen }) {
  const store = useStore();
  const [nivelFilter, setNivelFilter] = React.useState('Todos');
  const [modal, setModal] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', nivel: 'Primaria', group: evGruposDe('Primaria')[0] || '5° A', subject: 'Matemáticas', type: 'examen', date: 'próxima semana', status: 'programada' });

  const scores = evLoadScores();
  const _sc = window.docScope && window.docScope();
  const evals = (DB.evaluaciones || []).filter(e => !window.docAllowsGroup || window.docAllowsGroup(e.group));
  const NIVS = ['Todos', ...((_sc && _sc.niveles && _sc.niveles.length) ? ['Preescolar', 'Primaria', 'Secundaria'].filter(n => _sc.niveles.indexOf(n) !== -1) : ['Preescolar', 'Primaria', 'Secundaria'])];
  const rows = evals.filter(e => nivelFilter === 'Todos' || evNivel(e.group) === nivelFilter);

  const statOf = (e) => {
    const nivel = evNivel(e.group); const qual = nivel === 'Preescolar';
    return evStats(e, evRoster(evClaseOf(e)), scores, qual, evMinG(nivel));
  };
  const statsAll = rows.map(e => ({ e, st: statOf(e) }));

  const porCalificar = rows.filter(e => e.status === 'calificar').length;
  const gradedAvgs = statsAll.filter(x => x.st.avg != null && evNivel(x.e.group) !== 'Preescolar');
  const promGeneral = gradedAvgs.length ? (gradedAvgs.reduce((a, x) => a + x.st.avg, 0) / gradedAvgs.length) : null;
  const totSub = rows.reduce((a, e) => a + e.submitted, 0);
  const totTot = rows.reduce((a, e) => a + e.total, 0);

  /* donut por estatus */
  const statusOrder = ['programada', 'abierta', 'calificar', 'cerrada'];
  const statusColors = { programada: 'var(--accent)', abierta: 'var(--amber)', calificar: 'var(--violet)', cerrada: 'var(--green)' };
  const donutSegs = statusOrder.map(s => ({ label: EV_STATUS[s][1], value: rows.filter(e => e.status === s).length, color: statusColors[s] })).filter(s => s.value > 0);

  /* barras: promedio por materia (numéricas) */
  const bySubject = {};
  statsAll.forEach(({ e, st }) => { if (st.avg != null && evNivel(e.group) !== 'Preescolar') { (bySubject[e.subject] = bySubject[e.subject] || []).push(st.avg); } });
  const subjLabels = Object.keys(bySubject).slice(0, 6);
  const subjData = subjLabels.map(s => Math.round(bySubject[s].reduce((a, b) => a + b, 0) / bySubject[s].length * 10) / 10);

  function pickNivel(nivel) {
    setForm(f => ({ ...f, nivel, group: evGruposDe(nivel)[0], subject: EV_MATERIAS[nivel][0] }));
  }
  function save() {
    if (!form.name.trim()) { toast('Escribe el nombre de la evaluación', 'warn'); return; }
    const clase = evClaseOf({ group: form.group });
    const it = Store.add('evaluaciones', { name: form.name.trim(), group: form.group, subject: form.subject, type: form.type, date: form.date, status: form.status, submitted: 0, total: clase ? clase.alumnos : 26 });
    Store.log('Docente', 'creó la evaluación "' + form.name.trim() + '" · ' + form.group, 'clipboard');
    toast('Evaluación creada ✓');
    setModal(false);
    setForm({ name: '', nivel: 'Primaria', group: evGruposDe('Primaria')[0] || '5° A', subject: 'Matemáticas', type: 'examen', date: 'próxima semana', status: 'programada' });
    if (it && it._id) onOpen(it._id);
  }

  const kpis = [
    { label: 'Evaluaciones', value: String(rows.length), icon: 'clipboard', tone: 'blue' },
    { label: 'Por calificar', value: String(porCalificar), icon: 'edit', tone: 'violet' },
    { label: 'Promedio', value: promGeneral != null ? promGeneral.toFixed(1) : '—', icon: 'award', tone: 'green' },
    { label: 'Entregas', value: totTot ? Math.round(totSub / totTot * 100) + '%' : '—', icon: 'checkCircle', tone: 'cyan' },
  ];

  return (
    <div className="content-inner">
      <PageHead eyebrow="Gestión" title="Evaluaciones"
        desc={rows.length + ' evaluaciones · ' + porCalificar + ' por calificar' + (nivelFilter !== 'Todos' ? ' · ' + nivelFilter : ' · 3 niveles')}>
        <button className="btn primary" onClick={() => setModal(true)}><Icon name="plus" size={15} className="btn-ico" />Nueva evaluación</button>
      </PageHead>

      <div className="seg" style={{ marginBottom: 14 }}>
        {NIVS.map(n => (
          <button key={n} className={nivelFilter === n ? 'active' : ''} onClick={() => setNivelFilter(n)}>
            {n}<span className="faint" style={{ marginLeft: 6, fontSize: 11 }}>{evals.filter(e => n === 'Todos' || evNivel(e.group) === n).length}</span>
          </button>
        ))}
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {kpis.map((k, i) => {
          const t = window.TONE[k.tone];
          return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>;
        })}
      </div>

      {/* gráficas */}
      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1.4fr', alignItems: 'stretch' }}>
        <div className="card pad">
          <CardHead icon="pie" title="Por estatus" sub="Distribución del ciclo actual" />
          {donutSegs.length ? (
            <div className="row center" style={{ gap: 18, marginTop: 8 }}>
              <Donut segments={donutSegs} size={132} thickness={17}
                center={<div style={{ textAlign: 'center' }}><div className="font-display" style={{ fontSize: 24, fontWeight: 600 }}>{rows.length}</div><div className="faint" style={{ fontSize: 10.5 }}>activas</div></div>} />
              <div className="col gap-8" style={{ flex: 1 }}>
                {donutSegs.map(s => (
                  <div key={s.label} className="row center gap-8">
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                    <span className="grow" style={{ fontSize: 12.5 }}>{s.label}</span>
                    <span className="tnum font-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="faint" style={{ fontSize: 13, padding: '20px 0' }}>Sin datos para mostrar.</div>}
        </div>

        <div className="card pad">
          <CardHead icon="bars" title="Promedio por materia" sub="Evaluaciones calificadas (escala 6–10)" />
          {subjLabels.length ? (
            <div style={{ marginTop: 6 }}><BarChart data={subjData} labels={subjLabels.map(s => s.length > 9 ? s.slice(0, 8) + '…' : s)} height={196} max={10} colors={['var(--accent)']} /></div>
          ) : <div className="faint" style={{ fontSize: 13, padding: '20px 0' }}>Aún no hay evaluaciones calificadas en este nivel.</div>}
        </div>
      </div>

      {/* tabla */}
      <div className="card mt-16">
        <CardHead icon="clipboard" title="Todas las evaluaciones" sub="Clic en una fila para abrir el detalle, calificar y ver resultados" />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Evaluación</th><th>Tipo</th><th>Nivel</th><th>Grupo</th><th>Materia / campo</th><th>Entregas</th><th className="num">Prom.</th><th>Estatus</th><th></th></tr></thead>
            <tbody>
              {statsAll.map(({ e, st }) => {
                const nv = evNivel(e.group); const qual = nv === 'Preescolar';
                const cfg = window.nivelCfg ? nivelCfg(nv) : { tone: 'blue' };
                return (
                  <tr key={e._id} style={{ cursor: 'pointer' }} onClick={() => onOpen(e._id)}>
                    <td style={{ fontWeight: 600 }}>{e.name}<div className="faint" style={{ fontSize: 11.5, fontWeight: 400, marginTop: 1 }}>{e.date}</div></td>
                    <td><EvTypeChip e={e} size="sm" /></td>
                    <td><Badge tone={cfg.tone}>{nv}</Badge></td>
                    <td><span className="font-mono" style={{ fontSize: 13 }}>{evShortGroup(e)}</span></td>
                    <td className="muted">{e.subject}</td>
                    <td>
                      <div className="row center gap-8"><div style={{ width: 50 }}><Bar value={e.total ? e.submitted / e.total * 100 : 0} height={5} color="var(--accent)" /></div><span className="tnum faint font-mono" style={{ fontSize: 12 }}>{e.submitted}/{e.total}</span></div>
                    </td>
                    <td className="num">
                      {qual
                        ? <span className="tnum font-mono" style={{ fontSize: 12.5, fontWeight: 700, color: st.esperadoPct != null ? 'var(--text)' : 'var(--text-faint)' }}>{st.esperadoPct != null ? st.esperadoPct + '%' : '—'}</span>
                        : <span className="tnum font-mono" style={{ fontSize: 13, fontWeight: 700, color: st.avg != null ? evScoreColor(st.avg, evMinG(nv)) : 'var(--text-faint)' }}>{st.avg != null ? st.avg.toFixed(1) : '—'}</span>}
                    </td>
                    <td><EvStatusBadge s={e.status} /></td>
                    <td onClick={ev => ev.stopPropagation()}>
                      <RowMenu items={[
                        { icon: 'eye', label: 'Abrir', onClick: () => onOpen(e._id) },
                        { icon: 'edit', label: 'Calificar', onClick: () => onOpen(e._id) },
                        { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => { Store.remove('evaluaciones', e._id); toast('Evaluación eliminada', 'warn'); } },
                      ]} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva evaluación"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Crear y abrir</button></>}>
        <Field label="Nombre"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={form.nivel === 'Preescolar' ? 'p.ej. Observación de campo · Lenguajes' : 'p.ej. Examen parcial de Matemáticas'} autoFocus /></Field>
        <div className="field-row">
          <Field label="Tipo"><SelectInput value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={Object.values(EV_TYPES).map(t => ({ value: t.id, label: t.label }))} /></Field>
          <Field label="Nivel"><SelectInput value={form.nivel} onChange={e => pickNivel(e.target.value)} options={['Preescolar', 'Primaria', 'Secundaria']} /></Field>
        </div>
        <div className="field-row">
          <Field label="Grupo"><SelectInput value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} options={evGruposDe(form.nivel)} /></Field>
          <Field label={form.nivel === 'Preescolar' ? 'Campo formativo' : 'Materia'}><SelectInput value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} options={EV_MATERIAS[form.nivel]} /></Field>
        </div>
        <div className="field-row">
          <Field label="Fecha / vencimiento"><TextInput value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="p.ej. mañana 09:00" /></Field>
          <Field label="Estatus"><SelectInput value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={[{ value: 'programada', label: 'Programada' }, { value: 'abierta', label: 'Abierta' }]} /></Field>
        </div>
      </Modal>
    </div>
  );
}

/* ====================================================================
   DETALLE (drill-down de página completa)
   ==================================================================== */
function EvalDetail({ e, onBack, openCopilot }) {
  const store = useStore();
  const nivel = evNivel(e.group); const qual = nivel === 'Preescolar'; const minG = evMinG(nivel);
  const clase = evClaseOf(e);
  const roster = React.useMemo(() => evRoster(clase), [e._id]);
  const [tab, setTab] = React.useState('resumen');

  const [scores, setScores] = React.useState(evLoadScores);
  const [picks, setPicks] = React.useState(evLoadPicks);
  const [rubrics, setRubrics] = React.useState(evLoadRubrics);

  const rubric = rubrics[e._id] || null;
  const scoreOf = (name) => { const k = evCellKey(e._id, name); return (k in scores) ? scores[k] : evSeedScore(e, name, qual, minG); };
  const rowsData = roster.map(name => ({ name, score: scoreOf(name) }));
  const st = evStats(e, roster, scores, qual, minG);

  function commitScores(next) { setScores(next); evSaveScores(next); }
  function setScore(name, raw) {
    const k = evCellKey(e._id, name);
    let v;
    if (qual) v = raw === '' ? null : raw;
    else { v = raw === '' ? null : Number(raw); if (v != null) { if (isNaN(v)) return; v = Math.max(minG, Math.min(10, Math.round(v * 10) / 10)); } }
    commitScores({ ...scores, [k]: v });
  }
  function setPick(name, ci, lvl) {
    const pk = e._id + '|' + name;
    const cur = picks[pk] || [];
    const arr = cur.slice(); arr[ci] = lvl;
    const np = { ...picks, [pk]: arr }; setPicks(np); evSavePicks(np);
    const computed = evRubricScore(rubric, arr, minG);
    if (computed != null) commitScores({ ...scores, [evCellKey(e._id, name)]: computed });
  }

  function persistEval(extra) {
    const graded = roster.filter(n => { const v = scoreOf(n); return v != null && v !== ''; }).length;
    Store.update('evaluaciones', e._id, { submitted: graded, avg: st.avg != null ? Math.round(st.avg * 10) / 10 : null, ...(extra || {}) });
  }
  function guardar() { persistEval(); Store.log('Docente', 'guardó calificaciones de "' + e.name + '" · ' + e.group + ' (' + st.pct + '%)', 'edit'); toast('Calificaciones guardadas · ' + st.pct + '% ✓'); }
  function cerrar() { persistEval({ status: 'cerrada' }); Store.log('Docente', 'cerró la evaluación "' + e.name + '"', 'checkCircle'); toast('Evaluación cerrada ✓'); }

  const ty = evType(e); const tcol = window.TONE[ty.tone] || window.TONE.blue;
  const cfg = window.nivelCfg ? nivelCfg(nivel) : { tone: 'blue' };
  const TABS = [['resumen', 'Resumen', 'grid'], ['calificar', 'Calificar', 'edit'], ['rubrica', 'Rúbrica', 'clipboard'], ['resultados', 'Resultados', 'chart']];

  return (
    <div className="content-inner">
      {/* encabezado */}
      <button className="btn sm" onClick={onBack} style={{ marginBottom: 14 }}><Icon name="chevR" size={14} className="btn-ico" style={{ transform: 'rotate(180deg)' }} />Volver a evaluaciones</button>
      <div className="row between center wrap gap-12" style={{ marginBottom: 6 }}>
        <div className="row center gap-12">
          <div className="kpi-ico" style={{ background: tcol.bg, color: tcol.c, marginBottom: 0, width: 46, height: 46 }}><Icon name={ty.icon} size={22} /></div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>{e.name}</h1>
            <div className="row center gap-8 wrap">
              <EvTypeChip e={e} size="sm" />
              <Badge tone={cfg.tone}>{nivel}</Badge>
              <span className="faint" style={{ fontSize: 12.5 }}>{evShortGroup(e)} · {e.subject} · {clase ? clase.titular : '—'}</span>
              <EvStatusBadge s={e.status} />
            </div>
          </div>
        </div>
        <div className="row gap-8">
          <button className="btn" onClick={guardar}><Icon name="check" size={15} className="btn-ico" />Guardar</button>
          {e.status !== 'cerrada'
            ? <button className="btn primary" onClick={cerrar}><Icon name="checkCircle" size={15} className="btn-ico" />Cerrar evaluación</button>
            : <button className="btn primary" onClick={() => go_boletines()}><Icon name="bookOpen" size={15} className="btn-ico" />Boletines</button>}
        </div>
      </div>

      {/* tabs */}
      <div className="seg" style={{ margin: '14px 0 18px' }}>
        {TABS.map(([id, label, icon]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            <Icon name={icon} size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />{label}
          </button>
        ))}
      </div>

      {tab === 'resumen' && <EvResumen e={e} st={st} qual={qual} minG={minG} roster={roster} setTab={setTab} />}
      {tab === 'calificar' && <EvCalificar e={e} st={st} qual={qual} minG={minG} rowsData={rowsData} rubric={rubric} picks={picks} setScore={setScore} setPick={setPick} guardar={guardar} setTab={setTab} />}
      {tab === 'rubrica' && <EvRubrica e={e} rubric={rubric} rubrics={rubrics} setRubrics={setRubrics} setTab={setTab} />}
      {tab === 'resultados' && <EvResultados e={e} st={st} qual={qual} minG={minG} openCopilot={openCopilot} />}
    </div>
  );
}
function go_boletines() { toast('Abre Gestión › Boletines desde el menú', 'info'); }

/* ---------- Resumen ---------- */
function EvResumen({ e, st, qual, minG, roster, setTab }) {
  const [questions, setQuestions] = React.useState(() => (evLoadQuestions()[e._id] || []));
  const [genN, setGenN] = React.useState(5);
  const [gen, setGen] = React.useState(false);
  const [genIa, setGenIa] = React.useState(null);
  const isExamen = evType(e).id === 'examen' || evType(e).id === 'quiz';

  async function generar() {
    if (gen) return; setGen(true);
    const [r] = await Promise.all([evGenerateQuestions(e, genN), new Promise(res => setTimeout(res, 1100))]);
    const all = evLoadQuestions(); all[e._id] = r.items; evSaveQuestions(all);
    setQuestions(r.items); setGenIa(r.ia); setGen(false);
    Store.log('Copilot', 'generó ' + r.items.length + ' reactivos para "' + e.name + '"', 'spark');
    toast(r.items.length + ' reactivos generados ✓');
  }

  const stats = qual
    ? [['Captura', st.pct + '%'], ['Nivel esperado +', (st.esperadoPct || 0) + '%'], ['Requieren apoyo', String(st.low.length)], ['Alumnos', String(st.total)]]
    : [['Captura', st.pct + '%'], ['Promedio', st.avg != null ? st.avg.toFixed(1) : '—'], ['Aprobados', (st.aprobPct != null ? st.aprobPct + '%' : '—')], ['En riesgo', String(st.low.length)]];

  return (
    <div className="grid" style={{ gridTemplateColumns: isExamen ? '1fr 1fr' : '1fr', gap: 16, alignItems: 'start' }}>
      <div className="col gap-16">
        <div className="card pad">
          <CardHead icon="grid" title="Resumen" sub={evType(e).label + ' · vencimiento ' + e.date} />
          <div className="row center" style={{ gap: 20, marginTop: 8 }}>
            <RingStat value={st.pct} label="capturado" size={104} color={st.pct === 100 ? 'var(--green)' : 'var(--accent)'} />
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1 }}>
              {stats.map(([k, v]) => (
                <div key={k} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 12px' }}>
                  <div className="faint" style={{ fontSize: 10.5 }}>{k}</div>
                  <div className="tnum" style={{ fontSize: 16, fontWeight: 700, marginTop: 1 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="row gap-8 mt-12" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button className="btn sm grow" style={{ justifyContent: 'center' }} onClick={() => setTab('calificar')}><Icon name="edit" size={13} className="btn-ico" />Capturar calificaciones</button>
            <button className="btn sm grow" style={{ justifyContent: 'center' }} onClick={() => setTab('resultados')}><Icon name="chart" size={13} className="btn-ico" />Ver resultados</button>
          </div>
        </div>
      </div>

      {isExamen && (
        <div className="ai-panel" style={{ alignSelf: 'start' }}>
          <div className="ai-panel-head">
            <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
            <div className="grow">
              <div style={{ fontWeight: 600, fontSize: 14 }}>Generador de reactivos</div>
              <div className="faint" style={{ fontSize: 11.5 }}>{e.subject} · {evNivel(e.group)} · {e.group}</div>
            </div>
          </div>
          <div className="col gap-12" style={{ padding: '12px 2px 2px' }}>
            {questions.length === 0 && !gen && (
              <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.5 }}>Genera un borrador de reactivos con IA, alineado a la materia y el nivel. Podrás editarlos y exportarlos.</div>
            )}
            {questions.length > 0 && (
              <div className="col gap-8">
                {questions.map((q, i) => (
                  <div key={i} className="row gap-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 11px', alignItems: 'flex-start' }}>
                    <span className="font-mono" style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent)', flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: 12.5, lineHeight: 1.45 }}>{q}</span>
                  </div>
                ))}
                <div className="row center gap-8" style={{ marginTop: 2 }}>
                  {genIa != null && <Badge tone={genIa ? 'violet' : 'gray'} dot>{genIa ? 'Generado con IA' : 'Borrador sugerido'}</Badge>}
                  <span className="grow" />
                  <button className="chip-btn plain" style={{ fontSize: 11 }} onClick={() => toast('Reactivos exportados a Docs ✓')}>Exportar</button>
                </div>
              </div>
            )}
            {gen ? (
              <div className="row center" style={{ gap: 9, padding: '6px 2px' }}>
                <span className="ai-orb" style={{ width: 18, height: 18, borderRadius: 6 }}><Icon name="spark" size={10} fill="currentColor" /></span>
                <span style={{ fontSize: 12.5 }}>Redactando {genN} reactivos…</span>
              </div>
            ) : (
              <div className="row center gap-8">
                <select className="inp" value={genN} onChange={ev => setGenN(Number(ev.target.value))} style={{ height: 38, width: 92, fontSize: 12.5 }}>
                  {[5, 8, 10].map(n => <option key={n} value={n}>{n} reactivos</option>)}
                </select>
                <button className="btn primary grow" style={{ justifyContent: 'center' }} onClick={generar}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />{questions.length ? 'Regenerar' : 'Generar reactivos'}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Calificar ---------- */
function EvCalificar({ e, st, qual, minG, rowsData, rubric, picks, setScore, setPick, guardar, setTab }) {
  const hasRubric = rubric && rubric.criteria && rubric.criteria.length > 0;
  const [mode, setMode] = React.useState('directa');
  const useRubric = mode === 'rubrica' && hasRubric;

  const promedioGrupo = st.avg;
  return (
    <div className="card">
      <CardHead icon="edit" title={'Captura · ' + e.group}
        sub={rowsData.length + ' alumnos · ' + (qual ? 'evaluación cualitativa' : 'escala ' + minG + '–10') + ' · ' + st.pct + '% capturado'}
        right={
          hasRubric ? (
            <div className="seg" style={{ padding: 2 }}>
              <button className={mode === 'directa' ? 'active' : ''} onClick={() => setMode('directa')}>Directa</button>
              <button className={mode === 'rubrica' ? 'active' : ''} onClick={() => setMode('rubrica')}>Por rúbrica</button>
            </div>
          ) : <button className="btn sm" onClick={() => setTab('rubrica')}><Icon name="plus" size={13} className="btn-ico" />Crear rúbrica</button>
        } />

      {qual && (
        <div className="row wrap gap-8" style={{ padding: '2px 2px 10px' }}>
          {EV_QUAL.map(q => <span key={q.id} className="faint" style={{ fontSize: 11.5 }}><strong style={{ color: q.color, fontWeight: 700 }}>{q.id}</strong> {q.label}</span>)}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr>
            <th>Alumno</th>
            {useRubric
              ? rubric.criteria.map((c, i) => <th key={i} className="num" title={c.name}>{c.name.length > 14 ? c.name.slice(0, 13) + '…' : c.name}<div className="faint" style={{ fontSize: 10, fontWeight: 400 }}>{c.weight}%</div></th>)
              : <th className="num">{qual ? 'Nivel' : 'Calif.'}</th>}
            <th className="num">{qual ? 'Nivel' : useRubric ? 'Final' : 'Estado'}</th>
          </tr></thead>
          <tbody>
            {rowsData.map(r => {
              const empty = r.score == null || r.score === '';
              const pk = picks[e._id + '|' + r.name] || [];
              return (
                <tr key={r.name}>
                  <td><div className="person"><Avatar name={r.name} size={28} /><div className="pname" style={{ fontSize: 13 }}>{r.name}</div></div></td>
                  {useRubric ? (
                    <>
                      {rubric.criteria.map((c, ci) => (
                        <td key={ci} className="num">
                          <select value={pk[ci] || ''} onChange={ev => setPick(r.name, ci, ev.target.value ? Number(ev.target.value) : null)} className="inp"
                            style={{ width: 64, height: 30, padding: '0 4px', fontSize: 11.5, fontWeight: 600, textAlign: 'center', color: pk[ci] ? (EV_RUBRIC_LEVELS.find(l => l.id === pk[ci]) || {}).color : 'var(--text-faint)', background: pk[ci] ? 'var(--surface)' : 'var(--surface-2)' }}>
                            <option value="">·</option>
                            {EV_RUBRIC_LEVELS.map(l => <option key={l.id} value={l.id}>{l.label[0]}{l.id}</option>)}
                          </select>
                        </td>
                      ))}
                      <td className="num"><span className="tnum" style={{ fontWeight: 700, fontSize: 13, color: empty ? 'var(--text-faint)' : evScoreColor(Number(r.score), minG) }}>{empty ? '—' : Number(r.score).toFixed(1)}</span></td>
                    </>
                  ) : qual ? (
                    <>
                      <td className="num">
                        <select value={empty ? '' : r.score} onChange={ev => setScore(r.name, ev.target.value)} className="inp tnum"
                          style={{ width: 60, height: 30, padding: '0 4px', textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: empty ? 'var(--text-faint)' : (evQual(r.score) || {}).color, background: empty ? 'var(--surface-2)' : 'var(--surface)' }}>
                          <option value="">·</option>
                          {EV_QUAL.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                        </select>
                      </td>
                      <td className="num"><span className="faint" style={{ fontSize: 11.5 }}>{empty ? '—' : (evQual(r.score) || {}).label}</span></td>
                    </>
                  ) : (
                    <>
                      <td className="num">
                        <input type="number" min={minG} max={10} step={0.5} value={empty ? '' : r.score} placeholder="·" onChange={ev => setScore(r.name, ev.target.value)} className="inp tnum"
                          style={{ width: 58, height: 30, padding: '0 6px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: !empty && Number(r.score) < 7 ? 'var(--red)' : 'var(--text)', background: empty ? 'var(--surface-2)' : 'var(--surface)' }} />
                      </td>
                      <td className="num">{empty ? <span className="faint" style={{ fontSize: 11.5 }}>Pendiente</span> : <Badge tone={Number(r.score) >= 6 ? 'green' : 'red'} dot>{Number(r.score) >= 6 ? 'Aprobado' : 'No acred.'}</Badge>}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border-strong)' }}>
              <td style={{ fontWeight: 600, fontSize: 12.5 }}>Promedio del grupo</td>
              {useRubric ? <td className="num" colSpan={rubric.criteria.length}></td> : <td className="num"></td>}
              <td className="num"><span className="tnum font-mono" style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>{promedioGrupo != null ? (qual ? (st.esperadoPct + '%') : promedioGrupo.toFixed(1)) : '—'}</span></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="row between center" style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
        <span className="faint" style={{ fontSize: 12.5 }}>{st.graded} de {st.total} calificados</span>
        <button className="btn primary" onClick={guardar}><Icon name="check" size={15} className="btn-ico" />Guardar calificaciones</button>
      </div>
    </div>
  );
}

/* ---------- Rúbrica ---------- */
function EvRubrica({ e, rubric, rubrics, setRubrics, setTab }) {
  const [draft, setDraft] = React.useState(() => rubric ? JSON.parse(JSON.stringify(rubric)) : evDefaultRubric(e));
  const [sug, setSug] = React.useState(false);
  const [sugIa, setSugIa] = React.useState(null);
  const total = draft.criteria.reduce((a, c) => a + (Number(c.weight) || 0), 0);

  function setCrit(i, patch) { setDraft(d => ({ ...d, criteria: d.criteria.map((c, j) => j === i ? { ...c, ...patch } : c) })); }
  function addCrit() { setDraft(d => ({ ...d, criteria: [...d.criteria, { name: 'Nuevo criterio', weight: 0 }] })); }
  function delCrit(i) { setDraft(d => ({ ...d, criteria: d.criteria.filter((_, j) => j !== i) })); }
  function save() {
    if (!draft.criteria.length) { toast('Agrega al menos un criterio', 'warn'); return; }
    const np = { ...rubrics, [e._id]: draft }; setRubrics(np); evSaveRubrics(np);
    Store.log('Docente', 'definió la rúbrica de "' + e.name + '"', 'clipboard');
    toast('Rúbrica guardada ✓' + (total !== 100 ? ' (pesos suman ' + total + '%)' : ''));
    setTab('calificar');
  }
  async function sugerir() {
    if (sug) return; setSug(true);
    const [r] = await Promise.all([evSuggestRubric(e), new Promise(res => setTimeout(res, 1100))]);
    setDraft({ criteria: r.criteria }); setSugIa(r.ia); setSug(false);
    toast('Rúbrica sugerida ✓');
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 16, alignItems: 'start' }}>
      <div className="card">
        <CardHead icon="clipboard" title="Criterios de evaluación" sub={'Los pesos deben sumar 100% · actualmente ' + total + '%'}
          right={<button className="btn sm" onClick={addCrit}><Icon name="plus" size={13} className="btn-ico" />Criterio</button>} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Criterio</th><th className="num" style={{ width: 90 }}>Peso %</th><th style={{ width: 40 }}></th></tr></thead>
            <tbody>
              {draft.criteria.map((c, i) => (
                <tr key={i}>
                  <td><input className="inp" value={c.name} onChange={ev => setCrit(i, { name: ev.target.value })} style={{ width: '100%', height: 32, fontSize: 13 }} /></td>
                  <td className="num"><input className="inp tnum" type="number" min={0} max={100} value={c.weight} onChange={ev => setCrit(i, { weight: Number(ev.target.value) })} style={{ width: 70, height: 32, textAlign: 'center', fontSize: 13, fontWeight: 600 }} /></td>
                  <td><button className="icon-btn" onClick={() => delCrit(i)} title="Eliminar"><Icon name="trash" size={15} /></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border-strong)' }}>
                <td style={{ fontWeight: 600, fontSize: 12.5 }}>Total</td>
                <td className="num"><span className="tnum font-mono" style={{ fontWeight: 700, color: total === 100 ? 'var(--green)' : 'var(--amber)' }}>{total}%</span></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="row between center" style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <span className="faint" style={{ fontSize: 12 }}>Escala de 4 niveles de desempeño</span>
          <button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar y aplicar</button>
        </div>
      </div>

      <div className="col gap-16">
        <div className="ai-panel">
          <div className="ai-panel-head">
            <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
            <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>Sugerir rúbrica</div><div className="faint" style={{ fontSize: 11.5 }}>{evType(e).label} · {e.subject}</div></div>
          </div>
          <div className="col gap-12" style={{ padding: '12px 2px 2px' }}>
            <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.5 }}>La IA propone criterios y pesos alineados al tipo de evaluación y la materia. Puedes ajustarlos antes de guardar.</div>
            {sugIa != null && <Badge tone={sugIa ? 'violet' : 'gray'} dot>{sugIa ? 'Sugerido con IA' : 'Plantilla sugerida'}</Badge>}
            {sug
              ? <div className="row center" style={{ gap: 9 }}><span className="ai-orb" style={{ width: 18, height: 18, borderRadius: 6 }}><Icon name="spark" size={10} fill="currentColor" /></span><span style={{ fontSize: 12.5 }}>Diseñando rúbrica…</span></div>
              : <button className="btn primary" style={{ justifyContent: 'center' }} onClick={sugerir}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Sugerir con IA</button>}
          </div>
        </div>
        <div className="card pad">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Niveles de desempeño</div>
          <div className="col gap-8">
            {EV_RUBRIC_LEVELS.map(l => (
              <div key={l.id} className="row center gap-8">
                <span style={{ width: 9, height: 9, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                <span className="grow" style={{ fontSize: 12.5 }}>{l.label}</span>
                <span className="tnum font-mono faint" style={{ fontSize: 12 }}>{Math.round(l.pct * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Resultados ---------- */
function EvResultados({ e, st, qual, minG, openCopilot }) {
  const [analysis, setAnalysis] = React.useState(null);
  const [analyzing, setAnalyzing] = React.useState(false);

  async function analyze() {
    if (analyzing) return; setAnalyzing(true); setAnalysis(null);
    const [r] = await Promise.all([evAnalyzeAI(e, st, qual), new Promise(res => setTimeout(res, 1300))]);
    setAnalysis(r); setAnalyzing(false);
  }

  const distLabels = qual ? ['RA', 'ED', 'NE', 'SD'] : ['<7', '7–7.9', '8–8.9', '9–10'];
  const distKeys = qual ? ['RA', 'ED', 'NE', 'SD'] : ['riesgo', 'suf', 'bueno', 'exc'];
  const distColors = qual ? ['var(--red)', 'var(--amber)', 'var(--text)', 'var(--green)'] : ['var(--red)', 'var(--amber)', 'var(--accent)', 'var(--green)'];
  const distData = distKeys.map(k => st.dist[k] || 0);
  const hasData = st.avg != null;

  return (
    <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 16, alignItems: 'start' }}>
      <div className="col gap-16">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {(qual
            ? [['Nivel esperado +', (st.esperadoPct != null ? st.esperadoPct + '%' : '—'), 'green'], ['Requieren apoyo', String(st.low.length), st.low.length ? 'red' : 'gray'], ['Captura', st.pct + '%', 'blue']]
            : [['Promedio', st.avg != null ? st.avg.toFixed(1) : '—', 'violet'], ['Aprobados', (st.aprobPct != null ? st.aprobPct + '%' : '—'), 'green'], ['En riesgo', String(st.low.length), st.low.length ? 'red' : 'gray']]
          ).map(([k, v, tone]) => {
            const t = window.TONE[tone] || window.TONE.blue;
            return <div className="card kpi" key={k}><div className="kpi-label">{k}</div><div className="kpi-value tnum" style={{ color: t.c }}>{v}</div></div>;
          })}
        </div>

        <div className="card pad">
          <CardHead icon="bars" title="Distribución de resultados" sub={hasData ? st.graded + ' de ' + st.total + ' alumnos calificados' : 'Sin calificaciones capturadas'} />
          {hasData ? (
            <div className="col gap-12" style={{ marginTop: 10 }}>
              {distLabels.map((lbl, i) => {
                const n = distData[i]; const maxN = Math.max(1, ...distData);
                const pct = st.graded ? Math.round(n / st.graded * 100) : 0;
                return (
                  <div key={lbl} className="row center gap-12">
                    <span className="font-mono" style={{ width: 56, fontSize: 12, color: distColors[i], fontWeight: 700, textAlign: 'right' }}>{lbl}</span>
                    <div className="grow" style={{ position: 'relative', height: 24, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, width: (n / maxN * 100) + '%', background: distColors[i], opacity: 0.85, borderRadius: 6, transition: 'width .4s' }} />
                    </div>
                    <span className="tnum font-mono" style={{ width: 64, fontSize: 12.5, fontWeight: 600 }}>{n} <span className="faint">· {pct}%</span></span>
                  </div>
                );
              })}
            </div>
          ) : <div className="faint" style={{ fontSize: 13, padding: '24px 0', textAlign: 'center' }}>Captura calificaciones en la pestaña “Calificar” para ver la distribución.</div>}
        </div>

        {hasData && (st.top || st.low.length > 0) && (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card pad">
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Mejores resultados</div>
              <div className="col gap-8">
                {st.perStudent.filter(s => s.num != null).slice().sort((a, b) => b.num - a.num).slice(0, 4).map(s => (
                  <div key={s.name} className="row center gap-8"><Avatar name={s.name} size={26} /><span className="grow" style={{ fontSize: 12.5 }}>{s.name}</span><span className="tnum font-mono" style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--green)' }}>{qual ? s.score : s.num.toFixed(1)}</span></div>
                ))}
              </div>
            </div>
            <div className="card pad">
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Requieren atención</div>
              {st.low.length ? (
                <div className="col gap-8">
                  {st.low.slice(0, 4).map(s => (
                    <div key={s.name} className="row center gap-8"><Avatar name={s.name} size={26} /><span className="grow" style={{ fontSize: 12.5 }}>{s.name}</span><span className="tnum font-mono" style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--red)' }}>{qual ? s.score : s.num.toFixed(1)}</span></div>
                  ))}
                </div>
              ) : <div className="faint" style={{ fontSize: 12.5, padding: '6px 0' }}>Ningún alumno en riesgo. 🎉</div>}
            </div>
          </div>
        )}
      </div>

      <div className="ai-panel" style={{ alignSelf: 'start' }}>
        <div className="ai-panel-head">
          <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
          <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>Análisis de resultados</div><div className="faint" style={{ fontSize: 11.5 }}>{e.group} · {e.subject}</div></div>
        </div>
        <div className="col gap-12" style={{ padding: '12px 2px 2px' }}>
          {analysis ? (
            <div className="card pad" style={{ background: 'var(--surface)', boxShadow: 'none' }}>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{analysis.text}</div>
              <div className="row center gap-6" style={{ marginTop: 10 }}>
                <Badge tone={analysis.ia ? 'violet' : 'gray'} dot>{analysis.ia ? 'Análisis con IA' : 'Análisis calculado'}</Badge>
                <button className="chip-btn plain" style={{ fontSize: 11 }} onClick={analyze}>Regenerar</button>
              </div>
              {st.low.length > 0 && (
                <div className="row gap-8 wrap" style={{ marginTop: 10 }}>
                  <button className="chip-btn" onClick={() => { Store.log('Copilot', 'generó plan de apoyo para ' + st.low.length + ' alumno(s) de ' + e.group, 'spark'); toast('Plan de apoyo generado para ' + st.low.length + ' alumno(s) ✓'); }}>Plan de apoyo</button>
                  <button className="chip-btn" onClick={() => toast('Aviso enviado a los tutores ✓')}>Avisar a tutores</button>
                </div>
              )}
            </div>
          ) : analyzing ? (
            <div className="row center" style={{ gap: 9, padding: '8px 2px' }}>
              <span className="ai-orb" style={{ width: 18, height: 18, borderRadius: 6 }}><Icon name="spark" size={10} fill="currentColor" /></span>
              <span style={{ fontSize: 12.5 }}>Analizando resultados…</span>
            </div>
          ) : (
            <>
              <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.5 }}>Obtén un análisis accionable del desempeño del grupo, con foco en quién necesita apoyo.</div>
              <button className="btn primary" style={{ justifyContent: 'center' }} onClick={analyze} disabled={!hasData}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Analizar con IA</button>
              {!hasData && <div className="faint" style={{ fontSize: 11.5, textAlign: 'center' }}>Captura calificaciones primero.</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ====================================================================
   wrapper con routing interno (lista ↔ detalle)
   ==================================================================== */
function Evaluaciones({ go, openCopilot }) {
  const store = useStore();
  const [selId, setSelId] = React.useState(null);
  const sel = selId ? DB.evaluaciones.find(e => e._id === selId) : null;
  React.useEffect(() => { const el = document.querySelector('.content'); if (el) el.scrollTop = 0; }, [selId]);
  if (sel) return <EvalDetail e={sel} onBack={() => setSelId(null)} openCopilot={openCopilot} />;
  return <EvalList onOpen={setSelId} />;
}

Object.assign(window, { Evaluaciones });
