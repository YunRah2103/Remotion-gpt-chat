import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import type {BeatSlot,ChapterPreset} from './presets';
import {evaluatePolish} from './presets';
/**
 * Wrap the video layer ONLY (not the white upper-left model code) and mount
 * OUTSIDE any local-frame Sequence. useCurrentFrame() must be master 0..509.
 * Default disabled: enable only after comparing real source frames.
 * Deliberately avoids crossfades, flip/slide/wipe and sampled motion blur:
 * their overlap on 14–18-frame beats obscures actual new vehicle footage.
 * Uses the shared Remotion 4.0.533 runtime; requires no dependency upgrade.
 */
export const PolishLayer:React.FC<{
 cuts:ReadonlyArray<BeatSlot>;children:React.ReactNode;
 enabled?:boolean;overrides?:Readonly<Record<number,ChapterPreset>>;
}> = ({cuts,children,enabled=false,overrides})=>{
 const frame=useCurrentFrame();
 const s=evaluatePolish(frame,cuts,overrides);
 const apply=enabled&&s.active;
 return <AbsoluteFill style={{overflow:'hidden'}}>
  <AbsoluteFill style={{transformOrigin:'50% 50%',
   transform:apply?`translateX(${s.translateXPx}px) scale(${Math.max(1,s.scale+Math.abs(s.translateXPx)/540)})`:undefined}}>
   {children}
  </AbsoluteFill>
  {apply&&s.flashOpacity>0&&<AbsoluteFill style={{pointerEvents:'none',opacity:s.flashOpacity,
   background:'rgb(243,246,250)'}}/>}
 </AbsoluteFill>;
};