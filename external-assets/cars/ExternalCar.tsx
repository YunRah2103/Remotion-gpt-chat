/**
 * Render an ORIGINAL downloaded car GLB in a Remotion ThreeCanvas.
 * Asset location: public/external-cars/<filename>.glb, populated by library.mjs.
 * Supports Meshopt-compressed upstream files. Does not reconstruct vehicle meshes.
 * Credits and original licences: ./catalog.json.
 */
import React, {useMemo} from 'react';
import {staticFile,useCurrentFrame} from 'remotion';
import {useLoader} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {Box3, Vector3, Group} from 'three';

export type ExternalCarProps = {
  /** Exact car file, e.g. mclaren-p1.glb, from the pinned catalogue */
  file: string;
  /** Rendered car longest dimension in Three.js units. No polygon reduction. */
  length?: number;
  /** Optional scene yaw animation, radians per second */
  rotateSpeed?: number;
  /** Standard Three.js positioning and heading; original mesh materials retained */
  position?: [number,number,number];
  rotationY?: number;
};

export const ExternalCar:React.FC<ExternalCarProps>=({
 file, length=4.5, rotateSpeed=0, position=[0,0,0],rotationY=0
})=>{
 if(!/^[a-z0-9][a-z0-9-]*\.glb$/.test(file))throw Error('Only catalogued filename-safe GLB files are accepted');
 const frame=useCurrentFrame();
 const loaded=useLoader(GLTFLoader,staticFile('external-cars/'+file),
  loader=>loader.setMeshoptDecoder(MeshoptDecoder));
 const {scene,scale,offset}=useMemo(()=>{
  const source=loaded.scene.clone(true);
  source.updateMatrixWorld(true);
  const bounds=new Box3().setFromObject(source);
  const sizes=bounds.getSize(new Vector3()),center=bounds.getCenter(new Vector3());
  const d=Math.max(sizes.x,sizes.y,sizes.z);
  if(!Number.isFinite(d)||d<=0)throw Error('Empty or invalid car geometry '+file);
  const scale=length/d;
  source.traverse(obj=>{
   if((obj as any).isMesh){
    (obj as any).castShadow=true;
    (obj as any).receiveShadow=true;
   }
  });
  return {scene:source,scale,offset:new Vector3(-center.x*scale,-bounds.min.y*scale,-center.z*scale)};
 },[loaded.scene,file,length]);
 return <group position={position} rotation={[0,rotationY+frame*rotateSpeed/30,0]}>
  <group scale={scale} position={offset.toArray()}>
   <primitive object={scene}/>
  </group>
 </group>;
};
