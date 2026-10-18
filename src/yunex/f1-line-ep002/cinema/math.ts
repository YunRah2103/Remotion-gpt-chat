import type {V3} from '../contract.ts';

export const add=(a:V3,b:V3):V3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const mul=(a:V3,s:number):V3=>[a[0]*s,a[1]*s,a[2]*s];
export const mix=(a:V3,b:V3,t:number):V3=>add(mul(a,1-t),mul(b,t));
export const magnitude=(a:V3)=>Math.hypot(...a);
export const subtract=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const clamp=(x:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,x));
/** Model-local +X is forward; +Z is the driver's left. */
export function localOffset(origin:V3,yaw:number,forward:number,height:number,left:number):V3{
 const c=Math.cos(yaw),s=Math.sin(yaw);
 return [origin[0]+c*forward+s*left,origin[1]+height,origin[2]-s*forward+c*left];
}
export function angleDelta(a:number,b:number){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
export function assertFiniteVector(v:V3,name:string){
 if(v.some(x=>!Number.isFinite(x)))throw new Error(name+' must be finite');
}
