import {generateCameraRay,type PhysicalCamera} from "../optics/camera.js";
import {tracePath,type TraceScene} from "./pathtracer.js";

export type PathTraceImageOptions={
  width:number;
  height:number;
  samplesPerPixel?:number;
  bounces?:number;
  seed?:number;
  camera:PhysicalCamera;
  onProgress?:(fraction:number)=>void;
};

function pixelRng(seed:number){
  let a=seed>>>0;
  return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
}

export async function renderPathTracedImage(scene:TraceScene,options:PathTraceImageOptions){
  const width=Math.max(1,options.width|0),height=Math.max(1,options.height|0),spp=Math.max(1,options.samplesPerPixel??8),rgb=new Float32Array(width*height*3),baseSeed=options.seed??1;
  for(let y=0;y<height;y++){
    for(let x=0;x<width;x++){
      let r=0,g=0,b=0;
      for(let s=0;s<spp;s++){
        const seed=(baseSeed+Math.imul(y*width+x,73856093)+Math.imul(s+1,19349663))>>>0,rnd=pixelRng(seed);
        const u=(x+rnd())/width,v=(y+rnd())/height;
        const ray=generateCameraRay(options.camera,u,v,width/height,rnd);
        const c=tracePath(ray,scene,{bounces:options.bounces??5,seed});
        r+=c[0];g+=c[1];b+=c[2];
      }
      const o=(y*width+x)*3;rgb[o]=r/spp;rgb[o+1]=g/spp;rgb[o+2]=b/spp;
    }
    options.onProgress?.((y+1)/height);
    if((y&7)===7)await Promise.resolve();
  }
  return{width,height,rgb,samplesPerPixel:spp};
}

export function tonemapFloatRGB(rgb:Float32Array,exposure=1,gamma=2.2){
  const out=new Uint8ClampedArray(rgb.length);
  for(let i=0;i<rgb.length;i++){
    const mapped=1-Math.exp(-Math.max(0,rgb[i]!)*exposure);
    out[i]=Math.round(Math.pow(mapped,1/gamma)*255);
  }
  return out;
}
