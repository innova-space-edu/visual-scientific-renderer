import type {ScientificFieldBundle} from "./field-adapter.js";
import {buildTransferLUT,type VolumeTransferStop} from "../volume/raymarch.js";

export type PlasmaVisualPreset="density"|"temperature"|"electric"|"magnetic";
export const PLASMA_TRANSFER:Record<"density"|"temperature",VolumeTransferStop[]>={
  density:[{x:0,color:[0,0,.04],alpha:0},{x:.25,color:[.05,.15,.7],alpha:.08},{x:.55,color:[.5,.05,.8],alpha:.22},{x:.8,color:[1,.25,.02],alpha:.48},{x:1,color:[1,.9,.3],alpha:.8}],
  temperature:[{x:0,color:[0,.02,.1],alpha:0},{x:.3,color:[0,.3,1],alpha:.08},{x:.55,color:[.7,0,.8],alpha:.22},{x:.78,color:[1,.2,0],alpha:.5},{x:1,color:[1,1,.7],alpha:.88}]
};
export function normalizeField(values:Float32Array,lowQuantile=.01,highQuantile=.99){
  const sample=Array.from(values.length>200000?values.filter((_,i)=>i%Math.ceil(values.length/200000)===0):values).sort((a,b)=>a-b),pick=(q:number)=>sample[Math.max(0,Math.min(sample.length-1,Math.floor((sample.length-1)*q)))]??0,lo=pick(lowQuantile),hi=pick(highQuantile),span=Math.max(1e-12,hi-lo),out=new Float32Array(values.length);
  for(let i=0;i<values.length;i++)out[i]=Math.max(0,Math.min(1,(values[i]!-lo)/span));return{values:out,range:[lo,hi] as [number,number]};
}
export function preparePlasmaVolume(bundle:ScientificFieldBundle,preset:"density"|"temperature"="density"){
  const field=bundle.scalars.find(f=>f.name.toLowerCase().includes(preset))??bundle.scalars[0];if(!field)throw new Error("No scalar field available");
  const normalized=normalizeField(field.values);return{field:{...field,values:normalized.values},range:normalized.range,transferLUT:buildTransferLUT(PLASMA_TRANSFER[preset]),provenance:bundle.provenance};
}
export function prepareVectorField(bundle:ScientificFieldBundle,preset:"electric"|"magnetic"="magnetic"){
  const re=preset==="magnetic"?/^(b|magnetic)/i:/^(e|electric)/i,field=bundle.vectors.find(f=>re.test(f.name))??bundle.vectors[0];if(!field)throw new Error("No vector field available");return{field,provenance:bundle.provenance};
}
