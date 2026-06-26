/* views_cobros_planes.jsx — Planes y tarifas de cobro por nivel
   ------------------------------------------------------------------
   Modelo del colegio:
   · Inscripción, Colegiatura anual y Cuota Anual (extras) son distintas por nivel.
   · 3 planes de colegiatura sobre el MISMO total anual:
       - Plan 10  → 10 mensualidades iguales (anual / 10).
       - Plan 12  → 12 colegiaturas (anual / 12) cobradas en 10 meses,
                     duplicando el cargo en el mes 04 y el mes 07.
       - Anual    → 1 solo pago con 10% de descuento.
   · El ciclo de cobros arranca en SEPTIEMBRE (mes 01).
*/

function cobSettings() {
  if (window.PIAGET_LIVE) return window.PIAGET_LIVE;
  try { const sv = JSON.parse(localStorage.getItem('piaget_settings') || 'null'); if (sv) return { ...((window.DB && DB.settings) || {}), ...sv }; } catch (e) { }
  return (window.DB && DB.settings) || {};
}
function cobActiveCycle() { return cobSettings().cycle || '2025–2026'; }
const COB_CICLO_LABEL = 'Ciclo ' + cobActiveCycle();
const COB_ANUAL_DESC = 0.10;                 // 10% pago anticipado
const COB_DOBLES = [4, 7];                    // meses con cargo doble en Plan 12
const COB_CICLO_MESES = ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

/* anual = total de colegiaturas del ciclo (Plan10×10 = Plan12×12) */
const COB_TARIFAS = [
  { nivel: 'Preescolar', tone: 'amber',  inscripcion: 4800, anual: 27480, plan10: 2748, plan12: 2290, extras: 2100 },
  { nivel: 'Primaria',   tone: 'blue',   inscripcion: 5900, anual: 51360, plan10: 5136, plan12: 4280, extras: 1995 },
  { nivel: 'Secundaria', tone: 'violet', inscripcion: 6000, anual: 51200, plan10: 5120, plan12: 4266, extras: 1990 },
];

/* Tarifas editables POR CICLO ESCOLAR: cada ciclo guarda sus propias cuotas
   en su propia llave; al cambiar de ciclo se parte de las tarifas vigentes. */
function cobKeyFor(cycle) { return 'piaget_cob_tarifas_' + String(cycle || cobActiveCycle()).replace(/\s/g, ''); }
function cobCicloKey() { return cobKeyFor(cobActiveCycle()); }
function cobRecalcPlanes(t) { t.plan10 = Math.round(t.anual / 10); t.plan12 = Math.round(t.anual / 12); return t; }
function cobLoadTarifas() {
  try {
    const v = JSON.parse(localStorage.getItem(cobCicloKey()) || 'null');
    if (Array.isArray(v)) v.forEach(saved => { const t = COB_TARIFAS.find(x => x.nivel === saved.nivel); if (t) { Object.assign(t, saved); cobRecalcPlanes(t); } });
  } catch (e) { }
}
/* lista de ciclos seleccionables: los configurados + el siguiente ciclo */
function cobCycleOptions() {
  const list = (((cobSettings().cycles) || []).map(c => c.name));
  const active = cobActiveCycle();
  if (!list.includes(active)) list.unshift(active);
  const m = /(\d{4})\D+(\d{4})/.exec(active);
  if (m) { const next = (Number(m[1]) + 1) + '–' + (Number(m[2]) + 1); if (!list.includes(next)) list.push(next); }
  return list;
}
/* valores (editables) de un ciclo: guardados, o se arrastran del ciclo vigente */
function cobValuesFor(cycle) {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(cobKeyFor(cycle)) || 'null'); } catch (e) { }
  return COB_TARIFAS.map(t => {
    const s = Array.isArray(saved) ? saved.find(x => x.nivel === t.nivel) : null;
    return { nivel: t.nivel, inscripcion: s ? s.inscripcion : t.inscripcion, anual: s ? s.anual : t.anual, extras: s ? s.extras : t.extras };
  });
}
/* guarda las cuotas de un ciclo; si es el vigente, también las aplica en vivo */
function cobSaveFor(cycle, rows) {
  const clean = rows.map(e => ({ nivel: e.nivel, inscripcion: Math.max(0, Number(e.inscripcion) || 0), anual: Math.max(0, Number(e.anual) || 0), extras: Math.max(0, Number(e.extras) || 0) }));
  try { localStorage.setItem(cobKeyFor(cycle), JSON.stringify(clean)); } catch (e) { }
  if (cycle === cobActiveCycle()) clean.forEach(e => { const t = COB_TARIFAS.find(x => x.nivel === e.nivel); if (t) { t.inscripcion = e.inscripcion; t.anual = e.anual; t.extras = e.extras; cobRecalcPlanes(t); } });
}
function cobSaveTarifas() {
  try { localStorage.setItem(cobCicloKey(), JSON.stringify(COB_TARIFAS.map(t => ({ nivel: t.nivel, inscripcion: t.inscripcion, anual: t.anual, extras: t.extras })))); } catch (e) { }
}
cobLoadTarifas();

