/* nav_config.jsx — Estructura del sidebar, mapa de rutas y metadatos de scaffolds */

window.NAV = [
  {
    section: 'Principal',
    items: [
      { id: 'home', label: 'Home', icon: 'grid' },
      { id: 'ai-missions', label: 'AI Missions', icon: 'rocket' },
      { id: 'clases', label: 'Clases', icon: 'cap' },
      { id: 'atlas', label: 'Atlas', icon: 'map' },
      { id: 'engage', label: 'Engage', icon: 'zap' },
      { id: 'manager', label: 'Manager', icon: 'compass' },
    ],
  },
  {
    section: 'Workspace',
    items: [
      { id: 'crm', label: 'CRM', icon: 'funnel', children: [
        { id: 'pipeline', label: 'Pipeline' },
        { id: 'contactos', label: 'Contactos' },
      ] },
      { id: 'gestion', label: 'Gestión', icon: 'bookOpen', children: [
        { id: 'docs', label: 'Docs' },
        { id: 'boletines', label: 'Boletines' },
        { id: 'calificaciones', label: 'Calificaciones' },
        { id: 'evaluaciones', label: 'Evaluaciones' },
        { id: 'asistencia', label: 'Asistencia' },
        { id: 'diario', label: 'Diario' },
        { id: 'tareas', label: 'Tareas' },
      ] },
      { id: 'administracion', label: 'Administración', icon: 'building', children: [
        { id: 'estudiantes', label: 'Estudiantes' },
        { id: 'familias', label: 'Familias' },
        { id: 'docentes', label: 'Docentes' },
        { id: 'configuracion', label: 'Configuración' },
      ] },
      { id: 'tesoreria', label: 'Tesorería', icon: 'wallet', children: [
        { id: 'cobros', label: 'Cobros' },
        { id: 'pendientes', label: 'Pendientes' },
        { id: 'facturas', label: 'Facturas' },
        { id: 'ingresos', label: 'Ingresos' },
        { id: 'egresos', label: 'Egresos' },
        { id: 'finanzas', label: 'Finanzas' },
        { id: 'inteligencia-financiera', label: 'Inteligencia Financiera' },
      ] },
      { id: 'comercio', label: 'Comercio', icon: 'store', children: [
        { id: 'catalogo', label: 'Catálogo' },
        { id: 'inventario', label: 'Inventario' },
        { id: 'tiendita', label: 'Tiendita' },
        { id: 'punto-de-venta', label: 'Punto de Venta' },
        { id: 'tienda-en-linea', label: 'Tienda en línea' },
      ] },
    ],
  },
  {
    section: 'Control de Accesos',
    items: [
      { id: 'control-accesos', label: 'Control de Accesos', icon: 'shield', children: [
        { id: 'dashboard-accesos', label: 'Dashboard Accesos' },
        { id: 'scanner-qr', label: 'Scanner QR' },
        { id: 'cola-espera', label: 'Cola de Espera' },
        { id: 'historial-accesos', label: 'Historial Accesos' },
      ] },
    ],
  },
  {
    section: 'Familias',
    items: [
      { id: 'comunicacion-fam', label: 'Comunicación', icon: 'message', children: [
        { id: 'audiencias', label: 'Audiencias' },
        { id: 'atencion-familias', label: 'Atención a Familias' },
        { id: 'mensajeria-app', label: 'Mensajería App' },
        { id: 'comunicados', label: 'Comunicados' },
      ] },
      { id: 'experiencias', label: 'Experiencias', icon: 'star' },
    ],
  },
];

