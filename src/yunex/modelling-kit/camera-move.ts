import * as T from 'three';
import type {V3} from '../world-kit/geometry.ts';
import {fitModelCamera} from './model-framing.ts';
export type CameraMovePose={position:V3;target:V3;fov?:number};
/** Coordinates are vehicle-local metres; the current model matrix supplies pitch, yaw and translation. */
export type CameraMove={start:CameraMovePose;end:CameraMovePose;easing?:'linear'|'smooth'};
export function validateCameraMove(move:CameraMove){
 if(!move||!['linear','smooth'].includes(move.easing??'linear'))throw Error('Invalid camera move easing');
 for(const pose of [move.start,move.end]){
  if(!pose||![pose.position,pose.target].every(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite))||pose.fov!==undefined&&(!Number.isFinite(pose.fov)||pose.fov<10||pose.fov>120))throw Error('Invalid camera move pose or fov (10..120)');
  if(new T.Vector3(...pose.position).distanceToSquared(new T.Vector3(...pose.target))<1e-8)throw Error('Camera move position must differ from target');
 }
 // A linear path through its target has no defined view direction, including between rendered frames.
 const a=new T.Vector3(...move.start.position).sub(new T.Vector3(...move.start.target));
 const delta=new T.Vector3(...move.end.position).sub(new T.Vector3(...move.end.target)).sub(a);
 const t=delta.lengthSq()?T.MathUtils.clamp(-a.dot(delta)/delta.lengthSq(),0,1):0;
 if(a.addScaledVector(delta,t).lengthSq()<1e-8)throw Error('Camera move must not cross its target');
}
export function sampleCameraMove(move:CameraMove,localFrame:number,shotFrames:number,model:T.Object3D,defaultFov:number){
 let t=shotFrames<=1?0:T.MathUtils.clamp(localFrame/(shotFrames-1),0,1);
 if(move.easing==='smooth')t=t*t*(3-2*t);
 model.updateMatrixWorld(true);
 const transform=(key:'position'|'target')=>new T.Vector3(...move.start[key]).lerp(new T.Vector3(...move.end[key]),t).applyMatrix4(model.matrixWorld).toArray() as V3;
 return {position:transform('position'),target:transform('target'),fov:T.MathUtils.lerp(move.start.fov??defaultFov,move.end.fov??defaultFov,t)};
}
/** Keep a deliberately wider dolly distance, but never crop the visible vehicle in overview shots. */
export function fitCameraMove(model:T.Object3D,camera:{position:V3;target:V3;fov:number},aspect:number){
 const position=new T.Vector3(...camera.position),target=new T.Vector3(...camera.target);
 // fitModelCamera uses world-up; a tiny tilt gives directly overhead moves a defined horizontal axis.
 if(Math.hypot(position.x-target.x,position.z-target.z)<1e-8)position.z+=1e-6;
 const stable={...camera,position:position.toArray() as V3},fitted=fitModelCamera(model,stable,aspect);
 return position.distanceToSquared(target)>=new T.Vector3(...fitted.position).distanceToSquared(target)?stable:fitted;
}
