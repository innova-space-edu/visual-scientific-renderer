export function encodeRadianceHDR(width:number,height:number,rgb:Float32Array){
  if(rgb.length!==width*height*3)throw new Error("RGB length mismatch");
  const header=new TextEncoder().encode("#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y "+height+" +X "+width+"\n"),pixels=new Uint8Array(width*height*4);
  for(let i=0;i<width*height;i++){const r=Math.max(0,rgb[i*3]!),g=Math.max(0,rgb[i*3+1]!),b=Math.max(0,rgb[i*3+2]!),v=Math.max(r,g,b);if(v<1e-32)continue;const e=Math.ceil(Math.log2(v)),scale=Math.pow(2,e)/256,p=i*4;pixels[p]=Math.min(255,Math.round(r/scale));pixels[p+1]=Math.min(255,Math.round(g/scale));pixels[p+2]=Math.min(255,Math.round(b/scale));pixels[p+3]=e+128}
  const out=new Uint8Array(header.length+pixels.length);out.set(header);out.set(pixels,header.length);return out;
}
