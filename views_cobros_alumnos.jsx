/* views_cobros_alumnos.jsx — Cobros por alumno con datos reales únicamente
   · Solo alumnos reales de DB.students.
   · Plan y beca vienen del expediente del alumno o de overrides manuales.
   · Pagado = únicamente pagos reales registrados en DB.cobros.
   · No genera avances, pagos ni alumnos determinísticos. */

const CTA_KEY = 'piaget_cuentas_v2_real';
let COB_CUENTAS = (() => { try { return JSON.parse(localStorage.getItem(CTA_KEY) || '{}') || {}; } catch (e) { return {}; } })();
function ctaSaveAll() { try { localStorage.setItem(CTA_KEY, JSON.stringify(COB_CUENTAS)); } catch (e) { } try { if (window.Store && Store.saveState) Store.saveState(); } catch (_) {} }
function ctaGet(sid) { return COB_CUENTAS[sid] || null; }
function ctaSet(sid, patch) { COB_CUENTAS[sid] = { ...(COB_CUENTAS[sid] || {}), ...patch }; ctaSaveAll(); }
function ctaClean(v) { return String(v || '').trim().replace(/\s+/g, ' '); }
function ctaIsSeedClass(c) { return /^cls-\d+$/i.test(String((c && c._id) || '')); }
function ctaDeletedClassIds() { try { return new Set((DB.settings && DB.settings.deletedClassIds) || []); } catch (_) { return new Set(); } }
function ctaClases() {
  const deleted = ctaDeletedClassIds();
  return ((window.DB && Array.isArray(DB.clases)) ? DB.clases : [])
    .filter(c => c && !ctaIsSeedClass(c) && !deleted.has(c._id) && ctaClean(c.g));
}
function ctaInferNivel(grade) { const g = String(grade || ''); return /sec/i.test(g) ? 'Secundaria' : /^\s*k/i.test(g) ? 'Preescolar' : 'Primaria'; }
function ctaStudents() {
  return ((window.DB && Array.isArray(DB.students)) ? DB.students : [])
    .filter(s => s && s._id && ctaClean(s.name || s.nombre))
    .map(s => ({
      sid: s._id,
      name: ctaClean(s.name || s.nombre),
      group: ctaClean(s.grade || s.group || s.grupo || '—'),
      nivel: s.nivel || ctaInferNivel(s.grade || s.group || s.grupo),
      plan: s.plan || '10',
      beca: Number(s.beca) || 0,
      hasBeca: !!s.hasBeca || Number(s.beca) > 0,
      factura: !!s.factura || !!(s.fiscal && s.fiscal.factura),
      fiscal: s.fiscal || {},
      manual: true,
      real: true
    }));
}
function ctaPaidBySid() { const m = {}; ((window.DB && DB.cobros) || []).forEach(c => { if (c && c.sid) m[c.sid] = (m[c.sid] || 0) + (Number(c.amount) || 0); }); return m; }
function ctaResolve(stu, paidBySid) {
  const ov = ctaGet(stu.sid) || {};
  const plan = ov.plan || stu.plan || '10';
  const beca = ov.beca != null ? Number(ov.beca) : (stu.hasBeca ? Number(stu.beca || 0) : 0);
  const t = cobNivel(stu.nivel);
  const colegBase = cobPlanTotalColeg(t, plan);
  const colegNeto = Math.round(colegBase * (1 - beca / 100));
  const descBeca = colegBase - colegNeto;
  const total = t.inscripcion + colegNeto + t.extras;
  const registered = (paidBySid && paidBySid[stu.sid]) || 0;
  const pagado = Math.min(total, registered);
  const saldo = Math.max(0, total - pagado);
  const estatus = saldo <= 0 ? 'liquidado' : (pagado > 0 ? 'parcial' : 'sin_pago');
  return { ...stu, plan, beca, t, colegBase, colegNeto, descBeca, total, pagado, saldo, estatus };
}
function ctaSchedule(stu) { return cobSchedule(stu.t, stu.plan).map(c => ({ ...c, amount: Math.round(c.amount * (1 - stu.beca / 100)) })); }
function ctaEstatusBadge(s) { return s === 'liquidado' ? <Badge tone="green" dot>Liquidado</Badge> : s === 'parcial' ? <Badge tone="amber" dot>Parcial</Badge> : <Badge tone="gray" dot>Sin pago</Badge>; }
function ctaPlanBadge(plan) { return <Badge tone={plan === 'anual' ? 'green' : plan === '12' ? 'amber' : 'blue'}>{cobPlanLabel(plan)}</Badge>; }
function ctaNextRecibo() { const max = (DB.cobros || []).reduce((m, c) => Math.max(m, Number((c.recibo || '').replace(/\D/g, '')) || 0), 4900); return 'REC-0' + (max + 1); }

