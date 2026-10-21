/** V2 native physics shot: real Agent 1 skid geometry, real Agent 4 asphalt.
 * Editorial slow motion never triggers sparks; all glints come from historic metal contact.
 */
import React,{useLayoutEffect,useMemo,useRef} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {CameraAim} from '../../../../../src/yunex/world-kit/components.tsx';
import {F1HeroVehicle,getSkidDescriptors} from '../../mechanics/index.ts';
import {NightCircuitWorld} from '../../look/index.ts';
import {sampleDynamics,sampleContactDrivenSparks,localToWorld} from '../../physics/index.ts';
import type {SparkParticle,SkidContact,Vec3,VehicleMotionState} from '../../shared/contract.ts';
import {samplePreviewShot} from './shot-plan.ts';
import type {PreviewMode,PreviewShot} from './shot-plan.ts';

const SKIDS=getSkidDescriptors();
const MAX_PARTICLES=260;
const UP=new T.Vector3(0,1,0);
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const at=(m:VehicleMotionState,x:number,y:number,z:number):Vec3=>localToWorld([x,y,z],m);

const ParticleStreaks:React.FC<{particles:readonly SparkParticle[]}>=({particles})=>{
 const core=useRef<T.InstancedMesh>(null),halo=useRef<T.InstancedMesh>(null);
 const obj=useMemo(()=>new T.Object3D(),[]);
 const v=useMemo(()=>new T.Vector3(),[]);
 const col=useMemo(()=>new T.Color(),[]);
 const white=useMemo(()=>new T.Color('#fff6d1'),[]);
 const orange=useMemo(()=>new T.Color('#ff9c45'),[]);
 useLayoutEffect(()=>{
  const a=core.current,h=halo.current;if(!a||!h)return;
  const count=Math.min(particles.length,MAX_PARTICLES);a.count=count;h.count=count;
  for(let i=0;i<count;i++){
   const p=particles[i],age=p.ageSec/p.lifetimeSec;
   v.set(...p.velocityWorld);
   const speed=v.length();
   if(speed>.0001)obj.quaternion.setFromUnitVectors(UP,v.divideScalar(speed));
   else obj.quaternion.identity();
   obj.position.set(...p.positionWorld);
   const radius=clamp(p.radiusM*.50,.005,.013);
   const length=clamp(speed/95,.07,.25);
   obj.scale.set(radius,length,radius);obj.updateMatrix();a.setMatrixAt(i,obj.matrix);
   obj.scale.set(radius*2.6,length*1.5,radius*2.6);obj.updateMatrix();h.setMatrixAt(i,obj.matrix);
   col.copy(white).lerp(orange,clamp(age,0,1)*.82).multiplyScalar(.55+.45*p.luminance01);
   a.setColorAt(i,col);
   h.setColorAt(i,new T.Color('#f4ad62').multiplyScalar(.16*p.luminance01));
  }
  a.instanceMatrix.needsUpdate=true;h.instanceMatrix.needsUpdate=true;
  if(a.instanceColor)a.instanceColor.needsUpdate=true;
  if(h.instanceColor)h.instanceColor.needsUpdate=true;
 },[particles,obj,v,col,white,orange]);
 return <>
  <instancedMesh ref={halo} args={[undefined,undefined,MAX_PARTICLES]} frustumCulled={false} renderOrder={5}>
   <cylinderGeometry args={[1,1,1,5]}/>
   <meshBasicMaterial color="#ffb060" toneMapped={false} blending={T.AdditiveBlending} transparent opacity={.19} depthWrite={false}/>
  </instancedMesh>
  <instancedMesh ref={core} args={[undefined,undefined,MAX_PARTICLES]} frustumCulled={false} renderOrder={6}>
   <cylinderGeometry args={[1,1,1,8]}/>
   <meshBasicMaterial color="#fff4d8" toneMapped={false} blending={T.AdditiveBlending} depthWrite={false}/>
  </instancedMesh>
 </>;
};

const SparkContact:React.FC<{contacts:readonly SkidContact[];technical:boolean}>=({contacts,technical})=>
 <>{contacts.filter(c=>c.active).map(c=><group key={c.skidId}>
  <pointLight position={[c.pointWorld[0],c.pointWorld[1]+.13,c.pointWorld[2]]} color="#ffc486"
   intensity={9+20*c.contactIntensity01} distance={3.3} decay={2}/>
  {technical&&<mesh position={[c.pointWorld[0],c.pointWorld[1]+.018,c.pointWorld[2]]}>
    <sphereGeometry args={[.025,8,8]}/><meshBasicMaterial color="#ffe7ae" toneMapped={false}/>
  </mesh>}
 </group>)}</>;

