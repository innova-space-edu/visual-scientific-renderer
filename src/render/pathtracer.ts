import {add,cross,dot,mul,normalize,sub,type V3} from "../physics/forces.js";
import type {BVHNode,Triangle,AABB} from "./bvh.js";

export type Ray={origin:V3;direction:V3};
export type Material={albedo:V3;emission?:V3;roughness?:number;metalness?:number;ior?:number};
export type Hit={t:number;point:V3;normal:V3;material:number};
export type TraceScene={bvh:BVHNode;materials:Material[];environment?:V3};

function hitAABB(ray:Ray,b:AABB,tMax=Infinity){
  let t0=0,t1=tMax;
  for(let axis=0;axis<3;axis++){
    const direction=ray.direction[axis]!;
    const inv=1/(Math.abs(direction)<1e-12?1e-12:direction);
    const ta=(b.min[axis]!-ray.origin[axis]!)*inv;
    const tb=(b.max[axis]!-ray.origin[axis]!)*inv;
    t0=Math.max(t0,Math.min(ta,tb));
    t1=Math.min(t1,Math.max(ta,tb));
    if(t1<t0)return false;
  }
  return true;
}

function hitTri(ray:Ray,t:Triangle):Hit|null{
  const e1=sub(t.b,t.a),e2=sub(t.c,t.a),p=cross(ray.direction,e2),det=dot(e1,p);
  if(Math.abs(det)<1e-9)return null;
  const inv=1/det,s=sub(ray.origin,t.a),u=dot(s,p)*inv;
  if(u<0||u>1)return null;
  const q=cross(s,e1),v=dot(ray.direction,q)*inv;
  if(v<0||u+v>1)return null;
  const dist=dot(e2,q)*inv;
  if(dist<=1e-5)return null;
  const n=normalize(cross(e1,e2));
  return {t:dist,point:add(ray.origin,mul(ray.direction,dist)),normal:dot(n,ray.direction)>0?mul(n,-1):n,material:t.material??0};
}

export function intersectBVH(ray:Ray,node:BVHNode,best:Hit|null=null):Hit|null{
  if(!hitAABB(ray,node.bounds,best?.t))return best;
  if(node.triangles){
    for(const triangle of node.triangles){
      const h=hitTri(ray,triangle);
      if(h&&(!best||h.t<best.t))best=h;
    }
    return best;
  }
  if(node.left)best=intersectBVH(ray,node.left,best);
  if(node.right)best=intersectBVH(ray,node.right,best);
  return best;
}

function rng(seed:number){
  let a=seed>>>0;
  return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
}

function cosineHemisphere(normal:V3,r:()=>number):V3{
  const u=r(),v=r(),phi=2*Math.PI*u,s=Math.sqrt(v);
  const local:V3=[Math.cos(phi)*s,Math.sin(phi)*s,Math.sqrt(1-v)];
  const up:V3=Math.abs(normal[2])<.999?[0,0,1]:[1,0,0];
  const tangent=normalize(cross(up,normal)),bitangent=cross(normal,tangent);
  return normalize(add(add(mul(tangent,local[0]),mul(bitangent,local[1])),mul(normal,local[2])));
}

export function tracePath(ray:Ray,scene:TraceScene,options:{bounces?:number;seed?:number}={}):V3{
  const random=rng(options.seed??1),bounces=options.bounces??5;
  let throughput:V3=[1,1,1],radiance:V3=[0,0,0],current:Ray=ray;
  for(let bounce=0;bounce<bounces;bounce++){
    const hit=intersectBVH(current,scene.bvh);
    if(!hit){
      const env:V3=scene.environment??[0,0,0];
      const contribution:V3=[throughput[0]*env[0],throughput[1]*env[1],throughput[2]*env[2]];
      radiance=add(radiance,contribution);
      break;
    }
    const fallback:Material={albedo:[.8,.8,.8]};
    const mat:Material=scene.materials[hit.material]??fallback;
    if(mat.emission){
      const emitted:V3=[throughput[0]*mat.emission[0],throughput[1]*mat.emission[1],throughput[2]*mat.emission[2]];
      radiance=add(radiance,emitted);
    }
    throughput=[throughput[0]*mat.albedo[0],throughput[1]*mat.albedo[1],throughput[2]*mat.albedo[2]];
    current={origin:add(hit.point,mul(hit.normal,1e-4)),direction:cosineHemisphere(hit.normal,random)};
  }
  return radiance;
}
