/* views_atlas_data.jsx — Atlas: currículo oficial (Plan 2022 / NEM) por nivel, grados y unidades */

/* Ciclo escolar 2025–2026: 40 semanas efectivas, Sep → Jul. Hoy ≈ semana 33 (junio). */
const ATLAS_YEAR = {
  weeks: 40,
  today: window.PIAGET_FRESH ? 0 : 33.4,
  months: ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
  ciclo: (window.PIAGET_CYCLE ? PIAGET_CYCLE() : '2025–2026'),
};

const ATLAS_GRADOS = {
  Preescolar: ['K1', 'K2', 'K3'],
  Primaria: ['1°', '2°', '3°', '4°', '5°', '6°'],
  Secundaria: ['1°', '2°', '3°'],
};
const ATLAS_FASES = {
  Preescolar: { K1: 'Fase 1', K2: 'Fase 2', K3: 'Fase 2' },
  Primaria: { '1°': 'Fase 3', '2°': 'Fase 3', '3°': 'Fase 4', '4°': 'Fase 4', '5°': 'Fase 5', '6°': 'Fase 5' },
  Secundaria: { '1°': 'Fase 6', '2°': 'Fase 6', '3°': 'Fase 6' },
};

/* u: [nombre, semanas, [temas]] */
const ATLAS_CURRICULUM = {
  Preescolar: [
    {
      campo: null, subjects: [
        {
          id: 'pre-leng', name: 'Lenguajes y Comunicación', tone: 'violet', icon: 'bookOpen', units: [
            ['Lenguaje oral', 6, ['Asambleas y diálogo', 'Narración de vivencias', 'Rimas y trabalenguas']],
            ['Acercamiento a la lectura', 7, ['Cuentos compartidos', 'Anticipar la historia', 'Biblioteca del aula']],
            ['Primeras escrituras', 6, ['Mi nombre', 'Grafías y dibujo', 'Mensajes con sentido']],
            ['Cuentos y dramatización', 6, ['Personajes favoritos', 'Títeres', 'Pequeña obra']],
            ['Poesía y canto', 6, ['Canciones y rondas', 'Versos cortos', 'Festival de palabras']],
            ['Proyecto narrador', 7, ['Inventar un cuento', 'Ilustrarlo', 'Contarlo a las familias']],
          ]
        },
        {
          id: 'pre-mate', name: 'Pensamiento Matemático', tone: 'blue', icon: 'hash', units: [
            ['Conteo y número', 7, ['Conteo del 1 al 10', 'Correspondencia uno a uno', 'Colecciones']],
            ['Formas y espacio', 6, ['Figuras básicas', 'Dentro, fuera, cerca, lejos', 'Construcciones']],
            ['Medida', 6, ['Largo y corto', 'Pesado y ligero', 'Comparaciones']],
            ['Patrones', 6, ['Secuencias de colores', 'Patrones con el cuerpo', 'Crear patrones propios']],
            ['Número hasta 20', 7, ['Conteo ampliado', 'Agregar y quitar', 'Juegos de mesa']],
            ['Resolución de problemas', 6, ['Problemas cotidianos', 'Registro gráfico', 'Reto matemático']],
          ]
        },
        {
          id: 'pre-nat', name: 'Exploración del Mundo Natural', tone: 'green', icon: 'compass', units: [
            ['Mis sentidos', 6, ['Explorar con los sentidos', 'Texturas y sonidos', 'Registro de hallazgos']],
            ['Seres vivos del entorno', 7, ['Plantas del jardín', 'Animales cercanos', 'Cuidado de una planta']],
            ['El agua y el clima', 6, ['Estados del agua', 'El clima de hoy', 'Cuidado del agua']],
            ['Mi comunidad', 6, ['Oficios y servicios', 'Lugares importantes', 'Visita guiada']],
            ['Experimentos sencillos', 7, ['Flota o se hunde', 'Mezclas de colores', 'Mi primer registro']],
            ['Cuidado del planeta', 6, ['Reciclaje', 'Huerto escolar', 'Guardianes de la naturaleza']],
          ]
        },
        {
          id: 'pre-hum', name: 'De lo Humano y lo Comunitario', tone: 'amber', icon: 'heart', units: [
            ['Identidad y emociones', 7, ['Así soy yo', 'Nombrar emociones', 'Calmarse y respirar']],
            ['Convivencia', 6, ['Acuerdos del salón', 'Compartir y esperar turno', 'Amistad']],
            ['Cuerpo y movimiento', 6, ['Motricidad gruesa', 'Motricidad fina', 'Juego libre y con reglas']],
            ['Hábitos saludables', 6, ['Higiene', 'Alimentos que nutren', 'Rutinas de sueño']],
            ['Arte y expresión', 7, ['Pintura y modelado', 'Música y baile', 'Exposición de arte']],
            ['Proyecto comunitario', 6, ['Ayudar en casa', 'Ayudar en la escuela', 'Festejo de cierre']],
          ]
        },
      ]
    },
  ],

  Primaria: [
    {
      campo: 'Lenguajes', subjects: [
        {
          id: 'pri-esp', name: 'Español', tone: 'violet', icon: 'bookOpen', units: [
            ['Textos narrativos', 6, ['El cuento y sus elementos', 'Personajes y trama', 'Escritura de un cuento propio']],
            ['Textos informativos', 6, ['Idea principal y secundarias', 'Fichas de resumen', 'Exposición oral']],
            ['Poesía y juegos de palabras', 5, ['Rima y métrica', 'Figuras retóricas básicas', 'Recital del grupo']],
            ['Textos instructivos', 6, ['Estructura del instructivo', 'Verbos en imperativo', 'Manual ilustrado por equipos']],
            ['Teatro y diálogo', 7, ['Guion teatral', 'Acotaciones y diálogos', 'Puesta en escena']],
            ['Periodismo escolar', 8, ['La noticia y sus partes', 'La entrevista', 'Gaceta del grupo']],
          ]
        },
        {
          id: 'pri-ing', name: 'Inglés', tone: 'amber', icon: 'globe', units: [
            ['All About Me', 6, ['Greetings and introductions', 'Family vocabulary', 'My profile poster']],
            ['My School Day', 6, ['School objects', 'Telling time', 'Daily routines']],
            ['Food and Health', 6, ['Food vocabulary', 'Likes and dislikes', 'Healthy menu project']],
            ['Animals and Nature', 7, ['Animal descriptions', 'Can / can\u2019t abilities', 'Mini safari book']],
            ['Stories and Legends', 6, ['Past simple intro', 'Story sequencing', 'Retelling a legend']],
            ['My Community', 7, ['Places in town', 'Giving directions', 'Community map project']],
          ]
        },
      ]
    },
    {
      campo: 'Saberes y Pensamiento Científico', subjects: [
        {
          id: 'pri-mat', name: 'Matemáticas', tone: 'blue', icon: 'hash', units: [
            ['Números naturales', 6, ['Valor posicional', 'Orden y comparación', 'Suma y resta con transición']],
            ['Multiplicación y división', 7, ['Tablas y arreglos', 'Algoritmo de la multiplicación', 'Reparto y división']],
            ['Fracciones', 7, ['Fracciones equivalentes', 'Comparación de fracciones', 'Suma de fracciones']],
            ['Geometría y medición', 6, ['Figuras y cuerpos', 'Perímetro y área', 'Unidades de medida']],
            ['Datos y probabilidad', 5, ['Tablas y gráficas', 'Moda y media', 'Experimentos aleatorios']],
            ['Proporcionalidad', 7, ['Variación proporcional', 'Porcentajes', 'Problemas aplicados']],
          ]
        },
        {
          id: 'pri-cie', name: 'Ciencias Naturales', tone: 'green', icon: 'compass', units: [
            ['Seres vivos', 7, ['Características de los seres vivos', 'Cadenas alimentarias', 'Ecosistemas locales']],
            ['Cuerpo humano y salud', 6, ['Sistemas del cuerpo', 'Alimentación saludable', 'Prevención de enfermedades']],
            ['Materia y sus cambios', 6, ['Estados de la materia', 'Mezclas', 'Cambios físicos y químicos']],
            ['Energía', 6, ['Fuentes de energía', 'Calor y temperatura', 'Energías limpias']],
            ['La Tierra y el universo', 6, ['Movimientos de la Tierra', 'Fases de la Luna', 'Sistema solar']],
            ['Proyecto científico', 7, ['Pregunta e hipótesis', 'Experimentación', 'Feria de ciencias']],
          ]
        },
      ]
    },
    {
      campo: 'Ética, Naturaleza y Sociedades', subjects: [
        {
          id: 'pri-his', name: 'Historia', tone: 'red', icon: 'flag', units: [
            ['Primeros pobladores', 6, ['Poblamiento de América', 'Vida nómada y sedentaria', 'Zonas culturales']],
            ['Mesoamérica', 7, ['Olmecas y mayas', 'Teotihuacán y mexicas', 'Legado mesoamericano']],
            ['Conquista y Virreinato', 7, ['Encuentro de dos mundos', 'Sociedad virreinal', 'Mestizaje cultural']],
            ['Independencia', 6, ['Causas de la Independencia', 'Hidalgo y Morelos', 'Consumación']],
            ['México independiente', 6, ['Primer imperio y república', 'La Reforma', 'El Porfiriato']],
            ['Revolución Mexicana', 6, ['Causas de la Revolución', 'Personajes y planes', 'Constitución de 1917']],
          ]
        },
        {
          id: 'pri-geo', name: 'Geografía', tone: 'cyan', icon: 'map', units: [
            ['Mi entidad y el mapa', 6, ['Croquis y planos', 'Puntos cardinales', 'Símbolos del mapa']],
            ['Relieve y agua de México', 7, ['Sierras y llanuras', 'Ríos y lagos', 'Regiones naturales']],
            ['Climas y biodiversidad', 6, ['Tipos de clima', 'Flora y fauna', 'Áreas protegidas']],
            ['Población y cultura', 6, ['Distribución de la población', 'Migración', 'Diversidad cultural']],
            ['Actividades económicas', 7, ['Campo y ciudad', 'Industria y comercio', 'Turismo']],
            ['Cuidado del territorio', 6, ['Problemas ambientales', 'Prevención de desastres', 'Proyecto comunitario']],
          ]
        },
        {
          id: 'pri-fce', name: 'F. Cívica y Ética', tone: 'blue', icon: 'shield', units: [
            ['Identidad y autoestima', 6, ['Quién soy', 'Emociones y autorregulación', 'Metas personales']],
            ['Convivencia y reglas', 6, ['Acuerdos del aula', 'Resolución de conflictos', 'Mediación entre pares']],
            ['Derechos de la niñez', 7, ['Derechos y responsabilidades', 'Instituciones que protegen', 'Casos y dilemas']],
            ['Igualdad y no discriminación', 6, ['Empatía y respeto', 'Inclusión', 'Campaña del grupo']],
            ['Democracia y participación', 7, ['Votaciones del aula', 'Autoridades y leyes', 'Proyecto de participación']],
            ['Cultura de paz', 6, ['Diálogo y escucha', 'Redes sociales seguras', 'Compromisos finales']],
          ]
        },
      ]
    },
    {
      campo: 'De lo Humano y lo Comunitario', subjects: [
        {
          id: 'pri-art', name: 'Artes', tone: 'violet', icon: 'star', units: [
            ['Color y forma', 6, ['Círculo cromático', 'Composición', 'Mural colectivo']],
            ['Ritmo y cuerpo', 6, ['Pulso y ritmo', 'Percusión corporal', 'Secuencia grupal']],
            ['Teatro e improvisación', 7, ['Expresión corporal', 'Improvisación guiada', 'Escena breve']],
            ['Música y canto', 6, ['Canon y coro', 'Instrumentos del aula', 'Ensamble']],
            ['Danza tradicional', 6, ['Pasos básicos', 'Danzas regionales', 'Presentación']],
            ['Proyecto artístico', 7, ['Idea y boceto', 'Producción', 'Muestra de fin de curso']],
          ]
        },
        {
          id: 'pri-edf', name: 'Ed. Física', tone: 'green', icon: 'zap', units: [
            ['Conocimiento corporal', 6, ['Esquema corporal', 'Lateralidad', 'Equilibrio']],
            ['Habilidades motrices', 7, ['Correr y saltar', 'Lanzar y atrapar', 'Circuitos']],
            ['Juegos cooperativos', 6, ['Reglas y roles', 'Trabajo en equipo', 'Torneo interno']],
            ['Iniciación deportiva', 7, ['Fundamentos de básquetbol', 'Fundamentos de fútbol', 'Minitorneo']],
            ['Ritmo y expresión', 6, ['Coordinación con música', 'Cuerdas y aros', 'Coreografía']],
            ['Reto físico final', 6, ['Resistencia', 'Pruebas de habilidad', 'Olimpiada escolar']],
          ]
        },
      ]
    },
  ],

  Secundaria: [
    {
      campo: 'Lenguajes', subjects: [
        {
          id: 'sec-esp', name: 'Español', tone: 'violet', icon: 'bookOpen', units: [
            ['Mitos y leyendas', 6, ['Características del mito', 'Versiones de una leyenda', 'Antología del grupo']],
            ['Reglamentos y normas', 6, ['Función de los reglamentos', 'Modos y tiempos verbales', 'Reglamento del aula']],
            ['Cuento latinoamericano', 7, ['Contexto y autor', 'Ambiente y narrador', 'Comentario literario']],
            ['Ensayo y argumentación', 6, ['Tesis y argumentos', 'Conectores', 'Ensayo breve']],
            ['Lírica', 6, ['Movimientos poéticos', 'Análisis de poemas', 'Creación poética']],
            ['Campañas y debate', 7, ['Lenguaje persuasivo', 'Debate formal', 'Campaña escolar']],
          ]
        },
        {
          id: 'sec-ing', name: 'Inglés', tone: 'amber', icon: 'globe', units: [
            ['Identity and Friends', 6, ['Personal information', 'Describing people', 'Social media profiles']],
            ['Past Experiences', 7, ['Past simple & continuous', 'Anecdotes', 'Storytelling']],
            ['Future Plans', 6, ['Will & going to', 'Predictions', 'My future project']],
            ['Media Literacy', 6, ['News headlines', 'Fact vs. opinion', 'Class newscast']],
            ['Culture Around the World', 6, ['Comparatives', 'Traditions', 'Cultural fair']],
            ['Final Project', 7, ['Research', 'Drafting', 'Oral presentation']],
          ]
        },
      ]
    },
    {
      campo: 'Saberes y Pensamiento Científico', subjects: [
        {
          id: 'sec-mat', name: 'Matemáticas', tone: 'blue', icon: 'hash', units: [
            ['Números con signo', 6, ['Enteros y orden', 'Suma y resta', 'Multiplicación y división']],
            ['Ecuaciones lineales', 7, ['Lenguaje algebraico', 'Ecuaciones de una incógnita', 'Problemas con ecuaciones']],
            ['Proporcionalidad y funciones', 6, ['Razones y tasas', 'Función lineal', 'Gráficas']],
            ['Geometría', 6, ['Ángulos y triángulos', 'Congruencia', 'Construcciones']],
            ['Área y volumen', 6, ['Polígonos', 'El círculo', 'Prismas y cilindros']],
            ['Estadística y azar', 7, ['Medidas de tendencia', 'Dispersión', 'Probabilidad clásica']],
          ]
        },
        {
          id: 'sec-cie', name: 'Ciencias (Biología)', tone: 'green', icon: 'compass', units: [
            ['La célula', 7, ['Teoría celular', 'Célula animal y vegetal', 'Uso del microscopio']],
            ['Nutrición', 6, ['Sistema digestivo', 'Dieta correcta', 'Trastornos alimentarios']],
            ['Respiración y circulación', 6, ['Intercambio de gases', 'Sistema circulatorio', 'Cuidados de la salud']],
            ['Reproducción', 6, ['Sexualidad responsable', 'Reproducción celular', 'Herencia']],
            ['Evolución', 6, ['Selección natural', 'Evidencias', 'Biodiversidad de México']],
            ['Ecología', 7, ['Ecosistemas', 'Impacto humano', 'Proyecto sustentable']],
          ]
        },
        {
          id: 'sec-tec', name: 'Tecnología', tone: 'cyan', icon: 'settings', units: [
            ['Técnica y sociedad', 6, ['Qué es la técnica', 'Necesidades y soluciones', 'Análisis de objetos']],
            ['Diseño', 7, ['Boceto y planos', 'Materiales', 'Prototipo rápido']],
            ['Energía y máquinas', 6, ['Máquinas simples', 'Circuitos básicos', 'Eficiencia']],
            ['Información digital', 6, ['Hoja de cálculo', 'Seguridad digital', 'Presentaciones']],
            ['Proyecto técnico', 7, ['Planeación', 'Construcción', 'Pruebas']],
            ['Innovación', 6, ['Mejora del prototipo', 'Impacto ambiental', 'Expo tecnológica']],
          ]
        },
      ]
    },
    {
      campo: 'Ética, Naturaleza y Sociedades', subjects: [
        {
          id: 'sec-his', name: 'Historia', tone: 'red', icon: 'flag', units: [
            ['Civilizaciones antiguas', 6, ['Mesopotamia y Egipto', 'Grecia y Roma', 'Legados al presente']],
            ['Edad Media', 6, ['Feudalismo', 'Islam y cruzadas', 'Cultura medieval']],
            ['Renacimiento y exploración', 7, ['Humanismo', 'Grandes viajes', 'Reforma religiosa']],
            ['Revoluciones', 6, ['Ilustración', 'Revolución francesa', 'Revolución industrial']],
            ['Siglo XX', 7, ['Guerras mundiales', 'Guerra fría', 'Descolonización']],
            ['Mundo contemporáneo', 6, ['Globalización', 'Derechos humanos', 'Retos actuales']],
          ]
        },
        {
          id: 'sec-geo', name: 'Geografía', tone: 'cyan', icon: 'map', units: [
            ['Espacio geográfico', 6, ['Categorías de análisis', 'Mapas y escalas', 'Tecnologías geográficas']],
            ['Dinámicas naturales', 7, ['Placas tectónicas', 'Relieve y suelos', 'Riesgos naturales']],
            ['Agua y clima', 6, ['Ciclo hidrológico', 'Climas del mundo', 'Cambio climático']],
            ['Población mundial', 6, ['Crecimiento y estructura', 'Migraciones', 'Urbanización']],
            ['Economía global', 7, ['Recursos y producción', 'Comercio internacional', 'Desigualdad']],
            ['Geopolítica', 6, ['Fronteras y conflictos', 'Organismos internacionales', 'Proyecto de análisis']],
          ]
        },
        {
          id: 'sec-fce', name: 'F. Cívica y Ética', tone: 'blue', icon: 'shield', units: [
            ['Adolescencia e identidad', 6, ['Cambios y decisiones', 'Proyecto de vida', 'Presión social']],
            ['Libertad y responsabilidad', 7, ['Autonomía moral', 'Dilemas éticos', 'Consecuencias']],
            ['Derechos humanos', 6, ['Dignidad e igualdad', 'Mecanismos de defensa', 'Casos actuales']],
            ['Justicia y legalidad', 6, ['Estado de derecho', 'Cultura de la legalidad', 'Participación']],
            ['Democracia', 6, ['Ciudadanía', 'Elecciones', 'Rendición de cuentas']],
            ['Proyecto ciudadano', 7, ['Diagnóstico comunitario', 'Plan de acción', 'Presentación pública']],
          ]
        },
      ]
    },
    {
      campo: 'De lo Humano y lo Comunitario', subjects: [
        {
          id: 'sec-edf', name: 'Ed. Física', tone: 'green', icon: 'zap', units: [
            ['Condición física', 6, ['Evaluación inicial', 'Frecuencia cardiaca', 'Plan personal']],
            ['Deportes de conjunto', 7, ['Básquetbol', 'Voleibol', 'Reglamento y juego limpio']],
            ['Atletismo', 6, ['Velocidad', 'Salto y lanzamiento', 'Mini competencia']],
            ['Deportes de raqueta', 6, ['Bádminton', 'Tenis de mesa', 'Torneo relámpago']],
            ['Expresión corporal', 6, ['Acrosport', 'Coreografías', 'Muestra grupal']],
            ['Torneo final', 7, ['Organización', 'Fase de grupos', 'Final y premiación']],
          ]
        },
      ]
    },
  ],
};

