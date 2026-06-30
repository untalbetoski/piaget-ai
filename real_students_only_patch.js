/* real_students_only_patch.js — evita alumnos/grupos simulados en Clases, Académico, Cobros, Atlas y AI Missions */
(function(){
  function inferNivel(grade){var g=String(grade||'');return /sec/i.test(g)?'Secundaria':/^\s*k/i.test(g)?'Preescolar':'Primaria';}
  function realStudents(){return (window.DB&&Array.isArray(DB.students))?DB.students:[];}
  function asisOf(s){var v=s.att!=null?s.att:(s.asis!=null?s.asis:(s.asistencia!=null?s.asistencia:100));return Number(v)||0;}
  function avgOf(s){return s.avg!=null&&s.avg!==''?Number(s.avg):null;}
  function riskOf(s){if(s.risk)return s.risk;var avg=avgOf(s),att=asisOf(s);return (avg!=null&&avg<7)||att<75?'high':(avg!=null&&avg<8)||att<88?'mid':'low';}
  function groupOf(s){return String(s.grade||s.group||'').trim();}
  function nivelOf(s){return s.nivel||inferNivel(groupOf(s));}
  function normalizeStudent(s){return Object.assign({},s,{sid:s._id||s.sid||'',name:s.name||'Alumno sin nombre',group:groupOf(s),grade:groupOf(s),nivel:nivelOf(s),avg:avgOf(s),att:asisOf(s),asis:asisOf(s),risk:riskOf(s),manual:true});}
  function isSeedClass(c){return /^cls-\d+$/i.test(String(c&&c._id||''));}
  function classGroup(c){return String((c&&(c.g||c.grade||c.group))||'').trim();}
  function classNivel(c){return String((c&&c.nivel)||inferNivel(classGroup(c))).trim();}
  function realClasses(){
    var all=(window.DB&&Array.isArray(DB.clases))?DB.clases:[];
    var real=all.filter(function(c){return classGroup(c)&&!isSeedClass(c);});
    return real;
  }
  function realGroups(){return realClasses().map(classGroup).filter(Boolean).filter(function(g,i,a){return a.indexOf(g)===i;});}
  function sanitizeGroups(groups){var allowed=realGroups();return (groups||[]).filter(function(g){return allowed.indexOf(g)!==-1;}).filter(function(g,i,a){return a.indexOf(g)===i;});}
  function groupsForAtlas(nivel,grado){return realClasses().filter(function(c){var g=classGroup(c);return (!nivel||classNivel(c)===nivel)&&(!grado||g.indexOf(grado)===0);});}

  window.piagetRealStudents=function(){return realStudents().map(normalizeStudent);};
  window.piagetRealClasses=function(){return realClasses();};
  window.piagetRealGroups=function(){return realGroups();};
  window.piagetSanitizeGroups=function(groups){return sanitizeGroups(groups);};

  window.alumnosDeClase=function(clase){
    if(!clase)return[];var g=String(clase.g||clase.grade||clase.group||'').trim();var n=String(clase.nivel||'').trim();
    return window.piagetRealStudents().filter(function(s){return s.grade===g&&(!n||!s.nivel||s.nivel===n);}).map(function(s){return {sid:s.sid,name:s.name,avg:s.avg,asis:s.att,manual:true,raw:s};});
  };
  window.acaBuildRoster=function(){return window.piagetRealStudents();};
  window.ctaStudents=function(){return window.piagetRealStudents().map(function(s){return {sid:s.sid,name:s.name,group:s.grade,nivel:s.nivel,manual:true};});};

  function patchDocScope(){
    try{
      if(window.__realGroupsDocScopePatched)return;
      var prev=window.docScope;
      window.docScope=function(){
        var base=prev?prev.apply(this,arguments):null;
        var groups=realGroups();
        if(!base)return groups.length?{groups:groups}:null;
        return Object.assign({},base,{groups:groups});
      };
      window.docAllowsGroup=function(g){return realGroups().indexOf(String(g||'').trim())!==-1;};
      window.__realGroupsDocScopePatched=true;
    }catch(e){}
  }
  function patchAtlas(){
    try{
      window.atlasGroups=function(nivel,grado,subjId){
        var cohortLag=window.atlasLag?window.atlasLag(nivel,grado,subjId):0;
        return groupsForAtlas(nivel,grado).map(function(c){
          var h=window.atlasHash?window.atlasHash(String(c._id||c.g||'')+String(subjId||'')):0;
          var jitter=window.PIAGET_FRESH?0:((h%21)-8)/10;
          var lag=Math.round((cohortLag+jitter)*10)/10;
          return Object.assign({},c,{lag:lag});
        });
      };
    }catch(e){}
  }
  function sanitizePrefill(pf){
    if(!pf||typeof pf!=='object')return pf;
    var out=Object.assign({},pf);
    var groups=sanitizeGroups(out.groups||[]);
    if(!groups.length&&out.atlas){
      groups=groupsForAtlas(out.atlas.nivel,out.atlas.grado).map(classGroup);
    }
    out.groups=sanitizeGroups(groups);
    return out;
  }
  function patchMissionPrefill(){
    try{
      if(window.__missionPrefillSanitized)return;
      var current=sanitizePrefill(window.MISSION_PREFILL);
      Object.defineProperty(window,'MISSION_PREFILL',{configurable:true,get:function(){return current;},set:function(v){current=sanitizePrefill(v);}});
      window.__missionPrefillSanitized=true;
    }catch(e){try{window.MISSION_PREFILL=sanitizePrefill(window.MISSION_PREFILL);}catch(_){} }
  }

  var oldStore=null;
  function patchStore(){
    if(!window.Store||window.Store===oldStore||window.Store.__realStudentsPatch)return;
    oldStore=window.Store;
    var add=Store.add.bind(Store);
    Store.add=function(coll,item){
      if(coll==='clases'){
        item=Object.assign({},item,{alumnos:0,asistencia:0,avg:null});
      }
      if(coll==='missions'){
        var clean=sanitizeGroups(item&&item.groups||[]);
        item=Object.assign({},item,{groups:clean,players:clean.length?item.players:0});
        if(clean.length===0&&window.toast)toast('No hay grupos reales seleccionados. Crea primero el grupo en Clases.', 'warn');
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
  function tick(){patchDocScope();patchAtlas();patchMissionPrefill();patchStore();refreshCounts();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){tick();setInterval(tick,700);});else{tick();setInterval(tick,700);}
})();
