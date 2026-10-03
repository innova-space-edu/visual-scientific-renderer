type Req={method?:string;body?:any};type Res={status:(n:number)=>Res;json:(v:any)=>void;setHeader:(k:string,v:string)=>void};

const DIAGRAMS=['solids','wave','homothety','blueprint','molecule','none'];
const FORMATS=['landscape','portrait','square','brochure'];
const PRESETS=['educational-clean','mathematics-pastel','science-classroom','technical-blueprint','institutional','kids-illustrated','minimal-editorial'];
const DEFAULT_DESIGN={preset:'educational-clean',palette:{primary:'#12365f',secondary:'#2d73b9',accent:'#f0a43a',background:'#f4f9ff',surface:'#ffffff',ink:'#193658'},background:'soft-gradient',density:'medium',columns:2,cornerStyle:'rounded'};
const clean=(s:any,n:number)=>String(s??'').trim().slice(0,n);

function jsonFromText(raw:string){
 const text=raw.replace(/```json|```/gi,'').trim(),a=text.indexOf('{'),b=text.lastIndexOf('}');
 if(a<0||b<a)throw new Error('La IA no devolvió JSON válido');
 return JSON.parse(text.slice(a,b+1));
}

function normalizePlan(p:any,prompt:string,sources:any[],meta:any){
 const design=p?.design&&typeof p.design==='object'?p.design:{};
 const palette={...DEFAULT_DESIGN.palette,...(design.palette||{})};
 for(const k of Object.keys(palette))if(!/^#[0-9a-f]{6}$/i.test(String((palette as any)[k]))) (palette as any)[k]=(DEFAULT_DESIGN.palette as any)[k];
 const sections=(Array.isArray(p?.sections)?p.sections:[]).slice(0,12).map((s:any)=>({
   title:clean(s?.title,100)||'Sección',
   text:clean(s?.text,1600),
   ...(clean(s?.formula,500)?{formula:clean(s.formula,500)}:{}),
   kind:['text','key-idea','formula','steps','exercise','warning','comparison'].includes(s?.kind)?s.kind:'text',
   ...(clean(s?.visualHint,180)?{visualHint:clean(s.visualHint,180)}:{})
 })).filter((s:any)=>s.text||s.formula);
 if(!sections.length)sections.push({title:'Idea principal',text:'Edita este contenido antes de aprobarlo.',kind:'key-idea'});
 const preset=PRESETS.includes(design.preset)?design.preset:'educational-clean';
 return{
   version:2,
   documentType:['infographic','poster','worksheet','guide','brochure','technical-plan','activity'].includes(p?.documentType)?p.documentType:'infographic',
   audience:clean(p?.audience,80),subject:clean(p?.subject,80),
   title:clean(p?.title,180)||clean(prompt,180)||'Material educativo',
   subtitle:clean(p?.subtitle,250)||'Contenido investigado y editable',
   sections,sources:sources.slice(0,12),
   diagram:DIAGRAMS.includes(p?.diagram)?p.diagram:'none',
   format:FORMATS.includes(p?.format)?p.format:'landscape',
   theme:preset==='technical-blueprint'?'blueprint':preset==='minimal-editorial'?'editorial':'educational',
   design:{preset,palette,background:['solid','soft-gradient','grid','dots','paper'].includes(design.background)?design.background:DEFAULT_DESIGN.background,density:['airy','medium','compact'].includes(design.density)?design.density:'medium',columns:[1,2,3,4].includes(Number(design.columns))?Number(design.columns):2,cornerStyle:['soft','rounded','square'].includes(design.cornerStyle)?design.cornerStyle:'rounded'},
   aiMeta:{...meta,researched:sources.length>0,generatedAt:new Date().toISOString()}
 };
}

async function wiki(topic:string){
 const u='https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch='+encodeURIComponent(topic)+'&gsrlimit=4&prop=extracts|info&exintro=1&explaintext=1&inprop=url&format=json';
 const r=await fetch(u,{signal:AbortSignal.timeout(10000),headers:{'User-Agent':'InnovaVisualStudio/2.0'}});
 if(!r.ok)return{context:'',sources:[]};
 const d=await r.json();const pages=(Object.values(d.query?.pages??{}) as any[]).sort((a,b)=>(a.index??0)-(b.index??0));
 return{context:pages.map(p=>p.title+'\n'+String(p.extract||'').slice(0,1800)).join('\n\n'),sources:pages.map((p,i)=>({id:'src-'+(i+1),title:p.title,url:p.fullurl})).filter(s=>s.url)};
}

async function geminiResearch(prompt:string){
 const key=process.env.GEMINI_API_KEY;if(!key)throw new Error('GEMINI_API_KEY no configurada');
 const model=process.env.GEMINI_TEXT_MODEL_PRIMARY||'gemini-2.5-flash';
 const body={contents:[{role:'user',parts:[{text:'Investiga para crear material educativo en español de Chile. Prioriza fuentes confiables, conceptos correctos, fórmulas si corresponden, ejemplos y datos útiles. Solicitud: '+prompt}]}],tools:[{google_search:{}}],generationConfig:{temperature:0.2,maxOutputTokens:3500}};
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent?key='+encodeURIComponent(key),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
 if(!r.ok)throw new Error('Gemini Search '+r.status);
 const d=await r.json(),c=d.candidates?.[0]||{},text=(c.content?.parts||[]).map((p:any)=>p.text||'').join('\n'),chunks=c.groundingMetadata?.groundingChunks||[];
 const sources:any[]=[];for(const ch of chunks){const w=ch?.web;if(w?.uri&&!sources.some(s=>s.url===w.uri))sources.push({id:'src-'+(sources.length+1),title:clean(w.title||w.uri,250),url:w.uri})}
 return{context:text,sources:sources.slice(0,12),model};
}

async function callProvider(provider:string,messages:any[]){
 if(provider==='gemini'){
  const key=process.env.GEMINI_API_KEY;if(!key)throw new Error('Gemini no configurado');
  const model=process.env.GEMINI_TEXT_MODEL_PRIMARY||'gemini-2.5-flash',system=messages.find(m=>m.role==='system')?.content||'',contents=messages.filter(m=>m.role!=='system').map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
  const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent?key='+encodeURIComponent(key),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents,generationConfig:{temperature:.25,maxOutputTokens:5000,responseMimeType:'application/json'}}),signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw new Error('Gemini '+r.status);const d=await r.json();return{text:(d.candidates?.[0]?.content?.parts||[]).map((p:any)=>p.text||'').join(''),provider:'Gemini',model};
 }
 if(provider==='groq'){
  const key=process.env.GROQ_API_KEY;if(!key)throw new Error('Groq no configurado');const model=process.env.GROQ_TEXT_MODEL||'llama-3.3-70b-versatile';
  const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model,messages,temperature:.25,max_tokens:5000,response_format:{type:'json_object'}}),signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw new Error('Groq '+r.status);const d=await r.json();return{text:d.choices?.[0]?.message?.content||'',provider:'Groq',model};
 }
 if(provider==='openrouter'){
  const key=process.env.OPENROUTER_API_KEY;if(!key)throw new Error('OpenRouter no configurado');const model=process.env.OPENROUTER_TEXT_MODEL||'openai/gpt-4o-mini';
  const r=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','HTTP-Referer':process.env.PUBLIC_APP_URL||'https://visual-scientific-renderer.vercel.app','X-Title':'Innova Visual Studio'},body:JSON.stringify({model,messages,temperature:.25,max_tokens:5000,response_format:{type:'json_object'}}),signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw new Error('OpenRouter '+r.status);const d=await r.json();return{text:d.choices?.[0]?.message?.content||'',provider:'OpenRouter',model};
 }
 throw new Error('Proveedor no válido');
}

