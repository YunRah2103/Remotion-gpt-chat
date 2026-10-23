import * as T from 'three';
import type {V3} from '../world-kit/geometry.ts';
import {interiorLayout} from '../world-kit/interiors.ts';
import {vehicleSpec} from '../world-kit/catalog.ts';
import {fitInspectionCamera} from './framing.ts';
import {studioBodyProfile} from './studio-coachwork.ts';
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
export function driverPovCamera(model:T.Object3D,lookAhead?:V3){
 if(lookAhead&&(!Array.isArray(lookAhead)||lookAhead.length!==3||!lookAhead.every(Number.isFinite)))throw Error('Onboard lookAhead needs three finite world coordinates');
 model.updateMatrixWorld(true);const s=vehicleSpec(model.userData.variant),shell=model.getObjectByName('body-shell')??model;
 let position:V3,target:V3,fov:number;
 if(s.family==='formula'){
  position=[-.62,1.20,0];target=[3.8,.55,0];fov=60;
 }else if(model.userData.bodyArchitecture==='section-loft-v4'){
  const c=studioBodyProfile(s),head=model.getObjectByName('head'),headLocal=head?shell.worldToLocal(head.getWorldPosition(new T.Vector3())):undefined;
  const y=c.roof-.18,t=(y-c.belt)/(c.roof-c.belt),glassX=T.MathUtils.lerp(c.frontBase,c.frontRoof,t),z=headLocal?.z??-s.width*.235;
  position=[glassX-.025,y,z];target=[glassX+8,y-.20,z];fov=54;
 }else{
  const l=interiorLayout(s),head=model.getObjectByName('head'),headLocal=head?shell.worldToLocal(head.getWorldPosition(new T.Vector3())):undefined;
  const t=T.MathUtils.clamp((Math.min(l.roof-.18,Math.max(l.belt+.13,l.floor+.80*l.k))-l.belt)/(l.roof-l.belt),.12,.82);
  const y=T.MathUtils.lerp(l.belt,l.roof,t),glassX=T.MathUtils.lerp(l.frontBase,l.frontRoof,t),z=headLocal?.z??-s.width*.235;
  position=[glassX-.08,y,z];target=[glassX+8,y-.035,z];fov=58;
 }
 return {position:shell.localToWorld(new T.Vector3(...position)).toArray() as V3,target:lookAhead??shell.localToWorld(new T.Vector3(...target)).toArray() as V3,fov};
}
/** Frame actual occupant/control bounds instead of cropping a mannequin's head and arms. */
export function cabinInspectionCamera(model:T.Object3D,aspect:number){
 model.updateMatrixWorld(true);const bounds=new T.Box3();
 for(const name of ['driver-rig','steering-wheel','racing-steering-wheel','pedals']){const object=model.getObjectByName(name);if(object)bounds.union(new T.Box3().setFromObject(object));}
 if(bounds.isEmpty())return partInspectionCamera(model,aspect);
 bounds.expandByScalar(.07);const center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),shell=model.getObjectByName('body-shell')??model;
 const direction=new T.Vector3(1.1,.65,-1.8).applyQuaternion(shell.getWorldQuaternion(new T.Quaternion()));
 const target=center.toArray() as V3,position=fitInspectionCamera(center.clone().add(direction).toArray() as V3,target,size.toArray() as V3,aspect,46);
 return {position,target,fov:46};
}
