export type GPUFilterKind="gaussian"|"sobel"|"sharpen"|"contrast";
export function gpuFilterWGSL(kind:GPUFilterKind){
  const gaussian="var c=sample(0,0)*.227027;c+=sample(-1,0)*.1945946;c+=sample(1,0)*.1945946;c+=sample(0,-1)*.1216216;c+=sample(0,1)*.1216216;c+=sample(-2,0)*.0702703;c+=sample(2,0)*.0702703;outColor=c;";
  const sobel="let gx=-sample(-1,-1)-2.0*sample(-1,0)-sample(-1,1)+sample(1,-1)+2.0*sample(1,0)+sample(1,1);let gy=-sample(-1,-1)-2.0*sample(0,-1)-sample(1,-1)+sample(-1,1)+2.0*sample(0,1)+sample(1,1);outColor=vec4f(vec3f(length(vec2f(dot(gx.rgb,vec3f(.333)),dot(gy.rgb,vec3f(.333))))),1.0);";
  const sharpen="outColor=sample(0,0)*5.0-sample(-1,0)-sample(1,0)-sample(0,-1)-sample(0,1);";
  const contrast="let c=sample(0,0);outColor=vec4f((c.rgb-.5)*1.12+.5,c.a);";
  const body=kind==="sobel"?sobel:kind==="sharpen"?sharpen:kind==="contrast"?contrast:gaussian;
  return "@group(0)@binding(0)var inputTex:texture_2d<f32>;@group(0)@binding(1)var outputTex:texture_storage_2d<rgba8unorm,write>;fn sample(dx:i32,dy:i32)->vec4f{let size=textureDimensions(inputTex);let p=vec2i(i32(gid.x)+dx,i32(gid.y)+dy);p=clamp(p,vec2i(0),vec2i(size)-vec2i(1));return textureLoad(inputTex,p,0);}@compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) gid:vec3u){let size=textureDimensions(inputTex);if(gid.x>=size.x||gid.y>=size.y){return;}var outColor:vec4f;"+body+"textureStore(outputTex,vec2i(gid.xy),clamp(outColor,vec4f(0.0),vec4f(1.0)));}";
}