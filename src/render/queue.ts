export type RenderJobState="queued"|"running"|"completed"|"failed"|"cancelled";
export type RenderJob<T=unknown,R=unknown>={id:string;input:T;state:RenderJobState;createdAt:number;startedAt?:number;finishedAt?:number;result?:R;error?:string};
export class RenderQueue<T,R>{
  private jobs=new Map<string,RenderJob<T,R>>();
  private pending:string[]=[];
  private active=0;
  private controllers=new Map<string,AbortController>();
  constructor(private worker:(input:T,signal:AbortSignal)=>Promise<R>,private concurrency=1){}
  enqueue(input:T,id:string=crypto.randomUUID()){
    const existing=this.jobs.get(id);if(existing)return existing;
    const job:RenderJob<T,R>={id,input,state:"queued",createdAt:Date.now()};this.jobs.set(id,job);this.pending.push(id);this.pump();return job;
  }
  get(id:string){return this.jobs.get(id)}
  list(){return[...this.jobs.values()]}
  cancel(id:string){
    const job=this.jobs.get(id);if(!job||["completed","failed","cancelled"].includes(job.state))return false;
    if(job.state==="queued"){job.state="cancelled";job.finishedAt=Date.now();this.pending=this.pending.filter(x=>x!==id);return true}
    const controller=this.controllers.get(id);if(controller){controller.abort();job.state="cancelled";job.finishedAt=Date.now();return true}
    return false;
  }
  private pump(){
    while(this.active<this.concurrency&&this.pending.length){
      const id=this.pending.shift()!,job=this.jobs.get(id);if(!job||job.state!=="queued")continue;
      this.active++;job.state="running";job.startedAt=Date.now();const controller=new AbortController();this.controllers.set(id,controller);
      this.worker(job.input,controller.signal).then(result=>{if(job.state!=="cancelled"){job.state="completed";job.result=result}}).catch(error=>{if(job.state!=="cancelled"){job.state="failed";job.error=String(error)}}).finally(()=>{if(!job.finishedAt)job.finishedAt=Date.now();this.controllers.delete(id);this.active--;this.pump()});
    }
  }
}
