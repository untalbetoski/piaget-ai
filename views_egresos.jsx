/* views_egresos.jsx — Egresos (registro y administración del gasto operativo)
   ─────────────────────────────────────────────────────────────
   Origen de datos: DB.egresos · categorías DB.egresoColors · presupuesto DB.egresoBudget.
   Módulo análogo a Ingresos: KPIs, evolución, mezcla por categoría / método /
   proveedor, presupuesto vs. real, tabla de movimientos, alta y baja de egresos. */

const EGR_MESES = { '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic' };
const EGR_MESES_FULL = { '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril', '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto', '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre' };
const EGR_METODO_COLORS = { 'Transferencia': 'var(--accent)', 'Domiciliación': 'var(--cyan)', 'Cheque': 'var(--violet)', 'Efectivo': 'var(--green)', 'Tarjeta': 'var(--amber)' };
const EGR_METODOS = ['Transferencia', 'Domiciliación', 'Cheque', 'Efectivo', 'Tarjeta'];
const EGR_BUDGET_KEY = 'piaget_egreso_budget';

function egrCats() { return Object.keys((window.DB && DB.egresoColors) || { 'Proveedores': 'var(--cyan)' }); }
function egrColor(cat) { return ((window.DB && DB.egresoColors) || {})[cat] || 'var(--text-faint)'; }
function egrCicloLabel() { return 'Ciclo ' + ((window.DB && DB.settings && DB.settings.cycle) || '2025–2026'); }
function egrPeriodLabel(p) { if (p === 'todo') return egrCicloLabel(); const [y, m] = p.split('-'); return (EGR_MESES_FULL[m] || m) + ' ' + y; }
function egrDate(iso) { if (!iso) return '—'; const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }); }
function egrAgg(rows, keyFn) {
  const m = {};
  rows.forEach(r => { const k = keyFn(r) || '—'; if (!m[k]) m[k] = { label: k, value: 0, n: 0 }; m[k].value += r.amount; m[k].n += 1; });
  return Object.values(m).sort((a, b) => b.value - a.value);
}
function egrLoadBudget() {
  const def = (window.DB && DB.egresoBudget) || {};
  try { const s = JSON.parse(localStorage.getItem(EGR_BUDGET_KEY) || 'null'); return s ? { ...def, ...s } : { ...def }; } catch (e) { return { ...def }; }
}
function egrSaveBudget(b) { try { localStorage.setItem(EGR_BUDGET_KEY, JSON.stringify(b)); } catch (e) { } }
/* asegura _id en los egresos sembrados para poder editarlos / eliminarlos */
function egrEnsureIds() { (window.DB && DB.egresos || []).forEach(e => { if (!e._id) e._id = e.id || ('eg-' + Math.random().toString(36).slice(2)); }); }

