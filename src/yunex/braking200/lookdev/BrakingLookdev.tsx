import React,{useEffect,useMemo} from 'react';
import * as T from 'three';
import {createVehicle} from '../../world-kit/vehicles.ts';
import {createEnvironment,sampleRoute} from '../../world-kit/environments.ts';
import {animateVehicle,placeVehicle} from '../../world-kit/motion.ts';
import {disposeObject} from '../../world-kit/geometry.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import {CameraAim} from '../../world-kit/components.tsx';
import {wheelAnchors} from '../contracts.ts';
import type {BrakingSimulationState,CinematicCameraPose,WheelKey} from '../contracts.ts';
import {BrakingWorldLighting} from './lighting.tsx';
import {BRAKING_PALETTE,createAsphaltGrain,finishKitCar,finishKitCircuit,heatLightIntensity} from './materials.ts';
import {clamp01,worldFromCar} from './math.ts';
import type {Point3} from './math.ts';

/** Designed for an existing <ThreeCanvas>. A2 owns physical movement; A1 owns
 * the disc meshes. This component only paints and illuminates the original kit.
 * previewDistanceM is for isolated material QC, not a braking simulation. */
export type BrakingLookdevProps={
  state?:BrakingSimulationState;
  previewDistanceM?:number;
  heatIllustration01?:number;
  heatByWheel?:Partial<Record<WheelKey,number>>;
  seed?:number;
  cameraPose?:CinematicCameraPose;
};
export const BrakingLookdev:React.FC<BrakingLookdevProps>=({
  state,previewDistanceM=14,heatIllustration01=0,heatByWheel,seed=12,cameraPose
})=>{
  const distance=state?.traveledM??previewDistanceM;
  const pose=sampleRoute('track',distance);
  const car=useMemo(()=>{
    const fresh=createVehicle({variant:'grand-tourer',color:BRAKING_PALETTE.paint,
      accent:BRAKING_PALETTE.caliper});
    finishKitCar(fresh);return fresh;
  },[]);
  const circuit=useMemo(()=>{
    const fresh=createEnvironment({kind:'track',seed,timeOfDay:'day'});
    finishKitCircuit(fresh);return fresh;
  },[seed]);
  const grain=useMemo(()=>createAsphaltGrain(seed),[seed]);
  useEffect(()=>()=>disposeObject(car),[car]);
  useEffect(()=>()=>disposeObject(circuit),[circuit]);
  useEffect(()=>()=>disposeObject(grain),[grain]);
  // Kit's rotor caliper remains attached to axle; wheel-roll alone rotates.
  // Reproducible seek-stable frame motion uses A2 distance when provided.
  animateVehicle(car,distance);
  placeVehicle(car,pose);
  const anchors=wheelAnchors(vehicleSpec('grand-tourer'));
  return <>
    <BrakingWorldLighting focus={pose.position}/>
    <primitive object={circuit}/>
    <primitive object={grain}/>
    <primitive object={car}/>
    {anchors.map((a)=>{
      const local:Point3=[a.center[0],a.center[1],a.center[2]];
      const world=worldFromCar(local,pose.position,pose.yaw);
      const h=clamp01(heatByWheel?.[a.id]??heatIllustration01);
      return <pointLight key={a.id} position={world} color="#ec9f58"
        intensity={heatLightIntensity(h)} distance={1.25} decay={2}/>;
    })}
    {cameraPose&&<CameraAim position={[...cameraPose.position]} target={[...cameraPose.target]} fov={cameraPose.fovDeg}/>}
  </>;
};
