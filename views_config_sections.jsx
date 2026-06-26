/* views_config_sections.jsx — Secciones del módulo Configuración
   Cada sección recibe { cfg, set, setG } del shell (views_configuracion.jsx).
   set(k,v)        → cambia clave de primer nivel
   setG(group,k,v) → cambia clave anidada (branding, security, fiscal, backups) */

/* ---------- Primitivas compartidas ---------- */
function Sw({ on, onClick }) {
  return (
    <button className={'sw' + (on ? ' on' : '')} onClick={onClick} aria-label="alternar" type="button">
      <span className="knob" />
    </button>
  );
}
function SRow({ title, desc, children }) {
  return (
    <div className="srow">
      <div className="sr-body">
        <div className="sr-title">{title}</div>
        {desc && <div className="sr-desc">{desc}</div>}
      </div>
      <div className="sr-ctrl">{children}</div>
    </div>
  );
}
function SecHead({ title, desc }) {
  return (
    <div className="cfg-section-head">
      <h2>{title}</h2>
      {desc && <p>{desc}</p>}
    </div>
  );
}

/* ============ GENERAL ============ */
function CfgGeneral({ cfg, set }) {
  const levels = cfg.levels || [];
  const setLevel = (i, k, v) => set('levels', levels.map((l, j) => j === i ? { ...l, [k]: v } : l));
  const addLevel = () => set('levels', [...levels, { name: '', cct: '', director: '', turno: 'Matutino' }]);
  const delLevel = i => set('levels', levels.filter((_, j) => j !== i));
  return (
    <div className="cfg-section">
      <SecHead title="General" desc="Identidad de la institución, niveles educativos, contacto y preferencias regionales." />

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card pad col gap-16">
          <div className="card-title"><Icon name="building" className="ico" size={17} />Identidad</div>
          <Field label="Nombre de la institución"><TextInput value={cfg.schoolName} onChange={e => set('schoolName', e.target.value)} /></Field>
          <Field label="Razón social"><TextInput value={cfg.legalName} onChange={e => set('legalName', e.target.value)} /></Field>
          <Field label="Director(a) general"><TextInput value={cfg.director} onChange={e => set('director', e.target.value)} /></Field>
          <Field label="Sitio web"><TextInput value={cfg.website} onChange={e => set('website', e.target.value)} /></Field>
        </div>

        <div className="card pad col gap-16">
          <div className="card-title"><Icon name="mail" className="ico" size={17} />Contacto</div>
          <div className="field-row">
            <Field label="Correo de dirección"><TextInput value={cfg.email} onChange={e => set('email', e.target.value)} /></Field>
            <Field label="Teléfono"><TextInput value={cfg.phone} onChange={e => set('phone', e.target.value)} /></Field>
          </div>
          <Field label="Dirección"><TextInput value={cfg.address} onChange={e => set('address', e.target.value)} /></Field>
          <div className="field-row">
            <Field label="Ciudad / municipio"><TextInput value={cfg.city} onChange={e => set('city', e.target.value)} /></Field>
            <Field label="C.P."><TextInput value={cfg.zip} onChange={e => set('zip', e.target.value)} /></Field>
          </div>
          <Field label="Estado"><TextInput value={cfg.state} onChange={e => set('state', e.target.value)} /></Field>
        </div>
      </div>

      <div className="card">
        <CardHead icon="cap" title="Niveles educativos" sub="Clave de Centro de Trabajo (CCT) y director por nivel"
          right={<button className="btn sm" onClick={addLevel}><Icon name="plus" size={13} className="btn-ico" />Agregar nivel</button>} />
        <div style={{ padding: '8px 0 12px' }}>
          <div className="lvl-head">
            <span>Nivel</span><span>Clave CCT</span><span>Director(a)</span><span>Turno</span><span></span>
          </div>
          {levels.map((l, i) => (
            <div className="lvl-row" key={i}>
              <TextInput value={l.name} onChange={e => setLevel(i, 'name', e.target.value)} placeholder="Nivel" />
              <TextInput value={l.cct} onChange={e => setLevel(i, 'cct', e.target.value)} placeholder="15PXX0000X" style={{ fontFamily: 'var(--font-mono)' }} />
              <TextInput value={l.director} onChange={e => setLevel(i, 'director', e.target.value)} placeholder="Nombre del director(a)" />
              <SelectInput value={l.turno} onChange={e => setLevel(i, 'turno', e.target.value)} options={['Matutino', 'Vespertino', 'Mixto']} />
              <button className="lvl-del" onClick={() => delLevel(i)} aria-label="Eliminar nivel" title="Eliminar nivel" type="button"><Icon name="trash" size={15} /></button>
            </div>
          ))}
          {levels.length === 0 && <div className="faint" style={{ fontSize: 13, padding: '12px 20px' }}>Sin niveles. Agrega Preescolar, Primaria o Secundaria con su CCT.</div>}
        </div>
      </div>

      <div className="card pad">
        <div className="card-title" style={{ marginBottom: 16 }}><Icon name="globe" className="ico" size={17} />Preferencias regionales</div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <Field label="Moneda"><SelectInput value={cfg.currency} onChange={e => set('currency', e.target.value)} options={['MXN', 'USD', 'EUR']} /></Field>
          <Field label="Zona horaria"><SelectInput value={cfg.timezone} onChange={e => set('timezone', e.target.value)} options={['America/Mexico_City', 'America/Tijuana', 'America/Cancun', 'America/Monterrey']} /></Field>
          <Field label="Formato de fecha"><SelectInput value={cfg.dateFormat} onChange={e => set('dateFormat', e.target.value)} options={['DD/MM/AAAA', 'MM/DD/AAAA', 'AAAA-MM-DD']} /></Field>
          <Field label="Primer día de la semana"><SelectInput value={cfg.firstDay} onChange={e => set('firstDay', e.target.value)} options={['Lunes', 'Domingo']} /></Field>
        </div>
      </div>
    </div>
  );
}

