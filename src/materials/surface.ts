import {fbm3,ridgedFbm3} from '../math/noise.js';
import type {BodyMaterialKind,MaterialOptions} from './procedural.js';
export const rgb=(hex:string)=>{const n=parseInt(hex.replace('#',''),16);return[(n>>16)&255,(n>>8)&255,n&255];};
const mix=(a:number[],b:number[],t:number)=>a.map((v,i)=>Math.round(v+(b[i]!-v)*Math.max(0,Math.min(1,t))));
/** Shared procedural material sampler for 3D GPU scenes and projected 2D illustrations. */
export function surfaceSample(kind:BodyMaterialKind,nx:number,ny:number,nz:number,u:number,v:number,options:MaterialOptions={}):number[]{
 const seed=options.seed??1,a=rgb(options.colorA??'#64748b'),b=rgb(options.colorB??'#e2e8f0');let t=.5;
 if(kind==='gas-giant'||kind==='ice-giant')t=.5+.34*Math.sin(v*Math.PI*(options.bands??24)+fbm3(nx*3,ny*9,nz*3,4,seed)*2.2)+.16*fbm3(nx*8,ny*5,nz*8,4,seed+20);
 else if(kind==='sun')t=.5+.4*ridgedFbm3(nx*12,ny*12,nz*12,6,seed)+.15*fbm3(nx*35,ny*35,nz*35,3,seed+4);
 else if(kind==='rings'){const radial=Math.hypot(u-.5,v-.5)*2;t=.18+.52*(.5+.5*Math.sin(radial*310+fbm3(u*18,v*18,0,3,seed)*3))+.30*(.5+.5*Math.sin(radial*54));if(radial>.64&&radial<.69)t*=.08;if(radial>.82&&radial<.845)t*=.28;}
 else t=.5+.4*fbm3(nx*9,ny*9,nz*9,6,seed);
 let c=mix(a,b,t);if(options.storm&&kind==='gas-giant'){const d=((u-.72)/.12)**2+((v-.58)/.055)**2;if(d<1)c=mix(c,rgb(options.stormColor??'#a7321b'),.55+.35*(1-d));}return c;
}
