/* views_familias_admin.jsx — Administración › Familias
   Cuentas del portal de familias: usuario + contraseña, vinculadas a uno o más
   estudiantes para que puedan revisar calificaciones, asistencia y pagos. */

const FAM_STATUS = {
  activo: ['green', 'Activo'],
  suspendido: ['red', 'Suspendido'],
  invitado: ['amber', 'Invitado'],
};
function famStatusBadge(s) { const [t, l] = FAM_STATUS[s] || ['gray', s]; return <Badge tone={t} dot>{l}</Badge>; }

function famGenPass() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = ''; for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'pgt-' + s;
}
function famUserFrom(family) {
  return 'familia.' + (family || '').toLowerCase().replace(/^familia\s+/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '') + '@jeanpiaget.mx';
}
function famCopy(text, label) {
  try { navigator.clipboard.writeText(text); toast((label || 'Copiado') + ' ✓', 'ok'); }
  catch (e) { toast('No se pudo copiar', 'warn'); }
}
/* Snapshot académico del estudiante (si existe en el padrón) */
function famStudentInfo(name) { return (DB.students || []).find(s => s.name === name) || null; }
/* "Diego Hernández (5° A); Mariana Hernández (1° B)" -> [{name,grade}] */
function famParseStudents(str) {
  return String(str || '').split(/[;\n]+/).map(p => p.trim()).filter(Boolean).map(p => {
    const m = p.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
    return m ? { name: m[1].trim(), grade: m[2].trim() } : { name: p, grade: '' };
  });
}

const FAM_EMPTY = { family: '', tutor: '', user: '', pass: '', phone: '', status: 'activo', students: [] };

