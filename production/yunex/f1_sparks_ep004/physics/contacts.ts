import {sampleRoute} from '../../../../src/yunex/world-kit/environments.ts';
import type {SkidDescriptor,SkidContact,Vec3,VehicleMotionState} from '../shared/contract.ts';
import {sampleTrackSurface} from '../shared/track.ts';
import {localToWorld} from './dynamics.ts';

const clamp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
const normalized=(v:Vec3):Vec3=>{const l=Math.hypot(...v);return [v[0]/l,v[1]/l,v[2]/l];};

/** Project skid's XZ contact point onto the adjacent centreline, for the
 * SAME longitudinal bump profile that Agent 4 must mesh. At racing-line
 * lateral offsets we assume constant profile height across road width.
 * One tangent-projection refinement avoids assuming straight corners.
 */
export function projectSkidDistance(motion:VehicleMotionState,world:Vec3):number {
  const dx=world[0]-motion.worldPosition[0],dz=world[2]-motion.worldPosition[2];
  let distance=motion.routeDistanceM+dx*Math.cos(motion.yawRad)-dz*Math.sin(motion.yawRad);
  const p=sampleRoute('track',distance);
  distance+=(world[0]-p.position[0])*Math.cos(p.yaw)-(world[2]-p.position[2])*Math.sin(p.yaw);
  return distance;
}

export function sampleSkidContacts(
  tSec:number,motion:VehicleMotionState,skids:readonly SkidDescriptor[],
):SkidContact[] {
  if(!Number.isFinite(tSec)||Math.abs(tSec-motion.tSec)>1e-6)throw new Error('contact time and motion time differ');
  const ids=new Set<string>();
  return skids.map(skid=>{
    if(!skid.metal)throw new Error('spark emitter must be a metal skid');
    if(ids.has(skid.id))throw new Error('duplicate metal skid ID: '+skid.id);
    ids.add(skid.id);
    if(skid.localBottomPoint.length!==3||skid.localBottomPoint.some(v=>!Number.isFinite(v)))throw new Error('bad skid coordinate');
    const bottom=localToWorld(skid.localBottomPoint,motion);
    const d=projectSkidDistance(motion,bottom);
    const road=sampleTrackSurface(d);
    const tangent=sampleRoute('track',d);
    const f:Vec3=[Math.cos(tangent.yaw),0,-Math.sin(tangent.yaw)];
    const normalWorld=normalized([-f[0]*road.slopeMPerM,1,-f[2]*road.slopeMPerM]);
    const signedGapM=bottom[1]-road.heightM;
    const relativeSpeedMps=motion.speedMps; // approximately v_tan; road fixed, no wheel slip model
    const active=signedGapM<=0&&relativeSpeedMps>.5;
    const contactIntensity01=active?clamp((-signedGapM+.0005)/.015,0,1):0;
    return {skidId:skid.id,pointWorld:[bottom[0],road.heightM,bottom[2]],normalWorld,signedGapM,relativeSpeedMps,contactIntensity01,active};
  });
}
