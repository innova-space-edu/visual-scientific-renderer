export const DEFAULT_LOCAL_PYODIDE_URL="/vendor/pyodide/";
export const PYODIDE_WORKER_SOURCE=`
let pyodideReadyPromise;
async function loadPyodideRuntime(indexURL){
  if(!pyodideReadyPromise){
    pyodideReadyPromise=(async()=>{
      const mod=await import(indexURL+"pyodide.mjs");
      return mod.loadPyodide({indexURL});
    })();
  }
  return pyodideReadyPromise;
}
self.onmessage=async(event)=>{
  const {id,code,packages=[],indexURL="/vendor/pyodide/"}=event.data;
  try{
    const pyodide=await loadPyodideRuntime(indexURL);
    if(packages.length)await pyodide.loadPackage(packages);
    const result=await pyodide.runPythonAsync(code);
    self.postMessage({id,ok:true,result:result?.toJs?result.toJs({dict_converter:Object.fromEntries}):result});
  }catch(error){self.postMessage({id,ok:false,error:String(error)});}
};
`;
export class PyodideWorkerClient{
  private worker:Worker;private pending=new Map<string,{resolve:(v:any)=>void;reject:(e:any)=>void}>();
  constructor(public readonly indexURL=DEFAULT_LOCAL_PYODIDE_URL){
    this.indexURL=new URL(indexURL,location.href).href;
    const source=PYODIDE_WORKER_SOURCE.replace('/vendor/pyodide/',this.indexURL);
    const url=URL.createObjectURL(new Blob([source],{type:"text/javascript"}));this.worker=new Worker(url,{type:"module"});URL.revokeObjectURL(url);
    this.worker.onmessage=e=>{const p=this.pending.get(e.data.id);if(!p)return;this.pending.delete(e.data.id);e.data.ok?p.resolve(e.data.result):p.reject(new Error(e.data.error));};
  }
  run(code:string,packages:string[]=[]){const id=crypto.randomUUID();return new Promise<any>((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.worker.postMessage({id,code,packages,indexURL:this.indexURL});});}
  terminate(){this.worker.terminate();this.pending.clear();}
}