function FamiliasAdmin({ go }) {
  const store = useStore();
  const families = store.all('familyAccounts');
  const [q, setQ] = React.useState('');
  const [reveal, setReveal] = React.useState(() => new Set());
  const [modal, setModal] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [form, setForm] = React.useState(FAM_EMPTY);
  const [info, setInfo] = React.useState(null); // familia para "ver información"

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const shown = families.filter(f => {
    if (!q.trim()) return true;
    const hay = [f.family, f.tutor, f.user, ...(f.students || []).map(s => s.name)].join(' ');
    return norm(hay).includes(norm(q));
  });

  const totalStudents = families.reduce((n, f) => n + (f.students ? f.students.length : 0), 0);
  const activas = families.filter(f => f.status === 'activo').length;
  const invitadas = families.filter(f => f.status === 'invitado').length;

  function toggleReveal(id) {
    setReveal(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function openNew() { setEditId(null); setForm({ ...FAM_EMPTY, pass: famGenPass() }); setModal(true); }
  function openEdit(f) { setEditId(f._id); setForm({ family: f.family, tutor: f.tutor, user: f.user, pass: f.pass, phone: f.phone || '', status: f.status, students: (f.students || []).map(s => ({ ...s })) }); setModal(true); }

  function toggleStudent(stu) {
    setForm(fm => {
      const has = fm.students.some(s => s.name === stu.name);
      return { ...fm, students: has ? fm.students.filter(s => s.name !== stu.name) : [...fm.students, { name: stu.name, grade: stu.grade }] };
    });
  }

  function save() {
    const family = form.family.trim();
    if (!family) { toast('Escribe el nombre de la familia', 'warn'); return; }
    if (!form.students.length) { toast('Vincula al menos un estudiante', 'warn'); return; }
    const payload = {
      family, tutor: form.tutor.trim(), phone: form.phone.trim(), status: form.status,
      user: (form.user.trim() || famUserFrom(family)), pass: form.pass || famGenPass(),
      students: form.students,
    };
    if (editId) {
      Store.update('familyAccounts', editId, payload);
      Store.log('Administración', 'actualizó la cuenta de ' + family, 'users');
      toast('Familia actualizada ✓');
    } else {
      Store.add('familyAccounts', { ...payload, last: payload.status === 'invitado' ? 'Sin acceso' : 'recién' });
      Store.log('Administración', 'creó la cuenta de ' + family, 'users');
      toast('Familia creada ✓');
    }
    setModal(false);
  }
  function resetPass(f) {
    const np = famGenPass();
    Store.update('familyAccounts', f._id, { pass: np });
    setReveal(prev => { const n = new Set(prev); n.add(f._id); return n; });
    famCopy(np, 'Nueva contraseña copiada');
  }
  function toggleStatus(f) {
    const next = f.status === 'suspendido' ? 'activo' : 'suspendido';
    Store.update('familyAccounts', f._id, { status: next });
    toast(next === 'activo' ? 'Acceso reactivado ✓' : 'Acceso suspendido', next === 'activo' ? 'ok' : 'info');
  }
  function remove(f) {
    Store.remove('familyAccounts', f._id);
    toast('Familia eliminada', 'info');
  }

  return (
    <div className="content-inner">
      <PageHead eyebrow="Administración" title="Familias" desc={families.length + ' cuentas con acceso al portal · ' + totalStudents + ' estudiantes vinculados'}>
        <CsvBar entity="familias" filename="familias-piaget" rows={families}
          columns={[
            { key: 'id', label: 'id', get: f => f._id },
            { key: 'familia', label: 'familia', get: f => f.family },
            { key: 'tutor', label: 'tutor', get: f => f.tutor },
            { key: 'usuario', label: 'usuario', get: f => f.user },
            { key: 'contrasena', label: 'contrasena', get: f => f.pass },
            { key: 'telefono', label: 'telefono', get: f => f.phone },
            { key: 'estatus', label: 'estatus', get: f => f.status },
            { key: 'estudiantes', label: 'estudiantes', get: f => (f.students || []).map(s => s.name + ' (' + s.grade + ')').join('; ') },
          ]}
          onImport={(objs) => {
            let added = 0, updated = 0;
            objs.forEach(o => {
              const family = (o.familia || o.family || '').trim();
              if (!family) return;
              const payload = {
                family, tutor: (o.tutor || '').trim(), user: (o.usuario || o.user || '').trim(),
                pass: (o.contrasena || o.password || o.pass || '').trim() || famGenPass(),
                phone: (o.telefono || o.phone || '').trim(), status: (o.estatus || o.status || 'activo').trim().toLowerCase(),
                students: famParseStudents(o.estudiantes || o.students || ''),
              };
              if (!payload.user) payload.user = famUserFrom(family);
              const id = (o.id || '').trim();
              const found = id ? families.find(f => f._id === id) : families.find(f => f.user === payload.user);
              if (found) { Store.update('familyAccounts', found._id, payload); updated++; }
              else { Store.add('familyAccounts', { ...payload, last: payload.status === 'invitado' ? 'Sin acceso' : 'recién' }); added++; }
            });
            Store.log('Administración', 'importó familias desde CSV', 'users');
            return { added, updated };
          }} />
        <button className="btn primary" onClick={openNew}><Icon name="plus" size={15} className="btn-ico" />Nueva familia</button>
      </PageHead>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Familias registradas', value: String(families.length), icon: 'users', tone: 'blue' },
          { label: 'Estudiantes vinculados', value: String(totalStudents), icon: 'cap', tone: 'violet' },
          { label: 'Cuentas activas', value: String(activas), icon: 'shield', tone: 'green' },
          { label: 'Invitaciones pendientes', value: String(invitadas), icon: 'inbox', tone: 'amber' },
        ].map((k, i) => {
          const t = window.TONE[k.tone];
          return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>;
        })}
      </div>

      <div className="card mt-16">
        <CardHead icon="users" title="Cuentas de familias" sub="Credenciales y estudiantes vinculados"
          right={<div className="inv-find" style={{ maxWidth: 280 }}>
            <Icon name="search" size={15} className="ic" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar familia, tutor o estudiante…" />
          </div>} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr>
              <th>Familia</th><th>Estudiantes vinculados</th><th>Usuario</th><th>Contraseña</th><th>Estatus</th><th>Último acceso</th><th></th>
            </tr></thead>
            <tbody>
              {shown.map((f) => (
                <tr key={f._id}>
                  <td>
                    <div className="person">
                      <Avatar name={f.family} size={34} />
                      <div><div className="pname">{f.family}</div><div className="pmeta">{f.tutor}</div></div>
                    </div>
                  </td>
                  <td>
                    <div className="row wrap gap-6">
                      {(f.students || []).map((s, i) => (
                        <span key={i} className="badge gray" title={s.grade} style={{ fontWeight: 500 }}>
                          <Icon name="cap" size={12} /> {s.name} · {s.grade}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td><span className="font-mono" style={{ fontSize: 12.5 }}>{f.user}</span></td>
                  <td>
                    <div className="row center gap-6">
                      <span className="font-mono" style={{ fontSize: 13, letterSpacing: reveal.has(f._id) ? 0 : '0.08em' }}>
                        {reveal.has(f._id) ? f.pass : '••••••••'}
                      </span>
                      <button className="icon-btn" style={{ width: 28, height: 28 }} title={reveal.has(f._id) ? 'Ocultar' : 'Mostrar'} onClick={() => toggleReveal(f._id)}><Icon name="eye" size={14} /></button>
                      <button className="icon-btn" style={{ width: 28, height: 28 }} title="Copiar contraseña" onClick={() => famCopy(f.pass, 'Contraseña copiada')}><Icon name="copy" size={14} /></button>
                    </div>
                  </td>
                  <td>{famStatusBadge(f.status)}</td>
                  <td className="faint" style={{ fontSize: 12.5 }}>{f.last}</td>
                  <td>
                    <RowMenu items={[
                      { icon: 'eye', label: 'Ver información', onClick: () => setInfo(f) },
                      { icon: 'edit', label: 'Editar familia', onClick: () => openEdit(f) },
                      { icon: 'refresh', label: 'Restablecer contraseña', onClick: () => resetPass(f) },
                      { icon: f.status === 'suspendido' ? 'check' : 'lock', label: f.status === 'suspendido' ? 'Reactivar acceso' : 'Suspender acceso', onClick: () => toggleStatus(f) },
                      { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => remove(f) },
                    ]} />
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={7}><div className="col center" style={{ alignItems: 'center', padding: '36px 0', gap: 8 }}>
                  <Icon name="users" size={26} className="faint" />
                  <div className="faint">Sin familias que coincidan con “{q}”.</div>
                </div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Modal alta / edición ---- */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar familia' : 'Nueva familia'} width={560}
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{editId ? 'Guardar cambios' : 'Crear familia'}</button></>}>
        <div className="field-row">
          <Field label="Nombre de la familia">
            <TextInput value={form.family} autoFocus placeholder="Familia …" onChange={e => {
              const v = e.target.value;
              setForm(fm => ({ ...fm, family: v, user: (!editId && (!fm.user || fm.user === famUserFrom(fm.family))) ? famUserFrom(v) : fm.user }));
            }} />
          </Field>
          <Field label="Tutor responsable"><TextInput value={form.tutor} placeholder="Nombre del tutor" onChange={e => setForm({ ...form, tutor: e.target.value })} /></Field>
        </div>
        <div className="field-row">
          <Field label="Usuario (correo)"><TextInput value={form.user} placeholder="familia@jeanpiaget.mx" onChange={e => setForm({ ...form, user: e.target.value })} /></Field>
          <Field label="Teléfono"><TextInput value={form.phone} placeholder="55 0000 0000" onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
        </div>
        <div className="field-row">
          <Field label="Contraseña">
            <div className="inp-pass-row" style={{ display: 'flex', gap: 8 }}>
              <TextInput value={form.pass} placeholder="Contraseña" onChange={e => setForm({ ...form, pass: e.target.value })} style={{ flex: 1, fontFamily: 'var(--font-mono)' }} />
              <button className="btn sm" type="button" onClick={() => setForm({ ...form, pass: famGenPass() })}><Icon name="refresh" size={13} className="btn-ico" />Generar</button>
            </div>
          </Field>
          <Field label="Estatus"><SelectInput value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={[{ value: 'activo', label: 'Activo' }, { value: 'invitado', label: 'Invitado' }, { value: 'suspendido', label: 'Suspendido' }]} /></Field>
        </div>

        <Field label={'Estudiantes vinculados (' + form.students.length + ')'}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', maxHeight: 220, overflowY: 'auto' }}>
            {(DB.students || []).map((s, i) => {
              const checked = form.students.some(x => x.name === s.name);
              return (
                <button key={i} type="button" onClick={() => toggleStudent(s)} className="row center between"
                  style={{ width: '100%', textAlign: 'left', border: 'none', borderBottom: i < DB.students.length - 1 ? '1px solid var(--border)' : 'none', background: checked ? 'var(--accent-soft)' : 'transparent', padding: '9px 12px', gap: 10 }}>
                  <span className="row center gap-9">
                    <Avatar name={s.name} size={26} />
                    <span><span style={{ fontWeight: 600, fontSize: 13.5 }}>{s.name}</span> <span className="faint" style={{ fontSize: 12 }}>· {s.grade}</span></span>
                  </span>
                  <span className="famcheck" style={{ width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', border: checked ? 'none' : '1.5px solid var(--border-strong)', background: checked ? 'var(--accent)' : 'transparent', color: '#fff', flexShrink: 0 }}>
                    {checked && <Icon name="check" size={13} />}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
      </Modal>

      {/* ---- Modal: información que revisa la familia ---- */}
      <Modal open={!!info} onClose={() => setInfo(null)} title={info ? info.family : ''} width={560}
        footer={<button className="btn primary" onClick={() => setInfo(null)}>Cerrar</button>}>
        {info && <>
          <div className="row center gap-12" style={{ marginBottom: 6 }}>
            <Avatar name={info.family} size={42} />
            <div className="grow">
              <div style={{ fontWeight: 700 }}>{info.tutor || info.family}</div>
              <div className="faint font-mono" style={{ fontSize: 12 }}>{info.user}</div>
            </div>
            {famStatusBadge(info.status)}
          </div>
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 4 }}>Información disponible para esta familia en su portal:</div>
          <div className="col gap-10">
            {(info.students || []).map((s, i) => {
              const d = famStudentInfo(s.name);
              return (
                <div key={i} className="card pad" style={{ padding: 14 }}>
                  <div className="row center gap-10" style={{ marginBottom: d ? 12 : 0 }}>
                    <Avatar name={s.name} size={34} />
                    <div className="grow"><div style={{ fontWeight: 600 }}>{s.name}</div><div className="faint" style={{ fontSize: 12 }}>{s.grade}</div></div>
                    {d && <Badge tone={d.pay === 'al día' ? 'green' : 'red'}>{d.pay === 'al día' ? 'Pagos al día' : 'Pago atrasado'}</Badge>}
                  </div>
                  {d && <div className="row" style={{ gap: 0 }}>
                    {[{ k: 'Promedio', v: d.avg.toFixed(1) }, { k: 'Asistencia', v: d.att + '%' }, { k: 'Riesgo', v: d.risk === 'low' ? 'Bajo' : d.risk === 'mid' ? 'Medio' : 'Alto' }].map((m, j) => (
                      <div key={j} style={{ flex: 1, borderLeft: j ? '1px solid var(--border)' : 'none', paddingLeft: j ? 14 : 0 }}>
                        <div className="faint" style={{ fontSize: 11 }}>{m.k}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{m.v}</div>
                      </div>
                    ))}
                  </div>}
                </div>
              );
            })}
          </div>
        </>}
      </Modal>
    </div>
  );
}

Object.assign(window, { FamiliasAdmin });

/* Autenticación: familias acceden con su usuario y contraseña */
(window.AUTH_RESOLVERS = window.AUTH_RESOLVERS || []).push((id, pass) => {
  const f = ((window.DB && DB.familyAccounts) || []).find(x => x.user && x.user.toLowerCase() === id);
  if (!f) return null;
  if (f.status === 'suspendido') return { ok: false, error: 'El acceso de esta familia está suspendido.' };
  if (f.pass === pass && pass) return { name: f.family, role: 'Familias', email: f.user, kind: 'Familia', vista: 'boletines', students: f.students };
  return { ok: false, error: 'Contraseña incorrecta.' };
});
