/* student_credential_force_final.js — obliga la credencial vieja a usar el diseño final */
(function(){
  function wire(){
    try{
      if(window.StudentCredentialModal && window.StudentCredentialCard && typeof window.estPrintCredential === 'function'){
        window.jpPrintCredential = window.estPrintCredential;
        window.__jpStudentCredentialFinal = true;
      }
    }catch(e){ console.warn('[PIAGET] credencial estudiante final', e); }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  var n = 0;
  var t = setInterval(function(){ wire(); n++; if(n > 40) clearInterval(t); }, 250);
})();