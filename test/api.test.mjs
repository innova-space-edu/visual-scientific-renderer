import test from 'node:test';import assert from 'node:assert/strict';
import handler from '../.test-dist/api/content-plan.js';
const call=async body=>{let result;const res={status(code){this.code=code;return this},setHeader(){},json(value){result={code:this.code,value}}};await handler(body,res);return result};
test('content-plan generates requested Cramer offline without a provider or research call',async()=>{
 const previous=globalThis.fetch;globalThis.fetch=()=>{throw new Error('Cramer must not call external providers')};
 try{const {code,value}=await call({method:'POST',body:{prompt:'Cramer 3x+2y=13; x-y=1',research:true,provider:'gemini'}});assert.equal(code,200);assert.equal(value.searchProvider,'Cálculo local verificable');assert.ok(value.document.sections.some(s=>s.title==='Comprobación'));assert.ok(value.document.sections.some(s=>s.equations?.some(e=>e.startsWith('x=')&&e.endsWith('=3'))));}finally{globalThis.fetch=previous;}
});
test('content-plan rejects incomplete systems and unsupported request methods',async()=>{
 assert.equal((await call({method:'GET'})).code,405);const r=await call({method:'POST',body:{prompt:'Cramer 2x+y=5'}});assert.notEqual(r.code,200);assert.match(r.value.error,/ecuaciones/);
});
