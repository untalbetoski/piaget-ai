/* views_missions.jsx — Módulo AI Missions: filtros, estados, acciones, drawer de detalle y wizard de generación con IA */

/* ---------- Config visual por estado y materia ---------- */
const MISSION_STATUS = {
  activa: { label: 'Activa', tone: 'green' },
  pausada: { label: 'Pausada', tone: 'amber' },
  borrador: { label: 'Borrador', tone: 'gray' },
  finalizada: { label: 'Finalizada', tone: 'blue' },
};
const MISSION_SUBJECT_VIS = {
  'Español': { tone: 'violet', icon: 'bookOpen' },
  'Matemáticas': { tone: 'blue', icon: 'hash' },
  'Ciencias': { tone: 'green', icon: 'compass' },
  'Inglés': { tone: 'amber', icon: 'globe' },
  'Historia': { tone: 'red', icon: 'flag' },
  'Ed. Física': { tone: 'cyan', icon: 'zap' },
};
const missionVis = (s) => MISSION_SUBJECT_VIS[s] || { tone: 'cyan', icon: 'star' };
const missionUid = () => (crypto.randomUUID ? crypto.randomUUID() : 'mis-' + Math.random().toString(36).slice(2));

function missionDueLabel(m) {
  if (m.status === 'borrador') return 'Sin programar';
  if (m.status === 'finalizada') return 'Cerrada';
  if (m.dueDays === 0) return 'Vence hoy';
  if (m.dueDays === 1) return 'Vence mañana';
  return 'Vence en ' + m.dueDays + ' días';
}

/* ---------- Banco de propuestas del generador ---------- */
const MISSION_AI_BANK = {
  'Español': [
    { title: 'Detectives de la ortografía', desc: 'Encontrar y corregir los errores escondidos en textos cortos. La IA genera textos nuevos según los errores más comunes del grupo.', steps: ['Corregir 10 textos breves', 'Duelo de dictado por parejas', 'Escribir un texto con trampas para otro equipo'] },
    { title: 'Club de podcast literario', desc: 'Grabar mini-episodios comentando el libro del trimestre, con guion y roles rotativos por equipo.', steps: ['Escribir guion de 1 minuto', 'Grabar episodio en equipo', 'Comentar 2 episodios de compañeros'] },
  ],
  'Matemáticas': [
    { title: 'Misión fracciones ninja', desc: 'Series cronometradas de fracciones equivalentes, suma y comparación. La dificultad se adapta al desempeño de cada estudiante.', steps: ['Serie 1: equivalencias', 'Serie 2: suma y resta', 'Reto final: problemas aplicados'] },
    { title: 'Constructores de gráficas', desc: 'Levantar una encuesta real en el salón y convertir los datos en gráficas de barras y circulares.', steps: ['Diseñar encuesta de 5 preguntas', 'Recolectar 20 respuestas', 'Presentar 2 gráficas con conclusiones'] },
  ],
  'Ciencias': [
    { title: 'Laboratorio en casa', desc: 'Tres experimentos seguros con materiales caseros, documentados con foto y una hipótesis previa por experimento.', steps: ['Hipótesis antes de cada experimento', 'Realizar y fotografiar 3 experimentos', 'Comparar hipótesis vs. resultado'] },
    { title: 'Cazadores de hipótesis', desc: 'Observar un fenómeno cotidiano, plantear hipótesis en equipo y diseñar cómo comprobarla.', steps: ['Elegir fenómeno y observarlo 3 días', 'Plantear 2 hipótesis', 'Diseñar el experimento de comprobación'] },
  ],
  'Inglés': [
    { title: 'Storytellers Challenge', desc: 'Crear y narrar una historia corta en inglés usando el vocabulario de la unidad, con práctica oral asistida por IA.', steps: ['Escribir historia de 8 oraciones', 'Practicar pronunciación con el agente', 'Narrar en vivo o en audio'] },
    { title: 'English in the Wild', desc: 'Etiquetar en inglés 25 objetos de la casa y usarlos en oraciones durante una semana.', steps: ['Etiquetar 25 objetos', 'Una oración diaria con 5 objetos', 'Tour en video de 1 minuto'] },
  ],
  'Historia': [
    { title: 'Entrevista al pasado', desc: 'Asumir el rol de un personaje histórico y responder una entrevista preparada por otro equipo.', steps: ['Investigar al personaje asignado', 'Preparar 8 preguntas para otro equipo', 'Entrevista en vivo de 5 minutos'] },
    { title: 'Museo del salón', desc: 'Montar una sala de museo con piezas hechas por el grupo: cédulas, réplicas y un recorrido guiado.', steps: ['Crear pieza con cédula explicativa', 'Montar la sala por equipos', 'Guiar un recorrido de 10 minutos'] },
  ],
  'Ed. Física': [
    { title: 'Reto 10,000 pasos', desc: 'Acumular pasos en equipo durante la semana con registro diario y metas progresivas.', steps: ['Registro diario de pasos', 'Meta de equipo: 50k pasos', 'Sesión final de circuito'] },
  ],
};
const MISSION_XP = { 'Básica': 150, 'Media': 300, 'Avanzada': 450 };

/* ---- IA: generación de contenido RESOLUBLE de la misión ---- */
async function missionClaudeJSON(prompt) {
  if (!(window.claude && window.claude.complete)) return null;
  try {
    const out = await window.claude.complete(prompt);
    const o = out.indexOf('{'), e = out.lastIndexOf('}');
    if (o < 0 || e <= o) return null;
    return JSON.parse(out.slice(o, e + 1));
  } catch (err) { return null; }
}
function missionNivelOf(g) { g = String(g || ''); return /sec/i.test(g) ? 'Secundaria' : /^\s*k/i.test(g) ? 'Preescolar' : 'Primaria'; }

