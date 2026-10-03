import {geometryFromPrompt,buildPromptScene} from './studio/geometry.js';
import "./style.css";
import {loadLocalGLB} from "./render/local-model.js";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {buildAdvancedSolarSystemScene,buildSingleBodyScene,buildPlasmaDemoScene,buildMoleculeObject,MOLECULES,buildCellObject,defaultAnimalCell,createScientificRenderer,applyRendererPostFX,createBloomPipeline,buildPhysicalStudioScene,PhysicalRenderSession,disposeScientificScene,FrameClock} from "./index";

const $=<T extends HTMLElement>(selector:string)=>document.querySelector(selector) as T;
const canvas=$<HTMLCanvasElement>("#view"),status=$("#status"),backendEl=$("#backend"),fpsEl=$("#fps"),pcEl=$("#particle-count");
const exposure=$<HTMLInputElement>("#exposure"),bloom=$<HTMLInputElement>("#bloom"),particles=$<HTMLInputElement>("#particles");
const traceButton=$<HTMLButtonElement>("#trace"),exportButton=$<HTMLButtonElement>("#export"),pauseButton=$<HTMLButtonElement>("#pause"),progress=$<HTMLProgressElement>("#progress");
const smooth=$<HTMLInputElement>("#smooth");
const targetSamples=$<HTMLSelectElement>("#samples"),resolution=$<HTMLSelectElement>("#resolution");
let handle:any,camera:any,current:any,pipeline:any=null,controls:OrbitControls;
let elapsed=0,modeActive=true;
let currentScene="studio",loading=false,paused=false,exporting=false,animationId=0;
let trace:PhysicalRenderSession|null=null,traceCanvas:HTMLCanvasElement|null=null,traceBuilding=false,traceEpoch=0;
const clock=new FrameClock();let fpsStart=performance.now(),frames=0;
const sceneNotes:Record<string,string>={
  studio:"Metal, vidrio y cerámica. Iluminación y geometría calculadas; el trazado de rayos incorpora reflejos, refracción y sombras.",
  solar:"Representación educativa: radios y distancias visuales no están a escala. Superficies procedurales, sin mapas geográficos.",
  "solar-date":"Posiciones heliocéntricas aproximadas JPL por fecha. Distancias comprimidas y tamaños ampliados para lectura.",
  sun:"Superficie y arcos solares procedurales. Visualización ilustrativa, sin simulación magnetohidrodinámica.",
  saturn:"Bandas y anillos procedurales. El trazado de rayos calcula las sombras del planeta sobre los anillos.",
  h2o:"Modelo de bolas y varillas de H₂O. Colores convencionales y tamaños ilustrativos.",
  cell:"Modelo esquemático de célula animal. Orgánulos simplificados y colores educativos.",
  plasma:"Partículas procedurales: visualización demostrativa, sin validación de un solver de plasma."
};

