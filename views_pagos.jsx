/* views_pagos.jsx — Pagos en línea de la Tiendita (Stripe + PayPal)
   ─────────────────────────────────────────────────────────────
   Primitivas compartidas por el Punto de Venta y la Tienda en línea:
   · Configuración / conexión de pasarelas (modo prueba / producción)
   · Procesador de pago simulado con estados e IDs de transacción
   · Códigos QR y enlaces de cobro remoto
   · Registro de venta + conciliación automática en Cobros
   Es un PROTOTIPO: ningún cargo real se procesa.
   ───────────────────────────────────────────────────────────── */

/* ---------- Catálogo de pasarelas ---------- */
const GATEWAYS = {
  stripe: { id: 'stripe', label: 'Stripe', brand: '#635BFF', tone: 'violet', method: 'Stripe' },
  paypal: { id: 'paypal', label: 'PayPal', brand: '#0070E0', tone: 'cyan', method: 'PayPal' },
};

/* ---------- Configuración (localStorage) ---------- */
const PAY_CFG_KEY = 'piaget_pay_cfg_v1';
const PAY_DEFAULT = {
  stripe: { on: true, mode: 'test', pk: 'pk_test_51NfPiagetQ2a…7bXa', sk: 'sk_test_51NfPiaget9L…z4Qc', webhook: 'https://api.colegiopiaget.mx/hooks/stripe' },
  paypal: { on: true, mode: 'test', clientId: 'AeF1pi4g3t-Colegio…7bQ', secret: 'EL2k-piaget-secret…9xC', webhook: 'https://api.colegiopiaget.mx/hooks/paypal' },
  storeUrl: 'tienda.colegiopiaget.mx',
};
function getPayCfg() {
  try { const s = JSON.parse(localStorage.getItem(PAY_CFG_KEY) || 'null'); return s ? { ...PAY_DEFAULT, ...s, stripe: { ...PAY_DEFAULT.stripe, ...(s.stripe || {}) }, paypal: { ...PAY_DEFAULT.paypal, ...(s.paypal || {}) } } : { ...PAY_DEFAULT }; }
  catch (e) { return { ...PAY_DEFAULT }; }
}
function savePayCfg(cfg) { try { localStorage.setItem(PAY_CFG_KEY, JSON.stringify(cfg)); } catch (e) {} }
window.getPayCfg = getPayCfg;

/* ---------- Generadores de IDs ---------- */
const PAY_B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function payRand(n) { let s = ''; for (let i = 0; i < n; i++) s += PAY_B58[Math.floor(Math.random() * PAY_B58.length)]; return s; }
function payTxnId(gw) { return gw === 'paypal' ? ('8' + payRand(2).toUpperCase() + payRand(14).toUpperCase()) : ('pi_3' + payRand(21)); }
function payLinkCode() { return payRand(6).toUpperCase(); }
function payLinkUrl(code) { return getPayCfg().storeUrl + '/pay/' + code; }

