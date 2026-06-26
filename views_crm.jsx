/* views_crm.jsx — Módulo CRM y Admisiones: kanban + tabla, bandeja, reactivación IA y contactos */

/* ============ utilidades ============ */
function crmHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991; return h; }
function crmDays(last) { const m = /hace (\d+) días?/.exec(last || ''); return m ? Number(m[1]) : 0; }

async function crmClaudeJSON(prompt) {
  if (!(window.claude && window.claude.complete)) return null;
  try {
    const out = await window.claude.complete(prompt);
    const a = out.indexOf('['), o = out.indexOf('{');
    const start = (a >= 0 && (o < 0 || a < o)) ? a : o;
    const end = Math.max(out.lastIndexOf(']'), out.lastIndexOf('}'));
    if (start < 0 || end <= start) return null;
    return JSON.parse(out.slice(start, end + 1));
  } catch (e) { return null; }
}

/* ============ ampliación de datos demo (idempotente, sobrevive a localStorage previo) ============ */
(function () {
  const extra = [
    { family: 'Familia Salinas', child: 'Aspirante a Kínder', stage: 'Visita / Tour', score: 71, owner: 'Daniela Soto', last: 'hace 12 días' },
    { family: 'Familia Beltrán', child: 'Aspirante a 2° Prim.', stage: 'Entrevista', score: 84, owner: 'Pablo Lira', last: 'hace 10 días' },
    { family: 'Familia Quintero', child: 'Aspirante a 4° Prim.', stage: 'Contactados', score: 58, owner: 'Daniela Soto', last: 'hace 2 días' },
    { family: 'Familia Lozano', child: 'Aspirante a Kínder', stage: 'Prospectos', score: 35, owner: 'Sin asignar', last: 'hace 1 día' },
    { family: 'Familia Estrada', child: 'Aspirante a 6° Prim.', stage: 'Visita / Tour', score: 76, owner: 'Pablo Lira', last: 'hace 16 días' },
    { family: 'Familia Cabrera', child: 'Aspirante a 1° Prim.', stage: 'Inscritos', score: 96, owner: 'Daniela Soto', last: 'hace 3 días' },
    { family: 'Familia Miranda', child: 'Aspirante a 3° Prim.', stage: 'Contactados', score: 62, owner: 'Daniela Soto', last: 'hace 4 días' },
    { family: 'Familia Paredes', child: 'Aspirante a Kínder', stage: 'Entrevista', score: 90, owner: 'Pablo Lira', last: 'hace 13 días' },
    { family: 'Familia Zamora', child: 'Aspirante a 5° Prim.', stage: 'Prospectos', score: 44, owner: 'Sin asignar', last: 'hace 6 días' },
  ];
  const have = new Set((DB.leads || []).map(l => l.family));
  const add = extra.filter(e => !have.has(e.family)).map(e => ({ _id: 'lead-' + e.family.toLowerCase().replace(/[^a-z]/g, ''), ...e }));
  if (!window.PIAGET_FRESH && add.length) DB.leads = [...(DB.leads || []), ...add];
})();

/* ============ bandeja de admisiones (persistida) ============ */
const CRM_INBOX_KEY = window.PIAGET_FRESH ? 'piaget_crm_inbox_fresh_v1' : 'piaget_crm_inbox_v1';
function crmInboxSeed() {
  if (window.PIAGET_FRESH) return [];
  return [
    { id: 'inb-1', family: 'Familia Arredondo', child: 'Aspirante a Kínder', source: 'Formulario web', time: 'hace 20 min', score: 50 },
    { id: 'inb-2', family: 'Familia Cisneros', child: 'Aspirante a 3° Prim.', source: 'Open House', time: 'hace 2 h', score: 65 },
    { id: 'inb-3', family: 'Familia Mota', child: 'Aspirante a 1° Prim.', source: 'Llamada', time: 'ayer', score: 55 },
    { id: 'inb-4', family: 'Familia Villaseñor', child: 'Aspirante a 5° Prim.', source: 'Instagram', time: 'ayer', score: 45 },
  ];
}
function crmLoadInbox() {
  try { const v = JSON.parse(localStorage.getItem(CRM_INBOX_KEY) || 'null'); if (Array.isArray(v)) return v; } catch (e) { }
  return crmInboxSeed();
}
function crmSaveInbox(v) { try { localStorage.setItem(CRM_INBOX_KEY, JSON.stringify(v)); } catch (e) { } }

