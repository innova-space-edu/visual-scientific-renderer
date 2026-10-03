import test from 'node:test';
import assert from 'node:assert/strict';
import {expression} from '../dist/studio/expression.js';
import {draftFromPrompt,validateDocument,EXAMPLES} from '../dist/studio/content.js';
import {composeSVG} from '../dist/studio/composer.js';
import {geometryFromPrompt,surfaceGeometry} from '../dist/studio/geometry.js';
test('math grammar respects precedence and rejects code, properties and malformed input',()=>{
 assert.equal(expression('-2^2')(),-4);assert.equal(expression('2^3^2')(),512);assert.equal(expression('sin(pi/2)+x*y')(2,3),7);
 for(const value of ['alert(1)','Math.sin(x)','x;fetch(1)','sin(x','x+','2x'])assert.throws(()=>expression(value));
});
test('surface computes normals and rejects singularities instead of emitting NaNs',()=>{
 const g=surfaceGeometry('sin(x)*cos(y)');assert.equal(g.attributes.position.count,65*65);assert.equal(g.index.count,64*64*6);assert.ok([...g.attributes.normal.array].every(Number.isFinite));g.dispose();assert.throws(()=>surfaceGeometry('1/(x-x)'));
});
test('examples compose real vector formulas, escaped text, and all content',()=>{
 for(const example of Object.values(EXAMPLES)){const doc=draftFromPrompt(example.prompt);doc.title='<script>bad</script>';const out=composeSVG(doc);assert.ok(out.svg.includes('&lt;script&gt;'));assert.ok(!out.svg.includes('<script>'));assert.ok(out.height>=1000);for(const s of doc.sections)assert.ok(out.svg.includes(s.title));}
 assert.ok(composeSVG(draftFromPrompt('cono')).svg.includes('data-mml-node'));
});
test('long documents grow without discarding sections and imported active assets are rejected',()=>{
 const doc=draftFromPrompt('tema libre');doc.sections=Array.from({length:12},(_,i)=>({title:'Apartado '+i,text:'Texto extenso. '.repeat(90)}));const out=composeSVG(doc);assert.ok(out.width>out.height);assert.equal((out.svg.match(/data-section=/g)||[]).length,12);assert.ok(out.svg.includes('Apartado 11'));
 assert.throws(()=>validateDocument({...doc,photo:'javascript:alert(1)'}));assert.throws(()=>validateDocument({...doc,sources:[{title:'x',url:'javascript:alert(1)'}]}));assert.throws(()=>validateDocument({...doc,points:[{x:0,y:Infinity}]}));
});
test('prompts support combined primitives and custom surfaces, unknown requests are explicit',()=>{
 assert.equal(geometryFromPrompt('esfera y cono').length,2);assert.equal(geometryFromPrompt('superficie z=sin(x)*cos(y)')[0].formula,'sin(x)*cos(y)');assert.throws(()=>geometryFromPrompt('fotografía de una ciudad'));assert.throws(()=>geometryFromPrompt('esfera radio 999'));
});
test('Python blob worker receives an absolute runtime URL in every request',async()=>{
 const {PyodideWorkerClient}=await import('../dist/python/pyodide-worker.js');const previousWorker=globalThis.Worker,previousLocation=globalThis.location;let posted;
 globalThis.location={href:'https://studio.example/app/'};globalThis.Worker=class{postMessage(value){posted=value;this.onmessage({data:{id:value.id,ok:true,result:2}})}terminate(){}};
 try{const client=new PyodideWorkerClient();assert.equal(await client.run('1+1'),2);assert.equal(posted.indexURL,'https://studio.example/vendor/pyodide/');client.terminate();}finally{globalThis.Worker=previousWorker;globalThis.location=previousLocation}
});

test('VisualDocument v2 validates semantic design and composer uses palette/background',()=>{
 const doc=draftFromPrompt('homotecia para 1 medio');assert.equal(doc.version,2);assert.ok(doc.design);doc.design.background='grid';doc.design.columns=3;doc.design.palette.primary='#112233';const checked=validateDocument(doc);const out=composeSVG(checked);assert.ok(out.svg.includes('#112233'));assert.ok(out.svg.includes('bg-grid'));assert.throws(()=>validateDocument({...doc,design:{...doc.design,palette:{...doc.design.palette,accent:'red'}}}));
});
