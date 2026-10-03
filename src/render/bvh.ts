import type {V3} from "../physics/forces.js";
export type AABB={min:V3;max:V3};
export type Triangle={a:V3;b:V3;c:V3;material?:number};
export type BVHNode={bounds:AABB;left?:BVHNode;right?:BVHNode;triangles?:Triangle[]};
const min3=(a:V3,b:V3):V3=>[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.min(a[2],b[2])],max3=(a:V3,b:V3):V3=>[Math.max(a[0],b[0]),Math.max(a[1],b[1]),Math.max(a[2],b[2])];
export function triangleBounds(t:Triangle):AABB{return{min:min3(t.a,min3(t.b,t.c)),max:max3(t.a,max3(t.b,t.c))}}
export function mergeBounds(a:AABB,b:AABB):AABB{return{min:min3(a.min,b.min),max:max3(a.max,b.max)}}
export function buildBVH(triangles:Triangle[],leafSize=8):BVHNode{
  if(!triangles.length)throw new Error("Cannot build empty BVH");let bounds=triangleBounds(triangles[0]!);for(let i=1;i<triangles.length;i++)bounds=mergeBounds(bounds,triangleBounds(triangles[i]!));
  if(triangles.length<=leafSize)return{bounds,triangles};
  const extent:[number,number,number]=[bounds.max[0]-bounds.min[0],bounds.max[1]-bounds.min[1],bounds.max[2]-bounds.min[2]],axis=extent[1]>extent[0]?(extent[2]>extent[1]?2:1):(extent[2]>extent[0]?2:0);
  const sorted=[...triangles].sort((u,v)=>((u.a[axis]+u.b[axis]+u.c[axis])-(v.a[axis]+v.b[axis]+v.c[axis])));
  const mid=Math.floor(sorted.length/2);return{bounds,left:buildBVH(sorted.slice(0,mid),leafSize),right:buildBVH(sorted.slice(mid),leafSize)};
}
