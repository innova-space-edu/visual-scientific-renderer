export type Grid3D={nx:number;ny:number;nz:number;values:Float32Array;origin?:[number,number,number];spacing?:[number,number,number]};
export function extractIsoSurfacePoints(grid:Grid3D,iso:number){
  const out:number[]=[],o=grid.origin??[0,0,0],s=grid.spacing??[1,1,1],idx=(x:number,y:number,z:number)=>z*grid.nx*grid.ny+y*grid.nx+x;
  for(let z=0;z<grid.nz-1;z++)for(let y=0;y<grid.ny-1;y++)for(let x=0;x<grid.nx-1;x++){const v=grid.values[idx(x,y,z)]!,vx=grid.values[idx(x+1,y,z)]!,vy=grid.values[idx(x,y+1,z)]!,vz=grid.values[idx(x,y,z+1)]!;if((v-iso)*(vx-iso)<=0||(v-iso)*(vy-iso)<=0||(v-iso)*(vz-iso)<=0){out.push(o[0]+(x+.5)*s[0],o[1]+(y+.5)*s[1],o[2]+(z+.5)*s[2]);}}
  return new Float32Array(out);
}
