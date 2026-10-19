/**
 * PINNED AUTHORITATIVE INTEGRATION SNAPSHOT (Agent 2 PR #199).
 * Source agent/ep003-02-dynamics @ 197e02ca94c9d9687f8cc43dac3d89173eb4dfd2.
 * Below this comment is exactly the current Agent 2 dynamics/model.ts body.
 * This temporary review-only branch adapter must be deleted after integration;
 * import ../dynamics/model.ts directly once #199 reaches the shared base.
 */
/**
 * YUNEX EP003 / Agent 2. Illustrative deterministic planar four-contact vehicle dynamics.
 *
 * Coordinate contract: +X forward, +Y up, +Z left; positive yaw about +Y turns
 * the vehicle RIGHT (the forward +X vector rotates towards -Z). Consequently
 * right-front extra rolling resistance creates a POSITIVE yaw moment.
 *
 * Not empirical blowout data, not a safety-critical vehicle model.
 */
import type {EpisodeParams, VehicleDynamicsFrame, WheelFrame, WheelId} from '../shared/contract.ts';
import {EP003_SCENE, assertEpisodeTime} from '../shared/contract.ts';

export const DYNAMICS_DEFAULTS: Readonly<EpisodeParams> = Object.freeze({
  initialSpeedMps: EP003_SCENE.illustrativeInitialSpeedMps,
  failureStartSec: EP003_SCENE.referenceFailureStartSec,
  pressureFallSec: EP003_SCENE.referencePressureFallSec,
  failedWheel: 'front-right',
  roadGripScale: 1,
  driverModel: 'stabilise-then-gradually-slow',
});

/** Explicit illustrative assumptions. All SI units. */
export const DYNAMICS_ASSUMPTIONS = Object.freeze({
  massKg: 1780,
  yawInertiaKgM2: 3250,
  cgHeightM: 0.53,
  wheelbaseM: EP003_SCENE.wheelbaseM,
  trackM: 1.76,
  frontStaticFraction: 0.52,
  gravityMps2: 9.81,
  healthyGripCoefficient: 0.94,
  failedContactGripRatio: 0.37,
  failedVerticalSupportRatio: 0.88,
  nominalRollingResistance: 0.013,
  additionalFailedRollingResistanceN: 390,
  aerodynamicDragCoefficientNs2M2: 0.414,
  maximumDriveForceN: 2600,
  maximumBrakeForceN: 9200,
  frontAxleCorneringStiffnessNPerRad: 98000,
  rearAxleCorneringStiffnessNPerRad: 102000,
  failedCorneringStiffnessRatio: 0.55,
  nominalWheelRadiusM: EP003_SCENE.wheelRadiusM,
  failedRadiusLossM: 0.060,
  integrationHz: 240,
  simulationHorizonSec: 32,
});

const A = DYNAMICS_ASSUMPTIONS;
const IDS: readonly WheelId[] = ['front-left', 'front-right', 'rear-left', 'rear-right'];
const TRACK_HALF = A.trackM * 0.5;
const X_FRONT = A.wheelbaseM * 0.5;
const clamp = (x:number, lo:number, hi:number) => Math.min(hi,Math.max(lo,x));
const smooth = (x:number) => {const t=clamp(x,0,1);return t*t*(3-2*t);};
const lerp = (a:number,b:number,t:number) => a+(b-a)*t;

type Contacts = Record<WheelId,{normalN:number; fxN:number; fzN:number; radiusM:number; compressionM:number; spinRad:number; contactFraction:number}>;
type State = {
  x:number; z:number; yaw:number; vx:number; vz:number; yawRate:number; distance:number;
  roll:number; pitch:number; lateralAccel:number; longitudinalAccel:number;
  spins:Record<WheelId,number>;
};
type Snapshot = {state:State; controls:Controls; contacts:Contacts; progress:number};
type Controls = {steer:number; throttle:number; brake:number};

function validate(p:EpisodeParams):void {
  if(!Number.isFinite(p.initialSpeedMps)||p.initialSpeedMps<=0||p.initialSpeedMps>50)throw Error('initialSpeedMps must be in (0,50] m/s');
  if(!Number.isFinite(p.failureStartSec)||p.failureStartSec<0||p.failureStartSec>20)throw Error('invalid failureStartSec');
  if(!Number.isFinite(p.pressureFallSec)||p.pressureFallSec<=0||p.pressureFallSec>3)throw Error('invalid pressureFallSec');
  if(!Number.isFinite(p.roadGripScale)||p.roadGripScale<0.2||p.roadGripScale>1.2)throw Error('roadGripScale must be 0.2..1.2');
  if(!IDS.includes(p.failedWheel))throw Error('invalid wheel');
  if(p.driverModel!=='stabilise-then-gradually-slow')throw Error('unsupported driver schedule');
}

