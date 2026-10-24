/**
 * EP006 Agent 3 — absolute-frame rally cinematography.
 * Only reads Agent 2's pose. Never integrates position or independently simulates motion.
 * Coordinates: +X forward, +Y up, +Z left; SI metres/radians, 0-based frame @ 30fps.
 */
export type Vec3=[number,number,number];
export type Ep006Phase='approach'|'takeoff'|'airborne'|'touchdown'|'rebound'|'driving';
export type Ep006Wheel={compressionM:number;steerRad:number;spinRad:number;contact:boolean;surfaceHeightM:number};
export type Ep006MotionPose={
 frame:number;timeSeconds:number;phase:Ep006Phase;jumpId:'J1'|'J2'|null;
 positionM:Vec3;rotationRad:Vec3;velocityMps:Vec3;
 wheels:Record<'front-left'|'front-right'|'rear-left'|'rear-right',Ep006Wheel>;
 impact01:number;dust01:number;gravel01:number;event?:string|null;
};
export type CameraShotId=
 'jump-hook'|'flight-profile'|'first-touchdown'|'landing-follow'|
 'underbody-glide'|'wheel-response'|'spring-recovery'|'engineering-track'|
 'gravel-side'|'exit-chase'|'final-takeoff'|'final-apex'|'final-touchdown'|'drive-away';
export type CameraView={shotId:CameraShotId;frame:number;position:Vec3;target:Vec3;
 fov:number;aspect:number;near:number;far:number;cameraHeightM:number;vehicleFrameWidth01:number;
 clearanceM:number;estimatedSafe:boolean;warnings:string[]};
type Shot={
 id:CameraShotId;start:number;end:number;fov:number;
 position0:Vec3;position1:Vec3;target0:Vec3;target1:Vec3;
 /** Camera floor clearance above the authoritative terrain, where provided. */
 minClearanceM:number;
};
/** End-exclusive ranges: the complete provisional 810-frame visual plan. */
export const EP006_CAMERA_SHOTS:readonly Shot[]=[
 {id:'jump-hook',start:0,end:36,fov:44,position0:[7.5,1.05,-6.1],position1:[6.9,1.2,-7.0],target0:[.30,.72,0],target1:[-.18,.95,0],minClearanceM:.48},
 {id:'flight-profile',start:36,end:74,fov:44,position0:[1.0,1.85,-11.1],position1:[-2.0,1.55,-11.8],target0:[.6,.80,0],target1:[.10,.60,0],minClearanceM:.40},
 {id:'first-touchdown',start:74,end:103,fov:49,position0:[6.5,.45,-6.5],position1:[5.5,.65,-6.6],target0:[.8,.48,0],target1:[.2,.56,0],minClearanceM:.32},
 {id:'landing-follow',start:103,end:192,fov:45,position0:[-8.3,2.3,5.0],position1:[-7.6,1.4,6.0],target0:[.6,.9,0],target1:[1.1,.7,0],minClearanceM:.45},
 {id:'underbody-glide',start:192,end:277,fov:51,position0:[3.7,.12,-3.8],position1:[-3.5,.22,-4.4],target0:[.6,.36,0],target1:[-.8,.48,0],minClearanceM:.23},
 {id:'wheel-response',start:277,end:375,fov:44,position0:[2.8,.38,-3.4],position1:[1.6,.56,-4.3],target0:[1.25,.38,-.6],target1:[1.25,.54,-.6],minClearanceM:.24},
 {id:'spring-recovery',start:375,end:455,fov:47,position0:[2.7,1.4,4.0],position1:[-.3,1.0,4.5],target0:[1.0,.55,.5],target1:[.4,.70,.3],minClearanceM:.32},
 {id:'engineering-track',start:455,end:555,fov:44,position0:[-6.8,2.5,-6.8],position1:[-8.3,1.9,-5.9],target0:[.0,.82,0],target1:[1.0,.76,0],minClearanceM:.42},
 {id:'gravel-side',start:555,end:610,fov:44,position0:[2.4,1.25,-11],position1:[-2.3,1.10,-11.0],target0:[.7,.74,0],target1:[0,.82,0],minClearanceM:.40},
 {id:'exit-chase',start:610,end:675,fov:47,position0:[-8.4,1.1,5.3],position1:[-9.1,1.6,4.2],target0:[2.2,.75,0],target1:[2.9,.85,0],minClearanceM:.50},
 {id:'final-takeoff',start:675,end:725,fov:46,position0:[7.2,.95,6.5],position1:[4.5,1.5,8.4],target0:[.35,.68,0],target1:[0,.8,0],minClearanceM:.42},
 {id:'final-apex',start:725,end:752,fov:43,position0:[-.8,1.8,-12.0],position1:[-3.2,2.2,-10.9],target0:[.2,.87,0],target1:[0,.8,0],minClearanceM:.38},
 {id:'final-touchdown',start:752,end:784,fov:49,position0:[5.9,.65,-6.5],position1:[4.7,.42,-7.2],target0:[.6,.45,0],target1:[0,.55,0],minClearanceM:.29},
 {id:'drive-away',start:784,end:810,fov:43,position0:[-8.2,1.35,4.2],position1:[-11.0,2.1,5.6],target0:[1.4,.7,0],target1:[3.5,.75,0],minClearanceM:.40}
] as const;

