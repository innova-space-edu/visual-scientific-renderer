import type {ScientificRenderRequest,ScientificQuality} from "../types.js";
import {detectRuntimeCapabilities,selectQuality} from "./capabilities.js";
import {chooseRuntimeBudget} from "./resource-budget.js";
import {buildAdvancedSolarSystemScene,buildSingleBodyScene} from "../astronomy/solar-system.js";
import {buildMoleculeObject,MOLECULES} from "../chemistry/molecule.js";
import {buildCellObject,defaultAnimalCell,defaultPlantCell} from "../biology/cell.js";

export type OrchestratorOptions={proWorkerUrl?:string};
export type OrchestratedRender={mode:ScientificQuality;backend:"browser"|"worker";scene?:any;object?:any;job?:{id:string;state:string};budget?:ReturnType<typeof chooseRuntimeBudget>};

export class ScientificRenderOrchestrator{
  constructor(private options:OrchestratorOptions={}){}
  async render(request:ScientificRenderRequest):Promise<OrchestratedRender>{
    const caps=detectRuntimeCapabilities();
    const memory=(navigator as any)?.deviceMemory;
    const budget=chooseRuntimeBudget({webgpu:caps.webgpu,deviceMemoryGB:memory,hardwareConcurrency:navigator.hardwareConcurrency,width:request.width,height:request.height});
    const quality=selectQuality(request.quality,caps);
    if(quality==="pro"&&this.options.proWorkerUrl){
      const res=await fetch(this.options.proWorkerUrl.replace(/\/$/,"")+"/render",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({scene:request.scene,width:request.width??2048,height:request.height??2048,parameters:request.parameters??{}})});
      if(!res.ok)throw new Error("Pro render worker HTTP "+res.status);
      return{mode:"pro",backend:"worker",job:await res.json(),budget};
    }
    if(request.domain==="astronomy"){
      const scene=request.scene.toLowerCase();
      if(scene.includes("solar"))return{mode:quality,backend:"browser",scene:await buildAdvancedSolarSystemScene({particleCount:budget.maxParticles,seed:request.seed}),budget};
      if(scene.includes("saturn"))return{mode:quality,backend:"browser",scene:await buildSingleBodyScene("saturn",{seed:request.seed}),budget};
      if(scene.includes("sun")||scene.includes("sol"))return{mode:quality,backend:"browser",scene:await buildSingleBodyScene("sun",{seed:request.seed}),budget};
    }
    if(request.domain==="chemistry"){
      const key=Object.keys(MOLECULES).find(k=>request.scene.toUpperCase().includes(k));
      if(key)return{mode:quality,backend:"browser",object:await buildMoleculeObject(MOLECULES[key]!),budget};
    }
    if(request.domain==="biology"){
      const model=request.scene.toLowerCase().includes("plant")||request.scene.toLowerCase().includes("vegetal")?defaultPlantCell():defaultAnimalCell();
      return{mode:quality,backend:"browser",object:await buildCellObject(model),budget};
    }
    throw new Error("No local renderer registered for "+request.domain+":"+request.scene);
  }
}
