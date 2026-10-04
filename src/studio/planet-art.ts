import {surfaceSample,rgb} from '../materials/surface.js';
import {fbm3} from '../math/noise.js';
import type {BodyMaterialKind,MaterialOptions} from '../materials/procedural.js';
const specs:Record<string,{kind:BodyMaterialKind;options:MaterialOptions}>={
 sun:{kind:'sun',options:{colorA:'#ff6b00',colorB:'#fff0a8',seed:1}},mercury:{kind:'rocky',options:{colorA:'#6e6a65',colorB:'#b8aba0',seed:2}},venus:{kind:'rocky',options:{colorA:'#a85c22',colorB:'#f3d594',seed:3}},earth:{kind:'rocky',options:{colorA:'#1559b7',colorB:'#52b788',seed:4}},mars:{kind:'rocky',options:{colorA:'#8d2c18',colorB:'#dd7651',seed:5}},jupiter:{kind:'gas-giant',options:{colorA:'#8b4f2f',colorB:'#ead2b8',seed:6,storm:true}},saturn:{kind:'gas-giant',options:{colorA:'#bfa15c',colorB:'#f5e3aa',seed:7,bands:32}},uranus:{kind:'ice-giant',options:{colorA:'#62cada',colorB:'#d2fbff',seed:8,bands:12}},neptune:{kind:'ice-giant',options:{colorA:'#173caa',colorB:'#5f84ff',seed:9,bands:14}}
};
export const planetArt=new Map<string,string>();
/** Orthographic sphere with a directional light; textures share the 3D material sampler. */
export function spherePixels(kind:string,size=256):Uint8ClampedArray{
 const spec=specs[kind];if(!spec)throw new Error('Astro desconocido');const pixels=new Uint8ClampedArray(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const nx=(x+.5)/size*2-1,ny=1-(y+.5)/size*2,r2=nx*nx+ny*ny;if(r2>1)continue;const nz=Math.sqrt(1-r2),u=(Math.atan2(nz,nx)+Math.PI)/(Math.PI*2),v=Math.asin(ny)/Math.PI+.5;
  let c=surfaceSample(spec.kind,nx,ny,nz,u,v,spec.options);
  if(kind==='earth'){const land=fbm3(nx*2.8,ny*2.8,nz*2.8,5,11);c=land>.07?rgb(land>.3?'#718954':'#409374'):rgb('#1a65a3');const cloud=fbm3(nx*10,ny*10,nz*10,4,34);if(cloud>.2)c=c.map(a=>a+(238-a)*Math.min(.9,(cloud-.2)*3));if(Math.abs(ny)>.93)c=rgb('#dce9ed');}
  const light=kind==='sun'?1:.18+.82*Math.max(0,nx*-.5+ny*.4+nz*.768),rim=kind==='earth'?Math.pow(1-nz,4)*.3:0,o=(y*size+x)*4;
  for(let i=0;i<3;i++)pixels[o+i]=Math.round(Math.min(255,c[i]!*light+(i===2?120:60)*rim));pixels[o+3]=Math.round(Math.min(1,(1-Math.sqrt(r2))*size)*255);
 }
 return pixels;
}
export async function preparePlanetArt(kinds:string[],signal?:AbortSignal){
 if(typeof document==='undefined')return;
 for(const kind of new Set(kinds)){signal?.throwIfAborted();if(!specs[kind]||planetArt.has(kind))continue;
  const size=384,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d');if(!ctx)continue;
  const data=ctx.createImageData(size,size);data.data.set(spherePixels(kind,size));ctx.putImageData(data,0,0);planetArt.set(kind,canvas.toDataURL('image/png'));await new Promise<void>(r=>requestAnimationFrame(()=>r()));
 }
}
