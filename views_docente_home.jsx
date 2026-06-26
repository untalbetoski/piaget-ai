/* views_docente_home.jsx — Home del DOCENTE
   --------------------------------------------------------------
   Resumen del docente en sesión: sus materias y grupos, asistencia
   de sus grupos, tareas activas y estudiantes en riesgo. Todo
   derivado de window.docScope() (grupos/materias asignados). */

function docHomeDueLabel(due) {
  if (!due) return { label: 'Sin fecha', tone: 'gray', sort: 9e9 };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(due + 'T00:00:00');
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return { label: 'Vencida', tone: 'red', sort: diff };
  if (diff === 0) return { label: 'Hoy', tone: 'amber', sort: 0 };
  if (diff === 1) return { label: 'Mañana', tone: 'amber', sort: 1 };
  return { label: 'En ' + diff + ' días', tone: 'blue', sort: diff };
}

function docHomeRiesgo(clases) {
  const out = [];
  clases.forEach(c => {
    const roster = window.alumnosDeClase ? window.alumnosDeClase(c) : [];
    roster.forEach(a => {
      const lowAvg = a.avg != null && a.avg < 7;
      const lowAtt = a.asis < 80;
      if (lowAvg || lowAtt) {
        out.push({ name: a.name, group: c.g, avg: a.avg, asis: a.asis, sev: (a.avg != null && a.avg < 6.5) || a.asis < 72 ? 'high' : 'mid' });
      }
    });
  });
  return out.sort((x, y) => (x.sev === y.sev ? (x.avg || 9) - (y.avg || 9) : (x.sev === 'high' ? -1 : 1)));
}

