/* student_credential_directivo_style_patch.jsx — credencial estudiante con el mismo formato que Directivos */
(function () {
  function stInitials(name) {
    return String(name || 'E').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
  }
  function stPayload(s) {
    return {
      type: 'student',
      id: s._id || '',
      matricula: s.matricula || '',
      name: s.name || s.email || 'Estudiante',
      email: s.email || '',
      role: 'Estudiante',
      grade: s.grade || s.group || '',
      nivel: s.nivel || '',
      status: 'Activo',
      institution: 'PIAGET',
      v: 5
    };
  }
  function stMakeQR(payload) {
    try {
      if (!window.qrcode) return '';
      const q = window.qrcode(0, 'M');
      q.addData(JSON.stringify(payload));
      q.make();
      return q.createSvgTag(5, 2);
    } catch (_) { return ''; }
  }
  function stEnsurePrintStyles() {
    if (document.getElementById('piaget-student-cred-directivo-print')) return;
    const style = document.createElement('style');
    style.id = 'piaget-student-cred-directivo-print';
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
        .student-cred-side, .student-cred-actions { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }
  function StudentCredentialCard({ student }) {
    React.useEffect(() => { stEnsurePrintStyles(); }, []);
    const payload = stPayload(student || {});
    const svg = React.useMemo(() => stMakeQR(payload), [student && student._id, student && student.email, student && student.matricula, student && student.grade]);
    const t = window.TONE && window.TONE.violet ? window.TONE.violet : (window.TONE && window.TONE.blue ? window.TONE.blue : { c: 'var(--accent)', bg: 'var(--accent-soft)' });
    const photo = student && student.photo;
    return <div className="card cred-print" style={{ width: 330, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ padding: 18, background: 'linear-gradient(135deg, var(--surface), var(--surface-2))', borderBottom: '1px solid var(--border)' }}>
        <div className="row between center">
          <div>
            <div className="eyebrow">Credencial de acceso</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>PIAGET</div>
          </div>
          <Badge tone="green" dot>Activa</Badge>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        <div className="row center gap-12" style={{ marginBottom: 16 }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, display: 'grid', placeItems: 'center', color: t.c, background: t.bg, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, overflow: 'hidden', flexShrink: 0 }}>
            {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : stInitials(student && student.name || student && student.email)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>{student && student.name || 'Estudiante'}</div>
            <div className="faint" style={{ fontSize: 12.5, marginTop: 3, overflowWrap: 'anywhere' }}>{student && student.email || '—'}</div>
            <div style={{ marginTop: 7 }}><Badge tone="violet">Estudiante</Badge></div>
          </div>
        </div>
        <div style={{ display: 'grid', placeItems: 'center', background: '#fff', borderRadius: 18, padding: 14, border: '1px solid var(--border)' }}>
          {svg ? <div style={{ width: 210, height: 210, display: 'grid', placeItems: 'center' }} dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="faint" style={{ height: 210, display: 'grid', placeItems: 'center' }}>QR no disponible</div>}
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
          <div className="kv"><span className="k">Matrícula</span><span className="v font-mono" style={{ fontSize: 10.5 }}>{student && student.matricula || '—'}</span></div>
          <div className="kv"><span className="k">Tipo</span><span className="v">Estudiante</span></div>
          <div className="kv"><span className="k">Nivel</span><span className="v">{student && student.nivel || '—'}</span></div>
          <div className="kv"><span className="k">Grupo</span><span className="v">{student && (student.grade || student.group) || '—'}</span></div>
        </div>
        <div className="faint" style={{ fontSize: 11.5, marginTop: 12, textAlign: 'center' }}>Este QR registra entrada en Control de Accesos.</div>
      </div>
    </div>;
  }
  function StudentCredentialModal({ student, onClose }) {
    const payload = stPayload(student || {});
    const copyPayload = async () => {
      try { await navigator.clipboard.writeText(JSON.stringify(payload)); toast('Contenido QR copiado', 'ok'); }
      catch (_) { toast('No se pudo copiar', 'warn'); }
    };
    return <Modal open width={760} onClose={onClose} title="Credencial de acceso"
      footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn" onClick={copyPayload}><Icon name="copy" size={15} className="btn-ico" />Copiar QR</button><button className="btn primary" onClick={() => { stEnsurePrintStyles(); window.print(); }}><Icon name="download" size={15} className="btn-ico" />Imprimir</button></>}>
      <div className="row" style={{ gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <StudentCredentialCard student={student || {}} />
        <div className="card pad student-cred-side" style={{ flex: 1, minWidth: 260 }}>
          <div className="card-title" style={{ marginBottom: 10 }}><Icon name="shield" size={17} className="ico" />Uso de la credencial</div>
          {[
            ['Mostrar QR', 'El estudiante presenta esta credencial en el acceso.'],
            ['Escanear', 'El módulo Scanner QR lee el código con cámara.'],
            ['Registrar', 'La entrada queda guardada y aparece en Control de Accesos.'],
          ].map((p, i) => <div className="row" key={i} style={{ gap: 12, padding: '11px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}><div className="kpi-ico" style={{ width: 28, height: 28, margin: 0, background: 'var(--accent-soft)', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{i + 1}</div><div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{p[0]}</div><div className="faint" style={{ fontSize: 12.5 }}>{p[1]}</div></div></div>)}
          <div className="ai-panel" style={{ marginTop: 14 }}><div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}><div className="insight-ico" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon name="alert" size={16} /></div><div className="insight-body"><div className="insight-title">Importante</div><div className="insight-text">Esta credencial usa el mismo formato de impresión que Directivos para evitar cortes o deformaciones.</div></div></div></div>
        </div>
      </div>
    </Modal>;
  }
  function renderCredential(student) {
    let rootEl = document.getElementById('piaget-student-credential-root');
    if (!rootEl) {
      rootEl = document.createElement('div');
      rootEl.id = 'piaget-student-credential-root';
      document.body.appendChild(rootEl);
    }
    if (!window.__piagetStudentCredentialRoot) window.__piagetStudentCredentialRoot = ReactDOM.createRoot(rootEl);
    const close = () => window.__piagetStudentCredentialRoot.render(null);
    window.__piagetStudentCredentialRoot.render(<StudentCredentialModal student={student || {}} onClose={close} />);
  }
  window.estPrintCredential = renderCredential;
  window.StudentCredentialCard = StudentCredentialCard;
  window.StudentCredentialModal = StudentCredentialModal;
})();