/* views_calificaciones.jsx — Gestión › Calificaciones: libro de captura por campo formativo (SEP)
   Niveles completos (Preescolar · Primaria · Secundaria) tomados de DB.clases.
   Preescolar: evaluación cualitativa (la SEP no asigna calificaciones numéricas). */

/* ============ helpers ============ */
function calHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991; return h; }

async function calClaudeJSON(prompt) {
  if (!(window.claude && window.claude.complete)) return null;
  try {
    const out = await window.claude.complete(prompt);
    const o = out.indexOf('{'), e = out.lastIndexOf('}');
    if (o < 0 || e <= o) return null;
    return JSON.parse(out.slice(o, e + 1));
  } catch (err) { return null; }
}

const CAL_PERIODS = ['Primer parcial', 'Segundo parcial', 'Tercer parcial'];
const CAL_CAMPOS = ['Lenguajes', 'Saberes y pensamiento científico', 'Ética, naturaleza y sociedades', 'De lo humano y lo comunitario'];
const CAL_CAMPOS_SHORT = ['Lenguajes', 'Saberes', 'Ética y soc.', 'Humano y com.'];

/* Niveles de evaluación cualitativa (Preescolar) */
const CAL_QUAL = [
  { id: 'RA', label: 'Requiere apoyo', score: 1, color: 'var(--red)' },
  { id: 'ED', label: 'En desarrollo', score: 2, color: 'var(--amber)' },
  { id: 'NE', label: 'Nivel esperado', score: 3, color: 'var(--text)' },
  { id: 'SD', label: 'Sobresaliente', score: 4, color: 'var(--green)' },
];
const calQual = (id) => CAL_QUAL.find(q => q.id === id) || null;
const calQualFromScore = (s) => CAL_QUAL[Math.max(0, Math.min(3, Math.round(s) - 1))];

/* ============ clases / grupos por nivel ============ */
function calClases() { return window.docClases((window.DB && DB.clases && DB.clases.length) ? DB.clases : window.CLASES_SEED); }
function calGroupsOf(nivel) { return calClases().filter(c => c.nivel === nivel); }

/* ============ roster: mismo padrón que el módulo Clases + alumnos reales ============ */
function calRoster(clase) {
  const real = (DB.students || []).filter(s => s.grade === clase.g).map(s => s.name);
  const gen = window.alumnosDeClase ? alumnosDeClase(clase).map(a => a.name) : [];
  const names = [];
  [...real, ...gen].forEach(n => { if (!names.includes(n)) names.push(n); });
  return names.slice(0, clase.alumnos).sort((a, b) => a.localeCompare(b));
}

/* ============ calificaciones: seed determinístico + ediciones persistidas ============ */
const CAL_KEY = window.PIAGET_FRESH ? 'piaget_califs_fresh_v1' : 'piaget_califs_v1';
function calLoadEdits() {
  try { const v = JSON.parse(localStorage.getItem(CAL_KEY) || 'null'); if (v && typeof v === 'object') return v; } catch (e) { }
  return {};
}
function calSaveEdits(v) { try { localStorage.setItem(CAL_KEY, JSON.stringify(v)); } catch (e) { } }
const calCellKey = (period, group, name, campo) => period + '|' + group + '|' + name + '|' + campo;

/* valor base (sin ediciones): 1er parcial completo, 2do ~70 %, 3ro vacío */
function calSeedValue(period, group, name, campo, qual, minG) {
  if (window.PIAGET_FRESH) return null;
  const h = calHash(period + group + name + campo);
  if (period === CAL_PERIODS[2]) return null;
  if (period === CAL_PERIODS[1] && h % 10 >= 7) return null;
  if (qual) {
    const d = h % 10;
    return d === 0 ? 'RA' : d <= 3 ? 'ED' : d <= 7 ? 'NE' : 'SD';
  }
  return Math.max(minG, 6 + (h % 5) - (minG === 5 && h % 13 === 0 ? 2 : 0));
}

