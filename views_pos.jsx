/* views_pos.jsx — Tiendita: Punto de Venta · Catálogo · Inventario */

/* ---------- Punto de Venta ---------- */
const PAY_METHODS = [
  { id: 'Efectivo', label: 'Efectivo', icon: 'wallet', desc: 'Pago en caja' },
  { id: 'Tarjeta', label: 'Tarjeta (TPV)', icon: 'card', desc: 'Terminal física' },
  { id: 'Stripe', label: 'Stripe', icon: 'card', desc: 'Tarjeta en línea' },
  { id: 'PayPal', label: 'PayPal', icon: 'wallet', desc: 'Cuenta PayPal' },
  { id: 'Cargo a cuenta', label: 'Cargo a cuenta', icon: 'users', desc: 'A la familia' },
  { id: 'Enlace', label: 'Enlace de pago', icon: 'link', desc: 'Cobro remoto · QR' },
];
const POS_FAMILIES = ['Familia Hernández', 'Familia Cruz', 'Familia Ramos', 'Familia Vega', 'Familia Torres', 'Familia Núñez', 'Familia Morales', 'Familia Ruiz', 'Familia Aguirre', 'Familia Domínguez', 'Familia Castro', 'Familia Jiménez'];
const PAY_TONE = { Efectivo: 'green', Tarjeta: 'violet', Stripe: 'violet', PayPal: 'cyan', 'Cargo a cuenta': 'amber', 'Enlace de pago': 'amber', Enlace: 'amber' };
function nextTicketNo() {
  const seedMax = 20418;
  const max = (DB.ventas || []).reduce((m, v) => Math.max(m, Number((v.ticket || '').replace(/\D/g, '')) || 0), seedMax);
  return 'V-' + (max + 1);
}
function nextReciboNo() {
  const max = (DB.cobros || []).reduce((m, c) => Math.max(m, Number((c.recibo || '').replace(/\D/g, '')) || 0), 4900);
  return 'REC-0' + (max + 1);
}

/* ====================================================================
   Editar / eliminar ventas registradas
   ==================================================================== */
const EDIT_METHODS = ['Efectivo', 'Tarjeta', 'Stripe', 'PayPal', 'Cargo a cuenta'];
function saleAdjustStock(name, delta) {
  /* delta = unidades vendidas adicionales (positivo descuenta stock) */
  const p = DB.products.find(pp => pp.name === name);
  if (p) Store.update('products', p._id, { stock: Math.max(0, (Number(p.stock) || 0) - delta) });
}
function saleLinkedCobros(sale) {
  return (DB.cobros || []).filter(c => c.saleTicket === sale.ticket || c.ref === sale.ticket || (sale.txn && c.ref === sale.txn));
}
function saleMakesCobro(m) { return ['Cargo a cuenta', 'Stripe', 'PayPal', 'Enlace de pago', 'En línea'].includes(m); }
function saleCobChannel(m, sale) {
  if (m === 'Stripe') return 'Stripe';
  if (m === 'PayPal') return 'PayPal';
  if (m === 'Enlace de pago') return sale && sale.gateway === 'paypal' ? 'PayPal' : sale && sale.gateway === 'stripe' ? 'Stripe' : 'Pago en línea';
  return 'Tiendita';
}
function deleteSaleRecord(sale) {
  (sale.lines || []).forEach(l => saleAdjustStock(l.name, -l.q)); /* restaurar stock */
  saleLinkedCobros(sale).forEach(c => Store.remove('cobros', c._id));
  Store.remove('ventas', sale._id);
  Store.log('Tiendita', 'eliminó la venta ' + sale.ticket, 'trash');
}

