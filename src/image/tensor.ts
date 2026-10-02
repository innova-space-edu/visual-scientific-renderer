export type TensorShape=[number,number]|[number,number,number];

export class FloatTensor{
  readonly data:Float32Array;
  readonly shape:TensorShape;
  readonly strides:number[];
  constructor(shape:TensorShape,data?:Float32Array){
    const size=shape.reduce((a,b)=>a*b,1);
    if(data&&data.length!==size)throw new Error("Tensor data length does not match shape");
    this.shape=shape;this.data=data??new Float32Array(size);
    this.strides=shape.length===2?[shape[1],1]:[shape[1]*shape[2],shape[2],1];
  }
  index(y:number,x:number,c?:number){return this.shape.length===2?y*this.strides[0]!+x:(y*this.strides[0]!+x*this.strides[1]!+(c??0));}
  get(y:number,x:number,c?:number){return this.data[this.index(y,x,c)]??0;}
  set(y:number,x:number,value:number,c?:number){this.data[this.index(y,x,c)]=value;}
  clone(){return new FloatTensor([...this.shape] as TensorShape,new Float32Array(this.data));}
  map(fn:(value:number,index:number)=>number){const out=this.clone();for(let i=0;i<out.data.length;i++)out.data[i]=fn(out.data[i]!,i);return out;}
  static fromUint8RGBA(width:number,height:number,rgba:Uint8ClampedArray){const out=new FloatTensor([height,width,4]);for(let i=0;i<rgba.length;i++)out.data[i]=(rgba[i]??0)/255;return out;}
  toUint8RGBA(){if(this.shape.length!==3||this.shape[2]!==4)throw new Error("Expected HxWx4 tensor");const out=new Uint8ClampedArray(this.data.length);for(let i=0;i<out.length;i++)out[i]=Math.max(0,Math.min(255,Math.round(this.data[i]!*255)));return out;}
}
