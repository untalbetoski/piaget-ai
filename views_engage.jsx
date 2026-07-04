/* views_engage.jsx — Engage real-only: sin temporada, ranking, tienda ni insignias demo */

function engageDB() {
  window.DB = window.DB || {};
  DB.settings = DB.settings || {};
  DB.settings.engageSeason = DB.settings.engageSeason || null;
  DB.engagePlayers = Array.isArray(DB.engagePlayers) ? DB.engagePlayers : [];
  DB.engage_retos = Array.isArray(DB.engage_retos) ? DB.engage_retos : [];
  DB.badges = Array.isArray(DB.badges) ? DB.badges : [];
  DB.rewards = Array.isArray(DB.rewards) ? DB.rewards : [];
  return DB;
}
function engageUid(prefix) { return (prefix || 'eng') + '_' + Date.now() + '_' + Math.random().toString(16).slice(2); }
function engageClean(v) { return String(v || '').trim(); }
function engageRealOnly(arr) { return (arr || []).filter(x => x && x.real !== false && !x.demo && !x.sample && !x.seed); }
function engagePruneDemoSeeds() {
  const db = engageDB();
  db.engagePlayers = engageRealOnly(db.engagePlayers).filter(x => !/^ply-|^demo-|^seed-/i.test(String(x._id || '')));
  db.engage_retos = engageRealOnly(db.engage_retos).filter(x => !/^reto-demo|^seed-|^eng-demo/i.test(String(x._id || '')));
  db.badges = engageRealOnly(db.badges).filter(x => !/^bdg-0\d$/i.test(String(x._id || '')));
  db.rewards = engageRealOnly(db.rewards).filter(x => !/^rw-0\d$/i.test(String(x._id || '')));
  return db;
}
function engageGroups() { return (DB.clases || []).map(c => c.g).filter(Boolean); }
function engageStudents() { return (DB.students || []).filter(s => s && s.real !== false && !s.demo && !s.sample); }
function engageSeason() { const s = engageDB().settings.engageSeason; return s && s.real !== false && !s.demo && !s.sample ? s : null; }
function engagePlayers() { return engageRealOnly(engagePruneDemoSeeds().engagePlayers).sort((a, b) => (Number(b.xp) || 0) - (Number(a.xp) || 0)); }
function engageBadges() { return engageRealOnly(engagePruneDemoSeeds().badges); }
function engageRewards() { return engageRealOnly(engagePruneDemoSeeds().rewards); }
function engageRetos() { return engageRealOnly(engagePruneDemoSeeds().engage_retos); }
function engageSave() { try { Store.saveState && Store.saveState(); } catch (_) {} }
function engageLevel(xp) { xp = Number(xp) || 0; const lvl = Math.max(1, Math.floor(Math.sqrt(xp / 60))); const base = 60 * lvl * lvl, next = 60 * (lvl + 1) * (lvl + 1); return { lvl, pct: Math.max(0, Math.min(100, Math.round((xp - base) / (next - base) * 100))), next: Math.max(0, next - xp) }; }

