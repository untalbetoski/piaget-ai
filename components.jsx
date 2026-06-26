/* components.jsx — primitivas UI + mini-kit de charts (SVG generado por datos) */

/* ---------- Avatar con iniciales ---------- */
const AVATAR_HUES = [262, 158, 300, 222, 78, 25, 200, 340];
function hueFor(seed) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return AVATAR_HUES[h % AVATAR_HUES.length];
}
function Avatar({ name, size = 34, className = '', img }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const h = hueFor(name);
  return (
    <div className={'avatar ' + className} style={{
      width: size, height: size, fontSize: size * 0.38,
      background: `linear-gradient(135deg, oklch(0.62 0.14 ${h}), oklch(0.55 0.16 ${h + 25}))`
    }}>{initials}</div>
  );
}

/* ---------- Badge ---------- */
function Badge({ tone = 'gray', dot = false, children }) {
  return <span className={'badge ' + tone}>{dot && <span className="bdot" />}{children}</span>;
}

/* ---------- Delta ---------- */
function Delta({ value, suffix = '%' }) {
  const up = value > 0, flat = value === 0;
  const cls = flat ? 'flat' : up ? 'up' : 'down';
  return (
    <span className={'delta ' + cls}>
      {!flat && <Icon name={up ? 'arrowUp' : 'arrowDown'} size={12} stroke={2.6} />}
      {up ? '+' : ''}{value}{suffix}
    </span>
  );
}

/* ---------- Progress bar ---------- */
function Bar({ value, color, height = 7 }) {
  return (
    <div className="bar-track" style={{ height }}>
      <div className="bar-fill" style={{ width: Math.min(100, value) + '%', background: color || 'var(--accent)' }} />
    </div>
  );
}

/* ---------- Card header ---------- */
function CardHead({ icon, title, sub, right }) {
  return (
    <div className="card-head">
      <div>
        <div className="card-title">{icon && <Icon name={icon} className="ico" size={17} />}{title}</div>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/* ====================================================================
   CHART KIT
   ==================================================================== */
const PALETTE = ['var(--accent)', 'var(--cyan)', 'var(--violet)', 'var(--green)', 'var(--amber)', 'var(--red)'];

/* ---------- Sparkline ---------- */
function Sparkline({ data, w = 110, h = 34, color = 'var(--accent)', fill = true }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => [i / (data.length - 1) * w, h - ((v - min) / rng) * (h - 4) - 2]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${w} ${h} L0 ${h} Z`;
  const gid = 'spk' + Math.random().toString(36).slice(2, 7);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.22" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={color} />
    </svg>
  );
}

/* ---------- Area / line chart with axis ---------- */
function AreaChart({ series, labels, height = 240, color = 'var(--accent)', color2, max: maxProp, money = false }) {
  const w = 760, h = height, padL = 44, padB = 26, padT = 12, padR = 8;
  const all = series.flatMap(s => s.data);
  const rawMax = maxProp || Math.max(...all) * 1.15;
  const max = rawMax > 0 ? rawMax : 1;
  const innerW = w - padL - padR, innerH = h - padB - padT;
  const x = i => padL + (i / (labels.length - 1)) * innerW;
  const y = v => padT + innerH - (v / max) * innerH;
  const colors = [color, color2 || 'var(--cyan)'];
  const ticks = 4;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = (max / ticks) * i; const yy = y(v);
        return <g key={i}>
          <line x1={padL} y1={yy} x2={w - padR} y2={yy} stroke="var(--border)" strokeWidth="1" />
          <text x={padL - 8} y={yy + 3.5} textAnchor="end" fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--text-faint)">
            {money ? fmtShort(v) : Math.round(v)}
          </text>
        </g>;
      })}
      {series.map((s, si) => {
        const c = s.color || colors[si];
        const line = s.data.map((v, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(v)).join(' ');
        const area = line + ` L${x(labels.length - 1)} ${padT + innerH} L${padL} ${padT + innerH} Z`;
        const gid = 'ar' + si + Math.random().toString(36).slice(2, 6);
        return <g key={si}>
          {s.fill !== false && <>
            <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity="0.18" />
              <stop offset="100%" stopColor={c} stopOpacity="0" />
            </linearGradient></defs>
            <path d={area} fill={`url(#${gid})`} />
          </>}
          <path d={line} fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={s.dashed ? '5 5' : 'none'} />
          {s.data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="2.4" fill="var(--surface)" stroke={c} strokeWidth="1.6" />)}
        </g>;
      })}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={h - 8} textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--text-faint)">{l}</text>
      ))}
    </svg>
  );
}

