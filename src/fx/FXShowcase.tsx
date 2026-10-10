import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame} from 'remotion';
import {TransitionSeries,linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {flip} from '@remotion/transitions/flip';
import {BeatFxTransform,FilmTexture,Grade,MotionBlurShot,StyledTrail} from './FXComponents';
import type {BeatCut,CutStyle,GradePreset} from './FXComponents';
import type {BeatCut as Cut} from './beat';

const colours=[
  ['#141b27','#7b9ab3'],['#1b202a','#9eb5a0'],['#19182a','#c59a6b'],
  ['#101c25','#86b7d7'],['#201b21','#c7a19d']
] as const;
const looks:GradePreset[]=['archive','warm-vintage','titanium','night','natural'];
const moves:CutStyle[]=['whip-left','punch','rgb-edge','flash','film-burn'];
const cuts:Cut[]=[{frame:0,style:'cut'},{frame:17,style:'whip-left'},{frame:35,style:'punch'}];
/** Original abstract technical visual; this demonstrates FX renderability, NOT real Porsche footage. */
const Exhibit:React.FC<{index:number}> = ({index})=>{
  const frame=useCurrentFrame();
  const color=colours[index],progress=interpolate(frame,[0,52],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const dx=progress*160;
  return <Grade preset={looks[index]}>
    <BeatFxTransform cuts={cuts} duration={52} strength={.58}>
      <AbsoluteFill style={{background:`linear-gradient(130deg,${color[0]} 20%,#03070d 88%)`,overflow:'hidden'}}>
        <div style={{position:'absolute',top:390,left:-130,width:1350,height:900,
          border:'1px solid rgba(255,255,255,.07)',borderRadius:180,
          transform:`perspective(1200px) rotateX(10deg) rotateZ(-8deg) translateX(${dx/2}px)`,
          background:`linear-gradient(160deg,rgba(240,246,255,.11),transparent 48%,${color[1]}33)`}}/>
        <MotionBlurShot enabled={index===3} samples={4} shutterAngle={95}>
          <AbsoluteFill>
            <div style={{position:'absolute',width:580,height:580,borderRadius:'50%',
              border:`26px solid ${color[1]}`,boxShadow:`0 0 36px ${color[1]}55`,
              left:195+dx,top:700+Math.sin(progress*Math.PI*3)*25,
              transform:`rotate(${frame*2}deg)`}}>
              {Array.from({length:6},(_,i)=><div key={i} style={{position:'absolute',
                top:'48%',left:'50%',width:238,height:8,background:color[1],
                transformOrigin:'0 0',transform:`rotate(${i*60}deg)`}}/>)}
            </div>
          </AbsoluteFill>
        </MotionBlurShot>
        <StyledTrail enabled={index===4}>
          <AbsoluteFill><div style={{position:'absolute',left:90,top:550,
            transform:`translateX(${progress*220}px)`,
            width:310,height:11,background:color[1],borderRadius:11}}/></AbsoluteFill>
        </StyledTrail>
        <div style={{position:'absolute',top:180,left:80,right:80,color:'#f1f3f6',
          fontFamily:'Arial,Helvetica,sans-serif'}}>
          <div style={{fontSize:27,letterSpacing:7,color:color[1]}}>FX ENGINE / NATIVE PROOF</div>
          <div style={{fontSize:83,fontWeight:900,letterSpacing:-3,marginTop:20}}>FX {String(index+1).padStart(2,'0')}</div>
          <div style={{fontSize:43,marginTop:6}}>{['MOTION CUT','MATCH WIPE','COLOUR STUDY','CAMERA BLUR','FINAL PUNCH'][index]}</div>
        </div>
        <div style={{position:'absolute',bottom:215,left:90,right:60,
          font:'27px Arial, sans-serif',color:'#d0d6df'}}>
          NO THIRD-PARTY FOOTAGE · 30FPS · ORIGINAL EFFECT DEMO
        </div>
        <FilmTexture grain={.036} vignette={.12}/>
      </AbsoluteFill>
    </BeatFxTransform>
  </Grade>;
};
/** 5×52 scene frames minus 4×10 transition overlaps = 220 frames. */
export const FXShowcase:React.FC = ()=> <AbsoluteFill style={{background:'#070b0f'}}>
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={52}><Exhibit index={0}/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction:'from-right'})} timing={linearTiming({durationInFrames:10})}/>
    <TransitionSeries.Sequence durationInFrames={52}><Exhibit index={1}/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={wipe({direction:'from-left'})} timing={linearTiming({durationInFrames:10})}/>
    <TransitionSeries.Sequence durationInFrames={52}><Exhibit index={2}/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:10})}/>
    <TransitionSeries.Sequence durationInFrames={52}><Exhibit index={3}/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={flip()} timing={linearTiming({durationInFrames:10})}/>
    <TransitionSeries.Sequence durationInFrames={52}><Exhibit index={4}/></TransitionSeries.Sequence>
  </TransitionSeries>
</AbsoluteFill>;
