/* views_manager.jsx — Manager: centro de mando + reportes con IA bajo demanda */

/* ============================================================
   Definición de áreas: métrica viva, contexto para la IA y
   contenido de respaldo (hallazgos/recomendaciones por plantilla)
   ============================================================ */
const MGR_AREAS = [
  {
    id: 'pipeline', label: 'CRM y Admisiones', icon: 'funnel', tone: 'cyan',
    metric: '186', metricLabel: 'procesos activos', delta: 12.5, spark: [120, 132, 145, 150, 165, 175, 186],
    urgent: '18 prospectos fríos hace +10 días',
    kpis: [{ label: 'Procesos activos', value: '186', delta: 12.5 }, { label: 'Conversión funnel', value: '17%' }],
    ctx: 'Admisiones: funnel con 540 prospectos, 386 contactados, 244 visitas, 168 entrevistas y 92 inscritos (conversión 17%). 18 familias llevan +10 días sin contacto en etapa Entrevista. Fuentes: recomendación 38%, redes 27%, web 19%, eventos 16%.',
    headline: 'Admisiones crece +12.5% con 186 procesos activos y conversión de 17%.',
    hallazgos: [
      { tone: 'amber', text: 'El cuello de botella está en Entrevista → Inscripción: 18 familias frías hace +10 días (~$1.1M potenciales).' },
      { tone: 'green', text: 'Recomendación sigue siendo la fuente más efectiva (38% de los prospectos).' },
    ],
    recs: ['Reactivar con secuencia personalizada a las 18 familias detenidas en Entrevista.', 'Asignar responsable a los 12 prospectos sin dueño en el pipeline.'],
  },
  {
    id: 'cobros', label: 'Finanzas', icon: 'wallet', tone: 'violet',
    metric: '$4.82M', metricLabel: 'ingresos de agosto', delta: 6.4, spark: [3.9, 4.1, 4.0, 4.3, 4.5, 4.6, 4.82],
    urgent: '$326k vencido a +60 días',
    kpis: [{ label: 'Ingresos del mes', value: '$4.82M', delta: 6.4 }, { label: 'Cartera vencida', value: '$612k', delta: -8.3 }],
    ctx: 'Finanzas: ingresos de agosto $4.82M (+6.4% vs julio, meta $4.5M ya superada). Egresos $3.60M, margen operativo 25.3%. Cartera vencida $612k en 142 familias; $326k con +60 días de atraso. Colegiaturas aportan $3.68M, inscripciones $620k.',
    headline: 'Finanzas supera la meta mensual con $4.82M (+6.4%) y margen de 25.3%.',
    hallazgos: [
      { tone: 'green', text: 'Agosto va +7.1% sobre la meta; a este ritmo cerrará en ~$4.9M, el mejor mes del ciclo.' },
      { tone: 'red', text: '$326k de cartera con +60 días concentrados en 142 familias; la antigüedad sigue siendo el riesgo principal.' },
    ],
    recs: ['Activar el agente de cobranza inteligente sobre el bucket de +60 días.', 'Ofrecer convenio de pago a las 30 familias con mayor adeudo acumulado.'],
  },
  {
    id: 'calificaciones', label: 'Académico', icon: 'cap', tone: 'blue',
    metric: '8.3', metricLabel: 'promedio general', delta: 1.2, spark: [8.0, 8.1, 8.0, 8.2, 8.2, 8.3, 8.3],
    urgent: '23 alumnos en riesgo de deserción',
    kpis: [{ label: 'Promedio general', value: '8.3' }, { label: 'Asistencia hoy', value: '94.6%', delta: 1.1 }],
    ctx: 'Académico: promedio general 8.3, asistencia de hoy 94.6% (1,215 presentes). 88 alumnos con promedio <7. El modelo de IA detecta 23 alumnos en riesgo de deserción, 9 de prioridad alta (asistencia <80% + caída de promedio). Materias más débiles: Ciencias 7.9 (−0.2) y Matemáticas 8.1.',
    headline: 'Lo académico se mantiene estable en 8.3 de promedio, con 23 alumnos en riesgo detectados por IA.',
    hallazgos: [
      { tone: 'red', text: '9 alumnos de prioridad alta combinan asistencia <80% con caída sostenida de promedio.' },
      { tone: 'amber', text: 'Ciencias es la única materia a la baja (7.9, −0.2 vs parcial anterior).' },
    ],
    recs: ['Generar plan de tutoría focalizada para los 9 alumnos de prioridad alta y notificar a tutores.', 'Revisar con academia la planeación de Ciencias antes del tercer parcial.'],
  },
  {
    id: 'dashboard-accesos', label: 'Control de Accesos', icon: 'shield', tone: 'green',
    metric: '1,176', metricLabel: 'personas en campus', spark: [240, 590, 980, 1120, 1160, 1170, 1176],
    urgent: '3 personas en cola de espera',
    kpis: [{ label: 'En campus ahora', value: '1,176' }, { label: 'Cola de espera', value: '3' }],
    ctx: 'Control de accesos: 1,176 personas en campus. 3 en cola de espera, incluido 1 visitante sin cita pendiente de verificación de identidad. La mayoría de los accesos se valida con QR; 1 alerta el día de hoy.',
    headline: 'El campus opera con normalidad: 1,176 personas dentro y solo 3 en cola.',
    hallazgos: [
      { tone: 'amber', text: 'Un visitante sin cita lleva 4 minutos en espera de verificación de identidad.' },
      { tone: 'green', text: 'El flujo matutino se procesó sin congestión; los accesos QR dominan el registro.' },
    ],
    recs: ['Resolver la verificación pendiente del visitante sin cita en recepción.'],
  },
  {
    id: 'punto-de-venta', label: 'Tiendita', icon: 'cart', tone: 'amber',
    metric: '$7,420', metricLabel: 'ventas de hoy', spark: [8200, 9100, 7600, 9800, 11200, 4300, 7420],
    urgent: '2 productos con stock bajo',
    kpis: [{ label: 'Ventas del mes', value: '$168.4k' }, { label: 'Ticket promedio', value: '$86' }],
    ctx: 'Tiendita: ventas de hoy $7,420; acumulado del mes $168,350 en 1,958 tickets (ticket promedio $86). Cafetería lidera con $84.2k, papelería $49.8k, uniformes $34.4k. Stock bajo: Playera del colegio (6 pzas) y Kit de arte (12 pzas).',
    headline: 'La tiendita acumula $168.4k en el mes con la cafetería como motor de venta.',
    hallazgos: [
      { tone: 'amber', text: 'Dos productos en stock crítico: Playera del colegio (6 pzas) y Kit de arte (12 pzas).' },
      { tone: 'green', text: 'El viernes fue el mejor día de la semana ($11.2k); la cafetería concentra el 50% de la venta.' },
    ],
    recs: ['Reordenar Playera del colegio y Kit de arte antes del fin de semana.'],
  },
  {
    id: 'inteligencia-financiera', label: 'Business Intelligence', icon: 'bars', tone: 'red',
    metric: '93.4%', metricLabel: 'retención anual', delta: 1.2, spark: [91.8, 92.0, 92.4, 92.6, 93.0, 93.2, 93.4],
    urgent: 'Ocupación de cupo en 88%',
    kpis: [{ label: 'Retención anual', value: '93.4%', delta: 1.2 }, { label: 'NPS familias', value: '+62', delta: 5.0 }],
    ctx: 'Business Intelligence: retención anual 93.4% (+1.2). NPS de familias +62 (+5). Costo por alumno $2,810 (−2.4%). Ocupación de cupo 88%; los grados con más espacio son Kínder (156/180) y 6° (160/180). La proyección de IA estima 1,300 inscritos para fin de ciclo.',
    headline: 'Los indicadores estructurales mejoran: retención 93.4% y NPS +62.',
    hallazgos: [
      { tone: 'green', text: 'El NPS subió 5 puntos; las familias recomiendan más, lo que alimenta la fuente #1 de admisiones.' },
      { tone: 'blue', text: 'Kínder y 6° concentran el cupo disponible: ahí está el espacio de crecimiento del próximo ciclo.' },
    ],
    recs: ['Dirigir la campaña de admisiones 2026 a Kínder, donde hay 24 lugares disponibles.'],
  },
];

