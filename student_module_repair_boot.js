/* student_module_repair_boot.js — reparación de emergencia para Estudiantes */
(function(){
  function db(){ window.DB=window.DB||{}; DB.settings=DB.settings||{}; DB.students=Array.isArray(DB.students)?DB.students:[]; return DB; }
  function deletedIds(){ var d=db(); d.settings.deletedStudentIds=Array.isArray(d.settings.deletedStudentIds)?d.settings.deletedStudentIds:[]; return d.settings.deletedStudentIds; }
  function deletedSet(){ return new Set(deletedIds().filter(Boolean)); }
  function saveDeletedIds(arr){ db().settings.deletedStudentIds=Array.from(new Set((arr||[]).filter(Boolean))); }
  function scrubDeletedStudents(){
    try{
      var d=db(), del=deletedSet();
      if(del.size) d.students=d.students.filter(function(s){ return s && !del.has(s._id); });
      if(d.settings && Array.isArray(d.settings.studentAccounts)){
        d.settings.studentAccounts=d.settings.studentAccounts.map(function(a){ return a && del.has(a.studentId) ? Object.assign({}, a, {status:'Eliminado', deleted:true}) : a; });
      }
    }catch(e){ console.warn('[PIAGET] scrub deleted students', e); }
  }
  function markDeletedStudent(id){
    if(!id) return;
    saveDeletedIds(deletedIds().concat([id]));
    scrubDeletedStudents();
    try{ if(window.Store && Store.saveState) Store.saveState(); }catch(e){}
  }
  function patchStoreRemove(){
    if(!window.Store || Store.__studentsDeletePersist) return;
    var oldRemove=Store.remove;
    Store.remove=function(col,id){
      if(col==='students'){
        markDeletedStudent(id);
        var out=oldRemove ? oldRemove.call(Store,col,id) : null;
        markDeletedStudent(id);
        try{ window.dispatchEvent(new CustomEvent('piaget-students-changed')); }catch(e){}
        return out;
      }
      return oldRemove ? oldRemove.apply(Store, arguments) : null;
    };
    Store.__studentsDeletePersist=true;
  }
  function patchEstStudents(){
    try{
      if(window.__estStudentsDeletePersist || typeof window.estStudents!=='function') return;
      var old=window.estStudents;
      window.estStudents=function(){ var del=deletedSet(); return old.apply(this, arguments).filter(function(s){ return s && !del.has(s._id); }); };
      window.__estStudentsDeletePersist=true;
    }catch(e){}
  }
  function patchStudentAccounts(){
    try{
      if(window.__estAccountsDeletePersist || typeof window.estStudentAccounts!=='function') return;
      var old=window.estStudentAccounts;
      window.estStudentAccounts=function(){ var del=deletedSet(); return old.apply(this, arguments).filter(function(a){ return a && !del.has(a.studentId) && a.status!=='Eliminado' && !a.deleted; }); };
      window.__estAccountsDeletePersist=true;
    }catch(e){}
  }
  function repair(){
    try{
      document.querySelectorAll('script[src*="student_enrollment_form_patch"],script[src*="student_credentials_patch"]').forEach(function(s){ s.remove(); });
    }catch(e){}
    scrubDeletedStudents();
    patchStoreRemove();
    patchEstStudents();
    patchStudentAccounts();
    try{
      if(!window.AcademicoRealOnly || window.__studentsRepairApplied) return;
      var looksWrapped=String(window.AcademicoRealOnly).indexOf('__OldAcademicoRealOnly')>=0 || String(window.AcademicoRealOnly).indexOf('StudentCredentialHost')>=0;
      if(looksWrapped && window.Academico) console.warn('[PIAGET] Detectado wrapper roto de Estudiantes; esperando componente real.');
      window.__studentsRepairApplied=true;
    }catch(e){ console.warn('[PIAGET] repair estudiantes', e); }
  }
  window.piagetMarkDeletedStudent=markDeletedStudent;
  window.piagetScrubDeletedStudents=scrubDeletedStudents;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', repair); else repair();
  var n=0, timer=setInterval(function(){ repair(); n++; if(n>40) clearInterval(timer); },250);
})();