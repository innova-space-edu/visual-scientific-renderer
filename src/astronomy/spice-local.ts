import type {SpiceEngine,SpiceVector} from "./spice.js";
export type LocalSpiceModule={cwrap?:(name:string,ret:string,args:string[])=>Function;FS?:any;[key:string]:any};
export class LocalSpiceWasmEngine implements SpiceEngine{
  private module:LocalSpiceModule|null=null;
  constructor(public readonly moduleUrl="/vendor/spice/spice.js"){}
  async init(){const mod:any=await import(/* @vite-ignore */this.moduleUrl);this.module=await(mod.default?.()??mod.default??mod);return this;}
  async loadKernel(name:string,bytes:ArrayBuffer){if(!this.module)await this.init();const FS=this.module!.FS;if(!FS)throw new Error("SPICE WASM module does not expose FS");const path="/kernels/"+name;try{FS.mkdir("/kernels")}catch{}FS.writeFile(path,new Uint8Array(bytes));const furnsh=this.module!.cwrap?.("furnsh_c","void",["string"]);if(!furnsh)throw new Error("SPICE furnsh_c binding unavailable");furnsh(path);}
  async position(target:string,observer:string,et:number,frame="J2000",aberration="LT+S"):Promise<SpiceVector>{if(!this.module)await this.init();const api=this.module!.spkpos;if(typeof api!=="function")throw new Error("SPICE module requires JS wrapper spkpos(target,et,frame,abcorr,observer)");const result=api(target,et,frame,aberration,observer);return{x:Number(result[0]),y:Number(result[1]),z:Number(result[2]),lt:Number(result[3]??0)}}
}
