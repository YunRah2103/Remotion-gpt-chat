/**
 * Native moving proof compositions. Kept inside Agent 5 ownership.
 * Preview state comes ONLY from proof-state.ts; it is not film physics.
 */
import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import type {CinematicCameraPose,FilmCue,Vec3} from '../contracts.ts';
import {BRAKING_EP001,wheelAnchors} from '../contracts.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import {sampleRoute} from '../../world-kit/environments.ts';
import {CameraAim,Environment,Vehicle,WorldLighting} from '../../world-kit/components.tsx';
import {BrakingGraphics} from './BrakingGraphics.tsx';
import {sampleGraphicsProofOnly} from './proof-state.ts';

const CAR=vehicleSpec(BRAKING_EP001.vehicleVariant);
const FRONT=wheelAnchors(CAR).find(a=>a.id==='front-left');
if(!FRONT)throw new Error('Cannot resolve kit front-left wheel anchor');
const frontCenter=FRONT.center;
const wheelContact:Vec3=[FRONT.center[0],.018,FRONT.center[2]];
const backdrop='#0b1520';
const signedRotation=(p:Vec3,yaw:number):Vec3=>[
  Math.cos(yaw)*p[0]+Math.sin(yaw)*p[2],
  p[1],
  -Math.sin(yaw)*p[0]+Math.cos(yaw)*p[2],
];
const plus=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];

/** Close physical macro / mechanism, heat, tyre contact and conditional ABS. */
export const BrakingGraphicsMacroProof:React.FC=()=>{
  const frame=useCurrentFrame();
  const {width,height,fps}=useVideoConfig();
  const t=frame/fps;
  const state=sampleGraphicsProofOnly(t);
  const split:[number,FilmCue][]= [[0,'mechanism'],[40,'heat'],[79,'grip'],[104,'abs']];
  const cut=[...split].reverse().find(([start])=>frame>=start)??split[0];
  const cue=cut[1];
  const local=frame-cut[0];
  const camera:CinematicCameraPose={
    position:[2.15+Math.sin(t*.34)*.16,.90+Math.sin(t*.41)*.06,3.05],
    target:[1.45,.37,.89],fovDeg:40,focusId:'front-left',
  };
  const focus=cue==='grip'?wheelContact:frontCenter;
  return <AbsoluteFill style={{background:backdrop}}>
    <ThreeCanvas width={width} height={height} shadows
      camera={{position:[...camera.position],fov:camera.fovDeg,near:.04,far:100}}>
      <color attach="background" args={[backdrop]}/>
      <hemisphereLight args={['#dce8ee','#141b24',.75]}/>
      <directionalLight position={[1.0,7,7]} color="#e9e5d7" intensity={2.7}/>
      <pointLight position={[3.2,2.5,2.5]} color="#d7a875" intensity={85} distance={7}/>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.01,0]} receiveShadow>
        <planeGeometry args={[120,120]}/>
        <meshStandardMaterial color="#202d32" roughness={.93}/>
      </mesh>
      <CameraAim position={[...camera.position]} target={[...camera.target]} fov={camera.fovDeg}/>
      <Vehicle variant="grand-tourer" color={BRAKING_EP001.carPaint} distance={state.traveledM}/>
    </ThreeCanvas>
    <BrakingGraphics state={state} cue={cue} cueFrame={local} cameraPose={camera}
      focusWorld={focus} heatReferenceJ={1500000} wheelKey="front-left"/>
  </AbsoluteFill>;
};

/** Full 9:16 kit car on the actual pre-existing track; moving road-camera context. */
export const BrakingGraphicsTrackProof:React.FC=()=>{
  const frame=useCurrentFrame(),{width,height,fps}=useVideoConfig();
  const t=frame/fps;
  const state=sampleGraphicsProofOnly(t);
  const route=sampleRoute('track',75+state.traveledM);
  const localCamera:Vec3=[-11.1+Math.sin(t*.8)*.55,4.2,8.0];
  const cameraPosition=plus(route.position,signedRotation(localCamera,route.yaw));
  const cameraTarget=plus(route.position,[0,.72,0]);
  const camera:CinematicCameraPose={
    position:cameraPosition,target:cameraTarget,fovDeg:43,focusId:'vehicle',
  };
  const anchor=plus(route.position,signedRotation(frame<84?frontCenter:wheelContact,route.yaw));
  const direction=signedRotation([1,0,0],route.yaw);
  const segments:[number,FilmCue][]= [[0,'hook'],[45,'mechanism'],[82,'grip'],[104,'abs']];
  const cut=[...segments].reverse().find(([start])=>frame>=start)??segments[0];
  return <AbsoluteFill style={{background:'#adc3cb'}}>
    <ThreeCanvas width={width} height={height} shadows camera={{
      position:[...camera.position],fov:camera.fovDeg,near:.1,far:350,
    }}>
      <WorldLighting timeOfDay="day" focus={route.position}/>
      <Environment kind="track" timeOfDay="day" seed={BRAKING_EP001.environmentSeed}/>
      <CameraAim position={[...camera.position]} target={[...camera.target]} fov={camera.fovDeg}/>
      <Vehicle variant="grand-tourer" color={BRAKING_EP001.carPaint}
        distance={state.traveledM} pose={route}/>
    </ThreeCanvas>
    <BrakingGraphics state={state} cue={cut[1]} cueFrame={frame-cut[0]}
      cameraPose={camera} focusWorld={anchor} travelDirectionWorld={direction}
      wheelKey="front-left" heatReferenceJ={1500000}/>
  </AbsoluteFill>;
};
