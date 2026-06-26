/* views_engage_data.jsx — Engage: temporada, copa de grupos, jugadores, fuentes de XP, insignias, tienda y banco de retos */

function engageHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/* ¿Ciclo reiniciado? Engage arranca sin temporada ni actividad. */
const ENGAGE_FRESH = !!window.PIAGET_FRESH;

/* ---------- Temporada actual ---------- */
const ENGAGE_SEASON = ENGAGE_FRESH
  ? { name: 'Sin temporada activa', week: 0, totalWeeks: 12, endsLabel: 'sin programar', daysLeft: 0 }
  : {
      name: 'Temporada 3 · Constelaciones',
      week: 8, totalWeeks: 12,
      endsLabel: 'termina el 28 jun',
      daysLeft: 18,
    };

/* ---------- Tendencia de participación (10 semanas) ---------- */
const ENGAGE_TREND = {
  labels: ['S24', 'S25', 'S26', 'S27', 'S28', 'S29', 'S30', 'S31', 'S32', 'S33'],
  participacion: ENGAGE_FRESH ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] : [69, 72, 75, 73, 77, 80, 76, 79, 75, 78],
  meta: 80,
};

/* ---------- Copa de grupos (temporada) ---------- */
const ENGAGE_CUP = ENGAGE_FRESH ? [] : [
  { g: '3° A', nivel: 'Primaria', alumnos: 28, pts: 12480, delta: 2 },
  { g: '5° B', nivel: 'Primaria', alumnos: 28, pts: 9140, delta: 1 },
  { g: '4° A', nivel: 'Primaria', alumnos: 28, pts: 8730, delta: -1 },
  { g: '6° A', nivel: 'Primaria', alumnos: 30, pts: 8210, delta: 0 },
  { g: '1° B Sec', nivel: 'Secundaria', alumnos: 31, pts: 7660, delta: 3 },
  { g: '2° B', nivel: 'Primaria', alumnos: 26, pts: 7240, delta: -2 },
];

/* ---------- Jugadores (ranking individual) ---------- */
const ENGAGE_PLAYERS = ENGAGE_FRESH ? [] : [
  { name: 'Camila Torres', grade: '2° B', xp: 4820, streak: 14, deltaSem: 380, last: 'hoy' },
  { name: 'Diego Hernández', grade: '5° A', xp: 4510, streak: 21, deltaSem: 290, last: 'ayer', streakRisk: true },
  { name: 'Isabella Núñez', grade: '4° A', xp: 4190, streak: 9, deltaSem: 410, last: 'hoy' },
  { name: 'Emiliano Vega', grade: '6° B', xp: 3870, streak: 6, deltaSem: 180, last: 'hoy' },
  { name: 'Mateo Jiménez', grade: '6° A', xp: 3640, streak: 11, deltaSem: 240, last: 'hoy' },
  { name: 'Regina Flores', grade: '3° C', xp: 3380, streak: 8, deltaSem: 310, last: 'ayer' },
  { name: 'Sofía Aguilar', grade: '1° B', xp: 3120, streak: 17, deltaSem: 220, last: 'hoy' },
  { name: 'Leonardo Castro', grade: '3° A', xp: 2980, streak: 4, deltaSem: 350, last: 'hoy' },
];

/* ---------- Alumnos con caída de actividad (desenganche) ---------- */
const ENGAGE_DROPS = ENGAGE_FRESH ? [] : [
  { name: 'Valentina Cruz', grade: '4° B', xp: 1240, streak: 0, drop: 62, last: 'hace 6 días', cause: 'Sin misiones entregadas en 2 semanas; perdió una racha de 9 días.' },
  { name: 'Santiago Ramos', grade: '5° A', xp: 1980, streak: 0, drop: 48, last: 'hace 4 días', cause: 'Participación en clase a la baja desde el corte de abril.' },
  { name: 'Pablo Quintero', grade: '2° A', xp: 2210, streak: 1, drop: 41, last: 'hace 3 días', cause: 'Solo registra actividad de asistencia; cero misiones este mes.' },
];

/* ---------- Fuentes de XP ---------- */
const ENGAGE_XP_SOURCES = ENGAGE_FRESH ? [] : [
  { label: 'Misiones', value: 46, color: 'var(--accent)' },
  { label: 'Asistencia', value: 22, color: 'var(--green)' },
  { label: 'Participación en clase', value: 18, color: 'var(--cyan)' },
  { label: 'Avance académico', value: 14, color: 'var(--violet)' },
];

/* ---------- Insignias (editables, persistidas) ---------- */
const ENGAGE_BADGES_SEED = [
  { _id: 'bdg-01', name: 'Racha de 21 días', icon: 'zap', tone: 'amber', crit: '21 días consecutivos con actividad', otorgadas: 38 },
  { _id: 'bdg-02', name: 'Lector estrella', icon: 'bookOpen', tone: 'violet', crit: '4 misiones de lectura completadas', otorgadas: 64 },
  { _id: 'bdg-03', name: 'Mente científica', icon: 'compass', tone: 'green', crit: 'Proyecto de ciencias destacado', otorgadas: 21 },
  { _id: 'bdg-04', name: '100% asistencia', icon: 'checkCircle', tone: 'blue', crit: 'Mes completo sin faltas ni retardos', otorgadas: 187 },
  { _id: 'bdg-05', name: 'Tutor par', icon: 'users', tone: 'cyan', crit: 'Acompañó a un compañero en refuerzo', otorgadas: 12 },
  { _id: 'bdg-06', name: 'Campeón mate', icon: 'hash', tone: 'red', crit: 'Top 3 en reto de matemáticas', otorgadas: 9 },
];
if (!window.DB.badges) window.DB.badges = ENGAGE_FRESH ? ENGAGE_BADGES_SEED.map(b => ({ ...b, otorgadas: 0 })) : ENGAGE_BADGES_SEED;

