import {surfaceSample} from "./surface.js";
export type BodyMaterialKind="sun"|"rocky"|"gas-giant"|"ice-giant"|"rings"|"atmosphere";
export type MaterialOptions={seed?:number;colorA?:string;colorB?:string;bands?:number;turbulence?:number;emissive?:number;opacity?:number;size?:number;storm?:boolean;stormColor?:string};
export function createProceduralTexture(THREE:any,kind:BodyMaterialKind,options:MaterialOptions={}){
  if(typeof document==="undefined")throw new Error("Procedural CanvasTexture requires a browser canvas");
  const size=options.size??512,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext("2d")!,img=ctx.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/(size-1),latitude=(v-.5)*Math.PI,longitude=u*Math.PI*2,cp=Math.cos(latitude),nx=cp*Math.cos(longitude),ny=Math.sin(latitude),nz=cp*Math.sin(longitude);const c=surfaceSample(kind,nx,ny,nz,u,v,options);
    const o=(y*size+x)*4;img.data[o]=c[0]!;img.data[o+1]=c[1]!;img.data[o+2]=c[2]!;img.data[o+3]=255;
  }
  ctx.putImageData(img,0,0);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.ClampToEdgeWrapping;texture.anisotropy=8;texture.needsUpdate=true;return texture;
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