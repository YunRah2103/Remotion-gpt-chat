/** Agent 3 — deterministic camera choreography for EP004.
 * All coordinates metres, +X forward, +Y up, +Z left. NEVER computes a car
 * trajectory: the caller supplies Agent 2's authoritative VehicleMotionState.
 * tSec is the SHOT-LOCAL clock, not global motion time; this allows VO retiming.
 */
import type {CameraPose, ShotId, Vec3, VehicleMotionState} from '../shared/contract.ts';

export type CameraShotPreset = Readonly<{
  id: ShotId;
  suggestedDurationSec: number;
  cameraHandleInSec: number;
  cameraHandleOutSec: number;
  intention: string;
  cutawaySafe: boolean;
}>;
export const CAMERA_SHOTS: Readonly<Record<ShotId, CameraShotPreset>> = {
  'spark-hook': {id:'spark-hook',suggestedDurationSec:5,cameraHandleInSec:0.35,cameraHandleOutSec:0.5,intention:'Immediately legible ultra-low side-front spark pass; no orbit',cutawaySafe:false},
  'rear-mystery': {id:'rear-mystery',suggestedDurationSec:2.8,cameraHandleInSec:0.4,cameraHandleOutSec:0.5,intention:'Low rear pursuit tracks the whole moving car',cutawaySafe:false},
  'underfloor-reveal': {id:'underfloor-reveal',suggestedDurationSec:3,cameraHandleInSec:0.5,cameraHandleOutSec:0.5,intention:'Continuous rear-to-skid tunnel glide, no geographic reversal',cutawaySafe:true},
  'aero-load': {id:'aero-load',suggestedDurationSec:3,cameraHandleInSec:0.4,cameraHandleOutSec:0.4,intention:'Read suspension/ride-height silhouette from stable lateral view',cutawaySafe:false},
  'contact-macro': {id:'contact-macro',suggestedDurationSec:2.2,cameraHandleInSec:0.35,cameraHandleOutSec:0.4,intention:'Forward metal skid meets moving tarmac, no arbitrary emitter',cutawaySafe:true},
  'racing-payoff': {id:'racing-payoff',suggestedDurationSec:3,cameraHandleInSec:0.5,cameraHandleOutSec:0.5,intention:'Full-speed wide-to-medium exit with purposeful linear pursuit',cutawaySafe:false},
};
type Key = readonly [progress:number,position:Vec3,target:Vec3,fovDeg:number];
const KEYS: Readonly<Record<ShotId,readonly Key[]>> = {
  'spark-hook': [
    [0,[5.9,.53,10.8],[.20,.46,0],57],
    [.48,[4.8,.49,11.1],[-.12,.52,0],57],
    [1,[3.65,.54,11.5],[-.5,.57,0],57],
  ],
  'rear-mystery': [
    [0,[-8.8,.97,1.35],[-.75,.69,0],49],
    [.55,[-7.15,.64,1.02],[-1.0,.49,0],54],
    [1,[-7.6,.48,.8],[-1.25,.30,0],59],
  ],
  'underfloor-reveal': [
    [0,[-7.6,.48,.8],[-1.25,.30,0],59],
    [.25,[-4.05,.20,.30],[-.85,.16,0],57],
    [.55,[-2.25,.165,.12],[.2,.16,0],53],
    [.8,[-.65,.155,.12],[1.05,.14,0],50],
    [1,[.25,.155,.12],[1.2,.13,0],47],
  ],
  'aero-load': [
    [0,[.20,1.20,12.0],[0,.51,0],50],
    [.50,[.17,1.10,11.9],[0,.46,0],50],
    [1,[.13,1.10,11.8],[0,.45,0],51],
  ],
  'contact-macro': [
    [0,[.25,.155,.12],[1.2,.13,0],47],
    [.50,[.38,.16,.48],[1.18,.12,0],43],
    [1,[.50,.16,.92],[1.2,.11,0],42],
  ],
  'racing-payoff': [
    [0,[5.8,2.18,11.5],[.25,.63,0],52],
    [.50,[3.2,1.42,12.0],[.14,.55,0],54],
    [1,[1.25,1.02,11.8],[-.23,.51,0],54],
  ],
};
const clamp=(n:number,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=(t:number)=>{const x=clamp(t);return x*x*(3-2*x);};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
function lerp3(a:Vec3,b:Vec3,t:number):Vec3{return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];}
function keyAt(shot:ShotId,p:number):{position:Vec3,target:Vec3,fovDeg:number}{
  const keys=KEYS[shot];
  for(let i=1;i<keys.length;i++){
    if(p<=keys[i][0]||i===keys.length-1){
      const a=keys[i-1],b=keys[i],u=smooth((p-a[0])/(b[0]-a[0]));
      return {position:lerp3(a[1],b[1],u),target:lerp3(a[2],b[2],u),fovDeg:lerp(a[3],b[3],u)};
    }
  }
  const last=keys[keys.length-1];
  return {position:last[1],target:last[2],fovDeg:last[3]};
}
/** Applies world yaw only: camera never shakes with wheel oscillation,
 * while its target tracks authoritative animated vehicle root.
 */
