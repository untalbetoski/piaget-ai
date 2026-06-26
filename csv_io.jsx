/* csv_io.jsx — utilidades CSV + control reutilizable Importar/Exportar/Plantilla
   Usado por Estudiantes, Docentes, Familias y Usuarios. */

(function () {
  function esc(v) { v = (v == null ? '' : String(v)); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function stringify(rows, cols) {
    const head = cols.map(c => esc(c.label || c.key)).join(',');
    const lines = (rows || []).map(r => cols.map(c => esc(c.get ? c.get(r) : r[c.key])).join(','));
    return '\ufeff' + [head, ...lines].join('\r\n');
  }
  function parse(text) {
    text = String(text || '').replace(/^\ufeff/, '');
    const rows = []; let row = [], field = '', i = 0, q = false;
    while (i < text.length) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else {
        if (c === '"') q = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (c === '\r') { /* skip */ }
        else field += c;
      }
      i++;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    const clean = rows.filter(r => r.some(c => String(c).trim() !== ''));
    if (!clean.length) return { headers: [], objects: [] };
    const headers = clean[0].map(h => h.trim());
    const objects = clean.slice(1).map(r => { const o = {}; headers.forEach((h, idx) => o[h] = (r[idx] != null ? String(r[idx]).trim() : '')); return o; });
    return { headers, objects };
  }
  function download(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function pick(cb) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.csv,text/csv';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => cb(String(r.result), f.name); r.readAsText(f); };
    inp.click();
  }
  window.CSV = { stringify, parse, download, pick, esc };
})();

/* Control de barra: dropdown con Exportar / Importar / Plantilla */
function CsvBar({ filename, columns, rows, onImport, entity = 'registros' }) {
  const [open, setOpen] = React.useState(false);
  const [preview, setPreview] = React.useState(null); // { headers, objects, name }
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    setTimeout(() => window.addEventListener('click', h), 0);
    return () => window.removeEventListener('click', h);
  }, [open]);

  const doExport = () => {
    setOpen(false);
    window.CSV.download(filename + '.csv', window.CSV.stringify(rows, columns));
    toast(rows.length + ' ' + entity + ' exportados ✓');
  };
  const doTemplate = () => {
    setOpen(false);
    window.CSV.download(filename + '-plantilla.csv', window.CSV.stringify([], columns));
    toast('Plantilla descargada ✓', 'info');
  };
  const doPick = () => {
    setOpen(false);
    window.CSV.pick((text, name) => {
      const { headers, objects } = window.CSV.parse(text);
      if (!objects.length) { toast('El archivo no contiene filas', 'warn'); return; }
      setPreview({ headers, objects, name });
    });
  };
  const apply = () => {
    try {
      const res = (onImport(preview.objects)) || {};
      const a = res.added || 0, u = res.updated || 0;
      toast('Importación: ' + a + ' nuevos · ' + u + ' actualizados ✓');
    } catch (e) { toast('Error al importar: ' + (e.message || e), 'warn'); }
    setPreview(null);
  };

  return (
    <React.Fragment>
      <div style={{ position: 'relative' }} ref={ref}>
        <button className="btn" onClick={() => setOpen(o => !o)}><Icon name="download" size={15} className="btn-ico" />CSV<Icon name="chevR" size={13} className={'nav-chev' + (open ? ' open' : '')} /></button>
        {open && (
          <div className="menu" style={{ right: 0, top: '110%', minWidth: 210 }}>
            <button onClick={doExport}><Icon name="download" size={15} />Exportar CSV ({rows.length})</button>
            <button onClick={doPick}><Icon name="inbox" size={15} />Importar CSV…</button>
            <button onClick={doTemplate}><Icon name="doc" size={15} />Descargar plantilla</button>
          </div>
        )}
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Importar CSV" width={560}
        footer={<><button className="btn" onClick={() => setPreview(null)}>Cancelar</button><button className="btn primary" onClick={apply}><Icon name="check" size={15} className="btn-ico" />Aplicar {preview ? preview.objects.length : 0} filas</button></>}>
        {preview && <>
          <div className="row center gap-10" style={{ marginBottom: 12 }}>
            <div className="kpi-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 38, height: 38, margin: 0 }}><Icon name="inbox" size={18} /></div>
            <div>
              <div style={{ fontWeight: 600 }}>{preview.name}</div>
              <div className="faint" style={{ fontSize: 12.5 }}>{preview.objects.length} filas · {preview.headers.length} columnas</div>
            </div>
          </div>
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>Las filas con <b>id</b> existente se actualizan; las demás se crean. Columnas detectadas:</div>
          <div className="row wrap gap-6" style={{ marginBottom: 14 }}>
            {preview.headers.map((h, i) => <span key={i} className="badge gray" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{h}</span>)}
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
            <table className="tbl" style={{ fontSize: 12 }}>
              <thead><tr>{preview.headers.slice(0, 5).map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
              <tbody>
                {preview.objects.slice(0, 5).map((o, i) => (
                  <tr key={i}>{preview.headers.slice(0, 5).map((h, j) => <td key={j} style={{ whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{o[h]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.objects.length > 5 && <div className="faint" style={{ fontSize: 11.5, marginTop: 6 }}>Mostrando 5 de {preview.objects.length} filas.</div>}
        </>}
      </Modal>
    </React.Fragment>
  );
}
window.CsvBar = CsvBar;
