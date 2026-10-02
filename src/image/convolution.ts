import {FloatTensor} from "./tensor.js";
export type Kernel={width:number;height:number;data:Float32Array;scale?:number;bias?:number};

export const Kernels={
  sobelX:{width:3,height:3,data:new Float32Array([-1,0,1,-2,0,2,-1,0,1])},
  sobelY:{width:3,height:3,data:new Float32Array([-1,-2,-1,0,0,0,1,2,1])},
  sharpen:{width:3,height:3,data:new Float32Array([0,-1,0,-1,5,-1,0,-1,0])},
  laplacian:{width:3,height:3,data:new Float32Array([0,1,0,1,-4,1,0,1,0])}
} satisfies Record<string,Kernel>;

export function gaussianKernel(radius=3,sigma=Math.max(.5,radius/2)):Kernel{
  const size=radius*2+1,data=new Float32Array(size*size);let sum=0;
  for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){const v=Math.exp(-(x*x+y*y)/(2*sigma*sigma));data[(y+radius)*size+x+radius]=v;sum+=v;}
  for(let i=0;i<data.length;i++)data[i]/=sum;return{width:size,height:size,data};
}

export function convolve2D(input:FloatTensor,kernel:Kernel,channel=0){
  const [h,w]=input.shape,channels=input.shape.length===3?input.shape[2]:1,out=new FloatTensor([...input.shape] as any),ox=Math.floor(kernel.width/2),oy=Math.floor(kernel.height/2),scale=kernel.scale??1,bias=kernel.bias??0;
  if(input.shape.length===3)out.data.set(input.data);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let sum=0;for(let ky=0;ky<kernel.height;ky++)for(let kx=0;kx<kernel.width;kx++){const sx=Math.max(0,Math.min(w-1,x+kx-ox)),sy=Math.max(0,Math.min(h-1,y+ky-oy));sum+=input.get(sy,sx,channel)*kernel.data[ky*kernel.width+kx]!;}out.set(y,x,sum*scale+bias,channels>1?channel:undefined);}
  return out;
}

export function sobelMagnitude(input:FloatTensor,channel=0){
  const gx=convolve2D(input,Kernels.sobelX,channel),gy=convolve2D(input,Kernels.sobelY,channel),out=gx.clone();
  for(let i=0;i<out.data.length;i++)out.data[i]=Math.hypot(gx.data[i]!,gy.data[i]!);
  return out;
}

export function unsharpMask(input:FloatTensor,amount=1,radius=2,sigma=1){
  const blurred=convolve2D(input,gaussianKernel(radius,sigma),0),out=input.clone();
  for(let i=0;i<out.data.length;i++)out.data[i]=input.data[i]!+amount*(input.data[i]!-blurred.data[i]!);
  return out;
}
