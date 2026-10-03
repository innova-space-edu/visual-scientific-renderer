import {buildBVH,type Triangle} from "./bvh.js";
import type {Material,TraceScene} from "./pathtracer.js";
import type {V3} from "../physics/forces.js";

export async function threeObjectToTraceScene(root:any,environment:V3=[.002,.004,.012]):Promise<TraceScene>{
  const THREE:any=await import("three/webgpu");
  root.updateMatrixWorld?.(true);
  const triangles:Triangle[]=[],materials:Material[]=[];
  const materialMap=new Map<any,number>();

  function getMaterialIndex(material:any){
    if(materialMap.has(material))return materialMap.get(material)!;
    const color=material?.color??new THREE.Color(.8,.8,.8),emissive=material?.emissive;
    const entry:Material={
      albedo:[Number(color.r??.8),Number(color.g??.8),Number(color.b??.8)],
      roughness:Number(material?.roughness??.6),
      metalness:Number(material?.metalness??0)
    };
    const intensity=Number(material?.emissiveIntensity??1);
    if(emissive&&(emissive.r>0||emissive.g>0||emissive.b>0))entry.emission=[emissive.r*intensity,emissive.g*intensity,emissive.b*intensity];
    const index=materials.length;materials.push(entry);materialMap.set(material,index);return index;
  }

  root.traverse?.((object:any)=>{
    if(!object.isMesh||!object.geometry?.attributes?.position)return;
    const geometry=object.geometry,index=geometry.index?.array,position=geometry.attributes.position;
    const materialIndex=getMaterialIndex(Array.isArray(object.material)?object.material[0]:object.material);
    const vertex=(i:number):V3=>{
      const v=new THREE.Vector3(position.getX(i),position.getY(i),position.getZ(i)).applyMatrix4(object.matrixWorld);
      return[v.x,v.y,v.z];
    };
    if(index){
      for(let i=0;i<index.length;i+=3)triangles.push({a:vertex(index[i]!),b:vertex(index[i+1]!),c:vertex(index[i+2]!),material:materialIndex});
    }else{
      for(let i=0;i<position.count;i+=3)triangles.push({a:vertex(i),b:vertex(i+1),c:vertex(i+2),material:materialIndex});
    }
  });
  if(!triangles.length)throw new Error("Three object contains no traceable triangles");
  return{bvh:buildBVH(triangles),materials,environment};
}
