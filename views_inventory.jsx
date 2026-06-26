/* views_inventory.jsx — Shell del módulo Inventario (pestañas + estado compartido)
   y secciones Movimientos · Almacenes · Proveedores.
   Resumen, Artículos y los modales de artículo/movimiento viven en views_inventory_parts.jsx. */

const MV_TONE = { Entrada: 'green', Salida: 'red', Ajuste: 'amber', Transferencia: 'cyan' };
const ORDER_TONE = { Recibida: 'green', Enviada: 'cyan', Borrador: 'gray', Cancelada: 'red' };

/* ---------- Modal: ubicación / almacén ---------- */
function LocationModal({ onClose, onSave }) {
  const levels = ['Todos', ...((DB.settings.levels || []).map(l => l.name))];
  const [f, setF] = React.useState({ name: '', type: 'Almacén', level: 'Todos', responsable: '' });
  const u = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => { if (!f.name.trim()) { toast('Escribe el nombre de la ubicación', 'warn'); return; } onSave({ ...f, name: f.name.trim() }); };
  return (
    <Modal open width={460} onClose={onClose} title="Nueva ubicación"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Crear</button></>}>
      <Field label="Nombre"><TextInput value={f.name} onChange={e => u('name', e.target.value)} placeholder="Ej. Almacén de música" /></Field>
      <div className="field-row">
        <Field label="Tipo"><SelectInput value={f.type} onChange={e => u('type', e.target.value)} options={['Almacén', 'Aulas', 'Aula especializada', 'Biblioteca']} /></Field>
        <Field label="Nivel"><SelectInput value={f.level} onChange={e => u('level', e.target.value)} options={levels} /></Field>
      </div>
      <Field label="Responsable"><TextInput value={f.responsable} onChange={e => u('responsable', e.target.value)} placeholder="Nombre del responsable" /></Field>
    </Modal>
  );
}

/* ---------- Modal: proveedor ---------- */
function SupplierModal({ supplier, onClose, onSave }) {
  const isNew = !supplier;
  const [f, setF] = React.useState(() => supplier ? { ...supplier } : { name: '', cat: 'Papelería', contact: '', phone: '', email: '', lastOrder: '—', status: 'Activo' });
  const u = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => { if (!f.name.trim()) { toast('Escribe el nombre del proveedor', 'warn'); return; } onSave({ ...f, name: f.name.trim() }); };
  return (
    <Modal open width={480} onClose={onClose} title={isNew ? 'Nuevo proveedor' : 'Editar proveedor'}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{isNew ? 'Crear' : 'Guardar'}</button></>}>
      <div className="field-row">
        <Field label="Razón social"><TextInput value={f.name} onChange={e => u('name', e.target.value)} /></Field>
        <Field label="Categoría"><SelectInput value={f.cat} onChange={e => u('cat', e.target.value)} options={['Uniformes', 'Papelería', 'Cafetería', 'Tecnología', 'Libros', 'Limpieza', 'Mobiliario', 'Deportivo']} /></Field>
      </div>
      <Field label="Contacto"><TextInput value={f.contact} onChange={e => u('contact', e.target.value)} placeholder="Nombre del contacto" /></Field>
      <div className="field-row">
        <Field label="Teléfono"><TextInput value={f.phone} onChange={e => u('phone', e.target.value)} /></Field>
        <Field label="Estado"><SelectInput value={f.status} onChange={e => u('status', e.target.value)} options={['Activo', 'Pausado']} /></Field>
      </div>
      <Field label="Correo"><TextInput value={f.email} onChange={e => u('email', e.target.value)} /></Field>
    </Modal>
  );
}

/* ---------- Modal: orden de compra ---------- */
function OrderModal({ suppliers, onClose, onSave }) {
  const [f, setF] = React.useState({ supplier: suppliers[0] ? suppliers[0].name : '', items: 1, total: 0, status: 'Borrador' });
  const u = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => { if (!f.supplier) { toast('Selecciona un proveedor', 'warn'); return; } onSave({ ...f, items: +f.items || 1, total: +f.total || 0 }); };
  return (
    <Modal open width={460} onClose={onClose} title="Nueva orden de compra"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Crear orden</button></>}>
      <Field label="Proveedor"><SelectInput value={f.supplier} onChange={e => u('supplier', e.target.value)} options={suppliers.map(s => s.name)} /></Field>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Artículos"><NumberInput value={f.items} onChange={e => u('items', e.target.value)} min="1" /></Field>
        <Field label="Total"><NumberInput value={f.total} onChange={e => u('total', e.target.value)} min="0" /></Field>
        <Field label="Estado"><SelectInput value={f.status} onChange={e => u('status', e.target.value)} options={['Borrador', 'Enviada', 'Recibida']} /></Field>
      </div>
    </Modal>
  );
}

