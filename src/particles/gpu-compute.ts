import type {ParticleConfig} from "./webgpu.js";
export class WebGPUParticleCompute{
  private device:any;private pipeline:any;private bindGroup:any;private particleBuffer:any;private paramsBuffer:any;private count=0;
  async init(config:ParticleConfig,positions:Float32Array,velocities:Float32Array){
    const nav:any=navigator;if(!nav.gpu)throw new Error("WebGPU unavailable");
    const adapter=await nav.gpu.requestAdapter();if(!adapter)throw new Error("No WebGPU adapter");
    this.device=await adapter.requestDevice();this.count=config.count;
    const interleaved=new Float32Array(config.count*8);for(let i=0;i<config.count;i++){const p=i*3,o=i*8;interleaved[o]=positions[p]!;interleaved[o+1]=positions[p+1]!;interleaved[o+2]=positions[p+2]!;interleaved[o+3]=1;interleaved[o+4]=velocities[p]!;interleaved[o+5]=velocities[p+1]!;interleaved[o+6]=velocities[p+2]!;}
    const GPUUsage=(globalThis as any).GPUBufferUsage;if(!GPUUsage)throw new Error("WebGPU buffer constants unavailable");this.particleBuffer=this.device.createBuffer({size:interleaved.byteLength,usage:GPUUsage.STORAGE|GPUUsage.COPY_DST|GPUUsage.COPY_SRC});this.device.queue.writeBuffer(this.particleBuffer,0,interleaved);
    this.paramsBuffer=this.device.createBuffer({size:16,usage:GPUUsage.UNIFORM|GPUUsage.COPY_DST});
    const module=this.device.createShaderModule({code:this.shader()});this.pipeline=await this.device.createComputePipelineAsync({layout:"auto",compute:{module,entryPoint:"main"}});
    this.bindGroup=this.device.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.paramsBuffer}}]});
    return this;
  }
  step(dt:number,drag=.998,radial=.01){
    if(!this.device)throw new Error("GPU particle compute not initialized");
    this.device.queue.writeBuffer(this.paramsBuffer,0,new Float32Array([dt,drag,radial,0]));
    const encoder=this.device.createCommandEncoder(),pass=encoder.beginComputePass();pass.setPipeline(this.pipeline);pass.setBindGroup(0,this.bindGroup);pass.dispatchWorkgroups(Math.ceil(this.count/64));pass.end();this.device.queue.submit([encoder.finish()]);
  }
  get buffer(){return this.particleBuffer}
  private shader(){return `struct Particle{pos:vec4f,vel:vec4f};@group(0)@binding(0)var<storage,read_write>p:array<Particle>;struct Params{dt:f32,drag:f32,radial:f32,pad:f32};@group(0)@binding(1)var<uniform>u:Params;@compute @workgroup_size(64) fn main(@builtin(global_invocation_id)gid:vec3u){let i=gid.x;if(i>=arrayLength(&p)){return;}var v=p[i];let r=max(length(v.pos.xyz),.001);let a=normalize(v.pos.xyz)*u.radial;v.vel.xyz=(v.vel.xyz+a*u.dt)*u.drag;v.pos.xyz+=v.vel.xyz*u.dt;p[i]=v;}`}
}
