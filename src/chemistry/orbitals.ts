import type {Grid3D} from "../fields/isosurface.js";
export type OrbitalKind="1s"|"2s"|"2px"|"2py"|"2pz";
export function hydrogenOrbitalDensity(kind:OrbitalKind,x:number,y:number,z:number,a0=1){
  const r=Math.hypot(x,y,z),rho=r/a0,exp1=Math.exp(-rho),exp2=Math.exp(-rho/2);
  let psi=0;
  if(kind==="1s")psi=exp1;
  else if(kind==="2s")psi=(2-rho)*exp2;
  else if(kind==="2px")psi=(x/a0)*exp2;
  else if(kind==="2py")psi=(y/a0)*exp2;
  else psi=(z/a0)*exp2;
  return psi*psi;
}
export function sampleOrbitalGrid(kind:OrbitalKind,resolution=64,extent=8):Grid3D{
  const n=Math.max(8,resolution),values=new Float32Array(n*n*n),step=(extent*2)/(n-1);let max=0;
  for(let z=0;z<n;z++)for(let y=0;y<n;y++)for(let x=0;x<n;x++){const px=-extent+x*step,py=-extent+y*step,pz=-extent+z*step,v=hydrogenOrbitalDensity(kind,px,py,pz);values[z*n*n+y*n+x]=v;if(v>max)max=v}
  if(max>0)for(let i=0;i<values.length;i++)values[i]/=max;
  return{nx:n,ny:n,nz:n,values,origin:[-extent,-extent,-extent],spacing:[step,step,step]};
}
