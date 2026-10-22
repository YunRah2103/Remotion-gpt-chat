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
import {createEP005NightBoulevard} from "./NightBoulevard.ts";
import {EP005PracticalLighting} from "./PracticalLighting.tsx";

/** All poses sampled at absolute frames; no cumulative drift, car tyre spin never freezes. */
export const EP005NightBoulevardEpisode:React.FC<{recipe:EpisodeRecipe;premium?:boolean}>=({recipe,premium=true})=>{
  const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
  const compiled=useMemo(()=>compileRecipe(recipe,fps),[recipe,fps]);
  const {shot,state}=sampleRecipe(compiled,frame);
  const routeDistance=EP005_ROUTE.startDistance+(state.distance??0);
  const pose=sampleEP005Route(routeDistance);
  const spec=vehicleSpec(recipe.vehicle.variant);
  const world=useMemo(()=>createEP005NightBoulevard({premium}),[premium]);
  const vehicle=useMemo(()=>createCinematicVehicle({
    ...recipe.vehicle,quality:"hero",lights:true,optimize:false
  }),[recipe.vehicle]);
  useEffect(()=>()=>disposeObject(world),[world]);
  useEffect(()=>()=>disposeObject(vehicle),[vehicle]);
  // All shot actions in this environment look test are cruise: V3's analytic 12 m/s integral.
  const stateAbsolute=drivingState("cruise",frame,fps);
  const next=sampleEP005Route(routeDistance+.25);
  const dyaw=Math.atan2(Math.sin(next.yaw-pose.yaw),Math.cos(next.yaw-pose.yaw));
  animateCinematicVehicle(vehicle,{...stateAbsolute,distance:state.distance,steer:T.MathUtils.clamp(-dyaw*spec.wheelbase/.25,-.4,.4)});
  vehicle.position.set(...pose.position);vehicle.rotation.y=pose.yaw;vehicle.updateMatrixWorld(true);
  const camera=drivingCamera(shot.camera,pose,spec,width/height,frame/fps,{side:1});
  return <AbsoluteFill style={{background:"#101b25"}}>
    <ThreeCanvas width={width} height={height} shadows
      camera={{fov:camera.fov,near:.035,far:340}} gl={{antialias:true}}>
      <CinematicLighting timeOfDay="night" focus={pose.position}/>
      <EP005PracticalLighting pose={pose} premium={premium}/>
      <primitive object={world}/>
      <primitive object={vehicle}/>
      <CameraAim {...camera}/>
    </ThreeCanvas>
  </AbsoluteFill>;
};
