/* views_boletines.jsx — Gestión › Boletines: generación con IA, detalle por grupo y boleta de muestra
   (reemplaza Boletines de views_gestion.jsx) */

/* ============ helpers ============ */
function bolHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991; return h; }

async function bolClaudeJSON(prompt) {
  if (!(window.claude && window.claude.complete)) return null;
  try {
    const out = await window.claude.complete(prompt);
    const o = out.indexOf('{'), e = out.lastIndexOf('}');
    if (o < 0 || e <= o) return null;
    return JSON.parse(out.slice(o, e + 1));
  } catch (err) { return null; }
}

/* ============ estado persistido de periodos (por nivel) ============ */
const BOL_KEY = window.PIAGET_FRESH ? 'piaget_boletines_fresh_v2' : 'piaget_boletines_v2';
const BOL_NIVELES = ['Preescolar', 'Primaria', 'Secundaria'];
function bolSeed() {
  return (DB.boletines || []).map(p => {
    const id = p.period.toLowerCase().replace(/[^a-z]/g, '');
    const niveles = p.status === 'captura'
      ? { Preescolar: 'lista', Primaria: 'captura', Secundaria: 'captura' }
      : { Preescolar: p.status, Primaria: p.status, Secundaria: p.status };
    return { ...p, id, niveles };
  });
}
function bolLoad() {
  try { const v = JSON.parse(localStorage.getItem(BOL_KEY) || 'null'); if (Array.isArray(v) && v.length && v[0].niveles) return v; } catch (e) { }
  return bolSeed();
}
function bolSave(v) { try { localStorage.setItem(BOL_KEY, JSON.stringify(v)); } catch (e) { } }

/* estado agregado de un periodo a partir de sus niveles */
function bolPeriodStatus(p) {
  const vs = BOL_NIVELES.map(n => (p.niveles || {})[n] || p.status);
  if (vs.every(v => v === 'pendiente')) return 'pendiente';
  if (vs.some(v => v === 'captura')) return 'captura';
  if (vs.some(v => v === 'lista')) return 'lista';
  return 'publicado';
}
function bolNivelCounts() {
  const m = { Preescolar: 0, Primaria: 0, Secundaria: 0 };
  bolClases().forEach(c => { m[c.nivel] = (m[c.nivel] || 0) + c.alumnos; });
  return m;
}
function bolIssued(p, counts) {
  return BOL_NIVELES.reduce((a, n) => a + ((p.niveles[n] === 'lista' || p.niveles[n] === 'publicado') ? counts[n] : 0), 0);
}

/* grupos reales por nivel (mismo padrón que Clases y Calificaciones) */
function bolClases() { return (window.DB && DB.clases && DB.clases.length) ? DB.clases : window.CLASES_SEED; }
function bolGroupRows(period) {
  return bolClases().map(c => {
    const h = bolHash(period.id + c.g);
    const stN = period.niveles ? period.niveles[c.nivel] : period.status;
    const qual = c.nivel === 'Preescolar';
    return {
      group: c.g, nivel: c.nivel, qual,
      pct: stN === 'pendiente' ? 0 : stN === 'captura' ? 40 + (h % 58) : 100,
      avg: (qual || stN === 'pendiente') ? null : (7.6 + (h % 15) / 10).toFixed(1),
    };
  });
}

