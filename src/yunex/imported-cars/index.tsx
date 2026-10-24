/**
 * Drop-in authentic GLB car renderer for YUNEX R3F / Remotion productions.
 * Run npm run kit:cars:fetch -- <id> first.
 * Never replaces an unavailable model with a fake procedural car.
 */
import React,{useMemo} from 'react';
import {staticFile} from 'remotion';
import {useLoader} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as THREE from 'three';
import {normalizeImportedScene} from './normalize.ts';
import catalog from '../../../production/assets/imported-cars/catalog.json';

export const IMPORTED_CARS=catalog.vehicles;
export type ImportedCarId=string;
export function importedCarInfo(id:ImportedCarId){
 const match=IMPORTED_CARS.find(car=>car.id===id);
 if(!match)throw Error('Unrecognised imported YUNEX car: '+id);
 return match;
}
export type ImportedCarProps={
 id:ImportedCarId;
 /** Target measured longest horizontal dimension, metres. Models retain original proportions. */
 lengthMeters?:number;
 /** Optional visual orientation override, radians. */
 yaw?:number;
 castShadow?:boolean;
 receiveShadow?:boolean;
};
export const ImportedCar:React.FC<ImportedCarProps>=({id,lengthMeters=4.7,yaw=0,castShadow=true,receiveShadow=true})=>{
 const item=importedCarInfo(id);
 const url=staticFile('yunex/imported-cars/'+item.fileName);
 const model=useLoader(GLTFLoader,url,loader=>{
  loader.setMeshoptDecoder(MeshoptDecoder);
  const draco=new DRACOLoader();
  draco.setDecoderPath(staticFile('yunex/imported-cars/draco/'));
  loader.setDRACOLoader(draco);
 });
 const group=useMemo(()=>{
  const {cloned,size}=normalizeImportedScene(model.scene,id,lengthMeters);
  cloned.traverse(node=>{
   if(node instanceof THREE.Mesh){
    node.castShadow=castShadow;
    node.receiveShadow=receiveShadow;
   }
  });
  const wrapper=new THREE.Group();
  wrapper.name='YUNEX-Imported-'+id;
  wrapper.rotation.y=(size.z>size.x?-Math.PI/2:0)+yaw;
  wrapper.userData={importedCar:id,creator:item.creator,license:item.license,originalUrl:item.originalUrl,readiness:item.readiness,sourceBlob:item.source.gitBlobSha1};
  wrapper.add(cloned);
  return wrapper;
 },[model.scene,id,lengthMeters,yaw,castShadow,receiveShadow,item]);
 return <primitive object={group}/>;
};
