/* gallery_nav_patch.jsx — agrega Galería a Comunicación y carga parches finales */
(function () {
  function transformLateBabel() {
    setTimeout(function () {
      try { if (window.Babel && typeof Babel.transformScriptTags === 'function') Babel.transformScriptTags(); } catch (_) {}
    }, 80);
  }
  function loadScriptOnce(src) {
    if (document.querySelector('script[src*="' + src.split('?')[0] + '"]')) return;
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    document.head.appendChild(s);
  }
  function loadBabelOnce(src) {
    if (document.querySelector('script[src*="' + src.split('?')[0] + '"]')) return;
    var s = document.createElement('script');
    s.type = 'text/babel';
    s.src = src;
    s.async = false;
    document.head.appendChild(s);
    transformLateBabel();
  }
  function loadBabelForce(src) {
    var s = document.createElement('script');
    s.type = 'text/babel';
    s.src = src;
    s.async = false;
    document.head.appendChild(s);
    transformLateBabel();
  }
  function addRoute() {
    window.ROUTES = window.ROUTES || {};
    window.ROUTES.galeria = { c: 'GaleriaComunicacion', crumb: ['Comunicación', 'Galería'] };
    const nav = window.NAV || [];
    nav.forEach(sec => (sec.items || []).forEach(it => {
      if (it.id === 'comunicacion-fam') {
        it.children = it.children || [];
        if (!it.children.some(c => c.id === 'galeria')) it.children.push({ id: 'galeria', label: 'Galería' });
      }
    }));
  }
  loadScriptOnce('credential_signature_patch.js?v=20260629-signature');
  loadScriptOnce('real_students_only_patch.js?v=20260629-real-students');
  loadScriptOnce('ai_missions_real_groups_patch.js?v=20260629-real-groups');
  loadScriptOnce('student_credentials_patch.js?v=20260702-access-print');
  loadBabelForce('student_enrollment_form_patch.jsx?v=20260702-v2');
  loadBabelForce('evaluaciones_data.jsx?v=20260630-real-evals');
  loadBabelForce('views_evaluaciones.jsx?v=20260630-real-evals');
  loadBabelForce('asistencia_data.jsx?v=20260630-real-attendance');
  loadBabelForce('views_asistencia.jsx?v=20260630-real-attendance');
  loadBabelForce('views_diario.jsx?v=20260630-real-diario');
  loadBabelForce('views_clases.jsx?v=20260630-delete-persist');
  loadBabelForce('views_docentes.jsx?v=20260630-real-only');
  loadBabelForce('config_users_safe_patch.jsx?v=20260701-safe-users-required-fn');
  addRoute();
})();
