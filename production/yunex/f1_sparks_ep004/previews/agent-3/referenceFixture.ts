/** Only Agent 3's PREVIEW REFERENCE FIXTURE.
 * NOT the authoritative Agent 1 car/Agent 2 dynamics/spark system.
 * Follows the world-kit route; no independent path or invented steering.
 * Events witness illustrative signed-gap <= 0, never a free glow overlay.
 */
import {sampleRoute,routeLength} from '../../../../../src/yunex/world-kit/environments.ts';
import {EP004} from '../../shared/contract.ts';
import type {SkidContact,SparkParticle,VehicleMotionState,Vec3} from '../../shared/contract.ts';
import {sampleTrackSurface} from '../../shared/track.ts';
export const FIXTURE_LABEL='PROVISIONAL CAMERA FIXTURE — hero/contact from Agents 1–2 pending';
const speed=EP004.previewSpeedMps;
export function sampleReferenceMotion(sec:number):VehicleMotionState{
  if(!Number.isFinite(sec))throw new Error('fixture time must be finite');
  const t=Math.max(0,sec),distance=EP004.previewDistanceStartM+t*speed;
  const route=sampleRoute('track',distance);
  // Temporary suspension pose for framing, not a physics integration.
  const heaveM=-.055;
  return {
    tSec:t,routeDistanceM:distance,speedMps:speed,
    worldPosition:[route.position[0],route.position[1]+heaveM,route.position[2]],
    yawRad:route.yaw,pitchRad:0,rollRad:0,heaveM,
    wheelRotationRad:-distance/EP004.wheelRadiusM,
    wheelCompressionM:{'front-left':.055,'front-right':.055,'rear-left':.055,'rear-right':.055},
    downforceProxy01:.6,
  };
}
/** Forward-skid *preview marker* approximates longitudinal route offset;
 * Agent 2 will replace this in any final cinematography integration.
 */
export function referenceForwardContact(motion:VehicleMotionState):SkidContact{
  const forwardSkidX=1.05;
  const surface=sampleTrackSurface(motion.routeDistanceM+forwardSkidX);
  const skidBottom=motion.worldPosition[1]+EP004.initialSkidBottomClearanceM;
  const gap=skidBottom-surface.heightM;
  const c=Math.cos(motion.yawRad),s=Math.sin(motion.yawRad);
  const pointWorld:Vec3=[motion.worldPosition[0]+forwardSkidX*c,surface.heightM,motion.worldPosition[2]-forwardSkidX*s];
  return {
    skidId:'forward',pointWorld,normalWorld:[0,1,0],
    signedGapM:gap,relativeSpeedMps:motion.speedMps,
    active:gap<=0,contactIntensity01:Math.max(0,Math.min(1,-gap/.018)),
  };
}
function noise(a:number):number{const n=Math.sin(a*127.1+3.3)*43758.5453;return n-Math.floor(n);}
export function sampleReferenceSparks(sec:number):SparkParticle[]{
  const result:SparkParticle[]=[];
  // Fixed temporal birth grid ensures seek independence and discrete contacts.
  const latest=Math.floor(sec*30),earliest=Math.max(0,latest-8);
  for(let f=earliest;f<=latest;f++){
    const born=f/30,age=sec-born;
    if(age<0||age>.30)continue;
    const state=sampleReferenceMotion(born),contact=referenceForwardContact(state);
    if(!contact.active||contact.relativeSpeedMps<=0)continue;
    const c=Math.cos(state.yawRad),s=Math.sin(state.yawRad);
    for(let i=0;i<15;i++){
      const id=f*20+i;
      const spread=noise(id*9.1)-.5,rand=noise(id*4.6);
      const rearward=1.3+(7+9*rand)*age;
      const lateral=spread*(.08+age*2.7);
      const rise=(1+rand*2.6)*age-7*age*age;
      const p=contact.pointWorld;
      // -X backward and +Z left in car frame, inherited at emission
      const worldX=p[0]-rearward*c+lateral*s;
      const worldZ=p[2]+rearward*s+lateral*c;
      result.push({
        id,emitterSkidId:'forward',startSec:born,ageSec:age,lifetimeSec:.30,
        positionWorld:[worldX,p[1]+Math.max(0,rise),worldZ],
        velocityWorld:[-(7+9*rand)*c+(spread*2.7)*s,1+rand*2.6,-(spread*2.7)*c+(7+9*rand)*s],
        radiusM:.008+rand*.012,luminance01:(1-age/.30)*(.65+.35*rand),
      });
    }
  }
  return result;
}
export const REFERENCE_ROUTE_LENGTH_M=routeLength('track');
