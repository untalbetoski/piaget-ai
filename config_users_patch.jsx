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
  function initials(name) { return String(name || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
  function makeCredentialPayload(u) {
    return {
      type: 'staff',
      id: u.id || u._id || '',
      name: u.name || u.email || 'Usuario',
      email: u.email || u.username || '',
      role: u.role || 'Staff',
      grade: u.role || 'Staff',
      status: u.status || 'Activo',
      institution: 'PIAGET',
      v: 1
    };
  }
  function makeQR(payload) {
    try {
      if (!window.qrcode) return '';
      const q = window.qrcode(0, 'M');
      q.addData(JSON.stringify(payload));
      q.make();
      return q.createSvgTag(5, 2);
    } catch (_) { return ''; }
  }
  function ensureCredentialPrintStyles() {
    if (document.getElementById('piaget-credential-print-fix')) return;
    const style = document.createElement('style');
    style.id = 'piaget-credential-print-fix';
    style.textContent = `
      @media print {
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

  function UserCredentialCard({ user }) {
    React.useEffect(() => { ensureCredentialPrintStyles(); }, []);
    const payload = makeCredentialPayload(user);
    const svg = React.useMemo(() => makeQR(payload), [user.id, user.email, user.role, user.status]);
    const active = (user.status || 'Activo') === 'Activo';
    const t = window.TONE[tone(user.role)] || window.TONE.gray;
    return (
      <div className="card cred-print" style={{ width: 330, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ padding: 18, background: 'linear-gradient(135deg, var(--surface), var(--surface-2))', borderBottom: '1px solid var(--border)' }}>
          <div className="row between center">
            <div>
              <div className="eyebrow">Credencial de acceso</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>PIAGET</div>
            </div>
            <Badge tone={active ? 'green' : 'gray'} dot={active}>{active ? 'Activa' : 'No activa'}</Badge>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div className="row center gap-12" style={{ marginBottom: 16 }}>
            <div style={{ width: 58, height: 58, borderRadius: 18, display: 'grid', placeItems: 'center', color: t.c, background: t.bg, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>{initials(user.name || user.email)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>{user.name || 'Usuario'}</div>
              <div className="faint" style={{ fontSize: 12.5, marginTop: 3 }}>{user.email || user.username || '—'}</div>
              <div style={{ marginTop: 7 }}><Badge tone={tone(user.role)}>{user.role || 'Staff'}</Badge></div>
            </div>
          </div>
          <div style={{ display: 'grid', placeItems: 'center', background: '#fff', borderRadius: 18, padding: 14, border: '1px solid var(--border)' }}>
            {svg ? <div style={{ width: 210, height: 210, display: 'grid', placeItems: 'center' }} dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="faint" style={{ height: 210, display: 'grid', placeItems: 'center' }}>QR no disponible</div>}
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
            <div className="kv"><span className="k">ID</span><span className="v font-mono" style={{ fontSize: 10.5 }}>{String(user.id || user._id || '—').slice(0, 8)}</span></div>
            <div className="kv"><span className="k">Tipo</span><span className="v">Usuario</span></div>
          </div>
          <div className="faint" style={{ fontSize: 11.5, marginTop: 12, textAlign: 'center' }}>Este QR registra entrada en Control de Accesos.</div>
        </div>
      </div>
    );
  }

  function CredentialModal({ user, onClose }) {
    const payload = makeCredentialPayload(user || {});
    const copyPayload = async () => {
      try { await navigator.clipboard.writeText(JSON.stringify(payload)); toast('Contenido QR copiado', 'ok'); }
      catch (_) { toast('No se pudo copiar', 'warn'); }
    };
    return (
      <Modal open width={760} onClose={onClose} title="Credencial de acceso"
        footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn" onClick={copyPayload}><Icon name="copy" size={15} className="btn-ico" />Copiar QR</button><button className="btn primary" onClick={() => { ensureCredentialPrintStyles(); window.print(); }}><Icon name="download" size={15} className="btn-ico" />Imprimir</button></>}>
        <div className="row" style={{ gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <UserCredentialCard user={user || {}} />
          <div className="card pad" style={{ flex: 1, minWidth: 260 }}>
            <div className="card-title" style={{ marginBottom: 10 }}><Icon name="shield" size={17} className="ico" />Uso de la credencial</div>
            {[
              ['Mostrar QR', 'El usuario presenta esta credencial en el acceso.'],
              ['Escanear', 'El módulo Scanner QR lee el código con cámara.'],
              ['Registrar', 'La entrada queda guardada en Supabase y aparece en Dashboard e Historial.'],
            ].map((p, i) => <div className="row" key={i} style={{ gap: 12, padding: '11px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}><div className="kpi-ico" style={{ width: 28, height: 28, margin: 0, background: 'var(--accent-soft)', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{i + 1}</div><div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{p[0]}</div><div className="faint" style={{ fontSize: 12.5 }}>{p[1]}</div></div></div>)}
            <div className="ai-panel" style={{ marginTop: 14 }}><div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}><div className="insight-ico" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon name="alert" size={16} /></div><div className="insight-body"><div className="insight-title">Importante</div><div className="insight-text">Si el usuario está Suspendido, conserva la credencial visual, pero debe reactivarse antes de usarla operativamente.</div></div></div></div>
          </div>
        </div>
      </Modal>
    );
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
    const [credential, setCredential] = React.useState(null);
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
        <SecHead title="Usuarios y roles" desc="Administra cuentas reales de acceso, roles, credenciales y permisos. Los usuarios se guardan en Supabase." />
        <div className="card">
          <CardHead icon="users" title="Usuarios" sub={(loading ? 'Sincronizando… · ' : '') + users.length + ' cuentas reales · ' + DB.roles.length + ' roles'}
            right={<div className="row gap-8 center"><button className="btn sm" onClick={loadAccounts}><Icon name="refresh" size={13} className="btn-ico" />Sincronizar</button><button className="btn sm primary" onClick={() => setEditing({ user: null })}><Icon name="plus" size={13} className="btn-ico" />Crear usuario</button></div>} />
          <div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Usuario</th><th>Rol</th><th>Última actividad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
            {users.map((u, i) => <tr key={u.id || u.email || i}><td><div className="person clickable" onClick={() => setEditing({ index: i, user: u })}><Avatar name={u.name || u.email} size={32} /><div style={{ minWidth: 0 }}><div className="pname" style={{ whiteSpace: 'nowrap' }}>{u.name}</div><div className="pmeta">{u.email || u.username}</div></div></div></td><td><Badge tone={u.tone || tone(u.role)}>{u.role}</Badge></td><td className="muted" style={{ fontSize: 13 }}>{u.last || '—'}</td><td><Badge tone={statusTone(u.status)}>{u.status || 'Activo'}</Badge></td><td><RowMenu items={[{ icon: 'qr', label: 'Ver credencial', onClick: () => setCredential(u) }, { icon: 'edit', label: 'Editar usuario', onClick: () => setEditing({ index: i, user: u }) }, { icon: 'refresh', label: 'Cambiar contraseña', onClick: () => setEditing({ index: i, user: u }) }, u.status === 'Suspendido' ? { icon: 'check', label: 'Reactivar acceso', onClick: () => setStatus(i, 'Activo') } : { icon: 'logout', label: 'Suspender acceso', onClick: () => setStatus(i, 'Suspendido') }, { icon: 'trash', label: 'Eliminar usuario', danger: true, onClick: () => setDeleting(u) }]} /></td></tr>)}
            {!users.length && <tr><td colSpan="5" className="faint" style={{ textAlign: 'center', padding: 28 }}>Sin usuarios cargados. Presiona Sincronizar.</td></tr>}
          </tbody></table></div>
        </div>
        <div className="card"><CardHead icon="lock" title="Matriz de permisos" sub="Toca una celda para cambiar el nivel · Sin acceso → Ver → Editar → Total" /><div style={{ overflowX: 'auto', padding: '4px 16px 12px' }}><table className="perm-tbl"><thead><tr><th>Rol</th>{DB.permModules.map(m => <th key={m}>{m}</th>)}</tr></thead><tbody>{DB.roles.map((r, ri) => <tr key={r.role}><td><div className="row center gap-8"><Badge tone={r.tone}>{r.role}</Badge><span className="faint" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>{roleCount(r.role)} usuarios</span></div></td>{DB.permModules.map((m, ci) => { const lvl = matrix[ri][ci]; return <td key={m}><span className={'perm-cell perm-' + lvl} onClick={() => cycle(ri, ci)}>{PERMS[lvl]}</span></td>; })}</tr>)}</tbody></table></div></div>
        {editing && <AccountModal user={editing.user} onClose={() => setEditing(null)} onSave={saveUser} />}
        {credential && <CredentialModal user={credential} onClose={() => setCredential(null)} />}
        {deleting && <Modal open width={440} onClose={() => setDeleting(null)} title="Eliminar usuario" footer={<><button className="btn" onClick={() => setDeleting(null)}>Cancelar</button><button className="btn primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => removeUser(deleting)}><Icon name="trash" size={15} className="btn-ico" />Eliminar</button></>}><p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>¿Eliminar a <b>{deleting.name || deleting.email}</b>? Perderá el acceso a la plataforma.</p></Modal>}
      </div>
    );
  }

  window.CfgUsers = CfgUsers;
})();
