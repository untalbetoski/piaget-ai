/* views_contactos.jsx — Directorio general funcional e independiente del CRM */

const CONTACT_TYPES = ['Proveedor', 'Familia', 'Personal', 'Autoridad', 'Prestador de servicio', 'Institución', 'Emergencia', 'Otro'];
const CONTACT_STATUS = ['Activo', 'Inactivo'];

function contactosDB() {
  window.DB = window.DB || {};
  DB.settings = DB.settings || {};
  DB.settings.generalContacts = Array.isArray(DB.settings.generalContacts) ? DB.settings.generalContacts : [];
  return DB.settings.generalContacts;
}
function contactosReal() {
  return contactosDB().filter(c => c && c.real !== false && !c.demo && !c.sample && !c.seed);
}
function contactosClean(v) { return String(v || '').trim(); }
function contactosSave() { try { Store.saveState && Store.saveState(); } catch (_) {} }
function contactosUid() { return 'contact_' + Date.now() + '_' + Math.random().toString(16).slice(2); }
function contactosEmpty() {
  return { type: 'Proveedor', name: '', company: '', role: '', phone: '', whatsapp: '', email: '', website: '', address: '', city: '', rfc: '', tags: '', notes: '', status: 'Activo', real: true };
}
function contactosTone(type) {
  const map = { 'Proveedor': 'amber', 'Familia': 'blue', 'Personal': 'violet', 'Autoridad': 'red', 'Prestador de servicio': 'cyan', 'Institución': 'green', 'Emergencia': 'red', 'Otro': 'gray' };
  return map[type] || 'gray';
}
function ContactoModal({ open, entry, onClose }) {
  const [form, setForm] = React.useState(() => entry ? { ...entry } : contactosEmpty());
  React.useEffect(() => { if (open) setForm(entry ? { ...entry } : contactosEmpty()); }, [open, entry && entry._id]);
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function save() {
    if (!contactosClean(form.name)) return toast('Captura el nombre del contacto', 'warn');
    const payload = {
      ...form,
      name: contactosClean(form.name),
      company: contactosClean(form.company),
      role: contactosClean(form.role),
      phone: contactosClean(form.phone),
      whatsapp: contactosClean(form.whatsapp),
      email: contactosClean(form.email).toLowerCase(),
      website: contactosClean(form.website),
      address: contactosClean(form.address),
      city: contactosClean(form.city),
      rfc: contactosClean(form.rfc).toUpperCase(),
      tags: contactosClean(form.tags),
      notes: contactosClean(form.notes),
      type: form.type || 'Otro',
      status: form.status || 'Activo',
      real: true,
      updatedAt: new Date().toISOString(),
    };
    const list = contactosDB();
    if (entry && entry._id) {
      const i = list.findIndex(x => x._id === entry._id);
      if (i >= 0) list[i] = { ...list[i], ...payload };
    } else {
      list.unshift({ _id: contactosUid(), createdAt: new Date().toISOString(), ...payload });
    }
    contactosSave();
    toast(entry ? 'Contacto actualizado' : 'Contacto guardado', 'ok');
    onClose();
  }
  return <Modal open title={entry ? 'Editar contacto' : 'Nuevo contacto'} width={780} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Guardar</button></>}>
    <div className="col" style={{ gap: 14 }}>
      <div className="field-row"><Field label="Tipo de contacto"><SelectInput value={form.type || 'Proveedor'} onChange={e => set('type', e.target.value)} options={CONTACT_TYPES} /></Field><Field label="Estatus"><SelectInput value={form.status || 'Activo'} onChange={e => set('status', e.target.value)} options={CONTACT_STATUS} /></Field></div>
      <div className="field-row"><Field label="Nombre del contacto"><TextInput value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Nombre completo" autoFocus /></Field><Field label="Empresa / institución"><TextInput value={form.company || ''} onChange={e => set('company', e.target.value)} placeholder="Razón social o institución" /></Field></div>
      <div className="field-row"><Field label="Cargo / relación"><TextInput value={form.role || ''} onChange={e => set('role', e.target.value)} placeholder="Ej. Ventas, Tutor, Director, Técnico" /></Field><Field label="RFC"><TextInput value={form.rfc || ''} onChange={e => set('rfc', e.target.value)} placeholder="Opcional" /></Field></div>
      <div className="field-row"><Field label="Teléfono"><TextInput value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></Field><Field label="WhatsApp"><TextInput value={form.whatsapp || ''} onChange={e => set('whatsapp', e.target.value)} /></Field></div>
      <div className="field-row"><Field label="Correo"><TextInput value={form.email || ''} onChange={e => set('email', e.target.value)} /></Field><Field label="Sitio web"><TextInput value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://" /></Field></div>
      <div className="field-row"><Field label="Ciudad"><TextInput value={form.city || ''} onChange={e => set('city', e.target.value)} /></Field><Field label="Etiquetas"><TextInput value={form.tags || ''} onChange={e => set('tags', e.target.value)} placeholder="papelería, transporte, mantenimiento" /></Field></div>
      <Field label="Dirección"><TextInput value={form.address || ''} onChange={e => set('address', e.target.value)} /></Field>
      <Field label="Notas"><textarea className="inp" rows="4" value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Condiciones comerciales, horario, referencia, observaciones…" /></Field>
    </div>
  </Modal>;
}

