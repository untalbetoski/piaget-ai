/* campus_dashboard_patch.jsx — Dashboard de Accesos conectado a CampusEntry/Supabase */
(function () {
  const MX_TODAY = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const nfmt = n => Number(n || 0).toLocaleString('es-MX');
  const hourLabels = ['06', '07', '08', '09', '10', '12', '14', '16', '18'];
  const hourNames = ['6a', '7a', '8a', '9a', '10a', '12p', '2p', '4p', '6p'];

  function getLatestInside(events) {
    const latest = {};
    (events || []).forEach(e => {
      const k = String(e.name || '').trim().toLowerCase();
      if (k && !latest[k]) latest[k] = e;
    });
    return Object.values(latest).filter(e => e.dir !== 'out');
  }

  function levelFromGrade(grade, role) {
    const g = String(grade || '').toLowerCase();
    if (String(role || '').toLowerCase().includes('visit')) return 'Visitantes';
    if (g.includes('kinder') || g.includes('preescolar') || g.includes('maternal')) return 'Preescolar';
    if (g.includes('sec')) return 'Secundaria';
    if (g.includes('prep') || g.includes('bach')) return 'Preparatoria';
    if (/\b[1-6]\s*°/.test(g) || /\b[1-6]\s*[a-c]\b/.test(g)) return 'Primaria';
    return 'General';
  }

  function byHour(events, today) {
    const arr = hourLabels.map(() => 0);
    (events || []).forEach(e => {
      if (e.date !== today || e.dir === 'out') return;
      const hh = String(e.time || '').slice(0, 2);
      const idx = hourLabels.indexOf(hh);
      if (idx >= 0) arr[idx] += 1;
    });
    return arr;
  }

  function byGate(events, today) {
    const colors = ['var(--accent)', 'var(--cyan)', 'var(--violet)', 'var(--amber)', 'var(--green)'];
    const map = {};
    (events || []).forEach(e => {
      if (today && e.date !== today) return;
      const g = e.gate || 'Acceso Principal';
      map[g] = (map[g] || 0) + 1;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return Object.keys(map).map((gate, i) => ({ gate, n: map[gate], pct: Math.round(map[gate] * 100 / total), color: colors[i % colors.length] }));
  }

  function presenceByLevel(inside) {
    const base = ((DB && DB.accessByLevel) || []).map((l, i) => ({ level: l.level, total: l.total || 0, inside: 0, tone: l.tone || ['blue', 'green', 'violet', 'amber'][i % 4] }));
    if (!base.length) base.push({ level: 'General', total: 0, inside: 0, tone: 'blue' });
    const byName = Object.fromEntries(base.map(x => [x.level, x]));
    inside.forEach(e => {
      const lvl = levelFromGrade(e.grade, e.role);
      if (!byName[lvl]) { byName[lvl] = { level: lvl, total: 0, inside: 0, tone: 'gray' }; base.push(byName[lvl]); }
      byName[lvl].inside += 1;
    });
    return base;
  }

  function MiniBar({ value, color }) {
    return <div className="occ-track"><div className="occ-fill" style={{ width: Math.max(0, Math.min(100, value || 0)) + '%', background: color || 'var(--accent)' }} /></div>;
  }

  function AccessDashboard({ go }) {
    const [data, setData] = React.useState({ events: [], queue: [], visitors: [] });
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const today = MX_TODAY();

    async function load() {
      setLoading(true); setError('');
      try {
        const d = await window.CampusEntry.read();
        setData({ events: d.events || [], queue: d.queue || [], visitors: d.visitors || [] });
      } catch (e) {
        setError(e.message || String(e));
        toast('Dashboard sin sincronizar: ' + (e.message || e), 'warn');
      } finally { setLoading(false); }
    }
    React.useEffect(() => { load(); }, []);

    async function markOut(rec) {
      try {
        const ev = await window.CampusEntry.add({ name: rec.name, role: rec.role || 'Visitante', grade: rec.grade || '—', gate: rec.gate || 'Acceso Principal', dir: 'out', method: rec.method || 'Manual', status: 'ok', source: 'dashboard' });
        setData(d => ({ ...d, events: [ev, ...(d.events || [])] }));
        toast('Salida registrada: ' + rec.name, 'ok');
      } catch (e) { toast('No se pudo registrar salida: ' + e.message, 'warn'); }
    }

    const events = data.events || [];
    const todayEvents = events.filter(e => e.date === today);
    const inside = getLatestInside(events);
    const entrances = todayEvents.filter(e => e.dir !== 'out').length;
    const late = todayEvents.filter(e => e.dir !== 'out' && String(e.time || '') > '08:00' && String(e.role || '').toLowerCase().includes('est')).slice(0, 8);
    const flow = byHour(events, today);
    const gates = byGate(events, today);
    const levels = presenceByLevel(inside);
    const visitors = data.visitors || [];
    const queue = data.queue || [];
    const feed = events.slice(0, 14);
    const areas = [
      { area: 'Campus general', inside: inside.length, cap: Math.max(1, ((DB.accessByLevel || []).reduce((a, x) => a + (x.total || 0), 0) || inside.length || 1)), icon: 'building', tone: 'blue' },
      { area: 'Visitantes', inside: visitors.length, cap: Math.max(10, visitors.length || 10), icon: 'user', tone: 'cyan' },
      { area: 'Pendientes en cola', inside: queue.length, cap: Math.max(10, queue.length || 10), icon: 'shield', tone: 'amber' },
    ];

    return (
      <div className="content-inner">
        <PageHead eyebrow="Control de Accesos" title="Dashboard de Accesos"
          desc={'<b style="color:var(--text)">' + nfmt(inside.length) + '</b> dentro del campus · ' + queue.length + ' en cola · datos desde Supabase'}>
          <button className={'acc-live-pill' + (!error ? ' on' : '')} onClick={load} disabled={loading}>
            <span className={!error ? 'live-dot' : ''} style={!error ? {} : { width: 7, height: 7, borderRadius: 999, background: 'var(--text-faint)' }} />
            {loading ? 'Sincronizando' : (!error ? 'Supabase' : 'Revisar')}
          </button>
          <button className="btn" onClick={() => go('historial-accesos')}><Icon name="clock" size={15} className="btn-ico" />Historial</button>
          <button className="btn primary" onClick={() => go('scanner-qr')}><Icon name="qr" size={15} className="btn-ico" />Abrir scanner</button>
        </PageHead>

        {error && <div className="ai-panel"><div className="insight" style={{ borderTop: 'none' }}><div className="insight-ico" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon name="alert" size={16} /></div><div className="insight-body"><div className="insight-title">No se pudo cargar Supabase</div><div className="insight-text">{error}</div></div></div></div>}

        <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
          {[
            { label: 'Dentro del campus', value: inside.length, icon: 'users', tone: 'blue' },
            { label: 'Entradas hoy', value: entrances, icon: 'scan', tone: 'green' },
            { label: 'Retardos estimados', value: late.length, icon: 'clock', tone: 'amber' },
            { label: 'Visitantes activos', value: visitors.length, icon: 'user', tone: 'cyan' },
            { label: 'Cola de espera', value: queue.length, icon: 'shield', tone: 'red' },
          ].map((k, i) => { const t = window.TONE[k.tone] || window.TONE.gray; return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{nfmt(k.value)}</div></div>; })}
        </div>

        <div className="grid mt-16" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
          <div className="card"><CardHead icon="bars" title="Flujo de accesos por hora" sub="Entradas reales registradas hoy" /><div className="card pad col gap-12" style={{ borderTop: 'none' }}>{flow.map((v, i) => { const max = Math.max(1, ...flow); return <div key={hourNames[i]}><div className="row between center" style={{ marginBottom: 5 }}><span className="faint font-mono" style={{ fontSize: 12 }}>{hourNames[i]}</span><span className="tnum" style={{ fontSize: 12, fontWeight: 700 }}>{v}</span></div><MiniBar value={Math.round(v * 100 / max)} /></div>; })}</div></div>
          <div className="card"><CardHead icon="cap" title="Presencia por nivel" sub="Estimado por último movimiento" /><div className="card pad col gap-16" style={{ borderTop: 'none' }}>{levels.map((l, i) => { const pct = l.total ? Math.min(100, Math.round(l.inside / l.total * 100)) : (l.inside ? 100 : 0); const color = l.tone === 'blue' ? 'var(--accent)' : `var(--${l.tone})`; return <div key={i}><div className="row between center" style={{ marginBottom: 6 }}><span className="row center gap-8" style={{ fontSize: 13.5, fontWeight: 600 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />{l.level}</span><span className="tnum faint" style={{ fontSize: 13 }}><b style={{ color: 'var(--text)' }}>{l.inside}</b>{l.total ? ' / ' + l.total : ''} · {pct}%</span></div><MiniBar value={pct} color={color} /></div>; })}</div></div>
        </div>

        <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card"><CardHead icon="building" title="Ocupación por área" sub="Calculada con datos reales disponibles" /><div className="card pad col gap-14" style={{ borderTop: 'none' }}>{areas.map((a, i) => { const pct = Math.min(100, Math.round(a.inside / a.cap * 100)); const t = window.TONE[a.tone] || window.TONE.gray; const color = pct >= 85 ? 'var(--red)' : pct >= 60 ? 'var(--amber)' : t.c; return <div className="row center gap-12" key={i}><div className="acc-ico" style={{ background: t.bg, color: t.c }}><Icon name={a.icon} size={16} /></div><div className="grow" style={{ minWidth: 0 }}><div className="row between center" style={{ marginBottom: 5 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{a.area}</span><span className="tnum faint" style={{ fontSize: 12 }}>{a.inside}/{a.cap}</span></div><MiniBar value={pct} color={color} /></div><span className="tnum" style={{ fontWeight: 700, fontSize: 13, width: 38, textAlign: 'right', color }}>{pct}%</span></div>; })}</div></div>
          <div className="card"><CardHead icon="map" title="Accesos por puerta" sub="Distribución de movimientos de hoy" /><div className="card pad col gap-16" style={{ borderTop: 'none' }}>{gates.length ? gates.map((g, i) => <div key={i}><div className="row between center" style={{ marginBottom: 6 }}><span className="row center gap-8" style={{ fontSize: 13.5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: g.color }} />{g.gate}</span><span className="tnum" style={{ fontWeight: 600, fontSize: 13.5 }}>{g.n}</span></div><MiniBar value={g.pct} color={g.color} /></div>) : <div className="faint" style={{ padding: 18, textAlign: 'center' }}>Sin movimientos hoy.</div>}</div></div>
        </div>

        <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card"><CardHead icon="user" title="Visitantes activos" sub={visitors.length + ' dentro del campus'} /><div>{visitors.length === 0 && <div className="acc-mini faint" style={{ justifyContent: 'center', padding: 24 }}>Sin visitantes activos registrados.</div>}{visitors.map((v, i) => <div className="acc-mini" key={v.id || i}><Avatar name={v.name} size={34} /><div className="grow" style={{ minWidth: 0 }}><div className="row center gap-8"><span style={{ fontWeight: 600, fontSize: 13.5 }}>{v.name}</span><Badge tone="gray">{v.badge || 'VIS'}</Badge></div><div className="faint" style={{ fontSize: 12 }}>{v.reason || 'Visita'} · anfitrión: {v.host || '—'}</div></div><span className="font-mono faint" style={{ fontSize: 11.5 }}>{v.since}</span><button className="btn sm" onClick={() => markOut({ ...v, role: 'Visitante', grade: v.reason })}><Icon name="logout" size={13} className="btn-ico" />Salida</button></div>)}</div></div>
          <div className="card"><CardHead icon="shield" title="Cola e incidencias" sub={queue.length + ' pendientes de validación'} right={<button className="btn sm" onClick={() => go('cola-espera')}>Ver cola</button>} /><div>{queue.length === 0 && <div className="acc-mini faint" style={{ justifyContent: 'center', padding: 24 }}>Sin pendientes de validación.</div>}{queue.slice(0, 6).map((q, i) => <div className="acc-mini clickable" key={q.id || i} onClick={() => go('cola-espera')}><div className="sev-bar" style={{ background: 'var(--amber)' }} /><div className="grow" style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{q.name}</div><div className="faint" style={{ fontSize: 12 }}>{q.motivo || q.reason || 'Requiere revisión'} · {q.wait}</div></div><Badge tone="amber" dot>Pendiente</Badge></div>)}</div></div>
        </div>

        <div className="grid mt-16" style={{ gridTemplateColumns: '1.6fr 1fr', alignItems: 'start' }}>
          <div className="card"><CardHead icon="scan" title="Accesos recientes" sub="Últimos movimientos sincronizados" right={<button className="btn sm" onClick={load}>Actualizar</button>} /><div>{feed.length === 0 && <div className="acc-mini faint" style={{ justifyContent: 'center', padding: 24 }}>Sin movimientos registrados.</div>}{feed.map((ev, i) => <div className="acc-mini clickable" key={ev.id || i}><div className="acc-ico" style={{ background: ev.dir === 'in' ? 'var(--green-soft)' : 'var(--surface-3)', color: ev.dir === 'in' ? 'var(--green)' : 'var(--text-muted)' }}><Icon name={ev.dir === 'in' ? 'arrowDown' : 'arrowUp'} size={15} /></div><Avatar name={ev.name} size={30} /><div className="grow" style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{ev.name}</div><div className="faint" style={{ fontSize: 12 }}>{ev.role} · {ev.grade || '—'} · {ev.gate}</div></div><span className="font-mono faint" style={{ fontSize: 12 }}>{ev.time}</span>{ev.status === 'ok' ? <Badge tone="green">OK</Badge> : <Badge tone="amber">Revisar</Badge>}{ev.dir !== 'out' && <button className="btn sm" onClick={() => markOut(ev)}>Salida</button>}</div>)}</div></div>
          <div className="card"><CardHead icon="clock" title="Retardos estimados" sub="Entradas posteriores a 08:00" /><div>{late.length === 0 && <div className="acc-mini faint" style={{ justifyContent: 'center', padding: 24 }}>Sin retardos estimados.</div>}{late.map((l, i) => <div className="acc-mini" key={l.id || i}><Avatar name={l.name} size={30} /><div className="grow"><div style={{ fontWeight: 600, fontSize: 13 }}>{l.name}</div><div className="faint" style={{ fontSize: 12 }}>{l.grade || '—'}</div></div><Badge tone="amber">{l.time}</Badge></div>)}</div></div>
        </div>
      </div>
    );
  }

  window.AccessDashboard = AccessDashboard;
})();
