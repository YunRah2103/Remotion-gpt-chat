import React,{useEffect,useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,Composition,Folder} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {WorldLighting,Environment,CameraAim} from '../../../../src/yunex/world-kit/components.tsx';
import {EP003_SCENE} from '../shared/contract.ts';
import type {TyreFrame,WheelId,VehicleDynamicsFrame} from '../shared/contract.ts';
import type {TyreFailureParams} from './sampleTyreFailure.ts';
import {sampleTyreFailure} from './sampleTyreFailure.ts';
import {applyTyreFrame,disposeTyreRig,prepareTyreRig} from './tyreRig.ts';

export type TyreFailureWheelProps={
  tSec:number;
  tyreFrame?:TyreFrame;
  dynamics?:VehicleDynamicsFrame;
  params?:TyreFailureParams;
  wheel?:WheelId;
  exposure?:number;
  damageStyle?:'pressure-only'|'light-scuff';
};
/** Reuses the real grand-tourer, original rim, brake, steering pivot, wheel roll. */
export const TyreFailureWheel:React.FC<TyreFailureWheelProps>=({
  tSec,tyreFrame,dynamics,params={},wheel='front-right',exposure=0,
  damageStyle='pressure-only'
})=>{
  const rig=useMemo(()=>prepareTyreRig(wheel,exposure),[wheel,exposure]);
  useEffect(()=>()=>disposeTyreRig(rig),[rig]);
  const phase=dynamics?.wheels[wheel].spinRad??-EP003_SCENE.illustrativeInitialSpeedMps*tSec/EP003_SCENE.wheelRadiusM;
  const frame=tyreFrame??sampleTyreFailure(tSec,{...params,wheel,angularPhaseRad:phase,
    treadSeparation:params.treadSeparation??(damageStyle==='light-scuff'?.35:0)});
  applyTyreFrame(rig,frame,{
    dynamics,fixtureDistanceM:EP003_SCENE.illustrativeInitialSpeedMps*tSec,
    exposure
  });
  return <primitive object={rig.vehicle}/>;
};
/** Exposed car-side suspension model is PARTS-kit 'double-wishbone', not new CAD. */
export const TyreCutaway:React.FC<Omit<TyreFailureWheelProps,'exposure'>&{exposure?:number}>=({
  exposure=.9,...props
})=><TyreFailureWheel {...props} exposure={exposure}/>;

const note:React.CSSProperties={fontFamily:'Arial,Helvetica,sans-serif',color:'#f1f5f4',letterSpacing:1.4,textShadow:'0 2px 12px #142029'};
const fig=(v:number)=>Math.round(v*100);
type PreviewKind='macro'|'portrait';
export const TyreMechanicsPreview:React.FC<{kind:PreviewKind}>=({kind})=>{
  const f=useCurrentFrame(),{fps,width,height}=useVideoConfig();
  const t=f/fps,macro=kind==='macro',distance=EP003_SCENE.illustrativeInitialSpeedMps*t;
  const x=(macro?-35:-90)+distance,z=-1.85;
  const wheelX=x+1.46, wheelZ=z-.88;
  const frame=sampleTyreFailure(t,{angularPhaseRad:-distance/.36});
  const close=macro ? [.28,.96,-2.2] as const : [3.4,2.04,-5.1] as const;
  const camera:[number,number,number]=[x+close[0],close[1],z+close[2]];
  const target:[number,number,number]=macro?[wheelX,.37,wheelZ]:[x+.42,.75,z];
  return <AbsoluteFill style={{background:'#adccd4'}}>
    <ThreeCanvas width={width} height={height} shadows camera={{position:camera,fov:macro?27:39,near:.08,far:290}}>
      <WorldLighting timeOfDay="day" focus={[x,0,z]}/>
      <Environment kind="highway" seed={12} timeOfDay="day"/>
      <CameraAim position={camera} target={target} fov={macro?27:39}/>
      <group position={[x,0,z]}>
        {macro
          ?<TyreCutaway tSec={t} tyreFrame={frame} exposure={.64}/>
          :<TyreFailureWheel tSec={t} tyreFrame={frame}/>}
      </group>
    </ThreeCanvas>
    <div style={{...note,position:'absolute',top:'7%',left:'7%',right:'7%',fontWeight:700,fontSize:macro?38:37,letterSpacing:.7}}>
      {macro?'RAPID PRESSURE LOSS':'FRONT-RIGHT TYRE FAILURE'}
      <div style={{fontWeight:400,fontSize:20,marginTop:9,letterSpacing:1.1,opacity:.83}}>
        {macro?'MECHANICAL CUTAWAY / CONTACT PATCH':'MOVING THREE-QUARTER / ORIGINAL GRAND TOURER'}
      </div>
    </div>
    <div style={{...note,position:'absolute',bottom:'10%',left:'7%',right:'7%',
      fontSize:21,lineHeight:1.5,letterSpacing:.5,padding:'13px 18px',borderLeft:'4px solid #deb778',
      background:'rgba(12,28,34,.72)'}}>
      RELATIVE TYRE PRESSURE  {fig(frame.pressureRatio)}%
      <div style={{fontSize:16,opacity:.78}}>ILLUSTRATIVE / PREVIEW MOTION FIXTURE — NOT AGENT 2 PHYSICS</div>
    </div>
  </AbsoluteFill>;
};

/** Standalone entry: no changes to Agent 6's reserved integration root. */
export const MechanicsPreviewRoot:React.FC=()=> <Folder name="YUNEX-EP003-Agent-1">
  <Composition id="EP003TyreMacro" component={TyreMechanicsPreview}
    width={1080} height={1920} fps={30} durationInFrames={120}
    defaultProps={{kind:'macro' as const}}/>
  <Composition id="EP003TyrePortrait" component={TyreMechanicsPreview}
    width={1080} height={1920} fps={30} durationInFrames={204}
    defaultProps={{kind:'portrait' as const}}/>
</Folder>;