/* ---------- Tienda de puntos (recompensas) ---------- */
const ENGAGE_REWARDS_SEED = [
  { _id: 'rw-01', name: 'Día sin uniforme', cost: 500, canjes: 96, stock: null, icon: 'star' },
  { _id: 'rw-02', name: 'Pase a primera fila del festival', cost: 800, canjes: 31, stock: 40, icon: 'flag' },
  { _id: 'rw-03', name: '30 min extra de cancha (grupal)', cost: 700, canjes: 18, stock: null, icon: 'zap', grupal: true },
  { _id: 'rw-04', name: 'Kit de papelería edición Piaget', cost: 650, canjes: 24, stock: 16, icon: 'edit' },
  { _id: 'rw-05', name: 'Almuerzo con la dirección', cost: 1200, canjes: 6, stock: 8, icon: 'heart' },
];
if (!window.DB.rewards) window.DB.rewards = ENGAGE_FRESH ? ENGAGE_REWARDS_SEED.map(r => ({ ...r, canjes: 0 })) : ENGAGE_REWARDS_SEED;

/* ---------- Retos de la temporada (persistidos) ---------- */
const ENGAGE_RETOS_SEED = [];
if (!window.DB.engage_retos) window.DB.engage_retos = ENGAGE_RETOS_SEED;

/* ---------- Banco del generador de retos ---------- */
const ENGAGE_RETO_BANK = {
  'Asistencia': [
    { title: 'Madrugadores de oro', desc: 'Cada día sin retardos suma una estrella al grupo; 5 estrellas desbloquean XP grupal y un periodo de juego libre.', steps: ['Registro automático con Control de Accesos', 'Tablero diario de estrellas por grupo', 'Cierre semanal con XP grupal'], xp: 250, dur: '1 semana' },
    { title: 'Asistencia perfecta, semana épica', desc: 'Los grupos con 100% de asistencia semanal entran a la rifa del trofeo itinerante de la temporada.', steps: ['Corte diario de asistencia', 'Tabla de grupos elegibles', 'Rifa en la asamblea del viernes'], xp: 300, dur: '2 semanas' },
  ],
  'Lectura': [
    { title: 'Constelación lectora', desc: 'Cada libro terminado enciende una estrella en el mural del grupo. La meta: completar la constelación de la temporada.', steps: ['Registro de lecturas con reseña corta', 'Estrella en el mural por libro', 'Constelación completa = insignia grupal'], xp: 350, dur: '1 mes' },
    { title: 'Duelo de reseñas relámpago', desc: 'Reseñas de 60 segundos en video; el grupo vota las 3 más persuasivas de la semana.', steps: ['Grabar reseña de 1 minuto', 'Votación entre grupos hermanos', 'Top 3 semanal con XP extra'], xp: 280, dur: '2 semanas' },
  ],
  'Convivencia': [
    { title: 'Misión amabilidad secreta', desc: 'Cada alumno recibe un compañero secreto al que debe ayudar durante la semana sin ser descubierto.', steps: ['Asignación secreta por sorteo', 'Registro anónimo de actos de apoyo', 'Revelación y reconocimiento el viernes'], xp: 220, dur: '1 semana' },
    { title: 'Embajadores del recreo', desc: 'Equipos rotativos organizan juegos inclusivos en el recreo para que nadie se quede fuera.', steps: ['Equipo embajador por día', 'Kit de juegos cooperativos', 'Bitácora de participación'], xp: 260, dur: '2 semanas' },
  ],
  'STEM': [
    { title: 'Reto del puente de papel', desc: 'Construir el puente de papel que soporte más peso usando solo 20 hojas y cinta. Física aplicada por equipos.', steps: ['Diseño y boceto del puente', 'Construcción con material limitado', 'Prueba de carga ante el grupo'], xp: 400, dur: '2 semanas' },
    { title: 'Olimpiada de cálculo mental', desc: 'Series cronometradas por niveles; cada grupo acumula puntos con sus 5 mejores marcas diarias.', steps: ['Series diarias adaptativas', 'Top 5 del grupo suma a la copa', 'Final entre grupos punteros'], xp: 380, dur: '1 semana' },
  ],
  'Comunidad': [
    { title: 'Guardianes del campus', desc: 'Brigadas por grupo adoptan un espacio de la escuela y lo mejoran durante la temporada.', steps: ['Adopción de espacio por brigada', 'Plan de mejora con evidencias', 'Recorrido de evaluación final'], xp: 320, dur: '1 mes' },
    { title: 'Festival de talentos exprés', desc: 'Cada grupo monta un número de 3 minutos; el XP se gana por participación, no por ganar.', steps: ['Inscripción de números por grupo', 'Ensayo con lista de cotejo', 'Festival y XP por participación'], xp: 300, dur: '2 semanas' },
  ],
};

/* ---------- Nivel a partir de XP ---------- */
function engageLevel(xp) {
  const lvl = Math.max(1, Math.floor(Math.sqrt(xp / 60)));
  const base = 60 * lvl * lvl, next = 60 * (lvl + 1) * (lvl + 1);
  return { lvl, pct: Math.round((xp - base) / (next - base) * 100), next: next - xp };
}

/* ---------- Actividad reciente determinista por alumno ---------- */
const ENGAGE_ACT_BANK = [
  ['rocket', 'Completó la misión «Reto de álgebra»', '+120 XP'],
  ['checkCircle', 'Semana de asistencia perfecta', '+80 XP'],
  ['star', 'Reconocimiento del docente por participación', '+50 XP'],
  ['bookOpen', 'Entregó reseña del libro del trimestre', '+90 XP'],
  ['zap', 'Extendió su racha de actividad', '+25 XP'],
  ['users', 'Apoyó a un compañero como tutor par', '+60 XP'],
];
function engageActivity(name) {
  const seed = engageHash(name);
  return Array.from({ length: 4 }, (_, i) => {
    const a = ENGAGE_ACT_BANK[(seed + i * 5) % ENGAGE_ACT_BANK.length];
    return { icon: a[0], text: a[1], xp: a[2], when: i === 0 ? 'hoy' : i === 1 ? 'ayer' : 'hace ' + (i + 1) + ' días' };
  });
}

