import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

/**
 * Non-destructive optical overlap for two already time-aligned clips.
 * Render inside a Remotion Sequence lasting durationInFrames. Never alters audio.
 * These are intentionally restrained: match cuts first, effects only where useful.
 */
export type YunexTransitionKind = 'dissolve' | 'whip' | 'soft-flash';

export const CinematicTransition: React.FC<{
  outgoing: React.ReactNode;
  incoming: React.ReactNode;
  durationInFrames: number;
  kind?: YunexTransitionKind;
}> = ({outgoing, incoming, durationInFrames, kind = 'dissolve'}) => {
  const frame = useCurrentFrame();
  const frames = Math.max(2, Math.floor(durationInFrames));
  const t = interpolate(frame, [0, frames - 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const whip = kind === 'whip';
  const outgoingTransform = whip ? 'translateX(' + (-14*t) + '%) scale(1.035)' : undefined;
  const incomingTransform = whip ? 'translateX(' + (14*(1-t)) + '%) scale(1.035)' : undefined;
  const flashOpacity = kind === 'soft-flash'
    ? Math.pow(Math.sin(Math.PI*t), 8) * 0.28 : 0;

  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <AbsoluteFill style={{
      opacity: 1-t,
      transform: outgoingTransform,
      filter: whip ? 'blur(' + (3*t) + 'px)' : undefined,
    }}>{outgoing}</AbsoluteFill>
    <AbsoluteFill style={{
      opacity: t,
      transform: incomingTransform,
      filter: whip ? 'blur(' + (3*(1-t)) + 'px)' : undefined,
    }}>{incoming}</AbsoluteFill>
    {flashOpacity > 0 && <AbsoluteFill style={{
      backgroundColor: 'white', opacity: flashOpacity, pointerEvents: 'none',
    }}/>}
  </AbsoluteFill>;
};
