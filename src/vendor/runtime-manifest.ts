export type VendorRuntime="pyodide"|"opencv"|"spice";
export const VENDOR_RUNTIME_PATHS:Record<VendorRuntime,string>={pyodide:"/vendor/pyodide/pyodide.mjs",opencv:"/vendor/opencv/opencv.js",spice:"/vendor/spice/spice.js"};
export async function checkVendorRuntime(fetcher:typeof fetch=fetch){const result:Record<string,boolean>={};for(const [name,path] of Object.entries(VENDOR_RUNTIME_PATHS)){try{const res=await fetcher(path,{method:"HEAD"});result[name]=res.ok}catch{result[name]=false}}return result}
