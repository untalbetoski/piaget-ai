/* landing_images_public.js — aplica imágenes configurables al landing público */
(function () {
  const FALLBACK = {};
  function loadSupabase() {
    if (window.supabase) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const old = document.querySelector('script[data-landing-supabase]');
      if (old) { old.addEventListener('load', resolve); old.addEventListener('error', reject); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
      s.setAttribute('data-landing-supabase', '1');
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function applyPhoto(selector, url, label) {
    const el = document.querySelector(selector);
    if (!el || !url) return;
    el.classList.add('landing-photo');
    el.style.backgroundImage = 'linear-gradient(180deg, rgba(10,16,32,.08), rgba(10,16,32,.28)), url("' + String(url).replace(/"/g, '%22') + '")';
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.color = '#fff';
    el.style.textShadow = '0 2px 14px rgba(0,0,0,.35)';
    const tag = el.querySelector('.ph-tag');
    if (tag) tag.textContent = label || tag.textContent || 'Imagen actualizada';
  }
  function apply(data) {
    const v = data || FALLBACK;
    applyPhoto('.hero-visual .ph', v.hero, v.heroLabel || 'Campus Piaget');
    applyPhoto('.filo-visual .ph', v.filosofia, v.filosofiaLabel || 'Vida académica');
  }
  async function load() {
    try {
      const cfg = window.PIAGET_CONFIG || {};
      if (!cfg.supabaseUrl || !cfg.supabaseKey) return;
      await loadSupabase();
      const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
      const { data, error } = await sb.rpc('piaget_landing_get');
      if (error) throw error;
      apply(data || {});
    } catch (e) {
      console.warn('[PIAGET] No se pudieron cargar imágenes del landing', e && e.message ? e.message : e);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
