/** TEMPORARY CAMERA BLOCKING FIXTURE, NOT AGENT 2 PHYSICS OR AGENT 1 DAMAGE. */
import type {VehicleDynamicsFrame,TyreFrame,WheelFrame,WheelId,Vec3} from '../shared/contract.ts';
import {EP003_SCENE} from '../shared/contract.ts';
const anchors:Readonly<Record<WheelId,Vec3>>={
 'front-left':[1.46,.36,.88],'front-right':[1.46,.36,-.88],
 'rear-left':[-1.46,.36,.88],'rear-right':[-1.46,.36,-.88]
};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export function fixtureDynamics(tSec:number):VehicleDynamicsFrame{
 if(!Number.isFinite(tSec)||tSec<0)throw new Error('Invalid fixture time');
 const v0=EP003_SCENE.illustrativeInitialSpeedMps,slow=Math.max(0,tSec-1.60);
 const w=Math.min(slow,7.2),speed=Math.max(4,v0-2.65*w);
 const dist=v0*Math.min(tSec,1.6)+(tSec>1.6?v0*w-1.325*w*w:0);
 const yaw=-.024*clamp((tSec-.83)/.65)+.017*clamp((tSec-2.1)/2.1);
 const c=Math.cos(yaw),s=Math.sin(yaw);
 const pos:Vec3=[-77+dist,0,-5.55-.18*clamp((tSec-.83)/1.1)+.09*clamp((tSec-2.6)/3)];
 const steer=-.012*clamp((tSec-1)/.5)+.017*clamp((tSec-2)/1.6);
 const result={} as Record<WheelId,WheelFrame>;
 (Object.keys(anchors) as WheelId[]).forEach(id=>{
  const r=anchors[id];
  result[id]={wheel:id,hubWorldM:[pos[0]+c*r[0]+s*r[2],r[1],pos[2]-s*r[0]+c*r[2]],
   steeringRad:id.startsWith('front')?steer:0,spinRad:-dist/.36,rollingRadiusM:.36,
   verticalCompressionM:0,contactFraction:id==='front-right'?1-.18*clamp((tSec-.75)/.3):1};
 });
 return {tSec,positionM:pos,yawRad:yaw,pitchRad:0,rollRad:0,worldSpeedMps:speed,
  distanceTravelledM:dist,driverSteerRad:steer,
  driverThrottle01:tSec<1.6?.32:Math.max(0,.28-.05*slow),driverBrake01:0,wheels:result,
  stage:tSec<.75?'pre-failure':tSec<1.05?'rapid-deflation':tSec<1.6?'initial-stabilisation':'gradual-slowdown'};
}
export function fixtureTyre(tSec:number):TyreFrame{
 const progress=clamp((tSec-EP003_SCENE.referenceFailureStartSec)/EP003_SCENE.referencePressureFallSec);
 const distance=fixtureDynamics(tSec).distanceTravelledM;
 return {tSec,failureProgress:progress,pressureRatio:1-.72*progress,
  sidewallCompression:.55*progress,treadSeparation:0,angularPhaseRad:-distance/.36,
  effectiveRadiusM:.36-.035*progress};
}
