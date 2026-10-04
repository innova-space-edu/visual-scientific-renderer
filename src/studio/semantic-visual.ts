import {textSVG,linesFor} from './typography.js';
/** Bounded semantic nodes: renderer computes all positions and connector endpoints. */
export function semanticSVG(visual:{type:'flow'|'cycle';labels:string[]}):string{
 const n=visual.labels.length,width=720,height=420,bw=visual.type==='cycle'?175:210,bh=110;
 const points=visual.labels.map((_,i)=>visual.type==='cycle'?{x:width/2+225*Math.cos(-Math.PI/2+i*2*Math.PI/n),y:height/2+135*Math.sin(-Math.PI/2+i*2*Math.PI/n)}:{x:125+(i<3?i%3:2-i%3)*235,y:120+Math.floor(i/3)*190});
 const edge=(a:{x:number;y:number},b:{x:number;y:number})=>{const dx=b.x-a.x,dy=b.y-a.y,t=1/Math.max(Math.abs(dx)/(bw/2+9),Math.abs(dy)/(bh/2+9));return {x:a.x+dx*t,y:a.y+dy*t};};
 let content='<defs><marker id="semantic-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#6c8aab"/></marker></defs>';
 for(let i=0;i<(visual.type==='cycle'?n:n-1);i++){const a=points[i],b=points[(i+1)%n],start=edge(a,b),end=edge(b,a);content+=`<path d="M${start.x} ${start.y}L${end.x} ${end.y}" fill="none" stroke="#6c8aab" stroke-width="3" marker-end="url(#semantic-arrow)"/>`;}
 points.forEach((p,i)=>{const lines=linesFor(visual.labels[i],bw-22,16,true);content+=`<rect x="${p.x-bw/2}" y="${p.y-bh/2}" width="${bw}" height="${bh}" rx="16" fill="${['#e8f0fc','#e5f4eb','#f8eacb'][i%3]}" stroke="#aac0d8"/>${textSVG(lines,p.x-bw/2+11,p.y-(lines.length-1)*10.5+5,16,'#284565',true,21)}`;});
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${content}</svg>`;
}
