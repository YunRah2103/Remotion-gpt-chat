/** Agent 8 exclusive standalone Remotion preview: never edits Agent 6's Root. */
import React,{useEffect,useMemo} from 'react';
import {AbsoluteFill,Composition,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {createVehicle} from '../../../../src/yunex/world-kit/vehicles.ts';
import {animateVehicle} from '../../../../src/yunex/world-kit/motion.ts';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {WorldLighting,CameraAim} from '../../../../src/yunex/world-kit/components.tsx';
import {EP003_SCENE} from '../shared/contract.ts';
import {sampleCrashOutcome} from './model.ts';
import {CrashBarrierWorld,ImpactRailScars3D} from './Barrier.tsx';
import type {CrashOutcomeFrame} from './model.ts';

type V3=[number,number,number];
const clamp=(v:number,a=0,b=1)=>Math.min(b,Math.max(a,v));
function makeOriginalGrandTourer():T.Group{
 const root=createVehicle({variant:'grand-tourer',color:EP003_SCENE.paint,
  accent:'#C9A777',interior:true,lights:false});
 // Match the approved A4 material recipe on the ORIGINAL kit model in preview;
 // after branch integration use A4 finishGrandTourer() without a duplicate model.
 const body=root.getObjectByName('arched-body');
 if(body instanceof T.Mesh&&body.material instanceof T.MeshPhysicalMaterial){
  body.material.color.set(EP003_SCENE.paint);
  body.material.metalness=.43;body.material.roughness=.31;
  body.material.clearcoat=.82;body.material.clearcoatRoughness=.19;
 }
 return root;
}
type DentTarget={mesh:T.Mesh;origin:Float32Array;position:T.BufferAttribute};
function setupDent(root:T.Group):DentTarget|undefined{
 const part=root.getObjectByName('arched-body');
 if(!(part instanceof T.Mesh)||!(part.geometry instanceof T.BufferGeometry))return;
 part.geometry=part.geometry.clone(); // never mutate the shared vehicle kit
 const position=part.geometry.getAttribute('position') as T.BufferAttribute;
 return {mesh:part,origin:new Float32Array(position.array as ArrayLike<number>),position};
}
function applyOriginalKitDamage(target:DentTarget|undefined,frame:CrashOutcomeFrame){
 if(!target)return;
 const {origin,position}=target;
 for(let i=0;i<position.count;i++){
  const ix=3*i,ox=origin[ix],oy=origin[ix+1],oz=origin[ix+2];
  const nose=clamp((ox-1.42)/1.0),side=clamp((-oz-.30)/.72);
  const blend=nose*nose*side*side;
  position.setXYZ(i,ox-frame.bumperCrushM*blend,
   oy+frame.fenderCrushM*.18*blend,
   oz+frame.fenderCrushM*.72*blend);
 }
 position.needsUpdate=true;target.mesh.geometry.computeVertexNormals();
}
export const CrashCarRig:React.FC<{frame:CrashOutcomeFrame}>=({frame})=>{
 const original=useMemo(makeOriginalGrandTourer,[]);
 const dent=useMemo(()=>setupDent(original),[original]);
 const trim=useMemo(()=>{
  const originalPositions=new Map<T.Object3D,[number,number,number]>();
  original.traverse(o=>{
   if(o.name==='lamp-lens'||o.name==='headlamp-housing'||
      o.name==='lamp-reflector'||o.name==='front-lip'){
    originalPositions.set(o,[o.position.x,o.position.y,o.position.z]);
   }
  });return originalPositions;
 },[original]);
 useEffect(()=>()=>disposeObject(original),[original]);
 // Original kit car body, cabin, wheels and interior are NEVER replaced with a box.
 animateVehicle(original,frame.distanceTravelledM,frame.driverSteerRad);
 original.position.set(...frame.scenePositionM);
 original.rotation.set(frame.pitchRad,frame.headingRad,frame.rollRad,'YXZ');
 applyOriginalKitDamage(dent,frame);
 trim.forEach((p,node)=>{
  node.position.set(...p);
  if(p[0]>1.7&&p[2]<-.12){
   node.position.x-=frame.lampCrushM*.8;
   node.position.z+=frame.lampCrushM*.35;
   if(node.name==='lamp-lens')node.scale.set(1-frame.lampCrushM*.9,1,1);
  }
 });
 // Same original failed front-right tyre/rim/brake hierarchy. This standalone
 // kit fixture compresses rubber only; Agent 1's final rig slots in at merge.
 original.traverse(o=>{
  if(!o.name.startsWith('steer-')||!o.userData.steering)return;
  const rightFront=o.position.x>0&&o.position.z<0;
  if(!rightFront)return;
  const wheelRoll=o.getObjectByName('wheel-roll');
  if(wheelRoll)wheelRoll.rotation.z=frame.frontRightWheelSpinRad;
  const tyre=o.getObjectByName('tyre');
  if(tyre)tyre.scale.y=.84-.08*(1-frame.frontRightPressureRatio);
 });
 return <primitive object={original}/>;
};
/** Seek-safe debris from frozen first-contact point; no random renderer mutation. */
export const CrashDebris:React.FC<{frame:CrashOutcomeFrame}>=({frame})=>{
 if(!frame.contact.occurred||frame.contact.firstContactSec===null||
    frame.contact.firstContactX===null||frame.contact.firstContactZ===null)return null;
 const age=frame.relativeTimeSec-frame.contact.firstContactSec;
 const impactX=frame.contact.firstContactX,railZ=frame.contact.firstContactZ;
 return <group>
  {Array.from({length:30},(_,i)=>{
   const seed=(n:number)=>Math.abs(Math.sin((i+1)*n*17.151)*43758.5453)%1;
   const phase=age, vx=2.4+seed(3)*8.5, vz=-1.5+seed(5)*3.0;
   const vy=.9+seed(7)*2.3;
   const x=impactX+vx*phase, y=Math.max(.055,.42+vy*phase-4.9*phase*phase);
   const z=railZ+.10+vz*phase;
   const isSpark=i<12;
   const life=isSpark?.54:1.2;
   if(age>life||phase<0)return null;
   const opacity=clamp((life-age)/life)*.92;
   const radius=isSpark?.018:.027+seed(9)*.037;
   return <mesh key={i} position={[x,y,z]} rotation={[phase*6,i*.7,phase*8]}>
    <boxGeometry args={[radius*(isSpark?4:1),radius,radius]}/>
    <meshStandardMaterial color={isSpark?'#f5b568':(i%3===0?'#272a2a':'#647377')}
      emissive={isSpark?'#f2852a':'#000000'} emissiveIntensity={isSpark?.75:0}
      transparent opacity={opacity} roughness={.8}/>
   </mesh>;
  })}
  {Array.from({length:6},(_,i)=>{
   if(age>1.35)return null;
   const seed=(i+1)/6;
   const x=impactX+age*(2.1+seed*3.3),z=railZ+.14+seed*.35;
   const radius=.25+age*.85;
   return <mesh key={'dust'+i} position={[x,.22+age*.16,z]}
    scale={[radius,radius*.5,radius]}>
    <sphereGeometry args={[1,10,7]}/>
    <meshStandardMaterial color="#9aa09b" roughness={1} transparent
      opacity={.22*(1-clamp(age/1.35))} depthWrite={false}/>
   </mesh>;
  })}
 </group>;
};
export const ImpactEffects3D:React.FC<{frame:CrashOutcomeFrame}>=({frame})=><>
 <CrashDebris frame={frame}/>
 <ImpactRailScars3D frame={frame}/>
</>;
const useCamera=(frame:CrashOutcomeFrame,kind:'approach'|'close')=>{
 const [x,,z]=frame.scenePositionM;
 // Visual QA: previous low camera put a median in the chase view and
 // blocked frontal damage behind the guardrail. Rise above its upper lip.
 const position:V3=kind==='approach'
  ?[x-9.8,5.5,Math.min(-1.15,z+1.3)]
  :[x+5.9,5.5,Math.min(-9.8,z-4.2)];
 const target:V3=kind==='approach'?[x+.6,.72,z-.55]:[x+.82,.66,z-.65];
 return {position,target,fov:kind==='approach'?49:46};
};
export const CrashPreview:React.FC<{kind:'approach'|'close'}>=({kind})=>{
 const videoFrame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const t=kind==='approach'?videoFrame/fps:1.10+videoFrame/fps;
 const crash=sampleCrashOutcome(Math.min(4.5,t));
 const camera=useCamera(crash,kind);
 return <AbsoluteFill style={{background:'#b7ced8'}}>
  <ThreeCanvas width={width} height={height} shadows
   camera={{position:camera.position,fov:camera.fov,near:.1,far:310}}>
   <WorldLighting timeOfDay="day" focus={[crash.scenePositionM[0],0,crash.scenePositionM[2]]}/>
   <CrashBarrierWorld frame={crash}/>
   <CameraAim position={camera.position} target={camera.target} fov={camera.fov}/>
   <CrashCarRig frame={crash}/>
   <ImpactEffects3D frame={crash}/>
  </ThreeCanvas>
  <div style={{position:'absolute',top:'7%',left:'7%',right:'7%',
   fontFamily:'Arial,sans-serif',fontWeight:800,letterSpacing:1.6,
   color:'#ffffff',textShadow:'0 3px 10px #12252a',fontSize:32}}>
   HYPOTHETICAL WRONG REACTION
   <div style={{fontSize:18,fontWeight:500,marginTop:9,letterSpacing:.3}}>
    ABRUPT STEERING + HARSH BRAKING — NOT INEVITABLE
   </div>
  </div>
  <div style={{position:'absolute',bottom:'8%',left:'7%',right:'7%',
   color:'#eef4f5',background:'rgba(11,25,32,.69)',padding:'14px 16px',
   fontSize:18,letterSpacing:1,fontFamily:'Arial,sans-serif'}}>
   {crash.contact.occurred?'BARRIER CONTACT / VEHICLE DAMAGE':'FAILED FRONT-RIGHT TYRE / CAR VEERS'}
   <div style={{fontSize:14,opacity:.8,marginTop:6}}>
    ILLUSTRATIVE COUNTERFACTUAL · NOT CRASH TEST DATA
   </div>
  </div>
 </AbsoluteFill>;
};
export const Agent8Compositions:React.FC=()=> <>
 <Composition id="EP003Agent8CrashApproach" component={CrashPreview}
  width={1080} height={1920} fps={30} durationInFrames={120}
  defaultProps={{kind:'approach' as const}}/>
 <Composition id="EP003Agent8ImpactClose" component={CrashPreview}
  width={1080} height={1920} fps={30} durationInFrames={100}
  defaultProps={{kind:'close' as const}}/>
 </>;
