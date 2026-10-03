import {draftFromPrompt,EXAMPLES,validateDocument,DESIGN_PRESETS,type VisualDocument,type ContentKind} from './content.js';
import {composeSVG} from './composer.js';
import {PyodideWorkerClient} from '../python/pyodide-worker.js';

const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
let doc=draftFromPrompt('Área y volumen del cono y cilindro'),approved='',rendered:ReturnType<typeof composeSVG>|null=null,python:PyodideWorkerClient|null=null,pythonTimer:ReturnType<typeof setTimeout>|null=null;
const say=(s:string)=>$('design-status').textContent=s;

function signature(){return JSON.stringify({title:doc.title,subtitle:doc.subtitle,sections:doc.sections,sources:doc.sources,design:doc.design,documentType:doc.documentType,audience:doc.audience})}
function dirty(){approved='';$('approval-state').textContent='Contenido o diseño modificado · revisa y aprueba nuevamente';}

function sync(){
 doc.title=$<HTMLInputElement>('doc-title').value;
 doc.subtitle=$<HTMLInputElement>('doc-subtitle').value;
 doc.format=$<HTMLSelectElement>('doc-format').value;
 doc.theme=$<HTMLSelectElement>('doc-theme').value;
 doc.diagram=$<HTMLSelectElement>('doc-diagram').value;
 doc.documentType=$<HTMLSelectElement>('doc-type').value as VisualDocument['documentType'];
 doc.audience=$<HTMLInputElement>('doc-audience').value;
 doc.sources=$<HTMLTextAreaElement>('source-text').value.split('\n').filter(s=>s.trim()).map((s,i)=>{const [title,...url]=s.split('|');return{id:'src-'+(i+1),title:title.trim(),url:url.join('|').trim()}});
 const base=doc.design||structuredClone(DESIGN_PRESETS['educational-clean']);
 base.preset=$<HTMLSelectElement>('design-preset').value;
 base.background=$<HTMLSelectElement>('design-background').value as typeof base.background;
 base.density=$<HTMLSelectElement>('design-density').value as typeof base.density;
 base.columns=Number($<HTMLSelectElement>('design-columns').value) as 1|2|3|4;
 base.palette.primary=$<HTMLInputElement>('color-primary').value;
 base.palette.secondary=$<HTMLInputElement>('color-secondary').value;
 base.palette.accent=$<HTMLInputElement>('color-accent').value;
 base.palette.background=$<HTMLInputElement>('color-background').value;
 doc.design=base;
}

function fill(){
 $<HTMLInputElement>('doc-title').value=doc.title;
 $<HTMLInputElement>('doc-subtitle').value=doc.subtitle;
 $<HTMLSelectElement>('doc-type').value=doc.documentType||'infographic';
 $<HTMLInputElement>('doc-audience').value=doc.audience||'';
 for(const key of ['format','theme','diagram'])$<HTMLSelectElement>('doc-'+key).value=doc[key as 'format'|'theme'|'diagram'];
 const design=doc.design||structuredClone(DESIGN_PRESETS['educational-clean']);
 $<HTMLSelectElement>('design-preset').value=design.preset;
 $<HTMLSelectElement>('design-background').value=design.background;
 $<HTMLSelectElement>('design-density').value=design.density;
 $<HTMLSelectElement>('design-columns').value=String(design.columns||2);
 $<HTMLInputElement>('color-primary').value=design.palette.primary;
 $<HTMLInputElement>('color-secondary').value=design.palette.secondary;
 $<HTMLInputElement>('color-accent').value=design.palette.accent;
 $<HTMLInputElement>('color-background').value=design.palette.background;
 $<HTMLTextAreaElement>('source-text').value=doc.sources.map(s=>s.title+' | '+s.url).join('\n');
 $('remove-photo').hidden=!doc.photo;

 const container=$('content-sections');container.replaceChildren();
 doc.sections.forEach((s,index)=>{
  const box=document.createElement('div');box.className='content-section';
  const kindLabel=document.createElement('label');kindLabel.textContent='Tipo de bloque';
  const kind=document.createElement('select');
  for(const v of ['text','key-idea','formula','steps','exercise','warning','comparison'])kind.add(new Option(v,v));
  kind.value=s.kind||'text';kind.addEventListener('change',()=>{s.kind=kind.value as ContentKind;dirty()});box.append(kindLabel,kind);
  for(const key of ['title','text','formula'] as const){
   const label=document.createElement('label'),id=`section-${index}-${key}`;
   label.htmlFor=id;label.textContent=key==='title'?'Sección '+(index+1):key==='text'?'Texto':'Fórmula LaTeX (opcional)';
   const input=key==='title'?document.createElement('input'):document.createElement('textarea');
   input.id=id;input.value=s[key]??'';input.maxLength=key==='title'?100:key==='text'?1600:500;
   if(input instanceof HTMLTextAreaElement)input.rows=key==='text'?4:2;
   input.addEventListener('input',()=>{s[key]=input.value;dirty()});box.append(label,input);
  }
  const actions=document.createElement('div');actions.className='section-actions';
  const ai=document.createElement('button');ai.textContent='Reescribir esta sección con IA';ai.addEventListener('click',()=>refineSection(index,ai));
  const remove=document.createElement('button');remove.textContent='Eliminar';remove.addEventListener('click',()=>{doc.sections.splice(index,1);dirty();fill()});
  actions.append(ai,remove);box.append(actions);container.append(box);
 });
}

