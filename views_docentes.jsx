/* views_docentes.jsx — Módulo Docentes (plantilla académica)
   Roster real (titulares de Clases) + altas manuales (persistidas).
   Datos completos, nivel/multinivel, materias que imparte y credencial docente. */

const DOC_NIVELES = ['Preescolar', 'Primaria', 'Secundaria'];
/* Grupos por nivel (estructura curricular estable, igual que alta de estudiantes) */
const DOC_GROUPS = {
  'Preescolar': ['K1 A', 'K2 A', 'K2 B', 'K3 A', 'K3 B'],
  'Primaria': ['1° A', '1° B', '2° A', '2° B', '3° A', '3° B', '4° A', '4° B', '5° A', '5° B', '6° A', '6° B'],
  'Secundaria': ['1° A Sec', '1° B Sec', '2° A Sec', '2° B Sec', '3° A Sec', '3° B Sec'],
};
/* Materias por nivel (mismo vocabulario que Evaluaciones/Calificaciones) */
function docMateriasDe(nivel) {
  const ev = window.EV_MATERIAS;
  if (ev && ev[nivel]) return ev[nivel];
  return DOC_MATERIAS;
}
function docAllGroups() { return DOC_NIVELES.flatMap(n => (DOC_GROUPS[n] || []).map(g => ({ nivel: n, g }))); }
const DOC_MATERIAS = ['Español', 'Matemáticas', 'Ciencias Naturales', 'Historia', 'Geografía', 'Formación Cívica y Ética', 'Inglés', 'Educación Física', 'Artes', 'Tecnología', 'Química', 'Física', 'Biología', 'Educación Socioemocional'];
const DOC_GRADOS = ['Licenciatura', 'Maestría', 'Doctorado', 'Normalista', 'Técnico'];
function docPhotoFile(file, cb) { if (!file) return; const r = new FileReader(); r.onload = () => cb(String(r.result)); r.readAsDataURL(file); }

function docEmpty() {
  return {
    name: '', curp: '', rfc: '', birth: '', sex: 'Femenino', empleado: '', ingreso: new Date().toISOString().slice(0, 10),
    email: '', phone: '', niveles: ['Primaria'], materias: [], asignaciones: [], grupoTitular: '', gradoEstudios: 'Licenciatura', especialidad: '',
    emergencia: '', emergenciaTel: '', status: 'activo', photo: '',
  };
}
function docHash(s) { let h = 0; for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991; return h; }
function docPassFor(d) { return 'doc-' + (docHash((d && (d.email || d.name)) || '') % 9000 + 1000); }
function docSlug(name) { return (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/mtra?\.?\s*/i, '').replace(/[^a-z ]/g, '').trim().split(/\s+/).slice(0, 2).join('.'); }
function docQR(text) { try { if (!window.qrcode) return ''; const qr = window.qrcode(0, 'M'); qr.addData(text); qr.make(); return qr.createDataURL(4, 0); } catch (e) { return ''; } }

/* ---------- roster determinístico desde los titulares de Clases ---------- */
const DOC_KEY = 'piaget_docentes_ov';
let DOC_OV = (() => { try { return JSON.parse(localStorage.getItem(DOC_KEY) || '{}') || {}; } catch (e) { return {}; } })();
let _docOvVer = 0;
function docSetOverride(id, patch) { DOC_OV[id] = { ...(DOC_OV[id] || {}), ...patch }; _docOvVer++; try { localStorage.setItem(DOC_KEY, JSON.stringify(DOC_OV)); } catch (e) { } }

