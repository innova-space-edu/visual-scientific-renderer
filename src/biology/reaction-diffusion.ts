export type GrayScottParams={du:number;dv:number;feed:number;kill:number;dt:number};
export const GRAY_SCOTT_PRESETS={
  mitosis:{du:.16,dv:.08,feed:.035,kill:.065,dt:1},
  coral:{du:.16,dv:.08,feed:.0545,kill:.062,dt:1},
  spots:{du:.16,dv:.08,feed:.03,kill:.062,dt:1},
  stripes:{du:.16,dv:.08,feed:.022,kill:.051,dt:1}
} satisfies Record<string,GrayScottParams>;
export class GrayScottSimulation{
  u:Float32Array;v:Float32Array;private nextU:Float32Array;private nextV:Float32Array;
  constructor(public width=128,public height=128,public params:GrayScottParams=GRAY_SCOTT_PRESETS.coral){
    const n=width*height;this.u=new Float32Array(n).fill(1);this.v=new Float32Array(n);this.nextU=new Float32Array(n);this.nextV=new Float32Array(n);
    const cx=width>>1,cy=height>>1;for(let y=cy-8;y<=cy+8;y++)for(let x=cx-8;x<=cx+8;x++){const i=((y+height)%height)*width+((x+width)%width);this.u[i]=.5;this.v[i]=.25+Math.random()*.25}
  }
  private lap(arr:Float32Array,x:number,y:number){const w=this.width,h=this.height,at=(xx:number,yy:number)=>arr[((yy+h)%h)*w+((xx+w)%w)]!;return-1*at(x,y)+.2*(at(x-1,y)+at(x+1,y)+at(x,y-1)+at(x,y+1))+.05*(at(x-1,y-1)+at(x+1,y-1)+at(x-1,y+1)+at(x+1,y+1))}
  step(iterations=1){const p=this.params;for(let it=0;it<iterations;it++){for(let y=0;y<this.height;y++)for(let x=0;x<this.width;x++){const i=y*this.width+x,u=this.u[i]!,v=this.v[i]!,uvv=u*v*v;this.nextU[i]=Math.max(0,Math.min(1,u+(p.du*this.lap(this.u,x,y)-uvv+p.feed*(1-u))*p.dt));this.nextV[i]=Math.max(0,Math.min(1,v+(p.dv*this.lap(this.v,x,y)+uvv-(p.feed+p.kill)*v)*p.dt))}[this.u,this.nextU]=[this.nextU,this.u];[this.v,this.nextV]=[this.nextV,this.v]}return this}
  textureRGBA(){const out=new Uint8ClampedArray(this.width*this.height*4);for(let i=0;i<this.u.length;i++){const x=Math.max(0,Math.min(1,this.u[i]!-this.v[i]!)),o=i*4;out[o]=Math.round(30+225*x);out[o+1]=Math.round(40+160*x);out[o+2]=Math.round(80+175*(1-x));out[o+3]=255}return out}
}
