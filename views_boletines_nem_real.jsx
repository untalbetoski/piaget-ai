/* views_boletines_nem_real.jsx — Reportes de Evaluación SEP/NEM con datos reales */

const BNEM_PERIODS = [
  { key: 'Primer parcial', label: 'Primer periodo de evaluación' },
  { key: 'Segundo parcial', label: 'Segundo periodo de evaluación' },
  { key: 'Tercer parcial', label: 'Tercer periodo de evaluación' },
];
const BNEM_LEVELS = ['Preescolar', 'Primaria', 'Secundaria'];
const BNEM_CAMPOS = ['Lenguajes', 'Saberes y pensamiento científico', 'Ética, naturaleza y sociedades', 'De lo humano y lo comunitario'];
const BNEM_QUAL = {
  RA: 'Requiere apoyo',
  ED: 'En desarrollo',
  NE: 'Nivel esperado',
  SD: 'Sobresaliente',
};

function bnemClean(v) { return String(v || '').trim().replace(/\s+/g, ' '); }
function bnemReal(x) { return x && x.real !== false && !x.demo && !x.sample && !x.seed; }
function bnemClasses() {
  const deleted = new Set((DB.settings && DB.settings.deletedClassIds) || []);
  return ((DB && Array.isArray(DB.clases)) ? DB.clases : [])
    .filter(c => c && bnemReal(c) && !/^cls-\d+$/i.test(String(c._id || '')) && !deleted.has(c._id) && bnemClean(c.g || c.grade || c.group))
    .map(c => ({ ...c, g: bnemClean(c.g || c.grade || c.group), nivel: bnemClean(c.nivel || c.level) || 'Primaria' }));
}
function bnemStudents() {
  return ((DB && Array.isArray(DB.students)) ? DB.students : []).filter(s => bnemReal(s) && bnemClean(s.name || s.nombre));
}
function bnemStudentsFor(level, group) {
  return bnemStudents().filter(s => {
    const sn = bnemClean(s.nivel || s.level);
    const sg = bnemClean(s.grade || s.group || s.grupo);
    return (!level || sn === level) && (!group || sg === group);
  }).sort((a, b) => bnemClean(a.name || a.nombre).localeCompare(bnemClean(b.name || b.nombre)));
}
function bnemBook() {
  if (window.nemGradebook) return window.nemGradebook();
  DB.settings = DB.settings || {};
  DB.settings.nemGradebook = DB.settings.nemGradebook || {};
  return DB.settings.nemGradebook;
}
function bnemObsBook() {
  if (window.nemReportObservations) return window.nemReportObservations();
  DB.settings = DB.settings || {};
  DB.settings.nemReportObservations = DB.settings.nemReportObservations || {};
  return DB.settings.nemReportObservations;
}
function bnemCell(period, group, studentName, campo) { return period + '|' + group + '|' + studentName + '|' + campo; }
function bnemObsKey(period, group, student, campo) { return period + '|' + group + '|' + String(student._id || student.name || student.nombre) + '|' + campo; }
function bnemValue(period, group, student, campo) { return bnemBook()[bnemCell(period, group, bnemClean(student.name || student.nombre), campo)]; }
function bnemGradeNumber(group) { const m = String(group || '').match(/([1-6])/); return m ? Number(m[1]) : null; }
function bnemPhase(level, group) {
  if (level === 'Preescolar') return 'Fase 2';
  if (level === 'Secundaria') return 'Fase 6';
  const n = bnemGradeNumber(group);
  if (n && n <= 2) return 'Fase 3';
  if (n && n <= 4) return 'Fase 4';
  return 'Fase 5';
}
function bnemScale(level, group) {
  if (level === 'Preescolar') return 'Evaluación cualitativa';
  if (level === 'Primaria' && bnemGradeNumber(group) === 1) return 'Escala 6–10';
  return 'Escala 5–10 · mínima aprobatoria 6';
}
function bnemIdentity(student) {
  return {
    name: bnemClean(student.name || student.nombre),
    curp: bnemClean(student.curp || student.CURP) || 'No capturada',
    matricula: bnemClean(student.matricula || student.enrollment || student._id) || 'No capturada',
    tutor: bnemClean(student.tutor || student.guardian) || 'No capturado',
  };
}
function bnemReportData(period, level, group, student) {
  const identity = bnemIdentity(student);
  const values = BNEM_CAMPOS.map(campo => ({ campo, value: bnemValue(period, group, student, campo), obs: bnemObsBook()[bnemObsKey(period, group, student, campo)] || '' }));
  const numeric = values.map(x => Number(x.value)).filter(v => Number.isFinite(v));
  const average = numeric.length ? numeric.reduce((a, b) => a + b, 0) / numeric.length : null;
  const generalObs = bnemObsBook()[bnemObsKey(period, group, student, 'GENERAL')] || '';
  const captured = values.filter(x => x.value != null && x.value !== '').length;
  return { period, level, group, phase: bnemPhase(level, group), scale: bnemScale(level, group), student, identity, values, average, generalObs, captured };
}
function bnemStats(period, level) {
  const classes = bnemClasses().filter(c => c.nivel === level);
  const reports = [];
  classes.forEach(c => bnemStudentsFor(level, c.g).forEach(s => reports.push(bnemReportData(period, level, c.g, s))));
  const totalCells = reports.length * BNEM_CAMPOS.length;
  const captured = reports.reduce((a, r) => a + r.captured, 0);
  return { reports, students: reports.length, captured, pct: totalCells ? Math.round(captured / totalCells * 100) : 0, ready: reports.filter(r => r.captured === BNEM_CAMPOS.length).length };
}
function bnemSchoolMeta() {
  return {
    school: (DB.school && DB.school.name) || 'Colegio Jean Piaget',
    cct: (DB.school && DB.school.cct) || (DB.settings && (DB.settings.cct || DB.settings.CCT)) || 'No configurada',
    cycle: (DB.school && DB.school.cycle) || (window.PIAGET_CYCLE ? window.PIAGET_CYCLE() : 'Ciclo actual'),
  };
}
function bnemSaveObservation(report, campo, text) {
  const book = bnemObsBook();
  book[bnemObsKey(report.period, report.group, report.student, campo)] = String(text || '').trim();
  try { Store.saveState && Store.saveState(); } catch (_) {}
}
function bnemEscape(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s])); }
function bnemReportHtml(report) {
  const meta = bnemSchoolMeta();
  const pre = report.level === 'Preescolar';
  const fieldRows = report.values.map(x => {
    const value = x.value == null || x.value === '' ? 'Sin captura' : pre ? (BNEM_QUAL[x.value] || x.value) : String(x.value);
    return '<tr><td><b>' + bnemEscape(x.campo) + '</b></td><td class="value">' + bnemEscape(value) + '</td><td>' + bnemEscape(x.obs || 'Sin observación capturada') + '</td></tr>';
  }).join('');
  return '<section class="report"><header><div><div class="kicker">SECRETARÍA DE EDUCACIÓN PÚBLICA · EDUCACIÓN BÁSICA</div><h1>Reporte de Evaluación</h1><div class="school">' + bnemEscape(meta.school) + '</div></div><div class="meta"><div><span>CCT</span><b>' + bnemEscape(meta.cct) + '</b></div><div><span>Ciclo</span><b>' + bnemEscape(meta.cycle) + '</b></div></div></header><div class="nem">Nueva Escuela Mexicana · ' + bnemEscape(report.level) + ' · ' + bnemEscape(report.phase) + '</div><div class="identity"><div><span>Alumno(a)</span><b>' + bnemEscape(report.identity.name) + '</b></div><div><span>CURP</span><b>' + bnemEscape(report.identity.curp) + '</b></div><div><span>Matrícula</span><b>' + bnemEscape(report.identity.matricula) + '</b></div><div><span>Grupo</span><b>' + bnemEscape(report.group) + '</b></div><div><span>Periodo</span><b>' + bnemEscape(BNEM_PERIODS.find(p => p.key === report.period)?.label || report.period) + '</b></div><div><span>Criterio</span><b>' + bnemEscape(report.scale) + '</b></div></div><h2>Campos formativos</h2><table><thead><tr><th>Campo formativo</th><th>Evaluación</th><th>Observaciones y sugerencias</th></tr></thead><tbody>' + fieldRows + '</tbody></table>' + (!pre ? '<div class="average">Promedio del periodo: <b>' + (report.average == null ? 'Sin captura completa' : report.average.toFixed(1)) + '</b></div>' : '') + '<div class="general"><b>Observaciones generales</b><p>' + bnemEscape(report.generalObs || 'Sin observación general capturada') + '</p></div><footer><span>Reporte generado con datos reales capturados en la plataforma.</span><span>' + bnemEscape(meta.school) + '</span></footer></section>';
}
function bnemPrintReports(reports, title) {
  if (!reports.length) return toast('No hay reportes con evaluaciones reales capturadas', 'warn');
  const w = window.open('', '_blank');
  if (!w) return toast('Permite ventanas emergentes para imprimir los reportes', 'warn');
  const css = '@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#16213c;background:#eef1f7}.toolbar{position:sticky;top:0;display:flex;justify-content:flex-end;gap:8px;padding:12px;background:#0b1a57}.toolbar button{border:0;border-radius:8px;padding:10px 14px;font-weight:700;cursor:pointer}.toolbar .primary{background:#0e27e6;color:#fff}.report{width:210mm;min-height:277mm;margin:14px auto;background:#fff;padding:14mm;page-break-after:always}.report:last-of-type{page-break-after:auto}header{display:flex;justify-content:space-between;border-bottom:3px solid #0e27e6;padding-bottom:12px}.kicker{font-size:9px;letter-spacing:.12em;color:#6c7790}.report h1{margin:5px 0 2px;font-size:25px}.school{font-weight:700;color:#0e27e6}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px}.meta div,.identity div{display:flex;flex-direction:column;gap:3px}.meta span,.identity span{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#8a93a8}.meta b,.identity b{font-size:11px}.nem{margin:12px 0;background:#eef1fb;padding:9px 12px;border-radius:8px;font-weight:700;color:#0e27e6}.identity{display:grid;grid-template-columns:2fr 1.4fr 1fr;gap:10px;border:1px solid #dfe5f2;border-radius:10px;padding:11px}.report h2{font-size:15px;margin:16px 0 8px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #dfe5f2;padding:9px;font-size:10.5px;vertical-align:top}th{background:#f5f7fb;text-align:left}.value{width:95px;text-align:center;font-weight:700}.average{margin-top:12px;text-align:right;font-size:13px}.general{margin-top:14px;border:1px solid #dfe5f2;border-radius:8px;padding:10px;font-size:10.5px}.general p{margin:6px 0 0;line-height:1.5}footer{display:flex;justify-content:space-between;margin-top:18px;padding-top:8px;border-top:1px solid #dfe5f2;color:#8a93a8;font-size:8.5px}@media print{body{background:#fff}.toolbar{display:none}.report{margin:0;padding:10mm;box-shadow:none}}';
  w.document.open();
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + bnemEscape(title) + '</title><style>' + css + '</style></head><body><div class="toolbar"><button onclick="window.close()">Cerrar</button><button class="primary" onclick="window.print()">Imprimir / Guardar PDF</button></div>' + reports.map(bnemReportHtml).join('') + '</body></html>');
  w.document.close();
}

