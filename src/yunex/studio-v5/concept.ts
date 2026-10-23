import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {adaptImportedVehicle} from './import.ts';
export const CONCEPT_CREDIT='Car Concept © 2024 Darmstadt Graphics Group GmbH — Eric Chadwick, CC BY 4.0; YUNEX rig adaptation';
const wheels={frontLeft:'WheelFrontL',frontRight:'WheelFrontR',rearLeft:'WheelRearL',rearRight:'WheelRearR'};
/** Source-specific normalizer. This is deliberately not guessed for arbitrary imported models. */
export function prepareConceptVehicle(source:T.Object3D){
 const prepared=source.clone(true);prepared.rotateY(Math.PI/2);prepared.updateMatrixWorld(true);
 for(const name of Object.values(wheels)){
  const wheel=prepared.getObjectByName(name);if(!wheel)throw Error('Concept asset missing '+name);
  const world=wheel.getWorldQuaternion(new T.Quaternion()),axis=new T.Vector3(1,0,0).applyQuaternion(world),sign=axis.z<0?-1:1;
  const correction=-Math.atan2(axis.x*sign,Math.abs(axis.z)),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),correction).multiply(world),parent=wheel.parent!.getWorldQuaternion(new T.Quaternion());
  wheel.quaternion.copy(parent.invert().multiply(q));wheel.updateMatrixWorld(true);
 }
 const rig=adaptImportedVehicle(prepared,{sourceUrl:'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept',license:'CC-BY-4.0',author:'Eric Chadwick / Darmstadt Graphics Group GmbH',radius:.384,wheels});
 for(const [corner,name]of Object.entries(wheels)){
  const pad=rig.getObjectByName(name+'BrakePad'),mount=rig.getObjectByName('steer-'+corner);if(!pad||!mount)throw Error('Concept asset missing stationary brake-pad node');rig.updateMatrixWorld(true);mount.attach(pad);
 }
 rig.userData.credit=CONCEPT_CREDIT;rig.userData.adaptation='Coordinates and wheel pose only; source GLB/materials unchanged';
 rig.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});return rig;
}
export async function loadConceptVehicle(url:string){const gltf=await new GLTFLoader().loadAsync(url);const car=prepareConceptVehicle(gltf.scene);car.userData.sourceScene=gltf.scene;return car;}