async function missionGenAI(subject, nivel, diff, topic) {
  const banco = MISSION_AI_BANK[subject] || MISSION_AI_BANK['Matemáticas'];
  const base = banco[Math.floor(Math.random() * banco.length)];
  const p = 'Eres docente de ' + nivel + ' en México (Nueva Escuela Mexicana). Diseña una MISIÓN de aprendizaje RESOLUBLE de ' + subject +
    ', dificultad ' + diff + (topic ? ', sobre el tema: "' + topic + '"' : '') + '. ' +
    'Incluye una breve explicación y de 4 a 6 actividades que el alumno pueda RESPONDER directamente (opción múltiple o respuesta corta), con la respuesta correcta cuando aplique. ' +
    'Las preguntas deben ser concretas y resolubles por un alumno de ' + nivel + '. ' +
    'Responde ÚNICAMENTE JSON válido: {"titulo":"máx 6 palabras","descripcion":"1 frase","intro":"2-3 frases que expliquen lo necesario para resolver la misión","actividades":[{"pregunta":"...","tipo":"opcion","opciones":["...","...","...","..."],"correcta":0,"pista":"..."}]}. ' +
    'Usa "tipo":"abierta" y omite opciones/correcta para preguntas de desarrollo.';
  const r = await missionClaudeJSON(p);
  if (r && Array.isArray(r.actividades) && r.actividades.length) {
    const tasks = r.actividades.slice(0, 6).map(a => {
      const opts = Array.isArray(a.opciones) ? a.opciones.map(String).filter(Boolean) : [];
      const isChoice = (a.tipo === 'opcion' || a.tipo === 'opción') && opts.length >= 2;
      return {
        q: String(a.pregunta || '').trim(),
        type: isChoice ? 'choice' : 'open',
        options: isChoice ? opts : [],
        answer: isChoice && Number.isInteger(a.correcta) && a.correcta >= 0 && a.correcta < opts.length ? a.correcta : null,
        hint: a.pista ? String(a.pista) : '',
      };
    }).filter(t => t.q);
    if (tasks.length) return { title: String(r.titulo || base.title), desc: String(r.descripcion || base.desc), intro: String(r.intro || ''), tasks, steps: base.steps, ia: true };
  }
  /* Fallback determinista: convierte los pasos del banco en actividades de respuesta corta */
  const intro = topic ? ('Esta misión trabaja sobre: ' + topic + '. Resuelve cada actividad con lo aprendido en clase.') : base.desc;
  const tasks = base.steps.map(s => ({ q: s, type: 'open', options: [], answer: null, hint: '' }));
  return { title: base.title, desc: base.desc, intro, tasks, steps: base.steps, ia: false };
}

/* ============================================================
   Wizard: Generar misión con IA
   ============================================================ */
