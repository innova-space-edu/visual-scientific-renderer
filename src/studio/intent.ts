import {DESIGN_PRESETS,type VisualDocument} from './content.js';
export type Brief={topic:string;audience:string;documentType:NonNullable<VisualDocument['documentType']>;format:'landscape'|'portrait'|'square'|'brochure';domain:'math'|'physics'|'science'|'general';brief:boolean;needsExample:boolean;required:string[];preset:string};
const normalized=(s:string)=>s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
/** Explicit user constraints take precedence over model suggestions. */
export function inferBrief(prompt:string):Brief{
 const p=normalized(prompt),audience=prompt.match(/(?:[1-4]\s*(?:[°ºo]|ero|ro|do|to)?\s*medio|primero\s+medio|[1-8]\s*[°ºo]?\s*basico|universitari\w*|preescolar)/i)?.[0]||'Público general';
 const documentType=/folleto|triptico/.test(p)?'brochure':/afiche|poster/.test(p)?'poster':/plano/.test(p)?'technical-plan':/actividad/.test(p)?'activity':/guia/.test(p)?'worksheet':/resumen/.test(p)?'guide':'infographic';
 const format=/horizontal|apaisad|landscape/.test(p)?'landscape':/vertical|portrait/.test(p)?'portrait':/cuadrad|square/.test(p)?'square':documentType==='brochure'?'brochure':['worksheet','activity','poster'].includes(documentType)?'portrait':'landscape';
 const domain=/cramer|ecuacion|matemat|homotec|seno|coseno|circunfer|geometr/.test(p)?'math':/fisica|fuerza|energia|movimiento|onda|pendulo|plasma|sistema solar|astro|planeta/.test(p)?'physics':/biolog|quimic|celula|mol|ciencia/.test(p)?'science':'general';
 const topic=/sistema solar/.test(p)?'Sistema solar':/cramer/.test(p)?'Método de Cramer':prompt.trim();
 return {topic,audience,documentType,format,domain,brief:/breve|cort[ao]|resumid|poca informacion/.test(p),needsExample:/resuelt|paso a paso|ejemplo/.test(p),required:topic==='Sistema solar'&&/cada|todos|los astros/.test(p)&&!/solo|interiores|exteriores|gigantes|terrestres/.test(p)?['Sol','Mercurio','Venus','Tierra','Marte','Júpiter','Saturno','Urano','Neptuno']:[],preset:documentType==='technical-plan'?'technical-blueprint':domain==='math'?'mathematics-pastel':/infantil|preescolar/.test(p)?'kids-illustrated':domain==='science'||domain==='physics'?'science-classroom':'educational-clean'};
}
export function applyBrief(doc:VisualDocument,b:Brief):VisualDocument{
 const design=structuredClone(DESIGN_PRESETS[b.preset]||DESIGN_PRESETS['educational-clean']);
 design.columns=b.documentType==='brochure'?3:b.format==='portrait'?1:b.brief?4:2;
 if(b.documentType==='activity')design.columns=1;
 return {...doc,version:2,documentType:b.documentType,audience:b.audience,format:b.format,theme:b.preset==='technical-blueprint'?'blueprint':'educational',design};
}
