import React, {useLayoutEffect, useMemo} from 'react';
import {useLoader} from '@react-three/fiber';
import {staticFile} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * High-fidelity, properly textured concept car (not a primitive mock-up).
 *
 * "Car Concept", ©2024 Darmstadt Graphics Group GmbH, CC BY 4.0.
 * Model and textures by Eric Chadwick, source: KhronosGroup/glTF-Sample-Assets
 * GLB is checked in at public/assets/carconcept.glb, upstream exact sha1 blob:
 * c0f38c989a78cc4ba63253b5338705e0afb0142f
 *
 * wheel group names are part of the authored asset, not guessed transforms.
 */
const wheels=['WheelFrontL','WheelFrontR','WheelRearL','WheelRearR'];

export const PremiumCar:React.FC<{frame:number;hero?:boolean}>=({frame,hero=false})=>{
 const gltf=useLoader(GLTFLoader,staticFile('assets/carconcept.glb'));
 const {car,axles}=useMemo(()=>{
   const model=gltf.scene.clone(true);
   model.updateMatrixWorld(true);
   const spins:THREE.Group[]=[];
   for(const name of wheels){
     const wheel=model.getObjectByName(name);
     if(!wheel)throw new Error('Missing complete authored wheel group '+name);
     // The four original wheel assemblies already have correct positions and
     // calibrated diameters. Rotate tire, rim and disc, NOT the fixed brake pad.
     const toSpin:THREE.Object3D[]=[];
     wheel.traverse(node=>{
       if(node===wheel||node.name.includes('BrakePad'))return;
       // Limit to the wheel's authored direct components; don't relocate suspension.
       if(node.parent===wheel)toSpin.push(node);
     });
     const pivot=new THREE.Group();
     pivot.name='Rotating_'+name;
     model.add(pivot);
     model.updateMatrixWorld(true);
     const center=wheel.getWorldPosition(new THREE.Vector3());
     pivot.position.copy(model.worldToLocal(center.clone()));
     pivot.updateMatrixWorld(true);
     for(const obj of toSpin)pivot.attach(obj);
     spins.push(pivot);
   }
   model.traverse(obj=>{
     if(!(obj instanceof THREE.Mesh))return;
     obj.castShadow=true;
     obj.receiveShadow=true;
     // Keep the authored metallic-flake maps and clearcoat, but prevent the
     // default near-black side panels under night roadway exposure.
     const enhance=(original:THREE.Material):THREE.Material=>{
       const m=original.clone();
       if(m instanceof THREE.MeshStandardMaterial){
         if(m.name.includes('Paint 1 Carmine')){
           m.color.set('#dc5552');
           m.metalness=.38;
           m.roughness=.24;
           m.envMapIntensity=1.35;
         }else if(m.name.includes('Paint 2 Carmine')){
           m.color.set('#784852');
           m.metalness=.32;
           m.roughness=.28;
           m.envMapIntensity=1.15;
         }
       }
       return m;
     };
     obj.material=Array.isArray(obj.material)?obj.material.map(enhance):enhance(obj.material);
   });
   // Khronos native model faces +Z after its glTF Z-up -> Y-up conversion.
   // Our original documentary uses -Z as the forward road axis.
   model.rotation.y=Math.PI;
   model.updateMatrixWorld(true);
   const b0=new THREE.Box3().setFromObject(model);
   const d=b0.getSize(new THREE.Vector3());
   if(!(d.z>2.5&&d.z<10))throw new Error('Car model has unexpected longitudinal size '+d.toArray());
   model.scale.setScalar(5.0/d.z);
   model.updateMatrixWorld(true);
   const b=new THREE.Box3().setFromObject(model);
   const center=b.getCenter(new THREE.Vector3());
   model.position.set(-center.x,-b.min.y,-center.z);
   model.updateMatrixWorld(true);
   return {car:model,axles:spins};
 },[gltf.scene]);

 useLayoutEffect(()=>{
   // The tire, tread, rim and brake disc rotate together as one. The stationary
   // pads and fixed suspension do not rotate. No wobble or detached wheel shapes.
   const revolutions=frame*(hero?.75:.59);
   for(const axle of axles)axle.rotation.x=revolutions;
 },[frame,hero,axles]);
 return <primitive object={car} dispose={null}/>;
};
