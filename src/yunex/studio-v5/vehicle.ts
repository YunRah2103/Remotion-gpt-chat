import * as T from 'three';
import {createCinematicVehicle,animateCinematicVehicle} from '../modelling-kit/rig.ts';
import {vehicleSpec} from '../world-kit/catalog.ts';
import {sampleRoad} from './road.ts';
import type {Road} from './road.ts';
export function createStudioVehicle(variant:'supercar'|'coupe'|'rally-hatch',color?:string){
 if(!['supercar','coupe','rally-hatch'].includes(variant))throw Error('V5 hero vehicle: choose supercar, coupe or rally-hatch; other V4 variants remain available via createCinematicVehicle');
 const car=createCinematicVehicle({variant,bodyDetail:'studio',quality:'hero',color:color??(variant==='supercar'?'#18636b':variant==='coupe'?'#8b2638':'#d6d1bc'),lights:true,driver:true});
 car.userData.v5Finish='original-v4-protected';return car;
}
/** Pose and wheel offsets sampled in the same road frame, no ground decal dependency. */
export function poseStudioVehicle(car:T.Group,road:Road,distance:number,frame:number,fps:number,speed:number){
 if(![distance,frame,fps,speed].every(Number.isFinite)||fps<=0||speed<0)throw Error('Finite motion, positive fps and nonnegative speed required');
 const pose=sampleRoad(road,distance),next=sampleRoad(road,distance+.5),s=vehicleSpec(car.userData.variant),inv=pose.quaternion.clone().invert();
 const curvature=-Math.atan2(Math.sin(next.yaw-pose.yaw),Math.cos(next.yaw-pose.yaw))/.5;
 const heights=[1,-1].flatMap(axle=>[1,-1].map(side=>sampleRoad(road,distance+axle*s.wheelbase/2,side*s.width*.415).position.sub(pose.position).applyQuaternion(inv).y));
 animateCinematicVehicle(car,{frame,fps,distance,speed,curvature,roadFrontLeft:heights[0],roadFrontRight:heights[1],roadRearLeft:heights[2],roadRearRight:heights[3]});
 car.position.copy(pose.position);car.quaternion.copy(pose.quaternion);return pose;
}