/* Insignias ganadas por alumno (deterministas, desde el catálogo) */
function engageBadgesOf(name) {
  const seed = engageHash(name);
  const all = window.DB.badges || [];
  /* Solo se muestran insignias obtenidas si el alumno tiene actividad real en Engage
     (aparece en el leaderboard). Sin actividad, no hay insignias ganadas. */
  const lb = (window.DB.leaderboard || []).find(p => p.name === name);
  if (!lb || !all.length) return [];
  const n = 2 + (seed % 3);
  return Array.from({ length: Math.min(n, all.length) }, (_, i) => all[(seed + i * 7) % all.length])
    .filter((b, i, arr) => arr.findIndex(x => x._id === b._id) === i);
}

Object.assign(window, {
  ENGAGE_SEASON, ENGAGE_TREND, ENGAGE_CUP, ENGAGE_PLAYERS, ENGAGE_DROPS,
  ENGAGE_XP_SOURCES, ENGAGE_RETO_BANK, ENGAGE_BADGES_SEED,
  engageHash, engageLevel, engageActivity, engageBadgesOf,
});

/* views_engage.jsx — Engage: gamificación, salud del compromiso, copa de grupos, tienda e insignias */

const ENGAGE_FOCO_VIS = {
  'Asistencia': { tone: 'green', icon: 'clock' },
  'Lectura': { tone: 'violet', icon: 'bookOpen' },
  'Convivencia': { tone: 'amber', icon: 'heart' },
  'STEM': { tone: 'blue', icon: 'compass' },
  'Comunidad': { tone: 'cyan', icon: 'users' },
};
const engageUid = () => (crypto.randomUUID ? crypto.randomUUID() : 'eng-' + Math.random().toString(36).slice(2));

/* ============================================================
   Wizard: generar reto de temporada con IA
   ============================================================ */
