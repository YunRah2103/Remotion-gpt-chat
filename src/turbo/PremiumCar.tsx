import React, {useLayoutEffect, useMemo} from 'react';
import {useLoader} from '@react-three/fiber';
import {staticFile} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Proper licensed 3D geometry, not another low-poly box reconstruction.
 *
 * "Spectral GT RS" by Jaron K Bragg. CC0 1.0; origin:
 * https://github.com/JaronKBragg7337/spectral-gt-rs
 *
 * Source binary was checked against its immutable upstream Git blob SHA.
 * Source vehicle +X forward; film vehicle -Z forward, right-handed Y-up.
 * Blender exporter auto-converts source Z-up coordinates to glTF Y-up.
 */
const ASSET_PATH = 'assets/spectral_gt_rs_game_ready.glb';
const UPSTREAM_LICENSE = 'CC0-1.0';

type WheelPivot = {key:string; pivot:THREE.Group};
const axleKeys=['Front_Left','Front_Right','Rear_Left','Rear_Right'];

export const PremiumCar:React.FC<{frame:number;hero?:boolean}>=({frame,hero=false})=>{
 const gltf=useLoader(GLTFLoader,staticFile(ASSET_PATH));
 const {scene,wheels,normalizedLength}=useMemo(()=>{
   const clone=gltf.scene.clone(true);
   clone.updateMatrixWorld(true);
   const pivots:WheelPivot[]=[];
   for (const key of axleKeys) {
     const tyre=clone.getObjectByName(key+'_Tire');
     if (!tyre) continue;
     // Select all rolling components. The calipers, lines and suspension DO NOT spin.
     const rolling=/(?:_Tire$|_Sidewall_Bead$|_Brake_Disc$|_Brake_Hat$|_Rim_Base$|_Spoke_\d+$|_Hub$|_Hub_Cap$|_Tire_Block_\d+$)/;
     const parts:THREE.Object3D[]=[];
     clone.traverse((item)=>{if(item.name.startsWith(key+'_')&&rolling.test(item.name))parts.push(item);});
     const center=tyre.getWorldPosition(new THREE.Vector3());
     const pivot=new THREE.Group();
     pivot.name=key+'_Axle_Animated';
     clone.add(pivot);
     clone.updateMatrixWorld(true);
     pivot.position.copy(clone.worldToLocal(center.clone()));
     pivot.updateMatrixWorld(true);
     // attach() preserves object world transforms while parenting to a real wheel pivot.
     for(const part of parts) pivot.attach(part);
     pivots.push({key,pivot});
   }
   clone.traverse((obj)=>{
     if (!(obj instanceof THREE.Mesh)) return;
     obj.castShadow=true;obj.receiveShadow=true;
     const mats=Array.isArray(obj.material)?obj.material:[obj.material];
     const adjusted=mats.map(mat=>{
       const m=mat.clone();
       if(m instanceof THREE.MeshStandardMaterial){
         const name=m.name.toLowerCase();
         if(name.includes('spectral blue')){
           m.color.set('#a9c8d2');m.metalness=.6;m.roughness=.23;
           if(m instanceof THREE.MeshPhysicalMaterial){m.clearcoat=.85;m.clearcoatRoughness=.13;}
         }else if(name.includes('midnight blue')){
           m.color.set('#273e4b');m.metalness=.45;m.roughness=.27;
         }else if(name.includes('ice blue emission')||name.includes('headlamp white')){
           m.emissiveIntensity=Math.min(m.emissiveIntensity||1,2.8);
         }
       }
       return m;
     });
     obj.material=Array.isArray(obj.material)?adjusted:adjusted[0];
   });
   // Native 5-metre GT, no manual guessed wheel positions or geometry distortion.
   clone.rotation.y=Math.PI/2; // +X source forward -> -Z film forward
   clone.updateMatrixWorld(true);
   const before=new THREE.Box3().setFromObject(clone);
   const size=before.getSize(new THREE.Vector3());
   if(!(size.z>2&&size.z<30))throw new Error('Unexpected GLB longitudinal bounds '+JSON.stringify(size.toArray()));
   const physicalLength=4.98;
   const scale=physicalLength/size.z;
   clone.scale.setScalar(scale);
   clone.updateMatrixWorld(true);
   const box=new THREE.Box3().setFromObject(clone);
   const center=box.getCenter(new THREE.Vector3());
   clone.position.set(-center.x,-box.min.y,-center.z);
   clone.updateMatrixWorld(true);
   return {scene:clone,wheels:pivots,normalizedLength:physicalLength};
 },[gltf.scene]);

 useLayoutEffect(()=>{
   // All four axle groups rotate together; brake calipers remain anchored.
   for(const w of wheels) w.pivot.rotation.z=-frame*(hero?.72:.56);
   scene.position.y+=0; // frame-independent grounded position; no floating/bouncing geometry
 },[frame,hero,scene,wheels]);
 if(!normalizedLength||UPSTREAM_LICENSE!=='CC0-1.0')return null;
 return <primitive object={scene} dispose={null}/>;
};
