import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {DURATION,FPS,HEIGHT,WIDTH} from './timeline';
import {M5EvolutionFilm} from './M5EvolutionFilm';

export const M5EvolutionPreviewRoot: React.FC = () => (
  <Composition
    id="M5EvolutionDiagnostic"
    component={M5EvolutionFilm}
    fps={FPS}
    durationInFrames={DURATION}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={{mode:'diagnostic' as const, shots:[]}}
  />
);

registerRoot(M5EvolutionPreviewRoot);
