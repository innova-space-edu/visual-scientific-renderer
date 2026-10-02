import type {SpiceEngine,SpiceVector} from "./spice.js";
export type LocalSpiceModule={cwrap?:(name:string,ret:string|null,args:string[])=>Function;FS?:any;HEAPF64?:Float64Array;_malloc?:(n:number)=>number;_free?:(p:number)=>void;[key:string]:any};
export class LocalSpiceWasmEngine implements SpiceEngine{
  private module:LocalSpiceModule|null=null;
  constructor(public readonly moduleUrl="/vendor/spice/spice.js"){}
  async init(){
    const mod:any=await import(/* @vite-ignore */this.moduleUrl);
    const factory=mod.default??mod;
    this.module=typeof factory==="function"?await factory({locateFile:(path:string)=>this.moduleUrl.replace(/spice\.js$/,path)}):factory;
    return this;
  }
  async loadKernel(name:string,bytes:ArrayBuffer){
    if(!this.module)await this.init();
    const FS=this.module!.FS;if(!FS)throw new Error("SPICE WASM module does not expose FS");
    const path="/kernels/"+name;try{FS.mkdir("/kernels")}catch{}FS.writeFile(path,new Uint8Array(bytes));
    const furnsh=this.module!.cwrap?.("vs_furnsh",null,["string"]);if(!furnsh)throw new Error("SPICE vs_furnsh binding unavailable");furnsh(path);
  }
  async position(target:string,observer:string,et:number,frame="J2000",aberration="LT+S"):Promise<SpiceVector>{
    if(!this.module)await this.init();const m=this.module!;
    const fn=m.cwrap?.("vs_spkpos","number",["string","number","string","string","string","number"]);
    if(!fn||!m._malloc||!m._free||!m.HEAPF64)throw new Error("SPICE WASM numerical bindings unavailable");
    const ptr=m._malloc(32);
    try{
      const code=fn(target,et,frame,aberration,observer,ptr);
      if(code!==0)throw new Error("SPICE spkpos failed");
      const i=ptr>>3;
      return{x:m.HEAPF64[i]!,y:m.HEAPF64[i+1]!,z:m.HEAPF64[i+2]!,lt:m.HEAPF64[i+3]!};
    }finally{m._free(ptr)}
  }
}
