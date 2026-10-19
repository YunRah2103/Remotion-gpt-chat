import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

// Only genuine recorded YouTube source footage imported by Samsung S25 V4.
// Graphics: small typographic identifiers and subtle grade only; no generated shots.
export const EXPANDED_FRAMES = 1068;
const FPS = 30;
type Name = 'atlas'|'chatgpt'|'claude'|'gemini'|'deepseek'|'grok'|'kimi'|'qwen'|'perplexity'|'mistral'|'copilot'|'meta'|'sora';
type Shot = {model:Name; start:number; end:number; inAt:number};
const shots:Shot[] = [
  {model:'atlas',start:0,end:2.68,inAt:0},
  {model:'chatgpt',start:2.68,end:3.65,inAt:0.3},
  {model:'claude',start:3.65,end:4.6,inAt:0.4},
  {model:'gemini',start:4.6,end:6.88,inAt:1},
  {model:'deepseek',start:6.88,end:7.38,inAt:1.2},
  {model:'grok',start:7.38,end:8.36,inAt:1.1},
  {model:'kimi',start:8.36,end:9.29,inAt:2},
  {model:'qwen',start:9.29,end:11.41,inAt:2},
  {model:'perplexity',start:11.41,end:12.57,inAt:3.2},
  {model:'mistral',start:12.57,end:13.94,inAt:2.5},
  {model:'copilot',start:13.94,end:15.87,inAt:3.1},
  {model:'meta',start:15.87,end:17.74,inAt:4.4},
  {model:'sora',start:17.74,end:19.61,inAt:0},
  {model:'atlas',start:19.61,end:21.91,inAt:7.5},
  {model:'chatgpt',start:21.91,end:22.37,inAt:7},
  {model:'claude',start:22.37,end:23.36,inAt:7.8},
  {model:'gemini',start:23.36,end:23.77,inAt:10},
  {model:'deepseek',start:23.77,end:24.3,inAt:8},
  {model:'grok',start:24.3,end:25,inAt:9.4},
  {model:'kimi',start:25,end:26,inAt:9},
  {model:'sora',start:26,end:28.94,inAt:8.1},
  {model:'atlas',start:28.94,end:31.31,inAt:8},
  {model:'chatgpt',start:31.31,end:31.85,inAt:11},
  {model:'claude',start:31.85,end:32.35,inAt:11},
  {model:'gemini',start:32.35,end:32.85,inAt:12},
  {model:'deepseek',start:32.85,end:33.35,inAt:12},
  {model:'grok',start:33.35,end:33.85,inAt:12},
  {model:'kimi',start:33.85,end:34.35,inAt:12},
  {model:'sora',start:34.35,end:34.85,inAt:12.2},
  {model:'atlas',start:34.85,end:35.6,inAt:13},
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
  <Audio src={staticFile('ai-era-expanded/audio.mp3')} volume={0.77}/>
</AbsoluteFill>;
