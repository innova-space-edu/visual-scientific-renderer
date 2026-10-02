import {fbm3,ridgedFbm3} from "../math/noise.js";
export type BodyMaterialKind="sun"|"rocky"|"gas-giant"|"ice-giant"|"rings"|"atmosphere";
export type MaterialOptions={seed?:number;colorA?:string;colorB?:string;bands?:number;turbulence?:number;emissive?:number;opacity?:number;size?:number;storm?:boolean;stormColor?:string};
function parseHex(hex:string){const n=parseInt(hex.replace("#",""),16);return[(n>>16)&255,(n>>8)&255,n&255]}
function mix(a:number[],b:number[],t:number){return a.map((v,i)=>Math.round(v+(b[i]!-v)*Math.max(0,Math.min(1,t))))}
export function createProceduralTexture(THREE:any,kind:BodyMaterialKind,options:MaterialOptions={}){
  if(typeof document==="undefined")throw new Error("Procedural CanvasTexture requires a browser canvas");
  const size=options.size??512,seed=options.seed??1,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext("2d")!,img=ctx.createImageData(size,size),a=parseHex(options.colorA??"#64748b"),b=parseHex(options.colorB??"#e2e8f0"),storm=parseHex(options.stormColor??"#a7321b");
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size;let t=.5;
    if(kind==="gas-giant"||kind==="ice-giant"){const bands=options.bands??24,wave=Math.sin(v*Math.PI*bands+fbm3(u*3,v*9,0,4,seed)*2.2);t=.5+.34*wave+.16*fbm3(u*8,v*5,1,4,seed+20)}
    else if(kind==="sun"){t=.5+.4*ridgedFbm3(u*12,v*12,0,6,seed)+.15*fbm3(u*35,v*35,2,3,seed+4)}
    else if(kind==="rings"){
      const radial=Math.hypot(u-.5,v-.5)*2;
      const fine=.5+.5*Math.sin(radial*310+fbm3(u*18,v*18,0,3,seed)*3);
      const broad=.5+.5*Math.sin(radial*54);
      t=.18+.52*fine+.30*broad;
      if(radial>.64&&radial<.69)t*=.08;
      if(radial>.82&&radial<.845)t*=.28;
    }
    else t=.5+.4*fbm3(u*9,v*9,0,6,seed);
    let c=mix(a,b,t);
    if(options.storm&&kind==="gas-giant"){
      const du=(u-.72)/.12,dv=(v-.58)/.055,d=du*du+dv*dv;
      if(d<1){const edge=Math.max(0,1-d),s=mix(c,storm,.55+.35*edge);c=s}
    }
    const o=(y*size+x)*4;img.data[o]=c[0]!;img.data[o+1]=c[1]!;img.data[o+2]=c[2]!;img.data[o+3]=255;
  }
  ctx.putImageData(img,0,0);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.needsUpdate=true;return texture;
}
export async function createProceduralMaterial(kind:BodyMaterialKind,options:MaterialOptions={}){
  const THREE:any=await import("three/webgpu"),TSL:any=await import("three/tsl"),texture=createProceduralTexture(THREE,kind,options),material=new THREE.MeshStandardNodeMaterial();
  material.map=texture;if(kind==="rocky"){material.bumpMap=texture;material.bumpScale=.045;}if(kind==="gas-giant"){material.bumpMap=texture;material.bumpScale=.008;}
  if(typeof TSL?.texture==="function"){try{material.colorNode=TSL.texture(texture)}catch{}}
  material.roughness=kind==="sun"?.28:kind==="rings"?.78:.68;material.metalness=0;
  if(kind==="sun"){material.emissive=new THREE.Color(options.colorA??"#ff7900");material.emissiveMap=texture;material.emissiveIntensity=options.emissive??2.7;if(typeof TSL?.texture==="function"){try{material.emissiveNode=TSL.texture(texture).mul(options.emissive??2.7)}catch{}}}
  if(kind==="rings"||kind==="atmosphere"){material.transparent=true;material.opacity=options.opacity??.62;material.depthWrite=false;if(kind==="rings")material.alphaMap=texture;material.side=THREE.DoubleSide}
  material.userData={procedural:true,kind,seed:options.seed??1,tslAvailable:!!TSL?.texture,storm:!!options.storm};return material;
}