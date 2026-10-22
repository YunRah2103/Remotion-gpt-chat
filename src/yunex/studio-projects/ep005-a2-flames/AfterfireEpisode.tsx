/** Actual Agent 1 hero is SHA-pinned as isolated review input.
 * This is an FX acceptance film, not an approved A1 master or final EP005 edit.
 */
import React,{useEffect,useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {CameraAim} from '../../world-kit/components';
import {sampleRoute} from '../../world-kit/environments.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import {disposeObject} from '../../world-kit/geometry.ts';
import type {V3} from '../../world-kit/geometry.ts';
import {animateCinematicVehicle} from '../../modelling-kit/rig.ts';
import {createCinematicEnvironment} from '../../modelling-kit/environments.ts';
import {CinematicLighting} from '../../modelling-kit/Lighting';
import {drivingCamera} from '../../modelling-kit/driving.ts';
import {compileRecipe,sampleRecipe} from '../../modelling-kit/recipe.ts';
import type {EpisodeRecipe} from '../../modelling-kit/recipe.ts';
import {animateComponents} from '../../modelling-kit/authoring.ts';
import {createEp005Hero} from '../../../../production/yunex/supercar_flames_ep005/flames/hero-reference/hero.ts';
import {sampleAfterfire,ep005PreviewEngineState} from '../../../../production/yunex/supercar_flames_ep005/flames/afterfire.ts';
import {readExhaustMounts,createAfterfireRig,animateAfterfireRig} from '../../../../production/yunex/supercar_flames_ep005/flames/exhaust-rig.ts';
import {createAfterfireMechanicalStage,animateAfterfireMechanicalStage} from '../../../../production/yunex/supercar_flames_ep005/flames/mechanical-stage.ts';

export const AfterfireEpisode:React.FC<{recipe:EpisodeRecipe}>=({recipe})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const compiled=useMemo(()=>compileRecipe(recipe,fps),[recipe,fps]);
 const sample=sampleRecipe(compiled,frame),{shot,state}=sample;
 const s=vehicleSpec(recipe.vehicle.variant),mechanic=shot.id==='mechanism';
 const world=useMemo(()=>createCinematicEnvironment({...recipe.world,quality:'hero'}),[recipe.world]);
 // The exact A1 source build (including physically hollow .085 m inner bore),
 // not a generic V3 car with guessed stand-in tailpipe sockets.
 const vehicle=useMemo(()=>createEp005Hero(),[]);
 const effects=useMemo(()=>createAfterfireRig(vehicle),[vehicle]);
 const mechanics=useMemo(()=>{const g=createAfterfireMechanicalStage();g.position.set(0,1.62,0);return g;},[]);
 useEffect(()=>()=>{disposeObject(world);disposeObject(vehicle);disposeObject(mechanics);},[world,vehicle,mechanics]);
 const pose=sampleRoute(recipe.world.kind,(state.distance??0)+55);
 const ahead=sampleRoute(recipe.world.kind,(state.distance??0)+55.45);
 const dYaw=Math.atan2(Math.sin(ahead.yaw-pose.yaw),Math.cos(ahead.yaw-pose.yaw));
 const steering=T.MathUtils.clamp(-dYaw/.45*s.wheelbase,-.38,.38);
 animateCinematicVehicle(vehicle,{...state,steer:steering});
 animateComponents(vehicle,sample.joints);
 vehicle.position.fromArray(pose.position);vehicle.rotation.y=pose.yaw;vehicle.updateMatrixWorld(true);
 const ports=readExhaustMounts(vehicle);
 const kind=shot.id as 'hook'|'tailpipe'|'mechanism'|'wide';
 const combustion=sampleAfterfire(frame,fps,ep005PreviewEngineState(kind,sample.localFrame/fps),ports);
 animateAfterfireRig(effects,combustion);
 animateAfterfireMechanicalStage(mechanics,frame,fps);
 const carCamera=drivingCamera(shot.camera,pose,s,width/height,frame/fps,{side:1});
 let camera=carCamera;
 if(!mechanic&&shot.id!=='wide'){
  // No anonymous isolated flame closeups: car remains recognisable.
  const close=shot.id==='tailpipe';
  const cam=new T.Vector3(close?-5.65:-8.1,close?1.38:2.2,close?2.55:4.5);
  const focus=new T.Vector3(close?-2.43:-1.25,close?.51:.66,0);
  const transform=(v:T.Vector3)=>v.applyAxisAngle(new T.Vector3(0,1,0),pose.yaw).add(new T.Vector3(...pose.position)).toArray() as V3;
  camera={position:transform(cam),target:transform(focus),fov:close?40:43};
 }
 if(mechanic){
  // Engine + manifold + catalyst + muffler + physical tip fit simultaneously
  // inside the portrait width. World hidden to prevent opaque road occlusion.
  camera={position:[0,3.55,11.4],target:[0,1.63,0],fov:48};
 }
 return <AbsoluteFill style={{background:'#0c1821'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{fov:camera.fov,near:.025,far:500}} gl={{antialias:true}}>
   <CinematicLighting focus={mechanic?[0,1.62,0]:pose.position} timeOfDay={mechanic?'dusk':'night'}/>
   {mechanic?<><ambientLight intensity={1.05}/><directionalLight position={[1,8,11]} intensity={3.1} color="#d7edff"/><pointLight position={[2.4,3.9,2.8]} intensity={18} distance={9} color="#ffb36e"/></>:<pointLight position={[pose.position[0]-3,2.5,pose.position[2]+2.9]} intensity={8} distance={8} color="#cceafa"/>}
   {mechanic?<color attach="background" args={['#0e1b26']}/>:<primitive object={world}/>}
   {mechanic?<primitive object={mechanics}/>:<primitive object={vehicle}/>}
   <CameraAim {...camera}/>
   {!mechanic?<pointLight position={[pose.position[0]-2.6,.85,pose.position[2]]} color="#e96634" intensity={.25} distance={2.6}/>:null}
  </ThreeCanvas>
  <div style={{position:'absolute',top:'7%',left:'7%',right:'7%',fontFamily:'Arial',fontSize:21,fontWeight:700,letterSpacing:2.1,color:'#eaf3f5',textShadow:'0 2px 7px #001219'}}>
   YUNEX / EP005 / EXHAUST AFTERFIRE
  </div>
  {mechanic?
   <div style={{position:'absolute',top:'18%',left:'7%',right:'7%',padding:'18px 21px',background:'rgba(8,22,32,.75)',borderLeft:'4px solid #f98a47',fontFamily:'Arial',fontSize:24,color:'#ffd1ac',fontWeight:700,lineHeight:1.4}}>
    WHY FLAMES APPEAR
    <div style={{fontSize:29,color:'#f7f8f7',marginTop:10}}>Unburnt fuel can ignite in hot exhaust.</div>
    <div style={{fontSize:21,color:'#b3ced9',marginTop:9}}>3D gas-flow illustration, not calibrated CFD.</div>
   </div>
  :<div style={{position:'absolute',top:'11%',left:'7%',right:'7%',fontFamily:'Arial',fontSize:22,fontWeight:600,color:'#ffb98c'}}>
    REAL METAL TAILPIPES · SHORT-LIVED AFTERFIRE
   </div>}
  {mechanic?<div style={{position:'absolute',top:'66%',left:'5%',right:'5%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:6,fontFamily:'Arial',fontSize:19,fontWeight:700,color:'#f8e1c6',textAlign:'center'}}>
   {['V8','HEADERS','CATALYST','MUFFLER','TIP'].map((name,i)=><React.Fragment key={name}><div style={{padding:'8px 5px',borderTop:'2px solid #ec9558',flex:'1 1 0',background:'rgba(7,20,31,.80)'}}>{name}</div>{i<4?<span style={{color:'#ef9d69'}}>→</span>:null}</React.Fragment>)}
  </div>:null}
  <div style={{position:'absolute',bottom:'12%',left:'7%',right:'7%',padding:'12px 14px',background:'rgba(6,19,29,.72)',borderLeft:'5px solid #fc8b43',fontFamily:'Arial',fontSize:41,fontWeight:800,color:'#fff',lineHeight:1.19}}>
   {mechanic?'UNBURNT FUEL + HOT EXHAUST = POSSIBLE IGNITION':sample.caption}
  </div>
  <div style={{position:'absolute',bottom:'7%',left:'7%',right:'7%',fontFamily:'Arial',fontSize:20,color:'#c2d2d8'}}>
   SILENT VISUAL REVIEW  ·  A1 METAL PORTS  ·  EFFECT IS ILLUSTRATIVE
  </div>
 </AbsoluteFill>;
};
