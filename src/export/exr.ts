import {encodeExrRgba,inspectExrImage} from "@bb-studio/exr";

export type ExrPrecision="half"|"float";
export type ExrExportOptions={precision?:ExrPrecision;includeAlpha?:boolean;colorSpace?:string};

export function encodeOpenEXR(width:number,height:number,rgba:Float32Array,options:ExrExportOptions={}){
  if(width<=0||height<=0)throw new Error("Invalid EXR dimensions");
  if(rgba.length!==width*height*4)throw new Error("EXR RGBA buffer length mismatch");
  const attributes=options.colorSpace?{ocioColorSpace:{type:"string" as const,value:options.colorSpace}}:undefined;
  return encodeExrRgba(
    {width,height,rgba},
    {precision:options.precision??"half",includeAlpha:options.includeAlpha??true,attributes}
  );
}

export function verifyOpenEXR(bytes:ArrayBuffer|Uint8Array){
  const buffer=bytes instanceof Uint8Array?bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength):bytes;
  return inspectExrImage(buffer);
}

export function rgbToRgbaFloat(rgb:Float32Array,alpha=1){
  if(rgb.length%3!==0)throw new Error("RGB float buffer length must be divisible by 3");
  const rgba=new Float32Array(rgb.length/3*4);
  for(let i=0,j=0;i<rgb.length;i+=3,j+=4){rgba[j]=rgb[i]!;rgba[j+1]=rgb[i+1]!;rgba[j+2]=rgb[i+2]!;rgba[j+3]=alpha}
  return rgba;
}