function cameraFor(motion:VehicleMotionState,shot:PreviewShot,tSec:number){
 const presets={
  'underfloor-front':{eye:[2.2,1.05,5.4],target:[.82,.15,0],fov:54},
  'underfloor-rear':{eye:[-2.7,1.11,-5.2],target:[-.4,.14,0],fov:55},
  'chase':{eye:[-7.0,2.6,5.9],target:[.2,.40,0],fov:56},
  'approach':{eye:[5.8,1.8,5.6],target:[.4,.35,0],fov:57},
  'payoff':{eye:[-7.8,2.4,-6.4],target:[.15,.37,0],fov:56},
 } as const;
 const d=presets[shot.angle],drift=Math.sin(tSec*.73)*.13;
 return {eye:at(motion,d.eye[0],d.eye[1],d.eye[2]+drift),
  target:at(motion,d.target[0],d.target[1],d.target[2]),fov:d.fov};
}

export const Agent2PhysicsPreview:React.FC<{mode:PreviewMode}>=({mode})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const {shot,sourceTimeSec,localFrame}=samplePreviewShot(mode,frame,fps);
 const motion=sampleDynamics(sourceTimeSec,{startDistanceM:shot.startDistanceM});
 const {contacts,particles}=sampleContactDrivenSparks(sourceTimeSec,motion,SKIDS);
 const {eye,target,fov}=cameraFor(motion,shot,sourceTimeSec);
 const technical=mode==='technical',active=contacts.some(c=>c.active);
 const nearest=[...contacts].sort((a,b)=>a.signedGapM-b.signedGapM)[0];
 const sceneNumber=mode==='technical'?(frame<75?1:2):(frame<70?1:frame<140?2:3);
 const headline=active?'METAL ON ASPHALT':particles.length?'SKID LIFTED · HOT CHIPS IN FLIGHT':'METAL SKID CLEAR';
 return <AbsoluteFill style={{background:'#081320'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{position:eye,fov,near:.035,far:350}}
   gl={{antialias:true,alpha:false,preserveDrawingBuffer:true}}>
    <NightCircuitWorld motion={motion} particles={particles} exposure={1}/>
    <F1HeroVehicle motion={motion} reveal01={technical?.66:0}/>
    <ParticleStreaks particles={particles}/>
    <SparkContact contacts={contacts} technical={technical}/>
    <CameraAim position={eye} target={target} fov={fov}/>
  </ThreeCanvas>
  <div style={{position:'absolute',top:0,left:0,right:0,height:450,pointerEvents:'none',
    background:'linear-gradient(to bottom,#081221ed,#08122177,transparent)'}}/>
  <div style={{position:'absolute',bottom:0,left:0,right:0,height:370,pointerEvents:'none',
    background:'linear-gradient(to top,#07101ce8,transparent)'}}/>
  <div style={{position:'absolute',top:115,left:64,right:62,color:'#f5f9fc',fontFamily:'Arial,sans-serif'}}>
   <div style={{fontSize:20,letterSpacing:4,color:'#72d9d1',fontWeight:800}}>
    YUNEX / F1 SPARKS · PASS {String(sceneNumber).padStart(2,'0')}
   </div>
   <div style={{fontSize:51,fontWeight:900,lineHeight:1.05,marginTop:20,
    textShadow:'0 3px 22px #081320'}}>{shot.title}</div>
   <div style={{fontSize:22,color:'#b5d7df',marginTop:19,letterSpacing:2,fontWeight:700}}>
    SLOW MOTION {shot.playbackRate.toFixed(2)}× · 223 KM/H SOURCE SPEED
   </div>
  </div>
  <div style={{position:'absolute',bottom:203,left:65,right:65,color:'#edf5f9',fontFamily:'Arial,sans-serif'}}>
   <div style={{fontSize:24,letterSpacing:2,fontWeight:800,color:active?'#ffca7a':'#a9d5de'}}>{headline}</div>
   <div style={{fontSize:21,marginTop:10}}>SKID GAP {nearest.signedGapM>=0?'+':''}{(nearest.signedGapM*1000).toFixed(1)} mm
    {'  ·  '}{particles.length} METAL-BORN GLINTS</div>
   <div style={{background:'#fff4',height:3,marginTop:21}}>
    <div style={{height:'100%',background:'#ffbd70',width:String(100*localFrame/(shot.frames-1))+'%'}}/>
   </div>
  </div>
  <div style={{position:'absolute',bottom:87,left:65,color:'#b5c8d0',fontSize:17,letterSpacing:1.5,
   fontFamily:'Arial,sans-serif'}}>REAL EP004 CAR + SKIDS + CIRCUIT · ILLUSTRATIVE PHYSICS</div>
 </AbsoluteFill>;
};
