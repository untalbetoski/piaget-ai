/* views_finance.jsx — Módulo Finanzas (derivado de datos reales)
   · Ingresos  → DB.cobros (mismo origen que Ingresos)
   · Cartera   → adeudos por alumno (ctaAdeudos, mismo origen que Pendientes)
   · Egresos   → DB.egresos
   · Conciliación bancaria + Estado de resultados (P&L) */

const FIN_MES = { '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic' };
function finDate(iso) { if (!iso) return '—'; const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }); }
function finHash(s) { let h = 0; for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991; return h; }
function finMonthAgg(rows, amtFn) {
  const m = {}; rows.forEach(r => { const k = (r.date || '').slice(0, 7); if (k) m[k] = (m[k] || 0) + amtFn(r); });
  const keys = Object.keys(m).sort();
  return { keys, labels: keys.map(k => FIN_MES[k.slice(5, 7)] || k), data: keys.map(k => m[k]) };
}

function invStatus(s) {
  if (s === 'pagado') return <Badge tone="green" dot>Pagado</Badge>;
  if (s === 'vencido') return <Badge tone="red" dot>Vencido</Badge>;
  return <Badge tone="amber" dot>Pendiente</Badge>;
}

/* ============ Conciliación bancaria ============ */
function ConciliacionBancaria({ onClose }) {
  const store = useStore();
  const pendAtOpen = React.useMemo(() => (DB.cobros || []).filter(c => c.status === 'pendiente'), []);
  const movs = React.useMemo(() => {
    const out = []; let h = 1;
    pendAtOpen.forEach((c, i) => {
      if ((i * 7 + 3) % 10 < 8) {
        const desc = c.channel === 'Efectivo' ? 'Depósito en ventanilla' : c.channel === 'Tarjeta' ? 'Abono TPV / tarjeta' : c.channel === 'Domiciliación' ? 'Cargo domiciliado' : 'Transferencia SPEI recibida';
        out.push({ id: 'bm' + (h++), date: c.date, desc, amount: c.amount, ref: c.ref || ('SPEI ' + (7740000 + i)), cobroId: c._id });
      }
    });
    out.push({ id: 'bm' + (h++), date: '2025-08-15', desc: 'Depósito no identificado', amount: 8500, ref: 'SPEI 7748120', cobroId: null });
    out.push({ id: 'bm' + (h++), date: '2025-08-14', desc: 'Transferencia recibida', amount: 3500, ref: 'SPEI 7747003', cobroId: null });
    out.push({ id: 'bm' + (h++), date: '2025-08-15', desc: 'Comisión bancaria', amount: -420, ref: 'CARGO 0815', cobroId: null, charge: true });
    return out.sort((a, b) => (b.date).localeCompare(a.date));
  }, [pendAtOpen]);

  const [done, setDone] = React.useState({});
  const matchable = movs.filter(m => m.cobroId);
  const pendientesMov = matchable.filter(m => !done[m.id]);
  const conciliadosN = matchable.filter(m => done[m.id]).length;
  const depTotal = movs.filter(m => !m.charge).reduce((a, m) => a + m.amount, 0);
  const noMatch = movs.filter(m => !m.cobroId && !m.charge);
  const sinDeposito = pendAtOpen.length - matchable.length;

  function conciliar(m) {
    if (!m.cobroId || done[m.id]) return;
    Store.update('cobros', m.cobroId, { status: 'conciliado' });
    if (window.factBorradorDeCobro) { const c = DB.cobros.find(x => x._id === m.cobroId); if (c) window.factBorradorDeCobro({ ...c, status: 'conciliado' }); }
    Store.log('Tesorería', 'concilió el depósito ' + m.ref, 'wallet');
    setDone(d => ({ ...d, [m.id]: true }));
  }
  function conciliarTodo() {
    let n = 0;
    pendientesMov.forEach(m => { Store.update('cobros', m.cobroId, { status: 'conciliado' }); n++; });
    setDone(d => { const nd = { ...d }; pendientesMov.forEach(m => nd[m.id] = true); return nd; });
    if (n) { Store.log('Tesorería', 'concilió ' + n + ' depósitos del estado de cuenta', 'wallet'); toast(n + ' depósitos conciliados ✓'); }
  }

  const kpis = [
    { label: 'Depósitos en estado de cuenta', value: String(movs.filter(m => !m.charge).length), tone: 'blue' },
    { label: 'Monto en banco', value: fmtMoney(depTotal), tone: 'violet' },
    { label: 'Conciliados', value: String(conciliadosN), tone: 'green' },
    { label: 'Por conciliar', value: String(pendientesMov.length), tone: 'amber' },
  ];

  return (
    <Modal open width={860} onClose={onClose} title="Conciliación bancaria"
      footer={<><span className="grow faint" style={{ fontSize: 12.5 }}>{noMatch.length} depósito(s) sin coincidencia · {sinDeposito} pago(s) sin depósito localizado</span><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" disabled={!pendientesMov.length} onClick={conciliarTodo}><Icon name="check" size={15} className="btn-ico" />Conciliar todo lo sugerido ({pendientesMov.length})</button></>}>
      <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 14 }}>Estado de cuenta · <b style={{ color: 'var(--text)' }}>{DB.settings.schoolName}</b> · BBVA ****4471 · Agosto 2025. Cruzamos cada depósito contra los pagos registrados <b>por conciliar</b>.</div>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
        {kpis.map((k, i) => { const t = window.TONE[k.tone]; return (
          <div className="card pad" key={i} style={{ padding: '12px 14px' }}>
            <div className="kpi-label" style={{ marginBottom: 4 }}>{k.label}</div>
            <div className="kpi-value tnum" style={{ fontSize: 20, color: t.c }}>{k.value}</div>
          </div>
        ); })}
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Fecha</th><th>Movimiento bancario</th><th>Referencia</th><th className="num">Monto</th><th>Coincidencia (pago registrado)</th><th>Acción</th></tr></thead>
            <tbody>
              {movs.map((m) => {
                const c = m.cobroId ? DB.cobros.find(x => x._id === m.cobroId) : null;
                const who = c ? (c.student || c.family) : null;
                const isDone = !!done[m.id];
                return (
                  <tr key={m.id}>
                    <td className="muted font-mono" style={{ fontSize: 12 }}>{finDate(m.date)}</td>
                    <td><span className="row center gap-8" style={{ fontSize: 13 }}><Icon name={m.charge ? 'alert' : 'wallet'} size={14} className="faint" />{m.desc}</span></td>
                    <td className="faint font-mono" style={{ fontSize: 11.5 }}>{m.ref}</td>
                    <td className="num" style={{ fontWeight: 600, color: m.amount < 0 ? 'var(--red)' : 'var(--text)' }}>{m.amount < 0 ? '−' : ''}{fmtMoney(Math.abs(m.amount))}</td>
                    <td>{c
                      ? <div className="person"><Avatar name={who} size={26} /><div><div className="pname" style={{ fontSize: 12.5 }}>{who}</div><div className="faint font-mono" style={{ fontSize: 10.5 }}>{c.recibo} · {c.concept}</div></div></div>
                      : <Badge tone={m.charge ? 'gray' : 'amber'} dot>{m.charge ? 'Cargo bancario' : 'Sin coincidencia'}</Badge>}</td>
                    <td>{c
                      ? (isDone
                        ? <span className="row center gap-8" style={{ fontSize: 12.5, color: 'var(--green)', fontWeight: 600 }}><Icon name="check" size={14} stroke={2.6} />Conciliado</span>
                        : <button className="btn sm primary" onClick={() => conciliar(m)}><Icon name="check" size={13} className="btn-ico" />Conciliar</button>)
                      : (m.charge ? <span className="faint" style={{ fontSize: 12 }}>—</span> : <button className="btn sm" onClick={() => toast('Movimiento marcado para revisión manual', 'info')}><Icon name="search" size={13} className="btn-ico" />Revisar</button>)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

/* ============ Estado de resultados (P&L) ============ */
function EstadoResultados({ onClose }) {
  const cobros = DB.cobros || [];
  const egresos = DB.egresos || [];
  const ingTotal = cobros.reduce((a, c) => a + c.amount, 0);
  const egTotal = egresos.reduce((a, e) => a + e.amount, 0);
  const utilidad = ingTotal - egTotal;
  const margen = ingTotal ? Math.round(utilidad / ingTotal * 100) : 0;

  const ingByCat = {}; cobros.forEach(c => { const k = c.conceptCat || 'Otros'; ingByCat[k] = (ingByCat[k] || 0) + c.amount; });
  const egByCat = {}; egresos.forEach(e => { egByCat[e.category] = (egByCat[e.category] || 0) + e.amount; });
  const ingRows = Object.entries(ingByCat).sort((a, b) => b[1] - a[1]);
  const egRows = Object.entries(egByCat).sort((a, b) => b[1] - a[1]);

  function exportCSV() {
    const lines = [['ESTADO DE RESULTADOS · Ciclo ' + (window.PIAGET_CYCLE ? PIAGET_CYCLE() : '2025–2026'), ''], ['', ''], ['INGRESOS', '']];
    ingRows.forEach(([k, v]) => lines.push([k, v]));
    lines.push(['Total ingresos', ingTotal], ['', ''], ['EGRESOS', '']);
    egRows.forEach(([k, v]) => lines.push([k, v]));
    lines.push(['Total egresos', egTotal], ['', ''], ['Utilidad neta', utilidad], ['Margen operativo', margen + '%']);
    const csv = lines.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\ufeff' + csv);
    a.download = 'estado_resultados.csv'; a.click(); toast('Estado de resultados exportado ✓');
  }

  const Line = ({ label, value, color, strong, neg }) => (
    <div className="row between center" style={{ padding: strong ? '11px 0' : '7px 0', borderTop: strong ? '1px solid var(--border)' : 'none' }}>
      <span className="row center gap-8" style={{ fontSize: strong ? 14 : 13, fontWeight: strong ? 700 : 500 }}>{color && <span style={{ width: 9, height: 9, borderRadius: 3, background: color, flexShrink: 0 }} />}{label}</span>
      <span className="tnum" style={{ fontWeight: strong ? 700 : 600, fontSize: strong ? 15 : 13.5, color: neg ? 'var(--red)' : 'var(--text)' }}>{neg ? '−' : ''}{fmtMoney(Math.abs(value))}</span>
    </div>
  );

  return (
    <Modal open width={620} onClose={onClose} title="Estado de resultados"
      footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={exportCSV}><Icon name="download" size={15} className="btn-ico" />Exportar</button></>}>
      <div className="faint" style={{ fontSize: 12.5, marginBottom: 12 }}>{DB.settings.schoolName} · Ciclo {(window.PIAGET_CYCLE ? PIAGET_CYCLE() : '2025–2026')} · cifras acumuladas</div>
      <div className="card pad" style={{ marginBottom: 12 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Ingresos</div>
        {ingRows.map(([k, v]) => <Line key={k} label={k} value={v} color={(window.ING_CONCEPT_COLORS && window.ING_CONCEPT_COLORS[k]) || 'var(--accent)'} />)}
        <Line label="Total ingresos" value={ingTotal} strong />
      </div>
      <div className="card pad" style={{ marginBottom: 12 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Egresos</div>
        {egRows.map(([k, v]) => <Line key={k} label={k} value={v} color={(DB.egresoColors && DB.egresoColors[k]) || 'var(--cyan)'} neg />)}
        <Line label="Total egresos" value={egTotal} strong neg />
      </div>
      <div className="card pad" style={{ background: utilidad >= 0 ? 'var(--green-soft)' : 'var(--red-soft)' }}>
        <div className="row between center">
          <div><div style={{ fontWeight: 700, fontSize: 15 }}>Utilidad neta</div><div className="faint" style={{ fontSize: 12 }}>Margen operativo {margen}%</div></div>
          <div className="font-display tnum" style={{ fontSize: 26, fontWeight: 700, color: utilidad >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtMoney(utilidad)}</div>
        </div>
      </div>
    </Modal>
  );
}

/* ============ Editar presupuesto (persistido) ============ */
const BUDGET_KEY = 'piaget_egreso_budget';
function loadBudget() {
  const def = (window.DB && DB.egresoBudget) || {};
  try { const s = JSON.parse(localStorage.getItem(BUDGET_KEY) || 'null'); return s ? { ...def, ...s } : { ...def }; } catch (e) { return { ...def }; }
}
function persistBudget(b) { try { localStorage.setItem(BUDGET_KEY, JSON.stringify(b)); } catch (e) { } }

function EditarPresupuesto({ budget, onSave, onClose }) {
  const [vals, setVals] = React.useState({ ...budget });
  const total = Object.values(vals).reduce((a, v) => a + (Number(v) || 0), 0);
  function save() { const clean = {}; Object.keys(vals).forEach(k => clean[k] = Math.max(0, Math.round(Number(vals[k]) || 0))); onSave(clean); toast('Presupuesto actualizado ✓'); onClose(); }
  function reset() { setVals({ ...((window.DB && DB.egresoBudget) || {}) }); }
  return (
    <Modal open width={520} onClose={onClose} title="Editar presupuesto del ciclo"
      footer={<><button className="btn" onClick={reset}><Icon name="refresh" size={14} className="btn-ico" />Restablecer</button><span className="grow" /><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar</button></>}>
      <div className="faint" style={{ fontSize: 12.5, marginBottom: 12 }}>Define el presupuesto anual por categoría. Se guarda en este navegador y la comparación se recalcula al instante.</div>
      <div className="col gap-10">
        {Object.keys(vals).map(cat => (
          <div className="row between center" key={cat} style={{ gap: 12 }}>
            <span className="row center gap-8" style={{ fontSize: 13.5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: (DB.egresoColors && DB.egresoColors[cat]) || 'var(--cyan)', flexShrink: 0 }} />{cat}</span>
            <div style={{ width: 170 }}><NumberInput value={vals[cat]} min="0" step="1000" onChange={e => setVals(v => ({ ...v, [cat]: e.target.value }))} /></div>
          </div>
        ))}
        <div className="row between center" style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
          <span style={{ fontWeight: 700 }}>Total presupuesto</span>
          <span className="font-display tnum" style={{ fontSize: 18, fontWeight: 700 }}>{fmtMoney(total)}</span>
        </div>
      </div>
    </Modal>
  );
}

function Finanzas({ go }) {
  const store = useStore();
  const [concil, setConcil] = React.useState(false);
  const [pyl, setPyl] = React.useState(false);
  const [budget, setBudget] = React.useState(loadBudget);
  const [editBudget, setEditBudget] = React.useState(false);

  const cobros = DB.cobros || [];
  const egresos = DB.egresos || [];
  const adeudos = window.ctaAdeudos ? window.ctaAdeudos() : [];

  const ingTotal = cobros.reduce((a, c) => a + c.amount, 0);
  const egTotal = egresos.reduce((a, e) => a + e.amount, 0);
  const utilidad = ingTotal - egTotal;
  const margen = ingTotal ? Math.round(utilidad / ingTotal * 100) : 0;
  const carteraTotal = adeudos.reduce((a, s) => a + s.saldo, 0);

  // series mensuales (unión de meses)
  const ingM = finMonthAgg(cobros, c => c.amount);
  const egM = finMonthAgg(egresos, e => e.amount);
  const allKeys = Array.from(new Set([...ingM.keys, ...egM.keys])).sort();
  const labels = allKeys.map(k => FIN_MES[k.slice(5, 7)] || k);
  const ingSeries = allKeys.map(k => { const i = ingM.keys.indexOf(k); return i >= 0 ? ingM.data[i] : 0; });
  const egSeries = allKeys.map(k => { const i = egM.keys.indexOf(k); return i >= 0 ? egM.data[i] : 0; });

  // egresos por categoría
  const egByCat = {}; egresos.forEach(e => { egByCat[e.category] = (egByCat[e.category] || 0) + e.amount; });
  const egRows = Object.entries(egByCat).map(([cat, value]) => ({ cat, value, color: (DB.egresoColors && DB.egresoColors[cat]) || 'var(--cyan)' })).sort((a, b) => b.value - a.value);
  const egMax = Math.max(...egRows.map(r => r.value), 1);

  // antigüedad de cartera (derivada de los adeudos reales por alumno)
  const AGING = [['Por vencer', 'var(--green)'], ['1–30 días', 'var(--accent)'], ['31–60 días', 'var(--amber)'], ['+60 días', 'var(--red)']];
  const aging = AGING.map(([bucket, color]) => ({ bucket, color, value: 0, n: 0 }));
  adeudos.forEach(s => { const h = finHash(s.name); const bi = s.estatus === 'parcial' ? (h % 2) : 2 + (h % 2); aging[bi].value += s.saldo; aging[bi].n += 1; });
  const vencidoTotal = aging[2].value + aging[3].value;

  // ledger combinado (movimientos recientes)
  const ledger = [
    ...cobros.map(c => ({ date: c.date, time: c.time || '', concept: c.concept, party: c.student || c.family, amount: c.amount, type: 'ingreso' })),
    ...egresos.map(e => ({ date: e.date, time: '', concept: e.concept, party: e.provider, amount: -e.amount, type: 'egreso', status: e.status })),
  ].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 14);

  // presupuesto vs. real por categoría (editable, persistido)
  const presupRows = Object.keys(budget).map(cat => ({ cat, budget: budget[cat], real: egByCat[cat] || 0, color: (DB.egresoColors && DB.egresoColors[cat]) || 'var(--cyan)' })).sort((a, b) => b.budget - a.budget);
  const presupTotal = presupRows.reduce((a, r) => a + r.budget, 0);

  // flujo de caja proyectado
  const baseCash = 800000;
  const histNet = allKeys.map((k, i) => ingSeries[i] - egSeries[i]);
  const n3 = Math.min(3, ingSeries.length) || 1;
  const avgIng = Math.round(ingSeries.slice(-3).reduce((a, b) => a + b, 0) / n3);
  const avgEg = Math.round(egSeries.slice(-3).reduce((a, b) => a + b, 0) / n3);
  const projNet = avgIng - avgEg;
  const flujoLabels = [...labels, 'Sep', 'Oct', 'Nov'];
  const flujoNets = [...histNet, projNet, projNet, projNet];
  let runCash = baseCash; const saldo = flujoNets.map(nv => (runCash += nv));
  const saldoProj = saldo[saldo.length - 1];
  const flujoProm = Math.round(histNet.reduce((a, b) => a + b, 0) / (histNet.length || 1));

  const kpis = [
    { label: 'Ingresos del ciclo', value: fmtMoney(ingTotal), icon: 'trendUp', tone: 'green' },
    { label: 'Egresos del ciclo', value: fmtMoney(egTotal), icon: 'wallet', tone: 'blue' },
    { label: 'Margen operativo', value: margen + '%', icon: 'pie', tone: 'violet', sub: 'Utilidad ' + fmtMoney(utilidad) },
    { label: 'Cartera por cobrar', value: fmtMoney(carteraTotal), icon: 'alert', tone: 'amber', sub: adeudos.length + ' alumnos con adeudo' },
  ];

  return (
    <div className="content-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 7 }}>Tesorería</div>
          <h1 className="page-title">Finanzas</h1>
          <p className="page-desc">Ciclo {(window.PIAGET_CYCLE ? PIAGET_CYCLE() : '2025–2026')} · margen operativo <b style={{ color: 'var(--text)' }}>{margen}%</b> · {fmtMoney(carteraTotal)} por cobrar</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => go('cobros')}><Icon name="wallet" size={15} className="btn-ico" />Ir a Cobros</button>
          <button className="btn" onClick={() => setConcil(true)}><Icon name="refresh" size={15} className="btn-ico" />Conciliar</button>
          <button className="btn primary" onClick={() => setPyl(true)}><Icon name="doc" size={15} className="btn-ico" />Estado de resultados</button>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {kpis.map((k, i) => {
          const t = window.TONE[k.tone];
          return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum" style={{ fontSize: 24 }}>{k.value}</div>
              <div className="kpi-foot"><span className="muted" style={{ fontSize: 11.5 }}>{k.sub || ''}</span></div>
            </div>
          );
        })}
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card">
          <CardHead icon="bars" title="Ingresos vs. egresos" sub="Por mes · ciclo actual"
            right={<div className="row gap-16">
              <span className="row center gap-8" style={{ fontSize: 12.5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} />Ingresos</span>
              <span className="row center gap-8" style={{ fontSize: 12.5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--cyan)' }} />Egresos</span>
            </div>} />
          <div className="card pad" style={{ borderTop: 'none' }}>
            <BarChart data={[ingSeries, egSeries]} labels={labels} colors={['var(--accent)', 'var(--cyan)']} height={216} money />
          </div>
        </div>

        <div className="card">
          <CardHead icon="pie" title="Egresos por categoría" sub={'Total ' + fmtMoney(egTotal)} />
          <div className="card pad col gap-12" style={{ borderTop: 'none' }}>
            {egRows.map((r, i) => (
              <div key={i}>
                <div className="row between center" style={{ marginBottom: 6 }}>
                  <span className="row center gap-8" style={{ fontSize: 13 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: r.color, flexShrink: 0 }} />{r.cat}</span>
                  <span className="tnum" style={{ fontWeight: 600, fontSize: 13 }}>{fmtMoney(r.value)}</span>
                </div>
                <Bar value={r.value / egMax * 100} color={r.color} height={8} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
        {/* Antigüedad de cartera */}
        <div className="card">
          <CardHead icon="alert" title="Antigüedad de cartera" sub={'Total por cobrar ' + fmtMoney(carteraTotal)} />
          <div className="card pad col gap-16" style={{ borderTop: 'none' }}>
            {aging.map((a, i) => (
              <div key={i}>
                <div className="row between center" style={{ marginBottom: 6 }}>
                  <span className="row center gap-8" style={{ fontSize: 13.5 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: a.color }} />{a.bucket}
                    <span className="faint" style={{ fontSize: 12 }}>· {a.n} alumnos</span>
                  </span>
                  <span className="tnum" style={{ fontWeight: 600, fontSize: 13.5 }}>{fmtMoney(a.value)}</span>
                </div>
                <Bar value={carteraTotal ? a.value / carteraTotal * 100 : 0} color={a.color} height={8} />
              </div>
            ))}
            <div className="row between center mt-8" style={{ padding: '12px 14px', background: 'var(--red-soft)', borderRadius: 'var(--r-sm)' }}>
              <span className="row center gap-8" style={{ fontSize: 13, fontWeight: 600, color: 'oklch(0.5 0.16 25)' }}><Icon name="alert" size={16} />Vencido +30 días · {fmtMoney(vencidoTotal)}</span>
              <button className="chip-btn" style={{ color: 'oklch(0.5 0.16 25)', borderColor: 'oklch(0.8 0.08 25)' }} onClick={() => go('pendientes')}>Gestionar</button>
            </div>
          </div>
        </div>

        {/* Movimientos recientes (ledger) */}
        <div className="card">
          <CardHead icon="doc" title="Movimientos recientes" sub="Ingresos y egresos"
            right={<button className="btn sm" onClick={() => go('ingresos')}><Icon name="trendUp" size={14} className="btn-ico" />Ver ingresos</button>} />
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Fecha</th><th>Movimiento</th><th>Contraparte</th><th className="num">Monto</th><th>Tipo</th></tr></thead>
              <tbody>
                {ledger.map((l, i) => (
                  <tr key={i}>
                    <td className="muted font-mono" style={{ fontSize: 12 }}>{finDate(l.date)}</td>
                    <td className="muted" style={{ maxWidth: 200 }}>{l.concept}</td>
                    <td style={{ fontSize: 12.5 }}>{l.party}</td>
                    <td className="num" style={{ fontWeight: 600, color: l.amount < 0 ? 'var(--red)' : 'var(--green)' }}>{l.amount < 0 ? '−' : '+'}{fmtMoney(Math.abs(l.amount))}</td>
                    <td>{l.type === 'ingreso' ? <Badge tone="green" dot>Ingreso</Badge> : <Badge tone="blue" dot>Egreso</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1.2fr' }}>
        <div className="card">
          <CardHead icon="target" title="Presupuesto vs. real" sub={'Ejercido ' + fmtMoney(egTotal) + ' de ' + fmtMoney(presupTotal)}
            right={<button className="btn sm" onClick={() => setEditBudget(true)}><Icon name="edit" size={13} className="btn-ico" />Editar</button>} />
          <div className="card pad col gap-14" style={{ borderTop: 'none' }}>
            {presupRows.map((r, i) => {
              const pct = r.budget ? Math.round(r.real / r.budget * 100) : 0; const over = r.real > r.budget;
              return (
                <div key={i}>
                  <div className="row between center" style={{ marginBottom: 6 }}>
                    <span className="row center gap-8" style={{ fontSize: 13 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: r.color, flexShrink: 0 }} />{r.cat}</span>
                    <span className="row center gap-8"><span className="tnum faint" style={{ fontSize: 11.5 }}>{fmtMoney(r.real)} / {fmtMoney(r.budget)}</span><Badge tone={over ? 'red' : 'green'}>{pct}%</Badge></span>
                  </div>
                  <Bar value={Math.min(100, pct)} color={over ? 'var(--red)' : r.color} height={8} />
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <CardHead icon="trendUp" title="Flujo de caja proyectado" sub="Saldo acumulado · histórico + proyección 90 días" />
          <div className="card pad" style={{ borderTop: 'none' }}>
            <div className="row gap-24" style={{ marginBottom: 12 }}>
              <div><div className="faint" style={{ fontSize: 11 }}>Flujo neto mensual prom.</div><div className="font-display tnum" style={{ fontSize: 18, fontWeight: 700, color: flujoProm >= 0 ? 'var(--green)' : 'var(--red)' }}>{flujoProm >= 0 ? '+' : '−'}{fmtMoney(Math.abs(flujoProm))}</div></div>
              <div><div className="faint" style={{ fontSize: 11 }}>Saldo proyectado a 90 días</div><div className="font-display tnum" style={{ fontSize: 18, fontWeight: 700 }}>{fmtMoney(saldoProj)}</div></div>
            </div>
            <AreaChart series={[{ name: 'Saldo', data: saldo }]} labels={flujoLabels} height={184} money />
            <div className="faint" style={{ fontSize: 11.5, marginTop: 8 }}>Proyección Sep–Nov con base en el promedio de los últimos 3 meses (+{fmtMoney(projNet)}/mes de flujo neto).</div>
          </div>
        </div>
      </div>

      <div className="ai-panel mt-16">
        <div className="insight" style={{ borderTop: 'none', alignItems: 'center' }}>
          <div className="ai-orb" style={{ width: 34, height: 34 }}><Icon name="spark" size={18} fill="currentColor" /></div>
          <div className="insight-body">
            <div className="insight-title">Salud financiera</div>
            <div className="insight-text">Margen operativo de <b>{margen}%</b> ({fmtMoney(utilidad)} de utilidad). La cartera por cobrar suma <b>{fmtMoney(carteraTotal)}</b>, con <b>{fmtMoney(vencidoTotal)}</b> vencido +30 días. Recuperar el 40% subiría el flujo del próximo mes ~{fmtMoney(Math.round(vencidoTotal * 0.4))}.</div>
          </div>
          <button className="btn primary nowrap" onClick={() => go('comunicados')}><Icon name="megaphone" size={15} className="btn-ico" />Campaña de cobranza</button>
        </div>
      </div>

      {concil && <ConciliacionBancaria onClose={() => setConcil(false)} />}
      {pyl && <EstadoResultados onClose={() => setPyl(false)} />}
      {editBudget && <EditarPresupuesto budget={budget} onSave={(b) => { setBudget(b); persistBudget(b); }} onClose={() => setEditBudget(false)} />}
    </div>
  );
}

window.Finanzas = Finanzas;