/* ---------- Helpers deterministas ---------- */
function atlasHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/* Unidades con semana de inicio/fin calculadas (huecos de 0.4 sem entre unidades) */
function atlasUnits(subj) {
  let cursor = 0.4;
  return subj.units.map(([n, w, temas], i) => {
    const s = cursor;
    cursor += w + 0.4;
    return { i, n, w, temas, s, e: s + w };
  });
}

/* Rezago del grado completo en una asignatura: -1.5 (adelantado) … +2.5 sem (atrasado) */
function atlasLag(nivel, grado, subjId) {
  if (window.PIAGET_FRESH) return 0;
  const h = atlasHash(nivel + grado + subjId);
  return ((h % 9) - 3) / 2;
}

/* Estado de avance de la cohorte grado×asignatura */
function atlasProgress(nivel, grado, subj) {
  const lag = atlasLag(nivel, grado, subj.id);
  const actualWeek = Math.max(0, Math.min(ATLAS_YEAR.weeks, ATLAS_YEAR.today - lag));
  const units = atlasUnits(subj);
  const done = units.filter(u => u.e <= actualWeek).length;
  const current = units.find(u => u.s <= actualWeek && u.e > actualWeek) || null;
  const status = lag >= 1.5 ? 'atrasado' : lag <= -1 ? 'adelantado' : 'al-corriente';
  return { lag, actualWeek, units, done, current, status, pct: Math.round(actualWeek / ATLAS_YEAR.weeks * 100) };
}