const SYSTEM='Eres el arquitecto editorial de Innova Visual Studio. NO generas imágenes. Transformas una solicitud educativa y contexto investigado en un plan visual estructurado que un motor SVG determinista dibujará. Devuelve SOLO JSON. Debe ser correcto, claro, breve, editable y adaptado al tipo de material. No inventes fuentes. Las fórmulas usan LaTeX. Elige diagram solo entre solids,wave,homothety,blueprint,molecule,none. Elige format entre landscape,portrait,square,brochure. Elige design.preset entre educational-clean,mathematics-pastel,science-classroom,technical-blueprint,institutional,kids-illustrated,minimal-editorial. Secciones máximo 12. kind: text,key-idea,formula,steps,exercise,warning,comparison. Incluye colores hex, background solid|soft-gradient|grid|dots|paper, density airy|medium|compact y columns 1-4. JSON: {documentType,audience,subject,title,subtitle,diagram,format,design:{preset,palette:{primary,secondary,accent,background,surface,ink},background,density,columns,cornerStyle},sections:[{title,text,formula?,kind,visualHint?}]}.';

async function plan(prompt:string,provider:string,research:boolean){
 let researchData:any={context:'',sources:[]},searchProvider='none';
 if(research){try{researchData=await geminiResearch(prompt);searchProvider='Gemini Google Search'}catch{researchData=await wiki(prompt);searchProvider=researchData.sources.length?'Wikipedia fallback':'none'}}
 const messages=[{role:'system',content:SYSTEM},{role:'user',content:'SOLICITUD DEL USUARIO:\n'+prompt+'\n\nCONTEXTO INVESTIGADO (úsalo como apoyo, no lo copies mecánicamente):\n'+researchData.context.slice(0,12000)}];
 const order=provider==='auto'?['gemini','groq','openrouter']:[provider,'gemini','groq','openrouter'].filter((v,i,a)=>a.indexOf(v)===i);let last:any;
 for(const p of order){try{const out=await callProvider(p,messages);return{document:normalizePlan(jsonFromText(out.text),prompt,researchData.sources,{provider:out.provider,model:out.model,searchProvider}),searchProvider}}catch(e){last=e}}
 if(researchData.context)return{document:normalizePlan({title:prompt,subtitle:'Borrador desde fuentes públicas · revisa antes de aprobar',sections:researchData.context.split(/\n\n+/).slice(0,6).map((t:string,i:number)=>({title:'Fragmento '+(i+1),text:t.slice(0,1400),kind:'text'}))},prompt,researchData.sources,{provider:'Sin IA',model:'fallback',searchProvider}),searchProvider};
 throw last||new Error('No hay proveedores IA configurados');
}

