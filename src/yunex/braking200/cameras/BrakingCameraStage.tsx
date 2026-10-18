/**
 * Agent 3 vehicle choreography and real kit track stage.
 * No fabricated braking physics: consumers MUST inject Agent 2's sampler
 * and film-time to simulation-time mapping. Agent 1 may mount brake hardware
 * via children; Agent 4 owns replacing the basic kit lighting.
 */
import React,{useEffect,useMemo} from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import type {Object3D} from 'three';
import {BRAKING_EP001,wheelAnchors} from '../contracts.ts';
import type {BrakingSimulationState,SampleBrakingSimulation,Vec3} from '../contracts.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import type {RoutePose} from '../../world-kit/environments.ts';
import {sampleRoute} from '../../world-kit/environments.ts';
import {createVehicle} from '../../world-kit/vehicles.ts';
import {disposeObject} from '../../world-kit/geometry.ts';
import {CameraAim,Environment,WorldLighting} from '../../world-kit/components.tsx';
import {sampleCameraPose} from './cameraRig.ts';
import type {CameraSampleOptions} from './cameraRig.ts';

const spec=vehicleSpec(BRAKING_EP001.vehicleVariant);
export type BrakingCameraFrame={
  filmFrame:number;
  simulationTimeSec:number;
  state:BrakingSimulationState;
  route:RoutePose;
  shotCamera:ReturnType<typeof sampleCameraPose>;
};
export type CameraFilmProps={
  sampleBrakingSimulation:SampleBrakingSimulation;
  simulationTimeAtFilmFrame:(frame:number,fps:number)=>number;
  startDistanceM?:number;
  cameraOptions?:CameraSampleOptions;
  /**
   * Integrated film: supply Agent 1's vehicle instead of the bare world-kit car,
   * for example renderVehicle={({state,route}) => <EngineeringBrakingVehicle
   * simulation={state} pose={route} cutawayWheel="front-left" />}.
   * No direct dependency on another agent's unmerged branch.
   */
  renderVehicle?:(sample:BrakingCameraFrame)=>React.ReactNode;
  /** Optional Agent 4 scene lighting override, not ownership of lighting in A3. */
  renderLighting?:(sample:BrakingCameraFrame)=>React.ReactNode;
  /** Optional additional world props; does not inherit the vehicle transform. */
  children?:React.ReactNode;
  /**
   * Optional render slot for self-contained proof watermark.
   * Not an editorial or film graphics API (Agent 5 owns typography).
   */
  overlay?:React.ReactNode;
};
export function sampleBrakingCameraFrame(
  filmFrame:number,fps:number,sampler:SampleBrakingSimulation,
  simTimeAtFilmFrame:(frame:number,fps:number)=>number,
  startDistanceM=0,cameraOptions:CameraSampleOptions={},
):BrakingCameraFrame {
  const simulationTimeSec=simTimeAtFilmFrame(filmFrame,fps);
  if(!Number.isFinite(simulationTimeSec)||simulationTimeSec<0){
    throw new Error('Agent 3: film-to-simulation map must return a finite nonnegative time');
  }
  const state=sampler(simulationTimeSec);
  if(!Number.isFinite(state.traveledM))throw new Error('Agent 2 travel distance is not finite');
  const route=sampleRoute(BRAKING_EP001.environment,startDistanceM+state.traveledM);
  return {filmFrame,simulationTimeSec,state,route,
    shotCamera:sampleCameraPose(filmFrame,route,spec,cameraOptions)};
}
function updateWheelRig(root:Object3D, state:BrakingSimulationState, route:RoutePose, startDistanceM:number){
  const carDistance=startDistanceM+state.traveledM;
  const ahead=sampleRoute(BRAKING_EP001.environment,carDistance+.75);
  const yawDelta=Math.atan2(Math.sin(ahead.yaw-route.yaw),Math.cos(ahead.yaw-route.yaw));
  const steering=Math.max(-.42,Math.min(.42,Math.atan2(spec.wheelbase*yawDelta,.75)));
  for(const anchor of wheelAnchors(spec)){
    // Kit names pivots from world-kit/vehicles.ts with wheel centre x/z.
    // The roll mesh is a child of the knuckle. Static calipers remain on
    // the knuckle and never inherit wheel-roll rotation.
    const pivot=root.getObjectByName('steer-'+anchor.center[0]+'-'+anchor.center[2]);
    const roll=pivot?.getObjectByName('wheel-roll');
    if(!roll)throw new Error('Real grand-tourer wheel not found: '+anchor.id);
    pivot!.rotation.y=anchor.steering?steering:0;
    const wheel=state.wheel[anchor.id];
    if(!wheel||!Number.isFinite(wheel.rotationRad))throw new Error('Missing Agent 2 wheel state: '+anchor.id);
    roll.rotation.z=-wheel.rotationRad;
  }
  root.position.set(...route.position);
  root.rotation.set(0,route.yaw,Number.isFinite(state.pitchRad)?state.pitchRad:0,'YZX');
}
export const BrakingVehicle:React.FC<{state:BrakingSimulationState;route:RoutePose;startDistanceM?:number}>=
 ({state,route,startDistanceM=0})=>{
  const car=useMemo(()=>createVehicle({
    variant:BRAKING_EP001.vehicleVariant,color:BRAKING_EP001.carPaint,
    accent:BRAKING_EP001.caliperAccent,
  }),[]);
  useEffect(()=>()=>disposeObject(car),[car]);
  updateWheelRig(car,state,route,startDistanceM);
  return <primitive object={car}/>;
};
export const BrakingCameraStage:React.FC<CameraFilmProps>=({
  sampleBrakingSimulation,simulationTimeAtFilmFrame,startDistanceM=0,
  cameraOptions,renderVehicle,renderLighting,children,overlay,
})=>{
  const frame=useCurrentFrame(),{width,height,fps}=useVideoConfig();
  const sampled=sampleBrakingCameraFrame(frame,fps,sampleBrakingSimulation,
    simulationTimeAtFilmFrame,startDistanceM,cameraOptions);
  const {state,route,shotCamera}=sampled;
  const aimPosition=shotCamera.position as Vec3,aimTarget=shotCamera.target as Vec3;
  return <div style={{position:'absolute',inset:0}}>
    <ThreeCanvas width={width} height={height} shadows
      camera={{position:aimPosition as [number,number,number],
        fov:shotCamera.fovDeg,near:.035,far:350}}>
      {renderLighting
        ?renderLighting(sampled)
        :<WorldLighting timeOfDay={BRAKING_EP001.timeOfDay} focus={route.position}/>}
      <Environment kind={BRAKING_EP001.environment}
        seed={BRAKING_EP001.environmentSeed} timeOfDay={BRAKING_EP001.timeOfDay}/>
      {renderVehicle
        ?renderVehicle(sampled)
        :<BrakingVehicle state={state} route={route} startDistanceM={startDistanceM}/>}
      {children}
      <CameraAim position={aimPosition as [number,number,number]}
        target={aimTarget as [number,number,number]} fov={shotCamera.fovDeg}/>
    </ThreeCanvas>
    {overlay}
  </div>;
};
