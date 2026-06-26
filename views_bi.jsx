/* views_bi.jsx — Inteligencia Financiera (capa analítica sobre Finanzas)
   ─────────────────────────────────────────────────────────────
   · KPIs estratégicos + crecimiento interanual
   · Rentabilidad y unit economics por nivel
   · Simulador de escenarios interactivo (matrícula, colegiatura,
     cobranza, costos) que recalcula proyecciones en vivo
   · Pronóstico de cierre + tendencia mensual real
   · Mezcla de ingresos · salud de cobranza · insights con IA
   ───────────────────────────────────────────────────────────── */

/* ---------- Modelo financiero ---------- */
const BI_NIVELES = [
  { nivel: 'Preescolar', coleg: 3200, costAlumno: 2100, tone: 'cyan' },
  { nivel: 'Primaria', coleg: 3800, costAlumno: 2300, tone: 'blue' },
  { nivel: 'Secundaria', coleg: 4600, costAlumno: 2950, tone: 'violet' },
];
const BI_MESES = 10;
const BI_OVERHEAD_RATE = 0.22;
const BI_COBRANZA_BASE = 94;
const BI_MES = { '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic' };

function biClases() { return (window.DB && DB.clases && DB.clases.length) ? DB.clases : (window.CLASES_SEED || []); }
function biAlumnosPorNivel() {
  const m = { Preescolar: 0, Primaria: 0, Secundaria: 0 };
  if (window.PIAGET_FRESH) return m;
  biClases().forEach(c => { if (m[c.nivel] != null) m[c.nivel] += (c.alumnos || 0); });
  return m;
}
function biOtrosIngresos() { return (DB.incomeByConcept || []).filter(c => !/colegiatura/i.test(c.concept)); }
function biHash(s) { let h = 0; for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

/* egresos realmente registrados en el módulo de Egresos */
function biEgresoReal() { return ((window.DB && DB.egresos) || []).reduce((a, e) => a + e.amount, 0); }

/* overhead fijo: anclado a los EGRESOS REALES cuando existen (gasto registrado
   menos el costo directo de docencia); si no hay egresos, se estima por tasa. */
function biOverheadBase() {
  const al = biAlumnosPorNivel();
  const costoDirectoBase = BI_NIVELES.reduce((a, n) => a + (al[n.nivel] || 0) * n.costAlumno * BI_MESES, 0);
  const real = biEgresoReal();
  if (real > 0) return Math.max(0, real - costoDirectoBase);
  const tuitionBase = BI_NIVELES.reduce((a, n) => a + (al[n.nivel] || 0) * n.coleg * BI_MESES, 0);
  const otros = biOtrosIngresos().reduce((a, c) => a + c.value, 0);
  return (tuitionBase + otros) * BI_OVERHEAD_RATE;
}

function biCompute(p) {
  const dMat = p.dMat || 0, dColeg = p.dColeg || 0, dCostos = p.dCostos || 0;
  const cobranza = (p.cobranza != null ? p.cobranza : BI_COBRANZA_BASE) / 100;
  const al = biAlumnosPorNivel();
  const niveles = BI_NIVELES.map(n => {
    const alumnos = Math.round((al[n.nivel] || 0) * (1 + dMat / 100));
    const coleg = n.coleg * (1 + dColeg / 100);
    const ingreso = alumnos * coleg * BI_MESES;
    const costo = alumnos * n.costAlumno * BI_MESES * (1 + dCostos / 100);
    return { ...n, alumnos, coleg, ingreso, costo, contrib: ingreso - costo, margen: ingreso ? (ingreso - costo) / ingreso : 0 };
  });
  const tuition = niveles.reduce((a, n) => a + n.ingreso, 0);
  const otros = biOtrosIngresos().reduce((a, c) => a + c.value, 0);
  const ingresoBruto = tuition + otros;
  const ingresoNeto = ingresoBruto * cobranza;
  const costoDirecto = niveles.reduce((a, n) => a + n.costo, 0);
  const overhead = biOverheadBase() * (1 + dCostos / 100);
  const egreso = costoDirecto + overhead;
  const utilidad = ingresoNeto - egreso;
  const alumnosTot = niveles.reduce((a, n) => a + n.alumnos, 0);
  return {
    niveles, tuition, otros, ingresoBruto, ingresoNeto, cobranza, costoDirecto, overhead, egreso, utilidad,
    margen: ingresoNeto ? utilidad / ingresoNeto : 0,
    alumnosTot, arpu: alumnosTot ? ingresoBruto / alumnosTot : 0, costoAlumno: alumnosTot ? egreso / alumnosTot : 0,
  };
}
function biMonthAgg(rows, val) {
  const m = {}; rows.forEach(r => { const k = (r.date || '').slice(0, 7); if (!k) return; m[k] = (m[k] || 0) + val(r); });
  const keys = Object.keys(m).sort(); return { keys, data: keys.map(k => m[k]) };
}

/* ---------- Slider ---------- */
function BISlider({ label, value, set, min, max, step, fmt, tone }) {
  return (
    <div className="col gap-7">
      <div className="row between center">
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span className="font-mono tnum" style={{ fontSize: 13, fontWeight: 600, color: tone || 'var(--accent)' }}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))}
        style={{ width: '100%', accentColor: tone || 'var(--accent)', cursor: 'pointer' }} />
    </div>
  );
}