/** Relative air-pressure loss, not an estimate of absolute tyre pressure. */
export function failureProgressAt(tSec:number,params:EpisodeParams=DYNAMICS_DEFAULTS):number {
  assertEpisodeTime(tSec);
  return smooth((tSec-params.failureStartSec)/params.pressureFallSec);
}

/** Driver keeps input steady initially. Controls are bounded, delayed and gradual. */
function driver(s:State,t:number,p:EpisodeParams):Controls {
  const elapsed=t-p.failureStartSec;
  const response=smooth((elapsed-0.12)/0.75);
  const lateralError=s.z+1.85;
  // Positive yaw = vehicle heading to its right; negative steering corrects left.
  // A negative lateral-position or velocity error means drifting RIGHT (-Z):
  // request LEFT (negative) steer, not another rightward correction.
  const corrective=-0.37*s.yaw-0.58*s.yawRate+0.024*lateralError
    +0.22*Math.atan2(s.vz,Math.max(2,s.vx));
  const steer=clamp(corrective*response,-0.055,0.055);
  // NHTSA-inspired illustrative sequence: stabilise first; THEN ease the pedal.
  const throttle=lerp(0.216,0.07,smooth((elapsed-1.20)/2.2))
    *(1-smooth((elapsed-3.4)/2.2));
  const brake=0.14*smooth((elapsed-4.9)/4.1);
  return {steer,throttle,brake};
}
function wheelPos(id:WheelId):{x:number;z:number;front:boolean;left:boolean}{
  const front=id.startsWith('front');
  const left=id.endsWith('left');
  return {x:front?X_FRONT:-X_FRONT,z:left?TRACK_HALF:-TRACK_HALF,front,left};
}
function loadAt(id:WheelId,s:State):number {
  const w=wheelPos(id);
  const base=A.massKg*A.gravityMps2*(w.front?A.frontStaticFraction:1-A.frontStaticFraction)*0.5;
  const longitudinalShift=-A.massKg*A.cgHeightM*s.longitudinalAccel/A.wheelbaseM/2;
  const lateralShift=-A.massKg*A.cgHeightM*s.lateralAccel/A.trackM/2;
  return clamp(base+(w.front?longitudinalShift:-longitudinalShift)+(w.left?lateralShift:-lateralShift),base*0.35,base*1.7);
}
function resolve(s:State,t:number,p:EpisodeParams):{
  controls:Controls;contacts:Contacts; progress:number; fx:number;fz:number;moment:number
}{
  const controls=driver(s,t,p);
  const progress=failureProgressAt(t,p);
  const contacts={} as Contacts;
  let fx=0,fz=0,moment=0;
  for(const id of IDS){
    const w=wheelPos(id),damaged=id===p.failedWheel,loss=damaged?progress:0;
    const load=loadAt(id,s);
    const contactFraction=1-loss*(1-A.failedVerticalSupportRatio);
    const grip=A.healthyGripCoefficient*p.roadGripScale*(1-loss*(1-A.failedContactGripRatio));
    const available=load*contactFraction*grip;
    const angle=w.front?controls.steer:0;
    const c=Math.cos(angle),si=Math.sin(angle);
    // Yaw about +Y: velocity at local wheel is [vx+r*z, vz-r*x].
    const localVx=s.vx+s.yawRate*w.z;
    const localVz=s.vz-s.yawRate*w.x;
    const longitudinalV=localVx*c-localVz*si;
    const transverseV=localVx*si+localVz*c;
    const slip=Math.atan2(transverseV,Math.max(1,longitudinalV));
    const stiffness=(w.front?A.frontAxleCorneringStiffnessNPerRad:A.rearAxleCorneringStiffnessNPerRad)*0.5*(1-loss*(1-A.failedCorneringStiffnessRatio));
    const requestedLateral=-stiffness*slip;
    // A soft saturation avoids angular-force discontinuities at the grip limit.
    const lateral=available*Math.tanh(requestedLateral/Math.max(1,available));
    const engine=!w.front?A.maximumDriveForceN*controls.throttle/2:0;
    const braking=-A.maximumBrakeForceN*controls.brake/4;
    const rolling=-A.nominalRollingResistance*load;
    const ruptureDrag=-A.additionalFailedRollingResistanceN*loss;
    const aerodynamic=-A.aerodynamicDragCoefficientNs2M2*s.vx*Math.abs(s.vx)/4;
    const requestedLongitudinal=engine+braking+rolling+ruptureDrag+aerodynamic;
    // Approximate coupled friction circle. A deflated tyre can create drag even
    // when its contact grip is poor: retain rolling loss, cap contact force only.
    const outsideContact=ruptureDrag+rolling+aerodynamic;
    const contactLong=requestedLongitudinal-outsideContact;
    const allowedLong=Math.sqrt(Math.max(0,available*available-lateral*lateral));
    const longitudinal=outsideContact+clamp(contactLong,-allowedLong,allowedLong);
    const wheelFx=longitudinal*c+lateral*si;
    const wheelFz=-longitudinal*si+lateral*c;
    fx+=wheelFx;fz+=wheelFz;
    moment+=w.z*wheelFx-w.x*wheelFz;
    contacts[id]={
      normalN:load*contactFraction,fxN:wheelFx,fzN:wheelFz,
      radiusM:A.nominalWheelRadiusM-A.failedRadiusLossM*loss,
      compressionM:0.010+0.010*clamp((load/A.massKg/A.gravityMps2*4)-1,-0.7,0.7)+0.054*loss,
      contactFraction, spinRad:s.spins[id],
    };
  }
  return {controls,contacts,progress,fx,fz,moment};
}
function initial(p:EpisodeParams):State {
  return {x:0,z:-1.85,yaw:0,vx:p.initialSpeedMps,vz:0,yawRate:0,distance:0,
    roll:0,pitch:0,lateralAccel:0,longitudinalAccel:0,
    spins:{'front-left':0,'front-right':0,'rear-left':0,'rear-right':0}};
}
function step(s:State,t:number,dt:number,p:EpisodeParams):State {
  const f=resolve(s,t,p);
  // Vehicle body equations under the +Y positive/right yaw sign convention.
  const ax=f.fx/A.massKg-s.yawRate*s.vz;
  const az=f.fz/A.massKg+s.yawRate*s.vx;
  const nextYawRate=s.yawRate+dt*f.moment/A.yawInertiaKgM2;
  const yaw=s.yaw+dt*(s.yawRate+nextYawRate)*0.5;
  const vx=Math.max(0.1,s.vx+dt*ax),vz=s.vz+dt*az;
  const vxMid=(s.vx+vx)*0.5, vzMid=(s.vz+vz)*0.5, yawMid=(s.yaw+yaw)*0.5;
  const dx=dt*(vxMid*Math.cos(yawMid)+vzMid*Math.sin(yawMid));
  const dz=dt*(-vxMid*Math.sin(yawMid)+vzMid*Math.cos(yawMid));
  const rollTarget=clamp(-az*0.010-0.021*f.progress,-0.040,0.040);
  const pitchTarget=clamp(ax*0.008-0.005*f.progress,-0.04,0.04);
  const response=1-Math.exp(-dt/0.24);
  const spins={...s.spins};
  for(const id of IDS) {
    const w=wheelPos(id);
    const along=Math.max(0,s.vx+s.yawRate*w.z);
    spins[id]-=dt*along/Math.max(0.2,f.contacts[id].radiusM);
  }
  return {
    x:s.x+dx,z:s.z+dz,yaw,vx,vz,yawRate:nextYawRate,
    distance:s.distance+dt*Math.hypot(vxMid,vzMid),
    lateralAccel:f.fz/A.massKg,longitudinalAccel:f.fx/A.massKg,
    roll:lerp(s.roll,rollTarget,response),pitch:lerp(s.pitch,pitchTarget,response),spins
  };
}
function makeTable(p:EpisodeParams,hz:number=A.integrationHz):Snapshot[] {
  const dt=1/hz;
  const total=Math.ceil(A.simulationHorizonSec*hz);
  let s=initial(p);
  const table:Snapshot[]=[];
  for(let i=0;i<=total;i++){
    const t=i*dt, q=resolve(s,t,p);
    table.push({state:s,controls:q.controls,contacts:q.contacts,progress:q.progress});
    if(i<total)s=step(s,t,dt,p);
  }
  return table;
}
const CACHE=new Map<string,Snapshot[]>();
function lookup(p:EpisodeParams):Snapshot[] {
  validate(p);
  const key=JSON.stringify([p.initialSpeedMps,p.failureStartSec,p.pressureFallSec,p.failedWheel,p.roadGripScale,p.driverModel]);
  let table=CACHE.get(key);
  if(!table){table=makeTable(p);if(CACHE.size>=6)CACHE.clear();CACHE.set(key,table);}
  return table;
}
function interpolateState(a:State,b:State,f:number):State {
  const spins={...a.spins};
  for(const id of IDS)spins[id]=lerp(a.spins[id],b.spins[id],f);
  return {x:lerp(a.x,b.x,f),z:lerp(a.z,b.z,f),yaw:lerp(a.yaw,b.yaw,f),
    vx:lerp(a.vx,b.vx,f),vz:lerp(a.vz,b.vz,f),yawRate:lerp(a.yawRate,b.yawRate,f),
    distance:lerp(a.distance,b.distance,f),roll:lerp(a.roll,b.roll,f),pitch:lerp(a.pitch,b.pitch,f),
    longitudinalAccel:lerp(a.longitudinalAccel,b.longitudinalAccel,f),
    lateralAccel:lerp(a.lateralAccel,b.lateralAccel,f),spins};
}
/** Random-access, fixed-step deterministic dynamics. No dependence on render seek order. */
export function sampleDynamics(tSec:number,params:EpisodeParams=DYNAMICS_DEFAULTS):VehicleDynamicsFrame {
  assertEpisodeTime(tSec);
  if(tSec>A.simulationHorizonSec)throw Error('EP003 dynamics exceeds configured 32-second horizon');
  const table=lookup(params),u=tSec*A.integrationHz,i=Math.min(table.length-2,Math.floor(u)),f=u-i;
  const s=interpolateState(table[i].state,table[i+1].state,f);
  // Re-evaluating forces at the interpolated state avoids visually discontinuous
  // load/force samples at fixed-step boundaries.
  const q=resolve(s,tSec,params);
  const wheels={} as Record<WheelId,WheelFrame>;
  for(const id of IDS){
    const w=wheelPos(id),c=q.contacts[id];
    const cos=Math.cos(s.yaw),sin=Math.sin(s.yaw);
    const x=s.x+w.x*cos+w.z*sin;
    const z=s.z-w.x*sin+w.z*cos;
    const y=A.nominalWheelRadiusM+s.pitch*w.x-s.roll*w.z-c.compressionM*0.28-(A.nominalWheelRadiusM-c.radiusM)*0.76;
    wheels[id]={
      wheel:id,hubWorldM:[x,y,z],steeringRad:w.front?q.controls.steer:0,
      spinRad:s.spins[id],rollingRadiusM:c.radiusM,
      verticalCompressionM:c.compressionM,normalLoadN:c.normalN,
      longitudinalForceN:c.fxN,lateralForceN:c.fzN,contactFraction:c.contactFraction,
    };
  }
  const elapsed=tSec-params.failureStartSec;
  const stage:VehicleDynamicsFrame['stage']=elapsed<0?'pre-failure':
    elapsed<params.pressureFallSec?'rapid-deflation':
    elapsed<1.20?'initial-stabilisation':'gradual-slowdown';
  return {
    tSec,positionM:[s.x,0,s.z],yawRad:s.yaw,rollRad:s.roll,pitchRad:s.pitch,
    worldSpeedMps:Math.hypot(s.vx,s.vz),distanceTravelledM:s.distance,
    driverSteerRad:q.controls.steer,driverThrottle01:q.controls.throttle,
    driverBrake01:q.controls.brake,wheels,stage,
  };
}

