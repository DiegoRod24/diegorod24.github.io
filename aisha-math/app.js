const AishaMath = (() => {
  const TOTAL_LEVELS = 10000;
  const WORLDS = [
    {id:"perimetro", name:"Reino del Perímetro", icon:"🪁", range:[1,1000], desc:"Rodea cometas, jardines y figuras sumando todos sus lados.", color:"#6d5dfc"},
    {id:"area", name:"Ciudad del Área", icon:"🟦", range:[1001,2000], desc:"Cuenta cuadraditos y descubre cuánto espacio ocupa cada figura.", color:"#3db7e4"},
    {id:"sumaResta", name:"Bosque de Sumas y Restas", icon:"🌳", range:[2001,3000], desc:"Combina cantidades y resuelve pequeñas aventuras.", color:"#54c993"},
    {id:"multiplica", name:"Planeta Multiplicación", icon:"🚀", range:[3001,4000], desc:"Domina grupos iguales y las tablas paso a paso.", color:"#ff8d68"},
    {id:"divide", name:"Islas de la División", icon:"🏝️", range:[4001,5000], desc:"Reparte en partes iguales sin perderte en el camino.", color:"#7e8cff"},
    {id:"fracciones", name:"Laboratorio de Fracciones", icon:"🍕", range:[5001,6000], desc:"Parte, compara y completa fracciones con dibujos.", color:"#ef7daf"},
    {id:"geometria", name:"Castillo de Geometría", icon:"🏰", range:[6001,7000], desc:"Conoce lados, vértices, ángulos y figuras.", color:"#a27ae8"},
    {id:"patrones", name:"Cueva de Patrones", icon:"🔮", range:[7001,8000], desc:"Encuentra reglas, secuencias y pistas escondidas.", color:"#e5a52f"},
    {id:"problemas", name:"Villa de Problemas", icon:"📚", range:[8001,9000], desc:"Convierte historias cotidianas en operaciones.", color:"#4ca8a0"},
    {id:"reto", name:"Torre Gran Reto", icon:"🏆", range:[9001,10000], desc:"Mezcla todo lo aprendido y demuestra tu progreso.", color:"#d26a92"}
  ];

  const defaultProgress = {
    currentLevel: 1, xp: 0, streak: 0, bestStreak: 0, correct: 0,
    sound: true, mastery: {}, completed: {}
  };
  let progress = loadProgress();
  let current = null;
  let selectedAnswer = null;
  let hintCount = 0;
  let view = "home";

  const $ = (id) => document.getElementById(id);
  const els = {
    home:$("homeView"), worlds:$("worldsView"), game:$("gameView"), parent:$("parentView"),
    xp:$("xp"), streak:$("streak"), levelTop:$("levelTop"), worldGrid:$("worldGrid"),
    worldName:$("worldName"), levelNum:$("levelNum"), progressBar:$("progressBar"),
    difficultyTag:$("difficultyTag"), skillTag:$("skillTag"), visualArea:$("visualArea"),
    question:$("question"), answerArea:$("answerArea"), feedback:$("feedback"),
    coachMessage:$("coachMessage"), checkBtn:$("checkBtn"), soundBtn:$("soundBtn"),
    modal:$("modal"), modalIcon:$("modalIcon"), modalTitle:$("modalTitle"), modalText:$("modalText"),
    confetti:$("confetti")
  };

  function loadProgress(){
    try{
      const raw = localStorage.getItem("aishaMathProgressV1");
      if(!raw) return {...defaultProgress};
      const parsed = JSON.parse(raw);
      return {...defaultProgress, ...parsed, mastery:{...(parsed.mastery||{})}, completed:{...(parsed.completed||{})}};
    }catch{return {...defaultProgress};}
  }
  function saveProgress(){
    localStorage.setItem("aishaMathProgressV1", JSON.stringify(progress));
    updateStats();
  }
  function updateStats(){
    els.xp.textContent = progress.xp;
    els.streak.textContent = progress.streak;
    els.levelTop.textContent = progress.currentLevel;
    els.soundBtn.textContent = progress.sound ? "🔊" : "🔇";
  }

  function rng(seed){
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  const pick = (r, arr) => arr[Math.floor(r()*arr.length)];
  const int = (r,min,max) => Math.floor(r()*(max-min+1))+min;
  const shuffle = (r, arr) => {
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  };
  function worldForLevel(level){ return WORLDS.find(w=>level>=w.range[0]&&level<=w.range[1]) || WORLDS[0]; }
  function localLevel(level, world){ return level-world.range[0]+1; }
  function difficulty(level, world){
    const n=localLevel(level,world);
    if(n<=250) return "Fácil";
    if(n<=600) return "Intermedio";
    if(n<=850) return "Avanzado";
    return "Experto";
  }
  function boundedNumber(local, base=10){
    if(local<=250) return base;
    if(local<=600) return base*2;
    if(local<=850) return base*5;
    return base*10;
  }
  function options(r, answer){
    const delta=Math.max(1,Math.round(Math.abs(answer)*0.12));
    const vals=new Set([answer]);
    const candidates=[answer+1,answer-1,answer+2,answer-2,answer+delta,answer-delta,answer+delta*2,answer-delta*2];
    for(const v of shuffle(r,candidates)){ if(v>=0) vals.add(v); if(vals.size===4) break; }
    while(vals.size<4) vals.add(answer+vals.size+1);
    return shuffle(r,[...vals]);
  }

  function makeQuestion(level){
    const world=worldForLevel(level), local=localLevel(level,world), r=rng(level*7919+17);
    let q;
    if(world.id==="perimetro") q=perimeterQ(r,local);
    else if(world.id==="area") q=areaQ(r,local);
    else if(world.id==="sumaResta") q=sumSubQ(r,local);
    else if(world.id==="multiplica") q=multiplyQ(r,local);
    else if(world.id==="divide") q=divideQ(r,local);
    else if(world.id==="fracciones") q=fractionQ(r,local);
    else if(world.id==="geometria") q=geometryQ(r,local);
    else if(world.id==="patrones") q=patternQ(r,local);
    else if(world.id==="problemas") q=wordProblemQ(r,local);
    else q=mixedQ(r,local,level);
    q.level=level; q.world=world; q.difficulty=difficulty(level,world);
    q.options=q.options||options(r,q.answer);
    return q;
  }

  function perimeterQ(r,n){
    const max=boundedNumber(n,12), template=n<180?0:int(r,0,4);
    if(template===0){
      const a=int(r,3,max), b=int(r,3,max+6), ans=2*(a+b);
      return {skill:"Perímetro", answer:ans, unit:"cm", question:`Un rectángulo mide ${a} cm de largo y ${b} cm de ancho. ¿Cuál es su perímetro?`,
        hint:`El perímetro es todo el borde. Suma ${a} + ${b} + ${a} + ${b}.`,
        explain:`Un rectángulo tiene dos lados de ${a} cm y dos de ${b} cm. Entonces P = 2 × (${a} + ${b}) = ${ans} cm.`,
        visual:{type:"rectangle",a,b,label:"cm"}};
    }
    if(template===1){
      const a=int(r,4,max+8), b=int(r,4,max+12), ans=2*a+2*b;
      return {skill:"Perímetro",answer:ans,unit:"cm",question:`Aisha quiere decorar el borde de una cometa. Dos lados miden ${a} cm cada uno y los otros dos ${b} cm cada uno. ¿Cuánta cinta necesita?`,
        hint:`Como en la tarea de la cometa: suma sus 4 lados.`,
        explain:`${a} + ${a} + ${b} + ${b} = ${ans} cm de cinta.`,
        visual:{type:"kite",a,b,label:"cm"}};
    }
    if(template===2){
      const side=int(r,3,max), ans=4*side;
      return {skill:"Perímetro",answer:ans,unit:"m",question:`Un jardín cuadrado tiene ${side} m por lado. ¿Cuántos metros de cerco se necesitan para rodearlo?`,
        hint:`Un cuadrado tiene 4 lados iguales.`, explain:`P = 4 × ${side} = ${ans} m.`,visual:{type:"square",a:side,label:"m"}};
    }
    if(template===3){
      const sides=[int(r,4,max),int(r,4,max),int(r,4,max),int(r,4,max),int(r,4,max)];
      const ans=sides.reduce((a,b)=>a+b,0);
      return {skill:"Perímetro",answer:ans,unit:"cm",question:`Una figura tiene lados de ${sides.join(", ")} cm. ¿Cuál es su perímetro?`,
        hint:"Suma una sola vez la medida de cada lado.", explain:`${sides.join(" + ")} = ${ans} cm.`,visual:{type:"polygon",sides,label:"cm"}};
    }
    const a=int(r,8,max+10), b=int(r,6,max), ans=2*(a+b);
    return {skill:"Perímetro",answer:ans,unit:"m",question:`Una cancha rectangular mide ${a} m por ${b} m. Si das una vuelta completa por el borde, ¿cuántos metros recorres?`,
      hint:"Una vuelta completa equivale al perímetro.",explain:`2 × (${a} + ${b}) = ${ans} m.`,visual:{type:"rectangle",a,b,label:"m"}};
  }

  function areaQ(r,n){
    const max=boundedNumber(n,10), template=n<220?int(r,0,1):int(r,0,4);
    if(template===0){
      const w=int(r,3,Math.min(8,max)), h=int(r,2,Math.min(7,max)), ans=w*h;
      return {skill:"Área",answer:ans,unit:"cm²",question:`Cada cuadrito mide 1 cm². La figura tiene ${w} columnas y ${h} filas completas. ¿Cuál es su área?`,
        hint:`Cuenta los cuadrados o multiplica filas × columnas: ${h} × ${w}.`,explain:`${h} filas × ${w} columnas = ${ans} cuadritos, por eso el área es ${ans} cm².`,visual:{type:"grid",w,h}};
    }
    if(template===1){
      const full=int(r,8,20), halves=2, ans=full+1;
      return {skill:"Área contando cuadritos",answer:ans,unit:"cm²",question:`La figura tiene ${full} cuadritos completos y 2 triángulos que son medios cuadritos. Si cada cuadrito vale 1 cm², ¿cuál es el área?`,
        hint:"Los 2 triángulos juntos forman 1 cuadrito completo.",explain:`${full} cuadritos + ½ + ½ = ${full} + 1 = ${ans} cm².`,visual:{type:"halfgrid",full}};
    }
    if(template===2){
      const a=int(r,3,max+5), b=int(r,2,max), ans=a*b;
      return {skill:"Área del rectángulo",answer:ans,unit:"cm²",question:`Un rectángulo mide ${a} cm de largo y ${b} cm de ancho. ¿Cuál es su área?`,
        hint:"Para el área del rectángulo multiplica largo × ancho.",explain:`A = ${a} × ${b} = ${ans} cm².`,visual:{type:"rectangle",a,b,label:"cm",area:true}};
    }
    if(template===3){
      const a=int(r,3,max), ans=a*a;
      return {skill:"Área del cuadrado",answer:ans,unit:"m²",question:`Una habitación cuadrada mide ${a} m por lado. ¿Cuántos metros cuadrados de piso tiene?`,
        hint:"Área del cuadrado = lado × lado.",explain:`${a} × ${a} = ${ans} m².`,visual:{type:"square",a,label:"m",area:true}};
    }
    const a=int(r,5,max+8), b=int(r,3,max), ans=a*b;
    return {skill:"Área",answer:ans,unit:"m²",question:`El piso de una habitación rectangular mide ${a} m de largo y ${b} m de ancho. ¿Cuántos m² de losetas se necesitan para cubrirlo?`,
      hint:"Cubrir el piso significa calcular el área, no el perímetro.",explain:`A = ${a} × ${b} = ${ans} m².`,visual:{type:"rectangle",a,b,label:"m",area:true}};
  }

  function sumSubQ(r,n){
    const max=boundedNumber(n,20), add=r()>.45;
    let a=int(r,2,max),b=int(r,1,max);
    if(!add&&b>a)[a,b]=[b,a];
    const ans=add?a+b:a-b, op=add?"+":"−";
    const stories=add?
      [`Aisha tenía ${a} estrellas y ganó ${b} más. ¿Cuántas tiene ahora?`,`En una caja hay ${a} lápices y agregan ${b}. ¿Cuántos hay en total?`]:
      [`Había ${a} globos y se usaron ${b}. ¿Cuántos quedan?`,`Aisha reunió ${a} fichas y regaló ${b}. ¿Cuántas conserva?`];
    return {skill:add?"Suma":"Resta",answer:ans,unit:"",question:pick(r,stories),hint:add?"La palabra “más” o “en total” suele indicar suma.":"Piensa cuántos quedan después de quitar.",explain:`${a} ${op} ${b} = ${ans}.`,visual:{type:"equation",text:`${a} ${op} ${b} = ?`}};
  }
  function multiplyQ(r,n){
    const max=n<250?5:n<600?10:n<850?12:20, a=int(r,2,max),b=int(r,2,max),ans=a*b;
    return {skill:"Multiplicación",answer:ans,unit:"",question:`Hay ${a} grupos con ${b} fichas en cada grupo. ¿Cuántas fichas hay en total?`,hint:`Son grupos iguales: suma ${b} exactamente ${a} veces o multiplica ${a} × ${b}.`,explain:`${a} × ${b} = ${ans}.`,visual:{type:"groups",groups:a,each:b}};
  }
  function divideQ(r,n){
    const max=n<250?6:n<600?10:n<850?12:20,a=int(r,2,max),b=int(r,2,max),total=a*b;
    return {skill:"División",answer:b,unit:"",question:`Se reparten ${total} fichas por igual entre ${a} niños. ¿Cuántas recibe cada uno?`,hint:`Busca qué número multiplicado por ${a} da ${total}.`,explain:`${total} ÷ ${a} = ${b}.`,visual:{type:"equation",text:`${total} ÷ ${a} = ?`}};
  }
  function fractionQ(r,n){
    const den=pick(r,n<500?[2,3,4,5,6]:[4,5,6,8,10,12]),num=int(r,1,den-1);
    const askMissing=r()>.65;
    if(askMissing){
      const missing=den-num;
      return {skill:"Fracciones",answer:missing,unit:"partes",question:`Una barra está dividida en ${den} partes iguales. ${num} están coloreadas. ¿Cuántas partes faltan por colorear?`,hint:`Resta al total de partes las que ya están pintadas.`,explain:`${den} − ${num} = ${missing} partes.`,visual:{type:"fraction",num,den}};
    }
    return {skill:"Fracciones",answer:num,unit:`/${den}`,question:`La figura está dividida en ${den} partes iguales. ¿Cuántas partes están coloreadas?`,hint:"Cuenta solamente las partes coloreadas.",explain:`Hay ${num} de ${den} partes coloreadas: ${num}/${den}.`,visual:{type:"fraction",num,den}};
  }
  function geometryQ(r,n){
    const shapes=[
      {name:"triángulo",sides:3,verts:3,icon:"🔺"},{name:"cuadrado",sides:4,verts:4,icon:"⬜"},
      {name:"pentágono",sides:5,verts:5,icon:"⬟"},{name:"hexágono",sides:6,verts:6,icon:"⬡"}
    ];
    const s=pick(r,shapes), askSides=r()>.4,ans=askSides?s.sides:s.verts;
    return {skill:"Geometría",answer:ans,unit:"",question:`Observa el ${s.name}. ¿Cuántos ${askSides?"lados":"vértices"} tiene?`,hint:askSides?"Recorre el borde y cuenta cada segmento.":"Cuenta las esquinas de la figura.",explain:`Un ${s.name} tiene ${ans} ${askSides?"lados":"vértices"}.`,visual:{type:"shape",shape:s}};
  }
  function patternQ(r,n){
    const step=int(r,2,n<500?10:20),start=int(r,1,30),len=4,seq=Array.from({length:len},(_,i)=>start+i*step),ans=start+len*step;
    return {skill:"Patrones",answer:ans,unit:"",question:`Completa la secuencia: ${seq.join(", ")}, ___`,hint:`Mira cuánto aumenta de un número al siguiente.`,explain:`La regla es sumar ${step} cada vez. ${seq[len-1]} + ${step} = ${ans}.`,visual:{type:"equation",text:seq.join("  →  ")+"  →  ?"}};
  }
  function wordProblemQ(r,n){
    const mode=int(r,0,3),max=boundedNumber(n,18);
    if(mode===0){const a=int(r,5,max),b=int(r,2,max),ans=a+b;return {skill:"Problemas de suma",answer:ans,unit:"",question:`En una biblioteca había ${a} cuentos y llegaron ${b} nuevos. ¿Cuántos cuentos hay ahora?`,hint:"Llegaron más: aumenta la cantidad.",explain:`${a} + ${b} = ${ans}.`,visual:{type:"equation",text:`📚 ${a} + ${b} = ?`}};}
    if(mode===1){let a=int(r,8,max+10),b=int(r,2,a-1),ans=a-b;return {skill:"Problemas de resta",answer:ans,unit:"",question:`Había ${a} entradas y se usaron ${b}. ¿Cuántas quedan?`,hint:"Si se usan, la cantidad disminuye.",explain:`${a} − ${b} = ${ans}.`,visual:{type:"equation",text:`🎟️ ${a} − ${b} = ?`}};}
    if(mode===2){const a=int(r,2,12),b=int(r,2,10),ans=a*b;return {skill:"Problemas de multiplicación",answer:ans,unit:"",question:`Hay ${a} mesas y en cada mesa se colocan ${b} vasos. ¿Cuántos vasos se necesitan?`,hint:"Hay la misma cantidad en cada grupo.",explain:`${a} × ${b} = ${ans}.`,visual:{type:"groups",groups:a,each:b}};}
    const a=int(r,2,10),b=int(r,2,10),total=a*b;return {skill:"Problemas de división",answer:b,unit:"",question:`Se reparten ${total} caramelos por igual en ${a} bolsas. ¿Cuántos van en cada bolsa?`,hint:"Reparte el total en grupos iguales.",explain:`${total} ÷ ${a} = ${b}.`,visual:{type:"equation",text:`🍬 ${total} ÷ ${a} = ?`}};
  }
  function mixedQ(r,n,level){
    const mode=int(r,0,7);
    if(mode===0) return perimeterQ(r,700+n%300);
    if(mode===1) return areaQ(r,700+n%300);
    if(mode===2) return sumSubQ(r,700+n%300);
    if(mode===3) return multiplyQ(r,700+n%300);
    if(mode===4) return divideQ(r,700+n%300);
    if(mode===5) return fractionQ(r,700+n%300);
    if(mode===6) return geometryQ(r,700+n%300);
    return wordProblemQ(r,700+n%300);
  }

  function renderWorlds(){
    els.worldGrid.innerHTML="";
    WORLDS.forEach(w=>{
      const card=document.createElement("button");
      card.className="world-card";
      card.style.setProperty("--worldBg",w.color+"18");
      const reached=Math.max(0,Math.min(1000,progress.currentLevel-w.range[0]+1));
      const pct=Math.round(reached/1000*100);
      card.innerHTML=`<div class="world-icon">${w.icon}</div><h3>${w.name}</h3><p>${w.desc}</p><div class="range"><span>Niveles ${w.range[0]}–${w.range[1]}</span><span>${pct}%</span></div><div class="world-progress"><i style="width:${pct}%;background:${w.color}"></i></div>`;
      card.addEventListener("click",()=>startLevel(Math.max(w.range[0],Math.min(progress.currentLevel,w.range[1]))));
      els.worldGrid.appendChild(card);
    });
  }

  function showView(name){
    view=name;
    [els.home,els.worlds,els.game,els.parent].forEach(v=>v.classList.add("hidden"));
    ({home:els.home,worlds:els.worlds,game:els.game,parent:els.parent}[name]||els.home).classList.remove("hidden");
    document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.nav===name));
    if(name==="worlds") renderWorlds();
    if(name==="parent") renderReport();
    if(name==="game"&&!current) startLevel(progress.currentLevel);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function startLevel(level){
    level=Math.max(1,Math.min(TOTAL_LEVELS,Number(level)||1));
    current=makeQuestion(level); selectedAnswer=null; hintCount=0;
    progress.currentLevel=Math.max(progress.currentLevel,level);
    saveProgress();
    renderQuestion();
    showView("game");
    setCoach("¡Vamos! Lee con calma. Si te trabas, toca 💡 Pista.");
    if(progress.sound) setTimeout(()=>speak(current.question),250);
  }

  function renderQuestion(){
    const w=current.world;
    els.worldName.textContent=`${w.icon} ${w.name}`;
    els.levelNum.textContent=current.level;
    els.progressBar.style.width=`${Math.max(1,localLevel(current.level,w)/1000*100)}%`;
    els.difficultyTag.textContent=current.difficulty;
    els.skillTag.textContent=current.skill;
    els.question.textContent=current.question;
    els.feedback.textContent=""; els.feedback.className="feedback";
    renderVisual(current.visual);
    renderAnswers();
  }

  function renderAnswers(){
    els.answerArea.innerHTML="";
    const r=rng(current.level*3571);
    current.options=shuffle(r,current.options);
    current.options.forEach(value=>{
      const b=document.createElement("button");b.className="answer-option";b.dataset.value=String(value);
      b.textContent=`${value}${current.unit?` ${current.unit}`:""}`;
      b.addEventListener("click",()=>{selectedAnswer=value;document.querySelectorAll(".answer-option").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");els.feedback.textContent="";});
      els.answerArea.appendChild(b);
    });
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(SR){
      const voice=document.createElement("button");voice.className="answer-option";voice.style.gridColumn="1 / -1";voice.textContent="🎙️ Responder hablando";
      voice.addEventListener("click",()=>listenAnswer(SR,voice)); els.answerArea.appendChild(voice);
    }
  }

  function renderVisual(v){
    const host=els.visualArea;host.innerHTML="";
    if(!v){host.innerHTML='<div class="equation-visual">🧠</div>';return;}
    if(v.type==="equation"){host.innerHTML=`<div class="equation-visual">${v.text}</div>`;return;}
    if(v.type==="groups"){
      const row=document.createElement("div");row.className="object-row";
      for(let g=0;g<v.groups;g++){const d=document.createElement("div");d.style.cssText="padding:8px;border:2px dashed #d9dcef;border-radius:14px;display:flex;gap:4px;flex-wrap:wrap;max-width:140px";for(let i=0;i<v.each;i++){const dot=document.createElement("span");dot.className="object-dot";dot.textContent="●";d.appendChild(dot)}row.appendChild(d)}host.appendChild(row);return;
    }
    if(v.type==="fraction"){const bar=document.createElement("div");bar.className="fraction-bar";for(let i=0;i<v.den;i++){const p=document.createElement("i");p.className="fraction-part"+(i<v.num?" fill":"");bar.appendChild(p)}host.appendChild(bar);return;}
    if(v.type==="shape"){host.innerHTML=`<div class="equation-visual" style="font-size:90px">${v.shape.icon}</div><div style="font-weight:900">${v.shape.name}</div>`;return;}
    if(v.type==="grid"){
      const grid=document.createElement("div");grid.className="grid-shape";grid.style.gridTemplateColumns=`repeat(${v.w},30px)`;
      for(let i=0;i<v.w*v.h;i++){const c=document.createElement("span");c.className="grid-cell fill";grid.appendChild(c)}host.appendChild(grid);return;
    }
    if(v.type==="halfgrid"){
      const count=Math.min(v.full,20),wrap=document.createElement("div");wrap.style.cssText="display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;max-width:500px";
      for(let i=0;i<count;i++){const c=document.createElement("span");c.className="grid-cell fill";wrap.appendChild(c)}
      for(let i=0;i<2;i++){const t=document.createElement("span");t.style.cssText=`width:30px;height:30px;border:1px solid #75c6e9;background:linear-gradient(${i?"225deg":"45deg"},#9edfff 50%,#fff 50%)`;wrap.appendChild(t)}
      host.appendChild(wrap);return;
    }
    host.innerHTML=svgFigure(v);
  }

  function svgFigure(v){
    if(v.type==="rectangle"){
      return `<svg class="geometry-svg" viewBox="0 0 430 220" role="img" aria-label="Rectángulo de ${v.a} por ${v.b} ${v.label}"><rect x="85" y="38" width="260" height="140" rx="8" fill="#dff5ff" stroke="#5d6b89" stroke-width="4"/><text x="215" y="207" text-anchor="middle" font-size="20" font-weight="800" fill="#4f5571">${v.a} ${v.label}</text><text x="370" y="115" font-size="20" font-weight="800" fill="#4f5571">${v.b} ${v.label}</text>${v.area?'<path d="M110 60h210M110 90h210M110 120h210M110 150h210M140 50v115M180 50v115M220 50v115M260 50v115M300 50v115" stroke="#83cde8" stroke-width="1" opacity=".6"/>':""}</svg>`;
    }
    if(v.type==="square"){
      return `<svg class="geometry-svg" viewBox="0 0 350 260"><rect x="75" y="25" width="190" height="190" rx="8" fill="#efeaff" stroke="#5d6b89" stroke-width="4"/><text x="170" y="246" text-anchor="middle" font-size="20" font-weight="800" fill="#4f5571">${v.a} ${v.label}</text><text x="282" y="125" font-size="20" font-weight="800" fill="#4f5571">${v.a} ${v.label}</text></svg>`;
    }
    if(v.type==="kite"){
      return `<svg class="geometry-svg" viewBox="0 0 380 300"><polygon points="190,20 320,125 190,275 60,125" fill="#f5eaff" stroke="#5d6b89" stroke-width="4"/><line x1="190" y1="20" x2="190" y2="275" stroke="#c0b7df" stroke-width="2"/><line x1="60" y1="125" x2="320" y2="125" stroke="#c0b7df" stroke-width="2"/><text x="95" y="72" font-size="19" font-weight="800">${v.a} ${v.label}</text><text x="245" y="72" font-size="19" font-weight="800">${v.a} ${v.label}</text><text x="85" y="215" font-size="19" font-weight="800">${v.b} ${v.label}</text><text x="245" y="215" font-size="19" font-weight="800">${v.b} ${v.label}</text></svg>`;
    }
    if(v.type==="polygon"){
      return `<svg class="geometry-svg" viewBox="0 0 400 280"><polygon points="200,20 360,110 300,250 90,240 35,100" fill="#e8f8ff" stroke="#5d6b89" stroke-width="4"/><text x="200" y="145" text-anchor="middle" font-size="22" font-weight="900" fill="#565c79">Suma sus 5 lados</text></svg>`;
    }
    return `<div class="equation-visual">📐</div>`;
  }

  function checkAnswer(){
    if(selectedAnswer===null){setFeedback("Elige una respuesta primero 👆","bad");return;}
    if(Number(selectedAnswer)===Number(current.answer)){
      const first=!progress.completed[current.level];
      progress.completed[current.level]=true;
      const gain=first?10:3; progress.xp+=gain;progress.correct+=1;progress.streak+=1;progress.bestStreak=Math.max(progress.bestStreak,progress.streak);
      progress.mastery[current.skill]=(progress.mastery[current.skill]||0)+1;
      if(current.level===progress.currentLevel&&progress.currentLevel<TOTAL_LEVELS) progress.currentLevel++;
      saveProgress();setFeedback(`¡Excelente! +${gain} XP ⭐`,"good");setCoach(pick(rng(Date.now()),["¡Lo lograste! 🌟","¡Muy bien pensado! 💜","¡Eso es! Tu estrategia funcionó 🙌","¡Nivel superado! Vamos creciendo 🚀"]));
      celebrate(); if(progress.sound) speak("¡Muy bien! Respuesta correcta.");
      els.checkBtn.textContent=current.level<TOTAL_LEVELS?"Siguiente nivel →":"¡Completaste la torre! 🏆";
      els.checkBtn.dataset.next="1";
    }else{
      progress.streak=0;saveProgress();setFeedback("Casi. No pasa nada: revisemos una pista y vuelve a intentar 💜","bad");setCoach("No te diré la respuesta todavía. Mira la pista, revisa la operación y prueba otra vez.");
      document.querySelector(".challenge-card").classList.add("shake");setTimeout(()=>document.querySelector(".challenge-card").classList.remove("shake"),380);
      if(progress.sound) speak("Casi. Vamos a revisar una pista y lo intentamos otra vez.");
    }
  }

  function nextOrCheck(){
    if(els.checkBtn.dataset.next==="1"){delete els.checkBtn.dataset.next;els.checkBtn.textContent="Comprobar ✓";startLevel(Math.min(TOTAL_LEVELS,current.level+1));}
    else checkAnswer();
  }
  function setFeedback(text,type){els.feedback.textContent=text;els.feedback.className=`feedback ${type||""}`;}
  function setCoach(text){els.coachMessage.textContent=text;}
  function showModal(icon,title,text){els.modalIcon.textContent=icon;els.modalTitle.textContent=title;els.modalText.textContent=text;els.modal.classList.remove("hidden");}
  function closeModal(){els.modal.classList.add("hidden");}
  function showHint(){hintCount++;showModal("💡",`Pista ${Math.min(hintCount,2)}`,hintCount===1?current.hint:`Piensa así: ${current.explain.replace(String(current.answer),"___")}`);if(progress.sound)speak(hintCount===1?current.hint:"Te doy otra ayuda. "+current.hint);}
  function explain(){showModal("🧠","Aisha te explica",current.explain);if(progress.sound)speak(current.explain);}
  function speak(text){
    if(!progress.sound||!("speechSynthesis" in window))return;
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text.replace(/cm²/g,"centímetros cuadrados").replace(/m²/g,"metros cuadrados"));
    u.lang="es-PE";u.rate=.92;u.pitch=1.08;
    const voices=speechSynthesis.getVoices();const voice=voices.find(v=>v.lang.toLowerCase().startsWith("es")&&/female|mujer|sabina|helena|paulina|monica/i.test(v.name))||voices.find(v=>v.lang.toLowerCase().startsWith("es"));
    if(voice)u.voice=voice;speechSynthesis.speak(u);
  }
  function listenAnswer(SR,button){
    try{
      const rec=new SR();rec.lang="es-PE";rec.interimResults=false;rec.maxAlternatives=1;button.textContent="🎙️ Te escucho…";
      rec.onresult=(e)=>{const said=e.results[0][0].transcript.toLowerCase();const nums=said.match(/-?\d+(?:[.,]\d+)?/g);const spoken=nums?Number(nums[0].replace(",",".")):wordToNumber(said);if(spoken!==null){selectedAnswer=spoken;setFeedback(`Escuché: ${spoken}. Ahora toca “Comprobar”.`,"good");document.querySelectorAll(".answer-option").forEach(b=>b.classList.toggle("selected",Number(b.dataset.value)===spoken));}else setFeedback("No pude reconocer un número. Puedes tocar una opción.","bad");};
      rec.onerror=()=>setFeedback("No pude usar el micrófono. Puedes responder tocando una opción.","bad");
      rec.onend=()=>button.textContent="🎙️ Responder hablando";rec.start();
    }catch{setFeedback("El reconocimiento de voz no está disponible aquí.","bad");}
  }
  function wordToNumber(s){
    const map={cero:0,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,dieciséis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20};
    for(const [k,v] of Object.entries(map))if(s.includes(k))return v;return null;
  }
  function celebrate(){
    const card=document.querySelector(".challenge-card");card.classList.add("celebrate");setTimeout(()=>card.classList.remove("celebrate"),500);
    const colors=["#6d5dfc","#ff7eb6","#63d7ff","#55d69e","#ffd66b"];
    for(let i=0;i<35;i++){const c=document.createElement("i");c.style.left=Math.random()*100+"%";c.style.background=colors[i%colors.length];c.style.animationDelay=Math.random()*.25+"s";els.confetti.appendChild(c);setTimeout(()=>c.remove(),1900);}
  }

  function renderReport(){
    $("reportXp").textContent=progress.xp;$("reportCorrect").textContent=progress.correct;$("reportBest").textContent=progress.bestStreak;$("reportLevel").textContent=progress.currentLevel;
    const list=$("masteryList");list.innerHTML="";
    const skills=Object.entries(progress.mastery).sort((a,b)=>b[1]-a[1]);
    if(!skills.length){list.innerHTML="<p style='color:#70758f;font-weight:700'>Aún no hay ejercicios completados. Cuando empiece a jugar, aquí aparecerán sus fortalezas.</p>";return;}
    const max=Math.max(...skills.map(x=>x[1]));
    skills.slice(0,12).forEach(([name,count])=>{const row=document.createElement("div");row.className="mastery-row";row.innerHTML=`<span>${name}</span><div class="mastery-track"><i style="width:${Math.max(8,count/max*100)}%"></i></div><strong>${count}</strong>`;list.appendChild(row)});
  }

  function bind(){
    $("startBtn").addEventListener("click",()=>startLevel(progress.currentLevel));
    $("chooseBtn").addEventListener("click",()=>showView("worlds"));
    $("introSpeakBtn").addEventListener("click",()=>{progress.sound=true;saveProgress();speak("Hola. Soy Aisha. Vamos a aprender matemáticas jugando. Si algo parece difícil, te daré pistas paso a paso.");});
    $("backBtn").addEventListener("click",()=>showView("worlds"));
    $("soundBtn").addEventListener("click",()=>{progress.sound=!progress.sound;if(!progress.sound&&"speechSynthesis"in window)speechSynthesis.cancel();saveProgress();if(progress.sound)speak("Voz activada.");});
    $("readBtn").addEventListener("click",()=>speak(current.question));
    $("hintBtn").addEventListener("click",showHint);$("explainBtn").addEventListener("click",explain);
    $("checkBtn").addEventListener("click",nextOrCheck);
    $("skipBtn").addEventListener("click",()=>startLevel(current.level));
    $("modalClose").addEventListener("click",closeModal);$("modalOk").addEventListener("click",closeModal);els.modal.addEventListener("click",e=>{if(e.target===els.modal)closeModal()});
    document.querySelectorAll("[data-go-home]").forEach(b=>b.addEventListener("click",()=>showView("home")));
    document.querySelectorAll(".bottom-nav button").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.nav)));
    document.addEventListener("keydown",e=>{if(view==="game"&&e.key==="Enter"&&!els.modal.classList.contains("hidden"))closeModal();else if(view==="game"&&e.key==="Enter")nextOrCheck();});
  }

  function init(){updateStats();renderWorlds();bind();if("speechSynthesis"in window)speechSynthesis.getVoices();}

  return {init,makeQuestion};
})();
AishaMath.init();