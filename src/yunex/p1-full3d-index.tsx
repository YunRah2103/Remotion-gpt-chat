import React from 'react';
import {registerRoot, Composition} from 'remotion';
import {P1Full3DFilm} from './P1Full3DFilm';

const P1Full3DRoot:React.FC=()=> <Composition
  id="P1Full3DExperiment001" component={P1Full3DFilm}
  durationInFrames={540} fps={30} width={1080} height={1920}/> ;

registerRoot(P1Full3DRoot);
