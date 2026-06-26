/* data.jsx — datos simulados para PIAGET AI */

/* ¿Ciclo reiniciado? Cuando está activo, la plataforma arranca vacía
   (sin egresos, ingresos, prospectos, accesos ni cifras del ciclo anterior),
   conservando configuración y catálogos. Lo activa el botón "Reiniciar ciclo". */
window.PIAGET_FRESH = (function () { try { return localStorage.getItem('piaget_fresh_cycle') === '1'; } catch (e) { return false; } })();

const DB = {
  school: { name: 'Colegio Piaget', campus: 'Campus Norte · CDMX', cycle: 'Ciclo 2025–2026' },

  user: { name: 'María Fernanda Ríos', role: 'Dirección General', initials: 'MF', email: 'direccion@jeanpiaget.mx' },

  /* ---------- KPIs dashboard ---------- */
  kpis: [
    { id: 'alumnos', label: 'Estudiantes activos', value: '1,284', icon: 'cap', tone: 'blue', delta: 3.2, foot: 'vs. ciclo anterior', spark: [1180, 1190, 1210, 1225, 1240, 1260, 1284] },
    { id: 'asistencia', label: 'Asistencia hoy', value: '94.6', unit: '%', icon: 'checkCircle', tone: 'green', delta: 1.1, foot: '1,215 presentes', spark: [91, 92, 90, 93, 94, 93.5, 94.6] },
    { id: 'ingresos', label: 'Ingresos del mes', value: '$4.82', unit: 'M', icon: 'wallet', tone: 'violet', delta: 6.4, foot: 'meta $4.5M', spark: [3.9, 4.1, 4.0, 4.3, 4.5, 4.6, 4.82] },
    { id: 'cartera', label: 'Cartera vencida', value: '$612', unit: 'k', icon: 'alert', tone: 'amber', delta: -8.3, foot: '142 familias', spark: [780, 760, 720, 700, 680, 650, 612], invert: true },
    { id: 'admisiones', label: 'Admisiones en proceso', value: '186', icon: 'funnel', tone: 'cyan', delta: 12.5, foot: '38 nuevos esta semana', spark: [120, 132, 145, 150, 165, 175, 186] },
  ],

  enrollTrend: {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'],
    series: [
      { name: 'Inscritos', data: [1180, 1195, 1210, 1218, 1232, 1248, 1265, 1284] },
      { name: 'Proyección IA', data: [1180, 1198, 1212, 1224, 1240, 1258, 1276, 1300], dashed: true, fill: false, color: 'var(--cyan)' },
    ],
  },

  attendanceByGrade: {
    labels: ['1°', '2°', '3°', '4°', '5°', '6°'],
    data: [96, 95, 94, 93, 95, 92],
  },

  financeMonthly: {
    labels: ['Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'],
    ingresos: [4.0, 4.3, 4.5, 4.6, 4.7, 4.82].map(v => v * 1e6),
    egresos: [3.2, 3.3, 3.4, 3.3, 3.5, 3.6].map(v => v * 1e6),
  },

  /* ---------- IA insights (dashboard) ---------- */
  insights: [
    { id: 1, tone: 'amber', icon: 'alert', title: '23 estudiantes en riesgo de deserción', text: 'El modelo detectó <b>23 alumnos</b> con baja asistencia y caída de calificaciones en las últimas 3 semanas. 9 son de prioridad alta.', actions: ['Ver lista', 'Generar plan'] },
    { id: 2, tone: 'green', icon: 'trendUp', title: 'Recaudación adelantada a la meta', text: 'Vas <b>+7.1%</b> sobre la meta mensual. A este ritmo cerrarás agosto en <b>$4.9M</b>, el mejor mes del ciclo.', actions: ['Ver finanzas'] },
    { id: 3, tone: 'blue', icon: 'funnel', title: 'Oportunidad en admisiones', text: '18 prospectos llevan +10 días sin contacto en la etapa <b>“Entrevista”</b>. Reactivarlos podría sumar <b>~$1.1M</b>.', actions: ['Ver pipeline', 'Asignar'] },
  ],

  alerts: [
    { tone: 'red', icon: 'alert', title: 'Morosidad crítica', text: '142 familias con +60 días de atraso', time: 'hace 12 min', go: 'cobros' },
    { tone: 'amber', icon: 'cap', title: 'Riesgo académico', text: '23 alumnos requieren intervención', time: 'hace 1 h', go: 'calificaciones' },
    { tone: 'blue', icon: 'calendar', title: 'Consejo técnico', text: 'Reunión de academia mañana 8:00', time: 'hace 3 h', go: 'comunicados' },
    { tone: 'green', icon: 'checkCircle', title: 'Cierre de nómina ok', text: 'Nómina de agosto procesada (148 colab.)', time: 'hace 5 h', go: 'finanzas' },
  ],

  activity: [
    { who: 'Laura Méndez', action: 'registró calificaciones de Matemáticas 5°B', time: '09:42', icon: 'book' },
    { who: 'Tesorería', action: 'concilió 38 pagos de colegiatura', time: '09:18', icon: 'wallet' },
    { who: 'Admisiones', action: 'movió a 6 familias a “Inscripción”', time: '08:55', icon: 'funnel' },
    { who: 'Dirección', action: 'publicó comunicado “Suspensión 16 sep”', time: '08:30', icon: 'megaphone' },
    { who: 'Coordinación', action: 'aprobó 12 justificantes de inasistencia', time: '08:11', icon: 'doc' },
  ],

  /* ---------- Académico ---------- */
  students: [],

  gradeDist: [
    { color: 'var(--green)', label: '9–10 Excelente', value: 412 },
    { color: 'var(--accent)', label: '8–8.9 Bueno', value: 498 },
    { color: 'var(--amber)', label: '7–7.9 Suficiente', value: 286 },
    { color: 'var(--red)', label: '<7 En riesgo', value: 88 },
  ],

  subjects: [
    { name: 'Matemáticas', avg: 8.1, trend: 0.3 },
    { name: 'Español', avg: 8.6, trend: 0.1 },
    { name: 'Ciencias', avg: 7.9, trend: -0.2 },
    { name: 'Inglés', avg: 8.9, trend: 0.4 },
    { name: 'Historia', avg: 8.3, trend: 0.0 },
    { name: 'Ed. Física', avg: 9.4, trend: 0.2 },
  ],

  /* ---------- Administrativo ---------- */
  staff: [],
  adminStats: [
    { label: 'Colaboradores', value: '148', icon: 'users', tone: 'blue' },
    { label: 'Grupos activos', value: '42', icon: 'layers', tone: 'cyan' },
    { label: 'Aulas / espacios', value: '56', icon: 'building', tone: 'violet' },
    { label: 'Trámites abiertos', value: '31', icon: 'doc', tone: 'amber' },
  ],
  processes: [
    { name: 'Reinscripciones 2026', progress: 72, due: '30 sep', owner: 'Control Escolar' },
    { name: 'Certificación SEP', progress: 45, due: '15 oct', owner: 'Dirección' },
    { name: 'Mantenimiento gimnasio', progress: 88, due: '22 sep', owner: 'Servicios' },
    { name: 'Auditoría de becas', progress: 30, due: '10 nov', owner: 'Finanzas' },
  ],

  /* ---------- Finanzas ---------- */
  finKpis: [
    { label: 'Ingresos del mes', value: '$4.82M', delta: 6.4, tone: 'green', icon: 'trendUp' },
    { label: 'Egresos del mes', value: '$3.60M', delta: 2.1, tone: 'blue', icon: 'wallet' },
    { label: 'Margen operativo', value: '25.3%', delta: 1.8, tone: 'violet', icon: 'pie' },
    { label: 'Cartera vencida', value: '$612k', delta: -8.3, tone: 'amber', icon: 'alert' },
  ],
  arAging: [
    { bucket: 'Por vencer', value: 1840000, color: 'var(--green)', n: 980 },
    { bucket: '1–30 días', value: 420000, color: 'var(--accent)', n: 210 },
    { bucket: '31–60 días', value: 286000, color: 'var(--amber)', n: 96 },
    { bucket: '+60 días', value: 326000, color: 'var(--red)', n: 142 },
  ],
  invoices: [
    { folio: 'COL-08421', family: 'Familia Hernández', concept: 'Colegiatura Ago', amount: 8500, status: 'pagado', due: '05 ago' },
    { folio: 'COL-08422', family: 'Familia Cruz', concept: 'Colegiatura Ago', amount: 7200, status: 'vencido', due: '05 ago' },
    { folio: 'COL-08423', family: 'Familia Ramos', concept: 'Colegiatura + transporte', amount: 9800, status: 'vencido', due: '05 ago' },
    { folio: 'COL-08424', family: 'Familia Torres', concept: 'Colegiatura Ago', amount: 8500, status: 'pagado', due: '05 ago' },
    { folio: 'COL-08425', family: 'Familia Vega', concept: 'Inscripción 2026', amount: 14500, status: 'pendiente', due: '12 ago' },
    { folio: 'COL-08426', family: 'Familia Núñez', concept: 'Colegiatura Ago', amount: 8500, status: 'pagado', due: '05 ago' },
  ],

  /* ---------- CRM y Admisiones ---------- */
  funnel: [
    { stage: 'Prospectos', value: 540, color: 'var(--accent)' },
    { stage: 'Contactados', value: 386, color: 'var(--cyan)' },
    { stage: 'Visita / Tour', value: 244, color: 'var(--violet)' },
    { stage: 'Entrevista', value: 168, color: 'oklch(0.6 0.15 330)' },
    { stage: 'Inscritos', value: 92, color: 'var(--green)' },
  ],
  leadSources: [
    { color: 'var(--accent)', label: 'Recomendación', value: 38 },
    { color: 'var(--cyan)', label: 'Redes sociales', value: 27 },
    { color: 'var(--violet)', label: 'Web / SEO', value: 19 },
    { color: 'var(--amber)', label: 'Eventos', value: 16 },
  ],
  leads: [],

  /* ---------- Comunicación ---------- */
  channels: [
    { label: 'App / Push', sent: 4820, open: 86, icon: 'phone', tone: 'blue' },
    { label: 'Correo', sent: 3120, open: 62, icon: 'mail', tone: 'violet' },
    { label: 'SMS', sent: 1240, open: 94, icon: 'message', tone: 'cyan' },
  ],
  announcements: [],

  /* ---------- BI ---------- */
  biKpis: [
    { label: 'Retención anual', value: '93.4%', delta: 1.2, tone: 'green' },
    { label: 'Costo por alumno', value: '$2,810', delta: -2.4, tone: 'blue' },
    { label: 'NPS familias', value: '+62', delta: 5.0, tone: 'violet' },
    { label: 'Ocupación de cupo', value: '88%', delta: 3.1, tone: 'cyan' },
  ],
  biEnrollVsCapacity: {
    labels: ['Kínder', '1°', '2°', '3°', '4°', '5°', '6°'],
    cupo: [180, 200, 200, 200, 200, 180, 180],
    inscritos: [156, 188, 192, 176, 184, 168, 160],
  },
  cohortRetention: [
    { year: 'Gen 2021', vals: [100, 96, 92, 89, 87] },
    { year: 'Gen 2022', vals: [100, 97, 94, 91, null] },
    { year: 'Gen 2023', vals: [100, 95, 93, null, null] },
    { year: 'Gen 2024', vals: [100, 98, null, null, null] },
  ],

  /* ---------- Copilot ---------- */
  copilotSuggestions: [
    '¿Qué alumnos están en riesgo de deserción?',
    'Resume las finanzas de agosto',
    'Redacta un comunicado de junta de padres',
    '¿Cómo va el funnel de admisiones?',
  ],
  agents: [
    { name: 'Alerta de deserción', description: 'Monitorea asistencia y notas; avisa cuando un alumno entra en riesgo.', tone: 'amber', icon: 'alert', runs: '23 detecciones', active: true },
    { name: 'Cobranza inteligente', description: 'Segmenta cartera vencida y dispara recordatorios personalizados.', tone: 'green', icon: 'wallet', runs: '142 mensajes', active: true },
    { name: 'Lead scoring', description: 'Prioriza prospectos por probabilidad de inscripción.', tone: 'violet', icon: 'target', runs: '540 evaluados', active: true },
    { name: 'Reportes automáticos', description: 'Genera y envía el reporte ejecutivo cada lunes 7:00.', tone: 'blue', icon: 'doc', runs: 'Próx: lun 7:00', active: false },
  ],

  copilotThread: [
    { role: 'user', text: '¿Qué grupos tienen el promedio más bajo este parcial?' },
    {
      role: 'ai', text: 'Analicé los 42 grupos del ciclo. Tres están por debajo del umbral de 7.5:',
      data: {
        type: 'list', items: [
          { k: '5° A', v: '7.1', tone: 'red', note: 'Matemáticas y Ciencias arrastran el promedio' },
          { k: '4° B', v: '7.3', tone: 'amber', note: 'Asistencia del 84%, correlación alta' },
          { k: '6° B', v: '7.4', tone: 'amber', note: 'Mejoró +0.2 vs. parcial anterior' },
        ]
      },
      foot: 'Sugiero un plan de tutoría focalizada en 5° A. ¿Lo genero?'
    },
  ],
};

