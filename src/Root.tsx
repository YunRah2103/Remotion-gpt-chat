import React from 'react';
import {Composition} from 'remotion';
import {GpuDriveFilm} from './GpuDriveFilm';
import {TurboDocumentary} from './TurboDocumentary';
import {CaptionedGpuDriveFilm, CaptionedTurboDocumentary} from './ProductionCaptions';
import {StudioMaterialProof} from './studio/StudioMaterialProof';

export const VideoRoot=()=> <>
  <Composition id="GpuDriveFilm" component={GpuDriveFilm} width={1080} height={1920} fps={30} durationInFrames={180}/>
  <Composition id="TurboDocumentary" component={TurboDocumentary} width={1080} height={1920} fps={30} durationInFrames={840}/>
  <Composition id="GpuDriveFilmCaptioned" component={CaptionedGpuDriveFilm} defaultProps={{words: [], enabled:true}} width={1080} height={1920} fps={30} durationInFrames={180}/>
  <Composition id="TurboDocumentaryCaptioned" component={CaptionedTurboDocumentary} defaultProps={{words: [], enabled:true}} width={1080} height={1920} fps={30} durationInFrames={840}/>
  <Composition id="StudioMaterialProof" component={StudioMaterialProof} width={1080} height={1920} fps={30} durationInFrames={150}/>
</>;
