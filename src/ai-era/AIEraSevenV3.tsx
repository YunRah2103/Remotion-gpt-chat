import React from 'react';
import {
  AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile,
  useCurrentFrame,
} from 'remotion';

/**
 * AI ERA V3: only actual Galaxy S25 V4 recordings, no generated/stock filler.
 * Cut points were measured against the user-provided audio waveform.
 * Camera treatment and subtle subtitles are permitted; footage always real.
 * The original AIEraRealFootage composition is preserved for A/B comparison.
 */
export const AI_ERA_SEVEN_V3_FRAMES = 1068;
const FPS = 30;

type Model = 'chatgpt'|'claude'|'gemini'|'deepseek'|'grok'|'kimi'|'qwen';
type Shot = {model:Model; start:number; end:number; sourceTime:number; fit:'subject'|'screen'};
export const AI_ERA_V3_SHOTS: Shot[] = [
 {model:'gemini',start:0,end:1.13,sourceTime:0,fit:'subject'},
 {model:'chatgpt',start:1.13,end:2.69,sourceTime:0.2,fit:'screen'},
 {model:'claude',start:2.69,end:3.68,sourceTime:0.3,fit:'screen'},
 {model:'gemini',start:3.68,end:4.86,sourceTime:2.1,fit:'subject'},
 {model:'grok',start:4.86,end:7.21,sourceTime:0.4,fit:'screen'},
 {model:'deepseek',start:7.21,end:8.15,sourceTime:0.3,fit:'screen'},
 {model:'kimi',start:8.15,end:10.5,sourceTime:0.4,fit:'screen'},
 {model:'qwen',start:10.5,end:11.9,sourceTime:0.4,fit:'subject'},
 {model:'chatgpt',start:11.9,end:13.53,sourceTime:3.2,fit:'screen'},
 {model:'claude',start:13.53,end:15.65,sourceTime:2.7,fit:'screen'},
 {model:'gemini',start:15.65,end:17.51,sourceTime:4.8,fit:'subject'},
 {model:'deepseek',start:17.51,end:18.48,sourceTime:3.4,fit:'screen'},
 {model:'grok',start:18.48,end:19.86,sourceTime:4.0,fit:'screen'},
 {model:'kimi',start:19.86,end:21.03,sourceTime:4.1,fit:'screen'},
 {model:'qwen',start:21.03,end:22.45,sourceTime:4.1,fit:'subject'},
 {model:'chatgpt',start:22.45,end:23.61,sourceTime:6.2,fit:'screen'},
 {model:'claude',start:23.61,end:25.5,sourceTime:5.4,fit:'screen'},
 {model:'gemini',start:25.5,end:26.9,sourceTime:7.2,fit:'subject'},
 {model:'deepseek',start:26.9,end:28.51,sourceTime:5.8,fit:'screen'},
 {model:'grok',start:28.51,end:30.65,sourceTime:6.3,fit:'screen'},
 {model:'chatgpt',start:30.65,end:31.13,sourceTime:9.2,fit:'screen'},
 {model:'claude',start:31.13,end:31.61,sourceTime:9.0,fit:'screen'},
 {model:'gemini',start:31.61,end:32.09,sourceTime:9.1,fit:'subject'},
 {model:'grok',start:32.09,end:32.51,sourceTime:9.3,fit:'screen'},
 {model:'kimi',start:32.51,end:33,sourceTime:9.0,fit:'screen'},
 {model:'deepseek',start:33,end:33.48,sourceTime:9.1,fit:'screen'},
 {model:'qwen',start:33.48,end:34,sourceTime:9.0,fit:'subject'},
 {model:'claude',start:34,end:34.57,sourceTime:11.0,fit:'screen'},
 {model:'chatgpt',start:34.57,end:35.6,sourceTime:10.0,fit:'screen'},
];

