import type {IsoMesh} from "../fields/marching-tetrahedra.js";
export async function buildIsoSurfaceObject(mesh:IsoMesh,options:{color?:number;opacity?:number;wireframe?:boolean}={}){
  const THREE:any=await import("three/webgpu"),geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.BufferAttribute(mesh.positions,3));geometry.setAttribute("normal",new THREE.BufferAttribute(mesh.normals,3));geometry.computeBoundingSphere();
  const material=new THREE.MeshStandardNodeMaterial({color:options.color??0x7c3aed,roughness:.42,metalness:.02,transparent:(options.opacity??1)<1,opacity:options.opacity??1,wireframe:options.wireframe??false});return new THREE.Mesh(geometry,material);
}
export async function buildStreamlineObject(lines:Array<Array<[number,number,number]>>,options:{color?:number;opacity?:number}={}){
  const THREE:any=await import("three/webgpu"),group=new THREE.Group(),material=new THREE.LineBasicMaterial({color:options.color??0x38bdf8,transparent:true,opacity:options.opacity??.8});
  for(const line of lines){if(line.length<2)continue;const points=line.map(p=>new THREE.Vector3(...p)),geometry=new THREE.BufferGeometry().setFromPoints(points);group.add(new THREE.Line(geometry,material))}
  return group;
}
