import * as T from 'three';
import type {V3} from '../world-kit/geometry.ts';
import {interiorLayout} from '../world-kit/interiors.ts';
import {vehicleSpec} from '../world-kit/catalog.ts';
import {fitInspectionCamera} from './framing.ts';
/** Fit the actual component's world bounds, with the same safe area as vehicle reveals. */
export function partInspectionCamera(model:T.Object3D,aspect:number,orbit?:{azimuth:number;elevation:number}){
 model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
 if(bounds.isEmpty())throw new Error('Part camera needs visible geometry');
 const target=center.toArray() as V3,initial=center.clone().add((orbit?new T.Vector3(Math.sin(orbit.azimuth)*Math.cos(orbit.elevation),Math.sin(orbit.elevation),Math.cos(orbit.azimuth)*Math.cos(orbit.elevation)):new T.Vector3(.7,.4,1)).normalize().multiplyScalar(.1)).toArray() as V3;
 return {position:fitInspectionCamera(initial,target,size.toArray() as V3,aspect,36),target,fov:36};
}
/** Fitted onboard mounts: a windscreen camera for road cars and a raised T-camera for Formula.
 * Positions use the shell pivot, so route, suspension and exploded transforms stay attached.
 * This is a camera mount rather than an anatomical eye; the header and halo remain intact.
 */
export function driverPovCamera(model:T.Object3D){
 model.updateMatrixWorld(true);const s=vehicleSpec(model.userData.variant),shell=model.getObjectByName('body-shell')??model;
 let position:V3,target:V3,fov:number;
 if(s.family==='formula'){
  position=[-.62,1.20,0];target=[3.8,.55,0];fov=60;
 }else{
  const l=interiorLayout(s),head=model.getObjectByName('head'),headLocal=head?shell.worldToLocal(head.getWorldPosition(new T.Vector3())):undefined;
  const t=T.MathUtils.clamp((Math.min(l.roof-.18,Math.max(l.belt+.13,l.floor+.80*l.k))-l.belt)/(l.roof-l.belt),.12,.82);
  const y=T.MathUtils.lerp(l.belt,l.roof,t),glassX=T.MathUtils.lerp(l.frontBase,l.frontRoof,t),z=headLocal?.z??-s.width*.235;
  position=[glassX-.08,y,z];target=[glassX+8,y-.035,z];fov=58;
 }
 return {position:shell.localToWorld(new T.Vector3(...position)).toArray() as V3,target:shell.localToWorld(new T.Vector3(...target)).toArray() as V3,fov};
}
