/**
 * POLISH02. Fixed-length four-bar kinematics: the upper and lower A arms remain rigid,
 * and the knuckle joint-to-joint distance remains constant for all 600 frames.
 * Wheel angle is found by inverting the driven terrain/tyre contact constraint.
 * Sprung chassis follows a deterministic discrete damped oscillator, no sine-wave bounce.
 * Not a manufacturer-certified multibody tyre simulation.
 */
import {CORNERS,Corner,FRAMES,FPS,SPEED,RADIUS,HALF_AXLE,clamp,zAt,wheelZ,wheelSide,triangleHeightSample,heightAt} from './terrain';
export type Vec=[number,number,number];
const DT=1/FPS;
const PIVOT_X=.43,UPPER_Y=-.11,LOWER_Y=-.52;
export const UPPER_ARM=.75,LOWER_ARM=.86,KNUCKLE=.52;
export const ANGLE_MIN=-1.19,ANGLE_MAX=.28;
export const RIDE=1.17;
export const upperChassis=(s:number,z:number):Vec=>[s*PIVOT_X,UPPER_Y,z];
export const lowerChassis=(s:number,z:number):Vec=>[s*PIVOT_X,LOWER_Y,z];
export type Linkage={upper:Vec;lower:Vec;hub:Vec;theta:number;damperTop:Vec;damperBottom:Vec;
  springTop:Vec;springBottom:Vec};
export type CornerPose={link:Linkage;ground:number;contactError:number;wheelCentreWorld:Vec;
  angularSpeed:number;spin:number;travel:number};
export type Pose={frame:number;z:number;y:number;roll:number;pitch:number;
  wheels:Record<Corner,CornerPose>};
export function solveFourBar(corner:Corner,angle:number):Linkage{
 const s=wheelSide(corner),z=wheelZ(corner);
 const lowerx=PIVOT_X+LOWER_ARM*Math.cos(angle);
 const lowery=LOWER_Y+LOWER_ARM*Math.sin(angle);
 const dx=lowerx-PIVOT_X,dy=lowery-UPPER_Y,d=Math.hypot(dx,dy);
 const a=(UPPER_ARM**2-KNUCKLE**2+d*d)/(2*d);
 const h=Math.sqrt(Math.max(0,UPPER_ARM**2-a*a));
 // The outer-side intersection is the mechanical steering-knuckle upper joint.
 const topX=PIVOT_X+a*dx/d-h*dy/d;
 const topY=UPPER_Y+a*dy/d+h*dx/d;
 const upper:[number,number,number]=[s*topX,topY,z];
 const lower:[number,number,number]=[s*lowerx,lowery,z];
 const hub:Vec=[s*(topX+lowerx)/2,(topY+lowery)/2,z];
 const damperTop:Vec=[s*.59,.29,z+.10];
 const damperBottom:Vec=[s*(PIVOT_X+.67*(lowerx-PIVOT_X)),LOWER_Y+.67*(lowery-LOWER_Y),z+.11];
 return {upper,lower,hub,theta:angle,damperTop,damperBottom,
   springTop:[s*.57,.235,z+.13],springBottom:[damperBottom[0],damperBottom[1]+.035,z+.13]};
}
function chassisTargets(frame:number){
 const z=zAt(frame),zl=z-HALF_AXLE,zr=z+HALF_AXLE;
 const FL=heightAt(-1.20,zl),FR=heightAt(1.20,zl),RL=heightAt(-1.20,zr),RR=heightAt(1.20,zr);
 const avg=(FL+FR+RL+RR)/4;
 const left=(FL+RL)/2,right=(FR+RR)/2;
 const front=(FL+FR)/2,rear=(RL+RR)/2;
 return {y:RIDE+avg*.74,roll:clamp((right-left)/2.4*.70,-.22,.22),
  pitch:clamp((front-rear)/(HALF_AXLE*2)*.58,-.17,.17)};
}
type State={y:number;roll:number;pitch:number;vy:number;vr:number;vp:number};
const stateFrames:State[]=[];
let state={...chassisTargets(0),vy:0,vr:0,vp:0};
for(let frame=0;frame<FRAMES;frame++){
 const target=chassisTargets(frame);
 for(const [name,vel,stiff,damp] of [
  ['y','vy',35,10],['roll','vr',32,9.5],['pitch','vp',29,9]
 ] as const){
  const accel=(target[name]-state[name])*stiff-state[vel]*damp;
  state[vel]+=accel*DT;
  state[name]+=state[vel]*DT;
 }
 stateFrames.push({...state});
}
export function localToWorld(local:Vec,frame:number,body:Pick<State,'y'|'roll'|'pitch'>):Vec{
 const [x,y,z]=local;
 const cr=Math.cos(body.roll),sr=Math.sin(body.roll);
 const cp=Math.cos(body.pitch),sp=Math.sin(body.pitch);
 const xx=cr*x-sr*y,yy=sr*x+cr*y;
 return [xx,body.y+cp*yy-sp*z,zAt(frame)+sp*yy+cp*z];
}
const poseCache=new Map<number,Pose>();
export function poseAt(frame:number):Pose{
 const f=clamp(Math.round(frame),0,FRAMES-1);
 const cached=poseCache.get(f);if(cached)return cached;
 const body=stateFrames[f];
 const wheels={} as Record<Corner,CornerPose>;
 for(const corner of CORNERS){
  const contact=(theta:number)=>{
   const link=solveFourBar(corner,theta),p=localToWorld(link.hub,f,body);
   const ground=triangleHeightSample(p[0],p[2]);
   return {error:p[1]-RADIUS-ground,ground,link,p};
  };
  // sample/solve a single DOF in a fixed bracket. This is repeatable at any frame.
  let a=ANGLE_MIN,b=ANGLE_MAX;
  let ca=contact(a),cb=contact(b);
  let chosen;
  if(ca.error>0){chosen=ca;}
  else if(cb.error<0){chosen=cb;}
  else {
   for(let k=0;k<21;k++){
    const m=(a+b)/2;
    const c=contact(m);
    if(c.error<0)a=m; else b=m;
   }
   chosen=contact((a+b)/2);
  }
  const {link,p,ground,error}=chosen;
  const previousTheta=f>0?poseAt(f-1).wheels[corner].link.theta:link.theta;
  wheels[corner]={link,ground,contactError:error,wheelCentreWorld:p,
   spin:f*SPEED/FPS/RADIUS,
   angularSpeed:(link.theta-previousTheta)*FPS,
   travel:link.hub[1]-solveFourBar(corner,-.54).hub[1]};
 }
 const result:Pose={frame:f,z:zAt(f),y:body.y,roll:body.roll,pitch:body.pitch,wheels};
 poseCache.set(f,result);return result;
}
export function distance(a:Vec,b:Vec){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
