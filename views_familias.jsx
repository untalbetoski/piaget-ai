/* views_familias.jsx — Familias: Atención a Familias (tickets) · Mensajería App (chat) */

function ticketStatus(s) {
  const m = { abierto: ['amber', 'Abierto'], proceso: ['blue', 'En proceso'], resuelto: ['green', 'Resuelto'] };
  const [t, l] = m[s] || ['gray', s]; return <Badge tone={t} dot>{l}</Badge>;
}
function prioBadge(p) {
  const m = { alta: 'red', media: 'amber', baja: 'gray' };
  return <Badge tone={m[p]}>{p[0].toUpperCase() + p.slice(1)}</Badge>;
}

/* ============ ATENCIÓN A FAMILIAS ============ */
function AtencionFamilias({ go }) {
  const store = useStore();
  const [modal, setModal] = React.useState(false);
  const [triage, setTriage] = React.useState(false);
  const [filter, setFilter] = React.useState('Todos');
  const [form, setForm] = React.useState({ subject: '', family: '', area: 'Académico', priority: 'media' });
  const shown = filter === 'Todos' ? DB.tickets : DB.tickets.filter(t => filter === 'Abiertos' ? t.status !== 'resuelto' : t.status === 'resuelto');
  const abiertos = DB.tickets.filter(t => t.status !== 'resuelto').length;
  const hasTickets = DB.tickets.length > 0;
  function save() {
    if (!form.subject.trim() || !form.family.trim()) { toast('Completa asunto y familia', 'warn'); return; }
    Store.add('tickets', { ...form, status: 'abierto', time: 'recién' });
    toast('Ticket creado ✓'); setForm({ subject: '', family: '', area: 'Académico', priority: 'media' }); setModal(false);
  }
  function advance(t) {
    const next = t.status === 'abierto' ? 'proceso' : 'resuelto';
    Store.update('tickets', t._id, { status: next });
    toast(next === 'resuelto' ? 'Ticket resuelto ✓' : 'Ticket en proceso', next === 'resuelto' ? 'ok' : 'info');
  }
  return (
    <div className="content-inner">
      <PageHead eyebrow="Comunicación" title="Atención a Familias" desc={hasTickets ? (abiertos + ' tickets abiertos · tiempo de respuesta 2.4 h') : 'Aún no hay tickets de familias en este ciclo.'}>
        <button className="btn" onClick={() => setTriage(true)}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Triaje con IA</button>
        <button className="btn primary" onClick={() => setModal(true)}><Icon name="plus" size={15} className="btn-ico" />Nuevo ticket</button>
      </PageHead>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[{ label: 'Tickets abiertos', value: String(abiertos), icon: 'inbox', tone: 'blue' }, { label: 'En proceso', value: String(DB.tickets.filter(t => t.status === 'proceso').length), icon: 'clock', tone: 'amber' }, { label: 'Tiempo respuesta', value: hasTickets ? '2.4h' : '—', icon: 'send', tone: 'green' }, { label: 'Satisfacción', value: hasTickets ? '4.7/5' : '—', icon: 'heart', tone: 'violet' }].map((k, i) => {
          const t = window.TONE[k.tone];
          return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>;
        })}
      </div>
      <div className="card mt-16">
        <CardHead icon="headset" title="Bandeja de atención" sub="Solicitudes de las familias"
          right={<div className="seg">{['Todos', 'Abiertos', 'Resueltos'].map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div>} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Asunto</th><th>Familia</th><th>Área</th><th>Prioridad</th><th>Estatus</th><th>Tiempo</th><th></th></tr></thead>
            <tbody>
              {shown.map((t) => (
                <tr key={t._id}>
                  <td style={{ fontWeight: 600 }}>{t.subject}</td>
                  <td><div className="person"><Avatar name={t.family} size={28} /><div className="pname" style={{ fontSize: 13 }}>{t.family}</div></div></td>
                  <td><Badge tone="gray">{t.area}</Badge></td>
                  <td>{prioBadge(t.priority)}</td>
                  <td>{ticketStatus(t.status)}</td>
                  <td className="faint" style={{ fontSize: 12 }}>{t.time}</td>
                  <td>
                    {t.status !== 'resuelto'
                      ? <button className="btn sm" onClick={() => advance(t)}><Icon name={t.status === 'abierto' ? 'play' : 'check'} size={12} className="btn-ico" />{t.status === 'abierto' ? 'Atender' : 'Resolver'}</button>
                      : <RowMenu items={[{ icon: 'refresh', label: 'Reabrir', onClick: () => { Store.update('tickets', t._id, { status: 'abierto' }); toast('Ticket reabierto', 'info'); } }]} />}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan="7" className="faint" style={{ textAlign: 'center', padding: 28 }}>No hay tickets en esta bandeja.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo ticket"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Crear</button></>}>
        <Field label="Asunto"><TextInput value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Describe la solicitud" autoFocus /></Field>
        <Field label="Familia"><TextInput value={form.family} onChange={e => setForm({ ...form, family: e.target.value })} placeholder="Familia …" /></Field>
        <div className="field-row">
          <Field label="Área"><SelectInput value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} options={['Académico', 'Finanzas', 'Facturación', 'Transporte', 'Experiencias']} /></Field>
          <Field label="Prioridad"><SelectInput value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} options={['alta', 'media', 'baja']} /></Field>
        </div>
      </Modal>
      <ComTriageModal open={triage} onClose={() => setTriage(false)} />
    </div>
  );
}

/* ============ MENSAJERÍA APP ============ */
const MSG_CHANNELS = ['App', 'WhatsApp', 'Correo'];
const MSG_KEY = window.PIAGET_FRESH ? 'piaget_msg_chats_fresh_v1' : 'piaget_msg_chats_v1';
function msgSeed() {
  if (window.PIAGET_FRESH || !(DB.chats || []).length) return (DB.chats || []).map(c => ({ ...c }));
  return DB.chats.map(c => ({ ...c }));
}
function msgLoad() {
  try { const v = JSON.parse(localStorage.getItem(MSG_KEY) || 'null'); if (Array.isArray(v)) return v; } catch (e) { }
  return msgSeed();
}
function msgSave(v) { try { localStorage.setItem(MSG_KEY, JSON.stringify(v)); } catch (e) { } }
const msgNow = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

function MensajeriaApp({ go }) {
  const [chats, setChatsRaw] = React.useState(msgLoad);
  const [active, setActive] = React.useState(0);
  const [val, setVal] = React.useState('');
  const [edit, setEdit] = React.useState(null); // null | 'new' | {index}
  const [form, setForm] = React.useState({ family: '', channel: 'App' });
  const bodyRef = React.useRef(null);
  const chat = chats[active];
  const [sugs, setSugs] = React.useState(null);
  const setChats = React.useCallback((updater) => {
    setChatsRaw(cs => { const next = typeof updater === 'function' ? updater(cs) : updater; msgSave(next); return next; });
  }, []);
  React.useEffect(() => {
    let on = true; setSugs(null);
    const c = chats[active];
    if (c && c.msgs.length && c.msgs[c.msgs.length - 1].from === 'them' && window.ComAI) {
      window.ComAI.suggestReplies(c).then(s => { if (on) setSugs(s); });
    }
    return () => { on = false; };
  }, [active]);
  React.useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [active, chats]);
  function send() {
    const text = val.trim(); if (!text) return;
    const time = msgNow();
    setChats(cs => cs.map((c, i) => i === active ? { ...c, msgs: [...c.msgs, { from: 'me', text, time }], last: text, time, unread: 0 } : c));
    setVal('');
  }
  function openChat(i) { setActive(i); setChats(cs => cs.map((c, j) => j === i ? { ...c, unread: 0 } : c)); }
  function openNew() { setForm({ family: '', channel: 'App' }); setEdit('new'); }
  function openEdit() { setForm({ family: chat.family, channel: chat.channel }); setEdit({ index: active }); }
  function saveChat() {
    const name = form.family.trim();
    if (!name) { toast('Escribe el nombre de la familia', 'warn'); return; }
    if (edit === 'new') {
      setChats(cs => [{ family: name, channel: form.channel, last: 'Nueva conversación', time: msgNow(), unread: 0, msgs: [] }, ...cs]);
      setActive(0);
      toast('Conversación creada ✓');
    } else {
      setChats(cs => cs.map((c, i) => i === edit.index ? { ...c, family: name, channel: form.channel } : c));
      toast('Conversación actualizada ✓');
    }
    setEdit(null);
  }
  function deleteChat() {
    const i = edit.index;
    setChats(cs => cs.filter((_, j) => j !== i));
    setActive(a => (a >= i && a > 0 ? a - 1 : 0));
    setEdit(null);
    toast('Conversación eliminada', 'warn');
  }
  return (
    <div className="content-inner" style={{ maxWidth: 1200 }}>
      <PageHead eyebrow="Comunicación" title="Mensajería App" desc="Conversaciones 1 a 1 con familias por App y WhatsApp.">
        <button className="btn primary" onClick={openNew}><Icon name="plus" size={15} className="btn-ico" />Nueva conversación</button>
      </PageHead>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 540 }}>
          {/* lista */}
          <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
            {chats.length === 0 && (
              <div className="col center gap-8 faint" style={{ padding: '40px 18px', textAlign: 'center' }}>
                <Icon name="message" size={26} stroke={1.4} />
                <span style={{ fontSize: 12.5 }}>Sin conversaciones. Crea la primera.</span>
              </div>
            )}
            {chats.map((c, i) => (
              <button key={i} onClick={() => openChat(i)} style={{
                display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', border: 'none',
                borderBottom: '1px solid var(--border)', padding: '13px 16px', cursor: 'pointer',
                background: i === active ? 'var(--accent-soft)' : 'transparent'
              }}>
                <Avatar name={c.family} size={40} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row between center"><span style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.family}</span><span className="faint font-mono" style={{ fontSize: 10.5, flexShrink: 0, marginLeft: 6 }}>{c.time}</span></div>
                  <div className="row between center gap-8">
                    <span className="faint" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last}</span>
                    {c.unread > 0 && <span className="nav-badge" style={{ marginLeft: 0 }}>{c.unread}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {/* conversación */}
          {!chat ? (
            <div className="col center gap-10 faint" style={{ justifyContent: 'center', textAlign: 'center', padding: 24 }}>
              <Icon name="message" size={34} stroke={1.3} />
              <span style={{ fontSize: 13 }}>Selecciona una conversación o crea una nueva.</span>
              <button className="btn sm" onClick={openNew}><Icon name="plus" size={13} className="btn-ico" />Nueva conversación</button>
            </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div className="row center gap-11" style={{ gap: 11, padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
              <Avatar name={chat.family} size={38} />
              <div className="grow"><div style={{ fontWeight: 600 }}>{chat.family}</div><div className="faint row center gap-6" style={{ fontSize: 11.5 }}><span className="live-dot" style={{ background: 'var(--green)' }} />{chat.channel}</div></div>
              <button className="icon-btn" onClick={() => toast('Llamando a ' + chat.family + '…', 'info')}><Icon name="phone" size={18} /></button>
              <RowMenu items={[
                { icon: 'edit', label: 'Editar conversación', onClick: openEdit },
                { icon: 'trash', label: 'Eliminar conversación', danger: true, onClick: () => setEdit({ index: active, del: true }) },
              ]} />
            </div>
            <div ref={bodyRef} className="grow" style={{ overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface-2)' }}>
              {chat.msgs.map((m, i) => (
                <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '74%' }}>
                  <div style={{
                    padding: '9px 13px', fontSize: 13.5, lineHeight: 1.45,
                    background: m.from === 'me' ? 'var(--accent)' : 'var(--surface)',
                    color: m.from === 'me' ? 'var(--on-accent)' : 'var(--text)',
                    border: m.from === 'me' ? 'none' : '1px solid var(--border)',
                    borderRadius: m.from === 'me' ? '14px 14px 4px 14px' : '14px 14px 14px 4px'
                  }}>{m.text}</div>
                  <div className="faint font-mono" style={{ fontSize: 10, marginTop: 3, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.time}</div>
                </div>
              ))}
            </div>
            {chat.msgs.length > 0 && chat.msgs[chat.msgs.length - 1].from === 'them' && (
              <div className="row center wrap" style={{ gap: 7, padding: '10px 12px 0' }}>
                <span className="ai-orb" style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0 }}><Icon name="spark" size={10} fill="currentColor" /></span>
                {sugs === null
                  ? <span className="faint" style={{ fontSize: 11.5 }}>Copilot está sugiriendo respuestas…</span>
                  : sugs.map((s, i) => (
                    <button key={i} className="chip-btn" style={{ fontSize: 11.5 }} onClick={() => setVal(s)}>{s}</button>
                  ))}
              </div>
            )}
            <div className="row center gap-8" style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
              <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Escribe un mensaje…"
                style={{ flex: 1, height: 40, border: '1px solid var(--border-strong)', background: 'var(--surface-2)', borderRadius: 10, padding: '0 14px', fontSize: 14, color: 'var(--text)', outline: 'none' }} />
              <button className="btn primary" style={{ width: 40, height: 40, padding: 0, justifyContent: 'center' }} onClick={send}><Icon name="send" size={16} /></button>
            </div>
          </div>
          )}
        </div>
      </div>

      <Modal open={edit && edit.del} onClose={() => setEdit(null)} title="Eliminar conversación"
        footer={<><button className="btn" onClick={() => setEdit(null)}>Cancelar</button><button className="btn primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={deleteChat}><Icon name="trash" size={15} className="btn-ico" />Eliminar</button></>}>
        <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>Se eliminará la conversación con <b>{chat ? chat.family : ''}</b> y todo su historial. Esta acción no se puede deshacer.</p>
      </Modal>

      <Modal open={!!edit && !(edit && edit.del)} onClose={() => setEdit(null)} title={edit === 'new' ? 'Nueva conversación' : 'Editar conversación'}
        footer={<><button className="btn" onClick={() => setEdit(null)}>Cancelar</button><button className="btn primary" onClick={saveChat}><Icon name="check" size={15} className="btn-ico" />Guardar</button></>}>
        <Field label="Familia"><TextInput value={form.family} onChange={e => setForm({ ...form, family: e.target.value })} placeholder="p. ej. Familia Hernández" autoFocus /></Field>
        <Field label="Canal"><SelectInput value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} options={MSG_CHANNELS} /></Field>
      </Modal>
    </div>
  );
}

Object.assign(window, { AtencionFamilias, MensajeriaApp });
