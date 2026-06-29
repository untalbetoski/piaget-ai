/* gallery_nav_patch.jsx — agrega Galería a Comunicación y carga parche de firma */
(function () {
  function loadCredentialSignaturePatch() {
    if (document.querySelector('script[src*="credential_signature_patch.js"]')) return;
    var s = document.createElement('script');
    s.src = 'credential_signature_patch.js?v=20260629-signature';
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
  loadCredentialSignaturePatch();
  addRoute();
})();
