/* views_experiencias.jsx — Experiencias editable para Dirección/Administración y consulta para otros roles */

const EXP_ESTADOS = ['Programada', 'Inscripción abierta', 'Cupos limitados', 'Cerrada', 'Borrador'];
const EXP_ICONS = ['star', 'compass', 'zap', 'heart', 'bookOpen', 'cap', 'music', 'award', 'calendar', 'users'];
const EXP_ESTADO_TONE = { 'Programada': 'blue', 'Inscripción abierta': 'green', 'Cupos limitados': 'amber', 'Cerrada': 'gray', 'Borrador': 'gray' };

function expClean(v) { return String(v || '').trim(); }
function expNorm(v) { return expClean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function expSession() { try { return (window.PiagetAuth && PiagetAuth.getSession && PiagetAuth.getSession()) || {}; } catch (_) { return {}; } }
function expCanEdit() {
  const s = expSession();
  const hay = expNorm([s.kind, s.role, s.name, s.email].filter(Boolean).join(' '));
  return /direccion|directivo|director|administrador|administracion|admin/.test(hay);
}
function expNiveles() {
  const levels = ((DB.settings && DB.settings.levels) || []).map(l => l.name).filter(Boolean);
  return ['Todos', ...(levels.length ? levels : ['Preescolar', 'Primaria', 'Secundaria'])];
}
function expFmtDate(iso) { if (!iso) return 'Sin fecha'; const d = new Date(iso + 'T00:00:00'); return isNaN(d) ? iso : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); }
function expIsUpcoming(e) { if (!e.date) return false; const today = new Date(); today.setHours(0, 0, 0, 0); return new Date(e.date + 'T00:00:00') >= today; }
function expEmpty() { return { title: '', date: '', time: '', place: '', nivel: 'Todos', cupo: '', inscritos: 0, estado: 'Programada', icon: 'star', body: '' }; }
function expItems() { return ((window.DB && Array.isArray(DB.experiences)) ? DB.experiences : []).filter(e => e && e._id !== '__demo__'); }
function expVisibleItems(canEdit) { return expItems().filter(e => canEdit || e.estado !== 'Borrador'); }
function expSaveState() { try { if (window.Store && Store.saveState) Store.saveState(); } catch (_) {} }

function ExpModal({ exp, onClose, onSave }) {
  const isNew = !exp;
  const [f, setF] = React.useState(() => exp ? { ...exp } : expEmpty());
  const u = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (!expClean(f.title)) { toast('Escribe el nombre de la experiencia', 'warn'); return; }
    if (!f.date) { toast('Selecciona la fecha de la experiencia', 'warn'); return; }
    onSave({
      ...f,
      title: expClean(f.title),
      place: expClean(f.place),
      body: expClean(f.body),
      cupo: f.cupo === '' || f.cupo == null ? null : Math.max(0, Number(f.cupo) || 0),
      inscritos: Math.max(0, Number(f.inscritos) || 0),
      estado: f.estado || 'Programada',
      nivel: f.nivel || 'Todos',
      icon: f.icon || 'star',
      real: true,
      updatedAt: new Date().toISOString(),
      createdAt: f.createdAt || new Date().toISOString(),
    });
  };
  return (
    <Modal open width={620} onClose={onClose} title={isNew ? 'Nueva experiencia' : 'Editar experiencia'}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{isNew ? 'Crear experiencia' : 'Guardar cambios'}</button></>}>
      <div className="col" style={{ gap: 12 }}>
        <Field label="Nombre de la experiencia"><TextInput value={f.title || ''} onChange={e => u('title', e.target.value)} placeholder="Ej. Feria de ciencias" autoFocus /></Field>
        <div className="field-row">
          <Field label="Fecha"><input className="inp" type="date" value={f.date || ''} onChange={e => u('date', e.target.value)} /></Field>
          <Field label="Hora"><input className="inp" type="time" value={f.time || ''} onChange={e => u('time', e.target.value)} /></Field>
        </div>
        <div className="field-row">
          <Field label="Lugar"><TextInput value={f.place || ''} onChange={e => u('place', e.target.value)} placeholder="Ej. Auditorio" /></Field>
          <Field label="Nivel"><SelectInput value={f.nivel || 'Todos'} onChange={e => u('nivel', e.target.value)} options={expNiveles()} /></Field>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Cupo"><NumberInput value={f.cupo == null ? '' : f.cupo} onChange={e => u('cupo', e.target.value)} min="0" placeholder="Sin límite" /></Field>
          <Field label="Inscritos"><NumberInput value={f.inscritos || 0} onChange={e => u('inscritos', e.target.value)} min="0" /></Field>
          <Field label="Estado"><SelectInput value={f.estado || 'Programada'} onChange={e => u('estado', e.target.value)} options={EXP_ESTADOS} /></Field>
        </div>
        <Field label="Ícono"><SelectInput value={f.icon || 'star'} onChange={e => u('icon', e.target.value)} options={EXP_ICONS} /></Field>
        <Field label="Descripción"><TextArea rows={4} value={f.body || ''} onChange={e => u('body', e.target.value)} placeholder="Detalle de la actividad, requisitos, costo, materiales, autorizaciones, etc." /></Field>
      </div>
    </Modal>
  );
}

