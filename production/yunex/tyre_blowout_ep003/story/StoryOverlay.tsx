import React from 'react';
import type {StoryRequest} from '../shared/contract.ts';
import {sampleStoryVisuals} from './state.ts';

/**
 * Editorially quiet, portrait-safe microtype. Use on top of moving 3D picture;
 * never a permanent banner or a replacement for the vehicle action.
 */
export const StoryOverlay: React.FC<{
  request: StoryRequest;
  /** Keep microtype out of a particular director's shot, if necessary. */
  hideLabel?: boolean;
  placement?: 'top' | 'bottom';
}> = ({request, hideLabel = false, placement = 'bottom'}) => {
  const state = sampleStoryVisuals(request);
  const label = !hideLabel ? state.label : null;
  if (!label) return null;
  const bottom = placement === 'bottom';
  return <div aria-label={label} style={{
    position: 'absolute', pointerEvents: 'none', zIndex: 12,
    inset: 0, display: 'flex', flexDirection: 'column',
    justifyContent: bottom ? 'flex-end' : 'flex-start',
    alignItems: 'flex-start',
    padding: bottom ? '0 7.5% 13.5%' : '13.5% 7.5% 0',
    boxSizing: 'border-box',
    opacity: state.labelOpacity,
    transform: `translateY(${(1 - state.labelOpacity) * 16}px)`
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'linear-gradient(90deg, rgba(15,26,32,.83),rgba(15,26,32,.49))',
      color: '#F4F7F4', fontFamily: 'Arial, Helvetica, sans-serif',
      padding: '17px 22px 16px 17px', borderRadius: 3,
      boxShadow: '0 6px 24px rgba(4,10,15,.14)',
    }}>
      <span style={{display: 'block', width: 3, height: 30, borderRadius: 2,
        background: state.segment === 'pressure' ? '#F1B77B' : '#8CD5D2'}}/>
      <span style={{fontSize: 27, fontWeight: 650, letterSpacing: 2.1,
        lineHeight: 1.2, whiteSpace: 'nowrap'}}>{label}</span>
    </div>
  </div>;
};
