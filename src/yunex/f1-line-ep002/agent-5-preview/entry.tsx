import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Agent5Preview} from './Preview.tsx';
const Root=()=> <Composition id="F1Agent5GraphicsPreview"
  component={Agent5Preview} fps={30} durationInFrames={210} width={540} height={960}/>;
registerRoot(Root);
