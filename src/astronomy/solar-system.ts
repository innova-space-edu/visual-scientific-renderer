import {createProceduralMaterial} from "../materials/procedural.js";import {ParticleSystem} from "../particles/webgpu.js";import {makeGlowShell} from "../postfx/postfx.js";
export type SolarBodySpec={id:string;radius:number;distance:number;material:"sun"|"rocky"|"gas-giant"|"ice-giant";a:string;b:string;ring?:{inner:number;outer:number;opacity:number};tilt?:number;storm?:boolean};
export const SOLAR_SYSTEM:SolarBodySpec[]=[
{id:"sun",radius:.72,distance:0,material:"sun",a:"#ff6b00",b:"#fff0a8"},
{id:"mercury",radius:.055,distance:1.25,material:"rocky",a:"#6e6a65",b:"#b8aba0"},
{id:"venus",radius:.12,distance:1.62,material:"rocky",a:"#a85c22",b:"#f3d594"},
{id:"earth",radius:.125,distance:2.02,material:"rocky",a:"#1559b7",b:"#52b788",tilt:23.4},
{id:"mars",radius:.08,distance:2.42,material:"rocky",a:"#8d2c18",b:"#dd7651"},
{id:"jupiter",radius:.34,distance:3.15,material:"gas-giant",a:"#8b4f2f",b:"#ead2b8",tilt:3.1,storm:true,ring:{inner:.39,outer:.43,opacity:.18}},
{id:"saturn",radius:.29,distance:3.95,material:"gas-giant",a:"#bfa15c",b:"#f5e3aa",ring:{inner:.38,outer:.64,opacity:.72},tilt:26.7},
{id:"uranus",radius:.19,distance:4.7,material:"ice-giant",a:"#62cada",b:"#d2fbff",tilt:97.8,ring:{inner:.23,outer:.30,opacity:.24}},
{id:"neptune",radius:.185,distance:5.4,material:"ice-giant",a:"#173caa",b:"#5f84ff",tilt:28.3,ring:{inner:.22,outer:.28,opacity:.12}}];
function starfield(THREE:any,count=2400,seed=42){
  let a=seed>>>0;const rnd=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const pos=new Float32Array(count*3);for(let i=0;i<count;i++){const r=18+rnd()*30,theta=rnd()*Math.PI*2,phi=Math.acos(2*rnd()-1),o=i*3;pos[o]=r*Math.sin(phi)*Math.cos(theta);pos[o+1]=r*Math.cos(phi);pos[o+2]=r*Math.sin(phi)*Math.sin(theta)}
  const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(pos,3));return new THREE.Points(geo,new THREE.PointsMaterial({color:0xbfd8ff,size:.035,transparent:true,opacity:.8,depthWrite:false}));
}
export async function buildAdvancedSolarSystemScene(options:{scale?:number;particleCount?:number;seed?:number}={}){
  const THREE:any=await import("three/webgpu"),scene=new THREE.Scene();scene.background=new THREE.Color(0x01040a);scene.add(starfield(THREE,2600,options.seed??42));
  const root=new THREE.Group();scene.add(root);const objects=new Map<string,any>(),scale=options.scale??1,seed=options.seed??42;
  for(let index=0;index<SOLAR_SYSTEM.length;index++){
    const body=SOLAR_SYSTEM[index]!,geometry=new THREE.SphereGeometry(body.radius*scale,96,64),material=await createProceduralMaterial(body.material,{seed:seed+index*13,colorA:body.a,colorB:body.b,bands:body.material==="gas-giant"?30:12,turbulence:body.id==="sun"?10:5,emissive:3.2,size:512,storm:body.storm,stormColor:"#a73018"}),mesh=new THREE.Mesh(geometry,material);
    mesh.position.x=body.distance*scale;if(body.tilt)mesh.rotation.z=THREE.MathUtils.degToRad(body.tilt);root.add(mesh);objects.set(body.id,mesh);
    const orbit=new THREE.Mesh(new THREE.RingGeometry(Math.max(.001,body.distance*scale-.003),body.distance*scale+.003,256),new THREE.MeshBasicNodeMaterial({color:0x263449,transparent:true,opacity:body.id==="sun"?0:.33,side:THREE.DoubleSide}));orbit.rotation.x=Math.PI/2;root.add(orbit);
    if(body.ring){const rg=new THREE.RingGeometry(body.ring.inner*scale,body.ring.outer*scale,256,16),rm=await createProceduralMaterial("rings",{seed:seed+300+index,colorA:"#4e4436",colorB:"#e8d8a9",opacity:body.ring.opacity,size:512}),ring=new THREE.Mesh(rg,rm);ring.rotation.x=Math.PI/2;mesh.add(ring)}
  }
  const sun=objects.get("sun");if(sun){sun.add(new THREE.PointLight(0xfff2d0,90,0,1.4));sun.add(makeGlowShell(THREE,.72*scale,0xff7a00,1.2))}
  scene.add(new THREE.AmbientLight(0x334466,.35));
  const particleCount=Math.max(1000,options.particleCount??12000),sim=new ParticleSystem({count:particleCount,seed,bounds:1.25*scale,drag:.015,radialForce:.018}),pg=new THREE.BufferGeometry();pg.setAttribute("position",new THREE.BufferAttribute(sim.positions,3));
  const pm=new THREE.PointsMaterial({color:0xff9b40,size:.012*scale,transparent:true,opacity:.48,depthWrite:false,blending:THREE.AdditiveBlending}),points=new THREE.Points(pg,pm);sun?.add(points);
  return{scene,root,objects,corona:{system:sim,points,geometry:pg}};
}
export async function buildSingleBodyScene(bodyId:"sun"|"saturn",options:{particleCount?:number;seed?:number}={}){
  const THREE:any=await import("three/webgpu"),scene=new THREE.Scene();scene.background=new THREE.Color(0x01040a);scene.add(starfield(THREE,1800,options.seed??42));
  const spec=SOLAR_SYSTEM.find(x=>x.id===bodyId)!,material=await createProceduralMaterial(spec.material,{seed:options.seed??42,colorA:spec.a,colorB:spec.b,bands:32,turbulence:9,emissive:3.3,size:768}),mesh=new THREE.Mesh(new THREE.SphereGeometry(1.25,128,96),material);scene.add(mesh);
  if(bodyId==="sun"){mesh.add(new THREE.PointLight(0xffe0a8,80,0,2));mesh.add(makeGlowShell(THREE,1.25,0xff6700,1.5))}
  if(bodyId==="saturn"){const rm=await createProceduralMaterial("rings",{seed:77,colorA:"#4f4533",colorB:"#f3dfaa",opacity:.78,size:1024}),ring=new THREE.Mesh(new THREE.RingGeometry(1.55,2.65,384,32),rm);ring.rotation.x=Math.PI/2.3;mesh.add(ring)}
  scene.add(new THREE.DirectionalLight(0xffffff,bodyId==="sun"?.15:4.5));scene.add(new THREE.AmbientLight(0x344766,.35));return{scene,mesh};
}