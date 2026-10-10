import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

// 39 actual BMW M5 G90 SALOON driving/video close-up clips, each one separately
// decoded and SHA256-verified against Agent A's PRIVATE REVIEW artifact.
// No on-screen titles, logos, text, type effects or public audio anywhere.
export const BEAT_FRAMES = [
  0,16,31,47,62,78,93,109,124,139,155,171,187,202,217,233,
  249,264,279,295,311,326,341,357,373,388,403,419,435,450,
  465,481,497,512,527,543,559,574,589,
] as const;
export const FILM_FRAMES = 600;
export const FILM_FPS = 30;

// Crop data is calculated from actual bright-green G90 car pixels on the
// centre frame of each verified moving clip. Avoid blind centred crops.
const FOCUS = [
  67,85,52,36,69,46,35,66,15,50,41,20,33,11,34,46,66,100,20,32,
  54,25,22,23,88,12,51,53,73,80,54,24,11,88,0,10,42,42,13,
] as const;
const WHEEL_CLOSEUPS = new Set([2,14,20,26,32]);
const clamp = {extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};

const HeroShot:React.FC<{index:number;length:number}>=({index,length})=>{
  const frame=useCurrentFrame();
  const src=staticFile('bmw-m5-g90-beat/clips/beat-'+String(index+1).padStart(2,'0')+'.mp4');
  const focus=FOCUS[index];
  const near=WHEEL_CLOSEUPS.has(index);
  const h=near?1350:1185;
  const top=(1920-h)/2;
  const activeZoom=interpolate(frame,[0,Math.max(1,length-1)],[1.006,1.018],clamp);
  const jolt=(index%8===0)?interpolate(frame,[0,2,6],[.13,.04,0],clamp):0;

  return <AbsoluteFill style={{backgroundColor:'#05090d',overflow:'hidden'}}>
    {/* Colour and parallax beyond a widescreen source's usable vertical FOV.
        These are additional frames from THIS exact car video, not new imagery. */}
    <AbsoluteFill style={{overflow:'hidden'}}>
      <OffthreadVideo
        src={src}
        muted
        style={{
          position:'absolute',inset:0,width:'100%',height:'100%',
          objectFit:'cover',objectPosition:focus+'% 50%',
          transform:'scale(1.12)',
          filter:'blur(42px) brightness(.49) saturate(.68) contrast(1.15)',
        }}
      />
      <AbsoluteFill style={{
        background:'linear-gradient(180deg,rgba(0,0,0,.27),transparent 31%,transparent 68%,rgba(0,0,0,.45))',
      }}/>
    </AbsoluteFill>
    {/* Image fill has no dead side gutters, moderate 16:9 source cropping,
        softly feathered into a live-motion scene extension above/below. */}
    <div style={{
      position:'absolute',left:0,top,width:1080,height:h,overflow:'hidden',
      WebkitMaskImage:'linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)',
      maskImage:'linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)',
      transform:'scale('+activeZoom+')',
    }}>
      <OffthreadVideo
        src={src}
        muted
        style={{
          display:'block',width:1080,height:h,objectFit:'cover',
          objectPosition:focus+'% 50%',
          filter:'brightness(.985) contrast(1.082) saturate(.96)',
        }}
      />
    </div>
    {/* Extremely restrained downbeat photo-optical flash, no title cards. */}
    {jolt>0&&<AbsoluteFill style={{
      backgroundColor:'#f1f6f4',opacity:jolt,pointerEvents:'none',
    }}/>}
  </AbsoluteFill>;
};

export const BmwM5G90Beat001:React.FC=()=>{
  if(BEAT_FRAMES.length!==39||FOCUS.length!==39){
    throw new Error('39 real G90 shot positions are required');
  }
  return <AbsoluteFill style={{backgroundColor:'#05090d'}}>
    {BEAT_FRAMES.map((start,index)=>{
      const end=index===38?FILM_FRAMES:BEAT_FRAMES[index+1];
      return <Sequence key={index} from={start} durationInFrames={end-start}
        name={'Moving G90 Sedan shot '+String(index+1).padStart(2,'0')}>
        <HeroShot index={index} length={end-start}/>
      </Sequence>;
    })}
  </AbsoluteFill>;
};
