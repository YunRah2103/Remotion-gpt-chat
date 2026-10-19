import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {getRaceCamera} from '../cinema/cameras.ts';
import {RaceCameraRig} from '../cinema/RaceCameraRig.tsx';
import {RaceWorld,RaceLighting,RaceCar} from '../lookdev/index.ts';
import {RaceLineWorld} from '../graphics/WorldGraphics.tsx';
import {StoryOverlay} from '../graphics/StoryOverlay.tsx';
import {AUTHORITATIVE_RACE_PATHS,sampleRaceFrame} from '../physics/index.ts';

/** Quality-inspection reel, NOT the 26s final episode or any editor's timeline.
 * A1 path + A2 physical states + A3 camera + A4 premium world + A5 graphics.
 */
export const F1IntegrationReview:React.FC=()=>{
 const f=useCurrentFrame(),{width,height,fps}=useVideoConfig();
 const state=sampleRaceFrame(f,fps);
 const cameraShot=f<60?'opening':f<120?'duel':'overhead';
 const view=getRaceCamera(cameraShot,state,f);
 const {shortcut:a,racing:b}=state.cars;
 const separation=Math.hypot(a.worldPose.position[0]-b.worldPose.position[0],
   a.worldPose.position[2]-b.worldPose.position[2]);
 const safePair=separation>5.8;
 const focus=f<90?'shortcut':'racing';
 const paths=AUTHORITATIVE_RACE_PATHS;
 return <AbsoluteFill style={{background:'#728b95'}}>
  <ThreeCanvas width={width} height={height} shadows
    camera={{position:view.position,fov:view.fov,near:.10,far:500}}
    style={{width:'100%',height:'100%'}}>
   <RaceLighting quality="premium" focus={[65,0,18]}/>
   <RaceWorld quality="premium" seed={12}/>
   <RaceCameraRig shot={cameraShot} state={state} frame={f}/>
   {(safePair||focus==='shortcut')&&<RaceCar id="shortcut"
     pose={a.worldPose} wheelTravelM={a.travelDistanceM} steerRad={a.steerRad}/>}
   {(safePair||focus==='racing')&&<RaceCar id="racing"
     pose={b.worldPose} wheelTravelM={b.travelDistanceM} steerRad={b.steerRad}/>}
   <RaceLineWorld paths={paths} progressM={{shortcut:a.pathDistanceM,
     racing:b.pathDistanceM}} frame={f} highlight="both" showApex/>
  </ThreeCanvas>
  <StoryOverlay beat="explain" paths={paths}/>
  <div style={{position:'absolute',top:'5%',left:'9%',right:'9%',
    fontSize:Math.round(width*.024),fontFamily:'Arial,Helvetica,sans-serif',
    color:'#ffffff',fontWeight:800,letterSpacing:2,textShadow:'0 1px 9px #06121a'}}>
    QUALITY REVIEW  /  REAL A1 + A2 DATA  /  NOT FINAL EDIT
  </div>
 </AbsoluteFill>;
};