window.DB_DEFAULTS = DB;
window.DB = DB;

/* ============ Datos de módulos nuevos ============ */
DB.accessLive = [
  { name: 'Diego Hernández', role: 'Estudiante', grade: '5° A', gate: 'Acceso Principal', dir: 'in', time: '07:42', method: 'QR', status: 'ok' },
  { name: 'Laura Méndez', role: 'Docente', grade: 'Matemáticas', gate: 'Acceso Personal', dir: 'in', time: '07:38', method: 'QR', status: 'ok' },
  { name: 'Familia Cruz', role: 'Visitante', grade: 'Cita admisiones', gate: 'Recepción', dir: 'in', time: '07:35', method: 'Manual', status: 'pendiente' },
  { name: 'Valentina Cruz', role: 'Estudiante', grade: '4° B', gate: 'Acceso Principal', dir: 'in', time: '07:31', method: 'QR', status: 'alerta' },
  { name: 'Carlos Ibáñez', role: 'Coordinador', grade: 'Primaria', gate: 'Acceso Personal', dir: 'in', time: '07:28', method: 'QR', status: 'ok' },
  { name: 'Camila Torres', role: 'Estudiante', grade: '2° B', gate: 'Acceso Principal', dir: 'in', time: '07:25', method: 'QR', status: 'ok' },
];
DB.accessQueue = [
  { name: 'Mateo Jiménez', role: 'Estudiante', grade: '6° A', motivo: 'Llegada tarde', wait: '2 min', tone: 'amber' },
  { name: 'Familia Ortiz', role: 'Visitante', grade: 'Sin cita', motivo: 'Verificar identidad', wait: '4 min', tone: 'red' },
  { name: 'Proveedor Bimbo', role: 'Proveedor', grade: 'Tiendita', motivo: 'Entrega programada', wait: '1 min', tone: 'cyan' },
];