function updateButtons(){
  document.querySelectorAll<HTMLButtonElement>("[data-scene]").forEach(button=>button.disabled=loading||exporting||traceBuilding);
  traceButton.disabled=loading||exporting||traceBuilding;
  exportButton.disabled=loading||exporting||traceBuilding||!!(trace&&trace.samples<1);
  pauseButton.disabled=loading||!!trace||traceBuilding;
  $<HTMLButtonElement>("#import-model").disabled=loading||exporting||traceBuilding;
  $("#cancel").hidden=!trace&&!traceBuilding;
}
function message(text:string){status.textContent=text}
async function init(){
  handle=await createScientificRenderer({canvas,antialias:true});
  handle.renderer.shadowMap.enabled=true;
  backendEl.textContent=handle.backend.toUpperCase();
  const {THREE,renderer}=handle;
  camera=new THREE.PerspectiveCamera(42,1,.01,500);
  controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.minDistance=.4;controls.maxDistance=40;
  controls.addEventListener("change",()=>trace?.updateCamera(camera));
  applyRendererPostFX(renderer,THREE,{exposure:+exposure.value,bloom:+bloom.value});
  await loadScene("studio");resize();
  new ResizeObserver(()=>resize()).observe($("#viewport"));
  document.addEventListener("visibilitychange",()=>clock.reset());
  animate();
}
function resize(){
  if(!handle||exporting||!modeActive)return;
  const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
  handle.renderer.setSize(w,h,false);
  if(!trace&&!traceBuilding){camera.aspect=w/h;camera.updateProjectionMatrix()}
}
function stopTrace(){
  traceEpoch++;traceBuilding=false;trace?.dispose();trace=null;traceCanvas?.remove();traceCanvas=null;
  canvas.style.opacity="1";traceButton.classList.remove("active");progress.hidden=true;
  $("#sample-count").textContent="—";clock.reset();resize();updateButtons();
}
function setCamera(position:number[],target:number[]){camera.position.set(...position);controls.target.set(target[0],target[1],target[2]);camera.lookAt(...target);controls.update()}
async function wrappedObject(object:any){
  const T=handle.THREE,scene=new T.Scene();scene.background=new T.Color(0x080e1b);scene.add(object);
  const key=new T.DirectionalLight(0xfff1da,3.5);key.position.set(3,4,5);scene.add(key);
  const rim=new T.DirectionalLight(0x78baff,2);rim.position.set(-3,1,-3);scene.add(rim);
  scene.add(new T.AmbientLight(0x71839c,.5));return{scene,root:object};
}
async function loadScene(name:string){
  if(loading||exporting)return;
  stopTrace();loading=true;updateButtons();message("Preparando escena…");
  let next:any;
  try{
    if(name==="studio"){next=await buildPhysicalStudioScene();setCamera([6,3.2,7.5],[0,-.05,0])}
    else if(name==="solar"||name==="solar-date"){
      next=await buildAdvancedSolarSystemScene({particleCount:+particles.value,seed:42,layout:name==="solar-date"?"ephemeris":"educational",ephemerisDate:new Date()});next.static=name==="solar-date";
      setCamera(name==="solar"?[3,5.5,8.5]:[0,8.5,11],name==="solar"?[2.5,0,0]:[0,0,0]);
    }else if(name==="sun"||name==="saturn"){
      next=await buildSingleBodyScene(name,{particleCount:+particles.value,seed:42});setCamera([0,2.3,7.5],[0,0,0]);
    }else if(name==="h2o"){next=await wrappedObject(await buildMoleculeObject(MOLECULES.H2O,1));setCamera([0,1,4.8],[0,.25,0])}
    else if(name==="cell"){next=await wrappedObject(await buildCellObject(defaultAnimalCell()));setCamera([0,.7,6.5],[0,0,0])}
    else{next=await buildPlasmaDemoScene({count:+particles.value,seed:42});setCamera([0,0,6],[0,0,0])}
    const nextPipeline=await createBloomPipeline(handle.renderer,next.scene,camera,{bloom:+bloom.value,bloomRadius:.35,bloomThreshold:1.2});
    pipeline?.dispose?.();disposeScientificScene(current?.scene);
    current=next;pipeline=nextPipeline;currentScene=name;controls.saveState();
    document.querySelectorAll<HTMLElement>("[data-scene]").forEach(button=>button.classList.toggle("active",button.dataset.scene===name));
    pcEl.textContent=current.corona?String(current.corona.system.config.count):current.plasma?String(current.plasma.system.config.count):"—";
    $("#scene-note").textContent=sceneNotes[name];
    message("Escena lista · "+handle.backend.toUpperCase());
  }catch(error){if(next)disposeScientificScene(next.scene);message("No se pudo abrir la escena: "+String(error));console.error(error)}
  finally{loading=false;clock.reset();updateButtons();resize()}
}
function renderLive(){if(pipeline)pipeline.render();else handle.renderer.render(current.scene,camera)}
function animate(t=performance.now()){
  animationId=requestAnimationFrame(animate);
  if(document.hidden||!modeActive||!current||loading||exporting)return;
  const dt=clock.tick(t);controls.update();if(!paused){elapsed+=dt;current.update?.(elapsed)}
  frames++;if(t-fpsStart>=1000){fpsEl.textContent=String(Math.round(frames*1000/(t-fpsStart)));frames=0;fpsStart=t}
  if(trace){
    if(!traceBuilding&&trace.samples<+targetSamples.value){
      try{trace.renderSample()}catch(error){stopTrace();message("El trazado de rayos falló. Vista interactiva disponible.");console.error(error);return}
      const samples=trace.samples;
      $("#sample-count").textContent=String(Math.floor(samples));progress.value=samples/+targetSamples.value;
      if(samples>=+targetSamples.value){trace.display(smooth.checked);message("Imagen lista · "+targetSamples.value+" muestras/píxel")}
    }
    updateButtons();return;
  }
  if(!paused&&!current.static){
    if(current.root)current.root.rotation.y+=dt*.08;
    if(current.mesh)current.mesh.rotation.y+=dt*.12;
    for(const effect of [current.corona,current.plasma])if(effect){effect.system.step(dt);effect.geometry.attributes.position.needsUpdate=true}
  }
  try{renderLive()}catch(error){cancelAnimationFrame(animationId);message("Error de render: "+String(error));console.error(error)}
}
async function startTrace(){
  if(trace){stopTrace();message("Vista interactiva lista");return}
  const epoch=++traceEpoch;traceBuilding=true;updateButtons();progress.hidden=false;progress.value=0;
  message("Preparando trazado de rayos y estructura BVH…");
  const [width,height]=resolution.value.split("x").map(Number);
  traceCanvas=document.createElement("canvas");traceCanvas.className="trace-canvas";traceCanvas.setAttribute("aria-label","Imagen con trazado de rayos");$("#viewport").append(traceCanvas);
  let session:PhysicalRenderSession|null=null;
  try{
    session=new PhysicalRenderSession(traceCanvas);trace=session;
    camera.aspect=width/height;camera.updateProjectionMatrix();camera.updateMatrixWorld();
    await session.init(current.scene,camera,{width,height,exposure:+exposure.value,studioEnvironment:["studio","h2o","cell"].includes(currentScene),onProgress:fraction=>{if(epoch===traceEpoch)progress.value=fraction}});
    if(epoch!==traceEpoch)return;
    canvas.style.opacity="0";traceButton.classList.add("active");traceBuilding=false;progress.value=0;
    message("Refinando imagen · "+width+" × "+height);
    $("#scene-note").textContent=(sceneNotes[currentScene]??"Modelo GLB importado localmente. Materiales y geometría del archivo.")+(session.omittedEffects?" El render físico omite partículas, líneas y efectos de glow de la vista interactiva.":"");
  }catch(error){
    if(epoch===traceEpoch){stopTrace();message("Trazado de rayos no disponible: "+String(error));console.error(error)}
    session?.dispose();
  }finally{if(epoch===traceEpoch){traceBuilding=false;updateButtons()}}
}
async function exportPNG(){
  if(exporting)return;
  exporting=true;updateButtons();message("Preparando PNG…");
  const renderer=handle.renderer,oldSize=new handle.THREE.Vector2();renderer.getSize(oldSize);
  const oldRatio=renderer.getPixelRatio(),oldAspect=camera.aspect;
  try{
    let source:HTMLCanvasElement;
    if(trace&&traceCanvas){trace.display(smooth.checked);source=traceCanvas}
    else{
      const [width,height]=resolution.value.split("x").map(Number);
      renderer.setPixelRatio(1);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
      renderLive();await renderer.backend?.device?.queue?.onSubmittedWorkDone?.();source=canvas;
    }
    // Copy synchronously so the GPU's next frame cannot clear the exported drawing buffer.
    const output=document.createElement("canvas");output.width=source.width;output.height=source.height;
    const context=output.getContext("2d");if(!context)throw new Error("Canvas de exportación no disponible");context.drawImage(source,0,0);
    const blob=await new Promise<Blob>((resolve,reject)=>output.toBlob(value=>value?resolve(value):reject(new Error("PNG vacío")),"image/png"));
    const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;
    link.download=`scientific-${currentScene}-${output.width}x${output.height}-${trace?Math.floor(trace.samples)+"spp":"realtime"}.png`;
    link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    message("PNG exportado · "+output.width+" × "+output.height);
  }catch(error){message("Error al exportar: "+String(error));console.error(error)}
  finally{
    renderer.setPixelRatio(oldRatio);renderer.setSize(oldSize.x,oldSize.y,false);camera.aspect=oldAspect;camera.updateProjectionMatrix();
    exporting=false;clock.reset();updateButtons();resize();
  }
}

