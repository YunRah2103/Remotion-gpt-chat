import * as T from 'three';
import type {CinematicState} from './rig.ts';
import type {RoutePose} from '../world-kit/environments.ts';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import type {V3} from '../world-kit/geometry.ts';
import {fitInspectionCamera} from './framing.ts';
export type DrivingAction='cruise'|'acceleration'|'braking'|'cornering';
export type CameraPreset='tracking'|'chase'|'wheel'|'interior'|'onboard'|'overhead'|'reveal';
/** Distance is an analytic integral of speed. No per-frame accumulation or random state. */
export function drivingState(action:DrivingAction,frame:number,fps:number):CinematicState & {speed:number}{
 if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0)throw new Error('Finite frame and positive fps required');
 const t=Math.max(0,frame/fps),base={frame:Math.max(0,frame),fps};
 switch(action){
  case 'cruise':return {...base,speed:12,distance:t*12};
  case 'acceleration':{const a=3.5,u=Math.min(t,5),speed=3+a*u;return {...base,speed,distance:3*u+.5*a*u*u+Math.max(0,t-5)*speed,compression:.008};}
  case 'braking':{const u=T.MathUtils.clamp(t-1,0,3),speed=t<1?18:18-6*u;return {...base,speed,distance:Math.min(t,1)*18+18*u-3*u*u,braking:t>=1&&t<4?Math.sin(u/3*Math.PI)*.65+.25:0,heat:t>=1?.75*Math.exp(-Math.max(0,t-4)*.4):0,compression:t>=1&&t<4?.035:0};}
  case 'cornering':return {...base,speed:12,distance:t*12,steer:.13*Math.sin(t*.8),compression:.022};
  default:throw new Error(`Unknown driving action: ${action}`);
 }
}
/** Positions are local to the car, then transformed by its actual route tangent. */
export function drivingCamera(name:CameraPreset,pose:RoutePose,s:VehicleSpec,aspect:number,time:number,options:{side?:-1|1}={}):{position:V3;target:V3;fov:number}{
 if(!(aspect>0)||![aspect,time,pose.yaw,...pose.position].every(Number.isFinite))throw new Error('Finite pose/time and positive aspect required');
 if(options.side!==undefined&&options.side!==-1&&options.side!==1)throw new Error('Camera side must be -1 or 1');
 const l=s.length,h=s.height,w=s.width;let p:V3,target:V3=[0,h*.48,0],fov=42,overview=false;
 switch(name){
  case 'tracking':p=[l*1.10,h*1.50,(options.side??-1)*w*1.2];overview=true;break;
  case 'chase':p=[-l*1.3,h*1.25,w*1.3];overview=true;break;
  case 'wheel':p=[s.wheelbase*.65,s.radius*1.55,(options.side??-1)*w*.94];target=[s.wheelbase/2,s.radius,(options.side??-1)*w*.45];fov=46;p=fitInspectionCamera(p,target,[s.radius*2.3,s.radius*2.3,s.radius*1.5],aspect,fov);break;
  case 'interior':p=[l*.10+.08*Math.sin(time*.45),h*.86+.015*Math.sin(time*.35),-w*.85+.035*Math.cos(time*.45)];target=[0,h*.65,0];fov=48;break;
  case 'onboard':p=[-l*.10,h*.88,0];target=[l*1.5,h*.40,0];fov=65;break;
  case 'overhead':{const a=.24+.08*Math.sin(time*.6);p=[Math.cos(a)*l*.22,l*2,Math.sin(a)*l*.22];target=[0,0,0];overview=true;fov=46;break;}
  case 'reveal':{const a=.38+Math.sin(time*.28)*.45;p=[Math.cos(a)*l*1.35,h*1.15,Math.sin(a)*l*1.35];overview=true;break;}
  default:throw new Error(`Unknown camera preset: ${name}`);
 }
 if(overview)p=fitInspectionCamera(p,target,[l+.7,h+.5,w+.6],aspect,fov);
 const transform=(v:V3)=>new T.Vector3(...v).applyAxisAngle(new T.Vector3(0,1,0),pose.yaw).add(new T.Vector3(...pose.position)).toArray() as V3;
 return {position:transform(p),target:transform(target),fov};
}
