/** YUNEX AGENT P — isolated imported-model cinematic study.
 * The GLB must exist at public/porsche-photorealism/911-gt3-rs-992.glb.
 * No procedural vehicle substitute is permitted.
 */
import React, {useEffect, useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useLoader, useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as T from 'three';
import {WorldLighting} from '../../src/yunex/world-kit/components';

export const FPS=30, FRAMES=180;
const MODEL=staticFile('porsche-photorealism/911-gt3-rs-992.glb');
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(t:number)=>{const v=clamp(t);return v*v*(3-2*v);};
type V3=[number,number,number];
const cameraShots:{from:V3;to:V3;look:V3;fov:number}[]=[
  {from:[7.4,2.35,8.5],to:[6.9,2.05,7.8],look:[0,1.05,0],fov:43},
  {from:[0.7,1.9,12.2],to:[-.35,1.75,11.6],look:[0,1.10,0],fov:42},
  {from:[-7.8,2.4,8.7],to:[-7.0,2.1,8.0],look:[0,1.20,0],fov:43}
];
function Camera():null{
  const f=useCurrentFrame(),{camera}=useThree();
  const index=Math.min(2,Math.floor(f/60)),q=cameraShots[index],u=smooth((f-index*60)/59);
  useLayoutEffect(()=>{
    camera.position.set(...q.from.map((n,i)=>n+(q.to[i]-n)*u) as V3);
    camera.lookAt(...q.look);
    if(camera instanceof T.PerspectiveCamera){camera.fov=q.fov;camera.updateProjectionMatrix();}
  },[camera,f,index,u,q]);
  return null;
}
function FilmicOutput():null{
  const {gl,scene}=useThree();
  useLayoutEffect(()=>{
    const before={mapping:gl.toneMapping,exposure:gl.toneMappingExposure,color:gl.outputColorSpace,environment:scene.environmentIntensity};
    gl.toneMapping=T.ACESFilmicToneMapping;
    gl.toneMappingExposure=1.05;
    gl.outputColorSpace=T.SRGBColorSpace;
    scene.environmentIntensity=1.10;
    return()=>{gl.toneMapping=before.mapping;gl.toneMappingExposure=before.exposure;gl.outputColorSpace=before.color;scene.environmentIntensity=before.environment;};
  },[gl,scene]);
  return null;
}
function sourceMaterial(mat:T.Material,mesh:T.Mesh):T.Material{
  const id=(mat.name+' '+mesh.name).toLowerCase();
  // Never replace arbitrary textured bodywork, glass, or wheel material.
  if(!(mat instanceof T.MeshStandardMaterial))return mat;
  if(/tyre|tire|rubber/.test(id)){
    const next=mat.clone();next.metalness=Math.min(next.metalness,.06);
    next.roughness=Math.max(next.roughness,.74);return next;
  }
  if(!/\bpaint\b|car.?paint|body.?paint|paintwork|carbody|body_shell/.test(id))return mat;
  const p=new T.MeshPhysicalMaterial({
    name:mat.name,color:mat.color.clone(),map:mat.map,normalMap:mat.normalMap,
    normalScale:mat.normalScale.clone(),metalnessMap:mat.metalnessMap,roughnessMap:mat.roughnessMap,
    aoMap:mat.aoMap,aoMapIntensity:mat.aoMapIntensity,emissive:mat.emissive.clone(),
    emissiveMap:mat.emissiveMap,emissiveIntensity:mat.emissiveIntensity,
    alphaMap:mat.alphaMap,alphaTest:mat.alphaTest,transparent:mat.transparent,
    opacity:mat.opacity,side:mat.side,depthWrite:mat.depthWrite,
    metalness:Math.max(.25,Math.min(.58,mat.metalness)),roughness:Math.max(.17,Math.min(.32,mat.roughness)),
    clearcoat:.60,clearcoatRoughness:.17,envMapIntensity:1.15
  });
  return p;
}
function ImportedPorsche(){
  const gltf=useLoader(GLTFLoader,MODEL,loader=>{
    loader.setMeshoptDecoder(MeshoptDecoder);
    const draco=new DRACOLoader();
    draco.setDecoderPath(staticFile('porsche-photorealism/draco/'));
    loader.setDRACOLoader(draco);
  });
  const car=useMemo(()=>{
    const object=gltf.scene.clone(true);
    object.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(object,true);
    if(bounds.isEmpty())throw Error('Porsche GLB is empty; never draw a procedural fallback');
    const size=bounds.getSize(new T.Vector3());
    const center=bounds.getCenter(new T.Vector3());
    const length=Math.max(size.x,size.z);
    if(!(length>0&&size.y>0&&Number.isFinite(length)))throw Error('Invalid imported vehicle geometry');
    const scale=4.56/length;
    // Normalize the imported vehicle from actual bounds: no body resculpting.
    // Camera direction is an explicit calibration review gate, not a claimed factory axis.
    const group=new T.Group();
    group.name='review-only-original-992-glb';
    object.scale.setScalar(scale);
    object.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
    object.rotation.y=size.z>size.x?-Math.PI/2:0;
    object.traverse(node=>{
      if(!(node instanceof T.Mesh))return;
      node.castShadow=true;node.receiveShadow=true;
      node.material=Array.isArray(node.material)
        ?node.material.map(m=>sourceMaterial(m,node))
        :sourceMaterial(node.material,node);
    });
    group.add(object);
    group.userData.source='external imported GLB, attribution pending source-chain audit';
    group.userData.modelBounds={x:size.x,y:size.y,z:size.z,normalizedLength:4.56};
    return group;
  },[gltf.scene]);
  useEffect(()=>()=>{car.traverse(o=>{if(o instanceof T.Mesh){const originals=new Set<T.Material>();
    gltf.scene.traverse(s=>{if(s instanceof T.Mesh){const m=Array.isArray(s.material)?s.material:[s.material];m.forEach(x=>originals.add(x));}});
    (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(!originals.has(m))m.dispose();});
  }});},[car,gltf.scene]);
  return <primitive object={car}/>;
}
function Stage(){
  const {width,height}=useVideoConfig();
  return <ThreeCanvas width={width} height={height} shadows camera={{fov:43,near:.05,far:100}}>
    <WorldLighting timeOfDay="day" studio focus={[0,1,0]}/>
    <color attach="background" args={['#353b3e']}/>
    <FilmicOutput/>
    <hemisphereLight args={['#dce5ee','#3b4141',.8]}/>
    <directionalLight color="#f5f2ed" intensity={2.5} position={[4.8,9.0,5.5]} castShadow
      shadow-mapSize={[2048,2048]} shadow-camera-left={-9} shadow-camera-right={9}
      shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={.5}
      shadow-camera-far={30} shadow-bias={-.00014} shadow-normalBias={.025}/>
    <directionalLight color="#d5e7ff" intensity={.9} position={[-6,7,-4]}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.024,0]} receiveShadow>
      <planeGeometry args={[200,200]}/>
      <meshStandardMaterial color="#414648" roughness={.69} metalness={.08}/>
    </mesh>
    <ImportedPorsche/>
    <Camera/>
  </ThreeCanvas>;
}
export const PorschePhotorealism:React.FC=()=> <AbsoluteFill style={{backgroundColor:'#353b3e'}}><Stage/></AbsoluteFill>;
registerRoot(()=> <Composition id="YunexPorsche992Photorealism" component={PorschePhotorealism} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>);