const MGR_PERIODS = ['Hoy', 'Esta semana', 'Agosto', 'Ciclo ' + (window.PIAGET_CYCLE ? PIAGET_CYCLE() : '2025–2026')];

/* En ciclo reiniciado, las áreas arrancan sin métricas del ciclo anterior. */
if (window.PIAGET_FRESH) {
  const z = v => /\$/.test(v) ? '$0' : (/%/.test(v) ? '0%' : '0');
  MGR_AREAS.forEach(a => {
    a.metric = z(a.metric);
    a.delta = null;
    a.spark = (a.spark || []).map(() => 0);
    a.urgent = 'Sin pendientes';
    a.kpis = (a.kpis || []).map(k => ({ ...k, value: z(k.value), delta: 0 }));
    a.ctx = a.label + ': sin datos registrados en el ciclo actual.';
    a.headline = 'Sin actividad registrada en ' + a.label + ' para este ciclo.';
    a.hallazgos = [];
    a.recs = [];
  });
}

/* ============================================================
   Reportes: construcción, IA con respaldo y persistencia
   ============================================================ */
const MGR_RPT_KEY = window.PIAGET_FRESH ? 'piaget_manager_reports_fresh_v1' : 'piaget_manager_reports_v1';

function mgrBuildFallback(areaIds, period, extra) {
  const areas = MGR_AREAS.filter(a => areaIds.includes(a.id));
  const title = areas.length === 1 ? 'Reporte de ' + areas[0].label + ' · ' + period : 'Reporte ejecutivo integral · ' + period;
  const resumen = areas.map(a => a.headline).join(' ') + (extra ? ' Enfoque solicitado: ' + extra + '.' : '');
  const hallazgos = [];
  areas.forEach(a => a.hallazgos.forEach(h => hallazgos.push(h)));
  const recs = [];
  areas.forEach(a => a.recs.forEach(r => recs.push(r)));
  return { title, resumen, hallazgos: hallazgos.slice(0, 4), recomendaciones: recs.slice(0, 3) };
}

