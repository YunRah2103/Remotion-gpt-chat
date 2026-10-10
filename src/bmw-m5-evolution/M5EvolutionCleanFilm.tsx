import React, {useMemo} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import type {M5EvolutionFilmProps} from './M5EvolutionFilm';
import {assertBeatMap, BEATS, DURATION, FPS, type BeatSlot, type M5Shot, type TimelineShot, validateM5Shots} from './timeline';

/**
 * BMW M5 Evolution V2 — footage-first vertical TikTok cut.
 * The ONLY released on-screen typography is a little white generation code
 * (E28/E34/E39/E60/F10/F90/G90), upper left, snapping on the era boundary.
 * No borders, HUD, title blocks, years, strips, counters or accent lines.
 *
 * Native 720x576 archive cannot be made real 4K. The unbordered moving
 * picture field retains car visibility while a dark, defocused source
 * continuation fills the 9:16 background.
 *
 * Private sound is muxed out of band; never commit the supplied WAV.
 */
const FilmShot: React.FC<{beat: BeatSlot; shot?: M5Shot}> = ({beat,shot}) => {
  if (!shot) return <AbsoluteFill style={{background:'#0b1015'}}>
    <div style={{position:'absolute',top:600,left:80,color:'#f5d095',font:'bold 38px Arial'}}>
      DIAGNOSTIC / NO VERIFIED BMW FOOTAGE
    </div>
    <div style={{position:'absolute',top:690,left:80,color:'#f5d095',font:'28px Arial'}}>
      SLOT {beat.slot} / 42
    </div>
  </AbsoluteFill>;

  const videoSrc=staticFile(shot.file);
  const offset=Math.round(shot.inSeconds*FPS);
  const position=`${shot.x??50}% ${shot.y??50}%`;
  return <AbsoluteFill style={{background:'#090d12',overflow:'hidden'}}>
    <OffthreadVideo src={videoSrc} trimBefore={offset} muted style={{
      position:'absolute',top:-90,left:-90,width:1260,height:2100,
      objectFit:'cover',objectPosition:position,
      filter:'blur(56px) brightness(.38) saturate(.78)'
    }}/>
    <OffthreadVideo src={videoSrc} trimBefore={offset} muted style={{
      position:'absolute',left:0,top:502,width:1080,height:916,
      objectFit:'cover',objectPosition:position,
      WebkitMaskImage:'linear-gradient(180deg,transparent 0%,#000 8%,#000 92%,transparent 100%)',
      maskImage:'linear-gradient(180deg,transparent 0%,#000 8%,#000 92%,transparent 100%)'
    }}/>
  </AbsoluteFill>;
};
const CleanSlot: React.FC<{beat:BeatSlot; shot?:M5Shot}> = ({beat,shot}) =>
  <AbsoluteFill>
    <FilmShot beat={beat} shot={shot}/>
    <div style={{
      position:'absolute',top:145,left:70,
      color:'#fff',font:'500 42px Arial,sans-serif',letterSpacing:0,
      background:'none',border:'none',textShadow:'none'
    }}>{beat.generation}</div>
  </AbsoluteFill>;

export const M5EvolutionCleanFilm: React.FC<M5EvolutionFilmProps> = ({mode,shots=[]}) => {
  const timeline=useMemo(()=>{
    assertBeatMap();
    return mode==='production'?validateM5Shots(shots):BEATS;
  },[mode,shots]);
  return <AbsoluteFill style={{background:'#070a0e'}}>
    {timeline.map(beat=><Sequence key={beat.slot} from={beat.startFrame}
      durationInFrames={beat.durationFrames} layout="none">
      <CleanSlot beat={beat} shot={mode==='production'?(beat as TimelineShot).asset:undefined}/>
    </Sequence>)}
  </AbsoluteFill>;
};

export const M5EvolutionCleanParameters={durationInFrames:DURATION,fps:FPS,width:1080,height:1920} as const;
