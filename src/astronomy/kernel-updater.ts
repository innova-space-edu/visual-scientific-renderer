import {sha256Hex,type KernelRecord} from "./kernel-store.js";
export type KernelStoreLike={put(record:KernelRecord):Promise<void>;get(name:string):Promise<KernelRecord|undefined>};
export type KernelSource={name:string;url:string;sha256?:string};
export async function updateKernel(source:KernelSource,store:KernelStoreLike,fetcher:typeof fetch=fetch){
  const res=await fetcher(source.url);if(!res.ok)throw new Error("Kernel download HTTP "+res.status);const bytes=await res.arrayBuffer(),hash=await sha256Hex(bytes);
  if(source.sha256&&hash.toLowerCase()!==source.sha256.toLowerCase())throw new Error("Kernel checksum mismatch for "+source.name);
  const existing=await store.get(source.name);if(existing?.sha256===hash)return{changed:false,record:existing};
  const record:KernelRecord={name:source.name,bytes,updatedAt:Date.now(),source:source.url,sha256:hash};await store.put(record);return{changed:true,record};
}
export async function updateKernelSet(sources:KernelSource[],store:KernelStoreLike,fetcher:typeof fetch=fetch){const results=[];for(const source of sources)results.push(await updateKernel(source,store,fetcher));return results}
