/**
 * Polish04 in-film physical pad clamp explanation.
 * Labels and measured clearance are E-only. All actual transforms come from
 * A hardware fed by B pressure through E adapter; no extra fake animation.
 */
import React, {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {integrationStateAt} from './integrationState';

export const isInFilmPadProof=(frame:number)=>frame>=100&&frame<=147;

/** Expose both true mechanical pad meshes by temporarily hiding the fixed
 * caliper (the underlying caliper never moves and A's model is unchanged). */
export const InFilmPadCutaway:React.FC<{frame:number;active?:boolean}>=({frame,active=true})=>{
  const {scene,invalidate}=useThree();
  useLayoutEffect(()=>{
    const caliper=scene.getObjectByName('CaliperBody');
    const upright=scene.getObjectByName('UprightSupport');
    const visible=!active||frame<107;
    if(caliper)caliper.visible=visible;
    if(upright)upright.visible=visible;
    invalidate();
    return ()=>{if(caliper)caliper.visible=true;if(upright)upright.visible=true;};
  },[frame,active,scene,invalidate]);
  return null;
};

export const InFilmPadLabels:React.FC<{frame:number;opacity?:number}>=({frame,opacity=1})=>{
  if(opacity<=0)return null;
  const state=integrationStateAt(frame);
  const travelMm=(.0025-state.padGapMetres)*1000;
  const gapMm=state.padGapMetres*1000;
  return <div style={{pointerEvents:'none',position:'absolute',zIndex:33,
    left:86,right:200,bottom:428,opacity,fontFamily:'Arial,sans-serif',color:'#edf4f6'}}>
    <div style={{height:1,background:'rgba(183,215,231,.55)',marginBottom:17}}/>
    <div style={{fontSize:27,fontWeight:700,letterSpacing:1,
      textShadow:'0 2px 8px #000'}}>OPPOSING PAD CLAMP</div>
    <div style={{fontSize:23,color:'#a8c9d8',letterSpacing:1,marginTop:9}}>INNER PAD  ·  ROTOR  ·  OUTER PAD</div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',
      marginTop:14}}>
      <span style={{fontSize:22,color:'#bfd1da'}}>EACH PAD MOVES</span>
      <span style={{fontSize:39,fontWeight:700}}>{travelMm.toFixed(2)} mm</span>
    </div>
    <div style={{height:5,background:'#283843',marginTop:8}}>
      <div style={{height:5,width:Math.min(100,travelMm/2.35*100)+'%',
        background:'#a5d4df'}}/>
    </div>
    <div style={{fontSize:20,color:'#a7c3d1',marginTop:14}}>
      Per-face clearance {gapMm.toFixed(2)} mm · physical scale
    </div>
    <div style={{fontSize:21,color:'#a8c9d8',marginTop:10}}>
      {frame<107?'FIXED CALIPER':'CALIPER HIDDEN TO REVEAL BOTH PADS'}
    </div>
  </div>;
};
