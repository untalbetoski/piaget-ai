/* gallery_nav_patch.jsx — agrega Galería a Comunicación y carga parches finales */
(function () {
  function loadScriptOnce(src) {
    if (document.querySelector('script[src*="' + src.split('?')[0] + '"]')) return;
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    document.head.appendChild(s);
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
  addRoute();
})();