/* ---- Dashboard de Accesos: datos enriquecidos ---- */
/* Presencia por nivel (suma ≈ 1,176 dentro del campus) */
DB.accessByLevel = [
  { level: 'Preescolar', inside: 142, total: 156, tone: 'cyan' },
  { level: 'Primaria', inside: 720, total: 776, tone: 'blue' },
  { level: 'Secundaria', inside: 314, total: 332, tone: 'violet' },
];
/* Ocupación por área / edificio */
DB.accessAreas = [
  { area: 'Aulas Primaria', inside: 640, cap: 800, icon: 'cap', tone: 'blue' },
  { area: 'Aulas Secundaria', inside: 290, cap: 360, icon: 'cap', tone: 'violet' },
  { area: 'Biblioteca', inside: 64, cap: 120, icon: 'bookOpen', tone: 'cyan' },
  { area: 'Laboratorios', inside: 48, cap: 90, icon: 'sliders', tone: 'green' },
  { area: 'Gimnasio / Deportivo', inside: 86, cap: 150, icon: 'zap', tone: 'amber' },
  { area: 'Comedor', inside: 38, cap: 200, icon: 'store', tone: 'green' },
];
/* Visitantes activos en el campus */
DB.accessVisitors = [
  { name: 'Familia Cruz', reason: 'Cita de admisiones', host: 'Daniela Soto', badge: 'V-042', since: '07:35', tone: 'cyan' },
  { name: 'Proveedor Bimbo', reason: 'Entrega · Tiendita', host: 'Fernanda Lugo', badge: 'V-043', since: '08:10', tone: 'amber' },
  { name: 'Soporte CCTV', reason: 'Mantenimiento', host: 'Coordinación TI', badge: 'V-044', since: '08:25', tone: 'violet' },
  { name: 'Lic. Pérez · DIF', reason: 'Visita institucional', host: 'Dirección', badge: 'V-045', since: '09:02', tone: 'blue' },
];
/* Incidentes / alertas de seguridad */
DB.accessIncidents = [
  { title: 'Intento de acceso sin registro', person: 'No identificado', gate: 'Acceso Personal', time: '07:58', sev: 'alta', status: 'Abierto' },
  { title: 'Puerta forzada · sensor', person: '—', gate: 'Acceso Vehicular', time: '08:40', sev: 'alta', status: 'Abierto' },
  { title: 'Acceso denegado · QR vencido', person: 'Valentina Cruz · 4° B', gate: 'Acceso Principal', time: '07:31', sev: 'media', status: 'Atendido' },
  { title: 'Visitante sin cita', person: 'Familia Ortiz', gate: 'Recepción', time: '08:12', sev: 'baja', status: 'En revisión' },
];
/* Salidas anticipadas autorizadas */
DB.accessEarlyExits = [
  { name: 'Mateo Jiménez', grade: '6° A', reason: 'Cita médica', by: 'Mamá · L. Mendoza', time: '11:00', status: 'Autorizada' },
  { name: 'Sofía Aguilar', grade: 'Kínder', reason: 'Recoger anticipado', by: 'Papá · J. Aguilar', time: '12:30', status: 'Pendiente' },
  { name: 'Diego Hernández', grade: '5° A', reason: 'Torneo deportivo', by: 'Coordinación', time: '13:00', status: 'Autorizada' },
];
/* Pendientes de recoger (salida) */
DB.accessPickups = [
  { name: 'Regina Campos', grade: '5° A', tutor: 'Andrés Campos', since: '14:10', status: 'Esperando' },
  { name: 'Tomás Mendoza', grade: '1°', tutor: 'Laura Mendoza', since: '14:18', status: 'Notificado' },
  { name: 'Valentina Cruz', grade: '4° B', tutor: 'Roberto Cruz', since: '14:22', status: 'Esperando' },
];
/* Retardos del día */
DB.accessLate = [
  { name: 'Bruno Salas', grade: '2° A', min: 21, time: '08:01' },
  { name: 'Iker Mora', grade: '5° B', min: 15, time: '07:55' },
  { name: 'Mateo Jiménez', grade: '6° A', min: 12, time: '07:52' },
  { name: 'Ana Lugo', grade: '3° B', min: 8, time: '07:48' },
  { name: 'Camila Ríos', grade: '4° A', min: 5, time: '07:45' },
];
/* Pool para simular accesos en vivo */
DB.accessPool = [
  { name: 'Sofía Aguilar', role: 'Estudiante', grade: 'Kínder' },
  { name: 'Tomás Mendoza', role: 'Estudiante', grade: '1° A' },
  { name: 'Regina Campos', role: 'Estudiante', grade: '5° A' },
  { name: 'Bruno Salas', role: 'Estudiante', grade: '2° A' },
  { name: 'Iker Mora', role: 'Estudiante', grade: '5° B' },
  { name: 'Paola Rivas', role: 'Docente', grade: 'Ciencias' },
  { name: 'Jorge Patiño', role: 'Docente', grade: 'Ed. Física' },
  { name: 'Ana Lugo', role: 'Estudiante', grade: '3° B' },
  { name: 'Camila Ríos', role: 'Estudiante', grade: '4° A' },
  { name: 'Familia Ramos', role: 'Visitante', grade: 'Cita tutoría' },
  { name: 'Andrés Pacheco', role: 'Personal', grade: 'Servicios' },
  { name: 'Daniela Soto', role: 'Personal', grade: 'Admisiones' },
];
DB.products = [
  { name: 'Uniforme deportivo', sku: 'UNI-001', price: 480, stock: 34, cat: 'Uniformes', tone: 'blue', pos: true, img: '' },
  { name: 'Cuaderno profesional', sku: 'PAP-014', price: 45, stock: 210, cat: 'Papelería', tone: 'cyan', pos: true, img: '' },
  { name: 'Lunch saludable', sku: 'CAF-003', price: 65, stock: 88, cat: 'Cafetería', tone: 'green', pos: true, img: '' },
  { name: 'Agua 600ml', sku: 'CAF-001', price: 18, stock: 156, cat: 'Cafetería', tone: 'green', pos: true, img: '' },
  { name: 'Kit de arte', sku: 'PAP-022', price: 120, stock: 12, cat: 'Papelería', tone: 'cyan', pos: true, img: '' },
  { name: 'Playera del colegio', sku: 'UNI-008', price: 220, stock: 6, cat: 'Uniformes', tone: 'blue', pos: false, img: '' },
  { name: 'Snack natural', sku: 'CAF-011', price: 28, stock: 74, cat: 'Cafetería', tone: 'green', pos: true, img: '' },
  { name: 'Calculadora científica', sku: 'PAP-030', price: 350, stock: 19, cat: 'Papelería', tone: 'cyan', pos: true, img: '' },

  /* ----- Uniformes escolares · Lista de precios 25-26 ----- */
  { name: 'Pants y chamarra', sku: 'UNI-101', price: 1240, stock: 42, cat: 'Uniformes', tone: 'blue', pos: true, img: '', desc: 'Conjunto deportivo · todos los niveles' },
  { name: 'Bermuda y playera', sku: 'UNI-102', price: 730, stock: 58, cat: 'Uniformes', tone: 'blue', pos: true, img: '', desc: 'Uniforme diario de verano' },
  { name: 'Gala Preescolar/Primaria · Jumper', sku: 'UNI-110', price: 1280, stock: 30, cat: 'Uniformes', tone: 'blue', pos: true, img: '', desc: 'Jumper, saco, blusa y corbatín' },
  { name: 'Gala Preescolar/Primaria · Caballero', sku: 'UNI-111', price: 1280, stock: 30, cat: 'Uniformes', tone: 'blue', pos: true, img: '', desc: 'Saco, pantalón, camisa y corbata' },
  { name: 'Gala Secundaria · Jumper', sku: 'UNI-112', price: 1300, stock: 24, cat: 'Uniformes', tone: 'blue', pos: true, img: '', desc: 'Jumper, saco, blusa y corbatín' },
  { name: 'Gala Secundaria · Caballero', sku: 'UNI-113', price: 1300, stock: 24, cat: 'Uniformes', tone: 'blue', pos: true, img: '', desc: 'Saco, pantalón, camisa y corbata' },
  { name: 'Chaleco tejido', sku: 'UNI-120', price: 425, stock: 48, cat: 'Uniformes', tone: 'blue', pos: true, img: '', desc: 'Complemento · todos los niveles' },
  { name: 'Corbata o corbatín', sku: 'UNI-121', price: 190, stock: 80, cat: 'Uniformes', tone: 'blue', pos: true, img: '', desc: 'Complemento · todos los niveles' },
  { name: 'Playera y/o bermuda', sku: 'UNI-122', price: 390, stock: 60, cat: 'Uniformes', tone: 'blue', pos: true, img: '', desc: 'Complemento · todos los niveles' },

  /* ----- Uniformes de natación · Lista de precios 25-26 ----- */
  { name: 'Traje de baño', sku: 'NAT-001', price: 625, stock: 36, cat: 'Natación', tone: 'violet', pos: true, img: '', desc: 'Uniforme oficial de natación' },
  { name: 'Gorra de silicón', sku: 'NAT-002', price: 200, stock: 70, cat: 'Natación', tone: 'violet', pos: true, img: '' },
  { name: 'Gorra de neopreno', sku: 'NAT-003', price: 220, stock: 50, cat: 'Natación', tone: 'violet', pos: true, img: '' },
  { name: 'Gorra cabello largo', sku: 'NAT-004', price: 260, stock: 40, cat: 'Natación', tone: 'violet', pos: true, img: '' },
  { name: 'Kit negro de natación', sku: 'NAT-010', price: 495, stock: 28, cat: 'Natación', tone: 'violet', pos: true, img: '', desc: 'Gorra de neopreno, goggles con estuche, protector de celular, tapones de nariz y oídos y mochila deportiva con cordones' },
  { name: 'Kit infantil de natación', sku: 'NAT-011', price: 495, stock: 28, cat: 'Natación', tone: 'violet', pos: true, img: '', desc: 'Preescolar y 1° de primaria · gorra de silicón, goggles con estuche, tapones de nariz y oídos y mochila deportiva con cordones' },
];
DB.onlineOrders = [];
/* ---------- Inventario (almacén · existencias · proveedores) ----------
   Vacío en la base limpia; se puebla al crear artículos, ubicaciones,
   proveedores y registrar movimientos desde el módulo. */
