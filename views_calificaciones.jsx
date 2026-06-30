/* views_calificaciones.jsx — Gestión › Calificaciones con datos reales únicamente */

const CAL_PERIODS = ['Primer parcial', 'Segundo parcial', 'Tercer parcial'];
const CAL_CAMPOS = ['Lenguajes', 'Saberes y pensamiento científico', 'Ética, naturaleza y sociedades', 'De lo humano y lo comunitario'];
const CAL_CAMPOS_SHORT = ['Lenguajes', 'Saberes', 'Ética y soc.', 'Humano y com.'];
const CAL_QUAL = [
  { id: 'RA', label: 'Requiere apoyo', score: 1, color: 'var(--red)' },
  { id: 'ED', label: 'En desarrollo', score: 2, color: 'var(--amber)' },
  { id: 'NE', label: 'Nivel esperado', score: 3, color: 'var(--text)' },
  { id: 'SD', label: 'Sobresaliente', score: 4, color: 'var(--green)' },
];

function calQual(id) { return CAL_QUAL.find(q => q.id === id) || null; }
function calQualFromScore(s) { return CAL_QUAL[Math.max(0, Math.min(3, Math.round(s) - 1))]; }
function calClean(v) { return String(v || '').trim().replace(/\s+/g, ' '); }
function calIsSeedClass(c) { return /^cls-\d+$/i.test(String((c && c._id) || '')); }
function calDeletedClassIds() { try { return new Set((DB.settings && DB.settings.deletedClassIds) || []); } catch (e) { return new Set(); } }
function calNivelesCfg() { return window.NIVELES_CFG || [{ id: 'Preescolar' }, { id: 'Primaria' }, { id: 'Secundaria' }]; }
function calClases() {
  const deleted = calDeletedClassIds();
  return ((window.DB && Array.isArray(DB.clases)) ? DB.clases : [])
    .filter(c => c && !calIsSeedClass(c) && !deleted.has(c._id) && calClean(c.g))
    .map(c => ({ ...c, nivel: c.nivel || 'Primaria', g: calClean(c.g), salon: c.salon || '—' }));
}
function calGroupsOf(nivel) { return calClases().filter(c => c.nivel === nivel); }
function calRoster(clase) {
  if (!clase) return [];
  const group = calClean(clase.g || clase.grade || clase.group);
  const nivel = calClean(clase.nivel);
  const students = ((window.DB && Array.isArray(DB.students)) ? DB.students : []).filter(s => {
    const sg = calClean(s.grade || s.group || s.grupo);
    const sn = calClean(s.nivel || s.level);
    return sg === group && (!nivel || !sn || sn === nivel) && calClean(s.name || s.nombre);
  }).map(s => calClean(s.name || s.nombre));
  return Array.from(new Set(students)).sort((a, b) => a.localeCompare(b));
}