function ExpViewModal({ exp, onClose }) {
  if (!exp) return null;
  const tone = EXP_ESTADO_TONE[exp.estado] || 'blue';
  return <Modal open width={540} onClose={onClose} title="Experiencia" footer={<button className="btn primary" onClick={onClose}>Cerrar</button>}>
    <div className="row center gap-8" style={{ marginBottom: 12 }}><Badge tone={tone} dot>{exp.estado || 'Programada'}</Badge><span className="faint" style={{ fontSize: 12 }}>{expFmtDate(exp.date)}{exp.time ? ' · ' + exp.time : ''}{exp.place ? ' · ' + exp.place : ''} · {exp.nivel || 'Todos'}</span></div>
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 6px' }}>{exp.title}</h2>
    <div className="faint" style={{ fontSize: 12.5, marginBottom: 12 }}>{exp.cupo != null ? (exp.inscritos || 0) + ' / ' + exp.cupo + ' inscritos' : (exp.inscritos || 0) + ' inscritos'}</div>
    <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--text)' }}>{exp.body || 'Sin descripción adicional.'}</div>
  </Modal>;
}

function Experiencias({ go }) {
  useStore();
  const canEdit = expCanEdit();
  const items = expVisibleItems(canEdit);
  const [modal, setModal] = React.useState(null); // null | 'new' | exp | {view:exp}
  const [filter, setFilter] = React.useState(canEdit ? 'Todas' : 'Publicadas');

  const activas = items.filter(e => e.estado !== 'Borrador' && e.estado !== 'Cerrada').length;
  const inscritos = items.reduce((a, e) => a + (Number(e.inscritos) || 0), 0);
  const proximas = items.filter(e => e.estado !== 'Borrador' && expIsUpcoming(e)).length;
  const borradores = expItems().filter(e => e.estado === 'Borrador').length;
  const kpis = [
    { label: 'Experiencias activas', value: String(activas), icon: 'star', tone: 'violet' },
    { label: 'Inscritos', value: String(inscritos), icon: 'users', tone: 'blue' },
    { label: 'Próximas', value: String(proximas), icon: 'calendar', tone: 'green' },
    ...(canEdit ? [{ label: 'Borradores', value: String(borradores), icon: 'edit', tone: 'amber' }] : []),
  ];

  const save = (data) => {
    if (!canEdit) { toast('Solo administradores y directivos pueden editar experiencias', 'warn'); return; }
    if (modal === 'new') {
      Store.add('experiences', data);
      Store.log('Experiencias', 'creó la experiencia “' + data.title + '”', 'star');
      toast('Experiencia creada ✓');
    } else {
      Store.update('experiences', modal._id, data);
      Store.log('Experiencias', 'actualizó la experiencia “' + data.title + '”', 'edit');
      toast('Experiencia actualizada ✓');
    }
    expSaveState();
    setModal(null);
  };
  const del = (e) => { if (!canEdit) return; Store.remove('experiences', e._id); Store.log('Experiencias', 'eliminó la experiencia “' + e.title + '”', 'trash'); expSaveState(); toast('Experiencia eliminada', 'warn'); };
  const setEstado = (e, estado) => { if (!canEdit) return; Store.update('experiences', e._id, { estado, updatedAt: new Date().toISOString() }); expSaveState(); toast('Estado actualizado: ' + estado, 'ok'); };

  const filtered = items.filter(e => filter === 'Todas' || (filter === 'Publicadas' ? e.estado !== 'Borrador' : e.estado === filter));
  const sorted = filtered.slice().sort((a, b) => (a.date || '~').localeCompare(b.date || '~'));

  return (
    <div className="content-inner">
      <PageHead eyebrow="Experiencias" title="Experiencias" desc={canEdit ? 'Crea, edita y publica eventos, talleres y actividades extracurriculares.' : 'Eventos, talleres y actividades extracurriculares del colegio · solo consulta.'}>
        {canEdit && <button className="btn primary" onClick={() => setModal('new')}><Icon name="plus" size={15} className="btn-ico" />Nueva experiencia</button>}
      </PageHead>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(' + kpis.length + ',1fr)' }}>
        {kpis.map((k, i) => { const t = (window.TONE && window.TONE[k.tone]) || window.TONE.blue; return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>; })}
      </div>

      <div className="card mt-16">
        <CardHead icon="star" title="Experiencias del ciclo" sub={items.length + (items.length === 1 ? ' registrada' : ' registradas')} right={<div className="seg">{(canEdit ? ['Todas', 'Programada', 'Inscripción abierta', 'Cupos limitados', 'Cerrada', 'Borrador'] : ['Publicadas', 'Programada', 'Inscripción abierta', 'Cupos limitados', 'Cerrada']).map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div>} />
        {sorted.length ? <div>{sorted.map((e) => { const tone = EXP_ESTADO_TONE[e.estado] || 'blue'; const t = (window.TONE && window.TONE[tone]) || window.TONE.blue; const cupoTxt = e.cupo != null ? (e.inscritos || 0) + ' / ' + e.cupo : (e.inscritos || 0) + ' inscritos'; return (
          <div className="lrow" key={e._id} style={{ padding: '14px 20px' }}>
            <div className="insight-ico" style={{ background: t.bg, color: t.c, width: 36, height: 36, flexShrink: 0 }}><Icon name={e.icon || 'star'} size={17} /></div>
            <div className="grow" style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.8 }}>{e.title}</div>
              <div className="faint" style={{ fontSize: 12.5 }}>{expFmtDate(e.date)}{e.time ? ' · ' + e.time : ''}{e.place ? ' · ' + e.place : ''} · {e.nivel || 'Todos'}</div>
            </div>
            <span className="muted tnum" style={{ fontSize: 12.5, flexShrink: 0 }}>{cupoTxt}</span>
            <Badge tone={tone} dot>{e.estado || 'Programada'}</Badge>
            {canEdit ? <RowMenu items={[
              { icon: 'eye', label: 'Ver', onClick: () => setModal({ view: e }) },
              { icon: 'edit', label: 'Editar', onClick: () => setModal(e) },
              e.estado === 'Borrador' ? { icon: 'check', label: 'Publicar', onClick: () => setEstado(e, 'Programada') } : { icon: 'doc', label: 'Pasar a borrador', onClick: () => setEstado(e, 'Borrador') },
              e.estado !== 'Cerrada' ? { icon: 'lock', label: 'Cerrar', onClick: () => setEstado(e, 'Cerrada') } : { icon: 'refresh', label: 'Reabrir', onClick: () => setEstado(e, 'Programada') },
              { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => del(e) },
            ]} /> : <button className="btn sm" onClick={() => setModal({ view: e })}>Ver<Icon name="chevR" size={14} /></button>}
          </div>
        ); })}</div> : <div className="col center" style={{ gap: 10, padding: '48px 20px', textAlign: 'center' }}>
          <div className="kpi-ico" style={{ width: 50, height: 50, margin: 0, background: 'var(--surface-3)', color: 'var(--text-muted)' }}><Icon name="star" size={24} /></div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Aún no hay experiencias programadas</div>
          <div className="faint" style={{ fontSize: 13, maxWidth: 420 }}>{canEdit ? 'Crea la primera con “Nueva experiencia”. Las experiencias publicadas aparecerán en el portal de estudiantes y familias.' : 'El colegio aún no programa experiencias para este ciclo.'}</div>
          {canEdit && <button className="btn primary sm" style={{ marginTop: 4 }} onClick={() => setModal('new')}><Icon name="plus" size={13} className="btn-ico" />Nueva experiencia</button>}
        </div>}
      </div>

      {modal && !modal.view && <ExpModal exp={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={save} />}
      {modal && modal.view && <ExpViewModal exp={modal.view} onClose={() => setModal(null)} />}
    </div>
  );
}

Object.assign(window, { Experiencias, expFmtDate, expIsUpcoming, expCanEdit });
