/* views_comunicacion.jsx — Comunicación: compositor IA, audiencias dinámicas y helpers de IA
   (reemplaza Comunicacion de views_other.jsx y Audiencias de views_extra.jsx) */

/* ============ utilidades ============ */
function comHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991; return h; }

async function comClaudeJSON(prompt) {
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

/* ============ segmentos de audiencia (persistidos) ============ */
const COM_SEG_KEY = window.PIAGET_FRESH ? 'piaget_com_segs_fresh_v1' : 'piaget_com_segs_v1';
const COM_BASES = window.PIAGET_FRESH
  ? { Familias: { n: 0, icon: 'users', tone: 'blue' }, Alumnos: { n: 0, icon: 'cap', tone: 'violet' }, Docentes: { n: 148, icon: 'award', tone: 'green' }, Prospectos: { n: 0, icon: 'funnel', tone: 'cyan' } }
  : { Familias: { n: 1284, icon: 'users', tone: 'blue' }, Alumnos: { n: 1284, icon: 'cap', tone: 'violet' }, Docentes: { n: 148, icon: 'award', tone: 'green' }, Prospectos: { n: 540, icon: 'funnel', tone: 'cyan' } };

function comSegSeed() {
  if (window.PIAGET_FRESH) return [];
  return [
    { id: 'seg-1', name: 'Todas las familias', n: 1284, tone: 'blue', icon: 'users', base: 'Familias', cond: '' },
    { id: 'seg-2', name: 'Familias con adeudo', n: 142, tone: 'red', icon: 'wallet', base: 'Familias', cond: 'Saldo vencido > $0' },
    { id: 'seg-3', name: 'Prospectos activos', n: 540, tone: 'cyan', icon: 'funnel', base: 'Prospectos', cond: 'Etapa ≠ descartado' },
    { id: 'seg-4', name: 'Alumnos en riesgo', n: 23, tone: 'amber', icon: 'alert', base: 'Alumnos', cond: 'Riesgo IA = alto o medio' },
    { id: 'seg-5', name: 'Padres de 6° (egreso)', n: 198, tone: 'violet', icon: 'cap', base: 'Familias', cond: 'Grado = 6°' },
    { id: 'seg-6', name: 'Comunidad docente', n: 148, tone: 'green', icon: 'award', base: 'Docentes', cond: '' },
  ];
}
function comLoadSegs() {
  try { const v = JSON.parse(localStorage.getItem(COM_SEG_KEY) || 'null'); if (Array.isArray(v) && v.length) return v; } catch (e) { }
  return comSegSeed();
}
function comSaveSegs(s) { try { localStorage.setItem(COM_SEG_KEY, JSON.stringify(s)); } catch (e) { } }
function comEstimate(base, cond) {
  const b = comBases()[base] || comBases().Familias;
  if (!b.n) return 0;
  if (!cond.trim()) return b.n;
  return Math.max(1, Math.round(b.n * (0.06 + (comHash(cond) % 52) / 100)));
}
/* Conteo REAL de destinatarios por base, derivado de la base de datos actual. */
function comBases() {
  const clases = (window.DB && DB.clases) || [];
  const alumnos = clases.reduce((a, c) => a + (c.alumnos || 0), 0) + (((window.DB && DB.students) || []).length);
  const docentes = new Set(clases.map(c => c.titular).filter(Boolean)).size + (((window.DB && DB.docentes) || []).length);
  return {
    Familias: { n: ((window.DB && DB.familyAccounts) || []).length, icon: 'users', tone: 'blue' },
    Alumnos: { n: alumnos, icon: 'cap', tone: 'violet' },
    Docentes: { n: docentes, icon: 'award', tone: 'green' },
    Prospectos: { n: ((window.DB && DB.leads) || []).length, icon: 'funnel', tone: 'cyan' },
  };
}

/* ============ IA: borradores de comunicados ============ */
const COM_TONOS = ['Cálido', 'Institucional', 'Urgente'];
const COM_CANALES = ['App', 'Correo', 'SMS'];

function comDraftFallback(seg, tono, extra) {
  const name = seg.name.toLowerCase();
  let theme;
  if (name.includes('adeudo')) theme = { titulo: 'Recordatorio de colegiatura de agosto', core: 'la colegiatura de agosto vence el día 5 y puede pagarse desde la app en la sección Finanzas, por transferencia o en caja' };
  else if (name.includes('riesgo')) theme = { titulo: 'Invitación a sesión de acompañamiento', core: 'hemos preparado un plan de acompañamiento académico para su hijo(a) y queremos agendar una breve reunión con su tutor esta semana' };
  else if (name.includes('docente')) theme = { titulo: 'Consejo técnico: agenda y materiales', core: 'el consejo técnico se realizará mañana a las 8:00 en el auditorio; la agenda y los materiales ya están disponibles en Docs' };
  else if (name.includes('prospecto')) theme = { titulo: 'Te esperamos en el Open House', core: 'el sábado abrimos las puertas del campus para que conozcan nuestras aulas, talleres y al equipo docente; el registro toma un minuto' };
  else if (name.includes('6°') || name.includes('egreso')) theme = { titulo: 'Camino a la graduación: fechas clave', core: 'compartimos el calendario de cierre de ciclo para 6°: ensayo fotográfico, examen final y ceremonia de graduación' };
  else theme = { titulo: 'Avisos importantes de la semana', core: 'compartimos los avisos de la semana: actividades académicas, fechas de pago y eventos de la comunidad' };
  const open = tono === 'Cálido' ? 'Estimada familia, con mucho cariño les recordamos que ' : tono === 'Urgente' ? 'Aviso importante: les informamos que ' : 'Estimada comunidad, por este medio les comunicamos que ';
  const close = tono === 'Cálido' ? ' ¡Gracias por ser parte de la comunidad Piaget!' : tono === 'Urgente' ? ' Agradecemos su atención inmediata.' : ' Quedamos atentos a cualquier duda a través de los canales oficiales.';
  const extraTxt = extra ? ' ' + extra.charAt(0).toUpperCase() + extra.slice(1).replace(/\.?$/, '.') : '';
  return { titulo: theme.titulo, cuerpo: open + theme.core + '.' + extraTxt + close };
}

async function comDraftAI(seg, tono, canales, extra) {
  const p = 'Eres el asistente de comunicación de ' + DB.school.name + ' (' + DB.school.campus + '). Redacta un comunicado escolar breve.\n' +
    'Audiencia: ' + seg.name + ' (' + seg.n + ' destinatarios). Tono: ' + tono + '. Canales: ' + canales.join(', ') + '.' +
    (extra ? ' Indicaciones del usuario: ' + extra + '.' : '') +
    '\nResponde ÚNICAMENTE JSON válido: {"titulo": "máx 8 palabras", "cuerpo": "50 a 80 palabras en español, sin saludos genéricos repetidos"}';
  const r = await comClaudeJSON(p);
  if (r && r.titulo && r.cuerpo) return { titulo: String(r.titulo), cuerpo: String(r.cuerpo) };
  return null;
}

/* ============ IA: respuestas sugeridas (Mensajería) ============ */
function comRepliesFallback(chat) {
  const last = (chat.last || '').toLowerCase();
  if (last.includes('pago') || last.includes('comprobante')) return [
    'Recibido, ya quedó aplicado a su estado de cuenta. ¡Gracias!',
    'Lo revisamos con tesorería y le confirmamos en unos minutos.',
    '¿Desea que le enviemos su factura de este pago?',
  ];
  if (last.includes('cita') || last.includes('tutora') || last.includes('tutor')) return [
    'Claro, la tutora tiene espacio el jueves 13:00 o viernes 9:30. ¿Cuál les acomoda?',
    'Con gusto agendamos. ¿Prefieren reunión presencial o videollamada?',
    'Le comparto la liga para agendar directamente con la tutora.',
  ];
  if (last.includes('junta') || last.includes('estaremos')) return [
    '¡Perfecto! Les esperamos. Habrá registro desde las 7:45.',
    'Gracias por confirmar. Les compartiremos la minuta al terminar.',
  ];
  return [
    'Con gusto le ayudamos. ¿Nos comparte un poco más de detalle?',
    'Gracias por escribirnos, en breve le damos seguimiento.',
    'Lo canalizo con el área correspondiente y le confirmo hoy mismo.',
  ];
}
async function comSuggestReplies(chat) {
  const fb = comRepliesFallback(chat);
  const conv = chat.msgs.slice(-4).map(m => (m.from === 'me' ? 'Colegio: ' : 'Familia: ') + m.text).join('\n');
  const p = 'Eres recepción de ' + DB.school.name + '. Conversación con ' + chat.family + ':\n' + conv +
    '\nSugiere 3 respuestas breves (máx 18 palabras c/u) que el colegio podría enviar ahora, en español, tono cálido y profesional.' +
    '\nResponde ÚNICAMENTE JSON: ["...","...","..."]';
  const r = await comClaudeJSON(p);
  if (Array.isArray(r) && r.length) return r.slice(0, 3).map(String);
  return fb;
}

/* ============ IA: triaje de tickets ============ */
function comTriageFallback(t) {
  const s = (t.subject + ' ' + t.area).toLowerCase();
  if (s.includes('adeudo') || s.includes('pago')) return { prioridad: 'alta', respuesta: 'Compartir estado de cuenta actualizado y ofrecer convenio de pago en 2 exhibiciones.' };
  if (s.includes('factura')) return { prioridad: 'media', respuesta: 'Emitir CFDI de agosto hoy mismo; confirmar uso D10 y correo de envío.' };
  if (s.includes('cita') || s.includes('tutor')) return { prioridad: 'media', respuesta: 'Proponer 2 horarios con la tutora esta semana y confirmar por la app.' };
  if (s.includes('transporte') || s.includes('ruta')) return { prioridad: 'baja', respuesta: 'Confirmar disponibilidad de la ruta solicitada; el cambio aplica en 48 h.' };
  return { prioridad: 'baja', respuesta: 'Confirmar recepción y canalizar al área responsable con fecha compromiso.' };
}
async function comTriageTickets(tickets) {
  const fb = tickets.map(comTriageFallback);
  const p = 'Eres el Copilot de atención a familias de ' + DB.school.name + '. Tickets abiertos:\n' +
    tickets.map((t, i) => i + '. [' + t.area + '] ' + t.subject + ' — ' + t.family + ' (prioridad actual: ' + t.priority + ')').join('\n') +
    '\nPara cada ticket sugiere prioridad y primera acción. Responde ÚNICAMENTE JSON: [{"idx":0,"prioridad":"alta|media|baja","respuesta":"máx 20 palabras"}] (uno por ticket, en orden).';
  const r = await comClaudeJSON(p);
  if (Array.isArray(r) && r.length) {
    return tickets.map((t, i) => {
      const hit = r.find(x => x.idx === i) || r[i];
      return hit && ['alta', 'media', 'baja'].includes(hit.prioridad)
        ? { prioridad: hit.prioridad, respuesta: String(hit.respuesta || fb[i].respuesta) } : fb[i];
    });
  }
  return fb;
}

window.ComAI = { suggestReplies: comSuggestReplies, triageTickets: comTriageTickets };

/* ============ Modal de triaje (usado por Atención a Familias) ============ */
function ComTriageModal({ open, onClose }) {
  const [items, setItems] = React.useState(null);
  const [applied, setApplied] = React.useState({});
  React.useEffect(() => {
    if (!open) { setItems(null); setApplied({}); return; }
    let on = true;
    const pending = DB.tickets.filter(t => t.status !== 'resuelto');
    Promise.all([comTriageTickets(pending), new Promise(r => setTimeout(r, 900))])
      .then(([sug]) => { if (on) setItems(pending.map((t, i) => ({ ticket: t, ...sug[i] }))); });
    return () => { on = false; };
  }, [open]);

  const apply = (it) => {
    Store.update('tickets', it.ticket._id, { priority: it.prioridad });
    setApplied(a => ({ ...a, [it.ticket._id]: true }));
    toast('Prioridad aplicada: ' + it.prioridad, 'ok');
  };
  const applyAll = () => {
    (items || []).forEach(it => Store.update('tickets', it.ticket._id, { priority: it.prioridad }));
    setApplied((items || []).reduce((a, it) => ({ ...a, [it.ticket._id]: true }), {}));
    toast('Triaje aplicado a ' + (items || []).length + ' tickets', 'ok');
  };
  const prioTone = { alta: 'red', media: 'amber', baja: 'gray' };

  return (
    <Modal open={open} title="Triaje con IA" onClose={onClose} width={640}
      footer={<>
        <span className="faint grow" style={{ fontSize: 11.5 }}>Sugerencias de Copilot sobre tickets sin resolver.</span>
        <button className="btn" onClick={onClose}>Cerrar</button>
        <button className="btn primary" disabled={!items} onClick={applyAll}><Icon name="check" size={15} className="btn-ico" />Aplicar todo</button>
      </>}>
      {!items ? (
        <div className="row center" style={{ gap: 10, padding: '26px 4px', justifyContent: 'center' }}>
          <div className="ai-orb" style={{ width: 26, height: 26, borderRadius: 8 }}><Icon name="spark" size={14} fill="currentColor" /></div>
          <span style={{ fontSize: 13.5 }}>Analizando tickets abiertos…</span>
        </div>
      ) : (
        <div className="col" style={{ gap: 10 }}>
          {items.map((it) => (
            <div key={it.ticket._id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '12px 14px' }}>
              <div className="row between center" style={{ gap: 10 }}>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{it.ticket.subject}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{it.ticket.family} · {it.ticket.area}</div>
                </div>
                <div className="row center" style={{ gap: 7, flexShrink: 0 }}>
                  {it.ticket.priority !== it.prioridad && <span className="faint" style={{ fontSize: 11, textDecoration: 'line-through' }}>{it.ticket.priority}</span>}
                  <Badge tone={prioTone[it.prioridad]}>{it.prioridad[0].toUpperCase() + it.prioridad.slice(1)}</Badge>
                  {applied[it.ticket._id]
                    ? <span style={{ color: 'var(--green)', display: 'inline-flex' }}><Icon name="checkCircle" size={17} /></span>
                    : <button className="btn sm" onClick={() => apply(it)}>Aplicar</button>}
                </div>
              </div>
              <div className="row" style={{ gap: 8, marginTop: 9, alignItems: 'flex-start' }}>
                <span className="ai-orb" style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1 }}><Icon name="spark" size={10} fill="currentColor" /></span>
                <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>{it.respuesta}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ============ Compositor IA de comunicados ============ */
function ComChip({ active, onClick, children }) {
  return (
    <button className="chip-btn" onClick={onClick}
      style={active ? { background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'var(--accent)' } : {}}>
      {children}
    </button>
  );
}

function ComComposer({ go }) {
  const segs = React.useMemo(comLoadSegs, []);
  const [segId, setSegId] = React.useState(segs[1] ? segs[1].id : (segs[0] ? segs[0].id : ''));
  const [tono, setTono] = React.useState('Cálido');
  const [canales, setCanales] = React.useState(['App', 'Correo']);
  const [extra, setExtra] = React.useState('');
  const [phase, setPhase] = React.useState(-1);          // -1 form, 0..1 generando
  const [draft, setDraft] = React.useState(null);        // {titulo, cuerpo, ia}
  const seg = segs.find(s => s.id === segId) || segs[0] || null;

  const toggleCanal = (c) => setCanales(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]);

  if (!seg) {
    return (
      <div className="ai-panel" style={{ alignSelf: 'start' }}>
        <div className="ai-panel-head">
          <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
          <div className="grow">
            <div style={{ fontWeight: 600, fontSize: 14 }}>Redactar con Copilot</div>
            <div className="faint" style={{ fontSize: 11.5 }}>Genera, edita y envía en un flujo</div>
          </div>
        </div>
        <div className="col center gap-8 faint" style={{ padding: '32px 12px', textAlign: 'center' }}>
          <Icon name="users" size={28} stroke={1.4} />
          <span style={{ fontSize: 12.5 }}>Crea una audiencia para empezar a redactar comunicados.</span>
          <button className="btn sm" onClick={() => go && go('audiencias')}><Icon name="plus" size={13} className="btn-ico" />Nueva audiencia</button>
        </div>
      </div>
    );
  }

  async function generate() {
    if (phase >= 0) return;
    setPhase(0); setDraft(null);
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    delay(800).then(() => setPhase(p => p >= 0 ? 1 : p));
    const [ai] = await Promise.all([comDraftAI(seg, tono, canales, extra.trim()), delay(1700)]);
    const fb = comDraftFallback(seg, tono, extra.trim());
    setDraft(ai ? { ...ai, ia: true } : { ...fb, ia: false });
    setPhase(-1);
  }

  function dispatch(status) {
    Store.add('announcements', {
      title: draft.titulo, audience: seg.name, reach: seg.n, status,
      time: status === 'publicado' ? 'Ahora' : status === 'programado' ? 'Mañana 09:00' : '—', open: null,
    });
    Store.log('Comunicación', (status === 'publicado' ? 'envió' : status === 'programado' ? 'programó' : 'guardó') + ' “' + draft.titulo + '”', 'megaphone');
    toast(status === 'publicado' ? 'Enviado a ' + fmtNum(seg.n) + ' destinatarios ✓' : status === 'programado' ? 'Programado para mañana 09:00' : 'Borrador guardado', status === 'borrador' ? 'info' : 'ok');
    setDraft(null); setExtra('');
  }

  const steps = ['Analizando audiencia y contexto…', 'Redactando con tono ' + tono.toLowerCase() + '…'];

  return (
    <div className="ai-panel" style={{ alignSelf: 'start' }}>
      <div className="ai-panel-head">
        <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
        <div className="grow">
          <div style={{ fontWeight: 600, fontSize: 14 }}>Redactar con Copilot</div>
          <div className="faint" style={{ fontSize: 11.5 }}>Genera, edita y envía en un flujo</div>
        </div>
      </div>

      <div className="col" style={{ gap: 13, padding: '14px 2px 2px' }}>
        {!draft && <>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Audiencia</div>
            <SelectInput value={segId} onChange={e => setSegId(e.target.value)}
              options={segs.map(s => ({ value: s.id, label: s.name + ' · ' + fmtNum(s.n) }))} />
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Tono</div>
            <div className="row wrap" style={{ gap: 7 }}>
              {COM_TONOS.map(t => <ComChip key={t} active={tono === t} onClick={() => setTono(t)}>{t}</ComChip>)}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Canales</div>
            <div className="row wrap" style={{ gap: 7 }}>
              {COM_CANALES.map(c => <ComChip key={c} active={canales.includes(c)} onClick={() => toggleCanal(c)}>{c}</ComChip>)}
            </div>
          </div>
          <TextInput value={extra} onChange={e => setExtra(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()}
            placeholder="Indicaciones (opcional): menciona la fecha límite, incluye liga de pago…" />
          {phase < 0 ? (
            <button className="btn primary" style={{ justifyContent: 'center' }} disabled={!canales.length} onClick={generate}>
              <Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Generar borrador
            </button>
          ) : (
            <div className="col" style={{ gap: 9, padding: '4px 2px' }}>
              {steps.map((s, i) => (
                <div key={i} className="row center" style={{ gap: 9, fontSize: 12.5, opacity: i <= phase ? 1 : 0.38 }}>
                  {i < phase
                    ? <span style={{ color: 'var(--green)', display: 'inline-flex' }}><Icon name="checkCircle" size={15} /></span>
                    : <span className="ai-orb" style={{ width: 15, height: 15, borderRadius: 5 }}><Icon name="spark" size={9} fill="currentColor" /></span>}
                  <span style={{ fontWeight: i === phase ? 600 : 400 }}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </>}

        {draft && <>
          <div className="card pad" style={{ background: 'var(--surface)', boxShadow: 'none' }}>
            <div className="row between center" style={{ marginBottom: 9 }}>
              <span className="eyebrow">Borrador {draft.ia ? 'generado con IA' : 'compuesto con plantilla'}</span>
              <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => setDraft(null)} title="Descartar"><Icon name="x" size={14} /></button>
            </div>
            <Field label="Título"><TextInput value={draft.titulo} onChange={e => setDraft({ ...draft, titulo: e.target.value })} /></Field>
            <Field label="Mensaje"><TextArea rows={6} value={draft.cuerpo} onChange={e => setDraft({ ...draft, cuerpo: e.target.value })} /></Field>
            <div className="row gap-8 wrap" style={{ marginTop: 4 }}>
              <Badge tone="blue">Tono: {tono.toLowerCase()}</Badge>
              <Badge tone="violet">{fmtNum(seg.n)} · {seg.name}</Badge>
              <Badge tone="cyan">{canales.join(' + ')}</Badge>
            </div>
          </div>
          <div className="row gap-8">
            <button className="btn primary grow" style={{ justifyContent: 'center' }} onClick={() => dispatch('publicado')}><Icon name="send" size={15} className="btn-ico" />Enviar ahora</button>
            <button className="btn" onClick={() => dispatch('programado')}><Icon name="clock" size={15} className="btn-ico" />Programar</button>
            <button className="btn" onClick={generate} title="Regenerar"><Icon name="refresh" size={15} /></button>
          </div>
          <button className="btn ghost sm" style={{ justifyContent: 'center' }} onClick={() => dispatch('borrador')}>Guardar como borrador</button>
        </>}
      </div>
    </div>
  );
}

/* ============ Comunicados (vista) ============ */
function comStatsDesc() {
  const ch = DB.channels || [];
  const total = ch.reduce((s, c) => s + (c.sent || 0), 0);
  if (!total) return 'Aún no hay mensajes enviados en este ciclo.';
  const wOpen = ch.reduce((s, c) => s + (c.sent || 0) * (c.open || 0), 0) / total;
  return fmtNum(total) + ' mensajes este mes · tasa de apertura promedio ' + Math.round(wOpen) + '%';
}
function comAnnStatus(s) {
  if (s === 'publicado') return <Badge tone="green" dot>Publicado</Badge>;
  if (s === 'programado') return <Badge tone="blue" dot>Programado</Badge>;
  return <Badge tone="gray" dot>Borrador</Badge>;
}

function Comunicacion({ go }) {
  const d = DB;
  const [modal, setModal] = React.useState(false);
  /* Audiencias reales: segmentos guardados + “Toda la comunidad” (suma de bases). */
  const audiences = React.useMemo(() => {
    const bs = comBases();
    const total = Object.values(bs).reduce((a, x) => a + (x.n || 0), 0);
    const segs = comLoadSegs().map(s => ({ name: s.name, n: s.n || 0 }));
    return [{ name: 'Toda la comunidad', n: total }, ...segs];
  }, [modal]);
  const [form, setForm] = React.useState(() => ({ title: '', audience: 'Toda la comunidad', reach: 0, status: 'publicado' }));
  React.useEffect(() => {
    const a = audiences.find(x => x.name === form.audience);
    if (a && Number(form.reach) !== a.n) setForm(f => ({ ...f, reach: a.n }));
  }, [form.audience, modal]);
  function saveAnn() {
    if (!form.title.trim()) { toast('Escribe el título del comunicado', 'warn'); return; }
    Store.add('announcements', { ...form, reach: Number(form.reach) || 0, open: null, time: form.status === 'programado' ? 'Programado' : form.status === 'borrador' ? '—' : 'Ahora' });
    Store.log('Dirección', 'publicó “' + form.title + '”', 'megaphone');
    toast(form.status === 'borrador' ? 'Borrador guardado' : 'Comunicado ' + form.status + ' ✓');
    setForm({ title: '', audience: 'Toda la comunidad', reach: 0, status: 'publicado' }); setModal(false);
  }
  const publish = (a) => {
    Store.update('announcements', a._id, { status: 'publicado', time: 'Ahora' });
    Store.log('Dirección', 'publicó “' + a.title + '”', 'megaphone'); toast('Comunicado publicado ✓');
  };
  return (
    <div className="content-inner">
      <PageHead eyebrow="Comunicación" title="Comunicados" desc={comStatsDesc()}>
        <button className="btn" onClick={() => go('audiencias')}><Icon name="users" size={15} className="btn-ico" />Audiencias</button>
        <button className="btn primary" onClick={() => setModal(true)}><Icon name="plus" size={15} className="btn-ico" />Nuevo comunicado</button>
      </PageHead>

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

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <CardHead icon="megaphone" title="Comunicados" sub="Recientes y programados" />
          <div>
            {d.announcements.length === 0 && (
              <div className="lrow faint" style={{ justifyContent: 'center', padding: 28, fontSize: 13 }}>Aún no hay comunicados en este ciclo.</div>
            )}
            {d.announcements.map((a) => {
              const open = a.status === 'publicado' && a.open != null ? a.open : null;
              return (
              <div className="lrow" key={a._id} style={{ padding: '14px 20px' }}>
                <div className="insight-ico" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)', width: 34, height: 34, flexShrink: 0 }}><Icon name="megaphone" size={16} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.title}</div>
                  <div className="faint" style={{ fontSize: 12.5 }}>{a.audience} · {fmtNum(a.reach)} destinatarios</div>
                  {a.status === 'publicado' && open != null && (
                    <div className="row center" style={{ gap: 8, marginTop: 6, maxWidth: 240 }}>
                      <div className="grow"><Bar value={open} height={5} color={open >= 75 ? 'var(--green)' : 'var(--amber)'} /></div>
                      <span className="tnum font-mono faint" style={{ fontSize: 11, flexShrink: 0 }}>{open + '% apertura'}</span>
                    </div>
                  )}
                </div>
                <div className="col" style={{ alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                  {comAnnStatus(a.status)}
                  <span className="faint font-mono" style={{ fontSize: 11 }}>{a.time}</span>
                </div>
                {a.status !== 'publicado'
                  ? <button className="btn sm" style={{ flexShrink: 0 }} onClick={() => publish(a)}><Icon name="send" size={13} className="btn-ico" />Publicar</button>
                  : <RowMenu items={[{ icon: 'trash', label: 'Eliminar', danger: true, onClick: () => { Store.remove('announcements', a._id); toast('Comunicado eliminado', 'warn'); } }]} />}
              </div>
              );
            })}
          </div>
        </div>

        <ComComposer go={go} />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo comunicado"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={saveAnn}><Icon name="send" size={15} className="btn-ico" />Publicar</button></>}>
        <Field label="Título"><TextInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Asunto del comunicado" autoFocus /></Field>
        <Field label="Audiencia"><SelectInput value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} options={audiences.map(a => a.name)} /></Field>
        <div className="field-row">
          <Field label="Destinatarios"><NumberInput value={form.reach} onChange={e => setForm({ ...form, reach: e.target.value })} min="0" /></Field>
          <Field label="Estado"><SelectInput value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={['publicado', 'programado', 'borrador']} /></Field>
        </div>
      </Modal>
    </div>
  );
}

/* ============ Audiencias (vista con segmentos editables) ============ */
function Audiencias({ go }) {
  const [segs, setSegs] = React.useState(comLoadSegs);
  const [editing, setEditing] = React.useState(null); // null | 'new' | seg
  const [form, setForm] = React.useState({ name: '', base: 'Familias', cond: '' });

  const openNew = () => { setForm({ name: '', base: 'Familias', cond: '' }); setEditing('new'); };
  const openEdit = (s) => { setForm({ name: s.name, base: s.base || 'Familias', cond: s.cond || '' }); setEditing(s); };

  function save() {
    if (!form.name.trim()) { toast('Ponle nombre al segmento', 'warn'); return; }
    const b = comBases()[form.base];
    const n = comEstimate(form.base, form.cond);
    setSegs(ss => {
      let next;
      if (editing === 'new') next = [...ss, { id: 'seg-' + Date.now().toString(36), name: form.name.trim(), base: form.base, cond: form.cond.trim(), n, tone: b.tone, icon: b.icon }];
      else next = ss.map(s => s.id === editing.id ? { ...s, name: form.name.trim(), base: form.base, cond: form.cond.trim(), n: form.cond.trim() === (editing.cond || '') && form.base === editing.base ? s.n : n } : s);
      comSaveSegs(next); return next;
    });
    toast(editing === 'new' ? 'Segmento creado ✓' : 'Segmento actualizado ✓');
    setEditing(null);
  }
  function remove(s) {
    setSegs(ss => { const next = ss.filter(x => x.id !== s.id); comSaveSegs(next); return next; });
    toast('Segmento eliminado', 'warn');
  }

  const estim = comEstimate(form.base, form.cond);

  return (
    <div className="content-inner">
      <PageHead eyebrow="Comunicación" title="Audiencias" desc="Segmentos dinámicos para campañas y comunicados dirigidos.">
        <button className="btn primary" onClick={openNew}><Icon name="plus" size={15} className="btn-ico" />Nuevo segmento</button>
      </PageHead>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {segs.length === 0 && (
          <div className="card pad col center gap-8 faint" style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center' }}>
            <Icon name="users" size={30} stroke={1.4} />
            <span style={{ fontSize: 13 }}>Aún no hay segmentos en este ciclo. Crea el primero para dirigir tus comunicados.</span>
            <button className="btn sm" onClick={openNew}><Icon name="plus" size={13} className="btn-ico" />Nuevo segmento</button>
          </div>
        )}
        {segs.map((s) => {
          const t = window.TONE[s.tone] || window.TONE.blue;
          return (
            <div className="card pad" key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="row between center">
                <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={s.icon} size={20} /></div>
                <RowMenu items={[
                  { icon: 'megaphone', label: 'Crear campaña', onClick: () => go('comunicados') },
                  { icon: 'edit', label: 'Editar segmento', onClick: () => openEdit(s) },
                  { icon: 'x', label: 'Eliminar', danger: true, onClick: () => remove(s) },
                ]} />
              </div>
              <div>
                <div className="font-display tnum" style={{ fontSize: 26, fontWeight: 700 }}>{fmtNum(s.n)}</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                {s.cond ? <div className="faint font-mono" style={{ fontSize: 11, marginTop: 3 }}>{s.base} · {s.cond}</div>
                  : <div className="faint" style={{ fontSize: 11.5, marginTop: 3 }}>{s.base} · sin filtros</div>}
              </div>
              <button className="btn sm" style={{ justifyContent: 'center' }} onClick={() => go('comunicados')}><Icon name="megaphone" size={14} className="btn-ico" />Enviar comunicado</button>
            </div>
          );
        })}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nuevo segmento' : 'Editar segmento'}
        footer={<><button className="btn" onClick={() => setEditing(null)}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar</button></>}>
        <Field label="Nombre"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="p.ej. Familias de nuevo ingreso" autoFocus /></Field>
        <div className="field-row">
          <Field label="Base"><SelectInput value={form.base} onChange={e => setForm({ ...form, base: e.target.value })} options={Object.keys(comBases())} /></Field>
          <Field label="Condición (opcional)"><TextInput value={form.cond} onChange={e => setForm({ ...form, cond: e.target.value })} placeholder="p.ej. Grado = 1° y nuevo ingreso" /></Field>
        </div>
        <div className="row center" style={{ gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 13px' }}>
          <Icon name="users" size={15} className="faint" />
          <span style={{ fontSize: 12.5 }}>Tamaño estimado: <b className="tnum">{fmtNum(estim)}</b> destinatarios</span>
        </div>
      </Modal>
    </div>
  );
}

Object.assign(window, { Comunicacion, Audiencias, ComTriageModal });
