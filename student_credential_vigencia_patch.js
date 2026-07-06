/* student_credential_vigencia_patch.js — deja solo el texto Vigencia */
(function(){
  function wire(){
    var base=window.jpPrintCredential||window.estPrintCredential;
    if(typeof base!=='function'||base.__vigenciaOnly)return;
    function wrapped(stu){
      var oldOpen=window.open;
      window.open=function(){
        var w=oldOpen.apply(window,arguments);
        try{
          if(w&&w.document&&typeof w.document.write==='function'){
            var write=w.document.write.bind(w.document);
            w.document.write=function(html){
              html=String(html).replace('<div class="fl">Vigencia</div><div class="fv">Ciclo escolar 2025–2026 · vence 31 ago 2026</div>','<div class="fl">Vigencia</div>');
              return write(html);
            };
          }
        }catch(e){}
        return w;
      };
      try{return base(stu);}finally{window.open=oldOpen;}
    }
    wrapped.__vigenciaOnly=true;
    window.jpPrintCredential=wrapped;
    window.estPrintCredential=wrapped;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  var n=0,t=setInterval(function(){wire();n++;if(n>160)clearInterval(t);},250);
})();