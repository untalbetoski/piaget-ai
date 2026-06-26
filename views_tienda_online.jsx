/* views_tienda_online.jsx — Tienda en línea (autoservicio para alumnos)
   Catálogo público donde el alumno/familia compra y paga con Stripe o PayPal.
   Las órdenes se concilian automáticamente en Cobros y aparecen en el POS. */

const TIENDA_FAMILIES = ['Familia Hernández', 'Familia Cruz', 'Familia Ramos', 'Familia Vega', 'Familia Torres', 'Familia Núñez', 'Familia Morales', 'Familia Ruiz', 'Familia Aguirre', 'Familia Domínguez', 'Familia Castro', 'Familia Jiménez'];

function StoreProductCard({ p, qty, onAdd, onDec }) {
  const t = window.TONE[window.catTone ? window.catTone(p.cat) : 'blue'] || window.TONE.blue;
  const eff = window.effPrice(p), promo = (Number(p.promoPct) || 0) > 0;
  const stk = window.prodStock(p), out = stk <= 0;
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: out ? 0.6 : 1 }}>
      <div style={{ position: 'relative', height: 130, background: p.img ? '#fff' : t.bg, color: t.c, display: 'grid', placeItems: 'center', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        {p.img ? <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name={window.catIcon ? window.catIcon(p.cat) : 'box'} size={34} />}
        {promo && <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--red)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>-{p.promoPct}%</span>}
      </div>
      <div className="col gap-10" style={{ padding: 14, flex: 1 }}>
        <div className="grow">
          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.25 }}>{p.name}</div>
          {p.desc ? <div className="faint" style={{ fontSize: 11.5, marginTop: 3, lineHeight: 1.35, maxWidth: '100%' }}>{p.desc}</div> : null}
        </div>
        <div className="row between center">
          <div className="col" style={{ gap: 0 }}>
            <span className="font-display tnum" style={{ fontSize: 18, fontWeight: 700 }}>{fmtMoney(eff)}</span>
            {promo && <span className="faint tnum" style={{ fontSize: 11.5, textDecoration: 'line-through' }}>{fmtMoney(p.price)}</span>}
          </div>
          {out ? <Badge tone="red">Agotado</Badge> : qty > 0 ? (
            <div className="row center gap-8">
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onDec}><Icon name="x" size={14} /></button>
              <span className="tnum" style={{ fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{qty}</span>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onAdd}><Icon name="plus" size={14} /></button>
            </div>
          ) : (
            <button className="btn sm primary" onClick={onAdd}><Icon name="cart" size={13} className="btn-ico" />Agregar</button>
          )}
        </div>
      </div>
    </div>
  );
}

