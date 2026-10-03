import type {ScientificRenderRequest} from "../types.js";
export type VisualEngineScientificNode={id:string;type:"scientific-render";request:ScientificRenderRequest;fallback?:{type:string;label?:string};metadata?:Record<string,unknown>};
export function createScientificNode(id:string,request:ScientificRenderRequest,metadata:Record<string,unknown>={}):VisualEngineScientificNode{return{id,type:"scientific-render",request,fallback:{type:"placeholder",label:request.scene},metadata:{renderer:"visual-scientific-renderer",version:"0.1",...metadata}}}
export function isScientificNode(value:any):value is VisualEngineScientificNode{return!!value&&value.type==="scientific-render"&&typeof value.id==="string"&&value.request}
