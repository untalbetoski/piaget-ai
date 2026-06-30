/* config_users_safe_patch.jsx — Usuarios y roles sin demos ni error bloqueante */
(function () {
  const TONES = { 'Dirección': 'violet', 'Coordinación': 'blue', 'Docentes': 'cyan', 'Finanzas': 'green', 'Admisiones': 'amber', 'Recepción': 'red', 'Familias': 'amber', 'Estudiantes': 'violet' };
  const STATUSES = ['Activo', 'Invitado', 'Suspendido'];
  const PERMS = ['Sin acceso', 'Ver', 'Editar', 'Total'];
  function token() { try { return (JSON.parse(localStorage.getItem('piaget_session') || 'null') || {}).session_token || ''; } catch (_) { return ''; } }
  async function client() {
    if (window.PIAGET_SB) return window.PIAGET_SB;
    if (!window.supabase) {
      await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    }
    const cfg = window.PIAGET_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseKey) throw new Error('Conexión Supabase no configurada');
    window.PIAGET_SB = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    return window.PIAGET_SB;
  }
  async function rpc(name, args) {
    const t = token();
    if (!t) throw new Error('Inicia sesión con una cuenta real de Dirección para administrar usuarios.');
    const sb = await client();
    const { data, error } = await sb.rpc(name, { p_token: t, ...(args || {}) });
    if (error) throw new Error(error.message || 'Error RPC');
    return data;
  }
  function tone(role) { return TONES[role] || 'gray'; }
  function statusTone(s) { return s === 'Activo' ? 'green' : s === 'Suspendido' ? 'gray' : 'amber'; }
  function genPass() { const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; let p = ''; for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)]; return p; }
  function normalizeUsers(list) { return (Array.isArray(list) ? list : []).filter(u => u && (u.email || u.username || u.name)).map(u => ({ ...u, id: u.id || u._id || '', email: String(u.email || u.username || '').toLowerCase(), status: u.status || 'Activo', tone: tone(u.role) })); }
  function localUsers() { return normalizeUsers((DB.settings && DB.settings.usersReal) || []); }
  function persistLocalUsers(users, set) { DB.settings = DB.settings || {}; DB.settings.usersReal = normalizeUsers(users); if (set) set('usersReal', DB.settings.usersReal); if (window.Store && Store.saveState) Store.saveState(); }

  function AccountModal({ user, onClose, onSave }) {
    const isNew = !user;
    const [form, setForm] = React.useState(() => user ? { secret: '', ...user } : { name: '', email: '', role: 'Docentes', status: 'Activo', twoFA: false, last: '—', secret: genPass() });
    const [show, setShow] = React.useState(isNew);
    const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const save = () => {
      if (!String(form.name || '').trim()) { toast('Escribe el nombre del usuario', 'warn'); return; }
      if (!/.+@.+\..+/.test(String(form.email || ''))) { toast('Correo no válido', 'warn'); return; }
      onSave({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), pass: form.secret || '', tone: tone(form.role) });
    };
    return <Modal open width={500} onClose={onClose} title={isNew ? 'Crear usuario con acceso' : 'Editar usuario'} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{isNew ? 'Crear usuario' : 'Guardar usuario'}</button></>}>
      <div className="col gap-14"><div className="ai-panel" style={{ margin: 0 }}><div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}><div className="insight-ico" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}><Icon name="shield" size={16} /></div><div className="insight-body"><div className="insight-title">Cuenta de acceso</div><div className="insight-text">Si existe sesión segura, se guarda en Supabase. Si no, queda pendiente en el estado central y no se muestran usuarios demo.</div></div></div></div>
      <Field label="Nombre completo"><TextInput value={form.name || ''} onChange={e => upd('name', e.target.value)} placeholder="Ej. Ana López" /></Field>
      <Field label="Correo electrónico / usuario"><TextInput value={form.email || ''} onChange={e => upd('email', e.target.value)} placeholder="correo@soypiaget.app" /></Field>
      <div className="field-row"><Field label="Rol"><SelectInput value={form.role || 'Docentes'} onChange={e => upd('role', e.target.value)} options={(DB.roles || []).map(r => r.role)} /></Field><Field label="Estado"><SelectInput value={form.status || 'Activo'} onChange={e => upd('status', e.target.value)} options={STATUSES} /></Field></div>
      <Field label={isNew ? 'Contraseña inicial' : 'Nueva contraseña opcional'}><div className="row center gap-8"><div className="grow"><TextInput type={show ? 'text' : 'password'} value={form.secret || ''} onChange={e => upd('secret', e.target.value)} placeholder={isNew ? 'Contraseña inicial' : 'Deja vacío para conservar'} /></div><button className="btn sm" type="button" onClick={() => setShow(s => !s)}><Icon name="eye" size={14} className="btn-ico" />{show ? 'Ocultar' : 'Ver'}</button><button className="btn sm" type="button" onClick={() => { upd('secret', genPass()); setShow(true); }}><Icon name="refresh" size={14} className="btn-ico" />Generar</button></div></Field></div>
    </Modal>;
  }

  function CfgUsers({ cfg, set }) {
    const [users, setUsers] = React.useState(() => localUsers());
    const [loading, setLoading] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [deleting, setDeleting] = React.useState(null);
    const [status, setStatus] = React.useState(token() ? 'Conectando con Supabase…' : 'Sin sesión segura de Dirección');
    const matrix = (DB.roles || []).map((r, i) => (cfg.permMatrix && cfg.permMatrix[i]) ? [...cfg.permMatrix[i]] : [...r.matrix]);
    const cycle = (ri, ci) => set('permMatrix', matrix.map((row, i) => i === ri ? row.map((v, j) => j === ci ? (v + 1) % 4 : v) : row));
    async function loadAccounts() {
      setLoading(true);
      try {
        const list = await rpc('piaget_accounts_read');
        const clean = normalizeUsers(list);
        setUsers(clean); persistLocalUsers(clean, set); setStatus('Usuarios reales cargados desde Supabase');
      } catch (e) {
        const fallback = localUsers();
        setUsers(fallback);
        setStatus(e.message || 'No se pudo cargar Supabase');
      } finally { setLoading(false); }
    }
    React.useEffect(() => { loadAccounts(); }, []);
    async function saveUser(data) {
      setLoading(true);
      try {
        const saved = await rpc('piaget_account_upsert', { p_account: { ...data, password: data.pass || undefined } });
        const row = normalizeUsers([{ ...saved, tone: tone(saved.role) }])[0];
        const next = users.some(u => (u.id && row.id && u.id === row.id) || (u.email && u.email === row.email)) ? users.map(u => ((u.id && row.id && u.id === row.id) || u.email === row.email) ? row : u) : [row, ...users];
        setUsers(next); persistLocalUsers(next, set); setStatus('Guardado en Supabase'); toast('Usuario creado/actualizado en Supabase ✓', 'ok'); setEditing(null);
      } catch (e) {
        const row = { ...data, id: data.id || data._id || ('usr-' + Date.now()), status: data.status || 'Activo', tone: tone(data.role) };
        const next = users.some(u => u.id === row.id || u.email === row.email) ? users.map(u => (u.id === row.id || u.email === row.email) ? row : u) : [row, ...users];
        setUsers(next); persistLocalUsers(next, set); setStatus('Pendiente de sincronizar: ' + (e.message || 'sin conexión segura')); toast('Usuario guardado en estado central; inicia sesión real de Dirección para sincronizar acceso', 'warn'); setEditing(null);
      } finally { setLoading(false); }
    }
    async function removeUser(u) {
      setLoading(true);
      try { if (u && u.id && token()) await rpc('piaget_account_delete', { p_account_id: u.id }); } catch (_) {}
      const next = users.filter(x => x.id !== u.id && x.email !== u.email); setUsers(next); persistLocalUsers(next, set); setDeleting(null); setLoading(false); toast('Usuario eliminado', 'warn');
    }
    const roleCount = roleName => users.filter(u => u.role === roleName).length;
    return <div className="cfg-section"><SecHead title="Usuarios y roles" desc="Administra cuentas reales de acceso. No se muestran usuarios demo." />
      <div className="card"><CardHead icon="users" title="Usuarios" sub={(loading ? 'Sincronizando… · ' : '') + users.length + ' cuentas · ' + status} right={<div className="row gap-8 center"><button className="btn sm" onClick={loadAccounts}><Icon name="refresh" size={13} className="btn-ico" />Sincronizar</button><button className="btn sm primary" onClick={() => setEditing({ user: null })}><Icon name="plus" size={13} className="btn-ico" />Crear usuario</button></div>} />
      <div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Usuario</th><th>Rol</th><th>Última actividad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{users.map((u, i) => <tr key={u.id || u.email || i}><td><div className="person clickable" onClick={() => setEditing({ index: i, user: u })}><Avatar name={u.name || u.email} size={32} /><div style={{ minWidth: 0 }}><div className="pname" style={{ whiteSpace: 'nowrap' }}>{u.name || 'Usuario'}</div><div className="pmeta">{u.email || u.username}</div></div></div></td><td><Badge tone={u.tone || tone(u.role)}>{u.role}</Badge></td><td className="muted" style={{ fontSize: 13 }}>{u.last || '—'}</td><td><Badge tone={statusTone(u.status)}>{u.status || 'Activo'}</Badge></td><td><RowMenu items={[{ icon: 'edit', label: 'Editar usuario', onClick: () => setEditing({ index: i, user: u }) }, u.status === 'Suspendido' ? { icon: 'check', label: 'Reactivar acceso', onClick: () => saveUser({ ...u, status: 'Activo', pass: '' }) } : { icon: 'logout', label: 'Suspender acceso', onClick: () => saveUser({ ...u, status: 'Suspendido', pass: '' }) }, { icon: 'trash', label: 'Eliminar usuario', danger: true, onClick: () => setDeleting(u) }]} /></td></tr>)}{!users.length && <tr><td colSpan="5" className="faint" style={{ textAlign: 'center', padding: 28 }}>Sin usuarios reales cargados. Inicia sesión con una cuenta real de Dirección y presiona Sincronizar.</td></tr>}</tbody></table></div></div>
      <div className="card"><CardHead icon="lock" title="Matriz de permisos" sub="Toca una celda para cambiar el nivel · Sin acceso → Ver → Editar → Total" /><div style={{ overflowX: 'auto', padding: '4px 16px 12px' }}><table className="perm-tbl"><thead><tr><th>Rol</th>{(DB.permModules || []).map(m => <th key={m}>{m}</th>)}</tr></thead><tbody>{(DB.roles || []).map((r, ri) => <tr key={r.role}><td><div className="row center gap-8"><Badge tone={r.tone}>{r.role}</Badge><span className="faint" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>{roleCount(r.role)} usuarios</span></div></td>{(DB.permModules || []).map((m, ci) => { const lvl = matrix[ri][ci]; return <td key={m}><span className={'perm-cell perm-' + lvl} onClick={() => cycle(ri, ci)}>{PERMS[lvl]}</span></td>; })}</tr>)}</tbody></table></div></div>
      {editing && <AccountModal user={editing.user} onClose={() => setEditing(null)} onSave={saveUser} />}{deleting && <Modal open width={440} onClose={() => setDeleting(null)} title="Eliminar usuario" footer={<><button className="btn" onClick={() => setDeleting(null)}>Cancelar</button><button className="btn primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => removeUser(deleting)}><Icon name="trash" size={15} className="btn-ico" />Eliminar</button></>}><p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>¿Eliminar a <b>{deleting.name || deleting.email}</b>?</p></Modal>}
    </div>;
  }
  window.CfgUsers = CfgUsers;
})();
