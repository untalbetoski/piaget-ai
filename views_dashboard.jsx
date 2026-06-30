/* views_dashboard.jsx — Home/Dashboard con datos reales únicamente */

window.TONE = {
  blue: { c: 'var(--accent)', bg: 'var(--accent-soft)' },
  green: { c: 'var(--green)', bg: 'var(--green-soft)' },
  amber: { c: 'oklch(0.62 0.13 70)', bg: 'var(--amber-soft)' },
  red: { c: 'var(--red)', bg: 'var(--red-soft)' },
  violet: { c: 'var(--violet)', bg: 'var(--violet-soft)' },
  cyan: { c: 'oklch(0.55 0.1 222)', bg: 'var(--cyan-soft)' },
  gray: { c: 'var(--text-faint)', bg: 'var(--surface-2)' },
};

function KpiCard({ k, i }) {
  const t = window.TONE[k.tone] || window.TONE.blue;
  return <div className="card kpi rise" style={{ animationDelay: (i * 0.05) + 's' }}>
    <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
    <div className="kpi-label">{k.label}</div>
    <div className="kpi-value tnum">{k.value}{k.unit && <span className="unit">{k.unit}</span>}</div>
    <div className="kpi-foot"><Delta value={0} /><span className="muted">{k.foot}</span></div>
    <div style={{ position: 'absolute', right: 14, bottom: 12, opacity: 0.9 }}><Sparkline data={k.spark || []} color={t.c} w={72} h={28} /></div>
  </div>;
}

