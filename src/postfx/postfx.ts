export type PostFXOptions={exposure?:number;bloom?:number;bloomRadius?:number;bloomThreshold?:number;contrast?:number;saturation?:number;vignette?:number;fogDensity?:number};
export function applyRendererPostFX(renderer:any,THREE:any,options:PostFXOptions={}){
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=options.exposure??1.15;renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.userData={...(renderer.userData||{}),postfx:{bloom:options.bloom??.7,contrast:options.contrast??1.08,saturation:options.saturation??1.05,vignette:options.vignette??.15}};
}
export async function createBloomPipeline(renderer:any,scene:any,camera:any,options:PostFXOptions={}){
  try{
    const THREE:any=await import("three/webgpu"),TSL:any=await import("three/tsl"),{bloom:createBloom}=await import("three/addons/tsl/display/BloomNode.js");
    const PostClass=THREE.PostProcessing??THREE.RenderPipeline;if(!PostClass||typeof TSL.pass!=="function")return null;
    const pipeline=new PostClass(renderer),scenePass=TSL.pass(scene,camera),color=scenePass.getTextureNode?scenePass.getTextureNode("output"):scenePass;
    const bloom=createBloom(color,options.bloom??.8,options.bloomRadius??.35,options.bloomThreshold??.72);
    pipeline.outputNode=color.add(bloom);
    return {render:()=>pipeline.render(),setBloom:(value:number)=>{bloom.strength.value=value},dispose:()=>{bloom.dispose();scenePass.dispose();pipeline.dispose()}};
  }catch{return null}
}
export function makeGlowShell(THREE:any,radius:number,color:number,intensity=.7){
  const geometry=new THREE.SphereGeometry(radius*1.08,64,48),material=new THREE.MeshBasicNodeMaterial({color,transparent:true,opacity:.12,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending});
  material.userData={postfx:"procedural-glow",intensity};return new THREE.Mesh(geometry,material);
}
