import React,{useEffect,useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {CameraAim} from '../../world-kit/components';
import {sampleRoute} from '../../world-kit/environments.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import {disposeObject} from '../../world-kit/geometry.ts';
import type {V3} from '../../world-kit/geometry.ts';
import {createCinematicVehicle,animateCinematicVehicle} from '../../modelling-kit/rig.ts';
import {createCinematicEnvironment} from '../../modelling-kit/environments.ts';
import {CinematicLighting} from '../../modelling-kit/Lighting';
import {partInspectionCamera} from '../../modelling-kit/studio-camera.ts';
import {drivingCamera} from '../../modelling-kit/driving.ts';
import {compileRecipe,sampleRecipe} from '../../modelling-kit/recipe.ts';
import type {EpisodeRecipe} from '../../modelling-kit/recipe.ts';
import {animateAssembly} from '../../modelling-kit/authoring.ts';
import {sampleAfterfire,ep005PreviewEngineState} from '../../../../production/yunex/supercar_flames_ep005/flames/afterfire.ts';
import {addProvisionalPreviewExhaust,readExhaustMounts,createAfterfireRig,animateAfterfireRig,createAfterfireCutaway} from '../../../../production/yunex/supercar_flames_ep005/flames/exhaust-rig.ts';

/** Isolated silent engineering test film, NOT an Agent 1 hero-geometry approval. */
export const AfterfireEpisode:React.FC<{recipe:EpisodeRecipe}>=({recipe})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const compiled=useMemo(()=>compileRecipe(recipe,fps),[recipe,fps]);
 const sample=sampleRecipe(compiled,frame),{shot,state}=sample;
 const spec=vehicleSpec(recipe.vehicle.variant);
 const world=useMemo(()=>createCinematicEnvironment({...recipe.world,quality:'hero'}),[recipe.world]);
 const vehicle=useMemo(()=>{
  const g=createCinematicVehicle({...recipe.vehicle,quality:'hero',lights:true,optimize:false});
  addProvisionalPreviewExhaust(g);return g;
 },[recipe.vehicle]);
 const effects=useMemo(()=>createAfterfireRig(vehicle,{requireAuthoritative:false}),[vehicle]);
 const mechanics=useMemo(()=>{const g=createAfterfireCutaway();g.position.y=1.7;return g;},[]);
 useEffect(()=>()=>disposeObject(world),[world]);
 useEffect(()=>()=>disposeObject(vehicle),[vehicle]);
 useEffect(()=>()=>disposeObject(mechanics),[mechanics]);
 const distance=(state.distance??0)-30;
 const pose=sampleRoute(recipe.world.kind,distance);
 const ahead=sampleRoute(recipe.world.kind,distance+.4);
 const steering=T.MathUtils.clamp(-Math.atan2(Math.sin(ahead.yaw-pose.yaw),Math.cos(ahead.yaw-pose.yaw))/.4*spec.wheelbase,-.4,.4);
 animateCinematicVehicle(vehicle,{...state,steer:steering});
 vehicle.position.fromArray(pose.position);vehicle.rotation.y=pose.yaw;vehicle.updateMatrixWorld(true);
 const kind=shot.id as 'hook'|'tailpipe'|'mechanism'|'wide';
 const afterfire=sampleAfterfire(frame,fps,ep005PreviewEngineState(kind,sample.localFrame/fps),readExhaustMounts(vehicle));
 animateAfterfireRig(effects,afterfire);
 animateAssembly(mechanics,frame,fps);
 const mechanic=shot.id==='mechanism';
 const carCamera=drivingCamera(shot.camera,pose,spec,width/height,frame/fps,{side:1});
 let camera=carCamera;
 if(!mechanic&&shot.id!=='wide'){
  const cameraLocal=new T.Vector3(-spec.length*(shot.id==='hook'?1.35:.93),spec.height*(shot.id==='hook'?1.05:.72),spec.width*(shot.id==='hook'?1.0:.73));
  const targetLocal=new T.Vector3(-spec.length*.40,spec.height*.37,0);
  const transform=(v:T.Vector3)=>v.applyAxisAngle(new T.Vector3(0,1,0),pose.yaw).add(new T.Vector3(...pose.position)).toArray() as V3;
  camera={position:transform(cameraLocal),target:transform(targetLocal),fov:shot.id==='hook'?46:43};
 }
 if(mechanic)camera=partInspectionCamera(mechanics,width/height,{azimuth:-1.10+sample.localFrame/(shot.duration*fps)*.42,elevation:.23});
 const caption=sample.caption;
 return <AbsoluteFill style={{backgroundColor:'#15202a'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{fov:46,near:.025,far:500}} gl={{antialias:true}}>
   <CinematicLighting focus={mechanic?[0,1.7,0]:pose.position} timeOfDay={recipe.world.timeOfDay??'dusk'}/>
   <primitive object={world}/>
   {mechanic?<primitive object={mechanics}/>:<primitive object={vehicle}/>}
   <CameraAim {...camera}/>
  </ThreeCanvas>
  <div style={{position:'absolute',top:'7%',left:'7%',right:'7%',font:'700 21px Arial',color:'#f5dfc9',letterSpacing:1.5}}>
   YUNEX / EP005 / AFTERFIRE ENGINEERING PREVIEW
  </div>
  <div style={{position:'absolute',top:'11%',left:'7%',right:'7%',font:'600 22px Arial',color:'#ffb679',lineHeight:1.25}}>
   {mechanic?'SCHEMATIC EXHAUST / FLOW MARKERS ARE ILLUSTRATIVE':'PROVISIONAL EXHAUST MOUNTS — AWAIT AGENT 1'}
  </div>
  <div style={{position:'absolute',bottom:'12%',left:'7%',right:'7%',font:'700 41px Arial',lineHeight:1.2,color:'#fff',textShadow:'0 2px 12px #000'}}>
   {caption}
  </div>
  <div style={{position:'absolute',bottom:'7%',left:'7%',right:'7%',font:'500 20px Arial',color:'#bed1d7'}}>
   SILENT PROOF / NOT FINAL FILM / NO CALIBRATED COMBUSTION CLAIM
  </div>
 </AbsoluteFill>;
};
