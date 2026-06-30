/* no_demo_classes_boot.js — evita que grupos demo entren al Store */
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
})();
