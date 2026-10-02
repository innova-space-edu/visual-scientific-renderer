export type AtmosphereShellOptions={color?:number;opacity?:number;scale?:number;additive?:boolean};
export async function createAtmosphereShell(radius:number,options:AtmosphereShellOptions={}){
  const THREE:any=await import("three/webgpu");
  const material=new THREE.MeshBasicNodeMaterial({color:options.color??0x60a5fa,transparent:true,opacity:options.opacity??.08,side:THREE.BackSide,depthWrite:false,blending:options.additive===false?THREE.NormalBlending:THREE.AdditiveBlending});
  const shell=new THREE.Mesh(new THREE.SphereGeometry(radius*(options.scale??1.06),96,64),material);shell.userData={effect:"atmosphere-shell"};return shell;
}
export async function createSolarProminenceArcs(radius:number,count=18,seed=42){
  const THREE:any=await import("three/webgpu"),group=new THREE.Group();let a=seed>>>0;const rnd=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  for(let i=0;i<count;i++){const theta=rnd()*Math.PI*2,phi=(rnd()-.5)*Math.PI*.8,height=radius*(.08+rnd()*.22),span=.18+rnd()*.22,points:any[]=[];for(let j=0;j<24;j++){const t=j/23,ang=theta+(t-.5)*span,rr=radius+Math.sin(Math.PI*t)*height,y=Math.sin(phi)*rr;points.push(new THREE.Vector3(Math.cos(ang)*Math.cos(phi)*rr,y,Math.sin(ang)*Math.cos(phi)*rr))}const curve=new THREE.CatmullRomCurve3(points),geo=new THREE.TubeGeometry(curve,32,radius*.006,6,false),mat=new THREE.MeshBasicNodeMaterial({color:0xff5a00,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false});group.add(new THREE.Mesh(geo,mat))}group.userData={effect:"solar-prominences"};return group;
}
