import type {ContentSection} from './content.js';
export const determinant=(a:number[][]):number=>a.length===2?a[0][0]*a[1][1]-a[0][1]*a[1][0]:a[0][0]*(a[1][1]*a[2][2]-a[1][2]*a[2][1])-a[0][1]*(a[1][0]*a[2][2]-a[1][2]*a[2][0])+a[0][2]*(a[1][0]*a[2][1]-a[1][1]*a[2][0]);
const n=(x:number)=>String(Number(x.toFixed(8))).replace('.', '{,}');
const factor=(x:number)=>x<0?`(${n(x)})`:n(x);
const matrix=(a:number[][])=>`\\begin{vmatrix}${a.map(r=>r.map(n).join('&')).join('\\\\')}\\end{vmatrix}`;
const expansion=(a:number[][]):string=>a.length===2?`${factor(a[0][0])}\\cdot${factor(a[1][1])}-${factor(a[0][1])}\\cdot${factor(a[1][0])}`:`\\begin{aligned}&${factor(a[0][0])}(${factor(a[1][1])}\\cdot${factor(a[2][2])}-${factor(a[1][2])}\\cdot${factor(a[2][1])})\\\\&-${factor(a[0][1])}(${factor(a[1][0])}\\cdot${factor(a[2][2])}-${factor(a[1][2])}\\cdot${factor(a[2][0])})\\\\&+${factor(a[0][2])}(${factor(a[1][0])}\\cdot${factor(a[2][1])}-${factor(a[1][1])}\\cdot${factor(a[2][0])})\\end{aligned}`;
export function solveCramer(a:number[][],b:number[]){
 const size=a.length;if(![2,3].includes(size)||b.length!==size||a.some(r=>r.length!==size)||[...a.flat(),...b].some(v=>!Number.isFinite(v)||Math.abs(v)>1e6))throw new Error('Usa un sistema finito de 2×2 o 3×3');
 const d=determinant(a),scale=Math.max(1,...a.flat().map(Math.abs));
 if(Math.abs(d)<=Number.EPSILON*scale**size*32)return{d,matrices:[],ds:[],solution:null};
 const matrices=b.map((_,j)=>a.map((row,i)=>row.map((v,k)=>k===j?b[i]:v))),ds=matrices.map(determinant);
 return{d,matrices,ds,solution:ds.map(v=>v/d)};
}
export function cramerSections(prompt:string):ContentSection[]{
 const normalized=prompt.replace(/[−–]/g,'-').replace(/(\d),(\d)/g,'$1.$2');
 const matches=[...normalized.matchAll(/([+-]?(?:(?:\d+(?:\.\d+)?\s*\*?\s*)?[xyz](?:\s*[+-]\s*(?:\d+(?:\.\d+)?\s*\*?\s*)?[xyz])*))\s*=\s*([+-]?\d+(?:\.\d+)?)/gi)];
 if((normalized.match(/=/g)||[]).length!==matches.length)throw new Error('Escribe ecuaciones lineales completas, por ejemplo 2x+y=5; x-y=1.');
 for(const m of matches){const before=normalized.slice(0,m.index).trimEnd(),after=normalized.slice(m.index!+m[0].length);if(/[0-9xyz]\s*[+\-]$/.test(before)||/^[+\-]/.test(m[1])&&/[0-9xyz]$/.test(before)||/^\s*[+\-*/]\s*[0-9xyz]/i.test(after)||/^[0-9a-z]/i.test(after)||/^\.(?!\s|$)/.test(after))throw new Error('Usa coeficientes a la izquierda y un número a la derecha de cada ecuación.');}
 const size=/3\s*[x×]\s*3|tres inc[oó]gnitas/.test(normalized)||matches.some(m=>/z/i.test(m[1]))?3:2;
 if(matches.length&&matches.length!==size)throw new Error(`Incluye las ${size} ecuaciones completas del sistema.`);
 const variables=['x','y','z'].slice(0,size);
 let a=size===2?[[2,1],[1,-1]]:[[1,1,1],[2,-1,1],[1,2,-1]],b=size===2?[5,1]:[6,3,2];
 if(matches.length){a=matches.map(m=>{const row=variables.map(()=>0),lhs=m[1].replace(/\s|\*/g,'');for(const term of lhs.matchAll(/([+-]?)(\d+(?:\.\d+)?)?([xyz])/gi)){const j=variables.indexOf(term[3].toLowerCase());if(j<0)throw new Error('Variable fuera del sistema');row[j]+=(term[1]==='-'?-1:1)*Number(term[2]||1);}return row});b=matches.map(m=>Number(m[2]));}
 const result=solveCramer(a,b),equation=(row:number[],rhs:number)=>row.map((v,i)=>v===0?'':`${v<0?'-':i>0?'+':''}${Math.abs(v)===1?'':n(Math.abs(v))}${variables[i]}`).join('')+'='+n(rhs);
 const overview:ContentSection[]=[
 {title:'Idea general',text:'Resuelve sistemas con igual número de ecuaciones e incógnitas mediante determinantes. El determinante principal debe ser distinto de cero.',kind:'key-idea',icon:'bulb',region:'overview'},
 {title:'Sistema general',text:'Ordena los coeficientes de cada incógnita en columnas y los términos independientes a la derecha.',formula:size===2?'\\begin{cases}a_1x+b_1y=c_1\\\\a_2x+b_2y=c_2\\end{cases}':'A\\mathbf{x}=\\mathbf{b}',kind:'formula',region:'overview'},
 {title:'Determinantes y regla',text:'A contiene los coeficientes. Para cada incógnita reemplaza su columna por los términos independientes; conserva las otras columnas.',equations:['D=\\det(A)',...variables.map(v=>`${v}=\\frac{D_${v}}{D}`)],kind:'formula',region:'overview'},
 {title:'Condición de aplicación',text:'Si D = 0, Cramer no proporciona una solución única. El sistema puede ser incompatible o tener infinitas soluciones; requiere otro análisis.',kind:'warning',region:'overview',icon:'warning'}
 ];
 const worked:ContentSection[]=[{title:matches.length?'Sistema solicitado':'Ejemplo resuelto',text:'',formula:`\\begin{cases}${a.map((r,i)=>equation(r,b[i])).join('\\\\')}\\end{cases}`,kind:'key-idea',region:'worked-example'},
 {title:'Determinante principal',text:'',tone:'pink',equations:[`D=${matrix(a)}`,`D=${expansion(a)}`,`D=${n(result.d)}`],kind:'formula',region:'worked-example'}];
 if(!result.solution)return [...overview,...worked,{title:'Determinante nulo',text:'D = 0. No se divide por cero ni se inventa una solución. Resuelve por eliminación para determinar compatibilidad.',kind:'warning',region:'worked-example'}];
 variables.forEach((v,j)=>worked.push({title:`Determinante de ${v}`,text:'',tone:j===0?'blue':j===1?'green':'purple',equations:[`D_${v}=${matrix(result.matrices[j])}`,`D_${v}=${expansion(result.matrices[j])}`,`D_${v}=${n(result.ds[j])}`],kind:'formula',region:'worked-example'}));
 worked.push({title:'Aplicar las fórmulas',text:'',equations:variables.map((v,j)=>`${v}=\\frac{D_${v}}{D}=\\frac{${n(result.ds[j])}}{${n(result.d)}}${Number.isInteger(result.solution![j])?'=':'\\approx'}${n(result.solution![j])}`),kind:'steps',region:'worked-example'},
 {title:'Respuesta final',text:'',equations:[variables.map((v,j)=>`${v}=\\frac{${n(result.ds[j])}}{${n(result.d)}}${Number.isInteger(result.solution![j])?'=':'\\approx'}${n(result.solution![j])}`).join(',\\quad ')],kind:'key-idea',region:'worked-example',icon:'check'},
 {title:'Comprobación',text:'',equations:a.map((r,i)=>`${r.map((v,j)=>`${j&&v>=0?'+':''}${n(v)}\\cdot(\\frac{${n(result.ds[j])}}{${n(result.d)}})`).join('')}=${n(b[i])}`),kind:'comparison',region:'worked-example',icon:'check'});
 return [...overview,...worked];
}
