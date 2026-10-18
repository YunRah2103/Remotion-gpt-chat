import {routeLength,sampleRoute} from '../../world-kit/environments.ts';
import type {RaceCarId,RacePath,RacePose,V3} from '../contract.ts';

/**
 * Episode-owned racing line geometry; the approved closed circuit is not modified.
 * +X is forward, +Y up, +Z left. Offsets are metres measured to LEFT of
 * the existing road centreline; negative values therefore hug this RIGHT turn.
 *
 * The cars share the SAME centreline progress stations and the same asphalt.
 * Both trajectories occupy EXACTLY the same physical start/finish checkpoints.
 * A makes the tight inside arc; B opens the corner, clips a later apex, then
 * smoothly returns to the shared exit. A2 measures timing at those SAME points.
 */
export const CORNER_GEOMETRY={
  anchor:[65,0,18] as V3,
  approachBeforeAnchorM:40,
  runoutAfterAnchorM:57,
  roadHalfWidthM:6,
  safetyMarginM:0.55,
  carLengthM:5.4,
  carWidthM:1.98,
  wheelbaseM:3.42,
  tyreRadiusM:0.36,
} as const;
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const differences=(b:number,a:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const circuitLengthM=routeLength('track');

/** Seek the actual knot on the *approved* circuit rather than making a new road. */
const anchorDistanceM=(()=>{
  let best=Infinity,at=0;
  for(let i=0;i<=8192;i++){
    const s=circuitLengthM*i/8192,p=sampleRoute('track',s).position;
    const err=(p[0]-65)**2+(p[2]-18)**2;
    if(err<best){best=err;at=s;}
  }
  return at;
})();
const entryCircuitDistanceM=anchorDistanceM-CORNER_GEOMETRY.approachBeforeAnchorM;
const sectorCircuitLengthM=CORNER_GEOMETRY.approachBeforeAnchorM+CORNER_GEOMETRY.runoutAfterAnchorM;

export function sampleCornerCentre(progress01:number){
  const s=entryCircuitDistanceM+clamp(progress01,0,1)*sectorCircuitLengthM;
  const p=sampleRoute('track',s);
  return {position:p.position,yaw:p.yaw,circuitDistanceM:s};
}
/** C2 quintic blending avoids abrupt lateral velocity or heading changes. */
const smooth5=(t:number)=>{const x=clamp(t,0,1);return x*x*x*(x*(x*6-15)+10);};
export function offsetFromCentre(id:RaceCarId,progress01:number){
  if(!Number.isFinite(progress01))throw new Error('Corner progress must be finite');
  const u=clamp(progress01,0,1);
  // Both cars travel the SAME physical centerline at the start/finish
  // checkpoints. During the approach and runout, offsets fade with zero
  // first and second derivative at their ends (no discontinuous steering).
  const sharedGate=smooth5(u/.19)*smooth5((1-u)/.19);
  if(id==='shortcut')return -2.8*sharedGate;
  // Wide entry, late inside apex, wide exit. Spread the offset change over
  // much of the turn, not a sudden steering snap or unrealistic hairpin.
  const apexWave=Math.sin(Math.PI*clamp((u-.10)/.8,0,1))**2;
  return sharedGate*(2.8-4.25*apexWave);
}

type Knot={arcM:number;position:V3;yaw:number;curvatureInvM:number;progress01:number};
export type CornerMark={progress01:number;circuitDistanceM:number;position:V3};
export type RacingLineData=RacePath & {
  knots:readonly Knot[];
  markers:{entry:CornerMark;apex:CornerMark;exit:CornerMark};
  getOffsetM:(progress01:number)=>number;
};
const SAMPLES=1800;
function build(id:RaceCarId):RacingLineData{
  const knots:Knot[]=[];
  for(let i=0;i<=SAMPLES;i++){
    const u=i/SAMPLES,center=sampleCornerCentre(u),offsetM=offsetFromCentre(id,u);
    // Heading y: +Yaw points towards -Z, while +left is [+sin(yaw),+cos(yaw)].
    const p:V3=[
      center.position[0]+Math.sin(center.yaw)*offsetM,
      0,
      center.position[2]+Math.cos(center.yaw)*offsetM,
    ];
    const previous=knots[i-1];
    const arcM=previous?previous.arcM+Math.hypot(p[0]-previous.position[0],p[2]-previous.position[2]):0;
    knots.push({arcM,position:p,yaw:0,curvatureInvM:0,progress01:u});
  }
  // The kit's 200-division Catmull-Rom arc mapping can create small
  // derivative spikes around a control point when a line is laterally offset.
  // A car cannot follow those kinks. Smooth the *spatial trajectory* over a
  // 1.5m Gaussian scale (not merely the reported curvature). Extrapolate the
  // endpoint tangent linearly, so we do not turn or flatten either entrance.
  // Track width tests still use the unsmoothed approved asphalt boundary.
  const rawPoints=knots.map(k=>k.position);
  const radius=84,sigma=28;
  const point=(index:number):V3=>{
    if(index<0)return [
      rawPoints[0][0]+index*(rawPoints[1][0]-rawPoints[0][0]),0,
      rawPoints[0][2]+index*(rawPoints[1][2]-rawPoints[0][2])];
    if(index>SAMPLES)return [
      rawPoints[SAMPLES][0]+(index-SAMPLES)*(rawPoints[SAMPLES][0]-rawPoints[SAMPLES-1][0]),0,
      rawPoints[SAMPLES][2]+(index-SAMPLES)*(rawPoints[SAMPLES][2]-rawPoints[SAMPLES-1][2])];
    return rawPoints[index];
  };
  for(let i=0;i<=SAMPLES;i++){
    let sum=0,x=0,z=0;
    for(let k=-radius;k<=radius;k++){
      const w=Math.exp(-.5*(k/sigma)**2),p=point(i+k);
      x+=w*p[0];z+=w*p[2];sum+=w;
    }
    // Smooth the real spatial points only inside the sector. Restore the
    // original road-matched endpoints *exactly* while smoothly blending the
    // Gaussian filtering on/off over the approach and runout. The gate itself
    // has vanishing first and second derivatives at its boundaries.
    const u=i/SAMPLES;
    const filterGate=smooth5((u-.065)/.095)*smooth5((.935-u)/.095);
    const raw=rawPoints[i];
    knots[i].position=[
      raw[0]+filterGate*(x/sum-raw[0]),0,
      raw[2]+filterGate*(z/sum-raw[2]),
    ];
  }
  knots[0].arcM=0;
  for(let i=1;i<=SAMPLES;i++){
    const a=knots[i-1].position,p=knots[i].position;
    knots[i].arcM=knots[i-1].arcM+Math.hypot(p[0]-a[0],p[2]-a[2]);
  }
  // Derive the actual tangent of each SMOOTHED offset path, not centreline yaw.
  for(let i=0;i<knots.length;i++){
    const a=knots[Math.max(i-2,0)].position,b=knots[Math.min(i+2,SAMPLES)].position;
    const raw=Math.atan2(-(b[2]-a[2]),b[0]-a[0]);
    knots[i].yaw=i===0?raw:knots[i-1].yaw+differences(raw,knots[i-1].yaw);
  }
  for(let i=0;i<knots.length;i++){
    const before=knots[Math.max(i-5,0)],after=knots[Math.min(i+5,SAMPLES)];
    const ds=after.arcM-before.arcM;
    knots[i].curvatureInvM=ds>0?(after.yaw-before.yaw)/ds:0;
  }
  const lengthM=knots[SAMPLES].arcM;
  function distanceAtProgress(u:number){
    const at=clamp(u,0,1)*SAMPLES,i=Math.min(SAMPLES-1,Math.floor(at)),w=at-i;
    return knots[i].arcM+(knots[i+1].arcM-knots[i].arcM)*w;
  }
  function sampleAtDistance(distanceM:number):RacePose{
    if(!Number.isFinite(distanceM))throw new Error('Race path distance must be finite');
    const s=clamp(distanceM,0,lengthM);
    let lo=0,hi=SAMPLES;
    while(lo<hi){const mid=(lo+hi)>>1;if(knots[mid].arcM<s)lo=mid+1;else hi=mid;}
    const upper=Math.max(1,lo),a=knots[upper-1],b=knots[upper];
    const t=clamp((s-a.arcM)/Math.max(1e-9,b.arcM-a.arcM),0,1);
    return {
      position:[
        a.position[0]+(b.position[0]-a.position[0])*t,
        0,
        a.position[2]+(b.position[2]-a.position[2])*t,
      ],
      yaw:a.yaw+(b.yaw-a.yaw)*t,
      curvatureInvM:a.curvatureInvM+(b.curvatureInvM-a.curvatureInvM)*t,
    };
  }
  const apexU=id==='shortcut'?40/97:0.5;
  const mark=(u:number):CornerMark=>({progress01:u,circuitDistanceM:entryCircuitDistanceM+u*sectorCircuitLengthM,position:sampleAtDistance(distanceAtProgress(u)).position});
  return Object.freeze({
    id,lengthM,entryDistanceM:0,apexDistanceM:distanceAtProgress(apexU),exitDistanceM:lengthM,
    knots,markers:{entry:mark(0),apex:mark(apexU),exit:mark(1)},
    getOffsetM:(u:number)=>offsetFromCentre(id,u),sampleAtDistance
  });
}
const PATHS:Record<RaceCarId,RacingLineData>={shortcut:build('shortcut'),racing:build('racing')};
/** Authoritative A1 geometry for A2 physics, A3 cameras and A5 graphics. */
export function makeRacingLinePath(id:RaceCarId):RacePath{return PATHS[id];}
export function getRacingLineData(id:RaceCarId):RacingLineData{return PATHS[id];}
export const RACING_PATHS:Readonly<Record<RaceCarId,RacePath>>=PATHS;
export const RACING_CORNER={
  anchorDistanceM,entryCircuitDistanceM,sectorCircuitLengthM,
  centreEntry:sampleCornerCentre(0).position,
  centreApex:sampleCornerCentre(40/97).position,
  centreExit:sampleCornerCentre(1).position,
  travelDirection:'clockwise right-hand corner' as const,
};
/** Interpolate absolute progress on the real road; useful for footprint tests. */
export function centreDistanceAt(progress01:number){return entryCircuitDistanceM+clamp(progress01,0,1)*sectorCircuitLengthM;}
export function projectOntoCornerRoad(position:V3){
  // Full-width projection, including the few metres before/after the film sector.
  let nearest=Infinity,s=entryCircuitDistanceM;
  const from=entryCircuitDistanceM-7,to=entryCircuitDistanceM+sectorCircuitLengthM+7;
  for(let i=0;i<=2000;i++){
    const at=from+(to-from)*i/2000,c=sampleRoute('track',at).position;
    const dist=(position[0]-c[0])**2+(position[2]-c[2])**2;
    if(dist<nearest){nearest=dist;s=at;}
  }
  return {lateralDistanceM:Math.sqrt(nearest),circuitDistanceM:s};
}