/* ---------- comparador base → escenario ---------- */
function BICompare({ label, base, scen, money, invert }) {
  const diff = scen - base;
  const good = invert ? diff < 0 : diff > 0;
  const flat = Math.abs(diff) < (money ? 1 : 0.0001);
  const pct = base ? (diff / Math.abs(base)) * 100 : 0;
  return (
    <div className="row between center" style={{ padding: '9px 0', borderTop: '1px solid var(--border)' }}>
      <span className="muted" style={{ fontSize: 13 }}>{label}</span>
      <span className="row center gap-10">
        <span className="tnum" style={{ fontWeight: 600 }}>{money ? fmtMoney(Math.round(scen)) : (Math.round(scen * 10) / 10) + '%'}</span>
        {!flat && <span className="badge " style={{ background: good ? 'var(--green-soft)' : 'var(--red-soft)', color: good ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
          {diff > 0 ? '+' : ''}{money ? fmtShort(diff) : (Math.round(pct * 10) / 10) + '%'}
        </span>}
      </span>
    </div>
  );
}

/* ====================================================================
   INTELIGENCIA FINANCIERA
   ==================================================================== */
function BI({ go }) {
  const store = useStore();
  const [dMat, setDMat] = React.useState(0);
  const [dColeg, setDColeg] = React.useState(0);
  const [cobranza, setCobranza] = React.useState(BI_COBRANZA_BASE);
  const [dCostos, setDCostos] = React.useState(0);

  const base = biCompute({ dMat: 0, dColeg: 0, cobranza: BI_COBRANZA_BASE, dCostos: 0 });
  const scen = biCompute({ dMat, dColeg, cobranza, dCostos });
  const touched = dMat !== 0 || dColeg !== 0 || dCostos !== 0 || cobranza !== BI_COBRANZA_BASE;
  const reset = () => { setDMat(0); setDColeg(0); setCobranza(BI_COBRANZA_BASE); setDCostos(0); };

  /* crecimiento interanual ponderado */
  const inc = DB.incomeByConcept || [];
  const incTot = inc.reduce((a, c) => a + c.value, 0);
  const yoY = incTot ? inc.reduce((a, c) => a + c.value * c.delta, 0) / incTot : 0;

  /* cobranza real (conciliación) */
  const cobros = DB.cobros || [];
  const conc = cobros.filter(c => c.status === 'conciliado').length;
  const pctConc = cobros.length ? Math.round(conc / cobros.length * 100) : 0;

  /* cartera */
  const adeudos = window.ctaAdeudos ? window.ctaAdeudos() : [];
  const carteraTotal = adeudos.reduce((a, s) => a + (s.saldo || 0), 0);
  const AGING = [['Por vencer', 'var(--green)'], ['1–30 días', 'var(--accent)'], ['31–60 días', 'var(--amber)'], ['+60 días', 'var(--red)']];
  const aging = AGING.map(([bucket, color]) => ({ bucket, color, value: 0, n: 0 }));
  adeudos.forEach(s => { const h = biHash(s.name); const bi = s.estatus === 'parcial' ? (h % 2) : 2 + (h % 2); aging[bi].value += s.saldo; aging[bi].n += 1; });
  const vencido = aging[2].value + aging[3].value;
  const pctVencido = carteraTotal ? Math.round(vencido / carteraTotal * 100) : 0;

  /* tendencia mensual real */
  const ingM = biMonthAgg(cobros, c => c.amount);
  const egM = biMonthAgg(DB.egresos || [], e => e.amount);
  const keys = Array.from(new Set([...ingM.keys, ...egM.keys])).sort();
  const trLabels = keys.map(k => BI_MES[k.slice(5, 7)] || k);
  const trIng = keys.map(k => { const i = ingM.keys.indexOf(k); return i >= 0 ? ingM.data[i] : 0; });
  const trEg = keys.map(k => { const i = egM.keys.indexOf(k); return i >= 0 ? egM.data[i] : 0; });

  /* sensibilidades para insights */
  const sensMat = biCompute({ dMat: 5, dColeg: 0, cobranza: BI_COBRANZA_BASE, dCostos: 0 }).utilidad - base.utilidad;
  const sensColeg = biCompute({ dMat: 0, dColeg: 5, cobranza: BI_COBRANZA_BASE, dCostos: 0 }).utilidad - base.utilidad;
  const sensCob = base.utilidad - biCompute({ dMat: 0, dColeg: 0, cobranza: BI_COBRANZA_BASE - 5, dCostos: 0 }).utilidad;
  const bestNivel = base.niveles.slice().sort((a, b) => b.margen - a.margen)[0];
  const concentracion = base.ingresoBruto ? Math.round(base.tuition / base.ingresoBruto * 100) : 0;
  const egresoReal = biEgresoReal();
  const egresoTopCat = (() => { const m = {}; ((window.DB && DB.egresos) || []).forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; }); const r = Object.entries(m).sort((a, b) => b[1] - a[1])[0]; return r ? { cat: r[0], value: r[1] } : null; })();

  const kpis = [
    { label: 'Ingreso anual proyectado', value: fmtMoney(Math.round(base.ingresoBruto)), delta: Math.round(yoY * 10) / 10, icon: 'trendUp', tone: 'green' },
    { label: 'Egresos del ciclo', value: fmtMoney(Math.round(egresoReal || base.egreso)), delta: 0, icon: 'wallet', tone: 'cyan', sub: egresoReal ? 'registrado en Egresos' : 'estimado' },
    { label: 'Margen operativo', value: Math.round(base.margen * 100) + '%', delta: 1.6, icon: 'pie', tone: 'violet', sub: 'Utilidad ' + fmtMoney(Math.round(base.utilidad)) },
    { label: 'Cartera vencida', value: fmtMoney(Math.round(vencido)), delta: -4.1, icon: 'alert', tone: 'amber', sub: pctVencido + '% de la cartera' },
  ];

  const insights = base.alumnosTot === 0 ? [
    { icon: 'spark', tone: 'blue', text: <>Aún no hay matrícula ni movimientos financieros en este ciclo. Cuando registres inscripciones y cobros, aquí aparecerán los hallazgos de rentabilidad, sensibilidad y cartera.</> },
  ] : [
    ...(egresoReal ? [{ icon: 'wallet', tone: 'cyan', text: <>El gasto registrado en <b>Egresos</b> suma <b>{fmtMoney(Math.round(egresoReal))}</b>{egresoTopCat ? <>, encabezado por <b>{egresoTopCat.cat}</b> ({Math.round(egresoTopCat.value / egresoReal * 100)}%)</> : null}. Estos egresos alimentan el margen y la utilidad proyectada.</> }] : []),
    { icon: 'trendUp', tone: 'green', text: <><b>{bestNivel.nivel}</b> es el nivel más rentable con <b>{Math.round(bestNivel.margen * 100)}%</b> de margen de contribución ({fmtMoney(Math.round(bestNivel.contrib))} al ciclo). Conviene proteger su ocupación.</> },
    { icon: 'sliders', tone: 'blue', text: <>Apalancamiento operativo alto: <b>+5%</b> de matrícula añade <b>{fmtMoney(Math.round(sensMat))}</b> de utilidad sin crecer el gasto fijo.</> },
    { icon: 'wallet', tone: 'amber', text: <>La cartera vencida suma <b>{fmtMoney(Math.round(vencido))}</b> ({pctVencido}%). Subir la cobranza al <b>98%</b> liberaría ~{fmtMoney(Math.round(sensCob))} de flujo.</> },
    { icon: 'percent', tone: 'violet', text: <>Un ajuste de <b>+5%</b> en colegiatura mejora la utilidad en <b>{fmtMoney(Math.round(sensColeg))}</b>. Las colegiaturas concentran <b>{concentracion}%</b> del ingreso.</> },
  ];

  function biReporte() {
    const f = n => fmtMoney(Math.round(n));
    const pc = x => Math.round(x * 100) + '%';
    const sg = n => (n > 0 ? '+' : '') + n + '%';
    const today = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
    const sName = (window.DB && DB.settings && DB.settings.schoolName) || 'Colegio Piaget';
    const nivelRows = base.niveles.map(n => `<tr><td>${n.nivel}</td><td class=r>${n.alumnos}</td><td class=r>${f(n.coleg * BI_MESES)}</td><td class=r>${f(n.ingreso)}</td><td class=r><b>${pc(n.margen)}</b></td></tr>`).join('');
    const mixRows = inc.map(c => `<tr><td>${c.concept}</td><td class=r>${f(c.value)}</td><td class=r>${incTot ? Math.round(c.value / incTot * 100) : 0}%</td><td class=r>${sg(c.delta)}</td></tr>`).join('');
    const agingRows = aging.map(a => `<tr><td>${a.bucket}</td><td class=r>${a.n}</td><td class=r>${f(a.value)}</td><td class=r>${carteraTotal ? Math.round(a.value / carteraTotal * 100) : 0}%</td></tr>`).join('');
    const insightsText = [
      `${bestNivel.nivel} es el nivel más rentable: ${pc(bestNivel.margen)} de margen de contribución (${f(bestNivel.contrib)} al ciclo).`,
      `Apalancamiento operativo: +5% de matrícula añade ${f(sensMat)} de utilidad sin crecer el gasto fijo.`,
      `Cartera vencida ${f(vencido)} (${pctVencido}%); subir la cobranza al 98% liberaría ~${f(sensCob)} de flujo.`,
      `+5% en colegiatura mejora la utilidad en ${f(sensColeg)}; las colegiaturas concentran ${concentracion}% del ingreso.`,
    ].map(t => `<li>${t}</li>`).join('');
    const scenBlock = touched ? `
      <h2>Escenario analizado</h2>
      <p class=mut>Palancas: matrícula ${sg(dMat)} · colegiatura ${sg(dColeg)} · cobranza ${cobranza}% · costos ${sg(dCostos)}</p>
      <table><thead><tr><th>Indicador</th><th class=r>Caso base</th><th class=r>Escenario</th><th class=r>Δ</th></tr></thead><tbody>
        <tr><td>Ingreso recaudado</td><td class=r>${f(base.ingresoNeto)}</td><td class=r>${f(scen.ingresoNeto)}</td><td class=r>${f(scen.ingresoNeto - base.ingresoNeto)}</td></tr>
        <tr><td>Egresos</td><td class=r>${f(base.egreso)}</td><td class=r>${f(scen.egreso)}</td><td class=r>${f(scen.egreso - base.egreso)}</td></tr>
        <tr><td>Utilidad operativa</td><td class=r><b>${f(base.utilidad)}</b></td><td class=r><b>${f(scen.utilidad)}</b></td><td class=r><b>${f(scen.utilidad - base.utilidad)}</b></td></tr>
        <tr><td>Margen operativo</td><td class=r>${pc(base.margen)}</td><td class=r>${pc(scen.margen)}</td><td class=r>${Math.round((scen.margen - base.margen) * 100)} pts</td></tr>
      </tbody></table>` : '';
    const html = '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte ejecutivo · ' + sName + '</title>'
      + '<style>@page{size:A4;margin:16mm}*{box-sizing:border-box}'
      + 'body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1d24;font-size:12px;line-height:1.5;margin:0}'
      + 'h1{font-size:21px;margin:0 0 2px}h2{font-size:14px;margin:22px 0 8px;padding-bottom:5px;border-bottom:2px solid #635BFF}'
      + '.mut{color:#697;font-size:11px;color:#6b7280}.head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #1a1d24;padding-bottom:10px}'
      + '.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px}'
      + '.k{border:1px solid #e3e6ea;border-radius:8px;padding:11px 13px}.k span{display:block;color:#6b7280;font-size:10.5px}.k b{font-size:17px}'
      + 'table{width:100%;border-collapse:collapse;margin-top:6px}th,td{text-align:left;padding:7px 9px;border-bottom:1px solid #e8eaee;font-size:11.5px}'
      + 'th{color:#6b7280;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.04em}td.r,th.r{text-align:right;font-variant-numeric:tabular-nums}'
      + 'tfoot td{font-weight:700;border-top:2px solid #1a1d24}ul{margin:6px 0 0;padding-left:18px}li{margin-bottom:6px}'
      + '.foot{margin-top:26px;color:#9aa1ab;font-size:10px;border-top:1px solid #e8eaee;padding-top:8px}</style></head><body>'
      + '<div class=head><div><h1>Reporte ejecutivo financiero</h1><div class=mut>' + sName + ' · Ciclo ' + (window.PIAGET_CYCLE ? PIAGET_CYCLE() : '2025–2026') + '</div></div><div class=mut style="text-align:right">Generado<br>' + today + '</div></div>'
      + '<div class=kpis>'
      + '<div class=k><span>Ingreso anual</span><b>' + f(base.ingresoBruto) + '</b></div>'
      + '<div class=k><span>Egresos</span><b>' + f(base.egreso) + '</b></div>'
      + '<div class=k><span>Utilidad operativa</span><b>' + f(base.utilidad) + '</b></div>'
      + '<div class=k><span>Margen operativo</span><b>' + pc(base.margen) + '</b></div></div>'
      + '<h2>Estado de resultados proyectado</h2><table><tbody>'
      + '<tr><td>Ingreso por colegiaturas</td><td class=r>' + f(base.tuition) + '</td></tr>'
      + '<tr><td>Otros ingresos (inscripciones, transporte, tiendita…)</td><td class=r>' + f(base.otros) + '</td></tr>'
      + '<tr><td>Ingreso bruto</td><td class=r><b>' + f(base.ingresoBruto) + '</b></td></tr>'
      + '<tr><td>Ingreso recaudado (cobranza ' + Math.round(base.cobranza * 100) + '%)</td><td class=r>' + f(base.ingresoNeto) + '</td></tr>'
      + '<tr><td>Costo directo (docencia y operación por nivel)</td><td class=r>' + f(base.costoDirecto) + '</td></tr>'
      + '<tr><td>Gasto fijo / administrativo</td><td class=r>' + f(base.overhead) + '</td></tr>'
      + '<tr><td>Egresos totales</td><td class=r><b>' + f(base.egreso) + '</b></td></tr>'
      + '<tr><td>Utilidad operativa</td><td class=r><b>' + f(base.utilidad) + ' (' + pc(base.margen) + ')</b></td></tr>'
      + '</tbody></table>'
      + '<h2>Rentabilidad por nivel</h2><table><thead><tr><th>Nivel</th><th class=r>Alumnos</th><th class=r>Ingreso/alumno</th><th class=r>Ingreso ciclo</th><th class=r>Margen</th></tr></thead><tbody>' + nivelRows + '</tbody></table>'
      + scenBlock
      + '<h2>Mezcla de ingresos</h2><table><thead><tr><th>Concepto</th><th class=r>Monto</th><th class=r>% mezcla</th><th class=r>Crecimiento</th></tr></thead><tbody>' + mixRows + '</tbody></table>'
      + '<h2>Antigüedad de cartera</h2><p class=mut>' + f(carteraTotal) + ' por cobrar · ' + adeudos.length + ' alumnos · ' + pctVencido + '% vencida</p>'
      + '<table><thead><tr><th>Periodo</th><th class=r>Alumnos</th><th class=r>Saldo</th><th class=r>%</th></tr></thead><tbody>' + agingRows + '</tbody></table>'
      + '<h2>Hallazgos clave (IA)</h2><ul>' + insightsText + '</ul>'
      + '<div class=foot>Documento generado por PIAGET AI · Inteligencia Financiera. Cifras proyectadas con base en el padrón vigente; uso interno.</div>'
      + '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.focus();window.print();},150)}</scr' + 'ipt>'
      + '</body></html>';
    const ifr = document.createElement('iframe');
    ifr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(ifr);
    const doc = ifr.contentWindow.document; doc.open(); doc.write(html); doc.close();
    setTimeout(() => { try { ifr.remove(); } catch (e) {} }, 12000);
    toast('Reporte ejecutivo generado ✓');
  }

  return (
    <div className="content-inner" style={{ maxWidth: 1320 }}>
      <PageHead eyebrow="Tesorería · Analítica" title="Inteligencia Financiera"
        desc={'Ciclo ' + (window.PIAGET_CYCLE ? PIAGET_CYCLE() : '2025–2026') + ' · margen <b style="color:var(--text)">' + Math.round(base.margen * 100) + '%</b> · ' + base.alumnosTot + ' alumnos · ' + fmtMoney(Math.round(base.ingresoBruto)) + ' proyectado'}>
        <button className="btn" onClick={() => go('finanzas')}><Icon name="wallet" size={15} className="btn-ico" />Ir a Finanzas</button>
        <button className="btn primary" onClick={biReporte}><Icon name="download" size={15} className="btn-ico" />Reporte ejecutivo</button>
      </PageHead>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {kpis.map((k, i) => {
          const t = window.TONE[k.tone];
          return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum">{k.value}</div>
              <div className="kpi-foot"><Delta value={k.delta} />{k.sub ? <span className="muted">{k.sub}</span> : <span className="muted">interanual</span>}</div>
            </div>
          );
        })}
      </div>

      {/* ---------- Simulador de escenarios ---------- */}
      <div className="card mt-16">
        <CardHead icon="sliders" title="Simulador de escenarios" sub="Ajusta las palancas y proyecta el cierre del ciclo en vivo"
          right={touched ? <button className="btn sm ghost" onClick={reset}><Icon name="refresh" size={13} className="btn-ico" />Restablecer</button> : <Badge tone="gray" dot>Caso base</Badge>} />
        <div className="grid" style={{ gridTemplateColumns: '320px 1fr', gap: 0 }}>
          <div className="col gap-18" style={{ padding: 20, borderRight: '1px solid var(--border)' }}>
            <BISlider label="Matrícula" value={dMat} set={setDMat} min={-15} max={20} step={1} fmt={v => (v > 0 ? '+' : '') + v + '%'} />
            <BISlider label="Colegiatura" value={dColeg} set={setDColeg} min={-5} max={15} step={0.5} fmt={v => (v > 0 ? '+' : '') + v + '%'} tone="var(--violet)" />
            <BISlider label="Tasa de cobranza" value={cobranza} set={setCobranza} min={80} max={100} step={1} fmt={v => v + '%'} tone="var(--green)" />
            <BISlider label="Costos / inflación" value={dCostos} set={setDCostos} min={-5} max={20} step={0.5} fmt={v => (v > 0 ? '+' : '') + v + '%'} tone="var(--amber)" />
            <div className="col gap-2" style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
              <span className="faint" style={{ fontSize: 11.5 }}>Alumnos proyectados</span>
              <span className="font-display tnum" style={{ fontSize: 22, fontWeight: 700 }}>{scen.alumnosTot} <span className="faint" style={{ fontSize: 13, fontWeight: 400 }}>vs {base.alumnosTot} base</span></span>
            </div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <div className="col" style={{ padding: 20, borderRight: '1px solid var(--border)' }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Proyección anual · escenario</div>
              <BICompare label="Ingreso recaudado" base={base.ingresoNeto} scen={scen.ingresoNeto} money />
              <BICompare label="Egresos" base={base.egreso} scen={scen.egreso} money invert />
              <BICompare label="Utilidad operativa" base={base.utilidad} scen={scen.utilidad} money />
              <BICompare label="Margen operativo" base={base.margen * 100} scen={scen.margen * 100} />
              <div className="row center gap-14" style={{ marginTop: 14 }}>
                <RingStat value={Math.max(0, Math.round(scen.margen * 100))} label="margen" size={92} thickness={10}
                  color={scen.margen >= base.margen ? 'var(--green)' : 'var(--amber)'} />
                <div className="col gap-2" style={{ minWidth: 0 }}>
                  <span className="faint" style={{ fontSize: 11.5 }}>Utilidad del escenario</span>
                  <span className="font-display tnum" style={{ fontSize: 25, fontWeight: 700, color: scen.utilidad >= base.utilidad ? 'var(--green)' : 'var(--amber)' }}>{fmtMoney(Math.round(scen.utilidad))}</span>
                  <span className="faint tnum" style={{ fontSize: 12 }}>{scen.utilidad - base.utilidad >= 0 ? '▲ ' : '▼ '}{fmtMoney(Math.abs(Math.round(scen.utilidad - base.utilidad)))} vs base</span>
                </div>
              </div>
            </div>
            <div className="card pad" style={{ borderTop: 'none', borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Base vs. escenario</div>
              <BarChart data={[[base.ingresoNeto, base.egreso, base.utilidad], [scen.ingresoNeto, scen.egreso, scen.utilidad]]}
                labels={['Ingreso', 'Egreso', 'Utilidad']} colors={['var(--surface-3)', 'var(--accent)']} money height={208} />
              <div className="row center gap-16" style={{ marginTop: 8, justifyContent: 'center' }}>
                <span className="row center gap-7" style={{ fontSize: 12 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--surface-3)' }} />Base</span>
                <span className="row center gap-7" style={{ fontSize: 12 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} />Escenario</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Rentabilidad por nivel + IA ---------- */}
      <div className="grid mt-16" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card">
          <CardHead icon="layers" title="Rentabilidad por nivel" sub="Unit economics · ingreso y margen de contribución" />
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Nivel</th><th className="num">Alumnos</th><th className="num">Ingreso/alumno</th><th className="num">Ingreso ciclo</th><th style={{ width: 150 }}>Margen contribución</th></tr></thead>
              <tbody>
                {base.niveles.map((n, i) => {
                  const t = window.TONE[n.tone];
                  return (
                    <tr key={i}>
                      <td><span className="row center gap-8" style={{ fontWeight: 600 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: t.c }} />{n.nivel}</span></td>
                      <td className="num tnum">{n.alumnos}</td>
                      <td className="num tnum">{fmtMoney(Math.round(n.coleg * BI_MESES))}</td>
                      <td className="num" style={{ fontWeight: 600 }}>{fmtMoney(Math.round(n.ingreso))}</td>
                      <td>
                        <div className="row center gap-8">
                          <div className="grow"><Bar value={n.margen * 100} color={t.c} height={8} /></div>
                          <span className="tnum" style={{ fontWeight: 600, fontSize: 12.5, width: 36, textAlign: 'right' }}>{Math.round(n.margen * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr style={{ borderTop: '2px solid var(--border)' }}>
                <td style={{ fontWeight: 700, paddingTop: 12 }}>Total</td>
                <td className="num tnum" style={{ fontWeight: 700, paddingTop: 12 }}>{base.alumnosTot}</td>
                <td className="num tnum" style={{ paddingTop: 12 }}>{fmtMoney(Math.round(base.arpu))}</td>
                <td className="num" style={{ fontWeight: 700, paddingTop: 12 }}>{fmtMoney(Math.round(base.tuition))}</td>
                <td style={{ paddingTop: 12 }}><span className="tnum faint" style={{ fontSize: 12.5 }}>+ {fmtMoney(Math.round(base.otros))} otros ingresos</span></td>
              </tr></tfoot>
            </table>
          </div>
        </div>

        <div className="card">
          <CardHead icon="spark" title="Insights de Copilot" sub="Lectura automática de tus finanzas" right={<Badge tone="violet" dot>IA</Badge>} />
          <div className="col" style={{ padding: '6px 4px' }}>
            {insights.map((ins, i) => {
              const t = window.TONE[ins.tone];
              return (
                <div className="row gap-12" key={i} style={{ padding: '13px 16px', borderTop: i ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                  <div className="insight-ico" style={{ background: t.bg, color: t.c, width: 32, height: 32, flexShrink: 0 }}><Icon name={ins.icon} size={15} /></div>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>{ins.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- Tendencia + mezcla de ingresos ---------- */}
      <div className="grid mt-16" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card">
          <CardHead icon="bars" title="Tendencia mensual" sub="Cobranza real vs. egresos"
            right={<div className="row gap-14">
              <span className="row center gap-7" style={{ fontSize: 12 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--green)' }} />Ingresos</span>
              <span className="row center gap-7" style={{ fontSize: 12 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--red)' }} />Egresos</span>
            </div>} />
          <div className="card pad" style={{ borderTop: 'none' }}>
            {trLabels.length > 1
              ? <AreaChart series={[{ data: trIng, color: 'var(--green)' }, { data: trEg, color: 'var(--red)' }]} labels={trLabels} height={220} money />
              : <div className="col center gap-8 faint" style={{ padding: 40 }}><Icon name="bars" size={28} stroke={1.4} /><span style={{ fontSize: 13 }}>Sin suficiente historial mensual.</span></div>}
          </div>
        </div>

        <div className="card">
          <CardHead icon="pie" title="Mezcla de ingresos" sub="Por concepto · crecimiento interanual" />
          <div className="card pad col gap-14" style={{ borderTop: 'none' }}>
            {inc.map((c, i) => {
              const pct = incTot ? Math.round(c.value / incTot * 100) : 0;
              return (
                <div key={i}>
                  <div className="row between center" style={{ marginBottom: 6 }}>
                    <span className="row center gap-8" style={{ fontSize: 13 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: c.color, flexShrink: 0 }} />{c.concept}</span>
                    <span className="row center gap-10"><span className="tnum" style={{ fontWeight: 600, fontSize: 12.5 }}>{fmtMoney(c.value)}</span><Delta value={c.delta} /></span>
                  </div>
                  <Bar value={pct} color={c.color} height={7} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- Salud de cobranza ---------- */}
      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
        <div className="card">
          <CardHead icon="target" title="Conciliación" sub="Pagos conciliados del periodo" />
          <div className="card pad col center gap-12" style={{ borderTop: 'none' }}>
            <Donut size={150} thickness={18}
              center={<div><div className="font-display" style={{ fontSize: 24, fontWeight: 600 }}>{pctConc}%</div><div className="faint" style={{ fontSize: 10.5 }}>conciliado</div></div>}
              segments={[{ color: 'var(--green)', value: conc }, { color: 'var(--amber)', value: Math.max(1, cobros.length - conc) }]} />
            <div className="faint" style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.45 }}>{conc} de {cobros.length} movimientos conciliados automáticamente.</div>
          </div>
        </div>

        <div className="card">
          <CardHead icon="alert" title="Antigüedad de cartera" sub={fmtMoney(Math.round(carteraTotal)) + ' por cobrar · ' + adeudos.length + ' alumnos'}
            right={<button className="btn sm" onClick={() => go('pendientes')}><Icon name="megaphone" size={13} className="btn-ico" />Gestionar</button>} />
          <div className="card pad col gap-16" style={{ borderTop: 'none' }}>
            {aging.map((a, i) => {
              const pct = carteraTotal ? Math.round(a.value / carteraTotal * 100) : 0;
              return (
                <div key={i}>
                  <div className="row between center" style={{ marginBottom: 6 }}>
                    <span className="row center gap-8" style={{ fontSize: 13 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: a.color }} />{a.bucket}<span className="faint" style={{ fontSize: 11.5 }}>· {a.n} alumnos</span></span>
                    <span className="tnum" style={{ fontWeight: 600, fontSize: 12.5 }}>{fmtMoney(Math.round(a.value))}</span>
                  </div>
                  <Bar value={pct} color={a.color} height={8} />
                </div>
              );
            })}
            <div className="faint" style={{ fontSize: 12, lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <Icon name="spark" size={13} style={{ verticalAlign: -2 }} /> El <b style={{ color: 'var(--text)' }}>{pctVencido}%</b> de la cartera está vencida (+31 días). Activa <b>Cobranza inteligente</b> para recuperarla.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BI });
