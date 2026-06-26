/* views_admin.jsx — Administración: Pendientes · Matrículas · Ingresos · Configuración */

/* ============ PENDIENTES (cobranza por ALUMNO) ============
   Deriva del MISMO padrón que Cobros › Estado de cuenta (ctaAdeudos):
   un alumno aparece aquí cuando su saldo del ciclo > 0. */
function Pendientes({ go }) {
  const store = useStore();
  const [tick, setTick] = React.useState(0);
  const [filter, setFilter] = React.useState('Todos');
  const [nivel, setNivel] = React.useState('Todos');
  const [search, setSearch] = React.useState('');
  const [openSid, setOpenSid] = React.useState(null);
  const [payStu, setPayStu] = React.useState(null);
  const refresh = () => setTick(t => t + 1);

  const paidBySid = React.useMemo(() => window.ctaPaidBySid(), [store, tick]);
  const adeudos = React.useMemo(() => window.ctaAdeudos(), [store, tick]);

  const atrasados = adeudos.filter(s => s.estatus === 'atrasado');
  const parciales = adeudos.filter(s => s.estatus === 'parcial');
  const saldoTotal = adeudos.reduce((a, s) => a + s.saldo, 0);
  const saldoAtraso = atrasados.reduce((a, s) => a + s.saldo, 0);

  const niveles = React.useMemo(() => ['Todos', ...Array.from(new Set(adeudos.map(s => s.nivel)))], [adeudos]);
  const base = filter === 'Todos' ? adeudos : (filter === 'Atrasados' ? atrasados : parciales);
  const filtered = base.filter(s =>
    (nivel === 'Todos' || s.nivel === nivel) &&
    (!search.trim() || s.name.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const capped = filtered.slice(0, 150);

  function recordar(s) { toast('Recordatorio enviado a la familia de ' + s.name, 'info'); }
  function recordarTodos() { toast(filtered.length + ' recordatorios de cobranza enviados ✓'); }

  const openStu = openSid ? adeudos.find(s => s.sid === openSid) : null;
  const kpis = [
    { label: 'Alumnos con adeudo', value: String(adeudos.length), icon: 'clock', tone: 'amber' },
    { label: 'Saldo por cobrar', value: fmtMoney(saldoTotal), icon: 'wallet', tone: 'blue' },
    { label: 'Atrasados', value: String(atrasados.length), icon: 'alert', tone: 'red' },
    { label: 'Saldo en atraso', value: fmtMoney(saldoAtraso), icon: 'trendUp', tone: 'red' },
  ];

  return (
    <div className="content-inner">
      <PageHead eyebrow="Tesorería" title="Pendientes" desc={adeudos.length + ' alumnos con adeudo · ' + fmtMoney(saldoTotal) + ' por cobrar'}>
        <button className="btn" onClick={() => go('cobros')}><Icon name="wallet" size={15} className="btn-ico" />Ir a Cobros</button>
        <button className="btn primary" onClick={recordarTodos}><Icon name="megaphone" size={15} className="btn-ico" />Recordatorio masivo</button>
      </PageHead>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {kpis.map((k, i) => {
          const t = window.TONE[k.tone];
          return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum" style={{ fontSize: 26 }}>{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="card pad mt-16" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Filtrar</span>
        <select className="inp" value={nivel} onChange={e => setNivel(e.target.value)} style={{ height: 34, padding: '0 28px 0 10px', fontSize: 12.5, width: 'auto' }}>
          {niveles.map(n => <option key={n} value={n}>{n === 'Todos' ? 'Todos los niveles' : n}</option>)}
        </select>
        <div className="seg">{['Todos', 'Atrasados', 'Parciales'].map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div>
        <div className="inp" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 10px', width: 'auto' }}>
          <Icon name="search" size={14} className="faint" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno…" style={{ border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: 12.5, width: 150 }} />
        </div>
        <span className="grow" />
        <span className="faint tnum" style={{ fontSize: 12.5 }}>{filtered.length + (filtered.length === 1 ? ' alumno' : ' alumnos')}</span>
      </div>

      <div className="card mt-16">
        <CardHead icon="users" title="Alumnos con saldo" sub={'Ordenados por saldo' + (filtered.length > 150 ? ' · mostrando 150' : '')} />
        {capped.length === 0 ? (
          <div className="col center gap-8 faint" style={{ padding: 50, textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 999, background: 'var(--green-soft)', color: 'var(--green)', display: 'grid', placeItems: 'center' }}><Icon name="check" size={26} stroke={2.6} /></div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>¡Sin pendientes en este filtro!</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Alumno</th><th>Grupo</th><th>Plan</th><th className="num">Beca</th><th className="num">Total ciclo</th><th className="num">Pagado</th><th className="num">Saldo</th><th>Estatus</th><th>Acciones</th></tr></thead>
              <tbody>
                {capped.map((s) => (
                  <tr key={s.sid} style={{ cursor: 'pointer' }} onClick={() => setOpenSid(s.sid)}>
                    <td><div className="person"><Avatar name={s.name} size={30} /><div className="pname">{s.name}</div></div></td>
                    <td className="muted">{s.group}</td>
                    <td>{window.ctaPlanBadge(s.plan)}</td>
                    <td className="num tnum">{s.beca > 0 ? s.beca + '%' : '—'}</td>
                    <td className="num tnum">{fmtMoney(s.total)}</td>
                    <td className="num tnum">{fmtMoney(s.pagado)}</td>
                    <td className="num tnum" style={{ fontWeight: 600, color: 'var(--red)' }}>{fmtMoney(s.saldo)}</td>
                    <td>{window.ctaEstatusBadge(s.estatus)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="row gap-8">
                        <button className="btn sm" onClick={() => recordar(s)}><Icon name="megaphone" size={13} className="btn-ico" />Recordar</button>
                        <button className="btn sm primary" onClick={() => setPayStu(s)}><Icon name="wallet" size={13} className="btn-ico" />Registrar pago</button>
                      </div>
                    </td>
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
            <div className="insight-title">Cobranza inteligente</div>
            <div className="insight-text">Copilot puede priorizar por saldo y antigüedad, y redactar recordatorios con el tono adecuado para cada familia.</div>
          </div>
          <button className="btn primary nowrap" onClick={() => go('comunicados')}><Icon name="send" size={15} className="btn-ico" />Campaña con IA</button>
        </div>
      </div>

      {openStu && <StudentAccount stu={openStu} onClose={() => setOpenSid(null)} onChange={refresh} onPay={(s) => { setOpenSid(null); setPayStu(s); }} />}
      {payStu && <RegistrarPago student={payStu} paidBySid={paidBySid} onClose={() => setPayStu(null)} onDone={refresh} />}
    </div>
  );
}

/* ============ MATRÍCULAS ============ */
function matStatus(s) {
  if (s === 'inscrito') return <Badge tone="green" dot>Inscrito</Badge>;
  if (s === 'pago') return <Badge tone="amber" dot>Pago pendiente</Badge>;
  return <Badge tone="cyan" dot>Documentos</Badge>;
}
function Matriculas({ go }) {
  const store = useStore();
  const [modal, setModal] = React.useState(false);
  const [form, setForm] = React.useState({ student: '', grade: 'Kínder', type: 'Nuevo ingreso', tutor: '', status: 'documentos' });
  const totalCupo = DB.enrollment.reduce((a, e) => a + e.cupo, 0);
  const totalInsc = DB.enrollment.reduce((a, e) => a + e.inscritos, 0);
  const ocup = Math.round(totalInsc / totalCupo * 100);
  const nuevos = DB.enrollment.reduce((a, e) => a + e.nuevos, 0);

  function save() {
    if (!form.student.trim()) { toast('Escribe el nombre del estudiante', 'warn'); return; }
    const folio = 'MAT-2026-' + (119 + DB.matriculas.filter(m => m.folio.startsWith('MAT-2026-1')).length);
    Store.add('matriculas', { ...form, folio, date: 'hoy' });
    Store.log('Control Escolar', 'registró la matrícula de ' + form.student + ' (' + form.grade + ')', 'cap');
    toast('Matrícula creada: ' + folio + ' ✓');
    setForm({ student: '', grade: 'Kínder', type: 'Nuevo ingreso', tutor: '', status: 'documentos' });
    setModal(false);
  }

  return (
    <div className="content-inner">
      <PageHead eyebrow="Administración" title="Matrículas" desc={'Ciclo ' + (window.PIAGET_CYCLE ? PIAGET_CYCLE() : '2025–2026') + ' · ' + fmtNum(totalInsc) + ' inscritos · ' + ocup + '% de ocupación'}>
        <button className="btn"><Icon name="download" size={15} className="btn-ico" />Exportar</button>
        <button className="btn primary" onClick={() => setModal(true)}><Icon name="plus" size={15} className="btn-ico" />Nueva matrícula</button>
      </PageHead>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Matrículas 2026', value: fmtNum(totalInsc), icon: 'cap', tone: 'blue' },
          { label: 'Ocupación de cupo', value: ocup + '%', icon: 'users', tone: 'green' },
          { label: 'Nuevos ingresos', value: String(nuevos), icon: 'plus', tone: 'cyan' },
          { label: 'Lugares disponibles', value: String(totalCupo - totalInsc), icon: 'flag', tone: 'amber' },
        ].map((k, i) => {
          const t = window.TONE[k.tone];
          return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum">{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <CardHead icon="bars" title="Ocupación por grado" sub="Inscritos vs. cupo total" />
          <div className="card pad col gap-16" style={{ borderTop: 'none' }}>
            {DB.enrollment.map((e, i) => {
              const pct = Math.round(e.inscritos / e.cupo * 100);
              return (
                <div key={i}>
                  <div className="row between center" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{e.grade}</span>
                    <span className="faint tnum" style={{ fontSize: 12.5 }}>{e.inscritos}/{e.cupo} · <b style={{ color: pct >= 95 ? 'var(--green)' : 'var(--text)' }}>{pct}%</b></span>
                  </div>
                  <Bar value={pct} color={pct >= 95 ? 'var(--green)' : pct >= 85 ? 'var(--accent)' : 'var(--amber)'} height={8} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <CardHead icon="pie" title="Composición" sub="Nuevos ingresos vs. reinscripciones" />
          <div className="card pad row center gap-16" style={{ borderTop: 'none', gap: 28 }}>
            <Donut size={150} thickness={20} center={<div><div className="font-display" style={{ fontSize: 24, fontWeight: 600 }}>{fmtNum(totalInsc)}</div><div className="faint" style={{ fontSize: 10.5 }}>matrículas</div></div>}
              segments={[
                { color: 'var(--accent)', label: 'Reinscripciones', value: DB.enrollment.reduce((a, e) => a + e.reinscritos, 0) },
                { color: 'var(--cyan)', label: 'Nuevos', value: nuevos },
              ]} />
            <div className="grow col gap-16" style={{ minWidth: 0 }}>
              <div>
                <div className="row center gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)', flexShrink: 0 }} /><span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' }}>Reinscripciones</span></div>
                <div className="font-display tnum" style={{ fontSize: 22, fontWeight: 700, marginTop: 2, lineHeight: 1.1 }}>{fmtNum(DB.enrollment.reduce((a, e) => a + e.reinscritos, 0))}</div>
                <div className="faint" style={{ fontSize: 12 }}>72% de retención global</div>
              </div>
              <div>
                <div className="row center gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--cyan)', flexShrink: 0 }} /><span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' }}>Nuevos ingresos</span></div>
                <div className="font-display tnum" style={{ fontSize: 22, fontWeight: 700, marginTop: 2, lineHeight: 1.1 }}>{nuevos}</div>
                <div className="faint" style={{ fontSize: 12 }}>desde admisiones 2026</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-16">
        <CardHead icon="cap" title="Matrículas recientes" sub={DB.matriculas.length + ' registros del ciclo'} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Folio</th><th>Estudiante</th><th>Grado</th><th>Tipo</th><th>Fecha</th><th>Estatus</th><th></th></tr></thead>
            <tbody>
              {DB.matriculas.map((m) => (
                <tr key={m._id}>
                  <td><span className="font-mono faint" style={{ fontSize: 12.5 }}>{m.folio}</span></td>
                  <td><div className="person"><Avatar name={m.student} size={30} /><div><div className="pname">{m.student}</div><div className="pmeta">Tutor: {m.tutor || '—'}</div></div></div></td>
                  <td><span className="font-mono" style={{ fontSize: 13 }}>{m.grade}</span></td>
                  <td>{m.type === 'Reinscripción' ? <Badge tone="blue">Reinscripción</Badge> : <Badge tone="cyan">Nuevo ingreso</Badge>}</td>
                  <td className="muted font-mono" style={{ fontSize: 12.5 }}>{m.date}</td>
                  <td>{matStatus(m.status)}</td>
                  <td><RowMenu items={[
                    { icon: 'check', label: 'Marcar inscrito', onClick: () => { Store.update('matriculas', m._id, { status: 'inscrito' }); toast('Matrícula confirmada ✓'); } },
                    { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => { Store.remove('matriculas', m._id); toast('Matrícula eliminada', 'warn'); } },
                  ]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva matrícula"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Registrar</button></>}>
        <Field label="Estudiante"><TextInput value={form.student} onChange={e => setForm({ ...form, student: e.target.value })} placeholder="Nombre completo" autoFocus /></Field>
        <Field label="Tutor"><TextInput value={form.tutor} onChange={e => setForm({ ...form, tutor: e.target.value })} placeholder="Nombre del tutor" /></Field>
        <div className="field-row">
          <Field label="Grado"><SelectInput value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} options={['Kínder', '1°', '2°', '3°', '4°', '5°', '6°']} /></Field>
          <Field label="Tipo"><SelectInput value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={['Nuevo ingreso', 'Reinscripción']} /></Field>
        </div>
        <Field label="Estatus inicial"><SelectInput value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={[{ value: 'documentos', label: 'Documentos' }, { value: 'pago', label: 'Pago pendiente' }, { value: 'inscrito', label: 'Inscrito' }]} /></Field>
      </Modal>
    </div>
  );
}

/* ============ INGRESOS (derivado de DB.cobros) ============ */
const ING_CONCEPT_COLORS = {
  'Colegiatura': 'var(--accent)', 'Inscripción': 'var(--cyan)', 'Transporte': 'var(--violet)',
  'Cuota anual': 'oklch(0.64 0.13 250)', 'Uniformes': 'var(--amber)',
  'Tiendita / Cafetería': 'var(--green)', 'Talleres y experiencias': 'oklch(0.62 0.16 25)',
};
const ING_CANAL_COLORS = { 'Transferencia': 'var(--accent)', 'Tarjeta': 'var(--violet)', 'Efectivo': 'var(--green)', 'Domiciliación': 'var(--cyan)' };
const ING_MESES = { '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic' };
const ING_MESES_FULL = { '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril', '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto', '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre' };
function ingPeriodLabel(p) { if (p === 'todo') return 'Ciclo ' + (window.PIAGET_CYCLE ? PIAGET_CYCLE() : '2025–2026'); const [y, m] = p.split('-'); return (ING_MESES_FULL[m] || m) + ' ' + y; }
function ingDate(iso) { if (!iso) return '—'; const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }); }
function ingCat(c) { return c.conceptCat || (/colegiatura/i.test(c.concept) ? 'Colegiatura' : /inscrip/i.test(c.concept) ? 'Inscripción' : /transporte/i.test(c.concept) ? 'Transporte' : /uniforme/i.test(c.concept) ? 'Uniformes' : /tiendita|cafeter/i.test(c.concept) ? 'Tiendita / Cafetería' : /taller|experiencia|robótica/i.test(c.concept) ? 'Talleres y experiencias' : 'Otros'); }
function ingFacturado(c) { return !!(c.facturada || (DB.facturas || []).some(f => f.cobroId === c._id)); }
function ingAgg(rows, keyFn, colorFn) {
  const m = {};
  rows.forEach(r => { const k = keyFn(r); if (!m[k]) m[k] = { label: k, value: 0, n: 0 }; m[k].value += r.amount; m[k].n += 1; });
  return Object.values(m).map(x => ({ ...x, color: colorFn(x.label) })).sort((a, b) => b.value - a.value);
}

function RegistrarIngreso({ onClose }) {
  const cats = Object.keys(ING_CONCEPT_COLORS);
  const [form, setForm] = React.useState({ cat: 'Colegiatura', concept: 'Colegiatura agosto', nivel: 'Primaria', familia: '', amount: '', channel: 'Transferencia', status: 'conciliado' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function save() {
    if (!form.familia.trim()) { toast('Escribe el alumno o la familia', 'warn'); return; }
    if (!Number(form.amount)) { toast('Captura un monto válido', 'warn'); return; }
    const recN = (DB.cobros || []).reduce((m, c) => Math.max(m, Number((c.recibo || '').replace(/\D/g, '')) || 0), 4918) + 1;
    Store.add('cobros', {
      recibo: 'REC-0' + recN, student: form.familia, family: form.familia.startsWith('Familia') ? form.familia : 'Familia ' + form.familia.split(' ').slice(-1)[0],
      nivel: form.nivel, concept: form.concept, conceptCat: form.cat, amount: Number(form.amount), channel: form.channel,
      ref: form.channel === 'Efectivo' ? 'Caja 01' : 'Manual', folio: '', date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), status: form.status, facturada: false,
    });
    Store.log('Tesorería', 'registró un ingreso de ' + fmtMoney(Number(form.amount)) + ' · ' + form.cat, 'wallet');
    toast('Ingreso registrado ✓');
    onClose();
  }
  return (
    <Modal open width={560} onClose={onClose} title="Registrar ingreso"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Registrar</button></>}>
      <Field label="Alumno o familia"><TextInput value={form.familia} onChange={e => set('familia', e.target.value)} placeholder="Nombre del alumno o familia" autoFocus /></Field>
      <div className="field-row">
        <Field label="Concepto"><SelectInput value={form.cat} onChange={e => set('cat', e.target.value)} options={cats} /></Field>
        <Field label="Nivel"><SelectInput value={form.nivel} onChange={e => set('nivel', e.target.value)} options={['Preescolar', 'Primaria', 'Secundaria', 'General']} /></Field>
      </div>
      <Field label="Descripción"><TextInput value={form.concept} onChange={e => set('concept', e.target.value)} placeholder="p. ej. Colegiatura agosto" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Monto (MXN)"><NumberInput value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" min="0" /></Field>
        <Field label="Canal"><SelectInput value={form.channel} onChange={e => set('channel', e.target.value)} options={['Transferencia', 'Tarjeta', 'Efectivo', 'Domiciliación']} /></Field>
        <Field label="Estatus"><SelectInput value={form.status} onChange={e => set('status', e.target.value)} options={[{ value: 'conciliado', label: 'Conciliado' }, { value: 'pendiente', label: 'Por conciliar' }]} /></Field>
      </div>
    </Modal>
  );
}

function Ingresos({ go }) {
  const store = useStore();
  const [filter, setFilter] = React.useState('Todos');
  const [nivel, setNivel] = React.useState('Todos');
  const [q, setQ] = React.useState('');
  const [reg, setReg] = React.useState(false);
  const [periodo, setPeriodo] = React.useState('todo');
  const allCobros = DB.cobros || [];
  const periodMonths = Array.from(new Set(allCobros.map(c => (c.date || '').slice(0, 7)).filter(Boolean))).sort().reverse();
  const cobros = periodo === 'todo' ? allCobros : allCobros.filter(c => (c.date || '').slice(0, 7) === periodo);

  const total = cobros.reduce((a, c) => a + c.amount, 0);
  const conciliados = cobros.filter(c => c.status === 'conciliado');
  const pendientes = cobros.filter(c => c.status !== 'conciliado');
  const montoConcil = conciliados.reduce((a, c) => a + c.amount, 0);
  const montoPend = pendientes.reduce((a, c) => a + c.amount, 0);
  const facturados = cobros.filter(ingFacturado);
  const montoFact = facturados.reduce((a, c) => a + c.amount, 0);
  const ticket = cobros.length ? Math.round(total / cobros.length) : 0;

  const porConcepto = ingAgg(cobros, ingCat, l => ING_CONCEPT_COLORS[l] || 'var(--text-faint)');
  const porCanal = ingAgg(cobros, c => c.channel, l => ING_CANAL_COLORS[l] || 'var(--accent)');
  const porNivel = ingAgg(cobros, c => c.nivel || 'General', l => { const cfg = window.nivelCfg && window.nivelCfg(l); return cfg && window.TONE[cfg.tone] ? window.TONE[cfg.tone].c : 'var(--text-faint)'; });
  const maxConcepto = Math.max(...porConcepto.map(c => c.value), 1);
  const maxCanal = Math.max(...porCanal.map(c => c.value), 1);
  const maxNivel = Math.max(...porNivel.map(c => c.value), 1);

  // evolución mensual (siempre tendencia completa del ciclo)
  const byMonth = {};
  allCobros.forEach(c => { const k = (c.date || '').slice(0, 7); if (k) byMonth[k] = (byMonth[k] || 0) + c.amount; });
  const months = Object.keys(byMonth).sort();
  const evoLabels = months.map(m => ING_MESES[m.slice(5, 7)] || m);
  const evoData = months.map(m => byMonth[m]);

  // tabla
  const shown = cobros.filter(c => {
    const byStatus = filter === 'Todos' || (filter === 'Conciliados' ? c.status === 'conciliado' : c.status !== 'conciliado');
    const byNivel = nivel === 'Todos' || (c.nivel || 'General') === nivel;
    const text = ((c.recibo || '') + ' ' + (c.student || c.family || '') + ' ' + c.concept + ' ' + (c.nivel || '')).toLowerCase();
    return byStatus && byNivel && (!q.trim() || text.includes(q.toLowerCase()));
  }).slice().sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
  const capped = shown.slice(0, 60);
  const niveles = ['Todos', ...Array.from(new Set(cobros.map(c => c.nivel || 'General')))];

  function exportCSV() {
    const head = ['Recibo', 'Fecha', 'Alumno/Familia', 'Nivel', 'Concepto', 'Canal', 'Monto', 'Estatus', 'Facturado'];
    const rows = shown.map(c => [c.recibo, c.date, (c.student || c.family || ''), (c.nivel || 'General'), c.concept, c.channel, c.amount, c.status, ingFacturado(c) ? 'Sí' : 'No']);
    const csv = [head, ...rows].map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\ufeff' + csv);
    a.download = 'ingresos_' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
    toast(shown.length + ' movimientos exportados ✓');
  }

  const pctConcil = total ? Math.round(montoConcil / total * 100) : 0;
  const pctFact = total ? Math.round(montoFact / total * 100) : 0;

  return (
    <div className="content-inner">
      <PageHead eyebrow="Tesorería" title="Ingresos" desc={ingPeriodLabel(periodo) + ' · ' + cobros.length + ' pagos · ' + fmtMoney(total) + ' recaudado'}>
        <select className="inp" value={periodo} onChange={e => setPeriodo(e.target.value)} style={{ height: 36, padding: '0 30px 0 12px', fontSize: 13, width: 'auto', fontWeight: 600 }}>
          <option value="todo">Todo el ciclo</option>
          {periodMonths.map(m => <option key={m} value={m}>{ingPeriodLabel(m)}</option>)}
        </select>
        <button className="btn" onClick={exportCSV}><Icon name="download" size={15} className="btn-ico" />Exportar CSV</button>
        <button className="btn" onClick={() => go('cobros')}><Icon name="wallet" size={15} className="btn-ico" />Ir a Cobros</button>
        <button className="btn primary" onClick={() => setReg(true)}><Icon name="plus" size={15} className="btn-ico" />Registrar ingreso</button>
      </PageHead>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Total recaudado', value: fmtMoney(total), icon: 'wallet', tone: 'green' },
          { label: 'Pagos registrados', value: fmtNum(cobros.length), icon: 'receipt', tone: 'violet' },
          { label: 'Ticket promedio', value: fmtMoney(ticket), icon: 'bars', tone: 'blue' },
          { label: 'Por conciliar', value: fmtMoney(montoPend), icon: 'clock', tone: 'amber' },
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
          <CardHead icon="trendUp" title="Evolución de ingresos" sub="Pagos recibidos por mes" />
          <div className="card pad" style={{ borderTop: 'none' }}>
            <AreaChart series={[{ name: 'Ingresos', data: evoData }]} labels={evoLabels} height={224} money />
          </div>
        </div>
        <div className="card">
          <CardHead icon="pie" title="Ingresos por concepto" sub={'Total ' + fmtMoney(total)} />
          <div className="card pad col gap-12" style={{ borderTop: 'none' }}>
            {porConcepto.map((c, i) => (
              <div key={i}>
                <div className="row between center" style={{ marginBottom: 6 }}>
                  <span className="row center gap-8" style={{ fontSize: 13 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: c.color, flexShrink: 0 }} />{c.label}</span>
                  <span className="tnum" style={{ fontWeight: 600, fontSize: 13 }}>{fmtMoney(c.value)}</span>
                </div>
                <Bar value={c.value / maxConcepto * 100} color={c.color} height={8} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <CardHead icon="bars" title="Por canal de pago" sub="Distribución de la recaudación" />
          <div className="card pad col gap-14" style={{ borderTop: 'none' }}>
            {porCanal.map((c, i) => (
              <div key={i}>
                <div className="row between center" style={{ marginBottom: 6 }}>
                  <span className="row center gap-8" style={{ fontSize: 13.5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: c.color, flexShrink: 0 }} />{c.label}<span className="faint" style={{ fontSize: 12 }}>· {c.n} pagos</span></span>
                  <span className="tnum" style={{ fontWeight: 600, fontSize: 13.5 }}>{fmtMoney(c.value)}</span>
                </div>
                <Bar value={c.value / maxCanal * 100} color={c.color} height={8} />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <CardHead icon="cap" title="Por nivel" sub="Recaudación por sección" />
          <div className="card pad col gap-14" style={{ borderTop: 'none' }}>
            {porNivel.map((c, i) => (
              <div key={i}>
                <div className="row between center" style={{ marginBottom: 6 }}>
                  <span className="row center gap-8" style={{ fontSize: 13.5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: c.color, flexShrink: 0 }} />{c.label}<span className="faint" style={{ fontSize: 12 }}>· {c.n} pagos</span></span>
                  <span className="tnum" style={{ fontWeight: 600, fontSize: 13.5 }}>{fmtMoney(c.value)}</span>
                </div>
                <Bar value={c.value / maxNivel * 100} color={c.color} height={8} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <CardHead icon="refresh" title="Conciliación" sub={pctConcil + '% conciliado'} />
          <div className="card pad row center gap-16" style={{ borderTop: 'none', gap: 24 }}>
            <Donut size={140} thickness={18}
              center={<div><div className="font-display" style={{ fontSize: 22, fontWeight: 600 }}>{pctConcil}%</div><div className="faint" style={{ fontSize: 10.5 }}>conciliado</div></div>}
              segments={[{ color: 'var(--green)', label: 'Conciliado', value: montoConcil }, { color: 'var(--amber)', label: 'Por conciliar', value: montoPend }]} />
            <div className="col gap-12 grow">
              <div><div className="row center gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--green)' }} /><span style={{ fontSize: 13, fontWeight: 600 }}>Conciliado</span></div><div className="font-display tnum" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{fmtMoney(montoConcil)}</div><div className="faint" style={{ fontSize: 11.5 }}>{conciliados.length} pagos</div></div>
              <div><div className="row center gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--amber)' }} /><span style={{ fontSize: 13, fontWeight: 600 }}>Por conciliar</span></div><div className="font-display tnum" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{fmtMoney(montoPend)}</div><div className="faint" style={{ fontSize: 11.5 }}>{pendientes.length} pagos</div></div>
            </div>
          </div>
        </div>
        <div className="card">
          <CardHead icon="receipt" title="Facturación" sub={pctFact + '% facturado'}
            right={<button className="btn sm" onClick={() => go('facturas')}><Icon name="receipt" size={13} className="btn-ico" />Facturas</button>} />
          <div className="card pad row center gap-16" style={{ borderTop: 'none', gap: 24 }}>
            <Donut size={140} thickness={18}
              center={<div><div className="font-display" style={{ fontSize: 22, fontWeight: 600 }}>{pctFact}%</div><div className="faint" style={{ fontSize: 10.5 }}>facturado</div></div>}
              segments={[{ color: 'var(--accent)', label: 'Facturado', value: montoFact }, { color: 'var(--surface-3)', label: 'Sin factura', value: Math.max(0, total - montoFact) }]} />
            <div className="col gap-12 grow">
              <div><div className="row center gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} /><span style={{ fontSize: 13, fontWeight: 600 }}>Facturado</span></div><div className="font-display tnum" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{fmtMoney(montoFact)}</div><div className="faint" style={{ fontSize: 11.5 }}>{facturados.length} pagos</div></div>
              <div><div className="row center gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--text-faint)' }} /><span style={{ fontSize: 13, fontWeight: 600 }}>Sin factura</span></div><div className="font-display tnum" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{fmtMoney(total - montoFact)}</div><div className="faint" style={{ fontSize: 11.5 }}>{cobros.length - facturados.length} pagos</div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-16">
        <CardHead icon="wallet" title="Pagos recibidos" sub={shown.length + (shown.length === 1 ? ' movimiento' : ' movimientos') + (shown.length > 60 ? ' · mostrando 60' : '')}
          right={<div className="row center gap-8">
            <select className="inp" value={nivel} onChange={e => setNivel(e.target.value)} style={{ height: 34, padding: '0 28px 0 10px', fontSize: 12.5, width: 'auto' }}>
              {niveles.map(n => <option key={n} value={n}>{n === 'Todos' ? 'Todos los niveles' : n}</option>)}
            </select>
            <div style={{ position: 'relative' }}>
              <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
              <input className="inp" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar recibo, alumno…" style={{ height: 34, padding: '0 10px 0 30px', fontSize: 12.5, width: 200 }} />
            </div>
            <div className="seg">{['Todos', 'Conciliados', 'Por conciliar'].map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div>
          </div>} />
        {capped.length === 0 ? (
          <div className="col center gap-8 faint" style={{ padding: 46, textAlign: 'center' }}>
            <div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 44, height: 44 }}><Icon name="wallet" size={20} /></div>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>Sin movimientos</div>
            <div style={{ fontSize: 13 }}>Ningún pago coincide con el filtro.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Recibo</th><th>Alumno / Familia</th><th>Concepto</th><th>Nivel</th><th>Canal</th><th>Fecha</th><th className="num">Monto</th><th>Estatus</th><th>Factura</th></tr></thead>
              <tbody>
                {capped.map((c, i) => {
                  const who = c.student || c.family; const fact = ingFacturado(c);
                  return (
                    <tr key={c._id || i}>
                      <td><span className="font-mono faint" style={{ fontSize: 12 }}>{c.recibo}</span></td>
                      <td><div className="person"><Avatar name={who} size={28} /><div className="pname" style={{ fontSize: 12.5 }}>{who}</div></div></td>
                      <td className="muted" style={{ maxWidth: 180 }}>{c.concept}</td>
                      <td>{c.nivel ? <Badge tone={window.nivelCfg ? nivelCfg(c.nivel).tone : 'blue'}>{c.nivel}</Badge> : <span className="faint" style={{ fontSize: 12 }}>—</span>}</td>
                      <td><span className="row center gap-8" style={{ fontSize: 13 }}><span style={{ width: 8, height: 8, borderRadius: 3, background: ING_CANAL_COLORS[c.channel] || 'var(--accent)', flexShrink: 0 }} />{c.channel}</span></td>
                      <td className="muted font-mono" style={{ fontSize: 12 }}>{ingDate(c.date)}</td>
                      <td className="num" style={{ fontWeight: 600 }}>{fmtMoney(c.amount)}</td>
                      <td>{c.status === 'conciliado' ? <Badge tone="green" dot>Conciliado</Badge> : <Badge tone="amber" dot>Por conciliar</Badge>}</td>
                      <td>{fact ? <span className="row center gap-8" style={{ fontSize: 12.5, color: 'var(--green)', fontWeight: 600 }}><Icon name="check" size={14} stroke={2.6} />Sí</span> : <span className="faint" style={{ fontSize: 12.5 }}>—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="ai-panel mt-16">
        <div className="insight" style={{ borderTop: 'none', alignItems: 'center' }}>
          <div className="ai-orb" style={{ width: 34, height: 34 }}><Icon name="spark" size={18} fill="currentColor" /></div>
          <div className="insight-body">
            <div className="insight-title">Análisis de ingresos</div>
            <div className="insight-text">Colegiaturas concentran <b>{total ? Math.round((porConcepto.find(c => c.label === 'Colegiatura') || { value: 0 }).value / total * 100) : 0}%</b> de la recaudación. Hay <b>{fmtMoney(montoPend)}</b> por conciliar y <b>{fmtMoney(total - montoFact)}</b> sin facturar. Copilot puede priorizar conciliación y timbrado en lote.</div>
          </div>
          <button className="btn primary nowrap" onClick={() => go('inteligencia-financiera')}><Icon name="bars" size={15} className="btn-ico" />Ver analítica</button>
        </div>
      </div>

      {reg && <RegistrarIngreso onClose={() => setReg(false)} />}
    </div>
  );
}

/* Configuración se redefine en views_config_sections.jsx + views_configuracion.jsx */

Object.assign(window, { Pendientes, Matriculas, Ingresos, ING_CONCEPT_COLORS });
