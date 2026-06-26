/* views_dashboard.jsx — Vista general (Dashboard) */

window.TONE = {
  blue: { c: 'var(--accent)', bg: 'var(--accent-soft)' },
  green: { c: 'var(--green)', bg: 'var(--green-soft)' },
  amber: { c: 'oklch(0.62 0.13 70)', bg: 'var(--amber-soft)' },
  red: { c: 'var(--red)', bg: 'var(--red-soft)' },
  violet: { c: 'var(--violet)', bg: 'var(--violet-soft)' },
  cyan: { c: 'oklch(0.55 0.1 222)', bg: 'var(--cyan-soft)' },
};

function KpiCard({ k, i }) {
  const t = window.TONE[k.tone] || window.TONE.blue;
  return (
    <div className="card kpi rise" style={{ animationDelay: (i * 0.05) + 's' }}>
      <div className="kpi-ico" style={{ background: t.bg, color: t.c }}>
        <Icon name={k.icon} size={19} />
      </div>
      <div className="kpi-label">{k.label}</div>
      <div className="kpi-value tnum">{k.value}{k.unit && <span className="unit">{k.unit}</span>}</div>
      <div className="kpi-foot">
        <Delta value={k.delta} />
        <span className="muted">{k.foot}</span>
      </div>
      <div style={{ position: 'absolute', right: 14, bottom: 12, opacity: 0.9 }}>
        <Sparkline data={k.spark} color={t.c} w={72} h={28} />
      </div>
    </div>
  );
}

/* Variantes de KPI por periodo (demo) */
const KPI_PERIODS = {
  'Día': {
    alumnos: { foot: '2 altas hoy', delta: 0.2 },
    asistencia: { value: '94.6', foot: '1,215 presentes', delta: 1.1 },
    ingresos: { label: 'Ingresos de hoy', value: '$182', unit: 'k', foot: 'cobrado al corte', delta: 4.8 },
    cartera: { foot: 'sin cambios hoy', delta: -0.4 },
    admisiones: { foot: '5 nuevos hoy', delta: 2.7 },
  },
  'Semana': {
    alumnos: { foot: '8 altas esta semana', delta: 0.6 },
    asistencia: { value: '93.8', foot: 'promedio semanal', delta: 0.4 },
    ingresos: { label: 'Ingresos de la semana', value: '$1.12', unit: 'M', foot: 'esta semana', delta: 5.3 },
    cartera: { foot: '6 familias regularizadas', delta: -2.1 },
    admisiones: { foot: '38 nuevos esta semana', delta: 12.5 },
  },
  'Mes': null,
  'Ciclo': {
    alumnos: { foot: 'vs. ciclo anterior', delta: 3.2 },
    asistencia: { value: '93.4', foot: 'promedio del ciclo', delta: 0.8 },
    ingresos: { label: 'Ingresos del ciclo', value: '$4.82', unit: 'M', foot: 'acumulado del ciclo', delta: 6.4 },
    cartera: { foot: '142 familias', delta: -8.3 },
    admisiones: { foot: 'total del ciclo', delta: 12.5 },
  },
};
const INSIGHT_GO = { 1: 'calificaciones', 2: 'finanzas', 3: 'pipeline' };

