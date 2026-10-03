import * as THREE from "three";
import {FullScreenQuad} from "three/addons/postprocessing/Pass.js";

const physicalProperties=["roughness","metalness","ior","transmission","thickness","attenuationDistance","clearcoat","clearcoatRoughness","opacity","transparent","alphaTest","side","bumpScale","emissiveIntensity","depthWrite"];
const maps=["map","normalMap","bumpMap","roughnessMap","metalnessMap","alphaMap","emissiveMap","transmissionMap","thicknessMap","clearcoatMap","clearcoatNormalMap","clearcoatRoughnessMap","aoMap"];

/** Preserve the raster scene; convert node materials to the physical ray tracer's material contract. */
export function preparePhysicalScene(source:any){
  const scene=source.clone(true),materials=new Map<any,THREE.MeshPhysicalMaterial>();
  let omittedEffects=0;
  const removed:any[]=[];
  scene.traverse((object:any)=>{
    if(object.isPoints||object.isLine||object.isSprite||object.userData?.effect||object.material?.userData?.postfx){removed.push(object);omittedEffects++;return}
    if(!object.isMesh)return;
    function convert(material:any){
      if(materials.has(material))return materials.get(material)!;
      const next=new THREE.MeshPhysicalMaterial();
      next.name=material.name;
      if(material.color)next.color.copy(material.color);
      if(material.emissive)next.emissive.copy(material.emissive);
      if(material.attenuationColor)next.attenuationColor.copy(material.attenuationColor);
      for(const key of physicalProperties)if(material[key]!==undefined)(next as any)[key]=material[key];
      if(material.normalScale)next.normalScale.copy(material.normalScale);
      for(const key of maps)if(material[key])(next as any)[key]=material[key];
      // A basic surface is self-lit in the original raster scene.
      if(material.isMeshBasicMaterial||material.isMeshBasicNodeMaterial){next.emissive.copy(next.color);next.emissiveIntensity=1;next.emissiveMap=next.map}
      materials.set(material,next);return next;
    }
    object.material=Array.isArray(object.material)?object.material.map(convert):convert(object.material);
  });
  removed.forEach(object=>object.removeFromParent());
  scene.updateMatrixWorld(true);
  return{scene,omittedEffects,dispose(){materials.forEach(material=>material.dispose())}};
}

