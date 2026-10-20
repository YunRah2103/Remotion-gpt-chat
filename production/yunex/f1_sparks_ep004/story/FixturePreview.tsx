import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {sampleRoute} from '../../../../src/yunex/world-kit/environments';
import {Vehicle,Environment,CameraAim,WorldLighting} from '../../../../src/yunex/world-kit/components';
import type {StoryRequest,ShotId,VehicleMotionState,Vec3} from '../shared/contract';
import {EP004} from '../shared/contract';
import {StorySequence} from './StorySequence';
import type {StoryTiming} from './beats';

/** Reference ONLY: kit single-seater in real moving 'track' route.
 * Agent 1 hero, Agent 2 physics, Agent 3 camera and Agent 4 road replace this fixture.
 * The fixture intentionally has ZERO sparks/contact (never pretend to prove skid physics). */
function motionFixture(tSec:number):VehicleMotionState{
 const distance=EP004.previewDistanceStartM+EP004.previewSpeedMps*tSec;
 const pose=sampleRoute('track',distance);
 const phase=distance/EP004.wheelRadiusM;
 return {
  tSec,routeDistanceM:distance,speedMps:EP004.previewSpeedMps,
  worldPosition:pose.position,yawRad:pose.yaw,pitchRad:0,rollRad:0,
  wheelRotationRad:-phase,heaveM:0,
  wheelCompressionM:{'front-left':0,'front-right':0,'rear-left':0,'rear-right':0},
  downforceProxy01:0,
 };
}
const requestAt=(tSec:number,shot:ShotId,shotLocalSec:number,shotDurationSec:number):StoryRequest=>({
 shot,tSec,shotLocalSec,shotDurationSec,motion:motionFixture(tSec),contacts:[],particles:[]
});
const relativeWorld=(motion:VehicleMotionState,offset:Vec3):Vec3=>{
 const c=Math.cos(motion.yawRad),s=Math.sin(motion.yawRad);
 return [motion.worldPosition[0]+c*offset[0]+s*offset[2],
 motion.worldPosition[1]+offset[1],
 motion.worldPosition[2]-s*offset[0]+c*offset[2]];
};
const fixtureShot:(shot:ShotId)=>Vec3=(shot)=>({
 'spark-hook':[1.4,.85,-4.7],
 'rear-mystery':[-6,1.4,-1.6],
 'underfloor-reveal':[-.4,.35,-2.2],
 'aero-load':[.5,1.0,-5.7],
 'contact-macro':[.1,.35,-2.35],
 'racing-payoff':[-9,2.1,-5],
})[shot];
const FixtureShot:React.FC<{request:StoryRequest}>=({request})=>{
 const m=request.motion;
 const target=relativeWorld(m,request.shot==='underfloor-reveal'||request.shot==='contact-macro'?[0,.2,0]:[0,.56,0]);
 const camera=relativeWorld(m,fixtureShot(request.shot));
 return <AbsoluteFill>
  <ThreeCanvas width={1080} height={1920} camera={{position:[...camera] as [number,number,number],fov:40,near:.05,far:350}} shadows>
   <WorldLighting timeOfDay="night" focus={[...m.worldPosition] as [number,number,number]}/>
   <Environment kind="track" timeOfDay="night" seed={EP004.trackSeed}/>
   <CameraAim position={[...camera] as [number,number,number]} target={[...target] as [number,number,number]} fov={request.shot==='racing-payoff'?43:38}/>
   <Vehicle variant="formula-modern" color="#0a797b" accent="#edc58b" lights
     distance={m.routeDistanceM}
     pose={{position:[...m.worldPosition] as [number,number,number],yaw:m.yawRad}}/>
  </ThreeCanvas>
 </AbsoluteFill>;
};
export const HOOK_FIXTURE_TIMING:StoryTiming=[
 {shot:'spark-hook',durationSec:1.45},{shot:'rear-mystery',durationSec:1.45},
 {shot:'underfloor-reveal',durationSec:2.55},{shot:'aero-load',durationSec:.4},
 {shot:'contact-macro',durationSec:.4},{shot:'racing-payoff',durationSec:.4},
];
export const MIDDLE_FIXTURE_TIMING:StoryTiming=[
 {shot:'spark-hook',durationSec:.4},{shot:'rear-mystery',durationSec:.4},
 {shot:'underfloor-reveal',durationSec:2.9},{shot:'aero-load',durationSec:2.9},
 {shot:'contact-macro',durationSec:2.4},{shot:'racing-payoff',durationSec:2.4},
];
/** Shot-intent placeholders ONLY: these are NOT scripted/recorded narration or actual
 * metal-contact markers. Their only purpose is phone-safe subtitle layout proof. */
export const FIXTURE_HOOK_CAPTIONS=[
 {text:'MOTION STUDY',startSec:.12,endSec:1.45},
 {text:'REAR PURSUIT',startSec:1.45,endSec:2.90},
 {text:'UNDERBODY REVEAL',startSec:2.90,endSec:5.50}
] as const;
export const FIXTURE_MIDDLE_CAPTIONS=[
 {text:'UNDERBODY REVEAL',startSec:.8,endSec:3.7},
 {text:'RIDE HEIGHT',startSec:3.7,endSec:6.6},
 {text:'CONTACT CLOSE-UP',startSec:6.6,endSec:9.0},
 {text:'RACING PAYOFF',startSec:9.0,endSec:11.0}
] as const;
const Fixture:React.FC<{timing:StoryTiming;captions:readonly {text:string;startSec:number;endSec:number}[]}>=({timing,captions})=>
 <StorySequence requestAt={requestAt} renderShot={request=><FixtureShot request={request}/>}
   timing={timing} captions={captions} showCaptions showLabels={false}/>;
/** Moving kit-only car with phone-safe EDITORIAL placeholder captions.
 * No actual metallic skid/contact data: labels/pointers and sparks stay OFF. */
export const StoryFixtureHook:React.FC=()=> <Fixture timing={HOOK_FIXTURE_TIMING} captions={FIXTURE_HOOK_CAPTIONS}/>;
export const StoryFixtureMiddle:React.FC=()=> <Fixture timing={MIDDLE_FIXTURE_TIMING} captions={FIXTURE_MIDDLE_CAPTIONS}/>;