DB.inventory = [];
DB.invMovements = [];
DB.invSuppliers = [];
DB.invOrders = [];
DB.invLocations = [];
DB.tienda = {
  salesToday: 7420,
  salesMonth: 168350,
  avgTicket: 86,
  txMonth: 1958,
  weekly: { labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], values: [8200, 9100, 7600, 9800, 11200, 4300, 0] },
  byCategory: [
    { label: 'Cafetería', value: 84200, color: 'var(--green)', n: 1420 },
    { label: 'Papelería', value: 49800, color: 'var(--cyan)', n: 388 },
    { label: 'Uniformes', value: 34350, color: 'var(--accent)', n: 150 },
  ],
  topProducts: [
    { name: 'Agua 600ml', cat: 'Cafetería', units: 612, revenue: 11016 },
    { name: 'Lunch saludable', cat: 'Cafetería', units: 348, revenue: 22620 },
    { name: 'Snack natural', cat: 'Cafetería', units: 296, revenue: 8288 },
    { name: 'Cuaderno profesional', cat: 'Papelería', units: 184, revenue: 8280 },
    { name: 'Uniforme deportivo', cat: 'Uniformes', units: 42, revenue: 20160 },
  ],
  recent: [
    { ticket: 'V-20418', items: 3, amount: 128, time: 'hace 6 min', cashier: 'Caja 01' },
    { ticket: 'V-20417', items: 1, amount: 65, time: 'hace 18 min', cashier: 'Caja 02' },
    { ticket: 'V-20416', items: 5, amount: 234, time: 'hace 32 min', cashier: 'Caja 01' },
    { ticket: 'V-20415', items: 2, amount: 83, time: 'hace 41 min', cashier: 'Caja 01' },
  ],
};
DB.missions = [];
DB.leaderboard = [];
DB.experiences = [];

