/* cmdk.jsx — Paleta de comandos (⌘K): búsqueda global de módulos, alumnos, productos y familias */

const cmdkNorm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function cmdkIndex() {
  const items = [];
  // Módulos (hojas del nav)
  (window.NAV || []).forEach(sec => {
    (sec.items || []).forEach(it => {
      if (it.children) {
        it.children.forEach(ch => items.push({ kind: 'Módulos', label: ch.label, sub: sec.section + ' · ' + it.label, icon: it.icon, go: ch.id }));
      } else {
        items.push({ kind: 'Módulos', label: it.label, sub: sec.section, icon: it.icon, go: it.id });
      }
    });
  });
  // Estudiantes
  (DB.students || []).forEach(s => items.push({ kind: 'Estudiantes', label: s.name, sub: s.grade + ' · Tutor: ' + s.tutor, icon: 'cap', go: 'estudiantes' }));
  // Productos de la tiendita
  (DB.products || []).forEach(p => items.push({ kind: 'Productos', label: p.name, sub: p.sku + ' · ' + p.cat + ' · ' + fmtMoney(p.price), icon: 'tag', go: 'catalogo' }));
  // Familias (desde cobros)
  const fams = [...new Set((DB.cobros || []).map(c => c.family))];
  fams.forEach(f => items.push({ kind: 'Familias', label: f, sub: 'Estado de cuenta y pagos', icon: 'users', go: 'cobros' }));
  return items;
}

const CMDK_SUGGESTED = ['home', 'punto-de-venta', 'cobros', 'calificaciones', 'pipeline', 'tiendita', 'inventario', 'finanzas'];

function CommandPalette({ open, onClose, go }) {
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef(null);
  const listRef = React.useRef(null);

  React.useEffect(() => {
    if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current && inputRef.current.focus(), 30); }
  }, [open]);

  const all = React.useMemo(() => open ? cmdkIndex() : [], [open]);
  const needle = cmdkNorm(q.trim());

  let results;
  if (!needle) {
    results = CMDK_SUGGESTED.map(id => all.find(it => it.kind === 'Módulos' && it.go === id)).filter(Boolean)
      .map(it => ({ ...it, kind: 'Sugerencias' }));
  } else {
    const scored = all.filter(it => cmdkNorm(it.label).includes(needle) || cmdkNorm(it.sub).includes(needle));
    const byKind = {};
    scored.forEach(it => { (byKind[it.kind] = byKind[it.kind] || []).push(it); });
    results = [];
    ['Módulos', 'Estudiantes', 'Productos', 'Familias'].forEach(k => { if (byKind[k]) results = results.concat(byKind[k].slice(0, 5)); });
  }

  React.useEffect(() => { setActive(0); }, [q]);
  React.useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-active="true"]');
    if (el) {
      const r = el.getBoundingClientRect(), pr = listRef.current.getBoundingClientRect();
      if (r.bottom > pr.bottom) listRef.current.scrollTop += r.bottom - pr.bottom;
      else if (r.top < pr.top) listRef.current.scrollTop -= pr.top - r.top;
    }
  }, [active]);

  function pick(it) { onClose(); go(it.go); }
  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); pick(results[active]); }
    else if (e.key === 'Escape') { onClose(); }
  }

  if (!open) return null;

  let lastKind = null;
  return (
    <div className="cmdk-scrim" onClick={onClose}>
      <div className="cmdk" onClick={e => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <Icon name="search" size={17} className="faint" />
          <input ref={inputRef} className="cmdk-input" value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Buscar módulos, alumnos, productos, familias…" />
          <kbd className="cmdk-kbd">esc</kbd>
        </div>
        <div className="cmdk-list" ref={listRef}>
          {results.length === 0 && (
            <div className="col center gap-8 faint" style={{ padding: 32, textAlign: 'center' }}>
              <Icon name="search" size={26} stroke={1.4} />
              <span style={{ fontSize: 13 }}>Sin resultados para «{q}»</span>
            </div>
          )}
          {results.map((it, i) => {
            const showHead = it.kind !== lastKind;
            lastKind = it.kind;
            return (
              <React.Fragment key={it.kind + it.label + i}>
                {showHead && <div className="cmdk-group">{it.kind}</div>}
                <button className="cmdk-item" data-active={i === active ? 'true' : 'false'}
                  onMouseEnter={() => setActive(i)} onClick={() => pick(it)}>
                  <span className="cmdk-ico"><Icon name={it.icon} size={16} /></span>
                  <span className="grow" style={{ minWidth: 0 }}>
                    <span className="cmdk-label">{it.label}</span>
                    <span className="cmdk-sub">{it.sub}</span>
                  </span>
                  <Icon name="chevR" size={14} className="faint" />
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="cmdk-foot">
          <span><kbd className="cmdk-kbd">↑</kbd><kbd className="cmdk-kbd">↓</kbd> navegar</span>
          <span><kbd className="cmdk-kbd">↵</kbd> abrir</span>
          <span><kbd className="cmdk-kbd">esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}

window.CommandPalette = CommandPalette;
