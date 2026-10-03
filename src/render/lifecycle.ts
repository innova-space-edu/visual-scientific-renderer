/** Dispose owned scene resources once, including maps shared between materials. */
export function disposeScientificScene(scene:any){
  const geometries=new Set<any>(),materials=new Set<any>(),textures=new Set<any>();
  scene?.traverse?.((object:any)=>{
    if(object.geometry)geometries.add(object.geometry);
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(!material)continue;
      materials.add(material);
      for(const value of Object.values(material))if((value as any)?.isTexture)textures.add(value);
    }
    object.shadow?.dispose?.();
  });
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}

export class FrameClock{
  private previous:number|null=null;
  reset(){this.previous=null}
  tick(milliseconds:number){
    const delta=this.previous===null?0:Math.max(0,Math.min(.033,(milliseconds-this.previous)/1000));
    this.previous=milliseconds;return delta;
  }
}
