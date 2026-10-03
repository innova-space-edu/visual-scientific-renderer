import type {Grid3D} from "../fields/isosurface.js";

export type WebGPUVolumeOptions={
  densityScale?:number;
  threshold?:number;
  stepSize?:number;
  exposure?:number;
  yaw?:number;
  pitch?:number;
};

export class WebGPUVolumeRenderer{
  private device:any;
  private context:any;
  private pipeline:any;
  private bindGroup:any;
  private uniformBuffer:any;
  private volumeTexture:any;
  private format:any;

  async init(canvas:HTMLCanvasElement,grid:Grid3D){
    const nav:any=globalThis.navigator;
    if(!nav?.gpu)throw new Error("WebGPU is required for GPU volume ray marching");
    const adapter=await nav.gpu.requestAdapter();
    if(!adapter)throw new Error("No WebGPU adapter available");
    this.device=await adapter.requestDevice();
    this.context=canvas.getContext("webgpu") as any;
    if(!this.context)throw new Error("Unable to create WebGPU canvas context");
    this.format=nav.gpu.getPreferredCanvasFormat();
    this.context.configure({device:this.device,format:this.format,alphaMode:"premultiplied"});

    const usage=(globalThis as any).GPUTextureUsage;
    const bufferUsage=(globalThis as any).GPUBufferUsage;
    if(!usage||!bufferUsage)throw new Error("WebGPU constants unavailable");

    this.volumeTexture=this.device.createTexture({
      size:{width:grid.nx,height:grid.ny,depthOrArrayLayers:grid.nz},
      dimension:"3d",
      format:"r32float",
      usage:usage.TEXTURE_BINDING|usage.COPY_DST
    });
    this.uploadGrid(grid);

    this.uniformBuffer=this.device.createBuffer({
      size:32,
      usage:bufferUsage.UNIFORM|bufferUsage.COPY_DST
    });

    const module=this.device.createShaderModule({code:this.shader()});
    this.pipeline=await this.device.createRenderPipelineAsync({
      layout:"auto",
      vertex:{module,entryPoint:"vs"},
      fragment:{module,entryPoint:"fs",targets:[{format:this.format}]},
      primitive:{topology:"triangle-list"}
    });
    this.bindGroup=this.device.createBindGroup({
      layout:this.pipeline.getBindGroupLayout(0),
      entries:[
        {binding:0,resource:this.volumeTexture.createView({dimension:"3d"})},
        {binding:1,resource:{buffer:this.uniformBuffer}}
      ]
    });
    return this;
  }

  private uploadGrid(grid:Grid3D){
    const bytesPerVoxel=4,rowBytes=grid.nx*bytesPerVoxel,rowPitch=Math.ceil(rowBytes/256)*256;
    const padded=new Uint8Array(rowPitch*grid.ny*grid.nz);
    const src=new Uint8Array(grid.values.buffer,grid.values.byteOffset,grid.values.byteLength);
    for(let z=0;z<grid.nz;z++)for(let y=0;y<grid.ny;y++){
      const srcOffset=(z*grid.ny+y)*rowBytes;
      const dstOffset=(z*grid.ny+y)*rowPitch;
      padded.set(src.subarray(srcOffset,srcOffset+rowBytes),dstOffset);
    }
    this.device.queue.writeTexture(
      {texture:this.volumeTexture},
      padded,
      {offset:0,bytesPerRow:rowPitch,rowsPerImage:grid.ny},
      {width:grid.nx,height:grid.ny,depthOrArrayLayers:grid.nz}
    );
  }

  render(options:WebGPUVolumeOptions={}){
    const values=new Float32Array([
      options.densityScale??3,
      options.threshold??.08,
      options.stepSize??.006,
      options.exposure??1.2,
      options.yaw??.55,
      options.pitch??-.28,
      0,0
    ]);
    this.device.queue.writeBuffer(this.uniformBuffer,0,values);
    const encoder=this.device.createCommandEncoder();
    const pass=encoder.beginRenderPass({
      colorAttachments:[{
        view:this.context.getCurrentTexture().createView(),
        clearValue:{r:.002,g:.004,b:.012,a:1},
        loadOp:"clear",
        storeOp:"store"
      }]
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0,this.bindGroup);
    pass.draw(3);
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  dispose(){this.volumeTexture?.destroy?.();this.uniformBuffer?.destroy?.();}

  private shader(){
    return `
struct Params{
  densityScale:f32,
  threshold:f32,
  stepSize:f32,
  exposure:f32,
  yaw:f32,
  pitch:f32,
  pad0:f32,
  pad1:f32
};
@group(0) @binding(0) var volume:texture_3d<f32>;
@group(0) @binding(1) var<uniform> params:Params;

struct VOut{
  @builtin(position) position:vec4f,
  @location(0) uv:vec2f
};

@vertex
fn vs(@builtin(vertex_index) id:u32)->VOut{
  var positions=array<vec2f,3>(
    vec2f(-1.0,-3.0),
    vec2f(3.0,1.0),
    vec2f(-1.0,1.0)
  );
  let p=positions[id];
  var out:VOut;
  out.position=vec4f(p,0.0,1.0);
  out.uv=p*0.5+vec2f(0.5);
  return out;
}

fn rotatePoint(p:vec3f)->vec3f{
  let cy=cos(params.yaw);let sy=sin(params.yaw);
  let cp=cos(params.pitch);let sp=sin(params.pitch);
  let q=p-vec3f(0.5);
  let yrot=vec3f(cy*q.x+sy*q.z,q.y,-sy*q.x+cy*q.z);
  let prot=vec3f(yrot.x,cp*yrot.y-sp*yrot.z,sp*yrot.y+cp*yrot.z);
  return prot+vec3f(0.5);
}

fn sampleVolume(p:vec3f)->f32{
  let dims=textureDimensions(volume);
  let maxCoord=vec3f(dims)-vec3f(1.0);
  let coord=vec3i(clamp(p*maxCoord,vec3f(0.0),maxCoord));
  return textureLoad(volume,coord,0).r;
}

fn transfer(v:f32)->vec4f{
  let x=clamp((v-params.threshold)*params.densityScale,0.0,1.0);
  let cold=vec3f(0.03,0.12,0.75);
  let mid=vec3f(0.72,0.04,0.82);
  let hot=vec3f(1.0,0.34,0.02);
  let white=vec3f(1.0,0.94,0.62);
  var color=mix(cold,mid,smoothstep(0.0,0.45,x));
  color=mix(color,hot,smoothstep(0.35,0.78,x));
  color=mix(color,white,smoothstep(0.78,1.0,x));
  let alpha=x*x*0.14;
  return vec4f(color,alpha);
}

@fragment
fn fs(in:VOut)->@location(0) vec4f{
  var p=vec3f(in.uv.x,1.0-in.uv.y,0.0);
  var accum=vec4f(0.0);
  let step=max(params.stepSize,0.001);
  var z=0.0;
  for(var i=0;i<512;i=i+1){
    if(z>1.0||accum.a>.985){break;}
    p.z=z;
    let rp=rotatePoint(p);
    if(all(rp>=vec3f(0.0))&&all(rp<=vec3f(1.0))){
      let c=transfer(sampleVolume(rp));
      accum.rgb=accum.rgb+(1.0-accum.a)*c.rgb*c.a;
      accum.a=accum.a+(1.0-accum.a)*c.a;
    }
    z=z+step;
  }
  let mapped=vec3f(1.0)-exp(-accum.rgb*params.exposure);
  return vec4f(mapped,1.0);
}
`;
  }
}
