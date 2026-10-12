import React from 'react';
import {AbsoluteFill, Composition, OffthreadVideo, Sequence, staticFile} from 'remotion';
import shotmap from '../production/videos/cyber-future-prototypes-001/agent-e/shotmap.json';

/**
 * CYBER//FUTURE 001: Remotion editorial composition.
 * Source footage is downloaded from original A/B/C/D Actions artifacts.
 * Local setup: put clips under public/cyber-future/A,B,C,D as in the shotmap.
 * Exact visually QA'd production proof also has a deterministic FFmpeg renderer
 * in agent-e/render_visual.py. Agent F owns final soundtrack integration.
 */
const SCENES = shotmap.scenes;
const FPS = 30;
const TOTAL = 632;

const SourceVideo: React.FC<{source: string; seek: number; speed: number; fill?: boolean; background?: boolean}> =
({source,seek,speed,fill=true,background=false}) => {
  const letterbox = source.startsWith('A/clips/');
  return <OffthreadVideo
    src={staticFile('cyber-future/' + source)}
    startFrom={Math.round(seek*FPS)}
    playbackRate={speed}
    muted
    style={{
      width: '100%', height: '100%', display: 'block',
      objectFit: fill ? 'cover' : 'contain',
      objectPosition:'center',
      transform:letterbox ? 'scale(1.36)' : undefined,
      filter: background ? 'blur(36px) brightness(0.55) saturate(0.82)' : 'contrast(1.07) saturate(1.10)',
    }}
  />;
};

export const CyberFutureFilm: React.FC = () => <AbsoluteFill style={{backgroundColor:'#06090e'}}>
  {SCENES.map((s) => <Sequence key={s.order} from={s.start_frame} durationInFrames={s.frames}>
    <AbsoluteFill style={{overflow:'hidden'}}>
      {s.reframe === 'full'
        ? <SourceVideo source={s.source} seek={s.source_seek_seconds} speed={s.source_speed}/>
        : <>
          <SourceVideo source={s.source} seek={s.source_seek_seconds} speed={s.source_speed} background/>
          <AbsoluteFill style={{
            top:'30%', height:'40%', bottom:'30%', overflow:'hidden',
            boxShadow:'0 0 75px rgba(0,0,0,0.28)'
          }}>
            <SourceVideo source={s.source} seek={s.source_seek_seconds} speed={s.source_speed} fill={false}/>
          </AbsoluteFill>
        </>}
    </AbsoluteFill>
  </Sequence>)}
</AbsoluteFill>;

export const CyberFutureComposition: React.FC = () =>
  <Composition id="CyberFuture001" component={CyberFutureFilm} width={1080} height={1920} fps={FPS} durationInFrames={TOTAL}/>;
