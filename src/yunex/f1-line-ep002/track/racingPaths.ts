import {routeLength,sampleRoute} from '../../world-kit/environments.ts';
import type {RaceCarId,RacePath,RacePose,V3} from '../contract.ts';

/**
 * Episode-owned racing line geometry; the approved closed circuit is not modified.
 * +X is forward, +Y up, +Z left. Offsets are metres measured to LEFT of
 * the existing road centreline; negative values therefore hug this RIGHT turn.
 *
 * The cars share the SAME centreline progress stations and the same asphalt.
 * A holds a tight inner radius; B is wide at both ends and clips a later apex.
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
const TAU=Math.PI*2;
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
export function offsetFromCentre(id:RaceCarId,progress01:number){
  const u=clamp(progress01,0,1);
  // Constant inside line versus genuine outside-inside-outside line.
  return id==='shortcut'?-2.8:2.8-4.45*Math.sin(Math.PI*u)**2;
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
  // Derive the actual tangent of each OFFSET curve. Do not use centreline yaw.
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
