/** Carbon-Ceramic 001 / Agent D: restrained, transparent, frame-deterministic graphics.
 * No geometry/camera assumptions; the main rotor area stays free of title blocks.
 * Use <TitleOverlays/> and <PartLabels/> as siblings of the main scene inside
 * the 750-frame Remotion composition. Optional frame is for controlled proofs.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import cuePlan from './graphics-cues.json';

export type BrakePartName = 'FrictionRing' | 'RotorHat' | 'CaliperBody' | 'PadInner' | 'PadOuter';
export type ProjectedPartAnchors = Partial<Record<BrakePartName, {x: number; y: number}>>;
export type GraphicsProps = {frame?: number};
export type PartLabelsProps = GraphicsProps & {
  /** Normalised [0,1] screen coordinates; only supply after reviewing actual 3D shots. */
  anchors?: ProjectedPartAnchors;
  /** Disabled by default to avoid a leader pointing to an unverified part. */
  showLeaderLines?: boolean;
};

const design = cuePlan.canvas;
const palette = {
  white: '#f2f7f5', muted: '#c3d4d1', mint: '#91f0ce',
  rule: 'rgba(168,240,213,0.75)', shadow: 'rgba(0,0,0,0.82)',
};
const clamp = (value: number, a: number, b: number) => Math.max(a, Math.min(b, value));
const ease = (t: number) => t * t * (3 - 2 * t);
const opacityAt = (frame: number, start: number, end: number) =>
  ease(clamp((frame - start) / 10, 0, 1)) * ease(clamp((end - frame) / 10, 0, 1));

/** Pure timeline data: safe for frame-by-frame tests without rendering or wall-clock time. */
export const activeGraphicsAt = (frame: number) => ({
  graphics: cuePlan.graphics.filter((entry) => frame >= entry.start && frame <= entry.end),
  labels: cuePlan.labels.filter((entry) => frame >= entry.start && frame <= entry.end),
});

const typography = (kind: string, scalar: number): React.CSSProperties => {
  const title = kind === 'title';
  const headline = kind === 'headline';
  const disclaimer = kind === 'disclaimer';
  return {
    fontFamily: 'Inter, Arial, Helvetica, sans-serif',
    fontSize: (title ? 64 : headline ? 51 : disclaimer ? 19 : 24) * scalar,
    fontWeight: title || headline ? 800 : disclaimer ? 600 : 700,
    lineHeight: title ? 1.13 : 1.2,
    letterSpacing: (title ? -1.7 : headline ? -1.2 : disclaimer ? 2 : 2.4) * scalar,
    whiteSpace: 'pre-line',
    color: disclaimer ? palette.muted : palette.white,
    textShadow: '0 2px ' + 13 * scalar + 'px ' + palette.shadow,
    textTransform: 'uppercase',
  };
};

export const TitleOverlays: React.FC<GraphicsProps> = ({frame: specifiedFrame}) => {
  const nativeFrame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const frame = specifiedFrame ?? nativeFrame;
  const sx = width / design.width;
  const sy = height / design.height;
  const fontScale = Math.min(sx, sy);

  return <AbsoluteFill style={{zIndex: 40, pointerEvents: 'none', backgroundColor: 'transparent'}}>
    {cuePlan.graphics.map((entry) => {
      const alpha = opacityAt(frame, entry.start, entry.end);
      if (alpha <= 0) return null;
      const isDisclaimer = entry.kind === 'disclaimer';
      return <div key={entry.id} data-overlay-id={entry.id} style={{
        position: 'absolute',
        top: entry.y * sy, left: entry.x * sx, width: entry.width * sx,
        opacity: alpha,
        transform: 'translateY(' + ((1 - alpha) * 13 * sy) + 'px)',
        ...typography(entry.kind, fontScale),
      }}>
        {isDisclaimer && <span style={{display:'inline-block', width: 19 * sx,
          borderTop: (2 * fontScale) + 'px solid ' + palette.mint,
          marginRight: 12 * sx, verticalAlign: 'middle'}} />}
        {entry.text}
      </div>;
    })}
  </AbsoluteFill>;
};

export const PartLabels: React.FC<PartLabelsProps> = ({
  frame: specifiedFrame, anchors, showLeaderLines = false,
}) => {
  const nativeFrame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const frame = specifiedFrame ?? nativeFrame;
  const sx = width / design.width;
  const sy = height / design.height;
  const scale = Math.min(sx, sy);
  const labelEntries = cuePlan.labels;
  return <AbsoluteFill style={{zIndex: 41, pointerEvents:'none', backgroundColor:'transparent'}}>
    {labelEntries.map((item) => {
      const alpha = opacityAt(frame, item.start, item.end);
      if (alpha <= 0) return null;
      const leftSide = item.side === 'left';
      const x = (leftSide ? 76 : 646) * sx;
      const y = (item.row === 0 ? 1230 : 1360) * sy;
      const w = 285 * sx;
      const partName = item.part.split(',')[0] as BrakePartName;
      const anchor = anchors?.[partName];
      const safeAnchor = anchor && [anchor.x,anchor.y].every(Number.isFinite) &&
        anchor.x >= 0.05 && anchor.x <= 0.86 && anchor.y >= 0.15 && anchor.y <= 0.78;
      const leader = showLeaderLines && safeAnchor && anchor;
      return <React.Fragment key={item.id}>
        {leader && <svg aria-hidden="true" width={width} height={height}
          viewBox={'0 0 ' + width + ' ' + height} style={{position:'absolute',top:0,left:0,opacity:alpha}}>
          <path d={'M '+(leftSide ? x+w : x)+' '+(y+8*sy)+' L '+(anchor.x*width)+' '+(anchor.y*height)}
            fill="none" stroke={palette.rule} strokeWidth={1.3 * scale} />
          <circle cx={anchor.x*width} cy={anchor.y*height} r={3.5*scale} fill={palette.mint}/>
        </svg>}
        <div data-brake-part={item.part} style={{position:'absolute',left:x,top:y,width:w,
          boxSizing:'border-box',borderTop:(2*scale)+'px solid '+palette.rule,
          paddingTop: 13*sy, opacity:alpha,
          transform:'translateY('+((1-alpha)*9*sy)+'px)',
          color:palette.white, fontFamily:'Inter, Arial, Helvetica, sans-serif',
          textShadow:'0 2px '+(9*scale)+'px '+palette.shadow,
          fontSize:23*scale,fontWeight:700,lineHeight:1.2,letterSpacing:0.6*scale,
        }}>{item.text}</div>
      </React.Fragment>;
    })}
  </AbsoluteFill>;
};
