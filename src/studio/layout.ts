import type {ContentSection,VisualDocument} from './content.js';
import {linesFor,measureFormula} from './typography.js';
export type CardMeasure={heading:string[];body:string[];equations:{tex:string;width:number;height:number;offsetX:number;offsetY:number}[];formulaHeight:number;tableLines:string[][][];tableHeights:number[];height:number;mediaHeight:number;fontSize:number;headingSize:number;pad:number;lineHeight:number};
export type Placement={index:number;x:number;y:number;width:number;height:number;measure:CardMeasure};
export function measureCard(s:ContentSection,width:number,d:VisualDocument):CardMeasure{
 const density=d.design?.density||'medium',worked=s.region==='worked-example',fontSize=worked?18:density==='compact'?19:density==='airy'?23:21,pad=worked?12:22,inner=width-2*pad,headingSize=worked?23:25,lineHeight=fontSize*1.4;
 const heading=linesFor(s.title,width-110,headingSize,true),body=s.text?linesFor(s.text,inner,fontSize):[];
 const texs=[...(s.formula?[s.formula]:[]),...(s.equations||[])];let formulaHeight=0;const usable=inner-28;
 const paired=width>600&&texs.length>1&&texs[0].includes('vmatrix'),across=width>600&&texs.length===2&&!paired&&worked&&texs.every(t=>measureFormula(t,(usable-20)/2,26).width/measureFormula(t,10000,26).width>.72);
 const equations=texs.map((tex,i)=>{const slot=paired?(i===0?usable*.32:usable*.62):across?(usable-20)/texs.length:inner-28;const m=measureFormula(tex,slot,worked?26:29);const offsetX=paired?(i===0?0:usable*.36):across?i*(usable/texs.length):0;let offsetY=0;if(paired&&i>0)offsetY=texs.slice(1,i).reduce((sum,t)=>sum+measureFormula(t,usable*.62,worked?26:29).height+10,0);else if(!across&&!paired)offsetY=formulaHeight;formulaHeight=Math.max(formulaHeight,offsetY+m.height+(worked?12:24));return{tex,...m,offsetX,offsetY};});
 const astro=s.diagram&&['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'].includes(s.diagram);
 const mediaHeight=s.diagram&&s.diagram!=='none'||s.image||s.visual?(astro?135:Math.min(330,inner*.66)):0;
 const tableLines=s.table?[s.table.headers,...s.table.rows].map(row=>row.map(cell=>linesFor(cell,inner/row.length-20,fontSize))):[];
 const tableHeights=tableLines.map(row=>Math.max(...row.map(cell=>cell.length))*lineHeight+20);
 const height=pad*2+heading.length*32+(s.region==='worked-example'?10:20)+body.length*lineHeight+(body.length?12:0)+formulaHeight+(equations.length?14:0)+(mediaHeight?mediaHeight+18:0)+(s.caption?linesFor(s.caption,inner,16).length*23+10:0)+tableHeights.reduce((a,b)=>a+b,0);
 return{heading,body,equations,formulaHeight,tableLines,tableHeights,height:Math.max(s.region==='worked-example'?105:130,Math.ceil(height)),mediaHeight,fontSize,headingSize,pad,lineHeight};
}
/** Semantic regions and spans are packed into non-overlapping lanes. Text decides heights. */
export function planLayout(d:VisualDocument,width:number,startY:number):{cards:Placement[];bottom:number;columns:number;template:string}{
 const margin=36,gap=20,available=width-2*margin,type=d.documentType||'infographic';
 const columns=d.format==='portrait'&&type!=='poster'?1:type==='brochure'||d.format==='brochure'?3:type==='poster'?2:type==='guide'?3:type==='activity'?1:Math.min(4,d.design?.columns||2);
 const columnWidth=(available-gap*(columns-1))/columns,cards:Placement[]=[];let bottom=startY;
 const place=(index:number,col:number,y:number,span=1)=>{const w=columnWidth*span+gap*(span-1),measure=measureCard(d.sections[index],w,d),card={index,x:margin+col*(columnWidth+gap),y,width:w,height:measure.height,measure};cards.push(card);bottom=Math.max(bottom,y+card.height);return y+card.height+gap;};
 const regional=columns===2&&d.sections.some(s=>s.region==='worked-example');
 if(regional){let lanes=[startY,startY];const foot:number[]=[];d.sections.forEach((s,i)=>{if(s.region==='footer'){foot.push(i);return}const lane=s.region==='worked-example'||s.region==='practice'?1:0;lanes[lane]=place(i,lane,lanes[lane]);});let y=Math.max(...lanes);for(const i of foot)y=place(i,0,y,columns);}
 else if(type==='brochure'||d.format==='brochure'){
  const weights=d.sections.map(s=>measureCard(s,columnWidth,d).height+gap),target=weights.reduce((a,b)=>a+b,0)/columns;let col=0,y=startY,total=0;
  d.sections.forEach((_,i)=>{if(col<columns-1&&total>=target&&d.sections.length-i>=columns-col-1){col++;y=startY;total=0;}y=place(i,col,y);total+=weights[i];});
 }else if(type==='worksheet'||type==='guide'||d.diagram==='solar-system'){
  let y=startY;
  for(let start=0;start<d.sections.length;){
   const s=d.sections[start];if(s.span&&s.span>1||s.region==='footer'){y=place(start,0,y,columns);start++;continue;}
   let end=start;while(end<d.sections.length&&end<start+columns&&!(d.sections[end].span&&d.sections[end].span!>1)&&d.sections[end].region!=='footer')end++;
   let next=y;for(let i=start;i<end;i++)next=Math.max(next,place(i,i-start,y));y=next;start=end;
  }
 }else{
  const lanes=Array(columns).fill(startY) as number[];
  d.sections.forEach((s,i)=>{const featured=(type==='poster'&&i===0)||(type==='technical-plan'&&i===0)||s.region==='footer';const span=featured?columns:Math.min(columns,s.span||1);let col=0,y=Infinity;
   for(let j=0;j<=columns-span;j++){const candidate=Math.max(...lanes.slice(j,j+span));if(candidate<y){col=j;y=candidate;}}
   const next=place(i,col,y,span);for(let j=col;j<col+span;j++)lanes[j]=next;
  });
 }
 return{cards,bottom:bottom+gap,columns,template:regional?'explanation-and-example':type};
}
