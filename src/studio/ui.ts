import {validateDocument,type VisualDocument} from './content.js';
type Rendered={svg:string;width:number;height:number};
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
let rendered:Rendered|null=null,doc:VisualDocument|null=null,controller:AbortController|null=null,run=0;
const say=(text:string,error=false)=>{$('design-status').textContent=text;$('design-status').classList.toggle('error',error)};
const stage=(index:number,title:string)=>{$('progress-title').textContent=title;document.querySelectorAll('[data-stage]').forEach((el,i)=>{el.classList.toggle('active',i===index);el.classList.toggle('done',i<index)});};
const count=()=>$('prompt-count').textContent=$<HTMLTextAreaElement>('design-prompt').value.length+' / 4000';
$<HTMLTextAreaElement>('design-prompt').addEventListener('input',count);
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-prompt]'))b.addEventListener('click',()=>{$<HTMLTextAreaElement>('design-prompt').value=b.dataset.prompt||'';count();$('design-prompt').focus()});
$('cancel-generation').addEventListener('click',()=>controller?.abort());
$('generation-form').addEventListener('submit',async e=>{
 e.preventDefault();if(controller)return;const prompt=$<HTMLTextAreaElement>('design-prompt').value.trim();if(!prompt){say('Describe la imagen que quieres crear.',true);return;}
 const current=++run,abort=new AbortController();controller=abort;rendered=null;doc=null;$('design-preview').replaceChildren();$('result').hidden=true;$('empty-state').hidden=true;$('generation-progress').hidden=false;$('cancel-generation').hidden=false;$<HTMLButtonElement>('generate').disabled=true;
 say('');stage(0,'Interpretando tu solicitud');
 // The server owns interpretation/research/design; avoid claiming a timed stage has completed.
 stage(1,'Preparando contenido y diseño');const timeout=setTimeout(()=>abort.abort('timeout'),120000);
 try{
  const r=await fetch('/api/content-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt}),signal:abort.signal});
  const data=await r.json();if(!r.ok)throw new Error(data.error||'No se pudo crear la imagen.');if(current!==run)return;abort.signal.throwIfAborted();
  doc=validateDocument(data.document);stage(3,'Componiendo tu imagen');await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));abort.signal.throwIfAborted();
  const {composeSVG}=await import('./composer.js');abort.signal.throwIfAborted();
  rendered=composeSVG(doc);$('design-preview').innerHTML=rendered.svg;$('result-title').textContent=doc.title;$('result-meta').textContent=`${doc.audience||'Material visual'} · ${rendered.width} × ${rendered.height} px`;
  const sources=$('sources');sources.replaceChildren();if(doc.sources.length){const label=document.createElement('span');label.textContent='Fuentes:';sources.append(label);for(const source of doc.sources){const link=document.createElement('a');link.textContent=source.title;link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';sources.append(link);}}
  sources.hidden=!doc.sources.length;$('result').hidden=false;say('Imagen creada. Ya puedes descargarla.');
 }catch(err){if(abort.signal.aborted)say(abort.signal.reason==='timeout'?'La generación tardó demasiado. Intenta nuevamente.':'Generación cancelada.');else say(err instanceof Error?err.message:'No se pudo crear la imagen. Intenta nuevamente.',true);$('empty-state').hidden=false;}
 finally{clearTimeout(timeout);if(current===run){controller=null;$('generation-progress').hidden=true;$('cancel-generation').hidden=true;$<HTMLButtonElement>('generate').disabled=false;}}
});
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const filename=()=>doc?.title.normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^\w-]+/g,'-').toLowerCase().slice(0,80)||'visual-studio';
async function bitmap(kind:'png'|'jpeg'){
 if(!rendered)return;const snapshot=rendered,name=filename(),button=$<HTMLButtonElement>(kind==='png'?'save-png':'save-jpg');button.disabled=true;
 const url=URL.createObjectURL(new Blob([snapshot.svg],{type:'image/svg+xml'}));
 try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=snapshot.width;canvas.height=snapshot.height;if(canvas.width*canvas.height>32000000)throw new Error('Usa SVG o PDF para esta imagen extensa.');const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas no está disponible.');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0);const blob=await new Promise<Blob>((ok,no)=>canvas.toBlob(b=>b?ok(b):no(new Error('No se pudo exportar la imagen.')),'image/'+kind,.95));download(blob,name+(kind==='png'?'.png':'.jpg'));say('Imagen descargada.');}catch(err){say(err instanceof Error?err.message:'No se pudo exportar.',true);}finally{URL.revokeObjectURL(url);button.disabled=false;}
}
$('save-png').addEventListener('click',()=>bitmap('png'));$('save-jpg').addEventListener('click',()=>bitmap('jpeg'));
$('save-svg').addEventListener('click',()=>{if(rendered)download(new Blob([rendered.svg],{type:'image/svg+xml'}),filename()+'.svg')});
$('print-doc').addEventListener('click',()=>{if(!rendered)return;let area=document.getElementById('print-surface');if(!area){area=document.createElement('div');area.id='print-surface';document.body.append(area);}area.innerHTML=rendered.svg;let style=document.getElementById('print-orientation');if(!style){style=document.createElement('style');style.id='print-orientation';document.head.append(style);}style.textContent=`@media print{@page{size:${rendered.width>rendered.height?'landscape':'portrait'};margin:8mm}}`;window.print();});
