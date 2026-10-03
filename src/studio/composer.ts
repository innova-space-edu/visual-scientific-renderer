import {mathjax} from 'mathjax-full/js/mathjax.js';
import {TeX} from 'mathjax-full/js/input/tex.js';
import {SVG} from 'mathjax-full/js/output/svg.js';
import {liteAdaptor} from 'mathjax-full/js/adaptors/liteAdaptor.js';
import {RegisterHTMLHandler} from 'mathjax-full/js/handlers/html.js';
import type {VisualDocument,ContentSection} from './content.js';
import {validateDocument,DESIGN_PRESETS} from './content.js';
import {diagramSVG} from './diagrams.js';

const adaptor=liteAdaptor();RegisterHTMLHandler(adaptor);
const math=mathjax.document('',{InputJax:new TeX({packages:['base','ams'],maxBuffer:2000,maxMacros:200}),OutputJax:new SVG({fontCache:'none'})});
export const escapeXML=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));

export function wrapText(text:string,max:number):string[]{
 const out:string[]=[];for(const para of text.split('\n')){let line='';for(const word of para.split(/\s+/)){if(!word)continue;if(line.length+word.length+1>max&&line){out.push(line);line=''}if(word.length>max){if(line){out.push(line);line=''}for(let i=0;i<word.length;i+=max)out.push(word.slice(i,i+max));}else line+=(line?' ':'')+word;}if(line)out.push(line);if(!para)out.push('');}return out;
}
function text(x:number,y:number,value:string,size:number,color:string,max:number,weight=400){return wrapText(value,max).map((s,i)=>`<text x="${x}" y="${y+i*size*1.45}" fill="${color}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}">${escapeXML(s)}</text>`).join('')}
export function formulaSVG(tex:string,x:number,y:number,width:number,color='#14355f'):string{
 const node=math.convert(tex,{display:true});let svg=adaptor.outerHTML(node);svg=svg.slice(svg.indexOf('<svg'),svg.lastIndexOf('</svg>')+6);
 if(!svg||/data-mjx-error/.test(svg))throw new Error('Revisa la fórmula LaTeX');
 const vb=svg.match(/viewBox="([^"]+)"/)?.[1]?.split(' ').map(Number);if(!vb||vb[2]<=0)throw new Error('Fórmula inválida');
 const w=Math.min(width,vb[2]/1000*27,60*vb[2]/vb[3]),h=w*vb[3]/vb[2];
 return svg.replace(/width="[^"]*"/,'width="'+w+'"').replace(/height="[^"]*"/,'height="'+h+'"').replace('<svg ',`<svg x="${x}" y="${y}" color="${color}" `);
}
function bgPattern(d:VisualDocument,width:number){
 const x=d.design;if(!x)return'';
 if(x.background==='grid')return`<defs><pattern id="bg-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="${x.palette.secondary}" stroke-opacity=".18"/></pattern></defs><rect width="${width}" height="100%" fill="url(#bg-grid)"/>`;
 if(x.background==='dots')return`<defs><pattern id="bg-dots" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.2" fill="${x.palette.secondary}" opacity=".12"/></pattern></defs><rect width="${width}" height="100%" fill="url(#bg-dots)"/>`;
 if(x.background==='soft-gradient')return`<defs><linearGradient id="bg-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${x.palette.background}"/><stop offset="1" stop-color="${x.palette.secondary}" stop-opacity=".08"/></linearGradient></defs><rect width="${width}" height="100%" fill="url(#bg-grad)"/>`;
 return'';
}
function kindIcon(s:ContentSection){return s.kind==='exercise'?'✎':s.kind==='warning'?'!':s.kind==='key-idea'?'◆':s.kind==='steps'?'→':s.kind==='comparison'?'⇄':s.kind==='formula'?'ƒ':'•'}