/* KPIs del dashboard derivados de datos reales del ciclo (roster, cobros, cartera, prospectos). */
function dashRoster() { try { return window.ctaStudents ? window.ctaStudents() : []; } catch (e) { return []; } }
function dashAdeudos() { try { return window.ctaAdeudos ? window.ctaAdeudos() : []; } catch (e) { return []; } }
function dashCobros() { return (window.DB && DB.cobros) || []; }
function dashLeads() { return (window.DB && DB.leads) || []; }
function dashClasesAsistencia() {
  const cl = (window.DB && DB.clases && DB.clases.length) ? DB.clases : (window.CLASES_SEED || []);
  const con = cl.filter(c => (c.alumnos || 0) > 0 && (c.asistencia || 0) > 0);
  if (!con.length) return null;
  return con.reduce((a, c) => a + c.asistencia, 0) / con.length;
}
function dashLiveKpis(period) {
  const roster = dashRoster();
  /* ctaStudents() ya incluye a los alumnos manuales (DB.students); no sumar de nuevo. */
  const nAlumnos = roster.length;
  const cobros = dashCobros();
  const mesISO = new Date().toISOString().slice(0, 7);
  const ingMes = cobros.filter(c => String(c.date || '').slice(0, 7) === mesISO).reduce((a, c) => a + (c.amount || 0), 0);
  const ingCiclo = cobros.reduce((a, c) => a + (c.amount || 0), 0);
  const ing = period === 'Ciclo' ? ingCiclo : ingMes;
  const adeudos = dashAdeudos();
  const cartera = adeudos.reduce((a, s) => a + (s.saldo || 0), 0);
  const leads = dashLeads();
  const admis = leads.filter(l => l.stage !== 'Inscritos').length;
  const asis = dashClasesAsistencia();
  return [
    { id: 'alumnos', label: 'Estudiantes activos', icon: 'cap', tone: 'blue', value: fmtNum(nAlumnos), delta: 0, foot: nAlumnos ? 'inscritos en el ciclo' : 'sin inscripciones', spark: [] },
    { id: 'asistencia', label: 'Asistencia', unit: asis != null ? '%' : '', icon: 'checkCircle', tone: 'green', value: asis != null ? asis.toFixed(1) : '—', delta: 0, foot: asis != null ? 'promedio de grupos' : 'sin registros', spark: [] },
    { id: 'ingresos', label: period === 'Ciclo' ? 'Ingresos del ciclo' : 'Ingresos del mes', icon: 'wallet', tone: 'violet', value: '$' + fmtShort(ing), delta: 0, foot: ing ? 'cobrado' : 'sin cobros', spark: [] },
    { id: 'cartera', label: 'Saldo por cobrar', icon: 'wallet', tone: 'amber', value: '$' + fmtShort(cartera), delta: 0, foot: adeudos.length + (adeudos.length === 1 ? ' familia con saldo' : ' familias con saldo'), spark: [], invert: true },
    { id: 'admisiones', label: 'Admisiones en proceso', icon: 'funnel', tone: 'cyan', value: fmtNum(admis), delta: 0, foot: leads.length + (leads.length === 1 ? ' prospecto' : ' prospectos'), spark: [] },
  ];
}