function dashArr(k) { return (window.DB && Array.isArray(DB[k])) ? DB[k] : []; }
function dashNum(v) { return Number(v || 0) || 0; }
function dashMoney(v) { return '$' + (typeof fmtShort === 'function' ? fmtShort(v) : dashNum(v).toLocaleString('es-MX')); }
function dashIsSeedClass(c) { return /^cls-\d+$/i.test(String((c && c._id) || '')); }
function dashDeletedClassIds() { try { return new Set((DB.settings && DB.settings.deletedClassIds) || []); } catch (_) { return new Set(); } }
function dashClasses() { const del = dashDeletedClassIds(); return dashArr('clases').filter(c => c && !dashIsSeedClass(c) && !del.has(c._id) && String(c.g || '').trim()); }
function dashStudents() { return dashArr('students').filter(s => s && (s.name || s._id || s.id)); }
function dashDocentes() { return dashArr('docentes').filter(d => d && (d.name || d._id || d.id)); }
function dashCobros() { return dashArr('cobros').filter(c => c && dashNum(c.amount || c.monto || c.total) > 0); }
function dashEgresos() { return dashArr('egresos').filter(e => e && dashNum(e.amount || e.monto || e.total) > 0); }
function dashLeads() { return dashArr('leads').filter(l => l && (l.name || l.nombre || l.email || l._id || l.id)); }
function dashMonthKey(v) { const s = String(v || ''); return /^\d{4}-\d{2}/.test(s) ? s.slice(0, 7) : ''; }
function dashToday() { return new Date().toISOString().slice(0, 10); }
function dashCurrentMonth() { return new Date().toISOString().slice(0, 7); }
function dashLastMonths(n) {
  const out = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({ key: x.toISOString().slice(0, 7), label: x.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '') });
  }
  return out;
}
function dashStudentMonth(s) { return dashMonthKey(s.created_at || s.createdAt || s.fechaAlta || s.date || s.ingreso); }
function dashPayMonth(c) { return dashMonthKey(c.date || c.fecha || c.created_at || c.createdAt); }
function dashAmount(x) { return dashNum(x.amount || x.monto || x.total || x.value); }
function dashRiskStudents() {
  return dashStudents().filter(s => {
    const risk = String(s.risk || '').toLowerCase();
    const avg = s.avg == null || s.avg === '' ? null : dashNum(s.avg);
    const att = s.att == null && s.asis == null && s.asistencia == null ? null : dashNum(s.att != null ? s.att : (s.asis != null ? s.asis : s.asistencia));
    return risk === 'high' || risk === 'alto' || (avg != null && avg < 7) || (att != null && att < 75);
  });
}
function dashPendingBalance() {
  const facturas = dashArr('facturas').filter(f => f && !/pagad/i.test(String(f.status || f.estatus || '')));
  const invoices = dashArr('invoices').filter(f => f && f._real === true && !/pagad/i.test(String(f.status || f.estatus || '')));
  return facturas.concat(invoices).reduce((a, f) => a + dashAmount(f), 0);
}
function dashKpis(period) {
  const students = dashStudents();
  const clases = dashClasses();
  const docentes = dashDocentes();
  const leads = dashLeads().filter(l => !/inscrit/i.test(String(l.stage || l.etapa || '')));
  const cobros = dashCobros();
  const egresos = dashEgresos();
  const month = dashCurrentMonth();
  const today = dashToday();
  const income = cobros.filter(c => period === 'Día' ? String(c.date || c.fecha || '').slice(0, 10) === today : period === 'Ciclo' ? true : dashPayMonth(c) === month).reduce((a, c) => a + dashAmount(c), 0);
  const expense = egresos.filter(e => period === 'Día' ? String(e.date || e.fecha || '').slice(0, 10) === today : period === 'Ciclo' ? true : dashPayMonth(e) === month).reduce((a, e) => a + dashAmount(e), 0);
  const asistenciaVals = students.map(s => s.att != null ? dashNum(s.att) : s.asis != null ? dashNum(s.asis) : s.asistencia != null ? dashNum(s.asistencia) : null).filter(v => v != null && v > 0);
  const asistencia = asistenciaVals.length ? asistenciaVals.reduce((a, v) => a + v, 0) / asistenciaVals.length : null;
  const balance = Math.max(0, income - expense);
  return [
    { id: 'alumnos', label: 'Estudiantes reales', value: fmtNum(students.length), icon: 'cap', tone: 'blue', foot: students.length ? 'dados de alta' : 'sin alumnos registrados', spark: [] },
    { id: 'clases', label: 'Grupos reales', value: fmtNum(clases.length), icon: 'layers', tone: 'cyan', foot: clases.length ? 'creados en Clases' : 'sin grupos registrados', spark: [] },
    { id: 'docentes', label: 'Docentes reales', value: fmtNum(docentes.length), icon: 'users', tone: 'green', foot: docentes.length ? 'dados de alta' : 'sin docentes registrados', spark: [] },
    { id: 'ingresos', label: period === 'Ciclo' ? 'Ingresos reales ciclo' : period === 'Día' ? 'Ingresos reales hoy' : 'Ingresos reales mes', value: dashMoney(income), icon: 'wallet', tone: 'violet', foot: income ? 'registrados en cobros' : 'sin cobros reales', spark: [] },
    { id: 'admisiones', label: 'Prospectos reales', value: fmtNum(leads.length), icon: 'funnel', tone: 'amber', foot: leads.length ? 'en proceso' : 'sin prospectos reales', spark: [] },
  ];
}
function dashEnrollmentTrend() {
  const months = dashLastMonths(6);
  const students = dashStudents();
  const data = months.map(m => students.filter(s => dashStudentMonth(s) && dashStudentMonth(s) <= m.key).length);
  return { labels: months.map(m => m.label), series: [{ name: 'Inscritos reales', data }] };
}
function dashFinanceTrend() {
  const months = dashLastMonths(6);
  const cobros = dashCobros();
  const egresos = dashEgresos();
  return { labels: months.map(m => m.label), ingresos: months.map(m => cobros.filter(c => dashPayMonth(c) === m.key).reduce((a, c) => a + dashAmount(c), 0)), egresos: months.map(m => egresos.filter(e => dashPayMonth(e) === m.key).reduce((a, e) => a + dashAmount(e), 0)) };
}
function dashInsights() {
  const out = [];
  const risk = dashRiskStudents();
  const pending = dashPendingBalance();
  const leads = dashLeads().filter(l => !/inscrit/i.test(String(l.stage || l.etapa || '')));
  if (risk.length) out.push({ tone: 'amber', icon: 'alert', title: risk.length + ' estudiante(s) con posible riesgo', text: 'Basado únicamente en alumnos reales con baja asistencia, bajo promedio o riesgo marcado.', go: 'calificaciones' });
  if (pending > 0) out.push({ tone: 'red', icon: 'wallet', title: 'Saldo real pendiente', text: 'Hay ' + dashMoney(pending) + ' registrado como pendiente en facturas/cobros reales.', go: 'cobros' });
  if (leads.length) out.push({ tone: 'blue', icon: 'funnel', title: leads.length + ' prospecto(s) reales en seguimiento', text: 'Datos tomados únicamente del CRM real.', go: 'pipeline' });
  return out;
}
function dashActivity() { return []; }

