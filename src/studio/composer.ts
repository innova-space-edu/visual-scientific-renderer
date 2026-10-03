import type {VisualDocument,ContentSection} from './content.js';
import {validateDocument,DESIGN_PRESETS} from './content.js';
import {diagramSVG} from './diagrams.js';
import {semanticSVG} from './semantic-visual.js';
import {escapeXML,textSVG,linesFor,formulaSVG} from './typography.js';
import {planLayout,type Placement} from './layout.js';
import {iconSVG} from './icons.js';
export {escapeXML,formulaSVG} from './typography.js';
/** Retained for clients using the v1 character-count helper. */
export function wrapText(text:string,max:number):string[]{return linesFor(text,Math.max(1,max)*10,17);}
const tones={blue:'#2b7abb',pink:'#cc4966',green:'#378458',purple:'#7760ac',gold:'#b87512'};
function background(d:VisualDocument){const design=d.design!,p=design.palette;if(design.background==='grid')return`<defs><pattern id="bg-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="${p.secondary}" stroke-opacity=".22"/></pattern></defs><rect width="100%" height="100%" fill="url(#bg-grid)"/>`;if(design.background==='dots')return`<defs><pattern id="bg-dots" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.8" fill="${p.secondary}" opacity=".12"/></pattern></defs><rect width="100%" height="100%" fill="url(#bg-dots)"/>`;if(design.background==='soft-gradient')return`<defs><linearGradient id="bg-grad" x2="1" y2="1"><stop stop-color="${p.background}"/><stop offset="1" stop-color="${p.secondary}" stop-opacity=".09"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#bg-grad)"/><path d="M0 100Q180 -80 320 100T700 70V0H0Z" fill="${p.secondary}" opacity=".06"/>`;if(design.background==='paper')return`<path d="M0 14H2000M0 28H2000" stroke="${p.ink}" opacity=".025"/>`;return'';}
function cardSVG(card:Placement,s:ContentSection,d:VisualDocument){
 const {x,y,width,height,measure:m}=card,p=d.design!.palette,dark=d.theme==='blueprint',color=s.tone?tones[s.tone]:s.kind==='warning'?tones.pink:s.kind==='key-idea'?tones.gold:s.kind==='steps'?tones.purple:s.kind==='comparison'?tones.green:p.secondary;
 const radius=d.design!.cornerStyle==='square'?2:d.design!.cornerStyle==='soft'?10:20,headingHeight=m.heading.length*32+18;
 let out=`<g data-section="${card.index}" data-region="${s.region||'auto'}"><title>${escapeXML(s.title)}</title><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${p.surface}" stroke="${dark?p.accent:color}" stroke-opacity=".5" stroke-width="1.8"/><rect x="${x+2}" y="${y+2}" width="${width-4}" height="${headingHeight}" rx="${radius}" fill="${color}" fill-opacity="${dark?'.35':'.13'}"/><circle cx="${x+30}" cy="${y+29}" r="17" fill="${color}"/>${textSVG([String(card.index+1)],x+23,y+36,18,'#ffffff',true)}${textSVG(m.heading,x+55,y+33,m.headingSize,p.ink,true,32)}`;
 let cy=y+headingHeight+29;out+=textSVG(m.body,x+m.pad,cy,m.fontSize,p.ink,false,m.lineHeight);cy+=m.body.length*m.lineHeight+(m.body.length?12:0);
 if(m.mediaHeight){if(s.visual)out+=semanticSVG(s.visual).replace('<svg ',`<svg x="${x+m.pad}" y="${cy-8}" width="${width-2*m.pad}" height="${m.mediaHeight}" `);else if(s.diagram&&s.diagram!=='none')out+=diagramSVG(s.diagram).replace('<svg ',`<svg x="${x+m.pad}" y="${cy-8}" width="${width-2*m.pad}" height="${m.mediaHeight}" `);else if(s.image)out+=`<image href="${s.image}" x="${x+m.pad}" y="${cy-8}" width="${width-2*m.pad}" height="${m.mediaHeight}" preserveAspectRatio="xMidYMid meet"/>`;cy+=m.mediaHeight+18;}
 if(s.caption){const ls=linesFor(s.caption,width-2*m.pad,16);out+=textSVG(ls,x+m.pad,cy,16,p.ink);cy+=ls.length*23+10;}
 if(m.equations.length){const total=m.formulaHeight;out+=`<rect x="${x+m.pad-6}" y="${cy-8}" width="${width-2*m.pad+12}" height="${total+10}" rx="12" fill="${color}" fill-opacity=".06" stroke="${color}" stroke-opacity=".16"/>`;for(const eq of m.equations){out+=formulaSVG(eq.tex,x+m.pad+14+eq.offsetX,cy+eq.offsetY,eq.width,p.ink,s.region==='worked-example'?26:29);}cy+=total;}
 if(s.table){const cw=(width-2*m.pad)/s.table.headers.length;let ty=cy-8;m.tableLines.forEach((row,i)=>{row.forEach((cell,j)=>{out+=`<rect x="${x+m.pad+j*cw}" y="${ty}" width="${cw}" height="${m.tableHeights[i]}" fill="${i===0?color:p.surface}" fill-opacity="${i===0?'.18':'1'}" stroke="${color}" stroke-opacity=".35"/>${textSVG(cell,x+m.pad+j*cw+10,ty+10+m.fontSize,m.fontSize,p.ink,i===0,m.lineHeight)}`;});ty+=m.tableHeights[i];});}
 if(s.icon)out+=iconSVG(s.icon,x+width-36,y+15,23,color);
 return out+'</g>';
}
function heroSVG(d:VisualDocument,x:number,y:number,width:number,height:number){
 const p=d.design!.palette;let out=`<g data-role="visual-hero"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="${p.surface}" stroke="${p.secondary}" stroke-opacity=".35"/>`;
 const hasDiagram=d.diagram!=='none',visualWidth=d.photo&&(hasDiagram||d.points)?width/2:width;
 if(d.points){const xs=d.points.map(q=>q.x),ys=d.points.map(q=>q.y),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),xr=xmax-xmin||1,yr=ymax-ymin||1;const path=d.points.map((q,i)=>`${i?'L':'M'}${x+60+(q.x-xmin)/xr*(visualWidth-100)} ${y+height-50-(q.y-ymin)/yr*(height-90)}`).join(' ');out+=`<path d="M${x+60} ${y+30}V${y+height-50}H${x+visualWidth-30}" fill="none" stroke="${p.ink}" stroke-width="2"/><path d="${path}" fill="none" stroke="${p.secondary}" stroke-width="4"/>${textSVG([`x: ${xmin.toFixed(2)} → ${xmax.toFixed(2)} · y: ${ymin.toFixed(2)} → ${ymax.toFixed(2)}`],x+60,y+height-15,16,p.ink)}`;}
 else if(hasDiagram)out+=diagramSVG(d.diagram).replace('<svg ',`<svg x="${x+14}" y="${y+14}" width="${visualWidth-28}" height="${height-28}" `);
 if(d.photo)out+=`<image href="${d.photo}" x="${x+(hasDiagram||d.points?width/2:0)+14}" y="${y+14}" width="${visualWidth-28}" height="${height-28}" preserveAspectRatio="xMidYMid meet"/>`;return out+'</g>';
}
function composeAtWidth(input:VisualDocument,override?:number):{svg:string;width:number;height:number}{
 const d=validateDocument(input);d.design ||= structuredClone(d.theme==='blueprint'?DESIGN_PRESETS['technical-blueprint']:d.theme==='editorial'?DESIGN_PRESETS['minimal-editorial']:DESIGN_PRESETS['educational-clean']);const p=d.design.palette;
 const width=override||(d.format==='portrait'?1080:d.format==='square'?1200:d.sections.some(s=>s.equations?.some(t=>t.includes('vmatrix')&&t.split('\\\\').length===3))?1920:d.diagram==='solar-system'?2400:1600),baseHeight=d.format==='portrait'?1500:d.format==='square'?1200:1000;
 const titleSize=d.documentType==='poster'?62:52,title=linesFor(d.title,width-270,titleSize,true),subtitle=linesFor(d.subtitle,width-190,22),headerHeight=55+title.length*(titleSize*1.15)+subtitle.length*31+22;
 let content=`<rect x="36" y="30" width="${width-72}" height="${headerHeight}" rx="22" fill="${p.primary}"/>${textSVG(title,125,80,titleSize,'#ffffff',true,titleSize*1.15)}${textSVG(subtitle,125,80+title.length*titleSize*1.15,22,'#e4f4ff',false,31)}${iconSVG(d.subject==='Matemática'||/cramer|matem|ecuac/i.test(d.title)?'calculator':'book',54,63,50,'#ffffff')}`;
 let start=headerHeight+56;
 if(d.diagram!=='none'||d.photo||d.points){const hh=d.documentType==='technical-plan'?620:d.documentType==='poster'?430:d.diagram==='solar-system'?240:300;content+=heroSVG(d,36,start,width-72,hh);start+=hh+22;}
 const layout=planLayout(d,width,start);for(const card of layout.cards)content+=cardSVG(card,d.sections[card.index],d);let y=layout.bottom;
 if(d.sources.length){content+=textSVG(['Fuentes revisadas'],36,y+24,20,p.ink,true);y+=50;for(const [i,s] of d.sources.entries()){const ls=linesFor('['+(i+1)+'] '+s.title,width-72,15);content+=`<a href="${escapeXML(s.url)}">${textSVG(ls,36,y,15,p.ink)}</a>`;y+=ls.length*22+10;}}
 const height=Math.max(baseHeight,Math.ceil(y+62));content+=`<path d="M36 ${height-48}H${width-36}" stroke="${p.secondary}" opacity=".25"/>${textSVG(['INNOVA SPACE · VISUAL STUDIO'],36,height-22,13,p.ink)}${textSVG([`${layout.template} · ${d.audience||'Material educativo'}`],width-470,height-22,13,p.ink)}`;
 return{svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXML(d.title)}" data-template="${layout.template}"><rect width="100%" height="100%" fill="${p.background}"/>${background(d)}${content}</svg>`,width,height};
}

/** Preserve the requested orientation even when content needs a wider canvas. */
export function composeSVG(input:VisualDocument):{svg:string;width:number;height:number}{
 let output=composeAtWidth(input);
 if(input.format==='landscape'||input.format==='brochure'){
  for(let i=0;i<4&&output.height>=output.width;i++)output=composeAtWidth(input,Math.ceil(output.height*1.4));
  if(output.height>=output.width)throw new Error('El contenido excede el formato horizontal. Reduce la cantidad de información solicitada.');
 }
 if(input.format==='square'){
  const size=Math.max(output.width,output.height),offset=(size-output.width)/2;
  output={svg:output.svg.replace('<rect width="100%" height="100%"',`<rect x="${-offset}" width="${size}" height="${size}"`).replace(/width="\d+" height="\d+" viewBox="[^"]+"/,`width="${size}" height="${size}" viewBox="${-offset} 0 ${size} ${size}"`),width:size,height:size};
 }
 return output;
}
