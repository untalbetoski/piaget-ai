/* views_student.jsx — Experiencia del ESTUDIANTE (rol con sesión Estudiante)
   Home informativo, credencial con QR e historial de accesos personal.
   La navegación restringida se arma en nav_config.jsx (STUDENT_NAV). */

function stuHash(s) { let h = 0; for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991; return h; }

const STU_MATERIAS = {
  Preescolar: ['Lenguaje y Comunicación', 'Pensamiento Matemático', 'Exploración del Mundo', 'Artes', 'Educación Física', 'Educación Socioemocional'],
  Primaria: ['Español', 'Matemáticas', 'Ciencias Naturales', 'Historia', 'Geografía', 'Inglés', 'Educación Física', 'Artes'],
  Secundaria: ['Español', 'Matemáticas', 'Ciencias', 'Historia', 'Geografía', 'Inglés', 'Formación Cívica y Ética', 'Educación Física', 'Tecnología'],
};
const STU_DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

function stuTeacherFor(nivel, materia, seed) {
  try {
    const roster = window.docBuildRoster ? docBuildRoster() : [];
    const pool = roster.filter(d => (d.niveles || []).includes(nivel) && (d.materias || []).some(m => m === materia)) ;
    const list = pool.length ? pool : roster.filter(d => (d.niveles || []).includes(nivel));
    if (list.length) { const d = list[stuHash(materia + seed) % list.length]; return (d.titulo ? d.titulo + ' ' : 'Mtro(a). ') + d.name; }
  } catch (e) { }
  return 'Mtro(a). Asignado';
}
function stuGrade(base, materia, seed) {
  const b = base != null ? base : 8.6;
  const v = ((stuHash(materia + seed) % 13) - 6) / 10;
  return Math.max(6, Math.min(10, b + v)).toFixed(1);
}
function stuGradeTone(g) { g = parseFloat(g); return g >= 9 ? 'green' : g >= 7.5 ? 'blue' : g >= 6 ? 'amber' : 'red'; }

