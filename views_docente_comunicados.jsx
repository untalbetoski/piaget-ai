/* views_docente_comunicados.jsx — Comunicados del DOCENTE
   --------------------------------------------------------------
   A diferencia de Dirección, el docente SOLO puede dirigir comunicados
   a sus grupos y materias asignadas (window.docScope()). No tiene acceso
   a audiencias institucionales, canales ni segmentos de toda la escuela. */

function DocenteComunicados({ go }) {
  useStore();
  const sc = window.docScope ? window.docScope() : null;
  const me = window.piagetActiveUser ? window.piagetActiveUser() : { name: 'Docente' };
  const groups = (sc && sc.groups && sc.groups.length) ? sc.groups : [];
  const materias = (sc && sc.materias && sc.materias.length) ? sc.materias : ['Titular de grupo'];
  const claseDe = (g) => (sc && sc.clases || []).find(c => c.g === g) || null;

  const [modal, setModal] = React.useState(false);
  const [grupo, setGrupo] = React.useState(groups[0] || '');
  const [materia, setMateria] = React.useState(materias[0] || 'Titular de grupo');
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [tono, setTono] = React.useState('Cálido');
  const [busy, setBusy] = React.useState(false);
  const [sel, setSel] = React.useState(null);

  /* Solo los comunicados de ESTE docente (por autoría o por grupo asignado). */
  const mine = ((window.DB && DB.announcements) || []).filter(a =>
    a.from === me.name || (a.group && window.docAllowsGroup && window.docAllowsGroup(a.group)));

  const reachDe = (g) => { const c = claseDe(g); return c ? (c.alumnos || 0) : 0; };
  const audienceLabel = (g, m) => 'Familias de ' + g + (m && m !== 'Titular de grupo' ? ' · ' + m : '');

  function openNew() {
    setGrupo(groups[0] || ''); setMateria(materias[0] || 'Titular de grupo');
    setTitle(''); setBody(''); setTono('Cálido'); setModal(true);
  }

  async function redactarIA() {
    if (busy) return;
    setBusy(true);
    const seg = { name: audienceLabel(grupo, materia), n: reachDe(grupo) };
    const extra = 'Dirigido a las familias del grupo ' + grupo + (materia && materia !== 'Titular de grupo' ? ' sobre la materia ' + materia : '') + '.';
    let draft = null;
    try { draft = window.comDraftAI ? await window.comDraftAI(seg, tono, ['App'], extra) : null; } catch (e) { }
    if (!draft && window.comDraftFallback) draft = window.comDraftFallback(seg, tono, extra);
    if (draft) { setTitle(draft.titulo || title); setBody(draft.cuerpo || body); }
    setBusy(false);
  }

  function publicar(status) {
    if (!grupo) { toast('Selecciona un grupo', 'warn'); return; }
    if (!title.trim()) { toast('Escribe el título del comunicado', 'warn'); return; }
    Store.add('announcements', {
      title: title.trim(),
      body: body.trim(),
      audience: audienceLabel(grupo, materia),
      group: grupo,
      subject: materia,
      from: me.name,
      reach: reachDe(grupo),
      status,
      open: null,
      time: status === 'publicado' ? 'Ahora' : status === 'programado' ? 'Mañana 09:00' : '—',
    });
    Store.log('Docente', (status === 'publicado' ? 'envió' : status === 'programado' ? 'programó' : 'guardó') + ' el comunicado “' + title.trim() + '” · ' + grupo, 'megaphone');
    toast(status === 'publicado' ? 'Comunicado enviado a ' + grupo + ' ✓' : status === 'programado' ? 'Programado para mañana 09:00' : 'Borrador guardado', status === 'borrador' ? 'info' : 'ok');
    setModal(false);
  }

  const annStatus = (s) => s === 'publicado'
    ? <Badge tone="green" dot>Publicado</Badge>
    : s === 'programado' ? <Badge tone="blue" dot>Programado</Badge> : <Badge tone="gray" dot>Borrador</Badge>;

  return (
    <div className="content-inner" style={{ maxWidth: 980 }}>
      <PageHead eyebrow="Comunicación" title="Comunicados"
        desc={!groups.length ? 'Sin grupos asignados.' : ('Avisos para las familias de tus grupos asignados: ' + groups.join(' · ') + '.')}>
        <button className="btn primary" disabled={!groups.length} onClick={openNew}><Icon name="plus" size={15} className="btn-ico" />Nuevo comunicado</button>
      </PageHead>

      <div className="card">
        <CardHead icon="megaphone" title="Mis comunicados" sub={mine.length + (mine.length === 1 ? ' comunicado' : ' comunicados')} />
        <div>
          {mine.length === 0 && (
            <div className="col center gap-8 faint" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Icon name="megaphone" size={28} stroke={1.4} />
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>Aún no has enviado comunicados</div>
              <div style={{ fontSize: 12.5 }}>Usa “Nuevo comunicado” para avisar a las familias de tus grupos.</div>
            </div>
          )}
          {mine.map((a) => (
            <button className="lrow clickable" key={a._id} onClick={() => setSel(a)}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', font: 'inherit', color: 'inherit', cursor: 'pointer', padding: '14px 20px' }}>
              <div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 34, height: 34, flexShrink: 0 }}><Icon name="megaphone" size={16} /></div>
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.title}</div>
                <div className="faint" style={{ fontSize: 12.5 }}>{a.audience} · {fmtNum(a.reach || 0)} destinatarios</div>
              </div>
              <div className="col" style={{ alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                {annStatus(a.status)}
                <span className="faint font-mono" style={{ fontSize: 11 }}>{a.time}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo comunicado" width={560}
        footer={<>
          <button className="btn" onClick={() => publicar('borrador')}>Guardar borrador</button>
          <button className="btn primary" onClick={() => publicar('publicado')}><Icon name="send" size={15} className="btn-ico" />Enviar ahora</button>
        </>}>
        <div className="field-row">
          <Field label="Grupo"><SelectInput value={grupo} onChange={e => setGrupo(e.target.value)} options={groups} /></Field>
          <Field label="Materia"><SelectInput value={materia} onChange={e => setMateria(e.target.value)} options={materias} /></Field>
        </div>
        <div className="row center gap-8" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 12px', marginBottom: 4 }}>
          <Icon name="users" size={15} className="faint" />
          <span style={{ fontSize: 12.5 }}>Se enviará a <b>{audienceLabel(grupo || '—', materia)}</b> · <b className="tnum">{fmtNum(reachDe(grupo))}</b> destinatarios</span>
        </div>
        <Field label="Tono (para redacción con IA)">
          <div className="row wrap" style={{ gap: 7 }}>
            {['Cálido', 'Institucional', 'Urgente'].map(t => (
              <button key={t} className="chip-btn" onClick={() => setTono(t)}
                style={tono === t ? { background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'var(--accent)' } : {}}>{t}</button>
            ))}
            <button className="chip-btn" style={{ marginLeft: 'auto' }} disabled={busy} onClick={redactarIA}>
              <Icon name="spark" size={13} className="btn-ico" fill="currentColor" />{busy ? 'Redactando…' : 'Redactar con IA'}
            </button>
          </div>
        </Field>
        <Field label="Título"><TextInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Asunto del comunicado" /></Field>
        <Field label="Mensaje"><TextArea rows={6} value={body} onChange={e => setBody(e.target.value)} placeholder="Escribe el mensaje para las familias…" /></Field>
      </Modal>

      <Modal open={!!sel} onClose={() => setSel(null)} title="Comunicado" width={520}
        footer={<>
          {sel && sel.status !== 'publicado' && <button className="btn" onClick={() => { Store.update('announcements', sel._id, { status: 'publicado', time: 'Ahora' }); toast('Comunicado publicado ✓'); setSel(null); }}><Icon name="send" size={15} className="btn-ico" />Publicar</button>}
          {sel && <button className="btn ghost" onClick={() => { Store.remove('announcements', sel._id); toast('Comunicado eliminado', 'warn'); setSel(null); }}><Icon name="trash" size={15} className="btn-ico" />Eliminar</button>}
          <button className="btn primary" onClick={() => setSel(null)}>Cerrar</button>
        </>}>
        {sel && <>
          <div className="row center gap-8" style={{ marginBottom: 12 }}>
            {annStatus(sel.status)}
            <span className="faint" style={{ fontSize: 12 }}>{sel.audience} · {sel.time}</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 10px' }}>{sel.title}</h2>
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--text)' }}>{sel.body || 'Sin contenido adicional.'}</div>
        </>}
      </Modal>
    </div>
  );
}

Object.assign(window, { DocenteComunicados });
