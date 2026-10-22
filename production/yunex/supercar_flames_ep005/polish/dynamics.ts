/**
 * EP005 Agent 6 — stateless planted-driving polish.
 * Uses V3's existing wheel-steering, wheel-spin, occupant and suspension rig.
 * This is visually plausible kinematics, NOT a measured tyre-force simulation.
 * Never replaces the shared route, private rig or physical exhaust mounts.
 */
import * as THREE from 'three';
import {animateCinematicVehicle} from '../../../../src/yunex/modelling-kit/rig.ts';
import type {CinematicState} from '../../../../src/yunex/modelling-kit/rig.ts';
import {sampleRoute} from '../../../../src/yunex/world-kit/environments.ts';
import type {RoutePose} from '../../../../src/yunex/world-kit/environments.ts';

export type RouteSampler=(distance:number)=>RoutePose;
export type MotionSample={
 frame:number;fps:number;distanceMeters:number;routeDistanceMeters:number;
 speedMps:number;steerRadians:number;pose:RoutePose;
 gearChange?:number;afterfireDemand?:number;cutaway?:number;
};
export type MotionMetrics={curvature:number;lateralAcceleration:number;longitudinalAcceleration:number;roll:number;pitch:number;compression:number};
export const EP005_POLISH_ROUTE='track' as const;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const angleDiff=(a:number,b:number)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const defaultPolishRoute:RouteSampler=(d)=>sampleRoute(EP005_POLISH_ROUTE,d);

/** All computations use only absolute sample inputs; cuts and reverse seeks agree. */
export function plantedMetrics(sample:MotionSample,route:RouteSampler=defaultPolishRoute):MotionMetrics{
 const {frame,fps,speedMps,routeDistanceMeters}=sample;
 if(![frame,fps,speedMps,routeDistanceMeters,sample.distanceMeters,sample.steerRadians,...sample.pose.position,sample.pose.yaw].every(Number.isFinite)||fps<=0||speedMps<0)throw Error('Invalid EP005 motion sample');
 const h=0.8;
 const left=route(routeDistanceMeters-h),right=route(routeDistanceMeters+h);
 const curvature=angleDiff(right.yaw,left.yaw)/(2*h);
 const lateralAcceleration=clamp(speedMps*speedMps*curvature,-18,18);
 // The speed profile derivative in the A3 contract is analytically 0.6+2pi/25*sin(2pi*t/25).
 // A6 preview uses an independent speed profile and supplies derivative when known.
 const longitudinalAcceleration=clamp(0.6+2*Math.PI/25*Math.sin(2*Math.PI*(frame/fps)/25),-5,5);
 const roll=clamp(-lateralAcceleration*.00105,-.018,.018);
 const pitch=clamp(-longitudinalAcceleration*.005,-.019,.019);
 const compression=clamp(.006+speedMps*.00012+Math.abs(lateralAcceleration)*.00018,0,.018);
 return {curvature,lateralAcceleration,longitudinalAcceleration,roll,pitch,compression};
}
/** Update only the original V3 rig and its named body-shell. Leave wheel centre Y and contact intact. */
export function animatePlantedHero(hero:THREE.Group,sample:MotionSample,route:RouteSampler=defaultPolishRoute,extras:Partial<CinematicState>={}):MotionMetrics{
 const metrics=plantedMetrics(sample,route);
 const cutaway=sample.cutaway??0;
 animateCinematicVehicle(hero,{
  ...extras,frame:sample.frame,fps:sample.fps,distance:sample.distanceMeters,
  steer:sample.steerRadians,compression:metrics.compression,
  gearChange:sample.gearChange??0,cutaway,
  heat:(sample.afterfireDemand??0)*.25
 });
 const shell=hero.getObjectByName('body-shell');
 if(!shell)throw Error('Missing original V3 body-shell');
 shell.rotation.x=metrics.roll;
 shell.rotation.z=metrics.pitch;
 const pose=sample.pose;
 hero.position.fromArray(pose.position);hero.rotation.set(0,pose.yaw,0);
 hero.updateMatrixWorld(true);
 return metrics;
}
export type CameraPose={position:[number,number,number];target:[number,number,number];fov:number};
/** Predictive aim is small and deterministic, with no temporal state or jitter. */
export function polishFollowCamera(base:CameraPose,sample:MotionSample,route:RouteSampler=defaultPolishRoute):CameraPose{
 const speed=sample.speedMps;
 const upcoming=route(sample.routeDistanceMeters+clamp(speed*.18,1.3,6.5));
 const dx=clamp((upcoming.position[0]-sample.pose.position[0])*.075,-.38,.38);
 const dz=clamp((upcoming.position[2]-sample.pose.position[2])*.075,-.38,.38);
 return {
  position:[...base.position] as [number,number,number],
  target:[base.target[0]+dx,base.target[1]+.012,base.target[2]+dz],
  fov:base.fov
 };
}
/** Adapter for Agent 3's structural CinemaSample; imports no Agent 3 files. */
export function motionFromCinema(sample:{
 frame:number;fps:number;distanceMeters:number;routeDistanceMeters:number;
 speedMps:number;steerRadians:number;pose:RoutePose;gearChange:number;afterfireDemand:number
}):MotionSample{return {...sample};}
