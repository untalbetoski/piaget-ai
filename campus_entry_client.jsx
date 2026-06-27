/* campus_entry_client.jsx */
(function () {
  function sessionToken() {
    try { return (JSON.parse(localStorage.getItem('piaget_session') || 'null') || {}).session_token || ''; }
    catch (_) { return ''; }
  }
  async function getClient() {
    if (window.PiagetSettings && window.PiagetSettings.client) return await window.PiagetSettings.client();
    if (window.PIAGET_SB) return window.PIAGET_SB;
    throw new Error('Cliente Supabase no disponible');
  }
  async function callRpc(name, extra) {
    const p_session = sessionToken();
    if (!p_session) throw new Error('Inicia sesión nuevamente para sincronizar.');
    const c = await getClient();
    const { data, error } = await c.rpc(name, { p_session, ...(extra || {}) });
    if (error) throw new Error(error.message || 'Error Supabase');
    return data;
  }
  async function read() {
    try { await callRpc('piaget_campus_seed_if_empty'); } catch (_) {}
    return await callRpc('piaget_campus_read');
  }
  async function add(item) { return await callRpc('piaget_campus_event', { p_item: item || {} }); }
  async function resolve(id, ok) { return await callRpc('piaget_campus_queue_resolve', { p_id: id, p_ok: !!ok }); }
  window.CampusEntry = { read, add, resolve };
})();
