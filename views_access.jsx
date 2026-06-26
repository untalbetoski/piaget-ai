/* views_access.jsx — Control de Accesos: Dashboard · Scanner QR · Cola · Historial */

function PageHead({ eyebrow, title, desc, children }) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow" style={{ marginBottom: 7 }}>{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        {desc && <p className="page-desc" dangerouslySetInnerHTML={{ __html: desc }} />}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
window.PageHead = PageHead;

function dirBadge(d) { return d === 'in' ? <Badge tone="green" dot>Entrada</Badge> : <Badge tone="gray" dot>Salida</Badge>; }
function accStatus(s) {
  if (s === 'ok') return <Badge tone="green">Autorizado</Badge>;
  if (s === 'pendiente') return <Badge tone="amber">Por validar</Badge>;
  return <Badge tone="red" dot>Revisar</Badge>;
}

/* AccessDashboard se redefine (versión enriquecida) en views_access_dashboard.jsx */

/* ---------- Scanner QR ---------- */
function ScannerQR({ go }) {
  const [scan, setScan] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const people = DB.students.concat([{ name: 'Laura Méndez', grade: 'Docente' }]);

  function doScan() {
    setScan('scanning');
    setTimeout(() => {
      const p = people[Math.floor(Math.random() * people.length)];
      const ok = Math.random() > 0.18;
      const rec = { name: p.name, grade: p.grade, ok, time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
      setScan(rec);
      setHistory(h => [rec, ...h].slice(0, 6));
      toast(ok ? 'Acceso autorizado: ' + p.name : 'Acceso denegado: ' + p.name, ok ? 'ok' : 'warn');
    }, 1300);
  }

  return (
    <div className="content-inner">
      <PageHead eyebrow="Control de Accesos" title="Scanner QR" desc="Valida el ingreso escaneando el código del carnet digital." />
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        {/* Scanner */}
        <div className="card pad" style={{ display: 'grid', placeItems: 'center', padding: 32 }}>
          <div style={{
            position: 'relative', width: 280, height: 280, borderRadius: 20,
            background: scan && scan.ok === false ? 'var(--red-soft)' : scan && scan.ok ? 'var(--green-soft)' : 'var(--surface-2)',
            border: '1px solid var(--border)', display: 'grid', placeItems: 'center', overflow: 'hidden',
            transition: 'background 0.3s'
          }}>
            {/* corner frames */}
            {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], i) => (
              <div key={i} style={{
                position: 'absolute', width: 38, height: 38,
                [y ? 'bottom' : 'top']: 18, [x ? 'right' : 'left']: 18,
                [y ? 'borderBottom' : 'borderTop']: '3px solid var(--accent)',
                [x ? 'borderRight' : 'borderLeft']: '3px solid var(--accent)',
                borderRadius: x && y ? '0 0 8px 0' : x ? '0 8px 0 0' : y ? '0 0 0 8px' : '8px 0 0 0'
              }} />
            ))}
            {!scan && <Icon name="qr" size={90} className="faint" stroke={1.3} />}
            {scan === 'scanning' && <div className="col center gap-12"><Icon name="scan" size={80} style={{ color: 'var(--accent)' }} stroke={1.4} /><div className="faint typing"><span /><span /><span /></div></div>}
            {scan && scan !== 'scanning' && (
              <div className="col center gap-8" style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: 999, display: 'grid', placeItems: 'center', background: scan.ok ? 'var(--green)' : 'var(--red)', color: '#fff' }}>
                  <Icon name={scan.ok ? 'check' : 'x'} size={36} stroke={3} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-display)' }}>{scan.ok ? 'Autorizado' : 'Denegado'}</div>
                <Avatar name={scan.name} size={40} />
                <div style={{ fontWeight: 600 }}>{scan.name}</div>
                <div className="faint" style={{ fontSize: 12.5 }}>{scan.grade} · {scan.time}</div>
              </div>
            )}
          </div>
          <button className="btn primary mt-24" style={{ height: 46, padding: '0 28px' }} onClick={doScan} disabled={scan === 'scanning'}>
            <Icon name="scan" size={18} className="btn-ico" />{scan === 'scanning' ? 'Escaneando…' : 'Simular escaneo'}
          </button>
          <div className="faint mt-12" style={{ fontSize: 12 }}>Cámara: <b style={{ color: 'var(--green)' }}>activa</b> · Puerta: Acceso Principal</div>
        </div>

        {/* Recientes */}
        <div className="card">
          <CardHead icon="clock" title="Escaneos recientes" sub="Sesión actual" />
          <div>
            {history.length === 0 && <div className="lrow faint" style={{ justifyContent: 'center', padding: 28, fontSize: 13 }}>Aún no hay escaneos en esta sesión</div>}
            {history.map((h, i) => (
              <div className="lrow" key={i}>
                <div className="insight-ico" style={{ background: h.ok ? 'var(--green-soft)' : 'var(--red-soft)', color: h.ok ? 'var(--green)' : 'var(--red)', width: 32, height: 32 }}>
                  <Icon name={h.ok ? 'check' : 'x'} size={16} stroke={2.6} />
                </div>
                <div className="grow"><div style={{ fontWeight: 600, fontSize: 13.5 }}>{h.name}</div><div className="faint" style={{ fontSize: 12 }}>{h.grade}</div></div>
                <span className="font-mono faint" style={{ fontSize: 11.5 }}>{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Cola de Espera ---------- */
function ColaEspera({ go }) {
  const store = useStore();
  const [queue, setQueue] = React.useState(DB.accessQueue.map((q, i) => ({ ...q, _k: i })));
  function resolve(k, ok) {
    const item = queue.find(q => q._k === k);
    setQueue(q => q.filter(x => x._k !== k));
    toast(ok ? 'Acceso autorizado: ' + item.name : 'Acceso rechazado: ' + item.name, ok ? 'ok' : 'warn');
  }
  return (
    <div className="content-inner">
      <PageHead eyebrow="Control de Accesos" title="Cola de Espera"
        desc={queue.length + ' personas esperando validación manual'}>
        <button className="btn" onClick={() => go('scanner-qr')}><Icon name="qr" size={15} className="btn-ico" />Scanner</button>
      </PageHead>

      {queue.length === 0 ? (
        <div className="card pad" style={{ display: 'grid', placeItems: 'center', padding: 60, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--green-soft)', color: 'var(--green)', display: 'grid', placeItems: 'center' }}><Icon name="check" size={28} stroke={2.6} /></div>
          <div style={{ fontWeight: 600, fontSize: 17, marginTop: 14 }}>Cola despejada</div>
          <div className="faint mt-4">No hay validaciones pendientes ahora mismo.</div>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {queue.map((q, i) => {
            const t = window.TONE[q.tone];
            return (
              <div className="card pad" key={q._k}>
                <div className="row between center">
                  <div className="row center gap-12">
                    <div style={{ position: 'relative' }}>
                      <Avatar name={q.name} size={44} />
                      <span style={{ position: 'absolute', top: -3, left: -3, width: 22, height: 22, borderRadius: 999, background: 'var(--accent)', color: 'var(--on-accent)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, border: '2px solid var(--surface)' }}>{i + 1}</span>
                    </div>
                    <div><div style={{ fontWeight: 600 }}>{q.name}</div><div className="faint" style={{ fontSize: 12.5 }}>{q.role} · {q.grade}</div></div>
                  </div>
                  <span className="row center gap-6 faint" style={{ fontSize: 11.5 }}><Icon name="clock" size={13} />{q.wait}</span>
                </div>
                <div className="mt-12" style={{ padding: '10px 12px', background: t.bg, color: t.c, borderRadius: 'var(--r-sm)', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="alert" size={15} />{q.motivo}
                </div>
                <div className="row gap-8 mt-12">
                  <button className="btn primary grow" style={{ justifyContent: 'center' }} onClick={() => resolve(q._k, true)}><Icon name="check" size={15} className="btn-ico" />Autorizar</button>
                  <button className="btn grow" style={{ justifyContent: 'center' }} onClick={() => resolve(q._k, false)}><Icon name="x" size={15} className="btn-ico" />Rechazar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Historial de Accesos ---------- */
function HistorialAccesos({ go }) {
  const rows = [];
  const base = DB.accessLive.concat(DB.accessLive.map(a => ({ ...a, dir: 'out', time: '14:' + (10 + Math.floor(Math.random() * 50)) })));
  const [filter, setFilter] = React.useState('Todos');
  const shown = filter === 'Todos' ? base : base.filter(a => filter === 'Entradas' ? a.dir === 'in' : a.dir === 'out');
  return (
    <div className="content-inner">
      <PageHead eyebrow="Control de Accesos" title="Historial de Accesos" desc="Bitácora completa de entradas y salidas del campus.">
        <button className="btn"><Icon name="download" size={15} className="btn-ico" />Exportar CSV</button>
      </PageHead>
      <div className="card">
        <CardHead icon="clock" title="Registros" sub="Hoy · 1,243 movimientos"
          right={<div className="seg">{['Todos', 'Entradas', 'Salidas'].map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div>} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Persona</th><th>Rol</th><th>Puerta</th><th>Método</th><th>Hora</th><th>Movimiento</th></tr></thead>
            <tbody>
              {shown.map((a, i) => (
                <tr key={i}>
                  <td><div className="person"><Avatar name={a.name} size={30} /><div className="pname">{a.name}</div></div></td>
                  <td className="muted">{a.role}</td>
                  <td>{a.gate}</td>
                  <td><span className="font-mono faint" style={{ fontSize: 12.5 }}>{a.method}</span></td>
                  <td className="font-mono" style={{ fontSize: 12.5 }}>{a.time}</td>
                  <td>{dirBadge(a.dir)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScannerQR, ColaEspera, HistorialAccesos });
