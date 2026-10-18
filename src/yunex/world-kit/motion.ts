import type {Object3D} from 'three';
import type {RoutePose} from './environments.ts';
/** Stateless: seeking and out-of-order frame rendering always yield the same result. */
export function animateVehicle(root:Object3D,distance:number,steer=0){
 if(!Number.isFinite(distance)||!Number.isFinite(steer))throw new Error('Motion inputs must be finite');
 root.traverse(o=>{if(o.userData.wheel)o.rotation.z=-distance/o.userData.radius;if(o.userData.steering)o.rotation.y=Math.max(-.65,Math.min(.65,steer));});
}
export function placeVehicle(root:Object3D,pose:RoutePose){root.position.set(...pose.position);root.rotation.y=pose.yaw;}