document.querySelectorAll<HTMLElement>("[data-scene]").forEach(button=>button.addEventListener("click",()=>loadScene(button.dataset.scene!)));
exposure.addEventListener("input",()=>{if(handle)handle.renderer.toneMappingExposure=+exposure.value;trace?.setExposure(+exposure.value);trace?.display(smooth.checked)});
smooth.addEventListener("change",()=>trace?.display(smooth.checked));
bloom.addEventListener("input",()=>pipeline?.setBloom(+bloom.value));
particles.addEventListener("change",()=>{if(!["model","custom"].includes(currentScene))loadScene(currentScene)});
traceButton.addEventListener("click",startTrace);exportButton.addEventListener("click",exportPNG);
$("#cancel").addEventListener("click",()=>{stopTrace();message("Vista interactiva lista")});
resolution.addEventListener("change",()=>{if(trace||traceBuilding){stopTrace();message("Resolución actualizada. Inicia un nuevo render físico.")}});
pauseButton.addEventListener("click",()=>{paused=!paused;pauseButton.textContent=paused?"Reanudar":"Pausar";pauseButton.setAttribute("aria-pressed",String(paused))});
$("#reset-camera").addEventListener("click",()=>{stopTrace();controls.reset()});
$("#import-model").addEventListener("click",()=>$("#model-file").click());
$<HTMLInputElement>("#model-file").addEventListener("change",async(event)=>{
  const input=event.currentTarget as HTMLInputElement,file=input.files?.[0];if(!file||loading||exporting)return;
  stopTrace();loading=true;updateButtons();message("Abriendo modelo local…");
  try{
    const model=await loadLocalGLB(file),next={...await wrappedObject(model.root),static:true};
    const T=handle.THREE,floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardNodeMaterial({color:0x69798b,roughness:.7}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-model.height/2-.01;floor.receiveShadow=true;next.scene.add(floor);
    const nextPipeline=await createBloomPipeline(handle.renderer,next.scene,camera,{bloom:+bloom.value,bloomThreshold:1.2});
    pipeline?.dispose?.();disposeScientificScene(current?.scene);current=next;pipeline=nextPipeline;currentScene="model";
    setCamera([4,2.5,5],[0,0,0]);controls.saveState();
    document.querySelectorAll("[data-scene]").forEach(button=>button.classList.remove("active"));
    $("#scene-note").textContent="Modelo local: "+file.name+". El archivo permanece en tu dispositivo; no se sube a un servidor.";
    pcEl.textContent="—";message("Modelo listo · activa el render físico para refinar la imagen");
  }catch(error){message("No se pudo importar: "+String(error));console.error(error)}
  finally{loading=false;input.value="";clock.reset();updateButtons();resize()}
});
window.addEventListener("pagehide",()=>{cancelAnimationFrame(animationId);stopTrace();controls?.dispose();pipeline?.dispose?.();disposeScientificScene(current?.scene);handle?.dispose()},{once:true});
document.addEventListener('visual-mode',((event:CustomEvent<string>)=>{modeActive=event.detail==='3d';if(!modeActive)stopTrace();clock.reset();resize()}) as EventListener);
$("#create-geometry").addEventListener('click',async()=>{
 if(!handle||loading||exporting)return;
 let next:any;
 try{const specs=geometryFromPrompt($<HTMLTextAreaElement>('#geometry-prompt').value);next=buildPromptScene(specs);stopTrace();loading=true;updateButtons();const nextPipeline=await createBloomPipeline(handle.renderer,next.scene,camera,{bloom:+bloom.value,bloomThreshold:1.2});pipeline?.dispose?.();disposeScientificScene(current?.scene);current=next;pipeline=nextPipeline;currentScene='custom';elapsed=0;setCamera([next.extent*.6,next.extent*.4,next.extent],[0,0,0]);controls.maxDistance=Math.max(40,next.extent*4);controls.saveState();sceneNotes.custom='Geometría calculada desde una gramática local. Péndulo: aproximación de ángulo pequeño; onda: modelo analítico. Las descripciones desconocidas requieren un modelo o una fórmula.';$('#scene-note').textContent=sceneNotes.custom;document.querySelectorAll('[data-scene]').forEach(b=>b.classList.remove('active'));message('Escena creada · '+specs.map(s=>s.kind).join(' + '));}catch(error){if(next&&next!==current)disposeScientificScene(next.scene);message('Revisa la descripción: '+String(error))}finally{loading=false;updateButtons();resize()}
});
$('#capture-3d').addEventListener('click',()=>document.dispatchEvent(new CustomEvent('capture-for-design')));
document.addEventListener('capture-for-design',()=>{if(!handle||!current){message('Abre primero una escena 3D');return}try{if(!trace)renderLive();const source=traceCanvas??canvas;const copy=document.createElement('canvas');copy.width=source.width;copy.height=source.height;copy.getContext('2d')!.drawImage(source,0,0);document.dispatchEvent(new CustomEvent('captured-3d',{detail:copy.toDataURL('image/png')}));}catch(error){message('No se pudo capturar: '+String(error))}});
init().catch(error=>{message('Este navegador no pudo iniciar WebGPU/WebGL. El Estudio 2D sigue disponible. '+String(error));console.error(error)});