/* ============ MARCA Y APARIENCIA ============ */
const HUES = [
  { h: 262, name: 'Índigo' }, { h: 222, name: 'Azul' }, { h: 200, name: 'Cian' },
  { h: 158, name: 'Verde' }, { h: 300, name: 'Violeta' }, { h: 25, name: 'Coral' }, { h: 78, name: 'Ámbar' },
];
function LogoSlot({ label, icon, value, dark, width = 96, onChange }) {
  const ref = React.useRef(null);
  const pick = e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast('Selecciona una imagen (PNG, SVG o JPG)', 'warn'); return; }
    if (file.size > 4 * 1024 * 1024) { toast('La imagen supera 4 MB; usa una más ligera', 'warn'); return; }
    const reader = new FileReader();
    reader.onerror = () => toast('No se pudo leer la imagen', 'warn');
    reader.onload = () => {
      const raw = reader.result;
      // Los SVG ya son ligeros: se guardan tal cual
      if (file.type === 'image/svg+xml') { onChange(raw); toast(label + ' actualizado ✓'); return; }
      // Rasterizar y reescalar para no exceder el almacenamiento
      const img = new Image();
      img.onload = () => {
        const max = label === 'Favicon' ? 128 : 480;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        let out; try { out = c.toDataURL('image/png'); } catch (err) { out = raw; }
        onChange(out); toast(label + ' actualizado ✓');
      };
      img.onerror = () => { onChange(raw); toast(label + ' actualizado ✓'); };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="up-slot" style={{ width, height: 96, position: 'relative', padding: value ? 8 : undefined, background: value ? 'repeating-conic-gradient(oklch(0.86 0.006 258) 0% 25%, #fff 0% 50%) 50% / 14px 14px' : (dark ? 'oklch(0.24 0.02 264)' : undefined), color: dark && !value ? '#fff' : undefined, borderColor: dark && !value ? 'transparent' : undefined }}
      onClick={() => ref.current && ref.current.click()} title={'Subir ' + label.toLowerCase()}>
      <input ref={ref} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" style={{ display: 'none' }} onChange={pick} />
      {value ? (
        <React.Fragment>
          <img src={value} alt={label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          <button type="button" onClick={e => { e.stopPropagation(); onChange(''); toast(label + ' eliminado', 'warn'); }} title="Quitar"
            style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border-strong)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', boxShadow: 'var(--shadow-xs)' }}>
            <Icon name="x" size={12} />
          </button>
        </React.Fragment>
      ) : (
        <div className="col center gap-4"><Icon name={icon} size={icon === 'star' ? 16 : 18} /><span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)' }}>{label}</span></div>
      )}
    </div>
  );
}
/* Aplica preferencias visuales en vivo a la interfaz */
const CFG_DENSITY = { 'Compacta': 'compact', 'Cómoda': 'normal', 'Amplia': 'comfy' };
const CFG_RADIUS = { 'Recto': { r: 6, sm: 4, lg: 10 }, 'Suave': { r: 12, sm: 8, lg: 18 }, 'Redondeado': { r: 18, sm: 12, lg: 24 } };
const CFG_FONT = { 'Hanken Grotesk': "'Hanken Grotesk'", 'Space Grotesk': "'Space Grotesk'", 'System': 'system-ui' };
function cfgApplyTheme(v) {
  const dark = v === 'Oscuro' || (v === 'Sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  try { localStorage.setItem('piaget_theme', dark ? 'dark' : 'light'); } catch (e) { }
}
function cfgApplyDensity(v) { document.documentElement.setAttribute('data-density', CFG_DENSITY[v] || 'normal'); }
function cfgApplyRadius(v) {
  const m = CFG_RADIUS[v] || CFG_RADIUS['Suave']; const s = document.documentElement.style;
  s.setProperty('--r', m.r + 'px'); s.setProperty('--r-sm', m.sm + 'px'); s.setProperty('--r-lg', m.lg + 'px');
}
function cfgApplyFont(v) { document.documentElement.style.setProperty('--font-ui', (CFG_FONT[v] || "'Hanken Grotesk'") + ', system-ui, sans-serif'); }

function CfgBranding({ cfg, setG }) {
  const b = cfg.branding;
  const pickHue = h => { setG('branding', 'accentHue', h); document.documentElement.style.setProperty('--accent-h', h); };
  const Tiles = ({ label, value, options, onPick }) => (
    <div className="col gap-8">
      <div className="field"><label>{label}</label></div>
      <div className="tile-row">
        {options.map(o => (
          <button key={o} className={'ctile' + (value === o ? ' sel' : '')} onClick={() => onPick(o)} type="button">{o}</button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="cfg-section">
      <SecHead title="Marca y apariencia" desc="Logotipo, color de acento y estilo visual de la plataforma." />

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card pad col gap-16">
          <div className="card-title"><Icon name="image" className="ico" size={17} />Logotipo</div>
          <div className="row gap-12">
            <LogoSlot label="Logo claro" icon="upload" value={b.logoLight} onChange={v => setG('branding', 'logoLight', v)} />
            <LogoSlot label="Logo oscuro" icon="upload" value={b.logoDark} dark onChange={v => setG('branding', 'logoDark', v)} />
            <LogoSlot label="Favicon" icon="star" width={64} value={b.favicon} onChange={v => setG('branding', 'favicon', v)} />
          </div>
          <div className="faint" style={{ fontSize: 12 }}>PNG, SVG o JPG. La imagen se optimiza automáticamente al subirla.</div>
          <Field label="Marca en el sidebar"><TextInput value={b.logoText} onChange={e => setG('branding', 'logoText', e.target.value)} /></Field>
        </div>

        <div className="card pad col gap-16">
          <div className="card-title"><Icon name="sliders" className="ico" size={17} />Color de acento</div>
          <div className="row gap-10 wrap">
            {HUES.map(o => (
              <button key={o.h} className={'hue-sw' + (b.accentHue === o.h ? ' sel' : '')}
                title={o.name} onClick={() => pickHue(o.h)} type="button"
                style={{ background: `oklch(0.55 0.185 ${o.h})`, color: `oklch(0.55 0.185 ${o.h})` }} />
            ))}
          </div>
          <div className="faint" style={{ fontSize: 12 }}>El acento se aplica al instante en toda la interfaz.</div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <Tiles label="Tipografía principal" value={b.primaryFont} options={['Hanken Grotesk', 'Space Grotesk', 'System']} onPick={v => { setG('branding', 'primaryFont', v); cfgApplyFont(v); }} />
          </div>
        </div>
      </div>

      <div className="card pad col gap-16">
        <div className="card-title"><Icon name="eye" className="ico" size={17} />Estilo visual</div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <Tiles label="Tema por defecto" value={b.theme} options={['Claro', 'Oscuro', 'Sistema']} onPick={v => { setG('branding', 'theme', v); cfgApplyTheme(v); }} />
          <Tiles label="Densidad" value={b.density} options={['Compacta', 'Cómoda', 'Amplia']} onPick={v => { setG('branding', 'density', v); cfgApplyDensity(v); }} />
          <Tiles label="Esquinas" value={b.radius} options={['Recto', 'Suave', 'Redondeado']} onPick={v => { setG('branding', 'radius', v); cfgApplyRadius(v); }} />
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <Tiles label="Fondo de la pantalla de acceso" value={b.loginBg} options={['Sólido', 'Degradado', 'Imagen']} onPick={v => setG('branding', 'loginBg', v)} />
        </div>
      </div>
    </div>
  );
}

/* ============ USUARIOS Y ROLES ============ */
const PERM_LABELS = ['Sin acceso', 'Ver', 'Editar', 'Total'];
const ROLE_TONES = { 'Dirección': 'violet', 'Coordinación': 'blue', 'Docentes': 'cyan', 'Finanzas': 'green', 'Admisiones': 'amber', 'Recepción': 'red', 'Familias': 'amber', 'Estudiantes': 'violet' };
const USER_STATUSES = ['Activo', 'Invitado', 'Suspendido'];

/* Modal de alta / edición de usuario */
function UserModal({ user, onClose, onSave }) {
  const isNew = !user;
  const [form, setForm] = React.useState(() => user
    ? { pass: '', ...user }
    : { name: '', email: '', role: 'Docentes', status: 'Invitado', twoFA: false, last: '—', pass: '' });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [showPass, setShowPass] = React.useState(false);
  const genPass = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let p = ''; for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
    upd('pass', p); setShowPass(true);
  };
  const save = () => {
    if (!form.name.trim()) { toast('Escribe el nombre del usuario', 'warn'); return; }
    if (!/.+@.+\..+/.test(form.email)) { toast('Correo no válido', 'warn'); return; }
    onSave({ ...form, name: form.name.trim(), email: form.email.trim(), tone: ROLE_TONES[form.role] || 'gray' });
  };
  return (
    <Modal open width={480} onClose={onClose} title={isNew ? 'Invitar usuario' : 'Editar usuario'}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{isNew ? 'Enviar invitación' : 'Guardar'}</button></>}>
      {!isNew && (
        <div className="row center gap-12" style={{ marginBottom: 2 }}>
          <Avatar name={form.name || form.email} size={44} />
          <div className="faint" style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>Última actividad: {form.last}</div>
        </div>
      )}
      <Field label="Nombre completo"><TextInput value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Ej. Ana López" /></Field>
      <Field label="Correo electrónico"><TextInput value={form.email} onChange={e => upd('email', e.target.value)} placeholder="correo@jeanpiaget.mx" /></Field>
      <div className="field-row">
        <Field label="Rol"><SelectInput value={form.role} onChange={e => upd('role', e.target.value)} options={DB.roles.map(r => r.role)} /></Field>
        <Field label="Estado"><SelectInput value={form.status} onChange={e => upd('status', e.target.value)} options={USER_STATUSES} /></Field>
      </div>
      <Field label="Contraseña">
        <div className="row center gap-8">
          <div className="grow" style={{ position: 'relative' }}>
            <TextInput type={showPass ? 'text' : 'password'} value={form.pass || ''} onChange={e => upd('pass', e.target.value)} placeholder={isNew ? 'Asigna una contraseña' : 'Escribe para cambiarla'} />
          </div>
          <button className="btn sm" type="button" onClick={() => setShowPass(s => !s)}><Icon name="eye" size={14} className="btn-ico" />{showPass ? 'Ocultar' : 'Ver'}</button>
          <button className="btn sm" type="button" onClick={genPass}><Icon name="refresh" size={14} className="btn-ico" />Generar</button>
        </div>
      </Field>
      <div className="srow" style={{ padding: '4px 0 0', borderBottom: 'none' }}>
        <div className="sr-body"><div className="sr-title">Verificación en dos pasos</div><div className="sr-desc">Exigir 2FA a este usuario.</div></div>
        <Sw on={form.twoFA} onClick={() => upd('twoFA', !form.twoFA)} />
      </div>
    </Modal>
  );
}

function CfgUsers({ cfg, set }) {
  const users = cfg.users || [];
  // Normaliza la matriz a los roles actuales (tolera configuraciones guardadas con menos filas)
  const matrix = DB.roles.map((r, i) => (cfg.permMatrix && cfg.permMatrix[i]) ? [...cfg.permMatrix[i]] : [...r.matrix]);
  const cycle = (ri, ci) => set('permMatrix', matrix.map((row, i) => i === ri ? row.map((v, j) => j === ci ? (v + 1) % 4 : v) : row));
  const statusTone = s => s === 'Activo' ? 'green' : s === 'Invitado' ? 'amber' : 'gray';

  const [editing, setEditing] = React.useState(null); // {index, user} | {index:-1}
  const [deleting, setDeleting] = React.useState(null); // {index, user}
  const openNew = () => setEditing({ index: -1, user: null });
  const openEdit = i => setEditing({ index: i, user: users[i] });
  const handleSave = data => {
    if (editing.index === -1) { set('users', [...users, data]); toast('Invitación enviada a ' + data.email + ' ✓'); }
    else { set('users', users.map((u, i) => i === editing.index ? data : u)); toast('Usuario actualizado ✓'); }
    setEditing(null);
  };
  const handleDelete = () => {
    const i = deleting.index;
    set('users', users.filter((_, j) => j !== i));
    Store.log(DB.user.name, 'eliminó al usuario ' + (users[i].name || users[i].email), 'trash');
    toast('Usuario eliminado', 'warn');
    setDeleting(null);
  };
  const setStatus = (i, status) => { set('users', users.map((u, j) => j === i ? { ...u, status } : u)); toast(users[i].name + (status === 'Suspendido' ? ' suspendido' : ' reactivado'), status === 'Suspendido' ? 'warn' : 'ok'); };

  /* Conteo real de cuentas por rol (sin cifras inventadas) */
  const clasesAll = (window.DB && DB.clases) || [];
  const studentCount = clasesAll.reduce((a, c) => a + (c.alumnos || 0), 0) + (((window.DB && DB.students) || []).length);
  const teacherCount = new Set(clasesAll.map(c => c.titular).filter(Boolean)).size + (((window.DB && DB.docentes) || []).length);
  const famCount = ((window.DB && DB.familyAccounts) || []).length;
  const roleCount = (roleName) => {
    const accounts = users.filter(u => u.role === roleName).length;
    if (roleName === 'Familias') return famCount;
    if (roleName === 'Estudiantes') return studentCount;
    if (roleName === 'Docentes') return accounts + teacherCount;
    return accounts;
  };
  const roleLabel = (n) => n + (n === 1 ? ' usuario' : ' usuarios');

  return (
    <div className="cfg-section">
      <SecHead title="Usuarios y roles" desc="Administra quién accede a la plataforma y qué puede hacer cada rol." />

      <div className="card">
        <CardHead icon="users" title="Usuarios" sub={users.length + ' usuarios · ' + DB.roles.length + ' roles'}
          right={<div className="row gap-8 center">
            <CsvBar entity="usuarios" filename="usuarios-piaget" rows={users}
              columns={[
                { key: 'nombre', label: 'nombre', get: u => u.name },
                { key: 'correo', label: 'correo', get: u => u.email },
                { key: 'rol', label: 'rol', get: u => u.role },
                { key: 'contrasena', label: 'contrasena', get: u => u.pass || '' },
                { key: 'estado', label: 'estado', get: u => u.status },
                { key: 'twofa', label: 'twofa', get: u => u.twoFA ? 'sí' : 'no' },
                { key: 'ultima_actividad', label: 'ultima_actividad', get: u => u.last || '' },
              ]}
              onImport={(objs) => {
                let added = 0, updated = 0;
                const next = users.map(u => ({ ...u }));
                objs.forEach(o => {
                  const email = (o.correo || o.email || '').trim();
                  const name = (o.nombre || o.name || '').trim();
                  if (!email && !name) return;
                  const role = (o.rol || o.role || 'Docentes').trim();
                  const rec = {
                    name: name || email, email, role,
                    status: (o.estado || o.status || 'Activo').trim(),
                    twoFA: /^(s|si|sí|1|true|x)$/i.test((o.twofa || o.twoFA || '').trim()),
                    last: (o.ultima_actividad || o.last || '—').trim(),
                    tone: (ROLE_TONES[role] || 'gray'),
                  };
                  if ((o.contrasena || o.password || '').trim()) rec.pass = (o.contrasena || o.password).trim();
                  const idx = next.findIndex(u => u.email && u.email === email);
                  if (idx >= 0) { next[idx] = { ...next[idx], ...rec }; updated++; }
                  else { next.push(rec); added++; }
                });
                set('users', next);
                return { added, updated };
              }} />
            <button className="btn sm primary" onClick={openNew}><Icon name="plus" size={13} className="btn-ico" />Invitar usuario</button>
          </div>} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Usuario</th><th>Rol</th><th>2FA</th><th>Última actividad</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i}>
                  <td>
                    <div className="person clickable" onClick={() => openEdit(i)}>
                      <Avatar name={u.name} size={32} />
                      <div style={{ minWidth: 0 }}>
                        <div className="pname" style={{ whiteSpace: 'nowrap' }}>{u.name}</div>
                        <div className="pmeta">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><Badge tone={u.tone}>{u.role}</Badge></td>
                  <td>{u.twoFA ? <Badge tone="green" dot>Activo</Badge> : <span className="faint" style={{ fontSize: 12.5 }}>—</span>}</td>
                  <td className="muted" style={{ fontSize: 13 }}>{u.last}</td>
                  <td><Badge tone={statusTone(u.status)}>{u.status}</Badge></td>
                  <td><RowMenu items={[
                    { icon: 'edit', label: 'Editar usuario', onClick: () => openEdit(i) },
                    { icon: 'refresh', label: 'Restablecer contraseña', onClick: () => toast('Enlace enviado a ' + u.email, 'info') },
                    u.status === 'Suspendido'
                      ? { icon: 'check', label: 'Reactivar acceso', onClick: () => setStatus(i, 'Activo') }
                      : { icon: 'logout', label: 'Suspender acceso', onClick: () => setStatus(i, 'Suspendido') },
                    { icon: 'trash', label: 'Eliminar usuario', danger: true, onClick: () => setDeleting({ index: i, user: u }) },
                  ]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <CardHead icon="lock" title="Matriz de permisos" sub="Toca una celda para cambiar el nivel · Sin acceso → Ver → Editar → Total" />
        <div style={{ overflowX: 'auto', padding: '4px 16px 12px' }}>
          <table className="perm-tbl">
            <thead>
              <tr>
                <th>Rol</th>
                {DB.permModules.map(m => <th key={m}>{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {DB.roles.map((r, ri) => (
                <tr key={r.role}>
                  <td>
                    <div className="row center gap-8">
                      <Badge tone={r.tone}>{r.role}</Badge>
                      <span className="faint" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>{roleLabel(roleCount(r.role))}</span>
                    </div>
                  </td>
                  {DB.permModules.map((m, ci) => {
                    const lvl = matrix[ri][ci];
                    return (
                      <td key={m}>
                        <span className={'perm-cell perm-' + lvl} onClick={() => cycle(ri, ci)}>{PERM_LABELS[lvl]}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <UserModal user={editing.user} onClose={() => setEditing(null)} onSave={handleSave} />}
      {deleting && (
        <Modal open width={440} onClose={() => setDeleting(null)} title="Eliminar usuario"
          footer={<><button className="btn" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={handleDelete}><Icon name="trash" size={15} className="btn-ico" />Eliminar</button></>}>
          <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>
            ¿Eliminar a <b>{deleting.user.name || deleting.user.email}</b>? Perderá el acceso a la plataforma de inmediato. Esta acción no se puede deshacer.
          </p>
        </Modal>
      )}
    </div>
  );
}

/* ============ INTEGRACIONES ============ */
function CfgIntegrations() {
  const [conn, setConn] = React.useState(() => Object.fromEntries(DB.integrations.map(i => [i.key, i.connected])));
  const toggle = it => {
    const now = !conn[it.key];
    setConn(c => ({ ...c, [it.key]: now }));
    toast(it.name + (now ? ' conectado ✓' : ' desconectado'), now ? 'ok' : 'warn');
  };
  const active = Object.values(conn).filter(Boolean).length;
  return (
    <div className="cfg-section">
      <SecHead title="Integraciones" desc={active + ' de ' + DB.integrations.length + ' servicios conectados. Sincroniza Piaget con tus herramientas.'} />
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {DB.integrations.map(it => {
          const on = conn[it.key];
          const bg = `var(--${it.tone === 'blue' ? 'accent' : it.tone}-soft)`;
          const fg = `var(--${it.tone === 'blue' ? 'accent' : it.tone})`;
          return (
            <div className="intg" key={it.key}>
              <div className="row between center">
                <div className="row center gap-12" style={{ minWidth: 0 }}>
                  <div className="intg-ico" style={{ background: on ? bg : 'var(--surface-3)', color: on ? fg : 'var(--text-faint)' }}><Icon name={it.icon} size={20} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{it.name}</div>
                    <div className="faint" style={{ fontSize: 12 }}>{it.desc}</div>
                  </div>
                </div>
                {on ? <Badge tone="green" dot>Conectado</Badge> : <Badge tone="gray">Inactivo</Badge>}
              </div>
              <div className="row between center" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div className="faint" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {on ? (it.account + ' · ' + it.lastSync) : 'Sin configurar'}
                </div>
                <div className="row gap-8" style={{ flexShrink: 0 }}>
                  {on && <button className="btn sm" onClick={() => toast('Ajustes de ' + it.name)}><Icon name="settings" size={13} className="btn-ico" />Ajustes</button>}
                  <button className={'btn sm' + (on ? '' : ' primary')} onClick={() => toggle(it)}>{on ? 'Desconectar' : 'Conectar'}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ FACTURACIÓN FISCAL ============ */
function CfgFiscal({ cfg, setG }) {
  const f = cfg.fiscal;
  const daysToExpiry = Math.round((new Date(f.csdExpiry) - new Date('2026-06-17')) / 86400000);
  return (
    <div className="cfg-section">
      <SecHead title="Facturación fiscal (CFDI)" desc="Datos del emisor, certificado de sello digital y timbrado automático ante el SAT." />

      <div className="ai-panel">
        <div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}>
          <div className="insight-ico" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}><Icon name="shield" size={16} /></div>
          <div className="insight-body">
            <div className="insight-title">Tus secretos nunca tocan el navegador</div>
            <div className="insight-text">La contraseña del CSD y la API key del PAC se cifran y resguardan en el backend de timbrado. Aquí solo administras banderas y metadatos.</div>
          </div>
          <Badge tone="green" dot>Backend conectado</Badge>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card pad col gap-16">
          <div className="card-title"><Icon name="building" className="ico" size={17} />Datos del emisor</div>
          <div className="field-row">
            <Field label="RFC"><TextInput value={f.rfc} onChange={e => setG('fiscal', 'rfc', e.target.value)} /></Field>
            <Field label="C.P. fiscal"><TextInput value={f.zip} onChange={e => setG('fiscal', 'zip', e.target.value)} /></Field>
          </div>
          <Field label="Razón social"><TextInput value={f.legalName} onChange={e => setG('fiscal', 'legalName', e.target.value)} /></Field>
          <Field label="Régimen fiscal"><SelectInput value={f.regimen} onChange={e => setG('fiscal', 'regimen', e.target.value)} options={['626 · Régimen Simplificado de Confianza (RESICO)', '601 · General de Ley Personas Morales', '603 · Personas Morales con Fines no Lucrativos']} /></Field>
        </div>

        <div className="card pad col gap-12">
          <div className="card-title"><Icon name="lock" className="ico" size={17} />Certificado de sello digital</div>
          <div className="row between center" style={{ background: 'var(--green-soft)', borderRadius: 'var(--r-sm)', padding: '11px 14px' }}>
            <div className="row center gap-10">
              <Icon name="checkCircle" size={18} style={{ color: 'var(--green)' }} />
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>CSD cargado y vigente</div><div className="faint" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>No. {f.csdSerial}</div></div>
            </div>
          </div>
          <div className="kv"><span className="k">Vigencia</span><span className="v">{f.csdExpiry} · faltan {daysToExpiry} días</span></div>
          <div className="row gap-10">
            <button className="btn sm" style={{ flex: 1 }} onClick={() => toast('Cargar .cer (demo)', 'info')}><Icon name="upload" size={13} className="btn-ico" />Reemplazar .cer</button>
            <button className="btn sm" style={{ flex: 1 }} onClick={() => toast('Cargar .key (demo)', 'info')}><Icon name="upload" size={13} className="btn-ico" />Reemplazar .key</button>
          </div>
        </div>
      </div>

      <div className="card pad col gap-16">
        <div className="card-title"><Icon name="receipt" className="ico" size={17} />Timbrado</div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <Field label="Proveedor (PAC)"><SelectInput value={f.pac} onChange={e => setG('fiscal', 'pac', e.target.value)} options={['Facturama', 'Finkok', 'SW sapien']} /></Field>
          <Field label="Modalidad"><SelectInput value={f.pacMode} onChange={e => setG('fiscal', 'pacMode', e.target.value)} options={['Producción', 'Pruebas (sandbox)']} /></Field>
          <Field label="Serie"><TextInput value={f.serie} onChange={e => setG('fiscal', 'serie', e.target.value)} /></Field>
          <Field label="Folio actual"><NumberInput value={f.folioActual} onChange={e => setG('fiscal', 'folioActual', +e.target.value)} /></Field>
        </div>
      </div>

      <div className="card">
        <SRow title="Timbrado automático" desc="Genera el CFDI en cuanto se registra un pago."><Sw on={f.autoTimbrado} onClick={() => setG('fiscal', 'autoTimbrado', !f.autoTimbrado)} /></SRow>
        <SRow title="Enviar factura por correo" desc="Adjunta PDF y XML a la familia al timbrar."><Sw on={f.sendByEmail} onClick={() => setG('fiscal', 'sendByEmail', !f.sendByEmail)} /></SRow>
      </div>
    </div>
  );
}

/* ============ CICLO ESCOLAR ============ */
const EVT_TYPES = ['Festivo', 'Vacaciones', 'Suspensión', 'Evento', 'Junta'];
const evtTone = t => ({ Festivo: 'red', Vacaciones: 'violet', Suspensión: 'amber', Evento: 'cyan', Junta: 'green' }[t] || 'gray');

function EventModal({ event, levelOptions, onClose, onSave }) {
  const isNew = !event;
  // La fecha guardada puede ser un día ("16 sep 2025") o un rango ("20 dic 2025 – 6 ene 2026").
  const parsed = React.useMemo(() => {
    const raw = (event && event.date) || '';
    const parts = raw.split(/\s*[–-]\s*/);
    return parts.length > 1
      ? { range: true, start: parts[0].trim(), end: parts[1].trim() }
      : { range: false, start: raw.trim(), end: '' };
  }, [event]);
  const [form, setForm] = React.useState(() => event
    ? { ...event, type: event.type || 'Evento', level: event.level || 'Todos' }
    : { name: '', type: 'Evento', level: 'Todos' });
  const [range, setRange] = React.useState(parsed.range);
  const [start, setStart] = React.useState(parsed.start);
  const [end, setEnd] = React.useState(parsed.end);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.name.trim()) { toast('Escribe el nombre del evento', 'warn'); return; }
    if (!start.trim()) { toast('Selecciona la fecha', 'warn'); return; }
    if (range && !end.trim()) { toast('Selecciona la fecha de fin', 'warn'); return; }
    const date = range ? `${start.trim()} – ${end.trim()}` : start.trim();
    onSave({ ...form, name: form.name.trim(), date });
  };
  return (
    <Modal open width={460} onClose={onClose} title={isNew ? 'Nuevo evento' : 'Editar evento'}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{isNew ? 'Agregar' : 'Guardar'}</button></>}>
      <Field label="Nombre del evento"><TextInput value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Ej. Festival de primavera" /></Field>
      <div className="field-row">
        <Field label={range ? 'Inicio' : 'Fecha'}><DateInput value={start} onChange={setStart} /></Field>
        {range && <Field label="Fin"><DateInput value={end} onChange={setEnd} /></Field>}
      </div>
      <label className="row center gap-8" style={{ cursor: 'pointer', margin: '-2px 0 10px', fontSize: 13 }}>
        <input type="checkbox" checked={range} onChange={e => { setRange(e.target.checked); if (!e.target.checked) setEnd(''); }} />
        Evento de varios días (rango de fechas)
      </label>
      <div className="field-row">
        <Field label="Tipo"><SelectInput value={form.type} onChange={e => upd('type', e.target.value)} options={EVT_TYPES} /></Field>
        <Field label="Nivel"><SelectInput value={form.level} onChange={e => upd('level', e.target.value)} options={levelOptions} /></Field>
      </div>
    </Modal>
  );
}

function CycleModal({ onClose, onSave }) {
  const [form, setForm] = React.useState({ name: '', start: '', end: '', periods: '5 parciales' });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.name.trim()) { toast('Escribe el nombre del ciclo (ej. 2026–2027)', 'warn'); return; }
    onSave({ ...form, name: form.name.trim(), start: form.start.trim(), end: form.end.trim() });
  };
  return (
    <Modal open width={460} onClose={onClose} title="Nuevo ciclo escolar"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Agregar ciclo</button></>}>
      <Field label="Ciclo escolar"><TextInput value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Ej. 2026–2027" /></Field>
      <div className="field-row">
        <Field label="Inicio"><DateInput value={form.start} onChange={v => upd('start', v)} /></Field>
        <Field label="Fin"><DateInput value={form.end} onChange={v => upd('end', v)} /></Field>
      </div>
      <Field label="Estructura de periodos"><SelectInput value={form.periods} onChange={e => upd('periods', e.target.value)} options={['3 trimestres', '4 bimestres', '5 parciales']} /></Field>
    </Modal>
  );
}

const PERIOD_STATUS = ['Programado', 'En curso', 'Cerrado'];

function PeriodModal({ period, onClose, onSave }) {
  const isNew = !period;
  const [form, setForm] = React.useState(() => period ? { ...period } : { name: '', start: '', end: '', status: 'Programado' });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.name.trim()) { toast('Escribe el nombre del periodo', 'warn'); return; }
    onSave({ ...form, name: form.name.trim() });
  };
  return (
    <Modal open width={460} onClose={onClose} title={isNew ? 'Nuevo periodo' : 'Editar periodo'}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{isNew ? 'Agregar' : 'Guardar'}</button></>}>
      <Field label="Periodo / parcial"><TextInput value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Ej. 1.er Parcial" /></Field>
      <div className="field-row">
        <Field label="Inicio"><DateInput value={form.start} onChange={v => upd('start', v)} /></Field>
        <Field label="Fin"><DateInput value={form.end} onChange={v => upd('end', v)} /></Field>
      </div>
      <Field label="Estado"><SelectInput value={form.status} onChange={e => upd('status', e.target.value)} options={PERIOD_STATUS} /></Field>
    </Modal>
  );
}

/* ---------- generación de periodos a partir del ciclo activo ---------- */
const CFG_MESES = { ene: 0, enero: 0, feb: 1, febrero: 1, mar: 2, marzo: 2, abr: 3, abril: 3, may: 4, mayo: 4, jun: 5, junio: 5, jul: 6, julio: 6, ago: 7, agosto: 7, sep: 8, sept: 8, septiembre: 8, oct: 9, octubre: 9, nov: 10, noviembre: 10, dic: 11, diciembre: 11 };
const CFG_MES_AB = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const CFG_ORD = ['1.er', '2.º', '3.er', '4.º', '5.º', '6.º', '7.º', '8.º'];
function cfgParseDate(str) {
  if (!str) return null;
  const parts = String(str).toLowerCase().replace(/[.,]/g, '').split(/\s+/).filter(Boolean);
  let day = null, year = null, month = null;
  parts.forEach(p => {
    if (/^\d{1,2}$/.test(p) && day == null) day = Number(p);
    else if (/^\d{4}$/.test(p)) year = Number(p);
    else if (CFG_MESES[p] != null) month = CFG_MESES[p];
  });
  if (day == null || month == null || year == null) return null;
  return new Date(year, month, day);
}
function cfgFmtDate(d) { return d.getDate() + ' ' + CFG_MES_AB[d.getMonth()] + ' ' + d.getFullYear(); }
function cfgPeriodCount(structure) { return { '3 trimestres': 3, '4 bimestres': 4, '5 parciales': 5 }[structure] || 5; }
function cfgPeriodLabel(structure) { return { '3 trimestres': 'Trimestre', '4 bimestres': 'Bimestre', '5 parciales': 'Parcial' }[structure] || 'Parcial'; }
function cfgGenPeriods(cycle) {
  const count = cfgPeriodCount(cycle && cycle.periods);
  const label = cfgPeriodLabel(cycle && cycle.periods);
  const s = cfgParseDate(cycle && cycle.start), e = cfgParseDate(cycle && cycle.end);
  const today = new Date();
  const out = [];
  if (s && e && e > s) {
    const seg = (e - s) / count;
    for (let i = 0; i < count; i++) {
      const pStart = new Date(s.getTime() + seg * i);
      const pEnd = new Date(s.getTime() + seg * (i + 1) - 86400000);
      const status = pEnd < today ? 'Cerrado' : (pStart <= today ? 'En curso' : 'Programado');
      out.push({ name: CFG_ORD[i] + ' ' + label, start: cfgFmtDate(pStart), end: cfgFmtDate(pEnd), status });
    }
  } else {
    for (let i = 0; i < count; i++) out.push({ name: CFG_ORD[i] + ' ' + label, start: '', end: '', status: 'Programado' });
  }
  return out;
}
/* ¿los periodos guardados corresponden al ciclo activo? (mismo número y mismo año de inicio) */
function cfgPeriodsMatchCycle(periods, cycle) {
  if (!periods || !periods.length) return false;
  if (periods.length !== cfgPeriodCount(cycle && cycle.periods)) return false;
  const cy = cfgParseDate(cycle && cycle.start);
  const py = cfgParseDate(periods[0] && periods[0].start);
  if (cy && py) return cy.getFullYear() === py.getFullYear();
  return false;
}

function CfgCycle({ cfg, set }) {
  const periodTone = s => s === 'Cerrado' ? 'gray' : s === 'En curso' ? 'green' : 'amber';
  const levelNames = (cfg.levels || []).map(l => l.name).filter(Boolean);
  const levelOptions = ['Todos', ...levelNames];
  const filters = ['Todos', ...levelNames];

  /* ---------- ciclos escolares ---------- */
  const cycles = (cfg.cycles && cfg.cycles.length) ? cfg.cycles : [{ name: cfg.cycle || '2025–2026', start: '26 ago 2025', end: '26 jun 2026', periods: '5 parciales' }];
  const activeIdx = Math.max(0, cycles.findIndex(c => c.name === cfg.cycle));
  const active = cycles[activeIdx] || cycles[0];
  const setActiveField = (k, v) => set('cycles', cycles.map((c, i) => i === activeIdx ? { ...c, [k]: v } : c));
  const addCycle = (data) => { set('cycles', [...cycles, data]); set('cycle', data.name); toast('Ciclo escolar agregado ✓'); };
  const activateCycle = (i) => { set('cycle', cycles[i].name); toast('Ciclo activo: ' + cycles[i].name); };
  const delCycle = (i) => {
    if (cycles.length <= 1) { toast('Debe existir al menos un ciclo escolar', 'warn'); return; }
    const wasActive = cycles[i].name === cfg.cycle;
    const next = cycles.filter((_, j) => j !== i);
    set('cycles', next);
    if (wasActive) set('cycle', next[0].name);
    toast('Ciclo eliminado', 'warn');
  };
  const [cycleModal, setCycleModal] = React.useState(false);

  /* ---------- periodos / parciales (persistidos en la configuración) ----------
     Si los periodos guardados no corresponden al ciclo activo (p. ej. tras
     cambiar/reiniciar el ciclo), se generan automáticamente a partir de su
     rango de fechas y estructura. */
  const storedPeriods = (cfg.cyclePeriods && cfg.cyclePeriods.length) ? cfg.cyclePeriods : null;
  const periods = (storedPeriods && cfgPeriodsMatchCycle(storedPeriods, active)) ? storedPeriods : cfgGenPeriods(active);
  const [periodEdit, setPeriodEdit] = React.useState(null); // { index, period } | { index:-1 }
  const openNewPeriod = () => setPeriodEdit({ index: -1, period: null });
  const openEditPeriod = i => setPeriodEdit({ index: i, period: periods[i] });
  const savePeriod = data => {
    if (periodEdit.index === -1) { set('cyclePeriods', [...periods, data]); toast('Periodo agregado ✓'); }
    else { set('cyclePeriods', periods.map((p, i) => i === periodEdit.index ? data : p)); toast('Periodo actualizado ✓'); }
    setPeriodEdit(null);
  };
  const delPeriod = i => { set('cyclePeriods', periods.filter((_, j) => j !== i)); toast('Periodo eliminado', 'warn'); };

  /* ---------- calendario escolar (persistido en la configuración) ---------- */
  const events = (cfg.calendarEvents && cfg.calendarEvents.length) ? cfg.calendarEvents : DB.calendarEvents;
  const [filter, setFilter] = React.useState('Todos');
  const [editing, setEditing] = React.useState(null); // { index, event } | { index:-1 }

  const shown = events.filter(e => filter === 'Todos' || e.level === filter || e.level === 'Todos');
  const openNew = () => setEditing({ index: -1, event: null });
  const openEdit = idx => setEditing({ index: idx, event: events[idx] });
  const handleSave = data => {
    if (editing.index === -1) { set('calendarEvents', [...events, data]); toast('Evento agregado ✓'); }
    else { set('calendarEvents', events.map((e, i) => i === editing.index ? data : e)); toast('Evento actualizado ✓'); }
    setEditing(null);
  };
  const del = idx => { set('calendarEvents', events.filter((_, i) => i !== idx)); toast('Evento eliminado', 'warn'); };

  return (
    <div className="cfg-section">
      <SecHead title="Ciclo escolar y calendario" desc="Periodo lectivo activo, parciales y días no laborables por nivel." />

      <div className="card">
        <CardHead icon="calendar" title="Ciclo activo" sub="Periodo lectivo en curso y ciclos registrados"
          right={<button className="btn sm primary" onClick={() => setCycleModal(true)}><Icon name="plus" size={13} className="btn-ico" />Nuevo ciclo</button>} />
        <div className="card pad" style={{ borderTop: 'none' }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <Field label="Ciclo escolar activo"><SelectInput value={active.name} onChange={e => activateCycle(cycles.findIndex(c => c.name === e.target.value))} options={cycles.map(c => c.name)} /></Field>
            <Field label="Inicio"><DateInput value={active.start || ''} onChange={v => setActiveField('start', v)} /></Field>
            <Field label="Fin"><DateInput value={active.end || ''} onChange={v => setActiveField('end', v)} /></Field>
            <Field label="Periodos"><SelectInput value={active.periods || '5 parciales'} onChange={e => setActiveField('periods', e.target.value)} options={['3 trimestres', '4 bimestres', '5 parciales']} /></Field>
          </div>
        </div>
        {cycles.length > 1 && (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {cycles.map((c, i) => (
              <div className="lrow" key={i}>
                <div className="kpi-ico" style={{ width: 34, height: 34, marginBottom: 0, background: 'var(--accent-soft)', color: 'var(--accent)' }}><Icon name="calendar" size={16} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row center gap-8"><span style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</span>{c.name === cfg.cycle && <Badge tone="green" dot>Activo</Badge>}</div>
                  <div className="faint" style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>{(c.start || '—')} – {(c.end || '—')}{c.periods ? ' · ' + c.periods : ''}</div>
                </div>
                {c.name !== cfg.cycle && <button className="btn sm" onClick={() => activateCycle(i)}>Activar</button>}
                <RowMenu items={[{ icon: 'trash', label: 'Eliminar ciclo', onClick: () => delCycle(i) }]} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <CardHead icon="list" title="Periodos / parciales" sub="Fechas de captura de calificaciones"
          right={<button className="btn sm primary" onClick={openNewPeriod}><Icon name="plus" size={13} className="btn-ico" />Nuevo periodo</button>} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Periodo</th><th>Inicio</th><th>Fin</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {periods.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td className="muted">{p.start || '—'}</td>
                  <td className="muted">{p.end || '—'}</td>
                  <td><Badge tone={periodTone(p.status)} dot={p.status === 'En curso'}>{p.status}</Badge></td>
                  <td style={{ textAlign: 'right' }}>
                    <RowMenu items={[
                      { icon: 'edit', label: 'Editar periodo', onClick: () => openEditPeriod(i) },
                      { icon: 'trash', label: 'Eliminar', onClick: () => delPeriod(i) },
                    ]} />
                  </td>
                </tr>
              ))}
              {periods.length === 0 && <tr><td colSpan={5} className="faint" style={{ padding: '16px 12px' }}>Sin periodos. Agrega el primero.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <CardHead icon="flag" title="Calendario escolar" sub="Festivos, suspensiones y eventos por nivel"
          right={<button className="btn sm primary" onClick={openNew}><Icon name="plus" size={13} className="btn-ico" />Agregar evento</button>} />
        <div style={{ padding: '12px 20px 4px' }}>
          <div className="seg-thin">
            {filters.map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}
          </div>
        </div>
        <div>
          {shown.map((e) => {
            const idx = events.indexOf(e);
            return (
              <div className="lrow" key={idx}>
                <div className="kpi-ico" style={{ width: 34, height: 34, marginBottom: 0, background: `var(--${evtTone(e.type)}-soft)`, color: `var(--${evtTone(e.type)})` }}><Icon name="calendar" size={16} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.name}</div>
                  <div className="faint" style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>{e.date}</div>
                </div>
                <Badge tone={e.level === 'Todos' ? 'gray' : 'blue'}>{e.level}</Badge>
                <Badge tone={evtTone(e.type)}>{e.type}</Badge>
                <RowMenu items={[
                  { icon: 'edit', label: 'Editar evento', onClick: () => openEdit(idx) },
                  { icon: 'trash', label: 'Eliminar', onClick: () => del(idx) },
                ]} />
              </div>
            );
          })}
          {shown.length === 0 && <div className="faint" style={{ fontSize: 13, padding: '16px 20px' }}>Sin eventos para este nivel.</div>}
        </div>
      </div>

      {cycleModal && <CycleModal onClose={() => setCycleModal(false)} onSave={(d) => { addCycle(d); setCycleModal(false); }} />}
      {periodEdit && <PeriodModal period={periodEdit.period} onClose={() => setPeriodEdit(null)} onSave={savePeriod} />}
      {editing && <EventModal event={editing.event} levelOptions={levelOptions} onClose={() => setEditing(null)} onSave={handleSave} />}
    </div>
  );
}

/* ============ SEGURIDAD ============ */
/* Sesión real del equipo actual (sin inventar dispositivos/IPs ajenos) */
function secCurrentSessions() {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  let os = 'Equipo';
  if (/iPhone/.test(ua)) os = 'iPhone'; else if (/iPad/.test(ua)) os = 'iPad';
  else if (/Android/.test(ua)) os = 'Android'; else if (/Mac/.test(ua)) os = 'Mac';
  else if (/Windows/.test(ua)) os = 'Windows'; else if (/Linux/.test(ua)) os = 'Linux';
  let br = 'Navegador';
  if (/Edg/.test(ua)) br = 'Edge'; else if (/Chrome/.test(ua)) br = 'Chrome';
  else if (/Firefox/.test(ua)) br = 'Firefox'; else if (/Safari/.test(ua)) br = 'Safari';
  return [{ device: os + ' · ' + br, loc: 'Sesión actual', ip: '—', last: 'Ahora', current: true }];
}
const SEC_ICON_TONE = { wallet: 'green', book: 'blue', edit: 'blue', clipboard: 'violet', checkCircle: 'green', spark: 'violet', megaphone: 'amber', user: 'cyan', shield: 'red', alert: 'red' };

function CfgSecurity({ cfg, setG }) {
  const s = cfg.security;
  useStore();
  const [sessions, setSessions] = React.useState(() => secCurrentSessions());
  const audit = (window.DB && DB.activity) || [];
  const closeOne = i => { setSessions(ss => ss.filter((_, j) => j !== i)); toast('Sesión cerrada', 'warn'); };
  const closeAll = () => { setSessions(ss => ss.filter(x => x.current)); toast('Se cerraron las demás sesiones', 'warn'); };
  return (
    <div className="cfg-section">
      <SecHead title="Seguridad" desc="Autenticación, políticas de acceso, sesiones y auditoría." />

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="card-head"><div className="card-title"><Icon name="shield" className="ico" size={17} />Autenticación</div></div>
          <SRow title="Verificación en dos pasos (2FA)" desc="Exigir segundo factor al iniciar sesión."><Sw on={s.twoFA} onClick={() => setG('security', 'twoFA', !s.twoFA)} /></SRow>
          {s.twoFA && (
            <div className="srow" style={{ paddingTop: 4 }}>
              <div className="sr-body"><div className="sr-title">Método 2FA</div></div>
              <div className="sr-ctrl" style={{ width: 200 }}><SelectInput value={s.twoFAMethod} onChange={e => setG('security', 'twoFAMethod', e.target.value)} options={['App autenticadora', 'SMS', 'Correo electrónico']} /></div>
            </div>
          )}
          <SRow title="Inicio de sesión único (SSO)" desc="Google Workspace / Microsoft Entra."><Sw on={s.sso} onClick={() => setG('security', 'sso', !s.sso)} /></SRow>
          <SRow title="Alertas de inicio de sesión" desc="Avisar de accesos desde equipos nuevos."><Sw on={s.loginAlerts} onClick={() => setG('security', 'loginAlerts', !s.loginAlerts)} /></SRow>
          <SRow title="Equipos de confianza" desc="No pedir 2FA por 30 días en equipos marcados."><Sw on={s.deviceTrust} onClick={() => setG('security', 'deviceTrust', !s.deviceTrust)} /></SRow>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title"><Icon name="lock" className="ico" size={17} />Políticas de acceso</div></div>
          <div className="srow">
            <div className="sr-body"><div className="sr-title">Longitud mínima de contraseña</div><div className="sr-desc">{s.passwordMinLen} caracteres</div></div>
            <div className="sr-ctrl"><input type="range" min="6" max="16" value={s.passwordMinLen} onChange={e => setG('security', 'passwordMinLen', +e.target.value)} style={{ width: 150, accentColor: 'var(--accent)' }} /></div>
          </div>
          <SRow title="Exigir símbolos y números" desc="Mayúsculas, dígitos y caracteres especiales."><Sw on={s.passwordSymbols} onClick={() => setG('security', 'passwordSymbols', !s.passwordSymbols)} /></SRow>
          <div className="srow">
            <div className="sr-body"><div className="sr-title">Caducidad de contraseña</div></div>
            <div className="sr-ctrl" style={{ width: 150 }}><SelectInput value={s.passwordRotateDays} onChange={e => setG('security', 'passwordRotateDays', +e.target.value)} options={[{ value: 0, label: 'Nunca' }, { value: 60, label: '60 días' }, { value: 90, label: '90 días' }, { value: 180, label: '180 días' }]} /></div>
          </div>
          <div className="srow">
            <div className="sr-body"><div className="sr-title">Cierre por inactividad</div></div>
            <div className="sr-ctrl" style={{ width: 150 }}><SelectInput value={s.sessionTimeout} onChange={e => setG('security', 'sessionTimeout', +e.target.value)} options={[{ value: 15, label: '15 min' }, { value: 30, label: '30 min' }, { value: 60, label: '1 hora' }, { value: 240, label: '4 horas' }]} /></div>
          </div>
          <SRow title="Lista blanca de IP" desc="Restringir el acceso a rangos de red conocidos."><Sw on={s.ipAllowlist} onClick={() => setG('security', 'ipAllowlist', !s.ipAllowlist)} /></SRow>
        </div>
      </div>

      <div className="card">
        <CardHead icon="globe" title="Sesiones activas" sub={sessions.length + ' dispositivos'}
          right={<button className="btn sm" onClick={closeAll}><Icon name="logout" size={13} className="btn-ico" />Cerrar las demás</button>} />
        <div>
          {sessions.map((se, i) => (
            <div className="lrow" key={i}>
              <div className="kpi-ico" style={{ width: 34, height: 34, marginBottom: 0, background: 'var(--surface-3)', color: 'var(--text-muted)' }}><Icon name="globe" size={16} /></div>
              <div className="grow">
                <div className="row center gap-8"><span style={{ fontWeight: 600, fontSize: 13.5 }}>{se.device}</span>{se.current && <Badge tone="green" dot>Este equipo</Badge>}</div>
                <div className="faint" style={{ fontSize: 12.5 }}>{se.loc} · {se.ip} · {se.last}</div>
              </div>
              {!se.current && <button className="btn sm" onClick={() => closeOne(i)}>Cerrar</button>}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <CardHead icon="history" title="Registro de auditoría" sub="Actividad reciente de administradores"
          right={<button className="btn sm" onClick={() => toast('Exportando registro…', 'info')}><Icon name="download" size={13} className="btn-ico" />Exportar</button>} />
        <div>
          {audit.map((a, i) => {
            const tone = SEC_ICON_TONE[a.icon] || 'blue';
            return (
              <div className="lrow" key={a._id || i}>
                <div className="kpi-ico" style={{ width: 30, height: 30, marginBottom: 0, background: `var(--${tone}-soft)`, color: `var(--${tone})` }}><Icon name={a.icon || 'user'} size={14} /></div>
                <div className="grow" style={{ fontSize: 13.5 }}>
                  <b style={{ fontWeight: 600 }}>{a.who}</b> <span className="muted">{a.action}</span>
                </div>
                <span className="faint" style={{ fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{a.time}</span>
              </div>
            );
          })}
          {audit.length === 0 && <div className="faint" style={{ fontSize: 13, padding: '16px 20px' }}>Sin actividad registrada todavía.</div>}
        </div>
      </div>
    </div>
  );
}

/* ============ NOTIFICACIONES ============ */
function CfgNotifications() {
  const [groups, setGroups] = React.useState(() => DB.notifGroups.map(g => ({ ...g })));
  const toggle = (i, ch) => setGroups(gs => gs.map((g, j) => j === i ? { ...g, [ch]: !g[ch] } : g));
  return (
    <div className="cfg-section">
      <SecHead title="Notificaciones y alertas" desc="Elige qué eventos disparan avisos y por qué canal se entregan." />
      <div className="card">
        <div className="card-head">
          <div className="card-title"><Icon name="bell" className="ico" size={17} />Alertas automáticas</div>
          <div className="row" style={{ gap: 0 }}>
            {['Correo', 'Push', 'WhatsApp'].map(c => (
              <div key={c} style={{ width: 78, textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>{c}</div>
            ))}
          </div>
        </div>
        <div>
          {groups.map((g, i) => (
            <div className="srow" key={g.key}>
              <div className="sr-body"><div className="sr-title">{g.name}</div><div className="sr-desc">{g.desc}</div></div>
              <div className="row" style={{ gap: 0 }}>
                {['email', 'push', 'wapp'].map(ch => (
                  <div key={ch} style={{ width: 78, display: 'flex', justifyContent: 'center' }}><Sw on={g[ch]} onClick={() => toggle(i, ch)} /></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="faint" style={{ fontSize: 12.5, paddingLeft: 4 }}>El canal de WhatsApp requiere la integración de WhatsApp Business activa.</div>
    </div>
  );
}

/* ============ RESPALDOS Y DATOS ============ */
/* Llaves de localStorage que se conservan al reiniciar el ciclo
   (configuración, catálogos, sesión). Todo lo demás se borra. */
const CYCLE_KEEP_KEYS = [
  'piaget_session', 'piaget_settings', 'piaget_theme', 'piaget_cfg_sec',
  'piaget_pay_cfg_v1', 'piaget_egreso_budget', 'piaget_pac_v2',
  'piaget_cat_2526', 'piaget_cat_view', 'piaget_crm_view', 'piaget_docs_folders_v1',
];
function cycleWipeStorage() {
  try {
    const keep = new Set(CYCLE_KEEP_KEYS);
    const rm = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('piaget_') === 0 && !keep.has(k)) rm.push(k);
    }
    rm.forEach(k => localStorage.removeItem(k));
  } catch (e) { }
}
function cycleReiniciar() {
  cycleWipeStorage();
  try { localStorage.setItem('piaget_fresh_cycle', '1'); } catch (e) { }
  toast('Ciclo reiniciado · cargando plataforma limpia…', 'info');
  setTimeout(() => location.reload(), 600);
}
function cycleRestaurarDemo() {
  cycleWipeStorage();
  try { localStorage.removeItem('piaget_fresh_cycle'); } catch (e) { }
  toast('Datos de demostración restablecidos…', 'info');
  setTimeout(() => location.reload(), 600);
}

function CycleResetModal({ onClose, onConfirm }) {
  const [txt, setTxt] = React.useState('');
  const ok = txt.trim().toUpperCase() === 'REINICIAR';
  return (
    <Modal open width={480} onClose={onClose} title="Reiniciar ciclo escolar"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={!ok} style={ok ? { background: 'var(--red)', borderColor: 'var(--red)' } : { opacity: 0.5 }} onClick={onConfirm}>
          <Icon name="refresh" size={15} className="btn-ico" />Reiniciar ciclo</button></>}>
      <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: '0 0 12px' }}>
        Se pondrán <b>en cero los egresos, ingresos y cartera</b> y se eliminarán los datos del ciclo anterior:
        alumnos y familias, calificaciones y asistencia, prospectos (CRM), facturas, pagos y registros de acceso.
      </p>
      <div className="card pad" style={{ background: 'var(--green-soft)', borderColor: 'transparent', fontSize: 12.5, lineHeight: 1.5, marginBottom: 14 }}>
        <b>Se conserva</b> la configuración (niveles, ciclo escolar, usuarios y roles, planes de pago, presupuesto) y los catálogos (tiendita e inventario).
      </div>
      <Field label="Escribe REINICIAR para confirmar"><TextInput value={txt} onChange={e => setTxt(e.target.value)} placeholder="REINICIAR" /></Field>
    </Modal>
  );
}

function CfgBackups({ cfg, setG }) {
  const b = cfg.backups;
  const [resetModal, setResetModal] = React.useState(false);
  const fresh = !!window.PIAGET_FRESH;
  return (
    <div className="cfg-section">
      <SecHead title="Respaldos y datos" desc="Copias de seguridad automáticas, exportación y administración de datos." />

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card">
          <div className="card-head"><div className="card-title"><Icon name="layers" className="ico" size={17} />Respaldos automáticos</div></div>
          <SRow title="Respaldo automático" desc="Copia programada de la base de datos."><Sw on={b.auto} onClick={() => setG('backups', 'auto', !b.auto)} /></SRow>
          <div className="srow"><div className="sr-body"><div className="sr-title">Frecuencia</div></div><div className="sr-ctrl" style={{ width: 160 }}><SelectInput value={b.frequency} onChange={e => setG('backups', 'frequency', e.target.value)} options={['Cada hora', 'Diario', 'Semanal']} /></div></div>
          <div className="srow"><div className="sr-body"><div className="sr-title">Hora del respaldo</div></div><div className="sr-ctrl" style={{ width: 160 }}><SelectInput value={b.time} onChange={e => setG('backups', 'time', e.target.value)} options={['00:00', '02:00', '04:00', '23:00']} /></div></div>
          <div className="srow"><div className="sr-body"><div className="sr-title">Retención</div></div><div className="sr-ctrl" style={{ width: 160 }}><SelectInput value={b.retentionDays} onChange={e => setG('backups', 'retentionDays', +e.target.value)} options={[{ value: 7, label: '7 días' }, { value: 30, label: '30 días' }, { value: 90, label: '90 días' }, { value: 365, label: '1 año' }]} /></div></div>
          <SRow title="Cifrar respaldos" desc="AES-256 en reposo."><Sw on={b.encrypt} onClick={() => setG('backups', 'encrypt', !b.encrypt)} /></SRow>
        </div>

        <div className="card pad col gap-14">
          <div className="card-title"><Icon name="checkCircle" className="ico" size={17} />Último respaldo</div>
          <div className="kpi-ico" style={{ background: 'var(--green-soft)', color: 'var(--green)', marginBottom: 0 }}><Icon name="check" size={18} /></div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>{b.lastBackup}</div>
            <div className="faint" style={{ fontSize: 12.5 }}>{b.lastSize} · {b.storage}</div>
          </div>
          <div className="kv"><span className="k">Frecuencia</span><span className="v">{b.frequency}</span></div>
          <div className="kv"><span className="k">Cifrado</span><span className="v">{b.encrypt ? 'AES-256' : 'No'}</span></div>
          <button className="btn primary" onClick={() => toast('Respaldo iniciado…', 'info')}><Icon name="refresh" size={15} className="btn-ico" />Respaldar ahora</button>
        </div>
      </div>

      <div className="card pad">
        <div className="card-title" style={{ marginBottom: 4 }}><Icon name="download" className="ico" size={17} />Exportar datos</div>
        <div className="faint" style={{ fontSize: 12.5, marginBottom: 14 }}>Descarga la información de la plataforma en formatos abiertos.</div>
        <div className="row gap-10 wrap">
          <button className="btn" onClick={() => toast('Exportando alumnos.csv', 'info')}><Icon name="users" size={15} className="btn-ico" />Alumnos (CSV)</button>
          <button className="btn" onClick={() => toast('Exportando finanzas.csv', 'info')}><Icon name="wallet" size={15} className="btn-ico" />Finanzas (CSV)</button>
          <button className="btn" onClick={() => toast('Exportando calificaciones.csv', 'info')}><Icon name="cap" size={15} className="btn-ico" />Calificaciones (CSV)</button>
          <button className="btn" onClick={() => toast('Generando respaldo.json', 'info')}><Icon name="layers" size={15} className="btn-ico" />Todo (JSON)</button>
        </div>
      </div>

      <div className="card">
        <CardHead icon="calendar" title="Inicio de ciclo escolar" sub="Deja la plataforma en cero para arrancar un ciclo nuevo" />
        <div className="card pad col gap-14" style={{ borderTop: 'none' }}>
          <div className="row center gap-10" style={{ flexWrap: 'wrap' }}>
            <Badge tone={fresh ? 'green' : 'gray'} dot>{fresh ? 'Ciclo en cero · plataforma limpia' : 'Datos de demostración activos'}</Badge>
          </div>
          <p className="faint" style={{ fontSize: 12.8, lineHeight: 1.55, margin: 0, maxWidth: 620 }}>
            Pone en cero egresos, ingresos y cartera, y elimina alumnos, familias, calificaciones, asistencia,
            prospectos, facturas, pagos y accesos del ciclo anterior. Se conservan la configuración (niveles, ciclo,
            usuarios, planes de pago, presupuesto) y los catálogos.
          </p>
          <div className="row gap-10 wrap">
            <button className="btn primary" onClick={() => setResetModal(true)}><Icon name="refresh" size={15} className="btn-ico" />Reiniciar ciclo</button>
            {fresh && <button className="btn" onClick={cycleRestaurarDemo}><Icon name="refresh" size={15} className="btn-ico" />Restaurar datos de demostración</button>}
          </div>
        </div>
      </div>

      <div className="card danger-card">
        <div className="card-head"><div className="card-title" style={{ color: 'var(--red)' }}><Icon name="alert" className="ico" size={17} style={{ color: 'var(--red)' }} />Zona de riesgo</div></div>
        <SRow title="Restablecer datos de demostración" desc="Vuelve la plataforma a su estado inicial de muestra.">
          <button className="btn sm" onClick={cycleRestaurarDemo}><Icon name="refresh" size={13} className="btn-ico" />Restablecer</button>
        </SRow>
        <SRow title="Eliminar todos los datos" desc="Pone la plataforma en cero para iniciar un ciclo nuevo.">
          <button className="btn sm" style={{ color: 'var(--red)', borderColor: 'color-mix(in oklch, var(--red), var(--border) 50%)' }} onClick={() => setResetModal(true)}><Icon name="trash" size={13} className="btn-ico" />Eliminar</button>
        </SRow>
      </div>

      {resetModal && <CycleResetModal onClose={() => setResetModal(false)} onConfirm={cycleReiniciar} />}
    </div>
  );
}

Object.assign(window, {
  CfgGeneral, CfgBranding, CfgUsers, CfgIntegrations,
  CfgFiscal, CfgCycle, CfgSecurity, CfgNotifications, CfgBackups,
});
