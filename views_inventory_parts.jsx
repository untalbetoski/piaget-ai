/* views_inventory_parts.jsx — Resumen y Artículos del módulo Inventario,
   más los modales de artículo y movimiento. (Shell en views_inventory.jsx) */

const INV_CATS = ['Uniformes', 'Papelería', 'Cafetería', 'Tecnología', 'Libros', 'Limpieza', 'Mobiliario', 'Deportivo', 'Material didáctico'];
const INV_UNITS = ['Pieza', 'Caja', 'Paquete', 'Kg', 'Litro', 'Juego'];
const INVP_MV_TONE = { Entrada: 'green', Salida: 'red', Ajuste: 'amber', Transferencia: 'cyan' };

/* Estado de existencia de un artículo */
function invStockState(p) {
  const min = Number(p.min) || 0;
  if (p.stock <= 0) return { tone: 'red', label: 'Agotado' };
  if (min > 0 && p.stock <= min) return { tone: 'amber', label: 'Bajo stock' };
  return { tone: 'green', label: 'Disponible' };
}

/* ---------- Resumen ---------- */
function InvResumen({ items, movements, onReabastecer }) {
  const totalArticulos = items.length;
  const totalUnidades = items.reduce((a, p) => a + (Number(p.stock) || 0), 0);
  const valor = items.reduce((a, p) => a + (Number(p.stock) || 0) * (Number(p.cost) || 0), 0);
  const bajos = items.filter(p => { const m = Number(p.min) || 0; return p.stock <= 0 || (m > 0 && p.stock <= m); });
  const agotados = items.filter(p => p.stock <= 0).length;

  const kpis = [
    { label: 'Artículos', value: String(totalArticulos), icon: 'box', tone: 'blue', sub: totalUnidades + ' unidades' },
    { label: 'Valor de inventario', value: fmtMoney(valor), icon: 'wallet', tone: 'violet' },
    { label: 'Bajo stock', value: String(bajos.length), icon: 'alert', tone: bajos.length ? 'amber' : 'green' },
    { label: 'Agotados', value: String(agotados), icon: 'x', tone: agotados ? 'red' : 'green' },
  ];

  if (!items.length) {
    return (
      <div className="card">
        <div className="col center" style={{ gap: 10, padding: '52px 20px', textAlign: 'center' }}>
          <div className="kpi-ico" style={{ width: 50, height: 50, margin: 0, background: 'var(--surface-3)', color: 'var(--text-muted)' }}><Icon name="box" size={24} /></div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Aún no hay artículos en el inventario</div>
          <div className="faint" style={{ fontSize: 13, maxWidth: 420 }}>Agrega artículos desde la pestaña <b>Artículos</b> para llevar el control de existencias, ubicaciones y movimientos del almacén.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {kpis.map((k, i) => { const t = window.TONE[k.tone]; return (
          <div className="card kpi" key={i}>
            <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value tnum">{k.value}</div>
            {k.sub && <div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>{k.sub}</div>}
          </div>
        ); })}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <CardHead icon="alert" title="Por reabastecer" sub={bajos.length + ' artículo(s)'} />
          {bajos.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead><tr><th>Artículo</th><th className="num">Stock</th><th className="num">Mínimo</th><th></th></tr></thead>
                <tbody>
                  {bajos.map((p) => { const st = invStockState(p); return (
                    <tr key={p._id}>
                      <td><div style={{ fontWeight: 600 }}>{p.name}</div><div className="faint font-mono" style={{ fontSize: 11 }}>{p.sku}</div></td>
                      <td className="num"><Badge tone={st.tone} dot>{p.stock}</Badge></td>
                      <td className="num muted tnum">{p.min || '—'}</td>
                      <td><button className="btn sm" onClick={() => onReabastecer(p._id)}><Icon name="history" size={13} className="btn-ico" />Reabastecer</button></td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            </div>
          ) : <div className="faint" style={{ padding: 24, fontSize: 13, textAlign: 'center' }}>Todo en niveles saludables ✓</div>}
        </div>

        <div className="card">
          <CardHead icon="history" title="Movimientos recientes" sub={movements.length + ' en total'} />
          {movements.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Artículo</th><th className="num">Cant.</th></tr></thead>
                <tbody>
                  {movements.slice(0, 7).map((m, i) => (
                    <tr key={i}>
                      <td className="muted font-mono" style={{ fontSize: 12 }}>{m.date}</td>
                      <td><Badge tone={INVP_MV_TONE[m.type] || 'gray'}>{m.type}</Badge></td>
                      <td style={{ fontWeight: 600 }}>{m.item}</td>
                      <td className="num"><span className={m.qty > 0 ? 'qpos' : m.qty < 0 ? 'qneg' : 'qzero'}>{m.qty > 0 ? '+' : ''}{m.qty}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="faint" style={{ padding: 24, fontSize: 13, textAlign: 'center' }}>Aún no hay movimientos registrados.</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Artículos ---------- */
function InvArticulos({ items, onEdit, onNew, onMove, onDelete, jumpFilterLoc }) {
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState('Todas');
  const [loc, setLoc] = React.useState(jumpFilterLoc || 'Todas');
  React.useEffect(() => { if (jumpFilterLoc) setLoc(jumpFilterLoc); }, [jumpFilterLoc]);

  const cats = ['Todas', ...Array.from(new Set(items.map(p => p.cat).filter(Boolean)))];
  const locs = ['Todas', ...Array.from(new Set(items.map(p => p.location).filter(Boolean)))];
  const shown = items.filter(p =>
    (cat === 'Todas' || p.cat === cat) &&
    (loc === 'Todas' || p.location === loc) &&
    (!q.trim() || (p.name + ' ' + (p.sku || '')).toLowerCase().includes(q.trim().toLowerCase()))
  );

  return (
    <div className="cfg-section">
      <div className="inv-toolbar">
        <div className="inv-find">
          <Icon name="search" size={15} className="ic" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre o SKU…" />
        </div>
        <select className="inv-sel" value={cat} onChange={e => setCat(e.target.value)}>{cats.map(c => <option key={c}>{c}</option>)}</select>
        <select className="inv-sel" value={loc} onChange={e => setLoc(e.target.value)}>{locs.map(l => <option key={l}>{l}</option>)}</select>
        <span className="grow" />
        <button className="btn primary" onClick={onNew}><Icon name="plus" size={15} className="btn-ico" />Nuevo artículo</button>
      </div>
      <div className="card">
        <CardHead icon="box" title="Artículos" sub={shown.length + (shown.length === 1 ? ' artículo' : ' artículos')} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Artículo</th><th>Categoría</th><th>Ubicación</th><th className="num">Stock</th><th className="num">Costo</th><th className="num">Valor</th><th>Estatus</th><th></th></tr></thead>
            <tbody>
              {shown.map((p) => { const st = invStockState(p); return (
                <tr key={p._id}>
                  <td><div style={{ fontWeight: 600 }}>{p.name}</div><div className="faint font-mono" style={{ fontSize: 11 }}>{p.sku}</div></td>
                  <td><Badge tone="gray">{p.cat || '—'}</Badge></td>
                  <td className="muted" style={{ fontSize: 12.5 }}>{p.location || '—'}</td>
                  <td className="num tnum" style={{ fontWeight: 600 }}>{p.stock}<span className="faint" style={{ fontWeight: 400, fontSize: 11 }}> {p.unit || 'pz'}</span></td>
                  <td className="num tnum muted">{fmtMoney(Number(p.cost) || 0)}</td>
                  <td className="num tnum" style={{ fontWeight: 600 }}>{fmtMoney((Number(p.stock) || 0) * (Number(p.cost) || 0))}</td>
                  <td><Badge tone={st.tone} dot>{st.label}</Badge></td>
                  <td>
                    <div className="row gap-4">
                      <button className="icon-btn" style={{ width: 30, height: 30 }} title="Entrada" onClick={() => onMove(p._id, 'Entrada')}><Icon name="plus" size={15} /></button>
                      <button className="icon-btn" style={{ width: 30, height: 30 }} title="Salida" onClick={() => onMove(p._id, 'Salida')}><Icon name="minus" size={15} /></button>
                      <RowMenu items={[
                        { icon: 'edit', label: 'Editar', onClick: () => onEdit(p._id) },
                        { icon: 'history', label: 'Ajustar existencia', onClick: () => onMove(p._id, 'Ajuste') },
                        { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => onDelete(p._id) },
                      ]} />
                    </div>
                  </td>
                </tr>
              ); })}
              {shown.length === 0 && <tr><td colSpan="8" className="faint" style={{ textAlign: 'center', padding: 28 }}>{items.length ? 'Ningún artículo coincide con el filtro.' : 'Aún no hay artículos. Crea el primero con “Nuevo artículo”.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Modal: artículo ---------- */
function ItemModal({ item, onClose, onSave }) {
  const isNew = !item;
  const locOpts = (DB.invLocations || []).map(l => l.name);
  const [f, setF] = React.useState(() => item
    ? { ...item }
    : { name: '', sku: '', cat: INV_CATS[0], location: locOpts[0] || '', stock: 0, min: 0, cost: 0, unit: 'Pieza' });
  const u = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (!f.name.trim()) { toast('Escribe el nombre del artículo', 'warn'); return; }
    const sku = (f.sku || '').trim().toUpperCase() || ('INV-' + Math.random().toString(36).slice(2, 6).toUpperCase());
    onSave({ ...f, name: f.name.trim(), sku, stock: Math.max(0, Number(f.stock) || 0), min: Math.max(0, Number(f.min) || 0), cost: Math.max(0, Number(f.cost) || 0) });
  };
  return (
    <Modal open width={540} onClose={onClose} title={isNew ? 'Nuevo artículo' : 'Editar artículo'}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{isNew ? 'Crear' : 'Guardar'}</button></>}>
      <Field label="Nombre del artículo"><TextInput value={f.name} onChange={e => u('name', e.target.value)} placeholder="Ej. Resma de papel bond" /></Field>
      <div className="field-row">
        <Field label="SKU"><TextInput value={f.sku} onChange={e => u('sku', e.target.value.toUpperCase())} placeholder="Automático si se deja vacío" /></Field>
        <Field label="Categoría"><SelectInput value={f.cat} onChange={e => u('cat', e.target.value)} options={INV_CATS} /></Field>
      </div>
      <div className="field-row">
        <Field label="Ubicación">
          {locOpts.length
            ? <SelectInput value={f.location} onChange={e => u('location', e.target.value)} options={locOpts} />
            : <TextInput value={f.location} onChange={e => u('location', e.target.value)} placeholder="Ej. Almacén general" />}
        </Field>
        <Field label="Unidad"><SelectInput value={f.unit} onChange={e => u('unit', e.target.value)} options={INV_UNITS} /></Field>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Existencia"><NumberInput value={f.stock} onChange={e => u('stock', e.target.value)} min="0" /></Field>
        <Field label="Mínimo (reorden)"><NumberInput value={f.min} onChange={e => u('min', e.target.value)} min="0" /></Field>
        <Field label="Costo unitario"><NumberInput value={f.cost} onChange={e => u('cost', e.target.value)} min="0" placeholder="0.00" /></Field>
      </div>
    </Modal>
  );
}

/* ---------- Modal: movimiento (kardex) ---------- */
function MovementModal({ items, preset, onClose, onApply }) {
  const [f, setF] = React.useState(() => ({
    itemId: (preset && preset.itemId) || (items[0] ? items[0]._id : ''),
    type: (preset && preset.type) || 'Entrada',
    qty: 1, note: '',
  }));
  const u = (k, v) => setF(s => ({ ...s, [k]: v }));
  const item = items.find(x => x._id === f.itemId);
  const qty = Number(f.qty) || 0;
  let resultado = item ? item.stock : 0;
  if (item) {
    if (f.type === 'Entrada') resultado = item.stock + qty;
    else if (f.type === 'Salida') resultado = Math.max(0, item.stock - qty);
    else resultado = Math.max(0, qty);
  }
  const apply = () => {
    if (!item) { toast('Selecciona un artículo', 'warn'); return; }
    if (f.type !== 'Ajuste' && qty <= 0) { toast('La cantidad debe ser mayor a 0', 'warn'); return; }
    onApply(f);
  };
  return (
    <Modal open width={480} onClose={onClose} title="Registrar movimiento"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={apply}><Icon name="check" size={15} className="btn-ico" />Aplicar</button></>}>
      {items.length ? (
        <>
          <Field label="Artículo"><SelectInput value={f.itemId} onChange={e => u('itemId', e.target.value)} options={items.map(p => ({ value: p._id, label: p.name + ' · ' + p.sku }))} /></Field>
          <div className="field-row">
            <Field label="Tipo de movimiento"><SelectInput value={f.type} onChange={e => u('type', e.target.value)} options={['Entrada', 'Salida', 'Ajuste']} /></Field>
            <Field label={f.type === 'Ajuste' ? 'Existencia final' : 'Cantidad'}><NumberInput value={f.qty} onChange={e => u('qty', e.target.value)} min="0" /></Field>
          </div>
          {item && (
            <div className="row between center" style={{ padding: '9px 13px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', marginBottom: 14 }}>
              <span className="faint" style={{ fontSize: 12.5 }}>Existencia: <b style={{ color: 'var(--text)' }}>{item.stock}</b> → resultado</span>
              <Badge tone={resultado <= 0 ? 'red' : 'green'} dot>{resultado} {item.unit || 'pz'}</Badge>
            </div>
          )}
          <Field label="Nota (opcional)"><TextInput value={f.note} onChange={e => u('note', e.target.value)} placeholder="Motivo o referencia del movimiento" /></Field>
        </>
      ) : (
        <div className="faint" style={{ padding: '20px 4px', fontSize: 13, textAlign: 'center' }}>Primero crea artículos en la pestaña <b>Artículos</b> para poder registrar movimientos.</div>
      )}
    </Modal>
  );
}

Object.assign(window, { InvResumen, InvArticulos, ItemModal, MovementModal, invStockState });