const colors: Record<Model,string> = {
 chatgpt:'#D3FFF0', claude:'#F5D4BF', gemini:'#DAE3FF',
 deepseek:'#B9C7FF', grok:'#F5F5F7', kimi:'#DCD0FF', qwen:'#E2CCFF',
};
const labels:Record<Model,string> = {
 chatgpt:'CHATGPT',claude:'CLAUDE',gemini:'GEMINI',deepseek:'DEEPSEEK',
 grok:'GROK',kimi:'KIMI',qwen:'QWEN',
};

// Blurred backdrop is a SECOND VIEW OF THE SAME REAL RECORDING, not synthetic imagery.
// This makes 16:9 software interfaces watchable in a vertical 9:16 composition.
const RealSource: React.FC<{shot:Shot; background?:boolean}> = ({shot,background=false}) => {
 const frame=useCurrentFrame();
 const length=Math.round((shot.end-shot.start)*FPS);
 const drift=interpolate(frame,[0,length],[1,1.035],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <OffthreadVideo
   muted
   src={staticFile('ai-era/'+shot.model+'.mp4')}
   startFrom={Math.round(shot.sourceTime*FPS)}
   style={{
     width:'100%',height:'100%',
     objectFit:background?'cover':(shot.fit==='screen'?'contain':'cover'),
     objectPosition:'50% 50%',
     filter:background?'blur(65px) brightness(0.38) saturate(1.35)':'contrast(1.08) saturate(1.08)',
     transform:'scale('+(background?1.18:drift)+')',
   }}
 />;
};

const Scene: React.FC<{shot:Shot}> = ({shot}) => {
 const frame=useCurrentFrame();
 const frames=Math.round((shot.end-shot.start)*FPS);
 const titleOpacity=interpolate(frame,
  [0,Math.min(5,frames*.25),Math.max(6,frames-5),frames],
  [0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const isIntro=shot.start===0;
 const isEnd=shot.end===35.6;
 return <AbsoluteFill style={{overflow:'hidden',backgroundColor:'#040405'}}>
    {shot.fit==='screen'&&<RealSource shot={shot} background/>}
    <RealSource shot={shot}/>
    <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,rgba(0,0,0,.35) 0%,transparent 27%,transparent 54%,rgba(0,0,0,.85) 100%)'}}/>
    <div style={{
      position:'absolute',left:68,bottom:315,fontFamily:'Arial,Helvetica,sans-serif',
      fontWeight:900,letterSpacing:-2,fontSize:76,lineHeight:1,
      color:colors[shot.model],textShadow:'0 5px 30px rgba(0,0,0,.98)',
      opacity:titleOpacity,
    }}>{labels[shot.model]}</div>
    {isIntro&&<div style={{
      position:'absolute',top:196,left:70,fontSize:64,fontWeight:900,
      color:'#fff',letterSpacing:-2,fontFamily:'Arial,Helvetica,sans-serif',
      textShadow:'0 5px 28px #000',
      opacity:interpolate(frame,[0,5,frames-5,frames],[0,1,1,0],{
        extrapolateLeft:'clamp',extrapolateRight:'clamp'}),
    }}>THE AI ERA</div>}
    {isEnd&&<div style={{
      position:'absolute',top:210,left:70,right:60,
      fontSize:61,fontWeight:900,color:'#fff',letterSpacing:-2,
      lineHeight:1.05,fontFamily:'Arial,Helvetica,sans-serif',
      textShadow:'0 5px 28px #000',opacity:titleOpacity,
    }}>ONLY THE BEGINNING.</div>}
 </AbsoluteFill>;
};

export const AIEraSevenV3:React.FC=()=><AbsoluteFill style={{backgroundColor:'#000'}}>
 {AI_ERA_V3_SHOTS.map((shot,i)=>{
  const from=Math.round(shot.start*FPS);
  const until=Math.round(shot.end*FPS);
  return <Sequence key={i} from={from} durationInFrames={until-from}><Scene shot={shot}/></Sequence>;
 })}
 <Audio src={staticFile('ai-era/audio.mp3')} volume={0.77}/>
</AbsoluteFill>;
