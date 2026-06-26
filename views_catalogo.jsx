/* views_catalogo.jsx — Tiendita · Catálogo de productos
   ─────────────────────────────────────────────────────────────
   Vista tabla + tarjetas · variantes (tallas/colores) · proveedor
   y margen · promociones · categorías personalizadas · historial
   de precios · importar / exportar CSV.
   Reutiliza window.DB / window.Store y las primitivas del UI kit.
   ───────────────────────────────────────────────────────────── */

/* ---------- Categorías (base + dinámicas) ---------- */
const CATALOG_BASE = {
  'Uniformes':  { tone: 'blue',   icon: 'tag' },
  'Natación':   { tone: 'violet', icon: 'wallet' },
  'Papelería':  { tone: 'cyan',   icon: 'box' },
  'Cafetería':  { tone: 'green',  icon: 'store' },
};
const CATALOG_TONES = ['blue', 'green', 'amber', 'red', 'violet', 'cyan'];
function catHash(s) { let h = 0; for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) % 997; return h; }
function catTone(cat) { return (CATALOG_BASE[cat] && CATALOG_BASE[cat].tone) || CATALOG_TONES[catHash(cat) % CATALOG_TONES.length]; }
function catIcon(cat) { return (CATALOG_BASE[cat] && CATALOG_BASE[cat].icon) || 'box'; }
function catList() {
  const base = Object.keys(CATALOG_BASE);
  const extra = [...new Set((DB.products || []).map(p => p.cat).filter(Boolean))].filter(c => !base.includes(c));
  return [...base, ...extra];
}
function supplierList() { return [...new Set((DB.products || []).map(p => p.supplier).filter(Boolean))].sort(); }

/* ---------- helpers de producto (globales · POS los reutiliza) ---------- */
function prodStock(p) {
  return (p.variants && p.variants.length)
    ? p.variants.reduce((a, v) => a + (Number(v.stock) || 0), 0)
    : (Number(p.stock) || 0);
}
function effPrice(p) { const pct = Number(p.promoPct) || 0; return pct > 0 ? Math.round(p.price * (1 - pct / 100)) : p.price; }
function prodMargin(p) { const c = Number(p.cost) || 0; if (!c || !p.price) return null; return (p.price - c) / p.price; }
window.prodStock = prodStock;
window.effPrice = effPrice;

const STOCK_LOW = 10, STOCK_MID = 20;
function stockTone(n) { return n <= 0 ? 'red' : n <= STOCK_LOW ? 'red' : n <= STOCK_MID ? 'amber' : 'green'; }
function stockLabel(n) { return n <= 0 ? 'Agotado' : n <= STOCK_LOW ? 'Stock bajo' : n <= STOCK_MID ? 'Por reponer' : 'Disponible'; }

const catEmpty = () => ({
  name: '', sku: '', cat: 'Uniformes', price: '', cost: '', stock: '', supplier: '',
  pos: true, img: '', desc: '', promoOn: false, promoPct: '', variantsOn: false, variants: [],
});

/* ---------- miniatura ---------- */
function ProdThumb({ p, size = 44, radius = 'var(--r-sm)' }) {
  const t = window.TONE[catTone(p.cat)] || window.TONE.blue;
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: p.img ? '#fff' : t.bg, color: t.c, display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
      {p.img
        ? <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <Icon name={catIcon(p.cat)} size={Math.round(size * 0.42)} />}
    </div>
  );
}

function readImageFile(file, cb) {
  if (!file) return;
  if (!/^image\//.test(file.type)) { toast('Selecciona un archivo de imagen', 'warn'); return; }
  if (file.size > 1.5 * 1024 * 1024) { toast('La imagen pesa más de 1.5 MB; usa una más ligera', 'warn'); return; }
  const r = new FileReader();
  r.onload = () => cb(r.result);
  r.readAsDataURL(file);
}

function ImagePicker({ value, cat, onChange }) {
  const inputRef = React.useRef(null);
  const t = window.TONE[catTone(cat)] || window.TONE.blue;
  const isData = value && value.startsWith('data:');
  return (
    <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
      <button type="button" onClick={() => inputRef.current && inputRef.current.click()}
        style={{ width: 92, height: 92, borderRadius: 'var(--r-sm)', border: '1px dashed var(--border-strong)', background: value ? '#fff' : t.bg, color: t.c, display: 'grid', placeItems: 'center', overflow: 'hidden', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
        {value
          ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div className="col center gap-4"><Icon name="image" size={22} /><span style={{ fontSize: 10.5 }}>Sin foto</span></div>}
      </button>
      <div className="col gap-8 grow" style={{ minWidth: 0 }}>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { readImageFile(e.target.files[0], onChange); e.target.value = ''; }} />
        <div className="row gap-8">
          <button type="button" className="btn sm" onClick={() => inputRef.current && inputRef.current.click()}><Icon name="upload" size={13} className="btn-ico" />Subir imagen</button>
          {value && <button type="button" className="btn sm ghost" onClick={() => onChange('')}><Icon name="trash" size={13} className="btn-ico" />Quitar</button>}
        </div>
        <input className="inp" value={isData ? '' : (value || '')} onChange={e => onChange(e.target.value)} placeholder={isData ? 'Imagen subida ✓' : 'o pega una URL de imagen…'} style={{ height: 34, fontSize: 12.5 }} />
        <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.4 }}>JPG o PNG hasta 1.5 MB. Se mostrará en el catálogo y en el Punto de Venta.</div>
      </div>
    </div>
  );
}

