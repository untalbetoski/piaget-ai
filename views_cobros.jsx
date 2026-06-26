/* views_cobros.jsx — Módulo Cobros (3 pestañas)
   · Estado de cuenta  → control por ALUMNO (plan + beca individuales)
   · Pagos             → pagos recibidos y conciliación
   · Planes y tarifas  → catálogo de planes por nivel
*/

const COB_CHANNELS = {
  Transferencia: 'accent',
  Tarjeta: 'violet',
  Efectivo: 'green',
  Domiciliación: 'cyan',
  Stripe: 'violet',
  PayPal: 'cyan',
};

function cobDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}
function cobStatusBadge(s) {
  return s === 'conciliado' ? <Badge tone="green" dot>Conciliado</Badge> : <Badge tone="amber" dot>Por conciliar</Badge>;
}

function Cobros({ go }) {
  const store = useStore();
  const [tab, setTab] = React.useState('cuenta');
  const [filter, setFilter] = React.useState('Todos');
  const [payOpen, setPayOpen] = React.useState(false);

  const list = DB.cobros;
  const refToday = list.reduce((m, c) => (c.date > m ? c.date : m), '');
  const cobradoHoy = list.filter(c => c.date === refToday).reduce((a, c) => a + c.amount, 0);
  const cobradoMes = list.reduce((a, c) => a + c.amount, 0);
  const porConciliar = list.filter(c => c.status === 'pendiente');

  const byChannel = Object.keys(COB_CHANNELS).map(ch => ({
    label: ch, color: 'var(--' + COB_CHANNELS[ch] + ')',
    value: list.filter(c => c.channel === ch).reduce((a, c) => a + c.amount, 0),
    n: list.filter(c => c.channel === ch).length,
  })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);
  const maxCh = Math.max(...byChannel.map(c => c.value), 1);

  const conciliados = list.filter(c => c.status === 'conciliado');
  const pctConc = list.length ? Math.round(conciliados.length / list.length * 100) : 0;

  const shown = list.filter(c => filter === 'Todos' || (filter === 'Conciliados' ? c.status === 'conciliado' : c.status === 'pendiente'))
    .slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  function conciliar(c) {
    Store.update('cobros', c._id, { status: 'conciliado' });
    Store.log('Tesorería', 'concilió el recibo ' + c.recibo, 'wallet');
    const folio = window.factBorradorDeCobro ? window.factBorradorDeCobro(c) : null;
    if (folio) toast('Recibo ' + c.recibo + ' conciliado · borrador A-' + folio + ' listo para timbrar ✓');
    else toast('Recibo ' + c.recibo + ' conciliado ✓');
  }

  const kpis = [
    { label: 'Cobrado hoy', value: fmtMoney(cobradoHoy), icon: 'wallet', tone: 'green' },
    { label: 'Cobrado (registro)', value: fmtMoney(cobradoMes), icon: 'trendUp', tone: 'blue' },
    { label: 'Pagos registrados', value: String(list.length), icon: 'receipt', tone: 'violet' },
    { label: 'Por conciliar', value: String(porConciliar.length), icon: 'clock', tone: 'amber' },
  ];

  return (
    <div className="content-inner">
      <PageHead eyebrow="Tesorería" title="Cobros" desc="Control de cobranza por alumno · planes, becas y conciliación">
        <button className="btn" onClick={() => go('facturas')}><Icon name="receipt" size={15} className="btn-ico" />Facturas</button>
        <button className="btn primary" onClick={() => setPayOpen(true)}><Icon name="plus" size={15} className="btn-ico" />Registrar pago</button>
      </PageHead>

      <div className="row" style={{ marginBottom: 16 }}>
        <div className="seg">
          <button className={tab === 'cuenta' ? 'active' : ''} onClick={() => setTab('cuenta')}>Estado de cuenta</button>
          <button className={tab === 'pagos' ? 'active' : ''} onClick={() => setTab('pagos')}>Pagos</button>
          <button className={tab === 'planes' ? 'active' : ''} onClick={() => setTab('planes')}>Planes y tarifas</button>
        </div>
      </div>

      {tab === 'cuenta' && <EstadoCuenta go={go} />}
      {tab === 'planes' && <PlanesTarifas go={go} />}

      {tab === 'pagos' && (<React.Fragment>
        <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {kpis.map((k, i) => { const t = window.TONE[k.tone]; return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum" style={{ fontSize: 26 }}>{k.value}</div>
            </div>
          ); })}
        </div>

        <div className="grid mt-16" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
          <div className="card">
            <CardHead icon="bars" title="Cobranza por canal" sub="Registro de pagos" />
            <div className="card pad col gap-16" style={{ borderTop: 'none' }}>
              {byChannel.map((c, i) => (
                <div key={i}>
                  <div className="row between center" style={{ marginBottom: 6 }}>
                    <span className="row center gap-8" style={{ fontSize: 13.5 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color }} />{c.label}
                      <span className="faint" style={{ fontSize: 12 }}>· {c.n} pagos</span>
                    </span>
                    <span className="tnum" style={{ fontWeight: 600, fontSize: 13.5 }}>{fmtMoney(c.value)}</span>
                  </div>
                  <Bar value={c.value / maxCh * 100} color={c.color} height={8} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <CardHead icon="refresh" title="Conciliación" sub={pctConc + '% conciliado'} />
            <div className="card pad row center gap-16" style={{ borderTop: 'none', gap: 24 }}>
              <Donut size={140} thickness={18}
                center={<div><div className="font-display" style={{ fontSize: 22, fontWeight: 600 }}>{pctConc}%</div><div className="faint" style={{ fontSize: 10.5 }}>conciliado</div></div>}
                segments={[
                  { color: 'var(--green)', label: 'Conciliado', value: conciliados.length },
                  { color: 'var(--amber)', label: 'Por conciliar', value: porConciliar.length },
                ]} />
              <div className="col gap-12 grow">
                <div>
                  <div className="row center gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--green)' }} /><span style={{ fontSize: 13, fontWeight: 600 }}>Conciliado</span></div>
                  <div className="font-display tnum" style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{conciliados.length}</div>
                </div>
                <div>
                  <div className="row center gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--amber)' }} /><span style={{ fontSize: 13, fontWeight: 600 }}>Por conciliar</span></div>
                  <div className="font-display tnum" style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{porConciliar.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-16">
          <CardHead icon="wallet" title="Pagos recibidos" sub={shown.length + (shown.length === 1 ? ' pago' : ' pagos')}
            right={<div className="seg">{['Todos', 'Conciliados', 'Por conciliar'].map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div>} />
          {shown.length === 0 ? (
            <div className="col center gap-8 faint" style={{ padding: 48, textAlign: 'center' }}>
              <div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 44, height: 44 }}><Icon name="wallet" size={20} /></div>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>Sin pagos</div>
              <div style={{ fontSize: 13 }}>Ningún pago coincide con el filtro.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead><tr><th>Recibo</th><th>Alumno / Familia</th><th>Concepto</th><th>Canal</th><th>Referencia</th><th>Fecha</th><th className="num">Monto</th><th>Estatus</th><th>Acciones</th></tr></thead>
                <tbody>
                  {shown.map((c) => { const who = c.student || c.family; return (
                    <tr key={c._id}>
                      <td><span className="font-mono faint" style={{ fontSize: 12 }}>{c.recibo}</span></td>
                      <td><div className="person"><Avatar name={who} size={28} /><div><div className="pname">{who}</div>{c.group && <div className="pmeta">{c.group}</div>}</div></div></td>
                      <td className="muted" style={{ maxWidth: 200 }}>{c.concept}</td>
                      <td><span className="row center gap-8" style={{ fontSize: 13 }}><span style={{ width: 8, height: 8, borderRadius: 3, background: 'var(--' + (COB_CHANNELS[c.channel] || 'accent') + ')', flexShrink: 0 }} />{c.channel}</span></td>
                      <td className="faint font-mono" style={{ fontSize: 11.5 }}>{c.ref}</td>
                      <td className="muted font-mono" style={{ fontSize: 12 }}>{cobDate(c.date)} · {c.time}</td>
                      <td className="num" style={{ fontWeight: 600 }}>{fmtMoney(c.amount)}</td>
                      <td>{cobStatusBadge(c.status)}</td>
                      <td><RowMenu items={[
                        { icon: 'eye', label: 'Ver recibo', onClick: () => toast('Recibo ' + c.recibo + ' abierto') },
                        ...(c.status === 'pendiente' ? [{ icon: 'check', label: 'Conciliar', onClick: () => conciliar(c) }] : []),
                        { icon: 'mail', label: 'Reenviar recibo', onClick: () => toast('Recibo reenviado a ' + who + ' ✓') },
                        { icon: 'receipt', label: 'Generar factura', onClick: () => go('facturas') },
                      ]} /></td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </React.Fragment>)}

      {payOpen && <RegistrarPago onClose={() => setPayOpen(false)} />}
    </div>
  );
}

window.Cobros = Cobros;
