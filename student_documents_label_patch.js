/* student_documents_label_patch.js — documentos oficiales y credencial estudiante formato Canva */
(function(){
  var OLD_LABEL = 'Acta de Nacimiento del Tutor';
  var NEW_LABEL = 'Reporte de Evaluación Anterior del Estudiante';
  var OLD_KEY = 'actaNacimientoTutor';
  var NEW_KEY = 'reporteEvaluacionAnteriorEstudiante';

  function esc(v){ return String(v || '—').replace(/[<>&"]/g, function(s){ return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[s]; }); }
  function clean(v){ return String(v || '').trim().replace(/\s+/g,' '); }
  function initials(name){ return clean(name || 'E').split(' ').map(function(x){return x[0];}).slice(0,2).join('').toUpperCase(); }
  function folio(stu){ return String((stu && (stu.matricula || stu._id)) || '000000').replace(/\D/g,'').slice(-5).padStart(5,'0'); }
  function cycle(){ return 'Ciclo 2025–2026'; }
  function qrSvg(payload){
    try{
      if(!window.qrcode) return '<div class="qr-fallback">QR</div>';
      var q = window.qrcode(0, 'M');
      q.addData(JSON.stringify(payload));
      q.make();
      return q.createSvgTag(4, 0);
    }catch(e){ return '<div class="qr-fallback">QR</div>'; }
  }

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
    try{ if(window.DB && Array.isArray(DB.students)) DB.students = DB.students.map(migrateStudent); }catch(e){}
  }
  function patchStore(){
    try{
      if(!window.Store || Store.__studentDocsReportPatch) return;
      var oldAdd = Store.add;
      var oldUpdate = Store.update;
      Store.add = function(col, item){ if(col === 'students') item = migrateStudent(item); return oldAdd ? oldAdd.call(Store, col, item) : null; };
      Store.update = function(col, id, patch){ if(col === 'students') patch = migrateStudent(patch); return oldUpdate ? oldUpdate.call(Store, col, id, patch) : null; };
      Store.__studentDocsReportPatch = true;
    }catch(e){}
  }
  function replaceLabels(){
    try{
      document.querySelectorAll('div,span,label,b,strong').forEach(function(el){
        if(el && el.childNodes && el.childNodes.length === 1 && String(el.textContent || '').trim() === OLD_LABEL){ el.textContent = NEW_LABEL; }
      });
    }catch(e){}
  }

  function studentPayload(stu){
    return { type:'student', id: stu._id || '', matricula: stu.matricula || '', name: stu.name || '', email: stu.email || '', role:'Estudiante', nivel: stu.nivel || '', grade: stu.grade || stu.group || '', institution:'COLEGIO JEAN PIAGET', v:7 };
  }
  function exactStudentCredential(stu){
    stu = stu || {};
    var payload = studentPayload(stu);
    var q = qrSvg(payload);
    var f = folio(stu);
    var photo = stu.photo ? '<img src="'+stu.photo+'" alt="Foto">' : '<span>FOTO 3×4</span>';
    var name = esc(stu.name || 'Nombre del Estudiante');
    var nivel = esc(stu.nivel || 'Nivel');
    var grupo = esc(stu.grade || stu.group || 'Grupo');
    var mat = esc(stu.matricula || '000000');
    var email = esc(stu.email || 'correo@jeanpiaget.mx');
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>Credencial Estudiante</title><style>'+ 
      '*{box-sizing:border-box}body{margin:0;background:#0b1a57;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Arial,Helvetica,sans-serif;color:#16213c}.sheet{display:flex;gap:80px;align-items:flex-start;padding:34px}.wrap{width:324px}.label{font:600 12px Arial,sans-serif;letter-spacing:.04em;color:#d7def5;margin-bottom:10px}.cred{position:relative;width:324px;height:514px;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e2e7f3;box-shadow:0 14px 34px rgba(11,26,87,.16);display:flex;flex-direction:column}.header{position:relative;height:104px;background:linear-gradient(135deg,#0b1a57 0%,#13247a 100%);padding:16px 18px;display:flex;align-items:center;gap:13px}.logo{width:50px;height:50px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex:none;box-shadow:0 2px 8px rgba(0,0,0,.2)}.logo-in{width:34px;height:34px;border-radius:50%;background:#0e27e6;color:#fff;display:flex;align-items:center;justify-content:center;font:800 24px Arial,sans-serif}.colegio{font:600 10px Arial,sans-serif;letter-spacing:.22em;color:#9fb0ff}.brand{font:800 21px/1.02 Arial,sans-serif;letter-spacing:.01em;color:#fff;margin-top:3px}.tag{font:500 9px Arial,sans-serif;letter-spacing:.14em;color:#c7d0f5;margin-top:5px}.folio{position:absolute;top:13px;right:16px;font:500 9px monospace;letter-spacing:.05em;color:#aebbf0}.role{display:flex;align-items:center;gap:10px;padding:9px 18px;background:#eef1fb;border-bottom:1px solid #e0e6f5}.dot{width:7px;height:7px;border-radius:50%;background:#0e27e6;flex:none}.role-main{font:700 12px Arial,sans-serif;letter-spacing:.20em;color:#0e27e6}.role-sub{margin-left:auto;font:600 9px Arial,sans-serif;letter-spacing:.10em;text-transform:uppercase;color:#8a93a8}.body{flex:1;padding:20px 22px 0;display:flex;flex-direction:column;align-items:center}.photo{width:128px;height:160px;border-radius:10px;border:1px solid #d7deef;background-image:repeating-linear-gradient(135deg,#eef1f9 0 9px,#e4e9f6 9px 18px);display:flex;align-items:center;justify-content:center;flex:none;overflow:hidden}.photo img{width:100%;height:100%;object-fit:cover}.photo span{font:500 10px monospace;letter-spacing:.12em;color:#9aa6c4}.name{font:700 18px/1.15 Arial,sans-serif;color:#16213c;text-align:center;margin-top:16px;text-wrap:balance}.position{font:600 12.5px Arial,sans-serif;color:#0e27e6;text-align:center;margin-top:5px}.line{width:100%;height:1px;background:#e8ecf6;margin:16px 0 12px}.fields{width:100%;display:flex;flex-direction:column;gap:11px}.field{display:flex;flex-direction:column;gap:3px}.field-label{font:600 9px/1 Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:#9aa3b8}.field-value{font:600 12.5px/1.25 Arial,sans-serif;color:#16213c}.mono{font-family:monospace;font-weight:500;letter-spacing:.04em}.footer{display:flex;align-items:center;justify-content:space-between;padding:11px 18px;border-top:1px solid #eef1f8}.web{font:600 10px Arial,sans-serif;letter-spacing:.04em;color:#6c7790}.cyc{font:600 9px Arial,sans-serif;letter-spacing:.10em;text-transform:uppercase;color:#9aa3b8}.bar{height:6px;background:linear-gradient(90deg,#0e27e6,#13247a)}.thin{height:54px;background:linear-gradient(135deg,#0b1a57 0%,#13247a 100%);display:flex;align-items:center;gap:9px;padding:0 18px}.thin .logo{width:30px;height:30px;box-shadow:none}.thin .logo-in{width:20px;height:20px;font-size:15px}.thin-title{font:700 13px Arial,sans-serif;letter-spacing:.06em;color:#fff}.back-body{flex:1;padding:18px 22px;display:flex;flex-direction:column;align-items:center}.qr{width:124px;height:124px;padding:8px;border:1px solid #d7deef;border-radius:10px;background:#fff;flex:none;display:flex;align-items:center;justify-content:center}.qr svg{width:108px;height:108px}.qr-fallback{font:700 18px monospace;color:#0e27e6}.verify{font:500 9.5px Arial,sans-serif;letter-spacing:.10em;text-transform:uppercase;color:#8a93a8;margin-top:9px}.sign{height:30px;border-bottom:1.5px solid #c3cbe0}.legal{font:400 8.8px/1.45 Arial,sans-serif;color:#8a93a8;text-align:justify;margin:16px 0 0}.actions{position:fixed;right:22px;bottom:22px;display:flex;gap:8px}.btn{border:0;border-radius:10px;padding:11px 14px;font:700 13px Arial,sans-serif;cursor:pointer;background:#fff;color:#0b1a57}.btn.primary{background:#0e27e6;color:#fff}@media print{@page{size:A4 landscape;margin:10mm}body{background:#fff;display:block}.sheet{padding:0;gap:22mm;align-items:flex-start}.label,.actions{display:none}.cred{box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact;break-inside:avoid;page-break-inside:avoid}}'+
      '</style></head><body><div class="sheet"><div class="wrap"><div class="label">FRENTE · Estudiante</div><div class="cred"><div class="header"><div class="logo"><div class="logo-in">P</div></div><div><div class="colegio">COLEGIO</div><div class="brand">JEAN PIAGET</div><div class="tag">EDUCACIÓN INTEGRAL</div></div><div class="folio">FOLIO '+f+'</div></div><div class="role"><span class="dot"></span><span class="role-main">ESTUDIANTE</span><span class="role-sub">Alumno</span></div><div class="body"><div class="photo">'+photo+'</div><div class="name">'+name+'</div><div class="position">Estudiante</div><div class="line"></div><div class="fields"><div class="field"><span class="field-label">Nivel / Grupo</span><span class="field-value">'+nivel+' · '+grupo+'</span></div><div class="field"><span class="field-label">Matrícula</span><span class="field-value mono">'+mat+'</span></div><div class="field"><span class="field-label">Correo institucional</span><span class="field-value">'+email+'</span></div></div></div><div class="footer"><span class="web">soypiaget.app</span><span class="cyc">'+cycle()+'</span></div><div class="bar"></div></div></div><div class="wrap"><div class="label">REVERSO</div><div class="cred"><div class="thin"><div class="logo"><div class="logo-in">P</div></div><span class="thin-title">COLEGIO JEAN PIAGET</span></div><div class="back-body"><div class="qr">'+q+'</div><span class="verify">Verificación de identidad</span><div class="line" style="margin:15px 0"></div><div class="fields"><div class="field"><span class="field-label">Vigencia</span><span class="field-value">Ciclo escolar 2025–2026 · vence 31 ago 2026</span></div><div class="field"><span class="field-label">Firma del titular</span><div class="sign"></div></div></div><p class="legal">Esta credencial es personal e intransferible y propiedad del Colegio Jean Piaget. En caso de extravío, repórtela de inmediato a la Dirección Administrativa. Su uso indebido amerita sanción conforme al reglamento institucional.</p></div><div class="footer"><span class="web">soypiaget.app</span><span class="mono" style="font-size:9px;color:#9aa3b8">FOLIO '+f+'</span></div><div class="bar"></div></div></div></div><div class="actions"><button class="btn" onclick="window.close()">Cerrar</button><button class="btn primary" onclick="window.print()">Imprimir</button></div></body></html>';
    var w = window.open('', '_blank');
    if(!w){ try{ toast('Permite ventanas emergentes para imprimir la credencial','warn'); }catch(e){} return; }
    w.document.open(); w.document.write(html); w.document.close();
  }
  function bridgeCredential(){ window.jpPrintCredential = exactStudentCredential; window.estPrintCredential = exactStudentCredential; window.__jpStudentCredentialFinal = true; }
  function tick(){ migrateDb(); patchStore(); replaceLabels(); bridgeCredential(); }
  window.piagetMigrateStudentOfficialDocuments = function(){ migrateDb(); try{ if(window.Store && Store.saveState) Store.saveState(); }catch(e){} };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick); else tick();
  var n = 0;
  var t = setInterval(function(){ tick(); n++; if(n > 120) clearInterval(t); }, 250);
})();