function PosToggle({ on, onClick, title }) {
  return (
    <button onClick={onClick} aria-label="toggle" title={title} style={{ width: 38, height: 22, borderRadius: 999, background: on ? 'var(--accent)' : 'var(--surface-3)', position: 'relative', flexShrink: 0, border: 'none', cursor: 'pointer', padding: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: 999, background: '#fff', boxShadow: 'var(--shadow-xs)', transition: 'left .15s' }} />
    </button>
  );
}

/* ---------- piezas reutilizables ---------- */
function MarginBadge({ p, size = 'md' }) {
  const m = prodMargin(p);
  if (m == null) return <span className="faint" style={{ fontSize: 12 }}>—</span>;
  const tone = m >= 0.4 ? 'green' : m >= 0.2 ? 'amber' : 'red';
  return <Badge tone={tone}>{Math.round(m * 100)}%</Badge>;
}

function PriceCell({ p }) {
  const eff = effPrice(p), promo = (Number(p.promoPct) || 0) > 0;
  return (
    <div className="col" style={{ gap: 1, alignItems: 'flex-end' }}>
      <span className="tnum" style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(eff)}</span>
      {promo
        ? <span className="faint tnum" style={{ fontSize: 11, textDecoration: 'line-through' }}>{fmtMoney(p.price)}</span>
        : (Number(p.cost) > 0 ? <span className="faint tnum" style={{ fontSize: 11 }}>costo {fmtMoney(p.cost)}</span> : null)}
    </div>
  );
}

function VariantSummary({ p }) {
  if (!p.variants || !p.variants.length) return null;
  return (
    <div className="row gap-4" style={{ flexWrap: 'wrap', marginTop: 5 }}>
      {p.variants.map((v, i) => (
        <span key={i} className="font-mono" style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 6, background: 'var(--surface-3)', color: 'var(--text-muted)', fontWeight: 600 }}>
          {v.name}<span style={{ opacity: 0.6 }}> {Number(v.stock) || 0}</span>
        </span>
      ))}
    </div>
  );
}

/* ====================================================================
   CSV  ·  exportar / importar
   ==================================================================== */
