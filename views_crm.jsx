/* views_crm.jsx — CRM/Contactos real-only: sin prospectos, bandeja ni fuentes demo */

const LEAD_STAGES = ['Prospectos', 'Contactados', 'Visita / Tour', 'Entrevista', 'Inscritos'];
const STAGE_COLORS = { 'Prospectos': 'var(--accent)', 'Contactados': 'var(--cyan)', 'Visita / Tour': 'oklch(0.6 0.15 330)', 'Entrevista': 'var(--violet)', 'Inscritos': 'var(--green)' };
const CRM_DEMO_FAMILIES = new Set(['Familia Salinas','Familia Beltrán','Familia Quintero','Familia Lozano','Familia Estrada','Familia Cabrera','Familia Miranda','Familia Paredes','Familia Zamora','Familia Arredondo','Familia Cisneros','Familia Mota','Familia Villaseñor']);

function crmDB() {
  window.DB = window.DB || {};
  DB.leads = Array.isArray(DB.leads) ? DB.leads : [];
  DB.settings = DB.settings || {};
  return DB;
}
function crmClean(v) { return String(v || '').trim(); }
function crmRealLead(l) {
  if (!l || l.real === false || l.demo || l.sample || l.seed) return false;
  const id = String(l._id || l.id || '').toLowerCase();
  if (/^lead-familia|^demo-|^seed-|^inb-/i.test(id)) return false;
  if (CRM_DEMO_FAMILIES.has(String(l.family || '').trim())) return false;
  return true;
}
function crmPruneDemoLeads() {
  const db = crmDB();
  db.leads = (db.leads || []).filter(crmRealLead);
  try { localStorage.removeItem('piaget_crm_inbox_v1'); localStorage.removeItem('piaget_crm_inbox_fresh_v1'); } catch (_) {}
  return db.leads;
}
function crmLeads() { return crmPruneDemoLeads(); }
function crmNum(n) { return (Number(n) || 0).toLocaleString('es-MX'); }
function crmDateLabel(v) {
  if (!v) return 'Sin contacto';
  if (/hace|recién|ayer|hoy/i.test(String(v))) return String(v);
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}
function crmDays(last) {
  const s = String(last || '');
  const m = /hace\s+(\d+)\s+d[ií]as?/i.exec(s);
  if (m) return Number(m[1]);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return Math.floor((Date.now() - d.getTime()) / 86400000);
  return 0;
}
function crmSave() { try { Store.saveState && Store.saveState(); } catch (_) {} }
function crmAddLead(payload) {
  const clean = { ...payload, family: crmClean(payload.family), child: crmClean(payload.child), stage: payload.stage || 'Prospectos', owner: crmClean(payload.owner) || 'Sin asignar', source: crmClean(payload.source), phone: crmClean(payload.phone), email: crmClean(payload.email), notes: crmClean(payload.notes), score: Math.max(0, Math.min(100, Number(payload.score) || 0)), last: payload.last || 'recién', real: true, updatedAt: new Date().toISOString() };
  if (Store && Store.add) return Store.add('leads', clean);
  DB.leads.push({ _id: 'lead_' + Date.now() + '_' + Math.random().toString(16).slice(2), ...clean });
  crmSave();
}
function crmUpdateLead(id, patch) {
  const clean = { ...patch, real: true, updatedAt: new Date().toISOString() };
  if (Store && Store.update) return Store.update('leads', id, clean);
  const i = DB.leads.findIndex(l => l._id === id);
  if (i >= 0) DB.leads[i] = { ...DB.leads[i], ...clean };
  crmSave();
}
function crmRemoveLead(id) {
  if (Store && Store.remove) return Store.remove('leads', id);
  DB.leads = DB.leads.filter(l => l._id !== id);
  crmSave();
}
function stageBadge(st) { const map = { 'Entrevista': 'violet', 'Visita / Tour': 'cyan', 'Contactados': 'blue', 'Prospectos': 'gray', 'Inscritos': 'green' }; return <Badge tone={map[st] || 'gray'} dot>{st}</Badge>; }
function CRMLeadModal({ open, entry, onClose }) {
  const [form, setForm] = React.useState(() => entry || { family: '', child: '', stage: 'Prospectos', owner: '', score: 50, source: '', phone: '', email: '', notes: '' });
  React.useEffect(() => { if (open) setForm(entry || { family: '', child: '', stage: 'Prospectos', owner: '', score: 50, source: '', phone: '', email: '', notes: '' }); }, [open, entry && entry._id]);
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function save() {
    if (!crmClean(form.family)) return toast('Escribe el nombre de la familia o contacto', 'warn');
    if (entry && entry._id) crmUpdateLead(entry._id, form); else crmAddLead(form);
    toast(entry ? 'Contacto actualizado' : 'Contacto agregado', 'ok');
    onClose();
  }
  return <Modal open title={entry ? 'Editar contacto CRM' : 'Nuevo contacto / prospecto'} width={720} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}>Guardar contacto</button></>}>
    <div className="col" style={{ gap: 12 }}>
      <div className="field-row"><Field label="Familia / contacto"><TextInput value={form.family || ''} onChange={e => set('family', e.target.value)} placeholder="Ej. Familia Hernández" autoFocus /></Field><Field label="Aspirante"><TextInput value={form.child || ''} onChange={e => set('child', e.target.value)} placeholder="Ej. Aspirante a 1° Primaria" /></Field></div>
      <div className="field-row"><Field label="Etapa"><SelectInput value={form.stage || 'Prospectos'} onChange={e => set('stage', e.target.value)} options={LEAD_STAGES} /></Field><Field label="Lead score real"><NumberInput min="0" max="100" value={form.score || 0} onChange={e => set('score', e.target.value)} /></Field></div>
      <div className="field-row"><Field label="Responsable"><TextInput value={form.owner || ''} onChange={e => set('owner', e.target.value)} placeholder="Asesor responsable" /></Field><Field label="Origen real"><TextInput value={form.source || ''} onChange={e => set('source', e.target.value)} placeholder="Web, llamada, referido, evento…" /></Field></div>
      <div className="field-row"><Field label="Teléfono"><TextInput value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></Field><Field label="Correo"><TextInput value={form.email || ''} onChange={e => set('email', e.target.value.toLowerCase())} /></Field></div>
      <Field label="Notas"><textarea className="inp" rows="4" value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Notas reales del seguimiento" /></Field>
    </div>
  </Modal>;
}
function CRMKanban({ leads, moveStage }) {
  const [over, setOver] = React.useState(null);
  return <div style={{ overflowX: 'auto' }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(176px, 1fr))', gap: 10, padding: 16, minWidth: 920, alignItems: 'start' }}>{LEAD_STAGES.map(st => { const col = leads.filter(l => l.stage === st); return <div key={st} onDragOver={e => { e.preventDefault(); setOver(st); }} onDragLeave={() => setOver(o => o === st ? null : o)} onDrop={e => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData('text/plain'); const lead = leads.find(l => l._id === id); if (lead && lead.stage !== st) moveStage(lead, st); }} style={{ background: over === st ? 'var(--accent-soft)' : 'var(--surface-2)', border: '1px solid ' + (over === st ? 'var(--accent)' : 'var(--border)'), borderRadius: 'var(--r-sm)', padding: 8, minHeight: 180 }}><div className="row between center" style={{ padding: '4px 6px 9px' }}><span className="row center" style={{ gap: 7, fontSize: 12, fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: STAGE_COLORS[st] }}></span>{st}</span><span className="faint font-mono tnum" style={{ fontSize: 11 }}>{col.length}</span></div><div className="col" style={{ gap: 7 }}>{col.map(l => <div key={l._id} draggable onDragStart={e => e.dataTransfer.setData('text/plain', l._id)} className="card" style={{ padding: '10px 11px', cursor: 'grab', boxShadow: 'var(--shadow-xs)' }}><div style={{ fontWeight: 600, fontSize: 12.5 }}>{l.family}</div><div className="faint" style={{ fontSize: 11, marginTop: 1 }}>{l.child || 'Sin aspirante'}</div><div className="row center" style={{ gap: 7, marginTop: 8 }}><div className="grow"><Bar value={Number(l.score) || 0} height={4} color={(Number(l.score) || 0) >= 80 ? 'var(--green)' : (Number(l.score) || 0) >= 60 ? 'var(--accent)' : 'var(--amber)'} /></div><span className="tnum font-mono" style={{ fontSize: 10.5, fontWeight: 600 }}>{Number(l.score) || 0}</span></div><div className="row between center" style={{ marginTop: 7 }}><span className="faint" style={{ fontSize: 10.5 }}>{l.owner || 'Sin asignar'}</span><span className="faint font-mono" style={{ fontSize: 10, color: crmDays(l.last) >= 10 ? 'var(--red)' : '' }}>{crmDateLabel(l.last)}</span></div></div>)}{!col.length && <div className="faint" style={{ fontSize: 11, textAlign: 'center', padding: '18px 0' }}>Sin contactos</div>}</div></div>; })}</div></div>;
}
function CRM({ go }) {
  useStore();
  const [modal, setModal] = React.useState(null);
  const [view, setView] = React.useState(() => { try { return localStorage.getItem('piaget_crm_view') || 'tabla'; } catch (_) { return 'tabla'; } });
  const [stageFilter, setStageFilter] = React.useState('Todas');
  const leads = crmLeads();
  const shown = stageFilter === 'Todas' ? leads : leads.filter(l => l.stage === stageFilter);
  const inscritos = leads.filter(l => l.stage === 'Inscritos').length;
  const activos = leads.length - inscritos;
  const conv = leads.length ? Math.round(inscritos / leads.length * 100) : 0;
  const cold = leads.filter(l => l.stage !== 'Inscritos' && crmDays(l.last) >= 10);
  const sources = Object.entries(leads.reduce((acc, l) => { const s = crmClean(l.source) || 'Sin origen'; acc[s] = (acc[s] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);
  const setViewMode = v => { setView(v); try { localStorage.setItem('piaget_crm_view', v); } catch (_) {} };
  function moveStage(lead, stage) { crmUpdateLead(lead._id, { stage, last: 'recién' }); toast(lead.family + ' → ' + stage, 'info'); }
  function contactLead(l) { crmUpdateLead(l._id, { last: 'recién' }); toast('Contacto registrado', 'ok'); }
  function removeLead(l) { if (!confirm('¿Eliminar este contacto/prospecto real?')) return; crmRemoveLead(l._id); toast('Contacto eliminado', 'warn'); }
  return <div className="content-inner">
    <div className="page-head"><div><div className="eyebrow" style={{ marginBottom: 7 }}>CRM y Contactos</div><h1 className="page-title">Admisiones</h1><p className="page-desc">{leads.length} contactos reales · conversión <b style={{ color: 'var(--text)' }}>{conv}%</b> · inscritos <b style={{ color: 'var(--text)' }}>{inscritos}</b></p></div><div className="page-actions"><button className="btn primary" onClick={() => setModal({})}><Icon name="plus" size={15} className="btn-ico" />Nuevo contacto</button></div></div>
    <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>{[{ label: 'Contactos activos', value: crmNum(activos), icon: 'users', tone: 'blue' }, { label: 'Conversión real', value: conv + '%', icon: 'target', tone: 'violet' }, { label: 'Inscritos reales', value: String(inscritos), icon: 'cap', tone: 'green' }, { label: 'Fríos +10 días', value: String(cold.length), icon: 'alert', tone: 'amber' }].map((k, i) => { const t = window.TONE[k.tone]; return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div><div className="kpi-foot"><span className="muted">datos reales</span></div></div>; })}</div>
    {!leads.length && <div className="card pad mt-16" style={{ textAlign: 'center', padding: 34 }}><div className="kpi-ico" style={{ margin: '0 auto 12px' }}><Icon name="funnel" size={22} /></div><div style={{ fontWeight: 700, fontSize: 18 }}>CRM sin contactos reales</div><div className="faint" style={{ maxWidth: 680, margin: '8px auto 18px', lineHeight: 1.55 }}>Se eliminaron los prospectos y la bandeja demo. Al entrar desde otro navegador ya no se cargarán familias inexistentes.</div><button className="btn primary" onClick={() => setModal({})}>Capturar primer contacto</button></div>}
    <div className="grid mt-16" style={{ gridTemplateColumns: '1.5fr 1fr' }}><div className="card pad"><div className="row between center" style={{ marginBottom: 18 }}><div><div className="card-title"><Icon name="funnel" className="ico" size={17} />Funnel real</div><div className="card-sub">Contactos capturados por etapa</div></div><Badge tone="green">{conv}% global</Badge></div><div className="col gap-8">{LEAD_STAGES.map((stage, i) => { const count = leads.filter(l => l.stage === stage).length; const max = Math.max(1, ...LEAD_STAGES.map(s => leads.filter(l => l.stage === s).length)); return <div key={stage} className="row center gap-12"><span style={{ width: 96, fontSize: 13, fontWeight: 500 }}>{stage}</span><div className="grow" style={{ height: 28, background: 'var(--surface-2)', borderRadius: 9, overflow: 'hidden' }}><div style={{ width: (count / max * 100) + '%', minWidth: count ? 34 : 0, height: '100%', background: STAGE_COLORS[stage], display: 'flex', alignItems: 'center', paddingLeft: count ? 10 : 0 }}><span className="font-display tnum" style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{count || ''}</span></div></div></div>; })}</div></div><div className="card"><CardHead icon="pie" title="Origen real de contactos" sub="Atribución capturada" /><div className="card pad" style={{ borderTop: 'none' }}>{sources.length ? <div className="col gap-10">{sources.map(([s, n]) => <div key={s} className="row center gap-12"><span className="grow" style={{ fontSize: 13 }}>{s}</span><Badge tone="blue">{n}</Badge></div>)}</div> : <div className="faint" style={{ textAlign: 'center', padding: 22 }}>Sin origen real capturado.</div>}</div></div></div>
    <div className="card mt-16"><CardHead icon="heart" title="Pipeline de admisiones" sub="Contactos reales" right={<div className="row center" style={{ gap: 9 }}>{view === 'tabla' && <select className="inp" style={{ height: 32, padding: '0 8px', fontSize: 12.5, width: 130 }} value={stageFilter} onChange={e => setStageFilter(e.target.value)}>{['Todas', ...LEAD_STAGES].map(s => <option key={s} value={s}>{s}</option>)}</select>}<div className="seg">{[['tabla', 'Tabla'], ['kanban', 'Kanban']].map(([v, l]) => <button key={v} className={view === v ? 'active' : ''} onClick={() => setViewMode(v)}>{l}</button>)}</div></div>} />{view === 'kanban' ? <CRMKanban leads={leads} moveStage={moveStage} /> : <div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Familia / contacto</th><th>Aspirante</th><th>Etapa</th><th>Lead score</th><th>Responsable</th><th>Último contacto</th></tr></thead><tbody>{shown.map(l => <tr key={l._id}><td><div className="person"><Avatar name={l.family} size={32} /><div><div className="pname">{l.family}</div>{l.source && <div className="faint" style={{ fontSize: 11 }}>{l.source}</div>}</div></div></td><td className="muted">{l.child || '—'}</td><td><select className="inp" style={{ height: 32, padding: '0 8px', fontSize: 12.5, width: 138 }} value={l.stage || 'Prospectos'} onChange={e => moveStage(l, e.target.value)}>{LEAD_STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select></td><td><div className="row center gap-8"><div style={{ width: 56 }}><Bar value={Number(l.score) || 0} height={6} color={(Number(l.score) || 0) >= 80 ? 'var(--green)' : (Number(l.score) || 0) >= 60 ? 'var(--accent)' : 'var(--amber)'} /></div><span className="tnum font-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{Number(l.score) || 0}</span></div></td><td>{l.owner || <span className="faint" style={{ fontStyle: 'italic' }}>Sin asignar</span>}</td><td><div className="row between center gap-8"><span className="muted" style={{ fontSize: 12.5, color: crmDays(l.last) >= 10 ? 'var(--red)' : '' }}>{crmDateLabel(l.last)}</span><RowMenu items={[{ icon: 'edit', label: 'Editar', onClick: () => setModal(l) }, { icon: 'send', label: 'Contactar', onClick: () => contactLead(l) }, { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => removeLead(l) }]} /></div></td></tr>)}{!shown.length && <tr><td colSpan={6} className="faint" style={{ textAlign: 'center', padding: 24 }}>Sin contactos reales en esta etapa.</td></tr>}</tbody></table></div>}</div>
    <CRMLeadModal open={!!modal} entry={modal && modal._id ? modal : null} onClose={() => setModal(null)} />
  </div>;
}
Object.assign(window, { CRM, crmLeads, crmPruneDemoLeads, crmRealLead });
