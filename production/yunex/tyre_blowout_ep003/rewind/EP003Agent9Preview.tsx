/**
 * Agent 9 REAL moving Agent8 damage rewind.
 * Source: pinned A8 collision states + original deforming A1 wheel,
 * A2 initial/safe physics, A3 tracking cameras, A4 original GT and
 * roadway, A5 real original cabin steering wheel + hands.
 *
 * NO still-image effects: every crash pose, dent, spark and road relation
 * is sampled deterministically at sourceTimeSec, including in REVERSE.
 * These dedicated roots never modify Agent6's 800-frame VO master.
 */
import React,{useEffect,useLayoutEffect,useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import type {VehicleDynamicsFrame,TyreFrame} from '../shared/contract.ts';
import type {CrashOutcomeFrame} from '../impact/model.ts';
import type {CinemaShot} from '../cinema/cameras.ts';
import {sampleCinemaCamera} from '../cinema/cameras.ts';
import {CinematicCameraRig,CinematicVehicle} from '../cinema/scene.tsx';
import {prepareTyreRig,applyTyreFrame,disposeTyreRig} from '../mechanics/tyreRig.ts';
import {sampleTyreFailure} from '../mechanics/sampleTyreFailure.ts';
import {buildEpisodeHighway,EpisodeLight,finishGrandTourer} from '../look/world.tsx';
import {ContactOcclusion} from '../look/contact.tsx';
import {SteadyHands3D} from '../story/SteadyHands3D.tsx';
import {ImpactEffects3D} from '../impact/Preview.tsx';
import {rebaseDynamicsX,resolveBranchFrame} from './branchReplay.ts';
import {DEFAULT_BRANCH_REPLAY} from './branchReplay.ts';
import {sampleControlledFrame} from './agent8Integration.ts';
import {AGENT9_CHOICE_SCENE_X,sampleRealAgent8Wrong,sampleRealAgent2Correct} from './agent8Integration.ts';
import {ChoiceOverlay,RewindVisualTransition} from './RewindVisualTransition.tsx';

const samplers={sampleWrong:sampleRealAgent8Wrong,sampleCorrect:sampleRealAgent2Correct};
const cut=(t:number):CinemaShot=>{
 if(t<12.83)return 'front-three-quarter';
 if(t<13.43)return 'rear-three-quarter';
 if(t<14.44)return 'overhead-dynamics';
 if(t<15.83)return 'overhead-dynamics'; // real backwards car + rail + debris
 if(t<16.015)return 'front-three-quarter';
 if(t<17.35)return 'driver-cockpit';
 if(t<18.15)return 'underbody'; // tyre still failed
 return 'chase-recovery';
};

const OriginalCockpit:React.FC<{d:VehicleDynamicsFrame;tyre:TyreFrame}>=({d,tyre})=>{
 const rig=useMemo(()=>{
   const r=prepareTyreRig(EP003_SCENE.failedWheel,0);
   finishGrandTourer(r.vehicle);
   r.vehicle.traverse(o=>{
     if(o instanceof T.Mesh&&['roof','roof-liner','windshield-seal'].includes(o.name))o.visible=false;
   });
   return r;
 },[]);
 useEffect(()=>()=>disposeTyreRig(rig),[rig]);
 useLayoutEffect(()=>{applyTyreFrame(rig,tyre,{dynamics:d,exposure:0});},[rig,tyre,d]);
 return <primitive object={rig.vehicle}><SteadyHands3D dynamics={d} steeringSide="right"/></primitive>;
};

/** Agent9 collision-ready renderer: deforms A1 ORIGINAL car body based on
 * A8 authoritative BUMPER/FENDER/LAMP damage curves. Never swaps a fake car.
 * A1 retains the original rubber, metal wheel/rim and brake hierarchy. */
type BodyDamage=Readonly<{
 mesh:T.Mesh;
 pos:T.BufferAttribute;
 rest:Float32Array;
 trim:Map<T.Object3D,{p:T.Vector3;s:T.Vector3}>;
}>;
const OriginalDamagedGrandTourer:React.FC<{
 d:VehicleDynamicsFrame;tyre:TyreFrame;impact:CrashOutcomeFrame
}>=({d,tyre,impact})=>{
 const rig=useMemo(()=>{
   const r=prepareTyreRig(EP003_SCENE.failedWheel,0);
   finishGrandTourer(r.vehicle);
   return r;
 },[]);
 const dent=useMemo(():BodyDamage|null=>{
   const body=rig.vehicle.getObjectByName('arched-body');
   if(!(body instanceof T.Mesh)||!(body.geometry instanceof T.BufferGeometry))return null;
   // Private clone per composition: no shared-kit geometry mutation.
   body.geometry=body.geometry.clone();
   const pos=body.geometry.getAttribute('position') as T.BufferAttribute;
   const trim=new Map<T.Object3D,{p:T.Vector3;s:T.Vector3}>();
   rig.vehicle.traverse(o=>{
     if(['lamp-lens','headlamp-housing','lamp-reflector','front-lip'].includes(o.name))
       trim.set(o,{p:o.position.clone(),s:o.scale.clone()});
   });
   return {mesh:body,pos,rest:new Float32Array(pos.array as ArrayLike<number>),trim};
 },[rig]);
 useEffect(()=>()=>disposeTyreRig(rig),[rig]);
 useLayoutEffect(()=>{
   applyTyreFrame(rig,tyre,{dynamics:d,exposure:0});
   if(!dent)return;
   const {rest,pos,mesh,trim}=dent;
   for(let i=0;i<pos.count;i++){
     const j=i*3,ox=rest[j],oy=rest[j+1],oz=rest[j+2];
     const nose=Math.max(0,Math.min(1,(ox-1.42)/1));
     const side=Math.max(0,Math.min(1,(-oz-.30)/.72));
     const blend=nose*nose*side*side;
     pos.setXYZ(i,ox-impact.bumperCrushM*blend,
       oy+impact.fenderCrushM*.18*blend,
       oz+impact.fenderCrushM*.72*blend);
   }
   pos.needsUpdate=true;
   mesh.geometry.computeVertexNormals();
   trim.forEach((original,node)=>{
     node.position.copy(original.p);node.scale.copy(original.s);
     if(original.p.x>1.7&&original.p.z<-.12){
       node.position.x-=impact.lampCrushM*.8;
       node.position.z+=impact.lampCrushM*.35;
       if(node.name==='lamp-lens')
         node.scale.x=original.s.x*(1-impact.lampCrushM*.9);
     }
   });
 },[rig,d,tyre,impact,dent]);
 return <primitive object={rig.vehicle}/>;
};
const NativeAgent9Scene:React.FC<{
 d:VehicleDynamicsFrame;tyre:TyreFrame;
 impact:CrashOutcomeFrame|null;shot:CinemaShot;
 tSec:number;width:number;height:number;
}>=({d,tyre,impact,shot,tSec,width,height})=>{
 const road=useMemo(buildEpisodeHighway,[]);
 useEffect(()=>()=>disposeObject(road),[road]);
 const candidate=sampleCinemaCamera({dynamics:d,tyre,shot,tSec,
   progress01:.45,subtleImpactShake:false});
 // 9:16 overhead: extra real lens height avoids cropping the whole car on
 // a phone and keeps both road line and collision rail readable.
 const pose=shot==='overhead-dynamics'
   ? {...candidate,position:[candidate.position[0],candidate.position[1]+4.5,
       candidate.position[2]] as const,fovDeg:52}
   : candidate;
 return <AbsoluteFill style={{backgroundColor:'#b8cad5'}}>
   <ThreeCanvas width={width} height={height} shadows camera={{
     position:[...pose.position],near:pose.nearM,far:pose.farM,fov:pose.fovDeg}}>
     <EpisodeLight focus={d.positionM}/>
     <primitive object={road}/>
     <ContactOcclusion dynamics={d}/>
     {impact
       ? <OriginalDamagedGrandTourer d={d} tyre={tyre} impact={impact}/>
       : shot==='driver-cockpit'
         ? <OriginalCockpit d={d} tyre={tyre}/>
         : <CinematicVehicle dynamics={d} tyre={tyre} cutaway={false}/>}
     {impact&&<ImpactEffects3D frame={impact}/>}
     <pointLight position={[d.positionM[0]+2.8,4.6,d.positionM[2]-4.1]}
       color="#dce4e8" intensity={21} distance={14} decay={2}/>
     <CinematicCameraRig pose={pose}/>
   </ThreeCanvas>
 </AbsoluteFill>;
};
/** Independent moving source previews; Agent6 handles final visual tempo. */
export const EP003Agent9Preview:React.FC<{kind:'impact-rewind'|'branch-compare'}>=({kind})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const filmTimeSec=12.15+frame/fps;
 const {replay,frame:source}=resolveBranchFrame(filmTimeSec,samplers);
 const seed=sampleControlledFrame(DEFAULT_BRANCH_REPLAY.choiceSourceSec);
 const dx=AGENT9_CHOICE_SCENE_X-seed.positionM[0];
 const d=rebaseDynamicsX(source.dynamics,dx);
 const tyre=sampleTyreFailure(replay.sourceTimeSec,{
   angularPhaseRad:d.wheels['front-right'].spinRad
 });
 return <AbsoluteFill style={{background:'#b8cad5'}}>
  <NativeAgent9Scene d={d} tyre={tyre} impact={source.impact} shot={cut(filmTimeSec)}
    tSec={replay.sourceTimeSec} width={width} height={height}/>
  <RewindVisualTransition replay={replay}/>
  <ChoiceOverlay replay={replay}/>
  {kind==='branch-compare' && <div style={{position:'absolute',
      top:42,left:36,right:36,textAlign:'center',fontSize:22,
      letterSpacing:4,fontWeight:800,fontFamily:'Arial',color:'#e9f3fa',
      textShadow:'0 2px 10px #102334'}}>
      TWO POSSIBLE REACTIONS
  </div>}
 </AbsoluteFill>;
};
export const EP003Agent9ImpactRewind:React.FC=()=> <EP003Agent9Preview kind="impact-rewind"/>;
export const EP003Agent9BranchCompare:React.FC=()=> <EP003Agent9Preview kind="branch-compare"/>;
