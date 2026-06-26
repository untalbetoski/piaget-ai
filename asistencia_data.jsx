/* ============================================================
   asistencia_data.jsx — Modelo de datos y helpers de Asistencia
   ------------------------------------------------------------
   Provee TODO lo que consume views_asistencia.jsx, enlazado al
   padrón REAL de grupos (DB.clases / CLASES_SEED) y al roster
   determinista (alumnosDeClase). La asistencia base de cada
   alumno se deriva de su tasa real (alumnosDeClase[].asis), por
   lo que coincide con los % que muestran Clases y el Dashboard.

   Cargar DESPUÉS de seed_clases.jsx y store.js, ANTES de
   views_asistencia.jsx.
   ============================================================ */
(function () {

  /* ---------------- catálogos ---------------- */
  const AS_STATUS = {
    presente:    { label: 'Presente',    short: 'P', color: 'var(--green)',  tone: 'green' },
    retardo:     { label: 'Retardo',     short: 'R', color: 'var(--amber)',  tone: 'amber' },
    justificado: { label: 'Justificado', short: 'J', color: 'var(--accent)', tone: 'blue' },
    ausente:     { label: 'Ausente',     short: 'A', color: 'var(--red)',    tone: 'red' },
  };
  const AS_STATUS_ORDER = ['presente', 'retardo', 'justificado', 'ausente'];
  const AS_MOTIVOS = ['Enfermedad', 'Cita médica', 'Asunto familiar', 'Permiso', 'Trámite oficial', 'Otro'];

  /* ---------------- clases / roster (padrón real) ---------------- */
  function asClases() { return window.docClases((window.DB && DB.clases && DB.clases.length) ? DB.clases : (window.CLASES_SEED || [])); }
  function asClaseOf(group) { return asClases().find(c => c.g === group) || null; }
  function asRoster(clase) {
    if (!clase) return [];
    const real = ((window.DB && DB.students) || []).filter(s => s.grade === clase.g).map(s => s.name);
    const gen = window.alumnosDeClase ? alumnosDeClase(clase).map(a => a.name) : [];
    const names = [];
    [...real, ...gen].forEach(n => { if (!names.includes(n)) names.push(n); });
    return names.slice(0, clase.alumnos || names.length).sort((a, b) => a.localeCompare(b));
  }
  function asShortGroup(group) { const g = String(group || ''); return /sec/i.test(g) ? g.replace(/\s*Sec$/i, '') : g; }

  /* tasa de asistencia base por alumno (de alumnosDeClase) */
  const _asisCache = {};
  function asStudentAsis(group, name) {
    const clase = asClaseOf(group);
    if (!clase) return 92;
    const key = clase._id || clase.g;
    if (!_asisCache[key]) {
      const m = {};
      (window.alumnosDeClase ? alumnosDeClase(clase) : []).forEach(a => { m[a.name] = a.asis; });
      _asisCache[key] = m;
    }
    const v = _asisCache[key][name];
    return v != null ? v : (clase.asistencia || 92);
  }

  /* ---------------- fechas (días hábiles) ---------------- */
  const _DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const _MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function _iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function _parse(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
  function asTodayISO() {
    const d = new Date();
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return _iso(d);
  }
  function asSchoolDays(n) {
    const out = [];
    const d = _parse(asTodayISO());
    while (out.length < n) {
      if (d.getDay() !== 0 && d.getDay() !== 6) out.push(_iso(d));
      d.setDate(d.getDate() - 1);
    }
    return out.reverse();              // ascendente (más antiguo → hoy)
  }
  function asDateLabel(iso) { const d = _parse(iso); return _DOW[d.getDay()] + ' ' + d.getDate() + ' ' + _MON[d.getMonth()]; }
  function asDayShort(iso) { const d = _parse(iso); return d.getDate() + '/' + (d.getMonth() + 1); }

  /* ---------------- hash determinista ---------------- */
  function asHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991; return h; }

  /* ---------------- persistencia ---------------- */
  const FRESH = !!window.PIAGET_FRESH;
  const K_EDITS = FRESH ? 'piaget_asis_edits_fresh_v1' : 'piaget_asis_edits_v1';
  const K_JUST = FRESH ? 'piaget_asis_just_fresh_v1' : 'piaget_asis_just_v1';
  function _load(k) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); if (v && typeof v === 'object') return v; } catch (e) { } return {}; }
  function _save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  const asLoadEdits = () => _load(K_EDITS);
  const asSaveEdits = (v) => _save(K_EDITS, v);
  const asLoadJust = () => _load(K_JUST);
  const asSaveJust = (v) => _save(K_JUST, v);
  const asCellKey = (date, group, name) => date + '|' + group + '|' + name;

  /* ---------------- estatus base (seed determinista) ---------------- */
  /* Probabilidad de presencia = tasa de asistencia del alumno. El resto
     se reparte entre retardo / justificado / ausente. */
  function asSeedStatus(date, group, name) {
    const asis = asStudentAsis(group, name);
    const h = asHash(date + '|' + group + '|' + name);
    const r = (h % 1000) / 1000;
    const pPres = Math.max(0.5, Math.min(0.995, asis / 100));
    if (r < pPres) return 'presente';
    const x = (r - pPres) / (1 - pPres);          // 0..1 dentro de la "cola"
    if (x < 0.40) return 'retardo';
    if (x < 0.70) return 'justificado';
    return 'ausente';
  }
  function asStatusOf(edits, date, group, name) {
    const k = asCellKey(date, group, name);
    if (edits && k in edits) return edits[k];
    return asSeedStatus(date, group, name);
  }
  function asJustOf(just, date, group, name) {
    const k = asCellKey(date, group, name);
    if (just && k in just) return just[k];
    if (asSeedStatus(date, group, name) === 'justificado') {
      const m = AS_MOTIVOS[asHash(k) % AS_MOTIVOS.length];
      return { motivo: m, recibido: true };
    }
    return null;
  }

  /* "asistió" = presente o retardo (justificado/ausente NO suman) */
  function _attended(s) { return s === 'presente' || s === 'retardo'; }

  /* ---------------- conteos / estadísticas ---------------- */
  function asDayCounts(edits, date, group, roster) {
    const c = { presente: 0, retardo: 0, justificado: 0, ausente: 0 };
    roster.forEach(n => { c[asStatusOf(edits, date, group, n)]++; });
    const total = roster.length || 1;
    c.total = roster.length;
    c.pct = Math.round((c.presente + c.retardo) / total * 100);
    return c;
  }

  function asStudentStats(edits, group, name, days) {
    const series = days.map(date => ({ date, status: asStatusOf(edits, date, group, name) }));
    const counts = { presente: 0, retardo: 0, justificado: 0, ausente: 0 };
    series.forEach(d => counts[d.status]++);
    const total = series.length || 1;
    const pct = Math.round((counts.presente + counts.retardo) / total * 100);
    // racha de inasistencias (ausente) más reciente
    let streak = 0;
    for (let i = series.length - 1; i >= 0; i--) { if (series[i].status === 'ausente') streak++; else break; }
    return { series, pct, ausente: counts.ausente, retardo: counts.retardo, justificado: counts.justificado, presente: counts.presente, streak };
  }

  function asRiskLevel(pct) { return pct < 80 ? 'high' : pct < 90 ? 'mid' : 'low'; }
  function asChronic(group, name) {
    const st = asStudentStats(null, group, name, asSchoolDays(20));
    return st.pct < 90;
  }

  function asOverview(edits, clases) {
    const date = asTodayISO();
    let total = 0, presente = 0, retardo = 0, justificado = 0, ausente = 0;
    const porGrupo = [];
    clases.forEach(clase => {
      const roster = asRoster(clase);
      const c = asDayCounts(edits, date, clase.g, roster);
      total += roster.length; presente += c.presente; retardo += c.retardo; justificado += c.justificado; ausente += c.ausente;
      porGrupo.push({ clase, pct: c.pct, ausente: c.ausente });
    });
    porGrupo.sort((a, b) => a.pct - b.pct);
    return {
      date, total, presente, retardo, justificado, ausente,
      pct: total ? Math.round((presente + retardo) / total * 100) : 0,
      porGrupo,
    };
  }

  function asTrend(edits, clases, days) {
    return days.map(date => {
      let att = 0, tot = 0;
      clases.forEach(clase => {
        const roster = asRoster(clase);
        roster.forEach(n => { tot++; if (_attended(asStatusOf(edits, date, clase.g, n))) att++; });
      });
      return tot ? Math.round(att / tot * 100) : 0;
    });
  }

  function asRiskStudents(edits, clases, days) {
    const out = [];
    clases.forEach(clase => {
      asRoster(clase).forEach(name => {
        const st = asStudentStats(edits, clase.g, name, days);
        if (st.pct < 90) out.push({ name, group: clase.g, pct: st.pct, ausente: st.ausente });
      });
    });
    out.sort((a, b) => a.pct - b.pct);
    return out;
  }

  /* ---------------- IA (con fallback determinista) ---------------- */
  async function asClaudeJSON(prompt) {
    if (!(window.claude && window.claude.complete)) return null;
    try {
      const out = await window.claude.complete(prompt);
      const o = out.indexOf('{'), c = out.lastIndexOf('}');
      if (o < 0 || c <= o) return null;
      return JSON.parse(out.slice(o, c + 1));
    } catch (err) { return null; }
  }
  function asAnalysisFallback(scope, ov, risk) {
    let txt = 'Hoy la asistencia de ' + scope + ' es del ' + ov.pct + '% (' + ov.ausente + ' ausentes, ' + ov.retardo + ' retardos, ' + ov.justificado + ' justificadas sobre ' + ov.total + ' alumnos). ';
    if (risk.length) {
      const peor = risk.slice(0, 4).map(r => r.name.split(' ')[0] + ' (' + asShortGroup(r.group) + ', ' + r.pct + '%)').join(', ');
      txt += risk.length + ' alumno(s) están bajo 90% de asistencia; prioriza contactar a: ' + peor + '. Sugiero plan de seguimiento y aviso a sus familias.';
    } else {
      txt += 'Ningún alumno está bajo 90% de asistencia; el ausentismo está controlado.';
    }
    return txt;
  }
  async function asAnalyzeAI(scope, ov, risk) {
    const school = (window.DB && DB.school && DB.school.name) ? DB.school.name : 'la escuela';
    const detalle = 'Asistencia hoy ' + ov.pct + '%. Ausentes ' + ov.ausente + ', retardos ' + ov.retardo + ', justificadas ' + ov.justificado + ', total ' + ov.total + '.\n' +
      'Alumnos bajo 90%: ' + (risk.length ? risk.slice(0, 10).map(r => r.name + ' ' + asShortGroup(r.group) + ' ' + r.pct + '%').join(', ') : 'ninguno') + '.';
    const p = 'Eres el Copilot de ' + school + '. Analiza la asistencia de ' + scope + ':\n' + detalle +
      '\nEscribe un análisis accionable de 45-65 palabras en español para la coordinación, enfocado en ausentismo. Responde ÚNICAMENTE JSON: {"analisis":"..."}';
    const r = await asClaudeJSON(p);
    if (r && r.analisis) return { text: String(r.analisis), ia: true };
    return { text: asAnalysisFallback(scope, ov, risk), ia: false };
  }

  /* ---------------- exponer al ámbito global ---------------- */
  Object.assign(window, {
    AS_STATUS, AS_STATUS_ORDER, AS_MOTIVOS,
    asClases, asClaseOf, asRoster, asShortGroup,
    asTodayISO, asSchoolDays, asDateLabel, asDayShort,
    asCellKey, asStatusOf, asJustOf,
    asLoadEdits, asSaveEdits, asLoadJust, asSaveJust,
    asDayCounts, asStudentStats, asRiskLevel, asChronic,
    asOverview, asTrend, asRiskStudents, asAnalyzeAI,
  });

})();
