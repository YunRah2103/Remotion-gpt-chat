import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {CameraMotionBlur,Trail} from '@remotion/motion-blur';
import type {BeatCut,BeatFrame} from './beat';
import {evaluateBeatFx} from './beat';

export type GradePreset='natural'|'archive'|'titanium'|'night'|'warm-vintage';
const look:Record<GradePreset,{brightness:number;contrast:number;saturation:number;hue:number}>={
 natural:{brightness:1,contrast:1,saturation:1,hue:0},
 archive:{brightness:1.02,contrast:1.06,saturation:.84,hue:0},
 titanium:{brightness:1,contrast:1.09,saturation:.92,hue:-2},
 night:{brightness:.95,contrast:1.12,saturation:.89,hue:-3},
 'warm-vintage':{brightness:1.03,contrast:1.04,saturation:.92,hue:3},
};
/** Nondestructive CSS preview grade. For final-quality exports use generated .cube LUT with FFmpeg. */
export const Grade:React.FC<{preset?:GradePreset;strength?:number;children:React.ReactNode}> =
 ({preset='natural',strength=1,children})=>{
  const v=look[preset],s=Math.max(0,Math.min(1,strength));
  const mix=(n:number)=>1+(n-1)*s;
  return <AbsoluteFill style={{filter:`brightness(${mix(v.brightness)}) contrast(${mix(v.contrast)}) saturate(${mix(v.saturation)}) hue-rotate(${v.hue*s}deg)`}}>
    {children}
  </AbsoluteFill>;
};
/** Apply subtle movement only to the NEW shot, never replace cut on next beat. */
export const BeatFxTransform:React.FC<{
   cuts:ReadonlyArray<BeatCut>;duration:number;strength?:number;children:React.ReactNode;
}> = ({cuts,duration,strength=.52,children})=>{
  const frame=useCurrentFrame();
  const p=evaluateBeatFx(frame,cuts,duration,strength);
  const overscan=Math.max(p.zoom,1+Math.abs(p.shiftX)/540+.01);
  return <AbsoluteFill style={{overflow:'hidden'}}>
    <AbsoluteFill style={{transform:`translateX(${p.shiftX}px) rotate(${p.tilt}deg) scale(${Math.max(1.035,p.zoom)})`,
      transformOrigin:'50% 50%'}}>
      {children}
    </AbsoluteFill>
    <BeatFxOverlay state={p}/>
  </AbsoluteFill>;
};
/** Conservative overlays. Never full-frame white for more than an instant. */
export const BeatFxOverlay:React.FC<{state:BeatFrame}>=({state:s})=><AbsoluteFill style={{pointerEvents:'none'}}>
  {s.flash>0&&<AbsoluteFill style={{background:'#f4f8ff',opacity:s.flash}}/>}
  {s.burn>0&&<AbsoluteFill style={{opacity:s.burn,
    background:'linear-gradient(114deg,transparent 15%,#ffb867 43%,#d64326 57%,transparent 85%)',
    mixBlendMode:'screen'}}/>}
  {s.rgbOffset>0&&<AbsoluteFill style={{opacity:Math.min(.22,s.rgbOffset/15),
    background:'linear-gradient(90deg,rgba(243,42,65,.20),transparent 25%,transparent 75%,rgba(23,172,255,.22))',
    transform:`translateX(${s.rgbOffset}px)`,mixBlendMode:'screen'}}/>}
  {s.shutter>0&&<AbsoluteFill style={{opacity:s.shutter,
    background:'repeating-linear-gradient(0deg,rgba(2,4,8,.7) 0px,rgba(2,4,8,.7) 8px,transparent 9px,transparent 26px)'}}/>}
</AbsoluteFill>;

/** Opt-in. Motion blur has render cost and alters opacity/colours; review at source resolution. */
export const MotionBlurShot:React.FC<{
  enabled?:boolean;samples?:number;shutterAngle?:number;children:React.ReactNode;
}> = ({enabled=false,samples=5,shutterAngle=120,children})=>{
  if(!enabled)return <>{children}</>;
  return <CameraMotionBlur samples={Math.max(2,Math.min(8,Math.round(samples)))}
    shutterAngle={Math.max(30,Math.min(180,shutterAngle))}>
      <AbsoluteFill>{children}</AbsoluteFill>
    </CameraMotionBlur>;
};
/** Intentional stylised trailing edges only. Do NOT apply to all source clips by default. */
export const StyledTrail:React.FC<{enabled?:boolean;children:React.ReactNode}> =
 ({enabled=false,children})=>enabled
  ? <Trail layers={3} lagInFrames={.24} trailOpacity={.15}><AbsoluteFill>{children}</AbsoluteFill></Trail>
  : <>{children}</>;
/** Stable minimal grain; no random() or enormous noise layer required. */
export const FilmTexture:React.FC<{grain?:number;vignette?:number}> = ({grain=.045,vignette=.15})=>{
  const frame=useCurrentFrame();
  const jitter=(frame*13)%23;
  return <AbsoluteFill style={{pointerEvents:'none'}}>
    <AbsoluteFill style={{opacity:Math.max(0,Math.min(.15,grain)),mixBlendMode:'screen',
      transform:`translate(${jitter}px,${-jitter}px)`,
      backgroundImage:'repeating-linear-gradient(37deg,rgba(255,255,255,.14) 0px,rgba(255,255,255,.14) 1px,transparent 1px,transparent 7px)',backgroundSize:'113px 79px'}}/>
    <AbsoluteFill style={{opacity:Math.max(0,Math.min(.35,vignette)),
      background:'radial-gradient(ellipse 90% 78% at 50% 50%,transparent 48%,#000 100%)'}}/>
  </AbsoluteFill>;
};