/* ============ esquema SEP (Nueva Escuela Mexicana) ============ */
const SEP_CCT = '09PPR0421K';
const SEP_CAMPOS = ['Lenguajes', 'Saberes y pensamiento científico', 'Ética, naturaleza y sociedades', 'De lo humano y lo comunitario'];
function bolNivel(grade) {
  if (grade === 'Kínder' || /^K\d/.test(grade)) return { nivel: 'Preescolar', fase: 'Fase 2' };
  if (/sec/i.test(grade)) return { nivel: 'Secundaria', fase: 'Fase 6' };
  const n = parseInt(grade);
  return { nivel: 'Primaria', fase: n <= 2 ? 'Fase 3' : n <= 4 ? 'Fase 4' : 'Fase 5' };
}
function bolCURP(name) {
  const h = bolHash(name);
  const L = 'ABCDEFGHJKLMNPRSTVXZ';
  const letters = name.replace(/[^A-Za-z]/g, '').toUpperCase() + 'XXXX';
  return (letters.slice(0, 4) + '1' + (5 + h % 4) + '0' + (1 + h % 9) + '0' + (1 + (h >> 2) % 9) + (h % 2 ? 'H' : 'M') + 'DF' + L[h % 20] + L[(h >> 3) % 20] + L[(h >> 5) % 20] + '0' + (h % 10)).slice(0, 18);
}
function bolCampoGrades(st) {
  return SEP_CAMPOS.map(c => {
    const h = bolHash(st.name + c);
    return { campo: c, grade: Math.max(6, Math.min(10, Math.round(st.avg + ((h % 5) - 2) * 0.4))) };
  });
}
const BOL_PREESCOLAR_OBS = {
  'Lenguajes': ['Se expresa con claridad creciente; disfruta narrar y escuchar cuentos.', 'Amplía su vocabulario y participa en diálogos grupales con seguridad.'],
  'Saberes y pensamiento científico': ['Explora, clasifica y cuenta colecciones con interés genuino.', 'Formula preguntas sobre su entorno y propone explicaciones propias.'],
  'Ética, naturaleza y sociedades': ['Respeta acuerdos del aula y cuida las plantas del jardín escolar.', 'Reconoce emociones propias y de sus compañeros; resuelve conflictos dialogando.'],
  'De lo humano y lo comunitario': ['Participa en juegos colectivos y muestra autonomía en sus hábitos.', 'Colabora en tareas comunitarias del aula y comparte materiales.'],
};
function bolPreescolarObs(st) {
  return SEP_CAMPOS.map(c => ({ campo: c, obs: BOL_PREESCOLAR_OBS[c][bolHash(st.name + c) % 2] }));
}

/* ============ IA: observaciones y sugerencias (boleta SEP) ============ */
function bolCommentFallback(st, nivel) {
  const nombre = st.name.split(' ')[0];
  if (nivel === 'Preescolar') return nombre + ' avanza con seguridad en los cuatro campos formativos: se comunica cada vez mejor, explora con curiosidad y convive con respeto. Sugerimos reforzar en casa la lectura compartida y las rutinas de autonomía.';
  if (st.avg >= 9) return nombre + ' tuvo un periodo sobresaliente en los cuatro campos formativos: mantiene hábitos de estudio sólidos y participa activamente. Sugerimos retos adicionales para seguir potenciando su talento.';
  if (st.avg >= 7.5) return nombre + ' muestra un desempeño constante y buena actitud en clase. Reforzar el campo con menor calificación le ayudará a consolidar el siguiente periodo de evaluación.';
  return nombre + ' requiere acompañamiento cercano este periodo: la asistencia y la entrega de trabajos son las áreas clave. Proponemos un plan de tutoría y comunicación semanal con la familia.';
}
async function bolCommentAI(st, grades, nivel, fase) {
  const detalle = nivel === 'Preescolar'
    ? 'Evaluación cualitativa de preescolar (sin calificaciones numéricas).'
    : 'Calificaciones por campo formativo: ' + grades.map(g => g.campo + ' ' + g.grade).join(', ') + '.';
  const p = 'Eres tutor(a) de grupo en ' + DB.school.name + ' (educación básica, México). Escribe las "Observaciones y sugerencias" de una boleta SEP (40-55 palabras, español, tono cálido y profesional, sin saludos) para:\n' +
    'Alumno: ' + st.name + ' (' + st.grade + ', ' + nivel + ', ' + fase + ' de la Nueva Escuela Mexicana). Asistencia: ' + st.att + '%.\n' + detalle +
    '\nResponde ÚNICAMENTE JSON: {"comentario":"..."}';
  const r = await bolClaudeJSON(p);
  if (r && r.comentario) return { text: String(r.comentario), ia: true };
  return { text: bolCommentFallback(st, nivel), ia: false };
}

