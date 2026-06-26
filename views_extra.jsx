/* views_extra.jsx — Principal (AI Missions, Engage, Atlas, Clases, Manager) + scaffolds */

/* ---------- AI Missions: movido a views_missions.jsx ---------- */

/* ---------- Engage: movido a views_engage.jsx ---------- */

/* ---------- Clases: movido a views_clases.jsx ---------- */

/* ---------- Atlas: movido a views_atlas.jsx ---------- */

/* ---------- Manager: movido a views_manager.jsx ---------- */

/* ---------- Contactos: reemplazada por views_crm.jsx (legacy, sin exportar) ---------- */
function Contactos_legacy({ go }) {
  const contacts = DB.leads.map(l => ({ name: l.family, type: 'Prospecto', email: l.family.toLowerCase().replace(/[^a-z]/g, '') + '@correo.com', phone: '55 ' + (1000 + Math.floor(Math.random() * 8999)) + ' ' + (1000 + Math.floor(Math.random() * 8999)), owner: l.owner }))
    .concat(DB.students.slice(0, 4).map(s => ({ name: 'Familia ' + s.name.split(' ')[1], type: 'Familia activa', email: s.name.split(' ')[1].toLowerCase() + '@correo.com', phone: '55 ' + (1000 + Math.floor(Math.random() * 8999)) + ' ' + (1000 + Math.floor(Math.random() * 8999)), owner: 'Tutoría' })));
  return (
    <div className="content-inner">
      <PageHead eyebrow="CRM" title="Contactos" desc={contacts.length + ' contactos · familias, prospectos y proveedores'}>
        <button className="btn primary"><Icon name="plus" size={15} className="btn-ico" />Nuevo contacto</button>
      </PageHead>
      <div className="card">
        <CardHead icon="users" title="Directorio de contactos" sub="Base centralizada" right={<button className="btn sm"><Icon name="filter" size={14} className="btn-ico" />Filtrar</button>} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Contacto</th><th>Tipo</th><th>Correo</th><th>Teléfono</th><th>Responsable</th></tr></thead>
            <tbody>
              {contacts.map((c, i) => (
                <tr key={i}>
                  <td><div className="person"><Avatar name={c.name} size={32} /><div className="pname">{c.name}</div></div></td>
                  <td><Badge tone={c.type === 'Prospecto' ? 'cyan' : 'green'}>{c.type}</Badge></td>
                  <td className="muted">{c.email}</td>
                  <td className="muted font-mono" style={{ fontSize: 12.5 }}>{c.phone}</td>
                  <td className="muted">{c.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Audiencias: reemplazada por views_comunicacion.jsx (legacy, sin exportar) ---------- */
function Audiencias_legacy({ go }) {
  const segs = [
    { name: 'Todas las familias', n: 1284, tone: 'blue', icon: 'users' },
    { name: 'Familias con adeudo', n: 142, tone: 'red', icon: 'wallet' },
    { name: 'Prospectos activos', n: 540, tone: 'cyan', icon: 'funnel' },
    { name: 'Alumnos en riesgo', n: 23, tone: 'amber', icon: 'alert' },
    { name: 'Padres de 6° (egreso)', n: 198, tone: 'violet', icon: 'cap' },
    { name: 'Comunidad docente', n: 148, tone: 'green', icon: 'award' },
  ];
  return (
    <div className="content-inner">
      <PageHead eyebrow="Comunicación" title="Audiencias" desc="Segmentos dinámicos para campañas y comunicados dirigidos.">
        <button className="btn primary"><Icon name="plus" size={15} className="btn-ico" />Nuevo segmento</button>
      </PageHead>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {segs.map((s, i) => {
          const t = window.TONE[s.tone];
          return (
            <div className="card pad" key={i} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="row between center">
                <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={s.icon} size={20} /></div>
                <RowMenu items={[{ icon: 'megaphone', label: 'Crear campaña', onClick: () => go('comunicados') }, { icon: 'edit', label: 'Editar segmento', onClick: () => toast('Editor de segmento') }]} />
              </div>
              <div><div className="font-display tnum" style={{ fontSize: 26, fontWeight: 700 }}>{fmtNum(s.n)}</div><div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div></div>
              <button className="btn sm" style={{ justifyContent: 'center' }} onClick={() => go('comunicados')}><Icon name="megaphone" size={14} className="btn-ico" />Enviar comunicado</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Plantilla genérica para módulos en construcción ---------- */
function ModuleScaffold({ meta, go, openCopilot }) {
  return (
    <div className="content-inner">
      <PageHead eyebrow={meta.section} title={meta.title} desc={meta.desc}>
        {meta.primary && <button className="btn primary"><Icon name={meta.primaryIcon || 'plus'} size={15} className="btn-ico" />{meta.primary}</button>}
      </PageHead>
      {meta.kpis && (
        <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(' + meta.kpis.length + ',1fr)' }}>
          {meta.kpis.map((k, i) => {
            const t = window.TONE[k.tone] || window.TONE.blue;
            return (
              <div className="card kpi" key={i}>
                <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value tnum">{k.value}</div>
              </div>
            );
          })}
        </div>
      )}
      <div className="grid mt-16" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card">
          <CardHead icon={meta.icon} title={meta.listTitle || 'Resumen'} sub={meta.listSub} />
          <div>
            {(meta.rows || []).length === 0 && (
              <div className="lrow faint" style={{ justifyContent: 'center', padding: 28, fontSize: 13 }}>Aún no hay registros en este ciclo.</div>
            )}
            {(meta.rows || []).map((r, i) => {
              const t = window.TONE[r.tone] || window.TONE.blue;
              return (
                <div className="lrow" key={i}>
                  <div className="insight-ico" style={{ background: t.bg, color: t.c, width: 34, height: 34 }}><Icon name={r.icon || meta.icon} size={16} /></div>
                  <div className="grow"><div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.title}</div><div className="faint" style={{ fontSize: 12.5 }}>{r.sub}</div></div>
                  {r.badge && <Badge tone={r.badgeTone || 'gray'}>{r.badge}</Badge>}
                  {r.value && <span className="tnum" style={{ fontWeight: 600 }}>{r.value}</span>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="ai-panel" style={{ alignSelf: 'start' }}>
          <div className="ai-panel-head">
            <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
            <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>Copilot sugiere</div><div className="faint" style={{ fontSize: 11.5 }}>Para este módulo</div></div>
          </div>
          <div className="insight" style={{ borderTop: 'none' }}>
            <div className="insight-body">
              <div className="insight-text">{meta.aiText || 'Pregúntale al Copilot para automatizar tareas de este módulo, generar reportes o detectar prioridades.'}</div>
              <div className="insight-actions"><button className="chip-btn" onClick={openCopilot}>Abrir Copilot</button></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ModuleScaffold });