/* ---------- Sección: Movimientos (kardex) ---------- */
function InvMovimientos({ movements, onMove }) {
  const [filter, setFilter] = React.useState('Todos');
  const types = ['Todos', 'Entrada', 'Salida', 'Ajuste', 'Transferencia'];
  const shown = movements.filter(m => filter === 'Todos' || m.type === filter);
  return (
    <div className="cfg-section">
      <div className="inv-toolbar">
        <div className="seg-thin">
          {types.map(t => <button key={t} className={filter === t ? 'active' : ''} onClick={() => setFilter(t)}>{t}</button>)}
        </div>
        <span className="grow" />
        <button className="btn primary" onClick={() => onMove(null)}><Icon name="plus" size={15} className="btn-ico" />Registrar movimiento</button>
      </div>
      <div className="card">
        <CardHead icon="history" title="Kardex" sub={shown.length + ' movimientos'} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Artículo</th><th className="num">Cantidad</th><th>Ubicación</th><th>Usuario</th><th>Nota</th></tr></thead>
            <tbody>
              {shown.map((m, i) => (
                <tr key={i}>
                  <td className="muted font-mono" style={{ fontSize: 12 }}>{m.date}</td>
                  <td><Badge tone={MV_TONE[m.type] || 'gray'}>{m.type}</Badge></td>
                  <td><div style={{ fontWeight: 600 }}>{m.item}</div><div className="faint font-mono" style={{ fontSize: 11 }}>{m.sku}</div></td>
                  <td className="num"><span className={m.qty > 0 ? 'qpos' : m.qty < 0 ? 'qneg' : 'qzero'}>{m.qty > 0 ? '+' : ''}{m.qty}</span></td>
                  <td className="muted" style={{ fontSize: 12.5 }}>{m.location}</td>
                  <td className="muted" style={{ fontSize: 12.5 }}>{m.user}</td>
                  <td className="faint" style={{ fontSize: 12.5, maxWidth: 220 }}>{m.note}</td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan="7" className="faint" style={{ textAlign: 'center', padding: 28 }}>Sin movimientos de este tipo.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sección: Almacenes / ubicaciones ---------- */
function InvAlmacenes({ items, locations, onView, onAddLocation }) {
  const locTone = { 'Almacén': 'blue', 'Aulas': 'green', 'Aula especializada': 'violet', 'Biblioteca': 'cyan' };
  return (
    <div className="cfg-section">
      <div className="inv-toolbar">
        <span className="grow" />
        <button className="btn primary" onClick={onAddLocation}><Icon name="plus" size={15} className="btn-ico" />Nueva ubicación</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {locations.map((l) => {
          const its = items.filter(p => p.location === l.name);
          const val = its.reduce((a, p) => a + p.stock * p.cost, 0);
          return (
            <div className="loc-card" key={l.name}>
              <div className="row between center">
                <div className="kpi-ico" style={{ width: 38, height: 38, marginBottom: 0, background: `var(--${locTone[l.type] === 'blue' ? 'accent' : (locTone[l.type] || 'cyan')}-soft)`, color: `var(--${locTone[l.type] === 'blue' ? 'accent' : (locTone[l.type] || 'cyan')})` }}><Icon name="building" size={18} /></div>
                <Badge tone="gray">{l.level}</Badge>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{l.name}</div>
                <div className="faint" style={{ fontSize: 12.5 }}>{l.type} · {l.responsable}</div>
              </div>
              <div className="row between center" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div><div className="font-display tnum" style={{ fontWeight: 700, fontSize: 18 }}>{its.length}</div><div className="faint" style={{ fontSize: 11 }}>artículos</div></div>
                <div style={{ textAlign: 'right' }}><div className="font-display tnum" style={{ fontWeight: 700, fontSize: 18 }}>{fmtMoney(val)}</div><div className="faint" style={{ fontSize: 11 }}>valor</div></div>
              </div>
              <button className="btn sm" onClick={() => onView(l.name)}><Icon name="box" size={13} className="btn-ico" />Ver artículos</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Sección: Proveedores y órdenes ---------- */
function InvProveedores({ suppliers, orders, onEditSupplier, onNewSupplier, onToggleSupplier, onNewOrder, onSetOrderStatus }) {
  return (
    <div className="cfg-section">
      <div className="card">
        <CardHead icon="truck" title="Proveedores" sub={suppliers.length + ' registrados'}
          right={<button className="btn sm primary" onClick={onNewSupplier}><Icon name="plus" size={13} className="btn-ico" />Nuevo proveedor</button>} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Proveedor</th><th>Categoría</th><th>Contacto</th><th>Teléfono</th><th>Última orden</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {suppliers.map((s, i) => (
                <tr key={i}>
                  <td><div style={{ fontWeight: 600 }}>{s.name}</div><div className="faint" style={{ fontSize: 11.5 }}>{s.email}</div></td>
                  <td><Badge tone="gray">{s.cat}</Badge></td>
                  <td className="muted" style={{ fontSize: 13 }}>{s.contact}</td>
                  <td className="muted font-mono" style={{ fontSize: 12.5 }}>{s.phone}</td>
                  <td className="muted" style={{ fontSize: 13 }}>{s.lastOrder}</td>
                  <td><Badge tone={s.status === 'Activo' ? 'green' : 'amber'} dot>{s.status}</Badge></td>
                  <td><RowMenu items={[
                    { icon: 'edit', label: 'Editar', onClick: () => onEditSupplier(i) },
                    { icon: 'mail', label: 'Enviar correo', onClick: () => toast('Correo a ' + s.email, 'info') },
                    s.status === 'Activo'
                      ? { icon: 'x', label: 'Pausar', onClick: () => onToggleSupplier(i, 'Pausado') }
                      : { icon: 'check', label: 'Reactivar', onClick: () => onToggleSupplier(i, 'Activo') },
                  ]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <CardHead icon="receipt" title="Órdenes de compra" sub={orders.length + ' órdenes'}
          right={<button className="btn sm primary" onClick={onNewOrder}><Icon name="plus" size={13} className="btn-ico" />Nueva orden</button>} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Folio</th><th>Proveedor</th><th>Fecha</th><th className="num">Artículos</th><th className="num">Total</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i}>
                  <td className="font-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{o.folio}</td>
                  <td className="muted">{o.supplier}</td>
                  <td className="muted">{o.date}</td>
                  <td className="num tnum">{o.items}</td>
                  <td className="num tnum" style={{ fontWeight: 600 }}>{fmtMoney(o.total)}</td>
                  <td><Badge tone={ORDER_TONE[o.status] || 'gray'} dot={o.status === 'Enviada'}>{o.status}</Badge></td>
                  <td><RowMenu items={[
                    { icon: 'eye', label: 'Ver detalle', onClick: () => toast('Detalle de ' + o.folio) },
                    { icon: 'send', label: 'Marcar enviada', onClick: () => onSetOrderStatus(i, 'Enviada') },
                    { icon: 'check', label: 'Marcar recibida', onClick: () => onSetOrderStatus(i, 'Recibida') },
                    { icon: 'x', label: 'Cancelar', onClick: () => onSetOrderStatus(i, 'Cancelada') },
                  ]} /></td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="7" className="faint" style={{ textAlign: 'center', padding: 28 }}>Aún no hay órdenes de compra en este ciclo.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============ SHELL ============ */
function Inventario() {
  const [tab, setTab] = React.useState('Resumen');
  const [items, setItems] = React.useState(() => (DB.inventory || []).map(p => ({ ...p })));
  const [movements, setMovements] = React.useState(() => (DB.invMovements || []).map(m => ({ ...m })));
  const [suppliers, setSuppliers] = React.useState(() => (DB.invSuppliers || []).map(s => ({ ...s })));
  const [orders, setOrders] = React.useState(() => (DB.invOrders || []).map(o => ({ ...o })));
  const [locations, setLocations] = React.useState(() => (DB.invLocations || []).map(l => ({ ...l })));

  const [itemModal, setItemModal] = React.useState(null);    // { id } | { id:null }
  const [moveModal, setMoveModal] = React.useState(null);    // { itemId, type } | {}
  const [supModal, setSupModal] = React.useState(null);      // { index } | { index:-1 }
  const [orderModal, setOrderModal] = React.useState(false);
  const [locModal, setLocModal] = React.useState(false);
  const [jumpLoc, setJumpLoc] = React.useState(null);

  const tabs = ['Resumen', 'Artículos', 'Movimientos', 'Almacenes', 'Proveedores'];

  /* ---- artículos ---- */
  const editItem = id => setItemModal({ id });
  const newItem = () => setItemModal({ id: null });
  const saveItem = data => {
    setItems(is => {
      if (!itemModal.id) { toast('Artículo creado ✓'); return [...is, { _id: 'inv' + Date.now(), ...data }]; }
      toast('Artículo actualizado ✓');
      return is.map(p => p._id === itemModal.id ? { ...p, ...data } : p);
    });
    setItemModal(null);
  };
  const deleteItem = id => { setItems(is => is.filter(p => p._id !== id)); toast('Artículo eliminado', 'warn'); };

  /* ---- movimientos ---- */
  const openMove = (itemId, type) => setMoveModal({ itemId, type });
  const applyMovement = form => {
    const item = items.find(x => x._id === form.itemId);
    if (!item) { setMoveModal(null); return; }
    const qty = Number(form.qty);
    let delta;
    if (form.type === 'Entrada') delta = qty;
    else if (form.type === 'Salida') delta = -Math.min(qty, item.stock);
    else delta = Math.max(0, qty) - item.stock; // ajuste = nueva existencia
    const newStock = Math.max(0, item.stock + delta);
    setItems(is => is.map(x => x._id === item._id ? { ...x, stock: newStock } : x));
    setMovements(ms => [{ date: 'Ahora', type: form.type, item: item.name, sku: item.sku, qty: delta, location: item.location, user: DB.user.name, note: form.note || '—' }, ...ms]);
    toast('Movimiento registrado · ' + item.name + ' (' + (delta > 0 ? '+' : '') + delta + ') ✓');
    setMoveModal(null);
  };

  /* ---- almacenes ---- */
  const viewLocation = name => { setJumpLoc(name); setTab('Artículos'); };
  const addLocation = data => { setLocations(ls => [...ls, data]); toast('Ubicación creada ✓'); setLocModal(false); };

  /* ---- proveedores / órdenes ---- */
  const saveSupplier = data => {
    setSuppliers(ss => {
      if (supModal.index === -1) { toast('Proveedor creado ✓'); return [...ss, data]; }
      toast('Proveedor actualizado ✓');
      return ss.map((s, i) => i === supModal.index ? data : s);
    });
    setSupModal(null);
  };
  const toggleSupplier = (i, status) => { setSuppliers(ss => ss.map((s, j) => j === i ? { ...s, status } : s)); toast('Proveedor ' + (status === 'Activo' ? 'reactivado' : 'pausado'), status === 'Activo' ? 'ok' : 'warn'); };
  const newOrder = data => {
    const folio = 'OC-2026-' + String(59 + orders.filter(o => o.folio.startsWith('OC-2026')).length).padStart(3, '0');
    setOrders(os => [{ folio, date: 'Hoy', ...data }, ...os]);
    toast('Orden ' + folio + ' creada ✓'); setOrderModal(false);
  };
  const setOrderStatus = (i, status) => { setOrders(os => os.map((o, j) => j === i ? { ...o, status } : o)); toast('Orden marcada como ' + status, status === 'Cancelada' ? 'warn' : 'ok'); };

  const editing = itemModal && itemModal.id ? items.find(p => p._id === itemModal.id) : null;

  return (
    <div className="content-inner">
      <PageHead eyebrow="Comercio" title="Inventario" desc="Productos, activos, consumibles y libros del colegio.">
        <button className="btn primary" onClick={() => openMove(null, 'Entrada')}><Icon name="history" size={15} className="btn-ico" />Registrar movimiento</button>
      </PageHead>

      <div className="seg" style={{ marginBottom: 18 }}>
        {tabs.map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => { setTab(t); if (t !== 'Artículos') setJumpLoc(null); }}>{t}</button>)}
      </div>

      {tab === 'Resumen' && <InvResumen items={items} movements={movements} onReabastecer={id => openMove(id, 'Entrada')} />}
      {tab === 'Artículos' && <InvArticulos items={items} onEdit={editItem} onNew={newItem} onMove={openMove} onDelete={deleteItem} jumpFilterLoc={jumpLoc} />}
      {tab === 'Movimientos' && <InvMovimientos movements={movements} onMove={(id) => openMove(id, 'Entrada')} />}
      {tab === 'Almacenes' && <InvAlmacenes items={items} locations={locations} onView={viewLocation} onAddLocation={() => setLocModal(true)} />}
      {tab === 'Proveedores' && <InvProveedores suppliers={suppliers} orders={orders}
        onEditSupplier={i => setSupModal({ index: i, supplier: suppliers[i] })} onNewSupplier={() => setSupModal({ index: -1 })}
        onToggleSupplier={toggleSupplier} onNewOrder={() => setOrderModal(true)} onSetOrderStatus={setOrderStatus} />}

      {itemModal && <ItemModal item={editing} onClose={() => setItemModal(null)} onSave={saveItem} />}
      {moveModal && <MovementModal items={items} preset={moveModal} onClose={() => setMoveModal(null)} onApply={applyMovement} />}
      {supModal && <SupplierModal supplier={supModal.index === -1 ? null : supModal.supplier} onClose={() => setSupModal(null)} onSave={saveSupplier} />}
      {orderModal && <OrderModal suppliers={suppliers} onClose={() => setOrderModal(false)} onSave={newOrder} />}
      {locModal && <LocationModal onClose={() => setLocModal(false)} onSave={addLocation} />}
    </div>
  );
}

window.Inventario = Inventario;