export function cameraLocalToWorld(local:Vec3,motion:VehicleMotionState):Vec3{
  const [x,y,z]=local,c=Math.cos(motion.yawRad),s=Math.sin(motion.yawRad);
  const p=motion.worldPosition;
  return [p[0]+x*c+z*s,p[1]+y,p[2]-x*s+z*c];
}
function requireMotion(motion:VehicleMotionState,tSec:number){
  if(!Number.isFinite(tSec))throw new Error('shot-local time must be finite');
  const a=[...motion.worldPosition,motion.yawRad,motion.speedMps,motion.routeDistanceM];
  if(a.some(v=>!Number.isFinite(v)))throw new Error('camera requires finite authoritative vehicle state');
}
export function sampleShotCamera(shot:ShotId,tSec:number,motion:VehicleMotionState):CameraPose{
  const preset=CAMERA_SHOTS[shot];
  if(!preset)throw new Error('Unknown EP004 camera shot: '+shot);
  requireMotion(motion,tSec);
  const p=clamp(tSec/preset.suggestedDurationSec),k=keyAt(shot,p);
  const positionWorld=cameraLocalToWorld(k.position,motion);
  const targetWorld=cameraLocalToWorld(k.target,motion);
  const d=Math.hypot(positionWorld[0]-targetWorld[0],positionWorld[1]-targetWorld[1],positionWorld[2]-targetWorld[2]);
  return {positionWorld,targetWorld,fovDeg:k.fovDeg,rollRad:0,focusDistanceM:d};
}
/** Editor-facing arbitrary trim/retime without changing authoritative motion.
 * Handles are in camera time and do not change the global episode clock.
 */
export function sampleRetimedShotCamera(shot:ShotId,shotLocalSec:number,shotDurationSec:number,motion:VehicleMotionState):CameraPose{
  if(!(shotDurationSec>0)&&Number.isFinite(shotDurationSec))throw new Error('duration must be positive');
  if(!Number.isFinite(shotDurationSec))throw new Error('duration must be finite');
  const normalized=clamp(shotLocalSec/shotDurationSec);
  return sampleShotCamera(shot,normalized*CAMERA_SHOTS[shot].suggestedDurationSec,motion);
}
export function blendCameraPoses(a:CameraPose,b:CameraPose,alpha:number):CameraPose{
  const t=smooth(alpha),positionWorld=lerp3(a.positionWorld,b.positionWorld,t);
  const targetWorld=lerp3(a.targetWorld,b.targetWorld,t);
  return {positionWorld,targetWorld,fovDeg:lerp(a.fovDeg,b.fovDeg,t),rollRad:0,focusDistanceM:Math.hypot(...positionWorld.map((v,i)=>v-targetWorld[i]))};
}
/** Approximate native 9:16 view width at target distance; used in tests.
 * This is camera vertical FOV, not a horizontal FOV.
 */
export function visibleWidthAtTarget(pose:CameraPose,aspect=1080/1920):number{
  const distance=Math.hypot(...pose.positionWorld.map((v,i)=>v-pose.targetWorld[i]));
  return 2*distance*Math.tan(pose.fovDeg*Math.PI/360)*aspect;
}