/* ============ HOME del estudiante ============ */
function StudentHome({ go }) {
  useStore();
  const me = (window.piagetStudent && window.piagetStudent()) || { name: 'Estudiante', grade: '', nivel: 'Primaria', avg: 8.6, att: 96 };
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const firstName = me.name.split(' ')[0];
  const materias = STU_MATERIAS[me.nivel] || STU_MATERIAS.Primaria;
  const grades = materias.map(m => ({ materia: m, teacher: stuTeacherFor(me.nivel, m, me.name) }));
  const prom = me.avg != null ? Number(me.avg).toFixed(1) : '—';
  const comunicados = ((window.DB && DB.announcements) || []).filter(a => a.status === 'publicado').slice(0, 4);

  return (
    <div className="content-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 7 }}>{me.nivel} · {me.grade}</div>
          <h1 className="page-title">Hola, {firstName}</h1>
          <p className="page-desc">Este es tu resumen de hoy, {today}.</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => go('mi-credencial')}><Icon name="user" size={15} className="btn-ico" />Mi credencial</button>
        </div>
      </div>

      {/* KPIs personales */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { label: 'Mi promedio', value: prom, icon: 'award', tone: 'violet' },
          { label: 'Mi asistencia', value: me.att != null ? me.att + '%' : '—', icon: 'checkCircle', tone: 'green' },
          { label: 'Mis materias', value: String(materias.length), icon: 'book', tone: 'blue' },
        ].map((k, i) => { const t = window.TONE[k.tone]; return (
          <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>
        ); })}
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        {/* Mis calificaciones */}
        <div className="card">
          <CardHead icon="award" title="Mis calificaciones" sub={'Promedio general ' + prom}
            right={<button className="btn sm" onClick={() => go('clases')}><Icon name="cap" size={13} className="btn-ico" />Mis clases</button>} />
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Materia</th><th>Docente</th><th className="num">Calif.</th></tr></thead>
              <tbody>
                {grades.map((g, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{g.materia}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{g.teacher}</td>
                    <td className="num"><Badge tone="gray" dot>Pendiente</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comunicación informativa */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <CardHead icon="megaphone" title="Comunicación" sub="Avisos de la escuela"
            right={<button className="btn sm ghost" onClick={() => go('comunicados')}>Ver todos</button>} />
          <div>
            {comunicados.length ? comunicados.map((c, i) => (
              <div className="lrow" key={i} style={{ alignItems: 'flex-start' }}>
                <div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 32, height: 32, flexShrink: 0 }}><Icon name="megaphone" size={15} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.title}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{c.audience} · {c.time}</div>
                </div>
              </div>
            )) : <div className="faint" style={{ padding: 20, fontSize: 13 }}>Sin avisos recientes.</div>}
          </div>
          <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
            <button className="btn sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => go('mensajeria-app')}><Icon name="message" size={13} className="btn-ico" />Escribir a un docente</button>
          </div>
        </div>
      </div>

      {/* Mis clases (horario) */}
      <div className="card mt-16">
        <CardHead icon="cap" title="Mis clases" sub={me.grade + ' · ' + me.nivel}
          right={<button className="btn sm" onClick={() => go('atlas')}><Icon name="map" size={13} className="btn-ico" />Ver en Atlas</button>} />
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12, padding: 16 }}>
          {grades.map((g, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{g.materia}</div>
              <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{g.teacher}</div>
              <div className="row center gap-6" style={{ marginTop: 10 }}>
                <Icon name="clock" size={13} className="faint" />
                <span className="font-mono faint" style={{ fontSize: 11.5 }}>{STU_DIAS[stuHash(g.materia) % 5]} · {7 + (stuHash(g.materia + 'h') % 6)}:30</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mi asistencia */}
      <div className="card mt-16 pad">
        <div className="row between center" style={{ marginBottom: 12 }}>
          <div className="card-title"><Icon name="checkCircle" size={17} className="ico" />Mi asistencia</div>
          <button className="btn sm ghost" onClick={() => go('clases')}>Detalle</button>
        </div>
        <div className="row center gap-16">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em' }}>{me.att != null ? me.att + '%' : '—'}</div>
          <div className="grow">
            <div className="bar-track" style={{ height: 10 }}><div className="bar-fill" style={{ width: (me.att || 0) + '%', background: me.att >= 90 ? 'var(--green)' : me.att >= 80 ? 'var(--amber)' : 'var(--red)' }} /></div>
            <div className="faint" style={{ fontSize: 12.5, marginTop: 8 }}>{me.att != null ? 'Asistencia acumulada del ciclo. Mantén arriba del 90% para no afectar tu evaluación.' : 'Aún no hay asistencia registrada en este ciclo.'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Mi credencial (QR) ============ */
function StudentCredencial({ go }) {
  const me = (window.piagetStudent && window.piagetStudent()) || { name: 'Estudiante', grade: '', matricula: '', curp: '' };
  return (
    <div className="content-inner">
      <PageHead eyebrow="Mi acceso" title="Mi credencial" desc="Muestra este código QR en el acceso si no tienes tu credencial impresa." />
      <div className="row" style={{ gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 320 }}>
          {window.CredencialCard ? <CredencialCard s={me} /> : <div className="ph" style={{ height: 200 }}>Credencial</div>}
        </div>
        <div className="card pad" style={{ flex: 1, minWidth: 260, maxWidth: 420 }}>
          <div className="card-title" style={{ marginBottom: 10 }}><Icon name="shield" size={17} className="ico" />¿Cómo usarla?</div>
          {[
            ['Llega al acceso', 'Dirígete a la puerta principal o de personal.'],
            ['Muestra tu QR', 'Presenta este código al lector o al personal de recepción.'],
            ['Listo', 'Tu entrada queda registrada en tu historial de accesos.'],
          ].map((p, i) => (
            <div className="row" key={i} style={{ gap: 12, padding: '11px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div className="kpi-ico" style={{ width: 28, height: 28, margin: 0, background: 'var(--accent-soft)', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{i + 1}</div>
              <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{p[0]}</div><div className="faint" style={{ fontSize: 12.5 }}>{p[1]}</div></div>
            </div>
          ))}
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={() => window.print()}><Icon name="download" size={15} className="btn-ico" />Imprimir credencial</button>
          <button className="btn ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => go('historial-accesos')}><Icon name="history" size={15} className="btn-ico" />Ver mi historial de accesos</button>
        </div>
      </div>
    </div>
  );
}

/* ============ Mi historial de accesos ============ */
function StudentHistorial({ go }) {
  useStore();
  const me = (window.piagetStudent && window.piagetStudent()) || { name: 'Estudiante', grade: '' };
  /* Registros reales de acceso del alumno (entradas/salidas capturadas en Control de Accesos). */
  const myLog = ((window.DB && DB.accessHistory) || []).filter(a => a.name === me.name);
  const dirBadge = (dir) => dir === 'in'
    ? <Badge tone="green" dot>Entrada</Badge>
    : <Badge tone="gray" dot>Salida</Badge>;

  return (
    <div className="content-inner">
      <PageHead eyebrow="Mi acceso" title="Historial de accesos" desc="Tus entradas y salidas registradas en el campus.">
        <button className="btn" onClick={() => go('mi-credencial')}><Icon name="user" size={15} className="btn-ico" />Mi credencial</button>
      </PageHead>
      <div className="card">
        <CardHead icon="history" title="Mis registros" sub={me.name + ' · ' + me.grade} />
        {myLog.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Día</th><th>Puerta</th><th>Método</th><th>Hora</th><th>Movimiento</th></tr></thead>
              <tbody>
                {myLog.map((a, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{a.day}</td>
                    <td className="muted">{a.gate}</td>
                    <td><span className="font-mono faint" style={{ fontSize: 12.5 }}>{a.method}</span></td>
                    <td className="font-mono" style={{ fontSize: 12.5 }}>{a.time}</td>
                    <td>{dirBadge(a.dir)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="col center" style={{ gap: 8, padding: '40px 20px', textAlign: 'center' }}>
            <div className="kpi-ico" style={{ width: 44, height: 44, margin: 0, background: 'var(--surface-3)', color: 'var(--text-muted)' }}><Icon name="history" size={20} /></div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Aún no tienes registros de acceso</div>
            <div className="faint" style={{ fontSize: 12.5, maxWidth: 360 }}>Cuando entres o salgas del campus con tu credencial o código QR, tus movimientos aparecerán aquí.</div>
            <button className="btn sm" style={{ marginTop: 4 }} onClick={() => go('mi-credencial')}><Icon name="user" size={13} className="btn-ico" />Ver mi credencial</button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { StudentHome, StudentCredencial, StudentHistorial });

/* ====== Helpers de scope del estudiante ====== */
function stuNivelOfGroup(g) { g = String(g || ''); return /sec/i.test(g) ? 'Secundaria' : /^\s*k/i.test(g) ? 'Preescolar' : 'Primaria'; }
function stuRetoVisible(me, r) {
  const sc = String(r.scope || '');
  if (/toda la escuela/i.test(sc) || /^escuela/i.test(sc)) return true;
  if (/todos mis grupos/i.test(sc)) {
    if (!Array.isArray(r.groups) || !r.groups.length) return true;
    return r.groups.includes(me.grade) || r.groups.some(g => stuNivelOfGroup(g) === me.nivel);
  }
  if (['Preescolar', 'Primaria alta', 'Primaria', 'Secundaria'].includes(sc)) return new RegExp(me.nivel, 'i').test(sc);
  if (Array.isArray(r.groups) && r.groups.includes(me.grade)) return true;
  return sc === me.grade;
}
function stuGrado(me) { const num = ((me.grade || '').match(/\d/) || ['1'])[0]; return me.nivel === 'Preescolar' ? 'K' + num : num + '°'; }
function stuMyMissions(me) {
  const all = (window.DB && DB.missions) || [];
  let mine = all.filter(m => (m.groups || []).includes(me.grade));
  if (!mine.length) mine = all.filter(m => (m.groups || []).some(g => stuNivelOfGroup(g) === me.nivel));
  return mine;
}

/* ============ MIS MISIONES (asignadas al estudiante) ============ */
function StudentMisiones({ go }) {
  useStore();
  const me = (window.piagetStudent && window.piagetStudent()) || { name: 'Estudiante', grade: '', nivel: 'Primaria', user: '' };
  const mine = stuMyMissions(me);
  const activas = mine.filter(m => m.status === 'activa' || m.status === 'pausada');
  const hechas = mine.filter(m => m.status === 'finalizada');
  const KEY = 'piaget_stu_missions_' + (me.user || me.name);
  const [done, setDone] = React.useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } });
  const toggle = (mid, i) => setDone(d => { const set = new Set(d[mid] || []); set.has(i) ? set.delete(i) : set.add(i); const nd = { ...d, [mid]: [...set] }; try { localStorage.setItem(KEY, JSON.stringify(nd)); } catch (e) { } return nd; });

  /* Respuestas del alumno a las actividades resolubles (persistidas) */
  const AKEY = 'piaget_stu_mission_ans_' + (me.user || me.name);
  const [ans, setAns] = React.useState(() => { try { return JSON.parse(localStorage.getItem(AKEY) || '{}'); } catch (e) { return {}; } });
  const [submitted, setSubmitted] = React.useState(() => { try { return JSON.parse(localStorage.getItem(AKEY + '_done') || '{}'); } catch (e) { return {}; } });
  const setAnswer = (mid, i, v) => setAns(a => { const m = { ...(a[mid] || {}), [i]: v }; const na = { ...a, [mid]: m }; try { localStorage.setItem(AKEY, JSON.stringify(na)); } catch (e) { } return na; });
  const submitMission = (m) => {
    const mid = m._id;
    setSubmitted(s => { const ns = { ...s, [mid]: true }; try { localStorage.setItem(AKEY + '_done', JSON.stringify(ns)); } catch (e) { } return ns; });
    /* Persistir la entrega y su calificación en el Store compartido para que el docente la vea */
    try {
      if (!window.Store) return;
      const a = ans[mid] || {};
      const tasks = m.tasks || [];
      const choices = tasks.filter(tk => tk.type === 'choice' && tk.answer != null);
      const aciertos = choices.filter(tk => Number(a[tasks.indexOf(tk)]) === tk.answer).length;
      const grade = choices.length ? Math.round((aciertos / choices.length) * 100) / 10 : null;
      const answers = tasks.map((tk, i) => ({
        q: tk.q, type: tk.type, value: a[i] != null ? a[i] : '',
        correct: tk.type === 'choice' && tk.answer != null ? Number(a[i]) === tk.answer : null,
      }));
      const rec = {
        missionId: mid, missionTitle: m.title, subject: m.subject,
        student: me.name, group: me.grade, user: me.user || me.name,
        aciertos, totalChoice: choices.length, totalTasks: tasks.length,
        grade, status: grade == null ? 'por_calificar' : 'calificada', answers,
        submittedAt: Date.now(),
        fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      };
      const existing = (window.DB.missionSubmissions || []).find(x => x.missionId === mid && x.user === rec.user);
      if (existing) Store.update('missionSubmissions', existing._id, rec);
      else Store.add('missionSubmissions', rec);
      if (Store.log) Store.log(me.name.split(' ')[0], 'entregó la misión "' + m.title + '"', 'send');
    } catch (e) { }
  };

  const hasTasks = (m) => Array.isArray(m.tasks) && m.tasks.length > 0;
  const answeredCount = (m) => { const a = ans[m._id] || {}; return (m.tasks || []).filter((_, i) => a[i] != null && String(a[i]).trim() !== '').length; };
  const myProg = (m) => hasTasks(m)
    ? (submitted[m._id] ? 100 : Math.round(answeredCount(m) / Math.max(1, (m.tasks || []).length) * 100))
    : Math.round(((done[m._id] || []).length / Math.max(1, (m.steps || []).length)) * 100);
  const xpPorGanar = activas.reduce((a, m) => a + (myProg(m) < 100 ? (m.xp || 0) : 0), 0);

  const Card = ({ m }) => {
    const t = window.TONE[m.tone] || window.TONE.violet;
    const p = myProg(m); const fin = m.status === 'finalizada';
    return (
      <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 13, opacity: fin ? 0.85 : 1 }}>
        <div className="row between center">
          <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={m.icon} size={20} /></div>
          <div className="row center gap-6">
            {fin ? <Badge tone="gray" dot>Completada</Badge> : (p === 100 ? <Badge tone="green" dot>¡Lista!</Badge> : <Badge tone="violet">En curso</Badge>)}
            <Badge tone="amber"><Icon name="zap" size={12} fill="currentColor" />{m.xp} XP</Badge>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{m.title}</div>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>{m.subject}{m.dueDays != null && !fin ? ' · ' + (m.dueDays <= 0 ? 'vence hoy' : 'vence en ' + m.dueDays + ' días') : ''}</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{m.desc}</div>
        {hasTasks(m) && m.intro && (
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>{m.intro}</div>
        )}
        <div>
          <div className="row between center" style={{ marginBottom: 6, fontSize: 12 }}>
            <span className="faint">Mi avance</span><span className="tnum" style={{ fontWeight: 600 }}>{p}%</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: p + '%' }} /></div>
        </div>
        {hasTasks(m) ? (() => {
          const sub = !!submitted[m._id] || fin;
          const a = ans[m._id] || {};
          return (
            <>
              <div className="card-title" style={{ fontSize: 13.5, marginTop: 2 }}><Icon name="flag" className="ico" size={15} />Resuelve la misión</div>
              <div className="col gap-12">
                {m.tasks.map((task, i) => {
                  const val = a[i];
                  const correct = task.type === 'choice' && task.answer != null && Number(val) === task.answer;
                  return (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '11px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{i + 1}. {task.q}</div>
                      {task.type === 'choice' ? (
                        <div className="col gap-6">
                          {task.options.map((opt, oi) => {
                            const chosen = Number(val) === oi;
                            const showRight = sub && task.answer === oi;
                            const showWrong = sub && chosen && task.answer != null && task.answer !== oi;
                            return (
                              <button key={oi} type="button" disabled={sub} onClick={() => setAnswer(m._id, i, oi)} className="row center gap-9"
                                style={{ width: '100%', textAlign: 'left', border: '1.5px solid ' + (showRight ? 'var(--green)' : showWrong ? 'var(--red)' : chosen ? 'var(--accent)' : 'var(--border)'), background: showRight ? 'var(--green-soft)' : showWrong ? 'var(--red-soft)' : chosen ? 'var(--accent-soft)' : 'transparent', borderRadius: 'var(--r-sm)', padding: '7px 10px', cursor: sub ? 'default' : 'pointer' }}>
                                <span style={{ width: 16, height: 16, borderRadius: 999, flexShrink: 0, border: '1.5px solid ' + (chosen ? 'var(--accent)' : 'var(--border-strong)'), background: chosen ? 'var(--accent)' : 'transparent' }} />
                                <span style={{ fontSize: 13 }}>{opt}</span>
                                {showRight && <Icon name="check" size={14} style={{ marginLeft: 'auto', color: 'var(--green)' }} />}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <textarea className="inp" rows={2} disabled={sub} value={val || ''} placeholder="Escribe tu respuesta…"
                          onChange={e => setAnswer(m._id, i, e.target.value)}
                          style={{ width: '100%', height: 'auto', padding: '8px 10px', resize: 'vertical', fontSize: 13 }} />
                      )}
                      {sub && task.hint && <div className="faint" style={{ fontSize: 11.5, marginTop: 6 }}><b>Pista:</b> {task.hint}</div>}
                      {sub && task.type === 'choice' && task.answer != null && (
                        <div style={{ fontSize: 11.5, marginTop: 6, color: correct ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{correct ? '¡Correcto!' : 'Respuesta correcta: ' + task.options[task.answer]}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              {!sub ? (
                <button className="btn primary" style={{ justifyContent: 'center' }} disabled={answeredCount(m) < m.tasks.length}
                  onClick={() => submitMission(m)}>
                  <Icon name="send" size={15} className="btn-ico" />Entregar misión{answeredCount(m) < m.tasks.length ? ' (' + answeredCount(m) + '/' + m.tasks.length + ')' : ''}
                </button>
              ) : (() => {
                const choices = m.tasks.filter(tk => tk.type === 'choice' && tk.answer != null);
                const aciertos = choices.filter((tk, idx) => Number((ans[m._id] || {})[m.tasks.indexOf(tk)]) === tk.answer).length;
                return (
                  <div className="row center gap-8" style={{ background: 'var(--green-soft)', color: 'var(--green)', borderRadius: 'var(--r-sm)', padding: '9px 12px', fontSize: 12.5, fontWeight: 600 }}>
                    <Icon name="checkCircle" size={15} />Misión entregada{choices.length ? ' · ' + aciertos + '/' + choices.length + ' aciertos' : ''}
                  </div>
                );
              })()}
            </>
          );
        })() : (
          <>
            <div className="card-title" style={{ fontSize: 13.5, marginTop: 2 }}><Icon name="flag" className="ico" size={15} />Retos</div>
            <div className="col gap-6">
              {(m.steps || []).map((s, i) => {
                const ck = (done[m._id] || []).includes(i);
                return (
                  <button key={i} type="button" disabled={fin} onClick={() => toggle(m._id, i)} className="row center gap-9"
                    style={{ width: '100%', textAlign: 'left', border: '1px solid var(--border)', background: ck ? 'var(--accent-soft)' : 'transparent', borderRadius: 'var(--r-sm)', padding: '8px 10px', cursor: fin ? 'default' : 'pointer' }}>
                    <span style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, display: 'grid', placeItems: 'center', border: ck ? 'none' : '1.5px solid var(--border-strong)', background: ck ? 'var(--accent)' : 'transparent', color: '#fff' }}>{ck && <Icon name="check" size={12} />}</span>
                    <span style={{ fontSize: 13, textDecoration: ck ? 'line-through' : 'none', color: ck ? 'var(--text-faint)' : 'var(--text)' }}>{s}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="content-inner">
      <PageHead eyebrow="Mi espacio" title="Mis Misiones" desc="Retos de aprendizaje asignados a tu grupo. ¡Complétalos para ganar XP!" />
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { label: 'Misiones asignadas', value: String(mine.length), icon: 'rocket', tone: 'violet' },
          { label: 'Activas por trabajar', value: String(activas.length), icon: 'flag', tone: 'blue' },
          { label: 'XP por ganar', value: xpPorGanar.toLocaleString('es-MX'), icon: 'zap', tone: 'amber' },
        ].map((k, i) => { const t = window.TONE[k.tone]; return (
          <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>
        ); })}
      </div>

      {activas.length ? (
        <div className="grid mt-16" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {activas.map(m => <Card key={m._id} m={m} />)}
        </div>
      ) : (
        <div className="card pad mt-16 col center" style={{ alignItems: 'center', gap: 8, padding: 40 }}>
          <Icon name="rocket" size={28} className="faint" />
          <div style={{ fontWeight: 600 }}>Aún no tienes misiones asignadas</div>
          <div className="faint" style={{ fontSize: 13 }}>Cuando tu docente publique una misión para tu grupo aparecerá aquí.</div>
        </div>
      )}

      {hechas.length > 0 && <>
        <div className="eyebrow" style={{ margin: '26px 0 12px' }}>Completadas</div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {hechas.map(m => <Card key={m._id} m={m} />)}
        </div>
      </>}
    </div>
  );
}

/* ============ MIS CLASES ============ */
function StudentClases({ go }) {
  useStore();
  const me = (window.piagetStudent && window.piagetStudent()) || { name: 'Estudiante', grade: '', nivel: 'Primaria', att: 96 };
  const grupo = ((window.DB && DB.clases) || window.CLASES_SEED || []).find(c => c.g === me.grade);
  const materias = STU_MATERIAS[me.nivel] || STU_MATERIAS.Primaria;
  const clases = materias.map(m => ({ materia: m, teacher: stuTeacherFor(me.nivel, m, me.name), dia: STU_DIAS[stuHash(m) % 5], hora: (7 + (stuHash(m + 'h') % 6)) + ':30' }));
  return (
    <div className="content-inner">
      <PageHead eyebrow="Mi espacio" title="Mis Clases" desc={me.grade + ' · ' + me.nivel}>
        <button className="btn" onClick={() => go('atlas')}><Icon name="map" size={15} className="btn-ico" />Ver Atlas</button>
      </PageHead>

      {grupo && <div className="card pad" style={{ marginBottom: 16 }}>
        <div className="row center gap-16 wrap">
          <div className="kpi-ico" style={{ width: 46, height: 46, margin: 0, background: 'var(--accent-soft)', color: 'var(--accent)' }}><Icon name="cap" size={22} /></div>
          <div className="grow"><div style={{ fontWeight: 700, fontSize: 16 }}>Grupo {grupo.g}</div><div className="faint" style={{ fontSize: 13 }}>Titular: {grupo.titular} · Salón {grupo.salon}</div></div>
          <div style={{ textAlign: 'right' }}><div className="faint" style={{ fontSize: 11.5 }}>Mi asistencia</div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22 }}>{me.att != null ? me.att + '%' : '—'}</div></div>
        </div>
      </div>}

      <div className="card">
        <CardHead icon="bookOpen" title="Mis materias" sub={materias.length + ' asignaturas'} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Materia</th><th>Docente</th><th>Horario</th><th className="num">Mi calif.</th></tr></thead>
            <tbody>
              {clases.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{c.materia}</td>
                  <td className="muted" style={{ fontSize: 13 }}>{c.teacher}</td>
                  <td className="font-mono faint" style={{ fontSize: 12.5 }}>{c.dia} · {c.hora}</td>
                  <td className="num"><Badge tone="gray" dot>Pendiente</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============ MI ATLAS (currículo de mi grado) ============ */
function StudentAtlas({ go }) {
  useStore();
  const me = (window.piagetStudent && window.piagetStudent()) || { name: 'Estudiante', grade: '', nivel: 'Primaria' };
  const nivel = me.nivel;
  const grado = stuGrado(me);
  const curriculum = (window.ATLAS_CURRICULUM && window.ATLAS_CURRICULUM[nivel]) || [];
  const subjects = curriculum.flatMap(c => c.subjects.map(s => ({ ...s, campo: c.campo })));
  const fase = (window.ATLAS_FASES && ATLAS_FASES[nivel] && ATLAS_FASES[nivel][grado]) || '';

  return (
    <div className="content-inner">
      <PageHead eyebrow={'Atlas · ' + nivel + ' ' + grado} title="Mi mapa curricular" desc={'Lo que estás viendo este ciclo en ' + me.grade + (fase ? ' · ' + fase : '') + '.'} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {subjects.map((subj, i) => {
          const prog = window.atlasProgress ? atlasProgress(nivel, grado, subj) : null;
          const t = window.TONE[subj.tone] || window.TONE.blue;
          return (
            <div className="card" key={i}>
              <div className="row center gap-10" style={{ padding: '15px 18px 10px' }}>
                <div className="kpi-ico" style={{ width: 34, height: 34, margin: 0, background: t.bg, color: t.c }}><Icon name={subj.icon || 'book'} size={17} /></div>
                <div className="grow" style={{ minWidth: 0 }}><div style={{ fontWeight: 600 }}>{subj.name}</div><div className="faint" style={{ fontSize: 11.5 }}>{subj.campo}</div></div>
              </div>
              {prog && <div style={{ padding: '0 18px 14px' }}>
                {prog.current && <div className="row center gap-8" style={{ padding: '9px 11px', borderRadius: 'var(--r-sm)', background: 'var(--accent-soft)', marginBottom: 10 }}>
                  <Icon name="pin" size={14} style={{ color: 'var(--accent)' }} />
                  <div style={{ minWidth: 0 }}><div className="faint" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Unidad actual</div><div style={{ fontWeight: 600, fontSize: 13 }}>{prog.current.n}</div></div>
                </div>}
                <div className="col gap-5">
                  {prog.units.map((u, j) => {
                    const us = window.atlasUnitState ? atlasUnitState(u, prog.actualWeek) : { k: 'upcoming' };
                    const tone = us.k === 'done' ? 'green' : us.k === 'current' ? 'blue' : 'gray';
                    const lab = us.k === 'done' ? 'Visto' : us.k === 'current' ? 'En curso' : 'Próxima';
                    return (
                      <div className="row between center" key={j} style={{ fontSize: 12.5 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, color: us.k === 'upcoming' ? 'var(--text-faint)' : 'var(--text)' }}>{u.n}</span>
                        <Badge tone={tone}>{lab}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ MI ENGAGE (retos e insignias) ============ */
function StudentEngage({ go }) {
  useStore();
  const me = (window.piagetStudent && window.piagetStudent()) || { name: 'Estudiante', grade: '', nivel: 'Primaria' };
  const lb = ((window.DB && DB.leaderboard) || []).find(p => p.name === me.name);
  const xp = lb ? lb.xp : 0;
  const streak = lb ? lb.streak : 0;
  const nivelXp = Math.max(1, Math.floor(xp / 800) + 1);
  const badges = (window.engageBadgesOf ? engageBadgesOf(me.name) : []) || [];
  const allBadges = (window.DB && DB.badges) || [];
  const allRetos = (window.DB && DB.engage_retos) || [];
  const retos = allRetos.filter(r => stuRetoVisible(me, r));
  const myUser = me.user || me.name;
  const myPart = (rid) => ((window.DB && DB.engageParticipations) || []).find(p => p.retoId === rid && p.user === myUser);
  const joinReto = (r) => {
    if (!window.Store || myPart(r._id)) return;
    Store.add('engageParticipations', {
      retoId: r._id, retoTitle: r.title, student: me.name, group: me.grade, user: myUser,
      done: [], progress: 0, joined: true,
      fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }), updatedAt: Date.now(),
    });
    Store.log(me.name.split(' ')[0], 'se unió al reto «' + r.title + '»', 'zap');
  };
  const toggleStep = (r, i) => {
    const p = myPart(r._id); if (!p || !window.Store) return;
    const set = new Set(p.done || []); set.has(i) ? set.delete(i) : set.add(i);
    const done = [...set];
    const total = Math.max(1, (r.steps || []).length);
    const progress = Math.round(done.length / total * 100);
    Store.update('engageParticipations', p._id, { done, progress, updatedAt: Date.now() });
    if (progress === 100) Store.log(me.name.split(' ')[0], 'completó el reto «' + r.title + '»', 'checkCircle');
  };

  return (
    <div className="content-inner">
      <PageHead eyebrow="Mi espacio" title="Engage" desc="Tus retos, tu progreso y tus insignias." />
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Mi nivel', value: 'Nv. ' + nivelXp, icon: 'award', tone: 'violet' },
          { label: 'Mi XP', value: xp.toLocaleString('es-MX'), icon: 'zap', tone: 'amber' },
          { label: 'Racha', value: streak + ' días', icon: 'spark', tone: 'red' },
          { label: 'Mis insignias', value: String(badges.length), icon: 'star', tone: 'blue' },
        ].map((k, i) => { const t = window.TONE[k.tone] || window.TONE.violet; return (
          <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} fill={k.icon === 'star' || k.icon === 'spark' ? 'currentColor' : 'none'} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>
        ); })}
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.3fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <CardHead icon="zap" title="Mis retos activos" sub={retos.length + ' retos de la temporada'} />
          <div>
            {retos.length ? retos.map((r, i) => { const t = window.TONE[r.tone] || window.TONE.blue;
              const part = myPart(r._id); const steps = r.steps || [];
              return (
              <div className="lrow" key={i} style={{ alignItems: 'flex-start', gap: 12 }}>
                <div className="kpi-ico" style={{ width: 34, height: 34, margin: 0, background: t.bg, color: t.c, flexShrink: 0 }}><Icon name={r.icon || 'zap'} size={16} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row between center"><span style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</span><Badge tone="amber"><Icon name="zap" size={11} fill="currentColor" />{r.xp}</Badge></div>
                  <div className="faint" style={{ fontSize: 12.5, margin: '2px 0 8px' }}>{r.desc}</div>
                  <Bar value={part ? part.progress : 0} color={t.c} height={6} />
                  <div className="faint" style={{ fontSize: 11.5, marginTop: 5 }}>{r.scope} · termina en {r.endsDays} días{part ? ' · tu avance ' + part.progress + '%' : ''}</div>
                  {!part ? (
                    <button className="btn sm primary" style={{ marginTop: 10 }} onClick={() => joinReto(r)}><Icon name="zap" size={13} className="btn-ico" fill="currentColor" />Unirme al reto</button>
                  ) : steps.length ? (
                    <div className="col gap-6" style={{ marginTop: 10 }}>
                      {steps.map((s, si) => { const ck = (part.done || []).includes(si); return (
                        <button key={si} type="button" onClick={() => toggleStep(r, si)} className="row center gap-9"
                          style={{ width: '100%', textAlign: 'left', border: '1px solid var(--border)', background: ck ? 'var(--accent-soft)' : 'transparent', borderRadius: 'var(--r-sm)', padding: '7px 10px', cursor: 'pointer' }}>
                          <span style={{ width: 17, height: 17, borderRadius: 6, flexShrink: 0, display: 'grid', placeItems: 'center', border: ck ? 'none' : '1.5px solid var(--border-strong)', background: ck ? 'var(--accent)' : 'transparent', color: '#fff' }}>{ck && <Icon name="check" size={11} />}</span>
                          <span style={{ fontSize: 12.5, textDecoration: ck ? 'line-through' : 'none', color: ck ? 'var(--text-faint)' : 'var(--text)' }}>{s}</span>
                        </button>
                      ); })}
                    </div>
                  ) : (
                    <div className="row center gap-7" style={{ marginTop: 10, color: 'var(--green)', fontSize: 12, fontWeight: 600 }}><Icon name="checkCircle" size={14} />Te uniste a este reto</div>
                  )}
                </div>
              </div>
            ); }) : <div className="faint" style={{ padding: 20, fontSize: 13 }}>Sin retos activos por ahora.</div>}
          </div>
        </div>

        <div className="card">
          <CardHead icon="star" title="Mis insignias" sub={badges.length + ' de ' + allBadges.length + ' obtenidas'} />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', gap: 12, padding: '16px 18px' }}>
            {allBadges.map((b, i) => {
              const got = badges.some(x => x._id === b._id);
              const t = window.TONE[b.tone] || window.TONE.amber;
              return (
                <div key={i} className="col center" style={{ alignItems: 'center', textAlign: 'center', gap: 6, padding: 12, borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', opacity: got ? 1 : 0.45 }}>
                  <div className="kpi-ico" style={{ width: 40, height: 40, margin: 0, background: got ? t.bg : 'var(--surface-3)', color: got ? t.c : 'var(--text-faint)' }}><Icon name={b.icon} size={19} /></div>
                  <div style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.2 }}>{b.name}</div>
                  {got ? <Badge tone="green" dot>Obtenida</Badge> : <span className="faint" style={{ fontSize: 11 }}>{b.crit}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StudentMisiones, StudentClases, StudentAtlas, StudentEngage });

/* ============ MENSAJERÍA del estudiante (solo docentes asignados + Dirección) ============ */
function StudentMensajeria({ go }) {
  useStore();
  const me = (window.piagetStudent && window.piagetStudent()) || { name: 'Estudiante', grade: '', nivel: 'Primaria', user: '' };
  const firstName = me.name.split(' ')[0];

  // Contactos = docentes de mis materias (deduplicados) + Dirección del colegio
  const contacts = React.useMemo(() => {
    const materias = STU_MATERIAS[me.nivel] || STU_MATERIAS.Primaria;
    const byTeacher = {};
    materias.forEach(mat => {
      const tname = stuTeacherFor(me.nivel, mat, me.name);
      (byTeacher[tname] = byTeacher[tname] || []).push(mat);
    });
    const docentes = Object.keys(byTeacher).map(name => ({
      id: 'doc-' + stuHash(name), name, role: 'Docente', sub: byTeacher[name].join(' · '),
      seed: 'Hola ' + firstName + ', soy tu docente de ' + byTeacher[name][0] + '. Cualquier duda escríbeme por aquí.',
    }));
    return [
      { id: 'direccion', name: 'Dirección del colegio', role: 'Dirección', sub: 'Atención general', seed: 'Bienvenido(a) al canal de Dirección. Estamos para apoyarte en lo que necesites.' },
      ...docentes,
    ];
  }, [me.name, me.nivel]);

  const KEY = 'piaget_stu_chats_' + (me.user || me.name);
  const [store, setStore] = React.useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } });
  const persist = (next) => { setStore(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) { } };
  const [activeId, setActiveId] = React.useState(contacts[0] ? contacts[0].id : null);
  const [val, setVal] = React.useState('');
  const bodyRef = React.useRef(null);

  const msgsOf = (c) => store[c.id] || [{ from: 'them', text: c.seed, time: 'Ayer' }];
  const active = contacts.find(c => c.id === activeId) || contacts[0];
  const msgs = active ? msgsOf(active) : [];
  React.useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [activeId, store]);

  const send = () => {
    const text = val.trim(); if (!text || !active) return;
    const time = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const next = { ...store, [active.id]: [...msgsOf(active), { from: 'me', text, time }] };
    persist(next); setVal('');
  };

  return (
    <div className="content-inner" style={{ maxWidth: 1100 }}>
      <PageHead eyebrow="Comunicación" title="Mensajería" desc="Escribe a tus docentes asignados o a la Dirección del colegio." />
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', height: 540 }}>
          {/* Lista de contactos */}
          <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
            {contacts.map(c => {
              const last = msgsOf(c)[msgsOf(c).length - 1];
              return (
                <button key={c.id} onClick={() => setActiveId(c.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', border: 'none',
                  borderBottom: '1px solid var(--border)', padding: '12px 15px', cursor: 'pointer',
                  background: c.id === activeId ? 'var(--accent-soft)' : 'transparent'
                }}>
                  <Avatar name={c.name} size={38} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="row between center"><span style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>{c.role === 'Dirección' && <Badge tone="violet" >Dirección</Badge>}</div>
                    <div className="faint" style={{ fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.role === 'Dirección' ? c.sub : c.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Conversación */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {active && <>
              <div className="row center" style={{ gap: 11, padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
                <Avatar name={active.name} size={36} />
                <div className="grow" style={{ minWidth: 0 }}><div style={{ fontWeight: 600 }}>{active.name}</div><div className="faint" style={{ fontSize: 11.5 }}>{active.role === 'Dirección' ? 'Dirección del colegio' : 'Docente · ' + active.sub}</div></div>
              </div>
              <div ref={bodyRef} className="grow" style={{ overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface-2)' }}>
                {msgs.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '74%' }}>
                    <div style={{ padding: '9px 13px', fontSize: 13.5, lineHeight: 1.45, background: m.from === 'me' ? 'var(--accent)' : 'var(--surface)', color: m.from === 'me' ? 'var(--on-accent)' : 'var(--text)', border: m.from === 'me' ? 'none' : '1px solid var(--border)', borderRadius: m.from === 'me' ? '14px 14px 4px 14px' : '14px 14px 14px 4px' }}>{m.text}</div>
                    <div className="faint font-mono" style={{ fontSize: 10, marginTop: 3, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.time}</div>
                  </div>
                ))}
              </div>
              <div className="row center gap-8" style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
                <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={'Escribe a ' + active.name.split(' ')[0] + '…'}
                  style={{ flex: 1, height: 40, border: '1px solid var(--border-strong)', background: 'var(--surface-2)', borderRadius: 10, padding: '0 14px', fontSize: 14, color: 'var(--text)', outline: 'none' }} />
                <button className="btn primary" style={{ width: 40, height: 40, padding: 0, justifyContent: 'center' }} onClick={send}><Icon name="send" size={16} /></button>
              </div>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StudentMensajeria });

/* ============ COMUNICADOS del estudiante (solo lectura: escuela + docentes) ============ */
function StudentComunicados({ go }) {
  useStore();
  const me = (window.piagetStudent && window.piagetStudent()) || { name: 'Estudiante', nivel: 'Primaria' };
  const [sel, setSel] = React.useState(null);
  // Solo publicados y dirigidos al alumno (se excluyen avisos de familias/pagos)
  const items = ((window.DB && DB.announcements) || []).filter(a =>
    a.status === 'publicado' && !/familia|padre|adeudo|colegiatura|pago|tutor/i.test((a.audience || '') + ' ' + (a.title || ''))
  );
  const esDocente = (from) => /^mtr/i.test(from || '');

  return (
    <div className="content-inner" style={{ maxWidth: 920 }}>
      <PageHead eyebrow="Comunicación" title="Comunicados" desc="Avisos de la escuela y de tus docentes. Toca uno para ver el detalle." />
      {items.length ? (
        <div className="col" style={{ gap: 12 }}>
          {items.map((a, i) => {
            const doc = esDocente(a.from);
            return (
              <button className="card pad clickable" key={i} onClick={() => setSel(a)} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', textAlign: 'left', width: '100%', border: '1px solid var(--border)', cursor: 'pointer' }}>
                <div className="kpi-ico" style={{ width: 40, height: 40, margin: 0, flexShrink: 0, background: doc ? 'var(--cyan-soft)' : 'var(--accent-soft)', color: doc ? 'var(--cyan)' : 'var(--accent)' }}>
                  <Icon name={doc ? 'cap' : 'megaphone'} size={19} />
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row center gap-8" style={{ flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{a.title}</span>
                    <Badge tone={doc ? 'cyan' : 'violet'}>{doc ? 'Docente' : 'Escuela'}</Badge>
                  </div>
                  <div className="faint" style={{ fontSize: 12.5, marginTop: 3 }}>{a.from || 'Dirección'} · {a.audience} · {a.time}</div>
                  {a.body && <div className="muted" style={{ fontSize: 13, marginTop: 7, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{a.body}</div>}
                </div>
                <Icon name="chevR" size={16} className="faint" style={{ flexShrink: 0, marginTop: 10 }} />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card pad col center" style={{ alignItems: 'center', gap: 8, padding: 40 }}>
          <Icon name="megaphone" size={28} className="faint" />
          <div style={{ fontWeight: 600 }}>Sin comunicados por ahora</div>
          <div className="faint" style={{ fontSize: 13 }}>Aquí verás los avisos de la escuela y de tus docentes.</div>
        </div>
      )}

      <Modal open={!!sel} onClose={() => setSel(null)} title="Comunicado" width={520}
        footer={<button className="btn primary" onClick={() => setSel(null)}>Entendido</button>}>
        {sel && <>
          <div className="row center gap-12" style={{ marginBottom: 14 }}>
            <div className="kpi-ico" style={{ width: 44, height: 44, margin: 0, flexShrink: 0, background: esDocente(sel.from) ? 'var(--cyan-soft)' : 'var(--accent-soft)', color: esDocente(sel.from) ? 'var(--cyan)' : 'var(--accent)' }}>
              <Icon name={esDocente(sel.from) ? 'cap' : 'megaphone'} size={21} />
            </div>
            <div className="grow" style={{ minWidth: 0 }}>
              <Badge tone={esDocente(sel.from) ? 'cyan' : 'violet'}>{esDocente(sel.from) ? 'Docente' : 'Escuela'}</Badge>
              <div className="faint" style={{ fontSize: 12, marginTop: 5 }}>{sel.from || 'Dirección'} · {sel.audience}</div>
            </div>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 4px' }}>{sel.title}</h2>
          <div className="faint font-mono" style={{ fontSize: 11.5, marginBottom: 14 }}>{sel.time}</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--text)' }}>{sel.body || 'Sin contenido adicional.'}</div>
        </>}
      </Modal>
    </div>
  );
}

Object.assign(window, { StudentComunicados });

/* ============ EXPERIENCIAS del estudiante (solo lectura + detalle) ============ */
const STU_EXP_TONE = { 'Programada': 'blue', 'Inscripción abierta': 'green', 'Cupos limitados': 'amber', 'Cerrada': 'gray', 'Borrador': 'gray' };
function StudentExperiencias({ go }) {
  useStore();
  const me = (window.piagetStudent && window.piagetStudent()) || { name: 'Estudiante', nivel: 'Primaria' };
  const [sel, setSel] = React.useState(null);
  /* Experiencias reales publicadas (no borradores), dirigidas a su nivel. */
  const fmtWhen = (e) => (window.expFmtDate ? expFmtDate(e.date) : (e.date || 'Sin fecha')) + (e.time ? ' · ' + e.time : '');
  const items = ((window.DB && DB.experiences) || [])
    .filter(e => e.estado !== 'Borrador' && (e.nivel === 'Todos' || e.nivel === me.nivel))
    .slice().sort((a, b) => (a.date || '~').localeCompare(b.date || '~'))
    .map(e => ({ ...e, when: fmtWhen(e), tone: STU_EXP_TONE[e.estado] || 'violet', niveles: [e.nivel || 'Todos'] }));

  return (
    <div className="content-inner" style={{ maxWidth: 980 }}>
      <PageHead eyebrow="Comunicación" title="Experiencias" desc="Eventos y actividades programadas para ti. Toca una para ver el detalle." />
      {items.length ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {items.map((e, i) => { const t = window.TONE[e.tone] || window.TONE.violet; return (
            <button className="card pad clickable" key={i} onClick={() => setSel(e)} style={{ textAlign: 'left', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="row between center">
                <div className="kpi-ico" style={{ width: 40, height: 40, margin: 0, background: t.bg, color: t.c }}><Icon name={e.icon} size={20} /></div>
                <Badge tone={e.tone}>{e.estado}</Badge>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{e.title}</div>
                <div className="faint" style={{ fontSize: 12.5, marginTop: 3 }}>{e.when} · {e.place}</div>
              </div>
              <div className="muted" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{e.body}</div>
            </button>
          ); })}
        </div>
      ) : (
        <div className="card pad col center" style={{ alignItems: 'center', gap: 8, padding: 40 }}>
          <Icon name="star" size={28} className="faint" />
          <div style={{ fontWeight: 600 }}>Sin experiencias programadas</div>
          <div className="faint" style={{ fontSize: 13 }}>Pronto verás aquí los eventos y actividades para tu grupo.</div>
        </div>
      )}

      <Modal open={!!sel} onClose={() => setSel(null)} title="Experiencia" width={520}
        footer={<button className="btn primary" onClick={() => setSel(null)}>Entendido</button>}>
        {sel && <>
          <div className="row center gap-12" style={{ marginBottom: 14 }}>
            <div className="kpi-ico" style={{ width: 44, height: 44, margin: 0, flexShrink: 0, background: (window.TONE[sel.tone] || window.TONE.violet).bg, color: (window.TONE[sel.tone] || window.TONE.violet).c }}><Icon name={sel.icon} size={21} /></div>
            <div className="grow" style={{ minWidth: 0 }}>
              <Badge tone={sel.tone}>{sel.estado}</Badge>
              <div className="faint" style={{ fontSize: 12, marginTop: 5 }}>{sel.niveles.includes('Todos') ? 'Toda la comunidad' : sel.niveles.join(' · ')}</div>
            </div>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 10px' }}>{sel.title}</h2>
          <div className="row gap-16" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
            <div className="row center gap-7"><Icon name="calendar" size={15} className="faint" /><span style={{ fontSize: 13.5, fontWeight: 600 }}>{sel.when}</span></div>
            <div className="row center gap-7"><Icon name="pin" size={15} className="faint" /><span style={{ fontSize: 13.5, fontWeight: 600 }}>{sel.place}</span></div>
          </div>
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--text)' }}>{sel.body}</div>
        </>}
      </Modal>
    </div>
  );
}

Object.assign(window, { StudentExperiencias });

/* ============ Selector de hijo (familias) ============ */
function ChildSwitcher() {
  useStore();
  const kids = (window.piagetChildren && window.piagetChildren()) || [];
  const idx = window.piagetChildIdx ? piagetChildIdx() : 0;
  if (kids.length <= 1) return null;
  return (
    <div className="card" style={{ padding: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', paddingLeft: 4 }}>Viendo a</span>
      {kids.map((k, i) => (
        <button key={i} onClick={() => window.piagetSetChild(i)} className="row center gap-8"
          style={{ border: '1.5px solid ' + (i === idx ? 'var(--accent)' : 'var(--border)'), background: i === idx ? 'var(--accent-soft)' : 'var(--surface)', color: i === idx ? 'var(--accent-strong)' : 'var(--text)', borderRadius: 'var(--r-pill)', padding: '5px 12px 5px 6px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <Avatar name={k.name} size={24} /> {k.name.split(' ')[0]} <span className="faint" style={{ fontWeight: 500, fontSize: 11.5 }}>{k.grade}</span>
        </button>
      ))}
    </div>
  );
}

/* ============ HOME de la familia (varios hijos) ============ */
function FamilyHome({ go }) {
  useStore();
  const sess = (window.PiagetAuth && window.PiagetAuth.getSession()) || {};
  const kids = (window.piagetChildren && window.piagetChildren()) || [];
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const comunicados = ((window.DB && DB.announcements) || []).filter(a => a.status === 'publicado' && !/adeudo|colegiatura|pago/i.test((a.audience || '') + a.title)).slice(0, 3);
  const tarifaDe = (nivel) => ((window.COB_TARIFAS || []).find(t => t.nivel === nivel) || {});
  const goChild = (i, route) => { window.piagetSetChild(i); go(route); };

  return (
    <div className="content-inner">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 7 }}>Portal de familias</div>
          <h1 className="page-title">Hola, {sess.name || 'familia'}</h1>
          <p className="page-desc">Resumen de {kids.length === 1 ? 'tu hijo(a)' : 'tus ' + kids.length + ' hijos'} · {today}.</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => go('pagos')}><Icon name="wallet" size={15} className="btn-ico" />Pagos</button>
          <button className="btn" onClick={() => go('tienda-en-linea')}><Icon name="store" size={15} className="btn-ico" />Tienda</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {kids.map((k, i) => {
          const prom = k.avg != null ? k.avg.toFixed(1) : '—';
          return (
            <div className="card pad" key={i} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="row center gap-12">
                <Avatar name={k.name} size={46} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5 }}>{k.name}</div>
                  <div className="faint" style={{ fontSize: 12.5 }}>{k.nivel} · {k.grade}</div>
                </div>
              </div>
              <div className="row" style={{ gap: 0 }}>
                {[{ k: 'Promedio', v: prom }, { k: 'Asistencia', v: k.att != null ? k.att + '%' : '—' }, { k: 'Estatus', v: k.avg == null && k.att == null ? '—' : (k.risk === 'low' ? 'Bien' : 'Atención') }].map((m, j) => (
                  <div key={j} style={{ flex: 1, borderLeft: j ? '1px solid var(--border)' : 'none', paddingLeft: j ? 12 : 0 }}>
                    <div className="faint" style={{ fontSize: 11 }}>{m.k}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{m.v}</div>
                  </div>
                ))}
              </div>
              <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                <button className="btn sm" onClick={() => goChild(i, 'clases')}><Icon name="cap" size={13} className="btn-ico" />Clases</button>
                <button className="btn sm" onClick={() => goChild(i, 'engage')}><Icon name="zap" size={13} className="btn-ico" />Engage</button>
                <button className="btn sm" onClick={() => goChild(i, 'mi-credencial')}><Icon name="user" size={13} className="btn-ico" />Credencial</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-16">
        <CardHead icon="megaphone" title="Comunicados" sub="Avisos de la escuela"
          right={<button className="btn sm ghost" onClick={() => go('comunicados')}>Ver todos</button>} />
        <div>
          {comunicados.length ? comunicados.map((c, i) => (
            <div className="lrow" key={i} style={{ alignItems: 'flex-start' }}>
              <div className="insight-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 32, height: 32, flexShrink: 0 }}><Icon name="megaphone" size={15} /></div>
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.title}</div>
                <div className="faint" style={{ fontSize: 12 }}>{c.from || 'Dirección'} · {c.time}</div>
              </div>
            </div>
          )) : <div className="faint" style={{ padding: 20, fontSize: 13 }}>Sin avisos recientes.</div>}
        </div>
      </div>
    </div>
  );
}

/* ============ PAGOS de colegiatura (familia) ============ */
function FamilyPagos({ go, route }) {
  const store = useStore();
  const [, setTick] = React.useReducer(x => x + 1, 0);
  const refresh = () => setTick();
  const kids = (window.piagetChildren && window.piagetChildren()) || [];
  const paidMap = (window.ctaPaidBySid ? ctaPaidBySid() : {});
  const sess = (window.PiagetAuth && window.PiagetAuth.getSession()) || {};

  /* Estado de cuenta REAL por hijo (mismo motor que Tesorería › Cobros) */
  const resolveKid = (k) => {
    const found = (window.ctaStudents ? ctaStudents() : []).find(s => s.name === k.name);
    const base = found || { sid: 'fam-' + k.name, name: k.name, group: k.grade || '—', nivel: k.nivel };
    return window.ctaResolve ? ctaResolve(base, paidMap) : { ...base, plan: '10', beca: 0, t: {}, total: 0, pagado: 0, saldo: 0, estatus: 'liquidado' };
  };
  const monthlyOf = (r) => {
    try {
      const sched = window.cobSchedule ? cobSchedule(r.t, r.plan).map(c => ({ ...c, amount: Math.round(c.amount * (1 - (r.beca || 0) / 100)) })) : [];
      return sched.length ? sched[0].amount : 0;
    } catch (e) { return 0; }
  };
  const rows = kids.map((k, i) => { const r = resolveKid(k); return { ...r, grade: k.grade, i, mensual: monthlyOf(r) }; });
  const totalPend = rows.reduce((a, r) => a + (r.saldo || 0), 0);

  /* Calendario de mensualidades por hijo (para pagar o adelantar cualquier mes) */
  const COB_GRACE_DIAS = 10;            // días para pagar desde el inicio del mes
  const COB_RECARGO_PCT = 0.10;         // recargo si se paga después del límite
  const CMES_NUM = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6]; // mes calendario por cada mes del ciclo (Sep…Jun)
  const MES_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const cycleStartYear = (() => { const m = /(\d{4})/.exec((window.DB && DB.settings && DB.settings.cycle) || ''); return m ? Number(m[1]) : new Date().getFullYear(); })();
  const _today = new Date(); _today.setHours(0, 0, 0, 0);
  const fmtDue = (d) => d.getDate() + ' ' + MES_ABBR[d.getMonth()] + ' ' + d.getFullYear();
  const _nextBusinessDay = (d) => { const x = new Date(d); while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1); return x; };
  const _prevBusinessDay = (d) => { const x = new Date(d); while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() - 1); return x; };
  /* Cargos de inicio de ciclo (inscripción y cuota única anual) · vencen el último día hábil del primer mes (septiembre) */
  const chargesOf = (r) => {
    const limite = _prevBusinessDay(new Date(cycleStartYear, 9, 0)); // último día hábil de septiembre
    const paidC = ((window.DB && DB.cobros) || []).filter(c => c.sid === r.sid || c.student === r.name).map(c => (c.concept || ''));
    const items = [
      { key: 'insc', label: 'Inscripción', amount: (r.t && r.t.inscripcion) || 0, match: 'Inscripción' },
      { key: 'cuota', label: 'Cuota única anual', amount: (r.t && r.t.extras) || 0, match: 'Cuota' },
    ];
    return items.filter(it => it.amount > 0).map(it => {
      const paid = paidC.some(cc => cc.indexOf(it.match) !== -1);
      const late = !paid && _today > limite;
      const recargo = late ? Math.round(it.amount * COB_RECARGO_PCT) : 0;
      return { ...it, limite, paid, late, recargo, total: it.amount + recargo };
    });
  };
  const monthsOf = (r) => {
    let sched = [];
    try { sched = window.cobSchedule ? cobSchedule(r.t, r.plan).map(c => ({ ...c, amount: Math.round(c.amount * (1 - (r.beca || 0) / 100)) })) : []; } catch (e) { sched = []; }
    const paidConcepts = ((window.DB && DB.cobros) || []).filter(c => c.sid === r.sid || c.student === r.name).map(c => (c.concept || ''));
    return sched.filter(c => c.amount > 0).map((c) => {
      const cm = CMES_NUM[c.n - 1]; const yr = cm >= 9 ? cycleStartYear : cycleStartYear + 1;
      /* el conteo arranca el primer día hábil (lun–vie) del mes */
      const inicio = _nextBusinessDay(new Date(yr, cm - 1, 1));
      /* fecha límite = primer día hábil + (10 días naturales); si cae en fin de semana se recorre al siguiente día hábil */
      const limite = _nextBusinessDay(new Date(yr, cm - 1, inicio.getDate() + (COB_GRACE_DIAS - 1)));
      const paid = paidConcepts.some(cc => c.mes && cc.indexOf(c.mes) !== -1);
      const late = !paid && _today > limite;
      const recargo = late ? Math.round(c.amount * COB_RECARGO_PCT) : 0;
      return { ...c, idx: c.n - 1, paid, inicio, limite, late, recargo, total: c.amount + recargo };
    });
  };

  const [pay, setPay] = React.useState(null); // { r }
  const [method, setMethod] = React.useState('stripe');
  const [payType, setPayType] = React.useState('completo');
  const [abono, setAbono] = React.useState('');
  React.useEffect(() => { if (pay) { setPayType('completo'); setAbono(String(pay.amount || '')); } }, [pay]);
  const payAmount = pay ? (payType === 'completo' ? pay.amount : Math.max(0, Math.min(pay.amount, Number(abono) || 0))) : 0;
  const esAbono = pay && payType === 'cuenta' && payAmount < pay.amount;

  /* Registra un cobro REAL (visible también para Tesorería) */
  const confirmar = (via) => {
    const r = pay.r; const amount = payAmount;
    if (!amount || amount <= 0) { toast('Captura un monto válido', 'warn'); return; }
    const concept = (pay.concept || ('Colegiatura' + (pay.mes ? ' ' + pay.mes : ''))) + (pay.recargo ? ' (incl. recargo)' : '') + (esAbono ? ' (abono a cuenta)' : '') + ' · ' + r.name + (r.group && r.group !== '—' ? ' (' + r.group + ')' : '');
    if (window.Store) {
      Store.add('cobros', {
        recibo: (window.ctaNextRecibo ? ctaNextRecibo() : 'REC-' + Date.now()),
        sid: r.sid, student: r.name, group: r.group, nivel: r.nivel,
        family: sess.name || ('Familia ' + r.name.split(' ').slice(-1)[0]),
        concept, amount: Number(amount),
        channel: via === 'transfer' ? 'Transferencia' : via === 'paypal' ? 'PayPal' : 'Tarjeta',
        ref: '', folio: '', date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        status: via === 'transfer' ? 'pendiente' : 'conciliado',
      });
    }
    toast(via === 'transfer' ? 'Transferencia registrada · se confirmará al recibir el depósito' : 'Pago de ' + r.name.split(' ')[0] + (pay.mes ? ' · ' + pay.mes : '') + ' realizado ✓');
    setPay(null); refresh();
  };
  const copyTxt = (t, lbl) => { try { navigator.clipboard.writeText(t); toast((lbl || 'Copiado') + ' ✓'); } catch (e) { toast('Cópialo manualmente', 'info'); } };
  const clabeFor = (name) => { let s = '0121800'; const h = String(Math.abs(stuHash(name)) * 7 + 13); for (let i = 0; s.length < 18; i++) s += h[i % h.length]; return s.slice(0, 18); };
  const refFor = (name) => 'COL-' + (new Date().getMonth() + 1).toString().padStart(2, '0') + '-' + (stuHash(name) % 9000 + 1000);

  const METHODS = [['stripe', 'Tarjeta', 'card'], ['paypal', 'PayPal', 'wallet'], ['transfer', 'Transferencia', 'layers']];

  const [tab, setTab] = React.useState(route === 'mis-facturas' ? 'facturas' : route === 'historial-pagos' ? 'historial' : 'pagar');
  const [selFac, setSelFac] = React.useState(null);
  const [genFac, setGenFac] = React.useState(null);
  const [selPago, setSelPago] = React.useState(null);

  /* Historial REAL: cobros registrados de los hijos de esta familia */
  const kidNames = kids.map(k => k.name);
  const history = ((window.DB && DB.cobros) || []).filter(c => kidNames.includes(c.student))
    .map(c => ({ id: c._id, child: c.student, nivel: c.nivel, concept: c.concept || 'Colegiatura', fecha: c.date, amount: c.amount, metodo: c.channel || '—', recibo: c.recibo, folio: c.folio, status: c.status }));

  const famUUID = (seed) => { let h = Math.abs(stuHash(seed)) || 1; const nx = () => { h = (h * 1103515245 + 12345) & 0x7fffffff; return h % 16; }; let o = ''; for (const c of 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx') o += c === '-' ? '-' : c === '4' ? '4' : c === 'y' ? ((nx() & 0x3 | 0x8).toString(16)) : nx().toString(16); return o.toUpperCase(); };
  const rfcOf = (name) => { try { const r = window.factReceptorOf && factReceptorOf(name); return (r && r.rfc) || 'XAXX010101000'; } catch (e) { return 'XAXX010101000'; } };
  const factOf = (p) => p.folio ? { folio: p.folio, uuid: famUUID(p.id), fecha: p.fecha, rfc: rfcOf(p.child), uso: 'D10' } : null;
  const generar = () => {
    const p = genFac;
    const folio = 'A-' + (stuHash(p.id + 'g') % 9000 + 1000);
    if (window.Store && p.id) Store.update('cobros', p.id, { folio });
    toast('Factura ' + folio + ' timbrada ✓'); setGenFac(null); refresh();
    setSelFac({ p: { ...p, folio }, fac: { folio, uuid: famUUID(p.id + 'g'), fecha: 'Hoy', rfc: p.rfc, razon: p.razon, uso: p.uso } });
  };

  return (
    <div className="content-inner" style={{ maxWidth: 920 }}>
      <PageHead eyebrow="Servicios" title="Pagos de colegiatura" desc="Estado de cuenta y pago en línea de tus hijos." />
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { label: 'Hijos', value: String(kids.length), icon: 'users', tone: 'blue' },
          { label: 'Saldo por pagar', value: '$' + totalPend.toLocaleString('es-MX'), icon: 'wallet', tone: totalPend ? 'amber' : 'green' },
          { label: 'Ciclo', value: (DB.settings && DB.settings.cycle) || '2025–2026', icon: 'calendar', tone: 'violet' },
        ].map((k, i) => { const t = window.TONE[k.tone]; return (
          <div className="card kpi" key={i}><div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>
        ); })}
      </div>

      <div className="seg mt-16" style={{ marginBottom: 16 }}>
        {[['pagar', 'Por pagar'], ['historial', 'Historial'], ['facturas', 'Facturas']].map(([id, l]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{l}</button>
        ))}
      </div>

      {tab === 'pagar' && (
        kids.length ? rows.map((r) => {
          const months = monthsOf(r);
          const charges = chargesOf(r);
          const pendientes = [...charges, ...months].filter(m => !m.paid);
          return (
            <div className="card" key={r.i} style={{ marginBottom: 16 }}>
              <CardHead icon="wallet" title={r.name}
                sub={r.nivel + (r.grade ? ' · ' + r.grade : '') + ' · ' + (window.cobPlanLabel ? cobPlanLabel(r.plan) : 'Plan') + (r.beca ? ' · beca ' + r.beca + '%' : '')}
                right={<span className="row center gap-8">
                  <span className="faint" style={{ fontSize: 12 }}>Saldo</span>
                  <span className="tnum" style={{ fontWeight: 700, color: r.saldo > 0 ? 'var(--amber)' : 'var(--green)' }}>${(r.saldo || 0).toLocaleString('es-MX')}</span>
                  {pendientes.length > 1 && <button className="btn sm primary" onClick={() => setPay({ r, amount: pendientes.reduce((a, m) => a + m.total, 0), concept: 'Ciclo completo (' + pendientes.length + ' conceptos)' })}><Icon name="zap" size={13} className="btn-ico" />Pagar todo</button>}
                </span>} />
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl">
                  <thead><tr><th>Concepto</th><th>Fecha límite</th><th className="num">Monto</th><th>Estatus</th><th></th></tr></thead>
                  <tbody>
                    {charges.map((m) => (
                      <tr key={m.key} style={{ background: 'var(--surface-2)' }}>
                        <td style={{ fontWeight: 600 }}>{m.label}</td>
                        <td className="faint" style={{ fontSize: 12.5 }}>{fmtDue(m.limite)}</td>
                        <td className="num">
                          <span className="tnum">${(m.total || 0).toLocaleString('es-MX')}</span>
                          {m.recargo > 0 && <div className="faint" style={{ fontSize: 10.5, color: 'var(--red)' }}>incl. recargo ${m.recargo.toLocaleString('es-MX')}</div>}
                        </td>
                        <td>{m.paid ? <Badge tone="green" dot>Pagado</Badge> : m.late ? <Badge tone="red" dot>Vencido</Badge> : <Badge tone="amber" dot>Pendiente</Badge>}</td>
                        <td>{m.paid
                          ? <span className="faint" style={{ fontSize: 12 }}>—</span>
                          : <button className="btn sm primary" onClick={() => { setPay({ r, amount: m.total, concept: m.label, recargo: m.recargo }); setMethod('stripe'); }}><Icon name="wallet" size={13} className="btn-ico" />Pagar</button>}</td>
                      </tr>
                    ))}
                    {months.length ? months.map((m) => (
                      <tr key={m.idx}>
                        <td style={{ fontWeight: 600 }}>{String(m.idx + 1).padStart(2, '0')} · {m.mes}{m.doble ? ' (doble)' : ''}</td>
                        <td className="faint" style={{ fontSize: 12.5 }}>{fmtDue(m.limite)}{m.late ? '' : ''}</td>
                        <td className="num">
                          <span className="tnum">${(m.total || 0).toLocaleString('es-MX')}</span>
                          {m.recargo > 0 && <div className="faint" style={{ fontSize: 10.5, color: 'var(--red)' }}>incl. recargo ${m.recargo.toLocaleString('es-MX')}</div>}
                        </td>
                        <td>{m.paid
                          ? <Badge tone="green" dot>Pagado</Badge>
                          : m.late
                            ? <Badge tone="red" dot>Vencido</Badge>
                            : <Badge tone="amber" dot>Pendiente</Badge>}</td>
                        <td>{m.paid
                          ? <span className="faint" style={{ fontSize: 12 }}>—</span>
                          : <button className="btn sm primary" onClick={() => { setPay({ r, amount: m.total, mes: m.mes, recargo: m.recargo }); setMethod('stripe'); }}><Icon name="wallet" size={13} className="btn-ico" />Pagar</button>}</td>
                      </tr>
                    )) : <tr><td colSpan={5} className="faint" style={{ padding: '16px 12px' }}>Sin plan de colegiaturas configurado para este nivel.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="faint" style={{ fontSize: 11.5, padding: '10px 18px', borderTop: '1px solid var(--border)' }}>Tienes {COB_GRACE_DIAS} días naturales desde el inicio de cada mes para pagar sin recargo. Después de la fecha límite se aplica un recargo del {Math.round(COB_RECARGO_PCT * 100)}%. Puedes adelantar el pago de cualquier mensualidad.</div>
            </div>
          );
        }) : <div className="card"><div className="faint" style={{ padding: 24, fontSize: 13, textAlign: 'center' }}>No hay estudiantes vinculados a esta cuenta.</div></div>
      )}

      {tab === 'historial' && (
        <div className="card">
          <CardHead icon="history" title="Historial de pagos" sub={history.length + ' pago(s) registrado(s)'} />
          {history.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead><tr><th>Recibo</th><th>Estudiante</th><th>Concepto</th><th>Fecha</th><th>Método</th><th className="num">Monto</th></tr></thead>
                <tbody>
                  {history.map((p) => (
                    <tr key={p.id} className="clickable" onClick={() => setSelPago(p)}>
                      <td className="font-mono" style={{ fontSize: 12.5 }}>{p.recibo}</td>
                      <td>{p.child}</td>
                      <td className="muted">{p.concept}</td>
                      <td className="faint" style={{ fontSize: 12.5 }}>{p.fecha}</td>
                      <td><Badge tone="gray">{p.metodo}</Badge></td>
                      <td className="num">${(p.amount || 0).toLocaleString('es-MX')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="faint" style={{ padding: 24, fontSize: 13, textAlign: 'center' }}>Aún no hay pagos registrados. Cuando realices un pago aparecerá aquí.</div>}
        </div>
      )}

      {tab === 'facturas' && (
        <div className="card">
          <CardHead icon="receipt" title="Facturas (CFDI)" sub="Consulta o genera la factura de tus colegiaturas" />
          {history.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Concepto</th><th>Estudiante</th><th>Fecha</th><th className="num">Total</th><th>Estatus</th><th></th></tr></thead>
              <tbody>
                {history.map((p) => { const f = factOf(p); return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.concept}</td>
                    <td className="muted">{p.child}</td>
                    <td className="faint" style={{ fontSize: 12.5 }}>{p.fecha}</td>
                    <td className="num">${p.amount.toLocaleString('es-MX')}</td>
                    <td>{f ? <Badge tone="green" dot>Timbrada</Badge> : <Badge tone="amber" dot>Por generar</Badge>}</td>
                    <td>{f
                      ? <button className="btn sm" onClick={() => setSelFac({ p, fac: f })}><Icon name="eye" size={13} className="btn-ico" />Ver factura</button>
                      : <button className="btn sm primary" onClick={() => setGenFac({ ...p, rfc: rfcOf(p.child), razon: sess.name || 'Público en general', uso: 'D10' })}><Icon name="receipt" size={13} className="btn-ico" />Generar</button>}</td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
          ) : <div className="faint" style={{ padding: 24, fontSize: 13, textAlign: 'center' }}>No hay pagos para facturar todavía.</div>}
        </div>
      )}

      <Modal open={!!pay} onClose={() => setPay(null)} title="Pago en línea" width={480}
        footer={<button className="btn" onClick={() => setPay(null)}>Cerrar</button>}>
        {pay && <>
          <div className="row between center" style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', marginBottom: 16 }}>
            <span className="muted" style={{ fontSize: 13.5 }}>{pay.concept ? pay.concept : 'Colegiatura'} de <b style={{ color: 'var(--text)' }}>{pay.r.name}</b></span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20 }}>${(payAmount || 0).toLocaleString('es-MX')}</span>
          </div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Tipo de pago</div>
          <div className="roles" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginBottom: payType === 'cuenta' ? 10 : 16 }}>
            {[['completo', 'Pago completo', 'check'], ['cuenta', 'Pago a cuenta', 'wallet']].map(([m, label, ic]) => (
              <button key={m} className={'role-tile' + (payType === m ? ' sel' : '')} onClick={() => { setPayType(m); if (m === 'completo') setAbono(String(pay.amount)); }}>
                <Icon name={ic} size={18} className="ri" />{label}
              </button>
            ))}
          </div>
          {payType === 'cuenta' && (
            <div style={{ marginBottom: 16 }}>
              <Field label={'Monto a abonar (máx. $' + pay.amount.toLocaleString('es-MX') + ')'}>
                <NumberInput min="0" max={pay.amount} value={abono} onChange={e => setAbono(e.target.value)} />
              </Field>
              <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>Saldo restante tras este abono: <b>${Math.max(0, pay.amount - (payAmount || 0)).toLocaleString('es-MX')}</b></div>
            </div>
          )}
          <div className="eyebrow" style={{ marginBottom: 8 }}>Método de pago</div>
          <div className="roles" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 16 }}>
            {METHODS.map(([m, label, ic]) => (
              <button key={m} className={'role-tile' + (method === m ? ' sel' : '')} onClick={() => setMethod(m)}>
                <Icon name={ic} size={18} className="ri" />{label}
              </button>
            ))}
          </div>

          {method === 'transfer' ? (
            <div>
              <div className="faint" style={{ fontSize: 12.5, marginBottom: 10 }}>Realiza una transferencia SPEI con estos datos. Tu pago se concilia automáticamente con la referencia.</div>
              {[
                ['Banco', 'BBVA México'],
                ['Beneficiario', (DB.settings && DB.settings.legalName) || 'Corporativo Jean Piaget S.C.'],
                ['CLABE', clabeFor(pay.r.name)],
                ['Referencia', refFor(pay.r.name)],
                ['Monto', '$' + (payAmount || 0).toLocaleString('es-MX') + ' MXN'],
              ].map(([k, v], i) => (
                <div key={i} className="row between center" style={{ padding: '10px 0', borderBottom: i < 4 ? '1px dashed var(--border)' : 'none', gap: 12 }}>
                  <span className="faint" style={{ fontSize: 12.5 }}>{k}</span>
                  <span className="row center gap-8" style={{ minWidth: 0 }}>
                    <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-all' }}>{v}</span>
                    {(k === 'CLABE' || k === 'Referencia') && <button className="icon-btn" style={{ width: 28, height: 28, flexShrink: 0 }} title={'Copiar ' + k} onClick={() => copyTxt(v, k + ' copiada')}><Icon name="copy" size={14} /></button>}
                  </span>
                </div>
              ))}
              <button className="pay-gw-btn" style={{ background: 'var(--accent)', color: 'var(--on-accent)', marginTop: 16 }} onClick={() => confirmar('transfer')}>
                <Icon name="check" size={15} />Ya realicé la transferencia
              </button>
            </div>
          ) : (
            window.GatewayProcessor
              ? <GatewayProcessor gw={method} amount={payAmount} buyer={{ student: pay.r.name }} onApproved={() => confirmar(method)} />
              : <div className="faint">Pasarela no disponible.</div>
          )}
        </>}
      </Modal>

      <Modal open={!!selFac} onClose={() => setSelFac(null)} title="Factura electrónica (CFDI)" width={500}
        footer={<><button className="btn" onClick={() => window.print()}><Icon name="download" size={15} className="btn-ico" />Descargar PDF</button><button className="btn primary" onClick={() => setSelFac(null)}>Cerrar</button></>}>
        {selFac && <div className="cred-print">
          <div className="row between center" style={{ marginBottom: 14 }}>
            <div><div style={{ fontWeight: 700 }}>{(DB.settings && DB.settings.legalName) || 'Corporativo Jean Piaget S.C.'}</div><div className="faint font-mono" style={{ fontSize: 11.5 }}>{(DB.settings && DB.settings.rfc) || 'CJP950815CH6'}</div></div>
            <Badge tone="green" dot>Timbrada</Badge>
          </div>
          {[['Folio', selFac.fac.folio], ['UUID (Folio fiscal)', selFac.fac.uuid], ['RFC receptor', selFac.fac.rfc || rfcOf(selFac.p.child)], ['Uso CFDI', (selFac.fac.uso || 'D10') + ' · Pagos por servicios educativos'], ['Concepto', (selFac.p.concept || 'Colegiatura') + ' · ' + selFac.p.child], ['Fecha de emisión', selFac.fac.fecha || selFac.p.fecha]].map(([k, v], i) => (
            <div key={i} className="kv"><span className="k">{k}</span><span className="v" style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all', textAlign: 'right' }}>{v}</span></div>
          ))}
          <div className="kv"><span className="k">Total (IVA 0% · exento)</span><span className="v">${selFac.p.amount.toLocaleString('es-MX')} MXN</span></div>
        </div>}
      </Modal>

      <Modal open={!!selPago} onClose={() => setSelPago(null)} title="Comprobante de pago" width={460}
        footer={<><button className="btn" onClick={() => window.print()}><Icon name="download" size={15} className="btn-ico" />Imprimir comprobante</button>
          {selPago && (() => { const f = factOf(selPago); return f
            ? <button className="btn primary" onClick={() => { const p = selPago; setSelPago(null); setSelFac({ p, fac: f }); }}><Icon name="receipt" size={15} className="btn-ico" />Ver factura</button>
            : <button className="btn primary" onClick={() => { const p = selPago; setSelPago(null); setGenFac({ ...p, rfc: rfcOf(p.child), razon: sess.name || 'Público en general', uso: 'D10' }); }}><Icon name="receipt" size={15} className="btn-ico" />Generar factura</button>; })()}
        </>}>
        {selPago && <div className="cred-print">
          <div className="row between center" style={{ marginBottom: 14 }}>
            <div><div style={{ fontWeight: 700 }}>{(DB.settings && DB.settings.legalName) || 'Corporativo Jean Piaget S.C.'}</div><div className="faint" style={{ fontSize: 11.5 }}>Comprobante de pago · Ciclo {(DB.settings && DB.settings.cycle) || '2025–2026'}</div></div>
            <Badge tone="green" dot>Pagado</Badge>
          </div>
          {[['Recibo', selPago.recibo], ['Alumno', selPago.child], ['Nivel', selPago.nivel], ['Concepto', selPago.concept || 'Colegiatura'], ['Fecha de pago', selPago.fecha], ['Método', selPago.metodo]].map(([k, v], i) => (
            <div key={i} className="kv"><span className="k">{k}</span><span className="v" style={{ textAlign: 'right' }}>{v}</span></div>
          ))}
          <div className="kv"><span className="k">Total pagado</span><span className="v">${selPago.amount.toLocaleString('es-MX')} MXN</span></div>
          <div className="faint" style={{ fontSize: 11.5, marginTop: 12 }}>Este comprobante acredita el pago de la mensualidad. Para factura fiscal (CFDI) usa el botón Factura.</div>
        </div>}
      </Modal>

      <Modal open={!!genFac} onClose={() => setGenFac(null)} title="Generar factura" width={460}
        footer={<><button className="btn" onClick={() => setGenFac(null)}>Cancelar</button><button className="btn primary" onClick={generar}><Icon name="receipt" size={15} className="btn-ico" />Timbrar factura</button></>}>
        {genFac && <>
          <div className="row between center" style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', marginBottom: 14 }}>
            <span className="muted" style={{ fontSize: 13.5 }}>{genFac.concept || 'Colegiatura'} · {genFac.child}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>${genFac.amount.toLocaleString('es-MX')}</span>
          </div>
          <Field label="RFC receptor"><TextInput value={genFac.rfc} onChange={e => setGenFac({ ...genFac, rfc: e.target.value.toUpperCase() })} style={{ textTransform: 'uppercase' }} /></Field>
          <div style={{ height: 10 }} />
          <Field label="Razón social"><TextInput value={genFac.razon} onChange={e => setGenFac({ ...genFac, razon: e.target.value })} /></Field>
          <div style={{ height: 10 }} />
          <Field label="Uso de CFDI"><SelectInput value={genFac.uso} onChange={e => setGenFac({ ...genFac, uso: e.target.value })} options={[{ value: 'D10', label: 'D10 · Pagos por servicios educativos' }, { value: 'G03', label: 'G03 · Gastos en general' }, { value: 'S01', label: 'S01 · Sin efectos fiscales' }]} /></Field>
          <div className="faint" style={{ fontSize: 12, marginTop: 12 }}>Se timbrará ante el SAT con complemento IEDU. Recibirás el PDF y XML por correo.</div>
        </>}
      </Modal>
    </div>
  );
}

Object.assign(window, { ChildSwitcher, FamilyHome, FamilyPagos });
