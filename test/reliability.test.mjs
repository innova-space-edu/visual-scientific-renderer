import test from 'node:test';import assert from 'node:assert/strict';
import handler from '../.test-dist/api/content-plan.js';
import {research,citations,groqModel} from '../.test-dist/api/_lib/research.js';
import {httpFailure,geminiText} from '../.test-dist/api/_lib/pipeline-errors.js';
import {isWikimediaImage,embedArtwork} from '../.test-dist/api/_lib/artwork.js';
import {spherePixels} from '../dist/studio/planet-art.js';
import {surfaceSample} from '../dist/materials/surface.js';
const names=['GEMINI_API_KEY','GOOGLE_API_KEY','GROQ_API_KEY','OPENROUTER_API_KEY','CEREBRAS_API_KEY','GROQ_TEXT_MODEL','OPENROUTER_SEARCH_MODEL','OPENROUTER_TEXT_MODEL'];
async function isolated(fn){const fetch=globalThis.fetch,env={...process.env};for(const k of names)delete process.env[k];try{await fn()}finally{globalThis.fetch=fetch;for(const k of names)if(env[k]===undefined)delete process.env[k];else process.env[k]=env[k];}}
test('search without citations falls through to bounded OpenRouter evidence and preserves the topic',()=>isolated(async()=>{
 process.env.GEMINI_API_KEY='test-gemini';process.env.GROQ_API_KEY='test-groq';process.env.OPENROUTER_API_KEY='test-openrouter';process.env.OPENROUTER_SEARCH_MODEL='openai/gpt-4o-mini';const requests=[];
 globalThis.fetch=async(url,opts)=>{if(String(url).includes('wikipedia'))return{ok:true,json:async()=>({})};const b=JSON.parse(opts.body);requests.push({url,b});if(String(url).includes('googleapis'))return{ok:true,json:async()=>({candidates:[{content:{parts:[{text:'No web evidence'}]}}]})};if(String(url).includes('groq.com'))return{ok:true,json:async()=>({choices:[{message:{content:'Uncited answer'}}]})};return{ok:true,json:async()=>({choices:[{message:{content:'Contenido verificado sobre fotosíntesis.',annotations:[{type:'url_citation',url_citation:{title:'Fuente científica',url:'https://example.org/photosynthesis',content:'Plant science'}}]}}]})};};
 const pack=await research('Infografía de fotosíntesis para 1 medio','Fotosíntesis');assert.equal(pack.provider,'OpenRouter Web Search');assert.equal(pack.query,'Fotosíntesis');assert.equal(pack.sources.length,1);assert.equal(pack.attempts.length,3);assert.equal(requests[1].b.response_format,undefined);assert.equal(requests[2].b.max_tool_calls,1);assert.equal(requests[2].b.tools[0].parameters.max_uses,1);assert.ok(requests.every(r=>JSON.stringify(r.b).includes('fotosíntesis')));
}));
test('transport errors and output failures retain distinct actionable classifications',()=>{
 assert.equal(httpFailure(402).code,'CREDITS');assert.equal(httpFailure(429).code,'QUOTA');assert.equal(httpFailure(503).code,'PROVIDER_UNAVAILABLE');assert.equal(httpFailure(401).retryable,false);
 assert.throws(()=>geminiText({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{"broken'}]}}]}),e=>e.code==='TRUNCATED_RESPONSE');assert.throws(()=>geminiText({candidates:[{content:{parts:[{text:'hidden',thought:true}]}}]}),e=>e.code==='EMPTY_RESPONSE');
 assert.deepEqual(citations([{url:'javascript:alert(1)'},{url:'http://unsafe.test'},{url:'https://user:pass@example.org'},{url:'https://example.org',title:'safe'},{url:'https://example.org',title:'duplicate'}]).map(s=>s.title),['safe']);
});
test('retired Groq defaults migrate while valid explicit models are preserved',()=>isolated(async()=>{
 assert.equal(groqModel(),'openai/gpt-oss-120b');process.env.GROQ_TEXT_MODEL='llama-3.3-70b-versatile';assert.equal(groqModel(),'openai/gpt-oss-120b');process.env.GROQ_TEXT_MODEL='openai/gpt-oss-20b';assert.equal(groqModel(),'openai/gpt-oss-20b');
}));
test('generic generation falls back to Groq before retrying Gemini and keeps research synchronized',()=>isolated(async()=>{
 process.env.GEMINI_API_KEY='test-key';process.env.GROQ_API_KEY='test-key';let groqCalls=0,geminiCalls=0,editorInput,criticInput;
 globalThis.fetch=async(url,opts)=>{if(String(url).includes('wikipedia'))return{ok:true,json:async()=>({query:{pages:{1:{title:'Fotosíntesis',extract:'La luz permite sintetizar azúcares.',fullurl:'https://es.wikipedia.org/wiki/Fotos%C3%ADntesis'}}}})};const body=JSON.parse(opts.body);if(body.tools)return{ok:false,status:503};if(String(url).includes('googleapis')){geminiCalls++;return{ok:false,status:503};}groqCalls++;assert.equal(body.model,groqCalls===2?'openai/gpt-oss-120b':'openai/gpt-oss-20b');const input=JSON.parse(body.messages[1].content);if(groqCalls===2)editorInput=input;if(groqCalls===3)criticInput=input;
 const data=groqCalls===1?{topic:'Fotosíntesis',domain:'science',preset:'science-classroom'}:groqCalls===2?{title:'Fotosíntesis',subtitle:'Luz y vida',diagram:'photosynthesis',sections:[{title:'Transformación',text:'La luz permite sintetizar azúcares.',kind:'text'}]}:{accepted:true,issues:[]};return{ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(data)}}]})};};
 let status,payload;await handler({method:'POST',body:{prompt:'Infografía horizontal de fotosíntesis para 1 medio'}},{setHeader(){},status(n){status=n;return this},json(v){payload=v}});assert.equal(status,200);assert.equal(geminiCalls,3);assert.equal(groqCalls,3);assert.equal(payload.document.aiMeta.provider,'Groq');assert.deepEqual(editorInput.research,criticInput.research);assert.equal(editorInput.brief.topic,'Fotosíntesis');assert.equal(payload.document.format,'landscape');assert.equal(payload.document.diagram,'photosynthesis');
}));
test('artwork embedding never fetches arbitrary or credential-bearing hosts',()=>isolated(async()=>{
 globalThis.fetch=()=>{throw new Error('Should not fetch')};assert.equal(isWikimediaImage('https://evil.test/upload.wikimedia.org/x.png'),false);assert.equal(isWikimediaImage('https://user:pass@upload.wikimedia.org/x.png'),false);assert.equal(await embedArtwork({url:'https://127.0.0.1/x.png'}),undefined);
}));
test('projected planet surfaces are deterministic, transparent outside the sphere, textured and lit',()=>{
 const size=48,a=spherePixels('mercury',size),b=spherePixels('mercury',size);assert.deepEqual(a,b);assert.equal(a[3],0);const brightness=(x,y)=>a[(y*size+x)*4]+a[(y*size+x)*4+1]+a[(y*size+x)*4+2];assert.ok(brightness(12,24)>brightness(36,24));assert.ok(new Set(a).size>80);assert.throws(()=>spherePixels('unknown'));
 assert.deepEqual(surfaceSample('sun',.2,.5,.8,.6,.7,{seed:4}),surfaceSample('sun',.2,.5,.8,.6,.7,{seed:4}));
});

