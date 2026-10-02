export type Complex={re:number;im:number};
export function fft1D(input:Complex[]):Complex[]{
  const n=input.length;if(n===0||(n&(n-1))!==0)throw new Error("FFT length must be a power of two");
  const out=input.map(v=>({...v}));
  for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j)[out[i],out[j]]=[out[j]!,out[i]!];}
  for(let len=2;len<=n;len<<=1){const ang=-2*Math.PI/len,wlen={re:Math.cos(ang),im:Math.sin(ang)};for(let i=0;i<n;i+=len){let w={re:1,im:0};for(let j=0;j<len/2;j++){const u=out[i+j]!,v=mul(out[i+j+len/2]!,w);out[i+j]={re:u.re+v.re,im:u.im+v.im};out[i+j+len/2]={re:u.re-v.re,im:u.im-v.im};w=mul(w,wlen);}}}
  return out;
}
export function ifft1D(input:Complex[]){const conj=input.map(v=>({re:v.re,im:-v.im})),f=fft1D(conj);return f.map(v=>({re:v.re/input.length,im:-v.im/input.length}));}
function mul(a:Complex,b:Complex):Complex{return{re:a.re*b.re-a.im*b.im,im:a.re*b.im+a.im*b.re};}