export function composeSVG(input:VisualDocument):{svg:string;width:number;height:number}{
 const d=validateDocument(input),width=d.format==='portrait'?1080:d.format==='square'?1200:1600,baseHeight=d.format==='portrait'?1500:d.format==='square'?1200:1000;
 const legacy=d.theme==='blueprint'?DESIGN_PRESETS['technical-blueprint']:d.theme==='editorial'?DESIGN_PRESETS['minimal-editorial']:DESIGN_PRESETS['educational-clean'];
 const design=d.design||legacy,p=design.palette,dark=d.theme==='blueprint',bg=p.background,ink=p.ink;
 const density=design.density==='compact'?.86:design.density==='airy'?1.16:1,requested=design.columns||2;
 const columns=d.format==='brochure'?3:d.format==='portrait'?1:Math.max(1,Math.min(d.format==='square'?2:4,requested));
 const colors=[p.secondary,p.accent,'#6b63b5','#2f8c67','#3976c5','#b75678'],gap=Math.round(24*density),margin=40,cardWidth=(width-2*margin-(columns-1)*gap)/columns;
 const titleLines=wrapText(d.title,Math.floor((width-100)/26)),headerHeight=68+titleLines.length*55+Math.max(0,wrapText(d.subtitle,Math.floor((width-100)/12)).length-1)*29;
 let body=`<rect width="${width}" height="100%" fill="${bg}"/>${bgPattern(d,width)}<rect x="24" y="24" width="${width-48}" height="${headerHeight}" rx="${design.cornerStyle==='square'?2:18}" fill="${p.primary}"/>${text(55,78,d.title,44,'#fff',Math.floor((width-100)/26),700)}${text(55,68+titleLines.length*55+6,d.subtitle,20,'#d6e8f3',Math.floor((width-100)/12))}`;
 let y=headerHeight+52;
 if(d.diagram!=='none'||d.photo||d.points){
  const area=d.format==='portrait'?480:350;body+=`<rect x="${margin}" y="${y}" width="${width-2*margin}" height="${area}" rx="18" fill="${p.surface}" stroke="${p.secondary}" stroke-opacity=".42"/>`;
  if(d.points){const xs=d.points.map(q=>q.x),ys=d.points.map(q=>q.y),xmin=Math.min(...xs),xrange=Math.max(...xs)-xmin||1,ymin=Math.min(...ys),yrange=Math.max(...ys)-ymin||1,chartWidth=d.photo?(width-2*margin)/2:width-2*margin-40,path=d.points.map((q,i)=>`${i?'L':'M'}${margin+65+(q.x-xmin)/xrange*(chartWidth-100)} ${y+area-55-(q.y-ymin)/yrange*(area-90)}`).join(' ');body+=`<path d="M${margin+65} ${y+30}V${y+area-55}H${margin+chartWidth-35}" fill="none" stroke="${p.secondary}" stroke-opacity=".5" stroke-width="2"/><path d="${path}" fill="none" stroke="${p.secondary}" stroke-width="4"/>${text(margin+70,y+area-20,'x: '+xmin.toFixed(2)+' → '+Math.max(...xs).toFixed(2)+' · y: '+ymin.toFixed(2)+' → '+Math.max(...ys).toFixed(2),16,ink,90)}`;}
  if(!d.points&&d.diagram!=='none')body+=diagramSVG(d.diagram).replace('<svg ',`<svg x="${margin+20}" y="${y+15}" width="${d.photo?(width-2*margin)/2:width-2*margin-40}" height="${area-30}" `);
  if(d.photo)body+=`<image href="${d.photo}" x="${d.diagram==='none'?margin+15:width/2}" y="${y+15}" width="${d.diagram==='none'?width-2*margin-30:width/2-margin-15}" height="${area-30}" preserveAspectRatio="xMidYMid meet"/>`;y+=area+gap;
 }
 for(let start=0;start<d.sections.length;start+=columns){
  const row=d.sections.slice(start,start+columns),heights=row.map(s=>{const titleHeight=wrapText(s.title,Math.floor((cardWidth-72)/15)).length*32;return(42+titleHeight+wrapText(s.text,Math.floor((cardWidth-48)/12)).length*29+(s.formula?95:0)+25)*density}),rowHeight=Math.max(130,...heights);
  row.forEach((s,j)=>{const x=margin+j*(cardWidth+gap),color=s.kind==='warning'?'#c94b46':s.kind==='key-idea'?p.accent:colors[(start+j)%colors.length],headingLines=wrapText(s.title,Math.floor((cardWidth-72)/15)).length;
   body+=`<rect x="${x}" y="${y}" width="${cardWidth}" height="${rowHeight}" rx="${design.cornerStyle==='square'?2:16}" fill="${p.surface}" stroke="${color}" stroke-width="2"/><path d="M${x+16} ${y}H${x+cardWidth-16}Q${x+cardWidth} ${y} ${x+cardWidth} ${y+16}V${y+headingLines*32+20}H${x}V${y+16}Q${x} ${y} ${x+16} ${y}" fill="${color}"/><circle cx="${x+26}" cy="${y+26}" r="14" fill="#fff" fill-opacity=".18"/>${text(x+19,y+32,kindIcon(s),17,'#fff',2,700)}${text(x+48,y+34,`${start+j+1}. ${s.title}`,25,'#fff',Math.floor((cardWidth-92)/15),700)}${text(x+24,y+headingLines*32+55,s.text,20,ink,Math.floor((cardWidth-48)/12))}`;
   if(s.formula){const fy=y+headingLines*32+65+wrapText(s.text,Math.floor((cardWidth-48)/12)).length*29;body+=`<rect x="${x+16}" y="${fy-8}" width="${cardWidth-32}" height="76" rx="10" fill="${p.background}" stroke="${p.secondary}" stroke-opacity=".22"/>${formulaSVG(s.formula,x+28,fy+4,cardWidth-56,ink)}`;}
  });y+=rowHeight+gap;
 }
 if(d.sources.length){body+=text(margin,y+18,'Fuentes revisadas',19,ink,100,700);y+=45;for(const s of d.sources){const value=s.title+' · '+s.url;body+=text(margin,y,value,15,ink,Math.floor((width-80)/9));y+=wrapText(value,Math.floor((width-80)/9)).length*24+6;}}
 body+=text(margin,y+22,'INNOVA SPACE · VISUAL STUDIO · IA para contenido · motor visual determinista',14,dark?'#9ac5df':'#64829a',130);
 const height=Math.max(baseHeight,y+65);return{svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXML(d.title)}">${body}</svg>`,width,height};
}
