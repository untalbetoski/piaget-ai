/* student_access_dashboard_real.jsx — cuentas de acceso reales + dashboard alumno real-only */

(function(){
  const SA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const saNorm = v => String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const saClean = v => String(v || '').trim().replace(/\s+/g,' ');
  function saGenPass(){ let s=''; for(let i=0;i<10;i++) s+=SA_CHARS[Math.floor(Math.random()*SA_CHARS.length)]; return 'Pgt-'+s; }
  function saDB(){ window.DB=window.DB||{}; DB.settings=DB.settings||{}; DB.students=Array.isArray(DB.students)?DB.students:[]; DB.settings.studentAccounts=Array.isArray(DB.settings.studentAccounts)?DB.settings.studentAccounts:[]; return DB; }
  function saRealStudents(){ return saDB().students.filter(s=>s&&s._id&&s.real!==false&&!s.demo&&!s.sample&&!s.seed&&saClean(s.name||s.nombre)).map(s=>({...s,name:saClean(s.name||s.nombre),grade:saClean(s.grade||s.group||s.grupo),nivel:s.nivel||s.level||'Primaria'})); }
  function saUsername(stu){ if(stu.email) return String(stu.email).toLowerCase(); try{ if(window.estGeneratedEmail) return estGeneratedEmail(stu.name,stu._id); }catch(_){} return 'alumno.'+String(stu.matricula||stu._id).replace(/[^a-z0-9]/gi,'').toLowerCase()+'@jeanpiaget.mx'; }
  function saAccountsRaw(){ return saDB().settings.studentAccounts; }
  function saSyncAccounts(){
    const db=saDB(), studs=saRealStudents(), ids=new Set(studs.map(s=>String(s._id)));
    let list=saAccountsRaw().filter(a=>a&&ids.has(String(a.studentId||'')));
    studs.forEach(stu=>{
      let a=list.find(x=>String(x.studentId||'')===String(stu._id));
      if(!a){ a={id:'stuacc-'+Date.now()+'-'+Math.random().toString(16).slice(2),studentId:stu._id,name:stu.name,email:saUsername(stu),username:saUsername(stu),key:saGenPass(),role:'Estudiante',kind:'student',vista:'home',status:'Activo',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; list.unshift(a); }
      else {
        a.name=stu.name;
        a.email=a.email||saUsername(stu);
        a.username=a.username||a.email;
        a.key=a.key||saGenPass();
        a.status=a.status||'Activo';
        a.updatedAt=a.updatedAt||new Date().toISOString();
      }
      stu.access={...(stu.access||{}),username:a.username||a.email,key:a.key,role:'Estudiante',status:a.status};
    });
    db.settings.studentAccounts=list;
    return list;
  }
  function saSave(){ try{ Store.saveState&&Store.saveState(); }catch(_){} }
  function saAccountFor(stu){ return saSyncAccounts().find(a=>String(a.studentId||'')===String(stu._id))||null; }
  function saUpdateAccount(stu,patch){ const db=saDB(); const list=saSyncAccounts(); db.settings.studentAccounts=list.map(a=>String(a.studentId||'')===String(stu._id)?{...a,...patch,updatedAt:new Date().toISOString()}:a); const acc=saAccountFor(stu); try{ Store.update('students',stu._id,{access:{...(stu.access||{}),username:acc.username||acc.email,key:acc.key,status:acc.status,role:'Estudiante'}}); }catch(_){} saSave(); return acc; }
  function saCopy(text,label){ try{ navigator.clipboard.writeText(String(text||'')); toast((label||'Copiado')+' ✓','ok'); }catch(_){ toast('No se pudo copiar','warn'); } }
  function saAccessText(stu,acc){ return 'Acceso a PIAGET AI\n\nEstudiante: '+stu.name+'\nUsuario: '+(acc.username||acc.email)+'\nContraseña: '+acc.key+'\nPlataforma: https://soypiaget.app\n\nPor seguridad, cambia y resguarda estos datos.'; }
  function saShareWhatsApp(stu,acc){ const phone=String(stu.phone||stu.tutorPhone||'').replace(/\D/g,''); const url='https://wa.me/'+phone+'?text='+encodeURIComponent(saAccessText(stu,acc)); if(!phone) return toast('El estudiante no tiene teléfono de tutor capturado','warn'); window.open(url,'_blank'); }
  function saShareMail(stu,acc){ const email=stu.tutorEmail||stu.email||''; if(!email) return toast('No hay correo capturado','warn'); const subject='Datos de acceso a PIAGET AI · '+stu.name; window.location.href='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(saAccessText(stu,acc)); }

  function StudentAccessShareModal({data,onClose}){
    if(!data) return null;
    const {stu,acc}=data;
    return <Modal open title={'Datos de acceso · '+stu.name} width={620} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={()=>saCopy(saAccessText(stu,acc),'Datos de acceso copiados')}><Icon name="copy" size={15} className="btn-ico"/>Copiar datos</button></>}>
      <div className="col" style={{gap:14}}>
        <div className="grid" style={{gridTemplateColumns:'1fr 1fr',gap:10}}><div className="kv"><span className="k">Usuario</span><span className="v font-mono" style={{fontSize:12}}>{acc.username||acc.email}</span></div><div className="kv"><span className="k">Contraseña</span><span className="v font-mono">{acc.key}</span></div></div>
        <div className="row gap-10" style={{flexWrap:'wrap'}}><button className="btn" onClick={()=>saShareWhatsApp(stu,acc)}><Icon name="message" size={14} className="btn-ico"/>Enviar por WhatsApp</button><button className="btn" onClick={()=>saShareMail(stu,acc)}><Icon name="mail" size={14} className="btn-ico"/>Enviar por correo</button></div>
        <div className="faint" style={{fontSize:12.5,lineHeight:1.5}}>El envío abre WhatsApp o el cliente de correo del dispositivo con los datos preparados.</div>
      </div>
    </Modal>;
  }

  function AcademicoAccessReal({go}){
    if(typeof useStore==='function') useStore();
    const [,force]=React.useReducer(x=>x+1,0);
    const [nivel,setNivel]=React.useState('Todos');
    const [grupo,setGrupo]=React.useState('Todos');
    const [search,setSearch]=React.useState('');
    const [modal,setModal]=React.useState(null);
    const [share,setShare]=React.useState(null);
    const [reveal,setReveal]=React.useState(()=>new Set());
    const students=saRealStudents();
    const accounts=saSyncAccounts();
    const groups=['Todos',...Array.from(new Set(students.filter(s=>nivel==='Todos'||s.nivel===nivel).map(s=>s.grade).filter(Boolean)))];
    const filtered=students.filter(s=>(nivel==='Todos'||s.nivel===nivel)&&(grupo==='Todos'||s.grade===grupo)&&(!search.trim()||[s.name,s.email,s.matricula].join(' ').toLowerCase().includes(search.trim().toLowerCase())));
    const active=accounts.filter(a=>a.status==='Activo').length, suspended=accounts.filter(a=>a.status==='Suspendido').length;
    React.useEffect(()=>{ saSave(); },[]);
    function toggleReveal(id){ setReveal(r=>{const n=new Set(r);n.has(id)?n.delete(id):n.add(id);return n;}); }
    function resetPass(stu){ const np=saGenPass(); const acc=saUpdateAccount(stu,{key:np}); setReveal(r=>new Set([...r,stu._id])); saCopy(np,'Nueva contraseña copiada'); force(); }
    function toggleStatus(stu){ const acc=saAccountFor(stu); const next=acc.status==='Suspendido'?'Activo':'Suspendido'; saUpdateAccount(stu,{status:next}); toast(next==='Activo'?'Acceso reactivado ✓':'Acceso suspendido',next==='Activo'?'ok':'warn'); force(); }
    function remove(stu){ if(!confirm('¿Eliminar a '+stu.name+'? También se eliminarán sus pagos asociados y su acceso.'))return; Store.remove('students',stu._id); toast('Estudiante eliminado','warn'); force(); }
    const kpis=[{label:'Estudiantes reales',value:String(students.length),icon:'cap',tone:'blue'},{label:'Accesos activos',value:String(active),icon:'shield',tone:'green'},{label:'Accesos suspendidos',value:String(suspended),icon:'lock',tone:'red'},{label:'Sincronizados',value:String(accounts.length),icon:'refresh',tone:'cyan'}];
    return <div className="content-inner"><PageHead eyebrow="Administración" title="Estudiantes" desc="Padrón real y gestión de acceso a PIAGET AI"><button className="btn" onClick={()=>go&&go('clases')}><Icon name="layers" size={15} className="btn-ico"/>Clases</button><button className="btn primary" onClick={()=>setModal({})}><Icon name="plus" size={15} className="btn-ico"/>Nuevo estudiante</button></PageHead>
      <div className="kpi-row" style={{gridTemplateColumns:'repeat(4,1fr)'}}>{kpis.map((k,i)=>{const t=(window.TONE&&window.TONE[k.tone])||window.TONE.blue;return <div className="card kpi" key={i}><div className="kpi-ico" style={{background:t.bg,color:t.c}}><Icon name={k.icon} size={19}/></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>})}</div>
      <div className="row between center wrap gap-12 mt-16" style={{marginBottom:12}}><div className="seg">{['Todos','Preescolar','Primaria','Secundaria'].map(n=><button key={n} className={nivel===n?'active':''} onClick={()=>{setNivel(n);setGrupo('Todos')}}>{n}</button>)}</div><select className="inp" value={grupo} onChange={e=>setGrupo(e.target.value)} style={{height:34,width:190}}>{groups.map(g=><option key={g} value={g}>{g==='Todos'?'Todos los grupos':g}</option>)}</select><input className="inp" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar estudiante, correo o matrícula" style={{height:34,width:280}}/></div>
      <div className="card"><CardHead icon="users" title="Padrón y accesos" sub={filtered.length+' estudiantes reales'}/><div style={{overflowX:'auto'}}><table className="tbl"><thead><tr><th>Alumno</th><th>Nivel / grupo</th><th>Usuario</th><th>Contraseña</th><th>Acceso</th><th></th></tr></thead><tbody>{filtered.map(stu=>{const acc=saAccountFor(stu);return <tr key={stu._id}><td><div className="person">{stu.photo?<img src={stu.photo} alt="" style={{width:32,height:32,borderRadius:999,objectFit:'cover'}}/>:<Avatar name={stu.name} size={32}/>}<div><div className="pname">{stu.name}</div><div className="pmeta">{stu.matricula||'Sin matrícula'}</div></div></div></td><td><Badge tone="blue">{stu.nivel}</Badge> <span className="font-mono" style={{fontSize:12}}>{stu.grade||'—'}</span></td><td><span className="font-mono" style={{fontSize:12}}>{acc.username||acc.email}</span></td><td><div className="row center gap-6"><span className="font-mono">{reveal.has(stu._id)?acc.key:'••••••••••'}</span><button className="icon-btn" title="Mostrar/ocultar" onClick={()=>toggleReveal(stu._id)}><Icon name="eye" size={14}/></button><button className="icon-btn" title="Copiar contraseña" onClick={()=>saCopy(acc.key,'Contraseña copiada')}><Icon name="copy" size={14}/></button></div></td><td>{acc.status==='Activo'?<Badge tone="green" dot>Activo</Badge>:<Badge tone="red" dot>Suspendido</Badge>}</td><td><RowMenu items={[{icon:'edit',label:'Editar estudiante',onClick:()=>setModal(stu)},{icon:'send',label:'Enviar datos de acceso',onClick:()=>setShare({stu,acc})},{icon:'refresh',label:'Restablecer contraseña',onClick:()=>resetPass(stu)},{icon:acc.status==='Suspendido'?'check':'lock',label:acc.status==='Suspendido'?'Reactivar acceso':'Suspender acceso',onClick:()=>toggleStatus(stu)},{icon:'print',label:'Imprimir credencial',onClick:()=>window.estPrintCredential&&estPrintCredential(stu)},{icon:'trash',label:'Eliminar',danger:true,onClick:()=>remove(stu)}]}/></td></tr>})}{!filtered.length&&<tr><td colSpan="6" className="faint" style={{textAlign:'center',padding:32}}>Sin estudiantes reales para este filtro.</td></tr>}</tbody></table></div></div>
      {modal&&window.EstudianteModal&&<EstudianteModal entry={modal._id?modal:null} onClose={()=>{setModal(null);saSyncAccounts();saSave();force();}}/>}
      <StudentAccessShareModal data={share} onClose={()=>setShare(null)}/>
    </div>;
  }

  function saCurrentStudent(){
    const sess=window.PiagetAuth&&PiagetAuth.getSession?PiagetAuth.getSession():null;
    const sid=sess&&(sess.studentId||(Array.isArray(sess.students)&&sess.students[0]));
    let stu=saRealStudents().find(s=>String(s._id)===String(sid||''));
    if(!stu&&sess&&sess.email) stu=saRealStudents().find(s=>saNorm(s.email)===saNorm(sess.email));
    return stu||null;
  }
  function saGradeRows(stu){
    if(!stu)return[];
    const book=(DB.settings&&DB.settings.nemGradebook)||{};
    const name=stu.name, group=stu.grade;
    return Object.keys(book).filter(k=>{const p=k.split('|');return p.length>=4&&p[1]===group&&p[2]===name&&book[k]!==''&&book[k]!=null;}).map(k=>{const p=k.split('|');return{period:p[0],campo:p.slice(3).join('|'),value:book[k]};});
  }
  function saAttendance(stu){
    if(!stu||!window.asLoadEdits||!window.asStudentStats||!window.asSchoolDays)return null;
    try{const st=asStudentStats(asLoadEdits(),stu.grade,stu.name,asSchoolDays(20));return st.registrados?st:null;}catch(_){return null;}
  }
  function saAccessLog(stu){ const pools=[DB.accessHistory,DB.accessLive,DB.accessQueue].filter(Array.isArray); return pools.flat().filter(x=>saNorm(x.name||x.student)===saNorm(stu&&stu.name)); }

  function StudentHomeRealOnly({go}){
    if(typeof useStore==='function')useStore();
    const me=saCurrentStudent();
    if(!me)return <div className="content-inner"><PageHead eyebrow="Mi espacio" title="Dashboard de estudiante" desc="No se encontró un estudiante real vinculado a esta sesión."/><div className="card pad faint" style={{textAlign:'center',padding:36}}>La cuenta de acceso no está vinculada a un estudiante real.</div></div>;
    const rows=saGradeRows(me), nums=rows.map(r=>Number(r.value)).filter(Number.isFinite), avg=nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:null, att=saAttendance(me), access=saAccessLog(me);
    const cls=((DB.clases||[]).find(c=>c&&c.g===me.grade&&c.real!==false&&!/^cls-\d+$/i.test(String(c._id||''))))||null;
    const announcements=(DB.announcements||[]).filter(a=>a&&a.status==='publicado'&&!a.demo&&!a.sample).slice(0,4);
    const first=me.name.split(' ')[0];
    return <div className="content-inner"><PageHead eyebrow={(me.nivel||'Nivel')+' · '+(me.grade||'Sin grupo')} title={'Hola, '+first} desc="Tu información real capturada en PIAGET AI"><button className="btn" onClick={()=>go('mi-credencial')}><Icon name="user" size={15} className="btn-ico"/>Mi credencial</button></PageHead>
      <div className="kpi-row" style={{gridTemplateColumns:'repeat(3,1fr)'}}>{[{label:'Promedio real',value:avg==null?'—':avg.toFixed(1),icon:'award',tone:'violet'},{label:'Asistencia real',value:att?att.pct+'%':'—',icon:'checkCircle',tone:'green'},{label:'Evaluaciones capturadas',value:String(rows.length),icon:'book',tone:'blue'}].map((k,i)=>{const t=window.TONE[k.tone];return <div className="card kpi" key={i}><div className="kpi-ico" style={{background:t.bg,color:t.c}}><Icon name={k.icon} size={19}/></div><div className="kpi-label">{k.label}</div><div className="kpi-value tnum">{k.value}</div></div>})}</div>
      <div className="grid mt-16" style={{gridTemplateColumns:'1.35fr 1fr'}}><div className="card"><CardHead icon="award" title="Mis evaluaciones" sub={rows.length?rows.length+' registros reales':'Sin evaluaciones capturadas'}/><div style={{overflowX:'auto'}}><table className="tbl"><thead><tr><th>Periodo</th><th>Campo formativo</th><th className="num">Evaluación</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{r.period}</td><td>{r.campo}</td><td className="num"><Badge tone="blue">{String(r.value)}</Badge></td></tr>)}{!rows.length&&<tr><td colSpan="3" className="faint" style={{textAlign:'center',padding:28}}>Aún no hay evaluaciones reales capturadas.</td></tr>}</tbody></table></div></div>
        <div className="card"><CardHead icon="megaphone" title="Comunicación" sub="Avisos publicados"/><div>{announcements.map((c,i)=><div className="lrow" key={c._id||i}><div className="grow"><div style={{fontWeight:600}}>{c.title}</div><div className="faint" style={{fontSize:12}}>{c.audience||'Comunidad'} · {c.time||''}</div></div></div>)}{!announcements.length&&<div className="faint" style={{padding:20}}>Sin avisos publicados.</div>}</div></div></div>
      <div className="grid mt-16" style={{gridTemplateColumns:'1fr 1fr'}}><div className="card pad"><div className="card-title"><Icon name="cap" size={17} className="ico"/>Mi grupo</div>{cls?<div className="col gap-10" style={{marginTop:14}}><div className="kv"><span className="k">Grupo</span><span className="v">{cls.g}</span></div><div className="kv"><span className="k">Docente titular</span><span className="v">{cls.titular||'Sin asignar'}</span></div><div className="kv"><span className="k">Salón</span><span className="v">{cls.salon||'—'}</span></div></div>:<div className="faint" style={{padding:'18px 0'}}>No hay un grupo real vinculado.</div>}</div>
        <div className="card pad"><div className="card-title"><Icon name="history" size={17} className="ico"/>Mis accesos</div><div className="kpi-value tnum" style={{marginTop:14}}>{access.length}</div><div className="faint" style={{fontSize:12.5}}>registros reales encontrados en Control de Accesos</div><button className="btn sm mt-16" onClick={()=>go('historial-accesos')}>Ver historial</button></div></div>
      <div className="card mt-16 pad"><div className="card-title"><Icon name="checkCircle" size={17} className="ico"/>Mi asistencia</div>{att?<div className="row center gap-16" style={{marginTop:14}}><div className="kpi-value tnum">{att.pct}%</div><div className="grow"><Bar value={att.pct} height={10}/><div className="faint" style={{fontSize:12,marginTop:7}}>{att.registrados} días con registro · {att.presente} presentes · {att.retardo} retardos · {att.ausente} ausencias</div></div></div>:<div className="faint" style={{padding:'18px 0'}}>Aún no hay asistencia real capturada.</div>}</div>
    </div>;
  }

  function installAccessGuard(){
    if(!window.PiagetAuth||PiagetAuth.__studentStatusGuard)return;
    const original=PiagetAuth.authenticate.bind(PiagetAuth);
    PiagetAuth.authenticate=async function(id,secret){
      const acc=saSyncAccounts().find(a=>[a.email,a.username].map(saNorm).includes(saNorm(id)));
      if(acc&&acc.status==='Suspendido')return{ok:false,error:'Acceso suspendido. Contacta a la administración del colegio.'};
      if(acc&&String(acc.key||'')===String(secret||'')){
        const stu=saRealStudents().find(s=>String(s._id)===String(acc.studentId));
        if(stu)return{ok:true,account:{name:stu.name,role:'Estudiante',email:acc.email||acc.username,kind:'Estudiante',vista:'home',students:[stu._id],studentId:stu._id}};
      }
      return original(id,secret);
    };
    PiagetAuth.__studentStatusGuard=true;
  }

  saSyncAccounts();
  saSave();
  installAccessGuard();
  var n=0,t=setInterval(function(){installAccessGuard();n++;if(n>80)clearInterval(t);},250);
  Object.assign(window,{Academico:AcademicoAccessReal,AcademicoAccessReal,StudentHome:StudentHomeRealOnly,StudentHomeRealOnly,StudentAccessShareModal,saSyncAccounts,saAccountFor,saUpdateAccount,saGenPass});
})();