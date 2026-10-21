import * as THREE from 'three';
import type {CameraPose,VehicleMotionState,Vec3} from '../shared/contract.ts';
import {localToWorld} from '../physics/dynamics.ts';
import {getSkidDescriptors} from '../mechanics/skids.ts';

export type RealPartAnchor=Readonly<{
 id:'metal'|'plank'|'floor';title:string;hint:string;color:string;
 x:number;y:number;onScreen:boolean;
}>;
/** This is a projection of true Agent 1 mesh coordinates, NOT illustration art.
 * Silver x=forward skid descriptor, tan x=separate actual plank segment between
 * centre and forward skid, carbon x=actual 0.89m wide structural floor near +Z.
 */
const FRONT=getSkidDescriptors().find(x=>x.id==='forward');
if(!FRONT)throw new Error('Missing mandatory forward metal skid');
const PARTS=[
 {id:'metal',title:'SILVER METAL SKID',hint:'ROAD-CONTACT PART',color:'#fff2d0',local:FRONT.localBottomPoint},
 {id:'plank',title:'TAN COMPOSITE PLANK',hint:'NON-METALLIC',color:'#dfb788',local:[.70,.086,0]},
 {id:'floor',title:'DARK CARBON FLOOR',hint:'STRUCTURAL FLOOR',color:'#8eb9ce',local:[1.03,.162,.34]},
] as const;
export function projectedActualParts(motion:VehicleMotionState,pose:CameraPose,width=1080,height=1920):readonly RealPartAnchor[]{
 const cam=new THREE.PerspectiveCamera(pose.fovDeg,width/height,.025,350);
 cam.position.set(...pose.positionWorld);cam.lookAt(...pose.targetWorld);cam.updateMatrixWorld(true);
 return PARTS.map(part=>{
  const v=new THREE.Vector3(...localToWorld(part.local as Vec3,motion)).project(cam);
  const x=(v.x+1)*width/2,y=(1-v.y)*height/2;
  return {id:part.id,title:part.title,hint:part.hint,color:part.color,x,y,
   onScreen:v.z>-1&&v.z<1&&x>width*.06&&x<width*.94&&y>height*.12&&y<height*.75};
 });
}
