import React,{useEffect,useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,Composition,Folder} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {WorldLighting,Environment,CameraAim} from '../../../../src/yunex/world-kit/components.tsx';
import {EP003_SCENE} from '../shared/contract.ts';
import type {TyreFrame,WheelId,VehicleDynamicsFrame} from '../shared/contract.ts';
import type {TyreFailureParams} from './sampleTyreFailure.ts';
import {sampleTyreFailure} from './sampleTyreFailure.ts';
import {sampleDynamics,DYNAMICS_DEFAULTS} from './agent2-dynamics-snapshot.ts';
import {applyTyreFrame,disposeTyreRig,prepareTyreRig} from './tyreRig.ts';
import type {TyreDamageStyle} from './tyreRig.ts';

export type TyreFailureWheelProps={
  tSec:number;
  tyreFrame?:TyreFrame;
  dynamics?:VehicleDynamicsFrame;
  params?:TyreFailureParams;
  wheel?:WheelId;
  exposure?:number;
  damageStyle?:TyreDamageStyle;
  /** Constant preview-world shift; authoritative body and four hub positions remain in sync. */
  sceneOffsetM?:readonly [number,number,number];
};
/**
 * Mechanically original grand-tourer wheel, steering pivot, rotor, alloy and PARTS wishbone.
 * When dynamics is provided, radius, hub, spin and steering ALL come from Agent 2.
 */
export const TyreFailureWheel:React.FC<TyreFailureWheelProps>=({
  tSec,tyreFrame,dynamics,params={},wheel='front-right',exposure=0,
  damageStyle='pressure-only',sceneOffsetM
})=>{
  const rig=useMemo(()=>prepareTyreRig(wheel,exposure),[wheel,exposure]);
  useEffect(()=>()=>disposeTyreRig(rig),[rig]);
  const wheelState=dynamics?.wheels[wheel];
  const phase=wheelState?.spinRad??-EP003_SCENE.illustrativeInitialSpeedMps*tSec/EP003_SCENE.wheelRadiusM;
  const source=tyreFrame??sampleTyreFailure(tSec,{...params,wheel,angularPhaseRad:phase,
    treadSeparation:params.treadSeparation??(damageStyle==='light-scuff'?.18:0)});
  // Agent 2 is the single authority for effective wheel support in any integrated view.
  // No independent visual radius-loss function is added on top of that value.
  const frame:TyreFrame=wheelState
    ?{...source,angularPhaseRad:wheelState.spinRad,effectiveRadiusM:wheelState.rollingRadiusM}
    :source;
  applyTyreFrame(rig,frame,{
    dynamics,fixtureDistanceM:EP003_SCENE.illustrativeInitialSpeedMps*tSec,
    worldOffsetM:sceneOffsetM,exposure
  });
  return <primitive object={rig.vehicle}/>;
};
export const TyreCutaway:React.FC<Omit<TyreFailureWheelProps,'exposure'>&{exposure?:number}>=({
  exposure=.9,...props
})=><TyreFailureWheel {...props} exposure={exposure}/>;

const note:React.CSSProperties={fontFamily:'Arial,Helvetica,sans-serif',color:'#f1f5f4',letterSpacing:1,textShadow:'0 2px 10px #142029'};
const fig=(v:number)=>Math.round(v*100);
type PreviewKind='macro'|'portrait';
/**
 * Both review scenes use EXACTLY Agent 2's deterministic VehicleDynamicsFrame.
 * Snapshot matches agent/ep003-02-dynamics @ 197e02ca...; replace snapshot import
 * with ../dynamics/model.ts as soon as PR #199 is merged into integration base.
 * Hard-cut camera angles, never a physics or road teleport.
 */
export const TyreMechanicsPreview:React.FC<{kind:PreviewKind}>=({kind})=>{
  const f=useCurrentFrame(),{fps,width,height}=useVideoConfig();
  const t=f/fps,macro=kind==='macro',dyn=sampleDynamics(t,DYNAMICS_DEFAULTS);
  // Full physical travel remains within the existing world-kit's finite 220m road.
  const offset:readonly [number,number,number]=[-91,0,0];
  const x=offset[0]+dyn.positionM[0],z=dyn.positionM[2];
  const failed=dyn.wheels['front-right'];
  const frame=sampleTyreFailure(t,{angularPhaseRad:failed.spinRad});
  const cam=macro
    ?{position:[x+4.2,1.17,z-4.45],target:[x+1.46,.33,z-.88],fov:31}
    :t<2.25
      ?{position:[x+9.0,2.55,z-11.8],target:[x+.20,.75,z],fov:42}
      :t<4.65
        ?{position:[x+.75,2.65,z-13.9],target:[x+.10,.71,z],fov:43}
        :{position:[x-8.9,3.45,z-11.7],target:[x-.12,.77,z],fov:42};
  const camera=cam.position as [number,number,number];
  const target=cam.target as [number,number,number];
  return <AbsoluteFill style={{background:'#adccd4'}}>
    <ThreeCanvas width={width} height={height} shadows camera={{position:camera,fov:cam.fov,near:.08,far:325}}>
      <WorldLighting timeOfDay="day" focus={[x,0,z]}/>
      <Environment kind="highway" seed={12} timeOfDay="day"/>
      <CameraAim position={camera} target={target} fov={cam.fov}/>
      {macro
        ?<TyreCutaway tSec={t} dynamics={dyn} sceneOffsetM={offset} exposure={.69}/>
        :<TyreFailureWheel tSec={t} dynamics={dyn} sceneOffsetM={offset}/>}
    </ThreeCanvas>
    <div style={{...note,position:'absolute',top:'7%',left:'7%',right:'7%',fontWeight:700,fontSize:macro?33:32,letterSpacing:.7}}>
      {macro?'THE TYRE LOSES PRESSURE':'TYRE FAILURE AT SPEED'}
      <div style={{fontWeight:400,fontSize:18,marginTop:9,letterSpacing:1.0,opacity:.87}}>
        {macro?'ORIGINAL WHEEL / ROTATING RUBBER / ROAD CONTACT':'ORIGINAL GRAND TOURER / REAL FOUR-WHEEL MOTION MODEL'}
      </div>
    </div>
    <div style={{...note,position:'absolute',bottom:'9%',left:'7%',right:'7%',
      fontSize:19,lineHeight:1.5,letterSpacing:.5,padding:'12px 15px',borderLeft:'4px solid #deb778',
      background:'rgba(12,28,34,.73)'}}>
      RELATIVE PRESSURE {fig(frame.pressureRatio)}%
      <div style={{fontSize:15,opacity:.83}}>AGENT 2 AUTHORITATIVE WHEEL MOTION · ILLUSTRATIVE PHYSICS</div>
    </div>
  </AbsoluteFill>;
};
export const MechanicsPreviewRoot:React.FC=()=> <Folder name="YUNEX-EP003-Agent-1">
  <Composition id="EP003TyreMacro" component={TyreMechanicsPreview}
    width={1080} height={1920} fps={30} durationInFrames={120}
    defaultProps={{kind:'macro' as const}}/>
  <Composition id="EP003TyrePortrait" component={TyreMechanicsPreview}
    width={1080} height={1920} fps={30} durationInFrames={204}
    defaultProps={{kind:'portrait' as const}}/>
</Folder>;
