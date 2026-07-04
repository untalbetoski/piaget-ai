/* student_documents_label_patch.js — reemplaza Acta tutor por Reporte Evaluación Anterior */
(function(){
  var OLD_LABEL = 'Acta de Nacimiento del Tutor';
  var NEW_LABEL = 'Reporte de Evaluación Anterior del Estudiante';
  var OLD_KEY = 'actaNacimientoTutor';
  var NEW_KEY = 'reporteEvaluacionAnteriorEstudiante';

  function migrateDocBag(bag){
    if(!bag || typeof bag !== 'object') return bag;
    if(bag[OLD_KEY] && !bag[NEW_KEY]) bag[NEW_KEY] = bag[OLD_KEY];
    if(Object.prototype.hasOwnProperty.call(bag, OLD_KEY)) delete bag[OLD_KEY];
    return bag;
  }
  function migrateStudent(stu){
    if(!stu || typeof stu !== 'object') return stu;
    if(stu.officialDocuments) stu.officialDocuments = migrateDocBag(stu.officialDocuments);
    if(stu.documents) stu.documents = migrateDocBag(stu.documents);
    return stu;
  }
  function migrateDb(){
    try{
      if(window.DB && Array.isArray(DB.students)) DB.students = DB.students.map(migrateStudent);
    }catch(e){}
  }
  function patchStore(){
    try{
      if(!window.Store || Store.__studentDocsReportPatch) return;
      var oldAdd = Store.add;
      var oldUpdate = Store.update;
      Store.add = function(col, item){
        if(col === 'students') item = migrateStudent(item);
        return oldAdd ? oldAdd.call(Store, col, item) : null;
      };
      Store.update = function(col, id, patch){
        if(col === 'students') patch = migrateStudent(patch);
        return oldUpdate ? oldUpdate.call(Store, col, id, patch) : null;
      };
      Store.__studentDocsReportPatch = true;
    }catch(e){}
  }
  function replaceLabels(){
    try{
      document.querySelectorAll('div,span,label,b,strong').forEach(function(el){
        if(el && el.childNodes && el.childNodes.length === 1 && String(el.textContent || '').trim() === OLD_LABEL){
          el.textContent = NEW_LABEL;
        }
      });
    }catch(e){}
  }
  function tick(){ migrateDb(); patchStore(); replaceLabels(); }
  window.piagetMigrateStudentOfficialDocuments = function(){ migrateDb(); try{ if(window.Store && Store.saveState) Store.saveState(); }catch(e){} };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick); else tick();
  var n = 0;
  var t = setInterval(function(){ tick(); n++; if(n > 80) clearInterval(t); }, 250);
})();