/* copilot.jsx — Asistente de IA: drawer conversacional + página módulo IA */

const CANNED = [
  { match: ['riesgo', 'deserción', 'desercion'], text: 'Identifiqué 23 estudiantes en riesgo de deserción. Los 9 de prioridad alta combinan asistencia menor al 80% y caída de promedio. ¿Quieres que prepare un plan de tutoría y notifique a sus tutores?', chips: ['Generar plan', 'Ver alumnos'] },
  { match: ['finanzas', 'agosto', 'ingreso'], text: 'En agosto llevas $4.82M de ingresos (+6.4% vs. julio) y $3.60M de egresos. El margen operativo es 25.3%. La cartera vencida bajó 8.3% pero aún hay $326k con +60 días en 142 familias.', chips: ['Ver cartera', 'Crear campaña'] },
  { match: ['comunicado', 'junta', 'redacta', 'padres'], text: 'Listo. Redacté un comunicado para la junta de padres de 4° grado con tono cálido e institucional, programable por App y Correo a 198 destinatarios. ¿Lo reviso contigo o lo envío?', chips: ['Ver borrador', 'Programar envío'] },
  { match: ['funnel', 'admisi', 'pipeline'], text: 'El funnel tiene 540 prospectos y 92 inscritos (conversión 17%). El cuello de botella está en “Entrevista → Inscripción”. Hay 18 familias frías hace +10 días que conviene reactivar.', chips: ['Reactivar con IA', 'Ver pipeline'] },
  { match: ['misión', 'mision', 'misiones', 'reto', 'gamific'], text: 'Hay 4 misiones activas con 78% de participación. "Reto de álgebra" vence en 2 días con solo 41% de avance en 5° A — te sugiero extender el plazo o enviar un recordatorio. ¿Genero una misión nueva desde AI Missions?', chips: ['Generar misión', 'Ver misiones'] },
];
function answerFor(q) {
  const low = q.toLowerCase();
  const hit = CANNED.find(c => c.match.some(m => low.includes(m)));
  return hit || { text: 'Puedo ayudarte con análisis académico, finanzas, admisiones y comunicación. Conecto los datos de los 7 módulos para darte respuestas accionables. ¿Sobre qué módulo quieres profundizar?', chips: DB.copilotSuggestions.slice(0, 2) };
}

function MsgBubble({ m }) {
  if (m.role === 'user') {
    return (
      <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 14 }}>
        <div style={{ background: 'var(--accent)', color: 'var(--on-accent)', padding: '10px 14px', borderRadius: '14px 14px 4px 14px', maxWidth: '82%', fontSize: 13.5, lineHeight: 1.5 }}>{m.text}</div>
      </div>
    );
  }
  return (
    <div className="row gap-8 rise" style={{ alignItems: 'flex-start', marginBottom: 16 }}>
      <div className="ai-orb" style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 8 }}><Icon name="spark" size={14} fill="currentColor" /></div>
      <div style={{ maxWidth: '86%' }}>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '11px 14px', borderRadius: '14px 14px 14px 4px', fontSize: 13.5, lineHeight: 1.55 }}>
          {m.text}
          {m.data && m.data.type === 'list' && (
            <div className="col gap-8" style={{ marginTop: 12 }}>
              {m.data.items.map((it, i) => {
                const t = window.TONE[it.tone] || window.TONE.blue;
                return (
                  <div key={i} className="row center gap-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: '8px 10px' }}>
                    <span className="font-mono" style={{ fontWeight: 600, fontSize: 12.5, color: t.c, width: 42 }}>{it.k}</span>
                    <span className="font-display" style={{ fontWeight: 600, fontSize: 15 }}>{it.v}</span>
                    <span className="faint grow" style={{ fontSize: 11.5 }}>{it.note}</span>
                  </div>
                );
              })}
            </div>
          )}
          {m.foot && <div style={{ marginTop: 10, fontSize: 13, fontWeight: 500 }}>{m.foot}</div>}
        </div>
        {m.chips && (
          <div className="row gap-8 wrap" style={{ marginTop: 9 }}>
            {m.chips.map((c, i) => <button key={i} className="chip-btn">{c}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}

function Copilot({ open, onClose }) {
  const [thread, setThread] = React.useState(DB.copilotThread);
  const [val, setVal] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const bodyRef = React.useRef(null);

  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [thread, typing]);

  function send(text) {
    const q = (text || val).trim();
    if (!q) return;
    setThread(t => { const n = [...t, { role: 'user', text: q }]; Store.setThread(n); return n; });
    setVal('');
    setTyping(true);
    setTimeout(() => {
      const a = answerFor(q);
      setTyping(false);
      setThread(t => { const n = [...t, { role: 'ai', text: a.text, chips: a.chips }]; Store.setThread(n); return n; });
    }, 1100);
  }

  return (
    <>
      <div className={'drawer-scrim' + (open ? ' open' : '')} onClick={onClose} />
      <aside className={'drawer' + (open ? ' open' : '')} aria-hidden={!open}>
        <div className="row center between" style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <div className="row center gap-12">
            <div className="ai-orb" style={{ width: 34, height: 34 }}><Icon name="spark" size={18} fill="currentColor" /></div>
            <div>
              <div style={{ fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: 16 }}>Piaget Copilot</div>
              <div className="row center gap-8 faint" style={{ fontSize: 11.5 }}><span className="live-dot" />Conectado a 7 módulos</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
          <div className="row center gap-8 faint" style={{ fontSize: 11.5, justifyContent: 'center', marginBottom: 16 }}>
            <span style={{ height: 1, width: 40, background: 'var(--border)' }} />Hoy<span style={{ height: 1, width: 40, background: 'var(--border)' }} />
          </div>
          {thread.map((m, i) => <MsgBubble key={i} m={m} />)}
          {typing && (
            <div className="row gap-8" style={{ alignItems: 'flex-start' }}>
              <div className="ai-orb" style={{ width: 26, height: 26, borderRadius: 8 }}><Icon name="spark" size={14} fill="currentColor" /></div>
              <div className="typing" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '13px 14px', borderRadius: '14px 14px 14px 4px' }}>
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          {thread.length <= 3 && (
            <div className="row gap-8 wrap" style={{ marginBottom: 10 }}>
              {DB.copilotSuggestions.slice(0, 3).map((s, i) => (
                <button key={i} className="chip-btn plain" onClick={() => send(s)} style={{ fontSize: 11.5 }}>{s}</button>
              ))}
            </div>
          )}
          <div className="row center gap-8" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '6px 6px 6px 14px' }}>
            <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Pregúntale a Copilot…" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--text)' }} />
            <button className="btn primary" style={{ width: 38, height: 38, padding: 0, justifyContent: 'center' }} onClick={() => send()}><Icon name="send" size={16} /></button>
          </div>
          <div className="faint" style={{ fontSize: 10.5, textAlign: 'center', marginTop: 8 }}>Copilot puede cometer errores. Verifica datos sensibles.</div>
        </div>
      </aside>
    </>
  );
}