async function mgrTryAI(areaIds, period, extra) {
  if (!(window.claude && window.claude.complete)) return null;
  const areas = MGR_AREAS.filter(a => areaIds.includes(a.id));
  const prompt =
    'Eres el Copilot de ' + DB.school.name + ' (' + DB.school.campus + ', ' + DB.school.cycle + '). ' +
    'Genera un reporte ejecutivo para Dirección General con base EXCLUSIVA en estos datos:\n\n' +
    areas.map(a => '• ' + a.ctx).join('\n') +
    '\n\nPeriodo del reporte: ' + period + '.' +
    (extra ? ' Indicaciones adicionales del usuario: ' + extra + '.' : '') +
    '\n\nResponde ÚNICAMENTE un objeto JSON válido, sin texto adicional, con esta forma exacta:' +
    '\n{"titulo": "string corto", "resumen": "string de 60 a 90 palabras en español, tono ejecutivo", ' +
    '"hallazgos": [{"tone": "green|amber|red|blue", "text": "string"}] (3 o 4 elementos), ' +
    '"recomendaciones": ["string", "string", "string"]}';
  try {
    const out = await window.claude.complete(prompt);
    const json = out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1);
    const p = JSON.parse(json);
    if (!p.resumen || !Array.isArray(p.hallazgos) || !Array.isArray(p.recomendaciones)) return null;
    return {
      title: p.titulo || null,
      resumen: p.resumen,
      hallazgos: p.hallazgos.slice(0, 4).map(h => ({ tone: ['green', 'amber', 'red', 'blue'].includes(h.tone) ? h.tone : 'blue', text: h.text })),
      recomendaciones: p.recomendaciones.slice(0, 3),
    };
  } catch (e) { return null; }
}

function mgrMakeReport(areaIds, period, extra, ai) {
  const fb = mgrBuildFallback(areaIds, period, extra);
  const areas = MGR_AREAS.filter(a => areaIds.includes(a.id));
  const kpis = areas.flatMap(a => a.kpis).slice(0, 4);
  return {
    id: 'rpt-' + Date.now().toString(36),
    title: (ai && ai.title) || fb.title,
    areaIds, period,
    date: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    source: ai ? 'ia' : 'plantilla',
    resumen: ai ? ai.resumen : fb.resumen,
    kpis,
    hallazgos: ai ? ai.hallazgos : fb.hallazgos,
    recomendaciones: ai ? ai.recomendaciones : fb.recomendaciones,
  };
}

function mgrSeedReports() {
  const a = mgrMakeReport(MGR_AREAS.map(x => x.id), 'Esta semana', '', null);
  a.id = 'rpt-seed-1'; a.title = 'Reporte ejecutivo integral · Semana 2 de agosto'; a.date = 'lun 11 ago, 07:00'; a.source = 'ia';
  const b = mgrMakeReport(['cobros'], 'Agosto', '', null);
  b.id = 'rpt-seed-2'; b.title = 'Cierre financiero preliminar · Julio'; b.date = '1 ago, 09:12'; b.source = 'ia';
  return [a, b];
}

