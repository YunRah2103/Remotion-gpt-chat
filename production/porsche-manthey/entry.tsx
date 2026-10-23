/** YUNEX GT3 RS MANTHEY — original HYPR:IMPS 3D model, distinct from Ddiaz Design Carrera Tribute.
 * The GLB must exist at public/porsche-manthey/manthey-992.glb.
 * Never load the old Carrera Tribute, or a procedural vehicle substitute.
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
const MODEL=staticFile('porsche-manthey/manthey-992.glb');
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(t:number)=>{const v=clamp(t);return v*v*(3-2*v);};
type V3=[number,number,number];
const cameraShots:{from:V3;to:V3;look:V3;fov:number}[]=[
  // Shot 1: genuine front three-quarter Porsche design, headlights and splitter.
  {from:[-5.3,1.48,6.8],to:[-6.2,1.65,7.8],look:[-.20,.90,0],fov:43},
  // Shot 2: lateral silhouette and both visible wheel/tire contact patches.
  {from:[1.45,1.62,9.3],to:[-1.15,1.52,9.6],look:[0,.93,0],fov:46},
  // Shot 3: rear three-quarter wing and diffuser hero.
  {from:[5.85,1.8,7.05],to:[6.7,2.0,7.8],look:[.15,.94,0],fov:43}
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
    gl.toneMappingExposure=1.00;
    gl.outputColorSpace=T.SRGBColorSpace;
    scene.environmentIntensity=1.15;
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
    draco.setDecoderPath(staticFile('porsche-manthey/draco/'));
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
    group.name='original-Manthey-992-HYPRIMPS3D-glb';
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
    group.userData.source='HYPR:IMPS 3D; https://sketchfab.com/3d-models/2024-manthey-racing-porsche-911-gt3-rs-09ccead93fb34944bde812d4b4684eff';
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
    <WorldLighting timeOfDay="dusk" studio focus={[0,1,0]}/>
    <color attach="background" args={['#1a2126']}/>
    <fog attach="fog" args={['#1a2126',18,52]}/>
    <FilmicOutput/>
    <hemisphereLight args={['#d5e0ea','#34393d',.65]}/>
    <directionalLight color="#f5f2ed" intensity={1.7} position={[4.8,9.0,5.5]} castShadow
      shadow-mapSize={[2048,2048]} shadow-camera-left={-9} shadow-camera-right={9}
      shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={.5}
      shadow-camera-far={30} shadow-bias={-.00014} shadow-normalBias={.025}/>
    <directionalLight color="#d5e7ff" intensity={1.35} position={[-6,7,-4]}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.024,0]} receiveShadow>
      <planeGeometry args={[200,200]}/>
      <meshPhysicalMaterial color="#252e32" roughness={.42} metalness={.14} clearcoat={.09} clearcoatRoughness={.4}/>
    </mesh>
    <ImportedPorsche/>
    <Camera/>
  </ThreeCanvas>;
}
export const Manthey992Film:React.FC=()=> <AbsoluteFill style={{backgroundColor:'#1a2126'}}><Stage/></AbsoluteFill>;
registerRoot(()=> <Composition id="YunexManthey992NewModel" component={PorschePhotorealism} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>);
