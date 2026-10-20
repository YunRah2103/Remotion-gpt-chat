import type {SkidContact,SkidDescriptor,SkidId,SparkParticle,Vec3,VehicleMotionState} from '../shared/contract.ts';
import {sampleSkidContacts} from './contacts.ts';
import {sampleDynamics,worldToLocal} from './dynamics.ts';
import {sampleTrackSurface} from '../shared/track.ts';
import {EP004} from '../shared/contract.ts';
import type {DynamicsParams} from './dynamics.ts';

const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
const hash=(x:number)=>{let u=x>>>0;u=Math.imul(u^(u>>>16),0x7feb352d);u=Math.imul(u^(u>>>15),0x846ca68b);return ((u^(u>>>16))>>>0)/4294967296;};
const ids:Readonly<Record<SkidId,number>>={forward:1,middle:2,rear:3};
const HZ=100,IMPULSES=12,MAX_LIFE=.78,MAX_PARTICLES=260;
type SparkParams= DynamicsParams & {samplingHz?:number};

/** All births are sampled at fixed absolute 10-ms ticks, not frame boundaries.
 * Current contacts (INCLUDING inactive ones) identify metal skid geometry.
 * Past births are re-checked against genuine historic signed gaps. Passing
 * non-contact frames cannot spawn any new particles. Prior particles may persist.
 * No dependency on frame order, random(), wall-clock or an evolving particle pool.
 * Optional 4th arg passes EXACT Agent 1 descriptors, recommended in production.
 */
export function sampleSparkParticles(
  tSec:number,
  motion:VehicleMotionState,
  contacts:readonly SkidContact[],
  skids?:readonly SkidDescriptor[],
  params:SparkParams={},
):SparkParticle[] {
  if(!Number.isFinite(tSec)||tSec<0||Math.abs(tSec-motion.tSec)>1e-6)throw new Error('spark time/motion mismatch');
  if(!contacts.length)return [];
  const skidArray=skids??contacts.map(c=>{
    // Inverse of actual surface point is only approximate during penetration.
    // Shift by signed gap along world vertical to recover actual metal underside.
    const underside:Vec3=[c.pointWorld[0],c.pointWorld[1]+c.signedGapM,c.pointWorld[2]];
    return {id:c.skidId,metal:true as const,localBottomPoint:worldToLocal(underside,motion)};
  });
  const contactIds=new Set(contacts.map(c=>c.skidId));
  for(const s of skidArray)if(!contactIds.has(s.id))throw new Error('missing contact state for '+s.id);
  const startDistanceM=motion.routeDistanceM-motion.speedMps*motion.tSec;
  // Reconstruct the parameters of the supplied chassis state when callers use
  // the contract's 3-argument API. Optional explicit parameters take precedence.
  const speedSquared=Math.pow(motion.speedMps/EP004.previewSpeedMps,2);
  const inferredAero=speedSquared>1e-8?clamp(motion.downforceProxy01/speedSquared,0,1):1;
  const bump01=clamp(sampleTrackSurface(motion.routeDistanceM).heightM/.019,0,1);
  const inferredRideOffset=motion.heaveM+.042*motion.downforceProxy01+.032*bump01;
  const replay: DynamicsParams={startDistanceM,speedMps:motion.speedMps,
    aeroLoad01:params.aeroLoad01??inferredAero,
    rideHeightOffsetM:params.rideHeightOffsetM??inferredRideOffset};
  const firstTick=Math.max(0,Math.ceil((tSec-MAX_LIFE)*HZ));
  const lastTick=Math.floor(tSec*HZ+1e-8);
  const result:SparkParticle[]=[];
  for(let tick=firstTick;tick<=lastTick;tick++){
    const born=tick/HZ,age=tSec-born;
    const pastMotion=sampleDynamics(born,replay);
    const pastContacts=sampleSkidContacts(born,pastMotion,skidArray);
    for(const c of pastContacts){
      if(!c.active||c.signedGapM>0||c.relativeSpeedMps<=.5)continue;
      const j=ids[c.skidId];
      // A physical sliding point releases many microscopic glints per 10ms tick;
      // each is a separate seeded hot chip, not an arbitrarily timed sheet.
      for(let chip=0;chip<IMPULSES;chip++){
      const seed=(tick*1777+j*124129+chip*92821)>>>0;
      const emissionProb=clamp((.18+.80*c.contactIntensity01)*c.relativeSpeedMps/78,0,.92);
      if(hash(seed+12)>emissionProb)continue;
      const lifespan=.33+.45*hash(seed+21);
      if(age>lifespan)continue;
      const az=hash(seed+42)*2-1;
      const forward:Vec3=[Math.cos(pastMotion.yawRad),0,-Math.sin(pastMotion.yawRad)];
      const left:Vec3=[Math.sin(pastMotion.yawRad),0,Math.cos(pastMotion.yawRad)];
      // Sparks inherit forward motion but rapidly fall behind the car because
      // their forward speed is LOWER than the sliding vehicle. Not exhaust fire.
      const forwardVelocity=c.relativeSpeedMps*(.10+.55*hash(seed+23));
      const sideVelocity=az*(1+6*hash(seed+45));
      const verticalVelocity=1.2+6.8*hash(seed+65);
      const v0:Vec3=[
        forward[0]*forwardVelocity+left[0]*sideVelocity,
        verticalVelocity,
        forward[2]*forwardVelocity+left[2]*sideVelocity,
      ];
      const drag=1.65+1.25*hash(seed+81);
      const integral=-Math.expm1(-drag*age)/drag;
      const vy=v0[1]*Math.exp(-drag*age)-9.81*age;
      const y=c.pointWorld[1]+.005+v0[1]*integral-4.905*age*age;
      let yFinal=y,vyFinal=vy;
      // Tiny damped roadside glints, never an endless secondary particle emitter.
      if(y<c.pointWorld[1]+.003){
        const rebound=.11+.10*hash(seed+87);
        yFinal=c.pointWorld[1]+.003;
        vyFinal=Math.max(0,-vy*rebound);
      }
      const positionWorld:Vec3=[
        c.pointWorld[0]+v0[0]*integral,
        yFinal,
        c.pointWorld[2]+v0[2]*integral,
      ];
      const velocityWorld:Vec3=[v0[0]*Math.exp(-drag*age),vyFinal,v0[2]*Math.exp(-drag*age)];
      const luminance01=clamp(Math.pow(1-age/lifespan,1.45)*(.60+.4*hash(seed+93)),0,1);
      const radiusM=.006+.017*hash(seed+13)*(1-age/lifespan);
      result.push({id:tick*100+j*16+chip,emitterSkidId:c.skidId,startSec:born,ageSec:age,
        lifetimeSec:lifespan,positionWorld,velocityWorld,radiusM,luminance01});
      if(result.length>=MAX_PARTICLES)return result;
      }
    }
  }
  return result;
}

/** Integration helper: pass ACTUAL getSkidDescriptors() every frame, ensuring
 * historical birth positions remain tied to live Agent 1 mesh coordinates. */
export function sampleContactDrivenSparks(tSec:number,motion:VehicleMotionState,skids:readonly SkidDescriptor[],params:SparkParams={}) {
  const contacts=sampleSkidContacts(tSec,motion,skids);
  const particles=sampleSparkParticles(tSec,motion,contacts,skids,params);
  return {contacts,particles};
}
