import React,{useMemo,useEffect} from "react";
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import * as T from "three";
import {CameraAim} from "../../../../src/yunex/world-kit/components.tsx";
import {vehicleSpec} from "../../../../src/yunex/world-kit/catalog.ts";
import {disposeObject} from "../../../../src/yunex/world-kit/geometry.ts";
import {createCinematicVehicle,animateCinematicVehicle} from "../../../../src/yunex/modelling-kit/rig.ts";
import {drivingCamera,drivingState} from "../../../../src/yunex/modelling-kit/driving.ts";
import {CinematicLighting} from "../../../../src/yunex/modelling-kit/Lighting.tsx";
import {compileRecipe,sampleRecipe} from "../../../../src/yunex/modelling-kit/recipe.ts";
import type {EpisodeRecipe} from "../../../../src/yunex/modelling-kit/recipe.ts";
import {EP005_ROUTE,sampleEP005Route} from "./route.ts";
import {createEP005NightCircuit} from "./NightCircuit.ts";
import {EP005PracticalLighting} from "./PracticalLighting.tsx";
export const EP005NightCircuitEpisode:React.FC<{recipe:EpisodeRecipe;premium?:boolean}>=({recipe,premium=true})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const compiled=useMemo(()=>compileRecipe(recipe,fps),[recipe,fps]);
 const {shot,state}=sampleRecipe(compiled,frame);
 const d=EP005_ROUTE.startDistance+(state.distance??0),pose=sampleEP005Route(d);
 const spec=vehicleSpec(recipe.vehicle.variant);
 const world=useMemo(()=>createEP005NightCircuit({premium}),[premium]);
 const vehicle=useMemo(()=>createCinematicVehicle({...recipe.vehicle,quality:"hero",lights:true,optimize:false}),[recipe.vehicle]);
 useEffect(()=>()=>disposeObject(world),[world]);useEffect(()=>()=>disposeObject(vehicle),[vehicle]);
 const absoluteState=drivingState("cruise",frame,fps);
 const ahead=sampleEP005Route(d+.25);
 const delta=Math.atan2(Math.sin(ahead.yaw-pose.yaw),Math.cos(ahead.yaw-pose.yaw));
 animateCinematicVehicle(vehicle,{...absoluteState,distance:state.distance,steer:T.MathUtils.clamp(-delta*spec.wheelbase/.25,-.4,.4)});
 vehicle.position.set(...pose.position);vehicle.rotation.y=pose.yaw;vehicle.updateMatrixWorld(true);
 const camera=drivingCamera(shot.camera,pose,spec,width/height,frame/fps,{side:1});
 return <AbsoluteFill style={{background:"#14202b"}}>
  <ThreeCanvas width={width} height={height} shadows
    camera={{fov:camera.fov,near:.035,far:350}} gl={{antialias:true}}>
   <CinematicLighting timeOfDay="dusk" focus={pose.position}/>
   <EP005PracticalLighting pose={pose} premium={premium}/>
   <primitive object={world}/>
   <primitive object={vehicle}/>
   <CameraAim {...camera}/>
  </ThreeCanvas>
 </AbsoluteFill>;
};