const CSV_COLS = ['SKU', 'Nombre', 'Categoría', 'Proveedor', 'Costo', 'Precio', 'Promo %', 'Stock', 'POS', 'Detalle'];
function csvCell(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
function catExportCSV() {
  const rows = [CSV_COLS].concat((DB.products || []).map(p => [
    p.sku, p.name, p.cat, p.supplier || '', Number(p.cost) || 0, p.price,
    Number(p.promoPct) || 0, prodStock(p), p.pos !== false ? 'Sí' : 'No', p.desc || '',
  ]));
  const csv = rows.map(r => r.map(csvCell).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'catalogo-tiendita.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Catálogo exportado (' + (DB.products || []).length + ' productos) ✓');
}
function parseCSV(text) {
  const rows = []; let i = 0, field = '', row = [], inQ = false;
  text = text.replace(/\r\n?/g, '\n');
  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQ = true; i++; continue; }
    if (ch === ',') { row.push(field); field = ''; i++; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += ch; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}
function catImportCSV(file, done) {
  const r = new FileReader();
  r.onload = () => {
    let rows;
    try { rows = parseCSV(String(r.result).replace(/^\ufeff/, '')); } catch (e) { toast('No se pudo leer el archivo CSV', 'warn'); return; }
    if (rows.length < 2) { toast('El CSV no tiene filas de datos', 'warn'); return; }
    const head = rows[0].map(h => h.trim().toLowerCase());
    const col = (names) => head.findIndex(h => names.some(n => h.includes(n)));
    const iSku = col(['sku']), iName = col(['nombre', 'name', 'producto']), iCat = col(['categor']),
      iSup = col(['proveedor', 'supplier']), iCost = col(['costo', 'cost']), iPrice = col(['precio', 'price']),
      iPromo = col(['promo', 'desc%', 'descuento']), iStock = col(['stock', 'existencia']), iPos = col(['pos', 'punto', 'venta']),
      iDesc = col(['detalle', 'descripción', 'descripcion', 'detail']);
    if (iName < 0 || iPrice < 0) { toast('El CSV debe incluir al menos columnas Nombre y Precio', 'warn'); return; }
    let added = 0, updated = 0;
    const num = (v) => { const n = Number(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; };
    rows.slice(1).forEach(cells => {
      const name = (cells[iName] || '').trim();
      if (!name) return;
      const price = num(cells[iPrice]);
      if (!price) return;
      const sku = (iSku >= 0 ? cells[iSku] : '').trim();
      const data = {
        name, price,
        cat: (iCat >= 0 && cells[iCat].trim()) || 'Uniformes',
        supplier: iSup >= 0 ? (cells[iSup] || '').trim() : '',
        cost: iCost >= 0 ? num(cells[iCost]) : 0,
        promoPct: iPromo >= 0 ? Math.max(0, Math.min(95, num(cells[iPromo]))) : 0,
        stock: iStock >= 0 ? num(cells[iStock]) : 0,
        pos: iPos >= 0 ? !/^(no|false|0|oculto)/i.test((cells[iPos] || '').trim()) : true,
        desc: iDesc >= 0 ? (cells[iDesc] || '').trim() : '',
      };
      data.tone = catTone(data.cat);
      const existing = sku ? (DB.products || []).find(p => (p.sku || '').toLowerCase() === sku.toLowerCase()) : null;
      if (existing) { Store.update('products', existing._id, { ...data, sku: existing.sku }); updated++; }
      else { Store.add('products', { ...data, sku: sku || (data.cat.slice(0, 3).toUpperCase() + '-' + String(100 + (DB.products || []).length)) }); added++; }
    });
    Store.log('Tiendita', 'importó ' + (added + updated) + ' productos por CSV', 'upload');
    toast('Importación lista: ' + added + ' nuevos · ' + updated + ' actualizados ✓');
    done && done();
  };
  r.readAsText(file);
}

/* ====================================================================
   Editor de variantes
   ==================================================================== */
function VariantEditor({ variants, onChange }) {
  const set = (i, key, val) => onChange(variants.map((v, j) => j === i ? { ...v, [key]: val } : v));
  const addRow = () => onChange([...variants, { name: '', stock: '' }]);
  const delRow = (i) => onChange(variants.filter((_, j) => j !== i));
  const total = variants.reduce((a, v) => a + (Number(v.stock) || 0), 0);
  return (
    <div className="col gap-8">
      {variants.length === 0 && <div className="faint" style={{ fontSize: 12.5 }}>Agrega tallas o colores (p. ej. CH, M, G) con su existencia.</div>}
      {variants.map((v, i) => (
        <div className="row gap-8 center" key={i}>
          <input className="inp" value={v.name} onChange={e => set(i, 'name', e.target.value)} placeholder="Talla / color" style={{ height: 36, flex: 1 }} />
          <input type="number" className="inp" value={v.stock} onChange={e => set(i, 'stock', e.target.value)} placeholder="0" min="0" style={{ height: 36, width: 92 }} />
          <button type="button" className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => delRow(i)}><Icon name="x" size={15} /></button>
        </div>
      ))}
      <div className="row between center">
        <button type="button" className="btn sm" onClick={addRow}><Icon name="plus" size={13} className="btn-ico" />Agregar variante</button>
        <span className="faint" style={{ fontSize: 12.5 }}>Stock total <b style={{ color: 'var(--text)' }}>{total}</b></span>
      </div>
    </div>
  );
}

/* ====================================================================
   Modal de detalle  ·  historial de precios
   ==================================================================== */
function ProductDetail({ p, onClose, onEdit }) {
  if (!p) return null;
  const eff = effPrice(p), promo = (Number(p.promoPct) || 0) > 0, m = prodMargin(p);
  const hist = (p.priceHistory || []).slice().reverse();
  const stk = prodStock(p);
  return (
    <Modal open={!!p} width={520} onClose={onClose} title={p.name}
      footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={() => { onClose(); onEdit(p); }}><Icon name="edit" size={15} className="btn-ico" />Editar</button></>}>
      <div className="row gap-14" style={{ marginBottom: 16 }}>
        <ProdThumb p={p} size={84} />
        <div className="col gap-6 grow" style={{ minWidth: 0 }}>
          <div className="row gap-8 center" style={{ flexWrap: 'wrap' }}>
            <Badge tone={catTone(p.cat)}>{p.cat}</Badge>
            <span className="font-mono faint" style={{ fontSize: 12 }}>{p.sku}</span>
            {p.pos !== false ? <Badge tone="green" dot>En Punto de Venta</Badge> : <Badge tone="gray" dot>Oculto</Badge>}
          </div>
          {p.desc ? <div className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{p.desc}</div> : null}
          {p.supplier ? <div className="row center gap-6 faint" style={{ fontSize: 12.5 }}><Icon name="truck" size={13} />{p.supplier}</div> : null}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { k: 'Precio', v: fmtMoney(eff), sub: promo ? fmtMoney(p.price) + ' · -' + p.promoPct + '%' : null },
          { k: 'Margen', v: m == null ? '—' : Math.round(m * 100) + '%', sub: Number(p.cost) > 0 ? 'costo ' + fmtMoney(p.cost) : null },
          { k: 'Stock', v: String(stk), sub: stockLabel(stk) },
        ].map((c, i) => (
          <div key={i} className="col gap-2" style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', padding: '11px 13px' }}>
            <span className="faint" style={{ fontSize: 11.5 }}>{c.k}</span>
            <span className="font-display tnum" style={{ fontSize: 19, fontWeight: 700 }}>{c.v}</span>
            {c.sub && <span className="faint" style={{ fontSize: 11 }}>{c.sub}</span>}
          </div>
        ))}
      </div>

      {p.variants && p.variants.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Variantes</div>
          <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
            {p.variants.map((v, i) => (
              <span key={i} className="row center gap-8" style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '5px 12px', fontSize: 12.5 }}>
                <b>{v.name}</b><span className="faint tnum">{Number(v.stock) || 0} ud</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="eyebrow" style={{ marginBottom: 8 }}>Historial de precios</div>
      {hist.length === 0 ? (
        <div className="faint" style={{ fontSize: 12.5 }}>Sin cambios de precio registrados. Los ajustes futuros aparecerán aquí.</div>
      ) : (
        <div className="col gap-2">
          {hist.map((h, i) => {
            const up = h.to > h.from;
            return (
              <div key={i} className="row between center" style={{ padding: '9px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <span className="muted font-mono" style={{ fontSize: 12 }}>{h.date}</span>
                <span className="row center gap-8" style={{ fontSize: 13 }}>
                  <span className="faint tnum" style={{ textDecoration: 'line-through' }}>{fmtMoney(h.from)}</span>
                  <Icon name="arrowRight" size={13} style={{ color: 'var(--text-faint)' }} />
                  <span className="tnum" style={{ fontWeight: 600 }}>{fmtMoney(h.to)}</span>
                  <Badge tone={up ? 'amber' : 'green'}>{up ? '+' : ''}{Math.round((h.to - h.from) / h.from * 100)}%</Badge>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

/* ====================================================================
   Tarjeta de producto (vista grid)
   ==================================================================== */
function ProductCard({ p, onOpen, onEdit, onToggle, onDel }) {
  const t = window.TONE[catTone(p.cat)] || window.TONE.blue;
  const eff = effPrice(p), promo = (Number(p.promoPct) || 0) > 0;
  const stk = prodStock(p), inPos = p.pos !== false;
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: inPos ? 1 : 0.74 }}>
      <button className="clickable" onClick={() => onOpen(p)} style={{ position: 'relative', height: 132, background: p.img ? '#fff' : t.bg, color: t.c, display: 'grid', placeItems: 'center', overflow: 'hidden', border: 'none', borderBottom: '1px solid var(--border)', padding: 0, cursor: 'pointer' }}>
        {p.img
          ? <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Icon name={catIcon(p.cat)} size={34} />}
        {promo && <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--red)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>-{p.promoPct}%</span>}
        <span style={{ position: 'absolute', top: 10, right: 10 }}><Badge tone={catTone(p.cat)}>{p.cat}</Badge></span>
      </button>
      <div className="col gap-10" style={{ padding: 14, flex: 1 }}>
        <div className="grow">
          <button className="clickable" onClick={() => onOpen(p)} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', color: 'var(--text)', fontWeight: 600, fontSize: 14, lineHeight: 1.25 }}>{p.name}</button>
          <div className="row between center mt-8" style={{ alignItems: 'flex-end' }}>
            <div className="col" style={{ gap: 1 }}>
              <span className="font-display tnum" style={{ fontSize: 18, fontWeight: 700 }}>{fmtMoney(eff)}</span>
              {promo && <span className="faint tnum" style={{ fontSize: 11.5, textDecoration: 'line-through' }}>{fmtMoney(p.price)}</span>}
            </div>
            <div className="col" style={{ gap: 4, alignItems: 'flex-end' }}>
              <Badge tone={stockTone(stk)} dot>{stk} ud</Badge>
              {prodMargin(p) != null && <span className="faint" style={{ fontSize: 11 }}>margen <b style={{ color: 'var(--text-muted)' }}>{Math.round(prodMargin(p) * 100)}%</b></span>}
            </div>
          </div>
          <VariantSummary p={p} />
        </div>
        <div className="row between center" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <div className="row center gap-8">
            <PosToggle on={inPos} onClick={() => onToggle(p)} title={inPos ? 'Ocultar del Punto de Venta' : 'Mostrar en Punto de Venta'} />
            <span className="faint" style={{ fontSize: 11.5 }}>{inPos ? 'En POS' : 'Oculto'}</span>
          </div>
          <div className="row gap-4">
            <button className="icon-btn" style={{ width: 30, height: 30 }} title="Editar" onClick={() => onEdit(p)}><Icon name="edit" size={15} /></button>
            <RowMenu items={[
              { icon: 'eye', label: 'Ver detalle', onClick: () => onOpen(p) },
              { icon: 'edit', label: 'Editar', onClick: () => onEdit(p) },
              { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => onDel(p) },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================
   CATÁLOGO  (vista principal)
   ==================================================================== */
function Catalogo({ go }) {
  const store = useStore();
  const [modal, setModal] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [form, setForm] = React.useState(catEmpty);
  const [cat, setCat] = React.useState('Todas');
  const [q, setQ] = React.useState('');
  const [view, setView] = React.useState(() => localStorage.getItem('piaget_cat_view') || 'tabla');
  const [lowOnly, setLowOnly] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const fileRef = React.useRef(null);

  const setViewP = (v) => { setView(v); try { localStorage.setItem('piaget_cat_view', v); } catch (e) {} };

  const all = DB.products;
  const cats = catList();
  const enPOS = all.filter(p => p.pos !== false).length;
  const enPromo = all.filter(p => (Number(p.promoPct) || 0) > 0).length;
  const invValue = all.reduce((a, p) => a + prodStock(p) * p.price, 0);
  const margins = all.map(prodMargin).filter(m => m != null);
  const avgMargin = margins.length ? margins.reduce((a, m) => a + m, 0) / margins.length : null;

  const byCat = cat === 'Todas' ? all : all.filter(p => p.cat === cat);
  const needle = q.trim().toLowerCase();
  let shown = needle ? byCat.filter(p => p.name.toLowerCase().includes(needle) || (p.sku || '').toLowerCase().includes(needle) || (p.supplier || '').toLowerCase().includes(needle)) : byCat;
  if (lowOnly) shown = shown.filter(p => prodStock(p) <= STOCK_MID);

  function openNew() { setEditId(null); setForm(catEmpty()); setModal(true); }
  function openEdit(p) {
    setEditId(p._id);
    setForm({
      name: p.name, sku: p.sku, cat: p.cat, price: p.price, cost: p.cost || '', stock: p.stock,
      supplier: p.supplier || '', pos: p.pos !== false, img: p.img || '', desc: p.desc || '',
      promoOn: (Number(p.promoPct) || 0) > 0, promoPct: p.promoPct || '',
      variantsOn: !!(p.variants && p.variants.length), variants: (p.variants || []).map(v => ({ ...v })),
    });
    setModal(true);
  }
  function closeModal() { setModal(false); setEditId(null); setForm(catEmpty()); }

  function save() {
    if (!form.name.trim()) { toast('Escribe el nombre del producto', 'warn'); return; }
    if (!Number(form.price)) { toast('Captura un precio válido', 'warn'); return; }
    const cleanVariants = form.variantsOn ? form.variants.filter(v => (v.name || '').trim()).map(v => ({ name: v.name.trim(), stock: Number(v.stock) || 0 })) : [];
    const useVariants = cleanVariants.length > 0;
    const stock = useVariants ? cleanVariants.reduce((a, v) => a + v.stock, 0) : (Number(form.stock) || 0);
    const newPrice = Number(form.price);
    const data = {
      name: form.name.trim(), sku: form.sku, cat: form.cat, price: newPrice,
      cost: Number(form.cost) || 0, supplier: (form.supplier || '').trim(),
      stock, pos: form.pos, img: form.img || '', desc: (form.desc || '').trim(),
      promoPct: form.promoOn ? Math.max(0, Math.min(95, Number(form.promoPct) || 0)) : 0,
      variants: cleanVariants, tone: catTone(form.cat),
    };
    if (editId) {
      const prev = all.find(p => p._id === editId);
      if (prev && Number(prev.price) !== newPrice) {
        data.priceHistory = [...(prev.priceHistory || []), { date: new Date().toISOString().slice(0, 10), from: Number(prev.price), to: newPrice }];
      }
      Store.update('products', editId, data);
      toast('Producto actualizado ✓');
    } else {
      const sku = form.sku.trim() || (form.cat.slice(0, 3).toUpperCase() + '-' + String(100 + all.length));
      Store.add('products', { ...data, sku });
      Store.log('Tiendita', 'agregó el producto ' + data.name, 'tag');
      toast('Producto creado ✓');
    }
    closeModal();
  }
  function del(p) { Store.remove('products', p._id); toast('Producto eliminado', 'warn'); }
  function togglePos(p) {
    const next = !(p.pos !== false);
    Store.update('products', p._id, { pos: next });
    toast(next ? p.name + ' visible en Punto de Venta ✓' : p.name + ' oculto del Punto de Venta', next ? 'ok' : 'info');
  }

  const kpis = [
    { label: 'Productos', value: String(all.length), icon: 'tag', tone: 'blue' },
    { label: 'Valor de inventario', value: fmtMoney(invValue), icon: 'wallet', tone: 'violet' },
    { label: 'Margen promedio', value: avgMargin == null ? '—' : Math.round(avgMargin * 100) + '%', icon: 'trendUp', tone: 'green' },
    { label: 'En promoción', value: String(enPromo), icon: 'percent', tone: 'amber' },
  ];

  const margPreview = (Number(form.cost) > 0 && Number(form.price) > 0) ? (Number(form.price) - Number(form.cost)) / Number(form.price) : null;
  const promoPreview = form.promoOn && Number(form.promoPct) > 0 ? Math.round(Number(form.price) * (1 - Number(form.promoPct) / 100)) : null;

  return (
    <div className="content-inner">
      <PageHead eyebrow="Comercio" title="Catálogo" desc={all.length + ' productos · ' + enPOS + ' publicados en Punto de Venta · ' + enPromo + ' en promoción'}>
        <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) catImportCSV(e.target.files[0]); e.target.value = ''; }} />
        <button className="btn" onClick={() => fileRef.current && fileRef.current.click()}><Icon name="upload" size={15} className="btn-ico" />Importar</button>
        <button className="btn" onClick={catExportCSV}><Icon name="download" size={15} className="btn-ico" />Exportar</button>
        <button className="btn primary" onClick={openNew}><Icon name="plus" size={15} className="btn-ico" />Nuevo producto</button>
      </PageHead>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {kpis.map((k, i) => {
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
        <CardHead icon="tag" title="Productos" sub="Precios, márgenes, variantes y disponibilidad en caja"
          right={<div className="row center gap-8">
            <div style={{ position: 'relative' }}>
              <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
              <input className="inp" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar nombre, SKU o proveedor…" style={{ height: 34, padding: '0 10px 0 30px', fontSize: 12.5, width: 220 }} />
            </div>
            <div className="seg">
              <button className={view === 'tabla' ? 'active' : ''} onClick={() => setViewP('tabla')} title="Vista tabla"><Icon name="list" size={15} /></button>
              <button className={view === 'tarjetas' ? 'active' : ''} onClick={() => setViewP('tarjetas')} title="Vista tarjetas"><Icon name="grid" size={15} /></button>
            </div>
          </div>} />

        <div className="row between center" style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 10 }}>
          <div className="row center gap-7" style={{ flexWrap: 'wrap' }}>
            {['Todas', ...cats].map(c => (
              <button key={c} className={'chip-btn plain' + (cat === c ? ' active-chip' : '')} onClick={() => setCat(c)}
                style={cat === c ? { background: 'var(--accent-soft)', color: 'var(--accent-strong)', borderColor: 'color-mix(in oklch, var(--accent), var(--border) 50%)' } : {}}>
                {c !== 'Todas' && <span style={{ width: 7, height: 7, borderRadius: 999, background: c === cat ? 'var(--accent)' : 'var(--' + (catTone(c) === 'blue' ? 'accent' : catTone(c)) + ')', marginRight: 6, display: 'inline-block' }} />}
                {c}
              </button>
            ))}
          </div>
          <button className={'chip-btn plain' + (lowOnly ? '' : '')} onClick={() => setLowOnly(v => !v)}
            style={lowOnly ? { background: 'var(--amber-soft)', color: 'oklch(0.55 0.13 70)', borderColor: 'var(--amber)' } : {}}>
            <Icon name="alert" size={13} style={{ marginRight: 5 }} />Stock bajo
          </button>
        </div>

        {shown.length === 0 ? (
          <div className="col center gap-8 faint" style={{ padding: 48, textAlign: 'center' }}>
            <Icon name="box" size={30} stroke={1.4} />
            <span style={{ fontSize: 13 }}>{needle ? 'Sin resultados para «' + q + '»' : 'No hay productos en este filtro.'}</span>
          </div>
        ) : view === 'tarjetas' ? (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(212px, 1fr))', gap: 14, padding: 20 }}>
            {shown.map(p => <ProductCard key={p._id} p={p} onOpen={setDetail} onEdit={openEdit} onToggle={togglePos} onDel={del} />)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr>
                <th style={{ width: 52 }}></th><th>Producto</th><th>Categoría</th><th>Proveedor</th>
                <th className="num">Precio</th><th>Margen</th><th className="num">Stock</th><th>Estado</th>
                <th style={{ textAlign: 'center' }}>POS</th><th></th>
              </tr></thead>
              <tbody>
                {shown.map(p => {
                  const inPos = p.pos !== false, stk = prodStock(p);
                  return (
                    <tr key={p._id} style={{ opacity: inPos ? 1 : 0.6 }}>
                      <td><ProdThumb p={p} size={40} /></td>
                      <td style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => setDetail(p)}>
                        <span className="row center gap-6">{p.name}{(Number(p.promoPct) || 0) > 0 && <Badge tone="red">-{p.promoPct}%</Badge>}</span>
                        <span className="faint font-mono" style={{ fontWeight: 400, fontSize: 11 }}>{p.sku}</span>
                        {p.desc ? <div className="faint" style={{ fontWeight: 400, fontSize: 11.5, marginTop: 2, maxWidth: 280, lineHeight: 1.35 }}>{p.desc}</div> : null}
                        <VariantSummary p={p} />
                      </td>
                      <td><Badge tone={catTone(p.cat)}>{p.cat}</Badge></td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{p.supplier || <span className="faint">—</span>}</td>
                      <td className="num"><PriceCell p={p} /></td>
                      <td><MarginBadge p={p} /></td>
                      <td className="num tnum">{stk}</td>
                      <td><Badge tone={stockTone(stk)} dot>{stockLabel(stk)}</Badge></td>
                      <td>
                        <div className="row center gap-8" style={{ justifyContent: 'center' }}>
                          <PosToggle on={inPos} onClick={() => togglePos(p)} title={inPos ? 'Ocultar del Punto de Venta' : 'Mostrar en Punto de Venta'} />
                        </div>
                      </td>
                      <td><RowMenu items={[
                        { icon: 'eye', label: 'Ver detalle', onClick: () => setDetail(p) },
                        { icon: 'edit', label: 'Editar', onClick: () => openEdit(p) },
                        { icon: 'eye', label: inPos ? 'Ocultar del POS' : 'Mostrar en POS', onClick: () => togglePos(p) },
                        { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => del(p) },
                      ]} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------- Modal crear / editar ---------- */}
      <Modal open={modal} width={600} onClose={closeModal} title={editId ? 'Editar producto' : 'Nuevo producto'}
        footer={<><button className="btn" onClick={closeModal}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{editId ? 'Guardar cambios' : 'Crear producto'}</button></>}>
        <Field label="Nombre del producto"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Uniforme deportivo" /></Field>
        <Field label="Foto del producto"><ImagePicker value={form.img} cat={form.cat} onChange={img => setForm({ ...form, img })} /></Field>
        <div className="field-row">
          <Field label="SKU"><TextInput value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value.toUpperCase() })} placeholder="Automático si se deja vacío" /></Field>
          <Field label="Categoría">
            <input className="inp" list="cat-cats" value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} placeholder="Escribe o elige una" />
            <datalist id="cat-cats">{cats.map(c => <option key={c} value={c} />)}</datalist>
          </Field>
        </div>
        <Field label="Detalle (opcional)"><TextInput value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Ej. Jumper, saco, blusa y corbatín" /></Field>
        <Field label="Proveedor (opcional)">
          <input className="inp" list="cat-suppliers" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Ej. Uniformes del Valle" />
          <datalist id="cat-suppliers">{supplierList().map(s => <option key={s} value={s} />)}</datalist>
        </Field>
        <div className="field-row">
          <Field label="Costo (MXN)"><NumberInput value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="0.00" min="0" /></Field>
          <Field label="Precio de venta (MXN)"><NumberInput value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" min="0" /></Field>
        </div>
        {margPreview != null && (
          <div className="row between center" style={{ marginTop: -4, marginBottom: 14, padding: '9px 13px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
            <span className="faint" style={{ fontSize: 12.5 }}>Margen bruto</span>
            <span className="row center gap-8"><span className="tnum faint" style={{ fontSize: 12 }}>utilidad {fmtMoney(Number(form.price) - Number(form.cost))}</span><Badge tone={margPreview >= 0.4 ? 'green' : margPreview >= 0.2 ? 'amber' : 'red'}>{Math.round(margPreview * 100)}%</Badge></span>
          </div>
        )}

        {/* Promoción */}
        <div style={{ marginBottom: 14, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
          <div className="row between center">
            <div className="row center gap-8"><Icon name="percent" size={15} style={{ color: 'var(--amber)' }} /><span style={{ fontWeight: 600, fontSize: 13.5 }}>Promoción</span></div>
            <PosToggle on={form.promoOn} onClick={() => setForm({ ...form, promoOn: !form.promoOn })} />
          </div>
          {form.promoOn && (
            <div className="row center gap-12" style={{ marginTop: 12 }}>
              <div className="row center gap-6" style={{ flex: 1 }}>
                <NumberInput value={form.promoPct} onChange={e => setForm({ ...form, promoPct: e.target.value })} placeholder="0" min="0" max="95" style={{ height: 36, width: 90 }} />
                <span className="faint" style={{ fontSize: 13 }}>% de descuento</span>
              </div>
              {promoPreview != null && <span className="row center gap-8"><span className="faint tnum" style={{ textDecoration: 'line-through', fontSize: 12.5 }}>{fmtMoney(Number(form.price))}</span><span className="font-display tnum" style={{ fontWeight: 700, color: 'var(--red)' }}>{fmtMoney(promoPreview)}</span></span>}
            </div>
          )}
        </div>

        {/* Variantes */}
        <div style={{ marginBottom: 14, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
          <div className="row between center">
            <div>
              <div className="row center gap-8"><Icon name="layers" size={15} style={{ color: 'var(--violet)' }} /><span style={{ fontWeight: 600, fontSize: 13.5 }}>Manejar por variantes</span></div>
              <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>Tallas o colores con existencia propia</div>
            </div>
            <PosToggle on={form.variantsOn} onClick={() => setForm({ ...form, variantsOn: !form.variantsOn, variants: form.variantsOn ? form.variants : (form.variants.length ? form.variants : [{ name: '', stock: '' }]) })} />
          </div>
          {form.variantsOn && <div style={{ marginTop: 12 }}><VariantEditor variants={form.variants} onChange={variants => setForm({ ...form, variants })} /></div>}
        </div>

        {!form.variantsOn && (
          <Field label="Stock"><NumberInput value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" min="0" /></Field>
        )}

        <div className="row between center" style={{ marginTop: 4, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.3 }}>Mostrar en Punto de Venta</div>
            <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>Disponible para venta en caja</div>
          </div>
          <PosToggle on={form.pos} onClick={() => setForm({ ...form, pos: !form.pos })} />
        </div>

        {editId && (form.priceHistory || (all.find(p => p._id === editId) || {}).priceHistory || []).length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Historial de precios</div>
            {((all.find(p => p._id === editId) || {}).priceHistory || []).slice().reverse().map((h, i) => (
              <div key={i} className="row between center" style={{ fontSize: 12.5, padding: '6px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <span className="muted font-mono" style={{ fontSize: 11.5 }}>{h.date}</span>
                <span className="row center gap-6"><span className="faint tnum" style={{ textDecoration: 'line-through' }}>{fmtMoney(h.from)}</span><Icon name="arrowRight" size={12} /><span className="tnum" style={{ fontWeight: 600 }}>{fmtMoney(h.to)}</span></span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ProductDetail p={detail} onClose={() => setDetail(null)} onEdit={openEdit} />
    </div>
  );
}

Object.assign(window, { Catalogo });