function MissionWizard({ open, onClose }) {
  const _sc = window.docScope && window.docScope();
  const BASE_GROUPS = (_sc && _sc.groups && _sc.groups.length)
    ? _sc.groups
    : ['1° A', '2° A', '2° B', '3° A', '3° B', '3° C', '4° A', '4° B', '5° A', '5° B', '6° A', '6° B'];
  const [step, setStep] = React.useState('form'); // form | thinking | proposal
  const [subject, setSubject] = React.useState('Matemáticas');
  const [groups, setGroups] = React.useState([BASE_GROUPS[0] || '5° A']);
  const [diff, setDiff] = React.useState('Media');
  const [topic, setTopic] = React.useState('');
  const [variant, setVariant] = React.useState(0);
  const [extraGroups, setExtraGroups] = React.useState([]);
  const [fromAtlas, setFromAtlas] = React.useState(null);
  const [atlasMeta, setAtlasMeta] = React.useState(null);
  const [aiProp, setAiProp] = React.useState(null);
  const genSeq = React.useRef(0);

  React.useEffect(() => {
    if (!open) return;
    const pf = window.MISSION_PREFILL;
    if (pf) {
      if (pf.subject) setSubject(pf.subject);
      if (pf.groups && pf.groups.length) { setGroups(pf.groups); setExtraGroups(pf.groups.filter(g => !BASE_GROUPS.includes(g))); }
      if (pf.topic) setTopic(pf.topic);
      setFromAtlas(pf.origin || 'Atlas');
      setAtlasMeta(pf.atlas || null);
      window.MISSION_PREFILL = null;
    } else { setFromAtlas(null); setAtlasMeta(null); }
    setStep('form'); setVariant(0); setAiProp(null);
  }, [open]);

  const GROUPS = [...BASE_GROUPS, ...extraGroups];

  const bank = MISSION_AI_BANK[subject] || MISSION_AI_BANK['Matemáticas'];
  const proposal = aiProp || bank[variant % bank.length];
  const vis = missionVis(subject);
  const t = window.TONE[vis.tone];

  const generate = (v) => {
    setStep('thinking');
    setVariant(v);
    setAiProp(null);
    const seq = ++genSeq.current;
    const nivel = missionNivelOf(groups[0]);
    Promise.all([missionGenAI(subject, nivel, diff, topic.trim()), new Promise(r => setTimeout(r, 1300))])
      .then(([prop]) => { if (seq === genSeq.current) { setAiProp(prop); setStep('proposal'); } });
  };
  const toggleGroup = (g) => setGroups(gs => gs.includes(g) ? gs.filter(x => x !== g) : [...gs, g]);

  const save = (status) => {
    Store.add('missions', {
      _id: missionUid(), title: proposal.title, subject, xp: MISSION_XP[diff],
      dueDays: status === 'activa' ? 7 : null, progress: 0, players: 0,
      tone: vis.tone, icon: vis.icon, status, groups: [...groups].sort(), difficulty: diff,
      desc: proposal.desc, intro: proposal.intro || '', tasks: proposal.tasks || [], steps: proposal.steps, isNew: true,
      atlas: atlasMeta || undefined,
    });
    Store.log('Copilot', (status === 'activa' ? 'publicó la misión "' : 'guardó el borrador "') + proposal.title + '"', 'rocket');
    toast(status === 'activa' ? 'Misión publicada para ' + groups.join(', ') : 'Borrador guardado', 'ok');
    onClose();
  };

  const footer = step === 'form'
    ? <>
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn primary" disabled={groups.length === 0} style={groups.length === 0 ? { opacity: 0.5, pointerEvents: 'none' } : {}} onClick={() => generate(0)}>
        <Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Generar con IA
      </button>
    </>
    : step === 'proposal'
      ? <>
        <button className="btn" onClick={() => generate(variant + 1)}><Icon name="refresh" size={15} className="btn-ico" />Regenerar</button>
        <button className="btn" onClick={() => save('borrador')}>Guardar borrador</button>
        <button className="btn primary" onClick={() => save('activa')}><Icon name="send" size={15} className="btn-ico" />Publicar misión</button>
      </>
      : null;

  return (
    <Modal open={open} title="Generar misión con IA" onClose={onClose} width={560} footer={footer}>
      {step === 'form' && (
        <>
          {fromAtlas && (
            <div className="row center gap-8" style={{ background: 'var(--accent-soft)', border: '1px solid color-mix(in oklch, var(--accent), var(--border) 55%)', borderRadius: 10, padding: '9px 12px', fontSize: 12.5, color: 'var(--accent-strong)', fontWeight: 600 }}>
              <Icon name="map" size={14} />Contexto de Atlas: {fromAtlas}
            </div>
          )}
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Materia">
              <SelectInput value={subject} onChange={e => setSubject(e.target.value)} options={DB.subjects.map(s => s.name)} />
            </Field>
            <Field label="Dificultad">
              <div className="seg" style={{ height: 40, alignItems: 'center' }}>
                {['Básica', 'Media', 'Avanzada'].map(d => (
                  <button key={d} className={diff === d ? 'active' : ''} onClick={() => setDiff(d)}>{d}</button>
                ))}
              </div>
            </Field>
          </div>
          <Field label={'Grupos (' + groups.length + ' seleccionados)'}>
            <div className="row" style={{ flexWrap: 'wrap', gap: 7 }}>
              {GROUPS.map(g => (
                <button key={g} className={'chip-btn' + (groups.includes(g) ? '' : ' plain')} onClick={() => toggleGroup(g)}>{g}</button>
              ))}
            </div>
          </Field>
          <Field label="Tema u objetivo (opcional)">
            <TextArea rows={2} placeholder="Ej. reforzar fracciones equivalentes antes del examen…" value={topic} onChange={e => setTopic(e.target.value)} style={{ height: 'auto', padding: '10px 13px', resize: 'none' }} />
          </Field>
          <div className="row center gap-8 faint" style={{ fontSize: 12.5 }}>
            <Icon name="spark" size={14} fill="currentColor" style={{ color: 'var(--accent)' }} />
            La IA usará el avance reciente de los grupos para calibrar el reto.
          </div>
        </>
      )}

      {step === 'thinking' && (
        <div className="col center gap-12" style={{ padding: '28px 0', textAlign: 'center' }}>
          <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name="spark" size={20} fill="currentColor" /></div>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>Diseñando la misión…</div>
          <div className="faint" style={{ fontSize: 12.5 }}>Analizando el avance de {groups.join(', ')} en {subject}</div>
          <div className="typing" style={{ marginTop: 4 }}><span></span><span></span><span></span></div>
        </div>
      )}

      {step === 'proposal' && (
        <>
          <div className="row center gap-8 faint" style={{ fontSize: 12 }}>
            <Icon name="spark" size={13} fill="currentColor" style={{ color: 'var(--accent)' }} />
            Propuesta para {groups.join(', ')} · calibrada con el avance del grupo
          </div>
          <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="row between center">
              <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={vis.icon} size={20} /></div>
              <div className="row center gap-6">
                <Badge tone="gray">{diff}</Badge>
                <Badge tone="amber"><Icon name="zap" size={12} fill="currentColor" />{MISSION_XP[diff]} XP</Badge>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{proposal.title}</div>
              <div className="faint" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.55 }}>{proposal.desc}</div>
            </div>
            {proposal.intro && (
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>{proposal.intro}</div>
            )}
            <div className="col gap-7" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div className="eyebrow" style={{ marginBottom: 2 }}>{(proposal.tasks && proposal.tasks.length) ? proposal.tasks.length + ' actividades a resolver' : 'Pasos'}</div>
              {(proposal.tasks && proposal.tasks.length ? proposal.tasks.map(t => t.q) : proposal.steps).map((s, i) => (
                <div key={i} className="row gap-9" style={{ fontSize: 13, alignItems: 'flex-start' }}>
                  <span style={{ width: 20, height: 20, borderRadius: 999, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <div className="row center gap-6 faint" style={{ fontSize: 12 }}>
              <Icon name={proposal.ia ? 'spark' : 'calendar'} size={13} fill={proposal.ia ? 'currentColor' : 'none'} />{proposal.ia ? 'Contenido generado con IA · resoluble por el alumno' : 'Duración sugerida: 7 días'}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ============================================================
   Drawer: detalle de misión
   ============================================================ */
const MISSION_ROSTER = ['Camila Torres', 'Diego Hernández', 'Isabella Núñez', 'Emiliano Vega', 'Mateo Jiménez', 'Valentina Cruz', 'Santiago Morales', 'Regina Paredes'];

/* Estadísticas reales de una misión a partir de las entregas de los alumnos */
function missionStats(m) {
  let roster = [];
  try { roster = (window.ctaStudents ? window.ctaStudents() : []).filter(s => (m.groups || []).includes(s.group)); }
  catch (e) { roster = []; }
  const subs = (window.DB.missionSubmissions || []).filter(x => x.missionId === m._id);
  const names = new Set(roster.map(s => s.name));
  subs.forEach(s => names.add(s.student));
  const total = Math.max(names.size, subs.length);
  const entregados = subs.length;
  const progress = total ? Math.round(entregados / total * 100) : 0;
  const graded = subs.filter(s => s.grade != null);
  const avgGrade = graded.length ? Math.round(graded.reduce((a, s) => a + s.grade, 0) / graded.length * 10) / 10 : null;
  return { total, entregados, progress, avgGrade, subs, roster };
}

function MissionDrawer({ missionId, onClose, onAction }) {
  useStore();
  const m = (DB.missions || []).find(x => x._id === missionId);
  const open = !!m;
  const [editGrade, setEditGrade] = React.useState(null); // sub._id en edición
  const [gradeVal, setGradeVal] = React.useState('');
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  const saveGrade = (sub) => {
    const v = parseFloat(String(gradeVal).replace(',', '.'));
    if (isNaN(v) || v < 0 || v > 10) { toast('Ingresa una calificación entre 0 y 10', 'warn'); return; }
    const g = Math.round(v * 10) / 10;
    Store.update('missionSubmissions', sub._id, { grade: g, status: 'calificada', califManual: true });
    Store.log('Docente', 'calificó a ' + (sub.student.split(' ')[0]) + ' con ' + g.toFixed(1) + ' en "' + sub.missionTitle + '"', 'award');
    setEditGrade(null);
    toast('Calificación guardada ✓', 'ok');
  };

  let body = null;
  if (m) {
    const t = window.TONE[m.tone];
    const st = MISSION_STATUS[m.status];
    const offsets = [24, 17, 9, 3, -4, -11, -19, -28];
    const realRoster = (() => {
      try { return (window.ctaStudents ? window.ctaStudents() : []).filter(s => (m.groups || []).includes(s.group)); }
      catch (e) { return []; }
    })();
    const cap = m.players != null ? Math.min(m.players, realRoster.length) : realRoster.length;
    const subs = (DB.missionSubmissions || []).filter(x => x.missionId === m._id);
    const subMap = new Map(); subs.forEach(s => subMap.set(s.student, s));
    let baseRoster = realRoster.slice(0, cap).map(s => ({ name: s.name, group: s.group }));
    subs.forEach(s => { if (!baseRoster.find(r => r.name === s.student)) baseRoster.push({ name: s.student, group: s.group }); });
    const roster = baseRoster.map(r => ({ ...r, sub: subMap.get(r.name) }))
      .sort((a, b) => (b.sub ? 1 : 0) - (a.sub ? 1 : 0));
    const entregasN = subs.length;
    const stepsDone = Math.round((m.steps || []).length * m.progress / 100);

    body = (
      <>
        <div className="row center between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="row center gap-12">
            <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={m.icon} size={19} /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15.5, fontFamily: 'var(--font-display)' }}>{m.title}</div>
              <div className="faint" style={{ fontSize: 12 }}>{m.subject} · {missionDueLabel(m)}</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="row center" style={{ gap: 7, flexWrap: 'wrap' }}>
            <Badge tone={st.tone} dot>{st.label}</Badge>
            <Badge tone="amber"><Icon name="zap" size={12} fill="currentColor" />{m.xp} XP</Badge>
            <Badge tone="gray">{m.difficulty}</Badge>
            {m.groups.map(g => <Badge key={g} tone="gray">{g}</Badge>)}
          </div>

          <p className="faint" style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{m.desc}</p>

          <div>
            <div className="row between center" style={{ marginBottom: 7, fontSize: 12.5 }}>
              <span className="faint">Entregas del grupo</span>
              <span className="tnum" style={{ fontWeight: 700 }}>{entregasN}/{roster.length}{(() => { const g = subs.filter(s => s.grade != null); return g.length ? ' · prom ' + (Math.round(g.reduce((a, s) => a + s.grade, 0) / g.length * 10) / 10).toFixed(1) : ''; })()}</span>
            </div>
            <Bar value={roster.length ? Math.round(entregasN / roster.length * 100) : 0} color={t.c} height={9} />
            <div className="row between center faint" style={{ fontSize: 12, marginTop: 7 }}>
              <span className="row center gap-5"><Icon name="users" size={13} />{entregasN} {entregasN === 1 ? 'entrega recibida' : 'entregas recibidas'}</span>
              <span>{subs.filter(s => s.grade != null).length} calificadas</span>
            </div>
          </div>

          {Array.isArray(m.tasks) && m.tasks.length > 0 ? (
            <div>
              {m.intro && <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>{m.intro}</p>}
              <div className="card-title" style={{ marginBottom: 10 }}><Icon name="flag" className="ico" size={16} />Actividades a resolver ({m.tasks.length})</div>
              <div className="col gap-10">
                {m.tasks.map((task, i) => (
                  <div key={i} style={{ padding: '11px 13px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: task.type === 'choice' ? 8 : 0 }}>{i + 1}. {task.q}</div>
                    {task.type === 'choice' && (
                      <div className="col gap-5">
                        {task.options.map((opt, oi) => (
                          <div key={oi} className="row center gap-8" style={{ fontSize: 12.5, color: task.answer === oi ? 'var(--green)' : 'var(--text-muted)', fontWeight: task.answer === oi ? 600 : 400 }}>
                            <span style={{ width: 15, height: 15, borderRadius: 999, flexShrink: 0, border: '1.5px solid ' + (task.answer === oi ? 'var(--green)' : 'var(--border-strong)'), display: 'grid', placeItems: 'center' }}>{task.answer === oi && <Icon name="check" size={10} />}</span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                    {task.type === 'open' && <div className="faint" style={{ fontSize: 12 }}>Respuesta abierta</div>}
                    {task.hint && <div className="faint" style={{ fontSize: 11.5, marginTop: 6 }}><b>Pista:</b> {task.hint}</div>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="card-title" style={{ marginBottom: 10 }}><Icon name="flag" className="ico" size={16} />Retos de la misión</div>
              <div className="col gap-8">
                {(m.steps || []).map((s, i) => {
                  const done = i < stepsDone;
                  return (
                    <div key={i} className="row center gap-10" style={{ fontSize: 13, padding: '9px 12px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <span style={{ width: 21, height: 21, borderRadius: 999, flexShrink: 0, display: 'grid', placeItems: 'center', background: done ? t.bg : 'var(--surface)', color: done ? t.c : 'var(--text-faint)', border: done ? 'none' : '1px solid var(--border)', fontSize: 11, fontWeight: 700 }}>
                        {done ? <Icon name="check" size={12} stroke={3} /> : i + 1}
                      </span>
                      <span style={{ color: done ? 'var(--text)' : 'var(--text-muted)' }}>{s}</span>
                    </div>
                  );
                })}
              </div>
              <div className="row center gap-7" style={{ marginTop: 10, padding: '9px 12px', borderRadius: 10, background: 'var(--amber-soft)', border: '1px dashed var(--amber)', fontSize: 12, color: 'var(--amber)' }}>
                <Icon name="alert" size={14} />Esta misión aún no tiene actividades resolubles. Usa “Editar contenido” para agregarlas.
              </div>
            </div>
          )}

          {m.status !== 'borrador' && roster.length > 0 && (
            <div>
              <div className="row between center" style={{ marginBottom: 8 }}>
                <div className="card-title" style={{ marginBottom: 0 }}><Icon name="award" className="ico" size={16} />Entregas y calificaciones</div>
                <Badge tone={entregasN ? 'green' : 'gray'}>{entregasN}/{roster.length} entregadas</Badge>
              </div>
              <div>
                {roster.map((s, i) => {
                  const sub = s.sub;
                  const calif = sub && sub.grade != null ? sub.grade.toFixed(1) : null;
                  const ctone = calif == null ? 'gray' : (parseFloat(calif) >= 9 ? 'green' : parseFloat(calif) >= 7 ? 'blue' : parseFloat(calif) >= 6 ? 'amber' : 'red');
                  return (
                    <div key={s.name} className="row center gap-10" style={{ padding: '9px 0', borderBottom: i < roster.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <Avatar name={s.name} size={30} />
                      <div className="grow" style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{s.name} <span className="faint" style={{ fontWeight: 400 }}>· {s.group}</span></div>
                        <div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>
                          {sub
                            ? <span className="row center gap-5"><Icon name="checkCircle" size={12} style={{ color: 'var(--green)' }} />Entregada · {sub.fecha}{sub.totalChoice ? ' · ' + sub.aciertos + '/' + sub.totalChoice + ' aciertos' : ''}</span>
                            : <span className="row center gap-5"><Icon name="clock" size={12} />Sin entregar</span>}
                        </div>
                      </div>
                      {sub
                        ? (editGrade === sub._id
                            ? <span className="row center gap-5">
                                <input className="inp" type="number" min="0" max="10" step="0.1" autoFocus value={gradeVal}
                                  onChange={e => setGradeVal(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') saveGrade(sub); if (e.key === 'Escape') setEditGrade(null); }}
                                  style={{ width: 56, height: 30, padding: '4px 6px', textAlign: 'center', fontSize: 13 }} />
                                <button className="icon-btn" title="Guardar" onClick={() => saveGrade(sub)}><Icon name="check" size={15} style={{ color: 'var(--green)' }} /></button>
                              </span>
                            : <button type="button" title="Asignar calificación"
                                onClick={() => { setEditGrade(sub._id); setGradeVal(sub.grade != null ? String(sub.grade) : ''); }}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                                {calif != null
                                  ? <Badge tone={ctone}>{calif} <Icon name="edit" size={10} /></Badge>
                                  : <Badge tone="violet">Calificar <Icon name="edit" size={10} /></Badge>}
                              </button>)
                        : <span className="tnum faint" style={{ fontSize: 12, width: 34, textAlign: 'right' }}>—</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="row" style={{ gap: 8, padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
          <button className="btn grow" onClick={() => onAction('editar', m)}><Icon name="edit" size={15} className="btn-ico" />Editar contenido</button>
          {m.status !== 'finalizada' && (m.status === 'borrador'
            ? <button className="btn primary grow" onClick={() => onAction('publicar', m)}><Icon name="send" size={15} className="btn-ico" />Publicar</button>
            : <button className="btn grow" onClick={() => onAction(m.status === 'pausada' ? 'reanudar' : 'pausar', m)}>
                <Icon name={m.status === 'pausada' ? 'play' : 'clock'} size={15} className="btn-ico" />{m.status === 'pausada' ? 'Reanudar' : 'Pausar'}
              </button>)}
        </div>
      </>
    );
  }

  return (
    <>
      <div className={'drawer-scrim' + (open ? ' open' : '')} onClick={onClose} />
      <aside className={'drawer' + (open ? ' open' : '')} style={{ width: 470 }} aria-hidden={!open}>{body}</aside>
    </>
  );
}

/* ============================================================
   Editor de contenido de la misión (docente)
   ============================================================ */
function MissionEditor({ missionId, onClose }) {
  const m = (DB.missions || []).find(x => x._id === missionId);
  const open = !!m;
  const [title, setTitle] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [intro, setIntro] = React.useState('');
  const [tasks, setTasks] = React.useState([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!m) return;
    setTitle(m.title || ''); setDesc(m.desc || ''); setIntro(m.intro || '');
    setTasks((m.tasks && m.tasks.length ? m.tasks : (m.steps || []).map(s => ({ q: s, type: 'open', options: [], answer: null, hint: '' }))).map(t => ({ ...t, options: [...(t.options || [])] })));
  }, [missionId]);

  if (!open) return null;

  const upd = (i, patch) => setTasks(ts => ts.map((t, j) => j === i ? { ...t, ...patch } : t));
  const updOpt = (i, oi, v) => setTasks(ts => ts.map((t, j) => j === i ? { ...t, options: t.options.map((o, k) => k === oi ? v : o) } : t));
  const addOpt = (i) => setTasks(ts => ts.map((t, j) => j === i ? { ...t, options: [...t.options, ''] } : t));
  const delOpt = (i, oi) => setTasks(ts => ts.map((t, j) => j === i ? { ...t, options: t.options.filter((_, k) => k !== oi), answer: t.answer === oi ? null : t.answer } : t));
  const addTask = () => setTasks(ts => [...ts, { q: '', type: 'choice', options: ['', ''], answer: null, hint: '' }]);
  const delTask = (i) => setTasks(ts => ts.filter((_, j) => j !== i));

  async function regen() {
    if (busy) return;
    setBusy(true);
    const nivel = missionNivelOf((m.groups || [])[0]);
    const prop = await missionGenAI(m.subject, nivel, m.difficulty || 'Media', desc || title);
    if (prop) { if (!intro) setIntro(prop.intro || ''); setTasks((prop.tasks || []).map(t => ({ ...t, options: [...(t.options || [])] }))); }
    setBusy(false);
  }

  function save() {
    if (!title.trim()) { toast('Escribe el título', 'warn'); return; }
    const clean = tasks.map(t => ({
      q: (t.q || '').trim(),
      type: t.type === 'choice' && (t.options || []).filter(o => String(o).trim()).length >= 2 ? 'choice' : 'open',
      options: t.type === 'choice' ? (t.options || []).map(o => String(o).trim()).filter(Boolean) : [],
      answer: t.type === 'choice' && t.answer != null ? t.answer : null,
      hint: (t.hint || '').trim(),
    })).filter(t => t.q);
    Store.update('missions', m._id, { title: title.trim(), desc: desc.trim(), intro: intro.trim(), tasks: clean, steps: clean.map(t => t.q) });
    Store.log('Docente', 'editó el contenido de la misión "' + title.trim() + '"', 'edit');
    toast('Misión actualizada ✓', 'ok');
    onClose();
  }

  return (
    <Modal open={open} title="Editar contenido de la misión" onClose={onClose} width={620}
      footer={<>
        <button className="btn" disabled={busy} onClick={regen}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />{busy ? 'Generando…' : (tasks.length ? 'Regenerar con IA' : 'Generar con IA')}</button>
        <span className="grow" />
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar</button>
      </>}>
      <Field label="Título"><TextInput value={title} onChange={e => setTitle(e.target.value)} /></Field>
      <Field label="Descripción"><TextInput value={desc} onChange={e => setDesc(e.target.value)} /></Field>
      <Field label="Introducción (explicación para el alumno)"><TextArea rows={3} value={intro} onChange={e => setIntro(e.target.value)} style={{ height: 'auto', padding: '10px 13px', resize: 'vertical' }} /></Field>

      <div className="row between center" style={{ margin: '6px 0 8px' }}>
        <div className="eyebrow" style={{ margin: 0 }}>Actividades ({tasks.length})</div>
        <button className="btn sm" onClick={addTask}><Icon name="plus" size={13} className="btn-ico" />Agregar actividad</button>
      </div>

      <div className="col gap-12">
        {tasks.map((task, i) => (
          <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '12px 13px' }}>
            <div className="row between center" style={{ marginBottom: 8 }}>
              <span className="faint" style={{ fontSize: 12, fontWeight: 600 }}>Actividad {i + 1}</span>
              <div className="row center gap-6">
                <div className="seg" style={{ height: 30 }}>
                  <button className={task.type === 'choice' ? 'active' : ''} onClick={() => upd(i, { type: 'choice', options: task.options.length ? task.options : ['', ''] })} style={{ fontSize: 11.5 }}>Opción múltiple</button>
                  <button className={task.type === 'open' ? 'active' : ''} onClick={() => upd(i, { type: 'open' })} style={{ fontSize: 11.5 }}>Respuesta abierta</button>
                </div>
                <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => delTask(i)} title="Eliminar"><Icon name="trash" size={14} /></button>
              </div>
            </div>
            <TextArea rows={2} value={task.q} placeholder="Escribe la pregunta…" onChange={e => upd(i, { q: e.target.value })} style={{ height: 'auto', padding: '8px 11px', resize: 'vertical', marginBottom: task.type === 'choice' ? 8 : 6 }} />
            {task.type === 'choice' && (
              <div className="col gap-6" style={{ marginBottom: 6 }}>
                {task.options.map((opt, oi) => (
                  <div key={oi} className="row center gap-8">
                    <button onClick={() => upd(i, { answer: oi })} title="Marcar como correcta"
                      style={{ width: 20, height: 20, borderRadius: 999, flexShrink: 0, cursor: 'pointer', border: '1.5px solid ' + (task.answer === oi ? 'var(--green)' : 'var(--border-strong)'), background: task.answer === oi ? 'var(--green)' : 'transparent', color: '#fff', display: 'grid', placeItems: 'center' }}>{task.answer === oi && <Icon name="check" size={12} />}</button>
                    <TextInput value={opt} placeholder={'Opción ' + (oi + 1)} onChange={e => updOpt(i, oi, e.target.value)} />
                    <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => delOpt(i, oi)}><Icon name="x" size={14} /></button>
                  </div>
                ))}
                <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => addOpt(i)}><Icon name="plus" size={12} className="btn-ico" />Opción</button>
                <span className="faint" style={{ fontSize: 11 }}>Marca el círculo de la respuesta correcta.</span>
              </div>
            )}
            <TextInput value={task.hint || ''} placeholder="Pista (opcional)" onChange={e => upd(i, { hint: e.target.value })} />
          </div>
        ))}
        {!tasks.length && <div className="faint" style={{ fontSize: 12.5, padding: '14px 0', textAlign: 'center' }}>Sin actividades. Agrega una o genera con IA.</div>}
      </div>
    </Modal>
  );
}

/* ============================================================
   Vista principal: AI Missions
   ============================================================ */
function AIMissions({ go, openCopilot }) {
  useStore();
  const [tab, setTab] = React.useState('todas');
  const [subj, setSubj] = React.useState('todas');
  const [wizardOpen, setWizardOpen] = React.useState(!!window.MISSION_PREFILL);
  const [detailId, setDetailId] = React.useState(null);
  const [editId, setEditId] = React.useState(null);

  const all = (DB.missions || []).filter(m =>
    !window.docScope || !window.docScope() || (m.groups || []).some(g => window.docAllowsGroup(g)));
  const counts = {
    todas: all.length,
    activas: all.filter(m => m.status === 'activa' || m.status === 'pausada').length,
    borradores: all.filter(m => m.status === 'borrador').length,
    finalizadas: all.filter(m => m.status === 'finalizada').length,
  };
  /* Indicadores derivados de las misiones reales */
  const misPlayers = all.reduce((a, m) => a + (m.players || 0), 0);
  const misXP = all.reduce((a, m) => a + ((m.xp || 0) * (m.players || 0)), 0);
  const misActivas = all.filter(m => m.status === 'activa');
  const misPart = misActivas.length ? Math.round(misActivas.reduce((a, m) => a + (m.progress || 0), 0) / misActivas.length) : 0;
  const TABS = [['todas', 'Todas'], ['activas', 'Activas'], ['borradores', 'Borradores'], ['finalizadas', 'Finalizadas']];
  const STATUS_ORDER = { activa: 0, pausada: 1, borrador: 2, finalizada: 3 };

  const visible = all
    .filter(m => tab === 'todas'
      || (tab === 'activas' && (m.status === 'activa' || m.status === 'pausada'))
      || (tab === 'borradores' && m.status === 'borrador')
      || (tab === 'finalizadas' && m.status === 'finalizada'))
    .filter(m => subj === 'todas' || m.subject === subj)
    .sort((a, b) => (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || ((a.dueDays ?? 999) - (b.dueDays ?? 999)));

  const act = (action, m) => {
    if (action === 'pausar') { Store.update('missions', m._id, { status: 'pausada' }); toast('Misión pausada', 'info'); }
    if (action === 'reanudar') { Store.update('missions', m._id, { status: 'activa' }); toast('Misión reanudada', 'ok'); }
    if (action === 'extender') { Store.update('missions', m._id, { dueDays: (m.dueDays ?? 0) + 7 }); toast('Plazo extendido 7 días', 'ok'); }
    if (action === 'publicar') { Store.update('missions', m._id, { status: 'activa', dueDays: 7, isNew: false }); toast('Misión publicada', 'ok'); }
    if (action === 'duplicar') {
      Store.add('missions', { ...m, _id: missionUid(), title: m.title + ' (copia)', status: 'borrador', progress: 0, players: 0, dueDays: null, isNew: true });
      toast('Copia creada como borrador', 'ok');
    }
    if (action === 'archivar') { Store.remove('missions', m._id); if (detailId === m._id) setDetailId(null); toast('Misión archivada', 'info'); }
    if (action === 'editar') { setEditId(m._id); }
  };

  const menuFor = (m) => {
    const items = [];
    items.push({ icon: 'edit', label: 'Editar contenido', onClick: () => act('editar', m) });
    if (m.status === 'borrador') items.push({ icon: 'send', label: 'Publicar', onClick: () => act('publicar', m) });
    if (m.status === 'activa') items.push({ icon: 'clock', label: 'Pausar', onClick: () => act('pausar', m) });
    if (m.status === 'pausada') items.push({ icon: 'play', label: 'Reanudar', onClick: () => act('reanudar', m) });
    if (m.status === 'activa' || m.status === 'pausada') items.push({ icon: 'calendar', label: 'Extender plazo +7 días', onClick: () => act('extender', m) });
    items.push({ icon: 'clipboard', label: 'Duplicar', onClick: () => act('duplicar', m) });
    items.push({ icon: 'trash', label: 'Archivar', danger: true, onClick: () => act('archivar', m) });
    return items;
  };

  return (
    <div className="content-inner">
      <PageHead eyebrow="Principal · Gamificación" title="AI Missions" desc="Retos de aprendizaje generados por IA y adaptados a cada grupo.">
        <button className="btn primary" onClick={() => setWizardOpen(true)}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Generar misión</button>
      </PageHead>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Misiones activas', value: String(counts.activas), icon: 'rocket', tone: 'violet' },
          { label: 'Participación', value: misPart + '%', icon: 'users', tone: 'blue' },
          { label: 'XP otorgado', value: misXP ? fmtShort(misXP) : '0', icon: 'zap', tone: 'amber' },
          { label: 'Misiones completadas', value: String(counts.finalizadas), icon: 'checkCircle', tone: 'green' },
        ].map((k, i) => {
          const t = window.TONE[k.tone];
          return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum">{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="row between center mt-16" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="seg">
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {label} <span style={{ opacity: 0.55, fontWeight: 500 }}>{counts[id]}</span>
            </button>
          ))}
        </div>
        <select className="inp" style={{ width: 190, height: 36 }} value={subj} onChange={e => setSubj(e.target.value)}>
          <option value="todas">Todas las materias</option>
          {DB.subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {visible.map((m) => {
          const t = window.TONE[m.tone];
          const st = MISSION_STATUS[m.status];
          const urgent = m.status === 'activa' && m.dueDays != null && m.dueDays <= 1;
          const dim = m.status === 'pausada' || m.status === 'finalizada';
          const stats = missionStats(m);
          return (
            <div className="card pad" key={m._id} style={{ display: 'flex', flexDirection: 'column', gap: 14, opacity: dim ? 0.78 : 1 }}>
              <div className="row between center">
                <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={m.icon} size={20} /></div>
                <div className="row center gap-6">
                  {m.isNew && <Badge tone="violet">Nueva</Badge>}
                  {m.status !== 'activa' && <Badge tone={st.tone} dot>{st.label}</Badge>}
                  {urgent && <Badge tone="red"><Icon name="clock" size={12} />{m.dueDays === 0 ? 'Vence hoy' : 'Vence mañana'}</Badge>}
                  <Badge tone="amber"><Icon name="zap" size={12} fill="currentColor" />{m.xp} XP</Badge>
                  <RowMenu items={menuFor(m)} />
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{m.title}</div>
                <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>
                  {m.subject} · {m.groups.join(', ')}{m.status === 'activa' && !urgent ? ' · ' + missionDueLabel(m).toLowerCase() : ''}
                </div>
              </div>
              {m.status === 'borrador'
                ? <div className="row center gap-8 faint" style={{ fontSize: 12.5, padding: '10px 12px', borderRadius: 10, background: 'var(--surface-2)', border: '1px dashed var(--border)' }}>
                  <Icon name="edit" size={14} />Listo para revisar y publicar
                </div>
                : <div>
                  <div className="row between center" style={{ marginBottom: 6, fontSize: 12 }}>
                    <span className="faint">Entregas del grupo</span>
                    <span className="tnum" style={{ fontWeight: 600 }}>{stats.entregados}/{stats.total}{stats.avgGrade != null ? ' · prom ' + stats.avgGrade.toFixed(1) : ''}</span>
                  </div>
                  <Bar value={stats.progress} color={t.c} height={8} />
                </div>}
              <div className="row between center" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span className="row center gap-6 faint" style={{ fontSize: 12 }}>
                  <Icon name="users" size={14} />{m.status === 'borrador' ? m.groups.join(' · ') : stats.entregados + (stats.entregados === 1 ? ' entrega' : ' entregas')}
                </span>
                <button className="btn sm" onClick={() => setDetailId(m._id)}>
                  {m.status === 'finalizada' ? 'Ver resultados' : m.status === 'borrador' ? 'Revisar' : 'Ver detalle'}<Icon name="chevR" size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="card pad mt-16 col center gap-10" style={{ padding: '42px 20px', textAlign: 'center' }}>
          <div className="kpi-ico" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)', marginBottom: 0 }}><Icon name="rocket" size={20} /></div>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>Sin misiones con estos filtros</div>
          <div className="faint" style={{ fontSize: 13 }}>Cambia el filtro o genera una nueva misión con IA.</div>
          <button className="btn primary" style={{ marginTop: 4 }} onClick={() => setWizardOpen(true)}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Generar misión</button>
        </div>
      )}

      <MissionWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      <MissionDrawer missionId={detailId} onClose={() => setDetailId(null)} onAction={act} />
      <MissionEditor missionId={editId} onClose={() => setEditId(null)} />
    </div>
  );
}

Object.assign(window, { AIMissions, MissionWizard, MissionDrawer, MissionEditor });
