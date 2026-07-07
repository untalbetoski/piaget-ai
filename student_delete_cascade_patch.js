/* student_delete_cascade_patch.js — eliminación integral de estudiante */
(function(){
  function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ');}
  function install(){
    if(!window.Store || Store.__studentDeleteCascade) return;
    var originalRemove = Store.remove.bind(Store);
    Store.remove = function(coll,id){
      if(coll === 'students'){
        var stu = Store.get && Store.get('students',id);
        var name = norm(stu && (stu.name || stu.nombre));
        var payments = ((window.DB && Array.isArray(DB.cobros)) ? DB.cobros : []).filter(function(c){
          if(!c) return false;
          if(String(c.sid||'') === String(id||'')) return true;
          return !!name && norm(c.student || c.alumno || '') === name;
        });
        payments.forEach(function(c){ if(c && c._id) originalRemove('cobros',c._id); });
        try{
          DB.settings = DB.settings || {};
          if(Array.isArray(DB.settings.studentAccounts)){
            DB.settings.studentAccounts = DB.settings.studentAccounts.filter(function(a){
              return String(a.studentId||'') !== String(id||'') && (!stu || norm(a.email||'') !== norm(stu.email||''));
            });
          }
        }catch(_){}
        try{ Store.log && Store.log('Administración','eliminó estudiante y '+payments.length+' pago(s) relacionado(s)','trash'); }catch(_){}
      }
      return originalRemove(coll,id);
    };
    Store.__studentDeleteCascade = true;
  }
  install();
  var n=0,t=setInterval(function(){install();n++;if(n>120)clearInterval(t);},250);
})();