/* ---------- Administración: matrículas, ingresos, configuración ---------- */
DB.enrollment = [
  { grade: 'Kínder', cupo: 180, inscritos: 156, nuevos: 92, reinscritos: 64 },
  { grade: '1°', cupo: 200, inscritos: 188, nuevos: 0, reinscritos: 188 },
  { grade: '2°', cupo: 200, inscritos: 192, nuevos: 4, reinscritos: 188 },
  { grade: '3°', cupo: 200, inscritos: 176, nuevos: 6, reinscritos: 170 },
  { grade: '4°', cupo: 200, inscritos: 184, nuevos: 8, reinscritos: 176 },
  { grade: '5°', cupo: 180, inscritos: 168, nuevos: 3, reinscritos: 165 },
  { grade: '6°', cupo: 180, inscritos: 160, nuevos: 2, reinscritos: 158 },
];
DB.matriculas = [];
DB.incomeByConcept = [
  { concept: 'Colegiaturas', value: 3680000, color: 'var(--accent)', delta: 5.1 },
  { concept: 'Inscripciones', value: 620000, color: 'var(--cyan)', delta: 12.4 },
  { concept: 'Transporte', value: 240000, color: 'var(--violet)', delta: 1.8 },
  { concept: 'Tiendita / Cafetería', value: 168000, color: 'var(--green)', delta: 8.7 },
  { concept: 'Talleres y experiencias', value: 112000, color: 'var(--amber)', delta: -2.3 },
];
DB.settings = {
  /* — Identidad / generales (claves usadas en toda la app) — */
  schoolName: 'Colegio Piaget', campus: 'Campus Norte · CDMX', cycle: '2025–2026',
  /* — Ciclos escolares (el activo es el que coincide con `cycle`) — */
  cycles: [
    { name: '2025–2026', start: '26 ago 2025', end: '26 jun 2026', periods: '5 parciales' },
  ],
  rfc: 'CPI230815AB1', email: 'direccion@jeanpiaget.mx', phone: '55 4821 0090',
  currency: 'MXN', timezone: 'America/Mexico_City',
  legalName: 'CORPORATIVO JEAN PIAGET S.C.',
  cct: '15PPR0421X', website: 'jeanpiaget.mx',
  director: 'Mtra. María Fernanda Ríos',
  address: 'Av. de los Maestros 1420, Col. Centro',
  city: 'Tlalnepantla', state: 'Estado de México', zip: '54930',
  locale: 'es-MX', dateFormat: 'DD/MM/AAAA', firstDay: 'Lunes',
  /* — Niveles educativos: cada uno con su clave CCT y director — */
  levels: [
    { name: 'Preescolar', cct: '15PJN0188K', director: 'Lic. Ana Beltrán Ortiz', turno: 'Matutino' },
    { name: 'Primaria', cct: '15PPR0421X', director: 'Mtro. Carlos Ibáñez Lugo', turno: 'Matutino' },
    { name: 'Secundaria', cct: '15PES0210B', director: 'Mtra. Patricia Solís Vega', turno: 'Matutino' },
  ],
  /* — Apariencia / marca — */
  branding: {
    accentHue: 262, theme: 'Sistema', density: 'Cómoda', radius: 'Redondeado',
    logoText: 'Piaget', primaryFont: 'Hanken Grotesk', loginBg: 'Degradado',
    logoLight: '', logoDark: '', favicon: '',
  },
  /* — Seguridad — */
  security: {
    twoFA: true, twoFAMethod: 'App autenticadora', sso: false,
    passwordMinLen: 10, passwordSymbols: true, passwordRotateDays: 90,
    sessionTimeout: 30, loginAlerts: true, ipAllowlist: false, deviceTrust: true,
  },
  /* — Facturación fiscal (solo banderas, sin secretos) — */
  fiscal: {
    rfc: 'CJP950815CH6', legalName: 'CORPORATIVO JEAN PIAGET',
    regimen: '626 · Régimen Simplificado de Confianza (RESICO)',
    zip: '54930', serie: 'A', folioActual: 1842,
    pac: 'Facturama', pacMode: 'Producción', testMode: false,
    csdLoaded: true, csdSerial: '00001000000513048021', csdExpiry: '2027-08-14',
    autoTimbrado: true, sendByEmail: true,
  },
  /* — Respaldos — */
  backups: {
    auto: true, frequency: 'Diario', time: '02:00', retentionDays: 30,
    storage: 'Supabase Storage', encrypt: true, lastBackup: 'Hoy · 02:00', lastSize: '184 MB',
  },
  /* — Compat: integraciones simples (no usado por el nuevo módulo) — */
  integrations: { supabase: true, pagos: true, mensajeria: false, facturacion: true },
};

/* Periodos / parciales del ciclo activo */
DB.cyclePeriods = [
  { name: '1.er Parcial', start: '26 ago 2025', end: '17 oct 2025', status: 'Cerrado' },
  { name: '2.º Parcial', start: '20 oct 2025', end: '12 dic 2025', status: 'Cerrado' },
  { name: '3.er Parcial', start: '7 ene 2026', end: '27 feb 2026', status: 'En curso' },
  { name: '4.º Parcial', start: '2 mar 2026', end: '24 abr 2026', status: 'Programado' },
  { name: '5.º Parcial', start: '27 abr 2026', end: '26 jun 2026', status: 'Programado' },
];
/* Eventos / días no laborables del calendario escolar */
DB.calendarEvents = [
  { date: '16 sep', name: 'Independencia de México', type: 'Festivo', level: 'Todos' },
  { date: '2 nov', name: 'Día de Muertos', type: 'Festivo', level: 'Todos' },
  { date: '18 nov', name: 'Revolución (descanso)', type: 'Festivo', level: 'Todos' },
  { date: '20 dic – 6 ene', name: 'Vacaciones de invierno', type: 'Vacaciones', level: 'Todos' },
  { date: '3 feb', name: 'Consejo Técnico Escolar', type: 'Suspensión', level: 'Todos' },
  { date: '13 – 14 mar', name: 'Festival de primavera', type: 'Evento', level: 'Preescolar' },
  { date: '21 mar', name: 'Viaje de estudios Teotihuacán', type: 'Evento', level: 'Primaria' },
  { date: '9 may', name: 'Examen de admisión', type: 'Evento', level: 'Secundaria' },
  { date: '15 may', name: 'Día del Maestro', type: 'Suspensión', level: 'Todos' },
];