/* ============ estadísticas (numéricas o cualitativas) ============ */
function calStats(rows, qual) {
  const campoSums = CAL_CAMPOS.map(() => ({ sum: 0, n: 0 }));
  const perStudent = [];
  let filledN = 0, filledSum = 0;
  const counts = { RA: 0, ED: 0, NE: 0, SD: 0 };
  rows.forEach(r => {
    let sSum = 0, sN = 0, hasRA = false;
    r.grades.forEach((g, ci) => {
      if (g == null || g === '') return;
      const v = qual ? (calQual(g) ? calQual(g).score : null) : g;
      if (v == null) return;
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
    best: ranked[0] || null, worst: ranked[ranked.length - 1] || null,
    low, counts,
    esperadoPct: filledN ? Math.round((counts.NE + counts.SD) / filledN * 100) : 0,
    pct: rows.length ? Math.round(filledN / (rows.length * CAL_CAMPOS.length) * 100) : 0,
  };
}

function calAnalysisFallback(group, period, st, qual) {
  if (st.avg == null) return 'Aún no hay capturas en ' + period + ' para ' + group + '. Captura algunas evaluaciones y vuelve a pedir el análisis.';
  if (qual) {
    let txt = 'En ' + period + ', el ' + st.esperadoPct + '% de las evaluaciones de ' + group + ' está en nivel esperado o sobresaliente (captura al ' + st.pct + '%). ';
    if (st.best && st.worst && st.best.campo !== st.worst.campo) txt += 'El campo más sólido es ' + st.best.campo + ' y el que más acompañamiento pide es ' + st.worst.campo + '. ';
    txt += st.low.length
      ? st.low.length + ' alumno(s) requieren apoyo en al menos un campo: ' + st.low.map(s => s.name.split(' ')[0]).join(', ') + '. Sugiero actividades focalizadas y aviso a sus tutores.'
      : 'Ningún alumno requiere apoyo; mantén las actividades y documenta evidencias.';
    return txt;
  }
  let txt = 'El grupo ' + group + ' promedia ' + st.avg.toFixed(1) + ' en ' + period + ' (captura al ' + st.pct + '%). ';
  if (st.best && st.worst && st.best.campo !== st.worst.campo) txt += 'El campo más sólido es ' + st.best.campo + ' (' + st.best.avg.toFixed(1) + ') y el más débil ' + st.worst.campo + ' (' + st.worst.avg.toFixed(1) + '). ';
  txt += st.low.length
    ? st.low.length + ' alumno(s) están por debajo de 7: ' + st.low.map(s => s.name.split(' ')[0]).join(', ') + '. Sugiero tutoría focalizada en ' + (st.worst ? st.worst.campo : 'el campo más débil') + ' y aviso a sus tutores.'
    : 'Ningún alumno está por debajo de 7; mantén el ritmo y reconoce el esfuerzo del grupo.';
  return txt;
}

async function calAnalysisAI(group, period, st, qual) {
  if (st.avg == null) return { text: calAnalysisFallback(group, period, st, qual), ia: false };
  const detalle = qual
    ? 'Evaluación cualitativa de preescolar (RA=requiere apoyo, ED=en desarrollo, NE=nivel esperado, SD=sobresaliente).\n' +
      'Distribución: RA ' + st.counts.RA + ', ED ' + st.counts.ED + ', NE ' + st.counts.NE + ', SD ' + st.counts.SD + '. En nivel esperado o superior: ' + st.esperadoPct + '%.\n' +
      'Campo más sólido: ' + (st.best ? st.best.campo : '—') + '. Campo con más área de oportunidad: ' + (st.worst ? st.worst.campo : '—') + '.\n' +
      'Alumnos con al menos un RA: ' + (st.low.length ? st.low.map(s => s.name).join(', ') : 'ninguno') + '.'
    : 'Escala 6-10. Promedio general: ' + st.avg.toFixed(2) + '.\n' +
      'Campo más alto: ' + (st.best ? st.best.campo + ' ' + st.best.avg.toFixed(1) : '—') + '. Campo más bajo: ' + (st.worst ? st.worst.campo + ' ' + st.worst.avg.toFixed(1) : '—') + '.\n' +
      'Alumnos bajo 7: ' + (st.low.length ? st.low.map(s => s.name + ' (' + s.avg.toFixed(1) + ')').join(', ') : 'ninguno') + '.';
  const p = 'Eres el Copilot académico de ' + DB.school.name + '. Analiza estas evaluaciones por campo formativo (SEP) del grupo ' + group + ' en ' + period + ':\n' +
    'Captura al ' + st.pct + '%.\n' + detalle +
    '\nEscribe un análisis accionable de 50-70 palabras en español para la coordinación académica. Responde ÚNICAMENTE JSON: {"analisis":"..."}';
  const r = await calClaudeJSON(p);
  if (r && r.analisis) return { text: String(r.analisis), ia: true };
  return { text: calAnalysisFallback(group, period, st, qual), ia: false };
}

/* ============ vista principal ============ */
function Calificaciones({ go }) {
  const _sc = window.docScope && window.docScope();
  const nivelesList = (_sc && _sc.niveles && _sc.niveles.length)
    ? NIVELES_CFG.filter(n => _sc.niveles.indexOf(n.id) !== -1)
    : NIVELES_CFG;
  const [nivel, setNivel] = React.useState(() => (nivelesList[0] && nivelesList[0].id) || 'Primaria');
  const groups = calGroupsOf(nivel);
  const [groupId, setGroupId] = React.useState('cl-5a');
  const clase = groups.find(c => c._id === groupId) || groups[0] || calClases()[0] || null;
  const group = clase ? clase.g : '';
  const qual = nivel === 'Preescolar';
  const minG = nivel === 'Secundaria' ? 5 : 6;

  const [period, setPeriod] = React.useState(CAL_PERIODS[1]);
  const [edits, setEdits] = React.useState(calLoadEdits);
  const [analysis, setAnalysis] = React.useState(null);
  const [analyzing, setAnalyzing] = React.useState(false);

  const roster = React.useMemo(() => clase ? calRoster(clase) : [], [clase ? clase._id : 'none']);
  const valueOf = (name, campo) => {
    const k = calCellKey(period, group, name, campo);
    if (k in edits) return edits[k];
    return calSeedValue(period, group, name, campo, qual, minG);
  };
  const rows = roster.map(name => ({ name, grades: CAL_CAMPOS.map(c => valueOf(name, c)) }));
  const st = calStats(rows, qual);

  React.useEffect(() => { setAnalysis(null); }, [groupId, nivel, period]);

  function pickNivel(n) {
    if (n === nivel) return;
    setNivel(n);
    const g = calGroupsOf(n)[0];
    if (g) setGroupId(g._id);
  }

  function setGrade(name, campo, raw) {
    const k = calCellKey(period, group, name, campo);
    let v;
    if (qual) {
      v = raw === '' ? null : raw;
    } else {
      v = raw === '' ? null : Math.round(Number(raw));
      if (v != null) { if (isNaN(v)) return; v = Math.max(minG, Math.min(10, v)); }
    }
    setEdits(e => { const n = { ...e, [k]: v }; calSaveEdits(n); return n; });
  }
  function saveCapture() {
    Store.log('Académico', 'guardó la captura de ' + group + ' · ' + period + ' (' + st.pct + '%)', 'edit');
    toast('Captura guardada · ' + st.pct + '% completa ✓');
  }
  async function analyze() {
    if (analyzing) return;
    setAnalyzing(true); setAnalysis(null);
    const [r] = await Promise.all([calAnalysisAI(group, period, st, qual), new Promise(res => setTimeout(res, 1300))]);
    setAnalysis(r); setAnalyzing(false);
  }

  const campoAvg = (ci) => {
    const vals = rows.map(r => {
      const g = r.grades[ci];
      if (g == null || g === '') return null;
      return qual ? (calQual(g) ? calQual(g).score : null) : g;
    }).filter(v => v != null);
    if (!vals.length) return '—';
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return qual ? calQualFromScore(avg).id : avg.toFixed(1);
  };

  const promedioDe = (r) => {
    const vals = r.grades.map(g => (g == null || g === '') ? null : qual ? (calQual(g) ? calQual(g).score : null) : g).filter(v => v != null);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  return (
    <div className="content-inner">
      <PageHead eyebrow="Gestión" title="Calificaciones"
        desc={qual
          ? 'Evaluación cualitativa por campo formativo (SEP) · en preescolar no se asignan calificaciones numéricas.'
          : 'Captura por campo formativo (SEP) · escala ' + minG + '–10, mínima aprobatoria 6.'}>
        <button className="btn" onClick={() => go('boletines')}><Icon name="bookOpen" size={15} className="btn-ico" />Boletines</button>
        <button className="btn primary" onClick={saveCapture}><Icon name="check" size={15} className="btn-ico" />Guardar captura</button>
      </PageHead>

      <div className="row between center wrap gap-12" style={{ marginBottom: 12 }}>
        <div className="seg">
          {nivelesList.map(n => (
            <button key={n.id} className={nivel === n.id ? 'active' : ''} onClick={() => pickNivel(n.id)}>
              {n.id}<span className="faint" style={{ marginLeft: 6, fontSize: 11 }}>{calGroupsOf(n.id).length}</span>
            </button>
          ))}
        </div>
        <div className="row center gap-8">
          <select className="inp" style={{ height: 34, padding: '0 10px', fontSize: 12.5, width: 160 }} value={period} onChange={e => setPeriod(e.target.value)}>
            {CAL_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="row center gap-8" style={{ minWidth: 150 }}>
            <div className="grow" style={{ width: 90 }}><Bar value={st.pct} height={6} color={st.pct === 100 ? 'var(--green)' : 'var(--accent)'} /></div>
            <span className="tnum font-mono faint" style={{ fontSize: 11.5 }}>{st.pct}% capturado</span>
          </div>
        </div>
      </div>

      <div className="seg" style={{ flexWrap: 'wrap', marginBottom: 16, rowGap: 4 }}>
        {groups.map(c => (
          <button key={c._id} className={clase._id === c._id ? 'active' : ''} onClick={() => setGroupId(c._id)}>
            {nivel === 'Secundaria' ? c.g.replace(' Sec', '') : c.g}
          </button>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <CardHead icon="edit" title={(qual ? 'Registro de evaluación · ' : 'Libro de calificaciones · ') + group}
            sub={period + ' · ' + roster.length + ' alumnos · ' + (clase ? clase.titular : 'sin grupos') + (qual ? ' · clic en una celda para evaluar' : ' · clic en una celda para capturar')} />
          {qual && (
            <div className="row wrap gap-8" style={{ padding: '2px 2px 10px' }}>
              {CAL_QUAL.map(q => (
                <span key={q.id} className="faint" style={{ fontSize: 11.5 }}>
                  <strong style={{ color: q.color, fontWeight: 700 }}>{q.id}</strong> {q.label}
                </span>
              ))}
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr>
                <th>Alumno</th>
                {CAL_CAMPOS_SHORT.map((c, i) => <th key={i} className="num" title={CAL_CAMPOS[i]}>{c}</th>)}
                <th className="num">{qual ? 'Nivel' : 'Prom.'}</th>
              </tr></thead>
              <tbody>
                {rows.map((r) => {
                  const avg = promedioDe(r);
                  return (
                    <tr key={r.name}>
                      <td><div className="person"><Avatar name={r.name} size={28} /><div className="pname" style={{ fontSize: 13 }}>{r.name}</div></div></td>
                      {CAL_CAMPOS.map((c, ci) => {
                        const v = r.grades[ci];
                        const empty = v == null || v === '';
                        if (qual) {
                          const q = empty ? null : calQual(v);
                          return (
                            <td key={ci} className="num">
                              <select
                                value={empty ? '' : v}
                                onChange={e => setGrade(r.name, c, e.target.value)}
                                className="inp tnum"
                                style={{
                                  width: 58, height: 30, padding: '0 4px', textAlign: 'center', fontSize: 12.5, fontWeight: 700,
                                  color: q ? q.color : 'var(--text-faint)',
                                  background: empty ? 'var(--surface-2)' : 'var(--surface)',
                                }}>
                                <option value="">·</option>
                                {CAL_QUAL.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                              </select>
                            </td>
                          );
                        }
                        return (
                          <td key={ci} className="num">
                            <input
                              type="number" min={minG} max={10} step={1}
                              value={empty ? '' : v}
                              placeholder="·"
                              onChange={e => setGrade(r.name, c, e.target.value)}
                              className="inp tnum"
                              style={{
                                width: 52, height: 30, padding: '0 6px', textAlign: 'center', fontSize: 13, fontWeight: 600,
                                color: !empty && v < 7 ? 'var(--red)' : 'var(--text)',
                                background: empty ? 'var(--surface-2)' : 'var(--surface)',
                              }} />
                          </td>
                        );
                      })}
                      <td className="num">
                        {qual ? (
                          <span className="tnum" style={{ fontWeight: 700, fontSize: 12.5, color: avg != null ? calQualFromScore(avg).color : 'var(--text-faint)' }}>
                            {avg != null ? calQualFromScore(avg).id : '—'}
                          </span>
                        ) : (
                          <span className="tnum" style={{ fontWeight: 700, fontSize: 13, color: avg != null && avg < 7 ? 'var(--red)' : avg != null && avg >= 9 ? 'var(--green)' : 'var(--text)' }}>
                            {avg != null ? avg.toFixed(1) : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border-strong)' }}>
                  <td style={{ fontWeight: 600, fontSize: 12.5 }}>{qual ? 'Tendencia del grupo' : 'Promedio del grupo'}</td>
                  {CAL_CAMPOS.map((c, ci) => <td key={ci} className="num"><span className="tnum font-mono" style={{ fontWeight: 700, fontSize: 12.5 }}>{campoAvg(ci)}</span></td>)}
                  <td className="num"><span className="tnum font-mono" style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--accent)' }}>
                    {st.avg != null ? (qual ? calQualFromScore(st.avg).id : st.avg.toFixed(1)) : '—'}
                  </span></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="ai-panel" style={{ alignSelf: 'start' }}>
          <div className="ai-panel-head">
            <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
            <div className="grow">
              <div style={{ fontWeight: 600, fontSize: 14 }}>Análisis del grupo</div>
              <div className="faint" style={{ fontSize: 11.5 }}>{group} · {nivel} · {period}</div>
            </div>
          </div>
          <div className="col" style={{ gap: 12, padding: '12px 2px 2px' }}>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(qual ? [
                ['Esperado o más', st.avg != null ? st.esperadoPct + '%' : '—'],
                ['Captura', st.pct + '%'],
                ['Requieren apoyo', String(st.low.length)],
                ['Campo a reforzar', st.worst ? CAL_CAMPOS_SHORT[CAL_CAMPOS.indexOf(st.worst.campo)] : '—'],
              ] : [
                ['Promedio', st.avg != null ? st.avg.toFixed(1) : '—'],
                ['Captura', st.pct + '%'],
                ['Bajo 7', String(st.low.length)],
                ['Campo débil', st.worst ? CAL_CAMPOS_SHORT[CAL_CAMPOS.indexOf(st.worst.campo)] : '—'],
              ]).map(([k, v]) => (
                <div key={k} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 11px' }}>
                  <div className="faint" style={{ fontSize: 10.5 }}>{k}</div>
                  <div className="tnum" style={{ fontSize: 14, fontWeight: 700, marginTop: 1 }}>{v}</div>
                </div>
              ))}
            </div>

            {analysis ? (
              <div className="card pad" style={{ background: 'var(--surface)', boxShadow: 'none' }}>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{analysis.text}</div>
                <div className="row center" style={{ gap: 6, marginTop: 10 }}>
                  <Badge tone={analysis.ia ? 'violet' : 'gray'} dot>{analysis.ia ? 'Análisis con IA' : 'Análisis calculado'}</Badge>
                  <button className="chip-btn plain" style={{ fontSize: 11 }} onClick={analyze}>Regenerar</button>
                </div>
                {st.low.length > 0 && (
                  <div className="row gap-8 wrap" style={{ marginTop: 10 }}>
                    <button className="chip-btn" onClick={() => { Store.log('Copilot', 'generó plan de ' + (qual ? 'acompañamiento' : 'tutoría') + ' para ' + st.low.length + ' alumno(s) de ' + group, 'spark'); toast('Plan de ' + (qual ? 'acompañamiento' : 'tutoría') + ' generado para ' + st.low.length + ' alumno(s) ✓'); }}>{qual ? 'Plan de acompañamiento' : 'Generar plan de tutoría'}</button>
                    <button className="chip-btn" onClick={() => toast('Aviso enviado a los tutores ✓')}>Avisar a tutores</button>
                  </div>
                )}
              </div>
            ) : analyzing ? (
              <div className="row center" style={{ gap: 9, padding: '8px 2px' }}>
                <span className="ai-orb" style={{ width: 18, height: 18, borderRadius: 6 }}><Icon name="spark" size={10} fill="currentColor" /></span>
                <span style={{ fontSize: 12.5 }}>Analizando {roster.length} alumnos × 4 campos…</span>
              </div>
            ) : (
              <button className="btn primary" style={{ justifyContent: 'center' }} onClick={analyze}>
                <Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Analizar con IA
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Calificaciones });
