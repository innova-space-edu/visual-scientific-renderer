export type VectorSampler=(x:number,y:number,z:number)=>[number,number,number];
export type StreamlineOptions={step?:number;maxSteps?:number;minSpeed?:number;bounds?:{min:[number,number,number];max:[number,number,number]}};
function inside(p:[number,number,number],b:NonNullable<StreamlineOptions["bounds"]>){return p[0]>=b.min[0]&&p[1]>=b.min[1]&&p[2]>=b.min[2]&&p[0]<=b.max[0]&&p[1]<=b.max[1]&&p[2]<=b.max[2]}
export function traceStreamline(seed:[number,number,number],sample:VectorSampler,options:StreamlineOptions={}){
  const step=options.step??.02,maxSteps=options.maxSteps??800,minSpeed=options.minSpeed??1e-6,bounds=options.bounds??{min:[-1,-1,-1],max:[1,1,1]};const points:Array<[number,number,number]>=[seed];let p:[number,number,number]=[...seed];
  for(let i=0;i<maxSteps;i++){const k1=sample(...p),speed=Math.hypot(...k1);if(speed<minSpeed)break;const mid:[number,number,number]=[p[0]+k1[0]*step*.5,p[1]+k1[1]*step*.5,p[2]+k1[2]*step*.5],k2=sample(...mid);p=[p[0]+k2[0]*step,p[1]+k2[1]*step,p[2]+k2[2]*step];if(!inside(p,bounds))break;points.push(p)}
  return points;
}
