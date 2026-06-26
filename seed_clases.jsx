/* ============================================================
   seed_clases.jsx — Padrón base de grupos + helpers de nivel
   ------------------------------------------------------------
   Define los globales compartidos que consumen Clases,
   Calificaciones, Asistencia, Docentes, Boletines, Cobros y BI:

     • window.NIVELES_CFG    — config visual por nivel
     • window.nivelCfg(n)    — resuelve la config de un nivel
     • window.CLASES_SEED     — padrón de grupos del ciclo
     • window.alumnosDeClase  — roster determinista por grupo

   Debe cargarse DESPUÉS de data.jsx y ANTES de store.js para
   que DB.clases entre al estado inicial del Store.
   ============================================================ */
(function () {

  /* ---------- Config visual por nivel ---------- */
  const NIVELES_CFG = [
    { id: 'Preescolar', tone: 'cyan', icon: 'star' },
    { id: 'Primaria', tone: 'blue', icon: 'bookOpen' },
    { id: 'Secundaria', tone: 'violet', icon: 'cap' },
  ];
  const _NIV_BY_ID = NIVELES_CFG.reduce((m, c) => (m[c.id] = c, m), {});
  function nivelCfg(nivel) {
    return _NIV_BY_ID[nivel] || { id: nivel || 'Primaria', tone: 'blue', icon: 'cap' };
  }
  window.NIVELES_CFG = NIVELES_CFG;
  window.nivelCfg = nivelCfg;

  /* ---------- Padrón de grupos del ciclo 2025–2026 ---------- */
  /* g = nombre del grupo · titular ligado al módulo Docentes ·
     avg = null en Preescolar (evaluación cualitativa). */
  const CLASES_SEED = window.PIAGET_FRESH ? [] : [
    /* Preescolar */
    { nivel: 'Preescolar', g: 'K1 A', titular: 'Mtra. Paola Rivas', salon: 'PRE-01', alumnos: 18, asistencia: 97, avg: null },
    { nivel: 'Preescolar', g: 'K2 A', titular: 'Mtra. Lucía Fonseca', salon: 'PRE-02', alumnos: 22, asistencia: 96, avg: null },
    { nivel: 'Preescolar', g: 'K2 B', titular: 'Mtra. Diana Carrillo', salon: 'PRE-03', alumnos: 21, asistencia: 97, avg: null },
    { nivel: 'Preescolar', g: 'K3 A', titular: 'Mtra. Karla Espinoza', salon: 'PRE-04', alumnos: 24, asistencia: 95, avg: null },
    { nivel: 'Preescolar', g: 'K3 B', titular: 'Mtra. Brenda Salgado', salon: 'PRE-05', alumnos: 23, asistencia: 96, avg: null },

    /* Primaria */
    { nivel: 'Primaria', g: '1° A', titular: 'Mtra. Adriana Vela', salon: 'A-101', alumnos: 30, asistencia: 95, avg: 8.6 },
    { nivel: 'Primaria', g: '1° B', titular: 'Mtra. Sofía Naranjo', salon: 'A-102', alumnos: 29, asistencia: 94, avg: 8.4 },
    { nivel: 'Primaria', g: '2° A', titular: 'Mtra. Gabriela Ponce', salon: 'A-103', alumnos: 31, asistencia: 93, avg: 8.3 },
    { nivel: 'Primaria', g: '2° B', titular: 'Mtra. Mariana Téllez', salon: 'A-104', alumnos: 28, asistencia: 91, avg: 8.0 },
    { nivel: 'Primaria', g: '3° A', titular: 'Mtro. Hugo Delgado', salon: 'A-105', alumnos: 30, asistencia: 94, avg: 8.5 },
    { nivel: 'Primaria', g: '3° B', titular: 'Mtra. Renata Cano', salon: 'A-106', alumnos: 29, asistencia: 92, avg: 8.1 },
    { nivel: 'Primaria', g: '4° A', titular: 'Mtra. Valeria Ochoa', salon: 'A-201', alumnos: 32, asistencia: 93, avg: 8.2 },
    { nivel: 'Primaria', g: '4° B', titular: 'Mtro. Iván Robledo', salon: 'A-202', alumnos: 31, asistencia: 84, avg: 7.3 },
    { nivel: 'Primaria', g: '5° A', titular: 'Mtra. Paulina Guerra', salon: 'A-203', alumnos: 30, asistencia: 83, avg: 7.1 },
    { nivel: 'Primaria', g: '5° B', titular: 'Mtro. Andrés Lozano', salon: 'A-204', alumnos: 29, asistencia: 92, avg: 8.0 },
    { nivel: 'Primaria', g: '6° A', titular: 'Mtra. Claudia Bernal', salon: 'A-205', alumnos: 28, asistencia: 94, avg: 8.7 },
    { nivel: 'Primaria', g: '6° B', titular: 'Mtro. Jorge Patiño', salon: 'A-206', alumnos: 30, asistencia: 88, avg: 7.4 },

    /* Secundaria */
    { nivel: 'Secundaria', g: '1° A Sec', titular: 'Mtra. Daniela Mora', salon: 'S-301', alumnos: 32, asistencia: 93, avg: 8.4 },
    { nivel: 'Secundaria', g: '1° B Sec', titular: 'Mtro. Emilio Fuentes', salon: 'S-302', alumnos: 31, asistencia: 92, avg: 8.2 },
    { nivel: 'Secundaria', g: '2° A Sec', titular: 'Mtra. Regina Vázquez', salon: 'S-303', alumnos: 30, asistencia: 90, avg: 8.0 },
    { nivel: 'Secundaria', g: '2° B Sec', titular: 'Mtro. Rodrigo Cásares', salon: 'S-304', alumnos: 29, asistencia: 89, avg: 7.8 },
    { nivel: 'Secundaria', g: '3° A Sec', titular: 'Mtra. Fernanda Loera', salon: 'S-305', alumnos: 31, asistencia: 91, avg: 8.3 },
    { nivel: 'Secundaria', g: '3° B Sec', titular: 'Mtro. Sergio Ávalos', salon: 'S-306', alumnos: 28, asistencia: 90, avg: 8.1 },
  ];
  window.CLASES_SEED = CLASES_SEED;

  /* Sembrar el padrón en el estado inicial del Store (DB.clases) si
     aún no existe. data.jsx ya hizo window.DB_DEFAULTS = window.DB,
     así que basta con asignarlo al objeto compartido. */
  if (window.DB && !Array.isArray(window.DB.clases)) {
    let _seq = 1;
    window.DB.clases = CLASES_SEED.map(c => ({ _id: 'cls-' + (_seq++), ...c }));
  }

  /* ---------- Roster determinista por grupo ---------- */
  const NOMBRES = ['Santiago', 'Mateo', 'Sebastián', 'Leonardo', 'Matías', 'Emiliano', 'Diego', 'Daniel', 'Iker', 'Bruno', 'Tomás', 'Andrés', 'Pablo', 'Maximiliano', 'Nicolás', 'Ángel', 'Gael', 'Rodrigo', 'Adrián', 'Héctor',
    'Sofía', 'Valentina', 'Regina', 'Camila', 'María', 'Renata', 'Ximena', 'Victoria', 'Isabella', 'Daniela', 'Mariana', 'Paulina', 'Fernanda', 'Andrea', 'Natalia', 'Romina', 'Emilia', 'Julieta', 'Luciana', 'Frida'];
  const APELLIDOS = ['García', 'Hernández', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Vázquez', 'Reyes', 'Jiménez', 'Torres', 'Mendoza', 'Aguilar', 'Castillo',
    'Ortiz', 'Ramos', 'Romero', 'Domínguez', 'Campos', 'Salazar', 'Núñez', 'Guerrero', 'Cabrera', 'Rojas', 'Medina', 'Vega', 'Ríos', 'Lara', 'Cordero'];

  /* PRNG determinista (mulberry32) a partir del nombre del grupo */
  function _seedFrom(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  function _rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const _rosterCache = {};
  function alumnosDeClase(clase) {
    if (!clase) return [];
    const key = (clase._id || clase.g) + ':' + clase.alumnos + ':' + clase.avg + ':' + clase.asistencia;
    if (_rosterCache[key]) return _rosterCache[key];

    const rng = _rng(_seedFrom(clase.g || 'grupo'));
    const n = Math.max(1, clase.alumnos || 0);
    const usados = new Set();
    const out = [];
    for (let i = 0; i < n; i++) {
      let name;
      do {
        const fn = NOMBRES[Math.floor(rng() * NOMBRES.length)];
        const a1 = APELLIDOS[Math.floor(rng() * APELLIDOS.length)];
        const a2 = APELLIDOS[Math.floor(rng() * APELLIDOS.length)];
        name = fn + ' ' + a1 + ' ' + a2;
      } while (usados.has(name) && usados.size < NOMBRES.length * APELLIDOS.length);
      usados.add(name);

      const asisBase = clase.asistencia || 92;
      const asis = Math.max(62, Math.min(100, Math.round(asisBase + (rng() - 0.5) * 18)));

      let avg = null;
      if (clase.avg != null) {
        avg = clase.avg + (rng() - 0.45) * 2.2;
        avg = Math.max(5.5, Math.min(10, Math.round(avg * 10) / 10));
      }
      out.push({ name, avg, asis });
    }
    _rosterCache[key] = out;
    return out;
  }
  window.alumnosDeClase = alumnosDeClase;

})();
