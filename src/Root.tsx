import React from 'react';
import {Composition} from 'remotion';
import {GpuDriveFilm} from './GpuDriveFilm';
import {TurboDocumentary} from './TurboDocumentary';
import {CaptionedGpuDriveFilm, CaptionedTurboDocumentary} from './ProductionCaptions';
import {StudioMaterialProof} from './studio/StudioMaterialProof';
import {TwoVersionFilm} from './advanced/TwoVersionFilm';
import {CarbonCeramic001} from './brakes001/CarbonCeramic001';
import {BrakePadMacroProof} from './brakes001/integration/BrakePadMacroProof';

export const VideoRoot=()=> <>
  <Composition id="GpuDriveFilm" component={GpuDriveFilm} width={1080} height={1920} fps={30} durationInFrames={180}/>
  <Composition id="TurboDocumentary" component={TurboDocumentary} width={1080} height={1920} fps={30} durationInFrames={840}/>
  <Composition id="GpuDriveFilmCaptioned" component={CaptionedGpuDriveFilm} defaultProps={{words: [], enabled:true}} width={1080} height={1920} fps={30} durationInFrames={180}/>
  <Composition id="TurboDocumentaryCaptioned" component={CaptionedTurboDocumentary} defaultProps={{words: [], enabled:true}} width={1080} height={1920} fps={30} durationInFrames={840}/>
  <Composition id="StudioMaterialProof" component={StudioMaterialProof} width={1080} height={1920} fps={30} durationInFrames={150}/>
  <Composition id="EngineeringDualVersion" component={TwoVersionFilm} width={1080} height={1920} fps={30} durationInFrames={750} defaultProps={{variant:"studio" as const}}/>
  <Composition id="CarbonCeramic001" component={CarbonCeramic001} width={1080} height={1920} fps={30} durationInFrames={750}/>
  <Composition id="BrakePadMacro001" component={BrakePadMacroProof} width={1080} height={1920} fps={30} durationInFrames={61}/>
</>;