function SaleEditor({ sale, onClose }) {
  const store = useStore();
  const [method, setMethod] = React.useState('Efectivo');
  const [student, setStudent] = React.useState('');
  const [lines, setLines] = React.useState([]);
  React.useEffect(() => {
    if (sale) {
      setMethod(EDIT_METHODS.includes(sale.method) ? sale.method : 'Efectivo');
      setStudent(sale.student || '');
      setLines((sale.lines || []).map(l => ({ ...l })));
    }
  }, [sale]);
  if (!sale) return null;
  const total = lines.reduce((a, l) => a + l.price * l.q, 0);
  const items = lines.reduce((a, l) => a + l.q, 0);
  const incQ = (i, d) => setLines(ls => ls.map((l, j) => j === i ? { ...l, q: Math.max(0, l.q + d) } : l));
  const removeLine = (i) => setLines(ls => ls.filter((_, j) => j !== i));

  function save() {
    const newLines = lines.filter(l => Number(l.q) > 0);
    if (!newLines.length) { toast('La venta debe tener al menos un producto', 'warn'); return; }
    if (method === 'Cargo a cuenta' && !(student || '').trim()) { toast('Selecciona el alumno para el cargo', 'warn'); return; }
    const oldMap = {}; (sale.lines || []).forEach(l => oldMap[l.name] = (oldMap[l.name] || 0) + l.q);
    const newMap = {}; newLines.forEach(l => newMap[l.name] = (newMap[l.name] || 0) + l.q);
    new Set([...Object.keys(oldMap), ...Object.keys(newMap)]).forEach(name => {
      const delta = (newMap[name] || 0) - (oldMap[name] || 0);
      if (delta) saleAdjustStock(name, delta);
    });
    const srec = student ? ((DB.students || []).find(s => s.name === student) || null) : null;
    const fam = student ? window.tienditaFamilyOf(student) : null;
    const newTotal = newLines.reduce((a, l) => a + l.price * l.q, 0);
    const newItems = newLines.reduce((a, l) => a + l.q, 0);
    const cash = method === 'Efectivo' ? (sale.cash != null ? Math.max(sale.cash, newTotal) : newTotal) : null;
    Store.update('ventas', sale._id, {
      method, student: student || null, family: fam,
      items: newItems, total: newTotal, lines: newLines,
      cash, change: cash != null ? Math.max(0, cash - newTotal) : null,
    });
    const existing = saleLinkedCobros(sale);
    if (saleMakesCobro(method)) {
      const patch = {
        student: student || 'Público general', family: fam || 'Público general',
        group: srec ? srec.grade : '', amount: newTotal,
        status: method === 'Cargo a cuenta' ? 'pendiente' : 'conciliado',
        channel: saleCobChannel(method, sale),
      };
      if (existing.length) { Store.update('cobros', existing[0]._id, patch); existing.slice(1).forEach(c => Store.remove('cobros', c._id)); }
      else Store.add('cobros', { recibo: nextReciboNo(), saleTicket: sale.ticket, ref: sale.txn || sale.ticket, folio: '', concept: 'Tiendita · ticket ' + sale.ticket + ' (' + newItems + ' art.)', date: sale.date, time: sale.time, ...patch });
    } else {
      existing.forEach(c => Store.remove('cobros', c._id));
    }
    Store.log('Tiendita', 'editó la venta ' + sale.ticket, 'edit');
    toast('Venta actualizada ✓');
    onClose();
  }

  return (
    <Modal open={!!sale} width={480} onClose={onClose} title={'Editar venta ' + sale.ticket}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar cambios</button></>}>
      <div className="field-row">
        <Field label="Método de pago"><SelectInput value={method} onChange={e => setMethod(e.target.value)} options={EDIT_METHODS} /></Field>
        <Field label="Alumno / titular"><window.StudentPicker value={student} onChange={setStudent} allowGeneral /></Field>
      </div>
      <div className="eyebrow" style={{ marginBottom: 0 }}>Productos</div>
      <div className="col">
        {lines.map((l, i) => (
          <div className="row center gap-10" key={i} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
            <div className="grow" style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.name}</div><div className="faint font-mono" style={{ fontSize: 11.5 }}>{fmtMoney(l.price)} c/u</div></div>
            <div className="row center gap-8">
              <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => incQ(i, -1)}><Icon name="x" size={12} /></button>
              <span className="tnum" style={{ fontWeight: 600, minWidth: 18, textAlign: 'center' }}>{l.q}</span>
              <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => incQ(i, 1)}><Icon name="plus" size={12} /></button>
            </div>
            <span className="tnum" style={{ fontWeight: 600, width: 64, textAlign: 'right' }}>{fmtMoney(l.price * l.q)}</span>
            <button className="icon-btn" style={{ width: 28, height: 28 }} title="Quitar producto" onClick={() => removeLine(i)}><Icon name="trash" size={13} /></button>
          </div>
        ))}
      </div>
      <div className="row between center" style={{ marginTop: 6, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
        <span style={{ fontWeight: 600 }}>Total ({items} art.)</span>
        <span className="font-display tnum" style={{ fontSize: 20, fontWeight: 700 }}>{fmtMoney(total)}</span>
      </div>
      <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.45 }}>Al guardar se ajusta el inventario y, si el método lo requiere, se actualiza el cobro vinculado en <b>Cobros</b>.</div>
    </Modal>
  );
}

