/** Fixed public encyclopedia endpoint. No user URL fetches and no image-generation APIs. */
export default async function handler(req:any,res:any){
 if(req.method!=='POST'){res.status(405).json({error:'Usa POST'});return}
 const topic=String(req.body?.topic??'').trim();if(!topic||topic.length>180){res.status(400).json({error:'Escribe un tema de hasta 180 caracteres'});return}
 try{
 const endpoint='https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch='+encodeURIComponent(topic)+'&gsrlimit=3&prop=extracts|info&exintro=1&explaintext=1&inprop=url&format=json';
 const response=await fetch(endpoint,{headers:{'User-Agent':'InnovaVisualStudio/1.0 (educational content research)'},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error('La fuente no respondió');const data=await response.json();const pages=(Object.values(data.query?.pages??{}) as any[]).sort((a,b)=>(a.index??0)-(b.index??0));if(!pages.length){res.status(404).json({error:'No se encontraron fuentes. Puedes pegar tu contenido.'});return}
 const sections=pages.map(p=>{let text=String(p.extract??'').slice(0,1200);if(String(p.extract??'').length>1200){const end=Math.max(text.lastIndexOf('.'),text.lastIndexOf('!'),text.lastIndexOf('?'));if(end>200)text=text.slice(0,end+1);}return{title:p.title,text}});const sources=pages.map(p=>({title:p.title,url:p.fullurl}));
 // A text assistant is optional. The approved source excerpts remain visible to the user.
 let result={title:topic,subtitle:'Investigación de fuentes públicas · Revisa antes de aprobar',sections,sources};
 if(process.env.CONTENT_API_KEY&&process.env.CONTENT_API_URL&&process.env.CONTENT_MODEL){
 const r=await fetch(process.env.CONTENT_API_URL,{method:'POST',headers:{Authorization:'Bearer '+process.env.CONTENT_API_KEY,'Content-Type':'application/json'},signal:AbortSignal.timeout(20000),body:JSON.stringify({model:process.env.CONTENT_MODEL,temperature:0,messages:[{role:'system',content:'Organiza SOLO los extractos dados en español. No inventes datos ni fuentes. Devuelve JSON {title,subtitle,sections:[{title,text}]}. No generes imágenes.'},{role:'user',content:JSON.stringify({topic,sections})}]})});
 if(r.ok){const body=await r.json();try{const generated=JSON.parse(body.choices[0].message.content);if(typeof generated.title==='string'&&Array.isArray(generated.sections)&&generated.sections.length<=12&&generated.sections.every((s:any)=>typeof s.title==='string'&&typeof s.text==='string'))result={...result,title:generated.title.slice(0,180),sections:generated.sections.map((s:any)=>({title:s.title.slice(0,100),text:s.text.slice(0,1600)}))};}catch{/* Keep original excerpts. */}}
 }
 res.setHeader('Cache-Control','no-store');res.status(200).json(result);
 }catch{res.status(503).json({error:'La investigación no está disponible ahora. Pega texto y fuentes para continuar; el motor local sigue funcionando.'})}
}
