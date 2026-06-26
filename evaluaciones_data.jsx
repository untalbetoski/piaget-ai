/* ============================================================
   evaluaciones_data.jsx — Modelo de datos y helpers de Evaluaciones
   ------------------------------------------------------------
   Provee TODO lo que consume views_evaluaciones.jsx, enlazado al
   padrón REAL de grupos (CLASES_SEED / DB.clases) y al roster
   determinista (alumnosDeClase). Sin esto, el módulo mostraba
   información inexistente (grupos/alumnos/estadísticas inventadas).

   Debe cargarse DESPUÉS de seed_clases.jsx y store.js, y ANTES de
   views_evaluaciones.jsx.
   ============================================================ */
(function () {

  /* ---------------- catálogos ---------------- */
  const EV_TYPES = {
    examen:      { id: 'examen',      label: 'Examen',      icon: 'clipboard', tone: 'blue' },
    quiz:        { id: 'quiz',        label: 'Quiz',        icon: 'edit',      tone: 'cyan' },
    proyecto:    { id: 'proyecto',    label: 'Proyecto',    icon: 'bookOpen',  tone: 'violet' },
    tarea:       { id: 'tarea',       label: 'Tarea',       icon: 'check',     tone: 'green' },
    observacion: { id: 'observacion', label: 'Observación', icon: 'eye',       tone: 'amber' },
  };

  /* [tono, etiqueta] por estatus */
  const EV_STATUS = {
    programada: ['blue',   'Programada'],
    abierta:    ['amber',  'Abierta'],
    calificar:  ['violet', 'Por calificar'],
    cerrada:    ['green',  'Cerrada'],
  };

  /* materias / campos formativos por nivel (mismo vocabulario que Calificaciones) */
  const EV_MATERIAS = {
    Preescolar: ['Lenguajes', 'Saberes y pensamiento científico', 'Ética, naturaleza y sociedades', 'De lo humano y lo comunitario'],
    Primaria:   ['Matemáticas', 'Lengua Materna', 'Ciencias Naturales', 'Historia', 'Geografía', 'Formación C. y É.', 'Inglés', 'Ed. Física'],
    Secundaria: ['Matemáticas', 'Español', 'Ciencias', 'Historia', 'Geografía', 'Formación C. y É.', 'Inglés', 'Tecnología'],
  };

  /* escala cualitativa de preescolar (SEP) */
  const EV_QUAL = [
    { id: 'RA', label: 'Requiere apoyo',  score: 1, color: 'var(--red)' },
    { id: 'ED', label: 'En desarrollo',   score: 2, color: 'var(--amber)' },
    { id: 'NE', label: 'Nivel esperado',  score: 3, color: 'var(--text)' },
    { id: 'SD', label: 'Sobresaliente',   score: 4, color: 'var(--green)' },
  ];
  const evQual = (id) => EV_QUAL.find(q => q.id === id) || null;

  /* niveles de desempeño para rúbricas (pct del rango de calificación) */
  const EV_RUBRIC_LEVELS = [
    { id: 1, label: 'Insuficiente', color: 'var(--red)',    pct: 0.55 },
    { id: 2, label: 'En proceso',   color: 'var(--amber)',  pct: 0.75 },
    { id: 3, label: 'Adecuado',     color: 'var(--accent)', pct: 0.90 },
    { id: 4, label: 'Destacado',    color: 'var(--green)',  pct: 1.00 },
  ];

  /* ---------------- helpers de nivel / grupo ---------------- */
  function evNivel(group) {
    const g = String(group || '');
    if (/sec/i.test(g)) return 'Secundaria';
    if (/^\s*k/i.test(g)) return 'Preescolar';
    return 'Primaria';
  }
  function evMinG(nivel) { return 6; }                 // escala 6–10 (numérica)
  function evType(e) { return EV_TYPES[e && e.type] || EV_TYPES.examen; }

  function evClases() { return window.docClases((window.DB && DB.clases && DB.clases.length) ? DB.clases : (window.CLASES_SEED || [])); }
  function evGruposDe(nivel) { return evClases().filter(c => c.nivel === nivel).map(c => c.g); }
  function evClaseOf(e) { const g = e && e.group; return evClases().find(c => c.g === g) || null; }

  /* roster real: alumnos manuales + padrón determinista, igual que Calificaciones */
  function evRoster(clase) {
    if (!clase) return [];
    const real = ((window.DB && DB.students) || []).filter(s => s.grade === clase.g).map(s => s.name);
    const gen = window.alumnosDeClase ? alumnosDeClase(clase).map(a => a.name) : [];
    const names = [];
    [...real, ...gen].forEach(n => { if (!names.includes(n)) names.push(n); });
    return names.slice(0, clase.alumnos || names.length).sort((a, b) => a.localeCompare(b));
  }

  /* ---------------- hash determinista ---------------- */
  function evHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991; return h; }

  /* ---------------- persistencia (localStorage) ---------------- */
  const FRESH = !!window.PIAGET_FRESH;
  const K_SCORES  = FRESH ? 'piaget_ev_scores_fresh_v1'  : 'piaget_ev_scores_v1';
  const K_PICKS   = FRESH ? 'piaget_ev_picks_fresh_v1'   : 'piaget_ev_picks_v1';
  const K_RUBRICS = FRESH ? 'piaget_ev_rubrics_fresh_v1' : 'piaget_ev_rubrics_v1';
  const K_QS      = FRESH ? 'piaget_ev_qs_fresh_v1'      : 'piaget_ev_qs_v1';
  function _load(k) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); if (v && typeof v === 'object') return v; } catch (e) { } return {}; }
  function _save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  const evLoadScores = () => _load(K_SCORES);
  const evSaveScores = (v) => _save(K_SCORES, v);
  const evLoadPicks = () => _load(K_PICKS);
  const evSavePicks = (v) => _save(K_PICKS, v);
  const evLoadRubrics = () => _load(K_RUBRICS);
  const evSaveRubrics = (v) => _save(K_RUBRICS, v);
  const evLoadQuestions = () => _load(K_QS);
  const evSaveQuestions = (v) => _save(K_QS, v);
  const evCellKey = (evId, name) => evId + '|' + name;

  /* ---------------- valor base (seed) por alumno ---------------- */
  /* fracción de alumnos ya CALIFICADOS según el estatus de la evaluación */
  const GRADED_RATIO = { programada: 0, abierta: 0.5, calificar: 0, cerrada: 1 };

  function evSeedScore(e, name, qual, minG) {
    if (FRESH) return null;
    const ratio = GRADED_RATIO[e.status] != null ? GRADED_RATIO[e.status] : 0;
    if (ratio <= 0) return null;
    const h = evHash(e._id + '|' + name);
    if ((h % 1000) / 1000 >= ratio) return null;       // aún sin calificar
    if (qual) {
      const d = h % 10;
      return d === 0 ? 'RA' : d <= 3 ? 'ED' : d <= 7 ? 'NE' : 'SD';
    }
    const clase = evClaseOf(e);
    const base = (clase && clase.avg != null) ? clase.avg : 8.0;
    let v = base + ((h % 21) - 9) / 10;                 // ±0.9 de jitter
    v = Math.max(minG, Math.min(10, Math.round(v * 2) / 2));
    return v;
  }

  /* ---------------- rúbricas ---------------- */
  function evDefaultRubric(e) {
    const ty = evType(e).id;
    if (ty === 'proyecto') {
      return { criteria: [
        { name: 'Contenido y dominio', weight: 40 },
        { name: 'Organización', weight: 25 },
        { name: 'Presentación', weight: 20 },
        { name: 'Trabajo colaborativo', weight: 15 },
      ] };
    }
    return { criteria: [
      { name: 'Dominio de conceptos', weight: 40 },
      { name: 'Procedimiento', weight: 35 },
      { name: 'Claridad', weight: 25 },
    ] };
  }
  /* calcula la calificación final a partir de los niveles elegidos */
  function evRubricScore(rubric, picks, minG) {
    if (!rubric || !rubric.criteria || !rubric.criteria.length) return null;
    let wsum = 0, acc = 0;
    for (let i = 0; i < rubric.criteria.length; i++) {
      const lvl = picks && picks[i];
      if (!lvl) return null;                            // incompleto
      const lv = EV_RUBRIC_LEVELS.find(l => l.id === lvl);
      if (!lv) return null;
      const w = Number(rubric.criteria[i].weight) || 0;
      wsum += w; acc += w * lv.pct;
    }
    if (wsum <= 0) return null;
    const pct = acc / wsum;
    return Math.round((minG + pct * (10 - minG)) * 10) / 10;
  }

  /* ---------------- estadísticas ---------------- */
  function evStats(e, roster, scores, qual, minG) {
    const total = roster.length;
    const perStudent = [];
    let graded = 0, sumNum = 0;
    const dist = qual
      ? { RA: 0, ED: 0, NE: 0, SD: 0 }
      : { riesgo: 0, suf: 0, bueno: 0, exc: 0 };
    let esperado = 0, aprob = 0;
    const low = [];

    roster.forEach(name => {
      const k = evCellKey(e._id, name);
      let sc = (scores && k in scores) ? scores[k] : evSeedScore(e, name, qual, minG);
      if (sc == null || sc === '') return;
      graded++;
      if (qual) {
        const q = evQual(sc); const num = q ? q.score : null;
        if (num == null) { graded--; return; }
        dist[sc] = (dist[sc] || 0) + 1;
        if (sc === 'NE' || sc === 'SD') esperado++;
        perStudent.push({ name, score: sc, num });
        if (sc === 'RA') low.push({ name, score: sc, num });
      } else {
        const num = Number(sc);
        if (isNaN(num)) { graded--; return; }
        sumNum += num;
        if (num < 7) dist.riesgo++;
        else if (num < 8) dist.suf++;
        else if (num < 9) dist.bueno++;
        else dist.exc++;
        if (num >= 6) aprob++;
        perStudent.push({ name, score: num, num });
        if (num < 7) low.push({ name, score: num, num });
      }
    });

    low.sort((a, b) => a.num - b.num);
    return {
      total, graded,
      pct: total ? Math.round(graded / total * 100) : 0,
      avg: (!qual && graded) ? Math.round(sumNum / graded * 100) / 100 : (qual && graded ? 1 : null),
      esperadoPct: graded ? Math.round(esperado / graded * 100) : null,
      aprobPct: graded ? Math.round(aprob / graded * 100) : null,
      dist, low,
      top: perStudent.length > 0,
      perStudent,
    };
  }

  /* ---------------- IA (con fallback determinista) ---------------- */
  async function evClaudeJSON(prompt) {
    if (!(window.claude && window.claude.complete)) return null;
    try {
      const out = await window.claude.complete(prompt);
      const o = out.indexOf('{'), c = out.lastIndexOf('}');
      if (o < 0 || c <= o) return null;
      return JSON.parse(out.slice(o, c + 1));
    } catch (err) { return null; }
  }

  async function evGenerateQuestions(e, n) {
    const nivel = evNivel(e.group);
    const p = 'Eres docente de ' + nivel + '. Redacta ' + n + ' reactivos breves y claros en español para un ' +
      evType(e).label.toLowerCase() + ' de "' + e.subject + '" (grupo ' + e.group + '). ' +
      'Responde ÚNICAMENTE JSON: {"reactivos":["...","..."]}';
    const r = await evClaudeJSON(p);
    if (r && Array.isArray(r.reactivos) && r.reactivos.length) {
      return { items: r.reactivos.slice(0, n).map(String), ia: true };
    }
    const banco = [
      'Explica con tus palabras el concepto principal de ' + e.subject + '.',
      'Resuelve el siguiente problema aplicando lo visto en clase.',
      'Identifica y describe dos ejemplos relacionados con el tema.',
      'Compara dos ideas o procedimientos y señala sus diferencias.',
      'Justifica tu respuesta con un argumento basado en evidencia.',
      'Relaciona el tema con una situación de la vida cotidiana.',
      'Ordena los pasos del procedimiento estudiado.',
      'Define los términos clave de la unidad.',
      'Analiza el caso propuesto y propón una solución.',
      'Elabora una conclusión sobre lo aprendido en esta evaluación.',
    ];
    return { items: banco.slice(0, n), ia: false };
  }

  async function evSuggestRubric(e) {
    const p = 'Diseña una rúbrica para un ' + evType(e).label.toLowerCase() + ' de "' + e.subject +
      '" en ' + evNivel(e.group) + '. 3 a 5 criterios cuyos pesos sumen 100. ' +
      'Responde ÚNICAMENTE JSON: {"criterios":[{"nombre":"...","peso":40}]}';
    const r = await evClaudeJSON(p);
    if (r && Array.isArray(r.criterios) && r.criterios.length) {
      return { criteria: r.criterios.map(c => ({ name: String(c.nombre || c.name || 'Criterio'), weight: Number(c.peso || c.weight) || 0 })), ia: true };
    }
    return { criteria: evDefaultRubric(e).criteria, ia: false };
  }

  function evAnalysisFallback(e, st, qual) {
    if (st.avg == null && !st.graded) return 'Aún no hay calificaciones capturadas en "' + e.name + '". Captura algunas y vuelve a pedir el análisis.';
    if (qual) {
      let txt = 'En "' + e.name + '" (' + e.group + '), el ' + (st.esperadoPct || 0) + '% del grupo está en nivel esperado o superior, con captura al ' + st.pct + '%. ';
      txt += st.low.length
        ? st.low.length + ' alumno(s) requieren apoyo: ' + st.low.map(s => s.name.split(' ')[0]).join(', ') + '. Sugiero actividades focalizadas y aviso a tutores.'
        : 'Ningún alumno requiere apoyo; documenta evidencias y mantén el ritmo.';
      return txt;
    }
    let txt = 'El grupo ' + e.group + ' promedia ' + (st.avg != null ? st.avg.toFixed(1) : '—') + ' en "' + e.name + '" (captura al ' + st.pct + '%, ' + (st.aprobPct != null ? st.aprobPct + '% acreditados' : '—') + '). ';
    txt += st.low.length
      ? st.low.length + ' alumno(s) en riesgo (<7): ' + st.low.slice(0, 5).map(s => s.name.split(' ')[0]).join(', ') + '. Sugiero tutoría focalizada y aviso a sus tutores.'
      : 'Ningún alumno está por debajo de 7; reconoce el esfuerzo del grupo.';
    return txt;
  }

  async function evAnalyzeAI(e, st, qual) {
    if (!st.graded) return { text: evAnalysisFallback(e, st, qual), ia: false };
    const detalle = qual
      ? 'Evaluación cualitativa. En nivel esperado o superior: ' + (st.esperadoPct || 0) + '%. Requieren apoyo: ' + (st.low.length ? st.low.map(s => s.name).join(', ') : 'ninguno') + '.'
      : 'Escala 6-10. Promedio ' + (st.avg != null ? st.avg.toFixed(2) : '—') + '. Acreditados ' + (st.aprobPct != null ? st.aprobPct + '%' : '—') + '. Bajo 7: ' + (st.low.length ? st.low.map(s => s.name + ' (' + s.num.toFixed(1) + ')').join(', ') : 'ninguno') + '.';
    const school = (window.DB && DB.school && DB.school.name) ? DB.school.name : 'la escuela';
    const p = 'Eres el Copilot académico de ' + school + '. Analiza la evaluación "' + e.name + '" de ' + e.subject +
      ' (' + e.group + ', captura ' + st.pct + '%):\n' + detalle +
      '\nEscribe un análisis accionable de 45-65 palabras en español para la coordinación. Responde ÚNICAMENTE JSON: {"analisis":"..."}';
    const r = await evClaudeJSON(p);
    if (r && r.analisis) return { text: String(r.analisis), ia: true };
    return { text: evAnalysisFallback(e, st, qual), ia: false };
  }

  /* ---------------- seed de DB.evaluaciones ---------------- */
  /* Genera evaluaciones realistas SOLO sobre grupos que existen. */
  function evBuildSeed() {
    const clases = evClases();
    const out = [];
    let seq = 1;
    const fechas = ['ayer', 'hoy 09:00', 'mañana 10:00', 'en 3 días', 'próxima semana', '12 jun', '18 jun', '24 jun'];
    // En ciclo recién reiniciado todo está por venir (sin calificaciones aún);
    // en ciclo normal hay una mezcla con evaluaciones ya calificadas.
    const statusByMod = FRESH
      ? ['programada', 'abierta', 'programada', 'abierta']
      : ['cerrada', 'calificar', 'abierta', 'programada'];

    clases.forEach((c, ci) => {
      const nivel = c.nivel;
      const materias = EV_MATERIAS[nivel] || EV_MATERIAS.Primaria;
      const qual = nivel === 'Preescolar';
      // 1–2 evaluaciones por grupo, deterministas
      const nEval = 1 + (evHash(c.g) % 2);
      for (let j = 0; j < nEval; j++) {
        const h = evHash(c.g + '#' + j);
        const subject = materias[h % materias.length];
        const status = statusByMod[(ci + j) % statusByMod.length];
        let type;
        if (qual) type = (h % 2 === 0) ? 'observacion' : 'proyecto';
        else type = ['examen', 'quiz', 'proyecto', 'tarea'][h % 4];
        const total = c.alumnos || 26;
        let submitted;
        if (status === 'programada') submitted = 0;
        else if (status === 'abierta') submitted = Math.round(total * (0.5 + (h % 30) / 100));
        else submitted = total;                          // calificar / cerrada
        submitted = Math.max(0, Math.min(total, submitted));
        const tyLabel = EV_TYPES[type].label;
        const name = tyLabel + ' · ' + subject + (qual ? '' : (' · ' + (['Unidad 1', 'Unidad 2', 'Parcial', 'Bloque ' + (1 + j)][h % 4])));
        out.push({
          _id: 'ev-' + (seq++),
          name,
          group: c.g,
          subject,
          type,
          date: fechas[(ci + j) % fechas.length],
          status,
          submitted,
          total,
        });
      }
    });
    return out;
  }

  if (window.DB && (!Array.isArray(window.DB.evaluaciones) || window.DB.evaluaciones.length === 0)) {
    window.DB.evaluaciones = evBuildSeed();
  }

  /* ---------------- exponer al ámbito global ---------------- */
  Object.assign(window, {
    EV_TYPES, EV_STATUS, EV_MATERIAS, EV_QUAL, EV_RUBRIC_LEVELS,
    evType, evNivel, evMinG, evQual,
    evClaseOf, evRoster, evGruposDe,
    evSeedScore, evCellKey, evStats,
    evDefaultRubric, evRubricScore,
    evLoadScores, evSaveScores, evLoadPicks, evSavePicks,
    evLoadRubrics, evSaveRubrics, evLoadQuestions, evSaveQuestions,
    evGenerateQuestions, evSuggestRubric, evAnalyzeAI,
  });

})();