/* Mapa ruta → { componente, crumb (sección › hoja) } */
window.ROUTES = {
  home: { c: 'Dashboard', crumb: ['Principal', 'Home'] },
  'mi-credencial': { c: 'StudentCredencial', crumb: ['Mi acceso', 'Mi credencial'] },
  pagos: { c: 'FamilyPagos', crumb: ['Servicios', 'Pagos de colegiatura'] },
  'historial-pagos': { c: 'FamilyPagos', crumb: ['Servicios', 'Historial de pagos'] },
  'mis-facturas': { c: 'FamilyPagos', crumb: ['Servicios', 'Facturas'] },
  'ai-missions': { c: 'AIMissions', crumb: ['Principal', 'AI Missions'] },
  clases: { c: 'Clases', crumb: ['Principal', 'Clases'] },
  atlas: { c: 'Atlas', crumb: ['Principal', 'Atlas'] },
  engage: { c: 'Engage', crumb: ['Principal', 'Engage'] },
  manager: { c: 'ManagerHub', crumb: ['Principal', 'Manager'] },

  audiencias: { c: 'Audiencias', crumb: ['Comunicación', 'Audiencias'] },
  pipeline: { c: 'CRM', crumb: ['CRM', 'Pipeline'] },
  contactos: { c: 'Contactos', crumb: ['CRM', 'Contactos'] },

  calificaciones: { c: 'Calificaciones', crumb: ['Gestión', 'Calificaciones'] },
  docs: { c: 'Docs', crumb: ['Gestión', 'Docs'] },
  boletines: { c: 'Boletines', crumb: ['Gestión', 'Boletines'] },
  evaluaciones: { c: 'Evaluaciones', crumb: ['Gestión', 'Evaluaciones'] },
  asistencia: { c: 'Asistencia', crumb: ['Gestión', 'Asistencia'] },
  diario: { c: 'Diario', crumb: ['Gestión', 'Diario'] },
  tareas: { c: 'Tareas', crumb: ['Gestión', 'Tareas'] },
  'atencion-familias': { c: 'AtencionFamilias', crumb: ['Comunicación', 'Atención a Familias'] },
  'mensajeria-app': { c: 'MensajeriaApp', crumb: ['Comunicación', 'Mensajería App'] },
  estudiantes: { c: 'Academico', crumb: ['Administración', 'Estudiantes'] },
  familias: { c: 'FamiliasAdmin', crumb: ['Administración', 'Familias'] },
  docentes: { c: 'Docentes', crumb: ['Administración', 'Docentes'] },
  cobros: { c: 'Cobros', crumb: ['Tesorería', 'Cobros'] },
  finanzas: { c: 'Finanzas', crumb: ['Tesorería', 'Finanzas'] },
  pendientes: { c: 'Pendientes', crumb: ['Tesorería', 'Pendientes'] },
  facturas: { c: 'Facturas', crumb: ['Tesorería', 'Facturas'] },
  ingresos: { c: 'Ingresos', crumb: ['Tesorería', 'Ingresos'] },
  egresos: { c: 'Egresos', crumb: ['Tesorería', 'Egresos'] },
  configuracion: { c: 'Configuracion', crumb: ['Administración', 'Configuración'] },
  'inteligencia-financiera': { c: 'BI', crumb: ['Tesorería', 'Inteligencia Financiera'] },
  catalogo: { c: 'Catalogo', crumb: ['Comercio', 'Catálogo'] },
  tiendita: { c: 'Tiendita', crumb: ['Comercio', 'Tiendita'] },
  'punto-de-venta': { c: 'POS', crumb: ['Comercio', 'Punto de Venta'] },
  'tienda-en-linea': { c: 'TiendaOnline', crumb: ['Comercio', 'Tienda en línea'] },
  inventario: { c: 'Inventario', crumb: ['Comercio', 'Inventario'] },

  'dashboard-accesos': { c: 'AccessDashboard', crumb: ['Control de Accesos', 'Dashboard Accesos'] },
  'scanner-qr': { c: 'ScannerQR', crumb: ['Control de Accesos', 'Scanner QR'] },
  'cola-espera': { c: 'ColaEspera', crumb: ['Control de Accesos', 'Cola de Espera'] },
  'historial-accesos': { c: 'HistorialAccesos', crumb: ['Control de Accesos', 'Historial Accesos'] },

  comunicados: { c: 'Comunicacion', crumb: ['Comunicación', 'Comunicados'] },
  experiencias: { c: 'Experiencias', crumb: ['Experiencias', 'Experiencias'] },
};

