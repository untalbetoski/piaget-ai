/* views_academic.jsx — Módulo Gestión Académica */

function riskBadge(r) {
  if (r === 'high') return <Badge tone="red" dot>Riesgo alto</Badge>;
  if (r === 'mid') return <Badge tone="amber" dot>Medio</Badge>;
  return <Badge tone="green" dot>Estable</Badge>;
}

/* ---------- alta de estudiante: grupos por nivel + expediente ---------- */
const EST_NIVEL_GROUPS = {
  'Preescolar': ['K1 A', 'K2 A', 'K2 B', 'K3 A', 'K3 B'],
  'Primaria': ['1° A', '1° B', '2° A', '2° B', '3° A', '3° B', '4° A', '4° B', '5° A', '5° B', '6° A', '6° B'],
  'Secundaria': ['1° A Sec', '1° B Sec', '2° A Sec', '2° B Sec', '3° A Sec', '3° B Sec'],
};
function emptyStudent() {
  return {
    name: '', curp: '', birth: '', sex: 'Femenino', nivel: 'Primaria', grade: '1° A', ingreso: new Date().toISOString().slice(0, 10),
    tutor: '', parentesco: 'Madre', phone: '', email: '', rfc: '', razonSocial: '', regimenFiscal: '616', cpFiscal: '', emailFiscal: '',
    emergencia: '', emergenciaTel: '', sangre: 'No especificado', alergias: '',
    plan: '10', beca: 0, pay: 'al día', avg: null, att: 100, photo: '',
    inscripcion: (window.cobNivel ? cobNivel('Primaria').inscripcion : 5900), inscPago: 'completo', inscAbono: '',
  };
}
function acaNivel(s) { return s.nivel || (/sec/i.test(s.grade || '') ? 'Secundaria' : /^\s*k/i.test(s.grade || '') ? 'Preescolar' : 'Primaria'); }
function acaPhotoFile(file, cb) { if (!file) return; const r = new FileReader(); r.onload = () => cb(String(r.result)); r.readAsDataURL(file); }
function estPlanLabel(p) { return p === 'anual' ? 'Anual' : p === '12' ? 'Plan 12' : p === '10' ? 'Plan 10' : (p || '—'); }

function Expediente({ s, onClose }) {
  const F = ({ k, v }) => <div><div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div><div style={{ fontSize: 13, fontWeight: 500, marginTop: 1, wordBreak: 'break-word' }}>{v || '—'}</div></div>;
  return (
    <Modal open width={620} onClose={onClose} title={s.name}
      footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={() => toast('Expediente de ' + s.name + ' exportado ✓')}><Icon name="download" size={15} className="btn-ico" />Expediente PDF</button></>}>
      <div className="row center gap-8" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
        <Badge tone="gray"><Icon name="cap" size={12} />{(s.nivel ? s.nivel + ' · ' : '') + s.grade}</Badge>
        {s.matricula && <Badge tone="blue">{s.matricula}</Badge>}
        {riskBadge(s.risk)}
        {s.beca > 0 && <Badge tone="violet">Beca {s.beca}%</Badge>}
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Datos del alumno</div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <F k="CURP" v={s.curp} /><F k="Fecha de nacimiento" v={s.birth} />
        <F k="Sexo" v={s.sex} /><F k="Fecha de ingreso" v={s.ingreso} />
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Tutor y contacto</div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <F k="Tutor" v={s.tutor} /><F k="Parentesco" v={s.parentesco} />
        <F k="Teléfono" v={s.phone} /><F k="Correo" v={s.email} />
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Datos de facturación</div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <F k="RFC" v={s.rfc} /><F k="Razón social" v={s.razonSocial} />
        <F k="Régimen fiscal" v={s.regimenFiscal} /><F k="C.P. fiscal" v={s.cpFiscal} />
        <F k="Correo de facturación" v={s.emailFiscal} />
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Salud y emergencia</div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <F k="Contacto de emergencia" v={s.emergencia} /><F k="Teléfono de emergencia" v={s.emergenciaTel} />
        <F k="Tipo de sangre" v={s.sangre} /><F k="Alergias / condiciones" v={s.alergias} />
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Administrativo y académico</div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <F k="Plan de pago" v={estPlanLabel(s.plan)} /><F k="Colegiatura" v={s.pay} />
        <F k="Promedio" v={s.avg != null ? String(s.avg) : 'Sin calificaciones'} /><F k="Asistencia" v={s.att != null ? s.att + '%' : '—'} />
      </div>
    </Modal>
  );
}

const EST_REGIMENES = [
  { value: '616', label: '616 · Sin obligaciones fiscales' },
  { value: '605', label: '605 · Sueldos y salarios' },
  { value: '612', label: '612 · Actividad empresarial (PF)' },
  { value: '626', label: '626 · RESICO' },
  { value: '601', label: '601 · General de ley personas morales' },
  { value: '603', label: '603 · Personas morales sin fines de lucro' },
  { value: '621', label: '621 · Incorporación fiscal' },
];
function credQR(text) { try { if (!window.qrcode) return ''; const qr = window.qrcode(0, 'M'); qr.addData(text); qr.make(); return qr.createDataURL(4, 0); } catch (e) { return ''; } }

