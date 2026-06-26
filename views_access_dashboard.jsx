/* views_access_dashboard.jsx — Dashboard de Accesos (versión en vivo)
   Presencia por nivel · ocupación por área · visitantes · incidentes ·
   salidas/recogidas · retardos · feed en tiempo real (simulado) e interactivo. */

/* ---------- helpers ---------- */
const ACC_DIR = d => d === 'in'
  ? <Badge tone="green" dot>Entrada</Badge>
  : <Badge tone="gray" dot>Salida</Badge>;
const ACC_STATUS = s => s === 'ok'
  ? <Badge tone="green">Autorizado</Badge>
  : s === 'pendiente'
    ? <Badge tone="amber">Por validar</Badge>
    : <Badge tone="red" dot>Revisar</Badge>;
const SEV_TONE = { alta: 'red', media: 'amber', baja: 'gray' };
const accRand = arr => arr[Math.floor(Math.random() * arr.length)];
const accClock = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

/* Número con animación de conteo */
function AnimNum({ value, fmt }) {
  const [disp, setDisp] = React.useState(value);
  const ref = React.useRef(value);
  React.useEffect(() => {
    const from = ref.current, to = value; ref.current = value;
    if (from === to) { setDisp(to); return; }
    const start = performance.now(), dur = 600;
    let raf;
    const tick = t => {
      const k = Math.min(1, (t - start) / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setDisp(Math.round(from + (to - from) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{fmt ? fmt(disp) : disp}</span>;
}

/* ---------- Modal: detalle de persona ---------- */
function AccessPersonModal({ rec, onClose, onExit, onReport }) {
  const moves = [
    { t: rec.time, dir: rec.dir, gate: rec.gate, method: rec.method },
    { t: '07:02', dir: 'in', gate: 'Acceso Principal', method: 'QR' },
    { t: 'Ayer 15:10', dir: 'out', gate: 'Acceso Principal', method: 'QR' },
  ];
  return (
    <Modal open width={460} onClose={onClose} title="Detalle de acceso"
      footer={<><button className="btn" onClick={() => { onReport(rec); onClose(); }}><Icon name="alert" size={15} className="btn-ico" />Reportar</button><button className="btn primary" onClick={() => { onExit(rec); onClose(); }}><Icon name="logout" size={15} className="btn-ico" />Marcar salida</button></>}>
      <div className="row center gap-12">
        <Avatar name={rec.name} size={48} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{rec.name}</div>
          <div className="faint" style={{ fontSize: 12.5 }}>{rec.role} · {rec.grade}</div>
        </div>
        <span style={{ marginLeft: 'auto' }}>{ACC_STATUS(rec.status)}</span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="kv"><span className="k">Puerta</span><span className="v">{rec.gate}</span></div>
        <div className="kv"><span className="k">Método</span><span className="v">{rec.method}</span></div>
        <div className="kv"><span className="k">Hora</span><span className="v">{rec.time}</span></div>
        <div className="kv"><span className="k">Movimiento</span><span className="v">{rec.dir === 'in' ? 'Entrada' : 'Salida'}</span></div>
      </div>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Movimientos recientes</div>
        <div className="card" style={{ boxShadow: 'none' }}>
          {moves.map((m, i) => (
            <div className="acc-mini" key={i}>
              <div className="acc-ico" style={{ background: m.dir === 'in' ? 'var(--green-soft)' : 'var(--surface-3)', color: m.dir === 'in' ? 'var(--green)' : 'var(--text-muted)', width: 30, height: 30 }}>
                <Icon name={m.dir === 'in' ? 'arrowDown' : 'arrowUp'} size={15} />
              </div>
              <div className="grow" style={{ fontSize: 13 }}>{m.gate}<span className="faint"> · {m.method}</span></div>
              <span className="font-mono faint" style={{ fontSize: 12 }}>{m.t}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Modal: incidente ---------- */
function AccessIncidentModal({ inc, onClose, onResolve }) {
  return (
    <Modal open width={440} onClose={onClose} title="Incidente de acceso"
      footer={<><button className="btn" onClick={onClose}>Cerrar</button>{inc.status !== 'Atendido' && <button className="btn primary" onClick={() => { onResolve(inc); onClose(); }}><Icon name="check" size={15} className="btn-ico" />Marcar atendido</button>}</>}>
      <div className="row center gap-12">
        <div className="acc-ico" style={{ background: `var(--${SEV_TONE[inc.sev]}-soft)`, color: `var(--${SEV_TONE[inc.sev]})`, width: 40, height: 40 }}><Icon name="alert" size={18} /></div>
        <div><div style={{ fontWeight: 700, fontSize: 15 }}>{inc.title}</div><div className="faint" style={{ fontSize: 12.5 }}>{inc.gate} · {inc.time}</div></div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="kv"><span className="k">Persona</span><span className="v">{inc.person}</span></div>
        <div className="kv"><span className="k">Severidad</span><span className="v" style={{ textTransform: 'capitalize' }}>{inc.sev}</span></div>
        <div className="kv"><span className="k">Estatus</span><span className="v">{inc.status}</span></div>
        <div className="kv"><span className="k">Puerta</span><span className="v">{inc.gate}</span></div>
      </div>
    </Modal>
  );
}

/* ============ DASHBOARD ============ */
function AccessDashboard({ go }) {
  const hours = ['6a', '7a', '8a', '9a', '10a', '12p', '2p', '4p', '6p'];
  const flow = window.PIAGET_FRESH ? hours.map(() => 0) : [40, 320, 510, 180, 70, 90, 140, 380, 210];
  const gates = window.PIAGET_FRESH ? [
    { gate: 'Acceso Principal', n: 0, pct: 0, color: 'var(--accent)' },
    { gate: 'Acceso Personal', n: 0, pct: 0, color: 'var(--cyan)' },
    { gate: 'Recepción / Visitas', n: 0, pct: 0, color: 'var(--violet)' },
    { gate: 'Acceso Vehicular', n: 0, pct: 0, color: 'var(--amber)' },
  ] : [
    { gate: 'Acceso Principal', n: 842, pct: 68, color: 'var(--accent)' },
    { gate: 'Acceso Personal', n: 286, pct: 23, color: 'var(--cyan)' },
    { gate: 'Recepción / Visitas', n: 74, pct: 6, color: 'var(--violet)' },
    { gate: 'Acceso Vehicular', n: 41, pct: 3, color: 'var(--amber)' },
  ];

  const [inside, setInside] = React.useState(window.PIAGET_FRESH ? 0 : 1176);
  const [entradas, setEntradas] = React.useState(window.PIAGET_FRESH ? 0 : 1243);
  const [retardos, setRetardos] = React.useState(window.PIAGET_FRESH ? 0 : 23);
  const [feed, setFeed] = React.useState(() => DB.accessLive.map((a, i) => ({ ...a, _id: i })));
  const [late, setLate] = React.useState(() => DB.accessLate.map(x => ({ ...x })));
  const [visitors, setVisitors] = React.useState(() => DB.accessVisitors.map(v => ({ ...v })));
  const [incidents, setIncidents] = React.useState(() => DB.accessIncidents.map(x => ({ ...x })));
  const [earlyExits, setEarlyExits] = React.useState(() => DB.accessEarlyExits.map(x => ({ ...x })));
  const [pickups, setPickups] = React.useState(() => DB.accessPickups.map(x => ({ ...x })));
  const [live, setLive] = React.useState(true);
  const [person, setPerson] = React.useState(null);
  const [incident, setIncident] = React.useState(null);
  const feedId = React.useRef(1000);

  const incidentsOpen = incidents.filter(i => i.status !== 'Atendido').length;

  /* Simulación en vivo */
  React.useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      const p = accRand(DB.accessPool);
      const dir = Math.random() < 0.72 ? 'in' : 'out';
      const gate = accRand(['Acceso Principal', 'Acceso Personal', 'Recepción', 'Acceso Vehicular']);
      const method = p.role === 'Visitante' ? 'Manual' : (Math.random() < 0.9 ? 'QR' : 'Manual');
      const status = Math.random() < 0.09 ? (Math.random() < 0.5 ? 'pendiente' : 'alerta') : 'ok';
      const ev = { _id: ++feedId.current, name: p.name, role: p.role, grade: p.grade, gate, dir, method, status, time: accClock(), _new: true };
      setFeed(f => [ev, ...f.map(x => ({ ...x, _new: false }))].slice(0, 14));
      setInside(n => Math.max(0, n + (dir === 'in' ? 1 : -1)));
      if (dir === 'in') setEntradas(n => n + 1);
      if (dir === 'in' && status === 'ok' && Math.random() < 0.16) {
        setRetardos(n => n + 1);
        setLate(l => [{ name: p.name, grade: p.grade, min: 1 + Math.floor(Math.random() * 22), time: ev.time }, ...l].slice(0, 8));
      }
    }, 3500);
    return () => clearInterval(id);
  }, [live]);

  /* acciones */
  const pushExit = rec => {
    const ev = { _id: ++feedId.current, name: rec.name, role: rec.role || 'Visitante', grade: rec.grade || '—', gate: rec.gate || 'Recepción', dir: 'out', method: rec.method || 'Manual', status: 'ok', time: accClock(), _new: true };
    setFeed(f => [ev, ...f.map(x => ({ ...x, _new: false }))].slice(0, 14));
    setInside(n => Math.max(0, n - 1));
  };
  const checkoutVisitor = v => { setVisitors(vs => vs.filter(x => x.badge !== v.badge)); pushExit({ name: v.name, role: 'Visitante', grade: v.reason }); toast('Visita registrada como salida: ' + v.name, 'ok'); };
  const resolveIncident = inc => { setIncidents(is => is.map(x => x === inc ? { ...x, status: 'Atendido' } : x)); toast('Incidente marcado como atendido ✓'); };
  const authorizeExit = i => { setEarlyExits(es => es.map((x, j) => j === i ? { ...x, status: 'Autorizada' } : x)); toast('Salida autorizada ✓'); };
  const completePickup = i => { const pk = pickups[i]; setPickups(ps => ps.filter((_, j) => j !== i)); pushExit({ name: pk.name, role: 'Estudiante', grade: pk.grade }); toast(pk.name + ' entregado(a) a ' + pk.tutor + ' ✓'); };

  return (
    <div className="content-inner">
      <PageHead eyebrow="Control de Accesos" title="Dashboard de Accesos"
        desc={'<b style="color:var(--text)">' + inside.toLocaleString('es-MX') + '</b> dentro del campus · ' + DB.accessQueue.length + ' en cola · ' + incidentsOpen + ' incidentes abiertos'}>
        <button className={'acc-live-pill' + (live ? ' on' : '')} onClick={() => setLive(v => !v)}>
          <span className={live ? 'live-dot' : ''} style={live ? {} : { width: 7, height: 7, borderRadius: 999, background: 'var(--text-faint)' }} />
          {live ? 'En vivo' : 'Pausado'}
        </button>
        <button className="btn" onClick={() => go('historial-accesos')}><Icon name="clock" size={15} className="btn-ico" />Historial</button>
        <button className="btn primary" onClick={() => go('scanner-qr')}><Icon name="qr" size={15} className="btn-ico" />Abrir scanner</button>
      </PageHead>

      {/* KPIs */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        {[
          { label: 'Dentro del campus', node: <AnimNum value={inside} fmt={fmtNum} />, icon: 'users', tone: 'blue' },
          { label: 'Entradas hoy', node: <AnimNum value={entradas} fmt={fmtNum} />, icon: 'scan', tone: 'green' },
          { label: 'Retardos hoy', node: <AnimNum value={retardos} />, icon: 'clock', tone: 'amber' },
          { label: 'Visitantes activos', node: <AnimNum value={visitors.length} />, icon: 'user', tone: 'cyan' },
          { label: 'Incidentes abiertos', node: <AnimNum value={incidentsOpen} />, icon: 'shield', tone: 'red' },
        ].map((k, i) => {
          const t = window.TONE[k.tone];
          return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum">{k.node}</div>
            </div>
          );
        })}
      </div>

      {/* Flujo + presencia por nivel */}
      <div className="grid mt-16" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card">
          <CardHead icon="bars" title="Flujo de accesos por hora" sub="Entradas registradas hoy" />
          <div className="card pad" style={{ borderTop: 'none' }}>
            <BarChart data={flow} labels={hours} colors={['var(--accent)']} height={210} />
          </div>
        </div>
        <div className="card">
          <CardHead icon="cap" title="Presencia por nivel" sub="Alumnos dentro / inscritos" />
          <div className="card pad col gap-16" style={{ borderTop: 'none' }}>
            {DB.accessByLevel.map((l, i) => {
              const pct = l.total ? Math.round(l.inside / l.total * 100) : 0;
              const color = l.tone === 'blue' ? 'var(--accent)' : `var(--${l.tone})`;
              return (
                <div key={i}>
                  <div className="row between center" style={{ marginBottom: 6 }}>
                    <span className="row center gap-8" style={{ fontSize: 13.5, fontWeight: 600 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />{l.level}</span>
                    <span className="tnum faint" style={{ fontSize: 13 }}><b style={{ color: 'var(--text)' }}>{l.inside}</b> / {l.total} · {pct}%</span>
                  </div>
                  <div className="occ-track"><div className="occ-fill" style={{ width: pct + '%', background: color }} /></div>
                </div>
              );
            })}
            <div className="row between center" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 12.5 }}>
              <span className="faint">Ausentes hoy</span>
              <span className="tnum" style={{ fontWeight: 600 }}>{DB.accessByLevel.reduce((a, l) => a + (l.total - l.inside), 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ocupación por área + accesos por puerta */}
      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <CardHead icon="building" title="Ocupación por área" sub="Aforo en tiempo real" />
          <div className="card pad col gap-14" style={{ borderTop: 'none' }}>
            {DB.accessAreas.map((a, i) => {
              const pct = Math.round(a.inside / a.cap * 100);
              const color = pct >= 85 ? 'var(--red)' : pct >= 60 ? 'var(--amber)' : (a.tone === 'blue' ? 'var(--accent)' : `var(--${a.tone})`);
              const t = window.TONE[a.tone];
              return (
                <div className="row center gap-12" key={i}>
                  <div className="acc-ico" style={{ background: t.bg, color: t.c }}><Icon name={a.icon} size={16} /></div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="row between center" style={{ marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.area}</span>
                      <span className="tnum faint" style={{ fontSize: 12 }}>{a.inside}/{a.cap}</span>
                    </div>
                    <div className="occ-track"><div className="occ-fill" style={{ width: pct + '%', background: color }} /></div>
                  </div>
                  <span className="tnum" style={{ fontWeight: 700, fontSize: 13, width: 38, textAlign: 'right', color }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <CardHead icon="map" title="Accesos por puerta" sub="Distribución del día" />
          <div className="card pad col gap-16" style={{ borderTop: 'none' }}>
            {gates.map((g, i) => (
              <div key={i}>
                <div className="row between center" style={{ marginBottom: 6 }}>
                  <span className="row center gap-8" style={{ fontSize: 13.5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: g.color }} />{g.gate}</span>
                  <span className="tnum" style={{ fontWeight: 600, fontSize: 13.5 }}>{g.n}</span>
                </div>
                <Bar value={g.pct} color={g.color} height={8} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visitantes + incidentes */}
      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <CardHead icon="user" title="Visitantes activos" sub={visitors.length + ' dentro del campus'} />
          <div>
            {visitors.length === 0 && <div className="acc-mini faint" style={{ justifyContent: 'center', padding: 24 }}>Sin visitantes en el campus.</div>}
            {visitors.map((v, i) => (
              <div className="acc-mini" key={v.badge}>
                <Avatar name={v.name} size={34} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row center gap-8"><span style={{ fontWeight: 600, fontSize: 13.5 }}>{v.name}</span><Badge tone="gray">{v.badge}</Badge></div>
                  <div className="faint" style={{ fontSize: 12 }}>{v.reason} · anfitrión: {v.host}</div>
                </div>
                <span className="font-mono faint" style={{ fontSize: 11.5 }}>{v.since}</span>
                <button className="btn sm" onClick={() => checkoutVisitor(v)}><Icon name="logout" size={13} className="btn-ico" />Salida</button>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <CardHead icon="shield" title="Incidentes y alertas" sub={incidentsOpen + ' abiertos · ' + incidents.length + ' hoy'}
            right={<Badge tone={incidentsOpen ? 'red' : 'green'} dot>{incidentsOpen ? incidentsOpen + ' por atender' : 'Sin pendientes'}</Badge>} />
          <div>
            {incidents.map((inc, i) => (
              <div className="acc-mini clickable acc-row-click" key={i} onClick={() => setIncident(inc)}>
                <div className="sev-bar" style={{ background: `var(--${SEV_TONE[inc.sev]})` }} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{inc.title}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{inc.person} · {inc.gate} · {inc.time}</div>
                </div>
                <Badge tone={inc.status === 'Atendido' ? 'green' : inc.status === 'Abierto' ? 'red' : 'amber'} dot={inc.status !== 'Atendido'}>{inc.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Salidas anticipadas + pendientes de recoger */}
      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <CardHead icon="logout" title="Salidas anticipadas" sub="Autorizaciones del día" />
          <div>
            {earlyExits.map((e, i) => (
              <div className="acc-mini" key={i}>
                <div className="acc-ico" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}><Icon name="clock" size={16} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.name} <span className="faint" style={{ fontWeight: 400, fontSize: 12 }}>· {e.grade}</span></div>
                  <div className="faint" style={{ fontSize: 12 }}>{e.reason} · {e.by} · {e.time}</div>
                </div>
                {e.status === 'Pendiente'
                  ? <button className="btn sm primary" onClick={() => authorizeExit(i)}><Icon name="check" size={13} className="btn-ico" />Autorizar</button>
                  : <Badge tone="green" dot>Autorizada</Badge>}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <CardHead icon="users" title="Pendientes de recoger" sub={pickups.length + ' en espera de tutor'} />
          <div>
            {pickups.length === 0 && <div className="acc-mini faint" style={{ justifyContent: 'center', padding: 24 }}>Sin alumnos pendientes de recoger.</div>}
            {pickups.map((p, i) => (
              <div className="acc-mini" key={i}>
                <Avatar name={p.name} size={34} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name} <span className="faint" style={{ fontWeight: 400, fontSize: 12 }}>· {p.grade}</span></div>
                  <div className="faint" style={{ fontSize: 12 }}>Tutor: {p.tutor} · desde {p.since}</div>
                </div>
                <Badge tone={p.status === 'Notificado' ? 'cyan' : 'amber'} dot>{p.status}</Badge>
                <button className="btn sm" onClick={() => completePickup(i)}><Icon name="check" size={13} className="btn-ico" />Entregar</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feed en vivo + retardos */}
      <div className="grid mt-16" style={{ gridTemplateColumns: '1.6fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <CardHead icon="scan" title="Accesos en vivo" sub="Toca un registro para ver el detalle"
            right={<span className="row center gap-8 faint" style={{ fontSize: 12 }}>{live && <span className="live-dot" />}{live ? 'Tiempo real' : 'En pausa'}</span>} />
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Persona</th><th>Rol</th><th>Puerta</th><th>Método</th><th>Hora</th><th>Mov.</th><th>Estatus</th></tr></thead>
              <tbody>
                {feed.map((a) => (
                  <tr key={a._id} className={'acc-row-click' + (a._new ? ' acc-new acc-feed-row' : '')} onClick={() => setPerson(a)}>
                    <td><div className="person"><Avatar name={a.name} size={30} /><div className="pname">{a.name}</div></div></td>
                    <td className="muted" style={{ fontSize: 12.5 }}>{a.role} · {a.grade}</td>
                    <td style={{ fontSize: 12.5 }}>{a.gate}</td>
                    <td><span className="font-mono faint" style={{ fontSize: 12 }}>{a.method}</span></td>
                    <td className="font-mono" style={{ fontSize: 12 }}>{a.time}</td>
                    <td>{ACC_DIR(a.dir)}</td>
                    <td>{ACC_STATUS(a.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <CardHead icon="clock" title="Retardos del día" sub={retardos + ' registrados'}
            right={<Badge tone="amber" dot>{retardos}</Badge>} />
          <div>
            {late.map((l, i) => (
              <div className="acc-mini" key={i}>
                <Avatar name={l.name} size={32} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{l.name}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{l.grade} · llegó {l.time}</div>
                </div>
                <Badge tone={l.min >= 15 ? 'red' : 'amber'}>+{l.min} min</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {person && <AccessPersonModal rec={person} onClose={() => setPerson(null)} onExit={pushExit} onReport={(r) => toast('Incidente reportado para ' + r.name, 'warn')} />}
      {incident && <AccessIncidentModal inc={incident} onClose={() => setIncident(null)} onResolve={resolveIncident} />}
    </div>
  );
}

window.AccessDashboard = AccessDashboard;