/* Metadatos para hojas que usan la plantilla ModuleScaffold */
window.SCAFFOLDS = {
  docs: { section: 'Gestión', title: 'Docs', icon: 'doc', desc: 'Documentos institucionales, plantillas y archivos compartidos.', primary: 'Subir documento', primaryIcon: 'plus',
    kpis: [{ label: 'Documentos', value: '348', icon: 'doc', tone: 'blue' }, { label: 'Compartidos', value: '92', icon: 'link', tone: 'cyan' }, { label: 'Plantillas', value: '24', icon: 'clipboard', tone: 'violet' }],
    listTitle: 'Recientes', listSub: 'Últimos archivos', rows: [
      { title: 'Reglamento escolar 2026.pdf', sub: 'Dirección · hace 2 días', icon: 'doc', badge: 'PDF', badgeTone: 'red' },
      { title: 'Plantilla de planeación.docx', sub: 'Académico · hace 4 días', icon: 'doc', badge: 'DOC', badgeTone: 'blue' },
      { title: 'Calendario ciclo 2026.xlsx', sub: 'Control Escolar · hace 1 sem', icon: 'doc', badge: 'XLS', badgeTone: 'green' },
    ] },
  boletines: { section: 'Gestión', title: 'Boletines', icon: 'bookOpen', desc: 'Boletas de calificaciones y reportes para familias.', primary: 'Generar boletas', primaryIcon: 'spark',
    kpis: [{ label: 'Boletas emitidas', value: '1,284', icon: 'bookOpen', tone: 'violet' }, { label: 'Parcial', value: '2 / 5', icon: 'calendar', tone: 'blue' }, { label: 'Pendientes', value: '0', icon: 'check', tone: 'green' }],
    listTitle: 'Periodos', listSub: 'Boletines del ciclo', rows: [
      { title: 'Primer parcial', sub: 'Publicado · 1,284 boletas', icon: 'bookOpen', badge: 'Publicado', badgeTone: 'green' },
      { title: 'Segundo parcial', sub: 'En captura · 62% completo', icon: 'bookOpen', badge: 'En curso', badgeTone: 'amber' },
    ] },
  evaluaciones: { section: 'Gestión', title: 'Evaluaciones', icon: 'clipboard', desc: 'Exámenes, rúbricas y evaluaciones formativas.', primary: 'Nueva evaluación', primaryIcon: 'plus',
    kpis: [{ label: 'Evaluaciones activas', value: '38', icon: 'clipboard', tone: 'blue' }, { label: 'Por calificar', value: '12', icon: 'edit', tone: 'amber' }, { label: 'Promedio', value: '8.4', icon: 'award', tone: 'green' }],
    listTitle: 'Próximas', listSub: 'Calendario de evaluaciones', rows: [
      { title: 'Examen de Matemáticas · 5° A', sub: 'Mañana 09:00', icon: 'hash', badge: 'Programado', badgeTone: 'blue' },
      { title: 'Proyecto de Ciencias · 6° B', sub: 'Vence en 3 días', icon: 'compass', badge: 'Abierto', badgeTone: 'amber' },
    ] },
  asistencia: { section: 'Gestión', title: 'Asistencia', icon: 'checkCircle', desc: 'Registro y seguimiento de asistencia diaria.', primary: 'Pasar lista', primaryIcon: 'check',
    kpis: [{ label: 'Asistencia hoy', value: '94.6%', icon: 'checkCircle', tone: 'green' }, { label: 'Ausencias', value: '69', icon: 'x', tone: 'red' }, { label: 'Justificadas', value: '41', icon: 'doc', tone: 'amber' }, { label: 'Retardos', value: '23', icon: 'clock', tone: 'cyan' }],
    listTitle: 'Grupos con baja asistencia', listSub: 'Hoy', rows: [
      { title: 'Grupo 5° A', sub: '88% presentes', icon: 'cap', value: '88%' },
      { title: 'Grupo 4° B', sub: '84% presentes', icon: 'cap', value: '84%' },
      { title: 'Grupo 6° B', sub: '90% presentes', icon: 'cap', value: '90%' },
    ] },
  diario: { section: 'Gestión', title: 'Diario', icon: 'edit', desc: 'Bitácora diaria de clase: observaciones y notas del docente.', primary: 'Nueva entrada', primaryIcon: 'plus',
    listTitle: 'Entradas recientes', listSub: 'Bitácora de hoy', rows: [
      { title: '5° A · Matemáticas', sub: 'Avance en fracciones. 3 alumnos requieren apoyo.', icon: 'edit' },
      { title: '4° B · Español', sub: 'Lectura grupal. Excelente participación.', icon: 'edit' },
      { title: '6° A · Ciencias', sub: 'Práctica de laboratorio completada.', icon: 'edit' },
    ] },
  tareas: { section: 'Gestión', title: 'Tareas', icon: 'clipboard', desc: 'Asignación y seguimiento de tareas por grupo.', primary: 'Asignar tarea', primaryIcon: 'plus',
    kpis: [{ label: 'Tareas activas', value: '54', icon: 'clipboard', tone: 'blue' }, { label: 'Entregadas', value: '78%', icon: 'check', tone: 'green' }, { label: 'Sin entregar', value: '122', icon: 'alert', tone: 'amber' }],
    listTitle: 'Tareas por vencer', listSub: 'Próximos días', rows: [
      { title: 'Ensayo de Historia · 6° A', sub: 'Vence mañana · 18 entregadas', icon: 'doc', badge: '18/22', badgeTone: 'amber' },
      { title: 'Problemario · 5° B', sub: 'Vence en 2 días · 24 entregadas', icon: 'hash', badge: '24/26', badgeTone: 'green' },
    ] },
  pendientes_REMOVED: { section: 'Administración', title: 'Pendientes', icon: 'clock', desc: 'Cobros pendientes y vencidos por gestionar.', primary: 'Enviar recordatorios', primaryIcon: 'megaphone',
    kpis: [{ label: 'Cobros pendientes', value: '186', icon: 'clock', tone: 'amber' }, { label: 'Monto pendiente', value: '$1.03M', icon: 'wallet', tone: 'red' }, { label: 'Vencidos +60d', value: '142', icon: 'alert', tone: 'red' }],
    listTitle: 'Familias con adeudo', listSub: 'Prioridad alta', rows: [
      { title: 'Familia Cruz', sub: 'Colegiatura ago · vencido', icon: 'wallet', badge: 'Vencido', badgeTone: 'red' },
    ], aiText: '' },
  matriculas_REMOVED: { section: 'Administración', title: 'Matrículas', icon: 'cap', desc: '', rows: [] },
  configuracion_REMOVED: { section: 'Administración', title: 'Configuración', icon: 'settings', desc: '', rows: [] },
  'atencion-familias': { section: 'Comunicación', title: 'Atención a Familias', icon: 'headset', desc: 'Tickets y solicitudes de las familias en un solo lugar.', primary: 'Nuevo ticket', primaryIcon: 'plus',
    kpis: [{ label: 'Tickets abiertos', value: '17', icon: 'inbox', tone: 'blue' }, { label: 'Tiempo respuesta', value: '2.4h', icon: 'clock', tone: 'green' }, { label: 'Satisfacción', value: '4.7/5', icon: 'heart', tone: 'violet' }],
    listTitle: 'Tickets recientes', listSub: 'Bandeja de atención', rows: [
      { title: 'Familia Torres · Facturación', sub: 'Solicita factura de agosto', icon: 'receipt', badge: 'Abierto', badgeTone: 'amber' },
      { title: 'Familia Núñez · Transporte', sub: 'Cambio de ruta', icon: 'map', badge: 'En proceso', badgeTone: 'blue' },
      { title: 'Familia Jiménez · Académico', sub: 'Cita con tutor', icon: 'cap', badge: 'Resuelto', badgeTone: 'green' },
    ] },
  experiencias: { section: 'Experiencias', title: 'Experiencias', icon: 'star', desc: 'Eventos, talleres y actividades extracurriculares.', primary: 'Nueva experiencia', primaryIcon: 'plus',
    kpis: window.PIAGET_FRESH
      ? [{ label: 'Experiencias activas', value: '0', icon: 'star', tone: 'violet' }, { label: 'Inscritos', value: '0', icon: 'users', tone: 'blue' }, { label: 'Próximas', value: '0', icon: 'calendar', tone: 'cyan' }]
      : [{ label: 'Experiencias activas', value: '12', icon: 'star', tone: 'violet' }, { label: 'Inscritos', value: '486', icon: 'users', tone: 'blue' }, { label: 'Próximas', value: '4', icon: 'calendar', tone: 'cyan' }],
    listTitle: 'Próximas experiencias', listSub: 'Calendario', rows: window.PIAGET_FRESH ? [] : [
      { title: 'Feria de ciencias', sub: '18 sep · Auditorio · 142 inscritos', icon: 'compass', badge: 'Abierto', badgeTone: 'green' },
      { title: 'Taller de robótica', sub: '24 sep · Lab · 28 cupos', icon: 'zap', badge: 'Casi lleno', badgeTone: 'amber' },
      { title: 'Visita al museo', sub: '2 oct · 5° y 6° grado', icon: 'map', badge: 'Programado', badgeTone: 'blue' },
    ] },
};