function RegistrarPago({ student, paidBySid, onClose, onDone }) {
  const preset = !!student;
  const [nivel, setNivel] = React.useState(student ? student.nivel : 'Primaria');
  const [group, setGroup] = React.useState(student ? student.group : '');
  const [sid, setSid] = React.useState(student ? student.sid : '');
  const [tipo, setTipo] = React.useState(student && student.plan === 'anual' ? 'anual' : 'colegiatura');
  const [mes, setMes] = React.useState(2);
  const [amount, setAmount] = React.useState('');
  const [channel, setChannel] = React.useState('Transferencia');
  const [ref, setRef] = React.useState('');
  const [touchedAmt, setTouchedAmt] = React.useState(false);
  const paidMap = React.useMemo(() => paidBySid || ctaPaidBySid(), [paidBySid]);
  const groupsOfNivel = React.useMemo(() => {
    const fromStudents = ctaStudents().filter(s => (s.nivel || ctaInferNivel(s.group)) === nivel).map(s => s.group);
    return [...new Set(fromStudents.filter(Boolean))];
  }, [nivel]);
  const studentsOfGroup = React.useMemo(() => ctaStudents().filter(s => s.group === group).map(s => ctaResolve(s, paidMap)), [group, paidMap]);
  const stu = student || studentsOfGroup.find(s => s.sid === sid) || null;
  const computed = React.useMemo(() => {
    if (!stu) return { concept: '', amount: 0 };
    const t = stu.t;
    if (tipo === 'inscripcion') return { concept: 'Inscripción · ' + stu.name + ' (' + stu.group + ')', amount: t.inscripcion };
    if (tipo === 'extras') return { concept: 'Cuota única anual · ' + stu.name + ' (' + stu.group + ')', amount: t.extras };
    if (tipo === 'anual') return { concept: 'Colegiatura anual · ' + stu.name + ' (' + stu.group + (stu.beca ? ' · beca ' + stu.beca + '%' : '') + ')', amount: Math.round(cobPlanAnualPago(t) * (1 - stu.beca / 100)) };
    const sch = ctaSchedule(stu); const cell = sch[mes] || sch[0];
    return { concept: 'Colegiatura ' + cell.mes + (cell.doble ? ' (doble)' : '') + ' · ' + stu.name + ' (' + stu.group + (stu.beca ? ' · beca ' + stu.beca + '%' : '') + ')', amount: cell.amount };
  }, [stu, tipo, mes]);
  React.useEffect(() => { if (!touchedAmt) setAmount(String(computed.amount || '')); }, [computed.amount]);
  function save() {
    if (!stu) { toast('Selecciona un alumno', 'warn'); return; }
    if (!Number(amount)) { toast('Captura un monto válido', 'warn'); return; }
    Store.add('cobros', {
      recibo: ctaNextRecibo(), sid: stu.sid, student: stu.name, group: stu.group, nivel: stu.nivel,
      family: 'Familia ' + stu.name.split(' ').slice(-1)[0], concept: computed.concept, amount: Number(amount),
      channel, ref, folio: '', date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), status: 'pagado', real: true
    });
    try { if (Store.saveState) Store.saveState(); } catch (_) {}
    Store.log('Tesorería', 'registró pago real ' + fmtMoney(Number(amount)) + ' · ' + stu.name, 'wallet');
    toast('Pago registrado · ' + stu.name + ' ✓');
    onDone && onDone(); onClose();
  }
  return <Modal open width={600} onClose={onClose} title={student ? 'Registrar pago · ' + student.name : 'Registrar pago'} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Registrar pago real</button></>}>
    {!preset && <div className="field-row" style={{ marginBottom: 2 }}><Field label="Nivel"><SelectInput value={nivel} onChange={e => { setNivel(e.target.value); setGroup(''); setSid(''); }} options={cobNiveles()} /></Field><Field label="Grupo"><SelectInput value={group} onChange={e => { setGroup(e.target.value); setSid(''); }} options={[{ value: '', label: 'Selecciona…' }, ...groupsOfNivel.map(g => ({ value: g, label: g }))]} /></Field></div>}
    {!preset && <Field label="Alumno"><SelectInput value={sid} onChange={e => setSid(e.target.value)} options={[{ value: '', label: group ? 'Selecciona alumno…' : 'Elige un grupo primero' }, ...studentsOfGroup.map(s => ({ value: s.sid, label: s.name + (s.beca ? ' · beca ' + s.beca + '%' : '') }))]} /></Field>}
    {stu && <div className="row gap-8" style={{ flexWrap: 'wrap', margin: '4px 0 12px' }}>{ctaPlanBadge(stu.plan)}{stu.beca > 0 && <Badge tone="violet">Beca {stu.beca}%</Badge>}<Badge tone="gray">Saldo {fmtMoney(stu.saldo)}</Badge></div>}
    <div className="field-row"><Field label="Concepto"><SelectInput value={tipo} onChange={e => { setTipo(e.target.value); setTouchedAmt(false); }} options={[{ value: 'colegiatura', label: 'Colegiatura / abono a cuenta' }, { value: 'inscripcion', label: 'Inscripción / abono' }, { value: 'extras', label: 'Cuota única anual / abono' }, { value: 'anual', label: 'Colegiatura anual' }]} /></Field>{tipo === 'colegiatura' ? <Field label="Mes"><SelectInput value={String(mes)} onChange={e => { setMes(Number(e.target.value)); setTouchedAmt(false); }} options={window.COB_CICLO_MESES.map((m, i) => ({ value: String(i), label: String(i + 1).padStart(2, '0') + ' · ' + m }))} /></Field> : <Field label="Monto (MXN)"><NumberInput value={amount} onChange={e => { setTouchedAmt(true); setAmount(e.target.value); }} min="0" /></Field>}</div>
    {tipo === 'colegiatura' && <Field label="Monto abonado (MXN)"><NumberInput value={amount} onChange={e => { setTouchedAmt(true); setAmount(e.target.value); }} min="0" /></Field>}
    {stu && <div className="faint" style={{ fontSize: 12, marginBottom: 10 }}>{computed.concept}</div>}
    <div className="field-row"><Field label="Canal de pago"><SelectInput value={channel} onChange={e => setChannel(e.target.value)} options={['Transferencia', 'Tarjeta', 'Efectivo', 'Domiciliación', 'Abono a cuenta']} /></Field><Field label="Referencia"><TextInput value={ref} onChange={e => setRef(e.target.value)} placeholder="SPEI / folio / caja" /></Field></div>
  </Modal>;
}