/* Estado de una unidad dado el avance real */
function atlasUnitState(u, actualWeek) {
  if (u.e <= actualWeek) return { k: 'done', frac: 1 };
  if (u.s < actualWeek) return { k: 'current', frac: (actualWeek - u.s) / u.w };
  return { k: 'upcoming', frac: 0 };
}

/* Grupos del grado (desde Clases) con rezago individual por asignatura */
function atlasGroups(nivel, grado, subjId) {
  const cohortLag = atlasLag(nivel, grado, subjId);
  return (window.DB.clases || []).filter(c => c.nivel === nivel && c.g.startsWith(grado) && (!window.docAllowsGroup || window.docAllowsGroup(c.g))).map(c => {
    const jitter = window.PIAGET_FRESH ? 0 : ((atlasHash(c._id + subjId) % 21) - 8) / 10; /* -0.8 … +1.2 */
    const lag = Math.round((cohortLag + jitter) * 10) / 10;
    return { ...c, lag };
  });
}

function atlasLagLabel(lag) {
  if (lag >= 0.6) return { tone: lag >= 1.5 ? 'red' : 'amber', label: '−' + lag.toFixed(1) + ' sem' };
  if (lag <= -0.6) return { tone: 'green', label: '+' + Math.abs(lag).toFixed(1) + ' sem' };
  return { tone: 'blue', label: 'Al corriente' };
}