/* ---------- Wordmarks ---------- */
function Wordmark({ gw, size = 15 }) {
  if (gw === 'paypal') {
    return <span style={{ fontWeight: 800, fontSize: size, letterSpacing: '-0.02em', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
      <span style={{ color: '#003087' }}>Pay</span><span style={{ color: '#0070E0' }}>Pal</span>
    </span>;
  }
  return <span style={{ fontWeight: 800, fontSize: size, letterSpacing: '-0.01em', color: '#635BFF', fontFamily: 'var(--font-display)' }}>stripe</span>;
}

/* ---------- QR determinista (solo cuadros) ---------- */
function payHash(s) { let h = 2166136261; for (let i = 0; i < (s || 'x').length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function QrBox({ value, size = 134, fg = '#0b0e14' }) {
  const N = 25, cell = size / N;
  let seed = payHash(value);
  const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
  const finder = (r, c) => {
    const inb = (R, C) => r >= R && r < R + 7 && c >= C && c < C + 7;
    return inb(0, 0) || inb(0, N - 7) || inb(N - 7, 0);
  };
  const dots = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (finder(r, c)) continue;
    if (rnd() > 0.52) dots.push(<rect key={r + '-' + c} x={c * cell} y={r * cell} width={cell} height={cell} fill={fg} />);
  }
  const Finder = ({ x, y }) => (
    <g transform={`translate(${x} ${y})`}>
      <rect width={cell * 7} height={cell * 7} fill={fg} />
      <rect x={cell} y={cell} width={cell * 5} height={cell * 5} fill="#fff" />
      <rect x={cell * 2} y={cell * 2} width={cell * 3} height={cell * 3} fill={fg} />
    </g>
  );
  return (
    <div style={{ background: '#fff', padding: 10, borderRadius: 12, border: '1px solid var(--border)', lineHeight: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {dots}
        <Finder x={0} y={0} /><Finder x={(N - 7) * cell} y={0} /><Finder x={0} y={(N - 7) * cell} />
      </svg>
    </div>
  );
}

/* ---------- Badge de modo ---------- */
function ModeBadge({ mode }) {
  return mode === 'test'
    ? <Badge tone="amber" dot>Modo prueba</Badge>
    : <Badge tone="green" dot>Producción</Badge>;
}

/* ====================================================================
   Registro de venta + conciliación en Cobros
   ==================================================================== */
function payNextTicket() {
  const max = (DB.ventas || []).reduce((m, v) => Math.max(m, Number((v.ticket || '').replace(/\D/g, '')) || 0), 20418);
  return 'V-' + (max + 1);
}
function payNextRecibo() {
  const max = (DB.cobros || []).reduce((m, c) => Math.max(m, Number((c.recibo || '').replace(/\D/g, '')) || 0), 4900);
  return 'REC-0' + (max + 1);
}
/* ---------- Alumnos (titular del cobro) ---------- */
/* Padrón agregado desde varias fuentes para tener un roster amplio y buscable */
function tienditaRoster() {
  const map = new Map();
  const put = (name, grade, family) => {
    if (!name || typeof name !== 'string') return;
    const n = name.trim(); if (!n) return;
    if (!map.has(n)) map.set(n, { name: n, grade: grade || '', family: family || ('Familia ' + n.split(' ').slice(-1)[0]) });
    else { const e = map.get(n); if (!e.grade && grade) e.grade = grade; }
  };
  (DB.students || []).forEach(s => put(s.name, s.grade, s.family));
  (DB.matriculas || []).forEach(m => put(m.student, m.grade));
  (DB.cobros || []).forEach(c => put(c.student, c.group || c.nivel, c.family));
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
function tienditaStudents() { return tienditaRoster().map(s => s.name); }
function tienditaStudentRec(name) { return tienditaRoster().find(s => s.name === name) || null; }
function tienditaFamilyOf(name) {
  if (!name) return null;
  const s = tienditaStudentRec(name);
  return (s && s.family) ? s.family : ('Familia ' + name.split(' ').slice(-1)[0]);
}
window.tienditaStudents = tienditaStudents;
window.tienditaFamilyOf = tienditaFamilyOf;

/* ---------- Buscador de alumno (combobox) ---------- */
function StudentPicker({ value, onChange, allowGeneral, placeholder }) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('click', h); return () => window.removeEventListener('click', h);
  }, []);
  const roster = tienditaRoster();
  const needle = q.trim().toLowerCase();
  const list = (needle ? roster.filter(s => s.name.toLowerCase().includes(needle) || (s.grade || '').toLowerCase().includes(needle)) : roster).slice(0, 80);
  const label = value && value !== 'Público general' ? value : (value === 'Público general' ? 'Público general' : '');
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <Icon name="search" size={14} style={{ position: 'absolute', left: 11, top: 13, color: 'var(--text-faint)', pointerEvents: 'none', zIndex: 1 }} />
      <input className="inp" value={open ? q : label} onChange={e => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => { setQ(''); setOpen(true); }} placeholder={placeholder || 'Buscar alumno por nombre o grupo…'} style={{ paddingLeft: 32, paddingRight: value ? 32 : 12 }} />
      {value && !open && <button className="icon-btn" style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 26, height: 26 }} onClick={() => onChange('')}><Icon name="x" size={13} /></button>}
      {open && (
        <div className="menu" style={{ position: 'static', left: 'auto', right: 'auto', top: 'auto', marginTop: 6, width: '100%', maxHeight: 240, overflowY: 'auto', minWidth: 0, boxShadow: 'none', border: '1px solid var(--border)' }}>
          {allowGeneral && (
            <button onClick={() => { onChange('Público general'); setOpen(false); }}>
              <Icon name="users" size={15} /><span className="grow">Público general</span>
            </button>
          )}
          {list.length === 0 && <div className="faint" style={{ padding: '10px 12px', fontSize: 12.5 }}>Sin coincidencias para «{q}»</div>}
          {list.map(s => (
            <button key={s.name} onClick={() => { onChange(s.name); setOpen(false); }}>
              <span className="grow" style={{ fontWeight: value === s.name ? 600 : 400 }}>{s.name}</span>
              {s.grade ? <span className="faint font-mono" style={{ fontSize: 11.5 }}>{s.grade}</span> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
window.StudentPicker = StudentPicker;

/* ---------- Impresión de ticket (ventana aislada, confiable) ---------- */
function printTicket(sale) {
  if (!sale) return;
  const money = n => '$' + Number(n || 0).toLocaleString('es-MX');
  const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const who = sale.student || sale.family;
  const rows = (sale.lines || []).map(l => `<div class="r"><span>${l.q} × ${esc(l.name)}</span><span>${money(l.q * l.price)}</span></div>`).join('');
  const html = '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>' + esc(sale.ticket) + '</title>'
    + '<style>@page{size:76mm auto;margin:0}*{box-sizing:border-box}'
    + 'body{margin:0;padding:6mm 5mm;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:12px;line-height:1.5;color:#000;background:#fff;width:76mm}'
    + '.c{text-align:center}.b{font-weight:700}.big{font-size:14px;letter-spacing:1px}.mut{color:#555;font-size:10.5px}'
    + '.sep{border-top:1px dashed #999;margin:7px 0}.r{display:flex;justify-content:space-between;gap:10px}'
    + '.tot{font-weight:700;font-size:15px}</style></head><body>'
    + '<div class="c"><div class="b big">TIENDITA ESCOLAR</div><div class="mut">Colegio Piaget · ' + esc(sale.cashier) + '</div>'
    + '<div class="mut">' + esc(sale.ticket) + ' · ' + esc(sale.date) + ' ' + esc(sale.time) + '</div></div>'
    + '<div class="sep"></div>' + rows + '<div class="sep"></div>'
    + '<div class="r tot"><span>TOTAL</span><span>' + money(sale.total) + '</span></div>'
    + '<div class="r"><span>Pago</span><span>' + esc(sale.method) + (who ? ' · ' + esc(who) : '') + '</span></div>'
    + (sale.grade ? '<div class="r"><span>Grupo</span><span>' + esc(sale.grade) + '</span></div>' : '')
    + (sale.txn ? '<div class="r"><span>Ref.</span><span style="font-size:10px">' + esc(sale.txn) + '</span></div>' : '')
    + (sale.cash != null ? '<div class="r"><span>Recibido</span><span>' + money(sale.cash) + '</span></div>' : '')
    + (sale.change != null && sale.change > 0 ? '<div class="r"><span>Cambio</span><span>' + money(sale.change) + '</span></div>' : '')
    + '<div class="sep"></div><div class="c mut">¡Gracias por su compra!</div>'
    + '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.focus();window.print();},120)}</scr' + 'ipt>'
    + '</body></html>';
  const ifr = document.createElement('iframe');
  ifr.setAttribute('aria-hidden', 'true');
  ifr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(ifr);
  const doc = ifr.contentWindow.document;
  doc.open(); doc.write(html); doc.close();
  setTimeout(() => { try { ifr.remove(); } catch (e) {} }, 8000);
}
window.printTicket = printTicket;

/* opts: { lines:[{_id,name,q,price}], total, items, gw, txn, student, source, cashier } */
function tienditaRecordSale(opts) {
  const now = new Date();
  const items = opts.items != null ? opts.items : opts.lines.reduce((a, l) => a + l.q, 0);
  (opts.lines || []).forEach(l => {
    const p = (DB.products || []).find(pp => pp._id === l._id);
    if (p) Store.update('products', p._id, { stock: Math.max(0, (Number(p.stock) || 0) - l.q) });
  });
  const gw = GATEWAYS[opts.gw];
  const studentName = opts.student || opts.buyer || null;
  const srec = studentName ? tienditaStudentRec(studentName) : null;
  const fam = studentName ? tienditaFamilyOf(studentName) : null;
  const sale = {
    ticket: payNextTicket(),
    date: now.toISOString().slice(0, 10),
    time: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    cashier: opts.cashier || (gw ? gw.label + ' · en línea' : 'En línea'),
    method: gw ? gw.method : (opts.method || 'En línea'),
    gateway: opts.gw || null, txn: opts.txn || null, source: opts.source || 'En línea',
    items, total: opts.total, cash: null, change: null,
    student: studentName, family: fam, grade: srec ? srec.grade : null,
    lines: (opts.lines || []).map(l => ({ name: l.name, q: l.q, price: l.price })),
  };
  Store.add('ventas', sale);
  /* conciliación automática: el pago en línea ya está confirmado por la pasarela */
  Store.add('cobros', {
    recibo: payNextRecibo(),
    student: studentName || 'Público general', family: fam || 'Público general',
    group: srec ? srec.grade : '', saleTicket: sale.ticket,
    concept: 'Tiendita en línea · ' + sale.ticket + ' (' + items + ' art.)',
    amount: opts.total, channel: gw ? gw.label : 'Pago en línea',
    ref: opts.txn || sale.ticket, folio: '',
    date: sale.date, time: sale.time, status: 'conciliado',
  });
  Store.log('Tiendita', 'recibió un pago en línea de ' + fmtMoney(opts.total) + (studentName ? ' de ' + studentName : '') + ' vía ' + (gw ? gw.label : 'enlace'), 'wallet');
  return sale;
}
window.tienditaRecordSale = tienditaRecordSale;

/* ====================================================================
   Procesador de pago (simulado)
   gw: 'stripe' | 'paypal' ; onApproved(txn) ; amount ; buyer
   ==================================================================== */
function GatewayProcessor({ gw, amount, buyer, onApproved, compact }) {
  const cfg = getPayCfg()[gw] || {};
  const meta = GATEWAYS[gw];
  const [phase, setPhase] = React.useState('idle'); // idle | processing | done
  const [card, setCard] = React.useState('');
  const [exp, setExp] = React.useState('');
  const [cvc, setCvc] = React.useState('');

  function pay() {
    if (gw === 'stripe') {
      const digits = card.replace(/\s/g, '');
      if (digits.length < 15) { toast('Captura un número de tarjeta válido', 'warn'); return; }
      if (!exp.trim() || cvc.replace(/\D/g, '').length < 3) { toast('Completa vencimiento y CVC', 'warn'); return; }
    }
    setPhase('processing');
    setTimeout(() => {
      setPhase('done');
      const txn = payTxnId(gw);
      setTimeout(() => onApproved({ txn, gw, last4: card.replace(/\s/g, '').slice(-4) }), 650);
    }, 1700);
  }

  if (phase !== 'idle') {
    return (
      <div className="col center gap-12" style={{ padding: '26px 16px', textAlign: 'center' }}>
        {phase === 'processing'
          ? <><div className="pay-spin" /><div style={{ fontWeight: 600, fontSize: 14 }}>Contactando con {meta.label}…</div><div className="faint" style={{ fontSize: 12.5 }}>Autorizando el cargo de forma segura</div></>
          : <><div className="kpi-ico" style={{ background: 'var(--green-soft)', color: 'var(--green)', width: 44, height: 44, marginBottom: 0 }}><Icon name="check" size={24} stroke={2.5} /></div><div style={{ fontWeight: 700, fontSize: 15 }}>Pago aprobado</div><div className="faint" style={{ fontSize: 12.5 }}>{meta.label} confirmó {fmtMoney(amount)}</div></>}
      </div>
    );
  }

  return (
    <div className="col gap-12">
      <div className="row between center" style={{ padding: '11px 13px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
        <div className="row center gap-9"><Wordmark gw={gw} /><span className="faint" style={{ fontSize: 12 }}>Checkout</span></div>
        <ModeBadge mode={cfg.mode} />
      </div>

      {gw === 'stripe' ? (
        <>
          <Field label="Número de tarjeta">
            <div style={{ position: 'relative' }}>
              <input className="inp" value={card} inputMode="numeric"
                onChange={e => setCard(e.target.value.replace(/[^\d]/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())}
                placeholder="4242 4242 4242 4242" />
              <Icon name="card" size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            </div>
          </Field>
          <div className="field-row">
            <Field label="Vencimiento"><input className="inp" value={exp} onChange={e => setExp(e.target.value.replace(/[^\d]/g, '').slice(0, 4).replace(/(.{2})(.+)/, '$1/$2'))} placeholder="MM/AA" /></Field>
            <Field label="CVC"><input className="inp" value={cvc} onChange={e => setCvc(e.target.value.replace(/[^\d]/g, '').slice(0, 4))} placeholder="123" /></Field>
          </div>
          <button className="pay-gw-btn" style={{ background: meta.brand, color: '#fff' }} onClick={pay}>
            <Icon name="lock" size={15} />Pagar {fmtMoney(amount)}
          </button>
          <div className="row center gap-6 faint" style={{ fontSize: 11, justifyContent: 'center' }}><Icon name="lock" size={12} />Pago cifrado · Tarjeta de prueba 4242 4242 4242 4242</div>
        </>
      ) : (
        <>
          <div className="col center gap-4" style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', textAlign: 'center' }}>
            <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.45 }}>Serás redirigido a PayPal para autorizar el pago de <b style={{ color: 'var(--text)' }}>{fmtMoney(amount)}</b>{buyer ? ' de ' + buyer : ''}.</div>
          </div>
          <button className="pay-gw-btn" style={{ background: '#FFC439', color: '#003087' }} onClick={pay}>
            <Wordmark gw="paypal" size={16} />
          </button>
          <button className="pay-gw-btn" style={{ background: '#000', color: '#fff', height: 42 }} onClick={pay}>
            <span style={{ fontStyle: 'italic', fontWeight: 800 }}><span style={{ color: '#fff' }}>Pay</span><span style={{ color: '#98c9ff' }}>Pal</span></span><span style={{ fontWeight: 600 }}>Crédito</span>
          </button>
        </>
      )}
    </div>
  );
}
window.GatewayProcessor = GatewayProcessor;

/* ---------- Selector de pasarela (chips) ---------- */
function GatewayPicker({ value, onChange }) {
  const cfg = getPayCfg();
  return (
    <div className="row gap-8">
      {Object.values(GATEWAYS).map(g => {
        const on = cfg[g.id] && cfg[g.id].on;
        return (
          <button key={g.id} className={'pay-method-tile' + (value === g.id ? ' sel' : '')} disabled={!on}
            onClick={() => on && onChange(g.id)} style={{ flex: 1, alignItems: 'center', flexDirection: 'row', gap: 10, opacity: on ? 1 : 0.5 }}>
            <Wordmark gw={g.id} size={15} />
            {value === g.id && <Icon name="check" size={15} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
          </button>
        );
      })}
    </div>
  );
}
window.GatewayPicker = GatewayPicker;

/* ====================================================================
   Modal de conexión / credenciales
   ==================================================================== */
function SecretField({ label, value }) {
  const [show, setShow] = React.useState(false);
  return (
    <Field label={label}>
      <div style={{ position: 'relative' }}>
        <input className="inp font-mono" readOnly value={show ? value : value.replace(/.(?=.{4})/g, '•')} style={{ fontSize: 12, paddingRight: 64 }} />
        <button className="chip-btn plain" style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', padding: '3px 8px', fontSize: 11 }} onClick={() => setShow(s => !s)}>{show ? 'Ocultar' : 'Mostrar'}</button>
      </div>
    </Field>
  );
}
function PayConnectionModal({ open, onClose, cfg, onChange }) {
  const [draft, setDraft] = React.useState(cfg);
  React.useEffect(() => { if (open) setDraft(cfg); }, [open]);
  if (!open) return null;
  const setGw = (gw, patch) => setDraft(d => ({ ...d, [gw]: { ...d[gw], ...patch } }));
  function copy(v) { navigator.clipboard && navigator.clipboard.writeText(v); toast('Copiado al portapapeles ✓'); }
  function save() { savePayCfg(draft); onChange(draft); toast('Conexión de pagos guardada ✓'); onClose(); }

  const Card = ({ gw }) => {
    const g = GATEWAYS[gw], c = draft[gw];
    return (
      <div className="card pad col gap-12" style={{ borderColor: c.on ? g.brand : 'var(--border)' }}>
        <div className="row between center">
          <div className="row center gap-10"><Wordmark gw={gw} size={17} />{c.on ? <Badge tone="green" dot>Conectado</Badge> : <Badge tone="gray" dot>Desconectado</Badge>}</div>
          <PosToggle on={c.on} onClick={() => setGw(gw, { on: !c.on })} />
        </div>
        {c.on && <>
          <Field label="Entorno">
            <div className="seg" style={{ width: '100%', display: 'flex' }}>
              {['test', 'live'].map(m => <button key={m} className={c.mode === m ? 'active' : ''} style={{ flex: 1 }} onClick={() => setGw(gw, { mode: m })}>{m === 'test' ? 'Prueba' : 'Producción'}</button>)}
            </div>
          </Field>
          {gw === 'stripe'
            ? <><SecretField label="Clave publicable" value={c.pk} /><SecretField label="Clave secreta" value={c.sk} /></>
            : <><SecretField label="Client ID" value={c.clientId} /><SecretField label="Secret" value={c.secret} /></>}
          <Field label="Webhook / IPN">
            <div style={{ position: 'relative' }}>
              <input className="inp font-mono" readOnly value={c.webhook} style={{ fontSize: 11.5, paddingRight: 38 }} />
              <button className="icon-btn" style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28 }} onClick={() => copy(c.webhook)}><Icon name="copy" size={14} /></button>
            </div>
          </Field>
        </>}
      </div>
    );
  };

  return (
    <Modal open={open} width={620} onClose={onClose} title="Conexión de pagos en línea"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar conexión</button></>}>
      <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 14 }}>Conecta Stripe y PayPal para cobrar en línea desde la caja, por enlace de pago o en la tienda autoservicio. Las llaves de <b>prueba</b> no generan cargos reales.</div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <Card gw="stripe" /><Card gw="paypal" />
      </div>
      <Field label="Dominio de la tienda en línea" >
        <input className="inp" value={draft.storeUrl} onChange={e => setDraft({ ...draft, storeUrl: e.target.value })} placeholder="tienda.colegiopiaget.mx" />
      </Field>
    </Modal>
  );
}
window.PayConnectionModal = PayConnectionModal;

/* ====================================================================
   Compartir enlace de pago (cobro remoto)
   ==================================================================== */
function PayShareModal({ order, onClose, onPaid }) {
  if (!order) return null;
  const url = payLinkUrl(order.code);
  const gw = GATEWAYS[order.gw];
  function copy() { navigator.clipboard && navigator.clipboard.writeText('https://' + url); toast('Enlace copiado ✓'); }
  function simulate() {
    const sale = tienditaRecordSale({ lines: order.lines, total: order.total, items: order.items, gw: order.gw, txn: payTxnId(order.gw), student: order.student, source: 'Enlace de pago', cashier: 'Enlace · ' + gw.label });
    Store.update('onlineOrders', order._id, { status: 'pagado', txn: sale.txn });
    toast('Pago recibido de ' + (order.student || 'alumno') + ' ✓');
    onPaid && onPaid(sale);
    onClose();
  }
  return (
    <Modal open={!!order} width={440} onClose={onClose} title="Enlace de cobro"
      footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={simulate}><Icon name="check" size={15} className="btn-ico" />Simular pago del alumno</button></>}>
      <div className="col center gap-12" style={{ textAlign: 'center', marginBottom: 6 }}>
        <QrBox value={url} size={150} />
        <div className="row center gap-8"><Wordmark gw={order.gw} size={14} /><Badge tone={gw.tone}>{fmtMoney(order.total)}</Badge></div>
        <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.45 }}>Comparte este enlace o QR con {order.student ? <b>{order.student}</b> : 'el alumno'}. Al pagar, la venta se concilia sola en <b>Cobros</b>.</div>
      </div>
      <div className="pay-url" style={{ width: '100%' }}>
        <Icon name="link" size={13} />
        <span className="grow nowrap" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</span>
        <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={copy}><Icon name="copy" size={13} /></button>
      </div>
      <div className="row gap-8 mt-12">
        <button className="btn sm grow" style={{ justifyContent: 'center' }} onClick={() => toast('Enlace enviado por WhatsApp ✓')}><Icon name="message" size={13} className="btn-ico" />WhatsApp</button>
        <button className="btn sm grow" style={{ justifyContent: 'center' }} onClick={() => toast('Enlace enviado por correo ✓')}><Icon name="mail" size={13} className="btn-ico" />Correo</button>
      </div>
    </Modal>
  );
}
window.PayShareModal = PayShareModal;

/* ====================================================================
   Tarjeta "Pagos en línea pendientes" para el POS
   ==================================================================== */
function OnlinePaymentsCard({ onShare }) {
  const store = useStore();
  const pend = (DB.onlineOrders || []).filter(o => o.status === 'pendiente');
  if (pend.length === 0) return null;
  return (
    <div className="card mt-16">
      <CardHead icon="link" title="Cobros en línea pendientes" sub={pend.length + ' enlaces esperando pago'} right={<Badge tone="amber" dot>{fmtMoney(pend.reduce((a, o) => a + o.total, 0))}</Badge>} />
      <div>
        {pend.map(o => (
          <div className="lrow" key={o._id}>
            <div className="kpi-ico" style={{ background: GATEWAYS[o.gw] ? window.TONE[GATEWAYS[o.gw].tone].bg : 'var(--surface-3)', color: GATEWAYS[o.gw] ? window.TONE[GATEWAYS[o.gw].tone].c : 'var(--text-faint)', marginBottom: 0, width: 36, height: 36 }}><Icon name="link" size={16} /></div>
            <div className="grow" style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{o.student || 'Sin alumno'} <span className="faint font-mono" style={{ fontWeight: 400, fontSize: 11 }}>· {o.code}</span></div>
              <div className="faint" style={{ fontSize: 12 }}>{o.items} art. · {GATEWAYS[o.gw] ? GATEWAYS[o.gw].label : 'En línea'} · {o.date} {o.time}</div>
            </div>
            <span className="tnum" style={{ fontWeight: 600, marginRight: 4 }}>{fmtMoney(o.total)}</span>
            <button className="btn sm" onClick={() => onShare(o)}><Icon name="external" size={13} className="btn-ico" />Ver enlace</button>
            <button className="icon-btn" style={{ width: 30, height: 30 }} title="Cancelar enlace" onClick={() => { Store.remove('onlineOrders', o._id); toast('Enlace cancelado', 'warn'); }}><Icon name="trash" size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
window.OnlinePaymentsCard = OnlinePaymentsCard;

/* ---------- Crear orden de enlace de cobro (pendiente) ---------- */
function payNewLinkOrder({ lines, total, items, gw, student }) {
  const now = new Date();
  return Store.add('onlineOrders', {
    code: payLinkCode(), gw, student: student || '', status: 'pendiente', source: 'Enlace de pago',
    items, total, lines: (lines || []).map(l => ({ _id: l._id, name: l.name, q: l.q, price: l.price })),
    date: now.toISOString().slice(0, 10), time: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
  });
}
window.payNewLinkOrder = payNewLinkOrder;
