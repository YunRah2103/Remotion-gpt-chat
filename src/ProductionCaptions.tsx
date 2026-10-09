import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {createTikTokStyleCaptions} from '@remotion/captions';
import type {Caption} from '@remotion/captions';
import {GpuDriveFilm} from './GpuDriveFilm';
import {TurboDocumentary} from './TurboDocumentary';

export type NarrationWord = {start: number; end: number; word: string};
export type CaptionedProps = {words: NarrationWord[]; audioSrc?: string; enabled?: boolean};

export const ProductionCaptionOverlay: React.FC<{words: NarrationWord[]}> = ({words}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pages = useMemo(() => {
    const captions: Caption[] = words.map((w, i) => ({
      text: (i === 0 ? '' : ' ') + w.word.trim(),
      startMs: Math.round(w.start * 1000),
      endMs: Math.round(w.end * 1000),
      timestampMs: null,
      confidence: null,
    }));
    return createTikTokStyleCaptions({
      captions, combineTokensWithinMilliseconds: 1350,
      breakOnSilenceAfterMilliseconds: 170,
    }).pages;
  }, [words]);
  const now = frame * 1000 / fps;
  const page = pages.find((p, i) =>
    now >= p.startMs && now < (pages[i + 1]?.startMs ?? (p.startMs + p.durationMs)));
  if (!page) return null;
  const fade = interpolate(now - page.startMs, [0, 120], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{justifyContent:'flex-end', alignItems:'center',
    paddingBottom:245, pointerEvents:'none', zIndex:100, opacity:fade}}>
    <div style={{maxWidth:'88%', padding:'16px 22px', borderRadius:18,
      backgroundColor:'rgba(5,12,18,0.73)', color:'#fff', fontFamily:'Arial, Helvetica, sans-serif',
      fontWeight:850, fontSize:51, lineHeight:1.22, textAlign:'center',
      textShadow:'0 3px 10px rgba(0,0,0,.85)', whiteSpace:'pre-wrap'}}>
      {page.tokens.map((token,i) => <span key={i} style={{
        color:token.fromMs<=now && now<token.toMs ? '#b4f2d5':'#fff',
      }}>{token.text}</span>)}
    </div>
  </AbsoluteFill>;
};

const Frame: React.FC<CaptionedProps & {film: 'gpu'|'turbo'}> = ({film, words, audioSrc, enabled=true}) => (
  <AbsoluteFill>
    {film === 'gpu' ? <GpuDriveFilm/> : <TurboDocumentary/>}
    {enabled && words.length>0 && <ProductionCaptionOverlay words={words}/>}
    {audioSrc ? <Audio src={staticFile(audioSrc)}/> : null}
  </AbsoluteFill>
);
export const CaptionedGpuDriveFilm:React.FC<CaptionedProps>=(p)=><Frame {...p} film="gpu"/>;
export const CaptionedTurboDocumentary:React.FC<CaptionedProps>=(p)=><Frame {...p} film="turbo"/>;
