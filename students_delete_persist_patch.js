/* students_delete_persist_patch.js — evita que estudiantes eliminados reaparezcan */
(function(){
  function db(){ window.DB=window.DB||{}; DB.settings=DB.settings||{}; DB.students=Array.isArray(DB.students)?DB.students:[]; return DB; }
  function ids(){ var d=db(); d.settings.deletedStudentIds=Array.isArray(d.settings.deletedStudentIds)?d.settings.deletedStudentIds:[]; return d.settings.deletedStudentIds; }
  function setIds(arr){ db().settings.deletedStudentIds=Array.from(new Set((arr||[]).filter(Boolean))); }
  function deletedSet(){ return new Set(ids()); }
  function cleanName(v){ return String(v||'').trim().toLowerCase(); }
  function markDeleted(studentOrId){
    var d=db();
    var id = typeof studentOrId==='string' ? studentOrId : (studentOrId && studentOrId._id);
    if(!id) return;
    setIds(ids().concat([id]));
    d.students = (d.students||[]).filter(function(s){ return s && s._id !== id; });
    try{
      if(d.settings && Array.isArray(d.settings.studentAccounts)){
        d.settings.studentAccounts = d.settings.studentAccounts.map(function(a){ return a && (a.studentId===id) ? Object.assign({}, a, { status:'Eliminado', deleted:true, updatedAt:new Date().toISOString() }) : a; });
      }
    }catch(e){}
  }
  function scrub(){
    var d=db();
    var del=deletedSet();
    if(!del.size) return;
    d.students = (d.students||[]).filter(function(s){ return s && !del.has(s._id); });
    try{
      if(d.settings && Array.isArray(d.settings.studentAccounts)){
        d.settings.studentAccounts = d.settings.studentAccounts.map(function(a){ return a && del.has(a.studentId) ? Object.assign({}, a, { status:'Eliminado', deleted:true }) : a; });
      }
    }catch(e){}
  }
  function save(){ try{ if(window.Store && Store.saveState) Store.saveState(); }catch(e){} }
  function patchStore(){
    if(!window.Store || Store.__studentDeletePatched) return false;
    var oldRemove = Store.remove;
    Store.remove = function(col, id){
      if(col==='students'){
        markDeleted(id);
        var out = oldRemove ? oldRemove.call(Store, col, id) : null;
        markDeleted(id);
        scrub();
        save();
        try{ window.dispatchEvent(new CustomEvent('piaget-students-changed')); }catch(e){}
        return out;
      }
      return oldRemove ? oldRemove.apply(Store, arguments) : null;
    };
    Store.__studentDeletePatched = true;
    return true;
  }
  function patchEstStudents(){
    try{
      if(window.__estStudentsDeleteFiltered) return;
      var old = window.estStudents;
      if(typeof old !== 'function') return;
      window.estStudents = function(){
        var del=deletedSet();
        return old.apply(this, arguments).filter(function(s){ return s && !del.has(s._id); });
      };
      window.__estStudentsDeleteFiltered = true;
    }catch(e){}
  }
  function patchStudentAccounts(){
    try{
      if(window.__estStudentAccountsDeleteFiltered) return;
      var old = window.estStudentAccounts;
      if(typeof old !== 'function') return;
      window.estStudentAccounts = function(){
        var del=deletedSet();
        return old.apply(this, arguments).filter(function(a){ return a && !del.has(a.studentId) && a.status!=='Eliminado' && !a.deleted; });
      };
      window.__estStudentAccountsDeleteFiltered = true;
    }catch(e){}
  }
  function boot(){ scrub(); patchStore(); patchEstStudents(); patchStudentAccounts(); }
  window.piagetMarkDeletedStudent = function(studentOrId){ markDeleted(studentOrId); scrub(); save(); };
  window.piagetScrubDeletedStudents = scrub;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  var tries=0;
  var timer=setInterval(function(){ boot(); scrub(); tries++; if(tries>40) clearInterval(timer); }, 250);
})();