export type V3=[number,number,number];
export const add=(a:V3,b:V3):V3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const sub=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const mul=(a:V3,s:number):V3=>[a[0]*s,a[1]*s,a[2]*s];
export const dot=(a:V3,b:V3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm=(a:V3)=>Math.hypot(a[0],a[1],a[2]);
export const normalize=(a:V3):V3=>{const n=Math.max(norm(a),1e-12);return[a[0]/n,a[1]/n,a[2]/n]};

export function gravitationalAcceleration(position:V3,source:V3,mass:number,G=6.67430e-11){
  const r=sub(source,position),d=Math.max(norm(r),1e-9);return mul(r,G*mass/(d*d*d));
}
export function electrostaticAcceleration(position:V3,source:V3,charge:number,sourceCharge:number,mass:number,k=8.9875517923e9){
  const r=sub(position,source),d=Math.max(norm(r),1e-9);return mul(r,k*charge*sourceCharge/(mass*d*d*d));
}
export function lorentzAcceleration(velocity:V3,electric:V3,magnetic:V3,charge:number,mass:number){
  return mul(add(electric,cross(velocity,magnetic)),charge/mass);
}
export function borisPush(position:V3,velocity:V3,electric:V3,magnetic:V3,qOverM:number,dt:number){
  const vMinus=add(velocity,mul(electric,qOverM*dt*.5)),t=mul(magnetic,qOverM*dt*.5),t2=dot(t,t),s=mul(t,2/(1+t2)),vPrime=add(vMinus,cross(vMinus,t)),vPlus=add(vMinus,cross(vPrime,s)),vNew=add(vPlus,mul(electric,qOverM*dt*.5));return{position:add(position,mul(vNew,dt)),velocity:vNew};
}
