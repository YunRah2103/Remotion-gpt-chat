import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {BeatFxOverlay,Grade} from '../../fx/FXComponents';
import type {GradePreset} from '../../fx/FXComponents';
import {evaluateBeatFx} from '../../fx/beat';
import type {BeatSlot,ChapterPreset} from './presets';
import {evaluatePolish} from './presets';
/**
 * Cinematic FX Toolkit integration, selective and footage-first.
 *
 * Mount ONCE at master frame 0..509 around VIDEO only; overlay the small
 * white Porsche model code outside of this layer. No local-frame Sequence.
 * A's source clip must be cut by B FIRST, then apply micro motion to incoming
 * footage only. No overlap/masks, sampled CameraMotionBlur or unreviewed RGB.
 * Grade is opt-in (default identity); LUT belongs only to final one-pass master.
 */
export const PolishLayer:React.FC<{
 cuts:ReadonlyArray<BeatSlot>;children:React.ReactNode;
 enabled?:boolean;overrides?:Readonly<Record<number,ChapterPreset>>;
 gradePreset?:GradePreset;gradeStrength?:number;
}> = ({cuts,children,enabled=false,overrides,gradePreset='natural',gradeStrength=0})=>{
 const frame=useCurrentFrame();
 const s=evaluatePolish(frame,cuts,overrides);
 const apply=enabled&&s.active;
 const strength=Math.max(0,Math.min(.2,gradeStrength));
 const base=evaluateBeatFx(frame,[{frame:0,style:'cut'}],510,0);
 return <AbsoluteFill style={{overflow:'hidden'}}>
  <Grade preset={gradePreset} strength={strength}>
   <AbsoluteFill style={{transformOrigin:'50% 50%',
    transform:apply?`translateX(${s.translateXPx}px) scale(${Math.max(1,s.scale+Math.abs(s.translateXPx)/540)})`:undefined}}>
    {children}
   </AbsoluteFill>
  </Grade>
  {apply&&s.flashOpacity>0&&<BeatFxOverlay state={{...base,flash:s.flashOpacity}}/>}
 </AbsoluteFill>;
};