function TiendaOnline({ go }) {
  const store = useStore();
  const cfg = window.getPayCfg();
  const [cart, setCart] = React.useState([]);
  const [cat, setCat] = React.useState('Todos');
  const [checkout, setCheckout] = React.useState(false);
  const [step, setStep] = React.useState('contacto'); // contacto | pago | listo
  const [buyer, setBuyer] = React.useState({ student: (DB.students[0] && DB.students[0].name) || '', email: '' });
  const [gw, setGw] = React.useState('stripe');
  const [done, setDone] = React.useState(null);

  const visible = (DB.products || []).filter(p => p.pos !== false);
  const cats = ['Todos', ...[...new Set(visible.map(p => p.cat))]];
  const prods = cat === 'Todos' ? visible : visible.filter(p => p.cat === cat);

  const qtyOf = (id) => { const e = cart.find(x => x._id === id); return e ? e.q : 0; };
  const add = (p) => setCart(c => {
    const live = DB.products.find(x => x._id === p._id) || p;
    const e = c.find(x => x._id === p._id);
    if ((e ? e.q : 0) >= window.prodStock(live)) { toast('Sin más existencias de ' + p.name, 'warn'); return c; }
    return e ? c.map(x => x._id === p._id ? { ...x, q: x.q + 1 } : x) : [...c, { _id: live._id, name: live.name, price: window.effPrice(live), q: 1 }];
  });
  const dec = (id) => setCart(c => c.map(x => x._id === id ? { ...x, q: x.q - 1 } : x).filter(x => x.q > 0));
  const total = cart.reduce((a, x) => a + x.price * x.q, 0);
  const items = cart.reduce((a, x) => a + x.q, 0);

  function openCheckout() { if (!cart.length) { toast('Tu carrito está vacío', 'warn'); return; } setStep('contacto'); setGw(cfg.stripe.on ? 'stripe' : 'paypal'); setCheckout(true); }
  function toPago() { if (!buyer.student) { toast('Selecciona al alumno', 'warn'); return; } setStep('pago'); }
  function onApproved(res) {
    const sale = window.tienditaRecordSale({ lines: cart, total, items, gw: res.gw, txn: res.txn, student: buyer.student, source: 'Tienda en línea', cashier: 'Tienda en línea' });
    setDone({ sale, res }); setStep('listo'); setCart([]);
  }

  return (
    <div className="content-inner" style={{ maxWidth: 1200 }}>
      <PageHead eyebrow="Comercio" title="Tienda en línea" desc="Vista del alumno: catálogo público con pago Stripe y PayPal.">
        {(() => { const s = window.PiagetAuth && window.PiagetAuth.getSession && window.PiagetAuth.getSession(); const staff = !s || s.kind === 'Staff'; return staff ? <>
        <button className="btn" onClick={() => go('punto-de-venta')}><Icon name="store" size={15} className="btn-ico" />Punto de Venta</button>
        <button className="btn" onClick={() => go('catalogo')}><Icon name="tag" size={15} className="btn-ico" />Catálogo</button>
        </> : null; })()}
      </PageHead>

      <div className="pay-store-frame">
        <div className="pay-store-bar">
          <div className="row gap-6">{['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 11, height: 11, borderRadius: 999, background: c, display: 'inline-block' }} />)}</div>
          <div className="pay-url"><Icon name="lock" size={12} />{cfg.storeUrl}</div>
          <span className="conn"><Icon name="lock" size={11} />Seguro</span>
        </div>

        <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          <div>
            {/* Hero */}
            <div className="row between center" style={{ background: 'linear-gradient(120deg, var(--accent-soft), var(--surface-2))', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '18px 20px', marginBottom: 16 }}>
              <div className="row center gap-12">
                <div style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--accent)', color: 'var(--on-accent, #fff)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19 }}>P</div>
                <div>
                  <div className="font-display" style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>Tiendita Piaget</div>
                  <div className="faint" style={{ fontSize: 12.5 }}>Uniformes, natación, papelería y cafetería · entrega en escuela</div>
                </div>
              </div>
              <div className="row center gap-7">
                <Wordmark gw="stripe" size={13} /><span className="faint">·</span><Wordmark gw="paypal" size={13} />
              </div>
            </div>

            <div className="seg" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
              {cats.map(c => <button key={c} className={cat === c ? 'active' : ''} onClick={() => setCat(c)}>{c}</button>)}
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
              {prods.map(p => <StoreProductCard key={p._id} p={p} qty={qtyOf(p._id)} onAdd={() => add(p)} onDec={() => dec(p._id)} />)}
            </div>
          </div>

          {/* Carrito */}
          <div className="card" style={{ position: 'sticky', top: 8, display: 'flex', flexDirection: 'column' }}>
            <CardHead icon="cart" title="Mi carrito" sub={items + ' artículos'} right={cart.length > 0 && <button className="btn ghost sm" onClick={() => setCart([])}>Vaciar</button>} />
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {cart.length === 0
                ? <div className="col center gap-8 faint" style={{ padding: 32, textAlign: 'center' }}><Icon name="cart" size={30} stroke={1.4} /><span style={{ fontSize: 12.5 }}>Agrega productos para comprar</span></div>
                : cart.map(x => (
                  <div className="lrow" key={x._id} style={{ padding: '10px 16px' }}>
                    <div className="grow"><div style={{ fontWeight: 600, fontSize: 13 }}>{x.name}</div><div className="faint font-mono" style={{ fontSize: 11 }}>{fmtMoney(x.price)} c/u</div></div>
                    <div className="row center gap-7">
                      <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => dec(x._id)}><Icon name="x" size={12} /></button>
                      <span className="tnum" style={{ fontWeight: 600, minWidth: 16, textAlign: 'center' }}>{x.q}</span>
                      <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => add(x)}><Icon name="plus" size={12} /></button>
                    </div>
                  </div>
                ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', padding: 16 }}>
              <div className="row between center" style={{ marginBottom: 12 }}><span style={{ fontWeight: 600 }}>Total</span><span className="font-display tnum" style={{ fontSize: 22, fontWeight: 700 }}>{fmtMoney(total)}</span></div>
              <button className="btn primary" style={{ width: '100%', justifyContent: 'center', height: 44 }} onClick={openCheckout}><Icon name="lock" size={15} className="btn-ico" />Pagar en línea</button>
              <div className="row center gap-6 faint" style={{ fontSize: 11, justifyContent: 'center', marginTop: 9 }}><Icon name="lock" size={11} />Pago seguro con Stripe y PayPal</div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout */}
      <Modal open={checkout} width={460} onClose={() => setCheckout(false)}
        title={step === 'listo' ? '¡Compra confirmada!' : 'Pagar ' + fmtMoney(total)}
        footer={step === 'contacto'
          ? <><button className="btn" onClick={() => setCheckout(false)}>Cancelar</button><button className="btn primary" onClick={toPago}>Continuar al pago<Icon name="arrowRight" size={15} className="btn-ico" style={{ marginLeft: 4 }} /></button></>
          : step === 'listo'
            ? <button className="btn primary" onClick={() => setCheckout(false)} style={{ marginLeft: 'auto' }}>Listo</button>
            : <button className="btn" onClick={() => setStep('contacto')}><Icon name="arrowRight" size={14} className="btn-ico" style={{ transform: 'rotate(180deg)' }} />Volver</button>}>

        {step === 'contacto' && (
          <>
            <Field label="Alumno"><window.StudentPicker value={buyer.student} onChange={v => setBuyer({ ...buyer, student: v })} /></Field>
            <Field label="Correo para el recibo (opcional)"><TextInput value={buyer.email} onChange={e => setBuyer({ ...buyer, email: e.target.value })} placeholder="correo@familia.mx" /></Field>
            {buyer.student && <div className="faint" style={{ fontSize: 11.5, marginTop: -6, marginBottom: 12 }}>El cargo se registra a nombre de <b style={{ color: 'var(--text)' }}>{buyer.student}</b> · {window.tienditaFamilyOf(buyer.student)}</div>}
            <div className="col gap-2" style={{ padding: '11px 13px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
              {cart.map(x => <div className="row between" key={x._id} style={{ fontSize: 12.5 }}><span className="muted">{x.q} × {x.name}</span><span className="tnum">{fmtMoney(x.q * x.price)}</span></div>)}
              <div className="row between center" style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6, fontWeight: 700 }}><span>Total</span><span className="tnum">{fmtMoney(total)}</span></div>
            </div>
          </>
        )}

        {step === 'pago' && (
          <>
            <div style={{ marginBottom: 12 }}><GatewayPicker value={gw} onChange={setGw} /></div>
            <GatewayProcessor gw={gw} amount={total} buyer={buyer.student} onApproved={onApproved} />
          </>
        )}

        {step === 'listo' && done && (
          <div className="col center gap-10" style={{ textAlign: 'center', padding: '8px 4px 4px' }}>
            <div className="kpi-ico" style={{ background: 'var(--green-soft)', color: 'var(--green)', width: 50, height: 50, marginBottom: 0 }}><Icon name="check" size={26} stroke={2.5} /></div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Pago aprobado</div>
            <div className="faint" style={{ fontSize: 13, lineHeight: 1.5 }}>Gracias, {buyer.student}. Recoge tu pedido <b style={{ color: 'var(--text)' }}>{done.sale.ticket}</b> en la tiendita presentando tu nombre.</div>
            <div className="col gap-6" style={{ width: '100%', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', marginTop: 4 }}>
              <div className="row between" style={{ fontSize: 12.5 }}><span className="faint">Pedido</span><span className="font-mono">{done.sale.ticket}</span></div>
              <div className="row between" style={{ fontSize: 12.5 }}><span className="faint">Pasarela</span><span className="row center gap-6"><Wordmark gw={done.res.gw} size={12} /></span></div>
              <div className="row between" style={{ fontSize: 12.5 }}><span className="faint">Transacción</span><span className="font-mono" style={{ fontSize: 11 }}>{done.res.txn}</span></div>
              <div className="row between" style={{ fontSize: 12.5, fontWeight: 700 }}><span>Total</span><span className="tnum">{fmtMoney(done.sale.total)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

Object.assign(window, { TiendaOnline });
