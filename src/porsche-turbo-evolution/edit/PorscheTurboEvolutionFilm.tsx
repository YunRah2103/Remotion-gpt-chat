import React,{useMemo} from 'react';
import {AbsoluteFill,OffthreadVideo,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {BeatFxTransform} from '../../fx/FXComponents';
import type {CutStyle} from '../../fx/beat';
import {
  BEATS,FPS,WIDTH,HEIGHT,FRAMES,assertBeatMap,framingFor,validateShots,
  type BeatSlot,type PorscheShot,type Generation,type TimelineShot,
} from './timeline';

export type ChapterEffect={generation:Generation;style:CutStyle;strength?:number};
export type PorscheTurboEditProps={
  mode:'diagnostic'|'production';shots?:PorscheShot[];chapterEffects?:ChapterEffect[];
};
/** Abstract colour/motion placeholders are NEVER real Porsche footage. */
const DiagnosticMotion:React.FC<{beat:BeatSlot}>=({beat})=>{
  const f=useCurrentFrame(),h=(beat.slot*53)%360;
  return <AbsoluteFill style={{background:'hsl('+h+',22%,12%)',overflow:'hidden'}}>
    <div style={{position:'absolute',left:-350+f*42+beat.slot*6,top:575,
      width:720,height:750,transform:'skew(-19deg)',
      background:'hsl('+((h+70)%360)+',50%,27%)'}}/>
    <div style={{position:'absolute',left:850-f*32,top:850,width:200,height:150,
      transform:'rotate(-25deg)',background:'#4c5867'}}/>
    <div style={{position:'absolute',left:84,top:560,fontFamily:'Arial,sans-serif',
      fontSize:55,fontWeight:700,color:'#f6e3b6',lineHeight:1.55}}>
      DIAGNOSTIC ONLY
      <div style={{fontSize:37}}>NO VERIFIED PORSCHE FOOTAGE</div>
      <div style={{fontSize:39}}>SLOT {String(beat.slot).padStart(2,'0')} / 30</div>
    </div>
  </AbsoluteFill>;
};
const MovingVideo:React.FC<{shot:PorscheShot}>=({shot})=>{
  const src=staticFile(shot.file),trimBefore=Math.round(shot.sourceInSeconds*FPS);
  const objectPosition=(shot.cropX??50)+'% '+(shot.cropY??50)+'%';
  const framing=framingFor(shot);
  const base={src,trimBefore,muted:true as const};
  if(framing==='fullBleed')return <AbsoluteFill style={{background:'#080a0c',overflow:'hidden'}}>
    <OffthreadVideo {...base} style={{position:'absolute',width:WIDTH,height:HEIGHT,
      objectFit:'cover',objectPosition}}/>
  </AbsoluteFill>;
  const pictureHeight=Math.round(Math.min(HEIGHT*.78,WIDTH*shot.sourceHeight/shot.sourceWidth));
  return <AbsoluteFill style={{background:'#080a0c',overflow:'hidden'}}>
    {/* Dark blurred moving extension uses the very SAME live source, never a still image. */}
    <OffthreadVideo {...base} style={{position:'absolute',width:WIDTH+180,height:HEIGHT+180,
      top:-90,left:-90,objectFit:'cover',objectPosition,
      filter:'blur(65px) brightness(.28) saturate(.72)'}}/>
    <OffthreadVideo {...base} style={{position:'absolute',width:WIDTH,
      height:pictureHeight,top:Math.round((HEIGHT-pictureHeight)/2),left:0,
      objectFit:'contain',objectPosition,
      WebkitMaskImage:'linear-gradient(to bottom,transparent 0%,black 5%,black 95%,transparent 100%)',
      maskImage:'linear-gradient(to bottom,transparent 0%,black 5%,black 95%,transparent 100%)'}}/>
  </AbsoluteFill>;
};
const VisualSlot:React.FC<{
  beat:BeatSlot;shot?:PorscheShot;mode:PorscheTurboEditProps['mode'];effect?:ChapterEffect;
}>=({beat,shot,mode,effect})=>{
  const video=mode==='production'&&shot
    ?<MovingVideo shot={shot}/>:<DiagnosticMotion beat={beat}/>;
  const picture=beat.chapterStart&&effect&&effect.style!=='cut'
    ?<BeatFxTransform cuts={[{frame:0,style:effect.style,chapterStart:true}]}
      duration={beat.durationFrames} strength={Math.min(.4,Math.max(0,effect.strength??.26))}>
      {video}
    </BeatFxTransform>:video;
  return <AbsoluteFill>
    {picture}
    <div style={{position:'absolute',top:145,left:70,color:'#fff',
      fontFamily:'Arial,Helvetica,sans-serif',fontSize:42,fontWeight:500,
      lineHeight:1,letterSpacing:0,background:'none',border:'none',
      textShadow:'none',pointerEvents:'none'}}>{beat.generation}</div>
  </AbsoluteFill>;
};
/** Production mode fails before rendering if a single source is missing/unverified. */
export const PorscheTurboEvolutionFilm:React.FC<PorscheTurboEditProps>=({
  mode,shots=[],chapterEffects=[],
})=>{
  const timeline=useMemo<ReadonlyArray<BeatSlot|TimelineShot>>(()=>{
    assertBeatMap();
    return mode==='production'?validateShots(shots):BEATS;
  },[mode,shots]);
  const effects=useMemo(()=>{
    const m=new Map<Generation,ChapterEffect>();
    for(const fx of chapterEffects){
      if(m.has(fx.generation))throw new Error('Duplicate chapter FX '+fx.generation);
      m.set(fx.generation,fx);
    }
    return m;
  },[chapterEffects]);
  return <AbsoluteFill style={{background:'#07090c'}}>
    {timeline.map(beat=><Sequence key={beat.slot} from={beat.startFrame}
      durationInFrames={beat.durationFrames} layout="none">
      <VisualSlot beat={beat} mode={mode}
        shot={'shot' in beat?beat.shot:undefined}
        effect={beat.chapterStart?effects.get(beat.generation):undefined}/>
    </Sequence>)}
  </AbsoluteFill>;
};
export const PorscheTurboEditComposition={fps:FPS,width:WIDTH,height:HEIGHT,
  durationInFrames:FRAMES} as const;
