/** Deterministic EP003 cinematography in +X-forward,+Y-up,+Z-left metres.
 * Camera locations are relative to the authoritative VehicleDynamicsFrame,
 * never independently interpolated physical vehicle trajectories. */
import type {CinemaRequest,Vec3,VehicleDynamicsFrame,TyreFrame} from '../shared/contract.ts';
export type CinemaShot=CinemaRequest['shot']|'low-tracking'|'underbody'|'rear-three-quarter';
export type CameraPose=Readonly<{position:Vec3;target:Vec3;fovDeg:number;nearM:number;farM:number;shot:CinemaShot}>;
export type CinemaCameraInput=Readonly<{tSec:number;shot:CinemaShot;dynamics:VehicleDynamicsFrame;tyre:TyreFrame;progress01?:number;subtleImpactShake?:boolean}>;
const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));
const smooth=(n:number)=>{const x=clamp(n);return x*x*(3-2*x)};
const mix=(a:number,b:number,k:number)=>a+(b-a)*k;
const lerp3=(a:Vec3,b:Vec3,k:number):Vec3=>[mix(a[0],b[0],k),mix(a[1],b[1],k),mix(a[2],b[2],k)];
export function vehicleLocalToWorld(offset:Vec3,frame:Pick<VehicleDynamicsFrame,'positionM'|'yawRad'>):Vec3{
 const c=Math.cos(frame.yawRad),s=Math.sin(frame.yawRad),p=frame.positionM;
 return [p[0]+c*offset[0]+s*offset[2],p[1]+offset[1],p[2]-s*offset[0]+c*offset[2]];
}
export function sampleCinemaCamera(input:CinemaCameraInput):CameraPose{
 const {shot,dynamics:d,tyre,tSec}=input;
 if(!Number.isFinite(tSec)||tSec<0||!Number.isFinite(d.yawRad)||d.positionM.some(x=>!Number.isFinite(x))||!Number.isFinite(tyre.failureProgress)||input.progress01!==undefined&&!Number.isFinite(input.progress01))throw new Error('Camera needs finite absolute-time sampled state');
 const p=smooth(input.progress01??0),q=clamp(input.progress01??0);
 let from:Vec3,at:Vec3,fov:number,near=.06;
 switch(shot){
  case 'tyre-hook': {
   // Front-right readable sidewall, then a fast but fluid reveal in first second.
   const reveal=smooth((q-.39)/.61);
   from=lerp3([1.58,.54,-2.05],[4.65,2.02,-5.05],reveal);
   at=lerp3([1.46,.35,-.88],[.40,.63,-.32],reveal);
   fov=mix(37,43,reveal);near=.025;break;
  }
  case 'front-three-quarter':
   from=lerp3([4.20,1.42,-4.15],[5.05,1.84,-4.75],p);
   at=lerp3([.50,.67,-.22],[.07,.66,-.18],p);fov=mix(40,43,p);break;
  case 'low-tracking':
   from=lerp3([2.45,.32,-4.50],[.60,.43,-4.10],p);at=[.17,.60,-.15];fov=44;break;
  case 'wheel-cutaway':
  case 'underbody':
   // Ground-skimming exterior look past the contact patch; never below road.
   from=lerp3([2.30,.15,-1.38],[1.92,.19,-1.55],p);at=[1.14,.38,-.60];fov=61;near=.015;break;
  case 'overhead-dynamics':
   from=lerp3([1,10.75,-2.55],[-1.20,10.30,-2.45],p);at=[.15,.43,-.19];fov=40;break;
  case 'driver-cockpit':
   // Position in the actual right-hand drive grand-tourer interior volume.
   from=[-.06,1.09,-.456];at=[12,1.05,-.455];fov=73;near=.012;break;
  case 'chase-recovery':
   from=lerp3([-5.80,1.84,-2.12],[-6.55,2.08,-2.20],p);
   at=lerp3([.20,.75,-.1],[.95,.76,-.09],p);fov=mix(44,40,p);break;
  case 'rear-three-quarter':
   from=lerp3([-3.90,1.16,-4.35],[-4.70,1.61,-5.03],p);
   at=[-.14,.67,-.11];fov=42;break;
  case 'safe-stop':
   // NOTE: hero is MOVING; no shoulder available in the stock highway.
   from=lerp3([4.95,1.84,-5.65],[4.20,1.46,-4.65],p);
   at=[.03,.61,-.13];fov=mix(42,38,p);break;
  default: throw new Error('Unknown camera shot: '+shot);
 }
 const shock=input.subtleImpactShake===false?0:
  Math.sin(2*Math.PI*9*(tSec-.75))*.013*clamp(tyre.failureProgress)*Math.exp(-Math.max(0,tSec-.75)*3.4);
 return {shot,position:vehicleLocalToWorld([from[0],Math.max(.11,from[1]+shock),from[2]],d),
  target:vehicleLocalToWorld(at,d),fovDeg:fov,nearM:near,farM:360};
}
export type Cut=Readonly<{shot:CinemaShot;fromSec:number;toSec:number;notes:string}>;
export const OPENING_CUTS:readonly Cut[]=[
 {shot:'tyre-hook',fromSec:0,toSec:1.52,notes:'Tyre macro at event .75s, dolly reveals moving car'},
 {shot:'front-three-quarter',fromSec:1.52,toSec:2.26,notes:'Low front moving hero'},
 {shot:'chase-recovery',fromSec:2.26,toSec:5,notes:'Forward road travel and gradual correction'}
];
export const MONTAGE_CUTS:readonly Cut[]=[
 {shot:'tyre-hook',fromSec:0,toSec:1.20,notes:'Pressure loss and immediate reveal'},
 {shot:'low-tracking',fromSec:1.20,toSec:2.25,notes:'Low tracking on failed side'},
 {shot:'underbody',fromSec:2.25,toSec:3.35,notes:'Under-nose contact patch'},
 {shot:'overhead-dynamics',fromSec:3.35,toSec:4.50,notes:'Actual vehicle heading and lane context'},
 {shot:'driver-cockpit',fromSec:4.50,toSec:5.70,notes:'Interior view'},
 {shot:'chase-recovery',fromSec:5.70,toSec:7.38,notes:'Controlled slowing'},
 {shot:'safe-stop',fromSec:7.38,toSec:8.80,notes:'MOVING hero, no claimed stop until Agent 4 refuge'}
];
export function selectCut(tSec:number,cuts:readonly Cut[]):{cut:Cut;progress01:number}{
 if(!Number.isFinite(tSec)||tSec<0||!cuts.length)throw new Error('Invalid cut selection');
 const cut=cuts.find(c=>tSec>=c.fromSec&&tSec<c.toSec)??cuts[cuts.length-1];
 return {cut,progress01:clamp((tSec-cut.fromSec)/(cut.toSec-cut.fromSec))};
}