function Dashboard({ go, openCopilot }) {
  useStore();
  const [period, setPeriod] = React.useState('Mes');
  const me = window.piagetActiveUser ? window.piagetActiveUser() : { firstName: (DB.user && DB.user.name || 'Dirección').split(' ')[0] };
  const kpis = dashKpis(period);
  const trend = dashEnrollmentTrend();
  const finance = dashFinanceTrend();
  const insights = dashInsights();
  const activity = dashActivity();
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  function exportar() {
    const rows = [['Indicador', 'Valor', 'Nota', 'Periodo']].concat(kpis.map(k => [k.label, k.value + (k.unit || ''), k.foot, period]));
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'resumen-real-piaget-' + period.toLowerCase() + '.csv';
    a.click(); URL.revokeObjectURL(a.href);
    toast('Resumen real exportado (' + period + ') ✓');
  }
  return <div className="content-inner">
    <div className="page-head"><div><div className="eyebrow" style={{ marginBottom: 7 }}>{(DB.school && DB.school.name) || 'PIAGET'} · datos reales</div><h1 className="page-title">Buen día, {me.firstName}</h1><p className="page-desc">Esto es lo que hay registrado hoy, {today}. Si no hay capturas reales, Home muestra cero o vacío.</p></div><div className="page-actions"><div className="seg">{['Día', 'Semana', 'Mes', 'Ciclo'].map(p => <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>{p}</button>)}</div><button className="btn" onClick={exportar}><Icon name="download" size={15} className="btn-ico" />Exportar</button></div></div>
    <div className="kpi-row">{kpis.map((k, i) => <KpiCard key={k.id + period} k={k} i={i} />)}</div>
    <div className="grid mt-16" style={{ gridTemplateColumns: '1.55fr 1fr' }}><div className="card"><CardHead icon="trendUp" title="Matrícula real" sub="Acumulado por mes desde alumnos dados de alta" /><div className="card pad" style={{ borderTop: 'none' }}><AreaChart series={trend.series} labels={trend.labels} height={232} /></div></div><div className="ai-panel rise" style={{ animationDelay: '0.1s' }}><div className="ai-panel-head"><div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div><div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>Copilot · Insights reales</div><div className="faint" style={{ fontSize: 11.5 }}>Sin datos inventados</div></div></div>{insights.map((ins, i) => { const t = window.TONE[ins.tone] || window.TONE.blue; return <div className="insight" key={i}><div className="insight-ico" style={{ background: t.bg, color: t.c }}><Icon name={ins.icon} size={16} /></div><div className="insight-body"><div className="insight-title">{ins.title}</div><div className="insight-text">{ins.text}</div><div className="insight-actions"><button className="chip-btn" onClick={() => go && go(ins.go)}>Ver módulo</button>{openCopilot && <button className="chip-btn plain" onClick={openCopilot}>Preguntar a Copilot</button>}</div></div></div>; })}{!insights.length && <div className="faint" style={{ fontSize: 12.5, padding: '14px 16px' }}>Sin insights por ahora. Se generarán cuando existan datos reales suficientes.</div>}</div></div>
    <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}><div className="card"><CardHead icon="wallet" title="Flujo real del mes" sub="Ingresos vs. egresos registrados" right={<button className="btn ghost sm" onClick={() => go && go('finanzas')}>Detalle<Icon name="chevR" size={14} /></button>} /><div className="card pad" style={{ borderTop: 'none' }}><BarChart data={[finance.ingresos, finance.egresos]} labels={finance.labels} colors={['var(--accent)', 'var(--surface-3)']} height={170} money /><div className="row gap-16 mt-12" style={{ fontSize: 12.5 }}><span className="row center gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} />Ingresos</span><span className="row center gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--surface-3)' }} />Egresos</span></div></div></div><div className="card"><CardHead icon="bell" title="Alertas reales" sub="Solo derivadas de registros existentes" right={<Badge tone={insights.length ? 'amber' : 'green'} dot>{insights.length} activas</Badge>} /><div>{insights.map((a, i) => { const t = window.TONE[a.tone] || window.TONE.blue; return <button className="lrow clickable" key={i} onClick={() => a.go && go && go(a.go)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: i < insights.length - 1 ? '1px solid var(--border)' : 'none', font: 'inherit', color: 'inherit', cursor: 'pointer' }}><div className="insight-ico" style={{ background: t.bg, color: t.c, width: 32, height: 32 }}><Icon name={a.icon} size={16} /></div><div className="grow"><div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.title}</div><div className="faint" style={{ fontSize: 12.5 }}>{a.text}</div></div><Icon name="chevR" size={14} className="faint" /></button>; })}{!insights.length && <div className="faint" style={{ fontSize: 12.5, padding: '16px 20px' }}>Sin alertas reales activas.</div>}</div></div><div className="card"><CardHead icon="clock" title="Actividad reciente" sub="Sin eventos demo" right={<span className="live-dot" />} /><div>{activity.map((a, i) => <div className="lrow" key={i}><div className="insight-ico" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)', width: 32, height: 32 }}><Icon name={a.icon || 'clock'} size={15} /></div><div className="grow"><div style={{ fontSize: 13.5 }}><b>{a.who}</b> <span className="muted">{a.action}</span></div></div><div className="faint nowrap font-mono" style={{ fontSize: 11.5 }}>{a.time}</div></div>)}{!activity.length && <div className="faint" style={{ fontSize: 12.5, padding: '16px 20px' }}>Sin actividad real reciente.</div>}</div></div></div>
  </div>;
}

window.Dashboard = Dashboard;
window.KpiCard = KpiCard;
