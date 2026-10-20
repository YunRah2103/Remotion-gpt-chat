/** EP004 Agent 4 cinematic camera layout: 100% deterministic frame-seekable chase
 * poses. All offsets are in metres in vehicle local (+X forward, +Z left).
 */
import type {Vec3,VehicleMotionState} from '../shared/contract.ts';
export type CameraRig = Readonly<{eye:Vec3;target:Vec3;fov:number}>;
const smooth=(t:number)=>{const s=Math.max(0,Math.min(1,t));return s*s*(3-2*s);};
export function cameraRigForLook(
 motion:VehicleMotionState,mode:'trackside-pass'|'race-follow',shotSec:number,
):CameraRig {
 const e=smooth(shotSec/(mode==='trackside-pass'?5:7));
 const chase=mode==='race-follow';
 const forward=chase?-7.1+.7*e:4.4-6.4*e;
 const left=chase?-3.4+.5*e:-9.8+.5*e;
 const up=chase?2.12-.14*e:1.85+.15*e;
 const yaw=motion.yawRad,c=Math.cos(yaw),s=Math.sin(yaw);
 const [x,y,z]=motion.worldPosition;
 const at=(f:number,h:number,l:number):Vec3=>[x+c*f+s*l,y+h,z-s*f+c*l];
 return {eye:at(forward,up,left),target:at(chase?.12:.05,.54,0),fov:chase?48:55};
}
