import React,{useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {createVehicle,animateVehicle} from '../../../../src/yunex/world-kit/index.ts';
import {routeLength,sampleRoute} from '../../../../src/yunex/world-kit/environments.ts';
import {CameraAim,WorldLighting} from '../../../../src/yunex/world-kit/components.tsx';
import {sampleTrackSurface} from '../../shared/track.ts';
import type {SkidDescriptor,SparkParticle,Vec3} from '../../shared/contract.ts';
import {sampleDynamics,sampleContactDrivenSparks} from '../../physics/index.ts';

const PREVIEW_SKIDS:readonly SkidDescriptor[]=[{id:'forward',metal:true,localBottomPoint:[1.05,.065,0]}];
// EXPLICIT VISUAL FIXTURE; replace with Agent 1 getSkidDescriptors() for approval.
const ORIGIN=69.0;
const carForward=(yaw:number,x:number,z:number):[number,number] =>
  [Math.cos(yaw)*x+Math.sin(yaw)*z,-Math.sin(yaw)*x+Math.cos(yaw)*z];

function createExactTrackRibbon() {
  const length=routeLength('track'),n=620,vertices:number[]=[],indices:number[]=[];
  for(let i=0;i<=n;i++) {
    const distance=length*i/n,route=sampleRoute('track',distance);
    const surface=sampleTrackSurface(distance),yaw=route.yaw;
    for(const side of [-1,1]) {
      const [x,z]=carForward(yaw,0,side*6.0);
      vertices.push(route.position[0]+x,surface.heightM,route.position[2]+z);
    }
    if(i<n){const o=i*2;indices.push(o,o+1,o+2,o+1,o+3,o+2);}
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
const Ribbon:React.FC=()=>{
 const geometry=useMemo(()=>createExactTrackRibbon(),[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry} receiveShadow><meshStandardMaterial color="#2c303a" side={T.DoubleSide} roughness={.90} metalness={.08}/></mesh>;
};
const MovingCar:React.FC<{distanceM:number;worldPosition:Vec3;yaw:number;pitch:number;roll:number}>=({distanceM,worldPosition,yaw,pitch,roll})=>{
 const car=useMemo(()=>createVehicle({variant:'formula-modern',color:'#08bba9',accent:'#d3ad63',lights:true}),[]);
 useEffect(()=>()=>{car.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();}});},[car]);
 animateVehicle(car,distanceM);
 car.position.set(...worldPosition);
 car.rotation.set(0,yaw,0);car.rotateZ(pitch);car.rotateX(roll);
 return <primitive object={car}/>;
};
const ParticleInstances:React.FC<{particles:readonly SparkParticle[]}>=({particles})=>{
 const ref=useRef<T.InstancedMesh>(null);
 const matrix=useMemo(()=>new T.Matrix4(),[]);
 const position=useMemo(()=>new T.Vector3(),[]);
 const scale=useMemo(()=>new T.Vector3(),[]);
 const quat=useMemo(()=>new T.Quaternion(),[]);
 useLayoutEffect(()=>{
  const inst=ref.current;if(!inst)return;
  inst.count=Math.min(particles.length,260);
  particles.slice(0,260).forEach((p,i)=>{
   position.set(...p.positionWorld);scale.setScalar(p.radiusM*1.9);
   matrix.compose(position,quat,scale);inst.setMatrixAt(i,matrix);
   const warm=new T.Color('#fff3bb').lerp(new T.Color('#ff8d3a'),Math.min(1,p.ageSec/p.lifetimeSec));
   inst.setColorAt(i,warm.multiplyScalar(Math.max(.05,p.luminance01)));
  });
  inst.instanceMatrix.needsUpdate=true;
  if(inst.instanceColor)inst.instanceColor.needsUpdate=true;
 },[particles,matrix,position,scale,quat]);
 return <instancedMesh ref={ref} args={[undefined,undefined,260]} frustumCulled={false}>
   <sphereGeometry args={[1,5,4]}/>
   <meshBasicMaterial color="#fff1b2" toneMapped={false} transparent opacity={.98}/>
 </instancedMesh>;
};
export const Agent2PhysicsPreview:React.FC<{mode:'technical'|'portrait'}>=({mode})=>{
 const {width,height,fps}=useVideoConfig();
 const frame=useCurrentFrame(),t=frame/fps;
 const motion=sampleDynamics(t,{startDistanceM:ORIGIN});
 const {contacts,particles}=sampleContactDrivenSparks(t,motion,PREVIEW_SKIDS);
 const contact=contacts[0],active=contact.active;
 const at=(forward:number,up:number,left:number):Vec3=>{
  const [x,z]=carForward(motion.yawRad,forward,left);
  return [motion.worldPosition[0]+x,motion.worldPosition[1]+up,motion.worldPosition[2]+z];
 };
 const technical=mode==='technical';
 const camera=technical?at(1.05,.67,2.85):at(-7.2,2.6,5.35);
 const target=technical?at(.8,.05,0):at(.55,.35,0);
 const world=sampleRoute('track',motion.routeDistanceM);
 return <AbsoluteFill style={{background:'#0a111c'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{position:camera,fov:technical?30:42,near:.045,far:230}}>
   <WorldLighting timeOfDay="night" focus={world.position}/>
   <CameraAim position={camera} target={target} fov={technical?30:42}/>
   <Ribbon/>
   <MovingCar distanceM={motion.routeDistanceM} worldPosition={motion.worldPosition} yaw={motion.yawRad} pitch={motion.pitchRad} roll={motion.rollRad}/>
   {/* temporary labelled physical metal object; delete when Agent 1 supplies fitted mesh */}
   <mesh position={at(1.05,.075,0)}><boxGeometry args={[.26,.018,.21]}/><meshStandardMaterial color="#dce6d9" metalness={.95} roughness={.24}/></mesh>
   <ParticleInstances particles={particles}/>
   {active&&<pointLight position={[contact.pointWorld[0],contact.pointWorld[1]+.20,contact.pointWorld[2]]} color="#ffd78c" intensity={8+40*contact.contactIntensity01} distance={4}/>}
   <hemisphereLight args={['#a6cad9','#212633',.45]}/>
  </ThreeCanvas>
  <div style={{position:'absolute',top:90,left:56,color:'#e7f8ff',fontFamily:'Arial,sans-serif',background:'#101823ca',padding:'20px 24px',borderLeft:'4px solid #46e8d0'}}>
   <div style={{fontSize:27,letterSpacing:3,fontWeight:800}}>{technical?'CONTACT PHYSICS / FIXTURE':'YUNEX EP004 / SPARK MOTION'}</div>
   <div style={{fontSize:22,marginTop:12,color:active?'#ffce78':'#9acbd5'}}>METAL SKID {active?'TOUCHING ASPHALT':'CLEAR OF ASPHALT'}</div>
   <div style={{fontSize:21,marginTop:6}}>SIGNED GAP {contact.signedGapM>=0?'+':''}{(contact.signedGapM*1000).toFixed(1)} mm · {Math.round(motion.speedMps*3.6)} km/h</div>
  </div>
  <div style={{position:'absolute',bottom:90,left:60,color:'#d6dce5',fontFamily:'Arial,sans-serif',fontSize:20,background:'#0c1325bb',padding:'12px 16px'}}>
   ILLUSTRATIVE MODEL · TEMP SKID FIXTURE · NOT FIA TELEMETRY
  </div>
 </AbsoluteFill>;
};