function mgrLoadReports() {
  try {
    const v = JSON.parse(localStorage.getItem(MGR_RPT_KEY) || 'null');
    if (Array.isArray(v) && v.length) return v;
  } catch (e) { }
  return window.PIAGET_FRESH ? [] : mgrSeedReports();
}
function mgrSaveReports(list) {
  try { localStorage.setItem(MGR_RPT_KEY, JSON.stringify(list.slice(0, 8))); } catch (e) { }
}

/* ============================================================
   UI: pulso del día
   ============================================================ */
function ManagerPulse({ go }) {
  const items = window.PIAGET_FRESH ? [] : [
    { tone: 'red', icon: 'wallet', title: '$326k vencido +60 días', sub: '142 familias · cobranza', go: 'cobros' },
    { tone: 'amber', icon: 'cap', title: '9 alumnos en riesgo alto', sub: 'Asistencia <80% + caída de notas', go: 'calificaciones' },
    { tone: 'cyan', icon: 'funnel', title: '18 prospectos fríos', sub: '+10 días sin contacto en Entrevista', go: 'pipeline' },
    { tone: 'blue', icon: 'shield', title: '3 en cola de espera', sub: '1 visitante por verificar', go: 'cola-espera' },
  ];
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))', gap: 12 }}>
      {!items.length && (
        <div className="card pad faint" style={{ fontSize: 12.5 }}>Sin pendientes urgentes. El pulso mostrará alertas de cobranza, riesgo académico, admisiones y accesos cuando haya actividad en el ciclo.</div>
      )}
      {items.map((it, i) => {
        const t = window.TONE[it.tone];
        return (
          <button key={i} className="card clickable" onClick={() => go(it.go)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', textAlign: 'left' }}>
            <div className="insight-ico" style={{ background: t.bg, color: t.c, width: 36, height: 36, flexShrink: 0 }}><Icon name={it.icon} size={17} /></div>
            <div className="grow" style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
              <div className="faint" style={{ fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.sub}</div>
            </div>
            <Icon name="chevR" size={15} className="faint" style={{ flexShrink: 0 }} />
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   UI: tarjeta de área con métrica viva
   ============================================================ */
function ManagerAreaCard({ area, go }) {
  const t = window.TONE[area.tone];
  return (
    <button className="card pad clickable" onClick={() => go(area.id)}
      style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="row between center">
        <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={area.icon} size={20} /></div>
        <Sparkline data={area.spark} w={92} h={28} color={t.c} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{area.label}</div>
        <div className="row center" style={{ gap: 8, marginTop: 4 }}>
          <span className="font-display tnum" style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.02em' }}>{area.metric}</span>
          {area.delta != null && <Delta value={area.delta} />}
        </div>
        <div className="faint" style={{ fontSize: 12 }}>{area.metricLabel}</div>
      </div>
      <div className="row between center" style={{ paddingTop: 11, borderTop: '1px solid var(--border)' }}>
        <span className="row center" style={{ gap: 7, fontSize: 12, color: 'var(--text-muted, var(--text))', minWidth: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: t.c, flexShrink: 0 }}></span>
          <span className="faint" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{area.urgent}</span>
        </span>
        <Icon name="arrowRight" size={16} className="faint" style={{ flexShrink: 0 }} />
      </div>
    </button>
  );
}

/* ============================================================
   UI: generador de reportes con IA
   ============================================================ */
const MGR_GEN_STEPS = ['Recopilando datos de los módulos…', 'Analizando indicadores y tendencias…', 'Redactando reporte ejecutivo…'];

function ManagerChip({ active, onClick, children }) {
  return (
    <button className="chip-btn" onClick={onClick}
      style={active ? { background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'var(--accent)' } : {}}>
      {children}
    </button>
  );
}

function ManagerReportGen({ onReport }) {
  const [sel, setSel] = React.useState(MGR_AREAS.map(a => a.id));
  const [period, setPeriod] = React.useState('Esta semana');
  const [extra, setExtra] = React.useState('');
  const [phase, setPhase] = React.useState(-1); // -1 idle, 0..2 generando

  const toggle = (id) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allSel = sel.length === MGR_AREAS.length;

  async function generate() {
    if (!sel.length || phase >= 0) return;
    setPhase(0);
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    delay(750).then(() => setPhase(p => p >= 0 ? 1 : p));
    delay(1550).then(() => setPhase(p => p >= 0 ? 2 : p));
    const [ai] = await Promise.all([mgrTryAI(sel, period, extra.trim()), delay(2400)]);
    const rep = mgrMakeReport(sel, period, extra.trim(), ai);
    setPhase(-1);
    setExtra('');
    Store.log('Copilot', 'generó el reporte “' + rep.title + '”');
    toast(ai ? 'Reporte generado con IA' : 'Reporte generado', 'ok');
    onReport(rep);
  }

  return (
    <div className="ai-panel" style={{ alignSelf: 'start' }}>
      <div className="ai-panel-head">
        <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
        <div className="grow">
          <div style={{ fontWeight: 600, fontSize: 14 }}>Generar reporte con IA</div>
          <div className="faint" style={{ fontSize: 11.5 }}>Con datos en vivo de las 6 áreas</div>
        </div>
      </div>

      <div className="col" style={{ gap: 14, padding: '14px 2px 2px' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Alcance</div>
          <div className="row wrap" style={{ gap: 7 }}>
            <ManagerChip active={allSel} onClick={() => setSel(allSel ? [] : MGR_AREAS.map(a => a.id))}>Integral</ManagerChip>
            {MGR_AREAS.map(a => (
              <ManagerChip key={a.id} active={!allSel && sel.includes(a.id)} onClick={() => toggle(a.id)}>{a.label}</ManagerChip>
            ))}
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Periodo</div>
          <div className="row wrap" style={{ gap: 7 }}>
            {MGR_PERIODS.map(p => <ManagerChip key={p} active={period === p} onClick={() => setPeriod(p)}>{p}</ManagerChip>)}
          </div>
        </div>
        <TextInput value={extra} onChange={e => setExtra(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate()}
          placeholder="Indicaciones extra (opcional): compara contra meta, enfócate en riesgos…" />

        {phase < 0 ? (
          <button className="btn primary" style={{ justifyContent: 'center' }} disabled={!sel.length} onClick={generate}>
            <Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Generar reporte
          </button>
        ) : (
          <div className="col" style={{ gap: 9, padding: '4px 2px' }}>
            {MGR_GEN_STEPS.map((s, i) => (
              <div key={i} className="row center" style={{ gap: 9, fontSize: 12.5, opacity: i <= phase ? 1 : 0.38 }}>
                {i < phase
                  ? <span style={{ color: 'var(--green)', display: 'inline-flex' }}><Icon name="checkCircle" size={15} /></span>
                  : i === phase
                    ? <span className="ai-orb" style={{ width: 15, height: 15, borderRadius: 5 }}><Icon name="spark" size={9} fill="currentColor" /></span>
                    : <span style={{ width: 15, height: 15, borderRadius: 999, border: '1.5px solid var(--border-strong)', display: 'inline-block' }}></span>}
                <span style={{ fontWeight: i === phase ? 600 : 400 }}>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   UI: visor de reporte
   ============================================================ */
function ManagerReportModal({ report, onClose }) {
  if (!report) return null;
  const areas = MGR_AREAS.filter(a => report.areaIds.includes(a.id));
  return (
    <Modal open={!!report} title={report.title} onClose={onClose} width={720}
      footer={
        <div className="row between center" style={{ width: '100%' }}>
          <span className="faint" style={{ fontSize: 11.5 }}>Copilot puede cometer errores. Verifica datos sensibles.</span>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn sm" onClick={() => toast('Reporte exportado a PDF')}><Icon name="download" size={14} className="btn-ico" />PDF</button>
            <button className="btn sm" onClick={() => toast('Enviado a Dirección General', 'info')}><Icon name="send" size={14} className="btn-ico" />Enviar</button>
            <button className="btn primary sm" onClick={() => toast('Programado: cada lunes 7:00', 'info')}><Icon name="clock" size={14} className="btn-ico" />Programar semanal</button>
          </div>
        </div>
      }>
      <div className="col" style={{ gap: 18 }}>
        <div className="row center wrap" style={{ gap: 7 }}>
          <Badge tone={report.source === 'ia' ? 'violet' : 'gray'} dot>{report.source === 'ia' ? 'Generado con IA' : 'Compuesto con plantilla'}</Badge>
          <Badge tone="blue">{report.period}</Badge>
          {areas.length === MGR_AREAS.length
            ? <Badge tone="cyan">Integral · 6 áreas</Badge>
            : areas.map(a => <Badge key={a.id} tone={a.tone}>{a.label}</Badge>)}
          <span className="faint" style={{ fontSize: 11.5, marginLeft: 'auto' }}>{report.date}</span>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 7 }}>Resumen ejecutivo</div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65 }}>{report.resumen}</p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {report.kpis.map((k, i) => (
            <div key={i} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '11px 13px' }}>
              <div className="faint" style={{ fontSize: 11.5 }}>{k.label}</div>
              <div className="row center" style={{ gap: 7, marginTop: 2 }}>
                <span className="font-display tnum" style={{ fontSize: 19, fontWeight: 700 }}>{k.value}</span>
                {k.delta != null && <Delta value={k.delta} />}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>Hallazgos</div>
          <div className="col" style={{ gap: 9 }}>
            {report.hallazgos.map((h, i) => {
              const t = window.TONE[h.tone] || window.TONE.blue;
              return (
                <div key={i} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                  <div className="insight-ico" style={{ background: t.bg, color: t.c, width: 26, height: 26, flexShrink: 0 }}>
                    <Icon name={h.tone === 'green' ? 'trendUp' : h.tone === 'blue' ? 'target' : 'alert'} size={13} />
                  </div>
                  <span style={{ fontSize: 13, lineHeight: 1.55, paddingTop: 3 }}>{h.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>Recomendaciones</div>
          <div className="col" style={{ gap: 8 }}>
            {report.recomendaciones.map((r, i) => (
              <div key={i} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <span className="font-mono" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-soft, var(--surface-2))', border: '1px solid var(--border)', borderRadius: 6, width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 13, lineHeight: 1.55, paddingTop: 2 }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================
   Manager (vista principal)
   ============================================================ */
function ManagerHub({ go }) {
  const [reports, setReports] = React.useState(mgrLoadReports);
  const [viewing, setViewing] = React.useState(null);

  const addReport = (rep) => {
    setReports(rs => { const n = [rep, ...rs]; mgrSaveReports(n); return n; });
    setViewing(rep);
  };
  const removeReport = (id) => {
    setReports(rs => { const n = rs.filter(r => r.id !== id); mgrSaveReports(n); return n; });
    toast('Reporte eliminado', 'warn');
  };

  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="content-inner">
      <PageHead eyebrow="Principal" title="Manager" desc="Centro de mando: lo urgente de cada área y reportes ejecutivos generados por IA bajo demanda."></PageHead>

      <SectionHead eyebrow={today} title="Pulso de hoy"></SectionHead>
      <ManagerPulse go={go} />

      <SectionHead eyebrow="Áreas operativas" title="Módulos en vivo"></SectionHead>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))' }}>
        {MGR_AREAS.map(a => <ManagerAreaCard key={a.id} area={a} go={go} />)}
      </div>

      <SectionHead eyebrow="IA bajo demanda" title="Reportes ejecutivos"></SectionHead>
      <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', alignItems: 'start' }}>
        <ManagerReportGen onReport={addReport} />
        <div className="card">
          <CardHead icon="doc" title="Reportes recientes" sub={reports.length + ' generados'} />
          <div>
            {reports.length === 0 && (
              <div className="faint" style={{ padding: '18px 16px', fontSize: 12.5 }}>Aún no hay reportes. Genera el primero con el panel de la izquierda.</div>
            )}
            {reports.map(r => {
              const integral = r.areaIds.length === MGR_AREAS.length;
              const first = MGR_AREAS.find(a => a.id === r.areaIds[0]) || MGR_AREAS[0];
              const t = window.TONE[integral ? 'violet' : first.tone];
              return (
                <div className="lrow clickable" key={r.id} onClick={() => setViewing(r)} style={{ cursor: 'pointer' }}>
                  <div className="insight-ico" style={{ background: t.bg, color: t.c, width: 34, height: 34, flexShrink: 0 }}>
                    <Icon name={integral ? 'layers' : first.icon} size={16} />
                  </div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                    <div className="faint" style={{ fontSize: 12 }}>{(integral ? 'Integral' : r.areaIds.length + (r.areaIds.length === 1 ? ' área' : ' áreas')) + ' · ' + r.period + ' · ' + r.date}</div>
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    <RowMenu items={[
                      { icon: 'doc', label: 'Abrir reporte', onClick: () => setViewing(r) },
                      { icon: 'download', label: 'Descargar PDF', onClick: () => toast('Reporte exportado a PDF') },
                      { icon: 'x', label: 'Eliminar', danger: true, onClick: () => removeReport(r.id) },
                    ]} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ManagerReportModal report={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

Object.assign(window, { ManagerHub });
