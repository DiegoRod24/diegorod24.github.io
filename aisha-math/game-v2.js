(() => {
  "use strict";
  const TOTAL_LEVELS = 24000;
  const KEY = "aishaMath4ProgressV2";
  const LEGACY_KEY = "aishaMathProgressV1";

  const COMP = {
    cantidad:"Problemas de cantidad",
    regularidad:"Regularidad, equivalencia y cambio",
    forma:"Forma, movimiento y localización",
    datos:"Gestión de datos e incertidumbre"
  };

  const TOPICS = [
    {id:"place",icon:"🔢",name:"Números y valor posicional",comp:"cantidad",desc:"Unidades, decenas, centenas, millares, comparar y ordenar."},
    {id:"addsub",icon:"➕",name:"Suma y resta",comp:"cantidad",desc:"Cálculo mental, algoritmos y problemas cotidianos."},
    {id:"multiply",icon:"✖️",name:"Multiplicación",comp:"cantidad",desc:"Tablas, grupos iguales y multiplicaciones por 1 y 2 cifras."},
    {id:"divide",icon:"➗",name:"División",comp:"cantidad",desc:"Repartos exactos, residuos y relación con la multiplicación."},
    {id:"fractions",icon:"🍕",name:"Fracciones",comp:"cantidad",desc:"Representar, comparar y reconocer fracciones equivalentes simples."},
    {id:"money",icon:"🪙",name:"Dinero, tiempo y medidas",comp:"cantidad",desc:"Soles, vuelto, reloj, longitud, masa y capacidad."},
    {id:"patterns",icon:"🔮",name:"Patrones y equivalencias",comp:"regularidad",desc:"Secuencias, reglas y números que faltan."},
    {id:"geometry",icon:"🔷",name:"Figuras y ángulos",comp:"forma",desc:"Polígonos, lados, vértices, simetría y ángulos."},
    {id:"perimeter",icon:"🪁",name:"Perímetro",comp:"forma",desc:"Mide todo el borde de cuadrados, rectángulos y figuras."},
    {id:"area",icon:"🟦",name:"Área",comp:"forma",desc:"Cuadraditos, medios cuadrados y área de rectángulos."},
    {id:"location",icon:"🧭",name:"Ubicación y movimiento",comp:"forma",desc:"Rutas, coordenadas sencillas, giros y orientación."},
    {id:"data",icon:"📊",name:"Tablas y gráficos",comp:"datos",desc:"Leer pictogramas, barras, tablas y sacar conclusiones."},
    {id:"chance",icon:"🎲",name:"Azar y probabilidad",comp:"datos",desc:"Seguro, posible e imposible en situaciones sencillas."},
    {id:"word",icon:"📚",name:"Problemas mixtos",comp:"cantidad",desc:"Decidir qué operación usar y explicar la estrategia."}
  ];

  const WORLDS = [
    {id:"place",icon:"🏙️",name:"Ciudad de los Números",desc:"Valor posicional, ordenar y comparar."},
    {id:"addsub",icon:"🌳",name:"Bosque de Cálculo",desc:"Sumas, restas y estrategias mentales."},
    {id:"multiply",icon:"🚀",name:"Planeta Multiplica",desc:"Grupos, tablas y productos."},
    {id:"divide",icon:"🏝️",name:"Islas del Reparto",desc:"Dividir y comprobar."},
    {id:"fractions",icon:"🍕",name:"Valle de Fracciones",desc:"Partes de un todo y comparaciones."},
    {id:"money",icon:"🛒",name:"Mercado Matemático",desc:"Dinero, tiempo y medidas."},
    {id:"patterns",icon:"🔮",name:"Cueva de Patrones",desc:"Reglas, secuencias y equivalencias."},
    {id:"geometry",icon:"🏰",name:"Castillo Geométrico",desc:"Figuras, ángulos y simetría."},
    {id:"perimeter",icon:"🪁",name:"Reino del Perímetro",desc:"Bordes, cercos y recorridos."},
    {id:"area",icon:"🟦",name:"Ciudad del Área",desc:"Superficies y cuadraditos."},
    {id:"data",icon:"📊",name:"Laboratorio de Datos",desc:"Tablas, gráficos y azar."},
    {id:"word",icon:"🏆",name:"Torre de los Retos",desc:"Problemas que mezclan todo."}
  ].map((w,i)=>({...w,start:i*2000+1,end:(i+1)*2000}));

  const BADGES = [
    {n:10,icon:"🌱",name:"Primeros pasos"},{n:30,icon:"🧭",name:"Explorador"},{n:75,icon:"🧠",name:"Mente curiosa"},{n:150,icon:"🚀",name:"Despegue"},
    {n:300,icon:"💎",name:"Coleccionista"},{n:600,icon:"🏰",name:"Constructor"},{n:1000,icon:"🌟",name:"Superestrella"},{n:2000,icon:"🏆",name:"Maestro de retos"}
  ];

  const DEFAULT = {level:1,stars:0,gems:0,streak:0,best:0,correct:0,total:0,name:"",sound:true,mastery:{},daily:{date:"",count:0,claimed:false}};
  let state = loadState();
  let active = null;
  let selected = null;
  let hints = 0;
  let mode = "adventure";
  let modeStep = 0;
  let modeCorrect = 0;
  let topicOverride = null;
  let returnView = "home";
  let memoryLock = false;
  let memoryOpen = [];
  let memoryMatched = 0;
  let memoryMoves = 0;

  const $ = id => document.getElementById(id);
  const qs = sel => document.querySelector(sel);
  const qsa = sel => [...document.querySelectorAll(sel)];

  function loadState(){
    try{
      const raw = localStorage.getItem(KEY);
      if(raw) return {...DEFAULT,...JSON.parse(raw)};
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY)||"null");
      if(legacy) return {...DEFAULT,level:Math.min(TOTAL_LEVELS,legacy.currentLevel||1),stars:legacy.xp||0,streak:legacy.streak||0,best:legacy.bestStreak||0,correct:legacy.correct||0,mastery:legacy.mastery||{}};
    }catch(_){ }
    return {...DEFAULT};
  }
  function save(){localStorage.setItem(KEY,JSON.stringify(state));updateStats();}
  function today(){return new Date().toISOString().slice(0,10)}
  function refreshDaily(){
    if(state.daily.date!==today()) state.daily={date:today(),count:0,claimed:false};
    $("dailyCount").textContent=`${Math.min(state.daily.count,5)}/5`;
    const box=$("dailyQuest");
    if(state.daily.claimed){box.querySelector("small").textContent="¡Misión completada! Mañana habrá otra.";box.querySelector("strong").textContent="✅"}
  }
  function updateStats(){
    $("starsTop").textContent=state.stars;$("gemsTop").textContent=state.gems;$("streakTop").textContent=state.streak;
    $("reportStars").textContent=state.stars;$("reportGems").textContent=state.gems;$("reportCorrect").textContent=state.correct;$("reportBest").textContent=state.best;
    const w=worldForLevel(state.level), local=state.level-w.start+1;
    $("journeyTitle").textContent=`${w.icon} ${w.name}`;$("journeyText").textContent=w.desc;$("journeyLevel").textContent=`Nivel ${state.level.toLocaleString("es-PE")} de ${TOTAL_LEVELS.toLocaleString("es-PE")}`;
    $("journeyBar").style.width=`${Math.max(2,Math.min(100,local/2000*100))}%`;
    const next=BADGES.find(b=>state.correct<b.n)||BADGES[BADGES.length-1];$("badgeName").textContent=state.correct>=2000?"Maestro de Aisha":next.name;$("badgeHint").textContent=state.correct>=2000?"¡Has desbloqueado todas las insignias!":`Faltan ${next.n-state.correct} respuestas correctas para desbloquearla.`;
    const who=state.name?`, ${escapeText(state.name)}`:"";$("heroGreeting").innerHTML=`Aisha te acompaña${who} con pistas, dibujos, voz y retos cortitos. <strong>Equivocarse no quita vidas.</strong>`;
    refreshDaily();
  }
  function escapeText(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}

  function showView(name){
    const map={home:"homeView",play:"playView",topics:"topicsView",worlds:"worldsView",challenge:"challengeView",memory:"memoryView",progress:"progressView"};
    Object.values(map).forEach(id=>$(id).classList.add("hidden"));
    $(map[name]||map.home).classList.remove("hidden");
    qsa(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===name || (name==="challenge"&&b.dataset.view==="worlds") || (name==="memory"&&b.dataset.view==="play")));
    if(name==="progress") renderProgress();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function rng(seed){let s=(seed>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
  const int=(r,a,b)=>Math.floor(r()*(b-a+1))+a;
  const pick=(r,a)=>a[Math.floor(r()*a.length)];
  const shuffle=(r,a)=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  function worldForLevel(level){return WORLDS.find(w=>level>=w.start&&level<=w.end)||WORLDS[0]}
  function diffFor(level){const n=((level-1)%2000)+1;return n<450?"Suave":n<1050?"Medio":n<1600?"Reto":"Maestro"}
  function scaleFor(level){const n=((level-1)%2000)+1;return n<450?1:n<1050?2:n<1600?3:4}

  function makeOptions(r,ans,kind="number"){
    if(kind==="text") return [];
    const vals=new Set([ans]);
    const step=Math.max(1,Math.round(Math.abs(Number(ans)||1)*.1));
    [1,-1,2,-2,step,-step,step*2,-step*2,10,-10].forEach(d=>{const v=Number(ans)+d;if(v>=0)vals.add(v)});
    while(vals.size<4) vals.add(Number(ans)+vals.size+2);
    return shuffle(r,[...vals].slice(0,4));
  }

  function makeQuestion(level,forcedTopic,seedExtra=0){
    const world=worldForLevel(level);const topic=forcedTopic||world.id;const r=rng(level*9187+seedExtra*7919+topic.length*97+Date.now()%97);const s=scaleFor(level);
    let q;
    switch(topic){
      case"place":q=qPlace(r,s);break;case"addsub":q=qAddSub(r,s);break;case"multiply":q=qMultiply(r,s);break;case"divide":q=qDivide(r,s);break;case"fractions":q=qFractions(r,s);break;case"money":q=qMoney(r,s);break;case"patterns":q=qPatterns(r,s);break;case"geometry":q=qGeometry(r,s);break;case"perimeter":q=qPerimeter(r,s);break;case"area":q=qArea(r,s);break;case"location":q=qLocation(r,s);break;case"data":q=qData(r,s);break;case"chance":q=qChance(r,s);break;default:q=qWord(r,s);
    }
    q.level=level;q.topic=topic;q.world=world;q.difficulty=diffFor(level);q.comp=q.comp||TOPICS.find(t=>t.id===topic)?.comp||"cantidad";q.options=q.options||makeOptions(r,q.answer,q.kind);return q;
  }

  function qPlace(r,s){
    const max=[999,9999,99999,999999][s-1];const n=int(r,120,max);const type=int(r,0,3);
    if(type===0){const digits=String(n).length;const pos=int(r,0,digits-1);const digit=String(n)[pos];const place=Math.pow(10,digits-1-pos);return{comp:"cantidad",skill:"Valor posicional",answer:Number(digit)*place,question:`En el número ${n.toLocaleString("es-PE")}, ¿qué valor tiene la cifra ${digit} marcada en la posición ${placeName(place)}?`,hints:[`Busca la posición de la cifra ${digit}.`,`Multiplica la cifra por el valor de su posición: ${digit} × ${place}.`,`El valor es ${Number(digit)*place}.`],explain:`La cifra ${digit} está en ${placeName(place)}. Por eso vale ${digit} × ${place} = ${Number(digit)*place}.`,visual:{type:"place",n}}}
    if(type===1){let m=int(r,100,max);if(m===n)m++;const ans=n>m?n:m;return{comp:"cantidad",skill:"Comparar números",answer:ans,question:`¿Cuál de estos números es mayor?`,hints:["Compara primero la cifra de mayor valor.","Si tienen igual cantidad de cifras, mira de izquierda a derecha.",`El mayor es ${ans.toLocaleString("es-PE")}.`],explain:`Al comparar de izquierda a derecha, ${ans.toLocaleString("es-PE")} es el mayor.`,options:shuffle(r,[n,m,n+10,m+10]),visual:{type:"compare",a:n,b:m}}}
    if(type===2){const base=Math.floor(n/100)*100;const ans=Math.round(n/100)*100;return{comp:"cantidad",skill:"Redondeo",answer:ans,question:`Redondea ${n.toLocaleString("es-PE")} a la centena más cercana.`,hints:["Mira la cifra de las decenas.","Si es 5 o más, sube la centena; si es 4 o menos, se queda.",`La centena más cercana es ${ans}.`],explain:`${n} está más cerca de ${ans} que de ${base===ans?base+100:base}.`,visual:{type:"numberline",n,ans}}}
    const thousands=Math.floor(n/1000);const rest=n%1000;const ans=thousands*1000+rest;return{comp:"cantidad",skill:"Descomposición",answer:ans,question:`¿Qué número se forma con ${thousands} millares y ${rest} unidades adicionales?`,hints:[`${thousands} millares = ${thousands*1000}.`,`Ahora suma ${rest}.`,`${thousands*1000} + ${rest} = ${ans}.`],explain:`${thousands} × 1000 + ${rest} = ${ans}.`,visual:{type:"equation",text:`${thousands}×1000 + ${rest} = ?`}};
  }
  function placeName(v){return v===1?"unidades":v===10?"decenas":v===100?"centenas":v===1000?"unidades de millar":v===10000?"decenas de millar":"centenas de millar"}

  function qAddSub(r,s){
    const max=[999,4999,19999,99999][s-1];let a=int(r,120,max),b=int(r,20,Math.max(40,Math.floor(max*.55)));const add=r()>.45;if(!add&&b>a)[a,b]=[b,a];const ans=add?a+b:a-b;const op=add?"+":"−";const story=add?`Una biblioteca tenía ${a.toLocaleString("es-PE")} libros y recibió ${b.toLocaleString("es-PE")} más. ¿Cuántos tiene ahora?`:`En una campaña reunieron ${a.toLocaleString("es-PE")} tapitas y usaron ${b.toLocaleString("es-PE")}. ¿Cuántas quedaron?`;
    return{comp:"cantidad",skill:add?"Suma":"Resta",answer:ans,question:r()>.45?story:`Calcula: ${a.toLocaleString("es-PE")} ${op} ${b.toLocaleString("es-PE")}`,hints:[add?"Junta las dos cantidades.":"Quita la segunda cantidad de la primera.",`Puedes alinear unidades, decenas y centenas.`,`Resultado: ${ans.toLocaleString("es-PE")}.`],explain:`${a.toLocaleString("es-PE")} ${op} ${b.toLocaleString("es-PE")} = ${ans.toLocaleString("es-PE")}.`,visual:{type:"equation",text:`${a.toLocaleString("es-PE")} ${op} ${b.toLocaleString("es-PE")} = ?`}};
  }

  function qMultiply(r,s){
    const a=int(r,2,s===1?10:s===2?20:s===3?50:99),b=int(r,2,s<3?12:s===3?20:35),ans=a*b;const stories=[`Hay ${a} cajas con ${b} stickers en cada una. ¿Cuántos stickers hay?`,`Una granja acomoda ${a} filas de ${b} plantas. ¿Cuántas plantas son?`,`Aisha gana ${b} estrellas por ronda y completa ${a} rondas. ¿Cuántas estrellas obtiene?`];
    return{comp:"cantidad",skill:"Multiplicación",answer:ans,question:pick(r,stories),hints:["Son grupos iguales: usa multiplicación.",`${a} grupos de ${b} se escriben ${a} × ${b}.`,`El producto es ${ans}.`],explain:`${a} × ${b} = ${ans}.`,visual:{type:"groups",groups:Math.min(a,8),each:Math.min(b,10),label:a>8||b>10?`${a} grupos × ${b}`:""}};
  }

  function qDivide(r,s){
    const divisor=int(r,2,s===1?9:s===2?12:s===3?20:25);const quotient=int(r,2,s===1?12:s===2?25:s===3?60:99);const dividend=divisor*quotient;const type=int(r,0,2);
    if(type===2&&s>1){const extra=int(r,1,divisor-1),total=dividend+extra;return{comp:"cantidad",skill:"División con residuo",answer:quotient,question:`Se reparten ${total} fichas en grupos de ${divisor}. ¿Cuántos grupos completos se forman?`,hints:[`Busca cuántas veces cabe ${divisor} en ${total}.`,`${divisor} × ${quotient} = ${dividend}, y sobran ${extra}.`,`Se forman ${quotient} grupos completos.`],explain:`${total} ÷ ${divisor} = ${quotient} y sobran ${extra}.`,visual:{type:"equation",text:`${total} ÷ ${divisor} = ? grupos`}}}
    return{comp:"cantidad",skill:"División",answer:quotient,question:`Aisha reparte ${dividend} gemas en ${divisor} bolsitas iguales. ¿Cuántas gemas van en cada bolsita?`,hints:["Repartir en partes iguales significa dividir.",`Piensa: ¿${divisor} por cuánto da ${dividend}?`,`${dividend} ÷ ${divisor} = ${quotient}.`],explain:`Como ${divisor} × ${quotient} = ${dividend}, entonces ${dividend} ÷ ${divisor} = ${quotient}.`,visual:{type:"equation",text:`${dividend} ÷ ${divisor} = ?`}};
  }

  function qFractions(r,s){
    const den=pick(r,s===1?[2,3,4,5,6]:[3,4,5,6,8,10,12]);let num=int(r,1,den-1);const type=int(r,0,s===1?2:4);
    if(type===0){return{comp:"cantidad",skill:"Representar fracciones",answer:num,question:`Una barra está dividida en ${den} partes iguales y ${num} están coloreadas. ¿Qué número va en el numerador de la fracción?`,hints:["El numerador cuenta las partes coloreadas.",`Hay ${num} partes coloreadas.`,`La fracción es ${num}/${den}.`],explain:`Numerador = partes tomadas = ${num}. Denominador = partes totales = ${den}.`,visual:{type:"fraction",num,den}}}
    if(type===1){const n2=int(r,1,den-1);const ans=Math.max(num,n2);return{comp:"cantidad",skill:"Comparar fracciones",answer:ans,question:`Con el mismo denominador ${den}, ¿qué numerador forma la fracción mayor: ${num} o ${n2}?`,hints:["Si el denominador es igual, compara numeradores.","Más partes tomadas significa una fracción mayor.",`El mayor numerador es ${ans}.`],explain:`Con denominadores iguales, ${ans}/${den} es mayor.`,options:shuffle(r,[num,n2,den,Math.min(den,num+n2)]),visual:{type:"fractionCompare",a:num,b:n2,den}}}
    if(type===2){const mul=pick(r,[2,3]);const ans=num*mul;return{comp:"regularidad",skill:"Fracciones equivalentes",answer:ans,question:`Completa la equivalencia: ${num}/${den} = ?/${den*mul}`,hints:[`El denominador se multiplicó por ${mul}.`,`Haz lo mismo con el numerador: ${num} × ${mul}.`,`El numerador faltante es ${ans}.`],explain:`Multiplicando numerador y denominador por ${mul}: ${num}/${den} = ${ans}/${den*mul}.`,visual:{type:"equation",text:`${num}/${den} = ?/${den*mul}`}}}
    if(type===3){const g=gcd(num,den);const sn=num/g,sd=den/g;return{comp:"cantidad",skill:"Parte de una colección",answer:num,question:`De ${den} tarjetas, ${num} son azules. ¿Cuántas tarjetas representa la fracción ${num}/${den}?`,hints:["La fracción describe cuántas de las tarjetas se toman.",`El numerador es ${num}.`,`Representa ${num} tarjetas.`],explain:`${num}/${den} de una colección de ${den} elementos son ${num} elementos.`,visual:{type:"fraction",num,den}}}
    const total=den*pick(r,[2,3,4]),ans=total/den*num;return{comp:"cantidad",skill:"Fracción de una cantidad",answer:ans,question:`¿Cuánto es ${num}/${den} de ${total}?`,hints:[`Primero divide ${total} entre ${den}.`,`Cada parte vale ${total/den}. Luego toma ${num} partes.`,`Resultado: ${ans}.`],explain:`${total} ÷ ${den} = ${total/den}; ${total/den} × ${num} = ${ans}.`,visual:{type:"equation",text:`${num}/${den} de ${total} = ?`}};
  }

  function qMoney(r,s){
    const type=int(r,0,3);
    if(type===0){const price=int(r,4,15*s+15),paid=Math.ceil(price/10)*10+(r()>.5?10:0),ans=paid-price;return{comp:"cantidad",skill:"Dinero y vuelto",answer:ans,unit:"S/",question:`En el mercadito, un juego cuesta S/ ${price}. Pagas con S/ ${paid}. ¿Cuánto recibes de vuelto?`,hints:["El vuelto es lo pagado menos el precio.",`${paid} − ${price} = ?`,`El vuelto es S/ ${ans}.`],explain:`S/ ${paid} − S/ ${price} = S/ ${ans}.`,visual:{type:"money",price,paid}}}
    if(type===1){const h=int(r,1,11),m=pick(r,[0,15,30,45]),add=pick(r,[15,30,45,60]);const total=h*60+m+add,ah=Math.floor(total/60)%12||12,am=total%60;return{comp:"cantidad",skill:"Tiempo",answer:ah*100+am,kind:"number",question:`Una actividad empieza a las ${h}:${String(m).padStart(2,"0")} y dura ${add} minutos. Escribe la hora final como HHMM (por ejemplo, 3:30 → 330).`,hints:[`Suma ${add} minutos a la hora inicial.`,"Cada 60 minutos avanzas una hora.",`Termina a las ${ah}:${String(am).padStart(2,"0")}.`],explain:`${h}:${String(m).padStart(2,"0")} + ${add} min = ${ah}:${String(am).padStart(2,"0")}.`,visual:{type:"clock",h,m}}}
    if(type===2){const meters=int(r,2,20*s),cm=meters*100;return{comp:"cantidad",skill:"Longitud",answer:cm,unit:"cm",question:`¿Cuántos centímetros hay en ${meters} metros?`,hints:["1 metro = 100 centímetros.",`Multiplica ${meters} × 100.`,`Son ${cm} cm.`],explain:`${meters} m × 100 = ${cm} cm.`,visual:{type:"equation",text:`${meters} m = ? cm`}}}
    const liters=int(r,2,10*s),half=liters*2;return{comp:"cantidad",skill:"Capacidad",answer:half,question:`Con ${liters} litros de jugo, ¿cuántas botellas de 1/2 litro se pueden llenar?`,hints:["En 1 litro caben 2 medios litros.",`${liters} × 2 = ?`,`Se llenan ${half} botellas.`],explain:`Cada litro llena 2 botellas de 1/2 L. ${liters} × 2 = ${half}.`,visual:{type:"equation",text:`${liters} L → ? botellas de ½ L`}};
  }

  function qPatterns(r,s){
    const type=int(r,0,2);const start=int(r,1,30*s);const step=int(r,2,5*s+2);
    if(type===0){const seq=[start,start+step,start+2*step,start+3*step],ans=start+4*step;return{comp:"regularidad",skill:"Patrones aditivos",answer:ans,question:`Completa el patrón: ${seq.join(", ")}, ...`,hints:["Mira cuánto aumenta de un término al siguiente.",`La regla es sumar ${step}.`,`El siguiente es ${seq[3]} + ${step} = ${ans}.`],explain:`La secuencia aumenta de ${step} en ${step}.`,visual:{type:"sequence",seq}}}
    if(type===1){const mul=pick(r,[2,3,4]);const a=int(r,2,8);const seq=[a,a*mul,a*mul*mul],ans=a*mul*mul*mul;return{comp:"regularidad",skill:"Patrones multiplicativos",answer:ans,question:`¿Qué número sigue? ${seq.join(" → ")} → ?`,hints:["Compara cada término con el anterior.",`Cada número se multiplica por ${mul}.`,`El siguiente es ${seq[2]} × ${mul} = ${ans}.`],explain:`La regla es × ${mul}, por eso sigue ${ans}.`,visual:{type:"sequence",seq}}}
    const a=int(r,2,20*s),b=int(r,2,20*s),c=int(r,1,20*s),ans=a+b-c;return{comp:"regularidad",skill:"Equivalencias",answer:ans,question:`Completa para que ambos lados sean iguales: ${a} + ${b} = ${c} + ?`,hints:[`Primero calcula ${a}+${b}.`,`Luego resta ${c} al total.`,`El número que falta es ${ans}.`],explain:`${a}+${b}=${a+b}. Entonces ${c}+${ans} también debe ser ${a+b}.`,visual:{type:"equation",text:`${a} + ${b} = ${c} + ?`}};
  }

  function qGeometry(r,s){
    const shapes=[{n:"triángulo",s:3,v:3},{n:"cuadrilátero",s:4,v:4},{n:"pentágono",s:5,v:5},{n:"hexágono",s:6,v:6},{n:"octágono",s:8,v:8}];const sh=pick(r,shapes.slice(0,s===1?3:5));const type=int(r,0,2);
    if(type===0)return{comp:"forma",skill:"Polígonos",answer:sh.s,question:`¿Cuántos lados tiene un ${sh.n}?`,hints:["Recorre el borde y cuenta cada segmento.",`Un ${sh.n} tiene la misma cantidad de lados y vértices.`,`Tiene ${sh.s} lados.`],explain:`El ${sh.n} tiene ${sh.s} lados.`,visual:{type:"polygon",sides:sh.s}};
    if(type===1){const angle=pick(r,[35,60,90,110,135,170]),ans=angle<90?1:angle===90?2:3;return{comp:"forma",skill:"Ángulos",answer:ans,question:`Un ángulo mide ${angle}°. Elige: 1 = agudo, 2 = recto, 3 = obtuso.`,hints:["Agudo < 90°, recto = 90°, obtuso > 90° y < 180°.",`Compara ${angle}° con 90°.`,ans===1?"Es agudo.":ans===2?"Es recto.":"Es obtuso."],explain:`${angle}° ${angle<90?"es menor que":angle===90?"es igual a":"es mayor que"} 90°, por eso es ${ans===1?"agudo":ans===2?"recto":"obtuso"}.`,visual:{type:"angle",angle}}}
    const ans=pick(r,[1,2,3]);const names={1:"vertical",2:"horizontal",3:"diagonal"};return{comp:"forma",skill:"Líneas y orientación",answer:ans,question:`¿Qué tipo de línea muestra el dibujo? 1 = vertical, 2 = horizontal, 3 = diagonal.`,hints:["Vertical va de arriba abajo; horizontal de lado a lado.",`Observa la dirección de la línea.`,`Es ${names[ans]}.`],explain:`La línea es ${names[ans]}.`,visual:{type:"line",kind:ans}};
  }

  function qPerimeter(r,s){
    const type=int(r,0,3);const max=8+s*10;
    if(type===0){const a=int(r,3,max),b=int(r,3,max+5),ans=2*(a+b);return{comp:"forma",skill:"Perímetro del rectángulo",answer:ans,unit:"cm",question:`Un rectángulo mide ${a} cm de largo y ${b} cm de ancho. ¿Cuál es su perímetro?`,hints:["Perímetro = todo el borde.",`Suma ${a}+${b}+${a}+${b}.`,`P = ${ans} cm.`],explain:`P = 2 × (${a}+${b}) = ${ans} cm.`,visual:{type:"rect",a,b}}}
    if(type===1){const a=int(r,10,max+15),b=int(r,12,max+20),ans=2*a+2*b;return{comp:"forma",skill:"Cometa y perímetro",answer:ans,unit:"cm",question:`Una cometa tiene dos lados de ${a} cm y dos lados de ${b} cm. ¿Cuánta cinta se necesita para todo el borde?`,hints:["Suma los cuatro lados.",`${a}+${a}+${b}+${b}.`,`Se necesitan ${ans} cm.`],explain:`${a}+${a}+${b}+${b}=${ans} cm.`,visual:{type:"kite",a,b}}}
    if(type===2){const side=int(r,3,max),ans=side*4;return{comp:"forma",skill:"Perímetro del cuadrado",answer:ans,unit:"m",question:`Un jardín cuadrado tiene ${side} m por lado. ¿Cuántos metros de cerco necesita?`,hints:["Un cuadrado tiene 4 lados iguales.",`Multiplica ${side} × 4.`,`P = ${ans} m.`],explain:`4 × ${side} = ${ans} m.`,visual:{type:"square",a:side}}}
    const sides=[int(r,3,max),int(r,3,max),int(r,3,max),int(r,3,max),int(r,3,max)];const ans=sides.reduce((x,y)=>x+y,0);return{comp:"forma",skill:"Perímetro irregular",answer:ans,unit:"cm",question:`Una figura tiene lados de ${sides.join(", ")} cm. ¿Cuál es su perímetro?`,hints:["Suma cada lado una sola vez.",sides.join(" + "),`Total: ${ans} cm.`],explain:`${sides.join(" + ")} = ${ans} cm.`,visual:{type:"polygon",sides:5}};
  }

  function qArea(r,s){
    const type=int(r,0,3);const max=5+s*4;
    if(type===0){const w=int(r,3,max),h=int(r,2,max),ans=w*h;return{comp:"forma",skill:"Área por cuadraditos",answer:ans,unit:"cm²",question:`Cada cuadrito vale 1 cm². Hay ${w} columnas y ${h} filas. ¿Cuál es el área?`,hints:["Puedes contar todos los cuadritos.",`También puedes hacer ${w} × ${h}.`,`Área = ${ans} cm².`],explain:`${w} columnas × ${h} filas = ${ans} cuadritos = ${ans} cm².`,visual:{type:"grid",w,h}}}
    if(type===1){const full=int(r,8,15+s*3),ans=full+1;return{comp:"forma",skill:"Área con medios cuadrados",answer:ans,unit:"cm²",question:`La figura tiene ${full} cuadritos completos y 2 triángulos que juntos forman 1 cuadrito. ¿Cuál es el área total?`,hints:["Dos medios forman un entero.",`${full} + 1 = ?`,`Área = ${ans} cm².`],explain:`${full} completos + ½ + ½ = ${full}+1=${ans} cm².`,visual:{type:"halfgrid",full}}}
    if(type===2){const a=int(r,3,max+5),b=int(r,2,max),ans=a*b;return{comp:"forma",skill:"Área del rectángulo",answer:ans,unit:"m²",question:`Una habitación mide ${a} m por ${b} m. ¿Cuántos m² de piso tiene?`,hints:["Área del rectángulo = largo × ancho.",`${a} × ${b} = ?`,`Área = ${ans} m².`],explain:`A = ${a} × ${b} = ${ans} m².`,visual:{type:"rect",a,b,area:true}}}
    const side=int(r,3,max),ans=side*side;return{comp:"forma",skill:"Área del cuadrado",answer:ans,unit:"cm²",question:`Un cuadrado tiene ${side} cm de lado. ¿Cuál es su área?`,hints:["Multiplica lado × lado.",`${side} × ${side} = ?`,`Área = ${ans} cm².`],explain:`A=${side}²=${ans} cm².`,visual:{type:"square",a:side,area:true}};
  }

  function qLocation(r,s){
    const dirs=["norte","este","sur","oeste"];const start=int(r,0,3);const turns=pick(r,[1,2,3]);const ans=(start+turns)%4+1;return{comp:"forma",skill:"Giros y orientación",answer:ans,question:`Aisha mira al ${dirs[start]}. Gira ${turns===1?"un cuarto de vuelta a la derecha":turns===2?"media vuelta":"tres cuartos de vuelta a la derecha"}. Elige: 1=norte, 2=este, 3=sur, 4=oeste.`,hints:["Un cuarto de vuelta a la derecha avanza una dirección.",`Empieza en ${dirs[start]} y avanza ${turns} posición(es).`,`Termina mirando al ${dirs[(start+turns)%4]}.`],explain:`Después del giro, Aisha mira al ${dirs[(start+turns)%4]}.`,visual:{type:"compass",dir:(start+turns)%4}};
  }

  function qData(r,s){
    const vals=[int(r,2,5+s*2),int(r,2,5+s*2),int(r,2,5+s*2),int(r,2,5+s*2)];const labels=["Rojo","Azul","Verde","Amarillo"];const type=int(r,0,2);
    if(type===0){const idx=vals.indexOf(Math.max(...vals));return{comp:"datos",skill:"Gráfico de barras",answer:idx+1,question:`Observa el gráfico. ¿Qué color tiene la barra más alta? 1=Rojo, 2=Azul, 3=Verde, 4=Amarillo.`,hints:["Busca la barra que llega más arriba.",`La mayor cantidad es ${vals[idx]}.`,`Corresponde a ${labels[idx]}.`],explain:`${labels[idx]} tiene ${vals[idx]}, la cantidad más alta.`,visual:{type:"bars",vals,labels}}}
    if(type===1){const total=vals.reduce((a,b)=>a+b,0);return{comp:"datos",skill:"Interpretar datos",answer:total,question:`El gráfico muestra votos por color. ¿Cuántos votos hay en total?`,hints:["Suma las cuatro barras.",vals.join(" + "),`Total = ${total}.`],explain:`${vals.join(" + ")} = ${total}.`,visual:{type:"bars",vals,labels}}}
    const idx=int(r,0,3);return{comp:"datos",skill:"Leer gráfico",answer:vals[idx],question:`Según el gráfico, ¿cuántos votos obtuvo ${labels[idx]}?`,hints:[`Ubica la barra de ${labels[idx]}.`,`Lee su altura.`,`Marca ${vals[idx]}.`],explain:`La barra de ${labels[idx]} llega a ${vals[idx]}.`,visual:{type:"bars",vals,labels}};
  }

  function qChance(r,s){
    const cases=[{q:"Sacar una pelota roja de una bolsa que solo tiene pelotas rojas",a:3},{q:"Que mañana salga el sol por el oeste",a:1},{q:"Sacar un número par al lanzar un dado",a:2},{q:"Sacar un 7 al lanzar un dado común",a:1},{q:"Sacar cara al lanzar una moneda",a:2}];const c=pick(r,cases);return{comp:"datos",skill:"Probabilidad",answer:c.a,question:`Clasifica esta situación: “${c.q}”. 1=imposible, 2=posible, 3=seguro.`,hints:["Imposible no puede pasar; seguro siempre pasa; posible puede pasar o no.","Piensa en todos los resultados que podrían ocurrir.",`La respuesta es ${c.a===1?"imposible":c.a===2?"posible":"seguro"}.`],explain:`Esta situación es ${c.a===1?"imposible":c.a===2?"posible":"segura"}.`,visual:{type:"dice"}};
  }

  function qWord(r,s){
    const type=int(r,0,5);
    if(type===0)return qAddSub(r,s);if(type===1)return qMultiply(r,s);if(type===2)return qDivide(r,s);if(type===3)return qMoney(r,s);if(type===4)return qPerimeter(r,s);return qData(r,s);
  }

  function renderVisual(v){
    if(!v)return"<div class='equation-big'>✨</div>";
    if(v.type==="equation")return`<div class="equation-big">${v.text}</div>`;
    if(v.type==="place"){const ds=String(v.n).split("");const heads=["CM","DM","UM","C","D","U"].slice(6-ds.length);return`<table class="place-table"><tr>${heads.map(h=>`<th>${h}</th>`).join("")}</tr><tr>${ds.map(d=>`<td>${d}</td>`).join("")}</tr></table>`}
    if(v.type==="compare")return`<div class="equation-big">${v.a.toLocaleString("es-PE")} &nbsp; ? &nbsp; ${v.b.toLocaleString("es-PE")}</div>`;
    if(v.type==="numberline")return`<svg class="math-svg" viewBox="0 0 500 150" aria-label="Recta numérica"><line x1="50" y1="80" x2="450" y2="80" stroke="#8f8aa5" stroke-width="5"/><circle cx="250" cy="80" r="12" fill="#6d5dfc"/><text x="250" y="55" text-anchor="middle" font-size="24" font-weight="800">${v.n}</text><text x="55" y="120" font-size="18">centena anterior</text><text x="365" y="120" font-size="18">siguiente</text></svg>`;
    if(v.type==="groups"){let html=`<div class="groups">`;for(let g=0;g<v.groups;g++){html+=`<span class="group">${Array.from({length:v.each},()=>"<i></i>").join("")}</span>`}return html+`</div>${v.label?`<small>${v.label}</small>`:""}`}
    if(v.type==="fraction"){return`<div><div class="fraction-pizza">${Array.from({length:v.den},(_,i)=>`<i class="${i<v.num?"fill":""}"></i>`).join("")}</div><div class="equation-big" style="font-size:32px;text-align:center;margin-top:12px">${v.num}/${v.den}</div></div>`}
    if(v.type==="fractionCompare")return`<div class="equation-big">${v.a}/${v.den} &nbsp; ? &nbsp; ${v.b}/${v.den}</div>`;
    if(v.type==="money")return`<div class="equation-big">💵 S/ ${v.paid}<br><span style="font-size:.55em;color:#777">precio: S/ ${v.price}</span></div>`;
    if(v.type==="clock")return`<svg class="math-svg" viewBox="0 0 300 220"><circle cx="150" cy="105" r="85" fill="#fff" stroke="#d9d6ef" stroke-width="6"/><text x="150" y="34" text-anchor="middle">12</text><text x="224" y="111">3</text><text x="150" y="190" text-anchor="middle">6</text><text x="69" y="111">9</text><line x1="150" y1="105" x2="${150+50*Math.sin(v.h*Math.PI/6)}" y2="${105-50*Math.cos(v.h*Math.PI/6)}" stroke="#6d5dfc" stroke-width="8" stroke-linecap="round"/><line x1="150" y1="105" x2="${150+68*Math.sin(v.m*Math.PI/30)}" y2="${105-68*Math.cos(v.m*Math.PI/30)}" stroke="#ff7eb6" stroke-width="5" stroke-linecap="round"/></svg>`;
    if(v.type==="sequence")return`<div class="equation-big" style="font-size:clamp(26px,5vw,48px)">${v.seq.join(" → ")} → ?</div>`;
    if(v.type==="polygon"){const n=v.sides;const pts=Array.from({length:n},(_,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return`${250+100*Math.cos(a)},${130+100*Math.sin(a)}`}).join(" ");return`<svg class="math-svg" viewBox="0 0 500 270"><polygon points="${pts}" fill="#edeaff" stroke="#6d5dfc" stroke-width="6"/></svg>`}
    if(v.type==="angle"){const rad=v.angle*Math.PI/180,x=250+130*Math.cos(-rad),y=180+130*Math.sin(-rad);return`<svg class="math-svg" viewBox="0 0 500 270"><line x1="250" y1="180" x2="390" y2="180" stroke="#6d5dfc" stroke-width="8"/><line x1="250" y1="180" x2="${x}" y2="${y}" stroke="#ff7eb6" stroke-width="8"/><text x="270" y="155" font-size="26" font-weight="800">${v.angle}°</text></svg>`}
    if(v.type==="line"){const lines={1:[250,35,250,220],2:[70,130,430,130],3:[95,210,405,45]};const p=lines[v.kind];return`<svg class="math-svg" viewBox="0 0 500 260"><line x1="${p[0]}" y1="${p[1]}" x2="${p[2]}" y2="${p[3]}" stroke="#6d5dfc" stroke-width="12" stroke-linecap="round"/></svg>`}
    if(v.type==="rect")return`<svg class="math-svg" viewBox="0 0 500 270"><rect x="90" y="55" width="320" height="160" rx="8" fill="#e8f7ff" stroke="#54b7f3" stroke-width="6"/><text x="250" y="245" text-anchor="middle" font-size="24" font-weight="800">${v.a}</text><text x="430" y="140" font-size="24" font-weight="800">${v.b}</text>${v.area?"<path d='M110 80h280M110 115h280M110 150h280M110 185h280' stroke='#bfe4f7' stroke-width='2'/>":""}</svg>`;
    if(v.type==="square")return`<svg class="math-svg" viewBox="0 0 400 280"><rect x="90" y="35" width="210" height="210" rx="8" fill="#f0edff" stroke="#6d5dfc" stroke-width="6"/><text x="195" y="272" text-anchor="middle" font-size="24" font-weight="800">${v.a}</text></svg>`;
    if(v.type==="kite")return`<svg class="math-svg" viewBox="0 0 420 300"><polygon points="210,25 340,135 210,275 80,135" fill="#fff0f7" stroke="#ff7eb6" stroke-width="6"/><text x="115" y="80" font-size="20">${v.a}</text><text x="290" y="80" font-size="20">${v.a}</text><text x="112" y="220" font-size="20">${v.b}</text><text x="290" y="220" font-size="20">${v.b}</text></svg>`;
    if(v.type==="grid"){const cell=Math.min(42,260/Math.max(v.w,v.h)),W=v.w*cell,H=v.h*cell;let s=`<svg class="math-svg" viewBox="0 0 ${W+20} ${H+20}">`;for(let y=0;y<v.h;y++)for(let x=0;x<v.w;x++)s+=`<rect x="${10+x*cell}" y="${10+y*cell}" width="${cell}" height="${cell}" fill="#dff3ff" stroke="#54b7f3"/>`;return s+"</svg>"}
    if(v.type==="halfgrid"){const cols=5,rows=Math.ceil(v.full/cols);let c=0,s=`<svg class="math-svg" viewBox="0 0 320 ${rows*52+80}">`;for(let y=0;y<rows;y++)for(let x=0;x<cols&&c<v.full;x++,c++)s+=`<rect x="${20+x*52}" y="${15+y*52}" width="48" height="48" fill="#dff3ff" stroke="#54b7f3"/>`;s+=`<polygon points="20,${rows*52+20} 68,${rows*52+20} 20,${rows*52+68}" fill="#dff3ff" stroke="#54b7f3"/><polygon points="78,${rows*52+20} 126,${rows*52+20} 126,${rows*52+68}" fill="#dff3ff" stroke="#54b7f3"/>`;return s+"</svg>"}
    if(v.type==="compass"){const arrows=["↑","→","↓","←"];return`<div class="equation-big" style="font-size:90px">${arrows[v.dir]}</div>`}
    if(v.type==="bars"){const max=Math.max(...v.vals);return`<div class="bar-chart">${v.vals.map((x,i)=>`<div style="height:${30+x/max*100}px"><span>${v.labels[i]}<br>${x}</span></div>`).join("")}</div>`}
    if(v.type==="dice")return`<div class="equation-big">🎲 ?</div>`;
    return`<div class="equation-big">✨</div>`;
  }

  function startChallenge(newMode="adventure",topic=null){
    mode=newMode;topicOverride=topic;modeStep=0;modeCorrect=0;returnView=newMode==="adventure"?"worlds":newMode==="calm"?"home":newMode==="training"?"topics":"play";showView("challenge");loadChallenge();
  }
  function modeTopic(){
    if(topicOverride)return topicOverride;
    if(mode==="market")return"money";if(mode==="detective")return Math.random()>.3?"data":"chance";if(mode==="bubbles")return pick(Math.random,["addsub"]);
    return null;
  }
  function loadChallenge(similar=false){
    selected=null;hints=0;const forced=topicOverride||(mode==="market"?"money":mode==="detective"?(Math.random()>.25?"data":"chance"):null);active=makeQuestion(state.level,forced,modeStep+(similar?777:0));
    $("modeLabel").textContent=modeTitle(mode);$("levelLabel").textContent=mode==="adventure"?`Nivel ${state.level.toLocaleString("es-PE")}`:`Reto ${modeStep+1}`;$("levelBar").style.width=mode==="adventure"?`${((state.level-1)%2000+1)/20}%`:`${Math.min(100,modeStep/10*100)}%`;
    $("competencyTag").textContent=COMP[active.comp]||COMP.cantidad;$("skillTag").textContent=active.skill;$("difficultyTag").textContent=mode==="calm"?"🌿 Sin reloj":active.difficulty;$("visualArea").innerHTML=renderVisual(active.visual);$("questionText").textContent=active.question;$("feedback").textContent="";$("feedback").className="feedback";$("coachText").textContent=coachStart();$("coachMood").textContent=mode==="calm"?"Vamos con calma":"Estoy contigo";$("hintDots").querySelectorAll("i").forEach(i=>i.classList.remove("on"));renderAnswers();
  }
  function coachStart(){const n=state.name?` ${state.name}`:"";const arr=[`Vamos${n}. Lee primero qué te están preguntando.`,`Tómate tu tiempo${n}. No hay problema si necesitas una pista.`,`Mira el dibujo y busca los datos importantes${n}.`,`Antes de calcular, piensa: ¿qué operación o idea necesitas?`];return arr[(state.total+modeStep)%arr.length]}
  function modeTitle(m){return({adventure:"🗺️ Aventura",calm:"🌿 Zona calma",training:"🎯 Práctica",stars:"🌠 Carrera",treasure:"🏴‍☠️ Tesoro",bubbles:"🫧 Burbujas",market:"🛒 Mercadito",detective:"🔎 Detective"})[m]||"🎮 Juego"}
  function renderAnswers(){
    const area=$("answerArea");area.innerHTML="";
    if(active.kind==="input" || active.answer>9999 || (mode==="calm"&&Math.random()>.7)){
      area.innerHTML=`<div class="number-answer"><input id="numberInput" inputmode="numeric" aria-label="Escribe tu respuesta" placeholder="Escribe tu respuesta"/><span class="unit-chip">${active.unit||"#"}</span></div>`;setTimeout(()=>$("numberInput")?.focus(),80);return;
    }
    const opts=active.options.length?active.options:makeOptions(rng(active.level+modeStep+44),active.answer);
    opts.forEach(v=>{const b=document.createElement("button");b.className="answer-choice";b.type="button";b.textContent=`${v}${active.unit?` ${active.unit}`:""}`;b.dataset.value=String(v);b.addEventListener("click",()=>{selected=v;qsa(".answer-choice").forEach(x=>x.classList.toggle("selected",x===b))});area.appendChild(b)});
  }
  function readUserAnswer(){const inp=$("numberInput");if(inp){const n=Number(String(inp.value).replace(",","."));return Number.isFinite(n)?n:null}return selected}
  function check(){
    const given=readUserAnswer();if(given===null){feedback("Elige o escribe una respuesta primero 😊","try");return}
    state.total++;const ok=String(given)===String(active.answer);
    if(ok){state.correct++;state.streak++;state.best=Math.max(state.best,state.streak);const bonus=10+Math.min(10,state.streak);state.stars+=bonus;state.mastery[active.topic]=(state.mastery[active.topic]||0)+1;state.daily.count++;
      if(state.daily.count>=5&&!state.daily.claimed){state.gems+=3;state.daily.claimed=true;showModal("🎁","¡Misión diaria completada!","Ganaste 3 gemas por practicar hoy.")}
      if(mode==="treasure"&&((modeCorrect+1)%3===0)){state.gems++;}
      if(mode==="adventure") state.level=Math.min(TOTAL_LEVELS,state.level+1);modeCorrect++;feedback(pick(rng(state.total),["¡Eso es! ⭐","¡Muy bien pensado! 🌟","¡Correcto! Aisha está orgullosa de tu esfuerzo 💜","¡Lo lograste! ✨"]),"good");markChoices(true,given);confetti();save();setTimeout(nextAfterCorrect,850);
    }else{state.streak=0;state.mastery[active.topic]=Math.max(0,(state.mastery[active.topic]||0)-.15);save();markChoices(false,given);feedback("Casi. No pasa nada 💜. Mira una pista y vuelve a intentarlo.","try");$("coachText").textContent="No voy a darte la respuesta de golpe. Vamos a encontrarla juntos: usa una pista.";}
  }
  function markChoices(ok,given){qsa(".answer-choice").forEach(b=>{const val=Number(b.dataset.value);if(ok&&val===active.answer)b.classList.add("correct");else if(!ok&&val===Number(given))b.classList.add("wrong");b.disabled=ok});if(!ok){selected=null;qsa(".answer-choice").forEach(b=>b.classList.remove("selected"))}}
  function nextAfterCorrect(){
    if(mode!=="adventure"&&mode!=="calm"&&mode!=="training"){modeStep++;if(modeStep>=10){const extra=modeCorrect>=8?2:modeCorrect>=5?1:0;state.gems+=extra;save();showModal("🏆","Ronda terminada",`Acertaste ${modeCorrect} de 10.${extra?` Ganaste ${extra} gema${extra>1?"s":""}.`:" ¡Puedes jugar otra ronda cuando quieras!"}`);showView("play");return}}
    else if(mode!=="adventure")modeStep++;
    loadChallenge();
  }
  function feedback(t,c){$("feedback").textContent=t;$("feedback").className=`feedback ${c}`}

  function hint(){hints=Math.min(3,hints+1);$("hintDots").querySelectorAll("i").forEach((i,idx)=>i.classList.toggle("on",idx<hints));const text=active.hints[Math.min(hints-1,active.hints.length-1)];$("coachText").textContent=text;showModal("💡",`Pista ${hints}`,text)}
  function explain(){const steps=active.hints.map((h,i)=>`<p><b>${i+1}.</b> ${h}</p>`).join("")+`<p><b>Idea clave:</b> ${active.explain}</p>`;showModal("🧩","Paso a paso",steps,true)}
  function showModal(icon,title,text,html=false){$("modalIcon").textContent=icon;$("modalTitle").textContent=title;$("modalText")[html?"innerHTML":"textContent"]=text;$("modal").classList.remove("hidden")}
  function closeModal(){$("modal").classList.add("hidden")}
  function speak(text){if(!state.sound||!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="es-PE";u.rate=.92;u.pitch=1.05;window.speechSynthesis.speak(u)}
  function confetti(){const box=$("confetti");for(let i=0;i<26;i++){const p=document.createElement("i");p.style.left=Math.random()*100+"%";p.style.background=["#6d5dfc","#ff7eb6","#54b7f3","#50c990","#ffc857"][i%5];p.style.animationDelay=Math.random()*.35+"s";box.appendChild(p);setTimeout(()=>p.remove(),1900)}}

  function renderTopics(){const g=$("topicGrid");g.innerHTML="";TOPICS.forEach(t=>{const b=document.createElement("button");b.className="topic-card";b.innerHTML=`<span>${t.icon}</span><b>${t.name}</b><small>${t.desc}</small><em>${COMP[t.comp]}</em>`;b.addEventListener("click",()=>startChallenge("training",t.id));g.appendChild(b)})}
  function renderWorlds(){const g=$("worldGrid");g.innerHTML="";WORLDS.forEach((w,i)=>{const passed=Math.max(0,Math.min(2000,state.level-w.start));const b=document.createElement("button");b.className="world-card";b.innerHTML=`<div class="world-top"><span class="world-icon">${w.icon}</span><span class="world-num">MUNDO ${i+1}</span></div><h3>${w.name}</h3><p>${w.desc}</p><div class="world-progress"><i style="width:${passed/20}%"></i></div>`;b.addEventListener("click",()=>{state.level=Math.max(state.level,w.start);save();startChallenge("adventure")});g.appendChild(b)})}
  function renderProgress(){
    const list=$("masteryList");list.innerHTML="";TOPICS.forEach(t=>{const raw=Math.max(0,state.mastery[t.id]||0);const pct=Math.min(100,Math.round(raw/25*100));const row=document.createElement("div");row.className="mastery-row";row.innerHTML=`<b>${t.icon} ${t.name}</b><div class="track"><i style="width:${pct}%"></i></div><small>${pct}%</small>`;list.appendChild(row)});
    const badges=$("badgeGrid");badges.innerHTML="";BADGES.forEach(b=>{const unlocked=state.correct>=b.n;const el=document.createElement("div");el.className=`badge ${unlocked?"unlocked":""}`;el.innerHTML=`<span>${unlocked?b.icon:"🔒"}</span><b>${b.name}</b><small>${unlocked?"Desbloqueada":`${b.n} correctas`}</small>`;badges.appendChild(el)})
  }

  function newMemory(){
    memoryLock=false;memoryOpen=[];memoryMatched=0;memoryMoves=0;$("memoryMoves").textContent="0";$("memoryPairs").textContent="0";const r=rng(Date.now());const pairs=[];for(let i=0;i<6;i++){const a=int(r,2,12),b=int(r,2,12),ans=a*b;pairs.push({id:i,text:`${a} × ${b}`},{id:i,text:String(ans)})}const cards=shuffle(r,pairs);const g=$("memoryGrid");g.innerHTML="";cards.forEach((c,idx)=>{const b=document.createElement("button");b.className="memory-card";b.textContent=c.text;b.dataset.pair=c.id;b.dataset.idx=idx;b.addEventListener("click",()=>flipMemory(b));g.appendChild(b)})
  }
  function flipMemory(card){if(memoryLock||card.classList.contains("open")||card.classList.contains("matched"))return;card.classList.add("open");memoryOpen.push(card);if(memoryOpen.length<2)return;memoryMoves++;$("memoryMoves").textContent=memoryMoves;const[a,b]=memoryOpen;if(a.dataset.pair===b.dataset.pair){a.classList.add("matched");b.classList.add("matched");a.classList.remove("open");b.classList.remove("open");memoryMatched++;$("memoryPairs").textContent=memoryMatched;memoryOpen=[];state.stars+=4;state.correct++;save();if(memoryMatched===6){state.gems++;save();setTimeout(()=>showModal("🧠","¡Memoria completa!",`Lo lograste en ${memoryMoves} movimientos. Ganaste 1 gema.`),350)}}else{memoryLock=true;setTimeout(()=>{a.classList.remove("open");b.classList.remove("open");memoryOpen=[];memoryLock=false},750)}}

  function startMode(m){
    if(m==="adventure"){showView("worlds");return}if(m==="memory"){showView("memory");newMemory();return}if(m==="calm"){startChallenge("calm");return}startChallenge(m)
  }

  function bind(){
    qsa("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
    qsa("[data-mode]").forEach(b=>b.addEventListener("click",()=>startMode(b.dataset.mode)));
    $("continueBtn").addEventListener("click",()=>startChallenge("adventure"));$("challengeBack").addEventListener("click",()=>showView(returnView));$("checkAnswer").addEventListener("click",check);$("newSimilar").addEventListener("click",()=>loadChallenge(true));$("hintBtn").addEventListener("click",hint);$("explainBtn").addEventListener("click",explain);$("readQuestion").addEventListener("click",()=>speak(active.question));$("soundToggle").addEventListener("click",()=>{state.sound=!state.sound;save();$("soundToggle").textContent=state.sound?"🔊":"🔇"});
    $("speakHello").addEventListener("click",()=>speak(`Hola${state.name?" "+state.name:""}. Soy Aisha. Vamos a aprender matemáticas jugando. Si algo cuesta, te daré pistas.`));
    $("changeName").addEventListener("click",()=>{$("nameInput").value=state.name;$("nameModal").classList.remove("hidden");setTimeout(()=>$("nameInput").focus(),80)});$("nameCancel").addEventListener("click",()=>$("nameModal").classList.add("hidden"));$("nameForm").addEventListener("submit",e=>{e.preventDefault();state.name=$("nameInput").value.trim().slice(0,18);save();$("nameModal").classList.add("hidden");$("aishaSpeech").textContent=`“¡Listo${state.name?", "+state.name:""}! Vamos a aprender a tu ritmo 💜”`});
    $("modalClose").addEventListener("click",closeModal);$("modalOk").addEventListener("click",closeModal);$("modal").addEventListener("click",e=>{if(e.target===$("modal"))closeModal()});$("memoryReset").addEventListener("click",newMemory);
    $("resetProgress").addEventListener("click",()=>{showModal("⚠️","Reiniciar progreso",`Para evitar borrarlo por accidente, mantén presionado el botón “Reiniciar progreso” durante 2 segundos.`)});let hold;$("resetProgress").addEventListener("pointerdown",()=>{hold=setTimeout(()=>{localStorage.removeItem(KEY);state={...DEFAULT};save();renderProgress();showModal("🌱","Progreso reiniciado","Aisha empieza una nueva aventura desde el nivel 1.")},2000)});["pointerup","pointerleave","pointercancel"].forEach(ev=>$("resetProgress").addEventListener(ev,()=>clearTimeout(hold)));
    document.addEventListener("keydown",e=>{if(e.key==="Enter"&&!$("challengeView").classList.contains("hidden")&&!$("modal").classList.contains("hidden"))return;if(e.key==="Enter"&&!$("challengeView").classList.contains("hidden"))check()});
  }

  function init(){refreshDaily();renderTopics();renderWorlds();updateStats();bind();$("soundToggle").textContent=state.sound?"🔊":"🔇";if(!state.name)setTimeout(()=>$("nameModal").classList.remove("hidden"),650)}
  init();
})();
