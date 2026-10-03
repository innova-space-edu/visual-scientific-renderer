import {waterCycleSVG} from './water-cycle.js';
const planetColors:Record<string,string>={sun:'#f3b735',mercury:'#a99d96',venus:'#d6a963',earth:'#468dcc',mars:'#cc6c4b',jupiter:'#c79e7b',saturn:'#d9bd83',uranus:'#7ebfc4',neptune:'#4671c5'};
export function planetSVG(kind:string,x:number,y:number,r:number):string{
 const color=planetColors[kind];if(!color)return '';
 const dark='#'+[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*.55).toString(16).padStart(2,'0')).join('');
 const id='planet-'+kind+'-'+Math.round(x)+'-'+Math.round(y),clip=id+'-clip';
 let out=`<defs><radialGradient id="${id}" cx=".3" cy=".25"><stop stop-color="#ffffff"/><stop offset=".25" stop-color="${color}"/><stop offset="1" stop-color="${dark}"/></radialGradient><clipPath id="${clip}"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath></defs>`;
 if(kind==='sun')out+=`<circle cx="${x}" cy="${y}" r="${r*1.22}" fill="${color}" opacity=".13"/><circle cx="${x}" cy="${y}" r="${r*1.1}" fill="${color}" opacity=".22"/>`;
 out+=`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})"/>`;
 if(kind==='saturn')out+=`<ellipse cx="${x}" cy="${y}" rx="${r*1.65}" ry="${r*.38}" fill="none" stroke="#bda178" stroke-width="${r*.18}" transform="rotate(-20 ${x} ${y})"/>`;
 if(kind==='jupiter')for(let i=-2;i<=2;i++)out+=`<path d="M${x-r} ${y+i*r*.28}q${r} ${r*.2} ${r*2} 0" clip-path="url(#${clip})" fill="none" stroke="${i%2?'#e4cbb4':'#a87d5e'}" stroke-width="${r*.13}"/>`;
 if(kind==='jupiter')out+=`<ellipse cx="${x+r*.35}" cy="${y+r*.35}" rx="${r*.22}" ry="${r*.12}" fill="#b96753"/>`;
 if(kind==='earth')out+=`<path d="M${x-r*.8} ${y-r*.45}l${r*.65} ${-r*.2} ${r*.3} ${r*.35} ${-r*.4} ${r*.3} ${r*.15} ${r*.65} ${-r*.35} ${-r*.12}zM${x+r*.25} ${y-r*.6}l${r*.45} ${r*.3} ${-r*.2} ${r*.6} ${-r*.4} ${-r*.3}z" fill="#80b48d" clip-path="url(#${clip})"/>`;
 if(kind==='mercury'||kind==='mars')for(const [dx,dy,rr]of [[-.3,-.3,.18],[.4,.2,.25],[-.35,.4,.13]])out+=`<circle cx="${x+dx*r}" cy="${y+dy*r}" r="${rr*r}" fill="#6e5247" opacity=".22"/>`;
 if(kind!=='sun')out+=`<path d="M${x} ${y-r}a${r} ${r} 0 0 1 0 ${2*r}a${r*.72} ${r} 0 0 0 0 ${-2*r}" fill="#152744" opacity=".13"/>`;
 return out;
}
const line=(x:number,y:number,a:number,b:number,color='#24538c',dash='')=>`<path d="M${x} ${y}L${a} ${b}" fill="none" stroke="${color}" stroke-width="3" ${dash?'stroke-dasharray="'+dash+'"':''}/>`;
const label=(x:number,y:number,s:string,color='#183759')=>`<text x="${x}" y="${y}" fill="${color}" font-size="22" font-family="sans-serif">${s}</text>`;
export function diagramSVG(kind:string):string{
 if(kind==='water-cycle')return waterCycleSVG();
 const defs='<defs><linearGradient id="solid" x2="1" y2="0"><stop stop-color="#8ce0fa"/><stop offset=".45" stop-color="#e2f8ff"/><stop offset="1" stop-color="#259acb"/></linearGradient><linearGradient id="gold"><stop stop-color="#fff0b2"/><stop offset="1" stop-color="#efaa42"/></linearGradient><radialGradient id="atom"><stop stop-color="#ffab9f"/><stop offset="1" stop-color="#c92454"/></radialGradient></defs>';
 let body='';
 if(kind==='solar-system'){const names=['Sol','Mercurio','Venus','Tierra','Marte','Júpiter','Saturno','Urano','Neptuno'],keys=Object.keys(planetColors);body='<rect width="1200" height="150" rx="18" fill="#112b4a"/>';for(let i=0;i<75;i++)body+=`<circle cx="${(i*173+41)%1200}" cy="${(i*47+13)%145}" r="${i%3===0?1.5:.8}" fill="#daeaff" opacity=".45"/>`;keys.forEach((k,i)=>{const x=75+i*130,r=[32,12,19,20,16,32,27,23,22][i];body+=planetSVG(k,x,65,r)+label(x-names[i].length*5,130,names[i],'#e9f5ff');});return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 150">${body}</svg>`;}
 if(planetColors[kind])return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 220">${planetSVG(kind,280,108,kind==='sun'?72:65)}</svg>`;
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
 }else if(kind.startsWith('angle-')||kind==='tangent'){
 const cx=240,cy=185,r=120,point=(a:number)=>[cx+r*Math.cos(a),cy-r*Math.sin(a)];const a=point(Math.PI/3),b=point(0),c=point(Math.PI*1.15);
 body+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#16385e" stroke-width="3"/>`;
 if(kind==='tangent'){body+=line(90,cy-r,470,cy-r)+line(cx,cy,cx,cy-r)+`<path d="M${cx} ${cy-r+18}h18v-18" fill="none" stroke="#e45770" stroke-width="2"/>`+label(cx+12,cy-r-12,'T')+label(cx+12,cy+8,'O')+label(380,cy-r-12,'tangente');}
 else if(kind==='angle-exterior'){
 const p=[475,185],fars=[point(2.25),point(4.03)],nears=fars.map(f=>{const vx=f[0]-p[0],vy=f[1]-p[1],t=((p[0]-cx)**2+(p[1]-cy)**2-r*r)/(vx*vx+vy*vy);return[p[0]+t*vx,p[1]+t*vy]});
 fars.forEach(f=>body+=line(p[0],p[1],f[0],f[1]));for(const [q,name] of [[fars[0],'A'],[fars[1],'C'],[nears[0],'B'],[nears[1],'D'],[p,'P']] as [number[],string][])body+=`<circle cx="${q[0]}" cy="${q[1]}" r="5" fill="#16385e"/>`+label(q[0]+5,q[1]-8,name);
 body+=`<path d="M${fars[0][0]} ${fars[0][1]}A${r} ${r} 0 0 0 ${fars[1][0]} ${fars[1][1]}" fill="none" stroke="#309b63" stroke-width="5"/><path d="M${nears[0][0]} ${nears[0][1]}A${r} ${r} 0 0 1 ${nears[1][0]} ${nears[1][1]}" fill="none" stroke="#ea9224" stroke-width="5"/>`;
 }else if(kind==='angle-interior'){
 const c=point(Math.PI*4/3),dd=point(Math.PI);body+=line(a[0],a[1],c[0],c[1])+line(b[0],b[1],dd[0],dd[1]);for(const [q,name] of [[a,'A'],[b,'B'],[c,'C'],[dd,'D'],[[cx,cy],'P']] as [number[],string][])body+=`<circle cx="${q[0]}" cy="${q[1]}" r="5" fill="#16385e"/>`+label(q[0]+8,q[1]-10,name);
 body+=`<path d="M${b[0]} ${b[1]}A${r} ${r} 0 0 0 ${a[0]} ${a[1]}M${dd[0]} ${dd[1]}A${r} ${r} 0 0 0 ${c[0]} ${c[1]}" fill="none" stroke="#309b63" stroke-width="5"/>`;
 }else{const p=kind==='angle-central' ?[cx,cy]:kind==='angle-inscribed'?c:kind==='angle-exterior'?[475,cy+30]:[cx+20,cy+20];body+=line(p[0],p[1],a[0],a[1])+line(p[0],p[1],b[0],b[1]);if(kind==='angle-interior')body+=line(p[0],p[1],c[0],c[1])+line(p[0],p[1],point(Math.PI*.85)[0],point(Math.PI*.85)[1]);body+=`<path d="M${b[0]} ${b[1]}A${r} ${r} 0 0 0 ${a[0]} ${a[1]}" fill="none" stroke="#309b63" stroke-width="5"/>`+label(a[0]+6,a[1]-10,'A')+label(b[0]+8,b[1]+10,'B')+label(p[0]-25,p[1]+28,kind==='angle-central'?'O':'P');for(const q of [a,b,p])body+=`<circle cx="${q[0]}" cy="${q[1]}" r="5" fill="#16385e"/>`;}
 }else if(kind==='molecule'){
 body+=line(280,165,135,260,'#8098ad')+line(280,165,425,260,'#8098ad');body+=`<circle cx="280" cy="165" r="75" fill="url(#atom)"/><circle cx="135" cy="260" r="47" fill="#d8e5f3" stroke="#8caac4"/><circle cx="425" cy="260" r="47" fill="#d8e5f3" stroke="#8caac4"/>${label(267,172,'O','#fff')}${label(127,267,'H')}${label(417,267,'H')}${label(222,350,'Agua · H₂O')}`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 380">${defs}${body}</svg>`;
}