function EngageSeasonModal({ open, onClose }) {
  const current = engageSeason();
  const [form, setForm] = React.useState(() => current || { name: '', start: '', end: '', totalWeeks: 12, real: true });
  React.useEffect(() => { if (open) setForm(current || { name: '', start: '', end: '', totalWeeks: 12, real: true }); }, [open]);
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function save() {
    if (!engageClean(form.name)) return toast('Captura el nombre de la temporada', 'warn');
    DB.settings.engageSeason = { ...form, name: engageClean(form.name), real: true, updatedAt: new Date().toISOString() };
    engageSave(); toast('Temporada guardada', 'ok'); onClose();
  }
  return <Modal open title="Temporada Engage" width={560} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}>Guardar temporada</button></>}>
    <div className="col" style={{ gap: 12 }}><Field label="Nombre"><TextInput value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Ej. Temporada de lectura" /></Field><div className="field-row"><Field label="Inicio"><input className="inp" type="date" value={form.start || ''} onChange={e => set('start', e.target.value)} /></Field><Field label="Fin"><input className="inp" type="date" value={form.end || ''} onChange={e => set('end', e.target.value)} /></Field></div><Field label="Semanas"><NumberInput min="1" value={form.totalWeeks || 12} onChange={e => set('totalWeeks', e.target.value)} /></Field></div>
  </Modal>;
}
function EngagePlayerModal({ open, entry, onClose }) {
  const [form, setForm] = React.useState(() => entry || { name: '', grade: '', xp: 0, streak: 0, last: '', real: true });
  React.useEffect(() => { if (open) setForm(entry || { name: '', grade: '', xp: 0, streak: 0, last: '', real: true }); }, [open, entry && entry._id]);
  if (!open) return null;
  const groups = engageGroups();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function save() {
    if (!engageClean(form.name)) return toast('Captura el nombre del estudiante', 'warn');
    const list = engageDB().engagePlayers;
    const payload = { ...form, name: engageClean(form.name), grade: engageClean(form.grade), xp: Number(form.xp) || 0, streak: Number(form.streak) || 0, last: engageClean(form.last), real: true, updatedAt: new Date().toISOString() };
    if (entry && entry._id) { const i = list.findIndex(x => x._id === entry._id); if (i >= 0) list[i] = { ...list[i], ...payload }; }
    else list.push({ _id: engageUid('ply'), ...payload });
    engageSave(); toast('Participación guardada', 'ok'); onClose();
  }
  return <Modal open title={entry ? 'Editar participación' : 'Nueva participación'} width={620} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}>Guardar</button></>}>
    <div className="col" style={{ gap: 12 }}><Field label="Estudiante"><TextInput value={form.name || ''} onChange={e => set('name', e.target.value)} list="engage-students" placeholder="Nombre del estudiante" /><datalist id="engage-students">{engageStudents().map(s => <option key={s._id || s.name} value={s.name} />)}</datalist></Field><div className="field-row"><Field label="Grupo"><SelectInput value={form.grade || ''} onChange={e => set('grade', e.target.value)} options={groups.length ? groups : [{ value: '', label: 'Sin grupos reales capturados' }]} /></Field><Field label="Última actividad"><TextInput value={form.last || ''} onChange={e => set('last', e.target.value)} placeholder="Ej. hoy, ayer, 2026-07-04" /></Field></div><div className="field-row"><Field label="XP real"><NumberInput min="0" value={form.xp || 0} onChange={e => set('xp', e.target.value)} /></Field><Field label="Racha real"><NumberInput min="0" value={form.streak || 0} onChange={e => set('streak', e.target.value)} /></Field></div></div>
  </Modal>;
}
function EngageBadgeModal({ open, entry, onClose }) {
  const [form, setForm] = React.useState(() => entry || { name: '', icon: 'star', tone: 'violet', crit: '', otorgadas: 0, real: true });
  React.useEffect(() => { if (open) setForm(entry || { name: '', icon: 'star', tone: 'violet', crit: '', otorgadas: 0, real: true }); }, [open, entry && entry._id]);
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function save() {
    if (!engageClean(form.name)) return toast('Captura el nombre de la insignia', 'warn');
    const list = engageDB().badges;
    const payload = { ...form, name: engageClean(form.name), crit: engageClean(form.crit), otorgadas: Number(form.otorgadas) || 0, real: true, updatedAt: new Date().toISOString() };
    if (entry && entry._id) { const i = list.findIndex(x => x._id === entry._id); if (i >= 0) list[i] = { ...list[i], ...payload }; }
    else list.push({ _id: engageUid('bdg'), ...payload });
    engageSave(); toast('Insignia guardada', 'ok'); onClose();
  }
  return <Modal open title={entry ? 'Editar insignia' : 'Nueva insignia'} width={560} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}>Guardar</button></>}>
    <div className="col" style={{ gap: 12 }}><Field label="Nombre"><TextInput value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Ej. Lector estrella" /></Field><Field label="Criterio"><textarea className="inp" rows="3" value={form.crit || ''} onChange={e => set('crit', e.target.value)} /></Field><Field label="Otorgadas"><NumberInput min="0" value={form.otorgadas || 0} onChange={e => set('otorgadas', e.target.value)} /></Field></div>
  </Modal>;
}
function EngageRewardModal({ open, entry, onClose }) {
  const [form, setForm] = React.useState(() => entry || { name: '', cost: 0, stock: '', canjes: 0, real: true });
  React.useEffect(() => { if (open) setForm(entry || { name: '', cost: 0, stock: '', canjes: 0, real: true }); }, [open, entry && entry._id]);
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function save() {
    if (!engageClean(form.name)) return toast('Captura el nombre de la recompensa', 'warn');
    const list = engageDB().rewards;
    const payload = { ...form, name: engageClean(form.name), cost: Number(form.cost) || 0, stock: form.stock === '' ? null : Number(form.stock) || 0, canjes: Number(form.canjes) || 0, real: true, updatedAt: new Date().toISOString() };
    if (entry && entry._id) { const i = list.findIndex(x => x._id === entry._id); if (i >= 0) list[i] = { ...list[i], ...payload }; }
    else list.push({ _id: engageUid('rw'), ...payload });
    engageSave(); toast('Recompensa guardada', 'ok'); onClose();
  }
  return <Modal open title={entry ? 'Editar recompensa' : 'Nueva recompensa'} width={560} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}>Guardar</button></>}>
    <div className="col" style={{ gap: 12 }}><Field label="Nombre"><TextInput value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Ej. Día sin uniforme" /></Field><div className="field-row"><Field label="Costo XP"><NumberInput min="0" value={form.cost || 0} onChange={e => set('cost', e.target.value)} /></Field><Field label="Stock"><TextInput value={form.stock == null ? '' : form.stock} onChange={e => set('stock', e.target.value)} placeholder="Vacío = ilimitado" /></Field></div><Field label="Canjes reales"><NumberInput min="0" value={form.canjes || 0} onChange={e => set('canjes', e.target.value)} /></Field></div>
  </Modal>;
}
function EngageRetoModal({ open, entry, onClose }) {
  const [form, setForm] = React.useState(() => entry || { title: '', desc: '', scope: '', xp: 0, endsDays: 7, real: true });
  React.useEffect(() => { if (open) setForm(entry || { title: '', desc: '', scope: '', xp: 0, endsDays: 7, real: true }); }, [open, entry && entry._id]);
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function save() {
    if (!engageClean(form.title)) return toast('Captura el nombre del reto', 'warn');
    const list = engageDB().engage_retos;
    const payload = { ...form, title: engageClean(form.title), desc: engageClean(form.desc), scope: engageClean(form.scope), xp: Number(form.xp) || 0, endsDays: Number(form.endsDays) || 0, real: true, updatedAt: new Date().toISOString() };
    if (entry && entry._id) { const i = list.findIndex(x => x._id === entry._id); if (i >= 0) list[i] = { ...list[i], ...payload }; }
    else list.push({ _id: engageUid('reto'), ...payload });
    engageSave(); toast('Reto guardado', 'ok'); onClose();
  }
  return <Modal open title={entry ? 'Editar reto' : 'Nuevo reto'} width={620} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}>Guardar</button></>}>
    <div className="col" style={{ gap: 12 }}><Field label="Título"><TextInput value={form.title || ''} onChange={e => set('title', e.target.value)} /></Field><Field label="Descripción"><textarea className="inp" rows="3" value={form.desc || ''} onChange={e => set('desc', e.target.value)} /></Field><div className="field-row"><Field label="Alcance"><TextInput value={form.scope || ''} onChange={e => set('scope', e.target.value)} placeholder="Ej. Primaria · 3°A" /></Field><Field label="XP"><NumberInput min="0" value={form.xp || 0} onChange={e => set('xp', e.target.value)} /></Field></div><Field label="Termina en días"><NumberInput min="0" value={form.endsDays || 0} onChange={e => set('endsDays', e.target.value)} /></Field></div>
  </Modal>;
}
function Engage({ go, openCopilot }) {
  useStore();
  engagePruneDemoSeeds();
  const [modal, setModal] = React.useState(null);
  const season = engageSeason();
  const players = engagePlayers();
  const badges = engageBadges();
  const rewards = engageRewards();
  const retos = engageRetos();
  const groups = [...new Set(players.map(p => p.grade).filter(Boolean))];
  const xpTotal = players.reduce((a, p) => a + (Number(p.xp) || 0), 0);
  const avgXp = players.length ? Math.round(xpTotal / players.length) : 0;
  function removeFrom(kind, item) {
    if (!confirm('¿Eliminar este registro real de Engage?')) return;
    const db = engageDB();
    const map = { player: 'engagePlayers', badge: 'badges', reward: 'rewards', reto: 'engage_retos' };
    const key = map[kind];
    const i = db[key].findIndex(x => x._id === item._id);
    if (i >= 0) db[key].splice(i, 1);
    engageSave(); toast('Registro eliminado', 'ok');
  }
  return <div className="content-inner">
    <PageHead eyebrow="Principal" title="Engage" desc="Compromiso estudiantil real · sin ranking, copa, tienda ni insignias demo">
      <div className="row gap-8" style={{ flexWrap: 'wrap' }}><button className="btn" onClick={() => setModal({ type: 'season' })}><Icon name="calendar" size={15} className="btn-ico" />Temporada</button><button className="btn primary" onClick={() => setModal({ type: 'player' })}><Icon name="plus" size={15} className="btn-ico" />Registrar XP</button></div>
    </PageHead>
    <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
      <div className="card kpi"><div className="kpi-ico"><Icon name="rocket" size={19} /></div><div className="kpi-label">Temporada</div><div className="kpi-value" style={{ fontSize: 18 }}>{season ? season.name : 'Sin temporada'}</div></div>
      <div className="card kpi"><div className="kpi-ico"><Icon name="users" size={19} /></div><div className="kpi-label">Estudiantes con XP</div><div className="kpi-value tnum">{players.length}</div></div>
      <div className="card kpi"><div className="kpi-ico"><Icon name="zap" size={19} /></div><div className="kpi-label">XP real total</div><div className="kpi-value tnum">{fmtNum ? fmtNum(xpTotal) : xpTotal}</div></div>
      <div className="card kpi"><div className="kpi-ico"><Icon name="award" size={19} /></div><div className="kpi-label">Grupos activos</div><div className="kpi-value tnum">{groups.length}</div></div>
    </div>
    {!season && !players.length && !badges.length && !rewards.length && !retos.length && <div className="card pad" style={{ textAlign: 'center', padding: 34, marginBottom: 18 }}><div className="kpi-ico" style={{ margin: '0 auto 12px' }}><Icon name="spark" size={22} /></div><div style={{ fontWeight: 700, fontSize: 18 }}>Engage sin datos reales</div><div className="faint" style={{ maxWidth: 660, margin: '8px auto 18px', lineHeight: 1.55 }}>Se eliminaron los datos precargados de muestra. Al entrar desde otro navegador, Engage ya no mostrará alumnos, temporadas, recompensas ni insignias inexistentes.</div><div className="row center gap-10" style={{ justifyContent: 'center', flexWrap: 'wrap' }}><button className="btn primary" onClick={() => setModal({ type: 'season' })}>Crear temporada</button><button className="btn" onClick={() => setModal({ type: 'player' })}>Registrar primer XP</button></div></div>}
    <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'start', gap: 16 }}>
      <div className="card"><CardHead icon="users" title="Tabla de participación real" sub={players.length + ' estudiantes registrados'} right={<button className="chip-btn" onClick={() => setModal({ type: 'player' })}>Agregar</button>} /><div>{players.map((p, i) => { const lvl = engageLevel(p.xp); return <div className="lrow" key={p._id}><div style={{ width: 28, textAlign: 'center', fontWeight: 700 }}>{i + 1}</div><Avatar name={p.name} size={38} /><div className="grow" style={{ minWidth: 0 }}><div style={{ fontWeight: 600 }}>{p.name}</div><div className="faint" style={{ fontSize: 12 }}>{p.grade || 'Sin grupo'} · Nivel {lvl.lvl}{p.last ? ' · ' + p.last : ''}</div><Bar value={lvl.pct} height={6} style={{ marginTop: 7 }} /></div><Badge tone="amber"><Icon name="zap" size={12} />{p.streak || 0}d</Badge><span className="font-display tnum" style={{ fontWeight: 700 }}>{fmtNum ? fmtNum(p.xp) : p.xp}</span><button className="icon-btn" onClick={() => setModal({ type: 'player', entry: p })}><Icon name="edit" size={15} /></button><button className="icon-btn danger" onClick={() => removeFrom('player', p)}><Icon name="trash" size={15} /></button></div>; })}{!players.length && <div className="faint" style={{ fontSize: 12.5, padding: '18px 20px' }}>Sin estudiantes con XP real.</div>}</div></div>
      <div className="col gap-16"><div className="card"><CardHead icon="rocket" title="Retos reales" sub={retos.length + ' capturados'} right={<button className="chip-btn" onClick={() => setModal({ type: 'reto' })}>Agregar</button>} /><div>{retos.map(r => <div className="lrow" key={r._id}><div className="grow"><div style={{ fontWeight: 600 }}>{r.title}</div><div className="faint" style={{ fontSize: 12 }}>{r.scope || 'Sin alcance'} · {r.desc || 'Sin descripción'}</div></div><Badge tone="amber">{r.xp || 0} XP</Badge><button className="icon-btn" onClick={() => setModal({ type: 'reto', entry: r })}><Icon name="edit" size={15} /></button><button className="icon-btn danger" onClick={() => removeFrom('reto', r)}><Icon name="trash" size={15} /></button></div>)}{!retos.length && <div className="faint" style={{ fontSize: 12.5, padding: '18px 20px' }}>Sin retos reales.</div>}</div></div><div className="card"><CardHead icon="cart" title="Tienda de puntos real" sub={rewards.length + ' recompensas'} right={<button className="chip-btn" onClick={() => setModal({ type: 'reward' })}>Agregar</button>} /><div>{rewards.map(r => <div className="lrow" key={r._id}><div className="grow"><div style={{ fontWeight: 600 }}>{r.name}</div><div className="faint" style={{ fontSize: 12 }}>{r.canjes || 0} canjes{r.stock != null ? ' · stock ' + r.stock : ' · sin límite'}</div></div><Badge tone="amber">{r.cost || 0} XP</Badge><button className="icon-btn" onClick={() => setModal({ type: 'reward', entry: r })}><Icon name="edit" size={15} /></button><button className="icon-btn danger" onClick={() => removeFrom('reward', r)}><Icon name="trash" size={15} /></button></div>)}{!rewards.length && <div className="faint" style={{ fontSize: 12.5, padding: '18px 20px' }}>Sin recompensas reales.</div>}</div></div><div className="card"><CardHead icon="star" title="Insignias reales" sub={badges.length + ' insignias'} right={<button className="chip-btn" onClick={() => setModal({ type: 'badge' })}>Agregar</button>} /><div>{badges.map(b => <div className="lrow" key={b._id}><div className="grow"><div style={{ fontWeight: 600 }}>{b.name}</div><div className="faint" style={{ fontSize: 12 }}>{b.crit || 'Sin criterio'} · {b.otorgadas || 0} otorgadas</div></div><button className="icon-btn" onClick={() => setModal({ type: 'badge', entry: b })}><Icon name="edit" size={15} /></button><button className="icon-btn danger" onClick={() => removeFrom('badge', b)}><Icon name="trash" size={15} /></button></div>)}{!badges.length && <div className="faint" style={{ fontSize: 12.5, padding: '18px 20px' }}>Sin insignias reales.</div>}</div></div></div>
    </div>
    <EngageSeasonModal open={modal && modal.type === 'season'} onClose={() => setModal(null)} />
    <EngagePlayerModal open={modal && modal.type === 'player'} entry={modal && modal.entry} onClose={() => setModal(null)} />
    <EngageBadgeModal open={modal && modal.type === 'badge'} entry={modal && modal.entry} onClose={() => setModal(null)} />
    <EngageRewardModal open={modal && modal.type === 'reward'} entry={modal && modal.entry} onClose={() => setModal(null)} />
    <EngageRetoModal open={modal && modal.type === 'reto'} entry={modal && modal.entry} onClose={() => setModal(null)} />
  </div>;
}
function EngageRetoWizard(props) { return <EngageRetoModal open={props && props.open} onClose={props && props.onClose ? props.onClose : function(){}} />; }
function EngageRetoTrack({ onClose }) { return <Modal open title="Seguimiento de reto" onClose={onClose} width={520}><div className="faint">El seguimiento anterior dependía de datos demo. Ahora Engage muestra solo retos reales capturados.</div></Modal>; }
function EngagePlayerDrawer() { return null; }
Object.assign(window, { Engage, EngageRetoWizard, EngageRetoTrack, EngageBadgeModal, EngagePlayerDrawer, engageDB, engagePlayers, engageBadges, engageRewards, engageRetos, engagePruneDemoSeeds, engageLevel });