/* ---------- Bar chart (grouped/single) ---------- */
function BarChart({ data, labels, height = 220, colors, max: maxProp, money = false, stacked }) {
  const w = 760, h = height, padL = 44, padB = 26, padT = 12, padR = 8;
  const series = Array.isArray(data[0]) ? data : [data];
  const sums = labels.map((_, i) => series.reduce((a, s) => a + s[i], 0));
  const rawMax = maxProp || Math.max(...(stacked ? sums : series.flat())) * 1.15;
  const max = rawMax > 0 ? rawMax : 1;
  const innerW = w - padL - padR, innerH = h - padB - padT;
  const groupW = innerW / labels.length;
  const cs = colors || PALETTE;
  const ticks = 4;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = (max / ticks) * i; const yy = padT + innerH - (v / max) * innerH;
        return <g key={i}>
          <line x1={padL} y1={yy} x2={w - padR} y2={yy} stroke="var(--border)" strokeWidth="1" />
          <text x={padL - 8} y={yy + 3.5} textAnchor="end" fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--text-faint)">
            {money ? fmtShort(v) : Math.round(v)}
          </text>
        </g>;
      })}
      {labels.map((l, i) => {
        const gx = padL + i * groupW;
        if (stacked) {
          let acc = 0;
          return <g key={i}>
            {series.map((s, si) => {
              const bh = (s[i] / max) * innerH;
              const by = padT + innerH - acc - bh; acc += bh;
              const bw = groupW * 0.5;
              return <rect key={si} x={gx + (groupW - bw) / 2} y={by} width={bw} height={Math.max(0, bh)}
                rx="3" fill={cs[si % cs.length]} />;
            })}
            <text x={gx + groupW / 2} y={h - 8} textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--text-faint)">{l}</text>
          </g>;
        }
        const bw = (groupW * 0.62) / series.length;
        const start = gx + groupW * 0.19;
        return <g key={i}>
          {series.map((s, si) => {
            const bh = (s[i] / max) * innerH;
            return <rect key={si} x={start + si * bw} y={padT + innerH - bh} width={bw - 3} height={Math.max(0, bh)}
              rx="3" fill={cs[si % cs.length]} />;
          })}
          <text x={gx + groupW / 2} y={h - 8} textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--text-faint)">{l}</text>
        </g>;
      })}
    </svg>
  );
}

/* ---------- Donut / ring ---------- */
function Donut({ segments, size = 150, thickness = 18, center }) {
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + (Number(s.value) || 0), 0) || 1;
  let offset = 0;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * circ;
          const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
            strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} strokeLinecap="round" />;
          offset += len;
          return el;
        })}
      </svg>
      {center && <div className="ring-center">{center}</div>}
    </div>
  );
}

/* ---------- Gauge (semi-ring) ---------- */
function RingStat({ value, label, color = 'var(--accent)', size = 110, thickness = 11 }) {
  const r = (size - thickness) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const len = (value / 100) * circ;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={`${len} ${circ - len}`} strokeLinecap="round" />
      </svg>
      <div className="ring-center">
        <div className="font-display" style={{ fontSize: size * 0.24, fontWeight: 600, letterSpacing: '-0.02em' }}>{value}%</div>
        {label && <div className="faint" style={{ fontSize: 11 }}>{label}</div>}
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
function fmtShort(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k';
  return Math.round(n);
}
function fmtMoney(n) { return '$' + n.toLocaleString('es-MX'); }
function fmtNum(n) { return n.toLocaleString('es-MX'); }

window.SectionHead = function ({ eyebrow, title, children }) {
  return (
    <div style={{ margin: '34px 0 16px' }}>
      {eyebrow && <div className="eyebrow" style={{ marginBottom: 5 }}>{eyebrow}</div>}
      <div className="row between center">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
};

Object.assign(window, {
  Avatar, Badge, Delta, Bar, CardHead,
  Sparkline, AreaChart, BarChart, Donut, RingStat,
  fmtShort, fmtMoney, fmtNum, PALETTE,
});
