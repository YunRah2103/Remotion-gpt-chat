import * as T from 'three';
import type {V3} from '../world-kit/geometry.ts';
import {interiorCamera} from '../world-kit/interiors.ts';
import {vehicleSpec} from '../world-kit/catalog.ts';
import {fitInspectionCamera} from './framing.ts';
/** Fit the actual component's world bounds, with the same safe area as vehicle reveals. */
export function partInspectionCamera(model:T.Object3D,aspect:number){
 model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
 if(bounds.isEmpty())throw new Error('Part camera needs visible geometry');
 const target=center.toArray() as V3,initial=center.clone().add(new T.Vector3(.7,.4,1).normalize().multiplyScalar(.1)).toArray() as V3;
 return {position:fitInspectionCamera(initial,target,size.toArray() as V3,aspect,36),target,fov:36};
}
/** Eye location follows the real seated mannequin, including route and suspension transforms. */
export function driverPovCamera(model:T.Object3D){
 model.updateMatrixWorld(true);const head=model.getObjectByName('head');if(!head){const view=interiorCamera(vehicleSpec(model.userData.variant));return {...view,position:model.localToWorld(new T.Vector3(...view.position)).toArray() as V3,target:model.localToWorld(new T.Vector3(...view.target)).toArray() as V3};}
 const eye=head.getWorldPosition(new T.Vector3()),forward=new T.Vector3(1,0,0).applyQuaternion(model.getWorldQuaternion(new T.Quaternion()));
 eye.addScaledVector(forward,.125);eye.y+=.025;
 const target=eye.clone().addScaledVector(forward,8);target.y-=.035;
 return {position:eye.toArray() as V3,target:target.toArray() as V3,fov:65};
}
