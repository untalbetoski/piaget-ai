/* views_atlas.jsx — Atlas real-only: sin datos demo ni currículo precargado */

function atlasDB() {
  window.DB = window.DB || {};
  DB.settings = DB.settings || {};
  DB.settings.atlasCurriculum = Array.isArray(DB.settings.atlasCurriculum) ? DB.settings.atlasCurriculum : [];
  return DB.settings.atlasCurriculum;
}
function atlasRealItems() {
  return atlasDB().filter(x => x && x.real !== false && !x.demo && !x.sample);
}
function atlasLevelsFromClasses() {
  const levels = [...new Set((DB.clases || []).map(c => c.nivel).filter(Boolean))];
  return levels.length ? levels : ['Preescolar', 'Primaria', 'Secundaria'];
}
function atlasGroupsForLevel(level) {
  return (DB.clases || []).filter(c => !level || c.nivel === level).map(c => c.g).filter(Boolean);
}
function atlasClean(v) { return String(v || '').trim(); }
function atlasEmptyEntry(level) {
  const groups = atlasGroupsForLevel(level);
  return { nivel: level || 'Primaria', grupo: groups[0] || '', materia: '', unidad: '', periodo: '', avance: 0, responsable: '', observaciones: '', real: true, createdAt: new Date().toISOString() };
}
function AtlasEntryModal({ entry, nivel, onClose }) {
  const [form, setForm] = React.useState(() => entry ? { ...entry } : atlasEmptyEntry(nivel));
  const groups = atlasGroupsForLevel(form.nivel);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function save() {
    if (!atlasClean(form.materia)) return toast('Captura la materia', 'warn');
    if (!atlasClean(form.unidad)) return toast('Captura la unidad o ruta curricular', 'warn');
    const list = atlasDB();
    const payload = { ...form, materia: atlasClean(form.materia), unidad: atlasClean(form.unidad), periodo: atlasClean(form.periodo), responsable: atlasClean(form.responsable), observaciones: atlasClean(form.observaciones), avance: Math.max(0, Math.min(100, Number(form.avance) || 0)), real: true, updatedAt: new Date().toISOString() };
    if (entry && entry._id) {
      const i = list.findIndex(x => x._id === entry._id);
      if (i >= 0) list[i] = { ...list[i], ...payload };
    } else {
      list.push({ _id: 'atlas_' + Date.now() + '_' + Math.random().toString(16).slice(2), ...payload });
    }
    try { Store.saveState && Store.saveState(); } catch (_) {}
    toast('Ruta curricular guardada en Atlas', 'ok');
    onClose();
  }
  return <Modal open width={720} title={entry ? 'Editar ruta curricular' : 'Nueva ruta curricular'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar</button></>}>
    <div className="col" style={{ gap: 14 }}>
      <div className="field-row"><Field label="Nivel"><SelectInput value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value, grupo: atlasGroupsForLevel(e.target.value)[0] || '' }))} options={atlasLevelsFromClasses()} /></Field><Field label="Grupo"><SelectInput value={form.grupo || ''} onChange={e => set('grupo', e.target.value)} options={groups.length ? groups : [{ value: '', label: 'Sin grupos reales capturados' }]} /></Field></div>
      <div className="field-row"><Field label="Materia"><TextInput value={form.materia || ''} onChange={e => set('materia', e.target.value)} placeholder="Ej. Matemáticas" /></Field><Field label="Periodo"><TextInput value={form.periodo || ''} onChange={e => set('periodo', e.target.value)} placeholder="Ej. Septiembre - Octubre" /></Field></div>
      <Field label="Unidad / ruta curricular"><TextInput value={form.unidad || ''} onChange={e => set('unidad', e.target.value)} placeholder="Ej. Números naturales y operaciones" /></Field>
      <div className="field-row"><Field label="Avance real (%)"><NumberInput min="0" max="100" value={form.avance || 0} onChange={e => set('avance', e.target.value)} /></Field><Field label="Responsable"><TextInput value={form.responsable || ''} onChange={e => set('responsable', e.target.value)} placeholder="Docente o coordinación" /></Field></div>
      <Field label="Observaciones"><textarea className="inp" rows="4" value={form.observaciones || ''} onChange={e => set('observaciones', e.target.value)} placeholder="Notas reales del avance, pendientes o acuerdos" /></Field>
      <div className="ai-panel" style={{ margin: 0 }}><div className="insight" style={{ borderTop: 'none' }}><div className="insight-ico"><Icon name="shield" size={15} /></div><div className="insight-body"><div className="insight-title">Atlas real-only</div><div className="insight-text">Solo se guardan rutas capturadas por el colegio. No se generará currículo automático ni rezagos simulados.</div></div></div></div>
    </div>
  </Modal>;
}
function Atlas({ go, openCopilot }) {
  useStore();
  const levels = atlasLevelsFromClasses();
  const [nivel, setNivel] = React.useState(levels[0] || 'Primaria');
  const [modal, setModal] = React.useState(null);
  const items = atlasRealItems();
  const visible = items.filter(x => !nivel || x.nivel === nivel);
  const clases = (DB.clases || []).filter(c => !nivel || c.nivel === nivel);
  const subjects = [...new Set(visible.map(x => x.materia).filter(Boolean))];
  const avg = visible.length ? Math.round(visible.reduce((a, x) => a + (Number(x.avance) || 0), 0) / visible.length) : 0;
  function remove(item) {
    if (!confirm('¿Eliminar esta ruta curricular de Atlas?')) return;
    const list = atlasDB();
    const i = list.findIndex(x => x._id === item._id);
    if (i >= 0) list.splice(i, 1);
    try { Store.saveState && Store.saveState(); } catch (_) {}
    toast('Ruta eliminada', 'ok');
  }
  return <div className="content-inner">
    <PageHead eyebrow="Principal" title="Atlas" desc="Mapa curricular real · sin datos demo ni cargas automáticas">
      <div className="seg">{levels.map(n => <button key={n} className={nivel === n ? 'active' : ''} onClick={() => setNivel(n)}>{n}</button>)}</div>
    </PageHead>
    <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
      <div className="card kpi"><div className="kpi-ico"><Icon name="layers" size={19} /></div><div className="kpi-label">Rutas reales</div><div className="kpi-value tnum">{visible.length}</div></div>
      <div className="card kpi"><div className="kpi-ico"><Icon name="bookOpen" size={19} /></div><div className="kpi-label">Materias reales</div><div className="kpi-value tnum">{subjects.length}</div></div>
      <div className="card kpi"><div className="kpi-ico"><Icon name="users" size={19} /></div><div className="kpi-label">Grupos reales</div><div className="kpi-value tnum">{clases.length}</div></div>
      <div className="card kpi"><div className="kpi-ico"><Icon name="target" size={19} /></div><div className="kpi-label">Avance capturado</div><div className="kpi-value tnum">{avg}%</div></div>
    </div>
    <div className="row between center" style={{ marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
      <div className="faint" style={{ fontSize: 13 }}>Los datos se muestran solo si fueron capturados o guardados como reales.</div>
      <button className="btn primary" onClick={() => setModal({})}><Icon name="plus" size={15} className="btn-ico" />Nueva ruta curricular</button>
    </div>
    {!visible.length ? <div className="card pad" style={{ textAlign: 'center', padding: 34 }}>
      <div className="kpi-ico" style={{ margin: '0 auto 12px' }}><Icon name="map" size={22} /></div>
      <div style={{ fontWeight: 700, fontSize: 18 }}>Atlas sin rutas curriculares reales</div>
      <div className="faint" style={{ maxWidth: 620, margin: '8px auto 18px', lineHeight: 1.55 }}>Se eliminaron los datos precargados de muestra. Al entrar desde otro navegador, Atlas ya no mostrará currículo, avances ni rezagos inventados.</div>
      <div className="row center gap-10" style={{ justifyContent: 'center', flexWrap: 'wrap' }}><button className="btn primary" onClick={() => setModal({})}>Capturar primera ruta</button>{go && <button className="btn" onClick={() => go('clases')}>Revisar grupos reales</button>}</div>
    </div> : <div className="card"><CardHead icon="map" title="Rutas curriculares reales" sub={visible.length + ' registros capturados'} />
      <div>{visible.map(item => <div className="lrow" key={item._id}>
        <div className="grow" style={{ minWidth: 0 }}><div className="row center gap-8" style={{ marginBottom: 4 }}><b>{item.materia}</b><Badge tone="blue">{item.nivel}</Badge>{item.grupo && <Badge tone="violet">{item.grupo}</Badge>}</div><div style={{ fontWeight: 600 }}>{item.unidad}</div><div className="faint" style={{ fontSize: 12 }}>{item.periodo || 'Sin periodo'}{item.responsable ? ' · ' + item.responsable : ''}</div>{item.observaciones && <div className="faint" style={{ fontSize: 12, marginTop: 5 }}>{item.observaciones}</div>}<Bar value={Number(item.avance) || 0} height={6} style={{ marginTop: 9 }} /></div>
        <div className="row gap-8"><Badge tone={(Number(item.avance) || 0) >= 80 ? 'green' : (Number(item.avance) || 0) >= 40 ? 'amber' : 'blue'}>{Number(item.avance) || 0}%</Badge><button className="icon-btn" onClick={() => setModal(item)}><Icon name="edit" size={15} /></button><button className="icon-btn danger" onClick={() => remove(item)}><Icon name="trash" size={15} /></button></div>
      </div>)}</div>
    </div>}
    {modal && <AtlasEntryModal entry={modal._id ? modal : null} nivel={nivel} onClose={() => setModal(null)} />}
  </div>;
}
function AtlasDetail({ onBack }) {
  return <div className="content-inner"><button className="btn" onClick={onBack}><Icon name="chevL" size={15} className="btn-ico" />Volver a Atlas</button><div className="card pad" style={{ marginTop: 14 }}>El detalle anterior dependía de datos precargados. Ahora Atlas usa solo rutas reales capturadas.</div></div>;
}
Object.assign(window, { Atlas, AtlasDetail, atlasDB, atlasRealItems });
