import React,{useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {cloneStudioForReflections} from './light-pool.ts';
/** Capture location geometry once, before frame advancement. Vehicles never enter their own reflection map. */
export const LocationReflections:React.FC<{world:T.Group;focus:T.Vector3;night:boolean}>=({world,focus,night})=>{
 const {gl,scene}=useThree();
 useLayoutEffect(()=>{
  const capture=new T.Scene();capture.background=new T.Color(night?'#18283b':'#a7b8c8');
  const clone=cloneStudioForReflections(world);clone.position.sub(focus);capture.add(clone);
  capture.add(new T.HemisphereLight(night?'#9fbfe1':'#d9e6ec','#565046',night?1:2));
  const key=new T.DirectionalLight('#ffd4a2',night?.3:2);key.position.set(8,20,-10);capture.add(key);
  const generator=new T.PMREMGenerator(gl),map=generator.fromScene(capture,.04,.1,1400),previous=scene.environment;
  scene.environment=map.texture;scene.environmentIntensity=night?.75:.85;generator.dispose();
  return()=>{scene.environment=previous;map.dispose();};
 },[world,gl,scene,night]);
 return null;
};
