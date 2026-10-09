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
export const InFilmPadCutaway:React.FC<{frame:number}>=({frame})=>{
  const {scene,invalidate}=useThree();
  useLayoutEffect(()=>{
    const caliper=scene.getObjectByName('CaliperBody');
    const upright=scene.getObjectByName('UprightSupport');
    const visible=!isInFilmPadProof(frame)||frame<107;
    if(caliper)caliper.visible=visible;
    if(upright)upright.visible=visible;
    invalidate();
    return ()=>{if(caliper)caliper.visible=true;if(upright)upright.visible=true;};
  },[frame,scene,invalidate]);
  return null;
};

export const InFilmPadLabels:React.FC<{frame:number}>=({frame})=>{
  if(!isInFilmPadProof(frame))return null;
  const state=integrationStateAt(frame);
  const travelMm=(.0025-state.padGapMetres)*1000;
  const gapMm=state.padGapMetres*1000;
  return <div style={{pointerEvents:'none',position:'absolute',zIndex:33,
    left:80,width:420,top:990,fontFamily:'Arial,sans-serif',color:'#edf4f6'}}>
    <div style={{height:1,background:'rgba(183,215,231,.55)',marginBottom:22}}/>
    <div style={{fontSize:26,fontWeight:700,letterSpacing:2,
      textShadow:'0 2px 8px #000'}}>BOTH PADS APPROACH THE DISC</div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',
      marginTop:12}}>
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
    <div style={{fontSize:18,color:'#87a4b3',marginTop:9}}>
      {frame<107?'FIXED CALIPER':'CALIPER HIDDEN TO REVEAL BOTH PADS'}
    </div>
  </div>;
};
