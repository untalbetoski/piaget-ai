/* doc_scope.jsx — Alcance del DOCENTE
   --------------------------------------------------------------
   Limita los datos visibles del docente a SUS grupos y materias.
   window.docScope() → null cuando NO hay sesión docente (sin filtro).

   El alcance se deriva de las ASIGNACIONES del docente (nivel · grupo ·
   materia) capturadas en Administración › Docentes, no solo del padrón
   de Clases. Para cada grupo asignado se construye un objeto "clase"
   (uniendo el registro real de DB.clases si existe), de modo que todos
   los módulos —Clases, Calificaciones, Asistencia, Diario, Tareas,
   Evaluaciones— muestren exactamente los grupos del docente. */
(function () {
  function sess() { return (window.PiagetAuth && window.PiagetAuth.getSession && window.PiagetAuth.getSession()) || null; }

  /* Grupos del docente de DEMOSTRACIÓN (cuenta docente@jeanpiaget.mx). */
  const DEMO_ASIG = [
    { nivel: 'Primaria', grupo: '5° A', materia: 'Titular de grupo' },
    { nivel: 'Primaria', grupo: '6° A', materia: 'Titular de grupo' },
    { nivel: 'Primaria', grupo: '4° B', materia: 'Titular de grupo' },
  ];

  function allClases() {
    return (window.DB && window.DB.clases && window.DB.clases.length) ? window.DB.clases : (window.CLASES_SEED || []);
  }
  function inferNivel(g) {
    g = String(g || '');
    if (/^K\d/i.test(g)) return 'Preescolar';
    if (/sec/i.test(g)) return 'Secundaria';
    return 'Primaria';
  }
  function studentsIn(g) {
    return ((window.DB && window.DB.students) || []).filter(s => s.grade === g).length;
  }

  /* Reúne las asignaciones de un docente (asignaciones + grupoTitular + grupos). */
  function asignacionesDe(me) {
    const rows = [];
    (me.asignaciones || []).forEach(a => { if (a && a.grupo) rows.push({ nivel: a.nivel || inferNivel(a.grupo), grupo: a.grupo, materia: a.materia || (me.materias && me.materias[0]) || 'Titular de grupo' }); });
    if (me.grupoTitular) rows.push({ nivel: inferNivel(me.grupoTitular), grupo: me.grupoTitular, materia: 'Titular de grupo' });
    (me.grupos || []).forEach(g => rows.push({ nivel: inferNivel(g), grupo: g, materia: (me.materias && me.materias[0]) || 'Titular de grupo' }));
    return rows;
  }

  /* Construye objetos clase para una lista de asignaciones. */
  function buildClases(asig, demo, teacherName) {
    const clases = allClases();
    const byGroup = {};
    asig.forEach(a => {
      if (!byGroup[a.grupo]) byGroup[a.grupo] = { nivel: a.nivel, grupo: a.grupo, materias: [] };
      if (a.materia && byGroup[a.grupo].materias.indexOf(a.materia) === -1) byGroup[a.grupo].materias.push(a.materia);
    });
    return Object.keys(byGroup).map((g) => {
      const info = byGroup[g];
      const real = clases.find(c => c.g === g);
      if (real) return Object.assign({}, real, { materiasDocente: info.materias });
      // Sin registro real (p. ej. ciclo reiniciado): NO inventar cifras.
      // Solo se deriva el conteo real de alumnos; asistencia/promedio quedan vacíos.
      const alumnos = studentsIn(g);
      return { _id: 'doc-syn-' + g, g, nivel: info.nivel, titular: teacherName || '—', salon: real ? real.salon : '—', alumnos, asistencia: null, avg: null, materiasDocente: info.materias, _synthetic: true };
    });
  }

  window.docScope = function () {
    const s = sess();
    if (!s || s.kind !== 'Docente') return null;

    let asig, materias, name;
    if (s.email === 'docente@jeanpiaget.mx') {
      asig = DEMO_ASIG; name = 'Docente Invitado';
      materias = ['Titular de grupo'];
    } else {
      const roster = window.docBuildRoster ? window.docBuildRoster() : [];
      let me = roster.find(d => d.email && s.email && d.email.toLowerCase() === s.email.toLowerCase())
            || roster.find(d => d.name === s.name) || null;
      name = (me && me.name) || s.name;
      asig = me ? asignacionesDe(me) : [];
      materias = (me && me.materias) || [];
    }

    const myClases = buildClases(asig, s.email === 'docente@jeanpiaget.mx', name);
    const groups = myClases.map(c => c.g);
    const niveles = Array.from(new Set(myClases.map(c => c.nivel)));
    const mat = Array.from(new Set((materias || []).concat(asig.map(a => a.materia)).filter(Boolean)));
    return { name, groups, clases: myClases, niveles, materias: mat };
  };

  /* Para un docente devuelve SUS clases (reales o sintéticas) en lugar de
     filtrar la lista recibida; así los módulos muestran sus grupos aunque
     el padrón general de Clases esté vacío. Sin sesión docente: sin cambios. */
  window.docClases = function (list) {
    const sc = window.docScope();
    if (!sc) return list || [];
    return sc.clases;
  };

  /* ¿El grupo (string) es visible para el docente en sesión? */
  window.docAllowsGroup = function (g) {
    const sc = window.docScope();
    if (!sc) return true;
    return sc.groups.indexOf(g) !== -1;
  };

  /* Recorta una lista de niveles al alcance del docente. */
  window.docNiveles = function (list) {
    const sc = window.docScope();
    if (!sc) return list || [];
    return (list || []).filter(n => sc.niveles.indexOf(n) !== -1);
  };
})();
