import {sampleRoute} from '../../../../../src/yunex/world-kit/index.ts';
import {EP004} from '../../shared/contract.ts';
import {sampleTrackSurface} from '../../shared/track.ts';
import type {VehicleMotionState, WheelId} from '../../shared/contract.ts';

/** Temporary, deterministic moving PREVIEW fixture. It is NOT Agent 2's
 * contact physics or an authoritative lap. Replace with sampleDynamics().
 */
export function sampleAgent1Fixture(tSec: number): VehicleMotionState {
 const distance=EP004.previewDistanceStartM+EP004.previewSpeedMps*tSec;
 const pose=sampleRoute('track',distance);
 const wave=Math.sin(tSec*Math.PI*1.65);
 const heave=-.014-.010*Math.sin(tSec*4.2);
 const compression= Math.max(0,-heave)*.62;
 const wheelCompression:Readonly<Record<WheelId,number>>={
   'front-left':compression+.004*Math.max(0,wave),
   'front-right':compression+.003*Math.max(0,-wave),
   'rear-left':compression*.85+.004*Math.max(0,wave),
   'rear-right':compression*.85+.003*Math.max(0,-wave),
 };
 return {
  tSec,routeDistanceM:distance,speedMps:EP004.previewSpeedMps,
  worldPosition:[pose.position[0],sampleTrackSurface(distance).heightM+heave,pose.position[2]],
  yawRad:pose.yaw,pitchRad:.003*Math.sin(tSec*2.1),rollRad:.005*Math.sin(tSec*1.32),
  wheelRotationRad:-distance/EP004.wheelRadiusM,heaveM:heave,
  wheelCompression, downforceProxy01:.72,
 };
}