function CredencialCard({ s }) {
  const ciclo = (DB.settings && DB.settings.cycle) || '2025–2026';
  const escuela = (DB.settings && DB.settings.schoolName) || 'Colegio Piaget';
  const curp = s.curp || (window.factCURP ? window.factCURP(s.name) : '');
  const qr = credQR('PIAGET-ID|' + (s.matricula || 'S/M') + '|' + curp + '|' + s.name);
  return (
    <div className="cred-print" style={{ width: 320, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ background: 'var(--accent)', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>P</div>
        <div><div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1 }}>{escuela}</div><div style={{ fontSize: 10.5, opacity: .85, marginTop: 2 }}>Credencial · Ciclo {ciclo}</div></div>
      </div>
      <div style={{ padding: '18px 16px', display: 'flex', gap: 14 }}>
        <div style={{ width: 92, height: 112, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
          {s.photo ? <img src={s.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={38} className="faint" />}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{s.name}</div>
          <div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>{acaNivel(s)} · {s.grade}</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 7 }}>
            {[['Matrícula', s.matricula || '—'], ['CURP', curp || '—'], ['Tutor', s.tutor || '—'], ['Sangre', s.sangre || '—']].map(([k, v], i) => (
              <div key={i}><div className="faint" style={{ fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div><div className="font-mono" style={{ fontSize: 11, fontWeight: 600, wordBreak: 'break-all' }}>{v}</div></div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div><div className="faint" style={{ fontSize: 8.5, textTransform: 'uppercase' }}>Emergencia</div><div style={{ fontSize: 11, fontWeight: 600 }}>{s.emergencia || '—'}</div><div className="font-mono faint" style={{ fontSize: 9.5 }}>{s.emergenciaTel || ''}</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ width: 96, borderTop: '1px solid var(--text-faint)', marginBottom: 3 }} /><div className="faint" style={{ fontSize: 9 }}>Dirección General</div></div>
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        {qr ? <img src={qr} alt="QR" style={{ width: 58, height: 58 }} /> : <div style={{ width: 58, height: 58, background: '#eee', borderRadius: 4 }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9.5, color: '#111', fontWeight: 800, letterSpacing: '.03em' }}>VÁLIDA · CICLO {ciclo}</div>
          <div style={{ fontSize: 9, color: '#555', marginTop: 1 }}>Escanea el QR para validar la matrícula</div>
          <div className="font-mono" style={{ fontSize: 9, color: '#555', marginTop: 3 }}>{s.matricula || '—'}</div>
        </div>
      </div>
    </div>
  );
}

function Credencial({ s, onClose }) {
  return (
    <Modal open width={420} onClose={onClose} title="Credencial del ciclo escolar"
      footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={() => window.print()}><Icon name="download" size={15} className="btn-ico" />Imprimir</button></>}>
      <div style={{ margin: '0 auto', width: 320 }}><CredencialCard s={s} /></div>
    </Modal>
  );
}

function CredencialesLote({ onClose }) {
  const niveles = Object.keys(EST_NIVEL_GROUPS);
  const [nivel, setNivel] = React.useState('Primaria');
  const groups = EST_NIVEL_GROUPS[nivel] || [];
  const [grupo, setGrupo] = React.useState(groups[0] || '');
  const lista = React.useMemo(() => {
    const manual = (DB.students || []).filter(s => s.grade === grupo);
    const roster = (window.ctaStudents ? window.ctaStudents() : []).filter(s => s.group === grupo && !s.manual)
      .map((s, i) => ({ name: s.name, grade: s.group, nivel: s.nivel, matricula: grupo.replace(/[^A-Za-z0-9]/g, '') + '-' + String(i + 1).padStart(2, '0'), curp: window.factCURP ? window.factCURP(s.name) : '', tutor: window.factReceptorOf ? factReceptorOf(s.name).nombre : '—', sangre: 'No especificado', photo: '' }));
    return [...manual, ...roster];
  }, [grupo]);
  return (
    <Modal open width={760} onClose={onClose} title="Credenciales en lote"
      footer={<><span className="grow faint" style={{ fontSize: 12.5 }}>{lista.length} credenciales · grupo {grupo}</span><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" disabled={!lista.length} onClick={() => window.print()}><Icon name="download" size={15} className="btn-ico" />Imprimir {lista.length}</button></>}>
      <div className="row gap-8 center" style={{ marginBottom: 14 }}>
        <span className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Grupo</span>
        <select className="inp" value={nivel} onChange={e => { const nv = e.target.value; setNivel(nv); setGrupo((EST_NIVEL_GROUPS[nv] || [])[0] || ''); }} style={{ height: 34, width: 'auto', padding: '0 26px 0 10px', fontSize: 12.5 }}>{niveles.map(n => <option key={n} value={n}>{n}</option>)}</select>
        <select className="inp" value={grupo} onChange={e => setGrupo(e.target.value)} style={{ height: 34, width: 'auto', padding: '0 26px 0 10px', fontSize: 12.5 }}>{groups.map(g => <option key={g} value={g}>{g}</option>)}</select>
        <span className="grow" />
        <span className="faint tnum" style={{ fontSize: 12.5 }}>{lista.length} alumnos</span>
      </div>
      <div className="cred-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 320px)', gap: 16, justifyContent: 'center', maxHeight: 480, overflowY: 'auto', padding: 4 }}>
        {lista.length ? lista.map((s, i) => <CredencialCard key={i} s={s} />) : <div className="faint" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>Sin alumnos en este grupo.</div>}
      </div>
    </Modal>
  );
}

let _acaRosterCache = null, _acaRosterKey = '';
const ACA_KEY = 'piaget_alumnos_v1';

/* ============ Acceso a la plataforma: usuario y contraseña por alumno ============ */
const ACA_ACCESS_KEY = 'piaget_student_access_v1';
let ACA_ACCESS = (() => { try { return JSON.parse(localStorage.getItem(ACA_ACCESS_KEY) || '{}') || {}; } catch (e) { return {}; } })();
function acaSaveAccess() { try { localStorage.setItem(ACA_ACCESS_KEY, JSON.stringify(ACA_ACCESS)); } catch (e) { } }
function acaAccessKey(s) { return String(s._id || s.sid || s.matricula || s.name); }
function acaSlug(str) { return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }
function acaPortal() { return 'alumnos.' + (((DB.settings && DB.settings.website) || 'colegiopiaget.mx').replace(/^https?:\/\//, '')); }
function acaUserFor(s) {
  const parts = (s.name || 'alumno').trim().split(/\s+/);
  const first = acaSlug(parts[0] || 'alumno');
  const sur = acaSlug(parts[1] || '');
  const digits = String(s.matricula || '').replace(/\D/g, '').slice(-3) || String(Math.floor(100 + Math.random() * 900));
  return (first + (sur ? '.' + sur : '') + digits).slice(0, 28);
}
function acaGenPass() {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ', a = 'abcdefghijkmnpqrstuvwxyz', n = '23456789', sym = '#$%&*';
  const p = set => set[Math.floor(Math.random() * set.length)];
  return p(A) + p(a) + p(a) + p(a) + p(n) + p(n) + p(n) + p(sym);
}
function acaGetAccess(s) { return ACA_ACCESS[acaAccessKey(s)] || null; }
function acaEnsureAccess(s) {
  const k = acaAccessKey(s);
  if (!ACA_ACCESS[k]) { ACA_ACCESS[k] = { user: acaUserFor(s), pass: acaGenPass(), active: true, created: 'hoy', lastAccess: '—' }; acaSaveAccess(); }
  return ACA_ACCESS[k];
}
function acaSetAccess(s, patch) { const k = acaAccessKey(s); ACA_ACCESS[k] = { ...(ACA_ACCESS[k] || {}), ...patch }; acaSaveAccess(); }
function acaCopy(txt, label) { try { navigator.clipboard.writeText(txt); toast((label || 'Texto') + ' copiado ✓'); } catch (e) { toast('Selecciona y copia manualmente', 'info'); } }

function AccesoPlataforma({ s, onClose, onChange }) {
  const [acc, setAcc] = React.useState(() => acaGetAccess(s));
  const [show, setShow] = React.useState(false);
  const portal = acaPortal();
  const refresh = () => { setAcc({ ...acaGetAccess(s) }); onChange && onChange(); };
  const create = () => { acaEnsureAccess(s); refresh(); toast('Acceso generado ✓'); };
  const regen = () => { acaSetAccess(s, { pass: acaGenPass(), active: true }); refresh(); setShow(true); toast('Contraseña regenerada ✓'); };
  const toggle = () => { const on = acc.active; acaSetAccess(s, { active: !on }); refresh(); toast(on ? 'Acceso suspendido' : 'Acceso reactivado', on ? 'warn' : 'ok'); };
  const copyAll = () => acaCopy('Plataforma: https://' + portal + '\nUsuario: ' + acc.user + '\nContraseña: ' + acc.pass, 'Datos de acceso');

  return (
    <Modal open width={460} onClose={onClose} title="Acceso a la plataforma"
      footer={acc
        ? <><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={copyAll}><Icon name="copy" size={15} className="btn-ico" />Copiar datos</button></>
        : <><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={create}><Icon name="lock" size={15} className="btn-ico" />Generar acceso</button></>}>
      <div className="row center gap-12" style={{ marginBottom: 14 }}>
        {s.photo ? <img src={s.photo} alt="" style={{ width: 40, height: 40, borderRadius: 999, objectFit: 'cover' }} /> : <Avatar name={s.name} size={40} />}
        <div><div style={{ fontWeight: 600 }}>{s.name}</div><div className="faint" style={{ fontSize: 12.5 }}>{acaNivel(s)} · {s.grade}{s.matricula ? ' · ' + s.matricula : ''}</div></div>
        {acc && <span style={{ marginLeft: 'auto' }}><Badge tone={acc.active ? 'green' : 'gray'} dot>{acc.active ? 'Acceso activo' : 'Suspendido'}</Badge></span>}
      </div>

      {!acc ? (
        <div className="col center gap-10 faint" style={{ textAlign: 'center', padding: '20px 10px' }}>
          <div className="kpi-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', marginBottom: 0 }}><Icon name="lock" size={20} /></div>
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>Este alumno aún no tiene credenciales para entrar a la plataforma. Genera un usuario y una contraseña para darle acceso.</div>
        </div>
      ) : (
        <div className="col gap-12">
          <Field label="Portal de acceso">
            <div className="row gap-8">
              <TextInput value={'https://' + portal} readOnly style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }} />
              <button className="btn sm" onClick={() => acaCopy('https://' + portal, 'Enlace')}><Icon name="copy" size={13} /></button>
            </div>
          </Field>
          <Field label="Usuario">
            <div className="row gap-8">
              <TextInput value={acc.user} onChange={e => { acaSetAccess(s, { user: e.target.value }); setAcc({ ...acaGetAccess(s) }); }} style={{ fontFamily: 'var(--font-mono)' }} />
              <button className="btn sm" onClick={() => acaCopy(acc.user, 'Usuario')}><Icon name="copy" size={13} /></button>
            </div>
          </Field>
          <Field label="Contraseña">
            <div className="row gap-8">
              <TextInput value={show ? acc.pass : '•'.repeat(acc.pass.length)} readOnly style={{ fontFamily: 'var(--font-mono)', letterSpacing: show ? '0' : '2px' }} />
              <button className="btn sm" onClick={() => setShow(v => !v)} title={show ? 'Ocultar' : 'Mostrar'}><Icon name="eye" size={13} /></button>
              <button className="btn sm" onClick={() => acaCopy(acc.pass, 'Contraseña')}><Icon name="copy" size={13} /></button>
              <button className="btn sm" onClick={regen} title="Regenerar contraseña"><Icon name="refresh" size={13} /></button>
            </div>
          </Field>
          <div className="srow" style={{ padding: '8px 0 0', borderBottom: 'none' }}>
            <div className="sr-body"><div className="sr-title">Acceso activo</div><div className="sr-desc">Permitir que el alumno inicie sesión.</div></div>
            <button className={'sw' + (acc.active ? ' on' : '')} onClick={toggle} type="button"><span className="knob" /></button>
          </div>
          <div className="faint" style={{ fontSize: 11.5, display: 'flex', gap: 6, alignItems: 'flex-start' }}><Icon name="alert" size={13} style={{ marginTop: 1, flexShrink: 0 }} />Comparte estos datos con el alumno o el tutor. Pídele cambiar la contraseña en su primer ingreso.</div>
          <button className="btn" onClick={() => toast('Datos de acceso enviados al tutor de ' + s.name + ' ✓')}><Icon name="mail" size={15} className="btn-ico" />Enviar al tutor por correo</button>
        </div>
      )}
    </Modal>
  );
}

function AccesoLote({ onClose }) {
  const niveles = Object.keys(EST_NIVEL_GROUPS);
  const [nivel, setNivel] = React.useState('Primaria');
  const groups = EST_NIVEL_GROUPS[nivel] || [];
  const [grupo, setGrupo] = React.useState(groups[0] || '');
  const [tick, setTick] = React.useState(0);
  const lista = React.useMemo(() => {
    const manual = (DB.students || []).filter(s => s.grade === grupo);
    const roster = acaBuildRoster().filter(s => !s.manual && s.grade === grupo);
    return [...manual, ...roster];
  }, [grupo, tick]);
  const conAcceso = lista.filter(s => acaGetAccess(s)).length;
  const genAll = () => { lista.forEach(s => acaEnsureAccess(s)); setTick(t => t + 1); toast('Accesos generados para ' + lista.length + ' alumnos ✓'); };
  function exportCSV() {
    const rows = [['Alumno', 'Grupo', 'Usuario', 'Contraseña', 'Estado', 'Portal']].concat(
      lista.map(s => { const a = acaEnsureAccess(s); return [s.name, grupo, a.user, a.pass, a.active ? 'Activo' : 'Suspendido', acaPortal()]; }));
    setTick(t => t + 1);
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'accesos-' + acaSlug(grupo) + '.csv'; a.click(); URL.revokeObjectURL(a.href);
    toast('Accesos exportados ✓');
  }
  return (
    <Modal open width={720} onClose={onClose} title="Accesos a la plataforma · por grupo"
      footer={<><span className="grow faint" style={{ fontSize: 12.5 }}>{conAcceso}/{lista.length} con acceso · grupo {grupo}</span><button className="btn" onClick={genAll} disabled={!lista.length}><Icon name="lock" size={15} className="btn-ico" />Generar todos</button><button className="btn primary" onClick={exportCSV} disabled={!lista.length}><Icon name="download" size={15} className="btn-ico" />Exportar CSV</button></>}>
      <div className="row gap-8 center" style={{ marginBottom: 14 }}>
        <span className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Grupo</span>
        <select className="inp" value={nivel} onChange={e => { const nv = e.target.value; setNivel(nv); setGrupo((EST_NIVEL_GROUPS[nv] || [])[0] || ''); }} style={{ height: 34, width: 'auto', padding: '0 26px 0 10px', fontSize: 12.5 }}>{niveles.map(n => <option key={n} value={n}>{n}</option>)}</select>
        <select className="inp" value={grupo} onChange={e => setGrupo(e.target.value)} style={{ height: 34, width: 'auto', padding: '0 26px 0 10px', fontSize: 12.5 }}>{groups.map(g => <option key={g} value={g}>{g}</option>)}</select>
        <span className="grow" />
        <span className="faint tnum" style={{ fontSize: 12.5 }}>{lista.length} alumnos</span>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 420 }}>
        <table className="tbl">
          <thead><tr><th>Alumno</th><th>Usuario</th><th>Contraseña</th><th>Estado</th></tr></thead>
          <tbody>
            {lista.map((s, i) => {
              const a = acaGetAccess(s);
              return (
                <tr key={i}>
                  <td><div className="person"><Avatar name={s.name} size={28} /><div className="pname" style={{ fontSize: 13 }}>{s.name}</div></div></td>
                  <td className="font-mono" style={{ fontSize: 12.5 }}>{a ? a.user : <span className="faint">—</span>}</td>
                  <td className="font-mono" style={{ fontSize: 12.5 }}>{a ? a.pass : <span className="faint">—</span>}</td>
                  <td>{a ? <Badge tone={a.active ? 'green' : 'gray'} dot>{a.active ? 'Activo' : 'Suspendido'}</Badge> : <Badge tone="amber">Sin acceso</Badge>}</td>
                </tr>
              );
            })}
            {!lista.length && <tr><td colSpan="4" className="faint" style={{ textAlign: 'center', padding: 32 }}>Sin alumnos en este grupo.</td></tr>}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
let ACA_OV = (() => { try { return JSON.parse(localStorage.getItem(ACA_KEY) || '{}') || {}; } catch (e) { return {}; } })();
let _acaOvVer = 0;
function acaSetOverride(sid, patch) { ACA_OV[sid] = { ...(ACA_OV[sid] || {}), ...patch }; _acaOvVer++; try { localStorage.setItem(ACA_KEY, JSON.stringify(ACA_OV)); } catch (e) { } }
function acaInvalidate() { _acaOvVer++; }
function acaBuildRoster() {
  const clases = (window.DB && DB.clases && DB.clases.length) ? DB.clases : (window.CLASES_SEED || []);
  const manual = (window.DB && DB.students) || [];
  const key = manual.length + ':' + clases.length + ':' + _acaOvVer;
  if (_acaRosterKey === key && _acaRosterCache) return _acaRosterCache;
  const out = manual.map(s => ({ ...s, manual: true }));
  clases.forEach(c => {
    (window.alumnosDeClase ? alumnosDeClase(c) : []).forEach((a, i) => {
      const sid = (c._id || c.g) + '-' + i;
      const risk = (a.avg != null && a.avg < 7) || a.asis < 75 ? 'high' : (a.avg != null && a.avg < 8) || a.asis < 88 ? 'mid' : 'low';
      out.push({ sid, name: a.name, grade: c.g, nivel: c.nivel, avg: a.avg, att: a.asis, tutor: (window.factReceptorOf ? factReceptorOf(a.name).nombre : '—'), risk, pay: (i % 9 === 0) ? 'atrasado' : 'al día', manual: false, ...(ACA_OV[sid] || {}) });
    });
  });
  _acaRosterCache = out; _acaRosterKey = key; return out;
}

function Academico({ go }) {
  const store = useStore();
  const d = DB;
  const [tab, setTab] = React.useState('Estudiantes');
  const [filter, setFilter] = React.useState('Todos');
  const [search, setSearch] = React.useState('');
  const [fNivel, setFNivel] = React.useState('Todos');
  const [fGrupo, setFGrupo] = React.useState('Todos');
  const [modal, setModal] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [cred, setCred] = React.useState(null);
  const [lote, setLote] = React.useState(false);
  const [acceso, setAcceso] = React.useState(null);
  const [accLote, setAccLote] = React.useState(false);
  const [accTick, setAccTick] = React.useState(0);
  const [editId, setEditId] = React.useState(null);
  const [editSid, setEditSid] = React.useState(null);
  const [tick, setTick] = React.useState(0);
  const [sort, setSort] = React.useState('nivelGrado');
  const [form, setForm] = React.useState(emptyStudent);
  const photoRef = React.useRef(null);
  const NIV_ORD = { 'Preescolar': 0, 'Primaria': 1, 'Secundaria': 2 };
  const roster = React.useMemo(() => acaBuildRoster(), [store, (DB.students || []).length, tick]);
  const niveles = ['Todos', 'Preescolar', 'Primaria', 'Secundaria'];
  const grupos = React.useMemo(() => ['Todos', ...Array.from(new Set(roster.filter(s => fNivel === 'Todos' || acaNivel(s) === fNivel).map(s => s.grade)))], [roster, fNivel]);
  const filtered = roster.filter(s =>
    (filter !== 'Riesgo' || s.risk !== 'low') &&
    (fNivel === 'Todos' || acaNivel(s) === fNivel) &&
    (fGrupo === 'Todos' || s.grade === fGrupo) &&
    (!search.trim() || s.name.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const shown = [...filtered].sort((a, b) => {
    if (sort === 'nombre') return a.name.localeCompare(b.name);
    if (sort === 'riesgo') { const r = { high: 0, mid: 1, low: 2 }; return (r[a.risk] - r[b.risk]) || a.name.localeCompare(b.name); }
    if (sort === 'promedio') return ((b.avg == null ? -1 : b.avg) - (a.avg == null ? -1 : a.avg));
    const na = NIV_ORD[acaNivel(a)] ?? 1, nb = NIV_ORD[acaNivel(b)] ?? 1;
    return na - nb || String(a.grade).localeCompare(String(b.grade), 'es', { numeric: true }) || a.name.localeCompare(b.name);
  });
  const capped = shown.slice(0, 150);

  function openNew() { setEditId(null); setEditSid(null); setForm(emptyStudent()); setModal(true); }
  function openEdit(s) { setForm({ ...emptyStudent(), ...s }); if (s.manual) { setEditId(s._id); setEditSid(null); } else { setEditSid(s.sid); setEditId(null); } setModal(true); }
  function onPhoto(e) { acaPhotoFile(e.target.files[0], (url) => setForm(f => ({ ...f, photo: url }))); }

  const withAvg = roster.filter(s => s.avg != null);
  const avgGen = withAvg.length ? (withAvg.reduce((a, s) => a + s.avg, 0) / withAvg.length).toFixed(1) : '—';
  const attMed = roster.length ? (roster.reduce((a, s) => a + (s.att || 0), 0) / roster.length).toFixed(1) : '0';
  const enRiesgo = roster.filter(s => s.risk !== 'low').length;
  const reprob = withAvg.length ? (withAvg.filter(s => s.avg < 6).length / withAvg.length * 100).toFixed(1) : '0';
  const grupoCount = new Set(roster.map(s => s.grade)).size;
  const dist = [
    { color: 'var(--green)', label: '9–10 Excelente', value: withAvg.filter(s => s.avg >= 9).length },
    { color: 'var(--accent)', label: '8–8.9 Bueno', value: withAvg.filter(s => s.avg >= 8 && s.avg < 9).length },
    { color: 'var(--amber)', label: '7–7.9 Suficiente', value: withAvg.filter(s => s.avg >= 7 && s.avg < 8).length },
    { color: 'var(--red)', label: 'Menor a 7', value: withAvg.filter(s => s.avg < 7).length },
  ];
  const totalGrades = dist.reduce((a, s) => a + s.value, 0) || 1;

  function saveStudent() {
    if (!form.name.trim()) { toast('Escribe el nombre del estudiante', 'warn'); return; }
    const norm = { ...form, beca: Number(form.beca) || 0, avg: form.avg != null && form.avg !== '' ? Number(form.avg) : null, att: Number(form.att) || 100 };
    if (editSid) {
      acaSetOverride(editSid, norm);
      if (window.ctaSet) window.ctaSet(editSid, { plan: form.plan, beca: Number(form.beca) || 0 });
      Store.log('Control Escolar', 'actualizó el expediente de ' + form.name, 'cap');
      toast('Cambios guardados ✓');
      setEditSid(null); setForm(emptyStudent()); setModal(false); setTick(t => t + 1); return;
    }
    if (editId) {
      Store.update('students', editId, norm);
      acaInvalidate();
      if (window.ctaSet) window.ctaSet(editId, { plan: form.plan, beca: Number(form.beca) || 0 });
      Store.log('Control Escolar', 'actualizó el expediente de ' + form.name, 'cap');
      toast('Cambios guardados ✓');
      setEditId(null); setForm(emptyStudent()); setModal(false); setTick(t => t + 1); return;
    }
    const matricula = 'EST-2026-' + String(1000 + (DB.students || []).filter(s => String(s.matricula || '').startsWith('EST-2026-')).length + 1);
    const rec = Store.add('students', { ...form, matricula, beca: Number(form.beca) || 0, avg: form.avg != null && form.avg !== '' ? Number(form.avg) : null, att: Number(form.att) || 100, risk: 'low' });
    if (window.ctaSet) window.ctaSet(rec._id, { plan: form.plan, beca: Number(form.beca) || 0, paidFrac: 0 });
    /* Registra el cobro de inscripción según la forma de pago elegida */
    const inscMonto = Number(form.inscripcion) || (window.cobNivel ? cobNivel(form.nivel).inscripcion : 0);
    const abono = form.inscPago === 'completo' ? inscMonto : form.inscPago === 'cuenta' ? Math.min(inscMonto, Number(form.inscAbono) || 0) : 0;
    if (abono > 0 && window.Store) {
      Store.add('cobros', {
        recibo: (window.ctaNextRecibo ? ctaNextRecibo() : 'REC-' + Date.now()),
        sid: rec._id, student: form.name, group: form.grade, nivel: form.nivel,
        family: 'Familia ' + form.name.split(' ').slice(-1)[0],
        concept: 'Inscripción' + (form.inscPago === 'cuenta' ? ' (abono)' : '') + ' · ' + form.name + ' (' + form.grade + ')',
        amount: abono, channel: 'Efectivo', ref: '', folio: '',
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        status: 'conciliado',
      });
    }
    Store.log('Control Escolar', 'dio de alta a ' + form.name + ' (' + form.grade + ') y abrió su estado de cuenta', 'cap');
    toast('Estudiante registrado · ' + matricula + (abono > 0 ? ' · inscripción $' + abono.toLocaleString('es-MX') + ' registrada' : '') + ' ✓');
    setForm(emptyStudent());
    setModal(false);
  }

  const MINI = [
    { label: 'Promedio general', value: avgGen, icon: 'award', tone: 'blue', delta: 0.2 },
    { label: 'Asistencia media', value: attMed + '%', icon: 'checkCircle', tone: 'green', delta: 1.1 },
    { label: 'En riesgo (IA)', value: fmtNum(enRiesgo), icon: 'alert', tone: 'amber', delta: -4 },
    { label: 'Reprobación', value: reprob + '%', icon: 'flag', tone: 'red', delta: -1.3 },
  ];

  return (
    <div className="content-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 7 }}>Administración</div>
          <h1 className="page-title">Estudiantes</h1>
          <p className="page-desc">{fmtNum(roster.length)} estudiantes · {grupoCount} grupos · promedio general <b style={{ color: 'var(--text)' }}>{avgGen}</b></p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="calendar" size={15} className="btn-ico" />Horarios</button>
          <button className="btn" onClick={() => setAccLote(true)}><Icon name="lock" size={15} className="btn-ico" />Accesos</button>
          <button className="btn" onClick={() => setLote(true)}><Icon name="user" size={15} className="btn-ico" />Credenciales</button>
          <CsvBar entity="estudiantes" filename="estudiantes-piaget" rows={roster}
            columns={[
              { key: 'id', label: 'id', get: s => s._id || s.sid || '' },
              { key: 'nombre', label: 'nombre', get: s => s.name },
              { key: 'grupo', label: 'grupo', get: s => s.grade },
              { key: 'nivel', label: 'nivel', get: s => s.nivel || acaNivel(s) },
              { key: 'promedio', label: 'promedio', get: s => s.avg == null ? '' : s.avg },
              { key: 'asistencia', label: 'asistencia', get: s => s.att == null ? '' : s.att },
              { key: 'riesgo', label: 'riesgo', get: s => s.risk },
              { key: 'tutor', label: 'tutor', get: s => s.tutor },
              { key: 'pago', label: 'pago', get: s => s.pay },
            ]}
            onImport={(objs) => {
              let added = 0, updated = 0;
              objs.forEach(o => {
                const name = (o.nombre || o.name || '').trim(); if (!name) return;
                const patch = { name };
                if ((o.grupo || '').trim()) patch.grade = o.grupo.trim();
                if ((o.nivel || '').trim()) patch.nivel = o.nivel.trim();
                if (o.promedio !== '' && o.promedio != null) patch.avg = Number(o.promedio);
                if (o.asistencia !== '' && o.asistencia != null) patch.att = Number(o.asistencia);
                if ((o.riesgo || '').trim()) patch.risk = o.riesgo.trim();
                if ((o.tutor || '').trim()) patch.tutor = o.tutor.trim();
                if ((o.pago || '').trim()) patch.pay = o.pago.trim();
                const id = (o.id || '').trim();
                const found = id ? roster.find(s => s._id === id || s.sid === id) : roster.find(s => s.name === name && (!o.grupo || s.grade === o.grupo.trim()));
                if (found && found._id) { Store.update('students', found._id, patch); updated++; }
                else if (found && found.sid) { acaSetOverride(found.sid, patch); updated++; }
                else { Store.add('students', { ...patch, avg: patch.avg != null ? patch.avg : null, att: patch.att != null ? patch.att : 100, risk: patch.risk || 'low', matricula: 'EST-2026-' + String(1000 + (DB.students || []).length + 1) }); added++; }
              });
              setTick(t => t + 1);
              Store.log('Control Escolar', 'importó estudiantes desde CSV', 'cap');
              return { added, updated };
            }} />
          <button className="btn primary" onClick={openNew}><Icon name="plus" size={15} className="btn-ico" />Nuevo estudiante</button>
        </div>
      </div>

      {/* mini KPIs */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {MINI.map((k, i) => {
          const t = window.TONE[k.tone];
          return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum">{k.value}</div>
              <div className="kpi-foot"><Delta value={k.delta} suffix={k.label === 'Promedio general' ? ' pts' : '%'} /><span className="muted">vs. parcial</span></div>
            </div>
          );
        })}
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Distribución de calificaciones */}
        <div className="card">
          <CardHead icon="pie" title="Distribución de calificaciones" sub={'Ciclo en curso · ' + fmtNum(totalGrades) + ' con calificación'} />
          <div className="card pad row gap-16 center" style={{ borderTop: 'none', gap: 28 }}>
            <Donut size={150} thickness={20} segments={dist}
              center={<div><div className="font-display" style={{ fontSize: 26, fontWeight: 600 }}>{avgGen}</div><div className="faint" style={{ fontSize: 11 }}>promedio</div></div>} />
            <div className="grow col gap-12">
              {dist.map((s, i) => (
                <div key={i} className="row center gap-12">
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                  <span className="grow" style={{ fontSize: 13.5 }}>{s.label}</span>
                  <span className="tnum font-mono faint" style={{ fontSize: 12.5 }}>{Math.round(s.value / totalGrades * 100)}%</span>
                  <span className="tnum" style={{ fontWeight: 600, fontSize: 13.5, width: 36, textAlign: 'right' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desempeño por materia */}
        <div className="card">
          <CardHead icon="book" title="Desempeño por materia" sub="Promedio y tendencia vs. parcial anterior" />
          <div className="card pad col gap-16" style={{ borderTop: 'none' }}>
            {d.subjects.map((s, i) => (
              <div key={i} className="row center gap-12">
                <span style={{ width: 92, fontSize: 13.5, fontWeight: 500 }}>{s.name}</span>
                <div className="grow"><Bar value={s.avg * 10} color={s.avg >= 8.5 ? 'var(--green)' : s.avg >= 7.5 ? 'var(--accent)' : 'var(--amber)'} /></div>
                <span className="tnum" style={{ width: 30, fontWeight: 600, fontSize: 13.5 }}>{s.avg}</span>
                <span style={{ width: 44 }}><Delta value={s.trend} suffix="" /></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="card mt-16">
        <CardHead icon="users" title="Listado de estudiantes" sub={fmtNum(filtered.length) + ' de ' + fmtNum(roster.length) + ' alumnos' + (shown.length > 150 ? ' · mostrando 150' : '')}
          right={
            <div className="row gap-8 center" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div className="inp" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 10px', width: 'auto' }}>
                <Icon name="search" size={14} className="faint" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno…" style={{ border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: 12.5, width: 130 }} />
              </div>
              <select className="inp" value={fNivel} onChange={e => { setFNivel(e.target.value); setFGrupo('Todos'); }} style={{ height: 32, padding: '0 24px 0 10px', fontSize: 12.5, width: 'auto' }}>{niveles.map(n => <option key={n} value={n}>{n === 'Todos' ? 'Todos los niveles' : n}</option>)}</select>
              <select className="inp" value={fGrupo} onChange={e => setFGrupo(e.target.value)} style={{ height: 32, padding: '0 24px 0 10px', fontSize: 12.5, width: 'auto' }}>{grupos.map(g => <option key={g} value={g}>{g === 'Todos' ? 'Todos los grupos' : g}</option>)}</select>
              <select className="inp" value={sort} onChange={e => setSort(e.target.value)} style={{ height: 32, padding: '0 24px 0 10px', fontSize: 12.5, width: 'auto' }}>
                <option value="nivelGrado">Nivel y grado</option>
                <option value="nombre">Nombre</option>
                <option value="riesgo">Riesgo</option>
                <option value="promedio">Promedio</option>
              </select>
              <div className="seg">
                {['Todos', 'Riesgo'].map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}
              </div>
            </div>
          } />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr>
              <th>Estudiante</th><th>Grupo</th><th>Promedio</th><th>Asistencia</th><th>Predicción IA</th><th>Colegiatura</th><th>Acceso</th><th></th>
            </tr></thead>
            <tbody>
              {capped.map((s) => (
                <tr key={s._id || s.sid}>
                  <td><div className="person">{s.photo ? <img src={s.photo} alt="" style={{ width: 32, height: 32, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }} /> : <Avatar name={s.name} size={32} />}<div><div className="pname">{s.name}</div><div className="pmeta">Tutor: {s.tutor || '—'}</div></div></div></td>
                  <td><div className="row center gap-8"><Badge tone={window.nivelCfg ? nivelCfg(acaNivel(s)).tone : 'blue'}>{acaNivel(s)}</Badge><span className="font-mono" style={{ fontSize: 12.5 }}>{s.grade}</span></div></td>
                  <td><span className="tnum" style={{ fontWeight: 600, color: s.avg == null ? 'var(--text-faint)' : s.avg < 7 ? 'var(--red)' : s.avg >= 9 ? 'var(--green)' : 'var(--text)' }}>{s.avg == null ? '—' : s.avg}</span></td>
                  <td>
                    <div className="row center gap-8">
                      <div style={{ width: 60 }}><Bar value={s.att} height={5} color={s.att < 80 ? 'var(--red)' : s.att < 90 ? 'var(--amber)' : 'var(--green)'} /></div>
                      <span className="tnum faint font-mono" style={{ fontSize: 12 }}>{s.att}%</span>
                    </div>
                  </td>
                  <td>{riskBadge(s.risk)}</td>
                  <td>{s.pay === 'al día' ? <Badge tone="green">Al día</Badge> : <Badge tone="red">Atrasado</Badge>}</td>
                  <td>{(() => { const a = acaGetAccess(s); return (
                    <span className="clickable" onClick={() => setAcceso(s)} title="Acceso a la plataforma">
                      {a ? <Badge tone={a.active ? 'green' : 'gray'} dot>{a.active ? 'Activo' : 'Suspendido'}</Badge> : <Badge tone="amber">Sin acceso</Badge>}
                    </span>); })()}</td>
                  <td><RowMenu items={[
                    { icon: 'eye', label: 'Ver expediente', onClick: () => setDetail(s) },
                    { icon: 'lock', label: 'Acceso a la plataforma', onClick: () => setAcceso(s) },
                    { icon: 'user', label: 'Generar credencial', onClick: () => setCred(s) },
                    { icon: 'megaphone', label: 'Contactar tutor', onClick: () => toast('Mensaje enviado al tutor de ' + s.name) },
                    { icon: 'edit', label: 'Editar datos', onClick: () => openEdit(s) },
                    ...(s.manual ? [
                      { icon: 'flag', label: s.risk === 'low' ? 'Marcar en riesgo' : 'Quitar riesgo', onClick: () => { Store.update('students', s._id, { risk: s.risk === 'low' ? 'high' : 'low' }); toast('Predicción actualizada', 'info'); } },
                      { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => { Store.remove('students', s._id); toast('Estudiante eliminado', 'warn'); } },
                    ] : []),
                  ]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Banner IA */}
      <div className="ai-panel mt-16">
        <div className="insight" style={{ borderTop: 'none', alignItems: 'center' }}>
          <div className="ai-orb" style={{ width: 34, height: 34 }}><Icon name="spark" size={18} fill="currentColor" /></div>
          <div className="insight-body">
            <div className="insight-title">Plan de intervención sugerido por Copilot</div>
            <div className="insight-text">Para los <b>9 alumnos de prioridad alta</b>, el modelo recomienda tutoría focalizada en Matemáticas y contacto con tutores antes del viernes. Impacto estimado: <b>recuperar 0.6 pts</b> de promedio grupal.</div>
          </div>
          <button className="btn primary nowrap" onClick={() => toast('Plan de intervención generado para 9 alumnos ✓')}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Generar plan</button>
        </div>
      </div>

      <Modal open={modal} width={660} onClose={() => setModal(false)} title={(editId || editSid) ? 'Editar estudiante' : 'Nuevo estudiante'}
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={saveStudent}><Icon name="check" size={15} className="btn-ico" />{(editId || editSid) ? 'Guardar cambios' : 'Registrar estudiante'}</button></>}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Datos del alumno</div>
        <div className="row center gap-12" style={{ marginBottom: 14 }}>
          <div onClick={() => photoRef.current && photoRef.current.click()} style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            {form.photo ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={26} className="faint" />}
          </div>
          <div><div style={{ fontWeight: 600, fontSize: 13 }}>Fotografía</div><div className="faint" style={{ fontSize: 12 }}>Para la credencial del ciclo escolar</div>
            <button className="btn sm" style={{ marginTop: 6 }} onClick={() => photoRef.current && photoRef.current.click()}><Icon name="plus" size={12} className="btn-ico" />{form.photo ? 'Cambiar foto' : 'Subir foto'}</button>
          </div>
          <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhoto} />
        </div>
        <Field label="Nombre completo"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre del estudiante" autoFocus /></Field>
        <div className="field-row">
          <Field label="CURP"><div className="row gap-8" style={{ alignItems: 'stretch' }}><TextInput value={form.curp} onChange={e => setForm({ ...form, curp: e.target.value.toUpperCase() })} placeholder="18 caracteres" style={{ textTransform: 'uppercase' }} /><button className="btn sm" title="Generar CURP" onClick={() => { if (!form.name.trim()) { toast('Escribe el nombre primero', 'warn'); return; } setForm(f => ({ ...f, curp: window.factCURP ? window.factCURP(f.name) : '' })); }}><Icon name="spark" size={13} /></button></div></Field>
          <Field label="Fecha de nacimiento"><input className="inp" type="date" value={form.birth} onChange={e => setForm({ ...form, birth: e.target.value })} /></Field>
        </div>
        <div className="field-row">
          <Field label="Sexo"><SelectInput value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })} options={['Femenino', 'Masculino']} /></Field>
          <Field label="Fecha de ingreso"><input className="inp" type="date" value={form.ingreso} onChange={e => setForm({ ...form, ingreso: e.target.value })} /></Field>
        </div>
        <div className="field-row">
          <Field label="Nivel"><SelectInput value={form.nivel} onChange={e => { const nv = e.target.value; setForm({ ...form, nivel: nv, grade: (EST_NIVEL_GROUPS[nv] || [])[0] || '', inscripcion: (window.cobNivel ? cobNivel(nv).inscripcion : form.inscripcion) }); }} options={Object.keys(EST_NIVEL_GROUPS)} /></Field>
          <Field label="Grupo"><SelectInput value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} options={EST_NIVEL_GROUPS[form.nivel] || []} /></Field>
        </div>

        <div className="eyebrow" style={{ margin: '14px 0 8px' }}>Tutor y contacto</div>
        <div className="field-row">
          <Field label="Nombre del tutor"><TextInput value={form.tutor} onChange={e => setForm({ ...form, tutor: e.target.value })} placeholder="Nombre del tutor" /></Field>
          <Field label="Parentesco"><SelectInput value={form.parentesco} onChange={e => setForm({ ...form, parentesco: e.target.value })} options={['Madre', 'Padre', 'Tutor legal', 'Abuelo(a)', 'Otro']} /></Field>
        </div>
        <div className="field-row">
          <Field label="Teléfono"><TextInput value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="55 0000 0000" /></Field>
          <Field label="Correo"><TextInput value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" /></Field>
        </div>
        <div className="eyebrow" style={{ margin: '14px 0 8px' }}>Datos de facturación</div>
        <div className="field-row">
          <Field label="RFC"><TextInput value={form.rfc} onChange={e => setForm({ ...form, rfc: e.target.value.toUpperCase() })} placeholder="Persona física o moral" style={{ textTransform: 'uppercase' }} /></Field>
          <Field label="Razón social"><TextInput value={form.razonSocial} onChange={e => setForm({ ...form, razonSocial: e.target.value })} placeholder="Nombre o empresa" /></Field>
        </div>
        <div className="field-row">
          <Field label="Régimen fiscal"><SelectInput value={form.regimenFiscal} onChange={e => setForm({ ...form, regimenFiscal: e.target.value })} options={EST_REGIMENES} /></Field>
          <Field label="C.P. fiscal"><TextInput value={form.cpFiscal} onChange={e => setForm({ ...form, cpFiscal: e.target.value })} placeholder="00000" /></Field>
        </div>
        <Field label="Correo de facturación"><TextInput value={form.emailFiscal} onChange={e => setForm({ ...form, emailFiscal: e.target.value })} placeholder="facturacion@empresa.com" /></Field>
        <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>Si el padre factura a nombre de una <b>empresa</b>, captura la razón social, régimen y C.P. de la empresa.</div>

        <div className="eyebrow" style={{ margin: '14px 0 8px' }}>Salud y emergencia</div>
        <div className="field-row">
          <Field label="Contacto de emergencia"><TextInput value={form.emergencia} onChange={e => setForm({ ...form, emergencia: e.target.value })} placeholder="Nombre" /></Field>
          <Field label="Teléfono de emergencia"><TextInput value={form.emergenciaTel} onChange={e => setForm({ ...form, emergenciaTel: e.target.value })} placeholder="55 0000 0000" /></Field>
        </div>
        <div className="field-row">
          <Field label="Tipo de sangre"><SelectInput value={form.sangre} onChange={e => setForm({ ...form, sangre: e.target.value })} options={['No especificado', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']} /></Field>
          <Field label="Alergias / condiciones"><TextInput value={form.alergias} onChange={e => setForm({ ...form, alergias: e.target.value })} placeholder="Ninguna conocida" /></Field>
        </div>

        <div className="eyebrow" style={{ margin: '14px 0 8px' }}>Administrativo</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Plan de pago"><SelectInput value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} options={[{ value: '10', label: 'Plan 10' }, { value: '12', label: 'Plan 12' }, { value: 'anual', label: 'Anual' }]} /></Field>
          <Field label="Beca %"><NumberInput min="0" max="100" value={form.beca} onChange={e => setForm({ ...form, beca: e.target.value })} /></Field>
          <Field label="Colegiatura"><SelectInput value={form.pay} onChange={e => setForm({ ...form, pay: e.target.value })} options={['al día', 'atrasado']} /></Field>
        </div>

        {!(editId || editSid) && (
          <>
            <div className="eyebrow" style={{ margin: '14px 0 8px' }}>Inscripción</div>
            <div style={{ display: 'grid', gridTemplateColumns: form.inscPago === 'cuenta' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
              <Field label="Cuota de inscripción (MXN)"><NumberInput min="0" value={form.inscripcion} onChange={e => setForm({ ...form, inscripcion: e.target.value })} /></Field>
              <Field label="Forma de pago"><SelectInput value={form.inscPago} onChange={e => setForm({ ...form, inscPago: e.target.value })} options={[{ value: 'completo', label: 'Pago completo' }, { value: 'cuenta', label: 'Pago a cuenta' }, { value: 'pendiente', label: 'Sin pago (pendiente)' }]} /></Field>
              {form.inscPago === 'cuenta' && <Field label="Abono inicial (MXN)"><NumberInput min="0" value={form.inscAbono} onChange={e => setForm({ ...form, inscAbono: e.target.value })} /></Field>}
            </div>
            <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>
              {form.inscPago === 'completo'
                ? 'Se registrará el pago completo de la inscripción al dar de alta.'
                : form.inscPago === 'cuenta'
                  ? 'Se registrará el abono inicial; el resto queda como saldo pendiente de inscripción.'
                  : 'No se registra pago; la inscripción queda pendiente en su estado de cuenta.'}
            </div>
          </>
        )}
        <div className="faint" style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', marginTop: 10 }}><Icon name="spark" size={13} />Se asigna una matrícula automática; la predicción de riesgo se calcula cuando haya calificaciones.</div>
      </Modal>

      {detail && <Expediente s={detail} onClose={() => setDetail(null)} />}
      {cred && <Credencial s={cred} onClose={() => setCred(null)} />}
      {lote && <CredencialesLote onClose={() => setLote(false)} />}
      {acceso && <AccesoPlataforma s={acceso} onClose={() => setAcceso(null)} onChange={() => setAccTick(t => t + 1)} />}
      {accLote && <AccesoLote onClose={() => setAccLote(false)} />}
    </div>
  );
}

window.Academico = Academico;
Object.assign(window, { CredencialCard, acaNivel, acaBuildRoster });

/* Estudiante con sesión activa (o el "hijo activo" de una familia), enriquecido con el roster */
function acaEnrichStudent(name, grade) {
  let s = null;
  try { const roster = acaBuildRoster(); s = roster.find(x => x.name === name && (!grade || x.grade === grade)) || roster.find(x => x.name === name); } catch (e) { }
  const g = (s && s.grade) || grade || '';
  return {
    name, grade: g, nivel: acaNivel({ grade: g }),
    avg: s && s.avg != null ? s.avg : null,
    att: s && s.att != null ? s.att : null,
    risk: (s && s.risk) || 'low',
    tutor: (s && s.tutor) || '',
    phone: (s && s.phone) || '',
    emergencia: (s && s.emergencia) || '',
    emergenciaTel: (s && s.emergenciaTel) || '',
    sangre: (s && s.sangre) || '',
    alergias: (s && s.alergias) || '',
    matricula: (s && s.matricula) || ('EST-' + (acaSlug(name) || 'alumno').slice(0, 12)),
    curp: (s && s.curp) || (window.factCURP ? factCURP(name) : ''),
    photo: (s && s.photo) || '',
  };
}
function piagetChildIdx() { try { return Math.max(0, parseInt(localStorage.getItem('piaget_child_idx') || '0', 10) || 0); } catch (e) { return 0; } }
function piagetSetChild(idx) { try { localStorage.setItem('piaget_child_idx', String(idx)); } catch (e) { } window.dispatchEvent(new Event('piaget-child')); }
function piagetChildren() {
  const sess = window.PiagetAuth && window.PiagetAuth.getSession && window.PiagetAuth.getSession();
  if (!sess || sess.kind !== 'Familia') return [];
  return (sess.students || []).map(k => acaEnrichStudent(k.name, k.grade));
}
function piagetStudent() {
  const sess = window.PiagetAuth && window.PiagetAuth.getSession && window.PiagetAuth.getSession();
  if (!sess) return null;
  let name = '', grade = '';
  if (sess.kind === 'Estudiante') { name = sess.name; grade = sess.grade; }
  else if (sess.kind === 'Familia') {
    const kids = sess.students || [];
    if (!kids.length) return null;
    let idx = piagetChildIdx(); if (idx >= kids.length) idx = 0;
    name = kids[idx].name; grade = kids[idx].grade;
  } else return null;
  const r = acaEnrichStudent(name, grade);
  r.user = sess.email || '';
  return r;
}
Object.assign(window, { piagetStudent, piagetChildren, piagetChildIdx, piagetSetChild });

/* Autenticación: estudiantes acceden con el usuario y contraseña generados en Estudiantes › Accesos */
(window.AUTH_RESOLVERS = window.AUTH_RESOLVERS || []).push((id, pass) => {
  let hit = null, hitKey = null;
  for (const k in ACA_ACCESS) { const a = ACA_ACCESS[k]; if (a && a.user && a.user.toLowerCase() === id) { hit = a; hitKey = k; break; } }
  if (!hit) return null;
  if (hit.active === false) return { ok: false, error: 'El acceso de este alumno está suspendido.' };
  if (hit.pass === pass && pass) {
    let s = null;
    try { s = acaBuildRoster().find(x => String(x._id || x.sid || x.matricula || x.name) === hitKey); } catch (e) { }
    return { name: s ? s.name : hit.user, role: 'Estudiantes', email: hit.user, kind: 'Estudiante', grade: s ? s.grade : '', vista: 'home' };
  }
  return { ok: false, error: 'Contraseña incorrecta.' };
});
