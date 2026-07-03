/* no_demo_classes_boot.js — evita que grupos demo entren al Store y carga parches globales tempranos */
(function(){
  function isSeed(c){ return /^cls-\d+$/i.test(String((c&&c._id)||'')); }
  function clean(obj){
    if(!obj) return;
    if(Array.isArray(obj.clases)) obj.clases = obj.clases.filter(function(c){ return !isSeed(c); });
  }
  try{
    window.CLASES_SEED = [];
    clean(window.DB);
    clean(window.DB_DEFAULTS);
  }catch(e){}
  try{
    document.write('<script src="home_school_calendar_patch.js?v=20260701-role-home-calendar"><\/script>');
    document.write('<script src="student_module_repair_boot.js?v=20260702-students-repair"><\/script>');
  }catch(e){}
})();