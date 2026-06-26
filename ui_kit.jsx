/* ui_kit.jsx — Modal, formularios, toasts, menú contextual */

function Modal({ open, title, onClose, children, footer, width }) {
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" style={width ? { width } : {}} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}
function TextInput(props) { return <input className="inp" {...props} />; }

/* ---------- Fechas en español <-> ISO ---------- */
const ES_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function esDateToISO(str) {
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const m = String(str).trim().toLowerCase().match(/^(\d{1,2})\s+([a-záé]+)\.?(?:\s+(\d{4}))?$/);
  if (!m) return '';
  const mi = ES_MONTHS.indexOf(m[2].slice(0, 3));
  if (mi < 0) return '';
  const year = m[3] || String(new Date().getFullYear());
  return `${year}-${String(mi + 1).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}`;
}
function isoToEsDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '';
  const [y, mo, d] = iso.split('-');
  return `${+d} ${ES_MONTHS[+mo - 1]} ${y}`;
}
/* Selector de fecha con calendario. value/onChange usan texto en español (ej. "26 ago 2025"). */
function DateInput({ value, onChange, ...props }) {
  return <input className="inp" type="date" value={esDateToISO(value)}
    onChange={e => onChange(isoToEsDate(e.target.value))} {...props} />;
}
function NumberInput(props) { return <input type="number" className="inp" {...props} />; }
function TextArea(props) { return <textarea className="inp" {...props} />; }
function SelectInput({ options, ...props }) {
  return <select className="inp" {...props}>{options.map(o => typeof o === 'string'
    ? <option key={o} value={o}>{o}</option>
    : <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}

/* ---------- Toaster ---------- */
let toastListeners = new Set();
let toastSeq = 0;
window.toast = function (msg, tone = 'ok') {
  const id = ++toastSeq;
  toastListeners.forEach(l => l({ id, msg, tone }));
};
function Toaster() {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    const fn = (t) => {
      setItems(x => [...x, t]);
      setTimeout(() => setItems(x => x.filter(i => i.id !== t.id)), 2600);
    };
    toastListeners.add(fn); return () => toastListeners.delete(fn);
  }, []);
  const ic = { ok: 'check', info: 'spark', warn: 'alert' };
  return (
    <div className="toaster">
      {items.map(t => (
        <div key={t.id} className={'toast ' + t.tone}>
          <span className="tico"><Icon name={ic[t.tone] || 'check'} size={12} stroke={3} /></span>{t.msg}
        </div>
      ))}
    </div>
  );
}

/* ---------- Menú contextual (acciones de fila) ---------- */
function RowMenu({ items }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    setTimeout(() => window.addEventListener('click', h), 0);
    return () => window.removeEventListener('click', h);
  }, [open]);
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setOpen(o => !o)}><Icon name="dots" size={16} /></button>
      {open && (
        <div className="menu" style={{ right: 0, top: 34 }}>
          {items.map((it, i) => (
            <button key={i} className={it.danger ? 'danger' : ''} onClick={() => { setOpen(false); it.onClick(); }}>
              <Icon name={it.icon} size={15} />{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Modal, Field, TextInput, NumberInput, TextArea, SelectInput, Toaster, RowMenu });
