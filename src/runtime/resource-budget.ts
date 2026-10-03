import type {ScientificQuality} from "../types.js";
export type RuntimeBudget={quality:ScientificQuality;maxParticles:number;textureSize:number;volumeResolution:number;pixelRatio:number;notes:string[]};
export function chooseRuntimeBudget(input:{webgpu:boolean;deviceMemoryGB?:number;hardwareConcurrency?:number;width?:number;height?:number}):RuntimeBudget{
  const memory=input.deviceMemoryGB??4,cores=input.hardwareConcurrency??4,pixels=(input.width??1200)*(input.height??800),notes:string[]=[];
  if(!input.webgpu||memory<4){notes.push("WebGPU unavailable or memory constrained");return{quality:"draft",maxParticles:5000,textureSize:512,volumeResolution:64,pixelRatio:1,notes};}
  if(memory>=8&&cores>=8&&pixels<=4_000_000)return{quality:"realtime",maxParticles:100000,textureSize:2048,volumeResolution:192,pixelRatio:2,notes};
  notes.push("Balanced realtime budget");return{quality:"realtime",maxParticles:40000,textureSize:1024,volumeResolution:128,pixelRatio:1.5,notes};
}
