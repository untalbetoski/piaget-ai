/* views_tiendita.jsx — Tiendita (resumen de la tienda escolar) */

const TIENDA_CATTONE = { Uniformes: 'blue', Papelería: 'cyan', Cafetería: 'green', Natación: 'violet' };

function Tiendita({ go }) {
  const store = useStore();
  const d = DB.tienda;
  const enVenta = DB.products.filter(p => p.pos !== false).length;
  const catTotal = d.byCategory.reduce((a, c) => a + c.value, 0);
  const maxTop = Math.max(...d.topProducts.map(p => p.revenue), 1);
  const ventas = DB.ventas || [];
  const recientes = [...ventas.map(v => ({ ticket: v.ticket, items: v.items, amount: v.total, time: v.time + ' · ' + v.method, cashier: v.cashier })), ...d.recent].slice(0, 5);
  const hasSales = d.salesMonth > 0 || ventas.length > 0;

  const kpis = [
    { label: 'Ventas de hoy', value: fmtMoney(d.salesToday), icon: 'wallet', tone: 'green' },
    { label: 'Ventas del mes', value: fmtMoney(d.salesMonth), icon: 'trendUp', tone: 'blue' },
    { label: 'Ticket promedio', value: fmtMoney(d.avgTicket), icon: 'receipt', tone: 'violet' },
    { label: 'Productos en venta', value: String(enVenta), icon: 'tag', tone: 'amber' },
  ];

  const accesos = [
    { id: 'punto-de-venta', t: 'Punto de Venta', s: 'Abrir caja y cobrar', icon: 'cart', tone: 'green' },
    { id: 'catalogo', t: 'Catálogo', s: 'Editar productos y precios', icon: 'tag', tone: 'blue' },
    { id: 'inventario', t: 'Inventario', s: 'Existencias y reabasto', icon: 'box', tone: 'amber' },
  ];

  return (
    <div className="content-inner">
      <PageHead eyebrow="Comercio · Tiendita" title="Tiendita" desc={hasSales ? 'Resumen de la tienda escolar' : 'Aún no hay ventas registradas en este ciclo.'}>
        <button className="btn" onClick={() => go('catalogo')}><Icon name="tag" size={15} className="btn-ico" />Catálogo</button>
        <button className="btn primary" onClick={() => go('punto-de-venta')}><Icon name="cart" size={15} className="btn-ico" />Abrir Punto de Venta</button>
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

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card">
          <CardHead icon="bars" title="Ventas de la semana" sub="Últimos 7 días" />
          <div className="card pad" style={{ borderTop: 'none' }}>
            <BarChart data={[d.weekly.values]} labels={d.weekly.labels} colors={['var(--accent)']} height={216} money />
          </div>
        </div>

        <div className="card">
          <CardHead icon="pie" title="Ventas por categoría" sub={'Total ' + fmtMoney(catTotal)} />
          <div className="card pad row center gap-16" style={{ borderTop: 'none', gap: 22 }}>
            <Donut size={132} thickness={18}
              center={<div><div className="font-display tnum" style={{ fontSize: 18, fontWeight: 700 }}>{fmtShort(catTotal)}</div><div className="faint" style={{ fontSize: 10 }}>este mes</div></div>}
              segments={d.byCategory} />
            <div className="col gap-12 grow">
              {d.byCategory.map((c, i) => (
                <div key={i}>
                  <div className="row center gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} /><span style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</span></div>
                  <div className="font-display tnum" style={{ fontSize: 17, fontWeight: 700, marginTop: 1 }}>{fmtMoney(c.value)} <span className="faint" style={{ fontSize: 11, fontWeight: 400 }}>· {c.n} ud</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card">
          <CardHead icon="trendUp" title="Más vendidos" sub="Por ingreso · este mes"
            right={<button className="btn sm" onClick={() => go('catalogo')}><Icon name="tag" size={14} className="btn-ico" />Ver catálogo</button>} />
          <div className="card pad col gap-16" style={{ borderTop: 'none' }}>
            {d.topProducts.length === 0 && (
              <div className="col center gap-8 faint" style={{ padding: 24, textAlign: 'center' }}>
                <Icon name="trendUp" size={26} stroke={1.4} />
                <span style={{ fontSize: 13 }}>Aún no hay ventas para rankear productos.</span>
              </div>
            )}
            {d.topProducts.map((p, i) => {
              const tone = TIENDA_CATTONE[p.cat];
              const color = tone === 'blue' ? 'var(--accent)' : 'var(--' + tone + ')';
              return (
                <div key={i}>
                  <div className="row between center" style={{ marginBottom: 6 }}>
                    <span className="row center gap-8" style={{ fontSize: 13.5 }}>
                      <span className="faint tnum" style={{ width: 16, fontSize: 12 }}>{i + 1}</span>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <Badge tone={tone}>{p.cat}</Badge>
                    </span>
                    <span className="row center gap-12">
                      <span className="faint tnum" style={{ fontSize: 12 }}>{p.units} ud</span>
                      <span className="tnum" style={{ fontWeight: 600, fontSize: 13.5, width: 72, textAlign: 'right' }}>{fmtMoney(p.revenue)}</span>
                    </span>
                  </div>
                  <Bar value={p.revenue / maxTop * 100} color={color} height={8} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <CardHead icon="receipt" title="Ventas recientes" sub="Tickets de hoy"
            right={<button className="btn sm primary" onClick={() => go('punto-de-venta')}><Icon name="cart" size={14} className="btn-ico" />Nueva venta</button>} />
          <div>
            {recientes.length === 0 && (
              <div className="lrow faint" style={{ justifyContent: 'center', padding: 28, fontSize: 13 }}>Aún no hay ventas registradas.</div>
            )}
            {recientes.map((r, i) => (
              <div className="lrow" key={i} style={{ padding: '13px 20px' }}>
                <div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 32, height: 32 }}><Icon name="cart" size={15} /></div>
                <div className="grow">
                  <div style={{ fontWeight: 600, fontSize: 13 }}><span className="font-mono">{r.ticket}</span> · {r.items} art.</div>
                  <div className="faint" style={{ fontSize: 11.5 }}>{r.cashier} · {r.time}</div>
                </div>
                <span className="tnum" style={{ fontWeight: 600, fontSize: 14 }}>{fmtMoney(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {accesos.map((a, i) => {
          const t = window.TONE[a.tone];
          return (
            <button key={i} className="card pad clickable" onClick={() => go(a.id)} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={a.icon} size={20} /></div>
              <div className="grow">
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.t}</div>
                <div className="faint" style={{ fontSize: 12 }}>{a.s}</div>
              </div>
              <Icon name="chevR" size={16} className="faint" />
            </button>
          );
        })}
      </div>

      {hasSales && (
      <div className="ai-panel mt-16">
        <div className="insight" style={{ borderTop: 'none', alignItems: 'center' }}>
          <div className="ai-orb" style={{ width: 34, height: 34 }}><Icon name="spark" size={18} fill="currentColor" /></div>
          <div className="insight-body">
            <div className="insight-title">Recomendación de la tienda</div>
            <div className="insight-text">La <b>Cafetería</b> genera el 50% de las ventas. Copilot detecta que <b>Agua 600ml</b> y <b>Snack natural</b> se agotarán esta semana al ritmo actual y sugiere reabastecer antes del viernes.</div>
          </div>
          <button className="btn primary nowrap" onClick={() => go('inventario')}><Icon name="box" size={15} className="btn-ico" />Ver inventario</button>
        </div>
      </div>
      )}
    </div>
  );
}

window.Tiendita = Tiendita;