const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const ease=(x:number)=>{const u=clamp(x,0,1);return u*u*(3-2*u);};
const mix=(a:number,b:number,u:number)=>a+(b-a)*u;
const vectorMix=(a:Vec3,b:Vec3,u:number):Vec3=>[mix(a[0],b[0],u),mix(a[1],b[1],u),mix(a[2],b[2],u)];
const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a:Vec3,k:number):Vec3=>[a[0]*k,a[1]*k,a[2]*k];
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normalize=(a:Vec3):Vec3=>mul(a,1/Math.max(1e-8,Math.sqrt(dot(a,a))));
const rotateYaw=(v:Vec3,yaw:number):Vec3=>{
 const c=Math.cos(yaw),s=Math.sin(yaw);
 return [v[0]*c+v[2]*s,v[1],-v[0]*s+v[2]*c];
};
const WORLD_UP:Vec3=[0,1,0];
const CAR_CORNERS:Vec3[]=[];for(const x of [-2.22,2.22])for(const y of [-.20,1.80])for(const z of [-1.07,1.07])CAR_CORNERS.push([x,y,z]);
export const cameraShotAt=(frame:number):Shot=>{
 if(!Number.isInteger(frame)||frame<0||frame>=810)throw Error('EP006 camera frame must be an integer in [0,810)');
 return EP006_CAMERA_SHOTS.find(s=>frame>=s.start&&frame<s.end)!;
};
/**
 * terrainHeightM MUST be Agent 4's matching actual world height if available.
 * Fallback derives local wheel contact markers (rough estimate, warning emitted).
 * The sampler never mutates poses or derives a second flight path.
 */
export function sampleEp006Camera(frame:number,pose:Ep006MotionPose,options:{
 aspect?:number;terrainHeightM?:(x:number,z:number)=>number;
 vehicleBoundsM?:{length:number;width:number;height:number};
}={}):CameraView{
 const shot=cameraShotAt(frame),aspect=options.aspect??1080/1920;
 if(!Number.isFinite(aspect)||aspect<=0||aspect>3)throw Error('Camera aspect must be finite and positive');
 if(pose.frame!==frame)throw Error('Camera frame and canonical motion frame differ');
 if(![...pose.positionM,...pose.rotationRad,...pose.velocityMps].every(Number.isFinite))throw Error('Nonfinite canonical vehicle pose');
 const u=ease((frame-shot.start)/Math.max(1,shot.end-shot.start-1));
 const localPos=vectorMix(shot.position0,shot.position1,u),localTarget=vectorMix(shot.target0,shot.target1,u);
 const yaw=pose.rotationRad[1],carCenter=pose.positionM;
 let position=add(carCenter,rotateYaw(localPos,yaw));
 const target=add(carCenter,rotateYaw(localTarget,yaw));
 const wheels=Object.values(pose.wheels??{});
 const wheelGround=wheels.length?Math.max(...wheels.map(w=>w.surfaceHeightM)):0;
 const terrain=options.terrainHeightM?.(position[0],position[2]);
 const warnings:string[]=[];
 if(options.terrainHeightM===undefined)warnings.push('Terrain clearance estimated from wheel markers; recheck with Agent 4 surface.');
 if(!Number.isFinite(terrain??wheelGround))throw Error('Nonfinite terrain clearance input');
 const surface=terrain??wheelGround;
 position[1]=Math.max(position[1],surface+shot.minClearanceM);
 // Fit an expanded shell silhouette to a phone-safe 86% horizontal / 79% vertical frame.
 // We only push the camera farther along its authored direction; no wobbly per-frame repositioning.
 const back=normalize(sub(position,target));
 const right=normalize(cross(WORLD_UP,back)),up=normalize(cross(back,right));
 const tanV=Math.tan(shot.fov*Math.PI/360),tanH=tanV*aspect;
 const b=options.vehicleBoundsM??{length:4.25,width:1.94,height:1.52};
 const scale:[number,number,number]=[b.length/4.25,b.height/1.52,b.width/1.94];
 let requiredDistance=0;
 for(const corner of CAR_CORNERS){
  const p=rotateYaw([corner[0]*scale[0],corner[1]*scale[1],corner[2]*scale[2]],yaw);
  const d=sub(add(carCenter,p),target);
  const depth=dot(d,back);
  requiredDistance=Math.max(requiredDistance,depth+Math.abs(dot(d,right))/(tanH*.86),depth+Math.abs(dot(d,up))/(tanV*.79));
 }
 const actualDistance=Math.sqrt(dot(sub(position,target),sub(position,target)));
 if(actualDistance<requiredDistance)position=add(target,mul(back,requiredDistance+.08));
 // Extending a low tracking ray must never bury the camera in the road.
 position[1]=Math.max(position[1],surface+shot.minClearanceM);
 // Fit a useful subject without artificially tightening extreme wide shots.
 const projectedWidth=clamp(b.length/(2*Math.max(requiredDistance,actualDistance)*tanH),0,1);
 const clearance=position[1]-surface;
 if(clearance<shot.minClearanceM-.0001)warnings.push('Camera below requested clearance');
 if(projectedWidth<.25)warnings.push('Hero may appear too small; visually verify native frame');
 if(projectedWidth>.85)warnings.push('Hero near phone-safe crop limit; visually verify corners');
 if(['first-touchdown','final-touchdown'].includes(shot.id)&&pose.phase==='airborne'&&frame>shot.start+14)
  warnings.push('Canonical touchdown later than target cut: coordinate Agent 2 event frames');
 const finite=[...position,...target,shot.fov,clearance,projectedWidth].every(Number.isFinite);
 if(!finite)throw Error('Nonfinite EP006 camera output');
 return {shotId:shot.id,frame,position,target,fov:shot.fov,aspect,near:.025,far:500,cameraHeightM:position[1],vehicleFrameWidth01:projectedWidth,clearanceM:clearance,estimatedSafe:clearance>=shot.minClearanceM&&projectedWidth<.86,warnings};
}
