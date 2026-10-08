import React from 'react';
import {Composition} from 'remotion';
import {VectorFilm} from './VectorFilm';
export const VideoRoot=()=> <Composition id="VectorFilm" component={VectorFilm} width={1080} height={1920} fps={30} durationInFrames={270}/>;
