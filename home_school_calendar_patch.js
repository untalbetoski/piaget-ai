/* home_school_calendar_patch.js — Calendario escolar de Configuración en homes de Estudiante, Docente y Familia */
(function () {
  function h() { return React.createElement.apply(React, arguments); }
  function icon(name, size) { return window.Icon ? h(Icon, { name: name, size: size || 15, className: 'btn-ico' }) : null; }
  function badge(text, tone) { return h('span', { className: 'badge ' + (tone || 'gray'), style: { whiteSpace: 'nowrap' } }, text); }
  function clean(v) { return String(v || '').trim(); }
  function settingsSource() {
    var out = {};
    try { if (window.DB && DB.settings) out = Object.assign(out, DB.settings); } catch (_) {}
    try { if (window.PIAGET_LIVE) out = Object.assign(out, window.PIAGET_LIVE); } catch (_) {}
    try { var local = JSON.parse(localStorage.getItem('piaget_settings') || 'null'); if (local) out = Object.assign(out, local); } catch (_) {}
    return out;
  }
  function calendarEvents() {
    var s = settingsSource();
    var list = Array.isArray(s.calendarEvents) ? s.calendarEvents : [];
    return list.filter(function (e) { return e && clean(e.name || e.title); }).map(function (e, i) {
      return {
        _id: e._id || e.id || ('cal-' + i),
        name: clean(e.name || e.title),
        date: clean(e.date || e.when || e.fecha),
        type: clean(e.type || e.tipo || 'Evento'),
        level: clean(e.level || e.nivel || 'Todos') || 'Todos'
      };
    });
  }
  var MONTHS = { ene:0, enero:0, feb:1, febrero:1, mar:2, marzo:2, abr:3, abril:3, may:4, mayo:4, jun:5, junio:5, jul:6, julio:6, ago:7, agosto:7, sep:8, sept:8, septiembre:8, oct:9, octubre:9, nov:10, noviembre:10, dic:11, diciembre:11 };
  function parsePart(str) {
    str = clean(str).toLowerCase().replace(/[.,]/g, '');
    if (!str) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) { var d0 = new Date(str + 'T12:00:00'); return isNaN(d0) ? null : d0; }
    var p = str.split(/\s+/).filter(Boolean), day = null, month = null, year = null;
    p.forEach(function (x) { if (/^\d{1,2}$/.test(x) && day == null) day = Number(x); else if (/^\d{4}$/.test(x)) year = Number(x); else if (MONTHS[x] != null) month = MONTHS[x]; });
    if (day == null || month == null || year == null) return null;
    return new Date(year, month, day, 12, 0, 0, 0);
  }
  function parseRange(date) {
    var parts = clean(date).split(/\s*[–-]\s*/).filter(Boolean);
    var start = parsePart(parts[0] || '');
    var end = parsePart(parts[1] || '') || start;
    return { start: start, end: end };
  }
  function eventTone(type) {
    return { Festivo: 'red', Vacaciones: 'violet', Suspensión: 'amber', Evento: 'cyan', Junta: 'green' }[type] || 'blue';
  }
  function relevantLevels(kind) {
    try {
      if (kind === 'StudentHome') { var st = window.piagetStudent && window.piagetStudent(); return st && st.nivel ? [st.nivel] : []; }
      if (kind === 'FamilyHome') { var kids = window.piagetChildren && window.piagetChildren(); return Array.from(new Set((kids || []).map(function (k) { return k.nivel; }).filter(Boolean))); }
      if (kind === 'DocenteHome') { var sc = window.docScope && window.docScope(); return Array.from(new Set((sc && sc.niveles) || [])); }
    } catch (_) {}
    return [];
  }
  function visibleEvents(kind) {
    var levels = relevantLevels(kind);
    var all = calendarEvents().filter(function (e) { return !levels.length || e.level === 'Todos' || levels.indexOf(e.level) >= 0; });
    all.sort(function (a, b) {
      var da = parseRange(a.date).start, db = parseRange(b.date).start;
      return (da ? da.getTime() : 9999999999999) - (db ? db.getTime() : 9999999999999);
    });
    var today = new Date(); today.setHours(0,0,0,0);
    var upcoming = all.filter(function (e) { var r = parseRange(e.date); return !r.end || r.end >= today; });
    return (upcoming.length ? upcoming : all).slice(0, 6);
  }
  function CalendarCard(props) {
    var kind = props.kind;
    var rows = visibleEvents(kind);
    var levels = relevantLevels(kind);
    var scope = levels.length ? levels.join(' · ') : 'Toda la comunidad';
    return h('div', { className: 'content-inner', style: { marginTop: -10 } },
      h('div', { className: 'card' },
        h('div', { className: 'card-head' },
          h('div', null,
            h('div', { className: 'card-title' }, icon('calendar', 17), 'Calendario escolar'),
            h('div', { className: 'faint', style: { fontSize: 12.5, marginTop: 2 } }, 'Consulta del calendario configurado · ', scope)
          ),
          badge('Solo consulta', 'gray')
        ),
        h('div', null,
          rows.length ? rows.map(function (e, i) {
            return h('div', { className: 'lrow', key: e._id, style: { borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' } },
              h('div', { className: 'insight-ico', style: { background: 'var(--surface-2)', color: 'var(--text-muted)', width: 34, height: 34 } }, icon(e.type === 'Vacaciones' ? 'star' : e.type === 'Junta' ? 'users' : 'calendar', 16)),
              h('div', { className: 'grow', style: { minWidth: 0 } },
                h('div', { style: { fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, e.name),
                h('div', { className: 'faint', style: { fontSize: 12.2 } }, e.date || 'Sin fecha')
              ),
              h('div', { className: 'row center gap-6', style: { flexShrink: 0 } }, badge(e.type, eventTone(e.type)), e.level && e.level !== 'Todos' ? badge(e.level, 'gray') : badge('Todos', 'gray'))
            );
          }) : h('div', { className: 'faint', style: { padding: 22, fontSize: 13, textAlign: 'center' } }, 'Sin eventos del calendario escolar configurados todavía.')
        )
      )
    );
  }
  function wrap(name) {
    var current = window[name];
    var value = current;
    function make(fn) {
      if (!fn || fn.__schoolCalendarWrapped) return fn;
      function Wrapped(props) { return h(React.Fragment, null, h(fn, props || {}), h(CalendarCard, { kind: name })); }
      Wrapped.__schoolCalendarWrapped = true;
      Wrapped.__original = fn;
      return Wrapped;
    }
    try {
      Object.defineProperty(window, name, {
        configurable: true,
        get: function () { return value; },
        set: function (v) { value = make(v); }
      });
      if (current) value = make(current);
    } catch (_) {
      if (current) window[name] = make(current);
    }
  }
  wrap('StudentHome');
  wrap('DocenteHome');
  wrap('FamilyHome');
  window.SchoolCalendarConsulta = CalendarCard;
})();
