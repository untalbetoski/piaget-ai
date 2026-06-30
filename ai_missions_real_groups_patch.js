/* ai_missions_real_groups_patch.js — AI Missions solo con grupos reales */
(function(){
  if(!window.React || window.__aiMissionRealGroupsPatch) return;
  window.__aiMissionRealGroupsPatch = true;
  var h0 = React.createElement;
  var XP = { 'Básica':150, 'Media':300, 'Avanzada':450 };
  var BANK = {
    'Español': [{ title:'Misión de lectura', desc:'Reto de comprensión y producción escrita.', steps:['Leer el texto base','Responder preguntas clave','Redactar conclusión'] }],
    'Matemáticas': [{ title:'Reto matemático', desc:'Resolver problemas aplicados al tema seleccionado.', steps:['Resolver ejercicios guiados','Explicar procedimiento','Aplicar en un problema final'] }],
    'Ciencias': [{ title:'Exploración científica', desc:'Analizar un fenómeno y registrar conclusiones.', steps:['Observar el fenómeno','Plantear hipótesis','Registrar resultados'] }],
    'Inglés': [{ title:'English Challenge', desc:'Practicar vocabulario y comunicación oral/escrita.', steps:['Leer instrucciones','Responder en inglés','Presentar evidencia'] }],
    'Historia': [{ title:'Reto histórico', desc:'Investigar, ordenar y explicar hechos relevantes.', steps:['Investigar contexto','Ordenar eventos','Explicar consecuencias'] }],
    'Ed. Física': [{ title:'Reto activo', desc:'Cumplir una secuencia motriz con registro de avance.', steps:['Calentamiento','Circuito principal','Autoevaluación'] }]
  };
  function inferNivel(g){g=String(g||'');return /sec/i.test(g)?'Secundaria':/^\s*k/i.test(g)?'Preescolar':'Primaria';}
  function isSeedClass(c){return /^cls-\d+$/i.test(String(c&&c._id||''));}
  function classGroup(c){return String((c&&(c.g||c.grade||c.group))||'').trim();}
  function realGroups(){
    if(window.piagetRealGroups){try{return window.piagetRealGroups();}catch(e){}}
    var clases=(window.DB&&Array.isArray(DB.clases))?DB.clases:[];
    return clases.filter(function(c){return classGroup(c)&&!isSeedClass(c);}).map(classGroup).filter(function(g,i,a){return a.indexOf(g)===i;});
  }
  function cleanGroups(gs){var allowed=realGroups();return (gs||[]).map(function(g){return String(g||'').trim();}).filter(function(g){return allowed.indexOf(g)!==-1;}).filter(function(g,i,a){return a.indexOf(g)===i;});}
  function subjects(){
    var s=(window.DB&&Array.isArray(DB.subjects))?DB.subjects.map(function(x){return x.name||x;}).filter(Boolean):[];
    return s.length?s:['Español','Matemáticas','Ciencias','Inglés','Historia','Ed. Física'];
  }
  function visOf(subject){
    if(typeof missionVis==='function'){try{return missionVis(subject);}catch(e){}}
    var map={'Español':{tone:'violet',icon:'bookOpen'},'Matemáticas':{tone:'blue',icon:'hash'},'Ciencias':{tone:'green',icon:'compass'},'Inglés':{tone:'amber',icon:'globe'},'Historia':{tone:'red',icon:'flag'},'Ed. Física':{tone:'cyan',icon:'zap'}};
    return map[subject]||{tone:'cyan',icon:'star'};
  }
  function uid(){
    if(typeof missionUid==='function'){try{return missionUid();}catch(e){}}
    return (crypto.randomUUID?crypto.randomUUID():'mis-'+Math.random().toString(36).slice(2));
  }
  function fallbackGen(subject,diff,topic){
    var bank=(typeof MISSION_AI_BANK!=='undefined'&&MISSION_AI_BANK[subject])?MISSION_AI_BANK[subject]:(BANK[subject]||BANK['Matemáticas']);
    var base=bank[Math.floor(Math.random()*bank.length)]||BANK['Matemáticas'][0];
    var steps=base.steps||[];
    return Promise.resolve({title:base.title,desc:base.desc,intro:topic?('Esta misión trabaja sobre: '+topic+'. Resuelve cada actividad con evidencia clara.'):base.desc,tasks:steps.map(function(s){return {q:s,type:'open',options:[],answer:null,hint:''};}),steps:steps,ia:false});
  }
  function generateAI(subject,nivel,diff,topic){
    if(typeof missionGenAI==='function'){try{return missionGenAI(subject,nivel,diff,topic);}catch(e){}}
    return fallbackGen(subject,diff,topic);
  }
  function useTone(vis){return (window.TONE&&window.TONE[vis.tone])?window.TONE[vis.tone]:{bg:'var(--accent-soft)',c:'var(--accent)'};}
  function RealMissionWizard(props){
    var open=props.open,onClose=props.onClose;
    var allGroups=realGroups();
    var subjList=subjects();
    var stStep=React.useState('form'), step=stStep[0], setStep=stStep[1];
    var stSubject=React.useState(subjList[0]||'Matemáticas'), subject=stSubject[0], setSubject=stSubject[1];
    var stGroups=React.useState(allGroups[0]?[allGroups[0]]:[]), groups=stGroups[0], setGroups=stGroups[1];
    var stDiff=React.useState('Media'), diff=stDiff[0], setDiff=stDiff[1];
    var stTopic=React.useState(''), topic=stTopic[0], setTopic=stTopic[1];
    var stProp=React.useState(null), prop=stProp[0], setProp=stProp[1];
    var stAtlas=React.useState(null), fromAtlas=stAtlas[0], setFromAtlas=stAtlas[1];
    var stMeta=React.useState(null), atlasMeta=stMeta[0], setAtlasMeta=stMeta[1];
    var genSeq=React.useRef(0);
    React.useEffect(function(){
      if(!open)return;
      var groupsNow=realGroups();
      var pf=window.MISSION_PREFILL;
      var nextGroups=[];
      if(pf&&pf.groups) nextGroups=cleanGroups(pf.groups);
      if(!nextGroups.length&&groupsNow.length) nextGroups=[groupsNow[0]];
      if(pf&&pf.subject) setSubject(pf.subject); else if(subjList[0]) setSubject(subjList[0]);
      setGroups(nextGroups); setTopic((pf&&pf.topic)||''); setFromAtlas((pf&&pf.origin)||null); setAtlasMeta((pf&&pf.atlas)||null);
      window.MISSION_PREFILL=null; setStep('form'); setProp(null);
    },[open]);
    var cleanSelected=cleanGroups(groups);
    if(cleanSelected.length!==groups.length) setTimeout(function(){setGroups(cleanSelected);},0);
    var vis=visOf(subject), t=useTone(vis), proposal=prop;
    var toggle=function(g){setGroups(function(gs){return gs.indexOf(g)!==-1?gs.filter(function(x){return x!==g;}):cleanGroups(gs.concat([g]));});};
    var generate=function(){
      var selected=cleanGroups(groups);
      if(!selected.length){if(window.toast)toast('Crea primero grupos reales en Clases para asignar una misión.','warn');return;}
      setGroups(selected); setStep('thinking'); setProp(null); var seq=++genSeq.current;
      Promise.all([generateAI(subject,inferNivel(selected[0]),diff,topic.trim()),new Promise(function(r){setTimeout(r,1300);})]).then(function(arr){if(seq===genSeq.current){setProp(arr[0]);setStep('proposal');}});
    };
    var save=function(status){
      var selected=cleanGroups(groups);
      if(!selected.length){if(window.toast)toast('No hay grupos reales seleccionados. Crea primero el grupo en Clases.','warn');return;}
      var p=proposal||{title:'Misión',desc:'Misión de aprendizaje',steps:[],tasks:[]};
      Store.add('missions',{_id:uid(),title:p.title,subject:subject,xp:XP[diff]||300,dueDays:status==='activa'?7:null,progress:0,players:0,tone:vis.tone,icon:vis.icon,status:status,groups:selected.sort(),difficulty:diff,desc:p.desc,intro:p.intro||'',tasks:p.tasks||[],steps:p.steps||[],isNew:true,atlas:atlasMeta||undefined});
      Store.log('Copilot',(status==='activa'?'publicó la misión "':'guardó el borrador "')+p.title+'"','rocket');
      if(window.toast)toast(status==='activa'?'Misión publicada para '+selected.join(', '):'Borrador guardado','ok');
      onClose&&onClose();
    };
    var footer=step==='form'?h0(React.Fragment,null,
      h0('button',{className:'btn',onClick:onClose},'Cancelar'),
      h0('button',{className:'btn primary',disabled:cleanGroups(groups).length===0,style:cleanGroups(groups).length===0?{opacity:.5,pointerEvents:'none'}:{},onClick:generate},h0(Icon,{name:'spark',size:15,className:'btn-ico',fill:'currentColor'}),'Generar con IA')
    ):step==='proposal'?h0(React.Fragment,null,
      h0('button',{className:'btn',onClick:generate},h0(Icon,{name:'refresh',size:15,className:'btn-ico'}),'Regenerar'),
      h0('button',{className:'btn',onClick:function(){save('borrador');}},'Guardar borrador'),
      h0('button',{className:'btn primary',onClick:function(){save('activa');}},h0(Icon,{name:'send',size:15,className:'btn-ico'}),'Publicar misión')
    ):null;
    return h0(Modal,{open:open,title:'Generar misión con IA',onClose:onClose,width:560,footer:footer},
      step==='form'&&h0(React.Fragment,null,
        fromAtlas&&h0('div',{className:'row center gap-8',style:{background:'var(--accent-soft)',border:'1px solid color-mix(in oklch, var(--accent), var(--border) 55%)',borderRadius:10,padding:'9px 12px',fontSize:12.5,color:'var(--accent-strong)',fontWeight:600}},h0(Icon,{name:'map',size:14}),'Contexto de Atlas: ',fromAtlas),
        h0('div',{className:'grid',style:{gridTemplateColumns:'1fr 1fr',gap:14}},
          h0(Field,{label:'Materia'},h0(SelectInput,{value:subject,onChange:function(e){setSubject(e.target.value);},options:subjList})),
          h0(Field,{label:'Dificultad'},h0('div',{className:'seg',style:{height:40,alignItems:'center'}},['Básica','Media','Avanzada'].map(function(d){return h0('button',{key:d,className:diff===d?'active':'',onClick:function(){setDiff(d);}},d);})) )
        ),
        h0(Field,{label:'Grupos ('+cleanGroups(groups).length+' seleccionados)'},
          allGroups.length?h0('div',{className:'row',style:{flexWrap:'wrap',gap:7}},allGroups.map(function(g){return h0('button',{key:g,className:'chip-btn'+(groups.indexOf(g)!==-1?'':' plain'),onClick:function(){toggle(g);}},g);})):h0('div',{className:'faint',style:{fontSize:12.5,padding:'12px 0'}},'No hay grupos reales disponibles. Crea primero los grupos en el módulo Clases.')
        ),
        h0(Field,{label:'Tema u objetivo (opcional)'},h0(TextArea,{rows:2,placeholder:'Ej. reforzar fracciones equivalentes antes del examen…',value:topic,onChange:function(e){setTopic(e.target.value);},style:{height:'auto',padding:'10px 13px',resize:'none'}})),
        h0('div',{className:'row center gap-8 faint',style:{fontSize:12.5}},h0(Icon,{name:'spark',size:14,fill:'currentColor',style:{color:'var(--accent)'}}),'La IA usará únicamente grupos reales creados en Clases.')
      ),
      step==='thinking'&&h0('div',{className:'col center gap-12',style:{padding:'28px 0',textAlign:'center'}},h0('div',{className:'kpi-ico',style:{background:t.bg,color:t.c,marginBottom:0}},h0(Icon,{name:'spark',size:20,fill:'currentColor'})),h0('div',{style:{fontWeight:600,fontSize:14.5}},'Diseñando la misión…'),h0('div',{className:'faint',style:{fontSize:12.5}},'Analizando el avance de '+cleanGroups(groups).join(', ')+' en '+subject),h0('div',{className:'typing',style:{marginTop:4}},h0('span'),h0('span'),h0('span'))),
      step==='proposal'&&proposal&&h0(React.Fragment,null,
        h0('div',{className:'row center gap-8 faint',style:{fontSize:12}},h0(Icon,{name:'spark',size:13,fill:'currentColor',style:{color:'var(--accent)'}}),'Propuesta para '+cleanGroups(groups).join(', ')+' · calibrada con grupos reales'),
        h0('div',{className:'card pad',style:{display:'flex',flexDirection:'column',gap:12}},
          h0('div',{className:'row between center'},h0('div',{className:'kpi-ico',style:{background:t.bg,color:t.c,marginBottom:0}},h0(Icon,{name:vis.icon,size:20})),h0('div',{className:'row center gap-6'},h0(Badge,{tone:'gray'},diff),h0(Badge,{tone:'amber'},h0(Icon,{name:'zap',size:12,fill:'currentColor'}),XP[diff]||300,' XP'))),
          h0('div',null,h0('div',{style:{fontWeight:600,fontSize:16}},proposal.title),h0('div',{className:'faint',style:{fontSize:13,marginTop:4,lineHeight:1.55}},proposal.desc)),
          proposal.intro&&h0('div',{style:{fontSize:12.5,lineHeight:1.55,color:'var(--text-muted)',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px'}},proposal.intro),
          h0('div',{className:'col gap-7',style:{paddingTop:12,borderTop:'1px solid var(--border)'}},h0('div',{className:'eyebrow',style:{marginBottom:2}},(proposal.tasks&&proposal.tasks.length)?proposal.tasks.length+' actividades a resolver':'Pasos'),((proposal.tasks&&proposal.tasks.length)?proposal.tasks.map(function(x){return x.q;}):(proposal.steps||[])).map(function(s,i){return h0('div',{key:i,className:'row gap-9',style:{fontSize:13,alignItems:'flex-start'}},h0('span',{style:{width:20,height:20,borderRadius:999,background:'var(--surface-2)',border:'1px solid var(--border)',display:'grid',placeItems:'center',fontSize:11,fontWeight:700,color:'var(--text-muted)',flexShrink:0,marginTop:1}},i+1),h0('span',null,s));})),
          h0('div',{className:'row center gap-6 faint',style:{fontSize:12}},h0(Icon,{name:proposal.ia?'spark':'calendar',size:13,fill:proposal.ia?'currentColor':'none'}),proposal.ia?'Contenido generado con IA · resoluble por el alumno':'Duración sugerida: 7 días')
        )
      )
    );
  }
  var originalCreate = React.createElement;
  if(!React.__aiMissionRealGroupsCreatePatched){
    React.createElement = function(type, props){
      if(typeof type==='function' && type.name==='MissionWizard'){
        var args=Array.prototype.slice.call(arguments); args[0]=RealMissionWizard; return originalCreate.apply(this,args);
      }
      return originalCreate.apply(this,arguments);
    };
    React.__aiMissionRealGroupsCreatePatched=true;
  }
  window.MissionWizard = RealMissionWizard;
})();
