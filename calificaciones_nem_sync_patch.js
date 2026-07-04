/* calificaciones_nem_sync_patch.js — sincroniza libro de evaluación NEM en el estado central */
(function(){
  var LOCAL_KEYS=['piaget_califs_real_v2','piaget_califs_fresh_real_v2'];
  function settings(){
    window.DB=window.DB||{};
    DB.settings=DB.settings||{};
    return DB.settings;
  }
  function localBook(){
    for(var i=0;i<LOCAL_KEYS.length;i++){
      try{var v=JSON.parse(localStorage.getItem(LOCAL_KEYS[i])||'null');if(v&&typeof v==='object'&&!Array.isArray(v))return v;}catch(e){}
    }
    return {};
  }
  function book(){
    var s=settings();
    if(!s.nemGradebook||typeof s.nemGradebook!=='object'||Array.isArray(s.nemGradebook))s.nemGradebook={};
    if(!Object.keys(s.nemGradebook).length){
      var old=localBook();
      if(Object.keys(old).length){s.nemGradebook=old;try{window.Store&&Store.saveState&&Store.saveState();}catch(e){}}
    }
    return s.nemGradebook;
  }
  function save(v){
    var s=settings();
    s.nemGradebook=(v&&typeof v==='object')?v:{};
    try{localStorage.setItem('piaget_califs_real_v2',JSON.stringify(s.nemGradebook));}catch(e){}
    try{window.Store&&Store.saveState&&Store.saveState();}catch(e){}
    return s.nemGradebook;
  }
  function observations(){
    var s=settings();
    if(!s.nemReportObservations||typeof s.nemReportObservations!=='object'||Array.isArray(s.nemReportObservations))s.nemReportObservations={};
    return s.nemReportObservations;
  }
  window.nemGradebook=book;
  window.nemSaveGradebook=save;
  window.nemReportObservations=observations;
  try{window.calLoadEdits=function(){return Object.assign({},book());};}catch(e){}
  try{window.calSaveEdits=function(v){save(v);};}catch(e){}
  book();observations();
})();