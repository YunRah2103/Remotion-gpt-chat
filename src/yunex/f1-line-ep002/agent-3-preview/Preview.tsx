import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Environment,Vehicle,WorldLighting} from '../../world-kit/components';
import {RACE_COLORS} from '../contract.ts';
import type {RaceFrameState} from '../contract.ts';
import {RaceCameraRig} from '../cinema/RaceCameraRig.tsx';
import {previewShotAt} from '../cinema/cameras.ts';
import type {PreviewReel} from '../cinema/cameras.ts';
import {sampleAgent3Fixture} from './fixture.ts';

export type CinemaSceneProps={state:RaceFrameState;shot:Parameters<typeof RaceCameraRig>[0]['shot'];frame:number};
/** Reusable REAL animated world shot, ready for A1/A2's sampleRaceFrame output. */
export const CinemaScene:React.FC<CinemaSceneProps>=({state,shot,frame})=>{
 const {width,height}=useVideoConfig();
 const a=state.cars.shortcut,b=state.cars.racing;
 return <AbsoluteFill style={{background:'#b7ced8'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{position:[80,20,30],fov:50,near:.12,far:450}}>
   <WorldLighting timeOfDay="day" focus={[65,0,18]}/>
   <Environment kind="track" seed={12} timeOfDay="day"/>
   <RaceCameraRig shot={shot} state={state} frame={frame}/>
   <Vehicle variant="formula-modern" color={RACE_COLORS.shortcut} accent="#e6fff9" wheelColor="#13181d" pose={{position:a.worldPose.position,yaw:a.worldPose.yaw}} distance={a.travelDistanceM} steer={a.steerRad}/>
   <Vehicle variant="formula-modern" color={RACE_COLORS.racing} accent="#fff1cf" wheelColor="#15191e" pose={{position:b.worldPose.position,yaw:b.worldPose.yaw}} distance={b.travelDistanceM} steer={b.steerRad}/>
  </ThreeCanvas>
 </AbsoluteFill>;
};
/** Isolated portrait render; no Root or existing film modified. */
export const Agent3CinemaPreview:React.FC<{reel:PreviewReel}>=({reel})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig();
 const state=sampleAgent3Fixture(frame,fps);
 const shot=previewShotAt(frame,fps,reel);
 return <CinemaScene state={state} shot={shot} frame={frame}/>;
};
