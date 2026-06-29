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
  function photoOf(u) { return (u && (u.avatar_url || u.avatar || u.photo)) || ''; }
  function initials(name) { return String(name || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase(); }

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
  function qrPayload(u) { return { type: 'staff', id: u.id || u._id || '', name: u.name || u.email || 'Usuario', email: u.email || u.username || '', role: u.role || 'Staff', grade: u.role || 'Staff', status: u.status || 'Activo', institution: 'PIAGET', v: 2 }; }
  function qrSvg(payload) { try { if (!window.qrcode) return ''; const q = window.qrcode(0, 'M'); q.addData(JSON.stringify(payload)); q.make(); return q.createSvgTag(5, 2); } catch (_) { return ''; } }

  function ensureCredentialPrintStyles() {
    if (document.getElementById('piaget-admin-credential-v2-print')) return;
    const style = document.createElement('style');
    style.id = 'piaget-admin-credential-v2-print';
    style.textContent = `
      @media print {
        @page { size: portrait; margin: 10mm; }
        html, body { overflow: visible !important; background: #fff !important; height: auto !important; }
        body * { visibility: hidden !important; }
        .cred-print, .cred-print * { visibility: visible !important; }
        .cred-print {
          position: fixed !important;
          left: 50% !important;
          top: 14px !important;
          transform: translateX(-50%) !important;
          width: 340px !important;
          max-width: 340px !important;
          box-shadow: none !important;
          background: #fff !important;
          color: #111827 !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .cred-print .badge { white-space: normal !important; max-width: 230px !important; text-align: center !important; overflow-wrap: anywhere !important; word-break: break-word !important; }
        .cred-print img { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .cred-print svg { max-width: 100% !important; height: auto !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function resizePhoto(file, cb) {
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast('Selecciona una imagen válida', 'warn');
    if (file.size > 6 * 1024 * 1024) return toast('La foto supera 6 MB; usa una imagen más ligera', 'warn');
    const reader = new FileReader();
    reader.onerror = () => toast('No se pudo leer la foto', 'warn');
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 420;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => cb(reader.result);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function PhotoPicker({ value, name, onChange }) {
    const inputRef = React.useRef(null);
    return <div className="card pad" style={{ padding: 14, display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ width: 74, height: 74, borderRadius: 22, overflow: 'hidden', flexShrink: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, var(--accent-soft), var(--surface-3))', border: '1px solid var(--border)' }}>
        {value ? <img src={value} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)', fontSize: 22 }}>{initials(name)}</span>}
      </div>
      <div className="col gap-8" style={{ minWidth: 0, flex: 1 }}>
        <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>Foto para credencial</div><div className="faint" style={{ fontSize: 12 }}>Se guardará en el usuario y aparecerá en la impresión.</div></div>
        <div className="row gap-8 center" style={{ flexWrap: 'wrap' }}>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; resizePhoto(f, onChange); }} />
          <button className="btn sm" type="button" onClick={() => inputRef.current && inputRef.current.click()}><Icon name="image" size={14} className="btn-ico" />Subir foto</button>
          {value && <button className="btn sm" type="button" onClick={() => onChange('')}><Icon name="trash" size={14} className="btn-ico" />Quitar</button>}
        </div>
      </div>
    </div>;
  }

  function AccountModal({ user, onClose, onSave }) {
    const isNew = !user;
    const [form, setForm] = React.useState(() => user ? { ...user, avatar_url: photoOf(user), secret: '' } : { name: '', email: '', role: 'Dirección', status: 'Activo', avatar_url: '', secret: genSecret() });
    const [show, setShow] = React.useState(isNew);
    const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
    function save() {
      if (!String(form.name || '').trim()) return toast('Escribe el nombre del usuario', 'warn');
      if (!/.+@.+\..+/.test(String(form.email || ''))) return toast('Correo no válido', 'warn');
      if (!isAdminRole(form.role)) return toast('Solo se permiten roles administrativos', 'warn');
      if (isNew && !String(form.secret || '').trim()) return toast('Asigna una contraseña', 'warn');
      onSave({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), pass: form.secret || '', avatar_url: form.avatar_url || '', tone: roleTone(form.role) });
    }
    return <Modal open width={560} onClose={onClose} title={isNew ? 'Crear usuario administrativo' : 'Editar usuario administrativo'} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar</button></>}>
      <div className="col gap-14">
        <PhotoPicker value={form.avatar_url || ''} name={form.name || form.email || 'Usuario'} onChange={v => upd('avatar_url', v)} />
        <Field label="Nombre completo"><TextInput value={form.name || ''} onChange={e => upd('name', e.target.value)} placeholder="Ej. Ana López" /></Field>
        <Field label="Correo electrónico / usuario"><TextInput value={form.email || ''} onChange={e => upd('email', e.target.value)} placeholder="correo@jeanpiaget.mx" /></Field>
        <div className="field-row"><Field label="Rol"><SelectInput value={form.role || 'Dirección'} onChange={e => upd('role', e.target.value)} options={ADMIN_ROLES} /></Field><Field label="Estado"><SelectInput value={form.status || 'Activo'} onChange={e => upd('status', e.target.value)} options={STATUSES} /></Field></div>
        <Field label={isNew ? 'Contraseña inicial' : 'Nueva contraseña opcional'}><div className="row center gap-8"><div className="grow"><TextInput type={show ? 'text' : 'password'} value={form.secret || ''} onChange={e => upd('secret', e.target.value)} placeholder={isNew ? 'Contraseña inicial' : 'Deja vacío para conservar'} /></div><button className="btn sm" type="button" onClick={() => setShow(s => !s)}>{show ? 'Ocultar' : 'Ver'}</button><button className="btn sm" type="button" onClick={() => { upd('secret', genSecret()); setShow(true); }}>Generar</button></div></Field>
        <div className="faint" style={{ fontSize: 12 }}>La foto se optimiza antes de guardarse para que la plataforma cargue rápido.</div>
      </div>
    </Modal>;
  }

  function CredentialModal({ user, onClose }) {
    React.useEffect(() => { ensureCredentialPrintStyles(); }, []);
    const payload = qrPayload(user || {});
    const svg = React.useMemo(() => qrSvg(payload), [user && user.id, user && user.email, user && user.role, user && user.status]);
    const avatar = photoOf(user);
    const active = (user.status || 'Activo') === 'Activo';
    return <Modal open width={760} onClose={onClose} title="Credencial de acceso" footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={() => { ensureCredentialPrintStyles(); window.print(); }}><Icon name="download" size={15} className="btn-ico" />Imprimir</button></>}>
      <div className="row" style={{ gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="cred-print" style={{ width: 340, overflow: 'hidden', borderRadius: 28, background: '#fff', border: '1px solid color-mix(in oklch, var(--accent), var(--border) 62%)', boxShadow: '0 24px 70px -28px rgba(15,23,42,.45)', fontFamily: 'var(--font-ui)', color: 'var(--text)' }}>
          <div style={{ height: 118, padding: 20, color: '#fff', background: 'linear-gradient(135deg, var(--accent), color-mix(in oklch, var(--accent), #111827 24%))', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -42, top: -46, width: 132, height: 132, borderRadius: 999, background: 'rgba(255,255,255,.16)' }} />
            <div style={{ position: 'absolute', right: 36, bottom: -62, width: 132, height: 132, borderRadius: 999, background: 'rgba(255,255,255,.10)' }} />
            <div className="row between center" style={{ position: 'relative', zIndex: 1 }}><div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .82 }}>Credencial administrativa</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1 }}>PIAGET</div></div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '5px 9px', borderRadius: 999, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.32)' }}>{active ? 'ACTIVA' : 'NO ACTIVA'}</div></div>
          </div>
          <div style={{ padding: '0 22px 22px', marginTop: -42, position: 'relative', zIndex: 2 }}>
            <div style={{ width: 108, height: 108, borderRadius: 30, overflow: 'hidden', border: '5px solid #fff', boxShadow: '0 12px 28px -14px rgba(15,23,42,.5)', background: 'linear-gradient(135deg, var(--accent-soft), var(--surface-3))', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
              {avatar ? <img src={avatar} alt="Foto del usuario" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, color: 'var(--accent)' }}>{initials(user.name || user.email)}</span>}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-.035em', color: '#111827', overflowWrap: 'anywhere' }}>{user.name || 'Usuario'}</div>
            <div style={{ marginTop: 8 }}><Badge tone={roleTone(user.role)}>{user.role || 'Staff'}</Badge></div>
            <div style={{ marginTop: 14, padding: 12, borderRadius: 18, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Correo institucional</div>
              <div style={{ fontSize: 12.5, color: '#111827', marginTop: 2, overflowWrap: 'anywhere' }}>{user.email || user.username || '—'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                <div><div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>ID</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#111827' }}>{String(user.id || user._id || '—').slice(0, 8)}</div></div>
                <div><div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Tipo</div><div style={{ fontSize: 11.5, color: '#111827', fontWeight: 700 }}>Administrativo</div></div>
              </div>
            </div>
            <div className="row center" style={{ gap: 14, marginTop: 16, alignItems: 'center' }}>
              <div style={{ width: 120, height: 120, display: 'grid', placeItems: 'center', background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb', padding: 8 }}>{svg ? <div style={{ width: 104, height: 104, display: 'grid', placeItems: 'center' }} dangerouslySetInnerHTML={{ __html: svg }} /> : <span style={{ fontSize: 11, color: '#64748b' }}>QR no disponible</span>}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 800, color: '#111827', lineHeight: 1.25 }}>Control de accesos</div><div style={{ fontSize: 10.8, color: '#64748b', lineHeight: 1.35, marginTop: 4 }}>Escanear para registrar entrada o salida.</div></div>
            </div>
          </div>
        </div>
        <div className="card pad" style={{ flex: 1, minWidth: 280 }}><div className="card-title" style={{ marginBottom: 10 }}><Icon name="shield" size={17} className="ico" />Uso</div><p className="faint" style={{ fontSize: 13, lineHeight: 1.55 }}>Escanea esta credencial desde Control de Accesos → Scanner QR. La foto se toma del perfil del usuario administrativo.</p></div>
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
        const clean = (Array.isArray(list) ? list : []).filter(u => isAdminRole(u.role)).map(u => ({ ...u, avatar_url: photoOf(u), tone: roleTone(u.role) }));
        setUsers(clean); set('users', clean);
      } catch (e) { toast('No se pudieron cargar usuarios administrativos: ' + e.message, 'warn'); }
      finally { setLoading(false); }
    }
    React.useEffect(() => { loadAccounts(); }, []);

    async function saveUser(data) {
      if (!isAdminRole(data.role)) return toast('Solo puedes guardar roles administrativos en esta sección', 'warn');
      setLoading(true);
      try {
        const saved = await rpc('piaget_account_upsert', { p_account: { ...data, avatar_url: data.avatar_url || '', password: data.pass || undefined } });
        const row = { ...saved, avatar_url: photoOf(saved), tone: roleTone(saved.role) };
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
      <SecHead title="Usuarios y roles" desc="Administra usuarios administrativos, foto de credencial, roles y permisos." />
      <div className="card"><CardHead icon="users" title="Usuarios administrativos" sub={(loading ? 'Sincronizando… · ' : '') + users.length + ' cuentas · ' + ADMIN_ROLES.length + ' roles'} right={<div className="row gap-8 center"><button className="btn sm" onClick={loadAccounts}><Icon name="refresh" size={13} className="btn-ico" />Sincronizar</button><button className="btn sm primary" onClick={() => setEditing({ user: null })}><Icon name="plus" size={13} className="btn-ico" />Crear usuario</button></div>} />
        <div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Usuario</th><th>Rol</th><th>Última actividad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{users.map((u, i) => <tr key={u.id || u.email || i}><td><div className="person clickable" onClick={() => setEditing({ index: i, user: u })}>{photoOf(u) ? <img src={photoOf(u)} alt="" style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} /> : <Avatar name={u.name || u.email} size={32} />}<div style={{ minWidth: 0 }}><div className="pname" style={{ whiteSpace: 'nowrap' }}>{u.name}</div><div className="pmeta">{u.email || u.username}</div></div></div></td><td><Badge tone={roleTone(u.role)}>{u.role}</Badge></td><td className="muted" style={{ fontSize: 13 }}>{u.last || '—'}</td><td><Badge tone={statusTone(u.status)}>{u.status || 'Activo'}</Badge></td><td><RowMenu items={[{ icon: 'qr', label: 'Ver credencial', onClick: () => setCredential(u) }, { icon: 'image', label: 'Editar foto y datos', onClick: () => setEditing({ index: i, user: u }) }, { icon: 'edit', label: 'Editar usuario', onClick: () => setEditing({ index: i, user: u }) }, { icon: 'refresh', label: 'Cambiar contraseña', onClick: () => setEditing({ index: i, user: u }) }, u.status === 'Suspendido' ? { icon: 'check', label: 'Reactivar acceso', onClick: () => setStatus(i, 'Activo') } : { icon: 'logout', label: 'Suspender acceso', onClick: () => setStatus(i, 'Suspendido') }, { icon: 'trash', label: 'Eliminar usuario', danger: true, onClick: () => setDeleting(u) }]} /></td></tr>)}{!users.length && <tr><td colSpan="5" className="faint" style={{ textAlign: 'center', padding: 28 }}>Sin usuarios administrativos. Presiona Crear usuario.</td></tr>}</tbody></table></div>
      </div>
      <div className="card"><CardHead icon="lock" title="Matriz de permisos administrativos" sub="Solo Dirección, Coordinación, Finanzas, Admisiones y Recepción" /><div style={{ overflowX: 'auto', padding: '4px 16px 12px' }}><table className="perm-tbl"><thead><tr><th>Rol</th>{modules.map(m => <th key={m}>{m}</th>)}</tr></thead><tbody>{roles.map((r, ri) => <tr key={r.role}><td><div className="row center gap-8"><Badge tone={r.tone}>{r.role}</Badge><span className="faint" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>{roleCount(r.role)} usuarios</span></div></td>{modules.map((m, ci) => { const lvl = matrix[ri][ci] || 0; return <td key={m}><span className={'perm-cell perm-' + lvl} onClick={() => cycle(ri, ci)}>{PERMS[lvl]}</span></td>; })}</tr>)}</tbody></table></div></div>
      {editing && <AccountModal user={editing.user} onClose={() => setEditing(null)} onSave={saveUser} />}
      {credential && <CredentialModal user={credential} onClose={() => setCredential(null)} />}
      {deleting && <Modal open width={440} onClose={() => setDeleting(null)} title="Eliminar usuario" footer={<><button className="btn" onClick={() => setDeleting(null)}>Cancelar</button><button className="btn primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => removeUser(deleting)}><Icon name="trash" size={15} className="btn-ico" />Eliminar</button></>}><p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>¿Eliminar a <b>{deleting.name || deleting.email}</b>? Perderá el acceso a la plataforma.</p></Modal>}
    </div>;
  }

  window.CfgUsers = CfgUsers;
})();
