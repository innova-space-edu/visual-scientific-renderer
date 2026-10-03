/** Import a self-contained GLB without uploading the user's model. */
export async function loadLocalGLB(file:File){
  if(file.size>50*1024*1024)throw new Error("El modelo supera el límite local de 50 MB");
  const bytes=await file.arrayBuffer();
  if(bytes.byteLength<12||new DataView(bytes).getUint32(0,true)!==0x46546c67)throw new Error("Selecciona un GLB binario válido con texturas integradas");
  const T:any=await import("three/webgpu");
  const {GLTFLoader}=await import("three/addons/loaders/GLTFLoader.js");
  const manager=new T.LoadingManager();
  manager.setURLModifier((url:string)=>{
    if(url.startsWith("blob:")||url.startsWith("data:"))return url;
    throw new Error("Usa un GLB autocontenido; no se permiten recursos externos");
  });
  const gltf=await new GLTFLoader(manager).parseAsync(bytes,"");
  const object=gltf.scene;object.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(object),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  const longest=Math.max(size.x,size.y,size.z);
  if(!Number.isFinite(longest)||longest<=0)throw new Error("El modelo no contiene geometría visible");
  const scale=3.5/longest;
  const root=new T.Group();root.add(object);object.position.sub(center);root.scale.setScalar(scale);
  // Freeze the imported pose. Animated meshes are a still-image source.
  return{root,height:size.y*scale};
}