/* ============================================================
   Navegación del ESTUDIANTE — acceso restringido por rol.
   ============================================================ */
window.STUDENT_NAV = [
  {
    section: 'Mi espacio',
    items: [
      { id: 'home', label: 'Inicio', icon: 'grid' },
      { id: 'ai-missions', label: 'Mis Misiones', icon: 'rocket' },
      { id: 'clases', label: 'Mis Clases', icon: 'cap' },
      { id: 'atlas', label: 'Atlas', icon: 'map' },
      { id: 'engage', label: 'Engage', icon: 'zap' },
    ],
  },
  {
    section: 'Comunicación',
    items: [
      { id: 'mensajeria-app', label: 'Mensajería', icon: 'message' },
      { id: 'comunicados', label: 'Comunicados', icon: 'megaphone' },
      { id: 'experiencias', label: 'Experiencias', icon: 'star' },
    ],
  },
  {
    section: 'Mi acceso',
    items: [
      { id: 'mi-credencial', label: 'Mi credencial', icon: 'user' },
      { id: 'historial-accesos', label: 'Historial de accesos', icon: 'history' },
    ],
  },
];
window.STUDENT_ALLOWED = ['home', 'ai-missions', 'clases', 'atlas', 'engage', 'mensajeria-app', 'comunicados', 'experiencias', 'mi-credencial', 'historial-accesos'];

