/** Bounded mathematical grammar. Never executes JavaScript or accesses properties. */
export function expression(source:string):(x:number,y?:number,t?:number)=>number {
  if(source.length>300)throw new Error('Fórmula demasiado larga');
  const tokens=source.match(/(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?|[a-z]+|[()+*/^,\-]/gi)??[];
  if(tokens.join('').toLowerCase()!==source.replace(/\s/g,'').toLowerCase())throw new Error('Símbolo no permitido');
  let i=0,depth=0;
  type Fn=(v:Record<string,number>)=>number;
  const functions:Record<string,(a:number)=>number>={sin:Math.sin,cos:Math.cos,tan:Math.tan,sqrt:Math.sqrt,abs:Math.abs,exp:Math.exp,log:Math.log};
  function atom():Fn{
    if(++depth>32)throw new Error('Fórmula demasiado anidada');
    const token=tokens[i++]?.toLowerCase();let f:Fn;
    if(token==='('){f=sum();if(tokens[i++]!==')')throw new Error('Falta cerrar paréntesis')}
    else if(token&&functions[token]){if(tokens[i++]!=='(')throw new Error('Usa paréntesis en las funciones');const arg=sum();if(tokens[i++]!==')')throw new Error('Falta cerrar función');f=v=>functions[token](arg(v))}
    else if(token&&/^(x|y|t|pi|e)$/.test(token))f=v=>v[token];
    else if(token&&Number.isFinite(Number(token))){const n=Number(token);f=()=>n}
    else throw new Error('Variable o función desconocida: '+token);
    depth--;return f;
  }
  function power():Fn{const a=atom();if(tokens[i]==='^'){i++;const b=unary();return v=>a(v)**b(v)}return a}
  function unary():Fn{if(tokens[i]==='-'||tokens[i]==='+'){const sign=tokens[i++];const a=unary();return v=>sign==='-'?-a(v):a(v)}return power()}
  function product():Fn{let a=unary();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],left=a,b=unary();a=v=>op==='*'?left(v)*b(v):left(v)/b(v)}return a}
  function sum():Fn{let a=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],left=a,b=product();a=v=>op==='+'?left(v)+b(v):left(v)-b(v)}return a}
  const f=sum();if(i!==tokens.length)throw new Error('Fórmula incompleta');return(x,y=0,t=0)=>f({x,y,t,pi:Math.PI,e:Math.E});
}
