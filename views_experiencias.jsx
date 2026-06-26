/* views_experiencias.jsx — Módulo Experiencias (staff): eventos, talleres y
   actividades extracurriculares. Crear / editar / eliminar, persistido en Store. */

const EXP_ESTADOS = ['Programada', 'Inscripción abierta', 'Cupos limitados', 'Cerrada', 'Borrador'];
const EXP_ICONS = ['star', 'compass', 'zap', 'heart', 'bookOpen', 'cap', 'music', 'award'];
const EXP_ESTADO_TONE = { 'Programada': 'blue', 'Inscripción abierta': 'green', 'Cupos limitados': 'amber', 'Cerrada': 'gray', 'Borrador': 'gray' };

function expNiveles() { return ['Todos', ...((DB.settings && DB.settings.levels) || []).map(l => l.name)]; }
function expFmtDate(iso) { if (!iso) return 'Sin fecha'; const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }); }
function expIsUpcoming(e) { if (!e.date) return false; const today = new Date(); today.setHours(0, 0, 0, 0); return new Date(e.date + 'T00:00:00') >= today; }
function expEmpty() { return { title: '', date: '', time: '', place: '', nivel: 'Todos', cupo: '', inscritos: 0, estado: 'Programada', icon: 'star', body: '' }; }

function ExpModal({ exp, onClose, onSave }) {
  const isNew = !exp;
  const [f, setF] = React.useState(() => exp ? { ...exp } : expEmpty());
  const u = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (!f.title.trim()) { toast('Escribe el nombre de la experiencia', 'warn'); return; }
    onSave({
      ...f, title: f.title.trim(), place: f.place.trim(),
      cupo: f.cupo === '' ? null : Math.max(0, Number(f.cupo) || 0),
      inscritos: Math.max(0, Number(f.inscritos) || 0),
    });
  };
  return (
    <Modal open width={560} onClose={onClose} title={isNew ? 'Nueva experiencia' : 'Editar experiencia'}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{isNew ? 'Crear' : 'Guardar'}</button></>}>
      <Field label="Nombre de la experiencia"><TextInput value={f.title} onChange={e => u('title', e.target.value)} placeholder="Ej. Feria de ciencias" autoFocus /></Field>
      <div className="field-row">
        <Field label="Fecha"><input className="inp" type="date" value={f.date} onChange={e => u('date', e.target.value)} /></Field>
        <Field label="Hora"><input className="inp" type="time" value={f.time} onChange={e => u('time', e.target.value)} /></Field>
      </div>
      <div className="field-row">
        <Field label="Lugar"><TextInput value={f.place} onChange={e => u('place', e.target.value)} placeholder="Ej. Auditorio" /></Field>
        <Field label="Nivel"><SelectInput value={f.nivel} onChange={e => u('nivel', e.target.value)} options={expNiveles()} /></Field>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Cupo (opcional)"><NumberInput value={f.cupo} onChange={e => u('cupo', e.target.value)} min="0" placeholder="Sin límite" /></Field>
        <Field label="Inscritos"><NumberInput value={f.inscritos} onChange={e => u('inscritos', e.target.value)} min="0" /></Field>
        <Field label="Estado"><SelectInput value={f.estado} onChange={e => u('estado', e.target.value)} options={EXP_ESTADOS} /></Field>
      </div>
      <Field label="Ícono"><SelectInput value={f.icon} onChange={e => u('icon', e.target.value)} options={EXP_ICONS} /></Field>
      <Field label="Descripción (opcional)"><TextArea rows={3} value={f.body} onChange={e => u('body', e.target.value)} placeholder="Detalle de la actividad, requisitos, etc." /></Field>
    </Modal>
  );
}

