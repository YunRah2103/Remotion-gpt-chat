/** Agent 6 EP005 — silent true-moving footage using exact owner-approved V4 rig. */
import React,{useEffect,useMemo} from 'react';
import {AbsoluteFill,Composition,registerRoot,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {CameraAim} from '../../world-kit/components.tsx';
import {disposeObject} from '../../world-kit/geometry.ts';
import {CinematicLighting} from '../../modelling-kit/Lighting.tsx';
import {createApprovedV4,poseApprovedV4,v4Camera,V4_DRIVING_FRAMES} from './v4-approved.ts';
import type {V4Shot} from './v4-approved.ts';

/** Actual fixed world: long asphalt, kerbs, concrete barrier, pits and parallax. */
export function makeV4Track():THREE.Group {
 const scene=new THREE.Group();scene.name='ep005-v4-cinematic-track';
 const mat=(color:string,metalness:number,roughness:number)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const asphalt=mat('#262c32',.12,.33);
 const painted=mat('#a5b1b7',.07,.56);
 const muted=mat('#48545d',.04,.83);
 const concrete=mat('#767e86',.04,.79);
 const ground=mat('#313b40',.03,.95);
 const kerbA=mat('#dee5e6',.05,.53);
 const kerbB=mat('#c54b45',.06,.56);
 const glass=mat('#304755',.40,.29);
 const addBox=(name:string,size:[number,number,number],xyz:[number,number,number],material:THREE.Material)=>{
   const o=new THREE.Mesh(new THREE.BoxGeometry(...size),material);
   o.name=name;o.position.set(...xyz);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;
 };
 addBox('distant-terrain',[1400,.16,330],[390,-.19,0],ground);
 // Tyres rest at vehicle-world y=0. Road top is exactly 0: no visible hover gap.
 addBox('wet-asphalt', [1400,.065,15.4],[390,-.0325,0],asphalt);
 for(const s of [-1,1]){
   addBox('white-edge-line',[1400,.008,.16],[390,.005,s*7.12],painted);
   addBox('asphalt-runoff',[1400,.04,7],[390,-.070,s*11.3],muted);
   for(let x=-140;x<240;x+=8){
     addBox('painted-kerb-'+s,[7.75,.036,.47],[x,.012,s*7.75],Math.floor(x/8)%2===0?kerbA:kerbB);
   }
   for(let x=-150;x<310;x+=12){
     addBox('outer-concrete-safety-wall',[11.8,.72,.26],[x,.34,s*16.8],concrete);
     addBox('wall-shadow-cap',[11.8,.064,.43],[x,.73,s*16.8],muted);
   }
   for(let x=-120;x<300;x+=42){
     // All posts beyond track barriers, never allowed across the vehicle.
     addBox('distant-light-tower',[.25,6.2,.25],[x,3.1,s*33],muted);
     const panel=addBox('light-casing',[1.7,.43,.33],[x,6.25,s*33],painted);
     panel.rotation.z=s*.08;
   }
 }
 for(let x=-100;x<270;x+=25){
   addBox('pit-building',[18,6,10],[x,3,-47],concrete);
   addBox('pit-glazing',[16,2.4,.09],[x,4.2,-41.96],glass);
   addBox('pit-roof',[19,.3,11],[x,6.15,-47],muted);
 }
 for(let x=-150;x<320;x+=18){
   addBox('distance-marker',[.22,.022,1.1],[x,.004,0],painted);
 }
 scene.userData={route:'actual world-space X translation',approvedCarSource:'9052a539e10a7cb97487c1435455bb9962ad58e1',
    foregroundObstructions:'outside safety walls only'};
 return scene;
}

export const ApprovedV4Driving:React.FC<{shot:V4Shot}>=({shot})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const car=useMemo(createApprovedV4,[]);
 const track=useMemo(makeV4Track,[]);
 useEffect(()=>()=>{disposeObject(car);disposeObject(track);},[car,track]);
 const pose=poseApprovedV4(car,frame,fps);
 const camera=v4Camera(shot,frame,fps);
 return <AbsoluteFill style={{background:'#36414a'}}>
 <ThreeCanvas width={width} height={height} shadows camera={{fov:camera.fov,near:.025,far:550}} gl={{antialias:true}}>
 <CinematicLighting focus={[pose.x,0,0]} timeOfDay="dusk"/>
 <hemisphereLight args={['#d9ecff','#4c5360',1.05]}/>
 <directionalLight position={[8,13,-7]} intensity={1.65} color="#e8f3ff"/>
 <directionalLight position={[-3,8,9]} intensity={1.3} color="#ffd7b1"/>
 <spotLight position={[pose.x+2,9,-7]} angle={.85} distance={25} intensity={28} penumbra={1} color="#d1ebff"/>
 <primitive object={track}/>
 <primitive object={car}/>
 <CameraAim {...camera}/>
 </ThreeCanvas>
 </AbsoluteFill>;
};
const Root=()=> <React.Fragment>
 <Composition id="Ep005Agent6V4RearProof" component={ApprovedV4Driving} defaultProps={{shot:'rear-proof'}} width={1080} height={1920} fps={30} durationInFrames={V4_DRIVING_FRAMES}/>
 <Composition id="Ep005Agent6V4SideTracking" component={ApprovedV4Driving} defaultProps={{shot:'side-tracking'}} width={1080} height={1920} fps={30} durationInFrames={V4_DRIVING_FRAMES}/>
 <Composition id="Ep005Agent6V4FrontPursuit" component={ApprovedV4Driving} defaultProps={{shot:'front-pursuit'}} width={1080} height={1920} fps={30} durationInFrames={V4_DRIVING_FRAMES}/>
 <Composition id="Ep005Agent6V4RearChase" component={ApprovedV4Driving} defaultProps={{shot:'rear-chase'}} width={1080} height={1920} fps={30} durationInFrames={V4_DRIVING_FRAMES}/>
 </React.Fragment>;
registerRoot(Root);
