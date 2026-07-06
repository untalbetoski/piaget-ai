/* cobros_inscripcion_balance_patch.jsx — aplica pagos reales por concepto y corrige saldo de inscripción */

(function(){
  const norm = v => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const payKind = c => {
    const s = norm((c && (c.paymentConcept || c.concept || c.concepto)) || '');
    if (s.includes('inscrip')) return 'inscripcion';
    if (s.includes('cuota unica') || s.includes('cuota anual') || s.includes('cuota única')) return 'extras';
    if (s.includes('colegiatura') || s.includes('mensualidad') || s.includes('pago anual')) return 'colegiatura';
    return 'otros';
  };
  const students = () => ((window.DB && Array.isArray(DB.students)) ? DB.students : []);
  const paymentSid = c => {
    if (c && c.sid) return c.sid;
    const who = norm(c && (c.student || c.alumno || c.name));
    if (!who) return '';
    const s = students().find(x => norm(x.name || x.nombre) === who);
    return s ? s._id : '';
  };
  function paidBySidFixed(){
    const out = {};
    ((window.DB && DB.cobros) || []).forEach(c => {
      if (!c || String(c.status || '').toLowerCase() === 'cancelado') return;
      const sid = paymentSid(c);
      if (!sid) return;
      out[sid] = (out[sid] || 0) + (Number(c.amount) || 0);
    });
    return out;
  }
  function paidConcepts(sid){
    const out = { inscripcion: 0, colegiatura: 0, extras: 0, otros: 0 };
    ((window.DB && DB.cobros) || []).forEach(c => {
      if (!c || String(c.status || '').toLowerCase() === 'cancelado') return;
      if (paymentSid(c) !== sid) return;
      const k = payKind(c);
      out[k] += Number(c.amount) || 0;
    });
    return out;
  }

  const baseResolve = window.ctaResolve;
  function ctaResolveFixed(stu, paidMap){
    if (typeof baseResolve !== 'function') return stu;
    const res = baseResolve(stu, paidMap || paidBySidFixed());
    const p = paidConcepts(stu.sid);
    const insCargo = Number(res.t && res.t.inscripcion) || 0;
    const colCargo = Number(res.colegNeto) || 0;
    const extCargo = Number(res.t && res.t.extras) || 0;
    const insPagado = Math.min(insCargo, p.inscripcion);
    const colPagado = Math.min(colCargo, p.colegiatura + p.otros);
    const extPagado = Math.min(extCargo, p.extras);
    const insSaldo = Math.max(0, insCargo - insPagado);
    const colSaldo = Math.max(0, colCargo - colPagado);
    const extSaldo = Math.max(0, extCargo - extPagado);
    const totalCargo = insCargo + colCargo + extCargo;
    const totalPagado = Math.min(totalCargo, insPagado + colPagado + extPagado);
    const totalSaldo = Math.max(0, totalCargo - totalPagado);
    const estatus = totalSaldo <= 0 ? 'liquidado' : totalPagado > 0 ? 'parcial' : 'sin_pago';
    return {
      ...res,
      total: totalCargo,
      pagado: totalPagado,
      saldo: totalSaldo,
      estatus,
      pagosConcepto: { inscripcion: insPagado, colegiatura: colPagado, extras: extPagado },
      saldosConcepto: { inscripcion: insSaldo, colegiatura: colSaldo, extras: extSaldo },
      cargosConcepto: { inscripcion: insCargo, colegiatura: colCargo, extras: extCargo },
      t: { ...(res.t || {}), inscripcion: insSaldo, extras: extSaldo }
    };
  }

  function StudentAccountFixed({ stu, onClose, onChange, onPay }) {
    const sch = ctaSchedule(stu);
    const pct = stu.total ? Math.round(stu.pagado / stu.total * 100) : 0;
    const pagos = (DB.cobros || []).filter(c => paymentSid(c) === stu.sid).slice().sort((a,b) => ((b.date || '') + (b.time || '')).localeCompare((a.date || '') + (a.time || '')));
    const pc = stu.pagosConcepto || paidConcepts(stu.sid);
    const sc = stu.saldosConcepto || { inscripcion: Math.max(0, (stu.cargosConcepto && stu.cargosConcepto.inscripcion || 0) - (pc.inscripcion || 0)), colegiatura: 0, extras: 0 };
    const cc = stu.cargosConcepto || { inscripcion: Number(stu.t && stu.t.inscripcion) || 0, colegiatura: Number(stu.colegNeto) || 0, extras: Number(stu.t && stu.t.extras) || 0 };
    function setPlan(p){ ctaSet(stu.sid,{ plan:p }); const real=Store.get&&Store.get('students',stu.sid); if(real) Store.update('students',stu.sid,{ plan:p }); onChange(); }
    function setBeca(v){ const n=Math.max(0,Math.min(100,Math.round(Number(v)||0))); ctaSet(stu.sid,{ beca:n }); const real=Store.get&&Store.get('students',stu.sid); if(real) Store.update('students',stu.sid,{ beca:n,hasBeca:n>0 }); onChange(); }
    const filas = [
      { k:'Inscripción', cargo:cc.inscripcion, pagado:pc.inscripcion || 0, saldo:sc.inscripcion || 0, note:'sin beca' },
      { k:'Colegiatura del ciclo · ' + cobPlanLabel(stu.plan), cargo:cc.colegiatura, pagado:pc.colegiatura || 0, saldo:sc.colegiatura || 0, note:stu.beca>0 ? ('beca '+stu.beca+'%') : cobPlanLabel(stu.plan) },
      { k:'Cuota única anual', cargo:cc.extras, pagado:pc.extras || 0, saldo:sc.extras || 0, note:'sin beca' },
    ];
    return <Modal open width={760} onClose={onClose} title={stu.name} footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={() => onPay(stu)}><Icon name="wallet" size={15} className="btn-ico" />Registrar pago</button></>}>
      <div className="row gap-8" style={{ flexWrap:'wrap',marginBottom:14,alignItems:'center' }}><Badge tone="gray"><Icon name="cap" size={12}/>{stu.group} · {stu.nivel}</Badge>{ctaEstatusBadge(stu.estatus)}{stu.beca>0&&<Badge tone="violet">Beca {stu.beca}%</Badge>}</div>
      <div className="card pad" style={{ marginBottom:14 }}><div className="field-row"><Field label="Plan de pago"><SelectInput value={stu.plan} onChange={e=>setPlan(e.target.value)} options={[{value:'10',label:'Plan 10 (10 mensualidades)'},{value:'12',label:'Plan 12 (12 colegiaturas)'},{value:'anual',label:'Anual (1 pago −10%)'}]} /></Field><Field label="Beca % (solo colegiatura)"><NumberInput value={stu.beca} min="0" max="100" onChange={e=>setBeca(e.target.value)} /></Field></div></div>
      <div className="card" style={{ marginBottom:14 }}><CardHead icon="receipt" title="Balance general del estudiante" sub={COB_CICLO_LABEL} /><div>{filas.map((f,i)=><div key={i} className="lrow" style={{ padding:'12px 16px',alignItems:'center' }}><div className="grow"><div style={{ fontWeight:600,fontSize:13.5 }}>{f.k}</div><div className="faint" style={{ fontSize:12 }}>{f.note}</div></div><div className="row gap-16" style={{ alignItems:'center' }}><div style={{ textAlign:'right' }}><div className="faint" style={{ fontSize:10 }}>Cargo</div><div className="tnum" style={{ fontWeight:600 }}>{fmtMoney(f.cargo)}</div></div><div style={{ textAlign:'right' }}><div className="faint" style={{ fontSize:10 }}>Pagado</div><div className="tnum" style={{ fontWeight:600,color:f.pagado>0?'var(--green)':'var(--text-faint)' }}>{fmtMoney(f.pagado)}</div></div><div style={{ textAlign:'right',minWidth:88 }}><div className="faint" style={{ fontSize:10 }}>Saldo</div><div className="tnum" style={{ fontWeight:700,color:f.saldo>0?'var(--red)':'var(--green)' }}>{fmtMoney(f.saldo)}</div></div></div></div>)}<div className="lrow" style={{ padding:'12px 16px',background:'var(--accent-soft)' }}><div className="grow" style={{ fontWeight:700 }}>Saldo general</div><div className="row gap-16"><span className="tnum faint">Pagado {fmtMoney(stu.pagado)}</span><span className="tnum" style={{ fontWeight:800,color:stu.saldo>0?'var(--red)':'var(--green)' }}>{fmtMoney(stu.saldo)}</span></div></div></div></div>
      <div className="card pad" style={{ marginBottom:14 }}><div className="row between center" style={{ marginBottom:8,fontSize:13 }}><span style={{ fontWeight:600 }}>Avance de pago</span><span className="tnum faint">{fmtMoney(stu.pagado)} de {fmtMoney(stu.total)} · {pct}%</span></div><Bar value={pct} color={stu.saldo<=0?'var(--green)':pct>0?'var(--accent)':'var(--gray)'} height={9}/></div>
      <div className="faint" style={{ fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8 }}>Calendario de colegiaturas · {cobPlanLabel(stu.plan)}</div><div className="row" style={{ gap:6,flexWrap:'wrap',marginBottom:16 }}>{sch.map(c=><div key={c.n} style={{ flex:'1 1 64px',minWidth:64,textAlign:'center',border:'1px solid var(--border)',borderRadius:9,padding:'8px 4px',background:'var(--surface)' }}><div className="faint" style={{ fontSize:10 }}>{c.mes}</div><div className="tnum" style={{ fontWeight:600,fontSize:12,marginTop:2 }}>{c.amount?fmtMoney(c.amount):'—'}</div></div>)}</div>
      <div className="faint" style={{ fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8 }}>Pagos reales registrados · {pagos.length}</div>{pagos.length===0?<div className="faint" style={{ fontSize:13,padding:'4px 2px' }}>Aún no hay pagos ligados a este alumno.</div>:<div style={{ border:'1px solid var(--border)',borderRadius:10,overflow:'hidden' }}>{pagos.map((c,i)=><div key={c._id||i} className="row between center" style={{ padding:'9px 12px',borderTop:i?'1px solid var(--border)':'none' }}><div><div style={{ fontSize:13 }}>{c.concept}</div><div className="faint font-mono" style={{ fontSize:11 }}>{c.recibo} · {c.channel}</div></div><span className="tnum" style={{ fontWeight:600 }}>{fmtMoney(c.amount)}</span></div>)}</div>}
    </Modal>;
  }

  window.ctaPaidBySid = paidBySidFixed;
  window.ctaResolve = ctaResolveFixed;
  window.StudentAccount = StudentAccountFixed;
  window.ctaPaidConcepts = paidConcepts;
})();