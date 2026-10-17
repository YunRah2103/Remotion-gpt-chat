/** Agent 4 REAL-MODEL CAMERA INTEGRATION TEST ONLY.
 * Imports PINNED, unmodified A1 vehicle, A2 mechanical assembly and A5 lookdev.
 * Not a full film; no master Root change; no stand-in model geometry.
 */
import React,{useEffect,useRef} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {VehicleWorld} from '../vehicle/VehicleWorld';
import {TurboMechanism} from '../mechanism/TurboMechanism';
import {TURBO_PORTS,TURBO_PIVOTS} from '../mechanism/ports';
import {YunexLights,RoadAtmosphere,ExhaustHeat,applyYunexMaterials,YUNEX_LOOK} from '../lookdev/YunexLookdev';
import {YunexReflectionEnvironment} from '../lookdev/YunexReflectionEnvironment';
import {CameraDirector} from './CameraDirector';
import {SceneLabels} from './KineticLabels';
import type {Anchors,Shot,Vec3} from './cameraMath';

export type RealModelVariant='realHook'|'realExhaust'|'realShaft'|'realCharge'|'realRoad';
const pt=(p:readonly [number,number,number]):Vec3=>[p[0],p[1],p[2]];
const MECH_ANCHORS:Anchors={
 TURBINE:pt(TURBO_PIVOTS.TURBINE_ROTOR),
 SHAFT:pt(TURBO_PIVOTS.SHAFT),
 COMPRESSOR:pt(TURBO_PIVOTS.COMPRESSOR_ROTOR),
 EXHAUST_IN:pt(TURBO_PORTS.EXHAUST_IN),
 COMPRESSED_AIR_OUT:pt(TURBO_PORTS.COMPRESSED_AIR_OUT),
 INTERCOOLER_OUT:pt(TURBO_PORTS.INTERCOOLER_OUT),
 ENGINE_INTAKE:pt(TURBO_PORTS.ENGINE_INTAKE),
};
const CAR_ANCHORS:Anchors={CAR:[0,.76,0]};
/** Opt-in A5 surface binding; preserves source model mesh/port ownership. */
const RealModelMaterialAdapter:React.FC<{children:React.ReactNode}>=({children})=>{
 const root=useRef<THREE.Group>(null);
 useEffect(()=>root.current?applyYunexMaterials(root.current):undefined,[]);
 return <group ref={root}>{children}</group>;
};
const A2Stage:React.FC<{frame:number;variant:RealModelVariant}>=({frame,variant})=>{
 const full=variant==='realCharge';
 const shot:Shot=variant==='realHook'?'hookOrbit':variant==='realExhaust'?'hookRush':variant==='realShaft'?'shaftFollow':'chargeGlide';
 const duration=variant==='realShaft'||full?120:90;
 return <>
  <color attach="background" args={[YUNEX_LOOK.background]}/>
  <fog attach="fog" args={[YUNEX_LOOK.background,13,30]}/>
  <YunexReflectionEnvironment variant={full?'charge':'turbine'} intensity={.88}/>
  <YunexLights sceneVariant={full?'charge':'turbine'} shadows/>
  <mesh position={[0,-2.66,-.9]} receiveShadow>
   <boxGeometry args={[18,.13,17]}/>
   <meshStandardMaterial color="#10222C" metalness={.2} roughness={.8}/>
  </mesh>
  <RealModelMaterialAdapter>
   <TurboMechanism frame={frame} variant={full?'full':'turbo'} cutaway={1}/>
  </RealModelMaterialAdapter>
  <ExhaustHeat frame={frame} position={[-1.13,.74,.42]} intensity={variant==='realExhaust'?.8:.55}/>
  <CameraDirector frame={frame} shot={shot} anchors={MECH_ANCHORS} durationInFrames={duration}/>
 </>;
};
const A1Stage:React.FC<{frame:number}>=({frame})=><>
  <YunexReflectionEnvironment variant="road" intensity={.88}/>
  <RealModelMaterialAdapter>
   <VehicleWorld frame={frame} variant="hero" travelMeters={frame*.38}/>
  </RealModelMaterialAdapter>
  {/* A1 already has environment lighting. A5 augments, never doubles its full rig. */}
  <YunexLights sceneVariant="road" augment shadows={false}/>
  <RoadAtmosphere frame={frame} visibility={.65}/>
  <CameraDirector frame={frame} shot="roadHero" anchors={CAR_ANCHORS} durationInFrames={120}/>
 </>;
export const RealModelPreview:React.FC<{variant:RealModelVariant}>=({variant})=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig(),road=variant==='realRoad';
 const label=variant==='realHook'?'hookA':variant==='realExhaust'?'hookB':variant==='realShaft'?'shaft':variant==='realCharge'?'charge':'road';
 return <AbsoluteFill style={{background:YUNEX_LOOK.background,overflow:'hidden'}}>
  <ThreeCanvas width={width} height={height} shadows gl={{antialias:true,preserveDrawingBuffer:true}} camera={{position:[0,1,7],fov:40,near:.08,far:180}}>
   {road?<A1Stage frame={frame}/>:<A2Stage frame={frame} variant={variant}/>}
  </ThreeCanvas>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(1,5,9,.18) 0%,transparent 23%,transparent 76%,rgba(1,6,10,.20) 100%)',pointerEvents:'none'}}/>
  <SceneLabels frame={frame} variant={label}/>
 </AbsoluteFill>;
};
