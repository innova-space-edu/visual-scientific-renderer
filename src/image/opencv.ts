export type OpenCVModule=Record<string,any>;
let cached:Promise<OpenCVModule>|null=null;
export function loadLocalOpenCV(scriptUrl="/vendor/opencv/opencv.js"):Promise<OpenCVModule>{
  if(cached)return cached;
  cached=new Promise((resolve,reject)=>{
    const w:any=globalThis;if(w.cv?.Mat)return resolve(w.cv);
    if(typeof document==="undefined")return reject(new Error("OpenCV.js loader requires browser DOM"));
    const script=document.createElement("script");script.src=scriptUrl;script.async=true;
    script.onload=()=>{const cv=w.cv;if(!cv)return reject(new Error("OpenCV.js loaded without cv global"));if(cv instanceof Promise)cv.then(resolve,reject);else if(cv.onRuntimeInitialized){const previous=cv.onRuntimeInitialized;cv.onRuntimeInitialized=()=>{previous?.();resolve(cv)}}else resolve(cv)};
    script.onerror=()=>reject(new Error("Unable to load local OpenCV.js at "+scriptUrl));document.head.appendChild(script);
  });return cached;
}
