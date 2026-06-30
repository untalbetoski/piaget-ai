/* real_students_only_patch.js — evita alumnos simulados en Clases, Académico y Cobros */
(function(){
  function inferNivel(grade){var g=String(grade||'');return /sec/i.test(g)?'Secundaria':/^\s*k/i.test(g)?'Preescolar':'Primaria';}
  function realStudents(){return (window.DB&&Array.isArray(DB.students))?DB.students:[];}
  function asisOf(s){var v=s.att!=null?s.att:(s.asis!=null?s.asis:(s.asistencia!=null?s.asistencia:100));return Number(v)||0;}
  function avgOf(s){return s.avg!=null&&s.avg!==''?Number(s.avg):null;}
  function riskOf(s){if(s.risk)return s.risk;var avg=avgOf(s),att=asisOf(s);return (avg!=null&&avg<7)||att<75?'high':(avg!=null&&avg<8)||att<88?'mid':'low';}
  function groupOf(s){return String(s.grade||s.group||'').trim();}
  function nivelOf(s){return s.nivel||inferNivel(groupOf(s));}
  function normalizeStudent(s){return Object.assign({},s,{sid:s._id||s.sid||'',name:s.name||'Alumno sin nombre',group:groupOf(s),grade:groupOf(s),nivel:nivelOf(s),avg:avgOf(s),att:asisOf(s),asis:asisOf(s),risk:riskOf(s),manual:true});}
  window.piagetRealStudents=function(){return realStudents().map(normalizeStudent);};
  window.alumnosDeClase=function(clase){
    if(!clase)return[];var g=String(clase.g||clase.grade||clase.group||'').trim();var n=String(clase.nivel||'').trim();
    return window.piagetRealStudents().filter(function(s){return s.grade===g&&(!n||!s.nivel||s.nivel===n);}).map(function(s){return {sid:s.sid,name:s.name,avg:s.avg,asis:s.att,manual:true,raw:s};});
  };
  window.acaBuildRoster=function(){return window.piagetRealStudents();};
  window.ctaStudents=function(){return window.piagetRealStudents().map(function(s){return {sid:s.sid,name:s.name,group:s.grade,nivel:s.nivel,manual:true};});};
  var oldStore=null;
  function patchStore(){
    if(!window.Store||window.Store===oldStore||window.Store.__realStudentsPatch)return;
    oldStore=window.Store;
    var add=Store.add.bind(Store);
    Store.add=function(coll,item){
      if(coll==='clases'){
        item=Object.assign({},item,{alumnos:0,asistencia:0,avg:null});
      }
      return add(coll,item);
    };
    Store.__realStudentsPatch=true;
  }
  function refreshCounts(){
    try{
      var students=window.piagetRealStudents();
      (DB.clases||[]).forEach(function(c){
        var count=students.filter(function(s){return s.grade===c.g&&(!c.nivel||!s.nivel||s.nivel===c.nivel);}).length;
        c.realAlumnos=count;
      });
    }catch(e){}
  }
  function tick(){patchStore();refreshCounts();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){tick();setInterval(tick,700);});else{tick();setInterval(tick,700);}
})();
