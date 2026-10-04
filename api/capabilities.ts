/** Non-secret readiness for deployment diagnostics. Never returns values or tokens. */
export default function handler(req:{method?:string},res:{setHeader:(k:string,v:string)=>void;status:(n:number)=>any;json:(v:any)=>void}){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.status(405).json({error:'Usa GET'});return;}
 const keys={GEMINI_API_KEY:!!(process.env.GEMINI_API_KEY||process.env.GOOGLE_API_KEY),GROQ_API_KEY:!!process.env.GROQ_API_KEY,OPENROUTER_API_KEY:!!process.env.OPENROUTER_API_KEY,CEREBRAS_API_KEY:!!process.env.CEREBRAS_API_KEY};
 res.status(200).json({textGeneration:Object.values(keys).some(Boolean),webGrounding:keys.GEMINI_API_KEY||keys.GROQ_API_KEY||keys.OPENROUTER_API_KEY,webProviders:[...(keys.GEMINI_API_KEY?['Gemini Google Search']:[]),...(keys.GROQ_API_KEY?['Groq Browser Search']:[]),...(keys.OPENROUTER_API_KEY?['OpenRouter Web Search']:[]),'Wikipedia'],optionalIllustrations:keys.GEMINI_API_KEY&&!!process.env.GEMINI_IMAGE_MODEL,configured:keys});
}