/** For shots with a fresh local road segment, rebase ONLY camera-space X at a
 * declared hard cut. The physical vehicle state (including yaw/spin) is unchanged. */
export function previewRebasedPosition(frame:VehicleDynamicsFrame,anchorDistanceM:number,sceneX=-55):readonly[number,number,number]{
  return [sceneX+frame.positionM[0]-anchorDistanceM,frame.positionM[1],frame.positionM[2]];
}

/** Re-integrates a scenario from the SAME initial state at 120Hz and 480Hz.
 * Report convergence deltas rather than claiming exact vehicle truth. */
export function timestepSensitivityAt(tSec:number,params:EpisodeParams=DYNAMICS_DEFAULTS):{
  longitudinalDeltaM:number;lateralDeltaM:number;yawDeltaRad:number;speedDeltaMps:number
}{
  assertEpisodeTime(tSec);
  if(tSec>A.simulationHorizonSec)throw Error('invalid sensitivity time');
  validate(params);
  const pose=(hz:number):State=>{
    const table=makeTable(params,hz),u=tSec*hz,i=Math.min(table.length-2,Math.floor(u));
    return interpolateState(table[i].state,table[i+1].state,u-i);
  };
  const lo=pose(120),hi=pose(480);
  return {
    longitudinalDeltaM:Math.abs(lo.x-hi.x),
    lateralDeltaM:Math.abs(lo.z-hi.z),
    yawDeltaRad:Math.abs(lo.yaw-hi.yaw),
    speedDeltaMps:Math.hypot(lo.vx-hi.vx,lo.vz-hi.vz),
  };
}