function EngageRetoWizard({ open, foco: focoInit, onClose }) {
  const FOCOS = Object.keys(ENGAGE_RETO_BANK);
  const _sc = window.docScope && window.docScope();
  const SCOPES = (_sc && _sc.groups && _sc.groups.length)
    ? (_sc.groups.length > 1 ? ['Todos mis grupos', ..._sc.groups] : _sc.groups)
    : ['Toda la escuela', 'Preescolar', 'Primaria', 'Primaria alta', 'Secundaria'];
  const [step, setStep] = React.useState('form');
  const [foco, setFoco] = React.useState('Asistencia');
  const [scope, setScope] = React.useState(SCOPES[0]);
  const [goal, setGoal] = React.useState('');
  const [variant, setVariant] = React.useState(0);

  React.useEffect(() => { if (open) { setStep('form'); setVariant(0); setGoal(''); if (focoInit) setFoco(focoInit); } }, [open, focoInit]);

  const bank = ENGAGE_RETO_BANK[foco];
  const proposal = bank[variant % bank.length];
  const vis = ENGAGE_FOCO_VIS[foco];
  const t = window.TONE[vis.tone];
  const durDays = { '1 semana': 7, '2 semanas': 14, '1 mes': 30 }[proposal.dur] || 14;

  const generate = (v) => { setStep('thinking'); setVariant(v); setTimeout(() => setStep('proposal'), 1300); };
  const save = () => {
    Store.add('engage_retos', {
      _id: engageUid(), title: proposal.title, scope, desc: proposal.desc,
      endsDays: durDays, xp: proposal.xp, progress: 0, tone: vis.tone, icon: vis.icon, isNew: true,
      steps: proposal.steps || [], foco,
      groups: (_sc && _sc.groups && _sc.groups.length) ? _sc.groups : [],
    });
    Store.log('Copilot', 'publicó el reto «' + proposal.title + '» para ' + scope.toLowerCase(), 'zap');
    toast('Reto publicado para ' + scope.toLowerCase(), 'ok');
    onClose();
  };

  const footer = step === 'form'
    ? <>
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn primary" onClick={() => generate(0)}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Generar con IA</button>
    </>
    : step === 'proposal'
      ? <>
        <button className="btn" onClick={() => generate(variant + 1)}><Icon name="refresh" size={15} className="btn-ico" />Regenerar</button>
        <button className="btn primary" onClick={save}><Icon name="send" size={15} className="btn-ico" />Publicar reto</button>
      </>
      : null;

  return (
    <Modal open={open} title="Generar reto de temporada" onClose={onClose} width={560} footer={footer}>
      {step === 'form' && (
        <>
          <Field label="Foco del reto">
            <div className="row" style={{ flexWrap: 'wrap', gap: 7 }}>
              {FOCOS.map(f => (
                <button key={f} className={'chip-btn' + (foco === f ? '' : ' plain')} onClick={() => setFoco(f)}>{f}</button>
              ))}
            </div>
          </Field>
          <Field label="Alcance">
            <SelectInput value={scope} onChange={e => setScope(e.target.value)} options={SCOPES} />
          </Field>
          <Field label="Objetivo u ocasión (opcional)">
            <TextArea rows={2} placeholder="Ej. cerrar la temporada con un evento que integre a los grupos rezagados…" value={goal} onChange={e => setGoal(e.target.value)} style={{ height: 'auto', padding: '10px 13px', resize: 'none' }} />
          </Field>
          <div className="row center gap-8 faint" style={{ fontSize: 12.5 }}>
            <Icon name="spark" size={14} fill="currentColor" style={{ color: 'var(--accent)' }} />
            La IA usará la participación reciente y la tabla de la copa para calibrar el reto.
          </div>
        </>
      )}
      {step === 'thinking' && (
        <div className="col center gap-12" style={{ padding: '28px 0', textAlign: 'center' }}>
          <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name="spark" size={20} fill="currentColor" /></div>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>Diseñando el reto…</div>
          <div className="faint" style={{ fontSize: 12.5 }}>Foco: {foco.toLowerCase()} · {scope}</div>
          <div className="typing" style={{ marginTop: 4 }}><span></span><span></span><span></span></div>
        </div>
      )}
      {step === 'proposal' && (
        <>
          <div className="row center gap-8 faint" style={{ fontSize: 12 }}>
            <Icon name="spark" size={13} fill="currentColor" style={{ color: 'var(--accent)' }} />
            Propuesta para {scope.toLowerCase()} · calibrada con la copa de la temporada
          </div>
          <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="row between center">
              <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={vis.icon} size={20} /></div>
              <div className="row center gap-6">
                <Badge tone="gray">{proposal.dur}</Badge>
                <Badge tone="amber"><Icon name="zap" size={12} fill="currentColor" />{proposal.xp} XP</Badge>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{proposal.title}</div>
              <div className="faint" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.55 }}>{proposal.desc}</div>
            </div>
            <div className="col gap-7" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              {proposal.steps.map((s, i) => (
                <div key={i} className="row center gap-9" style={{ fontSize: 13 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 999, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ============================================================
   Modal: crear insignia propia
   ============================================================ */
function EngageBadgeModal({ open, onClose }) {
  const ICONS = ['zap', 'star', 'bookOpen', 'compass', 'heart', 'users', 'shield', 'target', 'flag', 'globe', 'rocket', 'checkCircle'];
  const TONES = ['blue', 'green', 'amber', 'red', 'violet', 'cyan'];
  const [name, setName] = React.useState('');
  const [icon, setIcon] = React.useState('star');
  const [tone, setTone] = React.useState('violet');
  const [crit, setCrit] = React.useState('');
  React.useEffect(() => { if (open) { setName(''); setIcon('star'); setTone('violet'); setCrit(''); } }, [open]);
  const t = window.TONE[tone];

  const save = () => {
    if (!name.trim()) { toast('Escribe el nombre de la insignia', 'warn'); return; }
    Store.add('badges', { _id: engageUid(), name: name.trim(), icon, tone, crit: crit.trim() || 'Criterio por definir', otorgadas: 0, isNew: true });
    Store.log('Dirección', 'creó la insignia «' + name.trim() + '»', 'star');
    toast('Insignia creada', 'ok');
    onClose();
  };

  return (
    <Modal open={open} title="Nueva insignia" onClose={onClose} width={520}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}><Icon name="star" size={15} className="btn-ico" />Crear insignia</button></>}>
      <div className="row center gap-12" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: t.bg, color: t.c, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={icon} size={20} /></div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{name.trim() || 'Vista previa'}</div>
          <div className="faint" style={{ fontSize: 12 }}>{crit.trim() || 'Así se verá la insignia en el catálogo'}</div>
        </div>
      </div>
      <Field label="Nombre">
        <TextInput placeholder="Ej. Corazón Piaget" value={name} onChange={e => setName(e.target.value)} />
      </Field>
      <Field label="Icono">
        <div className="row" style={{ flexWrap: 'wrap', gap: 7 }}>
          {ICONS.map(ic => (
            <button key={ic} onClick={() => setIcon(ic)} style={{
              width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', cursor: 'pointer',
              background: icon === ic ? t.bg : 'var(--surface-2)', color: icon === ic ? t.c : 'var(--text-muted)',
              border: icon === ic ? '1.5px solid ' + t.c : '1px solid var(--border)',
            }}><Icon name={ic} size={17} /></button>
          ))}
        </div>
      </Field>
      <Field label="Color">
        <div className="row gap-8">
          {TONES.map(tn => {
            const tc = window.TONE[tn];
            return <button key={tn} onClick={() => setTone(tn)} style={{
              width: 28, height: 28, borderRadius: 999, cursor: 'pointer', background: tc.c,
              border: tone === tn ? '3px solid ' + tc.bg : '3px solid transparent',
              outline: tone === tn ? '1.5px solid ' + tc.c : 'none',
            }}></button>;
          })}
        </div>
      </Field>
      <Field label="Criterio para otorgarla">
        <TextArea rows={2} placeholder="Ej. demostrar empatía sobresaliente con la comunidad…" value={crit} onChange={e => setCrit(e.target.value)} style={{ height: 'auto', padding: '10px 13px', resize: 'none' }} />
      </Field>
    </Modal>
  );
}

/* ============================================================
   Drawer: perfil de compromiso del alumno
   ============================================================ */
function EngagePlayerDrawer({ player, onClose, go }) {
  const open = !!player;
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  let body = null;
  if (player) {
    const lvl = engageLevel(player.xp);
    const acts = engageActivity(player.name);
    const badges = engageBadgesOf(player.name);
    const reconocer = () => {
      Store.log('Dirección', 'reconoció públicamente a ' + player.name, 'star');
      toast('Reconocimiento enviado a ' + player.name, 'ok');
    };
    const mision = () => {
      window.MISSION_PREFILL = {
        groups: [player.grade], topic: 'Reenganche: misión motivante a la medida de ' + player.name + ' (' + player.grade + ')',
        origin: 'Engage · ' + player.name,
      };
      onClose(); go('ai-missions');
    };
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="row center gap-12" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <Avatar name={player.name} size={46} />
          <div className="grow">
            <div style={{ fontWeight: 600, fontSize: 16 }}>{player.name}</div>
            <div className="faint" style={{ fontSize: 12.5 }}>{player.grade} · última actividad: {player.last}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="row between center">
              <span style={{ fontWeight: 600, fontSize: 14 }}>Nivel {lvl.lvl}</span>
              <span className="faint" style={{ fontSize: 12 }}>{fmtNum(lvl.next)} XP para nivel {lvl.lvl + 1}</span>
            </div>
            <Bar value={lvl.pct} height={8} />
            <div className="row gap-16" style={{ marginTop: 4 }}>
              <div><div className="faint" style={{ fontSize: 11.5 }}>XP total</div><div className="font-display tnum" style={{ fontWeight: 700, fontSize: 18 }}>{fmtNum(player.xp)}</div></div>
              <div><div className="faint" style={{ fontSize: 11.5 }}>Racha</div><div className="font-display tnum" style={{ fontWeight: 700, fontSize: 18, color: player.streak > 0 ? 'var(--amber)' : 'var(--text-faint)' }}>{player.streak}d</div></div>
              <div><div className="faint" style={{ fontSize: 11.5 }}>Esta semana</div><div className="font-display tnum" style={{ fontWeight: 700, fontSize: 18, color: player.drop ? 'var(--red)' : 'var(--green)' }}>{player.drop ? '−' + player.drop + '%' : '+' + fmtNum(player.deltaSem || 0)}</div></div>
            </div>
          </div>

          {player.drop && (
            <div className="ai-panel">
              <div className="insight" style={{ borderTop: 'none' }}>
                <div className="insight-ico" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}><Icon name="alert" size={15} /></div>
                <div className="insight-body">
                  <div className="insight-title">Caída de actividad del {player.drop}%</div>
                  <div className="insight-text">{player.cause}</div>
                  <div className="insight-actions">
                    <button className="chip-btn" onClick={mision}>Misión a la medida</button>
                    <button className="chip-btn plain" onClick={() => toast('Aviso enviado a la familia', 'ok')}>Avisar a familia</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {player.streakRisk && (
            <div className="ai-panel">
              <div className="insight" style={{ borderTop: 'none' }}>
                <div className="insight-ico" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon name="zap" size={15} fill="currentColor" /></div>
                <div className="insight-body">
                  <div className="insight-title">Racha de {player.streak} días en riesgo</div>
                  <div className="insight-text">Sin actividad registrada hoy; la racha se rompe al cierre del día. Un reconocimiento a tiempo suele reactivarla.</div>
                  <div className="insight-actions">
                    <button className="chip-btn" onClick={reconocer}>Reconocer ahora</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Insignias</div>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              {badges.map(b => {
                const bt = window.TONE[b.tone] || window.TONE.blue;
                return (
                  <span key={b._id} className="row center gap-6" style={{ background: bt.bg, color: bt.c, borderRadius: 999, padding: '5px 11px 5px 7px', fontSize: 12, fontWeight: 600 }}>
                    <Icon name={b.icon} size={13} />{b.name}
                  </span>
                );
              })}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Actividad reciente</div>
            <div className="card">
              {acts.map((a, i) => (
                <div className="lrow" key={i} style={{ padding: '10px 14px' }}>
                  <div className="insight-ico" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', width: 30, height: 30 }}><Icon name={a.icon} size={14} /></div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{a.text}</div>
                    <div className="faint" style={{ fontSize: 11 }}>{a.when}</div>
                  </div>
                  <span className="tnum" style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>{a.xp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="row gap-8" style={{ padding: '14px 22px', borderTop: '1px solid var(--border)' }}>
          <button className="btn primary grow" style={{ justifyContent: 'center' }} onClick={reconocer}><Icon name="star" size={15} className="btn-ico" />Reconocer públicamente</button>
          <button className="btn" onClick={mision}><Icon name="rocket" size={15} className="btn-ico" />Misión a la medida</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={'drawer-scrim' + (open ? ' open' : '')} onClick={onClose} />
      <aside className={'drawer' + (open ? ' open' : '')} style={{ width: 440 }} aria-hidden={!open}>{body}</aside>
    </>
  );
}

Object.assign(window, { EngageRetoWizard, EngageBadgeModal, EngagePlayerDrawer, ENGAGE_FOCO_VIS, engageUid });

/* views_engage.jsx — Engage: vista principal (temporada, KPIs, tendencia, copa, líderes, tienda, insignias) */

function EngageRetoTrack({ retoId, onClose }) {
  useStore();
  const r = (DB.engage_retos || []).find(x => x._id === retoId);
  const open = !!r;
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  let body = null;
  if (r) {
    const t = window.TONE[r.tone] || window.TONE.blue;
    const parts = (DB.engageParticipations || []).filter(p => p.retoId === r._id)
      .sort((a, b) => (b.progress || 0) - (a.progress || 0));
    const avg = parts.length ? Math.round(parts.reduce((a, p) => a + (p.progress || 0), 0) / parts.length) : 0;
    const completos = parts.filter(p => (p.progress || 0) >= 100).length;
    body = (
      <>
        <div className="row center between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="row center gap-12">
            <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={r.icon || 'zap'} size={19} /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15.5, fontFamily: 'var(--font-display)' }}>{r.title}</div>
              <div className="faint" style={{ fontSize: 12 }}>{r.scope} · termina en {r.endsDays}d</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { label: 'Participan', value: String(parts.length), tone: 'blue' },
              { label: 'Avance prom.', value: avg + '%', tone: 'violet' },
              { label: 'Completaron', value: String(completos), tone: 'green' },
            ].map((k, i) => { const tt = window.TONE[k.tone]; return (
              <div className="card kpi" key={i} style={{ padding: 12 }}><div className="kpi-label">{k.label}</div><div className="kpi-value tnum" style={{ color: tt.c }}>{k.value}</div></div>
            ); })}
          </div>
          <p className="faint" style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{r.desc}</p>
          <div>
            <div className="card-title" style={{ marginBottom: 8 }}><Icon name="users" className="ico" size={16} />Seguimiento por estudiante</div>
            {parts.length ? (
              <div>
                {parts.map((p, i) => (
                  <div key={p._id} className="row center gap-10" style={{ padding: '9px 0', borderBottom: i < parts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <Avatar name={p.student} size={30} />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="row between center" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.student} <span className="faint" style={{ fontWeight: 400 }}>· {p.group}</span></span>
                        <span className="tnum faint" style={{ fontSize: 11.5 }}>{p.fecha}</span>
                      </div>
                      <Bar value={p.progress || 0} color={t.c} height={5} />
                    </div>
                    {(p.progress || 0) >= 100
                      ? <Badge tone="green" dot>Completado</Badge>
                      : <span className="tnum" style={{ fontSize: 12, fontWeight: 600, width: 34, textAlign: 'right' }}>{p.progress || 0}%</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="row center gap-7" style={{ padding: '11px 12px', borderRadius: 10, background: 'var(--amber-soft)', border: '1px dashed var(--amber)', fontSize: 12.5, color: 'var(--amber)' }}>
                <Icon name="alert" size={14} />Aún no hay estudiantes participando en este reto.
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className={'drawer-scrim' + (open ? ' open' : '')} onClick={onClose} />
      <aside className={'drawer' + (open ? ' open' : '')} style={{ width: 460 }} aria-hidden={!open}>{body}</aside>
    </>
  );
}

function Engage({ go, openCopilot }) {
  useStore();
  const [wizard, setWizard] = React.useState({ open: false, foco: null });
  const [badgeOpen, setBadgeOpen] = React.useState(false);
  const [player, setPlayer] = React.useState(null);
  const [retoTrack, setRetoTrack] = React.useState(null);

  const sc = window.docScope && window.docScope();
  const inScope = (g) => !sc || (window.docAllowsGroup ? window.docAllowsGroup(g) : true);
  const retos = (DB.engage_retos || []).filter(r => !sc || r.scope === 'Todos mis grupos' || inScope(r.scope));
  const badges = DB.badges || [];
  const rewards = DB.rewards || [];
  const S = ENGAGE_SEASON;
  const CUP = ENGAGE_CUP.filter(c => inScope(c.g));
  const PLAYERS = ENGAGE_PLAYERS.filter(p => inScope(p.grade));
  const DROPS = ENGAGE_DROPS.filter(d => inScope(d.grade));
  const maxPts = CUP.length ? CUP[0].pts : 0;
  const lead = CUP[0] || null, second = CUP[1] || null;
  const gapPct = (lead && second) ? Math.round((lead.pts - second.pts) / second.pts * 100) : 0;
  const totalCanjes = rewards.reduce((a, r) => a + (r.canjes || 0), 0);
  const medal = ['var(--amber)', 'oklch(0.7 0.02 264)', 'oklch(0.6 0.1 50)'];
  const streakRisk = PLAYERS.find(p => p.streakRisk);

  /* KPIs derivados de la actividad real de la temporada */
  const partWk = ENGAGE_TREND.participacion[ENGAGE_TREND.participacion.length - 1] || 0;
  const xpWk = PLAYERS.reduce((a, p) => a + (p.deltaSem || 0), 0);
  const rachasAct = PLAYERS.filter(p => (p.streak || 0) >= 7).length;
  const kpis = [
    { label: 'Participación semanal', value: partWk + '%', delta: 0, sub: 'vs sem anterior', icon: 'users', tone: 'blue' },
    { label: 'XP otorgado (sem)', value: xpWk ? fmtShort(xpWk) : '0', delta: 0, sub: 'todas las fuentes', icon: 'zap', tone: 'amber' },
    { label: 'Rachas activas', value: String(rachasAct), delta: 0, sub: '7 días o más', icon: 'trendUp', tone: 'violet' },
    { label: 'Alumnos desenganchados', value: String(DROPS.length), delta: 0, bad: true, sub: 'caída > 40%', icon: 'alert', tone: 'red' },
  ];

  const retoMenu = (r) => [
    { icon: 'clock', label: 'Extender 7 días', onClick: () => { Store.update('engage_retos', r._id, { endsDays: r.endsDays + 7 }); toast('Reto extendido 7 días', 'ok'); } },
    { icon: 'checkCircle', label: 'Finalizar y premiar', onClick: () => { Store.remove('engage_retos', r._id); toast('Reto finalizado · XP repartido', 'ok'); } },
    { icon: 'trash', label: 'Archivar', danger: true, onClick: () => { Store.remove('engage_retos', r._id); toast('Reto archivado', 'info'); } },
  ];

  return (
    <div className="content-inner">
      <PageHead eyebrow="Principal" title="Engage" desc="Salud del compromiso y gamificación de la comunidad estudiantil.">
        <button className="btn" onClick={() => setBadgeOpen(true)}><Icon name="star" size={15} className="btn-ico" />Nueva insignia</button>
        <button className="btn primary" onClick={() => setWizard({ open: true, foco: null })}><Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Generar reto con IA</button>
      </PageHead>

      {/* Temporada y retos activos */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="row center gap-12" style={{ padding: '16px 20px 14px' }}>
          <div className="kpi-ico" style={{ background: 'var(--violet-soft)', color: 'var(--violet)', marginBottom: 0 }}><Icon name="award" size={19} /></div>
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="row center gap-9">
              <span style={{ fontWeight: 600, fontSize: 15 }}>{S.name}</span>
              <Badge tone="violet">{S.daysLeft} días restantes</Badge>
            </div>
            <div className="faint" style={{ fontSize: 12.5, marginTop: 1 }}>Semana {S.week} de {S.totalWeeks} · {S.endsLabel} · {retos.length} retos activos</div>
          </div>
          <div style={{ width: 180 }}><Bar value={S.week / S.totalWeeks * 100} color="var(--violet)" height={8} /></div>
        </div>
        <div>
          {retos.map(r => {
            const t = window.TONE[r.tone] || window.TONE.blue;
            const parts = (DB.engageParticipations || []).filter(p => p.retoId === r._id);
            const avg = parts.length ? Math.round(parts.reduce((a, p) => a + (p.progress || 0), 0) / parts.length) : 0;
            const completos = parts.filter(p => (p.progress || 0) >= 100).length;
            return (
              <div className="lrow" key={r._id} style={{ borderTop: '1px solid var(--border)', borderBottom: 'none', cursor: 'pointer' }} onClick={() => setRetoTrack(r._id)}>
                <div className="insight-ico" style={{ background: t.bg, color: t.c, width: 34, height: 34 }}><Icon name={r.icon} size={16} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row center gap-8">
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{r.title}</span>
                    {r.isNew && <Badge tone="violet">Nuevo</Badge>}
                  </div>
                  <div className="faint" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.scope} · {r.desc}</div>
                </div>
                <Badge tone={parts.length ? 'blue' : 'gray'}><Icon name="users" size={12} />{parts.length}</Badge>
                <Badge tone="amber"><Icon name="zap" size={12} fill="currentColor" />{r.xp} XP</Badge>
                <span className="faint tnum" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>termina en {r.endsDays}d</span>
                <div style={{ width: 90 }}><Bar value={avg} color={t.c} height={6} /></div>
                <span className="tnum faint" style={{ fontSize: 11.5, width: 30, textAlign: 'right' }}>{avg}%</span>
                <span onClick={(e) => e.stopPropagation()}><RowMenu items={retoMenu(r)} /></span>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
        {kpis.map((k, i) => {
          const t = window.TONE[k.tone];
          return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum">{k.value}</div>
              <div className="kpi-foot"><Delta value={k.bad ? k.delta : k.delta} /><span className="muted">{k.sub}</span></div>
            </div>
          );
        })}
      </div>

      {/* Tendencia + Copilot */}
      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'start', marginBottom: 18 }}>
        <div className="card">
          <CardHead icon="trendUp" title="Tendencia del compromiso" sub="% de alumnos con actividad semanal · últimas 10 semanas"
            right={<Badge tone={ENGAGE_TREND.participacion[9] >= ENGAGE_TREND.meta ? 'green' : 'amber'}>meta {ENGAGE_TREND.meta}%</Badge>} />
          <div style={{ padding: '18px 20px' }}>
            <AreaChart labels={ENGAGE_TREND.labels} height={230} max={100}
              series={[
                { data: ENGAGE_TREND.participacion },
                { data: ENGAGE_TREND.labels.map(() => ENGAGE_TREND.meta), dashed: true, fill: false, color: 'var(--text-faint)' },
              ]} />
          </div>
        </div>

        <div className="ai-panel">
          <div className="ai-panel-head">
            <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
            <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>Copilot sugiere</div><div className="faint" style={{ fontSize: 11.5 }}>Salud del compromiso · hoy</div></div>
            <button className="chip-btn plain" onClick={openCopilot}>Abrir Copilot</button>
          </div>
          {DROPS.length === 0 && !streakRisk && (!lead || !second) && (
            <div className="insight">
              <div className="insight-ico" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}><Icon name="spark" size={15} /></div>
              <div className="insight-body">
                <div className="insight-title">Aún no hay actividad en la temporada</div>
                <div className="insight-text">Cuando inicies una temporada y los alumnos sumen XP, el Copilot mostrará aquí alertas de desenganche, rachas en riesgo y equilibrio de la copa.</div>
              </div>
            </div>
          )}
          {DROPS.length > 0 && (
          <div className="insight">
            <div className="insight-ico" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}><Icon name="alert" size={15} /></div>
            <div className="insight-body">
              <div className="insight-title">{DROPS.length} alumnos con caída fuerte de actividad</div>
              <div className="insight-text">{DROPS.map(d => d.name).join(', ')} bajaron más de 40% en dos semanas. El reenganche temprano evita que toque lo académico.</div>
              <div className="insight-actions">
                <button className="chip-btn" onClick={() => setPlayer(DROPS[0])}>Ver a {DROPS[0].name.split(' ')[0]}</button>
                <button className="chip-btn plain" onClick={() => toast('Plan de reenganche compartido con tutores', 'ok')}>Plan de reenganche</button>
              </div>
            </div>
          </div>
          )}
          {streakRisk && (
            <div className="insight">
              <div className="insight-ico" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon name="zap" size={15} fill="currentColor" /></div>
              <div className="insight-body">
                <div className="insight-title">Racha de {streakRisk.streak} días por romperse</div>
                <div className="insight-text"><b>{streakRisk.name}</b> no registra actividad hoy. Un reconocimiento a tiempo suele reactivar la racha más larga de la escuela.</div>
                <div className="insight-actions">
                  <button className="chip-btn" onClick={() => setPlayer(streakRisk)}>Ver perfil</button>
                </div>
              </div>
            </div>
          )}
          {lead && second && (
          <div className="insight">
            <div className="insight-ico" style={{ background: 'var(--cyan-soft)', color: 'var(--cyan)' }}><Icon name="award" size={15} /></div>
            <div className="insight-body">
              <div className="insight-title">La copa se está desequilibrando</div>
              <div className="insight-text"><b>{lead.g}</b> lidera con {gapPct}% de ventaja sobre <b>{second.g}</b>. Un reto comunitario con bonus para grupos rezagados mantiene a todos jugando.</div>
              <div className="insight-actions">
                <button className="chip-btn" onClick={() => setWizard({ open: true, foco: 'Comunidad' })}>Reto equilibrador</button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Copa + Fuentes de XP */}
      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'start', marginBottom: 18 }}>
        <div className="card">
          <CardHead icon="award" title="Copa de grupos" sub="Puntos de la temporada · misiones, asistencia y retos" right={<Badge tone="violet">{S.name.split('·')[0].trim()}</Badge>} />
          <div>
            {CUP.map((c, i) => (
              <div className="lrow" key={c.g}>
                <div style={{ width: 28, textAlign: 'center', fontWeight: 700, fontFamily: 'var(--font-display)', color: i < 3 ? medal[i] : 'var(--text-faint)', fontSize: 16, flexShrink: 0 }}>{i + 1}</div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row between center" style={{ marginBottom: 6 }}>
                    <span className="row center gap-8">
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{c.g}</span>
                      <span className="faint" style={{ fontSize: 11.5 }}>{c.nivel} · {c.alumnos} alumnos</span>
                    </span>
                    <span className="row center gap-8">
                      {c.delta !== 0 && (
                        <span className={'delta ' + (c.delta > 0 ? 'up' : 'down')}>
                          <Icon name={c.delta > 0 ? 'arrowUp' : 'arrowDown'} size={11} stroke={2.6} />{Math.abs(c.delta)}
                        </span>
                      )}
                      <span className="font-display tnum" style={{ fontWeight: 700, fontSize: 15 }}>{fmtNum(c.pts)}</span>
                    </span>
                  </div>
                  <Bar value={c.pts / maxPts * 100} color={i === 0 ? 'var(--amber)' : 'var(--accent)'} height={6} />
                </div>
              </div>
            ))}
            {!CUP.length && <div className="faint" style={{ fontSize: 12.5, padding: '18px 20px' }}>Sin grupos en competencia todavía.</div>}
          </div>
        </div>

        <div className="card">
          <CardHead icon="pie" title="Fuentes de XP" sub="Distribución del XP otorgado esta semana" />
          {ENGAGE_XP_SOURCES.length ? (
          <div className="row center gap-18" style={{ padding: '18px 20px' }}>
            <Donut size={150} thickness={20} segments={ENGAGE_XP_SOURCES.map(s => ({ value: s.value, color: s.color }))}
              center={<div style={{ textAlign: 'center' }}><div className="font-display tnum" style={{ fontWeight: 700, fontSize: 21 }}>{xpWk ? fmtShort(xpWk) : '0'}</div><div className="faint" style={{ fontSize: 10.5 }}>XP · semana</div></div>} />
            <div className="col gap-9 grow">
              {ENGAGE_XP_SOURCES.map(s => (
                <div className="row between center" key={s.label} style={{ fontSize: 12.5 }}>
                  <span className="row center gap-7"><span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block', flexShrink: 0 }}></span>{s.label}</span>
                  <span className="tnum" style={{ fontWeight: 600 }}>{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
          ) : (
            <div className="faint" style={{ fontSize: 12.5, padding: '18px 20px' }}>Aún no se otorga XP esta temporada.</div>
          )}
        </div>
      </div>

      {/* Líderes + Tienda e Insignias */}
      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <CardHead icon="users" title="Tabla de líderes" sub="Top estudiantes por XP de la temporada · clic para ver perfil" right={<Badge tone="violet">Este mes</Badge>} />
          <div>
            {PLAYERS.map((s, i) => {
              const lvl = engageLevel(s.xp);
              return (
                <button className="lrow clickable" key={s.name} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'inherit', font: 'inherit', borderBottom: i < PLAYERS.length - 1 ? '1px solid var(--border)' : 'none' }} onClick={() => setPlayer(s)}>
                  <div style={{ width: 28, textAlign: 'center', fontWeight: 700, fontFamily: 'var(--font-display)', color: i < 3 ? medal[i] : 'var(--text-faint)', fontSize: 16, flexShrink: 0 }}>{i + 1}</div>
                  <Avatar name={s.name} size={38} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.name}</div>
                    <div className="faint" style={{ fontSize: 12 }}>{s.grade} · Nivel {lvl.lvl}</div>
                  </div>
                  {s.streakRisk && <Badge tone="amber" dot>Racha en riesgo</Badge>}
                  <span className="row center gap-5 badge amber" style={{ marginRight: 4 }}><Icon name="zap" size={12} fill="currentColor" />{s.streak}d</span>
                  <span className="font-display tnum" style={{ fontWeight: 700, fontSize: 16 }}>{fmtNum(s.xp)}</span>
                </button>
              );
            })}
            {!PLAYERS.length && <div className="faint" style={{ fontSize: 12.5, padding: '18px 20px' }}>Sin estudiantes en la tabla de líderes todavía.</div>}
          </div>
        </div>

        <div className="col gap-16">
          <div className="card">
            <CardHead icon="cart" title="Tienda de puntos" sub={totalCanjes + ' canjes esta temporada'} />
            <div>
              {rewards.map(r => (
                <div className="lrow" key={r._id} style={{ padding: '10px 20px' }}>
                  <div className="insight-ico" style={{ background: 'var(--amber-soft)', color: 'var(--amber)', width: 32, height: 32 }}><Icon name={r.icon} size={15} /></div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}{r.grupal && <span className="faint" style={{ fontWeight: 400 }}> · grupal</span>}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>{r.canjes} canjes{r.stock != null ? ' · quedan ' + r.stock : ''}</div>
                  </div>
                  <Badge tone="amber"><Icon name="zap" size={11} fill="currentColor" />{fmtNum(r.cost)}</Badge>
                  <RowMenu items={[
                    { icon: 'sliders', label: 'Ajustar costo', onClick: () => toast('Editor de recompensa', 'info') },
                    { icon: 'clock', label: 'Pausar canjes', onClick: () => toast('Canjes pausados', 'info') },
                  ]} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <CardHead icon="star" title="Insignias de la escuela" sub={badges.length + ' en el catálogo'}
              right={<button className="btn sm" onClick={() => setBadgeOpen(true)}><Icon name="plus" size={14} className="btn-ico" />Nueva</button>} />
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 14, padding: '16px 20px' }}>
              {badges.map(b => {
                const t = window.TONE[b.tone] || window.TONE.blue;
                return (
                  <div key={b._id} className="col center gap-6" style={{ textAlign: 'center' }} title={b.crit}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: t.bg, color: t.c, display: 'grid', placeItems: 'center', position: 'relative' }}>
                      <Icon name={b.icon} size={20} />
                      {b.isNew && <span style={{ position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: 999, background: 'var(--violet)', border: '2px solid var(--surface)' }}></span>}
                    </div>
                    <span style={{ fontSize: 10.5, lineHeight: 1.2, fontWeight: 600 }}>{b.name}</span>
                    <span className="faint tnum" style={{ fontSize: 10 }}>{b.otorgadas} otorgadas</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <EngageRetoWizard open={wizard.open} foco={wizard.foco} onClose={() => setWizard({ open: false, foco: null })} />
      <EngageRetoTrack retoId={retoTrack} onClose={() => setRetoTrack(null)} />
      <EngageBadgeModal open={badgeOpen} onClose={() => setBadgeOpen(false)} />
      <EngagePlayerDrawer player={player} onClose={() => setPlayer(null)} go={go} />
    </div>
  );
}

Object.assign(window, { Engage });
