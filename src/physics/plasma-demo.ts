import {ParticleSystem} from "../particles/webgpu.js";
export async function buildPlasmaDemoScene(options:{count?:number;seed?:number}={}){
  const THREE:any=await import("three/webgpu"),scene=new THREE.Scene();scene.background=new THREE.Color(0x01030a);const count=options.count??24000,sim=new ParticleSystem({count,seed:options.seed??21,bounds:2.4,drag:.008,radialForce:-.035});
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.BufferAttribute(sim.positions,3));const colors=new Float32Array(count*3);
  for(let i=0;i<count;i++){const o=i*3,r=Math.min(1,Math.hypot(sim.positions[o]!,sim.positions[o+1]!,sim.positions[o+2]!)/2.4);colors[o]=1;colors[o+1]=.2+.65*(1-r);colors[o+2]=.08+.92*r}
  geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
  const material=new THREE.PointsMaterial({size:.018,vertexColors:true,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending}),points=new THREE.Points(geometry,material);scene.add(points);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.34,64,48),new THREE.MeshBasicNodeMaterial({color:0xff4b12,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(core);
  return{scene,root:points,plasma:{system:sim,geometry,points}};
}