async function refineSection(index:number,button:HTMLButtonElement){
 sync();button.disabled=true;say('Reescribiendo solo la sección '+(index+1)+'…');
 try{
  const r=await fetch('/api/content-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'refine-section',document:doc,index,provider:$<HTMLSelectElement>('ai-provider').value})});
  const data=await r.json();if(!r.ok)throw new Error(data.error||'No fue posible reescribir');
  doc.sections[index]=data.section;dirty();fill();
  $('ai-meta').textContent=`Sección actualizada con ${data.provider||'IA'} · ${data.model||''}`;
  say('Sección actualizada. Revísala antes de aprobar.');
 }catch(e){say(String(e))}finally{button.disabled=false}
}

async function createAIPlan(){
 const b=$<HTMLButtonElement>('ai-plan');b.disabled=true;
 say('La IA está investigando, seleccionando contenido y planificando el diseño…');
 $('ai-meta').textContent='Buscando información y preparando estructura editable…';
 try{
  const r=await fetch('/api/content-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:$<HTMLTextAreaElement>('design-prompt').value,provider:$<HTMLSelectElement>('ai-provider').value,research:$<HTMLInputElement>('use-web-research').checked})});
  const data=await r.json();if(!r.ok)throw new Error(data.error||'No se pudo crear el plan');
  doc=validateDocument(data.document);dirty();fill();
  const m=doc.aiMeta;$('ai-meta').textContent=`Contenido: ${m?.provider||'fallback'} · ${m?.model||''} · Investigación: ${m?.searchProvider||data.searchProvider||'sin búsqueda'}`;
  say('Borrador IA listo. Edita textos, fórmulas, estilo y colores; luego aprueba.');
 }catch(e){say(String(e));$('ai-meta').textContent='No se pudo completar el plan IA. El borrador local sigue disponible.'}
 finally{b.disabled=false}
}

function render(){
 try{sync();validateDocument(doc);if(approved!==signature())throw new Error('Revisa el contenido y pulsa Aprobar antes de generar');const next=composeSVG(doc);rendered=next;$('design-preview').innerHTML=next.svg;say(`Material listo · ${next.width} × ${next.height} · motor local`);}
 catch(e){say(String(e))}
}
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function bitmap(kind:'png'|'jpeg'){
 if(!rendered){say('Primero genera el material');return}
 try{
  const scale=+$<HTMLSelectElement>('png-scale').value,w=rendered.width*scale,h=rendered.height*scale;if(w*h>32000000)throw new Error('El material es muy largo para 2×. Usa tamaño original.');
  const url=URL.createObjectURL(new Blob([rendered.svg],{type:'image/svg+xml'}));
  try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);const blob=await new Promise<Blob>((ok,no)=>canvas.toBlob(b=>b?ok(b):no(new Error('No se pudo exportar')),'image/'+kind,.95));download(blob,'visual-studio.'+(kind==='jpeg'?'jpg':'png'));say('Imagen exportada · '+w+' × '+h);}
  finally{URL.revokeObjectURL(url)}
 }catch(e){say('Error al exportar: '+String(e))}
}

$('ai-plan').addEventListener('click',createAIPlan);
$('draft').addEventListener('click',()=>{doc=draftFromPrompt($<HTMLTextAreaElement>('design-prompt').value);dirty();fill();say('Borrador local preparado. Puedes editarlo o usar IA para investigar.')});
const example=$<HTMLSelectElement>('example');Object.keys(EXAMPLES).forEach(name=>example.add(new Option(name,name)));
example.addEventListener('change',()=>{const e=EXAMPLES[example.value];$<HTMLTextAreaElement>('design-prompt').value=e.prompt;doc=draftFromPrompt(e.prompt);dirty();fill()});

for(const id of ['doc-title','doc-subtitle','doc-audience','source-text'])$(id).addEventListener('input',()=>{sync();dirty()});
for(const id of ['doc-type','design-background','design-density','design-columns'])$(id).addEventListener('change',()=>{sync();dirty()});
$('design-preset').addEventListener('change',()=>{
 const preset=DESIGN_PRESETS[$<HTMLSelectElement>('design-preset').value];
 if(preset){doc.design=structuredClone(preset);if(preset.preset==='technical-blueprint')doc.theme='blueprint';else if(preset.preset==='minimal-editorial')doc.theme='editorial';else doc.theme='educational';dirty();fill()}
});
for(const id of ['color-primary','color-secondary','color-accent','color-background'])$(id).addEventListener('input',()=>{sync();dirty()});