function StudentAccount({ stu, onClose, onChange, onPay }) {
  const t = stu.t;
  const sch = ctaSchedule(stu);
  const pct = stu.total ? Math.round(stu.pagado / stu.total * 100) : 0;
  const pagos = (DB.cobros || []).filter(c => c.sid === stu.sid).slice().sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
  function setPlan(p) { ctaSet(stu.sid, { plan: p }); const real = Store.get && Store.get('students', stu.sid); if (real) Store.update('students', stu.sid, { plan: p }); onChange(); }
  function setBeca(v) { const n = Math.max(0, Math.min(100, Math.round(Number(v) || 0))); ctaSet(stu.sid, { beca: n }); const real = Store.get && Store.get('students', stu.sid); if (real) Store.update('students', stu.sid, { beca: n, hasBeca: n > 0 }); onChange(); }
  const filas = [
    { k: 'Inscripción', v: t.inscripcion, note: 'sin beca' },
    { k: 'Colegiatura del ciclo · ' + cobPlanLabel(stu.plan), v: stu.colegNeto, note: stu.beca > 0 ? ('base ' + fmtMoney(stu.colegBase) + ' · beca ' + stu.beca + '%') : (stu.plan === 'anual' ? '1 pago (−10%)' : (stu.plan === '12' ? '12 colegiaturas' : '10 mensualidades')) },
    { k: 'Cuota única anual', v: t.extras, note: 'sin beca' },
  ];
  return <Modal open width={680} onClose={onClose} title={stu.name} footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={() => onPay(stu)}><Icon name="wallet" size={15} className="btn-ico" />Registrar pago</button></>}>
    <div className="row gap-8" style={{ flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}><Badge tone="gray"><Icon name="cap" size={12} />{stu.group} · {stu.nivel}</Badge>{ctaEstatusBadge(stu.estatus)}{stu.beca > 0 && <Badge tone="violet">Beca {stu.beca}%</Badge>}</div>
    <div className="card pad" style={{ marginBottom: 14 }}><div className="field-row"><Field label="Plan de pago"><SelectInput value={stu.plan} onChange={e => setPlan(e.target.value)} options={[{ value: '10', label: 'Plan 10 (10 mensualidades)' }, { value: '12', label: 'Plan 12 (12 colegiaturas)' }, { value: 'anual', label: 'Anual (1 pago −10%)' }]} /></Field><Field label="Beca % (solo colegiatura)"><NumberInput value={stu.beca} min="0" max="100" onChange={e => setBeca(e.target.value)} /></Field></div></div>
    <div className="card" style={{ marginBottom: 14 }}><CardHead icon="receipt" title="Cargos del ciclo" sub={COB_CICLO_LABEL} /><div>{filas.map((f, i) => <div key={i} className="lrow" style={{ padding: '12px 16px' }}><div className="grow"><div style={{ fontWeight: 600, fontSize: 13.5 }}>{f.k}</div><div className="faint" style={{ fontSize: 12 }}>{f.note}</div></div><span className="tnum" style={{ fontWeight: 600 }}>{fmtMoney(f.v)}</span></div>)}<div className="lrow" style={{ padding: '12px 16px', background: 'var(--accent-soft)' }}><div className="grow" style={{ fontWeight: 700 }}>Total del ciclo</div><span className="tnum" style={{ fontWeight: 700 }}>{fmtMoney(stu.total)}</span></div></div></div>
    <div className="card pad" style={{ marginBottom: 14 }}><div className="row between center" style={{ marginBottom: 8, fontSize: 13 }}><span style={{ fontWeight: 600 }}>Pagos reales registrados</span><span className="tnum faint">{fmtMoney(stu.pagado)} de {fmtMoney(stu.total)} · {pct}%</span></div><Bar value={pct} color={stu.saldo <= 0 ? 'var(--green)' : pct > 0 ? 'var(--accent)' : 'var(--gray)'} height={9} /><div className="row between center mt-16" style={{ marginTop: 10 }}><span className="faint" style={{ fontSize: 12.5 }}>Saldo por cobrar</span><span className="tnum" style={{ fontWeight: 700, color: stu.saldo > 0 ? 'var(--red)' : 'var(--green)' }}>{fmtMoney(stu.saldo)}</span></div></div>
    <div className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Calendario de colegiaturas · {cobPlanLabel(stu.plan)}</div><div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>{sch.map(c => <div key={c.n} style={{ flex: '1 1 64px', minWidth: 64, textAlign: 'center', border: '1px solid ' + (c.doble ? 'color-mix(in oklch, var(--amber) 45%, var(--border))' : 'var(--border)'), borderRadius: 9, padding: '8px 4px', background: c.doble ? 'var(--amber-soft)' : (c.amount ? 'var(--surface)' : 'transparent'), opacity: c.amount ? 1 : 0.45 }}><div className="faint" style={{ fontSize: 10 }}>{c.mes}</div><div className="tnum" style={{ fontWeight: 600, fontSize: 12, marginTop: 2 }}>{c.amount ? fmtMoney(c.amount) : '—'}</div></div>)}</div>
    <div className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Pagos reales registrados · {pagos.length}</div>{pagos.length === 0 ? <div className="faint" style={{ fontSize: 13, padding: '4px 2px' }}>Aún no hay pagos ligados a este alumno.</div> : <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>{pagos.map((c, i) => <div key={c._id || i} className="row between center" style={{ padding: '9px 12px', borderTop: i ? '1px solid var(--border)' : 'none' }}><div><div style={{ fontSize: 13 }}>{c.concept}</div><div className="faint font-mono" style={{ fontSize: 11 }}>{c.recibo} · {c.channel}</div></div><span className="tnum" style={{ fontWeight: 600 }}>{fmtMoney(c.amount)}</span></div>)}</div>}
  </Modal>;
}

