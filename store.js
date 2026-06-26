/* ============================================================
   store.js — Capa de datos de PIAGET AI
   ------------------------------------------------------------
   • MODO LOCAL  (sin config): estado en memoria + localStorage.
   • MODO SUPABASE (config con llaves): lee/escribe en Postgres
     vía @supabase/supabase-js y se sincroniza en tiempo real.
   La UI siempre lee de window.DB y muta con window.Store.*
   ============================================================ */
(function () {
  const cfg = window.PIAGET_CONFIG || {};
  const LSKEY = window.PIAGET_FRESH ? 'piaget_db_v12_fresh' : 'piaget_db_v12';
  const SYNCED = ['students', 'staff', 'processes', 'invoices', 'leads', 'announcements', 'agents', 'matriculas', 'docs', 'evaluaciones', 'diario', 'tareas', 'tickets', 'facturas', 'cobros', 'docentes', 'products', 'ventas', 'onlineOrders', 'missions', 'missionSubmissions', 'badges', 'rewards', 'engage_retos', 'engageParticipations', 'familyAccounts', 'egresos', 'experiences'];

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now());
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------- estado ---------- */
  function seed() {
    const base = clone(window.DB_DEFAULTS || {});
    // localStorage solo sobre-escribe colecciones dinámicas y el hilo del copilot
    try {
      const saved = JSON.parse(localStorage.getItem(LSKEY) || 'null');
      if (saved) { SYNCED.forEach(c => { if (saved[c]) base[c] = saved[c]; }); if (saved.copilotThread) base.copilotThread = saved.copilotThread; }
    } catch (e) { }
    // normaliza ids
    SYNCED.forEach(c => { (base[c] || []).forEach(it => { if (!it._id) it._id = uid(); }); });
    return base;
  }

  let state = seed();
  window.DB = state;

  /* migración one-time: sembrar el catálogo ampliado (uniformes 25-26) en DBs ya guardadas */
  try {
    if (!localStorage.getItem('piaget_cat_2526') && Array.isArray(state.products)) {
      const have = new Set(state.products.map(p => p.sku));
      (window.DB_DEFAULTS.products || []).forEach(p => {
        if (!have.has(p.sku)) state.products.push({ ...clone(p), _id: uid() });
      });
      localStorage.setItem('piaget_cat_2526', '1');
      try {
        const slim = { copilotThread: state.copilotThread };
        SYNCED.forEach(c => slim[c] = state[c]);
        localStorage.setItem(LSKEY, JSON.stringify(slim));
      } catch (e) { }
    }
  } catch (e) { }

  const listeners = new Set();
  function persist() {
    try {
      const slim = { copilotThread: state.copilotThread };
      SYNCED.forEach(c => slim[c] = state[c]);
      localStorage.setItem(LSKEY, JSON.stringify(slim));
    } catch (e) { }
  }
  function emit(save = true) { if (save && Store.mode === 'local') persist(); else if (save) persist(); listeners.forEach(l => l()); }

  /* ---------- Supabase (opcional) ---------- */
  let sb = null;
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  async function initSupabase() {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js');
      sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
      window.PIAGET_SB = sb;
      Store.mode = 'supabase';
      for (const c of SYNCED) {
        const { data, error } = await sb.from(c).select('*');
        if (!error && Array.isArray(data) && data.length) state[c] = data.map(r => ({ ...r, _id: r.id }));
      }
      window.DB = state; emit(false);
      if (cfg.realtime) {
        SYNCED.forEach(c => {
          sb.channel('pub-' + c).on('postgres_changes', { event: '*', schema: 'public', table: c }, refreshCollection.bind(null, c)).subscribe();
        });
      }
      console.info('[PIAGET] Conectado a Supabase ✓');
    } catch (e) {
      console.warn('[PIAGET] No se pudo conectar a Supabase, usando modo local.', e);
      Store.mode = 'local';
    }
  }
  async function refreshCollection(c) {
    if (!sb) return;
    const { data, error } = await sb.from(c).select('*');
    if (!error && data) { state[c] = data.map(r => ({ ...r, _id: r.id })); emit(false); }
  }
  function push(op, coll, payload) {
    if (Store.mode !== 'supabase' || !sb) return;
    const t = sb.from(coll);
    let q;
    if (op === 'insert') q = t.insert([{ ...stripMeta(payload.item), id: payload.item._id }]);
    else if (op === 'update') q = t.update(stripMeta(payload.patch)).eq('id', payload.id);
    else if (op === 'delete') q = t.delete().eq('id', payload.id);
    if (q) q.then(({ error }) => { if (error) console.warn('[PIAGET] Supabase ' + op + ' ' + coll, error.message); });
  }
  const stripMeta = (o) => { const x = { ...o }; delete x._id; return x; };

  /* ---------- API pública ---------- */
  const Store = {
    mode: 'local',
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    all(coll) { return state[coll] || []; },
    get(coll, id) { return (state[coll] || []).find(x => x._id === id); },

    add(coll, item) {
      const it = { _id: uid(), ...item };
      state[coll] = [it, ...(state[coll] || [])];
      emit(); push('insert', coll, { item: it });
      return it;
    },
    update(coll, id, patch) {
      state[coll] = (state[coll] || []).map(x => x._id === id ? { ...x, ...patch } : x);
      emit(); push('update', coll, { id, patch });
    },
    remove(coll, id) {
      state[coll] = (state[coll] || []).filter(x => x._id !== id);
      emit(); push('delete', coll, { id });
    },
    setThread(thread) { state.copilotThread = thread; emit(); },

    log(who, action, icon = 'spark') {
      const item = { _id: uid(), who, action, icon, time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) };
      state.activity = [item, ...(state.activity || [])].slice(0, 8);
      emit(); push('insert', 'activity', { item });
    },
    reset() {
      try { localStorage.removeItem(LSKEY); } catch (e) { }
      state = seed(); window.DB = state; emit(false);
    },
  };
  window.Store = Store;

  /* hook React */
  window.useStore = function () {
    const [, force] = React.useState(0);
    React.useEffect(() => Store.subscribe(() => force(n => n + 1)), []);
    return Store;
  };

  if (cfg.supabaseUrl && cfg.supabaseKey) initSupabase();
})();
