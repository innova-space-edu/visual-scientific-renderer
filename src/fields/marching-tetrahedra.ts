import type {Grid3D} from "./isosurface.js";
export type IsoMesh={positions:Float32Array;normals:Float32Array};
type P=[number,number,number]; type V={p:P;v:number};
const TETS=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]] as const;
const C:[[number,number,number],...Array<[number,number,number]>]=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
function interp(a:V,b:V,iso:number):P{const d=b.v-a.v,t=Math.abs(d)<1e-12?.5:(iso-a.v)/d;return[a.p[0]+(b.p[0]-a.p[0])*t,a.p[1]+(b.p[1]-a.p[1])*t,a.p[2]+(b.p[2]-a.p[2])*t]}
function normal(a:P,b:P,c:P):P{const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.max(1e-12,Math.hypot(nx,ny,nz));return[nx/l,ny/l,nz/l]}
export function marchingTetrahedra(grid:Grid3D,iso:number):IsoMesh{
  const pos:number[]=[],nor:number[]=[],idx=(x:number,y:number,z:number)=>z*grid.nx*grid.ny+y*grid.nx+x,o=grid.origin??[0,0,0],s=grid.spacing??[1,1,1];
  const emit=(a:P,b:P,c:P)=>{const n=normal(a,b,c);pos.push(...a,...b,...c);nor.push(...n,...n,...n)};
  for(let z=0;z<grid.nz-1;z++)for(let y=0;y<grid.ny-1;y++)for(let x=0;x<grid.nx-1;x++){
    const cube:V[]=C.map(([dx,dy,dz])=>({p:[o[0]+(x+dx)*s[0],o[1]+(y+dy)*s[1],o[2]+(z+dz)*s[2]],v:grid.values[idx(x+dx,y+dy,z+dz)]!}));
    for(const tet of TETS){const verts=tet.map(i=>cube[i]!),inside=verts.map(v=>v.v>=iso),count=inside.filter(Boolean).length;if(count===0||count===4)continue;const ins=verts.filter((_,i)=>inside[i]),outs=verts.filter((_,i)=>!inside[i]);if(count===1||count===3){const center=(count===1?ins:outs)[0]!,others=count===1?outs:ins;const p0=interp(center,others[0]!,iso),p1=interp(center,others[1]!,iso),p2=interp(center,others[2]!,iso);emit(p0,p1,p2)}else{const a=ins[0]!,b=ins[1]!,c=outs[0]!,d=outs[1]!,p0=interp(a,c,iso),p1=interp(a,d,iso),p2=interp(b,c,iso),p3=interp(b,d,iso);emit(p0,p1,p2);emit(p2,p1,p3)}}
  }
  return{positions:new Float32Array(pos),normals:new Float32Array(nor)};
}
