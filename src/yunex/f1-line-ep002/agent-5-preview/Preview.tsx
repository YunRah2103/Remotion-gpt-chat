import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Environment,Vehicle,WorldLighting,CameraAim} from '../../world-kit/index.ts';
import {RACE_COLORS} from '../contract.ts';
import {RaceLineWorld} from '../graphics/WorldGraphics.tsx';
import {StoryOverlay} from '../graphics/StoryOverlay.tsx';
import type {FilmBeat} from '../graphics/model.ts';
import {STAGING_PREVIEW_PATHS,previewDistance} from './previewMotion.ts';

const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const ease=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
const blend=(a:[number,number,number],b:[number,number,number],t:number)=>
  a.map((v,i)=>lerp(v,b[i],t)) as [number,number,number];

/** Actual moving kit single-seaters on the real circuit. This preview deliberately
 *  has NO simulated A2 speeds, no finish result, and no manufactured telemetry.
 */
export const Agent5Preview:React.FC=()=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const paths=STAGING_PREVIEW_PATHS;
 const progressM={shortcut:previewDistance(frame,'shortcut'),
   racing:previewDistance(frame,'racing')};
 const a=paths.shortcut.sampleAtDistance(progressM.shortcut);
 const b=paths.racing.sampleAtDistance(progressM.racing);
 const target:[number,number,number]=[(a.position[0]+b.position[0])/2,0,
   (a.position[2]+b.position[2])/2];
 const shot0:[number,number,number]=[target[0]-15,8,target[2]+18];
 const shot1:[number,number,number]=[target[0]+2,32,target[2]+8];
 const shot2:[number,number,number]=[target[0]-18,9,target[2]-15];
 const position=blend(blend(shot0,shot1,ease((frame-52)/22)),shot2,ease((frame-127)/20));
 const beat:FilmBeat=frame<54?'hook':frame<99?'shortcut':frame<144?'wide':
   frame<183?'explain':'final';
 const highlight=beat==='shortcut'?'shortcut':beat==='wide'?'racing':'both';
 return <AbsoluteFill style={{backgroundColor:'#9cb4bd'}}>
  <ThreeCanvas width={width} height={height} camera={{position,fov:47,near:.1,far:700}}
    style={{width:'100%',height:'100%'}}>
   <WorldLighting timeOfDay="day" focus={target}/>
   <Environment kind="track" seed={12} timeOfDay="day"/>
   <Vehicle variant="formula-modern" color={RACE_COLORS.shortcut}
     accent="#d9f5f2" wheelColor="#161c23"
     pose={{position:a.position,yaw:a.yaw}}
     distance={progressM.shortcut}
     steer={Math.atan(2.9*a.curvatureInvM)}/>
   <Vehicle variant="formula-modern" color={RACE_COLORS.racing}
     accent="#fff1ce" wheelColor="#161c23"
     pose={{position:b.position,yaw:b.yaw}}
     distance={progressM.racing}
     steer={Math.atan(2.9*b.curvatureInvM)}/>
   <RaceLineWorld paths={paths} progressM={progressM} frame={frame}
     highlight={highlight} showApex={frame>52}/>
   <CameraAim position={position} target={[target[0],.35,target[2]]} fov={47}/>
  </ThreeCanvas>
  <StoryOverlay beat={beat} paths={paths} preview/>
 </AbsoluteFill>;
};
