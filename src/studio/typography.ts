import {mathjax} from 'mathjax-full/js/mathjax.js';
import {TeX} from 'mathjax-full/js/input/tex.js';
import {SVG} from 'mathjax-full/js/output/svg.js';
import {liteAdaptor} from 'mathjax-full/js/adaptors/liteAdaptor.js';
import {RegisterHTMLHandler} from 'mathjax-full/js/handlers/html.js';
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js';
const adaptor=liteAdaptor();RegisterHTMLHandler(adaptor);
const math=mathjax.document('',{InputJax:new TeX({packages:['base','ams'],maxBuffer:6000,maxMacros:200}),OutputJax:new SVG({fontCache:'none'})});
export const escapeXML=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
/** Conservative portable Arial advances. Measurement and rendering share line breaks. */
export function textWidth(value:string,size:number,bold=false){return [...value].reduce((sum,c)=>sum+(/[ilI.,:;'!|]/.test(c)?.3:/[MW@%]/.test(c)?.94:/\s/.test(c)?.32:/[A-ZÁÉÍÓÚÑ]/.test(c)?.7:.57),0)*size*(bold?1.04:1);}
export function linesFor(text:string,width:number,size:number,bold=false):string[]{
 const out:string[]=[];
 for(const para of text.split('\n')){let line='';for(const word of para.split(/\s+/).filter(Boolean)){
  if(textWidth((line?line+' ':'')+word,size,bold)>width&&line){out.push(line);line='';}
  if(textWidth(word,size,bold)>width){let part='';for(const c of word){if(textWidth(part+c,size,bold)>width&&part){out.push(part);part='';}part+=c;}line=part;}else line+=(line?' ':'')+word;
 }out.push(line);}return out;
}
export function textSVG(lines:string[],x:number,y:number,size:number,color:string,bold=false,lineHeight=size*1.4){return lines.map((v,i)=>`<text x="${x}" y="${y+i*lineHeight}" fill="${color}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${bold?700:400}">${escapeXML(v)}</text>`).join('');}
const cache=new Map<string,{svg:string;vb:number[]}>();
export function measureFormula(tex:string,width:number,fontSize=29){
 let data=cache.get(tex);if(!data){const node=math.convert(tex,{display:true});let svg=adaptor.outerHTML(node);svg=svg.slice(svg.indexOf('<svg'),svg.lastIndexOf('</svg>')+6);const vb=svg.match(/viewBox="([^"]+)"/)?.[1]?.split(/\s+/).map(Number);
 if(!svg||/data-mjx-error/.test(svg)||!vb||vb.some(v=>!Number.isFinite(v))||vb[2]<=0||vb[3]<=0)throw new Error('Revisa la fórmula LaTeX');data={svg,vb};if(cache.size>300)cache.clear();cache.set(tex,data);}
 const w=Math.min(width,data.vb[2]/1000*fontSize),h=w*data.vb[3]/data.vb[2];return{width:w,height:h,svg:data.svg};
}
export function formulaSVG(tex:string,x:number,y:number,width:number,color='#14355f',fontSize=29){const m=measureFormula(tex,width,fontSize);return m.svg.replace(/width="[^"]*"/,`width="${m.width}"`).replace(/height="[^"]*"/,`height="${m.height}"`).replace('<svg ',`<svg x="${x}" y="${y}" color="${color}" `);}
