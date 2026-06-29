/* config_admin_roles_patch.jsx — Usuarios y roles solo administrativos */
(function () {
  const ADMIN_ROLES = ['Dirección', 'Coordinación', 'Finanzas', 'Admisiones', 'Recepción'];
  const ROLE_TONES = { 'Dirección': 'violet', 'Coordinación': 'blue', 'Finanzas': 'green', 'Admisiones': 'amber', 'Recepción': 'red' };
  const STATUSES = ['Activo', 'Invitado', 'Suspendido'];
  const PERMS = ['Sin acceso', 'Ver', 'Editar', 'Total'];
  const DEFAULT_MATRIX = [
    [3, 3, 3, 3, 3, 3, 3, 3],
    [2, 2, 2, 2, 1, 2, 2, 2],
    [0, 0, 1, 3, 0, 0, 1, 2],
    [0, 3, 0, 1, 0, 0, 0, 1],
    [1, 1, 0, 0, 2, 0, 0, 0],
  ];

  function isAdminRole(role) { return ADMIN_ROLES.includes(String(role || '').trim()); }
  function roleTone(role) { return ROLE_TONES[role] || 'gray'; }
  function statusTone(s) { return s === 'Activo' ? 'green' : s === 'Suspendido' ? 'gray' : 'amber'; }
  function safeSessionToken() { try { return (JSON.parse(localStorage.getItem('piaget_session') || 'null') || {}).session_token || ''; } catch (_) { return ''; } }
  async function sb() {
    if (window.PiagetSettings && window.PiagetSettings.client) return await window.PiagetSettings.client();
    if (window.PIAGET_SB) return window.PIAGET_SB;
    throw new Error('Cliente Supabase no disponible');
  }
  async function rpc(name, args) {
    const p_token = safeSessionToken();
    if (!p_token) throw new Error('Sin sesión segura. Cierra sesión y vuelve a entrar como Dirección.');
    const c = await sb();
    const { data, error } = await c.rpc(name, { p_token, ...(args || {}) });
    if (error) throw new Error(error.message || 'Error Supabase');
    return data;
  }
  function genSecret() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let out = ''; for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }
  function initials(name) { return String(name || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
  function qrPayload(u) { return { type: 'staff', id: u.id || u._id || '', name: u.name || u.email || 'Usuario', email: u.email || u.username || '', role: u.role || 'Staff', grade: u.role || 'Staff', status: u.status || 'Activo', institution: 'PIAGET', v: 1 }; }
  function qrSvg(payload) { try { if (!window.qrcode) return ''; const q = window.qrcode(0, 'M'); q.addData(JSON.stringify(payload)); q.make(); return q.createSvgTag(5, 2); } catch (_) { return ''; } }

  function ensureCredentialPrintStyles() {
    if (document.getElementById('piaget-active-admin-credential-print')) return;
    const style = document.createElement('style');
    style.id = 'piaget-active-admin-credential-print';
    style.textContent = `
      @media print {
        @page { margin: 12mm; }
        html, body { overflow: visible !important; background: #fff !important; height: auto !important; }
        body * { visibility: hidden !important; }
        .cred-print, .cred-print * { visibility: visible !important; }
        .cred-print {
          position: fixed !important;
          left: 50% !important;
          top: 20px !important;
          transform: translateX(-50%) !important;
          width: 330px !important;
          max-width: 330px !important;
          box-shadow: none !important;
          background: #fff !important;
          color: #111827 !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .cred-print .badge {
          white-space: normal !important;
          max-width: 220px !important;
          text-align: center !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }
        .cred-print svg { max-width: 100% !important; height: auto !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function AccountModal({ user, onClose, onSave }) {
    const isNew = !user;
    const [form, setForm] = React.useState(() => user ? { ...user, secret: '' } : { name: '', email: '', role: 'Dirección', status: 'Activo', secret: genSecret() });
    const [show, setShow] = React.useState(isNew);
    const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
    function save() {
      if (!String(form.name || '').trim()) return toast('Escribe el nombre del usuario', 'warn');
      if (!/.+@.+\..+/.test(String(form.email || ''))) return toast('Correo no válido', 'warn');
      if (!isAdminRole(form.role)) return toast('Solo se permiten roles administrativos', 'warn');
      if (isNew && !String(form.secret || '').trim()) return toast('Asigna una contraseña', 'warn');
      onSave({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), pass: form.secret || '', tone: roleTone(form.role) });
    }
    return <Modal open width={500} onClose={onClose} title={isNew ? 'Crear usuario administrativo' : 'Editar usuario administrativo'} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar</button></>}>
      <div className="col gap-14">
        <div className="ai-panel" style={{ margin: 0 }}><div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}><div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}><Icon name="shield" size={16} /></div><div className="insight-body"><div className="insight-title">Roles administrativos</div><div className="insight-text">Aquí solo se crean cuentas de Dirección, Coordinación, Finanzas, Admisiones y Recepción. Docentes, estudiantes y familias se administran desde sus módulos.</div></div></div></div>
        <Field label="Nombre completo"><TextInput value={form.name || ''} onChange={e => upd('name', e.target.value)} placeholder="Ej. Ana López" /></Field>
        <Field label="Correo electrónico / usuario"><TextInput value={form.email || ''} onChange={e => upd('email', e.target.value)} placeholder="correo@jeanpiaget.mx" /></Field>
        <div className="field-row"><Field label="Rol"><SelectInput value={form.role || 'Dirección'} onChange={e => upd('role', e.target.value)} options={ADMIN_ROLES} /></Field><Field label="Estado"><SelectInput value={form.status || 'Activo'} onChange={e => upd('status', e.target.value)} options={STATUSES} /></Field></div>
        <Field label={isNew ? 'Contraseña inicial' : 'Nueva contraseña opcional'}><div className="row center gap-8"><div className="grow"><TextInput type={show ? 'text' : 'password'} value={form.secret || ''} onChange={e => upd('secret', e.target.value)} placeholder={isNew ? 'Contraseña inicial' : 'Deja vacío para conservar'} /></div><button className="btn sm" type="button" onClick={() => setShow(s => !s)}>{show ? 'Ocultar' : 'Ver'}</button><button className="btn sm" type="button" onClick={() => { upd('secret', genSecret()); setShow(true); }}>Generar</button></div></Field>
      </div>
    </Modal>;
  }

  function CredentialModal({ user, onClose }) {
    React.useEffect(() => { ensureCredentialPrintStyles(); }, []);
    const payload = qrPayload(user || {});
    const svg = React.useMemo(() => qrSvg(payload), [user && user.id, user && user.email, user && user.role, user && user.status]);
    const t = window.TONE[roleTone(user && user.role)] || window.TONE.gray;
    return <Modal open width={740} onClose={onClose} title="Credencial de acceso" footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={() => { ensureCredentialPrintStyles(); window.print(); }}><Icon name="download" size={15} className="btn-ico" />Imprimir</button></>}>
      <div className="row" style={{ gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="card cred-print" style={{ width: 330, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ padding: 18, background: 'linear-gradient(135deg, var(--surface), var(--surface-2))', borderBottom: '1px solid var(--border)' }}><div className="row between center"><div><div className="eyebrow">Credencial administrativa</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>PIAGET</div></div><Badge tone={(user.status || 'Activo') === 'Activo' ? 'green' : 'gray'} dot>{user.status || 'Activo'}</Badge></div></div>
          <div style={{ padding: 20 }}><div className="row center gap-12" style={{ marginBottom: 16 }}><div style={{ width: 58, height: 58, borderRadius: 18, display: 'grid', placeItems: 'center', color: t.c, background: t.bg, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>{initials(user.name || user.email)}</div><div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 16 }}>{user.name || 'Usuario'}</div><div className="faint" style={{ fontSize: 12.5 }}>{user.email || user.username || '—'}</div><div style={{ marginTop: 7 }}><Badge tone={roleTone(user.role)}>{user.role}</Badge></div></div></div><div style={{ display: 'grid', placeItems: 'center', background: '#fff', borderRadius: 18, padding: 14, border: '1px solid var(--border)' }}>{svg ? <div style={{ width: 210, height: 210, display: 'grid', placeItems: 'center' }} dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="faint" style={{ height: 210, display: 'grid', placeItems: 'center' }}>QR no disponible</div>}</div><div className="faint" style={{ fontSize: 11.5, marginTop: 12, textAlign: 'center' }}>Este QR registra entrada en Control de Accesos.</div></div>
        </div>
        <div className="card pad" style={{ flex: 1, minWidth: 260 }}><div className="card-title" style={{ marginBottom: 10 }}><Icon name="shield" size={17} className="ico" />Uso</div><p className="faint" style={{ fontSize: 13, lineHeight: 1.55 }}>Escanea esta credencial desde Control de Accesos → Scanner QR. El movimiento se guardará en Supabase con el rol administrativo del usuario.</p></div>
      </div>
    </Modal>;
  }

  function CfgUsers({ cfg, set }) {
    const [users, setUsers] = React.useState((cfg.users || []).filter(u => isAdminRole(u.role)));
    const [loading, setLoading] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [deleting, setDeleting] = React.useState(null);
    const [credential, setCredential] = React.useState(null);
    const modules = DB.permModules || [];
    const roles = ADMIN_ROLES.map((name, i) => ({ role: name, tone: roleTone(name), matrix: (cfg.adminPermMatrix && cfg.adminPermMatrix[i]) || DEFAULT_MATRIX[i] || modules.map(() => 1) }));
    const matrix = roles.map(r => [...r.matrix]);
    const cycle = (ri, ci) => set('adminPermMatrix', matrix.map((row, i) => i === ri ? row.map((v, j) => j === ci ? (v + 1) % 4 : v) : row));

    async function loadAccounts() {
      setLoading(true);
      try {
        const list = await rpc('piaget_accounts_read');
        const clean = (Array.isArray(list) ? list : []).filter(u => isAdminRole(u.role)).map(u => ({ ...u, tone: roleTone(u.role) }));
        setUsers(clean); set('users', clean);
      } catch (e) { toast('No se pudieron cargar usuarios administrativos: ' + e.message, 'warn'); }
      finally { setLoading(false); }
    }
    React.useEffect(() => { loadAccounts(); }, []);

    async function saveUser(data) {
      if (!isAdminRole(data.role)) return toast('Solo puedes guardar roles administrativos en esta sección', 'warn');
      setLoading(true);
      try {
        const saved = await rpc('piaget_account_upsert', { p_account: { ...data, password: data.pass || undefined } });
        const row = { ...saved, tone: roleTone(saved.role) };
        const next = users.some(u => u.id === row.id || u.email === row.email) ? users.map(u => (u.id === row.id || u.email === row.email) ? row : u) : [row, ...users];
        const clean = next.filter(u => isAdminRole(u.role));
        setUsers(clean); set('users', clean); setEditing(null);
        toast('Usuario administrativo guardado ✓', 'ok');
      } catch (e) { toast('No se pudo guardar: ' + e.message, 'warn'); }
      finally { setLoading(false); }
    }
    async function removeUser(u) {
      if (!u || !u.id) { setDeleting(null); return toast('Este usuario no tiene ID real', 'warn'); }
      setLoading(true);
      try { await rpc('piaget_account_delete', { p_account_id: u.id }); const next = users.filter(x => x.id !== u.id); setUsers(next); set('users', next); setDeleting(null); toast('Usuario eliminado', 'warn'); }
      catch (e) { toast('No se pudo eliminar: ' + e.message, 'warn'); }
      finally { setLoading(false); }
    }
    const setStatus = (i, status) => saveUser({ ...users[i], status, pass: '' });
    const roleCount = roleName => users.filter(u => u.role === roleName).length;

    return <div className="cfg-section">
      <SecHead title="Usuarios y roles" desc="Administra solo roles administrativos. Docentes, estudiantes y familias se gestionan en sus módulos independientes." />
      <div className="card"><CardHead icon="users" title="Usuarios administrativos" sub={(loading ? 'Sincronizando… · ' : '') + users.length + ' cuentas · ' + ADMIN_ROLES.length + ' roles'} right={<div className="row gap-8 center"><button className="btn sm" onClick={loadAccounts}><Icon name="refresh" size={13} className="btn-ico" />Sincronizar</button><button className="btn sm primary" onClick={() => setEditing({ user: null })}><Icon name="plus" size={13} className="btn-ico" />Crear usuario</button></div>} />
        <div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Usuario</th><th>Rol</th><th>Última actividad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{users.map((u, i) => <tr key={u.id || u.email || i}><td><div className="person clickable" onClick={() => setEditing({ index: i, user: u })}><Avatar name={u.name || u.email} size={32} /><div style={{ minWidth: 0 }}><div className="pname" style={{ whiteSpace: 'nowrap' }}>{u.name}</div><div className="pmeta">{u.email || u.username}</div></div></div></td><td><Badge tone={roleTone(u.role)}>{u.role}</Badge></td><td className="muted" style={{ fontSize: 13 }}>{u.last || '—'}</td><td><Badge tone={statusTone(u.status)}>{u.status || 'Activo'}</Badge></td><td><RowMenu items={[{ icon: 'qr', label: 'Ver credencial', onClick: () => setCredential(u) }, { icon: 'edit', label: 'Editar usuario', onClick: () => setEditing({ index: i, user: u }) }, { icon: 'refresh', label: 'Cambiar contraseña', onClick: () => setEditing({ index: i, user: u }) }, u.status === 'Suspendido' ? { icon: 'check', label: 'Reactivar acceso', onClick: () => setStatus(i, 'Activo') } : { icon: 'logout', label: 'Suspender acceso', onClick: () => setStatus(i, 'Suspendido') }, { icon: 'trash', label: 'Eliminar usuario', danger: true, onClick: () => setDeleting(u) }]} /></td></tr>)}{!users.length && <tr><td colSpan="5" className="faint" style={{ textAlign: 'center', padding: 28 }}>Sin usuarios administrativos. Presiona Crear usuario.</td></tr>}</tbody></table></div>
      </div>
      <div className="card"><CardHead icon="lock" title="Matriz de permisos administrativos" sub="Solo Dirección, Coordinación, Finanzas, Admisiones y Recepción" /><div style={{ overflowX: 'auto', padding: '4px 16px 12px' }}><table className="perm-tbl"><thead><tr><th>Rol</th>{modules.map(m => <th key={m}>{m}</th>)}</tr></thead><tbody>{roles.map((r, ri) => <tr key={r.role}><td><div className="row center gap-8"><Badge tone={r.tone}>{r.role}</Badge><span className="faint" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>{roleCount(r.role)} usuarios</span></div></td>{modules.map((m, ci) => { const lvl = matrix[ri][ci] || 0; return <td key={m}><span className={'perm-cell perm-' + lvl} onClick={() => cycle(ri, ci)}>{PERMS[lvl]}</span></td>; })}</tr>)}</tbody></table></div></div>
      {editing && <AccountModal user={editing.user} onClose={() => setEditing(null)} onSave={saveUser} />}
      {credential && <CredentialModal user={credential} onClose={() => setCredential(null)} />}
      {deleting && <Modal open width={440} onClose={() => setDeleting(null)} title="Eliminar usuario" footer={<><button className="btn" onClick={() => setDeleting(null)}>Cancelar</button><button className="btn primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => removeUser(deleting)}><Icon name="trash" size={15} className="btn-ico" />Eliminar</button></>}><p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>¿Eliminar a <b>{deleting.name || deleting.email}</b>? Perderá el acceso a la plataforma.</p></Modal>}
    </div>;
  }

  window.CfgUsers = CfgUsers;
})();