async function refineSection(doc:any,index:number,provider:string,instruction:string){
 const s=doc?.sections?.[index];if(!s)throw new Error('Sección inválida');
 const messages=[{role:'system',content:'Eres editor pedagógico. Reescribe SOLO una sección de un material educativo. Conserva exactitud y no inventes fuentes. Devuelve JSON {title,text,formula?,kind,visualHint?}.'},{role:'user',content:'Documento: '+clean(doc.title,180)+'\nSección actual: '+JSON.stringify(s)+'\nInstrucción adicional: '+clean(instruction,500)}];
 const order=provider==='auto'?['groq','gemini','openrouter']:[provider,'groq','gemini','openrouter'].filter((v,i,a)=>a.indexOf(v)===i);let last:any;
 for(const p of order){try{const out=await callProvider(p,messages),x=jsonFromText(out.text);return{section:{title:clean(x.title,100)||s.title,text:clean(x.text,1600)||s.text,...(clean(x.formula,500)?{formula:clean(x.formula,500)}:{}),kind:['text','key-idea','formula','steps','exercise','warning','comparison'].includes(x.kind)?x.kind:(s.kind||'text'),...(clean(x.visualHint,180)?{visualHint:clean(x.visualHint,180)}:{})},provider:out.provider,model:out.model}}catch(e){last=e}}
 throw last||new Error('No fue posible reescribir');
}

export default async function handler(req:Req,res:Res){
 if(req.method!=='POST'){res.status(405).json({error:'Usa POST'});return}
 try{
  const b=req.body||{},action=String(b.action||'plan'),provider=['auto','gemini','groq','openrouter'].includes(b.provider)?b.provider:'auto';
  if(action==='refine-section'){const r=await refineSection(b.document,Number(b.index),provider,String(b.instruction||''));res.setHeader('Cache-Control','no-store');res.status(200).json(r);return}
  const prompt=clean(b.prompt,4000);if(!prompt)throw new Error('Escribe qué material quieres crear');
  const r=await plan(prompt,provider,b.research!==false);res.setHeader('Cache-Control','no-store');res.status(200).json(r);
 }catch(e){res.status(503).json({error:e instanceof Error?e.message:String(e)})}
}
