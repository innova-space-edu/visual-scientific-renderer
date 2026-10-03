import {ParticleSystem,type ParticleConfig} from "./webgpu.js";
export class WebGPUParticleCompute{
  private device:any;private pipeline:any;private bindGroup:any;private particleBuffer:any;private paramsBuffer:any;private count=0;private config:ParticleConfig={count:0};
  async init(config:ParticleConfig,positions:Float32Array,velocities:Float32Array){
    const nav:any=navigator;if(!nav.gpu)throw new Error("WebGPU unavailable");
    const adapter=await nav.gpu.requestAdapter();if(!adapter)throw new Error("No WebGPU adapter");
    this.device=await adapter.requestDevice();this.count=config.count;this.config=config;
    const interleaved=new Float32Array(config.count*8);for(let i=0;i<config.count;i++){const p=i*3,o=i*8;interleaved[o]=positions[p]!;interleaved[o+1]=positions[p+1]!;interleaved[o+2]=positions[p+2]!;interleaved[o+3]=1;interleaved[o+4]=velocities[p]!;interleaved[o+5]=velocities[p+1]!;interleaved[o+6]=velocities[p+2]!;}
    const GPUUsage=(globalThis as any).GPUBufferUsage;if(!GPUUsage)throw new Error("WebGPU buffer constants unavailable");this.particleBuffer=this.device.createBuffer({size:interleaved.byteLength,usage:GPUUsage.STORAGE|GPUUsage.COPY_DST|GPUUsage.COPY_SRC});this.device.queue.writeBuffer(this.particleBuffer,0,interleaved);
    this.paramsBuffer=this.device.createBuffer({size:32,usage:GPUUsage.UNIFORM|GPUUsage.COPY_DST});
    const module=this.device.createShaderModule({code:this.shader()});this.pipeline=await this.device.createComputePipelineAsync({layout:"auto",compute:{module,entryPoint:"main"}});
    this.bindGroup=this.device.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.paramsBuffer}}]});
    return this;
  }
  step(dt:number,drag=Math.max(0,1-(this.config.drag??.002)*dt),radial=this.config.radialForce??0){
    if(!this.device)throw new Error("GPU particle compute not initialized");
    this.device.queue.writeBuffer(this.paramsBuffer,0,new Float32Array([dt,drag,radial,0,...(this.config.gravity??[0,0,0]),0]));
    const encoder=this.device.createCommandEncoder(),pass=encoder.beginComputePass();pass.setPipeline(this.pipeline);pass.setBindGroup(0,this.bindGroup);pass.dispatchWorkgroups(Math.ceil(this.count/64));pass.end();this.device.queue.submit([encoder.finish()]);
  }
  get buffer(){return this.particleBuffer}
  dispose(){this.particleBuffer?.destroy();this.paramsBuffer?.destroy();this.device?.destroy();this.device=null}
  private shader(){return ParticleSystem.wgsl()}
}
