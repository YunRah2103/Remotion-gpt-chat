import React from 'react';
import {PorscheTurboMaster} from './porsche-turbo-evolution/integration/PorscheTurboMaster';
import {IntegratedPorscheFilm} from './porsche-turbo-evolution/integration/IntegratedPorscheFilm';
import {FXShowcase} from './fx/FXShowcase';
import {M5EvolutionFilm} from './bmw-m5-evolution/M5EvolutionFilm';
import {M5EvolutionCleanFilm} from './bmw-m5-evolution/M5EvolutionCleanFilm';
import {Composition} from 'remotion';
import {GpuDriveFilm} from './GpuDriveFilm';
import {TurboDocumentary} from './TurboDocumentary';
import {CaptionedGpuDriveFilm, CaptionedTurboDocumentary} from './ProductionCaptions';
import {StudioMaterialProof} from './studio/StudioMaterialProof';
import {TwoVersionFilm} from './advanced/TwoVersionFilm';
import {AutomotivePhotoCollage001} from './AutomotivePhotoCollage001';
import {AutomotiveVideoCollage001} from './AutomotiveVideoCollage001';

export const VideoRoot=()=> <>
  <Composition id="GpuDriveFilm" component={GpuDriveFilm} width={1080} height={1920} fps={30} durationInFrames={180}/>
  <Composition id="TurboDocumentary" component={TurboDocumentary} width={1080} height={1920} fps={30} durationInFrames={840}/>
  <Composition id="GpuDriveFilmCaptioned" component={CaptionedGpuDriveFilm} defaultProps={{words: [], enabled:true}} width={1080} height={1920} fps={30} durationInFrames={180}/>
  <Composition id="TurboDocumentaryCaptioned" component={CaptionedTurboDocumentary} defaultProps={{words: [], enabled:true}} width={1080} height={1920} fps={30} durationInFrames={840}/>
  <Composition id="StudioMaterialProof" component={StudioMaterialProof} width={1080} height={1920} fps={30} durationInFrames={150}/>
  <Composition id="EngineeringDualVersion" component={TwoVersionFilm} width={1080} height={1920} fps={30} durationInFrames={750} defaultProps={{variant:"studio" as const}}/>
  <Composition id="AutomotivePhotoCollage001" component={AutomotivePhotoCollage001} width={1080} height={1920} fps={30} durationInFrames={600}/>
  <Composition id="AutomotiveVideoCollage001" component={AutomotiveVideoCollage001} width={1080} height={1920} fps={30} durationInFrames={600}/>
  <Composition id="AutomotiveFXShowcase" component={FXShowcase} width={1080} height={1920} fps={30} durationInFrames={220}/>
  <Composition id="PorscheTurboEvolution001" component={IntegratedPorscheFilm} width={1080} height={1920} fps={30} durationInFrames={510} defaultProps={{mode:"diagnostic" as const,shots:[]}}/>
  <Composition id="PorscheTurboDPreflight" component={PorscheTurboMaster} width={1080} height={1920} fps={30} durationInFrames={510} defaultProps={{mode:"diagnostic" as const,shots:[]}}/>
  <Composition id="M5EvolutionPrivate" component={M5EvolutionFilm} width={1080} height={1920} fps={30} durationInFrames={552} defaultProps={{mode:"diagnostic" as const,shots:[]}}/>
  <Composition id="M5EvolutionCleanV2" component={M5EvolutionCleanFilm} width={1080} height={1920} fps={30} durationInFrames={552} defaultProps={{mode:"diagnostic" as const,shots:[]}}/>
</>;