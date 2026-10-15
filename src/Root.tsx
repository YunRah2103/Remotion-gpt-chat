import React from 'react';
import {ChironFourTurbosFilm} from './yunex/ChironFourTurbosFilm';
import {GtrAttesaFilm} from './yunex/GtrAttesaFilm';
import {Composition} from 'remotion';
import {GpuDriveFilm} from './GpuDriveFilm';
import {TurboDocumentary} from './TurboDocumentary';
import {CaptionedGpuDriveFilm, CaptionedTurboDocumentary} from './ProductionCaptions';
import {StudioMaterialProof} from './studio/StudioMaterialProof';
import {TwoVersionFilm} from './advanced/TwoVersionFilm';

export const VideoRoot=()=> <>
  <Composition id="ChironFourTurbosFilm" component={ChironFourTurbosFilm} width={1080} height={1920} fps={30} durationInFrames={870} defaultProps={{includeVoice:false,includeMusic:false}}/>
  <Composition id="GtrAttesaFilm" component={GtrAttesaFilm} width={1920} height={1080} fps={30} durationInFrames={825} defaultProps={{includeVoice:false,includeMusic:false}}/>
  <Composition id="GpuDriveFilm" component={GpuDriveFilm} width={1080} height={1920} fps={30} durationInFrames={180}/>
  <Composition id="TurboDocumentary" component={TurboDocumentary} width={1080} height={1920} fps={30} durationInFrames={840}/>
  <Composition id="GpuDriveFilmCaptioned" component={CaptionedGpuDriveFilm} defaultProps={{words: [], enabled:true}} width={1080} height={1920} fps={30} durationInFrames={180}/>
  <Composition id="TurboDocumentaryCaptioned" component={CaptionedTurboDocumentary} defaultProps={{words: [], enabled:true}} width={1080} height={1920} fps={30} durationInFrames={840}/>
  <Composition id="StudioMaterialProof" component={StudioMaterialProof} width={1080} height={1920} fps={30} durationInFrames={150}/>
  <Composition id="EngineeringDualVersion" component={TwoVersionFilm} width={1080} height={1920} fps={30} durationInFrames={750} defaultProps={{variant:"studio" as const}}/>
</>;
