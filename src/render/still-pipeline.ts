import {encodeOpenEXR,rgbToRgbaFloat} from "../export/exr.js";
import {encodeRadianceHDR} from "../export/hdr.js";
import {renderPathTracedImage,type PathTraceImageOptions} from "./pathtrace-image.js";
import type {TraceScene} from "./pathtracer.js";

export async function renderScientificStill(scene:TraceScene,options:PathTraceImageOptions&{format?:"exr"|"hdr"}){
  const image=await renderPathTracedImage(scene,options);
  if((options.format??"exr")==="hdr")return{...image,format:"hdr" as const,bytes:encodeRadianceHDR(image.width,image.height,image.rgb)};
  const rgba=rgbToRgbaFloat(image.rgb,1);
  return{...image,format:"exr" as const,bytes:encodeOpenEXR(image.width,image.height,rgba,{precision:"half",colorSpace:"Linear Rec.709"})};
}