/* Periodos y calendario forman parte de la configuración guardable del ciclo */
DB.settings.cyclePeriods = DB.cyclePeriods.map(p => ({ ...p }));
DB.settings.calendarEvents = DB.calendarEvents.map(e => ({ ...e }));

/* Aplica la configuración guardada (ciclo vigente, identidad, etc.) sobre los
   valores por defecto para que TODOS los módulos usen el ciclo escolar activo. */
try {
  const _sv = JSON.parse(localStorage.getItem('piaget_settings') || 'null');
  if (_sv && typeof _sv === 'object') {
    Object.assign(DB.settings, _sv);
    if (_sv.cycle) DB.school.cycle = 'Ciclo ' + _sv.cycle;
    if (_sv.schoolName) DB.school.name = _sv.schoolName;
  }
} catch (e) { }
/* Helper global: ciclo escolar vigente (cadena, p. ej. "2026–2027") */
window.PIAGET_CYCLE = function () { return (DB.settings && DB.settings.cycle) || '2025–2026'; };

/* Roles + matriz de permisos por módulo */
DB.permModules = ['Académico', 'Finanzas', 'Comunicación', 'CRM', 'Accesos', 'Reportes', 'Configuración'];
/* Niveles: 0 = sin acceso · 1 = ver · 2 = editar · 3 = total */
DB.roles = [
  { role: 'Dirección', users: 3, perms: 'Acceso total', tone: 'violet', matrix: [3, 3, 3, 3, 3, 3, 3] },
  { role: 'Coordinación', users: 8, perms: 'Académico + comunicación', tone: 'blue', matrix: [3, 1, 3, 2, 1, 2, 1] },
  { role: 'Docentes', users: 96, perms: 'Calificaciones, asistencia, tareas', tone: 'cyan', matrix: [2, 0, 1, 0, 0, 1, 0] },
  { role: 'Finanzas', users: 6, perms: 'Cobros, facturas, ingresos', tone: 'green', matrix: [1, 3, 1, 1, 0, 3, 1] },
  { role: 'Admisiones', users: 5, perms: 'CRM y matrículas', tone: 'amber', matrix: [1, 1, 2, 3, 1, 1, 0] },
  { role: 'Recepción', users: 4, perms: 'Control de accesos', tone: 'red', matrix: [0, 0, 1, 0, 3, 0, 0] },
  { role: 'Familias', users: 1180, perms: 'Portal de familias · solo lectura', tone: 'amber', matrix: [1, 1, 1, 0, 0, 0, 0] },
  { role: 'Estudiantes', users: 1284, perms: 'Portal del alumno · solo lectura', tone: 'violet', matrix: [1, 0, 1, 0, 0, 0, 0] },
];

/* Integraciones conectadas */
DB.integrations = [
  { key: 'supabase', name: 'Supabase', desc: 'Base de datos, auth y storage', icon: 'layers', tone: 'green', connected: true, account: 'piaget-prod.supabase.co', lastSync: 'En vivo' },
  { key: 'pagos', name: 'Stripe', desc: 'Cobros con tarjeta en línea', icon: 'card', tone: 'violet', connected: true, account: 'acct_1Q · MXN', lastSync: 'hace 5 min' },
  { key: 'facturacion', name: 'Facturama (CFDI)', desc: 'Timbrado automático ante el SAT', icon: 'receipt', tone: 'cyan', connected: true, account: 'API Multiemisor', lastSync: 'hace 1 h' },
  { key: 'mensajeria', name: 'WhatsApp Business', desc: 'Avisos y recordatorios a familias', icon: 'message', tone: 'green', connected: false, account: '—', lastSync: '—' },
  { key: 'correo', name: 'Resend (correo)', desc: 'Correos transaccionales y boletines', icon: 'mail', tone: 'amber', connected: true, account: 'no-reply@jeanpiaget.mx', lastSync: 'hace 12 min' },
  { key: 'gclass', name: 'Google Classroom', desc: 'Sincroniza grupos y tareas', icon: 'cap', tone: 'red', connected: false, account: '—', lastSync: '—' },
  { key: 'calendar', name: 'Google Calendar', desc: 'Eventos y calendario escolar', icon: 'calendar', tone: 'blue', connected: true, account: 'direccion@jeanpiaget.mx', lastSync: 'hace 30 min' },
  { key: 'analytics', name: 'Metabase BI', desc: 'Tableros y analítica avanzada', icon: 'chart', tone: 'violet', connected: false, account: '—', lastSync: '—' },
];

/* Notificaciones — categorías con canales */
DB.notifGroups = [
  { key: 'morosidad', name: 'Alertas de morosidad', desc: 'Cuando una familia se atrasa en pagos', email: true, push: true, wapp: false },
  { key: 'riesgo', name: 'Riesgo académico', desc: 'Alumnos en riesgo de reprobar o desertar', email: true, push: true, wapp: false },
  { key: 'accesos', name: 'Accesos del campus', desc: 'Entradas y salidas en tiempo real', email: false, push: true, wapp: false },
  { key: 'pagos', name: 'Pagos recibidos', desc: 'Confirmación de cobros y depósitos', email: true, push: false, wapp: true },
  { key: 'admisiones', name: 'Nuevas admisiones', desc: 'Prospectos y solicitudes de inscripción', email: true, push: true, wapp: false },
  { key: 'sistema', name: 'Sistema y respaldos', desc: 'Estado de integraciones y copias de seguridad', email: true, push: false, wapp: false },
];