/* ============ reactivación con IA ============ */
function crmColdLeads() {
  return (DB.leads || []).filter(l => l.stage !== 'Inscritos' && crmDays(l.last) >= 10);
}
function crmReactivateFallback(l) {
  if (l.stage === 'Entrevista') return l.family.replace('Familia ', 'Familia ') + ', su entrevista quedó pendiente de agenda. Tenemos espacios este jueves y viernes; nos encantaría retomar el proceso de su ' + l.child.toLowerCase() + '.';
  if (l.stage === 'Visita / Tour') return 'Los esperamos para conocer el campus: este sábado hay tour guiado a las 10:00 y su ' + l.child.toLowerCase() + ' puede entrar a una clase muestra.';
  return 'Seguimos a sus órdenes en el proceso de admisión. ¿Les gustaría agendar una visita esta semana para resolver dudas?';
}
async function crmReactivateAI(leads) {
  const fb = leads.map(crmReactivateFallback);
  const p = 'Eres el equipo de admisiones de ' + DB.school.name + '. Redacta un mensaje de reactivación personalizado (máx 35 palabras, tono cálido, en español) para cada familia que dejó de responder:\n' +
    leads.map((l, i) => i + '. ' + l.family + ' — ' + l.child + ' — etapa: ' + l.stage + ' — último contacto: ' + l.last).join('\n') +
    '\nResponde ÚNICAMENTE JSON: [{"idx":0,"mensaje":"..."}] (uno por familia, en orden).';
  const r = await crmClaudeJSON(p);
  if (Array.isArray(r) && r.length) {
    return leads.map((l, i) => {
      const hit = r.find(x => x.idx === i) || r[i];
      return hit && hit.mensaje ? String(hit.mensaje) : fb[i];
    });
  }
  return fb;
}

/* ============ funnel ============ */
function Funnel({ stages }) {
  const max = stages[0].value || 1;
  return (
    <div className="col gap-8">
      {stages.map((s, i) => {
        const pct = s.value / max * 100;
        const conv = i === 0 ? 100 : (stages[i - 1].value ? Math.round(s.value / stages[i - 1].value * 100) : 0);
        return (
          <div key={i} className="row center gap-12">
            <span style={{ width: 96, fontSize: 13, fontWeight: 500 }}>{s.stage}</span>
            <div className="grow" style={{ position: 'relative', height: 40 }}>
              <div style={{
                width: pct + '%', height: '100%', background: s.color, borderRadius: 9,
                display: 'flex', alignItems: 'center', paddingLeft: 14, minWidth: 64,
                transition: 'width 0.6s cubic-bezier(.2,.7,.2,1)',
                boxShadow: '0 4px 12px -6px ' + 'color-mix(in oklch,' + s.color + ', transparent 40%)'
              }}>
                <span className="font-display tnum" style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>{s.value}</span>
              </div>
            </div>
            <span className="tnum font-mono faint" style={{ width: 44, fontSize: 12, textAlign: 'right' }}>{conv}%</span>
          </div>
        );
      })}
    </div>
  );
}

function stageBadge(st) {
  const map = { 'Entrevista': 'violet', 'Visita / Tour': 'cyan', 'Contactados': 'blue', 'Prospectos': 'gray', 'Inscritos': 'green' };
  return <Badge tone={map[st] || 'gray'} dot>{st}</Badge>;
}
const LEAD_STAGES = ['Prospectos', 'Contactados', 'Visita / Tour', 'Entrevista', 'Inscritos'];
const STAGE_COLORS = { 'Prospectos': 'var(--accent)', 'Contactados': 'var(--cyan)', 'Visita / Tour': 'oklch(0.6 0.15 330)', 'Entrevista': 'var(--violet)', 'Inscritos': 'var(--green)' };

