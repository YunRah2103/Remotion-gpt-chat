import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Environment,WorldLighting,CameraAim} from '../../world-kit/components';
import {RaceCars,samplePreviewRaceFrame} from '../cars/RaceCars';
import type {RaceCameraPose,V3} from '../contract.ts';

/** Three genuine animated 3D cinematography beats with moving cars throughout. */
export const AGENT_1_PREVIEW_FRAMES=240;
const plus=(a:V3,b:V3):V3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const mul=(a:V3,n:number):V3=>[a[0]*n,a[1]*n,a[2]*n];
export function getAgent1PreviewCamera(frame:number,fps=30):RaceCameraPose {
  const state=samplePreviewRaceFrame(frame,fps),a=state.cars.shortcut.worldPose,b=state.cars.racing.worldPose;
  const mid:V3=mul(plus(a.position,b.position),0.5);
  const lead=frame/fps<5.35?a:b;
  const forward:V3=[Math.cos(lead.yaw),0,-Math.sin(lead.yaw)];
  const left:V3=[Math.sin(lead.yaw),0,Math.cos(lead.yaw)];
  const t=frame/fps;
  if(t<2.7) return {
    position:plus(plus(plus(mid,mul(forward,-29)),mul(left,17)),[0,10.0,0]),
    target:plus(plus(mid,mul(forward,4)),[0,.65,0]),fov:53,
  };
  if(t<5.35){
    // Controlled aerial reveal: both lines and the actual turn remain readable.
    const orbit=(t-2.7)*.22;
    return {position:plus(plus(mid,[Math.sin(orbit)*13,43,0]),[12,0,Math.cos(orbit)*8]),
      target:plus(mid,[0,.5,0]),fov:39};
  }
  // Longer-lens-feeling exit framing, with extra horizontal breathing room:
  // both cars remain in view in 9:16 even as their roads reconverge.
  return {
    position:plus(plus(plus(mid,mul(forward,35)),mul(left,23)),[0,14,0]),
    target:plus(mid,[0,.7,0]),fov:60,
  };
}
const label:React.CSSProperties={
  color:'#eaf5f3',fontFamily:'Arial, sans-serif',fontSize:23,fontWeight:700,
  letterSpacing:2.6,textShadow:'0 2px 8px #0b1524b8'
};
export const Agent1RacingPreview:React.FC=()=>{
  const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
  const state=samplePreviewRaceFrame(frame,fps),camera=getAgent1PreviewCamera(frame,fps);
  const focus=state.cars.shortcut.worldPose.position;
  return <AbsoluteFill style={{background:'#b4cbd2'}}>
    <ThreeCanvas width={width} height={height} shadows
      camera={{position:camera.position,fov:camera.fov,near:.1,far:370}}>
      <WorldLighting timeOfDay="day" focus={focus}/>
      <Environment kind="track" timeOfDay="day" seed={12}/>
      <CameraAim position={camera.position} target={camera.target} fov={camera.fov}/>
      <RaceCars state={state}/>
    </ThreeCanvas>
    <div style={{position:'absolute',left:'6.5%',right:'6.5%',top:'5.5%',display:'flex',
      justifyContent:'space-between',alignItems:'center',gap:10}}>
      <div style={{...label,borderTop:'4px solid #25AFA8',paddingTop:10}}>A / INSIDE</div>
      <div style={{...label,borderTop:'4px solid #F5A44B',paddingTop:10}}>B / WIDE APEX</div>
    </div>
    <div style={{position:'absolute',left:'7%',bottom:'6%',...label,fontSize:16,
      opacity:.8,letterSpacing:1.7}}>
      {frame/fps<2.7?'01 — CORNER ENTRY':frame/fps<5.35?'02 — TWO REAL RACING LINES':'03 — CORNER EXIT'}
    </div>
  </AbsoluteFill>;
};
