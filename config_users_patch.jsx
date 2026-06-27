/* config_users_patch.jsx — Configuración > Usuarios y roles conectado a app_accounts */
(function () {
  const TONES = { 'Dirección': 'violet', 'Coordinación': 'blue', 'Docentes': 'cyan', 'Finanzas': 'green', 'Admisiones': 'amber', 'Recepción': 'red', 'Familias': 'amber', 'Estudiantes': 'violet' };
  const STATUSES = ['Activo', 'Invitado', 'Suspendido'];
  const PERMS = ['Sin acceso', 'Ver', 'Editar', 'Total'];

  function token() {
    try { return (JSON.parse(localStorage.getItem('piaget_session') || 'null') || {}).session_token || ''; }
    catch (_) { return ''; }
  }
  async function sb() {
    if (window.PiagetSettings && window.PiagetSettings.client) return await window.PiagetSettings.client();
    if (window.PIAGET_SB) return window.PIAGET_SB;
    throw new Error('Cliente Supabase no disponible');
  }
  async function rpc(name, args) {
    const t = token();
    if (!t) throw new Error('Sin sesión segura. Cierra sesión y vuelve a entrar como Dirección.');
    const c = await sb();
    const { data, error } = await c.rpc(name, { p_token: t, ...(args || {}) });
    if (error) throw new Error(error.message || 'Error RPC');
    return data;
  }
  function tone(role) { return TONES[role] || 'gray'; }
  function statusTone(s) { return s === 'Activo' ? 'green' : s === 'Suspendido' ? 'gray' : 'amber'; }
  function genPass() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let p = ''; for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
    return p;
  }

  function AccountModal({ user, onClose, onSave }) {
    const isNew = !user;
    const [form, setForm] = React.useState(() => user ? { secret: '', ...user } : { name: '', email: '', role: 'Docentes', status: 'Activo', twoFA: false, last: '—', secret: genPass() });
    const [show, setShow] = React.useState(isNew);
    const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const save = () => {
      if (!String(form.name || '').trim()) { toast('Escribe el nombre del usuario', 'warn'); return; }
      if (!/.+@.+\..+/.test(String(form.email || ''))) { toast('Correo no válido', 'warn'); return; }
      if (isNew && !String(form.secret || '').trim()) { toast('Asigna una contraseña', 'warn'); return; }
      onSave({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), pass: form.secret || '', tone: tone(form.role) });
    };
    return (
      <Modal open width={500} onClose={onClose} title={isNew ? 'Crear usuario con acceso' : 'Editar usuario'}
        footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{isNew ? 'Crear usuario' : 'Guardar usuario'}</button></>}>
        <div className="col gap-14">
          <div className="ai-panel" style={{ margin: 0 }}><div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}><div className="insight-ico" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}><Icon name="shield" size={16} /></div><div className="insight-body"><div className="insight-title">Cuenta real de acceso</div><div className="insight-text">Al guardar se crea o actualiza el perfil en Supabase, se genera hash seguro y esas credenciales ya sirven en la pantalla de acceso.</div></div></div></div>
          <Field label="Nombre completo"><TextInput value={form.name || ''} onChange={e => upd('name', e.target.value)} placeholder="Ej. Ana López" /></Field>
          <Field label="Correo electrónico / usuario"><TextInput value={form.email || ''} onChange={e => upd('email', e.target.value)} placeholder="correo@jeanpiaget.mx" /></Field>
          <div className="field-row"><Field label="Rol"><SelectInput value={form.role || 'Docentes'} onChange={e => upd('role', e.target.value)} options={DB.roles.map(r => r.role)} /></Field><Field label="Estado"><SelectInput value={form.status || 'Activo'} onChange={e => upd('status', e.target.value)} options={STATUSES} /></Field></div>
          <Field label={isNew ? 'Contraseña inicial' : 'Nueva contraseña opcional'}>
            <div className="row center gap-8"><div className="grow"><TextInput type={show ? 'text' : 'password'} value={form.secret || ''} onChange={e => upd('secret', e.target.value)} placeholder={isNew ? 'Contraseña inicial' : 'Deja vacío para conservar'} /></div><button className="btn sm" type="button" onClick={() => setShow(s => !s)}><Icon name="eye" size={14} className="btn-ico" />{show ? 'Ocultar' : 'Ver'}</button><button className="btn sm" type="button" onClick={() => { upd('secret', genPass()); setShow(true); }}><Icon name="refresh" size={14} className="btn-ico" />Generar</button></div>
          </Field>
          <div className="faint" style={{ fontSize: 12 }}>Recomendación: deja el estado en <b>Activo</b>. Si lo marcas como Suspendido, no podrá entrar.</div>
        </div>
      </Modal>
    );
  }

  function CfgUsers({ cfg, set }) {
    const [users, setUsers] = React.useState(cfg.users || []);
    const [loading, setLoading] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [deleting, setDeleting] = React.useState(null);
    const matrix = DB.roles.map((r, i) => (cfg.permMatrix && cfg.permMatrix[i]) ? [...cfg.permMatrix[i]] : [...r.matrix]);
    const cycle = (ri, ci) => set('permMatrix', matrix.map((row, i) => i === ri ? row.map((v, j) => j === ci ? (v + 1) % 4 : v) : row));

    async function loadAccounts() {
      setLoading(true);
      try {
        const list = await rpc('piaget_accounts_read');
        const clean = (Array.isArray(list) ? list : []).map(u => ({ ...u, tone: tone(u.role) }));
        setUsers(clean);
        set('users', clean);
      } catch (e) { toast('No se pudieron cargar usuarios reales: ' + e.message, 'warn'); }
      finally { setLoading(false); }
    }
    React.useEffect(() => { loadAccounts(); }, []);

    async function saveUser(data) {
      setLoading(true);
      try {
        const saved = await rpc('piaget_account_upsert', { p_account: { ...data, password: data.pass || undefined } });
        const row = { ...saved, tone: tone(saved.role) };
        const exists = users.findIndex(u => (u.id && u.id === row.id) || (u.email && u.email === row.email));
        const next = exists >= 0 ? users.map((u, i) => i === exists ? row : u) : [row, ...users];
        setUsers(next); set('users', next);
        toast('Usuario creado/actualizado en Supabase ✓', 'ok');
        setEditing(null);
      } catch (e) { toast('No se pudo guardar el acceso: ' + e.message, 'warn'); }
      finally { setLoading(false); }
    }
    async function removeUser(u) {
      if (!u || !u.id) { toast('Este usuario no tiene ID de acceso real', 'warn'); setDeleting(null); return; }
      setLoading(true);
      try {
        await rpc('piaget_account_delete', { p_account_id: u.id });
        const next = users.filter(x => x.id !== u.id);
        setUsers(next); set('users', next);
        toast('Usuario eliminado de Supabase', 'warn');
        setDeleting(null);
      } catch (e) { toast('No se pudo eliminar: ' + e.message, 'warn'); }
      finally { setLoading(false); }
    }
    function setStatus(i, status) { saveUser({ ...users[i], status, pass: '' }); }

    const roleCount = roleName => users.filter(u => u.role === roleName).length;

    return (
      <div className="cfg-section">
        <SecHead title="Usuarios y roles" desc="Administra cuentas reales de acceso, roles y permisos. Los usuarios se guardan en Supabase." />
        <div className="card">
          <CardHead icon="users" title="Usuarios" sub={(loading ? 'Sincronizando… · ' : '') + users.length + ' cuentas reales · ' + DB.roles.length + ' roles'}
            right={<div className="row gap-8 center"><button className="btn sm" onClick={loadAccounts}><Icon name="refresh" size={13} className="btn-ico" />Sincronizar</button><button className="btn sm primary" onClick={() => setEditing({ user: null })}><Icon name="plus" size={13} className="btn-ico" />Crear usuario</button></div>} />
          <div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Usuario</th><th>Rol</th><th>Última actividad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
            {users.map((u, i) => <tr key={u.id || u.email || i}><td><div className="person clickable" onClick={() => setEditing({ index: i, user: u })}><Avatar name={u.name || u.email} size={32} /><div style={{ minWidth: 0 }}><div className="pname" style={{ whiteSpace: 'nowrap' }}>{u.name}</div><div className="pmeta">{u.email || u.username}</div></div></div></td><td><Badge tone={u.tone || tone(u.role)}>{u.role}</Badge></td><td className="muted" style={{ fontSize: 13 }}>{u.last || '—'}</td><td><Badge tone={statusTone(u.status)}>{u.status || 'Activo'}</Badge></td><td><RowMenu items={[{ icon: 'edit', label: 'Editar usuario', onClick: () => setEditing({ index: i, user: u }) }, { icon: 'refresh', label: 'Cambiar contraseña', onClick: () => setEditing({ index: i, user: u }) }, u.status === 'Suspendido' ? { icon: 'check', label: 'Reactivar acceso', onClick: () => setStatus(i, 'Activo') } : { icon: 'logout', label: 'Suspender acceso', onClick: () => setStatus(i, 'Suspendido') }, { icon: 'trash', label: 'Eliminar usuario', danger: true, onClick: () => setDeleting(u) }]} /></td></tr>)}
            {!users.length && <tr><td colSpan="5" className="faint" style={{ textAlign: 'center', padding: 28 }}>Sin usuarios cargados. Presiona Sincronizar.</td></tr>}
          </tbody></table></div>
        </div>
        <div className="card"><CardHead icon="lock" title="Matriz de permisos" sub="Toca una celda para cambiar el nivel · Sin acceso → Ver → Editar → Total" /><div style={{ overflowX: 'auto', padding: '4px 16px 12px' }}><table className="perm-tbl"><thead><tr><th>Rol</th>{DB.permModules.map(m => <th key={m}>{m}</th>)}</tr></thead><tbody>{DB.roles.map((r, ri) => <tr key={r.role}><td><div className="row center gap-8"><Badge tone={r.tone}>{r.role}</Badge><span className="faint" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>{roleCount(r.role)} usuarios</span></div></td>{DB.permModules.map((m, ci) => { const lvl = matrix[ri][ci]; return <td key={m}><span className={'perm-cell perm-' + lvl} onClick={() => cycle(ri, ci)}>{PERMS[lvl]}</span></td>; })}</tr>)}</tbody></table></div></div>
        {editing && <AccountModal user={editing.user} onClose={() => setEditing(null)} onSave={saveUser} />}
        {deleting && <Modal open width={440} onClose={() => setDeleting(null)} title="Eliminar usuario" footer={<><button className="btn" onClick={() => setDeleting(null)}>Cancelar</button><button className="btn primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => removeUser(deleting)}><Icon name="trash" size={15} className="btn-ico" />Eliminar</button></>}><p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>¿Eliminar a <b>{deleting.name || deleting.email}</b>? Perderá el acceso a la plataforma.</p></Modal>}
      </div>
    );
  }

  window.CfgUsers = CfgUsers;
})();
