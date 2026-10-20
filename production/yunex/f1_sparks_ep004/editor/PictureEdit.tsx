/**
 * Agent 6 picture compositor. Wiring to visual departments is deliberately
 * injected by Agent 0 after their source clips pass the integration gate.
 * No mock Three scene, substitute narration, or still-video fallback exists.
 */
import React from 'react';
import {AbsoluteFill, Audio, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ShotId} from '../shared/contract.ts';
import {
  CAPTION_MAX_WIDTH_PX,
  CAPTION_SAFE_BOTTOM_PX,
  captionAtFrame,
  shotAtFrame,
  missingPicturePrerequisites,
  type ReadinessInput,
  type PicturePlan,
} from './timing.ts';

export type VisualShotProps = Readonly<{
  shot: ShotId;
  globalFrame: number;
  globalSec: number;
  shotLocalSec: number;
  shotDurationSec: number;
  sourceWordIndex: number;
}>;

export type EditProps = Readonly<{
  plan: PicturePlan;
  readiness: ReadinessInput;
  showCaptions?: boolean;
}>;

/**
 * Once visual sources are approved, Agent 0 injects ONE integrated scene
 * component here. That component samples official Agent 2 absolute-time
 * dynamics and calls actual Agent 1/3/4/5 visual exports.
 */
export function makeEP004PictureEdit(IntegratedVisualShot: React.ComponentType<VisualShotProps>) {
  function EP004PictureEdit({plan, readiness, showCaptions = true}: EditProps) {
    const missing = missingPicturePrerequisites(readiness);
    if (missing.length > 0) {
      throw new Error('EP004 picture render blocked: ' + missing.join('; '));
    }
    const frame = useCurrentFrame();
    const config = useVideoConfig();
    if (config.width !== 1080 || config.height !== 1920 || config.fps !== 30 ||
        config.durationInFrames !== plan.totalFrames) {
      throw new Error('EP004 editor: composition must match actual VO-derived 1080x1920 30fps length');
    }
    const cut = shotAtFrame(frame, plan.cuts);
    const caption = showCaptions ? captionAtFrame(frame, plan.captions) : null;
    const activeTime = frame / config.fps;
    const wordIndex = caption?.wordIndices.find(i => {
      const word = plan.words[i];
      return activeTime >= word.startSec && activeTime < word.endSec;
    });
    return (
      <AbsoluteFill style={{backgroundColor: '#06080c', overflow: 'hidden'}}>
        <IntegratedVisualShot
          shot={cut.shot}
          globalFrame={frame}
          globalSec={activeTime}
          shotLocalSec={(frame - cut.startFrame) / config.fps}
          shotDurationSec={cut.durationFrames / config.fps}
          sourceWordIndex={cut.sourceWordIndex}
        />
        <Audio src={plan.audioSrc} volume={1} />
        {caption && (
          <AbsoluteFill style={{pointerEvents: 'none'}}>
            <div style={{
              position: 'absolute',
              bottom: CAPTION_SAFE_BOTTOM_PX,
              left: '50%',
              transform: 'translateX(-50%)',
              width: CAPTION_MAX_WIDTH_PX,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 13,
              padding: '14px 22px',
              borderRadius: 16,
              backgroundColor: 'rgba(7, 11, 17, 0.66)',
              textAlign: 'center',
              fontFamily: 'Inter, Arial, Helvetica, sans-serif',
              fontSize: 54,
              lineHeight: 1.2,
              fontWeight: 800,
              letterSpacing: '-0.7px',
              textShadow: '0 3px 8px rgba(0,0,0,0.8)',
              boxSizing: 'border-box',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              {caption.wordIndices.map(i => (
                <span key={i} style={{
                  color: i === wordIndex ? '#ffe6b0' : '#fff',
                }}>{plan.words[i].text}</span>
              ))}
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    );
  }
  return EP004PictureEdit;
}
