/* cobros_movement_delete_patch.js — agrega eliminación real en Pagos recibidos */
(function(){
  function norm(v){return String(v||'').trim();}
  function findMovement(receipt){return ((window.DB&&DB.cobros)||[]).find(function(c){return norm(c&&c.recibo)===norm(receipt);});}
  function enhance(){
    try{
      var cards=Array.prototype.slice.call(document.querySelectorAll('.card'));
      var card=cards.find(function(el){return /Pagos recibidos/i.test(el.textContent||'');});
      if(!card)return;
      var rows=card.querySelectorAll('table.tbl tbody tr');
      rows.forEach(function(row){
        var cells=row.querySelectorAll('td');
        if(cells.length<9)return;
        var actionCell=cells[cells.length-1];
        if(actionCell.querySelector('[data-delete-cobro]'))return;
        var receipt=norm(cells[0].textContent);
        var mov=findMovement(receipt);
        if(!mov||!mov._id)return;
        var btn=document.createElement('button');
        btn.type='button';
        btn.className='btn sm';
        btn.setAttribute('data-delete-cobro',mov._id);
        btn.style.marginLeft='6px';
        btn.style.color='var(--red)';
        btn.textContent='Eliminar';
        btn.onclick=function(ev){
          ev.preventDefault();ev.stopPropagation();
          var who=mov.student||mov.family||'el alumno';
          var amount=Number(mov.amount)||0;
          var label=mov.recibo||'sin recibo';
          if(!confirm('¿Eliminar definitivamente el movimiento '+label+' por $'+amount.toLocaleString('es-MX')+' de '+who+'?\n\nEl saldo del estudiante se recalculará automáticamente.'))return;
          Store.remove('cobros',mov._id);
          try{Store.saveState&&Store.saveState();}catch(e){}
          try{Store.log&&Store.log('Tesorería','eliminó movimiento '+label+' · '+who,'trash');}catch(e){}
          try{toast('Movimiento eliminado · '+label,'warn');}catch(e){}
        };
        actionCell.appendChild(btn);
      });
    }catch(e){}
  }
  enhance();
  var obs=new MutationObserver(enhance);
  obs.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(enhance,1000);
})();