function Dashboard({ go, openCopilot }) {
  const store = useStore();
  const d = DB;
  const [period, setPeriod] = React.useState('Mes');
  const [, _forceUser] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    const h = () => _forceUser();
    window.addEventListener('piaget-settings', h);
    return () => window.removeEventListener('piaget-settings', h);
  }, []);
  const me = window.piagetActiveUser ? window.piagetActiveUser() : { firstName: d.user.name };
  const kpis = dashLiveKpis(period);
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  function exportar() {
    const rows = [['Indicador', 'Valor', 'Variación %', 'Nota', 'Periodo']].concat(
      kpis.map(k => [k.label, k.value + (k.unit || ''), k.delta, k.foot, period]));
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'resumen-piaget-' + period.toLowerCase() + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Resumen exportado (' + period + ') ✓');
  }
  return (
    <div className="content-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 7 }}>{d.school.name} · {d.school.cycle}</div>
          <h1 className="page-title">Buen día, {me.firstName}</h1>
          <p className="page-desc">Esto es lo que pasa hoy, {today}. {d.alerts.length ? <>Tienes <b style={{ color: 'var(--text)' }}>{d.alerts.length} alertas</b> que requieren tu atención.</> : 'Sin alertas pendientes por ahora.'}</p>
        </div>
        <div className="page-actions">
          <div className="seg">
            {['Día', 'Semana', 'Mes', 'Ciclo'].map(p => (
              <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>{p}</button>
            ))}
          </div>
          <button className="btn" onClick={exportar}><Icon name="download" size={15} className="btn-ico" />Exportar</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        {kpis.map((k, i) => <KpiCard key={k.id + period} k={k} i={i} />)}
      </div>

      {/* Fila principal: tendencia + IA */}
      <div className="grid mt-16" style={{ gridTemplateColumns: '1.55fr 1fr' }}>
        <div className="card">
          <CardHead icon="trendUp" title={d.enrollTrend.series.length > 1 ? 'Matrícula y proyección' : 'Matrícula del ciclo'} sub={d.enrollTrend.series.length > 1 ? 'Inscritos reales vs. proyección del modelo' : 'Inscritos por mes'}
            right={<div className="row gap-16">
              {d.enrollTrend.series.map((s, i) => (
                <span key={i} className="row center gap-8" style={{ fontSize: 12.5 }}><span style={{ width: 10, height: 3, borderRadius: 2, background: s.color || 'var(--accent)' }} />{s.name}</span>
              ))}
            </div>} />
          <div className="card pad" style={{ borderTop: 'none' }}>
            <AreaChart series={d.enrollTrend.series} labels={d.enrollTrend.labels} height={232} />
          </div>
        </div>

        {/* IA Insights */}
        <div className="ai-panel rise" style={{ animationDelay: '0.1s' }}>
          <div className="ai-panel-head">
            <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
            <div className="grow">
              <div style={{ fontWeight: 600, fontSize: 14 }}>Copilot · Insights</div>
              <div className="faint" style={{ fontSize: 11.5 }}>Actualizado hace 4 min</div>
            </div>
            <span className="live-dot" />
          </div>
          {d.insights.map(ins => {
            const t = window.TONE[ins.tone];
            return (
              <div className="insight" key={ins.id}>
                <div className="insight-ico" style={{ background: t.bg, color: t.c }}><Icon name={ins.icon} size={16} /></div>
                <div className="insight-body">
                  <div className="insight-title">{ins.title}</div>
                  <div className="insight-text" dangerouslySetInnerHTML={{ __html: ins.text }} />
                  <div className="insight-actions">
                    {ins.actions.map((a, i) => (
                      <button key={a} className={'chip-btn' + (i ? ' plain' : '')}
                        onClick={() => {
                          if (i === 0) { go && go(INSIGHT_GO[ins.id] || 'home'); }
                          else if (openCopilot) { openCopilot(); }
                        }}>{a}</button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {!d.insights.length && <div className="faint" style={{ fontSize: 12.5, padding: '14px 16px' }}>Sin insights por ahora. El Copilot generará recomendaciones cuando haya datos del ciclo.</div>}
        </div>
      </div>

      {/* Fila secundaria */}
      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        {/* Finanzas resumen */}
        <div className="card">
          <CardHead icon="wallet" title="Flujo del mes" sub="Ingresos vs. egresos"
            right={<button className="btn ghost sm" onClick={() => go('finanzas')}>Detalle<Icon name="chevR" size={14} /></button>} />
          <div className="card pad" style={{ borderTop: 'none' }}>
            <BarChart data={[d.financeMonthly.ingresos, d.financeMonthly.egresos]} labels={d.financeMonthly.labels}
              colors={['var(--accent)', 'var(--surface-3)']} height={170} money />
            <div className="row gap-16 mt-12" style={{ fontSize: 12.5 }}>
              <span className="row center gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} />Ingresos</span>
              <span className="row center gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--surface-3)' }} />Egresos</span>
            </div>
          </div>
        </div>

        {/* Alertas inteligentes */}
        <div className="card">
          <CardHead icon="bell" title="Alertas inteligentes" sub="Priorizadas por IA"
            right={<Badge tone="red" dot>{d.alerts.length} activas</Badge>} />
          <div>
            {d.alerts.map((a, i) => {
              const t = window.TONE[a.tone];
              return (
                <button className="lrow clickable" key={i} onClick={() => a.go && go(a.go)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: i < d.alerts.length - 1 ? '1px solid var(--border)' : 'none', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>
                  <div className="insight-ico" style={{ background: t.bg, color: t.c, width: 32, height: 32 }}><Icon name={a.icon} size={16} /></div>
                  <div className="grow">
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.title}</div>
                    <div className="faint" style={{ fontSize: 12.5 }}>{a.text}</div>
                  </div>
                  <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
                    <span className="faint nowrap" style={{ fontSize: 11.5 }}>{a.time}</span>
                    <Icon name="chevR" size={14} className="faint" />
                  </div>
                </button>
              );
            })}
            {!d.alerts.length && <div className="faint" style={{ fontSize: 12.5, padding: '16px 20px' }}>Sin alertas activas.</div>}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="card">
          <CardHead icon="clock" title="Actividad reciente" sub="Tiempo real"
            right={<span className="live-dot" />} />
          <div>
            {d.activity.map((a, i) => (
              <div className="lrow" key={i}>
                <div className="insight-ico" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)', width: 32, height: 32 }}><Icon name={a.icon} size={15} /></div>
                <div className="grow">
                  <div style={{ fontSize: 13.5 }}><b>{a.who}</b> <span className="muted">{a.action}</span></div>
                </div>
                <div className="faint nowrap font-mono" style={{ fontSize: 11.5 }}>{a.time}</div>
              </div>
            ))}
            {!d.activity.length && <div className="faint" style={{ fontSize: 12.5, padding: '16px 20px' }}>Sin actividad reciente.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
window.KpiCard = KpiCard;