/** A measured-material test scene built entirely from geometry and light. */
export async function buildPhysicalStudioScene(){
  const T:any=await import("three/webgpu"),scene=new T.Scene(),root=new T.Group();
  scene.background=new T.Color(0x0b1220);scene.userData.materialStudio=true;scene.add(root);
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardNodeMaterial({color:0x8b939e,roughness:.72}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.85;floor.receiveShadow=true;root.add(floor);
  const settings=[
    {color:0xd5a15a,metalness:1,roughness:.18},
    {color:0xffffff,metalness:0,roughness:.045,transmission:1,ior:1.5,thickness:1.5,attenuationColor:0xa9e8ee,attenuationDistance:3},
    {color:0x326dc9,metalness:0,roughness:.23,clearcoat:1,clearcoatRoughness:.08}
  ];
  settings.forEach((settings,i)=>{
    const ball=new T.Mesh(new T.SphereGeometry(.8,64,48),new T.MeshPhysicalNodeMaterial(settings));
    ball.position.set((i-1)*2.05,-.05,0);ball.castShadow=ball.receiveShadow=true;root.add(ball);
  });
  for(let i=0;i<7;i++){
    const block=new T.Mesh(new T.BoxGeometry(.22,.7,.22),new T.MeshStandardNodeMaterial({color:i%2?0xe69d62:0xcad7e5,roughness:.4}));
    block.position.set((i-3)*.38,-.5,-1.4);block.castShadow=true;root.add(block);
  }
  for(const [position,color,intensity] of [ [[-3,5,4],0xffedcf,6], [[4,3,-3],0xc9e5ff,3] ] as const){
    const light=new T.DirectionalLight(color,intensity);light.position.set(...position);light.castShadow=true;
    light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-7;light.shadow.camera.right=7;
    light.shadow.camera.top=7;light.shadow.camera.bottom=-7;light.shadow.normalBias=.025;
    scene.add(light);
  }
  scene.add(new T.HemisphereLight(0xdceaff,0x394250,1));
  return{scene,root,static:true};
}

export class PhysicalRenderSession{
  readonly renderer:THREE.WebGLRenderer;
  private tracer:any;
  private prepared:ReturnType<typeof preparePhysicalScene>|null=null;
  private environment:any=null;
  private denoise:any=null;
  private rawOutput:THREE.MeshBasicMaterial|null=null;
  private outputQuad:FullScreenQuad|null=null;
  private worker:any=null;
  private disposed=false;
  private cancelBuild:(()=>void)|null=null;
  constructor(canvas:HTMLCanvasElement){
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,preserveDrawingBuffer:true,powerPreference:"high-performance"});
    if(!this.renderer.extensions.has("EXT_color_buffer_float")){this.renderer.dispose();throw new Error("La GPU no admite buffers flotantes para trazado de rayos")}
    this.renderer.setPixelRatio(1);this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  }
  async init(source:any,camera:any,options:{width:number;height:number;exposure:number;studioEnvironment?:boolean;onProgress?:(fraction:number)=>void}){
    const {WebGLPathTracer,GradientEquirectTexture,DenoiseMaterial}=await import("three-gpu-pathtracer");
    const {GenerateMeshBVHWorker}=await import("three-mesh-bvh/worker");
    if(this.disposed)return;
    this.prepared=preparePhysicalScene(source);
    if(options.studioEnvironment){
      this.environment=new GradientEquirectTexture(256);
      this.environment.topColor.set(0xdceaff);this.environment.bottomColor.set(0x1c2330);this.environment.update();
      this.prepared.scene.environment=this.environment;
      if(source.userData?.materialStudio){
        const direct:any[]=[];this.prepared.scene.traverse((object:any)=>{if(object.isDirectionalLight)direct.push(object)});
        direct.forEach(light=>light.removeFromParent());
        for(const [position,color,intensity,width,height] of [ [[-3,5,4],0xffedcf,18,3,3], [[4,3,-3],0xc9e5ff,10,2,4] ] as const){
          const area=new THREE.RectAreaLight(color,intensity,width,height);area.position.set(position[0],position[1],position[2]);area.lookAt(0,0,0);this.prepared.scene.add(area);
        }
      }
    }
    this.renderer.setSize(options.width,options.height,false);this.renderer.toneMappingExposure=options.exposure;
    this.tracer=new WebGLPathTracer(this.renderer);
    this.worker=new GenerateMeshBVHWorker();this.tracer.setBVHWorker(this.worker);
    this.tracer.bounces=8;this.tracer.transmissiveBounces=12;this.tracer.filterGlossyFactor=.2;
    this.tracer.tiles.set(3,3);this.tracer.textureSize.set(1024,1024);
    this.tracer.renderDelay=0;this.tracer.minSamples=1;this.tracer.fadeDuration=0;
    this.tracer.stableNoise=true;this.tracer.rasterizeScene=false;
    await Promise.race([this.tracer.setSceneAsync(this.prepared.scene,camera,{onProgress:options.onProgress}),new Promise((_,reject)=>{this.cancelBuild=()=>reject(new Error("Render cancelado"))})]);
    this.cancelBuild=null;
    this.denoise=new DenoiseMaterial({map:this.tracer.target.texture,sigma:2,kSigma:1,threshold:.2});
    this.rawOutput=new THREE.MeshBasicMaterial({map:this.tracer.target.texture,depthTest:false,depthWrite:false});
    this.outputQuad=new FullScreenQuad(this.rawOutput);
    return this;
  }
  get samples(){return this.tracer?.samples??0}
  get omittedEffects(){return this.prepared?.omittedEffects??0}
  renderSample(){if(!this.disposed)this.tracer?.renderSample()}
  updateCamera(camera:any){this.tracer?.setCamera(camera)}
  setExposure(value:number){this.renderer.toneMappingExposure=value}
  display(smooth=false){
    if(!this.outputQuad||this.samples<1)return;
    this.outputQuad.material=smooth?this.denoise:this.rawOutput!;
    this.renderer.setRenderTarget(null);this.outputQuad.render(this.renderer);
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;this.cancelBuild?.();this.cancelBuild=null;
    this.worker?.dispose();this.outputQuad?.dispose();this.rawOutput?.dispose();this.denoise?.dispose();this.tracer?.dispose();this.prepared?.dispose();this.environment?.dispose();
    this.renderer.dispose();this.renderer.forceContextLoss();
  }
}
