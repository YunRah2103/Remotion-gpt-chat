import React,{useEffect,useLayoutEffect,useMemo,useState} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill,delayRender,continueRender,cancelRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {applyCinemaCamera,ease,SHOT_MAP} from './camera-v2';
import {Editorial} from './editorial';

type Triple=[number,number,number];
type MotionPose={position:Triple;rotation:Triple};
type Move={startFrame:number;endFrame:number;easing:'smoothstep';from:MotionPose;to:MotionPose};
export type PolishedMotion={schemaVersion:1;fps:30;durationInFrames:450;nodes:Record<string,Move>};
const MOVING=['FAN_LEFT','FAN_CENTER','FAN_RIGHT','FRONT_SHROUD',
  'HEATSINK','HEATSINK_FINS','HEATPIPE_BUNDLE','COLD_PLATE',
  'GPU_DIE','VRAM_CHIPS','VRM_COMPONENTS','PCB_ASSEMBLY','BACKPLATE'] as const;
const REQUIRED=['GPU_ROOT','FAN_ASSEMBLY',...MOVING,
  'PCB','PCIE_FINGERS','POWER_8PIN','IO_BRACKET'];
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export function validateAssets(model:THREE.Object3D,motion:PolishedMotion){
  if(motion.schemaVersion!==1||motion.fps!==30||motion.durationInFrames!==450)
    throw Error('POLISH05 B schema/fps/duration mismatch');
  const counts=new Map<string,number>();
  model.traverse(n=>counts.set(n.name,(counts.get(n.name)||0)+1));
  for(const name of REQUIRED)if(counts.get(name)!==1)
    throw Error('POLISH05 B required unique anchor '+name+': '+(counts.get(name)||0));
  for(const name of MOVING){
    const move=motion.nodes[name];
    if(!move||move.easing!=='smoothstep'||!Number.isInteger(move.startFrame)||
      !Number.isInteger(move.endFrame)||move.startFrame<90||
      move.endFrame>329||move.startFrame>=move.endFrame)throw Error('Invalid POLISH05 move '+name);
    for(const pose of [move.from,move.to]){
      for(const part of ['position','rotation'] as const)
        if(!Array.isArray(pose?.[part])||pose[part].length!==3||
          pose[part].some(v=>!Number.isFinite(v)))throw Error('Bad '+name+' motion '+part);
    }
    if([...move.from.position,...move.from.rotation].some(v=>Math.abs(v)>1e-7))
      throw Error('POLISH05 motion must be additive zero-origin: '+name);
  }
}
const refineMaterial=(source:THREE.Material)=>{
  const material=source.clone();
  if(material instanceof THREE.MeshStandardMaterial){
    // No fake emissive silhouette; retain authored albedo and PBR distinctions.
    material.roughness=Math.max(.27,material.roughness);
    material.metalness=Math.min(.92,material.metalness);
    material.needsUpdate=true;
  }
  return material;
};
export const HardwareAndCamera:React.FC<{
  frame:number;model:THREE.Object3D;motion:PolishedMotion;width:number;height:number;
}>=({frame,model,motion,width,height})=>{
  const {camera}=useThree();
  const gpu=useMemo(()=>{
    const clone=model.clone(true);
    clone.traverse(n=>{
      if((n as THREE.Mesh).isMesh){
        const mesh=n as THREE.Mesh;
        mesh.castShadow=true;mesh.receiveShadow=true;
        mesh.material=Array.isArray(mesh.material)?
          mesh.material.map(refineMaterial):refineMaterial(mesh.material);
      }
    });
    return clone;
  },[model]);
  const authored=useMemo(()=>{
    const map=new Map<string,{p:THREE.Vector3;r:THREE.Euler}>();
    for(const name of MOVING){
      const node=gpu.getObjectByName(name)!;
      map.set(name,{p:node.position.clone(),r:node.rotation.clone()});
    }
    return map;
  },[gpu]);
  useLayoutEffect(()=>{
    for(const name of MOVING){
      const node=gpu.getObjectByName(name)!,original=authored.get(name)!,move=motion.nodes[name];
      const t=ease(frame,move.startFrame,move.endFrame);
      node.position.set(
        original.p.x+mix(move.from.position[0],move.to.position[0],t),
        original.p.y+mix(move.from.position[1],move.to.position[1],t),
        original.p.z+mix(move.from.position[2],move.to.position[2],t));
      node.rotation.set(
        original.r.x+mix(move.from.rotation[0],move.to.rotation[0],t),
        original.r.y+mix(move.from.rotation[1],move.to.rotation[1],t),
        original.r.z+mix(move.from.rotation[2],move.to.rotation[2],t),original.r.order);
    }
    gpu.updateMatrixWorld(true);
    applyCinemaCamera(camera,frame,gpu,width,height);
  },[gpu,authored,frame,motion,camera,width,height]);
  return <primitive object={gpu}/>;
};
export const StudioLighting:React.FC=()=> <React.Fragment>
  <color attach="background" args={['#1c2227']}/>
  <ambientLight intensity={.42} color="#e8ebec"/>
  <hemisphereLight args={['#f4f4f1','#2b343c',1.2]}/>
  <directionalLight position={[-3.8,6.8,7.1]} intensity={3.8}
    color="#fff9f3" castShadow shadow-mapSize-width={2048}
    shadow-mapSize-height={2048} shadow-bias={-.0003}/>
  <spotLight position={[1.4,4.8,8.5]} intensity={21} angle={.88}
    penumbra={1} color="#f7f8fa"/>
  <directionalLight position={[6.4,1.0,2.6]} intensity={2.15} color="#f5f5f3"/>
  <directionalLight position={[2.1,3.2,-6.8]} intensity={3.5} color="#eef2f4"/>
  <directionalLight position={[-5.0,-3.7,3.0]} intensity={1.0} color="#e2e5e8"/>
