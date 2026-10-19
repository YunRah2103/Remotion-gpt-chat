/**
 * Authoritative EP003 cinematic Three.js body/axle application.
 * Agent 2's renderer contract: Euler X=pitch, Y=yaw, Z=roll, order YXZ.
 * Apply wheel hubs AFTER body rotation, from absolute VehicleDynamicsFrame
 * hubs in the same rebased shot coordinates. Do not add compression twice.
 */
import * as T from 'three';
import type {VehicleDynamicsFrame,WheelId} from '../shared/contract.ts';
const wheelName=(o:T.Group):WheelId=>
 ((o.position.x>0?'front':'rear')+'-'+(o.position.z<0?'right':'left')) as WheelId;
export function alignCinematicBodyAndHubs(model:T.Group,d:VehicleDynamicsFrame):void{
 if(![...d.positionM,d.pitchRad,d.yawRad,d.rollRad].every(Number.isFinite))
  throw new Error('Authoritative camera rig requires finite body pose');
 model.position.set(...d.positionM);
 model.rotation.set(d.pitchRad,d.yawRad,d.rollRad,'YXZ');
 model.updateMatrixWorld(true);
 model.traverse(o=>{
  if(!(o instanceof T.Group)||!o.children.some(v=>v.userData.wheel))return;
  const state=d.wheels[wheelName(o)];
  if(!state)return;
  o.position.copy(model.worldToLocal(new T.Vector3(...state.hubWorldM)));
  o.rotation.y=state.steeringRad;
  const rotating=o.children.find(v=>v.userData.wheel);
  if(rotating)rotating.rotation.z=state.spinRad;
 });
 model.updateMatrixWorld(true);
}
