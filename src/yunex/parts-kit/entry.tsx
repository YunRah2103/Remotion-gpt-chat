import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { PartPreview, PartsFamilyReel, PartsCatalogue } from './Preview';
const PartsRoot: React.FC = () => <>
 <Composition id="PartPreview" component={PartPreview} durationInFrames={180} fps={30} width={1920} height={1080} defaultProps={{ variant: 'turbo-small' as const, cutaway: false, explode: 0, animate: true }}/>
 <Composition id="PartPreviewPortrait" component={PartPreview} durationInFrames={180} fps={30} width={1080} height={1920} defaultProps={{ variant: 'inline-4' as const, cutaway: true, explode: 0, animate: true }}/>
 <Composition id="PartsFamilyReel" component={PartsFamilyReel} durationInFrames={900} fps={30} width={1920} height={1080}/>
 <Composition id="PartsCatalogue" component={PartsCatalogue} durationInFrames={1650} fps={30} width={1920} height={1080}/>
</>;
registerRoot(PartsRoot);
