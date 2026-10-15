import {registerRoot} from 'remotion';
import React from 'react';
import {Composition} from 'remotion';
import {AttesaVoxelFilm} from './AttesaVoxelFilm';

// Standalone entry to avoid touching unrelated, released compositions.
const AttesaRoot:React.FC=()=>(
 <Composition id="AttesaVoxelFilm" component={AttesaVoxelFilm}
  width={1080} height={1920} fps={30} durationInFrames={814}
  defaultProps={{withVoiceover:false}}/>
);
registerRoot(AttesaRoot);
