import React from 'react';
import {Composition} from 'remotion';
import {GpuDriveFilm} from './GpuDriveFilm';
import {TurboDocumentary} from './TurboDocumentary';
import {IceCubeNeutrinos90} from './IceCubeNeutrinos90';
import {IceCubeOpeningProof} from './IceCubeOpeningProof';

export const VideoRoot=()=> <>
  <Composition id="GpuDriveFilm" component={GpuDriveFilm} width={1080} height={1920} fps={30} durationInFrames={180}/>
  <Composition id="TurboDocumentary" component={TurboDocumentary} width={1080} height={1920} fps={30} durationInFrames={840}/>
  <Composition id="IceCubeOpeningProof" component={IceCubeOpeningProof} width={1080} height={1920} fps={30} durationInFrames={450}/>
  <Composition id="IceCubeNeutrinos90" component={IceCubeNeutrinos90} width={1080} height={1920} fps={30} durationInFrames={2700}/>
</>;