function Contactos() {
  useStore();
  const [query, setQuery] = React.useState('');
  const [type, setType] = React.useState('Todos');
  const [status, setStatus] = React.useState('Todos');
  const [modal, setModal] = React.useState(null);
  const contacts = contactosReal();
  const q = query.toLowerCase().trim();
  const shown = contacts.filter(c => {
    if (type !== 'Todos' && c.type !== type) return false;
    if (status !== 'Todos' && c.status !== status) return false;
    if (!q) return true;
    return [c.name, c.company, c.role, c.phone, c.whatsapp, c.email, c.city, c.rfc, c.tags].some(v => String(v || '').toLowerCase().includes(q));
  });
  const counts = CONTACT_TYPES.reduce((acc, t) => { acc[t] = contacts.filter(c => c.type === t).length; return acc; }, {});
  function removeContact(c) {
    if (!confirm('¿Eliminar este contacto del directorio?')) return;
    DB.settings.generalContacts = contactosDB().filter(x => x._id !== c._id);
    contactosSave();
    toast('Contacto eliminado', 'warn');
  }
  function callLink(n) { return String(n || '').replace(/[^\d+]/g, ''); }
  return <div className="content-inner">
    <PageHead eyebrow="CRM y Contactos" title="Contactos" desc="Directorio general del colegio · proveedores, familias, personal, autoridades y servicios">
      <button className="btn primary" onClick={() => setModal({})}><Icon name="plus" size={15} className="btn-ico" />Nuevo contacto</button>
    </PageHead>

    <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
      <div className="card kpi"><div className="kpi-ico"><Icon name="users" size={19} /></div><div className="kpi-label">Total contactos</div><div className="kpi-value tnum">{contacts.length}</div></div>
      <div className="card kpi"><div className="kpi-ico"><Icon name="store" size={19} /></div><div className="kpi-label">Proveedores</div><div className="kpi-value tnum">{counts['Proveedor'] || 0}</div></div>
      <div className="card kpi"><div className="kpi-ico"><Icon name="building" size={19} /></div><div className="kpi-label">Instituciones</div><div className="kpi-value tnum">{counts['Institución'] || 0}</div></div>
      <div className="card kpi"><div className="kpi-ico"><Icon name="checkCircle" size={19} /></div><div className="kpi-label">Activos</div><div className="kpi-value tnum">{contacts.filter(c => c.status === 'Activo').length}</div></div>
    </div>

    <div className="card pad" style={{ marginBottom: 16 }}>
      <div className="row center" style={{ gap: 10, flexWrap: 'wrap' }}>
        <div className="grow" style={{ minWidth: 260 }}><TextInput value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre, empresa, teléfono, correo, RFC o etiqueta…" /></div>
        <SelectInput value={type} onChange={e => setType(e.target.value)} options={['Todos', ...CONTACT_TYPES]} />
        <SelectInput value={status} onChange={e => setStatus(e.target.value)} options={['Todos', ...CONTACT_STATUS]} />
      </div>
    </div>

    {!contacts.length ? <div className="card pad" style={{ textAlign: 'center', padding: 36 }}>
      <div className="kpi-ico" style={{ margin: '0 auto 12px' }}><Icon name="users" size={22} /></div>
      <div style={{ fontWeight: 700, fontSize: 18 }}>Directorio sin contactos</div>
      <div className="faint" style={{ maxWidth: 640, margin: '8px auto 18px', lineHeight: 1.55 }}>Agrega proveedores, familias, personal, autoridades, prestadores de servicio u otros contactos institucionales. Este módulo es independiente del pipeline de aspirantes.</div>
      <button className="btn primary" onClick={() => setModal({})}>Agregar primer contacto</button>
    </div> : <div className="card">
      <CardHead icon="users" title="Directorio general" sub={shown.length + ' de ' + contacts.length + ' contactos'} />
      <div style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>Contacto</th><th>Tipo</th><th>Empresa / institución</th><th>Teléfono</th><th>Correo</th><th>Ciudad</th><th>Estatus</th><th></th></tr></thead><tbody>{shown.map(c => <tr key={c._id}><td><div className="person"><Avatar name={c.name} size={34} /><div><div className="pname">{c.name}</div>{c.role && <div className="faint" style={{ fontSize: 11.5 }}>{c.role}</div>}</div></div></td><td><Badge tone={contactosTone(c.type)}>{c.type || 'Otro'}</Badge></td><td>{c.company || '—'}</td><td><div className="col" style={{ gap: 3 }}>{c.phone ? <a href={'tel:' + callLink(c.phone)}>{c.phone}</a> : <span className="faint">—</span>}{c.whatsapp && <a href={'https://wa.me/' + callLink(c.whatsapp).replace('+','')} target="_blank" rel="noreferrer" style={{ fontSize: 11.5 }}>WhatsApp</a>}</div></td><td>{c.email ? <a href={'mailto:' + c.email}>{c.email}</a> : <span className="faint">—</span>}</td><td>{c.city || '—'}</td><td>{c.status === 'Activo' ? <Badge tone="green" dot>Activo</Badge> : <Badge tone="gray">Inactivo</Badge>}</td><td><RowMenu items={[{ icon: 'edit', label: 'Editar', onClick: () => setModal(c) }, { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => removeContact(c) }]} /></td></tr>)}{!shown.length && <tr><td colSpan={8} className="faint" style={{ textAlign: 'center', padding: 28 }}>No hay contactos que coincidan con los filtros.</td></tr>}</tbody></table></div>
    </div>}
    <ContactoModal open={!!modal} entry={modal && modal._id ? modal : null} onClose={() => setModal(null)} />
  </div>;
}

Object.assign(window, { Contactos, ContactoModal, contactosDB, contactosReal });
