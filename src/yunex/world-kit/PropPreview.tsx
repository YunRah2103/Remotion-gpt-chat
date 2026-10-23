import React,{useMemo,useEffect} from 'react';import * as T from 'three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';import {ThreeCanvas} from '@remotion/three';
import {createProp} from './props.ts';import type {PropKind} from './props.ts';import {disposeObject} from './geometry.ts';
import {WorldLighting,CameraAim} from './components';
export const PropPreview:React.FC<{kind:PropKind}>=({kind})=>{
 const model=useMemo(()=>createProp({kind,lit:true}),[kind]);useEffect(()=>()=>disposeObject(model),[model]);
 const {width,height,fps}=useVideoConfig(),frame=useCurrentFrame();model.updateMatrixWorld(true);const b=new T.Box3().setFromObject(model,true),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3()),r=Math.max(size.x,size.y,size.z,.6)*2.3,a=.7+frame/fps*.15;
 return <AbsoluteFill><ThreeCanvas width={width} height={height} shadows camera={{fov:38,near:.05,far:150}}>
  <WorldLighting studio/><CameraAim position={[center.x+Math.cos(a)*r,center.y+r*.48,center.z+Math.sin(a)*r]} target={center.toArray() as [number,number,number]} fov={38}/>
  <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.008,0]}><planeGeometry args={[100,100]}/><meshStandardMaterial color="#a6b2ac" roughness={.8}/></mesh><primitive object={model}/>
 </ThreeCanvas><div style={{position:'absolute',left:32,bottom:30,fontFamily:'Arial',fontSize:30,color:'#e8f0ec',background:'#15232bdd',padding:'12px 20px'}}>SCENE PROP / {kind.toUpperCase()}</div></AbsoluteFill>;
};
