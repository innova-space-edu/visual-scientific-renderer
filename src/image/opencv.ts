export type OpenCVModule=Record<string,any>;
let cached:Promise<OpenCVModule>|null=null;

async function normalize(module:any):Promise<OpenCVModule>{
  const cv=module?.default??module;
  if(cv instanceof Promise)return normalize(await cv);
  if(cv?.Mat)return cv;
  if(cv?.onRuntimeInitialized!==undefined)return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error("OpenCV initialization timeout")),15000);cv.onRuntimeInitialized=()=>{clearTimeout(timeout);resolve(cv)}});
  throw new Error("Invalid OpenCV.js module");
}

export function loadBundledOpenCV():Promise<OpenCVModule>{
  if(cached)return cached;
  cached=import("@techstark/opencv-js").then(normalize);
  return cached;
}

export function loadLocalOpenCV(scriptUrl="/vendor/opencv/opencv.js"):Promise<OpenCVModule>{
  if(cached)return cached;
  cached=new Promise((resolve,reject)=>{
    const w:any=globalThis;if(w.cv?.Mat)return resolve(w.cv);
    if(typeof document==="undefined")return reject(new Error("OpenCV.js loader requires browser DOM"));
    const script=document.createElement("script");script.src=scriptUrl;script.async=true;
    script.onload=()=>normalize(w.cv).then(resolve,reject);
    script.onerror=()=>reject(new Error("Unable to load local OpenCV.js at "+scriptUrl));document.head.appendChild(script);
  });return cached;
}
