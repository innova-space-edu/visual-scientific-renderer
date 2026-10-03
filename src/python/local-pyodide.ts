export type LocalPyodideOptions={baseUrl?:string;packages?:string[]};
export function createLocalPyodideWorker(options:LocalPyodideOptions={}){
  const base=new URL(options.baseUrl??"/vendor/pyodide/",location.href).href.replace(/\/?$/,"/"),source=`let pyodide;self.onmessage=async(e)=>{const{id,code,packages=[]}=e.data;try{if(!pyodide){const mod=await import("${base}pyodide.mjs");pyodide=await mod.loadPyodide({indexURL:"${base}"});}if(packages.length)await pyodide.loadPackage(packages);const result=await pyodide.runPythonAsync(code);self.postMessage({id,ok:true,result:result?.toJs?result.toJs({dict_converter:Object.fromEntries}):result});}catch(error){self.postMessage({id,ok:false,error:String(error)});}}`;const url=URL.createObjectURL(new Blob([source],{type:"text/javascript"}));const worker=new Worker(url,{type:"module"});URL.revokeObjectURL(url);return worker;
}
export const LOCAL_PYODIDE_PACKAGES=["numpy","scipy","matplotlib","sympy","astropy"];