/* ============ modal: boleta de muestra (formato SEP) ============ */
function BolSample({ open, onClose, period }) {
  const students = React.useMemo(() => [
    ...(DB.students || []),
    { name: 'Sofía Aguilar', grade: 'Kínder', avg: 0, att: 96, tutor: 'Mariana Aguilar' },
    { name: 'Diego Lozano', grade: '2° A Sec', avg: 8.3, att: 93, tutor: 'Patricia Lozano' },
  ], [open]);
  const [stIdx, setStIdx] = React.useState(0);
  const [comment, setComment] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const st = students[stIdx] || students[0];
  const { nivel, fase } = bolNivel(st ? st.grade : '1°');
  const pre = nivel === 'Preescolar';

  const grades = React.useMemo(() => (!st || pre) ? [] : bolCampoGrades(st), [stIdx, open]);
  const obs = React.useMemo(() => (!st || !pre) ? [] : bolPreescolarObs(st), [stIdx, open]);
  const promedio = grades.length ? (grades.reduce((a, g) => a + g.grade, 0) / grades.length).toFixed(1) : null;

  React.useEffect(() => { setComment(null); setBusy(false); }, [stIdx, open]);

  async function genComment() {
    if (busy) return;
    setBusy(true);
    const [r] = await Promise.all([bolCommentAI(st, grades, nivel, fase), new Promise(res => setTimeout(res, 1100))]);
    setComment(r); setBusy(false);
  }

  function downloadPDF() {
    if (!(window.DocsFiles && window.DocsFiles.buildPDF)) { toast('Descargando boleta PDF…'); return; }
    const lines = [
      DB.school.name + ' · CCT ' + SEP_CCT + ' · ' + DB.school.cycle,
      'Reporte de Evaluacion SEP · ' + (period ? period.period : 'Periodo de evaluacion'),
      '',
      'Alumno: ' + st.name + '    CURP: ' + bolCURP(st.name),
      nivel + ' · ' + fase + ' (NEM) · ' + st.grade + '    Asistencia: ' + st.att + '%',
      '',
    ];
    if (pre) {
      obs.forEach(o => {
        lines.push(o.campo + ':');
        window.DocsFiles.wrap(o.obs, 82).forEach(l => lines.push('   ' + l));
      });
      lines.push('', 'Evaluacion cualitativa: en preescolar no se asignan calificaciones numericas.');
    } else {
      grades.forEach(g => lines.push(g.campo + ': ' + g.grade));
      lines.push('Promedio del periodo: ' + promedio, '', 'Escala SEP: ' + (nivel === 'Secundaria' ? '5' : '6') + ' a 10 · calificacion minima aprobatoria 6.');
    }
    if (comment) {
      lines.push('', 'Observaciones y sugerencias:');
      window.DocsFiles.wrap(comment.text, 82).forEach(l => lines.push(l));
    }
    const blob = window.DocsFiles.buildPDF('Boleta de Evaluacion · ' + st.name, lines);
    window.DocsFiles.trigger(URL.createObjectURL(blob), 'Boleta SEP - ' + st.name + '.pdf', true);
    toast('Descargando boleta PDF ✓');
  }

  if (!open || !st) return null;
  return (
    <Modal open={open} title="Boleta de muestra · Reporte de Evaluación SEP" onClose={onClose} width={620}
      footer={<>
        <span className="faint grow" style={{ fontSize: 11.5 }}>{(period ? period.period + ' · ' : '') + DB.school.cycle + ' · Nueva Escuela Mexicana'}</span>
        <button className="btn" onClick={downloadPDF}><Icon name="download" size={14} className="btn-ico" />PDF</button>
        <button className="btn primary" onClick={onClose}>Listo</button>
      </>}>
      <Field label="Alumno">
        <SelectInput value={String(stIdx)} onChange={e => setStIdx(Number(e.target.value))}
          options={students.map((s, i) => ({ value: String(i), label: s.name + ' · ' + s.grade }))} />
      </Field>

      <div className="row center" style={{ gap: 12, margin: '4px 0 12px' }}>
        <Avatar name={st.name} size={42} />
        <div className="grow">
          <div style={{ fontWeight: 600, fontSize: 15 }}>{st.name}</div>
          <div className="faint" style={{ fontSize: 12.5 }}>{st.grade} · Tutor: {st.tutor}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {pre
            ? <Badge tone="violet" dot>Evaluación cualitativa</Badge>
            : <div className="font-display tnum" style={{ fontSize: 22, fontWeight: 700 }}>{promedio}</div>}
          <div className="faint" style={{ fontSize: 11, marginTop: 3 }}>asistencia {st.att}%</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[['CURP', bolCURP(st.name)], ['Nivel · Fase NEM', nivel + ' · ' + fase], ['CCT', SEP_CCT], ['Periodo', period ? period.period : '—']].map(([k, v]) => (
          <div key={k} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 11px' }}>
            <div className="faint" style={{ fontSize: 10.5 }}>{k}</div>
            <div className="font-mono" style={{ fontSize: 12, fontWeight: 600, marginTop: 1 }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>Campos formativos</div>
      {pre ? (
        <div className="col" style={{ gap: 9, marginBottom: 16 }}>
          {obs.map((o, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 12px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{o.campo}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 3, lineHeight: 1.5 }}>{o.obs}</div>
            </div>
          ))}
          <div className="faint" style={{ fontSize: 11.5 }}>En preescolar la SEP no asigna calificaciones numéricas: se reportan observaciones por campo formativo.</div>
        </div>
      ) : (
        <div className="col" style={{ gap: 7, marginBottom: 16 }}>
          {grades.map((g, i) => (
            <div key={i} className="row center" style={{ gap: 10 }}>
              <span style={{ flex: '0 0 215px', fontSize: 12.5, fontWeight: 500 }}>{g.campo}</span>
              <div className="grow"><Bar value={(g.grade - 5) / 5 * 100} height={6} color={g.grade >= 9 ? 'var(--green)' : g.grade >= 7 ? 'var(--accent)' : 'var(--amber)'} /></div>
              <span className="tnum font-mono" style={{ fontSize: 13, fontWeight: 700, width: 26, textAlign: 'right' }}>{g.grade}</span>
            </div>
          ))}
          <div className="faint" style={{ fontSize: 11.5, marginTop: 3 }}>Escala SEP: {nivel === 'Secundaria' ? '5–10' : '6–10'} · calificación mínima aprobatoria 6.</div>
        </div>
      )}

      <div className="eyebrow" style={{ marginBottom: 8 }}>Observaciones y sugerencias</div>
      {comment ? (
        <div style={{ fontSize: 13, lineHeight: 1.6, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '11px 13px' }}>
          {comment.text}
          <div className="row center" style={{ gap: 6, marginTop: 9 }}>
            <Badge tone={comment.ia ? 'violet' : 'gray'} dot>{comment.ia ? 'Generado con IA' : 'Plantilla'}</Badge>
            <button className="chip-btn plain" style={{ fontSize: 11 }} onClick={genComment}>Regenerar</button>
          </div>
        </div>
      ) : busy ? (
        <div className="row center" style={{ gap: 9, padding: '10px 2px' }}>
          <span className="ai-orb" style={{ width: 18, height: 18, borderRadius: 6 }}><Icon name="spark" size={10} fill="currentColor" /></span>
          <span style={{ fontSize: 12.5 }}>Redactando observaciones personalizadas…</span>
        </div>
      ) : (
        <button className="btn" style={{ justifyContent: 'center', width: '100%' }} onClick={genComment}>
          <Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Generar observaciones con IA
        </button>
      )}
    </Modal>
  );
}

/* ============ modal: detalle de periodo (acciones por nivel) ============ */
function BolDetail({ period, onClose, onGenerate, onPublish, genKey }) {
  if (!period) return null;
  const rows = bolGroupRows(period);
  const counts = bolNivelCounts();
  const status = bolPeriodStatus(period);
  const stMap = { publicado: ['green', 'Publicado'], lista: ['blue', 'Lista para publicar'], captura: ['amber', 'En captura'], pendiente: ['gray', 'Pendiente'] };
  const [tone, label] = stMap[status] || stMap.pendiente;
  return (
    <Modal open={!!period} title={period.period} onClose={onClose} width={620}
      footer={<>
        <span className="grow"><Badge tone={tone} dot>{label}</Badge></span>
        <button className="btn" onClick={onClose}>Cerrar</button>
        {status === 'publicado' && <button className="btn primary" onClick={() => toast('Descargando boletas…')}><Icon name="download" size={15} className="btn-ico" />Descargar</button>}
      </>}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[['Boletas emitidas', bolIssued(period, counts) ? fmtNum(bolIssued(period, counts)) : '—'], ['Promedio general', status === 'pendiente' ? '—' : (period.avg || '—')], ['Fecha', period.date]].map(([k, v]) => (
          <div key={k} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 12px' }}>
            <div className="faint" style={{ fontSize: 11 }}>{k}</div>
            <div className="tnum" style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Avance de captura por nivel</div>
      <div className="col" style={{ gap: 7 }}>
        {window.NIVELES_CFG.map(nv => {
          const sub = rows.filter(r => r.nivel === nv.id);
          if (!sub.length) return null;
          const nvPct = Math.round(sub.reduce((a, r) => a + r.pct, 0) / sub.length);
          const sN = period.niveles[nv.id];
          const generating = genKey === period.id + '|' + nv.id;
          return (
            <React.Fragment key={nv.id}>
              <div className="row between center" style={{ marginTop: 6 }}>
                <span className="eyebrow" style={{ fontSize: 10.5 }}>{nv.id} · {sub.length} grupos · {fmtNum(counts[nv.id])} alumnos{nv.id === 'Preescolar' ? ' · cualitativa' : ''}</span>
                <span className="row center" style={{ gap: 8 }}>
                  <span className="tnum font-mono faint" style={{ fontSize: 11 }}>{nvPct}%</span>
                  {generating ? (
                    <span className="ai-orb" style={{ width: 16, height: 16, borderRadius: 5 }}><Icon name="spark" size={9} fill="currentColor" /></span>
                  ) : sN === 'captura' ? (
                    <button className="btn sm" onClick={() => onGenerate(period, nv.id)}><Icon name="spark" size={12} className="btn-ico" fill="currentColor" />Generar</button>
                  ) : sN === 'lista' ? (
                    <button className="btn primary sm" onClick={() => onPublish(period, nv.id)}><Icon name="send" size={12} className="btn-ico" />Publicar</button>
                  ) : sN === 'publicado' ? (
                    <Badge tone="green" dot>Publicado</Badge>
                  ) : (
                    <Badge tone="gray" dot>Pendiente</Badge>
                  )}
                </span>
              </div>
              {sub.map((r, i) => (
                <div key={i} className="row center" style={{ gap: 10 }}>
                  <span className="font-mono" style={{ width: 44, fontSize: 12.5, fontWeight: 600 }}>{r.nivel === 'Secundaria' ? r.group.replace(' Sec', '') : r.group}</span>
                  <div className="grow"><Bar value={r.pct} height={6} color={r.pct === 100 ? 'var(--green)' : r.pct >= 70 ? 'var(--accent)' : 'var(--amber)'} /></div>
                  <span className="tnum font-mono faint" style={{ fontSize: 11.5, width: 38, textAlign: 'right' }}>{r.pct}%</span>
                  <span className="tnum font-mono" style={{ fontSize: 11.5, width: 30, textAlign: 'right', fontWeight: 600 }}>{r.avg || '·'}</span>
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </Modal>
  );
}

/* ============ Boletines (vista principal) ============ */
const BOL_GEN_STEPS = ['Compilando evaluaciones…', 'Comentarios de tutor con IA…', 'Armando boletas PDF…'];

function Boletines({ go }) {
  const [periods, setPeriods] = React.useState(bolLoad);
  const [detail, setDetail] = React.useState(null);
  const [sample, setSample] = React.useState(false);
  const [genKey, setGenKey] = React.useState(null);
  const [genPhase, setGenPhase] = React.useState(-1);
  const genBusy = React.useRef(false);
  const counts = bolNivelCounts();

  const updateNivel = (id, nivel, statusN) => setPeriods(ps => {
    const n = ps.map(p => {
      if (p.id !== id) return p;
      const niveles = { ...p.niveles, [nivel]: statusN };
      const all = BOL_NIVELES.every(x => niveles[x] === 'publicado');
      return { ...p, niveles, date: all ? 'hoy' : p.date };
    });
    bolSave(n); return n;
  });

  async function generate(period, nivel) {
    if (genBusy.current) return;
    genBusy.current = true;
    setGenKey(period.id + '|' + nivel); setGenPhase(0); setDetail(null);
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    delay(850).then(() => setGenPhase(p => p >= 0 ? 1 : p));
    delay(1750).then(() => setGenPhase(p => p >= 0 ? 2 : p));
    await delay(2650);
    updateNivel(period.id, nivel, 'lista');
    Store.log('Copilot', 'generó boletas de ' + nivel + ' · ' + period.period + ' (' + fmtNum(counts[nivel]) + ' alumnos)', 'bookOpen');
    setGenKey(null); setGenPhase(-1);
    genBusy.current = false;
    toast('Boletas de ' + nivel + ' · ' + period.period + ' listas para publicar ✓');
  }
  async function generateAll(period) {
    for (const n of BOL_NIVELES) {
      if (period.niveles[n] === 'captura') await generate(period, n);
    }
  }
  function publish(period, nivel) {
    updateNivel(period.id, nivel, 'publicado');
    Store.log('Académico', 'publicó boletas de ' + nivel + ' · ' + period.period, 'bookOpen');
    toast('Boletas de ' + nivel + ' publicadas a ' + fmtNum(counts[nivel]) + ' familias ✓');
  }
  function reset() {
    try { localStorage.removeItem(BOL_KEY); } catch (e) { }
    setPeriods(bolSeed()); toast('Periodos restablecidos', 'info');
  }

  const stMap = { publicado: ['green', 'Publicado'], lista: ['blue', 'Lista para publicar'], captura: ['amber', 'En captura'], pendiente: ['gray', 'Pendiente'] };
  const capturando = periods.find(p => BOL_NIVELES.some(n => p.niveles[n] === 'captura'));

  return (
    <div className="content-inner">
      <PageHead eyebrow="Gestión" title="Boletines" desc="Reportes de Evaluación SEP por periodo y nivel · campos formativos de la Nueva Escuela Mexicana.">
        <button className="btn" onClick={() => setSample(true)}><Icon name="eye" size={15} className="btn-ico" />Boleta de muestra</button>
        {capturando && !genKey && (
          <button className="btn primary" onClick={() => generateAll(capturando)}>
            <Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Generar niveles pendientes
          </button>
        )}
      </PageHead>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {periods.map((p) => {
          const status = bolPeriodStatus(p);
          const [tone, label] = stMap[status] || stMap.pendiente;
          const t = window.TONE[tone] || { bg: 'var(--surface-3)', c: 'var(--text-faint)' };
          const issued = bolIssued(p, counts);
          return (
            <div className="card pad" key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="row between center">
                <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name="bookOpen" size={20} /></div>
                <Badge tone={tone} dot>{label}</Badge>
              </div>
              <div><div style={{ fontWeight: 600, fontSize: 16 }}>{p.period}</div><div className="faint" style={{ fontSize: 12.5 }}>{p.date}</div></div>
              <div className="row between center" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div><div className="faint" style={{ fontSize: 11 }}>Emitidas</div><div className="tnum" style={{ fontWeight: 600 }}>{issued ? fmtNum(issued) : '—'}</div></div>
                <div><div className="faint" style={{ fontSize: 11 }}>Promedio</div><div className="tnum" style={{ fontWeight: 600 }}>{status === 'pendiente' ? '—' : (p.avg || '—')}</div></div>
                <button className="btn sm" onClick={() => setDetail(p.id)}>Detalle</button>
              </div>

              <div className="col" style={{ gap: 9, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                {BOL_NIVELES.map(n => {
                  const sN = p.niveles[n];
                  const generating = genKey === p.id + '|' + n;
                  return (
                    <div key={n} className="row between center" style={{ gap: 8, minHeight: 30 }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{n}</div>
                        <div className="faint" style={{ fontSize: 10.5 }}>{fmtNum(counts[n])} alumnos{n === 'Preescolar' ? ' · cualitativa' : ''}</div>
                      </div>
                      {generating ? (
                        <span className="row center" style={{ gap: 7, fontSize: 11, fontWeight: 600 }}>
                          <span className="ai-orb" style={{ width: 16, height: 16, borderRadius: 5 }}><Icon name="spark" size={9} fill="currentColor" /></span>
                          {BOL_GEN_STEPS[Math.max(0, Math.min(genPhase, 2))]}
                        </span>
                      ) : sN === 'captura' ? (
                        <button className="btn sm" onClick={() => generate(p, n)}><Icon name="spark" size={12} className="btn-ico" fill="currentColor" />Generar</button>
                      ) : sN === 'lista' ? (
                        <button className="btn primary sm" onClick={() => publish(p, n)}><Icon name="send" size={12} className="btn-ico" />Publicar</button>
                      ) : sN === 'publicado' ? (
                        <Badge tone="green" dot>Publicado</Badge>
                      ) : (
                        <Badge tone="gray" dot>Pendiente</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
        <button className="chip-btn plain" style={{ fontSize: 11 }} onClick={reset}>Restablecer periodos del demo</button>
      </div>

      <BolDetail period={periods.find(p => p.id === detail) || null} onClose={() => setDetail(null)} onGenerate={generate} onPublish={publish} genKey={genKey} />
      <BolSample open={sample} onClose={() => setSample(false)} period={periods.find(p => bolPeriodStatus(p) !== 'pendiente')} />
    </div>
  );
}

Object.assign(window, { Boletines });
