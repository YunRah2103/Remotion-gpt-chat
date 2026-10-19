import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

/**
 * AI ERA / REAL FOOTAGE MASTER
 *
 * All moving pixels come from the original V4 phone-imported MP4 recordings.
 * No generated backgrounds, stock sci-fi montages, simulated screens, or logo animations.
 * Each source is required: the workflow fails rather than silently substituting placeholders.
 * Soundtrack is the exact user-provided 35.604898-second MP3 (SHA256 documented in README).
 */
export const AI_ERA_FPS = 30;
export const AI_ERA_FRAMES = 1068; // 35.6 seconds

export type AIName = 'gemini' | 'chatgpt' | 'claude' | 'deepseek' | 'grok' | 'kimi' | 'qwen';

type Shot = {
  model: AIName;
  from: number;
  to: number;
  sourceFromSeconds: number;
  focus?: number;
};

export const AI_ERA_SHOTS: Shot[] = [
  {model:'gemini', from:0, to:55, sourceFromSeconds:0.2},
  {model:'chatgpt', from:55, to:122, sourceFromSeconds:0.0},
  {model:'claude', from:122, to:183, sourceFromSeconds:0.2},
  {model:'deepseek', from:183, to:246, sourceFromSeconds:0.2},
  {model:'grok', from:246, to:309, sourceFromSeconds:0.4},
  {model:'kimi', from:309, to:374, sourceFromSeconds:0.2},
  {model:'qwen', from:374, to:439, sourceFromSeconds:0.2},
  {model:'gemini', from:439, to:510, sourceFromSeconds:4.0},
  {model:'chatgpt', from:510, to:582, sourceFromSeconds:4.0},
  {model:'claude', from:582, to:644, sourceFromSeconds:3.5},
  {model:'grok', from:644, to:713, sourceFromSeconds:4.3},
  {model:'kimi', from:713, to:785, sourceFromSeconds:4.0},
  {model:'deepseek', from:785, to:859, sourceFromSeconds:4.0},
  {model:'qwen', from:859, to:915, sourceFromSeconds:6.0},
  // Seven genuine moving source clips, rapidly cut on the final music phrase.
  {model:'chatgpt', from:915, to:936, sourceFromSeconds:9.0},
  {model:'claude', from:936, to:957, sourceFromSeconds:9.0},
  {model:'gemini', from:957, to:978, sourceFromSeconds:10.0},
  {model:'kimi', from:978, to:999, sourceFromSeconds:10.0},
  {model:'grok', from:999, to:1020, sourceFromSeconds:10.0},
  {model:'deepseek', from:1020, to:1041, sourceFromSeconds:10.0},
  {model:'qwen', from:1041, to:1068, sourceFromSeconds:11.0},
];

const BRAND: Record<AIName, {name: string; accent: string; fit:'cover'|'contain'}> = {
  chatgpt: {name:'CHATGPT', accent:'#e9fff7', fit:'cover'},
  claude: {name:'CLAUDE', accent:'#ffd9c6', fit:'contain'},
  gemini: {name:'GEMINI', accent:'#d3e2ff', fit:'cover'},
  deepseek: {name:'DEEPSEEK', accent:'#a8bcff', fit:'contain'},
  grok: {name:'GROK', accent:'#f9f9f9', fit:'contain'},
  kimi: {name:'KIMI', accent:'#d9d3ff', fit:'cover'},
  qwen: {name:'QWEN', accent:'#dec7ff', fit:'cover'},
};
const SOURCE: Record<AIName, string> = {
  chatgpt:'chatgpt.mp4',
  claude:'claude.mp4',
  gemini:'gemini.mp4',
  deepseek:'deepseek.mp4',
  grok:'grok.mp4',
  kimi:'kimi.mp4',
  qwen:'qwen.mp4',
};

const RealShot: React.FC<{shot:Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const duration = shot.to - shot.from;
  const name = BRAND[shot.model];
  // Restrained finishing: small name ID over real footage; no synthetic imagery.
  const titleOpacity = interpolate(f, [0, Math.min(8,duration*.2),duration-4,duration], [0,1,1,0], {extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const zoom = interpolate(f,[0,duration],[1.0,1.045],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return (
    <AbsoluteFill style={{overflow:'hidden',backgroundColor:'#000'}}>
      <OffthreadVideo
        muted
        src={staticFile('ai-era/'+SOURCE[shot.model])}
        startFrom={Math.round(shot.sourceFromSeconds * AI_ERA_FPS)}
        style={{
          width:'100%',height:'100%',
          objectFit:name.fit,
          transform:`scale(${zoom})`,
          filter:'contrast(1.08) saturate(1.08)',
        }}
      />
      <AbsoluteFill style={{
        background:'linear-gradient(to bottom, rgba(0,0,0,0.12), transparent 22%, transparent 61%, rgba(0,0,0,0.68))',
        pointerEvents:'none',
      }}/>
      <div style={{
        position:'absolute',left:64,bottom:260,
        fontFamily:'Arial, Helvetica, sans-serif',fontSize:86,
        fontWeight:900,lineHeight:1.02,letterSpacing:-3,
        color:name.accent,textShadow:'0 4px 24px rgba(0,0,0,0.9)',
        opacity:titleOpacity,
      }}>{name.name}</div>
    </AbsoluteFill>
  );
};

export const AIEraRealFootage: React.FC = () => (
  <AbsoluteFill style={{backgroundColor:'#000'}}>
    {AI_ERA_SHOTS.map((shot,i)=> (
      <Sequence from={shot.from} durationInFrames={shot.to-shot.from} key={i}>
        <RealShot shot={shot}/>
      </Sequence>
    ))}
    <Audio src={staticFile('ai-era/audio.mp3')}/>
  </AbsoluteFill>
);
