const line=(x:number,y:number,a:number,b:number,color='#24538c',dash='')=>`<path d="M${x} ${y}L${a} ${b}" fill="none" stroke="${color}" stroke-width="3" ${dash?'stroke-dasharray="'+dash+'"':''}/>`;
const label=(x:number,y:number,s:string,color='#183759')=>`<text x="${x}" y="${y}" fill="${color}" font-size="22" font-family="sans-serif">${s}</text>`;
export function diagramSVG(kind:string):string{
 const defs='<defs><linearGradient id="solid" x2="1" y2="0"><stop stop-color="#8ce0fa"/><stop offset=".45" stop-color="#e2f8ff"/><stop offset="1" stop-color="#259acb"/></linearGradient><linearGradient id="gold"><stop stop-color="#fff0b2"/><stop offset="1" stop-color="#efaa42"/></linearGradient><radialGradient id="atom"><stop stop-color="#ffab9f"/><stop offset="1" stop-color="#c92454"/></radialGradient></defs>';
 let body='';
 if(kind==='solids'){
 body=`<path d="M55 255 L150 45 L245 255 Q150 310 55 255" fill="url(#solid)" stroke="#24538c" stroke-width="3"/><ellipse cx="150" cy="255" rx="95" ry="30" fill="none" stroke="#24538c" stroke-width="3" stroke-dasharray="7 5"/>${line(150,45,150,255,'#279372','7 5')}${line(150,255,245,255)}${label(156,160,'h')}${label(190,248,'r')}${label(52,335,'Cono')}<path d="M330 90 L330 255 A90 30 0 0 0 510 255 L510 90" fill="url(#gold)" stroke="#a16516" stroke-width="3"/><ellipse cx="420" cy="90" rx="90" ry="30" fill="url(#gold)" stroke="#a16516" stroke-width="3"/><ellipse cx="420" cy="255" rx="90" ry="30" fill="none" stroke="#a16516" stroke-dasharray="7 5"/>${line(420,90,420,255,'#279372','7 5')}${line(420,255,510,255)}${label(430,180,'h')}${label(458,248,'r')}${label(361,335,'Cilindro')}`;
 }else if(kind==='wave'){
 for(let i=0;i<=12;i++)body+=line(45+i*40,40,45+i*40,300,'#dae6ef');for(let i=0;i<7;i++)body+=line(45,40+i*40,525,40+i*40,'#dae6ef');
 body+=line(45,180,535,180)+line(45,30,45,310);let points='';for(let i=0;i<=240;i++){const x=i/240*480,y=180-100*Math.sin(i/240*Math.PI*4);points+=`${i?'L':'M'}${45+x} ${y} `}body+=`<path d="${points}" fill="none" stroke="#2467c6" stroke-width="5"/>${line(45,80,525,80,'#cf5477','6 6')}${line(45,280,525,280,'#cf5477','6 6')}${label(10,85,'A')}${label(275,337,'T')}${label(508,210,'x')}`;
 }else if(kind==='homothety'){
 [-2,-.5,.5,2].forEach((k,i)=>{const ox=135+(i%2)*280,oy=92+Math.floor(i/2)*180,vertices=[[30,-20],[60,-20],[30,-50]];for(const [x,y]of vertices)body+=line(ox-2*x,oy-2*y,ox+2*x,oy+2*y,'#b7c7dc','4 4');body+=`<polygon points="${vertices.map(([x,y])=>`${ox+x},${oy+y}`).join(' ')}" fill="#adcaff" stroke="#2867b2" stroke-width="2"/><polygon points="${vertices.map(([x,y])=>`${ox+k*x},${oy+k*y}`).join(' ')}" fill="#d5f0de" stroke="#308951" stroke-width="2"/><circle cx="${ox}" cy="${oy}" r="4"/>${label(ox-55,oy+65,'k = '+k)}`});
 }else if(kind==='blueprint'){
 body=`<rect x="18" y="18" width="530" height="350" fill="#103c73"/>`;const x=163,y=42,w=210,h=w*8.55/5.87,stage=w*2.5/5.87;
 body+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#d8efff" stroke-width="2"/><rect x="${x}" y="${y}" width="${w}" height="${stage}" fill="#1d538b" stroke="#d8efff"/>${label(x+35,y+stage/2,'TARIMA','#d8efff')}${label(x+65,30,'5,87 m','#d8efff')}${label(385,215,'8,55 m','#d8efff')}`;
 for(let row=0;row<5;row++)for(let col=0;col<8;col++)body+=`<circle cx="${x+18+col*25}" cy="${y+stage+28+row*35}" r="7" fill="none" stroke="#d8efff"/>`;
 for(let s=0;s<10;s++)body+=`<rect x="${x-39}" y="${y+stage-20+s*7}" width="28" height="7" fill="none" stroke="#d8efff"/>`;
 }else if(kind==='molecule'){
 body+=line(280,165,135,260,'#8098ad')+line(280,165,425,260,'#8098ad');body+=`<circle cx="280" cy="165" r="75" fill="url(#atom)"/><circle cx="135" cy="260" r="47" fill="#d8e5f3" stroke="#8caac4"/><circle cx="425" cy="260" r="47" fill="#d8e5f3" stroke="#8caac4"/>${label(267,172,'O','#fff')}${label(127,267,'H')}${label(417,267,'H')}${label(222,350,'Agua · H₂O')}`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 380">${defs}${body}</svg>`;
}
