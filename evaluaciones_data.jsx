/* evaluaciones_data.jsx — helpers de Evaluaciones con datos reales únicamente */
(function () {
  const EV_TYPES = {
    examen:      { id: 'examen',      label: 'Examen',      icon: 'clipboard', tone: 'blue' },
    quiz:        { id: 'quiz',        label: 'Quiz',        icon: 'edit',      tone: 'cyan' },
    proyecto:    { id: 'proyecto',    label: 'Proyecto',    icon: 'bookOpen',  tone: 'violet' },
    tarea:       { id: 'tarea',       label: 'Tarea',       icon: 'check',     tone: 'green' },
    observacion: { id: 'observacion', label: 'Observación', icon: 'eye',       tone: 'amber' },
  };
  const EV_STATUS = {
    programada: ['blue',   'Programada'],
    abierta:    ['amber',  'Abierta'],
    calificar:  ['violet', 'Por calificar'],
    cerrada:    ['green',  'Cerrada'],
  };
  const EV_MATERIAS = {
    Preescolar: ['Lenguajes', 'Saberes y pensamiento científico', 'Ética, naturaleza y sociedades', 'De lo humano y lo comunitario'],
    Primaria:   ['Matemáticas', 'Lengua Materna', 'Ciencias Naturales', 'Historia', 'Geografía', 'Formación C. y É.', 'Inglés', 'Ed. Física'],
    Secundaria: ['Matemáticas', 'Español', 'Ciencias', 'Historia', 'Geografía', 'Formación C. y É.', 'Inglés', 'Tecnología'],
  };
  const EV_QUAL = [
    { id: 'RA', label: 'Requiere apoyo', score: 1, color: 'var(--red)' },
    { id: 'ED', label: 'En desarrollo', score: 2, color: 'var(--amber)' },
    { id: 'NE', label: 'Nivel esperado', score: 3, color: 'var(--text)' },
    { id: 'SD', label: 'Sobresaliente', score: 4, color: 'var(--green)' },
  ];
  const EV_RUBRIC_LEVELS = [
    { id: 1, label: 'Insuficiente', color: 'var(--red)',    pct: 0.55 },
    { id: 2, label: 'En proceso',   color: 'var(--amber)',  pct: 0.75 },
    { id: 3, label: 'Adecuado',     color: 'var(--accent)', pct: 0.90 },
    { id: 4, label: 'Destacado',    color: 'var(--green)',  pct: 1.00 },
  ];
  const evQual = (id) => EV_QUAL.find(q => q.id === id) || null;
  function evClean(v) { return String(v || '').trim().replace(/\s+/g, ' '); }
  function evMinG(nivel) { return nivel === 'Secundaria' ? 5 : 6; }
  function evType(e) { return EV_TYPES[e && e.type] || EV_TYPES.examen; }
  function evIsSeedClass(c) { return /^cls-\d+$/i.test(String((c && c._id) || '')); }
  function evDeletedClassIds() { try { return new Set((DB.settings && DB.settings.deletedClassIds) || []); } catch (_) { return new Set(); } }
  function evClases() {
    const deleted = evDeletedClassIds();
    return ((window.DB && Array.isArray(DB.clases)) ? DB.clases : [])
      .filter(c => c && !evIsSeedClass(c) && !deleted.has(c._id) && evClean(c.g))
      .map(c => ({ ...c, nivel: c.nivel || 'Primaria', g: evClean(c.g), salon: c.salon || '—' }));
  }
  function evNivel(group) {
    const c = evClases().find(x => x.g === group || x._id === group);
    if (c) return c.nivel;
    const g = String(group || '');
    if (/sec/i.test(g)) return 'Secundaria';
    if (/^\s*k/i.test(g)) return 'Preescolar';
    return 'Primaria';
  }
  function evGruposDe(nivel) { return evClases().filter(c => c.nivel === nivel).map(c => c.g); }
  function evClaseOf(e) { const g = e && e.group; return evClases().find(c => c.g === g || c._id === g) || null; }
  function evRoster(clase) {
    if (!clase) return [];
    const group = evClean(clase.g || clase.group || clase.grade);
    const nivel = evClean(clase.nivel);
    const real = ((window.DB && Array.isArray(DB.students)) ? DB.students : []).filter(s => {
      const sg = evClean(s.grade || s.group || s.grupo);
      const sn = evClean(s.nivel || s.level);
      return sg === group && (!nivel || !sn || sn === nivel) && evClean(s.name || s.nombre);
    }).map(s => evClean(s.name || s.nombre));
    return Array.from(new Set(real)).sort((a, b) => a.localeCompare(b));
  }

  function evSettings() { window.DB = window.DB || {}; DB.settings = DB.settings || {}; DB.settings.evaluacionesReal = DB.settings.evaluacionesReal || {}; return DB.settings.evaluacionesReal; }
  function _load(k) { try { const src = evSettings()[k]; if (src && typeof src === 'object') return src; } catch (_) {} try { const v = JSON.parse(localStorage.getItem('piaget_' + k + '_real_v2') || 'null'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; } }
  function _save(k, v) { try { evSettings()[k] = v || {}; } catch (_) {} try { localStorage.setItem('piaget_' + k + '_real_v2', JSON.stringify(v || {})); } catch (_) {} try { if (window.Store && Store.saveState) Store.saveState(); } catch (_) {} }
  const evLoadScores = () => _load('ev_scores');
  const evSaveScores = (v) => _save('ev_scores', v);
  const evLoadPicks = () => _load('ev_picks');
  const evSavePicks = (v) => _save('ev_picks', v);
  const evLoadRubrics = () => _load('ev_rubrics');
  const evSaveRubrics = (v) => _save('ev_rubrics', v);
  const evLoadQuestions = () => _load('ev_questions');
  const evSaveQuestions = (v) => _save('ev_questions', v);
  const evCellKey = (evId, name) => evId + '|' + name;
  function evSeedScore() { return null; }

  function evDefaultRubric(e) {
    const ty = evType(e).id;
    if (ty === 'proyecto') return { criteria: [
      { name: 'Contenido y dominio', weight: 40 },
      { name: 'Organización', weight: 25 },
      { name: 'Presentación', weight: 20 },
      { name: 'Trabajo colaborativo', weight: 15 },
    ] };
    return { criteria: [
      { name: 'Dominio de conceptos', weight: 40 },
      { name: 'Procedimiento', weight: 35 },
      { name: 'Claridad', weight: 25 },
    ] };
  }
  function evRubricScore(rubric, picks, minG) {
    if (!rubric || !rubric.criteria || !rubric.criteria.length) return null;
    let wsum = 0, acc = 0;
    for (let i = 0; i < rubric.criteria.length; i++) {
      const lvl = picks && picks[i];
      if (!lvl) return null;
      const lv = EV_RUBRIC_LEVELS.find(l => l.id === lvl);
      if (!lv) return null;
      const w = Number(rubric.criteria[i].weight) || 0;
      wsum += w; acc += w * lv.pct;
    }
    if (wsum <= 0) return null;
    return Math.round((minG + (acc / wsum) * (10 - minG)) * 10) / 10;
  }
  function evStats(e, roster, scores, qual, minG) {
    const total = roster.length;
    const perStudent = [];
    let graded = 0, sumNum = 0;
    const dist = qual ? { RA: 0, ED: 0, NE: 0, SD: 0 } : { riesgo: 0, suf: 0, bueno: 0, exc: 0 };
    let esperado = 0, aprob = 0;
    const low = [];
    roster.forEach(name => {
      const k = evCellKey(e._id, name);
      let sc = scores && k in scores ? scores[k] : null;
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
        if (num >= minG) aprob++;
        perStudent.push({ name, score: num, num });
        if (num < 7) low.push({ name, score: num, num });
      }
    });
    low.sort((a, b) => a.num - b.num);
    return { total, graded, pct: total ? Math.round(graded / total * 100) : 0, avg: (!qual && graded) ? Math.round(sumNum / graded * 100) / 100 : null, esperadoPct: qual && graded ? Math.round(esperado / graded * 100) : null, aprobPct: !qual && graded ? Math.round(aprob / graded * 100) : null, dist, low, top: perStudent.length > 0, perStudent };
  }

  async function evClaudeJSON(prompt) { if (!(window.claude && window.claude.complete)) return null; try { const out = await window.claude.complete(prompt); const o = out.indexOf('{'), c = out.lastIndexOf('}'); if (o < 0 || c <= o) return null; return JSON.parse(out.slice(o, c + 1)); } catch (_) { return null; } }
  async function evGenerateQuestions(e, n) {
    const nivel = evNivel(e.group);
    const p = 'Eres docente de ' + nivel + '. Redacta ' + n + ' reactivos breves en español para un ' + evType(e).label.toLowerCase() + ' de "' + e.subject + '" (grupo ' + e.group + '). Responde JSON: {"reactivos":["..."]}';
    const r = await evClaudeJSON(p);
    if (r && Array.isArray(r.reactivos) && r.reactivos.length) return { items: r.reactivos.slice(0, n).map(String), ia: true };
    return { items: [], ia: false };
  }
  async function evSuggestRubric(e) {
    const p = 'Sugiere rúbrica breve para ' + evType(e).label + ' de ' + e.subject + '. Responde JSON {"criteria":[{"name":"...","weight":40}]}';
    const r = await evClaudeJSON(p);
    if (r && Array.isArray(r.criteria) && r.criteria.length) return { criteria: r.criteria.map(c => ({ name: String(c.name || 'Criterio'), weight: Number(c.weight || 0) })), ia: true };
    return { criteria: evDefaultRubric(e).criteria, ia: false };
  }
  async function evAnalyzeAI(e, st, qual) {
    if (!st || !st.graded) return { text: 'Aún no hay calificaciones reales capturadas para analizar.', ia: false };
    return { text: qual ? 'Análisis basado en evaluaciones cualitativas reales capturadas.' : 'Análisis basado en calificaciones reales capturadas.', ia: false };
  }

  Object.assign(window, { EV_TYPES, EV_STATUS, EV_MATERIAS, EV_QUAL, EV_RUBRIC_LEVELS, evQual, evNivel, evMinG, evType, evClases, evGruposDe, evClaseOf, evRoster, evLoadScores, evSaveScores, evLoadPicks, evSavePicks, evLoadRubrics, evSaveRubrics, evLoadQuestions, evSaveQuestions, evCellKey, evSeedScore, evDefaultRubric, evRubricScore, evStats, evGenerateQuestions, evSuggestRubric, evAnalyzeAI });
})();