/* Sesiones activas del usuario */
DB.sessions = [
  { device: 'MacBook Pro · Chrome', loc: 'Tlalnepantla, MX', ip: '189.203.44.12', last: 'Ahora', current: true },
  { device: 'iPhone 15 · App Piaget', loc: 'Tlalnepantla, MX', ip: '189.203.44.18', last: 'hace 2 h', current: false },
  { device: 'iPad · Safari', loc: 'CDMX, MX', ip: '201.141.88.7', last: 'Ayer', current: false },
  { device: 'Windows · Edge', loc: 'Naucalpan, MX', ip: '187.190.12.30', last: 'hace 3 días', current: false },
];
/* Registro de auditoría */
DB.auditLog = [
  { actor: 'María Fernanda Ríos', action: 'cambió permisos del rol', target: 'Coordinación', time: 'Hoy 09:14', tone: 'violet' },
  { actor: 'Luis Treviño', action: 'timbró factura', target: 'FAC-2026-1842', time: 'Hoy 08:51', tone: 'cyan' },
  { actor: 'Sistema', action: 'completó respaldo automático', target: '184 MB', time: 'Hoy 02:00', tone: 'green' },
  { actor: 'Paola Mena', action: 'invitó a un usuario', target: 'docente@jeanpiaget.mx', time: 'Ayer 17:32', tone: 'amber' },
  { actor: 'María Fernanda Ríos', action: 'conectó la integración', target: 'Google Calendar', time: 'Ayer 11:08', tone: 'blue' },
  { actor: 'Sistema', action: 'bloqueó 3 intentos de acceso', target: 'IP 45.12.x.x', time: '14 jun 23:41', tone: 'red' },
];
/* Usuarios de la plataforma (administración de accesos) */
DB.adminUsers = [
  { name: 'María Fernanda Ríos', email: 'direccion@jeanpiaget.mx', role: 'Dirección', pass: 'Direccion2026', tone: 'violet', status: 'Activo', twoFA: true, last: 'Ahora' },
  { name: 'Luis Treviño', email: 'tesoreria@jeanpiaget.mx', role: 'Finanzas', pass: 'Tesoreria2026', tone: 'green', status: 'Activo', twoFA: true, last: 'hace 20 min' },
  { name: 'Paola Mena', email: 'coordinacion@jeanpiaget.mx', role: 'Coordinación', pass: 'Coordinacion2026', tone: 'blue', status: 'Activo', twoFA: false, last: 'hace 1 h' },
  { name: 'Carlos Ibáñez', email: 'c.ibanez@jeanpiaget.mx', role: 'Coordinación', pass: 'Ibanez2026', tone: 'blue', status: 'Activo', twoFA: true, last: 'Ayer' },
  { name: 'Daniela Soto', email: 'admisiones@jeanpiaget.mx', role: 'Admisiones', pass: 'Admisiones2026', tone: 'amber', status: 'Activo', twoFA: false, last: 'hace 3 h' },
  { name: 'Recepción Campus Norte', email: 'recepcion@jeanpiaget.mx', role: 'Recepción', pass: 'Recepcion2026', tone: 'red', status: 'Activo', twoFA: false, last: 'hace 5 h' },
  { name: 'Docente Invitado', email: 'docente@jeanpiaget.mx', role: 'Docentes', pass: 'Docente2026', tone: 'cyan', status: 'Invitado', twoFA: false, last: '—' },
];
/* Estado editable de Configuración → Usuarios y roles (persistible con la configuración) */
DB.settings.users = DB.adminUsers.map(u => ({ ...u }));
DB.settings.permMatrix = DB.roles.map(r => [...r.matrix]);

/* ---------- Gestión ---------- */
DB.docs = [
  { name: 'Reglamento escolar 2026', kind: 'PDF', size: '2.4 MB', owner: 'Dirección', date: 'hace 2 días', folder: 'Institucional' },
  { name: 'Plantilla de planeación', kind: 'DOC', size: '180 KB', owner: 'Académico', date: 'hace 4 días', folder: 'Académico' },
  { name: 'Calendario ciclo 2026', kind: 'XLS', size: '96 KB', owner: 'Control Escolar', date: 'hace 1 sem', folder: 'Institucional' },
  { name: 'Protocolo de seguridad', kind: 'PDF', size: '1.1 MB', owner: 'Dirección', date: 'hace 1 sem', folder: 'Institucional' },
  { name: 'Formato de permiso', kind: 'DOC', size: '64 KB', owner: 'Coordinación', date: 'hace 2 sem', folder: 'Familias' },
];
DB.boletines = [];
DB.evaluaciones = [];
DB.diario = [];
DB.tareas = [];

/* ---------- Familias ---------- */
DB.tickets = [];
/* ---------- Facturación electrónica (CFDI 4.0 · complemento IEDU) ----------
   Cada comprobante se emite a un RECEPTOR (tutor) ligado a un ALUMNO real del padrón.
   receptor / rfc / cp / regimen / correo / curp / cct se derivan determinísticamente
   del alumno+nivel en views_facturas_data.jsx (factResolveFactura). */
DB.facturas = [];
/* ---------- Cobros (pagos recibidos · conciliación) ----------
   Dataset realista generado determinísticamente: ~150 pagos en 6 meses,
   con nivel, concepto, canal, estatus y bandera de facturado. El módulo
   Ingresos deriva TODO de aquí (igual que la pestaña Pagos de Cobros). */
DB.cobros = [];

