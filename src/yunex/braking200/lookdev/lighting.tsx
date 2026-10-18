import React,{useEffect,useLayoutEffect,useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import type {Vec3} from '../contracts.ts';
import {BRAKING_PALETTE} from './materials.ts';

/** Art-directed atmospheric sky, not a flat solid color. Geometry is sky-only;
 * it neither modifies nor duplicates the approved car and track meshes. */
function makeCinematicSky():T.SphereGeometry {
 const geometry=new T.SphereGeometry(1,48,24);
 const positions=geometry.getAttribute('position'),colors:number[]=[];
 const high=new T.Color('#52788e'),mid=new T.Color('#8fb2bf'),
   horizon=new T.Color('#c8c8b7'),below=new T.Color('#a6b8ae');
 const mix=(a:T.Color,b:T.Color,t:number)=>a.clone().lerp(b,Math.min(1,Math.max(0,t)));
 for(let i=0;i<positions.count;i++){
   const y=positions.getY(i);
   const col=y>.33?mix(mid,high,(y-.33)/.62):
     y>0?mix(horizon,mid,y/.33):mix(below,horizon,(y+.18)/.18);
   colors.push(col.r,col.g,col.b);
 }
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 return geometry;
}
export const CinematicSky:React.FC=()=>{
 const geometry=useMemo(makeCinematicSky,[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh scale={[190,190,190]} geometry={geometry} frustumCulled={false}
  renderOrder={-100}>
  <meshBasicMaterial vertexColors side={T.BackSide} depthWrite={false}
   depthTest={true} fog={false} toneMapped={false}/>
 </mesh>;
};

const ReflectedDaylight:React.FC=()=>{
 const {gl,scene}=useThree();
 useLayoutEffect(()=>{
  const previous={environment:scene.environment,intensity:scene.environmentIntensity,
    mapping:gl.toneMapping,exposure:gl.toneMappingExposure};
  let radiance:T.WebGLRenderTarget<T.Texture>|undefined;
  gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=.98;
  try{
   const pmrem=new T.PMREMGenerator(gl),room=new RoomEnvironment();
   try{radiance=pmrem.fromScene(room,.07);}
   finally{pmrem.dispose();room.dispose();}
   scene.environment=radiance.texture;scene.environmentIntensity=.52;
  }catch(_err){/* Physical key/bounce/rim still render on software swangle. */}
  return ()=>{
   scene.environment=previous.environment;
   scene.environmentIntensity=previous.intensity;
   gl.toneMapping=previous.mapping;gl.toneMappingExposure=previous.exposure;
   radiance?.dispose();
  };
 },[gl,scene]);return null;
};
/** Sculptural low sun, controllable soft sky fill and warm/cool edge separation.
 * Highlights are restrained; never depend on unrealistic additive bloom. */
export const BrakingLighting:React.FC<{focus?:Vec3;studio?:boolean}>=({
 focus=[0,0,0],studio=false
})=>{
 const target=useMemo(()=>new T.Object3D(),[]);
 target.position.set(...focus);
 return <>
  <color attach="background" args={[studio?'#223440':BRAKING_PALETTE.sky]}/>
  {!studio&&<CinematicSky/>}
  <fog attach="fog" args={[studio?'#223440':'#9bb3b7',studio?24:93,studio?110:225]}/>
  <hemisphereLight args={['#c9deeb','#54564e',studio?1.01:.94]}/>
  <ambientLight color="#eee6d6" intensity={studio?.12:.09}/>
  <primitive object={target}/>
  <directionalLight target={target}
    position={[focus[0]+25,focus[1]+19,focus[2]+24]}
    color="#ffe2b8" intensity={studio?2.95:3.10}
    castShadow shadow-mapSize={[2048,2048]}
    shadow-camera-left={-19} shadow-camera-right={19}
    shadow-camera-top={19} shadow-camera-bottom={-19}
    shadow-camera-near={.4} shadow-camera-far={115}
    shadow-bias={-.00035} shadow-normalBias={.017}/>
  <directionalLight position={[focus[0]-16,focus[1]+13,focus[2]-20]}
    color="#8bbdd6" intensity={studio?1.10:1.05}/>
  <directionalLight position={[focus[0]-9,focus[1]+7,focus[2]+12]}
    color="#fff3d1" intensity={studio?.46:.24}/>
  {studio&&<directionalLight position={[-3.5,2.5,-1]} color="#a3cee1" intensity={2.1}/>}
  <ReflectedDaylight/>
 </>;
};
export const BrakingWorldLighting=BrakingLighting;