$('add-section').addEventListener('click',()=>{if(doc.sections.length>=12){say('Máximo 12 secciones');return}sync();doc.sections.push({title:'Nueva sección',text:'',formula:'',kind:'text'});dirty();fill()});
$('approve').addEventListener('click',()=>{try{sync();validateDocument(doc);approved=signature();$('approval-state').textContent='Contenido y diseño aprobados · listo para componer';say('Snapshot aprobado. Ya puedes generar distintos formatos con el motor.')}catch(e){say(String(e))}});
$('compose').addEventListener('click',render);
for(const id of ['doc-format','doc-theme','doc-diagram'])$(id).addEventListener('change',()=>{if(id==='doc-diagram')delete doc.points;sync();if(approved===signature())render()});

$('save-png').addEventListener('click',()=>bitmap('png'));$('save-jpg').addEventListener('click',()=>bitmap('jpeg'));
$('save-svg').addEventListener('click',()=>{if(rendered)download(new Blob([rendered.svg],{type:'image/svg+xml'}),'visual-studio.svg');else say('Primero genera el material')});
$('print-doc').addEventListener('click',()=>{if(!rendered){say('Primero genera el material');return}let area=document.getElementById('print-surface');if(!area){area=document.createElement('div');area.id='print-surface';document.body.append(area)}area.innerHTML=rendered.svg;let style=document.getElementById('print-orientation');if(!style){style=document.createElement('style');style.id='print-orientation';document.head.append(style)}style.textContent=`@media print{@page{size:${rendered.width>rendered.height?'landscape':'portrait'};margin:8mm}}`;window.print()});
$('save-project').addEventListener('click',()=>{try{sync();validateDocument(doc);download(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}),'visual-studio-project.json')}catch(e){say(String(e))}});
$('load-project').addEventListener('click',()=>$('project-file').click());

$<HTMLInputElement>('project-file').addEventListener('change',async e=>{const input=e.currentTarget as HTMLInputElement;try{const file=input.files?.[0];if(!file)return;if(file.size>16000000)throw new Error('Proyecto demasiado grande');doc=validateDocument(JSON.parse(await file.text()));dirty();fill();say('Proyecto cargado. Revisa y aprueba.')}catch(e){say('No se pudo abrir: '+String(e))}finally{input.value=''}});
$<HTMLInputElement>('photo').addEventListener('change',async e=>{try{const file=(e.currentTarget as HTMLInputElement).files?.[0];if(!file)return;if(file.size>10000000||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Usa PNG, JPG o WebP de hasta 10 MB');doc.photo=await new Promise<string>((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result));r.onerror=no;r.readAsDataURL(file)});$('remove-photo').hidden=false;if(approved===signature())render();say('Fotografía incorporada localmente.')}catch(e){say(String(e))}});
$('remove-photo').addEventListener('click',()=>{delete doc.photo;$<HTMLInputElement>('photo').value='';$('remove-photo').hidden=true;if(approved===signature())render()});

$('use-3d').addEventListener('click',()=>{$('mode-3d').click();say('Crea la escena y pulsa Usar escena en diseño.')});
document.addEventListener('captured-3d',((e:CustomEvent<string>)=>{doc.photo=e.detail;$('remove-photo').hidden=false;if(approved===signature())render();say('Captura 3D incorporada.');$('mode-2d').click()}) as EventListener);

$('research').addEventListener('click',async()=>{
 const b=$<HTMLButtonElement>('research');b.disabled=true;say('Buscando extractos y fuentes…');
 try{
  const response=await fetch('/api/research',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:$<HTMLTextAreaElement>('design-prompt').value})});
  const result=await response.json();if(!response.ok)throw new Error(result.error??'Investigación no disponible');
  const base=draftFromPrompt(result.title);doc=validateDocument({...base,...result,version:2,design:base.design});dirty();fill();say('Fuentes recuperadas. Revisa los extractos o usa Investigar y crear con IA.');
 }catch(e){say(String(e))}finally{b.disabled=false}
});

function stopPython(message:string){python?.terminate();python=null;if(pythonTimer)clearTimeout(pythonTimer);pythonTimer=null;$<HTMLButtonElement>('run-python').disabled=false;$('cancel-python').hidden=true;$('python-output').textContent=message}
$('plot-python').addEventListener('click',()=>{try{const points=JSON.parse($('python-output').textContent??'');validateDocument({...doc,points});doc.points=points;doc.diagram='none';fill();if(approved===signature())render();say('Datos Python incorporados.')}catch(e){say('Devuelve lista JSON {x,y}: '+String(e))}});
$('cancel-python').addEventListener('click',()=>stopPython('Cálculo cancelado'));
$('run-python').addEventListener('click',async()=>{const b=$<HTMLButtonElement>('run-python');b.disabled=true;$('cancel-python').hidden=false;$('python-output').textContent='Iniciando Python local…';try{python=new PyodideWorkerClient();const current=python;pythonTimer=setTimeout(()=>stopPython('Se agotó el tiempo (60 s).'),60000);const result=await current.run($<HTMLTextAreaElement>('python-code').value);if(current!==python)return;stopPython(typeof result==='string'?result:JSON.stringify(result,null,2))}catch(e){stopPython('Python no disponible: '+String(e))}});

fill();