/* ---------- Generador de planeación (2 enfoques para "Regenerar") ---------- */
const ATLAS_PLAN_MODES = [
  {
    enfoque: 'Proyecto colaborativo',
    sesiones: (t) => [
      'Activación: lluvia de ideas y saberes previos sobre ' + t[0].toLowerCase(),
      'Exploración guiada: ' + t[0] + ' con material concreto y registro en el cuaderno',
      'Trabajo en equipos: ' + t[1].toLowerCase() + ' aplicado a un caso del entorno escolar',
      'Producción: ' + t[2].toLowerCase() + ' como producto integrador del equipo',
      'Cierre: presentación al grupo, retroalimentación entre pares y autoevaluación',
    ],
    evaluacion: 'Rúbrica de producto integrador (60%) + participación en equipo (25%) + autoevaluación (15%).',
  },
  {
    enfoque: 'Estaciones de aprendizaje',
    sesiones: (t) => [
      'Diagnóstico breve y organización de las 3 estaciones de trabajo',
      'Estación A: ' + t[0] + ' — práctica guiada con tarjetas autocorregibles',
      'Estación B: ' + t[1] + ' — reto en parejas con registro de evidencias',
      'Estación C: ' + t[2] + ' — aplicación libre y galería de resultados',
      'Plenaria: conclusiones del grupo y lista de cotejo individual',
    ],
    evaluacion: 'Lista de cotejo por estación (50%) + evidencia escrita (30%) + plenaria (20%).',
  },
];

/* ---------- Puente Atlas → AI Missions ---------- */
/* El wizard de misiones trabaja con el catálogo corto de materias (DB.subjects) */
function atlasToMissionSubject(name) {
  if (/Matem/i.test(name)) return 'Matemáticas';
  if (/Ingl|English/i.test(name)) return 'Inglés';
  if (/Espa|Leng|Artes/i.test(name)) return 'Español';
  if (/Histor|Geograf|Cívic|Sociedad/i.test(name)) return 'Historia';
  if (/Fís|Movim|Humano/i.test(name)) return 'Ed. Física';
  return 'Ciencias';
}

/* Deja el contexto para que AI Missions abra su wizard pre-llenado */
function atlasMissionHandoff(go, { subj, nivel, grado, unit, groups, reason }) {
  const topic = (reason ? reason + ' · ' : '') + (unit ? 'Unidad «' + unit.n + '»: ' + unit.temas.join(', ').toLowerCase() : '');
  window.MISSION_PREFILL = {
    subject: atlasToMissionSubject(subj.name),
    groups: (groups && groups.length ? groups : atlasGroups(nivel, grado, subj.id).map(g => g.g)).slice(0, 4),
    topic,
    origin: subj.name + ' · ' + grado + ' ' + nivel,
    atlas: { subjId: subj.id, nivel, grado, unitI: unit ? unit.i : null, unitName: unit ? unit.n : null },
  };
  go('ai-missions');
}

/* Puente inverso: misiones creadas desde Atlas que cubren esta asignatura×grado */
function atlasRefuerzos(nivel, grado, subjId) {
  return (window.DB.missions || []).filter(m =>
    m.atlas && m.atlas.nivel === nivel && m.atlas.grado === grado && m.atlas.subjId === subjId && m.status !== 'finalizada');
}

Object.assign(window, {
  ATLAS_YEAR, ATLAS_GRADOS, ATLAS_FASES, ATLAS_CURRICULUM, ATLAS_PLAN_MODES,
  atlasHash, atlasUnits, atlasLag, atlasProgress, atlasUnitState, atlasGroups, atlasLagLabel,
  atlasToMissionSubject, atlasMissionHandoff, atlasRefuerzos,
});

/* views_atlas.jsx — Atlas: mapa curricular oficial (Plan 2022 / NEM) con línea de tiempo del ciclo, detalle por asignatura y Copilot */

/* ============================================================
   Modal: Generar planeación de unidad con IA
   ============================================================ */