let _docCache = null, _docKey = '';
function docBuildRoster() {
  const clases = (window.DB && DB.clases && DB.clases.length) ? DB.clases : (window.CLASES_SEED || []);
  const manual = (window.DB && DB.docentes) || [];
  const key = manual.length + ':' + clases.length + ':' + _docOvVer;
  if (_docKey === key && _docCache) return _docCache;
  const byName = {};
  clases.forEach(c => {
    const t = c.titular; if (!t) return;
    if (!byName[t]) byName[t] = { name: t.replace(/^Mtr[ao]\.?\s*/i, ''), titulo: /Mtra/i.test(t) ? 'Mtra.' : 'Mtro.', niveles: new Set(), grupos: [], salones: new Set() };
    byName[t].niveles.add(c.nivel); byName[t].grupos.push(c.g); if (c.salon) byName[t].salones.add(c.salon[0]);
  });
  const roster = Object.keys(byName).map((t, idx) => {
    const b = byName[t]; const h = docHash(t);
    const niveles = Array.from(b.niveles);
    const esSec = niveles.includes('Secundaria');
    const materias = esSec
      ? [DOC_MATERIAS[h % DOC_MATERIAS.length], DOC_MATERIAS[(h * 3 + 5) % DOC_MATERIAS.length]].filter((v, i, a) => a.indexOf(v) === i)
      : ['Titular de grupo'];
    const sid = 'doc-' + (h % 99991) + '-' + idx;
    return {
      sid, name: b.name, titulo: b.titulo, niveles, grupos: b.grupos, materias,
      empleado: 'DOC-' + String(2400 + (h % 600)),
      curp: window.factCURP ? window.factCURP(b.name) : '', rfc: window.factRFC ? window.factRFC(b.name) : '',
      email: docSlug(b.name) + '@jeanpiaget.mx', phone: '55 ' + (1000 + (h % 8999)) + ' ' + (1000 + ((h * 7) % 8999)),
      sex: /Mtra/i.test(t) ? 'Femenino' : 'Masculino', gradoEstudios: DOC_GRADOS[h % 3], especialidad: esSec ? materias[0] : 'Educación ' + niveles[0],
      grupoTitular: b.grupos[0] || '', ingreso: (2015 + (h % 9)) + '-08-15', status: 'activo', manual: false,
      pass: 'doc-' + (h % 9000 + 1000),
      ...(DOC_OV[sid] || {}),
    };
  });
  _docCache = manual.map(d => {
    const h = docHash(d.name || d._id || '');
    const email = (d.email && d.email.trim()) || (docSlug(d.name) + '@jeanpiaget.mx');
    return {
      ...d,
      manual: true,
      email,
      empleado: d.empleado || ('DOC-' + String(2400 + (h % 600))),
      pass: d.pass || ('doc-' + (h % 9000 + 1000)),
    };
  }).concat(roster);
  _docKey = key; return _docCache;
}

/* ---------- horario / carga académica (vinculado a Clases) ---------- */
const DOC_DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const DOC_BLOQUES = ['07:30', '08:30', '09:30', '10:30', '11:30', '12:30'];
function docHorario(t) {
  const grupos = t.grupos || []; const materias = (t.materias && t.materias.length) ? t.materias : ['Clase'];
  const h = docHash(t.name);
  const cells = [];
  for (let b = 0; b < DOC_BLOQUES.length; b++) {
    const row = [];
    for (let d = 0; d < 5; d++) {
      const k = h + b * 7 + d * 3;
      if (!grupos.length || k % 6 === 0) { row.push(null); continue; }
      row.push({ grupo: grupos[(b + d + (k % 3)) % grupos.length], materia: materias[(b + d) % materias.length] });
    }
    cells.push(row);
  }
  return { cells, carga: cells.flat().filter(Boolean).length };
}

