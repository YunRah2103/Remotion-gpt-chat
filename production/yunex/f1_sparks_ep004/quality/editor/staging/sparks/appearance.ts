/**
 * Agent 9 — visualisation ONLY of Agent 2's existing world-space SparkParticle[].
 * Does not sample contact events, emit particles, or alter their trajectories.
 * +X forward / +Y up / +Z left, metres; all values seek-deterministic.
 */
import type {SkidContact,SkidId,SparkParticle,Vec3} from '../../../../shared/contract.ts';

export type QualitySparkInstance=Readonly<{
 id:number; skidId:SkidId; positionWorld:Vec3; trailCentreWorld:Vec3;
 directionWorld:Vec3; radiusM:number; streakLengthM:number;
 brightness01:number; thermal01:number;
}>;
export type QualitySparkGlow=Readonly<{
 skidId:SkidId; positionWorld:Vec3; intensity:number; haloRadiusM:number;
}>;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const isVec=(p:readonly number[])=>p.length===3&&p.every(Number.isFinite);
const MAX_VISUALS=260;

/**
 * Each instance has exactly one input particle and reuses its ID, 3D position,
 * trajectory direction and physically simulated lifetime. Only projected optical
 * width/shutter streak are artistically adjusted; NEVER extrapolate a new birth.
 */
export function sampleQualitySparkInstances(
 particles:readonly SparkParticle[],shutterSec=.014,maxParticles=MAX_VISUALS,
):QualitySparkInstance[]{
 if(!Number.isFinite(shutterSec)||shutterSec<0||shutterSec>.050)throw new RangeError('shutterSec');
 if(!Number.isInteger(maxParticles)||maxParticles<0||maxParticles>MAX_VISUALS)throw new RangeError('maxParticles');
 const seen=new Set<number>();
 const output:QualitySparkInstance[]=[];
 for(const p of particles){
  if(seen.has(p.id))throw new Error('duplicate physical spark particle id '+p.id);
  seen.add(p.id);
  if(!isVec(p.positionWorld)||!isVec(p.velocityWorld)||!Number.isFinite(p.luminance01)||
    !Number.isFinite(p.ageSec)||!Number.isFinite(p.lifetimeSec)||
    !Number.isFinite(p.radiusM)||!Number.isFinite(p.startSec))throw new Error('invalid physical particle');
  // Bad/expired particles are omitted, never repaired or replaced.
  if(p.ageSec<0||p.ageSec>=p.lifetimeSec||p.luminance01<=.018||p.radiusM<=0)continue;
  const speed=Math.hypot(...p.velocityWorld);
  const d:Vec3=speed>1e-9?
   [p.velocityWorld[0]/speed,p.velocityWorld[1]/speed,p.velocityWorld[2]/speed]:[1,0,0];
  const brightness01=clamp(p.luminance01,0,1);
  const streakLengthM=clamp(speed*shutterSec*.84,.020,.46)*(0.63+.37*brightness01);
  const trailCentreWorld:Vec3=[
   p.positionWorld[0]-d[0]*streakLengthM*.47,
   p.positionWorld[1]-d[1]*streakLengthM*.47,
   p.positionWorld[2]-d[2]*streakLengthM*.47,
  ];
  output.push({
   id:p.id,skidId:p.emitterSkidId,positionWorld:p.positionWorld,
   trailCentreWorld,directionWorld:d,
   radiusM:clamp(p.radiusM*.82,.004,.024),
   streakLengthM,brightness01,thermal01:clamp(p.ageSec/p.lifetimeSec,0,1),
  });
 }
 // Deterministic high-value visual culling; no extra sparks when requested.
 return output.sort((a,b)=>b.brightness01-a.brightness01||a.id-b.id).slice(0,maxParticles)
  .sort((a,b)=>a.id-b.id);
}

/** Glows exist only at approved ACTIVE metal/road interfaces, with at least one
 * genuine very-young A2 particle from that same skid. Past floating glints
 * may remain in a dry interval, but a cleared metal skid has NO source glow.
 */
export function deriveQualityContactGlows(
 contacts:readonly SkidContact[],particles:readonly SparkParticle[],maxLights=2,
):QualitySparkGlow[]{
 if(!Number.isInteger(maxLights)||maxLights<0||maxLights>3)throw new RangeError('maxLights');
 const glows:QualitySparkGlow[]=[];
 for(const c of contacts){
  if(!c.active||c.signedGapM>0||c.relativeSpeedMps<=.5||
    !isVec(c.pointWorld))continue;
  const newborn=particles.filter(p=>
   p.emitterSkidId===c.skidId &&
   p.ageSec>=0 && p.ageSec<=.075 &&
   p.ageSec<p.lifetimeSec && p.luminance01>.10 &&
   isVec(p.positionWorld)
  );
  if(!newborn.length)continue;
  const energy=newborn.reduce((a,p)=>a+clamp(p.luminance01,0,1),0);
  const weight=clamp(energy/11,0,1)*clamp(c.contactIntensity01,0,1);
  if(weight<.001)continue;
  glows.push({
   skidId:c.skidId,
   positionWorld:[c.pointWorld[0],c.pointWorld[1]+.045,c.pointWorld[2]],
   intensity:clamp(3.0+14*weight,0,17),
   haloRadiusM:.10+.19*weight,
  });
 }
 // Never more than a few local lamps (not screen-spanning fake blooms).
 return glows.sort((a,b)=>b.intensity-a.intensity).slice(0,maxLights);
}

/** Readable positive-gap/no-birth audit hook, with no new physics. */
export function validateAppearanceProvenance(
 instances:readonly QualitySparkInstance[],particles:readonly SparkParticle[],
):boolean{
 const byId=new Map(particles.map(p=>[p.id,p]));
 return instances.every(i=>{
  const p=byId.get(i.id);
  return Boolean(p&&i.skidId===p.emitterSkidId&&i.positionWorld===p.positionWorld &&
   i.streakLengthM<=.46&&i.radiusM<=.024);
 });
}
