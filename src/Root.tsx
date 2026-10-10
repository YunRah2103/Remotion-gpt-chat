import React from 'react';
import {Composition} from 'remotion';
import {GpuDriveFilm} from './GpuDriveFilm';
import {TurboDocumentary} from './TurboDocumentary';
import {CaptionedGpuDriveFilm, CaptionedTurboDocumentary} from './ProductionCaptions';
import {StudioMaterialProof} from './studio/StudioMaterialProof';
import {TwoVersionFilm} from './advanced/TwoVersionFilm';
import {HuracanStoFilm} from './huracan/HuracanStoFilm';

export const VideoRoot=()=> <>
  <Composition id="GpuDriveFilm" component={GpuDriveFilm} width={1080} height={1920} fps={30} durationInFrames={180}/>
  <Composition id="TurboDocumentary" component={TurboDocumentary} width={1080} height={1920} fps={30} durationInFrames={840}/>
  <Composition id="GpuDriveFilmCaptioned" component={CaptionedGpuDriveFilm} defaultProps={{words: [], enabled:true}} width={1080} height={1920} fps={30} durationInFrames={180}/>
  <Composition id="TurboDocumentaryCaptioned" component={CaptionedTurboDocumentary} defaultProps={{words: [], enabled:true}} width={1080} height={1920} fps={30} durationInFrames={840}/>
  <Composition id="StudioMaterialProof" component={StudioMaterialProof} width={1080} height={1920} fps={30} durationInFrames={150}/>
  <Composition id="EngineeringDualVersion" component={TwoVersionFilm} width={1080} height={1920} fps={30} durationInFrames={750} defaultProps={{variant:"studio" as const}}/>
  <Composition id="HuracanSTOLandscapeCandidate" component={HuracanStoFilm} defaultProps={{mode:"candidate" as const}} width={1920} height={1080} fps={30} durationInFrames={316}/>
  <Composition id="HuracanSTOLandscapeRelease" component={HuracanStoFilm} defaultProps={{mode:"release" as const}} width={1920} height={1080} fps={30} durationInFrames={316}/>
</>;