function BNEMReportModal({ report, onClose }) {
  const [fieldObs, setFieldObs] = React.useState(() => Object.fromEntries(report.values.map(x => [x.campo, x.obs || ''])));
  const [general, setGeneral] = React.useState(report.generalObs || '');
  if (!report) return null;
  const pre = report.level === 'Preescolar';
  function saveNotes() {
    BNEM_CAMPOS.forEach(c => bnemSaveObservation(report, c, fieldObs[c] || ''));
    bnemSaveObservation(report, 'GENERAL', general);
    toast('Observaciones del reporte guardadas', 'ok');
  }
  return <Modal open title="Reporte de Evaluación SEP/NEM" width={820} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn" onClick={saveNotes}><Icon name="check" size={15} className="btn-ico" />Guardar observaciones</button><button className="btn primary" onClick={() => { saveNotes(); bnemPrintReports([bnemReportData(report.period, report.level, report.group, report.student)], 'Reporte de Evaluación'); }}><Icon name="download" size={15} className="btn-ico" />Imprimir / PDF</button></>}>
    <div className="col" style={{ gap: 14 }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>{[['Alumno', report.identity.name], ['CURP', report.identity.curp], ['Matrícula', report.identity.matricula], ['Nivel', report.level + ' · ' + report.phase], ['Grupo', report.group], ['Periodo', BNEM_PERIODS.find(p => p.key === report.period)?.label || report.period]].map(([k,v]) => <div key={k} className="kv"><span className="k">{k}</span><span className="v">{v}</span></div>)}</div>
      <div className="ai-panel" style={{ margin: 0 }}><div className="insight" style={{ borderTop: 'none' }}><div className="insight-ico"><Icon name="bookOpen" size={15} /></div><div className="insight-body"><div className="insight-title">{report.scale}</div><div className="insight-text">El reporte solo muestra evaluaciones capturadas. Los campos sin captura permanecen vacíos y no se inventan resultados.</div></div></div></div>
      <div className="eyebrow">Campos formativos</div>
      <div className="col" style={{ gap: 10 }}>{report.values.map(x => { const value = x.value == null || x.value === '' ? 'Sin captura' : pre ? (BNEM_QUAL[x.value] || x.value) : x.value; return <div key={x.campo} className="card pad" style={{ boxShadow: 'none' }}><div className="row between center" style={{ marginBottom: 8 }}><b style={{ fontSize: 13.5 }}>{x.campo}</b><Badge tone={x.value == null || x.value === '' ? 'gray' : pre ? 'violet' : Number(x.value) >= 6 ? 'green' : 'red'}>{value}</Badge></div><textarea className="inp" rows="2" value={fieldObs[x.campo] || ''} onChange={e => setFieldObs(o => ({ ...o, [x.campo]: e.target.value }))} placeholder="Observaciones y sugerencias del campo formativo" /></div>; })}</div>
      {!pre && <div className="row between center card pad" style={{ boxShadow: 'none' }}><span style={{ fontWeight: 600 }}>Promedio real del periodo</span><span className="font-display tnum" style={{ fontWeight: 800, fontSize: 24 }}>{report.average == null ? '—' : report.average.toFixed(1)}</span></div>}
      <Field label="Observaciones generales"><textarea className="inp" rows="4" value={general} onChange={e => setGeneral(e.target.value)} placeholder="Observaciones generales del periodo" /></Field>
    </div>
  </Modal>;
}

function BoletinesNEMReal({ go }) {
  useStore();
  const classes = bnemClasses();
  const levelsPresent = BNEM_LEVELS.filter(n => classes.some(c => c.nivel === n));
  const [period, setPeriod] = React.useState(BNEM_PERIODS[0].key);
  const [level, setLevel] = React.useState(levelsPresent[0] || 'Primaria');
  const groups = classes.filter(c => c.nivel === level);
  const [group, setGroup] = React.useState(groups[0] ? groups[0].g : '');
  const [report, setReport] = React.useState(null);
  React.useEffect(() => { const g = bnemClasses().find(c => c.nivel === level); setGroup(g ? g.g : ''); }, [level, classes.length]);
  const students = bnemStudentsFor(level, group);
  const selectedStats = bnemStats(period, level);
  function openReport(student) { setReport(bnemReportData(period, level, group, student)); }
  function printLevel() {
    const reports = selectedStats.reports.filter(r => r.captured > 0);
    bnemPrintReports(reports, 'Reportes ' + level + ' · ' + period);
  }
  return <div className="content-inner">
    <PageHead eyebrow="Gestión" title="Boletines" desc="Reportes de Evaluación SEP/NEM por periodo, nivel, grupo y estudiante · solo datos reales">
      <button className="btn" onClick={() => go && go('calificaciones')}><Icon name="edit" size={15} className="btn-ico" />Ir a Calificaciones</button>
      <button className="btn primary" onClick={printLevel} disabled={!selectedStats.captured}><Icon name="download" size={15} className="btn-ico" />Generar lote del nivel</button>
    </PageHead>

    <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>{BNEM_PERIODS.map(p => { const all = BNEM_LEVELS.map(n => bnemStats(p.key, n)); const studentsCount = all.reduce((a,s) => a + s.students, 0); const ready = all.reduce((a,s) => a + s.ready, 0); const cells = all.reduce((a,s) => a + s.captured, 0); return <button key={p.key} className="card pad" onClick={() => setPeriod(p.key)} style={{ textAlign: 'left', cursor: 'pointer', border: period === p.key ? '2px solid var(--accent)' : '1px solid var(--border)', background: 'var(--surface)' }}><div className="row between center"><div className="kpi-ico" style={{ margin: 0 }}><Icon name="bookOpen" size={19} /></div><Badge tone={cells ? 'blue' : 'gray'}>{cells ? ready + ' listos' : 'Sin captura'}</Badge></div><div style={{ fontWeight: 700, marginTop: 12 }}>{p.label}</div><div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>{studentsCount} alumnos reales · {cells} evaluaciones capturadas</div></button>; })}</div>

    <div className="card pad" style={{ marginBottom: 16 }}><div className="row center" style={{ gap: 10, flexWrap: 'wrap' }}><Field label="Periodo"><SelectInput value={period} onChange={e => setPeriod(e.target.value)} options={BNEM_PERIODS.map(p => ({ value: p.key, label: p.label }))} /></Field><Field label="Nivel"><SelectInput value={level} onChange={e => setLevel(e.target.value)} options={BNEM_LEVELS} /></Field><Field label="Grupo"><SelectInput value={group} onChange={e => setGroup(e.target.value)} options={groups.length ? groups.map(c => ({ value: c.g, label: c.g })) : [{ value: '', label: 'Sin grupos reales' }]} /></Field><div className="grow"></div><div className="kv"><span className="k">Captura del nivel</span><span className="v">{selectedStats.pct}% · {selectedStats.ready}/{selectedStats.students} reportes completos</span></div></div></div>

    {!classes.length ? <div className="card pad" style={{ textAlign: 'center', padding: 36 }}><Icon name="layers" size={28} className="faint" /><h3>No hay grupos reales</h3><p className="faint">Crea grupos y alumnos reales antes de generar reportes de evaluación.</p><button className="btn primary" onClick={() => go && go('clases')}>Ir a Clases</button></div> : !students.length ? <div className="card pad" style={{ textAlign: 'center', padding: 36 }}><Icon name="users" size={28} className="faint" /><h3>El grupo no tiene alumnos reales</h3><p className="faint">Agrega estudiantes al grupo seleccionado para generar sus reportes.</p></div> : <div className="card"><CardHead icon="bookOpen" title="Reportes del grupo" sub={BNEM_PERIODS.find(p => p.key === period)?.label + ' · ' + level + ' · ' + group} /><div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Alumno</th><th>CURP</th><th>Captura</th><th>Promedio / nivel</th><th>Estado</th><th></th></tr></thead><tbody>{students.map(s => { const r = bnemReportData(period, level, group, s); const pre = level === 'Preescolar'; const complete = r.captured === BNEM_CAMPOS.length; return <tr key={s._id || r.identity.name}><td><div className="person"><Avatar name={r.identity.name} size={32} /><div><div className="pname">{r.identity.name}</div><div className="faint" style={{ fontSize: 11.5 }}>{r.identity.matricula}</div></div></div></td><td className="font-mono" style={{ fontSize: 11.5 }}>{r.identity.curp}</td><td><div className="row center gap-8"><div style={{ width: 90 }}><Bar value={r.captured / BNEM_CAMPOS.length * 100} height={6} /></div><span className="font-mono faint" style={{ fontSize: 11 }}>{r.captured}/4</span></div></td><td>{pre ? <span className="faint">Cualitativa</span> : <b className="tnum">{r.average == null ? '—' : r.average.toFixed(1)}</b>}</td><td>{complete ? <Badge tone="green" dot>Completo</Badge> : r.captured ? <Badge tone="amber" dot>Parcial</Badge> : <Badge tone="gray">Sin captura</Badge>}</td><td><button className="btn sm" onClick={() => openReport(s)}><Icon name="eye" size={13} className="btn-ico" />Reporte</button></td></tr>; })}</tbody></table></div></div>}
    {report && <BNEMReportModal report={report} onClose={() => setReport(null)} />}
  </div>;
}

Object.assign(window, { BoletinesNEMReal, BNEMReportModal, bnemReportData, bnemPrintReports, bnemStats });
