/**
 * Efficient native R3F renderer for the APPROVED Agent 2 particle stream.
 * Never instantiate the modelling kit's scripted contact-sparks; Agent 8
 * must disable that kit visual on its own car adapter.
 */
import React,{useLayoutEffect,useMemo,useRef} from 'react';
import * as THREE from 'three';
import type {SkidContact,SparkParticle} from '../../shared/contract.ts';
import {deriveQualityContactGlows,sampleQualitySparkInstances} from './appearance.ts';

export type QualityContactSparksProps=Readonly<{
 particles:readonly SparkParticle[];
 contacts:readonly SkidContact[];
 /** Camera shutter visualization, not a change in simulated lifetime/time. */
 shutterSec?:number;
 maxParticles?:number;
 enableContactLights?:boolean;
}>;
const MAX=260;
const Y_AXIS=new THREE.Vector3(0,1,0);
const CORE_WHITE=new THREE.Color('#fffde2');
const CORE_AMBER=new THREE.Color('#ffac55');
const TAIL_WHITE=new THREE.Color('#fff3a2');
const TAIL_AMBER=new THREE.Color('#e75c29');

export const QualityContactSparks:React.FC<QualityContactSparksProps>=({
 particles,contacts,shutterSec=.014,maxParticles=260,enableContactLights=true,
})=>{
 const streakRef=useRef<THREE.InstancedMesh>(null);
 const coreRef=useRef<THREE.InstancedMesh>(null);
 const visuals=sampleQualitySparkInstances(particles,shutterSec,maxParticles);
 const glows=enableContactLights?deriveQualityContactGlows(contacts,particles):[];
 const temp=useMemo(()=>({
  transform:new THREE.Matrix4(),p:new THREE.Vector3(),q:new THREE.Quaternion(),
  s:new THREE.Vector3(),axis:new THREE.Vector3(),color:new THREE.Color(),
 }),[]);
 useLayoutEffect(()=>{
  const tails=streakRef.current,cores=coreRef.current;
  if(!tails||!cores)return;
  tails.count=visuals.length;cores.count=visuals.length;
  for(let i=0;i<visuals.length;i++){
   const v=visuals[i],{transform,p,q,s,axis,color}=temp;
   axis.set(...v.directionWorld);
   q.setFromUnitVectors(Y_AXIS,axis);
   p.set(...v.trailCentreWorld);
   s.set(v.radiusM*.58,v.streakLengthM,v.radiusM*.58);
   transform.compose(p,q,s);tails.setMatrixAt(i,transform);
   color.copy(TAIL_WHITE).lerp(TAIL_AMBER,v.thermal01*.92)
     .multiplyScalar(.20+2.0*v.brightness01);
   tails.setColorAt(i,color);
   p.set(...v.positionWorld);
   s.setScalar(v.radiusM*(.7+.48*v.brightness01));
   transform.compose(p,new THREE.Quaternion(),s);cores.setMatrixAt(i,transform);
   color.copy(CORE_WHITE).lerp(CORE_AMBER,v.thermal01*.68)
     .multiplyScalar(.30+2.4*v.brightness01);
   cores.setColorAt(i,color);
  }
  tails.instanceMatrix.needsUpdate=true;cores.instanceMatrix.needsUpdate=true;
  if(tails.instanceColor)tails.instanceColor.needsUpdate=true;
  if(cores.instanceColor)cores.instanceColor.needsUpdate=true;
 },[visuals,temp]);
 return <>
  <instancedMesh ref={streakRef} args={[undefined,undefined,MAX]} frustumCulled={false}
    name="EP004-A9-physical-streaks">
   <cylinderGeometry args={[.13,1,1,5,1]}/>
   <meshBasicMaterial color="#ffffff" vertexColors={false} toneMapped={false}
    transparent opacity={.90} depthWrite={false} blending={THREE.AdditiveBlending}/>
  </instancedMesh>
  <instancedMesh ref={coreRef} args={[undefined,undefined,MAX]} frustumCulled={false}
    name="EP004-A9-particle-hot-cores">
   <sphereGeometry args={[1,6,5]}/>
   <meshBasicMaterial color="#ffffff" toneMapped={false}
    transparent opacity={.94} depthWrite={false} blending={THREE.AdditiveBlending}/>
  </instancedMesh>
  {glows.map(g=><group key={g.skidId}>
   <pointLight position={g.positionWorld} intensity={g.intensity}
    color="#ffc288" distance={2.5} decay={2}/>
   <mesh position={[g.positionWorld[0],g.positionWorld[1]-.037,g.positionWorld[2]]}
    rotation={[-Math.PI/2,0,0]} name="EP004-A9-confirmed-contact-road-halo">
    <circleGeometry args={[g.haloRadiusM,20]}/>
    <meshBasicMaterial color="#ff7a36" transparent opacity={Math.min(.23,g.intensity/78)}
     side={THREE.DoubleSide} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending}/>
   </mesh>
  </group>)}
 </>;
};