test('quota on Gemini is skipped across stages; Groq uses separate author and critic models',()=>isolated(async()=>{
 process.env.GEMINI_API_KEY='secret-gemini';process.env.GROQ_API_KEY='secret-groq';const models=[],google=[];let i=0;
 const replies=[{topic:'Fotosíntesis',domain:'science'}, {title:'Fotosíntesis',diagram:'photosynthesis',sections:[{title:'Luz',text:'La planta utiliza luz para sintetizar azúcares.'}]}, {accepted:true,issues:[]}];
 globalThis.fetch=async(url,opts)=>{
  if(String(url).includes('wikipedia'))return {ok:true,json:async()=>({query:{pages:{1:{title:'Fotosíntesis',extract:'La planta transforma energía luminosa.',fullurl:'https://es.wikipedia.org/wiki/Fotos%C3%ADntesis'}}}})};
  const b=JSON.parse(opts.body);
  if(String(url).includes('googleapis')){google.push(String(url));return{ok:false,status:429,headers:new Headers({'retry-after':'40'})};}
  models.push(b.model);assert.ok(b.max_completion_tokens<=4000);assert.ok(!b.tools);
  return{ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(replies[i++])}}]})};
 };
 let status,payload;await handler({method:'POST',body:{prompt:'Infografía de fotosíntesis con explicación'}},{setHeader(){},status(n){status=n;return this},json(v){payload=v}});
 assert.equal(status,200);assert.equal(google.length,2);assert.deepEqual(models,['openai/gpt-oss-20b','openai/gpt-oss-120b','openai/gpt-oss-20b']);assert.equal(payload.document.aiMeta.searchProvider,'Wikipedia');
}));

