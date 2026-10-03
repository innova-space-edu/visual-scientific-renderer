import * as T from 'three/webgpu';
import {expression} from './expression.js';
export type GeometrySpec={kind:'sphere'|'box'|'cone'|'cylinder'|'torus'|'surface'|'pendulum'|'wave';color:string;radius:number;height:number;formula:string};
export function geometryFromPrompt(prompt:string):GeometrySpec[]{
 const p=prompt.toLowerCase();const color=/rojo|roja/.test(p)?'#e35d70':/verde/.test(p)?'#6acda8':/dorado|dorada/.test(p)?'#efb65b':'#67b9ed';
 const radius=Number(p.match(/radio\s*=?\s*(\d+(?:[.,]\d+)?)/)?.[1]?.replace(',','.'))||1;
 const height=Number(p.match(/altura\s*=?\s*(\d+(?:[.,]\d+)?)/)?.[1]?.replace(',','.'))||2;
 const formula=prompt.match(/(?:z\s*=|f\s*\(\s*x\s*,\s*y\s*\)\s*=)\s*([^;\n]+)/i)?.[1]?.trim()??'sin(x)*cos(y)';
 const kinds:GeometrySpec['kind'][]=[];
 if(/superficie|z\s*=|f\s*\(\s*x\s*,\s*y/.test(p))kinds.push('surface');
 if(/péndulo|pendulo/.test(p))kinds.push('pendulum');else if(/onda|wave/.test(p))kinds.push('wave');
 for(const [regex,kind]of [[/esfera|sphere/,'sphere'],[/cubo|caja|box/,'box'],[/cono|cone/,'cone'],[/cilindro|cylinder/,'cylinder'],[/toro|donut|torus/,'torus']] as const)if(regex.test(p))kinds.push(kind);
 if(!kinds.length)throw new Error('Describe esfera, cubo, cono, cilindro, toro, péndulo, onda o una superficie z=... También puedes combinarlos.');
 if(radius>10||height>20)throw new Error('Usa radio de hasta 10 y altura de hasta 20 en unidades visuales');
 return kinds.map(kind=>{const own=p.split(/\s+y\s+|;|\+/).find(part=>part.includes(({sphere:'esfera',box:'cubo',cone:'cono',cylinder:'cilindro',torus:'toro',surface:'superficie',wave:'onda',pendulum:'pendulo'})[kind]));const local=own&&/rojo|roja/.test(own)?'#e35d70':own&&/verde/.test(own)?'#6acda8':own&&/dorado|dorada/.test(own)?'#efb65b':own&&/azul/.test(own)?'#67b9ed':color;return{kind,color:local,radius,height,formula}});
}
export function surfaceGeometry(formula:string,time=0,steps=64){
 const f=expression(formula),positions:number[]=[],indices:number[]=[];
 for(let j=0;j<=steps;j++)for(let i=0;i<=steps;i++){const x=-3+6*i/steps,y=-3+6*j/steps,z=f(x,y,time);if(!Number.isFinite(z)||Math.abs(z)>50)throw new Error('La superficie tiene singularidades o valores fuera del rango ±50');positions.push(x,z,y)}
 for(let j=0;j<steps;j++)for(let i=0;i<steps;i++){const a=j*(steps+1)+i,b=a+1,c=a+steps+1,d=c+1;indices.push(a,c,b,b,c,d)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function buildPromptScene(specs:GeometrySpec[]){
 const scene=new T.Scene(),root=new T.Group();scene.background=new T.Color('#080e1b');scene.add(root);
 scene.add(new T.HemisphereLight(0xdceeff,0x29384c,2));const key=new T.DirectionalLight(0xffeed7,4);key.position.set(5,8,5);key.castShadow=true;scene.add(key);
 const floor=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshStandardNodeMaterial({color:'#28384f',roughness:.8}));floor.rotation.x=-Math.PI/2;floor.position.y=-3;floor.receiveShadow=true;scene.add(floor);
 const updates:((t:number)=>void)[]=[];
 specs.forEach((s,i)=>{
 const group=new T.Group();group.position.x=(i-(specs.length-1)/2)*4;root.add(group);
 const material=new T.MeshPhysicalNodeMaterial({color:s.color,metalness:.2,roughness:.25,clearcoat:1,side:T.DoubleSide});let geometry:T.BufferGeometry;
 switch(s.kind){case'sphere':geometry=new T.SphereGeometry(s.radius,64,32);break;case'box':geometry=new T.BoxGeometry(s.radius*2,s.height,s.radius*2);break;case'cone':geometry=new T.ConeGeometry(s.radius,s.height,64);break;case'cylinder':geometry=new T.CylinderGeometry(s.radius,s.radius,s.height,64);break;case'torus':geometry=new T.TorusGeometry(s.radius,s.radius*.3,24,96);break;case'surface':geometry=surfaceGeometry(s.formula);break;
 case'pendulum':{
 const pivot=new T.Group();pivot.position.y=2;group.add(pivot);const rod=new T.Mesh(new T.CylinderGeometry(.035,.035,s.height,12),material);rod.position.y=-s.height/2;pivot.add(rod);const ball=new T.Mesh(new T.SphereGeometry(s.radius*.3,32,24),material);ball.position.y=-s.height;pivot.add(ball);updates.push(t=>pivot.rotation.z=.45*Math.cos(Math.sqrt(9.81/s.height)*t));return;}
 case'wave':{
 geometry=surfaceGeometry('0.5*sin(2*x-t)',0,40);const mesh=new T.Mesh(geometry,material);group.add(mesh);updates.push(t=>{const p=geometry.attributes.position;for(let v=0;v<p.count;v++)p.setY(v,.5*Math.sin(2*p.getX(v)-t));p.needsUpdate=true;geometry.computeVertexNormals()});return;}}
 const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 });return{scene,root,static:true,update:(t:number)=>updates.forEach(f=>f(t)),extent:Math.max(8,specs.length*4,...specs.map(s=>Math.max(s.radius*3,s.height*2)))};
}
