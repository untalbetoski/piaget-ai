/* asistencia_data.jsx — Modelo de datos y helpers de Asistencia con datos reales únicamente */
(function () {
  const AS_STATUS = {
    presente:    { label: 'Presente',     short: 'P', color: 'var(--green)',  tone: 'green' },
    retardo:     { label: 'Retardo',      short: 'R', color: 'var(--amber)',  tone: 'amber' },
    justificado: { label: 'Justificado',  short: 'J', color: 'var(--accent)', tone: 'blue' },
    ausente:     { label: 'Ausente',      short: 'A', color: 'var(--red)',    tone: 'red' },
    sin_registro:{ label: 'Sin registro', short: '—', color: 'var(--surface-3)', tone: 'gray' },
  };
  const AS_STATUS_ORDER = ['presente', 'retardo', 'justificado', 'ausente'];
  const AS_MOTIVOS = ['Enfermedad', 'Cita médica', 'Asunto familiar', 'Permiso', 'Trámite oficial', 'Otro'];

  function asClean(v) { return String(v || '').trim().replace(/\s+/g, ' '); }
  function asIsSeedClass(c) { return /^cls-\d+$/i.test(String((c && c._id) || '')); }
  function asDeletedClassIds() { try { return new Set((DB.settings && DB.settings.deletedClassIds) || []); } catch (_) { return new Set(); } }
  function asClases() {
    const deleted = asDeletedClassIds();
    return ((window.DB && Array.isArray(DB.clases)) ? DB.clases : [])
      .filter(c => c && !asIsSeedClass(c) && !deleted.has(c._id) && asClean(c.g))
      .map(c => ({ ...c, nivel: c.nivel || 'Primaria', g: asClean(c.g), salon: c.salon || '—' }));
  }
  function asClaseOf(group) { return asClases().find(c => c.g === group || c._id === group) || null; }
  function asRoster(clase) {
    if (!clase) return [];
    const group = asClean(clase.g || clase.group || clase.grade);
    const nivel = asClean(clase.nivel);
    const real = ((window.DB && Array.isArray(DB.students)) ? DB.students : []).filter(s => {
      const sg = asClean(s.grade || s.group || s.grupo);
      const sn = asClean(s.nivel || s.level);
      return sg === group && (!nivel || !sn || sn === nivel) && asClean(s.name || s.nombre);
    }).map(s => asClean(s.name || s.nombre));
    return Array.from(new Set(real)).sort((a, b) => a.localeCompare(b));
  }
  function asShortGroup(group) { const g = String(group || ''); return /sec/i.test(g) ? g.replace(/\s*Sec$/i, '') : g; }

  const _DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const _MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function _iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function _parse(iso) { const [y, m, d] = String(iso || '').split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); }
  function asTodayISO() { const d = new Date(); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1); return _iso(d); }
  function asSchoolDays(n) { const out = []; const d = _parse(asTodayISO()); while (out.length < n) { if (d.getDay() !== 0 && d.getDay() !== 6) out.push(_iso(d)); d.setDate(d.getDate() - 1); } return out.reverse(); }
  function asDateLabel(iso) { const d = _parse(iso); return _DOW[d.getDay()] + ' ' + d.getDate() + ' ' + _MON[d.getMonth()]; }
  function asDayShort(iso) { const d = _parse(iso); return d.getDate() + '/' + (d.getMonth() + 1); }

  function asSettings() { window.DB = window.DB || {}; DB.settings = DB.settings || {}; DB.settings.asistenciasReal = DB.settings.asistenciasReal || {}; return DB.settings.asistenciasReal; }
  function _load(k) { try { const src = asSettings()[k]; if (src && typeof src === 'object') return src; } catch (_) {} try { const v = JSON.parse(localStorage.getItem('piaget_' + k + '_real_v2') || 'null'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; } }
  function _save(k, v) { try { asSettings()[k] = v || {}; } catch (_) {} try { localStorage.setItem('piaget_' + k + '_real_v2', JSON.stringify(v || {})); } catch (_) {} try { if (window.Store && Store.saveState) Store.saveState(); } catch (_) {} }
  const asLoadEdits = () => _load('asis_edits');
  const asSaveEdits = (v) => _save('asis_edits', v);
  const asLoadJust = () => _load('asis_just');
  const asSaveJust = (v) => _save('asis_just', v);
  const asCellKey = (date, group, name) => date + '|' + group + '|' + name;

  function asSeedStatus() { return 'sin_registro'; }
  function asStatusOf(edits, date, group, name) {
    const k = asCellKey(date, group, name);
    if (edits && k in edits && edits[k]) return edits[k];
    return 'sin_registro';
  }
  function asJustOf(just, date, group, name) {
    const k = asCellKey(date, group, name);
    return just && k in just ? just[k] : null;
  }
  function _attended(s) { return s === 'presente' || s === 'retardo'; }
  function _recorded(s) { return s && s !== 'sin_registro'; }

  function asDayCounts(edits, date, group, roster) {
    const c = { presente: 0, retardo: 0, justificado: 0, ausente: 0, sin_registro: 0 };
    roster.forEach(n => { const s = asStatusOf(edits, date, group, n); c[s] = (c[s] || 0) + 1; });
    c.total = roster.length;
    c.registrados = c.presente + c.retardo + c.justificado + c.ausente;
    c.pct = c.registrados ? Math.round((c.presente + c.retardo) / c.registrados * 100) : 0;
    return c;
  }
  function asStudentStats(edits, group, name, days) {
    const series = days.map(date => ({ date, status: asStatusOf(edits, date, group, name) }));
    const counts = { presente: 0, retardo: 0, justificado: 0, ausente: 0, sin_registro: 0 };
    series.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1; });
    const registrados = counts.presente + counts.retardo + counts.justificado + counts.ausente;
    const pct = registrados ? Math.round((counts.presente + counts.retardo) / registrados * 100) : 0;
    let streak = 0;
    const rec = series.filter(d => d.status !== 'sin_registro');
    for (let i = rec.length - 1; i >= 0; i--) { if (rec[i].status === 'ausente') streak++; else break; }
    return { series, pct, ausente: counts.ausente, retardo: counts.retardo, justificado: counts.justificado, presente: counts.presente, sin_registro: counts.sin_registro, registrados, streak };
  }
  function asRiskLevel(pct) { return pct < 80 ? 'high' : pct < 90 ? 'mid' : 'low'; }
  function asChronic(group, name) { const st = asStudentStats(asLoadEdits(), group, name, asSchoolDays(20)); return st.registrados >= 5 && st.pct < 90; }
  function asOverview(edits, clases) {
    const date = asTodayISO();
    let total = 0, presente = 0, retardo = 0, justificado = 0, ausente = 0, registrados = 0, sin_registro = 0;
    const porGrupo = [];
    clases.forEach(clase => {
      const roster = asRoster(clase);
      const c = asDayCounts(edits, date, clase.g, roster);
      total += roster.length; presente += c.presente; retardo += c.retardo; justificado += c.justificado; ausente += c.ausente; registrados += c.registrados; sin_registro += c.sin_registro;
      porGrupo.push({ clase, pct: c.pct, ausente: c.ausente, registrados: c.registrados, total: c.total });
    });
    porGrupo.sort((a, b) => a.pct - b.pct);
    return { date, total, presente, retardo, justificado, ausente, registrados, sin_registro, pct: registrados ? Math.round((presente + retardo) / registrados * 100) : 0, porGrupo };
  }
  function asTrend(edits, clases, days) {
    return days.map(date => {
      let att = 0, reg = 0;
      clases.forEach(clase => asRoster(clase).forEach(n => { const s = asStatusOf(edits, date, clase.g, n); if (_recorded(s)) { reg++; if (_attended(s)) att++; } }));
      return reg ? Math.round(att / reg * 100) : 0;
    });
  }
  function asRiskStudents(edits, clases, days) {
    const out = [];
    clases.forEach(clase => asRoster(clase).forEach(name => { const st = asStudentStats(edits, clase.g, name, days); if (st.registrados >= 5 && st.pct < 90) out.push({ name, group: clase.g, pct: st.pct, ausente: st.ausente }); }));
    out.sort((a, b) => a.pct - b.pct);
    return out;
  }
  async function asClaudeJSON(prompt) { if (!(window.claude && window.claude.complete)) return null; try { const out = await window.claude.complete(prompt); const o = out.indexOf('{'), c = out.lastIndexOf('}'); if (o < 0 || c <= o) return null; return JSON.parse(out.slice(o, c + 1)); } catch (_) { return null; } }
  function asAnalysisFallback(scope, ov, risk) {
    if (!ov.registrados) return 'Aún no hay asistencia real capturada para ' + scope + '. Pasa lista en un grupo para generar análisis.';
    let txt = 'Hoy la asistencia registrada de ' + scope + ' es del ' + ov.pct + '% (' + ov.ausente + ' ausentes, ' + ov.retardo + ' retardos, ' + ov.justificado + ' justificadas sobre ' + ov.registrados + ' registros). ';
    txt += risk.length ? risk.length + ' alumno(s) tienen asistencia menor a 90% con registros suficientes.' : 'No hay alumnos con ausentismo recurrente detectado.';
    return txt;
  }
  async function asAnalyzeAI(scope, ov, risk) {
    if (!ov.registrados) return { text: asAnalysisFallback(scope, ov, risk), ia: false };
    const school = (window.DB && DB.school && DB.school.name) ? DB.school.name : 'la escuela';
    const p = 'Eres el Copilot de ' + school + '. Analiza asistencia real de ' + scope + '. Asistencia ' + ov.pct + '%, ausentes ' + ov.ausente + ', retardos ' + ov.retardo + ', justificadas ' + ov.justificado + '. Responde JSON {"analisis":"..."}';
    const r = await asClaudeJSON(p);
    if (r && r.analisis) return { text: String(r.analisis), ia: true };
    return { text: asAnalysisFallback(scope, ov, risk), ia: false };
  }

  Object.assign(window, { AS_STATUS, AS_STATUS_ORDER, AS_MOTIVOS, asClases, asClaseOf, asRoster, asShortGroup, asTodayISO, asSchoolDays, asDateLabel, asDayShort, asCellKey, asStatusOf, asJustOf, asLoadEdits, asSaveEdits, asLoadJust, asSaveJust, asDayCounts, asStudentStats, asRiskLevel, asChronic, asOverview, asTrend, asRiskStudents, asAnalyzeAI });
})();
