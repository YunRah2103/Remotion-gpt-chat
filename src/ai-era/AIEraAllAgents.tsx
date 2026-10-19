import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

// Only genuine recorded YouTube source footage imported by Samsung S25 V4.
// Graphics: small typographic identifiers and subtle grade only; no generated shots.
export const EXPANDED_FRAMES = 1068;
const FPS = 30;
type Name = 'atlas'|'chatgpt'|'claude'|'gemini'|'deepseek'|'grok'|'kimi'|'qwen'|'perplexity'|'mistral'|'copilot'|'meta'|'sora';
type Shot = {model:Name; start:number; end:number; inAt:number};
const shots:Shot[] = [
  {model:'atlas',start:0,end:2.64,inAt:0.0},
  {model:'chatgpt',start:2.64,end:3.54,inAt:0.3},
  {model:'claude',start:3.54,end:5.04,inAt:0.3},
  {model:'gemini',start:5.04,end:7.16,inAt:1.3},
  {model:'deepseek',start:7.16,end:8.10,inAt:1.0},
  {model:'grok',start:8.10,end:9.64,inAt:1.4},
  {model:'kimi',start:9.64,end:11.84,inAt:1.8},
  {model:'qwen',start:11.84,end:12.32,inAt:3.1},
  {model:'perplexity',start:12.32,end:14.20,inAt:3.2},
  {model:'mistral',start:14.20,end:16.08,inAt:1.1},
  {model:'copilot',start:16.08,end:17.26,inAt:5.0},
  {model:'meta',start:17.26,end:17.94,inAt:4.5},
  {model:'sora',start:17.94,end:20.98,inAt:0.0},
  {model:'atlas',start:20.98,end:23.10,inAt:7.0},
  {model:'chatgpt',start:23.10,end:24.74,inAt:6.2},
  {model:'claude',start:24.74,end:25.44,inAt:7.0},
  {model:'gemini',start:25.44,end:26.00,inAt:10.0},
  {model:'deepseek',start:26.00,end:27.32,inAt:8.0},
  {model:'grok',start:27.32,end:28.52,inAt:9.0},
  {model:'kimi',start:28.52,end:29.66,inAt:9.0},
  {model:'sora',start:29.66,end:30.60,inAt:8.0},
  {model:'atlas',start:30.60,end:31.08,inAt:11.0},
  {model:'chatgpt',start:31.08,end:31.65,inAt:11.0},
  {model:'claude',start:31.65,end:32.15,inAt:11.0},
  {model:'gemini',start:32.15,end:32.65,inAt:12.0},
  {model:'deepseek',start:32.65,end:33.14,inAt:12.0},
  {model:'grok',start:33.14,end:33.65,inAt:12.0},
  {model:'kimi',start:33.65,end:34.18,inAt:12.0},
  {model:'sora',start:34.18,end:34.70,inAt:12.0},
  {model:'atlas',start:34.70,end:35.60,inAt:13.0},
];

const identities: Record<Name, {label:string,accent:string,layout:'screen'|'cinematic'}> = {
  atlas:{label:'ATLAS',accent:'#f4f4f5',layout:'cinematic'},
  chatgpt:{label:'CHATGPT',accent:'#baffde',layout:'screen'},
  claude:{label:'CLAUDE',accent:'#f5d5b7',layout:'screen'},
  gemini:{label:'GEMINI',accent:'#c2d4ff',layout:'cinematic'},
  deepseek:{label:'DEEPSEEK',accent:'#a8b9ff',layout:'screen'},
  grok:{label:'GROK',accent:'#f6f6f7',layout:'screen'},
  kimi:{label:'KIMI',accent:'#e7e4ff',layout:'screen'},
  qwen:{label:'QWEN',accent:'#d9caff',layout:'cinematic'},
  perplexity:{label:'PERPLEXITY',accent:'#b4eaf0',layout:'screen'},
  mistral:{label:'MISTRAL',accent:'#ffd3ad',layout:'screen'},
  copilot:{label:'COPILOT',accent:'#bbd8ff',layout:'screen'},
  meta:{label:'META AI',accent:'#a8caff',layout:'cinematic'},
  sora:{label:'SORA',accent:'#f7f7f8',layout:'cinematic'},
};

const SourceShot: React.FC<{shot:Shot}> = ({shot}) => {
  const frame=useCurrentFrame();
  const length=Math.round((shot.end-shot.start)*FPS);
  const id=identities[shot.model];
  const progress=interpolate(frame,[0,length],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const alpha=interpolate(frame,[0,Math.min(7,length*.25),Math.max(8,length-4),length],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const first=shot.start===0;
  const last=shot.end===35.60;
  return <AbsoluteFill style={{backgroundColor:'#060608',overflow:'hidden'}}>
    <OffthreadVideo
      src={staticFile('ai-era-expanded/'+shot.model+'.mp4')}
      muted
      startFrom={Math.round(shot.inAt*FPS)}
      style={{width:'100%',height:'100%',objectFit:id.layout==='screen'?'contain':'cover',transform:'scale('+(1+0.035*progress)+')',filter:'contrast(1.13) saturate(1.13)'}}
    />
    <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(0,0,0,.30),transparent 30%,transparent 57%,rgba(0,0,0,.80))',pointerEvents:'none'}}/>
    <AbsoluteFill style={{boxShadow:'inset 0 0 175px rgba(0,0,0,.52)',pointerEvents:'none'}}/>
    <div style={{position:'absolute',bottom:298,left:62,right:62,fontFamily:'Arial,Helvetica,sans-serif',fontWeight:900,fontSize:78,letterSpacing:-2.4,lineHeight:1.05,color:id.accent,textShadow:'0 7px 35px rgba(0,0,0,.95)',opacity:alpha}}>
      {id.label}
    </div>
    {first && <div style={{position:'absolute',top:176,left:62,color:'#fff',fontSize:50,fontWeight:900,letterSpacing:1,fontFamily:'Arial,Helvetica,sans-serif',opacity:alpha,textShadow:'0 3px 24px #000'}}>THE AI ERA</div>}
    {last && <div style={{position:'absolute',top:200,left:62,right:62,color:'#fff',fontSize:58,fontWeight:900,letterSpacing:-2,fontFamily:'Arial,Helvetica,sans-serif',opacity:alpha,textShadow:'0 3px 30px #000'}}>ONLY THE BEGINNING.</div>}
  </AbsoluteFill>;
};

export const AIEraAllAgents:React.FC = () => <AbsoluteFill style={{backgroundColor:'#000'}}>
  {shots.map((shot,i)=>{
    const from=Math.round(shot.start*FPS);
    const to=Math.round(shot.end*FPS);
    return <Sequence from={from} durationInFrames={to-from} key={i}><SourceShot shot={shot}/></Sequence>;
  })}
  <Audio src={staticFile('ai-era-expanded/audio.mp3')}/>
</AbsoluteFill>;