/* ============ kanban ============ */
function CRMKanban({ leads, moveStage }) {
  const [over, setOver] = React.useState(null);
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(176px, 1fr))', gap: 10, padding: 16, minWidth: 920, alignItems: 'start' }}>
        {LEAD_STAGES.map(st => {
          const col = leads.filter(l => l.stage === st);
          return (
            <div key={st}
              onDragOver={e => { e.preventDefault(); setOver(st); }}
              onDragLeave={() => setOver(o => o === st ? null : o)}
              onDrop={e => {
                e.preventDefault(); setOver(null);
                const id = e.dataTransfer.getData('text/plain');
                const lead = leads.find(l => l._id === id);
                if (lead && lead.stage !== st) moveStage(lead, st);
              }}
              style={{
                background: over === st ? 'var(--accent-soft)' : 'var(--surface-2)',
                border: '1px solid ' + (over === st ? 'var(--accent)' : 'var(--border)'),
                borderRadius: 'var(--r-sm)', padding: 8, minHeight: 180, transition: 'background 0.15s, border-color 0.15s'
              }}>
              <div className="row between center" style={{ padding: '4px 6px 9px' }}>
                <span className="row center" style={{ gap: 7, fontSize: 12, fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: STAGE_COLORS[st] }}></span>{st}
                </span>
                <span className="faint font-mono tnum" style={{ fontSize: 11 }}>{col.length}</span>
              </div>
              <div className="col" style={{ gap: 7 }}>
                {col.map(l => (
                  <div key={l._id} draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', l._id)}
                    className="card"
                    style={{ padding: '10px 11px', cursor: 'grab', boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{l.family}</div>
                    <div className="faint" style={{ fontSize: 11, marginTop: 1 }}>{l.child}</div>
                    <div className="row center" style={{ gap: 7, marginTop: 8 }}>
                      <div className="grow"><Bar value={l.score} height={4} color={l.score >= 80 ? 'var(--green)' : l.score >= 60 ? 'var(--accent)' : 'var(--amber)'} /></div>
                      <span className="tnum font-mono" style={{ fontSize: 10.5, fontWeight: 600 }}>{l.score}</span>
                    </div>
                    <div className="row between center" style={{ marginTop: 7 }}>
                      <span className="faint" style={{ fontSize: 10.5 }}>{l.owner === 'Sin asignar' ? '—' : l.owner.split(' ')[0]}</span>
                      <span className="faint font-mono" style={{ fontSize: 10, color: crmDays(l.last) >= 10 ? 'var(--red)' : '' }}>{l.last}</span>
                    </div>
                  </div>
                ))}
                {!col.length && <div className="faint" style={{ fontSize: 11, textAlign: 'center', padding: '18px 0' }}>Arrastra aquí</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ vista principal CRM ============ */
function CRM({ go }) {
  const d = DB;
  const store = useStore();
  const [modal, setModal] = React.useState(false);
  const [form, setForm] = React.useState({ family: '', child: '', stage: 'Prospectos', owner: 'Daniela Soto', score: 50 });
  const [view, setView] = React.useState(() => { try { return localStorage.getItem('piaget_crm_view') || 'tabla'; } catch (e) { return 'tabla'; } });
  const [stageFilter, setStageFilter] = React.useState('Todas');
  const [inbox, setInbox] = React.useState(crmLoadInbox);
  const [inboxOpen, setInboxOpen] = React.useState(false);
  const [reactPhase, setReactPhase] = React.useState(-1);   // -1 idle, 0..2 generando
  const [summary, setSummary] = React.useState(null);       // [{lead, mensaje}]

  const setViewMode = (v) => { setView(v); try { localStorage.setItem('piaget_crm_view', v); } catch (e) { } };
  const leads = d.leads || [];
  const shown = stageFilter === 'Todas' ? leads : leads.filter(l => l.stage === stageFilter);
  const cold = crmColdLeads();
  const inscritos = leads.filter(l => l.stage === 'Inscritos').length;
  const activos = leads.length - inscritos;
  const conv = leads.length ? Math.round(inscritos / leads.length * 100) : 0;
  const avgAnual = (window.cobNivel && window.cobTotalAnio)
    ? Math.round(['Preescolar', 'Primaria', 'Secundaria'].reduce((a, n) => a + window.cobTotalAnio(window.cobNivel(n), '10'), 0) / 3)
    : 45000;
  const pipeValue = activos * avgAnual;
  const funnelData = LEAD_STAGES.map(stage => ({ stage, value: leads.filter(l => l.stage === stage).length, color: STAGE_COLORS[stage] }));
  const hasLeadSources = !window.PIAGET_FRESH && leads.length > 0;

  function saveLead() {
    if (!form.family.trim()) { toast('Escribe el nombre de la familia', 'warn'); return; }
    Store.add('leads', { ...form, score: Number(form.score), last: 'recién' });
    Store.log('Admisiones', 'registró a ' + form.family + ' en el pipeline', 'funnel');
    toast('Prospecto agregado ✓');
    setForm({ family: '', child: '', stage: 'Prospectos', owner: 'Daniela Soto', score: 50 });
    setModal(false);
  }
  function moveStage(lead, stage) {
    Store.update('leads', lead._id, { stage, last: 'recién' });
    if (stage === 'Inscritos') { Store.log('Admisiones', 'inscribió a ' + lead.family, 'cap'); toast('¡' + lead.family + ' inscrita! 🎉'); }
    else toast(lead.family + ' → ' + stage, 'info');
  }
  function acceptInbox(it) {
    Store.add('leads', { family: it.family, child: it.child, stage: 'Prospectos', owner: 'Sin asignar', score: it.score, last: 'recién' });
    Store.log('Admisiones', 'aceptó solicitud de ' + it.family + ' (' + it.source + ')', 'inbox');
    setInbox(v => { const n = v.filter(x => x.id !== it.id); crmSaveInbox(n); return n; });
    toast(it.family + ' agregada al pipeline ✓');
  }
  function dismissInbox(it) {
    setInbox(v => { const n = v.filter(x => x.id !== it.id); crmSaveInbox(n); return n; });
    toast('Solicitud descartada', 'warn');
  }

  async function reactivate() {
    if (reactPhase >= 0 || !cold.length) return;
    setReactPhase(0);
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    delay(800).then(() => setReactPhase(p => p >= 0 ? 1 : p));
    delay(1700).then(() => setReactPhase(p => p >= 0 ? 2 : p));
    const targets = cold.slice();
    const [msgs] = await Promise.all([crmReactivateAI(targets), delay(2500)]);
    targets.forEach(l => Store.update('leads', l._id, { last: 'recién' }));
    Store.log('Copilot', 'reactivó a ' + targets.length + ' familias del pipeline', 'send');
    setReactPhase(-1);
    setSummary(targets.map((l, i) => ({ lead: l, mensaje: msgs[i] })));
    toast('Seguimiento enviado a ' + targets.length + ' familias ✓');
  }

  const reactSteps = ['Analizando ' + cold.length + ' familias frías…', 'Redactando mensajes personalizados…', 'Enviando por App y Correo…'];

  return (
    <div className="content-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 7 }}>CRM y Admisiones</div>
          <h1 className="page-title">Admisiones</h1>
          <p className="page-desc">{leads.length} procesos en pipeline· conversión global <b style={{ color: 'var(--text)' }}>{conv}%</b> · inscritos <b style={{ color: 'var(--text)' }}>{inscritos}</b></p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => setInboxOpen(true)}>
            <Icon name="inbox" size={15} className="btn-ico" />Bandeja
            {inbox.length > 0 && <span className="nav-badge" style={{ marginLeft: 7 }}>{inbox.length}</span>}
          </button>
          <button className="btn primary" onClick={() => setModal(true)}><Icon name="plus" size={15} className="btn-ico" />Nuevo prospecto</button>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Prospectos activos', value: fmtNum(activos), icon: 'users', tone: 'blue', delta: 0 },
          { label: 'Tasa de conversión', value: conv + '%', icon: 'target', tone: 'violet', delta: 0 },
          { label: 'Inscritos', value: String(inscritos), icon: 'cap', tone: 'green', delta: 0 },
          { label: 'Valor del pipeline', value: '$' + fmtShort(pipeValue), icon: 'wallet', tone: 'cyan', delta: 0 },
        ].map((k, i) => {
          const t = window.TONE[k.tone];
          return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum">{k.value}</div>
              <div className="kpi-foot"><Delta value={k.delta} /><span className="muted">este ciclo</span></div>
            </div>
          );
        })}
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card pad">
          <div className="row between center" style={{ marginBottom: 18 }}>
            <div><div className="card-title"><Icon name="funnel" className="ico" size={17} />Funnel de conversión</div><div className="card-sub">De prospecto a inscripción</div></div>
            <Badge tone="green">{conv}% global</Badge>
          </div>
          <Funnel stages={funnelData} />
        </div>

        <div className="card">
          <CardHead icon="pie" title="Origen de prospectos" sub="Atribución del ciclo" />
          <div className="card pad row gap-16 center" style={{ borderTop: 'none', gap: 24 }}>
            {!hasLeadSources ? (
              <div className="col center gap-8 faint" style={{ padding: 28, textAlign: 'center', width: '100%' }}>
                <Icon name="pie" size={28} stroke={1.4} />
                <span style={{ fontSize: 13 }}>Aún no hay prospectos para atribuir su origen.</span>
              </div>
            ) : (<>
            <Donut size={140} thickness={18} segments={d.leadSources}
              center={<div><div className="font-display" style={{ fontSize: 22, fontWeight: 600 }}>{fmtNum(leads.length)}</div><div className="faint" style={{ fontSize: 10.5 }}>prospectos</div></div>} />
            <div className="grow col gap-12">
              {d.leadSources.map((s, i) => (
                <div key={i} className="row center gap-12">
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                  <span className="grow" style={{ fontSize: 13 }}>{s.label}</span>
                  <span className="tnum" style={{ fontWeight: 600, fontSize: 13 }}>{s.value}%</span>
                </div>
              ))}
            </div>
            </>)}
          </div>
        </div>
      </div>

      {/* Pipeline: tabla / kanban */}
      <div className="card mt-16">
        <CardHead icon="heart" title="Pipeline de admisiones" sub="Lead scoring por IA — probabilidad de inscripción"
          right={<div className="row center" style={{ gap: 9 }}>
            {view === 'tabla' && (
              <select className="inp" style={{ height: 32, padding: '0 8px', fontSize: 12.5, width: 130 }}
                value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
                {['Todas', ...LEAD_STAGES].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <div className="seg">
              {[['tabla', 'Tabla'], ['kanban', 'Kanban']].map(([v, l]) => (
                <button key={v} className={view === v ? 'active' : ''} onClick={() => setViewMode(v)}>{l}</button>
              ))}
            </div>
          </div>} />

        {view === 'kanban' ? (
          <CRMKanban leads={leads} moveStage={moveStage} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Familia</th><th>Aspirante</th><th>Etapa</th><th>Lead score</th><th>Responsable</th><th>Último contacto</th></tr></thead>
              <tbody>
                {shown.map((l) => (
                  <tr key={l._id}>
                    <td><div className="person"><Avatar name={l.family} size={32} /><div className="pname">{l.family}</div></div></td>
                    <td className="muted">{l.child}</td>
                    <td>
                      <select className="inp" style={{ height: 32, padding: '0 8px', fontSize: 12.5, width: 138 }}
                        value={l.stage} onChange={e => moveStage(l, e.target.value)}>
                        {LEAD_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="row center gap-8">
                        <div style={{ width: 56 }}><Bar value={l.score} height={6} color={l.score >= 80 ? 'var(--green)' : l.score >= 60 ? 'var(--accent)' : 'var(--amber)'} /></div>
                        <span className="tnum font-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{l.score}</span>
                      </div>
                    </td>
                    <td>{l.owner === 'Sin asignar' ? <span className="faint" style={{ fontStyle: 'italic' }}>Sin asignar</span> : <span className="muted">{l.owner}</span>}</td>
                    <td>
                      <div className="row between center gap-8">
                        <span className="muted" style={{ fontSize: 12.5, color: crmDays(l.last) >= 10 ? 'var(--red)' : '' }}>{l.last}</span>
                        <RowMenu items={[
                          { icon: 'send', label: 'Contactar', onClick: () => { Store.update('leads', l._id, { last: 'recién' }); toast('Contacto registrado'); } },
                          { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => { Store.remove('leads', l._id); toast('Prospecto eliminado', 'warn'); } },
                        ]} />
                      </div>
                    </td>
                  </tr>
                ))}
                {!shown.length && <tr><td colSpan={6} className="faint" style={{ textAlign: 'center', padding: 24 }}>Sin prospectos en esta etapa.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reactivación con IA */}
      <div className="ai-panel mt-16">
        {cold.length > 0 ? (
          <div className="insight" style={{ borderTop: 'none', alignItems: 'center' }}>
            <div className="ai-orb" style={{ width: 34, height: 34 }}><Icon name="spark" size={18} fill="currentColor" /></div>
            <div className="insight-body">
              <div className="insight-title">{cold.length} prospectos en riesgo de enfriarse</div>
              <div className="insight-text">Llevan <b>+10 días sin contacto</b> en etapa activa. Copilot redacta y envía un seguimiento personalizado a cada familia en un clic.</div>
              {reactPhase >= 0 && (
                <div className="col" style={{ gap: 7, marginTop: 10 }}>
                  {reactSteps.map((s, i) => (
                    <div key={i} className="row center" style={{ gap: 8, fontSize: 12.5, opacity: i <= reactPhase ? 1 : 0.38 }}>
                      {i < reactPhase
                        ? <span style={{ color: 'var(--green)', display: 'inline-flex' }}><Icon name="checkCircle" size={14} /></span>
                        : <span className="ai-orb" style={{ width: 14, height: 14, borderRadius: 5 }}><Icon name="spark" size={8} fill="currentColor" /></span>}
                      <span style={{ fontWeight: i === reactPhase ? 600 : 400 }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {reactPhase < 0 && <button className="btn primary nowrap" onClick={reactivate}><Icon name="send" size={15} className="btn-ico" />Reactivar con IA</button>}
          </div>
        ) : (
          <div className="insight" style={{ borderTop: 'none', alignItems: 'center' }}>
            <div className="insight-ico" style={{ background: window.TONE.green.bg, color: window.TONE.green.c, width: 34, height: 34 }}><Icon name="checkCircle" size={17} /></div>
            <div className="insight-body">
              <div className="insight-title">Pipeline al día</div>
              <div className="insight-text">Ningún prospecto lleva más de 10 días sin contacto. Copilot vigilará y te avisará si alguno se enfría.</div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: nuevo prospecto */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo prospecto"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={saveLead}><Icon name="check" size={15} className="btn-ico" />Guardar</button></>}>
        <Field label="Familia"><TextInput value={form.family} onChange={e => setForm({ ...form, family: e.target.value })} placeholder="Familia Pérez" autoFocus /></Field>
        <Field label="Aspirante"><TextInput value={form.child} onChange={e => setForm({ ...form, child: e.target.value })} placeholder="Aspirante a 1° Primaria" /></Field>
        <div className="field-row">
          <Field label="Etapa"><SelectInput value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} options={LEAD_STAGES} /></Field>
          <Field label="Responsable"><SelectInput value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} options={['Daniela Soto', 'Pablo Lira', 'Sin asignar']} /></Field>
        </div>
        <Field label={'Lead score: ' + form.score}><input type="range" min="0" max="100" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} /></Field>
      </Modal>

      {/* Modal: bandeja */}
      <Modal open={inboxOpen} onClose={() => setInboxOpen(false)} title="Bandeja de admisiones" width={560}
        footer={<><span className="faint grow" style={{ fontSize: 11.5 }}>Solicitudes entrantes de web, eventos y llamadas.</span><button className="btn" onClick={() => setInboxOpen(false)}>Cerrar</button></>}>
        {inbox.length === 0 ? (
          <div className="faint" style={{ textAlign: 'center', padding: '22px 0', fontSize: 13 }}>Bandeja vacía: todas las solicitudes fueron procesadas.</div>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {inbox.map(it => (
              <div key={it.id} className="row center" style={{ gap: 11, border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '11px 13px' }}>
                <Avatar name={it.family} size={36} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{it.family}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{it.child} · {it.source} · {it.time}</div>
                </div>
                <button className="btn sm" onClick={() => dismissInbox(it)}>Descartar</button>
                <button className="btn primary sm" onClick={() => acceptInbox(it)}><Icon name="plus" size={13} className="btn-ico" />Aceptar</button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal: resumen de reactivación */}
      <Modal open={!!summary} onClose={() => setSummary(null)} title="Reactivación enviada" width={640}
        footer={<><span className="faint grow" style={{ fontSize: 11.5 }}>Enviado por App y Correo. Copilot puede cometer errores; revisa los hilos en Mensajería.</span><button className="btn primary" onClick={() => setSummary(null)}>Listo</button></>}>
        <div className="col" style={{ gap: 10 }}>
          {(summary || []).map((s, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '12px 14px' }}>
              <div className="row between center" style={{ gap: 10, marginBottom: 8 }}>
                <div className="row center" style={{ gap: 10, minWidth: 0 }}>
                  <Avatar name={s.lead.family} size={30} />
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{s.lead.family}</span>
                </div>
                <div className="row center" style={{ gap: 6, flexShrink: 0 }}>
                  {stageBadge(s.lead.stage)}
                  <Badge tone="green" dot>Enviado</Badge>
                </div>
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 12px' }}>{s.mensaje}</div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

/* ============ Contactos (directorio funcional, datos estables) ============ */
const CRM_CONTACTS_KEY = window.PIAGET_FRESH ? 'piaget_crm_contacts_fresh_v1' : 'piaget_crm_contacts_v1';
function crmPhone(seed) { const h = crmHash(seed); return '55 ' + (1000 + h % 9000) + ' ' + (1000 + (h >> 3) % 9000); }
function crmContactsSeed() {
  if (window.PIAGET_FRESH) return [];
  const fromLeads = (DB.leads || []).slice(0, 6).map(l => ({
    id: 'ct-' + l.family.toLowerCase().replace(/[^a-z]/g, ''),
    name: l.family, type: 'Prospecto',
    email: l.family.toLowerCase().replace(/[^a-z]/g, '') + '@correo.com',
    phone: crmPhone(l.family), owner: l.owner === 'Sin asignar' ? 'Admisiones' : l.owner,
  }));
  const fams = (DB.students || []).slice(0, 4).map(s => {
    const fam = 'Familia ' + s.name.split(' ')[1];
    return { id: 'ct-' + fam.toLowerCase().replace(/[^a-z]/g, ''), name: fam, type: 'Familia activa', email: s.name.split(' ')[1].toLowerCase() + '@correo.com', phone: crmPhone(fam), owner: 'Tutoría' };
  });
  const prov = [{ id: 'ct-provbimbo', name: 'Proveedor Bimbo', type: 'Proveedor', email: 'ventas@proveedor.mx', phone: crmPhone('Bimbo'), owner: 'Tiendita' }];
  return [...fromLeads, ...fams, ...prov];
}
function crmLoadContacts() {
  try { const v = JSON.parse(localStorage.getItem(CRM_CONTACTS_KEY) || 'null'); if (Array.isArray(v) && v.length) return v; } catch (e) { }
  return crmContactsSeed();
}
function crmSaveContacts(v) { try { localStorage.setItem(CRM_CONTACTS_KEY, JSON.stringify(v)); } catch (e) { } }
const CRM_CONTACT_TYPES = ['Prospecto', 'Familia activa', 'Proveedor'];

function Contactos({ go }) {
  const [contacts, setContacts] = React.useState(crmLoadContacts);
  const [filter, setFilter] = React.useState('Todos');
  const [editing, setEditing] = React.useState(null); // null | 'new' | contact
  const [form, setForm] = React.useState({ name: '', type: 'Prospecto', email: '', phone: '', owner: 'Admisiones' });

  const shown = filter === 'Todos' ? contacts : contacts.filter(c => c.type === filter);
  const openNew = () => { setForm({ name: '', type: 'Prospecto', email: '', phone: '', owner: 'Admisiones' }); setEditing('new'); };
  const openEdit = (c) => { setForm({ name: c.name, type: c.type, email: c.email, phone: c.phone, owner: c.owner }); setEditing(c); };

  function save() {
    if (!form.name.trim()) { toast('Escribe el nombre del contacto', 'warn'); return; }
    const data = { ...form, name: form.name.trim(), email: form.email.trim() || form.name.toLowerCase().replace(/[^a-z]/g, '') + '@correo.com', phone: form.phone.trim() || crmPhone(form.name) };
    setContacts(cs => {
      const next = editing === 'new'
        ? [{ id: 'ct-' + Date.now().toString(36), ...data }, ...cs]
        : cs.map(c => c.id === editing.id ? { ...c, ...data } : c);
      crmSaveContacts(next); return next;
    });
    toast(editing === 'new' ? 'Contacto creado ✓' : 'Contacto actualizado ✓');
    setEditing(null);
  }
  function remove(c) {
    setContacts(cs => { const next = cs.filter(x => x.id !== c.id); crmSaveContacts(next); return next; });
    toast('Contacto eliminado', 'warn');
  }
  const typeTone = { 'Prospecto': 'cyan', 'Familia activa': 'green', 'Proveedor': 'amber' };

  return (
    <div className="content-inner">
      <PageHead eyebrow="CRM" title="Contactos" desc={contacts.length + ' contactos · familias, prospectos y proveedores'}>
        <button className="btn primary" onClick={openNew}><Icon name="plus" size={15} className="btn-ico" />Nuevo contacto</button>
      </PageHead>
      <div className="card">
        <CardHead icon="users" title="Directorio de contactos" sub="Base centralizada"
          right={<div className="seg">{['Todos', ...CRM_CONTACT_TYPES].map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f === 'Familia activa' ? 'Familias' : f === 'Prospecto' ? 'Prospectos' : f === 'Proveedor' ? 'Proveedores' : f}</button>)}</div>} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Contacto</th><th>Tipo</th><th>Correo</th><th>Teléfono</th><th>Responsable</th><th></th></tr></thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  <td><div className="person"><Avatar name={c.name} size={32} /><div className="pname">{c.name}</div></div></td>
                  <td><Badge tone={typeTone[c.type] || 'gray'}>{c.type}</Badge></td>
                  <td className="muted">{c.email}</td>
                  <td className="muted font-mono" style={{ fontSize: 12.5 }}>{c.phone}</td>
                  <td className="muted">{c.owner}</td>
                  <td>
                    <RowMenu items={[
                      { icon: 'edit', label: 'Editar', onClick: () => openEdit(c) },
                      { icon: 'x', label: 'Eliminar', danger: true, onClick: () => remove(c) },
                    ]} />
                  </td>
                </tr>
              ))}
              {!shown.length && <tr><td colSpan={6} className="faint" style={{ textAlign: 'center', padding: 24 }}>Sin contactos de este tipo.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nuevo contacto' : 'Editar contacto'}
        footer={<><button className="btn" onClick={() => setEditing(null)}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar</button></>}>
        <Field label="Nombre"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Familia Pérez" autoFocus /></Field>
        <div className="field-row">
          <Field label="Tipo"><SelectInput value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={CRM_CONTACT_TYPES} /></Field>
          <Field label="Responsable"><SelectInput value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} options={['Admisiones', 'Daniela Soto', 'Pablo Lira', 'Tutoría', 'Tiendita', 'Finanzas']} /></Field>
        </div>
        <div className="field-row">
          <Field label="Correo"><TextInput value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@dominio.com" /></Field>
          <Field label="Teléfono"><TextInput value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="55 0000 0000" /></Field>
        </div>
      </Modal>
    </div>
  );
}

Object.assign(window, { CRM, Contactos });
