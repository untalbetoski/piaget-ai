/* ============================================================
   seed_clases.jsx — Padrón base de grupos + helpers de nivel
   ------------------------------------------------------------
   Define los globales compartidos que consumen Clases,
   Calificaciones, Asistencia, Docentes, Boletines, Cobros y BI:

     • window.NIVELES_CFG    — config visual por nivel
     • window.nivelCfg(n)    — resuelve la config de un nivel
     • window.CLASES_SEED     — padrón de grupos del ciclo
     • window.alumnosDeClase  — roster REAL por grupo, desde DB.students

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
     avg = null en Preescolar (evaluación cualitativa).
     Nota: este padrón solo define grupos iniciales; NO crea alumnos. */
  const CLASES_SEED = window.PIAGET_FRESH ? [] : [
    /* Preescolar */
    { nivel: 'Preescolar', g: 'K1 A', titular: 'Mtra. Paola Rivas', salon: 'PRE-01', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Preescolar', g: 'K2 A', titular: 'Mtra. Lucía Fonseca', salon: 'PRE-02', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Preescolar', g: 'K2 B', titular: 'Mtra. Diana Carrillo', salon: 'PRE-03', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Preescolar', g: 'K3 A', titular: 'Mtra. Karla Espinoza', salon: 'PRE-04', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Preescolar', g: 'K3 B', titular: 'Mtra. Brenda Salgado', salon: 'PRE-05', alumnos: 0, asistencia: 0, avg: null },

    /* Primaria */
    { nivel: 'Primaria', g: '1° A', titular: 'Mtra. Adriana Vela', salon: 'A-101', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Primaria', g: '1° B', titular: 'Mtra. Sofía Naranjo', salon: 'A-102', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Primaria', g: '2° A', titular: 'Mtra. Gabriela Ponce', salon: 'A-103', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Primaria', g: '2° B', titular: 'Mtra. Mariana Téllez', salon: 'A-104', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Primaria', g: '3° A', titular: 'Mtro. Hugo Delgado', salon: 'A-105', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Primaria', g: '3° B', titular: 'Mtra. Renata Cano', salon: 'A-106', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Primaria', g: '4° A', titular: 'Mtra. Valeria Ochoa', salon: 'A-201', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Primaria', g: '4° B', titular: 'Mtro. Iván Robledo', salon: 'A-202', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Primaria', g: '5° A', titular: 'Mtra. Paulina Guerra', salon: 'A-203', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Primaria', g: '5° B', titular: 'Mtro. Andrés Lozano', salon: 'A-204', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Primaria', g: '6° A', titular: 'Mtra. Claudia Bernal', salon: 'A-205', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Primaria', g: '6° B', titular: 'Mtro. Jorge Patiño', salon: 'A-206', alumnos: 0, asistencia: 0, avg: null },

    /* Secundaria */
    { nivel: 'Secundaria', g: '1° A Sec', titular: 'Mtra. Daniela Mora', salon: 'S-301', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Secundaria', g: '1° B Sec', titular: 'Mtro. Emilio Fuentes', salon: 'S-302', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Secundaria', g: '2° A Sec', titular: 'Mtra. Regina Vázquez', salon: 'S-303', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Secundaria', g: '2° B Sec', titular: 'Mtro. Rodrigo Cásares', salon: 'S-304', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Secundaria', g: '3° A Sec', titular: 'Mtra. Fernanda Loera', salon: 'S-305', alumnos: 0, asistencia: 0, avg: null },
    { nivel: 'Secundaria', g: '3° B Sec', titular: 'Mtro. Sergio Ávalos', salon: 'S-306', alumnos: 0, asistencia: 0, avg: null },
  ];
  window.CLASES_SEED = CLASES_SEED;

  /* Sembrar el padrón en el estado inicial del Store (DB.clases) si
     aún no existe. data.jsx ya hizo window.DB_DEFAULTS = window.DB,
     así que basta con asignarlo al objeto compartido. */
  if (window.DB && !Array.isArray(window.DB.clases)) {
    let _seq = 1;
    window.DB.clases = CLASES_SEED.map(c => ({ _id: 'cls-' + (_seq++), ...c }));
  }

  /* ---------- Roster real por grupo ----------
     Antes esta función inventaba nombres con un generador determinista.
     A partir de ahora solo devuelve alumnos realmente dados de alta en DB.students. */
  function alumnosDeClase(clase) {
    if (!clase) return [];
    const group = String(clase.g || clase.grade || clase.group || '').trim();
    const nivel = String(clase.nivel || '').trim();
    const students = (window.DB && Array.isArray(DB.students)) ? DB.students : [];
    return students
      .filter(s => {
        const sg = String(s.grade || s.group || '').trim();
        const sn = String(s.nivel || '').trim();
        return sg === group && (!nivel || !sn || sn === nivel);
      })
      .map(s => ({
        sid: s._id || s.sid || '',
        name: s.name || 'Alumno sin nombre',
        avg: s.avg != null && s.avg !== '' ? Number(s.avg) : null,
        asis: s.att != null ? Number(s.att) : s.asis != null ? Number(s.asis) : s.asistencia != null ? Number(s.asistencia) : 100,
        manual: true,
        raw: s,
      }));
  }
  window.alumnosDeClase = alumnosDeClase;

})();
