import type {Stage,FailureCode} from './pipeline-errors.js';
export type AttemptFailure={provider:string;model:string;stage:Stage;code:FailureCode;status?:number;retryAfterSeconds?:number};
/** Stable models verified against official model catalogs, October 2026. */
export function geminiModel(stage:Stage){
 return process.env.GEMINI_TEXT_MODEL_PRIMARY?.trim()||(stage==='editorial'?'gemini-3.8-flash':'gemini-3.5-flash-lite');
}
export function geminiThinking(model:string){
 return model.startsWith('gemini-2.5-flash')?{thinkingConfig:{thinkingBudget:0}}:
 model==='gemini-3.8-flash'?{thinkingConfig:{thinkingLevel:'low'}}:{};
}
