(function () {
  const cfg = window.PIAGET_CONFIG || {};
  const LSKEY = window.PIAGET_FRESH ? 'piaget_db_v14_fresh' : 'piaget_db_v14';
  const OLD_KEYS = ['piaget_db_v13', 'piaget_db_v13_fresh', 'piaget_db_v12', 'piaget_db_v12_fresh'];
  const SKEY = 'piaget_session';
  const SYNCED = ['clases','students','staff','processes','invoices','leads','announcements','agents','activity','matriculas','docs','evaluaciones','diario','tareas','tickets','facturas','cobros','docentes','products','ventas','onlineOrders','missions','missionSubmissions','badges','rewards','engage_retos','engageParticipations','familyAccounts','egresos','experiences'];
  const FLEX = new Set(['clases','matriculas','docs','evaluaciones','diario','tareas','tickets','facturas','cobros','docentes','products','ventas','onlineOrders','missions','missionSubmissions','badges','rewards','engage_retos','engageParticipations','familyAccounts','egresos','experiences']);
  const SNAPSHOT_KEYS = [
    'school','user','settings','kpis','enrollTrend','attendanceByGrade','financeMonthly','insights','alerts','activity',
    'students','gradeDist','subjects','staff','adminStats','processes','invoices','leads','channels','announcements',
    'biKpis','biEnrollVsCapacity','cohortRetention','copilotSuggestions','accessLive','accessQueue','accessByLevel','accessAreas','accessVisitors','accessIncidents','accessEarlyExits','accessPickups','accessLate','accessPool',
    'products','onlineOrders','inventory','invMovements','invSuppliers','invOrders','invLocations','tienda','missions','leaderboard','experiences',
    'enrollment','matriculas','incomeByConcept','docs','boletines','evaluaciones','diario','tareas','tickets','chats','facturas','cobros','egresos','familyAccounts','sessions','auditLog','adminUsers','integrations','notifGroups','roles','permModules','cyclePeriods','calendarEvents','clases','docentes','agents','badges','rewards','engage_retos','engageParticipations','missionSubmissions','ventas'
  ];
  const CLEAR_ARRAYS = ['activity','students','staff','processes','invoices','leads','announcements','docs','boletines','evaluaciones','diario','tareas','tickets','chats','facturas','cobros','egresos','familyAccounts','accessLive','accessQueue','accessVisitors','accessIncidents','accessEarlyExits','accessPickups','accessLate','accessPool','onlineOrders','inventory','invMovements','invSuppliers','invOrders','invLocations','missions','leaderboard','experiences','matriculas','docentes','agents','badges','rewards','engage_retos','engageParticipations','missionSubmissions','ventas','clases'];
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now());
  const clone = o => JSON.parse(JSON.stringify(o));
  const clean = o => { const x = { ...(o || {}) }; delete x._id; return x; };
  const sid = () => { try { return (JSON.parse(localStorage.getItem(SKEY) || 'null') || {}).session_token || ''; } catch (_) { return ''; } };

  function readSaved(keys) {
    for (const k of keys) {
      try { const saved = JSON.parse(localStorage.getItem(k) || 'null'); if (saved) return saved; } catch (_) {}
    }
    return null;
  }
  function ensureIds(obj) { SYNCED.forEach(c => { (obj[c] || []).forEach(it => { if (!it._id) it._id = uid(); }); }); }
  function clearDemoState(obj) {
    CLEAR_ARRAYS.forEach(k => { if (Array.isArray(obj[k])) obj[k] = []; });
    if (Array.isArray(obj.kpis)) obj.kpis = obj.kpis.map(k => ({ ...k, value: '0', unit: k.unit || '', delta: 0, foot: 'Sin datos reales', spark: [] }));
    if (obj.enrollTrend) obj.enrollTrend = { labels: obj.enrollTrend.labels || [], series: [{ name: 'Inscritos', data: (obj.enrollTrend.labels || []).map(() => 0) }] };
    if (obj.attendanceByGrade) obj.attendanceByGrade = { ...obj.attendanceByGrade, data: (obj.attendanceByGrade.data || []).map(() => 0) };
    if (obj.financeMonthly) obj.financeMonthly = { ...obj.financeMonthly, ingresos: (obj.financeMonthly.labels || []).map(() => 0), egresos: (obj.financeMonthly.labels || []).map(() => 0) };
    if (Array.isArray(obj.channels)) obj.channels = obj.channels.map(c => ({ ...c, sent: 0, open: 0 }));
    if (Array.isArray(obj.enrollment)) obj.enrollment = obj.enrollment.map(e => ({ ...e, inscritos: 0, nuevos: 0, reinscritos: 0 }));
    if (Array.isArray(obj.incomeByConcept)) obj.incomeByConcept = obj.incomeByConcept.map(x => ({ ...x, value: 0, delta: 0 }));
    if (obj.tienda) obj.tienda = { salesToday: 0, salesMonth: 0, avgTicket: 0, txMonth: 0, weekly: { labels: (obj.tienda.weekly && obj.tienda.weekly.labels) || [], values: ((obj.tienda.weekly && obj.tienda.weekly.labels) || []).map(() => 0) }, byCategory: [], topProducts: [], recent: [] };
    return obj;
  }
  function seed() {
    const base = clone(window.DB_DEFAULTS || {});
    try {
      const saved = readSaved([LSKEY, ...OLD_KEYS]);
      if (saved) {
        SYNCED.forEach(c => { if (saved[c]) base[c] = saved[c]; });
        if (saved.copilotThread) base.copilotThread = saved.copilotThread;
      }
    } catch (_) {}
    ensureIds(base);
    return base;
  }

  let state = seed();
  let centralReady = false;
  let centralTimer = null;
  window.DB = state;
  try { if (!localStorage.getItem('piaget_cat_2526') && Array.isArray(state.products)) { const have = new Set(state.products.map(p => p.sku)); (window.DB_DEFAULTS.products || []).forEach(p => { if (!have.has(p.sku)) state.products.push({ ...clone(p), _id: uid() }); }); localStorage.setItem('piaget_cat_2526', '1'); } } catch (_) {}

  const listeners = new Set();
  function snapshotPayload() { const out = { __piaget_state_v: 14, updatedAt: new Date().toISOString(), data: {} }; SNAPSHOT_KEYS.forEach(k => { if (state[k] !== undefined) out.data[k] = clone(state[k]); }); if (state.copilotThread) out.data.copilotThread = state.copilotThread; return out; }
  function applySnapshot(payload) { if (!payload || !payload.__piaget_state_v || !payload.data) return false; Object.keys(payload.data).forEach(k => { state[k] = clone(payload.data[k]); }); ensureIds(state); return true; }
  function persistLocal() { try { const slim = { copilotThread: state.copilotThread }; SNAPSHOT_KEYS.forEach(c => slim[c] = state[c]); localStorage.setItem(LSKEY, JSON.stringify(slim)); } catch (_) {} }
  function scheduleCentralSave() { if (!centralReady || !sb) return; clearTimeout(centralTimer); centralTimer = setTimeout(writeAppState, 450); }
  function persist() { persistLocal(); scheduleCentralSave(); }
  function emit(save = true) { if (save) persist(); listeners.forEach(l => l()); }

  let sb = null;
  function load(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function normRow(coll, row) { if (!row) return row; if (FLEX.has(coll) && row.payload) return { ...(row.payload || {}), _id: row.id }; return { ...row, _id: row._id || String(row.id || '') }; }
  function normRows(coll, data) { return Array.isArray(data) ? data.map(r => normRow(coll, r)) : []; }
  async function readAppState() {
    if (!sb) return null;
    const { data, error } = await sb.from('app_state').select('payload').eq('id', 'main').maybeSingle();
    if (error) { console.warn('[PIAGET] app_state read', error.message); return null; }
    return data && data.payload ? data.payload : null;
  }
  function writeAppState() {
    if (!sb || !centralReady) return;
    const payload = snapshotPayload();
    sb.from('app_state').upsert({ id: 'main', payload, updated_at: new Date().toISOString() }).then(({ error }) => { if (error) console.warn('[PIAGET] app_state write', error.message); });
  }
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
      const central = await readAppState();
      const hasCentral = applySnapshot(central);
      if (!hasCentral) clearDemoState(state);
      for (const c of SYNCED) { const rows = await readColl(c); if (Array.isArray(rows)) state[c] = rows; }
      window.DB = state; centralReady = true; emit(false); if (!hasCentral) writeAppState();
      if (cfg.realtime) {
        sb.channel('pub-app-state').on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, async () => { const p = await readAppState(); if (applySnapshot(p)) { window.DB = state; emit(false); } }).subscribe();
        SYNCED.forEach(c => sb.channel('pub-' + c).on('postgres_changes', { event: '*', schema: 'public', table: c }, () => refreshCollection(c)).subscribe());
      }
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
    saveState() { emit(true); },
    reset() { try { localStorage.removeItem(LSKEY); OLD_KEYS.forEach(k => localStorage.removeItem(k)); } catch (_) {} state = clearDemoState(seed()); window.DB = state; emit(true); },
  };
  window.Store = Store;
  window.useStore = function () { const [, force] = React.useState(0); React.useEffect(() => Store.subscribe(() => force(n => n + 1)), []); return Store; };
  window.addEventListener('piaget-session', () => { if (sb && sid()) { Store.mode = 'supabase-secure'; SYNCED.forEach(c => refreshCollection(c)); readAppState().then(p => { if (applySnapshot(p)) { window.DB = state; emit(false); } }); } });
  window.addEventListener('beforeunload', () => { try { if (centralReady) writeAppState(); } catch (_) {} });
  if (cfg.supabaseUrl && cfg.supabaseKey) initSupabase();
})();
