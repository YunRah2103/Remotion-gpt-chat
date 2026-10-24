/**
 * YUNEX EP006 Agent 8 — native silent integrated visual review.
 * SOURCE: A1 vehicle + A2 motion/contact FX + A3 cameras + A4 stage/heightAt.
 * 810f silent visual base. Narration and SFX are mixed from the user-provided audio externally.
 * Agent 5 reveal deliberately excluded until its separate native proof passes.
 */
import React,{useEffect,useMemo} from 'react';
import * as T from 'three';
import {Composition,registerRoot,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CinematicLighting} from '../../modelling-kit/Lighting';
import {CameraAim} from '../../world-kit/components';
import {disposeObject} from '../../world-kit/geometry';
import {createEp006Stage,heightAt} from '../../ep006/environment/stage';
import {createEp006RallyVehicle,applyEp006RallyPose} from '../../ep006/vehicle/index';
import {sampleEp006Motion} from '../../ep006/dynamics/motion';
import {sampleEp006Effects} from '../../ep006/fx/contact-effects';
import {sampleEp006Camera} from '../../ep006/cameras/shot-motion';
/** Long visual assembly uses the existing shared physics, without a competing simulation. */
const FULL_FRAMES=810;
function fullFrameAt(f:number){
  if(f<192)return {source:f,camera:f};
  if(f<375)return {source:72+Math.floor((f-192)/3.3),camera:f};
  if(f<555)return {source:72+Math.floor((f-375)/3.25),camera:f};
  if(f<630)return {source:98+Math.floor((f-555)/1.55),camera:f};
  return {source:f,camera:f};
}

type Instances={group:T.Group;dust:T.InstancedMesh;gravel:T.InstancedMesh};
function createParticles():Instances{
  const group=new T.Group();group.name='ep006-integrated-contact-fx';
  const dust=new T.InstancedMesh(new T.SphereGeometry(1,8,5),
    new T.MeshStandardMaterial({color:'#cbb39b',transparent:true,opacity:.22,roughness:1,depthWrite:false}),220);
  dust.name='grounded-touchdown-dust';dust.frustumCulled=false;
  const gravel=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),
    new T.MeshStandardMaterial({color:'#54473a',roughness:1}),260);
  gravel.name='grounded-gravel';gravel.frustumCulled=false;
  group.add(dust,gravel);return {group,dust,gravel};
}
function updateParticles(objects:Instances,frame:number){
  const fx=sampleEp006Effects(frame),o=new T.Object3D();
  for(let i=0;i<objects.dust.count;i++){
    const p=fx.dust[i];
    if(p){
      o.position.fromArray(p.positionM);o.rotation.set(0,p.rotationY,0);
      const a=Math.sqrt(Math.max(0,p.opacity)/.26);
      o.scale.set(p.radiusM*p.stretchX*a,p.radiusM*.42*a,p.radiusM*a);
    }else{o.position.set(0,-999,0);o.rotation.set(0,0,0);o.scale.setScalar(.00001);}
    o.updateMatrix();objects.dust.setMatrixAt(i,o.matrix);
  }
  objects.dust.instanceMatrix.needsUpdate=true;
  for(let i=0;i<objects.gravel.count;i++){
    const p=fx.gravel[i];
    if(p){
      o.position.fromArray(p.positionM);o.rotation.set(...p.rotationRad);
      o.scale.setScalar(p.radiusM);
    }else{o.position.set(0,-999,0);o.rotation.set(0,0,0);o.scale.setScalar(.00001);}
    o.updateMatrix();objects.gravel.setMatrixAt(i,o.matrix);
  }
  objects.gravel.instanceMatrix.needsUpdate=true;
}
const VisualPass:React.FC=()=>{
  const local=useCurrentFrame(),{width,height}=useVideoConfig();
  const {source,camera}=fullFrameAt(local);
  const pose=sampleEp006Motion(source);
  const stage=useMemo(()=>createEp006Stage({seed:290,sceneryDensity:.72}),[]);
  const vehicle=useMemo(()=>createEp006RallyVehicle(),[]);
  const particles=useMemo(createParticles,[]);
  useEffect(()=>()=>{disposeObject(vehicle);disposeObject(stage);disposeObject(particles.group);},[vehicle,stage,particles]);
  // All deformation, chassis position, wheel roll and damping use one absolute physics sample.
  applyEp006RallyPose(vehicle,pose);
  updateParticles(particles,source);
  // The special underbody sequence replays J1 frames 72–88, slowed 4x.
  // Only shot selection uses a different frame; it does NOT create different motion.
  const view=sampleEp006Camera(camera,{...pose,frame:camera},{
    aspect:width/height,terrainHeightM:heightAt,
    vehicleBoundsM:{length:4.25,width:1.94,height:1.52}
  });
  // Cinematic mechanics are chronological slowed replays of genuine J1 samples.
  // Fixes the old terrain-obscured underbody views while matching VO beat windows.
  let safeView=view;
  if(local>=192&&local<630){
    const u=(local%80)/80;
    let off:[number,number,number];let target:[number,number,number];let fov=43;
    if(local<277){
      off=[2.65-u*.8,1.65,-4.6-u*.45]; target=[1.31,.40,-.60];fov=42;
    }else if(local<375){
      off=[1.9-u*.9,1.67,4.6];target=[1.31,.49,.75];fov=42;
    }else if(local<455){
      off=[2.25-u,1.75,-4.2];target=[1.31,.65,-.57];fov=44;
    }else if(local<555){
      off=[-2.3+u*.7,1.62,4.4];target=[-1.31,.58,.65];fov=44;
    }else{
      off=[.15+u*.9,1.60,-4.65];target=[0,.43,0];fov=41;
    }
    const px=pose.positionM[0]+off[0],pz=pose.positionM[2]+off[2];
    const py=Math.max(heightAt(px,pz)+1.62,pose.positionM[1]+off[1]);
    safeView={...view,position:[px,py,pz],
      target:[pose.positionM[0]+target[0],pose.positionM[1]+target[1],pose.positionM[2]+target[2]],fov};
  }
  return <ThreeCanvas width={width} height={height} shadows
    camera={{fov:safeView.fov,near:safeView.near,far:1800}} gl={{antialias:true}}>
    <color attach="background" args={['#a9c3ce']}/>
    <fog attach="fog" args={['#a8bab9',130,390]}/>
    <CinematicLighting focus={pose.positionM} timeOfDay="day"/>
    <primitive object={stage}/>
    <primitive object={vehicle}/>
    <primitive object={particles.group}/>
    <CameraAim position={safeView.position} target={safeView.target} fov={safeView.fov}/>
  </ThreeCanvas>;
};
const Root:React.FC=()=> <Composition id="Ep006FullVisualNarrationBase"
  component={VisualPass} width={1080} height={1920} fps={30}
  durationInFrames={FULL_FRAMES}/>;
registerRoot(Root);
