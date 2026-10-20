import {sampleRoute} from '../../../../src/yunex/world-kit/environments.ts';
import {EP004} from '../shared/contract.ts';
import type {Vec3, VehicleMotionState, WheelId} from '../shared/contract.ts';
import {sampleTrackSurface} from '../shared/track.ts';

/** Analytic, time-seekable illustrative chassis motion; NOT CFD or racing telemetry.
 * Vehicle root matches the factory +X-forward and yaw-about-+Y conventions.
 * A positive pitch raises the nose; positive roll lowers the left skid.
 * Root Y is surface height at the centreline PLUS negative chassis heave.
 */
export type DynamicsParams = Readonly<{
  startDistanceM?: number;
  speedMps?: number;
  aeroLoad01?: number;
  rideHeightOffsetM?: number;
}>;

const finite = (n:number,name:string) => {
  if (!Number.isFinite(n)) throw new Error(name + ' must be finite');
  return n;
};
const clamp = (v:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,v));
export function sampleDynamics(tSec:number,params:DynamicsParams={}):VehicleMotionState {
  finite(tSec,'tSec');
  if(tSec<0) throw new RangeError('tSec must be nonnegative');
  const speedMps=finite(params.speedMps??EP004.previewSpeedMps,'speedMps');
  if(speedMps<0||speedMps>115)throw new RangeError('speedMps must be in [0,115]');
  const startDistanceM=finite(params.startDistanceM??EP004.previewDistanceStartM,'startDistanceM');
  const aeroLoad01=clamp(finite(params.aeroLoad01??1,'aeroLoad01'),0,1);
  const offset=finite(params.rideHeightOffsetM??0,'rideHeightOffsetM');
  if(Math.abs(offset)>.20) throw new RangeError('ride height offset beyond illustrative limits');
  const routeDistanceM=startDistanceM+speedMps*tSec;
  const route=sampleRoute('track',routeDistanceM);
  const surface=sampleTrackSurface(routeDistanceM);
  // Air load scales approximately with v² and saturates; this is a VISUAL proxy.
  const downforceProxy01=clamp(aeroLoad01*Math.pow(speedMps/EP004.previewSpeedMps,2),0,1);
  // Road-shape-driven compression: no trigger frames or particle-onset timestamps.
  const bump01=clamp(surface.heightM/.019,0,1);
  const compressionM=.032*bump01;
  const aeroSquatM=.042*downforceProxy01;
  const heaveM=clamp(offset-aeroSquatM-compressionM,-.085,.12);
  // Following a rising/falling grade tilts the chassis, with a small dive from compression.
  const pitchRad=clamp(Math.atan(surface.slopeMPerM)*.52-.003*bump01,-.038,.038);
  // Curvature introduces a small, bounded side load. Avoid yaw discontinuities at +/-PI.
  const lookahead=sampleRoute('track',routeDistanceM+.25);
  const angleDelta=Math.atan2(Math.sin(lookahead.yaw-route.yaw),Math.cos(lookahead.yaw-route.yaw));
  const rollRad=clamp(-angleDelta*downforceProxy01*.65,-.021,.021);
  const wheelCompressionM=clamp(.005*downforceProxy01+.017*bump01,0,.026);
  const wheelCompression:Readonly<Record<WheelId,number>>={
    'front-left':clamp(wheelCompressionM+pitchRad*.09-rollRad*.08,0,.032),
    'front-right':clamp(wheelCompressionM+pitchRad*.09+rollRad*.08,0,.032),
    'rear-left':clamp(wheelCompressionM-pitchRad*.09-rollRad*.08,0,.032),
    'rear-right':clamp(wheelCompressionM-pitchRad*.09+rollRad*.08,0,.032),
  };
  return {
    tSec,routeDistanceM,speedMps,
    worldPosition:[route.position[0],surface.heightM+heaveM,route.position[2]] as Vec3,
    yawRad:route.yaw,pitchRad,rollRad,
    wheelRotationRad:-speedMps*tSec/EP004.wheelRadiusM,
    heaveM,wheelCompression,downforceProxy01,
  };
}

/** R_y(yaw) * R_z(pitch) * R_x(roll); coordinates +X forward, +Z left. */
export function localToWorld(local:Vec3,motion:VehicleMotionState):Vec3 {
  const [x,y,z]=local;
  const cr=Math.cos(motion.rollRad),sr=Math.sin(motion.rollRad);
  const yr=y*cr-z*sr,zr=y*sr+z*cr;
  const cp=Math.cos(motion.pitchRad),sp=Math.sin(motion.pitchRad);
  const xp=x*cp-yr*sp,yp=x*sp+yr*cp;
  const cy=Math.cos(motion.yawRad),sy=Math.sin(motion.yawRad);
  return [motion.worldPosition[0]+xp*cy+zr*sy,
          motion.worldPosition[1]+yp,
          motion.worldPosition[2]-xp*sy+zr*cy];
}
/** Reverse R_x(-roll) * R_z(-pitch) * R_y(-yaw), for the 3-argument particle API. */
export function worldToLocal(point:Vec3,motion:VehicleMotionState):Vec3 {
  const x=point[0]-motion.worldPosition[0],y=point[1]-motion.worldPosition[1],z=point[2]-motion.worldPosition[2];
  const cy=Math.cos(motion.yawRad),sy=Math.sin(motion.yawRad);
  const xa=x*cy-z*sy,za=x*sy+z*cy;
  const cp=Math.cos(motion.pitchRad),sp=Math.sin(motion.pitchRad);
  const xb=xa*cp+y*sp,yb=-xa*sp+y*cp;
  const cr=Math.cos(motion.rollRad),sr=Math.sin(motion.rollRad);
  return [xb,yb*cr+za*sr,-yb*sr+za*cr];
}
