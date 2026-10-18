/**
 * A3 isolated NATIVE R3F/Remotion proof compositions.
 * CRITICAL: temporary low-speed fixture used ONLY in the camera department
 * previews while Agent 2 is unfinished. This is NOT a braking engineering
 * simulation, speed claim, ABS demonstration or master-film component.
 * Agents 2/6 must inject the real sampler via BrakingCameraStage.
 */
import React from 'react';
import {Composition,Folder} from 'remotion';
import type {BrakingSimulationState,SampleBrakingSimulation,TimedCue,WheelKey} from '../contracts.ts';
import {BrakingCameraStage} from './BrakingCameraStage.tsx';

const macroCues:readonly TimedCue[]=[
  {cue:'mechanism',fromFrame:0,toFrameExclusive:53},
  {cue:'heat',fromFrame:53,toFrameExclusive:103},
  {cue:'grip',fromFrame:103,toFrameExclusive:151},
  {cue:'abs',fromFrame:151,toFrameExclusive:195},
];
const trackCues:readonly TimedCue[]=[
  {cue:'hook',fromFrame:0,toFrameExclusive:85},
  {cue:'mechanism',fromFrame:85,toFrameExclusive:139},
  {cue:'grip',fromFrame:139,toFrameExclusive:189},
  {cue:'finale',fromFrame:189,toFrameExclusive:240},
];
/**
 * Isolated constant-velocity rolling test fixture: 9 metres/second is chosen
 * ONLY to prove parallax and wheel animation, not to approximate 200 km/h
 * or advertise stopping distance. Brake/ABS/heat signals are inert.
 */
const previewFixture:SampleBrakingSimulation=(t):BrakingSimulationState=>{
  const time=Math.max(0,t),velocity=9,travel=time*velocity,rotation=travel/.36;
  const wheel=(id:WheelKey)=>({
    angularSpeedRadPerSec:velocity/.36,rotationRad:rotation,slipRatio:0,
    normalLoadN:0,roadLongitudinalForceN:0,brakePressure01:0,absIntervening:false,
  });
  return {simTimeSec:time,speedMps:velocity,traveledM:travel,decelerationMps2:0,
    pitchRad:0,brakeHeatJ:0,
    wheel:{'front-left':wheel('front-left'),'front-right':wheel('front-right'),
      'rear-left':wheel('rear-left'),'rear-right':wheel('rear-right')}};
};
const label:React.CSSProperties={
  position:'absolute',left:60,bottom:115,zIndex:2,maxWidth:940,
  fontFamily:'Arial, sans-serif',letterSpacing:1.1,color:'#f3f6f5',
  background:'rgba(9,21,28,.76)',padding:'15px 19px',fontSize:22,
  borderLeft:'4px solid #d2a36c',
};
const Proof:React.FC<{mode:'macro'|'track'}>=({mode})=>
  <BrakingCameraStage sampleBrakingSimulation={previewFixture}
    simulationTimeAtFilmFrame={(frame,fps)=>frame/fps}
    startDistanceM={40}
    cameraOptions={{cues:mode==='macro'?macroCues:trackCues}}
    overlay={<div style={label}>
      <b>YUNEX / A3</b> {'  '} {mode==='macro'?'WHEEL MACRO CAMERA':'TRACK CAMERA MOTION'}
      <div style={{fontSize:17,opacity:.8,marginTop:5}}>
        TEMP ROLLING MOTION FIXTURE · NOT AGENT 2 BRAKING PHYSICS
      </div>
    </div>}
  />;
export const CameraMacroPreview:React.FC=()=> <Proof mode="macro"/>;
export const CameraTrackPreview:React.FC=()=> <Proof mode="track"/>;

export const BrakingA3PreviewCompositions:React.FC=()=> <Folder name="YUNEX-Braking-A3">
  <Composition id="BrakingA3Macro" component={CameraMacroPreview}
    durationInFrames={195} fps={30} width={1080} height={1920}/>
  <Composition id="BrakingA3Track" component={CameraTrackPreview}
    durationInFrames={240} fps={30} width={1080} height={1920}/>
</Folder>;
