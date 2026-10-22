/** EP005 asset review film. Native Remotion composition; no invented narration. */
import React,{useMemo,useEffect} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {CameraAim} from '../../../../src/yunex/world-kit/components.tsx';
import {sampleRoute} from '../../../../src/yunex/world-kit/environments.ts';
import {vehicleSpec} from '../../../../src/yunex/world-kit/catalog.ts';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {createCinematicEnvironment} from '../../../../src/yunex/modelling-kit/environments.ts';
import {CinematicLighting} from '../../../../src/yunex/modelling-kit/Lighting.tsx';
import {drivingCamera} from '../../../../src/yunex/modelling-kit/driving.ts';
import {compileRecipe,sampleRecipe} from '../../../../src/yunex/modelling-kit/recipe.ts';
import {animateCinematicVehicle} from '../../../../src/yunex/modelling-kit/rig.ts';
import {animateComponents} from '../../../../src/yunex/modelling-kit/authoring.ts';
import type {EpisodeRecipe} from '../../../../src/yunex/modelling-kit/recipe.ts';
import {createEp005Hero} from './hero.ts';

/**
 * Uses the same validated V3 route and animator as StudioEpisode, with an
 * Agent-1-specific factory so custom hollow nozzles/cabin details are actually
 * in every moving frame. The source recipe and native 1080x1920/30fps pipeline
 * remain unchanged. No flames: they belong to Agent 2.
 */
export const HeroEpisode:React.FC<{recipe:EpisodeRecipe}>=({recipe})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const timeline=useMemo(()=>compileRecipe(recipe,fps),[recipe,fps]);
 const sample=sampleRecipe(timeline,frame),{shot,state}=sample,s=vehicleSpec(recipe.vehicle.variant);
 const world=useMemo(()=>createCinematicEnvironment({...recipe.world,quality:'hero'}),[recipe.world]);
 const vehicle=useMemo(()=>createEp005Hero(),[]);
 useEffect(()=>()=>{disposeObject(vehicle);disposeObject(world);},[vehicle,world]);
 const distance=(state.distance??0)-30;
 const pose=sampleRoute(recipe.world.kind,distance);
 const ahead=sampleRoute(recipe.world.kind,distance+.4);
 const delta=Math.atan2(Math.sin(ahead.yaw-pose.yaw),Math.cos(ahead.yaw-pose.yaw));
 const steer=T.MathUtils.clamp(-delta/.4*s.wheelbase,-.4,.4);
 animateCinematicVehicle(vehicle,{...state,steer});
 animateComponents(vehicle,sample.joints);
 vehicle.position.fromArray(pose.position);
 vehicle.rotation.set(0,pose.yaw,0);
 vehicle.updateMatrixWorld(true);
 const head=vehicle.getObjectByName('head');if(head)head.visible=shot.camera!=='onboard';
 let camera=drivingCamera(shot.camera,pose,s,width/height,frame/fps,{side:-1});
 // Orbit is a moving-reveal shot on a moving route. The camera does not freeze
 // the car or substitute a static showroom rotation for real pavement contact.
 if(shot.id==='moving-orbit'){
  const a=-2.35+sample.localFrame/Math.max(1,shot.duration*fps-1)*1.38;
  const local=new T.Vector3(Math.cos(a)*s.length*1.8,s.height*1.65,Math.sin(a)*s.length*1.8);
  const pivot=new T.Vector3(...pose.position);
  const p=local.applyAxisAngle(new T.Vector3(0,1,0),pose.yaw).add(pivot);
  camera={position:p.toArray() as [number,number,number],target:new T.Vector3(0,s.height*.46,0).applyAxisAngle(new T.Vector3(0,1,0),pose.yaw).add(pivot).toArray() as [number,number,number],fov:39};
 }
 const drawCaption=sample.caption;
 return <AbsoluteFill style={{backgroundColor:'#14232d'}}>
  <ThreeCanvas width={width} height={height} shadows gl={{antialias:true}} camera={{fov:camera.fov,near:.025,far:500}}>
   <CinematicLighting focus={pose.position} timeOfDay={recipe.world.timeOfDay??'day'}/>
   <primitive object={world}/><primitive object={vehicle}/><CameraAim {...camera}/>
   {shot.camera==='interior'?<pointLight position={camera.position} intensity={1.2} distance={5} color="#daebf2"/>:null}
  </ThreeCanvas>
  <div style={{position:'absolute',top:'6%',left:'7%',fontFamily:'Arial,sans-serif',fontSize:23,fontWeight:800,letterSpacing:3,color:'#e5f2f4',textShadow:'0 2px 8px #00131d'}}>YUNEX / HERO DEVELOPMENT</div>
  {drawCaption?<div style={{position:'absolute',bottom:'12%',left:'7%',right:'7%',padding:'19px 22px',fontFamily:'Arial,sans-serif',fontSize:44,fontWeight:800,lineHeight:1.15,color:'#fff',background:'rgba(8,21,28,.72)',borderLeft:'5px solid #44d1c4'}}>{drawCaption}</div>:null}
  <div style={{position:'absolute',bottom:'5.8%',left:'7%',fontFamily:'Arial,sans-serif',fontSize:17,color:'#ccdce1'}}>MODEL / DRIVING / EXHAUST FIT CHECK — SILENT</div>
 </AbsoluteFill>;
};
