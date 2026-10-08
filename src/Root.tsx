import React from 'react';
import {Composition} from 'remotion';
import {GpuDriveFilm} from './GpuDriveFilm';
import {TurboDocumentary} from './TurboDocumentary';
import {GpuDecomposition} from './GpuDecomposition';
import {GpuDecompositionPolish5} from './gpu-polish5/GpuDecompositionPolish5';
import {GpuDecompositionPolish5CinemaTest} from './gpu-polish5/GpuDecompositionPolish5CinemaTest';

export const VideoRoot=()=> <>
  <Composition id="GpuDriveFilm" component={GpuDriveFilm} width={1080} height={1920} fps={30} durationInFrames={180}/>
  <Composition id="TurboDocumentary" component={TurboDocumentary} width={1080} height={1920} fps={30} durationInFrames={840}/>
  <Composition id="XfxSwiftPolish5CinemaTest" component={GpuDecompositionPolish5CinemaTest} width={1080} height={1920} fps={30} durationInFrames={450}/>
  <Composition id="XfxSwiftDecompositionPolish5" component={GpuDecompositionPolish5} width={1080} height={1920} fps={30} durationInFrames={450}/>
  <Composition id="XfxSwiftDecomposition" component={GpuDecomposition} width={1080} height={1920} fps={30} durationInFrames={450}/>
</>;
