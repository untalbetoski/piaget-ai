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
  function forceLoadBabel(src) {
    if (document.querySelector('script[src="' + src + '"]')) return;
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
    window.ROUTES.contactos = { c: 'Contactos', crumb: ['CRM', 'Contactos'] };
    window.ROUTES.boletines = { c: 'BoletinesNEMReal', crumb: ['Gestión', 'Boletines'] };
    const nav = window.NAV || [];
    nav.forEach(sec => (sec.items || []).forEach(it => {
      if (it.id === 'comunicacion-fam') {
        it.children = it.children || [];
        if (!it.children.some(c => c.id === 'galeria')) it.children.push({ id: 'galeria', label: 'Galería' });
      }
    }));
  }
  loadScriptOnce('student_documents_label_patch.js?v=20260703-logo-no-signature');
  loadScriptOnce('student_delete_cascade_patch.js?v=20260706-cascade-payments-v2');
  loadScriptOnce('cobros_movement_delete_patch.js?v=20260706-delete-movements-v1');
  loadScriptOnce('calificaciones_nem_sync_patch.js?v=20260704-central-gradebook');
  forceLoadBabel('views_crm.jsx?v=20260704-real-only');
  forceLoadBabel('views_contactos.jsx?v=20260704-functional-directory');
  forceLoadBabel('views_boletines_nem_real.jsx?v=20260704-nem-sep-real-only');
  forceLoadBabel('cobros_inscripcion_balance_patch.jsx?v=20260706-inscripcion-balance-v1');
  addRoute();
})();