/* ============ Página módulo IA ============ */
function IAPage({ openCopilot }) {
  const agents = DB.agents;
  return (
    <div className="content-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 7 }}>Inteligencia Artificial</div>
          <h1 className="page-title">Copilot &amp; Automatizaciones</h1>
          <p className="page-desc">La capa de IA que conecta los 7 módulos: pregunta, predice, alerta y actúa por ti.</p>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={openCopilot}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Abrir Copilot</button>
        </div>
      </div>

      {/* Hero ask */}
      <div className="ai-panel" style={{ padding: 28 }}>
        <div className="row center gap-12" style={{ marginBottom: 16 }}>
          <div className="ai-orb" style={{ width: 40, height: 40 }}><Icon name="spark" size={20} fill="currentColor" /></div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19 }}>Pregúntale a tu colegio</div>
            <div className="faint" style={{ fontSize: 13 }}>Lenguaje natural sobre datos en tiempo real de toda la institución</div>
          </div>
        </div>
        <div className="row gap-8 wrap">
          {DB.copilotSuggestions.map((s, i) => (
            <button key={i} className="btn" onClick={openCopilot} style={{ background: 'var(--surface)' }}>
              <Icon name="chat" size={14} className="btn-ico faint" />{s}
            </button>
          ))}
        </div>
      </div>

      <SectionHead eyebrow="Agentes activos" title="Automatizaciones inteligentes">
        <button className="btn sm"><Icon name="plus" size={14} className="btn-ico" />Nuevo agente</button>
      </SectionHead>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {agents.map((a, i) => {
          const t = window.TONE[a.tone];
          const toggle = () => { Store.update('agents', a._id, { active: !a.active }); toast(a.active ? 'Agente pausado' : 'Agente activado: ' + a.name, a.active ? 'warn' : 'ok'); };
          return (
            <div className="card pad" key={a._id || i}>
              <div className="row between" style={{ alignItems: 'flex-start' }}>
                <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
                  <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={a.icon} size={19} /></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</div>
                    <div className="faint" style={{ fontSize: 12.5, marginTop: 3, maxWidth: 320, lineHeight: 1.45 }}>{a.description}</div>
                  </div>
                </div>
                <button onClick={toggle} aria-label="toggle" style={{ width: 38, height: 22, borderRadius: 999, background: a.active ? 'var(--accent)' : 'var(--surface-3)', position: 'relative', flexShrink: 0, border: 'none', cursor: 'pointer', padding: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: a.active ? 18 : 2, width: 18, height: 18, borderRadius: 999, background: '#fff', boxShadow: 'var(--shadow-xs)' }} />
                </button>
              </div>
              <div className="row between center mt-12" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <Badge tone={a.active ? 'green' : 'gray'} dot>{a.active ? 'Activo' : 'Pausado'}</Badge>
                <span className="faint font-mono" style={{ fontSize: 11.5 }}>{a.runs}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { Copilot, IAPage });
