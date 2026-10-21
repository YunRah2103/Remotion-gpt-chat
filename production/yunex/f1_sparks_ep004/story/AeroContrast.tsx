import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {VehicleMotionState} from '../shared/contract';
import {clamp01,smoothstep,compareRideHeight} from './beats';
import {validateAeroPair} from './visual-cues';
export type AeroContrastProps=Readonly<{
 unloaded:VehicleMotionState;
 loaded:VehicleMotionState;
 progress01:number;
 renderState:(motion:VehicleMotionState)=>React.ReactNode;
}>;
/** TWO external physics states for identical time/route/camera. Crossfade vehicle heave
 * and actual wheel/body compression; do not hallucinate aerodynamic Newton values.
 * No arrow, duplicated car path, HUD or independent motion solver. */
export const AeroContrast:React.FC<AeroContrastProps>=({unloaded,loaded,progress01,renderState})=>{
 validateAeroPair(unloaded,loaded);
 const t=smoothstep(clamp01(progress01));
 const comparison=compareRideHeight(unloaded,loaded);
 if(!comparison.safeToLabelLower&&!comparison.compressionIncreased){
  // Wrong/imperceptible comparison: preserve real motion, don't claim a visual drop.
  return <AbsoluteFill>{renderState(loaded)}</AbsoluteFill>;
 }
 return <AbsoluteFill>
   <AbsoluteFill style={{opacity:1-t}}>{renderState(unloaded)}</AbsoluteFill>
   <AbsoluteFill style={{opacity:t}}>{renderState(loaded)}</AbsoluteFill>
 </AbsoluteFill>;
};
