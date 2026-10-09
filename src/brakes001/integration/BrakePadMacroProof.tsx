/**
 * E-only 61-frame 1080x1920 native pad-motion QA composition.
 * Uses exactly the same original A hardware and B physics as the film.
 * Proof timeline 0..60 samples actual film frames 85..145, which includes
 * first pressure onset at 94.5 (rather than falsely animating 135..195).
 * All geometry stays 1:1 in metres; text gives real per-face clearances.
 */
import React, {useLayoutEffect} from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {BrakeAssembly} from '../hardware/BrakeAssembly';
import {integrationStateAt} from './integrationState';

export const MACRO_OFFSET=85;
export const macroFilmFrameAt=(localFrame:number)=>MACRO_OFFSET+localFrame;
const MacroCamera:React.FC=()=>{
  const {camera,invalidate}=useThree();
  useLayoutEffect(()=>{
    camera.position.set(.047,.255,.45);
    camera.lookAt(0,.145,.139);
    if(camera instanceof THREE.PerspectiveCamera){
      camera.fov=29;camera.near=.012;camera.far=10;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    invalidate();
  },[camera,invalidate]);
  return null;
};
export const BrakePadMacroProof:React.FC=()=>{
  const frame=useCurrentFrame();
  const actualFrame=macroFilmFrameAt(frame);
  const s=integrationStateAt(actualFrame);
  const closedMm=(.0025-s.padGapMetres)*1000;
  const gapMm=s.padGapMetres*1000;
  const percent=Math.min(100,Math.max(0,closedMm/2.35*100));
  return <AbsoluteFill style={{backgroundColor:'#08111a',fontFamily:'Arial,sans-serif',color:'#dce8ee'}}>
    <ThreeCanvas width={1080} height={1920} camera={{position:[.047,.255,.45],fov:29,near:.012,far:10}}
      gl={{antialias:true,preserveDrawingBuffer:true}} shadows>
      <MacroCamera/>
      <ambientLight intensity={.75} color="#91b6cf"/>
      <directionalLight position={[.15,.48,.58]} intensity={2.3} color="#d5e7f6"/>
      <pointLight position={[-.19,.27,.25]} intensity={1.2} distance={1} color="#efc4a8"/>
      <BrakeAssembly rotorAngleRad={s.rotorAngleRad} padGapMetres={s.padGapMetres}
        heat01={s.heat01} showUpright={false}/>
    </ThreeCanvas>
    <AbsoluteFill style={{pointerEvents:'none',
      background:'linear-gradient(180deg,rgba(3,7,11,.86),transparent 32%,transparent 61%,rgba(2,5,9,.90) 84%)'}}/>
    <div style={{position:'absolute',left:78,top:230,right:110}}>
      <div style={{letterSpacing:4,fontSize:25,color:'#94b9c8'}}>MECHANICAL PROOF · ACTUAL SCALE</div>
      <div style={{fontSize:61,fontWeight:700,lineHeight:1.06,marginTop:24}}>TWO PADS.
        <div>ONE ROTATING DISC.</div>
      </div>
      <div style={{fontSize:26,marginTop:24,color:'#acc1cc'}}>Side-angle native 3D · caliper fixed</div>
    </div>
    <div style={{position:'absolute',left:78,right:80,bottom:325,
      borderTop:'1px solid #637e89',paddingTop:30}}>
      <div style={{fontSize:26,letterSpacing:2,color:'#c3d8e2'}}>EQUAL OPPOSING PAD TRAVEL</div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:24}}>
        <span style={{fontSize:43,fontWeight:700}}>{closedMm.toFixed(2)} mm</span>
        <span style={{fontSize:26,color:'#afc5d1',paddingTop:14}}>of 2.35 mm max</span>
      </div>
      <div style={{height:8,background:'#253b49',borderRadius:10,marginTop:20,overflow:'hidden'}}>
        <div style={{width:percent+'%',height:'100%',background:'#91d0db'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:24,
        marginTop:18,color:'#a2b8c3'}}>
        <span>PER-FACE GAP</span><span>{gapMm.toFixed(2)} mm</span>
      </div>
      <div style={{fontSize:20,color:'#7e9dab',marginTop:32}}>
        Illustrative engineering model · no exaggerated pad displacement
      </div>
    </div>
  </AbsoluteFill>;
};