/* ---------- Modal: registrar / editar egreso ---------- */
function RegistrarEgreso({ egreso, onClose }) {
  const editing = !!egreso;
  const [form, setForm] = React.useState(() => egreso
    ? { category: egreso.category, concept: egreso.concept, provider: egreso.provider || '', amount: egreso.amount, method: egreso.method || 'Transferencia', date: egreso.date || new Date().toISOString().slice(0, 10), status: egreso.status || 'pagado' }
    : { category: egrCats()[0], concept: '', provider: '', amount: '', method: 'Transferencia', date: new Date().toISOString().slice(0, 10), status: 'pagado' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function save() {
    if (!form.concept.trim()) { toast('Escribe el concepto del egreso', 'warn'); return; }
    if (!Number(form.amount)) { toast('Captura un monto válido', 'warn'); return; }
    const payload = { category: form.category, concept: form.concept.trim(), provider: form.provider.trim() || '—', amount: Number(form.amount), method: form.method, date: form.date, status: form.status };
    if (editing) {
      Store.update('egresos', egreso._id, payload);
      Store.log('Tesorería', 'editó un egreso de ' + fmtMoney(Number(form.amount)) + ' · ' + form.category, 'edit');
      toast('Egreso actualizado ✓');
    } else {
      Store.add('egresos', payload);
      Store.log('Tesorería', 'registró un egreso de ' + fmtMoney(Number(form.amount)) + ' · ' + form.category, 'wallet');
      toast('Egreso registrado ✓');
    }
    onClose();
  }
  return (
    <Modal open width={560} onClose={onClose} title={editing ? 'Editar egreso' : 'Registrar egreso'}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{editing ? 'Guardar' : 'Registrar'}</button></>}>
      <Field label="Concepto"><TextInput value={form.concept} onChange={e => set('concept', e.target.value)} placeholder="p. ej. Energía eléctrica · agosto" autoFocus /></Field>
      <div className="field-row">
        <Field label="Categoría"><SelectInput value={form.category} onChange={e => set('category', e.target.value)} options={egrCats()} /></Field>
        <Field label="Proveedor"><TextInput value={form.provider} onChange={e => set('provider', e.target.value)} placeholder="Nombre del proveedor" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Monto (MXN)"><NumberInput value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" min="0" /></Field>
        <Field label="Método"><SelectInput value={form.method} onChange={e => set('method', e.target.value)} options={EGR_METODOS} /></Field>
        <Field label="Estatus"><SelectInput value={form.status} onChange={e => set('status', e.target.value)} options={[{ value: 'pagado', label: 'Pagado' }, { value: 'programado', label: 'Programado' }]} /></Field>
      </div>
      <Field label="Fecha"><input className="inp" type="date" value={form.date} onChange={e => set('date', e.target.value)} style={{ height: 38 }} /></Field>
    </Modal>
  );
}

/* ---------- Modal: editar presupuesto del ciclo ---------- */
function EgrEditarPresupuesto({ budget, onSave, onClose }) {
  const [vals, setVals] = React.useState({ ...budget });
  const total = Object.values(vals).reduce((a, v) => a + (Number(v) || 0), 0);
  function save() { const clean = {}; Object.keys(vals).forEach(k => clean[k] = Math.max(0, Math.round(Number(vals[k]) || 0))); onSave(clean); toast('Presupuesto actualizado ✓'); onClose(); }
  return (
    <Modal open width={520} onClose={onClose} title="Editar presupuesto del ciclo"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar</button></>}>
      <p className="faint" style={{ fontSize: 12.5, margin: '0 0 14px', lineHeight: 1.5 }}>Presupuesto mensual por categoría · total {fmtMoney(total)}.</p>
      <div className="col gap-12">
        {Object.keys(vals).map(cat => (
          <div className="row between center" key={cat} style={{ gap: 12 }}>
            <span className="row center gap-8" style={{ fontSize: 13.5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: egrColor(cat), flexShrink: 0 }} />{cat}</span>
            <div style={{ width: 170 }}><NumberInput value={vals[cat]} min="0" step="1000" onChange={e => setVals(v => ({ ...v, [cat]: e.target.value }))} /></div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ============ VISTA: EGRESOS ============ */
function Egresos({ go }) {
  useStore();
  egrEnsureIds();
  const [filter, setFilter] = React.useState('Todas');
  const [q, setQ] = React.useState('');
  const [periodo, setPeriodo] = React.useState('todo');
  const [reg, setReg] = React.useState(false);
  const [editEg, setEditEg] = React.useState(null);
  const [budget, setBudget] = React.useState(egrLoadBudget);
  const [editBudget, setEditBudget] = React.useState(false);

  const allEg = DB.egresos || [];
  const periodMonths = Array.from(new Set(allEg.map(e => (e.date || '').slice(0, 7)).filter(Boolean))).sort().reverse();
  const egresos = periodo === 'todo' ? allEg : allEg.filter(e => (e.date || '').slice(0, 7) === periodo);

  const total = egresos.reduce((a, e) => a + e.amount, 0);
  const ticket = egresos.length ? Math.round(total / egresos.length) : 0;
  const programado = egresos.filter(e => e.status === 'programado').reduce((a, e) => a + e.amount, 0);

  const porCat = egrAgg(egresos, e => e.category);
  const porMetodo = egrAgg(egresos, e => e.method);
  const porProveedor = egrAgg(egresos, e => e.provider).slice(0, 6);
  const maxCat = Math.max(...porCat.map(c => c.value), 1);
  const maxMet = Math.max(...porMetodo.map(c => c.value), 1);
  const maxProv = Math.max(...porProveedor.map(c => c.value), 1);

  // evolución mensual (todo el ciclo)
  const byMonth = {};
  allEg.forEach(e => { const k = (e.date || '').slice(0, 7); if (k) byMonth[k] = (byMonth[k] || 0) + e.amount; });
  const months = Object.keys(byMonth).sort();
  const evoLabels = months.map(m => EGR_MESES[m.slice(5, 7)] || m);
  const evoData = months.map(m => byMonth[m]);

  // presupuesto vs real
  const egByCat = {}; egresos.forEach(e => { egByCat[e.category] = (egByCat[e.category] || 0) + e.amount; });
  const presupRows = Object.keys(budget).map(cat => ({ cat, budget: budget[cat], real: egByCat[cat] || 0, color: egrColor(cat) })).sort((a, b) => b.budget - a.budget);
  const presupTotal = presupRows.reduce((a, r) => a + r.budget, 0);
  const pctPresup = presupTotal ? Math.round(total / presupTotal * 100) : 0;

  // tabla
  const shown = egresos.filter(e => {
    const byCat = filter === 'Todas' || e.category === filter;
    const text = ((e.concept || '') + ' ' + (e.provider || '') + ' ' + (e.category || '')).toLowerCase();
    return byCat && (!q.trim() || text.includes(q.toLowerCase()));
  }).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const capped = shown.slice(0, 60);
  const cats = ['Todas', ...egrCats()];

  function exportCSV() {
    const head = ['Fecha', 'Categoría', 'Concepto', 'Proveedor', 'Método', 'Monto', 'Estatus'];
    const rows = shown.map(e => [e.date, e.category, e.concept, e.provider || '', e.method || '', e.amount, e.status || 'pagado']);
    const csv = [head, ...rows].map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\ufeff' + csv);
    a.download = 'egresos_' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
    toast(shown.length + ' movimientos exportados ✓');
  }
  function delEgreso(e) { Store.remove('egresos', e._id); Store.log('Tesorería', 'eliminó un egreso de ' + fmtMoney(e.amount) + ' · ' + e.category, 'trash'); toast('Egreso eliminado', 'warn'); }

  const topCat = porCat[0];

  return (
    <div className="content-inner">
      <PageHead eyebrow="Tesorería" title="Egresos" desc={egrPeriodLabel(periodo) + ' · ' + egresos.length + ' movimientos · ' + fmtMoney(total) + ' erogado'}>
        <select className="inp" value={periodo} onChange={e => setPeriodo(e.target.value)} style={{ height: 36, padding: '0 30px 0 12px', fontSize: 13, width: 'auto', fontWeight: 600 }}>
          <option value="todo">Todo el ciclo</option>
          {periodMonths.map(m => <option key={m} value={m}>{egrPeriodLabel(m)}</option>)}
        </select>
        <button className="btn" onClick={exportCSV}><Icon name="download" size={15} className="btn-ico" />Exportar CSV</button>
        <button className="btn" onClick={() => go('finanzas')}><Icon name="pie" size={15} className="btn-ico" />Ir a Finanzas</button>
        <button className="btn primary" onClick={() => setReg(true)}><Icon name="plus" size={15} className="btn-ico" />Registrar egreso</button>
      </PageHead>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Total erogado', value: fmtMoney(total), icon: 'wallet', tone: 'blue' },
          { label: 'Movimientos', value: fmtNum(egresos.length), icon: 'receipt', tone: 'violet' },
          { label: 'Egreso promedio', value: fmtMoney(ticket), icon: 'bars', tone: 'cyan' },
          { label: 'Programado por pagar', value: fmtMoney(programado), icon: 'clock', tone: 'amber' },
        ].map((k, i) => {
          const t = window.TONE[k.tone];
          return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum" style={{ fontSize: 25 }}>{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="card">
          <CardHead icon="trendUp" title="Evolución de egresos" sub="Gasto por mes" />
          <div className="card pad" style={{ borderTop: 'none' }}>
            {evoData.length > 1
              ? <AreaChart series={[{ name: 'Egresos', data: evoData }]} labels={evoLabels} height={224} money />
              : <div className="col center gap-8 faint" style={{ padding: 40 }}><Icon name="bars" size={28} stroke={1.4} /><span style={{ fontSize: 13 }}>Sin suficiente historial mensual.</span></div>}
          </div>
        </div>
        <div className="card">
          <CardHead icon="pie" title="Egresos por categoría" sub={'Total ' + fmtMoney(total)} />
          <div className="card pad col gap-12" style={{ borderTop: 'none' }}>
            {porCat.length === 0 && <div className="faint" style={{ fontSize: 13, padding: '16px 2px' }}>Aún no hay egresos registrados.</div>}
            {porCat.map((c, i) => (
              <div key={i}>
                <div className="row between center" style={{ marginBottom: 6 }}>
                  <span className="row center gap-8" style={{ fontSize: 13 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: egrColor(c.label), flexShrink: 0 }} />{c.label}</span>
                  <span className="tnum" style={{ fontWeight: 600, fontSize: 13 }}>{fmtMoney(c.value)}</span>
                </div>
                <Bar value={c.value / maxCat * 100} color={egrColor(c.label)} height={8} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <CardHead icon="bars" title="Por método de pago" sub="Distribución del gasto" />
          <div className="card pad col gap-14" style={{ borderTop: 'none' }}>
            {porMetodo.length === 0 && <div className="faint" style={{ fontSize: 13, padding: '16px 2px' }}>Sin movimientos.</div>}
            {porMetodo.map((c, i) => (
              <div key={i}>
                <div className="row between center" style={{ marginBottom: 6 }}>
                  <span className="row center gap-8" style={{ fontSize: 13.5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: EGR_METODO_COLORS[c.label] || 'var(--accent)', flexShrink: 0 }} />{c.label}<span className="faint" style={{ fontSize: 12 }}>· {c.n} pagos</span></span>
                  <span className="tnum" style={{ fontWeight: 600, fontSize: 13.5 }}>{fmtMoney(c.value)}</span>
                </div>
                <Bar value={c.value / maxMet * 100} color={EGR_METODO_COLORS[c.label] || 'var(--accent)'} height={8} />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <CardHead icon="truck" title="Principales proveedores" sub="Por monto erogado" />
          <div className="card pad col gap-14" style={{ borderTop: 'none' }}>
            {porProveedor.length === 0 && <div className="faint" style={{ fontSize: 13, padding: '16px 2px' }}>Sin proveedores.</div>}
            {porProveedor.map((c, i) => (
              <div key={i}>
                <div className="row between center" style={{ marginBottom: 6 }}>
                  <span className="row center gap-8" style={{ fontSize: 13.5 }}><span className="faint tnum" style={{ width: 14, fontSize: 11.5 }}>{i + 1}</span>{c.label}<span className="faint" style={{ fontSize: 12 }}>· {c.n}</span></span>
                  <span className="tnum" style={{ fontWeight: 600, fontSize: 13.5 }}>{fmtMoney(c.value)}</span>
                </div>
                <Bar value={c.value / maxProv * 100} color="var(--accent)" height={8} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-16">
        <CardHead icon="target" title="Presupuesto vs. real" sub={'Ejercido ' + fmtMoney(total) + ' de ' + fmtMoney(presupTotal) + ' · ' + pctPresup + '%'}
          right={<button className="btn sm" onClick={() => setEditBudget(true)}><Icon name="edit" size={13} className="btn-ico" />Editar presupuesto</button>} />
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

      <div className="card mt-16">
        <CardHead icon="wallet" title="Movimientos de egreso" sub={shown.length + (shown.length === 1 ? ' movimiento' : ' movimientos') + (shown.length > 60 ? ' · mostrando 60' : '')}
          right={<div className="row center gap-8">
            <select className="inp" value={filter} onChange={e => setFilter(e.target.value)} style={{ height: 34, padding: '0 28px 0 10px', fontSize: 12.5, width: 'auto' }}>
              {cats.map(c => <option key={c} value={c}>{c === 'Todas' ? 'Todas las categorías' : c}</option>)}
            </select>
            <div style={{ position: 'relative' }}>
              <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
              <input className="inp" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar concepto, proveedor…" style={{ height: 34, padding: '0 10px 0 30px', fontSize: 12.5, width: 210 }} />
            </div>
          </div>} />
        {capped.length === 0 ? (
          <div className="col center gap-8 faint" style={{ padding: 46, textAlign: 'center' }}>
            <div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 44, height: 44 }}><Icon name="wallet" size={20} /></div>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>Sin movimientos</div>
            <div style={{ fontSize: 13 }}>Ningún egreso coincide con el filtro. Registra el primero con “Registrar egreso”.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Fecha</th><th>Categoría</th><th>Concepto</th><th>Proveedor</th><th>Método</th><th className="num">Monto</th><th>Estatus</th><th></th></tr></thead>
              <tbody>
                {capped.map((e, i) => (
                  <tr key={e._id || i}>
                    <td className="muted font-mono" style={{ fontSize: 12 }}>{egrDate(e.date)}</td>
                    <td><Badge tone="gray"><span className="row center gap-6"><span style={{ width: 8, height: 8, borderRadius: 3, background: egrColor(e.category) }} />{e.category}</span></Badge></td>
                    <td className="muted" style={{ maxWidth: 220 }}>{e.concept}</td>
                    <td style={{ fontSize: 12.5 }}>{e.provider || '—'}</td>
                    <td><span className="row center gap-8" style={{ fontSize: 13 }}><span style={{ width: 8, height: 8, borderRadius: 3, background: EGR_METODO_COLORS[e.method] || 'var(--accent)', flexShrink: 0 }} />{e.method || '—'}</span></td>
                    <td className="num" style={{ fontWeight: 600 }}>{fmtMoney(e.amount)}</td>
                    <td>{e.status === 'programado' ? <Badge tone="amber" dot>Programado</Badge> : <Badge tone="green" dot>Pagado</Badge>}</td>
                    <td><RowMenu items={[
                      { icon: 'edit', label: 'Editar', onClick: () => setEditEg(e) },
                      { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => delEgreso(e) },
                    ]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="ai-panel mt-16">
        <div className="insight" style={{ borderTop: 'none', alignItems: 'center' }}>
          <div className="ai-orb" style={{ width: 34, height: 34 }}><Icon name="spark" size={18} fill="currentColor" /></div>
          <div className="insight-body">
            <div className="insight-title">Análisis de egresos</div>
            <div className="insight-text">{total
              ? <>La categoría <b>{topCat.label}</b> concentra <b>{Math.round(topCat.value / total * 100)}%</b> del gasto ({fmtMoney(topCat.value)}). Se ha ejercido el <b>{pctPresup}%</b> del presupuesto del periodo{programado ? <> y hay <b>{fmtMoney(programado)}</b> programado por pagar</> : null}.</>
              : <>Aún no hay egresos registrados en este periodo. Registra el gasto operativo para ver la distribución por categoría, método y proveedor.</>}</div>
          </div>
          <button className="btn primary nowrap" onClick={() => go('inteligencia-financiera')}><Icon name="bars" size={15} className="btn-ico" />Ver analítica</button>
        </div>
      </div>

      {reg && <RegistrarEgreso onClose={() => setReg(false)} />}
      {editEg && <RegistrarEgreso egreso={editEg} onClose={() => setEditEg(null)} />}
      {editBudget && <EgrEditarPresupuesto budget={budget} onSave={(b) => { setBudget(b); egrSaveBudget(b); }} onClose={() => setEditBudget(false)} />}
    </div>
  );
}

window.Egresos = Egresos;
