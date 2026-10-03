export type DistributionSpec={type:"uniform";min:number;max:number}|{type:"normal";mean:number;std:number}|{type:"lognormal";mu:number;sigma:number}; export type MonteCarloVariable={name:string;distribution:DistributionSpec}; export type MonteCarloSummary={samples:number;mean:number;std:number;min:number;max:number;q05:number;q50:number;q95:number;seed:number};
function rngFactory(seed:number){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}} function normal(rng:()=>number){const u=Math.max(Number.EPSILON,rng()),v=Math.max(Number.EPSILON,rng());return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)} function sample(d:DistributionSpec,rng:()=>number){if(d.type==="uniform")return d.min+(d.max-d.min)*rng();if(d.type==="normal")return d.mean+d.std*normal(rng);return Math.exp(d.mu+d.sigma*normal(rng))} function q(values:number[],p:number){const s=[...values].sort((a,b)=>a-b),pos=(s.length-1)*p,lo=Math.floor(pos),hi=Math.ceil(pos);return lo===hi?s[lo]!:s[lo]!+(s[hi]!-s[lo]!)*(pos-lo)}
export class MonteCarloEngine{
  constructor(public readonly seed=1){}
  run(options:{variables:MonteCarloVariable[];samples:number;model:(input:Record<string,number>,index:number)=>number}){
    if(!Number.isSafeInteger(options.samples)||options.samples<1)throw new Error("samples must be a positive integer");
    const rng=rngFactory(this.seed),outputs:number[]=[];
    let mean=0,m2=0,min=Infinity,max=-Infinity;
    for(let i=0;i<options.samples;i++){
      const input:Record<string,number>={};for(const v of options.variables)input[v.name]=sample(v.distribution,rng);
      const value=options.model(input,i);if(!Number.isFinite(value))throw new Error("Non-finite Monte Carlo output at sample "+i);
      outputs.push(value);const delta=value-mean;mean+=delta/(i+1);m2+=delta*(value-mean);min=Math.min(min,value);max=Math.max(max,value);
    }
    const sorted=[...outputs].sort((a,b)=>a-b);
    const quantile=(p:number)=>{const pos=(sorted.length-1)*p,lo=Math.floor(pos),hi=Math.ceil(pos);return sorted[lo]!+(sorted[hi]!-sorted[lo]!)*(pos-lo)};
    const summary:MonteCarloSummary={samples:outputs.length,mean,std:Math.sqrt(m2/Math.max(1,outputs.length-1)),min,max,q05:quantile(.05),q50:quantile(.5),q95:quantile(.95),seed:this.seed};
    return{outputs,summary};
  }
}