/* ---------- Egresos (gastos operativos · 6 meses) ---------- */
DB.egresoColors = {
  'Nómina': 'var(--accent)', 'Proveedores': 'var(--cyan)', 'Servicios': 'var(--violet)',
  'Mantenimiento': 'var(--green)', 'Material didáctico': 'var(--amber)',
  'Marketing y admisiones': 'oklch(0.62 0.16 25)', 'Impuestos y honorarios': 'oklch(0.64 0.13 250)',
};
DB.egresoBudget = {
  'Nómina': 500000, 'Servicios': 72000, 'Proveedores': 84000, 'Impuestos y honorarios': 70000,
  'Mantenimiento': 42000, 'Material didáctico': 30000, 'Marketing y admisiones': 24000,
};
DB.egresos = (function () {
  const MESES = [['03', 'marzo'], ['04', 'abril'], ['05', 'mayo'], ['06', 'junio'], ['07', 'julio'], ['08', 'agosto']];
  const METODOS = ['Transferencia', 'Domiciliación', 'Cheque'];
  // categorías con partidas recurrentes: [concepto, montoBase, proveedor]
  const ITEMS = {
    'Proveedores': [['Alimentos cafetería', 6500, 'Distribuidora La Granja'], ['Papelería y consumibles', 4200, 'Office Depot'], ['Uniformes (lote)', 5400, 'Confecciones Escolar']],
    'Servicios': [['Energía eléctrica', 5400, 'CFE'], ['Agua', 1800, 'SACMEX'], ['Internet y telefonía', 3200, 'Telmex'], ['Plataforma educativa (SaaS)', 2600, 'PIAGET AI']],
    'Mantenimiento': [['Limpieza e intendencia', 4800, 'Servicios Integrales'], ['Mantenimiento de planta', 3200, 'Construrep']],
    'Material didáctico': [['Material de laboratorio', 3600, 'CienciaLab'], ['Libros y biblioteca', 2400, 'Editorial SM']],
    'Marketing y admisiones': [['Campaña de admisiones', 4200, 'Meta Ads']],
    'Impuestos y honorarios': [['Retenciones ISR/IMSS', 7200, 'SAT'], ['Honorarios contables', 4800, 'Despacho Contable']],
  };
  let s = 11; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const out = []; let id = 1;
  MESES.forEach(([mm, mname], mi) => {
    const last = mi === MESES.length - 1;
    out.push({ id: 'eg' + (id++), date: '2025-' + mm + '-28', category: 'Nómina', concept: 'Nómina docente · ' + mname, amount: 62000 + Math.floor(rnd() * 4000), method: 'Transferencia', provider: 'Recursos Humanos', status: 'pagado' });
    out.push({ id: 'eg' + (id++), date: '2025-' + mm + '-28', category: 'Nómina', concept: 'Nómina administrativa · ' + mname, amount: 17000 + Math.floor(rnd() * 2000), method: 'Transferencia', provider: 'Recursos Humanos', status: last ? 'programado' : 'pagado' });
    Object.keys(ITEMS).forEach(cat => {
      ITEMS[cat].forEach(([concept, amt, prov]) => {
        if (rnd() < 0.86) {
          const a = Math.round(amt * (0.9 + rnd() * 0.24));
          const dia = String(3 + Math.floor(rnd() * 22)).padStart(2, '0');
          out.push({ id: 'eg' + (id++), date: '2025-' + mm + '-' + dia, category: cat, concept: concept + ' · ' + mname, amount: a, method: METODOS[Math.floor(rnd() * METODOS.length)], provider: prov, status: (last && rnd() < 0.3) ? 'programado' : 'pagado' });
        }
      });
    });
  });
  return out.sort((a, b) => b.date.localeCompare(a.date));
})();
DB.chats = [];

/* ---------- Cuentas del portal de familias (Administración › Familias) ----------
   Cada familia tiene credenciales (usuario + contraseña) y está vinculada a uno o
   más estudiantes; con su acceso pueden revisar calificaciones, asistencia y pagos. */
DB.familyAccounts = [];

/* ============================================================
   REINICIO DE CICLO — deja la plataforma vacía conservando
   configuración (niveles, ciclo, usuarios, planes, presupuesto)
   y catálogos (tiendita, inventario). Solo afecta los datos
   operativos del ciclo anterior.
   ============================================================ */
if (window.PIAGET_FRESH) {
  /* Finanzas: egresos, ingresos y cartera en cero */
  DB.egresos = [];
  DB.cobros = [];
  DB.facturas = [];
  DB.incomeByConcept = (DB.incomeByConcept || []).map(x => ({ ...x, value: 0, delta: 0 }));
  if (DB.financeMonthly) {
    DB.financeMonthly.ingresos = DB.financeMonthly.labels.map(() => 0);
    DB.financeMonthly.egresos = DB.financeMonthly.labels.map(() => 0);
  }
  DB.finKpis = [
    { label: 'Ingresos del mes', value: '$0', delta: 0, tone: 'green', icon: 'trendUp' },
    { label: 'Egresos del mes', value: '$0', delta: 0, tone: 'blue', icon: 'wallet' },
    { label: 'Margen operativo', value: '0%', delta: 0, tone: 'violet', icon: 'pie' },
    { label: 'Cartera vencida', value: '$0', delta: 0, tone: 'amber', icon: 'alert' },
  ];

  /* Matrículas / inscripciones del ciclo en cero (se conservan cupos) */
  DB.matriculas = [];
  DB.enrollment = (DB.enrollment || []).map(x => ({ ...x, inscritos: 0, nuevos: 0, reinscritos: 0 }));

  /* Académico: calificaciones, evaluaciones, diario, tareas, boletines */
  DB.evaluaciones = []; DB.diario = []; DB.tareas = []; DB.boletines = [];

  /* CRM / comunicación / familias */
  DB.leads = [];
  DB.tickets = []; DB.chats = []; DB.familyAccounts = [];
  DB.channels = (DB.channels || []).map(c => ({ ...c, sent: 0, open: 0 }));

  /* Engage / misiones */
  DB.missions = []; DB.leaderboard = []; DB.onlineOrders = [];

  /* Tiendita / POS: ventas y agregados del ciclo en cero (se conserva el catálogo) */
  DB.products = [];
  DB.ventas = [];
  if (DB.tienda) {
    DB.tienda.salesToday = 0; DB.tienda.salesMonth = 0; DB.tienda.avgTicket = 0; DB.tienda.txMonth = 0;
    if (DB.tienda.weekly) DB.tienda.weekly.values = DB.tienda.weekly.labels.map(() => 0);
    DB.tienda.byCategory = (DB.tienda.byCategory || []).map(c => ({ ...c, value: 0, n: 0 }));
    DB.tienda.topProducts = [];
    DB.tienda.recent = [];
  }

  /* Dashboard (home): tendencia, insights y alertas del ciclo anterior */
  /* Meses del ciclo activo (orden escolar ago→jul) para las gráficas del home */
  var CYCLE_MONTHS = ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'];
  if (DB.enrollTrend) {
    DB.enrollTrend.labels = CYCLE_MONTHS.slice(0, 8);
    /* Sin datos del ciclo: solo la serie real de inscritos (sin proyección IA) */
    DB.enrollTrend.series = [{ name: 'Inscritos', data: DB.enrollTrend.labels.map(() => 0) }];
  }
  if (DB.financeMonthly) {
    DB.financeMonthly.labels = CYCLE_MONTHS.slice(0, 6);
    DB.financeMonthly.ingresos = DB.financeMonthly.labels.map(() => 0);
    DB.financeMonthly.egresos = DB.financeMonthly.labels.map(() => 0);
  }
  if (DB.attendanceByGrade) DB.attendanceByGrade.data = (DB.attendanceByGrade.data || []).map(() => 0);
  DB.insights = [];
  DB.alerts = [];
  DB.activity = [];

  /* Control de accesos: registros del día en cero */
  DB.accessLive = []; DB.accessQueue = []; DB.accessVisitors = [];
  DB.accessIncidents = []; DB.accessEarlyExits = []; DB.accessPickups = []; DB.accessLate = [];
  DB.accessByLevel = (DB.accessByLevel || []).map(x => ({ ...x, inside: 0, total: 0 }));
  DB.accessAreas = (DB.accessAreas || []).map(x => ({ ...x, inside: 0 }));
}
