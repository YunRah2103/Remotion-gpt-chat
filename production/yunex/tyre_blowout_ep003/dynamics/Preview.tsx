/** Two standalone, source-timed Remotion 4 / Three.js department previews.
 * Render with dynamics/entry.tsx; NEVER registered in the integration root.
 * These shots use real absolute-time physics, with visible edits before 180m
 * highway wrapping. Agent 1 will replace the temporary tyre-scale cue.
 */
import React,{useEffect,useMemo} from 'react';
import {AbsoluteFill,Composition,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {createVehicle} from '../../../../src/yunex/world-kit/vehicles.ts';
import {createEnvironment} from '../../../../src/yunex/world-kit/environments.ts';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {CameraAim,WorldLighting} from '../../../../src/yunex/world-kit/components.tsx';
import type {WheelId} from '../shared/contract.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import {sampleDynamics,previewRebasedPosition,DYNAMICS_DEFAULTS} from './model.ts';

type Shot = 'tyre-front-right'|'high-chase'|'rear-three-quarter'|'overhead';
type Edit = {sourceSec:number;sourceAnchorSec:number;sceneX:number;shot:Shot};
const EDITS:readonly {at:number;end:number;sourceStart:number;shot:Shot;sceneX:number}[]=[
  {at:0,end:2.6,sourceStart:0.1,shot:'tyre-front-right',sceneX:-42},
  {at:2.6,end:5.35,sourceStart:1.9,shot:'overhead',sceneX:-35},
  {at:5.35,end:8,sourceStart:4.2,shot:'rear-three-quarter',sceneX:-35},
];
function shotAt(videoSec:number,variant:'tight'|'context'):Edit {
  if(variant==='tight')return {
    sourceSec:0.12+videoSec,sourceAnchorSec:0.12,sceneX:-58,
    shot:videoSec<2.0?'tyre-front-right':videoSec<3.55?'high-chase':'rear-three-quarter',
  };
  const seg=EDITS.find(e=>videoSec<e.end)??EDITS[EDITS.length-1];
  return {sourceSec:seg.sourceStart+videoSec-seg.at,
    sourceAnchorSec:seg.sourceStart,sceneX:seg.sceneX,shot:seg.shot};
}
function view(shot:Shot,x:number,z:number):{position:[number,number,number];target:[number,number,number];fov:number}{
  const target:[number,number,number]=[x,0.7,z];
  switch(shot){
    case 'tyre-front-right':return {position:[x+5.3,1.57,z-3.7],target:[x+1.02,0.51,z-.50],fov:36};
    case 'high-chase':return {position:[x-9.5,3.65,z+4.7],target,fov:39};
    case 'rear-three-quarter':return {position:[x-8.4,3.3,z-5.0],target,fov:38};
    case 'overhead':return {position:[x-3,16,z-1.9],target:[x+1.4,0,z-.4],fov:30};
  }
}
const ids:readonly WheelId[]=['front-left','front-right','rear-left','rear-right'];
function idFromPivot(p:T.Object3D):WheelId {
  return (p.position.x>0?'front':'rear')+'-'+(p.position.z>0?'left':'right') as WheelId;
}
const MovingCar:React.FC<{tSec:number;sceneX:number;anchorDistanceM:number}>=({tSec,sceneX,anchorDistanceM})=>{
  const root=useMemo(()=>createVehicle({variant:'grand-tourer',color:EP003_SCENE.paint,accent:'#C9A777',interior:true}),[]);
  useEffect(()=>()=>disposeObject(root),[root]);
  const data=sampleDynamics(tSec,DYNAMICS_DEFAULTS);
  const position=previewRebasedPosition(data,anchorDistanceM,sceneX);
  root.position.set(...position);
  root.rotation.order='YXZ';
  root.rotation.set(data.rollRad,data.yawRad,data.pitchRad,'YXZ');
  const pivots:T.Object3D[]=[];
  root.traverse(o=>{
    if(!o.name.startsWith('steer-'))return;
    const id=idFromPivot(o);
    pivots.push(o);
    o.position.y=EP003_SCENE.wheelRadiusM;
    o.rotation.y=data.wheels[id].steeringRad;
    const roll=o.getObjectByName('wheel-roll');
    if(roll) {
      roll.rotation.z=data.wheels[id].spinRad;
      // Department-specific preview proxy only: car's original rim and brakes
      // remain intact; Agent 1 provides final pressure-dependent tyre mesh.
      const tyre=roll.getObjectByName('tyre');
      if(tyre)tyre.scale.y=id==='front-right'
        ?data.wheels[id].rollingRadiusM/EP003_SCENE.wheelRadiusM:1;
    }
  });
  root.updateMatrixWorld(true);
  const q=new T.Vector3();
  for(const pivot of pivots){
    const id=idFromPivot(pivot);
    pivot.getWorldPosition(q);
    pivot.position.y+=data.wheels[id].hubWorldM[1]-q.y;
  }
  root.updateMatrixWorld(true);
  return <primitive object={root}/>;
};
const Road:React.FC=()=>{
  const obj=useMemo(()=>createEnvironment({kind:'highway',timeOfDay:'day',seed:12}),[]);
  useEffect(()=>()=>disposeObject(obj),[obj]);
  return <primitive object={obj}/>;
};
const DynamicsPreview:React.FC<{variant:'tight'|'context'}>=({variant})=>{
  const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),time=frame/fps;
  const edit=shotAt(time,variant),dyn=sampleDynamics(edit.sourceSec,DYNAMICS_DEFAULTS);
  const anchor=sampleDynamics(edit.sourceAnchorSec,DYNAMICS_DEFAULTS).positionM[0];
  const [x,,z]=previewRebasedPosition(dyn,anchor,edit.sceneX);
  const camera=view(edit.shot,x,z);
  return <AbsoluteFill style={{background:'#bfd2d6'}}>
    <ThreeCanvas width={width} height={height} shadows camera={{position:camera.position,fov:camera.fov,near:0.1,far:320}}>
      <WorldLighting timeOfDay="day" focus={[x,0,z]}/>
      <Road/>
      <CameraAim position={camera.position} target={camera.target} fov={camera.fov}/>
      <MovingCar tSec={edit.sourceSec} anchorDistanceM={anchor} sceneX={edit.sceneX}/>
    </ThreeCanvas>
    <div style={{
      position:'absolute',left:48,right:48,bottom:88,fontFamily:'Arial, sans-serif',fontSize:21,
      letterSpacing:1.5,color:'#f2f6f4',textShadow:'0 1px 5px #1b2733',
      opacity:.9,
    }}>YUNEX / DYNAMICS STUDY &nbsp;·&nbsp; ILLUSTRATIVE MOTION</div>
  </AbsoluteFill>;
};
export const IncidentPreview:React.FC=()=> <DynamicsPreview variant="tight"/>;
export const RecoveryPreview:React.FC=()=> <DynamicsPreview variant="context"/>;
export const DynamicsPreviewCompositions:React.FC=()=> <React.Fragment>
  <Composition id="EP003Agent2Incident" component={IncidentPreview}
    width={1080} height={1920} fps={30} durationInFrames={150}/>
  <Composition id="EP003Agent2Recovery" component={RecoveryPreview}
    width={1080} height={1920} fps={30} durationInFrames={240}/>
</React.Fragment>;