/* ============ Expediente del docente ============ */
function DocenteExpediente({ d, onClose, go }) {
  const F = ({ k, v }) => <div><div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div><div style={{ fontSize: 13, fontWeight: 500, marginTop: 1, wordBreak: 'break-word' }}>{v || '—'}</div></div>;
  return (
    <Modal open width={620} onClose={onClose} title={(d.titulo ? d.titulo + ' ' : '') + d.name}
      footer={<button className="btn" onClick={onClose}>Cerrar</button>}>
      <div className="row center gap-8" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
        {d.empleado && <Badge tone="blue">{d.empleado}</Badge>}
        {(d.niveles || []).map(n => <Badge key={n} tone={window.nivelCfg ? nivelCfg(n).tone : 'blue'}>{n}</Badge>)}
        <Badge tone={d.status === 'activo' ? 'green' : 'gray'} dot>{d.status === 'activo' ? 'Activo' : 'Inactivo'}</Badge>
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Datos del docente</div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <F k="CURP" v={d.curp} /><F k="RFC" v={d.rfc} />
        <F k="Sexo" v={d.sex} /><F k="Fecha de ingreso" v={d.ingreso} />
        <F k="Correo" v={d.email} /><F k="Teléfono" v={d.phone} />
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Acceso a la plataforma</div>
      <div style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', background: 'var(--surface-2)' }}>
        {(() => {
          const usuario = d.email || '—';
          const pass = d.pass || docPassFor(d);
          const copy = (txt) => {
            const ok = () => toast && toast('Copiado al portapapeles');
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(txt).then(ok).catch(() => fallbackCopy(txt) && ok());
                return;
              }
            } catch (e) {}
            if (fallbackCopy(txt)) ok();
          };
          const fallbackCopy = (txt) => {
            try {
              const ta = document.createElement('textarea');
              ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
              document.body.appendChild(ta); ta.focus(); ta.select();
              const done = document.execCommand('copy');
              document.body.removeChild(ta);
              return done;
            } catch (e) { return false; }
          };
          const Row = ({ k, v }) => (
            <div className="row between center" style={{ gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div>
                <div className="font-mono" style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-all' }}>{v}</div>
              </div>
              <button className="btn sm" onClick={() => copy(v)} title="Copiar"><Icon name="copy" size={13} className="btn-ico" />Copiar</button>
            </div>
          );
          return (
            <div className="col" style={{ gap: 10 }}>
              <Row k="Usuario" v={usuario} />
              <div style={{ borderTop: '1px solid var(--border)' }} />
              <Row k="Contraseña" v={pass} />
              <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.4 }}>El docente ingresa con su correo institucional y esta contraseña. Se recomienda cambiarla en el primer acceso.</div>
            </div>
          );
        })()}
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Asignación académica</div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <F k="Nivel(es)" v={(d.niveles || []).join(' · ')} /><F k="Grupo titular" v={d.grupoTitular} />
        <div style={{ gridColumn: '1 / -1' }}><F k="Materias que imparte" v={(d.materias || []).join(' · ')} /></div>
        <F k="Grado de estudios" v={d.gradoEstudios} /><F k="Especialidad" v={d.especialidad} />
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Emergencia</div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <F k="Contacto" v={d.emergencia} /><F k="Teléfono" v={d.emergenciaTel} />
      </div>

      <div className="row between center" style={{ margin: '16px 0 8px' }}>
        <span className="eyebrow">Carga académica y horario</span>
        <button className="btn sm" onClick={() => { onClose(); go && go('clases'); }}><Icon name="cap" size={13} className="btn-ico" />Ver en Clases</button>
      </div>
      {(() => { const hr = docHorario(d); return (
        <React.Fragment>
          <div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>{hr.carga} sesiones/semana · {(d.grupos || []).length} grupos · {(d.materias || []).join(', ')}</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ fontSize: 11.5 }}>
              <thead><tr><th style={{ width: 54 }}>Hora</th>{DOC_DIAS.map(dd => <th key={dd}>{dd}</th>)}</tr></thead>
              <tbody>
                {hr.cells.map((row, b) => (
                  <tr key={b}>
                    <td className="faint font-mono" style={{ fontSize: 10.5 }}>{DOC_BLOQUES[b]}</td>
                    {row.map((cell, dd) => (
                      <td key={dd} style={{ padding: '6px 8px' }}>{cell
                        ? <div style={{ background: 'var(--accent-soft)', borderRadius: 6, padding: '4px 6px', lineHeight: 1.2 }}><div style={{ fontWeight: 600, fontSize: 11 }}>{cell.grupo}</div><div className="faint" style={{ fontSize: 9.5 }}>{cell.materia}</div></div>
                        : <span className="faint">—</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </React.Fragment>
      ); })()}
    </Modal>
  );
}

/* ============ Credencial del docente ============ */
function DocenteCredCard({ d }) {
  const ciclo = (DB.settings && DB.settings.cycle) || '2025–2026';
  const escuela = (DB.settings && DB.settings.schoolName) || 'Colegio Piaget';
  const curp = d.curp || (window.factCURP ? window.factCURP(d.name) : '');
  const qr = docQR('PIAGET-DOC|' + (d.empleado || 'S/N') + '|' + curp + '|' + d.name);
  return (
    <div className="cred-print" style={{ width: 320, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ background: 'var(--violet)', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>P</div>
        <div><div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1 }}>{escuela}</div><div style={{ fontSize: 10.5, opacity: .85, marginTop: 2 }}>Personal docente · Ciclo {ciclo}</div></div>
      </div>
      <div style={{ padding: '18px 16px', display: 'flex', gap: 14 }}>
        <div style={{ width: 92, height: 112, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
          {d.photo ? <img src={d.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={38} className="faint" />}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{(d.titulo ? d.titulo + ' ' : '') + d.name}</div>
          <div style={{ fontSize: 10.5, color: 'var(--violet)', fontWeight: 700, marginTop: 2 }}>DOCENTE · {(d.niveles || []).join(' / ')}</div>
          <div style={{ marginTop: 9, display: 'grid', gap: 6 }}>
            {[['No. empleado', d.empleado || '—'], ['CURP', curp || '—'], ['Materias', (d.materias || []).join(', ') || '—']].map(([k, v], i) => (
              <div key={i}><div className="faint" style={{ fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div><div className="font-mono" style={{ fontSize: 10.5, fontWeight: 600, wordBreak: 'break-word' }}>{v}</div></div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        {qr ? <img src={qr} alt="QR" style={{ width: 58, height: 58 }} /> : <div style={{ width: 58, height: 58, background: '#eee', borderRadius: 4 }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9.5, color: '#111', fontWeight: 800, letterSpacing: '.03em' }}>VÁLIDA · CICLO {ciclo}</div>
          <div style={{ fontSize: 9, color: '#555', marginTop: 1 }}>Identificación de personal docente</div>
          <div className="font-mono" style={{ fontSize: 9, color: '#555', marginTop: 3 }}>{d.empleado || '—'}</div>
        </div>
        <div style={{ textAlign: 'center' }}><div style={{ width: 76, borderTop: '1px solid var(--text-faint)', marginBottom: 3 }} /><div className="faint" style={{ fontSize: 8.5 }}>Dirección</div></div>
      </div>
    </div>
  );
}
function DocenteCredencial({ d, onClose }) {
  return (
    <Modal open width={420} onClose={onClose} title="Credencial de docente"
      footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={() => window.print()}><Icon name="download" size={15} className="btn-ico" />Imprimir</button></>}>
      <div style={{ margin: '0 auto', width: 320 }}><DocenteCredCard d={d} /></div>
    </Modal>
  );
}

/* ============ Chips multi-selección ============ */
function ChipMulti({ options, value, onChange }) {
  const set = new Set(value || []);
  return (
    <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => {
        const on = set.has(o);
        return <button key={o} type="button" onClick={() => { const n = new Set(set); n.has(o) ? n.delete(o) : n.add(o); onChange(Array.from(n)); }}
          className={'chip-btn' + (on ? ' active' : '')} style={{ background: on ? 'var(--accent-soft)' : 'var(--surface-2)', color: on ? 'var(--accent-strong)' : 'var(--text-muted)', borderColor: on ? 'var(--accent)' : 'var(--border)', fontSize: 12 }}>{o}</button>;
      })}
    </div>
  );
}

/* ============ Editor de asignaciones (nivel · grado/grupo · materia) ============ */
function AsigEditor({ value, onChange }) {
  const rows = value || [];
  const setRow = (i, patch) => onChange(rows.map((r, j) => j === i ? { ...r, ...patch } : r));
  const addRow = () => {
    const nivel = 'Primaria';
    onChange([...rows, { nivel, grupo: (DOC_GROUPS[nivel] || [])[0] || '', materia: docMateriasDe(nivel)[0] || '' }]);
  };
  const delRow = (i) => onChange(rows.filter((_, j) => j !== i));
  return (
    <div className="col" style={{ gap: 8 }}>
      {rows.map((r, i) => {
        const grupos = DOC_GROUPS[r.nivel] || [];
        const materias = docMateriasDe(r.nivel);
        return (
          <div key={i} className="row center gap-8" style={{ alignItems: 'center' }}>
            <select className="inp" style={{ height: 36, flex: '0 0 116px', padding: '0 8px' }} value={r.nivel}
              onChange={e => { const nv = e.target.value; setRow(i, { nivel: nv, grupo: (DOC_GROUPS[nv] || [])[0] || '', materia: docMateriasDe(nv)[0] || '' }); }}>
              {DOC_NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select className="inp" style={{ height: 36, flex: '0 0 110px', padding: '0 8px' }} value={r.grupo} onChange={e => setRow(i, { grupo: e.target.value })}>
              {grupos.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className="inp" style={{ height: 36, flex: 1, minWidth: 0, padding: '0 8px' }} value={r.materia} onChange={e => setRow(i, { materia: e.target.value })}>
              {materias.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button type="button" className="icon-btn" style={{ width: 34, height: 34, flexShrink: 0 }} title="Quitar" onClick={() => delRow(i)}><Icon name="trash" size={15} /></button>
          </div>
        );
      })}
      {!rows.length && <div className="faint" style={{ fontSize: 12.5, padding: '6px 2px' }}>Sin asignaciones. Agrega las materias que imparte por nivel y grupo.</div>}
      <button type="button" className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={addRow}><Icon name="plus" size={13} className="btn-ico" />Agregar asignación</button>
    </div>
  );
}

function DocentesLote({ onClose }) {
  const niveles = ['Todos', ...DOC_NIVELES];
  const [nivel, setNivel] = React.useState('Todos');
  const lista = React.useMemo(() => docBuildRoster().filter(t => nivel === 'Todos' || (t.niveles || []).includes(nivel)), [nivel]);
  return (
    <Modal open width={760} onClose={onClose} title="Credenciales de docentes en lote"
      footer={<><span className="grow faint" style={{ fontSize: 12.5 }}>{lista.length} credenciales · {nivel === 'Todos' ? 'toda la plantilla' : nivel}</span><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" disabled={!lista.length} onClick={() => window.print()}><Icon name="download" size={15} className="btn-ico" />Imprimir {lista.length}</button></>}>
      <div className="row gap-8 center" style={{ marginBottom: 14 }}>
        <span className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Nivel</span>
        <select className="inp" value={nivel} onChange={e => setNivel(e.target.value)} style={{ height: 34, width: 'auto', padding: '0 26px 0 10px', fontSize: 12.5 }}>{niveles.map(n => <option key={n} value={n}>{n === 'Todos' ? 'Toda la plantilla' : n}</option>)}</select>
        <span className="grow" /><span className="faint tnum" style={{ fontSize: 12.5 }}>{lista.length} docentes</span>
      </div>
      <div className="cred-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 320px)', gap: 16, justifyContent: 'center', maxHeight: 480, overflowY: 'auto', padding: 4 }}>
        {lista.length ? lista.map((t, i) => <DocenteCredCard key={i} d={t} />) : <div className="faint" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>Sin docentes.</div>}
      </div>
    </Modal>
  );
}

function Docentes({ go }) {
  const store = useStore();
  const [modal, setModal] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [cred, setCred] = React.useState(null);
  const [lote, setLote] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [editSid, setEditSid] = React.useState(null);
  const [tick, setTick] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [fNivel, setFNivel] = React.useState('Todos');
  const [form, setForm] = React.useState(docEmpty);
  const photoRef = React.useRef(null);

  const roster = React.useMemo(() => docBuildRoster(), [store, (DB.docentes || []).length, tick]);
  const niveles = ['Todos', ...DOC_NIVELES];
  const filtered = roster.filter(t =>
    (fNivel === 'Todos' || (t.niveles || []).includes(fNivel)) &&
    (!search.trim() || (t.name + ' ' + (t.materias || []).join(' ')).toLowerCase().includes(search.trim().toLowerCase()))
  ).sort((a, b) => a.name.localeCompare(b.name));

  const total = roster.length;
  const multinivel = roster.filter(t => (t.niveles || []).length > 1).length;
  const materiasCount = new Set(roster.flatMap(t => t.materias || [])).size;
  const porNivel = DOC_NIVELES.map(n => ({ nivel: n, n: roster.filter(t => (t.niveles || []).includes(n)).length, tone: window.nivelCfg ? nivelCfg(n).tone : 'blue' }));

  function onPhoto(e) { docPhotoFile(e.target.files[0], (url) => setForm(f => ({ ...f, photo: url }))); }
  function openNew() { setEditId(null); setEditSid(null); setForm({ ...docEmpty(), empleado: 'DOC-' + String(3000 + (DB.docentes || []).length + 1) }); setModal(true); }
  function openEdit(t) {
    const base = { ...docEmpty(), ...t };
    /* Reconstruye asignaciones desde materias/grupos previos si aún no existen */
    if (!(base.asignaciones && base.asignaciones.length) && (t.materias || []).length) {
      const grupos = (t.grupos && t.grupos.length) ? t.grupos : ((t.niveles || ['Primaria']).flatMap(n => (DOC_GROUPS[n] || []).slice(0, 1)));
      const nivelOf = (g) => DOC_NIVELES.find(n => (DOC_GROUPS[n] || []).includes(g)) || (t.niveles || [])[0] || 'Primaria';
      base.asignaciones = (t.materias || []).map((m, i) => { const g = grupos[i % grupos.length] || grupos[0] || ''; return { nivel: nivelOf(g), grupo: g, materia: m }; }).filter(a => a.grupo);
    }
    setForm(base);
    if (t.manual) { setEditId(t._id); setEditSid(null); } else { setEditSid(t.sid); setEditId(null); }
    setModal(true);
  }
  function save() {
    if (!form.name.trim()) { toast('Escribe el nombre del docente', 'warn'); return; }
    const asig = (form.asignaciones || []).filter(a => a.nivel && a.grupo && a.materia);
    if (!asig.length) { toast('Agrega al menos una materia (nivel, grupo y materia)', 'warn'); return; }
    /* Deriva niveles, materias y grupos del conjunto de asignaciones para el resto de la app. */
    const derived = {
      asignaciones: asig,
      niveles: Array.from(new Set(asig.map(a => a.nivel))),
      materias: Array.from(new Set(asig.map(a => a.materia))),
      grupos: Array.from(new Set([...asig.map(a => a.grupo), ...(form.grupoTitular ? [form.grupoTitular] : [])])),
    };
    const payload = { ...form, ...derived };
    if (editSid) { docSetOverride(editSid, payload); setTick(t => t + 1); toast('Cambios guardados ✓'); setEditSid(null); setForm(docEmpty()); setModal(false); return; }
    if (editId) { Store.update('docentes', editId, payload); toast('Cambios guardados ✓'); setEditId(null); setForm(docEmpty()); setModal(false); return; }
    Store.add('docentes', payload);
    Store.log('Control Escolar', 'dio de alta al docente ' + form.name, 'cap');
    toast('Docente registrado · ' + (form.empleado || form.name) + ' ✓');
    setForm(docEmpty()); setModal(false);
  }

  const MINI = [
    { label: 'Docentes', value: fmtNum(total), icon: 'users', tone: 'blue' },
    { label: 'Multinivel', value: fmtNum(multinivel), icon: 'layers', tone: 'violet' },
    { label: 'Materias impartidas', value: fmtNum(materiasCount), icon: 'book', tone: 'green' },
    { label: 'Activos', value: fmtNum(roster.filter(t => t.status === 'activo').length), icon: 'checkCircle', tone: 'amber' },
  ];

  return (
    <div className="content-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 7 }}>Administración</div>
          <h1 className="page-title">Docentes</h1>
          <p className="page-desc">{fmtNum(total)} docentes · {fmtNum(materiasCount)} materias · {fmtNum(multinivel)} multinivel</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => go('clases')}><Icon name="cap" size={15} className="btn-ico" />Clases</button>
          <button className="btn" onClick={() => setLote(true)}><Icon name="user" size={15} className="btn-ico" />Credenciales</button>
          <CsvBar entity="docentes" filename="docentes-piaget" rows={roster}
            columns={[
              { key: 'id', label: 'id', get: d => d._id || d.sid || '' },
              { key: 'nombre', label: 'nombre', get: d => d.name },
              { key: 'titulo', label: 'titulo', get: d => d.titulo || '' },
              { key: 'correo', label: 'correo', get: d => d.email },
              { key: 'telefono', label: 'telefono', get: d => d.phone },
              { key: 'niveles', label: 'niveles', get: d => (d.niveles || []).join(' / ') },
              { key: 'materias', label: 'materias', get: d => (d.materias || []).join(' / ') },
              { key: 'grupo_titular', label: 'grupo_titular', get: d => d.grupoTitular || '' },
              { key: 'grado_estudios', label: 'grado_estudios', get: d => d.gradoEstudios || '' },
              { key: 'especialidad', label: 'especialidad', get: d => d.especialidad || '' },
              { key: 'empleado', label: 'empleado', get: d => d.empleado || '' },
              { key: 'estatus', label: 'estatus', get: d => d.status || 'activo' },
            ]}
            onImport={(objs) => {
              let added = 0, updated = 0;
              objs.forEach(o => {
                const name = (o.nombre || o.name || '').trim(); if (!name) return;
                const patch = { name };
                if ((o.titulo || '').trim()) patch.titulo = o.titulo.trim();
                if ((o.correo || o.email || '').trim()) patch.email = (o.correo || o.email).trim();
                if ((o.telefono || o.phone || '').trim()) patch.phone = (o.telefono || o.phone).trim();
                if ((o.niveles || '').trim()) patch.niveles = o.niveles.split('/').map(x => x.trim()).filter(Boolean);
                if ((o.materias || '').trim()) patch.materias = o.materias.split('/').map(x => x.trim()).filter(Boolean);
                if ((o.grupo_titular || '').trim()) patch.grupoTitular = o.grupo_titular.trim();
                if ((o.grado_estudios || '').trim()) patch.gradoEstudios = o.grado_estudios.trim();
                if ((o.especialidad || '').trim()) patch.especialidad = o.especialidad.trim();
                if ((o.empleado || '').trim()) patch.empleado = o.empleado.trim();
                if ((o.estatus || o.status || '').trim()) patch.status = (o.estatus || o.status).trim().toLowerCase();
                const id = (o.id || '').trim();
                const found = id ? roster.find(d => d._id === id || d.sid === id) : roster.find(d => d.name === name);
                if (found && found._id && found.manual) { Store.update('docentes', found._id, patch); updated++; }
                else if (found && found.sid) { docSetOverride(found.sid, patch); updated++; }
                else { Store.add('docentes', { ...docEmpty(), ...patch }); added++; }
              });
              setTick(t => t + 1);
              Store.log('Control Escolar', 'importó docentes desde CSV', 'users');
              return { added, updated };
            }} />
          <button className="btn primary" onClick={openNew}><Icon name="plus" size={15} className="btn-ico" />Nuevo docente</button>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {MINI.map((k, i) => { const t = window.TONE[k.tone]; return (
          <div className="card kpi" key={i}>
            <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value tnum">{k.value}</div>
          </div>
        ); })}
      </div>

      <div className="card mt-16">
        <CardHead icon="users" title="Plantilla docente" sub={fmtNum(filtered.length) + ' de ' + fmtNum(total) + ' docentes'}
          right={<div className="row gap-8 center" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div className="inp" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 10px', width: 'auto' }}>
              <Icon name="search" size={14} className="faint" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar docente o materia…" style={{ border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: 12.5, width: 160 }} />
            </div>
            <select className="inp" value={fNivel} onChange={e => setFNivel(e.target.value)} style={{ height: 32, padding: '0 24px 0 10px', fontSize: 12.5, width: 'auto' }}>{niveles.map(n => <option key={n} value={n}>{n === 'Todos' ? 'Todos los niveles' : n}</option>)}</select>
          </div>} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Docente</th><th>Nivel(es)</th><th>Materias</th><th>Grupos</th><th>Contacto</th><th>Estatus</th><th></th></tr></thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t._id || t.sid}>
                  <td><div className="person">{t.photo ? <img src={t.photo} alt="" style={{ width: 32, height: 32, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }} /> : <Avatar name={t.name} size={32} />}<div><div className="pname">{(t.titulo ? t.titulo + ' ' : '') + t.name}</div><div className="pmeta">{t.empleado}</div></div></div></td>
                  <td><div className="row gap-6" style={{ flexWrap: 'wrap' }}>{(t.niveles || []).map(n => <Badge key={n} tone={window.nivelCfg ? nivelCfg(n).tone : 'blue'}>{n}</Badge>)}</div></td>
                  <td className="muted" style={{ maxWidth: 190, fontSize: 12.5 }}>{(t.materias || []).join(', ')}</td>
                  <td className="muted font-mono" style={{ fontSize: 12 }}>{(t.grupos || []).slice(0, 3).join(', ')}{(t.grupos || []).length > 3 ? '…' : ''}</td>
                  <td className="faint" style={{ fontSize: 11.5 }}>{t.email}</td>
                  <td><Badge tone={t.status === 'activo' ? 'green' : 'gray'} dot>{t.status === 'activo' ? 'Activo' : 'Inactivo'}</Badge></td>
                  <td><RowMenu items={[
                    { icon: 'eye', label: 'Ver expediente', onClick: () => setDetail(t) },
                    { icon: 'edit', label: 'Editar datos', onClick: () => openEdit(t) },
                    { icon: 'user', label: 'Generar credencial', onClick: () => setCred(t) },
                    { icon: 'megaphone', label: 'Contactar', onClick: () => toast('Mensaje enviado a ' + t.name) },
                    ...(t.manual ? [{ icon: 'trash', label: 'Eliminar', danger: true, onClick: () => { Store.remove('docentes', t._id); toast('Docente eliminado', 'warn'); } }] : []),
                  ]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal alta / edición */}
      <Modal open={modal} width={660} onClose={() => setModal(false)} title={(editId || editSid) ? 'Editar docente' : 'Nuevo docente'}
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />{(editId || editSid) ? 'Guardar cambios' : 'Registrar docente'}</button></>}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Datos del docente</div>
        <div className="row center gap-12" style={{ marginBottom: 14 }}>
          <div onClick={() => photoRef.current && photoRef.current.click()} style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            {form.photo ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={26} className="faint" />}
          </div>
          <div><div style={{ fontWeight: 600, fontSize: 13 }}>Fotografía</div><div className="faint" style={{ fontSize: 12 }}>Para la credencial docente</div>
            <button className="btn sm" style={{ marginTop: 6 }} onClick={() => photoRef.current && photoRef.current.click()}><Icon name="plus" size={12} className="btn-ico" />{form.photo ? 'Cambiar foto' : 'Subir foto'}</button>
          </div>
          <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhoto} />
        </div>
        <Field label="Nombre completo"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre del docente" autoFocus /></Field>
        <div className="field-row">
          <Field label="CURP"><div className="row gap-8" style={{ alignItems: 'stretch' }}><TextInput value={form.curp} onChange={e => setForm({ ...form, curp: e.target.value.toUpperCase() })} placeholder="18 caracteres" style={{ textTransform: 'uppercase' }} /><button className="btn sm" title="Generar" onClick={() => { if (!form.name.trim()) { toast('Escribe el nombre primero', 'warn'); return; } setForm(f => ({ ...f, curp: window.factCURP ? window.factCURP(f.name) : '', rfc: f.rfc || (window.factRFC ? window.factRFC(f.name) : '') })); }}><Icon name="spark" size={13} /></button></div></Field>
          <Field label="RFC"><TextInput value={form.rfc} onChange={e => setForm({ ...form, rfc: e.target.value.toUpperCase() })} placeholder="13 caracteres" style={{ textTransform: 'uppercase' }} /></Field>
        </div>
        <div className="field-row">
          <Field label="Sexo"><SelectInput value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })} options={['Femenino', 'Masculino']} /></Field>
          <Field label="Fecha de nacimiento"><input className="inp" type="date" value={form.birth} onChange={e => setForm({ ...form, birth: e.target.value })} /></Field>
        </div>
        <div className="field-row">
          <Field label="Correo institucional"><TextInput value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="docente@jeanpiaget.mx" /></Field>
          <Field label="Teléfono"><TextInput value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="55 0000 0000" /></Field>
        </div>

        <div className="eyebrow" style={{ margin: '14px 0 8px' }}>Asignación académica</div>
        <Field label="Materias que imparte (por nivel, grado y grupo)">
          <AsigEditor value={form.asignaciones} onChange={v => setForm({ ...form, asignaciones: v })} />
        </Field>
        <div className="field-row" style={{ marginTop: 12 }}>
          <Field label="Grupo titular (opcional)">
            <SelectInput value={form.grupoTitular} onChange={e => setForm({ ...form, grupoTitular: e.target.value })}
              options={[{ value: '', label: '— Sin grupo titular —' }, ...(() => {
                const asig = (form.asignaciones || []).map(a => a.grupo).filter(Boolean);
                const base = asig.length ? Array.from(new Set(asig)) : docAllGroups().map(x => x.g);
                return base.map(g => ({ value: g, label: g }));
              })()]} />
          </Field>
          <Field label="Grado de estudios"><SelectInput value={form.gradoEstudios} onChange={e => setForm({ ...form, gradoEstudios: e.target.value })} options={DOC_GRADOS} /></Field>
        </div>
        <Field label="Especialidad"><TextInput value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })} placeholder="Área o especialidad" /></Field>

        <div className="eyebrow" style={{ margin: '14px 0 8px' }}>Administrativo y emergencia</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="No. de empleado"><TextInput value={form.empleado} onChange={e => setForm({ ...form, empleado: e.target.value })} /></Field>
          <Field label="Fecha de ingreso"><input className="inp" type="date" value={form.ingreso} onChange={e => setForm({ ...form, ingreso: e.target.value })} /></Field>
          <Field label="Estatus"><SelectInput value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={[{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }]} /></Field>
        </div>
        <div className="field-row">
          <Field label="Contacto de emergencia"><TextInput value={form.emergencia} onChange={e => setForm({ ...form, emergencia: e.target.value })} placeholder="Nombre" /></Field>
          <Field label="Teléfono de emergencia"><TextInput value={form.emergenciaTel} onChange={e => setForm({ ...form, emergenciaTel: e.target.value })} placeholder="55 0000 0000" /></Field>
        </div>
      </Modal>

      {detail && <DocenteExpediente d={detail} go={go} onClose={() => setDetail(null)} />}
      {cred && <DocenteCredencial d={cred} onClose={() => setCred(null)} />}
      {lote && <DocentesLote onClose={() => setLote(false)} />}
    </div>
  );
}

window.Docentes = Docentes;
Object.assign(window, { docBuildRoster, DOC_NIVELES });

/* Autenticación: docentes acceden con su correo institucional */
(window.AUTH_RESOLVERS = window.AUTH_RESOLVERS || []).push((id, pass) => {
  // Cuenta docente de demostración (la que aparece en la pantalla de acceso)
  if (id === 'docente@jeanpiaget.mx') {
    if (pass === 'Docente2026') return { name: 'Docente Invitado', role: 'Docentes', email: 'docente@jeanpiaget.mx', kind: 'Docente', vista: 'clases' };
    return { ok: false, error: 'Contraseña incorrecta.' };
  }
  const d = docBuildRoster().find(x => x.email && x.email.toLowerCase() === id);
  if (!d) return null;
  if (d.status && d.status !== 'activo') return { ok: false, error: 'El acceso de este docente está inactivo.' };
  if ((d.pass || docPassFor(d)) === pass && pass) return { name: d.name, role: 'Docentes', email: d.email, kind: 'Docente', vista: 'clases' };
  return { ok: false, error: 'Contraseña incorrecta.' };
});
