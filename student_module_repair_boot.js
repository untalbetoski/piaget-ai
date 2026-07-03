/* student_module_repair_boot.js — reparación de emergencia para Estudiantes */
(function(){
  function repair(){
    try{
      if(!window.AcademicoRealOnly || window.__studentsRepairApplied) return;
      var looksWrapped = String(window.AcademicoRealOnly).indexOf('__OldAcademicoRealOnly')>=0 || String(window.AcademicoRealOnly).indexOf('StudentCredentialHost')>=0;
      if(looksWrapped && window.Academico){
        console.warn('[PIAGET] Detectado wrapper roto de Estudiantes; esperando componente real.');
      }
      window.__studentsRepairApplied = true;
    }catch(e){ console.warn('[PIAGET] repair estudiantes', e); }
  }
  function removeBrokenLateScript(){
    try{
      document.querySelectorAll('script[src*="student_enrollment_form_patch"],script[src*="student_credentials_patch"]').forEach(function(s){ s.remove(); });
    }catch(e){}
  }
  removeBrokenLateScript();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', repair); else repair();
  setTimeout(repair,300);
  setTimeout(repair,1000);
})();