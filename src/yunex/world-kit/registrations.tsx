import {EnvironmentOverview} from './EnvironmentOverview';
import {VehicleQualityReel} from './QualityReel';
import {InteriorPreview,InteriorReel} from './InteriorPreview';
import {PropPreview} from './PropPreview';
import React from 'react';import {Composition,Folder} from 'remotion';
import {VehiclePreview,DrivingPreview,WorldKitReel,EnvironmentReel} from './Showcase';
export const WorldKitCompositions=()=> <Folder name="YUNEX-World-Kit">
 <Composition id="VehicleQualityReel" component={VehicleQualityReel} width={1920} height={1080} fps={30} durationInFrames={630}/>
 <Composition id="VehiclePreview" component={VehiclePreview} width={1920} height={1080} fps={30} durationInFrames={120} defaultProps={{variant:'coupe',angle:.67}}/>
 <Composition id="VehiclePreviewPortrait" component={VehiclePreview} width={1080} height={1920} fps={30} durationInFrames={120} defaultProps={{variant:'saloon',angle:.67}}/>
 <Composition id="DrivingPreview" component={DrivingPreview} width={1920} height={1080} fps={30} durationInFrames={240} defaultProps={{variant:'coupe',environment:'highway' as const,timeOfDay:'day' as const,seed:12}}/>
 <Composition id="DrivingPreviewPortrait" component={DrivingPreview} width={1080} height={1920} fps={30} durationInFrames={240} defaultProps={{variant:'crossover',environment:'city' as const,timeOfDay:'dusk' as const,seed:12}}/>
 <Composition id="WorldKitReel" component={WorldKitReel} width={1920} height={1080} fps={30} durationInFrames={1050}/>
 <Composition id="EnvironmentOverview" component={EnvironmentOverview} width={1920} height={1080} fps={30} durationInFrames={90} defaultProps={{environment:'coast' as const,seed:12,timeOfDay:'day' as const}}/>
 <Composition id="EnvironmentPreview" component={DrivingPreview} width={1920} height={1080} fps={30} durationInFrames={240} defaultProps={{variant:'coupe',environment:'coast' as const,timeOfDay:'day' as const,seed:12,wideView:true}}/>
 <Composition id="EnvironmentReel" component={EnvironmentReel} width={1920} height={1080} fps={30} durationInFrames={600}/>
 <Composition id="PropPreview" component={PropPreview} width={1280} height={720} fps={30} durationInFrames={90} defaultProps={{kind:'cone' as const}}/>
 <Composition id="InteriorPreview" component={InteriorPreview} width={1920} height={1080} fps={30} durationInFrames={150} defaultProps={{variant:'saloon',mode:'cutaway' as const}}/>
 <Composition id="InteriorDriver" component={InteriorPreview} width={1920} height={1080} fps={30} durationInFrames={150} defaultProps={{variant:'saloon',mode:'driver' as const}}/>
 <Composition id="InteriorReel" component={InteriorReel} width={1920} height={1080} fps={30} durationInFrames={180}/>
</Folder>;
