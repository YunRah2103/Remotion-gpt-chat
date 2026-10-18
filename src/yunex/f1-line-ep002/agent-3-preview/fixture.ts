import type {CarFrameState,RaceCarId,RaceFrameState,RacePose} from '../contract.ts';
import {routeLength,sampleRoute} from '../../world-kit/environments.ts';
import {angleDelta,localOffset} from '../cinema/math.ts';

/**
 * PREVIEW ONLY. Honest lane-separated constant-speed blocking, not A1 path geometry or
 * A2 physics and NOT a claim about winning/exit speed. Replace via actual sampleRaceFrame.
 * Both cars derive from the APPROVED original circuit, at 14.5 m/s, with safe separation.
 */
function car(id:RaceCarId,frame:number,fps:number):CarFrameState{
 const t=frame/fps,centerDistance=routeLength('track')-102+14.5*t;
 // longitudinal staggering prevents intersecting geometry; differing lane offsets show depth.
 const s=centerDistance+(id==='shortcut'?3.8:-3.8);
 const base=sampleRoute('track',s),previous=sampleRoute('track',s-.35),next=sampleRoute('track',s+.35);
 const curvature=angleDelta(next.yaw,previous.yaw)/.7;
 const offset=id==='shortcut'?-1.8:1.8;
 const pos=localOffset(base.position,base.yaw,0,0,offset);
 const pose:RacePose={position:pos,yaw:base.yaw,curvatureInvM:curvature};
 return {
  id,timeSeconds:t,pathDistanceM:s,worldPose:pose,speedMps:14.5,
  longitudinalAccelMps2:0,lateralAccelMps2:14.5*14.5*Math.abs(curvature),
  steerRad:Math.atan(3.2*curvature),travelDistanceM:t*14.5,
  brake01:0,throttle01:.24,gripUtilization01:0,
 };
}
export function sampleAgent3Fixture(frame:number,fps=30):RaceFrameState{
 if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0)throw new Error('Invalid fixture frame/fps');
 return {frame,fps,timeSeconds:frame/fps,cars:{shortcut:car('shortcut',frame,fps),racing:car('racing',frame,fps)}};
}
