/**
 * Read-only integration adapter for Agent 4's geometric emergency-refuge bay.
 *
 * The visual world exists on another branch until integration; this helper
 * accepts that exact geometry's public numeric shape and NEVER teleports,
 * slows, redirects, or overrides Agent 2's authoritative motion.
 */
import type {EpisodeParams,VehicleDynamicsFrame} from '../shared/contract.ts';
import {DYNAMICS_DEFAULTS,DYNAMICS_ASSUMPTIONS,sampleDynamics} from './model.ts';

export type RefugeGeometry = Readonly<{
  startX:number;fullWidthX:number;endX:number;
  mainRoadEdgeZ:number;originalRailZ:number;outerRailZ:number;
  markedStartX:number;markedEndX:number;
  safeStopCentreZ:number;vehicleLengthM:number;vehicleWidthM:number;
  reserveM:number;
}>;
export type RefugeAssessment=Readonly<{
  tSec:number; positionX:number; positionZ:number; speedMps:number;
  footprintOnPavement:boolean; withinMarkedLength:boolean;
  fullyInsideRefuge:boolean; approximatelyStationary:boolean;
  safelyStoppedInBay:boolean;
}>;
const ease=(u:number)=>{const v=Math.max(0,Math.min(1,u));return v*v*(3-2*v);};
function railAt(x:number,g:RefugeGeometry):number {
  return g.originalRailZ+(g.outerRailZ-g.originalRailZ)*ease((x-g.startX)/(g.fullWidthX-g.startX));
}
export function assessRefugeFrame(frame:VehicleDynamicsFrame,g:RefugeGeometry):RefugeAssessment {
  const vals=Object.values(g);
  if(vals.some(v=>!Number.isFinite(v))||g.fullWidthX<=g.startX||g.endX<=g.markedEndX||
    g.reserveM<0||g.vehicleLengthM<=0||g.vehicleWidthM<=0)throw new Error('Invalid refuge dimensions');
  const [x,,z]=frame.positionM, c=Math.abs(Math.cos(frame.yawRad)),s=Math.abs(Math.sin(frame.yawRad));
  const lengthReach=c*g.vehicleLengthM/2+s*g.vehicleWidthM/2;
  const widthReach=s*g.vehicleLengthM/2+c*g.vehicleWidthM/2;
  const rear=x-lengthReach,front=x+lengthReach;
  const outerRail=Math.max(railAt(rear,g),railAt(front,g));
  const withinMarkedLength=rear>=g.markedStartX&&front<=g.markedEndX;
  const footprintOnPavement=z+widthReach+g.reserveM<g.mainRoadEdgeZ &&
    z-widthReach-g.reserveM>outerRail;
  const fullyInsideRefuge=withinMarkedLength&&footprintOnPavement;
  const approximatelyStationary=frame.worldSpeedMps<=0.8 && Math.abs(frame.yawRad)<=0.07;
  return {tSec:frame.tSec,positionX:x,positionZ:z,speedMps:frame.worldSpeedMps,
    footprintOnPavement,withinMarkedLength,fullyInsideRefuge,approximatelyStationary,
    safelyStoppedInBay:fullyInsideRefuge&&approximatelyStationary};
}
/** Useful only to reject fabricated end shots: not an optimal stopping planner. */
export function auditRefugeTimeline(g:RefugeGeometry,p:EpisodeParams=DYNAMICS_DEFAULTS):{
  firstSafeTimeSec:number|null;firstBayPassTimeSec:number|null;
  passSpeedMps:number|null;hasDemonstratedStop:boolean;
}{
  let pass:RefugeAssessment|undefined,firstSafe:RefugeAssessment|undefined;
  const dt=0.1;
  for(let n=0;n<=Math.floor(DYNAMICS_ASSUMPTIONS.simulationHorizonSec/dt);n++){
    const a=assessRefugeFrame(sampleDynamics(n*dt,p),g);
    if(!pass&&a.positionX>=g.markedStartX)pass=a;
    if(!firstSafe&&a.safelyStoppedInBay)firstSafe=a;
  }
  return {firstSafeTimeSec:firstSafe?.tSec??null,
    firstBayPassTimeSec:pass?.tSec??null,passSpeedMps:pass?.speedMps??null,
    hasDemonstratedStop:!!firstSafe};
}