/* ---------- helpers (globales vía function decl) ---------- */
function cobNivel(name) { return COB_TARIFAS.find(t => t.nivel === name) || COB_TARIFAS[0]; }
function cobNiveles() { return COB_TARIFAS.map(t => t.nivel); }
function cobPlanLabel(plan) { return plan === '10' ? 'Plan 10' : plan === '12' ? 'Plan 12' : 'Anual'; }
function cobPlanAnualPago(t) { return Math.round(t.anual * (1 - COB_ANUAL_DESC)); }
function cobPlanAhorro(t) { return t.anual - cobPlanAnualPago(t); }
function cobPlanTotalColeg(t, plan) { return plan === 'anual' ? cobPlanAnualPago(t) : t.anual; }
function cobTotalAnio(t, plan) { return t.inscripcion + cobPlanTotalColeg(t, plan) + t.extras; }

/* calendario de colegiaturas (10 meses) según el plan */
function cobSchedule(t, plan) {
  return COB_CICLO_MESES.map((mes, i) => {
    const n = i + 1;
    if (plan === '10') return { mes, n, amount: t.plan10, doble: false };
    if (plan === '12') { const doble = COB_DOBLES.includes(n); return { mes, n, amount: doble ? t.plan12 * 2 : t.plan12, doble }; }
    return { mes, n, amount: i === 0 ? cobPlanAnualPago(t) : 0, doble: false, unico: i === 0 };
  });
}

/* preset de concepto + monto para "Registrar pago" */
function cobPreset(nivelName, tipo, plan, mesIdx) {
  const t = cobNivel(nivelName);
  if (tipo === 'inscripcion') return { concept: 'Inscripción ' + t.nivel + ' · ' + COB_CICLO_LABEL, amount: t.inscripcion };
  if (tipo === 'extras') return { concept: 'Cuota Anual (extras) ' + t.nivel + ' · ' + COB_CICLO_LABEL, amount: t.extras };
  if (tipo === 'anual') return { concept: 'Colegiatura Anual ' + t.nivel + ' (−10%) · ' + COB_CICLO_LABEL, amount: cobPlanAnualPago(t) };
  const sch = cobSchedule(t, plan === 'anual' ? '10' : plan);
  const cell = sch[mesIdx] || sch[0];
  return { concept: 'Colegiatura ' + t.nivel + ' · ' + cell.mes + (cell.doble ? ' (doble)' : '') + ' · ' + cobPlanLabel(plan), amount: cell.amount };
}

Object.assign(window, {
  COB_TARIFAS, COB_CICLO_MESES, COB_DOBLES, COB_CICLO_LABEL, COB_ANUAL_DESC,
  cobNivel, cobNiveles, cobPlanLabel, cobPlanAnualPago, cobPlanAhorro, cobPlanTotalColeg, cobTotalAnio, cobSchedule, cobPreset,
});

