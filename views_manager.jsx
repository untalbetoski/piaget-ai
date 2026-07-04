/* views_manager.jsx — Manager real-only: sin KPIs, hallazgos ni reportes demo */

const MGR_AREAS = [
  { id: 'pipeline', label: 'CRM y Admisiones', icon: 'funnel', tone: 'cyan', route: 'crm' },
  { id: 'cobros', label: 'Finanzas', icon: 'wallet', tone: 'violet', route: 'cobros' },
  { id: 'calificaciones', label: 'Académico', icon: 'cap', tone: 'blue', route: 'calificaciones' },
  { id: 'dashboard-accesos', label: 'Control de Accesos', icon: 'shield', tone: 'green', route: 'dashboard-accesos' },
  { id: 'punto-de-venta', label: 'Tiendita', icon: 'cart', tone: 'amber', route: 'punto-de-venta' },
  { id: 'inteligencia-financiera', label: 'Business Intelligence', icon: 'bars', tone: 'red', route: 'inteligencia-financiera' },
];
const MGR_PERIODS = ['Hoy', 'Esta semana', 'Este mes', 'Ciclo ' + (window.PIAGET_CYCLE ? PIAGET_CYCLE() : 'actual')];

function mgrDB() {
  window.DB = window.DB || {};
  DB.settings = DB.settings || {};
  DB.settings.managerReports = Array.isArray(DB.settings.managerReports) ? DB.settings.managerReports : [];
  return DB;
}
function mgrReal(arr) { return (arr || []).filter(x => x && x.real !== false && !x.demo && !x.sample && !x.seed); }
function mgrMoney(n) { n = Number(n) || 0; return '$' + n.toLocaleString('es-MX'); }
function mgrNum(n) { return (Number(n) || 0).toLocaleString('es-MX'); }
function mgrPct(n) { return Math.round(Number(n) || 0) + '%'; }
function mgrSave() { try { Store.saveState && Store.saveState(); } catch (_) {} }
function mgrReports() { return mgrReal(mgrDB().settings.managerReports); }
function mgrAreaMeta(id) { return MGR_AREAS.find(a => a.id === id) || MGR_AREAS[0]; }
function mgrAreaSnapshot(area) {
  const db = mgrDB();
  const students = mgrReal(db.students);
  const clases = mgrReal(db.clases);
  const cobros = mgrReal(db.cobros);
  const crm = mgrReal(db.crm || db.leads || db.prospectos);
  const access = mgrReal(db.accessLog || db.accesos || db.campusEntries || db.campusQueue);
  const pos = mgrReal(db.posSales || db.sales || db.ventas || db.tickets);
  const grades = mgrReal(db.grades || db.calificaciones);
  const today = new Date().toISOString().slice(0, 10);
  if (area.id === 'pipeline') {
    const active = crm.filter(x => !['cerrado', 'perdido', 'inscrito'].includes(String(x.status || x.estado || '').toLowerCase())).length;
    return { metric: mgrNum(active), metricLabel: 'procesos reales activos', count: crm.length, hasData: crm.length > 0, urgent: active ? active + ' procesos requieren seguimiento' : 'Sin pendientes reales', kpis: [{ label: 'Prospectos reales', value: mgrNum(crm.length) }, { label: 'Activos', value: mgrNum(active) }], context: 'CRM y Admisiones: ' + crm.length + ' prospectos reales registrados; ' + active + ' activos.' };
  }
  if (area.id === 'cobros') {
    const paid = cobros.reduce((a, x) => a + (Number(x.amount || x.monto || x.total) || 0), 0);
    const vencidos = mgrReal(db.cuentasVencidas || db.adeudos).reduce((a, x) => a + (Number(x.amount || x.monto || x.saldo) || 0), 0);
    return { metric: mgrMoney(paid), metricLabel: 'cobros reales registrados', count: cobros.length, hasData: cobros.length > 0 || vencidos > 0, urgent: vencidos > 0 ? mgrMoney(vencidos) + ' vencido real' : 'Sin cartera vencida real registrada', kpis: [{ label: 'Cobros reales', value: mgrMoney(paid) }, { label: 'Registros', value: mgrNum(cobros.length) }], context: 'Finanzas: ' + cobros.length + ' cobros reales registrados por ' + mgrMoney(paid) + '.' };
  }
  if (area.id === 'calificaciones') {
    const vals = grades.map(g => Number(g.value || g.grade || g.calificacion || g.promedio)).filter(n => Number.isFinite(n) && n > 0);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { metric: vals.length ? avg.toFixed(1) : '0', metricLabel: 'promedio real capturado', count: vals.length, hasData: vals.length > 0 || students.length > 0, urgent: vals.length ? 'Calificaciones reales registradas' : 'Sin calificaciones reales capturadas', kpis: [{ label: 'Alumnos reales', value: mgrNum(students.length) }, { label: 'Calificaciones', value: mgrNum(vals.length) }], context: 'Académico: ' + students.length + ' alumnos reales; ' + vals.length + ' calificaciones reales capturadas.' };
  }
  if (area.id === 'dashboard-accesos') {
    const todayAccess = access.filter(x => String(x.date || x.fecha || x.createdAt || '').slice(0, 10) === today).length;
    return { metric: mgrNum(todayAccess), metricLabel: 'accesos reales de hoy', count: access.length, hasData: access.length > 0, urgent: access.length ? 'Registros de acceso reales disponibles' : 'Sin accesos reales registrados', kpis: [{ label: 'Hoy', value: mgrNum(todayAccess) }, { label: 'Histórico real', value: mgrNum(access.length) }], context: 'Control de Accesos: ' + todayAccess + ' registros reales hoy; ' + access.length + ' históricos.' };
  }
  if (area.id === 'punto-de-venta') {
    const total = pos.reduce((a, x) => a + (Number(x.total || x.amount || x.monto) || 0), 0);
    return { metric: mgrMoney(total), metricLabel: 'ventas reales registradas', count: pos.length, hasData: pos.length > 0, urgent: pos.length ? 'Ventas reales disponibles' : 'Sin ventas reales registradas', kpis: [{ label: 'Ventas reales', value: mgrMoney(total) }, { label: 'Tickets', value: mgrNum(pos.length) }], context: 'Tiendita: ' + pos.length + ' ventas reales registradas por ' + mgrMoney(total) + '.' };
  }
  const capacity = Number(db.settings.capacity || db.settings.cupoTotal || 0) || 0;
  const occ = capacity ? students.length / capacity * 100 : 0;
  return { metric: capacity ? mgrPct(occ) : '0%', metricLabel: 'ocupación real', count: students.length, hasData: students.length > 0 || clases.length > 0 || capacity > 0, urgent: capacity ? students.length + ' de ' + capacity + ' lugares reales' : 'Sin cupo total real configurado', kpis: [{ label: 'Alumnos reales', value: mgrNum(students.length) }, { label: 'Grupos reales', value: mgrNum(clases.length) }], context: 'Business Intelligence: ' + students.length + ' alumnos reales; ' + clases.length + ' grupos reales' + (capacity ? '; cupo total ' + capacity + '.' : '.') };
}
function mgrSnapshots() { return MGR_AREAS.map(a => ({ ...a, ...mgrAreaSnapshot(a) })); }
function mgrMakeReport(areaIds, period, extra) {
  const areas = mgrSnapshots().filter(a => areaIds.includes(a.id));
  const hasData = areas.some(a => a.hasData);
  const title = areas.length === 1 ? 'Reporte real de ' + areas[0].label + ' · ' + period : 'Reporte ejecutivo real · ' + period;
  const resumen = hasData ? areas.map(a => a.context).join(' ') + (extra ? ' Enfoque solicitado: ' + extra + '.' : '') : 'No hay datos reales suficientes para generar conclusiones ejecutivas. Captura información real en los módulos operativos antes de emitir recomendaciones.';
  const hallazgos = hasData ? areas.filter(a => a.hasData).slice(0, 4).map(a => ({ tone: a.tone, text: a.context })) : [{ tone: 'amber', text: 'Manager no encontró datos reales para el alcance seleccionado.' }];
  const recomendaciones = hasData ? ['Validar la información en cada módulo operativo antes de tomar decisiones.', 'Actualizar capturas pendientes para tener un tablero ejecutivo completo.'] : ['Capturar datos reales en los módulos correspondientes.', 'Evitar reportes ejecutivos con datos incompletos.'];
  return { id: 'mgr_' + Date.now() + '_' + Math.random().toString(16).slice(2), title, areaIds, period, date: new Date().toLocaleString('es-MX'), source: 'real-only', resumen, kpis: areas.flatMap(a => a.kpis).slice(0, 4), hallazgos, recomendaciones, real: true, createdAt: new Date().toISOString() };
}
function ManagerAreaCard({ area, go }) {
  const t = window.TONE[area.tone] || window.TONE.blue;
  return <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div className="row between center"><div className="row center gap-10"><div className="kpi-ico" style={{ background: t.bg, color: t.c, margin: 0 }}><Icon name={area.icon} size={18} /></div><div><div style={{ fontWeight: 700 }}>{area.label}</div><div className="faint" style={{ fontSize: 12 }}>{area.metricLabel}</div></div></div>{area.hasData ? <Badge tone="green" dot>Real</Badge> : <Badge tone="gray">Sin datos</Badge>}</div>
    <div className="font-display tnum" style={{ fontWeight: 800, fontSize: 28 }}>{area.metric}</div>
    <div className="faint" style={{ fontSize: 12.5 }}>{area.urgent}</div>
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>{area.kpis.map((k, i) => <div key={i} className="kv"><span className="k">{k.label}</span><span className="v">{k.value}</span></div>)}</div>
    {go && <button className="btn sm" onClick={() => go(area.route || area.id)} style={{ justifyContent: 'center' }}>Abrir módulo</button>}
  </div>;
}
function ManagerReportGen({ onReport }) {
  const snaps = mgrSnapshots();
  const [sel, setSel] = React.useState(snaps.map(a => a.id));
  const [period, setPeriod] = React.useState('Esta semana');
  const [extra, setExtra] = React.useState('');
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allSel = sel.length === snaps.length;
  function generate() {
    if (!sel.length) return toast('Selecciona al menos un área', 'warn');
    const rep = mgrMakeReport(sel, period, extra.trim());
    onReport(rep);
    setExtra('');
    toast('Reporte real generado', 'ok');
  }
  return <div className="ai-panel" style={{ alignSelf: 'start' }}><div className="ai-panel-head"><div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div><div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>Generar reporte real</div><div className="faint" style={{ fontSize: 11.5 }}>Solo con datos capturados, sin plantillas demo</div></div></div><div className="col" style={{ gap: 14, padding: '14px 2px 2px' }}><div><div className="eyebrow" style={{ marginBottom: 8 }}>Alcance</div><div className="row wrap" style={{ gap: 7 }}><button className={'chip-btn ' + (allSel ? '' : 'plain')} onClick={() => setSel(allSel ? [] : snaps.map(a => a.id))}>Integral</button>{snaps.map(a => <button key={a.id} className={'chip-btn ' + (sel.includes(a.id) && !allSel ? '' : 'plain')} onClick={() => toggle(a.id)}>{a.label}</button>)}</div></div><div><div className="eyebrow" style={{ marginBottom: 8 }}>Periodo</div><div className="row wrap" style={{ gap: 7 }}>{MGR_PERIODS.map(p => <button key={p} className={'chip-btn ' + (period === p ? '' : 'plain')} onClick={() => setPeriod(p)}>{p}</button>)}</div></div><TextInput value={extra} onChange={e => setExtra(e.target.value)} placeholder="Indicaciones reales del reporte" /><button className="btn primary" style={{ justifyContent: 'center' }} onClick={generate}><Icon name="doc" size={15} className="btn-ico" />Generar reporte</button></div></div>;
}
function ManagerReportModal({ report, onClose }) {
  if (!report) return null;
  return <Modal open title={report.title} onClose={onClose} width={720} footer={<><button className="btn" onClick={onClose}>Cerrar</button></>}><div className="col" style={{ gap: 18 }}><div className="row center wrap" style={{ gap: 7 }}><Badge tone="green" dot>Real-only</Badge><Badge tone="blue">{report.period}</Badge><span className="faint" style={{ fontSize: 11.5, marginLeft: 'auto' }}>{report.date}</span></div><div><div className="eyebrow" style={{ marginBottom: 7 }}>Resumen ejecutivo</div><p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65 }}>{report.resumen}</p></div><div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>{(report.kpis || []).map((k, i) => <div key={i} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '11px 13px' }}><div className="faint" style={{ fontSize: 11.5 }}>{k.label}</div><div className="font-display tnum" style={{ fontSize: 19, fontWeight: 700 }}>{k.value}</div></div>)}</div><div><div className="eyebrow" style={{ marginBottom: 9 }}>Hallazgos reales</div><div className="col" style={{ gap: 9 }}>{(report.hallazgos || []).map((h, i) => <div key={i} className="row" style={{ gap: 10, alignItems: 'flex-start' }}><div className="insight-ico" style={{ width: 26, height: 26, flexShrink: 0 }}><Icon name="target" size={13} /></div><span style={{ fontSize: 13, lineHeight: 1.55, paddingTop: 3 }}>{h.text}</span></div>)}</div></div><div><div className="eyebrow" style={{ marginBottom: 9 }}>Recomendaciones</div><div className="col" style={{ gap: 8 }}>{(report.recomendaciones || []).map((r, i) => <div key={i} className="row" style={{ gap: 10, alignItems: 'flex-start' }}><span className="font-mono" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-soft, var(--surface-2))', border: '1px solid var(--border)', borderRadius: 6, width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span><span style={{ fontSize: 13, lineHeight: 1.55, paddingTop: 2 }}>{r}</span></div>)}</div></div></div></Modal>;
}
function ManagerHub({ go }) {
  useStore();
  const [viewing, setViewing] = React.useState(null);
  const reports = mgrReports();
  const snaps = mgrSnapshots();
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  function addReport(rep) { DB.settings.managerReports = [rep, ...mgrReports()]; mgrSave(); setViewing(rep); }
  function removeReport(id) { DB.settings.managerReports = mgrReports().filter(r => r.id !== id); mgrSave(); toast('Reporte eliminado', 'warn'); }
  const anyData = snaps.some(s => s.hasData) || reports.length;
  return <div className="content-inner"><PageHead eyebrow="Principal" title="Manager" desc="Centro de mando real · sin métricas, hallazgos ni reportes de muestra" />
    <SectionHead eyebrow={today} title="Pulso real del colegio" />
    {!anyData && <div className="card pad" style={{ textAlign: 'center', padding: 34, marginBottom: 18 }}><div className="kpi-ico" style={{ margin: '0 auto 12px' }}><Icon name="layers" size={22} /></div><div style={{ fontWeight: 700, fontSize: 18 }}>Manager sin datos reales</div><div className="faint" style={{ maxWidth: 720, margin: '8px auto 18px', lineHeight: 1.55 }}>Se eliminaron las métricas ejecutivas precargadas. Al entrar desde otro navegador, Manager ya no mostrará admisiones, finanzas, académico, accesos, tiendita ni BI inventados.</div></div>}
    <SectionHead eyebrow="Áreas operativas" title="Módulos con datos reales" />
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', marginBottom: 18 }}>{snaps.map(a => <ManagerAreaCard key={a.id} area={a} go={go} />)}</div>
    <SectionHead eyebrow="Reportes" title="Reportes ejecutivos reales" />
    <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', alignItems: 'start' }}><ManagerReportGen onReport={addReport} /><div className="card"><CardHead icon="doc" title="Reportes recientes" sub={reports.length + ' generados'} /><div>{!reports.length && <div className="faint" style={{ padding: '18px 16px', fontSize: 12.5 }}>Aún no hay reportes reales.</div>}{reports.map(r => <div className="lrow clickable" key={r.id} onClick={() => setViewing(r)} style={{ cursor: 'pointer' }}><div className="insight-ico" style={{ width: 34, height: 34, flexShrink: 0 }}><Icon name="doc" size={16} /></div><div className="grow" style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div><div className="faint" style={{ fontSize: 12 }}>{r.period} · {r.date}</div></div><div onClick={e => e.stopPropagation()}><button className="icon-btn danger" onClick={() => removeReport(r.id)}><Icon name="trash" size={15} /></button></div></div>)}</div></div></div><ManagerReportModal report={viewing} onClose={() => setViewing(null)} /></div>;
}
Object.assign(window, { ManagerHub, mgrDB, mgrSnapshots, mgrReports, mgrMakeReport });