function Experiencias({ go }) {
  useStore();
  const readOnly = !!(window.docScope && window.docScope());
  const items = (window.DB && DB.experiences) || [];
  const [modal, setModal] = React.useState(null); // null | 'new' | exp | view

  const activas = items.filter(e => e.estado !== 'Borrador' && e.estado !== 'Cerrada').length;
  const inscritos = items.reduce((a, e) => a + (Number(e.inscritos) || 0), 0);
  const proximas = items.filter(e => e.estado !== 'Borrador' && expIsUpcoming(e)).length;
  const kpis = [
    { label: 'Experiencias activas', value: String(activas), icon: 'star', tone: 'violet' },
    { label: 'Inscritos', value: String(inscritos), icon: 'users', tone: 'blue' },
    { label: 'Próximas', value: String(proximas), icon: 'calendar', tone: 'green' },
  ];

  const save = (data) => {
    if (modal === 'new') { Store.add('experiences', data); Store.log('Experiencias', 'creó la experiencia “' + data.title + '”', 'star'); toast('Experiencia creada ✓'); }
    else { Store.update('experiences', modal._id, data); toast('Experiencia actualizada ✓'); }
    setModal(null);
  };
  const del = (e) => { Store.remove('experiences', e._id); toast('Experiencia eliminada', 'warn'); };

  const sorted = items.slice().sort((a, b) => (a.date || '~').localeCompare(b.date || '~'));

  return (
    <div className="content-inner">
      <PageHead eyebrow="Experiencias" title="Experiencias" desc={readOnly ? 'Eventos, talleres y actividades extracurriculares del colegio · solo consulta.' : 'Eventos, talleres y actividades extracurriculares.'}>
        {!readOnly && <button className="btn primary" onClick={() => setModal('new')}><Icon name="plus" size={15} className="btn-ico" />Nueva experiencia</button>}
      </PageHead>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {kpis.map((k, i) => { const t = window.TONE[k.tone]; return (
          <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>
        ); })}
      </div>

      <div className="card mt-16">
        <CardHead icon="star" title="Experiencias del ciclo" sub={items.length + (items.length === 1 ? ' registrada' : ' registradas')} />
        {sorted.length ? (
          <div>
            {sorted.map((e) => {
              const tone = EXP_ESTADO_TONE[e.estado] || 'blue';
              const t = window.TONE[tone] || window.TONE.blue;
              const cupoTxt = e.cupo != null ? (e.inscritos || 0) + ' / ' + e.cupo : (e.inscritos || 0) + ' inscritos';
              return (
                <div className="lrow" key={e._id} style={{ padding: '14px 20px' }}>
                  <div className="insight-ico" style={{ background: t.bg, color: t.c, width: 36, height: 36, flexShrink: 0 }}><Icon name={e.icon || 'star'} size={17} /></div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.title}</div>
                    <div className="faint" style={{ fontSize: 12.5 }}>{expFmtDate(e.date)}{e.time ? ' · ' + e.time : ''}{e.place ? ' · ' + e.place : ''} · {e.nivel}</div>
                  </div>
                  <span className="muted tnum" style={{ fontSize: 12.5, flexShrink: 0 }}>{cupoTxt}</span>
                  <Badge tone={tone} dot>{e.estado}</Badge>
                  {readOnly
                    ? <button className="btn sm" onClick={() => setModal({ view: e })}>Ver<Icon name="chevR" size={14} /></button>
                    : <RowMenu items={[
                        { icon: 'edit', label: 'Editar', onClick: () => setModal(e) },
                        { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => del(e) },
                      ]} />}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="col center" style={{ gap: 10, padding: '48px 20px', textAlign: 'center' }}>
            <div className="kpi-ico" style={{ width: 50, height: 50, margin: 0, background: 'var(--surface-3)', color: 'var(--text-muted)' }}><Icon name="star" size={24} /></div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Aún no hay experiencias programadas</div>
            <div className="faint" style={{ fontSize: 13, maxWidth: 420 }}>{readOnly ? 'El colegio aún no programa experiencias para este ciclo. Aquí podrás consultarlas cuando se publiquen.' : 'Crea la primera con “Nueva experiencia”. Las experiencias publicadas aparecerán en el portal de estudiantes y familias.'}</div>
            {!readOnly && <button className="btn primary sm" style={{ marginTop: 4 }} onClick={() => setModal('new')}><Icon name="plus" size={13} className="btn-ico" />Nueva experiencia</button>}
          </div>
        )}
      </div>

      {modal && !modal.view && <ExpModal exp={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={save} />}

      {modal && modal.view && (() => { const e = modal.view; const tone = EXP_ESTADO_TONE[e.estado] || 'blue'; return (
        <Modal open width={520} onClose={() => setModal(null)} title="Experiencia"
          footer={<button className="btn primary" onClick={() => setModal(null)}>Cerrar</button>}>
          <div className="row center gap-8" style={{ marginBottom: 12 }}>
            <Badge tone={tone} dot>{e.estado}</Badge>
            <span className="faint" style={{ fontSize: 12 }}>{expFmtDate(e.date)}{e.time ? ' · ' + e.time : ''}{e.place ? ' · ' + e.place : ''} · {e.nivel}</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 6px' }}>{e.title}</h2>
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 12 }}>{e.cupo != null ? (e.inscritos || 0) + ' / ' + e.cupo + ' inscritos' : (e.inscritos || 0) + ' inscritos'}</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--text)' }}>{e.body || 'Sin descripción adicional.'}</div>
        </Modal>
      ); })()}
    </div>
  );
}

Object.assign(window, { Experiencias, expFmtDate, expIsUpcoming });