/* ============ Vista: Planes y tarifas ============ */
function PlanesTarifas({ go }) {
  const [nivel, setNivel] = React.useState('Primaria');
  const [plan, setPlan] = React.useState('10');
  const [tick, setTick] = React.useState(0);
  const [edit, setEdit] = React.useState(null); // null | [{nivel, inscripcion, anual, extras}]
  const [editCycle, setEditCycle] = React.useState(cobActiveCycle());
  const t = cobNivel(nivel);
  const sch = cobSchedule(t, plan);
  const totalColeg = sch.reduce((a, c) => a + c.amount, 0);

  function openEdit() { const c = cobActiveCycle(); setEditCycle(c); setEdit(cobValuesFor(c)); }
  function changeEditCycle(c) { setEditCycle(c); setEdit(cobValuesFor(c)); }
  function setField(i, k, v) { setEdit(es => es.map((e, j) => j === i ? { ...e, [k]: v } : e)); }
  function saveEdit() {
    cobSaveFor(editCycle, edit);
    setEdit(null); setTick(n => n + 1);
    toast('Tarifas guardadas para ' + editCycle + (editCycle === cobActiveCycle() ? ' (ciclo vigente) ✓' : ' ✓'));
  }

  const planCards = [
    { id: '10', title: 'Plan 10', head: fmtMoney(t.plan10), unit: '/ mes', sub: '10 mensualidades iguales · Sep a Jun', foot: 'Total colegiatura ' + fmtMoney(t.anual), tone: 'blue' },
    { id: '12', title: 'Plan 12', head: fmtMoney(t.plan12), unit: '/ mes', sub: '12 colegiaturas en 10 meses · doble en Dic y Mar', foot: 'Meses dobles ' + fmtMoney(t.plan12 * 2) + ' · Total ' + fmtMoney(t.anual), tone: 'amber' },
    { id: 'anual', title: 'Anual', head: fmtMoney(cobPlanAnualPago(t)), unit: 'pago único', sub: '1 exhibición con 10% de descuento', foot: 'Ahorras ' + fmtMoney(cobPlanAhorro(t)), tone: 'green' },
  ];

  return (
    <React.Fragment>
      {/* Tabla de tarifas por nivel */}
      <div className="card">
        <CardHead icon="receipt" title="Tarifas por nivel" sub={COB_CICLO_LABEL + ' · montos en MXN'}
          right={<button className="btn sm" onClick={openEdit}><Icon name="edit" size={13} className="btn-ico" />Editar tarifas</button>} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr>
              <th>Nivel</th><th className="num">Inscripción</th><th className="num">Colegiatura anual</th>
              <th className="num">Plan 10 · mes</th><th className="num">Plan 12 · mes</th><th className="num">Anual −10%</th><th className="num">Cuota anual</th>
            </tr></thead>
            <tbody>
              {COB_TARIFAS.map(r => {
                const tn = window.TONE[r.tone] || window.TONE.blue;
                return (
                  <tr key={r.nivel} style={{ cursor: 'pointer', background: r.nivel === nivel ? 'var(--accent-soft)' : undefined }} onClick={() => setNivel(r.nivel)}>
                    <td><span className="row center gap-8" style={{ fontWeight: 600 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: tn.c, flexShrink: 0 }} />{r.nivel}</span></td>
                    <td className="num tnum">{fmtMoney(r.inscripcion)}</td>
                    <td className="num tnum">{fmtMoney(r.anual)}</td>
                    <td className="num tnum">{fmtMoney(r.plan10)}</td>
                    <td className="num tnum">{fmtMoney(r.plan12)}</td>
                    <td className="num tnum">{fmtMoney(cobPlanAnualPago(r))}</td>
                    <td className="num tnum">{fmtMoney(r.extras)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selector de nivel */}
      <div className="card pad mt-16" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginRight: 2 }}>Nivel</span>
        <div className="seg">
          {COB_TARIFAS.map(r => <button key={r.nivel} className={nivel === r.nivel ? 'active' : ''} onClick={() => setNivel(r.nivel)}>{r.nivel}</button>)}
        </div>
        <span className="grow" />
        <span className="faint" style={{ fontSize: 12.5 }}>Inscripción <b className="tnum" style={{ color: 'var(--text)' }}>{fmtMoney(t.inscripcion)}</b> · Cuota anual <b className="tnum" style={{ color: 'var(--text)' }}>{fmtMoney(t.extras)}</b></span>
      </div>

      {/* 3 planes */}
      <div className="grid mt-16" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {planCards.map(p => {
          const active = plan === p.id;
          const tn = window.TONE[p.tone];
          return (
            <button key={p.id} className="card pad" onClick={() => setPlan(p.id)} style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'), boxShadow: active ? '0 0 0 1px var(--accent)' : 'none', background: 'var(--surface)' }}>
              <div className="row between center">
                <span className="row center gap-8" style={{ fontWeight: 600, fontSize: 14 }}><span className="insight-ico" style={{ background: tn.bg, color: tn.c, width: 26, height: 26 }}><Icon name={p.id === 'anual' ? 'wallet' : 'calendar'} size={14} /></span>{p.title}</span>
                {active && <Badge tone="blue" dot>Activo</Badge>}
              </div>
              <div className="row center gap-8" style={{ alignItems: 'baseline' }}>
                <span className="font-display tnum" style={{ fontSize: 24, fontWeight: 700 }}>{p.head}</span>
                <span className="faint" style={{ fontSize: 12 }}>{p.unit}</span>
              </div>
              <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{p.sub}</div>
              <div className="faint" style={{ fontSize: 12, marginTop: 'auto', paddingTop: 6, borderTop: '1px solid var(--border)' }}>{p.foot}</div>
            </button>
          );
        })}
      </div>

      {/* Calendario del ciclo */}
      <div className="card mt-16">
        <CardHead icon="calendar" title="Calendario del ciclo" sub={t.nivel + ' · ' + cobPlanLabel(plan)}
          right={<div className="seg">{[['10', 'Plan 10'], ['12', 'Plan 12'], ['anual', 'Anual']].map(([v, l]) => <button key={v} className={plan === v ? 'active' : ''} onClick={() => setPlan(v)}>{l}</button>)}</div>} />
        <div className="card pad" style={{ borderTop: 'none' }}>
          <div className="row" style={{ gap: 8, alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 120px', minWidth: 120, border: '1px dashed var(--border)', borderRadius: 10, padding: '10px 12px', background: 'var(--accent-soft)' }}>
              <div className="faint" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Inicio de ciclo</div>
              <div className="row between" style={{ fontSize: 12.5, marginTop: 6 }}><span>Inscripción</span><span className="tnum" style={{ fontWeight: 600 }}>{fmtMoney(t.inscripcion)}</span></div>
              <div className="row between" style={{ fontSize: 12.5, marginTop: 3 }}><span>Cuota anual</span><span className="tnum" style={{ fontWeight: 600 }}>{fmtMoney(t.extras)}</span></div>
            </div>
            {sch.map(c => (
              <div key={c.n} style={{ flex: '1 1 70px', minWidth: 70, textAlign: 'center', border: '1px solid ' + (c.doble ? 'color-mix(in oklch, var(--amber) 45%, var(--border))' : 'var(--border)'), borderRadius: 10, padding: '10px 6px', background: c.doble ? 'var(--amber-soft)' : (c.amount ? 'var(--surface)' : 'transparent'), opacity: c.amount ? 1 : 0.5 }}>
                <div className="faint" style={{ fontSize: 10.5, fontWeight: 600 }}>{String(c.n).padStart(2, '0')} · {c.mes}</div>
                <div className="tnum" style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{c.amount ? fmtMoney(c.amount) : '—'}</div>
                {c.doble && <div style={{ marginTop: 4 }}><Badge tone="amber">doble</Badge></div>}
                {c.unico && <div style={{ marginTop: 4 }}><Badge tone="green">único</Badge></div>}
              </div>
            ))}
          </div>
          <div className="row between center mt-16" style={{ paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
            <span className="faint" style={{ fontSize: 12.5 }}>{plan === '12' ? '12 colegiaturas en 10 meses · meses 04 (Dic) y 07 (Mar) con cargo doble' : plan === '10' ? '10 mensualidades iguales' : '1 pago con 10% de descuento al inicio del ciclo'}</span>
            <span style={{ fontSize: 13 }}>Colegiatura del ciclo <b className="tnum">{fmtMoney(totalColeg)}</b></span>
          </div>
        </div>
      </div>

      {/* Comparador */}
      <div className="card mt-16">
        <CardHead icon="bars" title="Comparador por plan" sub={'Costo total del ciclo · ' + t.nivel} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr>
              <th>Plan</th><th className="num">Colegiaturas</th><th className="num">Inscripción</th><th className="num">Cuota anual</th><th className="num">Total del ciclo</th><th></th>
            </tr></thead>
            <tbody>
              {[['10', 'Plan 10', '10 pagos'], ['12', 'Plan 12', '10 meses · 12 colegiaturas'], ['anual', 'Anual', '1 pago']].map(([id, label, note]) => {
                const isAnual = id === 'anual';
                return (
                  <tr key={id} style={{ background: isAnual ? 'var(--green-soft)' : undefined }}>
                    <td><div><div style={{ fontWeight: 600 }}>{label}</div><div className="faint" style={{ fontSize: 11.5 }}>{note}</div></div></td>
                    <td className="num tnum">{fmtMoney(cobPlanTotalColeg(t, id))}</td>
                    <td className="num tnum">{fmtMoney(t.inscripcion)}</td>
                    <td className="num tnum">{fmtMoney(t.extras)}</td>
                    <td className="num tnum" style={{ fontWeight: 700 }}>{fmtMoney(cobTotalAnio(t, id))}</td>
                    <td>{isAnual ? <Badge tone="green" dot>Ahorras {fmtMoney(cobPlanAhorro(t))}</Badge> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} width={620} title="Editar tarifas por ciclo escolar"
        footer={<><button className="btn" onClick={() => setEdit(null)}>Cancelar</button><button className="btn primary" onClick={saveEdit}><Icon name="check" size={15} className="btn-ico" />Guardar tarifas</button></>}>
        <Field label="Ciclo escolar">
          <SelectInput value={editCycle} onChange={ev => changeEditCycle(ev.target.value)}
            options={cobCycleOptions().map(c => ({ value: c, label: c + (c === cobActiveCycle() ? ' · vigente' : '') }))} />
        </Field>
        <p className="faint" style={{ fontSize: 12.5, margin: '8px 0 14px', lineHeight: 1.5 }}>Las cuotas se guardan para el ciclo seleccionado. Plan 10 y Plan 12 se calculan automáticamente (anual ÷ 10 y ÷ 12). Editar un ciclo futuro no altera el vigente.</p>
        <div className="col gap-16">
          {(edit || []).map((e, i) => (
            <div key={e.nivel}>
              <div className="row center gap-8" style={{ marginBottom: 8, fontWeight: 600, fontSize: 13.5 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: (window.TONE[cobNivel(e.nivel).tone] || window.TONE.blue).c }} />{e.nivel}
              </div>
              <div className="field-row" style={{ gap: 12 }}>
                <Field label="Inscripción"><NumberInput value={e.inscripcion} onChange={ev => setField(i, 'inscripcion', ev.target.value)} /></Field>
                <Field label="Colegiatura anual"><NumberInput value={e.anual} onChange={ev => setField(i, 'anual', ev.target.value)} /></Field>
                <Field label="Cuota anual (extras)"><NumberInput value={e.extras} onChange={ev => setField(i, 'extras', ev.target.value)} /></Field>
              </div>
              <div className="faint font-mono" style={{ fontSize: 11, marginTop: 4 }}>Plan 10 ≈ {fmtMoney(Math.round((Number(e.anual) || 0) / 10))}/mes · Plan 12 ≈ {fmtMoney(Math.round((Number(e.anual) || 0) / 12))}/mes</div>
            </div>
          ))}
        </div>
      </Modal>
    </React.Fragment>
  );
}

window.PlanesTarifas = PlanesTarifas;