function DocenteHome({ go }) {
  useStore();
  const sc = window.docScope() || { name: 'Docente', groups: [], clases: [], niveles: [], materias: [] };
  const me = window.piagetActiveUser ? window.piagetActiveUser() : { firstName: sc.name };
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const clases = sc.clases;
  const nAlumnos = clases.reduce((a, c) => a + (c.alumnos || 0), 0);
  const conAsis = clases.filter(c => c.asistencia != null);
  const asisProm = conAsis.length ? Math.round(conAsis.reduce((a, c) => a + c.asistencia, 0) / conAsis.length * 10) / 10 : null;
  const tareas = (DB.tareas || []).filter(t => window.docAllowsGroup(t.group));
  const tareasOrden = tareas.slice().sort((a, b) => docHomeDueLabel(a.due).sort - docHomeDueLabel(b.due).sort);
  const riesgo = docHomeRiesgo(clases);

  const materiasLbl = (sc.materias && sc.materias.length) ? sc.materias.join(' · ') : 'Titular de grupo';

  const kpis = [
    { id: 'grupos', label: 'Mis grupos', icon: 'cap', tone: 'blue', value: String(clases.length), delta: 0, foot: sc.groups.join(', ') || 'sin grupos', spark: [] },
    { id: 'alumnos', label: 'Mis estudiantes', icon: 'users', tone: 'violet', value: String(nAlumnos), delta: 0, foot: 'en mis grupos', spark: [] },
    { id: 'asis', label: 'Asistencia', unit: asisProm != null ? '%' : '', icon: 'checkCircle', tone: 'green', value: asisProm != null ? asisProm.toFixed(1) : '—', delta: 0, foot: 'promedio de mis grupos', spark: [] },
    { id: 'riesgo', label: 'Estudiantes en riesgo', icon: 'alert', tone: 'amber', value: String(riesgo.length), delta: 0, foot: 'requieren seguimiento', spark: [], invert: true },
  ];

  return (
    <div className="content-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 7 }}>{DB.school.name} · {DB.school.cycle}</div>
          <h1 className="page-title">Buen día, {me.firstName || sc.name}</h1>
          <p className="page-desc">Hoy es {today}. Imparte <b style={{ color: 'var(--text)' }}>{materiasLbl}</b> en {clases.length} {clases.length === 1 ? 'grupo' : 'grupos'}.</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => go('asistencia')}><Icon name="checkCircle" size={15} className="btn-ico" />Pasar lista</button>
          <button className="btn primary" onClick={() => go('tareas')}><Icon name="plus" size={15} className="btn-ico" />Asignar tarea</button>
        </div>
      </div>

      <div className="kpi-row">
        {kpis.map((k, i) => {
          const t = (window.TONE && window.TONE[k.tone]) || window.TONE.blue;
          return (
            <div className="card kpi rise" key={k.id} style={{ animationDelay: (i * 0.05) + 's' }}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum">{k.value}{k.unit && <span className="unit">{k.unit}</span>}</div>
              <div className="kpi-foot"><span className="muted">{k.foot}</span></div>
            </div>
          );
        })}
      </div>

      {/* Mis grupos + Estudiantes en riesgo */}
      <div className="grid mt-16" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <CardHead icon="cap" title="Mis grupos y materias" sub={clases.length + (clases.length === 1 ? ' grupo asignado' : ' grupos asignados')}
            right={<button className="btn ghost sm" onClick={() => go('clases')}>Ver clases<Icon name="chevR" size={14} /></button>} />
          <div>
            {clases.map((c, i) => (
              <button className="lrow clickable" key={c._id || c.g} onClick={() => go('clases')}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: i < clases.length - 1 ? '1px solid var(--border)' : 'none', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>
                <div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 34, height: 34 }}><Icon name="cap" size={16} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.g} · {c.nivel}</div>
                  <div className="faint" style={{ fontSize: 12.5 }}>{c.alumnos} alumnos · salón {c.salon}</div>
                </div>
                <div className="row center gap-10" style={{ flexShrink: 0 }}>
                  {c.asistencia != null ? (<>
                    <div style={{ width: 64 }}><Bar value={c.asistencia} height={6} color={c.asistencia < 85 ? 'var(--amber)' : 'var(--green)'} /></div>
                    <span className="tnum faint font-mono" style={{ fontSize: 12, width: 34, textAlign: 'right' }}>{c.asistencia}%</span>
                  </>) : (
                    <span className="tnum faint font-mono" style={{ fontSize: 12, width: 34, textAlign: 'right' }}>—</span>
                  )}
                </div>
              </button>
            ))}
            {!clases.length && <div className="faint" style={{ fontSize: 12.5, padding: '16px 20px' }}>Aún no tienes grupos asignados.</div>}
          </div>
        </div>

        <div className="card">
          <CardHead icon="alert" title="Estudiantes en riesgo" sub="Bajo promedio o asistencia"
            right={<Badge tone={riesgo.length ? 'amber' : 'green'} dot>{riesgo.length}</Badge>} />
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {riesgo.slice(0, 12).map((r, i) => (
              <div className="lrow" key={i} style={{ borderBottom: i < Math.min(riesgo.length, 12) - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="insight-ico" style={{ background: r.sev === 'high' ? 'var(--red-soft)' : 'var(--amber-soft)', color: r.sev === 'high' ? 'var(--red)' : 'var(--amber)', width: 32, height: 32 }}><Icon name="user" size={15} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{r.group}</div>
                </div>
                <div className="col" style={{ alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                  {r.avg != null && <span className="tnum font-mono" style={{ fontSize: 12, fontWeight: 700, color: r.avg < 7 ? 'var(--red)' : 'var(--text)' }}>{r.avg.toFixed(1)}</span>}
                  <span className="tnum font-mono faint" style={{ fontSize: 11 }}>{r.asis}% asist.</span>
                </div>
              </div>
            ))}
            {!riesgo.length && <div className="faint" style={{ fontSize: 12.5, padding: '16px 20px' }}>Sin estudiantes en riesgo. ¡Buen trabajo!</div>}
          </div>
        </div>
      </div>

      {/* Tareas de mis materias */}
      <div className="card mt-16">
        <CardHead icon="clipboard" title="Tareas de mis grupos" sub={tareas.length + (tareas.length === 1 ? ' tarea activa' : ' tareas activas')}
          right={<button className="btn ghost sm" onClick={() => go('tareas')}>Ver todas<Icon name="chevR" size={14} /></button>} />
        <div>
          {tareasOrden.slice(0, 6).map((t, i) => {
            const du = docHomeDueLabel(t.due);
            const pct = t.total ? Math.round((t.submitted || 0) / t.total * 100) : 0;
            return (
              <button className="lrow clickable" key={t._id} onClick={() => go('tareas')}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: i < Math.min(tareasOrden.length, 6) - 1 ? '1px solid var(--border)' : 'none', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>
                <div className="insight-ico" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)', width: 34, height: 34 }}><Icon name="clipboard" size={16} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                  <div className="faint" style={{ fontSize: 12.5 }}>{t.group} · {t.subject}</div>
                </div>
                <div className="row center gap-10" style={{ flexShrink: 0 }}>
                  <div style={{ width: 70 }}><Bar value={pct} height={6} color={pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--accent)' : 'var(--amber)'} /></div>
                  <span className="tnum faint font-mono" style={{ fontSize: 11.5, width: 44, textAlign: 'right' }}>{t.submitted || 0}/{t.total}</span>
                  <Badge tone={du.tone}>{du.label}</Badge>
                </div>
              </button>
            );
          })}
          {!tareas.length && <div className="faint" style={{ fontSize: 12.5, padding: '16px 20px' }}>No tienes tareas asignadas. Usa “Asignar tarea” para crear una.</div>}
        </div>
      </div>
    </div>
  );
}

window.DocenteHome = DocenteHome;