/* ============================================================
   Navegación de la FAMILIA — mismos módulos del alumno (por hijo)
   + Pagos de colegiatura y Tienda en línea.
   ============================================================ */
window.FAMILY_NAV = [
  {
    section: 'Mis hijos',
    items: [
      { id: 'home', label: 'Inicio', icon: 'grid' },
      { id: 'clases', label: 'Clases', icon: 'cap' },
      { id: 'ai-missions', label: 'Misiones', icon: 'rocket' },
      { id: 'atlas', label: 'Atlas', icon: 'map' },
      { id: 'engage', label: 'Engage', icon: 'zap' },
    ],
  },
  {
    section: 'Comunicación',
    items: [
      { id: 'mensajeria-app', label: 'Mensajería', icon: 'message' },
      { id: 'comunicados', label: 'Comunicados', icon: 'megaphone' },
      { id: 'experiencias', label: 'Experiencias', icon: 'star' },
    ],
  },
  {
    section: 'Servicios',
    items: [
      { id: 'pagos', label: 'Pagos de colegiatura', icon: 'wallet' },
      { id: 'tienda-en-linea', label: 'Tienda en línea', icon: 'store' },
    ],
  },
  {
    section: 'Acceso',
    items: [
      { id: 'mi-credencial', label: 'Credencial', icon: 'user' },
      { id: 'historial-accesos', label: 'Historial de accesos', icon: 'history' },
    ],
  },
];
window.FAMILY_ALLOWED = ['home', 'clases', 'ai-missions', 'atlas', 'engage', 'mensajeria-app', 'comunicados', 'experiencias', 'pagos', 'tienda-en-linea', 'mi-credencial', 'historial-accesos'];

/* ============================================================
   Navegación del DOCENTE — solo sus materias y grupos asignados.
   ============================================================ */
window.DOCENTE_NAV = [
  {
    section: 'Principal',
    items: [
      { id: 'home', label: 'Home', icon: 'grid' },
      { id: 'ai-missions', label: 'AI Missions', icon: 'rocket' },
      { id: 'clases', label: 'Clases', icon: 'cap' },
      { id: 'atlas', label: 'Atlas', icon: 'map' },
      { id: 'engage', label: 'Engage', icon: 'zap' },
    ],
  },
  {
    section: 'Gestión académica',
    items: [
      { id: 'calificaciones', label: 'Calificaciones', icon: 'award' },
      { id: 'evaluaciones', label: 'Evaluaciones', icon: 'clipboard' },
      { id: 'asistencia', label: 'Asistencia', icon: 'checkCircle' },
      { id: 'diario', label: 'Diario', icon: 'edit' },
      { id: 'tareas', label: 'Tareas', icon: 'clipboard' },
    ],
  },
  {
    section: 'Comunicación',
    items: [
      { id: 'mensajeria-app', label: 'Mensajería', icon: 'message' },
      { id: 'comunicados', label: 'Comunicados', icon: 'megaphone' },
      { id: 'experiencias', label: 'Experiencias', icon: 'star' },
    ],
  },
];
window.DOCENTE_ALLOWED = ['home', 'ai-missions', 'clases', 'atlas', 'engage', 'calificaciones', 'evaluaciones', 'asistencia', 'diario', 'tareas', 'mensajeria-app', 'comunicados', 'experiencias'];
