export type RendererLearningEvent={type:"render.started"|"render.completed"|"render.failed"|"benchmark.completed"|"simulation.completed";runId:string;timestamp:number;payload:Record<string,unknown>};
export type LearningSink=(event:RendererLearningEvent)=>void|Promise<void>;
export class RendererLearningRecorder{private sinks=new Set<LearningSink>();addSink(sink:LearningSink){this.sinks.add(sink);return()=>this.sinks.delete(sink)}async record(event:Omit<RendererLearningEvent,"timestamp">){const full={...event,timestamp:Date.now()};await Promise.all([...this.sinks].map(s=>s(full)))}}
