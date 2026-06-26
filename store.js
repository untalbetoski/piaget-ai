(function () {
  const cfg = window.PIAGET_CONFIG || {};
  const LSKEY = window.PIAGET_FRESH ? 'piaget_db_v12_fresh' : 'piaget_db_v12';
  const SKEY = 'piaget_session';
  const SYNCED = ['students','staff','processes','invoices','leads','announcements','agents','matriculas','docs','evaluaciones','diario','tareas','tickets','facturas','cobros','docentes','products','ventas','onlineOrders','missions','missionSubmissions','badges','rewards','engage_retos','engageParticipations','familyAccounts','egresos','experiences'];
  const FLEX = new Set(['matriculas','docs','evaluaciones','diario','tareas','tickets','facturas','cobros','docentes','products','ventas','onlineOrders','missions','missionSubmissions','badges','rewards','engage_retos','engageParticipations','familyAccounts','egresos','experiences']);
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now());
  const clone = o => JSON.parse(JSON.stringify(o));
  const clean = o => { const x = { ...(o || {}) }; delete x._id; return x; };
  const sid = () => { try { return (JSON.parse(localStorage.getItem(SKEY) || 'null') || {}).session_token || ''; } catch (_) { return ''; } };

  function seed() {
    const base = clone(window.DB_DEFAULTS || {});
    try { const saved = JSON.parse(localStorage.getItem(LSKEY) || 'null'); if (saved) { SYNCED.forEach(c => { if (saved[c]) base[c] = saved[c]; }); if (saved.copilotThread) base.copilotThread = saved.copilotThread; } } catch (_) {}
    SYNCED.forEach(c => { (base[c] || []).forEach(it => { if (!it._id) it._id = uid(); }); });
    return base;
  }

  let state = seed();
  window.DB = state;
  try { if (!localStorage.getItem('piaget_cat_2526') && Array.isArray(state.products)) { const have = new Set(state.products.map(p => p.sku)); (window.DB_DEFAULTS.products || []).forEach(p => { if (!have.has(p.sku)) state.products.push({ ...clone(p), _id: uid() }); }); localStorage.setItem('piaget_cat_2526', '1'); } } catch (_) {}

  const listeners = new Set();
  function persist() { try { const slim = { copilotThread: state.copilotThread }; SYNCED.forEach(c => slim[c] = state[c]); localStorage.setItem(LSKEY, JSON.stringify(slim)); } catch (_) {} }
  function emit(save = true) { if (save) persist(); listeners.forEach(l => l()); }

  let sb = null;
  function load(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function normRow(coll, row) { if (!row) return row; if (FLEX.has(coll) && row.payload) return { ...(row.payload || {}), _id: row.id }; return { ...row, _id: row._id || String(row.id || '') }; }
  function normRows(coll, data) { return Array.isArray(data) ? data.map(r => normRow(coll, r)) : []; }
  async function readColl(coll) {
    if (!sb) return null;
    if (sid()) {
      const { data, error } = await sb.rpc('piaget_read', { p_token: sid(), p_table: coll });
      if (error) { console.warn('[PIAGET] read ' + coll, error.message); return null; }
      return normRows(coll, data || []);
    }
    const { data, error } = await sb.from(coll).select('*');
    if (error) { console.warn('[PIAGET] select ' + coll, error.message); return null; }
    return normRows(coll, data || []);
  }
  async function initSupabase() {
    try {
      await load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js');
      sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
      window.PIAGET_SB = sb;
      Store.mode = sid() ? 'supabase-secure' : 'supabase';
      for (const c of SYNCED) { const rows = await readColl(c); if (Array.isArray(rows) && rows.length) state[c] = rows; }
      window.DB = state; emit(false);
      if (cfg.realtime) SYNCED.forEach(c => sb.channel('pub-' + c).on('postgres_changes', { event: '*', schema: 'public', table: c }, () => refreshCollection(c)).subscribe());
      console.info('[PIAGET] Supabase OK', Store.mode);
    } catch (e) { console.warn('[PIAGET] Modo local', e); Store.mode = 'local'; }
  }
  async function refreshCollection(c) { const rows = await readColl(c); if (Array.isArray(rows)) { state[c] = rows; emit(false); } }
  function push(op, coll, payload) {
    if (!sb || (Store.mode !== 'supabase' && Store.mode !== 'supabase-secure')) return;
    let q;
    if (sid()) {
      if (op === 'insert') q = sb.rpc('piaget_insert', { p_token: sid(), p_table: coll, p_id: payload.item._id, p_payload: clean(payload.item) });
      else if (op === 'update') { const current = (state[coll] || []).find(x => x._id === payload.id) || payload.patch || {}; q = sb.rpc('piaget_update', { p_token: sid(), p_table: coll, p_id: payload.id, p_payload: clean(current) }); }
      else if (op === 'delete') q = sb.rpc('piaget_delete', { p_token: sid(), p_table: coll, p_id: payload.id });
    } else {
      const t = sb.from(coll);
      if (FLEX.has(coll)) {
        if (op === 'insert') q = t.insert([{ id: payload.item._id, payload: clean(payload.item) }]);
        else if (op === 'update') { const current = (state[coll] || []).find(x => x._id === payload.id); q = t.update({ payload: clean(current || payload.patch || {}) }).eq('id', payload.id); }
        else if (op === 'delete') q = t.delete().eq('id', payload.id);
      } else {
        if (op === 'insert') q = t.insert([{ ...clean(payload.item), id: payload.item._id }]);
        else if (op === 'update') q = t.update(clean(payload.patch)).eq('id', payload.id);
        else if (op === 'delete') q = t.delete().eq('id', payload.id);
      }
    }
    if (q) q.then(({ error }) => { if (error) console.warn('[PIAGET] save ' + op + ' ' + coll, error.message); });
  }

  const Store = {
    mode: 'local',
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    all(coll) { return state[coll] || []; },
    get(coll, id) { return (state[coll] || []).find(x => x._id === id); },
    add(coll, item) { const it = { _id: uid(), ...item }; state[coll] = [it, ...(state[coll] || [])]; emit(); push('insert', coll, { item: it }); return it; },
    update(coll, id, patch) { state[coll] = (state[coll] || []).map(x => x._id === id ? { ...x, ...patch } : x); emit(); push('update', coll, { id, patch }); },
    remove(coll, id) { state[coll] = (state[coll] || []).filter(x => x._id !== id); emit(); push('delete', coll, { id }); },
    setThread(thread) { state.copilotThread = thread; emit(); },
    log(who, action, icon = 'spark') { const item = { _id: uid(), who, action, icon, time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) }; state.activity = [item, ...(state.activity || [])].slice(0, 8); emit(); push('insert', 'activity', { item }); },
    reset() { try { localStorage.removeItem(LSKEY); } catch (_) {} state = seed(); window.DB = state; emit(false); },
  };
  window.Store = Store;
  window.useStore = function () { const [, force] = React.useState(0); React.useEffect(() => Store.subscribe(() => force(n => n + 1)), []); return Store; };
  window.addEventListener('piaget-session', () => { if (sb && sid()) { Store.mode = 'supabase-secure'; SYNCED.forEach(c => refreshCollection(c)); } });
  if (cfg.supabaseUrl && cfg.supabaseKey) initSupabase();
})();
