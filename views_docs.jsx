/* views_docs.jsx — Gestión › Docs: hub documental con carga real, búsqueda, resumen IA y Q&A
   (reemplaza Docs de views_gestion.jsx) */

/* ============ helpers ============ */
async function docsClaudeJSON(prompt) {
  if (!(window.claude && window.claude.complete)) return null;
  try {
    const out = await window.claude.complete(prompt);
    const a = out.indexOf('['), o = out.indexOf('{');
    const start = (a >= 0 && (o < 0 || a < o)) ? a : o;
    const end = Math.max(out.lastIndexOf(']'), out.lastIndexOf('}'));
    if (start < 0 || end <= start) return null;
    return JSON.parse(out.slice(start, end + 1));
  } catch (e) { return null; }
}

function docsFmtSize(bytes) {
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
  if (bytes >= 1e3) return Math.round(bytes / 1e3) + ' KB';
  return bytes + ' B';
}
function docsKindFromName(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return 'PDF';
  if (['doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) return 'DOC';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'XLS';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'IMG';
  return 'DOC';
}
const DOCS_KIND_TONE = { PDF: 'red', DOC: 'blue', XLS: 'green', IMG: 'violet' };

/* ============ descarga real de archivos ============ */
function docsAscii(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[°º]/g, 'o').replace(/[^\x20-\x7E]/g, '?');
}
function docsWrap(text, width) {
  const words = docsAscii(text).split(/\s+/); const lines = []; let cur = '';
  words.forEach(w => { if ((cur + ' ' + w).trim().length > width) { if (cur) lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur);
  return lines;
}
function docsPdfEsc(s) { return docsAscii(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
function docsBuildPDF(title, lines) {
  let stream = 'BT /F2 16 Tf 56 760 Td (' + docsPdfEsc(title) + ') Tj ET\n';
  let y = 728;
  lines.forEach(l => { stream += 'BT /F1 11 Tf 56 ' + y + ' Td (' + docsPdfEsc(l) + ') Tj ET\n'; y -= 18; });
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 6 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + stream.length + ' >>\nstream\n' + stream + 'endstream',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => { offsets.push(pdf.length); pdf += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
  const xref = pdf.length;
  pdf += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offsets.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  pdf += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
  return new Blob([pdf], { type: 'application/pdf' });
}
function docsTriggerDownload(href, filename, revoke) {
  const a = document.createElement('a');
  a.href = href; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(href), 4000);
}
function docsDownload(d) {
  /* archivo subido por el usuario: bytes reales guardados */
  if (d.dataUrl) {
    docsTriggerDownload(d.dataUrl, d.filename || d.name, false);
    toast('Descargando ' + (d.filename || d.name));
    return;
  }
  /* documento del demo: se genera un archivo real al vuelo */
  const summary = d.summary || docsSummaryFallback(d);
  const metaLines = [d.folder + ' · ' + d.owner + ' · ' + (d.date || ''), DB.school.name + ' · ' + DB.school.cycle, ''];
  const bodyLines = [...metaLines, ...docsWrap(summary, 84), '', 'Documento de demostracion generado por PIAGET AI.'];
  let blob, filename;
  if (d.kind === 'XLS') {
    const rows = [['Documento', d.name], ['Carpeta', d.folder], ['Responsable', d.owner], ['Modificado', d.date || ''], ['Resumen', summary]];
    const html = '<html><head><meta charset="utf-8"></head><body><table border="1">' +
      rows.map(r => '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td></tr>').join('') + '</table></body></html>';
    blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    filename = d.name + '.xls';
  } else if (d.kind === 'DOC') {
    const html = '<html><head><meta charset="utf-8"></head><body><h1>' + d.name + '</h1>' +
      '<p><i>' + d.folder + ' · ' + d.owner + ' · ' + DB.school.name + '</i></p><p>' + summary + '</p>' +
      '<p>Documento de demostración generado por PIAGET AI.</p></body></html>';
    blob = new Blob([html], { type: 'application/msword' });
    filename = d.name + '.doc';
  } else {
    blob = docsBuildPDF(d.name, bodyLines);
    filename = d.name + '.pdf';
  }
  docsTriggerDownload(URL.createObjectURL(blob), filename, true);
  toast('Descargando ' + filename);
}

/* ============ IA: resúmenes y Q&A ============ */
const DOCS_CANNED = {
  'Reglamento escolar 2026': { sum: 'Establece las normas de convivencia, uniforme, puntualidad y el proceso de incidencias. Incluye el cuadro de faltas con medidas formativas y los canales de apelación para las familias.', kw: ['reglamento', 'uniforme', 'disciplina', 'falta', 'convivencia', 'puntualidad'] },
  'Plantilla de planeación': { sum: 'Formato estándar para la planeación didáctica semanal: objetivos de aprendizaje, secuencia de actividades, materiales y rúbrica de evaluación por competencia.', kw: ['planeación', 'planeacion', 'plantilla', 'didáctica', 'rúbrica'] },
  'Calendario ciclo 2026': { sum: 'Concentra las fechas del ciclo: inicio y fin de parciales, suspensiones oficiales, juntas de padres, semanas de evaluación y periodos vacacionales.', kw: ['calendario', 'fecha', 'vacaciones', 'suspensión', 'suspension', 'parcial', 'junta'] },
  'Protocolo de seguridad': { sum: 'Procedimientos ante sismo, incendio y contingencias: rutas de evacuación, responsables por edificio, puntos de reunión y protocolo de resguardo de alumnos.', kw: ['seguridad', 'sismo', 'emergencia', 'evacuación', 'evacuacion', 'protocolo', 'incendio'] },
  'Formato de permiso': { sum: 'Formato que las familias llenan para autorizar salidas anticipadas o ausencias justificadas; requiere firma del tutor y visto bueno de coordinación.', kw: ['permiso', 'salida', 'ausencia', 'justificante'] },
};

function docsSummaryFallback(doc) {
  const c = DOCS_CANNED[doc.name];
  if (c) return c.sum;
  const byFolder = {
    Institucional: 'Documento institucional del colegio: define lineamientos, responsables y fechas clave aplicables a toda la comunidad.',
    Académico: 'Material académico de apoyo para docentes y coordinación: criterios, formatos y referencias del trabajo en aula.',
    Familias: 'Documento dirigido a las familias: información práctica, formatos y pasos a seguir para trámites escolares.',
  };
  return (byFolder[doc.folder] || byFolder.Institucional) + ' (' + doc.kind + ' · ' + doc.size + ').';
}
async function docsSummaryAI(doc) {
  const p = 'Eres el asistente documental de ' + DB.school.name + '. Resume en 35-50 palabras (español, tono ejecutivo) el contenido probable del documento "' + doc.name + '" (' + doc.kind + ', carpeta ' + doc.folder + ', responsable ' + doc.owner + ') de una escuela primaria privada en CDMX. Responde ÚNICAMENTE JSON: {"resumen":"..."}';
  const r = await docsClaudeJSON(p);
  if (r && r.resumen) return String(r.resumen);
  return null;
}

function docsAnswerFallback(q) {
  const low = q.toLowerCase();
  for (const d of DB.docs) {
    const c = DOCS_CANNED[d.name];
    const kws = c ? c.kw : d.name.toLowerCase().split(' ');
    if (kws.some(k => k.length > 3 && low.includes(k))) {
      return { respuesta: (c ? c.sum : docsSummaryFallback(d)) + ' Puedes consultar el detalle completo en el documento.', doc: d.name };
    }
  }
  return { respuesta: 'No encontré un documento que responda eso directamente. Puedes subirlo a la biblioteca o preguntarme sobre el reglamento, el calendario, el protocolo de seguridad o los formatos.', doc: null };
}
async function docsAnswerAI(q) {
  const ctx = DB.docs.map(d => '• ' + d.name + ' (' + d.folder + '): ' + docsSummaryFallback(d)).join('\n');
  const p = 'Eres el asistente documental de ' + DB.school.name + '. Documentos disponibles:\n' + ctx +
    '\n\nPregunta del usuario: "' + q + '"\nResponde con base SOLO en esos documentos, en máximo 50 palabras en español. ' +
    'Responde ÚNICAMENTE JSON: {"respuesta":"...","doc":"nombre exacto del documento citado o null"}';
  const r = await docsClaudeJSON(p);
  if (r && r.respuesta) {
    const doc = r.doc && DB.docs.some(d => d.name === r.doc) ? r.doc : null;
    return { respuesta: String(r.respuesta), doc };
  }
  return docsAnswerFallback(q);
}

/* ============ Panel: Pregúntale a Docs ============ */
function DocsAsk({ onOpenDoc }) {
  const [q, setQ] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [ans, setAns] = React.useState(null); // {q, respuesta, doc}
  const sugs = ['¿Qué dice el reglamento sobre uniformes?', '¿Cuándo son las vacaciones del ciclo?', '¿Qué hago en caso de sismo?'];

  async function ask(text) {
    const query = (text || q).trim();
    if (!query || busy) return;
    setBusy(true); setAns(null); setQ('');
    const [r] = await Promise.all([docsAnswerAI(query), new Promise(res => setTimeout(res, 900))]);
    setAns({ q: query, ...r });
    setBusy(false);
  }

  return (
    <div className="ai-panel" style={{ alignSelf: 'start' }}>
      <div className="ai-panel-head">
        <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
        <div className="grow">
          <div style={{ fontWeight: 600, fontSize: 14 }}>Pregúntale a Docs</div>
          <div className="faint" style={{ fontSize: 11.5 }}>Respuestas con base en la biblioteca</div>
        </div>
      </div>
      <div className="col" style={{ gap: 11, padding: '12px 2px 2px' }}>
        {!ans && !busy && (
          <div className="col" style={{ gap: 7 }}>
            {sugs.map((s, i) => (
              <button key={i} className="chip-btn plain" style={{ justifyContent: 'flex-start', textAlign: 'left', fontSize: 12 }} onClick={() => ask(s)}>{s}</button>
            ))}
          </div>
        )}
        {busy && (
          <div className="row center" style={{ gap: 9, padding: '8px 2px' }}>
            <span className="ai-orb" style={{ width: 18, height: 18, borderRadius: 6 }}><Icon name="spark" size={10} fill="currentColor" /></span>
            <span style={{ fontSize: 12.5 }}>Buscando en {DB.docs.length} documentos…</span>
          </div>
        )}
        {ans && (
          <div className="card pad" style={{ background: 'var(--surface)', boxShadow: 'none' }}>
            <div className="faint" style={{ fontSize: 11.5, marginBottom: 6 }}>“{ans.q}”</div>
            <div style={{ fontSize: 13, lineHeight: 1.55 }}>{ans.respuesta}</div>
            {ans.doc && (
              <button className="chip-btn" style={{ marginTop: 10 }} onClick={() => onOpenDoc(ans.doc)}>
                <Icon name="doc" size={12} style={{ marginRight: 5 }} />{ans.doc}
              </button>
            )}
          </div>
        )}
        <div className="row center gap-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11, padding: '4px 4px 4px 12px' }}>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="Pregunta sobre los documentos…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text)', minWidth: 0 }} />
          <button className="btn primary" style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }} onClick={() => ask()}><Icon name="send" size={14} /></button>
        </div>
      </div>
    </div>
  );
}

/* ============ Modal: detalle de documento ============ */
function DocsDetail({ doc, onClose }) {
  const [summarizing, setSummarizing] = React.useState(false);
  if (!doc) return null;
  const t = window.TONE[DOCS_KIND_TONE[doc.kind] || 'blue'];

  async function summarize() {
    if (summarizing) return;
    setSummarizing(true);
    const [ai] = await Promise.all([docsSummaryAI(doc), new Promise(r => setTimeout(r, 1100))]);
    Store.update('docs', doc._id, { summary: ai || docsSummaryFallback(doc), summaryIA: !!ai });
    setSummarizing(false);
    toast('Resumen generado ✓');
  }
  const live = (DB.docs || []).find(d => d._id === doc._id) || doc;

  return (
    <Modal open={!!doc} title="Detalle del documento" onClose={onClose} width={560}
      footer={<>
        <button className="btn" onClick={() => toast('Enlace copiado', 'info')}><Icon name="link" size={14} className="btn-ico" />Compartir</button>
        <button className="btn primary" onClick={() => docsDownload(live)}><Icon name="download" size={14} className="btn-ico" />Descargar</button>
      </>}>
      <div className="row" style={{ gap: 13, alignItems: 'flex-start', marginBottom: 16 }}>
        <div className="insight-ico" style={{ background: t.bg, color: t.c, width: 44, height: 44, borderRadius: 11, flexShrink: 0 }}><Icon name="doc" size={20} /></div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15.5 }}>{live.name}</div>
          <div className="faint" style={{ fontSize: 12.5 }}>{live.kind} · {live.size} · modificado {live.date}</div>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[['Carpeta', live.folder], ['Responsable', live.owner]].map(([k, v]) => (
          <div key={k} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 12px' }}>
            <div className="faint" style={{ fontSize: 11 }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 1 }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Resumen</div>
      {live.summary ? (
        <div style={{ fontSize: 13, lineHeight: 1.6, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '11px 13px' }}>
          {live.summary}
          <div className="row center" style={{ gap: 6, marginTop: 9 }}>
            <Badge tone={live.summaryIA ? 'violet' : 'gray'} dot>{live.summaryIA ? 'Resumen con IA' : 'Resumen de plantilla'}</Badge>
            <button className="chip-btn plain" style={{ fontSize: 11 }} onClick={summarize}>{summarizing ? 'Regenerando…' : 'Regenerar'}</button>
          </div>
        </div>
      ) : summarizing ? (
        <div className="row center" style={{ gap: 9, padding: '12px 2px' }}>
          <span className="ai-orb" style={{ width: 18, height: 18, borderRadius: 6 }}><Icon name="spark" size={10} fill="currentColor" /></span>
          <span style={{ fontSize: 12.5 }}>Leyendo y resumiendo el documento…</span>
        </div>
      ) : (
        <button className="btn" style={{ justifyContent: 'center', width: '100%' }} onClick={summarize}>
          <Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Resumir con IA
        </button>
      )}
    </Modal>
  );
}

/* ============ carpetas (persistidas) ============ */
const DOCS_FOLDERS_KEY = 'piaget_docs_folders_v1';
function docsLoadFolders() {
  try { const v = JSON.parse(localStorage.getItem(DOCS_FOLDERS_KEY) || 'null'); if (Array.isArray(v) && v.length) return v; } catch (e) { }
  return ['Institucional', 'Académico', 'Familias'];
}
function docsSaveFolders(v) { try { localStorage.setItem(DOCS_FOLDERS_KEY, JSON.stringify(v)); } catch (e) { } }

function DocsFolders({ open, onClose, folders, setFolders, activeFolder, setActiveFolder }) {
  const [newName, setNewName] = React.useState('');
  const [renaming, setRenaming] = React.useState(null); // folder name
  const [renameVal, setRenameVal] = React.useState('');
  const countFor = (f) => (DB.docs || []).filter(d => d.folder === f).length;

  function create() {
    const n = newName.trim();
    if (!n) { toast('Escribe el nombre de la carpeta', 'warn'); return; }
    if (folders.some(f => f.toLowerCase() === n.toLowerCase())) { toast('Esa carpeta ya existe', 'warn'); return; }
    setFolders(fs => { const next = [...fs, n]; docsSaveFolders(next); return next; });
    setNewName(''); toast('Carpeta creada ✓');
  }
  function rename(oldName) {
    const n = renameVal.trim();
    if (!n || n === oldName) { setRenaming(null); return; }
    if (folders.some(f => f.toLowerCase() === n.toLowerCase())) { toast('Esa carpeta ya existe', 'warn'); return; }
    (DB.docs || []).filter(d => d.folder === oldName).forEach(d => Store.update('docs', d._id, { folder: n }));
    setFolders(fs => { const next = fs.map(f => f === oldName ? n : f); docsSaveFolders(next); return next; });
    if (activeFolder === oldName) setActiveFolder(n);
    setRenaming(null); toast('Carpeta renombrada ✓');
  }
  function remove(name) {
    if (folders.length <= 1) { toast('Debe existir al menos una carpeta', 'warn'); return; }
    const dest = folders.find(f => f !== name);
    const moved = (DB.docs || []).filter(d => d.folder === name);
    moved.forEach(d => Store.update('docs', d._id, { folder: dest }));
    setFolders(fs => { const next = fs.filter(f => f !== name); docsSaveFolders(next); return next; });
    if (activeFolder === name) setActiveFolder('Todas');
    toast(moved.length ? moved.length + ' documento(s) movidos a ' + dest : 'Carpeta eliminada', moved.length ? 'info' : 'warn');
  }

  return (
    <Modal open={open} title="Administrar carpetas" onClose={onClose} width={480}
      footer={<><span className="faint grow" style={{ fontSize: 11.5 }}>Al eliminar una carpeta, sus documentos se mueven a otra.</span><button className="btn primary" onClick={onClose}>Listo</button></>}>
      <div className="col" style={{ gap: 8, marginBottom: 14 }}>
        {folders.map(f => (
          <div key={f} className="row center" style={{ gap: 9, border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 12px' }}>
            <div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 30, height: 30, flexShrink: 0 }}><Icon name="layers" size={14} /></div>
            {renaming === f ? (
              <input autoFocus className="inp" style={{ height: 32, flex: 1 }} value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') rename(f); if (e.key === 'Escape') setRenaming(null); }} />
            ) : (
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{f}</div>
                <div className="faint" style={{ fontSize: 11.5 }}>{countFor(f)} documento(s)</div>
              </div>
            )}
            {renaming === f ? (
              <button className="btn primary sm" onClick={() => rename(f)}><Icon name="check" size={13} className="btn-ico" />Guardar</button>
            ) : (<>
              <button className="icon-btn" style={{ width: 30, height: 30 }} title="Renombrar" onClick={() => { setRenaming(f); setRenameVal(f); }}><Icon name="edit" size={14} /></button>
              <button className="icon-btn" style={{ width: 30, height: 30, color: 'var(--red)' }} title="Eliminar" onClick={() => remove(f)}><Icon name="trash" size={14} /></button>
            </>)}
          </div>
        ))}
      </div>
      <div className="row center gap-8">
        <input className="inp" style={{ height: 38, flex: 1 }} placeholder="Nueva carpeta…" value={newName}
          onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} />
        <button className="btn primary" onClick={create}><Icon name="plus" size={15} className="btn-ico" />Crear</button>
      </div>
    </Modal>
  );
}

/* ============ Docs (vista principal) ============ */
function Docs({ go }) {
  const store = useStore();
  const [modal, setModal] = React.useState(false);
  const [folder, setFolder] = React.useState('Todas');
  const [search, setSearch] = React.useState('');
  const [detail, setDetail] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', kind: 'PDF', folder: 'Institucional', size: '', dataUrl: null, filename: null });
  const fileRef = React.useRef(null);
  const [folderList, setFolderList] = React.useState(docsLoadFolders);
  const [foldersOpen, setFoldersOpen] = React.useState(false);
  const folders = ['Todas', ...folderList];

  const docs = DB.docs || [];
  const shown = docs.filter(d =>
    (folder === 'Todas' || d.folder === folder) &&
    (!search.trim() || d.name.toLowerCase().includes(search.trim().toLowerCase())));
  const resumidos = docs.filter(d => d.summary).length;

  function takeFile(file) {
    if (!file) return;
    const meta = {
      name: file.name.replace(/\.[^.]+$/, ''),
      kind: docsKindFromName(file.name),
      size: docsFmtSize(file.size),
      filename: file.name,
    };
    if (file.size <= 1500000) {
      const reader = new FileReader();
      reader.onload = () => { setForm(f => ({ ...f, ...meta, dataUrl: reader.result })); toast('Archivo leído: ' + file.name, 'info'); };
      reader.onerror = () => { setForm(f => ({ ...f, ...meta, dataUrl: null })); toast('Archivo leído (solo metadatos)', 'info'); };
      reader.readAsDataURL(file);
    } else {
      setForm(f => ({ ...f, ...meta, dataUrl: null }));
      toast('Archivo grande: se guardan solo metadatos', 'info');
    }
  }
  function save() {
    if (!form.name.trim()) { toast('Escribe el nombre del documento', 'warn'); return; }
    Store.add('docs', { name: form.name.trim(), kind: form.kind, folder: form.folder, size: form.size || '120 KB', owner: DB.user.role, date: 'hoy', dataUrl: form.dataUrl || null, filename: form.filename || null });
    Store.log(DB.user.role, 'subió el documento “' + form.name + '”', 'doc');
    toast('Documento subido ✓');
    setForm({ name: '', kind: 'PDF', folder: 'Institucional', size: '', dataUrl: null, filename: null }); setModal(false);
  }
  const openByName = (name) => { const d = docs.find(x => x.name === name); if (d) setDetail(d); };

  return (
    <div className="content-inner">
      <PageHead eyebrow="Gestión" title="Docs" desc={docs.length + ' documentos · plantillas y archivos compartidos'}>
        <button className="btn primary" onClick={() => setModal(true)}><Icon name="plus" size={15} className="btn-ico" />Subir documento</button>
      </PageHead>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { label: 'Documentos', value: String(docs.length), icon: 'doc', tone: 'blue' },
          { label: 'Carpetas', value: String(new Set(docs.map(d => d.folder)).size), icon: 'layers', tone: 'violet' },
          { label: 'Resumidos con IA', value: String(resumidos), icon: 'spark', tone: 'cyan' },
        ].map((k, i) => {
          const t = window.TONE[k.tone];
          return <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>;
        })}
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <CardHead icon="doc" title="Biblioteca de documentos" sub="Archivos del colegio"
            right={<div className="row center" style={{ gap: 8 }}>
              <div className="seg">{folders.map(f => <button key={f} className={folder === f ? 'active' : ''} onClick={() => setFolder(f)}>{f}</button>)}</div>
              <button className="icon-btn" style={{ width: 32, height: 32 }} title="Administrar carpetas" onClick={() => setFoldersOpen(true)}><Icon name="settings" size={16} /></button>
            </div>} />
          <div style={{ padding: '10px 16px 0' }}>
            <div className="row center gap-8" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 12px', height: 36 }}>
              <Icon name="search" size={15} className="faint" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar documento…"
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text)' }} />
              {search && <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={() => setSearch('')}><Icon name="x" size={13} /></button>}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Documento</th><th>Carpeta</th><th>Tamaño</th><th>Modificado</th><th></th></tr></thead>
              <tbody>
                {shown.map((d) => {
                  const t = window.TONE[DOCS_KIND_TONE[d.kind] || 'blue'];
                  return (
                    <tr key={d._id} style={{ cursor: 'pointer' }} onClick={() => setDetail(d)}>
                      <td><div className="person"><div className="insight-ico" style={{ background: t.bg, color: t.c, width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}><Icon name="doc" size={15} /></div><div style={{ minWidth: 0 }}><div className="pname row center" style={{ gap: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 210 }}>{d.name}{d.summary && <Icon name="spark" size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} fill="currentColor" />}</div><div className="pmeta">{d.kind} · {d.owner}</div></div></div></td>
                      <td><Badge tone="gray">{d.folder}</Badge></td>
                      <td className="muted font-mono" style={{ fontSize: 12.5 }}>{d.size}</td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{d.date}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <RowMenu items={[
                          { icon: 'eye', label: 'Ver detalle', onClick: () => setDetail(d) },
                          { icon: 'download', label: 'Descargar', onClick: () => docsDownload(d) },
                          { icon: 'link', label: 'Compartir', onClick: () => toast('Enlace copiado', 'info') },
                          { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => { Store.remove('docs', d._id); toast('Documento eliminado', 'warn'); } },
                        ]} />
                      </td>
                    </tr>
                  );
                })}
                {!shown.length && <tr><td colSpan={5} className="faint" style={{ textAlign: 'center', padding: 24 }}>Sin documentos que coincidan.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <DocsAsk onOpenDoc={openByName} />
      </div>

      {/* Modal: subir */}
      <Modal open={modal} onClose={() => setModal(false)} title="Subir documento"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="check" size={15} className="btn-ico" />Subir</button></>}>
        <div
          onClick={() => fileRef.current && fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); takeFile(e.dataTransfer.files && e.dataTransfer.files[0]); }}
          style={{
            height: 92, marginBottom: 14, borderRadius: 'var(--r-sm)', cursor: 'pointer',
            border: '1.5px dashed ' + (dragOver ? 'var(--accent)' : 'var(--border-strong)'),
            background: dragOver ? 'var(--accent-soft)' : 'var(--surface-2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'background 0.15s, border-color 0.15s',
          }}>
          <Icon name="download" size={19} className="faint" style={{ transform: 'rotate(180deg)' }} />
          <span className="faint" style={{ fontSize: 12.5 }}>{form.size ? form.name + ' · ' + form.size : 'Arrastra un archivo o haz clic para elegirlo'}</span>
        </div>
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => takeFile(e.target.files && e.target.files[0])} />
        <Field label="Nombre del documento"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="p.ej. Reglamento 2026" /></Field>
        <div className="field-row">
          <Field label="Tipo"><SelectInput value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })} options={['PDF', 'DOC', 'XLS', 'IMG']} /></Field>
          <Field label="Carpeta"><SelectInput value={folderList.includes(form.folder) ? form.folder : folderList[0]} onChange={e => setForm({ ...form, folder: e.target.value })} options={folderList} /></Field>
        </div>
      </Modal>

      <DocsDetail doc={detail} onClose={() => setDetail(null)} />
      <DocsFolders open={foldersOpen} onClose={() => setFoldersOpen(false)} folders={folderList} setFolders={setFolderList} activeFolder={folder} setActiveFolder={setFolder} />
    </div>
  );
}

window.DocsFiles = { buildPDF: docsBuildPDF, trigger: docsTriggerDownload, wrap: docsWrap };
Object.assign(window, { Docs });
