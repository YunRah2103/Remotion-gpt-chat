import React,{useEffect,useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {CameraAim} from '../../../../src/yunex/world-kit/components';
import {createCinematicVehicle,animateCinematicVehicle} from '../../../../src/yunex/modelling-kit/rig.ts';
import {createCinematicEnvironment} from '../../../../src/yunex/modelling-kit/environments.ts';
import {CinematicLighting} from '../../../../src/yunex/modelling-kit/Lighting';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import type {RouteSampler,CinemaSample} from './timeline.ts';
import {sampleCinema} from './timeline.ts';

/** Import seam only. Requires reviewed named exhaust ports from Agent 1 and
 * anchored deterministic flame factories from Agent 2, never guess mounts. */
export type CinemaIntegration={
 createHero?:()=>T.Group;
 createWorld?:()=>T.Group;
 routeSampler?:RouteSampler;
 flames?:{create:(hero:T.Group)=>T.Group;animate:(group:T.Group,sample:CinemaSample)=>void};
 /** Optional Agent-2 named-port rig, instantiated only with an Agent-1 approved hero. */
 attachAfterfire?:(hero:T.Group)=>(sample:CinemaSample)=>void;
 /** Agent-4 practical track lights, tied to the same route pose and actual ignition envelope. */
 practicalLight?:(sample:CinemaSample)=>React.ReactNode;
};
export const EP005DrivingFilm:React.FC<{integration?:CinemaIntegration}>=({integration})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const sample=sampleCinema(frame,fps,integration?.routeSampler);
 const {pose,shot,afterfireDemand}=sample;
 const hero=useMemo(()=>integration?.createHero?.()??createCinematicVehicle({
  variant:'supercar',color:'#d33d4e',driver:true,quality:'hero',lights:true,optimize:false
 }),[integration]);
 const world=useMemo(()=>integration?.createWorld?.()??createCinematicEnvironment({
  kind:'track',seed:21,timeOfDay:'dusk',wetness:.1,quality:'hero'
 }),[integration]);
 const flames=useMemo(()=>integration?.flames?.create(hero),[integration,hero]);
 const updateAfterfire=useMemo(()=>integration?.attachAfterfire?.(hero),[integration,hero]);
 useEffect(()=>()=>{disposeObject(hero);disposeObject(world);},[hero,world]);
 if(flames&&!flames.parent)hero.add(flames);
 const cutaway=shot.id==='mechanism'?.72:shot.id==='engine-reveal'?.30:0;
 animateCinematicVehicle(hero,{
  frame:sample.frame,fps,distance:sample.distanceMeters,steer:sample.steerRadians,
  cutaway,highlight:cutaway?'engine':undefined,compression:.008,
  heat:afterfireDemand*.25,gearChange:sample.gearChange
 });
 hero.position.fromArray(pose.position);
 hero.rotation.y=pose.yaw;
 hero.updateMatrixWorld(true);
 if(flames)integration?.flames?.animate(flames,sample);
 // Exhaust socket positions are resolved AFTER the real V3 animated body is placed.
 updateAfterfire?.(sample);
 return <AbsoluteFill style={{background:'#111c25'}}>
  <AbsoluteFill style={{filter:'brightness(.9) contrast(1.10) saturate(1.12)'}}>
   <ThreeCanvas width={width} height={height} shadows camera={{fov:sample.camera.fov,near:.025,far:600}} gl={{antialias:true}}>
    <CinematicLighting focus={pose.position} timeOfDay={integration?.practicalLight?'night':'dusk'}/>
    {integration?.practicalLight?.(sample)}
    <primitive object={world}/>
    <primitive object={hero}/>
    <CameraAim {...sample.camera}/>
   </ThreeCanvas>
  </AbsoluteFill>
 </AbsoluteFill>;
};
