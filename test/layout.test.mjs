import test from 'node:test';
import assert from 'node:assert/strict';
import {draftFromPrompt,validateDocument,DESIGN_PRESETS} from '../dist/studio/content.js';
import {composeSVG} from '../dist/studio/composer.js';
import {planLayout} from '../dist/studio/layout.js';
import {measureFormula} from '../dist/studio/typography.js';
import {solveCramer} from '../dist/studio/cramer.js';
test('Cramer uses requested coefficients and verifies solutions, including singular matrices',()=>{
 assert.deepEqual(solveCramer([[2,1],[1,-1]],[5,1]).solution,[2,1]);
 const a=[[1,1,1],[2,-1,1],[1,2,-1]],b=[6,3,2],r=solveCramer(a,b);for(let i=0;i<3;i++)assert.ok(Math.abs(a[i].reduce((sum,v,j)=>sum+v*r.solution[j],0)-b[i])<1e-10);
 assert.equal(solveCramer([[1,2],[2,4]],[3,6]).solution,null);
 const doc=draftFromPrompt('Cramer ejemplo resuelto 3x+2y=13; x-y=1');assert.ok(doc.sections.some(s=>s.equations?.includes('D=\\begin{vmatrix}3&2\\\\1&-1\\end{vmatrix}')));assert.ok(doc.sections.some(s=>s.equations?.some(e=>e.startsWith('x=')&&e.endsWith('=3'))));
 assert.throws(()=>draftFromPrompt('Cramer 2x+y=5'));for(const invalid of ['Cramer 2x+y+3=5; x-y=1','Cramer 3+2x+y=5; x-y=1','Cramer 2x+y=5+x; x-y=1','Cramer 2x+y=5e2; x-y=1'])assert.throws(()=>draftFromPrompt(invalid));
 const singular=draftFromPrompt('Cramer x+2y=3; 2x+4y=6');assert.ok(singular.sections.some(s=>s.title==='Determinante nulo'));assert.ok(!singular.sections.some(s=>s.title==='Respuesta final'));
});
test('all templates and densities keep card bounds inside canvas with zero overlaps',()=>{
 for(const preset of Object.values(DESIGN_PRESETS))for(const format of ['landscape','portrait','square','brochure'])for(const type of ['infographic','poster','worksheet','guide','brochure','technical-plan','activity']){
 const doc=draftFromPrompt('Método de Cramer');doc.design=structuredClone(preset);doc.format=format;doc.documentType=type;
 const width=format==='portrait'?1080:format==='square'?1200:1600;const layout=planLayout(doc,width,250);
 assert.equal(layout.cards.length,doc.sections.length);
 for(const c of layout.cards){assert.ok(c.x>=0&&c.x+c.width<=width+.01);assert.ok(c.y+c.height<=layout.bottom);}
 for(let i=0;i<layout.cards.length;i++)for(let j=i+1;j<layout.cards.length;j++){const a=layout.cards[i],b=layout.cards[j];assert.ok(a.x+a.width<=b.x+.01||b.x+b.width<=a.x+.01||a.y+a.height<=b.y+.01||b.y+b.height<=a.y+.01);}
 }
});
test('multiline matrix LaTeX has measured height, table rows wrap, and rich projects roundtrip',()=>{
 const m=measureFormula('\\begin{cases}2x+y=5\\\\x-y=1\\end{cases}',600);assert.ok(m.height>55);assert.ok(m.svg.includes('data-mml-node="mtable"'));assert.throws(()=>measureFormula('\\unknowncommand{1}',600));
 const doc=draftFromPrompt('tema');doc.sections=[{title:'Comparación',text:'',kind:'table',table:{headers:['Variable','Interpretación'],rows:[['A','Una explicación extensa '.repeat(8)],['B','Período']]},diagram:'wave',equations:['T=2\\pi/|B|'],region:'overview',span:2,icon:'bulb',tone:'blue'}];
 assert.deepEqual(validateDocument(JSON.parse(JSON.stringify(doc))),doc);const out=composeSVG(doc);assert.ok(out.svg.includes('Interpretación'));assert.ok(out.svg.includes('Período'));assert.ok(out.svg.includes('data-section="0"'));
 for(const patch of [{table:{headers:['A','B'],rows:[['oops']]}},{image:'javascript:alert(1)'},{span:9},{equations:['x'.repeat(1201)]},{diagram:'arbitrary'}])assert.throws(()=>validateDocument({...doc,sections:[{...doc.sections[0],...patch}]}));
 assert.throws(()=>validateDocument({...doc,photo:'data:image/png;base64,x\" onload=\"alert(1)'}));
 assert.throws(()=>validateDocument({...doc,design:{...doc.design,palette:{primary:'#112233'}}}));
});