function AtlasPlanModal({ unit, subj, nivel, grado, onClose }) {
  const open = !!unit;
  const [step, setStep] = React.useState('thinking');
  const [mode, setMode] = React.useState(0);
  React.useEffect(() => {
    if (!open) return;
    setStep('thinking'); setMode(0);
    const t = setTimeout(() => setStep('proposal'), 1300);
    return () => clearTimeout(t);
  }, [open, unit && unit.i]);
  if (!open) return null;

  const plan = ATLAS_PLAN_MODES[mode % ATLAS_PLAN_MODES.length];
  const t = window.TONE[subj.tone];
  const regen = () => { setStep('thinking'); setTimeout(() => { setMode(m => m + 1); setStep('proposal'); }, 1100); };
  const save = () => {
    Store.log('Copilot', 'generó la planeación "' + unit.n + '" para ' + grado + ' ' + nivel, 'doc');
    toast('Planeación guardada en Documentación', 'ok');
    onClose();
  };

  const footer = step === 'proposal' ? (
    <>
      <button className="btn" onClick={regen}><Icon name="refresh" size={15} className="btn-ico" />Regenerar</button>
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn primary" onClick={save}><Icon name="doc" size={15} className="btn-ico" />Guardar planeación</button>
    </>
  ) : null;

  return (
    <Modal open={open} title="Generar planeación de unidad" onClose={onClose} width={580} footer={footer}>
      {step === 'thinking' && (
        <div className="col center gap-12" style={{ padding: '28px 0', textAlign: 'center' }}>
          <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name="spark" size={20} fill="currentColor" /></div>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>Redactando la planeación…</div>
          <div className="faint" style={{ fontSize: 12.5 }}>Unidad «{unit.n}» · {subj.name} · {grado} {nivel}</div>
          <div className="typing" style={{ marginTop: 4 }}><span></span><span></span><span></span></div>
        </div>
      )}
      {step === 'proposal' && (
        <>
          <div className="row center gap-8 faint" style={{ fontSize: 12 }}>
            <Icon name="spark" size={13} fill="currentColor" style={{ color: 'var(--accent)' }} />
            Borrador alineado al programa sintético · enfoque: {plan.enfoque}
          </div>
          <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div className="row between center">
              <div className="row center gap-11">
                <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0 }}><Icon name={subj.icon} size={19} /></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15.5 }}>{unit.n}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{subj.name} · {grado} {nivel} · Semanas {Math.round(unit.s)}–{Math.round(unit.e)}</div>
                </div>
              </div>
              <Badge tone="violet">{ATLAS_FASES[nivel][grado]}</Badge>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
              <b style={{ color: 'var(--text)' }}>Propósito.</b> Consolidar los contenidos de la unidad —{unit.temas.join(', ').toLowerCase()}— mediante un enfoque de {plan.enfoque.toLowerCase()}, con productos observables por sesión.
            </div>
            <div className="col gap-7" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              {plan.sesiones(unit.temas).map((s, i) => (
                <div key={i} className="row gap-9" style={{ fontSize: 13, alignItems: 'flex-start' }}>
                  <span style={{ width: 20, height: 20, borderRadius: 999, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                  <span style={{ lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', paddingTop: 12, borderTop: '1px solid var(--border)', lineHeight: 1.55 }}>
              <b style={{ color: 'var(--text)' }}>Evaluación.</b> {plan.evaluacion}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ============================================================
   Detalle de asignatura: unidades, temas, grupos y Copilot
   ============================================================ */
function AtlasDetail({ nivel, grado, subj, campo, onBack, go, openCopilot }) {
  useStore();
  const prog = atlasProgress(nivel, grado, subj);
  const groups = atlasGroups(nivel, grado, subj.id);
  const refz = atlasRefuerzos(nivel, grado, subj.id);
  const behind = groups.filter(g => g.lag >= 1.5).sort((a, b) => b.lag - a.lag);
  const defaultOpen = prog.current ? prog.current.i : Math.max(0, prog.done - 1);
  const [openUnit, setOpenUnit] = React.useState(defaultOpen);
  const [planUnit, setPlanUnit] = React.useState(null);
  const t = window.TONE[subj.tone];
  const st = { atrasado: ['amber', 'Atrasado'], 'al-corriente': ['green', 'Al corriente'], adelantado: ['blue', 'Adelantado'] }[prog.status];

  return (
    <div className="content-inner">
      <button className="chip-btn plain" style={{ marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={onBack}>
        <Icon name="arrowRight" size={13} style={{ transform: 'scaleX(-1)' }} />Volver al mapa
      </button>
      <PageHead eyebrow={'Atlas · ' + nivel + ' ' + grado} title={subj.name}
        desc={(campo ? 'Campo formativo: ' + campo + ' · ' : '') + ATLAS_FASES[nivel][grado] + ' · Ciclo ' + ATLAS_YEAR.ciclo}>
        <button className="btn primary" onClick={() => setPlanUnit(prog.current || prog.units[defaultOpen])}>
          <Icon name="spark" size={15} className="btn-ico" fill="currentColor" />Generar planeación
        </button>
      </PageHead>

      <div className="grid" style={{ gridTemplateColumns: '1.45fr 1fr', alignItems: 'start' }}>
        {/* Ruta de unidades */}
        <div className="card">
          <CardHead icon="map" title="Ruta de la asignatura" sub={prog.units.length + ' unidades · ' + ATLAS_YEAR.weeks + ' semanas de ciclo'}
            right={<Badge tone={st[0]}>{st[1]}</Badge>} />
          <div>
            {prog.units.map(u => {
              const us = atlasUnitState(u, prog.actualWeek);
              const late = u.e <= ATLAS_YEAR.today && us.k !== 'done';
              const rz = refz.find(m => m.atlas.unitI === u.i);
              const isOpen = openUnit === u.i;
              const temaCut = us.k === 'done' ? 3 : us.k === 'current' ? Math.floor(us.frac * 3) : -1;
              return (
                <div key={u.i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <button className="lrow clickable" style={{ width: '100%', textAlign: 'left', background: isOpen ? 'var(--surface-2)' : 'none', border: 'none', color: 'inherit', font: 'inherit' }}
                    onClick={() => setOpenUnit(isOpen ? -1 : u.i)}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 999, flexShrink: 0, display: 'grid', placeItems: 'center',
                      background: us.k === 'done' ? t.c : us.k === 'current' ? t.bg : 'var(--surface-2)',
                      color: us.k === 'done' ? 'var(--surface)' : us.k === 'current' ? t.c : 'var(--text-faint)',
                      border: us.k === 'done' ? 'none' : '1.5px solid ' + (us.k === 'current' ? t.c : 'var(--border-strong)'),
                      fontSize: 12, fontWeight: 700,
                    }}>
                      {us.k === 'done' ? <Icon name="check" size={14} stroke={3} /> : u.i + 1}
                    </div>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{u.n}</div>
                      <div className="faint" style={{ fontSize: 12 }}>Semanas {Math.round(u.s)}–{Math.round(u.e)} · {u.temas.length} temas</div>
                    </div>
                    {rz && <Badge tone="violet"><Icon name="rocket" size={11} />En refuerzo</Badge>}
                    {late && <Badge tone="amber" dot>Atrasada</Badge>}
                    {us.k === 'current' && !late && <Badge tone="blue" dot>En curso · {Math.round(us.frac * 100)}%</Badge>}
                    <Icon name="chevD" size={15} className="faint" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
                  </button>
                  {isOpen && (
                    <div style={{ padding: '4px 20px 15px 63px' }}>
                      <div className="col gap-6">
                        {u.temas.map((tema, ti) => {
                          const tDone = ti < temaCut;
                          const tCur = us.k === 'current' && ti === temaCut;
                          return (
                            <div key={ti} className="row center gap-9" style={{ fontSize: 13 }}>
                              <span style={{
                                width: 16, height: 16, borderRadius: 999, flexShrink: 0, display: 'grid', placeItems: 'center',
                                background: tDone ? t.bg : 'transparent', color: tDone ? t.c : 'var(--text-faint)',
                                border: tDone ? 'none' : '1.5px solid ' + (tCur ? t.c : 'var(--border-strong)'),
                              }}>{tDone && <Icon name="check" size={10} stroke={3.4} />}</span>
                              <span style={{ color: tDone || tCur ? 'var(--text)' : 'var(--text-muted)', fontWeight: tCur ? 600 : 400 }}>{tema}</span>
                              {tCur && <Badge tone="blue">En el aula esta semana</Badge>}
                            </div>
                          );
                        })}
                      </div>
                      <div className="row gap-8" style={{ marginTop: 12 }}>
                        <button className="chip-btn" onClick={() => setPlanUnit(u)}><Icon name="spark" size={12} fill="currentColor" style={{ marginRight: 5, verticalAlign: '-2px' }} />Generar planeación</button>
                        {rz
                          ? <button className="chip-btn plain" onClick={() => go('ai-missions')}>Ver misión «{rz.title}»</button>
                          : <button className="chip-btn plain" onClick={() => atlasMissionHandoff(go, { subj, nivel, grado, unit: u, groups: behind.map(b => b.g), reason: 'Misión sobre el tema' })}>Crear misión del tema</button>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna derecha */}
        <div className="col gap-16">
          <div className="card pad">
            <div className="row center gap-14">
              <RingStat value={prog.pct} label="del ciclo" size={104} color={t.c} />
              <div className="col gap-8" style={{ flex: 1 }}>
                <div className="row between center" style={{ fontSize: 13 }}><span className="faint">Unidades cerradas</span><span className="tnum" style={{ fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{prog.done} de {prog.units.length}</span></div>
                <div className="row between center" style={{ fontSize: 13 }}><span className="faint">Semana del plan</span><span className="tnum" style={{ fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{Math.round(ATLAS_YEAR.today)} de {ATLAS_YEAR.weeks}</span></div>
                <div className="row between center" style={{ fontSize: 13 }}>
                  <span className="faint">Posición vs plan</span>
                  <Badge tone={atlasLagLabel(prog.lag).tone}>{atlasLagLabel(prog.lag).label}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="ai-panel">
            <div className="ai-panel-head">
              <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
              <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>Copilot sugiere</div><div className="faint" style={{ fontSize: 11.5 }}>{subj.name} · {grado} {nivel}</div></div>
            </div>
            {prog.lag >= 1 && prog.current ? (
              <div className="insight">
                <div className="insight-ico" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon name="alert" size={15} /></div>
                <div className="insight-body">
                  <div className="insight-title">Brecha de {prog.lag.toFixed(1)} semanas vs plan</div>
                  <div className="insight-text">Compactar <b>«{prog.current.n}»</b> priorizando <b>{prog.current.temas[2].toLowerCase()}</b> y reforzar lo pendiente con una misión de repaso recuperaría el calendario antes del cierre.</div>
                  <div className="insight-actions">
                    <button className="chip-btn" onClick={() => setPlanUnit(prog.current)}>Planeación compactada</button>
                    <button className="chip-btn plain" onClick={() => atlasMissionHandoff(go, { subj, nivel, grado, unit: prog.current, groups: behind.map(b => b.g), reason: 'Repaso para cerrar brecha de ' + prog.lag.toFixed(1) + ' sem' })}>Misión de repaso</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="insight">
                <div className="insight-ico" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}><Icon name="checkCircle" size={15} /></div>
                <div className="insight-body">
                  <div className="insight-title">Ritmo saludable</div>
                  <div className="insight-text">El grado avanza {prog.lag <= -1 ? 'adelantado al' : 'en línea con el'} plan. Buen momento para un proyecto de profundización en <b>«{(prog.current || prog.units[prog.units.length - 1]).n}»</b>.</div>
                  <div className="insight-actions">
                    <button className="chip-btn" onClick={() => atlasMissionHandoff(go, { subj, nivel, grado, unit: prog.current || prog.units[prog.units.length - 1], groups: [], reason: 'Profundización: el grado va al corriente' })}>Misión de profundización</button>
                  </div>
                </div>
              </div>
            )}
            {refz.length > 0 && (
              <div className="insight">
                <div className="insight-ico" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}><Icon name="rocket" size={15} /></div>
                <div className="insight-body">
                  <div className="insight-title">{refz.length === 1 ? 'Refuerzo en marcha' : refz.length + ' refuerzos en marcha'}</div>
                  <div className="insight-text">{refz.map((m, i) => <React.Fragment key={m._id}>{i > 0 && ' · '}<b>«{m.title}»</b> ({m.atlas.unitName ? 'U: ' + m.atlas.unitName : subj.name}, {m.groups.join(', ')})</React.Fragment>)} — creada{refz.length > 1 ? 's' : ''} desde Atlas.</div>
                  <div className="insight-actions">
                    <button className="chip-btn" onClick={() => go('ai-missions')}>Seguir en AI Missions</button>
                  </div>
                </div>
              </div>
            )}
            {behind.length > 0 && (
              <div className="insight">
                <div className="insight-ico" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}><Icon name="users" size={15} /></div>
                <div className="insight-body">
                  <div className="insight-title">{behind.length === 1 ? '1 grupo necesita apoyo' : behind.length + ' grupos necesitan apoyo'}</div>
                  <div className="insight-text">{behind.map(g => g.g).join(', ')} {behind.length === 1 ? 'acumula' : 'acumulan'} más de 1.5 semanas de rezago en esta asignatura.</div>
                  <div className="insight-actions">
                    <button className="chip-btn" onClick={openCopilot}>Plan de nivelación</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <CardHead icon="users" title="Grupos vs plan" sub={groups.length + ' grupos de ' + grado + ' ' + nivel.toLowerCase()} />
            <div>
              {groups.map(g => {
                const ll = atlasLagLabel(g.lag);
                const gw = Math.max(0, Math.min(ATLAS_YEAR.weeks, ATLAS_YEAR.today - g.lag));
                return (
                  <div className="lrow" key={g._id}>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="row between center" style={{ marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{g.g}</span>
                        <span className="row center gap-8">
                          <span className="faint" style={{ fontSize: 11.5 }}>{g.titular}</span>
                          <Badge tone={ll.tone}>{ll.label}</Badge>
                        </span>
                      </div>
                      <Bar value={gw / ATLAS_YEAR.weeks * 100} color={g.lag >= 1.5 ? 'var(--amber)' : t.c} height={6} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AtlasPlanModal unit={planUnit} subj={subj} nivel={nivel} grado={grado} onClose={() => setPlanUnit(null)} />
    </div>
  );
}

/* ============================================================
   Vista principal: mapa del ciclo escolar
   ============================================================ */
function Atlas({ go, openCopilot }) {
  useStore();

  /* ---- Alcance del docente: solo sus niveles, grados y materias ---- */
  const sc = window.docScope && window.docScope();
  const gradoOfGroup = (g) => { g = String(g || ''); const k = g.match(/K\d/i); if (k) return k[0].toUpperCase(); const m = g.match(/(\d)°/); return m ? m[1] + '°' : null; };
  const NIVELES_ALL = ['Preescolar', 'Primaria', 'Secundaria'];
  const nivelesAllowed = (sc && sc.niveles && sc.niveles.length) ? NIVELES_ALL.filter(n => sc.niveles.indexOf(n) !== -1) : NIVELES_ALL;
  const gradosByNivel = {};
  if (sc) (sc.clases || []).forEach(c => { const gr = gradoOfGroup(c.g); if (gr) (gradosByNivel[c.nivel] = gradosByNivel[c.nivel] || []).indexOf(gr) === -1 && gradosByNivel[c.nivel].push(gr); });
  const gradosFor = (n) => sc ? (ATLAS_GRADOS[n] || []).filter(g => (gradosByNivel[n] || []).indexOf(g) !== -1) : ATLAS_GRADOS[n];
  /* Titular de grupo cubre todas las materias; un docente por materia solo las suyas. */
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isTitular = !sc || !(sc.materias || []).length || (sc.materias || []).some(m => /titular/i.test(m));
  const matchMateria = (subjName) => (sc.materias || []).some(m => { const a = norm(m), b = norm(subjName); return a && (a.includes(b) || b.includes(a) || (/ingl|english/.test(a) && /ingl|english/.test(b))); });
  const subjAllowed = (s) => isTitular || matchMateria(s.name);

  const [nivel, setNivel] = React.useState(() => nivelesAllowed[0] || 'Primaria');
  const [grado, setGrado] = React.useState(() => { const gs = gradosFor(nivelesAllowed[0] || 'Primaria'); return (gs && gs.length) ? (gs.indexOf('3°') !== -1 ? '3°' : gs[0]) : '3°'; });
  const [sel, setSel] = React.useState(null); /* { subj, campo } */

  const curriculum = ATLAS_CURRICULUM[nivel].map(c => ({ ...c, subjects: c.subjects.filter(subjAllowed) })).filter(c => c.subjects.length);
  const grados = gradosFor(nivel) || [];
  const subjectsFlat = curriculum.flatMap(c => c.subjects.map(s => ({ ...s, campo: c.campo })));
  const Y = ATLAS_YEAR;
  const todayFrac = Y.today / Y.weeks;

  const changeNivel = (n) => { setNivel(n); const gs = gradosFor(n); const fallback = (gs && gs.length) ? gs[0] : ATLAS_GRADOS[n][0]; setGrado(gs && gs.indexOf(grado) !== -1 ? grado : (n === 'Preescolar' && (!gs || !gs.length) ? 'K2' : fallback)); };

  if (sel) {
    return <AtlasDetail nivel={nivel} grado={grado} subj={sel.subj} campo={sel.campo}
      onBack={() => setSel(null)} go={go} openCopilot={openCopilot} />;
  }

  /* KPIs y rezagos */
  const progs = subjectsFlat.map(s => ({ s, p: atlasProgress(nivel, grado, s) }));
  const totalUnits = progs.reduce((a, x) => a + x.p.units.length, 0);
  const doneUnits = progs.reduce((a, x) => a + x.p.done, 0);
  const avgPct = Math.round(progs.reduce((a, x) => a + x.p.pct, 0) / progs.length);
  const planPct = Math.round(todayFrac * 100);
  const laggers = [];
  subjectsFlat.forEach(s => atlasGroups(nivel, grado, s.id).forEach(g => { if (g.lag >= 1.5) laggers.push({ s, g }); }));
  laggers.sort((a, b) => b.g.lag - a.g.lag);
  const behindGroups = [...new Set(laggers.map(x => x.g.g))];

  const kpis = [
    { label: 'Asignaturas en el plan', value: String(subjectsFlat.length), icon: 'layers', tone: 'blue' },
    { label: 'Unidades cerradas', value: doneUnits + ' / ' + totalUnits, icon: 'checkCircle', tone: 'green' },
    { label: 'Avance del ciclo', value: avgPct + '%', sub: 'plan: ' + planPct + '%', icon: 'target', tone: 'violet' },
    { label: 'Grupos con rezago', value: String(behindGroups.length), icon: 'alert', tone: behindGroups.length ? 'amber' : 'green' },
  ];

  return (
    <div className="content-inner">
      <PageHead eyebrow="Principal" title="Atlas"
        desc={'Mapa curricular oficial · Plan de estudios 2022 (NEM) · Ciclo ' + Y.ciclo}>
        <div className="seg">
          {nivelesAllowed.map(n => (
            <button key={n} className={nivel === n ? 'active' : ''} onClick={() => changeNivel(n)}>{n}</button>
          ))}
        </div>
      </PageHead>

      <div className="row between center" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div className="atlas-grade-chips">
          {grados.map(g => (
            <button key={g} className={'chip-btn' + (grado === g ? '' : ' plain')} onClick={() => setGrado(g)}>{g}</button>
          ))}
          <span className="faint" style={{ fontSize: 12, alignSelf: 'center', marginLeft: 4 }}>{ATLAS_FASES[nivel][grado]}</span>
        </div>
        <div className="atlas-legend">
          <span className="row center gap-5"><span className="sw" style={{ background: 'var(--accent)' }}></span>Completada</span>
          <span className="row center gap-5"><span className="sw" style={{ background: 'var(--accent-soft-2)', border: '1px solid var(--accent)' }}></span>En curso</span>
          <span className="row center gap-5"><span className="sw" style={{ background: 'var(--surface-3)', border: '1px solid var(--border-strong)' }}></span>Pendiente</span>
          <span className="row center gap-5"><span className="sw" style={{ background: 'transparent', border: '1.5px solid var(--violet)' }}></span>En refuerzo</span>
          <span className="row center gap-5"><span className="sw" style={{ background: 'transparent', border: '2px dashed var(--accent)', height: 10, width: 2, borderWidth: '0 0 0 2px', borderRadius: 0 }}></span>Hoy · sem {Math.round(Y.today)}</span>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
        {kpis.map((k, i) => {
          const t = window.TONE[k.tone];
          return (
            <div className="card kpi" key={i}>
              <div className="kpi-ico" style={{ background: t.bg, color: t.c }}><Icon name={k.icon} size={19} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tnum">{k.value}{k.sub && <span className="unit" style={{ marginLeft: 7 }}>{k.sub}</span>}</div>
            </div>
          );
        })}
      </div>

      {/* Mapa del ciclo */}
      <div className="card atlas-map">
        <div className="atlas-wrap">
          {/* líneas de mes */}
          <div className="atlas-grid-overlay">
            {Y.months.map((m, i) => i > 0 && (
              <div key={i} className="atlas-vline" style={{ left: 'calc(var(--atlas-left) + (100% - var(--atlas-left)) * ' + (i / Y.months.length) + ')' }}></div>
            ))}
          </div>

          {/* encabezado de meses */}
          <div className="atlas-months">
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px' }}>
              <span className="eyebrow" style={{ marginBottom: 0 }}>{nivel} {grado}</span>
            </div>
            <div className="mtrack">
              {Y.months.map((m, i) => (
                <span key={m} className="atlas-month" style={{ left: (i / Y.months.length * 100) + '%' }}>{m}</span>
              ))}
            </div>
          </div>

          {/* carriles por campo formativo */}
          {curriculum.map((c, ci) => (
            <React.Fragment key={ci}>
              {c.campo && <div className="atlas-campo">{c.campo}</div>}
              {c.subjects.map(s => {
                const p = atlasProgress(nivel, grado, s);
                const t = window.TONE[s.tone];
                const ll = atlasLagLabel(p.lag);
                const open = () => setSel({ subj: s, campo: c.campo });
                return (
                  <div className="atlas-lane" key={s.id}>
                    <button className="atlas-info" onClick={open}>
                      <div className="kpi-ico" style={{ background: t.bg, color: t.c, marginBottom: 0, width: 32, height: 32, borderRadius: 9, flexShrink: 0 }}><Icon name={s.icon} size={16} /></div>
                      <div className="grow" style={{ minWidth: 0 }}>
                        <div className="ttl">{s.name}</div>
                        <div className="sub">{p.current ? 'U' + (p.current.i + 1) + ' · ' + p.current.n : p.done + ' de ' + p.units.length + ' unidades'}</div>
                      </div>
                      <Badge tone={ll.tone}>{ll.label}</Badge>
                    </button>
                    <div className="atlas-track" onClick={open}>
                      {(() => { const refz = atlasRefuerzos(nivel, grado, s.id); return p.units.map(u => {
                        const us = atlasUnitState(u, p.actualWeek);
                        const late = u.e <= Y.today && us.k !== 'done';
                        const rz = refz.find(m => m.atlas.unitI === u.i);
                        const style = {
                          left: (u.s / Y.weeks * 100) + '%',
                          width: (u.w / Y.weeks * 100) + '%',
                        };
                        if (us.k === 'done') { style.background = t.c; }
                        else if (us.k === 'current') {
                          style.background = 'linear-gradient(90deg, ' + t.c + ' ' + Math.round(us.frac * 100) + '%, ' + t.bg + ' ' + Math.round(us.frac * 100) + '%)';
                          style.border = '1.5px solid ' + t.c;
                          style.height = 20;
                        } else { style.background = 'var(--surface-3)'; style.border = '1px solid var(--border-strong)'; }
                        if (late) { style.boxShadow = '0 0 0 1.5px var(--amber)'; }
                        if (rz) { style.boxShadow = '0 0 0 1.5px var(--violet)'; }
                        const stLabel = us.k === 'done' ? 'Completada' : us.k === 'current' ? 'En curso · ' + Math.round(us.frac * 100) + '%' : 'Pendiente';
                        return (
                          <div key={u.i} className={'atlas-seg' + (late && !rz ? ' late' : '') + (rz ? ' refz' : '')} style={style}>
                            <div className="atlas-tip">
                              <div className="t">U{u.i + 1} · {u.n}</div>
                              <div className="m">SEM {Math.round(u.s)}–{Math.round(u.e)} · {stLabel}{late ? ' · ATRASADA' : ''}</div>
                              <div style={{ marginTop: 3, opacity: 0.85 }}>{u.temas.join(' · ')}</div>
                              {rz && <div style={{ marginTop: 4, fontWeight: 600 }}>Refuerzo en marcha: «{rz.title}» · {rz.groups.join(', ')}</div>}
                            </div>
                          </div>
                        );
                      }); })()}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}

          {/* línea de hoy */}
          <div className="atlas-today" style={{ left: 'calc(var(--atlas-left) + (100% - var(--atlas-left)) * ' + todayFrac + ')' }}>
            <span className="lbl">HOY</span>
          </div>
        </div>
      </div>

      {/* Alertas del Copilot */}
      {laggers.length > 0 && (
        <div className="ai-panel" style={{ marginTop: 18 }}>
          <div className="ai-panel-head">
            <div className="ai-orb"><Icon name="spark" size={16} fill="currentColor" /></div>
            <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>Copilot detectó rezagos vs plan</div><div className="faint" style={{ fontSize: 11.5 }}>{nivel} {grado} · semana {Math.round(Y.today)} del ciclo</div></div>
            <button className="chip-btn plain" onClick={openCopilot}>Abrir Copilot</button>
          </div>
          {laggers.slice(0, 3).map((x, i) => {
            const shouldBeDone = atlasUnits(x.s).filter(u => u.e <= Y.today && u.e > Y.today - x.g.lag);
            const u = shouldBeDone[0];
            const cover = atlasRefuerzos(nivel, grado, x.s.id).find(m => m.groups.includes(x.g.g));
            return (
              <div className="insight" key={i}>
                <div className="insight-ico" style={cover ? { background: 'var(--violet-soft)', color: 'var(--violet)' } : { background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon name={cover ? 'rocket' : 'alert'} size={15} /></div>
                <div className="insight-body">
                  <div className="insight-text"><b>{x.g.g}</b> va {x.g.lag.toFixed(1)} semanas atrás del plan en <b>{x.s.name}</b>{u ? <> — la unidad «{u.n}» debería estar cerrada desde la semana {Math.round(u.e)}.</> : '.'}{cover && <> Refuerzo en marcha: <b>«{cover.title}»</b>.</>}</div>
                  <div className="insight-actions">
                    <button className="chip-btn" onClick={() => setSel({ subj: x.s, campo: x.s.campo })}>Ver ruta</button>
                    {cover
                      ? <button className="chip-btn plain" onClick={() => go('ai-missions')}>Seguir misión</button>
                      : <button className="chip-btn plain" onClick={() => atlasMissionHandoff(go, { subj: x.s, nivel, grado, unit: u || atlasProgress(nivel, grado, x.s).current, groups: [x.g.g], reason: 'Refuerzo: ' + x.g.lag.toFixed(1) + ' sem de rezago vs plan' })}>Misión de refuerzo</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Atlas, AtlasDetail });
