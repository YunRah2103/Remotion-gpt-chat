/**
 * Single R3F entrypoint for YUNEX imported cars, including explicitly opted-in
 * private candidates. Authored GLB meshes, textures and transforms are preserved.
 * This is NOT a wheel/suspension driving rig.
 */
import React,{useMemo} from 'react';
import {staticFile} from 'remotion';
import {useLoader} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as THREE from 'three';
import catalog from '../../../production/assets/imported-cars/catalog.json';
import {normalizeImportedScene} from './normalize.ts';
import {resolveImportedAsset} from './resolver.ts';
export {ALL_IMPORTED_ASSETS,importedAssetInfo,resolveImportedAsset} from './resolver.ts';

export const IMPORTED_CARS=catalog.vehicles;
export type ImportedCarId=string;
/** Back-compatible metadata API for the individually attributed 12-model set. */
export function importedCarInfo(id:ImportedCarId){
 const match=IMPORTED_CARS.find(car=>car.id===id);
 if(!match)throw Error('Unrecognised attributed YUNEX car: '+id);
 return match;
}
export type ImportedCarProps={
 id:ImportedCarId;
 /** Target longest horizontal dimension in metres, retaining source proportions. */
 lengthMeters?:number;
 /** Visual orientation override, radians. */
 yaw?:number;
 castShadow?:boolean;
 receiveShadow?:boolean;
 /** Explicit opt-in for private non-published review of unverified assets. */
 privateReview?:boolean;
};
export const ImportedCar:React.FC<ImportedCarProps>=({
 id,lengthMeters=4.7,yaw=0,castShadow=true,receiveShadow=true,privateReview=false
})=>{
 const item=resolveImportedAsset(id,{privateReview});
 const url=staticFile(item.staticPath);
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
  wrapper.userData={
   importedCar:id,assetSource:item.source,creator:item.creator,
   license:item.licence,attribution:item.attribution,
   readiness:item.readiness,privateReviewOnly:item.privateReviewOnly,
   sourceBlob:item.gitBlobSha1
  };
  wrapper.add(cloned);
  return wrapper;
 },[model.scene,id,lengthMeters,yaw,castShadow,receiveShadow,item]);
 return <primitive object={group}/>;
};