</React.Fragment>;
/** Final integration interface: paths point only to manager-staged POLISH05 bytes.
 * An Agent-B Actions proof may stage explicitly labelled POLISH03 test bytes at
 * exactly these temporary file paths. There is NO runtime old-model fallback.
 */
export const GpuDecompositionPolish5CinemaTest:React.FC=()=>{
  const frame=useCurrentFrame(),{width,height}=useVideoConfig();
  const [handle]=useState(()=>delayRender('POLISH05 B: load final GLB/motion'));
  const [loaded,setLoaded]=useState<{model:THREE.Object3D;motion:PolishedMotion}|null>(null);
  useEffect(()=>{
    let active=true;
    Promise.all([
      new GLTFLoader().loadAsync(staticFile('gpu-decompose/polish5/xfx_swift_rx9060xt_polish5.glb')),
      fetch(staticFile('gpu-decompose/polish5/decomposition.v2.json')).then(async r=>{
        if(!r.ok)throw Error('POLISH05 motion missing HTTP '+r.status);
        return await r.json() as PolishedMotion;
      }),
    ]).then(([glb,motion])=>{
      validateAssets(glb.scene,motion);
      if(!active)return;
      setLoaded({model:glb.scene,motion});
      continueRender(handle);
    }).catch(e=>{if(active)cancelRender(e instanceof Error?e:Error(String(e)))});
    return ()=>{active=false};
  },[handle]);
  return <AbsoluteFill style={{background:'#1c2227',overflow:'hidden',
      color:'#f3f3f1',fontFamily:'Arial,Helvetica,sans-serif'}}>
    <ThreeCanvas width={width} height={height}
      camera={{position:[4,2,12],fov:32,near:.04,far:200}}
      shadows gl={{antialias:true,preserveDrawingBuffer:true}}>
      <StudioLighting/>
      {loaded?<HardwareAndCamera frame={frame} model={loaded.model}
        motion={loaded.motion} width={width} height={height}/>:null}
    </ThreeCanvas>
    <Editorial frame={frame} stages={SHOT_MAP}/>
  </AbsoluteFill>;
};