const CAL_KEY = window.PIAGET_FRESH ? 'piaget_califs_fresh_real_v2' : 'piaget_califs_real_v2';
function calLoadEdits() { try { const v = JSON.parse(localStorage.getItem(CAL_KEY) || 'null'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
function calSaveEdits(v) { try { localStorage.setItem(CAL_KEY, JSON.stringify(v)); } catch (e) {} }
const calCellKey = (period, group, name, campo) => period + '|' + group + '|' + name + '|' + campo;
function calSeedValue() { return null; }

function calStats(rows, qual) {
  const campoSums = CAL_CAMPOS.map(() => ({ sum: 0, n: 0 }));
  const perStudent = [];
  let filledN = 0, filledSum = 0;
  const counts = { RA: 0, ED: 0, NE: 0, SD: 0 };
  rows.forEach(r => {
    let sSum = 0, sN = 0, hasRA = false;
    r.grades.forEach((g, ci) => {
      if (g == null || g === '') return;
      const v = qual ? (calQual(g) ? calQual(g).score : null) : Number(g);
      if (v == null || isNaN(v)) return;
      campoSums[ci].sum += v; campoSums[ci].n++;
      filledN++; filledSum += v; sSum += v; sN++;
      if (qual) { counts[g] = (counts[g] || 0) + 1; if (g === 'RA') hasRA = true; }
    });
    if (sN) perStudent.push({ name: r.name, avg: sSum / sN, hasRA });
  });
  const campoAvgs = campoSums.map((c, i) => ({ campo: CAL_CAMPOS[i], avg: c.n ? c.sum / c.n : null }));
  const ranked = campoAvgs.filter(c => c.avg != null).sort((a, b) => b.avg - a.avg);
  const low = qual ? perStudent.filter(s => s.hasRA) : perStudent.filter(s => s.avg < 7);
  return {
    avg: filledN ? filledSum / filledN : null,
    best: ranked[0] || null,
    worst: ranked[ranked.length - 1] || null,
    low,
    counts,
    esperadoPct: filledN ? Math.round(((counts.NE || 0) + (counts.SD || 0)) / filledN * 100) : 0,
    pct: rows.length ? Math.round(filledN / (rows.length * CAL_CAMPOS.length) * 100) : 0,
  };
}

function calAnalysisFallback(group, period, st, qual) {
  if (!group) return 'Selecciona un grupo real para analizar calificaciones.';
  if (st.avg == null) return 'Aún no hay capturas reales en ' + period + ' para ' + group + '. Captura evaluaciones y vuelve a analizar.';
  if (qual) {
    return 'En ' + period + ', el ' + st.esperadoPct + '% de las evaluaciones de ' + group + ' está en nivel esperado o sobresaliente. ' + (st.low.length ? st.low.length + ' alumno(s) requieren apoyo específico.' : 'No hay alumnos marcados con requiere apoyo.');
  }
  return 'El grupo ' + group + ' promedia ' + st.avg.toFixed(1) + ' en ' + period + '. ' + (st.low.length ? st.low.length + ' alumno(s) están por debajo de 7 y requieren seguimiento.' : 'No hay alumnos por debajo de 7.');
}

function Calificaciones({ go }) {
  useStore();
  const nivelesAll = calNivelesCfg();
  const realLevels = Array.from(new Set(calClases().map(c => c.nivel)));
  const nivelesList = nivelesAll.filter(n => !realLevels.length || realLevels.includes(n.id));
  const [nivel, setNivel] = React.useState(() => (nivelesList[0] && nivelesList[0].id) || 'Primaria');
  const [period, setPeriod] = React.useState(CAL_PERIODS[0]);
  const [groupId, setGroupId] = React.useState('');
  const [edits, setEdits] = React.useState(calLoadEdits);
  const [analysis, setAnalysis] = React.useState(null);

  const groups = calGroupsOf(nivel);
  React.useEffect(() => {
    const g = calGroupsOf(nivel)[0];
    setGroupId(prev => calGroupsOf(nivel).some(c => c._id === prev) ? prev : (g ? g._id : ''));
  }, [nivel, calClases().length]);

  const clase = groups.find(c => c._id === groupId) || groups[0] || null;
  const group = clase ? clase.g : '';
  const qual = nivel === 'Preescolar';
  const minG = nivel === 'Secundaria' ? 5 : 6;
  const roster = clase ? calRoster(clase) : [];
  const valueOf = (name, campo) => {
    const k = calCellKey(period, group, name, campo);
    if (k in edits) return edits[k];
    return calSeedValue();
  };
  const rows = roster.map(name => ({ name, grades: CAL_CAMPOS.map(c => valueOf(name, c)) }));
  const st = calStats(rows, qual);
  React.useEffect(() => { setAnalysis(null); }, [groupId, nivel, period]);

  function pickNivel(n) { setNivel(n); const g = calGroupsOf(n)[0]; setGroupId(g ? g._id : ''); }
  function setGrade(name, campo, raw) {
    if (!group) return;
    const k = calCellKey(period, group, name, campo);
    let v;
    if (qual) v = raw === '' ? null : raw;
    else { v = raw === '' ? null : Math.round(Number(raw)); if (v != null) { if (isNaN(v)) return; v = Math.max(minG, Math.min(10, v)); } }
    setEdits(e => { const n = { ...e, [k]: v }; calSaveEdits(n); return n; });
  }
  function saveCapture() {
    if (!clase) { toast('Crea primero un grupo real en Clases', 'warn'); return; }
    if (!roster.length) { toast('Agrega alumnos reales a este grupo desde Académico', 'warn'); return; }
    try { if (window.Store && Store.saveState) Store.saveState(); } catch (e) {}
    try { if (window.Store && Store.log) Store.log('Académico', 'guardó la captura de ' + group + ' · ' + period + ' (' + st.pct + '%)', 'edit'); } catch (e) {}
    toast('Captura guardada · ' + st.pct + '% completa ✓', 'ok');
  }
  function analyze() { setAnalysis({ text: calAnalysisFallback(group, period, st, qual), ia: false }); }
  const campoAvg = (ci) => {
    const vals = rows.map(r => {
      const g = r.grades[ci];
      if (g == null || g === '') return null;
      return qual ? (calQual(g) ? calQual(g).score : null) : Number(g);
    }).filter(v => v != null && !isNaN(v));
    if (!vals.length) return '—';
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return qual ? calQualFromScore(avg).id : avg.toFixed(1);
  };
  const promedioDe = (r) => {
    const vals = r.grades.map(g => (g == null || g === '') ? null : qual ? (calQual(g) ? calQual(g).score : null) : Number(g)).filter(v => v != null && !isNaN(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  return <div className="content-inner">
    <PageHead eyebrow="Gestión" title="Calificaciones" desc="Captura real por campo formativo. No se generan calificaciones ni alumnos de demostración.">
      <button className="btn" onClick={() => go && go('clases')}><Icon name="layers" size={15} className="btn-ico" />Clases</button>
      <button className="btn primary" onClick={saveCapture}><Icon name="check" size={15} className="btn-ico" />Guardar captura</button>
    </PageHead>

    <div className="row between center wrap gap-12" style={{ marginBottom: 12 }}>
      <div className="seg">
        {nivelesAll.map(n => <button key={n.id} className={nivel === n.id ? 'active' : ''} onClick={() => pickNivel(n.id)}>{n.id}<span className="faint" style={{ marginLeft: 6, fontSize: 11 }}>{calGroupsOf(n.id).length}</span></button>)}
      </div>
      <div className="row center gap-8"><select className="inp" style={{ height: 34, padding: '0 10px', fontSize: 12.5, width: 160 }} value={period} onChange={e => setPeriod(e.target.value)}>{CAL_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}</select><span className="tnum font-mono faint" style={{ fontSize: 11.5 }}>{st.pct}% capturado</span></div>
    </div>

    {!calClases().length ? <div className="card pad" style={{ textAlign: 'center', padding: 34 }}><Icon name="layers" size={26} className="faint" /><h3 style={{ margin: '12px 0 6px' }}>No hay grupos reales cargados</h3><p className="faint" style={{ margin: 0, fontSize: 13 }}>Crea grupos reales en el módulo Clases para poder capturar calificaciones.</p><button className="btn primary mt-16" onClick={() => go && go('clases')}>Ir a Clases</button></div> : <>
      <div className="seg" style={{ flexWrap: 'wrap', marginBottom: 16, rowGap: 4 }}>{groups.map(c => <button key={c._id} className={clase && clase._id === c._id ? 'active' : ''} onClick={() => setGroupId(c._id)}>{c.g}</button>)}</div>
      {clase && !roster.length ? <div className="card pad" style={{ textAlign: 'center', padding: 34 }}><Icon name="cap" size={26} className="faint" /><h3 style={{ margin: '12px 0 6px' }}>Este grupo no tiene alumnos reales</h3><p className="faint" style={{ margin: 0, fontSize: 13 }}>Agrega alumnos en Académico con el grupo <b>{group}</b> para capturar calificaciones.</p><button className="btn primary mt-16" onClick={() => go && go('academic')}>Ir a Académico</button></div> : <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', alignItems: 'start' }}>
        <div className="card"><CardHead icon="edit" title={(qual ? 'Registro de evaluación · ' : 'Libro de calificaciones · ') + group} sub={period + ' · ' + roster.length + ' alumnos reales' + (qual ? ' · evaluación cualitativa' : ' · escala ' + minG + '–10')} />
          {qual && <div className="row wrap gap-8" style={{ padding: '2px 16px 10px' }}>{CAL_QUAL.map(q => <span key={q.id} className="faint" style={{ fontSize: 11.5 }}><strong style={{ color: q.color, fontWeight: 700 }}>{q.id}</strong> {q.label}</span>)}</div>}
          <div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Alumno</th>{CAL_CAMPOS_SHORT.map((c, i) => <th key={i} className="num" title={CAL_CAMPOS[i]}>{c}</th>)}<th className="num">{qual ? 'Nivel' : 'Prom.'}</th></tr></thead><tbody>{rows.map(r => { const avg = promedioDe(r); return <tr key={r.name}><td><div className="person"><Avatar name={r.name} size={28} /><div className="pname" style={{ fontSize: 13 }}>{r.name}</div></div></td>{CAL_CAMPOS.map((c, ci) => { const v = r.grades[ci]; const empty = v == null || v === ''; if (qual) { const q = empty ? null : calQual(v); return <td key={ci} className="num"><select value={empty ? '' : v} onChange={e => setGrade(r.name, c, e.target.value)} className="inp tnum" style={{ width: 58, height: 30, padding: '0 4px', textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: q ? q.color : 'var(--text-faint)', background: empty ? 'var(--surface-2)' : 'var(--surface)' }}><option value="">·</option>{CAL_QUAL.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}</select></td>; } return <td key={ci} className="num"><input type="number" min={minG} max={10} step={1} value={empty ? '' : v} placeholder="·" onChange={e => setGrade(r.name, c, e.target.value)} className="inp tnum" style={{ width: 52, height: 30, padding: '0 6px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: !empty && v < 7 ? 'var(--red)' : 'var(--text)', background: empty ? 'var(--surface-2)' : 'var(--surface)' }} /></td>; })}<td className="num"><span className="tnum" style={{ fontWeight: 700, fontSize: 13, color: avg != null && avg < 7 ? 'var(--red)' : 'var(--text)' }}>{avg != null ? (qual ? calQualFromScore(avg).id : avg.toFixed(1)) : '—'}</span></td></tr>; })}</tbody><tfoot><tr style={{ borderTop: '2px solid var(--border-strong)' }}><td style={{ fontWeight: 600, fontSize: 12.5 }}>{qual ? 'Tendencia del grupo' : 'Promedio del grupo'}</td>{CAL_CAMPOS.map((c, ci) => <td key={ci} className="num"><span className="tnum font-mono" style={{ fontWeight: 700, fontSize: 12.5 }}>{campoAvg(ci)}</span></td>)}<td className="num"><span className="tnum font-mono" style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--accent)' }}>{st.avg != null ? (qual ? calQualFromScore(st.avg).id : st.avg.toFixed(1)) : '—'}</span></td></tr></tfoot></table></div>
        </div>
        <div className="ai-panel" style={{ alignSelf: 'start' }}><div className="ai-panel-head"><div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div><div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>Análisis del grupo</div><div className="faint" style={{ fontSize: 11.5 }}>{group} · {nivel} · {period}</div></div></div><div className="col" style={{ gap: 12, padding: '12px 2px 2px' }}><div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>{(qual ? [['Esperado o más', st.avg != null ? st.esperadoPct + '%' : '—'], ['Captura', st.pct + '%'], ['Requieren apoyo', String(st.low.length)], ['Campo a reforzar', st.worst ? CAL_CAMPOS_SHORT[CAL_CAMPOS.indexOf(st.worst.campo)] : '—']] : [['Promedio', st.avg != null ? st.avg.toFixed(1) : '—'], ['Captura', st.pct + '%'], ['Bajo 7', String(st.low.length)], ['Campo débil', st.worst ? CAL_CAMPOS_SHORT[CAL_CAMPOS.indexOf(st.worst.campo)] : '—']]).map(([k, v]) => <div key={k} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 11px' }}><div className="faint" style={{ fontSize: 10.5 }}>{k}</div><div className="tnum" style={{ fontSize: 14, fontWeight: 700, marginTop: 1 }}>{v}</div></div>)}</div>{analysis ? <div className="card pad" style={{ background: 'var(--surface)', boxShadow: 'none' }}><div style={{ fontSize: 13, lineHeight: 1.6 }}>{analysis.text}</div><div className="row center" style={{ gap: 6, marginTop: 10 }}><Badge tone="gray" dot>Análisis calculado</Badge><button className="chip-btn plain" style={{ fontSize: 11 }} onClick={analyze}>Regenerar</button></div></div> : <button className="btn primary" style={{ justifyContent: 'center' }} onClick={analyze}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Analizar</button>}</div></div>
      </div>}
    </>}
  </div>;
}

Object.assign(window, { Calificaciones });
