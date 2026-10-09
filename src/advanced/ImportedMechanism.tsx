import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {useLoader} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import type {Object3D} from 'three';

export type MechanicalPivot = {
  name:string;
  mode:'rotation'|'translation';
  axis:[number,number,number];
  start:number;
  end:number;
  frameStart:number;
  frameEnd:number;
};
const normalized=(frame:number,start:number,end:number)=>Math.max(0,Math.min(1,(frame-start)/(end-start)));

/** GLB must be reviewed and saved under public/mechanics by an approved source-artifact PR.
 * useLoader is deterministic; the original GLB is never reconstructed by this code.
 */
export const ImportedMechanism:React.FC<{
  asset:string;
  movingParts:MechanicalPivot[];
  scale?:number;
}> = ({asset,movingParts,scale=1})=>{
  const frame=useCurrentFrame();
  if(!/^\/mechanics\/[a-zA-Z0-9/_-]+\.glb$/.test(asset))throw new Error('Only local reviewed /mechanics/*.glb assets');
  const gltf=useLoader(GLTFLoader,asset);
  // Mesh hierarchy is cloned so one film cannot mutate other film instances.
  const scene=useMemo(()=>gltf.scene.clone(true),[gltf.scene]);
  const objectMap=useMemo(()=>{
    const result=new Map<string,Object3D>();
    scene.traverse(o=>result.set(o.name,o));
    return result;
  },[scene]);
  const frames=new Map(movingParts.map(p=>[p.name,p]));
  for(const [name,p] of frames){
    const obj=objectMap.get(name);
    if(!obj)throw new Error('Missing named mechanical pivot '+name);
    const value=p.start+(p.end-p.start)*normalized(frame,p.frameStart,p.frameEnd);
    if(p.mode==='rotation')obj.rotation.set(p.axis[0]*value,p.axis[1]*value,p.axis[2]*value);
    else obj.position.set(p.axis[0]*value,p.axis[1]*value,p.axis[2]*value);
  }
  return <primitive object={scene} scale={scale}/>;
};