function EstadoCuenta({ go }) {
  const store = useStore();
  const [tick, setTick] = React.useState(0);
  const [nivel, setNivel] = React.useState('Todos');
  const [grupo, setGrupo] = React.useState('Todos');
  const [estatus, setEstatus] = React.useState('Todos');
  const [soloBeca, setSoloBeca] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [openSid, setOpenSid] = React.useState(null);
  const [payStu, setPayStu] = React.useState(null);
  const refresh = () => setTick(t => t + 1);
  const paidBySid = React.useMemo(() => ctaPaidBySid(), [DB.cobros, tick]);
  const all = React.useMemo(() => ctaStudents().map(s => ctaResolve(s, paidBySid)), [paidBySid, tick]);
  const kpi = React.useMemo(() => { const r = { facturado: 0, cobrado: 0, saldo: 0, becados: 0, becas: 0, adeudo: 0 }; all.forEach(s => { r.facturado += s.total; r.cobrado += s.pagado; r.saldo += s.saldo; if (s.beca > 0) { r.becados++; r.becas += s.descBeca; } if (s.saldo > 0) r.adeudo++; }); return r; }, [all]);
  const groups = React.useMemo(() => {
    const base = [...new Set(all.map(s => s.group).filter(Boolean))];
    return base.map(g => { const first = all.find(s => s.group === g) || {}; const studs = all.filter(s => s.group === g); const agg = studs.reduce((a, s) => { a.total += s.total; a.pagado += s.pagado; a.saldo += s.saldo; if (s.beca > 0) a.becados++; return a; }, { total: 0, pagado: 0, saldo: 0, becados: 0 }); return { group: g, nivel: first.nivel || 'Primaria', tone: (window.nivelCfg ? window.nivelCfg(first.nivel || 'Primaria').tone : 'blue'), n: studs.length, ...agg }; });
  }, [all]);
  const showTable = grupo !== 'Todos' || search.trim() !== '' || estatus !== 'Todos' || soloBeca;
  const filtered = all.filter(s => (nivel === 'Todos' || s.nivel === nivel) && (grupo === 'Todos' || s.group === grupo) && (estatus === 'Todos' || s.estatus === estatus) && (!soloBeca || s.beca > 0) && (!search.trim() || s.name.toLowerCase().includes(search.trim().toLowerCase()))).sort((a, b) => b.saldo - a.saldo);
  const capped = filtered.slice(0, 150);
  const openStu = openSid ? all.find(s => s.sid === openSid) : null;
  const gruposNivel = [...new Set(all.filter(s => nivel === 'Todos' || s.nivel === nivel).map(s => s.group).filter(Boolean))];
  const FilterSel = ({ value, onChange, opts }) => <select className="inp" value={value} onChange={onChange} style={{ height: 34, padding: '0 28px 0 10px', fontSize: 12.5, width: 'auto' }}>{opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
  const kpis = [
    { label: 'Cargos del ciclo', value: fmtMoney(kpi.facturado), icon: 'receipt', tone: 'blue' },
    { label: 'Pagos reales', value: fmtMoney(kpi.cobrado), icon: 'wallet', tone: 'green' },
    { label: 'Saldo por cobrar', value: fmtMoney(kpi.saldo), icon: 'clock', tone: 'amber' },
    { label: 'Alumnos con saldo', value: String(kpi.adeudo), icon: 'alert', tone: 'red' },
    { label: 'Becados · ' + fmtMoney(kpi.becas), value: String(kpi.becados), icon: 'star', tone: 'violet' },
  ];
  return <React.Fragment>
    <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>{kpis.map((k, i) => { const tn = window.TONE[k.tone]; return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: tn.bg, color: tn.c }}><Icon name={k.icon} size={18} fill={k.icon === 'star' ? 'currentColor' : 'none'} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum" style={{ fontSize: 22 }}>{k.value}</div></div>; })}</div>
    <div className="card pad mt-16" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><span className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Filtrar</span><FilterSel value={nivel} onChange={e => { setNivel(e.target.value); setGrupo('Todos'); }} opts={[{ value: 'Todos', label: 'Todos los niveles' }, ...cobNiveles().map(n => ({ value: n, label: n }))]} /><FilterSel value={grupo} onChange={e => setGrupo(e.target.value)} opts={[{ value: 'Todos', label: 'Todos los grupos' }, ...gruposNivel.map(g => ({ value: g, label: g }))]} /><FilterSel value={estatus} onChange={e => setEstatus(e.target.value)} opts={[{ value: 'Todos', label: 'Todo estatus' }, { value: 'liquidado', label: 'Liquidado' }, { value: 'parcial', label: 'Parcial' }, { value: 'sin_pago', label: 'Sin pago' }]} /><button className={'btn sm' + (soloBeca ? ' primary' : '')} onClick={() => setSoloBeca(v => !v)}><Icon name="star" size={13} className="btn-ico" fill={soloBeca ? 'currentColor' : 'none'} />Becados</button><div className="inp" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 10px', width: 'auto' }}><Icon name="search" size={14} className="faint" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno…" style={{ border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: 12.5, width: 150 }} /></div><span className="grow" /><span className="faint tnum" style={{ fontSize: 12.5 }}>{showTable ? filtered.length + ' alumnos' : groups.length + ' grupos'}</span></div>
    {!showTable ? <div className="card mt-16"><CardHead icon="cap" title="Cobranza por grupo" sub="Selecciona un grupo para ver a los alumnos" /><div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Grupo</th><th>Nivel</th><th className="num">Alumnos</th><th className="num">Becados</th><th className="num">Cargos</th><th className="num">Pagos reales</th><th className="num">Saldo</th><th style={{ width: 120 }}>Avance</th></tr></thead><tbody>{groups.map(g => { const tn = window.TONE[g.tone] || window.TONE.blue; const pct = g.total ? Math.round(g.pagado / g.total * 100) : 0; return <tr key={g.group} style={{ cursor: 'pointer' }} onClick={() => setGrupo(g.group)}><td><span className="row center gap-8" style={{ fontWeight: 600 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: tn.c, flexShrink: 0 }} />{g.group}</span></td><td className="muted">{g.nivel}</td><td className="num tnum">{g.n}</td><td className="num tnum">{g.becados || '—'}</td><td className="num tnum">{fmtMoney(g.total)}</td><td className="num tnum">{fmtMoney(g.pagado)}</td><td className="num tnum" style={{ fontWeight: 600, color: g.saldo > 0 ? 'var(--red)' : 'var(--green)' }}>{fmtMoney(g.saldo)}</td><td><div className="row center gap-8"><Bar value={pct} color={pct >= 90 ? 'var(--green)' : pct > 0 ? 'var(--accent)' : 'var(--gray)'} height={7} /><span className="faint tnum" style={{ fontSize: 11.5 }}>{pct}%</span></div></td></tr>; })}</tbody></table></div></div> : <div className="card mt-16"><CardHead icon="users" title="Estado de cuenta por alumno" sub={filtered.length + (filtered.length === 1 ? ' alumno' : ' alumnos') + (filtered.length > 150 ? ' · mostrando 150' : '')} right={grupo !== 'Todos' && <button className="btn sm" onClick={() => setGrupo('Todos')}>← Todos los grupos</button>} />{capped.length === 0 ? <div className="col center gap-8 faint" style={{ padding: 40, textAlign: 'center' }}><div style={{ fontWeight: 600, color: 'var(--text)' }}>Sin resultados</div><div style={{ fontSize: 13 }}>Ningún alumno coincide con los filtros.</div></div> : <div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Alumno</th><th>Grupo</th><th>Plan</th><th className="num">Beca</th><th className="num">Cargos ciclo</th><th className="num">Pagado real</th><th className="num">Saldo</th><th>Estatus</th><th></th></tr></thead><tbody>{capped.map(s => <tr key={s.sid} style={{ cursor: 'pointer' }} onClick={() => setOpenSid(s.sid)}><td><div className="person"><Avatar name={s.name} size={28} /><div className="pname">{s.name}</div></div></td><td className="muted">{s.group}</td><td>{ctaPlanBadge(s.plan)}</td><td className="num tnum">{s.beca > 0 ? s.beca + '%' : '—'}</td><td className="num tnum">{fmtMoney(s.total)}</td><td className="num tnum">{fmtMoney(s.pagado)}</td><td className="num tnum" style={{ fontWeight: 600, color: s.saldo > 0 ? 'var(--red)' : 'var(--green)' }}>{fmtMoney(s.saldo)}</td><td>{ctaEstatusBadge(s.estatus)}</td><td onClick={e => e.stopPropagation()}><RowMenu items={[{ icon: 'eye', label: 'Estado de cuenta', onClick: () => setOpenSid(s.sid) }, { icon: 'wallet', label: 'Registrar pago', onClick: () => setPayStu(s) }]} /></td></tr>)}</tbody></table></div>}</div>}
    {openStu && <StudentAccount stu={openStu} onClose={() => setOpenSid(null)} onChange={refresh} onPay={(s) => { setOpenSid(null); setPayStu(s); }} />}
    {payStu && <RegistrarPago student={payStu} paidBySid={paidBySid} onClose={() => setPayStu(null)} onDone={refresh} />}
  </React.Fragment>;
}
window.EstadoCuenta = EstadoCuenta;
window.RegistrarPago = RegistrarPago;
window.StudentAccount = StudentAccount;
let _adeudosCache = null, _adeudosKey = '';
function ctaAdeudos() { const cobros = (window.DB && DB.cobros) || []; const students = (window.DB && DB.students) || []; const key = cobros.length + '|' + students.length + '|' + JSON.stringify(COB_CUENTAS); if (_adeudosKey === key && _adeudosCache) return _adeudosCache; const paid = ctaPaidBySid(); _adeudosCache = ctaStudents().map(s => ctaResolve(s, paid)).filter(s => s.saldo > 0).sort((a, b) => b.saldo - a.saldo); _adeudosKey = key; return _adeudosCache; }
Object.assign(window, { ctaStudents, ctaResolve, ctaNextRecibo, ctaAdeudos, ctaPaidBySid, ctaEstatusBadge, ctaPlanBadge, ctaSet, ctaGet });
