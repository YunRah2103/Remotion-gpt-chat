/**
 * CarbonCeramic001 — five-shot, frame-deterministic vertical brake film.
 * Integration only: all A–D modules remain verbatim from their owned branches.
 * Heat is deliberately UNCALIBRATED illustrative false colour on the friction annulus.
 */
import React from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrakeAssembly} from './hardware/BrakeAssembly';
import {brakeStateAt} from './motion/brakeState';
import {BrakeLighting,brakeShotAt,brakeCameraAt} from './cinema';
import {WheelAssembly} from './wheel/WheelAssembly';
import {WheelRevealCameraRig,wheelExplodeAt,wheelVisibleAt} from './wheel/WheelRevealCameraRig';
import {PartLabels, TitleOverlays} from './graphics';
import {integrationStateAt} from './integration/integrationState';
import {IntegrationCameraRig} from './integration/IntegrationCameraRig';
import {FrictionHeatMap} from './integration/FrictionHeatMap';
import {InFilmPadCutaway,InFilmPadLabels} from './integration/InFilmPadCutaway';
import {padBlendAt} from './integration/Polish05Transitions';

/**
 * A's friction faces terminate at x=-0.0155m and +0.0155m.
 * The overlays sit just outside those surfaces, move rigidly with the rotor,
 * never attach to the caliper, and do not claim a measured temperature.
 */
/**
 * Film source: original five shots and world-space hardware unchanged.
 * Only frames 96-151 use two genuine 3D render views for a 9-frame
 * geometry-preserving dissolve in/out. No empty/dark flash frames.
 */
const BrakeStage:React.FC<{frame:number;view:'normal'|'pad'}>=({frame,view})=>{
  const {width,height}=useVideoConfig();
  const motion=brakeStateAt(frame);
  const state=integrationStateAt(frame);
  const shot=brakeShotAt(frame);
  const pad=view==='pad';
  // G correction: context is always an actual brake assembly, never ghost-car.
  const opening=frame<120;
  const context=false;
  const cameraPose=brakeCameraAt(frame);
  const brakePosition:[number,number,number]=pad?[0,.13,0]:
    shot==='thermal'?
      [cameraPose.target[0],cameraPose.target[1],cameraPose.target[2]]:
      shot==='benefits'?[0,.012,.015]:
      shot==='hero'?[-.012,0,.012]:
      [0,0,0];
  // A's 390mm rotor geometry and pad travel stay physically unmodified.
  const size=pad?.82:shot==='thermal'?.56:shot==='reveal'?.86:
    shot==='hero'?.86:shot==='benefits'?.93:1;
  return <AbsoluteFill style={{background:'#080f19'}}>
    <ThreeCanvas width={width} height={height} shadows
      camera={{position:[1.3,.6,.9],fov:33,near:.012,far:75}}
      gl={{antialias:true,preserveDrawingBuffer:true}}>
      {opening?<WheelRevealCameraRig frame={frame}/>:<IntegrationCameraRig frame={frame} view={view}/>}
      <BrakeLighting frame={frame} heat01={0} background ground={false}/>
      {!context&&<directionalLight position={[.65,.55,.95]} color="#c8deec" intensity={1.1}/>}
      {!context&&<pointLight position={[.35,.25,.45]} color="#f0c9a0" intensity={.36} distance={2} decay={2}/>}
      <group scale={size} position={brakePosition}>
        <BrakeAssembly rotorAngleRad={state.rotorAngleRad}
          padGapMetres={state.padGapMetres} heat01={0} showUpright/>
        {opening&&!pad&&wheelVisibleAt(frame)&&
          <WheelAssembly angleRad={motion.rotorAngleRad}
            axialCutawayMetres={wheelExplodeAt(frame)}/>}
        <InFilmPadCutaway frame={frame} active={pad}/>
        {!context&&<FrictionHeatMap frame={frame} rotorAngleRad={state.rotorAngleRad}/>}
      </group>
    </ThreeCanvas>
  </AbsoluteFill>;
};

export const CarbonCeramic001:React.FC=()=>{
  const frame=useCurrentFrame();
  const padAlpha=padBlendAt(frame);
  // Render a single canvas except during two eight-frame transitions.
  const normalVisible=padAlpha<1;
  const padVisible=padAlpha>0;
  return <AbsoluteFill style={{background:'#080f19',overflow:'hidden'}}>
    {normalVisible&&<AbsoluteFill style={{opacity:1-padAlpha}}>
      <BrakeStage frame={frame} view="normal"/>
    </AbsoluteFill>}
    {padVisible&&<AbsoluteFill style={{opacity:padAlpha}}>
      <BrakeStage frame={frame} view="pad"/>
    </AbsoluteFill>}
    <AbsoluteFill style={{pointerEvents:'none',zIndex:30,
      background:'linear-gradient(180deg,rgba(3,8,14,.25) 0%,transparent 28%,transparent 73%,rgba(2,7,12,.35) 100%)'}}/>
    <TitleOverlays frame={frame}/>
    {padAlpha===0&&<PartLabels frame={frame} showLeaderLines={false}/>}
    <InFilmPadLabels frame={frame} opacity={padAlpha}/>
  </AbsoluteFill>;
};
export default CarbonCeramic001;