function POS({ go }) {
  const store = useStore();
  const [cart, setCart] = React.useState([]);
  const [cat, setCat] = React.useState('Todos');
  const [payOpen, setPayOpen] = React.useState(false);
  const [method, setMethod] = React.useState('Efectivo');
  const [received, setReceived] = React.useState('');
  const [student, setStudent] = React.useState(() => (DB.students[0] && DB.students[0].name) || '');
  const [saleView, setSaleView] = React.useState(null);
  const [payCfg, setPayCfg] = React.useState(window.getPayCfg);
  const [connOpen, setConnOpen] = React.useState(false);
  const [shareOrder, setShareOrder] = React.useState(null);
  const [editSale, setEditSale] = React.useState(null);
  const [confirmDel, setConfirmDel] = React.useState(null);
  const [onlineBuyer, setOnlineBuyer] = React.useState('Público general');
  const [linkGw, setLinkGw] = React.useState('stripe');
  const cats = ['Todos', 'Uniformes', 'Natación', 'Papelería', 'Cafetería'];
  const visible = DB.products.filter(p => p.pos !== false);
  const prods = cat === 'Todos' ? visible : visible.filter(p => p.cat === cat);

  const add = (p) => {
    const live = DB.products.find(x => x._id === p._id) || p;
    setCart(c => {
      const e = c.find(x => x._id === p._id);
      const inCart = e ? e.q : 0;
      if (inCart >= window.prodStock(live)) { toast('Sin existencias suficientes de ' + p.name, 'warn'); return c; }
      return e ? c.map(x => x._id === p._id ? { ...x, q: x.q + 1 } : x) : [...c, { ...live, price: window.effPrice(live), q: 1 }];
    });
  };
  const dec = (id) => setCart(c => c.map(x => x._id === id ? { ...x, q: x.q - 1 } : x).filter(x => x.q > 0));
  const total = cart.reduce((a, x) => a + x.price * x.q, 0);
  const items = cart.reduce((a, x) => a + x.q, 0);
  const cash = Number(received) || 0;
  const change = cash - total;

  function checkout() {
    if (!cart.length) { toast('El carrito está vacío', 'warn'); return; }
    setMethod('Efectivo'); setReceived(''); setStudent((DB.students[0] && DB.students[0].name) || '');
    setOnlineBuyer('Público general'); setLinkGw(payCfg.stripe.on ? 'stripe' : 'paypal');
    setPayOpen(true);
  }
  function onGatewayApproved(res) {
    const sale = window.tienditaRecordSale({
      lines: cart.map(x => ({ _id: x._id, name: x.name, q: x.q, price: x.price })),
      total, items, gw: res.gw, txn: res.txn,
      student: onlineBuyer === 'Público general' ? null : onlineBuyer,
      source: 'Caja en línea', cashier: 'Caja 01',
    });
    toast('Pago en línea aprobado: ' + fmtMoney(total) + ' ✓');
    setCart([]); setPayOpen(false); setSaleView(sale);
  }
  function generateLink() {
    const order = window.payNewLinkOrder({
      lines: cart, total, items, gw: linkGw,
      student: onlineBuyer === 'Público general' ? '' : onlineBuyer,
    });
    setCart([]); setPayOpen(false); setShareOrder(order);
    toast('Enlace de cobro generado ✓');
  }
  function confirmPay() {
    if (method === 'Efectivo' && cash < total) { toast('El efectivo recibido no cubre el total', 'warn'); return; }
    if (method === 'Cargo a cuenta' && !student.trim()) { toast('Selecciona el alumno para el cargo', 'warn'); return; }
    cart.forEach(x => {
      const p = DB.products.find(pp => pp._id === x._id);
      if (p) Store.update('products', p._id, { stock: Math.max(0, p.stock - x.q) });
    });
    const isCargo = method === 'Cargo a cuenta';
    const srec = isCargo ? (DB.students || []).find(s => s.name === student) : null;
    const fam = isCargo ? window.tienditaFamilyOf(student) : null;
    const now = new Date();
    const sale = {
      ticket: nextTicketNo(),
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      cashier: 'Caja 01',
      method, items, total,
      cash: method === 'Efectivo' ? cash : null,
      change: method === 'Efectivo' ? Math.max(0, change) : null,
      student: isCargo ? student : null,
      family: fam, grade: srec ? srec.grade : null,
      lines: cart.map(x => ({ name: x.name, q: x.q, price: x.price })),
    };
    Store.add('ventas', sale);
    if (isCargo) {
      Store.add('cobros', {
        recibo: nextReciboNo(), student, family: fam,
        group: srec ? srec.grade : '', saleTicket: sale.ticket,
        concept: 'Tiendita · ticket ' + sale.ticket + ' (' + items + ' art.)',
        amount: total, channel: 'Tiendita', ref: sale.ticket, folio: '',
        date: sale.date, time: sale.time, status: 'pendiente',
      });
    }
    Store.log('Tiendita', 'registró una venta de ' + fmtMoney(total) + ' (' + items + ' art. · ' + method + ')', 'cart');
    toast('Venta cobrada: ' + fmtMoney(total) + (method === 'Efectivo' && change > 0 ? ' · Cambio ' + fmtMoney(change) : '') + ' ✓');
    setCart([]); setPayOpen(false); setSaleView(sale);
  }

  const toneCat = { Uniformes: 'blue', Papelería: 'cyan', Cafetería: 'green', Natación: 'violet' };
  const quick = [total, 50, 100, 200, 500];

  return (
    <div className="content-inner" style={{ maxWidth: 1400 }}>
      <PageHead eyebrow="Comercio · Punto de Venta" title="Punto de Venta" desc="Caja rápida para uniformes, papelería y cafetería.">
        <button className="btn" onClick={() => setConnOpen(true)} title="Conexión de Stripe y PayPal">
          <span style={{ width: 8, height: 8, borderRadius: 999, background: (payCfg.stripe.on || payCfg.paypal.on) ? 'var(--green)' : 'var(--amber)', flexShrink: 0 }} />Pagos en línea
        </button>
        <button className="btn primary" onClick={() => go('tienda-en-linea')}><Icon name="store" size={15} className="btn-ico" />Tienda en línea</button>
      </PageHead>
      <div className="grid" style={{ gridTemplateColumns: '1fr 360px', alignItems: 'start' }}>
        {/* Catálogo */}
        <div>
          <div className="seg" style={{ marginBottom: 16 }}>
            {cats.map(c => <button key={c} className={cat === c ? 'active' : ''} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {prods.length === 0 && (
              <div className="col center gap-8 faint" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center' }}>
                <Icon name="box" size={32} stroke={1.4} />
                <span style={{ fontSize: 13 }}>No hay productos publicados en esta categoría.</span>
                <button className="btn sm" onClick={() => go('catalogo')}><Icon name="tag" size={13} className="btn-ico" />Ir al Catálogo</button>
              </div>
            )}
            {prods.map(p => {
              const t = window.TONE[toneCat[p.cat]] || window.TONE.blue;
              const out = window.prodStock(p) <= 0;
              return (
                <button key={p.sku} className="card pad clickable" onClick={() => add(p)} disabled={out} style={{ textAlign: 'left', border: '1px solid var(--border)', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: 10, opacity: out ? 0.55 : 1, cursor: out ? 'not-allowed' : 'pointer' }}>
                  <div style={{ height: 84, borderRadius: 'var(--r-sm)', background: p.img ? '#fff' : t.bg, display: 'grid', placeItems: 'center', color: t.c, overflow: 'hidden' }}>
                    {p.img
                      ? <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Icon name={p.cat === 'Cafetería' ? 'store' : p.cat === 'Natación' ? 'wallet' : p.cat === 'Uniformes' ? 'tag' : 'box'} size={28} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.25 }}>{p.name}</div>
                    <div className="row between center mt-4">
                      <span className="font-display" style={{ fontWeight: 600 }}>{fmtMoney(window.effPrice(p))}{(Number(p.promoPct) || 0) > 0 && <span className="faint" style={{ fontWeight: 400, fontSize: 10.5, textDecoration: 'line-through', marginLeft: 5 }}>{fmtMoney(p.price)}</span>}</span>
                      {out ? <Badge tone="red">Agotado</Badge> : <span className="faint font-mono" style={{ fontSize: 10.5 }}>{window.prodStock(p)} ud</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ticket */}
        <div className="card" style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 160px)' }}>
          <CardHead icon="receipt" title="Ticket" sub={items + ' artículos'} right={cart.length > 0 && <button className="btn ghost sm" onClick={() => setCart([])}>Vaciar</button>} />
          <div className="grow" style={{ overflowY: 'auto' }}>
            {cart.length === 0 && <div className="col center gap-8 faint" style={{ padding: 40, textAlign: 'center' }}><Icon name="cart" size={34} stroke={1.4} /><span style={{ fontSize: 13 }}>Toca un producto para agregarlo</span></div>}
            {cart.map(x => (
              <div className="lrow" key={x._id} style={{ padding: '11px 16px' }}>
                <div className="grow"><div style={{ fontWeight: 600, fontSize: 13.5 }}>{x.name}</div><div className="faint font-mono" style={{ fontSize: 11.5 }}>{fmtMoney(x.price)} c/u</div></div>
                <div className="row center gap-8">
                  <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => dec(x._id)}><Icon name="x" size={13} /></button>
                  <span className="tnum" style={{ fontWeight: 600, minWidth: 18, textAlign: 'center' }}>{x.q}</span>
                  <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => add(x)}><Icon name="plus" size={13} /></button>
                </div>
                <span className="tnum" style={{ fontWeight: 600, fontSize: 13.5, width: 64, textAlign: 'right' }}>{fmtMoney(x.price * x.q)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', padding: 16 }}>
            <div className="row between center" style={{ marginBottom: 4 }}><span className="muted" style={{ fontSize: 13 }}>Subtotal</span><span className="tnum">{fmtMoney(total)}</span></div>
            <div className="row between center" style={{ marginBottom: 12 }}><span style={{ fontWeight: 600 }}>Total</span><span className="font-display tnum" style={{ fontSize: 24, fontWeight: 700 }}>{fmtMoney(total)}</span></div>
            <button className="btn primary" style={{ width: '100%', justifyContent: 'center', height: 46 }} onClick={checkout}><Icon name="wallet" size={17} className="btn-ico" />Cobrar {items > 0 ? '· ' + items : ''}</button>
          </div>
        </div>
      </div>

      {/* Historial de ventas */}
      <div className="card mt-16">
        <CardHead icon="receipt" title="Historial de ventas" sub={((DB.ventas || []).length) + ' tickets registrados en caja'} />
        {(DB.ventas || []).length === 0 ? (
          <div className="col center gap-8 faint" style={{ padding: 32, textAlign: 'center' }}>
            <Icon name="receipt" size={30} stroke={1.4} />
            <span style={{ fontSize: 13 }}>Aún no hay ventas registradas. Cobra tu primer ticket para verlo aquí.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Ticket</th><th>Fecha · hora</th><th className="num">Artículos</th><th>Método</th><th>Cajero</th><th className="num">Total</th><th>Acciones</th></tr></thead>
              <tbody>
                {(DB.ventas || []).map(v => (
                  <tr key={v._id}>
                    <td><span className="font-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{v.ticket}</span></td>
                    <td className="muted font-mono" style={{ fontSize: 12 }}>{v.date} · {v.time}</td>
                    <td className="num tnum">{v.items}</td>
                    <td><Badge tone={PAY_TONE[v.method] || 'blue'}>{v.method}</Badge>{(v.student || v.family) ? <span className="faint" style={{ fontSize: 11.5, marginLeft: 8 }}>{v.student || v.family}</span> : null}</td>
                    <td className="muted" style={{ fontSize: 12.5 }}>{v.cashier}</td>
                    <td className="num" style={{ fontWeight: 600 }}>{fmtMoney(v.total)}</td>
                    <td><div className="row center gap-6">
                      <button className="btn sm" onClick={() => setSaleView(v)}><Icon name="printer" size={13} className="btn-ico" />Ticket</button>
                      <RowMenu items={[
                        { icon: 'eye', label: 'Ver ticket', onClick: () => setSaleView(v) },
                        { icon: 'edit', label: 'Editar venta', onClick: () => setEditSale(v) },
                        { icon: 'trash', label: 'Eliminar venta', danger: true, onClick: () => setConfirmDel(v) },
                      ]} />
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <window.OnlinePaymentsCard onShare={setShareOrder} />

      {/* Modal de cobro */}
      <Modal open={payOpen} width={460} onClose={() => setPayOpen(false)} title={'Cobrar ' + fmtMoney(total)}
        footer={(method === 'Efectivo' || method === 'Tarjeta' || method === 'Cargo a cuenta')
          ? <><button className="btn" onClick={() => setPayOpen(false)}>Cancelar</button><button className="btn primary" onClick={confirmPay}><Icon name="check" size={15} className="btn-ico" />Confirmar cobro</button></>
          : <button className="btn" onClick={() => setPayOpen(false)} style={{ marginLeft: 'auto' }}>Cerrar</button>}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 16 }}>
          {PAY_METHODS.map(m => (
            <button key={m.id} className={'pay-method-tile' + (method === m.id ? ' sel' : '')} onClick={() => setMethod(m.id)}>
              <div className="row between center" style={{ width: '100%' }}>
                <Icon name={m.icon} size={16} style={{ color: method === m.id ? 'var(--accent)' : 'var(--text-muted)' }} />
                {method === m.id && <Icon name="check" size={14} style={{ color: 'var(--accent)' }} />}
              </div>
              <div><div style={{ fontWeight: 600, fontSize: 12.5 }}>{m.label}</div><div className="faint" style={{ fontSize: 11 }}>{m.desc}</div></div>
            </button>
          ))}
        </div>

        {method === 'Efectivo' && (
          <>
            <Field label="Efectivo recibido (MXN)">
              <NumberInput value={received} onChange={e => setReceived(e.target.value)} placeholder="0.00" min="0" />
            </Field>
            <div className="row gap-8" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
              {quick.map((v, i) => (
                <button key={i} className="btn sm" onClick={() => setReceived(String(v))}>{i === 0 ? 'Exacto' : fmtMoney(v)}</button>
              ))}
            </div>
            <div className="row between center" style={{ padding: '12px 14px', background: change < 0 ? 'var(--red-soft, rgba(220,60,60,.08))' : 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>{change < 0 ? 'Falta' : 'Cambio'}</span>
              <span className="font-display tnum" style={{ fontSize: 20, fontWeight: 700, color: change < 0 ? 'var(--red)' : 'var(--green)' }}>{fmtMoney(Math.abs(change))}</span>
            </div>
          </>
        )}

        {method === 'Tarjeta' && (
          <div className="row center gap-12" style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
            <div className="kpi-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', marginBottom: 0, width: 36, height: 36 }}><Icon name="card" size={18} /></div>
            <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.45 }}>Acerca o inserta la tarjeta en la terminal y confirma cuando el pago sea aprobado.</div>
          </div>
        )}

        {(method === 'Stripe' || method === 'PayPal') && (
          <>
            <Field label="Alumno (opcional)">
              <window.StudentPicker value={onlineBuyer} onChange={setOnlineBuyer} allowGeneral />
            </Field>
            <window.GatewayProcessor key={method} gw={method === 'Stripe' ? 'stripe' : 'paypal'} amount={total} buyer={onlineBuyer === 'Público general' ? '' : onlineBuyer} onApproved={onGatewayApproved} />
          </>
        )}

        {method === 'Cargo a cuenta' && (
          <>
            <Field label="Alumno">
              <window.StudentPicker value={student} onChange={setStudent} />
            </Field>
            <div className="faint" style={{ fontSize: 12, marginTop: -6 }}>Se generará un cargo por conciliar en el módulo <b>Cobros</b> a nombre del alumno.</div>
          </>
        )}

        {method === 'Enlace' && (
          <>
            <Field label="Pasarela del cobro"><window.GatewayPicker value={linkGw} onChange={setLinkGw} /></Field>
            <Field label="Alumno">
              <window.StudentPicker value={onlineBuyer} onChange={setOnlineBuyer} allowGeneral />
            </Field>
            <div className="faint" style={{ fontSize: 12, marginTop: -4, marginBottom: 12, lineHeight: 1.45 }}>Se generará un enlace y código QR para que la familia pague de forma remota. Al confirmarse, la venta se concilia sola en <b>Cobros</b>.</div>
            <button className="btn primary" style={{ width: '100%', justifyContent: 'center', height: 44 }} onClick={generateLink}><Icon name="link" size={15} className="btn-ico" />Generar enlace de cobro</button>
          </>
        )}
      </Modal>

      <window.PayShareModal order={shareOrder} onClose={() => setShareOrder(null)} onPaid={(sale) => setSaleView(sale)} />
      <window.PayConnectionModal open={connOpen} onClose={() => setConnOpen(false)} cfg={payCfg} onChange={setPayCfg} />
      <SaleEditor sale={editSale} onClose={() => setEditSale(null)} />
      <Modal open={!!confirmDel} width={400} onClose={() => setConfirmDel(null)} title="Eliminar venta"
        footer={<><button className="btn" onClick={() => setConfirmDel(null)}>Cancelar</button><button className="btn primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => { deleteSaleRecord(confirmDel); toast('Venta eliminada · stock restaurado', 'warn'); setConfirmDel(null); }}><Icon name="trash" size={15} className="btn-ico" />Eliminar venta</button></>}>
        {confirmDel && <div className="faint" style={{ fontSize: 13, lineHeight: 1.55 }}>Se eliminará la venta <b style={{ color: 'var(--text)' }}>{confirmDel.ticket}</b> por {fmtMoney(confirmDel.total)}. Se restaurará el inventario{saleLinkedCobros(confirmDel).length ? ' y se quitará el cobro vinculado en Cobros' : ''}. Esta acción no se puede deshacer.</div>}
      </Modal>

      {/* Ticket / recibo imprimible */}
      <Modal open={!!saleView} width={380} onClose={() => setSaleView(null)} title={saleView ? 'Ticket ' + saleView.ticket : ''}
        footer={<><button className="btn" onClick={() => setSaleView(null)}>Cerrar</button><button className="btn primary" onClick={() => window.printTicket(saleView)}><Icon name="printer" size={15} className="btn-ico" />Imprimir</button></>}>
        {saleView && (
          <div className="ticket-print" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text)' }}>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>TIENDITA ESCOLAR</div>
              <div className="faint" style={{ fontSize: 11 }}>Colegio Piaget · {saleView.cashier}</div>
              <div className="faint" style={{ fontSize: 11 }}>{saleView.ticket} · {saleView.date} {saleView.time}</div>
            </div>
            <div style={{ borderTop: '1px dashed var(--border-strong)', margin: '8px 0' }}></div>
            {saleView.lines.map((l, i) => (
              <div className="row between" key={i} style={{ gap: 12 }}>
                <span>{l.q} × {l.name}</span>
                <span className="tnum" style={{ flexShrink: 0 }}>{fmtMoney(l.q * l.price)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px dashed var(--border-strong)', margin: '8px 0' }}></div>
            <div className="row between" style={{ fontWeight: 700, fontSize: 15 }}><span>TOTAL</span><span className="tnum">{fmtMoney(saleView.total)}</span></div>
            <div className="row between"><span>Pago</span><span>{saleView.method}{(saleView.student || saleView.family) ? ' · ' + (saleView.student || saleView.family) : ''}</span></div>
            {saleView.txn && <div className="row between"><span>Ref.</span><span style={{ fontSize: 11 }}>{saleView.txn}</span></div>}
            {saleView.cash != null && <div className="row between"><span>Recibido</span><span className="tnum">{fmtMoney(saleView.cash)}</span></div>}
            {saleView.change != null && saleView.change > 0 && <div className="row between"><span>Cambio</span><span className="tnum">{fmtMoney(saleView.change)}</span></div>}
            <div style={{ borderTop: '1px dashed var(--border-strong)', margin: '8px 0' }}></div>
            <div style={{ textAlign: 'center' }} className="faint">¡Gracias por su compra!</div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ---------- Inventario ---------- */
function Inventario({ go }) {
  const store = useStore();
  const [modal, setModal] = React.useState(false);
  const [entry, setEntry] = React.useState({ id: '', qty: '' });

  const low = DB.products.filter(p => p.stock <= 20);
  const totalUnits = DB.products.reduce((a, p) => a + p.stock, 0);
  const totalValue = DB.products.reduce((a, p) => a + p.stock * p.price, 0);

  function openEntry(presetId) {
    setEntry({ id: presetId || (low[0] ? low[0]._id : (DB.products[0] ? DB.products[0]._id : '')), qty: '' });
    setModal(true);
  }
  function saveEntry() {
    const p = DB.products.find(x => x._id === entry.id);
    const qty = Number(entry.qty);
    if (!p) { toast('Selecciona un producto', 'warn'); return; }
    if (!qty || qty <= 0) { toast('Captura una cantidad válida', 'warn'); return; }
    Store.update('products', p._id, { stock: p.stock + qty });
    Store.log('Tiendita', 'registró entrada de ' + qty + ' ud de ' + p.name, 'box');
    toast('Entrada registrada: +' + qty + ' ud de ' + p.name + ' ✓');
    setModal(false);
  }
  function reporte() {
    const rows = [['Producto', 'SKU', 'Categoría', 'Precio', 'Stock', 'Valor']].concat(
      DB.products.map(p => [p.name, p.sku, p.cat, p.price, p.stock, p.price * p.stock]));
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'inventario-tiendita.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Reporte de inventario descargado ✓');
  }

  const selected = DB.products.find(x => x._id === entry.id);

  return (
    <div className="content-inner">
      <PageHead eyebrow="Tiendita" title="Inventario" desc="Existencias y alertas de reabastecimiento.">
        <button className="btn" onClick={reporte}><Icon name="download" size={15} className="btn-ico" />Reporte</button>
        <button className="btn primary" onClick={() => openEntry()}><Icon name="plus" size={15} className="btn-ico" />Entrada de stock</button>
      </PageHead>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { label: 'Unidades en stock', value: fmtNum(totalUnits), icon: 'box', tone: 'blue' },
          { label: 'Valor del inventario', value: fmtMoney(totalValue), icon: 'wallet', tone: 'violet' },
          { label: 'Productos por reponer', value: String(low.length), icon: 'alert', tone: 'amber' },
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
      <div className="card mt-16">
        <CardHead icon="alert" title="Alertas de reabastecimiento" sub="Productos con 20 unidades o menos" right={<Badge tone="amber" dot>{low.length} por reponer</Badge>} />
        <div className="card pad col gap-16" style={{ borderTop: 'none' }}>
          {low.length === 0 && (
            <div className="col center gap-8 faint" style={{ padding: 24, textAlign: 'center' }}>
              <Icon name="check" size={28} stroke={1.5} />
              <span style={{ fontSize: 13 }}>Sin alertas: todos los productos tienen existencias suficientes.</span>
            </div>
          )}
          {low.map((p, i) => (
            <div key={i}>
              <div className="row between center" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name} <span className="faint font-mono" style={{ fontWeight: 400, fontSize: 11.5 }}>· {p.sku}</span></span>
                <span className="row center gap-10">
                  <span className="tnum" style={{ fontWeight: 600, color: p.stock <= 10 ? 'var(--red)' : 'var(--amber)' }}>{p.stock} ud</span>
                  <button className="btn sm" onClick={() => openEntry(p._id)}><Icon name="plus" size={13} className="btn-ico" />Reabastecer</button>
                </span>
              </div>
              <Bar value={Math.min(100, p.stock / 40 * 100)} color={p.stock <= 10 ? 'var(--red)' : 'var(--amber)'} height={8} />
            </div>
          ))}
        </div>
      </div>

      <Modal open={modal} width={460} onClose={() => setModal(false)} title="Entrada de stock"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={saveEntry}><Icon name="check" size={15} className="btn-ico" />Registrar entrada</button></>}>
        <Field label="Producto">
          <select className="inp" value={entry.id} onChange={e => setEntry({ ...entry, id: e.target.value })}>
            {DB.products.map(p => <option key={p._id} value={p._id}>{p.name} · {p.sku}</option>)}
          </select>
        </Field>
        <Field label="Cantidad recibida">
          <NumberInput value={entry.qty} onChange={e => setEntry({ ...entry, qty: e.target.value })} placeholder="0" min="1" />
        </Field>
        {selected && (
          <div className="row between center" style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
            <span className="faint" style={{ fontSize: 12.5 }}>Stock actual de {selected.name}</span>
            <span className="font-display tnum" style={{ fontWeight: 700 }}>{selected.stock} ud {Number(entry.qty) > 0 ? <span style={{ color: 'var(--green)' }}>→ {selected.stock + Number(entry.qty)}</span> : null}</span>
          </div>
        )}
      </Modal>
    </div>
  );
}

Object.assign(window, { POS });
