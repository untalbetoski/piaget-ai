/* views_other.jsx — Administrativo · Comunicación · Business Intelligence */

/* ============ ADMINISTRATIVO ============ */
function Administrativo({ go }) {
  const d = DB;
  const [modal, setModal] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', owner: 'Control Escolar', due: '', progress: 10 });
  function saveProcess() {
    if (!form.name.trim()) { toast('Escribe el nombre del trámite', 'warn'); return; }
    Store.add('processes', { ...form, progress: Number(form.progress), due: form.due || 'por definir' });
    toast('Trámite creado ✓'); setForm({ name: '', owner: 'Control Escolar', due: '', progress: 10 }); setModal(false);
  }
  const advance = (p) => { const np = Math.min(100, p.progress + 10); Store.update('processes', p._id, { progress: np }); toast(np === 100 ? 'Trámite completado 🎉' : '+10% → ' + np + '%', np === 100 ? 'ok' : 'info'); };
  return (
    <div className="content-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 7 }}>Gestión Administrativa</div>
          <h1 className="page-title">Administrativo</h1>
          <p className="page-desc">148 colaboradores · 42 grupos · 56 espacios · {d.processes.length} trámites en curso</p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="building" size={15} className="btn-ico" />Espacios</button>
          <button className="btn primary" onClick={() => setModal(true)}><Icon name="plus" size={15} className="btn-ico" />Nuevo trámite</button>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {d.adminStats.map((k, i) => {
          const t = window.TONE[k.tone];
          return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum">{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <CardHead icon="layers" title="Procesos administrativos" sub="Trámites institucionales en curso" />
          <div className="card pad col gap-16" style={{ borderTop: 'none' }}>
            {d.processes.map((p) => (
              <div key={p._id}>
                <div className="row between center" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</span>
                  <span className="faint" style={{ fontSize: 12 }}>Vence {p.due}</span>
                </div>
                <div className="row center gap-12">
                  <div className="grow"><Bar value={p.progress} color={p.progress >= 70 ? 'var(--green)' : p.progress >= 40 ? 'var(--accent)' : 'var(--amber)'} /></div>
                  <span className="tnum font-mono" style={{ fontSize: 12, width: 34, textAlign: 'right' }}>{p.progress}%</span>
                  <button className="btn sm" style={{ height: 26, padding: '0 8px' }} onClick={() => advance(p)} disabled={p.progress >= 100}>+10%</button>
                </div>
                <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>{p.owner}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <CardHead icon="users" title="Directorio de personal" sub="148 colaboradores activos"
            right={<button className="btn ghost sm">Ver todos<Icon name="chevR" size={14} /></button>} />
          <div>
            {d.staff.map((s) => (
              <div className="lrow" key={s._id}>
                <Avatar name={s.name} size={36} />
                <div className="grow">
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.name}</div>
                  <div className="faint" style={{ fontSize: 12.5 }}>{s.role}</div>
                </div>
                <Badge tone="gray">{s.dept}</Badge>
                {s.status === 'activo' ? <Badge tone="green" dot>Activo</Badge> : <Badge tone="amber" dot>Permiso</Badge>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[
          { t: 'Recursos humanos', s: 'Nómina, incidencias y vacaciones', icon: 'users', tone: 'blue', n: '148 fichas' },
          { t: 'Control escolar', s: 'Boletas, constancias y certificados', icon: 'doc', tone: 'violet', n: '31 trámites' },
          { t: 'Infraestructura', s: 'Aulas, laboratorios y mantenimiento', icon: 'building', tone: 'cyan', n: '56 espacios' },
        ].map((c, i) => {
          const t = window.TONE[c.tone];
          return (
            <div className="card pad" key={i} style={{ cursor: 'pointer' }}>
              <div className="row between center">
                <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={c.icon} size={19} /></div>
                <Icon name="arrowRight" size={18} className="faint" />
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 14 }}>{c.t}</div>
              <div className="faint" style={{ fontSize: 12.5, marginTop: 3 }}>{c.s}</div>
              <div className="badge gray" style={{ marginTop: 12 }}>{c.n}</div>
            </div>
          );
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo trámite"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={saveProcess}><Icon name="check" size={15} className="btn-ico" />Crear</button></>}>
        <Field label="Nombre del trámite"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="p.ej. Auditoría de becas" autoFocus /></Field>
        <div className="field-row">
          <Field label="Responsable"><SelectInput value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} options={['Control Escolar', 'Dirección', 'Finanzas', 'Servicios', 'RH']} /></Field>
          <Field label="Vence"><TextInput value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} placeholder="30 sep" /></Field>
        </div>
        <Field label={'Avance inicial: ' + form.progress + '%'}><input type="range" min="0" max="100" step="5" value={form.progress} onChange={e => setForm({ ...form, progress: e.target.value })} /></Field>
      </Modal>
    </div>
  );
}

/* ============ COMUNICACIÓN: reemplazada por views_comunicacion.jsx (legacy abajo, sin exportar) ============ */
function annStatus(s) {
  if (s === 'publicado') return <Badge tone="green" dot>Publicado</Badge>;
  if (s === 'programado') return <Badge tone="blue" dot>Programado</Badge>;
  return <Badge tone="gray" dot>Borrador</Badge>;
}
function Comunicacion_legacy({ go }) {
  const d = DB;
  const [modal, setModal] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', audience: 'Toda la comunidad', reach: 1284, status: 'publicado' });
  function saveAnn() {
    if (!form.title.trim()) { toast('Escribe el título del comunicado', 'warn'); return; }
    Store.add('announcements', { ...form, reach: Number(form.reach), time: form.status === 'programado' ? 'Programado' : 'Ahora' });
    Store.log('Dirección', 'publicó “' + form.title + '”', 'megaphone');
    toast(form.status === 'borrador' ? 'Borrador guardado' : 'Comunicado ' + form.status + ' ✓');
    setForm({ title: '', audience: 'Toda la comunidad', reach: 1284, status: 'publicado' }); setModal(false);
  }
  const publish = (a) => { Store.update('announcements', a._id, { status: 'publicado', time: 'Ahora' }); Store.log('Dirección', 'publicó “' + a.title + '”', 'megaphone'); toast('Comunicado publicado ✓'); };
  return (
    <div className="content-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 7 }}>Comunicación</div>
          <h1 className="page-title">Comunicación</h1>
          <p className="page-desc">9,180 mensajes este mes · tasa de apertura promedio <b style={{ color: 'var(--text)' }}>81%</b></p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="inbox" size={15} className="btn-ico" />Plantillas</button>
          <button className="btn primary" onClick={() => setModal(true)}><Icon name="plus" size={15} className="btn-ico" />Nuevo comunicado</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {d.channels.map((c, i) => {
          const t = window.TONE[c.tone];
          return (
            <div className="card pad" key={i}>
              <div className="row between center">
                <div className="row center gap-12">
                  <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={c.icon} size={19} /></div>
                  <div><div style={{ fontWeight: 600 }}>{c.label}</div><div className="faint" style={{ fontSize: 12 }}>{fmtNum(c.sent)} enviados</div></div>
                </div>
                <RingStat value={c.open} label="apertura" size={72} thickness={8} color={t.c} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card">
          <CardHead icon="megaphone" title="Comunicados" sub="Recientes y programados" />
          <div>
            {d.announcements.map((a) => (
              <div className="lrow" key={a._id} style={{ padding: '14px 20px' }}>
                <div className="insight-ico" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)', width: 34, height: 34 }}><Icon name="megaphone" size={16} /></div>
                <div className="grow">
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.title}</div>
                  <div className="faint" style={{ fontSize: 12.5 }}>{a.audience} · {fmtNum(a.reach)} destinatarios</div>
                </div>
                <div className="col" style={{ alignItems: 'flex-end', gap: 5 }}>
                  {annStatus(a.status)}
                  <span className="faint font-mono" style={{ fontSize: 11 }}>{a.time}</span>
                </div>
                {a.status !== 'publicado'
                  ? <button className="btn sm" onClick={() => publish(a)}><Icon name="send" size={13} className="btn-ico" />Publicar</button>
                  : <RowMenu items={[{ icon: 'trash', label: 'Eliminar', danger: true, onClick: () => { Store.remove('announcements', a._id); toast('Comunicado eliminado', 'warn'); } }]} />}
              </div>
            ))}
          </div>
        </div>

        {/* Compositor IA */}
        <div className="ai-panel">
          <div className="ai-panel-head">
            <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
            <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>Redactar con Copilot</div><div className="faint" style={{ fontSize: 11.5 }}>Genera comunicados en segundos</div></div>
          </div>
          <div style={{ padding: '4px 18px 18px' }}>
            <div className="card pad" style={{ background: 'var(--surface)', boxShadow: 'none' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Borrador generado</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Recordatorio amable de colegiatura</div>
              <p className="muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.55 }}>
                Estimada familia, les recordamos con cariño que la colegiatura de agosto vence el día 5. Pueden realizar su pago desde la app en la sección Finanzas. ¡Gracias por ser parte de la comunidad Piaget! 💙
              </p>
              <div className="row gap-8 mt-12 wrap">
                <Badge tone="blue">Tono: cálido</Badge>
                <Badge tone="violet">142 familias</Badge>
                <Badge tone="cyan">App + Correo</Badge>
              </div>
            </div>
            <div className="row gap-8 mt-12">
              <button className="btn primary grow" style={{ justifyContent: 'center' }} onClick={() => { Store.add('announcements', { title: 'Recordatorio amable de colegiatura', audience: '142 familias con adeudo', reach: 142, status: 'publicado', time: 'Ahora' }); Store.log('Comunicación', 'envió recordatorio a 142 familias', 'mail'); toast('Enviado a 142 familias ✓'); }}><Icon name="send" size={15} className="btn-ico" />Enviar a 142</button>
              <button className="btn" onClick={() => toast('Nuevo borrador generado', 'info')}><Icon name="refresh" size={15} className="btn-ico" />Regenerar</button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo comunicado"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={saveAnn}><Icon name="send" size={15} className="btn-ico" />Publicar</button></>}>
        <Field label="Título"><TextInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Asunto del comunicado" autoFocus /></Field>
        <Field label="Audiencia"><SelectInput value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} options={['Toda la comunidad', 'Padres de Primaria', 'Comunidad académica', '142 familias con adeudo']} /></Field>
        <div className="field-row">
          <Field label="Destinatarios"><NumberInput value={form.reach} onChange={e => setForm({ ...form, reach: e.target.value })} /></Field>
          <Field label="Estado"><SelectInput value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={['publicado', 'programado', 'borrador']} /></Field>
        </div>
      </Modal>
    </div>
  );
}
Object.assign(window, { Administrativo });
