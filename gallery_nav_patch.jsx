/* gallery_nav_patch.jsx — agrega Galería a Comunicación y carga parches estudiante */
(function () {
  function transformLateBabel() {
    setTimeout(function () {
      try { if (window.Babel && typeof Babel.transformScriptTags === 'function') Babel.transformScriptTags(); } catch (_) {}
    }, 80);
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
  loadBabelOnce('student_credential_directivo_style_patch.jsx?v=20260703-directivo-style');
  loadScriptOnce('student_documents_label_patch.js?v=20260703-report-evaluation');
  addRoute();
})();