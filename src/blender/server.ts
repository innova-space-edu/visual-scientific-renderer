import {createServer,type IncomingMessage,type ServerResponse} from "node:http";
import {RenderQueue} from "../render/queue.js";
import {hashRenderRequest} from "../render/cache.js";
import {runBlenderJob} from "./worker.js";
import type {BlenderRenderJob} from "./pro.js";

export type BlenderWorkerServerOptions={host?:string;port?:number;concurrency?:number;maxBodyBytes?:number};
function json(res:ServerResponse,status:number,payload:unknown){const body=JSON.stringify(payload);res.writeHead(status,{"content-type":"application/json","content-length":Buffer.byteLength(body)});res.end(body)}
async function readJson(req:IncomingMessage,max:number){let size=0;const chunks:Buffer[]=[];for await(const chunk of req){const b=Buffer.from(chunk);size+=b.length;if(size>max)throw new Error("request too large");chunks.push(b)}return JSON.parse(Buffer.concat(chunks).toString("utf8"))}
export function createBlenderWorkerServer(options:BlenderWorkerServerOptions={}){
  const queue=new RenderQueue<Partial<BlenderRenderJob>&{scene:string},any>(async(input,signal)=>{const result=await runBlenderJob(input,signal);return{job:result.job,pngBase64:result.bytes.toString("base64")}},options.concurrency??1);
  const server=createServer(async(req,res)=>{try{
    if(req.method==="GET"&&req.url==="/health")return json(res,200,{ok:true,service:"visual-scientific-blender-worker",jobs:queue.list().length});
    if(req.method==="POST"&&req.url==="/render"){const input=await readJson(req,options.maxBodyBytes??1_000_000);const id=await hashRenderRequest(input);const existing=queue.get(id);const job=existing??queue.enqueue(input,id);return json(res,202,{id:job.id,state:job.state});}
    const m=req.method==="GET"&&req.url?.match(/^\/render\/([a-f0-9-]+)$/i);if(m){const job=queue.get(m[1]!);return job?json(res,200,job):json(res,404,{error:"job not found"});}
    const c=req.method==="DELETE"&&req.url?.match(/^\/render\/([a-f0-9-]+)$/i);if(c)return json(res,200,{cancelled:queue.cancel(c[1]!)});
    return json(res,404,{error:"not found"});
  }catch(error){json(res,500,{error:String(error)})}});
  return{queue,server,listen(){return new Promise<void>(resolve=>server.listen(options.port??8787,options.host??"0.0.0.0",()=>resolve()))}};
}
