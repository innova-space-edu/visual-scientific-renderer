import type {AttemptFailure} from './provider-policy.js';
export type Stage='intent'|'research'|'editorial'|'validation';
export type FailureCode='TIMEOUT'|'NETWORK'|'PROVIDER_UNAVAILABLE'|'INVALID_JSON'|'EMPTY_RESPONSE'|'TRUNCATED_RESPONSE'|'BLOCKED_RESPONSE'|'INVALID_KEY'|'QUOTA'|'CREDITS'|'MODEL_UNAVAILABLE'|'MODEL_CONFIG'|'DEADLINE'|'INPUT_BUDGET';
const messages:Record<FailureCode,string>={
 INPUT_BUDGET:'El contenido excede el presupuesto de tokens de este proveedor. Configura un respaldo con mayor capacidad.',
 TIMEOUT:'La IA tardó demasiado en responder. Intenta nuevamente.',
 NETWORK:'No se pudo conectar con el proveedor de IA. Intenta nuevamente.',
 PROVIDER_UNAVAILABLE:'El proveedor de IA está temporalmente indisponible. Intenta nuevamente.',
 INVALID_JSON:'La IA devolvió una respuesta incompleta o con formato incorrecto. Intenta nuevamente.',
 EMPTY_RESPONSE:'La IA no entregó contenido para esta solicitud. Intenta nuevamente.',
 TRUNCATED_RESPONSE:'La respuesta de IA se cortó antes de completar el contenido. Intenta nuevamente.',
 BLOCKED_RESPONSE:'El proveedor de IA rechazó esta solicitud. Reformula el prompt.',
 INVALID_KEY:'La API key configurada no autoriza la generación. Revisa su validez y permisos.',
 CREDITS:'El proveedor IA no tiene saldo disponible. Revisa la facturación o usa un proveedor de respaldo.',
 QUOTA:'El proveedor IA alcanzó su cuota. Revisa la cuota y facturación de tu API key o configura un proveedor de respaldo.',
 MODEL_UNAVAILABLE:'El modelo IA configurado no está disponible. Revisa la variable del modelo en Vercel.',
 MODEL_CONFIG:'El proveedor rechazó la configuración del modelo. Revisa las variables del modelo en Vercel.',
 DEADLINE:'La generación excedió el tiempo disponible. Intenta nuevamente.'
};
export class ProviderFailure extends Error{
 constructor(public code:FailureCode,public retryable:boolean,public status?:number,public retryAfterSeconds?:number){super(messages[code]);}
}
export class PipelineFailure extends ProviderFailure{
 constructor(cause:ProviderFailure,public stage:Stage,public provider?:string,public failures:AttemptFailure[]=[]){
  super(cause.code,cause.retryable,cause.status,cause.retryAfterSeconds);
  const reasons=[...new Set(failures.map(f=>f.provider+': '+(f.code==='QUOTA'?'cuota agotada':f.code==='CREDITS'?'sin saldo':f.code)))];
  if(reasons.length)this.message='No se pudo completar la generación ('+reasons.join('; ')+'). '+cause.message;
 }
}
export function httpFailure(status:number,retryAfter?:string|null):ProviderFailure{
 const code=status===402?'CREDITS':status===429?'QUOTA':status===401||status===403?'INVALID_KEY':status===404?'MODEL_UNAVAILABLE':status===400?'MODEL_CONFIG':status===408||status===504?'TIMEOUT':'PROVIDER_UNAVAILABLE';
 const seconds=retryAfter?Number(retryAfter):NaN;
 return new ProviderFailure(code,status>=500||status===408,status,Number.isFinite(seconds)&&seconds>=0?Math.min(86400,Math.ceil(seconds)):undefined);
}
export function classifyFailure(error:unknown):ProviderFailure{
 if(error instanceof ProviderFailure)return error;
 if(error instanceof SyntaxError)return new ProviderFailure('INVALID_JSON',true);
 if(error instanceof Error&&(error.name==='TimeoutError'||error.name==='AbortError'))return new ProviderFailure('TIMEOUT',true);
 return new ProviderFailure('NETWORK',true);
}
export function geminiText(data:any):string{
 const c=data?.candidates?.[0];
 if(data?.promptFeedback?.blockReason||['SAFETY','RECITATION','BLOCKLIST','PROHIBITED_CONTENT','SPII'].includes(c?.finishReason))throw new ProviderFailure('BLOCKED_RESPONSE',false);
 if(c?.finishReason==='MAX_TOKENS')throw new ProviderFailure('TRUNCATED_RESPONSE',true);
 const text=(c?.content?.parts||[]).filter((p:any)=>!p.thought&&typeof p.text==='string').map((p:any)=>p.text).join('');
 if(!text.trim())throw new ProviderFailure('EMPTY_RESPONSE',true);
 return text;
}