test('a paid OpenRouter model without credits falls back to free and reports the actual model',()=>isolated(async()=>{
 process.env.OPENROUTER_API_KEY='secret-openrouter';process.env.OPENROUTER_TEXT_MODEL='openai/gpt-4o-mini';let i=0,paid=0;const free=[];
 const replies=[{topic:'Historia de Chile',domain:'general'}, {title:'Historia de Chile',diagram:'none',sections:[{title:'Independencia',text:'La independencia se proclamó en 1818.'}]}, {accepted:true,issues:[]}];
 globalThis.fetch=async(url,opts)=>{
  if(String(url).includes('wikipedia'))return{ok:true,json:async()=>({query:{pages:{1:{title:'Historia de Chile',extract:'La independencia se proclamó en 1818.',fullurl:'https://es.wikipedia.org/wiki/Historia_de_Chile'}}}})};
  const b=JSON.parse(opts.body);assert.ok(!b.tools);
  if(b.model!=='openrouter/free'){paid++;return{ok:false,status:402};}
  free.push(b.model);return{ok:true,json:async()=>({model:'verified-catalog-model:free',choices:[{message:{content:JSON.stringify(replies[i++])}}]})};
 };
 let status,payload;await handler({method:'POST',body:{prompt:'Infografía de historia de Chile con tres hitos'}},{setHeader(){},status(n){status=n;return this},json(v){payload=v}});
 assert.equal(status,200);assert.equal(paid,1);assert.equal(free.length,3);assert.equal(payload.document.aiMeta.model,'verified-catalog-model:free');
}));

test('all exhausted providers retain quota and credit reasons without bypassing independent validation',()=>isolated(async()=>{
 process.env.GEMINI_API_KEY='secret-gemini';process.env.GROQ_API_KEY='secret-groq';process.env.OPENROUTER_API_KEY='secret-openrouter';let i=0;
 globalThis.fetch=async(url,opts)=>{
  if(String(url).includes('wikipedia'))return{ok:true,json:async()=>({query:{pages:{1:{title:'Fotosíntesis',extract:'Las plantas producen azúcares con luz.',fullurl:'https://es.wikipedia.org/wiki/Fotos%C3%ADntesis'}}}})};
  if(String(url).includes('googleapis'))return{ok:false,status:429};
  if(String(url).includes('openrouter'))return{ok:false,status:402};
  const b=JSON.parse(opts.body);if(b.tools)return{ok:false,status:429};
  if(++i===1)return{ok:true,json:async()=>({choices:[{message:{content:'{"topic":"Fotosíntesis","domain":"science"}'}}]})};
  if(i===2)return{ok:true,json:async()=>({choices:[{message:{content:'{"title":"Fotosíntesis","diagram":"photosynthesis","sections":[{"title":"Luz","text":"Las plantas producen azúcares."}]}'}}]})};
  return{ok:false,status:429,headers:new Headers({'retry-after':'45'})};
 };
 let status,payload;await handler({method:'POST',body:{prompt:'Infografía breve de fotosíntesis'}},{setHeader(){},status(n){status=n;return this},json(v){payload=v}});
 assert.equal(status,503);assert.equal(payload.stage,'validation');assert.ok(!payload.document);assert.match(payload.error,/cuota agotada/);assert.match(payload.error,/sin saldo/);assert.ok(payload.providers.some(f=>f.retryAfterSeconds===45));assert.ok(!JSON.stringify(payload).includes('secret-'));
}));
