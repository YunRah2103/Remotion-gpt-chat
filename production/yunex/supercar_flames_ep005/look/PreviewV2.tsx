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
import {createEP005CinematicNightCircuit} from "./CinematicNight.ts";
import {EP005PracticalLighting,EP005NightAtmosphere} from "./PracticalLighting.tsx";

/** Matched original V3 route, absolute driving/steer, no car teleport across cuts. */
export const EP005CinematicLookEpisode:React.FC<{recipe:EpisodeRecipe;premium?:boolean}>=({recipe,premium=true})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const compiled=useMemo(()=>compileRecipe(recipe,fps),[recipe,fps]);
 const {shot}=sampleRecipe(compiled,frame);
 // Shared A3 distanceAt: exact continuous analytic metres, never reset at cut boundaries.
 const t=frame/fps,distance=12*t+.30*t*t+t-25/(2*Math.PI)*Math.sin(2*Math.PI*t/25);
 const d=EP005_ROUTE.startDistance+distance,pose=sampleEP005Route(d);
 const spec=vehicleSpec(recipe.vehicle.variant);
 const world=useMemo(()=>premium?createEP005CinematicNightCircuit():createEP005NightCircuit({premium:true}),[premium]);
 const vehicle=useMemo(()=>createCinematicVehicle({...recipe.vehicle,quality:"hero",lights:true,optimize:false}),[recipe.vehicle]);
 useEffect(()=>()=>disposeObject(world),[world]);useEffect(()=>()=>disposeObject(vehicle),[vehicle]);
 const absoluteState=drivingState("cruise",frame,fps);
 const ahead=sampleEP005Route(d+.25);
 const delta=Math.atan2(Math.sin(ahead.yaw-pose.yaw),Math.cos(ahead.yaw-pose.yaw));
 animateCinematicVehicle(vehicle,{...absoluteState,distance,
  steer:T.MathUtils.clamp(-delta*spec.wheelbase/.25,-.4,.4)});
 vehicle.position.set(...pose.position);vehicle.rotation.y=pose.yaw;vehicle.updateMatrixWorld(true);
 // The old look study left the car tiny in portrait. Tighten without altering route,
 // and apply the same lens/position to BOTH comparison compositions.
 const lens=drivingCamera(shot.camera,pose,spec,width/height,frame/fps,{side:1});
 const eye=new T.Vector3(...lens.position).lerp(new T.Vector3(...lens.target),.18);
 const camera={...lens,position:[eye.x,eye.y,eye.z] as [number,number,number],
  fov:Math.max(37,lens.fov*.87)};
 return <AbsoluteFill style={{background:"#071320"}}>
  <ThreeCanvas width={width} height={height} shadows
   camera={{fov:camera.fov,near:.035,far:350}} gl={{antialias:true}}>
   <CinematicLighting timeOfDay="night" focus={pose.position}/>
   <EP005NightAtmosphere premium={true}/>
   <EP005PracticalLighting pose={pose} premium={true}/>
   <primitive object={world}/>
   <primitive object={vehicle}/>
   <CameraAim {...camera}/>
  </ThreeCanvas>
 </AbsoluteFill>;
};
